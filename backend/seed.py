"""Seed the database with a test user."""
from database import SessionLocal, engine
from models import Base, User
from auth import get_password_hash


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == "test@example.com").first()
        if not existing:
            user = User(
                email="test@example.com",
                hashed_password=get_password_hash("password123"),
            )
            db.add(user)
            db.commit()
            print("Seeded test user: test@example.com / password123")
        else:
            print("Test user already exists, skipping seed.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
