from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "CoalGuard AI"
    API_V1_STR: str = "/api"
    DATABASE_URL: str
    FRONTEND_URL: str = "http://localhost:5173"
    SECRET_KEY: str = "default_secret_key_for_development_only_12345"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 1 week

    class Config:
        env_file = ".env"

settings = Settings()
