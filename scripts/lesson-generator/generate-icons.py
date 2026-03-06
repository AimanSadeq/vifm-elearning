"""
Generate simple monochrome icon PNGs for PPTX slides.
Each icon is white on transparent background, 128x128px.
"""
from PIL import Image, ImageDraw, ImageFont
import os, math

OUT = os.path.join(os.path.dirname(__file__), 'assets', 'icons')
os.makedirs(OUT, exist_ok=True)

SIZE = 128
COLOR = (255, 255, 255, 255)  # white
TRANSPARENT = (0, 0, 0, 0)
LW = 4  # line width


def new_img():
    return Image.new('RGBA', (SIZE, SIZE), TRANSPARENT)


def save(img, name):
    img.save(os.path.join(OUT, f'{name}.png'))


# ── Bar Chart (📊📈📉) ──────────────────────────────────────────────
def icon_chart():
    img = new_img()
    d = ImageDraw.Draw(img)
    # Three bars
    bars = [(30, 70, 52, 105), (53, 45, 75, 105), (76, 55, 98, 105)]
    for b in bars:
        d.rectangle(b, fill=COLOR)
    # Axis
    d.line([(25, 105), (103, 105)], fill=COLOR, width=LW)
    d.line([(25, 25), (25, 105)], fill=COLOR, width=LW)
    save(img, 'chart')


# ── Money (💰💵💳) ──────────────────────────────────────────────────
def icon_money():
    img = new_img()
    d = ImageDraw.Draw(img)
    cx, cy = 64, 64
    # Circle
    d.ellipse([24, 24, 104, 104], outline=COLOR, width=LW)
    # Dollar sign (S shape + vertical line)
    d.line([(64, 30), (64, 98)], fill=COLOR, width=LW)
    d.arc([44, 36, 84, 66], start=180, end=0, fill=COLOR, width=LW)
    d.arc([44, 62, 84, 92], start=0, end=180, fill=COLOR, width=LW)
    save(img, 'money')


# ── Search (🔍🔎) ───────────────────────────────────────────────────
def icon_search():
    img = new_img()
    d = ImageDraw.Draw(img)
    d.ellipse([25, 20, 85, 80], outline=COLOR, width=LW)
    d.line([(75, 72), (103, 103)], fill=COLOR, width=LW + 2)
    save(img, 'search')


# ── Target (🎯🏆) ───────────────────────────────────────────────────
def icon_target():
    img = new_img()
    d = ImageDraw.Draw(img)
    d.ellipse([20, 20, 108, 108], outline=COLOR, width=LW)
    d.ellipse([38, 38, 90, 90], outline=COLOR, width=LW)
    d.ellipse([54, 54, 74, 74], fill=COLOR)
    save(img, 'target')


# ── Lightning (⚡🔥) ────────────────────────────────────────────────
def icon_bolt():
    img = new_img()
    d = ImageDraw.Draw(img)
    pts = [(68, 15), (38, 62), (60, 62), (42, 113), (92, 55), (65, 55), (80, 15)]
    d.polygon(pts, fill=COLOR)
    save(img, 'bolt')


# ── Brain/AI (🧠🤖) ────────────────────────────────────────────────
def icon_brain():
    img = new_img()
    d = ImageDraw.Draw(img)
    # Simplified brain: two hemispheres
    d.arc([25, 20, 68, 108], start=90, end=270, fill=COLOR, width=LW)
    d.arc([60, 20, 103, 108], start=270, end=90, fill=COLOR, width=LW)
    # Internal squiggles
    d.arc([35, 30, 65, 60], start=0, end=180, fill=COLOR, width=3)
    d.arc([35, 55, 65, 85], start=180, end=360, fill=COLOR, width=3)
    d.arc([63, 35, 93, 65], start=0, end=180, fill=COLOR, width=3)
    d.arc([63, 60, 93, 90], start=180, end=360, fill=COLOR, width=3)
    save(img, 'brain')


