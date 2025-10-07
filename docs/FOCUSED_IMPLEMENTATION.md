# 🎯 Focused Implementation: API Gateway & Auth Service Quality Gates

## Overview

This guide implements automated code quality gates specifically for:
- **🚪 API Gateway** (`self-serve-api-gateway`)
- **🔐 Auth Service** (`self-serve-api`)

Starting with these core services provides maximum impact while keeping the scope manageable.

---

## 🚀 Quick Setup (15 Minutes)

### Step 1: Run Focused Setup Script

Create and run this script in your project root:

```bash
#!/bin/bash
# setup-core-quality.sh

echo "🎯 Setting up Quality Gates for Core Services..."
echo "================================================"

# Define core services
services=("self-serve-api-gateway" "self-serve-api")

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}📦 Installing quality dependencies for core services...${NC}"

for service in "${services[@]}"; do
  if [ -d "$service" ]; then
    echo -e "${YELLOW}Setting up $service...${NC}"
    
    cd "$service" || continue
    
    # Install quality dependencies
    npm install --save-dev \
      husky@^8.0.3 \
      lint-staged@^15.2.0 \
      @typescript-eslint/eslint-plugin@^6.19.0 \
      @typescript-eslint/parser@^6.19.0 \
      eslint-plugin-security@^2.1.0 \
      eslint-plugin-sonarjs@^0.23.0 \
      prettier@^3.2.4 \
      @types/jest@^29.5.12 \
      supertest@^7.0.0
    
    # Initialize husky
    npx husky install
    
    # Create husky hooks
    npx husky add .husky/pre-commit "npx lint-staged"
    npx husky add .husky/pre-push "npm run quality-gate"
    
    # Add quality scripts
    npm pkg set scripts.prepare="husky install"
    npm pkg set scripts.lint:check="eslint src --ext .ts"
    npm pkg set scripts.lint:fix="eslint src --ext .ts --fix"
    npm pkg set scripts.lint:security="eslint src --ext .ts --no-eslintrc --config .eslintrc.security.js"
    npm pkg set scripts.type-check="tsc --noEmit"
    npm pkg set scripts.quality-gate="npm run lint:check && npm run type-check && npm run test:coverage"
    npm pkg set scripts.test:coverage="jest --coverage"
    npm pkg set scripts.test:watch="jest --watch"
    
    echo -e "${GREEN}✅ $service setup complete${NC}"
    cd ..
  else
    echo -e "${YELLOW}⚠️  Directory $service not found, skipping...${NC}"
  fi
done

# Create GitHub workflows for core services
echo -e "${BLUE}📁 Creating GitHub workflows...${NC}"
mkdir -p .github/workflows

# Create Cursor configuration
echo -e "${BLUE}📁 Creating Cursor configuration...${NC}"
mkdir -p .cursor

echo -e "${GREEN}🏆 Core services quality system ready!${NC}"
echo ""
echo "Next steps:"
echo "1. Configure ESLint rules (see configurations below)"
echo "2. Set up GitHub Actions workflow"
echo "3. Configure Cursor AI integration"
echo "4. Test the setup"
```

**Run the setup:**
```bash
chmod +x setup-core-quality.sh
./setup-core-quality.sh
```

---

## 🔧 Service-Specific Configurations

### API Gateway Configuration

#### `.eslintrc.js` for API Gateway
```javascript
// self-serve-api-gateway/.eslintrc.js
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
    // API Gateway specific rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // Security rules for gateway
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-unsafe-regex': 'error',
    'security/detect-child-process': 'error',
    'security/detect-eval-with-expression': 'error',
    
    // Gateway-specific quality rules
    'sonarjs/cognitive-complexity': ['error', 12], // Slightly higher for routing logic
    'sonarjs/no-duplicate-string': ['error', 3],
    'complexity': ['error', 12], // Gateway routing can be complex
    'max-depth': ['error', 4],
    'max-lines-per-function': ['error', 60], // Routing functions can be longer
    
    // Express/HTTP specific
    'no-console': 'warn', // Allow console for gateway logging
    'prefer-const': 'error',
    'no-var': 'error'
  },
  env: {
    node: true,
    es6: true,
    jest: true
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.js']
};
```

#### `jest.config.js` for API Gateway
```javascript
// self-serve-api-gateway/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Test discovery
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  
  // Coverage for gateway
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts', // Server startup file
    '!src/index.ts'   // Main entry point
  ],
  
  // Gateway-specific coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,  // Lower for routing logic
      functions: 85,
      lines: 85,
      statements: 85
    },
    './src/middleware/': {
      branches: 90,
      functions: 95,
      lines: 90,
      statements: 90
    }
  },
  
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000
};
```

