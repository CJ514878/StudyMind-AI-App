/* =========================================================
   STUDYMIND AI — AI SUPPORT
   FULL REPLACEMENT
   Matches ai-support.html exactly
========================================================= */


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

let lastAIQuestion = "";
let lastAIMode = "chat";

let mathJaxPromise = null;


/* =========================================================
   DOM HELPER
========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", async function () {

    console.log("StudyMind AI Support initializing...");

    initializeTheme();
    initializeNavigation();
    initializeAIButtons();

    await checkAuthentication();

    updateAIUsageDisplay();

    /*
     * Load MathJax in the background.
     */
    loadMathJax()
        .then(function () {
            console.log("StudyMind AI MathJax ready.");
        })
        .catch(function (error) {
            console.warn(
                "MathJax could not be loaded:",
                error
            );
        });

});


/* =========================================================
   NAVIGATION
========================================================= */


/*
 * HOME
 */

function openHome() {

    window.location.href = "home.html";
}


/*
 * NEW STUDY PLAN
 */

function openNewStudyPlan() {

    /*
     * Change this filename only if your actual
     * new-study-plan page has a different name.
     */

    window.location.href = "index.html";
}


/*
 * SUMMARIZER
 */

function openSummarizer() {

    window.location.href = "summarizer.html";
}


/*
 * STUDY STREAK
 */

function openStudyStreak() {

    /*
     * If your streak is displayed on another page,
     * change this filename to that page.
     */

    window.location.href = "study-streak.html";
}


/*
 * STUDY SCORE
 */

function openStudyScore() {

    /*
     * If Study Score is part of dashboard,
     * take the user there.
     */

    window.location.href = "dashboard.html";
}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutStudyMind() {

    try {

        if (
            window.supabaseClient &&
            window.supabaseClient.auth
        ) {

            const {
                error
            } =
                await window.supabaseClient.auth.signOut();

            if (error) {
                console.warn(
                    "Supabase logout warning:",
                    error
                );
            }
        }

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

    } finally {

        /*
         * Clear only temporary AI state.
         *
         * We deliberately do NOT clear the study plan.
         */

        lastAIQuestion = "";
        lastAIMode = "chat";

        window.location.href =
            "login.html";
    }
}


/*
 * Compatibility alias.
 */

function logout() {
    logoutStudyMind();
}


/* =========================================================
   AUTHENTICATION
========================================================= */

async function checkAuthentication() {

    try {

        if (
            !window.supabaseClient ||
            !window.supabaseClient.auth
        ) {

            console.warn(
                "Supabase client unavailable."
            );

            isAuthenticated = false;
            currentUser = null;

            return;
        }

        const {
            data,
            error
        } =
            await window.supabaseClient.auth.getUser();

        if (error) {
            throw error;
        }

        currentUser =
            data?.user || null;

        isAuthenticated =
            !!currentUser;

        console.log(
            "AI Support authentication:",
            isAuthenticated
        );

    } catch (error) {

        console.error(
            "Authentication check failed:",
            error
        );

        currentUser = null;
        isAuthenticated = false;
    }
}


/* =========================================================
   STUDY PLAN
========================================================= */

function getStudyPlan() {

    let plan = null;

    try {

        const primary =
            localStorage.getItem(
                PLAN_KEY
            );

        if (primary) {

            plan =
                JSON.parse(primary);

        } else {

            const compatibility =
                localStorage.getItem(
                    COMPAT_PLAN_KEY
                );

            if (compatibility) {

                plan =
                    JSON.parse(
                        compatibility
                    );
            }
        }

    } catch (error) {

        console.warn(
            "Could not read study plan:",
            error
        );

        return null;
    }

    if (!plan) {
        return null;
    }

    const subjects =
        Array.isArray(plan.subjects)
            ? plan.subjects
            : [];

    const topics =
        Array.isArray(plan.topics)
            ? plan.topics
            : [];

    return {

        ...plan,

        examType:
            plan.examType ||
            plan.exam ||
            "General Examination",

        examDate:
            plan.examDate ||
            plan.testDate ||
            null,

        subjects,

        topics,

        studyHours:
            plan.studyHours ||
            plan.dailyHours ||
            0,

        difficulty:
            plan.difficulty ||
            "Medium",

        daysLeft:
            calculateDaysLeft(
                plan.examDate ||
                plan.testDate
            )
    };
}


