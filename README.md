# ContentHub

## ТЕХНИЧКА

# macOS

Для работы на операционке яблок, нужно будет скачать инструменты командной строки (Xcode Command Line Tools)
Так как Wails компилирует нативное приложение, поэтому нужен компилятор C (Clang), который встроен в инструменты от Apple
`xcode-select --install`

Чтобы установить необходимые нам GOLANG, NODE.JS - быстрее всего это сделать через Homebrew, менеджер пакетов

`brew install go node`

Установка Wails CLI
Скачиваем сам интерфейс командной строки Wails
`go install github.com/wailsapp/wails/v2/cmd/wails@latest`

Чекап системы
`wails doctor`
