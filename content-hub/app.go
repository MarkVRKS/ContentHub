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
)

// === ВСЕ СТРУКТУРЫ ===

// структура самого приложения
type App struct {
	ctx context.Context
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

// функция для создания нового приложения
// создание экземпляра структура и возвращение указателя на неё
func NewApp() *App {
	return &App{}
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
	//пытаемся подключиться к адресу через UDP
	// 8.8.8.8:80 - DNS гугла
	conn, err := net.Dial("udp", "8.8.8.8:80")
	//fallback на случай если нету интернета
	if err != nil {
		return "127.0.0.1"
	}

	//отложенный вызов для гаранта что ресурс освободиться
	defer conn.Close()
	//возвращаю локальный адрес соединения (тип net.Addr - интерфейс)
	//приведение типа, если не привести то доступа к ip не получить
	localAddr := conn.LocalAddr().(*net.UDPAddr)
	return localAddr.IP.String()
}


func (a *App) RunService(s Service) string {
	var cmd *exec.Cmd //инициализация переменной для будущей команды

	slices := strings.Fields(s.COMMAND) //превращаем строку в слайс строк, т.к. ОС не понимает пробелы - ей нужен список аргументов

	//получение айпи ContentHub'a
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
		args = append(args, ipArg) //вшиваю ip в команду запуска для windows
		cmd = exec.Command("cmd", args...)
	} else { //для macos, linux берем первый элемент как имя команды
		// а остальные элементы как аргументы
		args := append(slices[1:], ipArg)
		cmd = exec.Command(slices[0], args...)
	}

	cmd.Dir = s.PATH

	// обработка ошибок при запуске команды
	// переменая получает результат выполнения команда
	// а после работает над фидбеком для пользователя
	err := cmd.Start()
	if err != nil {
		return fmt.Sprintf("Ошибка запуска сервиса %s:%s", s.NAME, err)
	}

	return fmt.Sprintf("Сервис %s успешно запущен", s.NAME)
}

func (a *App) GetServices() []Service {
	filePath := "services.json"
	content, err := os.ReadFile(filePath)
	if err != nil {
		fmt.Println("Ошибка чтения файла:", err)
		return nil //если файла нет, возвращаем пустой список
	}

	var services []Service //сюда json распакует данные

	// десериализация
	// НЕБОЛЬШИЕ УСЛОВНОСТИ
	// json.Unmarshal используется, когда  уже есть
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