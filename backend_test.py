#!/usr/bin/env python3
"""
Regression test for AI Learn API after refactor.
Tests that functionality remains identical after splitting logic into service functions.
"""
import requests
import json
import sys

# Backend URL from environment
BACKEND_URL = "https://connect-arch-check.preview.emergentagent.com"

def test_health_check():
    """Test 1: GET /api/learn/health"""
    print("\n" + "="*80)
    print("TEST 1: GET /api/learn/health")
    print("="*80)
    
    url = f"{BACKEND_URL}/api/learn/health"
    try:
        response = requests.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code != 200:
            print("❌ FAILED: Expected status 200")
            return False
        
        data = response.json()
        if data.get("status") != "ok":
            print("❌ FAILED: Expected status='ok'")
            return False
        
        if data.get("model") != "claude-sonnet-4-5-20250929":
            print("❌ FAILED: Expected model='claude-sonnet-4-5-20250929'")
            return False
        
        print("✅ PASSED: Health check working correctly")
        return True
        
    except Exception as e:
        print(f"❌ FAILED: Exception occurred: {e}")
        return False


def test_explain_theory_cached():
    """Test 2: POST /api/learn/explain-theory (should be cached)"""
    print("\n" + "="*80)
    print("TEST 2: POST /api/learn/explain-theory (cached request)")
    print("="*80)
    
    url = f"{BACKEND_URL}/api/learn/explain-theory"
    payload = {
        "subject": "dbms",
        "topic": "Primary Keys",
        "question": "What is a primary key in a database?",
        "options": [
            "Unique identifier for each row",
            "Multiple values",
            "Optional field",
            "Foreign reference"
        ]
    }
    
    try:
        response = requests.post(url, json=payload, timeout=15)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"Response: {response.text}")
            print("❌ FAILED: Expected status 200")
            return False
        
        data = response.json()
        print(f"Response keys: {list(data.keys())}")
        print(f"Cached: {data.get('cached')}")
        print(f"Simple explanation (first 100 chars): {data.get('simple_explanation', '')[:100]}")
        print(f"Mermaid diagram (first 100 chars): {data.get('mermaid_diagram', '')[:100]}")
        
        # Check required fields
        required_fields = ["simple_explanation", "analogy", "mermaid_diagram", "emoji_visual", "cached"]
        for field in required_fields:
            if field not in data:
                print(f"❌ FAILED: Missing required field '{field}'")
                return False
        
        # Check mermaid diagram contains valid keywords
        mermaid = data.get("mermaid_diagram", "").lower()
        if not any(kw in mermaid for kw in ["flowchart", "graph", "erdiagram", "sequencediagram"]):
            print(f"❌ FAILED: mermaid_diagram doesn't contain valid Mermaid keywords")
            return False
        
        # Check if cached (should be true from previous tests)
        if data.get("cached") != True:
            print("⚠️  WARNING: Expected cached=true (this request was tested before)")
            print("   This might indicate cache was cleared or key changed")
        
        print("✅ PASSED: explain-theory endpoint working correctly")
        return True
        
    except Exception as e:
        print(f"❌ FAILED: Exception occurred: {e}")
        return False


