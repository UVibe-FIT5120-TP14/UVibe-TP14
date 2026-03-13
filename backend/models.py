from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)


class UVReading(Base):
    __tablename__ = "uv_readings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_name = Column(String, nullable=True)
    uv_index = Column(Float, nullable=False)
    recorded_at = Column(DateTime, default=datetime.utcnow)


class UVHistory(Base):
    __tablename__ = "uv_history"

    id = Column(Integer, primary_key=True, index=True)
    region = Column(String, index=True, nullable=False)
    year = Column(Integer, index=True, nullable=False)
    month = Column(Integer, index=True, nullable=False)
    uv_index = Column(Float, nullable=False)


class StateCancerIncident(Base):
    __tablename__ = "state_cancer_incidents"

    id = Column(Integer, primary_key=True, index=True)
    cancer_type = Column(String, index=True, nullable=False)
    year = Column(Integer, index=True, nullable=False)
    sex = Column(String, index=True, nullable=False)
    state = Column(String, index=True, nullable=False)
    count = Column(Integer, nullable=True)              


class AgeCancerIncident(Base):
    __tablename__ = "age_cancer_incidents"

    id = Column(Integer, primary_key=True, index=True)
    cancer_type = Column(String, index=True, nullable=False)
    year = Column(Integer, index=True, nullable=False)
    sex = Column(String, index=True, nullable=False) 
    age_group = Column(String, index=True, nullable=False)
    count = Column(Integer, nullable=True)              
