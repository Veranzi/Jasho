from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Jashoo Python API"
    api_prefix: str = "/api"
    env: str = "development"
    port: int = 3000
    cors_origins: str = "*"

    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_exp_days: int = 7

    firebase_credentials: str | None = None
    firebase_storage_bucket: str | None = None

    balance_encryption_key: str = "change-me-2"

    blockchain_enabled: bool = False
    web3_rpc_url: str | None = None
    contract_address: str | None = None

    openai_api_key: str | None = None

    uploads_dir: Path = Path("/workspace/python-backend/uploads")

    class Config:
        env_file = ".env"


settings = Settings()
settings.uploads_dir.mkdir(parents=True, exist_ok=True)
