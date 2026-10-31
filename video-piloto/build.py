"""Monta o vídeo piloto "Como efetuar um pagamento via QR code?".

Entrada: telas do Figma em fig/, narração gerada aqui (Kokoro, pt-BR).
Saída: out/pagar-qrcode.mp4 (1920x1080, legenda na lateral) + out/pagar-qrcode.srt
"""
import math, os, subprocess, sys
import numpy as np
import soundfile as sf
import qrcode
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.abspath(__file__))
FIG = os.path.join(ROOT, "fig")
OUT = os.path.join(ROOT, "out"); os.makedirs(OUT, exist_ok=True)
FPS, W, H = 30, 1920, 1080
SW, SH = 430, 932                      # tela do app, 1x do Figma
ROXO = (113, 32, 209); ROXO_BAR = (124, 18, 200); TINTA = (33, 20, 56)
FONT = "/usr/share/fonts/opentype/inter/Inter-%s.otf"
def font(w, s): return ImageFont.truetype(FONT % w, s)

# ---------------------------------------------------------------- roteiro
LINHAS = [
    "Na tela inicial, toque em Pagar.",
    "Escolha Pagar com QR code.",
    "Aponte a câmera para o QR code do estabelecimento.",
    "Digite o valor do pagamento.",
    "Escolha a forma de pagamento.",
    "Confira os dados e toque em Pagar.",
    "Pronto! O pagamento foi feito.",
]
VOZ = os.environ.get("VOZ", "pf_dora")

def narrar():
    from kokoro_onnx import Kokoro
    k = Kokoro(os.path.join(ROOT, "tts/kokoro-v1.0.onnx"), os.path.join(ROOT, "tts/voices-v1.0.bin"))
    clips = []
    for txt in LINHAS:
        s, sr = k.create(txt, voice=VOZ, speed=1.0, lang="pt-br")
        # corta silêncio das pontas
        idx = np.where(np.abs(s) > 0.01)[0]
        s = s[max(idx[0] - 600, 0): idx[-1] + 1200]
        clips.append(s)
    return clips, sr

# ---------------------------------------------------------------- telas
def carregar(n): return Image.open(os.path.join(FIG, n)).convert("RGBA")

inicio_alta = carregar("01-inicio.png")              # 430x1255: tab bar fixa no rodapé
TAB = 120
INICIO = Image.new("RGBA", (SW, SH))
INICIO.paste(inicio_alta.crop((0, 0, SW, SH - TAB)), (0, 0))
INICIO.paste(inicio_alta.crop((0, 1255 - TAB, SW, 1255)), (0, SH - TAB))
PAGAR = carregar("02-pagar.png")
SCANNER = carregar("03-scanner.png")
VAZIO = carregar("04-valor-vazio.png")
CHEIO = carregar("05-valor-preenchido.png")
VALOR_PATCH = CHEIO.crop((15, 326, 262, 374))       # "R$100,00" com os pixels do Figma

def com_valor(base, a):
    im = base.copy()
    if a > 0:
        p = VALOR_PATCH.copy(); p.putalpha(int(255 * a))
        im.alpha_composite(p, (15, 326))
    return im

def com_forma(im):
    im = im.copy(); d = ImageDraw.Draw(im)
    d.rectangle((24, 896, 300, 922), fill=ROXO_BAR)
    d.text((30, 898), "Saldo na carteira", font=font("SemiBold", 14), fill="white")
    return im

def supersample(fn, w, h, k=3):
    big = Image.new("RGBA", (w * k, h * k), (0, 0, 0, 0)); fn(ImageDraw.Draw(big), k)
    return big.resize((w, h), Image.LANCZOS)

# bottom sheet genérico de forma de pagamento (placeholder até ter a tela real)
SHEET_H = 360
OPCOES = [("Saldo na carteira", "R$ 750,00 disponível"),
          ("Cartão Alimentação", "•••• 8393"),
          ("Cartão de crédito", "Visa •••• 1024")]
