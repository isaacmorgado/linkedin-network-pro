/**
 * Test Script for Resume Matcher
 * Validates the semantic skill matching engine
 */

import { matchUserToJob } from './src/services/resume-matcher';
import type { UserProfile, JobRequirements } from './src/types/resume-tailoring';

// Test User Profile: Software Engineer with React experience
const testProfile: UserProfile = {
  name: 'Jane Developer',
  title: 'Frontend Engineer',
  workExperience: [
    {
      id: '1',
      company: 'Tech Corp',
      title: 'Frontend Developer',
      startDate: '2021-01',
      endDate: null,
      skills: ['react', 'typescript', 'javascript', 'html', 'css'],
      domains: ['web development'],
      responsibilities: ['Build user interfaces', 'Write clean code'],
      achievements: [
        {
          id: 'a1',
          bullet: 'Built responsive dashboard using React and TypeScript, improving user engagement by 40%',
          action: 'Built',
          object: 'responsive dashboard',
          result: 'improving user engagement by 40%',
          metrics: [
            {
              value: 40,
              unit: '%',
              type: 'increase',
              context: 'user engagement',
            },
          ],
          skills: ['react', 'typescript', 'dashboard', 'responsive design'],
          keywords: ['react', 'typescript', 'dashboard', 'engagement'],
          transferableSkills: ['problem solving', 'attention to detail'],
          verified: true,
          source: 'user',
        },
        {
          id: 'a2',
          bullet: 'Implemented state management with Redux, reducing bugs by 30%',
          action: 'Implemented',
          object: 'state management with Redux',
          result: 'reducing bugs by 30%',
          metrics: [
            {
              value: 30,
              unit: '%',
              type: 'decrease',
              context: 'bugs',
            },
          ],
          skills: ['redux', 'state management', 'react'],
          keywords: ['redux', 'state management', 'bug reduction'],
          transferableSkills: ['problem solving', 'debugging'],
          verified: true,
          source: 'user',
        },
      ],
    },
  ],
  education: [
    {
      id: 'e1',
      school: 'State University',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      startDate: '2017-09',
      endDate: '2021-05',
      gpa: 3.7,
      relevantCourses: ['Data Structures', 'Web Development', 'Algorithms'],
    },
  ],
  projects: [
    {
      id: 'p1',
      name: 'Personal Portfolio',
      description: 'Built a portfolio website using React and Next.js',
      skills: ['react', 'next.js', 'tailwind'],
      domains: ['web development'],
      achievements: [
        {
          id: 'pa1',
          bullet: 'Designed and deployed portfolio using Next.js and Tailwind CSS',
          action: 'Designed',
          object: 'portfolio',
          skills: ['next.js', 'tailwind', 'deployment'],
          keywords: ['next.js', 'tailwind', 'portfolio'],
          transferableSkills: ['design', 'deployment'],
          verified: true,
          source: 'user',
        },
      ],
      treatedAsExperience: false,
    },
  ],
  skills: [
    { name: 'React', level: 'advanced', yearsOfExperience: 3, category: 'framework' },
    { name: 'TypeScript', level: 'intermediate', yearsOfExperience: 2, category: 'programming-language' },
    { name: 'JavaScript', level: 'expert', yearsOfExperience: 5, category: 'programming-language' },
    { name: 'HTML/CSS', level: 'advanced', yearsOfExperience: 5, category: 'programming-language' },
  ],
  metadata: {
    totalYearsExperience: 3,
    domains: ['web development', 'frontend'],
    seniority: 'mid',
    careerStage: 'professional',
  },
};

