"""
╔══════════════════════════════════════════════════════╗
║   handlers.py — Все сцены и диалоги Семьи            ║
╚══════════════════════════════════════════════════════╝
"""

import logging
import re
import uuid
from datetime import datetime

from aiogram import Bot, F, Router
from aiogram.exceptions import TelegramBadRequest
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import (
    CallbackQuery,
    InputMediaAnimation,
    InputMediaAudio,
    InputMediaPhoto,
    InputMediaVideo,
    Message,
)
from apscheduler.schedulers.asyncio import AsyncIOScheduler

import database as db
from guide import GUIDE_STEPS
from keyboards import (
    kb_add_button_prompt,
    kb_carousel_nav,
    kb_drafts,
    kb_during_build,
    kb_edit_actions,
    kb_edit_slide_list,
    kb_guide,
    kb_main_menu,
    kb_publish_options,
    kb_stats_carousels,
    main_reply_kb,
)
from scheduler import publish_carousel_job

log = logging.getLogger("carousel_mafia.handlers")
router = Router()


# ══════════════════════════════════════════════════════════════════════════════
# СОСТОЯНИЯ FSM
# ══════════════════════════════════════════════════════════════════════════════

class Build(StatesGroup):
    waiting_title      = State()   # Заголовок лонгрида
    collecting_slides  = State()   # Сбор слайдов
    awaiting_url_btn   = State()   # Ждём текст+url для кнопки
    waiting_channel    = State()   # Имя канала для публикации
    waiting_schedule   = State()   # Дата/время отложенной публикации
    editing_media      = State()   # Ждём новое медиа для слайда
    editing_caption    = State()   # Ждём новый caption
    editing_btn        = State()   # Ждём новый текст+url кнопки


# ══════════════════════════════════════════════════════════════════════════════
# ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
# ══════════════════════════════════════════════════════════════════════════════

def _extract_slide_from_message(message: Message) -> dict | None:
    """Парсим входящее сообщение и возвращаем стандартизированный слайд."""
    caption = message.html_text or ""

    if message.photo:
        return {"type": "photo", "file_id": message.photo[-1].file_id, "caption": caption, "custom_btn": None}
    if message.video:
        return {"type": "video", "file_id": message.video.file_id, "caption": caption, "custom_btn": None}
    if message.animation:
        return {"type": "animation", "file_id": message.animation.file_id, "caption": caption, "custom_btn": None}
    if message.audio:
        return {"type": "audio", "file_id": message.audio.file_id, "caption": caption, "custom_btn": None}
    if message.voice:
        return {"type": "voice", "file_id": message.voice.file_id, "caption": caption, "custom_btn": None}
    return None


def _build_input_media(slide: dict, caption_override: str | None = None):
    """Конвертирует слайд в InputMedia* для edit_media."""
    caption = caption_override if caption_override is not None else slide.get("caption", "")
    fid = slide.get("file_id") or slide.get("photo")
    kwargs = dict(media=fid, caption=caption, parse_mode="HTML")

    t = slide.get("type", "photo")
    if t == "photo":
        return InputMediaPhoto(**kwargs)
    if t == "video":
        return InputMediaVideo(**kwargs)
    if t == "animation":
        return InputMediaAnimation(**kwargs)
    if t in ("audio", "voice"):
        return InputMediaAudio(**kwargs)
    return InputMediaPhoto(**kwargs)


async def _safe_edit_text(message: Message, text: str, **kwargs):
    from aiogram.exceptions import TelegramBadRequest
    try:
        await message.edit_text(text, **kwargs)
    except TelegramBadRequest as e:
        if "message is not modified" in str(e).lower():
            return
        try:
            await message.delete()
        except Exception:
            pass
        await message.answer(text, **kwargs)


async def _send_slide(
    target,          # Message или Bot с chat_id
    slide: dict,
    keyboard,
    *,
    chat_id: str | int | None = None,
    bot: Bot | None = None,
):
    """Отправить слайд в чат (первый слайд карусели при публикации)."""
    t = slide.get("type", "photo")
    fid = slide.get("file_id") or slide.get("photo")
    cap = slide.get("caption", "")
    kw = dict(caption=cap, parse_mode="HTML", reply_markup=keyboard)

    if chat_id and bot:
        send = getattr(bot, f"send_{t if t not in ('voice',) else 'audio'}")
        arg_name = t if t not in ("voice",) else "audio"
        return await send(**{arg_name: fid, "chat_id": chat_id, **kw})
    else:
        send = getattr(target, f"answer_{t if t not in ('voice',) else 'audio'}")
        arg_name = t if t not in ("voice",) else "audio"
        return await send(**{arg_name: fid, **kw})


