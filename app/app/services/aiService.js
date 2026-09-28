import dotenv from "dotenv";

dotenv.config();

/**
 * Verify AI API Key (supports OpenAI, Gemini, and Groq)
 * @param {string} apiKey - The API key to verify
 * @param {string} provider - 'openai', 'gemini', or 'groq'
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
export const verifyAIApiKey = async (apiKey, provider = "openai") => {
  try {
    if (provider === "groq") {
      // Verify Groq API key by making a simple request
      const response = await fetch("https://api.groq.com/openai/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        return { valid: true };
      } else {
        let error;
        try {
          error = await response.json();
        } catch (e) {
          error = { message: "Invalid Groq API key" };
        }
        return {
          valid: false,
          error:
            error.error?.message || error.message || "Invalid Groq API key",
        };
      }
    } else if (provider === "gemini") {
      // Verify Gemini API key
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`,
        {
          method: "GET",
        },
      );

      if (response.ok) {
        return { valid: true };
      } else {
        const error = await response.json();
        return {
          valid: false,
          error: error.error?.message || "Invalid Gemini API key",
        };
      }
    } else {
      // Verify OpenAI API key
      const response = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        return { valid: true };
      } else {
        const error = await response.json();
        return {
          valid: false,
          error: error.error?.message || "Invalid OpenAI API key",
        };
      }
    }
  } catch (error) {
    console.error("❌ Error verifying AI API key:", error);
    return {
      valid: false,
      error:
        error.message ||
        "Failed to verify API key. Please check your internet connection and try again.",
    };
  }
};

/**
 * Analyze issue using AI (supports OpenAI, Gemini, and Groq)
 * @param {string} title - Issue title
 * @param {string} description - Issue description
 * @param {string} apiKey - AI API key
 * @param {string} provider - 'openai', 'gemini', or 'groq'
 * @returns {Promise<{issueType: string, priority: string, analysis: string}>}
 */
