const fs = require('fs');
const path = require('path');

/**
 * Configuration Manager - handles loading and merging configurations
 */
class ConfigManager {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.configFile = path.join(this.projectRoot, '.self-serve-review.json');
    this.packageFile = path.join(this.projectRoot, 'package.json');
    
    this.config = null;
    this.loaded = false;
  }

  /**
   * Load configuration with inheritance and merging
   */
  async loadConfig() {
    if (this.loaded) {
      return this.config;
    }

    // Start with default configuration
    let config = this.getDefaultConfig();

    // Load and merge project configuration
    const projectConfig = this.loadProjectConfig();
    config = this.mergeConfigs(config, projectConfig);

    // Load and merge template configuration if specified
    if (config.extends) {
      const templateConfig = await this.loadTemplateConfig(config.extends);
      config = this.mergeConfigs(templateConfig, config); // Project config overrides template
    }

    // Load package.json configuration
    const packageConfig = this.loadPackageConfig();
    config = this.mergeConfigs(config, packageConfig);

    this.config = config;
    this.loaded = true;

    return config;
  }

  /**
   * Get default configuration
   */
  getDefaultConfig() {
    return {
      extends: null,
      rules: [],
      analyzers: ['eslint', 'typescript', 'security', 'tests', 'complexity', 'bug-detection', 'test-cases'],
      reporters: ['html'],
      ignore: [
        'node_modules/',
        'dist/',
        'build/',
        'coverage/',
        '.git/',
        '*.min.js'
      ],
      severity: 'warning',
      outputDir: './reports',
      aiIntegration: {
        enabled: true,
        generatePrompts: true
      },
      thresholds: {
        eslint: {
          maxErrors: 0,
          maxWarnings: 10
        },
        typescript: {
          maxErrors: 0
        },
        security: {
          maxVulnerabilities: 0
        },
        tests: {
          minCoverage: 70
        },
        complexity: {
          minScore: 80
        }
      }
    };
  }

  /**
   * Load project-specific configuration
   */
  loadProjectConfig() {
    if (fs.existsSync(this.configFile)) {
      try {
        const content = fs.readFileSync(this.configFile, 'utf8');
        return JSON.parse(content);
      } catch (error) {
        console.warn(`⚠️  Could not parse ${this.configFile}: ${error.message}`);
        return {};
      }
    }
    return {};
  }

  /**
   * Load template configuration
   */
  async loadTemplateConfig(templateName) {
    try {
      // First try to load from local templates directory
      const localTemplatePath = path.join(__dirname, '../templates', templateName, 'config.json');
      if (fs.existsSync(localTemplatePath)) {
        const content = fs.readFileSync(localTemplatePath, 'utf8');
        return JSON.parse(content);
      }

      // Try to load from installed package templates
      const packageTemplatePath = path.join(__dirname, '../templates', templateName, 'rules.json');
      if (fs.existsSync(packageTemplatePath)) {
        const content = fs.readFileSync(packageTemplatePath, 'utf8');
        const templateRules = JSON.parse(content);
        
        // Convert rules format to config format
        return {
          rules: templateRules.rules || [],
          categories: templateRules.categories || {},
          analyzers: templateRules.analyzers || ['eslint', 'typescript', 'security', 'tests'],
          reporters: templateRules.reporters || ['html', 'json', 'ai-prompts']
        };
      }

      console.warn(`⚠️  Template '${templateName}' not found`);
      return {};
    } catch (error) {
      console.warn(`⚠️  Could not load template '${templateName}': ${error.message}`);
      return {};
    }
  }

  /**
   * Load configuration from package.json
   */
  loadPackageConfig() {
    if (fs.existsSync(this.packageFile)) {
      try {
        const content = fs.readFileSync(this.packageFile, 'utf8');
        const pkg = JSON.parse(content);
        
        // Look for self-serve-review configuration in package.json
        if (pkg['self-serve-review']) {
          return pkg['self-serve-review'];
        }
      } catch (error) {
        console.warn(`⚠️  Could not parse package.json: ${error.message}`);
      }
    }
    return {};
  }

  /**
   * Deep merge configuration objects
   */
  mergeConfigs(base, override) {
    const result = { ...base };

    Object.keys(override).forEach(key => {
      if (override[key] === null || override[key] === undefined) {
        return;
      }

      if (Array.isArray(override[key])) {
        // For arrays, concatenate and remove duplicates
        if (key === 'rules') {
          result[key] = [...(base[key] || []), ...override[key]];
        } else {
          result[key] = [...new Set([...(base[key] || []), ...override[key]])];
        }
      } else if (typeof override[key] === 'object' && !Array.isArray(override[key])) {
        // For objects, recursively merge
        result[key] = this.mergeConfigs(base[key] || {}, override[key]);
      } else {
        // For primitives, override wins
        result[key] = override[key];
      }
    });

    return result;
  }

  /**
   * Get current configuration
   */
  getConfig() {
    if (!this.loaded) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    return this.config;
  }

  /**
   * Get rules configuration
   */
  getRules() {
    if (!this.loaded) {
      return {
        rules: [],
        categories: {},
        customPrompts: {}
      };
    }
    
    const config = this.getConfig();
    return {
      rules: config.rules || [],
      categories: config.categories || {},
      customPrompts: config.customPrompts || {}
    };
  }

  /**
   * Get enabled analyzers
   */
  getEnabledAnalyzers() {
    const config = this.getConfig();
    return config.analyzers || ['eslint', 'typescript', 'security', 'tests'];
  }

  /**
   * Get enabled reporters
   */
  getEnabledReporters() {
    const config = this.getConfig();
    return config.reporters || ['html', 'json'];
  }

  /**
   * Get output directory
   */
  getOutputDir() {
    const config = this.getConfig();
    const outputDir = config.outputDir || './reports';
    
    // Ensure output directory exists
    const fullPath = path.resolve(this.projectRoot, outputDir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    return fullPath;
  }

  /**
   * Get ignore patterns
   */
  getIgnorePatterns() {
    const config = this.getConfig();
    return config.ignore || [];
  }

  /**
   * Get quality thresholds
   */
  getThresholds() {
    const config = this.getConfig();
    return config.thresholds || {};
  }

  /**
   * Check if AI integration is enabled
   */
  isAIEnabled() {
    const config = this.getConfig();
    return config.aiIntegration?.enabled !== false;
  }

  /**
   * Should generate AI prompts
   */
  shouldGenerateAIPrompts() {
    const config = this.getConfig();
    return config.aiIntegration?.generatePrompts !== false;
  }

  /**
   * Get minimum severity level
   */
  getMinSeverity() {
    const config = this.getConfig();
    return config.severity || 'warning';
  }

  /**
   * Save current configuration to file
   */
  saveConfig(configToSave = null) {
    const config = configToSave || this.config;
    if (!config) {
      throw new Error('No configuration to save');
    }

    try {
      // Remove computed/runtime properties before saving
      const cleanConfig = { ...config };
      delete cleanConfig.projectRoot;
      delete cleanConfig.loaded;

      fs.writeFileSync(this.configFile, JSON.stringify(cleanConfig, null, 2));
      return true;
    } catch (error) {
      throw new Error(`Failed to save configuration: ${error.message}`);
    }
  }

  /**
   * Initialize project with template
   */
  async initializeWithTemplate(templateName) {
    const templateConfig = await this.loadTemplateConfig(templateName);
    
    // Create initial configuration
    const initialConfig = {
      extends: templateName,
      ...templateConfig,
      // Add some project-specific defaults
      outputDir: './reports',
      ignore: [
        ...this.getDefaultConfig().ignore,
        ...(templateConfig.ignore || [])
      ]
    };

    // Save to project
    this.config = initialConfig;
    this.loaded = true;
    this.saveConfig();

    return initialConfig;
  }

  /**
   * Update configuration
   */
  updateConfig(updates) {
    if (!this.loaded) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }

    this.config = this.mergeConfigs(this.config, updates);
    return this.config;
  }

  /**
   * Validate configuration
   */
  validateConfig() {
    const config = this.getConfig();
    const errors = [];
    const warnings = [];

    // Validate analyzers
    const validAnalyzers = ['eslint', 'typescript', 'security', 'tests', 'complexity', 'custom-rules'];
    const invalidAnalyzers = (config.analyzers || []).filter(a => !validAnalyzers.includes(a));
    if (invalidAnalyzers.length > 0) {
      warnings.push(`Unknown analyzers: ${invalidAnalyzers.join(', ')}`);
    }

    // Validate reporters
    const validReporters = ['html', 'json', 'markdown', 'ai-prompts'];
    const invalidReporters = (config.reporters || []).filter(r => !validReporters.includes(r));
    if (invalidReporters.length > 0) {
      warnings.push(`Unknown reporters: ${invalidReporters.join(', ')}`);
    }

    // Validate severity
    const validSeverities = ['info', 'warning', 'error', 'critical'];
    if (config.severity && !validSeverities.includes(config.severity)) {
      errors.push(`Invalid severity level: ${config.severity}`);
    }

    // Validate output directory
    if (config.outputDir) {
      try {
        const fullPath = path.resolve(this.projectRoot, config.outputDir);
        if (!fs.existsSync(path.dirname(fullPath))) {
          warnings.push(`Output directory parent does not exist: ${config.outputDir}`);
        }
      } catch (error) {
        errors.push(`Invalid output directory: ${config.outputDir}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get configuration summary
   */
  getSummary() {
    const config = this.getConfig();
    
    return {
      template: config.extends || 'none',
      analyzers: config.analyzers?.length || 0,
      reporters: config.reporters?.length || 0,
      rules: config.rules?.length || 0,
      outputDir: config.outputDir || './reports',
      aiEnabled: this.isAIEnabled(),
      severity: config.severity || 'warning'
    };
  }
}

module.exports = ConfigManager;
