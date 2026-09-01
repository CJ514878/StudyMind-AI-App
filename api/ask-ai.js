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

        // =====================================================
        // READ REQUEST DATA
        // =====================================================

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
            typeof body.difficulty === "string" &&
            body.difficulty.trim()
                ? body.difficulty.trim()
                : "mixed";

        // Support BOTH names used by different versions
        // of the frontend.
        const requestedQuestionCount =
            body.numberOfQuestions ??
            body.questionCount ??
            body.questions ??
            10;

        let questionCount =
            Number(requestedQuestionCount);

        if (!Number.isFinite(questionCount)) {
            questionCount = 10;
        }

        questionCount =
            Math.min(
                Math.max(Math.floor(questionCount), 1),
                20
            );

        // =====================================================
        // DETECT GAME MODE
        // =====================================================

        const isGameMode =
            mode === "game" ||
            type === "game_questions" ||
            type === "game" ||
            body.gameMode === true;

        // =====================================================
        // GAME MODE
        // =====================================================

        if (isGameMode) {

            // -------------------------------------------------
            // SUBJECT REQUIRED
            // -------------------------------------------------

            if (!subject) {

                return res.status(400).json({
                    error:
                        "A subject is required for Game Mode."
                });
            }

            // -------------------------------------------------
            // TOPIC REQUIRED
            // -------------------------------------------------

            if (!topic) {

                return res.status(400).json({
                    error:
                        "A topic is required for Game Mode."
                });
            }

            // -------------------------------------------------
            // CREATE GAME PROMPT
            // -------------------------------------------------

            const gameInstructions = `
You are StudyMind AI Game Mode.

You create educational multiple-choice questions
for secondary-school students following the Nigerian
secondary-school curriculum.

The battle information is:

Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}

Create exactly ${questionCount} high-quality multiple-choice
questions specifically about the selected subject and topic.

IMPORTANT OUTPUT RULE:

Return ONLY valid JSON.

Do NOT return:

- Markdown
- Code fences
- Explanations outside the JSON
- Introductory text
- Closing text
- HTML

The response MUST have exactly this structure:

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
      "explanation": "Short explanation."
    }
  ]
}

RULES:

1. Return exactly ${questionCount} questions.

2. Every question must have exactly four options.

3. Every option must be a non-empty string.

4. "answer" MUST be a zero-based integer.

5. 0 means the first option is correct.

6. 1 means the second option is correct.

7. 2 means the third option is correct.

8. 3 means the fourth option is correct.

9. Every answer must be factually correct.

10. Every question must genuinely test the selected topic.

11. The selected topic must be the primary focus of every question.

12. Do not create unrelated questions.

13. Do not duplicate questions.

14. Make the questions appropriate for Nigerian secondary-school students.

15. Where appropriate, follow WAEC/NECO-style questioning.

16. Do not assume the subject is Mathematics.

17. For Mathematics, Physics, Chemistry and other calculation-based
subjects, ensure calculations, formulas, values and units are correct.

18. For Biology, Geography, Economics, Government, History,
Civic Education, CRS, IRS, English Language, Literature and
other subjects, make the questions specifically relevant to
the selected topic.

19. Distractor options should be plausible but incorrect.

20. Do not place the correct answer directly inside the question.

21. Keep explanations short.

22. Do not use HTML.

23. Do not use unnecessary LaTeX.

24. Do not include any text outside the JSON object.

25. The final response must contain exactly ${questionCount}
valid question objects.
`;

            // -------------------------------------------------
            // CREATE USER INPUT
            // -------------------------------------------------

            const gameMessage = `
Generate ${questionCount} multiple-choice questions.

Subject: ${subject}

Topic: ${topic}

Difficulty: ${difficulty}

The questions must be suitable for a StudyMind AI
educational battle.
`;

            console.log(
                `Generating ${questionCount} Game Mode questions for ${subject} - ${topic}`
            );

            // -------------------------------------------------
            // OPENAI REQUEST
            // -------------------------------------------------

            const response =
                await client.responses.create({

                    model: "gpt-5-mini",

                    instructions:
                        gameInstructions,

                    input:
                        gameMessage
                });

            const output =
                response.output_text || "";

            console.log(
                "Game Mode AI response received."
            );

            // =================================================
            // PARSE JSON
            // =================================================

            let parsed = null;

            try {

                parsed =
                    JSON.parse(
                        output.trim()
                    );

            } catch (parseError) {

                console.error(
                    "Direct JSON parsing failed."
                );

                // ------------------------------------------------
                // RECOVER JSON OBJECT FROM SURROUNDING TEXT
                // ------------------------------------------------

                const start =
                    output.indexOf("{");

                const end =
                    output.lastIndexOf("}");

                if (
                    start !== -1 &&
                    end !== -1 &&
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

                    } catch (recoveryError) {

                        parsed = null;
                    }
                }
            }

            // =================================================
            // VALIDATE AI RESPONSE
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
                        "Game Mode AI returned invalid question data."
                });
            }

            // =================================================
            // VALIDATE EACH QUESTION
            // =================================================

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
                            "string" ||
                            !question.question.trim()
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
                                    typeof option === "string" &&
                                    option.trim().length > 0
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

            // =================================================
            // CHECK QUESTION COUNT
            // =================================================

            if (
                validQuestions.length < questionCount
            ) {

                console.error(
                    "Insufficient valid Game Mode questions:",
                    validQuestions.length,
                    "of",
                    questionCount
                );

                return res.status(502).json({

                    error:
                        `Game Mode generated only ${validQuestions.length} valid questions out of ${questionCount}.`,

                    questions:
                        validQuestions
                });
            }

            // =================================================
            // RETURN GAME QUESTIONS
            // =================================================

            return res.status(200).json({

                success: true,

                type: "game_questions",

                subject,

                topic,

                difficulty,

                questions:
                    validQuestions.slice(
                        0,
                        questionCount
                    )
            });
        }

        // =====================================================
        // NORMAL STUDYMIND AI
        // =====================================================

        if (!message) {

            return res.status(400).json({
                error:
                    "Please provide a message."
            });
        }

        const normalInstructions = `
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
`;

        const response =
            await client.responses.create({

                model: "gpt-5-mini",

                instructions:
                    normalInstructions,

                input:
                    message
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