async def apply_edit_to_channel(bot: Bot, carousel: dict, cid: str) -> None:
    """Обновить первый слайд опубликованного поста в канале (если есть)."""
    pub = await db.get_published_post(cid)
    if not pub:
        return

    channel = pub["channel"]
    message_id = pub["message_id"]
    slides = carousel["slides"]
    if not slides:
        return

    first = slides[0]
    keyboard = kb_carousel_nav(cid, 0, len(slides), is_preview=False, custom_btn=first.get("custom_btn"))

    try:
        new_media = _build_input_media(first)
        await bot.edit_message_media(
            chat_id=channel,
            message_id=message_id,
            media=new_media,
            reply_markup=keyboard,
        )
    except Exception as e:
        log.warning("Не удалось обновить пост в канале %s: %s", channel, e)


# ══════════════════════════════════════════════════════════════════════════════
# ГЛОБАЛЬНАЯ КНОПКА «ГОЛНОЕ МЕНЮ» (Reply Keyboard)
# ══════════════════════════════════════════════════════════════════════════════

@router.message(F.text == "🎩 Главное меню")
async def handle_main_menu_button(message: Message, state: FSMContext):
    await state.set_state(None)
    await message.answer(
        "🤌 <b>Главное меню:</b>",
        parse_mode="HTML",
        reply_markup=kb_main_menu(),
    )


# ══════════════════════════════════════════════════════════════════════════════
# /start  /help
# ══════════════════════════════════════════════════════════════════════════════

@router.message(Command("start", "help"))
async def cmd_start(message: Message, state: FSMContext):
    await state.clear()
    await message.answer(
        "🤌 <b>Carousel Mafia v4.0</b>\n\n"
        "Бенвенуто, амиго. Семья рада твоему визиту.\n"
        "Здесь мы строим лонгриды, от которых не оторваться.\n\n"
        "Выбери своё дело:",
        parse_mode="HTML",
        reply_markup=kb_main_menu(),
    )
    await message.answer(
        "Панель управления Семьей 👇",
        reply_markup=main_reply_kb,
    )


# ══════════════════════════════════════════════════════════════════════════════
# ГЛАВНОЕ МЕНЮ — callback-обработчики
# ══════════════════════════════════════════════════════════════════════════════

@router.callback_query(F.data == "menu_new")
async def cb_menu_new(callback: CallbackQuery, state: FSMContext):
    await state.set_state(None)
    await state.set_state(Build.waiting_title)
    await callback.answer()
    await _safe_edit_text(
        callback.message,
        "🖊 <b>Как назовём этот лонгрид?</b>\n\n"
        "Дай название — оно помогает найти его среди черновиков.\n"
        "<i>(Или отправь /skip, чтобы пропустить)</i>",
        parse_mode="HTML",
    )


@router.message(Build.waiting_title, Command("skip"))
@router.message(Build.waiting_title)
async def handle_title(message: Message, state: FSMContext):
    title = "" if message.text and message.text.startswith("/") else (message.text or "")
    cid = str(uuid.uuid4())[:8]

    await state.update_data(slides=[], carousel_id=cid, title=title)
    await state.set_state(Build.collecting_slides)

    # Сохраняем пустой черновик сразу
    await db.save_carousel(cid, message.from_user.id, [], title=title, status="draft")

    await message.answer(
        f"🛠 <b>Сборка лонгрида начата.</b>\n"
        f"ID: <code>{cid}</code>  |  Название: <i>{title or 'без названия'}</i>\n\n"
        "Отправляй слайды один за другим:\n"
        "📷 Фото  |  🎬 Видео  |  🎞 GIF  |  🎵 Аудио/Войс\n\n"
        "<i>К каждому медиа добавь подпись (caption).</i>",
        parse_mode="HTML",
    )


@router.callback_query(F.data == "menu_drafts")
async def cb_menu_drafts(callback: CallbackQuery):
    drafts = await db.get_drafts(callback.from_user.id)
    if not drafts:
        await callback.answer("У тебя нет черновиков, амиго.", show_alert=True)
        return
    await callback.answer()
    await _safe_edit_text(
        callback.message,
        "📂 <b>Твои черновики:</b>\n\nВыбери, к которому вернуться:",
        parse_mode="HTML",
        reply_markup=kb_drafts(drafts),
    )


