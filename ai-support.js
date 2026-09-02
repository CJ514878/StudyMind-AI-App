/* =========================================================
   STUDYMIND AI — AI SUPPORT
   FULL REPLACEMENT
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


/* =========================================================
   DOM SHORTCUT
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    console.log("StudyMind AI Support initializing...");

    initializeTheme();
    initializeNavigation();
    initializeButtons();

    await checkAuthentication();

    updateAIUsageDisplay();

    /*
     * Load MathJax in the background.
     * This allows AI mathematical notation such as:
     *
     * \(x^2+y^2\)
     *
     * and
     *
     * \[
     * d=\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}
     * \]
     *
     * to render professionally.
     */
    loadMathJax()
        .then(() => {
            console.log("MathJax loaded successfully.");
        })
        .catch(error => {
            console.warn("MathJax could not be loaded:", error);
        });

});


/* =========================================================
   MATHJAX
   ========================================================= */

function loadMathJax() {

    if (
        window.MathJax &&
        typeof window.MathJax.typesetPromise === "function"
    ) {
        return Promise.resolve();
    }

    if (window.studyMindMathJaxPromise) {
        return window.studyMindMathJaxPromise;
    }

    /*
     * Only use \( \) for inline math and
     * \[ \] for display math.
     *
     * Avoiding $...$ prevents things such as
     * "$5" from being interpreted as mathematics.
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

    window.studyMindMathJaxPromise = new Promise((resolve, reject) => {

        const existingScript =
            document.querySelector(
                'script[src*="mathjax@3"]'
            );

        if (existingScript) {

            const checkLoaded = setInterval(() => {

                if (
                    window.MathJax &&
                    typeof window.MathJax.typesetPromise === "function"
                ) {
                    clearInterval(checkLoaded);
                    resolve();
                }

            }, 100);

            setTimeout(() => {

                clearInterval(checkLoaded);

                if (
                    window.MathJax &&
                    typeof window.MathJax.typesetPromise === "function"
                ) {
                    resolve();
                } else {
                    reject(
                        new Error("MathJax failed to initialize.")
                    );
                }

            }, 10000);

            return;
        }

        const script = document.createElement("script");

        script.src =
            "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js";

        script.async = true;

        script.onload = () => {

            const waitForMathJax = setInterval(() => {

                if (
                    window.MathJax &&
                    typeof window.MathJax.typesetPromise === "function"
                ) {
                    clearInterval(waitForMathJax);
                    resolve();
                }

            }, 50);

            setTimeout(() => {

                clearInterval(waitForMathJax);

                if (
                    window.MathJax &&
                    typeof window.MathJax.typesetPromise === "function"
                ) {
                    resolve();
                } else {
                    reject(
                        new Error("MathJax initialized incorrectly.")
                    );
                }

            }, 5000);
        };

        script.onerror = () => {
            reject(
                new Error("Unable to load MathJax.")
            );
        };

        document.head.appendChild(script);
    });

    return window.studyMindMathJaxPromise;
}


/* =========================================================
   RENDER MATHEMATICS
   ========================================================= */

async function renderMath(element) {

    if (!element) {
        return;
    }

    try {

        await loadMathJax();

        if (
            window.MathJax &&
            typeof window.MathJax.typesetPromise === "function"
        ) {

            /*
             * Clear previous MathJax rendering before
             * rendering the newly inserted response.
             */
            if (
                typeof window.MathJax.typesetClear === "function"
            ) {
                window.MathJax.typesetClear([element]);
            }

            await window.MathJax.typesetPromise([element]);
        }

    } catch (error) {

        console.warn(
            "Mathematical rendering failed:",
            error
        );
    }
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
                "Supabase client is not available."
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

        currentUser = data?.user || null;

        isAuthenticated = !!currentUser;

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

        const primaryPlan =
            localStorage.getItem(PLAN_KEY);

        if (primaryPlan) {

            plan = JSON.parse(primaryPlan);

        } else {

            const compatibilityPlan =
                localStorage.getItem(
                    COMPAT_PLAN_KEY
                );

            if (compatibilityPlan) {
                plan =
                    JSON.parse(
                        compatibilityPlan
                    );
            }
        }

    } catch (error) {

        console.warn(
            "Could not read study plan:",
            error
        );

        plan = null;
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
   CALCULATE DAYS LEFT
   ========================================================= */

function calculateDaysLeft(dateValue) {

    if (!dateValue) {
        return null;
    }

    const examDate =
        new Date(dateValue);

    if (Number.isNaN(examDate.getTime())) {
        return null;
    }

    const now = new Date();

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

    const completedTopics =
        getCompletedTopics();

    const topics =
        plan?.topics || [];

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
   AI QUESTION COUNT
   ========================================================= */

function getAIQuestionCount() {

    try {

        const stored =
            localStorage.getItem(
                AI_COUNT_KEY
            );

        const count =
            Number.parseInt(
                stored || "0",
                10
            );

        return Number.isFinite(count)
            ? count
            : 0;

    } catch {
        return 0;
    }
}


/* =========================================================
   UPDATE AI USAGE DISPLAY
   ========================================================= */

function updateAIUsageDisplay() {

    const count =
        getAIQuestionCount();

    const elements = [
        $("aiQuestionCount"),
        $("aiUsageCount"),
        $("questionUsage")
    ];

    elements.forEach(element => {

        if (!element) {
            return;
        }

        element.textContent =
            `${count}/${FREE_AI_LIMIT} used`;
    });
}


/* =========================================================
   FREE LIMIT
   ========================================================= */

function canAskAI() {

    const count =
        getAIQuestionCount();

    return count < FREE_AI_LIMIT;
}


/* =========================================================
   RECORD AI QUESTION
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
        $("aiResponse") ||
        $("aiAnswer") ||
        $("aiAdviceText");

    if (!response) {
        return;
    }

    response.innerHTML = `
        <div class="ai-limit-message">

            <div class="ai-limit-icon">
                🔒
            </div>

            <h3>Free AI limit reached</h3>

            <p>
                You've used all ${FREE_AI_LIMIT}
                free AI questions for today.
            </p>

            <p>
                Premium access can give you
                more AI study support.
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
The student does not currently have a saved study plan.

Give general but useful study guidance.
If relevant, encourage the student to create a study plan first.
`;
    }

    const subjectText =
        plan.subjects.length > 0
            ? plan.subjects.join(", ")
            : "No subjects listed";

    const topicText =
        plan.topics.length > 0
            ? plan.topics.join(", ")
            : "No topics listed";

    const completedText =
        getCompletedTopics().length > 0
            ? getCompletedTopics().join(", ")
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
${subjectText}

Topics:
${topicText}

Study hours per day:
${plan.studyHours || "Not specified"}

Difficulty:
${plan.difficulty}

Progress:
${progress.completed}/${progress.total} topics completed (${progress.percentage}%)

Completed topics:
${completedText}

Use this information to personalize the response.
Do not invent subjects, topics, exam dates, or progress.
`;
}


/* =========================================================
   BUILD AI PROMPT
   ========================================================= */

function buildAIPrompt(question, mode = "chat") {

    const context =
        buildStudyContext();

    return `
You are StudyMind AI, a professional academic study assistant.

Your job is to help the student understand subjects,
revise efficiently, identify weak areas, and prepare
for examinations.

${context}

USER REQUEST:
${question}

RESPONSE MODE:
${mode}

IMPORTANT RESPONSE RULES:

1. Be clear, accurate, encouraging, and educational.

2. Base personalized recommendations on the study
   information provided above.

3. Do not invent information about the student's plan.

4. Use short sections and bullet points when useful.

5. Explain difficult concepts step by step.

6. When mathematical notation is needed, ALWAYS use
   proper LaTeX.

7. Use \\(...\\) for inline mathematics.

8. Use \\[...\\] for important standalone equations.

9. Put standalone equations on their own line.

10. Example:

Distance between two points:

\\[
d=\\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}
\\]

11. For inline mathematics, write:

The slope is \\(m=\\frac{y_2-y_1}{x_2-x_1}\\).

12. Never write raw HTML.

13. Do not use markdown tables unless absolutely necessary.

14. Keep the answer readable on both desktop and mobile.

15. If the user asks what to study next, prioritize unfinished
    topics and topics that are most relevant to the exam.

16. If the user asks for progress analysis, clearly explain:
    - current progress
    - strengths
    - areas needing attention
    - recommended next steps

17. Never claim that you performed an action that you did not perform.

Now answer the student's request.
`;
}


/* =========================================================
   CALL STUDYMIND AI
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
            "Sending request to /api/ask-ai"
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
                        mode
                    })
                }
            );

        let data = null;

        try {

            data =
                await response.json();

        } catch {

            throw new Error(
                "The AI server returned an invalid response."
            );
        }

        console.log(
            "AI server response:",
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
                data.error ||
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
   EXTRACT AI ANSWER
   ========================================================= */

function extractAIAnswer(data) {

    if (!data) {
        return "";
    }

    /*
     * IMPORTANT:
     *
     * ask-ai.js returns:
     *
     * {
     *     success: true,
     *     reply: "..."
     * }
     *
     * Therefore data.reply MUST be checked.
     */

    const possibleAnswers = [

        data.reply,

        data.answer,

        data.response,

        data.message,

        data.content,

        data?.message?.content,

        data?.output_text,

        data?.result
    ];

    for (const value of possibleAnswers) {

        if (
            typeof value === "string" &&
            value.trim()
        ) {
            return value.trim();
        }
    }

    /*
     * Compatibility with OpenAI-style responses.
     */

    if (
        Array.isArray(data.choices) &&
        data.choices.length > 0
    ) {

        const choice =
            data.choices[0];

        if (
            typeof choice?.message?.content ===
            "string"
        ) {
            return choice.message.content.trim();
        }

        if (
            typeof choice?.text === "string"
        ) {
            return choice.text.trim();
        }
    }

    return "";
}


/* =========================================================
   ESCAPE HTML
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
   FORMAT AI RESPONSE
   ========================================================= */

function formatAIResponse(text) {

    if (!text) {
        return "";
    }

    /*
     * Escape HTML first for security.
     *
     * LaTeX characters such as:
     *
     * \(
     * \)
     * \[
     * \]
     *
     * are preserved.
     */

    let formatted =
        escapeHTML(text);

    /*
     * Bold:
     * **text**
     */

    formatted =
        formatted.replace(
            /\*\*(.+?)\*\*/g,
            "<strong>$1</strong>"
        );

    /*
     * Headings:
     * ### Heading
     */

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

    /*
     * Bullet points.
     */

    formatted =
        formatted.replace(
            /^[\t ]*[-*]\s+(.+)$/gm,
            "<div class=\"ai-bullet\">$1</div>"
        );

    /*
     * Numbered lists.
     */

    formatted =
        formatted.replace(
            /^(\d+)\.\s+(.+)$/gm,
            "<div class=\"ai-numbered\"><span>$1.</span> $2</div>"
        );

    /*
     * Preserve blank lines.
     */

    formatted =
        formatted.replace(
            /\n{3,}/g,
            "\n\n"
        );

    /*
     * Convert normal line breaks to HTML.
     *
     * MathJax can still detect LaTeX delimiters
     * after this is inserted into the DOM.
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

    const responseElement =
        $("aiResponse") ||
        $("aiAnswer") ||
        $("aiAdviceText");

    if (!responseElement) {

        console.warn(
            "AI response element not found."
        );

        return;
    }

    responseElement.classList.add(
        "ai-response"
    );

    responseElement.innerHTML =
        formatAIResponse(text);

    /*
     * Give the browser a moment to insert
     * the response before MathJax typesets it.
     */

    await new Promise(
        resolve =>
            requestAnimationFrame(resolve)
    );

    await renderMath(
        responseElement
    );
}


/* =========================================================
   SHOW LOADING
   ========================================================= */

function showAILoading() {

    const responseElement =
        $("aiResponse") ||
        $("aiAnswer") ||
        $("aiAdviceText");

    if (!responseElement) {
        return;
    }

    responseElement.classList.add(
        "ai-response"
    );

    responseElement.innerHTML = `
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
   SHOW AI ERROR
   ========================================================= */

function showAIError(error) {

    const responseElement =
        $("aiResponse") ||
        $("aiAnswer") ||
        $("aiAdviceText");

    if (!responseElement) {
        return;
    }

    const message =
        error?.message ||
        "Something went wrong while contacting StudyMind AI.";

    responseElement.innerHTML = `
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
   LAST QUESTION
   ========================================================= */

let lastAIQuestion = "";
let lastAIMode = "chat";


/* =========================================================
   ASK STUDYMIND AI
   ========================================================= */

async function askStudyMindAI() {

    if (aiRequestInProgress) {
        return;
    }

    const input =
        $("aiQuestion") ||
        $("userQuestion") ||
        $("questionInput") ||
        $("chatInput");

    if (!input) {

        console.warn(
            "AI question input not found."
        );

        return;
    }

    const question =
        input.value.trim();

    if (!question) {

        alert(
            "Please enter a question first."
        );

        return;
    }

    if (!canAskAI()) {

        showPremiumMessage();

        return;
    }

    lastAIQuestion = question;
    lastAIMode = "chat";

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
         * Clear input only after successful response.
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
   QUICK ACTION
   ========================================================= */

async function askQuickQuestion(question) {

    if (!question) {
        return;
    }

    if (!canAskAI()) {

        showPremiumMessage();

        return;
    }

    lastAIQuestion = question;
    lastAIMode = "quick_action";

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
   ANALYZE PROGRESS
   ========================================================= */

async function analyzeProgress() {

    if (!canAskAI()) {

        showPremiumMessage();

        return;
    }

    const progress =
        getProgress();

    const question = `
Analyze my current study progress.

I have completed ${progress.completed}
out of ${progress.total} topics.

My current progress is ${progress.percentage}%.

Tell me:

1. What I am doing well.
2. What needs improvement.
3. Which topics I should prioritize next.
4. A practical study strategy for my next study session.

Keep the advice specific and actionable.
`;

    lastAIQuestion = question;
    lastAIMode = "progress_analysis";

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
   INITIALIZE BUTTONS
   ========================================================= */

function initializeButtons() {

    const askButton =
        $("askAIButton") ||
        $("askStudyMindAI") ||
        $("sendAIButton");

    if (
        askButton &&
        !askButton.dataset.aiBound
    ) {

        askButton.addEventListener(
            "click",
            askStudyMindAI
        );

        askButton.dataset.aiBound =
            "true";
    }


    const analyzeButton =
        $("analyzeProgressButton") ||
        $("analyzeProgress");

    if (
        analyzeButton &&
        !analyzeButton.dataset.aiBound
    ) {

        analyzeButton.addEventListener(
            "click",
            analyzeProgress
        );

        analyzeButton.dataset.aiBound =
            "true";
    }


    /*
     * Quick action buttons.
     */

    const quickButtons =
        document.querySelectorAll(
            "[data-ai-question]"
        );

    quickButtons.forEach(button => {

        if (button.dataset.aiBound) {
            return;
        }

        button.addEventListener(
            "click",
            () => {

                const question =
                    button.dataset.aiQuestion;

                askQuickQuestion(
                    question
                );
            }
        );

        button.dataset.aiBound =
            "true";
    });
}


/* =========================================================
   ENTER KEY SUPPORT
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

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
            (
                active.id === "aiQuestion" ||
                active.id === "userQuestion" ||
                active.id === "questionInput" ||
                active.id === "chatInput"
            )
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

    if (savedTheme === "light") {

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
   UPDATE THEME BUTTON
   ========================================================= */

function updateThemeButton() {

    const buttons =
        document.querySelectorAll(
            "#themeToggle, #darkModeToggle, [data-theme-toggle]"
        );

    const isLight =
        document.body.classList.contains(
            "light-mode"
        );

    buttons.forEach(button => {

        button.textContent =
            isLight
                ? "🌙 Dark Mode"
                : "☀️ Light Mode";
    });
}


/* =========================================================
   INITIALIZE NAVIGATION
   ========================================================= */

function initializeNavigation() {

    const themeButtons =
        document.querySelectorAll(
            "#themeToggle, #darkModeToggle, [data-theme-toggle]"
        );

    themeButtons.forEach(button => {

        if (button.dataset.themeBound) {
            return;
        }

        button.addEventListener(
            "click",
            toggleTheme
        );

        button.dataset.themeBound =
            "true";
    });
}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logout() {

    try {

        if (
            window.supabaseClient &&
            window.supabaseClient.auth
        ) {

            await window.supabaseClient.auth.signOut();
        }

    } catch (error) {

        console.error(
            "Logout failed:",
            error
        );

    } finally {

        window.location.href =
            "login.html";
    }
}


/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.askStudyMindAI =
    askStudyMindAI;

window.askQuickQuestion =
    askQuickQuestion;

window.analyzeProgress =
    analyzeProgress;

window.retryLastAIRequest =
    retryLastAIRequest;

window.toggleTheme =
    toggleTheme;

window.logout =
    logout;

window.renderMath =
    renderMath;

window.formatAIResponse =
    formatAIResponse;


/* =========================================================
   PROFESSIONAL MATHJAX CSS
   ========================================================= */

(function addMathStyles() {

    if (
        document.getElementById(
            "studymind-ai-math-styles"
        )
    ) {
        return;
    }

    const style =
        document.createElement("style");

    style.id =
        "studymind-ai-math-styles";

    style.textContent = `

        /* =========================================
           AI RESPONSE
           ========================================= */

        .ai-response {
            line-height: 1.75;
            font-size: 1rem;
        }


        /* =========================================
           MATHJAX
           ========================================= */

        .ai-response mjx-container {
            font-size: 1.08em;
        }


        .ai-response mjx-container[display="true"] {

            display: block;

            margin: 1.25rem 0 !important;

            padding: 0.75rem 0;

            overflow-x: auto;
            overflow-y: hidden;

            max-width: 100%;

            text-align: center;
        }


        /*
         * Make large equations easier to read
         * on mobile screens.
         */

        @media (max-width: 600px) {

            .ai-response mjx-container[display="true"] {

                font-size: 0.95em;

                margin: 1rem 0 !important;

                padding: 0.5rem 0;
            }
        }


        /* =========================================
           BULLETS
           ========================================= */

        .ai-bullet {

            position: relative;

            padding-left: 1.4rem;

            margin: 0.45rem 0;
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
           HEADINGS
           ========================================= */

        .ai-response h2,
        .ai-response h3,
        .ai-response h4 {

            margin-top: 1.25rem;

            margin-bottom: 0.6rem;

            line-height: 1.35;
        }


        /* =========================================
           LOADING
           ========================================= */

        .ai-loading {

            display: flex;

            align-items: center;

            gap: 0.75rem;

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
                studymindBounce
                1.2s infinite ease-in-out;
        }


        .ai-loading-dots span:nth-child(2) {

            animation-delay: 0.15s;
        }


        .ai-loading-dots span:nth-child(3) {

            animation-delay: 0.3s;
        }


        @keyframes studymindBounce {

            0%,
            80%,
            100% {

                transform: translateY(0);

                opacity: 0.4;
            }

            40% {

                transform: translateY(-5px);

                opacity: 1;
            }
        }


        /* =========================================
           ERROR
           ========================================= */

        .ai-error {

            padding: 1rem;

            border-radius: 12px;

            margin-top: 0.5rem;
        }


        .ai-error p {

            margin: 0.5rem 0 0;
        }


        .ai-retry-button {

            margin-top: 0.75rem;

            padding: 0.6rem 1rem;

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

            margin-bottom: 0.5rem;
        }

    `;

    document.head.appendChild(style);

})();
