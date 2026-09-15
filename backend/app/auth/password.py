import hashlib
import secrets

try:
    import bcrypt
    HAS_BCRYPT = True
except Exception:
    HAS_BCRYPT = False

def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode("utf-8")
    if HAS_BCRYPT:
        try:
            salt = bcrypt.gensalt()
            return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")
        except Exception:
            pass

    # Fallback to PBKDF2-SHA256 (Python Standard Library - Zero binary dependencies)
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", pwd_bytes, salt.encode("utf-8"), 100000)
    return f"pbkdf2_sha256${salt}${key.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password or not plain_password:
        return False

    if hashed_password.startswith("pbkdf2_sha256$"):
        try:
            _, salt, key_hex = hashed_password.split("$")
            computed_key = hashlib.pbkdf2_hmac(
                "sha256",
                plain_password.encode("utf-8"),
                salt.encode("utf-8"),
                100000
            )
            return secrets.compare_digest(computed_key.hex(), key_hex)
        except Exception:
            return False

    if HAS_BCRYPT:
        try:
            plain_bytes = plain_password.encode("utf-8")
            hash_bytes = hashed_password.encode("utf-8")
            return bcrypt.checkpw(plain_bytes, hash_bytes)
        except Exception:
            pass

    return False
