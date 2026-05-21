#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Campus Connect — add a real FastAPI layer alongside Supabase and replace the mocked Company API.
  After review, scope narrowed to: AI-Powered Learning System for the Preparation tab using Claude Sonnet 4.5.
  - Theory subjects: AI explains very simply (ELI5) + analogy + Mermaid diagram + emoji visual.
  - Coding subjects: AI shows Expected Output first, then numbered logic steps, then skeleton code.
  - Cached in MongoDB to avoid re-hitting LLM.
  - No changes to news/company section.

backend:
  - task: "AI Learn API - explain-theory endpoint"
    implemented: true
    working: true
    file: "backend/routers/learn.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          New endpoint POST /api/learn/explain-theory using Claude Sonnet 4.5 via emergentintegrations.
          Body: { subject, topic, question, options? }. Returns { simple_explanation, analogy, mermaid_diagram, emoji_visual, cached }.
          Cached in Mongo collection `learn_cache` keyed by sha256(mode|subject|topic|question).
          Uses EMERGENT_LLM_KEY from backend .env.
      - working: true
        agent: "testing"
        comment: |
          ✅ PASSED all tests for explain-theory endpoint:
          - Returns 200 with all required fields (simple_explanation, analogy, mermaid_diagram, emoji_visual, cached)
          - simple_explanation is concise (28 words, within ideal ≤30 word target)
          - analogy provides relatable everyday comparison
          - mermaid_diagram contains valid Mermaid syntax with 'flowchart TD'
          - emoji_visual contains 6 emoji characters (🔑🆔✨📋➡️👤)
          - Caching works correctly: cached=false on first call, cached=true on second identical call
          - Second call is 24.2x faster (6.50s → 0.27s), confirming MongoDB cache is working
          - Edge case: handles empty fields gracefully without crashing (returns 200)
          Test payload: {"subject":"dbms","topic":"Primary Keys","question":"What is a primary key in a database?"}

  - task: "AI Learn API - explain-coding endpoint"
    implemented: true
    working: true
    file: "backend/routers/learn.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          New endpoint POST /api/learn/explain-coding using Claude Sonnet 4.5.
          Body: { subject, topic, question }. Returns { expected_output, logic_steps[], skeleton_code, example_walkthrough, cached }.
          Same caching strategy as theory endpoint.
      - working: true
        agent: "testing"
        comment: |
          ✅ PASSED all tests for explain-coding endpoint:
          - Returns 200 with all required fields (expected_output, logic_steps, skeleton_code, example_walkthrough, cached)
          - expected_output shows clear Input/Output format
          - logic_steps is array of 4 strings (within 3-8 range)
          - skeleton_code contains Python keywords ('def', 'TODO') with placeholder comments, not full solution
          - example_walkthrough provides clear trace through example
          - Caching works correctly: cached=false on first call, cached=true on second identical call
          - Second call is 36.1x faster (8.23s → 0.23s), confirming MongoDB cache is working
          Test payload: {"subject":"PYTHON","topic":"Array Reversal","question":"Write a Python function that reverses a list without using the built-in reverse method."}

  - task: "AI Learn API - health check"
    implemented: true
    working: true
    file: "backend/routers/learn.py"
    stuck_count: 0
    priority: "low"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "GET /api/learn/health returns { status: ok, model: claude-sonnet-4-5-20250929 }."
      - working: true
        agent: "testing"
        comment: |
          ✅ PASSED health check endpoint:
          - Returns 200 status code
          - Response contains {"status":"ok","model":"claude-sonnet-4-5-20250929"}
          - Endpoint responds quickly (< 1 second)
          - Backend remains healthy after all tests (verified with GET /api/ returning {"message":"Hello World"})

frontend:
  - task: "AI Learning System UI integration (Phase 2)"
    implemented: false
    working: "NA"
    file: "frontend/src/components/preparation/"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Pending — will be implemented after backend tests pass."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 2
  run_ui: false

test_plan:
  current_focus: []
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      Phase 2 backend implemented. Please test the three /api/learn endpoints:
      1. GET /api/learn/health — should return { status: "ok", model: "claude-sonnet-4-5-20250929" }
      2. POST /api/learn/explain-theory with body { "subject": "dbms", "topic": "Primary Keys", "question": "What is a primary key?", "options": ["Unique identifier","Multiple values","Optional field","Foreign reference"] }
         - Expect 200 with JSON containing simple_explanation (non-empty string), analogy (non-empty string), mermaid_diagram (contains 'flowchart' or 'graph' or 'erDiagram' or 'sequenceDiagram'), emoji_visual (non-empty), cached (false on first call, true on second identical call).
      3. POST /api/learn/explain-coding with body { "subject": "PYTHON", "topic": "Array Reversal", "question": "Write a function that reverses a list." }
         - Expect 200 with expected_output (non-empty), logic_steps (array of 3-6 strings), skeleton_code (non-empty, contains 'def' or '# TODO' style placeholder), example_walkthrough (non-empty), cached toggles to true on second identical call.
      4. Validate caching: hit the same theory/coding requests twice; second response should have cached=true and be noticeably faster.
      5. Error cases: POST with empty subject/topic/question should still respond (may 200 or 502 — just verify it doesn't crash the server).
  - agent: "testing"
    message: |
      ✅ ALL BACKEND TESTS PASSED (5/5)
      
      Completed comprehensive testing of all three /api/learn/* endpoints:
      
      1. ✅ GET /api/learn/health - Working correctly
         - Returns proper status and model information
         - Response time < 1 second
      
      2. ✅ POST /api/learn/explain-theory - Working correctly with caching
         - All required fields present and properly formatted
         - simple_explanation: concise (28 words)
         - analogy: relatable everyday comparison
         - mermaid_diagram: valid Mermaid syntax (flowchart TD)
         - emoji_visual: 6 emojis present
         - Caching: 24.2x speedup on second call (6.50s → 0.27s)
      
      3. ✅ POST /api/learn/explain-coding - Working correctly with caching
         - All required fields present and properly formatted
         - expected_output: clear Input/Output format
         - logic_steps: 4 steps (within 3-8 range)
         - skeleton_code: contains Python keywords with placeholders
         - example_walkthrough: clear trace through example
         - Caching: 36.1x speedup on second call (8.23s → 0.23s)
      
      4. ✅ Edge case testing - Server handles empty fields gracefully
         - No crashes with empty subject/topic/question
         - Returns 200 with generic content
      
      5. ✅ Final health check - Backend remains stable
         - GET /api/ returns {"message":"Hello World"}
      
      MongoDB caching is working perfectly for both endpoints. Claude Sonnet 4.5 integration via emergentintegrations is functioning as expected. EMERGENT_LLM_KEY is properly configured.
      
      Test file created: /app/backend_test.py
      All backend APIs are production-ready.
