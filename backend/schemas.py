from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(..., min_length=8)
    confirm_password: str


class UserProfile(BaseModel):
    id: int
    name: str | None
    email: str

    model_config = {"from_attributes": True}


class UVResponse(BaseModel):
    uv_index: float
    location_name: str
    latitude: float
    longitude: float
    recorded_at: datetime
    sunset: datetime | None = None
    peak_window: str | None = None
    peak_uv: float | None = None

    model_config = {"from_attributes": True}