@router.callback_query(F.data.startswith("load_draft_"))
async def cb_load_draft(callback: CallbackQuery, state: FSMContext):
    cid = callback.data.split("load_draft_")[1]
    carousel = await db.get_carousel(cid)
    if not carousel:
        await callback.answer("Черновик не найден.", show_alert=True)
        return

    await state.set_state(Build.collecting_slides)
    await state.update_data(
        slides=carousel["slides"],
        carousel_id=cid,
        title=carousel.get("title", ""),
    )
    n = len(carousel["slides"])
    await callback.answer()
    await _safe_edit_text(
        callback.message,
        f"📂 <b>Черновик загружен.</b>\n"
        f"Уже добавлено слайдов: <b>{n}</b>\n\n"
        "Продолжай отправлять медиа или заверши сборку.",
        parse_mode="HTML",
        reply_markup=kb_during_build(n),
    )


@router.callback_query(F.data == "menu_stats")
async def cb_menu_stats(callback: CallbackQuery):
    carousels = await db.get_published_carousels(callback.from_user.id)
    if not carousels:
        await callback.answer("Нет опубликованных лонгридов.", show_alert=True)
        return
    await callback.answer()
    await _safe_edit_text(
        callback.message,
        "📊 <b>Сбор Дани — Аналитика</b>\n\nВыбери лонгрид:",
        parse_mode="HTML",
        reply_markup=kb_stats_carousels(carousels),
    )


@router.callback_query(F.data.startswith("stats_"))
async def cb_show_stats(callback: CallbackQuery):
    cid = callback.data.split("stats_")[1]
    stats = await db.get_carousel_stats(cid)
    await callback.answer()
    await _safe_edit_text(
        callback.message,
        f"📊 <b>Статистика: {stats['title']}</b>\n\n"
        f"👥 Уникальных зрителей: <b>{stats['total']}</b>\n"
        f"✅ Дочитали до конца: <b>{stats['finished']}</b>\n"
        f"📈 Дочитываемость: <b>{stats['finish_pct']}%</b>",
        parse_mode="HTML",
        reply_markup=kb_stats_carousels([]),
    )


@router.callback_query(F.data == "menu_guide")
async def cb_menu_guide(callback: CallbackQuery):
    step = GUIDE_STEPS[0]
    await callback.answer()
    await _safe_edit_text(
        callback.message,
        f"{step['title']}\n\n{step['text']}",
        parse_mode="HTML",
        reply_markup=kb_guide(0, len(GUIDE_STEPS)),
    )


@router.callback_query(F.data.startswith("guide_"))
async def cb_guide_navigate(callback: CallbackQuery):
    idx = int(callback.data.split("guide_")[1])
    if not 0 <= idx < len(GUIDE_STEPS):
        await callback.answer()
        return
    step = GUIDE_STEPS[idx]
    await callback.answer()
    await _safe_edit_text(
        callback.message,
        f"{step['title']}\n\n{step['text']}",
        parse_mode="HTML",
        reply_markup=kb_guide(idx, len(GUIDE_STEPS)),
    )


@router.callback_query(F.data == "menu_back")
async def cb_menu_back(callback: CallbackQuery, state: FSMContext):
    await state.set_state(None)
    await callback.answer()
    await _safe_edit_text(
        callback.message,
        "🤌 <b>Главное меню:</b>",
        parse_mode="HTML",
        reply_markup=kb_main_menu(),
    )


# ══════════════════════════════════════════════════════════════════════════════
# СБОРКА КАРУСЕЛИ — приём медиа
# ══════════════════════════════════════════════════════════════════════════════

@router.message(Build.collecting_slides, F.photo | F.video | F.animation | F.audio | F.voice)
async def process_slide(message: Message, state: FSMContext):
    slide = _extract_slide_from_message(message)
    if not slide:
        await message.answer("⚠️ Тип медиа не распознан.")
        return

    data = await state.get_data()
    slides = data.get("slides", [])
    slides.append(slide)

    # Сохраняем индекс последнего добавленного слайда для последующего добавления кнопки
    await state.update_data(slides=slides, pending_slide_idx=len(slides) - 1)

    # Сохраняем черновик после каждого слайда
    cid = data.get("carousel_id")
    await db.save_carousel(cid, message.from_user.id, slides, title=data.get("title", ""), status="draft")

    type_emoji = {"photo": "📷", "video": "🎬", "animation": "🎞", "audio": "🎵", "voice": "🎙"}.get(slide["type"], "📎")
    await message.reply(
        f"{type_emoji} <b>Слайд #{len(slides)} принят.</b>\n\n"
        "Хочешь добавить кнопку-ссылку на этот слайд?",
        parse_mode="HTML",
        reply_markup=kb_add_button_prompt(),
    )


