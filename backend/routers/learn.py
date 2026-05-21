"""
AI-powered Learning System endpoints for Campus Connect.

Uses Claude Sonnet 4.5 (via emergentintegrations) to generate:
- Theory explanations (ELI5 + analogy + Mermaid diagram + emoji visual)
- Coding explanations (expected output + step-by-step logic + skeleton code)

Responses are cached in MongoDB to avoid re-hitting the LLM for identical
(subject, topic, question, mode) tuples.
"""
from __future__ import annotations

import hashlib
import json
import logging
import os
import re
from typing import Optional

from fastapi import APIRouter, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field

from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# Pydantic schemas
# -----------------------------------------------------------------------------


class ExplainRequest(BaseModel):
    subject: str = Field(..., description="Subject id, e.g. 'dbms', 'dsa'")
    topic: str = Field(..., description="Topic name, e.g. 'Primary Keys'")
    question: str = Field(..., description="The question text the student is about to answer")
    options: Optional[list[str]] = Field(default=None, description="Optional MCQ options (theory)")


class TheoryExplanation(BaseModel):
    simple_explanation: str
    analogy: str
    mermaid_diagram: str
    emoji_visual: str
    cached: bool = False


class CodingExplanation(BaseModel):
    expected_output: str
    logic_steps: list[str]
    skeleton_code: str
    example_walkthrough: str
    cached: bool = False


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------


def _cache_key(mode: str, subject: str, topic: str, question: str) -> str:
    raw = f"{mode}|{subject.lower().strip()}|{topic.lower().strip()}|{question.strip()}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _extract_json(text: str) -> dict:
    """Extract the first JSON object from a possibly-wrapped LLM response."""
    if not text:
        raise ValueError("Empty LLM response")

    # Strip ```json ... ``` fences if present
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL | re.IGNORECASE)
    if fenced:
        return json.loads(fenced.group(1))

    # Try whole string
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Last resort: find first balanced JSON object
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return json.loads(text[start : end + 1])

    raise ValueError(f"Could not parse JSON from LLM response: {text[:200]}")


