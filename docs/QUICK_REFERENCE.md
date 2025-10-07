# 🚀 Quick Reference: Code Quality System

## 📋 Daily Developer Workflow

### Before You Start Coding
```bash
# Pull latest changes
git pull origin develop

# Install/update dependencies
npm ci

# Run quality check to ensure clean start
npm run quality-gate
```

### During Development
```bash
# Auto-fix code issues (Cursor shortcut: Ctrl+Shift+F)
npm run lint:fix

# Check types (Cursor shortcut: Ctrl+Shift+T)
npm run type-check

# Run tests with coverage
npm run test:coverage

# Security scan (Cursor shortcut: Ctrl+Shift+S)
npm run lint:security
```

### Before Committing
```bash
# Full quality gate (Cursor shortcut: Ctrl+Shift+Q)
npm run quality-gate

# Commit with conventional format
npm run commit
# OR use git commit (pre-commit hooks will run automatically)
git add .
git commit -m "feat: add new feature"
```

---

## 🤖 Cursor AI Commands

### Built-in Shortcuts
- **Ctrl+Shift+Q**: Full quality check
- **Ctrl+Shift+S**: Security scan  
- **Ctrl+Shift+T**: Test coverage
- **Ctrl+Shift+F**: Fix ESLint issues

### AI Prompts (Right-click → Ask AI)
- **"Security Review"**: Comprehensive security analysis
- **"Performance Review"**: Performance optimization suggestions
- **"Architecture Review"**: Code design and patterns analysis
- **"Test Strategy Review"**: Testing approach recommendations

### Manual AI Queries
```
@cursor Please review this code for:
1. Security vulnerabilities
2. Performance issues  
3. Best practices violations
4. Testing gaps

Provide specific fixes with examples.
```

---

## 🔍 Quality Standards Checklist

### ✅ Code Quality
- [ ] ESLint passes with zero errors
- [ ] TypeScript strict mode compliance
- [ ] Complexity < 10 per function
- [ ] Max 50 lines per function
- [ ] No duplicate code blocks
- [ ] Proper error handling

### 🛡️ Security
- [ ] No high/critical vulnerabilities
- [ ] Input validation implemented
- [ ] No hardcoded secrets
- [ ] SQL injection prevention
- [ ] XSS protection measures
- [ ] Authentication checks

### 🧪 Testing
- [ ] 85%+ test coverage
- [ ] All critical paths tested
- [ ] Edge cases covered
- [ ] Mock usage appropriate
- [ ] Tests are maintainable
- [ ] No flaky tests

### 📝 Documentation
- [ ] Functions have JSDoc comments
- [ ] Complex logic explained
- [ ] README updated if needed
- [ ] API changes documented
- [ ] Breaking changes noted

---

## 🚨 Common Issues & Quick Fixes

### ESLint Errors

**"security/detect-object-injection"**
```typescript
// ❌ Bad
const value = obj[userInput];

// ✅ Good  
const allowedKeys = ['name', 'email'];
const value = allowedKeys.includes(userInput) ? obj[userInput] : null;
```

**"sonarjs/cognitive-complexity"**
```typescript
// ❌ Bad - complex nested logic
function processUser(user) {
  if (user) {
    if (user.active) {
      if (user.permissions) {
        // nested logic...
      }
    }
  }
}

// ✅ Good - early returns
function processUser(user) {
  if (!user?.active) return null;
  if (!user.permissions) return null;
  
  // simplified logic...
}
```

**"@typescript-eslint/no-explicit-any"**
```typescript
// ❌ Bad
function process(data: any) {
  return data.something;
}

// ✅ Good
interface ProcessData {
  something: string;
}
function process(data: ProcessData) {
  return data.something;
}
```

### TypeScript Errors

**"Object is possibly 'null' or 'undefined'"**
```typescript
// ❌ Bad
const result = user.profile.name;

// ✅ Good
const result = user?.profile?.name ?? 'Unknown';
```

**"Property does not exist on type"**
```typescript
// ❌ Bad
interface User {
  name: string;
}
const user: User = { name: 'John', age: 30 }; // Error

// ✅ Good
interface User {
  name: string;
  age?: number;
}
const user: User = { name: 'John', age: 30 };
```

### Test Coverage Issues