def desenhar_sheet(sel):
    def fn(d, k):
        d.rounded_rectangle((0, 0, SW * k, (SHEET_H + 40) * k), 24 * k, fill="white")
        d.rounded_rectangle(((SW / 2 - 20) * k, 10 * k, (SW / 2 + 20) * k, 14 * k), 2 * k, fill=(210, 205, 220))
        d.text((24 * k, 34 * k), "Forma de pagamento", font=font("SemiBold", 19 * k), fill=TINTA)
        for i, (t, sub) in enumerate(OPCOES):
            y = (84 + i * 82) * k
            d.rounded_rectangle((20 * k, y, (SW - 20) * k, y + 70 * k), 14 * k,
                                fill=(246, 241, 253) if i == sel else (243, 243, 246),
                                outline=ROXO if i == sel else None, width=2 * k)
            d.ellipse((36 * k, y + 17 * k, 72 * k, y + 53 * k), fill=(232, 220, 250))
            d.text((86 * k, y + 15 * k), t, font=font("SemiBold", 16 * k), fill=TINTA)
            d.text((86 * k, y + 38 * k), sub, font=font("Regular", 13 * k), fill=(110, 100, 130))
            cx, cy = (SW - 46) * k, y + 35 * k
            d.ellipse((cx - 11 * k, cy - 11 * k, cx + 11 * k, cy + 11 * k), outline=ROXO if i == sel else (180, 175, 195), width=2 * k)
            if i == sel: d.ellipse((cx - 6 * k, cy - 6 * k, cx + 6 * k, cy + 6 * k), fill=ROXO)
    return supersample(fn, SW, SHEET_H + 40)
SHEET = [desenhar_sheet(-1), desenhar_sheet(0)]

def tela_sucesso():
    im = Image.new("RGBA", (SW, SH), "white")
    im.alpha_composite(VAZIO.crop((0, 0, SW, 60)), (0, 0))   # status bar
    def fn(d, k):
        cx, cy = SW / 2 * k, 300 * k
        d.ellipse((cx - 52 * k, cy - 52 * k, cx + 52 * k, cy + 52 * k), fill=ROXO)
        d.line([(cx - 22 * k, cy + 2 * k), (cx - 6 * k, cy + 18 * k), (cx + 24 * k, cy - 16 * k)], fill="white", width=8 * k, joint="curve")
        f = font("Bold", 26 * k); t = "Pagamento realizado"
        d.text((cx - d.textlength(t, font=f) / 2, 380 * k), t, font=f, fill=TINTA)
        f2 = font("Bold", 40 * k); v = "R$100,00"
        d.text((cx - d.textlength(v, font=f2) / 2, 428 * k), v, font=f2, fill=ROXO)
        f3 = font("Regular", 15 * k); s = "para La Nutri Restaurante"
        d.text((cx - d.textlength(s, font=f3) / 2, 488 * k), s, font=f3, fill=(110, 100, 130))
        d.rounded_rectangle((20 * k, 780 * k, (SW - 20) * k, 832 * k), 14 * k, outline=ROXO, width=2 * k)
        d.rounded_rectangle((20 * k, 846 * k, (SW - 20) * k, 898 * k), 14 * k, fill=ROXO)
        for txt, y, c in (("Ver comprovante", 806, ROXO), ("Concluir", 872, "white")):
            ff = font("SemiBold", 16 * k)
            d.text((cx - d.textlength(txt, font=ff) / 2, (y - 10) * k), txt, font=ff, fill=c)
    im.alpha_composite(supersample(fn, SW, SH))
    return im
SUCESSO = tela_sucesso()

qr = qrcode.make("https://compropay.com.br/pagar/lanutri", border=1).convert("RGBA").resize((190, 190), Image.NEAREST)

# ---------------------------------------------------------------- aparelho
BEZEL, R_TELA = 12, 50
PW, PH = SW + 2 * BEZEL, SH + 2 * BEZEL
PX, PY = 380, (H - PH) // 2
mask_tela = Image.new("L", (SW, SH), 0)
ImageDraw.Draw(mask_tela).rounded_rectangle((0, 0, SW - 1, SH - 1), R_TELA, fill=255)

def fundo():
    y = np.linspace(0, 1, H)[:, None]; x = np.linspace(0, 1, W)[None, :]
    c1, c2 = np.array([247, 243, 253]), np.array([234, 224, 250])
    t = np.clip(0.6 * x + 0.4 * y, 0, 1)[..., None]
    bg = Image.fromarray((c1 * (1 - t) + c2 * t).astype(np.uint8), "RGB").convert("RGBA")
    sombra = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sombra).rounded_rectangle((PX + 10, PY + 30, PX + PW + 10, PY + PH + 30), R_TELA + BEZEL, fill=(60, 20, 110, 70))
    bg.alpha_composite(sombra.filter(ImageFilter.GaussianBlur(28)))
    ImageDraw.Draw(bg).rounded_rectangle((PX, PY, PX + PW, PY + PH), R_TELA + BEZEL, fill=(22, 18, 30))
    return bg
FUNDO = fundo()

