#!/usr/bin/env python3
"""Generate the Eaton Home portfolio wireframe + diagram SVG sheets.

Run:  python3 scripts/generate-wireframes.py
Outputs into portfolio/wireframes and portfolio/diagrams.
"""

import os
from html import escape

ROOT = os.path.join(os.path.dirname(__file__), "..", "portfolio")
FONT = "Helvetica Neue, Arial, sans-serif"

# ---- palette (grayscale sheet + single annotation accent) ----
PAPER = "#ffffff"
CANVAS = "#f3f4f6"
LINE = "#b9bfc7"
LINE_SOFT = "#d5dae0"
FILL = "#eceef1"
FILL_DARK = "#dde1e6"
BAR = "#c9ced5"
INK = "#374151"
MUTE = "#6b7280"
FAINT = "#9aa0a8"
ACCENT = "#3d5afe"


class Sheet:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.parts = []

    def add(self, s):
        self.parts.append(s)

    # ---- primitives -------------------------------------------------
    def rect(self, x, y, w, h, rx=0, fill=FILL, stroke=LINE, sw=1.5, dash=None):
        d = f' stroke-dasharray="{dash}"' if dash else ""
        self.add(
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" '
            f'fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{d}/>'
        )

    def line(self, x1, y1, x2, y2, stroke=LINE, sw=1.5, dash=None):
        d = f' stroke-dasharray="{dash}"' if dash else ""
        self.add(
            f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" '
            f'stroke="{stroke}" stroke-width="{sw}"{d}/>'
        )

    def text(self, x, y, s, size=13, color=MUTE, weight=400, anchor="start", spacing=None):
        sp = f' letter-spacing="{spacing}"' if spacing else ""
        self.add(
            f'<text x="{x}" y="{y}" font-family="{FONT}" font-size="{size}" '
            f'fill="{color}" font-weight="{weight}" text-anchor="{anchor}"{sp}>{escape(s)}</text>'
        )

    def tbar(self, x, y, w, h=9, fill=BAR):
        self.rect(x, y, w, h, rx=h / 2, fill=fill, stroke="none", sw=0)

    def tlines(self, x, y, w, n=3, gap=16, last=0.6):
        for i in range(n):
            self.tbar(x, y + i * gap, w * (last if i == n - 1 else 1))

    def imgbox(self, x, y, w, h, rx=8):
        self.rect(x, y, w, h, rx=rx, fill=FILL_DARK)
        self.line(x + 6, y + 6, x + w - 6, y + h - 6, stroke=LINE, sw=1)
        self.line(x + w - 6, y + 6, x + 6, y + h - 6, stroke=LINE, sw=1)

    def pill(self, x, y, w, h=22, label=None, fill=FILL, stroke=LINE):
        self.rect(x, y, w, h, rx=h / 2, fill=fill, stroke=stroke, sw=1.2)
        if label:
            self.text(x + w / 2, y + h / 2 + 4, label, size=10.5, anchor="middle")

    def button(self, x, y, w, h=34, label="", dark=True):
        self.rect(x, y, w, h, rx=h / 2, fill=FILL_DARK if dark else PAPER, stroke=LINE)
        self.text(x + w / 2, y + h / 2 + 4, label, size=11.5, color=INK, anchor="middle", weight=500)

    def dot(self, x, y, r=5, fill=BAR, stroke="none"):
        self.add(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="{stroke}"/>')

    def annot(self, x, y, n):
        self.add(f'<circle cx="{x}" cy="{y}" r="11" fill="{ACCENT}"/>')
        self.text(x, y + 4, str(n), size=12, color="#ffffff", anchor="middle", weight=600)

    def arrow(self, x1, y1, x2, y2, stroke=FAINT, sw=1.6):
        self.line(x1, y1, x2, y2, stroke=stroke, sw=sw)
        import math

        a = math.atan2(y2 - y1, x2 - x1)
        for da in (2.6, -2.6):
            self.line(
                x2,
                y2,
                x2 + 9 * math.cos(a + da),
                y2 + 9 * math.sin(a + da),
                stroke=stroke,
                sw=sw,
            )

    # ---- compound blocks ---------------------------------------------
    def header_strip(self, sheet_no, screen, kind="Lo-fi wireframe · v2"):
        self.rect(0, 0, self.w, 74, fill=PAPER, stroke="none", sw=0)
        self.line(0, 74, self.w, 74, stroke=LINE_SOFT, sw=1)
        self.rect(36, 22, 30, 30, rx=8, fill=FILL_DARK)
        self.line(43, 40, 51, 31, stroke=MUTE, sw=2)
        self.line(51, 31, 59, 40, stroke=MUTE, sw=2)
        self.text(80, 36, "EATON HOME", size=14, color=INK, weight=600, spacing="0.18em")
        self.text(80, 54, "Household OS — UX documentation", size=11, color=FAINT)
        self.text(self.w / 2, 45, screen, size=19, color=INK, weight=500, anchor="middle")
        self.text(self.w - 36, 36, f"{sheet_no} · {kind}", size=12, color=MUTE, anchor="end")
        self.text(self.w - 36, 54, "M. Eaton · Parker, CO · 2026", size=11, color=FAINT, anchor="end")

    def notes_panel(self, x, y, w, notes, title="Annotations"):
        self.text(x, y, title.upper(), size=11.5, color=INK, weight=600, spacing="0.14em")
        cy = y + 26
        for i, (head, lines) in enumerate(notes, start=1):
            self.annot(x + 11, cy + 1, i)
            self.text(x + 32, cy + 5, head, size=12.5, color=INK, weight=600)
            ly = cy + 24
            for ln in lines:
                self.text(x + 32, ly, ln, size=11.5, color=MUTE)
                ly += 16
            cy = ly + 14

    def sidebar(self, x, y, h):
        self.rect(x, y, 64, h, rx=18, fill=FILL_DARK)
        self.rect(x + 16, y + 18, 32, 32, rx=9, fill=BAR, stroke="none", sw=0)
        for i in range(5):
            self.rect(x + 17, y + 90 + i * 46, 30, 30, rx=9,
                      fill=PAPER if i == 0 else "none", stroke=LINE, sw=1.2)
        self.dot(x + 26, y + h - 74, 8)
        self.dot(x + 40, y + h - 74, 8, fill=FILL)
        self.rect(x + 19, y + h - 48, 26, 26, rx=8, fill="none", stroke=LINE, sw=1.2)

    def statcard(self, x, y, w, h, label):
        self.rect(x, y, w, h, rx=16, fill=PAPER)
        self.rect(x + 14, y + 14, 26, 26, rx=8, fill=FILL)
        self.text(x + 48, y + 31, label, size=10.5, color=FAINT, spacing="0.08em")
        self.tbar(x + 14, y + 56, w * 0.42, h=16)
        self.tbar(x + 14, y + 82, w * 0.55, h=7)

    def save(self, path):
        body = "\n".join(self.parts)
        svg = (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.w}" height="{self.h}" '
            f'viewBox="0 0 {self.w} {self.h}">'
            f'<rect width="{self.w}" height="{self.h}" fill="{CANVAS}"/>'
            f'<rect x="0.5" y="0.5" width="{self.w - 1}" height="{self.h - 1}" '
            f'fill="{PAPER}" stroke="{LINE_SOFT}"/>' + body + "</svg>"
        )
        full = os.path.join(ROOT, path)
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, "w") as f:
            f.write(svg)
        print("wrote", path)