def test_explain_coding_cached():
    """Test 3: POST /api/learn/explain-coding (should be cached)"""
    print("\n" + "="*80)
    print("TEST 3: POST /api/learn/explain-coding (cached request)")
    print("="*80)
    
    url = f"{BACKEND_URL}/api/learn/explain-coding"
    payload = {
        "subject": "PYTHON",
        "topic": "Array Reversal",
        "question": "Write a Python function that reverses a list without using the built-in reverse method."
    }
    
    try:
        response = requests.post(url, json=payload, timeout=15)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"Response: {response.text}")
            print("❌ FAILED: Expected status 200")
            return False
        
        data = response.json()
        print(f"Response keys: {list(data.keys())}")
        print(f"Cached: {data.get('cached')}")
        print(f"Logic steps count: {len(data.get('logic_steps', []))}")
        print(f"Skeleton code (first 100 chars): {data.get('skeleton_code', '')[:100]}")
        
        # Check required fields
        required_fields = ["expected_output", "logic_steps", "skeleton_code", "example_walkthrough", "cached"]
        for field in required_fields:
            if field not in data:
                print(f"❌ FAILED: Missing required field '{field}'")
                return False
        
        # Check logic_steps is array with 3-8 items
        logic_steps = data.get("logic_steps", [])
        if not isinstance(logic_steps, list):
            print(f"❌ FAILED: logic_steps should be an array")
            return False
        
        if not (3 <= len(logic_steps) <= 8):
            print(f"⚠️  WARNING: logic_steps has {len(logic_steps)} items (expected 3-8)")
        
        # Check if cached (should be true from previous tests)
        if data.get("cached") != True:
            print("⚠️  WARNING: Expected cached=true (this request was tested before)")
            print("   This might indicate cache was cleared or key changed")
        
        print("✅ PASSED: explain-coding endpoint working correctly")
        return True
        
    except Exception as e:
        print(f"❌ FAILED: Exception occurred: {e}")
        return False


def test_new_request_cache_miss():
    """Test 4: NEW request to force cache miss"""
    print("\n" + "="*80)
    print("TEST 4: POST /api/learn/explain-theory (NEW request - cache miss)")
    print("="*80)
    
    url = f"{BACKEND_URL}/api/learn/explain-theory"
    payload = {
        "subject": "os",
        "topic": "Round Robin Scheduling",
        "question": "In Round Robin, what determines context switch frequency?"
    }
    
    try:
        response = requests.post(url, json=payload, timeout=20)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"Response: {response.text}")
            print("❌ FAILED: Expected status 200")
            return False
        
        data = response.json()
        print(f"Response keys: {list(data.keys())}")
        print(f"Cached: {data.get('cached')}")
        print(f"Simple explanation: {data.get('simple_explanation', '')[:150]}")
        
        # Check required fields
        required_fields = ["simple_explanation", "analogy", "mermaid_diagram", "emoji_visual", "cached"]
        for field in required_fields:
            if field not in data:
                print(f"❌ FAILED: Missing required field '{field}'")
                return False
        
        # Check cached is false (new request)
        if data.get("cached") != False:
            print(f"❌ FAILED: Expected cached=false for new request, got {data.get('cached')}")
            return False
        
        # Verify content is not empty
        if not data.get("simple_explanation") or not data.get("analogy"):
            print("❌ FAILED: Response fields are empty")
            return False
        
        print("✅ PASSED: New request handled correctly with cached=false")
        return True
        
    except Exception as e:
        print(f"❌ FAILED: Exception occurred: {e}")
        return False


def test_root_endpoint():
    """Test 5: GET /api/ - ensure template route still works"""
    print("\n" + "="*80)
    print("TEST 5: GET /api/ (template route)")
    print("="*80)
    
    url = f"{BACKEND_URL}/api/"
    try:
        response = requests.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code != 200:
            print("❌ FAILED: Expected status 200")
            return False
        
        data = response.json()
        if data.get("message") != "Hello World":
            print(f"❌ FAILED: Expected message='Hello World', got {data.get('message')}")
            return False
        
        print("✅ PASSED: Root endpoint still working")
        return True
        
    except Exception as e:
        print(f"❌ FAILED: Exception occurred: {e}")
        return False


def main():
    print("\n" + "="*80)
    print("AI LEARN API REGRESSION TEST - POST REFACTOR")
    print("Testing that functionality remains identical after code restructuring")
    print("="*80)
    
    results = []
    
    # Run all tests
    results.append(("Health Check", test_health_check()))
    results.append(("Explain Theory (cached)", test_explain_theory_cached()))
    results.append(("Explain Coding (cached)", test_explain_coding_cached()))
    results.append(("New Request (cache miss)", test_new_request_cache_miss()))
    results.append(("Root Endpoint", test_root_endpoint()))
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED - Refactor successful, functionality intact!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed - Refactor may have introduced issues")
        return 1


if __name__ == "__main__":
    sys.exit(main())
