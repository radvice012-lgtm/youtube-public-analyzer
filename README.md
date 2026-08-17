# YouTube Public Analyzer v2 — no Google API key

1. Copy `.env.example` to `.env`.
2. Set `INVIDIOUS_INSTANCE` to a trusted current instance from the official Invidious instance list.
3. Install: `python -m pip install -r requirements.txt`
4. Run: `uvicorn app.main:app --reload`
5. Open: `http://127.0.0.1:8000`

The public Invidious backend is configurable because public instances can become unavailable. The official documentation lists current trusted instances.
