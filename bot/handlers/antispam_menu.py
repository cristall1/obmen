import logging
import time
from aiogram import Router, F, types, Bot
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import ChatPermissions
from bot.database.database import (
    get_spam_settings,
    update_spam_settings,
    get_monitored_chats,
    add_monitored_chat,
    remove_monitored_chat,
    get_user,
    add_banned_user_challenge,
    get_monitored_chats_full
)
from bot.handlers.onboarding import tr
from aiogram.exceptions import TelegramBadRequest
from contextlib import suppress
from bot.keyboards.spam import (
    get_spam_menu_keyboard,
    get_groups_list_keyboard,
    get_spam_settings_keyboard,
    get_group_config_keyboard
)

router = Router()

class SpamState(StatesGroup):
    editing_keywords = State()
    editing_flood = State()

@router.callback_query(F.data == "menu_spam")
async def show_spam_menu(callback: types.CallbackQuery):
    user = await get_user(callback.from_user.id)
    lang = user[2] if user else "ru"
    
    with suppress(TelegramBadRequest):
        await callback.message.edit_text(
            tr(lang, "spam_menu_title"),
            reply_markup=get_spam_menu_keyboard(lang)
        )

@router.my_chat_member(F.chat.type.in_({"group", "supergroup"}))
async def on_bot_added_to_group(event: types.ChatMemberUpdated):
    # Detect if bot is added to a group or promoted
    new_status = event.new_chat_member.status
    old_status = event.old_chat_member.status
    
    if new_status == "administrator" and old_status != "administrator":
        # Bot was added or promoted
        user_id = event.from_user.id
        chat_id = event.chat.id
        chat_title = event.chat.title
        
        # Check if user exists in our DB (is a bot user)
        user = await get_user(user_id)
        if user:
            await add_monitored_chat(user_id, chat_id, chat_title)
            logging.info(f"Added monitored chat {chat_title} for user {user_id}")
            
            # Send PM to user
            lang = user[2]
            try:
                await event.bot.send_message(
                    chat_id=user_id,
                    text=tr(lang, "bot_added_group").format(title=chat_title),
                    reply_markup=get_group_config_keyboard(chat_id),
                    parse_mode="HTML"
                )
            except Exception as e:
                logging.error(f"Failed to send PM to user {user_id}: {e}")
    
    # Also handle if bot was just promoted to admin from member
    elif new_status == "administrator" and old_status == "member":
        # Same logic
        user_id = event.from_user.id
        chat_id = event.chat.id
        chat_title = event.chat.title
        user = await get_user(user_id)
        if user:
            await add_monitored_chat(user_id, chat_id, chat_title)
            lang = user[2]
            try:
                await event.bot.send_message(
                    chat_id=user_id,
                    text=tr(lang, "bot_promoted_admin").format(title=chat_title),
                    reply_markup=get_group_config_keyboard(chat_id),
                    parse_mode="HTML"
                )
            except Exception as e:
                logging.error(f"Failed to send PM to user {user_id}: {e}")

@router.callback_query(F.data == "spam_groups_list")
async def show_groups_list(callback: types.CallbackQuery):
    user = await get_user(callback.from_user.id)
    lang = user[2] if user else "ru"
    
    all_groups = await get_monitored_chats_full(callback.from_user.id)
    
    valid_groups = []
    # Filter groups where bot is still a member/admin
    for g in all_groups:
        try:
            member = await callback.bot.get_chat_member(g["chat_id"], callback.bot.id)
            if member.status in ["kicked", "left"]:
                await remove_monitored_chat(callback.from_user.id, g["chat_id"])
            else:
                valid_groups.append(g)
        except Exception:
            # Bot probably kicked or chat deleted
            await remove_monitored_chat(callback.from_user.id, g["chat_id"])
    
    if not valid_groups:
        await callback.answer("Нет активных групп. Добавьте бота в группу и дайте права админа.", show_alert=True)
        return

    with suppress(TelegramBadRequest):
        await callback.message.edit_text(
            tr(lang, "spam_my_groups"),
            reply_markup=get_groups_list_keyboard(valid_groups, lang=lang)
        )

@router.callback_query(F.data.startswith("spam_edit_"))
async def edit_group_settings_router(callback: types.CallbackQuery, state: FSMContext):
    # Central router for all spam_edit_ callbacks
    parts = callback.data.split("_")
    # Format: spam_edit_[ACTION]_[CHAT_ID] or spam_edit_[CHAT_ID]
    
    # Case 1: spam_edit_12345 (Main Menu for Group)
    # Handle negative chat IDs
    if len(parts) == 3:
        try:
            chat_id = int(parts[2])
            await show_group_settings_menu(callback, chat_id)
            return
        except ValueError:
            pass

    # Case 2: spam_edit_keywords_12345
    if len(parts) >= 4 and parts[2] == "keywords":
        chat_id = int(parts[3])
        # Logic for keywords
        await callback.message.answer("Отправьте новые запрещенные слова через запятую (или 'clear' для очистки):")
        await state.set_state(SpamState.editing_keywords)
        await state.update_data(chat_id=chat_id)
        return

    # Case 3: spam_edit_flood_12345
    if len(parts) >= 4 and parts[2] == "flood":
        chat_id = int(parts[3])
        await ask_flood_settings(callback, state, chat_id)
        return

