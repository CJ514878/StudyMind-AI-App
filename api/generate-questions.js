const OpenAI = require("openai");

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

module.exports = async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            error: "Method not allowed"
        });
    }

    if (!process.env.OPENAI_API_KEY) {
        console.error("OPENAI_API_KEY is missing.");

        return res.status(500).json({
            success: false,
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
                ? body.type.trim().toLowerCase()
                : "";

        const requestType =
            typeof body.requestType === "string"
                ? body.requestType.trim().toLowerCase()
                : "";

        const mode =
            typeof body.mode === "string"
                ? body.mode.trim().toLowerCase()
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

        questionCount = Math.min(
            Math.max(Math.floor(questionCount), 1),
            20
        );

        /*
         * ======================================================
         * GAME / COMPUTER BATTLE DETECTION
         * ======================================================
         */

        const isComputerBattle =
            mode === "computer_battle" ||
            mode === "computer-battle" ||
            requestType === "computer_battle" ||
            requestType === "computer-battle" ||
            type === "computer_battle";

        const isGameMode =
            isComputerBattle ||
            mode === "game" ||
            mode === "game_mode" ||
            mode === "game-mode" ||
            type === "game_questions" ||
            type === "game" ||
            body.gameMode === true;

        /*
         * ======================================================
         * COMPUTER BATTLE
         * ======================================================
         */

        if (isGameMode) {

            if (!subject) {
                return res.status(400).json({
                    success: false,
                    error:
                        "A subject is required for Computer Battle."
                });
            }

            if (!topic) {
                return res.status(400).json({
                    success: false,
                    error:
                        "A topic is required for Computer Battle."
                });
            }

            const curriculum =
                typeof body.curriculum === "string" &&
                body.curriculum.trim()
                    ? body.curriculum.trim()
                    : "Nigerian Senior Secondary School curriculum";

            const curriculumTopics =
                Array.isArray(body.curriculumTopics)
                    ? body.curriculumTopics
                    : [];

            const battleNonce =
                typeof body.battleNonce === "string" &&
                body.battleNonce.trim()
                    ? body.battleNonce.trim()
                    : `${Date.now()}-${Math.random()
                        .toString(36)
                        .slice(2)}`;

            const curriculumContext =
                curriculumTopics.length
                    ? `
Relevant curriculum reference:

${curriculumTopics
    .map((item, index) =>
        `${index + 1}. ${String(item)}`
    )
    .join("\n")}
`
                    : "";

            /*
             * ==================================================
             * AI INSTRUCTIONS
             * ==================================================
             */

            const instructions = `
You are StudyMind AI's Computer Battle question generator.

Generate a completely NEW set of educational multiple-choice
questions for a Nigerian secondary-school student.

CURRICULUM:
${curriculum}

SELECTED SUBJECT:
${subject}

SELECTED TOPIC:
${topic}

DIFFICULTY:
${difficulty}

BATTLE ID:
${battleNonce}

${curriculumContext}

IMPORTANT:

The selected subject is authoritative.

The selected topic is authoritative.

Every question MUST belong to the selected subject.

Every question MUST primarily test the selected topic.

Never change the subject.

Never change the topic.

Never default to Mathematics.

If the selected subject is not Mathematics,
DO NOT generate Mathematics questions.

If the selected subject is Mathematics,
generate Mathematics questions specifically
about the selected topic.

Questions should be suitable for Nigerian
Senior Secondary School students.

Where appropriate, follow WAEC/NECO-style
academic expectations.

Generate exactly ${questionCount} questions.

Every question must have exactly four options.

There must be exactly one correct answer.

The answer must be a zero-based integer:

0 = first option
1 = second option
2 = third option
3 = fourth option

Distractors must be plausible but incorrect.

Do not duplicate questions.

Do not repeat question wording.

Do not create unrelated questions.

For calculation-based subjects:

- Verify formulas.
- Verify calculations.
- Verify numerical values.
- Verify units.

For science subjects:

- Ensure scientific facts are accurate.

For humanities:

- Make questions specifically relevant
  to the selected topic.

Keep explanations short.

RETURN ONLY VALID JSON.

Do NOT return Markdown.

Do NOT return code fences.

Do NOT return HTML.

Do NOT return explanations outside the JSON.

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
`;

            const input = `
Generate ${questionCount} NEW multiple-choice questions
for a StudyMind AI Computer Battle.

Subject: ${subject}

Topic: ${topic}

Difficulty: ${difficulty}

Curriculum: ${curriculum}

Create a fresh question set for this battle.

Do not reuse a previous question set.
`;

            console.log(
                `Generating ${questionCount} Computer Battle questions`
            );

            console.log(
                `Subject: ${subject}`
            );

            console.log(
                `Topic: ${topic}`
            );

            /*
             * ==================================================
             * OPENAI
             * ==================================================
             */

            const response =
                await client.responses.create({

                    model: "gpt-5-mini",

                    instructions,

                    input
                });

            const output =
                typeof response.output_text === "string"
                    ? response.output_text.trim()
                    : "";

            if (!output) {

                console.error(
                    "OpenAI returned an empty response."
                );

                return res.status(502).json({
                    success: false,
                    error:
                        "Computer Battle AI returned an empty response."
                });
            }

            /*
             * ==================================================
             * PARSE JSON
             * ==================================================
             */

            let parsed = null;

            try {

                parsed =
                    JSON.parse(output);

            } catch {

                let cleaned =
                    output
                        .replace(/^```json\s*/i, "")
                        .replace(/^```\s*/i, "")
                        .replace(/\s*```$/i, "")
                        .trim();

                try {

                    parsed =
                        JSON.parse(cleaned);

                } catch {

                    const start =
                        cleaned.indexOf("{");

                    const end =
                        cleaned.lastIndexOf("}");

                    if (
                        start !== -1 &&
                        end !== -1 &&
                        end > start
                    ) {

                        try {

                            parsed =
                                JSON.parse(
                                    cleaned.slice(
                                        start,
                                        end + 1
                                    )
                                );

                        } catch {
                            parsed = null;
                        }
                    }
                }
            }

            /*
             * ==================================================
             * VALIDATE RESPONSE
             * ==================================================
             */

            if (
                !parsed ||
                !Array.isArray(parsed.questions)
            ) {

                console.error(
                    "Invalid Computer Battle AI output:",
                    output
                );

                return res.status(502).json({
                    success: false,
                    error:
                        "Computer Battle AI returned invalid question data."
                });
            }

            /*
             * ==================================================
             * VALIDATE QUESTIONS
             * ==================================================
             */

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
                            typeof question.question !== "string" ||
                            !question.question.trim()
                        ) {
                            return false;
                        }

                        if (
                            !Array.isArray(question.options) ||
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
                            typeof question.explanation === "string"
                                ? question.explanation.trim()
                                : ""
                    }));

            /*
             * ==================================================
             * REMOVE DUPLICATES
             * ==================================================
             */

            const uniqueQuestions = [];

            const seen =
                new Set();

            for (
                const question
                of validQuestions
            ) {

                const normalized =
                    question.question
                        .toLowerCase()
                        .replace(/\s+/g, " ")
                        .trim();

                if (!seen.has(normalized)) {

                    seen.add(normalized);

                    uniqueQuestions.push(
                        question
                    );
                }
            }

            /*
             * ==================================================
             * QUESTION COUNT CHECK
             * ==================================================
             */

            if (
                uniqueQuestions.length <
                questionCount
            ) {

                console.error(
                    `Only ${uniqueQuestions.length} valid questions were generated.`
                );

                return res.status(502).json({

                    success: false,

                    error:
                        `Computer Battle generated only ${uniqueQuestions.length} valid questions out of ${questionCount}.`,

                    questions:
                        uniqueQuestions
                });
            }

            /*
             * ==================================================
             * SUCCESS
             * ==================================================
             */

            return res.status(200).json({

                success: true,

                type: "game_questions",

                mode: "computer_battle",

                requestType: "computer_battle",

                subject,

                topic,

                difficulty,

                questionCount,

                questions:
                    uniqueQuestions.slice(
                        0,
                        questionCount
                    )
            });
        }

        /*
         * ======================================================
         * NORMAL STUDYMIND AI
         * ======================================================
         */

        if (!message) {

            return res.status(400).json({
                success: false,
                error:
                    "Please provide a message."
            });
        }

        const normalInstructions = `
You are StudyMind AI, a professional educational assistant.

Help students:

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
- Easy for students to understand
- Professionally formatted

Use LaTeX for mathematical equations.

Use correct SI units.

Do not output HTML.

Do not invent information.

When solving calculations:

1. Show the formula.
2. Substitute the values.
3. Calculate the answer.
4. Include the correct unit.

When teaching a concept, explain it clearly rather
than simply giving an unexplained answer.
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

            success: true,

            reply:
                response.output_text || ""
        });

    } catch (error) {

        console.error(
            "StudyMind AI API error:",
            error
        );

        return res.status(500).json({

            success: false,

            error:
                "AI API error",

            details:
                error && error.message
                    ? error.message
                    : "Unknown error"
        });
    }
};
