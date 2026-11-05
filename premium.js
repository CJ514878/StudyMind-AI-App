
/* =========================================================
   STUDYMIND AI — DOCUMENT SUMMARIZER
   COMPLETE REPLACEMENT
========================================================= */

"use strict";

/* =========================================================
   CONFIGURATION
========================================================= */

const FREE_SUMMARY_LIMIT = 5;

const SUMMARY_STORAGE_KEY = "studyMindSummaryCount";
const PLAN_STORAGE_KEY = "studyMindPlan";

/* =========================================================
   ELEMENT SHORTCUT
========================================================= */

function $(id) {
    return document.getElementById(id);
}

/* =========================================================
   PAGE ELEMENTS
========================================================= */

let summarizeInput;
let summarizeBtn;
let summaryOutput;
let summaryCountBadge;
let summaryUsagePercent;
let summaryUsageText;
let summaryUsageProgressBar;
let summaryStudyContext;
let documentFile;
let fileStatus;
let inputInfo;
let themeButton;

/* =========================================================
   AUTHENTICATION
========================================================= */

function getSupabaseClient() {
    return (
        window.supabaseClient ||
        window.studyMindSupabase ||
        null
    );
}

async function getAuthenticatedSession() {
    const supabase = getSupabaseClient();

    if (!supabase) {
        throw new Error(
            "Authentication service is unavailable. Please refresh the page."
        );
    }

    const {
        data,
        error
    } = await supabase.auth.getSession();

    if (error) {
        console.error("Session error:", error);

        throw new Error(
            "Could not verify your login session. Please sign in again."
        );
    }

    if (!data || !data.session) {
        throw new Error(
            "Please sign in to use StudyMind AI."
        );
    }

    return data.session;
}

/* =========================================================
   PREMIUM STATUS
========================================================= */

/*
   Never use localStorage as proof of Premium membership.

   Premium status must come from the authenticated backend.
   Until verified, the user receives FREE access.
*/

let premiumStatus = {
    checked: false,
    isPremium: false,
    isAdmin: false
};

let premiumCheckPromise = null;

async function refreshPremiumStatus() {
    if (premiumCheckPromise) {
        return premiumCheckPromise;
    }

    premiumCheckPromise = (async function () {
        try {
            const session =
                await getAuthenticatedSession();

            const response = await fetch(
                "/api/premium/status",
                {
                    method: "GET",
                    headers: {
                        "Authorization":
                            `Bearer ${session.access_token}`,
                        "Content-Type":
                            "application/json"
                    },
                    cache: "no-store"
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Premium verification failed."
                );
            }

            const data = await response.json();

            const verifiedPremium =
                data.isPremium === true ||
                data.premium === true ||
                data.isAdmin === true ||
                data.role === "admin";

            premiumStatus = {
                checked: true,
                isPremium: verifiedPremium,
                isAdmin:
                    data.isAdmin === true ||
                    data.role === "admin"
            };

        } catch (error) {
            console.error(
                "Premium verification error:",
                error
            );

            premiumStatus = {
                checked: true,
                isPremium: false,
                isAdmin: false
            };
        }

        return premiumStatus.isPremium;
    })();

    try {
        return await premiumCheckPromise;
    } finally {
        premiumCheckPromise = null;
    }
}

function isPremiumUser() {
    return (
        premiumStatus.checked &&
        premiumStatus.isPremium === true
    );
}

/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        summarizeInput = $("summarizeInput");
        summarizeBtn = $("summarizeBtn");
        summaryOutput = $("summaryOutput");

        summaryCountBadge = $("summaryCountBadge");
        summaryUsagePercent = $("summaryUsagePercent");
        summaryUsageText = $("summaryUsageText");
        summaryUsageProgressBar =
            $("summaryUsageProgressBar");

        summaryStudyContext = $("summaryStudyContext");

        documentFile = $("documentFile");
        fileStatus = $("fileStatus");
        inputInfo = $("inputInfo");
        themeButton = $("themeButton");

        /* Summarize button */

        if (summarizeBtn) {
            summarizeBtn.addEventListener(
                "click",
                summarizeDocument
            );
        }

        /* File upload */

        if (documentFile) {
            documentFile.addEventListener(
                "change",
                handleDocumentUpload
            );
        }

        /* Text counter */

        if (summarizeInput) {
            summarizeInput.addEventListener(
                "input",
                updateInputInfo
            );
        }

        /* Theme */

        setupTheme();

        /* Study context */

        loadStudyContext();

        /* Input information */

        updateInputInfo();

        /* Verify authentication and Premium */

        try {
            await getAuthenticatedSession();
            await refreshPremiumStatus();
        } catch (error) {
            console.warn(
                "Summarizer authentication:",
                error.message
            );
        }

        updateUsageUI();
    }
);

