const OpenAI = require("openai");

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

module.exports = async function handler(req, res) {

    // =========================================================
    // METHOD CHECK
    // =========================================================

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    // =========================================================
    // API KEY CHECK
    // =========================================================

    if (!process.env.OPENAI_API_KEY) {

        console.error("OPENAI_API_KEY is missing.");

        return res.status(500).json({
            error: "OPENAI_API_KEY is not configured on Vercel."
        });
    }

    try {

        const body = req.body || {};

        const message =
            typeof body.message === "string"
                ? body.message.trim()
                : "";

        const type =
            typeof body.type === "string"
                ? body.type
                : "";

        const mode =
            typeof body.mode === "string"
                ? body.mode
                : "";

        const subject =
            typeof body.subject === "string"
                ? body.subject.trim()
                : "";

        const topic =
            typeof body.topic === "string"
                ? body.topic.trim()
                : "";

        const difficulty =
            typeof body.difficulty === "string"
                ? body.difficulty
                : "mixed";

        const questionCount =
            Number(body.questionCount) || 10;

        // =====================================================
        // VALIDATE MESSAGE
        // =====================================================

        if (!message) {

            return res.status(400).json({
                error: "Please provide a message."
            });
        }

        // =====================================================
        // GAME MODE
        // =====================================================

        const isGameMode =
            mode === "game" ||
            type === "game_questions";

        if (isGameMode) {

            const count =
                Math.min(
                    Math.max(questionCount, 1),
                    20
                );

            if (!subject) {

                return res.status(400).json({
                    error: "A subject is required for Game Mode."
                });
            }

            if (!topic) {

                return res.status(400).json({
                    error: "A topic is required for Game Mode."
                });
            }

            const gameInstructions = `
You are StudyMind AI Game Mode.

You create educational multiple-choice questions
for students following the Nigerian secondary-school
curriculum.

The request is for:

Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}

Create exactly ${count} high-quality multiple-choice
questions specifically about the stated subject and topic.

IMPORTANT:

Return ONLY valid JSON.

Do NOT return:
- Markdown
- Code fences
- Explanations outside the JSON
- Introductory text
- Closing text

The JSON MUST have exactly this structure:

{
  "questions": [
    {
      "question": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "answer": 0,
      "explanation": "Short explanation of the correct answer."
    }
  ]
}

RULES:

1. Return exactly ${count} questions.

2. Every question must have exactly four options.

3. The options must be strings.

4. "answer" MUST be a zero-based number:
   0 = first option
   1 = second option
   2 = third option
   3 = fourth option

5. The answer must be factually correct.

6. Questions must genuinely test the selected topic.

7. Do not create questions about unrelated subjects.

8. Avoid duplicate questions.

9. Make the questions appropriate for Nigerian secondary-school students.

10. Where relevant, follow Nigerian examination conventions such as WAEC/NECO-style questioning.

11. Do not assume that every subject is Mathematics.

12. For Mathematics, Physics, Chemistry and other calculation-based subjects,
    use correct formulas, values and units.

13. For English Language, Literature, Government, Economics, Biology,
    Geography, History, CRS, IRS, Civic Education and other humanities
    subjects, ensure questions match the selected topic.

14. For practical/science subjects, questions should remain academically
    accurate and suitable for the student's level.

15. Keep explanations short.

16. Do not include HTML.

17. Do not include LaTeX unless it is genuinely necessary.

18. Do not put the correct answer directly into the question.

19. Make distractor options plausible.

20. The topic must be the primary focus of every question.

Return ONLY the JSON object.
`;

            const response =
                await client.responses.create({

                    model: "gpt-5-mini",

                    instructions:
                        gameInstructions,

                    input: message

                });

            const output =
                response.output_text || "";

            // =================================================
            // PARSE AI JSON
            // =================================================

            let parsed = null;

            try {

                parsed =
                    JSON.parse(output.trim());

            } catch (_) {

                // Try to recover JSON if the model accidentally
                // included surrounding text.

                const start =
                    output.indexOf("{");

                const end =
                    output.lastIndexOf("}");

                if (
                    start !== -1 &&
                    end > start
                ) {

                    try {

                        parsed =
                            JSON.parse(
                                output.slice(
                                    start,
                                    end + 1
                                )
                            );

                    } catch (_) {
                        parsed = null;
                    }
                }
            }

            // =================================================
            // VALIDATE RESULT
            // =================================================

            if (
                !parsed ||
                !Array.isArray(parsed.questions)
            ) {

                console.error(
                    "Invalid Game Mode AI output:",
                    output
                );

                return res.status(502).json({
                    error:
                        "Game Mode AI returned invalid question data.",
                    reply: output
                });
            }

            const validQuestions =
                parsed.questions
                    .filter(question => {

                        if (
                            !question ||
                            typeof question !== "object"
                        ) {
                            return false;
                        }

                        if (
                            typeof question.question !==
                            "string"
                        ) {
                            return false;
                        }

                        if (
                            !Array.isArray(
                                question.options
                            )
                        ) {
                            return false;
                        }

                        if (
                            question.options.length !== 4
                        ) {
                            return false;
                        }

                        if (
                            !question.options.every(
                                option =>
                                    typeof option ===
                                    "string" &&
                                    option.trim()
                            )
                        ) {
                            return false;
                        }

                        const answer =
                            Number(question.answer);

                        if (
                            !Number.isInteger(answer) ||
                            answer < 0 ||
                            answer > 3
                        ) {
                            return false;
                        }

                        return true;
                    })
                    .map(question => ({
                        question:
                            question.question.trim(),

                        options:
                            question.options.map(
                                option =>
                                    option.trim()
                            ),

                        answer:
                            Number(question.answer),

                        explanation:
                            typeof question.explanation ===
                            "string"
                                ? question.explanation.trim()
                                : ""
                    }));

            if (
                validQuestions.length < count
            ) {

                console.error(
                    "Game Mode returned insufficient valid questions:",
                    validQuestions.length,
                    "of",
                    count
                );

                return res.status(502).json({
                    error:
                        `Game Mode generated only ${validQuestions.length} valid questions out of ${count}.`,
                    questions:
                        validQuestions
                });
            }

            return res.status(200).json({

                success: true,

                type: "game_questions",

                subject,

                topic,

                difficulty,

                questions:
                    validQuestions.slice(0, count)

            });
        }

        // =====================================================
        // NORMAL STUDYMIND AI
        // =====================================================

        const response =
            await client.responses.create({

                model: "gpt-5-mini",

                instructions: `
You are StudyMind AI, a professional educational assistant.

Your job is to help students:

- Understand school subjects
- Prepare for exams
- Solve academic problems
- Organize study plans
- Manage study time
- Understand difficult concepts
- Review topics
- Improve learning

Give answers that are:

- Clear
- Accurate
- Concise but helpful
- Easy for a student to understand
- Professionally formatted

FORMATTING RULES:

1. Use normal paragraphs for explanations.

2. Use bullet points only when they genuinely improve readability.

3. NEVER create an empty bullet point.

4. NEVER put a bullet point by itself immediately before a mathematical equation.

5. Put important mathematical equations on their own line.

6. Use LaTeX for mathematical equations.

7. Use inline LaTeX when an equation appears inside a sentence.

8. Always use correct SI units.

9. When writing units inside mathematical equations,
use LaTeX formatting where appropriate.

10. Do not use backticks around normal units or numbers.

11. Use bold text sparingly for important terms.

12. Do not output HTML.

13. Do not explain these formatting rules.

14. Do not add unnecessary introductions.

15. When explaining a concept, structure the answer naturally:

Explanation → important points → formula/example when useful.

16. When solving a calculation:

- Show the formula.
- Substitute the values.
- Calculate the answer.
- Include the correct unit.

Use the student's study information when it is provided.

Do not invent information.

If the student asks a simple question such as "1+1",
answer it directly.

If the student asks for help understanding something,
teach it rather than simply giving an unexplained answer.
`,

                input: message

            });

        return res.status(200).json({

            reply:
                response.output_text || ""

        });

    } catch (error) {

        console.error(
            "StudyMind AI API error:",
            error
        );

        return res.status(500).json({

            error:
                "AI API error",

            details:
                error.message ||
                "Unknown error"

        });
    }
};

