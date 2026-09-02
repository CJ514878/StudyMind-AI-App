/* =========================================================
   STUDYMIND AI — AI SUPPORT
   COMPLETE REPLACEMENT
========================================================= */

"use strict";

/* =========================================================
   CONFIGURATION
========================================================= */

const FREE_AI_LIMIT = 5;

const AI_COUNT_KEY = "aiQuestionCount";
const PLAN_KEY = "studyMindPlan";
const COMPAT_PLAN_KEY = "studyData";
const THEME_KEY = "studyMindTheme";

let currentUser = null;
let isAuthenticated = false;
let aiRequestInProgress = false;

/* =========================================================
   ELEMENT SHORTCUT
========================================================= */

function $(id) {
    return document.getElementById(id);
}

/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", initializeAISupport);

async function initializeAISupport() {

    setupTheme();

    setupNavigation();

    await checkAuthentication();

    updateAIUsage();

    setupAIEvents();
}

/* =========================================================
   AUTHENTICATION
========================================================= */

async function checkAuthentication() {

    try {

        const client =
            window.supabaseClient;

        if (
            !client ||
            !client.auth
        ) {
            console.warn(
                "StudyMind AI: Supabase client unavailable."
            );

            return false;
        }

        const result =
            await client.auth.getUser();

        if (result.error) {
            console.warn(
                "StudyMind AI authentication error:",
                result.error
            );

            return false;
        }

        currentUser =
            result.data &&
            result.data.user
                ? result.data.user
                : null;

        isAuthenticated =
            !!currentUser;

        if (!isAuthenticated) {
            showAuthenticationMessage();
        }

        return isAuthenticated;

    } catch (error) {

        console.error(
            "StudyMind AI authentication failed:",
            error
        );

        isAuthenticated = false;

        return false;
    }
}

/* =========================================================
   EVENT SETUP
========================================================= */

function setupAIEvents() {

    const askButton =
        $("askAIButton");

    const analyzeButton =
        $("analyzeProgressButton");

    if (askButton) {

        askButton.addEventListener(
            "click",
            askStudyMindAI
        );
    }

    if (analyzeButton) {

        analyzeButton.addEventListener(
            "click",
            analyzeProgress
        );
    }

    const questionInput =
        $("aiQuestion");

    if (questionInput) {

        questionInput.addEventListener(
            "keydown",
            function(event) {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    askStudyMindAI();
                }
            }
        );
    }
}

/* =========================================================
   PLAN
========================================================= */

function getStudyPlan() {

    let plan = null;

    try {

        const primary =
            localStorage.getItem(
                PLAN_KEY
            );

        if (primary) {
            plan = JSON.parse(primary);
        }

    } catch (error) {

        console.warn(
            "Could not read studyMindPlan.",
            error
        );
    }

    if (!plan) {

        try {

            const compatibility =
                localStorage.getItem(
                    COMPAT_PLAN_KEY
                );

            if (compatibility) {
                plan = JSON.parse(
                    compatibility
                );
            }

        } catch (error) {

            console.warn(
                "Could not read studyData.",
                error
            );
        }
    }

    return normalizePlan(plan);
}

function normalizePlan(plan) {

    if (!plan || typeof plan !== "object") {

        return {
            examType: "",
            examDate: null,
            subjects: [],
            topics: [],
            studyHours: 0,
            difficulty: "",
            daysLeft: 0
        };
    }

    return {

        examType:
            plan.examType || "",

        examDate:
            plan.examDate || null,

        subjects:
            Array.isArray(plan.subjects)
                ? plan.subjects
                : [],

        topics:
            Array.isArray(plan.topics)
                ? plan.topics
                : [],

        studyHours:
            Number(plan.studyHours) || 0,

        difficulty:
            plan.difficulty || "",

        daysLeft:
            Number(plan.daysLeft) || 0
    };
}

/* =========================================================
   PROGRESS
========================================================= */