# =====================================================================
# WF-01 · Login
# =====================================================================
def wf_login():
    s = Sheet(1720, 1080)
    s.header_strip("WF-01", "Login — dual-entry authentication")
    fx, fy, fw, fh = 60, 130, 1180, 860
    s.rect(fx, fy, fw, fh, rx=28, fill=CANVAS)
    # left brand panel
    s.rect(fx + 28, fy + 28, 620, fh - 56, rx=22, fill=FILL_DARK)
    s.rect(fx + 60, fy + 64, 40, 40, rx=11, fill=BAR, stroke="none", sw=0)
    s.tbar(fx + 112, fy + 76, 90, h=12)
    s.pill(fx + 60, fy + 420, 260, 24, "TAGLINE / POSITIONING PILL")
    s.tbar(fx + 60, fy + 470, 380, h=26, fill=BAR)
    s.tbar(fx + 60, fy + 508, 320, h=26, fill=BAR)
    s.tbar(fx + 60, fy + 546, 220, h=26, fill=BAR)
    s.tlines(fx + 60, fy + 606, 330, n=2)
    s.text(fx + 60, fy + fh - 76, "PRIORITIES · BUDGET · 3D HOUSE · CARE", size=10.5, color=FAINT, spacing="0.14em")
    s.annot(fx + 340, fy + 100, 2)
    # right form panel
    px = fx + 690
    s.text(px, fy + 96, "Welcome home", size=24, color=INK, weight=300)
    s.tbar(px, fy + 116, 260, h=8)
    for i, lab in enumerate(("EMAIL", "PASSWORD")):
        yy = fy + 170 + i * 92
        s.text(px, yy, lab, size=10.5, color=FAINT, spacing="0.1em")
        s.rect(px, yy + 12, 420, 44, rx=14, fill=PAPER)
        s.dot(px + 22, yy + 34, 7, fill=FILL_DARK)
    s.button(px, fy + 380, 420, 46, "SIGN IN")
    s.annot(px + 450, fy + 403, 1)
    s.line(px, fy + 470, px + 180, fy + 470, stroke=LINE_SOFT)
    s.text(px + 210, fy + 474, "OR", size=10, color=FAINT)
    s.line(px + 240, fy + 470, px + 420, fy + 470, stroke=LINE_SOFT)
    s.button(px, fy + 500, 420, 46, "STEP INSIDE THE DEMO HOME", dark=False)
    s.annot(px + 450, fy + 523, 3)
    s.tbar(px + 60, fy + 580, 300, h=8)
    s.notes_panel(1300, 170, 380, [
        ("Primary auth", ["Supabase email + password. Errors inline,", "never a modal. Enter submits."]),
        ("Brand panel earns its width", ["Positioning copy sells the product to the", "second user (Nate) before first sign-in.", "Collapses entirely on mobile."]),
        ("Zero-config demo path", ["A guest entrance seeded with realistic data.", "Removes the empty-state cold start and", "doubles as the stakeholder demo."]),
    ])
    s.save("wireframes/wf-01-login.svg")


