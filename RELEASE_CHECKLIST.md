# Release Checklist for @selectamitpatra/code-review-tool

Use this checklist every time you release a new version of the package.

## Pre-Release Checklist

- [ ] All code changes are complete and tested
- [ ] All tests pass locally (`npm test`)
- [ ] Code has been reviewed (self-review or peer review)
- [ ] Documentation is updated (README.md, comments, etc.)
- [ ] CHANGELOG.md is updated (if applicable)
- [ ] No sensitive data or credentials in code
- [ ] Dependencies are up to date (check `npm outdated`)

## Version Update Checklist

- [ ] Determine version bump type:
  - [ ] **Patch** (1.4.4 → 1.4.5) - Bug fixes only
  - [ ] **Minor** (1.4.4 → 1.5.0) - New features, backward compatible
  - [ ] **Major** (1.4.4 → 2.0.0) - Breaking changes

- [ ] Update version using one of:
  - [ ] `npm version patch`
  - [ ] `npm version minor`
  - [ ] `npm version major`
  - [ ] Manual update in `package.json`

## Git Checklist

- [ ] Stage all changes: `git add .`
- [ ] Commit with conventional commit message:
  - [ ] Format: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
  - [ ] Example: `feat: add custom audit level support (v1.4.5)`
- [ ] Push to GitHub: `git push origin master --tags`
- [ ] Verify push on GitHub repository

## npm Publication Checklist

- [ ] Ensure you're logged in to npm: `npm whoami`
- [ ] Verify `package.json` has correct:
  - [ ] `name`: `@selectamitpatra/code-review-tool`
  - [ ] `version`: Correct new version
  - [ ] `publishConfig.access`: `public`
- [ ] Run pre-publish tests: `npm run prepublishOnly` (or `npm test`)
- [ ] Publish to npm: `npm publish --access public`
- [ ] Verify publication: `npm view @selectamitpatra/code-review-tool version`
- [ ] Check package page: https://www.npmjs.com/package/@selectamitpatra/code-review-tool

## Update Dependent Services Checklist

### Update self-serve-api

- [ ] Navigate to self-serve-api directory
- [ ] Update package: `npm install @selectamitpatra/code-review-tool@latest --save-dev`
- [ ] Verify installation: `npm list @selectamitpatra/code-review-tool`
- [ ] Test code review: `npm run code-review:full`
- [ ] Commit changes: `git add package.json package-lock.json`
- [ ] Commit message: `chore: update @selectamitpatra/code-review-tool to v1.X.X`
- [ ] Push to staging: `git push origin staging`
- [ ] Verify CI/CD pipeline passes

### Update self-serve-api-gateway

- [ ] Navigate to self-serve-api-gateway directory
- [ ] Update package: `npm install @selectamitpatra/code-review-tool@latest --save-dev`
- [ ] Verify installation: `npm list @selectamitpatra/code-review-tool`
- [ ] Test code review: `npm run code-review:full`
- [ ] Commit changes: `git add package.json package-lock.json`
- [ ] Commit message: `chore: update @selectamitpatra/code-review-tool to v1.X.X`
- [ ] Push to staging: `git push origin staging`
- [ ] Verify CI/CD pipeline passes

## Post-Release Checklist

- [ ] Verify npm package page shows new version
- [ ] Test installation in a fresh project: `npm install @selectamitpatra/code-review-tool@latest`
- [ ] Update any external documentation referencing the package
- [ ] Notify team members of the new release (if applicable)
- [ ] Monitor for any issues or bug reports
- [ ] Create GitHub release (optional):
  - [ ] Go to: https://github.com/amitselectcarleasing/self-serve-code-review-tool/releases
  - [ ] Click "Create a new release"
  - [ ] Select the version tag
  - [ ] Add release notes
  - [ ] Publish release

## Rollback Checklist (If Needed)

If the release has critical issues:

- [ ] Unpublish the broken version (within 72 hours): `npm unpublish @selectamitpatra/code-review-tool@1.X.X`
- [ ] Or deprecate the version: `npm deprecate @selectamitpatra/code-review-tool@1.X.X "Broken release, use 1.X.Y instead"`
- [ ] Fix the issues
- [ ] Release a new patch version
- [ ] Update dependent services to the fixed version
- [ ] Document the issue in CHANGELOG.md

---

## Quick Command Reference

```bash
# Complete release workflow
cd "C:\Users\Admin\Documents\New folder\test\self-serve-application\self-serve-code-review-tool"
npm test
npm version patch  # or minor/major
git push origin master --tags
npm publish --access public
npm view @selectamitpatra/code-review-tool version

# Update self-serve-api
cd ../self-serve-api
npm install @selectamitpatra/code-review-tool@latest --save-dev
npm run code-review:full
git add package.json package-lock.json
git commit -m "chore: update @selectamitpatra/code-review-tool to vX.X.X"
git push origin staging

# Update self-serve-api-gateway
cd ../self-serve-api-gateway
npm install @selectamitpatra/code-review-tool@latest --save-dev
npm run code-review:full
git add package.json package-lock.json
git commit -m "chore: update @selectamitpatra/code-review-tool to vX.X.X"
git push origin staging
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Tests failing | Fix tests before publishing |
| Version already exists | Bump version higher |
| Permission denied | Run `npm login` |
| Package not found after publish | Wait 5-10 minutes for npm registry sync |
| CI/CD failing in services | Check compatibility with new version |

---

**Date**: _____________  
**Version Released**: _____________  
**Released By**: _____________  
**Notes**: _____________

