#!/usr/bin/env python3
"""
Create Chrome extension icon sizes from a source image.
Generates: 16x16, 32x32, 48x48, 128x128 in PNG and JPEG formats.
"""

import sys
import os
from PIL import Image

ICON_SIZES = [16, 32, 48, 128]


def create_icons(source_path, output_folder):
    """Create all icon sizes from source image."""
    source = Image.open(source_path).convert('RGBA')
    print(f"Source: {source_path} ({source.size[0]}x{source.size[1]})")

    os.makedirs(output_folder, exist_ok=True)

    for size in ICON_SIZES:
        # Resize with high quality
        resized = source.resize((size, size), Image.LANCZOS)

        # Save PNG (with transparency)
        png_path = os.path.join(output_folder, f"icon{size}.png")
        resized.save(png_path, 'PNG', optimize=True)

        # Save JPEG (white background, no transparency)
        jpeg_bg = Image.new('RGB', (size, size), (255, 255, 255))
        if resized.mode == 'RGBA':
            jpeg_bg.paste(resized, (0, 0), resized)
        else:
            jpeg_bg.paste(resized, (0, 0))
        jpeg_path = os.path.join(output_folder, f"icon{size}.jpeg")
        jpeg_bg.save(jpeg_path, 'JPEG', quality=95)

        print(f"✓ icon{size}.png & icon{size}.jpeg ({size}x{size})")

    return len(ICON_SIZES)


def main():
    if len(sys.argv) < 3:
        print("Usage: python create_icons.py <source_image> <output_folder>")
        print("\nCreates icon sizes: 16, 32, 48, 128 in PNG and JPEG formats.")
        sys.exit(1)

    source_path = sys.argv[1]
    output_folder = sys.argv[2]

    if not os.path.exists(source_path):
        print(f"Error: Source image '{source_path}' not found.")
        sys.exit(1)

    count = create_icons(source_path, output_folder)
    print(f"\nCreated {count} icon sizes in {output_folder}")


if __name__ == "__main__":
    main()
