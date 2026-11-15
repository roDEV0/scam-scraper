from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "message": "Use the /request endpoint to query the model"
    }

def test_request():
    payload = {
        "user": "test_user",
        "request": "This is a test message"
    }

    response = client.post("/request", json=payload)

    assert response.status_code == 200

    data = response.json()

    assert data["user"] == "test_user"
    assert data["status"] in ["OK", "FAILED"]
    assert "response" in data

    print(data)

if __name__ == "__main__":
    test_root()
    test_request()
    print("All tests passed!")