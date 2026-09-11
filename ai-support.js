"use strict";

/* =========================================================
   STUDYMIND AI SUPPORT
   COMPLETE REPLACEMENT

   CONNECTS TO:
   /api/ask-ai

   FEATURES:
   - Real OpenAI-powered responses
   - Current study-plan context
   - Free 5-question limit
   - Premium unlimited access
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

    AI_COUNT:
        "aiQuestionCount",

    AI_DATE:
        "aiQuestionDate",

    PREMIUM:
        "studyMindPremium",

    PLAN:
        "studyMindPlan",

    USERNAME:
        "studyMindUsername"

};


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
    "https://bicnrbqqvucgpbwudmit.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_70y0MPrj30-FimUSQK_HuA_Ng1a1qcB";


const supabaseClient =
    window.supabase?.createClient
        ? window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        )
        : null;


/* =========================================================
   STATE
========================================================= */

let studyPlan =
    loadJSON(
        STORAGE.PLAN,
        null
    );

let isSending = false;


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadUser();

        renderStudyContext();

        renderUsage();

        setupComposer();

        setupQuickPrompts();

        setupClearChat();

        setupPremiumModal();

        checkPremium();

    }
);


/* =========================================================
   LOAD USER
========================================================= */

async function loadUser() {

    let username =
        localStorage.getItem(
            STORAGE.USERNAME
        ) || "Student";


    if (supabaseClient) {

        try {

            const {
                data
            } =
                await supabaseClient.auth.getUser();

            const user =
                data?.user;


            if (user) {

                username =
                    user.user_metadata?.username ||
                    user.user_metadata?.full_name ||
                    user.email?.split("@")[0] ||
                    username;

            }

        } catch (error) {

            console.warn(
                "Unable to load Supabase user."
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
            username
                .charAt(0)
                .toUpperCase();

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


    /* -------------------------------------------------------
       NEW SUBJECT STRUCTURE
    ------------------------------------------------------- */

    if (
        Array.isArray(
            studyPlan.subjects
        )
    ) {

        for (
            const subject
            of studyPlan.subjects
        ) {

            const topics =
                Array.isArray(
                    subject.topics
                )
                    ? subject.topics
                    : [];


            const unfinished =
                topics.find(
                    topic => {

                        if (
                            typeof topic ===
                            "string"
                        ) {

                            return true;

                        }

                        return !topic.completed;

                    }
                );


            if (unfinished) {

                return {

                    subject:
                        subject.name ||
                        subject.subject ||
                        "Subject",

                    name:
                        typeof unfinished ===
                        "string"

                            ? unfinished

                            : unfinished.name ||
                              unfinished.topic ||
                              "Current topic"

                };

            }

        }

    }


    /* -------------------------------------------------------
       FLAT TOPICS STRUCTURE
    ------------------------------------------------------- */

    if (
        Array.isArray(
            studyPlan.topics
        )
    ) {

        const topic =
            studyPlan.topics.find(
                item =>
                    !item.completed
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

    return new Date()
        .toISOString()
        .split("T")[0];

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


    if (
        savedDate !== today
    ) {

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


    return Number(
        localStorage.getItem(
            STORAGE.AI_COUNT
        ) || 0
    );

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

    const count =
        getQuestionCount();


    const premium =
        isPremium();


    const usageText =
        document.getElementById(
            "usageText"
        );


    const usageProgress =
        document.getElementById(
            "usageProgress"
        );


    if (premium) {

        if (usageText) {

            usageText.textContent =
                "Unlimited";

        }


        if (usageProgress) {

            usageProgress.style.width =
                "100%";

        }


        return;

    }


    if (usageText) {

        usageText.textContent =
            `${Math.min(
                count,
                AI_LIMIT
            )} / ${AI_LIMIT}`;

    }


    if (usageProgress) {

        usageProgress.style.width =
            `${Math.min(
                (count / AI_LIMIT) * 100,
                100
            )}%`;

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

            input.style.height =
                "auto";


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
        .querySelectorAll(
            ".prompt-button"
        )
        .forEach(
            button => {

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
                            personalizePrompt(
                                prompt
                            );


                        input.focus();

                    }
                );

            }
        );

}


/* =========================================================
   PERSONALIZE PROMPT
========================================================= */

function personalizePrompt(
    prompt
) {

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


    /* -------------------------------------------------------
       FREE LIMIT
    ------------------------------------------------------- */

    if (
        !isPremium() &&
        getQuestionCount() >= AI_LIMIT
    ) {

        openPremiumModal();

        return;

    }


    isSending = true;


    input.value = "";

    input.style.height =
        "auto";


    addMessage(
        "user",
        text
    );


    const typing =
        addTypingMessage();


    try {

        const response =
            await callAI(text);


        removeTypingMessage(
            typing
        );


        const aiMessage =
            addMessage(
                "ai",
                response
            );


        /*
           Render equations after the
           message has entered the DOM.
        */

        await renderMath(
            aiMessage
        );


        if (!isPremium()) {

            incrementQuestionCount();

        }

    } catch (error) {

        console.error(
            "AI Support error:",
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

        isSending = false;

    }

}


/* =========================================================
   CALL YOUR ACTUAL BACKEND
========================================================= */

async function callAI(
    userMessage
) {

    const topic =
        getCurrentTopic();


    const body = {

        message:
            userMessage,

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

    };


    const response =
        await fetch(
            "/api/ask-ai",
            {

                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(body)

            }
        );


    if (!response.ok) {

        let errorMessage =
            `AI request failed: ${response.status}`;


        try {

            const errorData =
                await response.json();


            if (
                errorData?.error
            ) {

                errorMessage +=
                    ` ${errorData.error}`;

            }

        } catch {

            const text =
                await response.text()
                    .catch(() => "");


            if (text) {

                errorMessage +=
                    ` ${text}`;

            }

        }


        throw new Error(
            errorMessage
        );

    }


    const data =
        await response.json();


    if (
        data?.success === false
    ) {

        throw new Error(
            data.error ||
            "StudyMind AI returned an error."
        );

    }


    const reply =
        data?.reply;


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


    const welcome =
        container.querySelector(
            ".welcome-message"
        );


    if (welcome) {
        welcome.remove();
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


    /*
       textContent is deliberately kept here.

       This prevents raw AI output from becoming
       executable HTML.

       MathJax reads the text afterward and
       renders LaTeX safely.
    */

    bubble.textContent =
        text;


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
   MATHJAX RENDERING
========================================================= */

async function renderMath(
    element
) {

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
        document.createElement(
            "div"
        );


    wrapper.className =
        "message ai";


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


    container.appendChild(
        wrapper
    );


    container.scrollTop =
        container.scrollHeight;


    return wrapper;

}


/* =========================================================
   REMOVE TYPING
========================================================= */

function removeTypingMessage(
    element
) {

    if (element) {
        element.remove();
    }

}


/* =========================================================
   CLEAR CHAT
========================================================= */

function setupClearChat() {

    document
        .getElementById(
            "clearChat"
        )
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
        .getElementById(
            "closePremiumModal"
        )
        ?.addEventListener(
            "click",
            closePremiumModal
        );


    document
        .getElementById(
            "premiumButton"
        )
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
        .getElementById(
            "premiumModal"
        )
        ?.classList.remove(
            "hidden"
        );

}


/* =========================================================
   CLOSE PREMIUM
========================================================= */

function closePremiumModal() {

    document
        .getElementById(
            "premiumModal"
        )
        ?.classList.add(
            "hidden"
        );

}


/* =========================================================
   PREMIUM STATE
========================================================= */

function checkPremium() {

    renderUsage();

}


/* =========================================================
   WATCH FOR CHANGES
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


        if (
            event.key ===
            STORAGE.PLAN
        ) {

            studyPlan =
                loadJSON(
                    STORAGE.PLAN,
                    null
                );


            renderStudyContext();

        }


        if (
            event.key ===
            STORAGE.AI_COUNT
        ) {

            renderUsage();

        }

    }
);


/* =========================================================
   STUDYMIND PREMIUM EVENT
========================================================= */

window.addEventListener(
    "studyMindPremiumChanged",
    () => {

        renderUsage();

    }
);


/* =========================================================
   UTILITIES
========================================================= */

function loadJSON(
    key,
    fallback
) {

    try {

        const value =
            localStorage.getItem(
                key
            );


        return value
            ? JSON.parse(value)
            : fallback;

    } catch {

        return fallback;

    }

}


function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}
