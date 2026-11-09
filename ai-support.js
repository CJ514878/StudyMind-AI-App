
"use strict";

/* =========================================================
   STUDYMIND AI SUPPORT
   COMPLETE REPLACEMENT

   CONNECTS TO:
   /api/ask-ai
   /api/premium/status

   FEATURES:
   - Authenticated AI requests
   - Verified Premium/Admin unlimited access
   - Free 5-question daily limit
   - Current study-plan context
   - Quick prompts
   - Typing indicator
   - Chat history during session
   - Premium upgrade prompt
   - MathJax equation rendering
   - Safe text rendering
========================================================= */


/* =========================================================
   SETTINGS
========================================================= */

const AI_LIMIT = 5;

const STORAGE = {
    AI_COUNT: "aiQuestionCount",
    AI_DATE: "aiQuestionDate",
    PREMIUM: "studyMindPremium",
    PLAN: "studyMindPlan",
    USERNAME: "studyMindUsername"
};


/* =========================================================
   STATE
========================================================= */

let studyPlan = loadJSON(STORAGE.PLAN, null);

let isSending = false;

let premiumStatus = false;

let premiumStatusLoaded = false;


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


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        // Verify Premium/Admin status first.
        await refreshPremiumStatus();

        await loadUser();

        renderStudyContext();

        renderUsage();

        setupComposer();

        setupQuickPrompts();

        setupClearChat();

        setupPremiumModal();

    }
);


/* =========================================================
   PREMIUM STATUS HELPERS
========================================================= */

function normalizePremiumResult(result) {

    if (typeof result === "boolean") {
        return result;
    }

    if (!result || typeof result !== "object") {
        return null;
    }

    if (
        result.isAdmin === true ||
        result.admin === true ||
        result.isPremium === true ||
        result.premium === true
    ) {
        return true;
    }

    if (
        result.isAdmin === false &&
        result.isPremium === false
    ) {
        return false;
    }

    if (
        result.admin === false &&
        result.premium === false
    ) {
        return false;
    }

    return null;

}


/* =========================================================
   READ PREMIUM MANAGER
========================================================= */

function readPremiumManagerStatus() {

    try {

        if (
            typeof window.getStudyMindPremiumStatus ===
            "function"
        ) {

            const result =
                window.getStudyMindPremiumStatus();

            const status =
                normalizePremiumResult(result);

            if (status !== null) {
                return status;
            }

        }

        if (
            typeof window.isStudyMindPremium ===
            "function"
        ) {

            const result =
                window.isStudyMindPremium();

            const status =
                normalizePremiumResult(result);

            if (status !== null) {
                return status;
            }

        }

        if (
            typeof window.isPremium ===
            "function"
        ) {

            const result =
                window.isPremium();

            const status =
                normalizePremiumResult(result);

            if (status !== null) {
                return status;
            }

        }

        if (
            typeof window.isStudyMindPremium ===
            "boolean"
        ) {

            return window.isStudyMindPremium;

        }

    } catch (error) {

        console.warn(
            "Unable to read Premium manager status:",
            error
        );

    }

    return null;

}


/* =========================================================
   VERIFY PREMIUM STATUS
========================================================= */

