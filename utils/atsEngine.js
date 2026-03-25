// utils/atsEngine.js

/**
 * Calculate ATS score using NLP analysis + AI scoring
 * @param {Object} nlpData
 * @param {number} geminiScore
 * @returns {Object}
 */

export const calculateATS = (nlpData = {}, geminiScore = 75) => {
  try {
    const {
      keywordMatch = 0,
      missingKeywords = []
    } = nlpData;

    // Ensure numbers
    const safeKeywordMatch = Number(keywordMatch) || 0;
    const safeGeminiScore = Number(geminiScore) || 0;

    // 🔹 Weighted ATS calculation
    let score = Math.round(
      safeKeywordMatch * 0.6 +
      safeGeminiScore * 0.4
    );

    // 🔹 Clamp score between 0–100
    score = Math.max(0, Math.min(100, score));

    return {
      score,
      keywordMatch: safeKeywordMatch,
      missingKeywords
    };
  } catch (error) {
    console.error("ATS calculation failed:", error.message);

    return {
      score: 0,
      keywordMatch: 0,
      missingKeywords: []
    };
  }
};