/* =========================================================
   SUMMARY COUNT
========================================================= */

function getSummaryCount() {
    const stored = localStorage.getItem(
        SUMMARY_STORAGE_KEY
    );

    const count = Number.parseInt(
        stored || "0",
        10
    );

    if (!Number.isFinite(count)) {
        return 0;
    }

    return Math.max(0, count);
}

/* =========================================================
   SAVE SUMMARY COUNT
========================================================= */

function setSummaryCount(count) {
    const safeCount = Math.max(
        0,
        Number(count) || 0
    );

    localStorage.setItem(
        SUMMARY_STORAGE_KEY,
        String(safeCount)
    );
}

/* =========================================================
   UPDATE USAGE UI
========================================================= */

function updateUsageUI() {
    const premium = isPremiumUser();
    const count = getSummaryCount();

    if (premium) {
        if (summaryCountBadge) {
            summaryCountBadge.textContent = "Unlimited";
        }

        if (summaryUsagePercent) {
            summaryUsagePercent.textContent = "∞";
        }

        if (summaryUsageText) {
            summaryUsageText.textContent =
                "Unlimited AI document summaries.";
        }

        if (summaryUsageProgressBar) {
            summaryUsageProgressBar.style.width = "100%";
        }

        const ring = document.querySelector(".usage-ring");

        if (ring) {
            ring.style.setProperty(
                "--usage-progress",
                "100%"
            );
        }

        return;
    }

    const percentage = Math.min(
        100,
        Math.round(
            (count / FREE_SUMMARY_LIMIT) * 100
        )
    );

    if (summaryCountBadge) {
        summaryCountBadge.textContent =
            `${Math.min(count, FREE_SUMMARY_LIMIT)}/${FREE_SUMMARY_LIMIT} used`;
    }

    if (summaryUsagePercent) {
        summaryUsagePercent.textContent =
            `${percentage}%`;
    }

    if (summaryUsageText) {
        summaryUsageText.textContent =
            `${Math.min(count, FREE_SUMMARY_LIMIT)} of ${FREE_SUMMARY_LIMIT} free summaries used.`;
    }

    if (summaryUsageProgressBar) {
        summaryUsageProgressBar.style.width =
            `${percentage}%`;
    }

    const ring = document.querySelector(".usage-ring");

    if (ring) {
        ring.style.setProperty(
            "--usage-progress",
            `${percentage}%`
        );
    }
}

/* =========================================================
   CHECK LIMIT
========================================================= */

function hasReachedSummaryLimit() {
    if (isPremiumUser()) {
        return false;
    }

    return getSummaryCount() >= FREE_SUMMARY_LIMIT;
}

/* =========================================================
   RECORD SUMMARY
========================================================= */

function recordSummary() {
    if (!isPremiumUser()) {
        setSummaryCount(
            getSummaryCount() + 1
        );
    }

    updateUsageUI();
}

/* =========================================================
   HANDLE DOCUMENT UPLOAD
========================================================= */

