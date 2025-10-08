#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');
const CodeReviewTool = require('../lib/index');
const TemplateManager = require('../lib/template-manager');
const RuleEngine = require('../lib/rule-engine');
const path = require('path');
const fs = require('fs');

const program = new Command();

// Helper function for colored logging
const log = {
  info: (msg) => console.log(chalk.blue('ℹ️ ') + msg),
  success: (msg) => console.log(chalk.green('✅ ') + msg),
  warning: (msg) => console.log(chalk.yellow('⚠️ ') + msg),
  error: (msg) => console.log(chalk.red('❌ ') + msg),
  header: (msg) => console.log(chalk.bold.cyan('🔍 ' + msg))
};

program
  .name('self-serve-review')
  .description('Universal code review tool for microservices')
  .version('1.3.0');

// Initialize command
program
  .command('init')
  .description('Initialize code review in current project')
  .option('-t, --template <template>', 'Template to use (api-gateway, backend-service, microservice-base)')
  .option('-i, --interactive', 'Interactive setup')
  .option('-f, --force', 'Overwrite existing configuration')
  .action(async (options) => {
    try {
      log.header('Self-Serve Code Review Initialization');
      
      const templateManager = new TemplateManager();
      let template = options.template;
      
      // Interactive template selection
      if (options.interactive || !template) {
        const templates = templateManager.listTemplates();
        
        if (templates.length === 0) {
          log.error('No templates found. Please check your installation.');
          process.exit(1);
        }
        
        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'template',
            message: 'Choose a template for your project:',
            choices: templates.map(t => ({
              name: `${t.name} - ${t.description || 'No description'}`,
              value: t.name
            }))
          },
          {
            type: 'confirm',
            name: 'addScripts',
            message: 'Add code review scripts to package.json?',
            default: true
          },
          {
            type: 'confirm',
            name: 'createReportsDir',
            message: 'Create reports directory?',
            default: true
          }
        ]);
        
        template = answers.template;
        options.addScripts = answers.addScripts;
        options.createReportsDir = answers.createReportsDir;
      }
      
      if (!template) {
        log.error('Template is required. Use --template or --interactive flag.');
        process.exit(1);
      }
      
      // Initialize project
      const tool = new CodeReviewTool({ projectRoot: process.cwd() });
      const result = await tool.init(template, options);
      
      if (result.success) {
        log.success(`Project initialized with ${template} template!`);
        log.info(`Configuration saved to: ${result.configPath}`);
        
        // Show next steps
        console.log('\n' + chalk.bold('📋 Next Steps:'));
        console.log('1. Review the configuration in .self-serve-review.json');
        console.log('2. Run: npm run code-review');
        console.log('3. Check the generated reports in ./reports/');
        
        if (options.addScripts !== false) {
          console.log('4. Use npm run code-review:ai for AI-powered analysis');
        }
      } else {
        log.error(`Initialization failed: ${result.error}`);
        process.exit(1);
      }
    } catch (error) {
      log.error(`Initialization failed: ${error.message}`);
      process.exit(1);
    }
  });