# =====================================================================
# WF-02 · Dashboard
# =====================================================================
def wf_dashboard():
    s = Sheet(1720, 1080)
    s.header_strip("WF-02", "Dashboard — the 30-second household briefing")
    fx, fy = 60, 130
    s.sidebar(fx, fy, 860)
    cx = fx + 92
    s.text(cx, fy + 26, "MONDAY, MARCH 2", size=10.5, color=FAINT, spacing="0.2em")
    s.tbar(cx, fy + 44, 330, h=24, fill=BAR)
    s.button(cx + 880, fy + 30, 210, 40, "OPEN PRIORITY LIST")
    s.annot(cx + 350, fy + 56, 1)
    # stat cards
    for i, lab in enumerate(("ACTIVE PROJECTS", "PLANNED SPEND", "PROJECT FUND", "CARE DUE SOON")):
        s.statcard(cx + i * 278, fy + 100, 258, 104, lab)
    s.annot(cx + 1090, fy + 152, 2)
    # priority list
    ly = fy + 234
    s.rect(cx, ly, 700, 500, rx=22, fill=CANVAS)
    s.text(cx + 24, ly + 36, "Top priorities", size=16, color=INK, weight=500)
    s.tbar(cx + 24, ly + 50, 200, h=7)
    s.dot(cx + 660, ly + 36, 16, fill=FILL, stroke=LINE)
    for r in range(6):
        ry = ly + 76 + r * 68
        s.rect(cx + 20, ry, 660, 56, rx=14, fill=PAPER)
        s.rect(cx + 34, ry + 12, 32, 32, rx=9, fill=FILL_DARK if r == 0 else FILL)
        s.text(cx + 50, ry + 32, str(r + 1), size=12, color=INK, anchor="middle", weight=600)
        s.tbar(cx + 82, ry + 16, 190)
        s.tbar(cx + 82, ry + 34, 110, h=6)
        s.rect(cx + 300, ry + 24, 90, 6, rx=3, fill=FILL_DARK)
        s.rect(cx + 300, ry + 24, 90 * (0.7 - r * 0.1), 6, rx=3, fill=BAR)
        s.pill(cx + 412, ry + 17, 52, 20)
        s.tbar(cx + 480, ry + 20, 56, h=11)
        s.pill(cx + 556, ry + 17, 96, 20)
    s.annot(cx + 710, ly + 104, 3)
    # right rail
    rx0 = cx + 730
    s.rect(rx0, ly, 380, 190, rx=22, fill=FILL_DARK)
    s.text(rx0 + 20, ly + 34, "3D HOUSE", size=10.5, color=MUTE, spacing="0.16em")
    s.line(rx0 + 90, ly + 120, rx0 + 150, ly + 74, stroke=MUTE, sw=2)
    s.line(rx0 + 150, ly + 74, rx0 + 210, ly + 120, stroke=MUTE, sw=2)
    s.rect(rx0 + 104, ly + 120, 92, 46, fill="none", stroke=MUTE, sw=2)
    s.dot(rx0 + 236, ly + 96, 5, fill=ACCENT)
    s.dot(rx0 + 130, ly + 140, 5, fill=ACCENT)
    s.tbar(rx0 + 20, ly + 156, 160)
    s.annot(rx0 + 350, ly + 30, 4)
    s.rect(rx0, ly + 210, 380, 140, rx=22, fill=CANVAS)
    s.text(rx0 + 20, ly + 240, "PRICE WATCH", size=10.5, color=FAINT, spacing="0.16em")
    s.tbar(rx0 + 20, ly + 258, 220)
    pts = [(0, 26), (40, 18), (80, 22), (120, 10), (160, 14), (200, 2)]
    for i in range(len(pts) - 1):
        s.line(rx0 + 20 + pts[i][0], ly + 316 - pts[i][1], rx0 + 20 + pts[i + 1][0], ly + 316 - pts[i + 1][1], stroke=MUTE, sw=2)
    s.tbar(rx0 + 260, ly + 296, 96, h=18)
    s.annot(rx0 + 350, ly + 240, 5)
    s.rect(rx0, ly + 370, 380, 130, rx=22, fill=CANVAS)
    s.text(rx0 + 20, ly + 398, "HOME CARE UP NEXT", size=10.5, color=FAINT, spacing="0.16em")
    for r in range(2):
        ry = ly + 414 + r * 38
        s.tbar(rx0 + 20, ry + 8, 150)
        s.pill(rx0 + 300, ry, 56, 22)
    s.notes_panel(1300, 170, 380, [
        ("Greeting, not chrome", ["Date + salutation set a domestic, calm tone.", "The single CTA routes to the master list."]),
        ("Four numbers, one glance", ["Counts animate on load (GSAP count-up).", "Chosen KPIs answer: what's moving,", "what's left, what's funded, what's due."]),
        ("Top-6 priority digest", ["Rank chip, progress, price trend and status", "in one 56px row. Row = deep link."]),
        ("Ambient 3D teaser", ["Auto-rotating lightweight scene (no post-fx)", "invites exploration without a perf tax."]),
        ("Price-watch signal", ["Surfaces the tracked item with the deepest", "recent price drop — 'buy now' nudge."]),
    ])
    s.save("wireframes/wf-02-dashboard.svg")


# =====================================================================
# WF-03 · Projects
# =====================================================================
def wf_projects():
    s = Sheet(1720, 1080)
    s.header_strip("WF-03", "Projects — one ranked truth, two mental models")
    fx, fy = 60, 130
    s.sidebar(fx, fy, 860)
    cx = fx + 92
    s.tbar(cx, fy + 20, 260, h=22, fill=BAR)
    s.button(cx + 950, fy + 12, 150, 40, "+ NEW PROJECT")
    s.annot(cx + 1120, fy + 32, 1)
    s.rect(cx, fy + 70, 380, 44, rx=22, fill=FILL_DARK)
    s.pill(cx + 6, fy + 76, 180, 32, "MASTER PRIORITY LIST", fill=PAPER)
    s.pill(cx + 192, fy + 76, 150, 32, "BY CATEGORY", fill="none", stroke="none")
    s.annot(cx + 400, fy + 92, 2)
    ly = fy + 140
    s.rect(cx, ly, 1110, 420, rx=22, fill=CANVAS)
    for r in range(5):
        ry = ly + 20 + r * 78
        s.rect(cx + 20, ry, 1070, 64, rx=14, fill=PAPER)
        s.text(cx + 40, ry + 28, "▲", size=10, color=FAINT, anchor="middle")
        s.text(cx + 40, ry + 44, "▼", size=10, color=FAINT, anchor="middle")
        s.rect(cx + 58, ry + 14, 36, 36, rx=10, fill=FILL_DARK if r == 0 else FILL)
        s.text(cx + 76, ry + 37, str(r + 1), size=13, color=INK, anchor="middle", weight=600)
        s.tbar(cx + 112, ry + 18, 230)
        s.tbar(cx + 112, ry + 38, 150, h=6)
        s.rect(cx + 420, ry + 28, 110, 6, rx=3, fill=FILL_DARK)
        s.rect(cx + 420, ry + 28, 110 * (0.8 - r * 0.12), 6, rx=3, fill=BAR)
        s.pill(cx + 560, ry + 20, 64, 22, "▾ 4.2%")
        s.tbar(cx + 660, ry + 24, 70, h=12)
        s.pill(cx + 760, ry + 20, 110, 22)
        s.dot(cx + 920, ry + 32, 4)
    s.annot(cx + 30, ly + 52, 3)
    s.annot(cx + 590, ly + 31, 4)
    # category strip below
    gy = ly + 440
    s.text(cx, gy + 16, "BY CATEGORY (TAB 2) — 11 rooms/zones as image cards", size=11, color=FAINT, spacing="0.06em")
    for c in range(4):
        cxx = cx + c * 284
        s.rect(cxx, gy + 28, 264, 150, rx=16, fill=CANVAS)
        s.imgbox(cxx + 10, gy + 38, 244, 84, rx=10)
        s.pill(cxx + 18, gy + 46, 78, 20)
        s.tbar(cxx + 14, gy + 134, 130)
        s.tbar(cxx + 14, gy + 152, 80, h=6)
        s.tbar(cxx + 200, gy + 140, 48, h=12)
    s.annot(cx + 1110, gy + 100, 5)
    s.notes_panel(1300, 170, 380, [
        ("Capture is cheap", ["New ideas take 20 seconds: title, room,", "cost, store link. Everything else can", "be layered on later."]),
        ("Two views, one dataset", ["Tabs switch mental model — 'what's next", "for the house' vs 'what's left in this room'", "— without forking the source of truth."]),
        ("Explicit re-ranking", ["Up/down controls instead of drag on v1:", "predictable, keyboard-friendly, and", "syncs a single rank swap to the DB."]),
        ("Price trend inline", ["Trend chip shows % change since tracking", "began; green = falling = wait paying off."]),
        ("Rooms as cards", ["Inspiration imagery keeps the by-room", "view emotional, not administrative.", "Empty rooms get an inviting prompt."]),
    ])
    s.save("wireframes/wf-03-projects.svg")


