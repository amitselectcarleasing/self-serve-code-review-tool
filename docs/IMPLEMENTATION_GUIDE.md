# 🚀 Implementation Guide: Automated Code Quality System

## Quick Start (30 Minutes Setup)

This guide provides step-by-step instructions to implement the automated code quality system across all microservices in the Self-Serve Application.

---

## 📋 Prerequisites

- ✅ Node.js 18+ and npm
- ✅ GitHub repository access
- ✅ Cursor Editor with premium account
- ✅ Git configured locally

---

## 🔧 Step 1: Automated Setup Script

Create and run this setup script in your project root:

### `setup-quality-system.sh`

```bash
#!/bin/bash

echo "🚀 Setting up Automated Code Quality System..."
echo "================================================"

# Define services array
services=(
  "self-serve-api"
  "self-serve-frontend" 
  "self-serve-document-service"
  "self-serve-integration-service"
  "self-serve-order-service"
  "self-serve-sync-service"
  "self-serve-api-gateway"
)

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Installing quality dependencies for all services...${NC}"

for service in "${services[@]}"; do
  if [ -d "$service" ]; then
    echo -e "${YELLOW}Setting up $service...${NC}"
    
    cd "$service" || continue
    
    # Install core quality dependencies
    npm install --save-dev \
      husky@^8.0.3 \
      lint-staged@^15.2.0 \
      @typescript-eslint/eslint-plugin@^6.19.0 \
      @typescript-eslint/parser@^6.19.0 \
      eslint-plugin-security@^2.1.0 \
      eslint-plugin-sonarjs@^0.23.0 \
      prettier@^3.2.4 \
      commitizen@^4.3.0 \
      cz-conventional-changelog@^3.3.0
    
    # Initialize husky
    npx husky install
    
    # Create husky hooks
    npx husky add .husky/pre-commit "npx lint-staged"
    npx husky add .husky/pre-push "npm run quality-gate"
    
    # Add npm scripts
    npm pkg set scripts.prepare="husky install"
    npm pkg set scripts.lint:check="eslint src tests --ext .ts,.tsx"
    npm pkg set scripts.lint:fix="eslint src tests --ext .ts,.tsx --fix"
    npm pkg set scripts.lint:security="eslint src --ext .ts,.tsx --no-eslintrc --config .eslintrc.security.js"
    npm pkg set scripts.type-check="tsc --noEmit"
    npm pkg set scripts.quality-gate="npm run lint:check && npm run type-check && npm run test:coverage"
    npm pkg set scripts.commit="cz"
    
    # Configure commitizen
    npm pkg set config.commitizen.path="./node_modules/cz-conventional-changelog"
    
    echo -e "${GREEN}✅ $service setup complete${NC}"
    cd ..
  else
    echo -e "${YELLOW}⚠️  Directory $service not found, skipping...${NC}"
  fi
done

echo -e "${BLUE}📁 Creating GitHub workflows directory...${NC}"
mkdir -p .github/workflows

echo -e "${BLUE}📁 Creating Cursor configuration directory...${NC}"
mkdir -p .cursor

echo -e "${GREEN}🏆 Quality system setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Run: chmod +x setup-quality-system.sh && ./setup-quality-system.sh"
echo "2. Configure ESLint rules (see step 2 below)"
echo "3. Set up GitHub Actions workflow (see step 3 below)"
echo "4. Configure Cursor AI integration (see step 4 below)"
```

**Run the setup script:**
```bash
chmod +x setup-quality-system.sh
./setup-quality-system.sh
```

---

## 🔧 Step 2: ESLint Configuration

### Create Enhanced `.eslintrc.js` for Each Service

