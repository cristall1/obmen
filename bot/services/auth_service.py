import logging
from pyrogram import Client
from pyrogram.errors import SessionPasswordNeeded, PhoneCodeInvalid, PasswordHashInvalid
from config import API_ID, API_HASH

# Временное хранилище для активных клиентов в процессе авторизации
# user_id -> Client
active_clients = {}
# user_id -> phone_hash
phone_hashes = {}

async def send_code(user_id: int, phone_number: str):
    """Инициализирует клиент и отправляет код подтверждения."""
    try:
        # Очистка предыдущей сессии если есть
        if user_id in active_clients:
            logging.info(f"User {user_id} already has an active client. Disconnecting...")
            try:
                await active_clients[user_id].disconnect()
            except Exception:
                pass
            del active_clients[user_id]

        # Используем in-memory session для начала
        client = Client(f"user_{user_id}", api_id=API_ID, api_hash=API_HASH, in_memory=True)
        await client.connect()
        
        sent_code = await client.send_code(phone_number)
        
        active_clients[user_id] = client
        phone_hashes[user_id] = sent_code.phone_code_hash
        
        logging.info(f"Code sent to {phone_number}. Hash: {sent_code.phone_code_hash}")
        return True, None
    except Exception as e:
        logging.error(f"Error sending code to {phone_number}: {e}")
        return False, str(e)

async def verify_code(user_id: int, phone_number: str, code: str):
    """Проверяет код и возвращает session_string или ошибку."""
    client = active_clients.get(user_id)
    phone_hash = phone_hashes.get(user_id)
    
    logging.info(f"Verifying code for {user_id}. Stored Hash: {phone_hash}. Input Code: {code}")
    
    if not client or not phone_hash:
        logging.error(f"No active client or hash for {user_id}")
        return False, "Session expired", False

    try:
        await client.sign_in(phone_number, phone_hash, code)
        session_string = await client.export_session_string()
        await client.disconnect()
        
        # Очистка
        del active_clients[user_id]
        del phone_hashes[user_id]
        
        return True, session_string, False
    except SessionPasswordNeeded:
        # Требуется 2FA пароль
        return False, "2FA required", True
    except PhoneCodeInvalid:
        return False, "Invalid code", False
    except Exception as e:
        logging.error(f"Error verifying code: {e}")
        return False, str(e), False

async def verify_password(user_id: int, password: str):
    """Проверяет 2FA пароль."""
    client = active_clients.get(user_id)
    
    if not client:
        return False, "Session expired"

    try:
        await client.check_password(password=password)
        session_string = await client.export_session_string()
        await client.disconnect()
        
        del active_clients[user_id]
        if user_id in phone_hashes:
            del phone_hashes[user_id]
            
        return True, session_string
    except PasswordHashInvalid:
        return False, "Invalid password"
    except Exception as e:
        logging.error(f"Error verifying password: {e}")
        return False, str(e)
