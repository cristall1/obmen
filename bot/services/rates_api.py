import aiohttp
import logging
from config import FAST_FOREX_API_KEY

BASE_CURRENCY = "USD"
TARGET_CURRENCIES = ["EGP", "EUR", "RUB", "UZS", "KGS", "KZT"]


async def get_official_rates():
    """Получить официальные курсы с FastForex (если указан FAST_FOREX_API_KEY)."""
    if not FAST_FOREX_API_KEY:
        logging.warning("FAST_FOREX_API_KEY is not set; skipping FastForex request.")
        return {}

    url = f"https://api.fastforex.io/fetch-multi?from={BASE_CURRENCY}&to={','.join(TARGET_CURRENCIES)}&api_key={FAST_FOREX_API_KEY}"

    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(url) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data.get("results", {})
                logging.error(f"FastForex error: {resp.status} {await resp.text()}")
        except Exception as e:
            logging.error(f"FastForex connection error: {e}")
    return {}


async def get_binance_p2p_rates():
    """Получить ориентировочные курсы USDT на Binance P2P (покупка USDT)."""
    url = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search"
    rates = {}

    async with aiohttp.ClientSession() as session:
        for fiat in ["UZS", "RUB", "KZT", "KGS"]:
            payload = {
                "fiat": fiat,
                "page": 1,
                "rows": 5,
                "tradeType": "BUY",
                "asset": "USDT",
                "countries": [],
                "proMerchantAds": False,
                "shieldMerchantAds": False,
                "publisherType": None,
                "payTypes": [],
            }

            try:
                async with session.post(url, json=payload) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        advs = data.get("data", [])
                        if advs:
                            price = float(advs[0]["adv"]["price"])
                            rates[f"USDT/{fiat}"] = price
                    else:
                        logging.warning(f"Binance P2P error {resp.status} for {fiat}")
            except Exception as e:
                logging.error(f"Binance P2P error for {fiat}: {e}")

    return rates
