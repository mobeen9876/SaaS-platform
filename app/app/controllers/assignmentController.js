import Assignment from "../models/Assignment.js";
import User from "../models/User.js";
import { checkAssignment as aiCheckAssignment } from "../services/assignmentAiService.js";

export const createAssignment = async (req, res) => {
  try {
    const { title, description, requirements, deadline } = req.body;
    const userId = req.user.userId;

    if (!title || !description || !requirements) {
      return res.status(400).json({
        success: false,
        error: "Title, description, and requirements are required",
      });
    }

    const user = await User.findById(userId);
    const assignment = new Assignment({
      title,
      description,
      requirements,
      deadline: deadline ? new Date(deadline) : null,
      createdBy: userId,
      createdByName: user ? `${user.firstName} ${user.lastName}` : "Admin",
    });

    await assignment.save();
    console.log("✅ Assignment created:", assignment.title);
    res.status(201).json({
      success: true,
      message: "Assignment created successfully",
      assignment,
    });
  } catch (error) {
    console.error("❌ Error creating assignment:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to create assignment" });
  }
};

export const getAssignments = async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";
    const filter = isAdmin ? {} : { isActive: true };
    const assignments = await Assignment.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    if (!isAdmin) {
      const userId = req.user.userId;
      const mapped = assignments.map((a) => {
        const mySubmission = a.submissions.find(
          (s) => s.submittedBy.toString() === userId,
        );
        return {
          ...a,
          mySubmission: mySubmission
            ? {
                _id: mySubmission._id,
                submittedAt: mySubmission.submittedAt,
                checked: mySubmission.checked,
                score: mySubmission.score,
                grade: mySubmission.grade,
                aiDetectionVerdict: mySubmission.aiDetectionVerdict,
                aiDetectionReason: mySubmission.aiDetectionReason,
              }
            : null,
          submissions: undefined,
        };
      });
      return res.json({ success: true, assignments: mapped });
    }

    res.json({ success: true, assignments });
  } catch (error) {
    console.error("❌ Error fetching assignments:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch assignments" });
  }
};

export const getAssignmentById = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment)
      return res
        .status(404)
        .json({ success: false, error: "Assignment not found" });
    res.json({ success: true, assignment });
  } catch (error) {
    console.error("❌ Error fetching assignment:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch assignment" });
  }
};

export const deleteAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const assignment = await Assignment.findByIdAndDelete(assignmentId);
    if (!assignment)
      return res
        .status(404)
        .json({ success: false, error: "Assignment not found" });
    res.json({ success: true, message: "Assignment deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting assignment:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to delete assignment" });
  }
};

