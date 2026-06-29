"""
╔══════════════════════════════════════════════════════╗
║         database.py — Архивы и летописи Семьи        ║
║         (PostgreSQL / asyncpg edition)                ║
╚══════════════════════════════════════════════════════╝
"""

import json
import logging
import os
from typing import Optional

import asyncpg

log = logging.getLogger("carousel_mafia.db")

# ══════════════════════════════════════════════════════════════════════════════
# ПУЛ СОЕДИНЕНИЙ
# ══════════════════════════════════════════════════════════════════════════════

# Глобальный пул соединений. Создаётся в init_db(), закрывается в close_db().
pool: Optional[asyncpg.Pool] = None


async def init_db() -> None:
    """Создаёт пул соединений к Postgres (Neon) и проверяет/создаёт схему."""
    global pool

    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL не найден в окружении. Семья недовольна.")

    pool = await asyncpg.create_pool(
        dsn=database_url,
        min_size=1,
        max_size=10,
        # Neon засыпает / разрывает простаивающие соединения — таймаут команд
        # не даёт зависшему соединению вешать весь пул навечно.
        command_timeout=60,
    )

    async with pool.acquire() as conn:
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS carousels (
                id          TEXT PRIMARY KEY,
                owner_id    BIGINT,
                title       TEXT,
                slides_json TEXT             NOT NULL,
                status      TEXT             NOT NULL DEFAULT 'draft',
                created_at  DOUBLE PRECISION NOT NULL DEFAULT EXTRACT(EPOCH FROM now())
            )
            """
        )
        await _migrate_carousels(conn)

        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS scheduled_posts (
                id           SERIAL PRIMARY KEY,
                carousel_id  TEXT             NOT NULL,
                channel      TEXT             NOT NULL,
                scheduled_at DOUBLE PRECISION NOT NULL,
                job_id       TEXT             NOT NULL UNIQUE,
                done         INTEGER          NOT NULL DEFAULT 0,
                FOREIGN KEY (carousel_id) REFERENCES carousels(id)
            )
            """
        )
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS carousel_stats (
                carousel_id       TEXT    NOT NULL,
                user_id           BIGINT  NOT NULL,
                max_slide_reached INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY (carousel_id, user_id)
            )
            """
        )
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS published_posts (
                carousel_id   TEXT             NOT NULL,
                channel       TEXT             NOT NULL,
                message_id    INTEGER          NOT NULL,
                published_at  DOUBLE PRECISION NOT NULL DEFAULT EXTRACT(EPOCH FROM now()),
                PRIMARY KEY (carousel_id, channel)
            )
            """
        )

    log.info("Таблицы созданы / проверены (PostgreSQL).")


async def close_db() -> None:
    """Закрывает пул соединений. Вызывать при остановке бота."""
    global pool
    if pool is not None:
        await pool.close()
        pool = None
        log.info("Пул соединений с базой закрыт.")


# ══════════════════════════════════════════════════════════════════════════════
# МЯГКАЯ МИГРАЦИЯ (v3 → v4 схемы, для старых таблиц без owner_id/title/...)
# ══════════════════════════════════════════════════════════════════════════════

LEGACY_COLUMNS = {
    "owner_id":   "BIGINT",
    "title":      "TEXT",
    "status":     "TEXT NOT NULL DEFAULT 'draft'",
    "created_at": "DOUBLE PRECISION NOT NULL DEFAULT EXTRACT(EPOCH FROM now())",
}


async def _migrate_carousels(conn: asyncpg.Connection) -> None:
    """Безопасно добавляет недостающие колонки в таблицу carousels (старая БД v3 → v4)."""
    rows = await conn.fetch(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'carousels'"
    )
    existing = {row["column_name"] for row in rows}

    if not existing:
        return

    for col_name, col_type in LEGACY_COLUMNS.items():
        if col_name not in existing:
            try:
                await conn.execute(
                    f"ALTER TABLE carousels ADD COLUMN IF NOT EXISTS {col_name} {col_type}"
                )
                log.info("Миграция: добавлена колонка carousels.%s", col_name)
            except Exception as e:
                log.warning("Миграция carousels.%s пропущена: %s", col_name, e)


# ══════════════════════════════════════════════════════════════════════════════
# КАРУСЕЛИ
# ══════════════════════════════════════════════════════════════════════════════

