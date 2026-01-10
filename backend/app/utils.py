"""
        _~_
       (o o)   diegodebian
      /  V  \────────────────────────────────────
     /(  _  )\  URL Shortener API (MVP)
       ^^ ^^     FastAPI • PostgreSQL • Docker • Nginx

File   : utils.py
Author : Diego Parra
Web    : https://diegodebian.online
─────────────────────────────────────────────────
"""

import string

BASE62_ALPHABET = string.digits + string.ascii_letters  # 0-9 + A-Z + a-z


def encode_base62(num: int) -> str:
    """Encode a positive integer into a base62 string."""
    if num == 0:
        return BASE62_ALPHABET[0]
    base = len(BASE62_ALPHABET)
    encoded = []
    while num > 0:
        num, rem = divmod(num, base)
        encoded.append(BASE62_ALPHABET[rem])
    return "".join(reversed(encoded))