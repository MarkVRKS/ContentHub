"""
╔══════════════════════════════════════════════════════╗
║   keyboards.py — Арсенал Семьи (Клавиатуры)         ║
╚══════════════════════════════════════════════════════╝
"""

from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardMarkup, KeyboardButton


main_reply_kb = ReplyKeyboardMarkup(
    keyboard=[[KeyboardButton(text="🎩 Главное меню")]],
    resize_keyboard=True,
    is_persistent=True,
)


def kb_main_menu() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🔫 Новый лонгрид", callback_data="menu_new")],
        [InlineKeyboardButton(text="📖 Как это работает — Гайд", callback_data="menu_guide")],
        [InlineKeyboardButton(text="📂 Черновики", callback_data="menu_drafts")],
        [InlineKeyboardButton(text="📊 Статистика (Сбор Дани)", callback_data="menu_stats")],
    ])


def kb_during_build(slide_num: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=f"✅ Завершить сборку ({slide_num} сл.)", callback_data="finish_carousel")],
        [InlineKeyboardButton(text="💾 Сохранить черновик и выйти", callback_data="save_draft")],
    ])


def kb_add_button_prompt() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="➕ Добавить кнопку-ссылку", callback_data="add_url_btn")],
        [InlineKeyboardButton(text="⏭ Пропустить", callback_data="skip_url_btn")],
    ])


def kb_carousel_nav(
    carousel_id: str,
    current_idx: int,
    total: int,
    is_preview: bool = False,
    custom_btn: dict | None = None,  # {"text": "...", "url": "..."}
) -> InlineKeyboardMarkup:
    """Главная навигация карусели — для превью и канала."""
    rows = []

    # ── Ряд навигации ─────────────────────────────────────────────────────────
    if total > 1:
        nav_row = []
        if current_idx > 0:
            nav_row.append(
                InlineKeyboardButton(
                    text="⬅️ Назад",
                    callback_data=f"nav_{carousel_id}_{current_idx - 1}",
                )
            )
        nav_row.append(
            InlineKeyboardButton(
                text=f"{current_idx + 1} / {total}",
                callback_data="ignore",
            )
        )
        if current_idx < total - 1:
            nav_row.append(
                InlineKeyboardButton(
                    text="Вперёд ➡️",
                    callback_data=f"nav_{carousel_id}_{current_idx + 1}",
                )
            )
        else:
            # Конец — кнопка сброса на первый слайд
            nav_row.append(
                InlineKeyboardButton(
                    text="🔄 В начало",
                    callback_data=f"nav_{carousel_id}_0",
                )
            )
        rows.append(nav_row)

    # ── Кастомная кнопка-ссылка ───────────────────────────────────────────────
    if custom_btn and custom_btn.get("text") and custom_btn.get("url"):
        rows.append([
            InlineKeyboardButton(
                text=custom_btn["text"],
                url=custom_btn["url"],
            )
        ])

    # ── Кнопки действий (только в превью) ────────────────────────────────────
    if is_preview:
        rows.append([
            InlineKeyboardButton(
                text="✏️ Редактировать",
                callback_data=f"edit_menu_{carousel_id}",
            ),
            InlineKeyboardButton(
                text="📢 Опубликовать в канал",
                callback_data=f"prep_pub_{carousel_id}",
            ),
        ])

    return InlineKeyboardMarkup(inline_keyboard=rows)


def kb_publish_options(carousel_id: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🚀 Опубликовать сейчас", callback_data=f"pub_now_{carousel_id}")],
        [InlineKeyboardButton(text="⏰ Отложить публикацию", callback_data=f"pub_later_{carousel_id}")],
    ])


def kb_drafts(drafts: list[dict]) -> InlineKeyboardMarkup:
    rows = []
    for d in drafts[:10]:  # Максимум 10
        title = d.get("title") or f"Черновик {d['id']}"
        rows.append([
            InlineKeyboardButton(text=f"📄 {title[:35]}", callback_data=f"load_draft_{d['id']}")
        ])
    rows.append([InlineKeyboardButton(text="↩️ Назад", callback_data="menu_back")])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def kb_edit_slide_list(carousel_id: str, total: int) -> InlineKeyboardMarkup:
    rows = []
    row = []
    for i in range(total):
        row.append(
            InlineKeyboardButton(
                text=f"Слайд {i + 1}",
                callback_data=f"edit_slide_{carousel_id}_{i}",
            )
        )
        if len(row) == 3:
            rows.append(row)
            row = []
    if row:
        rows.append(row)
    rows.append([InlineKeyboardButton(text="↩️ Назад", callback_data="menu_back")])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def kb_edit_actions(carousel_id: str, slide_idx: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="🖼 Заменить медиа", callback_data=f"edit_media_{carousel_id}_{slide_idx}"),
            InlineKeyboardButton(text="📝 Изменить текст", callback_data=f"edit_caption_{carousel_id}_{slide_idx}"),
        ],
        [
            InlineKeyboardButton(text="🔗 Изменить кнопку", callback_data=f"edit_btn_{carousel_id}_{slide_idx}"),
            InlineKeyboardButton(text="🗑 Удалить слайд", callback_data=f"edit_del_{carousel_id}_{slide_idx}"),
        ],
        [InlineKeyboardButton(text="↩️ К списку слайдов", callback_data=f"edit_menu_{carousel_id}")],
    ])


def kb_guide(step: int, total: int) -> InlineKeyboardMarkup:
    nav_row = []
    if step > 0:
        nav_row.append(InlineKeyboardButton(text="⬅️ Назад", callback_data=f"guide_{step - 1}"))
    nav_row.append(InlineKeyboardButton(text=f"● {step + 1} / {total}", callback_data="ignore"))
    if step < total - 1:
        nav_row.append(InlineKeyboardButton(text="Вперёд ➡️", callback_data=f"guide_{step + 1}"))
    else:
        nav_row.append(InlineKeyboardButton(text="🔄 Начало", callback_data="guide_0"))

    rows = [nav_row]

    if step == total - 1:
        rows.append([InlineKeyboardButton(text="🔫 Создать первый лонгрид", callback_data="menu_new")])

    rows.append([InlineKeyboardButton(text="↩️ В главное меню", callback_data="menu_back")])

    return InlineKeyboardMarkup(inline_keyboard=rows)


def kb_stats_carousels(carousels: list[dict]) -> InlineKeyboardMarkup:
    rows = []
    for c in carousels[:10]:
        title = c.get("title") or c["id"]
        rows.append([
            InlineKeyboardButton(text=f"📊 {title[:35]}", callback_data=f"stats_{c['id']}")
        ])
    rows.append([InlineKeyboardButton(text="↩️ Назад", callback_data="menu_back")])
    return InlineKeyboardMarkup(inline_keyboard=rows)
