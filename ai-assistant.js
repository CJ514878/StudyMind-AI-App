"use strict";

/* =========================================================
   STUDYMIND AI — AI ASSISTANT
========================================================= */

const AI_LIMIT = 5;

const STORAGE = {
    PLAN: "studyMindPlan",
    PREMIUM: "studyMindPremium",
    AI_COUNT: "aiQuestionCount",
    AI_DATE: "aiQuestionDate",
    USERNAME: "studyMindUsername"
};

let studyPlan = null;
let sending = false;


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    studyPlan = loadJSON(STORAGE.PLAN, null);

    await loadUser();

    renderStudyContext();

    renderUsage();

    setupComposer();

    setupQuickActions();

    setupStarterButtons();

    setupProgressAnalysis();

    setupClearChat();

    setupPremiumModal();

    setupLogout();

    setupTheme();

});


/* =========================================================
   USER
========================================================= */

async function loadUser() {

    const username =
        document.getElementById("username");

    const avatar =
        document.getElementById("avatar");

    let name =
        localStorage.getItem(STORAGE.USERNAME) ||
        "Student";


    try {

        if (
            window.supabase &&
            window.supabase.createClient
        ) {

            const SUPABASE_URL =
                "https://bicnrbqqvucgpbwudmit.supabase.co";

            const SUPABASE_KEY =
                "sb_publishable_70y0MPrj30-FimUSQK_HuA_Ng1a1qcB";

            const client =
                window.supabase.createClient(
                    SUPABASE_URL,
                    SUPABASE_KEY
                );


            const {
                data
            } =
                await client.auth.getUser();


            const user =
                data?.user;


            if (user) {

                const metadata =
                    user.user_metadata || {};


                name =
                    metadata.full_name ||
                    metadata.name ||
                    metadata.username ||
                    user.email?.split("@")[0] ||
                    name;

            }

        }

    } catch (error) {

        console.warn(
            "Could not load Supabase user:",
            error
        );

    }


    name =
        String(name)
            .trim()
            .split(" ")
            .slice(0, 2)
            .join(" ");


    if (username) {
        username.textContent = name;
    }


    if (avatar) {

        avatar.textContent =
            name.charAt(0).toUpperCase();

    }

}


/* =========================================================
   STUDY PLAN
========================================================= */

function renderStudyContext() {

    const container =
        document.getElementById("currentStudy");

    if (!container) return;


    const topic =
        getCurrentTopic();


    if (!topic) {

        container.innerHTML = `
            <strong>No active topic</strong>
            <span>
                Create a study plan to personalize
                your AI Assistant.
            </span>
        `;

        return;
    }


    container.innerHTML = `
        <strong>${escapeHTML(topic.name)}</strong>
        <span>
            ${escapeHTML(topic.subject || "Current study topic")}
        </span>
    `;

}


function getCurrentTopic() {

    if (!studyPlan) {
        return null;
    }


    /*
       New plan format
    */

    if (
        Array.isArray(studyPlan.subjects)
    ) {

        for (
            const subject of studyPlan.subjects
        ) {

            if (
                Array.isArray(subject.topics) &&
                subject.topics.length
            ) {

                const topic =
                    subject.topics[0];

                return {
                    subject:
                        subject.name ||
                        subject.subject ||
                        "Subject",

                    name:
                        typeof topic === "string"
                            ? topic
                            : topic.name ||
                              topic.title ||
                              "Topic"
                };

            }

        }

    }


    /*
       Flat topics format
    */

    if (
        Array.isArray(studyPlan.topics) &&
        studyPlan.topics.length
    ) {

        const topic =
            studyPlan.topics[0];

        if (
            typeof topic === "string"
        ) {

            return {
                subject:
                    studyPlan.subject ||
                    "Subject",

                name: topic
            };

        }


        return {
            subject:
                topic.subject ||
                studyPlan.subject ||
                "Subject",

            name:
                topic.name ||
                topic.title ||
                "Topic"
        };

    }


    return null;

}


