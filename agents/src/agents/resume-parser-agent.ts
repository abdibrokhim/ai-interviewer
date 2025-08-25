import { Agent } from '@openai/agents';
import { resumeParserTools } from '../tools/resume-parser';
import { ParsedResume } from '../types';

export const resumeParserAgent = new Agent({
  name: 'resume_parser',
  instructions: `You are an expert resume parser and analyzer. Your role is to:

1. Extract structured information from resumes accurately
2. Identify and categorize technical skills by proficiency level
3. Parse work experience with focus on achievements and impact
4. Extract education and certifications
5. Identify online presence (GitHub, LinkedIn, portfolio)
6. Provide insights about candidate's background

Key extraction points:
- Personal Information: Name, email, phone, location
- Professional Summary: Key strengths and career objectives
- Technical Skills: Languages, frameworks, tools, databases, cloud platforms
- Work Experience: Company, role, duration, responsibilities, achievements
- Education: Degree, institution, graduation year, GPA (if available)
- Projects: Personal or professional projects with tech stack
- Certifications: Technical certifications and their validity
- Online Presence: GitHub, LinkedIn, personal website, technical blog

For each skill found:
- Categorize by type (language, framework, database, etc.)
- Estimate proficiency based on context and usage
- Note years of experience if mentioned

For work experience:
- Focus on quantifiable achievements
- Identify technologies used in each role
- Note progression and growth
- Extract leadership or mentoring experience

Quality checks:
- Verify email format validity
- Ensure phone numbers are properly formatted
- Check for consistency in dates
- Flag any potential discrepancies

Return structured data that can be used for:
- Candidate profile creation
- Skill matching with job requirements
- Experience level assessment
- Interview question customization`,
  tools: resumeParserTools,
});

// Additional parsing function for AI enhancement
export async function enhanceResumeWithAI(
  agent: Agent,
  basicParsedData: any,
  resumeText: string
): Promise<ParsedResume> {
  const enhancementPrompt = `
Given this resume text and basic parsed data, extract and structure the following information:

Resume Text:
${resumeText}

Basic Parsed Data:
${JSON.stringify(basicParsedData, null, 2)}

Please extract:
1. Complete work experience with:
   - Company names
   - Job titles
   - Start and end dates (or duration)
   - Key responsibilities and achievements
   - Technologies used

2. Education details:
   - Degree and major
   - Institution name
   - Graduation year or expected graduation
   - GPA if mentioned
   - Relevant coursework

3. Projects (if any):
   - Project name and description
   - Technologies used
   - Your role and contributions
   - Outcomes or impact

4. A professional summary (2-3 sentences) based on the resume content

5. Any certifications or awards

6. Languages spoken (programming and human languages)

Format the response as structured JSON matching the ParsedResume schema.
`;

  // This would be processed by the agent
  return {} as ParsedResume;
}

// Helper function to match skills with job requirements
export function matchSkillsWithRequirements(
  candidateSkills: string[],
  requiredSkills: string[],
  preferredSkills: string[] = []
): {
  matchedRequired: string[];
  matchedPreferred: string[];
  missingRequired: string[];
  additionalSkills: string[];
  matchScore: number;
} {
  const candidateSkillsLower = candidateSkills.map(s => s.toLowerCase());
  const requiredSkillsLower = requiredSkills.map(s => s.toLowerCase());
  const preferredSkillsLower = preferredSkills.map(s => s.toLowerCase());

  const matchedRequired = requiredSkills.filter(skill =>
    candidateSkillsLower.some(cs => 
      cs.includes(skill.toLowerCase()) || skill.toLowerCase().includes(cs)
    )
  );

  const matchedPreferred = preferredSkills.filter(skill =>
    candidateSkillsLower.some(cs => 
      cs.includes(skill.toLowerCase()) || skill.toLowerCase().includes(cs)
    )
  );

  const missingRequired = requiredSkills.filter(skill =>
    !matchedRequired.includes(skill)
  );

  const allMatchedSkills = [...matchedRequired, ...matchedPreferred].map(s => s.toLowerCase());
  const additionalSkills = candidateSkills.filter(skill =>
    !allMatchedSkills.some(ms => 
      ms.includes(skill.toLowerCase()) || skill.toLowerCase().includes(ms)
    )
  );

  const matchScore = (
    (matchedRequired.length / requiredSkills.length) * 70 +
    (matchedPreferred.length / Math.max(preferredSkills.length, 1)) * 30
  );

  return {
    matchedRequired,
    matchedPreferred,
    missingRequired,
    additionalSkills,
    matchScore: Math.round(matchScore),
  };
}

// Helper function to estimate experience level
export function estimateExperienceLevel(
  experience: Array<{ duration?: string; startDate?: string; endDate?: string }>
): { years: number; level: 'entry' | 'junior' | 'mid' | 'senior' | 'lead' } {
  let totalMonths = 0;

  for (const exp of experience) {
    if (exp.duration) {
      // Parse duration like "2 years 3 months"
      const years = parseInt(exp.duration.match(/(\d+)\s*year/i)?.[1] || '0');
      const months = parseInt(exp.duration.match(/(\d+)\s*month/i)?.[1] || '0');
      totalMonths += years * 12 + months;
    } else if (exp.startDate && exp.endDate) {
      // Calculate from dates
      const start = new Date(exp.startDate);
      const end = exp.endDate.toLowerCase() === 'present' ? new Date() : new Date(exp.endDate);
      const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + 
                        (end.getMonth() - start.getMonth());
      totalMonths += Math.max(0, monthsDiff);
    }
  }

  const years = totalMonths / 12;

  let level: 'entry' | 'junior' | 'mid' | 'senior' | 'lead';
  if (years < 1) level = 'entry';
  else if (years < 3) level = 'junior';
  else if (years < 6) level = 'mid';
  else if (years < 10) level = 'senior';
  else level = 'lead';

  return { years: Math.round(years * 10) / 10, level };
}
