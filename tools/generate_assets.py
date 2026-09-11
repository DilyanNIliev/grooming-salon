#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Генератор на SVG илюстрациите за сайта на груминг салон "Пух & Мустак".

Всички изображения в assets/img/ са векторни (SVG), генерирани от този скрипт,
за да няма външни зависимости и счупени линкове. Ако искаш да ги замениш
с истински снимки, виж раздел "Как да сложа истински снимки" в README.md.

Стартиране:  python3 tools/generate_assets.py
"""

import math
import os
import random

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "img")

# --- Палитра --------------------------------------------------------------
CREAM = "#FFF8F3"
CORAL = "#E8674C"
CORAL_DARK = "#C4553D"
MINT = "#79C3A8"
BROWN = "#3A2C27"
BLUSH = "#F6B8A8"
SKY = "#9EC5E0"


def head(w, h, extra=""):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
        f'width="{w}" height="{h}" role="img" {extra}>'
    )


def write(name, body):
    path = os.path.join(OUT, name)
    with open(path, "w", encoding="utf-8") as f:
        f.write(body)
    print("  ->", os.path.relpath(path, os.path.dirname(OUT)))


def mix(c1, c2, t):
    """Смесва два hex цвята (t=0 -> c1, t=1 -> c2)."""
    a = [int(c1[i:i + 2], 16) for i in (1, 3, 5)]
    b = [int(c2[i:i + 2], 16) for i in (1, 3, 5)]
    return "#" + "".join(f"{int(round(a[i] + (b[i] - a[i]) * t)):02X}" for i in range(3))


def body(cx, cy, color, color_dark, s=1.0, fluffy=False, seed=1, bib=True):
    """Гърди/тяло под главата — прави портрета по-плътен."""
    out = []
    top = cy + 34 * s
    if fluffy:
        out.append(fur_ring(cx, top + 78 * s, 92 * s, 62 * s, color, tufts=40, amp=17 * s, seed=seed + 77))
    out.append(
        f'<path d="M{cx - 86 * s:.1f} {top + 150 * s:.1f} '
        f'q {6 * s:.1f} {-116 * s:.1f} {86 * s:.1f} {-116 * s:.1f} '
        f'q {80 * s:.1f} 0 {86 * s:.1f} {116 * s:.1f} Z" fill="{color_dark}"/>'
    )
    if bib:
        out.append(
            f'<path d="M{cx - 34 * s:.1f} {top + 150 * s:.1f} '
            f'q {2 * s:.1f} {-74 * s:.1f} {34 * s:.1f} {-74 * s:.1f} '
            f'q {32 * s:.1f} 0 {34 * s:.1f} {74 * s:.1f} Z" fill="{color}" opacity=".75"/>'
        )
    return "".join(out)


def fur_ring(cx, cy, rx, ry, color, tufts=46, amp=13, seed=1):
    """Рошав контур от малки кръгчета около главата."""
    rnd = random.Random(seed)
    out = []
    for i in range(tufts):
        a = (i / tufts) * math.tau
        wob = rnd.uniform(-amp * 0.35, amp)
        x = cx + math.cos(a) * (rx + wob * 0.4)
        y = cy + math.sin(a) * (ry + wob * 0.4)
        r = rnd.uniform(amp * 0.75, amp * 1.35)
        out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{color}"/>')
    return "".join(out)


def face(cx, cy, scale=1.0, blush=True, tongue=False, closed_eyes=False, sad=False):
    """Очи, нос, усмивка — общи за куче и котка."""
    s = scale
    eye_dx, eye_dy, eye_r = 26 * s, 8 * s, 9 * s
    p = []
    if closed_eyes:
        for sgn in (-1, 1):
            p.append(
                f'<path d="M{cx + sgn * eye_dx - 9 * s:.1f} {cy - eye_dy:.1f} '
                f'q {9 * s:.1f} {9 * s:.1f} {18 * s:.1f} 0" fill="none" '
                f'stroke="{BROWN}" stroke-width="{3.4 * s:.1f}" stroke-linecap="round"/>'
            )
    else:
        for sgn in (-1, 1):
            p.append(
                f'<ellipse cx="{cx + sgn * eye_dx:.1f}" cy="{cy - eye_dy:.1f}" '
                f'rx="{eye_r:.1f}" ry="{eye_r * 1.12:.1f}" fill="{BROWN}"/>'
                f'<circle cx="{cx + sgn * eye_dx + 3 * s:.1f}" cy="{cy - eye_dy - 3.5 * s:.1f}" '
                f'r="{3.2 * s:.1f}" fill="#fff" opacity=".92"/>'
            )
    # нос
    p.append(
        f'<path d="M{cx - 11 * s:.1f} {cy + 16 * s:.1f} q {11 * s:.1f} {-7 * s:.1f} {22 * s:.1f} 0 '
        f'q {-4 * s:.1f} {13 * s:.1f} {-11 * s:.1f} {13 * s:.1f} '
        f'q {-7 * s:.1f} 0 {-11 * s:.1f} {-13 * s:.1f} Z" fill="{BROWN}"/>'
    )
    # уста: усмивка или умърлушена
    d = -1 if sad else 1
    p.append(
        f'<path d="M{cx:.1f} {cy + 29 * s:.1f} q {-9 * s:.1f} {10 * s * d:.1f} {-18 * s:.1f} {1 * s * d:.1f} '
        f'M{cx:.1f} {cy + 29 * s:.1f} q {9 * s:.1f} {10 * s * d:.1f} {18 * s:.1f} {1 * s * d:.1f}" '
        f'fill="none" stroke="{BROWN}" stroke-width="{3.2 * s:.1f}" stroke-linecap="round"/>'
    )
    if tongue:
        p.append(
            f'<path d="M{cx - 7 * s:.1f} {cy + 32 * s:.1f} h {14 * s:.1f} '
            f'a {7 * s:.1f} {9 * s:.1f} 0 0 1 {-14 * s:.1f} 0 Z" fill="{BLUSH}"/>'
        )
    if blush:
        for sgn in (-1, 1):
            p.append(
                f'<ellipse cx="{cx + sgn * 47 * s:.1f}" cy="{cy + 12 * s:.1f}" '
                f'rx="{13 * s:.1f}" ry="{8 * s:.1f}" fill="{BLUSH}" opacity=".55"/>'
            )
    return "".join(p)


def tufts_out(cx, cy, r, color, n=9, seed=3, s=1.0):
    """Стърчащи кичури — за силно занемарена козина."""
    rnd = random.Random(seed)
    out = []
    for i in range(n):
        a = rnd.uniform(0, math.tau)
        ln = rnd.uniform(22, 46) * s
        x, y = cx + math.cos(a) * r, cy + math.sin(a) * r
        x2, y2 = cx + math.cos(a) * (r + ln), cy + math.sin(a) * (r + ln)
        w = rnd.uniform(7, 13) * s
        px, py = -math.sin(a) * w, math.cos(a) * w
        out.append(
            f'<path d="M{x + px:.1f} {y + py:.1f} L{x2:.1f} {y2:.1f} '
            f'L{x - px:.1f} {y - py:.1f} Z" fill="{color}"/>'
        )
    return "".join(out)


def dog(cx, cy, coat, coat_dark, fluffy, seed=1, scale=1.0, tongue=True, bow=None,
        with_body=False):
    """Портрет на куче. fluffy=True -> рошаво (преди), False -> подстригано (след)."""
    s = scale
    g = []
    if with_body:
        g.append(body(cx, cy, coat, coat_dark, s, fluffy, seed))
    # уши
    ear_ry = 66 * s if fluffy else 46 * s
    for sgn in (-1, 1):
        g.append(
            f'<ellipse cx="{cx + sgn * 74 * s:.1f}" cy="{cy + 14 * s:.1f}" '
            f'rx="{26 * s:.1f}" ry="{ear_ry:.1f}" fill="{coat_dark}" '
            f'transform="rotate({sgn * 12} {cx + sgn * 74 * s:.1f} {cy + 14 * s:.1f})"/>'
        )
    if fluffy:
        g.append(tufts_out(cx, cy - 6 * s, 82 * s, coat, 11, seed + 5, s))
        g.append(fur_ring(cx, cy, 82 * s, 76 * s, coat, tufts=58, amp=22 * s, seed=seed))
    g.append(f'<ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="{72 * s:.1f}" ry="{66 * s:.1f}" fill="{coat}"/>')
    # муцунка
    g.append(
        f'<ellipse cx="{cx:.1f}" cy="{cy + 22 * s:.1f}" rx="{40 * s:.1f}" ry="{31 * s:.1f}" '
        f'fill="#fff" opacity="{".28" if fluffy else ".55"}"/>'
    )
    if fluffy:
        # щръкнал перчем, който пада над очите
        g.append(
            f'<path d="M{cx - 46 * s:.1f} {cy - 46 * s:.1f} q {14 * s:.1f} {-42 * s:.1f} {44 * s:.1f} {-20 * s:.1f} '
            f'q {26 * s:.1f} {-26 * s:.1f} {48 * s:.1f} {14 * s:.1f} '
            f'q {10 * s:.1f} {24 * s:.1f} {-12 * s:.1f} {34 * s:.1f} Z" fill="{coat}"/>'
        )
    g.append(face(cx, cy, s, tongue=tongue, blush=not fluffy, sad=fluffy))
    if bow:
        g.append(bow_tie(cx + 58 * s, cy - 48 * s, s * 0.9, bow))
    return "".join(g)


def cat(cx, cy, coat, coat_dark, fluffy, seed=2, scale=1.0, bow=None, with_body=False):
    s = scale
    g = []
    if with_body:
        g.append(body(cx, cy, coat, coat_dark, s, fluffy, seed))
    for sgn in (-1, 1):
        bx = cx + sgn * 46 * s
        g.append(
            f'<path d="M{bx - 26 * s:.1f} {cy - 40 * s:.1f} L{bx + sgn * 6 * s:.1f} {cy - 92 * s:.1f} '
            f'L{bx + 26 * s:.1f} {cy - 36 * s:.1f} Z" fill="{coat_dark}"/>'
            f'<path d="M{bx - 14 * s:.1f} {cy - 44 * s:.1f} L{bx + sgn * 4 * s:.1f} {cy - 78 * s:.1f} '
            f'L{bx + 14 * s:.1f} {cy - 42 * s:.1f} Z" fill="{BLUSH}" opacity=".75"/>'
        )
    if fluffy:
        g.append(tufts_out(cx, cy - 4 * s, 76 * s, coat, 10, seed + 5, s))
        g.append(fur_ring(cx, cy, 76 * s, 70 * s, coat, tufts=54, amp=20 * s, seed=seed))
    g.append(f'<ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="{68 * s:.1f}" ry="{62 * s:.1f}" fill="{coat}"/>')
    g.append(face(cx, cy, s, tongue=False, blush=not fluffy, sad=fluffy))
    # мустаци
    for sgn in (-1, 1):
        for i, dy in enumerate((-2, 7, 16)):
            g.append(
                f'<path d="M{cx + sgn * 22 * s:.1f} {cy + (14 + dy) * s:.1f} '
                f'q {sgn * 30 * s:.1f} {(-6 + i * 4) * s:.1f} {sgn * 56 * s:.1f} {(-10 + i * 9) * s:.1f}" '
                f'fill="none" stroke="{BROWN}" stroke-width="{2.2 * s:.1f}" '
                f'stroke-linecap="round" opacity=".65"/>'
            )
    if bow:
        g.append(bow_tie(cx + 52 * s, cy - 40 * s, s * 0.85, bow))
    return "".join(g)


def bow_tie(x, y, s, color):
    return (
        f'<g transform="translate({x:.1f} {y:.1f}) rotate(-14) scale({s:.2f})">'
        f'<path d="M0 0 L-26 -15 L-26 15 Z" fill="{color}"/>'
        f'<path d="M0 0 L26 -15 L26 15 Z" fill="{color}"/>'
        f'<circle cx="0" cy="0" r="7" fill="#fff" opacity=".85"/></g>'
    )


def bubbles(seed, w, h, n=14, color="#ffffff", op=".5"):
    rnd = random.Random(seed)
    return "".join(
        f'<circle cx="{rnd.uniform(10, w - 10):.0f}" cy="{rnd.uniform(10, h - 10):.0f}" '
        f'r="{rnd.uniform(4, 17):.0f}" fill="{color}" opacity="{op}"/>'
        for _ in range(n)
    )


def card(w, h, bg, inner, title_id, label):
    """Заоблена „снимка" с меко фоново петно."""
    return (
        head(w, h, f'aria-labelledby="{title_id}"')
        + f'<title id="{title_id}">{label}</title>'
        + f'<defs><clipPath id="c{title_id}"><rect width="{w}" height="{h}" rx="0"/></clipPath>'
        + f'<linearGradient id="g{title_id}" x1="0" y1="0" x2="0" y2="1">'
        + f'<stop offset="0" stop-color="{bg[0]}"/><stop offset="1" stop-color="{bg[1]}"/>'
        + "</linearGradient></defs>"
        + f'<g clip-path="url(#c{title_id})"><rect width="{w}" height="{h}" fill="url(#g{title_id})"/>'
        + inner
        + "</g></svg>"
    )


