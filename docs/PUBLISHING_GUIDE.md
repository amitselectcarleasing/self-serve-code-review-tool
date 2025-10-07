# 📦 **Publishing Guide: @self-serve/code-review-tool**

## 🎯 **Publishing Options**

### **Option 1: GitHub Packages (Recommended)**
### **Option 2: Private npm Registry**
### **Option 3: Verdaccio (Self-hosted)**
### **Option 4: Azure Artifacts**

---

## 🚀 **Option 1: GitHub Packages (Recommended)**

### **Step 1: Setup Package for GitHub Packages**

Create `.npmrc` in package root:
```bash
echo "@self-serve:registry=https://npm.pkg.github.com" > .npmrc
```

Update `package.json`:
```json
{
  "name": "@self-serve/code-review-tool",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/self-serve-code-review-tool.git"
  },
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

### **Step 2: Authenticate**
```bash
# Create GitHub Personal Access Token with packages:write permission
# Then authenticate:
npm login --scope=@self-serve --registry=https://npm.pkg.github.com
```

### **Step 3: Publish**
```bash
npm publish
```

---

## 🏢 **Option 2: Private npm Registry**

### **Step 1: Setup Registry**
```bash
# Set registry URL
npm config set registry https://your-private-registry.com

# Or create .npmrc
echo "registry=https://your-private-registry.com" > .npmrc
echo "@self-serve:registry=https://your-private-registry.com" >> .npmrc
```

### **Step 2: Authenticate**
```bash
npm login --registry=https://your-private-registry.com
```

### **Step 3: Publish**
```bash
npm publish --registry=https://your-private-registry.com
```

---

## 🐳 **Option 3: Verdaccio (Self-hosted)**

### **Step 1: Setup Verdaccio**
```bash
# Install Verdaccio
npm install -g verdaccio

# Start Verdaccio
verdaccio
# Default: http://localhost:4873
```

### **Step 2: Configure**
```bash
# Point to Verdaccio
npm set registry http://localhost:4873

# Create user
npm adduser --registry http://localhost:4873
```

### **Step 3: Publish**
```bash
npm publish --registry http://localhost:4873
```

---

## ☁️ **Option 4: Azure Artifacts**

### **Step 1: Setup Azure Artifacts**
```bash
# Install Azure CLI
# Create .npmrc
echo "registry=https://pkgs.dev.azure.com/your-org/_packaging/your-feed/npm/registry/" > .npmrc
echo "always-auth=true" >> .npmrc
```

### **Step 2: Authenticate**
```bash
# Install vsts-npm-auth
npm install -g vsts-npm-auth

# Authenticate
vsts-npm-auth -config .npmrc
```

### **Step 3: Publish**
```bash
npm publish
```

---

## 🔧 **Pre-Publishing Checklist**

### **✅ Package Validation**
```bash
# 1. Validate package structure
npm pack --dry-run

# 2. Check what will be published
npm publish --dry-run

# 3. Test package locally
npm link
npm link @self-serve/code-review-tool

# 4. Run tests
npm test

# 5. Check dependencies
npm audit
```

### **✅ Version Management**
```bash
# Update version before publishing
npm version patch   # 1.0.0 -> 1.0.1
npm version minor   # 1.0.0 -> 1.1.0
npm version major   # 1.0.0 -> 2.0.0
```

---

## 🎯 **Recommended Setup for Your Organization**

### **GitHub Packages Setup (Most Common)**

1. **Create GitHub Repository**
2. **Setup Package Configuration**
3. **Create GitHub Actions for CI/CD**
4. **Publish and Install**

Let me help you set this up step by step...
