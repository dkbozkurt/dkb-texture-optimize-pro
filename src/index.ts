// Main library exports
export { TextureOptimizer } from './core/optimizer.js';
export type { OptimizationResult } from './core/optimizer.js';

export { TextureConfigManager } from './core/texture-config.js';
export type { TextureSettings, TextureEntry, TextureConfig } from './core/texture-config.js';

export { BatchProcessor } from './core/batch-processor.js';
export type { BatchProcessorOptions } from './core/batch-processor.js';

// Re-export for convenience
export * from './core/optimizer.js';
export * from './core/texture-config.js';
export * from './core/batch-processor.js';