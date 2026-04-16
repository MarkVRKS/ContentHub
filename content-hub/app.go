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

    s.COMMAND = strings.TrimSpace(s.COMMAND)
    if s.COMMAND == "" {
        return "Ошибка: пустая команда"
    }

    var cmd *exec.Cmd
    hubIP := GetOutboundIP()
    ipArg := "--hub-ip=" + hubIP

    if runtime.GOOS == "windows" {
        // Для Винды передаем команду в системный cmd
        fullCmd := fmt.Sprintf("%s %s", s.COMMAND, ipArg)
        cmd = exec.Command("cmd.exe", "/C", fullCmd)
    } else { 
        // 🔥 ФИКС ДЛЯ MAC: Оборачиваем команду в ZSH
        // Флаг -l (login) заставляет Мак загрузить переменные среды (~/.zshrc)
        // Благодаря этому Хаб найдет команду "go"
        fullCmd := fmt.Sprintf("%s %s", s.COMMAND, ipArg)
        cmd = exec.Command("/bin/zsh", "-l", "-c", fullCmd)
        
        // Создаем отдельную группу процессов (Семью)
        cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
    }

    cmd.Dir = s.PATH

    // Запускаем
    err := cmd.Start()
    if err != nil {
        return fmt.Sprintf("Ошибка запуска сервиса %s: %v", s.NAME, err)
    }

    // Сохраняем процесс в наш сейф
    a.mu.Lock()
    a.processes[s.ID] = cmd
    a.mu.Unlock()

    // Фоновый слушатель: удалит процесс из памяти хаба, если скрипт завершится
    go func() {
        cmd.Wait()
        a.mu.Lock()
        delete(a.processes, s.ID)
        a.mu.Unlock()
    }()

    return fmt.Sprintf("Сервис %s успешно запущен", s.NAME)
}

// // НОВЫЙ МЕТОД: Остановка сервиса (УБИЙСТВО ВСЕЙ ГРУППЫ ПРОЦЕССОВ)
// func (a *App) StopService(id string) error {
//     a.mu.Lock()
//     defer a.mu.Unlock()

//     cmd, exists := a.processes[id]
//     if !exists {
//         return fmt.Errorf("Сбой: Сервис не найден в активных")
//     }

//     if runtime.GOOS != "windows" {
//         // ВАЖНО ДЛЯ MAC: Убиваем всю группу процессов (знак минус перед PID)
//         // Это убьет и сам терминал, и Node.js, и Go-бота внутри него
//         err := syscall.Kill(-cmd.Process.Pid, syscall.SIGKILL)
//         if err != nil {
//             return fmt.Errorf("Не удалось ликвидировать процесс: %v", err)
//         }
//     } else {
//         // Запасной вариант для Windows
//         err := cmd.Process.Kill()
//         if err != nil {
//             return fmt.Errorf("Не удалось ликвидировать процесс: %v", err)
//         }
//     }

//     // Вычищаем из сейфа
//     delete(a.processes, id)
//     return nil
// }

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
        err := syscall.Kill(-cmd.Process.Pid, syscall.SIGKILL)
        if err != nil {
            return fmt.Errorf("Не удалось ликвидировать процесс (Mac): %v", err)
        }
    } else {
        // 🔥 ВАЖНО ДЛЯ WINDOWS: Убиваем дерево процессов (Tree Kill)
        // Иначе cmd.exe умрет, а go run . останется висеть в фоне как зомби
        killCmd := exec.Command("taskkill", "/T", "/F", "/PID", fmt.Sprint(cmd.Process.Pid))
        err := killCmd.Run()
        if err != nil {
            // Если taskkill не сработал, пробуем стандартный метод как запасной
            cmd.Process.Kill()
            return fmt.Errorf("Сбой древовидного убийства (Win), применен обычный: %v", err)
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