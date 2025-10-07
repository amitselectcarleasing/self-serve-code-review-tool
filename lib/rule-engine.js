const fs = require('fs');
const path = require('path');

/**
 * Rule Engine - manages and validates custom rules
 */
class RuleEngine {
  constructor(rulesConfig = {}) {
    this.rules = rulesConfig.rules || [];
    this.categories = rulesConfig.categories || {};
    this.metadata = rulesConfig.metadata || {};
    this.customPrompts = rulesConfig.customPrompts || {};
  }

  /**
   * Validate all rules for correctness
   */
  validateRules() {
    const errors = [];
    const warnings = [];
    const ruleIds = new Set();

    // Validate structure
    if (!Array.isArray(this.rules)) {
      errors.push('Rules must be an array');
      return { valid: false, errors, warnings };
    }

    // Validate each rule
    this.rules.forEach((rule, index) => {
      const ruleErrors = this.validateRule(rule, index);
      errors.push(...ruleErrors.errors);
      warnings.push(...ruleErrors.warnings);

      // Check for duplicate IDs
      if (rule.id) {
        if (ruleIds.has(rule.id)) {
          errors.push(`Duplicate rule ID: ${rule.id}`);
        } else {
          ruleIds.add(rule.id);
        }
      }
    });

    // Validate categories
    const categoryWarnings = this.validateCategories();
    warnings.push(...categoryWarnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      stats: {
        totalRules: this.rules.length,
        categories: Object.keys(this.categories).length,
        severityBreakdown: this.getSeverityBreakdown()
      }
    };
  }

  /**
   * Validate individual rule
   */
  validateRule(rule, index) {
    const errors = [];
    const warnings = [];
    const requiredFields = ['id', 'category', 'severity', 'description', 'pattern', 'suggestion'];

    // Check required fields
    for (const field of requiredFields) {
      if (!rule[field]) {
        errors.push(`Rule ${index}: Missing required field '${field}'`);
      }
    }

    // Validate severity
    const validSeverities = ['CRITICAL', 'ERROR', 'WARNING', 'INFO'];
    if (rule.severity && !validSeverities.includes(rule.severity)) {
      errors.push(`Rule ${rule.id}: Invalid severity '${rule.severity}'. Must be one of: ${validSeverities.join(', ')}`);
    }

    // Validate regex pattern
    if (rule.pattern) {
      try {
        new RegExp(rule.pattern);
      } catch (error) {
        errors.push(`Rule ${rule.id}: Invalid regex pattern: ${error.message}`);
      }
    }

    // Validate files array
    if (rule.files && !Array.isArray(rule.files)) {
      errors.push(`Rule ${rule.id}: 'files' must be an array`);
    }

    // Check for example structure
    if (rule.example) {
      if (!rule.example.bad || !rule.example.good) {
        warnings.push(`Rule ${rule.id}: Example should have both 'bad' and 'good' properties`);
      }
    } else {
      warnings.push(`Rule ${rule.id}: Consider adding an example for better documentation`);
    }

    return { errors, warnings };
  }

  /**
   * Validate categories
   */
  validateCategories() {
    const warnings = [];
    const validPriorities = ['HIGH', 'MEDIUM', 'LOW'];

    Object.entries(this.categories).forEach(([name, category]) => {
      if (!category.priority || !validPriorities.includes(category.priority)) {
        warnings.push(`Category ${name}: Invalid or missing priority. Should be one of: ${validPriorities.join(', ')}`);
      }

      if (!category.description) {
        warnings.push(`Category ${name}: Missing description`);
      }
    });

    return warnings;
  }

  /**
   * Get severity breakdown
   */
  getSeverityBreakdown() {
    const breakdown = {};
    
    this.rules.forEach(rule => {
      const severity = rule.severity || 'UNKNOWN';
      breakdown[severity] = (breakdown[severity] || 0) + 1;
    });

    return breakdown;
  }

  /**
   * Get rules by category
   */
  getRulesByCategory(categoryName) {
    return this.rules.filter(rule => rule.category === categoryName);
  }

  /**
   * Get rules by severity
   */
  getRulesBySeverity(severity) {
    return this.rules.filter(rule => rule.severity === severity);
  }

  /**
   * Get high priority rules (CRITICAL and ERROR)
   */
  getHighPriorityRules() {
    return this.rules.filter(rule => 
      rule.severity === 'CRITICAL' || rule.severity === 'ERROR'
    );
  }