// Test Job Requirements: Senior Frontend Engineer at a startup
const testRequirements: JobRequirements = {
  required: [
    {
      term: 'React',
      category: 'technical-skill',
      required: true,
      frequency: 5,
      weight: 95,
      context: ['Expert in React development', 'Build scalable React applications'],
      synonyms: ['react.js', 'reactjs'],
    },
    {
      term: 'TypeScript',
      category: 'technical-skill',
      required: true,
      frequency: 4,
      weight: 90,
      context: ['Strong TypeScript skills required'],
    },
    {
      term: 'Redux',
      category: 'technical-skill',
      required: true,
      frequency: 3,
      weight: 80,
      context: ['State management with Redux'],
    },
    {
      term: 'Node.js',
      category: 'technical-skill',
      required: true,
      frequency: 2,
      weight: 70,
      context: ['Basic Node.js knowledge needed'],
    },
  ],
  preferred: [
    {
      term: 'Next.js',
      category: 'technical-skill',
      required: false,
      frequency: 2,
      weight: 60,
      context: ['Next.js experience is a plus'],
    },
    {
      term: 'GraphQL',
      category: 'technical-skill',
      required: false,
      frequency: 1,
      weight: 50,
      context: ['GraphQL experience preferred'],
    },
    {
      term: 'Docker',
      category: 'tool',
      required: false,
      frequency: 1,
      weight: 45,
    },
  ],
  experienceYears: 3,
  jobLevel: 'mid',
};

// Run the test
console.log('========================================');
console.log('SEMANTIC SKILL MATCHING ENGINE TEST');
console.log('========================================\n');

console.log('Testing Profile:', testProfile.name, '-', testProfile.title);
console.log('Target Role: Senior Frontend Engineer\n');

try {
  const matchReport = matchUserToJob(testProfile, testRequirements);

  console.log('========================================');
  console.log('MATCH REPORT SUMMARY');
  console.log('========================================\n');

  console.log(`Overall Match Score: ${(matchReport.matchScore * 100).toFixed(1)}%\n`);

  console.log('Match Breakdown:');
  console.log(`- Direct Matches: ${matchReport.directMatches.length}`);
  console.log(`- Semantic Matches: ${matchReport.semanticMatches.length}`);
  console.log(`- Transferable Matches: ${matchReport.transferableMatches.length}`);
  console.log(`- Inferred Matches: ${matchReport.inferredMatches.length}`);
  console.log(`- Total Matches: ${matchReport.matches.length}`);
  console.log(`- Missing Requirements: ${matchReport.missing.length}\n`);

  // Show detailed matches
  console.log('========================================');
  console.log('DETAILED MATCHES');
  console.log('========================================\n');

  for (const match of matchReport.matches) {
    console.log(`\n✓ ${match.requirement.term}`);
    console.log(`  Type: ${match.matchType}`);
    console.log(`  Confidence: ${(match.confidence * 100).toFixed(0)}%`);
    console.log(`  Evidence: ${match.userEvidence.length} examples`);
    console.log(`  Explanation: ${match.explanation}`);

    if (match.userEvidence.length > 0) {
      console.log(`  Example: "${match.userEvidence[0].bullet.substring(0, 80)}..."`);
    }
  }

  // Show missing requirements
  if (matchReport.missing.length > 0) {
    console.log('\n========================================');
    console.log('MISSING REQUIREMENTS');
    console.log('========================================\n');

    for (const missing of matchReport.missing) {
      console.log(`✗ ${missing.term} (${missing.required ? 'REQUIRED' : 'Preferred'})`);
    }
  }

  // Show recommendations
  if (matchReport.recommendations.length > 0) {
    console.log('\n========================================');
    console.log('RECOMMENDATIONS');
    console.log('========================================\n');

    for (const rec of matchReport.recommendations) {
      const priorityIcon = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
      console.log(`\n${priorityIcon} ${rec.type.toUpperCase()} (${rec.priority})`);
      if (rec.skill) console.log(`  Skill: ${rec.skill}`);
      console.log(`  Reason: ${rec.reason}`);
      console.log(`  Suggestion: ${rec.suggestion}`);
    }
  }

  console.log('\n========================================');
  console.log('TEST COMPLETED SUCCESSFULLY');
  console.log('========================================\n');

} catch (error) {
  console.error('\n❌ TEST FAILED:', error);
  process.exit(1);
}
