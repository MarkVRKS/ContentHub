package main

import tele "gopkg.in/telebot.v3"

var (
	mainMenu   = &tele.ReplyMarkup{ResizeKeyboard: true}
	btnPhoto   = mainMenu.Text("🖼 Слайсер Фото")
	btnGif     = mainMenu.Text("🎬 Слайсер Видео/GIF")
	btnFAQ     = mainMenu.Text("📁 SlicerMafia Info")
	btnPremium = mainMenu.Text("💎 SlicerMafia PRO (СБП)") // Кнопка оплаты
)

func initUI() {
	mainMenu.Reply(
		mainMenu.Row(btnPhoto, btnGif),
		mainMenu.Row(btnPremium), // Выделили оплату в отдельный ряд
		mainMenu.Row(btnFAQ),
	)
}