```javascript
// .eslintrc.js - Place in each service directory
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:security/recommended',
    'plugin:sonarjs/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  plugins: [
    '@typescript-eslint',
    'security',
    'sonarjs'
  ],
  rules: {
    // ============================================
    // TYPESCRIPT RULES
    // ============================================
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    
    // ============================================
    // SECURITY RULES
    // ============================================
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-possible-timing-attacks': 'error',
    'security/detect-pseudoRandomBytes': 'error',
    
    // ============================================
    // CODE QUALITY RULES
    // ============================================
    'sonarjs/cognitive-complexity': ['error', 15],
    'sonarjs/no-duplicate-string': ['error', 3],
    'sonarjs/no-identical-functions': 'error',
    'sonarjs/no-redundant-boolean': 'error',
    'sonarjs/no-unused-collection': 'error',
    'sonarjs/prefer-immediate-return': 'error',
    'sonarjs/no-small-switch': 'error',
    'sonarjs/no-duplicated-branches': 'error',
    'sonarjs/no-collapsible-if': 'error',
    
    // ============================================
    // MAINTAINABILITY RULES
    // ============================================
    'complexity': ['error', 10],
    'max-depth': ['error', 4],
    'max-lines-per-function': ['error', 50],
    'max-params': ['error', 4],
    'no-console': 'warn',
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'prefer-template': 'error',
    'object-shorthand': 'error',
    'no-multiple-empty-lines': ['error', { max: 1 }],
    
    // ============================================
    // ERROR PREVENTION
    // ============================================
    'no-unreachable': 'error',
    'no-unused-expressions': 'error',
    'no-implicit-globals': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-return-assign': 'error',
    'no-self-compare': 'error',
    'no-throw-literal': 'error',
    'no-unmodified-loop-condition': 'error',
    'no-useless-call': 'error'
  },
  env: {
    node: true,
    es6: true,
    jest: true,
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.js', 'coverage/'],
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.spec.ts'],
      rules: {
        'sonarjs/no-duplicate-string': 'off',
        'max-lines-per-function': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'security/detect-object-injection': 'off'
      }
    },
    {
      files: ['**/*.tsx'],
      extends: ['plugin:react/recommended', 'plugin:react-hooks/recommended'],
      rules: {
        'react/prop-types': 'off',
        'react/react-in-jsx-scope': 'off'
      }
    }
  ]
};
```

### Security-Focused ESLint Config

Create `.eslintrc.security.js` in each service:

```javascript
// .eslintrc.security.js - Security-focused configuration
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['plugin:security/recommended'],
  plugins: ['security'],
  rules: {
    // Enhanced security rules
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-possible-timing-attacks': 'error',
    'security/detect-pseudoRandomBytes': 'error',
    
    // Additional security-focused rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error'
  },
  env: {
    node: true,
    es6: true
  }
};
```

### Lint-Staged Configuration

Add to each service's `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ]
  }
}
```

---

## 🔧 Step 3: GitHub Actions Workflow

Create `.github/workflows/quality-gate.yml`:

```yaml
name: 🔍 Quality & Security Gate

