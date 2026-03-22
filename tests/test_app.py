import pytest
from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_activities():
    # Reset the in-memory activities before each test for isolation
    for activity in activities.values():
        if isinstance(activity, dict) and "participants" in activity:
            activity["participants"] = activity["participants"][:2]  # Reset to initial state (first 2)


def test_root_redirect():
    response = client.get("/")
    assert response.status_code == 200 or response.status_code == 307  # FastAPI may redirect
    assert "text/html" in response.headers["content-type"]


def test_list_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_success():
    response = client.post("/activities/Chess Club/signup?email=tester@mergington.edu")
    assert response.status_code == 200
    assert "Signed up tester@mergington.edu for Chess Club" in response.json()["message"]
    # Check participant added
    assert "tester@mergington.edu" in activities["Chess Club"]["participants"]


def test_signup_duplicate():
    email = activities["Chess Club"]["participants"][0]
    response = client.post(f"/activities/Chess Club/signup?email={email}")
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


def test_signup_full():
    # Fill up Math Club (max 3, already has 2)
    client.post("/activities/Math Club/signup?email=third@mergington.edu")
    response = client.post("/activities/Math Club/signup?email=fourth@mergington.edu")
    assert response.status_code == 400
    assert "Activity is full" in response.json()["detail"]


def test_signup_nonexistent():
    response = client.post("/activities/Nonexistent/signup?email=ghost@mergington.edu")
    assert response.status_code == 404
    assert "Activity not found" in response.json()["detail"]
