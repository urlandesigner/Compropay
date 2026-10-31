# Vídeos da Wiki: piloto

Fonte do vídeo da pergunta "Como efetuar um pagamento via QRCode?", primeiro
no formato novo (direto, sem abertura, telas do app 2.0, narração e legenda).

- `roteiro-pagar-qrcode.md`: frases da narração e telas usadas
- `fig/`: telas exportadas do Figma (App ComproPay 2, seção "Pagar"), 1x
- `build.py`: monta o vídeo (Pillow + ffmpeg) e gera a legenda `.srt`

Para rodar, coloque em `tts/` o modelo do Kokoro (`kokoro-v1.0.onnx` e
`voices-v1.0.bin`, das releases de thewh1teagle/kokoro-onnx) e instale
`kokoro-onnx soundfile qrcode pillow numpy`. A saída vai para `out/`.
