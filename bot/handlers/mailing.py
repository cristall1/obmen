import json
from aiogram import Router, F, types
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.exceptions import TelegramBadRequest
from contextlib import suppress
from bot.keyboards.mailing import (
    get_mailing_menu_keyboard,
    get_templates_keyboard,
    get_scheduling_keyboard,
    get_number_numpad,
    get_topics_keyboard,
)
from bot.keyboards.main_menu import get_groups_keyboard, get_main_menu_keyboard
from bot.database.database import (
    add_template,
    get_user_templates,
    add_scheduled_task,
    get_user,
    delete_template,
)
from bot.services.client_manager import get_user_dialogs, get_forum_topics
from bot.services.scheduler import schedule_mailing_task

router = Router()


class MailingState(StatesGroup):
    waiting_for_template_content = State()
    waiting_for_template_name = State()
    selecting_template = State()
    selecting_groups = State()
    selecting_topic = State()
    configuring_schedule = State()
    editing_schedule = State()


def _format_schedule_summary(data: dict) -> str:
    from bot.services.time_util import format_seconds
    return (
        "Настройка расписания рассылки (мин 5 минут):\n"
        f"• Старт: {data.get('start_time', '??')}\n"
        f"• Стоп: {data.get('end_time', '??')}\n"
        f"• Интервал: {format_seconds(data.get('interval', 0))}\n\n"
        "Выберите, что изменить, или создайте задачу."
    )


def _format_schedule_prompt(data: dict, field: str, current_input: str = "") -> str:
    current_display = current_input
    if field in ("start", "end") and len(current_input) >= 3:
        current_display = f"{current_input[:2]}:{current_input[2:]}"
    from bot.services.time_util import format_seconds
    title = {"start": "Старт (ЧЧММ)", "end": "Стоп (ЧЧММ)", "interval": "Интервал"}[field]
    interval_display = format_seconds(data.get('interval', 0))
    return (
        f"{title}\n"
        f"Нажимайте цифры (0-9) и точку. Текущее: {current_display or '—'}\n"
        f"Формат: МИНУТЫ или МИН.СЕК или ЧАС.МИН.СЕК\n\n"
        f"Текущие значения:\n"
        f"Старт: {data.get('start_time', '??')}\n"
        f"Стоп: {data.get('end_time', '??')}\n"
        f"Интервал: {interval_display}"
    )


@router.callback_query(F.data == "menu_mailing")
async def show_mailing_menu(callback: types.CallbackQuery):
    with suppress(TelegramBadRequest):
        await callback.message.edit_text("📣 Меню рассылок:", reply_markup=get_mailing_menu_keyboard())


@router.callback_query(F.data == "mailing_create")
async def start_template_creation(callback: types.CallbackQuery, state: FSMContext):
    await state.set_state(MailingState.waiting_for_template_content)
    with suppress(TelegramBadRequest):
        await callback.message.edit_text(
            "Отправьте сообщение для рассылки (текст, фото, видео, голосовое и т.д.).", reply_markup=get_mailing_menu_keyboard()
        )


