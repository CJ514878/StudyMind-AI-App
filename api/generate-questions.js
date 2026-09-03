const OpenAI = require("openai");

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

module.exports = async function handler(req, res) {

    /*
     * =========================================================
     * METHOD CHECK
     * =========================================================
     */

    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            error: "Method not allowed"
        });
    }

    /*
     * =========================================================
     * API KEY CHECK
     * =========================================================
     */

    if (!process.env.OPENAI_API_KEY) {

        console.error(
            "OPENAI_API_KEY is missing."
        );

        return res.status(500).json({
            success: false,
            error:
                "OPENAI_API_KEY is not configured on Vercel."
        });
    }

    try {

        /*
         * =====================================================
         * READ REQUEST
         * =====================================================
         */

        const body = req.body || {};

        const subject =
            typeof body.subject === "string"
                ? body.subject.trim()
                : "";

        const topic =
            typeof body.topic === "string"
                ? body.topic.trim()
                : "";

        const curriculum =
            typeof body.curriculum === "string" &&
            body.curriculum.trim()
                ? body.curriculum.trim()
                : "Nigerian Senior Secondary School curriculum";

        const difficulty =
            typeof body.difficulty === "string" &&
            body.difficulty.trim()
                ? body.difficulty.trim()
                : "mixed";

        /*
         * =====================================================
         * QUESTION COUNT
         *
         * Dashboard currently sends:
         * count
         * numberOfQuestions
         * questionCount
         *
         * We support all three.
         * =====================================================
         */

        const requestedQuestionCount =
            body.numberOfQuestions ??
            body.questionCount ??
            body.count ??
            5;

        let questionCount =
            Number(requestedQuestionCount);

        if (!Number.isFinite(questionCount)) {
            questionCount = 5;
        }

        questionCount = Math.min(
            Math.max(
                Math.floor(questionCount),
                1
            ),
            20
        );

        /*
         * =====================================================
         * REQUIRED DATA
         * =====================================================
         */

        if (!subject) {

            return res.status(400).json({
                success: false,
                error:
                    "A subject is required to generate questions."
            });
        }

        if (!topic) {

            return res.status(400).json({
                success: false,
                error:
                    "A topic is required to generate questions."
            });
        }

        /*
         * =====================================================
         * OPTIONAL CURRICULUM TOPICS
         * =====================================================
         */

        const curriculumTopics =
            Array.isArray(body.curriculumTopics)
                ? body.curriculumTopics
                : [];

        const curriculumContext =
            curriculumTopics.length > 0
                ? `
Relevant curriculum topics:

${curriculumTopics
    .map((item, index) =>
        `${index + 1}. ${String(item)}`
    )
    .join("\n")}
`
                : "";

        /*
         * =====================================================
         * UNIQUE REQUEST ID
         *
         * Helps prevent accidentally returning a cached-looking
         * question set.
         * =====================================================
         */

        const requestNonce =
            `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}`;

        /*
         * =====================================================
         * AI INSTRUCTIONS
         * =====================================================
         */

        const instructions = `
You are StudyMind AI's topic knowledge-check
question generator.

You generate educational multiple-choice questions
for Nigerian Senior Secondary School students.

The selected subject and topic are AUTHORITATIVE.

SELECTED SUBJECT:
${subject}

SELECTED TOPIC:
${topic}

CURRICULUM:
${curriculum}

DIFFICULTY:
${difficulty}

REQUEST ID:
${requestNonce}

${curriculumContext}

IMPORTANT SUBJECT RULES:

1. Every question MUST belong to the selected subject.

2. Every question MUST primarily test the selected topic.

3. NEVER change the subject.

4. NEVER change the topic.

5. NEVER default to Mathematics.

6. If the selected subject is NOT Mathematics,
   do NOT create Mathematics questions.

7. If the selected subject is Mathematics,
   create questions specifically about the selected
   Mathematics topic.

8. Do not create questions from another subject
   merely because the topic sounds similar.

9. Do not invent a different topic.

10. Questions must be appropriate for Nigerian
    Senior Secondary School students.

11. Where appropriate, follow WAEC/NECO-style
    academic expectations.

QUESTION REQUIREMENTS:

Generate EXACTLY ${questionCount} questions.

Each question MUST:

- Be multiple choice.
- Have exactly four options.
- Have exactly one correct answer.
- Have a zero-based answer index.

Answer indexes:

0 = first option
1 = second option
2 = third option
3 = fourth option

The options must be:

- Clear
- Plausible
- Different from each other
- Appropriate for the question

The incorrect options must be plausible but incorrect.

Do not duplicate questions.

Do not repeat question wording.

Do not create unrelated questions.

Do not ask questions outside the selected topic.

For Mathematics:

- Verify calculations.
- Verify formulas.
- Verify numerical values.
- Verify units where appropriate.

For Physics:

- Verify formulas.
- Verify calculations.
- Verify units.
- Ensure physical principles are correct.

For Chemistry:

- Ensure chemical facts are accurate.
- Verify equations and calculations.
- Use correct terminology.

For Biology:

- Ensure biological facts are accurate.
- Use correct scientific terminology.

For English Language:

- Questions must actually test the selected
  English topic.

For Economics, Government, Geography, Literature,
History, Civic Education, CRS, IRS, and other
humanities/social-science subjects:

- Keep questions specifically connected to
  the selected subject and topic.

EXPLANATIONS:

Give a short explanation for every answer.

Do not make explanations excessively long.

OUTPUT FORMAT:

Return ONLY valid JSON.

Do NOT return Markdown.

Do NOT return code fences.

Do NOT return HTML.

Do NOT return text before the JSON.

Do NOT return text after the JSON.

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

        /*
         * =====================================================
         * AI INPUT
         * =====================================================
         */

        const input = `
Generate exactly ${questionCount} fresh knowledge-check
questions.

Subject:
${subject}

Topic:
${topic}

Difficulty:
${difficulty}

Curriculum:
${curriculum}

This is a StudyMind AI topic knowledge check.

The questions must test ONLY the selected subject
and selected topic.

Do not switch subjects.

Do not switch topics.

Create a new question set for this request.
`;

        console.log(
            "StudyMind knowledge check generation started."
        );

        console.log(
            "Subject:",
            subject
        );

        console.log(
            "Topic:",
            topic
        );

        console.log(
            "Question count:",
            questionCount
        );

        /*
         * =====================================================
         * OPENAI
         * =====================================================
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

        /*
         * =====================================================
         * EMPTY RESPONSE
         * =====================================================
         */

        if (!output) {

            console.error(
                "OpenAI returned an empty knowledge-check response."
            );

            return res.status(502).json({
                success: false,
                error:
                    "Knowledge check AI returned an empty response."
            });
        }

        /*
         * =====================================================
         * PARSE JSON
         * =====================================================
         */

        let parsed = null;

        try {

            parsed = JSON.parse(output);

        } catch {

            let cleaned =
                output
                    .replace(/^```json\s*/i, "")
                    .replace(/^```\s*/i, "")
                    .replace(/\s*```$/i, "")
                    .trim();

            try {

                parsed = JSON.parse(cleaned);

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
         * =====================================================
         * VALIDATE TOP-LEVEL RESPONSE
         * =====================================================
         */

        if (
            !parsed ||
            !Array.isArray(parsed.questions)
        ) {

            console.error(
                "Invalid knowledge-check AI output:",
                output
            );

            return res.status(502).json({
                success: false,
                error:
                    "Knowledge check AI returned invalid question data."
            });
        }

        /*
         * =====================================================
         * NORMALIZE + VALIDATE QUESTIONS
         * =====================================================
         */

        const validQuestions = [];

        for (const question of parsed.questions) {

            if (
                !question ||
                typeof question !== "object"
            ) {
                continue;
            }

            if (
                typeof question.question !== "string" ||
                !question.question.trim()
            ) {
                continue;
            }

            if (
                !Array.isArray(question.options) ||
                question.options.length !== 4
            ) {
                continue;
            }

            const options =
                question.options.map(option =>
                    typeof option === "string"
                        ? option.trim()
                        : ""
                );

            if (
                options.some(
                    option => !option
                )
            ) {
                continue;
            }

            /*
             * Accept the standard "answer" field.
             * Also accept the alternative fields in case
             * the model returns them.
             */

            let answerValue =
                question.answer;

            if (
                answerValue === undefined ||
                answerValue === null
            ) {
                answerValue =
                    question.correctAnswer;
            }

            if (
                answerValue === undefined ||
                answerValue === null
            ) {
                answerValue =
                    question.correct;
            }

            let answer =
                Number(answerValue);

            /*
             * Support A/B/C/D if returned accidentally.
             */

            if (
                typeof answerValue === "string"
            ) {

                const letter =
                    answerValue
                        .trim()
                        .toUpperCase();

                if (letter === "A") {
                    answer = 0;
                } else if (letter === "B") {
                    answer = 1;
                } else if (letter === "C") {
                    answer = 2;
                } else if (letter === "D") {
                    answer = 3;
                }
            }

            if (
                !Number.isInteger(answer) ||
                answer < 0 ||
                answer > 3
            ) {
                continue;
            }

            const explanation =
                typeof question.explanation === "string"
                    ? question.explanation.trim()
                    : "";

            validQuestions.push({

                question:
                    question.question.trim(),

                options,

                answer,

                explanation
            });
        }

        /*
         * =====================================================
         * REMOVE DUPLICATES
         * =====================================================
         */

        const uniqueQuestions = [];

        const seenQuestions =
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

            if (
                !seenQuestions.has(
                    normalized
                )
            ) {

                seenQuestions.add(
                    normalized
                );

                uniqueQuestions.push(
                    question
                );
            }
        }

        /*
         * =====================================================
         * QUESTION COUNT CHECK
         * =====================================================
         */

        if (
            uniqueQuestions.length <
            questionCount
        ) {

            console.error(
                `Knowledge check generated only ${uniqueQuestions.length} valid questions out of ${questionCount}.`
            );

            return res.status(502).json({

                success: false,

                error:
                    `Knowledge check generated only ${uniqueQuestions.length} valid questions out of ${questionCount}.`,

                questions:
                    uniqueQuestions
            });
        }

        /*
         * =====================================================
         * SUCCESS
         * =====================================================
         */

        console.log(
            `Successfully generated ${questionCount} knowledge-check questions.`
        );

        return res.status(200).json({

            success: true,

            type: "knowledge_check",

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

    } catch (error) {

        console.error(
            "StudyMind knowledge-check API error:",
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
