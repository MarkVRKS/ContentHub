from sqlmodel import create_engine, text

# Твоя ссылка на БД
DATABASE_URL = "postgresql://postgres:123@localhost:5432/promptagg"

engine = create_engine(DATABASE_URL)

with engine.begin() as conn:
    try:
        # Эта команда сносит ВСЕ таблицы в базе данных под чистую
        conn.execute(text("DROP SCHEMA public CASCADE;"))
        # А эта создает чистую структуру обратно
        conn.execute(text("CREATE SCHEMA public;"))
        
        print("🧨 УСПЕХ: База данных полностью очищена! Все старые таблицы удалены.")
    except Exception as e:
        print(f"⚠️ Ошибка при очистке БД: {e}")