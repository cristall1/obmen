import datetime
from aiogram import Router, F, types
from aiogram.types import InlineKeyboardButton
from bot.database.database import get_user
from bot.keyboards.main_menu import get_main_menu_keyboard
from bot.services.rates_api import get_official_rates, get_binance_p2p_rates

router = Router()


@router.callback_query(F.data == "menu_analysis_dashboard")
async def show_dashboard(callback: types.CallbackQuery):
    await update_dashboard_message(callback.message)


async def update_dashboard_message(message: types.Message):
    official_rates = await get_official_rates()
    binance_rates = await get_binance_p2p_rates()

    text = "💱 **Курсы валют**\n\n"

    text += "🏦 **Банки (FastForex)**\n"
    if not official_rates:
        text += "_Нет данных (проверьте FAST_FOREX_API_KEY)._"
    else:
        base = "USD"
        priority_targets = ["EGP", "RUB", "UZS", "KZT", "KGS", "EUR"]
        for target in priority_targets:
            if target in official_rates:
                text += f"• {base}/{target}: {official_rates[target]:.2f}\n"

    text += "\n🟡 **Binance P2P (USDT)**\n"
    if not binance_rates:
        text += "_Нет данных._\n"
    else:
        for pair, rate in binance_rates.items():
            text += f"• {pair}: {rate:.2f}\n"

    text += f"\n⏱ Обновлено: {datetime.datetime.now().strftime('%H:%M:%S')}"

    user = await get_user(message.chat.id)
    lang = user[2] if user else "ru"

    keyboard = get_main_menu_keyboard(message.chat.id, lang)
    refresh_btn = InlineKeyboardButton(text="🔄 Обновить", callback_data="menu_analysis_dashboard")
    keyboard.inline_keyboard = [[refresh_btn]] + keyboard.inline_keyboard

    try:
        await message.edit_text(text, reply_markup=keyboard, parse_mode="Markdown")
    except Exception:
        pass
