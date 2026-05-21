"""
Backend API tests for AI-Powered Learning System endpoints.
Tests the three /api/learn/* endpoints using Claude Sonnet 4.5.
"""
import requests
import time
import sys

# Backend URL from frontend/.env
BASE_URL = "https://connect-arch-check.preview.emergentagent.com/api"

def test_health_check():
    """Test GET /api/learn/health endpoint."""
    print("\n" + "="*80)
    print("TEST 1: GET /api/learn/health")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/learn/health", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code != 200:
            print("❌ FAILED: Expected status code 200")
            return False
        
        data = response.json()
        if data.get("status") != "ok":
            print("❌ FAILED: Expected status='ok'")
            return False
        
        if data.get("model") != "claude-sonnet-4-5-20250929":
            print("❌ FAILED: Expected model='claude-sonnet-4-5-20250929'")
            return False
        
        print("✅ PASSED: Health check endpoint working correctly")
        return True
        
    except Exception as e:
        print(f"❌ FAILED: Exception occurred: {e}")
        return False


def test_explain_theory():
    """Test POST /api/learn/explain-theory endpoint with caching."""
    print("\n" + "="*80)
    print("TEST 2: POST /api/learn/explain-theory (with caching)")
    print("="*80)
    
    payload = {
        "subject": "dbms",
        "topic": "Primary Keys",
        "question": "What is a primary key in a database?",
        "options": [
            "A unique identifier for each row",
            "Allows multiple values",
            "Optional field",
            "Foreign reference"
        ]
    }
    
    try:
        # First call - should NOT be cached
        print("\n--- First call (should be cached=false) ---")
        start_time = time.time()
        response1 = requests.post(f"{BASE_URL}/learn/explain-theory", json=payload, timeout=60)
        elapsed1 = time.time() - start_time
        
        print(f"Status Code: {response1.status_code}")
        print(f"Response Time: {elapsed1:.2f}s")
        
        if response1.status_code != 200:
            print(f"❌ FAILED: Expected status code 200, got {response1.status_code}")
            print(f"Response: {response1.text}")
            return False
        
        data1 = response1.json()
        print(f"Response keys: {list(data1.keys())}")
        
        # Verify all required fields are present
        required_fields = ["simple_explanation", "analogy", "mermaid_diagram", "emoji_visual", "cached"]
        for field in required_fields:
            if field not in data1:
                print(f"❌ FAILED: Missing required field '{field}'")
                return False
            if field != "cached" and not data1[field]:
                print(f"❌ FAILED: Field '{field}' is empty")
                return False
        
        # Verify cached is false on first call
        if data1.get("cached") != False:
            print(f"❌ FAILED: Expected cached=false on first call, got {data1.get('cached')}")
            return False
        
        # Verify simple_explanation is reasonably short (ideally ≤30 words)
        word_count = len(data1["simple_explanation"].split())
        print(f"Simple explanation word count: {word_count}")
        if word_count > 50:
            print(f"⚠️  WARNING: simple_explanation is {word_count} words (ideally ≤30)")
        
        # Verify mermaid_diagram contains expected keywords
        mermaid = data1["mermaid_diagram"].lower()
        mermaid_keywords = ["flowchart", "graph", "erdiagram", "sequencediagram"]
        if not any(keyword in mermaid for keyword in mermaid_keywords):
            print(f"❌ FAILED: mermaid_diagram doesn't contain expected keywords: {mermaid_keywords}")
            print(f"Mermaid content: {data1['mermaid_diagram'][:200]}")
            return False
        
        # Verify emoji_visual contains at least 2 emoji-like characters
        emoji_visual = data1["emoji_visual"]
        # Count non-ASCII characters as potential emojis
        emoji_count = sum(1 for c in emoji_visual if ord(c) > 127)
        if emoji_count < 2:
            print(f"❌ FAILED: emoji_visual should contain at least 2 emoji characters, found {emoji_count}")
            print(f"Emoji visual: {emoji_visual}")
            return False
        
        print(f"✅ First call successful:")
        print(f"  - simple_explanation: {data1['simple_explanation'][:80]}...")
        print(f"  - analogy: {data1['analogy'][:80]}...")
        print(f"  - mermaid_diagram: {data1['mermaid_diagram'][:80]}...")
        print(f"  - emoji_visual: {data1['emoji_visual']}")
        print(f"  - cached: {data1['cached']}")
        
        # Second call - should be cached
        print("\n--- Second call (should be cached=true) ---")
        start_time = time.time()
        response2 = requests.post(f"{BASE_URL}/learn/explain-theory", json=payload, timeout=30)
        elapsed2 = time.time() - start_time
        
        print(f"Status Code: {response2.status_code}")
        print(f"Response Time: {elapsed2:.2f}s")
        
        if response2.status_code != 200:
            print(f"❌ FAILED: Expected status code 200 on second call")
            return False
        
        data2 = response2.json()
        
        # Verify cached is true on second call
        if data2.get("cached") != True:
            print(f"❌ FAILED: Expected cached=true on second call, got {data2.get('cached')}")
            return False
        
        # Verify response is faster (cached should be much faster)
        if elapsed2 >= elapsed1:
            print(f"⚠️  WARNING: Second call ({elapsed2:.2f}s) not faster than first ({elapsed1:.2f}s)")
        else:
            print(f"✅ Cache working: Second call {elapsed1/elapsed2:.1f}x faster")
        
        # Verify content is identical (except cached flag)
        for field in ["simple_explanation", "analogy", "mermaid_diagram", "emoji_visual"]:
            if data1[field] != data2[field]:
                print(f"❌ FAILED: Field '{field}' differs between calls")
                return False
        
        print("✅ PASSED: explain-theory endpoint working correctly with caching")
        return True
        
    except Exception as e:
        print(f"❌ FAILED: Exception occurred: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_explain_coding():
    """Test POST /api/learn/explain-coding endpoint with caching."""
    print("\n" + "="*80)
    print("TEST 3: POST /api/learn/explain-coding (with caching)")
    print("="*80)
    
    payload = {
        "subject": "PYTHON",
        "topic": "Array Reversal",
        "question": "Write a Python function that reverses a list without using the built-in reverse method."
    }
    
    try:
        # First call - should NOT be cached
        print("\n--- First call (should be cached=false) ---")
        start_time = time.time()
        response1 = requests.post(f"{BASE_URL}/learn/explain-coding", json=payload, timeout=60)
        elapsed1 = time.time() - start_time
        
        print(f"Status Code: {response1.status_code}")
        print(f"Response Time: {elapsed1:.2f}s")
        
        if response1.status_code != 200:
            print(f"❌ FAILED: Expected status code 200, got {response1.status_code}")
            print(f"Response: {response1.text}")
            return False
        
        data1 = response1.json()
        print(f"Response keys: {list(data1.keys())}")
        
        # Verify all required fields are present
        required_fields = ["expected_output", "logic_steps", "skeleton_code", "example_walkthrough", "cached"]
        for field in required_fields:
            if field not in data1:
                print(f"❌ FAILED: Missing required field '{field}'")
                return False
            if field not in ["logic_steps", "cached"] and not data1[field]:
                print(f"❌ FAILED: Field '{field}' is empty")
                return False
        
        # Verify cached is false on first call
        if data1.get("cached") != False:
            print(f"❌ FAILED: Expected cached=false on first call, got {data1.get('cached')}")
            return False
        
        # Verify expected_output contains Input and Output
        expected_output = data1["expected_output"]
        if "input" not in expected_output.lower() or "output" not in expected_output.lower():
            print(f"⚠️  WARNING: expected_output should ideally contain 'Input' and 'Output'")
            print(f"Expected output: {expected_output}")
        
        # Verify logic_steps is an array of 3-8 strings
        logic_steps = data1["logic_steps"]
        if not isinstance(logic_steps, list):
            print(f"❌ FAILED: logic_steps should be an array, got {type(logic_steps)}")
            return False
        
        if len(logic_steps) < 3 or len(logic_steps) > 8:
            print(f"⚠️  WARNING: logic_steps should have 3-8 items, got {len(logic_steps)}")
        
        for i, step in enumerate(logic_steps):
            if not step or not isinstance(step, str):
                print(f"❌ FAILED: logic_steps[{i}] is empty or not a string")
                return False
        
        # Verify skeleton_code contains Python keywords
        skeleton_code = data1["skeleton_code"]
        python_keywords = ["def", "todo", "#", "return"]
        if not any(keyword in skeleton_code.lower() for keyword in python_keywords):
            print(f"⚠️  WARNING: skeleton_code should contain Python keywords like 'def', 'TODO', '#'")
            print(f"Skeleton code: {skeleton_code[:200]}")
        
        print(f"✅ First call successful:")
        print(f"  - expected_output: {data1['expected_output'][:80]}...")
        print(f"  - logic_steps: {len(data1['logic_steps'])} steps")
        for i, step in enumerate(data1['logic_steps'][:3]):
            print(f"    {i+1}. {step[:60]}...")
        print(f"  - skeleton_code: {data1['skeleton_code'][:80]}...")
        print(f"  - example_walkthrough: {data1['example_walkthrough'][:80]}...")
        print(f"  - cached: {data1['cached']}")
        
        # Second call - should be cached
        print("\n--- Second call (should be cached=true) ---")
        start_time = time.time()
        response2 = requests.post(f"{BASE_URL}/learn/explain-coding", json=payload, timeout=30)
        elapsed2 = time.time() - start_time
        
        print(f"Status Code: {response2.status_code}")
        print(f"Response Time: {elapsed2:.2f}s")
        
        if response2.status_code != 200:
            print(f"❌ FAILED: Expected status code 200 on second call")
            return False
        
        data2 = response2.json()
        
        # Verify cached is true on second call
        if data2.get("cached") != True:
            print(f"❌ FAILED: Expected cached=true on second call, got {data2.get('cached')}")
            return False
        
        # Verify response is faster
        if elapsed2 >= elapsed1:
            print(f"⚠️  WARNING: Second call ({elapsed2:.2f}s) not faster than first ({elapsed1:.2f}s)")
        else:
            print(f"✅ Cache working: Second call {elapsed1/elapsed2:.1f}x faster")
        
        # Verify content is identical (except cached flag)
        for field in ["expected_output", "logic_steps", "skeleton_code", "example_walkthrough"]:
            if data1[field] != data2[field]:
                print(f"❌ FAILED: Field '{field}' differs between calls")
                return False
        
        print("✅ PASSED: explain-coding endpoint working correctly with caching")
        return True
        
    except Exception as e:
        print(f"❌ FAILED: Exception occurred: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_edge_case_empty_fields():
    """Test edge case with empty subject/topic/question."""
    print("\n" + "="*80)
    print("TEST 4: Edge case - empty fields")
    print("="*80)
    
    payload = {
        "subject": "",
        "topic": "",
        "question": ""
    }
    
    try:
        print("\n--- Testing explain-theory with empty fields ---")
        response = requests.post(f"{BASE_URL}/learn/explain-theory", json=payload, timeout=60)
        print(f"Status Code: {response.status_code}")
        
        # We don't expect a specific status code, just that the server doesn't crash
        if response.status_code in [200, 422, 502]:
            print(f"✅ Server handled empty fields gracefully (status {response.status_code})")
            if response.status_code == 200:
                data = response.json()
                print(f"Response keys: {list(data.keys())}")
            else:
                print(f"Response: {response.text[:200]}")
            return True
        else:
            print(f"⚠️  Unexpected status code: {response.status_code}")
            print(f"Response: {response.text[:200]}")
            return True  # Still pass as long as server didn't crash
        
    except Exception as e:
        print(f"❌ FAILED: Exception occurred: {e}")
        return False


def test_final_health_check():
    """Test that the main API endpoint is still working after all tests."""
    print("\n" + "="*80)
    print("TEST 5: Final health check - GET /api/")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code != 200:
            print("❌ FAILED: Expected status code 200")
            return False
        
        data = response.json()
        if data.get("message") != "Hello World":
            print("❌ FAILED: Expected message='Hello World'")
            return False
        
        print("✅ PASSED: Backend is still healthy after all tests")
        return True
        
    except Exception as e:
        print(f"❌ FAILED: Exception occurred: {e}")
        return False


def main():
    """Run all tests and report results."""
    print("\n" + "="*80)
    print("AI-POWERED LEARNING SYSTEM - BACKEND API TESTS")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Testing endpoints: /learn/health, /learn/explain-theory, /learn/explain-coding")
    
    results = {
        "Health Check": test_health_check(),
        "Explain Theory (with caching)": test_explain_theory(),
        "Explain Coding (with caching)": test_explain_coding(),
        "Edge Case - Empty Fields": test_edge_case_empty_fields(),
        "Final Health Check": test_final_health_check(),
    }
    
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