### Auth Service Configuration

#### `.eslintrc.js` for Auth Service
```javascript
// self-serve-api/.eslintrc.js
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
    // Auth service specific rules (stricter)
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'error', // Strict for auth
    '@typescript-eslint/no-explicit-any': 'error', // No any in auth code
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    
    // Enhanced security for auth service
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-possible-timing-attacks': 'error',
    'security/detect-pseudoRandomBytes': 'error',
    
    // Strict quality rules for auth
    'sonarjs/cognitive-complexity': ['error', 10], // Stricter for auth
    'sonarjs/no-duplicate-string': ['error', 3],
    'sonarjs/no-identical-functions': 'error',
    'complexity': ['error', 8], // Lower complexity for auth
    'max-depth': ['error', 3],
    'max-lines-per-function': ['error', 40], // Shorter functions for auth
    'max-params': ['error', 3],
    
    // Auth-specific rules
    'no-console': 'error', // No console logs in auth service
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error'
  },
  env: {
    node: true,
    es6: true,
    jest: true
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.js', 'coverage/'],
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.spec.ts'],
      rules: {
        'sonarjs/no-duplicate-string': 'off',
        'max-lines-per-function': 'off',
        '@typescript-eslint/no-explicit-any': 'off'
      }
    }
  ]
};
```

#### Enhanced `jest.config.js` for Auth Service
```javascript
// self-serve-api/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Test discovery
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/tests/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  
  // Coverage for auth service (stricter)
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/app.ts',
    '!src/config/database.ts' // Database config excluded
  ],
  
  // Strict coverage thresholds for auth
  coverageThreshold: {
    global: {
      branches: 90,  // High for auth service
      functions: 95,
      lines: 92,
      statements: 92
    },
    './src/controllers/': {
      branches: 95,
      functions: 100,
      lines: 95,
      statements: 95
    },
    './src/services/': {
      branches: 98,
      functions: 100,
      lines: 98,
      statements: 98
    },
    './src/middleware/': {
      branches: 95,
      functions: 100,
      lines: 95,
      statements: 95
    }
  },
  
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 10000
};
```

---

## 🔧 GitHub Actions Workflow (Core Services Only)

Create `.github/workflows/core-quality-gate.yml`:

