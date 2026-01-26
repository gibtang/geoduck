#!/usr/bin/env node

/**
 * Validate OpenRouter Models
 *
 * This script fetches the current list of available models from OpenRouter API
 * and validates that all models configured in the application are valid.
 *
 * Usage: node scripts/validate-models.js
 */

const https = require('https');

// Models configured in the application
const CONFIGURED_MODELS = [
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)' },
];

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.cyan);
}

/**
 * Fetch available models from OpenRouter API
 */
function fetchOpenRouterModels() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'openrouter.ai',
      port: 443,
      path: '/api/v1/models',
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (error) {
          reject(new Error(`Failed to parse JSON response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`HTTP request failed: ${error.message}`));
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout after 10 seconds'));
    });

    req.end();
  });
}

/**
 * Validate configured models against OpenRouter API
 */
function validateModels(openRouterData) {
  const results = {
    valid: [],
    missing: [],
    renamed: [],
    pricingChanged: [],
    totalConfigured: CONFIGURED_MODELS.length,
    totalAvailable: openRouterData.data?.length || 0,
  };

  // Create a map of OpenRouter models for quick lookup
  const openRouterModelMap = new Map();
  if (openRouterData.data && Array.isArray(openRouterData.data)) {
    openRouterData.data.forEach((model) => {
      openRouterModelMap.set(model.id, model);
    });
  }

  // Check each configured model
  CONFIGURED_MODELS.forEach((configuredModel) => {
    const orModel = openRouterModelMap.get(configuredModel.id);

    if (orModel) {
      // Model exists - check for changes
      const modelInfo = {
        id: configuredModel.id,
        name: configuredModel.name,
        orName: orModel.name,
        pricing: orModel.pricing,
      };

      // Check if name has changed
      if (orModel.name !== configuredModel.name && !configuredModel.id.includes(':free')) {
        results.renamed.push({
          ...modelInfo,
          oldName: configuredModel.name,
          newName: orModel.name,
        });
      }

      results.valid.push(modelInfo);
    } else {
      // Model not found - check if it was renamed (search for similar models)
      const modelBase = configuredModel.id.split(':')[0];
      const similarModels = Array.from(openRouterModelMap.keys())
        .filter((id) => id.startsWith(modelBase) || id.includes(modelBase.split('/')[1]));

      results.missing.push({
        id: configuredModel.id,
        name: configuredModel.name,
        suggestions: similarModels.slice(0, 3),
      });
    }
  });

  return results;
}

/**
 * Display validation results
 */
function displayResults(results) {
  console.log('\n' + '='.repeat(80));
  log('OpenRouter Model Validation Report', colors.bright);
  console.log('='.repeat(80) + '\n');

  // Summary
  log(`Configured Models: ${results.totalConfigured}`, colors.bright);
  log(`Available Models: ${results.totalAvailable}\n`, colors.bright);

  // Valid models
  if (results.valid.length > 0) {
    logSuccess(`Valid Models (${results.valid.length}/${results.totalConfigured}):\n`);
    results.valid.forEach((model) => {
      log(`  • ${model.name}`, colors.green);
      log(`    ID: ${model.id}`, colors.reset);
      if (model.pricing) {
        const { prompt, completion } = model.pricing;
        log(`    Pricing: $${prompt}/1M prompt tokens, $${completion}/1M completion tokens`, colors.reset);
      }
      console.log();
    });
  }

  // Renamed models
  if (results.renamed.length > 0) {
    logWarning(`Models with Name Changes (${results.renamed.length}):\n`);
    results.renamed.forEach((model) => {
      log(`  • ${model.oldName}`, colors.yellow);
      log(`    Current OpenRouter Name: ${model.newName}`, colors.reset);
      log(`    ID: ${model.id}`, colors.reset);
      console.log();
    });
  }

  // Missing models
  if (results.missing.length > 0) {
    logError(`Missing or Invalid Models (${results.missing.length}):\n`);
    results.missing.forEach((model) => {
      log(`  • ${model.name}`, colors.red);
      log(`    ID: ${model.id}`, colors.reset);
      if (model.suggestions.length > 0) {
        log(`    Possible alternatives:`, colors.reset);
        model.suggestions.forEach((suggestion) => {
          log(`      - ${suggestion}`, colors.reset);
        });
      }
      console.log();
    });
  }

  // Final summary
  console.log('─'.repeat(80));

  const hasErrors = results.missing.length > 0;
  const hasWarnings = results.renamed.length > 0;

  if (!hasErrors && !hasWarnings) {
    logSuccess('All models are valid and up-to-date!');
  } else if (hasErrors && hasWarnings) {
    logWarning(`Validation completed with ${results.missing.length} errors and ${results.renamed.length} warnings`);
  } else if (hasErrors) {
    logError(`Validation failed with ${results.missing.length} errors`);
  } else if (hasWarnings) {
    logWarning(`Validation completed with ${results.renamed.length} warnings`);
  }

  console.log('='.repeat(80) + '\n');

  return {
    success: !hasErrors,
    hasWarnings,
  };
}

/**
 * Main execution
 */
async function main() {
  logInfo('Fetching models from OpenRouter API...\n');

  try {
    const openRouterData = await fetchOpenRouterModels();
    const results = validateModels(openRouterData);
    const { success, hasWarnings } = displayResults(results);

    // Exit with appropriate code
    if (success) {
      process.exit(hasWarnings ? 0 : 0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    logError(`Validation failed: ${error.message}\n`);
    process.exit(2);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { fetchOpenRouterModels, validateModels };