@router.message(MailingState.waiting_for_template_content)
async def save_template(message: types.Message, state: FSMContext):
    content = message.text or message.caption
    media_type = "text"
    file_id = None
    caption = message.caption or ""

    if message.photo:
        media_type = "photo"
        file_id = message.photo[-1].file_id
        content = file_id
    elif message.video:
        media_type = "video"
        file_id = message.video.file_id
        content = file_id
    elif message.animation:
        media_type = "animation"
        file_id = message.animation.file_id
        content = file_id
    elif message.audio:
        media_type = "audio"
        file_id = message.audio.file_id
        content = file_id
    elif message.voice:
        media_type = "voice"
        file_id = message.voice.file_id
        content = file_id
    elif message.document:
        media_type = "document"
        file_id = message.document.file_id
        content = file_id
    elif message.video_note:
        media_type = "video_note"
        file_id = message.video_note.file_id
        content = file_id
    else:
        # Text only
        content = message.text
        caption = None

    # Extract entities
    entities = message.entities or message.caption_entities
    entities_json = None
    if entities:
        # Serialize entities to JSON
        # We need to store them in a way that we can reconstruct for Pyrogram
        # Aiogram entities have: type, offset, length, url, user, language, custom_emoji_id
        entities_list = []
        for e in entities:
            ent_dict = {
                "type": e.type,
                "offset": e.offset,
                "length": e.length,
                "url": e.url,
                "language": e.language,
                "custom_emoji_id": e.custom_emoji_id
            }
            if e.user:
                ent_dict["user_id"] = e.user.id
            entities_list.append(ent_dict)
        entities_json = json.dumps(entities_list)

    if not content and not file_id:
        await message.answer("Нужно отправить текст или медиа.")
        return

    # Save to state instead of DB
    await state.update_data(
        temp_content=content,
        temp_media_type=media_type,
        temp_caption=caption,
        temp_entities=entities_json
    )
    await state.set_state(MailingState.waiting_for_template_name)
    await message.answer("Введите название для этого шаблона (например: 'Реклама курса' или 'Приветствие'):")


@router.message(MailingState.waiting_for_template_name)
async def save_template_name(message: types.Message, state: FSMContext):
    name = message.text.strip()
    if not name:
        await message.answer("Пожалуйста, отправьте текстовое название.")
        return

    data = await state.get_data()
    content = data.get("temp_content")
    media_type = data.get("temp_media_type")
    caption = data.get("temp_caption")
    entities_json = data.get("temp_entities")

    template_id = await add_template(message.from_user.id, content, media_type, caption, entities_json, name)
    await state.clear()
    await message.answer(
        f"Шаблон '{name}' сохранён (ID: {template_id}). Теперь выберите «Запустить рассылку».",
        reply_markup=get_mailing_menu_keyboard(),
    )


@router.callback_query(F.data == "mailing_start")
async def start_mailing(callback: types.CallbackQuery, state: FSMContext):
    user = await get_user(callback.from_user.id)
    if not user or not user[3]:
        await callback.answer("Сначала пройдите авторизацию /start", show_alert=True)
        return

    templates = await get_user_templates(callback.from_user.id)
    await state.set_state(MailingState.selecting_template)

    with suppress(TelegramBadRequest):
        if not templates:
            await callback.message.edit_text(
                "У вас ещё нет шаблонов. Сначала создайте шаблон.", reply_markup=get_mailing_menu_keyboard()
            )
            return

        await callback.message.edit_text(
            "Выберите шаблон для рассылки (можно удалить ненужные):", reply_markup=get_templates_keyboard(templates)
        )


@router.callback_query(F.data.startswith("template_del_"), MailingState.selecting_template)
async def delete_template_cb(callback: types.CallbackQuery, state: FSMContext):
    template_id = int(callback.data.split("_")[-1])
    await delete_template(callback.from_user.id, template_id)
    templates = await get_user_templates(callback.from_user.id)
    with suppress(TelegramBadRequest):
        if not templates:
            await state.clear()
            await callback.message.edit_text("Все шаблоны удалены. Создайте новый.", reply_markup=get_mailing_menu_keyboard())
            return
        await callback.message.edit_text(
            "Шаблон удалён. Выберите шаблон:", reply_markup=get_templates_keyboard(templates)
        )