```yaml
name: 🎯 Core Services Quality Gate

on:
  push:
    branches: [ main, develop, feature/*, hotfix/* ]
    paths:
      - 'self-serve-api/**'
      - 'self-serve-api-gateway/**'
      - '.github/workflows/core-quality-gate.yml'
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'self-serve-api/**'
      - 'self-serve-api-gateway/**'

env:
  NODE_VERSION: '20'

jobs:
  # ============================================
  # DETECT CHANGED CORE SERVICES
  # ============================================
  detect-changes:
    name: 🔍 Detect Core Service Changes
    runs-on: ubuntu-latest
    outputs:
      api-gateway-changed: ${{ steps.changes.outputs.api-gateway }}
      auth-service-changed: ${{ steps.changes.outputs.auth-service }}
      services: ${{ steps.changes.outputs.services }}
    steps:
      - name: 📥 Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          
      - name: 🔍 Check for changes
        id: changes
        run: |
          # Check API Gateway changes
          if git diff --name-only HEAD~1 | grep -q "^self-serve-api-gateway/"; then
            echo "api-gateway=true" >> $GITHUB_OUTPUT
            API_GATEWAY_CHANGED=true
          else
            echo "api-gateway=false" >> $GITHUB_OUTPUT
            API_GATEWAY_CHANGED=false
          fi
          
          # Check Auth Service changes
          if git diff --name-only HEAD~1 | grep -q "^self-serve-api/"; then
            echo "auth-service=true" >> $GITHUB_OUTPUT
            AUTH_SERVICE_CHANGED=true
          else
            echo "auth-service=false" >> $GITHUB_OUTPUT
            AUTH_SERVICE_CHANGED=false
          fi
          
          # Create services array for matrix
          SERVICES='[]'
          if [ "$API_GATEWAY_CHANGED" = true ]; then
            SERVICES=$(echo $SERVICES | jq '. + ["self-serve-api-gateway"]')
          fi
          if [ "$AUTH_SERVICE_CHANGED" = true ]; then
            SERVICES=$(echo $SERVICES | jq '. + ["self-serve-api"]')
          fi
          
          # If no changes detected, run on both (for main branch or manual triggers)
          if [ "$SERVICES" = "[]" ] && [ "${{ github.ref }}" = "refs/heads/main" ]; then
            SERVICES='["self-serve-api-gateway", "self-serve-api"]'
          fi
          
          echo "services=$SERVICES" >> $GITHUB_OUTPUT
          echo "Detected services: $SERVICES"

  # ============================================
  # CORE SERVICES QUALITY CHECK
  # ============================================
  core-quality-check:
    name: 🧹 Core Quality Check
    runs-on: ubuntu-latest
    needs: detect-changes
    if: needs.detect-changes.outputs.services != '[]'
    strategy:
      fail-fast: false
      matrix:
        service: ${{ fromJson(needs.detect-changes.outputs.services) }}
    
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
          echo "🔍 Running ESLint for ${{ matrix.service }}..."
          npm run lint:check
          echo "✅ ESLint passed"
        
      - name: 🛡️ Security Lint
        working-directory: ${{ matrix.service }}
        run: |
          echo "🛡️ Running security-focused ESLint..."
          if [ -f ".eslintrc.security.js" ]; then
            npm run lint:security
          else
            echo "⚠️ Security ESLint config not found, using main config..."
            npm run lint:check
          fi
          echo "✅ Security lint completed"
        
      - name: 📝 TypeScript Check
        working-directory: ${{ matrix.service }}
        run: |
          echo "📝 Running TypeScript checking for ${{ matrix.service }}..."
          npm run type-check
          echo "✅ TypeScript check passed"
        
      - name: 🛡️ NPM Security Audit
        working-directory: ${{ matrix.service }}
        run: |
          echo "🛡️ Running NPM security audit..."
          npm audit --audit-level moderate --json > npm-audit.json || true
          
          # Check for high/critical vulnerabilities
          HIGH_VULNS=$(cat npm-audit.json | jq '.metadata.vulnerabilities.high // 0')
          CRITICAL_VULNS=$(cat npm-audit.json | jq '.metadata.vulnerabilities.critical // 0')
          
          echo "High severity vulnerabilities: $HIGH_VULNS"
          echo "Critical severity vulnerabilities: $CRITICAL_VULNS"
          
          if [ "$HIGH_VULNS" -gt 0 ] || [ "$CRITICAL_VULNS" -gt 0 ]; then
            echo "❌ High or critical vulnerabilities found in ${{ matrix.service }}!"
            cat npm-audit.json | jq '.advisories'
            exit 1
          fi
          
          echo "✅ No high/critical vulnerabilities found"
        
      - name: 🧪 Run Tests with Coverage
        working-directory: ${{ matrix.service }}
        run: |
          echo "🧪 Running tests with coverage for ${{ matrix.service }}..."
          npm run test:coverage
          echo "✅ Tests passed with required coverage"
          
      - name: 📊 Generate Service Report
        working-directory: ${{ matrix.service }}
        if: always()
        run: |
          echo "📊 Generating quality report for ${{ matrix.service }}..."
          mkdir -p reports
          
          # ESLint report
          npm run lint:check -- --format json --output-file reports/eslint-report.json || true
          
          # Coverage summary
          if [ -f "coverage/coverage-summary.json" ]; then
            cp coverage/coverage-summary.json reports/
          fi
          
          # Service-specific summary
          cat > reports/service-summary.json << EOF
          {
            "service": "${{ matrix.service }}",
            "type": "${{ matrix.service == 'self-serve-api' && 'auth-service' || 'api-gateway' }}",
            "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
            "checks": {
              "eslint": "completed",
              "typescript": "completed",
              "security_audit": "completed",
              "tests": "completed"
            }
          }
          EOF
          
          echo "✅ Quality report generated for ${{ matrix.service }}"
          
      - name: 📤 Upload Reports
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: quality-reports-${{ matrix.service }}
          path: ${{ matrix.service }}/reports/
          retention-days: 30

  # ============================================
  # SECURITY ANALYSIS (CORE SERVICES)
  # ============================================
  security-analysis:
    name: 🔒 Security Analysis
    runs-on: ubuntu-latest
    needs: detect-changes
    if: needs.detect-changes.outputs.services != '[]'
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
  # QUALITY GATE SUMMARY
  # ============================================
  core-quality-summary:
    name: 📊 Core Quality Summary
    runs-on: ubuntu-latest
    needs: [detect-changes, core-quality-check, security-analysis]
    if: always()
    
    steps:
      - name: 📊 Generate Summary
        run: |
          echo "## 🎯 Core Services Quality Gate Results" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "| Service | Type | Status | Details |" >> $GITHUB_STEP_SUMMARY
          echo "|---------|------|--------|---------|" >> $GITHUB_STEP_SUMMARY
          
          # Check which services were tested
          SERVICES='${{ needs.detect-changes.outputs.services }}'
          if echo "$SERVICES" | grep -q "self-serve-api-gateway"; then
            echo "| API Gateway | 🚪 Gateway | ${{ needs.core-quality-check.result == 'success' && '✅ Passed' || '❌ Failed' }} | Routing, Middleware, Security |" >> $GITHUB_STEP_SUMMARY
          fi
          
          if echo "$SERVICES" | grep -q "self-serve-api"; then
            echo "| Auth Service | 🔐 Authentication | ${{ needs.core-quality-check.result == 'success' && '✅ Passed' || '❌ Failed' }} | JWT, OAuth, Security |" >> $GITHUB_STEP_SUMMARY
          fi
          
          echo "| Security Analysis | 🔒 CodeQL | ${{ needs.security-analysis.result == 'success' && '✅ Passed' || '❌ Failed' }} | Vulnerability Scanning |" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "### 🔍 Quality Checks Performed" >> $GITHUB_STEP_SUMMARY
          echo "- ✅ **ESLint**: Enhanced security and quality rules" >> $GITHUB_STEP_SUMMARY
          echo "- ✅ **TypeScript**: Strict type checking" >> $GITHUB_STEP_SUMMARY
          echo "- ✅ **Jest**: Unit tests with service-specific coverage" >> $GITHUB_STEP_SUMMARY
          echo "- ✅ **NPM Audit**: Dependency vulnerability scanning" >> $GITHUB_STEP_SUMMARY
          echo "- ✅ **CodeQL**: GitHub security analysis" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "### 📈 Coverage Targets" >> $GITHUB_STEP_SUMMARY
          echo "- **API Gateway**: 85% coverage (routing complexity considered)" >> $GITHUB_STEP_SUMMARY
          echo "- **Auth Service**: 92% coverage (security-critical service)" >> $GITHUB_STEP_SUMMARY
          
      - name: ❌ Fail if Quality Gate Failed
        if: needs.core-quality-check.result == 'failure' || needs.security-analysis.result == 'failure'
        run: |
          echo "❌ Core services quality gate failed!"
          echo "Quality Check: ${{ needs.core-quality-check.result }}"
          echo "Security Analysis: ${{ needs.security-analysis.result }}"
          exit 1
          
      - name: ✅ Quality Gate Success
        if: needs.core-quality-check.result == 'success' && needs.security-analysis.result == 'success'
        run: |
          echo "✅ All core services quality gates passed!"
          echo "🚀 API Gateway and Auth Service are ready for deployment."
```