/* =========================================================
   PREMIUM
========================================================= */

function isPremium() {

    const value =
        localStorage.getItem(
            STORAGE.PREMIUM
        );


    return (
        value === "true" ||
        value === "1" ||
        value === "premium"
    );

}


/* =========================================================
   DATE
========================================================= */

function getToday() {

    const now =
        new Date();

    return [
        now.getFullYear(),
        String(
            now.getMonth() + 1
        ).padStart(2, "0"),
        String(
            now.getDate()
        ).padStart(2, "0")
    ].join("-");

}


/* =========================================================
   AI USAGE
========================================================= */

function getQuestionCount() {

    if (isPremium()) {
        return 0;
    }


    const today =
        getToday();


    const savedDate =
        localStorage.getItem(
            STORAGE.AI_DATE
        );


    if (savedDate !== today) {

        localStorage.setItem(
            STORAGE.AI_DATE,
            today
        );

        localStorage.setItem(
            STORAGE.AI_COUNT,
            "0"
        );

        return 0;

    }


    const count =
        Number(
            localStorage.getItem(
                STORAGE.AI_COUNT
            ) || 0
        );


    return Number.isFinite(count)
        ? Math.max(0, count)
        : 0;

}


function incrementQuestionCount() {

    if (isPremium()) {
        return;
    }


    const count =
        getQuestionCount() + 1;


    localStorage.setItem(
        STORAGE.AI_COUNT,
        String(count)
    );


    localStorage.setItem(
        STORAGE.AI_DATE,
        getToday()
    );


    renderUsage();

}


function renderUsage() {

    const usageText =
        document.getElementById(
            "usageText"
        );

    const usageProgress =
        document.getElementById(
            "usageProgress"
        );

    const usageDescription =
        document.getElementById(
            "usageDescription"
        );


    if (isPremium()) {

        if (usageText) {
            usageText.textContent =
                "Unlimited";
        }

        if (usageProgress) {
            usageProgress.style.width =
                "100%";
        }

        if (usageDescription) {
            usageDescription.textContent =
                "Premium AI access enabled";
        }

        return;
    }


    const count =
        getQuestionCount();


    const percentage =
        Math.min(
            100,
            (count / AI_LIMIT) * 100
        );


    if (usageText) {

        usageText.textContent =
            `${count} / ${AI_LIMIT}`;

    }


    if (usageProgress) {

        usageProgress.style.width =
            `${percentage}%`;

    }


    if (usageDescription) {

        if (count >= AI_LIMIT) {

            usageDescription.textContent =
                "Free AI limit reached";

        } else {

            const remaining =
                AI_LIMIT - count;

            usageDescription.textContent =
                `${remaining} free AI question${remaining === 1 ? "" : "s"} remaining`;

        }

    }

}


/* =========================================================
   COMPOSER
========================================================= */

function setupComposer() {

    const textarea =
        document.getElementById(
            "aiQuestion"
        );

    const button =
        document.getElementById(
            "askAIButton"
        );


    if (!textarea || !button) {
        return;
    }


    button.addEventListener(
        "click",
        sendMessage
    );


    textarea.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();

            }

        }
    );


    textarea.addEventListener(
        "input",
        () => {

            textarea.style.height =
                "auto";

            textarea.style.height =
                Math.min(
                    textarea.scrollHeight,
                    160
                ) + "px";

        }
    );

}


/* =========================================================
   SEND MESSAGE
========================================================= */