# ── Document (📋📄📝📖) ────────────────────────────────────────────
def icon_document():
    img = new_img()
    d = ImageDraw.Draw(img)
    # Page outline with folded corner
    pts = [(30, 15), (85, 15), (100, 30), (100, 113), (30, 113)]
    d.polygon(pts, outline=COLOR, width=LW)
    d.line([(85, 15), (85, 30), (100, 30)], fill=COLOR, width=LW)
    # Text lines
    for y in [48, 62, 76, 90]:
        d.line([(42, y), (88, y)], fill=COLOR, width=2)
    save(img, 'document')


# ── Eye (👁️👀) ──────────────────────────────────────────────────────
def icon_eye():
    img = new_img()
    d = ImageDraw.Draw(img)
    # Eye shape
    d.arc([15, 20, 113, 108], start=200, end=340, fill=COLOR, width=LW)
    d.arc([15, 20, 113, 108], start=20, end=160, fill=COLOR, width=LW)
    # Iris
    d.ellipse([48, 48, 80, 80], outline=COLOR, width=LW)
    d.ellipse([56, 56, 72, 72], fill=COLOR)
    save(img, 'eye')


# ── Lightbulb (💡✨) ────────────────────────────────────────────────
def icon_bulb():
    img = new_img()
    d = ImageDraw.Draw(img)
    # Bulb
    d.ellipse([32, 15, 96, 80], outline=COLOR, width=LW)
    # Neck
    d.line([(48, 78), (48, 95)], fill=COLOR, width=LW)
    d.line([(80, 78), (80, 95)], fill=COLOR, width=LW)
    # Base lines
    d.line([(46, 95), (82, 95)], fill=COLOR, width=LW)
    d.line([(48, 102), (80, 102)], fill=COLOR, width=LW)
    d.line([(52, 109), (76, 109)], fill=COLOR, width=LW)
    # Filament
    d.line([(64, 45), (64, 68)], fill=COLOR, width=2)
    save(img, 'bulb')


# ── Globe (🌐🌍) ────────────────────────────────────────────────────
def icon_globe():
    img = new_img()
    d = ImageDraw.Draw(img)
    d.ellipse([20, 20, 108, 108], outline=COLOR, width=LW)
    # Latitude lines
    d.arc([40, 20, 88, 108], start=270, end=90, fill=COLOR, width=2)
    d.arc([40, 20, 88, 108], start=90, end=270, fill=COLOR, width=2)
    d.line([(20, 64), (108, 64)], fill=COLOR, width=2)
    d.arc([20, 38, 108, 65], start=0, end=180, fill=COLOR, width=2)
    d.arc([20, 63, 108, 90], start=180, end=360, fill=COLOR, width=2)
    save(img, 'globe')


# ── Screen/Laptop (📱💻) ────────────────────────────────────────────
def icon_screen():
    img = new_img()
    d = ImageDraw.Draw(img)
    # Monitor
    d.rectangle([20, 20, 108, 85], outline=COLOR, width=LW)
    # Stand
    d.line([(64, 85), (64, 100)], fill=COLOR, width=LW)
    d.line([(40, 100), (88, 100)], fill=COLOR, width=LW)
    # Screen content line
    d.rectangle([30, 30, 98, 75], outline=COLOR, width=2)
    save(img, 'screen')


# ── Refresh/Cycle (🔄♻️) ────────────────────────────────────────────
def icon_refresh():
    img = new_img()
    d = ImageDraw.Draw(img)
    d.arc([22, 22, 106, 106], start=30, end=300, fill=COLOR, width=LW)
    # Arrow heads
    # Top arrow
    d.polygon([(90, 32), (100, 50), (78, 48)], fill=COLOR)
    # Bottom arrow
    d.polygon([(38, 96), (28, 78), (50, 80)], fill=COLOR)
    save(img, 'refresh')


# ── People (👥👤) ───────────────────────────────────────────────────
def icon_people():
    img = new_img()
    d = ImageDraw.Draw(img)
    # Person 1 (front)
    d.ellipse([42, 18, 72, 48], outline=COLOR, width=LW)
    d.arc([30, 55, 84, 110], start=180, end=0, fill=COLOR, width=LW)
    # Person 2 (behind, right)
    d.ellipse([68, 22, 94, 48], outline=COLOR, width=LW)
    d.arc([60, 55, 108, 105], start=180, end=360, fill=COLOR, width=LW)
    save(img, 'people')


