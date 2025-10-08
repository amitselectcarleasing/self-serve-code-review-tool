# 🚀 GitHub Actions Setup for npm Publishing

## **Issue Fixed** ✅

The error `npm error need auth This command requires you to be logged in to https://registry.npmjs.org/` was caused by configuration mismatches between the GitHub Actions workflow and your package configuration.

## **What Was Fixed**

1. **Registry Configuration**: Changed from GitHub Packages to public npm registry
2. **Package Name**: Updated workflow to match actual package name `@selectamitpatra/code-review-tool`
3. **Authentication**: Changed from `GITHUB_TOKEN` to `NPM_TOKEN`
4. **Registry URL**: Updated to `https://registry.npmjs.org`

## **Required Setup: NPM_TOKEN Secret**

To fix the authentication issue, you need to add an `NPM_TOKEN` secret to your GitHub repository:

### **Step 1: Create npm Access Token**

1. Go to [npmjs.com](https://www.npmjs.com) and log in
2. Click on your profile picture → **Access Tokens**
3. Click **Generate New Token** → **Classic Token**
4. Select **Automation** (for CI/CD) or **Publish** (for publishing packages)
5. Copy the token (starts with `npm_`)

### **Step 2: Add Secret to GitHub Repository**

1. Go to your GitHub repository: `amitselectcarleasing/self-serve-code-review-tool`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `NPM_TOKEN`
5. Value: Paste your npm token
6. Click **Add secret**

### **Step 3: Verify Package Configuration**

Your package is now properly configured for public npm publishing:

```json
{
  "name": "@selectamitpatra/code-review-tool",
  "publishConfig": {
    "access": "public"
  }
}
```

## **How to Trigger Publishing**

The workflow will automatically run when you:

1. **Create a Release**:
   ```bash
   git tag v1.3.1
   git push origin v1.3.1
   ```

2. **Push a Version Tag**:
   ```bash
   git tag v1.3.1
   git push origin v1.3.1
   ```

## **Manual Publishing (Alternative)**

If you prefer to publish manually:

```bash
# Login to npm
npm login

# Publish
npm publish
```

## **Verification**

After successful publishing, you can verify by:

```bash
npm view @selectamitpatra/code-review-tool
```

## **Troubleshooting**

If you still get authentication errors:

1. **Check NPM_TOKEN Secret**: Ensure it's correctly added to GitHub repository secrets
2. **Verify Token Permissions**: Make sure the npm token has publish permissions
3. **Check Package Name**: Ensure the package name is available on npm
4. **Version Conflicts**: Make sure the version number hasn't been published before

## **Next Steps**

1. Add the `NPM_TOKEN` secret to your GitHub repository
2. Create a new release or push a version tag
3. The GitHub Actions workflow will automatically publish your package to npm

Your package is now ready for automated publishing! 🎉