on:
  push:
    branches: [ main, develop, feature/*, hotfix/* ]
  pull_request:
    branches: [ main, develop ]
  schedule:
    # Daily security scan at 2 AM UTC
    - cron: '0 2 * * *'

env:
  NODE_VERSION: '20'
  # Feature flags for premium tools (set to true when ready)
  ENABLE_SNYK: false
  ENABLE_SONAR: false
  ENABLE_CODECOV: false

jobs:
  # ============================================
  # DETECT CHANGED SERVICES
  # ============================================
  detect-changes:
    name: 🔍 Detect Changed Services
    runs-on: ubuntu-latest
    outputs:
      services: ${{ steps.changes.outputs.services }}
      matrix: ${{ steps.changes.outputs.matrix }}
    steps:
      - name: 📥 Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          
      - name: 🔍 Detect changes
        id: changes
        run: |
          # Define all services
          ALL_SERVICES='["self-serve-api","self-serve-frontend","self-serve-document-service","self-serve-integration-service","self-serve-order-service","self-serve-sync-service","self-serve-api-gateway"]'
          
          if [ "${{ github.event_name }}" == "schedule" ] || [ "${{ github.ref }}" == "refs/heads/main" ]; then
            # Run on all services for scheduled runs or main branch
            echo "services=$ALL_SERVICES" >> $GITHUB_OUTPUT
            echo "matrix={\"service\":$ALL_SERVICES}" >> $GITHUB_OUTPUT
          else
            # Detect changed services for PRs and feature branches
            CHANGED_SERVICES='[]'
            for service in self-serve-api self-serve-frontend self-serve-document-service self-serve-integration-service self-serve-order-service self-serve-sync-service self-serve-api-gateway; do
              if git diff --name-only HEAD~1 | grep -q "^$service/"; then
                CHANGED_SERVICES=$(echo $CHANGED_SERVICES | jq --arg service "$service" '. + [$service]')
              fi
            done
            
            # If no services changed, still run on API (core service)
            if [ "$CHANGED_SERVICES" == "[]" ]; then
              CHANGED_SERVICES='["self-serve-api"]'
            fi
            
            echo "services=$CHANGED_SERVICES" >> $GITHUB_OUTPUT
            echo "matrix={\"service\":$CHANGED_SERVICES}" >> $GITHUB_OUTPUT
          fi

  # ============================================
  # CORE QUALITY CHECKS
  # ============================================
  quality-check:
    name: 🧹 Quality Check
    runs-on: ubuntu-latest
    needs: detect-changes
    if: needs.detect-changes.outputs.services != '[]'
    strategy:
      fail-fast: false
      matrix: ${{ fromJson(needs.detect-changes.outputs.matrix) }}
    
    steps:
      - name: 📥 Checkout code
        uses: actions/checkout@v4
        
      - name: 🟢 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: ${{ matrix.service }}/package-lock.json
          
      - name: 📦 Install dependencies
        working-directory: ${{ matrix.service }}
        run: |
          echo "📦 Installing dependencies for ${{ matrix.service }}..."
          npm ci
          echo "✅ Dependencies installed"
        
      - name: 🔍 ESLint Check
        working-directory: ${{ matrix.service }}
        run: |
          echo "🔍 Running ESLint with security and quality rules..."
          npm run lint:check
          echo "✅ ESLint passed"
        
      - name: 🛡️ Security-Focused Lint
        working-directory: ${{ matrix.service }}
        run: |
          echo "🛡️ Running security-focused ESLint..."
          if [ -f ".eslintrc.security.js" ]; then
            npm run lint:security
          else
            echo "⚠️ Security ESLint config not found, skipping..."
          fi
          echo "✅ Security lint completed"
        
      - name: 📝 TypeScript Check
        working-directory: ${{ matrix.service }}
        run: |
          echo "📝 Running TypeScript strict checking..."
          npm run type-check
          echo "✅ TypeScript check passed"
        
      - name: 🛡️ NPM Security Audit
        working-directory: ${{ matrix.service }}
        run: |
          echo "🛡️ Running NPM security audit..."
          npm audit --audit-level moderate --json > npm-audit.json || true
          
          # Check for high severity vulnerabilities
          HIGH_VULNS=$(cat npm-audit.json | jq '.metadata.vulnerabilities.high // 0')
          CRITICAL_VULNS=$(cat npm-audit.json | jq '.metadata.vulnerabilities.critical // 0')
          
          echo "High severity vulnerabilities: $HIGH_VULNS"
          echo "Critical severity vulnerabilities: $CRITICAL_VULNS"
          
          if [ "$HIGH_VULNS" -gt 0 ] || [ "$CRITICAL_VULNS" -gt 0 ]; then
            echo "❌ High or critical vulnerabilities found!"
            cat npm-audit.json | jq '.advisories'
            exit 1
          fi
          
          echo "✅ No high/critical vulnerabilities found"
        
      - name: 🧪 Run Tests with Coverage
        working-directory: ${{ matrix.service }}
        run: |
          echo "🧪 Running tests with coverage enforcement..."
          npm run test:coverage
          echo "✅ Tests passed with required coverage"
          
      - name: 📊 Generate Quality Report
        working-directory: ${{ matrix.service }}
        if: always()
        run: |
          echo "📊 Generating quality reports..."
          mkdir -p reports
          
          # ESLint JSON report
          npm run lint:check -- --format json --output-file reports/eslint-report.json || true
          
          # Coverage summary
          if [ -f "coverage/coverage-summary.json" ]; then
            cp coverage/coverage-summary.json reports/
          fi
          
          # Create summary report
          cat > reports/quality-summary.json << EOF
          {
            "service": "${{ matrix.service }}",
            "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
            "checks": {
              "eslint": "completed",
              "typescript": "completed", 
              "security_audit": "completed",
              "tests": "completed"
            }
          }
          EOF
          
          echo "✅ Quality reports generated"
          
      - name: 📤 Upload Quality Reports
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: quality-reports-${{ matrix.service }}
          path: ${{ matrix.service }}/reports/
          retention-days: 30

  # ============================================
  # SECURITY ANALYSIS
  # ============================================
  security-analysis:
    name: 🔒 Security Analysis
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write
    
    steps:
      - name: 📥 Checkout code
        uses: actions/checkout@v4
        
      - name: 🔍 Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: typescript, javascript
          queries: security-and-quality
          
      - name: 🔍 Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
        with:
          category: "/language:typescript"

  # ============================================
  # PREMIUM TOOLS (CONDITIONAL)
  # ============================================
  premium-tools:
    name: 🚀 Premium Tools
    runs-on: ubuntu-latest
    needs: [detect-changes, quality-check]
    if: |
      (env.ENABLE_SNYK == 'true' || env.ENABLE_SONAR == 'true' || env.ENABLE_CODECOV == 'true') &&
      needs.detect-changes.outputs.services != '[]'
    strategy:
      fail-fast: false
      matrix: ${{ fromJson(needs.detect-changes.outputs.matrix) }}
    
    steps:
      - name: 📥 Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for SonarQube
        
      - name: 🟢 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: ${{ matrix.service }}/package-lock.json
          
      - name: 📦 Install dependencies
        working-directory: ${{ matrix.service }}
        run: npm ci

      # SNYK SECURITY SCAN
      - name: 🛡️ Snyk Security Scan
        if: env.ENABLE_SNYK == 'true'
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high --json > snyk-report.json
        working-directory: ${{ matrix.service }}
        continue-on-error: true

      # CODECOV UPLOAD
      - name: 📊 Upload to Codecov
        if: env.ENABLE_CODECOV == 'true'
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          file: ${{ matrix.service }}/coverage/lcov.info
          flags: ${{ matrix.service }}
          name: ${{ matrix.service }}-coverage

      # SONARQUBE ANALYSIS
      - name: 📊 SonarQube Analysis
        if: env.ENABLE_SONAR == 'true'
        uses: sonarsource/sonarqube-scan-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
        with:
          projectBaseDir: ${{ matrix.service }}

  # ============================================
  # QUALITY GATE SUMMARY
  # ============================================
  quality-summary:
    name: 📊 Quality Gate Summary
    runs-on: ubuntu-latest
    needs: [detect-changes, quality-check, security-analysis]
    if: always()
    
    steps:
      - name: 📊 Generate Summary Report
        run: |
          echo "## 🏆 Quality Gate Results" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "| Component | Status | Details |" >> $GITHUB_STEP_SUMMARY
          echo "|-----------|--------|---------|" >> $GITHUB_STEP_SUMMARY
          echo "| Quality Checks | ${{ needs.quality-check.result == 'success' && '✅ Passed' || needs.quality-check.result == 'skipped' && '⏭️ Skipped' || '❌ Failed' }} | ESLint, TypeScript, Tests, Coverage |" >> $GITHUB_STEP_SUMMARY
          echo "| Security Analysis | ${{ needs.security-analysis.result == 'success' && '✅ Passed' || '❌ Failed' }} | GitHub CodeQL, NPM Audit |" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "### 🔍 Services Analyzed" >> $GITHUB_STEP_SUMMARY
          echo "Services: ${{ needs.detect-changes.outputs.services }}" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "### 🛠️ Tools Used (FREE Tier)" >> $GITHUB_STEP_SUMMARY
          echo "- ✅ **ESLint**: Code style + security rules" >> $GITHUB_STEP_SUMMARY
          echo "- ✅ **TypeScript**: Strict type checking" >> $GITHUB_STEP_SUMMARY
          echo "- ✅ **Jest**: Unit tests with coverage thresholds" >> $GITHUB_STEP_SUMMARY
          echo "- ✅ **NPM Audit**: Known vulnerability scanning" >> $GITHUB_STEP_SUMMARY
          echo "- ✅ **CodeQL**: GitHub's security analysis" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "### 🚀 Premium Tools (Ready to Enable)" >> $GITHUB_STEP_SUMMARY
          echo "- 🔄 **Snyk**: Set ENABLE_SNYK=true" >> $GITHUB_STEP_SUMMARY
          echo "- 🔄 **SonarCloud**: Set ENABLE_SONAR=true" >> $GITHUB_STEP_SUMMARY
          echo "- 🔄 **Codecov**: Set ENABLE_CODECOV=true" >> $GITHUB_STEP_SUMMARY
          
      - name: ❌ Fail Build if Quality Gate Failed
        if: needs.quality-check.result == 'failure' || needs.security-analysis.result == 'failure'
        run: |
          echo "❌ Quality gate failed! Check the logs above for details."
          echo "Quality Check: ${{ needs.quality-check.result }}"
          echo "Security Analysis: ${{ needs.security-analysis.result }}"
          exit 1
          
      - name: ✅ Quality Gate Passed
        if: needs.quality-check.result == 'success' && needs.security-analysis.result == 'success'
        run: |
          echo "✅ All quality gates passed successfully!"
          echo "🚀 Code is ready for deployment."
```

---

## 🔧 Step 4: Cursor AI Integration

### Cursor Settings Configuration

Create `.cursor/settings.json`:

```json
{
  "cursor.ai.enabled": true,
  "cursor.ai.model": "claude-3.5-sonnet",
  "cursor.ai.codeReview": true,
  "cursor.ai.suggestions": "aggressive",
  "cursor.ai.reviewOnSave": true,
  "cursor.ai.securityScan": true,
  "cursor.ai.performanceHints": true,
  "cursor.ai.bestPractices": true,
  
  "eslint.enable": true,
  "eslint.autoFixOnSave": true,
  "eslint.validate": ["typescript", "typescriptreact", "javascript"],
  "eslint.workingDirectories": [
    "self-serve-api",
    "self-serve-frontend",
    "self-serve-document-service",
    "self-serve-integration-service",
    "self-serve-order-service",
    "self-serve-sync-service",
    "self-serve-api-gateway"
  ],
  
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "typescript.preferences.importModuleSpecifier": "relative",
  
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true,
    "source.addMissingImports": true,
    "source.removeUnusedImports": true
  },
  
  "editor.formatOnSave": true,
  "editor.formatOnPaste": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  
  "files.associations": {
    "*.env*": "dotenv",
    ".eslintrc*": "json",
    "*.config.js": "javascript"
  },
  
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/coverage": true,
    "**/.git": true
  }
}
```

### Cursor Commands Configuration

Create `.cursor/commands.json`:

```json
{
  "commands": [
    {
      "name": "🔍 Full Quality Check",
      "command": "npm run quality-gate",
      "description": "Run complete quality gate locally",
      "shortcut": "Ctrl+Shift+Q",
      "cwd": "${workspaceFolder}"
    },
    {
      "name": "🛡️ Security Scan",
      "command": "npm audit && npm run lint:security",
      "description": "Run security-focused checks",
      "shortcut": "Ctrl+Shift+S",
      "cwd": "${workspaceFolder}"
    },
    {
      "name": "🧪 Test Coverage",
      "command": "npm run test:coverage",
      "description": "Run tests with coverage report",
      "shortcut": "Ctrl+Shift+T",
      "cwd": "${workspaceFolder}"
    },
    {
      "name": "🔧 Fix ESLint Issues",
      "command": "npm run lint:fix",
      "description": "Auto-fix ESLint issues",
      "shortcut": "Ctrl+Shift+F",
      "cwd": "${workspaceFolder}"
    },
    {
      "name": "📊 Generate Quality Report",
      "command": "mkdir -p reports && npm run lint:check -- --format json --output-file reports/eslint.json && npm run test:coverage",
      "description": "Generate comprehensive quality report",
      "cwd": "${workspaceFolder}"
    }
  ],
  "aiPrompts": [
    {
      "name": "🔍 Security Review",
      "description": "Comprehensive security analysis",
      "prompt": "Please perform a thorough security review of this code:\n\n1. **Vulnerability Analysis**:\n   - SQL injection risks\n   - XSS vulnerabilities\n   - Authentication/authorization issues\n   - Input validation problems\n   - Sensitive data exposure\n\n2. **OWASP Top 10 Compliance**:\n   - Check against current OWASP guidelines\n   - Identify potential security weaknesses\n\n3. **Best Practices**:\n   - Secure coding patterns\n   - Error handling security\n   - Logging security considerations\n\nProvide specific fixes with code examples."
    },
    {
      "name": "⚡ Performance Review", 
      "description": "Performance optimization analysis",
      "prompt": "Analyze this code for performance issues and optimization opportunities:\n\n1. **Database Performance**:\n   - Query optimization\n   - N+1 query problems\n   - Index usage\n   - Connection pooling\n\n2. **Application Performance**:\n   - Memory leaks\n   - Inefficient algorithms\n   - Unnecessary computations\n   - Caching opportunities\n\n3. **Network Performance**:\n   - API call optimization\n   - Payload size reduction\n   - Response time improvements\n\nProvide specific optimization suggestions with benchmarks where possible."
    },
    {
      "name": "🏗️ Architecture Review",
      "description": "Code architecture and design analysis", 
      "prompt": "Review this code for architectural quality and design patterns:\n\n1. **SOLID Principles**:\n   - Single Responsibility\n   - Open/Closed Principle\n   - Liskov Substitution\n   - Interface Segregation\n   - Dependency Inversion\n\n2. **Design Patterns**:\n   - Appropriate pattern usage\n   - Anti-pattern identification\n   - Refactoring opportunities\n\n3. **Code Organization**:\n   - Modularity and cohesion\n   - Coupling analysis\n   - Testability improvements\n\nSuggest architectural improvements with refactoring examples."
    },
    {
      "name": "🧪 Test Strategy Review",
      "description": "Testing approach and coverage analysis",
      "prompt": "Analyze the testing strategy for this code:\n\n1. **Test Coverage**:\n   - Missing test scenarios\n   - Edge cases not covered\n   - Critical path testing\n\n2. **Test Quality**:\n   - Test maintainability\n   - Test readability\n   - Mock usage appropriateness\n\n3. **Test Types**:\n   - Unit test recommendations\n   - Integration test needs\n   - E2E test scenarios\n\nProvide specific test cases and testing improvements."
    }
  ]
}
```

### Cursor Extensions Configuration

Create `.cursor/extensions.json`:

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-jest",
    "SonarSource.sonarlint-vscode",
    "ms-vscode.vscode-json",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-typescript-next",
    "GitHub.copilot",
    "ms-vscode.hexeditor",
    "redhat.vscode-yaml",
    "ms-vscode.vscode-docker"
  ]
}
```