# ── Clock (⏱️🕐⏰🕰️) ───────────────────────────────────────────────
def icon_clock():
    img = new_img()
    d = ImageDraw.Draw(img)
    d.ellipse([20, 20, 108, 108], outline=COLOR, width=LW)
    # Hands
    d.line([(64, 64), (64, 35)], fill=COLOR, width=LW)
    d.line([(64, 64), (85, 55)], fill=COLOR, width=3)
    # Center dot
    d.ellipse([60, 60, 68, 68], fill=COLOR)
    save(img, 'clock')


# ── Checkmark (✅) ──────────────────────────────────────────────────
def icon_check():
    img = new_img()
    d = ImageDraw.Draw(img)
    d.line([(25, 65), (50, 95), (103, 30)], fill=COLOR, width=LW + 2)
    save(img, 'check')


# ── Gear (⚙️🔧) ────────────────────────────────────────────────────
def icon_gear():
    img = new_img()
    d = ImageDraw.Draw(img)
    # Outer ring with teeth
    d.ellipse([30, 30, 98, 98], outline=COLOR, width=LW)
    d.ellipse([44, 44, 84, 84], outline=COLOR, width=LW)
    # Teeth (small rectangles at 8 points)
    for angle in range(0, 360, 45):
        rad = math.radians(angle)
        cx = 64 + 42 * math.cos(rad)
        cy = 64 + 42 * math.sin(rad)
        d.ellipse([cx-5, cy-5, cx+5, cy+5], fill=COLOR)
    save(img, 'gear')


# ── Lock/Shield (🔒🛡️) ─────────────────────────────────────────────
def icon_shield():
    img = new_img()
    d = ImageDraw.Draw(img)
    # Shield shape
    pts = [(64, 15), (100, 35), (100, 70), (64, 110), (28, 70), (28, 35)]
    d.polygon(pts, outline=COLOR, width=LW)
    # Checkmark inside
    d.line([(45, 65), (58, 80), (82, 48)], fill=COLOR, width=3)
    save(img, 'shield')


# ── Chat/Speech (💬🗣️) ─────────────────────────────────────────────
def icon_chat():
    img = new_img()
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([20, 20, 108, 85], radius=12, outline=COLOR, width=LW)
    # Tail
    d.polygon([(35, 85), (45, 105), (55, 85)], fill=COLOR)
    # Dots
    for x in [48, 64, 80]:
        d.ellipse([x-3, 48-3, x+3, 48+3], fill=COLOR)
    save(img, 'chat')


# ── Trend Up (📈) ───────────────────────────────────────────────────
def icon_trend():
    img = new_img()
    d = ImageDraw.Draw(img)
    # Axis
    d.line([(25, 105), (103, 105)], fill=COLOR, width=LW)
    d.line([(25, 25), (25, 105)], fill=COLOR, width=LW)
    # Trend line going up
    d.line([(30, 90), (50, 70), (70, 78), (100, 30)], fill=COLOR, width=LW)
    # Arrow at top
    d.polygon([(100, 30), (88, 30), (100, 42)], fill=COLOR)
    save(img, 'trend')


# ── Clipboard/List (📋) ────────────────────────────────────────────
def icon_clipboard():
    img = new_img()
    d = ImageDraw.Draw(img)
    d.rectangle([28, 25, 100, 110], outline=COLOR, width=LW)
    # Clip at top
    d.rectangle([48, 15, 80, 32], outline=COLOR, width=LW)
    # List items
    for y in [45, 60, 75, 90]:
        d.ellipse([38, y-2, 42, y+2], fill=COLOR)
        d.line([(48, y), (90, y)], fill=COLOR, width=2)
    save(img, 'clipboard')


# ── Shuffle/Mix (🔀) ───────────────────────────────────────────────
def icon_shuffle():
    img = new_img()
    d = ImageDraw.Draw(img)
    # Two crossing arrows
    d.line([(25, 35), (60, 35), (68, 55), (95, 90)], fill=COLOR, width=LW)
    d.line([(25, 90), (60, 90), (68, 70), (95, 35)], fill=COLOR, width=LW)
    # Arrow heads
    d.polygon([(95, 35), (85, 25), (85, 45)], fill=COLOR)
    d.polygon([(95, 90), (85, 80), (85, 100)], fill=COLOR)
    save(img, 'shuffle')


