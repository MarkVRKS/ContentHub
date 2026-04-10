# промежуточный файл чтобы дропать бдшки
# а то у меня бэк ворчит, что после изменения пайплайна остались истории промптов на бэке

from app.core.database import engine
from sqlalchemy import text
from sqlmodel import SQLModel

from app.models.content_plan import ContentPlan, Idea, PromptTemplate

print("Удаляем старые таблицы каскадом (принудительно)...")
with engine.begin() as conn:
    conn.execute(text("DROP TABLE IF EXISTS content_plan CASCADE;"))
    conn.execute(text("DROP TABLE IF EXISTS prompt_history CASCADE;"))
    conn.execute(text("DROP TABLE IF EXISTS ideas CASCADE;"))
    conn.execute(text("DROP TABLE IF EXISTS prompt_templates CASCADE;"))

print("Создаем новые чистые таблицы с правильными колонками...")
SQLModel.metadata.create_all(engine)

print("✅ База данных успешно обновлена!")