from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    jwt_expire_minutes: int = 10080  # 7 days

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()