@router.callback_query(F.data.startswith("template_"), MailingState.selecting_template)
async def choose_template(callback: types.CallbackQuery, state: FSMContext):
    template_id = int(callback.data.split("_")[1])
    user = await get_user(callback.from_user.id)
    if not user or not user[3]:
        await callback.answer("Сначала пройдите авторизацию /start", show_alert=True)
        return

    await state.set_state(MailingState.selecting_groups)
    await state.update_data(selected_template_id=template_id)

    groups = await get_user_dialogs(callback.from_user.id, user[3], only_writable=True)
    fallback_used = False
    if not groups:
        groups = await get_user_dialogs(callback.from_user.id, user[3], only_writable=False)
        fallback_used = bool(groups)
    if not groups:
        await callback.message.edit_text(
            "Не нашли групп/каналов, куда можно писать. Убедитесь, что аккаунт открыл нужные чаты в Telegram (Pyrogram синхронизирует их после открытия) и попробуйте снова.",
            reply_markup=get_main_menu_keyboard(callback.from_user.id),
        )
        await state.clear()
        return

    await state.update_data(available_groups=groups, selected_groups=[])
    extra_note = "\n\n⚠️ Некоторым чатам может требоваться право на отправку сообщений. Проверьте права перед запуском." if fallback_used else ""
    with suppress(TelegramBadRequest):
        await callback.message.edit_text(
            "Выберите группы/каналы для рассылки (можно листать страницы):" + extra_note,
            reply_markup=get_groups_keyboard(groups, prefix="mailgrp"),
        )


@router.callback_query(F.data.startswith("mailgrp_"), MailingState.selecting_groups)
async def toggle_mailing_group(callback: types.CallbackQuery, state: FSMContext):
    parts = callback.data.split("_")
    action = parts[1]
    state_data = await state.get_data()
    selected = state_data.get("selected_groups", [])
    groups = state_data.get("available_groups", [])

    if action == "page":
        page = int(parts[2])
        with suppress(TelegramBadRequest):
            await callback.message.edit_reply_markup(reply_markup=get_groups_keyboard(groups, selected, page=page, prefix="mailgrp"))
        return

    if action == "all":
        page = int(parts[2])
        all_ids = [g["id"] for g in groups]
        selected = [] if set(all_ids).issubset(set(selected)) else all_ids
        await state.update_data(selected_groups=selected)
        with suppress(TelegramBadRequest):
            await callback.message.edit_reply_markup(reply_markup=get_groups_keyboard(groups, selected, page=page, prefix="mailgrp"))
        return

    group_id = int(action)
    page = int(parts[2])

    # Check if forum or supergroup (force check for topics)
    group = next((g for g in groups if g["id"] == group_id), None)
    
    # Verify is_forum status explicitly because get_dialogs might be incomplete
    from bot.services.client_manager import get_chat_info
    user = await get_user(callback.from_user.id)
    chat_info = await get_chat_info(callback.from_user.id, user[3], group_id)
    
    is_forum = False
    if chat_info:
        is_forum = chat_info.get("is_forum", False)
    elif group:
        is_forum = group.get("is_forum", False)

    # Force check for topics if it's a supergroup, even if is_forum is False
    # This handles cases where Telegram doesn't report is_forum correctly in initial calls
    if not is_forum and group and group.get("type") == "supergroup":
        # Try to fetch topics anyway
        topics = await get_forum_topics(callback.from_user.id, user[3], group_id)
        if topics:
            is_forum = True
            # Update local group info
            group["is_forum"] = True
            await state.update_data(available_groups=groups)

    if is_forum:
        # Fetch topics (if not already fetched)
        if 'topics' not in locals():
            topics = await get_forum_topics(callback.from_user.id, user[3], group_id)
        
        if topics:
            await state.set_state(MailingState.selecting_topic)
            # Filter selected topics for this group
            
            # If the raw group_id is in selected, remove it to avoid sending to "General" implicitly
            if group_id in selected:
                selected.remove(group_id)
                await state.update_data(selected_groups=selected)
            
            current_selected_topics = []
            for s in selected:
                if isinstance(s, str) and s.startswith(f"{group_id}:"):
                    try:
                        current_selected_topics.append(int(s.split(":")[1]))
                    except:
                        pass
            
            await state.update_data(current_viewing_chat_id=group_id, current_topics=topics, current_topics_selected=current_selected_topics)
            with suppress(TelegramBadRequest):
                await callback.message.edit_text(
                    f"Выберите темы для {group['title']}:",
                    reply_markup=get_topics_keyboard(topics, current_selected_topics, group_id)
                )
            return
        else:
            await callback.answer("В этой группе нет доступных тем (или они закрыты). Выбрана вся группа.", show_alert=True)
    elif group and group.get("type") == "supergroup":
         # Notify user that we tried but failed to find topics
         await callback.answer("Это супергруппа, но темы не найдены. Выбрана как обычная группа.", show_alert=True)

    if group_id in selected:
        selected.remove(group_id)
    else:
        selected.append(group_id)

    await state.update_data(selected_groups=selected)
    with suppress(TelegramBadRequest):
        await callback.message.edit_reply_markup(reply_markup=get_groups_keyboard(groups, selected, page=page, prefix="mailgrp"))


