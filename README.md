# DKB Texture Optimize Pro

> 🎨 Professional texture optimization library for HTML5 games (PixiJS/ThreeJS) with per-texture configuration

Optimize your game textures with **Sharp** - the fastest Node.js image processing library. Configure each texture individually by name with custom max sizes, formats, and quality settings.

## ✨ Features

- ⚡ **Lightning Fast** - Powered by Sharp (libvips) for 4-26x faster processing
- 🎯 **Per-Texture Configuration** - Each texture can have custom settings based on filename
- 📏 **Power-of-2 Resizing** - WebGL-optimized dimensions (64, 128, 256, 512, 1024, 2048, 4096)
- 🗜️ **Smart Compression** - PNG, JPG, and WebP with quality control
- 📦 **Batch Processing** - Process entire directories with configurable concurrency
- 🎮 **Game-Optimized** - Built for PixiJS, ThreeJS, and playable ads
- 🔧 **TypeScript** - Full type safety and IntelliSense support

## 📦 Installation

```bash
npm install dkb-texture-optimize-pro
# or
yarn add dkb-texture-optimize-pro
# or
pnpm add dkb-texture-optimize-pro
```

## 🚀 Quick Start

### 1. Initialize Configuration

```bash
npx texture-optimizer init
```

This creates a `texture-optimize-pro.json` file:

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
      "name": "background-clouds",
      "useDefault": true
    }
  ]
}
```

### 2. Configure Your Textures

Edit `texture-optimize-pro.json` to match your texture filenames:

- **name**: Filename without extension (e.g., "player-sprite" matches "player-sprite.png")
- **useDefault**: `true` = use default settings, `false` = use custom settings
- **maxSize**: Maximum dimension (64, 128, 256, 512, 1024, 2048, 4096)
- **format**: Output format ("png", "jpg", "webp")
- **quality**: Compression quality (1-100)

### 3. Process Your Textures

```bash
npx texture-optimizer build --base-path src/assets/textures --output dist/textures
```

## 📖 CLI Usage

### Build Command

```bash
texture-optimizer build [options]
```

**Options:**
- `-c, --config <path>` - Path to texture-optimize-pro.json (default: "texture-optimize-pro.json")
- `-b, --base-path <path>` - Base path for input textures (default: "src/assets/textures")
- `-o, --output <path>` - Output directory (default: "dist/textures")
- `--concurrency <number>` - Number of concurrent operations (default: 10)
- `--verbose` - Enable verbose logging

**Example:**

```bash
# Process with custom config
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

const optimizer = new TextureOptimizer({
  maxSize: 512,
  format: 'webp',
  quality: 85,
  powerOf2: true,
  maintainAspectRatio: true,
  encoding: 'none'
});

const result = await optimizer.optimize(
  'src/player-sprite.png',
  'dist/player-sprite.webp'
);

console.log(`Reduced by ${result.reductionPercent.toFixed(1)}%`);
console.log(`${result.originalSize.width}x${result.originalSize.height} → ${result.optimizedSize.width}x${result.optimizedSize.height}`);
```

### Batch Processing

```typescript
import { BatchProcessor } from 'dkb-texture-optimize-pro';

const processor = new BatchProcessor({
  basePath: 'src/assets/textures',
  outputDir: 'dist/textures',
  textureConfigPath: 'texture-optimize-pro.json',
  concurrency: 10,
  verbose: true
});

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
console.log(`Format: ${settings.format}`);
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
    "format": "webp",
    "quality": 75,
    "powerOf2": true
  }
}
```

**Tips:**
- Use maxSize 256-512 for most textures
- WebP format provides best compression
- Quality 70-80 for good balance
- Combine with texture atlases for maximum savings

### For PixiJS Games

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
    "format": "png",
    "quality": 85,
    "powerOf2": true
  }
}
```

**Tips:**
- Power-of-2 is critical for ThreeJS mipmapping
- Use PNG for textures requiring alpha channel
- JPG for diffuse maps without transparency
- WebP for modern browser optimization

## 🔧 Configuration Reference

### TextureSettings

```typescript
interface TextureSettings {
  maxSize?: 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;
  format?: 'png' | 'jpg' | 'jpeg' | 'webp';
  quality?: number; // 1-100
  powerOf2?: boolean;
  maintainAspectRatio?: boolean;
  encoding?: 'base64' | 'base122' | 'none';
}
```

### Default Settings

Applied to all textures without custom configuration:

```json
{
  "defaultSettings": {
    "maxSize": 1024,
    "format": "png",
    "quality": 80,
    "powerOf2": true,
    "maintainAspectRatio": true,
    "encoding": "none"
  }
}
```

### Per-Texture Settings

Override defaults for specific textures:

```json
{
  "textures": [
    {
      "name": "texture-name-without-extension",
      "useDefault": false,
      "maxSize": 512,
      "format": "webp",
      "quality": 85
    }
  ]
}
```

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

## 🛠️ Integration with Vite

Add to your `vite.config.ts`:

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
        outputDir: 'dist/textures',
        textureConfigPath: 'texture-optimize-pro.json'
      });
      await processor.processAll();
    }
  }
});
```

Or use as a pre-build script in `package.json`:

```json
{
  "scripts": {
    "prebuild": "texture-optimizer build",
    "build": "vite build"
  }
}
```

## 📝 Example Project Structure

```
your-game-project/
├── src/
│   └── assets/
│       └── textures/
│           ├── player-sprite.png
│           ├── enemy-goblin.png
│           ├── background-sky.jpg
│           └── ui/
│               └── button.png
├── texture-optimize-pro.json          # Your texture configuration
├── dist/
│   └── textures/          # Optimized output
│       ├── player-sprite.webp
│       ├── enemy-goblin.webp
│       ├── background-sky.jpg
│       └── ui/
│           └── button.png
└── package.json
```

## 🐛 Troubleshooting

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

BSD-3-Clause © Dogukan Kaan Bozkurt

## 🤝 Contributing

Contributions welcome! Please open an issue or PR on GitHub.

## 🔗 Links

- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [Luna Labs Optimization Guide](https://docs.lunalabs.io/docs/playable/optimise-your-builds/optimising-assets/optimising-textures)
- [PixiJS Performance Tips](https://pixijs.com/guides/concepts/performance-tips)
- [ThreeJS Textures](https://threejs.org/docs/#api/en/textures/Texture)