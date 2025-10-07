const RuleEngine = require('./rule-engine');
const AnalyzerBase = require('./analyzer-base');
const ReportGenerator = require('./report-generator');
const ConfigManager = require('./config-manager');
const TemplateManager = require('./template-manager');

/**
 * Main CodeReviewTool class - orchestrates the entire analysis process
 */
class CodeReviewTool {
  constructor(options = {}) {
    this.options = options;
    this.projectRoot = options.projectRoot || process.cwd();
    
    // Initialize managers
    this.configManager = new ConfigManager(options);
    this.templateManager = new TemplateManager();
    this.ruleEngine = new RuleEngine(this.configManager.getRules());
    this.analyzer = new AnalyzerBase(this.configManager);
    this.reporter = new ReportGenerator(this.configManager);
    
    this.results = {
      findings: {},
      reports: {},
      score: 0,
      grade: 'F'
    };
  }

  /**
   * Initialize a project with a specific template
   */
  async init(templateName, options = {}) {
    console.log(`🚀 Initializing project with ${templateName} template...`);
    
    try {
      const result = await this.templateManager.initializeProject(templateName, this.projectRoot, options);
      console.log('✅ Project initialized successfully!');
      
      return {
        success: true,
        template: templateName,
        configPath: `${this.projectRoot}/.self-serve-review.json`,
        ...result
      };
    } catch (error) {
      console.error('❌ Initialization failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Run complete code analysis
   */
  async analyze(options = {}) {
    console.log('🔍 Starting code analysis...');
    
    try {
      // Load and validate configuration
      await this.configManager.loadConfig();
      
      // Reinitialize components with loaded config
      this.ruleEngine = new RuleEngine(this.configManager.getRules());
      this.analyzer = new AnalyzerBase(this.configManager);
      this.reporter = new ReportGenerator(this.configManager);
      
      // Validate rules
      const ruleValidation = this.ruleEngine.validateRules();
      if (!ruleValidation.valid) {
        throw new Error(`Rule validation failed: ${ruleValidation.errors.join(', ')}`);
      }

      // Run all analyzers
      const findings = await this.runAnalyzers(options);
      
      // Calculate overall score
      const score = this.calculateScore(findings);
      
      // Generate reports
      const reports = await this.generateReports(findings, score, options);
      
      this.results = {
        findings,
        reports,
        score: score.overall,
        grade: score.grade
      };

      console.log(`✅ Analysis complete! Score: ${score.overall}/100 (${score.grade})`);
      
      return this.results;
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      throw error;
    }
  }

  /**
   * Run all configured analyzers
   */
  async runAnalyzers(options = {}) {
    const findings = {};
    const enabledAnalyzers = this.configManager.getEnabledAnalyzers();
    
    console.log(`📋 Running ${enabledAnalyzers.length} analyzers...`);

    for (const analyzerName of enabledAnalyzers) {
      try {
        console.log(`  🔍 Running ${analyzerName}...`);
        
        switch (analyzerName) {
          case 'eslint':
            findings.eslint = await this.analyzer.checkESLint();
            break;
          case 'typescript':
            findings.typescript = await this.analyzer.checkTypeScript();
            break;
          case 'security':
            findings.security = await this.analyzer.checkSecurity();
            break;
          case 'tests':
            findings.tests = await this.analyzer.checkTests();
            break;
          case 'complexity':
            findings.complexity = await this.analyzer.analyzeComplexity();
            break;
          case 'custom-rules':
            findings.customRules = await this.analyzer.checkCustomRules(this.ruleEngine);
            break;
          case 'dependencies':
            findings.dependencies = await this.analyzer.checkDependencies();
            break;
          case 'coverage':
            findings.coverage = await this.analyzer.checkCoverage();
            break;
          case 'performance':
            findings.performance = await this.analyzer.checkPerformance();
            break;
          case 'architecture':
            findings.architecture = await this.analyzer.checkArchitecture();
            break;
          case 'bug-detection':
            findings.bugDetection = await this.analyzer.checkBugDetection();
            break;
          case 'test-cases':
            findings.testCases = await this.analyzer.checkTestCases();
            break;
          default:
            console.warn(`⚠️  Unknown analyzer: ${analyzerName}`);
        }
      } catch (error) {
        console.error(`❌ ${analyzerName} analyzer failed:`, error.message);
        findings[analyzerName] = {
          success: false,
          error: error.message
        };
      }
    }

    return findings;
  }

  /**
   * Calculate overall quality score
   */
  calculateScore(findings) {
    let totalScore = 0;
    let maxScore = 0;
    const weights = {
      eslint: 12,
      typescript: 12,
      security: 20,
      tests: 10,
      complexity: 8,
      dependencies: 8,
      coverage: 8,
      performance: 8,
      architecture: 5,
      'bug-detection': 15,
      'test-cases': 12
    };

    Object.entries(weights).forEach(([analyzer, weight]) => {
      maxScore += weight;
      
      if (findings[analyzer] && findings[analyzer].success !== false) {
        const analyzerScore = this.getAnalyzerScore(analyzer, findings[analyzer]);
        totalScore += (analyzerScore / 100) * weight;
      }
    });

    const overall = Math.round((totalScore / maxScore) * 100);
    const grade = this.getGrade(overall);

    return {
      overall,
      grade,
      breakdown: this.getScoreBreakdown(findings, weights)
    };
  }

  /**
   * Get score for individual analyzer
   */
  getAnalyzerScore(analyzer, findings) {
    switch (analyzer) {
      case 'eslint':
        // Score based on number of errors/warnings
        const issues = (findings.errors || 0) + (findings.warnings || 0) * 0.5;
        return Math.max(0, 100 - issues * 2);
      
      case 'typescript':
        return findings.errors > 0 ? 0 : 100;
      
      case 'security':
        const vulns = findings.vulnerabilities || 0;
        return Math.max(0, 100 - vulns * 20);
      
      case 'tests':
        const coverage = findings.coverage || 0;
        return Math.min(100, coverage);
      
      case 'complexity':
        return findings.score || 100;
      
      case 'dependencies':
        let depScore = 100;
        if (findings.circularDependencies && !findings.circularDependencies.success) {
          depScore -= 30;
        }
        if (findings.outdatedPackages && !findings.outdatedPackages.success) {
          depScore -= 20;
        }
        if (findings.securityVulnerabilities && !findings.securityVulnerabilities.success) {
          depScore -= 50;
        }
        return Math.max(0, depScore);
      
      case 'coverage':
        if (findings.coverage && findings.coverage.statements) {
          return Math.min(100, findings.coverage.statements.pct);
        }
        return findings.success ? 100 : 0;
      
      case 'performance':
        let perfScore = 100;
        if (findings.performanceIssues) {
          perfScore -= findings.performanceIssues.length * 10;
        }
        return Math.max(0, perfScore);
      
      case 'architecture':
        let archScore = 100;
        if (findings.antiPatterns) {
          archScore -= findings.antiPatterns.length * 15;
        }
        return Math.max(0, archScore);
      
      case 'bug-detection':
        let bugScore = 100;
        if (findings.bugs) {
          bugScore -= findings.bugs.length * 25; // Critical bugs heavily penalized
        }
        if (findings.potentialIssues) {
          bugScore -= findings.potentialIssues.length * 5;
        }
        if (findings.securityRisks) {
          bugScore -= findings.securityRisks.length * 30; // Security risks heavily penalized
        }
        if (findings.performanceIssues) {
          bugScore -= findings.performanceIssues.length * 10;
        }
        return Math.max(0, bugScore);
      
      case 'test-cases':
        let testScore = 100;
        if (findings.missingTests) {
          testScore -= findings.missingTests.length * 10;
        }
        if (findings.testQuality) {
          const poorQualityTests = findings.testQuality.filter(t => t.quality === 'POOR').length;
          testScore -= poorQualityTests * 20;
        }
        if (findings.coverage && findings.coverage.statements) {
          testScore = Math.min(testScore, findings.coverage.statements.pct);
        }
        return Math.max(0, testScore);
      
      default:
        return 100;
    }
  }

  /**
   * Get letter grade from numeric score
   */
  getGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Get detailed score breakdown
   */
  getScoreBreakdown(findings, weights) {
    const breakdown = {};
    
    Object.entries(weights).forEach(([analyzer, weight]) => {
      if (findings[analyzer]) {
        breakdown[analyzer] = {
          score: this.getAnalyzerScore(analyzer, findings[analyzer]),
          weight,
          findings: findings[analyzer]
        };
      }
    });

    return breakdown;
  }

  /**
   * Generate all configured reports
   */
  async generateReports(findings, score, options = {}) {
    const reports = {};
    // Use command line reporters if provided, otherwise use config
    const enabledReporters = options.reporters || this.configManager.getEnabledReporters();
    
    console.log(`📊 Generating ${enabledReporters.length} reports...`);

    for (const reporterName of enabledReporters) {
      try {
        switch (reporterName) {
          case 'html':
            reports.html = await this.reporter.generateHTMLReport(findings, score);
            break;
          case 'json':
            reports.json = await this.reporter.generateJSONReport(findings, score);
            break;
          case 'markdown':
            reports.markdown = await this.reporter.generateMarkdownReport(findings, score);
            break;
          case 'ai-prompts':
            // Generate enhanced Cursor AI prompts
            const aiPrompts = await this.analyzer.generateCursorAIPrompts(findings);
            reports.aiPrompts = await this.reporter.generateAIPrompts(findings, score, this.ruleEngine, aiPrompts);
            break;
          default:
            console.warn(`⚠️  Unknown reporter: ${reporterName}`);
        }
      } catch (error) {
        console.error(`❌ ${reporterName} reporter failed:`, error.message);
      }
    }

    return reports;
  }

  /**
   * Get current results
   */
  getResults() {
    return this.results;
  }

  /**
   * List available templates
   */
  listTemplates() {
    return this.templateManager.listTemplates();
  }

  /**
   * Get template details
   */
  getTemplate(templateName) {
    return this.templateManager.getTemplate(templateName);
  }
}

module.exports = CodeReviewTool;
