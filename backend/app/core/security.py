import datetime

import bcrypt
import jwt

from app.core.config import settings


def hash_password(password: str) -> str:
    """Hache un mot de passe en clair (bcrypt)."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifie un mot de passe clair contre son hash bcrypt."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except ValueError:
        return False


def create_access_token(user_id: str) -> str:
    """Génère un jeton JWT signé pour l'utilisateur."""
    expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Décode et valide un jeton JWT (lève JWTError si invalide/expiré)."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])