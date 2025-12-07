import random
import logging
import time
from aiogram import Router, F, types, Bot
from aiogram.filters import CommandStart, CommandObject, Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import ChatPermissions, InlineKeyboardMarkup, InlineKeyboardButton
from bot.database.database import (
    get_spam_settings,
    update_spam_settings,
    add_banned_user_challenge,
    get_banned_user_challenge,
    update_banned_attempts,
    remove_banned_user_challenge
)

router = Router()

# In-memory flood tracking: { (chat_id, user_id): [timestamp1, timestamp2, ...] }
flood_tracking = {}

class ChallengeState(StatesGroup):
    solving = State()

def generate_math_problem():
    a = random.randint(1, 10)
    b = random.randint(1, 10)
    op = random.choice(['+', '-', '*'])
    if op == '+':
        ans = a + b
    elif op == '-':
        ans = a - b
    else:
        ans = a * b
    return f"{a} {op} {b}", ans

@router.message(Command("spam_settings"))
async def cmd_spam_settings(message: types.Message):
    if message.chat.type not in ["group", "supergroup"]:
        await message.answer("Эта команда работает только в группах.")
        return
    
    # Check admin
    member = await message.bot.get_chat_member(message.chat.id, message.from_user.id)
    if member.status not in ["administrator", "creator"]:
        await message.answer("Только админы могут менять настройки.")
        return

    settings = await get_spam_settings(message.chat.id)
    block_links = settings["block_links"] if settings else 0
    block_keywords = settings["block_keywords"] if settings else ""

    text = (
        f"🛡 <b>Настройки анти-спама:</b>\n\n"
        f"🔗 Блокировать ссылки: {'✅' if block_links else '❌'}\n"
        f"📝 Запрещенные слова: {block_keywords or '(нет)'}\n\n"
        "<i>Используйте кнопки ниже для изменения настроек.</i>"
    )
    
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=f"Переключить ссылки {'❌' if block_links else '✅'}", callback_data="spam_toggle_links")],
        [InlineKeyboardButton(text="✏️ Изменить слова", callback_data="spam_edit_keywords")],
    ])
    await message.answer(text, reply_markup=kb, parse_mode="HTML")

@router.callback_query(F.data == "spam_toggle_links")
async def toggle_links(callback: types.CallbackQuery):
    member = await callback.bot.get_chat_member(callback.message.chat.id, callback.from_user.id)
    if member.status not in ["administrator", "creator"]:
        await callback.answer("Только админы.", show_alert=True)
        return

    settings = await get_spam_settings(callback.message.chat.id)
    block_links = settings["block_links"] if settings else 0
    block_keywords = settings["block_keywords"] if settings else ""
    
    new_block_links = not block_links
    await update_spam_settings(callback.message.chat.id, new_block_links, block_keywords)
    
    await callback.answer("Настройки обновлены")
    # Refresh message
    await cmd_spam_settings(callback.message)

@router.message(F.chat.type.in_({"group", "supergroup"}))
async def check_spam(message: types.Message, bot: Bot):
    if not message.text and not message.caption:
        return

    # Don't check admins
    try:
        member = await bot.get_chat_member(message.chat.id, message.from_user.id)
        if member.status in ["administrator", "creator"]:
            return
    except:
        pass

    settings = await get_spam_settings(message.chat.id)
    if not settings:
        return 
    
    text = (message.text or message.caption or "").lower()
    
    is_spam = False
    reason = ""

    # 1. Check Links
    if settings["block_links"]:
        if "http" in text or "t.me" in text or "www." in text:
            is_spam = True
            reason = "ссылки запрещены"

    # 2. Check Keywords
    if not is_spam and settings["block_keywords"]:
        keywords = [k.strip().lower() for k in settings["block_keywords"].split(",") if k.strip()]
        for k in keywords:
            if k in text:
                is_spam = True
                reason = "запрещенное слово"
                break
    
    # 3. Check Flood
    if not is_spam:
        f_max = settings["flood_max_msgs"]
        if f_max > 0:
            f_win = settings["flood_window"]
            f_mute = settings["flood_mute_time"]
            
            now = time.time()
            key = (message.chat.id, message.from_user.id)
            
            history = flood_tracking.get(key, [])
            # Filter out old messages
            history = [t for t in history if now - t < f_win]
            history.append(now)
            flood_tracking[key] = history
            
            if len(history) > f_max:
                is_spam = True
                reason = "флуд"
                # Clear history for this user to avoid immediate re-trigger after mute expires (optional)
                del flood_tracking[key]
                
                # Mute logic for flood is slightly different (temp mute), but we can use the same ban logic
                # or specific mute logic. The user requested "mute".
                try:
                    await message.delete()
                    until_date = int(time.time() + f_mute)
                    await bot.restrict_chat_member(
                        message.chat.id,
                        message.from_user.id,
                        ChatPermissions(can_send_messages=False),
                        until_date=until_date
                    )
                    await message.answer(
                        f"🔇 {message.from_user.mention_html()} заглушен на {f_mute}с ({reason}).",
                        parse_mode="HTML"
                    )
                    return # Exit after flood mute
                except Exception as e:
                    logging.error(f"Failed to mute flood: {e}")
                    return

    if is_spam:
        try:
            await message.delete()
        except:
            pass # Bot might not have delete rights
        
        # Ban user (Restrict)
        try:
            await bot.restrict_chat_member(
                message.chat.id, 
                message.from_user.id, 
                ChatPermissions(can_send_messages=False)
            )
            
            # Send challenge link
            bot_info = await bot.get_me()
            deep_link = f"https://t.me/{bot_info.username}?start=unban_{message.chat.id}"
            
            kb = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="🔓 Я человек (Разблокировать)", url=deep_link)]
            ])
            
            await message.answer(
                f"🚫 Пользователь {message.from_user.mention_html()} заблокирован ({reason}).\n"
                "Если это ошибка, нажмите кнопку ниже, чтобы пройти проверку.",
                reply_markup=kb,
                parse_mode="HTML"
            )
            
        except Exception as e:
            logging.error(f"Failed to ban user: {e}")