@router.message(Build.collecting_slides)
async def process_wrong_type(message: Message):
    await message.answer(
        "⚠️ Нужно медиа: фото, видео, GIF, аудио или войс.\n"
        "Текст в описании (caption) — допустим.",
    )


# ══════════════════════════════════════════════════════════════════════════════
# КАСТОМНАЯ КНОПКА-ССЫЛКА
# ══════════════════════════════════════════════════════════════════════════════

@router.callback_query(F.data == "add_url_btn", Build.collecting_slides)
async def cb_add_url_btn(callback: CallbackQuery, state: FSMContext):
    await state.set_state(Build.awaiting_url_btn)
    await callback.answer()
    await _safe_edit_text(
        callback.message,
        "🔗 <b>Отправь данные кнопки в формате:</b>\n\n"
        "<code>Текст кнопки | https://example.com</code>\n\n"
        "<i>Разделитель — вертикальная черта '|'</i>",
        parse_mode="HTML",
    )


@router.callback_query(F.data == "skip_url_btn")
async def cb_skip_url_btn(callback: CallbackQuery, state: FSMContext):
    data = await state.get_data()
    n = len(data.get("slides", []))
    await state.set_state(Build.collecting_slides)
    await callback.answer()
    await _safe_edit_text(
        f"⏭ Пропущено. Слайдов собрано: <b>{n}</b>\n\n"
        "Продолжай отправлять медиа или заверши сборку.",
        parse_mode="HTML",
        reply_markup=kb_during_build(n),
    )


@router.message(Build.awaiting_url_btn)
async def process_url_btn(message: Message, state: FSMContext):
    text = message.text or ""
    # Ищем разделитель |
    parts = [p.strip() for p in text.split("|", 1)]
    if len(parts) != 2 or not parts[1].startswith("http"):
        await message.answer(
            "⚠️ Неверный формат. Нужно:\n"
            "<code>Текст кнопки | https://example.com</code>",
            parse_mode="HTML",
        )
        return

    btn_text, btn_url = parts
    data = await state.get_data()
    slides = data.get("slides", [])
    idx = data.get("pending_slide_idx", len(slides) - 1)

    if idx < len(slides):
        slides[idx]["custom_btn"] = {"text": btn_text, "url": btn_url}

    cid = data.get("carousel_id")
    await db.save_carousel(cid, message.from_user.id, slides, title=data.get("title", ""), status="draft")
    await state.update_data(slides=slides)
    await state.set_state(Build.collecting_slides)

    n = len(slides)
    await message.answer(
        f"✅ Кнопка <b>«{btn_text}»</b> добавлена к слайду #{idx + 1}.\n\n"
        f"Слайдов собрано: <b>{n}</b>\n"
        "Продолжай или завершай сборку.",
        parse_mode="HTML",
        reply_markup=kb_during_build(n),
    )


# ══════════════════════════════════════════════════════════════════════════════
# ФИНАЛИЗАЦИЯ КАРУСЕЛИ
# ══════════════════════════════════════════════════════════════════════════════

@router.callback_query(F.data == "finish_carousel", Build.collecting_slides)
async def cb_finish_carousel(callback: CallbackQuery, state: FSMContext):
    data = await state.get_data()
    slides = data.get("slides", [])

    if not slides:
        await callback.answer("⚠️ Нет ни одного слайда, амиго!", show_alert=True)
        return

    cid = data.get("carousel_id")
    await db.save_carousel(cid, callback.from_user.id, slides, title=data.get("title", ""), status="draft")
    await state.set_state(None)

    first = slides[0]
    keyboard = kb_carousel_nav(cid, 0, len(slides), is_preview=True, custom_btn=first.get("custom_btn"))

    await callback.message.delete()
    await _send_slide(callback.message, first, keyboard)
    await callback.answer()


@router.callback_query(F.data == "save_draft", Build.collecting_slides)
async def cb_save_draft(callback: CallbackQuery, state: FSMContext):
    data = await state.get_data()
    slides = data.get("slides", [])
    cid = data.get("carousel_id")
    await db.save_carousel(cid, callback.from_user.id, slides, title=data.get("title", ""), status="draft")
    await state.set_state(None)
    await callback.answer()
    await _safe_edit_text(
        callback.message,
        f"💾 <b>Черновик сохранён.</b>\n"
        f"ID: <code>{cid}</code>  |  Слайдов: <b>{len(slides)}</b>\n\n"
        "Вернуться сможешь через /start → Черновики.",
        parse_mode="HTML",
    )


# ══════════════════════════════════════════════════════════════════════════════
# ПУБЛИКАЦИЯ — выбор канала и времени
# ══════════════════════════════════════════════════════════════════════════════

