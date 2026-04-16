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
			outPath := filepath.Join(os.TempDir(), fmt.Sprintf("sm_%d_%d.webm", x, y))

			// Математически точная синхронизация
			vf := fmt.Sprintf("scale=%d:%d,crop=%d:%d:%d:%d,fps=30,trim=start=0:duration=2.9,setpts=N/FRAME_RATE/TB", 
				targetWidth, targetHeight, emojiSize, emojiSize, x*emojiSize, y*emojiSize)

			cmd := exec.Command("ffmpeg", "-y",
				"-i", inputPath,
				"-vf", vf,
				"-c:v", "libvpx-vp9",
				"-pix_fmt", "yuva420p",
				"-fps_mode", "cfr",    // Фиксация FPS
				"-b:v", "150k",
				"-maxrate", "150k",
				"-bufsize", "300k",
				"-an",
				outPath)

			if err := cmd.Run(); err != nil {
				return nil, err
			}
			outputFiles = append(outputFiles, outPath)
		}
	}
	return outputFiles, nil
}