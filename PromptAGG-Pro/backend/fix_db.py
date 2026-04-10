from sqlmodel import create_engine, text

# здесь ссылочка на бд
DATABASE_URL = "postgresql://postgres:123@localhost:5432/promptagg"

engine = create_engine(DATABASE_URL)

with engine.begin() as conn:
    try:
        conn.execute(text("ALTER TABLE content_plan ADD COLUMN project_id VARCHAR DEFAULT 'mns';"))
        print("✅ Успех: Колонка project_id добавлена в content_plan!")
    except Exception as e:
        print(f"⚠️ Пропуск content_plan: {e}")

    try:
        conn.execute(text("ALTER TABLE idea ADD COLUMN project_id VARCHAR DEFAULT 'mns';"))
        print("✅ Успех: Колонка project_id добавлена в idea!")
    except Exception as e:
        print(f"⚠️ Пропуск idea: {e}")