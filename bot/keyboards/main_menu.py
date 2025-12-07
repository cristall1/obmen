from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from config import ADMIN_IDS, WEBAPP_URL


def get_main_menu_keyboard(user_id: int = None, lang: str = "ru"):
    texts = {
        "ru": {
            "rates": "💱 Курсы",
            "calc": "🧮 Калькулятор",
            "lang": "🌐 Язык",
            "admin": "🛠 Админка",
            "contact": "✉️ Связь",
            "app": "📱 P2P Обмен",
            "order": "💰 Заявка",
            "verify": "✅ Подтвердить код",
        },
        "uz": {
            "rates": "💱 Kurslar",
            "calc": "🧮 Kalkulyator",
            "lang": "🌐 Til",
            "admin": "🛠 Admin",
            "contact": "✉️ Aloqa",
            "app": "📱 P2P",
            "order": "💰 Buyurtma",
            "verify": "✅ Kodni tasdiqlash",
        },
    }

    t = texts.get(lang, texts["ru"])

    buttons = [
        [InlineKeyboardButton(text=t["app"], web_app=WebAppInfo(url=WEBAPP_URL))],
        [InlineKeyboardButton(text=t["order"], callback_data="create_order"),
         InlineKeyboardButton(text=t["verify"], callback_data="verify_code")],
        [InlineKeyboardButton(text=t["rates"], callback_data="menu_analysis_dashboard"),
         InlineKeyboardButton(text=t["calc"], callback_data="menu_calculator")],
        [InlineKeyboardButton(text=t["lang"], callback_data="menu_language"),
         InlineKeyboardButton(text=t["contact"], url="https://t.me/navawiy")],
    ]

    if user_id and user_id in ADMIN_IDS:
        buttons.append([InlineKeyboardButton(text=t["admin"], callback_data="menu_admin")])

    return InlineKeyboardMarkup(inline_keyboard=buttons)


def get_groups_keyboard(
    groups: list,
    selected_groups: list = None,
    page: int = 0,
    items_per_page: int = 10,
    prefix: str = "group",
):
    if selected_groups is None:
        selected_groups = []

    start_index = page * items_per_page
    end_index = start_index + items_per_page
    current_page_groups = groups[start_index:end_index]

    buttons = []
    for group in current_page_groups:
        is_selected = group["id"] in selected_groups
        
        topic_count = 0
        for s in selected_groups:
            if isinstance(s, str) and s.startswith(f"{group['id']}:"):
                topic_count += 1
        
        type_icon = "📢" if group.get("type") == "channel" else "👥"
        if group.get("is_forum"):
            type_icon = "🏛"
        
        if topic_count > 0:
            text = f"✅ {type_icon} {group['title']} ({topic_count} тем)"
        elif is_selected:
            text = f"✅ {type_icon} {group['title']}"
        else:
            text = f"▫️ {type_icon} {group['title']}"
            
        buttons.append([InlineKeyboardButton(text=text, callback_data=f"{prefix}_{group['id']}_{page}")])

    nav_buttons = []
    if page > 0:
        nav_buttons.append(InlineKeyboardButton(text="⬅️", callback_data=f"{prefix}_page_{page-1}"))
    if end_index < len(groups):
        nav_buttons.append(InlineKeyboardButton(text="➡️", callback_data=f"{prefix}_page_{page+1}"))
    if nav_buttons:
        buttons.append(nav_buttons)

    action_buttons = [
        InlineKeyboardButton(text="Выбрать все/снять", callback_data=f"{prefix}_all_{page}"),
    ]
    buttons.append(action_buttons)
    
    bottom_row = [
        InlineKeyboardButton(text="🔙 Назад", callback_data="mailing_start"),
        InlineKeyboardButton(text="Готово", callback_data=f"{prefix}s_done"),
    ]
    buttons.append(bottom_row)

    return InlineKeyboardMarkup(inline_keyboard=buttons)
