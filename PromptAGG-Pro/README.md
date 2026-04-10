# 🚀 PromptAGG

**PromptAGG** — это профессиональный внутренний комбайн для SMM-специалистов и контент-мейкеров.  
Сервис объединяет в себе:

- 🗂 Умный календарь публикаций (Kanban)
- 🤖 Генератор ТЗ для нейросетей
- 🧠 «Нейро-хранилище» (Idea Vault)
- 🧪 «Цифровую лабораторию» (Prompt Lab)

---

## 🏗 Архитектура и стек

Проект построен по принципу **монорепозитория**:

### 🔹 Frontend
- React 18
- Vite
- Tailwind CSS
- Lucide Icons  
- Темы: Light / Dark / Pixel Space

### 🔹 Backend
- Python 3.10+
- FastAPI
- SQLModel (ORM)
- Pydantic

### 🔹 База данных
- PostgreSQL

---

## ⚙️ Установка и запуск

### 1. Клонирование проекта

```bash
git clone https://github.com/MarkVRKS/PromptAGG.git
cd PromptAGG
```

### 🐍 Backend (FastAPI)

Все команды выполняются из корня проекта:

```bash
cd backend

# Создание виртуального окружения
python -m venv venv

# Активация (Windows Git Bash)
source venv/Scripts/activate

# Mac/Linux
# source venv/bin/activate

# Обновление pip
python -m pip install --upgrade pip

# Установка зависимостей
pip install fastapi uvicorn[standard] sqlmodel psycopg2-binary python-dotenv pydantic cors
```

### 🔧 Настройка базы данных

Создайте файл `.env` в папке `backend`:

```
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/promptagg
```

### ▶️ Запуск сервера

```bash
uvicorn app.main:app --reload
```

📍 API будет доступно: `http://127.0.0.1:8000`

---

### ⚛️ Frontend (React + Vite)

Откройте новый терминал:

```bash
cd frontend

# Установка зависимостей
npm install

# Основные библиотеки
npm install react react-dom axios lucide-react

# Dev-инструменты
npm install -D vite tailwindcss postcss autoprefixer @vitejs/plugin-react

# Инициализация Tailwind (если нужно)
npx tailwindcss init -p
```

### 🔗 Настройка API

Создайте `.env` в папке `frontend`:

```
VITE_API_URL=http://127.0.0.1:8000
```

### ▶️ Запуск фронтенда

```bash
npm run dev
```

📍 Приложение будет доступно: `http://localhost:5173`

---

## 🗺 Roadmap

### ✅ Этап 1: Фундамент и БД
- Архитектура монорепозитория
- Настройка PostgreSQL + SQLModel
- CRUD для постов, идей и шаблонов

### ✅ Этап 2: UI и оптимизация
- Kanban-доска (календарь на 31 день)
- Многошаговый pipeline:
  - Бриф → Промпт → SMM → Дизайн → Готово
- Idea Vault (нейро-хранилище)
- Prompt Lab (управление шаблонами)
- Оптимизация (React.memo, useMemo, GPU CSS)
- Система тем

### ⏳ Этап 3: Интеграции и релиз
- Настройка CORS
- Связка Frontend + Backend
- Интеграция с AI API
- Docker
- Деплой (Railway / Render / VPS)

---

## 📌 Планы развития

- AI-ассистент внутри платформы
- Коллаборация между SMM-командами
- Экспорт контент-планов
- Интеграции с соцсетями
