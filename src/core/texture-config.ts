import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';

// Zod schema for validation
const textureSettingsSchema = z.object({
    maxSize: z.union([z.literal(32), z.literal(64), z.literal(128), z.literal(256), z.literal(512), z.literal(1024), z.literal(2048), z.literal(4096)]).optional(),
    quality: z.number().min(1).max(100).optional(),
});

const textureEntrySchema = z.object({
    name: z.string(),
    useDefault: z.boolean(),
    maxSize: z.union([z.literal(32), z.literal(64), z.literal(128), z.literal(256), z.literal(512), z.literal(1024), z.literal(2048), z.literal(4096)]).optional(),
    quality: z.number().min(1).max(100).optional(),
});

const textureConfigSchema = z.object({
    defaultSettings: textureSettingsSchema,
    textures: z.array(textureEntrySchema)
});

export type TextureSettings = z.infer<typeof textureSettingsSchema>;
export type TextureEntry = z.infer<typeof textureEntrySchema>;
export type TextureConfig = z.infer<typeof textureConfigSchema>;

/**
 * Manages per-texture configuration based on texture names
 * Loads settings from texture-optimize-pro.json and matches by filename
 */
export class TextureConfigManager {
    private config: TextureConfig;
    private textureMap: Map<string, TextureEntry>;

    constructor(config: TextureConfig) {
        this.config = config;
        this.textureMap = new Map();

        // Build lookup map for fast access by texture name
        for (const texture of config.textures) {
            this.textureMap.set(texture.name.toLowerCase(), texture);
        }
    }

    /**
     * Load texture configuration from JSON file
     */
    static async loadFromFile(configPath: string): Promise<TextureConfigManager> {
        try {
            const content = await fs.readFile(configPath, 'utf-8');
            const rawConfig = JSON.parse(content);
            const config = textureConfigSchema.parse(rawConfig);
            return new TextureConfigManager(config);
        } catch (error) {
            throw new Error(`Failed to load texture config from ${configPath}: ${(error as Error).message}`);
        }
    }

    /**
     * Get settings for a specific texture by matching its filename
     * Example: "player-sprite.png" matches texture name "player-sprite"
     */
    getSettingsForTexture(texturePath: string): TextureSettings {
        // Extract filename without extension
        const basename = path.basename(texturePath, path.extname(texturePath));
        const normalizedName = basename.toLowerCase();

        // Try exact match
        const textureEntry = this.textureMap.get(normalizedName);

        if (!textureEntry) {
            // No specific config found, use defaults
            return { ...this.config.defaultSettings };
        }

        if (textureEntry.useDefault) {
            // Texture is configured but set to use default settings
            return { ...this.config.defaultSettings };
        }

        // Merge texture-specific settings with defaults (texture settings override defaults)
        return {
            maxSize: textureEntry.maxSize ?? this.config.defaultSettings.maxSize,
            quality: textureEntry.quality ?? this.config.defaultSettings.quality,
        };
    }

    /**
     * Check if a texture has custom settings (not using defaults)
     */
    hasCustomSettings(texturePath: string): boolean {
        const basename = path.basename(texturePath, path.extname(texturePath));
        const normalizedName = basename.toLowerCase();
        const entry = this.textureMap.get(normalizedName);
        return entry !== undefined && !entry.useDefault;
    }

    /**
     * Get all texture names that have configurations
     */
    getConfiguredTextures(): string[] {
        return Array.from(this.textureMap.keys());
    }

    /**
     * Get default settings
     */
    getDefaultSettings(): TextureSettings {
        return { ...this.config.defaultSettings };
    }
}