#!/usr/bin/env node

/**
 * Script to check if all models in AVAILABLE_MODELS are valid on OpenRouter
 * Usage: node scripts/check-models.js
 */

const https = require('https');

// Models from lib/openrouter.ts
const AVAILABLE_MODELS = [
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)' },
];

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/models';

function fetchModels() {
  return new Promise((resolve, reject) => {
    https.get(OPENROUTER_API_URL, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.data);
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function checkModels() {
  console.log('🔍 Fetching available models from OpenRouter...\n');

  try {
    const apiModels = await fetchModels();
    const validModelIds = new Set(apiModels.map(model => model.id));

    console.log(`✅ Found ${apiModels.length} models on OpenRouter\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    let allValid = true;
    const invalidModels = [];
    const validModels = [];

    for (const model of AVAILABLE_MODELS) {
      if (validModelIds.has(model.id)) {
        validModels.push(model);
        console.log(`✅ ${model.id}`);
        console.log(`   ${model.name}\n`);
      } else {
        invalidModels.push(model);
        allValid = false;
        console.log(`❌ ${model.id}`);
        console.log(`   ${model.name}`);
        console.log(`   ⚠️  NOT FOUND on OpenRouter\n`);
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (allValid) {
      console.log('✨ All models are valid!\n');
    } else {
      console.log(`⚠️  Found ${invalidModels.length} invalid model(s):\n`);
      invalidModels.forEach(model => {
        console.log(`   - ${model.id} (${model.name})`);
      });
      console.log('\n💡 Suggestions for replacement:\n');

      // Find similar models
      const provider = invalidModels[0].id.split('/')[0];
      const similarModels = apiModels.filter(m => m.id.startsWith(provider)).slice(0, 5);

      if (similarModels.length > 0) {
        console.log(`   Similar ${provider} models:\n`);
        similarModels.forEach(m => {
          const isFree = m.pricing?.prompt === '0' && m.pricing?.completion === '0';
          const freeTag = isFree ? ' (FREE)' : '';
          console.log(`   • ${m.id}${freeTag}`);
          console.log(`     ${m.name}`);
        });
      }

      process.exit(1);
    }

    // Show some alternative models that might be interesting
    console.log('💡 Other popular models on OpenRouter:\n');
    const popularModels = apiModels
      .filter(m => m.id.includes('google') || m.id.includes('openai') || m.id.includes('anthropic') || m.id.includes('meta'))
      .filter(m => !validModelIds.has(m.id))
      .slice(0, 5);

    popularModels.forEach(m => {
      const isFree = m.pricing?.prompt === '0' && m.pricing?.completion === '0';
      const freeTag = isFree ? ' (FREE)' : '';
      console.log(`   • ${m.id}${freeTag}`);
      console.log(`     ${m.name}`);
    });

    console.log('\n');

  } catch (error) {
    console.error('❌ Error fetching models:', error.message);
    process.exit(1);
  }
}

// Run the check
checkModels();