export const analyzeIssue = async (
  title,
  description,
  apiKey,
  provider = "openai",
) => {
  try {
    const prompt = `You are an IT support system analyzer. Analyze the following issue carefully and provide accurate categorization:

1. Issue Type - Choose the MOST APPROPRIATE category:
   - technical: General technical problems, system errors, bugs
   - maintenance: Routine maintenance, updates, patches
   - software: Application issues, software crashes, installation problems
   - hardware: Physical equipment problems, device failures
   - network: Connectivity issues, internet problems, network configuration
   - other: Issues that don't fit above categories

2. Priority Level - Assess based on IMPACT and URGENCY:
   - small: Minor issues, low impact, can wait, cosmetic problems
   - medium: Moderate impact, affects some users, should be addressed soon
   - large: Critical issues, high impact, affects many users, needs immediate attention

3. Analysis: Provide a brief technical analysis (2-3 sentences)

Issue Title: ${title}
Issue Description: ${description}

IMPORTANT: Analyze the actual content and severity. Don't default to "medium" - assess the real priority based on the description.

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "issueType": "type here",
  "priority": "priority here",
  "analysis": "brief analysis here"
}`;

    if (provider === "groq") {
      // Use Groq API (FREE & FAST)
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile", // Fast and accurate model
            messages: [
              {
                role: "system",
                content:
                  "You are an IT support system that analyzes issues and categorizes them accurately. Always respond with valid JSON only, no markdown formatting.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.1,
            max_tokens: 500,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Groq API error:", errorText);

        // Parse error for specific issues
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.message) {
            throw new Error(errorData.error.message);
          }
        } catch (e) {
          // If can't parse, use status code
          if (response.status === 429) {
            throw new Error("Rate limit exceeded. Please try again later.");
          } else if (response.status === 401 || response.status === 403) {
            throw new Error("Invalid or expired API key.");
          }
        }

        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      console.log("🤖 Groq AI Response:", content);

      // Parse JSON response
      let jsonMatch = content.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          const result = JSON.parse(jsonMatch[0]);
          console.log("✅ Parsed AI Analysis:", result);
          return {
            issueType: result.issueType || "other",
            priority: result.priority || "medium",
            analysis: result.analysis || "Issue analyzed by AI",
          };
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          // Try to extract values even from incomplete JSON
          const typeMatch = content.match(/"issueType"\s*:\s*"(\w+)"/);
          const priorityMatch = content.match(/"priority"\s*:\s*"(\w+)"/);
          const analysisMatch = content.match(/"analysis"\s*:\s*"([^"]+)"/);

          if (typeMatch || priorityMatch) {
            console.log("✅ Extracted from incomplete JSON");
            return {
              issueType: typeMatch ? typeMatch[1] : "other",
              priority: priorityMatch ? priorityMatch[1] : "medium",
              analysis: analysisMatch
                ? analysisMatch[1]
                : "Issue analyzed by AI",
            };
          }

          // If we can't extract anything, throw error
          throw new Error("Failed to parse AI response - invalid JSON format");
        }
      }

      // If no JSON found in response, throw error
      throw new Error("AI response did not contain valid JSON");
    } else if (provider === "gemini") {
      // Use Gemini API with Gemini 2.5 Flash (latest model)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 500,
            },
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API error:", errorText);

        // Parse error for specific issues
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.message) {
            throw new Error(errorData.error.message);
          }
        } catch (e) {
          // If can't parse, use status code
          if (response.status === 429) {
            throw new Error("Rate limit exceeded. Please try again later.");
          } else if (response.status === 401 || response.status === 403) {
            throw new Error("Invalid or expired API key.");
          }
        }

        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      console.log("🤖 Gemini AI Response:", content);

      // Parse JSON response - handle markdown code blocks and incomplete JSON
      let jsonMatch = content.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          const result = JSON.parse(jsonMatch[0]);
          console.log("✅ Parsed AI Analysis:", result);
          return {
            issueType: result.issueType || "other",
            priority: result.priority || "medium",
            analysis: result.analysis || "Issue analyzed by AI",
          };
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          // Try to extract values even from incomplete JSON
          const typeMatch = content.match(/"issueType"\s*:\s*"(\w+)"/);
          const priorityMatch = content.match(/"priority"\s*:\s*"(\w+)"/);
          const analysisMatch = content.match(/"analysis"\s*:\s*"([^"]+)"/);

          if (typeMatch || priorityMatch) {
            console.log("✅ Extracted from incomplete JSON");
            return {
              issueType: typeMatch ? typeMatch[1] : "other",
              priority: priorityMatch ? priorityMatch[1] : "medium",
              analysis: analysisMatch
                ? analysisMatch[1]
                : "Issue analyzed by AI",
            };
          }

          // If we can't extract anything, throw error
          throw new Error("Failed to parse AI response - invalid JSON format");
        }
      }

      // If no JSON found in response, throw error
      throw new Error("AI response did not contain valid JSON");
    } else {
      // Use OpenAI API
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content:
                  "You are an IT support system that analyzes issues and categorizes them accurately. Always respond with valid JSON only, no markdown formatting.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.1, // Lower temperature for more consistent results
            max_tokens: 500,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI API error:", errorText);

        // Parse error for specific issues
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.message) {
            throw new Error(errorData.error.message);
          }
        } catch (e) {
          // If can't parse, use status code
          if (response.status === 429) {
            throw new Error("Rate limit exceeded. Please try again later.");
          } else if (response.status === 401 || response.status === 403) {
            throw new Error("Invalid or expired API key.");
          }
        }

        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      console.log("🤖 OpenAI AI Response:", content);

      // Parse JSON response - handle both with and without markdown code blocks
      let jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const result = JSON.parse(jsonMatch[0]);
          console.log("✅ Parsed AI Analysis:", result);
          return {
            issueType: result.issueType || "other",
            priority: result.priority || "medium",
            analysis: result.analysis || "Issue analyzed by AI",
          };
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          // If we can't parse, throw error
          throw new Error("Failed to parse AI response - invalid JSON format");
        }
      }

      // If no JSON found in response, throw error
      throw new Error("AI response did not contain valid JSON");
    }
  } catch (error) {
    console.error("❌ Error analyzing issue with AI:", error);
    // Re-throw the error so it can be handled by the controller
    throw error;
  }
};

