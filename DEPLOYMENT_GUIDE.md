# Deployment Guide for Google App Engine

This guide walks you through deploying your React + Vite application to Google Cloud Platform's App Engine.

## Prerequisites

1. **Google Cloud Account**: You need a GCP account with billing enabled
2. **Google Cloud SDK**: Install the gcloud CLI tool
   - Download from: https://cloud.google.com/sdk/docs/install
   - Or use: `curl https://sdk.cloud.google.com | bash`

## Setup Steps

### 1. Install Google Cloud SDK (if not already installed)

```bash
# For macOS (using Homebrew)
brew install --cask google-cloud-sdk

# Or use the official installer
curl https://sdk.cloud.google.com | bash
```

### 2. Initialize gcloud and login

```bash
# Login to your Google account
gcloud auth login

# Set your project (replace PROJECT_ID with your actual project ID)
gcloud config set project PROJECT_ID

# Or create a new project
gcloud projects create PROJECT_ID --name="Your Project Name"
gcloud config set project PROJECT_ID
```

### 3. Enable Required APIs

```bash
# Enable App Engine API
gcloud services enable appengine.googleapis.com

# Initialize App Engine (choose your region when prompted)
gcloud app create --region=us-central
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Build Your Application

```bash
npm run build
```

This will create an optimized production build in the `dist/` directory.

### 6. Deploy to App Engine

```bash
gcloud app deploy
```

When prompted:
- Review the deployment details
- Type `Y` to confirm deployment

### 7. View Your Deployed Application

```bash
# Open the deployed app in your browser
gcloud app browse
```

## Project Structure

The following files were added for App Engine deployment:

- **app.yaml**: App Engine configuration file
  - Specifies Node.js 20 runtime
  - Configures automatic scaling
  - Forces HTTPS connections
  
- **server.js**: Express server to serve static files
  - Serves the built React app from the `dist/` directory
  - Handles client-side routing (SPA support)
  
- **.gcloudignore**: Specifies files to exclude from deployment
  - Similar to .gitignore
  - Excludes source files, node_modules, documentation

## Configuration

### Environment Variables

If you need to set environment variables in production:

1. Add them to `app.yaml` under `env_variables`:
```yaml
env_variables:
  NODE_ENV: 'production'
  VITE_API_URL: 'https://your-api.com'
```

2. For sensitive data, use Google Cloud Secret Manager:
```bash
# Create a secret
echo -n "secret-value" | gcloud secrets create SECRET_NAME --data-file=-

# Reference in app.yaml (requires additional configuration)
```

### Scaling Configuration

The current `app.yaml` uses F1 instance class with automatic scaling. You can adjust:

- `instance_class`: F1 (smallest), F2, F4, F4_1G (more memory/CPU)
- `min_idle_instances`: Minimum instances kept running
- `max_idle_instances`: Maximum idle instances

### Domain Mapping

To use a custom domain:

```bash
# Map your custom domain
gcloud app domain-mappings create yourdomain.com

# Follow the verification process
```

## Deployment Checklist

Before deploying, ensure:

- [ ] All dependencies are listed in `package.json`
- [ ] Build process completes successfully (`npm run build`)
- [ ] Environment variables are configured in `app.yaml`
- [ ] Firebase configuration is correct (check .env file)
- [ ] API endpoints are updated for production
- [ ] `dist/` directory contains the built app

## Troubleshooting

### Build Errors

If the build fails:
```bash
# Clear cache and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Deployment Fails

Check logs:
```bash
# View recent logs
gcloud app logs tail -s default

# View specific version logs
gcloud app logs tail --version=VERSION_ID
```

### Application Not Loading

1. Check if the app deployed successfully:
   ```bash
   gcloud app browse
   ```

2. Verify the build directory exists:
   ```bash
   ls -la dist/
   ```

3. Check App Engine logs for errors:
   ```bash
   gcloud app logs read
   ```

## Updating Your Application

To deploy updates:

```bash
# 1. Make your changes
# 2. Build the application
npm run build

# 3. Deploy
gcloud app deploy

# 4. The new version will be deployed and traffic automatically routed
```

## Cost Management

- **F1 instances**: Free tier eligible (28 instance hours/day)
- Monitor usage: https://console.cloud.google.com/appengine
- Set budget alerts in GCP Console

## Additional Resources

- [App Engine Documentation](https://cloud.google.com/appengine/docs)
- [App Engine Pricing](https://cloud.google.com/appengine/pricing)
- [gcloud CLI Reference](https://cloud.google.com/sdk/gcloud/reference)

## Quick Commands Reference

```bash
# Deploy
gcloud app deploy

# View logs
gcloud app logs tail -s default

# Open app in browser
gcloud app browse

# View app versions
gcloud app versions list

# Stop a version (to save costs)
gcloud app versions stop VERSION_ID

# Delete a version
gcloud app versions delete VERSION_ID
```