// Analyze command
program
  .command('analyze')
  .description('Run code analysis')
  .option('-s, --severity <level>', 'Minimum severity level (info, warning, error, critical)', 'warning')
  .option('-a, --analyzers <analyzers>', 'Comma-separated list of analyzers to run (eslint,typescript,security,performance,dependencies,coverage,architecture,custom-rules,bug-detection,test-cases)')
  .option('-r, --reporters <reporters>', 'Comma-separated list of reporters to use')
  .option('--ai-prompts', 'Generate AI analysis prompts (enables AI testing mode)')
  .option('--ai-analysis', 'Perform actual AI code analysis and testing (enables AI testing mode)')
  .option('--no-reports', 'Skip report generation')
  .option('-w, --watch', 'Watch for file changes and re-run analysis')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options) => {
    try {
      log.header('Self-Serve Code Review Analysis');
      
      // Parse options
      const toolOptions = {
        projectRoot: process.cwd(),
        severity: options.severity,
        verbose: options.verbose
      };
      
      if (options.analyzers) {
        toolOptions.analyzers = options.analyzers.split(',').map(a => a.trim());
      }
      
      if (options.reporters) {
        toolOptions.reporters = options.reporters.split(',').map(r => r.trim());
      }
      
      if (options.aiPrompts) {
        toolOptions.reporters = [...(toolOptions.reporters || []), 'ai-prompts'];
      }
      
      if (options.aiAnalysis) {
        toolOptions.reporters = [...(toolOptions.reporters || []), 'ai-analysis'];
      }
      
      if (options.noReports) {
        toolOptions.reporters = [];
      }
      
      // Create and run analysis
      const tool = new CodeReviewTool(toolOptions);
      
      // Determine testing mode
      const isAITesting = options.aiAnalysis || options.aiPrompts || 
                         (options.reporters && (options.reporters.includes('ai-analysis') || options.reporters.includes('ai-prompts')));
      
      if (isAITesting) {
        log.info('🤖 Running in AI Testing Mode - Will generate HTML + AI Summary MD');
      } else {
        log.info('📊 Running in General Testing Mode - Will generate HTML only');
      }
      
      if (options.watch) {
        log.info('Starting watch mode...');
        // TODO: Implement watch mode
        log.warning('Watch mode not yet implemented');
        return;
      }
      
      const results = await tool.analyze(toolOptions);
      
      // Display results
      console.log('\n' + '='.repeat(60));
      log.header('Analysis Complete!');
      console.log('='.repeat(60));
      
      const score = results.score;
      const grade = results.grade;
      const scoreColor = score >= 90 ? 'green' : score >= 70 ? 'yellow' : 'red';
      
      console.log(chalk[scoreColor](`📊 Overall Score: ${score}/100 (${grade})`));
      
      // Show analyzer results
      if (results.findings) {
        console.log('\n📋 Analysis Results:');
        Object.entries(results.findings).forEach(([analyzer, result]) => {
          if (!result) return;
          
          const status = result.success === false ? '❌' : 
                        (result.errors > 0 || result.violations > 0) ? '⚠️' : '✅';
          
          let summary = '';
          if (result.errors !== undefined) summary += `${result.errors} errors, `;
          if (result.warnings !== undefined) summary += `${result.warnings} warnings, `;
          if (result.violations !== undefined) summary += `${result.violations} violations, `;
          if (result.coverage !== undefined) {
            const coverageValue = typeof result.coverage === 'number' ? result.coverage : 
                                 (result.coverage.statements ? result.coverage.statements.pct : 0);
            summary += `${coverageValue}% coverage, `;
          }
          if (result.vulnerabilities !== undefined) summary += `${result.vulnerabilities} vulnerabilities, `;
          
          summary = summary.replace(/, $/, '') || 'completed';
          
          console.log(`  ${status} ${analyzer.charAt(0).toUpperCase() + analyzer.slice(1)}: ${summary}`);
        });
      }
      
      // Show AI Analysis if available
      if (results.reports && results.reports.aiAnalysis) {
        console.log('\n🤖 AI Code Analysis Results:');
        const aiAnalysis = results.reports.aiAnalysis;
        
        if (aiAnalysis.summary.totalIssues > 0) {
          console.log(`  🔴 Critical Issues: ${aiAnalysis.summary.criticalIssues}`);
          console.log(`  🟡 Code Improvements: ${aiAnalysis.summary.codeImprovements}`);
          console.log(`  🔒 Security Fixes: ${aiAnalysis.summary.securityFixes}`);
        }
        
        if (aiAnalysis.summary.totalSuggestions > 0) {
          console.log(`  🧪 Test Suggestions: ${aiAnalysis.summary.testSuggestions}`);
          console.log(`  ♻️  Refactoring Suggestions: ${aiAnalysis.summary.refactoringSuggestions}`);
        }
        
        if (aiAnalysis.recommendations.length > 0) {
          console.log(`  💡 Recommendations: ${aiAnalysis.recommendations.length}`);
          
          // Show top 3 recommendations
          aiAnalysis.recommendations.slice(0, 3).forEach((rec, index) => {
            const priority = rec.priority === 'CRITICAL' ? '🔴' : rec.priority === 'HIGH' ? '🟠' : '🟡';
            console.log(`    ${priority} ${rec.category}: ${rec.issue}`);
            console.log(`       → ${rec.suggestion}`);
            if (rec.action) {
              console.log(`       → Action: ${rec.action}`);
            }
          });
        }
        
        console.log(`  📊 Priority Level: ${aiAnalysis.summary.priority}`);
      }
      
      // Show reports
      if (results.reports && Object.keys(results.reports).length > 0) {
        console.log('\n📊 Reports Generated:');
        Object.entries(results.reports).forEach(([type, report]) => {
          if (report.path) {
            console.log(`  📄 ${type.toUpperCase()}: ${report.path}`);
          }
        });
      }
      
      // Exit with appropriate code
      if (score < 60) {
        log.warning('Quality score is below 60%. Consider addressing critical issues.');
        process.exit(1);
      } else if (score < 80) {
        log.warning('Quality score could be improved. Check the generated reports.');
      } else {
        log.success('Excellent code quality!');
      }
      
    } catch (error) {
      log.error(`Analysis failed: ${error.message}`);
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Templates command
program
  .command('templates')
  .description('Manage templates')
  .option('-l, --list', 'List available templates')
  .option('-s, --show <template>', 'Show template details')
  .option('-v, --validate <template>', 'Validate template')
  .action(async (options) => {
    try {
      const templateManager = new TemplateManager();
      
      if (options.show) {
        // Show template details
        const template = templateManager.getTemplate(options.show);
        
        console.log(chalk.bold.blue(`📋 Template: ${template.name}`));
        console.log(`Description: ${template.info.description || 'No description'}`);
        console.log(`Version: ${template.info.version || '1.0.0'}`);
        console.log(`Rules: ${template.rules?.rules?.length || 0}`);
        console.log(`Categories: ${Object.keys(template.rules?.categories || {}).length}`);
        
        if (template.rules?.rules) {
          console.log('\n📏 Rules by Severity:');
          const severityCount = {};
          template.rules.rules.forEach(rule => {
            const severity = rule.severity || 'UNKNOWN';
            severityCount[severity] = (severityCount[severity] || 0) + 1;
          });
          
          Object.entries(severityCount).forEach(([severity, count]) => {
            const color = severity === 'CRITICAL' ? 'red' : 
                         severity === 'ERROR' ? 'yellow' : 'blue';
            console.log(`  ${chalk[color](severity)}: ${count} rules`);
          });
        }
        
      } else if (options.validate) {
        // Validate template
        const validation = templateManager.validateTemplate(options.validate);
        
        if (validation.valid) {
          log.success(`Template '${options.validate}' is valid!`);
        } else {
          log.error(`Template '${options.validate}' has errors:`);
          validation.errors.forEach(error => console.log(`  ❌ ${error}`));
        }
        
        if (validation.warnings.length > 0) {
          log.warning('Warnings:');
          validation.warnings.forEach(warning => console.log(`  ⚠️ ${warning}`));
        }
        
      } else {
        // List templates (default)
        const templates = templateManager.listTemplates();
        
        if (templates.length === 0) {
          log.warning('No templates found.');
          return;
        }
        
        console.log(chalk.bold.blue('📋 Available Templates:'));
        templates.forEach(template => {
          console.log(`\n  📦 ${chalk.bold(template.name)}`);
          console.log(`     ${template.description || 'No description'}`);
          console.log(`     Rules: ${template.rules || 0} | Version: ${template.version || '1.0.0'}`);
        });
        
        console.log(`\n💡 Use --show <template> to see details`);
        console.log(`💡 Use --validate <template> to check template validity`);
      }
      
    } catch (error) {
      log.error(`Template operation failed: ${error.message}`);
      process.exit(1);
    }
  });

// Config command
program
  .command('config')
  .description('Manage configuration')
  .option('-s, --show', 'Show current configuration')
  .option('-v, --validate', 'Validate configuration')
  .option('--set <key=value>', 'Set configuration value')
  .action(async (options) => {
    try {
      const tool = new CodeReviewTool({ projectRoot: process.cwd() });
      await tool.configManager.loadConfig();
      
      if (options.show) {
        // Show configuration
        const config = tool.configManager.getConfig();
        const summary = tool.configManager.getSummary();
        
        console.log(chalk.bold.blue('⚙️ Current Configuration:'));
        console.log(`Template: ${summary.template}`);
        console.log(`Analyzers: ${summary.analyzers} enabled`);
        console.log(`Reporters: ${summary.reporters} enabled`);
        console.log(`Rules: ${summary.rules} custom rules`);
        console.log(`Output Directory: ${summary.outputDir}`);
        console.log(`AI Integration: ${summary.aiEnabled ? '✅ Enabled' : '❌ Disabled'}`);
        console.log(`Severity Level: ${summary.severity}`);
        
      } else if (options.validate) {
        // Validate configuration
        const validation = tool.configManager.validateConfig();
        
        if (validation.valid) {
          log.success('Configuration is valid!');
        } else {
          log.error('Configuration has errors:');
          validation.errors.forEach(error => console.log(`  ❌ ${error}`));
        }
        
        if (validation.warnings.length > 0) {
          log.warning('Warnings:');
          validation.warnings.forEach(warning => console.log(`  ⚠️ ${warning}`));
        }
        
      } else if (options.set) {
        // Set configuration value
        const [key, value] = options.set.split('=');
        if (!key || value === undefined) {
          log.error('Invalid format. Use: --set key=value');
          process.exit(1);
        }
        
        // TODO: Implement configuration updates
        log.warning('Configuration updates not yet implemented');
        
      } else {
        // Show help
        console.log('Use --show to display current configuration');
        console.log('Use --validate to check configuration validity');
        console.log('Use --set key=value to update configuration');
      }
      
    } catch (error) {
      log.error(`Configuration operation failed: ${error.message}`);
      process.exit(1);
    }
  });

// Rules command
program
  .command('rules')
  .description('Manage custom rules')
  .option('-l, --list', 'List all rules')
  .option('-v, --validate', 'Validate rules file')
  .option('-s, --stats', 'Show rules statistics')
  .action(async (options) => {
    try {
      const rulesFile = path.join(process.cwd(), 'code-review-rules.json');
      
      if (!fs.existsSync(rulesFile)) {
        log.warning('No custom rules file found (code-review-rules.json)');
        return;
      }
      
      const ruleEngine = RuleEngine.loadFromFile(rulesFile);
      
      if (options.validate) {
        // Validate rules
        const validation = ruleEngine.validateRules();
        
        if (validation.valid) {
          log.success('Rules file is valid!');
        } else {
          log.error('Rules file has errors:');
          validation.errors.forEach(error => console.log(`  ❌ ${error}`));
        }
        
        if (validation.warnings.length > 0) {
          log.warning('Warnings:');
          validation.warnings.forEach(warning => console.log(`  ⚠️ ${warning}`));
        }
        
        console.log(`\n📊 Statistics:`);
        console.log(`Total Rules: ${validation.stats.totalRules}`);
        console.log(`Categories: ${validation.stats.categories}`);
        
        Object.entries(validation.stats.severityBreakdown).forEach(([severity, count]) => {
          const color = severity === 'CRITICAL' ? 'red' : 
                       severity === 'ERROR' ? 'yellow' : 'blue';
          console.log(`${chalk[color](severity)}: ${count} rules`);
        });
        
      } else if (options.stats) {
        // Show statistics
        const summary = ruleEngine.getSummary();
        
        console.log(chalk.bold.blue('📊 Rules Statistics:'));
        console.log(`Total Rules: ${summary.totalRules}`);
        console.log(`Categories: ${summary.categories}`);
        console.log(`High Priority Rules: ${summary.highPriorityRules}`);
        
        console.log('\n📏 By Severity:');
        Object.entries(summary.severityBreakdown).forEach(([severity, count]) => {
          const color = severity === 'CRITICAL' ? 'red' : 
                       severity === 'ERROR' ? 'yellow' : 'blue';
          console.log(`  ${chalk[color](severity)}: ${count} rules`);
        });
        
        console.log('\n📂 By Category:');
        Object.entries(summary.categoryBreakdown).forEach(([category, count]) => {
          console.log(`  ${category}: ${count} rules`);
        });
        
      } else {
        // List rules (default)
        const rules = ruleEngine.rules;
        
        if (rules.length === 0) {
          log.warning('No custom rules found.');
          return;
        }
        
        console.log(chalk.bold.blue(`📏 Custom Rules (${rules.length} total):`));
        
        rules.forEach(rule => {
          const severityColor = rule.severity === 'CRITICAL' ? 'red' : 
                               rule.severity === 'ERROR' ? 'yellow' : 'blue';
          
          console.log(`\n  📋 ${chalk.bold(rule.id)}`);
          console.log(`     ${rule.description}`);
          console.log(`     ${chalk[severityColor](rule.severity)} | ${rule.category}`);
        });
      }
      
    } catch (error) {
      log.error(`Rules operation failed: ${error.message}`);
      process.exit(1);
    }
  });

// Error handling
program.on('command:*', () => {
  log.error(`Invalid command: ${program.args.join(' ')}`);
  log.info('See --help for a list of available commands.');
  process.exit(1);
});

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
