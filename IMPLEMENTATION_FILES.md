# 🔧 Implementation Files for Microservices

## 📁 **Files to Add/Update in Each Microservice**

### **1. Update package.json**

```json
{
  "scripts": {
    // Existing scripts (keep these)
    "lint:check": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "build": "tsc",
    
    // Add these new scripts
    "code-review": "self-serve-review analyze",
    "code-review:local": "self-serve-review analyze --analyzers=eslint,typescript,security,performance --severity=warning",
    "code-review:ai": "self-serve-review analyze --ai-prompts --severity=error",
    "code-review:ci": "self-serve-review analyze --analyzers=eslint,typescript,security,dependencies,coverage,performance,architecture --severity=error --ci",
    "code-review:full": "self-serve-review analyze --analyzers=eslint,typescript,security,dependencies,coverage,performance,architecture,custom-rules",
    "setup-review": "self-serve-review init --template api-gateway",
    "review:init": "npm run setup-review"
  },
  "dependencies": {
    "@selectamitpatra/code-review-tool": "^1.0.0"
  },
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

### **2. Update .husky/pre-commit**

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

### **3. Create .husky/pre-push**

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

### **4. Update .github/workflows/quality-check.yml**

```yaml
name: 🔍 Quality Check & CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  quality-check:
    name: 🧪 Quality Analysis
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - name: 📥 Checkout code
      uses: actions/checkout@v4
      
    - name: 🟢 Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
        
    - name: 📦 Install dependencies
      run: npm ci
      
    - name: 🎨 Check code formatting
      run: npm run format:check
      
    - name: 🔍 Lint code
      run: npm run lint:check
      
    - name: 🔧 Type check
      run: npm run type-check
      
    - name: 🧪 Run tests
      run: npm run test:coverage
      
    - name: 🔒 Security audit
      run: npm run security
      
    - name: 🔄 Check circular dependencies
      run: npm run deps:check
      
    - name: 📊 Generate dependency graph
      run: npm run deps:graph
      
    - name: 🎯 Run Code Review Analysis
      run: |
        npm install -g @selectamitpatra/code-review-tool
        self-serve-review init --template api-gateway
        self-serve-review analyze --analyzers=eslint,typescript,security,dependencies,coverage,performance,architecture --severity=error --ci
        
    - name: 📈 Upload coverage to Codecov
      if: matrix.node-version == '20.x'
      uses: codecov/codecov-action@v4
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella
        fail_ci_if_error: false
        
    - name: 📋 Upload quality reports
      if: matrix.node-version == '20.x'
      uses: actions/upload-artifact@v4
      with:
        name: quality-reports
        path: |
          reports/
          coverage/
          deps.svg
        retention-days: 30
        
  build:
    name: 🏗️ Build & Test
    runs-on: ubuntu-latest
    needs: quality-check
    
    steps:
    - name: 📥 Checkout code
      uses: actions/checkout@v4
      
    - name: 🟢 Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: 'npm'
        
    - name: 📦 Install dependencies
      run: npm ci
      
    - name: 🏗️ Build project
      run: npm run build
      
    - name: 📋 Upload build artifacts
      uses: actions/upload-artifact@v4
      with:
        name: build-files
        path: dist/
        retention-days: 7
```

### **5. Create .self-serve-review.json (Template)**

```json
{
  "extends": "api-gateway",
  "analyzers": [
    "eslint",
    "typescript", 
    "security",
    "dependencies",
    "coverage",
    "performance",
    "architecture",
    "custom-rules"
  ],
  "reporters": [
    "html",
    "json",
    "ai-prompts"
  ],
  "rules": {
    "no-console-log": {
      "severity": "error",
      "environments": ["production"]
    }
  },
  "ignore": [
    "dist/",
    "build/",
    "node_modules/",
    "coverage/"
  ],
  "thresholds": {
    "coverage": 80,
    "performance": 90,
    "security": 100
  }
}
```

## 🚀 **Implementation Steps**

### **Step 1: Update Each Microservice**
```bash
# For each microservice (api-gateway, api, frontend, etc.)

# 1. Update package.json
# 2. Update .husky/pre-commit
# 3. Create .husky/pre-push
# 4. Update .github/workflows/quality-check.yml
# 5. Create .self-serve-review.json

# 6. Install code review tool
npm install @selectamitpatra/code-review-tool

# 7. Initialize code review
npm run setup-review
```

### **Step 2: Test the Flow**
```bash
# 1. Make a code change
# 2. Try to commit (should run pre-commit checks)
git add .
git commit -m "test: test new workflow"

# 3. Try to push (should run pre-push checks)
git push origin feature-branch

# 4. Check GitHub Actions (should run full analysis)
```

### **Step 3: Developer Training**
```bash
# 1. Show developers how to use:
npm run code-review:local    # Quick local check
npm run code-review:ai       # Generate AI prompts
npm run code-review:full     # Full analysis

# 2. Show Cursor AI integration:
# - Copy prompts from ./reports/ai-prompts.md
# - Paste into Cursor AI
# - Get focused analysis
```

## 📊 **Expected Results**

### **Developer Experience:**
- ⚡ **Fast Pre-commit**: 10-15 seconds
- 🤖 **AI Integration**: Copy-paste prompts to Cursor AI
- 📋 **Clear Feedback**: Specific rule violations
- 🔄 **Consistent Process**: Same across all services

### **Quality Improvements:**
- 📈 **80% Reduction** in duplicate quality code
- 🎯 **Consistent Standards** across all microservices
- 🔒 **Better Security** through centralized rules
- ⚡ **Better Performance** through pattern detection

### **Team Benefits:**
- 📊 **Centralized Rules**: Update once, apply everywhere
- 🚦 **Quality Gates**: Prevent bad code from merging
- 📈 **Easy Onboarding**: New developers get instant feedback
- 🔍 **Comprehensive Analysis**: Full quality coverage

This implementation gives you a complete developer workflow that combines local development tools with centralized quality analysis! 🎉
