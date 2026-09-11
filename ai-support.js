"use strict";

/* =========================================================
   STUDYMIND AI SUPPORT
   SHARED AI WORKSPACE
========================================================= */

const AI_LIMIT = 5;

const STORAGE = {
    AI_COUNT: "aiQuestionCount",
    AI_DATE: "aiQuestionDate",
    PREMIUM: "studyMindPremium",
    PLAN: "studyMindPlan",
    USERNAME: "studyMindUsername"
};

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


let studyPlan = loadJSON(
    STORAGE.PLAN,
    null
);

let messages = [];

let isSending = false;


/* =========================================================
   INIT
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
   USER
========================================================= */

async function loadUser() {

    let username =
        localStorage.getItem(
            STORAGE.USERNAME
        ) || "Student";

    if (supabaseClient) {

        try {

            const { data } =
                await supabaseClient.auth.getUser();

            const user = data?.user;

            if (user) {

                username =
                    user.user_metadata?.username ||
                    user.user_metadata?.full_name ||
                    user.email?.split("@")[0] ||
                    username;

            }

        } catch {}

    }

    const name =
        document.getElementById("username");

    const avatar =
        document.getElementById("avatar");

    if (name) {
        name.textContent = username;
    }

    if (avatar) {
        avatar.textContent =
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

    if (!element) return;

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


function getCurrentTopic() {

    if (!studyPlan) {
        return null;
    }

    /*
       Supports the newer subject/topic structure.
    */

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
                Array.isArray(subject.topics)
                    ? subject.topics
                    : [];

            const unfinished =
                topics.find(
                    topic =>
                        !topic.completed
                );

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


    /*
       Legacy flat topics structure.
    */

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
   QUESTION LIMIT
========================================================= */

function getToday() {

    return new Date()
        .toISOString()
        .split("T")[0];

}


function getQuestionCount() {

    const today =
        getToday();

    const storedDate =
        localStorage.getItem(
            STORAGE.AI_DATE
        );

    if (storedDate !== today) {

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


function incrementQuestionCount() {

    const count =
        getQuestionCount() + 1;

    localStorage.setItem(
        STORAGE.AI_COUNT,
        String(count)
    );

    renderUsage();

}


function renderUsage() {

    const count =
        getQuestionCount();

    const premium =
        isPremium();

    const text =
        document.getElementById(
            "usageText"
        );

    const progress =
        document.getElementById(
            "usageProgress"
        );

    if (premium) {

        if (text) {
            text.textContent =
                "Unlimited";
        }

        if (progress) {
            progress.style.width =
                "100%";
        }

        return;
    }

    if (text) {

        text.textContent =
            `${Math.min(count, AI_LIMIT)} / ${AI_LIMIT}`;

    }

    if (progress) {

        progress.style.width =
            `${Math.min(
                count / AI_LIMIT * 100,
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
                        personalizePrompt(
                            prompt
                        );

                    input.focus();

                }
            );

        });

}


function personalizePrompt(prompt) {

    const topic =
        getCurrentTopic();

    if (!topic) {
        return prompt;
    }

    return `
${prompt}

My current subject is:
${topic.subject}

My current topic is:
${topic.name}

Please tailor your response specifically to this topic.
`;
}


/* =========================================================
   SEND
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
       Free limit
    */

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

        addMessage(
            "ai",
            response
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
            "I couldn't connect to the AI service right now. Please try again in a moment."
        );

    } finally {

        isSending = false;

    }

}


/* =========================================================
   AI REQUEST
========================================================= */

async function callAI(userMessage) {

    const topic =
        getCurrentTopic();

    const context = {

        currentSubject:
            topic?.subject || null,

        currentTopic:
            topic?.name || null,

        curriculum:
            studyPlan?.curriculum ||
            null,

        examType:
            studyPlan?.examType ||
            null

    };


    const systemPrompt = `
You are StudyMind AI, an intelligent educational
assistant for secondary-school students.

Your job is to help students understand concepts,
prepare for exams, practice active recall, and build
effective study habits.

Be accurate, encouraging, concise, and educational.

Adapt explanations to the student's level.

When explaining difficult concepts:
1. Explain the core idea simply.
2. Give an intuitive example.
3. Show the important details.
4. Give a short check-for-understanding question
   when useful.

Do not simply give answers when teaching would be
more useful.

The student's current study context is:

Subject:
${context.currentSubject || "Not specified"}

Topic:
${context.currentTopic || "Not specified"}

Curriculum:
${context.curriculum || "Not specified"}

Exam:
${context.examType || "Not specified"}
`;


    const response =
        await fetch(
            "/api/chat",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    message:
                        userMessage,

                    prompt:
                        userMessage,

                    system:
                        systemPrompt,

                    context

                })

            }
        );


    if (!response.ok) {

        const errorText =
            await response.text()
                .catch(() => "");

        throw new Error(
            `AI request failed: ${response.status} ${errorText}`
        );

    }


    const data =
        await response.json();


    return (
        data.reply ||
        data.message ||
        data.response ||
        data.answer ||
        data.content ||
        "I wasn't able to generate a response."
    );

}


/* =========================================================
   MESSAGE RENDERING
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
        return;
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


function removeTypingMessage(
    element
) {

    if (element) {
        element.remove();
    }

}


/* =========================================================
   CLEAR
========================================================= */

function setupClearChat() {

    document
        .getElementById(
            "clearChat"
        )
        ?.addEventListener(
            "click",
            () => {

                messages = [];

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


function openPremiumModal() {

    document
        .getElementById(
            "premiumModal"
        )
        ?.classList.remove(
            "hidden"
        );

}


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


function escapeHTML(value) {

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