@router.callback_query(F.data.startswith("mailtopic_"), MailingState.selecting_topic)
async def toggle_mailing_topic(callback: types.CallbackQuery, state: FSMContext):
    parts = callback.data.split("_")
    action = parts[1] # chat_id or done
    
    if action == "done":
        chat_id = int(parts[2])
        # Return to groups list
        data = await state.get_data()
        groups = data.get("available_groups", [])
        selected = data.get("selected_groups", [])
        
        await state.set_state(MailingState.selecting_groups)
        with suppress(TelegramBadRequest):
            await callback.message.edit_text(
                "Выберите группы/каналы для рассылки (можно листать страницы):",
                reply_markup=get_groups_keyboard(groups, selected, prefix="mailgrp")
            )
        return

    if action == "all":
        chat_id = int(parts[2])
        data = await state.get_data()
        topics = data.get("current_topics", [])
        selected_groups = data.get("selected_groups", [])
        current_selected_topics = data.get("current_topics_selected", [])
        
        # Check if we should select all or deselect all
        if len(current_selected_topics) == len(topics):
            # Deselect all
            for t in topics:
                tid = t['id']
                if tid in current_selected_topics:
                    current_selected_topics.remove(tid)
                item_id = f"{chat_id}:{tid}"
                if item_id in selected_groups:
                    selected_groups.remove(item_id)
        else:
            # Select all
            for t in topics:
                tid = t['id']
                if tid not in current_selected_topics:
                    current_selected_topics.append(tid)
                item_id = f"{chat_id}:{tid}"
                if item_id not in selected_groups:
                    selected_groups.append(item_id)
        
        await state.update_data(selected_groups=selected_groups, current_topics_selected=current_selected_topics)
        with suppress(TelegramBadRequest):
            await callback.message.edit_reply_markup(
                reply_markup=get_topics_keyboard(topics, current_selected_topics, chat_id)
            )
        return

    # Toggle topic
    chat_id = int(parts[1])
    topic_id = int(parts[2])
    
    data = await state.get_data()
    selected_groups = data.get("selected_groups", [])
    current_selected_topics = data.get("current_topics_selected", [])
    topics = data.get("current_topics", [])
    
    item_id = f"{chat_id}:{topic_id}"
    
    if topic_id in current_selected_topics:
        current_selected_topics.remove(topic_id)
        if item_id in selected_groups:
            selected_groups.remove(item_id)
    else:
        current_selected_topics.append(topic_id)
        if item_id not in selected_groups:
            selected_groups.append(item_id)
            
    await state.update_data(selected_groups=selected_groups, current_topics_selected=current_selected_topics)
    
    with suppress(TelegramBadRequest):
        await callback.message.edit_reply_markup(
            reply_markup=get_topics_keyboard(topics, current_selected_topics, chat_id)
        )