/**
 * Find best technician for the issue (supports OpenAI, Gemini, and Groq)
 * @param {Array} technicians - Available technicians
 * @param {string} issueType - Type of issue
 * @param {string} priority - Priority level
 * @param {string} apiKey - AI API key
 * @param {string} provider - 'openai', 'gemini', or 'groq'
 * @returns {Promise<{technicianId: string, reason: string}>}
 */
export const findBestTechnician = async (
  technicians,
  issueType,
  priority,
  apiKey,
  provider = "openai",
) => {
  try {
    // If no technicians available, return null
    if (!technicians || technicians.length === 0) {
      return {
        technicianId: null,
        reason: "No technicians available at the moment",
      };
    }

    // Filter technicians by specialization matching the issue type
    const specializedTechs = technicians.filter(
      (tech) =>
        tech.specializations.includes(issueType) ||
        tech.specializations.includes("other"),
    );

    // If no specialized technicians, use all available
    const candidateTechs =
      specializedTechs.length > 0 ? specializedTechs : technicians;

    // Sort by workload (least busy first) and rating (highest first)
    const sortedTechs = candidateTechs.sort((a, b) => {
      // First priority: workload (lower is better)
      const workloadDiff = a.currentIssuesCount - b.currentIssuesCount;
      if (workloadDiff !== 0) return workloadDiff;

      // Second priority: rating (higher is better)
      return b.rating - a.rating;
    });

    // Take top 5 candidates for AI evaluation
    const topCandidates = sortedTechs.slice(0, Math.min(5, sortedTechs.length));

    // Build detailed technician info for AI
    const techInfo = topCandidates
      .map(
        (tech, index) =>
          `${index + 1}. ${tech.name}
   - Specializations: ${tech.specializations.join(", ")}
   - Current Active Issues: ${tech.currentIssuesCount}
   - Total Resolved: ${tech.totalIssuesResolved}
   - Performance Rating: ${tech.rating}/5.0
   - Availability: ${tech.isAvailable ? "Available" : "Busy"}`,
      )
      .join("\n\n");

    const prompt = `You are an intelligent IT support assignment system. Analyze the issue details and technician profiles to select the BEST technician.

ISSUE DETAILS:
- Type: ${issueType}
- Priority: ${priority}

AVAILABLE TECHNICIANS:
${techInfo}

SELECTION CRITERIA (in order of importance):
1. Specialization match with issue type
2. Current workload (prefer less busy technicians)
3. Performance rating and past success
4. Availability status

Select the technician number (1-${topCandidates.length}) who is BEST suited for this issue and explain your reasoning in one clear sentence.

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "technicianNumber": <number between 1 and ${topCandidates.length}>,
  "reason": "Clear explanation of why this technician is the best choice"
}`;

    if (provider === "groq") {
      // Use Groq API (FREE & FAST)
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content:
                  "You are an IT support assignment system that intelligently matches issues to technicians. Always respond with valid JSON only, no markdown formatting.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.2,
            max_tokens: 200,
          }),
        },
      );

      if (!response.ok) {
        console.error(
          "Groq API error for technician assignment:",
          await response.text(),
        );
        const bestTech = sortedTechs[0];
        return {
          technicianId: bestTech.userId.toString(),
          reason: `Auto-assigned to ${bestTech.name} (least busy with ${bestTech.currentIssuesCount} current issues, rating: ${bestTech.rating}/5)`,
        };
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      console.log("🤖 Groq Technician Assignment Response:", content);

      const jsonMatch = content.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          const result = JSON.parse(jsonMatch[0]);
          const selectedIndex = Math.max(
            0,
            Math.min(
              topCandidates.length - 1,
              (result.technicianNumber || 1) - 1,
            ),
          );
          const selectedTech = topCandidates[selectedIndex];

          console.log(
            `✅ AI Selected Technician: ${selectedTech.name} (Index: ${selectedIndex})`,
          );

          return {
            technicianId: selectedTech.userId.toString(),
            reason:
              result.reason ||
              `Assigned to ${selectedTech.name} based on AI analysis`,
          };
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
        }
      }

      const bestTech = sortedTechs[0];
      return {
        technicianId: bestTech.userId.toString(),
        reason: `Assigned to ${bestTech.name} based on availability and expertise`,
      };
    } else if (provider === "gemini") {
      // Use Gemini API with Gemini 2.5 Flash (latest model)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 200,
            },
          }),
        },
      );

      if (!response.ok) {
        console.error(
          "Gemini API error for technician assignment:",
          await response.text(),
        );
        // Fallback: assign to least busy technician
        const bestTech = sortedTechs[0];
        return {
          technicianId: bestTech.userId.toString(),
          reason: `Auto-assigned to ${bestTech.name} (least busy with ${bestTech.currentIssuesCount} current issues, rating: ${bestTech.rating}/5)`,
        };
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      console.log("🤖 Gemini Technician Assignment Response:", content);

      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const result = JSON.parse(jsonMatch[0]);
          const selectedIndex = Math.max(
            0,
            Math.min(
              topCandidates.length - 1,
              (result.technicianNumber || 1) - 1,
            ),
          );
          const selectedTech = topCandidates[selectedIndex];

          console.log(
            `✅ AI Selected Technician: ${selectedTech.name} (Index: ${selectedIndex})`,
          );

          return {
            technicianId: selectedTech.userId.toString(),
            reason:
              result.reason ||
              `Assigned to ${selectedTech.name} based on AI analysis`,
          };
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
        }
      }

      // Fallback
      const bestTech = sortedTechs[0];
      return {
        technicianId: bestTech.userId.toString(),
        reason: `Assigned to ${bestTech.name} based on availability and expertise`,
      };
    } else {
      // Use OpenAI API
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content:
                  "You are an IT support assignment system that intelligently matches issues to technicians. Always respond with valid JSON only, no markdown formatting.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.2,
            max_tokens: 200,
          }),
        },
      );

      if (!response.ok) {
        console.error(
          "OpenAI API error for technician assignment:",
          await response.text(),
        );
        // Fallback: assign to least busy technician
        const bestTech = sortedTechs[0];
        return {
          technicianId: bestTech.userId.toString(),
          reason: `Auto-assigned to ${bestTech.name} (least busy with ${bestTech.currentIssuesCount} current issues, rating: ${bestTech.rating}/5)`,
        };
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      console.log("🤖 OpenAI Technician Assignment Response:", content);

      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const result = JSON.parse(jsonMatch[0]);
          const selectedIndex = Math.max(
            0,
            Math.min(
              topCandidates.length - 1,
              (result.technicianNumber || 1) - 1,
            ),
          );
          const selectedTech = topCandidates[selectedIndex];

          console.log(
            `✅ AI Selected Technician: ${selectedTech.name} (Index: ${selectedIndex})`,
          );

          return {
            technicianId: selectedTech.userId.toString(),
            reason:
              result.reason ||
              `Assigned to ${selectedTech.name} based on AI analysis`,
          };
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
        }
      }

      // Fallback
      const bestTech = sortedTechs[0];
      return {
        technicianId: bestTech.userId.toString(),
        reason: `Assigned to ${bestTech.name} based on availability and expertise`,
      };
    }
  } catch (error) {
    console.error("❌ Error finding best technician:", error);

    // Fallback: assign to least busy available technician
    if (technicians && technicians.length > 0) {
      const sortedByWorkload = [...technicians].sort((a, b) => {
        // Sort by workload first
        const workloadDiff = a.currentIssuesCount - b.currentIssuesCount;
        if (workloadDiff !== 0) return workloadDiff;
        // Then by rating
        return b.rating - a.rating;
      });
      const bestTech = sortedByWorkload[0];

      return {
        technicianId: bestTech.userId.toString(),
        reason: `Auto-assigned to ${bestTech.name} (${bestTech.currentIssuesCount} current issues, rating: ${bestTech.rating}/5)`,
      };
    }

    return {
      technicianId: null,
      reason: "No technicians available",
    };
  }
};

