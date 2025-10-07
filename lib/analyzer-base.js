const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Base analyzer class - contains all the analysis methods extracted from quality-check.js
 */
class AnalyzerBase {
  constructor(configManager) {
    this.config = configManager;
    this.projectRoot = configManager.projectRoot || process.cwd();
    this.results = {};
  }

  /**
   * Run a command and return results
   */
  async runCommand(command, description) {
    console.log(`  🔍 ${description}...`);
    
    try {
      const output = execSync(command, { 
        encoding: 'utf8', 
        stdio: 'pipe',
        timeout: 60000,
        cwd: this.projectRoot
      });
      return { success: true, output };
    } catch (error) {
      return { 
        success: false, 
        output: error.stdout || '', 
        error: error.stderr || error.message 
      };
    }
  }

  /**
   * ESLint analysis - extracted from quality-check.js
   */
  async checkESLint() {
    console.log('📋 ESLint Code Quality Analysis');
    
    // Check if ESLint config exists
    const eslintConfigs = ['.eslintrc.js', '.eslintrc.json', '.eslintrc.yml', '.eslintrc.yaml'];
    const configExists = eslintConfigs.some(config => 
      fs.existsSync(path.join(this.projectRoot, config))
    );

    if (!configExists) {
      return {
        success: false,
        error: 'No ESLint configuration found',
        suggestion: 'Run: npx eslint --init'
      };
    }

    // Try JSON format first
    const jsonResult = await this.runCommand(
      'npx eslint src --ext .ts,.js --format json',
      'ESLint analysis with JSON output'
    );

    // Also get regular format for readable errors
    const regularResult = await this.runCommand(
      'npx eslint src --ext .ts,.js',
      'ESLint analysis with regular output'
    );

    let totalErrors = 0;
    let totalWarnings = 0;
    const issues = [];

    // Parse JSON output (ESLint returns JSON in stdout even when exit code is 1)
    const jsonOutput = jsonResult.output || jsonResult.error;
    if (jsonOutput) {
      try {
        const eslintResults = JSON.parse(jsonOutput || '[]');

        eslintResults.forEach(file => {
          totalErrors += file.errorCount;
          totalWarnings += file.warningCount;
          
          file.messages.forEach(msg => {
            issues.push({
              file: file.filePath.replace(this.projectRoot, ''),
              line: msg.line,
              column: msg.column,
              severity: msg.severity === 2 ? 'error' : 'warning',
              rule: msg.ruleId,
              message: msg.message
            });
          });
        });
      } catch (parseError) {
        console.warn('⚠️  Could not parse ESLint JSON output');
      }
    }

    const result = {
      success: true,
      passed: totalErrors === 0,
      issues: totalErrors + totalWarnings,
      errors: totalErrors,
      warnings: totalWarnings,
      details: issues,
      rawOutput: regularResult.output
    };

    if (totalErrors === 0 && totalWarnings === 0) {
      console.log('✅ ESLint: No issues found!');
    } else {
      console.log(`⚠️  ESLint: ${totalErrors} errors, ${totalWarnings} warnings`);
    }

    return result;
  }

  /**
   * TypeScript analysis
   */
  async checkTypeScript() {
    console.log('📋 TypeScript Type Checking');
    
    // Check if tsconfig.json exists
    if (!fs.existsSync(path.join(this.projectRoot, 'tsconfig.json'))) {
      return {
        success: false,
        error: 'No tsconfig.json found',
        suggestion: 'Run: npx tsc --init'
      };
    }

    const result = await this.runCommand(
      'npx tsc --noEmit --skipLibCheck',
      'TypeScript compilation check'
    );

    const hasErrors = !result.success || result.error;
    const errorOutput = result.error || '';
    
    // Parse TypeScript errors
    const errors = [];
    if (errorOutput) {
      const lines = errorOutput.split('\n');
      lines.forEach(line => {
        const match = line.match(/^(.+)\((\d+),(\d+)\): error TS(\d+): (.+)$/);
        if (match) {
          errors.push({
            file: match[1].replace(this.projectRoot, ''),
            line: parseInt(match[2]),
            column: parseInt(match[3]),
            code: match[4],
            message: match[5]
          });
        }
      });
    }

    const tsResult = {
      success: true,
      passed: !hasErrors,
      errors: errors.length,
      details: errors,
      rawOutput: errorOutput
    };

    if (!hasErrors) {
      console.log('✅ TypeScript: No type errors found!');
    } else {
      console.log(`❌ TypeScript: ${errors.length} type errors found`);
    }

    return tsResult;
  }

