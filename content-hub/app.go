package main

import (
    "context"
    "encoding/json"
    "fmt"
    "net"
    "os"
    "os/exec"
    "runtime"
    "strings"
    "sync"
    "syscall"
)

// === ВСЕ СТРУКТУРЫ ===

// структура самого приложения
type App struct {
    ctx       context.Context
    processes map[string]*exec.Cmd // хранение запущенных процессов по id сервиса
    mu        sync.Mutex           // мьютекс для синхронизации доступа к процессам
}

// новая структура для данных о сервисах
type Service struct {
    ID          string `json:"id"`
    NAME        string `json:"name"`
    DESCRIPTION string `json:"description"`
    PATH        string `json:"path"`
    COMMAND     string `json:"command"`
    URL         string `json:"url"`
}

type Vault struct {
	ID       string `json:"id"`
	SERVICE  string `json:"service"`
	LOGIN    string `json:"login"`
	PASSWORD string `json:"password"`
}

func (a *App) GetVault() []Vault {
    filepath := "vault.json"
    content, err := os.ReadFile(filepath)
    if err !=nil {
        return nil
    }

    var vaults []Vault
    err = json.Unmarshal(content, &vaults)
    if err !=nil {
        return nil
    }
    return vaults
}

// получаем локальный IP компьютера
func (a *App) GetLocalIP() string {
    addrs, err := net.InterfaceAddrs()
    if err != nil {
        return "127.0.0.1"
    }
    for _, address := range addrs {
        if ipnet, ok := address.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
            if ipnet.IP.To4() != nil {
                return ipnet.IP.String()
            }
        }
    }
    return "192.168.0.1"
}

// функция для создания нового приложения
// создание экземпляра структуры и возвращение указателя на неё
func NewApp() *App {
    return &App{
        processes: make(map[string]*exec.Cmd), // инициализация карты для хранения процессов
    }
}

// для себя:
// func (a *App) ...
// a - имя переменной-приёмника метода,
// которая будет принимать соответсвующие параметры
// со структуры App
// * - указатель на структуру App, чтобы изменять состояние
// исходного объекта внутри метода, а не его копии
// в случае с переменнами - указывает что хранение
// структуры будет в адресе памяти

// метод для запуска приложений и сохранения контекста
func (a *App) startup(ctx context.Context) {
    a.ctx = ctx
}

// определяем ip устройства для выхода в интернет
func GetOutboundIP() string {
    // пытаемся подключиться к адресу через UDP
    // 8.8.8.8:80 - DNS гугла
    conn, err := net.Dial("udp", "8.8.8.8:80")
    // fallback на случай если нету интернета
    if err != nil {
        return "127.0.0.1"
    }

    // отложенный вызов для гаранта что ресурс освободиться
    defer conn.Close()
    // возвращаю локальный адрес соединения (тип net.Addr - интерфейс)
    // приведение типа, если не привести то доступа к ip не получить
    localAddr := conn.LocalAddr().(*net.UDPAddr)
    return localAddr.IP.String()
}

func (a *App) RunService(s Service) string {
    // Блокируем доступ, проверяем не запущен ли уже сервис
    a.mu.Lock()
    if _, exists := a.processes[s.ID]; exists {
        a.mu.Unlock()
        return fmt.Sprintf("Сервис %s уже работает", s.NAME)
    }
    a.mu.Unlock()

    var cmd *exec.Cmd // инициализация переменной для будущей команды

    slices := strings.Fields(s.COMMAND) // превращаем строку в слайс строк, т.к. ОС не понимает пробелы - ей нужен список аргументов

    // получение айпи ContentHub'a
    hubIP := GetOutboundIP()
    ipArg := "--hub-ip=" + hubIP

    if runtime.GOOS == "windows" {
        args := append([]string{"/C"}, slices...)
        // почему "..."?
        // "..." - это синтаксис для распаковки слайса
        // в отдельные аргументы функции
        // в данном случае, мы хотим передать каждый
        // элемент слайса как отдельный аргумент команды,
        // а не весь слайс целиком
        args = append(args, ipArg) // вшиваю ip в команду запуска для windows
        cmd = exec.Command("cmd", args...)
    } else { 
        // для macos, linux берем первый элемент как имя команды
        // а остальные элементы как аргументы
        args := append(slices[1:], ipArg)
        cmd = exec.Command(slices[0], args...)
        
        // ВАЖНО ДЛЯ MAC: Создаем отдельную группу процессов (Семью)
        // Чтобы при убийстве родителя умирали и все дочерние зомби-процессы
        cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
    }

    cmd.Dir = s.PATH

    // обработка ошибок при запуске команды
    // переменая получает результат выполнения команда
    // а после работает над фидбеком для пользователя
    err := cmd.Start()
    if err != nil {
        return fmt.Sprintf("Ошибка запуска сервиса %s:%s", s.NAME, err)
    }

    // Сохраняем процесс в наш сейф (map)
    a.mu.Lock()
    a.processes[s.ID] = cmd
    a.mu.Unlock()

    // Фоновый слушатель: удалит процесс из памяти хаба, если скрипт завершится сам по себе
    go func() {
        cmd.Wait()
        a.mu.Lock()
        delete(a.processes, s.ID)
        a.mu.Unlock()
    }()

    return fmt.Sprintf("Сервис %s успешно запущен", s.NAME)
}

// НОВЫЙ МЕТОД: Остановка сервиса (УБИЙСТВО ВСЕЙ ГРУППЫ ПРОЦЕССОВ)
func (a *App) StopService(id string) error {
    a.mu.Lock()
    defer a.mu.Unlock()

    cmd, exists := a.processes[id]
    if !exists {
        return fmt.Errorf("Сбой: Сервис не найден в активных")
    }

    if runtime.GOOS != "windows" {
        // ВАЖНО ДЛЯ MAC: Убиваем всю группу процессов (знак минус перед PID)
        // Это убьет и сам терминал, и Node.js, и Go-бота внутри него
        err := syscall.Kill(-cmd.Process.Pid, syscall.SIGKILL)
        if err != nil {
            return fmt.Errorf("Не удалось ликвидировать процесс: %v", err)
        }
    } else {
        // Запасной вариант для Windows
        err := cmd.Process.Kill()
        if err != nil {
            return fmt.Errorf("Не удалось ликвидировать процесс: %v", err)
        }
    }

    // Вычищаем из сейфа
    delete(a.processes, id)
    return nil
}

func (a *App) GetServices() []Service {
    filePath := "services.json"
    content, err := os.ReadFile(filePath)
    if err != nil {
        fmt.Println("Ошибка чтения файла:", err)
        return nil // если файла нет, возвращаем пустой список
    }

    var services []Service // сюда json распакует данные

    // десериализация
    // НЕБОЛЬШИЕ УСЛОВНОСТИ
    // json.Unmarshal используется, когда уже есть
    // все данные в памяти (в виде []byte)

    // json.NewDecoder используется, когда
    // данные идут «потоком» (например, из сети)
    err = json.Unmarshal(content, &services)
    if err != nil {
        fmt.Println("Ошибка парсинга json:", err)
        return nil
    }
    return services
}