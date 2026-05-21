import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, MessageSquare, Loader2, Send, X, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface QuizQ { q: string; choices: string[]; answer: number; explanation?: string }
interface ChatMsg { role: "user" | "assistant"; content: string }

type Tab = "quiz" | "chat";

export const PdfAiPanel = ({ materialId, title }: { materialId: string; title: string }) => {
  const [tab, setTab] = useState<Tab | null>(null);

  // Quiz state
  const [quizLoading, setQuizLoading] = useState(false);
  const [quiz, setQuiz] = useState<QuizQ[] | null>(null);
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);

  const generateQuiz = async () => {
    setTab("quiz");
    if (quiz || quizLoading) return;
    setQuizLoading(true);
    setRevealed(false); setPicked({});
    try {
      const { data, error } = await supabase.functions.invoke("material-ai", {
        body: { action: "quiz", material_id: materialId },
      });
      if (error) throw error;
      const qs = (data as { questions?: QuizQ[] })?.questions ?? [];
      if (!qs.length) throw new Error("AI returned no questions");
      setQuiz(qs.slice(0, 10));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate quiz");
      setTab(null);
    } finally { setQuizLoading(false); }
  };

  const sendChat = async () => {
    const q = draft.trim();
    if (!q || streaming) return;
    setDraft("");
    const history = messages.slice(-6);
    setMessages((m) => [...m, { role: "user", content: q }, { role: "assistant", content: "" }]);
    setStreaming(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-with-pdf`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token ?? ""}`,
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ material_id: materialId, question: q, history }),
      });
      if (!resp.ok || !resp.body) {
        const t = await resp.text();
        throw new Error(t || `HTTP ${resp.status}`);
      }
      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMessages((m) => {
          const copy = m.slice();
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch (e) {
      setMessages((m) => {
        const copy = m.slice();
        copy[copy.length - 1] = { role: "assistant", content: `⚠️ ${e instanceof Error ? e.message : "Failed"}` };
        return copy;
      });
    } finally { setStreaming(false); }
  };

  if (!tab) {
    return (
      <div className="border-t bg-card/50 px-3 py-2 flex items-center gap-2">
        <button
          onClick={generateQuiz}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-cta text-primary-foreground text-xs font-bold shadow-glow"
        >
          <Sparkles className="h-3 w-3" /> Generate Quiz
        </button>
        <button
          onClick={() => setTab("chat")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-foreground text-xs font-bold"
        >
          <MessageSquare className="h-3 w-3" /> Chat with this PDF
        </button>
      </div>
    );
  }

  return (
    <div className="border-t bg-card flex flex-col max-h-[55vh]">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-1">
          <button onClick={() => setTab("quiz")} className={cn("text-[11px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1", tab === "quiz" ? "bg-foreground text-background" : "text-muted-foreground")}>
            <Sparkles className="h-3 w-3" /> Quiz
          </button>
          <button onClick={() => setTab("chat")} className={cn("text-[11px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1", tab === "chat" ? "bg-foreground text-background" : "text-muted-foreground")}>
            <MessageSquare className="h-3 w-3" /> Chat
          </button>
        </div>
        <button onClick={() => setTab(null)} className="h-7 w-7 rounded-full hover:bg-secondary flex items-center justify-center"><X className="h-3.5 w-3.5" /></button>
      </div>

      {tab === "quiz" && (
        <div className="flex-1 overflow-auto p-3 space-y-3">
          {quizLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Building 10 questions from “{title}”…</div>
          )}
          {quiz && quiz.map((q, i) => {
            const pick = picked[i];
            return (
              <div key={i} className="rounded-2xl border p-3 bg-background">
                <p className="text-xs font-bold mb-2"><span className="text-muted-foreground">Q{i + 1}.</span> {q.q}</p>
                <div className="grid gap-1.5">
                  {q.choices.map((c, j) => {
                    const isPicked = pick === j;
                    const isCorrect = revealed && j === q.answer;
                    const isWrong = revealed && isPicked && j !== q.answer;
                    return (
                      <button
                        key={j}
                        disabled={revealed}
                        onClick={() => setPicked((p) => ({ ...p, [i]: j }))}
                        className={cn(
                          "text-left text-[11px] px-2.5 py-1.5 rounded-xl border transition-all",
                          isCorrect && "border-success bg-success/10 text-success-foreground",
                          isWrong && "border-destructive bg-destructive/10",
                          !revealed && isPicked && "border-foreground bg-secondary",
                          !revealed && !isPicked && "border-border hover:bg-secondary"
                        )}
                      >
                        <span className="font-bold mr-1.5">{String.fromCharCode(65 + j)}.</span>{c}
                        {isCorrect && <CheckCircle2 className="inline h-3 w-3 ml-1.5" />}
                        {isWrong && <XCircle className="inline h-3 w-3 ml-1.5" />}
                      </button>
                    );
                  })}
                </div>
                {revealed && q.explanation && (
                  <p className="mt-2 text-[11px] text-muted-foreground italic">{q.explanation}</p>
                )}
              </div>
            );
          })}
          {quiz && (
            <div className="sticky bottom-0 bg-card pt-2 flex items-center justify-between">
              {revealed ? (
                <>
                  <p className="text-xs font-bold">
                    Score: {quiz.reduce((s, q, i) => s + (picked[i] === q.answer ? 1 : 0), 0)} / {quiz.length}
                  </p>
                  <button onClick={() => { setQuiz(null); generateQuiz(); }} className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-secondary">Regenerate</button>
                </>
              ) : (
                <button
                  onClick={() => setRevealed(true)}
                  disabled={Object.keys(picked).length < quiz.length}
                  className="ml-auto text-[11px] font-bold px-3 py-1.5 rounded-full bg-gradient-cta text-primary-foreground disabled:opacity-50"
                >
                  Submit answers
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "chat" && (
        <>
          <div className="flex-1 overflow-auto p-3 space-y-2">
            {messages.length === 0 && (
              <p className="text-xs text-muted-foreground">Ask anything about this PDF — “summarise chapter 3”, “explain this in simple terms”, etc.</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-xs whitespace-pre-wrap",
                  m.role === "user" ? "bg-gradient-cta text-primary-foreground" : "bg-secondary text-foreground"
                )}>
                  {m.content || (streaming && i === messages.length - 1 ? <Loader2 className="h-3 w-3 animate-spin" /> : "")}
                  {streaming && i === messages.length - 1 && m.content && <span className="inline-block w-1.5 h-3 ml-0.5 bg-foreground/60 animate-pulse align-middle" />}
                </div>
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); sendChat(); }}
            className="border-t p-2 flex items-center gap-2 bg-card"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask about this PDF…"
              className="flex-1 bg-secondary rounded-full px-3 py-2 text-xs outline-none"
              disabled={streaming}
            />
            <button type="submit" disabled={streaming || !draft.trim()} className="h-8 w-8 rounded-full bg-gradient-cta text-primary-foreground inline-flex items-center justify-center disabled:opacity-50">
              {streaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </button>
          </form>
        </>
      )}
    </div>
  );
};