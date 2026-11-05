"use strict";

/* =========================================================
   STUDYMIND AI — AI ASSISTANT
   VERIFIED PREMIUM + BLUE/GOLD THEME
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

let premiumStatus = false;
let adminStatus = false;
let premiumStatusLoaded = false;

let authListenerRegistered = false;
let composerInitialized = false;


/* =========================================================
   SUPABASE CLIENT
========================================================= */

function getSupabaseClient() {
    return (
        window.supabaseClient ||
        window.studyMindSupabase ||
        window.gameSupabase ||
        null
    );
}


async function getAccessToken() {
    const client = getSupabaseClient();

    if (!client?.auth) {
        throw new Error(
            "Supabase is not initialized. Please refresh the page."
        );
    }

    const { data, error } = await client.auth.getSession();

    if (error) throw error;

    const token = data?.session?.access_token;

    if (!token) {
        throw new Error(
            "Your session has expired. Please log in again."
        );
    }

    return token;
}


/* =========================================================
   INITIALIZATION
========================================================= */

async function initializeAIAssistant() {
    if (window.studyMindAIAssistantInitialized) return;

    window.studyMindAIAssistantInitialized = true;

    studyPlan = loadJSON(STORAGE.PLAN, null);

    setupTheme();

    await loadPremiumStatus();

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

    listenForAuthChanges();
}


if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeAIAssistant,
        { once: true }
    );
} else {
    initializeAIAssistant();
}


/* =========================================================
   VERIFIED PREMIUM STATUS
========================================================= */

async function loadPremiumStatus() {
    premiumStatusLoaded = false;
    premiumStatus = false;
    adminStatus = false;

    applyPremiumStatus();
    renderUsage();

    try {
        const token = await getAccessToken();

        const response = await fetch(
            "/api/premium/status",
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error(
                `Premium verification failed: ${response.status}`
            );
        }

        const data = await response.json();

        premiumStatus = data?.premium === true;
        adminStatus = data?.isAdmin === true;

    } catch (error) {
        console.error("Premium verification error:", error);

        premiumStatus = false;
        adminStatus = false;

    } finally {
        premiumStatusLoaded = true;

        applyPremiumStatus();
        renderUsage();
    }
}


function isPremium() {
    return (
        premiumStatusLoaded &&
        premiumStatus === true
    );
}


function applyPremiumStatus() {
    const body = document.body;

    if (!body) return;

    const premium = isPremium();

    body.classList.toggle("premium-user", premium);
    body.classList.toggle("premium-theme", premium);
    body.classList.toggle("study-mind-premium", premium);
    body.classList.toggle("admin-user", adminStatus);

    body.classList.toggle(
        "free-user",
        premiumStatusLoaded && !premium
    );
}


/* =========================================================
   AUTH STATE CHANGES
========================================================= */

function listenForAuthChanges() {
    if (authListenerRegistered) return;

    const client = getSupabaseClient();

    if (!client?.auth) {
        console.warn(
            "Supabase auth listener could not be initialized."
        );
        return;
    }

    authListenerRegistered = true;

    client.auth.onAuthStateChange(async (event) => {
        if (event === "SIGNED_OUT") {
            premiumStatus = false;
            adminStatus = false;
            premiumStatusLoaded = true;

            applyPremiumStatus();
            renderUsage();

            return;
        }

        if (
            event === "SIGNED_IN" ||
            event === "TOKEN_REFRESHED" ||
            event === "USER_UPDATED"
        ) {
            await loadPremiumStatus();
            await loadUser();
        }
    });
}


window.addEventListener(
    "studyMindPremiumChanged",
    async () => {
        await loadPremiumStatus();
    }
);


/* =========================================================
   USER
========================================================= */

