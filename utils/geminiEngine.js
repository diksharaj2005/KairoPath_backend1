// utils/geminiEngine.js

import { generateText } from "./gemini.js";

// Universal JSON extractor
const extractJSON = (text = "") => {
  if (!text || typeof text !== "string") return null;

  try {
    const cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start === -1 || end === -1) return null;

    return JSON.parse(cleaned.substring(start, end + 1));
  } catch (err) {
    console.error("Gemini JSON PARSE ERROR:", err.message);
    return null;
  }
};

export const runGeminiAnalysis = async (resumeText, jobRole = "", nlpData = {}) => {
  try {
    const prompt = `
You are an advanced ATS + HR resume evaluation engine.
Analyze resume content thoroughly based on:

- Skills
- Projects
- Certifications
- Work experience
- Technical depth
- Alignment with job role: ${jobRole}

Below is the extracted resume:

-----------------------
${resumeText}
-----------------------

NLP engine extracted keywords & mismatches:
${JSON.stringify(nlpData, null, 2)}

Return STRICT JSON ONLY with the following schema:

{
  "strengths": [],
  "weaknesses": [],
  "recommendations": [],
  "certificationFeedback": [],
  "projectFeedback": [],
  "skillFeedback": [],
  "improvedSummary": "",
  "jobFit": ""
}
`;

    const aiResponse = await generateText(prompt);
    const data = extractJSON(aiResponse);

    if (data) return data;

    console.error("Gemini JSON Parse Failed. Raw response:", aiResponse);

    return {
      strengths: [],
      weaknesses: [],
      recommendations: [],
      certificationFeedback: [],
      projectFeedback: [],
      skillFeedback: [],
      improvedSummary: "",
      jobFit: "Unknown"
    };

  } catch (error) {
    console.error("Gemini Engine Error:", error.message);

    return {
      strengths: [],
      weaknesses: [],
      recommendations: [],
      certificationFeedback: [],
      projectFeedback: [],
      skillFeedback: [],
      improvedSummary: "",
      jobFit: "Error"
    };
  }
};
