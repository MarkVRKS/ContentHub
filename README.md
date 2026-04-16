# ContentHub

Репозиторий с несколькими проектами на Go и веб-технологиях.

## Содержание

- **content-hub** - Desktop приложение на Wails (Go + Vite)
- **SlicerMafia** - Telegram бот для обработки изображений и видео
- **schedule** - Веб-приложение (HTML/CSS/JS)
- **mail.html** - HTML шаблон письма

---

## Установка на Windows

### 1. Установка Git

Скачай и установи Git для Windows:
- Перейди на https://git-scm.com/download/win
- Скачай установщик и запусти его
- При установке выбери "Git Bash" и оставь настройки по умолчанию

### 2. Клонирование репозитория

Открой Git Bash и выполни:

```bash
cd /c/Users/ИМЯ_ПОЛЬЗОВАТЕЛЯ
git clone https://github.com/MarkVRKS/ContentHub.git
cd ContentHub
```

### 3. Установка Go

1. Перейди на https://go.dev/dl/
2. Скачай установщик для Windows (например, `go1.23.x.windows-amd64.msi`)
3. Запусти установщик
4. После установки открой новое окно командной строки и проверь:

```bash
go version
```

### 4. Установка Node.js

1. Перейди на https://nodejs.org/
2. Скачай LTS версию для Windows
3. Запусти установщик
4. Проверь установку:

```bash
node --version
npm --version
```

### 5. Установка Wails CLI (для content-hub)

Wails требует компилятор C для Windows. Установи один из вариантов:

#### Вариант A: MinGW-w64 (рекомендуется)

1. Скачай MSYS2: https://www.msys2.org/
2. Установи MSYS2
3. Открой MSYS2 терминал и выполни:

```bash
pacman -Syu
pacman -S mingw-w64-x86_64-gcc
```

4. Добавь в PATH: `C:\msys64\mingw64\bin`
   - Открой "Система" → "Дополнительные параметры системы" → "Переменные среды"
   - В "Системные переменные" найди `Path` и добавь путь

#### Вариант B: Visual Studio Build Tools

1. Скачай Build Tools: https://visualstudio.microsoft.com/downloads/
2. Установи "Desktop development with C++"

После установки компилятора, установи Wails:

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

Проверь установку:

```bash
wails doctor
```

### 6. Установка зависимостей проектов

#### content-hub (Wails приложение)

```bash
cd content-hub
go mod download
cd frontend
npm install
cd ../..
```

#### SlicerMafia (Telegram бот)

```bash
cd SlicerMafia
go mod download
cd ..
```

### 7. Запуск проектов

#### content-hub

Режим разработки:
```bash
cd content-hub
wails dev
```

Сборка приложения:
```bash
wails build
```

Готовое приложение будет в папке `build/bin/`

#### SlicerMafia

**ВАЖНО:** Перед запуском нужно настроить токен бота в `main.go` (строка 18)

```bash
cd SlicerMafia
go run .
```

Или собрать исполняемый файл:
```bash
go build -o slicer_mafia.exe
```

#### schedule

Просто открой `index.html` в браузере или используй локальный сервер:

```bash
cd schedule
# Если установлен Python:
python -m http.server 8000
# Или используй любой другой локальный сервер
```

Открой http://localhost:8000 в браузере

---

## Установка на macOS

### 1. Установка Xcode Command Line Tools

Wails компилирует нативное приложение, поэтому нужен компилятор C (Clang):

```bash
xcode-select --install
```

### 2. Установка Homebrew

Если еще не установлен:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 3. Установка Go и Node.js

```bash
brew install go node
```

Проверь установку:

```bash
go version
node --version
npm --version
```

### 4. Клонирование репозитория

```bash
cd ~
git clone https://github.com/MarkVRKS/ContentHub.git
cd ContentHub
```

### 5. Установка Wails CLI

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

Проверь установку:

```bash
wails doctor
```

### 6. Установка зависимостей проектов

#### content-hub

```bash
cd content-hub
go mod download
cd frontend
npm install
cd ../..
```

#### SlicerMafia

```bash
cd SlicerMafia
go mod download
cd ..
```

### 7. Запуск проектов

#### content-hub

Режим разработки:
```bash
cd content-hub
wails dev
```

Сборка приложения:
```bash
wails build
```

Готовое приложение будет в папке `build/bin/`

#### SlicerMafia

**ВАЖНО:** Перед запуском нужно настроить токен бота в `main.go` (строка 18)

```bash
cd SlicerMafia
go run .
```

Или собрать исполняемый файл:
```bash
go build -o slicer_mafia
```

#### schedule

Просто открой `index.html` в браузере или используй локальный сервер:

```bash
cd schedule
python3 -m http.server 8000
```

Открой http://localhost:8000 в браузере

---

## Структура проекта

```
ContentHub/
├── content-hub/          # Wails desktop приложение
│   ├── frontend/         # Vite фронтенд
│   ├── app.go           # Логика приложения
│   ├── main.go          # Точка входа
│   └── go.mod           # Go зависимости
├── SlicerMafia/         # Telegram бот
│   ├── main.go          # Основной код бота
│   ├── api.go           # API функции
│   ├── image.go         # Обработка изображений
│   ├── video.go         # Обработка видео
│   └── go.mod           # Go зависимости
├── schedule/            # Веб-приложение
│   ├── index.html
│   ├── script.js
│   └── style.css
└── mail.html            # HTML шаблон

PromptAGG-Pro/           # Игнорируется (Electron приложение)
```

## Возможные проблемы

### Windows

**Проблема:** `wails: command not found`
- Убедись, что `%USERPROFILE%\go\bin` добавлен в PATH
- Перезапусти терминал после установки

**Проблема:** Ошибки компиляции C
- Проверь, что MinGW или Visual Studio Build Tools установлены корректно
- Запусти `wails doctor` для диагностики

### macOS

**Проблема:** `xcrun: error: invalid active developer path`
- Установи Xcode Command Line Tools: `xcode-select --install`

**Проблема:** `wails: command not found`
- Добавь в `~/.zshrc` или `~/.bash_profile`:
  ```bash
  export PATH=$PATH:$(go env GOPATH)/bin
  ```
- Перезапусти терминал

## Дополнительная информация

- **Wails документация:** https://wails.io/docs/introduction
- **Go документация:** https://go.dev/doc/
- **Telebot документация:** https://pkg.go.dev/gopkg.in/telebot.v3

---

**Примечание:** Токен бота в `SlicerMafia/main.go` нужно заменить на свой перед использованием!