async function sendMessage(
    customMessage = null
) {

    if (sending) {
        return;
    }


    const textarea =
        document.getElementById(
            "aiQuestion"
        );


    const text =
        customMessage ||
        textarea?.value.trim();


    if (!text) {
        return;
    }


    if (
        !isPremium() &&
        getQuestionCount() >= AI_LIMIT
    ) {

        openPremiumModal();

        return;
    }


    sending = true;


    if (textarea) {

        textarea.value = "";

        textarea.style.height =
            "auto";

    }


    addMessage(
        "user",
        text
    );


    const typing =
        addTypingMessage();


    updateSendButton(true);


    try {

        const response =
            await callAI(text);


        removeTypingMessage(
            typing
        );


        const bubble =
            addMessage(
                "ai",
                response
            );


        await renderMath(
            bubble
        );


        if (!isPremium()) {
            incrementQuestionCount();
        }


    } catch (error) {

        console.error(
            "StudyMind AI error:",
            error
        );


        removeTypingMessage(
            typing
        );


        addMessage(
            "ai",
            "I couldn't connect to StudyMind AI right now. Please try again in a moment."
        );

    } finally {

        sending = false;

        updateSendButton(false);

    }

}


/* =========================================================
   CALL BACKEND
========================================================= */

async function callAI(
    userMessage
) {

    const topic =
        getCurrentTopic();


    const context =
        buildStudyContext();


    const prompt = `

You are StudyMind AI, an intelligent educational assistant.

You are helping a student using the StudyMind AI learning platform.

STUDENT STUDY CONTEXT:
${context}

IMPORTANT:
- Answer the student's actual question.
- Use the study context when relevant.
- If the student asks about their current topic, prioritize it.
- Explain difficult concepts clearly.
- Use examples when helpful.
- For mathematical or scientific equations, use LaTeX.
- Use \\(...\\) for inline mathematics.
- Use \\[...\\] for display equations.
- Do not invent information about the student's progress.
- If information is missing, say so clearly.
- Be educational rather than simply giving unexplained answers.

STUDENT REQUEST:

${userMessage}
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
                    message: prompt,

                    subject:
                        topic?.subject || "",

                    topic:
                        topic?.name || "",

                    difficulty:
                        "mixed",

                    type:
                        "normal",

                    requestType:
                        "normal",

                    mode:
                        "normal"
                })
            }
        );


    if (!response.ok) {

        const text =
            await response.text();

        throw new Error(
            `AI request failed: ${response.status} ${text}`
        );

    }


    const data =
        await response.json();


    if (
        data?.success === false
    ) {

        throw new Error(
            data.error ||
            "AI returned an error."
        );

    }


    const reply =
        data?.reply;


    if (
        typeof reply !== "string" ||
        !reply.trim()
    ) {

        throw new Error(
            "AI returned an empty response."
        );

    }


    return reply.trim();

}


/* =========================================================
   STUDY CONTEXT
========================================================= */

function buildStudyContext() {

    if (!studyPlan) {

        return "No active study plan is available.";

    }


    const lines = [];


    if (studyPlan.curriculum) {

        lines.push(
            `Curriculum: ${studyPlan.curriculum}`
        );

    }


    if (studyPlan.examType) {

        lines.push(
            `Exam: ${studyPlan.examType}`
        );

    }


    if (studyPlan.examDate) {

        lines.push(
            `Exam date: ${studyPlan.examDate}`
        );

    }


    if (
        studyPlan.daysLeft !== undefined
    ) {

        lines.push(
            `Days remaining: ${studyPlan.daysLeft}`
        );

    }


    const topic =
        getCurrentTopic();


    if (topic) {

        lines.push(
            `Current subject: ${topic.subject}`
        );

        lines.push(
            `Current topic: ${topic.name}`
        );

    }


    if (
        Array.isArray(
            studyPlan.subjects
        )
    ) {

        const subjects =
            studyPlan.subjects
                .map(
                    subject =>
                        subject.name ||
                        subject.subject
                )
                .filter(Boolean);


        if (subjects.length) {

            lines.push(
                `Subjects: ${subjects.join(", ")}`
            );

        }

    }


    if (
        studyPlan.hoursPerDay ||
        studyPlan.studyHours
    ) {

        lines.push(
            `Daily study time: ${
                studyPlan.hoursPerDay ||
                studyPlan.studyHours
            } hours`
        );

    }


    if (
        studyPlan.studyScore !== undefined
    ) {

        lines.push(
            `Study score: ${studyPlan.studyScore}`
        );

    }


    if (
        studyPlan.streak !== undefined
    ) {

        lines.push(
            `Study streak: ${studyPlan.streak} days`
        );

    }


    return lines.length
        ? lines.join("\n")
        : "A study plan exists, but no detailed context is available.";

}


/* =========================================================
   ADD MESSAGE
========================================================= */

function addMessage(
    role,
    text
) {

    const container =
        document.getElementById(
            "chatMessages"
        );


    if (!container) {
        return null;
    }


    const empty =
        container.querySelector(
            ".empty-chat"
        );


    if (empty) {
        empty.remove();
    }


    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.className =
        `message ${role}`;


    const avatar =
        document.createElement(
            "div"
        );

    avatar.className =
        "message-avatar";

    avatar.textContent =
        role === "ai"
            ? "✦"
            : "S";


    const content =
        document.createElement(
            "div"
        );

    content.className =
        "message-content";


    const bubble =
        document.createElement(
            "div"
        );

    bubble.className =
        "message-bubble";


    if (role === "ai") {

        /*
           Markdown is converted safely.
        */

        const raw =
            String(text || "");


        let html;


        try {

            html =
                window.marked
                    ? marked.parse(raw)
                    : escapeHTML(raw)
                        .replace(
                            /\n/g,
                            "<br>"
                        );

        } catch {

            html =
                escapeHTML(raw)
                    .replace(
                        /\n/g,
                        "<br>"
                    );

        }


        bubble.innerHTML =
            window.DOMPurify
                ? DOMPurify.sanitize(
                    html,
                    {
                        ADD_TAGS: [
                            "mjx-container"
                        ]
                    }
                )
                : html;

    } else {

        bubble.textContent =
            text;

    }


    const time =
        document.createElement(
            "div"
        );

    time.className =
        "message-time";

    time.textContent =
        new Date()
            .toLocaleTimeString(
                [],
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );


    content.appendChild(
        bubble
    );

    content.appendChild(
        time
    );


    wrapper.appendChild(
        avatar
    );

    wrapper.appendChild(
        content
    );


    container.appendChild(
        wrapper
    );


    container.scrollTop =
        container.scrollHeight;


    return bubble;

}


/* =========================================================
   MATHJAX
========================================================= */

async function renderMath(
    element
) {

    if (!element) {
        return;
    }


    if (
        !window.MathJax
    ) {
        return;
    }


    try {

        if (
            window.MathJax.startup &&
            window.MathJax.startup.promise
        ) {

            await window.MathJax
                .startup
                .promise;

        }


        if (
            typeof
            window.MathJax.typesetPromise ===
            "function"
        ) {

            await window.MathJax
                .typesetPromise([
                    element
                ]);

        }

    } catch (error) {

        console.warn(
            "MathJax rendering error:",
            error
        );

    }

}


/* =========================================================
   TYPING
========================================================= */

function addTypingMessage() {

    const container =
        document.getElementById(
            "chatMessages"
        );


    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.className =
        "message ai typing-message";


    const avatar =
        document.createElement(
            "div"
        );

    avatar.className =
        "message-avatar";

    avatar.textContent =
        "✦";


    const content =
        document.createElement(
            "div"
        );

    content.className =
        "message-content";


    const bubble =
        document.createElement(
            "div"
        );

    bubble.className =
        "message-bubble";


    bubble.innerHTML = `
        <div class="typing">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;


    content.appendChild(
        bubble
    );

    wrapper.appendChild(
        avatar
    );

    wrapper.appendChild(
        content
    );

    container.appendChild(
        wrapper
    );


    container.scrollTop =
        container.scrollHeight;


    return wrapper;

}