# ── Ruler/Measure (📏📐) ───────────────────────────────────────────
def icon_ruler():
    img = new_img()
    d = ImageDraw.Draw(img)
    # Ruler body (diagonal)
    pts = [(95, 20), (108, 33), (33, 108), (20, 95)]
    d.polygon(pts, outline=COLOR, width=LW)
    # Tick marks
    for i in range(1, 8):
        x1 = 95 - i * 10
        y1 = 20 + i * 10
        tick_len = 8 if i % 2 == 0 else 5
        dx = tick_len * 0.707
        d.line([(x1, y1), (x1 + dx, y1 + dx)], fill=COLOR, width=2)
    save(img, 'ruler')


# ── Scale/Balance (⚖️) ────────────────────────────────────────────
def icon_scale():
    img = new_img()
    d = ImageDraw.Draw(img)
    # Post
    d.line([(64, 20), (64, 100)], fill=COLOR, width=LW)
    # Base
    d.line([(40, 100), (88, 100)], fill=COLOR, width=LW)
    # Beam
    d.line([(25, 40), (103, 40)], fill=COLOR, width=LW)
    # Left pan
    d.arc([15, 40, 55, 75], start=0, end=180, fill=COLOR, width=LW)
    # Right pan
    d.arc([73, 40, 113, 75], start=0, end=180, fill=COLOR, width=LW)
    save(img, 'scale')


# ── Film/Video (🎬🎤) ──────────────────────────────────────────────
def icon_film():
    img = new_img()
    d = ImageDraw.Draw(img)
    d.rectangle([20, 25, 108, 103], outline=COLOR, width=LW)
    # Film sprocket holes
    for y in [35, 50, 65, 80, 95]:
        d.rectangle([24, y-3, 32, y+3], fill=COLOR)
        d.rectangle([96, y-3, 104, y+3], fill=COLOR)
    # Play triangle
    d.polygon([(55, 50), (55, 78), (80, 64)], fill=COLOR)
    save(img, 'film')


# ── Crystal Ball (🔮) ──────────────────────────────────────────────
def icon_crystal():
    img = new_img()
    d = ImageDraw.Draw(img)
    d.ellipse([25, 15, 103, 93], outline=COLOR, width=LW)
    # Sparkle inside
    d.line([(55, 40), (55, 55)], fill=COLOR, width=2)
    d.line([(48, 48), (62, 48)], fill=COLOR, width=2)
    # Base
    d.arc([35, 80, 93, 115], start=180, end=0, fill=COLOR, width=LW)
    save(img, 'crystal')


# ── Tie/Professional (👔) ──────────────────────────────────────────
def icon_tie():
    img = new_img()
    d = ImageDraw.Draw(img)
    # Collar
    d.line([(40, 15), (64, 35), (88, 15)], fill=COLOR, width=LW)
    # Knot
    d.polygon([(56, 32), (72, 32), (68, 45), (60, 45)], fill=COLOR)
    # Tie body
    d.polygon([(56, 45), (72, 45), (68, 110), (64, 115), (60, 110)], fill=COLOR, outline=COLOR, width=LW)
    save(img, 'tie')


# ── Graduation (🎓) ───────────────────────────────────────────────
def icon_grad():
    img = new_img()
    d = ImageDraw.Draw(img)
    # Cap top
    d.polygon([(64, 20), (110, 50), (64, 65), (18, 50)], outline=COLOR, width=LW)
    # Brim
    d.polygon([(35, 55), (93, 55), (88, 85), (40, 85)], outline=COLOR, width=LW)
    # Tassel
    d.line([(110, 50), (110, 80)], fill=COLOR, width=2)
    d.ellipse([105, 80, 115, 90], fill=COLOR)
    save(img, 'grad')


# ── No/Prohibited (🚫) ────────────────────────────────────────────
def icon_no():
    img = new_img()
    d = ImageDraw.Draw(img)
    d.ellipse([20, 20, 108, 108], outline=COLOR, width=LW)
    d.line([(38, 38), (90, 90)], fill=COLOR, width=LW)
    save(img, 'no')


