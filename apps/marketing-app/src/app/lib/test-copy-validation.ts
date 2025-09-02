/**
 * Test Suite for Marketing Culture Guidelines Implementation
 * 
 * Validates that our marketing copy follows the culture guidelines
 */

import { validateCopy, validateCopySet, getPageBrandScore } from './copy-validator';

// Test copy from our marketing app
const marketingCopy = {
  mainHeadline: {
    text: "Standup meetings suck",
    type: 'headline' as const
  },
  mainDescription: {
    text: "Automatically generate status updates by monitoring your team's activity in code, Slack, and other tools. Or write them yourself. Either way, no one has to talk about it at 9:30 a.m.",
    type: 'description' as const
  },
  primaryCTA: {
    text: "Turn activity into updates",
    type: 'cta' as const
  },
  engineerDescription: {
    text: "Less reporting, more coding.",
    type: 'headline' as const
  },
  engineerBenefit1: {
    text: "Your commits and PRs write your updates for you—no extra steps required.",
    type: 'benefit' as const
  },
  engineerBenefit2: {
    text: "Stop interrupting your morning just to repeat what you did yesterday.",
    type: 'benefit' as const
  },
  pmDescription: {
    text: "Instant clarity, zero chasing.",
    type: 'headline' as const
  },
  founderDescription: {
    text: "See progress, skip meetings.",
    type: 'headline' as const
  },
  ctaSection: {
    text: "Remote teams are already saving hundreds of hours by dropping standups. Join them and reclaim your morning focus time.",
    type: 'description' as const
  },
  footerTagline: {
    text: "Drop your standups. Keep your team aligned. Built for remote teams that value focus time.",
    type: 'description' as const
  }
};

// Run validation tests
export function testMarketingCopyCompliance() {
  console.log('🧪 Testing Marketing Copy Compliance\n');
  
  const results = validateCopySet(marketingCopy);
  const overallScore = getPageBrandScore(results);
  
  console.log(`📊 Overall Brand Score: ${overallScore}/100\n`);
  
  Object.entries(results).forEach(([key, result]) => {
    const status = result.isValid ? '✅' : '❌';
    console.log(`${status} ${key}: ${result.score}/100`);
    
    if (result.issues.length > 0) {
      result.issues.forEach(issue => {
        const icon = issue.severity === 'error' ? '🚫' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`  ${icon} ${issue.message}`);
        if (issue.suggestion) {
          console.log(`     💡 ${issue.suggestion}`);
        }
      });
    }
    
    if (result.suggestions.length > 0) {
      result.suggestions.forEach(suggestion => {
        console.log(`  💡 ${suggestion}`);
      });
    }
    
    console.log('');
  });
  
  // Test examples of good vs bad copy
  console.log('🔍 Testing Good vs Bad Copy Examples\n');
  
  const goodExamples = [
    { text: "Drop your standups", type: 'headline' as const },
    { text: "No more status meetings", type: 'headline' as const },
    { text: "Save 5 hours per week", type: 'benefit' as const }
  ];
  
  const badExamples = [
    { text: "Revolutionary AI-powered solution transforms your workflow", type: 'headline' as const },
    { text: "Leverage cutting-edge technology to optimize synergies", type: 'description' as const },
    { text: "Get started today", type: 'cta' as const }
  ];
  
  console.log('✅ Good Examples:');
  goodExamples.forEach(example => {
    const result = validateCopy(example.text, example.type);
    console.log(`   "${example.text}" - Score: ${result.score}/100`);
  });
  
  console.log('\n❌ Bad Examples:');
  badExamples.forEach(example => {
    const result = validateCopy(example.text, example.type);
    console.log(`   "${example.text}" - Score: ${result.score}/100`);
    if (result.issues.length > 0) {
      console.log(`   Issues: ${result.issues.map(i => i.message).join(', ')}`);
    }
  });
  
  return {
    overallScore,
    results,
    passed: overallScore >= 80 // Pass threshold
  };
}

// Generate a report for stakeholders
export function generateBrandComplianceReport() {
  const testResults = testMarketingCopyCompliance();
  
  const report = {
    timestamp: new Date().toISOString(),
    overallScore: testResults.overallScore,
    passed: testResults.passed,
    summary: {
      totalElements: Object.keys(marketingCopy).length,
      validElements: Object.values(testResults.results).filter(r => r.isValid).length,
      averageScore: testResults.overallScore
    },
    recommendations: [
      testResults.overallScore < 70 ? "Significant copy revision needed to align with brand guidelines" : null,
      testResults.overallScore < 85 ? "Minor copy adjustments recommended" : null,
      testResults.overallScore >= 85 ? "Copy strongly aligns with brand voice" : null
    ].filter(Boolean),
    details: testResults.results
  };
  
  return report;
}

// Export for use in development
if (typeof window === 'undefined') {
  // Node.js environment - can run tests
  const results = testMarketingCopyCompliance();
  console.log(`\n🎯 Test Summary: ${results.passed ? 'PASSED' : 'FAILED'}`);
}
