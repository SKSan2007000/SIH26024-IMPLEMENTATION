import os
import sys

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(current_dir, "backend")

    if os.path.isdir(backend_dir):
        sys.path.insert(0, backend_dir)
        os.chdir(backend_dir)
    elif current_dir not in sys.path:
        sys.path.insert(0, current_dir)

    import uvicorn

    raw_port = os.environ.get("PORT", "8000")
    try:
        port = int(raw_port)
    except (ValueError, TypeError):
        print(f"[CoalGuard Warning] PORT '{raw_port}' is not an integer. Defaulting to 8000.")
        port = 8000

    host = os.environ.get("HOST", "0.0.0.0")
    print(f"[CoalGuard] Launching FastAPI from root on {host}:{port} (PORT={raw_port})...")
    uvicorn.run("app.main:app", host=host, port=port, log_level="info")
