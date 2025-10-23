# Getting Started with DKB Texture Optimize Pro

This guide will walk you through setting up and using the texture optimizer for your HTML5 game project.

## Installation

```bash
npm install dkb-texture-optimize-pro
```

## Step 1: Prepare Your Project Structure

Create a directory structure for your textures:

```
your-project/
├── src/
│   └── assets/
│       └── textures/
│           ├── player-sprite.png
│           ├── enemy-goblin.png
│           ├── background-sky.jpg
│           └── ui/
│               ├── button.png
│               └── icon.png
└── package.json
```

## Step 2: Initialize Configuration

Run the init command to create a sample configuration file:

```bash
npx texture-optimizer init
```

This creates `textures.json` in your project root.

## Step 3: Configure Your Textures

Edit `textures.json` to match your texture files:

```json
{
  "defaultSettings": {
    "maxSize": 1024,
    "format": "png",
    "quality": 80,
    "powerOf2": true,
    "maintainAspectRatio": true,
    "encoding": "none"
  },
  "textures": [
    {
      "name": "player-sprite",
      "useDefault": false,
      "maxSize": 512,
      "format": "webp",
      "quality": 85
    },
    {
      "name": "enemy-goblin",
      "useDefault": false,
      "maxSize": 256,
      "format": "webp",
      "quality": 80
    },
    {
      "name": "background-sky",
      "useDefault": true
    }
  ]
}
```

### Understanding the Configuration

**defaultSettings:**
- Applied to all textures not listed in the `textures` array
- Applied to textures with `useDefault: true`

**Texture Entry:**
```json
{
  "name": "player-sprite",      // Filename without extension
  "useDefault": false,           // false = use custom settings below
  "maxSize": 512,                // Maximum dimension in pixels
  "format": "webp",              // Output format
  "quality": 85                  // Compression quality (1-100)
}
```

**Name Matching:**
- The `name` field matches the filename **without extension**
- Example: `"name": "player-sprite"` matches `player-sprite.png`, `player-sprite.jpg`, etc.
- Works with nested directories: searches all subdirectories

**maxSize Options:**
- 64, 128, 256, 512, 1024, 2048, 4096
- With `powerOf2: true`, resizes to nearest lower power-of-2
- With `powerOf2: false`, resizes proportionally

**Format Options:**
- `"png"` - Best for transparency, UI elements
- `"jpg"` - Best for photos, backgrounds without transparency
- `"webp"` - Best overall compression for modern browsers

## Step 4: Run the Optimizer

Process all your textures:

```bash
npx texture-optimizer build \
  --base-path src/assets/textures \
  --output dist/textures
```

### Expected Output

```
🎨 Texture Optimizer for HTML5 Games

Config: /path/to/textures.json
Input:  /path/to/src/assets/textures
Output: /path/to/dist/textures

📋 Loading texture configuration from: /path/to/textures.json
   Found 3 configured textures in config
📁 Found 5 texture files to process

✓ [CUSTOM] player-sprite.png → player-sprite.webp (45.2% smaller, 0.15 MB, 512x512, maxSize: 512px)
✓ [CUSTOM] enemy-goblin.png → enemy-goblin.webp (52.1% smaller, 0.08 MB, 256x256, maxSize: 256px)
✓ [DEFAULT] background-sky.jpg → background-sky.png (12.3% smaller, 1.24 MB, 1024x1024, maxSize: 1024px)
✓ [DEFAULT] ui/button.png → ui/button.png (38.7% smaller, 0.05 MB, 256x256, maxSize: 1024px)
✓ [DEFAULT] ui/icon.png → ui/icon.png (41.2% smaller, 0.02 MB, 128x128, maxSize: 1024px)

==================================================
Processing Summary
==================================================
✓ Successful: 5/5
⚙ Custom settings applied: 2
📋 Default settings used: 3

📊 Size Statistics:
   Original size:  2.45 MB
   Optimized size: 1.54 MB
   💾 Saved: 0.91 MB (37.1% reduction)
   ⚡ Avg processing time: 245ms per texture

📦 Format Breakdown:
   WEBP: 2 files (0.23 MB)
   PNG: 3 files (1.31 MB)

📏 MaxSize Distribution:
   256px: 2 textures
   512px: 1 textures
   1024px: 2 textures

==================================================
```

## Step 5: Integrate with Your Build Process

### Option A: Pre-build Script

Add to your `package.json`:

