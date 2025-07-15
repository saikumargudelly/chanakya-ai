import os
import uvicorn
from dotenv import load_dotenv
from pathlib import Path

if __name__ == "__main__":
    # Load environment variables from the root .env file
    env_path = Path(__file__).resolve().parent / '.env'
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
    else:
        print("Warning: .env file not found in the project root")

    # Get configuration from environment variables or use defaults
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 5001))
    reload = os.getenv("ENV", "development").lower() == "development"
    workers = int(os.getenv("WORKERS", 1))

    print(f"Starting server on {host}:{port} (reload={reload}, workers={workers})")
    
    uvicorn.run(
        "backend.app:app",
        host=host,
        port=port,
        reload=reload,
        workers=workers,
        log_level="info"
    )
