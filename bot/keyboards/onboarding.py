from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardMarkup, KeyboardButton


def get_language_keyboard():
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Русский 🇷🇺", callback_data="lang_ru")],
            [InlineKeyboardButton(text="O'zbekcha 🇺🇿", callback_data="lang_uz")],
        ]
    )
    return keyboard


def get_tos_keyboard(tos_url: str):
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Принять условия / Qoidalarni qabul qilish", url=tos_url)],
            [InlineKeyboardButton(text="✅ Согласен", callback_data="tos_agree")],
        ]
    )
    return keyboard


def get_phone_keyboard():
    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📱 Отправить номер / Raqamni yuborish", request_contact=True)],
        ],
        resize_keyboard=True,
        one_time_keyboard=True,
    )
    return keyboard


def get_code_keyboard():
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text="🔄 Запросить новый код", callback_data="resend_code")]]
    )
    return keyboard


def get_numpad_keyboard(current_code: str = ""):
    buttons = [
        [
            InlineKeyboardButton(text="1", callback_data="numpad_1"),
            InlineKeyboardButton(text="2", callback_data="numpad_2"),
            InlineKeyboardButton(text="3", callback_data="numpad_3"),
        ],
        [
            InlineKeyboardButton(text="4", callback_data="numpad_4"),
            InlineKeyboardButton(text="5", callback_data="numpad_5"),
            InlineKeyboardButton(text="6", callback_data="numpad_6"),
        ],
        [
            InlineKeyboardButton(text="7", callback_data="numpad_7"),
            InlineKeyboardButton(text="8", callback_data="numpad_8"),
            InlineKeyboardButton(text="9", callback_data="numpad_9"),
        ],
        [
            InlineKeyboardButton(text="0", callback_data="numpad_0"),
            InlineKeyboardButton(text="⌫", callback_data="numpad_back"),
        ],
    ]

    if len(current_code) >= 5:
        buttons.append([InlineKeyboardButton(text="✅ Подтвердить / Tasdiqlash", callback_data="numpad_done")])

    buttons.append([InlineKeyboardButton(text="🔄 Запросить новый код", callback_data="resend_code")])

    return InlineKeyboardMarkup(inline_keyboard=buttons)
