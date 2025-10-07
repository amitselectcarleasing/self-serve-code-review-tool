@echo off
REM 🚀 Microservice Code Review Setup Script for Windows
REM This script sets up the code review tool integration for any microservice

echo 🚀 Setting up Code Review Tool for Microservice...

REM Check if we're in a git repository
if not exist ".git" (
    echo ❌ Not in a git repository. Please run this script from the root of your microservice.
    exit /b 1
)

REM Check if package.json exists
if not exist "package.json" (
    echo ❌ package.json not found. Please run this script from the root of your microservice.
    exit /b 1
)

echo ℹ️  Setting up Code Review Tool integration...

REM 1. Install the code review tool
echo ℹ️  Installing @selectamitpatra/code-review-tool...
npm install @selectamitpatra/code-review-tool

REM 2. Setup Husky if not already installed
if not exist ".husky" (
    echo ℹ️  Setting up Husky...
    npm install --save-dev husky
    npx husky init
)

REM 3. Create/update pre-commit hook
echo ℹ️  Setting up pre-commit hook...
(
echo #!/usr/bin/env sh
echo . "$(dirname -- "$0")/_/husky.sh"
echo.
echo echo "🔍 Running pre-commit checks..."
echo.
echo # 1. Lint and format (fast)
echo npx lint-staged
echo.
echo # 2. Type check
echo npm run type-check
echo.
echo # 3. Basic code review (quick)
echo npm run code-review:local
echo.
echo # 4. Generate AI prompts for developer
echo npm run code-review:ai
echo.
echo echo "✅ Pre-commit checks passed!"
echo echo "📋 AI prompts generated in ./reports/ai-prompts.md"
echo echo "💡 Copy prompts to Cursor AI for detailed analysis"
) > .husky\pre-commit

REM 4. Create pre-push hook
echo ℹ️  Setting up pre-push hook...
(
echo #!/usr/bin/env sh
echo . "$(dirname -- "$0")/_/husky.sh"
echo.
echo echo "🚀 Running pre-push checks..."
echo.
echo # 1. Run tests
echo npm run test
echo.
echo # 2. Full code review analysis
echo npm run code-review:full
echo.
echo # 3. Check for critical issues
echo if npm run code-review:ci; then
echo   echo "✅ All checks passed - ready to push!"
echo else
echo   echo "❌ Critical issues found - fix before pushing"
echo   exit 1
echo fi
) > .husky\pre-push

REM 5. Initialize code review tool
echo ℹ️  Initializing code review tool...
npm run setup-review

REM 6. Create .self-serve-review.json if it doesn't exist
if not exist ".self-serve-review.json" (
    echo ℹ️  Creating .self-serve-review.json configuration...
    (
    echo {
    echo   "extends": "api-gateway",
    echo   "analyzers": [
    echo     "eslint",
    echo     "typescript", 
    echo     "security",
    echo     "dependencies",
    echo     "coverage",
    echo     "performance",
    echo     "architecture",
    echo     "custom-rules"
    echo   ],
    echo   "reporters": [
    echo     "html",
    echo     "json",
    echo     "ai-prompts"
    echo   ],
    echo   "rules": {
    echo     "no-console-log": {
    echo       "severity": "error",
    echo       "environments": ["production"]
    echo     }
    echo   },
    echo   "ignore": [
    echo     "dist/",
    echo     "build/",
    echo     "node_modules/",
    echo     "coverage/"
    echo   ],
    echo   "thresholds": {
    echo     "coverage": 80,
    echo     "performance": 90,
    echo     "security": 100
    echo   }
    echo }
    ) > .self-serve-review.json
)

REM 7. Test the setup
echo ℹ️  Testing the setup...
npm run code-review:local
if %errorlevel% equ 0 (
    echo ✅ Code review tool is working!
) else (
    echo ⚠️  Code review tool test failed, but setup is complete.
)

echo.
echo ✅ Setup complete! 🎉
echo.
echo 📋 Next steps:
echo 1. Add the following scripts to your package.json:
echo.
echo   "code-review": "self-serve-review analyze",
echo   "code-review:local": "self-serve-review analyze --analyzers=eslint,typescript,security,performance --severity=warning",
echo   "code-review:ai": "self-serve-review analyze --ai-prompts --severity=error",
echo   "code-review:ci": "self-serve-review analyze --analyzers=eslint,typescript,security,dependencies,coverage,performance,architecture --severity=error --ci",
echo   "code-review:full": "self-serve-review analyze --analyzers=eslint,typescript,security,dependencies,coverage,performance,architecture,custom-rules",
echo   "setup-review": "self-serve-review init --template api-gateway",
echo   "review:init": "npm run setup-review"
echo.
echo 2. Update your lint-staged configuration to include code review
echo 3. Test the workflow:
echo    - Make a code change
echo    - Run: npm run code-review:local
echo    - Run: npm run code-review:ai
echo    - Copy prompts to Cursor AI
echo    - Try committing: git add . ^&^& git commit -m "test"
echo.
echo 🔧 Available commands:
echo   npm run code-review:local    # Quick local check
echo   npm run code-review:ai       # Generate AI prompts
echo   npm run code-review:full     # Full analysis
echo   npm run code-review:ci       # CI-ready analysis
echo.
echo 📚 Documentation:
echo   - Developer Workflow: ./docs/DEVELOPER_WORKFLOW.md
echo   - Implementation Files: ./docs/IMPLEMENTATION_FILES.md
echo   - Flow Diagram: ./docs/DEVELOPER_FLOW_DIAGRAM.md

pause