---

## 🤖 Cursor AI Configuration (Core Services)

### `.cursor/settings.json`
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
  "eslint.validate": ["typescript"],
  "eslint.workingDirectories": [
    "self-serve-api-gateway",
    "self-serve-api"
  ],
  
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "typescript.updateImportsOnFileMove.enabled": "always",
  
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true,
    "source.addMissingImports": true
  },
  
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  
  "files.associations": {
    "*.env*": "dotenv"
  },
  
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/coverage": true
  }
}
```

### Core Services AI Prompts

Create `.cursor/core-prompts.json`:
```json
{
  "prompts": [
    {
      "name": "🔐 Auth Security Review",
      "description": "Security review for authentication service",
      "prompt": "Please perform a comprehensive security review of this authentication code:\n\n**Critical Security Areas:**\n1. JWT token handling and validation\n2. Password hashing and storage\n3. OAuth flow security\n4. Session management\n5. Input validation and sanitization\n6. Rate limiting and brute force protection\n7. Timing attack prevention\n8. Sensitive data exposure\n\n**OWASP Authentication Guidelines:**\n- Check against OWASP Authentication Cheat Sheet\n- Verify secure session management\n- Validate proper error handling\n\nProvide specific security improvements with code examples."
    },
    {
      "name": "🚪 Gateway Security Review", 
      "description": "Security review for API gateway",
      "prompt": "Please review this API Gateway code for security vulnerabilities:\n\n**Gateway Security Focus:**\n1. Request routing and validation\n2. Rate limiting implementation\n3. CORS configuration\n4. Header manipulation security\n5. Proxy security (SSRF prevention)\n6. Authentication middleware\n7. Request/response filtering\n8. DDoS protection measures\n\n**Gateway-Specific Risks:**\n- Path traversal in routing\n- Header injection attacks\n- Proxy bypass attempts\n- Rate limit bypass\n\nProvide specific fixes and security enhancements."
    },
    {
      "name": "⚡ Performance Optimization",
      "description": "Performance review for core services",
      "prompt": "Analyze this code for performance optimization opportunities:\n\n**For API Gateway:**\n- Request routing efficiency\n- Middleware performance\n- Connection pooling\n- Response caching strategies\n- Load balancing considerations\n\n**For Auth Service:**\n- Database query optimization\n- JWT processing efficiency\n- Password hashing performance\n- Session storage optimization\n- Cache utilization\n\nProvide specific performance improvements with benchmarks."
    }
  ]
}
```

---

## 🔧 Security-Focused Configurations

### Security ESLint Config for Both Services

Create `.eslintrc.security.js` in both service directories:

```javascript
// .eslintrc.security.js (for both services)
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
    
    // Additional security rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    
    // Auth service specific (stricter for self-serve-api)
    ...(process.cwd().includes('self-serve-api') && !process.cwd().includes('gateway') ? {
      'no-console': 'error', // No console logs in auth service
      'security/detect-possible-timing-attacks': 'error' // Critical for auth
    } : {
      'no-console': 'warn' // Allow console in gateway for logging
    })
  },
  env: {
    node: true,
    es6: true
  }
};
```

---

## 🧪 Testing Setup

### Test Structure for API Gateway
```
self-serve-api-gateway/
├── src/
│   ├── middleware/
│   ├── routes/
│   └── utils/
└── __tests__/
    ├── middleware/
    │   ├── auth.middleware.test.ts
    │   └── rate-limit.middleware.test.ts
    ├── routes/
    │   └── proxy.routes.test.ts
    └── utils/
        └── jwt.utils.test.ts
