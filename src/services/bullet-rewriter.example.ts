/**
 * EXAMPLE USAGE: AI-Powered Bullet Rewriter
 *
 * This file demonstrates how to use the bullet-rewriter service
 * with strict anti-hallucination constraints.
 */

import type { Achievement } from '../types/resume-tailoring';
import { rewriteBullet, rewriteBulletsBatch } from './bullet-rewriter/index';

// ============================================================================
// EXAMPLE 1: Basic Single Bullet Rewrite
// ============================================================================

async function example1_BasicRewrite() {
  console.log('=== EXAMPLE 1: Basic Bullet Rewrite ===\n');

  // Sample achievement from user's resume
  const achievement: Achievement = {
    id: 'ach-1',
    bullet: 'Built e-commerce website with React',
    action: 'Built',
    object: 'e-commerce website',
    skills: ['React'],
    keywords: ['React', 'e-commerce'],
    transferableSkills: ['web development'],
    verified: true,
    source: 'user',
  };

  // Keywords from job posting
  const targetKeywords = ['React', 'REST APIs', 'TypeScript', 'Redux'];

  // Configuration
  const config = {
    targetKeywords,
    maxKeywordsPerBullet: 3,
    tone: 'professional' as const,
    allowImpliedKeywords: true, // Allow adding "REST APIs" since e-commerce implies APIs
    maxRetries: 2,
  };

  try {
    const result = await rewriteBullet(achievement, targetKeywords, config);

    console.log('Original:', result.original);
    console.log('Rewritten:', result.rewritten);
    console.log('Keywords Added:', result.keywordsAdded);
    console.log('Hallucination Check:');
    console.log('  - All Facts Preserved:', result.factVerification.allFactsPreserved);
    console.log('  - Added Facts:', result.factVerification.addedFacts);
    console.log('  - Confidence:', result.factVerification.confidence);
    console.log('\n');
  } catch (error) {
    console.error('Error:', (error as Error).message);
  }
}

// ============================================================================
// EXAMPLE 2: Bullet with Metrics (Critical - Must Not Hallucinate)
// ============================================================================

async function example2_BulletWithMetrics() {
  console.log('=== EXAMPLE 2: Bullet with Metrics (No Hallucination) ===\n');

  const achievement: Achievement = {
    id: 'ach-2',
    bullet: 'Optimized database queries, reducing latency by 40%',
    action: 'Optimized',
    object: 'database queries',
    result: 'reducing latency by 40%',
    metrics: [
      {
        value: 40,
        unit: '%',
        type: 'reduction',
        context: 'latency',
      },
    ],
    skills: ['SQL', 'database optimization'],
    keywords: ['database', 'optimization', 'performance'],
    transferableSkills: ['problem-solving'],
    verified: true,
    source: 'user',
  };

  const targetKeywords = ['PostgreSQL', 'database optimization', 'indexing', 'query tuning'];

  const config = {
    targetKeywords,
    maxKeywordsPerBullet: 2,
    tone: 'technical' as const,
    allowImpliedKeywords: true,
    maxRetries: 3,
  };

  try {
    const result = await rewriteBullet(achievement, targetKeywords, config);

    console.log('Original:', result.original);
    console.log('Rewritten:', result.rewritten);
    console.log('\nVerification:');
    console.log('  - All Facts Preserved:', result.factVerification.allFactsPreserved);
    console.log('  - Added Facts:', result.factVerification.addedFacts);
    console.log('  - Removed Facts:', result.factVerification.removedFacts);
    console.log('  - Confidence:', result.factVerification.confidence);

    // IMPORTANT: The 40% metric MUST be preserved exactly
    if (!result.rewritten.includes('40%')) {
      console.error('❌ CRITICAL ERROR: Metric was not preserved!');
    } else {
      console.log('✅ Metric preserved correctly');
    }
    console.log('\n');
  } catch (error) {
    console.error('Error:', (error as Error).message);
  }
}

// ============================================================================
// EXAMPLE 3: Bad Example - Catching Hallucination
// ============================================================================

async function example3_HallucinationDetection() {
  console.log('=== EXAMPLE 3: Hallucination Detection ===\n');

  const achievement: Achievement = {
    id: 'ach-3',
    bullet: 'Developed microservices using Node.js',
    action: 'Developed',
    object: 'microservices',
    skills: ['Node.js', 'microservices'],
    keywords: ['Node.js', 'microservices'],
    transferableSkills: ['backend development'],
    verified: true,
    source: 'user',
  };

  const targetKeywords = ['Docker', 'Kubernetes', 'REST APIs', 'team leadership'];

  const config = {
    targetKeywords,
    maxKeywordsPerBullet: 3,
    tone: 'professional' as const,
    allowImpliedKeywords: true,
    maxRetries: 2,
  };

  try {
    const result = await rewriteBullet(achievement, targetKeywords, config);

    console.log('Original:', result.original);
    console.log('Rewritten:', result.rewritten);
    console.log('\nVerification:');
    console.log('  - All Facts Preserved:', result.factVerification.allFactsPreserved);

    // Docker and REST APIs are IMPLIED by microservices - OKAY to add
    // Kubernetes might be okay if context suggests it
    // "team leadership" should NOT be added - that's hallucination

    if (result.rewritten.toLowerCase().includes('team')) {
      console.warn('⚠️ WARNING: Team leadership added - potential hallucination');
    } else {
      console.log('✅ No team leadership hallucination');
    }

    if (result.factVerification.addedFacts.length > 0) {
      console.warn('⚠️ Facts were added:', result.factVerification.addedFacts);
    }
    console.log('\n');
  } catch (error) {
    console.error('Error:', (error as Error).message);
  }
}