@router.callback_query(F.data.startswith("prep_pub_"))
async def cb_prepare_publish(callback: CallbackQuery, state: FSMContext):
    cid = callback.data.split("prep_pub_")[1]
    await state.update_data(pub_carousel_id=cid)
    await state.set_state(Build.waiting_channel)
    await callback.message.answer(
        "📢 <b>Введи юзернейм канала</b> (формат: <code>@имя_канала</code>):\n\n"
        "⚠️ <i>Бот должен быть администратором канала!</i>",
        parse_mode="HTML",
    )
    await callback.answer()


@router.message(Build.waiting_channel)
async def process_channel_input(message: Message, state: FSMContext):
    channel = message.text.strip()
    if not channel.startswith("@"):
        await message.answer("⚠️ Юзернейм должен начинаться с <code>@</code>.", parse_mode="HTML")
        return

    await state.update_data(pub_channel=channel)

    # Переходим к выбору: сейчас или отложить
    data = await state.get_data()
    cid = data.get("pub_carousel_id")
    await message.answer(
        f"📋 Канал: <code>{channel}</code>\n\n"
        "Когда публикуем, Консильери?",
        parse_mode="HTML",
        reply_markup=kb_publish_options(cid),
    )


@router.callback_query(F.data.startswith("pub_now_"))
async def cb_publish_now(callback: CallbackQuery, state: FSMContext, bot: Bot):
    cid = callback.data.split("pub_now_")[1]
    data = await state.get_data()
    channel = data.get("pub_channel")

    if not channel:
        await callback.answer("⚠️ Канал не указан.", show_alert=True)
        return

    carousel = await db.get_carousel(cid)
    if not carousel:
        await callback.answer("❌ Карусель не найдена.", show_alert=True)
        return

    slides = carousel["slides"]
    first = slides[0]
    keyboard = kb_carousel_nav(cid, 0, len(slides), is_preview=False, custom_btn=first.get("custom_btn"))

    await callback.answer()
    try:
        sent = await _send_slide(None, first, keyboard, chat_id=channel, bot=bot)
        await db.save_published_post(cid, channel, sent.message_id)
        await db.set_carousel_status(cid, "published")
        await state.set_state(None)
        await _safe_edit_text(
            callback.message,
            f"🚀 <b>Лонгрид опубликован!</b>\n"
            f"Канал: <code>{channel}</code>",
            parse_mode="HTML",
        )
    except Exception as exc:
        await _safe_edit_text(
            callback.message,
            f"❌ <b>Ошибка публикации:</b>\n<code>{exc}</code>",
            parse_mode="HTML",
        )


@router.callback_query(F.data.startswith("pub_later_"))
async def cb_publish_later(callback: CallbackQuery, state: FSMContext):
    cid = callback.data.split("pub_later_")[1]
    await state.update_data(pub_carousel_id=cid)
    await state.set_state(Build.waiting_schedule)
    await callback.answer()
    await _safe_edit_text(
        callback.message,
        "⏰ <b>Укажи дату и время публикации</b> (МСК):\n\n"
        "Формат: <code>ДД.ММ.ГГГГ ЧЧ:ММ</code>\n"
        "Пример: <code>25.12.2025 18:30</code>",
        parse_mode="HTML",
    )


@router.message(Build.waiting_schedule)
async def process_schedule_time(message: Message, state: FSMContext, scheduler: AsyncIOScheduler, bot: Bot):
    text = message.text.strip()
    try:
        run_dt = datetime.strptime(text, "%d.%m.%Y %H:%M")
    except ValueError:
        await message.answer(
            "⚠️ Неверный формат. Попробуй ещё раз:\n"
            "<code>ДД.ММ.ГГГГ ЧЧ:ММ</code>",
            parse_mode="HTML",
        )
        return

    if run_dt <= datetime.now():
        await message.answer("⚠️ Это время уже в прошлом, амиго.")
        return

    data = await state.get_data()
    cid = data.get("pub_carousel_id")
    channel = data.get("pub_channel")
    job_id = f"post_{cid}_{uuid.uuid4().hex[:6]}"

    # Сохраняем задачу в БД (для восстановления после рестарта)
    await db.save_scheduled_post(cid, channel, run_dt.timestamp(), job_id)

    # Добавляем в планировщик
    scheduler.add_job(
        publish_carousel_job,
        trigger="date",
        run_date=run_dt,
        args=[bot, cid, channel, job_id],
        id=job_id,
    )

    await state.set_state(None)
    await message.answer(
        f"⏰ <b>Готово. Лонгрид запланирован.</b>\n\n"
        f"📅 Дата: <b>{run_dt.strftime('%d.%m.%Y %H:%M')}</b> (МСК)\n"
        f"📢 Канал: <code>{channel}</code>",
        parse_mode="HTML",
    )


