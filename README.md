# Exchange Master Bot

Телеграм-бот для обменников: собирает курсы из чатов, показывает дашборд, считает конвертации и умеет делать отложенные рассылки.

## Возможности
- Сбор курсов из выбранных групп/каналов и сохранение в SQLite.
- Дашборд: «уличные» курсы из чатов, официальные из FastForex, Binance P2P.
- Калькулятор популярных валют.
- Рассылки: шаблоны, выбор групп, расписание с анти-спам задержками.
- Админка: статистика, бэкап БД, массовые сообщения.

## Требования
- Python 3.11+
- Telegram Bot Token (`BOT_TOKEN`)
- Telegram API ID / HASH (для Pyrogram userbot-сессий)
- Опционально: `FAST_FOREX_API_KEY`, `MISTRAL_API_KEY`, `CHUTES_API_KEY`

Установка зависимостей:
```bash
pip install aiogram pyrogram tgcrypto aiosqlite apscheduler python-dotenv aiohttp
```

Пример `.env`:
```env
BOT_TOKEN=your_bot_token
API_ID=123456
API_HASH=your_api_hash
ADMIN_IDS=123456789,987654321
FAST_FOREX_API_KEY=optional
MISTRAL_API_KEY=optional
CHUTES_API_KEY=optional
```

## Запуск
```bash
python main.py
```

## Структура
- `bot/handlers` — обработчики команд и меню.
- `bot/services` — Pyrogram-клиенты, парсер сообщений, мониторинг, рассылки.
- `bot/database` — функции работы с SQLite.
- `bot/keyboards` — inline / reply клавиатуры.
- `bot.db` — база данных (создаётся автоматически).
