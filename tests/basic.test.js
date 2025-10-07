const CodeReviewTool = require('../lib/index');
const TemplateManager = require('../lib/template-manager');
const RuleEngine = require('../lib/rule-engine');

describe('Code Review Tool', () => {
  test('should create CodeReviewTool instance', () => {
    const tool = new CodeReviewTool();
    expect(tool).toBeInstanceOf(CodeReviewTool);
  });

  test('should list available templates', () => {
    const templateManager = new TemplateManager();
    const templates = templateManager.listTemplates();
    expect(Array.isArray(templates)).toBe(true);
    expect(templates.length).toBeGreaterThan(0);
  });

  test('should validate api-gateway template', () => {
    const templateManager = new TemplateManager();
    const validation = templateManager.validateTemplate('api-gateway');
    expect(validation.valid).toBe(true);
    expect(validation.template).toBe('api-gateway');
  });

  test('should load and validate rules', () => {
    const templateManager = new TemplateManager();
    const template = templateManager.getTemplate('api-gateway');
    const ruleEngine = new RuleEngine(template.rules);
    
    const validation = ruleEngine.validateRules();
    expect(validation.valid).toBe(true);
    expect(validation.stats.totalRules).toBeGreaterThan(0);
  });
});
