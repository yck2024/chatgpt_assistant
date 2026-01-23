#!/usr/bin/env python3
"""
Resize screenshots to Chrome Web Store dimensions (1280x800).
Maintains aspect ratio and adds white padding if needed.
"""

import sys
import os
from PIL import Image

TARGET_WIDTH = 1280
TARGET_HEIGHT = 800
BG_COLOR = (255, 255, 255)  # White background for padding


def resize_screenshot(input_path, output_path):
    """Resize a single screenshot to 1280x800 with padding."""
    img = Image.open(input_path)
    original_size = img.size

    # Convert to RGB (remove alpha channel if present)
    if img.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGB', img.size, BG_COLOR)
        if img.mode == 'P':
            img = img.convert('RGBA')
        if img.mode in ('RGBA', 'LA'):
            background.paste(img, mask=img.split()[-1])
        else:
            background.paste(img)
        img = background
    elif img.mode != 'RGB':
        img = img.convert('RGB')

    # Calculate scaling to fit within target while maintaining aspect ratio
    width_ratio = TARGET_WIDTH / img.width
    height_ratio = TARGET_HEIGHT / img.height
    scale_ratio = min(width_ratio, height_ratio)

    # New dimensions after scaling
    new_width = int(img.width * scale_ratio)
    new_height = int(img.height * scale_ratio)

    # Resize image with high quality
    img_resized = img.resize((new_width, new_height), Image.LANCZOS)

    # Create target canvas with background color
    canvas = Image.new('RGB', (TARGET_WIDTH, TARGET_HEIGHT), BG_COLOR)

    # Calculate position to center the image
    x_offset = (TARGET_WIDTH - new_width) // 2
    y_offset = (TARGET_HEIGHT - new_height) // 2

    # Paste resized image onto canvas
    canvas.paste(img_resized, (x_offset, y_offset))

    # Save
    canvas.save(output_path, 'PNG', optimize=True)

    return original_size, (new_width, new_height)


def main():
    if len(sys.argv) < 2:
        print("Usage: python resize_screenshots.py <input_folder> [output_folder]")
        print("  If output_folder not specified, files are modified in place.")
        sys.exit(1)

    input_folder = sys.argv[1]
    output_folder = sys.argv[2] if len(sys.argv) > 2 else input_folder

    if not os.path.exists(input_folder):
        print(f"Error: Input folder '{input_folder}' does not exist.")
        sys.exit(1)

    os.makedirs(output_folder, exist_ok=True)

    # Process all image files
    extensions = ('.png', '.jpg', '.jpeg', '.webp', '.bmp')
    processed = 0

    for filename in sorted(os.listdir(input_folder)):
        if filename.lower().endswith(extensions):
            input_path = os.path.join(input_folder, filename)

            # Change extension to .png for output
            output_filename = os.path.splitext(filename)[0] + '.png'
            output_path = os.path.join(output_folder, output_filename)

            try:
                original, scaled = resize_screenshot(input_path, output_path)
                print(f"✓ {filename}: {original[0]}x{original[1]} → {TARGET_WIDTH}x{TARGET_HEIGHT} (scaled to {scaled[0]}x{scaled[1]})")
                processed += 1
            except Exception as e:
                print(f"✗ {filename}: Error - {e}")

    if processed == 0:
        print("No image files found to process.")
    else:
        print(f"\nProcessed {processed} screenshot(s) to {output_folder}")
        if processed > 5:
            print("⚠ Warning: Chrome Web Store allows maximum 5 screenshots.")


if __name__ == "__main__":
    main()
