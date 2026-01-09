"""Utility functions for the URL shortener."""

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