def _get_chat(session_id: str, system_message: str) -> LlmChat:
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")
    chat = LlmChat(
        api_key=api_key,
        session_id=session_id,
        system_message=system_message,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")
    return chat


# -----------------------------------------------------------------------------
# Prompts
# -----------------------------------------------------------------------------

THEORY_SYSTEM = """You are a friendly, world-class teacher for college students preparing for placements.
You explain technical concepts as if to a curious 2-year-old: extremely simple, warm, with a relatable everyday analogy.
You ALWAYS respond with VALID JSON ONLY (no prose, no markdown fences) matching this exact shape:

{
  "simple_explanation": "1-2 short sentences. No jargon. Friendly tone.",
  "analogy": "A vivid everyday-life analogy (kitchen, library, toys, traffic, etc.) — 1-2 sentences.",
  "mermaid_diagram": "A complete valid Mermaid.js diagram (flowchart TD / graph LR / erDiagram / sequenceDiagram). Must be syntactically valid Mermaid that renders. Keep it small (3-6 nodes max).",
  "emoji_visual": "4-8 emojis that visually represent the concept, e.g. '🔑📚➡️📖'"
}

Rules:
- The mermaid_diagram MUST be valid Mermaid syntax. Prefer 'flowchart TD' for simplicity.
- Do NOT include code fences inside the JSON values.
- Do NOT use double quotes inside the mermaid_diagram value — use parentheses or single quotes for node labels.
- Keep simple_explanation under 25 words.
"""

CODING_SYSTEM = """You are a friendly programming tutor for college students.
You teach by showing the expected output FIRST, then explaining the logic step-by-step, then giving a skeleton for them to fill in.
You ALWAYS respond with VALID JSON ONLY (no prose, no markdown fences) matching this exact shape:

{
  "expected_output": "Plain text showing exactly what the program should print/return for a representative input. Use 'Input: ...' and 'Output: ...' format. Multi-line allowed using \\n.",
  "logic_steps": ["Step 1: ...", "Step 2: ...", "Step 3: ..."],
  "skeleton_code": "A code skeleton (in the requested language) with comments showing where to fill in logic. Use \\n for newlines.",
  "example_walkthrough": "A 2-3 sentence trace through one tiny example, no code."
}

Rules:
- Detect the language from the subject (JAVASCRIPT -> JavaScript, PYTHON -> Python, DSA -> Python).
- logic_steps MUST be an array of 3-6 short strings.
- skeleton_code must compile syntactically with placeholder comments like '// TODO' or '# TODO'.
- Do NOT solve the problem fully in the skeleton — leave the core logic blank.
- No markdown fences in any field.
"""


# -----------------------------------------------------------------------------
# Router factory
# -----------------------------------------------------------------------------


def build_learn_router(db: AsyncIOMotorDatabase) -> APIRouter:
    router = APIRouter(prefix="/learn", tags=["learn"])
    cache = db["learn_cache"]

    async def _read_cache(key: str) -> Optional[dict]:
        return await cache.find_one({"_id": key})

    async def _write_cache(key: str, mode: str, payload: dict) -> None:
        doc = {"_id": key, "mode": mode, **payload}
        await cache.replace_one({"_id": key}, doc, upsert=True)

    @router.post("/explain-theory", response_model=TheoryExplanation)
    async def explain_theory(req: ExplainRequest):
        key = _cache_key("theory", req.subject, req.topic, req.question)
        cached = await _read_cache(key)
        if cached:
            return TheoryExplanation(
                simple_explanation=cached["simple_explanation"],
                analogy=cached["analogy"],
                mermaid_diagram=cached["mermaid_diagram"],
                emoji_visual=cached["emoji_visual"],
                cached=True,
            )

        try:
            chat = _get_chat(session_id=f"theory-{key[:12]}", system_message=THEORY_SYSTEM)
            options_block = ""
            if req.options:
                opts = "\n".join(f"  - {o}" for o in req.options)
                options_block = f"\n\nAnswer options the student will see:\n{opts}"
            user_text = (
                f"Subject: {req.subject}\n"
                f"Topic: {req.topic}\n"
                f"Question the student is about to answer: {req.question}"
                f"{options_block}\n\n"
                "Explain the underlying concept (NOT the answer) in the JSON format described."
            )
            raw = await chat.send_message(UserMessage(text=user_text))
            parsed = _extract_json(raw)
        except Exception as e:
            logger.exception("Theory explainer failed")
            raise HTTPException(status_code=502, detail=f"LLM call failed: {e}")

        payload = {
            "simple_explanation": str(parsed.get("simple_explanation", "")).strip(),
            "analogy": str(parsed.get("analogy", "")).strip(),
            "mermaid_diagram": str(parsed.get("mermaid_diagram", "")).strip(),
            "emoji_visual": str(parsed.get("emoji_visual", "")).strip(),
        }
        # Sanity fallback for mermaid
        if not payload["mermaid_diagram"] or "graph" not in payload["mermaid_diagram"].lower() \
                and "flowchart" not in payload["mermaid_diagram"].lower() \
                and "sequencediagram" not in payload["mermaid_diagram"].lower() \
                and "erdiagram" not in payload["mermaid_diagram"].lower():
            payload["mermaid_diagram"] = f"flowchart TD\n  A[{req.topic}] --> B[Concept]\n  B --> C[Example]"

        await _write_cache(key, "theory", payload)
        return TheoryExplanation(**payload, cached=False)

    @router.post("/explain-coding", response_model=CodingExplanation)
    async def explain_coding(req: ExplainRequest):
        key = _cache_key("coding", req.subject, req.topic, req.question)
        cached = await _read_cache(key)
        if cached:
            return CodingExplanation(
                expected_output=cached["expected_output"],
                logic_steps=cached["logic_steps"],
                skeleton_code=cached["skeleton_code"],
                example_walkthrough=cached["example_walkthrough"],
                cached=True,
            )

        try:
            chat = _get_chat(session_id=f"coding-{key[:12]}", system_message=CODING_SYSTEM)
            user_text = (
                f"Subject: {req.subject}\n"
                f"Topic: {req.topic}\n"
                f"Coding question: {req.question}\n\n"
                "Produce the JSON described. Pick the language based on the subject "
                "(JAVASCRIPT -> JavaScript, PYTHON -> Python, DSA -> Python by default)."
            )
            raw = await chat.send_message(UserMessage(text=user_text))
            parsed = _extract_json(raw)
        except Exception as e:
            logger.exception("Coding explainer failed")
            raise HTTPException(status_code=502, detail=f"LLM call failed: {e}")

        steps = parsed.get("logic_steps") or []
        if isinstance(steps, str):
            steps = [s.strip() for s in steps.split("\n") if s.strip()]
        steps = [str(s).strip() for s in steps if str(s).strip()][:8]

        payload = {
            "expected_output": str(parsed.get("expected_output", "")).strip(),
            "logic_steps": steps or ["Read the input", "Apply the algorithm", "Return the result"],
            "skeleton_code": str(parsed.get("skeleton_code", "")).strip(),
            "example_walkthrough": str(parsed.get("example_walkthrough", "")).strip(),
        }
        await _write_cache(key, "coding", payload)
        return CodingExplanation(**payload, cached=False)

    @router.get("/health")
    async def health():
        return {"status": "ok", "model": "claude-sonnet-4-5-20250929"}

    return router