  /**
   * Security vulnerability scan
   */
  async checkSecurity() {
    console.log('📋 Security Vulnerability Scan');
    
    const result = await this.runCommand(
      'npm audit --audit-level=moderate --json',
      'NPM security audit'
    );

    let vulnerabilities = 0;
    let details = [];

    if (result.output) {
      try {
        const auditResult = JSON.parse(result.output);
        
        if (auditResult.vulnerabilities) {
          Object.entries(auditResult.vulnerabilities).forEach(([pkg, vuln]) => {
            vulnerabilities++;
            details.push({
              package: pkg,
              severity: vuln.severity,
              title: vuln.title,
              url: vuln.url
            });
          });
        }
      } catch (parseError) {
        console.warn('⚠️  Could not parse npm audit output');
      }
    }

    const securityResult = {
      success: true,
      passed: vulnerabilities === 0,
      vulnerabilities,
      details,
      rawOutput: result.output
    };

    if (vulnerabilities === 0) {
      console.log('✅ Security: No vulnerabilities found!');
    } else {
      console.log(`⚠️  Security: ${vulnerabilities} vulnerabilities found`);
    }

    return securityResult;
  }

  /**
   * Test coverage analysis
   */
  async checkTests() {
    console.log('📋 Test Coverage Analysis');
    
    // Check if Jest is configured
    const jestConfigs = ['jest.config.js', 'jest.config.json', 'package.json'];
    const hasJest = jestConfigs.some(config => {
      const configPath = path.join(this.projectRoot, config);
      if (fs.existsSync(configPath)) {
        if (config === 'package.json') {
          const pkg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          return pkg.jest || pkg.scripts?.test?.includes('jest');
        }
        return true;
      }
      return false;
    });

    if (!hasJest) {
      return {
        success: false,
        error: 'No Jest configuration found',
        suggestion: 'Install Jest: npm install --save-dev jest'
      };
    }

    // Run Jest with coverage
    const result = await this.runCommand(
      'npm test -- --coverage --passWithNoTests --json',
      'Jest test coverage'
    );

    let coverage = 0;
    let testResults = {};
    
    if (result.output) {
      try {
        const jestResult = JSON.parse(result.output);
        
        if (jestResult.coverageMap) {
          // Calculate overall coverage
          const coverageData = Object.values(jestResult.coverageMap);
          if (coverageData.length > 0) {
            const totalStatements = coverageData.reduce((sum, file) => sum + file.s?.length || 0, 0);
            const coveredStatements = coverageData.reduce((sum, file) => {
              return sum + (file.s ? Object.values(file.s).filter(count => count > 0).length : 0);
            }, 0);
            coverage = totalStatements > 0 ? Math.round((coveredStatements / totalStatements) * 100) : 0;
          }
        }

        testResults = {
          numTotalTests: jestResult.numTotalTests || 0,
          numPassedTests: jestResult.numPassedTests || 0,
          numFailedTests: jestResult.numFailedTests || 0,
          testSuites: jestResult.numTotalTestSuites || 0
        };
      } catch (parseError) {
        console.warn('⚠️  Could not parse Jest output');
      }
    }

    // Analyze missing tests
    const missingTests = await this.analyzeFeatureTestCoverage();

    const testResult = {
      success: true,
      coverage,
      testResults,
      missingTests,
      rawOutput: result.output
    };

    if (coverage === 0) {
      console.log('⚠️  No test directories found');
    } else {
      console.log(`📊 Test Coverage: ${coverage}%`);
    }

    return testResult;
  }

  /**
   * Analyze which features are missing tests
   */
  async analyzeFeatureTestCoverage() {
    const srcDir = path.join(this.projectRoot, 'src');
    const testDirs = ['__tests__', 'tests', 'test'].map(dir => 
      path.join(this.projectRoot, dir)
    );

    if (!fs.existsSync(srcDir)) {
      return [];
    }

    const sourceFiles = this.getSourceFiles(srcDir);
    const testFiles = new Set();

    // Collect all test files
    testDirs.forEach(testDir => {
      if (fs.existsSync(testDir)) {
        this.getTestFiles(testDir).forEach(file => testFiles.add(file));
      }
    });

    const missingTests = [];

    sourceFiles.forEach(sourceFile => {
      const relativePath = path.relative(this.projectRoot, sourceFile);
      const needsTest = this.analyzeIfFileNeedsTest(sourceFile);
      
      if (needsTest.needsTest) {
        const hasTest = this.findCorrespondingTest(sourceFile, testFiles);
        if (!hasTest) {
          missingTests.push({
            file: relativePath,
            reason: needsTest.reason,
            functions: needsTest.functions,
            suggestedTestFile: this.suggestTestFileName(sourceFile)
          });
        }
      }
    });

    return missingTests;
  }

