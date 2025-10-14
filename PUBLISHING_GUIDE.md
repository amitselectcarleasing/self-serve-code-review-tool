# Code Review Tool - Publishing Guide

This guide explains how to make changes, version, commit, push, and publish the `@selectamitpatra/code-review-tool` package to npm.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Making Code Changes](#making-code-changes)
3. [Testing Your Changes](#testing-your-changes)
4. [Versioning](#versioning)
5. [Committing Changes](#committing-changes)
6. [Publishing to npm](#publishing-to-npm)
7. [Updating Dependent Services](#updating-dependent-services)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js** (v14 or higher)
- **npm** account with publish permissions to `@selectamitpatra` scope
- **npm login** credentials configured (`npm login`)
- **Git** installed and configured
- Access to the GitHub repository: `https://github.com/amitselectcarleasing/self-serve-code-review-tool`

### Verify npm Login

```bash
npm whoami
```

If not logged in:

```bash
npm login
```

---

## Making Code Changes

### 1. Navigate to the Package Directory

```bash
cd "C:\Users\Admin\Documents\New folder\test\self-serve-application\self-serve-code-review-tool"
```

### 2. Create a Feature Branch (Optional but Recommended)

```bash
git checkout -b feature/your-feature-name
```

### 3. Make Your Changes

Edit the relevant files:

- **Core Logic**: `lib/analyzer-base.js`, `lib/index.js`, `lib/report-generator.js`
- **CLI**: `bin/cli.js`
- **Templates**: `templates/api-gateway/rules.json`, `templates/backend-service/rules.json`
- **Tests**: `tests/basic.test.js`

### Example: Updating Security Audit Level

```javascript
// lib/analyzer-base.js
async checkSecurity() {
  console.log('📋 Security Vulnerability Scan');
  
  const result = await this.runCommand(
    'npm audit --audit-level=high --json', // Changed from moderate
    'NPM security audit'
  );
  // ... rest of the function
}
```

---

## Testing Your Changes

### 1. Run Tests

```bash
npm test
```

Ensure all tests pass before proceeding.

### 2. Test Locally in a Project

Before publishing, test the changes locally:

```bash
# In the code-review-tool directory
npm link

# In your target project (e.g., self-serve-api)
cd ../self-serve-api
npm link @selectamitpatra/code-review-tool

# Run the tool
npm run code-review:full

# Unlink when done testing
npm unlink @selectamitpatra/code-review-tool
npm install
```

---

## Versioning

Follow [Semantic Versioning](https://semver.org/) (MAJOR.MINOR.PATCH):

- **MAJOR** (e.g., 1.x.x → 2.0.0): Breaking changes
- **MINOR** (e.g., 1.4.x → 1.5.0): New features, backward compatible
- **PATCH** (e.g., 1.4.4 → 1.4.5): Bug fixes, backward compatible

### Update Version in package.json

**Option 1: Manual Update**

Edit `package.json`:

```json
{
  "name": "@selectamitpatra/code-review-tool",
  "version": "1.4.5", // Update this
  ...
}
```

**Option 2: Using npm version (Recommended)**

```bash
# For a patch release (1.4.4 → 1.4.5)
npm version patch

# For a minor release (1.4.4 → 1.5.0)
npm version minor

# For a major release (1.4.4 → 2.0.0)
npm version major
```

This will automatically:
- Update `package.json`
- Update `package-lock.json`
- Create a git commit
- Create a git tag

---

## Committing Changes

### 1. Stage Your Changes

```bash
git add .
```

### 2. Commit with a Descriptive Message

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# For new features
git commit -m "feat: add support for custom audit levels"

# For bug fixes
git commit -m "fix: resolve issue with circular dependency detection"

# For documentation
git commit -m "docs: update publishing guide"

# For refactoring
git commit -m "refactor: improve security analyzer performance"

# For tests
git commit -m "test: add tests for new analyzer"
```

### 3. Push to GitHub

```bash
# Push to master (or your feature branch)
git push origin master

# If you created a tag with npm version, push tags too
git push origin master --tags
```

---

## Publishing to npm

### 1. Ensure You're on the Correct Branch

```bash
git branch
# Should be on master or your release branch
```

### 2. Verify Package Configuration

Check `package.json`:

```json
{
  "name": "@selectamitpatra/code-review-tool",
  "version": "1.4.5", // Correct version
  "publishConfig": {
    "access": "public" // Required for scoped packages
  }
}
```

### 3. Run Pre-publish Checks

The `prepublishOnly` script will run automatically, but you can test it:

```bash
npm run prepublishOnly
```

This runs `npm test` to ensure all tests pass.

### 4. Publish to npm

```bash
npm publish --access public
```

**Expected Output:**

```
> @selectamitpatra/code-review-tool@1.4.5 prepublishOnly
> npm test

PASS tests/basic.test.js
  ✓ All tests passed

npm notice
npm notice 📦  @selectamitpatra/code-review-tool@1.4.5
npm notice === Tarball Contents ===
...
npm notice
+ @selectamitpatra/code-review-tool@1.4.5
```

### 5. Verify Publication

```bash
npm view @selectamitpatra/code-review-tool version
# Should output: 1.4.5

npm view @selectamitpatra/code-review-tool
# Should show the full package details
```

Or check online:
- https://www.npmjs.com/package/@selectamitpatra/code-review-tool

---

## Updating Dependent Services

After publishing, update the package in services that depend on it.

### Services Using the Code Review Tool

1. **self-serve-api** (Auth Service)
2. **self-serve-api-gateway** (API Gateway)

### Update Process

#### 1. Update self-serve-api

```bash
cd "C:\Users\Admin\Documents\New folder\test\self-serve-application\self-serve-api"

# Update to the latest version
npm install @selectamitpatra/code-review-tool@latest --save-dev

# Or update to a specific version
npm install @selectamitpatra/code-review-tool@1.4.5 --save-dev

# Test the update
npm run code-review:full

# Commit and push
git add package.json package-lock.json
git commit -m "chore: update @selectamitpatra/code-review-tool to v1.4.5"
git push origin staging
```

#### 2. Update self-serve-api-gateway

```bash
cd "C:\Users\Admin\Documents\New folder\test\self-serve-application\self-serve-api-gateway"

# Update to the latest version
npm install @selectamitpatra/code-review-tool@latest --save-dev

# Test the update
npm run code-review:full

# Commit and push
git add package.json package-lock.json
git commit -m "chore: update @selectamitpatra/code-review-tool to v1.4.5"
git push origin staging
```

---

## Complete Workflow Example

Here's the complete step-by-step process:

```bash
# 1. Navigate to code-review-tool
cd "C:\Users\Admin\Documents\New folder\test\self-serve-application\self-serve-code-review-tool"

# 2. Make your changes (edit files as needed)
# ... edit lib/analyzer-base.js, etc.

# 3. Run tests
npm test

# 4. Update version (choose one based on change type)
npm version patch  # or minor, or major

# 5. Stage and commit (if not using npm version)
git add .
git commit -m "feat: your feature description (vX.X.X)"

# 6. Push to GitHub
git push origin master --tags

# 7. Publish to npm
npm publish --access public

# 8. Verify publication
npm view @selectamitpatra/code-review-tool version

# 9. Update self-serve-api
cd ../self-serve-api
npm install @selectamitpatra/code-review-tool@latest --save-dev
npm run code-review:full
git add package.json package-lock.json
git commit -m "chore: update @selectamitpatra/code-review-tool to vX.X.X"
git push origin staging

# 10. Update self-serve-api-gateway
cd ../self-serve-api-gateway
npm install @selectamitpatra/code-review-tool@latest --save-dev
npm run code-review:full
git add package.json package-lock.json
git commit -m "chore: update @selectamitpatra/code-review-tool to vX.X.X"
git push origin staging
```

---

## Troubleshooting

### Issue: "You do not have permission to publish"

**Solution:**

1. Ensure you're logged in:
   ```bash
   npm whoami
   ```

2. Login if needed:
   ```bash
   npm login
   ```

3. Verify you have access to the `@selectamitpatra` scope.

### Issue: "Version already exists"

**Solution:**

1. Check the current published version:
   ```bash
   npm view @selectamitpatra/code-review-tool version
   ```

2. Update to a higher version in `package.json` or use:
   ```bash
   npm version patch
   ```

### Issue: "Tests failing before publish"

**Solution:**

1. Fix the failing tests in `tests/basic.test.js`
2. Run `npm test` to verify
3. If tests are intentionally skipped, ensure `prepublishOnly` script handles it

### Issue: "Package size too large"

**Solution:**

1. Check `.npmignore` file to exclude unnecessary files
2. Review `files` field in `package.json`:
   ```json
   "files": [
     "lib/",
     "bin/",
     "templates/",
     "analyzers/",
     "reporters/",
     "README.md"
   ]
   ```

### Issue: "Deprecation warnings for dependencies"

**Solution:**

1. Update dependencies:
   ```bash
   npm update
   ```

2. Check for major version updates:
   ```bash
   npm outdated
   ```

3. Update specific packages:
   ```bash
   npm install package-name@latest --save
   ```

---

## Best Practices

### 1. **Always Test Before Publishing**

```bash
npm test
npm run code-review:full # If available
```

### 2. **Use Semantic Versioning**

- **Patch** (1.4.4 → 1.4.5): Bug fixes only
- **Minor** (1.4.4 → 1.5.0): New features, backward compatible
- **Major** (1.4.4 → 2.0.0): Breaking changes

### 3. **Write Clear Commit Messages**

Use conventional commits:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `refactor:` for code refactoring
- `test:` for tests
- `chore:` for maintenance tasks

### 4. **Update CHANGELOG.md** (If Available)

Document all changes in CHANGELOG.md:

```markdown
## [1.4.5] - 2024-10-14

### Added
- Support for custom audit levels

### Fixed
- Issue with circular dependency detection

### Changed
- Improved security analyzer performance
```

### 5. **Tag Releases**

```bash
git tag -a v1.4.5 -m "Release version 1.4.5"
git push origin v1.4.5
```

### 6. **Keep README.md Updated**

Update README.md with:
- New features
- Configuration changes
- Breaking changes
- Migration guides

---

## Version History

| Version | Date       | Changes                                                      |
|---------|------------|--------------------------------------------------------------|
| 1.4.4   | 2024-10-14 | Updated npm audit to use --audit-level=high                  |
| 1.4.3   | 2024-10-13 | Fixed test cases coverage parsing                            |
| 1.4.2   | 2024-10-12 | Added backend-service template support                       |
| 1.4.1   | 2024-10-11 | Improved architecture analyzer                               |
| 1.4.0   | 2024-10-10 | Added custom rules analyzer                                  |

---

## Additional Resources

- **npm Documentation**: https://docs.npmjs.com/
- **Semantic Versioning**: https://semver.org/
- **Conventional Commits**: https://www.conventionalcommits.org/
- **Package Repository**: https://github.com/amitselectcarleasing/self-serve-code-review-tool

---

## Support

For issues or questions:

1. **GitHub Issues**: https://github.com/amitselectcarleasing/self-serve-code-review-tool/issues
2. **npm Package**: https://www.npmjs.com/package/@selectamitpatra/code-review-tool
3. **Contact**: AmitPatra@selectcarleasing.co.uk

---

## Quick Reference

### One-Line Commands

```bash
# Update version and publish in one go
npm version patch && git push origin master --tags && npm publish --access public

# Update all dependent services
cd ../self-serve-api && npm i @selectamitpatra/code-review-tool@latest -D && cd ../self-serve-api-gateway && npm i @selectamitpatra/code-review-tool@latest -D

# Verify publication
npm view @selectamitpatra/code-review-tool
```

---

**Last Updated**: October 14, 2024  
**Current Version**: 1.4.4  
**Maintainer**: selectamitpatra (AmitPatra@selectcarleasing.co.uk)

