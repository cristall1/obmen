import re
import logging
import aiohttp
import json
from config import MISTRAL_API_KEY

CURRENCIES = {
    "USD": ["usd", "доллар", "dollar", "$"],
    "RUB": ["rub", "рубль", "rubl"],
    "UZS": ["uzs", "sum", "so'm", "сум", "сўм"],
    "KGS": ["kgs", "som", "сом"],
    "KZT": ["kzt", "тенге", "tenge"],
    "USDT": ["usdt", "tether", "tezzer"],
}

ALLOWED_RANGES = {
    "USD/UZS": (8000, 20000),
    "USD/EGP": (20, 100),
    "USD/RUB": (40, 150),
    "RUB/UZS": (50, 300),
    "USDT/UZS": (8000, 20000),
    "USDT/KZT": (300, 800),
    "USDT/KGS": (50, 200),
    "USD/KZT": (300, 800),
    "USD/KGS": (50, 200),
    "USD/EUR": (0.5, 1.5),
}

ALLOWED_PAIRS = set(ALLOWED_RANGES.keys())


async def parse_market_message(text: str):
    """
    Попытаться извлечь курсы из текстового сообщения.
    Возвращает список кортежей (pair, rate).
    """
    rates = []
    text_lower = text.lower()

    patterns = [
        # USD
        r"(?:usd|dollar|доллар|\$)\s*[:=-]?\s*(\d+[.,]?\d*)",
        r"(\d+[.,]?\d*)\s*(?:usd|dollar|доллар|\$)",
        # UZS/SUM
        r"(\d+[.,]?\d*)\s*(?:sum|so'm|сум|сўм)",
        # Buy/sell verbs + number
        r"(?:olaman|sotaman|куплю|продам|беру|продаю)\s*[:=-]?\s*(\d+[.,]?\d*)",
        r"(\d+[.,]?\d*)\s*(?:ga|dan)?\s*(?:olaman|sotaman|куплю|продам|беру|продаю)",
    ]

    for pattern in patterns:
        matches = re.findall(pattern, text_lower)
        for match in matches:
            try:
                clean_rate = match.replace(",", ".")
                if clean_rate.count(".") > 1:
                    clean_rate = clean_rate.replace(".", "", clean_rate.count(".") - 1)

                rate = float(clean_rate)
                pair = "USD/UZS"

                if 30 < rate < 100:
                    pair = "USD/EGP"
                elif 8000 < rate < 20000:
                    pair = "USD/UZS"
                elif 40 < rate < 150:
                    pair = "USD/RUB"

                rates.append((pair, rate))
            except ValueError:
                pass

    filtered = _filter_and_average(rates)
    if filtered:
        return filtered

    if MISTRAL_API_KEY:
        try:
            ai_rates = await parse_with_ai(text)
            filtered_ai = _filter_and_average(ai_rates)
            if filtered_ai:
                return filtered_ai
        except Exception as e:
            logging.error(f"AI parsing error: {e}")

    return []


async def parse_with_ai(text: str):
    if not MISTRAL_API_KEY:
        return []

    url = "https://api.mistral.ai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {MISTRAL_API_KEY}",
        "Content-Type": "application/json",
    }

    allowed_pairs = ", ".join(sorted(ALLOWED_PAIRS))
    prompt = f"""
    You are a currency exchange parser. Extract realistic rates only for these pairs: {allowed_pairs}.
    Ignore any other pairs or words (like 'bor', 'olaman', random names).
    If rate is unrealistic, drop it.

    Text: "{text}"

    Return ONLY a JSON list. No markdown, no explanation.
    Format: [{{"pair": "USD/UZS", "rate": 12500.0}}, {{"pair": "RUB/UZS", "rate": 135.0}}]
    If uncertain or no rates, return [].
    """

    payload = {
        "model": "mistral-tiny",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1,
    }

    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(url, headers=headers, json=payload) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    content = result["choices"][0]["message"]["content"]
                    content = re.sub(r"```json\s*|\s*```", "", content)

                    try:
                        data = json.loads(content)
                        rates = []
                        for item in data:
                            if "pair" in item and "rate" in item:
                                rates.append((item["pair"], float(item["rate"])))
                        return rates
                    except json.JSONDecodeError:
                        logging.error(f"Mistral JSON error: {content}")
                else:
                    logging.warning(f"Mistral AI error {resp.status}: {await resp.text()}")
        except Exception as e:
            logging.error(f"Mistral connection error: {e}")

    return []


def _filter_and_average(rates):
    """Оставляем только допустимые пары и диапазоны, дубли усредняем."""
    filtered = {}
    for pair, rate in rates or []:
        if pair not in ALLOWED_PAIRS:
            continue
        low, high = ALLOWED_RANGES[pair]
        if not (low <= rate <= high):
            continue
        filtered.setdefault(pair, []).append(rate)

    averaged = []
    for pair, vals in filtered.items():
        averaged.append((pair, sum(vals) / len(vals)))
    return averaged
