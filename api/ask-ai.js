
const OpenAI = require("openai");

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const DAILY_AI_LIMIT = 5;
const LAGOS_TIME_ZONE = "Africa/Lagos";

/* =========================================================
   SUPABASE SERVER CONFIGURATION
========================================================= */

function getSupabaseConfig() {
    const url = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
        throw new Error(
            "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing."
        );
    }

    return {
        url: url.replace(/\/+$/, ""),
        serviceRoleKey
    };
}

/* =========================================================
   GET TODAY'S DATE IN NIGERIA
========================================================= */

function getLagosDate() {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: LAGOS_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    const values = Object.fromEntries(
        parts.map(part => [part.type, part.value])
    );

    return `${values.year}-${values.month}-${values.day}`;
}

/* =========================================================
   VERIFY THE SIGNED-IN SUPABASE USER
========================================================= */

async function verifySupabaseUser(req) {
    const authorization =
        req.headers.authorization ||
        req.headers.Authorization ||
        "";

    const match = authorization.match(/^Bearer\s+(.+)$/i);

    if (!match) {
        return {
            ok: false,
            status: 401,
            error: "Please sign in to use StudyMind AI."
        };
    }

    const accessToken = match[1].trim();

    if (!accessToken) {
        return {
            ok: false,
            status: 401,
            error: "Your session is invalid. Please sign in again."
        };
    }

    const { url, serviceRoleKey } = getSupabaseConfig();

    const response = await fetch(`${url}/auth/v1/user`, {
        method: "GET",
        headers: {
            "apikey": serviceRoleKey,
            "Authorization": `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        return {
            ok: false,
            status: 401,
            error: "Your session has expired. Please sign in again."
        };
    }

    const user = await response.json();

    if (!user || !user.id || !user.email) {
        return {
            ok: false,
            status: 401,
            error: "Unable to verify your account. Please sign in again."
        };
    }

    return {
        ok: true,
        user
    };
}

/* =========================================================
   CHECK THE DESIGNATED ADMIN EMAIL
========================================================= */

function isAdminUser(user) {
    const configuredAdminEmail =
        (process.env.ADMIN_EMAIL || "")
            .trim()
            .toLowerCase();

    const verifiedUserEmail =
        (user.email || "")
            .trim()
            .toLowerCase();

    return Boolean(
        configuredAdminEmail &&
        verifiedUserEmail &&
        configuredAdminEmail === verifiedUserEmail
    );
}

/* =========================================================
   CHECK PREMIUM STATUS IN SUPABASE

   The browser's localStorage is not trusted.
   Premium access must be verified on the server.
========================================================= */

async function checkPremiumStatus(userId) {
    const { url, serviceRoleKey } = getSupabaseConfig();

    const query = new URLSearchParams({
        user_id: `eq.${userId}`,
        status: "eq.active",
        is_premium: "eq.true",
        select: "id",
        limit: "1"
    });

    const response = await fetch(
        `${url}/rest/v1/premium_subscriptions?${query.toString()}`,
        {
            method: "GET",
            headers: {
                "apikey": serviceRoleKey,
                "Authorization": `Bearer ${serviceRoleKey}`
            }
        }
    );

    if (!response.ok) {
        const details = await response.text();

        console.error(
            "Premium subscription lookup failed:",
            response.status,
            details
        );

        throw new Error(
            "Unable to verify Premium status."
        );
    }

    const subscriptions = await response.json();

    return Array.isArray(subscriptions) &&
        subscriptions.length > 0;
}

/* =========================================================
   RESERVE ONE FREE AI QUESTION

   The Supabase RPC performs the increment atomically.
   Concurrent requests cannot exceed the configured limit.
========================================================= */

async function consumeAIQuestion(userId, usageDate) {
    const { url, serviceRoleKey } = getSupabaseConfig();

    const response = await fetch(
        `${url}/rest/v1/rpc/consume_ai_question`,
        {
            method: "POST",
            headers: {
                "apikey": serviceRoleKey,
                "Authorization": `Bearer ${serviceRoleKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                p_user_id: userId,
                p_usage_date: usageDate,
                p_daily_limit: DAILY_AI_LIMIT
            })
        }
    );

    if (!response.ok) {
        const details = await response.text();

        console.error(
            "AI usage counter failed:",
            response.status,
            details
        );

        throw new Error(
            "Unable to check your daily AI question allowance."
        );
    }

    const result = await response.json();

    const record = Array.isArray(result)
        ? result[0]
        : result;

    if (!record || typeof record.allowed !== "boolean") {
        throw new Error(
            "The AI usage counter returned an invalid response."
        );
    }

    return {
        allowed: record.allowed,
        questionsUsed: Number(record.questions_used) || 0
    };
}

