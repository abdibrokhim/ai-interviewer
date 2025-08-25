import { tool } from '@openai/agents'
import { z } from 'zod'
import { ParsedResumeSchema } from '../types'

export const parseResumeTool = tool({
  name: 'parse_resume',
  description: 'Extract structured information from resume text',
  parameters: z.object({
    resumeText: z.string().describe('The raw text content of the resume'),
    enhanceWithAI: z.boolean().default(true).describe('Whether to enhance parsing with AI'),
  }),
  execute: async ({ resumeText, enhanceWithAI }: { resumeText: string; enhanceWithAI: boolean }) => {
    // Basic pattern matching for initial extraction
    const basicParsed = {
      name: extractName(resumeText),
      email: extractEmail(resumeText),
      phone: extractPhone(resumeText),
      skills: extractSkills(resumeText),
      githubUrl: extractGithubUrl(resumeText),
      linkedinUrl: extractLinkedInUrl(resumeText),
    };

    if (!enhanceWithAI) {
      return {
        ...basicParsed,
        experience: [],
        education: [],
        summary: '',
        certifications: [],
        languages: [],
      }
    }

    // AI-enhanced parsing would be done by the agent using this tool
    // The agent will use GPT to extract more complex information
    return {
      basicParsed,
      needsAIEnhancement: true,
      resumeText,
    }
  },
})

export const extractTechnicalSkillsTool = tool({
  name: 'extract_technical_skills',
  description: 'Extract and categorize technical skills from text',
  parameters: z.object({
    text: z.string(),
    categories: z.array(z.string()).default(['languages', 'frameworks', 'databases', 'tools', 'cloud']),
  }),
  execute: async ({ text, categories }: { text: string; categories: string[] }) => {
    const skillPatterns: Record<string, string[]> = {
      languages: [
        'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust',
        'php', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'perl', 'bash', 'powershell',
      ],
      frameworks: [
        'react', 'angular', 'vue', 'next.js', 'express', 'django', 'flask', 'spring',
        'rails', '.net', 'laravel', 'fastapi', 'nestjs', 'gatsby', 'nuxt', 'svelte',
      ],
      databases: [
        'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'cassandra',
        'dynamodb', 'firebase', 'neo4j', 'influxdb', 'sqlite', 'oracle', 'sql server',
      ],
      tools: [
        'git', 'docker', 'kubernetes', 'jenkins', 'github actions', 'gitlab ci',
        'terraform', 'ansible', 'puppet', 'chef', 'webpack', 'babel', 'jest', 'cypress',
      ],
      cloud: [
        'aws', 'azure', 'gcp', 'google cloud', 'heroku', 'vercel', 'netlify',
        'cloudflare', 'digital ocean', 'linode',
      ],
    };

    const textLower = text.toLowerCase();
    const categorizedSkills: Record<string, string[]> = {}

    for (const category of categories) {
      if (skillPatterns[category]) {
        categorizedSkills[category] = skillPatterns[category].filter(skill => {
          // Use word boundaries to avoid partial matches
          const regex = new RegExp(`\\b${skill}\\b`, 'i');
          return regex.test(textLower);
        });
      }
    }

    // Extract years of experience for each skill if mentioned
    const skillsWithExperience: Array<{ skill: string; category: string; yearsOfExperience: number }> = []
    const experiencePattern = /(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience\s*)?(?:in\s*)?([a-zA-Z0-9\s\.\#\+\-]+)/gi
    let match: RegExpExecArray | null

    while ((match = experiencePattern.exec(text)) !== null) {
      const years = parseInt(match[1]);
      const skillText = match[2].trim().toLowerCase();
      
      // Find which skill this refers to
      for (const [category, skills] of Object.entries(categorizedSkills)) {
        for (const skill of skills) {
          if (skillText.includes(skill)) {
            skillsWithExperience.push({
              skill,
              category,
              yearsOfExperience: years,
            })
          }
        }
      }
    }

    return {
      categorizedSkills,
      skillsWithExperience,
      totalSkillsFound: Object.values(categorizedSkills).flat().length,
    }
  },
})

export const searchOnlineTool = tool({
  name: 'search_candidate_online',
  description: 'Search for candidate information on GitHub and LinkedIn',
  parameters: z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    githubUsername: z.string().optional(),
    linkedinUrl: z.string().optional(),
  }),
  execute: async ({ name, email, githubUsername, linkedinUrl }: { name?: string; email?: string; githubUsername?: string; linkedinUrl?: string }) => {
    // This is a placeholder - in production, you would:
    // 1. Use GitHub API to fetch user repos, contributions, etc.
    // 2. Use LinkedIn API or web scraping (with permission) to get profile info
    // 3. Search for technical blog posts, Stack Overflow profile, etc.

    const results = {
      github: githubUsername ? {
        username: githubUsername,
        profileUrl: `https://github.com/${githubUsername}`,
        // These would be fetched from GitHub API
        publicRepos: 0,
        followers: 0,
        contributions: 0,
        languages: [],
        popularRepos: [],
      } : null,
      linkedin: linkedinUrl ? {
        url: linkedinUrl,
        // These would be scraped/fetched
        headline: '',
        connections: 0,
        endorsements: [],
      } : null,
      additionalLinks: [],
    }

    return {
      onlinePresence: results,
      searchPerformed: true,
      note: 'Actual API integration required for production',
    }
  },
})

// Helper functions
function extractName(text: string): string {
  // Look for name at the beginning of resume
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length > 0) {
    // First non-empty line is often the name
    const firstLine = lines[0].trim();
    // Check if it looks like a name (2-4 words, no special characters except spaces)
    if (/^[A-Za-z\s]{2,50}$/.test(firstLine) && firstLine.split(' ').length <= 4) {
      return firstLine;
    }
  }
  return '';
}

function extractEmail(text: string): string {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = text.match(emailRegex);
  return match ? match[0] : '';
}

function extractPhone(text: string): string {
  // Various phone formats
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const match = text.match(phoneRegex);
  return match ? match[0] : '';
}

function extractSkills(text: string): string[] {
  // Look for sections that might contain skills
  const skillSectionRegex = /(?:skills|technologies|tech stack|expertise|proficient|competencies)[\s:]*([^\n]+(?:\n[^\n]+)*)/gi;
  const skills: string[] = [];
  let match;

  while ((match = skillSectionRegex.exec(text)) !== null) {
    const skillText = match[1];
    // Split by common delimiters
    const potentialSkills = skillText.split(/[,;|·•\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 1 && s.length < 30);
    skills.push(...potentialSkills);
  }

  // Remove duplicates and clean up
  return [...new Set(skills.map(s => s.replace(/[•·\-\*]/, '').trim()))];
}

function extractGithubUrl(text: string): string {
  const githubRegex = /https?:\/\/(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i;
  const match = text.match(githubRegex);
  return match ? match[0] : '';
}

function extractLinkedInUrl(text: string): string {
  const linkedinRegex = /https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i;
  const match = text.match(linkedinRegex);
  return match ? match[0] : '';
}

export const resumeParserTools = [
  parseResumeTool,
  extractTechnicalSkillsTool,
  searchOnlineTool,
];