# ---------------------------------------------------------------- texto lateral
TX, TW = 1000, 780
def bloco_texto(i):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    f = font("SemiBold", 60); palavras = LINHAS[i].split(); linhas, cur = [], ""
    for p in palavras:
        tentativa = (cur + " " + p).strip()
        if d.textlength(tentativa, font=f) > TW and cur: linhas.append(cur); cur = p
        else: cur = tentativa
    linhas.append(cur)
    alt = len(linhas) * 78
    y0 = H // 2 - alt // 2 + 20
    rot = "Pagar com QR code"
    d.text((TX, y0 - 70), rot.upper(), font=font("SemiBold", 22), fill=ROXO)
    for j, l in enumerate(linhas): d.text((TX, y0 + j * 78), l, font=f, fill=TINTA)
    return im
TEXTOS = [bloco_texto(i) for i in range(len(LINHAS))]

# ---------------------------------------------------------------- animação
def ease(t): t = min(max(t, 0), 1); return 1 - (1 - t) ** 3
def ramp(t, a, b): return min(max((t - a) / (b - a), 0), 1)

def montar_timeline(dur):
    """Devolve tempos de fala e eventos a partir da duração de cada frase."""
    T = {}; fala = []; t = 0.5
    def falar(i):
        nonlocal t; fala.append((t, t + dur[i])); s, e = t, t + dur[i]; return s, e
    s, e = falar(0); T["tap1"] = e + 0.15; T["tr1"] = T["tap1"] + 0.25
    t = T["tr1"] + 0.6
    s, e = falar(1); T["tap2"] = e + 0.15; T["tr2"] = T["tap2"] + 0.25
    t = T["tr2"] + 0.6
    s, e = falar(2); T["qr_in"] = s + 0.2; T["lido"] = max(e + 0.15, s + 1.6); T["tr3"] = T["lido"] + 0.3
    t = T["tr3"] + 0.6
    s, e = falar(3); T["tap4"] = s + 0.15; T["valor"] = s + 0.55
    t = max(e, T["valor"] + 0.4) + 0.5
    s, e = falar(4); T["tap5"] = s + 0.1; T["sheet_up"] = s + 0.35; T["tap_op"] = max(e + 0.1, T["sheet_up"] + 0.9)
    T["sheet_down"] = T["tap_op"] + 0.35
    t = T["sheet_down"] + 0.6
    s, e = falar(5); T["tap6"] = e + 0.15; T["tr6"] = T["tap6"] + 0.25
    t = T["tr6"] + 0.55
    s, e = falar(6); T["fim"] = e + 1.6
    return fala, T

TR = 0.42   # duração da transição de tela
def slide(a, b, p):
    p = ease(p); im = Image.new("RGBA", (SW, SH), "black")
    im.alpha_composite(a, (int(-SW * 0.3 * p), 0))
    sh = Image.new("RGBA", (SW, SH), (0, 0, 0, int(90 * p))); im.alpha_composite(sh)
    im.alpha_composite(b, (int(SW * (1 - p)), 0))
    return im