export const submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    if (!content || content.trim().length < 10) {
      return res
        .status(400)
        .json({ success: false, error: "Submission content is too short" });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment)
      return res
        .status(404)
        .json({ success: false, error: "Assignment not found" });
    if (!assignment.isActive)
      return res
        .status(400)
        .json({ success: false, error: "This assignment is no longer active" });

    const alreadySubmitted = assignment.submissions.find(
      (s) => s.submittedBy.toString() === userId,
    );
    if (alreadySubmitted) {
      return res.status(400).json({
        success: false,
        error: "You have already submitted this assignment",
      });
    }

    const user = await User.findById(userId);
    const submission = {
      submittedBy: userId,
      submittedByName: user ? `${user.firstName} ${user.lastName}` : "User",
      submittedByEmail: user?.email,
      content: content.trim(),
      submittedAt: new Date(),
      checked: false,
    };

    assignment.submissions.push(submission);
    await assignment.save();

    const savedSubmission =
      assignment.submissions[assignment.submissions.length - 1];
    console.log("✅ Assignment submitted by:", user?.email);

    // Use user key first, then admin Gemini, then admin Groq
    const userAiKey = user?.aiApiKey;
    const userProvider = user?.aiProvider || "groq";
    const adminGeminiKey = process.env.GEMINI_API_KEY;
    const adminGroqKey = process.env.GROQ_API_KEY;

    let apiKeyToUse = null;
    let providerToUse = "groq";

    if (userAiKey && user?.aiApiKeyVerified) {
      apiKeyToUse = userAiKey;
      providerToUse = userProvider;
      console.log(`🔑 Using user's ${providerToUse.toUpperCase()} key`);
    } else if (adminGeminiKey) {
      apiKeyToUse = adminGeminiKey;
      providerToUse = "gemini";
      console.log("🔑 Using admin Gemini key");
    } else if (adminGroqKey) {
      apiKeyToUse = adminGroqKey;
      providerToUse = "groq";
      console.log("🔑 Using admin Groq key");
    }

    if (apiKeyToUse) {
      try {
        console.log(`🤖 Auto-checking with AI (${providerToUse})...`);
        const result = await aiCheckAssignment(
          assignment,
          content.trim(),
          apiKeyToUse,
          providerToUse,
        );

        const subIndex = assignment.submissions.findIndex(
          (s) => s._id.toString() === savedSubmission._id.toString(),
        );

        if (subIndex !== -1) {
          assignment.submissions[subIndex].checked = true;
          assignment.submissions[subIndex].score = result.score;
          assignment.submissions[subIndex].grade = result.grade;
          assignment.submissions[subIndex].grammarFeedback =
            result.grammarFeedback;
          assignment.submissions[subIndex].contentFeedback =
            result.contentFeedback;
          assignment.submissions[subIndex].mistakes = result.mistakes || [];
          assignment.submissions[subIndex].improvements =
            result.improvements || [];
          assignment.submissions[subIndex].strengths = result.strengths || [];
          assignment.submissions[subIndex].aiWrittenPercent =
            result.aiWrittenPercent;
          assignment.submissions[subIndex].humanWrittenPercent =
            result.humanWrittenPercent;
          assignment.submissions[subIndex].aiDetectionVerdict =
            result.aiDetectionVerdict;
          assignment.submissions[subIndex].aiDetectionReason =
            result.aiDetectionReason;
          assignment.submissions[subIndex].overallFeedback =
            result.overallFeedback;
          assignment.submissions[subIndex].checkedAt = new Date();
          await assignment.save();
          console.log("✅ AI check complete, score:", result.score);
        }

        return res.status(201).json({
          success: true,
          message: "Assignment submitted and checked by AI!",
          checked: true,
          result: {
            score: result.score,
            grade: result.grade,
            grammarFeedback: result.grammarFeedback,
            contentFeedback: result.contentFeedback,
            mistakes: result.mistakes,
            improvements: result.improvements,
            strengths: result.strengths,
            aiWrittenPercent: result.aiWrittenPercent,
            humanWrittenPercent: result.humanWrittenPercent,
            aiDetectionVerdict: result.aiDetectionVerdict,
            aiDetectionReason: result.aiDetectionReason,
            overallFeedback: result.overallFeedback,
          },
        });
      } catch (aiError) {
        console.error(
          "⚠️ AI check failed, submission saved without check:",
          aiError,
        );
        return res.status(201).json({
          success: true,
          message:
            "Assignment submitted successfully. AI check will be done shortly.",
          checked: false,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: "Assignment submitted successfully.",
      checked: false,
    });
  } catch (error) {
    console.error("❌ Error submitting assignment:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to submit assignment" });
  }
};

export const getMySubmission = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const userId = req.user.userId;
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment)
      return res
        .status(404)
        .json({ success: false, error: "Assignment not found" });

    const submission = assignment.submissions.find(
      (s) => s.submittedBy.toString() === userId,
    );

    res.json({
      success: true,
      submission: submission || null,
      assignmentTitle: assignment.title,
    });
  } catch (error) {
    console.error("❌ Error fetching submission:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch submission" });
  }
};

export const toggleAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment)
      return res
        .status(404)
        .json({ success: false, error: "Assignment not found" });

    assignment.isActive = !assignment.isActive;
    await assignment.save();
    res.json({
      success: true,
      message: `Assignment ${assignment.isActive ? "activated" : "deactivated"}`,
      isActive: assignment.isActive,
    });
  } catch (error) {
    console.error("❌ Error toggling assignment:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to update assignment" });
  }
};