async function loadUser() {
    const username = document.getElementById("username");
    const avatar = document.getElementById("avatar");

    let name =
        localStorage.getItem(STORAGE.USERNAME) ||
        "Student";

    try {
        const client = getSupabaseClient();

        if (client?.auth) {
            const { data, error } = await client.auth.getUser();

            if (error) throw error;

            const user = data?.user;

            if (user) {
                const metadata = user.user_metadata || {};

                name =
                    metadata.username ||
                    metadata.full_name ||
                    metadata.name ||
                    user.email?.split("@")[0] ||
                    name;

                localStorage.setItem(
                    STORAGE.USERNAME,
                    name
                );
            }
        }
    } catch (error) {
        console.warn("Could not load Supabase user:", error);
    }

    name = String(name)
        .trim()
        .split(" ")
        .slice(0, 2)
        .join(" ");

    if (username) {
        username.textContent = name;
    }

    if (avatar) {
        avatar.textContent = name.charAt(0).toUpperCase();
    }
}


/* =========================================================
   STUDY PLAN
========================================================= */

function renderStudyContext() {
    const container = document.getElementById("currentStudy");

    if (!container) return;

    const topic = getCurrentTopic();

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
    if (!studyPlan) return null;

    if (Array.isArray(studyPlan.subjects)) {
        for (const subject of studyPlan.subjects) {
            if (
                Array.isArray(subject.topics) &&
                subject.topics.length
            ) {
                const topic = subject.topics[0];

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

    if (
        Array.isArray(studyPlan.topics) &&
        studyPlan.topics.length
    ) {
        const topic = studyPlan.topics[0];

        if (typeof topic === "string") {
            return {
                subject: studyPlan.subject || "Subject",
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
   DATE
========================================================= */

function getToday() {
    const now = new Date();

    return [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
    ].join("-");
}


/* =========================================================
   AI USAGE
========================================================= */

function getQuestionCount() {
    if (isPremium()) return 0;

    const today = getToday();

    const savedDate = localStorage.getItem(
        STORAGE.AI_DATE
    );

    if (savedDate !== today) {
        localStorage.setItem(STORAGE.AI_DATE, today);
        localStorage.setItem(STORAGE.AI_COUNT, "0");

        return 0;
    }

    const count = Number(
        localStorage.getItem(STORAGE.AI_COUNT) || 0
    );

    return Number.isFinite(count)
        ? Math.max(0, count)
        : 0;
}


function incrementQuestionCount() {
    if (isPremium()) return;

    const count = getQuestionCount() + 1;

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
    const usageText = document.getElementById("usageText");
    const usageProgress = document.getElementById("usageProgress");
    const usageDescription = document.getElementById(
        "usageDescription"
    );

    if (!premiumStatusLoaded) {
        if (usageText) {
            usageText.textContent = "Checking...";
        }

        if (usageProgress) {
            usageProgress.style.width = "0%";
        }

        if (usageDescription) {
            usageDescription.textContent =
                "Verifying your account access";
        }

        return;
    }

    if (isPremium()) {
        if (usageText) {
            usageText.textContent = "Unlimited";
        }

        if (usageProgress) {
            usageProgress.style.width = "100%";
        }

        if (usageDescription) {
            usageDescription.textContent = adminStatus
                ? "Administrator access enabled"
                : "Premium AI access enabled";
        }

        return;
    }

    const count = getQuestionCount();

    const percentage = Math.min(
        100,
        (count / AI_LIMIT) * 100
    );

    if (usageText) {
        usageText.textContent = `${count} / ${AI_LIMIT}`;
    }

    if (usageProgress) {
        usageProgress.style.width = `${percentage}%`;
    }

    if (usageDescription) {
        usageDescription.textContent =
            count >= AI_LIMIT
                ? "Free AI limit reached"
                : `${AI_LIMIT - count} free AI questions remaining`;
    }
}


/* =========================================================
   FREE LIMIT CHECK
========================================================= */

function canUseAI() {
    if (!premiumStatusLoaded) return false;

    if (isPremium()) return true;

    return getQuestionCount() < AI_LIMIT;
}


/* =========================================================
   COMPOSER
========================================================= */

function setupComposer() {
    if (composerInitialized) return;

    const textarea = document.getElementById("aiQuestion");
    const button = document.getElementById("askAIButton");

    if (!textarea || !button) {
        console.error(
            "AI Assistant: #aiQuestion or #askAIButton was not found."
        );
        return;
    }

    composerInitialized = true;

    button.addEventListener("click", (event) => {
        event.preventDefault();
        sendMessage();
    });

    const form = button.closest("form");

    if (form) {
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            sendMessage();
        });
    }

    textarea.addEventListener("keydown", (event) => {
        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {
            event.preventDefault();
            sendMessage();
        }
    });

    textarea.addEventListener("input", () => {
        textarea.style.height = "auto";

        textarea.style.height =
            Math.min(textarea.scrollHeight, 160) + "px";
    });
}


/* =========================================================
   SEND MESSAGE
========================================================= */

async function sendMessage(customMessage = null) {
    if (sending) return;

    const textarea = document.getElementById("aiQuestion");

    const text =
        customMessage ||
        textarea?.value.trim();

    if (!text) return;

    if (!premiumStatusLoaded) {
        await loadPremiumStatus();
    }

    if (!canUseAI()) {
        openPremiumModal();
        return;
    }

    sending = true;

    if (textarea && !customMessage) {
        textarea.value = "";
        textarea.style.height = "auto";
    }

    addMessage("user", text);

    const typing = addTypingMessage();

    updateSendButton(true);

    try {
        const response = await callAI(text);

        removeTypingMessage(typing);

        const bubble = addMessage("ai", response);

        await renderMath(bubble);

        if (!isPremium()) {
            incrementQuestionCount();
        }

    } catch (error) {
        console.error("StudyMind AI error:", error);

        removeTypingMessage(typing);

        addMessage(
            "ai",
            error.message ||
            "I couldn't connect to StudyMind AI. Please try again."
        );

    } finally {
        sending = false;
        updateSendButton(false);
    }
}


/* =========================================================
   CALL BACKEND
========================================================= */

async function callAI(userMessage) {
    const topic = getCurrentTopic();
    const context = buildStudyContext();

    const token = await getAccessToken();

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

    const response = await fetch("/api/ask-ai", {
        method: "POST",

        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },

        body: JSON.stringify({
            message: prompt,

            subject: topic?.subject || "",
            topic: topic?.name || "",

            difficulty: "mixed",

            type: "normal",
            requestType: "normal",
            mode: "normal"
        })
    });

    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error(
            "The AI server returned an invalid response."
        );
    }

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error(
                "Your login session is invalid. Please log in again."
            );
        }

        if (response.status === 429) {
            await loadPremiumStatus();
            renderUsage();

            throw new Error(
                data?.error ||
                "Your free AI limit has been reached."
            );
        }

        throw new Error(
            data?.error ||
            `AI request failed: ${response.status}`
        );
    }

    if (data?.success === false) {
        throw new Error(
            data.error || "AI returned an error."
        );
    }

    const reply =
        data?.reply ||
        data?.output_text ||
        data?.response;

    if (
        typeof reply !== "string" ||
        !reply.trim()
    ) {
        console.error("Unexpected AI response:", data);

        throw new Error(
            "The AI server did not return a valid answer."
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
        lines.push(`Curriculum: ${studyPlan.curriculum}`);
    }

    if (studyPlan.examType) {
        lines.push(`Exam: ${studyPlan.examType}`);
    }

    if (studyPlan.examDate) {
        lines.push(`Exam date: ${studyPlan.examDate}`);
    }

    if (studyPlan.daysLeft !== undefined) {
        lines.push(`Days remaining: ${studyPlan.daysLeft}`);
    }

    const topic = getCurrentTopic();

    if (topic) {
        lines.push(`Current subject: ${topic.subject}`);
        lines.push(`Current topic: ${topic.name}`);
    }

    if (Array.isArray(studyPlan.subjects)) {
        const subjects = studyPlan.subjects
            .map(subject => subject.name || subject.subject)
            .filter(Boolean);

        if (subjects.length) {
            lines.push(`Subjects: ${subjects.join(", ")}`);
        }
    }

    if (studyPlan.hoursPerDay || studyPlan.studyHours) {
        lines.push(
            `Daily study time: ${
                studyPlan.hoursPerDay || studyPlan.studyHours
            } hours`
        );
    }

    if (studyPlan.studyScore !== undefined) {
        lines.push(`Study score: ${studyPlan.studyScore}`);
    }

    if (studyPlan.streak !== undefined) {
        lines.push(`Study streak: ${studyPlan.streak} days`);
    }

    return lines.length
        ? lines.join("\n")
        : "A study plan exists, but no detailed context is available.";
}


/* =========================================================
   ADD MESSAGE
========================================================= */

function addMessage(role, text) {
    const container = document.getElementById("chatMessages");

    if (!container) return null;

    const empty = container.querySelector(".empty-chat");

    if (empty) empty.remove();

    const wrapper = document.createElement("div");
    wrapper.className = `message ${role}`;

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = role === "ai" ? "✦" : "S";

    const content = document.createElement("div");
    content.className = "message-content";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    if (role === "ai") {
        const raw = String(text || "");

        let html;

        try {
            html = window.marked
                ? window.marked.parse(raw)
                : escapeHTML(raw).replace(/\n/g, "<br>");
        } catch {
            html = escapeHTML(raw).replace(/\n/g, "<br>");
        }

        bubble.innerHTML = window.DOMPurify
            ? window.DOMPurify.sanitize(html, {
                ADD_TAGS: ["mjx-container"]
            })
            : html;

    } else {
        bubble.textContent = text;
    }

    const time = document.createElement("div");
    time.className = "message-time";

    time.textContent = new Date().toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

    content.appendChild(bubble);
    content.appendChild(time);

    wrapper.appendChild(avatar);
    wrapper.appendChild(content);

    container.appendChild(wrapper);

    container.scrollTop = container.scrollHeight;

    return bubble;
}


/* =========================================================
   MATHJAX
========================================================= */

async function renderMath(element) {
    if (!element || !window.MathJax) return;

    try {
        if (
            window.MathJax.startup &&
            window.MathJax.startup.promise
        ) {
            await window.MathJax.startup.promise;
        }

        if (
            typeof window.MathJax.typesetPromise === "function"
        ) {
            await window.MathJax.typesetPromise([element]);
        }

    } catch (error) {
        console.warn("MathJax rendering error:", error);
    }
}


/* =========================================================
   TYPING
========================================================= */

function addTypingMessage() {
    const container = document.getElementById("chatMessages");

    if (!container) return null;

    const wrapper = document.createElement("div");
    wrapper.className = "message ai typing-message";

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = "✦";

    const content = document.createElement("div");
    content.className = "message-content";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    bubble.innerHTML = `
        <div class="typing">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;

    content.appendChild(bubble);
    wrapper.appendChild(avatar);
    wrapper.appendChild(content);

    container.appendChild(wrapper);

    container.scrollTop = container.scrollHeight;

    return wrapper;
}


function removeTypingMessage(element) {
    if (element?.parentNode) {
        element.remove();
    }
}


/* =========================================================
   QUICK ACTIONS
========================================================= */

function setupQuickActions() {
    document.querySelectorAll(".quick-action").forEach(button => {
        if (button.dataset.aiBound === "true") return;

        button.dataset.aiBound = "true";

        button.addEventListener("click", event => {
            event.preventDefault();

            const prompt = button.dataset.prompt;

            if (prompt) sendMessage(prompt);
        });
    });
}


function setupStarterButtons() {
    document.querySelectorAll(".starter-button").forEach(button => {
        if (button.dataset.aiBound === "true") return;

        button.dataset.aiBound = "true";

        button.addEventListener("click", event => {
            event.preventDefault();

            const prompt = button.dataset.prompt;

            if (prompt) sendMessage(prompt);
        });
    });
}


/* =========================================================
   PROGRESS ANALYSIS
========================================================= */

function setupProgressAnalysis() {
    const button = document.getElementById(
        "analyzeProgressButton"
    );

    if (!button || button.dataset.aiBound === "true") return;

    button.dataset.aiBound = "true";

    button.addEventListener("click", event => {
        event.preventDefault();
        analyzeProgress();
    });
}


async function analyzeProgress() {
    if (sending) return;

    if (!premiumStatusLoaded) {
        await loadPremiumStatus();
    }

    if (!canUseAI()) {
        openPremiumModal();
        return;
    }

    const button = document.getElementById(
        "analyzeProgressButton"
    );

    const result = document.getElementById("aiAdviceText");

    const badge = document.getElementById("analysisBadge");

    if (!button || !result) return;

    sending = true;
    button.disabled = true;

    if (badge) {
        badge.textContent = "Analyzing...";
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

    const context = buildStudyContext();

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
        const token = await getAccessToken();

        const response = await fetch("/api/ask-ai", {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },

            body: JSON.stringify({
                message: prompt,
                type: "normal",
                requestType: "normal",
                mode: "normal"
            })
        });

        let data;

        try {
            data = await response.json();
        } catch {
            throw new Error(
                "The AI server returned an invalid response."
            );
        }

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error(
                    "Your login session is invalid. Please log in again."
                );
            }

            if (response.status === 429) {
                await loadPremiumStatus();

                throw new Error(
                    data?.error ||
                    "Your free AI limit has been reached."
                );
            }

            throw new Error(
                data?.error ||
                `Request failed: ${response.status}`
            );
        }

        if (data?.success === false) {
            throw new Error(
                data.error || "AI analysis failed."
            );
        }

        const reply =
            data?.reply ||
            data?.output_text ||
            data?.response;

        if (
            typeof reply !== "string" ||
            !reply.trim()
        ) {
            throw new Error(
                "AI returned an empty analysis."
            );
        }

        const html = window.marked
            ? window.marked.parse(reply)
            : escapeHTML(reply).replace(/\n/g, "<br>");

        result.innerHTML = window.DOMPurify
            ? window.DOMPurify.sanitize(html)
            : html;

        await renderMath(result);

        if (!isPremium()) {
            incrementQuestionCount();
        }

        if (badge) {
            badge.textContent = "Complete";
        }

    } catch (error) {
        console.error("Progress analysis error:", error);

        result.innerHTML = `
            <div class="result-placeholder">
                <span>!</span>
                <div>
                    <strong>Analysis unavailable</strong>
                    <small>
                        ${escapeHTML(
                            error.message ||
                            "StudyMind could not connect to the AI service."
                        )}
                    </small>
                </div>
            </div>
        `;

        if (badge) {
            badge.textContent = "Error";
        }

    } finally {
        sending = false;
        button.disabled = false;
    }
}


/* =========================================================
   CLEAR CHAT
========================================================= */

function setupClearChat() {
    const button = document.getElementById("clearChat");

    if (!button || button.dataset.aiBound === "true") return;

    button.dataset.aiBound = "true";

    button.addEventListener("click", event => {
        event.preventDefault();

        const container = document.getElementById("chatMessages");

        if (!container) return;

        container.innerHTML = `
            <div class="empty-chat">

                <div class="empty-icon">
                    ✦
                </div>

                <h3>
                    Your AI learning partner
                </h3>

                <p>
                    Ask me anything about your current studies.
                </p>

                <div class="starter-grid">

                    <button
                        type="button"
                        class="starter-button"
                        data-prompt="Explain my current topic to me from the basics and gradually make it more advanced."
                    >
                        <span>◈</span>
                        <strong>Explain a topic</strong>
                        <small>Learn it step by step</small>
                    </button>

                    <button
                        type="button"
                        class="starter-button"
                        data-prompt="Give me a short quiz on my current topic. Ask one question at a time and wait for my answer."
                    >
                        <span>?</span>
                        <strong>Quiz me</strong>
                        <small>Test your knowledge</small>
                    </button>

                    <button
                        type="button"
                        class="starter-button"
                        data-prompt="What are the most important things I should know about my current topic for an exam?"
                    >
                        <span>◆</span>
                        <strong>Exam essentials</strong>
                        <small>Focus on key ideas</small>
                    </button>

                    <button
                        type="button"
                        class="starter-button"
                        data-prompt="Give me a personalized study strategy based on my current study plan."
                    >
                        <span>↗</span>
                        <strong>Study strategy</strong>
                        <small>Improve my approach</small>
                    </button>

                </div>

            </div>
        `;

        setupStarterButtons();
    });
}


/* =========================================================
   PREMIUM MODAL
========================================================= */

function setupPremiumModal() {
    const close = document.getElementById("closePremiumModal");
    const modal = document.getElementById("premiumModal");

    if (!modal) return;

    if (close && close.dataset.aiBound !== "true") {
        close.dataset.aiBound = "true";

        close.addEventListener("click", event => {
            event.preventDefault();
            closePremiumModal();
        });
    }

    if (modal.dataset.aiBound !== "true") {
        modal.dataset.aiBound = "true";

        modal.addEventListener("click", event => {
            if (event.target === modal) {
                closePremiumModal();
            }
        });
    }
}


function openPremiumModal() {
    const modal = document.getElementById("premiumModal");

    if (modal) {
        modal.classList.remove("hidden");
    }
}


function closePremiumModal() {
    const modal = document.getElementById("premiumModal");

    if (modal) {
        modal.classList.add("hidden");
    }
}


/* =========================================================
   SEND BUTTON
========================================================= */

function updateSendButton(loading) {
    const button = document.getElementById("askAIButton");

    if (!button) return;

    button.disabled = loading;

    button.innerHTML = loading
        ? `
            <span>Thinking...</span>
            <b>✦</b>
        `
        : `
            <span>Ask AI</span>
            <b>↗</b>
        `;
}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {
    const button = document.getElementById("logoutButton");

    if (!button || button.dataset.aiBound === "true") return;

    button.dataset.aiBound = "true";

    button.addEventListener("click", async event => {
        event.preventDefault();

        try {
            const client = getSupabaseClient();

            if (client?.auth) {
                const { error } = await client.auth.signOut();

                if (error) throw error;
            }

        } catch (error) {
            console.warn("Logout error:", error);
        }

        window.location.href = "home.html";
    });
}


/* =========================================================
   THEME
========================================================= */

function setupTheme() {
    const button = document.getElementById("themeButton");

    /*
       Verified account status controls the theme.

       Free = Blue.
       Paid Premium = Gold.
       Admin = Gold.

       localStorage is NOT used to grant Premium.
    */

    if (button) {
        button.style.display = "none";
    }

    applyPremiumStatus();
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
   LOCAL STORAGE JSON
========================================================= */

function loadJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);

        if (!raw) return fallback;

        return JSON.parse(raw);

    } catch {
        return fallback;
    }
}


/* =========================================================
   STORAGE EVENT
========================================================= */

window.addEventListener("storage", event => {
    if (event.key === STORAGE.PREMIUM) {
        /*
           Never trust localStorage for Premium access.
           Recheck the authenticated account instead.
        */
        loadPremiumStatus();
    }

    if (event.key === STORAGE.PLAN) {
        studyPlan = loadJSON(STORAGE.PLAN, null);
        renderStudyContext();
    }
});