---

## 🔧 Step 5: Enhanced TypeScript Configuration

### Strict TypeScript Config

Update `tsconfig.json` in each service:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    
    // Strict Type Checking
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    
    // Additional Checks
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    
    // Module Resolution
    "moduleResolution": "node",
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"],
      "@/types/*": ["src/types/*"],
      "@/utils/*": ["src/utils/*"],
      "@/services/*": ["src/services/*"],
      "@/controllers/*": ["src/controllers/*"]
    },
    
    // Emit
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": false,
    "importHelpers": true,
    
    // Interop Constraints
    "isolatedModules": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    
    // Type Checking
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": [
    "src/**/*",
    "tests/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "coverage",
    "**/*.js"
  ]
}
```

---

## 🔧 Step 6: Jest Configuration Enhancement

### Enhanced Jest Config

Update `jest.config.js` in each service:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Test Discovery
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  
  // Coverage Configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/app.ts',
    '!src/config/*.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts'
  ],
  
  // Coverage Thresholds (Service-specific)
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 95,
      lines: 90,
      statements: 90
    },
    './src/controllers/': {
      branches: 90,
      functions: 100,
      lines: 95,
      statements: 95
    },
    './src/services/': {
      branches: 95,
      functions: 100,
      lines: 98,
      statements: 98
    },
    './src/utils/': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  
  // Coverage Reporting
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json-summary'
  ],
  
  // Test Setup
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 10000,
  
  // Performance
  maxWorkers: '50%',
  clearMocks: true,
  restoreMocks: true,
  
  // Module Resolution
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Transform
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // Globals
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },
  
  // Verbose output for CI
  verbose: process.env.CI === 'true'
};
```