# --- Конкретните изображения ---------------------------------------------

def make_hero():
    w, h = 720, 620
    inner = (
        f'<circle cx="360" cy="300" r="252" fill="#fff" opacity=".55"/>'
        + bubbles(7, w, h, 22, "#fff", ".45")
        + dog(288, 268, "#F0D3B4", "#DDB68F", fluffy=False, scale=1.62, tongue=True,
              bow=CORAL, with_body=True)
        + cat(506, 366, "#CFC3BA", "#B5A79C", fluffy=False, scale=1.12, bow=MINT, with_body=True)
        # лапи долу
        + f'<g opacity=".5" fill="{CORAL}">'
        + '<circle cx="92" cy="536" r="17"/><circle cx="70" cy="506" r="8"/>'
        + '<circle cx="92" cy="498" r="8"/><circle cx="114" cy="506" r="8"/></g>'
        + f'<g opacity=".35" fill="{MINT}">'
        + '<circle cx="638" cy="152" r="15"/><circle cx="618" cy="126" r="7"/>'
        + '<circle cx="638" cy="118" r="7"/><circle cx="658" cy="126" r="7"/></g>'
    )
    write("hero.svg", card(w, h, ("#FFEFE6", "#FFF8F3"), inner, "hero",
                           "Щастливо куче и котка след груминг процедура"))


