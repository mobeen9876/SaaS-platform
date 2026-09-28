/**
 * AI Assignment Checker Service
 * Checks assignments: scores, feedback, mistakes, AI detection
 * Uses hybrid detection: code-level pattern analysis + AI evaluation
 */

// ─── STEP 1: Local AI pattern detector ────────────────────────────────────────
const detectAiPatterns = (text) => {
  const lower = text.toLowerCase();
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);

  let aiScore = 0;
  const triggeredSignals = [];

  // 1. Classic AI filler phrases (very strong signal)
  const aiPhrases = [
    "it is important to note",
    "it is worth noting",
    "it is worth mentioning",
    "in today's world",
    "in the modern world",
    "in today's fast-paced",
    "plays a crucial role",
    "plays a vital role",
    "plays an important role",
    "delve into",
    "delve deeper",
    "let's delve",
    "in conclusion",
    "to summarize",
    "to conclude",
    "in summary",
    "furthermore",
    "moreover",
    "additionally",
    "subsequently",
    "it is essential to",
    "it is imperative to",
    "it is necessary to",
    "leverage",
    "utilize",
    "streamline",
    "robust solution",
    "comprehensive solution",
    "ensure that",
    "in order to ensure",
    "tailored to meet",
    "please do not hesitate",
    "i hope this helps",
    "feel free to",
    "as an ai",
    "as a language model",
    "i cannot provide",
    "cutting-edge",
    "state-of-the-art",
    "best practices",
    "holistic approach",
    "synergy",
    "paradigm shift",
    "in the realm of",
    "when it comes to",
    "it goes without saying",
    "needless to say",
    "it is undeniable",
    "there is no doubt",
    "first and foremost",
    "last but not least",
    "at the end of the day",
  ];

  let phraseCount = 0;
  aiPhrases.forEach((phrase) => {
    if (lower.includes(phrase)) {
      phraseCount++;
      triggeredSignals.push(`AI phrase: "${phrase}"`);
    }
  });
  if (phraseCount >= 5) {
    aiScore += 35;
  } else if (phraseCount >= 3) {
    aiScore += 22;
  } else if (phraseCount >= 1) {
    aiScore += 10;
  }

  // 2. No first-person voice
  const firstPerson = [
    "i ",
    "i've",
    "i'm",
    "i'd",
    "i'll",
    "my ",
    "me ",
    "myself",
    "in my experience",
    "i think",
    "i believe",
    "i found",
    "i noticed",
    "i worked",
    "i did",
  ];
  const hasFirstPerson = firstPerson.some((p) => lower.includes(p));
  if (!hasFirstPerson && text.length > 200) {
    aiScore += 20;
    triggeredSignals.push("No first-person voice detected");
  }

  // 3. Paragraph uniformity
  const paragraphs = text.split(/\n+/).filter((p) => p.trim().length > 30);
  if (paragraphs.length >= 3) {
    const lengths = paragraphs.map((p) => p.trim().length);
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance =
      lengths.reduce((sum, l) => sum + Math.pow(l - avg, 2), 0) /
      lengths.length;
    const coefficientOfVariation = Math.sqrt(variance) / avg;
    if (coefficientOfVariation < 0.15) {
      aiScore += 15;
      triggeredSignals.push("Paragraphs are suspiciously uniform in length");
    }
  }

  // 4. Sentence length uniformity
  if (sentences.length >= 5) {
    const sentLengths = sentences.map((s) => s.trim().split(/\s+/).length);
    const avgLen = sentLengths.reduce((a, b) => a + b, 0) / sentLengths.length;
    const sentVariance =
      sentLengths.reduce((sum, l) => sum + Math.pow(l - avgLen, 2), 0) /
      sentLengths.length;
    if (Math.sqrt(sentVariance) < 3 && avgLen > 15) {
      aiScore += 10;
      triggeredSignals.push("Sentence lengths are unnaturally uniform");
    }
  }

  // 5. No specific details
  const hasSpecificDetails =
    /\b\d{4}\b|\b\d+%|\b[A-Z][a-z]+ [A-Z][a-z]+\b|\$[\d,]+/.test(text);
  if (!hasSpecificDetails && text.length > 300) {
    aiScore += 10;
    triggeredSignals.push("No specific names, numbers, or dates found");
  }

  // 6. Passive voice overuse
  const passivePatterns =
    text.match(/\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi) || [];
  if (passivePatterns.length > 3) {
    aiScore += 8;
    triggeredSignals.push("Heavy passive voice usage");
  }

  // 7. Informal language = human signal
  const informalWords = [
    "gonna",
    "wanna",
    "kinda",
    "sorta",
    "yeah",
    "nope",
    "ok ",
    "okay",
    "btw",
    "tbh",
    "honestly",
    "literally",
    "basically",
    "actually",
    "pretty much",
  ];
  const hasInformal = informalWords.some((w) => lower.includes(w));
  if (hasInformal) {
    aiScore = Math.max(0, aiScore - 20);
    triggeredSignals.push("Informal language detected (human signal)");
  }

  // 8. Spelling mistakes = human signal
  const commonMistakes = [
    "teh ",
    "dont ",
    "cant ",
    "wont ",
    "im ",
    "youre ",
    "theyre ",
    "alot ",
  ];
  const hasMistakes = commonMistakes.some((m) => lower.includes(m));
  if (hasMistakes) {
    aiScore = Math.max(0, aiScore - 15);
    triggeredSignals.push("Natural errors detected (human signal)");
  }

  aiScore = Math.min(95, Math.max(0, aiScore));

  return {
    aiScore,
    triggeredSignals,
    phraseCount,
    hasFirstPerson,
    hasSpecificDetails,
  };
};