/* =========================================================
   REFUND A RESERVED QUESTION IF OPENAI FAILS
========================================================= */

async function refundAIQuestion(userId, usageDate) {
    try {
        const { url, serviceRoleKey } = getSupabaseConfig();

        const response = await fetch(
            `${url}/rest/v1/rpc/refund_ai_question`,
            {
                method: "POST",
                headers: {
                    "apikey": serviceRoleKey,
                    "Authorization": `Bearer ${serviceRoleKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    p_user_id: userId,
                    p_usage_date: usageDate
                })
            }
        );

        if (!response.ok) {
            console.error(
                "Unable to refund failed AI question:",
                response.status,
                await response.text()
            );
        }
    } catch (error) {
        console.error(
            "AI question refund error:",
            error.message
        );
    }
}

/* =========================================================
   MAIN API HANDLER
========================================================= */

module.exports = async function handler(req, res) {

    let usageReservation = null;

    // =====================================================
    // METHOD CHECK
    // =====================================================

    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            error: "Method not allowed"
        });
    }

    // =====================================================
    // API KEY CHECK
    // =====================================================

    if (!process.env.OPENAI_API_KEY) {
        console.error("OPENAI_API_KEY is missing.");

        return res.status(500).json({
            success: false,
            error: "OPENAI_API_KEY is not configured on Vercel."
        });
    }

    try {
        const body = req.body || {};

        // =================================================
        // READ REQUEST DATA
        // =================================================

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

        // =================================================
        // QUESTION COUNT
        // =================================================

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

        // =================================================
        // DETECT COMPUTER BATTLE / GAME MODE
        // =================================================

        const isComputerBattle =
            mode === "computer_battle" ||
            mode === "computer-battle" ||
            mode === "computer battle" ||
            requestType === "computer_battle" ||
            requestType === "computer-battle" ||
            requestType === "computer battle";

        const isGameMode =
            isComputerBattle ||
            mode === "game" ||
            mode === "game_mode" ||
            mode === "game-mode" ||
            type === "game_questions" ||
            type === "game" ||
            type === "computer_battle" ||
            body.gameMode === true;

        console.log("StudyMind AI request:", {
            mode,
            type,
            requestType,
            subject,
            topic,
            questionCount,
            isGameMode,
            isComputerBattle
        });

        // =================================================
        // GAME MODE / COMPUTER BATTLE
        //
        // This remains separate from the normal AI daily
        // question counter.
        //
        // Existing battle generation and response behavior
        // are preserved.
        // =================================================

        if (isGameMode) {

            // -------------------------------------------------
            // SUBJECT REQUIRED
            // -------------------------------------------------

            if (!subject) {
                return res.status(400).json({
                    success: false,
                    error:
                        "A subject is required for Computer Battle."
                });
            }

            // -------------------------------------------------
            // TOPIC REQUIRED
            // -------------------------------------------------

            if (!topic) {
                return res.status(400).json({
                    success: false,
                    error:
                        "A topic is required for Computer Battle."
                });
            }

            // -------------------------------------------------
            // CURRICULUM INFORMATION
            // -------------------------------------------------

            const curriculumTopics =
                Array.isArray(body.curriculumTopics)
                    ? body.curriculumTopics
                    : [];

            const curriculum =
                typeof body.curriculum === "string" &&
                body.curriculum.trim()
                    ? body.curriculum.trim()
                    : "Nigerian Senior Secondary School curriculum";

            // -------------------------------------------------
            // RANDOMIZATION NONCE
            // -------------------------------------------------

            const battleNonce =
                typeof body.battleNonce === "string" &&
                body.battleNonce.trim()
                    ? body.battleNonce.trim()
                    : `${Date.now()}-${Math.random()
                        .toString(36)
                        .slice(2)}`;

            // -------------------------------------------------
            // CURRICULUM CONTEXT
            // -------------------------------------------------

            const curriculumContext =
                curriculumTopics.length > 0
                    ? `
Relevant curriculum topics/reference:

${curriculumTopics
    .map((item, index) => `${index + 1}. ${String(item)}`)
    .join("\n")}
`
                    : "";

            // -------------------------------------------------
            // GAME INSTRUCTIONS
            // -------------------------------------------------

            const gameInstructions = `
You are StudyMind AI's Computer Battle question generator.

Your task is to create a completely NEW set of educational
multiple-choice questions for a secondary-school student.

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

The selected subject and topic are authoritative.

Every question MUST belong to the selected subject.

Every question MUST primarily test the selected topic.

Never silently change the subject.

Never silently change the topic.

Never default to Mathematics.

If the selected subject is not Mathematics, do NOT generate
Mathematics questions.

If the selected subject is Mathematics, generate Mathematics
questions specifically about the selected topic.

Questions must be appropriate for Nigerian secondary-school
students and should be compatible with WAEC/NECO-style
academic expectations where appropriate.

Generate exactly ${questionCount} questions.

Every question must have exactly four answer options.

There must be exactly one correct answer.

The answer field must be a zero-based integer:

0 = first option
1 = second option
2 = third option
3 = fourth option

Distractors must be plausible but incorrect.

Do not duplicate questions.

Do not repeat the same question wording.

Do not create generic questions unrelated to the selected topic.

For calculation-based subjects, verify formulas, calculations,
values and units carefully.

For science subjects, ensure scientific facts are accurate.

For English Language and Literature, ensure grammar,
comprehension, literary concepts and terminology are accurate
for the selected topic.

For Economics, Government, Civic Education, Geography,
History, CRS, IRS and other humanities subjects, ensure the
question genuinely relates to the selected topic.

Keep explanations short and educational.

IMPORTANT:

Return ONLY valid JSON.

Do not return Markdown.

Do not return code fences.

Do not return an explanation outside the JSON.

Do not return HTML.

The response MUST contain exactly this structure:

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

            // -------------------------------------------------
            // USER INPUT
            // -------------------------------------------------

            const gameMessage = `
Create ${questionCount} NEW multiple-choice questions.

Subject: ${subject}

Topic: ${topic}

Difficulty: ${difficulty}

Curriculum: ${curriculum}

This is a Computer Battle.

Generate a fresh question set for this battle.
Do not reuse a previous question set.
`;

            console.log(
                `Generating ${questionCount} Computer Battle questions: ${subject} - ${topic}`
            );

            // =================================================
            // OPENAI REQUEST
            // =================================================

            const response = await client.responses.create({
                model: "gpt-5-mini",
                instructions: gameInstructions,
                input: gameMessage
            });

            const output =
                typeof response.output_text === "string"
                    ? response.output_text.trim()
                    : "";

            console.log(
                "Computer Battle AI response received."
            );

            // =================================================
            // CHECK EMPTY RESPONSE
            // =================================================

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

            // =================================================
            // PARSE JSON
            // =================================================

            let parsed = null;

            try {
                parsed = JSON.parse(output);
            } catch (directParseError) {
                console.warn(
                    "Direct JSON parsing failed. Attempting recovery."
                );

                let cleaned = output
                    .replace(/^```json\s*/i, "")
                    .replace(/^```\s*/i, "")
                    .replace(/\s*```$/i, "")
                    .trim();

                try {
                    parsed = JSON.parse(cleaned);
                } catch (cleanedParseError) {
                    const start = cleaned.indexOf("{");
                    const end = cleaned.lastIndexOf("}");

                    if (
                        start !== -1 &&
                        end !== -1 &&
                        end > start
                    ) {
                        try {
                            parsed = JSON.parse(
                                cleaned.slice(start, end + 1)
                            );
                        } catch (recoveryError) {
                            parsed = null;
                        }
                    }
                }
            }

            // =================================================
            // VALIDATE TOP-LEVEL RESPONSE
            // =================================================

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

            // =================================================
            // VALIDATE QUESTIONS
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
                            typeof question.question !== "string" ||
                            !question.question.trim()
                        ) {
                            return false;
                        }

                        if (!Array.isArray(question.options)) {
                            return false;
                        }

                        if (question.options.length !== 4) {
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

                        const answer = Number(question.answer);

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
                        question: question.question.trim(),

                        options: question.options.map(
                            option => option.trim()
                        ),

                        answer: Number(question.answer),

                        explanation:
                            typeof question.explanation === "string"
                                ? question.explanation.trim()
                                : ""
                    }));

            // =================================================
            // REMOVE DUPLICATE QUESTIONS
            // =================================================

            const uniqueQuestions = [];
            const seenQuestions = new Set();

            for (const question of validQuestions) {
                const normalized =
                    question.question
                        .toLowerCase()
                        .replace(/\s+/g, " ")
                        .trim();

                if (!seenQuestions.has(normalized)) {
                    seenQuestions.add(normalized);
                    uniqueQuestions.push(question);
                }
            }

            // =================================================
            // CHECK QUESTION COUNT
            // =================================================

            if (uniqueQuestions.length < questionCount) {
                console.error(
                    "Insufficient unique questions:",
                    uniqueQuestions.length,
                    "of",
                    questionCount
                );

                return res.status(502).json({
                    success: false,
                    error:
                        `Computer Battle generated only ${uniqueQuestions.length} unique valid questions out of ${questionCount}.`,
                    questions: uniqueQuestions
                });
            }

            // =================================================
            // RETURN QUESTIONS
            // =================================================

            return res.status(200).json({
                success: true,
                type: "game_questions",
                mode: "computer_battle",
                requestType: "computer_battle",
                subject,
                topic,
                difficulty,
                questionCount,
                questions: uniqueQuestions.slice(
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
                success: false,
                error: "Please provide a message."
            });
        }

        // =====================================================
        // AUTHENTICATE NORMAL AI REQUEST
        // =====================================================

        const auth = await verifySupabaseUser(req);

        if (!auth.ok) {
            return res.status(auth.status).json({
                success: false,
                error: auth.error
            });
        }

        const user = auth.user;

        // =====================================================
        // ADMIN BYPASS
        //
        // Only the verified email matching ADMIN_EMAIL in
        // Vercel receives this exception.
        // =====================================================

        const isAdmin = isAdminUser(user);

        // =====================================================
        // PREMIUM STATUS
        // =====================================================

        let isPremium = false;

        if (!isAdmin) {
            isPremium = await checkPremiumStatus(user.id);
        }

        console.log("StudyMind AI access:", {
            userId: user.id,
            isAdmin,
            isPremium
        });

        // =====================================================
        // FREE DAILY QUESTION LIMIT
        //
        // Admin and Premium users bypass this counter.
        // Free users can consume at most five questions
        // per calendar day in Nigeria.
        // =====================================================

        if (!isAdmin && !isPremium) {
            const usageDate = getLagosDate();

            const usage = await consumeAIQuestion(
                user.id,
                usageDate
            );

            if (!usage.allowed) {
                return res.status(429).json({
                    success: false,
                    code: "DAILY_AI_LIMIT_REACHED",
                    error:
                        "You've reached your 5 free AI questions for today. Your limit resets at midnight Nigeria time.",
                    questionsUsed: usage.questionsUsed,
                    dailyLimit: DAILY_AI_LIMIT,
                    premiumRequired: true
                });
            }

            usageReservation = {
                userId: user.id,
                usageDate
            };
        }

        // =====================================================
        // NORMAL AI INSTRUCTIONS
        // =====================================================

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

4. NEVER put a bullet point by itself immediately before
a mathematical equation.

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

        // =====================================================
        // NORMAL OPENAI REQUEST
        // =====================================================

        const response = await client.responses.create({
            model: "gpt-5-mini",
            instructions: normalInstructions,
            input: message
        });

        const reply =
            typeof response.output_text === "string"
                ? response.output_text.trim()
                : "";

        // =====================================================
        // EMPTY RESPONSE CHECK
        // =====================================================

        if (!reply) {
            if (usageReservation) {
                await refundAIQuestion(
                    usageReservation.userId,
                    usageReservation.usageDate
                );

                usageReservation = null;
            }

            return res.status(502).json({
                success: false,
                error: "StudyMind AI returned an empty response."
            });
        }

        // =====================================================
        // SUCCESS
        // The reserved free question remains counted.
        // =====================================================

        usageReservation = null;

        return res.status(200).json({
            success: true,
            reply
        });

    } catch (error) {
        console.error(
            "StudyMind AI API error:",
            error
        );

        // =====================================================
        // REFUND A FREE QUESTION IF THE REQUEST FAILED
        // =====================================================

        if (usageReservation) {
            await refundAIQuestion(
                usageReservation.userId,
                usageReservation.usageDate
            );

            usageReservation = null;
        }

        return res.status(500).json({
            success: false,
            error:
                "StudyMind AI could not complete your request. Please try again."
        });
    }
};