# =====================================================================
# WF-04 · Project detail
# =====================================================================
def wf_detail():
    s = Sheet(1720, 1200)
    s.header_strip("WF-04", "Project detail — from inspiration to installed")
    fx, fy = 60, 130
    s.sidebar(fx, fy, 880)
    cx = fx + 92
    s.text(cx, fy + 18, "← KITCHEN", size = 10.5, color=FAINT, spacing="0.14em")
    s.tbar(cx, fy + 32, 420, h=24, fill=BAR)
    s.pill(cx, fy + 72, 96, 22, "IN PROGRESS")
    s.pill(cx + 104, fy + 72, 84, 22, "PRIORITY #2")
    s.pill(cx + 196, fy + 72, 64, 22, "▾ 10%")
    s.button(cx + 920, fy + 30, 190, 42, "SHOP AT LOWE'S ↗")
    s.annot(cx + 1130, fy + 51, 5)
    # gallery
    gy = fy + 116
    for i, lab in enumerate(("INSPIRATION", "BEFORE", "AFTER")):
        gx = cx + i * 378
        s.rect(gx, gy, 358, 190, rx=18, fill=CANVAS)
        if i < 2:
            s.imgbox(gx + 8, gy + 8, 342, 174, rx=12)
        else:
            s.tlines(gx + 100, gy + 84, 160, n=2)
        s.pill(gx + 14, gy + 14, 100, 22, lab, fill=PAPER)
    s.annot(cx + 1150, gy + 30, 1)
    # price tracking card
    py = gy + 214
    s.rect(cx, py, 660, 420, rx=22, fill=CANVAS)
    s.text(cx + 22, py + 32, "PRICE TRACKING", size=10.5, color=FAINT, spacing="0.16em")
    s.tbar(cx + 22, py + 50, 170, h=30, fill=BAR)
    s.pill(cx + 480, py + 50, 150, 26, "BEST TIME TO BUY")
    pts = [(0, 10), (70, 22), (140, 30), (210, 26), (280, 44), (350, 40), (420, 58), (490, 66), (560, 78)]
    for i in range(len(pts) - 1):
        s.line(cx + 40 + pts[i][0], py + 120 + pts[i][1] * 0.9, cx + 40 + pts[i + 1][0], py + 120 + pts[i + 1][1] * 0.9, stroke=MUTE, sw=2.4)
    s.dot(cx + 40 + 560, py + 120 + 78 * 0.9, 5, fill=INK)
    for r in range(3):
        ry = py + 220 + r * 40
        s.rect(cx + 22, ry, 616, 30, rx=10, fill=PAPER)
        s.tbar(cx + 36, ry + 11, 180, h=8)
        s.tbar(cx + 540, ry + 10, 70, h=10)
    s.rect(cx + 22, py + 352, 460, 40, rx=13, fill=PAPER)
    s.button(cx + 498, py + 352, 140, 40, "LOG PRICE", dark=False)
    s.annot(cx + 680, py + 60, 2)
    # market card
    my = py + 0
    mx = cx + 690
    s.rect(mx, my, 420, 420, rx=22, fill=CANVAS)
    s.text(mx + 20, my + 30, "SHOP THE MARKET", size=10.5, color=FAINT, spacing="0.16em")
    s.pill(mx + 250, my + 16, 150, 22, "NEAR PARKER, CO 80134")
    s.rect(mx + 20, my + 48, 270, 38, rx=12, fill=PAPER)
    s.button(mx + 300, my + 48, 100, 38, "CHECK", dark=True)
    for r in range(4):
        ry = my + 104 + r * 52
        s.rect(mx + 20, ry, 380, 42, rx=12, fill=PAPER, stroke=ACCENT if r == 0 else LINE, sw=1.4 if r == 0 else 1)
        s.tbar(mx + 34, ry + 10, 110)
        s.tbar(mx + 34, ry + 26, 70, h=6)
        s.tbar(mx + 220, ry + 15, 56, h=11)
        s.pill(mx + 330, ry + 10, 56, 22, "LOG")
    s.text(mx + 20, my + 340, "Provider fallback note (demo vs live)", size=10.5, color=FAINT)
    s.annot(mx + 440, my + 125, 3)
    s.annot(mx + 440, my + 66, 4)
    s.notes_panel(1300, 780, 380, [
        ("Emotion above the fold", ["Inspiration → Before → After. The empty", "'After' slot is a motivational cliffhanger."]),
        ("Price history = timing", ["Sparkline + log list turn 'should we buy", "yet?' into a visible trend. Lowest tracked", "price triggers the buy signal."]),
        ("Market compare", ["One query checks Home Depot, Lowe's,", "Amazon, Ace, Menards, Walmart — priced", "near our zip. Log writes to history."]),
        ("Location-scoped", ["Offers scoped to Parker, CO 80134 so", "in-store pickup prices are real."]),
        ("Store CTA follows the data", ["Logging an offer rewrites the header", "store link — the CTA always points at", "the current best place to buy."]),
    ], title="Annotations")
    s.save("wireframes/wf-04-project-detail.svg")


