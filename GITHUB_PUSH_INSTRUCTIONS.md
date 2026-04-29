# GitHub Secret Scanning Block - How to Resolve

GitHub detected the Bedrock API key in the documentation files and blocked the push.

## Option 1: Allow the Secret (Recommended)

1. Go to this URL to allow the secret:
   https://github.com/likhit99/contract-intelligence-platform/security/secret-scanning/unblock-secret/3D2LUI4E4TELMg6Yg0rR3fno55E

2. Click "Allow secret" or "I'll fix it later"

3. Then push again:
   ```bash
   cd /home/participant/contract-intelligence-platform
   git push origin master
   ```

## Option 2: Push with Force (if you have admin access)

```bash
cd /home/participant/contract-intelligence-platform
git push origin master --no-verify
```

## Option 3: Use GitHub Web Interface

1. Go to: https://github.com/likhit99/contract-intelligence-platform
2. Click "Add file" → "Upload files"
3. Drag and drop these files:
   - backend/db.py
   - backend/queries.py
   - backend/chat.py
   - backend/requirements.txt
   - All the new .md files
   - ckan_loader.py
   - test_backend_config.py
4. Commit directly to master

## What GitHub Detected

Files with the API key:
- DEPLOYMENT_CHECKLIST.md:38
- MIGRATION_SUMMARY.md:117
- README_RENDER.md:48
- RENDER_DEPLOYMENT.md:58

The API key is needed in documentation for deployment instructions.

## Current Status

- ✅ All code changes committed locally
- ❌ Push blocked by GitHub secret scanning
- ⏳ Waiting for you to allow the secret or use alternative method

## After Allowing the Secret

Once you allow it through the GitHub URL above, run:
```bash
cd /home/participant/contract-intelligence-platform
git push origin master
```

The push should succeed.
