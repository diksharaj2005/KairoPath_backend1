import mongoose from "mongoose";

const ResumeAnalyzerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    jobRole: {
      type: String,
      required: true,
      trim: true,
    },

    jobDescription: {
      type: String,
      required: true,
      trim: true,
    },

    sections: [
      {
        type: {
          type: String,
          required: true,
        },
        content: mongoose.Schema.Types.Mixed,
      },
    ],

    analysis: {
      atsScore: {
        type: mongoose.Schema.Types.Mixed,
        default: 0,
      },
      strengths: { type: [String], default: [] },
      weaknesses: { type: [String], default: [] },
      missingKeywords: { type: [String], default: [] },
      recommendations: { type: [String], default: [] },
      certificationFeedback: { type: [mongoose.Schema.Types.Mixed], default: [] },
      projectFeedback: { type: [mongoose.Schema.Types.Mixed], default: [] },
      skillFeedback: { type: [mongoose.Schema.Types.Mixed], default: [] },
      improvedSummary: { type: String, default: "" },
      jobFit: { type: String, default: "Unknown" },
    },

    pdfText: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ResumeAnalyzer", ResumeAnalyzerSchema);
