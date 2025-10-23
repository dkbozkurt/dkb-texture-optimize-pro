import sharp from 'sharp'; // Sharp is the main dependency!
import fs from 'fs/promises';
import path from 'path';
import type { TextureSettings } from './texture-config';

export interface OptimizationResult {
    success: boolean;
    inputPath: string;
    outputPath?: string;
    originalSize: { width: number; height: number; bytes: number };
    optimizedSize: { width: number; height: number; bytes: number };
    reductionPercent: number;
    settings: TextureSettings;
    processingTime: number;
    error?: string;
}

/**
 * TextureOptimizer uses Sharp to process and optimize textures
 * Handles resizing, compression, and format conversion
 */
export class TextureOptimizer {
    constructor(private settings: TextureSettings) { }

    /**
     * Optimize a single texture using Sharp
     * Applies maxSize constraint, power-of-2 resizing, and compression
     */
    async optimize(inputPath: string, outputPath: string): Promise<OptimizationResult> {
        const startTime = Date.now();

        try {
            // Read original file
            const originalBuffer = await fs.readFile(inputPath);
            const metadata = await sharp(originalBuffer).metadata();

            const originalSize = {
                width: metadata.width!,
                height: metadata.height!,
                bytes: originalBuffer.length
            };

            // Calculate target dimensions based on maxSize setting
            const targetDims = this.calculateTargetDimensions(
                originalSize.width,
                originalSize.height,
                this.settings.maxSize!
            );

            // Create Sharp processing pipeline
            let pipeline = sharp(originalBuffer)
                .resize(targetDims.width, targetDims.height, {
                    fit: this.settings.maintainAspectRatio ? 'inside' : 'fill',
                    kernel: sharp.kernel.lanczos3, // Best quality resizing algorithm
                    withoutEnlargement: true // Never upscale beyond original
                });

            // Apply format-specific compression
            pipeline = this.applyCompression(pipeline);

            // Generate output buffer
            const outputBuffer = await pipeline.toBuffer();

            // Write optimized texture to disk
            await fs.mkdir(path.dirname(outputPath), { recursive: true });
            await fs.writeFile(outputPath, outputBuffer);

            const processingTime = Date.now() - startTime;
            const reductionPercent = ((originalSize.bytes - outputBuffer.length) / originalSize.bytes) * 100;

            return {
                success: true,
                inputPath,
                outputPath,
                originalSize,
                optimizedSize: {
                    width: targetDims.width,
                    height: targetDims.height,
                    bytes: outputBuffer.length
                },
                reductionPercent,
                settings: this.settings,
                processingTime
            };

        } catch (error) {
            return {
                success: false,
                inputPath,
                originalSize: { width: 0, height: 0, bytes: 0 },
                optimizedSize: { width: 0, height: 0, bytes: 0 },
                reductionPercent: 0,
                settings: this.settings,
                processingTime: Date.now() - startTime,
                error: (error as Error).message
            };
        }
    }

    /**
     * Calculate target dimensions based on maxSize and power-of-2 settings
     * Luna Labs recommendation: Never exceed 1024x1024 for playable ads
     */
    private calculateTargetDimensions(
        width: number,
        height: number,
        maxSize: number
    ): { width: number; height: number } {

        if (!this.settings.powerOf2) {
            // Simple max dimension constraint without power-of-2
            const scale = Math.min(1, maxSize / Math.max(width, height));
            return {
                width: Math.round(width * scale),
                height: Math.round(height * scale)
            };
        }

        // Power-of-2 calculation for WebGL compatibility
        const toPowerOf2 = (val: number): number => {
            return Math.pow(2, Math.floor(Math.log2(val)));
        };

        let targetWidth = toPowerOf2(width);
        let targetHeight = toPowerOf2(height);

        // Apply maxSize constraint to each dimension
        targetWidth = Math.min(targetWidth, maxSize);
        targetHeight = Math.min(targetHeight, maxSize);

        // Ensure we don't exceed maxSize on either dimension
        if (targetWidth > maxSize || targetHeight > maxSize) {
            const aspectRatio = width / height;
            if (width > height) {
                targetWidth = maxSize;
                targetHeight = toPowerOf2(maxSize / aspectRatio);
            } else {
                targetHeight = maxSize;
                targetWidth = toPowerOf2(maxSize * aspectRatio);
            }
        }

        // Clamp to valid range
        targetWidth = Math.max(64, Math.min(targetWidth, maxSize));
        targetHeight = Math.max(64, Math.min(targetHeight, maxSize));

        return { width: targetWidth, height: targetHeight };
    }

    /**
     * Apply format-specific compression using Sharp
     * Different formats require different optimization strategies
     */
    private applyCompression(pipeline: sharp.Sharp): sharp.Sharp {
        switch (this.settings.format) {
            case 'jpeg':
            case 'jpg':
                return pipeline.jpeg({
                    quality: this.settings.quality,
                    mozjpeg: true, // Use mozjpeg for better compression
                    progressive: true
                });

            case 'png':
                return pipeline.png({
                    quality: this.settings.quality,
                    compressionLevel: 9, // Maximum compression
                    effort: 7 // High effort for better results
                });

            case 'webp':
                return pipeline.webp({
                    quality: this.settings.quality,
                    effort: 6 // Good balance of speed and quality
                });

            default:
                return pipeline;
        }
    }
}