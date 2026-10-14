import requests
import json
import time

BASE_URL = "http://127.0.0.1:5005"

def test_endpoints():
    print("Testing /health...")
    r = requests.get(f"{BASE_URL}/health")
    print("Health response:", r.json())
    assert r.status_code == 200

    print("\nTesting /chat (Cybersecurity Question)...")
    chat_payload = {
        "messages": [{"role": "user", "content": "What is Zero Trust Architecture and how does microsegmentation help?"}],
        "persona_id": "cyber-sentinel"
    }
    r = requests.post(f"{BASE_URL}/chat", json=chat_payload)
    data = r.json()
    print("Chat reply preview:\n", data["reply"][:250])
    assert "reply" in data

    print("\nTesting /analyze (SQL Injection & Obfuscation)...")
    analyze_payload = {
        "payload": "' UNION SELECT null, username, password FROM users --"
    }
    r = requests.post(f"{BASE_URL}/analyze", json=analyze_payload)
    data = r.json()
    print("Analysis severity:", data["severity"], "Score:", data["score"])
    print("Threats found:", data["threats"])
    assert data["severity"] in ["MEDIUM", "HIGH", "CRITICAL"]

    print("\nTesting /terms...")
    r = requests.get(f"{BASE_URL}/terms")
    data = r.json()
    print("Total indexed terms:", data["count"])
    assert data["count"] > 20

    print("\nALL BACKEND TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_endpoints()