function getCompletedTopics() {

    try {

        const value =
            localStorage.getItem(
                "studyMindCompletedTopics"
            );

        if (!value) {
            return [];
        }

        const parsed =
            JSON.parse(value);

        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch {

        return [];
    }
}

function getProgress() {

    const plan =
        getStudyPlan();

    const topics =
        Array.isArray(plan.topics)
            ? plan.topics
            : [];

    const completed =
        getCompletedTopics();

    const total =
        topics.length;

    const completedCount =
        completed.length;

    const percentage =
        total > 0
            ? Math.round(
                (completedCount / total) * 100
            )
            : 0;

    return {
        total,
        completed: completedCount,
        percentage
    };
}

/* =========================================================
   AI QUESTION COUNTER
========================================================= */

function getAIQuestionCount() {

    const value =
        Number(
            localStorage.getItem(
                AI_COUNT_KEY
            )
        );

    if (
        !Number.isFinite(value) ||
        value < 0
    ) {
        return 0;
    }

    return value;
}

function getRemainingAIQuestions() {

    if (isPremiumUser()) {
        return Infinity;
    }

    return Math.max(
        0,
        FREE_AI_LIMIT -
        getAIQuestionCount()
    );
}

function updateAIUsage() {

    const badge =
        $("aiCountBadge");

    if (!badge) {
        return;
    }

    if (isPremiumUser()) {

        badge.textContent =
            "Premium — Unlimited";

        return;
    }

    const used =
        getAIQuestionCount();

    badge.textContent =
        `${used}/${FREE_AI_LIMIT} used`;
}

/* =========================================================
   PREMIUM
========================================================= */

function isPremiumUser() {

    /*
       This supports several possible premium
       flags without breaking the free version.
    */

    try {

        const premium =
            localStorage.getItem(
                "studyMindPremium"
            );

        if (
            premium === "true" ||
            premium === "1"
        ) {
            return true;
        }

        const subscription =
            localStorage.getItem(
                "studyMindSubscription"
            );

        if (
            subscription === "premium" ||
            subscription === "pro"
        ) {
            return true;
        }

    } catch {}

    return false;
}

/* =========================================================
   CHECK AI LIMIT
========================================================= */

function canAskAI() {

    if (isPremiumUser()) {
        return true;
    }

    return (
        getAIQuestionCount() <
        FREE_AI_LIMIT
    );
}

/* =========================================================
   RECORD AI REQUEST
========================================================= */

function recordAIQuestion() {

    if (isPremiumUser()) {
        return true;
    }

    if (!canAskAI()) {
        return false;
    }

    const newCount =
        getAIQuestionCount() + 1;

    localStorage.setItem(
        AI_COUNT_KEY,
        String(newCount)
    );

    updateAIUsage();

    return true;
}

/* =========================================================
   LIMIT MESSAGE
========================================================= */

function showAILimitMessage(target) {

    if (!target) {
        return;
    }

    target.innerHTML = `
        <div>
            <strong>You've used all 5 free AI questions.</strong>
            <br><br>
            You can continue using the rest of StudyMind AI,
            or upgrade to Premium for unlimited AI support.
        </div>
    `;
}

/* =========================================================
   AUTH MESSAGE
========================================================= */

function showAuthenticationMessage() {

    const response =
        $("aiResponse");

    if (!response) {
        return;
    }

    response.innerHTML = `
        <strong>Please log in to use StudyMind AI.</strong>
        <br><br>
        Your AI support is connected to your
        StudyMind account and study plan.
    `;
}

/* =========================================================
   BUILD STUDY CONTEXT
========================================================= */

function buildStudyContext() {

    const plan =
        getStudyPlan();

    const progress =
        getProgress();

    const completed =
        getCompletedTopics();

    return {

        examType:
            plan.examType || "Not specified",

        examDate:
            plan.examDate || "Not specified",

        daysLeft:
            plan.daysLeft || 0,

        subjects:
            plan.subjects,

        topics:
            plan.topics,

        studyHours:
            plan.studyHours,

        difficulty:
            plan.difficulty,

        completedTopics:
            completed,

        totalTopics:
            progress.total,

        completedTopicCount:
            progress.completed,

        progressPercentage:
            progress.percentage
    };
}

/* =========================================================
   AI API
========================================================= */

async function callStudyMindAI(question, mode = "chat") {

    const context =
        buildStudyContext();

    const prompt = `
You are StudyMind AI, a personalized study assistant.

Help the student using their actual StudyMind study plan
and progress.

IMPORTANT:
- Base your response on the supplied study context.
- Do not invent subjects or topics that are not in the plan.
- Give practical, student-friendly advice.
- Keep the response clear and organized.
- If the student asks what to study next, prioritize based
  on progress, upcoming exam date, and unfinished topics.
- If information is missing, say so instead of inventing it.

STUDY PLAN:
${JSON.stringify(context, null, 2)}

REQUEST MODE:
${mode}

STUDENT REQUEST:
${question}
`;

    const response =
        await fetch(
            "/api/ask-ai",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    message: question,
                    prompt,
                    question,
                    mode,
                    studyPlan: context
                })
            }
        );

    if (!response.ok) {

        let errorMessage =
            `AI server error (${response.status}).`;

        try {

            const errorData =
                await response.json();

            if (
                errorData &&
                errorData.error
            ) {
                errorMessage =
                    errorData.error;
            }

        } catch {}

        throw new Error(
            errorMessage
        );
    }

    const data =
        await response.json();

    const answer =
        extractAIAnswer(data);

    if (!answer) {

        throw new Error(
            "The AI server returned an empty response."
        );
    }

    return answer;
}

