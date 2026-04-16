package main

import (
	"bytes"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"github.com/chai2010/webp"
)

func processImage(img image.Image) ([]*bytes.Buffer, int, int) {
	bounds := img.Bounds()
	imgWidth, imgHeight := bounds.Dx(), bounds.Dy()

	// Умная сетка
	cols, rows := 3, 3
	ratio := float64(imgWidth) / float64(imgHeight)
	if ratio > 1.3 {
		cols, rows = 4, 2
	} else if ratio < 0.75 {
		cols, rows = 2, 4
	}

	emojiSize := 100
	var webpBuffers []*bytes.Buffer
	widthChunk := imgWidth / cols
	heightChunk := imgHeight / rows

	for y := 0; y < rows; y++ {
		for x := 0; x < cols; x++ {
			rect := image.Rect(x*widthChunk, y*heightChunk, (x+1)*widthChunk, (y+1)*heightChunk)
			part := image.NewRGBA(image.Rect(0, 0, emojiSize, emojiSize))

			for py := 0; py < emojiSize; py++ {
				for px := 0; px < emojiSize; px++ {
					origX := rect.Min.X + (px * widthChunk / emojiSize)
					origY := rect.Min.Y + (py * heightChunk / emojiSize)
					part.Set(px, py, img.At(origX, origY))
				}
			}

			buf := new(bytes.Buffer)
			_ = webp.Encode(buf, part, &webp.Options{Lossless: true})
			webpBuffers = append(webpBuffers, buf)
		}
	}
	return webpBuffers, cols, rows
}