---

## 🔧 Step 7: Branch Protection Setup

### GitHub Branch Protection Rules

Configure these settings in your GitHub repository:

1. **Go to Settings → Branches**
2. **Add rule for `main` branch:**

```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "🔍 Quality & Security Gate / 🧹 Quality Check",
      "🔍 Quality & Security Gate / 🔒 Security Analysis"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_review_thread_resolution": true
  },
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "restrictions": null
}
```

3. **Add rule for `develop` branch** (same settings)

---

## 🔧 Step 8: Premium Tools Preparation

### SonarCloud Setup (When Ready)

1. **Create `sonar-project.properties` in project root:**

```properties
# SonarCloud Configuration
sonar.organization=your-org-key
sonar.projectKey=self-serve-application

# Project Information
sonar.projectName=Self-Serve Application
sonar.projectVersion=1.0

# Source Configuration
sonar.sources=.
sonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/**,**/*.test.ts,**/*.spec.ts

# Coverage Configuration
sonar.javascript.lcov.reportPaths=**/coverage/lcov.info
sonar.typescript.lcov.reportPaths=**/coverage/lcov.info

# Quality Gate
sonar.qualitygate.wait=true
```

2. **Add GitHub Secrets:**
   - `SONAR_TOKEN`: Your SonarCloud token
   - `SONAR_HOST_URL`: https://sonarcloud.io

