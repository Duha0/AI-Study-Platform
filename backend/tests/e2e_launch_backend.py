"""Launch the StudyAI backend for local end-to-end verification.

Not part of the pytest suite (pytest only collects ``test_*.py``).

Daemonizes (double-fork) a uvicorn process configured with throwaway E2E
settings so the verification run never touches the developer's real
database or uploads directory. The parent exits immediately, so this is
safe to run from a synchronous terminal command.

Usage:
    python3 tests/e2e_launch_backend.py [port] [ai_api_key]

Defaults: port 8123, AI_API_KEY "test-key-for-e2e".
The fake AI server (tests/e2e_fake_ai.py) must be running on port 8124.
"""

import os
import sys

PORT = sys.argv[1] if len(sys.argv) > 1 else "8123"
AI_KEY = sys.argv[2] if len(sys.argv) > 2 else "test-key-for-e2e"


def daemonize() -> None:
    pid = os.fork()
    if pid == 0:
        os.setsid()
        if os.fork() == 0:
            backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
            os.chdir(backend_dir)
            log = open("/tmp/backend.log", "ab", 0)
            os.dup2(log.fileno(), 1)
            os.dup2(log.fileno(), 2)
            os.dup2(os.open(os.devnull, os.O_RDONLY), 0)
            os.environ["DATABASE_URL"] = "sqlite:///./e2e_test.db"
            os.environ["UPLOADS_DIR"] = "./e2e_uploads"
            os.environ["AI_BASE_URL"] = "http://127.0.0.1:8124"
            os.environ["AI_API_KEY"] = AI_KEY
            os.execvp(
                sys.executable,
                [
                    sys.executable,
                    "-m",
                    "uvicorn",
                    "app.main:app",
                    "--port",
                    PORT,
                    "--log-level",
                    "warning",
                ],
            )
        os._exit(0)
    os.waitpid(pid, 0)


if __name__ == "__main__":
    daemonize()
    print(f"backend daemon launching on 127.0.0.1:{PORT} (e2e_test.db)")