def make_team():
    w, h = 640, 720
    inner = (
        bubbles(3, w, h, 16, "#fff", ".4")
        # силует на гримьора
        + f'<ellipse cx="320" cy="690" rx="230" ry="210" fill="{MINT}" opacity=".9"/>'
        + f'<rect x="252" y="430" width="136" height="120" rx="52" fill="#F3C9A8"/>'
        + f'<circle cx="320" cy="330" r="118" fill="#F7D6B8"/>'
        # коса
        + f'<path d="M202 330 a118 118 0 0 1 236 0 q-30 -46 -118 -46 q-88 0 -118 46 Z" fill="#4A3730"/>'
        + f'<path d="M202 330 q-14 96 26 150 q-56 -26 -46 -150 Z" fill="#4A3730"/>'
        + f'<path d="M438 330 q14 96 -26 150 q56 -26 46 -150 Z" fill="#4A3730"/>'
        + face(320, 330, 1.25, blush=True)
        # куче в ръцете
        + dog(452, 596, "#E9D3C1", "#D2B49E", fluffy=False, scale=0.85, tongue=True, bow=CORAL)
        # значка
        + f'<circle cx="180" cy="596" r="44" fill="#fff" opacity=".95"/>'
        + f'<path d="M180 570 l7 15 17 2 -12 12 3 17 -15 -8 -15 8 3 -17 -12 -12 17 -2 Z" fill="{CORAL}"/>'
    )
    write("team.svg", card(w, h, ("#EAF6F1", "#FFF8F3"), inner, "team",
                           "Груминг специалист държи щастливо куче"))