### Snyk Setup (When Ready)

1. **Create `.snyk` file in project root:**

```yaml
# Snyk Configuration
version: v1.0.0

# Ignore specific vulnerabilities (if needed)
ignore: {}

# Patch configuration
patch: {}
```

2. **Add GitHub Secret:**
   - `SNYK_TOKEN`: Your Snyk API token

### Codecov Setup (When Ready)

1. **Create `codecov.yml` in project root:**

```yaml
# Codecov Configuration
coverage:
  status:
    project:
      default:
        target: 85%
        threshold: 1%
    patch:
      default:
        target: 90%
        
comment:
  layout: "reach, diff, flags, files"
  behavior: default
  require_changes: false
```

2. **Add GitHub Secret:**
   - `CODECOV_TOKEN`: Your Codecov token

---

## ✅ Verification Steps

### 1. Test Local Setup

```bash
# In each service directory:
cd self-serve-api

# Test pre-commit hooks
git add .
git commit -m "test: verify quality gates"

# Test quality gate
npm run quality-gate

# Test individual checks
npm run lint:check
npm run type-check
npm run test:coverage
```

### 2. Test GitHub Actions

1. **Create a test branch:**
```bash
git checkout -b test/quality-gates
git push origin test/quality-gates
```

2. **Create a pull request** and verify all checks pass