@router.callback_query(F.data == "mailgrps_done", MailingState.selecting_groups)
async def finish_group_selection(callback: types.CallbackQuery, state: FSMContext):
    data = await state.get_data()
    selected_groups = data.get("selected_groups", [])

    if not selected_groups:
        await callback.answer("Сначала выберите хотя бы одну группу", show_alert=True)
        return

    if "start_time" not in data:
        await state.update_data(start_time="00:00", end_time="23:59", interval=30)

    data = await state.get_data()
    await state.set_state(MailingState.configuring_schedule)

    await callback.message.edit_text(
        _format_schedule_summary(data),
        reply_markup=get_scheduling_keyboard(data["start_time"], data["end_time"], data["interval"]),
    )


@router.callback_query(F.data == "mailgrps_back", MailingState.configuring_schedule)
async def back_to_groups(callback: types.CallbackQuery, state: FSMContext):
    data = await state.get_data()
    groups = data.get("available_groups", [])
    selected = data.get("selected_groups", [])
    await state.set_state(MailingState.selecting_groups)
    with suppress(TelegramBadRequest):
        await callback.message.edit_text(
            "Вернулись к выбору групп. Отметьте нужные чаты:",
            reply_markup=get_groups_keyboard(groups, selected, prefix="mailgrp"),
        )


@router.callback_query(F.data.startswith("sched_edit_"), MailingState.configuring_schedule)
async def edit_schedule_field(callback: types.CallbackQuery, state: FSMContext):
    field = callback.data.split("_")[2]  # start | end | interval
    data = await state.get_data()
    current = data["start_time"] if field == "start" else data["end_time"] if field == "end" else str(data["interval"])

    await state.set_state(MailingState.editing_schedule)
    await state.update_data(editing_field=field, numpad_input=current.replace(":", ""))

    with suppress(TelegramBadRequest):
        await callback.message.edit_text(
            _format_schedule_prompt(data, field, current.replace(":", "")),
            reply_markup=get_number_numpad("schednum", current.replace(":", ""), allow_dot=(field == "interval")),
        )


@router.callback_query(F.data.startswith("schednum_"), MailingState.editing_schedule)
async def handle_schedule_numpad(callback: types.CallbackQuery, state: FSMContext):
    _, action, value = callback.data.split("_", 2) if callback.data.count("_") == 2 else (callback.data.split("_")[0], callback.data.split("_")[1], "")
    data = await state.get_data()
    field = data.get("editing_field")
    current = data.get("numpad_input", "")

    if action == "digit":
        if field in ("start", "end") and len(current) < 4:
            current += value
        elif field == "interval" and len(current) < 8: # Allow longer for X.Y.Z
            current += value
    elif action == "dot":
        if field == "interval" and "." not in current: # Allow dots for interval
             current += "."
        elif field == "interval" and current.count(".") < 2: # Allow up to 2 dots (H.M.S)
             current += "."
    elif action == "back":
        current = current[:-1]
    elif action == "done":
        if field in ("start", "end"):
            if len(current) < 3:
                await callback.answer("Введите время ЧЧММ (например, 0930)", show_alert=True)
                return
            try:
                hhmm = current.zfill(4)
                hour = min(max(int(hhmm[:2]), 0), 23)
                minute = min(max(int(hhmm[2:]), 0), 59)
                value_str = f"{hour:02d}:{minute:02d}"
                if field == "start":
                    data["start_time"] = value_str
                else:
                    data["end_time"] = value_str
            except ValueError:
                await callback.answer("Неверное время", show_alert=True)
                return
        else:
            if not current:
                await callback.answer("Введите время (например 5 или 5.30)", show_alert=True)
                return
            
            # Parse using the new utility
            from bot.services.time_util import parse_time_input
            seconds = parse_time_input(current)
            
            # Enforce minimum interval
            from config import ADMIN_IDS
            min_interval = 10 if callback.from_user.id in ADMIN_IDS else 300
            
            interval = max(min_interval, min(seconds, 86400))
            data["interval"] = interval

        await state.update_data(**data)
        await state.set_state(MailingState.configuring_schedule)
        with suppress(TelegramBadRequest):
            await callback.message.edit_text(
                _format_schedule_summary(data),
                reply_markup=get_scheduling_keyboard(data["start_time"], data["end_time"], data["interval"]),
            )
        return

    await state.update_data(numpad_input=current)
    with suppress(TelegramBadRequest):
        await callback.message.edit_text(
            _format_schedule_prompt(data, field, current),
            reply_markup=get_number_numpad("schednum", current, allow_dot=(field == "interval")),
        )