# ══════════════════════════════════════════════════════════════════════════════
# РЕДАКТИРОВАНИЕ КАРУСЕЛЕЙ
# ══════════════════════════════════════════════════════════════════════════════

@router.callback_query(F.data.startswith("edit_menu_"))
async def cb_edit_menu(callback: CallbackQuery, state: FSMContext):
    cid = callback.data.split("edit_menu_")[1]
    carousel = await db.get_carousel(cid)
    if not carousel:
        await callback.answer("Карусель не найдена.", show_alert=True)
        return
    if carousel["owner_id"] != callback.from_user.id:
        await callback.answer("Нет доступа.", show_alert=True)
        return

    await state.set_state(None)
    slides = carousel["slides"]
    await state.update_data(edit_carousel_id=cid, slides=slides)
    await callback.answer()
    await _safe_edit_text(
        callback.message,
        "✏️ <b>Редактирование лонгрида</b>\n\n"
        f"Название: <i>{carousel.get('title') or 'без названия'}</i>\n"
        f"Слайдов: <b>{len(slides)}</b>\n\n"
        "Выбери слайд:",
        parse_mode="HTML",
        reply_markup=kb_edit_slide_list(cid, len(slides)),
    )


@router.callback_query(F.data.startswith("edit_slide_"))
async def cb_edit_slide(callback: CallbackQuery, state: FSMContext):
    parts = callback.data.split("edit_slide_")[1]
    idx = int(parts.rsplit("_", 1)[1])
    cid = parts.rsplit("_", 1)[0]

    carousel = await db.get_carousel(cid)
    if not carousel:
        await callback.answer("Карусель не найдена.", show_alert=True)
        return
    if carousel["owner_id"] != callback.from_user.id:
        await callback.answer("Нет доступа.", show_alert=True)
        return

    slides = carousel["slides"]
    if idx >= len(slides):
        await callback.answer("Слайд не найден.", show_alert=True)
        return

    await state.update_data(edit_carousel_id=cid, edit_slide_idx=idx, slides=slides)
    slide = slides[idx]
    type_emoji = {"photo": "📷", "video": "🎬", "animation": "🎞", "audio": "🎵", "voice": "🎙"}.get(slide["type"], "📎")
    caption_preview = slide.get("caption", "")[:80] or "<i>без текста</i>"
    btn_preview = ""
    if slide.get("custom_btn"):
        btn_preview = f"\n🔗 Кнопка: <b>{slide['custom_btn']['text']}</b>"

    await callback.answer()
    await _safe_edit_text(
        callback.message,
        f"✏️ <b>Слайд #{idx + 1}</b> {type_emoji}\n\n"
        f"📝 Текст: {caption_preview}{btn_preview}\n\n"
        "Что делаем?",
        parse_mode="HTML",
        reply_markup=kb_edit_actions(cid, idx),
    )


# ── Замена медиа ──────────────────────────────────────────────────────────────

@router.callback_query(F.data.startswith("edit_media_"))
async def cb_edit_media(callback: CallbackQuery, state: FSMContext):
    parts = callback.data.split("edit_media_")[1]
    idx = int(parts.rsplit("_", 1)[1])
    cid = parts.rsplit("_", 1)[0]

    carousel = await db.get_carousel(cid)
    if not carousel or carousel["owner_id"] != callback.from_user.id:
        await callback.answer("Ошибка.", show_alert=True)
        return

    slides = carousel["slides"]
    if idx >= len(slides):
        await callback.answer("Слайд не найден.", show_alert=True)
        return

    await state.update_data(edit_carousel_id=cid, edit_slide_idx=idx, slides=slides)
    await state.set_state(Build.editing_media)
    await callback.answer()
    await _safe_edit_text(
        callback.message,
        f"🖼 <b>Замена медиа для слайда #{idx + 1}</b>\n\n"
        "Отправь новое медиа (фото, видео, GIF, аудио или войс):",
        parse_mode="HTML",
    )