async function refreshPremiumStatus() {

    premiumStatusLoaded = false;

    try {

        /*
           First, wait for the shared premium.js
           manager to finish checking the account.
        */

        if (
            typeof window.waitForPremiumStatus ===
            "function"
        ) {

            await window.waitForPremiumStatus();

        }


        let managerStatus =
            readPremiumManagerStatus();


        /*
           If the manager has not completed its
           check, ask it to load the status.
        */

        if (
            managerStatus === null &&
            typeof window.loadStudyMindPremium ===
            "function"
        ) {

            await window.loadStudyMindPremium();

            managerStatus =
                readPremiumManagerStatus();

        }


        /*
           If premium.js provides a verified result,
           use it.
        */

        if (managerStatus !== null) {

            premiumStatus =
                managerStatus;

            premiumStatusLoaded = true;

            renderUsage();

            return premiumStatus;

        }


        /*
           Fallback: independently check the
           server using the authenticated session.
        */

        const client =
            getSupabaseClient();


        if (!client) {

            throw new Error(
                "Supabase client is unavailable."
            );

        }


        const {
            data,
            error
        } =
            await client.auth.getSession();


        if (
            error ||
            !data?.session?.access_token
        ) {

            throw new Error(
                "No authenticated session is available."
            );

        }


        const response =
            await fetch(
                "/api/premium/status",
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${data.session.access_token}`,

                        "Content-Type":
                            "application/json"
                    },

                    cache: "no-store"
                }
            );


        const result =
            await response.json().catch(
                () => ({})
            );


        if (!response.ok) {

            throw new Error(
                result?.error ||
                "Unable to verify Premium status."
            );

        }


        const serverStatus =
            normalizePremiumResult(result);


        if (serverStatus === null) {

            throw new Error(
                "The Premium status response was invalid."
            );

        }


        premiumStatus =
            serverStatus;

        premiumStatusLoaded = true;


        renderUsage();


        return premiumStatus;

    } catch (error) {

        console.warn(
            "Premium verification:",
            error.message
        );


        /*
           Do not trust localStorage as proof of
           Premium access.

           If verification fails, leave the status
           unverified. The backend remains the
           authority when an AI request is sent.
        */

        premiumStatus = false;

        premiumStatusLoaded = false;


        renderUsage();


        return null;

    }

}


/* =========================================================
   PREMIUM ACCESS
========================================================= */

function isPremium() {

    return (
        premiumStatusLoaded &&
        premiumStatus === true
    );

}


/* =========================================================
   LOAD USER
========================================================= */

async function loadUser() {

    let username =
        localStorage.getItem(
            STORAGE.USERNAME
        ) || "Student";


    const client =
        getSupabaseClient();


    if (client) {

        try {

            const {
                data,
                error
            } =
                await client.auth.getUser();


            const user =
                data?.user;


            if (!error && user) {

                username =
                    user.user_metadata?.username ||
                    user.user_metadata?.full_name ||
                    user.email?.split("@")[0] ||
                    username;

            }

        } catch (error) {

            console.warn(
                "Unable to load Supabase user:",
                error
            );

        }

    }


    const usernameElement =
        document.getElementById(
            "username"
        );


    const avatarElement =
        document.getElementById(
            "avatar"
        );


    if (usernameElement) {

        usernameElement.textContent =
            username;

    }


    if (avatarElement) {

        avatarElement.textContent =
            username.charAt(0).toUpperCase();

    }


    localStorage.setItem(
        STORAGE.USERNAME,
        username
    );

}


/* =========================================================
   STUDY CONTEXT
========================================================= */

function renderStudyContext() {

    const element =
        document.getElementById(
            "currentStudy"
        );


    if (!element) {
        return;
    }


    const topic =
        getCurrentTopic();


    if (!topic) {

        element.innerHTML = `
            <strong>No active topic</strong>

            <span>
                Create a study plan to personalize
                your AI support.
            </span>
        `;

        return;

    }


    element.innerHTML = `
        <strong>
            ${escapeHTML(topic.subject)}
        </strong>

        <span>
            ${escapeHTML(topic.name)}
        </span>
    `;

}


/* =========================================================
   FIND CURRENT TOPIC
========================================================= */

function getCurrentTopic() {

    if (!studyPlan) {
        return null;
    }


    if (
        Array.isArray(studyPlan.subjects)
    ) {

        for (
            const subject of studyPlan.subjects
        ) {

            const topics =
                Array.isArray(subject.topics)
                    ? subject.topics
                    : [];


            const unfinished =
                topics.find(topic => {

                    if (
                        typeof topic === "string"
                    ) {
                        return true;
                    }

                    return !topic.completed;

                });


            if (unfinished) {

                return {

                    subject:
                        subject.name ||
                        subject.subject ||
                        "Subject",

                    name:
                        typeof unfinished === "string"
                            ? unfinished
                            : unfinished.name ||
                              unfinished.topic ||
                              "Current topic"

                };

            }

        }

    }


    if (
        Array.isArray(studyPlan.topics)
    ) {

        const topic =
            studyPlan.topics.find(
                item => !item.completed
            );


        if (topic) {

            return {

                subject:
                    topic.subject ||
                    "Subject",

                name:
                    topic.name ||
                    topic.topic ||
                    "Current topic"

            };

        }

    }


    return null;

}


/* =========================================================
   LOCAL DATE
========================================================= */

function getToday() {

    const date = new Date();

    const year =
        date.getFullYear();

    const month =
        String(date.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(date.getDate())
            .padStart(2, "0");


    return `${year}-${month}-${day}`;

}


/* =========================================================
   AI QUESTION COUNT
========================================================= */

function getQuestionCount() {

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


/* =========================================================
   INCREMENT COUNT
========================================================= */

function incrementQuestionCount() {

    const count =
        getQuestionCount() + 1;


    localStorage.setItem(
        STORAGE.AI_COUNT,
        String(count)
    );


    renderUsage();

}


/* =========================================================
   USAGE DISPLAY
========================================================= */

function renderUsage() {

    const usageText =
        document.getElementById(
            "usageText"
        );


    const usageProgress =
        document.getElementById(
            "usageProgress"
        );


    if (isPremium()) {

        if (usageText) {
            usageText.textContent = "Unlimited";
        }


        if (usageProgress) {
            usageProgress.style.width = "100%";
        }


        return;

    }


    const count =
        getQuestionCount();


    if (usageText) {

        usageText.textContent =
            premiumStatusLoaded
                ? `${Math.min(count, AI_LIMIT)} / ${AI_LIMIT}`
                : "Checking...";

    }


    if (usageProgress) {

        usageProgress.style.width =
            premiumStatusLoaded
                ? `${Math.min(
                    (count / AI_LIMIT) * 100,
                    100
                )}%`
                : "0%";

    }

}


/* =========================================================
   COMPOSER
========================================================= */

function setupComposer() {

    const input =
        document.getElementById(
            "messageInput"
        );


    const button =
        document.getElementById(
            "sendButton"
        );


    if (!input || !button) {
        return;
    }


    button.addEventListener(
        "click",
        sendMessage
    );


    input.addEventListener(
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


    input.addEventListener(
        "input",
        () => {

            input.style.height = "auto";

            input.style.height =
                `${Math.min(
                    input.scrollHeight,
                    130
                )}px`;

        }
    );

}


/* =========================================================
   QUICK PROMPTS
========================================================= */

function setupQuickPrompts() {

    document
        .querySelectorAll(".prompt-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const prompt =
                        button.dataset.prompt;


                    const input =
                        document.getElementById(
                            "messageInput"
                        );


                    if (!input) {
                        return;
                    }


                    input.value =
                        personalizePrompt(prompt);


                    input.focus();

                }
            );

        });

}


/* =========================================================
   PERSONALIZE PROMPT
========================================================= */

function personalizePrompt(prompt) {

    const topic =
        getCurrentTopic();


    if (!topic) {
        return prompt;
    }


    return `${prompt}

My current subject is ${topic.subject}.

My current topic is ${topic.name}.

Please tailor your response specifically
to this topic.`;

}


/* =========================================================
   SEND MESSAGE
========================================================= */

async function sendMessage() {

    if (isSending) {
        return;
    }


    const input =
        document.getElementById(
            "messageInput"
        );


    if (!input) {
        return;
    }


    const text =
        input.value.trim();


    if (!text) {
        return;
    }


    /*
       Refresh status if it has not been verified.

       A failed frontend status check must not
       block a request. The backend will enforce
       the actual Free-user limit.
    */

    if (!premiumStatusLoaded) {

        await refreshPremiumStatus();

    }


    /*
       Only block locally when the server has
       positively confirmed this is a Free account.
    */

    if (
        premiumStatusLoaded &&
        !premiumStatus &&
        getQuestionCount() >= AI_LIMIT
    ) {

        openPremiumModal();

        return;

    }


    isSending = true;


    input.value = "";

    input.style.height = "auto";


    addMessage(
        "user",
        text
    );


    const typing =
        addTypingMessage();


    try {

        const response =
            await callAI(text);


        removeTypingMessage(typing);


        const aiMessage =
            addMessage(
                "ai",
                response
            );


        await renderMath(aiMessage);


        /*
           Only maintain the local display counter
           for verified Free accounts.

           The backend controls the actual limit.
        */

        if (
            premiumStatusLoaded &&
            !premiumStatus
        ) {

            incrementQuestionCount();

        }

    } catch (error) {

        console.error(
            "AI Support error:",
            error
        );


        removeTypingMessage(typing);


        /*
           Only the actual daily-limit error
           should open the Premium modal.
        */

        if (
            error.code === "DAILY_AI_LIMIT_REACHED"
        ) {

            premiumStatus = false;

            premiumStatusLoaded = true;

            openPremiumModal();

            renderUsage();

        } else {

            addMessage(
                "ai",
                error.message ||
                "I couldn't connect to StudyMind AI right now. Please try again in a moment."
            );

        }

    } finally {

        isSending = false;

    }

}


/* =========================================================
   CALL STUDYMIND AI
========================================================= */

async function callAI(userMessage) {

    const topic =
        getCurrentTopic();


    const client =
        getSupabaseClient();


    if (!client) {

        throw new Error(
            "Supabase is not initialized. Please refresh the page and sign in again."
        );

    }


    const {
        data,
        error: sessionError
    } =
        await client.auth.getSession();


    const session =
        data?.session;


    if (
        sessionError ||
        !session?.access_token
    ) {

        throw new Error(
            "Please sign in again before using StudyMind AI."
        );

    }


    const response =
        await fetch(
            "/api/ask-ai",
            {
                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${session.access_token}`

                },

                body: JSON.stringify({

                    message: userMessage,

                    subject:
                        topic?.subject || "",

                    topic:
                        topic?.name || "",

                    difficulty: "mixed",

                    type: "normal",

                    requestType: "normal",

                    mode: "normal"

                })

            }
        );


    const result =
        await response.json().catch(
            () => ({})
        );


    if (
        !response.ok ||
        result?.success === false
    ) {

        const error =
            new Error(
                result?.error ||
                `AI request failed: ${response.status}`
            );


        /*
           Recognize only the backend's
           actual daily-limit error.
        */

        if (
            result?.code === "DAILY_AI_LIMIT_REACHED" ||
            result?.errorCode === "DAILY_AI_LIMIT_REACHED" ||
            result?.error === "DAILY_AI_LIMIT_REACHED"
        ) {

            error.code =
                "DAILY_AI_LIMIT_REACHED";

        }


        throw error;

    }


    const reply =
        result?.reply;


    if (
        typeof reply !== "string" ||
        !reply.trim()
    ) {

        throw new Error(
            "StudyMind AI returned an empty response."
        );

    }


    return reply.trim();

}