# =====================================================================
# WF-05 · 3D house
# =====================================================================
def wf_house():
    s = Sheet(1720, 1080)
    s.header_strip("WF-05", "3D House — the home as navigation")
    fx, fy = 60, 130
    s.sidebar(fx, fy, 860)
    cx = fx + 92
    s.rect(cx, fy, 1110, 860, rx=26, fill=FILL_DARK)
    s.text(cx + 28, fy + 40, "THE EATON RESIDENCE", size=10.5, color=MUTE, spacing="0.2em")
    s.tbar(cx + 28, fy + 56, 240, h=20, fill=BAR)
    for i in range(4):
        s.dot(cx + 34 + i * 92, fy + 100, 4)
        s.tbar(cx + 44 + i * 92, fy + 96, 56, h=7)
    s.pill(cx + 830, fy + 28, 250, 30, "DRAG TO ORBIT · TAP A DOT")
    # house sketch
    hx, hy = cx + 420, fy + 300
    s.line(hx, hy + 130, hx + 130, hy + 30, stroke=MUTE, sw=2.4)
    s.line(hx + 130, hy + 30, hx + 260, hy + 130, stroke=MUTE, sw=2.4)
    s.rect(hx + 20, hy + 130, 220, 150, fill="none", stroke=MUTE, sw=2.4)
    s.rect(hx + 250, hy + 180, 130, 100, fill="none", stroke=MUTE, sw=2.4)
    s.rect(hx + 60, hy + 170, 40, 40, fill="none", stroke=MUTE, sw=1.6)
    s.rect(hx + 150, hy + 170, 40, 40, fill="none", stroke=MUTE, sw=1.6)
    s.line(hx - 60, hy + 280, hx + 440, hy + 280, stroke=MUTE, sw=2)
    for dx, dy in ((70, 120), (250, 90), (330, 210), (10, 230), (200, 285)):
        s.dot(hx + dx, hy + dy, 6, fill=ACCENT)
        s.add(f'<circle cx="{hx + dx}" cy="{hy + dy}" r="11" fill="none" stroke="{ACCENT}" stroke-width="1.2" opacity="0.5"/>')
    s.annot(hx + 300, hy + 60, 2)
    # left floating panel
    s.rect(cx + 24, fy + 140, 270, 560, rx=20, fill=CANVAS)
    s.text(cx + 44, fy + 172, "UPGRADE MARKERS", size=10.5, color=FAINT, spacing="0.14em")
    for r in range(6):
        ry = fy + 190 + r * 62
        s.rect(cx + 40, ry, 238, 50, rx=12, fill=PAPER)
        s.dot(cx + 56, ry + 25, 4, fill=BAR)
        s.tbar(cx + 68, ry + 14, 120)
        s.tbar(cx + 68, ry + 32, 70, h=6)
        s.tbar(cx + 212, ry + 20, 50, h=9)
    s.annot(cx + 306, fy + 168, 1)
    # right alert chips
    for r in range(3):
        ry = fy + 620 + r * 66
        s.rect(cx + 830, ry, 250, 54, rx=16, fill=CANVAS)
        s.rect(cx + 844, ry + 11, 32, 32, rx=10, fill=FILL)
        s.tbar(cx + 886, ry + 16, 120)
        s.tbar(cx + 886, ry + 34, 70, h=6)
    s.annot(cx + 1095, fy + 645, 3)
    # selected card
    s.rect(cx + 380, fy + 700, 330, 130, rx=18, fill=PAPER)
    s.pill(cx + 396, fy + 716, 90, 20)
    s.tbar(cx + 396, fy + 750, 200)
    s.rect(cx + 396, fy + 774, 190, 6, rx=3, fill=FILL_DARK)
    s.rect(cx + 396, fy + 774, 120, 6, rx=3, fill=BAR)
    s.tbar(cx + 600, fy + 770, 70, h=11)
    s.text(cx + 396, fy + 808, "OPEN PROJECT ↗", size=10, color=ACCENT, spacing="0.06em")
    s.annot(cx + 730, fy + 765, 4)
    s.notes_panel(1300, 170, 380, [
        ("Docked marker index", ["Every hotspot, ranked. Hover/press syncs", "with the model — list and space are the", "same dataset, two projections."]),
        ("Status-coloured hotspots", ["Dot colour = project status; pulse ring", "draws the eye. Tooltip carries title + cost."]),
        ("Ambient care alerts", ["Due/overdue chores float at the edge —", "the house 'tells you' what it needs,", "echoing smart-home dashboards."]),
        ("Detail on demand", ["Selection opens a compact card, never a", "modal — the scene stays explorable.", "Full page one click deeper."]),
    ])
    s.save("wireframes/wf-05-3d-house.svg")


# =====================================================================
# WF-06 · Home care
# =====================================================================
def wf_care():
    s = Sheet(1720, 1080)
    s.header_strip("WF-06", "Home care — recurring maintenance rhythm")
    fx, fy = 60, 130
    s.sidebar(fx, fy, 860)
    cx = fx + 92
    s.tbar(cx, fy + 20, 280, h=22, fill=BAR)
    s.tlines(cx, fy + 60, 480, n=2)
    for i in range(6):
        col, row = i % 3, i // 3
        gx, gy = cx + col * 378, fy + 120 + row * 330
        s.rect(gx, gy, 358, 310, rx=20, fill=CANVAS)
        s.rect(gx + 20, gy + 20, 40, 40, rx=12, fill=FILL)
        s.pill(gx + 250, gy + 26, 88, 24, "DUE IN 6D" if i else "OVERDUE")
        s.tbar(gx + 20, gy + 88, 180, h=12)
        s.tbar(gx + 20, gy + 110, 240, h=7)
        s.rect(gx + 20, gy + 160, 318, 7, rx=3.5, fill=FILL_DARK)
        s.rect(gx + 20, gy + 160, 318 * (0.4 + 0.1 * i), 7, rx=3.5, fill=BAR)
        s.tbar(gx + 20, gy + 182, 200, h=6)
        s.button(gx + 20, gy + 236, 318, 42, "MARK DONE TODAY", dark=False)
        if i == 0:
            s.annot(gx + 330, gy + 38, 1)
        if i == 1:
            s.annot(gx + 330, gy + 172, 2)
        if i == 2:
            s.annot(gx + 330, gy + 257, 3)
    s.notes_panel(1300, 170, 380, [
        ("Urgency escalates visually", ["Neutral → amber (≤7d) → red ring (overdue).", "Overdue count surfaces in the page intro", "with a gentle, human voice."]),
        ("Cycle, not deadline", ["Progress bar shows how much of the", "interval has elapsed — you feel a chore", "'filling up' before it's due."]),
        ("One-tap reset", ["'Mark done today' restamps the cycle.", "No forms, no confirmation friction —", "chores are logged in one second."]),
    ])
    s.save("wireframes/wf-06-home-care.svg")


