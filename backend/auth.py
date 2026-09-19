"""
auth.py
--------
Real authentication: bcrypt-hashed passwords + signed JWT session tokens.

- signup/login issue a JWT containing {user_id, role, name, faculty_id}
- get_current_user() reads the "Authorization: Bearer <token>" header,
  verifies the signature + expiry, and loads the matching User row
- require_role("faculty") protects faculty-only endpoints
"""

import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, Header
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from database import get_db
import models

# In a real deployment this MUST come from an env var / secret manager.
# For this class project it's generated once and kept in .env so tokens
# survive a server restart during your demo.
SECRET_KEY = os.getenv("JWT_SECRET", "dev-secret-change-me-vce-ai-tutor")
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 12

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)


def create_access_token(user: models.User) -> str:
    # For faculty, faculty_id IS their own id.
    # For students, faculty_id is the faculty they enrolled under.
    faculty_id = user.id if user.role == "faculty" else user.faculty_id
    payload = {
        "sub": str(user.id),
        "name": user.name,
        "role": user.role,
        "faculty_id": faculty_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid session token.")


def get_current_user(
    authorization: str = Header(default=None),
    db: Session = Depends(get_db),
) -> models.User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or malformed Authorization header.")

    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)

    user = db.query(models.User).filter(models.User.id == int(payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=401, detail="User no longer exists.")
    return user


def require_role(role: str):
    def dependency(user: models.User = Depends(get_current_user)) -> models.User:
        if user.role != role:
            raise HTTPException(status_code=403, detail=f"This action requires the '{role}' role.")
        return user
    return dependency