**Increase coverage for untested functions:**
```typescript
// Add test for error scenarios
describe('UserService.createUser', () => {
  it('should handle database errors', async () => {
    mockDb.create.mockRejectedValue(new Error('DB Error'));
    
    await expect(userService.createUser(userData))
      .rejects.toThrow('DB Error');
  });
});
```

**Cover edge cases:**
```typescript
// Test boundary conditions
it('should handle empty input', () => {
  expect(validateEmail('')).toBe(false);
});

it('should handle null input', () => {
  expect(validateEmail(null)).toBe(false);
});
```

---

## 📊 GitHub Actions Status

### ✅ Successful Build
All quality gates passed:
- ESLint: ✅ Passed
- TypeScript: ✅ Passed  
- Security: ✅ Passed
- Tests: ✅ Passed
- Coverage: ✅ 90%+

### ❌ Failed Build
Check the specific failure:

**ESLint Failure:**
```bash
# Run locally to debug
npm run lint:check

# Fix issues
npm run lint:fix

# Commit fixes
git add . && git commit -m "fix: resolve linting issues"
```

**Test Failure:**
```bash
# Run tests locally
npm run test:coverage

# Debug specific test
npm test -- --testNamePattern="specific test name"

# Fix and commit
git add . && git commit -m "fix: resolve test failures"
```

**Security Failure:**
```bash
# Check vulnerabilities
npm audit

# Fix high/critical issues
npm audit fix

# Update dependencies if needed
npm update

# Commit fixes
git add . && git commit -m "fix: resolve security vulnerabilities"
```

---

## 🎯 Performance Tips

### Faster Local Development
```bash
# Run only changed files
npx eslint src/changed-file.ts

# Run specific test suite
npm test -- src/services/auth.test.ts

# Skip coverage for faster tests
npm test -- --coverage=false

# Use watch mode during development
npm run test:watch
```

### Optimize CI/CD Performance
- Only changed services are tested automatically
- Use `npm ci` instead of `npm install` in CI
- Parallel test execution enabled
- Coverage reports cached between runs

---

## 🔧 Emergency Procedures

### Bypass Quality Gates (Emergency Only)
```bash
# Skip pre-commit hooks (NOT RECOMMENDED)
git commit --no-verify -m "emergency: critical hotfix"

# Skip specific ESLint rules
// eslint-disable-next-line security/detect-object-injection
const value = obj[key];

# Skip TypeScript errors (NOT RECOMMENDED)
// @ts-ignore
const result = riskyOperation();
```

### Rollback Changes
```bash
# Revert last commit
git revert HEAD

# Reset to previous state
git reset --hard HEAD~1

# Create hotfix branch
git checkout -b hotfix/emergency-fix
```

---

## 📞 Getting Help

### 1. Self-Service Debugging
```bash
# Check all quality gates locally
npm run quality-gate

# Get detailed ESLint report
npm run lint:check -- --format detailed

# Generate coverage report
npm run test:coverage -- --verbose
```

### 2. Cursor AI Assistance
- Use built-in AI prompts for code review
- Ask specific questions about errors
- Request refactoring suggestions
- Get security recommendations

### 3. Team Support
- Check existing GitHub issues
- Review documentation in `/docs`
- Ask in team chat with error details
- Create GitHub issue for systematic problems

### 4. External Resources
- [ESLint Rules Documentation](https://eslint.org/docs/rules/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [Security Best Practices](https://owasp.org/www-project-top-ten/)

---

## 🚀 Premium Tools (Future)

### When to Enable Premium Tools

**Enable SonarCloud when:**
- Team size > 5 developers
- Need detailed quality metrics
- Want historical trend analysis
- Require custom quality gates

**Enable Snyk when:**
- Handling sensitive data
- Need advanced vulnerability database
- Want automated security updates
- Require compliance reporting

**Enable Codecov when:**
- Need visual coverage reports
- Want coverage trend analysis
- Require PR coverage comments
- Need detailed coverage analytics

### Quick Enable Process
```yaml
# In .github/workflows/quality-gate.yml
env:
  ENABLE_SNYK: true      # Enable Snyk
  ENABLE_SONAR: true     # Enable SonarCloud  
  ENABLE_CODECOV: true   # Enable Codecov
```

Add required secrets to GitHub repository settings.

---

This quick reference should be bookmarked by all developers for daily use! 🎯
