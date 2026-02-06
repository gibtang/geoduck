# Scripts

This directory contains utility scripts for the Geoduck project.

## validate-models.js

Validates all configured AI models against the OpenRouter API to ensure they are available and up-to-date.

### Usage

```bash
# Run using npm
npm run validate-models

# Or run directly with node
node scripts/validate-models.js
```

### What it does

1. **Model Availability**: Verifies that all models configured in `lib/openrouter.ts` exist in the OpenRouter API
2. **Name Changes**: Detects if model names have changed in OpenRouter
3. **Pricing Information**: Displays current pricing for each valid model
4. **Missing Models**: Flags any models that are no longer available
5. **Suggestions**: Provides alternative model suggestions for missing models

### Exit Codes

- `0`: Validation passed (all models valid)
- `1`: Validation failed (missing models found)
- `2`: Error occurred (API fetch failed, timeout, etc.)

### Example Output

```
================================================================================
OpenRouter Model Validation Report
================================================================================

Configured Models: 7
Available Models: 346

✓ Valid Models (7/7):

  • Gemini 2.0 Flash (Free)
    ID: google/gemini-2.0-flash-exp:free
    Pricing: $0/1M prompt tokens, $0/1M completion tokens

  • Gemini 2.5 Flash
    ID: google/gemini-2.5-flash
    Pricing: $0.0000003/1M prompt tokens, $0.0000025/1M completion tokens

⚠ Models with Name Changes (5):

  • Gemini 2.5 Flash
    Current OpenRouter Name: Google: Gemini 2.5 Flash
    ID: google/gemini-2.5-flash

────────────────────────────────────────────────────────────────────────────────
⚠ Validation completed with 5 warnings
================================================================================
```

### When to run it

- **Before Deploying**: Ensure all configured models are still available
- **After OpenRouter Updates**: Check if model IDs have changed
- **CI/CD Pipelines**: Automatically validate models as part of deployment
- **Maintenance**: Periodically check for pricing changes or model deprecations

## check-models.js

An older script that checks model IDs. See `validate-models.js` for the recommended approach.

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

### When to run it

Run this script whenever:
- OpenRouter announces model updates
- You're getting "invalid model ID" errors
- You want to add new models to the list
- Periodically (e.g., monthly) to ensure your models are still available

