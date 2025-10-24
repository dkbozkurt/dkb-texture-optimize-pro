# Texture Optimize Pro

> 🎨 Texture optimization library for HTML5 games (PixiJS/ThreeJS) with per-texture configuration

Optimize your game textures with **Sharp** - the fastest Node.js image processing library. Configure each texture individually by name with custom max sizes, formats, and quality settings.

## ✨ Features

- ⚡ **Lightning Fast** - Powered by Sharp (libvips) for 4-26x faster processing.
- 🎯 **Per-Texture Configuration** - Each texture can have custom settings based on filename.
- 📏 **Automatic Power-of-2** - Automatically resizes to nearest power-of-2 for WebGL compatibility (32, 64, 128, 256, 512, 1024, 2048, 4096).
- 📐 **Always Maintains Aspect Ratio** - Never stretches or skews your images.
- 🖼️ **Preserves Input Format** - Your `.png` files stay `.png`, and `.jpg` stay `.jpg`.
- 🗜️ **Optimized Compression** - Applies quality settings for PNG, JPG, and WebP.
- 📦 **Batch Processing** - Process entire directories with configurable concurrency.
- 🔄 **Smart Re-optimization** - Automatically preserves originals for unlimited quality-preserving re-optimizations.
- 🎮 **Game-Optimized** - Built for PixiJS, ThreeJS, and playable ads.
- 🔧 **TypeScript** - Full type safety and IntelliSense support.

## 📦 Installation
```bash
npm install dkb-texture-optimize-pro
# or
yarn add dkb-texture-optimize-pro
# or
pnpm add dkb-texture-optimize-pro
```

## 🚀 Quick Start

This guide will walk you through setting up and using the texture optimizer for your project.

### 1. Prepare Your Project Structure
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

### 2. Initialize Configuration

Run the init command to create a sample configuration file:
```bash
npx texture-optimizer init
```

This creates texture-optimize-pro.json in your project root.

### 3. Configure Your Textures

Edit **texture-optimize-pro.json** to match your texture files:
```JSON
{
  "defaultSettings": {
    "maxSize": 512,
    "quality": 80
  },
  "textures": [
    {
      "name": "player-sprite",
      "useDefault": false,
      "maxSize": 512,
      "quality": 85
    },
    {
      "name": "enemy-goblin",
      "useDefault": false,
      "maxSize": 256,
      "quality": 80
    },
    {
      "name": "background-sky",
      "useDefault": true
    }
  ]
}
```

See the "Configuration" section below for a detailed breakdown.

### 4. Run the Optimizer

The optimizer supports two modes:

#### Option A: In-Place Optimization (Recommended for Development)
Optimizes textures in their current location and backs up originals automatically:
```bash
npx texture-optimizer build --base-path src/assets/textures
```

**What happens:**
- Originals automatically backed up to `_originalTexture/` folders
- Optimized textures replace originals in place
- Perfect for iterative development and re-optimization

**Expected Output:**
```
🎨 Texture Optimizer for HTML5 Games

Config: /path/to/texture-optimize-pro.json
Input:  /path/to/src/assets/textures
Mode:   In-place optimization (originals → _originalTexture)

📋 Loading texture configuration from: /path/to/texture-optimize-pro.json
   Found 3 configured textures in config
📁 Found 5 texture files to process

✓ [IN-PLACE] [CUSTOM] player-sprite.png → player-sprite.png (45.2% smaller, 0.15 MB, 512x512, maxSize: 512px)
✓ [IN-PLACE] [CUSTOM] enemy-goblin.png → enemy-goblin.png (52.1% smaller, 0.08 MB, 256x256, maxSize: 256px)
✓ [IN-PLACE] [DEFAULT] background-sky.jpg → background-sky.jpg (12.3% smaller, 1.24 MB, 1024x1024, maxSize: 1024px)

==================================================
Processing Summary
✓ Successful: 3/3
📦 Originals backed up to: _originalTexture/ folders
```

**After optimization:**
```
textures/
├── player-sprite.png          (optimized)
├── enemy-goblin.png           (optimized)
└── _originalTexture/
    ├── player-sprite.png      (original backup)
    └── enemy-goblin.png       (original backup)
```