# =====================================================================
# WF-07 · Budget
# =====================================================================
def wf_budget():
    s = Sheet(1720, 1080)
    s.header_strip("WF-07", "Budget — fund, runway, and where money flows")
    fx, fy = 60, 130
    s.sidebar(fx, fy, 860)
    cx = fx + 92
    s.tbar(cx, fy + 20, 220, h=22, fill=BAR)
    for i, lab in enumerate(("PROJECT FUND", "MONTHLY BUDGET", "STILL COMMITTED", "INVESTED SO FAR")):
        s.statcard(cx + i * 278, fy + 70, 258, 104, lab)
    s.annot(cx + 1090, fy + 122, 1)
    by = fy + 210
    s.rect(cx, by, 700, 520, rx=22, fill=CANVAS)
    s.text(cx + 24, by + 34, "OPEN COST BY CATEGORY", size=10.5, color=FAINT, spacing="0.14em")
    widths = (0.9, 0.72, 0.6, 0.45, 0.34, 0.22, 0.14)
    for i, wfr in enumerate(widths):
        ry = by + 64 + i * 62
        s.tbar(cx + 24, ry + 6, 110, h=9)
        s.rect(cx + 160, ry, 480, 22, rx=11, fill=FILL_DARK)
        s.rect(cx + 160, ry, 480 * wfr, 22, rx=11, fill=BAR)
        s.tbar(cx + 652, ry + 6, 40, h=10)
    s.annot(cx + 720, by + 100, 2)
    rx0 = cx + 730
    s.rect(rx0, by, 380, 300, rx=22, fill=CANVAS)
    s.text(rx0 + 20, by + 32, "FUNDING RUNWAY", size=10.5, color=FAINT, spacing="0.14em")
    s.tbar(rx0 + 20, by + 54, 150, h=26, fill=BAR)
    s.tlines(rx0 + 20, by + 104, 320, n=3)
    s.rect(rx0 + 20, by + 180, 340, 10, rx=5, fill=FILL_DARK)
    s.rect(rx0 + 20, by + 180, 210, 10, rx=5, fill=BAR)
    s.text(rx0 + 20, by + 216, "FUND VS COMMITTED", size=9.5, color=FAINT, spacing="0.1em")
    s.annot(rx0 + 350, by + 60, 3)
    s.rect(rx0, by + 320, 380, 200, rx=22, fill=CANVAS)
    s.text(rx0 + 20, by + 352, "SETTINGS", size=10.5, color=FAINT, spacing="0.14em")
    for r in range(2):
        s.rect(rx0 + 20, by + 368 + r * 62, 340, 44, rx=13, fill=PAPER)
        s.tbar(rx0 + 36, by + 384 + r * 62, 120, h=8)
    s.annot(rx0 + 350, by + 390, 4)
    s.notes_panel(1300, 170, 380, [
        ("Four honest numbers", ["Fund, monthly deposit, open commitment,", "already invested. No vanity totals."]),
        ("Category weight at a glance", ["Horizontal bars rank rooms by remaining", "cost — kitchen dwarfing the mudroom is", "exactly the conversation to trigger."]),
        ("Runway, not guilt", ["'≈ N months until the wishlist is funded'", "recalculates live as the couple edits", "the monthly figure. Planning, not shame."]),
        ("Inline settings", ["Budget inputs live on the page, no", "settings maze. Edits persist instantly."]),
    ])
    s.save("wireframes/wf-07-budget.svg")


# =====================================================================
# WF-08 · Mobile key screens
# =====================================================================
def wf_mobile():
    s = Sheet(1720, 1200)
    s.header_strip("WF-08", "Mobile — thumb-first companion")
    frames = [
        ("DASHBOARD", 120),
        ("3D HOUSE", 660),
        ("PROJECT DETAIL", 1200),
    ]
    for label, fx in frames:
        fy = 150
        s.rect(fx, fy, 380, 800, rx=36, fill=CANVAS, stroke=LINE, sw=2)
        s.rect(fx + 150, fy + 14, 80, 10, rx=5, fill=FILL_DARK)
        s.text(fx + 24, fy + 54, label, size=10.5, color=FAINT, spacing="0.16em")
        if label == "DASHBOARD":
            s.rect(fx + 20, fy + 70, 340, 56, rx=16, fill=PAPER)  # header logo strip
            s.tbar(fx + 36, fy + 92, 120, h=12)
            s.dot(fx + 330, fy + 98, 12, fill=FILL_DARK)
            for i in range(2):
                s.statcard(fx + 20 + i * 176, fy + 142, 164, 92, "")
            for i in range(2):
                s.statcard(fx + 20 + i * 176, fy + 246, 164, 92, "")
            for r in range(4):
                ry = fy + 356 + r * 64
                s.rect(fx + 20, ry, 340, 52, rx=13, fill=PAPER)
                s.rect(fx + 32, ry + 11, 30, 30, rx=9, fill=FILL)
                s.tbar(fx + 72, ry + 14, 140)
                s.tbar(fx + 72, ry + 32, 90, h=6)
                s.tbar(fx + 290, ry + 20, 52, h=10)
            s.annot(fx + 372, fy + 380, 1)
        if label == "3D HOUSE":
            s.rect(fx + 20, fy + 70, 340, 420, rx=20, fill=FILL_DARK)
            hx, hy = fx + 110, fy + 220
            s.line(hx, hy + 60, hx + 70, hy, stroke=MUTE, sw=2)
            s.line(hx + 70, hy, hx + 140, hy + 60, stroke=MUTE, sw=2)
            s.rect(hx + 12, hy + 60, 116, 80, fill="none", stroke=MUTE, sw=2)
            for dx, dy in ((30, 50), (110, 40), (70, 150)):
                s.dot(hx + dx, hy + dy, 5, fill=ACCENT)
            s.pill(fx + 40, fy + 90, 150, 22, "DRAG TO ORBIT")
            s.rect(fx + 20, fy + 506, 340, 250, rx=20, fill=PAPER)
            s.text(fx + 36, fy + 534, "UPGRADE MARKERS", size=9.5, color=FAINT, spacing="0.12em")
            for r in range(3):
                ry = fy + 550 + r * 56
                s.rect(fx + 36, ry, 308, 44, rx=12, fill=CANVAS)
                s.dot(fx + 52, ry + 22, 4)
                s.tbar(fx + 66, ry + 12, 130)
                s.tbar(fx + 66, ry + 28, 80, h=6)
            s.annot(fx + 372, fy + 520, 2)
        if label == "PROJECT DETAIL":
            s.imgbox(fx + 20, fy + 70, 340, 170, rx=16)
            s.pill(fx + 32, fy + 82, 96, 20, "INSPIRATION")
            s.tbar(fx + 20, fy + 260, 220, h=16, fill=BAR)
            s.pill(fx + 20, fy + 292, 90, 20)
            s.pill(fx + 118, fy + 292, 70, 20)
            s.rect(fx + 20, fy + 330, 340, 180, rx=16, fill=PAPER)
            pts = [(0, 8), (60, 20), (120, 16), (180, 34), (240, 30), (296, 44)]
            for i in range(len(pts) - 1):
                s.line(fx + 40 + pts[i][0], fy + 380 + pts[i][1], fx + 40 + pts[i + 1][0], fy + 380 + pts[i + 1][1], stroke=MUTE, sw=2)
            s.tbar(fx + 40, fy + 460, 160, h=8)
            s.button(fx + 20, fy + 530, 340, 44, "CHECK PRICES NEAR PARKER, CO", dark=False)
            s.button(fx + 20, fy + 590, 340, 44, "SHOP AT LOWE'S")
            s.annot(fx + 372, fy + 552, 3)
        # bottom nav
        s.rect(fx + 20, fy + 726, 340, 54, rx=18, fill=FILL_DARK)
        for i in range(5):
            s.rect(fx + 44 + i * 64, fy + 738, 30, 30, rx=9,
                   fill=PAPER if i == 0 else "none", stroke=LINE, sw=1.2)
    s.notes_panel(120, 1010, 1460, [
        ("Stacked briefing", ["Stat cards pair up 2×2; priority rows keep the rank chip and cost — trend chips drop first under compression."]),
        ("Scene stays full-bleed", ["Floating panels become a sheet below the scene; hotspots stay tappable at 44px targets."]),
        ("Buying flow intact on the go", ["Price check + store CTA are thumb-height — the flow most used in a store aisle."]),
    ])
    s.save("wireframes/wf-08-mobile.svg")


