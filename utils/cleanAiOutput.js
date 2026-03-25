// utils/cleanAiOutput.js

export const cleanText = (text = "") => {
  if (typeof text !== "string") return "";

  return text
    .replace(/```json|```/gi, "")   // remove code fences
    .replace(/<[^>]*>/g, "")        // remove HTML tags
    .replace(/[*#\-]/g, "")         // remove markdown symbols
    .replace(/\s+/g, " ")           // remove extra spaces
    .trim();
};

export const cleanAIResponse = (data) => {
  if (!data) return {};

  let parsedData = data;

  try {
    parsedData = JSON.parse(cleanText(data));
  } catch (err) {
    console.error("AI JSON Parsing Error:", err.message);
    return { summary: cleanText(data) };
  }

  return {
    summary: cleanText(parsedData.summary),

    experience: Array.isArray(parsedData.experience)
      ? parsedData.experience.map(cleanText)
      : [],

    projects: Array.isArray(parsedData.projects)
      ? parsedData.projects.map((p = {}) => ({
          name: cleanText(p.name),
          description: cleanText(p.description)
        }))
      : [],

    skills: Array.isArray(parsedData.skills)
      ? parsedData.skills.map(cleanText)
      : []
  };
};
