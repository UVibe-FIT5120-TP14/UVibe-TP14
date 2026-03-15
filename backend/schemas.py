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


class UVHistoryResponse(BaseModel):
    region: str
    year: int
    month: int
    uv_index: float

    model_config = {"from_attributes": True}


class StateCancerIncidentResponse(BaseModel):
    id: int
    cancer_type: str
    year: int
    sex: str
    state: str
    count: int | None = None

    model_config = {"from_attributes": True}


class AgeCancerIncidentResponse(BaseModel):
    id: int
    cancer_type: str
    year: int
    sex: str
    age_group: str
    count: int | None = None

    model_config = {"from_attributes": True}
