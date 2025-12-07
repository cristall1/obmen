import logging
from pyrogram import Client
from config import API_ID, API_HASH

# user_id -> Client
active_user_clients = {}

async def get_client(user_id: int, session_string: str) -> Client:
    """Возвращает запущенный клиент или запускает новый."""
    if user_id in active_user_clients:
        client = active_user_clients[user_id]
        if not client.is_connected:
            await client.connect()
        return client

    client = Client(
        f"user_session_{user_id}",
        api_id=API_ID,
        api_hash=API_HASH,
        session_string=session_string,
        in_memory=True,
        no_updates=True,  # отключаем приём апдейтов, чтобы не падать на неизвестных peer_id
    )
    await client.start()
    active_user_clients[user_id] = client
    return client

async def get_user_dialogs(user_id: int, session_string: str, only_writable: bool = False):
    """Получает список групп и каналов пользователя."""
    try:
        client = await get_client(user_id, session_string)
        dialogs = []
        async for dialog in client.get_dialogs():
            chat = dialog.chat
            
            # Фильтруем по типу
            if chat.type.value not in ["group", "supergroup", "channel"]:
                continue
                
            # Если нужны только те, куда можно писать (для рассылки)
            # Для only_writable убираем строгую проверку, т.к. is_admin может отсутствовать в объекте chat.
            # Отбор по факту попробуем при отправке; здесь только типы.

            dialogs.append({
                "id": chat.id,
                "type": chat.type.value,
                "is_forum": getattr(chat, "is_forum", False),
                "title": chat.title or "No Title"
            })
            logging.info(f"Dialog: {chat.title} ({chat.id}), type={chat.type.value}, is_forum={getattr(chat, 'is_forum', False)}")
        return dialogs
    except Exception as e:
        logging.error(f"Error getting dialogs for {user_id}: {e}")
        return []

async def get_admin_dialogs(user_id: int, session_string: str):
    """Получает список групп, где пользователь админ или создатель."""
    try:
        client = await get_client(user_id, session_string)
        dialogs = []
        async for dialog in client.get_dialogs():
            chat = dialog.chat
            if chat.type.value not in ["group", "supergroup"]:
                continue
            
            # Check permissions
            is_admin = False
            if hasattr(chat, "is_creator") and chat.is_creator:
                is_admin = True
            elif hasattr(chat, "privileges") and chat.privileges:
                # If privileges object exists, user has some admin rights
                is_admin = True
            else:
                # Fallback: check member status (slower but accurate)
                # Only do this if we really suspect they are admin but privileges is None (unlikely for modern layers)
                try:
                    member = await chat.get_member("me")
                    if member.status in ["administrator", "creator"]:
                        is_admin = True
                except:
                    pass
            
            if is_admin:
                dialogs.append({
                    "chat_id": chat.id,
                    "chat_title": chat.title or "No Title"
                })
        return dialogs
    except Exception as e:
        logging.error(f"Error getting admin dialogs for {user_id}: {e}")
        return []

async def get_forum_topics(user_id: int, session_string: str, chat_id: int):
    try:
        client = await get_client(user_id, session_string)
        topics = []
        logging.info(f"Fetching topics for {chat_id} via raw API...")
        
        from pyrogram.raw import functions
        
        try:
            peer = await client.resolve_peer(chat_id)
        except Exception as e:
            logging.error(f"Failed to resolve peer {chat_id}: {e}")
            return []

        # Fetch first 100 topics
        r = await client.invoke(
            functions.channels.GetForumTopics(
                channel=peer,
                q="",
                offset_date=0,
                offset_id=0,
                offset_topic=0,
                limit=100
            )
        )
        
        for t in r.topics:
            # t is ForumTopic
            is_closed = t.closed
            logging.info(f"Topic {t.id}: {t.title}, closed={is_closed}")
            
            if is_closed:
                continue
                
            topics.append({
                "id": t.id,
                "title": t.title or "No Title"
            })
            
        logging.info(f"Found {len(topics)} active topics for {chat_id}")
        return topics
    except Exception as e:
        logging.error(f"Error getting topics for {user_id} in {chat_id}: {e}", exc_info=True)
        return []

async def stop_client(user_id: int):
    if user_id in active_user_clients:
        await active_user_clients[user_id].stop()
        del active_user_clients[user_id]

async def get_chat_info(user_id: int, session_string: str, chat_id: int):
    try:
        client = await get_client(user_id, session_string)
        chat = await client.get_chat(chat_id)
        return {
            "id": chat.id,
            "title": chat.title,
            "is_forum": getattr(chat, "is_forum", False),
            "type": chat.type.value
        }
    except Exception as e:
        logging.error(f"Error getting chat info for {chat_id}: {e}")
        return None
