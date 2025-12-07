from aiogram import Router, F, types
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from bot.keyboards.onboarding import (
    get_language_keyboard,
    get_tos_keyboard,
    get_phone_keyboard,
)
from bot.database.database import add_user, get_user, verify_code_by_user, update_user_profile
from bot.keyboards.main_menu import get_main_menu_keyboard

router = Router()

TOS_URL = "https://telegra.ph/Terms-of-Service-12-01"

class VerifyState(StatesGroup):
    waiting_for_phone = State()
    waiting_for_code = State()

TEXTS = {
    "uz": {
        "choose_lang": "Xush kelibsiz! Tilni tanlang:",
        "already": "Siz allaqachon ro'yxatdan o'tgansiz.",
        "tos": "Davom etish uchun shartlarni qabul qiling.",
        "verify_start": "Telefon raqamingizni yuboring:",
        "verify_phone_ok": "Telefon qabul qilindi. Kodni kiriting:",
        "verify_success": "Tasdiqlandi! Mini App'ga qaytishingiz mumkin.",
        "verify_fail": "Kod noto'g'ri.",
        "auth_ok": "Tayyor!",
    },
    "ru": {
        "choose_lang": "Добро пожаловать! Выберите язык:",
        "already": "Вы уже зарегистрированы.",
        "tos": "Для продолжения примите условия.",
        "verify_start": "Отправьте номер телефона:",
        "verify_phone_ok": "Телефон принят. Введите код:",
        "verify_success": "Подтверждено! Вернитесь в Mini App.",
        "verify_fail": "Неверный код.",
        "auth_ok": "Готово!",
    },
}


def tr(lang: str, key: str) -> str:
    return TEXTS.get(lang, TEXTS["ru"]).get(key, TEXTS["ru"].get(key, ""))


# Verification flow
@router.callback_query(F.data == "verify_code")
async def start_verification(callback: types.CallbackQuery, state: FSMContext):
    user = await get_user(callback.from_user.id)
    lang = user[2] if user else "ru"
    
    keyboard = get_phone_keyboard()
    await callback.message.answer(tr(lang, "verify_start"), reply_markup=keyboard)
    await state.set_state(VerifyState.waiting_for_phone)
    await callback.answer()


@router.message(VerifyState.waiting_for_phone)
async def on_verification_phone(message: types.Message, state: FSMContext):
    user = await get_user(message.from_user.id)
    lang = user[2] if user else "ru"
    
    if message.contact:
        phone = message.contact.phone_number
    else:
        phone = message.text
    
    if not phone or len(phone) < 7:
        await message.answer("Отправьте номер кнопкой ниже", reply_markup=get_phone_keyboard())
        return
    
    await state.update_data(phone=phone)
    await update_user_profile(message.from_user.id, phone, message.from_user.username or "", message.from_user.full_name)
    
    await message.answer(tr(lang, "verify_phone_ok"), reply_markup=types.ReplyKeyboardRemove())
    await state.set_state(VerifyState.waiting_for_code)


@router.message(VerifyState.waiting_for_code)
async def on_verification_code(message: types.Message, state: FSMContext):
    user = await get_user(message.from_user.id)
    lang = user[2] if user else "ru"
    
    code = message.text.strip()
    data = await state.get_data()
    phone = data.get('phone', '')
    
    # Try new web account verification first
    from bot.database.database import verify_code_from_bot
    result = await verify_code_from_bot(code, message.from_user.id, phone)
    
    if result.get('success'):
        await message.answer(
            tr(lang, "verify_success"),
            reply_markup=get_main_menu_keyboard(message.from_user.id, lang)
        )
        await state.clear()
        return
    
    # Fallback to old verification
    success = await verify_code_by_user(message.from_user.id, code)
    
    if success:
        await message.answer(
            tr(lang, "verify_success"),
            reply_markup=get_main_menu_keyboard(message.from_user.id, lang)
        )
        await state.clear()
    else:
        await message.answer(tr(lang, "verify_fail"))


# Seller code generation
@router.callback_query(F.data == "get_seller_code")
async def get_seller_code_handler(callback: types.CallbackQuery):
    from bot.database.database import generate_seller_code
    code = await generate_seller_code(callback.from_user.id)
    
    await callback.message.answer(
        f"Ваш код продавца: <b>{code}</b>\n\n"
        "Введите этот код на сайте чтобы стать продавцом.",
        parse_mode="HTML"
    )
    await callback.answer()


# Start command
@router.message(Command("start"))
async def cmd_start(message: types.Message, state: FSMContext):
    user = await get_user(message.from_user.id)
    lang = user[2] if user else "ru"
    
    if user and user[5]:
        await message.answer(tr(lang, "already"), reply_markup=get_main_menu_keyboard(message.from_user.id, lang))
        return

    await state.set_state(None)
    await message.answer(tr(lang, "choose_lang"), reply_markup=get_language_keyboard())


@router.callback_query(F.data == "tos_agree")
async def process_tos(callback: types.CallbackQuery, state: FSMContext):
    data = await state.get_data()
    lang = data.get("language", "ru")
    
    await callback.message.delete()
    await callback.message.answer(
        tr(lang, "auth_ok"), 
        reply_markup=get_main_menu_keyboard(callback.from_user.id, lang)
    )


@router.callback_query(F.data == "menu_language")
async def change_language_menu(callback: types.CallbackQuery):
    await callback.message.edit_text("Tilni tanlang / Выберите язык:", reply_markup=get_language_keyboard())


@router.callback_query(F.data.startswith("lang_"))
async def process_language_change(callback: types.CallbackQuery, state: FSMContext):
    lang = callback.data.split("_")[1]
    await state.update_data(language=lang)
    await add_user(callback.from_user.id, lang)
    
    await callback.message.delete()
    await callback.message.answer(tr(lang, "tos"), reply_markup=get_tos_keyboard(TOS_URL))