// ─── STEP 2: Main check function ──────────────────────────────────────────────
export const checkAssignment = async (
  assignment,
  submissionContent,
  apiKey,
  provider = "groq",
) => {
  const localDetection = detectAiPatterns(submissionContent);
  const localAiPercent = localDetection.aiScore;
  const signalsSummary = localDetection.triggeredSignals.join("; ");

  const prompt = `You are a strict work evaluator. Evaluate this submission for quality AND confirm the AI detection analysis already performed.

TASK TITLE: ${assignment.title}
TASK DESCRIPTION: ${assignment.description}
QUALITY CRITERIA: ${assignment.requirements}

SUBMISSION:
"""
${submissionContent}
"""

PRE-ANALYSIS RESULTS (from pattern detection):
- Local AI pattern score: ${localAiPercent}/100
- Signals found: ${signalsSummary || "none"}
- First-person voice present: ${localDetection.hasFirstPerson ? "YES (human signal)" : "NO (AI signal)"}
- Specific details (names/numbers/dates): ${localDetection.hasSpecificDetails ? "YES (human signal)" : "NO (AI signal)"}
- AI phrases detected: ${localDetection.phraseCount}

GRADING RUBRIC:
- 9-10: Exceptional, meets ALL criteria
- 7-8: Good, meets MOST criteria
- 5-6: Adequate, meets SOME criteria
- 3-4: Poor, major gaps
- 0-2: Fails criteria

AI DETECTION INSTRUCTION:
The pre-analysis found an AI pattern score of ${localAiPercent}/100.
Your final aiWrittenPercent MUST be within 15 points of ${localAiPercent}.
Do NOT ignore this pre-analysis. It is based on concrete pattern detection.

Verdict rules:
- 0-25% → "Likely Human Written"
- 26-50% → "Possibly AI Assisted"
- 51-80% → "Likely AI Generated"
- 81-100% → "Almost Certainly AI Generated"

Respond ONLY with valid JSON, no markdown:
{
  "score": <0-10>,
  "grade": <"A"|"B"|"C"|"D"|"F">,
  "grammarFeedback": "<specific grammar feedback>",
  "contentFeedback": "<specific content feedback>",
  "mistakes": ["<mistake 1>", "<mistake 2>", "<mistake 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "strengths": ["<strength 1>", "<strength 2>"],
  "aiWrittenPercent": <integer within 15 of ${localAiPercent}>,
  "humanWrittenPercent": <100 minus aiWrittenPercent>,
  "aiDetectionVerdict": "<verdict based on rules above>",
  "aiDetectionReason": "<2-3 sentences quoting specific phrases>",
  "overallFeedback": "<2-3 sentence summary>"
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
                  "You are a strict work evaluator. Always respond with valid JSON only. No markdown.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.1,
            max_tokens: 1500,
          }),
        },
      );
      if (!response.ok)
        throw new Error(
          `Groq error: ${response.status} ${await response.text()}`,
        );
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
            generationConfig: { temperature: 0.1, maxOutputTokens: 1500 },
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
                  "You are a strict work evaluator. Always respond with valid JSON only. No markdown.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.1,
            max_tokens: 1500,
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
    console.log("🤖 AI Check Response:", content);
    console.log(
      "📊 Local AI score:",
      localAiPercent,
      "| Signals:",
      signalsSummary,
    );
    const cleaned = content.replace(/```json|```/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in AI response");

    const result = JSON.parse(jsonMatch[0]);

    // Safety net: if Groq ignores pre-analysis, enforce local score
    if (Math.abs(result.aiWrittenPercent - localAiPercent) > 20) {
      console.warn("⚠️ Enforcing local detection score.");
      result.aiWrittenPercent = localAiPercent;
      result.humanWrittenPercent = 100 - localAiPercent;
      if (localAiPercent <= 25)
        result.aiDetectionVerdict = "Likely Human Written";
      else if (localAiPercent <= 50)
        result.aiDetectionVerdict = "Possibly AI Assisted";
      else if (localAiPercent <= 80)
        result.aiDetectionVerdict = "Likely AI Generated";
      else result.aiDetectionVerdict = "Almost Certainly AI Generated";
    }

    return result;
  } catch (err) {
    console.error("❌ AI assignment check error:", err);
    throw err;
  }
};
