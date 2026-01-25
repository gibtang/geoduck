# Scripts

This directory contains utility scripts for the Geoduck project.

## check-models.js

Verifies that all model IDs in `AVAILABLE_MODELS` (from `lib/openrouter.ts`) are valid on OpenRouter.

### Usage

```bash
# Run using npm
npm run check-models

# Or run directly with node
node scripts/check-models.js
```

### What it does

1. Fetches the current list of available models from OpenRouter API
2. Checks each model ID in your `AVAILABLE_MODELS` array
3. Reports which models are valid ❌ or invalid ✅
4. Suggests replacement models if any are invalid
5. Shows other popular models available on OpenRouter

### Example Output

```
🔍 Fetching available models from OpenRouter...

✅ Found 346 models on OpenRouter

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ google/gemini-2.0-flash-exp:free
   Gemini 2.0 Flash (Free)

❌ google/gemini-pro
   Gemini Pro
   ⚠️  NOT FOUND on OpenRouter

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  Found 1 invalid model(s):

   - google/gemini-pro (Gemini Pro)

💡 Suggestions for replacement:

   Similar google models:

   • google/gemini-2.5-flash
     Gemini 2.5 Flash
   • google/gemini-2.0-flash-exp:free (FREE)
     Gemini 2.0 Flash Experimental (free)
```

### When to run it

Run this script whenever:
- OpenRouter announces model updates
- You're getting "invalid model ID" errors
- You want to add new models to the list
- Periodically (e.g., monthly) to ensure your models are still available

### Updating the script

If you add or remove models from `lib/openrouter.ts`, update the `AVAILABLE_MODELS` array in `check-models.js` to match.