def make_pair(name, kind, coat, coat_dark, bg, label_before, label_after, seed):
    w, h = 560, 560
    common = bubbles(seed, w, h, 12, "#fff", ".38")
    # „Преди“: по-мътна и потъмняла козина; „След“: изсветлена и чиста
    dull = mix(coat, "#8C7F74", 0.34)
    dull_dark = mix(coat_dark, "#7A6E64", 0.34)
    bright = mix(coat, "#FFFFFF", 0.12)
    if kind == "dog":
        before = dog(280, 250, dull, dull_dark, fluffy=True, seed=seed, scale=1.72,
                     tongue=False, with_body=True)
        after = dog(280, 250, bright, coat_dark, fluffy=False, seed=seed, scale=1.72,
                    tongue=True, bow=CORAL, with_body=True)
    else:
        before = cat(280, 250, dull, dull_dark, fluffy=True, seed=seed, scale=1.72, with_body=True)
        after = cat(280, 250, bright, coat_dark, fluffy=False, seed=seed, scale=1.72,
                    bow=MINT, with_body=True)
    write(f"{name}-before.svg",
          card(w, h, bg, common + before, f"{name}b", label_before))
    write(f"{name}-after.svg",
          card(w, h, ("#FFF1EA", "#FFF8F3"), common + after
               + f'<g fill="#fff" opacity=".75"><circle cx="486" cy="86" r="9"/>'
                 f'<circle cx="462" cy="120" r="5"/><circle cx="508" cy="128" r="6"/></g>',
               f"{name}a", label_after))