# ── Building (🏛️🏦🏭) ─────────────────────────────────────────────
def icon_building():
    img = new_img()
    d = ImageDraw.Draw(img)
    # Roof
    d.polygon([(64, 15), (108, 40), (20, 40)], outline=COLOR, width=LW)
    # Body
    d.rectangle([28, 40, 100, 108], outline=COLOR, width=LW)
    # Pillars
    for x in [40, 55, 70, 85]:
        d.rectangle([x, 48, x+5, 100], fill=COLOR)
    save(img, 'building')


# ── Tree (🌳) ─────────────────────────────────────────────────────
def icon_tree():
    img = new_img()
    d = ImageDraw.Draw(img)
    # Canopy (triangle layers)
    d.polygon([(64, 12), (95, 50), (33, 50)], fill=COLOR)
    d.polygon([(64, 35), (100, 75), (28, 75)], fill=COLOR)
    # Trunk
    d.rectangle([56, 75, 72, 110], fill=COLOR)
    save(img, 'tree')


# ── Web/Spider (🕸️) ──────────────────────────────────────────────
def icon_web():
    img = new_img()
    d = ImageDraw.Draw(img)
    cx, cy = 64, 64
    # Radial lines
    for angle in range(0, 360, 45):
        rad = math.radians(angle)
        x2 = cx + 48 * math.cos(rad)
        y2 = cy + 48 * math.sin(rad)
        d.line([(cx, cy), (x2, y2)], fill=COLOR, width=2)
    # Concentric rings
    for r in [18, 34, 48]:
        d.ellipse([cx-r, cy-r, cx+r, cy+r], outline=COLOR, width=2)
    save(img, 'web')


# ── Microscope (🔬) ──────────────────────────────────────────────
def icon_microscope():
    img = new_img()
    d = ImageDraw.Draw(img)
    # Eyepiece
    d.rectangle([58, 12, 70, 30], fill=COLOR)
    # Tube
    d.rectangle([55, 30, 73, 70], outline=COLOR, width=LW)
    # Stage
    d.line([(35, 80), (93, 80)], fill=COLOR, width=LW)
    # Arm
    d.line([(64, 70), (64, 80)], fill=COLOR, width=LW)
    # Base
    d.line([(30, 108), (98, 108)], fill=COLOR, width=LW)
    d.line([(64, 80), (64, 108)], fill=COLOR, width=LW)
    # Lens
    d.ellipse([52, 68, 76, 82], outline=COLOR, width=2)
    save(img, 'microscope')


# ── Phone (📞) ──────────────────────────────────────────────────────
def icon_phone():
    img = new_img()
    d = ImageDraw.Draw(img)
    # Phone body
    d.rounded_rectangle([38, 15, 90, 113], radius=8, outline=COLOR, width=LW)
    # Screen
    d.rectangle([44, 28, 84, 95], outline=COLOR, width=2)
    # Home button
    d.ellipse([58, 100, 70, 108], outline=COLOR, width=2)
    save(img, 'phone')


# ── Newspaper (📰) ─────────────────────────────────────────────────
def icon_newspaper():
    img = new_img()
    d = ImageDraw.Draw(img)
    d.rectangle([18, 18, 100, 110], outline=COLOR, width=LW)
    # Headline
    d.rectangle([28, 28, 90, 42], fill=COLOR)
    # Text lines
    for y in [52, 62, 72, 82, 92]:
        d.line([(28, y), (90, y)], fill=COLOR, width=2)
    # Fold line
    d.line([(100, 18), (110, 28), (110, 110), (100, 110)], fill=COLOR, width=LW)
    save(img, 'newspaper')


# ── Satellite (🛰️) ────────────────────────────────────────────────
def icon_satellite():
    img = new_img()
    d = ImageDraw.Draw(img)
    # Body
    d.rectangle([45, 45, 83, 83], outline=COLOR, width=LW)
    # Solar panels
    d.rectangle([10, 52, 42, 76], outline=COLOR, width=LW)
    d.line([(26, 52), (26, 76)], fill=COLOR, width=2)
    d.rectangle([86, 52, 118, 76], outline=COLOR, width=LW)
    d.line([(102, 52), (102, 76)], fill=COLOR, width=2)
    # Antenna
    d.line([(64, 45), (64, 25)], fill=COLOR, width=2)
    d.ellipse([58, 18, 70, 28], outline=COLOR, width=2)
    save(img, 'satellite')


