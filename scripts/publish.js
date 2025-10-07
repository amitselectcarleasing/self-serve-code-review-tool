#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

/**
 * Publishing script for @self-serve/code-review-tool
 */
class Publisher {
  constructor() {
    this.packagePath = path.join(__dirname, '../package.json');
    this.pkg = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
  }

  log(message, type = 'info') {
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red
    };
    
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    
    console.log(colors[type](`${icons[type]} ${message}`));
  }

  async runCommand(command, description) {
    this.log(`Running: ${description}`, 'info');
    try {
      const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
      return { success: true, output };
    } catch (error) {
      return { success: false, error: error.message, output: error.stdout };
    }
  }

  async validatePackage() {
    this.log('🔍 Validating package...', 'info');
    
    // Check required files
    const requiredFiles = ['lib/index.js', 'bin/cli.js', 'README.md'];
    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(__dirname, '..', file))) {
        throw new Error(`Required file missing: ${file}`);
      }
    }
    
    // Check templates
    const templatesDir = path.join(__dirname, '../templates');
    const templates = fs.readdirSync(templatesDir);
    if (templates.length === 0) {
      throw new Error('No templates found');
    }
    
    this.log(`Found ${templates.length} templates: ${templates.join(', ')}`, 'success');
    
    // Validate package.json
    if (!this.pkg.name || !this.pkg.version) {
      throw new Error('Package name and version are required');
    }
    
    this.log(`Package: ${this.pkg.name}@${this.pkg.version}`, 'success');
  }

  async runTests() {
    this.log('🧪 Running tests...', 'info');
    
    const result = await this.runCommand('npm test', 'Running test suite');
    if (!result.success) {
      throw new Error(`Tests failed: ${result.error}`);
    }
    
    this.log('All tests passed!', 'success');
  }

  async validateCLI() {
    this.log('🖥️ Validating CLI...', 'info');
    
    const commands = [
      'node bin/cli.js --help',
      'node bin/cli.js templates',
      'node bin/cli.js templates --validate api-gateway'
    ];
    
    for (const command of commands) {
      const result = await this.runCommand(command, `Testing: ${command}`);
      if (!result.success) {
        throw new Error(`CLI validation failed: ${command}`);
      }
    }
    
    this.log('CLI validation passed!', 'success');
  }

  async checkRegistry() {
    this.log('🌐 Checking registry configuration...', 'info');
    
    const npmrcPath = path.join(__dirname, '../.npmrc');
    if (fs.existsSync(npmrcPath)) {
      const npmrc = fs.readFileSync(npmrcPath, 'utf8');
      this.log(`Registry config: ${npmrc.trim()}`, 'info');
    }
    
    if (this.pkg.publishConfig) {
      this.log(`Publish registry: ${this.pkg.publishConfig.registry}`, 'info');
    }
  }

  async dryRunPublish() {
    this.log('🔍 Running publish dry-run...', 'info');
    
    const result = await this.runCommand('npm publish --dry-run', 'Dry run publish');
    if (!result.success) {
      throw new Error(`Publish dry-run failed: ${result.error}`);
    }
    
    this.log('Publish dry-run successful!', 'success');
  }

  async publish(registry = null) {
    this.log('📦 Publishing package...', 'info');
    
    let publishCommand = 'npm publish';
    if (registry) {
      publishCommand += ` --registry=${registry}`;
    }
    
    const result = await this.runCommand(publishCommand, 'Publishing to registry');
    if (!result.success) {
      throw new Error(`Publish failed: ${result.error}`);
    }
    
    this.log(`Package published successfully!`, 'success');
    this.log(`Install with: npm install ${this.pkg.name}`, 'info');
  }

  async showPublishInfo() {
    console.log('\n' + '='.repeat(60));
    this.log('📦 Package Publishing Information', 'info');
    console.log('='.repeat(60));
    
    console.log(`📋 Package: ${chalk.bold(this.pkg.name)}`);
    console.log(`📋 Version: ${chalk.bold(this.pkg.version)}`);
    console.log(`📋 Description: ${this.pkg.description}`);
    console.log(`📋 Registry: ${this.pkg.publishConfig?.registry || 'default npm registry'}`);
    
    console.log('\n📊 Package Contents:');
    const result = await this.runCommand('npm pack --dry-run', 'Checking package contents');
    if (result.success) {
      console.log(result.output);
    }
    
    console.log('\n🚀 Publishing Options:');
    console.log('1. GitHub Packages: npm publish (configured)');
    console.log('2. Private Registry: npm publish --registry=<your-registry>');
    console.log('3. Verdaccio: npm publish --registry=http://localhost:4873');
    console.log('4. Azure Artifacts: npm publish (after auth setup)');
  }

  async run() {
    try {
      console.clear();
      this.log('🚀 Self-Serve Code Review Tool - Publishing Script', 'info');
      console.log('='.repeat(60));
      
      await this.validatePackage();
      await this.runTests();
      await this.validateCLI();
      await this.checkRegistry();
      await this.dryRunPublish();
      
      console.log('\n' + '='.repeat(60));
      this.log('✅ All validations passed! Ready to publish.', 'success');
      console.log('='.repeat(60));
      
      await this.showPublishInfo();
      
      console.log('\n💡 To publish now, run:');
      console.log(chalk.cyan('npm publish'));
      console.log('\n💡 Or specify a different registry:');
      console.log(chalk.cyan('npm publish --registry=https://your-registry.com'));
      
    } catch (error) {
      this.log(`Publishing preparation failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const publisher = new Publisher();
  publisher.run();
}

module.exports = Publisher;
