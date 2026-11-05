
"use strict";

const OpenAI = require("openai");

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const DAILY_AI_LIMIT = 5;
const LAGOS_TIME_ZONE = "Africa/Lagos";

/* =========================================================
   SUPABASE CONFIGURATION
========================================================= */

function getSupabaseConfig() {
    const url = process.env.SUPABASE_URL;
    const serviceRoleKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
        throw new Error(
            "Supabase server configuration is missing."
        );
    }

    return {
        url: url.replace(/\/+$/, ""),
        serviceRoleKey
    };
}

/* =========================================================
   NIGERIAN DATE
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
   AUTHENTICATE USER
========================================================= */

async function verifySupabaseUser(req) {
    const authorization =
        req.headers.authorization ||
        req.headers.Authorization ||
        "";

    const match = authorization.match(/^Bearer\s+(.+)$/i);

    if (!match || !match[1].trim()) {
        return {
            ok: false,
            status: 401,
            error: "Please sign in to use StudyMind AI."
        };
    }

    const accessToken = match[1].trim();

    const { url, serviceRoleKey } =
        getSupabaseConfig();

    const response = await fetch(
        `${url}/auth/v1/user`,
        {
            method: "GET",
            headers: {
                apikey: serviceRoleKey,
                Authorization: `Bearer ${accessToken}`
            }
        }
    );

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
            error: "Unable to verify your account."
        };
    }

    return {
        ok: true,
        user
    };
}

/* =========================================================
   ADMIN VERIFICATION
========================================================= */

function isAdminUser(user) {
    const adminEmail =
        (process.env.ADMIN_EMAIL || "")
            .trim()
            .toLowerCase();

    const userEmail =
        (user.email || "")
            .trim()
            .toLowerCase();

    return Boolean(
        adminEmail &&
        userEmail &&
        adminEmail === userEmail
    );
}

/* =========================================================
   PREMIUM VERIFICATION
========================================================= */

async function checkPremiumStatus(userId) {
    const { url, serviceRoleKey } =
        getSupabaseConfig();

    const query = new URLSearchParams({
        user_id: `eq.${userId}`,
        status: "eq.active",
        is_premium: "eq.true",
        select: "id",
        limit: "1"
    });

    const response = await fetch(
        `${url}/rest/v1/premium_subscriptions?${query}`,
        {
            method: "GET",
            headers: {
                apikey: serviceRoleKey,
                Authorization: `Bearer ${serviceRoleKey}`
            }
        }
    );

    if (!response.ok) {
        console.error(
            "Premium lookup error:",
            response.status,
            await response.text()
        );

        throw new Error(
            "Unable to verify Premium membership."
        );
    }

    const subscriptions = await response.json();

    return (
        Array.isArray(subscriptions) &&
        subscriptions.length > 0
    );
}

/* =========================================================
   GET VERIFIED ACCOUNT ACCESS
========================================================= */

async function getAccountAccess(user) {
    const admin = isAdminUser(user);

    if (admin) {
        return {
            isAdmin: true,
            isPremium: true
        };
    }

    const premium = await checkPremiumStatus(user.id);

    return {
        isAdmin: false,
        isPremium: premium
    };
}

/* =========================================================
   FREE AI USAGE COUNTER
========================================================= */

