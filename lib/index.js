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
      eslint: 15,
      typescript: 15,
      security: 25,
      'test-cases': 10,  // Test cases worth 10 points (weighted coverage inside analyzer)
      complexity: 10,
      dependencies: 10,
      performance: 10,
      architecture: 10,
      'bug-detection': 10
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
   * Calculate weighted test score based on file type priorities
   * Core business logic (controllers, services, utils, config, validation): 80% weight (8 points out of 10)
   * Infrastructure code (routes, middleware): 20% weight (2 points out of 10)
   */
  calculateWeightedTestScore(findings) {
    // Check if we have weighted coverage data
    if (findings.weightedCoverage && findings.weightedCoverage.weightedScore !== undefined) {
      console.log(`🎯 Using weighted test score: ${findings.weightedCoverage.weightedScore}%`);
      console.log(`   Core Logic Coverage: ${findings.weightedCoverage.coreLogicCoverage}% (${findings.weightedCoverage.coreLogicFiles} files) - ${findings.weightedCoverage.breakdown.coreLogic.points} points`);
      console.log(`   Infrastructure Coverage: ${findings.weightedCoverage.infrastructureCoverage}% (${findings.weightedCoverage.infrastructureFiles} files) - ${findings.weightedCoverage.breakdown.infrastructure.points} points`);
      console.log(`   Total Test Points: ${(findings.weightedCoverage.breakdown.coreLogic.points + findings.weightedCoverage.breakdown.infrastructure.points).toFixed(1)}/10`);
      return Math.min(100, findings.weightedCoverage.weightedScore);
    }
    
    // Fallback to standard coverage calculation
    let statementsCoverage = findings.coverage?.statements || 0;
    
    // If we have detailed coverage data, calculate weighted score
    if (findings.coverage && typeof findings.coverage === 'object') {
      statementsCoverage = findings.coverage.statements || 0;
    }
    
    // Apply weighting logic:
    // - If core business logic is well tested (>=70%), give high score
    // - If infrastructure is missing tests but core logic is tested, still give good score
    // - If core business logic is poorly tested, penalize heavily
    
    if (statementsCoverage >= 70) {
      // Good coverage - apply 90% weight to core logic
      return Math.min(100, statementsCoverage * 1.1); // Slight boost for good coverage
    } else if (statementsCoverage >= 40) {
      // Moderate coverage - standard scoring
      return statementsCoverage;
    } else {
      // Poor coverage - penalize heavily
      return Math.max(0, statementsCoverage * 0.8);
    }
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
        if (findings.coverage && typeof findings.coverage === 'object') {
          // Calculate weighted coverage score
          const weightedScore = this.calculateWeightedTestScore(findings);
          return Math.min(100, weightedScore);
        }
        const coverage = findings.coverage || 0;
        return Math.min(100, coverage);
      
      case 'test-cases':
        // Use test-cases analyzer for weighted scoring
        if (findings.testCases && findings.testCases.weightedCoverage) {
          const weightedScore = this.calculateWeightedTestScore(findings.testCases);
          return Math.min(100, weightedScore);
        }
        return 0;
      
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
    
    // Determine if this is AI testing mode
    const isAITesting = options.aiAnalysis || options.aiPrompts || 
                       (options.reporters && (options.reporters.includes('ai-analysis') || options.reporters.includes('ai-prompts')));
    
    // Use command line reporters if provided, otherwise use config
    let enabledReporters = options.reporters || this.configManager.getEnabledReporters();
    
    // Override reporters based on testing mode
    if (isAITesting) {
      // For AI testing: HTML + AI summary MD
      enabledReporters = ['html', 'ai-summary'];
    } else {
      // For general testing: HTML only
      enabledReporters = ['html'];
    }
    
    console.log(`📊 Generating ${enabledReporters.length} reports...`);

    for (const reporterName of enabledReporters) {
      try {
        switch (reporterName) {
          case 'html':
            reports.html = await this.reporter.generateHTMLReport(findings, score);
            break;
          case 'ai-summary':
            // Generate AI review summary MD file
            const aiAnalysis = await this.analyzer.performAICodeAnalysis(findings);
            const aiRecommendations = this.analyzer.generateAIRecommendations(findings, score);
            reports.aiSummary = await this.reporter.generateAISummaryMD(findings, score, aiAnalysis, aiRecommendations);
            break;
          case 'json':
            // Only generate if explicitly requested
            if (options.reporters && options.reporters.includes('json')) {
              reports.json = await this.reporter.generateJSONReport(findings, score);
            }
            break;
          case 'markdown':
            // Only generate if explicitly requested
            if (options.reporters && options.reporters.includes('markdown')) {
              reports.markdown = await this.reporter.generateMarkdownReport(findings, score);
            }
            break;
          case 'ai-prompts':
            // Only generate if explicitly requested
            if (options.reporters && options.reporters.includes('ai-prompts')) {
              const aiPrompts = await this.analyzer.generateCursorAIPrompts(findings);
              reports.aiPrompts = await this.reporter.generateAIPrompts(findings, score, this.ruleEngine, aiPrompts);
            }
            break;
          case 'ai-analysis':
            // Only generate if explicitly requested
            if (options.reporters && options.reporters.includes('ai-analysis')) {
              const aiAnalysis = await this.analyzer.performAICodeAnalysis(findings);
              const aiRecommendations = this.analyzer.generateAIRecommendations(findings, score);
              reports.aiAnalysis = {
                analysis: aiAnalysis,
                recommendations: aiRecommendations,
                summary: this.generateAISummary(aiAnalysis, aiRecommendations)
              };
            }
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

  /**
   * Generate AI analysis summary
   */
  generateAISummary(aiAnalysis, recommendations) {
    const totalIssues = aiAnalysis.criticalIssues.length + 
                       aiAnalysis.codeImprovements.length + 
                       aiAnalysis.securityFixes.length;
    
    const totalSuggestions = aiAnalysis.testSuggestions.length + 
                            aiAnalysis.refactoringSuggestions.length;

    return {
      totalIssues,
      totalSuggestions,
      criticalIssues: aiAnalysis.criticalIssues.length,
      codeImprovements: aiAnalysis.codeImprovements.length,
      securityFixes: aiAnalysis.securityFixes.length,
      testSuggestions: aiAnalysis.testSuggestions.length,
      refactoringSuggestions: aiAnalysis.refactoringSuggestions.length,
      recommendations: recommendations.length,
      priority: totalIssues > 10 ? 'HIGH' : totalIssues > 5 ? 'MEDIUM' : 'LOW'
    };
  }
}

module.exports = CodeReviewTool;
