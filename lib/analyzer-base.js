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
      success: totalErrors === 0,
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

    // Check for test directories
    const testDirs = ['tests', 'test', '__tests__'];
    const hasTestDir = testDirs.some(dir => {
      const testDirPath = path.join(this.projectRoot, dir);
      return fs.existsSync(testDirPath);
    });

    if (!hasTestDir) {
      return {
        success: false,
        error: 'No test directories found',
        suggestion: 'Create test directories: tests/, test/, or __tests__/'
      };
    }

    // Run Jest with coverage
    const result = await this.runCommand(
      'npm run test:coverage',
      'Jest test coverage'
    );

    let coverage = 0;
    let testResults = {};
    
    // Try to read coverage-summary.json first
    const coverageSummaryPath = path.join(this.projectRoot, 'coverage', 'coverage-summary.json');
    if (fs.existsSync(coverageSummaryPath)) {
      try {
        const coverageData = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
        if (coverageData.total && coverageData.total.statements) {
          coverage = coverageData.total.statements.pct;
          testResults = {
            statements: coverageData.total.statements,
            branches: coverageData.total.branches,
            functions: coverageData.total.functions,
            lines: coverageData.total.lines
          };
        }
      } catch (parseError) {
        console.warn('⚠️  Could not parse coverage-summary.json');
      }
    }

    // If no coverage data found, try to parse Jest output
    if (coverage === 0 && result.output) {
      try {
        // Look for coverage percentage in Jest output table
        const coverageMatch = result.output.match(/All files\s+\|\s+(\d+\.?\d*)\s+\|\s+(\d+\.?\d*)\s+\|\s+(\d+\.?\d*)\s+\|\s+(\d+\.?\d*)/);
        if (coverageMatch) {
          coverage = parseFloat(coverageMatch[1]); // Use statements coverage
          testResults = {
            statements: { pct: parseFloat(coverageMatch[1]) },
            branches: { pct: parseFloat(coverageMatch[2]) },
            functions: { pct: parseFloat(coverageMatch[3]) },
            lines: { pct: parseFloat(coverageMatch[4]) }
          };
        } else {
          // Fallback: look for any percentage in output
          const percentageMatch = result.output.match(/(\d+\.?\d*)%/);
          if (percentageMatch) {
            coverage = parseFloat(percentageMatch[1]);
          }
        }
        
        // Look for test results in Jest output
        const testMatch = result.output.match(/Tests:\s*(\d+)\s*passed/);
        if (testMatch) {
          testResults.numPassedTests = parseInt(testMatch[1]);
        }
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
        // Try multiple coverage file formats
        const coveragePaths = [
          path.join(this.projectRoot, 'coverage', 'coverage-summary.json'),
          path.join(this.projectRoot, 'coverage', 'coverage-final.json'),
          path.join(this.projectRoot, 'coverage', 'lcov-report', 'index.html')
        ];

        let coverageData = null;
        for (const coveragePath of coveragePaths) {
          if (fs.existsSync(coveragePath)) {
            try {
              if (coveragePath.endsWith('.json')) {
                coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
                break;
              }
            } catch (parseError) {
              console.warn(`⚠️  Could not parse ${coveragePath}`);
            }
          }
        }

        // Parse coverage data from different formats
        if (coverageData) {
          if (coverageData.total && coverageData.total.statements) {
            // coverage-summary.json format
            results.coverage = {
              statements: coverageData.total.statements.pct,
              branches: coverageData.total.branches.pct,
              functions: coverageData.total.functions.pct,
              lines: coverageData.total.lines.pct
            };
            results.success = true;
          } else if (coverageData.statements) {
            // Direct coverage object
            results.coverage = {
              statements: coverageData.statements.pct || coverageData.statements,
              branches: coverageData.branches.pct || coverageData.branches,
              functions: coverageData.functions.pct || coverageData.functions,
              lines: coverageData.lines.pct || coverageData.lines
            };
            results.success = true;
          }
        }

        // If no coverage data found, try to parse from Jest output
        if (!results.success && coverageResult.output) {
          try {
            console.log('🔍 Parsing Jest output for coverage...');
            console.log('Output preview:', coverageResult.output.substring(0, 500));
            
            // Look for coverage percentage in Jest output table - improved regex
            const coverageMatch = coverageResult.output.match(/All files\s+\|\s+(\d+\.?\d*)\s+\|\s+(\d+\.?\d*)\s+\|\s+(\d+\.?\d*)\s+\|\s+(\d+\.?\d*)/);
            if (coverageMatch) {
              console.log('✅ Found coverage match:', coverageMatch[1], coverageMatch[2], coverageMatch[3], coverageMatch[4]);
              results.coverage = {
                statements: parseFloat(coverageMatch[1]),
                branches: parseFloat(coverageMatch[2]),
                functions: parseFloat(coverageMatch[3]),
                lines: parseFloat(coverageMatch[4])
              };
              results.success = true;
            } else {
              // Fallback: look for any percentage in output
              const percentageMatch = coverageResult.output.match(/(\d+\.?\d*)%/);
              if (percentageMatch) {
                console.log('✅ Found percentage match:', percentageMatch[1]);
                const coverage = parseFloat(percentageMatch[1]);
                results.coverage = {
                  statements: coverage,
                  branches: coverage,
                  functions: coverage,
                  lines: coverage
                };
                results.success = true;
              } else {
                console.log('❌ No coverage pattern found in output');
              }
            }
          } catch (parseError) {
            console.warn('⚠️  Could not parse Jest coverage output:', parseError.message);
          }
        }

        // Additional check: Compare Jest output vs coverage-summary.json
        if (results.success && coverageData && coverageData.total) {
          const jestOutputCoverage = results.coverage.statements;
          const summaryFileCoverage = coverageData.total.statements.pct;
          
          if (Math.abs(jestOutputCoverage - summaryFileCoverage) > 5) {
            console.log('⚠️  Coverage discrepancy detected:');
            console.log(`   Jest output: ${jestOutputCoverage}%`);
            console.log(`   Summary file: ${summaryFileCoverage}%`);
            console.log('   Using Jest output as it reflects actual test execution');
            
            // Use Jest output as the authoritative source
            results.coverage = {
              statements: jestOutputCoverage,
              branches: results.coverage.branches,
              functions: results.coverage.functions,
              lines: results.coverage.lines
            };
          }
        }
      }
    } catch (error) {
      console.warn('⚠️  Coverage analysis failed:', error.message);
      results.coverage = {
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0
      };
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

  /**
   * Bug Detection Analysis - Advanced bug detection patterns
   */
  async checkBugDetection() {
    console.log('🐛 Bug Detection Analysis');
    
    const results = {
      bugs: [],
      potentialIssues: [],
      securityRisks: [],
      performanceIssues: []
    };

    const sourceFiles = this.getSourceFiles(path.join(this.projectRoot, 'src'));
    
    sourceFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const relativePath = path.relative(this.projectRoot, file);
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          const lineNumber = index + 1;
          
          // Memory leaks detection
          if (line.includes('setInterval') && !line.includes('clearInterval')) {
            results.bugs.push({
              file: relativePath,
              line: lineNumber,
              issue: 'Potential memory leak: setInterval without clearInterval',
              severity: 'ERROR',
              suggestion: 'Store interval ID and clear it when component unmounts',
              code: line.trim()
            });
          }

          if (line.includes('setTimeout') && !line.includes('clearTimeout')) {
            results.potentialIssues.push({
              file: relativePath,
              line: lineNumber,
              issue: 'setTimeout without clearTimeout',
              severity: 'WARNING',
              suggestion: 'Consider storing timeout ID for cleanup',
              code: line.trim()
            });
          }

          // Null/undefined access patterns
          if (line.match(/\.\w+\s*\(/g) && !line.includes('?.') && !line.includes('if') && !line.includes('&&')) {
            results.potentialIssues.push({
              file: relativePath,
              line: lineNumber,
              issue: 'Potential null/undefined access',
              severity: 'WARNING',
              suggestion: 'Use optional chaining (?.) or null checks',
              code: line.trim()
            });
          }

          // SQL injection patterns
          if (line.includes('query') && line.includes('+') && !line.includes('?') && !line.includes('$')) {
            results.securityRisks.push({
              file: relativePath,
              line: lineNumber,
              issue: 'Potential SQL injection vulnerability',
              severity: 'ERROR',
              suggestion: 'Use parameterized queries or prepared statements',
              code: line.trim()
            });
          }

          // Hardcoded secrets
          if (line.match(/(password|secret|key|token)\s*[:=]\s*['"][^'"]{8,}['"]/i)) {
            results.securityRisks.push({
              file: relativePath,
              line: lineNumber,
              issue: 'Hardcoded secret detected',
              severity: 'ERROR',
              suggestion: 'Use environment variables or secure configuration',
              code: line.trim()
            });
          }

          // Infinite loops
          if (line.includes('while(true)') || line.includes('for(;;)')) {
            results.bugs.push({
              file: relativePath,
              line: lineNumber,
              issue: 'Infinite loop detected',
              severity: 'ERROR',
              suggestion: 'Add proper exit conditions',
              code: line.trim()
            });
          }

          // Unhandled promise rejections
          if (line.includes('async') && line.includes('(') && !line.includes('await') && !line.includes('catch')) {
            results.potentialIssues.push({
              file: relativePath,
              line: lineNumber,
              issue: 'Async function without await or error handling',
              severity: 'WARNING',
              suggestion: 'Add await or proper error handling',
              code: line.trim()
            });
          }

          // Race conditions
          if (line.includes('Promise.all') && line.includes('await') && line.includes('for')) {
            results.potentialIssues.push({
              file: relativePath,
              line: lineNumber,
              issue: 'Potential race condition in Promise.all with loop',
              severity: 'WARNING',
              suggestion: 'Consider using Promise.allSettled or sequential processing',
              code: line.trim()
            });
          }

          // Performance issues
          if (line.includes('JSON.parse') && line.includes('JSON.stringify')) {
            results.performanceIssues.push({
              file: relativePath,
              line: lineNumber,
              issue: 'Deep cloning with JSON methods',
              severity: 'WARNING',
              suggestion: 'Use structuredClone or a proper cloning library',
              code: line.trim()
            });
          }

          // Unused variables
          if (line.match(/const\s+\w+\s*=/g) && !line.includes('//')) {
            const varName = line.match(/const\s+(\w+)\s*=/)?.[1];
            if (varName && !content.includes(varName + '.') && !content.includes(varName + '[') && !content.includes(varName + '(')) {
              results.potentialIssues.push({
                file: relativePath,
                line: lineNumber,
                issue: `Potentially unused variable: ${varName}`,
                severity: 'INFO',
                suggestion: 'Remove unused variable or use it',
                code: line.trim()
              });
            }
          }
        });

      } catch (error) {
        // Skip files that can't be read
      }
    });

    return results;
  }

  /**
   * Test Case Analysis - Comprehensive test coverage analysis
   */
  async checkTestCases() {
    console.log('🧪 Test Case Analysis');
    
    const results = {
      testFiles: [],
      missingTests: [],
      testQuality: [],
      coverage: {},
      recommendations: []
    };

    // Find all test files
    const testDirs = ['tests', 'test', '__tests__', 'src/__tests__'];
    testDirs.forEach(dir => {
      const testDirPath = path.join(this.projectRoot, dir);
      if (fs.existsSync(testDirPath)) {
        const testFiles = this.getTestFiles(testDirPath);
        testFiles.forEach(file => {
          results.testFiles.push({
            file: path.relative(this.projectRoot, file),
            size: fs.statSync(file).size,
            lastModified: fs.statSync(file).mtime
          });
        });
      }
    });

    // Analyze test quality
    results.testFiles.forEach(testFile => {
      try {
        const content = fs.readFileSync(path.join(this.projectRoot, testFile.file), 'utf8');
        const lines = content.split('\n');
        
        const analysis = {
          file: testFile.file,
          totalLines: lines.length,
          testCases: 0,
          assertions: 0,
          mocks: 0,
          describeBlocks: 0,
          itBlocks: 0,
          beforeEach: 0,
          afterEach: 0,
          quality: 'GOOD'
        };

        lines.forEach(line => {
          if (line.includes('describe(') || line.includes('describe(')) analysis.describeBlocks++;
          if (line.includes('it(') || line.includes('test(')) analysis.itBlocks++;
          if (line.includes('expect(')) analysis.assertions++;
          if (line.includes('jest.mock') || line.includes('mock')) analysis.mocks++;
          if (line.includes('beforeEach')) analysis.beforeEach++;
          if (line.includes('afterEach')) analysis.afterEach++;
        });

        analysis.testCases = analysis.itBlocks;
        
        // Quality assessment
        if (analysis.testCases === 0) {
          analysis.quality = 'POOR';
          analysis.issues = ['No test cases found'];
        } else if (analysis.assertions < analysis.testCases) {
          analysis.quality = 'FAIR';
          analysis.issues = ['Low assertion density'];
        } else if (analysis.mocks === 0 && analysis.testCases > 3) {
          analysis.quality = 'FAIR';
          analysis.issues = ['No mocking detected for complex tests'];
        } else {
          analysis.quality = 'GOOD';
        }

        results.testQuality.push(analysis);

      } catch (error) {
        results.testQuality.push({
          file: testFile.file,
          quality: 'ERROR',
          issues: ['Could not analyze file']
        });
      }
    });

    // Find missing tests for source files
    const sourceFiles = this.getSourceFiles(path.join(this.projectRoot, 'src'));
    sourceFiles.forEach(sourceFile => {
      const relativePath = path.relative(this.projectRoot, sourceFile);
      const fileName = path.basename(sourceFile, path.extname(sourceFile));
      const testFileName = `${fileName}.test.${path.extname(sourceFile).slice(1)}`;
      
      const hasTest = results.testFiles.some(testFile => 
        testFile.file.includes(fileName) && testFile.file.includes('.test.')
      );

      if (!hasTest) {
        results.missingTests.push({
          sourceFile: relativePath,
          suggestedTestFile: testFileName,
          priority: this.getTestPriority(sourceFile)
        });
      }
    });

    // Coverage analysis - try multiple sources
    const coveragePaths = [
      path.join(this.projectRoot, 'coverage', 'coverage-summary.json'),
      path.join(this.projectRoot, 'coverage', 'coverage-final.json')
    ];

    let coverageFound = false;
    for (const coveragePath of coveragePaths) {
      if (fs.existsSync(coveragePath)) {
        try {
          const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
          if (coverageData.total && coverageData.total.statements) {
            results.coverage = {
              statements: coverageData.total.statements.pct,
              branches: coverageData.total.branches.pct,
              functions: coverageData.total.functions.pct,
              lines: coverageData.total.lines.pct
            };
            
            // Calculate weighted coverage by file type
            results.weightedCoverage = this.calculateWeightedCoverage(coverageData);
            coverageFound = true;
            break;
          }
        } catch (error) {
          console.warn(`⚠️  Could not parse ${coveragePath}`);
        }
      }
    }

    // If no coverage file found, try to run Jest and parse output
    if (!coverageFound) {
      try {
        const coverageResult = await this.runCommand('npm run test:coverage', 'Running tests for coverage analysis');
        if (coverageResult.success && coverageResult.output) {
          console.log('🔍 Parsing Jest output for test-cases coverage...');
          // Parse coverage from Jest output
          const coverageMatch = coverageResult.output.match(/All files\s+\|\s+(\d+\.?\d*)\s+\|\s+(\d+\.?\d*)\s+\|\s+(\d+\.?\d*)\s+\|\s+(\d+\.?\d*)/);
          if (coverageMatch) {
            console.log('✅ Found test-cases coverage match:', coverageMatch[1]);
            results.coverage = {
              statements: parseFloat(coverageMatch[1]),
              branches: parseFloat(coverageMatch[2]),
              functions: parseFloat(coverageMatch[3]),
              lines: parseFloat(coverageMatch[4])
            };
            coverageFound = true;
          } else {
            // Fallback: look for any percentage in output
            const percentageMatch = coverageResult.output.match(/(\d+\.?\d*)%/);
            if (percentageMatch) {
              console.log('✅ Found test-cases percentage match:', percentageMatch[1]);
              const coverage = parseFloat(percentageMatch[1]);
              results.coverage = {
                statements: coverage,
                branches: coverage,
                functions: coverage,
                lines: coverage
              };
              coverageFound = true;
            }
          }
        }
      } catch (error) {
        console.warn('⚠️  Could not run Jest for coverage analysis');
      }
    }

    // Additional validation: Check for coverage discrepancies
    if (coverageFound) {
      const jestOutputMatch = results.coverage.statements;
      const summaryFileMatch = coverageFound && results.coverage.statements;
      
      if (Math.abs(jestOutputMatch - summaryFileMatch) > 5) {
        console.log('⚠️  Test coverage discrepancy detected:');
        console.log(`   Jest output: ${jestOutputMatch}%`);
        console.log(`   Summary file: ${summaryFileMatch}%`);
        console.log('   This may indicate Jest configuration issues with collectCoverageFrom patterns');
        console.log('   Recommendation: Review jest.config.js collectCoverageFrom settings');
      }
    }

    if (!coverageFound) {
      results.coverage = {
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0
      };
    }

    return results;
  }

  /**
   * Calculate weighted coverage based on file type priorities
   * Core business logic (controllers, services, utils, config, validation): 80% weight (8 points out of 10)
   * Infrastructure code (routes, middleware): 20% weight (2 points out of 10)
   */
  calculateWeightedCoverage(coverageData) {
    let coreLogicCoverage = 0;
    let infrastructureCoverage = 0;
    let coreLogicFiles = 0;
    let infrastructureFiles = 0;
    
    // Analyze each file's coverage
    Object.keys(coverageData).forEach(filePath => {
      if (filePath === 'total') return;
      
      const fileCoverage = coverageData[filePath];
      const statements = fileCoverage.statements?.pct || 0;
      
      // Determine file type based on path
      const isCoreLogic = this.isCoreLogicFile(filePath);
      
      if (isCoreLogic) {
        coreLogicCoverage += statements;
        coreLogicFiles++;
      } else {
        infrastructureCoverage += statements;
        infrastructureFiles++;
      }
    });
    
    // Calculate averages
    const avgCoreLogicCoverage = coreLogicFiles > 0 ? coreLogicCoverage / coreLogicFiles : 0;
    const avgInfrastructureCoverage = infrastructureFiles > 0 ? infrastructureCoverage / infrastructureFiles : 0;
    
    // Apply weights: 80% core logic, 20% infrastructure (out of 10 total test points)
    const weightedScore = (avgCoreLogicCoverage * 0.8) + (avgInfrastructureCoverage * 0.2);
    
    return {
      weightedScore: Math.round(weightedScore * 100) / 100,
      coreLogicCoverage: Math.round(avgCoreLogicCoverage * 100) / 100,
      infrastructureCoverage: Math.round(avgInfrastructureCoverage * 100) / 100,
      coreLogicFiles,
      infrastructureFiles,
      breakdown: {
        coreLogic: {
          coverage: avgCoreLogicCoverage,
          files: coreLogicFiles,
          weight: 0.8,  // 80% of test score (8 points out of 10)
          points: Math.round(avgCoreLogicCoverage * 0.8 * 10) / 100  // Actual points earned
        },
        infrastructure: {
          coverage: avgInfrastructureCoverage,
          files: infrastructureFiles,
          weight: 0.2,  // 20% of test score (2 points out of 10)
          points: Math.round(avgInfrastructureCoverage * 0.2 * 10) / 100  // Actual points earned
        }
      }
    };
  }

  /**
   * Determine if a file is core business logic or infrastructure
   */
  isCoreLogicFile(filePath) {
    const fileName = path.basename(filePath);
    
    // Core business logic files (90% weight)
    if (fileName.includes('controller') || fileName.includes('service')) {
      return true;
    }
    if (fileName.includes('util') || fileName.includes('helper')) {
      return true;
    }
    if (fileName.includes('config') || fileName.includes('constant')) {
      return true;
    }
    if (fileName.includes('validation')) {
      return true;
    }
    
    // Infrastructure files (10% weight)
    if (fileName.includes('route') || fileName.includes('middleware')) {
      return false;
    }
    
    // Default to core logic for other files
    return true;
  }

  /**
   * Get test priority based on file type and content
   * Updated to reflect weighted scoring: 80% for core business logic (8 points), 20% for infrastructure (2 points)
   */
  getTestPriority(filePath) {
    const fileName = path.basename(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // HIGH PRIORITY (80% weight - 8 points out of 10) - Core business logic
    if (fileName.includes('controller') || fileName.includes('service')) {
      return 'HIGH';
    }
    if (fileName.includes('util') || fileName.includes('helper')) {
      return 'HIGH';
    }
    if (fileName.includes('config') || fileName.includes('constant')) {
      return 'HIGH';
    }
    if (fileName.includes('validation')) {
      return 'HIGH';
    }
    if (content.includes('export') && content.includes('function')) {
      return 'HIGH';
    }
    
    // LOW PRIORITY (20% weight - 2 points out of 10) - Infrastructure code
    if (fileName.includes('route') || fileName.includes('middleware')) {
      return 'LOW';
    }
    
    return 'MEDIUM';
  }

  /**
   * Cursor AI Integration - Generate AI prompts for code analysis
   */
  async generateCursorAIPrompts(findings) {
    console.log('🤖 Generating Cursor AI Prompts');
    
    const prompts = {
      bugAnalysis: [],
      testGeneration: [],
      codeReview: [],
      refactoring: [],
      securityReview: []
    };

    // Bug Analysis Prompts
    if (findings.bugDetection && findings.bugDetection.bugs.length > 0) {
      prompts.bugAnalysis.push({
        title: 'Critical Bug Analysis',
        prompt: `Please analyze these potential bugs in the codebase:\n\n${findings.bugDetection.bugs.map(bug => 
          `File: ${bug.file}:${bug.line}\nIssue: ${bug.issue}\nCode: ${bug.code}\nSuggestion: ${bug.suggestion}`
        ).join('\n\n')}\n\nProvide detailed analysis and fixes for each bug.`
      });
    }

    // Test Generation Prompts
    if (findings.testCases && findings.testCases.missingTests.length > 0) {
      prompts.testGeneration.push({
        title: 'Missing Test Cases',
        prompt: `Generate comprehensive test cases for these files:\n\n${findings.testCases.missingTests.map(test => 
          `Source: ${test.sourceFile}\nSuggested: ${test.suggestedTestFile}\nPriority: ${test.priority}`
        ).join('\n\n')}\n\nInclude unit tests, integration tests, and edge cases.`
      });
    }

    // Code Review Prompts
    if (findings.eslint && findings.eslint.errors > 0) {
      prompts.codeReview.push({
        title: 'ESLint Issues Review',
        prompt: `Review and fix these ESLint errors:\n\n${findings.eslint.details.map(error => 
          `File: ${error.filePath}:${error.line}:${error.column}\nRule: ${error.ruleId}\nMessage: ${error.message}`
        ).join('\n\n')}\n\nProvide corrected code and explanations.`
      });
    }

    // Security Review Prompts
    if (findings.bugDetection && findings.bugDetection.securityRisks.length > 0) {
      prompts.securityReview.push({
        title: 'Security Vulnerability Analysis',
        prompt: `Analyze these security risks:\n\n${findings.bugDetection.securityRisks.map(risk => 
          `File: ${risk.file}:${risk.line}\nIssue: ${risk.issue}\nCode: ${risk.code}\nSuggestion: ${risk.suggestion}`
        ).join('\n\n')}\n\nProvide secure alternatives and best practices.`
      });
    }

    // Refactoring Prompts
    if (findings.complexity && findings.complexity.complexFunctions.length > 0) {
      prompts.refactoring.push({
        title: 'Code Refactoring Suggestions',
        prompt: `Refactor these complex functions:\n\n${findings.complexity.complexFunctions.map(func => 
          `File: ${func.file}\nFunction: ${func.name}\nComplexity: ${func.complexity}\nLines: ${func.lines}`
        ).join('\n\n')}\n\nProvide refactored code with improved readability and maintainability.`
      });
    }

    return prompts;
  }

  /**
   * AI Code Analysis - Actually analyze code using AI patterns
   */
  async performAICodeAnalysis(findings) {
    console.log('🤖 Performing AI Code Analysis');
    
    const aiAnalysis = {
      criticalIssues: [],
      recommendations: [],
      codeImprovements: [],
      securityFixes: [],
      testSuggestions: [],
      refactoringSuggestions: []
    };

    // Analyze ESLint errors with AI patterns
    if (findings.eslint && findings.eslint.details) {
      findings.eslint.details.forEach(error => {
        const suggestion = this.generateAIFix(error);
        if (suggestion) {
          aiAnalysis.codeImprovements.push({
            file: error.filePath,
            line: error.line,
            rule: error.ruleId,
            issue: error.message,
            suggestion: suggestion,
            severity: 'ERROR',
            category: 'Code Quality'
          });
        }
      });
    }

    // Analyze bug detection results
    if (findings.bugDetection) {
      if (findings.bugDetection.bugs) {
        findings.bugDetection.bugs.forEach(bug => {
          aiAnalysis.criticalIssues.push({
            file: bug.file,
            line: bug.line,
            issue: bug.issue,
            suggestion: bug.suggestion,
            severity: 'CRITICAL',
            category: 'Bug Detection',
            code: bug.code
          });
        });
      }

      if (findings.bugDetection.securityRisks) {
        findings.bugDetection.securityRisks.forEach(risk => {
          aiAnalysis.securityFixes.push({
            file: risk.file,
            line: risk.line,
            issue: risk.issue,
            suggestion: risk.suggestion,
            severity: 'HIGH',
            category: 'Security',
            code: risk.code
          });
        });
      }
    }

    // Analyze test cases
    if (findings.testCases && findings.testCases.missingTests) {
      findings.testCases.missingTests.forEach(test => {
        aiAnalysis.testSuggestions.push({
          sourceFile: test.sourceFile,
          suggestedTestFile: test.suggestedTestFile,
          priority: test.priority,
          category: 'Test Coverage',
          suggestion: `Create comprehensive test cases for ${test.sourceFile}`
        });
      });
    }

    // Analyze complexity issues
    if (findings.complexity && findings.complexity.issues) {
      findings.complexity.issues.forEach(func => {
        aiAnalysis.refactoringSuggestions.push({
          file: func.file,
          function: 'Unknown', // We don't have function name in issues
          complexity: func.length,
          lines: func.length,
          category: 'Refactoring',
          suggestion: `Refactor function to reduce length from ${func.length} lines`
        });
      });
    }

    return aiAnalysis;
  }

  /**
   * Generate AI-powered fix suggestions for ESLint errors
   */
  generateAIFix(error) {
    const ruleId = error.ruleId;
    const message = error.message;
    const line = error.line;
    const column = error.column;

    // AI-powered fix patterns
    const fixPatterns = {
      '@typescript-eslint/no-unused-vars': () => {
        if (message.includes('is defined but never used')) {
          return `Remove unused variable or prefix with underscore (e.g., _${message.match(/'(.*?)'/)?.[1] || 'variable'})`;
        }
        return 'Remove unused variable or use it in your code';
      },
      '@typescript-eslint/no-explicit-any': () => {
        return 'Replace "any" with specific type (e.g., string, number, User, etc.)';
      },
      '@typescript-eslint/no-unused-args': () => {
        return 'Remove unused parameter or prefix with underscore (e.g., _req, _res)';
      },
      'no-console': () => {
        return 'Replace console.log with proper logging (e.g., logger.info, logger.error)';
      },
      'prefer-const': () => {
        return 'Use "const" instead of "let" for variables that are not reassigned';
      },
      'no-var': () => {
        return 'Use "let" or "const" instead of "var"';
      }
    };

    return fixPatterns[ruleId] ? fixPatterns[ruleId]() : `Fix ${ruleId}: ${message}`;
  }

  /**
   * Generate actionable AI recommendations
   */
  generateAIRecommendations(findings, score) {
    const recommendations = [];

    // Score-based recommendations
    if (score.overall < 60) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Overall Quality',
        issue: 'Low quality score',
        suggestion: 'Focus on fixing critical issues first, then improve test coverage',
        action: 'Run "npm run code-review:local" to see specific issues'
      });
    }

    // ESLint recommendations
    if (findings.eslint && findings.eslint.errors > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Code Quality',
        issue: `${findings.eslint.errors} ESLint errors`,
        suggestion: 'Fix ESLint errors to improve code quality and consistency',
        action: 'Run "npm run lint:fix" to auto-fix some issues'
      });
    }

    // Test coverage recommendations
    if (findings.tests && findings.tests.coverage < 80) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Test Coverage',
        issue: `Low test coverage: ${findings.tests.coverage}%`,
        suggestion: 'Increase test coverage to at least 80%',
        action: 'Add more test cases for uncovered functions'
      });
    }

    // Security recommendations
    if (findings.bugDetection && findings.bugDetection.securityRisks.length > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'Security',
        issue: `${findings.bugDetection.securityRisks.length} security risks`,
        suggestion: 'Fix security vulnerabilities immediately',
        action: 'Review and fix security issues in the generated report'
      });
    }

    return recommendations;
  }
}

module.exports = AnalyzerBase;
