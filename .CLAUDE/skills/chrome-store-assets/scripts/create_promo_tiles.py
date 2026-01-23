#!/usr/bin/env python3
"""
Create promotional tiles for Chrome Web Store.
- Small promo tile: 440x280
- Marquee promo tile: 1400x560
"""

import sys
import os
import argparse
from PIL import Image, ImageDraw, ImageFont

# Default colors
DARK_BLUE = (15, 23, 42)
TEAL = (56, 189, 248)
WHITE = (255, 255, 255)


def get_font(size):
    """Try to get a nice font, fallback to default."""
    font_paths = [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/SFNSDisplay.ttf",
        "/Library/Fonts/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",  # Linux
        "C:\\Windows\\Fonts\\arial.ttf",  # Windows
    ]
    for fp in font_paths:
        try:
            return ImageFont.truetype(fp, size)
        except:
            continue
    return ImageFont.load_default()


def create_gradient_background(width, height, base_color, factor=0.2):
    """Create a subtle vertical gradient background."""
    canvas = Image.new('RGB', (width, height), base_color)
    draw = ImageDraw.Draw(canvas)

    for y in range(height):
        gradient_factor = 1 + (y / height) * factor
        color = tuple(min(255, int(c * gradient_factor)) for c in base_color)
        draw.line([(0, y), (width, y)], fill=color)

    return canvas


def create_small_promo(icon_path, output_path, title, tagline):
    """Create small promo tile (440x280)."""
    width, height = 440, 280

    # Create gradient background
    canvas = create_gradient_background(width, height, DARK_BLUE)
    draw = ImageDraw.Draw(canvas)

    # Load and resize icon
    icon = Image.open(icon_path).convert('RGBA')
    icon_size = 80
    icon_resized = icon.resize((icon_size, icon_size), Image.LANCZOS)

    # Position icon on left
    icon_x = 40
    icon_y = (height - icon_size) // 2

    # Paste icon with transparency
    canvas.paste(icon_resized, (icon_x, icon_y), icon_resized)

    # Add text
    title_font = get_font(28)
    tagline_font = get_font(14)

    text_x = 140
    draw.text((text_x, 90), title, fill=WHITE, font=title_font)
    draw.text((text_x, 130), tagline, fill=TEAL, font=tagline_font)

    # Decorative line
    draw.rectangle([(text_x, 175), (text_x + 150, 177)], fill=TEAL)

    # Save
    canvas.save(output_path, 'PNG', optimize=True)
    print(f"✓ Created: {os.path.basename(output_path)} (440x280)")


def create_marquee_promo(icon_path, output_path, title, tagline, screenshot_path=None):
    """Create marquee promo tile (1400x560)."""
    width, height = 1400, 560

    # Create gradient background
    canvas = create_gradient_background(width, height, DARK_BLUE)
    draw = ImageDraw.Draw(canvas)

    # Load and resize icon
    icon = Image.open(icon_path).convert('RGBA')
    icon_size = 120
    icon_resized = icon.resize((icon_size, icon_size), Image.LANCZOS)

    # Position icon
    icon_x = 100
    icon_y = (height - icon_size) // 2
    canvas.paste(icon_resized, (icon_x, icon_y), icon_resized)

    # Add text
    title_font = get_font(48)
    tagline_font = get_font(22)

    text_x = 260
    draw.text((text_x, 200), title, fill=WHITE, font=title_font)
    draw.text((text_x, 270), tagline, fill=TEAL, font=tagline_font)

    # Decorative line
    draw.rectangle([(text_x, 320), (text_x + 300, 324)], fill=TEAL)

    # Add screenshot preview if provided
    if screenshot_path and os.path.exists(screenshot_path):
        screenshot = Image.open(screenshot_path).convert('RGB')
        ss_height = 400
        ss_width = int(screenshot.width * (ss_height / screenshot.height))
        screenshot_resized = screenshot.resize((ss_width, ss_height), Image.LANCZOS)

        ss_x = width - ss_width - 80
        ss_y = (height - ss_height) // 2

        # Border
        border = 3
        draw.rectangle(
            [(ss_x - border, ss_y - border), (ss_x + ss_width + border, ss_y + ss_height + border)],
            fill=TEAL
        )
        canvas.paste(screenshot_resized, (ss_x, ss_y))

    # Save
    canvas.save(output_path, 'PNG', optimize=True)
    print(f"✓ Created: {os.path.basename(output_path)} (1400x560)")


def main():
    parser = argparse.ArgumentParser(description='Create Chrome Web Store promo tiles')
    parser.add_argument('icon_path', help='Path to the extension icon')
    parser.add_argument('output_folder', help='Output folder for promo tiles')
    parser.add_argument('--title', default='My Extension', help='Extension title')
    parser.add_argument('--tagline', default='A helpful browser extension', help='Extension tagline')
    parser.add_argument('--screenshot', help='Optional screenshot for marquee tile')

    args = parser.parse_args()

    if not os.path.exists(args.icon_path):
        print(f"Error: Icon file '{args.icon_path}' not found.")
        sys.exit(1)

    os.makedirs(args.output_folder, exist_ok=True)

    # Create small promo tile
    small_path = os.path.join(args.output_folder, 'promo_small_440x280.png')
    create_small_promo(args.icon_path, small_path, args.title, args.tagline)

    # Create marquee promo tile
    marquee_path = os.path.join(args.output_folder, 'promo_marquee_1400x560.png')
    create_marquee_promo(args.icon_path, marquee_path, args.title, args.tagline, args.screenshot)

    print(f"\nPromo tiles saved to {args.output_folder}")


if __name__ == "__main__":
    main()