3. **Check GitHub Actions tab** for detailed logs

### 3. Test Cursor AI Integration

1. **Open a TypeScript file in Cursor**
2. **Make a code change** with potential issues
3. **Save the file** and verify AI suggestions appear
4. **Use Ctrl+Shift+Q** to run quality checks
5. **Test AI prompts** for security and performance reviews

---

## 🎯 Success Metrics

After implementation, you should see:

- ✅ **100% Pre-commit Hook Usage**: All commits go through quality checks
- ✅ **95%+ Quality Gate Pass Rate**: Most PRs pass on first try
- ✅ **Zero High-Severity Vulnerabilities**: Security issues caught early
- ✅ **85%+ Test Coverage**: Maintained across all services
- ✅ **<5 Minutes Build Time**: Fast feedback loops
- ✅ **Enhanced Developer Experience**: AI-assisted code improvements

---

## 🔧 Troubleshooting

### Common Issues and Solutions

**ESLint Errors:**
```bash
# Check specific rule
npx eslint src/file.ts --rule 'security/detect-object-injection: error'

# Fix auto-fixable issues
npm run lint:fix

# Disable rule for specific line
// eslint-disable-next-line security/detect-object-injection
```

**TypeScript Errors:**
```bash
# Check types without compilation
npm run type-check

# Generate detailed type report
npx type-coverage --detail --at-least 95
```

**Test Coverage Issues:**
```bash
# Check coverage by file
npx jest --coverage --collectCoverageFrom="src/specific-file.ts"

# Run tests in watch mode
npm run test:watch
```

**GitHub Actions Failures:**
```bash
# Test locally first
npm run quality-gate

# Check specific service
cd self-serve-api && npm run quality-gate

# Debug with verbose output
npm run test -- --verbose
```

---

This implementation guide provides everything needed to set up a comprehensive, automated code quality system that grows with your project needs! 🚀
