export type AIService = "openai" | "gemini"

export interface AISettings {
  currentService: AIService
  prompts: {
    openai: string
    gemini: string
  }
  models: {
    openai: string
    gemini: string
  }
}

const OPENAI_PROMPT = `You are an intelligent assistant that helps evaluate quiz answers. A user has submitted answers to a quiz, and you are to compare them with the correct answers.

Rules:
- Accept minor spelling or grammar mistakes.
- Accept answers even if they are lowercase or uppercase.
- Accept answers if they are semantically equivalent or meaningfully close.
- If the answer is clearly incorrect, mark it as wrong.

For each question, output EXACTLY this format:

Question: <question>
Correct Answer: <system_answer>
User Answer: <user_answer>
Result: Correct / Incorrect
Justification: <short explanation>

Here is the list:

{QUESTIONS_PLACEHOLDER}`

const GEMINI_PROMPT = `You are an intelligent assistant that helps evaluate quiz answers. A user has submitted answers to a quiz, and you are to compare them with the correct answers.

Rules:
- Accept minor spelling or grammar mistakes.
- Accept answers even if they are lowercase or uppercase.
- Accept answers if they are semantically equivalent or meaningfully close.
- If the answer is clearly incorrect, mark it as wrong.
- Write all justifications in Serbian language.

CRITICAL: You MUST follow this EXACT format for EACH question. Do NOT mix questions together:

===QUESTION 1===
Question: [copy the exact question text]
Correct Answer: [copy the exact correct answer]
User Answer: [copy the exact user answer]
Result: Correct / Incorrect
Justification: [short explanation in Serbian]

===QUESTION 2===
Question: [copy the exact question text]
Correct Answer: [copy the exact correct answer]
User Answer: [copy the exact user answer]
Result: Correct / Incorrect
Justification: [short explanation in Serbian]

Continue this pattern for ALL questions. Each question must be separated by ===QUESTION X=== where X is the question number.

Here is the list:

{QUESTIONS_PLACEHOLDER}`

const DEFAULT_SETTINGS: AISettings = {
  currentService: "openai",
  prompts: {
    openai: OPENAI_PROMPT,
    gemini: GEMINI_PROMPT,
  },
  models: {
    openai: "gpt-4o-mini",
    gemini: "gemini-2.0-flash-lite",
  },
}

export function getAISettings(): AISettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS

  try {
    const stored = localStorage.getItem("ai-settings")
    if (stored) {
      const parsed = JSON.parse(stored)
      // Merge with defaults to ensure all properties exist
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        prompts: {
          ...DEFAULT_SETTINGS.prompts,
          ...parsed.prompts,
        },
        models: {
          ...DEFAULT_SETTINGS.models,
          ...parsed.models,
        },
      }
    }
  } catch (error) {
    console.error("Error loading AI settings:", error)
  }

  return DEFAULT_SETTINGS
}

export function saveAISettings(settings: AISettings): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem("ai-settings", JSON.stringify(settings))
  } catch (error) {
    console.error("Error saving AI settings:", error)
  }
}

export function formatPrompt(
  prompt: string,
  questions: Array<{ question: string; correctAnswer: string; userAnswer: string }>,
): string {
  const questionsList = questions
    .map(
      (q, index) =>
        `${index + 1}. Question: ${q.question}
   Correct Answer: ${q.correctAnswer}
   User Answer: ${q.userAnswer || "(empty)"}`,
    )
    .join("\n\n")

  return prompt.replace("{QUESTIONS_PLACEHOLDER}", questionsList)
}
