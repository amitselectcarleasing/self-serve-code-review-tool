const fs = require('fs');
const path = require('path');

/**
 * Template Manager - handles template loading, creation, and project initialization
 */
class TemplateManager {
  constructor() {
    this.templatesDir = path.join(__dirname, '../templates');
  }

  /**
   * List all available templates
   */
  listTemplates() {
    try {
      if (!fs.existsSync(this.templatesDir)) {
        return [];
      }

      return fs.readdirSync(this.templatesDir)
        .filter(item => {
          const itemPath = path.join(this.templatesDir, item);
          return fs.statSync(itemPath).isDirectory();
        })
        .map(templateName => {
          const templateInfo = this.getTemplateInfo(templateName);
          return {
            name: templateName,
            ...templateInfo
          };
        });
    } catch (error) {
      console.warn(`⚠️  Could not list templates: ${error.message}`);
      return [];
    }
  }

  /**
   * Get template information
   */
  getTemplateInfo(templateName) {
    try {
      const templateDir = path.join(this.templatesDir, templateName);
      
      // Try to load template metadata
      const metadataPath = path.join(templateDir, 'template.json');
      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        return metadata;
      }

      // Fallback to rules.json for basic info
      const rulesPath = path.join(templateDir, 'rules.json');
      if (fs.existsSync(rulesPath)) {
        const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
        return {
          description: rules.metadata?.description || `Template for ${templateName} services`,
          version: rules.metadata?.version || '1.0.0',
          author: rules.metadata?.author || 'Self-Serve Platform Team',
          rules: rules.rules?.length || 0,
          categories: Object.keys(rules.categories || {}).length
        };
      }

      return {
        description: `Template for ${templateName} services`,
        version: '1.0.0',
        rules: 0,
        categories: 0
      };
    } catch (error) {
      return {
        description: `Template for ${templateName} services`,
        version: '1.0.0',
        error: error.message
      };
    }
  }

  /**
   * Get complete template configuration
   */
  getTemplate(templateName) {
    try {
      const templateDir = path.join(this.templatesDir, templateName);
      
      if (!fs.existsSync(templateDir)) {
        throw new Error(`Template '${templateName}' not found`);
      }

      const template = {
        name: templateName,
        path: templateDir,
        info: this.getTemplateInfo(templateName)
      };

      // Load rules if they exist
      const rulesPath = path.join(templateDir, 'rules.json');
      if (fs.existsSync(rulesPath)) {
        template.rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
      }

      // Load configuration if it exists
      const configPath = path.join(templateDir, 'config.json');
      if (fs.existsSync(configPath)) {
        template.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }

      // Load package.json template if it exists
      const packageTemplatePath = path.join(templateDir, 'package.template.json');
      if (fs.existsSync(packageTemplatePath)) {
        template.packageTemplate = JSON.parse(fs.readFileSync(packageTemplatePath, 'utf8'));
      }

      return template;
    } catch (error) {
      throw new Error(`Failed to load template '${templateName}': ${error.message}`);
    }
  }

  /**
   * Initialize project with template
   */
  async initializeProject(templateName, targetDir, options = {}) {
    console.log(`🚀 Initializing project with ${templateName} template...`);
    
    try {
      const template = this.getTemplate(templateName);
      const configDir = path.join(targetDir, '.self-serve-review');
      
      // Create configuration directory
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      // Copy template files
      await this.copyTemplateFiles(template, configDir);

      // Create main configuration file
      await this.createProjectConfig(template, targetDir, options);

      // Update package.json if it exists
      await this.updatePackageJson(template, targetDir);

      // Create reports directory
      const reportsDir = path.join(targetDir, 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      console.log('✅ Project initialized successfully!');
      
      return {
        success: true,
        template: templateName,
        configDir,
        files: this.getCreatedFiles(template, targetDir)
      };
    } catch (error) {
      console.error('❌ Initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Copy template files to project
   */
  async copyTemplateFiles(template, configDir) {
    const templateDir = template.path;
    
    // Copy rules.json if it exists
    if (template.rules) {
      const rulesPath = path.join(configDir, 'rules.json');
      fs.writeFileSync(rulesPath, JSON.stringify(template.rules, null, 2));
    }

    // Copy any additional template files
    const templateFiles = fs.readdirSync(templateDir);
    
    for (const file of templateFiles) {
      const sourcePath = path.join(templateDir, file);
      const stat = fs.statSync(sourcePath);
      
      if (stat.isFile() && !file.startsWith('.') && file !== 'template.json') {
        const targetPath = path.join(configDir, file);
        fs.copyFileSync(sourcePath, targetPath);
      }
    }
  }

  /**
   * Create main project configuration
   */
  async createProjectConfig(template, targetDir, options) {
    const configPath = path.join(targetDir, '.self-serve-review.json');
    
    // Don't overwrite existing configuration unless forced
    if (fs.existsSync(configPath) && !options.force) {
      console.log('⚠️  Configuration file already exists, skipping...');
      return;
    }

    const config = {
      extends: template.name,
      version: '1.0.0',
      created: new Date().toISOString(),
      
      // Default configuration
      analyzers: ['eslint', 'typescript', 'security', 'tests', 'complexity'],
      reporters: ['html', 'json', 'ai-prompts'],
      outputDir: './reports',
      
      // Merge template configuration
      ...(template.config || {}),
      
      // Override with user options
      ...options.config
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  /**
   * Update package.json with scripts and dependencies
   */
  async updatePackageJson(template, targetDir) {
    const packagePath = path.join(targetDir, 'package.json');
    
    if (!fs.existsSync(packagePath)) {
      console.log('⚠️  No package.json found, skipping package.json updates');
      return;
    }

    try {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // Add scripts
      pkg.scripts = pkg.scripts || {};
      
      const scriptsToAdd = {
        'code-review': 'self-serve-review analyze',
        'code-review:ai': 'self-serve-review analyze --ai-prompts',
        'code-review:security': 'self-serve-review analyze --analyzers=security',
        'code-review:watch': 'self-serve-review analyze --watch',
        'setup-review': 'self-serve-review init'
      };

      // Only add scripts that don't already exist
      Object.entries(scriptsToAdd).forEach(([script, command]) => {
        if (!pkg.scripts[script]) {
          pkg.scripts[script] = command;
        }
      });

      // Add dev dependency if not already present
      pkg.devDependencies = pkg.devDependencies || {};
      if (!pkg.devDependencies['@self-serve/code-review-tool']) {
        pkg.devDependencies['@self-serve/code-review-tool'] = '^1.0.0';
      }

      // Merge template package.json if it exists
      if (template.packageTemplate) {
        // Merge dependencies
        if (template.packageTemplate.devDependencies) {
          Object.assign(pkg.devDependencies, template.packageTemplate.devDependencies);
        }
        
        // Merge scripts (template scripts don't override existing ones)
        if (template.packageTemplate.scripts) {
          Object.entries(template.packageTemplate.scripts).forEach(([script, command]) => {
            if (!pkg.scripts[script]) {
              pkg.scripts[script] = command;
            }
          });
        }
      }

      fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
      console.log('✅ Updated package.json with code review scripts');
    } catch (error) {
      console.warn(`⚠️  Could not update package.json: ${error.message}`);
    }
  }

  /**
   * Get list of files that would be created
   */
  getCreatedFiles(template, targetDir) {
    const files = [];
    
    files.push('.self-serve-review.json');
    files.push('.self-serve-review/rules.json');
    
    if (template.rules) {
      files.push('.self-serve-review/rules.json');
    }
    
    if (fs.existsSync(path.join(targetDir, 'package.json'))) {
      files.push('package.json (updated)');
    }
    
    files.push('reports/ (directory)');
    
    return files;
  }

  /**
   * Create a new template
   */
  async createTemplate(templateName, config) {
    const templateDir = path.join(this.templatesDir, templateName);
    
    if (fs.existsSync(templateDir)) {
      throw new Error(`Template '${templateName}' already exists`);
    }

    try {
      // Create template directory
      fs.mkdirSync(templateDir, { recursive: true });

      // Create template metadata
      const metadata = {
        name: templateName,
        description: config.description || `Template for ${templateName} services`,
        version: config.version || '1.0.0',
        author: config.author || 'Self-Serve Platform Team',
        created: new Date().toISOString(),
        tags: config.tags || []
      };

      fs.writeFileSync(
        path.join(templateDir, 'template.json'),
        JSON.stringify(metadata, null, 2)
      );

      // Create rules configuration
      const rules = {
        metadata,
        categories: config.categories || {},
        rules: config.rules || [],
        customPrompts: config.customPrompts || {}
      };

      fs.writeFileSync(
        path.join(templateDir, 'rules.json'),
        JSON.stringify(rules, null, 2)
      );

      // Create configuration template
      const configTemplate = {
        analyzers: config.analyzers || ['eslint', 'typescript', 'security', 'tests'],
        reporters: config.reporters || ['html', 'json', 'ai-prompts'],
        thresholds: config.thresholds || {}
      };

      fs.writeFileSync(
        path.join(templateDir, 'config.json'),
        JSON.stringify(configTemplate, null, 2)
      );

      console.log(`✅ Template '${templateName}' created successfully`);
      
      return {
        success: true,
        templateName,
        path: templateDir,
        files: ['template.json', 'rules.json', 'config.json']
      };
    } catch (error) {
      // Clean up on failure
      if (fs.existsSync(templateDir)) {
        fs.rmSync(templateDir, { recursive: true, force: true });
      }
      throw error;
    }
  }

  /**
   * Update existing template
   */
  async updateTemplate(templateName, updates) {
    const templateDir = path.join(this.templatesDir, templateName);
    
    if (!fs.existsSync(templateDir)) {
      throw new Error(`Template '${templateName}' not found`);
    }

    try {
      const template = this.getTemplate(templateName);
      
      // Update metadata
      if (updates.metadata) {
        const metadataPath = path.join(templateDir, 'template.json');
        const currentMetadata = template.info;
        const updatedMetadata = { ...currentMetadata, ...updates.metadata };
        
        fs.writeFileSync(metadataPath, JSON.stringify(updatedMetadata, null, 2));
      }

      // Update rules
      if (updates.rules) {
        const rulesPath = path.join(templateDir, 'rules.json');
        const currentRules = template.rules || { rules: [], categories: {} };
        const updatedRules = {
          ...currentRules,
          rules: updates.rules.rules || currentRules.rules,
          categories: updates.rules.categories || currentRules.categories
        };
        
        fs.writeFileSync(rulesPath, JSON.stringify(updatedRules, null, 2));
      }

      // Update configuration
      if (updates.config) {
        const configPath = path.join(templateDir, 'config.json');
        const currentConfig = template.config || {};
        const updatedConfig = { ...currentConfig, ...updates.config };
        
        fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));
      }

      console.log(`✅ Template '${templateName}' updated successfully`);
      
      return {
        success: true,
        templateName,
        updates: Object.keys(updates)
      };
    } catch (error) {
      throw new Error(`Failed to update template '${templateName}': ${error.message}`);
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateName) {
    const templateDir = path.join(this.templatesDir, templateName);
    
    if (!fs.existsSync(templateDir)) {
      throw new Error(`Template '${templateName}' not found`);
    }

    try {
      fs.rmSync(templateDir, { recursive: true, force: true });
      console.log(`✅ Template '${templateName}' deleted successfully`);
      
      return {
        success: true,
        templateName
      };
    } catch (error) {
      throw new Error(`Failed to delete template '${templateName}': ${error.message}`);
    }
  }

  /**
   * Validate template structure
   */
  validateTemplate(templateName) {
    try {
      const template = this.getTemplate(templateName);
      const errors = [];
      const warnings = [];

      // Check required files
      const requiredFiles = ['rules.json'];
      requiredFiles.forEach(file => {
        const filePath = path.join(template.path, file);
        if (!fs.existsSync(filePath)) {
          errors.push(`Missing required file: ${file}`);
        }
      });

      // Validate rules structure if present
      if (template.rules) {
        if (!Array.isArray(template.rules.rules)) {
          errors.push('rules.json: rules must be an array');
        }

        if (typeof template.rules.categories !== 'object') {
          warnings.push('rules.json: categories should be an object');
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        template: templateName
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error.message],
        warnings: [],
        template: templateName
      };
    }
  }

  /**
   * Get template usage statistics
   */
  getTemplateStats(templateName) {
    try {
      const template = this.getTemplate(templateName);
      
      const stats = {
        name: templateName,
        rules: template.rules?.rules?.length || 0,
        categories: Object.keys(template.rules?.categories || {}).length,
        severityBreakdown: {},
        categoryBreakdown: {}
      };

      // Calculate severity breakdown
      if (template.rules?.rules) {
        template.rules.rules.forEach(rule => {
          const severity = rule.severity || 'UNKNOWN';
          stats.severityBreakdown[severity] = (stats.severityBreakdown[severity] || 0) + 1;
        });
      }

      // Calculate category breakdown
      if (template.rules?.rules) {
        template.rules.rules.forEach(rule => {
          const category = rule.category || 'uncategorized';
          stats.categoryBreakdown[category] = (stats.categoryBreakdown[category] || 0) + 1;
        });
      }

      return stats;
    } catch (error) {
      throw new Error(`Failed to get stats for template '${templateName}': ${error.message}`);
    }
  }
}

module.exports = TemplateManager;