#### Option B: Output Directory Mode (Recommended for Production)
Outputs optimized textures to a separate directory, leaving source untouched:
```bash
npx texture-optimizer build \
  --base-path src/assets/textures \
  --output dist/textures
```

**What happens:**
- Source files remain completely untouched
- Optimized textures written to output directory
- If `_originalTexture/` exists in source, uses those as reference
- Clean separation of source and build artifacts

**Expected Output:**
```
🎨 Texture Optimizer for HTML5 Games

Config: /path/to/texture-optimize-pro.json
Input:  /path/to/src/assets/textures
Output: /path/to/dist/textures

📋 Loading texture configuration from: /path/to/texture-optimize-pro.json
   Found 3 configured textures in config
📁 Found 5 texture files to process

✓ [CUSTOM] player-sprite.png → player-sprite.png (45.2% smaller, 0.15 MB, 512x512, maxSize: 512px)
✓ [CUSTOM] enemy-goblin.png → enemy-goblin.png (52.1% smaller, 0.08 MB, 256x256, maxSize: 256px)
✓ [DEFAULT] background-sky.jpg → background-sky.jpg (12.3% smaller, 1.24 MB, 1024x1024, maxSize: 1024px)

==================================================
Processing Summary
✓ Successful: 3/3
```

**After optimization:**
```
src/assets/textures/           (unchanged)
├── player-sprite.png
└── enemy-goblin.png

dist/textures/                 (optimized output)
├── player-sprite.png
└── enemy-goblin.png
```

### 5. Re-optimize Anytime (In-Place Mode)

When using in-place mode, you can re-optimize with different settings without quality loss:
```bash
# Change settings in texture-optimize-pro.json
# (e.g., maxSize: 512 → 1024, quality: 80 → 90)

# Run optimizer again
npx texture-optimizer build --base-path src/assets/textures
```

The optimizer automatically detects and uses originals from `_originalTexture/`:
```
📦 Using original from backup: player-sprite.png
✓ [IN-PLACE] [RE-OPT] [CUSTOM] player-sprite.png → player-sprite.png (72% smaller, 0.55 MB, 1024x1024, maxSize: 1024px)
```

## 🔧 Configuration
#### Configuration File (`texture-optimize-pro.json`)

`defaultSettings` :

* Applied to all textures not listed in the textures array.
* Applied to any textures in the array with useDefault: true.
```JSON
{
  "defaultSettings": {
    "maxSize": 512,
    "quality": 80
  }
}
```

#### `textures` Array:
* A list of entries to provide custom settings for specific textures.
```JSON
{
  "name": "player-sprite",
  "useDefault": false,
  "maxSize": 512,
  "quality": 85
}
```

* name: Filename without extension (e.g., "player-sprite" matches "player-sprite.png").
* useDefault: true = use default settings, false = use custom settings specified here.
* maxSize: Maximum dimension (width or height) in pixels.
* quality: Compression quality (1-100).

#### Automatic Settings
* **Format**: The output format now always matches the input format (e.g., .png stays .png).
* **Power of 2**: Textures are always resized to the nearest power-of-2 dimension.
* **Aspect Ratio**: The texture's aspect ratio is always maintained.

#### Name Matching
* The `name` field matches the filename without the extension.
* Example: `"name": "player-sprite"` matches `player-sprite.png`, `player-sprite.jpg`, etc.
* The optimizer searches all subdirectories within your `--base-path`.

#### `maxSize` Options
* Valid options: 32, 64, 128, 256, 512, 1024, 2048, 4096.
* The optimizer will resize to the nearest lower power-of-2, capped at this `maxSize`.

### Schema Reference

This is the internal schema for the settings objects:
```typescript
interface TextureSettings {
  maxSize?: 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;
  quality?: number; // 1-100
}
```

## 🔄 Re-optimization & Original Preservation

The optimizer automatically manages original textures for safe iterative optimization:

### In-Place Mode

**First Run:**
- Optimizes textures in-place (when no `--output` specified)
- Creates `_originalTexture/` backup folders automatically
- Backs up original files before optimization

**Subsequent Runs:**
- Detects existing `_originalTexture/` folders
- Uses backed-up originals as source (not already-optimized files)
- Applies new settings without quality degradation
- Console shows `[RE-OPT]` tag to indicate re-optimization

