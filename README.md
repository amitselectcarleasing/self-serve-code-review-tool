# @self-serve/code-review-tool

Universal code review and quality analysis tool for microservices.

## 🚀 Quick Start

```bash
# Install globally
npm install -g @self-serve/code-review-tool

# Initialize in your project
cd your-microservice
self-serve-review init --template=api-gateway

# Run analysis
self-serve-review analyze
```

## 📋 Available Templates

- `api-gateway` - For API Gateway services with proxy and middleware rules
- `backend-service` - For backend microservices with database and API rules
- `frontend` - For frontend applications with React/Vue specific rules
- `microservice-base` - Base rules for any microservice

## 🎯 Features

- ✅ **Rule-based analysis** - Focus on specific issues that matter
- ✅ **AI integration** - Generate prompts for Cursor AI analysis
- ✅ **Multiple templates** - Different rules for different service types
- ✅ **Extensible** - Add custom rules and analyzers
- ✅ **CI/CD ready** - Easy integration with GitHub Actions

## 📖 Commands

### Initialize Project
```bash
# Interactive setup
self-serve-review init --interactive

# Use specific template
self-serve-review init --template=backend-service
```

### Run Analysis
```bash
# Basic analysis
self-serve-review analyze

# Generate AI prompts
self-serve-review analyze --ai-prompts

# Specific severity level
self-serve-review analyze --severity=error
```

### Manage Templates
```bash
# List available templates
self-serve-review templates

# Show template details
self-serve-review templates show api-gateway
```

## 🔧 Configuration

Create `.self-serve-review.json` in your project root:

```json
{
  "extends": "api-gateway",
  "rules": {
    "no-console-log": {
      "severity": "error",
      "environments": ["production"]
    }
  },
  "ignore": ["dist/", "build/"],
  "reporters": ["html", "ai-prompts"]
}
```

## 🤖 AI Integration

The tool generates focused prompts for AI analysis:

```bash
# Generate AI prompts
self-serve-review analyze --ai-prompts

# Copy generated prompts into Cursor AI
@codebase Custom Rule Analysis
[Generated prompt with specific rules to check]
```

## 📊 Example Output

```
🔍 Self-Serve Code Review Analysis
================================================================================
✅ TypeScript: No type errors found!
❌ ESLint: 5 errors, 2 warnings
⚠️  Security: 1 vulnerability found
✅ Tests: Coverage 85%

Overall Score: 78/100 (B-)

📋 Reports generated:
- HTML Report: ./reports/quality-report.html
- AI Prompts: ./reports/ai-prompts.md
```

## 📚 Documentation

For comprehensive documentation, implementation guides, and detailed usage instructions, see the [docs/](docs/) folder:

- **[Quick Reference](docs/QUICK_REFERENCE.md)** - Quick start guide
- **[Implementation Guide](docs/IMPLEMENTATION_GUIDE.md)** - Complete setup walkthrough
- **[Code Quality System](docs/CODE_QUALITY_SYSTEM.md)** - Quality standards and rules
- **[Publishing Guide](docs/PUBLISHING_GUIDE.md)** - Publishing and distribution
- **[Developer Workflow](DEVELOPER_WORKFLOW.md)** - Complete developer flow with local tools
- **[Implementation Files](IMPLEMENTATION_FILES.md)** - Files to add/update in microservices
- **[Flow Diagram](DEVELOPER_FLOW_DIAGRAM.md)** - Visual workflow representation

## 🏗️ Development

```bash
# Clone repository
git clone https://github.com/amitselectcarleasing/self-serve-code-review-tool.git

# Install dependencies
npm install

# Run tests
npm test

# Test CLI locally
npm link
self-serve-review --help
```

## 📄 License

MIT License - see LICENSE file for details.