/* =========================================================
   RESPONSE PARSER
========================================================= */

function extractAIAnswer(data) {

    if (!data) {
        return "";
    }

    if (typeof data === "string") {
        return data;
    }

    if (
        typeof data.answer === "string"
    ) {
        return data.answer;
    }

    if (
        typeof data.response === "string"
    ) {
        return data.response;
    }

    if (
        typeof data.message === "string"
    ) {
        return data.message;
    }

    if (
        typeof data.content === "string"
    ) {
        return data.content;
    }

    if (
        data.message &&
        typeof data.message.content === "string"
    ) {
        return data.message.content;
    }

    if (
        data.choices &&
        data.choices[0]
    ) {

        const choice =
            data.choices[0];

        if (
            choice.message &&
            typeof choice.message.content === "string"
        ) {
            return choice.message.content;
        }

        if (
            typeof choice.text === "string"
        ) {
            return choice.text;
        }
    }

    return "";
}

/* =========================================================
   ASK STUDYMIND AI
========================================================= */

async function askStudyMindAI() {

    if (aiRequestInProgress) {
        return;
    }

    const input =
        $("aiQuestion");

    const response =
        $("aiResponse");

    const button =
        $("askAIButton");

    if (!input || !response) {
        return;
    }

    if (!isAuthenticated) {

        showAuthenticationMessage();

        return;
    }

    const question =
        input.value.trim();

    if (!question) {

        response.textContent =
            "Please enter a question first.";

        input.focus();

        return;
    }

    if (!canAskAI()) {

        showAILimitMessage(
            response
        );

        return;
    }

    aiRequestInProgress = true;

    if (button) {

        button.disabled = true;

        button.textContent =
            "⏳ Thinking...";
    }

    response.innerHTML =
        "StudyMind AI is thinking...";

    try {

        const answer =
            await callStudyMindAI(
                question,
                "chat"
            );

        /*
           Only count the question after
           the AI successfully responds.
        */
        recordAIQuestion();

        response.innerHTML =
            formatAIResponse(answer);

    } catch (error) {

        console.error(
            "StudyMind AI error:",
            error
        );

        response.innerHTML = `
            <strong>StudyMind AI couldn't respond.</strong>
            <br><br>
            ${escapeHTML(
                error.message ||
                "Please try again."
            )}
        `;

    } finally {

        aiRequestInProgress = false;

        if (button) {

            button.disabled = false;

            button.textContent =
                "🤖 Ask AI";
        }

        updateAIUsage();
    }
}

/* =========================================================
   PROGRESS ANALYSIS
========================================================= */

