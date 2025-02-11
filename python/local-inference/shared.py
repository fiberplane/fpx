from hashlib import sha1
import json

hash = lambda s: sha1(s.encode()).hexdigest()


def expand(s: str):
    try:
        return json.loads(s)
    except:
        return s
