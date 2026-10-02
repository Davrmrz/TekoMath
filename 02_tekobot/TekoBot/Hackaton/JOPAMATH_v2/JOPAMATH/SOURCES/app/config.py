import os
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv

# Base directory is the workspace root
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env if present
ENV_PATH = BASE_DIR / ".env"
load_dotenv(dotenv_path=ENV_PATH)

class Settings(BaseModel):
    PROJECT_NAME: str = "MateJopara Localization Tool"
    VERSION: str = "1.0.0"
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "yes")

    # Storage paths
    BASE_DIR: Path = BASE_DIR
    DATA_DIR: Path = BASE_DIR / "data"
    INPUT_DIR: Path = BASE_DIR / "input"
    OUTPUT_DIR: Path = BASE_DIR / "output"
    BACKUPS_DIR: Path = BASE_DIR / "backups"
    DATABASE_PATH: Path = BASE_DIR / "matejopara.db"
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'matejopara.db'}")

    # Provider settings
    DEFAULT_PROVIDER: str = os.getenv("DEFAULT_PROVIDER", "mock")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_BASE_URL: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    # Correction rules
    MAX_RETRIES: int = int(os.getenv("MAX_RETRIES", "2"))
    PROMPT_VERSION: str = os.getenv("PROMPT_VERSION", "v1.0.0")

    def ensure_directories(self) -> None:
        """Create necessary directories if they do not exist."""
        self.DATA_DIR.mkdir(parents=True, exist_ok=True)
        self.INPUT_DIR.mkdir(parents=True, exist_ok=True)
        self.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        self.BACKUPS_DIR.mkdir(parents=True, exist_ok=True)

settings = Settings()
settings.ensure_directories()
