import { glob } from 'glob';
import path from 'path';
import { TextureOptimizer, type OptimizationResult } from './optimizer';
import { TextureConfigManager } from './texture-config';
import chalk from 'chalk';

export interface BatchProcessorOptions {
    basePath: string;
    outputDir: string;
    textureConfigPath: string; // Path to textures.json
    patterns?: string[];
    exclude?: string[];
    concurrency?: number;
    verbose?: boolean;
}

/**
 * BatchProcessor scans directories for textures and processes them
 * based on per-texture configuration from textures.json
 */
export class BatchProcessor {
    private configManager!: TextureConfigManager;
    private options: Required<BatchProcessorOptions>;

    constructor(options: BatchProcessorOptions) {
        this.options = {
            patterns: ['**/*.{png,jpg,jpeg}'],
            exclude: ['**/node_modules/**'],
            concurrency: 10,
            verbose: false,
            ...options
        };
    }

    /**
     * Initialize and process all textures
     * Matches texture filenames to configuration entries
     */
    async processAll(): Promise<OptimizationResult[]> {
        // Load texture configuration from textures.json
        console.log(chalk.blue(`📋 Loading texture configuration from: ${this.options.textureConfigPath}`));
        this.configManager = await TextureConfigManager.loadFromFile(this.options.textureConfigPath);

        const configuredTextures = this.configManager.getConfiguredTextures();
        console.log(chalk.blue(`   Found ${configuredTextures.length} configured textures in config`));

        // Find all texture files in base path
        const files = await this.findTextures();
        console.log(chalk.blue(`📁 Found ${files.length} texture files to process\n`));

        // Process in chunks for memory efficiency (Sharp can use a lot of memory)
        const results: OptimizationResult[] = [];
        const chunkSize = this.options.concurrency;

        for (let i = 0; i < files.length; i += chunkSize) {
            const chunk = files.slice(i, i + chunkSize);
            const chunkResults = await Promise.all(
                chunk.map(filePath => this.processTexture(filePath))
            );

            results.push(...chunkResults);

            if (this.options.verbose) {
                console.log(chalk.gray(`⏳ Progress: ${Math.min(i + chunkSize, files.length)}/${files.length}`));
            }
        }

        this.printSummary(results);
        return results;
    }

    /**
     * Process a single texture based on its name configuration
     * The texture name is matched against entries in textures.json
     */
    private async processTexture(inputPath: string): Promise<OptimizationResult> {
        // Get settings for this specific texture by matching its filename
        // Example: "player-sprite.png" matches config entry with name "player-sprite"
        const settings = this.configManager.getSettingsForTexture(inputPath);

        // Determine output path
        const relativePath = path.relative(this.options.basePath, inputPath);
        const outputName = path.basename(relativePath).replace(
            /\.(png|jpe?g)$/i,
            `.${settings.format}`
        );
        const outputPath = path.join(this.options.outputDir, path.dirname(relativePath), outputName);

        // Create optimizer with texture-specific settings
        const optimizer = new TextureOptimizer(settings);

        // Process using Sharp
        const result = await optimizer.optimize(inputPath, outputPath);

        // Log result with color coding
        if (result.success) {
            const hasCustom = this.configManager.hasCustomSettings(inputPath);
            const configType = hasCustom ? chalk.yellow('[CUSTOM]') : chalk.gray('[DEFAULT]');
            const reduction = result.reductionPercent.toFixed(1);
            const sizeMB = (result.optimizedSize.bytes / 1024 / 1024).toFixed(2);

            console.log(
                `${chalk.green('✓')} ${configType} ${path.basename(inputPath)} → ${outputName} ` +
                `(${reduction}% smaller, ${sizeMB} MB, ${result.optimizedSize.width}x${result.optimizedSize.height}, maxSize: ${settings.maxSize}px)`
            );
        } else {
            console.log(`${chalk.red('✗')} ${path.basename(inputPath)} - ${result.error}`);
        }

        return result;
    }