async function handleDocumentUpload(event) {
    const file =
        event.target.files &&
        event.target.files[0];

    if (!file) {
        return;
    }

    const fileName = file.name.toLowerCase();

    if (file.size > 10 * 1024 * 1024) {
        setFileStatus(
            "❌ This file is too large. Please use a file under 10 MB.",
            true
        );

        documentFile.value = "";
        return;
    }

    setFileStatus(
        `⏳ Reading ${file.name}...`,
        false
    );

    try {
        let extractedText = "";

        if (
            file.type === "application/pdf" ||
            fileName.endsWith(".pdf")
        ) {
            extractedText =
                await extractPDFText(file);
        }

        else if (
            file.type === "text/plain" ||
            file.type === "text/markdown" ||
            fileName.endsWith(".txt") ||
            fileName.endsWith(".md") ||
            fileName.endsWith(".markdown")
        ) {
            extractedText = await file.text();
        }

        else {
            throw new Error(
                "Unsupported file type. Please upload TXT, MD or PDF."
            );
        }

        extractedText = cleanDocumentText(
            extractedText
        );

        if (!extractedText) {
            throw new Error(
                "No readable text was found in this document."
            );
        }

        if (summarizeInput) {
            summarizeInput.value = extractedText;
        }

        updateInputInfo();

        setFileStatus(
            `✅ ${file.name} loaded successfully.`,
            false
        );

        if (summarizeInput) {
            summarizeInput.focus();
        }

    } catch (error) {
        console.error(
            "Document upload error:",
            error
        );

        setFileStatus(
            `❌ ${error.message || "Could not read the document."}`,
            true
        );
    }
}

/* =========================================================
   EXTRACT PDF TEXT
========================================================= */

async function extractPDFText(file) {
    if (!window.pdfjsLib) {
        throw new Error(
            "PDF reader failed to load. Please refresh the page and try again."
        );
    }

    const arrayBuffer =
        await file.arrayBuffer();

    const pdf =
        await window.pdfjsLib.getDocument({
            data: arrayBuffer
        }).promise;

    let fullText = "";

    for (
        let pageNumber = 1;
        pageNumber <= pdf.numPages;
        pageNumber++
    ) {
        const page =
            await pdf.getPage(pageNumber);

        const textContent =
            await page.getTextContent();

        const pageText =
            textContent.items
                .map(item => item.str || "")
                .join(" ");

        if (pageText.trim()) {
            fullText +=
                `\n\n--- Page ${pageNumber} ---\n\n`;

            fullText += pageText;
        }
    }

    return fullText;
}

/* =========================================================
   CLEAN DOCUMENT TEXT
========================================================= */

function cleanDocumentText(text) {
    return String(text || "")
        .replace(/\u0000/g, "")
        .replace(/\r\n/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{4,}/g, "\n\n")
        .trim();
}

/* =========================================================
   FILE STATUS
========================================================= */

function setFileStatus(message, isError) {
    if (!fileStatus) {
        return;
    }

    fileStatus.textContent = message;
    fileStatus.style.opacity = "0.9";

    fileStatus.style.fontWeight =
        isError ? "600" : "400";
}

/* =========================================================
   INPUT INFORMATION
========================================================= */

function updateInputInfo() {
    if (!summarizeInput || !inputInfo) {
        return;
    }

    const text = summarizeInput.value || "";

    const characters = text.length;

    const words = text
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .length;

    inputInfo.textContent =
        `${characters.toLocaleString()} characters • ${words.toLocaleString()} words`;
}

/* =========================================================
   LOAD STUDY CONTEXT
========================================================= */

function loadStudyContext() {
    if (!summaryStudyContext) {
        return;
    }

    let plan = null;

    try {
        const stored = localStorage.getItem(
            PLAN_STORAGE_KEY
        );

        if (stored) {
            plan = JSON.parse(stored);
        }

    } catch (error) {
        console.warn(
            "Could not read study plan:",
            error
        );
    }

    if (!plan) {
        summaryStudyContext.innerHTML =
            "<p>No active study plan was found. The summary will still be generated normally.</p>";

        return;
    }

    const contextParts = [];

    const examType = firstValue(
        plan.examType,
        plan.exam,
        plan.examName,
        plan.testType
    );

    if (examType) {
        contextParts.push(
            `<strong>Exam:</strong> ${escapeHTML(examType)}`
        );
    }

    const subjects = extractSubjects(plan);

    if (subjects.length) {
        contextParts.push(
            `<strong>Subjects:</strong> ${escapeHTML(subjects.join(", "))}`
        );
    }

    const topics = extractTopics(plan);

    if (topics.length) {
        contextParts.push(
            `<strong>Topics:</strong> ${escapeHTML(topics.slice(0, 8).join(", "))}`
        );
    }

    if (!contextParts.length) {
        summaryStudyContext.innerHTML =
            "<p>Your study plan was found, but no readable exam or subject information is available.</p>";

        return;
    }

    summaryStudyContext.innerHTML =
        contextParts
            .map(item =>
                `<div style="margin-bottom:8px;">${item}</div>`
            )
            .join("");
}