**Benefits:**
- ✨ Unlimited re-optimizations without quality loss
- 🔒 Original textures always preserved
- 🎯 Safe experimentation with different settings
- 🔄 Change maxSize or quality freely - always from original source

**Example workflow:**
```bash
# Initial optimization
npx texture-optimizer build -b src/textures
# Creates: src/textures/_originalTexture/

# Change settings in texture-optimize-pro.json
# (e.g., maxSize: 512 → 1024, quality: 80 → 90)

# Re-optimize with new settings
npx texture-optimizer build -b src/textures
# Uses: src/textures/_originalTexture/ as source
# Result: Fresh optimization from original, no quality loss!
```

### Output Directory Mode

**With Existing Backups:**
If `_originalTexture/` folders exist in your source directory, the optimizer will use them as reference:
```bash
# Source has backups from previous in-place optimization
src/textures/_originalTexture/player.png (exists)

# Run with output directory
npx texture-optimizer build -b src/textures -o dist/textures

# Uses backup as source, outputs to dist/
```

**Without Backups:**
Uses current source files and outputs to specified directory.

### Special Case - Backup-Only Folders

If you have only `_originalTexture/` folders (no textures outside), the optimizer will:
- Detect textures inside `_originalTexture/`
- Optimize them and output to parent directory
- Useful for restoring optimized textures from backups
```bash
# Only _originalTexture/ exists
textures/
└── _originalTexture/
    └── player.png

# Run optimizer
npx texture-optimizer build -b textures

# Result:
textures/
├── player.png              (optimized, created)
└── _originalTexture/
    └── player.png          (original, unchanged)
```

## ✨ Tips & Best Practices

### 1. Choosing Between Modes

**Use In-Place Mode when:**
- Developing and iterating on optimization settings
- Want to experiment with different quality/size combinations
- Need to re-optimize frequently
- Working in development environment

**Use Output Directory Mode when:**
- Building for production
- Want to keep source and build separate
- Using in CI/CD pipelines
- Don't need to re-optimize frequently

### 2. Naming Convention

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

### 3. Choose the Right Input Format

* **PNG**: Best for transparency, UI elements, text, or pixel art.
* **JPG**: Best for photos, complex backgrounds, or realistic art (no transparency).
* **WebP**: Best compression for modern browsers.

### 4. Power-of-2 for WebGL
This feature is automatic and enabled by default. It is critical for:

* ThreeJS textures (required for mipmapping).
* PixiJS textures (improves performance and compatibility).
* Any WebGL-based rendering.

### 5. Quality Settings

Use this as a guide for setting the quality property (1-100):

* 90-100: High-quality assets, hero characters, prominent UI.
* 80-90: Standard game assets.
* 70-80: Backgrounds, secondary elements.
* 60-70: Playable ads, or where extreme optimization is needed.

### 6. Test Your Settings
After optimizing, always load your game and verify:

* Textures look visually acceptable.
* No performance issues are introduced.
* File sizes are reduced.
* The total bundle size meets your requirements.

### 7. Managing Backups

**Development:**
- Keep `_originalTexture/` folders for re-optimization flexibility
- Commit to version control if team needs re-optimization capability

**Production/Deployment:**
- Exclude `_originalTexture/` from builds (already larger originals)
- Add to `.gitignore` if needed: `echo "_originalTexture" >> .gitignore`
- Use output directory mode to avoid shipping backups

**Disk Space:**
- Backups typically use 2-3x space of optimized textures
- Trade-off for unlimited quality-preserving re-optimizations

## 🛠️ Integration with Your Build Process

You can run the optimizer manually or integrate it into your build scripts.

### Option A: package.json Pre-build Script (In-Place)

Add to your `package.json` to run automatically before every build:
```JSON
{
  "scripts": {
    "optimize-textures": "texture-optimizer build --base-path src/assets/textures",
    "prebuild": "npm run optimize-textures",
    "build": "vite build"
  }
}
```
Now, just run `npm run build`.

### Option B: package.json Pre-build Script (Output Directory)
```JSON
{
  "scripts": {
    "optimize-textures": "texture-optimizer build --base-path src/assets/textures --output dist/textures",
    "prebuild": "npm run optimize-textures",
    "build": "vite build"
  }
}
```

