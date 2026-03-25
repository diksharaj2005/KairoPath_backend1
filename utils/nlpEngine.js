// utils/nlpEngine.js

// 🔹 Expanded stopword list
const STOP_WORDS = new Set([
  "and","with","the","to","in","a","for","of","on","is","are",
  "was","were","be","have","has","had","from","that","this",
  "an","as","at","by","it","or","but","up","out","about",
  "resume","summary","objective"
]);

// 🔹 Clean + tokenize text
const tokenize = (text = "") => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
};

// 🔹 Keyword extraction (unique list)
export const extractKeywords = (text = "") => {
  if (!text.trim()) return [];
  const tokens = tokenize(text);
  return [...new Set(tokens)];
};

// 🔹 NLP Resume Analysis
export const analyzeResumeNLP = (text = "", jobKeywords = []) => {

  const tokens = tokenize(text);
  const extractedKeywords = [...new Set(tokens)];

  const normalizedJobKeywords = jobKeywords.map(k => k.toLowerCase());

  // 🔹 Match count
  const matchCount = normalizedJobKeywords.filter(kw =>
    extractedKeywords.includes(kw)
  ).length;

  const keywordMatch = normalizedJobKeywords.length
    ? Math.round((matchCount / normalizedJobKeywords.length) * 100)
    : 0;

  const missingKeywords = normalizedJobKeywords.filter(
    kw => !extractedKeywords.includes(kw)
  );

  // 🔹 Real frequency ranking
  const freqMap = {};
  tokens.forEach(word => {
    freqMap[word] = (freqMap[word] || 0) + 1;
  });

  const rankedKeywords = Object.entries(freqMap)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);

  return {
    extractedKeywords: rankedKeywords,
    keywordMatch,
    missingKeywords
  };
};