  /**
   * Get all source files recursively
   */
  getSourceFiles(dir) {
    const files = [];
    
    const walkDir = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.')) {
          walkDir(fullPath);
        } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
          files.push(fullPath);
        }
      }
    };

    walkDir(dir);
    return files;
  }

  /**
   * Get all test files
   */
  getTestFiles(dir) {
    const files = [];
    
    if (!fs.existsSync(dir)) return files;

    const walkDir = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          walkDir(fullPath);
        } else if (item.match(/\.(test|spec)\.(ts|js)$/)) {
          files.push(fullPath);
        }
      }
    };

    walkDir(dir);
    return files;
  }

  /**
   * Analyze if a file needs tests
   */
  analyzeIfFileNeedsTest(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileName = path.basename(filePath);
      
      // Skip certain file types
      if (fileName.match(/\.(d\.ts|config|constants)$/)) {
        return { needsTest: false, reason: 'Configuration or type definition file' };
      }

      // Look for functions, classes, and exports
      const functions = [];
      const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)|(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\(|class\s+(\w+)/g;
      
      let match;
      while ((match = functionRegex.exec(content)) !== null) {
        const funcName = match[1] || match[2] || match[3];
        if (funcName && !funcName.startsWith('_')) { // Skip private functions
          functions.push(funcName);
        }
      }

      if (functions.length > 0) {
        return {
          needsTest: true,
          reason: `Contains ${functions.length} function(s)/class(es)`,
          functions
        };
      }

      // Check for exports
      if (content.includes('export') && !content.match(/export\s+\{[^}]*\}\s*from/)) {
        return {
          needsTest: true,
          reason: 'Contains exports that may need testing',
          functions: ['exported functionality']
        };
      }

      return { needsTest: false, reason: 'No testable functionality found' };
    } catch (error) {
      return { needsTest: false, reason: `Error reading file: ${error.message}` };
    }
  }

  /**
   * Find corresponding test file
   */
  findCorrespondingTest(sourceFile, testFiles) {
    const baseName = path.basename(sourceFile, path.extname(sourceFile));
    const testPatterns = [
      `${baseName}.test.`,
      `${baseName}.spec.`,
      `${baseName}-test.`,
      `${baseName}-spec.`
    ];

    return Array.from(testFiles).some(testFile => 
      testPatterns.some(pattern => testFile.includes(pattern))
    );
  }

  /**
   * Suggest test file name
   */
  suggestTestFileName(sourceFile) {
    const relativePath = path.relative(this.projectRoot, sourceFile);
    const dir = path.dirname(relativePath);
    const baseName = path.basename(sourceFile, path.extname(sourceFile));
    
    return path.join(dir, '__tests__', `${baseName}.test.ts`);
  }

  /**
   * Code complexity analysis
   */
  async analyzeComplexity() {
    console.log('📋 Code Complexity Analysis');
    
    // Simple complexity analysis - count functions and their length
    const srcDir = path.join(this.projectRoot, 'src');
    if (!fs.existsSync(srcDir)) {
      return {
        success: false,
        error: 'No src directory found'
      };
    }

    const sourceFiles = this.getSourceFiles(srcDir);
    const complexityIssues = [];
    let totalFunctions = 0;
    let complexFunctions = 0;

    sourceFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        // Simple function detection and line counting
        const functionMatches = content.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || [];
        totalFunctions += functionMatches.length;

        // Check for long functions (simple heuristic)
        let inFunction = false;
        let functionStart = 0;
        let braceCount = 0;

        lines.forEach((line, index) => {
          if (line.match(/function\s+\w+|const\s+\w+\s*=\s*\(/)) {
            inFunction = true;
            functionStart = index;
            braceCount = 0;
          }
          
          if (inFunction) {
            braceCount += (line.match(/\{/g) || []).length;
            braceCount -= (line.match(/\}/g) || []).length;
            
            if (braceCount === 0 && index > functionStart) {
              const functionLength = index - functionStart;
              if (functionLength > 50) { // Functions longer than 50 lines
                complexFunctions++;
                complexityIssues.push({
                  file: path.relative(this.projectRoot, file),
                  line: functionStart + 1,
                  length: functionLength,
                  issue: 'Function too long (>50 lines)'
                });
              }
              inFunction = false;
            }
          }
        });
      } catch (error) {
        console.warn(`⚠️  Could not analyze ${file}: ${error.message}`);
      }
    });

    const complexityScore = totalFunctions > 0 ? 
      Math.max(0, 100 - (complexFunctions / totalFunctions) * 100) : 100;

    const result = {
      success: true,
      score: Math.round(complexityScore),
      totalFunctions,
      complexFunctions,
      issues: complexityIssues
    };

    if (complexFunctions === 0) {
      console.log('✅ Complexity: All functions within acceptable limits');
    } else {
      console.log(`⚠️  Complexity: ${complexFunctions} functions may be too complex`);
    }

    return result;
  }

  /**
   * Custom rules analysis
   */
  async checkCustomRules(ruleEngine) {
    console.log('📋 Custom Rules Analysis');
    
    if (!ruleEngine || !ruleEngine.rules || ruleEngine.rules.length === 0) {
      return {
        success: false,
        error: 'No custom rules defined'
      };
    }

    const violations = [];
    const sourceFiles = this.getSourceFiles(path.join(this.projectRoot, 'src'));

    // Analyze each file against custom rules
    sourceFiles.forEach(file => {
      const relativePath = path.relative(this.projectRoot, file);
      const rulesForFile = ruleEngine.getRulesForFile(relativePath);
      
      try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');

        rulesForFile.forEach(rule => {
          try {
            const regex = new RegExp(rule.pattern, 'gm');
            let match;
            
            while ((match = regex.exec(content)) !== null) {
              const lineNumber = content.substring(0, match.index).split('\n').length;
              
              violations.push({
                file: relativePath,
                line: lineNumber,
                rule: rule.id,
                severity: rule.severity,
                message: rule.description,
                suggestion: rule.suggestion,
                matchedText: match[0]
              });
            }
          } catch (regexError) {
            console.warn(`⚠️  Invalid regex in rule ${rule.id}: ${regexError.message}`);
          }
        });
      } catch (error) {
        console.warn(`⚠️  Could not analyze ${file}: ${error.message}`);
      }
    });

    const result = {
      success: true,
      violations: violations.length,
      details: violations,
      rulesSummary: ruleEngine.getSummary()
    };

    if (violations.length === 0) {
      console.log('✅ Custom Rules: No violations found!');
    } else {
      console.log(`⚠️  Custom Rules: ${violations.length} violations found`);
    }

    return result;
  }

  /**
   * Dependency Analysis - Check for circular dependencies, outdated packages, security issues
   */
  async checkDependencies() {
    console.log('📦 Dependency Analysis');
    
    const results = {
      circularDependencies: { success: false, issues: [] },
      outdatedPackages: { success: false, packages: [] },
      securityVulnerabilities: { success: false, vulnerabilities: [] },
      bundleSize: { success: false, size: 0 }
    };

    // Check for circular dependencies
    try {
      const madgeResult = await this.runCommand('npx madge --circular --extensions ts src/', 'Checking circular dependencies');
      if (!madgeResult.success && madgeResult.output.includes('Circular dependency')) {
        results.circularDependencies.issues = madgeResult.output.split('\n').filter(line => line.includes('Circular dependency'));
      } else {
        results.circularDependencies.success = true;
      }
    } catch (error) {
      results.circularDependencies.issues = ['Could not check circular dependencies'];
    }

    // Check for outdated packages
    try {
      const outdatedResult = await this.runCommand('npm outdated --json', 'Checking outdated packages');
      if (outdatedResult.success) {
        const outdated = JSON.parse(outdatedResult.output);
        results.outdatedPackages.packages = Object.keys(outdated).map(pkg => ({
          name: pkg,
          current: outdated[pkg].current,
          wanted: outdated[pkg].wanted,
          latest: outdated[pkg].latest
        }));
        results.outdatedPackages.success = results.outdatedPackages.packages.length === 0;
      }
    } catch (error) {
      results.outdatedPackages.packages = ['Could not check outdated packages'];
    }

    // Check for security vulnerabilities
    try {
      const auditResult = await this.runCommand('npm audit --json', 'Checking security vulnerabilities');
      if (auditResult.success) {
        const audit = JSON.parse(auditResult.output);
        results.securityVulnerabilities.vulnerabilities = audit.vulnerabilities || [];
        results.securityVulnerabilities.success = audit.vulnerabilities === 0;
      }
    } catch (error) {
      results.securityVulnerabilities.vulnerabilities = ['Could not check security vulnerabilities'];
    }

    return results;
  }

  /**
   * Code Coverage Analysis - Run tests and analyze coverage
   */
  async checkCoverage() {
    console.log('📊 Code Coverage Analysis');
    
    const results = {
      success: false,
      coverage: {},
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80
      }
    };

    try {
      const coverageResult = await this.runCommand('npm run test:coverage', 'Running tests with coverage');
      if (coverageResult.success) {
        // Parse coverage from output or coverage/lcov.info
        const coveragePath = path.join(this.projectRoot, 'coverage', 'coverage-summary.json');
        if (fs.existsSync(coveragePath)) {
          const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
          results.coverage = coverage.total;
          results.success = true;
        }
      }
    } catch (error) {
      results.coverage = { error: 'Could not generate coverage report' };
    }

    return results;
  }

  /**
   * Performance Analysis - Check bundle size, performance patterns
   */
  async checkPerformance() {
    console.log('⚡ Performance Analysis');
    
    const results = {
      bundleSize: { success: false, size: 0 },
      performanceIssues: [],
      recommendations: []
    };

    // Check if dist folder exists and calculate size
    const distPath = path.join(this.projectRoot, 'dist');
    if (fs.existsSync(distPath)) {
      try {
        const sizeResult = await this.runCommand('du -sh dist/', 'Calculating bundle size');
        if (sizeResult.success) {
          results.bundleSize.size = sizeResult.output.trim();
          results.bundleSize.success = true;
        }
      } catch (error) {
        results.bundleSize.size = 'Could not calculate size';
      }
    }

    // Check for performance anti-patterns
    const sourceFiles = this.getSourceFiles(path.join(this.projectRoot, 'src'));
    sourceFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for synchronous operations
        if (content.includes('fs.readFileSync') || content.includes('fs.writeFileSync')) {
          results.performanceIssues.push({
            file: path.relative(this.projectRoot, file),
            issue: 'Synchronous file operations detected',
            severity: 'WARNING',
            suggestion: 'Use async file operations (fs.promises)'
          });
        }

        // Check for blocking console operations
        if (content.includes('console.log') && !content.includes('//')) {
          results.performanceIssues.push({
            file: path.relative(this.projectRoot, file),
            issue: 'Console.log in production code',
            severity: 'ERROR',
            suggestion: 'Use structured logging instead of console.log'
          });
        }

        // Check for large functions
        const lines = content.split('\n');
        const functionLines = lines.filter(line => line.trim().startsWith('function') || line.trim().includes('=>'));
        if (functionLines.length > 50) {
          results.performanceIssues.push({
            file: path.relative(this.projectRoot, file),
            issue: 'Large function detected',
            severity: 'WARNING',
            suggestion: 'Consider breaking down large functions'
          });
        }

      } catch (error) {
        // Skip files that can't be read
      }
    });

    return results;
  }

  /**
   * Architecture Analysis - Check for architectural patterns and anti-patterns
   */
  async checkArchitecture() {
    console.log('🏗️ Architecture Analysis');
    
    const results = {
      patterns: [],
      antiPatterns: [],
      recommendations: []
    };

    const sourceFiles = this.getSourceFiles(path.join(this.projectRoot, 'src'));
    
    sourceFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const relativePath = path.relative(this.projectRoot, file);
        
        // Check for proper error handling patterns
        if (content.includes('async') && !content.includes('try') && !content.includes('catch')) {
          results.antiPatterns.push({
            file: relativePath,
            issue: 'Async function without error handling',
            severity: 'ERROR',
            suggestion: 'Add try-catch blocks to async functions'
          });
        }

        // Check for proper logging patterns
        if (content.includes('console.log') && !content.includes('logger')) {
          results.antiPatterns.push({
            file: relativePath,
            issue: 'Using console.log instead of structured logging',
            severity: 'WARNING',
            suggestion: 'Implement structured logging with context'
          });
        }

        // Check for proper validation patterns
        if (content.includes('req.body') && !content.includes('validate') && !content.includes('joi') && !content.includes('yup')) {
          results.antiPatterns.push({
            file: relativePath,
            issue: 'Request body used without validation',
            severity: 'ERROR',
            suggestion: 'Add input validation middleware'
          });
        }

      } catch (error) {
        // Skip files that can't be read
      }
    });

    return results;
  }
}

module.exports = AnalyzerBase;
