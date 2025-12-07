import os
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
API_ID = os.getenv("API_ID")
API_HASH = os.getenv("API_HASH")
ADMIN_IDS = [int(x) for x in os.getenv("ADMIN_IDS", "").split(",") if x]
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
FAST_FOREX_API_KEY = os.getenv("FAST_FOREX_API_KEY")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://localhost:8080")