def scanner_em(t, T):
    im = SCANNER.copy()
    a = ease(ramp(t, T["qr_in"], T["qr_in"] + 0.6))
    if a > 0:
        q = qr.copy(); q.putalpha(int(235 * a)); im.alpha_composite(q, (SW // 2 - 95, 497 - 95))
    # linha de leitura subindo e descendo
    y = 420 + int(150 * (0.5 + 0.5 * math.sin(t * 3.2)))
    linha = Image.new("RGBA", (260, 4), (140, 60, 230, 230)); im.alpha_composite(linha, (SW // 2 - 130, y))
    # flash de leitura
    f = ramp(t, T["lido"], T["lido"] + 0.08) - ramp(t, T["lido"] + 0.1, T["lido"] + 0.35)
    if f > 0: im.alpha_composite(Image.new("RGBA", (SW, SH), (255, 255, 255, int(150 * f))))
    return im

def form_em(t, T):
    im = com_valor(VAZIO, ease(ramp(t, T["valor"], T["valor"] + 0.3)))
    if t >= T["sheet_down"]: im = com_forma(im)
    up = ease(ramp(t, T["sheet_up"], T["sheet_up"] + 0.35))
    down = ease(ramp(t, T["sheet_down"], T["sheet_down"] + 0.3))
    v = up * (1 - down)
    if v > 0:
        im.alpha_composite(Image.new("RGBA", (SW, SH), (10, 0, 30, int(120 * v))))
        sh = SHEET[1 if t >= T["tap_op"] else 0]
        im.alpha_composite(sh, (0, int(SH - SHEET_H * v)))
    return im

def tela_em(t, T):
    if t < T["tr1"]: return INICIO
    if t < T["tr1"] + TR: return slide(INICIO, PAGAR, (t - T["tr1"]) / TR)
    if t < T["tr2"]: return PAGAR
    if t < T["tr2"] + TR: return slide(PAGAR, scanner_em(t, T), (t - T["tr2"]) / TR)
    if t < T["tr3"]: return scanner_em(t, T)
    if t < T["tr3"] + TR: return slide(scanner_em(t, T), form_em(t, T), (t - T["tr3"]) / TR)
    if t < T["tr6"]: return form_em(t, T)
    if t < T["tr6"] + TR: return slide(form_em(t, T), SUCESSO, (t - T["tr6"]) / TR)
    return SUCESSO

def toques(T):
    return [(T["tap1"], 214, SH - TAB + (1188 - (1255 - TAB))),
            (T["tap2"], 215, 467),
            (T["tap4"], 110, 350),
            (T["tap5"], 130, 900),
            (T["tap_op"], SW - 46, SH - SHEET_H + 84 + 35),
            (T["tap6"], 377, 897)]

def desenhar_toques(im, t, lista):
    d = ImageDraw.Draw(im, "RGBA")
    for t0, x, y in lista:
        if t0 - 0.35 <= t < t0:
            a = ease(ramp(t, t0 - 0.35, t0 - 0.1)); r = 26 + 8 * (1 - a)
            d.ellipse((x - r, y - r, x + r, y + r), fill=(255, 255, 255, int(110 * a)), outline=(113, 32, 209, int(230 * a)), width=3)
        elif t0 <= t < t0 + 0.5:
            p = (t - t0) / 0.5; r = 22 + 40 * ease(p)
            d.ellipse((x - 22, y - 22, x + 22, y + 22), fill=(113, 32, 209, int(120 * (1 - p))))
            d.ellipse((x - r, y - r, x + r, y + r), outline=(113, 32, 209, int(200 * (1 - p))), width=3)

def texto_em(t, fala):
    """Índice da frase visível e opacidade (troca suave entre frases)."""
    i = 0
    for k, (s, e) in enumerate(fala):
        if t >= s - 0.25: i = k
    s = fala[i][0]
    return i, ease(ramp(t, s - 0.25, s + 0.05))

def srt(fala):
    def ts(x):
        ms = int(round(x * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
        return f"{h:02}:{m:02}:{s:02},{ms:03}"
    out = []
    for i, (s, e) in enumerate(fala):
        fim = fala[i + 1][0] - 0.05 if i + 1 < len(fala) else e + 1.2
        out.append(f"{i+1}\n{ts(s)} --> {ts(fim)}\n{LINHAS[i]}\n")
    return "\n".join(out)

def main():
    clips, sr = narrar()
    dur = [len(c) / sr for c in clips]
    fala, T = montar_timeline(dur)
    total = T["fim"]
    audio = np.zeros(int((total + 0.5) * sr), dtype=np.float32)
    for (s, _), c in zip(fala, clips):
        i = int(s * sr); audio[i:i + len(c)] += c
    wav = os.path.join(OUT, "narracao.wav"); sf.write(wav, audio, sr)
    open(os.path.join(OUT, "pagar-qrcode.srt"), "w").write(srt(fala))

    mp4 = os.path.join(OUT, "pagar-qrcode.mp4")
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-i", wav,
                           "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
                           "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", mp4],
                          stdin=subprocess.PIPE)
    lista = toques(T); n = int(total * FPS)
    for f in range(n):
        t = f / FPS
        tela = tela_em(t, T).copy()
        desenhar_toques(tela, t, lista)
        quadro = FUNDO.copy()
        quadro.paste(tela, (PX + BEZEL, PY + BEZEL), mask_tela)
        i, a = texto_em(t, fala)
        if a < 1 and i > 0:
            prev = TEXTOS[i - 1].copy(); prev.putalpha(prev.getchannel("A").point(lambda v: int(v * (1 - a))))
            quadro.alpha_composite(prev)
        cur = TEXTOS[i] if a >= 1 else TEXTOS[i].copy()
        if a < 1: cur.putalpha(cur.getchannel("A").point(lambda v: int(v * a)))
        quadro.alpha_composite(cur)
        fo = ramp(t, total - 0.5, total)
        if fo > 0: quadro.alpha_composite(Image.new("RGBA", (W, H), (247, 243, 253, int(255 * fo))))
        ff.stdin.write(quadro.convert("RGB").tobytes())
        if "--prever" in sys.argv and f % 15 == 0:
            quadro.convert("RGB").save(os.path.join(OUT, f"q{f:04}.jpg"), quality=80)
    ff.stdin.close(); ff.wait()
    print("duração", round(total, 2), "s ->", mp4)
    for k, v in T.items(): print(f"  {k}: {v:.2f}")

if __name__ == "__main__":
    main()