@router.callback_query(F.data == "mailing_confirm", MailingState.configuring_schedule)
async def confirm_mailing(callback: types.CallbackQuery, state: FSMContext):
    data = await state.get_data()
    template_id = data.get("selected_template_id")
    selected_groups = data.get("selected_groups", [])

    if not template_id or not selected_groups:
        await callback.answer("Нет выбранного шаблона или групп", show_alert=True)
        return

    from config import ADMIN_IDS
    min_interval = 10 if callback.from_user.id in ADMIN_IDS else 300
    
    interval = max(min_interval, int(data.get("interval", 300)))
    data["interval"] = interval
    if len(selected_groups) > 50:
        await callback.answer("Слишком много групп. Ограничьте до 50, чтобы не получить бан.", show_alert=True)
        return

    task_id = await add_scheduled_task(
        callback.from_user.id,
        template_id,
        json.dumps(selected_groups),
        data["start_time"],
        data["end_time"],
        interval,
    )
    schedule_mailing_task(task_id, callback.from_user.id, template_id, selected_groups, data["start_time"], data["end_time"], interval, run_immediately=True)
    await state.clear()

    user = await get_user(callback.from_user.id)
    lang = user[2] if user else "ru"

    from bot.services.time_util import format_seconds
    interval_str = format_seconds(interval)
    
    with suppress(TelegramBadRequest):
        await callback.message.edit_text(
            f"Готово! Задача создана. Интервал: {interval_str}; внутри рассылки есть паузы 5–15 секунд между группами, чтобы уменьшить риск бана.",
            reply_markup=get_main_menu_keyboard(callback.from_user.id, lang),
        )

@router.callback_query(F.data == "mailing_list")
async def show_active_tasks(callback: types.CallbackQuery):
    from bot.database.database import get_user_active_tasks
    from bot.keyboards.mailing import get_tasks_list_keyboard
    
    tasks = await get_user_active_tasks(callback.from_user.id)
    with suppress(TelegramBadRequest):
        if not tasks:
            await callback.message.edit_text("Нет активных задач.", reply_markup=get_mailing_menu_keyboard())
            return
        
        await callback.message.edit_text("Ваши активные задачи:", reply_markup=get_tasks_list_keyboard(tasks))

@router.callback_query(F.data.startswith("task_view_"))
async def view_task_details(callback: types.CallbackQuery):
    from bot.keyboards.mailing import get_task_actions_keyboard
    from bot.services.time_util import format_seconds
    
    task_id = int(callback.data.split("_")[2])
    # Ideally fetch task details again or pass them. 
    # For now, let's just show actions.
    # We can fetch details if we want to show them.
    
    with suppress(TelegramBadRequest):
        await callback.message.edit_text(
            f"Задача #{task_id}\nЧто сделать?",
            reply_markup=get_task_actions_keyboard(task_id)
        )

@router.callback_query(F.data.startswith("task_stop_"))
async def stop_task_handler(callback: types.CallbackQuery):
    from bot.database.database import deactivate_task
    from bot.services.scheduler import stop_mailing_job
    
    task_id = int(callback.data.split("_")[2])
    
    await deactivate_task(task_id)
    stop_mailing_job(task_id)
    
    await callback.answer("Задача остановлена", show_alert=True)
    await show_active_tasks(callback)