async function consumeAIQuestion(userId, usageDate) {
    const { url, serviceRoleKey } =
        getSupabaseConfig();

    const response = await fetch(
        `${url}/rest/v1/rpc/consume_ai_question`,
        {
            method: "POST",
            headers: {
                apikey: serviceRoleKey,
                Authorization: `Bearer ${serviceRoleKey}`,
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
        console.error(
            "AI usage counter error:",
            response.status,
            await response.text()
        );

        throw new Error(
            "Unable to check your daily AI allowance."
        );
    }

    const result = await response.json();

    const record = Array.isArray(result)
        ? result[0]
        : result;

    if (
        !record ||
        typeof record.allowed !== "boolean"
    ) {
        throw new Error(
            "Invalid AI usage counter response."
        );
    }

    return {
        allowed: record.allowed,
        questionsUsed:
            Number(record.questions_used) || 0
    };
}

/* =========================================================
   REFUND FAILED AI REQUEST
========================================================= */

async function refundAIQuestion(userId, usageDate) {
    try {
        const { url, serviceRoleKey } =
            getSupabaseConfig();

        const response = await fetch(
            `${url}/rest/v1/rpc/refund_ai_question`,
            {
                method: "POST",
                headers: {
                    apikey: serviceRoleKey,
                    Authorization: `Bearer ${serviceRoleKey}`,
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
                "AI usage refund failed:",
                response.status,
                await response.text()
            );
        }
    } catch (error) {
        console.error(
            "AI refund error:",
            error.message
        );
    }
}

/* =========================================================
   COMPUTER BATTLE DETECTION
========================================================= */

function isComputerBattleRequest(body) {
    const mode =
        String(body.mode || "").toLowerCase().trim();

    const requestType =
        String(body.requestType || "").toLowerCase().trim();

    const type =
        String(body.type || "").toLowerCase().trim();

    return (
        [
            "computer_battle",
            "computer-battle",
            "computer battle"
        ].includes(mode) ||
        [
            "computer_battle",
            "computer-battle",
            "computer battle"
        ].includes(requestType) ||
        [
            "computer_battle",
            "computer-battle",
            "computer battle",
            "game_questions",
            "game"
        ].includes(type) ||
        [
            "game",
            "game_mode",
            "game-mode"
        ].includes(mode) ||
        body.gameMode === true
    );
}

/* =========================================================
   GENERATE COMPUTER BATTLE QUESTIONS
========================================================= */

async function generateBattleQuestions(body) {
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

    const curriculum =
        typeof body.curriculum === "string" &&
        body.curriculum.trim()
            ? body.curriculum.trim()
            : "Nigerian Senior Secondary School curriculum";

    const curriculumTopics =
        Array.isArray(body.curriculumTopics)
            ? body.curriculumTopics
            : [];

    const requestedCount =
        body.numberOfQuestions ??
        body.questionCount ??
        body.questions ??
        10;

    let questionCount =
        Number(requestedCount);

    if (!Number.isFinite(questionCount)) {
        questionCount = 10;
    }

    questionCount = Math.min(
        Math.max(Math.floor(questionCount), 1),
        20
    );

    if (!subject) {
        const error = new Error(
            "A subject is required for Computer Battle."
        );

        error.status = 400;
        throw error;
    }

    if (!topic) {
        const error = new Error(
            "A topic is required for Computer Battle."
        );

        error.status = 400;
        throw error;
    }

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
Relevant curriculum topics/reference:

${curriculumTopics
    .map((item, index) =>
        `${index + 1}. ${String(item)}`
    )
    .join("\n")}
`
            : "";

    const instructions = `
You are StudyMind AI's Computer Battle question generator.

Create a completely NEW set of educational multiple-choice questions.

CURRICULUM:
${curriculum}

SUBJECT:
${subject}

TOPIC:
${topic}

DIFFICULTY:
${difficulty}

BATTLE ID:
${battleNonce}

${curriculumContext}

The selected subject and topic are authoritative.

Every question MUST belong to the selected subject.

Every question MUST primarily test the selected topic.

Never silently change the subject or topic.

Never default to Mathematics.

Questions should be appropriate for Nigerian secondary-school
students and compatible with WAEC/NECO expectations where relevant.

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

For calculation-based subjects, verify calculations, formulas,
values and units.

Keep explanations short and educational.

Return ONLY valid JSON.

Use exactly this structure:

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
Create ${questionCount} NEW multiple-choice questions.

Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}
Curriculum: ${curriculum}

This is a Computer Battle.
Generate a fresh question set.
`;

    const response = await client.responses.create({
        model: "gpt-5-mini",
        instructions,
        input
    });

    const output =
        typeof response.output_text === "string"
            ? response.output_text.trim()
            : "";

    if (!output) {
        const error = new Error(
            "Computer Battle AI returned an empty response."
        );

        error.status = 502;
        throw error;
    }

    let parsed = null;

    try {
        parsed = JSON.parse(output);
    } catch (error) {
        const cleaned = output
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

        try {
            parsed = JSON.parse(cleaned);
        } catch (secondError) {
            const start = cleaned.indexOf("{");
            const end = cleaned.lastIndexOf("}");

            if (start !== -1 && end > start) {
                try {
                    parsed = JSON.parse(
                        cleaned.slice(start, end + 1)
                    );
                } catch (thirdError) {
                    parsed = null;
                }
            }
        }
    }

    if (!parsed || !Array.isArray(parsed.questions)) {
        const error = new Error(
            "Computer Battle AI returned invalid question data."
        );

        error.status = 502;
        throw error;
    }

    const validQuestions = parsed.questions
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
                        option.trim()
                )
            ) {
                return false;
            }

            const answer = Number(question.answer);

            return (
                Number.isInteger(answer) &&
                answer >= 0 &&
                answer <= 3
            );
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

    const uniqueQuestions = [];
    const seenQuestions = new Set();

    for (const question of validQuestions) {
        const normalized = question.question
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();

        if (!seenQuestions.has(normalized)) {
            seenQuestions.add(normalized);
            uniqueQuestions.push(question);
        }
    }

    if (uniqueQuestions.length < questionCount) {
        const error = new Error(
            `Computer Battle generated only ${uniqueQuestions.length} unique valid questions out of ${questionCount}.`
        );

        error.status = 502;
        throw error;
    }

    return {
        success: true,
        type: "game_questions",
        mode: "computer_battle",
        requestType: "computer_battle",
        subject,
        topic,
        difficulty,
        questionCount,
        questions: uniqueQuestions.slice(0, questionCount)
    };
}

/* =========================================================
   NORMAL AI INSTRUCTIONS
========================================================= */

const NORMAL_AI_INSTRUCTIONS = `
You are StudyMind AI, a professional educational assistant.

Help students:
- Understand school subjects.
- Prepare for exams.
- Solve academic problems.
- Organize study plans.
- Manage study time.
- Understand difficult concepts.
- Review topics.
- Improve learning.

Give answers that are clear, accurate, concise but helpful,
easy for students to understand and professionally formatted.

FORMATTING RULES:

1. Use normal paragraphs for explanations.
2. Use bullet points only when useful.
3. Never create empty bullet points.
4. Never put a bullet point by itself before an equation.
5. Put important equations on their own lines.
6. Use LaTeX for mathematical equations.
7. Use inline LaTeX when an equation appears inside a sentence.
8. Always use correct SI units.
9. Use correct mathematical formatting for units.
10. Do not use backticks around normal units or numbers.
11. Use bold text sparingly.
12. Do not output HTML.
13. Do not explain these formatting rules.
14. Do not add unnecessary introductions.
15. When solving calculations, show the formula, substitution,
    calculation and final answer with the correct unit.
16. Use the student's study information when provided.
17. Do not invent information.
18. Answer simple questions directly.
19. Teach concepts rather than giving unexplained answers.
`;

/* =========================================================
   MAIN API HANDLER
========================================================= */

module.exports = async function handler(req, res) {

    let usageReservation = null;

    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            error: "Method not allowed."
        });
    }

    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
            success: false,
            error: "OPENAI_API_KEY is not configured on Vercel."
        });
    }

    try {
        const body = req.body || {};

        /* =============================================
           AUTHENTICATE EVERY REQUEST

           This happens BEFORE Game Mode or normal AI.
        ============================================= */

        const auth = await verifySupabaseUser(req);

        if (!auth.ok) {
            return res.status(auth.status).json({
                success: false,
                error: auth.error
            });
        }

        const user = auth.user;

        /* =============================================
           VERIFY ADMIN / PREMIUM ACCESS
        ============================================= */

        const access = await getAccountAccess(user);

        console.log("StudyMind AI access:", {
            userId: user.id,
            isAdmin: access.isAdmin,
            isPremium: access.isPremium
        });

        /* =============================================
           COMPUTER BATTLE

           Authentication is now required.
           Premium status is verified server-side.
        ============================================= */

        if (isComputerBattleRequest(body)) {

            const result =
                await generateBattleQuestions(body);

            return res.status(200).json({
                ...result,
                isPremium: access.isPremium,
                isAdmin: access.isAdmin
            });
        }

        /* =============================================
           NORMAL AI REQUEST
        ============================================= */

        const message =
            typeof body.message === "string"
                ? body.message.trim()
                : "";

        if (!message) {
            return res.status(400).json({
                success: false,
                error: "Please provide a message."
            });
        }

        /* =============================================
           FREE DAILY LIMIT

           Admin and verified Premium users bypass
           the five-question daily allowance.
        ============================================= */

        if (!access.isAdmin && !access.isPremium) {

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

        /* =============================================
           OPENAI REQUEST
        ============================================= */

        const response = await client.responses.create({
            model: "gpt-5-mini",
            instructions: NORMAL_AI_INSTRUCTIONS,
            input: message
        });

        const reply =
            typeof response.output_text === "string"
                ? response.output_text.trim()
                : "";

        if (!reply) {
            throw new Error(
                "StudyMind AI returned an empty response."
            );
        }

        /* =============================================
           SUCCESS

           Keep the usage reservation because the
           request was completed successfully.
        ============================================= */

        usageReservation = null;

        return res.status(200).json({
            success: true,
            reply,
            isPremium: access.isPremium,
            isAdmin: access.isAdmin
        });

    } catch (error) {

        console.error(
            "StudyMind AI API error:",
            error
        );

        /* =============================================
           REFUND FAILED NORMAL AI REQUEST
        ============================================= */

        if (usageReservation) {
            await refundAIQuestion(
                usageReservation.userId,
                usageReservation.usageDate
            );

            usageReservation = null;
        }

        const status =
            Number.isInteger(error.status)
                ? error.status
                : 500;

        return res.status(status).json({
            success: false,
            error:
                status < 500
                    ? error.message
                    : "StudyMind AI could not complete your request. Please try again."
        });
    }
};
