// utils/resumeParser.js

import pdfParse from "pdf-parse-fixed";

export const extractTextFromPDF = async (fileBuffer) => {
  try {
    // 🔹 Validate input buffer
    if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
      throw new Error("Invalid file buffer");
    }

    // 🔹 Parse PDF
    const data = await pdfParse(fileBuffer);

    // 🔹 Validate extracted text
    const extractedText = data?.text?.trim();

    if (!extractedText) {
      throw new Error("No readable text found in PDF");
    }

    return extractedText;

  } catch (error) {
    console.error("ResumeParser Error:", error.message);

    throw new Error("PDF parsing failed");
  }
};

// Parse resume text and extract structured information
export const parseResume = async (filePath) => {
  try {
    // Read file from path
    const fs = await import('fs');
    const fileBuffer = fs.readFileSync(filePath);
    const text = await extractTextFromPDF(fileBuffer);

    // Extract structured information using regex patterns
    const result = {
      jobRole: "",
      experience: [],
      skills: [],
      education: [],
      summary: ""
    };

    // Extract email
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    const email = emailMatch ? emailMatch[0] : "";

    // Extract phone
    const phoneMatch = text.match(/\+?[\d\s()-]{10,}/);
    const phone = phoneMatch ? phoneMatch[0].trim() : "";

    // Extract skills (common programming languages, frameworks, tools)
    const skillsKeywords = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'Go', 'Rust',
      'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring',
      'HTML', 'CSS', 'SASS', 'Tailwind', 'Bootstrap',
      'MongoDB', 'MySQL', 'PostgreSQL', 'SQL', 'Redis', 'Firebase',
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Git',
      'REST', 'GraphQL', 'API', 'Agile', 'Scrum', 'CI/CD',
      'Machine Learning', 'Data Science', 'AI', 'Deep Learning', 'NLP',
      'Figma', 'Photoshop', 'Illustrator'
    ];

    const foundSkills = skillsKeywords.filter(skill => 
      text.toLowerCase().includes(skill.toLowerCase())
    );
    result.skills = foundSkills.slice(0, 15); // Limit to 15 skills

    // Extract education (look for common patterns)
    const educationPatterns = [
      /Bachelor['']?s?\s*degree\s*(?:in)?\s*([^\n.]+)/gi,
      /Master['']?s?\s*degree\s*(?:in)?\s*([^\n.]+)/gi,
      /Ph\.?D\.?\s*(?:in)?\s*([^\n.]+)/gi,
      /B\.?S\.?\s*(?:in)?\s*([^\n.]+)/gi,
      /M\.?S\.?\s*(?:in)?\s*([^\n.]+)/gi,
      /B\.?A\.?\s*(?:in)?\s*([^\n.]+)/gi,
    ];

    const educationMatches = [];
    educationPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        educationMatches.push(...matches);
      }
    });
    result.education = [...new Set(educationMatches)].slice(0, 5);

    // Extract experience (look for job titles and companies)
    const experiencePatterns = [
      /(?:Software Engineer|Developer|Designer|Manager|Analyst|Consultant|Architect|Lead|Senior|Junior|Intern)[^\n]*/gi,
    ];

    const experienceMatches = [];
    experiencePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        experienceMatches.push(...matches);
      }
    });
    result.experience = [...new Set(experienceMatches)].slice(0, 8);

    // Try to extract job role from the beginning of resume
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      // First non-empty line is usually the name/title
      result.jobRole = lines[1] || "";
    }

    return result;
  } catch (error) {
    console.error("ParseResume Error:", error.message);
    throw error;
  }
};
