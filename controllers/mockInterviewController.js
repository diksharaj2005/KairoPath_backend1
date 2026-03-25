
import mongoose from "mongoose";
import MockInterview from "../models/MockInterview.js";
import { generateText, cleanJsonResponse } from "../utils/gemini.js";

// Build prompt for generating questions
const buildQuestionPrompt = (interviewType, interviewMode, jobRole, skills, resumeContext) => {
  let context = "";
  
  if (interviewMode === "job") {
    context = `Job Role: ${jobRole}\nRequired Skills: ${skills}`;
  } else if (interviewMode === "resume" && resumeContext) {
    context = `Resume Context:\n${resumeContext}`;
  }

  return `
You are an expert interviewer. Generate 10 ${interviewType} interview questions for a candidate.

${context}

Return ONLY a JSON array with objects containing a "question" field. No other text.
Example: [{"question": "Question 1"}, {"question": "Question 2"}]
`;
};

// Build prompt for generating feedback on an answer
const buildFeedbackPrompt = (question, answer, interviewType) => {
  return `
You are an expert career coach. Provide feedback for the following ${interviewType} interview question and answer.

Question: ${question}

Candidate's Answer: ${answer}

Provide feedback in JSON format with these fields:
- feedback: Constructive feedback on the answer (2-3 sentences)
- score: A score from 0-100 based on answer quality, clarity, and relevance

Return ONLY JSON with this format:
{"feedback": "Your feedback here", "score": 85}
`;
};

// Build prompt for final overall feedback
const buildOverallFeedbackPrompt = (questions, interviewType) => {
  const questionsAndAnswers = questions.map((q, i) => 
    `Q${i+1}: ${q.question}\nAnswer: ${q.answer}\nScore: ${q.score}/100\nFeedback: ${q.feedback}`
  ).join("\n\n");

  return `
You are an expert career coach. Provide an overall assessment for this ${interviewType} mock interview.

Interview Responses:
${questionsAndAnswers}

Provide overall feedback in JSON format:
- overallFeedback: Summary of performance and key areas for improvement (2-3 sentences)
- finalScore: Average of all question scores, rounded to nearest integer

Return ONLY JSON:
{"overallFeedback": "Summary here", "finalScore": 75}
`;
};

// Helper function to extract question text
const extractQuestionText = (q) => {
  if (typeof q === 'string') return q;
  if (typeof q === 'object' && q !== null) {
    return q.question || q.question?.question || JSON.stringify(q);
  }
  return String(q);
};

// START INTERVIEW - Create new interview session (job-based)
export const startInterview = async (req, res) => {
  try {
    const { interviewType, interviewMode, jobRole, skills } = req.body;
    const userId = req.user.id;

    if (!interviewType || !interviewMode) {
      return res.status(400).json({ message: "Interview type and mode are required" });
    }

    if (interviewMode === "job" && (!jobRole || !skills)) {
      return res.status(400).json({ message: "Job role and skills are required for job-based interview" });
    }

    // Generate questions using AI
    const prompt = buildQuestionPrompt(interviewType, interviewMode, jobRole, skills, "");
    const aiResponse = await generateText(prompt);

    // Parse questions from AI response
    let questions = [];
    try {
      const cleanedResponse = cleanJsonResponse(aiResponse);
      const parsed = JSON.parse(cleanedResponse);
      questions = Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      // If parsing fails, try to extract questions from text
      const lines = aiResponse.split("\n").filter(line => line.includes("?"));
      questions = lines.map(q => ({ question: q.replace(/^\d+[\.\)]\s*/, "").trim() }));
    }

    // Ensure each question has just the question text
    const processedQuestions = questions.map(q => ({
      question: extractQuestionText(q),
      answer: "",
      feedback: "",
      score: 0
    }));

    // Create interview session in database
    const interview = await MockInterview.create({
      userId: new mongoose.Types.ObjectId(userId),
      interviewType,
      interviewMode,
      jobRole: jobRole || "",
      skills: skills || "",
      questions: processedQuestions,
      finalScore: 0,
      overallFeedback: "",
      status: "in_progress",
    });

    res.status(201).json({
      interviewId: interview._id,
      questions: interview.questions,
    });
  } catch (err) {
    console.error("Error starting interview:", err.message);
    res.status(500).json({ message: "Error creating interview session" });
  }
};

