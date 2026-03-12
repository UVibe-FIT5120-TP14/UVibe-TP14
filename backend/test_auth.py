"""Tests for auth endpoints."""
import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_login_correct_credentials():
    """Login with correct credentials returns 200 and a token."""
    response = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert len(data["access_token"]) > 10


def test_login_wrong_credentials():
    """Login with wrong credentials returns 401."""
    response = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401


def test_profile_without_token():
    """Hitting /api/user/profile without a token returns 401."""
    response = client.get("/api/user/profile")
    assert response.status_code == 403  # HTTPBearer returns 403 when no token provided


def test_profile_with_valid_token():
    """Hitting /api/user/profile with a valid token returns the user's email."""
    # First log in to get a token
    login_response = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "password123"},
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    # Then hit the profile endpoint
    profile_response = client.get(
        "/api/user/profile",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert profile_response.status_code == 200
    data = profile_response.json()
    assert data["email"] == "test@example.com"
