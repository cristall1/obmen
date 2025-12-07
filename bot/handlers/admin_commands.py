from aiogram import Router, F, types
from aiogram.filters import Command, CommandObject
from aiogram.types import ChatPermissions
from bot.services.time_util import parse_time_string
import time

router = Router()

def get_target_user(message: types.Message):
    if message.reply_to_message:
        return message.reply_to_message.from_user
    return None

async def is_admin(message: types.Message):
    member = await message.chat.get_member(message.from_user.id)
    return member.status in ["administrator", "creator"]

@router.message(Command("ban"))
async def cmd_ban(message: types.Message):
    if not await is_admin(message):
        return await message.reply("❌ Эта команда доступна только администраторам.")
    
    target = get_target_user(message)
    if not target:
        return await message.reply("⚠️ Ответьте на сообщение пользователя, которого нужно забанить.")
    
    try:
        await message.chat.ban(target.id)
        await message.reply(f"🚫 Пользователь {target.full_name} был забанен.")
    except Exception as e:
        await message.reply(f"❌ Не удалось забанить: {e}")

@router.message(Command("kick"))
async def cmd_kick(message: types.Message):
    if not await is_admin(message):
        return await message.reply("❌ Эта команда доступна только администраторам.")
    
    target = get_target_user(message)
    if not target:
        return await message.reply("⚠️ Ответьте на сообщение пользователя, которого нужно выгнать.")
    
    try:
        await message.chat.ban(target.id)
        await message.chat.unban(target.id)
        await message.reply(f"👢 Пользователь {target.full_name} был выгнан.")
    except Exception as e:
        await message.reply(f"❌ Не удалось выгнать: {e}")

@router.message(Command("mute"))
async def cmd_mute(message: types.Message, command: CommandObject):
    if not await is_admin(message):
        return await message.reply("❌ Эта команда доступна только администраторам.")
    
    target = get_target_user(message)
    if not target:
        return await message.reply("⚠️ Ответьте на сообщение пользователя.")
    
    duration = 0
    if command.args:
        duration = parse_time_string(command.args)
    
    permissions = ChatPermissions(can_send_messages=False)
    until_date = int(time.time()) + duration if duration > 0 else None
    
    try:
        await message.chat.restrict(target.id, permissions=permissions, until_date=until_date)
        time_str = f"на {command.args}" if duration > 0 else "навсегда"
        await message.reply(f"🔇 Пользователь {target.full_name} заглушен {time_str}.")
    except Exception as e:
        await message.reply(f"❌ Не удалось заглушить: {e}")

@router.message(Command("unmute"))
async def cmd_unmute(message: types.Message):
    if not await is_admin(message):
        return await message.reply("❌ Эта команда доступна только администраторам.")
    
    target = get_target_user(message)
    if not target:
        return await message.reply("⚠️ Ответьте на сообщение пользователя.")
    
    permissions = ChatPermissions(
        can_send_messages=True,
        can_send_media_messages=True,
        can_send_other_messages=True,
        can_send_polls=True
    )
    
    try:
        await message.chat.restrict(target.id, permissions=permissions)
        await message.reply(f"🔊 С пользователя {target.full_name} сняты ограничения.")
    except Exception as e:
        await message.reply(f"❌ Не удалось размутить: {e}")


# Admin command to clear all posts (only for bot admins, not group admins)
ADMIN_IDS = [5912983856]  # Add your admin Telegram IDs

@router.message(Command("clear_posts"))
async def cmd_clear_posts(message: types.Message):
    if message.from_user.id not in ADMIN_IDS:
        return await message.reply("❌ Только для администраторов бота.")
    
    from bot.database.database import delete_all_posts
    count = await delete_all_posts()
    await message.reply(f"✅ Удалено {count} постов с сайта.")

@router.message(Command("seller_code"))
async def cmd_seller_code(message: types.Message):
    """Generate seller verification code"""
    from bot.database.database import generate_seller_code
    code = await generate_seller_code(message.from_user.id)
    await message.reply(
        f"Ваш код продавца: <b>{code}</b>\n\n"
        "Введите этот код на сайте чтобы стать продавцом.",
        parse_mode="HTML"
    )

