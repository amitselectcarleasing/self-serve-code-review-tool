# 🤖 Cursor AI Integration Guide

## How Cursor AI Works with the Code Review Tool

The code review tool generates **AI prompts** that you can copy and paste into Cursor AI for intelligent code analysis and improvement.

## 📋 Generated Files

When you run `npm run code-review:full` or `npm run code-review:ai`, the tool creates:

- `reports/cursor-ai-prompts-*.md` - AI prompts for Cursor AI
- `reports/code-review-report.html` - Detailed HTML report

## 🎯 How to Use with Cursor AI

### Step 1: Run Code Review
```bash
npm run code-review:full
```

### Step 2: Open the AI Prompts File
Open `reports/cursor-ai-prompts-*.md` in your editor.

### Step 3: Copy Prompts to Cursor AI
The file contains structured prompts like:

```markdown
## 🐛 Critical Bug Analysis

Please analyze these potential bugs in the codebase:

File: src/services/auth.service.ts:45
Issue: Potential memory leak: setInterval without clearInterval
Code: setInterval(() => { checkStatus(); }, 1000);
Suggestion: Store interval ID and clear it when component unmounts

Provide detailed analysis and fixes for each bug.
```

### Step 4: Use with Cursor AI
1. **Open Cursor AI** (Ctrl+K or Cmd+K)
2. **Paste the prompt** from the generated file
3. **Let Cursor AI analyze** and provide fixes
4. **Apply the suggested changes**

## 🔍 Types of AI Prompts Generated

### 1. **Bug Analysis Prompts**
- Memory leaks detection
- SQL injection vulnerabilities
- Hardcoded secrets
- Infinite loops
- Race conditions

### 2. **Test Generation Prompts**
- Missing test cases
- Test quality improvement
- Edge case testing
- Integration test suggestions

### 3. **Code Review Prompts**
- ESLint error fixes
- TypeScript improvements
- Code structure optimization
- Best practices implementation

### 4. **Security Review Prompts**
- Security vulnerability analysis
- Secure coding practices
- Authentication improvements
- Data protection suggestions

### 5. **Refactoring Prompts**
- Complex function simplification
- Performance optimization
- Code readability improvements
- Architecture enhancements

## 📊 Example Workflow

### 1. Run Analysis
```bash
cd self-serve-api
npm run code-review:full
```

### 2. Check Results
```
✅ Analysis complete! Score: 45/100 (F)
📊 Reports Generated:
  📄 HTML: ./reports/code-review-report.html
  📄 AIPROMPTS: ./reports/cursor-ai-prompts-*.md
```

### 3. Open AI Prompts
```bash
code reports/cursor-ai-prompts-*.md
```

### 4. Use with Cursor AI
Copy the relevant prompt and paste it into Cursor AI:

```
@codebase Bug Analysis

Please analyze these potential bugs in the codebase:

File: src/controllers/auth.controller.ts:123
Issue: Async function without error handling
Code: async function login(req, res) { ... }
Suggestion: Add try-catch blocks to async functions

Provide detailed analysis and fixes for each bug.
```

### 5. Apply Fixes
Cursor AI will provide:
- ✅ **Exact line numbers** for issues
- ✅ **Specific code fixes** 
- ✅ **Explanations** for changes
- ✅ **Best practices** recommendations

## 🎯 Benefits

### **For Developers:**
- **Intelligent Analysis**: AI understands context and provides relevant fixes
- **Learning**: Understand why certain patterns are problematic
- **Efficiency**: Get specific, actionable suggestions
- **Consistency**: Apply best practices across the codebase

### **For Code Quality:**
- **Bug Prevention**: Catch issues before they reach production
- **Security**: Identify and fix security vulnerabilities
- **Performance**: Optimize code for better performance
- **Maintainability**: Improve code structure and readability

## 🔧 Customization

You can customize the AI prompts by modifying the `generateCursorAIPrompts` method in `analyzer-base.js`:

```javascript
// Add custom prompt categories
prompts.customAnalysis = [{
  title: 'Custom Analysis',
  prompt: 'Your custom prompt here...'
}];
```

## 📈 Integration with Development Workflow

### **Pre-commit Hook:**
- Runs basic analysis
- Generates AI prompts
- Blocks commits with critical issues

### **Pre-push Hook:**
- Runs full analysis
- Generates comprehensive AI prompts
- Ensures quality before pushing

### **CI/CD Pipeline:**
- Automated analysis
- AI prompt generation
- Quality gates enforcement

## 🚀 Advanced Usage

### **Batch Analysis:**
```bash
# Analyze multiple services
for service in self-serve-api self-serve-api-gateway; do
  cd $service
  npm run code-review:full
  echo "Analysis complete for $service"
done
```

### **Custom Analyzers:**
Add your own analyzers to generate specific AI prompts:

```javascript
// In analyzer-base.js
async checkCustomAnalysis() {
  // Your custom analysis logic
  return {
    issues: [...],
    suggestions: [...]
  };
}
```

## 📝 Example AI Prompt Output

```markdown
# 🤖 Cursor AI Analysis Prompts

## 🐛 Critical Bug Analysis

Please analyze these potential bugs in the codebase:

File: src/services/email.service.ts:45
Issue: Potential memory leak: setInterval without clearInterval
Code: setInterval(() => { checkEmailQueue(); }, 5000);
Suggestion: Store interval ID and clear it when service stops

File: src/controllers/user.controller.ts:123
Issue: Hardcoded secret detected
Code: const apiKey = "sk-1234567890abcdef";
Suggestion: Use environment variables or secure configuration

## 🧪 Missing Test Cases

Generate comprehensive test cases for these files:

Source: src/services/auth.service.ts
Suggested: tests/services/auth.service.test.ts
Priority: HIGH

Include unit tests, integration tests, and edge cases.

## 🔒 Security Vulnerability Analysis

Analyze these security risks:

File: src/middleware/auth.middleware.ts:67
Issue: Potential SQL injection vulnerability
Code: const query = "SELECT * FROM users WHERE id = " + userId;
Suggestion: Use parameterized queries or prepared statements

Provide secure alternatives and best practices.
```

This integration makes the code review tool a powerful companion for Cursor AI, providing structured, actionable prompts for intelligent code improvement! 🚀
