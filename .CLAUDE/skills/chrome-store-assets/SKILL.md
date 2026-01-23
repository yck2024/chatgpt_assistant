---
name: chrome-store-assets
description: Prepare images for Chrome Web Store - resize screenshots to 1280x800, create promo tiles (440x280, 1400x560), and generate icon sizes (16, 32, 48, 128)
---

# Chrome Web Store Asset Preparation

This skill helps prepare images for Chrome Web Store submission, ensuring they meet all requirements.

## Chrome Web Store Image Requirements

### Screenshots
- Dimensions: **1280x800** or 640x400
- Format: JPEG or 24-bit PNG (no alpha)
- Maximum: 5 screenshots
- At least 1 required

### Small Promo Tile
- Dimensions: **440x280**
- Format: JPEG or 24-bit PNG (no alpha)

### Marquee Promo Tile
- Dimensions: **1400x560**
- Format: JPEG or 24-bit PNG (no alpha)

### Extension Icons
- Sizes: **16x16, 32x32, 48x48, 128x128**
- Format: PNG (transparency allowed)

## Available Commands

### 1. Resize Screenshots
Resize images to 1280x800 while maintaining aspect ratio. Adds padding (white background) if needed.

```bash
python3 ./scripts/resize_screenshots.py <input_folder> [output_folder]
```

### 2. Create Promo Tiles
Generate small (440x280) and marquee (1400x560) promo tiles with branding.

```bash
python3 ./scripts/create_promo_tiles.py <icon_path> <output_folder> [--title "App Name"] [--tagline "Your tagline"]
```

### 3. Create Icon Sizes
Generate all required icon sizes from a source image.

```bash
python3 ./scripts/create_icons.py <source_image> <output_folder>
```

## Usage Examples

### Prepare all assets for Chrome Web Store:

1. **Screenshots**: Place raw screenshots in a folder, then resize:
   ```bash
   python3 .claude/skills/chrome-store-assets/scripts/resize_screenshots.py ./raw-screenshots ./store-screenshots
   ```

2. **Promo tiles**: Create promotional images:
   ```bash
   python3 .claude/skills/chrome-store-assets/scripts/create_promo_tiles.py ./icons/icon128.png ./promo --title "My Extension" --tagline "Does amazing things"
   ```

3. **Icons**: Generate all icon sizes:
   ```bash
   python3 .claude/skills/chrome-store-assets/scripts/create_icons.py ./icons/source.png ./icons
   ```

## Output Verification

All scripts will:
- Verify output dimensions match requirements
- Ensure no alpha channel for JPEG/required PNGs
- Report success/failure for each file processed
