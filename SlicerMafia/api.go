package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"time"
)

func createEmojiPack(token string, userID int64, packName, packTitle, format string, filesData [][]byte) error {
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	_ = writer.WriteField("user_id", fmt.Sprintf("%d", userID))
	_ = writer.WriteField("name", packName)
	_ = writer.WriteField("title", packTitle)
	_ = writer.WriteField("sticker_type", "custom_emoji")

	type StickerInfo struct {
		Sticker   string   `json:"sticker"`
		Format    string   `json:"format"`
		EmojiList []string `json:"emoji_list"`
	}
	var stickers []StickerInfo

	for i, fileBytes := range filesData {
		attachName := fmt.Sprintf("part_%d", i)
		stickers = append(stickers, StickerInfo{
			Sticker:   "attach://" + attachName,
			Format:    format,
			EmojiList: []string{"🖼"},
		})

		ext := ".webp"
		if format == "video" {
			ext = ".webm"
		}

		partWriter, _ := writer.CreateFormFile(attachName, attachName+ext)
		_, _ = partWriter.Write(fileBytes)
	}

	stickersJSON, _ := json.Marshal(stickers)
	_ = writer.WriteField("stickers", string(stickersJSON))
	writer.Close()

	url := fmt.Sprintf("https://api.telegram.org/bot%s/createNewStickerSet", token)
	req, _ := http.NewRequest("POST", url, body)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("%s", string(respBody))
	}
	return nil
}