async def save_carousel(
    carousel_id: str,
    owner_id: int,
    slides: list,
    title: str = "",
    status: str = "draft",
) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO carousels (id, owner_id, title, slides_json, status)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO UPDATE SET
                slides_json = EXCLUDED.slides_json,
                title       = EXCLUDED.title,
                status      = EXCLUDED.status
            """,
            carousel_id, owner_id, title, json.dumps(slides), status,
        )


async def get_carousel(carousel_id: str) -> Optional[dict]:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM carousels WHERE id = $1", carousel_id
        )
        if row:
            d = dict(row)
            d["slides"] = json.loads(d["slides_json"])
            return d
    return None


async def get_drafts(owner_id: int) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, title, created_at FROM carousels "
            "WHERE owner_id = $1 AND status = 'draft' ORDER BY created_at DESC",
            owner_id,
        )
        return [dict(r) for r in rows]


async def get_published_carousels(owner_id: int) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, title, created_at FROM carousels "
            "WHERE owner_id = $1 AND status = 'published' ORDER BY created_at DESC",
            owner_id,
        )
        return [dict(r) for r in rows]


async def set_carousel_status(carousel_id: str, status: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE carousels SET status = $1 WHERE id = $2", status, carousel_id
        )


# ══════════════════════════════════════════════════════════════════════════════
# ОПУБЛИКОВАННЫЕ ПОСТЫ
# ══════════════════════════════════════════════════════════════════════════════

async def save_published_post(carousel_id: str, channel: str, message_id: int) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO published_posts (carousel_id, channel, message_id)
            VALUES ($1, $2, $3)
            ON CONFLICT (carousel_id, channel) DO UPDATE SET
                message_id   = EXCLUDED.message_id,
                published_at = EXTRACT(EPOCH FROM now())
            """,
            carousel_id, channel, message_id,
        )


async def get_published_post(carousel_id: str) -> Optional[dict]:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT channel, message_id FROM published_posts WHERE carousel_id = $1",
            carousel_id,
        )
        if row:
            return dict(row)
    return None


async def delete_published_post(carousel_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "DELETE FROM published_posts WHERE carousel_id = $1", carousel_id
        )


# ══════════════════════════════════════════════════════════════════════════════
# ОТЛОЖЕННЫЕ ПУБЛИКАЦИИ
# ══════════════════════════════════════════════════════════════════════════════

async def save_scheduled_post(
    carousel_id: str, channel: str, scheduled_at: float, job_id: str
) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO scheduled_posts (carousel_id, channel, scheduled_at, job_id)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (job_id) DO UPDATE SET
                carousel_id  = EXCLUDED.carousel_id,
                channel      = EXCLUDED.channel,
                scheduled_at = EXCLUDED.scheduled_at
            """,
            carousel_id, channel, scheduled_at, job_id,
        )


async def mark_scheduled_done(job_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE scheduled_posts SET done = 1 WHERE job_id = $1", job_id
        )


async def get_pending_scheduled_posts() -> list[dict]:
    """Нужно для восстановления задач планировщика при перезапуске."""
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM scheduled_posts WHERE done = 0")
        return [dict(r) for r in rows]


# ══════════════════════════════════════════════════════════════════════════════
# АНАЛИТИКА
# ══════════════════════════════════════════════════════════════════════════════

async def record_slide_view(carousel_id: str, user_id: int, slide_index: int) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO carousel_stats (carousel_id, user_id, max_slide_reached)
            VALUES ($1, $2, $3)
            ON CONFLICT (carousel_id, user_id) DO UPDATE SET
                max_slide_reached = GREATEST(carousel_stats.max_slide_reached, EXCLUDED.max_slide_reached)
            """,
            carousel_id, user_id, slide_index,
        )


async def get_carousel_stats(carousel_id: str) -> dict:
    async with pool.acquire() as conn:
        total = await conn.fetchval(
            "SELECT COUNT(DISTINCT user_id) FROM carousel_stats WHERE carousel_id = $1",
            carousel_id,
        ) or 0

        # Узнаём кол-во слайдов
        carousel = await get_carousel(carousel_id)
        if not carousel:
            return {"total": 0, "finished": 0, "finish_pct": 0.0}

        last_idx = len(carousel["slides"]) - 1

        finished = await conn.fetchval(
            "SELECT COUNT(DISTINCT user_id) FROM carousel_stats "
            "WHERE carousel_id = $1 AND max_slide_reached >= $2",
            carousel_id, last_idx,
        ) or 0

    finish_pct = round(finished / total * 100, 1) if total else 0.0
    return {
        "total": total,
        "finished": finished,
        "finish_pct": finish_pct,
        "title": carousel.get("title", carousel_id),
    }