/* =========================================================
   ADD MESSAGE
========================================================= */

function addMessage(role, text) {

    const container =
        document.getElementById(
            "chatMessages"
        );


    if (!container) {
        return null;
    }


    const welcome =
        container.querySelector(
            ".welcome-message"
        );


    if (welcome) {
        welcome.remove();
    }


    const wrapper =
        document.createElement("div");


    wrapper.className =
        `message ${role}`;


    const avatar =
        document.createElement("div");


    avatar.className =
        "message-avatar";


    avatar.textContent =
        role === "ai"
            ? "✦"
            : "S";


    const content =
        document.createElement("div");


    content.className =
        "message-content";


    const bubble =
        document.createElement("div");


    bubble.className =
        "message-bubble";


    // Safe rendering: never interpret AI output as HTML.
    bubble.textContent = text;


    const time =
        document.createElement("div");


    time.className =
        "message-time";


    time.textContent =
        new Date().toLocaleTimeString(
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


    container.scrollTop =
        container.scrollHeight;


    return bubble;

}


/* =========================================================
   MATHJAX RENDERING
========================================================= */

async function renderMath(element) {

    if (
        !element ||
        !window.MathJax ||
        typeof window.MathJax.typesetPromise !==
            "function"
    ) {

        return;

    }


    try {

        await window.MathJax.typesetPromise(
            [element]
        );

    } catch (error) {

        console.warn(
            "MathJax rendering error:",
            error
        );

    }

}


/* =========================================================
   TYPING INDICATOR
========================================================= */

function addTypingMessage() {

    const container =
        document.getElementById(
            "chatMessages"
        );


    if (!container) {
        return null;
    }


    const wrapper =
        document.createElement("div");


    wrapper.className = "message ai";


    wrapper.innerHTML = `
        <div class="message-avatar">
            ✦
        </div>

        <div class="message-content">

            <div class="message-bubble">

                <div class="typing">

                    <span></span>
                    <span></span>
                    <span></span>

                </div>

            </div>

        </div>
    `;


    container.appendChild(wrapper);


    container.scrollTop =
        container.scrollHeight;


    return wrapper;

}


/* =========================================================
   REMOVE TYPING
========================================================= */

function removeTypingMessage(element) {

    if (element) {
        element.remove();
    }

}


/* =========================================================
   CLEAR CHAT
========================================================= */

function setupClearChat() {

    document
        .getElementById("clearChat")
        ?.addEventListener(
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

                    <div class="welcome-message">

                        <div class="welcome-icon">
                            ✦
                        </div>

                        <h3>
                            Welcome to AI Support
                        </h3>

                        <p>
                            I'm here to help you understand
                            your subjects, prepare for exams,
                            and study more effectively.
                        </p>

                        <div class="welcome-tags">

                            <span>
                                Explain concepts
                            </span>

                            <span>
                                Create quizzes
                            </span>

                            <span>
                                Study strategies
                            </span>

                        </div>

                    </div>

                `;

            }
        );

}


/* =========================================================
   PREMIUM MODAL
========================================================= */

function setupPremiumModal() {

    document
        .getElementById("closePremiumModal")
        ?.addEventListener(
            "click",
            closePremiumModal
        );


    document
        .getElementById("premiumButton")
        ?.addEventListener(
            "click",
            () => {

                window.location.href =
                    "premium.html";

            }
        );

}


/* =========================================================
   OPEN PREMIUM
========================================================= */

function openPremiumModal() {

    document
        .getElementById("premiumModal")
        ?.classList.remove("hidden");

}


/* =========================================================
   CLOSE PREMIUM
========================================================= */

function closePremiumModal() {

    document
        .getElementById("premiumModal")
        ?.classList.add("hidden");

}


/* =========================================================
   PREMIUM STATUS EVENTS
========================================================= */

window.addEventListener(
    "studyMindPremiumChanged",
    async () => {

        await refreshPremiumStatus();

        renderUsage();

    }
);


/* =========================================================
   STORAGE EVENTS
========================================================= */

window.addEventListener(
    "storage",
    async event => {

        if (
            event.key === STORAGE.PREMIUM
        ) {

            /*
               Do not trust the localStorage value.
               Recheck the server instead.
            */

            await refreshPremiumStatus();

        }


        if (
            event.key === STORAGE.PLAN
        ) {

            studyPlan =
                loadJSON(
                    STORAGE.PLAN,
                    null
                );

            renderStudyContext();

        }


        if (
            event.key === STORAGE.AI_COUNT ||
            event.key === STORAGE.AI_DATE
        ) {

            renderUsage();

        }

    }
);


/* =========================================================
   UTILITIES
========================================================= */

function loadJSON(key, fallback) {

    try {

        const value =
            localStorage.getItem(key);


        return value
            ? JSON.parse(value)
            : fallback;

    } catch {

        return fallback;

    }

}


function escapeHTML(value) {

    return String(value ?? "")

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}