# =====================================================================
# D-01 · Sitemap
# =====================================================================
def d_sitemap():
    s = Sheet(1720, 900)
    s.header_strip("IA-01", "Information architecture — sitemap", kind="IA diagram · v1")

    def node(x, y, w, h, title, sub=None, dark=False):
        s.rect(x, y, w, h, rx=14, fill=FILL_DARK if dark else PAPER)
        s.text(x + w / 2, y + (h / 2 + (0 if sub else 5)), title, size=14, color=INK, weight=600, anchor="middle")
        if sub:
            s.text(x + w / 2, y + h / 2 + 20, sub, size=10.5, color=MUTE, anchor="middle")

    node(140, 200, 200, 70, "Login", "Supabase auth · demo entrance", dark=True)
    s.rect(430, 150, 150, 620, rx=16, fill=CANVAS, dash="6 5")
    s.text(505, 180, "AUTH GATE", size=10.5, color=FAINT, anchor="middle", spacing="0.16em")
    s.text(505, 196, "middleware", size=10, color=FAINT, anchor="middle")
    s.arrow(340, 235, 430, 235)
    node(620, 200, 220, 70, "Dashboard", "briefing · KPIs · digests")
    ys = [330, 440, 550, 660]
    labels = [
        ("Projects", "master rank + 11 categories"),
        ("3D House", "orbit · hotspots · alerts"),
        ("Home care", "recurring cycles"),
        ("Budget", "fund · runway · categories"),
    ]
    for (t, sub), y in zip(labels, ys):
        node(620, y, 220, 66, t, sub)
        s.arrow(580, 235, 600, y + 33)
    s.arrow(840, 363, 900, 453)  # projects -> detail
    node(900, 420, 220, 66, "Project detail", "shared by list, category, 3D dot")
    s.arrow(840, 473, 900, 465)  # 3D house -> detail
    s.text(1180, 300, "Every surface deep-links into the same", size=12.5, color=MUTE)
    s.text(1180, 318, "project entity — list rank, room card and", size=12.5, color=MUTE)
    s.text(1180, 336, "3D hotspot are three doors to one record.", size=12.5, color=MUTE)
    s.text(1180, 380, "Flat IA (5 sections, 1 detail level) keeps", size=12.5, color=MUTE)
    s.text(1180, 398, "the mental model shallow for a 2-person", size=12.5, color=MUTE)
    s.text(1180, 416, "household product.", size=12.5, color=MUTE)
    s.save("diagrams/01-sitemap.svg")


# =====================================================================
# D-02 · User flows
# =====================================================================
def d_flows():
    s = Sheet(1720, 980)
    s.header_strip("UX-02", "Primary user flows", kind="Flow diagram · v2")

    def step(x, y, w, label, sub=None, dark=False):
        h = 64
        s.rect(x, y, w, h, rx=14, fill=FILL_DARK if dark else PAPER)
        s.text(x + w / 2, y + 28 if sub else y + 37, label, size=12.5, color=INK, weight=600, anchor="middle")
        if sub:
            s.text(x + w / 2, y + 46, sub, size=10, color=MUTE, anchor="middle")
        return x + w

    def diamond(cx, cy, label):
        s.add(f'<path d="M {cx} {cy-40} L {cx+62} {cy} L {cx} {cy+40} L {cx-62} {cy} Z" fill="{PAPER}" stroke="{LINE}" stroke-width="1.5"/>')
        s.text(cx, cy + 4, label, size=10.5, color=INK, anchor="middle", weight=600)

    s.text(100, 150, "FLOW A — BUY AT THE RIGHT TIME", size=12, color=INK, weight=700, spacing="0.1em")
    y = 190
    x = step(100, y, 170, "Capture idea", "title · room · cost")
    s.arrow(x, y + 32, x + 40, y + 32); x += 40
    x = step(x, y, 170, "Rank on master list", "explicit ▲▼")
    s.arrow(x, y + 32, x + 40, y + 32); x += 40
    x = step(x, y, 190, "Check the market", "6 retailers · zip-scoped")
    s.arrow(x, y + 32, x + 40, y + 32); x += 40
    x = step(x, y, 150, "Log offers", "history grows")
    s.arrow(x, y + 32, x + 46, y + 32)
    diamond(x + 110, y + 32, "tracked low?")
    s.arrow(x + 172, y + 32, x + 212, y + 32)
    s.text(x + 130, y - 20, "no → keep watching (loop)", size=10, color=FAINT)
    s.add(f'<path d="M {x+110} {y-8} C {x+110} {y-70}, {x-560} {y-70}, {x-560} {y-4}" fill="none" stroke="{FAINT}" stroke-width="1.4" stroke-dasharray="5 4"/>')
    x = step(x + 212, y, 170, "Buy · log spend", "'best time' signal", dark=True)
    s.arrow(x, y + 32, x + 40, y + 32)
    step(x + 40, y, 190, "Progress → After photo", "done state")

    s.text(100, 420, "FLOW B — SATURDAY MORNING PLANNING", size=12, color=INK, weight=700, spacing="0.1em")
    y = 460
    x = step(100, y, 170, "Open dashboard", "30-sec briefing")
    s.arrow(x, y + 32, x + 40, y + 32); x += 40
    x = step(x, y, 190, "Scan care alerts", "overdue escalation")
    s.arrow(x, y + 32, x + 40, y + 32); x += 40
    x = step(x, y, 170, "Orbit 3D house", "spatial recall")
    s.arrow(x, y + 32, x + 40, y + 32); x += 40
    x = step(x, y, 160, "Tap hotspot", "status colour")
    s.arrow(x, y + 32, x + 40, y + 32); x += 40
    x = step(x, y, 170, "Open project", "plan + budget fit")
    s.arrow(x, y + 32, x + 40, y + 32); x += 40
    step(x, y, 190, "Agree on the weekend", "shared decision", dark=True)

    s.text(100, 690, "FLOW C — RECURRING CARE", size=12, color=INK, weight=700, spacing="0.1em")
    y = 730
    x = step(100, y, 190, "Cycle fills up", "interval elapsed %")
    s.arrow(x, y + 32, x + 40, y + 32); x += 40
    x = step(x, y, 200, "Surfaces on dashboard", "≤14 days out")
    s.arrow(x, y + 32, x + 40, y + 32); x += 40
    x = step(x, y, 190, "Escalates on house", "alert chip at edge")
    s.arrow(x, y + 32, x + 40, y + 32); x += 40
    x = step(x, y, 180, "Mark done today", "one tap", dark=True)
    s.arrow(x, y + 32, x + 40, y + 32); x += 40
    step(x, y, 170, "Cycle restarts", "next due computed")
    s.text(1180, 762, "Design goal: chores ask politely,", size=12.5, color=MUTE)
    s.text(1180, 780, "then insist — never nag by default.", size=12.5, color=MUTE)
    s.save("diagrams/02-user-flows.svg")


