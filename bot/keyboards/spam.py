from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

def get_spam_menu_keyboard(lang: str = "ru"):
    from bot.handlers.onboarding import tr
    buttons = [
        [InlineKeyboardButton(text="📋 " + tr(lang, "spam_my_groups"), callback_data="spam_groups_list")],
        [InlineKeyboardButton(text="🔙 " + tr(lang, "back"), callback_data="menu_main")],
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def get_group_config_keyboard(chat_id: int):
    buttons = [[InlineKeyboardButton(text="⚙️ Настроить / Sozlash", callback_data=f"spam_edit_{chat_id}")]]
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def get_groups_list_keyboard(groups: list, page: int = 0, lang: str = "ru"):
    from bot.handlers.onboarding import tr
    buttons = []
    
    # Simple pagination
    per_page = 5
    start = page * per_page
    end = start + per_page
    current_page_groups = groups[start:end]
    
    for g in current_page_groups:
        buttons.append([
            InlineKeyboardButton(text=f"👥 {g['chat_title']}", callback_data=f"spam_edit_{g['chat_id']}")
        ])
    
    nav_row = []
    if page > 0:
        nav_row.append(InlineKeyboardButton(text="⬅️", callback_data=f"spam_page_{page-1}"))
    if end < len(groups):
        nav_row.append(InlineKeyboardButton(text="➡️", callback_data=f"spam_page_{page+1}"))
    if nav_row:
        buttons.append(nav_row)
        
    buttons.append([InlineKeyboardButton(text="🔙 " + tr(lang, "back"), callback_data="menu_spam")])
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def get_spam_settings_keyboard(chat_id: int, settings: dict, lang: str = "ru"):
    from bot.handlers.onboarding import tr
    
    block_links = settings["block_links"] if settings else 0
    
    buttons = [
        [InlineKeyboardButton(
            text=f"🔗 Блокировка ссылок: {'✅' if block_links else '❌'}", 
            callback_data=f"spam_toggle_links_{chat_id}"
        )],
        [
            InlineKeyboardButton(text="📝 Запрещ. слова", callback_data=f"spam_edit_keywords_{chat_id}"),
            InlineKeyboardButton(text="🌊 Флуд-контроль", callback_data=f"spam_edit_flood_{chat_id}")
        ],
        [InlineKeyboardButton(text="🗑 Удалить из списка", callback_data=f"spam_delete_group_{chat_id}")],
        [InlineKeyboardButton(text="🔙 " + tr(lang, "back"), callback_data="spam_groups_list")],
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)
