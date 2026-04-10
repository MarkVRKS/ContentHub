package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

func processGif(inputPath string, cols, rows int) ([]string, error) {
	var outputFiles []string
	emojiSize := 100
	targetWidth, targetHeight := cols*emojiSize, rows*emojiSize

	for y := 0; y < rows; y++ {
		for x := 0; x < cols; x++ {
			outPath := filepath.Join(os.TempDir(), fmt.Sprintf("part_%d_%d.webm", x, y))

			// 1. scale и crop - вырезаем нужный квадрат
			// 2. fps=30 - жестко фиксируем 30 кадров
			// 3. trim=start=0:duration=2.9 - жестко обрубаем длину
			// 4. setpts=N/FRAME_RATE/TB - ПЕРЕЗАПИСЫВАЕМ ТАЙМСТЕМПЫ С НУЛЯ (Убивает рассинхрон)
			vf := fmt.Sprintf("scale=%d:%d,crop=%d:%d:%d:%d,fps=30,trim=start=0:duration=2.9,setpts=N/FRAME_RATE/TB", targetWidth, targetHeight, emojiSize, emojiSize, x*emojiSize, y*emojiSize)

			cmd := exec.Command("ffmpeg", "-y",
				"-i", inputPath,
				"-vf", vf,
				"-c:v", "libvpx-vp9",
				"-pix_fmt", "yuva420p",
				"-fps_mode", "cfr",    // Современный форс постоянного фреймрейта
				"-b:v", "150k",        // Битрейт с запасом под лимит 256 Кб
				"-maxrate", "150k",
				"-bufsize", "300k",
				"-an",                 // Вырубаем любую аудиодорожку (она тоже может ломать PTS)
				outPath)

			if err := cmd.Run(); err != nil {
				return nil, fmt.Errorf("FFmpeg упал на куске [%d:%d]: %v", x, y, err)
			}
			outputFiles = append(outputFiles, outPath)
		}
	}
	return outputFiles, nil
}