@router.message(Build.editing_media, F.photo | F.video | F.animation | F.audio | F.voice)
async def process_edit_media(message: Message, state: FSMContext, bot: Bot):
    new_slide = _extract_slide_from_message(message)
    if not new_slide:
        await message.answer("⚠️ Тип медиа не распознан.")
        return

    data = await state.get_data()
    cid = data["edit_carousel_id"]
    idx = data["edit_slide_idx"]

    carousel = await db.get_carousel(cid)
    if not carousel:
        await message.answer("❌ Карусель не найдена.")
        await state.set_state(None)
        return

    slides = carousel["slides"]
    slides[idx]["type"] = new_slide["type"]
    slides[idx]["file_id"] = new_slide["file_id"]

    await db.save_carousel(cid, message.from_user.id, slides, title=carousel.get("title", ""), status=carousel.get("status", "draft"))
    await apply_edit_to_channel(bot, carousel, cid)

    await state.set_state(None)
    await message.answer(
        f"✅ Медиа слайда #{idx + 1} заменено.\n\n"
        "Что дальше?",
        parse_mode="HTML",
        reply_markup=kb_edit_actions(cid, idx),
    )


@router.message(Build.editing_media)
async def process_edit_media_wrong(message: Message):
    await message.answer("⚠️ Отправь медиа: фото, видео, GIF, аудио или войс.")


# ── Изменение caption ─────────────────────────────────────────────────────────

@router.callback_query(F.data.startswith("edit_caption_"))
async def cb_edit_caption(callback: CallbackQuery, state: FSMContext):
    parts = callback.data.split("edit_caption_")[1]
    idx = int(parts.rsplit("_", 1)[1])
    cid = parts.rsplit("_", 1)[0]

    carousel = await db.get_carousel(cid)
    if not carousel or carousel["owner_id"] != callback.from_user.id:
        await callback.answer("Ошибка.", show_alert=True)
        return

    slides = carousel["slides"]
    if idx >= len(slides):
        await callback.answer("Слайд не найден.", show_alert=True)
        return

    await state.update_data(edit_carousel_id=cid, edit_slide_idx=idx, slides=slides)
    await state.set_state(Build.editing_caption)
    await callback.answer()
    await _safe_edit_text(
        callback.message,
        f"📝 <b>Изменение текста слайда #{idx + 1}</b>\n\n"
        "Отправь новый текст (caption):",
        parse_mode="HTML",
    )


@router.message(Build.editing_caption)
async def process_edit_caption(message: Message, state: FSMContext, bot: Bot):
    new_caption = message.html_text or ""

    data = await state.get_data()
    cid = data["edit_carousel_id"]
    idx = data["edit_slide_idx"]

    carousel = await db.get_carousel(cid)
    if not carousel:
        await message.answer("❌ Карусель не найдена.")
        await state.set_state(None)
        return

    slides = carousel["slides"]
    slides[idx]["caption"] = new_caption

    await db.save_carousel(cid, message.from_user.id, slides, title=carousel.get("title", ""), status=carousel.get("status", "draft"))
    await apply_edit_to_channel(bot, carousel, cid)

    await state.set_state(None)
    await message.answer(
        f"✅ Текст слайда #{idx + 1} обновлён.\n\n"
        "Что дальше?",
        parse_mode="HTML",
        reply_markup=kb_edit_actions(cid, idx),
    )


# ── Изменение кнопки-ссылки ──────────────────────────────────────────────────

@router.callback_query(F.data.startswith("edit_btn_"))
async def cb_edit_btn(callback: CallbackQuery, state: FSMContext):
    parts = callback.data.split("edit_btn_")[1]
    idx = int(parts.rsplit("_", 1)[1])
    cid = parts.rsplit("_", 1)[0]

    carousel = await db.get_carousel(cid)
    if not carousel or carousel["owner_id"] != callback.from_user.id:
        await callback.answer("Ошибка.", show_alert=True)
        return

    slides = carousel["slides"]
    if idx >= len(slides):
        await callback.answer("Слайд не найден.", show_alert=True)
        return

    await state.update_data(edit_carousel_id=cid, edit_slide_idx=idx, slides=slides)
    await state.set_state(Build.editing_btn)
    await callback.answer()
    await _safe_edit_text(
        callback.message,
        f"🔗 <b>Изменение кнопки слайда #{idx + 1}</b>\n\n"
        "Отправь в формате:\n"
        "<code>Текст кнопки | https://example.com</code>\n\n"
        "Или отправь <code>удалить</code> чтобы убрать кнопку.",
        parse_mode="HTML",
    )


