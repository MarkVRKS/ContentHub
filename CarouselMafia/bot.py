"""
╔══════════════════════════════════════════════════════╗
║         CAROUSEL MAFIA — Движок Семьи v4.0           ║
║         bot.py — Точка входа, инициализация          ║
╚══════════════════════════════════════════════════════╝
"""

import asyncio
import logging
import os

from aiogram import Bot, Dispatcher
from aiogram.client.session.aiohttp import AiohttpSession
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from dotenv import load_dotenv

from database import init_db, close_db
from handlers import router
from scheduler import setup_scheduler

# ── Логирование ──────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("carousel_mafia.bot")

load_dotenv()


async def main() -> None:
    token = os.getenv("BOT_TOKEN")
    if not token:
        raise RuntimeError("BOT_TOKEN не найден в .env. Семья недовольна.")

    # ── Планировщик ───────────────────────────────────────────────────────────
    scheduler = AsyncIOScheduler(timezone="Europe/Moscow")

    # ── Сессия / прокси ───────────────────────────────────────────────────────
    if "PYTHONANYWHERE_SITE" in os.environ:
        session = AiohttpSession(proxy="http://proxy.server:3128")
        bot = Bot(token=token, session=session)
        log.info("Движок запущен на PythonAnywhere (через прокси)")
    else:
        bot = Bot(token=token)
        log.info("Движок запущен локально — Консильери на связи.")

    # ── Диспетчер ─────────────────────────────────────────────────────────────
    dp = Dispatcher()
    dp.include_router(router)

    # Передаём bot и scheduler в workflow_data, чтобы scheduler мог слать посты
    dp["scheduler"] = scheduler
    dp["bot"] = bot

    # ── Жизненный цикл пула БД ───────────────────────────────────────────────
    async def on_startup() -> None:
        await init_db()
        log.info("База данных инициализирована — архивы Семьи открыты (Postgres/Neon).")

    async def on_shutdown() -> None:
        await close_db()

    dp.startup.register(on_startup)
    dp.shutdown.register(on_shutdown)

    setup_scheduler(scheduler, bot)
    scheduler.start()
    log.info("Планировщик запущен — Семья не забывает о долгах.")

    await bot.delete_webhook(drop_pending_updates=True)
    log.info("Бот поднят — Дон принимает гостей.")

    try:
        await dp.start_polling(bot, scheduler=scheduler)
    finally:
        scheduler.shutdown(wait=False)
        log.info("Движок остановлен — Дон ушёл на покой.")

if __name__ == "__main__":
    asyncio.run(main())