  /**
   * Get rules that match specific file patterns
   */
  getRulesForFile(filePath) {
    return this.rules.filter(rule => {
      if (!rule.files || rule.files.length === 0) {
        return true; // Rule applies to all files if no files specified
      }

      return rule.files.some(pattern => {
        // Convert glob pattern to regex
        const regex = new RegExp(
          pattern
            .replace(/\*\*/g, '.*')
            .replace(/\*/g, '[^/]*')
            .replace(/\?/g, '.')
        );
        return regex.test(filePath);
      });
    });
  }

  /**
   * Generate focused analysis prompts for AI
   */
  generateAIPrompts() {
    const highPriorityRules = this.getHighPriorityRules();
    const securityRules = this.getRulesByCategory('security');
    const performanceRules = this.getRulesByCategory('performance');

    return {
      focusedAnalysis: this.generateFocusedPrompt(highPriorityRules),
      securityAnalysis: this.generateCategoryPrompt('security', securityRules),
      performanceAnalysis: this.generateCategoryPrompt('performance', performanceRules),
      customPrompts: this.customPrompts
    };
  }

  /**
   * Generate focused analysis prompt
   */
  generateFocusedPrompt(rules) {
    const rulesList = rules.map(rule => 
      `- **${rule.id}** (${rule.severity}): ${rule.description}`
    ).join('\n');

    return `Analyze the codebase focusing ONLY on the rules defined below. For each rule violation found, provide: 1) Exact line number, 2) Rule ID violated, 3) Specific fix suggestion, 4) Impact assessment.

**Rules to Check (${rules.length} total):**
${rulesList}

**Instructions:**
1. Check ONLY the rules listed above
2. Provide exact line numbers for violations
3. Include rule ID and specific fix for each issue
4. Focus on CRITICAL and ERROR severity first`;
  }

  /**
   * Generate category-specific prompt
   */
  generateCategoryPrompt(categoryName, rules) {
    const categoryInfo = this.categories[categoryName] || {};
    const rulesList = rules.map(rule => 
      `- **${rule.id}**: ${rule.description}`
    ).join('\n');

    return `Analyze only ${categoryName}-related rules from the custom rule set.

**Category Description:** ${categoryInfo.description || 'No description available'}

**${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} Rules to Check:**
${rulesList}

Focus on finding violations of these specific ${categoryName} rules and provide actionable fixes.`;
  }

  /**
   * Load rules from file
   */
  static loadFromFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const rulesConfig = JSON.parse(content);
      return new RuleEngine(rulesConfig);
    } catch (error) {
      throw new Error(`Failed to load rules from ${filePath}: ${error.message}`);
    }
  }

  /**
   * Save rules to file
   */
  saveToFile(filePath) {
    const rulesConfig = {
      metadata: this.metadata,
      categories: this.categories,
      rules: this.rules,
      customPrompts: this.customPrompts
    };

    try {
      fs.writeFileSync(filePath, JSON.stringify(rulesConfig, null, 2));
      return true;
    } catch (error) {
      throw new Error(`Failed to save rules to ${filePath}: ${error.message}`);
    }
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    const severityBreakdown = this.getSeverityBreakdown();
    const categoryBreakdown = {};
    
    this.rules.forEach(rule => {
      const category = rule.category || 'uncategorized';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
    });

    return {
      totalRules: this.rules.length,
      categories: Object.keys(this.categories).length,
      severityBreakdown,
      categoryBreakdown,
      highPriorityRules: this.getHighPriorityRules().length
    };
  }

  /**
   * Add new rule
   */
  addRule(rule) {
    // Validate rule before adding
    const validation = this.validateRule(rule, this.rules.length);
    if (validation.errors.length > 0) {
      throw new Error(`Invalid rule: ${validation.errors.join(', ')}`);
    }

    // Check for duplicate ID
    if (this.rules.some(existingRule => existingRule.id === rule.id)) {
      throw new Error(`Rule with ID '${rule.id}' already exists`);
    }

    this.rules.push(rule);
    return true;
  }

  /**
   * Remove rule by ID
   */
  removeRule(ruleId) {
    const index = this.rules.findIndex(rule => rule.id === ruleId);
    if (index === -1) {
      throw new Error(`Rule with ID '${ruleId}' not found`);
    }

    this.rules.splice(index, 1);
    return true;
  }

  /**
   * Update existing rule
   */
  updateRule(ruleId, updates) {
    const index = this.rules.findIndex(rule => rule.id === ruleId);
    if (index === -1) {
      throw new Error(`Rule with ID '${ruleId}' not found`);
    }

    const updatedRule = { ...this.rules[index], ...updates };
    
    // Validate updated rule
    const validation = this.validateRule(updatedRule, index);
    if (validation.errors.length > 0) {
      throw new Error(`Invalid rule update: ${validation.errors.join(', ')}`);
    }

    this.rules[index] = updatedRule;
    return true;
  }
}

module.exports = RuleEngine;
