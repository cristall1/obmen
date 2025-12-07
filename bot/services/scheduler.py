import datetime
import json
import logging
from typing import List
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from bot.database.database import get_scheduled_tasks, update_last_run, deactivate_task
from bot.services.poster import run_mailing_task

scheduler = AsyncIOScheduler()


def start_scheduler():
    if not scheduler.running:
        scheduler.start()


def _within_window(start_time: str, end_time: str) -> bool:
    """Check if current time is inside the daily window."""
    now = datetime.datetime.now().time()
    try:
        start = datetime.time.fromisoformat(start_time)
        end = datetime.time.fromisoformat(end_time)
    except ValueError:
        return True  # fallback to always run if bad format

    if start <= end:
        return start <= now <= end
    # window crosses midnight
    return now >= start or now <= end


async def _mailing_job(task_id: int, user_id: int, template_id: int, target_groups: list, start_time: str, end_time: str):
    if not _within_window(start_time, end_time):
        logging.debug(f"Task {task_id} skipped (outside window {start_time}-{end_time})")
        return

    sent = await run_mailing_task(user_id, template_id, target_groups, task_id=task_id)
    if sent:
        await update_last_run(task_id)
    else:
        await deactivate_task(task_id)
        try:
            scheduler.remove_job(f"mailing_{task_id}")
            logging.info(f"Removed job mailing_{task_id} from scheduler due to failure/deactivation")
        except Exception:
            pass


def schedule_mailing_task(task_id: int, user_id: int, template_id: int, target_groups: list, start_time: str, end_time: str, interval_minutes: int, run_immediately: bool = False):
    job_id = f"mailing_{task_id}"
    kwargs = {"next_run_time": datetime.datetime.now()} if run_immediately else {}
    scheduler.add_job(
        _mailing_job,
        trigger="interval",
        seconds=max(interval_minutes, 10),
        args=(task_id, user_id, template_id, target_groups, start_time, end_time),
        id=job_id,
        replace_existing=True,
        coalesce=True,
        **kwargs
    )
    logging.info(f"Scheduled mailing task {task_id} every {max(interval_minutes, 10)} seconds ({start_time}-{end_time})")


def stop_mailing_job(task_id: int):
    job_id = f"mailing_{task_id}"
    try:
        scheduler.remove_job(job_id)
        logging.info(f"Stopped mailing job {job_id}")
    except Exception:
        pass


async def load_scheduled_mailings():
    tasks = await get_scheduled_tasks()
    for task in tasks:
        try:
            raw_groups = json.loads(task["target_groups"]) if task["target_groups"] else []
            target_groups = []
            for g in raw_groups:
                try:
                    # Support both int IDs and string "chat_id:topic_id"
                    if isinstance(g, str) and ":" in g:
                        target_groups.append(g)
                    else:
                        target_groups.append(int(g))
                except Exception:
                    logging.warning(f"Skip invalid chat id in task {task['id']}: {g}")
            interval = int(task["interval_minutes"] or 60)
            schedule_mailing_task(
                task["id"],
                task["user_id"],
                task["template_id"],
                target_groups,
                task["start_time"] or "00:00",
                task["end_time"] or "23:59",
                interval,
            )
        except Exception as e:
            logging.error(f"Failed to schedule task {task['id']}: {e}")
