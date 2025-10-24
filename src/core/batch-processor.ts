import { glob } from 'glob';
import path from 'path';
import { TextureOptimizer, type OptimizationResult, type OptimizerSettings } from './optimizer';
import { TextureConfigManager } from './texture-config';
import chalk from 'chalk';
import fs from 'fs/promises';

export interface BatchProcessorOptions {
    basePath: string;
    outputDir?: string;
    textureConfigPath: string; // Path to texture-optimize-pro.json
    patterns?: string[];
    exclude?: string[];
    concurrency?: number;
    verbose?: boolean;
    inPlaceMode?: boolean; // New option for in-place optimization
}

// Supported formats
const SUPPORTED_FORMATS = ['png', 'jpg', 'jpeg', 'webp'];
type SupportedFormat = 'png' | 'jpg' | 'webp';

/**
 * BatchProcessor scans directories for textures and processes them
 * based on per-texture configuration from textures.json
 */
export class BatchProcessor {
    private configManager!: TextureConfigManager;
    private options: Required<Omit<BatchProcessorOptions, 'outputDir' | 'inPlaceMode'>> & {
        outputDir?: string;
        inPlaceMode: boolean;
    };

    constructor(options: BatchProcessorOptions) {
        this.options = {
            patterns: [`**/*.{${SUPPORTED_FORMATS.join(',')}}`], // Use supported formats
            exclude: ['**/node_modules/**', '**/_originalTexture/**'], // Exclude backup folder
            concurrency: 10,
            verbose: false,
            inPlaceMode: !options.outputDir,
            ...options
        };
    }

    /**
     * Initialize and process all textures
     * Matches texture filenames to configuration entries
     */
    async processAll(): Promise<OptimizationResult[]> {
        // Load texture configuration from texture-optimize-pro.json
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
 * The texture name is matched against entries in texture-optimize-pro.json
 */
    private async processTexture(inputPath: string): Promise<OptimizationResult> {
        // Get settings for this specific texture by matching its filename
        const settings = this.configManager.getSettingsForTexture(inputPath);

        // Auto-detect format from input file extension
        let ext = path.extname(inputPath).substring(1).toLowerCase();
        if (ext === 'jpeg') {
            ext = 'jpg';
        }
        const format = ext as SupportedFormat;

        // Combine config settings with auto-detected format
        const optimizerSettings: OptimizerSettings = {
            ...settings,
            format: format,
            quality: settings.quality ?? 80,
            maxSize: settings.maxSize ?? 512,
        };

        // Determine source, output path, and backup path based on mode
        let sourcePath: string;
        let outputPath: string;
        let backupPath: string | undefined;
        let isReoptimization = false;

        if (this.options.inPlaceMode) {
            const inputDir = path.dirname(inputPath);
            const inputFilename = path.basename(inputPath);
            const backupDir = path.join(inputDir, '_originalTexture');

            backupPath = path.join(backupDir, inputFilename);
            outputPath = inputPath;

            // Check if backup already exists
            try {
                await fs.access(backupPath);
                // Backup exists, use it as source (re-optimization scenario)
                sourcePath = backupPath;
                isReoptimization = true;

                if (this.options.verbose) {
                    console.log(chalk.gray(`   📦 Using original from backup: ${path.basename(backupPath)}`));
                }
            } catch {
                // Backup doesn't exist - BACKUP FIRST, then use current as source
                sourcePath = inputPath;
                // Create backup BEFORE optimization
                await this.backupOriginal(inputPath, backupPath);
            }
        } else {
            // Normal mode: output to specified directory
            const relativePath = path.relative(this.options.basePath, inputPath);
            const outputName = path.basename(relativePath);
            outputPath = path.join(this.options.outputDir!, path.dirname(relativePath), outputName);

            // Check if there's a backup in the source location
            const inputDir = path.dirname(inputPath);
            const inputFilename = path.basename(inputPath);
            const potentialBackupPath = path.join(inputDir, '_originalTexture', inputFilename);

            try {
                await fs.access(potentialBackupPath);
                sourcePath = potentialBackupPath;
                isReoptimization = true;

                if (this.options.verbose) {
                    console.log(chalk.gray(`   📦 Using original from backup: ${path.basename(potentialBackupPath)}`));
                }
            } catch {
                sourcePath = inputPath;
            }
        }

        // Create optimizer with texture-specific settings
        const optimizer = new TextureOptimizer(optimizerSettings);

        try {
            // Process using Sharp (from sourcePath, not inputPath)
            const result = await optimizer.optimize(sourcePath, outputPath);

            // Log result with color coding
            if (result.success) {
                const hasCustom = this.configManager.hasCustomSettings(inputPath);
                const configType = hasCustom ? chalk.yellow('[CUSTOM]') : chalk.gray('[DEFAULT]');
                const reduction = result.reductionPercent.toFixed(1);
                const sizeMB = (result.optimizedSize.bytes / 1024 / 1024).toFixed(2);
                const mode = this.options.inPlaceMode ? chalk.cyan('[IN-PLACE]') : '';
                const reoptimizationTag = isReoptimization ? chalk.magenta('[RE-OPT]') : '';

                console.log(
                    `${chalk.green('✓')} ${mode} ${reoptimizationTag} ${configType} ${path.basename(inputPath)} → ${path.basename(outputPath)} ` +
                    `(${reduction}% smaller, ${sizeMB} MB, ${result.optimizedSize.width}x${result.optimizedSize.height}, maxSize: ${optimizerSettings.maxSize}px)`
                );
            } else {
                console.log(`${chalk.red('✗')} ${path.basename(inputPath)} - ${result.error}`);
            }

            return result;
        } catch (error) {
            console.log(`${chalk.red('✗')} ${path.basename(inputPath)} - ${(error as Error).message}`);
            throw error;
        }
    }

    /**
     * Backup original texture to _originalTexture folder
     */
    private async backupOriginal(originalPath: string, backupPath: string): Promise<void> {
        try {
            // Create backup directory if it doesn't exist
            await fs.mkdir(path.dirname(backupPath), { recursive: true });

            // Copy original to backup location
            await fs.copyFile(originalPath, backupPath);

            if (this.options.verbose) {
                console.log(chalk.gray(`   📦 Backed up: ${path.basename(originalPath)} → _originalTexture/`));
            }
        } catch (error) {
            console.error(chalk.red(`   ⚠️  Failed to backup ${path.basename(originalPath)}: ${(error as Error).message}`));
            throw error;
        }
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

        if (this.options.inPlaceMode) {
            console.log(chalk.cyan(`📦 Originals backed up to: _originalTexture/ folders`));
        }

        if (failed.length > 0) {
            console.log(chalk.red(`✗ Failed: ${failed.length}`));
        }

        // Calculate statistics
        const totalOriginalBytes = successful.reduce((sum, r) => sum + r.originalSize.bytes, 0);
        const totalOptimizedBytes = successful.reduce((sum, r) => sum + r.optimizedSize.bytes, 0);

        // Avoid division by zero if totalOriginalBytes is 0
        const totalReduction = totalOriginalBytes > 0
            ? ((totalOriginalBytes - totalOptimizedBytes) / totalOriginalBytes) * 100
            : 0;

        const savedMB = (totalOriginalBytes - totalOptimizedBytes) / 1024 / 1024;

        // Avoid division by zero if successful.length is 0
        const avgProcessingTime = successful.length > 0
            ? successful.reduce((sum, r) => sum + r.processingTime, 0) / successful.length
            : 0;

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