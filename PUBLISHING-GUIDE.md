# Publishing Your VS Code Extension to the Marketplace

This guide will walk you through publishing your VS Code Coding Tracker extension to the Visual Studio Code Marketplace.

## Prerequisites

1. **Microsoft Account**: You'll need a Microsoft account to create an Azure DevOps organization
2. **Personal Access Token**: Required for authentication with the marketplace
3. **Built Extension**: Your extension should be compiled and ready

## Step 1: Prepare Your Extension

### 1.1 Install vsce (VS Code Extension Manager)

```bash
# Already installed as dev dependency
npx vsce --version
```

### 1.2 Build Your Extension

```bash
npm run compile
# or
npm run package
```

### 1.3 Add Required Files

Your extension needs these files (already created):

- ✅ `package.json` - Extension manifest with all required fields
- ✅ `README.md` - Documentation
- ✅ `CHANGELOG.md` - Version history
- ⚠️ `icon.png` - 128x128 PNG icon (optional but recommended)
- ✅ `LICENSE` - License file

### 1.4 Update package.json Fields

Make sure to update these fields in `package.json`:

```json
{
  "publisher": "YourPublisherName", // Must match your marketplace publisher
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/vscode-coding-tracker.git"
  },
  "bugs": {
    "url": "https://github.com/yourusername/vscode-coding-tracker/issues"
  },
  "homepage": "https://github.com/yourusername/vscode-coding-tracker#readme"
}
```

## Step 2: Create a Marketplace Publisher

### 2.1 Go to Visual Studio Marketplace

1. Visit [Visual Studio Marketplace Publisher Management](https://marketplace.visualstudio.com/manage)
2. Sign in with your Microsoft account

### 2.2 Create a Publisher

1. Click "Create publisher"
2. Fill in the required information:
   - **Publisher Name**: Must be unique (e.g., "RatiRukhadze")
   - **Display Name**: Human-readable name
   - **Description**: Brief description of you/your organization

### 2.3 Note Your Publisher ID

- Copy the publisher ID - you'll need it in your `package.json`

## Step 3: Create a Personal Access Token

### 3.1 Go to Azure DevOps

1. Visit [Azure DevOps](https://dev.azure.com)
2. Sign in with the same Microsoft account

### 3.2 Create Personal Access Token

1. Click on your profile picture → "Personal access tokens"
2. Click "New Token"
3. Configure the token:
   - **Name**: "VS Code Extension Publishing"
   - **Organization**: Select "All accessible organizations"
   - **Expiration**: Choose appropriate duration
   - **Scopes**: Select "Custom defined" and check:
     - ✅ **Marketplace** → **Manage**

### 3.3 Copy the Token

- ⚠️ **Important**: Copy the token immediately - you won't see it again!

## Step 4: Login with vsce

```bash
npx vsce login YourPublisherName
# Enter your Personal Access Token when prompted
```

## Step 5: Package and Test

### 5.1 Package Your Extension

```bash
npx vsce package
```

This creates a `.vsix` file that you can install locally for testing.

### 5.2 Test Locally

```bash
code --install-extension vscode-coding-tracker-0.0.1.vsix
```

## Step 6: Publish

### 6.1 First-time Publish

```bash
npx vsce publish
```

### 6.2 Publish with Version Bump

```bash
# Automatically increment patch version (0.0.1 → 0.0.2)
npx vsce publish patch

# Increment minor version (0.0.1 → 0.1.0)
npx vsce publish minor

# Increment major version (0.0.1 → 1.0.0)
npx vsce publish major
```

## Step 7: Verify Publication

1. Visit [VS Code Marketplace](https://marketplace.visualstudio.com/vscode)
2. Search for your extension
3. Check that all information displays correctly

## Alternative: Install Without Publishing

If you don't want to publish publicly, you can:

### Option A: Install from VSIX

```bash
# Package the extension
npx vsce package

# Install locally
code --install-extension vscode-coding-tracker-0.0.1.vsix
```

### Option B: Development Mode

1. Open VS Code
2. Go to the Extensions view
3. Click "..." → "Install from VSIX..."
4. Select your `.vsix` file

### Option C: Load in Development Host

1. Open your extension project in VS Code
2. Press `F5` to launch Extension Development Host
3. Test your extension in the new window

## Updating Your Extension

### Update Process

1. Make your changes
2. Update version in `package.json`
3. Update `CHANGELOG.md`
4. Run tests: `npm test`
5. Package: `npx vsce package`
6. Test the `.vsix` file
7. Publish: `npx vsce publish`

### Version Guidelines

- **Patch** (0.0.X): Bug fixes
- **Minor** (0.X.0): New features, backward compatible
- **Major** (X.0.0): Breaking changes

## Common Issues and Solutions

### Issue: "Publisher not found"

**Solution**: Make sure the `publisher` field in `package.json` exactly matches your marketplace publisher name.

### Issue: "Personal access token is invalid"

**Solution**:

1. Check token hasn't expired
2. Ensure token has "Marketplace: Manage" permissions
3. Re-login: `npx vsce login YourPublisherName`

### Issue: "README.md not found"

**Solution**: Ensure you have a `README.md` file in your project root.

### Issue: "Icon not found"

**Solution**: Either add a 128x128 PNG icon or remove the `icon` field from `package.json`.

## Best Practices

1. **Semantic Versioning**: Follow semver.org guidelines
2. **Good Documentation**: Clear README with setup instructions
3. **Regular Updates**: Keep dependencies updated
4. **User Feedback**: Respond to issues and reviews
5. **Testing**: Test thoroughly before publishing
6. **License**: Include appropriate license

## Quick Commands Reference

```bash
# Install vsce
npm install -g @vscode/vsce

# Login to marketplace
npx vsce login YourPublisherName

# Package extension
npx vsce package

# Publish extension
npx vsce publish

# Install packaged extension
code --install-extension extension-name.vsix

# Uninstall extension
code --uninstall-extension publisher.extension-name
```

## Next Steps

After publishing:

1. 📝 Share your extension with the community
2. 📊 Monitor downloads and reviews
3. 🐛 Fix reported issues
4. ✨ Add new features based on feedback
5. 📈 Promote your extension on social media/blogs

Your extension is now ready to help developers track their coding time worldwide! 🚀
