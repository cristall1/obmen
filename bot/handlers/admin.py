import aiosqlite
from aiogram import Router, types, F
from aiogram.filters import Command
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.context import FSMContext
from config import ADMIN_IDS
from bot.database.database import DB_NAME
from bot.keyboards.main_menu import get_main_menu_keyboard

router = Router()


@router.callback_query(F.data == "menu_admin")
async def menu_admin(callback: types.CallbackQuery):
    if callback.from_user.id not in ADMIN_IDS:
        await callback.answer("Нет прав", show_alert=True)
        return

    text = (
        "🛠 <b>Админ-панель</b>\n\n"
        "/stats — статистика\n"
        "/broadcast — рассылка по всем пользователям\n"
        "/export_db — скачать базу данных"
    )
    await callback.message.edit_text(text, parse_mode="HTML", reply_markup=get_main_menu_keyboard(callback.from_user.id))


@router.message(Command("admin"))
async def cmd_admin(message: types.Message):
    if message.from_user.id not in ADMIN_IDS:
        return

    text = (
        "🛠 <b>Админ-панель</b>\n\n"
        "/stats — статистика\n"
        "/broadcast — рассылка по всем пользователям\n"
        "/export_db — скачать базу данных"
    )
    await message.answer(text, parse_mode="HTML")


@router.message(Command("stats"))
async def cmd_stats(message: types.Message):
    if message.from_user.id not in ADMIN_IDS:
        return

    async with aiosqlite.connect(DB_NAME) as db:
        async with db.execute("SELECT COUNT(*) FROM users") as cursor:
            total_users = (await cursor.fetchone())[0]
        async with db.execute("SELECT COUNT(*) FROM users WHERE session_string IS NOT NULL") as cursor:
            active_users = (await cursor.fetchone())[0]

    await message.answer(f"📊 Статистика:\nВсего пользователей: {total_users}\nАвторизованы: {active_users}")


@router.message(Command("export_db"))
async def cmd_export_db(message: types.Message):
    if message.from_user.id not in ADMIN_IDS:
        return

    file = types.FSInputFile(DB_NAME)
    await message.answer_document(file, caption="📦 Backup базы данных")


class AdminState(StatesGroup):
    waiting_for_broadcast = State()


@router.message(Command("broadcast"))
async def cmd_broadcast(message: types.Message, state: FSMContext):
    if message.from_user.id not in ADMIN_IDS:
        return

    await state.set_state(AdminState.waiting_for_broadcast)
    await message.answer("Отправьте сообщение для рассылки всем пользователям:")


@router.message(AdminState.waiting_for_broadcast)
async def process_broadcast(message: types.Message, state: FSMContext, bot):
    text = message.text or message.caption
    if not text:
        await message.answer("Нужно отправить текст.")
        return

    async with aiosqlite.connect(DB_NAME) as db:
        async with db.execute("SELECT telegram_id FROM users") as cursor:
            users = await cursor.fetchall()

    count = 0
    for user in users:
        try:
            await bot.send_message(user[0], text)
            count += 1
        except Exception:
            pass

    await message.answer(f"Готово. Рассылка отправлена {count} пользователям.")
    await state.clear()
