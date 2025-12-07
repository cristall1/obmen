from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton


def get_mailing_menu_keyboard():
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="➕ Создать новый шаблон", callback_data="mailing_create")],
            [InlineKeyboardButton(text="🚀 Запустить рассылку", callback_data="mailing_start")],
            [InlineKeyboardButton(text="📋 Активные задачи", callback_data="mailing_list")],
            [InlineKeyboardButton(text="🔙 Назад", callback_data="menu_main")],
        ]
    )
    return keyboard


def get_templates_keyboard(templates: list):
    buttons = []
    for t in templates:
        # t[1] is content (text or file_id). If file_id, it's long.
        # t[2] is media_type.
        # t[3] is caption (if exists, might be None).
        
        # Adjust index based on DB query: id, content, media_type, caption, entities, name
        content_preview = t[1]
        media_type = t[2]
        caption = t[3] if len(t) > 3 else None
        name = t[5] if len(t) > 5 else None
        
        if name:
            preview = name
        elif media_type == "text":
            preview = content_preview[:20] + "..." if len(content_preview) > 20 else content_preview
        else:
            preview = caption[:20] + "..." if caption and len(caption) > 20 else (caption or "Media")
            
        buttons.append([
            InlineKeyboardButton(text=f"📨 {preview} ({media_type})", callback_data=f"template_{t[0]}"),
            InlineKeyboardButton(text="🗑 Удалить", callback_data=f"template_del_{t[0]}"),
        ])

    buttons.append([InlineKeyboardButton(text="🔙 Назад", callback_data="menu_mailing")])
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def get_scheduling_keyboard(start_time: str, end_time: str, interval: int):
    from bot.services.time_util import format_seconds
    interval_str = format_seconds(interval)
    buttons = [
        [InlineKeyboardButton(text=f"🟢 Старт: {start_time}", callback_data="sched_edit_start")],
        [InlineKeyboardButton(text=f"🔴 Стоп: {end_time}", callback_data="sched_edit_end")],
        [InlineKeyboardButton(text=f"⏱ Интервал: {interval_str}", callback_data="sched_edit_interval")],
        [InlineKeyboardButton(text="✅ Создать задачу", callback_data="mailing_confirm")],
        [InlineKeyboardButton(text="🔙 Назад к группам", callback_data="mailgrps_back")],
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def get_number_numpad(prefix: str, current_value: str, allow_dot: bool = False):
    rows = []
    digits = [str(i) for i in range(1, 10)] + ["0"]
    rows.append([InlineKeyboardButton(text=d, callback_data=f"{prefix}_digit_{d}") for d in digits[:3]])
    rows.append([InlineKeyboardButton(text=d, callback_data=f"{prefix}_digit_{d}") for d in digits[3:6]])
    rows.append([InlineKeyboardButton(text=d, callback_data=f"{prefix}_digit_{d}") for d in digits[6:9]])
    last_row = [
        InlineKeyboardButton(text="0", callback_data=f"{prefix}_digit_0"),
        InlineKeyboardButton(text="⌫", callback_data=f"{prefix}_back"),
        InlineKeyboardButton(text="✅", callback_data=f"{prefix}_done"),
    ]
    if allow_dot:
        last_row.insert(1, InlineKeyboardButton(text=".", callback_data=f"{prefix}_dot"))
    rows.append(last_row)
    return InlineKeyboardMarkup(inline_keyboard=rows)

def get_tasks_list_keyboard(tasks: list):
    buttons = []
    for t in tasks:
        # t is a Row or dict. t['id'], t['template_id'], etc.
        # We might want to show template name or just ID.
        buttons.append([
            InlineKeyboardButton(text=f"Task #{t['id']} (Int: {t['interval_minutes']}s)", callback_data=f"task_view_{t['id']}"),
        ])
    buttons.append([InlineKeyboardButton(text="🔙 Назад", callback_data="menu_mailing")])
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def get_task_actions_keyboard(task_id: int):
    buttons = [
        [InlineKeyboardButton(text="🛑 Остановить", callback_data=f"task_stop_{task_id}")],
        [InlineKeyboardButton(text="🔙 Назад", callback_data="mailing_list")],
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def get_topics_keyboard(topics: list, selected_topics: list, chat_id: int):
    buttons = []
    
    # Check if all are selected to toggle text (optional, but good UX)
    all_selected = len(selected_topics) == len(topics) and len(topics) > 0
    select_all_text = "❎ Снять выделение" if all_selected else "✅ Выбрать все темы"
    
    buttons.append([InlineKeyboardButton(text=select_all_text, callback_data=f"mailtopic_all_{chat_id}")])
    
    for t in topics:
        is_selected = t['id'] in selected_topics
        mark = "✅" if is_selected else "⬜️"
        buttons.append([
            InlineKeyboardButton(text=f"{mark} {t['title']}", callback_data=f"mailtopic_{chat_id}_{t['id']}")
        ])
    
    buttons.append([InlineKeyboardButton(text="✅ Готово", callback_data=f"mailtopic_done_{chat_id}")])
    return InlineKeyboardMarkup(inline_keyboard=buttons)
