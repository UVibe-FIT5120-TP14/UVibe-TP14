import asyncio
import os
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from dotenv import load_dotenv

import jwt

from database import engine, get_db
from models import Base, User, UVReading, UVHistory, StateCancerIncident
from schemas import LoginRequest, RegisterRequest, TokenResponse, UserProfile, UVResponse, UVHistoryResponse, StateCancerIncidentResponse
from auth import verify_password, get_password_hash, create_access_token, decode_access_token
from seed import seed
import uv_service

load_dotenv()

# Create tables on startup
Base.metadata.create_all(bind=engine)
if os.getenv("SEED_DB", "false").lower() == "true":
    seed()

app = FastAPI(title="Auth API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


@app.post("/api/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match")
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists")
    user = User(
        name=payload.name.strip(),
        email=payload.email.lower().strip(),
        hashed_password=get_password_hash(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": user.email})
    return TokenResponse(access_token=token, token_type="bearer")


@app.post("/api/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_access_token({"sub": user.email})
    return TokenResponse(access_token=token, token_type="bearer")


@app.get("/api/user/profile", response_model=UserProfile)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@app.delete("/api/user/account", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(UVReading).filter(UVReading.user_id == current_user.id).delete()
    db.delete(current_user)
    db.commit()


@app.get("/api/uv", response_model=UVResponse)
async def get_uv(
    lat: float,
    lon: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="OpenWeather API key not configured")

    try:
        uv_data, location_name = await asyncio.gather(
            uv_service.fetch_uv_data(lat, lon, api_key),
            uv_service.fetch_location_name(lat, lon, api_key),
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Failed to fetch UV data from OpenWeather")

    uv_index = uv_data["uv_index"]

    reading = UVReading(
        user_id=current_user.id,
        latitude=lat,
        longitude=lon,
        location_name=location_name,
        uv_index=uv_index,
        recorded_at=datetime.utcnow(),
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)

    return UVResponse(
        uv_index=uv_index,
        location_name=location_name,
        latitude=lat,
        longitude=lon,
        recorded_at=reading.recorded_at,
        sunset=uv_data["sunset"],
        peak_window=uv_data["peak_window"],
        peak_uv=uv_data["peak_uv"],
    )


@app.get("/api/uv/history", response_model=list[UVHistoryResponse])
def get_uv_history(db: Session = Depends(get_db)):
    # Simply fetch all historical data
    # We could allow filtering by year/month but since it's only ~768 rows
    # (8 regions * 8 years * 12 months), we can send it all to the frontend
    # and let the frontend do the filtering for instantaneous sliding.
    history = db.query(UVHistory).all()
    return history


@app.get("/api/cancer/state", response_model=list[StateCancerIncidentResponse])
def get_state_cancer_incident_history(db: Session = Depends(get_db)):
    history = db.query(StateCancerIncident).all()
    return history