# ── Alert (🚨) ────────────────────────────────────────────────────
def icon_alert():
    img = new_img()
    d = ImageDraw.Draw(img)
    # Triangle
    d.polygon([(64, 15), (110, 105), (18, 105)], outline=COLOR, width=LW)
    # Exclamation
    d.line([(64, 42), (64, 75)], fill=COLOR, width=LW + 1)
    d.ellipse([60, 84, 68, 92], fill=COLOR)
    save(img, 'alert')


# ── Hash/Number (🔢) ─────────────────────────────────────────────
def icon_hash():
    img = new_img()
    d = ImageDraw.Draw(img)
    # Hash symbol #
    d.line([(45, 25), (38, 103)], fill=COLOR, width=LW)
    d.line([(75, 25), (68, 103)], fill=COLOR, width=LW)
    d.line([(25, 50), (103, 50)], fill=COLOR, width=LW)
    d.line([(25, 78), (103, 78)], fill=COLOR, width=LW)
    save(img, 'hash')


# ── Sun (☀️) ──────────────────────────────────────────────────────
def icon_sun():
    img = new_img()
    d = ImageDraw.Draw(img)
    d.ellipse([40, 40, 88, 88], outline=COLOR, width=LW)
    # Rays
    for angle in range(0, 360, 45):
        rad = math.radians(angle)
        x1 = 64 + 30 * math.cos(rad)
        y1 = 64 + 30 * math.sin(rad)
        x2 = 64 + 48 * math.cos(rad)
        y2 = 64 + 48 * math.sin(rad)
        d.line([(x1, y1), (x2, y2)], fill=COLOR, width=3)
    save(img, 'sun')


# ── Dice (🎲) ─────────────────────────────────────────────────────
def icon_dice():
    img = new_img()
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([20, 20, 108, 108], radius=10, outline=COLOR, width=LW)
    # Pips (showing 5)
    for pos in [(42, 42), (86, 42), (64, 64), (42, 86), (86, 86)]:
        d.ellipse([pos[0]-5, pos[1]-5, pos[0]+5, pos[1]+5], fill=COLOR)
    save(img, 'dice')


# ── Disk/Save (💾) ───────────────────────────────────────────────
def icon_disk():
    img = new_img()
    d = ImageDraw.Draw(img)
    d.rectangle([20, 20, 108, 108], outline=COLOR, width=LW)
    # Label area
    d.rectangle([38, 20, 90, 55], outline=COLOR, width=2)
    # Disk area
    d.rectangle([35, 65, 93, 100], outline=COLOR, width=2)
    save(img, 'disk')


# ── Microphone (🎤) ─────────────────────────────────────────────
def icon_mic():
    img = new_img()
    d = ImageDraw.Draw(img)
    # Mic head
    d.rounded_rectangle([45, 15, 83, 65], radius=18, outline=COLOR, width=LW)
    # Stand
    d.arc([32, 40, 96, 90], start=0, end=180, fill=COLOR, width=LW)
    d.line([(64, 90), (64, 108)], fill=COLOR, width=LW)
    d.line([(44, 108), (84, 108)], fill=COLOR, width=LW)
    save(img, 'mic')


# Generate all
icon_chart()
icon_money()
icon_search()
icon_target()
icon_bolt()
icon_brain()
icon_document()
icon_eye()
icon_bulb()
icon_globe()
icon_screen()
icon_refresh()
icon_people()
icon_clock()
icon_check()
icon_gear()
icon_shield()
icon_chat()
icon_trend()
icon_clipboard()
icon_shuffle()
icon_ruler()
icon_scale()
icon_film()
icon_crystal()
icon_tie()
icon_grad()
icon_no()
icon_building()
icon_tree()
icon_web()
icon_microscope()
icon_phone()
icon_newspaper()
icon_satellite()
icon_alert()
icon_hash()
icon_sun()
icon_dice()
icon_disk()
icon_mic()

print(f'Generated {len(os.listdir(OUT))} icons in {OUT}')
