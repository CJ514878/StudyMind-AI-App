"use strict";

/* =========================================================
   STUDYMIND AI SUPPORT
   CONVERSATION MEMORY VERSION

   FEATURES:
   - Authenticated AI requests
   - Verified Premium/Admin unlimited access
   - Free 5-question daily limit
   - Current study-plan context
   - Quick prompts
   - Typing indicator
   - Persistent conversations
   - Conversation history
   - Reopen previous conversations
   - Start new conversations
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
    USERNAME: "studyMindUsername",
    ACTIVE_CONVERSATION: "studyMindActiveConversation"
};


/* =========================================================
   STATE
========================================================= */

let studyPlan = loadJSON(STORAGE.PLAN, null);

let isSending = false;

let premiumStatus = false;

let premiumStatusLoaded = false;

let activeConversationId =
    localStorage.getItem(STORAGE.ACTIVE_CONVERSATION) || null;

let conversationHistory = [];


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

        await refreshPremiumStatus();

        await loadUser();

        renderStudyContext();

        renderUsage();

        setupComposer();

        setupQuickPrompts();

        setupClearChat();

        setupPremiumModal();

        setupConversationInterface();

        await loadConversationHistory();

        if (activeConversationId) {

            const restored =
                await openConversation(
                    activeConversationId,
                    false
                );

            if (!restored) {
                startNewConversation(false);
            }

        }

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

            const status = normalizePremiumResult(
                window.getStudyMindPremiumStatus()
            );

            if (status !== null) return status;

        }

        if (
            typeof window.isStudyMindPremium ===
            "function"
        ) {

            const status = normalizePremiumResult(
                window.isStudyMindPremium()
            );

            if (status !== null) return status;

        }

        if (typeof window.isPremium === "function") {

            const status = normalizePremiumResult(
                window.isPremium()
            );

            if (status !== null) return status;

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

        if (
            typeof window.waitForPremiumStatus ===
            "function"
        ) {
            await window.waitForPremiumStatus();
        }

        let managerStatus =
            readPremiumManagerStatus();

        if (
            managerStatus === null &&
            typeof window.loadStudyMindPremium ===
            "function"
        ) {

            await window.loadStudyMindPremium();

            managerStatus =
                readPremiumManagerStatus();

        }

        if (managerStatus !== null) {

            premiumStatus = managerStatus;

            premiumStatusLoaded = true;

            renderUsage();

            return premiumStatus;

        }

        const client = getSupabaseClient();

        if (!client) {
            throw new Error(
                "Supabase client is unavailable."
            );
        }

        const { data, error } =
            await client.auth.getSession();

        if (
            error ||
            !data?.session?.access_token
        ) {
            throw new Error(
                "No authenticated session is available."
            );
        }

        const response = await fetch(
            "/api/premium/status",
            {
                method: "GET",
                headers: {
                    "Authorization":
                        `Bearer ${data.session.access_token}`,
                    "Content-Type": "application/json"
                },
                cache: "no-store"
            }
        );

        const result =
            await response.json().catch(() => ({}));

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

        premiumStatus = serverStatus;

        premiumStatusLoaded = true;

        renderUsage();

        return premiumStatus;

    } catch (error) {

        console.warn(
            "Premium verification:",
            error.message
        );

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
        localStorage.getItem(STORAGE.USERNAME) ||
        "Student";

    const client = getSupabaseClient();

    if (client) {

        try {

            const { data, error } =
                await client.auth.getUser();

            const user = data?.user;

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
        document.getElementById("username");

    const avatarElement =
        document.getElementById("avatar");

    if (usernameElement) {
        usernameElement.textContent = username;
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
        document.getElementById("currentStudy");

    if (!element) return;

    const topic = getCurrentTopic();

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
        <strong>${escapeHTML(topic.subject)}</strong>
        <span>${escapeHTML(topic.name)}</span>
    `;

}


/* =========================================================
   FIND CURRENT TOPIC
========================================================= */

function getCurrentTopic() {

    if (!studyPlan) return null;

    if (Array.isArray(studyPlan.subjects)) {

        for (const subject of studyPlan.subjects) {

            const topics =
                Array.isArray(subject.topics)
                    ? subject.topics
                    : [];

            const unfinished = topics.find(topic => {

                if (typeof topic === "string") {
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

    if (Array.isArray(studyPlan.topics)) {

        const topic = studyPlan.topics.find(
            item => !item.completed
        );

        if (topic) {

            return {
                subject: topic.subject || "Subject",
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

    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


/* =========================================================
   AI QUESTION COUNT
========================================================= */

function getQuestionCount() {

    const today = getToday();

    const savedDate =
        localStorage.getItem(STORAGE.AI_DATE);

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

    const count = Number(
        localStorage.getItem(STORAGE.AI_COUNT) || 0
    );

    return Number.isFinite(count)
        ? Math.max(0, count)
        : 0;

}


/* =========================================================
   INCREMENT COUNT
========================================================= */

function incrementQuestionCount() {

    const count = getQuestionCount() + 1;

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
        document.getElementById("usageText");

    const usageProgress =
        document.getElementById("usageProgress");

    if (isPremium()) {

        if (usageText) {
            usageText.textContent = "Unlimited";
        }

        if (usageProgress) {
            usageProgress.style.width = "100%";
        }

        return;

    }

    const count = getQuestionCount();

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
   CONVERSATION INTERFACE
========================================================= */

function setupConversationInterface() {

    const chatContainer =
        document.getElementById("chatMessages");

    if (!chatContainer) return;

    if (
        document.getElementById(
            "conversationToolbar"
        )
    ) {
        return;
    }

    const toolbar =
        document.createElement("div");

    toolbar.id = "conversationToolbar";

    toolbar.style.cssText = `
        display:flex;
        flex-direction:column;
        gap:12px;
        margin-bottom:16px;
        width:100%;
    `;

    const controls =
        document.createElement("div");

    controls.style.cssText = `
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        flex-wrap:wrap;
    `;

    const newChatButton =
        document.createElement("button");

    newChatButton.id = "newConversationButton";

    newChatButton.type = "button";

    newChatButton.textContent = "+ New Chat";

    newChatButton.style.cssText = `
        padding:9px 15px;
        border-radius:9px;
        border:1px solid var(--primary-color, #2563eb);
        background:var(--primary-color, #2563eb);
        color:white;
        font-weight:600;
        cursor:pointer;
    `;

    newChatButton.addEventListener(
        "click",
        () => startNewConversation(true)
    );

    const historyLabel =
        document.createElement("strong");

    historyLabel.textContent =
        "Your conversations";

    historyLabel.style.cssText = `
        font-size:13px;
        opacity:.8;
    `;

    controls.appendChild(newChatButton);

    controls.appendChild(historyLabel);

    const historyList =
        document.createElement("div");

    historyList.id = "conversationHistory";

    historyList.style.cssText = `
        display:flex;
        flex-direction:column;
        gap:6px;
        max-height:190px;
        overflow-y:auto;
        padding:2px;
    `;

    toolbar.appendChild(controls);

    toolbar.appendChild(historyList);

    chatContainer.parentNode.insertBefore(
        toolbar,
        chatContainer
    );

}


/* =========================================================
   LOAD CONVERSATION HISTORY
========================================================= */

async function loadConversationHistory() {

    const client = getSupabaseClient();

    const historyElement =
        document.getElementById("conversationHistory");

    if (!client || !historyElement) return;

    historyElement.innerHTML = `
        <div style="font-size:12px;opacity:.65;padding:6px;">
            Loading conversations...
        </div>
    `;

    try {

        const { data: userData, error: userError } =
            await client.auth.getUser();

        const user = userData?.user;

        if (userError || !user) {
            throw new Error("Please sign in to view your conversations.");
        }

        const { data, error } = await client
            .from("ai_conversations")
            .select("id,title,updated_at")
            .eq("user_id", user.id)
            .order("updated_at", {
                ascending: false
            })
            .limit(30);

        if (error) throw error;

        conversationHistory =
            Array.isArray(data) ? data : [];

        renderConversationHistory();

    } catch (error) {

        console.error(
            "Conversation history error:",
            error
        );

        historyElement.innerHTML = `
            <div style="font-size:12px;opacity:.65;padding:6px;">
                Unable to load conversation history.
            </div>
        `;

    }

}


/* =========================================================
   RENDER CONVERSATION HISTORY
========================================================= */

function renderConversationHistory() {

    const historyElement =
        document.getElementById("conversationHistory");

    if (!historyElement) return;

    historyElement.innerHTML = "";

    if (!conversationHistory.length) {

        const empty =
            document.createElement("div");

        empty.textContent =
            "Your previous conversations will appear here.";

        empty.style.cssText = `
            font-size:12px;
            opacity:.65;
            padding:6px;
        `;

        historyElement.appendChild(empty);

        return;

    }

    conversationHistory.forEach(conversation => {

        const button =
            document.createElement("button");

        button.type = "button";

        button.textContent =
            conversation.title || "New conversation";

        button.title =
            conversation.title || "New conversation";

        button.style.cssText = `
            width:100%;
            text-align:left;
            padding:10px 12px;
            border-radius:8px;
            border:1px solid var(--border-color, rgba(128,128,128,.2));
            background:${
                conversation.id === activeConversationId
                    ? "var(--hover-background, rgba(128,128,128,.15))"
                    : "transparent"
            };
            color:inherit;
            cursor:pointer;
            font-size:13px;
            overflow:hidden;
            text-overflow:ellipsis;
            white-space:nowrap;
        `;

        button.addEventListener(
            "click",
            () => openConversation(
                conversation.id,
                true
            )
        );

        historyElement.appendChild(button);

    });

}


/* =========================================================
   OPEN AN EXISTING CONVERSATION
========================================================= */

async function openConversation(
    conversationId,
    refreshList = true
) {

    if (isSending) return false;

    const client = getSupabaseClient();

    const container =
        document.getElementById("chatMessages");

    if (!client || !container) return false;

    try {

        const { data: userData, error: userError } =
            await client.auth.getUser();

        const user = userData?.user;

        if (userError || !user) {
            throw new Error("Please sign in again.");
        }

        const { data: conversation, error: conversationError } =
            await client
                .from("ai_conversations")
                .select("id,title")
                .eq("id", conversationId)
                .eq("user_id", user.id)
                .maybeSingle();

        if (conversationError) {
            throw conversationError;
        }

        if (!conversation) {
            throw new Error("Conversation not found.");
        }

        const { data: messages, error: messagesError } =
            await client
                .from("ai_messages")
                .select("role,content,created_at")
                .eq("conversation_id", conversationId)
                .eq("user_id", user.id)
                .order("created_at", {
                    ascending: true
                });

        if (messagesError) {
            throw messagesError;
        }

        activeConversationId = conversation.id;

        localStorage.setItem(
            STORAGE.ACTIVE_CONVERSATION,
            activeConversationId
        );

        container.innerHTML = "";

        if (!messages || !messages.length) {

            showWelcomeMessage();

        } else {

            const restoredAssistantMessages = [];

            messages.forEach(message => {

                const messageElement = addMessage(
                    message.role === "assistant"
                        ? "ai"
                        : "user",
                    message.content,
                    message.created_at
                );

                if (
                    message.role === "assistant" &&
                    messageElement
                ) {
                    restoredAssistantMessages.push(
                        messageElement
                    );
                }

            });

            // Render equations after restoring saved assistant messages.
            await Promise.all(
                restoredAssistantMessages.map(messageElement =>
                    renderMath(messageElement)
                )
            );

        }

        renderConversationHistory();

        if (refreshList) {
            await loadConversationHistory();
        }

        return true;

    } catch (error) {

        console.error(
            "Unable to open conversation:",
            error
        );

        if (refreshList) {
            alert(
                error.message ||
                "Unable to open this conversation."
            );
        }

        return false;

    }

}


/* =========================================================
   START A NEW CONVERSATION
========================================================= */

function startNewConversation(focusInput = true) {

    if (isSending) return;

    activeConversationId = null;

    localStorage.removeItem(
        STORAGE.ACTIVE_CONVERSATION
    );

    const container =
        document.getElementById("chatMessages");

    if (container) {
        container.innerHTML = "";
        showWelcomeMessage();
    }

    renderConversationHistory();

    if (focusInput) {

        document
            .getElementById("messageInput")
            ?.focus();

    }

}


/* =========================================================
   WELCOME MESSAGE
========================================================= */

function showWelcomeMessage() {

    const container =
        document.getElementById("chatMessages");

    if (!container) return;

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


/* =========================================================
   COMPOSER
========================================================= */

function setupComposer() {

    const input =
        document.getElementById("messageInput");

    const button =
        document.getElementById("sendButton");

    if (!input || !button) return;

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

                    if (!input) return;

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

    const topic = getCurrentTopic();

    if (!topic) return prompt;

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

    if (isSending) return;

    const input =
        document.getElementById("messageInput");

    if (!input) return;

    const text = input.value.trim();

    if (!text) return;

    if (!premiumStatusLoaded) {
        await refreshPremiumStatus();
    }

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

    addMessage("user", text);

    const typing = addTypingMessage();

    try {

        const result = await callAI(text);

        removeTypingMessage(typing);

        /*
           Save the conversation ID returned by
           the backend. Future messages use it.
        */

        if (result.conversationId) {

            activeConversationId =
                result.conversationId;

            localStorage.setItem(
                STORAGE.ACTIVE_CONVERSATION,
                activeConversationId
            );

        }

        const aiMessage =
            addMessage("ai", result.reply);

        await renderMath(aiMessage);

        if (
            premiumStatusLoaded &&
            !premiumStatus
        ) {
            incrementQuestionCount();
        }

        await loadConversationHistory();

    } catch (error) {

        console.error(
            "AI Support error:",
            error
        );

        removeTypingMessage(typing);

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

    const topic = getCurrentTopic();

    const client = getSupabaseClient();

    if (!client) {

        throw new Error(
            "Supabase is not initialized. Please refresh the page and sign in again."
        );

    }

    const { data, error: sessionError } =
        await client.auth.getSession();

    const session = data?.session;

    if (
        sessionError ||
        !session?.access_token
    ) {

        throw new Error(
            "Please sign in again before using StudyMind AI."
        );

    }

    const response = await fetch(
        "/api/ask-ai",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization":
                    `Bearer ${session.access_token}`
            },

            body: JSON.stringify({

                message: userMessage,

                conversationId:
                    activeConversationId || null,

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
        await response.json().catch(() => ({}));

    if (
        !response.ok ||
        result?.success === false
    ) {

        const error = new Error(
            result?.error ||
            `AI request failed: ${response.status}`
        );

        if (
            result?.code === "DAILY_AI_LIMIT_REACHED" ||
            result?.errorCode === "DAILY_AI_LIMIT_REACHED" ||
            result?.error === "DAILY_AI_LIMIT_REACHED"
        ) {

            error.code = "DAILY_AI_LIMIT_REACHED";

        }

        throw error;

    }

    const reply = result?.reply;

    if (
        typeof reply !== "string" ||
        !reply.trim()
    ) {

        throw new Error(
            "StudyMind AI returned an empty response."
        );

    }

    if (
        typeof result.conversationId !== "string" ||
        !result.conversationId
    ) {

        throw new Error(
            "The conversation could not be saved. Please try again."
        );

    }

    return {
        reply: reply.trim(),
        conversationId: result.conversationId
    };

}


/* =========================================================
   ADD MESSAGE
========================================================= */

function addMessage(
    role,
    text,
    timestamp = null
) {

    const container =
        document.getElementById("chatMessages");

    if (!container) return null;

    const welcome =
        container.querySelector(".welcome-message");

    if (welcome) {
        welcome.remove();
    }

    const wrapper =
        document.createElement("div");

    wrapper.className =
        `message ${role}`;

    const avatar =
        document.createElement("div");

    avatar.className = "message-avatar";

    avatar.textContent =
        role === "ai" ? "✦" : "S";

    const content =
        document.createElement("div");

    content.className = "message-content";

    const bubble =
        document.createElement("div");

    bubble.className = "message-bubble";

    // Normalize equation delimiters for AI messages only.
    const displayText =
        role === "ai"
            ? normalizeMathDelimiters(text)
            : String(text ?? "");

    // Safe rendering: never interpret message text as HTML.
    bubble.textContent = displayText;

    const time =
        document.createElement("div");

    time.className = "message-time";

    time.textContent =
        new Date(
            timestamp || Date.now()
        ).toLocaleTimeString(
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

function normalizeMathDelimiters(text) {

    if (typeof text !== "string") {
        return String(text ?? "");
    }

    /*
       Convert standalone square-bracket equation blocks:

       [
       v(t)=u+at
       ]

       into valid MathJax display delimiters:

       \\[ \\]

       Only convert blocks that contain recognizable mathematical
       notation, so ordinary bracketed text remains unchanged.
    */

    return text.replace(
        /(^|\n)[ \t]*\[\s*\n([\s\S]*?)\n[ \t]*\](?=\n|$)/g,
        (match, prefix, equation) => {

            const mathContent = equation.trim();

            const looksLikeMath =
                /(?:=|\\(?:frac|sqrt|text|times|cdot|left|right|begin|sum|int|pi|theta)|[_^]\{?[-\w])/.test(
                    mathContent
                );

            if (!looksLikeMath) {
                return match;
            }

            return (
                prefix +
                "\\[\n" +
                mathContent +
                "\n\\]"
            );

        }
    );

}


/* =========================================================
   MATHJAX RENDERING
========================================================= */

async function renderMath(element) {

    if (!element) return;

    try {

        // MathJax is loaded asynchronously in ai-support.html.
        // Wait briefly for its rendering API to become available.
        let attempts = 0;

        while (
            (
                !window.MathJax ||
                typeof window.MathJax.typesetPromise !== "function"
            ) &&
            attempts < 100
        ) {

            await new Promise(resolve =>
                setTimeout(resolve, 50)
            );

            attempts++;

        }

        if (
            !window.MathJax ||
            typeof window.MathJax.typesetPromise !== "function"
        ) {

            console.warn(
                "MathJax did not finish loading."
            );

            return;

        }

        if (
            window.MathJax.startup &&
            window.MathJax.startup.promise
        ) {

            await window.MathJax.startup.promise;

        }

        await window.MathJax.typesetPromise([
            element
        ]);

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
        document.getElementById("chatMessages");

    if (!container) return null;

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
            () => startNewConversation(true)
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
                window.location.href = "premium.html";
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

        if (event.key === STORAGE.PREMIUM) {
            await refreshPremiumStatus();
        }

        if (event.key === STORAGE.PLAN) {

            studyPlan = loadJSON(
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
