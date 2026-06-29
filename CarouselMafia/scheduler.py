"""
╔══════════════════════════════════════════════════════╗
║   scheduler.py — Смотрящий за временем               ║
╚══════════════════════════════════════════════════════╝
"""

import logging
from datetime import datetime

from aiogram import Bot
from aiogram.types import InputMediaPhoto, InputMediaVideo, InputMediaAnimation, InputMediaAudio
from apscheduler.schedulers.asyncio import AsyncIOScheduler

import database as db
from keyboards import kb_carousel_nav

log = logging.getLogger("carousel_mafia.scheduler")


def setup_scheduler(scheduler: AsyncIOScheduler, bot: Bot) -> None:
    """Восстанавливает незавершённые задачи из БД при старте."""

    async def restore_jobs():
        pending = await db.get_pending_scheduled_posts()
        now = datetime.utcnow().timestamp()
        for post in pending:
            if post["scheduled_at"] <= now:
                # Время уже прошло — публикуем немедленно
                await publish_carousel_job(
                    bot, post["carousel_id"], post["channel"], post["job_id"]
                )
            else:
                run_time = datetime.utcfromtimestamp(post["scheduled_at"])
                scheduler.add_job(
                    publish_carousel_job,
                    trigger="date",
                    run_date=run_time,
                    args=[bot, post["carousel_id"], post["channel"], post["job_id"]],
                    id=post["job_id"],
                    replace_existing=True,
                )
        if pending:
            log.info("Восстановлено %d отложенных публикаций.", len(pending))

    scheduler.add_job(restore_jobs, trigger="date", run_date=datetime.utcnow())


async def publish_carousel_job(
    bot: Bot, carousel_id: str, channel: str, job_id: str
) -> None:
    """Задача планировщика: опубликовать первый слайд карусели в канал."""
    try:
        carousel = await db.get_carousel(carousel_id)
        if not carousel:
            log.warning("Карусель %s не найдена при публикации.", carousel_id)
            return

        slides = carousel["slides"]
        first = slides[0]
        keyboard = kb_carousel_nav(carousel_id, 0, len(slides), is_preview=False, custom_btn=first.get("custom_btn"))

        message_id = await _send_slide(bot, channel, first, keyboard)
        await db.save_published_post(carousel_id, channel, message_id)
        await db.set_carousel_status(carousel_id, "published")
        await db.mark_scheduled_done(job_id)
        log.info("Карусель %s опубликована в %s.", carousel_id, channel)
    except Exception as exc:
        log.error("Ошибка публикации карусели %s: %s", carousel_id, exc)


async def _send_slide(bot: Bot, chat_id: str, slide: dict, keyboard) -> int:
    """Вспомогательная функция отправки слайда по типу медиа. Возвращает message_id."""
    media_type = slide.get("type", "photo")
    file_id = slide.get("file_id") or slide.get("photo")
    caption = slide.get("caption", "")

    send_kwargs = dict(chat_id=chat_id, caption=caption, parse_mode="HTML", reply_markup=keyboard)

    if media_type == "photo":
        sent = await bot.send_photo(photo=file_id, **send_kwargs)
    elif media_type == "video":
        sent = await bot.send_video(video=file_id, **send_kwargs)
    elif media_type == "animation":
        sent = await bot.send_animation(animation=file_id, **send_kwargs)
    elif media_type in ("audio", "voice"):
        sent = await bot.send_audio(audio=file_id, **send_kwargs)
    else:
        sent = await bot.send_photo(photo=file_id, **send_kwargs)
    return sent.message_id