@router.message(CommandStart(deep_link=True, magic=F.args.startswith("unban_")))
async def start_unban_challenge(message: types.Message, command: CommandObject, state: FSMContext):
    try:
        chat_id = int(command.args.split("_")[1])
    except:
        await message.answer("Неверная ссылка.")
        return

    # Start challenge
    await add_banned_user_challenge(message.from_user.id, chat_id, 0) # 0 is dummy answer
    
    prob, ans = generate_math_problem()
    await state.update_data(chat_id=chat_id, correct_answer=ans, problems_solved=0)
    await state.set_state(ChallengeState.solving)
    
    await message.answer(
        f"🛡 <b>Проверка на робота</b>\n\n"
        f"Чтобы разблокироваться в чате, решите 3 примера.\n\n"
        f"1️⃣ Пример 1/3: <b>Сколько будет {prob}?</b>\n"
        "Отправьте ответ числом.",
        parse_mode="HTML"
    )

@router.message(ChallengeState.solving)
async def solve_challenge(message: types.Message, state: FSMContext, bot: Bot):
    if not message.text.isdigit() and not (message.text.startswith('-') and message.text[1:].isdigit()):
        await message.answer("Пожалуйста, введите число.")
        return

    user_ans = int(message.text)
    data = await state.get_data()
    correct = data.get("correct_answer")
    solved = data.get("problems_solved", 0)
    chat_id = data.get("chat_id")

    # Get attempts from DB
    record = await get_banned_user_challenge(message.from_user.id, chat_id)
    if not record:
        await message.answer("⏳ Сессия истекла. Начните заново по ссылке из чата.")
        await state.clear()
        return
    
    attempts = record["attempts_left"]

    if user_ans == correct:
        solved += 1
        if solved >= 3:
            # Success!
            try:
                await bot.restrict_chat_member(
                    chat_id,
                    message.from_user.id,
                    ChatPermissions(
                        can_send_messages=True,
                        can_send_media_messages=True,
                        can_send_other_messages=True,
                        can_add_web_page_previews=True,
                        can_send_polls=True,
                        can_invite_users=True,
                        can_pin_messages=True,
                        can_change_info=True
                    )
                )
                await remove_banned_user_challenge(message.from_user.id, chat_id)
                await message.answer("✅ <b>Вы успешно прошли проверку!</b>\nБан снят, вы можете писать в чат.", parse_mode="HTML")
                await state.clear()
            except Exception as e:
                await message.answer(f"⚠️ Ошибка при снятии бана: {e}. Обратитесь к админу чата.")
        else:
            # Next problem
            prob, ans = generate_math_problem()
            await state.update_data(correct_answer=ans, problems_solved=solved)
            await message.answer(f"✅ Правильно! \n\nExample {solved + 1}/3: <b>Сколько будет {prob}?</b>", parse_mode="HTML")
    else:
        attempts -= 1
        await update_banned_attempts(message.from_user.id, chat_id, attempts)
        if attempts <= 0:
            await message.answer("❌ Неправильно. Попытки исчерпаны. Вы заблокированы навсегда.")
            await state.clear()
        else:
            await message.answer(f"❌ Неправильно! Осталось попыток: {attempts}. Попробуйте еще раз этот же пример.")
