package main

import (
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"log"
	"math/rand"
	"os"
	"path/filepath"
	"time"

	tele "gopkg.in/telebot.v3"
)

const (
	botToken = "8641053829:AAHnVqGVw_vk5MLqJWOFhjgfDK9KdTEDj-Y"
	// ВАЖНО: Здесь должен быть точный юзернейм бота в Telegram (без @). Он обязан заканчиваться на "bot".
	botName  = "slicer_mafia_bot" 
)

// getGridSize вычисляет оптимальную сетку на основе пропорций медиафайла
func getGridSize(width, height int) (cols, rows int) {
	if width == 0 || height == 0 {
		return 3, 3
	}
	ratio := float64(width) / float64(height)
	if ratio > 1.3 {
		return 4, 2 // Горизонтальный формат
	} else if ratio < 0.75 {
		return 2, 4 // Вертикальный формат
	}
	return 3, 3 // Квадрат
}

func main() {
	initUI() // Инициализация кнопок из ui.go

	pref := tele.Settings{
		Token:  botToken,
		Poller: &tele.LongPoller{Timeout: 10 * time.Second},
	}

	b, err := tele.NewBot(pref)
	if err != nil {
		log.Fatal("Критическая ошибка запуска:", err)
	}

	// Обработка /start
	b.Handle("/start", func(c tele.Context) error {
		startMsg := "🧤 **SlicerMafia приветствует тебя.**\n\nИнструмент готов к работе. Навигация по функциям доступна в нижнем меню. Отправь файл, чтобы начать нарезку."
		return c.Send(startMsg, mainMenu, tele.ModeMarkdown)
	})

	// Обработка текстовых кнопок
	b.Handle(&btnPhoto, func(c tele.Context) error {
		return c.Send("Ожидаю статичное изображение (JPG/PNG). Сетка сегментации будет подобрана автоматически.")
	})

	b.Handle(&btnGif, func(c tele.Context) error {
		return c.Send("Ожидаю GIF или Видео. Синхронизация кадров и сброс PTS будут выполнены автоматически.")
	})

	b.Handle(&btnFAQ, func(c tele.Context) error {
		faqText := "📑 **SlicerMafia: Техническая документация**\n\n" +
			"**Назначение:** Профессиональная сегментация медиафайлов для создания бесшовных эмодзи-пазлов.\n\n" +
			"🔹 **Фото (Static):** Автоматический подбор сетки (2x4, 4x2 или 3x3) для минимизации искажений.\n" +
			"🔹 **Видео/GIF (Motion):** Принудительный CFR (Constant Frame Rate) и нормализация таймстемпов для идеальной синхронизации.\n" +
			"🔹 **Лимиты:** Рекомендуемая длина до 3 сек, каждый сегмент < 256 Кб.\n\n" +
			"⚠️ **Требование:** Для использования кастомных эмодзи в чатах необходим Telegram Premium.\n\n" +
			"👨‍💻 **Техническая поддержка:** @usakso\n" +
			"🏢 **Отдел:** ContentMafia"

		return c.Send(faqText, tele.ModeMarkdown)
	})

	// ОБРАБОТКА ФОТО
	b.Handle(tele.OnPhoto, func(c tele.Context) error {
		c.Send("⚙️ Выполнение сегментации изображения...")

		photo := c.Message().Photo
		file, err := b.FileByID(photo.FileID)
		if err != nil {
			return c.Send("❌ Ошибка доступа к файлу.")
		}

		imgReader, err := b.File(&file)
		if err != nil {
			return c.Send("❌ Ошибка загрузки.")
		}
		defer imgReader.Close()

		img, _, err := image.Decode(imgReader)
		if err != nil {
			return c.Send("❌ Некорректный формат данных.")
		}

		webpBuffers, cols, rows := processImage(img)

		var filesData [][]byte
		for _, buf := range webpBuffers {
			filesData = append(filesData, buf.Bytes())
		}

		// ИСПРАВЛЕНИЕ: Формируем валидное имя пака, сохраняя бренд vrks в начале
		packName := fmt.Sprintf("vrks_%d_by_%s", rand.Intn(999999), botName)
		err = createEmojiPack(botToken, c.Sender().ID, packName, "SlicerMafia Static", "static", filesData)
		if err != nil {
			return c.Send("❌ Ошибка Telegram API: " + err.Error())
		}

		successMsg := fmt.Sprintf("✅ **Операция завершена успешно.** Сетка %dx%d\n\n🔗 [Установить набор](https://t.me/addstickers/%s)\n\n"+
			"💡 **Совет:** В десктопной версии Telegram синхронизация сегментов работает стабильнее.", cols, rows, packName)

		return c.Send(successMsg, tele.ModeMarkdown)
	})

	// ОБРАБОТКА ВИДЕО И GIF
	handleVideoProcessing := func(c tele.Context, fileID string, width, height int) error {
		cols, rows := getGridSize(width, height)

		c.Send(fmt.Sprintf("🎞 Синхронизация потоков и нарезка сетки %dx%d...", cols, rows))

		file, err := b.FileByID(fileID)
		if err != nil {
			return c.Send("❌ Ошибка доступа к видео.")
		}

		inputPath := filepath.Join(os.TempDir(), fmt.Sprintf("sm_%d.mp4", rand.Intn(99999)))
		err = b.Download(&file, inputPath)
		if err != nil {
			return c.Send("❌ Ошибка скачивания.")
		}
		defer os.Remove(inputPath)

		webmPaths, err := processGif(inputPath, cols, rows)
		if err != nil {
			return c.Send("❌ Ошибка FFmpeg Engine: " + err.Error())
		}

		var filesData [][]byte
		for _, path := range webmPaths {
			data, _ := os.ReadFile(path)
			filesData = append(filesData, data)
			os.Remove(path)
		}

		// ИСПРАВЛЕНИЕ: Формируем валидное имя пака для видео, сохраняя бренд vrks в начале
		packName := fmt.Sprintf("vrks_vid_%d_by_%s", rand.Intn(999999), botName)
		err = createEmojiPack(botToken, c.Sender().ID, packName, "SlicerMafia Motion", "video", filesData)
		if err != nil {
			return c.Send("❌ Ошибка Telegram API: " + err.Error())
		}

		successMsg := fmt.Sprintf("✅ **Видео-пазл сформирован.** Сетка %dx%d\n\n🔗 [Установить набор](https://t.me/addstickers/%s)\n\n"+
			"💡 **Инфо:** Рассинхрон анимации — особенность клиента Telegram. Перезагрузите чат для выравнивания.", cols, rows, packName)

		return c.Send(successMsg, tele.ModeMarkdown)
	}

	b.Handle(tele.OnAnimation, func(c tele.Context) error {
		anim := c.Message().Animation
		return handleVideoProcessing(c, anim.FileID, anim.Width, anim.Height)
	})

	b.Handle(tele.OnVideo, func(c tele.Context) error {
		vid := c.Message().Video
		return handleVideoProcessing(c, vid.FileID, vid.Width, vid.Height)
	})

	log.Println(">>> SlicerMafia Engine Online")
	b.Start()
}