/**
 * Generate AI Performance Report for a technician
 * @param {Object} stats - Technician stats
 * @param {string} apiKey - AI API key
 * @param {string} provider - 'openai', 'gemini', or 'groq'
 */
export const generatePerformanceReport = async (
  stats,
  apiKey,
  provider = "groq",
) => {
  const resolutionRate =
    stats.totalAssigned > 0
      ? Math.round((stats.totalResolved / stats.totalAssigned) * 100)
      : 0;

  const prompt = `You are a professional HR and performance analytics system. Analyze this technician's performance data and generate a detailed report.

TECHNICIAN DATA:
- Name: ${stats.name}
- Specializations: ${stats.specializations.join(", ")}
- Current Rating: ${stats.rating}/5.0
- Total Issues Assigned: ${stats.totalAssigned}
- Total Issues Resolved: ${stats.totalResolved}
- Resolution Rate: ${resolutionRate}%
- Currently Active/Pending: ${stats.currentPending}
- Average Resolution Time: ${stats.avgResolutionHours} hours per issue
- Issue Type Breakdown: ${JSON.stringify(stats.typeBreakdown)}
- Priority Breakdown: ${JSON.stringify(stats.priorityBreakdown)}
- Recent Resolved Issues: ${JSON.stringify(stats.recentResolved)}

Generate a professional performance report. Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "overallScore": <number 1-10 based on rating, resolution rate, and speed>,
  "performanceLevel": <"Excellent" | "Good" | "Average" | "Needs Improvement">,
  "executiveSummary": "<2-3 sentence professional summary of overall performance>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "areasForImprovement": ["<area 1>", "<area 2>"],
  "productivityAnalysis": "<2 sentences analyzing task completion rate and speed>",
  "specialistInsight": "<1-2 sentences about their best performing issue type>",
  "recommendation": "<1 concrete actionable recommendation>",
  "trend": <"Improving" | "Stable" | "Declining">
}`;

  const makeRequest = async () => {
    if (provider === "groq") {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content:
                  "You are a professional HR analytics system. Always respond with valid JSON only, no markdown.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.3,
            max_tokens: 800,
          }),
        },
      );
      if (!response.ok) throw new Error(`Groq error: ${response.status}`);
      const data = await response.json();
      return data.choices[0].message.content;
    } else if (provider === "gemini") {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 800 },
          }),
        },
      );
      if (!response.ok) throw new Error(`Gemini error: ${response.status}`);
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content:
                  "You are a professional HR analytics system. Always respond with valid JSON only, no markdown.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.3,
            max_tokens: 800,
          }),
        },
      );
      if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);
      const data = await response.json();
      return data.choices[0].message.content;
    }
  };

  try {
    const content = await makeRequest();
    console.log("🤖 AI Report Response:", content);
    const cleaned = content.replace(/```json|```/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in AI response");
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("❌ AI report generation error:", err);
    const resolutionRate =
      stats.totalAssigned > 0
        ? Math.round((stats.totalResolved / stats.totalAssigned) * 100)
        : 0;
    return {
      overallScore: Math.round(stats.rating * 2),
      performanceLevel:
        stats.rating >= 4
          ? "Good"
          : stats.rating >= 3
            ? "Average"
            : "Needs Improvement",
      executiveSummary: `${stats.name} has handled ${stats.totalAssigned} issues with a ${resolutionRate}% resolution rate and a ${stats.rating}/5 rating.`,
      strengths: [
        `${stats.specializations.join(", ")} specialization`,
        `${stats.totalResolved} issues resolved`,
      ],
      areasForImprovement: ["Continue performance improvement"],
      productivityAnalysis: `Resolved ${stats.totalResolved} of ${stats.totalAssigned} issues. Avg resolution time: ${stats.avgResolutionHours} hours.`,
      specialistInsight: `Primary specializations: ${stats.specializations.join(", ")}.`,
      recommendation:
        "Continue regular performance reviews and skill development.",
      trend: "Stable",
    };
  }
};