function removeTypingMessage(
    element
) {

    if (element?.parentNode) {
        element.remove();
    }

}


/* =========================================================
   QUICK ACTIONS
========================================================= */

function setupQuickActions() {

    document
        .querySelectorAll(
            ".quick-action"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const prompt =
                        button.dataset.prompt;

                    if (prompt) {
                        sendMessage(prompt);
                    }

                }
            );

        });

}


function setupStarterButtons() {

    document
        .querySelectorAll(
            ".starter-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const prompt =
                        button.dataset.prompt;

                    if (prompt) {
                        sendMessage(prompt);
                    }

                }
            );

        });

}


/* =========================================================
   PROGRESS ANALYSIS
========================================================= */

function setupProgressAnalysis() {

    const button =
        document.getElementById(
            "analyzeProgressButton"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        analyzeProgress
    );

}


async function analyzeProgress() {

    if (
        !isPremium() &&
        getQuestionCount() >= AI_LIMIT
    ) {

        openPremiumModal();

        return;
    }


    const button =
        document.getElementById(
            "analyzeProgressButton"
        );

    const result =
        document.getElementById(
            "aiAdviceText"
        );

    const badge =
        document.getElementById(
            "analysisBadge"
        );


    if (!button || !result) {
        return;
    }


    button.disabled = true;


    if (badge) {
        badge.textContent =
            "Analyzing...";
    }


    result.innerHTML = `
        <div class="result-placeholder">
            <span>✦</span>

            <div>
                <strong>
                    StudyMind is analyzing your plan...
                </strong>

                <small>
                    Looking at your subjects,
                    topics and study progress.
                </small>
            </div>
        </div>
    `;


    const context =
        buildStudyContext();


    const prompt = `

Analyze this student's StudyMind study plan.

STUDY PLAN:
${context}

Give personalized academic advice.

Your response should include:

## Current Situation

Briefly describe the student's current study situation.

## What To Prioritize

Give the most important things the student should focus on.

## Recommended Approach

Give a practical study strategy.

## What To Avoid

Mention common mistakes or inefficient study habits
the student should avoid.

## Next Step

Give the student one clear action to take next.

Do not invent information that is not contained
in the study plan.

Keep the advice useful and realistic.
`;


    try {

        const response =
            await fetch(
                "/api/ask-ai",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            message:
                                prompt,

                            type:
                                "normal",

                            requestType:
                                "normal",

                            mode:
                                "normal"
                        })
                }
            );


        if (!response.ok) {

            throw new Error(
                `Request failed: ${response.status}`
            );

        }


        const data =
            await response.json();


        if (
            data?.success === false
        ) {

            throw new Error(
                data.error ||
                "AI analysis failed."
            );

        }


        const reply =
            data?.reply;


        if (
            typeof reply !== "string" ||
            !reply.trim()
        ) {

            throw new Error(
                "AI returned an empty analysis."
            );

        }


        let html =
            marked.parse(
                reply
            );


        html =
            DOMPurify.sanitize(
                html
            );


        result.innerHTML =
            html;


        await renderMath(
            result
        );


        if (!isPremium()) {
            incrementQuestionCount();
        }


        if (badge) {
            badge.textContent =
                "Complete";
        }


    } catch (error) {

        console.error(
            "Progress analysis error:",
            error
        );


        result.innerHTML = `
            <div class="result-placeholder">
                <span>!</span>

                <div>
                    <strong>
                        Analysis unavailable
                    </strong>

                    <small>
                        StudyMind could not connect
                        to the AI service. Please try again.
                    </small>
                </div>
            </div>
        `;


        if (badge) {
            badge.textContent =
                "Error";
        }


    } finally {

        button.disabled =
            false;

    }

}