// START INTERVIEW WITH RESUME - Create new interview session with uploaded resume
export const startInterviewWithResume = async (req, res) => {
  try {
    const { interviewType, interviewMode } = req.body;
    const userId = req.user.id;

    if (!interviewType || !interviewMode) {
      return res.status(400).json({ message: "Interview type and mode are required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Resume file is required" });
    }

    // Parse resume using resume parser
    let resumeContext = "";
    let resumeUrl = "";
    
    try {
      const { parseResume } = await import("../utils/resumeParser.js");
      const parsedResume = await parseResume(req.file.path);
      
      // Create URL for the uploaded resume
      const filename = req.file.filename;
      resumeUrl = `/uploads/interviews/${filename}`;
      
      resumeContext = `
Job Role: ${parsedResume.jobRole || "Not provided"}
Experience: ${parsedResume.experience?.join(", ") || "None"}
Skills: ${parsedResume.skills?.join(", ") || "None"}
Education: ${parsedResume.education?.join(", ") || "None"}
Summary: ${parsedResume.summary || "None"}
`;
    } catch (err) {
      console.error("Error parsing resume:", err.message);
      resumeContext = "Resume uploaded but could not be parsed. Using generic questions.";
    }

    // Generate questions using AI
    const prompt = buildQuestionPrompt(interviewType, interviewMode, "", "", resumeContext);
    const aiResponse = await generateText(prompt);

    // Parse questions from AI response
    let questions = [];
    try {
      const cleanedResponse = cleanJsonResponse(aiResponse);
      const parsed = JSON.parse(cleanedResponse);
      questions = Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      // If parsing fails, try to extract questions from text
      const lines = aiResponse.split("\n").filter(line => line.includes("?"));
      questions = lines.map(q => ({ question: q.replace(/^\d+[\.\)]\s*/, "").trim() }));
    }

    // Ensure each question has just the question text
    const processedQuestions = questions.map(q => ({
      question: extractQuestionText(q),
      answer: "",
      feedback: "",
      score: 0
    }));

    // Create interview session in database
    const interview = await MockInterview.create({
      userId: new mongoose.Types.ObjectId(userId),
      interviewType,
      interviewMode,
      resumeUrl,
      jobRole: "",
      skills: "",
      questions: processedQuestions,
      finalScore: 0,
      overallFeedback: "",
      status: "in_progress",
    });

    res.status(201).json({
      interviewId: interview._id,
      questions: interview.questions,
    });
  } catch (err) {
    console.error("Error starting interview with resume:", err.message);
    res.status(500).json({ message: "Error creating interview session" });
  }
};

// SAVE ANSWER - Save user's answer and get immediate feedback
export const saveAnswer = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { questionIndex, answer } = req.body;
    const userId = req.user.id;

    const interview = await MockInterview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    if (!interview.userId.equals(userId)) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    if (!interview.questions[questionIndex]) {
      return res.status(400).json({ message: "Invalid question index" });
    }

    // Get the question text properly
    const questionText = extractQuestionText(interview.questions[questionIndex].question);

    // Update answer
    interview.questions[questionIndex].answer = answer;

    // Generate feedback using AI
    const feedbackPrompt = buildFeedbackPrompt(
      questionText,
      answer,
      interview.interviewType
    );
    
    try {
      const aiFeedback = await generateText(feedbackPrompt);
      const cleanedFeedback = cleanJsonResponse(aiFeedback);
      const feedbackData = JSON.parse(cleanedFeedback);
      
      interview.questions[questionIndex].feedback = feedbackData.feedback || "";
      interview.questions[questionIndex].score = feedbackData.score || 0;
    } catch (err) {
      console.error("Error generating feedback:", err.message);
      interview.questions[questionIndex].feedback = "Unable to generate feedback at this time.";
      interview.questions[questionIndex].score = 50;
    }

    await interview.save();

    res.json({
      feedback: interview.questions[questionIndex].feedback,
      score: interview.questions[questionIndex].score,
    });
  } catch (err) {
    console.error("Error saving answer:", err.message);
    res.status(500).json({ message: "Error saving answer" });
  }
};

// COMPLETE INTERVIEW - Generate final feedback and score
export const completeInterview = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const userId = req.user.id;

    const interview = await MockInterview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    if (!interview.userId.equals(userId)) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    // Process questions to get proper question text
    const processedQuestions = interview.questions.map(q => ({
      ...q,
      question: extractQuestionText(q.question)
    }));

    // Generate overall feedback using AI
    const overallPrompt = buildOverallFeedbackPrompt(processedQuestions, interview.interviewType);
    
    try {
      const aiFeedback = await generateText(overallPrompt);
      const cleanedFeedback = cleanJsonResponse(aiFeedback);
      const feedbackData = JSON.parse(cleanedFeedback);
      
      interview.overallFeedback = feedbackData.overallFeedback || "";
      interview.finalScore = feedbackData.finalScore || 0;
    } catch (err) {
      console.error("Error generating overall feedback:", err.message);
      // Calculate average score from individual questions
      const totalScore = interview.questions.reduce((sum, q) => sum + q.score, 0);
      interview.finalScore = Math.round(totalScore / interview.questions.length) || 0;
      interview.overallFeedback = "Interview completed. Please review individual question feedback for details.";
    }

    interview.status = "completed";
    await interview.save();

    res.json({
      finalScore: interview.finalScore,
      overallFeedback: interview.overallFeedback,
      questions: interview.questions,
    });
  } catch (err) {
    console.error("Error completing interview:", err.message);
    res.status(500).json({ message: "Error completing interview" });
  }
};

// GET INTERVIEW - Get interview details
export const getInterview = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const userId = req.user.id;

    const interview = await MockInterview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    if (!interview.userId.equals(userId)) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    res.json(interview);
  } catch (err) {
    console.error("Error getting interview:", err.message);
    res.status(500).json({ message: "Error retrieving interview" });
  }
};

// GET USER INTERVIEWS - Get all interviews for current user
export const getUserInterviews = async (req, res) => {
  try {
    const userId = req.user.id;

    const interviews = await MockInterview.find({ userId })
      .sort({ createdAt: -1 })
      .select("interviewType interviewMode jobRole skills resumeUrl finalScore status createdAt");

    res.json(interviews);
  } catch (err) {
    console.error("Error getting user interviews:", err.message);
    res.status(500).json({ message: "Error retrieving interviews" });
  }
};