```json
{
  "scripts": {
    "prebuild": "texture-optimizer build",
    "build": "vite build"
  }
}
```

Now textures are automatically optimized before every build:

```bash
npm run build
```

### Option B: Separate Command

Keep it as a separate command:

```json
{
  "scripts": {
    "optimize-textures": "texture-optimizer build",
    "build": "vite build"
  }
}
```

Run manually when needed:

```bash
npm run optimize-textures
npm run build
```

## Common Scenarios

### Scenario 1: Playable Ad (5MB limit)

Ultra-aggressive optimization:

```json
{
  "defaultSettings": {
    "maxSize": 512,
    "format": "webp",
    "quality": 70,
    "powerOf2": true
  },
  "textures": [
    {
      "name": "hero-character",
      "useDefault": false,
      "maxSize": 256,
      "quality": 75
    },
    {
      "name": "background",
      "useDefault": false,
      "maxSize": 512,
      "quality": 65
    }
  ]
}
```

### Scenario 2: PixiJS Web Game

Balance quality and performance:

```json
{
  "defaultSettings": {
    "maxSize": 1024,
    "format": "webp",
    "quality": 85,
    "powerOf2": true
  },
  "textures": [
    {
      "name": "hero-spritesheet",
      "useDefault": false,
      "maxSize": 2048,
      "quality": 90
    },
    {
      "name": "ui-elements",
      "useDefault": false,
      "maxSize": 512,
      "format": "png",
      "quality": 90
    }
  ]
}
```

### Scenario 3: ThreeJS 3D Game

Optimize for GPU memory:

```json
{
  "defaultSettings": {
    "maxSize": 1024,
    "format": "png",
    "quality": 85,
    "powerOf2": true
  },
  "textures": [
    {
      "name": "diffuse-map",
      "useDefault": false,
      "format": "jpg",
      "quality": 80
    },
    {
      "name": "normal-map",
      "useDefault": false,
      "format": "png",
      "quality": 90
    }
  ]
}
```

## Tips & Best Practices

### 1. Naming Convention

Use clear, descriptive names that match your files:

```
Good:
- player-idle.png → "name": "player-idle"
- enemy-boss-1.png → "name": "enemy-boss-1"
- bg-forest-day.jpg → "name": "bg-forest-day"

Bad:
- texture1.png → hard to configure
- IMG_0001.png → meaningless name
```

### 2. Choose the Right Format

- **PNG**: Transparency, UI, text, pixel art
- **JPG**: Photos, backgrounds, realistic art (no transparency)
- **WebP**: Best compression for modern browsers (2025)

### 3. Power-of-2 for WebGL

Always use `powerOf2: true` for:
- ThreeJS textures (required for mipmapping)
- PixiJS textures (better performance)
- Any WebGL rendering

### 4. Quality Settings

- **90-100**: High-quality assets, hero characters, UI
- **80-90**: Standard game assets
- **70-80**: Backgrounds, secondary elements
- **60-70**: Playable ads, extreme optimization

### 5. Test Your Settings

After optimization, load your game and verify:
- Textures look good visually
- No performance issues
- File sizes are acceptable
- Total bundle size meets requirements

## Troubleshooting

### Issue: Texture looks blurry

**Solution:** Increase `quality` or `maxSize`:

```json
{
  "name": "my-texture",
  "useDefault": false,
  "maxSize": 1024,  // Was 512, now 1024
  "quality": 90      // Was 80, now 90
}
```

### Issue: Output files too large

**Solution:** Decrease `maxSize` or `quality`, or switch format:

```json
{
  "name": "my-texture",
  "useDefault": false,
  "maxSize": 512,    // Was 1024
  "format": "webp",  // Was "png"
  "quality": 75      // Was 85
}
```

### Issue: Texture not being optimized

**Solution:** Check the texture name matches exactly (without extension):

```
File: player-sprite-idle.png
Config: "name": "player-sprite-idle"  ✓ Correct
Config: "name": "player-sprite"       ✗ Won't match
```

### Issue: Power-of-2 creating odd sizes

**Solution:** Manually specify target size or disable power-of-2:

```json
{
  "name": "my-texture",
  "useDefault": false,
  "powerOf2": false,
  "maxSize": 1000
}
```

## Next Steps

1. ✅ Install the library
2. ✅ Create `textures.json` configuration
3. ✅ Configure your textures
4. ✅ Run the optimizer
5. ✅ Integrate with build process

**Happy optimizing! 🎮**