async function analyzeProgress() {

    if (aiRequestInProgress) {
        return;
    }

    const response =
        $("aiAdviceText");

    const button =
        $("analyzeProgressButton");

    if (!response) {
        return;
    }

    if (!isAuthenticated) {

        response.innerHTML =
            "<strong>Please log in to analyze your progress.</strong>";

        return;
    }

    if (!canAskAI()) {

        showAILimitMessage(
            response
        );

        return;
    }

    aiRequestInProgress = true;

    if (button) {

        button.disabled = true;

        button.textContent =
            "⏳ Analyzing...";
    }

    response.innerHTML =
        "StudyMind AI is analyzing your study plan and progress...";

    const question = `
Analyze my current StudyMind study progress.

Tell me:
1. How much of my study plan I have completed.
2. Which areas I should prioritize.
3. What I should study next.
4. How I can improve my preparation for my upcoming exam.

Use only the subjects and topics in my actual study plan.
`;

    try {

        const answer =
            await callStudyMindAI(
                question,
                "progress_analysis"
            );

        recordAIQuestion();

        response.innerHTML =
            formatAIResponse(answer);

    } catch (error) {

        console.error(
            "Progress analysis error:",
            error
        );

        response.innerHTML = `
            <strong>Progress analysis failed.</strong>
            <br><br>
            ${escapeHTML(
                error.message ||
                "Please try again."
            )}
        `;

    } finally {

        aiRequestInProgress = false;

        if (button) {

            button.disabled = false;

            button.textContent =
                "🔍 Analyze My Progress";
        }

        updateAIUsage();
    }
}

/* =========================================================
   FORMAT AI RESPONSE
========================================================= */

function formatAIResponse(text) {

    if (!text) {
        return "";
    }

    let safe =
        escapeHTML(text);

    safe =
        safe.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );

    safe =
        safe.replace(
            /^### (.*?)$/gm,
            "<h3>$1</h3>"
        );

    safe =
        safe.replace(
            /^## (.*?)$/gm,
            "<h3>$1</h3>"
        );

    safe =
        safe.replace(
            /^# (.*?)$/gm,
            "<h3>$1</h3>"
        );

    safe =
        safe.replace(
            /^- (.*?)$/gm,
            "• $1"
        );

    safe =
        safe.replace(
            /\n/g,
            "<br>"
        );

    return safe;
}

/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    /*
       The HTML already calls these functions
       through onclick attributes.
    */
}

function openHome() {
    window.location.href =
        "home.html";
}

function openNewStudyPlan() {
    window.location.href =
        "home.html#generator";
}

function openSummarizer() {
    window.location.href =
        "summarizer.html";
}

function openStudyStreak() {
    window.location.href =
        "study-streak.html";
}

function openStudyScore() {
    window.location.href =
        "study-score.html";
}

/* =========================================================
   LOGOUT
========================================================= */

async function logoutStudyMind() {

    try {

        const client =
            window.supabaseClient;

        if (
            client &&
            client.auth
        ) {

            await client.auth.signOut();
        }

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );
    }

    window.location.href =
        "login.html";
}

/* =========================================================
   THEME
========================================================= */

function setupTheme() {

    const button =
        $("themeButton");

    const savedTheme =
        localStorage.getItem(
            THEME_KEY
        );

    const theme =
        savedTheme === "light"
            ? "light"
            : "dark";

    applyTheme(theme);

    if (button) {

        button.addEventListener(
            "click",
            toggleTheme
        );
    }
}

function applyTheme(theme) {

    document.body.classList.toggle(
        "light-mode",
        theme === "light"
    );

    localStorage.setItem(
        THEME_KEY,
        theme
    );

    updateThemeButton(theme);
}

function updateThemeButton(theme) {

    const button =
        $("themeButton");

    if (!button) {
        return;
    }

    button.textContent =
        theme === "light"
            ? "☀️ Light Mode"
            : "🌙 Dark Mode";
}

function toggleTheme() {

    const isLight =
        document.body.classList.contains(
            "light-mode"
        );

    applyTheme(
        isLight
            ? "dark"
            : "light"
    );
}

/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.askStudyMindAI =
    askStudyMindAI;

window.analyzeProgress =
    analyzeProgress;

window.openHome =
    openHome;

window.openNewStudyPlan =
    openNewStudyPlan;

window.openSummarizer =
    openSummarizer;

window.openStudyStreak =
    openStudyStreak;

window.openStudyScore =
    openStudyScore;

window.logoutStudyMind =
    logoutStudyMind;