### Option C: package.json Separate Commands

Keep both as separate commands to run manually:
```JSON
{
  "scripts": {
    "optimize-inplace": "texture-optimizer build --base-path src/assets/textures",
    "optimize": "texture-optimizer build --base-path src/assets/textures --output dist/textures",
    "build": "vite build"
  }
}
```

Run when needed: `npm run optimize-inplace` or `npm run optimize`.

### Option D: Vite Integration

You can also run the optimizer programmatically within your `vite.config.ts`:
```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  // ... your config
  build: {
    // Run texture optimizer before build
    async buildStart() {
      const { BatchProcessor } = await import('dkb-texture-optimize-pro');
      const processor = new BatchProcessor({
        basePath: 'src/assets/textures',
        outputDir: 'dist/textures', // Omit for in-place mode
        textureConfigPath: 'texture-optimize-pro.json'
      });
      await processor.processAll();
    }
  }
});
```

## 📖 CLI Usage

### Build Command
```bash
texture-optimizer build [options]
```

**Options:**
- `-c, --config <path>` - Path to texture-optimize-pro.json (default: "texture-optimize-pro.json")
- `-b, --base-path <path>` - Base path for input textures (default: "src/assets/textures")
- `-o, --output <path>` - Output directory (if not specified, optimizes in-place and backs up originals to _originalTexture folder)
- `--concurrency <number>` - Number of concurrent operations (default: 10)
- `--verbose` - Enable verbose logging

**Examples:**
```bash
# In-place optimization with backup
texture-optimizer build --base-path src/assets/textures

# Output to separate directory
texture-optimizer build \
  --base-path src/assets/textures \
  --output dist/textures

# Process with custom config and verbose logging
texture-optimizer build \
  --config my-texture-config.json \
  --base-path assets/images \
  --output build/optimized \
  --concurrency 5 \
  --verbose
```

### Init Command
```bash
texture-optimizer init [directory]
```

Creates a sample `texture-optimize-pro.json` configuration file in the specified directory.

## 💻 Programmatic API

### Single Texture Optimization
```typescript
import { TextureOptimizer } from 'dkb-texture-optimize-pro';

// Settings for a single run, including the detected format
const optimizer = new TextureOptimizer({
  maxSize: 512,
  quality: 85,
  format: 'png' // Format must be specified here
});

const result = await optimizer.optimize(
  'src/player-sprite.png',
  'dist/player-sprite.png' // Output matches input format
);

console.log(`Reduced by ${result.reductionPercent.toFixed(1)}%`);
console.log(`${result.originalSize.width}x${result.originalSize.height} → ${result.optimizedSize.width}x${result.optimizedSize.height}`);
```

### Batch Processing
```typescript
import { BatchProcessor } from 'dkb-texture-optimize-pro';

// In-place mode (omit outputDir)
const processor = new BatchProcessor({
  basePath: 'src/assets/textures',
  textureConfigPath: 'texture-optimize-pro.json',
  concurrency: 10,
  verbose: true
});

// Output directory mode (specify outputDir)
const processorWithOutput = new BatchProcessor({
  basePath: 'src/assets/textures',
  outputDir: 'dist/textures',
  textureConfigPath: 'texture-optimize-pro.json',
  concurrency: 10,
  verbose: true
});

// BatchProcessor handles format detection automatically
const results = await processor.processAll();

console.log(`Processed ${results.length} textures`);
const successful = results.filter(r => r.success);
console.log(`Success rate: ${(successful.length / results.length * 100).toFixed(1)}%`);
```

### Using Texture Config Manager
```typescript
import { TextureConfigManager } from 'dkb-texture-optimize-pro';

const configManager = await TextureConfigManager.loadFromFile('texture-optimize-pro.json');

// Get settings for a specific texture
const settings = configManager.getSettingsForTexture('player-sprite.png');
console.log(`Max size: ${settings.maxSize}px`);
console.log(`Quality: ${settings.quality}`);

// Check if texture has custom settings
const hasCustom = configManager.hasCustomSettings('player-sprite.png');
console.log(`Uses custom settings: ${hasCustom}`);

// Get all configured textures
const configured = configManager.getConfiguredTextures();
console.log(`Configured textures: ${configured.join(', ')}`);
```