/* =========================================================
   CLEAR CHAT
========================================================= */

function setupClearChat() {

    const button =
        document.getElementById(
            "clearChat"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            const container =
                document.getElementById(
                    "chatMessages"
                );


            if (!container) {
                return;
            }


            container.innerHTML = `
                <div class="empty-chat">

                    <div class="empty-icon">
                        ✦
                    </div>

                    <h3>
                        Your AI learning partner
                    </h3>

                    <p>
                        Ask me anything about your
                        current studies.
                    </p>

                    <div class="starter-grid">

                        <button
                            class="starter-button"
                            data-prompt="Explain my current topic to me from the basics and gradually make it more advanced."
                        >
                            <span>◈</span>
                            <strong>
                                Explain a topic
                            </strong>
                            <small>
                                Learn it step by step
                            </small>
                        </button>

                        <button
                            class="starter-button"
                            data-prompt="Give me a short quiz on my current topic. Ask one question at a time and wait for my answer."
                        >
                            <span>?</span>
                            <strong>
                                Quiz me
                            </strong>
                            <small>
                                Test my knowledge
                            </small>
                        </button>

                        <button
                            class="starter-button"
                            data-prompt="What are the most important things I should know about my current topic for an exam?"
                        >
                            <span>◆</span>
                            <strong>
                                Exam essentials
                            </strong>
                            <small>
                                Focus on key ideas
                            </small>
                        </button>

                        <button
                            class="starter-button"
                            data-prompt="Give me a personalized study strategy based on my current study plan."
                        >
                            <span>↗</span>
                            <strong>
                                Study strategy
                            </strong>
                            <small>
                                Improve my approach
                            </small>
                        </button>

                    </div>

                </div>
            `;


            setupStarterButtons();

        }
    );

}


