const fs = require('fs');
const path = require('path');

/**
 * Report Generator - generates various types of reports from analysis results
 */
class ReportGenerator {
  constructor(configManager) {
    this.config = configManager;
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  }

  /**
   * Generate HTML report
   */
  async generateHTMLReport(findings, score) {
    const outputDir = this.config.getOutputDir();
    const reportPath = path.join(outputDir, 'code-review-report.html');
    
    const htmlContent = this.createHTMLContent(findings, score);
    
    fs.writeFileSync(reportPath, htmlContent);
    
    console.log(`📊 HTML Report: ${reportPath}`);
    
    return {
      type: 'html',
      path: reportPath,
      size: fs.statSync(reportPath).size
    };
  }

  /**
   * Generate JSON report
   */
  async generateJSONReport(findings, score) {
    const outputDir = this.config.getOutputDir();
    const reportPath = path.join(outputDir, `code-review-report-${this.timestamp}.json`);
    
    const reportData = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        tool: '@self-serve/code-review-tool',
        project: path.basename(this.config.projectRoot),
        config: this.config.getSummary()
      },
      score,
      findings,
      summary: this.generateSummary(findings, score)
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    console.log(`📊 JSON Report: ${reportPath}`);
    
    return {
      type: 'json',
      path: reportPath,
      data: reportData
    };
  }

  /**
   * Generate Markdown report
   */
  async generateMarkdownReport(findings, score) {
    const outputDir = this.config.getOutputDir();
    const reportPath = path.join(outputDir, `code-review-summary-${this.timestamp}.md`);
    
    const markdownContent = this.createMarkdownContent(findings, score);
    
    fs.writeFileSync(reportPath, markdownContent);
    
    console.log(`📊 Markdown Report: ${reportPath}`);
    
    return {
      type: 'markdown',
      path: reportPath,
      size: fs.statSync(reportPath).size
    };
  }

  /**
   * Generate AI prompts for Cursor
   */
  async generateAIPrompts(findings, score, ruleEngine) {
    const outputDir = this.config.getOutputDir();
    const promptsPath = path.join(outputDir, `cursor-ai-prompts-${this.timestamp}.md`);
    
    const promptsContent = this.createAIPromptsContent(findings, score, ruleEngine);
    
    fs.writeFileSync(promptsPath, promptsContent);
    
    console.log(`🤖 AI Prompts: ${promptsPath}`);
    
    return {
      type: 'ai-prompts',
      path: promptsPath,
      size: fs.statSync(promptsPath).size
    };
  }

  /**
   * Generate AI Review Summary MD file
   */
  async generateAISummaryMD(findings, score, aiAnalysis, aiRecommendations) {
    const outputDir = this.config.getOutputDir();
    const summaryPath = path.join(outputDir, `ai-review-summary-${this.timestamp}.md`);
    
    const summaryContent = this.createAISummaryContent(findings, score, aiAnalysis, aiRecommendations);
    
    fs.writeFileSync(summaryPath, summaryContent);
    
    console.log(`🤖 AI Review Summary: ${summaryPath}`);
    
    return {
      type: 'ai-summary',
      path: summaryPath,
      size: fs.statSync(summaryPath).size
    };
  }

  /**
   * Create HTML content
   */
  createHTMLContent(findings, score) {
    const projectName = path.basename(this.config.projectRoot);
    const configSummary = this.config.getSummary();
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Review Report - ${projectName}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header .subtitle { opacity: 0.9; margin-top: 10px; }
        .content { padding: 30px; }
        .score-card { background: ${this.getScoreColor(score.overall)}; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px; }
        .score-card .score { font-size: 3em; font-weight: bold; margin: 0; }
        .score-card .grade { font-size: 1.5em; opacity: 0.9; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        .analyzer-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .analyzer-card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; }
        .analyzer-card.success { border-left: 4px solid #4CAF50; }
        .analyzer-card.warning { border-left: 4px solid #FF9800; }
        .analyzer-card.error { border-left: 4px solid #f44336; }
        .analyzer-card h3 { margin-top: 0; color: #333; }
        .stat { display: inline-block; margin-right: 20px; }
        .stat-value { font-weight: bold; font-size: 1.2em; }
        .issues-list { max-height: 300px; overflow-y: auto; }
        .issue { padding: 10px; border-bottom: 1px solid #eee; }
        .issue:last-child { border-bottom: none; }
        .issue-severity { padding: 2px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
        .severity-error { background: #ffebee; color: #c62828; }
        .severity-warning { background: #fff3e0; color: #ef6c00; }
        .severity-info { background: #e3f2fd; color: #1565c0; }
        .footer { text-align: center; padding: 20px; color: #666; border-top: 1px solid #eee; }
        .recommendations { background: #f8f9fa; border-radius: 8px; padding: 20px; }
        .recommendation { margin-bottom: 15px; padding: 15px; background: white; border-radius: 4px; border-left: 4px solid #2196F3; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Code Review Report</h1>
            <div class="subtitle">
                Project: ${projectName} | Generated: ${new Date().toLocaleString()} | Template: ${configSummary.template}
            </div>
        </div>
        
        <div class="content">
            <div class="score-card">
                <div class="score">${score.overall}/100</div>
                <div class="grade">Grade: ${score.grade}</div>
            </div>
            
            <div class="section">
                <h2>📋 Analysis Summary</h2>
                <div class="analyzer-grid">
                    ${this.generateAnalyzerCards(findings)}
                </div>
            </div>
            
            ${this.generateIssuesSection(findings)}
            
            ${this.generateRecommendationsSection(score)}
            
            <div class="section">
                <h2>⚙️ Configuration</h2>
                <p><strong>Template:</strong> ${configSummary.template}</p>
                <p><strong>Analyzers:</strong> ${configSummary.analyzers} enabled</p>
                <p><strong>Reporters:</strong> ${configSummary.reporters} enabled</p>
                <p><strong>Rules:</strong> ${configSummary.rules} custom rules</p>
                <p><strong>AI Integration:</strong> ${configSummary.aiEnabled ? '✅ Enabled' : '❌ Disabled'}</p>
            </div>
        </div>
        
        <div class="footer">
            Generated by @self-serve/code-review-tool v1.0.0
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Create Markdown content
   */
  createMarkdownContent(findings, score) {
    const projectName = path.basename(this.config.projectRoot);
    const configSummary = this.config.getSummary();
    
    return `# 📊 Code Review Report

**Project:** ${projectName}  
**Generated:** ${new Date().toLocaleString()}  
**Template:** ${configSummary.template}  
**Overall Score:** ${score.overall}/100 (${score.grade})

---

## 📋 Analysis Summary

${Object.entries(findings).map(([analyzer, result]) => {
  if (!result || result.success === false) return '';
  
  const status = this.getAnalyzerStatus(analyzer, result);
  const icon = status === 'success' ? '✅' : status === 'warning' ? '⚠️' : '❌';
  
  return `### ${icon} ${analyzer.charAt(0).toUpperCase() + analyzer.slice(1)}

${this.getAnalyzerSummary(analyzer, result)}`;
}).filter(Boolean).join('\n\n')}

---

## 🎯 Recommendations

${this.generateMarkdownRecommendations(score)}

---

## ⚙️ Configuration

- **Template:** ${configSummary.template}
- **Analyzers:** ${configSummary.analyzers} enabled
- **Reporters:** ${configSummary.reporters} enabled  
- **Rules:** ${configSummary.rules} custom rules
- **AI Integration:** ${configSummary.aiEnabled ? '✅ Enabled' : '❌ Disabled'}

---

*Generated by @self-serve/code-review-tool v1.0.0*`;
  }

  /**
   * Create AI prompts content
   */
  createAIPromptsContent(findings, score, ruleEngine) {
    const projectName = path.basename(this.config.projectRoot);
    const hasCustomRules = ruleEngine && ruleEngine.rules && ruleEngine.rules.length > 0;
    
    let content = `# 🤖 Cursor AI Analysis Prompts
## Generated: ${new Date().toLocaleString()}

**Project:** ${projectName}  
**Overall Score:** ${score.overall}/100 (${score.grade})

---

## 📊 Static Analysis Summary

${Object.entries(findings).map(([analyzer, result]) => {
  if (!result || result.success === false) return '';
  return `- **${analyzer.charAt(0).toUpperCase() + analyzer.slice(1)}:** ${this.getAnalyzerSummary(analyzer, result)}`;
}).filter(Boolean).join('\n')}

---

`;

    // Add custom rules section if available
    if (hasCustomRules) {
      const aiPrompts = ruleEngine.generateAIPrompts();
      
      content += `## 🎯 Custom Rule-Based Analysis (RECOMMENDED)

### **Focused Analysis Using Your Custom Rules:**
\`\`\`
@codebase Custom Rule Analysis

${aiPrompts.focusedAnalysis}
\`\`\`

### **Security-Focused Analysis:**
\`\`\`
@codebase Security Rule Analysis

${aiPrompts.securityAnalysis}
\`\`\`

### **Performance-Focused Analysis:**
\`\`\`
@codebase Performance Rule Analysis

${aiPrompts.performanceAnalysis}
\`\`\`

---

`;
    }

    // Add general analysis prompts
    content += `## 🔍 General AI Analysis Prompts

### **1. 🧹 Code Quality Issues**
\`\`\`
@codebase Code Quality Analysis

Based on the static analysis results showing ${score.overall}/100 quality score, please identify:

1. **High-impact issues** that are affecting the quality score
2. **Code smells** and anti-patterns
3. **Maintainability concerns** 
4. **Performance bottlenecks**

Focus on issues that would provide the biggest improvement to code quality.
\`\`\`

### **2. 🔒 Security Review**
\`\`\`
@codebase Security Analysis

Review this codebase for security vulnerabilities:

1. **Authentication/Authorization** flaws
2. **Input validation** issues  
3. **Data exposure** risks
4. **Injection vulnerabilities**
5. **Configuration security** problems

${findings.security ? `Current security scan found ${findings.security.vulnerabilities || 0} vulnerabilities.` : ''}
\`\`\`

### **3. 🧪 Test Coverage Analysis**
\`\`\`
@codebase Test Coverage Review

Analyze test coverage and suggest improvements:

1. **Missing test cases** for critical functionality
2. **Edge cases** that should be tested
3. **Integration test** opportunities
4. **Test quality** improvements

${findings.tests ? `Current coverage: ${findings.tests.coverage || 0}%` : 'No test coverage data available.'}
\`\`\`

### **4. 🚀 Performance Optimization**
\`\`\`
@codebase Performance Analysis

Review for performance optimization opportunities:

1. **Algorithmic improvements**
2. **Memory usage** optimization
3. **Database query** efficiency
4. **Caching** opportunities
5. **Bundle size** reduction

Focus on changes that would have measurable performance impact.
\`\`\`

### **5. 🏗️ Architecture Review**
\`\`\`
@codebase Architecture Analysis

Review the overall architecture and suggest improvements:

1. **Design patterns** usage and consistency
2. **Code organization** and structure
3. **Dependency management**
4. **Separation of concerns**
5. **Scalability** considerations

Suggest specific refactoring opportunities that would improve maintainability.
\`\`\`

---

## 🔄 Usage Instructions

1. **Copy any prompt above** into Cursor AI using the \`@codebase\` command
2. **Start with custom rules** if available (highest priority)
3. **Focus on high-impact issues** first
4. **Implement suggestions** and re-run analysis to measure improvement

## 📈 Expected Improvements

After implementing AI suggestions:
- **Target Score:** ${Math.min(100, score.overall + 20)}/100
- **Focus Areas:** ${this.getTopIssueAreas(findings).join(', ')}
- **Priority:** ${hasCustomRules ? 'Custom rule violations' : 'General code quality issues'}

---

*Generated by @self-serve/code-review-tool v1.0.0*`;

    return content;
  }

  /**
   * Generate analyzer cards for HTML
   */
  generateAnalyzerCards(findings) {
    return Object.entries(findings).map(([analyzer, result]) => {
      if (!result) return '';
      
      const status = this.getAnalyzerStatus(analyzer, result);
      const summary = this.getAnalyzerSummary(analyzer, result);
      
      return `
        <div class="analyzer-card ${status}">
          <h3>${analyzer.charAt(0).toUpperCase() + analyzer.slice(1)}</h3>
          <p>${summary}</p>
          ${this.getAnalyzerStats(analyzer, result)}
        </div>
      `;
    }).join('');
  }

  /**
   * Generate issues section for HTML
   */
  generateIssuesSection(findings) {
    const hasIssues = Object.values(findings).some(result => 
      result && (result.errors > 0 || result.warnings > 0 || result.violations > 0)
    );
    
    if (!hasIssues) {
      return '<div class="section"><h2>🎉 No Issues Found</h2><p>Great job! No significant issues were detected.</p></div>';
    }
    
    return `
      <div class="section">
        <h2>⚠️ Issues Found</h2>
        ${Object.entries(findings).map(([analyzer, result]) => {
          if (!result || !result.details || result.details.length === 0) return '';
          
          return `
            <h3>${analyzer.charAt(0).toUpperCase() + analyzer.slice(1)} Issues</h3>
            <div class="issues-list">
              ${result.details.slice(0, 10).map(issue => `
                <div class="issue">
                  <span class="issue-severity severity-${issue.severity || 'info'}">${issue.severity || 'info'}</span>
                  <strong>${issue.file || 'Unknown file'}</strong>
                  ${issue.line ? ` (line ${issue.line})` : ''}
                  <br>
                  ${issue.message || issue.description || 'No description'}
                  ${issue.rule ? `<br><small>Rule: ${issue.rule}</small>` : ''}
                </div>
              `).join('')}
              ${result.details.length > 10 ? `<div class="issue"><em>... and ${result.details.length - 10} more issues</em></div>` : ''}
            </div>
          `;
        }).filter(Boolean).join('')}
      </div>
    `;
  }

  /**
   * Generate recommendations section
   */
  generateRecommendationsSection(score) {
    const recommendations = this.generateRecommendations(score);
    
    return `
      <div class="section">
        <h2>💡 Recommendations</h2>
        <div class="recommendations">
          ${recommendations.map(rec => `
            <div class="recommendation">
              <strong>${rec.title}</strong>
              <p>${rec.description}</p>
              ${rec.action ? `<p><em>Action: ${rec.action}</em></p>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Get analyzer status
   */
  getAnalyzerStatus(analyzer, result) {
    if (result.success === false) return 'error';
    
    switch (analyzer) {
      case 'eslint':
        return result.errors > 0 ? 'error' : result.warnings > 0 ? 'warning' : 'success';
      case 'typescript':
        return result.errors > 0 ? 'error' : 'success';
      case 'security':
        return result.vulnerabilities > 0 ? 'error' : 'success';
      case 'tests':
        return result.coverage < 70 ? 'warning' : 'success';
      default:
        return 'success';
    }
  }

  /**
   * Get analyzer summary
   */
  getAnalyzerSummary(analyzer, result) {
    if (result.success === false) {
      return `❌ Failed: ${result.error || 'Unknown error'}`;
    }
    
    switch (analyzer) {
      case 'eslint':
        return `${result.errors || 0} errors, ${result.warnings || 0} warnings`;
      case 'typescript':
        return result.errors > 0 ? `${result.errors} type errors` : 'No type errors';
      case 'security':
        return `${result.vulnerabilities || 0} vulnerabilities found`;
      case 'tests':
        // Normalize coverage shape
        {
          let cov = 0;
          if (typeof result.coverage === 'number') cov = result.coverage;
          else if (result.coverage && typeof result.coverage === 'object') cov = (result.coverage.statements?.pct ?? result.coverage.statements ?? 0);
          return `${cov}% coverage`;
        }
      case 'complexity':
        return `Score: ${result.score || 100}/100`;
      case 'customRules':
        return `${result.violations || 0} rule violations`;
      default:
        return 'Analysis completed';
    }
  }

  /**
   * Get analyzer stats HTML
   */
  getAnalyzerStats(analyzer, result) {
    const stats = [];
    
    if (result.errors !== undefined) stats.push(`<span class="stat"><span class="stat-value">${result.errors}</span> errors</span>`);
    if (result.warnings !== undefined) stats.push(`<span class="stat"><span class="stat-value">${result.warnings}</span> warnings</span>`);
    if (result.vulnerabilities !== undefined) stats.push(`<span class="stat"><span class="stat-value">${result.vulnerabilities}</span> vulnerabilities</span>`);
    if (result.coverage !== undefined) {
      let cov = 0;
      if (typeof result.coverage === 'number') cov = result.coverage;
      else if (result.coverage && typeof result.coverage === 'object') cov = (result.coverage.statements?.pct ?? result.coverage.statements ?? 0);
      stats.push(`<span class="stat"><span class="stat-value">${cov}%</span> coverage</span>`);
    }
    if (result.violations !== undefined) stats.push(`<span class="stat"><span class="stat-value">${result.violations}</span> violations</span>`);
    
    return stats.length > 0 ? `<div>${stats.join('')}</div>` : '';
  }

  /**
   * Get score color
   */
  getScoreColor(score) {
    if (score >= 90) return '#4CAF50';
    if (score >= 80) return '#8BC34A';
    if (score >= 70) return '#FFC107';
    if (score >= 60) return '#FF9800';
    return '#f44336';
  }

  /**
   * Generate summary
   */
  generateSummary(findings, score) {
    const totalIssues = Object.values(findings).reduce((sum, result) => {
      if (!result) return sum;
      return sum + (result.errors || 0) + (result.warnings || 0) + (result.violations || 0);
    }, 0);
    
    return {
      totalIssues,
      criticalIssues: Object.values(findings).reduce((sum, result) => sum + (result.errors || 0), 0),
      passedAnalyzers: Object.values(findings).filter(result => result && result.success !== false).length,
      failedAnalyzers: Object.values(findings).filter(result => result && result.success === false).length,
      overallGrade: score.grade,
      needsImprovement: score.overall < 80
    };
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(score) {
    const recommendations = [];
    
    if (score.overall < 60) {
      recommendations.push({
        title: '🚨 Critical Quality Issues',
        description: 'Your code quality score is below 60%. Focus on fixing critical errors first.',
        action: 'Run individual analyzers to identify and fix the most serious issues.'
      });
    }
    
    if (score.breakdown?.eslint?.score < 80) {
      recommendations.push({
        title: '🔧 ESLint Issues',
        description: 'Multiple linting issues detected. These affect code consistency and maintainability.',
        action: 'Run `npm run lint:fix` to automatically fix many issues.'
      });
    }
    
    if (score.breakdown?.tests?.score < 70) {
      recommendations.push({
        title: '🧪 Test Coverage',
        description: 'Test coverage is below recommended threshold (70%).',
        action: 'Add unit tests for critical business logic and edge cases.'
      });
    }
    
    if (score.breakdown?.security?.score < 100) {
      recommendations.push({
        title: '🔒 Security Vulnerabilities',
        description: 'Security vulnerabilities detected in dependencies.',
        action: 'Run `npm audit fix` to update vulnerable packages.'
      });
    }
    
    if (recommendations.length === 0) {
      recommendations.push({
        title: '🎉 Great Job!',
        description: 'Your code quality is excellent. Consider these enhancements:',
        action: 'Add more comprehensive tests, improve documentation, or optimize performance.'
      });
    }
    
    return recommendations;
  }

  /**
   * Generate markdown recommendations
   */
  generateMarkdownRecommendations(score) {
    const recommendations = this.generateRecommendations(score);
    
    return recommendations.map(rec => `
### ${rec.title}

${rec.description}

${rec.action ? `**Action:** ${rec.action}` : ''}
`).join('\n');
  }

  /**
   * Get top issue areas
   */
  getTopIssueAreas(findings) {
    const areas = [];
    
    Object.entries(findings).forEach(([analyzer, result]) => {
      if (!result) return;
      
      if (result.errors > 0 || result.warnings > 5) {
        areas.push(analyzer);
      }
    });
    
    return areas.length > 0 ? areas : ['code quality'];
  }

  /**
   * Create AI Summary content
   */
  createAISummaryContent(findings, score, aiAnalysis, aiRecommendations) {
    const timestamp = new Date().toISOString();
    const projectName = path.basename(this.config.projectRoot);
    
    return `# AI Code Review Summary

**Project:** ${projectName}  
**Generated:** ${timestamp}  
**Overall Score:** ${score.overall}/100 (${score.grade})  
**Priority Level:** ${aiAnalysis.summary?.priority || 'MEDIUM'}

## 📊 Analysis Overview

### Quality Metrics
- **ESLint Issues:** ${findings.eslint?.errors || 0} errors, ${findings.eslint?.warnings || 0} warnings
- **TypeScript Issues:** ${findings.typescript?.errors || 0} errors
- **Security Vulnerabilities:** ${findings.security?.vulnerabilities || 0}
- **Test Coverage:** ${findings.tests?.coverage?.statements?.pct || findings.tests?.coverage || 0}%
- **Performance Issues:** ${findings.performance?.performanceIssues?.length || 0}
- **Architecture Issues:** ${findings.architecture?.antiPatterns?.length || 0}

### AI Analysis Summary
- **Critical Issues:** ${aiAnalysis.summary?.criticalIssues || 0}
- **Code Improvements:** ${aiAnalysis.summary?.codeImprovements || 0}
- **Security Fixes:** ${aiAnalysis.summary?.securityFixes || 0}
- **Test Suggestions:** ${aiAnalysis.summary?.testSuggestions || 0}
- **Refactoring Suggestions:** ${aiAnalysis.summary?.refactoringSuggestions || 0}

## 🔴 Critical Issues

${aiAnalysis.criticalIssues?.length > 0 ? 
  aiAnalysis.criticalIssues.map(issue => `- **${issue.category}:** ${issue.description}`).join('\n') : 
  'No critical issues found.'}

## 🟡 Code Improvements

${aiAnalysis.codeImprovements?.length > 0 ? 
  aiAnalysis.codeImprovements.map(improvement => `- **${improvement.category}:** ${improvement.description}`).join('\n') : 
  'No code improvements suggested.'}

## 🔒 Security Fixes

${aiAnalysis.securityFixes?.length > 0 ? 
  aiAnalysis.securityFixes.map(fix => `- **${fix.category}:** ${fix.description}`).join('\n') : 
  'No security fixes needed.'}

## 🧪 Test Suggestions

${aiAnalysis.testSuggestions?.length > 0 ? 
  aiAnalysis.testSuggestions.map(suggestion => `- **${suggestion.category}:** ${suggestion.description}`).join('\n') : 
  'No test suggestions provided.'}

## ♻️ Refactoring Suggestions

${aiAnalysis.refactoringSuggestions?.length > 0 ? 
  aiAnalysis.refactoringSuggestions.map(suggestion => `- **${suggestion.category}:** ${suggestion.description}`).join('\n') : 
  'No refactoring suggestions provided.'}

## 💡 Top Recommendations

${aiRecommendations?.length > 0 ? 
  aiRecommendations.slice(0, 5).map((rec, index) => `
### ${index + 1}. ${rec.category} - ${rec.priority} Priority

**Issue:** ${rec.issue}  
**Suggestion:** ${rec.suggestion}  
${rec.action ? `**Action:** ${rec.action}` : ''}
`).join('\n') : 
  'No specific recommendations available.'}

## 📈 Next Steps

1. **Immediate Actions:** Address critical issues first
2. **Code Quality:** Implement suggested code improvements
3. **Security:** Apply security fixes
4. **Testing:** Add suggested test cases
5. **Refactoring:** Consider architectural improvements

## 📊 Detailed Report

For a complete analysis with charts and detailed findings, see the HTML report: \`code-review-report.html\`

---
*Generated by Self-Serve Code Review Tool v1.0.0*
`;
  }
}

module.exports = ReportGenerator;