/* =========================================================
   DAYS LEFT
========================================================= */

function calculateDaysLeft(dateValue) {

    if (!dateValue) {
        return null;
    }

    const examDate =
        new Date(dateValue);

    if (
        Number.isNaN(
            examDate.getTime()
        )
    ) {
        return null;
    }

    const now =
        new Date();

    const difference =
        examDate.getTime() -
        now.getTime();

    return Math.max(
        0,
        Math.ceil(
            difference /
            (1000 * 60 * 60 * 24)
        )
    );
}


/* =========================================================
   COMPLETED TOPICS
========================================================= */

function getCompletedTopics() {

    try {

        const saved =
            localStorage.getItem(
                "studyMindCompletedTopics"
            );

        if (!saved) {
            return [];
        }

        const parsed =
            JSON.parse(saved);

        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch (error) {

        console.warn(
            "Could not read completed topics:",
            error
        );

        return [];
    }
}


/* =========================================================
   PROGRESS
========================================================= */

function getProgress() {

    const plan =
        getStudyPlan();

    const topics =
        plan?.topics || [];

    const completedTopics =
        getCompletedTopics();

    const total =
        topics.length;

    const completed =
        completedTopics.length;

    const percentage =
        total > 0
            ? Math.round(
                (completed / total) * 100
            )
            : 0;

    return {
        total,
        completed,
        percentage
    };
}


/* =========================================================
   AI USAGE
========================================================= */

function getAIQuestionCount() {

    try {

        const value =
            Number.parseInt(
                localStorage.getItem(
                    AI_COUNT_KEY
                ) || "0",
                10
            );

        return Number.isFinite(value)
            ? value
            : 0;

    } catch {

        return 0;
    }
}


/* =========================================================
   UPDATE AI COUNT
========================================================= */

function updateAIUsageDisplay() {

    const count =
        getAIQuestionCount();

    const badge =
        $("aiCountBadge");

    if (badge) {

        badge.textContent =
            `${count}/${FREE_AI_LIMIT} used`;

        /*
         * Professional visual state.
         */

        badge.classList.toggle(
            "ai-limit-reached",
            count >= FREE_AI_LIMIT
        );
    }
}


/* =========================================================
   CAN ASK AI?
========================================================= */

function canAskAI() {

    return (
        getAIQuestionCount() <
        FREE_AI_LIMIT
    );
}


/* =========================================================
   RECORD QUESTION
========================================================= */

function recordAIQuestion() {

    const current =
        getAIQuestionCount();

    const next =
        current + 1;

    localStorage.setItem(
        AI_COUNT_KEY,
        String(next)
    );

    updateAIUsageDisplay();
}


/* =========================================================
   PREMIUM MESSAGE
========================================================= */

function showPremiumMessage() {

    const response =
        $("aiResponse");

    if (!response) {
        return;
    }

    response.innerHTML = `
        <div class="ai-limit-message">

            <div class="ai-limit-icon">
                🔒
            </div>

            <h3>
                Free AI limit reached
            </h3>

            <p>
                You've used all
                <strong>${FREE_AI_LIMIT}</strong>
                free AI questions for today.
            </p>

            <p>
                Premium access can provide
                additional AI study support.
            </p>

        </div>
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

    if (!plan) {

        return `
STUDY PLAN STATUS

The student does not currently have a saved study plan.

Give useful general study guidance.
Do not invent subjects, topics, exam dates, or progress.
`;
    }

    const subjects =
        plan.subjects.length
            ? plan.subjects.join(", ")
            : "None listed";

    const topics =
        plan.topics.length
            ? plan.topics.join(", ")
            : "None listed";

    const completed =
        getCompletedTopics();

    const completedText =
        completed.length
            ? completed.join(", ")
            : "None yet";

    return `
STUDENT STUDY CONTEXT

Exam:
${plan.examType}

Exam date:
${plan.examDate || "Not specified"}

Days remaining:
${plan.daysLeft ?? "Not specified"}

Subjects:
${subjects}

Topics:
${topics}

Study hours per day:
${plan.studyHours || "Not specified"}

Difficulty:
${plan.difficulty}

Progress:
${progress.completed}/${progress.total}
topics completed (${progress.percentage}%)

Completed topics:
${completedText}
`;
}


/* =========================================================
   BUILD AI PROMPT
========================================================= */

function buildAIPrompt(
    question,
    mode = "chat"
) {

    const context =
        buildStudyContext();

    return `
You are StudyMind AI, a professional academic
study assistant.

Your purpose is to help students understand concepts,
revise effectively, identify weak areas, and prepare
for examinations.

${context}

USER REQUEST:
${question}

RESPONSE MODE:
${mode}

IMPORTANT RULES:

1. Be accurate, clear, encouraging and educational.

2. Personalize advice using the study context.

3. Never invent study-plan information.

4. Use clear headings and bullet points where useful.

5. Explain difficult concepts step by step.

6. When mathematics is needed, ALWAYS use LaTeX.

7. Use \\(...\\) for inline mathematics.

8. Use \\[...\\] for standalone/display mathematics.

9. Put standalone equations on their own line.

10. Example:

Distance between two points:

\\[
d=\\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}
\\]

11. Example of inline mathematics:

The slope is
\\(m=\\frac{y_2-y_1}{x_2-x_1}\\).

12. Never output raw HTML.

13. Do not use unnecessary markdown tables.

14. Keep responses readable on desktop and mobile.

15. If asked what to study next, prioritize unfinished
topics and relevant exam topics.

16. If asked to analyze progress, discuss:
    - current progress
    - strengths
    - areas needing attention
    - recommended next steps

17. Do not claim to have completed actions that you
did not actually perform.

Now answer the student's request.
`;
}


/* =========================================================
   CALL API
========================================================= */

async function callStudyMindAI(
    question,
    mode = "chat"
) {

    if (aiRequestInProgress) {

        throw new Error(
            "An AI request is already in progress."
        );
    }

    aiRequestInProgress = true;

    try {

        const prompt =
            buildAIPrompt(
                question,
                mode
            );

        console.log(
            "Sending StudyMind AI request..."
        );

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
                        message: prompt,
                        mode: mode
                    })
                }
            );

        let data;

        try {

            data =
                await response.json();

        } catch {

            throw new Error(
                "The AI server returned an invalid response."
            );
        }

        console.log(
            "StudyMind AI API response:",
            data
        );

        if (!response.ok) {

            throw new Error(
                data?.error ||
                data?.message ||
                `AI server error (${response.status})`
            );
        }

        if (
            data?.success === false
        ) {

            throw new Error(
                data?.error ||
                "The AI request failed."
            );
        }

        const answer =
            extractAIAnswer(data);

        if (!answer) {

            throw new Error(
                "The AI server returned an empty response."
            );
        }

        return answer;

    } finally {

        aiRequestInProgress = false;
    }
}


/* =========================================================
   EXTRACT API RESPONSE
========================================================= */

function extractAIAnswer(data) {

    if (!data) {
        return "";
    }

    /*
     * Your ask-ai.js returns:
     *
     * {
     *     success: true,
     *     reply: "..."
     * }
     *
     * reply is therefore the FIRST thing checked.
     */

    const values = [

        data.reply,

        data.answer,

        data.response,

        data.content,

        data.output_text,

        data.result,

        data.message
    ];

    for (
        const value of values
    ) {

        if (
            typeof value === "string" &&
            value.trim()
        ) {

            return value.trim();
        }
    }


    /*
     * OpenAI-style compatibility.
     */

    if (
        Array.isArray(
            data.choices
        ) &&
        data.choices.length
    ) {

        const choice =
            data.choices[0];

        if (
            typeof
            choice?.message?.content ===
            "string"
        ) {

            return
                choice.message.content.trim();
        }

        if (
            typeof choice?.text ===
            "string"
        ) {

            return
                choice.text.trim();
        }
    }


    return "";
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================================
   FORMAT AI RESPONSE
========================================================= */

function formatAIResponse(text) {

    if (!text) {
        return "";
    }

    /*
     * SECURITY:
     *
     * Escape AI output before inserting it
     * into innerHTML.
     *
     * LaTeX delimiters remain intact.
     */

    let formatted =
        escapeHTML(text);


    /* =============================================
       BOLD
    ============================================= */

    formatted =
        formatted.replace(
            /\*\*(.+?)\*\*/g,
            "<strong>$1</strong>"
        );


    /* =============================================
       HEADINGS
    ============================================= */

    formatted =
        formatted.replace(
            /^###\s+(.+)$/gm,
            "<h4>$1</h4>"
        );

    formatted =
        formatted.replace(
            /^##\s+(.+)$/gm,
            "<h3>$1</h3>"
        );

    formatted =
        formatted.replace(
            /^#\s+(.+)$/gm,
            "<h2>$1</h2>"
        );


    /* =============================================
       BULLETS
    ============================================= */

    formatted =
        formatted.replace(
            /^[\t ]*[-*]\s+(.+)$/gm,
            "<div class=\"ai-bullet\">$1</div>"
        );


    /* =============================================
       NUMBERED LISTS
    ============================================= */

    formatted =
        formatted.replace(
            /^(\d+)\.\s+(.+)$/gm,
            "<div class=\"ai-numbered\">\
<span>$1.</span> $2</div>"
        );


    /* =============================================
       CLEAN EXCESSIVE LINE BREAKS
    ============================================= */

    formatted =
        formatted.replace(
            /\n{3,}/g,
            "\n\n"
        );


    /*
     * Convert remaining newlines.
     *
     * MathJax can still process the LaTeX
     * delimiters after insertion.
     */

    formatted =
        formatted.replace(
            /\n/g,
            "<br>"
        );


    return formatted;
}


/* =========================================================
   DISPLAY AI RESPONSE
========================================================= */

async function displayAIResponse(text) {

    const response =
        $("aiResponse");

    if (!response) {

        console.warn(
            "aiResponse element not found."
        );

        return;
    }

    response.classList.add(
        "ai-response"
    );

    response.innerHTML =
        formatAIResponse(text);


    /*
     * Allow DOM to update before
     * MathJax processes the content.
     */

    await new Promise(
        function (resolve) {
            requestAnimationFrame(
                resolve
            );
        }
    );


    await renderMath(response);
}


/* =========================================================
   LOADING STATE
========================================================= */

function showAILoading() {

    const response =
        $("aiResponse");

    if (!response) {
        return;
    }

    response.innerHTML = `
        <div class="ai-loading">

            <div class="ai-loading-dots">

                <span></span>
                <span></span>
                <span></span>

            </div>

            <span>
                StudyMind AI is thinking...
            </span>

        </div>
    `;
}


/* =========================================================
   ERROR STATE
========================================================= */

function showAIError(error) {

    const response =
        $("aiResponse");

    if (!response) {
        return;
    }

    const message =
        error?.message ||
        "Something went wrong while contacting StudyMind AI.";

    response.innerHTML = `
        <div class="ai-error">

            <strong>
                StudyMind AI couldn't respond.
            </strong>

            <p>
                ${escapeHTML(message)}
            </p>

            <button
                type="button"
                class="ai-retry-button"
                onclick="retryLastAIRequest()"
            >
                Try Again
            </button>

        </div>
    `;
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

    if (!input) {

        console.error(
            "aiQuestion input not found."
        );

        return;
    }

    const question =
        input.value.trim();

    if (!question) {

        input.focus();

        return;
    }


    /*
     * FREE LIMIT
     */

    if (!canAskAI()) {

        showPremiumMessage();

        return;
    }


    lastAIQuestion =
        question;

    lastAIMode =
        "chat";


    showAILoading();


    try {

        const answer =
            await callStudyMindAI(
                question,
                "chat"
            );


        await displayAIResponse(
            answer
        );


        recordAIQuestion();


        /*
         * Clear input after successful
         * AI response.
         */

        input.value = "";

    } catch (error) {

        console.error(
            "StudyMind AI error:",
            error
        );

        showAIError(error);
    }
}


/* =========================================================
   QUICK QUESTION
========================================================= */

async function useQuickQuestion(
    question
) {

    const input =
        $("aiQuestion");

    if (!input) {
        return;
    }


    /*
     * Put the question into the input.
     */

    input.value =
        question;


    input.focus();


    /*
     * Scroll to AI assistant.
     */

    input.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


/* =========================================================
   QUICK QUESTION — SEND VERSION
========================================================= */

async function sendQuickQuestion(
    question
) {

    if (!question) {
        return;
    }

    if (!canAskAI()) {

        showPremiumMessage();

        return;
    }

    lastAIQuestion =
        question;

    lastAIMode =
        "quick_action";

    showAILoading();

    try {

        const answer =
            await callStudyMindAI(
                question,
                "quick_action"
            );

        await displayAIResponse(
            answer
        );

        recordAIQuestion();

    } catch (error) {

        console.error(
            "Quick AI action failed:",
            error
        );

        showAIError(error);
    }
}


/* =========================================================
   PROGRESS ANALYSIS
========================================================= */

async function analyzeProgress() {

    if (aiRequestInProgress) {
        return;
    }

    if (!canAskAI()) {

        showPremiumMessage();

        return;
    }

    const progress =
        getProgress();

    const question = `
Analyze my current StudyMind progress.

Current progress:
${progress.completed}/${progress.total}
topics completed (${progress.percentage}%).

Please explain:

1. What I am doing well.
2. What needs improvement.
3. Which topics I should prioritize.
4. What I should do in my next study session.

Give practical and specific advice.
`;

    lastAIQuestion =
        question;

    lastAIMode =
        "progress_analysis";


    showAILoading();


    try {

        const answer =
            await callStudyMindAI(
                question,
                "progress_analysis"
            );


        await displayAIResponse(
            answer
        );


        recordAIQuestion();

    } catch (error) {

        console.error(
            "Progress analysis failed:",
            error
        );

        showAIError(error);
    }
}


/* =========================================================
   RETRY
========================================================= */

async function retryLastAIRequest() {

    if (!lastAIQuestion) {
        return;
    }

    if (!canAskAI()) {

        showPremiumMessage();

        return;
    }

    showAILoading();

    try {

        const answer =
            await callStudyMindAI(
                lastAIQuestion,
                lastAIMode
            );

        await displayAIResponse(
            answer
        );

        recordAIQuestion();

    } catch (error) {

        console.error(
            "AI retry failed:",
            error
        );

        showAIError(error);
    }
}


/* =========================================================
   INITIALIZE AI BUTTONS
========================================================= */

function initializeAIButtons() {

    const askButton =
        $("askAIButton");

    if (
        askButton &&
        !askButton.dataset.bound
    ) {

        askButton.addEventListener(
            "click",
            askStudyMindAI
        );

        askButton.dataset.bound =
            "true";
    }


    const analyzeButton =
        $("analyzeProgressButton");

    if (
        analyzeButton &&
        !analyzeButton.dataset.bound
    ) {

        analyzeButton.addEventListener(
            "click",
            analyzeProgress
        );

        analyzeButton.dataset.bound =
            "true";
    }
}


/* =========================================================
   ENTER KEY
========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key !== "Enter" ||
            event.shiftKey
        ) {
            return;
        }

        const active =
            document.activeElement;

        if (
            active &&
            active.id ===
                "aiQuestion"
        ) {

            event.preventDefault();

            askStudyMindAI();
        }
    }
);


/* =========================================================
   THEME
========================================================= */

function initializeTheme() {

    const savedTheme =
        localStorage.getItem(
            THEME_KEY
        );

    if (
        savedTheme === "light"
    ) {

        document.body.classList.add(
            "light-mode"
        );

    } else {

        document.body.classList.remove(
            "light-mode"
        );
    }

    updateThemeButton();
}


/* =========================================================
   THEME BUTTON
========================================================= */

function updateThemeButton() {

    const button =
        $("themeButton");

    if (!button) {
        return;
    }

    const isLight =
        document.body.classList.contains(
            "light-mode"
        );

    button.textContent =
        isLight
            ? "🌙 Dark Mode"
            : "☀️ Light Mode";
}


/* =========================================================
   TOGGLE THEME
========================================================= */

function toggleTheme() {

    const isLight =
        document.body.classList.toggle(
            "light-mode"
        );

    localStorage.setItem(
        THEME_KEY,
        isLight
            ? "light"
            : "dark"
    );

    updateThemeButton();
}


/* =========================================================
   NAVIGATION INITIALIZATION
========================================================= */

function initializeNavigation() {

    const themeButton =
        $("themeButton");

    if (
        themeButton &&
        !themeButton.dataset.bound
    ) {

        themeButton.addEventListener(
            "click",
            toggleTheme
        );

        themeButton.dataset.bound =
            "true";
    }
}


/* =========================================================
   MATHJAX LOADER
========================================================= */

function loadMathJax() {

    if (
        window.MathJax &&
        typeof window.MathJax.typesetPromise ===
            "function"
    ) {

        return Promise.resolve();
    }


    if (mathJaxPromise) {
        return mathJaxPromise;
    }


    /*
     * MathJax configuration.
     *
     * Only \(...\) and \[...\] are used.
     */

    window.MathJax = {

        tex: {

            inlineMath: [
                ["\\(", "\\)"]
            ],

            displayMath: [
                ["\\[", "\\]"]
            ],

            processEscapes: false,

            processEnvironments: true
        },

        svg: {

            fontCache: "global"
        },

        options: {

            skipHtmlTags: [
                "script",
                "noscript",
                "style",
                "textarea",
                "pre",
                "code"
            ]
        }
    };


    mathJaxPromise =
        new Promise(
            function (
                resolve,
                reject
            ) {

                const existing =
                    document.querySelector(
                        'script[src*="mathjax@3"]'
                    );


                if (existing) {

                    let attempts = 0;

                    const interval =
                        setInterval(
                            function () {

                                attempts++;

                                if (
                                    window.MathJax &&
                                    typeof
                                    window.MathJax
                                        .typesetPromise ===
                                        "function"
                                ) {

                                    clearInterval(
                                        interval
                                    );

                                    resolve();
                                }


                                if (
                                    attempts > 100
                                ) {

                                    clearInterval(
                                        interval
                                    );

                                    reject(
                                        new Error(
                                            "MathJax initialization timeout."
                                        )
                                    );
                                }

                            },
                            100
                        );

                    return;
                }


                const script =
                    document.createElement(
                        "script"
                    );

                script.src =
                    "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js";

                script.async =
                    true;


                script.onload =
                    function () {

                        let attempts = 0;

                        const interval =
                            setInterval(
                                function () {

                                    attempts++;

                                    if (
                                        window.MathJax &&
                                        typeof
                                        window.MathJax
                                            .typesetPromise ===
                                        "function"
                                    ) {

                                        clearInterval(
                                            interval
                                        );

                                        resolve();
                                    }


                                    if (
                                        attempts > 100
                                    ) {

                                        clearInterval(
                                            interval
                                        );

                                        reject(
                                            new Error(
                                                "MathJax initialization timeout."
                                            )
                                        );
                                    }

                                },
                                50
                            );
                    };


                script.onerror =
                    function () {

                        reject(
                            new Error(
                                "Could not load MathJax."
                            )
                        );
                    };


                document.head.appendChild(
                    script
                );
            }
        );


    return mathJaxPromise;
}


/* =========================================================
   RENDER MATH
========================================================= */

async function renderMath(element) {

    if (!element) {
        return;
    }

    try {

        await loadMathJax();


        if (
            window.MathJax &&
            typeof window.MathJax
                .typesetPromise ===
                "function"
        ) {

            if (
                typeof window.MathJax
                    .typesetClear ===
                "function"
            ) {

                window.MathJax.typesetClear(
                    [element]
                );
            }


            await window.MathJax
                .typesetPromise(
                    [element]
                );
        }

    } catch (error) {

        console.warn(
            "Math rendering failed:",
            error
        );
    }
}


/* =========================================================
   PROFESSIONAL AI RESPONSE STYLES
========================================================= */

(function addAIStyles() {

    if (
        $("studymind-ai-support-styles")
    ) {
        return;
    }

    const style =
        document.createElement(
            "style"
        );

    style.id =
        "studymind-ai-support-styles";

    style.textContent = `

        /* =========================================
           AI RESPONSE
        ========================================= */

        .ai-response {

            line-height: 1.75;

            font-size: 1rem;

            overflow-wrap: break-word;
        }


        /* =========================================
           MATH
        ========================================= */

        .ai-response mjx-container {

            font-size: 1.08em;
        }


        .ai-response
        mjx-container[display="true"] {

            display: block;

            max-width: 100%;

            overflow-x: auto;

            overflow-y: hidden;

            margin: 1.35rem 0 !important;

            padding: 0.75rem 0;

            text-align: center;
        }


        /* =========================================
           HEADINGS
        ========================================= */

        .ai-response h2 {

            margin-top: 1.5rem;

            margin-bottom: 0.7rem;

            font-size: 1.35rem;
        }


        .ai-response h3 {

            margin-top: 1.35rem;

            margin-bottom: 0.65rem;

            font-size: 1.2rem;
        }


        .ai-response h4 {

            margin-top: 1.15rem;

            margin-bottom: 0.55rem;

            font-size: 1.08rem;
        }


        /* =========================================
           BULLETS
        ========================================= */

        .ai-bullet {

            position: relative;

            padding-left: 1.35rem;

            margin: 0.4rem 0;
        }


        .ai-bullet::before {

            content: "•";

            position: absolute;

            left: 0;

            font-weight: 700;
        }


        /* =========================================
           NUMBERED ITEMS
        ========================================= */

        .ai-numbered {

            margin: 0.5rem 0;
        }


        .ai-numbered span {

            font-weight: 700;
        }


        /* =========================================
           LOADING
        ========================================= */

        .ai-loading {

            display: flex;

            align-items: center;

            gap: 0.7rem;

            padding: 1rem 0;
        }


        .ai-loading-dots {

            display: flex;

            gap: 4px;
        }


        .ai-loading-dots span {

            width: 7px;

            height: 7px;

            border-radius: 50%;

            background: currentColor;

            animation:
                studymindAIbounce
                1.2s infinite ease-in-out;
        }


        .ai-loading-dots span:nth-child(2) {

            animation-delay: 0.15s;
        }


        .ai-loading-dots span:nth-child(3) {

            animation-delay: 0.3s;
        }


        @keyframes studymindAIbounce {

            0%,
            80%,
            100% {

                transform:
                    translateY(0);

                opacity: 0.35;
            }

            40% {

                transform:
                    translateY(-5px);

                opacity: 1;
            }
        }


        /* =========================================
           ERROR
        ========================================= */

        .ai-error {

            padding: 1rem;

            border-radius: 12px;
        }


        .ai-error p {

            margin:
                0.5rem 0 0;
        }


        .ai-retry-button {

            margin-top: 0.8rem;

            padding:
                0.6rem 1rem;

            border: none;

            border-radius: 8px;

            cursor: pointer;

            font-weight: 600;
        }


        /* =========================================
           LIMIT MESSAGE
        ========================================= */

        .ai-limit-message {

            text-align: center;

            padding: 1.5rem;
        }


        .ai-limit-icon {

            font-size: 2rem;

            margin-bottom: 0.6rem;
        }


        /* =========================================
           LIMIT BADGE
        ========================================= */

        #aiCountBadge.ai-limit-reached {

            font-weight: 700;
        }


        /* =========================================
           MOBILE
        ========================================= */

        @media (max-width: 600px) {

            .ai-response {

                font-size: 0.96rem;
            }


            .ai-response
            mjx-container[display="true"] {

                font-size: 0.92em;

                margin:
                    1rem 0 !important;

                padding:
                    0.5rem 0;
            }
        }

    `;

    document.head.appendChild(
        style
    );

})();


/* =========================================================
   GLOBAL FUNCTIONS
   =========================================================
   These are REQUIRED because your HTML uses
   onclick="functionName()".
========================================================= */

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

window.logout =
    logout;

window.askStudyMindAI =
    askStudyMindAI;

window.useQuickQuestion =
    useQuickQuestion;

window.sendQuickQuestion =
    sendQuickQuestion;

window.analyzeProgress =
    analyzeProgress;

window.retryLastAIRequest =
    retryLastAIRequest;

window.toggleTheme =
    toggleTheme;

window.renderMath =
    renderMath;

window.formatAIResponse =
    formatAIResponse;


/* =========================================================
   DONE
========================================================= */

console.log(
    "StudyMind AI Support loaded successfully."
);
