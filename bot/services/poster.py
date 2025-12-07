import asyncio
import random
import logging
import traceback
from pyrogram import enums
from bot.database.database import get_user, get_template, deactivate_task
from bot.services.client_manager import get_client
from aiogram import Bot
from config import BOT_TOKEN
import os
import tempfile


async def run_mailing_task(user_id: int, template_id: int, target_groups: list, task_id: int | None = None) -> bool:
    """
    Выполняет рассылку сообщения по группам.
    Возвращает True, если было хотя бы одно успешное отправление.
    """
    logging.info(f"Starting mailing task for user {user_id}, template {template_id}, groups {len(target_groups)}")

    user = await get_user(user_id)
    if not user or not user[3]:  # session_string
        logging.error(f"User {user_id} not found or no session")
        if task_id is not None:
            await deactivate_task(task_id)
        return False

    session_string = user[3]
    template = await get_template(template_id)

    if not template:
        logging.error(f"Template {template_id} not found")
        if task_id is not None:
            await deactivate_task(task_id)
        return False

    content = template[2]
    media_type = template[3]
    caption = template[4] if len(template) > 4 else None
    entities_json = template[5] if len(template) > 5 else None
    
    entities = []
    if entities_json:
        try:
            import json
            from pyrogram.types import MessageEntity
            from pyrogram.enums import MessageEntityType
            
            raw_entities = json.loads(entities_json)
            for e in raw_entities:
                # Map Aiogram type to Pyrogram Enum
                etype = e["type"]
                pyro_type = None
                
                # Mapping
                if etype == "bold": pyro_type = MessageEntityType.BOLD
                elif etype == "italic": pyro_type = MessageEntityType.ITALIC
                elif etype == "underline": pyro_type = MessageEntityType.UNDERLINE
                elif etype == "strikethrough": pyro_type = MessageEntityType.STRIKETHROUGH
                elif etype == "spoiler": pyro_type = MessageEntityType.SPOILER
                elif etype == "code": pyro_type = MessageEntityType.CODE
                elif etype == "pre": pyro_type = MessageEntityType.PRE
                elif etype == "text_link": pyro_type = MessageEntityType.TEXT_LINK
                elif etype == "text_mention": pyro_type = MessageEntityType.TEXT_MENTION
                elif etype == "custom_emoji": pyro_type = MessageEntityType.CUSTOM_EMOJI
                elif etype == "blockquote": pyro_type = MessageEntityType.BLOCKQUOTE
                # ... add others if needed
                
                if pyro_type:
                    entity = MessageEntity(
                        type=pyro_type,
                        offset=e["offset"],
                        length=e["length"],
                        url=e.get("url"),
                        user=None, # User object needed for text_mention, complicated.
                        language=e.get("language"),
                        custom_emoji_id=e.get("custom_emoji_id")
                    )
                    # For text_mention, we need a User object. 
                    # If we saved user_id, we might try to fetch or construct, but it's hard without resolving.
                    # For now, skip text_mention user resolution or just pass user_id if supported?
                    # Pyrogram MessageEntity expects User object.
                    # If we have user_id, we can try to pass it? No, it needs User.
                    # We will skip text_mention user for now or just not support it fully.
                    
                    entities.append(entity)
        except Exception as e:
            logging.error(f"Failed to parse entities: {e}")

    try:
        client = await get_client(user_id, session_string)
    except Exception as e:
        logging.error(f"Failed to start client for user {user_id}: {e}")
        if task_id is not None:
            await deactivate_task(task_id)
        return False

    valid_groups = []
    for item in target_groups:
        try:
            chat_id = item
            topic_id = None
            if isinstance(item, str) and ":" in item:
                parts = item.split(":")
                chat_id = int(parts[0])
                topic_id = int(parts[1])
            else:
                chat_id = int(item)

            # Try to resolve peer to ensure we can send to it
            # This might fail if the user hasn't encountered the peer yet
            try:
                await client.resolve_peer(chat_id)
            except Exception:
                # If resolve fails, we might still be able to send if it's in dialogs, 
                # but usually resolve_peer is a good check.
                # Let's try to fetch it via get_chat to be sure? 
                # Or just proceed and let send_message fail if it must.
                pass
            valid_groups.append({"chat_id": chat_id, "topic_id": topic_id})
        except Exception as e:
            logging.error(f"Skip chat {item}: cannot resolve peer: {e}")

    if not valid_groups:
        logging.warning("No valid groups to send; deactivating task")
        if task_id is not None:
            await deactivate_task(task_id)
        return False

    # Prepare content for Pyrogram
    # If it's media, we need to download it from Telegram Bot API and upload via Pyrogram
    temp_file_path = None
    bot = None
    
    if media_type != "text" and content and isinstance(content, str) and not os.path.exists(content):
        # Assume content is a file_id from Bot API
        try:
            bot = Bot(token=BOT_TOKEN)
            file_info = await bot.get_file(content)
            
            # Get extension
            ext = os.path.splitext(file_info.file_path)[1]
            if not ext:
                # Fallback based on media_type if possible, or just .jpg for photo
                if media_type == "photo": ext = ".jpg"
                elif media_type == "video": ext = ".mp4"
                elif media_type == "audio": ext = ".mp3"
                elif media_type == "voice": ext = ".ogg"
                elif media_type == "animation": ext = ".mp4"
            
            # Create temp file with extension
            fd, temp_file_path = tempfile.mkstemp(suffix=ext)
            os.close(fd)
            
            await bot.download_file(file_info.file_path, temp_file_path)
            logging.info(f"Downloaded media to {temp_file_path}")
            
            # Use this path for sending
            content = temp_file_path
            
        except Exception as e:
            logging.error(f"Failed to download media: {e}")
            if bot:
                await bot.session.close()
            if task_id is not None:
                await deactivate_task(task_id)
            return False

    success_count = 0
    fail_count = 0

    # We will try to capture the uploaded file_id from the first successful send
    # to avoid re-uploading for every chat.
    uploaded_file_id = None

    # Get our own user ID for smart check
    try:
        me = await client.get_me()
    except Exception as e:
        logging.error(f"Failed to get me: {e}")
        me = None

    for group in valid_groups:
        chat_id_int = group["chat_id"]
        topic_id = group["topic_id"]
        
        # Smart Check: Skip if last message is ours
        if me:
            try:
                should_skip = False
                # Fetch more history to find relevant message and skip service messages
                limit = 20 if topic_id else 10
                last_msg = None
                
                async for msg in client.get_chat_history(chat_id_int, limit=limit):
                    # Skip service messages (pinned, joined, etc.)
                    if msg.service:
                        continue
                        
                    if topic_id:
                        # Check if message belongs to this topic
                        if getattr(msg, "reply_to_message_id", None) == topic_id or \
                           getattr(msg, "message_thread_id", None) == topic_id or \
                           msg.id == topic_id:
                            last_msg = msg
                            break
                    else:
                        last_msg = msg
                        break
                
                if last_msg:
                    is_mine = False
                    sender_id = "Unknown"
                    
                    if last_msg.from_user:
                        sender_id = last_msg.from_user.id
                        if last_msg.from_user.id == me.id:
                            is_mine = True
                    elif last_msg.sender_chat:
                        sender_id = f"Chat {last_msg.sender_chat.id}"
                        # If we sent as a channel? Unlikely for userbot, but possible.
                    
                    if is_mine:
                        logging.info(f"Smart Mode: Skipping {chat_id_int} (topic {topic_id}) - last message is ours.")
                        continue
                    else:
                        logging.info(f"Smart Mode: Sending to {chat_id_int} (topic {topic_id}). Last msg from: {sender_id}")
                else:
                    logging.info(f"Smart Mode: No previous messages found in {chat_id_int} (topic {topic_id}). Sending...")
            except Exception as e:
                logging.warning(f"Smart check failed for {chat_id_int}: {e}")

        try:
            # Send chat action (typing)
            try:
                action = enums.ChatAction.TYPING if media_type == "text" else enums.ChatAction.UPLOAD_PHOTO
                if media_type == "video": action = enums.ChatAction.UPLOAD_VIDEO
                elif media_type == "audio": action = enums.ChatAction.UPLOAD_AUDIO
                elif media_type == "document": action = enums.ChatAction.UPLOAD_DOCUMENT
                
                # await client.send_chat_action(chat_id_int, action=action, message_thread_id=topic_id)
                # message_thread_id not supported in this version
                await client.send_chat_action(chat_id_int, action=action)
                await asyncio.sleep(random.uniform(1, 3))
            except Exception as e:
                logging.warning(f"Failed to send chat action to {chat_id_int}: {e}")

            # Prepare kwargs
            kwargs = {}
            if topic_id:
                # Use reply_to_message_id for topics (older Pyrogram / standard API behavior)
                # If message_thread_id is not supported, this is the way.
                kwargs["reply_to_message_id"] = topic_id
            
            if entities:
                if media_type == "text":
                    kwargs["entities"] = entities
                else:
                    kwargs["caption_entities"] = entities

            # Use uploaded_file_id if available
            current_content = uploaded_file_id if uploaded_file_id else content

            sent_msg = None
            if media_type == "text":
                sent_msg = await client.send_message(chat_id_int, current_content, **kwargs)
            elif media_type == "photo":
                sent_msg = await client.send_photo(chat_id_int, current_content, caption=caption, **kwargs)
            elif media_type == "video":
                sent_msg = await client.send_video(chat_id_int, current_content, caption=caption, **kwargs)
            elif media_type == "animation":
                sent_msg = await client.send_animation(chat_id_int, current_content, caption=caption, **kwargs)
            elif media_type == "audio":
                sent_msg = await client.send_audio(chat_id_int, current_content, caption=caption, **kwargs)
            elif media_type == "voice":
                sent_msg = await client.send_voice(chat_id_int, current_content, caption=caption, **kwargs)
            elif media_type == "document":
                sent_msg = await client.send_document(chat_id_int, current_content, caption=caption, **kwargs)
            elif media_type == "video_note":
                sent_msg = await client.send_video_note(chat_id_int, current_content, **kwargs)
            else:
                # Fallback
                sent_msg = await client.send_message(chat_id_int, f"Unsupported media type: {media_type}", **kwargs)

            # Capture file_id for next sends
            if not uploaded_file_id and sent_msg:
                if sent_msg.photo: uploaded_file_id = sent_msg.photo.file_id
                elif sent_msg.video: uploaded_file_id = sent_msg.video.file_id
                elif sent_msg.animation: uploaded_file_id = sent_msg.animation.file_id
                elif sent_msg.audio: uploaded_file_id = sent_msg.audio.file_id
                elif sent_msg.voice: uploaded_file_id = sent_msg.voice.file_id
                elif sent_msg.document: uploaded_file_id = sent_msg.document.file_id
                elif sent_msg.video_note: uploaded_file_id = sent_msg.video_note.file_id

            logging.info(f"Sent to {chat_id_int}")
            success_count += 1

            sleep_time = random.uniform(5, 15)
            logging.info(f"Sleeping {sleep_time:.2f}s")
            await asyncio.sleep(sleep_time)

        except Exception as e:
            logging.error(f"Failed to send to {chat_id_int}: {e!r}")
            traceback.print_exc()
            fail_count += 1
    
    # Cleanup
    if bot:
        await bot.session.close()
    if temp_file_path and os.path.exists(temp_file_path):
        try:
            os.remove(temp_file_path)
        except:
            pass

    logging.info(f"Mailing finished. Success: {success_count}, Fail: {fail_count}")
    if success_count == 0 and task_id is not None:
        # If we failed to send to ALL groups, maybe we should deactivate?
        # Or maybe just leave it active for next retry?
        # User complained "all failed", so let's deactivate to avoid spamming logs if it's broken.
        await deactivate_task(task_id)
    return success_count > 0
