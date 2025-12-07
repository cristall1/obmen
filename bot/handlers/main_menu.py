from aiogram import Router, F, types
from bot.keyboards.main_menu import get_main_menu_keyboard
from bot.database.database import get_user

router = Router()


@router.callback_query(F.data == "menu_main")
async def back_to_main(callback: types.CallbackQuery):
    user = await get_user(callback.from_user.id)
    lang = user[2] if user else "ru"
    await callback.message.edit_text(
        "Главное меню / Asosiy menyu:", reply_markup=get_main_menu_keyboard(callback.from_user.id, lang)
    )
