# 🚀 Developer Workflow: Local + Centralized Code Review

## 🎯 **Complete Developer Flow**

### **Phase 1: Local Development (Developer Machine)**

#### **1. Pre-commit Checks (Husky + lint-staged)**
```bash
# When developer commits code
git commit -m "feat: add new feature"

# Husky automatically runs:
# 1. ESLint --fix (auto-fix issues)
# 2. Prettier --write (format code)
# 3. TypeScript type check
# 4. Basic code review analysis
```

#### **2. Local Code Review Tool Integration**
```bash
# Developer runs before committing
npm run code-review:local

# This runs:
# - ESLint check
# - TypeScript check  
# - Basic security patterns
# - Performance patterns
# - Generates AI prompts for Cursor AI
```

#### **3. Cursor AI Integration (Local)**
```bash
# After running code review tool
npm run code-review:ai

# This generates:
# - Focused AI prompts
# - Specific rule violations
# - Cursor AI instructions
# - Copy-paste prompts for Cursor AI
```

### **Phase 2: CI/CD Pipeline (GitHub Actions)**

#### **1. Comprehensive Analysis**
```yaml
# .github/workflows/quality-check.yml
- name: 🎯 Comprehensive Code Review
  run: |
    npm install -g @selectamitpatra/code-review-tool
    self-serve-review init --template api-gateway
    self-serve-review analyze --severity=error --ci
```

#### **2. Quality Gates**
```yaml
- name: 🚦 Quality Gate
  run: |
    # Run all analyzers
    self-serve-review analyze --analyzers=eslint,typescript,security,dependencies,coverage,performance,architecture
    
    # Fail if critical issues found
    if [ $? -ne 0 ]; then
      echo "❌ Quality gate failed - critical issues found"
      exit 1
    fi
```

## 🔧 **Implementation Setup**

### **1. Update Microservice package.json**

```json
{
  "scripts": {
    // Existing scripts
    "lint:check": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:coverage": "jest --coverage",
    
    // Code Review Tool Integration
    "code-review": "self-serve-review analyze",
    "code-review:local": "self-serve-review analyze --analyzers=eslint,typescript,security,performance --severity=warning",
    "code-review:ai": "self-serve-review analyze --ai-prompts --severity=error",
    "code-review:ci": "self-serve-review analyze --analyzers=eslint,typescript,security,dependencies,coverage,performance,architecture --severity=error --ci",
    "code-review:full": "self-serve-review analyze --analyzers=eslint,typescript,security,dependencies,coverage,performance,architecture,custom-rules",
    
    // Setup commands
    "setup-review": "self-serve-review init --template api-gateway",
    "review:init": "npm run setup-review"
  },
  "dependencies": {
    "@selectamitpatra/code-review-tool": "^1.0.0"
  }
}
```

### **2. Enhanced Husky Configuration**

#### **Pre-commit Hook (.husky/pre-commit)**
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# 1. Lint and format (fast)
npx lint-staged

# 2. Type check
npm run type-check

# 3. Basic code review (quick)
npm run code-review:local

# 4. Generate AI prompts for developer
npm run code-review:ai

echo "✅ Pre-commit checks passed!"
echo "📋 AI prompts generated in ./reports/ai-prompts.md"
echo "💡 Copy prompts to Cursor AI for detailed analysis"
```

#### **Pre-push Hook (.husky/pre-push)**
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🚀 Running pre-push checks..."

# 1. Run tests
npm run test

# 2. Full code review analysis
npm run code-review:full

# 3. Check for critical issues
if npm run code-review:ci; then
  echo "✅ All checks passed - ready to push!"
else
  echo "❌ Critical issues found - fix before pushing"
  exit 1
fi
```

### **3. Updated lint-staged Configuration**

```json
{
  "lint-staged": {
    "*.{ts,js}": [
      "eslint --fix",
      "prettier --write",
      "self-serve-review analyze --staged --severity=warning"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

## 🎯 **Developer Workflow Steps**

### **Step 1: Development**
```bash
# 1. Make code changes
# 2. Run local checks
npm run code-review:local

# 3. Generate AI prompts
npm run code-review:ai

# 4. Copy prompts to Cursor AI
# 5. Use Cursor AI for detailed analysis
```

### **Step 2: Pre-commit (Automatic)**
```bash
git add .
git commit -m "feat: add new feature"

# Husky automatically runs:
# ✅ ESLint + Prettier
# ✅ TypeScript check
# ✅ Basic code review
# ✅ AI prompt generation
```

### **Step 3: Pre-push (Automatic)**
```bash
git push origin feature-branch

# Husky automatically runs:
# ✅ Full test suite
# ✅ Comprehensive code review
# ✅ Quality gate check
```

### **Step 4: CI/CD Pipeline**
```yaml
# GitHub Actions runs:
# ✅ Full quality analysis
# ✅ Security scanning
# ✅ Dependency analysis
# ✅ Coverage reporting
# ✅ Performance analysis
```

## 🤖 **Cursor AI Integration**

### **1. Generate AI Prompts**
```bash
# Run this before using Cursor AI
npm run code-review:ai

# This creates:
# ./reports/ai-prompts.md
# ./reports/cursor-ai-instructions.md
```

### **2. Cursor AI Usage**
```markdown
# Copy this into Cursor AI:

@codebase Focused Code Review Analysis

Please analyze this codebase focusing on the following specific rules:

[Generated prompts from ./reports/ai-prompts.md]

For each violation found, provide:
1. Exact line number
2. Rule ID violated  
3. Specific fix suggestion
4. Impact assessment
```

### **3. AI Prompt Templates**
The tool generates focused prompts like:
- **Security Focus**: JWT secrets, CORS, input validation
- **Performance Focus**: Console.log, async handling, bundle size
- **Architecture Focus**: Error handling, logging patterns
- **Proxy Focus**: Timeout settings, error handling

## 📊 **Quality Gates**

### **Local Quality Gates (Husky)**
- ✅ **Pre-commit**: ESLint + Prettier + Basic review
- ✅ **Pre-push**: Tests + Full review + Quality gate

### **CI/CD Quality Gates (GitHub Actions)**
- ✅ **Security**: No critical vulnerabilities
- ✅ **Dependencies**: No circular deps, outdated packages
- ✅ **Coverage**: Minimum 80% test coverage
- ✅ **Performance**: No blocking operations
- ✅ **Architecture**: No anti-patterns

## 🚀 **Benefits of This Flow**

### **For Developers:**
1. **⚡ Fast Local Checks** - Husky runs quickly
2. **🤖 AI Assistance** - Cursor AI integration
3. **📋 Clear Feedback** - Specific rule violations
4. **🔄 Consistent Process** - Same flow across all services

### **For Team:**
1. **📊 Centralized Rules** - One source of truth
2. **🎯 Quality Consistency** - Same standards everywhere
3. **📈 Easy Updates** - Update rules in one place
4. **🔍 Comprehensive Analysis** - Full quality coverage

### **For CI/CD:**
1. **🚦 Quality Gates** - Prevent bad code from merging
2. **📊 Detailed Reports** - Comprehensive quality metrics
3. **🔒 Security Scanning** - Automated vulnerability detection
4. **📈 Performance Monitoring** - Bundle size and performance tracking

This workflow gives you the best of both worlds: fast local development with comprehensive centralized quality analysis! 🎉
