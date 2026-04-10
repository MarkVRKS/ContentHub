import os
from sqlmodel import create_engine, Session, SQLModel
from dotenv import load_dotenv

# Загружаем переменные из .env
load_dotenv()

# Приоритет: сначала ищем DATABASE_URL в .env, если его нет — используем SQLite
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./promptagg.db")

# Настройки для разных типов БД
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    # Этот аргумент нужен ТОЛЬКО для SQLite
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL, 
    echo=True, 
    connect_args=connect_args
)

def init_db():
    # Эта команда создаст таблицы в PostgreSQL, если их там еще нет
    SQLModel.metadata.create_all(engine)
    
def get_session():
    with Session(engine) as session:
        yield session