def make_avatar(name, kind, coat, coat_dark, bg, label, seed):
    w = h = 200
    art = (dog(100, 104, coat, coat_dark, False, seed, 0.62, tongue=True)
           if kind == "dog" else cat(100, 104, coat, coat_dark, False, seed, 0.62))
    write(name, card(w, h, bg, art, name.replace(".svg", ""), label))


def make_logo():
    svg = (
        head(64, 64, 'aria-hidden="true"')
        + f'<circle cx="32" cy="32" r="32" fill="{CORAL}"/>'
        + '<g fill="#fff"><ellipse cx="32" cy="40" rx="13" ry="11"/>'
        + '<circle cx="17" cy="25" r="6"/><circle cx="30" cy="18" r="6.5"/>'
        + '<circle cx="44" cy="24" r="6"/></g></svg>'
    )
    write("logo.svg", svg)
    # favicon (същият знак, но с крем фон за малки размери)
    write("favicon.svg", svg.replace('r="32" fill="%s"' % CORAL, f'r="32" fill="{CORAL}"'))


def make_pattern():
    """Фонов паттерн с лапички."""
    svg = (
        head(120, 120, 'aria-hidden="true"')
        + f'<g fill="{CORAL}" opacity=".08">'
        + '<g transform="translate(20 22)"><ellipse cx="0" cy="8" rx="9" ry="7.5"/>'
        + '<circle cx="-10" cy="-4" r="4"/><circle cx="-1" cy="-10" r="4.4"/>'
        + '<circle cx="9" cy="-5" r="4"/></g>'
        + '<g transform="translate(80 78) rotate(20)"><ellipse cx="0" cy="8" rx="9" ry="7.5"/>'
        + '<circle cx="-10" cy="-4" r="4"/><circle cx="-1" cy="-10" r="4.4"/>'
        + '<circle cx="9" cy="-5" r="4"/></g></g></svg>'
    )
    write("paws.svg", svg)


