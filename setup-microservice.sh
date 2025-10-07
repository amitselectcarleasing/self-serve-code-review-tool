#!/bin/bash

# 🚀 Microservice Code Review Setup Script
# This script sets up the code review tool integration for any microservice

set -e

echo "🚀 Setting up Code Review Tool for Microservice..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    print_error "Not in a git repository. Please run this script from the root of your microservice."
    exit 1
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the root of your microservice."
    exit 1
fi

print_status "Setting up Code Review Tool integration..."

# 1. Install the code review tool
print_status "Installing @selectamitpatra/code-review-tool..."
npm install @selectamitpatra/code-review-tool

# 2. Update package.json with new scripts
print_status "Updating package.json with code review scripts..."

# Create a backup
cp package.json package.json.backup

# Add scripts to package.json (this is a simplified approach)
# In practice, you'd want to use a more robust JSON manipulation tool
cat >> package.json.tmp << 'EOF'
  "code-review": "self-serve-review analyze",
  "code-review:local": "self-serve-review analyze --analyzers=eslint,typescript,security,performance --severity=warning",
  "code-review:ai": "self-serve-review analyze --ai-prompts --severity=error",
  "code-review:ci": "self-serve-review analyze --analyzers=eslint,typescript,security,dependencies,coverage,performance,architecture --severity=error --ci",
  "code-review:full": "self-serve-review analyze --analyzers=eslint,typescript,security,dependencies,coverage,performance,architecture,custom-rules",
  "setup-review": "self-serve-review init --template api-gateway",
  "review:init": "npm run setup-review"
EOF

print_warning "Please manually add the following scripts to your package.json:"
echo ""
echo "  \"code-review\": \"self-serve-review analyze\","
echo "  \"code-review:local\": \"self-serve-review analyze --analyzers=eslint,typescript,security,performance --severity=warning\","
echo "  \"code-review:ai\": \"self-serve-review analyze --ai-prompts --severity=error\","
echo "  \"code-review:ci\": \"self-serve-review analyze --analyzers=eslint,typescript,security,dependencies,coverage,performance,architecture --severity=error --ci\","
echo "  \"code-review:full\": \"self-serve-review analyze --analyzers=eslint,typescript,security,dependencies,coverage,performance,architecture,custom-rules\","
echo "  \"setup-review\": \"self-serve-review init --template api-gateway\","
echo "  \"review:init\": \"npm run setup-review\""
echo ""

# 3. Setup Husky if not already installed
if [ ! -d ".husky" ]; then
    print_status "Setting up Husky..."
    npm install --save-dev husky
    npx husky init
fi

# 4. Create/update pre-commit hook
print_status "Setting up pre-commit hook..."
cat > .husky/pre-commit << 'EOF'
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
EOF

chmod +x .husky/pre-commit

# 5. Create pre-push hook
print_status "Setting up pre-push hook..."
cat > .husky/pre-push << 'EOF'
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
EOF

chmod +x .husky/pre-push

# 6. Initialize code review tool
print_status "Initializing code review tool..."
npm run setup-review

# 7. Create .self-serve-review.json if it doesn't exist
if [ ! -f ".self-serve-review.json" ]; then
    print_status "Creating .self-serve-review.json configuration..."
    cat > .self-serve-review.json << 'EOF'
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
EOF
fi

# 8. Test the setup
print_status "Testing the setup..."
if npm run code-review:local; then
    print_success "Code review tool is working!"
else
    print_warning "Code review tool test failed, but setup is complete."
fi

print_success "Setup complete! 🎉"
echo ""
echo "📋 Next steps:"
echo "1. Add the scripts to your package.json (see output above)"
echo "2. Update your lint-staged configuration to include code review"
echo "3. Test the workflow:"
echo "   - Make a code change"
echo "   - Run: npm run code-review:local"
echo "   - Run: npm run code-review:ai"
echo "   - Copy prompts to Cursor AI"
echo "   - Try committing: git add . && git commit -m 'test'"
echo ""
echo "🔧 Available commands:"
echo "  npm run code-review:local    # Quick local check"
echo "  npm run code-review:ai       # Generate AI prompts"
echo "  npm run code-review:full     # Full analysis"
echo "  npm run code-review:ci       # CI-ready analysis"
echo ""
echo "📚 Documentation:"
echo "  - Developer Workflow: ./docs/DEVELOPER_WORKFLOW.md"
echo "  - Implementation Files: ./docs/IMPLEMENTATION_FILES.md"
echo "  - Flow Diagram: ./docs/DEVELOPER_FLOW_DIAGRAM.md"