/* =========================================================
   PREMIUM MODAL
========================================================= */

function setupPremiumModal() {

    const close =
        document.getElementById(
            "closePremiumModal"
        );

    const modal =
        document.getElementById(
            "premiumModal"
        );


    if (!modal) {
        return;
    }


    if (close) {

        close.addEventListener(
            "click",
            closePremiumModal
        );

    }


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                closePremiumModal();

            }

        }
    );

}


function openPremiumModal() {

    const modal =
        document.getElementById(
            "premiumModal"
        );


    if (modal) {
        modal.classList.remove(
            "hidden"
        );
    }

}


function closePremiumModal() {

    const modal =
        document.getElementById(
            "premiumModal"
        );


    if (modal) {
        modal.classList.add(
            "hidden"
        );
    }

}


/* =========================================================
   SEND BUTTON
========================================================= */

function updateSendButton(
    loading
) {

    const button =
        document.getElementById(
            "askAIButton"
        );


    if (!button) {
        return;
    }


    button.disabled =
        loading;


    button.innerHTML =
        loading
            ? `
                <span>
                    Thinking...
                </span>
                <b>✦</b>
            `
            : `
                <span>
                    Ask AI
                </span>
                <b>↗</b>
            `;

}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    const button =
        document.getElementById(
            "logoutButton"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        async () => {

            try {

                if (
                    window.supabase &&
                    window.supabase.createClient
                ) {

                    const client =
                        window.supabase.createClient(
                            "https://bicnrbqqvucgpbwudmit.supabase.co",
                            "sb_publishable_70y0MPrj30-FimUSQK_HuA_Ng1a1qcB"
                        );


                    await client.auth.signOut();

                }

            } catch (error) {

                console.warn(
                    "Logout error:",
                    error
                );

            }


            window.location.href =
                "home.html";

        }
    );

}


/* =========================================================
   THEME
========================================================= */

function setupTheme() {

    const button =
        document.getElementById(
            "themeButton"
        );


    if (!button) {
        return;
    }


    /*
       This page uses the new dark StudyMind
       interface by default.

       If the old app has a global theme system,
       this listener remains harmless.
    */

    button.style.display =
        "none";

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
    value
) {

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
   LOCAL STORAGE JSON
========================================================= */

function loadJSON(
    key,
    fallback
) {

    try {

        const raw =
            localStorage.getItem(
                key
            );


        if (!raw) {
            return fallback;
        }


        return JSON.parse(
            raw
        );

    } catch {

        return fallback;

    }

}


/* =========================================================
   PREMIUM EVENT
========================================================= */

window.addEventListener(
    "storage",
    event => {

        if (
            event.key ===
            STORAGE.PREMIUM
        ) {

            renderUsage();

        }

    }
);


window.addEventListener(
    "studyMindPremiumChanged",
    () => {

        renderUsage();

    }
);