```

### Test Structure for Auth Service
```
self-serve-api/
├── src/
│   ├── controllers/
│   ├── services/
│   └── middleware/
└── tests/
    ├── unit/
    │   ├── controllers/
    │   │   ├── auth.controller.test.ts
    │   │   └── oauth.controller.test.ts
    │   └── services/
    │       ├── auth.service.test.ts
    │       └── jwt.service.test.ts
    └── integration/
        └── auth.integration.test.ts
```

---

## ✅ Verification Steps

### 1. Test API Gateway Setup
```bash
cd self-serve-api-gateway

# Install dependencies
npm ci

# Run quality checks
npm run quality-gate

# Test individual checks
npm run lint:check
npm run type-check
npm run test:coverage
```

### 2. Test Auth Service Setup
```bash
cd self-serve-api

# Install dependencies  
npm ci

# Run quality checks
npm run quality-gate

# Test with existing tests
npm run test:coverage
```

### 3. Test GitHub Actions
```bash
# Create test branch
git checkout -b test/core-quality-gates

# Make a small change in API gateway
echo "// Test change" >> self-serve-api-gateway/src/server.ts

# Commit and push
git add .
git commit -m "test: verify core quality gates"
git push origin test/core-quality-gates
```

### 4. Test Cursor AI Integration
1. Open a file in `self-serve-api/src/controllers/`
2. Use **Ctrl+Shift+Q** to run quality checks
3. Test the "Auth Security Review" AI prompt
4. Verify ESLint auto-fixes work

---

## 📊 Success Metrics

After implementation, you should see:

- ✅ **API Gateway**: 85%+ test coverage, security-focused linting
- ✅ **Auth Service**: 92%+ test coverage, strict security rules  
- ✅ **Zero High-Severity Vulnerabilities**: In both services
- ✅ **Fast Feedback**: Quality checks complete in < 3 minutes
- ✅ **AI-Enhanced Development**: Cursor AI security suggestions
- ✅ **Automated Quality Gates**: Every commit and PR checked

---

## 🚀 Future Expansion

Once the core services are stable, you can easily expand to other services by:

1. **Copy configurations** from core services
2. **Add service to GitHub Actions** matrix
3. **Adjust coverage thresholds** per service complexity
4. **Update Cursor settings** to include new service directories

This focused approach gives you immediate value on the most critical services while establishing patterns for future expansion! 🎯