# =====================================================================
# D-03 · Design tokens
# =====================================================================
def d_tokens():
    s = Sheet(1720, 1000)
    s.header_strip("DS-03", "\u201CDusk Glass\u201D design language — tokens", kind="Design system · v3")
    # color swatches
    s.text(100, 150, "COLOR — CINEMATIC DUSK PALETTE", size=12, color=INK, weight=700, spacing="0.1em")
    swatches = [
        ("#0a191c", "background/void", "#0A191C"),
        ("#12282b", "glass panel (60% + blur 26)", "rgba(15,36,39,.6)"),
        ("#3cdbc8", "primary / cyan", "#3CDBC8"),
        ("#2fbf8a", "success / green", "#2FBF8A"),
        ("#ff9a5c", "active / orange", "#FF9A5C"),
        ("#ffdc26", "planned / yellow", "#FFDC26"),
        ("#ff7a63", "destructive", "#FF7A63"),
        ("#e9f4f1", "foreground", "#E9F4F1"),
    ]
    for i, (c, name, code) in enumerate(swatches):
        x = 100 + i * 190
        s.rect(x, 175, 170, 110, rx=16, fill=c, stroke=LINE_SOFT)
        s.text(x, 310, name, size=11, color=INK, weight=600)
        s.text(x, 328, code, size=10.5, color=MUTE)
    # typography
    s.text(100, 400, "TYPE — OUTFIT, LIGHT BY DEFAULT", size=12, color=INK, weight=700, spacing="0.1em")
    s.text(100, 470, "Display / 48-56 · weight 200 · tracking -0.02em", size=34, color=INK, weight=200)
    s.text(100, 520, "Section title / 20 · weight 300", size=20, color=INK, weight=300)
    s.text(100, 552, "Body / 14 · weight 300 · 1.6 line height", size=14, color=INK, weight=300)
    s.text(100, 580, "LABEL / 10.5 · WEIGHT 300 · TRACKING 0.2EM", size=10.5, color=MUTE, spacing="0.2em")
    s.line(100, 610, 1620, 610, stroke=LINE_SOFT)
    # glass spec
    s.text(100, 650, "SURFACE — GLASS ELEVATIONS", size=12, color=INK, weight=700, spacing="0.1em")
    specs = [
        ("glass", "panels/cards", "linear 155° teal 62→55% · blur 26px · border white 10% · inner top light"),
        ("glass-deep", "sidebar/hero shells", "dark 92→82% · blur 22px · 70px drop shadow"),
        ("glass-chip", "chips/inputs", "white 6% · blur 14px · border white 10%"),
    ]
    for i, (name, use, spec) in enumerate(specs):
        y = 680 + i * 56
        s.rect(100, y, 150, 40, rx=12, fill=FILL_DARK if i == 1 else FILL)
        s.text(115, y + 25, name, size=12, color=INK, weight=600)
        s.text(280, y + 18, use, size=11.5, color=INK, weight=500)
        s.text(280, y + 34, spec, size=10.5, color=MUTE)
    # radius + motion
    s.text(1000, 650, "RADIUS", size=12, color=INK, weight=700, spacing="0.1em")
    for i, (r, lab) in enumerate([(10, "12 chip"), (14, "16 control"), (20, "20 card"), (26, "28 panel")]):
        x = 1000 + i * 120
        s.rect(x, 675, 90, 60, rx=r, fill=FILL)
        s.text(x + 45, 755, lab, size=10.5, color=MUTE, anchor="middle")
    s.text(1000, 810, "MOTION — CALM CINEMA", size=12, color=INK, weight=700, spacing="0.1em")
    for i, ln in enumerate([
        "Entrance: y+26 → 0 · blur 6 → 0 · 0.9s power3.out · stagger 80ms",
        "Numbers: count-up 1.4s power2.out on mount",
        "3D: orbit damping · autorotate 0.12 rad/s on ambient surfaces",
        "Rule: motion states facts (arrived, changed) — never decoration loops",
    ]):
        s.text(1000, 838 + i * 22, ln, size=11.5, color=MUTE)
    s.save("diagrams/03-design-tokens.svg")


if __name__ == "__main__":
    os.makedirs(ROOT, exist_ok=True)
    wf_login()
    wf_dashboard()
    wf_projects()
    wf_detail()
    wf_house()
    wf_care()
    wf_budget()
    wf_mobile()
    d_sitemap()
    d_flows()
    d_tokens()
    print("done")