    /**
     * Find all texture files matching patterns in the base path
     */
    private async findTextures(): Promise<string[]> {
        const allFiles: string[] = [];

        for (const pattern of this.options.patterns) {
            const files = await glob(pattern, {
                cwd: this.options.basePath,
                absolute: true,
                ignore: this.options.exclude
            });
            allFiles.push(...files);
        }

        // Remove duplicates and sort
        return [...new Set(allFiles)].sort();
    }

    /**
     * Print comprehensive processing summary
     */
    private printSummary(results: OptimizationResult[]): void {
        console.log('\n' + chalk.bold.cyan('═'.repeat(50)));
        console.log(chalk.bold.cyan('Processing Summary'));
        console.log(chalk.bold.cyan('═'.repeat(50)));

        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        const withCustomSettings = results.filter(r => r.success && this.configManager.hasCustomSettings(r.inputPath));

        console.log(chalk.green(`✓ Successful: ${successful.length}/${results.length}`));
        console.log(chalk.yellow(`⚙ Custom settings applied: ${withCustomSettings.length}`));
        console.log(chalk.gray(`📋 Default settings used: ${successful.length - withCustomSettings.length}`));

        if (failed.length > 0) {
            console.log(chalk.red(`✗ Failed: ${failed.length}`));
        }

        // Calculate statistics
        const totalOriginalBytes = successful.reduce((sum, r) => sum + r.originalSize.bytes, 0);
        const totalOptimizedBytes = successful.reduce((sum, r) => sum + r.optimizedSize.bytes, 0);
        const totalReduction = ((totalOriginalBytes - totalOptimizedBytes) / totalOriginalBytes) * 100;
        const savedMB = (totalOriginalBytes - totalOptimizedBytes) / 1024 / 1024;
        const avgProcessingTime = successful.reduce((sum, r) => sum + r.processingTime, 0) / successful.length;

        console.log(chalk.bold('\n📊 Size Statistics:'));
        console.log(chalk.blue(`   Original size:  ${(totalOriginalBytes / 1024 / 1024).toFixed(2)} MB`));
        console.log(chalk.blue(`   Optimized size: ${(totalOptimizedBytes / 1024 / 1024).toFixed(2)} MB`));
        console.log(chalk.green(`   💾 Saved: ${savedMB.toFixed(2)} MB (${totalReduction.toFixed(1)}% reduction)`));
        console.log(chalk.gray(`   ⚡ Avg processing time: ${avgProcessingTime.toFixed(0)}ms per texture`));

        // Per-format breakdown
        const formatStats = new Map<string, { count: number; bytes: number }>();
        for (const result of successful) {
            const format = result.settings.format!;
            const existing = formatStats.get(format) || { count: 0, bytes: 0 };
            formatStats.set(format, {
                count: existing.count + 1,
                bytes: existing.bytes + result.optimizedSize.bytes
            });
        }

        console.log(chalk.bold('\n📦 Format Breakdown:'));
        for (const [format, stats] of formatStats) {
            const sizeMB = (stats.bytes / 1024 / 1024).toFixed(2);
            console.log(`   ${format.toUpperCase()}: ${stats.count} files (${sizeMB} MB)`);
        }

        // MaxSize distribution
        const sizeDistribution = new Map<number, number>();
        for (const result of successful) {
            const maxSize = result.settings.maxSize!;
            sizeDistribution.set(maxSize, (sizeDistribution.get(maxSize) || 0) + 1);
        }

        console.log(chalk.bold('\n📏 MaxSize Distribution:'));
        const sortedSizes = Array.from(sizeDistribution.entries()).sort((a, b) => a[0] - b[0]);
        for (const [size, count] of sortedSizes) {
            console.log(`   ${size}px: ${count} textures`);
        }

        console.log(chalk.bold.cyan('\n' + '═'.repeat(50) + '\n'));
    }
}