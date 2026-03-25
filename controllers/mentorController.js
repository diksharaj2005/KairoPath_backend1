import mongoose from "mongoose";
import MentorSession from "../models/MentorSession.js";
import { generateText } from "../utils/gemini.js";
import { cleanText } from "../utils/cleanAiOutput.js";

// Build Prompt (NO resume logic)
const buildMentorPrompt = (goal, messages) => {
  return `
You are the KairoPath AI Career Mentor,Your name is ARGO. Your role is to provide personalized career advice, interview preparation, and job search strategies to help users achieve their career goals.

User Goal: ${goal}

Conversation:
${messages.map(m => `${m.role}: ${m.content}`).join("\n")}

Reply professionally and helpfully.
`;
};

// START SESSION
export const startSession = async (req, res) => {
  try {
    const { goal } = req.body;
    const userId = req.user.id;

    if (!goal)
      return res.status(400).json({ message: "Career goal is required" });

    const session = await MentorSession.create({
      userId: new mongoose.Types.ObjectId(userId),
      goal,
      messages: [],
    });

    res.status(201).json({ sessionId: session._id });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error creating session" });
  }
};

// CHAT
export const mentorChat = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    const session = await MentorSession.findById(sessionId);
    if (!session)
      return res.status(404).json({ message: "Session not found" });

    // Verify ownership
    if (!session.userId.equals(userId))
      return res.status(403).json({ message: "Unauthorized access to this session" });

    // Save user message
    session.messages.push({ role: "user", content: message });
    await session.save();

    // Build prompt (NO resumeData)
    const prompt = buildMentorPrompt(
      session.goal,
      session.messages
    );

    const aiResponse = await generateText(prompt);

    const cleanedResponse = cleanText(aiResponse);

    // Save AI response
    session.messages.push({ role: "assistant", content: cleanedResponse });
    await session.save();

    res.json({ reply: cleanedResponse });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET SESSION
export const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await MentorSession.findById(sessionId);

    if (!session)
      return res.status(404).json({ message: "Session not found" });

    if (!session.userId.equals(userId))
      return res.status(403).json({ message: "Unauthorized access to this session" });

    res.json(session);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};