/* =========================================================
   FIRST VALUE
========================================================= */

function firstValue(...values) {
    for (const value of values) {
        if (
            value !== undefined &&
            value !== null &&
            String(value).trim()
        ) {
            return String(value).trim();
        }
    }

    return "";
}

/* =========================================================
   EXTRACT SUBJECTS
========================================================= */

function extractSubjects(plan) {
    const result = [];

    if (Array.isArray(plan.subjects)) {
        plan.subjects.forEach(subject => {
            if (typeof subject === "string") {
                result.push(subject);
            }

            else if (
                subject &&
                typeof subject === "object"
            ) {
                const name = firstValue(
                    subject.name,
                    subject.subject,
                    subject.title
                );

                if (name) {
                    result.push(name);
                }
            }
        });
    }

    if (typeof plan.subjects === "string") {
        plan.subjects
            .split(",")
            .map(item => item.trim())
            .filter(Boolean)
            .forEach(item => result.push(item));
    }

    if (typeof plan.subjectList === "string") {
        plan.subjectList
            .split(",")
            .map(item => item.trim())
            .filter(Boolean)
            .forEach(item => result.push(item));
    }

    return [...new Set(result)];
}

/* =========================================================
   EXTRACT TOPICS
========================================================= */

function extractTopics(plan) {
    const result = [];

    if (Array.isArray(plan.topics)) {
        plan.topics.forEach(topic => {
            if (typeof topic === "string") {
                result.push(topic);
            }

            else if (
                topic &&
                typeof topic === "object"
            ) {
                const name = firstValue(
                    topic.name,
                    topic.title,
                    topic.topic
                );

                if (name) {
                    result.push(name);
                }
            }
        });
    }

    if (Array.isArray(plan.subjects)) {
        plan.subjects.forEach(subject => {
            if (
                subject &&
                typeof subject === "object" &&
                Array.isArray(subject.topics)
            ) {
                subject.topics.forEach(topic => {
                    if (typeof topic === "string") {
                        result.push(topic);
                    }

                    else if (
                        topic &&
                        typeof topic === "object"
                    ) {
                        const name = firstValue(
                            topic.name,
                            topic.title,
                            topic.topic
                        );

                        if (name) {
                            result.push(name);
                        }
                    }
                });
            }
        });
    }

    return [...new Set(result)];
}

/* =========================================================
   BUILD SUMMARY PROMPT
========================================================= */

function buildSummaryPrompt(documentText) {
    const planContext =
        getStudyPlanContextForAI();

    return `
You are StudyMind AI, an expert academic study assistant.

Your task is to summarize the student's study material into
clear, accurate, exam-focused revision notes.

IMPORTANT INSTRUCTIONS:

1. Base the summary primarily on the supplied document.
2. Do not invent unsupported information.
3. Keep important facts, concepts, definitions, formulas,
   processes, examples and relationships.
4. Remove unnecessary repetition and filler.
5. Explain difficult concepts in simple student-friendly language.
6. Make the summary useful for examination revision.
7. Organize the response with clear headings.
8. Include a Key Points section.
9. Include Important Definitions when relevant.
10. Include Formulas when relevant.
11. Include Exam Focus with the most important things to remember.
12. Preserve calculations and mathematical expressions accurately.
13. Use LaTeX for mathematical expressions.
14. Use \\(...\\) for inline mathematics.
15. Use \\[...\\] for display mathematics.
16. Put important standalone equations on their own lines.
17. Avoid markdown tables unless absolutely necessary.
18. Do not discuss these instructions.

STUDY PLAN CONTEXT:

${planContext}

DOCUMENT TO SUMMARIZE:

${documentText}
`;
}

/* =========================================================
   STUDY PLAN CONTEXT FOR AI
========================================================= */

