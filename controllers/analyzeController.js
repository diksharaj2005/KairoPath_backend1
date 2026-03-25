import ResumeAnalyzer from "../models/ResumeAnalyzer.js";
import { extractTextFromPDF } from "../utils/resumeParser.js";
import { extractKeywords, analyzeResumeNLP } from "../utils/nlpEngine.js";
import { runGeminiAnalysis } from "../utils/geminiEngine.js";
import { calculateATS } from "../utils/atsEngine.js";

export const analyzeResume = async (req, res) => {
  try {
    // -----------------------------
    // Validate User
    // -----------------------------
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: "Unauthorized. Token missing or invalid."
      });
    }

    const userId = req.user.id;

    // -----------------------------
    // Validate Job Description
    // -----------------------------
    const jobRole = req.body.jobRole || "Software Developer";
    const jobDescription = req.body.jobDescription;

    if (!jobDescription || jobDescription.trim().length < 10) {
      return res.status(400).json({
        message: "Valid jobDescription of at least 10 characters is required."
      });
    }

    console.log('Received jobRole:', jobRole);
    console.log('Received jobDescription:', jobDescription);

    // -----------------------------
    // Validate Resume PDF
    // -----------------------------
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        message: "Resume PDF is required for analysis."
      });
    }

    console.log('Received file buffer size:', req.file?.buffer?.length || 0);

    // -----------------------------
    // Extract Resume Text
    // -----------------------------
    const resumeText = await extractTextFromPDF(req.file.buffer);

    console.log('Extracted Resume Text:', resumeText);

    if (!resumeText || resumeText.trim().length < 20) {
      console.error('Error: Resume text is empty or unreadable.');
      return res.status(400).json({
        message: 'Resume text is empty or unreadable'
      });
    }

    // -----------------------------
    // NLP Processing
    // -----------------------------
    const jobKeywords = extractKeywords(jobDescription);
    const nlpData = analyzeResumeNLP(resumeText, jobKeywords);

    // console.log('Debug: Starting NLP processing...');
    // console.log('Debug: Extracted Keywords:', jobKeywords);
    // console.log('Debug: NLP Data:', nlpData);

    // -----------------------------
    // Gemini AI Analysis
    // -----------------------------
    let gemini;
    try {
      gemini = await runGeminiAnalysis(resumeText, jobRole, {
        ...nlpData,
        jobDescription,
        jobKeywords,
      });
    } catch (err) {
      console.error("Gemini Analysis Error:", err.message);
      gemini = {
        strengths: [],
        weaknesses: [],
        recommendations: [],
        certificationFeedback: [],
        projectFeedback: [],
        skillFeedback: [],
        improvedSummary: "",
        jobFit: "Could not compute",
      };
    }

    console.log('Debug: Starting Gemini AI Analysis...');
    console.log('Debug: Resume Text for Gemini:', resumeText.slice(0, 100)); // Log first 100 characters
    console.log('Debug: Job Role for Gemini:', jobRole);

    // -----------------------------
    // ATS Score
    // -----------------------------
    const ats = calculateATS(nlpData, 75);

    console.log('Debug: Starting ATS Score Calculation...');
    console.log('Debug: NLP Data for ATS:', nlpData);

    // -----------------------------
    // Save Analysis
    // -----------------------------
    const analyzedResume = new ResumeAnalyzer({
      userId,
      jobRole,
      jobDescription,
      sections: [],
      pdfText: resumeText,
      analysis: {
        atsScore: ats,
        strengths: gemini.strengths || [],
        weaknesses: gemini.weaknesses || [],
        recommendations: gemini.recommendations || [],
        certificationFeedback: gemini.certificationFeedback || [],
        projectFeedback: gemini.projectFeedback || [],
        skillFeedback: gemini.skillFeedback || [],
        improvedSummary: gemini.improvedSummary || "",
        jobFit: gemini.jobFit || "Unknown",
        missingKeywords: nlpData.missingKeywords || [],
      },
    });

    await analyzedResume.save();

    return res.status(200).json({
      message: "Resume analysis complete and saved successfully",
      analysisId: analyzedResume._id,
      analysis: analyzedResume.analysis,
    });

  } catch (err) {
    console.error("Resume Analyzer Fatal Error:", err);
    return res.status(500).json({
      message: "Resume analysis failed",
      error: err.message,
    });
  }
};