## 🎮 Use Cases & Recommendations

### For Playable Ads (5MB limit)

Aggressive optimization is key for playable ads:
```json
{
  "defaultSettings": {
    "maxSize": 512,
    "quality": 75
  }
}
```

**Tips:**
- Use maxSize 256-512 for most textures
- Quality 70-80 for good balance
- Combine with texture atlases for maximum savings
- Choose your input formats wisely (e.g., use .jpg for backgrounds, .png for UI)
- Use in-place optimization to iterate on settings until you hit size target

### For PixiJS Games

Balance quality and performance:
```json
{
  "defaultSettings": {
    "maxSize": 512,
    "quality": 85,
  },
  "textures": [
    {
      "name": "hero-spritesheet",
      "useDefault": false,
      "maxSize": 2048,
      "quality": 90
    }
  ]
}
```

### For ThreeJS 3D Games

Optimize for GPU memory:
```json
{
  "defaultSettings": {
    "maxSize": 1024,
    "quality": 85,
  },"textures": [
    {
        "name": "hero-diffuse-map",
        "useDefault": false,
        "maxSize": 1024,
        "quality": 80
    }
  ]
}
```

**Tips:**
- Power-of-2 is automatic, which is critical for ThreeJS mipmapping.
- Use PNG for textures requiring alpha channel
- JPG for diffuse maps without transparency

## 📊 Performance

**Sharp Performance Benchmarks:**
- JPEG resize: **64x faster** than ImageMagick
- PNG resize: **4.7x faster** than ImageMagick
- WebP encoding: **High quality** with efficient compression
- Batch processing: **10+ images/second** on typical hardware

**Memory Usage:**
- Configurable concurrency to manage memory
- Default: 10 concurrent operations
- Adjust based on image sizes and available RAM

## 🐛 Troubleshooting

### Texture looks blurry Issues

**Solution**: The `quality` or `maxSize` is too low. Increase them in your config:
```JSON
{
  "name": "my-texture",
  "useDefault": false,
  "maxSize": 1024,  // Was 512, now 1024
  "quality": 90      // Was 80, now 90
}
```

### Output files too large Issues
**Solution**: Decrease `maxSize` or `quality`. Also, check your source asset; a large `.png` background might be better saved as a `.jpg` before optimizing.
```JSON
{
  "name": "my-texture",
  "useDefault": false,
  "maxSize": 512,    // Was 1024
  "quality": 75      // Was 85
}
```

### Texture not being optimized with custom settings

**Solution**: Check that the `name` in your config matches the filename exactly (without the extension).
```
File: player-sprite-idle.png
Config: "name": "player-sprite-idle"  ✓ Correct
Config: "name": "player-sprite"       ✗ Won't match
```

### Re-optimization not working (In-Place Mode)

**Solution**: Ensure `_originalTexture/` folders exist and contain the actual originals. Run with `--verbose` to see if backups are being used:
```bash
texture-optimizer build -b src/textures --verbose
```

Expected output:
```
📦 Using original from backup: player-sprite.png
✓ [IN-PLACE] [RE-OPT] [CUSTOM] player-sprite.png → ...
```

If not shown, `_originalTexture/` may be missing or empty.

### Sharp Installation Issues

If Sharp fails to install:
```bash
# Clear npm cache
npm cache clean --force

# Reinstall with rebuild
npm install sharp --build-from-source
```

### Memory Issues

For large batches, reduce concurrency:
```bash
texture-optimizer build --concurrency 5
```

Or set environment variables:
```bash
export UV_THREADPOOL_SIZE=8
export MALLOC_ARENA_MAX=2
```

## 📜 License

MIT License © Dogukan Kaan Bozkurt

## 🤝 Contributing

Contributions welcome! Please open an issue or PR on GitHub.

## 🔗 Links

- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [Luna Labs Optimization Guide](https://docs.lunalabs.io/docs/playable/optimise-your-builds/optimising-assets/optimising-textures)
- [PixiJS Performance Tips](https://pixijs.com/guides/concepts/performance-tips)
- [ThreeJS Textures](https://threejs.org/docs/#api/en/textures/Texture)