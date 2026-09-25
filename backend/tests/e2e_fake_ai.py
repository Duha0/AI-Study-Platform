"""Fake OpenAI-compatible AI server for local end-to-end verification.

Not part of the pytest suite (pytest only collects ``test_*.py``). Run it
in a terminal, point the backend at it, and exercise the AI endpoints:

    python3 tests/e2e_fake_ai.py 8124
    # in another terminal, start the backend with:
    #   AI_API_KEY=test-key AI_BASE_URL=http://127.0.0.1:8124

Every chat-completions request is answered with a valid JSON payload taken
from a rotating queue in this order: quiz -> summary -> flashcards. That
matches the recommended end-to-end call order, so each endpoint receives
the payload shape it validates:

1. POST /api/materials/{id}/quiz        -> quiz payload
2. POST /api/materials/{id}/summary     -> summary payload
3. POST /api/materials/{id}/flashcards  -> flashcards payload
"""

import json
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

QUIZ = {
    "questions": [
        {
            "prompt": "What do enzymes lower?",
            "options": ["Activation energy", "Temperature", "pH", "Mass"],
            "correct_index": 0,
            "explanation": "Catalysts lower activation energy.",
        },
        {
            "prompt": "Enzymes are best described as...",
            "options": ["Lipids", "Catalysts", "Sugars", "Salts"],
            "correct_index": 1,
            "explanation": "Enzymes are biological catalysts.",
        },
    ]
}

SUMMARY = {
    "intro": "Enzymes are biological catalysts that speed up reactions.",
    "points": [
        "Lower activation energy",
        "Highly specific",
        "Unchanged by reactions",
    ],
}

CARDS = {
    "cards": [
        {"front": "What is an enzyme?", "back": "A biological catalyst."},
        {"front": "What do enzymes lower?", "back": "Activation energy."},
    ]
}

PAYLOADS = [QUIZ, SUMMARY, CARDS] * 10
_state = {"calls": 0}


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        self.rfile.read(length)

        payload = PAYLOADS[_state["calls"] % len(PAYLOADS)]
        _state["calls"] += 1

        body = json.dumps(
            {"choices": [{"message": {"content": json.dumps(payload)}}]}
        ).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        sys.stderr.write("[fake-ai] call #%d %s\n" % (_state["calls"], fmt % args))


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8124
    server = HTTPServer(("127.0.0.1", port), Handler)
    print(f"fake AI server listening on 127.0.0.1:{port}", flush=True)
    server.serve_forever()
