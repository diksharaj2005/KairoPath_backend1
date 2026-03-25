import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      default: "",
    },
    feedback: {
      type: String,
      default: "",
    },
    score: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const mockInterviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    interviewType: {
      type: String,
      enum: ["hr", "technical", "behavioral"],
      required: true,
    },
    interviewMode: {
      type: String,
      enum: ["resume", "job"],
      required: true,
    },
    resumeUrl: {
      type: String,
      default: "",
    },
    jobRole: {
      type: String,
      default: "",
    },
    skills: {
      type: String,
      default: "",
    },
    questions: {
      type: [questionSchema],
      default: [],
    },
    finalScore: {
      type: Number,
      default: 0,
    },
    overallFeedback: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["in_progress", "completed"],
      default: "in_progress",
    },
  },
  { timestamps: true }
);

export default mongoose.model("MockInterview", mockInterviewSchema);