def make_og():
    w, h = 1200, 630
    inner = (
        bubbles(11, w, h, 26, "#fff", ".45")
        + dog(320, 330, "#F0D3B4", "#DDB68F", False, 1, 1.5, tongue=True, bow=CORAL)
        + cat(520, 400, "#CFC3BA", "#B5A79C", False, 2, 1.0, bow=MINT)
        + f'<text x="700" y="290" font-family="Verdana,sans-serif" font-size="64" '
          f'font-weight="bold" fill="{BROWN}">Пух &amp; Мустак</text>'
        + f'<text x="700" y="356" font-family="Verdana,sans-serif" font-size="34" '
          f'fill="{CORAL_DARK}">Груминг салон · София</text>'
        + f'<text x="700" y="416" font-family="Verdana,sans-serif" font-size="28" '
          f'fill="{BROWN}" opacity=".75">Онлайн резервация за час</text>'
    )
    write("og-image.svg", card(w, h, ("#FFEFE6", "#FFF8F3"), inner, "og",
                               "Пух и Мустак — груминг салон"))


def main():
    os.makedirs(OUT, exist_ok=True)
    print("Генериране на SVG изображения в", OUT)
    make_logo()
    make_pattern()
    make_hero()
    make_team()
    make_og()

    make_pair("bichon", "dog", "#F7EFE6", "#E2D5C6", ("#EFF4FB", "#FFF8F3"),
              "Бишон фризе преди подстригване — сплъстена козина",
              "Бишон фризе след груминг — оформена бяла козина", 5)
    make_pair("yorkie", "dog", "#D8B48C", "#B98F66", ("#FBF1E6", "#FFF8F3"),
              "Йоркширски териер преди груминг — дълга заплетена козина",
              "Йоркширски териер след груминг — къса поддържана козина", 9)
    make_pair("persian", "cat", "#E7DCCB", "#CDBFA9", ("#F3F0FA", "#FFF8F3"),
              "Персийска котка преди груминг — възли по козината",
              "Персийска котка след груминг — пухкава чиста козина", 13)
    make_pair("poodle", "dog", "#C8B9AE", "#A89890", ("#EAF6F1", "#FFF8F3"),
              "Пудел преди подстригване — израснала козина",
              "Пудел след подстригване — модерна визия", 17)
    make_pair("maltese", "dog", "#FBF6EF", "#E6DCCF", ("#FDEEF3", "#FFF8F3"),
              "Малтийска болонка преди груминг",
              "Малтийска болонка след груминг — копринена козина", 21)
    make_pair("britanska", "cat", "#BCC7CF", "#9EACB8", ("#EDF3F7", "#FFF8F3"),
              "Британска късокосместа котка преди процедура",
              "Британска късокосместа котка след къпане и подстригване на нокти", 25)

    make_avatar("avatar-1.svg", "dog", "#E4C49E", "#C9A57C", ("#FFEFE6", "#FFF8F3"),
                "Клиент с куче", 31)
    make_avatar("avatar-2.svg", "cat", "#D8CEC4", "#BCB0A4", ("#EAF6F1", "#FFF8F3"),
                "Клиент с котка", 33)
    make_avatar("avatar-3.svg", "dog", "#F2E7DA", "#DCCCBA", ("#EFF4FB", "#FFF8F3"),
                "Клиент с малко куче", 35)
    make_avatar("avatar-4.svg", "dog", "#B9A392", "#9C8574", ("#FDEEF3", "#FFF8F3"),
                "Клиент с голямо куче", 37)
    print("Готово.")


if __name__ == "__main__":
    main()