@router.message(SpamState.editing_keywords)
async def save_keywords(message: types.Message, state: FSMContext):
    data = await state.get_data()
    chat_id = data.get("chat_id")
    user = await get_user(message.from_user.id)
    lang = user[2] if user else "ru"
    
    text = message.text.strip()
    if text.lower() == "clear":
        new_keywords = ""
    else:
        new_keywords = text
        
    settings = await get_spam_settings(chat_id)
    block_links = settings["block_links"] if settings else 0
    f_max = settings["flood_max_msgs"] if settings else 0
    f_win = settings["flood_window"] if settings else 60
    f_mute = settings["flood_mute_time"] if settings else 300
    
    await update_spam_settings(chat_id, block_links, new_keywords, f_max, f_win, f_mute)
    await state.clear()
    await message.answer("✅ Ключевые слова обновлены!")
    
    # Ideally return to menu, but we are in message handler. 
    # User can navigate back manually or we send a new menu.
    # Let's send the menu again.
    from bot.keyboards.spam import get_spam_settings_keyboard
    settings = await get_spam_settings(chat_id)
    await message.answer(
        tr(lang, "spam_settings_title").format(title=chat_id),
        reply_markup=get_spam_settings_keyboard(chat_id, settings, lang)
    )

@router.callback_query(F.data.startswith("spam_delete_group_"))
async def delete_group_from_list(callback: types.CallbackQuery):
    chat_id = int(callback.data.split("_")[3])
    await remove_monitored_chat(callback.from_user.id, chat_id)
    await callback.answer("Группа удалена из списка", show_alert=True)
    await show_groups_list(callback)

async def show_group_settings_menu(callback: types.CallbackQuery, chat_id: int):
    user = await get_user(callback.from_user.id)
    lang = user[2] if user else "ru"
    
    settings = await get_spam_settings(chat_id)
    if not settings:
        await update_spam_settings(chat_id, False, "")
        settings = {"block_links": False, "block_keywords": "", "flood_max_msgs": 0}
        
    with suppress(TelegramBadRequest):
        await callback.message.edit_text(
            tr(lang, "spam_settings_title").format(title=chat_id),
            reply_markup=get_spam_settings_keyboard(chat_id, settings, lang)
        )

async def ask_flood_settings(callback: types.CallbackQuery, state: FSMContext, chat_id: int):
    user = await get_user(callback.from_user.id)
    lang = user[2] if user else "ru"
    
    settings = await get_spam_settings(chat_id)
    max_msgs = settings["flood_max_msgs"] if settings else 0
    window = settings["flood_window"] if settings else 60
    mute = settings["flood_mute_time"] if settings else 300
    
    await state.set_state(SpamState.editing_flood)
    await state.update_data(chat_id=chat_id)
    
    await callback.message.answer(
        f"🌊 <b>Настройка флуд-контроля</b>\n\n"
        f"Текущие настройки: {max_msgs} сообщ. / {window} сек -> мут {mute} сек.\n\n"
        "Отправьте новые настройки в формате:\n"
        "<code>МАКС_СООБЩ ОКНО_СЕК МУТ_СЕК</code>\n\n"
        "Пример: <code>5 60 300</code> (5 сообщений за 60 сек -> мут на 5 мин)\n"
        "Отправьте <code>0</code> чтобы отключить.",
        parse_mode="HTML"
    )

@router.callback_query(F.data.startswith("spam_toggle_links_"))
async def toggle_links_handler(callback: types.CallbackQuery):
    chat_id = int(callback.data.split("_")[3])
    settings = await get_spam_settings(chat_id)
    
    new_val = not (settings["block_links"] if settings else False)
    # Preserve other values
    kw = settings["block_keywords"] if settings else ""
    f_max = settings["flood_max_msgs"] if settings else 0
    f_win = settings["flood_window"] if settings else 60
    f_mute = settings["flood_mute_time"] if settings else 300
    
    await update_spam_settings(chat_id, new_val, kw, f_max, f_win, f_mute)
    
    # Refresh
    user = await get_user(callback.from_user.id)
    lang = user[2] if user else "ru"
    # Re-fetch for clean dict
    settings = await get_spam_settings(chat_id)
    with suppress(TelegramBadRequest):
        await callback.message.edit_reply_markup(
            reply_markup=get_spam_settings_keyboard(chat_id, settings, lang)
        )

@router.message(SpamState.editing_flood)
async def save_flood_settings(message: types.Message, state: FSMContext):
    data = await state.get_data()
    chat_id = data.get("chat_id")
    user = await get_user(message.from_user.id)
    lang = user[2] if user else "ru"
    
    text = message.text.strip()
    if text == "0":
        f_max, f_win, f_mute = 0, 60, 300
    else:
        try:
            parts = list(map(int, text.split()))
            if len(parts) != 3:
                raise ValueError
            f_max, f_win, f_mute = parts
        except:
            await message.answer("⚠️ Неверный формат. Используйте: МАКС ОКНО МУТ (например: 5 60 300)")
            return

    settings = await get_spam_settings(chat_id)
    block_links = settings["block_links"] if settings else 0
    block_keywords = settings["block_keywords"] if settings else ""
    
    await update_spam_settings(chat_id, block_links, block_keywords, f_max, f_win, f_mute)
    await state.clear()
    await message.answer("✅ Настройки флуд-контроля сохранены!")
    
    # Show menu again
    from bot.keyboards.spam import get_spam_settings_keyboard
    settings = await get_spam_settings(chat_id)
    await message.answer(
        tr(lang, "spam_settings_title").format(title=chat_id),
        reply_markup=get_spam_settings_keyboard(chat_id, settings, lang)
    )
