from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    api_url: str = "https://class.dev.codle.io"
    token: str = ""

    model_config = {"env_prefix": "CODLE_", "env_file": ".env"}


settings = Settings()