// ============================================================================
// EXAMPLE 4: Batch Processing Multiple Bullets
// ============================================================================

async function example4_BatchProcessing() {
  console.log('=== EXAMPLE 4: Batch Processing ===\n');

  const achievements: Achievement[] = [
    {
      id: 'ach-4a',
      bullet: 'Built REST API with Express.js',
      action: 'Built',
      object: 'REST API',
      skills: ['Express.js', 'REST'],
      keywords: ['API', 'Express'],
      transferableSkills: ['backend development'],
      verified: true,
      source: 'user',
    },
    {
      id: 'ach-4b',
      bullet: 'Implemented authentication system',
      action: 'Implemented',
      object: 'authentication system',
      skills: ['authentication', 'security'],
      keywords: ['auth', 'security'],
      transferableSkills: ['security awareness'],
      verified: true,
      source: 'user',
    },
    {
      id: 'ach-4c',
      bullet: 'Created responsive UI with React',
      action: 'Created',
      object: 'responsive UI',
      skills: ['React', 'CSS', 'responsive design'],
      keywords: ['React', 'UI', 'responsive'],
      transferableSkills: ['frontend development'],
      verified: true,
      source: 'user',
    },
  ];

  const targetKeywords = [
    'React',
    'Node.js',
    'Express.js',
    'REST API',
    'JWT',
    'OAuth',
    'TypeScript',
    'responsive design',
  ];

  const config = {
    targetKeywords,
    maxKeywordsPerBullet: 2,
    tone: 'professional' as const,
    allowImpliedKeywords: true,
    maxRetries: 2,
  };

  try {
    const results = await rewriteBulletsBatch(
      achievements,
      targetKeywords,
      config,
      (completed: number, total: number) => {
        console.log(`Progress: ${completed}/${total} bullets rewritten`);
      }
    );

    console.log('\n=== RESULTS ===\n');

    results.forEach((result: any, index: number) => {
      console.log(`Bullet ${index + 1}:`);
      console.log('  Original:', result.original);
      console.log('  Rewritten:', result.rewritten);
      console.log('  Keywords Added:', result.keywordsAdded);
      console.log('  Hallucination Check:', result.factVerification.allFactsPreserved ? '✅' : '❌');
      console.log('');
    });

    const totalKeywordsInjected = results.reduce((sum: number, r: any) => sum + r.keywordsAdded.length, 0);
    const hallucinations = results.filter((r: any) => !r.factVerification.allFactsPreserved).length;

    console.log('Summary:');
    console.log(`  - Total bullets: ${results.length}`);
    console.log(`  - Keywords injected: ${totalKeywordsInjected}`);
    console.log(`  - Hallucinations detected: ${hallucinations}`);
    console.log('\n');
  } catch (error) {
    console.error('Error:', (error as Error).message);
  }
}

// ============================================================================
// EXAMPLE 5: Configuration Options
// ============================================================================

async function example5_ConfigurationOptions() {
  console.log('=== EXAMPLE 5: Configuration Options ===\n');

  const achievement: Achievement = {
    id: 'ach-5',
    bullet: 'Led team of 5 engineers to deliver project on time',
    action: 'Led',
    object: 'team of 5 engineers',
    result: 'deliver project on time',
    skills: ['leadership', 'project management'],
    keywords: ['team', 'leadership'],
    transferableSkills: ['leadership', 'communication'],
    verified: true,
    source: 'user',
  };

  const targetKeywords = ['Agile', 'Scrum', 'cross-functional teams', 'project management'];

  // Option 1: Professional tone
  const config1 = {
    targetKeywords,
    maxKeywordsPerBullet: 2,
    tone: 'professional' as const,
    allowImpliedKeywords: true,
  };

  // Option 2: Technical tone
  const config2 = {
    targetKeywords,
    maxKeywordsPerBullet: 2,
    tone: 'technical' as const,
    allowImpliedKeywords: true,
  };

  // Option 3: No implied keywords (strict)
  const config3 = {
    targetKeywords,
    maxKeywordsPerBullet: 2,
    tone: 'professional' as const,
    allowImpliedKeywords: false, // Only add keywords explicitly mentioned
  };

  try {
    console.log('Testing different configurations...\n');

    const result1 = await rewriteBullet(achievement, targetKeywords, config1);
    console.log('Professional Tone:', result1.rewritten);

    const result2 = await rewriteBullet(achievement, targetKeywords, config2);
    console.log('Technical Tone:', result2.rewritten);

    const result3 = await rewriteBullet(achievement, targetKeywords, config3);
    console.log('Strict (No Implied):', result3.rewritten);

    console.log('\n');
  } catch (error) {
    console.error('Error:', (error as Error).message);
  }
}

// ============================================================================
// RUN EXAMPLES
// ============================================================================

export async function runAllExamples() {
  console.log('\n🚀 BULLET REWRITER EXAMPLES\n');
  console.log('This demonstrates the AI-powered bullet rewriter with anti-hallucination.\n');
  console.log('========================================\n');

  await example1_BasicRewrite();
  await example2_BulletWithMetrics();
  await example3_HallucinationDetection();
  await example4_BatchProcessing();
  await example5_ConfigurationOptions();

  console.log('========================================\n');
  console.log('✅ All examples completed!\n');
}

// Uncomment to run:
// runAllExamples().catch(console.error);