function getStudyPlanContextForAI() {
    let plan = null;

    try {
        const stored = localStorage.getItem(
            PLAN_STORAGE_KEY
        );

        if (stored) {
            plan = JSON.parse(stored);
        }

    } catch (error) {
        console.warn(
            "Could not load plan for summary:",
            error
        );
    }

    if (!plan) {
        return "No active StudyMind study plan is available.";
    }

    const lines = [];

    const examType = firstValue(
        plan.examType,
        plan.exam,
        plan.examName,
        plan.testType
    );

    if (examType) {
        lines.push(`Exam: ${examType}`);
    }

    const subjects = extractSubjects(plan);

    if (subjects.length) {
        lines.push(
            `Subjects: ${subjects.join(", ")}`
        );
    }

    const topics = extractTopics(plan);

    if (topics.length) {
        lines.push(
            `Topics: ${topics.slice(0, 20).join(", ")}`
        );
    }

    return lines.length
        ? lines.join("\n")
        : "Study plan found, but no detailed context is available.";
}

/* =========================================================
   SUMMARIZE DOCUMENT
========================================================= */

async function summarizeDocument() {
    if (!summarizeInput) {
        return;
    }

    const documentText =
        summarizeInput.value.trim();

    if (!documentText) {
        displayError(
            "Please paste your study material or upload a document first."
        );

        summarizeInput.focus();
        return;
    }

    if (
        documentText.length > 100000
    ) {
        displayError(
            "This document is too large to summarize in one request. Please shorten the material or split it into smaller sections."
        );

        return;
    }

    setLoadingState(true);

    try {
        /* Verify current login */

        const session =
            await getAuthenticatedSession();

        /* Verify current Premium status */

        await refreshPremiumStatus();

        /* Enforce free summary limit */

        if (hasReachedSummaryLimit()) {
            displayLimitMessage();
            return;
        }

        const prompt =
            buildSummaryPrompt(documentText);

        /* Send authenticated request */

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
                    message: prompt,
                    mode: "summarizer"
                })
            }
        );

        let data = null;

        try {
            data = await response.json();
        } catch (jsonError) {
            throw new Error(
                "The AI server returned an invalid response."
            );
        }

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error(
                    "Your session has expired. Please sign in again."
                );
            }

            if (response.status === 403) {
                throw new Error(
                    data?.error ||
                    "You do not have permission to use this feature."
                );
            }

            if (response.status === 429) {
                throw new Error(
                    data?.error ||
                    "You have reached your usage limit."
                );
            }

            throw new Error(
                data?.error ||
                data?.message ||
                `AI server error (${response.status}).`
            );
        }

        const answer =
            extractAIAnswer(data);

        if (!answer) {
            throw new Error(
                "The AI server returned an empty summary."
            );
        }

        /* Record successful summary */

        recordSummary();

        /* Display */

        displaySummary(answer);

    } catch (error) {
        console.error(
            "Summarizer error:",
            error
        );

        displayError(
            error.message ||
            "StudyMind AI could not generate the summary."
        );

    } finally {
        setLoadingState(false);
    }
}

/* =========================================================
   EXTRACT AI ANSWER
========================================================= */

function extractAIAnswer(data) {
    if (!data) {
        return "";
    }

    const candidates = [
        data.reply,
        data.answer,
        data.response,
        data.output,
        data.message,
        data.data?.reply
    ];

    for (const candidate of candidates) {
        if (
            typeof candidate === "string" &&
            candidate.trim()
        ) {
            return candidate.trim();
        }
    }

    return "";
}

/* =========================================================
   DISPLAY SUMMARY
========================================================= */

function displaySummary(answer) {
    if (!summaryOutput) {
        return;
    }

    summaryOutput.className = "ai-response";

    summaryOutput.innerHTML =
        formatAIResponse(answer);

    renderMath(summaryOutput);

    summaryOutput.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}

/* =========================================================
   FORMAT AI RESPONSE
========================================================= */

