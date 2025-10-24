#!/usr/bin/env node

import { Command } from 'commander';
import { BatchProcessor } from '../core/batch-processor.js';
import path from 'path';
import chalk from 'chalk';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

program
    .name('texture-optimizer')
    .description('Optimize textures for HTML5 games with per-texture configuration')
    .version('1.0.0');

program
    .command('build')
    .description('Process and optimize textures based on texture-optimize-pro.json configuration')
    .option('-c, --config <path>', 'Path to texture-optimize-pro.json config file', 'texture-optimize-pro.json')
    .option('-b, --base-path <path>', 'Base path for input textures', 'src/assets/textures')
    .option('-o, --output <path>', 'Output directory (if not specified, optimizes in-place and backs up originals to _originalTexture folder)')
    .option('--concurrency <number>', 'Number of concurrent operations', '10')
    .option('--verbose', 'Verbose logging', false)
    .action(async (options) => {
        console.log(chalk.bold.cyan('\n🎨 Texture Optimizer for HTML5 Games\n'));

        try {
            // Resolve paths
            const configPath = path.resolve(options.config);
            const basePath = path.resolve(options.basePath);
            const outputPath = options.output ? path.resolve(options.output) : undefined;
            const inPlaceMode = !outputPath;

            // Check if config exists
            try {
                await fs.access(configPath);
            } catch {
                console.error(chalk.red(`❌ Configuration file not found: ${configPath}`));
                console.log(chalk.yellow('\n💡 Run "texture-optimizer init" to create a sample configuration file'));
                process.exit(1);
            }

            // Check if base path exists
            try {
                await fs.access(basePath);
            } catch {
                console.error(chalk.red(`❌ Base path not found: ${basePath}`));
                process.exit(1);
            }

            console.log(chalk.gray(`Config: ${configPath}`));
            console.log(chalk.gray(`Input:  ${basePath}`));
            
            if (inPlaceMode) {
                console.log(chalk.yellow(`Mode:   In-place optimization (originals → _originalTexture)`));
            } else {
                console.log(chalk.gray(`Output: ${outputPath}`));
            }
            console.log();

            // Create batch processor
            const processor = new BatchProcessor({
                basePath,
                outputDir: outputPath,
                textureConfigPath: configPath,
                concurrency: parseInt(options.concurrency),
                verbose: options.verbose,
                inPlaceMode
            });

            // Process all textures
            const results = await processor.processAll();

            // Exit with appropriate code
            const failures = results.filter(r => !r.success).length;
            if (failures > 0) {
                process.exit(1);
            }

        } catch (error) {
            console.error(chalk.red(`\n❌ Error: ${(error as Error).message}`));
            process.exit(1);
        }
    });

program
    .command('init')
    .description('Create a sample texture-optimize-pro.json configuration file')
    .argument('[directory]', 'Target directory', '.')
    .action(async (directory) => {
        const configPath = path.join(directory, 'texture-optimize-pro.json');

        // Check if file already exists
        try {
            await fs.access(configPath);
            console.log(chalk.yellow(`⚠️  File already exists: ${configPath}`));
            console.log(chalk.yellow('   Remove it first or use a different directory'));
            process.exit(1);
        } catch {
            // File doesn't exist, proceed
        }

        const template = {
            defaultSettings: {
                maxSize: 512,
                quality: 80
            },
            textures: [
                {
                    name: 'text-sprite-custom',
                    useDefault: false,
                    maxSize: 256,
                    quality: 80
                },
                {
                    name: 'text-sprite-default',
                    useDefault: true
                },
            ]
        };

        await fs.writeFile(configPath, JSON.stringify(template, null, 2));
        console.log(chalk.green(`✓ Created ${configPath}`));
        console.log(chalk.blue('\n📝 Configuration file structure:'));
        console.log(chalk.gray('   - defaultSettings: Applied to all textures without custom settings'));
        console.log(chalk.gray('   - textures: Array of per-texture configurations'));
        console.log(chalk.gray('     - name: Texture filename (without extension)'));
        console.log(chalk.gray('     - useDefault: true = use default settings, false = use custom'));
        console.log(chalk.gray('     - maxSize: Maximum dimension (32, 64, 128, 256, 512, 1024, 2048, 4096)'));
        console.log(chalk.gray('     - quality: Compression quality (1-100)'));
        console.log(chalk.blue('\n💡 Tips:'));
        console.log(chalk.gray('   - `powerOf2` and `maintainAspectRatio` are now always `true`'));
        console.log(chalk.gray('   - Output format now matches the input format (e.g., .png stays .png)'));
        console.log(chalk.gray('   - Example: "player-sprite.png" matches name "player-sprite"'));
        console.log(chalk.blue('\n🚀 Next steps:'));
        console.log(chalk.gray('   1. Edit texture-optimize-pro.json with your texture names and settings'));
        console.log(chalk.gray('\n   2. Add the following script to your ' + chalk.bold('package.json') + ':'));
        console.log(chalk.cyan(`
  "scripts": {
    "optimize": "texture-optimizer build --base-path src/assets/textures --output dist/textures",
    "optimize-inplace": "texture-optimizer build --base-path src/assets/textures"
  }
        `));
        console.log(chalk.gray('\n   3. Run the optimizer:'));
        console.log(chalk.cyan('      npm run optimize          # Output to dist/textures'));
        console.log(chalk.cyan('      npm run optimize-inplace  # Optimize in-place with backup'));
    });

program.parse();