@router.message(Build.editing_btn)
async def process_edit_btn(message: Message, state: FSMContext, bot: Bot):
    text = (message.text or "").strip()

    data = await state.get_data()
    cid = data["edit_carousel_id"]
    idx = data["edit_slide_idx"]

    carousel = await db.get_carousel(cid)
    if not carousel:
        await message.answer("❌ Карусель не найдена.")
        await state.set_state(None)
        return

    slides = carousel["slides"]

    if text.lower() == "удалить":
        slides[idx]["custom_btn"] = None
    else:
        parts = [p.strip() for p in text.split("|", 1)]
        if len(parts) != 2 or not parts[1].startswith("http"):
            await message.answer(
                "⚠️ Неверный формат. Нужно:\n"
                "<code>Текст кнопки | https://example.com</code>",
                parse_mode="HTML",
            )
            return
        slides[idx]["custom_btn"] = {"text": parts[0], "url": parts[1]}

    await db.save_carousel(cid, message.from_user.id, slides, title=carousel.get("title", ""), status=carousel.get("status", "draft"))
    await apply_edit_to_channel(bot, carousel, cid)

    await state.set_state(None)
    await message.answer(
        "✅ Кнопка обновлена.\n\n"
        "Что дальше?",
        parse_mode="HTML",
        reply_markup=kb_edit_actions(cid, idx),
    )


# ── Удаление слайда ──────────────────────────────────────────────────────────

@router.callback_query(F.data.startswith("edit_del_"))
async def cb_edit_del(callback: CallbackQuery, state: FSMContext, bot: Bot):
    parts = callback.data.split("edit_del_")[1]
    idx = int(parts.rsplit("_", 1)[1])
    cid = parts.rsplit("_", 1)[0]

    carousel = await db.get_carousel(cid)
    if not carousel or carousel["owner_id"] != callback.from_user.id:
        await callback.answer("Ошибка.", show_alert=True)
        return

    slides = carousel["slides"]
    if len(slides) <= 1:
        await callback.answer("Нельзя удалить последний слайд!", show_alert=True)
        return
    if idx >= len(slides):
        await callback.answer("Слайд не найден.", show_alert=True)
        return

    slides.pop(idx)
    await db.save_carousel(cid, callback.from_user.id, slides, title=carousel.get("title", ""), status=carousel.get("status", "draft"))
    await apply_edit_to_channel(bot, carousel, cid)

    await state.update_data(edit_carousel_id=cid, slides=slides)
    await callback.answer()
    await _safe_edit_text(
        callback.message,
        f"🗑 Слайд удалён. Осталось: <b>{len(slides)}</b>\n\n"
        "Выбери слайд:",
        parse_mode="HTML",
        reply_markup=kb_edit_slide_list(cid, len(slides)),
    )


# ══════════════════════════════════════════════════════════════════════════════
# НАВИГАЦИЯ В КАНАЛЕ (читатели)
# ══════════════════════════════════════════════════════════════════════════════

@router.callback_query(F.data.startswith("nav_"))
async def navigate_carousel(callback: CallbackQuery):
    parts = callback.data.split("_")
    # Формат: nav_{carousel_id}_{index}
    # carousel_id может содержать '_', парсим с конца
    target_idx = int(parts[-1])
    carousel_id = "_".join(parts[1:-1])

    carousel = await db.get_carousel(carousel_id)
    if not carousel:
        await callback.answer("Этот лонгрид удалён из архивов Семьи.", show_alert=True)
        return

    slides = carousel["slides"]
    total = len(slides)
    if not slides or target_idx >= total or target_idx < 0:
        await callback.answer("Слайд не найден.", show_alert=True)
        return
    target_slide = slides[target_idx]

    # Определяем, является ли это превью (сообщение в личном чате)
    is_preview = callback.message.chat.type == "private"

    keyboard = kb_carousel_nav(
        carousel_id, target_idx, total,
        is_preview=is_preview,
        custom_btn=target_slide.get("custom_btn"),
    )
    new_media = _build_input_media(target_slide)

    try:
        await callback.message.edit_media(media=new_media, reply_markup=keyboard)
    except Exception:
        # Медиа не изменилось или другая ошибка — тихо игнорируем
        pass

    # Аналитика — записываем просмотр (только для не-превью, т.е. в каналах/группах)
    if not is_preview:
        user_id = callback.from_user.id
        await db.record_slide_view(carousel_id, user_id, target_idx)

    await callback.answer()


@router.callback_query(F.data == "ignore")
async def cb_ignore(callback: CallbackQuery):
    await callback.answer()


# ══════════════════════════════════════════════════════════════════════════════
# /stats — команда для администратора
# ══════════════════════════════════════════════════════════════════════════════

@router.message(Command("stats"))
async def cmd_stats(message: Message):
    carousels = await db.get_published_carousels(message.from_user.id)
    if not carousels:
        await message.answer("У тебя пока нет опубликованных лонгридов.")
        return
    await message.answer(
        "📊 <b>Сбор Дани — твои лонгриды:</b>",
        parse_mode="HTML",
        reply_markup=kb_stats_carousels(carousels),
    )