function formatAIResponse(text) {
    const raw = String(text || "");

    if (
        window.marked &&
        typeof window.marked.parse === "function" &&
        window.DOMPurify
    ) {
        return window.DOMPurify.sanitize(
            window.marked.parse(raw, {
                breaks: true,
                gfm: true
            })
        );
    }

    return escapeHTML(raw)
        .replace(/\n/g, "<br>");
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
   RENDER MATH
========================================================= */

function renderMath(element) {
    if (!element || !window.MathJax) {
        return;
    }

    if (
        typeof window.MathJax.typesetPromise ===
        "function"
    ) {
        window.MathJax.typesetPromise([
            element
        ]).catch(error => {
            console.warn(
                "MathJax rendering error:",
                error
            );
        });
    }
}

/* =========================================================
   LOADING STATE
========================================================= */

function setLoadingState(isLoading) {
    if (!summarizeBtn) {
        return;
    }

    if (isLoading) {
        summarizeBtn.disabled = true;

        summarizeBtn.dataset.originalText =
            summarizeBtn.textContent;

        summarizeBtn.textContent =
            "⏳ StudyMind AI is summarizing...";

        if (summaryOutput) {
            summaryOutput.className = "ai-response";

            summaryOutput.innerHTML = `
                <div style="
                    padding:20px 0;
                    text-align:center;
                ">
                    <div style="
                        font-size:30px;
                        margin-bottom:10px;
                    ">
                        🧠
                    </div>

                    <strong>
                        StudyMind AI is analyzing your material...
                    </strong>

                    <p style="
                        opacity:0.7;
                        margin-top:8px;
                    ">
                        Extracting key concepts, definitions,
                        formulas and exam-relevant points.
                    </p>
                </div>
            `;
        }

    } else {
        summarizeBtn.disabled = false;

        summarizeBtn.textContent =
            summarizeBtn.dataset.originalText ||
            "✨ Summarize Notes";
    }
}

/* =========================================================
   ERROR MESSAGE
========================================================= */

function displayError(message) {
    if (!summaryOutput) {
        return;
    }

    summaryOutput.className = "ai-response";

    summaryOutput.innerHTML = `
        <div style="
            padding:18px;
            border-radius:12px;
        ">
            <strong>
                ⚠️ Unable to summarize
            </strong>

            <p style="
                margin-top:8px;
                margin-bottom:0;
            ">
                ${escapeHTML(message)}
            </p>
        </div>
    `;
}

/* =========================================================
   LIMIT MESSAGE
========================================================= */

function displayLimitMessage() {
    if (!summaryOutput) {
        return;
    }

    summaryOutput.innerHTML = `
        <div style="
            padding:20px;
            text-align:center;
        ">
            <div style="
                font-size:34px;
                margin-bottom:10px;
            ">
                🔒
            </div>

            <h3>
                Free summaries used
            </h3>

            <p>
                You have used all
                ${FREE_SUMMARY_LIMIT}
                free document summaries.
            </p>

            <p style="opacity:0.75;">
                Upgrade to Premium to continue
                summarizing study material.
            </p>

            <button
                type="button"
                onclick="openPremiumMessage()"
                class="primary-button"
                style="margin-top:10px;"
            >
                ⭐ Explore Premium
            </button>
        </div>
    `;
}

/* =========================================================
   PREMIUM PAGE
========================================================= */

function openPremiumMessage() {
    window.location.href = "premium.html";
}

/* =========================================================
   THEME
========================================================= */

function setupTheme() {
    /*
       Keep the page's existing theme styling.
       Premium authorization and global theme selection
       should be handled by the shared theme controller.
    */

    const savedTheme =
        localStorage.getItem("studyMindTheme");

    if (savedTheme === "light") {
        document.body.classList.add("light-mode");
    } else {
        document.body.classList.remove("light-mode");
    }

    updateThemeButton();

    if (themeButton) {
        themeButton.addEventListener(
            "click",
            toggleTheme
        );
    }
}

/* =========================================================
   TOGGLE THEME
========================================================= */

function toggleTheme() {
    const isLight =
        document.body.classList.toggle("light-mode");

    localStorage.setItem(
        "studyMindTheme",
        isLight ? "light" : "dark"
    );

    updateThemeButton();
}

/* =========================================================
   UPDATE THEME BUTTON
========================================================= */

function updateThemeButton() {
    if (!themeButton) {
        return;
    }

    const isLight =
        document.body.classList.contains("light-mode");

    themeButton.textContent =
        isLight
            ? "☀️ Light Mode"
            : "🌙 Dark Mode";
}

/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.summarizeDocument = summarizeDocument;
window.handleDocumentUpload = handleDocumentUpload;
window.toggleTheme = toggleTheme;
window.openPremiumMessage = openPremiumMessage;
window.isPremiumUser = isPremiumUser;
window.refreshPremiumStatus = refreshPremiumStatus;
