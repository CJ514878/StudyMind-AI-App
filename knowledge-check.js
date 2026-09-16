"use strict";

/* =========================================================
   STUDYMIND AI — DUOLINGO-STYLE KNOWLEDGE CHECK
========================================================= */

/* =========================================================
   CONFIGURATION
========================================================= */

const PASS_PERCENTAGE = 60;

const FREE_KNOWLEDGE_CHECK_LIMIT = 5;

const PREMIUM_STATUS_ENDPOINT = "/api/premium/status";
const GENERATE_ENDPOINT = "/api/generate-questions";
const ASK_AI_ENDPOINT = "/api/ask-ai";

const TOPIC_KEY = "studyMindKnowledgeCheckTopic";
const USAGE_KEY = "studyMindKnowledgeCheckUsageCount";

const COMPLETED_KEY = "studyMindCompletedQuestionTopics";
const COMPLETED_TOPICS_KEY = "studyMindCompletedTopics";

const QUESTIONS_KEY = "studyMindTopicQuestions";

const AVAILABLE_COUNTS = [5, 10, 20, 30, 40, 50, 60];


/* =========================================================
   STATE
========================================================= */

let knowledgeSubject = "";
let knowledgeTopic = "";

let questions = [];
let currentQuestionIndex = 0;

let score = 0;
let answeredCount = 0;

let currentQuestionAnswered = false;
let currentQuestionCorrect = false;

let selectedQuestionCount = 5;

let knowledgePremium = false;
let knowledgePremiumVerified = false;

let questionResults = [];


/* =========================================================
   DOM HELPERS
========================================================= */

function $(id) {
    return document.getElementById(id);
}


function showElement(id) {
    const el = $(id);
    if (el) {
        el.style.display = "";
        el.classList.add("visible");
    }
}


function hideElement(id) {
    const el = $(id);
    if (el) {
        el.style.display = "none";
        el.classList.remove("visible");
    }
}


function setText(id, value) {
    const el = $(id);
    if (el) {
        el.textContent = value;
    }
}


/* =========================================================
   STORAGE HELPERS
========================================================= */

function readJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);

        if (!raw) {
            return fallback;
        }

        const parsed = JSON.parse(raw);

        return parsed ?? fallback;

    } catch (error) {

        console.warn(
            "StudyMind Knowledge Check: Could not read",
            key,
            error
        );

        return fallback;
    }
}


function writeJSON(key, value) {
    try {
        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

        return true;

    } catch (error) {

        console.warn(
            "StudyMind Knowledge Check: Could not write",
            key,
            error
        );

        return false;
    }
}


/* =========================================================
   TOPIC INFORMATION
========================================================= */

function getTopicData() {

    const raw = localStorage.getItem(TOPIC_KEY);

    if (!raw) {
        return {
            subject: "",
            topic: ""
        };
    }

    try {

        const parsed = JSON.parse(raw);

        if (parsed && typeof parsed === "object") {

            return {
                subject:
                    parsed.subject ||
                    parsed.subjectName ||
                    "",
                topic:
                    parsed.topic ||
                    parsed.topicName ||
                    ""
            };
        }

    } catch (error) {

        /*
         * Compatibility with older versions where the
         * topic was stored as a simple string.
         */

        return {
            subject: "",
            topic: raw
        };
    }

    return {
        subject: "",
        topic: ""
    };
}


function loadTopic() {

    const data = getTopicData();

    knowledgeSubject =
        String(data.subject || "").trim();

    knowledgeTopic =
        String(data.topic || "").trim();

    /*
     * Some older StudyMind versions may store:
     *
     * Subject::Topic
     */

    if (
        !knowledgeTopic &&
        knowledgeSubject.includes("::")
    ) {

        const parts =
            knowledgeSubject.split("::");

        knowledgeSubject =
            parts.shift().trim();

        knowledgeTopic =
            parts.join("::").trim();
    }

    if (!knowledgeTopic) {

        const possibleTopic =
            localStorage.getItem(
                "studyMindCurrentTopic"
            );

        if (possibleTopic) {
            knowledgeTopic =
                possibleTopic.trim();
        }
    }

    setText(
        "knowledgeSubject",
        knowledgeSubject || "Study Topic"
    );

    setText(
        "knowledgeTopic",
        knowledgeTopic || "Current Topic"
    );
}


/* =========================================================
   PREMIUM
========================================================= */

async function verifyPremium() {

    try {

        if (
            typeof window.supabaseClient ===
            "undefined"
        ) {
            console.warn(
                "StudyMind Knowledge Check: Shared Supabase client unavailable."
            );

            return false;
        }

        const {
            data,
            error
        } = await window.supabaseClient.auth.getSession();

        if (error || !data || !data.session) {

            console.warn(
                "StudyMind Knowledge Check: No authenticated session."
            );

            return false;
        }

        const response =
            await fetch(
                PREMIUM_STATUS_ENDPOINT,
                {
                    method: "GET",
                    headers: {
                        "Authorization":
                            `Bearer ${data.session.access_token}`
                    }
                }
            );

        if (!response.ok) {
            return false;
        }

        const result =
            await response.json();

        /*
         * Support several possible backend response shapes.
         */

        const premium =
            result?.premium === true ||
            result?.isPremium === true ||
            result?.is_premium === true ||
            result?.data?.premium === true ||
            result?.data?.isPremium === true;

        knowledgePremium = premium;
        knowledgePremiumVerified = true;

        return premium;

    } catch (error) {

        console.error(
            "StudyMind Knowledge Check: Premium verification failed.",
            error
        );

        return false;
    }
}


/* =========================================================
   FREE USAGE
========================================================= */

function getUsageCount() {

    const count =
        Number(
            localStorage.getItem(USAGE_KEY)
        );

    if (!Number.isFinite(count) || count < 0) {
        return 0;
    }

    return count;
}


function setUsageCount(count) {

    localStorage.setItem(
        USAGE_KEY,
        String(Math.max(0, count))
    );
}


function incrementUsageCount() {

    const current =
        getUsageCount();

    const next =
        current + 1;

    setUsageCount(next);

    updateUsageUI();

    return next;
}


function updateUsageUI() {

    const used =
        getUsageCount();

    const percentage =
        Math.min(
            100,
            (used / FREE_KNOWLEDGE_CHECK_LIMIT) *
            100
        );

    setText(
        "knowledgeUsageText",
        `${used} of ${FREE_KNOWLEDGE_CHECK_LIMIT} used`
    );

    const bar =
        $("knowledgeUsageBar");

    if (bar) {
        bar.style.width =
            `${percentage}%`;
    }
}


/* =========================================================
   QUESTION COUNT
========================================================= */

function getSelectedQuestionCount() {

    const selector =
        $("knowledgeQuestionCount");

    if (!selector) {
        return 5;
    }

    const value =
        Number(selector.value);

    if (
        AVAILABLE_COUNTS.includes(value)
    ) {
        return value;
    }

    return 5;
}


function setupQuestionCountSelector() {

    const selector =
        $("knowledgeQuestionCount");

    if (!selector) {
        return;
    }

    selector.addEventListener(
        "change",
        () => {

            selectedQuestionCount =
                getSelectedQuestionCount();

            setText(
                "knowledgeQuestionCountText",
                `${selectedQuestionCount} Questions`
            );

            setText(
                "knowledgeProgressText",
                `0 of ${selectedQuestionCount} answered`
            );
        }
    );
}


/* =========================================================
   STORED QUESTIONS
========================================================= */

function getTopicStorageKey() {

    return `${knowledgeSubject}::${knowledgeTopic}`;
}


function getStoredQuestions() {

    const stored =
        readJSON(
            QUESTIONS_KEY,
            {}
        );

    if (!stored || typeof stored !== "object") {
        return null;
    }

    const key =
        getTopicStorageKey();

    if (
        Array.isArray(stored[key]) &&
        stored[key].length
    ) {
        return stored[key];
    }

    /*
     * Compatibility with topic-only storage.
     */

    if (
        Array.isArray(stored[knowledgeTopic]) &&
        stored[knowledgeTopic].length
    ) {
        return stored[knowledgeTopic];
    }

    return null;
}


/* =========================================================
   QUESTION NORMALIZATION
========================================================= */

function normalizeQuestion(rawQuestion) {

    if (!rawQuestion) {
        return null;
    }

    const questionText =
        rawQuestion.question ||
        rawQuestion.questionText ||
        rawQuestion.prompt ||
        rawQuestion.text ||
        "";

    let options =
        rawQuestion.options ||
        rawQuestion.choices ||
        rawQuestion.answers ||
        rawQuestion.choicesList ||
        [];

    if (!Array.isArray(options)) {
        options = [];
    }

    options =
        options
            .map(option => {

                if (
                    typeof option ===
                    "string"
                ) {
                    return option;
                }

                if (
                    option &&
                    typeof option ===
                    "object"
                ) {

                    return (
                        option.text ||
                        option.label ||
                        option.value ||
                        ""
                    );
                }

                return "";
            })
            .filter(Boolean);

    let correctAnswer =
        rawQuestion.correctAnswer ??
        rawQuestion.correct ??
        rawQuestion.answer ??
        rawQuestion.correctOption ??
        rawQuestion.correctChoice;

    let correctIndex = -1;

    if (
        typeof correctAnswer ===
        "number"
    ) {

        /*
         * Support both zero-based and
         * one-based indexes.
         */

        if (
            correctAnswer >= 0 &&
            correctAnswer < options.length
        ) {
            correctIndex =
                correctAnswer;
        } else if (
            correctAnswer >= 1 &&
            correctAnswer <= options.length
        ) {
            correctIndex =
                correctAnswer - 1;
        }

    } else if (
        typeof correctAnswer ===
        "string"
    ) {

        const normalized =
            correctAnswer
                .trim()
                .toLowerCase();

        correctIndex =
            options.findIndex(
                option =>
                    String(option)
                        .trim()
                        .toLowerCase() ===
                    normalized
            );

        /*
         * Support A/B/C/D style answers.
         */

        if (
            correctIndex === -1 &&
            /^[a-z]$/i.test(
                normalized
            )
        ) {

            const index =
                normalized.charCodeAt(0) -
                97;

            if (
                index >= 0 &&
                index < options.length
            ) {
                correctIndex = index;
            }
        }

        /*
         * Support "Option 1", "Option 2", etc.
         */

        if (
            correctIndex === -1
        ) {

            const match =
                normalized.match(
                    /(?:option|choice)\s*(\d+)/
                );

            if (match) {

                const index =
                    Number(match[1]) - 1;

                if (
                    index >= 0 &&
                    index < options.length
                ) {
                    correctIndex =
                        index;
                }
            }
        }
    }

    if (
        correctIndex < 0 ||
        correctIndex >= options.length
    ) {

        /*
         * Some APIs provide the answer
         * as an index in another property.
         */

        const possibleIndex =
            Number(
                rawQuestion.correctIndex
            );

        if (
            Number.isInteger(
                possibleIndex
            ) &&
            possibleIndex >= 0 &&
            possibleIndex < options.length
        ) {
            correctIndex =
                possibleIndex;
        }
    }

    return {

        question:
            String(questionText),

        options,

        correctIndex,

        explanation:
            rawQuestion.explanation ||
            rawQuestion.explain ||
            rawQuestion.feedback ||
            "",

        raw:
            rawQuestion
    };
}


function normalizeQuestions(rawQuestions) {

    if (!Array.isArray(rawQuestions)) {
        return [];
    }

    return rawQuestions
        .map(normalizeQuestion)
        .filter(question =>
            question &&
            question.question &&
            question.options.length >= 2 &&
            question.correctIndex >= 0
        );
}


/* =========================================================
   JSON EXTRACTION
========================================================= */

function extractQuestionsFromResponse(data) {

    if (!data) {
        return [];
    }

    if (
        Array.isArray(data)
    ) {
        return data;
    }

    if (
        Array.isArray(data.questions)
    ) {
        return data.questions;
    }

    if (
        Array.isArray(data.data?.questions)
    ) {
        return data.data.questions;
    }

    if (
        Array.isArray(data.result?.questions)
    ) {
        return data.result.questions;
    }

    if (
        typeof data.text ===
        "string"
    ) {
        return parseQuestionText(
            data.text
        );
    }

    if (
        typeof data.response ===
        "string"
    ) {
        return parseQuestionText(
            data.response
        );
    }

    return [];
}


function parseQuestionText(text) {

    if (!text) {
        return [];
    }

    let cleaned =
        String(text)
            .trim();

    /*
     * Remove markdown code fences.
     */

    cleaned =
        cleaned
            .replace(
                /^```(?:json)?/i,
                ""
            )
            .replace(
                /```$/i,
                ""
            )
            .trim();

    try {

        const parsed =
            JSON.parse(cleaned);

        return extractQuestionsFromResponse(
            parsed
        );

    } catch (_) {

        /*
         * Try to locate the JSON array
         * inside the response.
         */

        const start =
            cleaned.indexOf("[");

        const end =
            cleaned.lastIndexOf("]");

        if (
            start !== -1 &&
            end !== -1 &&
            end > start
        ) {

            try {

                const parsed =
                    JSON.parse(
                        cleaned.slice(
                            start,
                            end + 1
                        )
                    );

                return parsed;

            } catch (_) {
                return [];
            }
        }
    }

    return [];
}


/* =========================================================
   QUESTION GENERATION
========================================================= */

async function generateQuestions() {

    const payload = {

        subject:
            knowledgeSubject,

        topic:
            knowledgeTopic,

        curriculum:
            getCurriculum(),

        difficulty:
            getDifficulty(),

        count:
            selectedQuestionCount,

        questionCount:
            selectedQuestionCount,

        type:
            "knowledge-check",

        requestType:
            "knowledge-check",

        mode:
            "study",

        instructions:
            `
Create ${selectedQuestionCount} high-quality multiple-choice
questions for the following student.

Subject: ${knowledgeSubject}
Topic: ${knowledgeTopic}
Curriculum: ${getCurriculum()}

Every question must have:
- question
- options
- correctAnswer
- explanation

The correctAnswer should identify the correct option.
Questions must test actual understanding, not random trivia.
`
    };


    /* =====================================================
       PRIMARY ENDPOINT
    ===================================================== */

    try {

        const response =
            await fetch(
                GENERATE_ENDPOINT,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(payload)
                }
            );

        if (response.ok) {

            const data =
                await response.json();

            const generated =
                normalizeQuestions(
                    extractQuestionsFromResponse(
                        data
                    )
                );

            if (
                generated.length >=
                selectedQuestionCount
            ) {

                return generated
                    .slice(
                        0,
                        selectedQuestionCount
                    );
            }

            if (
                generated.length > 0
            ) {
                return generated;
            }
        }

    } catch (error) {

        console.warn(
            "Knowledge Check primary endpoint failed:",
            error
        );
    }


    /* =====================================================
       FALLBACK — ASK AI
    ===================================================== */

    try {

        const fallbackPayload = {

            message: `
Create ${selectedQuestionCount} multiple-choice
Knowledge Check questions.

Subject: ${knowledgeSubject}
Topic: ${knowledgeTopic}
Curriculum: ${getCurriculum()}

Return ONLY valid JSON in this format:

{
  "questions": [
    {
      "question": "Question",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correctAnswer": "Option A",
      "explanation": "Brief explanation."
    }
  ]
}
`,

            subject:
                knowledgeSubject,

            topic:
                knowledgeTopic,

            difficulty:
                getDifficulty(),

            count:
                selectedQuestionCount,

            questionCount:
                selectedQuestionCount,

            type:
                "knowledge-check",

            requestType:
                "knowledge-check",

            mode:
                "study"
        };


        const response =
            await fetch(
                ASK_AI_ENDPOINT,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            fallbackPayload
                        )
                }
            );

        if (!response.ok) {
            throw new Error(
                `AI endpoint returned ${response.status}`
            );
        }

        const data =
            await response.json();

        const generated =
            normalizeQuestions(
                extractQuestionsFromResponse(
                    data
                )
            );

        if (generated.length) {

            return generated
                .slice(
                    0,
                    selectedQuestionCount
                );
        }

    } catch (error) {

        console.error(
            "Knowledge Check fallback failed:",
            error
        );
    }

    return [];
}


/* =========================================================
   CURRICULUM / DIFFICULTY HELPERS
========================================================= */

function getCurriculum() {

    const plan =
        readJSON(
            "studyMindPlan",
            {}
        );

    return (
        plan?.curriculum ||
        localStorage.getItem(
            "studyMindCurriculum"
        ) ||
        "Nigerian Senior Secondary Curriculum"
    );
}


function getDifficulty() {

    const plan =
        readJSON(
            "studyMindPlan",
            {}
        );

    return (
        plan?.difficulty ||
        "balanced"
    );
}


/* =========================================================
   SAVE QUESTIONS
========================================================= */

function saveQuestionsToStorage(list) {

    const stored =
        readJSON(
            QUESTIONS_KEY,
            {}
        );

    const key =
        getTopicStorageKey();

    stored[key] =
        list.map(question => ({
            question:
                question.question,

            options:
                question.options,

            correctAnswer:
                question.options[
                    question.correctIndex
                ],

            explanation:
                question.explanation
        }));

    writeJSON(
        QUESTIONS_KEY,
        stored
    );
}


/* =========================================================
   DUOLINGO QUESTION RENDERER
========================================================= */

function renderCurrentQuestion() {

    const container =
        $("knowledgeQuestions");

    if (!container) {
        return;
    }

    if (
        currentQuestionIndex >=
        questions.length
    ) {
        finishKnowledgeCheck();
        return;
    }

    const question =
        questions[
            currentQuestionIndex
        ];

    currentQuestionAnswered = false;
    currentQuestionCorrect = false;

    const questionNumber =
        currentQuestionIndex + 1;

    const total =
        questions.length;


    setText(
        "knowledgeProgressText",
        `${questionNumber} of ${total}`
    );

    setText(
        "knowledgeQuestionCountText",
        `${total} Questions`
    );


    const progressBar =
        $("knowledgeProgressBar");

    if (progressBar) {

        progressBar.style.width =
            `${(
                currentQuestionIndex /
                total
            ) * 100}%`;
    }


    container.innerHTML = "";


    const card =
        document.createElement(
            "article"
        );

    card.className =
        "knowledge-question-card knowledge-question-active";


    const number =
        document.createElement(
            "div"
        );

    number.className =
        "knowledge-question-number";

    number.textContent =
        `Question ${questionNumber}`;


    const questionText =
        document.createElement(
            "div"
        );

    questionText.className =
        "knowledge-question";

    questionText.innerHTML =
        formatQuestionText(
            question.question
        );


    const options =
        document.createElement(
            "div"
        );

    options.className =
        "knowledge-options";


    question.options.forEach(
        (option, index) => {

            const wrapper =
                document.createElement(
                    "div"
                );

            wrapper.className =
                "knowledge-option";


            const input =
                document.createElement(
                    "input"
                );

            input.type =
                "radio";

            input.name =
                "knowledgeAnswer";

            input.id =
                `knowledgeOption_${index}`;

            input.value =
                String(index);


            const label =
                document.createElement(
                    "label"
                );

            label.htmlFor =
                input.id;

            label.innerHTML =
                `
                <span class="knowledge-option-letter">
                    ${String.fromCharCode(65 + index)}
                </span>
                <span class="knowledge-option-text">
                    ${escapeHTML(option)}
                </span>
                `;


            input.addEventListener(
                "change",
                () => {

                    if (
                        currentQuestionAnswered
                    ) {
                        return;
                    }

                    checkCurrentAnswer(
                        index,
                        card
                    );
                }
            );


            wrapper.appendChild(input);
            wrapper.appendChild(label);

            options.appendChild(wrapper);
        }
    );


    const feedback =
        document.createElement(
            "div"
        );

    feedback.className =
        "knowledge-answer-feedback";

    feedback.id =
        "knowledgeAnswerFeedback";


    const continueButton =
        document.createElement(
            "button"
        );

    continueButton.type =
        "button";

    continueButton.className =
        "knowledge-next-button";

    continueButton.id =
        "knowledgeNextButton";

    continueButton.textContent =
        currentQuestionIndex ===
        total - 1
            ? "See Results"
            : "Continue →";

    continueButton.style.display =
        "none";


    continueButton.addEventListener(
        "click",
        () => {

            if (
                !currentQuestionAnswered
            ) {
                return;
            }

            currentQuestionIndex++;

            renderCurrentQuestion();

            scrollToQuestion();
        }
    );


    card.appendChild(number);
    card.appendChild(questionText);
    card.appendChild(options);
    card.appendChild(feedback);
    card.appendChild(continueButton);

    container.appendChild(card);


    renderMath();
}


/* =========================================================
   CHECK ANSWER
========================================================= */

function checkCurrentAnswer(
    selectedIndex,
    card
) {

    if (
        currentQuestionAnswered
    ) {
        return;
    }

    currentQuestionAnswered =
        true;

    const question =
        questions[
            currentQuestionIndex
        ];

    const isCorrect =
        selectedIndex ===
        question.correctIndex;

    currentQuestionCorrect =
        isCorrect;

    answeredCount++;

    if (isCorrect) {
        score++;
    }


    questionResults[
        currentQuestionIndex
    ] = {

        question:
            question.question,

        selectedIndex,

        correctIndex:
            question.correctIndex,

        correct:
            isCorrect,

        explanation:
            question.explanation,

        correctAnswer:
            question.options[
                question.correctIndex
            ]
    };


    /*
     * Lock every option.
     */

    const inputs =
        card.querySelectorAll(
            "input"
        );

    inputs.forEach(
        input => {
            input.disabled = true;
        }
    );


    /*
     * Find labels.
     */

    const labels =
        card.querySelectorAll(
            ".knowledge-option label"
        );


    labels.forEach(
        (label, index) => {

            label.classList.add(
                "knowledge-option-locked"
            );

            if (
                index ===
                question.correctIndex
            ) {

                label.classList.add(
                    "knowledge-option-correct"
                );
            }

            if (
                index ===
                selectedIndex &&
                !isCorrect
            ) {

                label.classList.add(
                    "knowledge-option-wrong"
                );
            }
        }
    );


    /*
     * Make the entire card green/red.
     */

    if (isCorrect) {

        card.classList.add(
            "knowledge-question-correct"
        );

    } else {

        card.classList.add(
            "knowledge-question-wrong"
        );
    }


    /*
     * Feedback.
     */

    const feedback =
        $("knowledgeAnswerFeedback");

    if (feedback) {

        feedback.classList.add(
            "visible"
        );

        if (isCorrect) {

            feedback.classList.add(
                "correct"
            );

            feedback.innerHTML =
                `
                <strong>Correct! 🎉</strong>
                <span>Great job — keep going!</span>
                `;

        } else {

            feedback.classList.add(
                "wrong"
            );

            const explanation =
                question.explanation
                    ? `<div>${formatQuestionText(
                        question.explanation
                    )}</div>`
                    : "";

            feedback.innerHTML =
                `
                <strong>Not quite. ❌</strong>

                <span>
                    Correct answer:
                    <b>${escapeHTML(
                        question.options[
                            question.correctIndex
                        ]
                    )}</b>
                </span>

                ${explanation}
                `;
        }
    }


    /*
     * Show Continue.
     */

    const nextButton =
        $("knowledgeNextButton");

    if (nextButton) {

        nextButton.style.display =
            "inline-flex";

        requestAnimationFrame(
            () => {
                nextButton.classList.add(
                    "knowledge-next-visible"
                );
            }
        );
    }


    /*
     * Milo reactions + sound.
     */

    if (isCorrect) {

        triggerMiloCorrect();

    } else {

        triggerMiloWrong(
            question.explanation
        );
    }


    /*
     * Progress now reflects answered
     * questions.
     */

    const progressBar =
        $("knowledgeProgressBar");

    if (progressBar) {

        progressBar.style.width =
            `${(
                answeredCount /
                questions.length
            ) * 100}%`;
    }


    setText(
        "knowledgeProgressText",
        `${answeredCount} of ${questions.length} answered`
    );


    renderMath();
}


/* =========================================================
   MILO — CORRECT
========================================================= */

function triggerMiloCorrect() {

    try {

        if (
            window.Milo &&
            typeof window.Milo.miloCorrectAnswer ===
            "function"
        ) {

            window.Milo.miloCorrectAnswer();

            return;
        }

    } catch (error) {

        console.warn(
            "Milo correct reaction failed:",
            error
        );
    }

    /*
     * Fallback sound if Milo is unavailable.
     */

    try {

        if (
            window.Milo &&
            typeof window.Milo.playSound ===
            "function"
        ) {

            window.Milo.playSound(
                "correct"
            );
        }

    } catch (_) {}
}


/* =========================================================
   MILO — WRONG
========================================================= */

function triggerMiloWrong(
    explanation
) {

    try {

        if (
            window.Milo &&
            typeof window.Milo.miloWrongAnswer ===
            "function"
        ) {

            window.Milo.miloWrongAnswer(
                explanation ||
                "Let's review that one together."
            );

            return;
        }

    } catch (error) {

        console.warn(
            "Milo wrong reaction failed:",
            error
        );
    }

    try {

        if (
            window.Milo &&
            typeof window.Milo.playSound ===
            "function"
        ) {

            window.Milo.playSound(
                "wrong"
            );
        }

    } catch (_) {}
}


/* =========================================================
   FINISH KNOWLEDGE CHECK
========================================================= */

function finishKnowledgeCheck() {

    const percentage =
        questions.length
            ? Math.round(
                (score /
                    questions.length) *
                100
            )
            : 0;

    const passed =
        percentage >= PASS_PERCENTAGE;


    /*
     * Free users consume one
     * Knowledge Check.
     */

    if (!knowledgePremium) {
        incrementUsageCount();
    }


    /*
     * Hide question content.
     */

    hideElement(
        "knowledgeContent"
    );

    hideElement(
        "knowledgeControls"
    );

    showElement(
        "knowledgeResult"
    );


    /*
     * Result information.
     */

    setText(
        "knowledgeScore",
        `${score}/${questions.length}`
    );


    if (passed) {

        setText(
            "knowledgeResultIcon",
            "🎉"
        );

        setText(
            "knowledgeResultTitle",
            "Knowledge Check Passed!"
        );

        setText(
            "knowledgeResultText",
            `Excellent work! You scored ${percentage}%. You've shown that you understand ${knowledgeTopic}.`
        );


        markTopicCompleted();


        /*
         * Milo celebrates completion.
         */

        try {

            if (
                window.Milo &&
                typeof window.Milo.miloStudySessionComplete ===
                "function"
            ) {

                window.Milo.miloStudySessionComplete();

            } else if (
                window.Milo &&
                typeof window.Milo.show ===
                "function"
            ) {

                window.Milo.show(
                    "You passed! 🎉 I'm so proud of you!",
                    "celebrate"
                );
            }

        } catch (_) {}


    } else {

        setText(
            "knowledgeResultIcon",
            "💪"
        );

        setText(
            "knowledgeResultTitle",
            "Keep Practicing!"
        );

        setText(
            "knowledgeResultText",
            `You scored ${percentage}%. You need ${PASS_PERCENTAGE}% to pass. Review the topic and try again.`
        );


        /*
         * IMPORTANT:
         * A failed Knowledge Check does NOT
         * complete the topic.
         */

        showReview();
    }


    renderReview();

    /*
     * Final MathJax pass.
     */

    renderMath();
}


/* =========================================================
   TOPIC COMPLETION
========================================================= */

function markTopicCompleted() {

    const topicKey =
        `${knowledgeSubject}::${knowledgeTopic}`;


    /*
     * New streak system uses this key.
     */

    const completedTopics =
        readJSON(
            COMPLETED_TOPICS_KEY,
            []
        );


    const normalized =
        Array.isArray(
            completedTopics
        )
            ? completedTopics
            : [];


    if (
        !normalized.includes(
            topicKey
        )
    ) {

        normalized.push(
            topicKey
        );

        writeJSON(
            COMPLETED_TOPICS_KEY,
            normalized
        );
    }


    /*
     * Preserve Knowledge Check's
     * original completion storage.
     */

    const completedQuestions =
        readJSON(
            COMPLETED_KEY,
            []
        );


    const questionList =
        Array.isArray(
            completedQuestions
        )
            ? completedQuestions
            : [];


    if (
        !questionList.includes(
            topicKey
        )
    ) {

        questionList.push(
            topicKey
        );
    }


    /*
     * Compatibility with older versions
     * that stored only the topic name.
     */

    if (
        !questionList.includes(
            knowledgeTopic
        )
    ) {

        questionList.push(
            knowledgeTopic
        );
    }


    writeJSON(
        COMPLETED_KEY,
        questionList
    );


    /*
     * Tell the streak engine that the
     * completion state changed.
     */

    try {

        if (
            window.StudyMindStreak &&
            typeof window.StudyMindStreak.checkTodayCompletion ===
            "function"
        ) {

            window.StudyMindStreak.checkTodayCompletion();
        }

    } catch (error) {

        console.warn(
            "Knowledge Check: streak synchronization failed.",
            error
        );
    }


    /*
     * Notify dashboard and other pages.
     */

    window.dispatchEvent(
        new CustomEvent(
            "studyMindTopicCompleted",
            {
                detail: {
                    subject:
                        knowledgeSubject,
                    topic:
                        knowledgeTopic,
                    source:
                        "knowledge-check"
                }
            }
        )
    );
}


/* =========================================================
   REVIEW
========================================================= */

function showReview() {

    const review =
        $("knowledgeReview");

    if (review) {
        review.classList.add(
            "visible"
        );
    }
}


function renderReview() {

    const container =
        $("knowledgeReviewItems");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    questionResults
        .filter(result =>
            result &&
            !result.correct
        )
        .forEach(
            result => {

                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "knowledge-review-item";


                item.innerHTML =
                    `
                    <div class="knowledge-review-question">
                        ${formatQuestionText(
                            result.question
                        )}
                    </div>

                    <div class="knowledge-review-answer">
                        Your answer:
                        <b>
                            ${escapeHTML(
                                questions[
                                    questionResults.indexOf(
                                        result
                                    )
                                ]?.options?.[
                                    result.selectedIndex
                                ] || "—"
                            )}
                        </b>
                    </div>

                    <div class="knowledge-review-answer">
                        Correct answer:
                        <b>
                            ${escapeHTML(
                                result.correctAnswer
                            )}
                        </b>
                    </div>

                    ${
                        result.explanation
                            ? `
                            <div class="knowledge-review-answer">
                                ${formatQuestionText(
                                    result.explanation
                                )}
                            </div>
                            `
                            : ""
                    }
                    `;

                container.appendChild(
                    item
                );
            }
        );
}


/* =========================================================
   PAGE STATE
========================================================= */

function showKnowledgeContent() {

    hideElement(
        "knowledgeLoading"
    );

    hideElement(
        "knowledgeError"
    );

    hideElement(
        "knowledgeLimit"
    );

    showElement(
        "knowledgeContent"
    );
}


function showError(message) {

    hideElement(
        "knowledgeLoading"
    );

    hideElement(
        "knowledgeContent"
    );

    hideElement(
        "knowledgeControls"
    );

    const errorText =
        $("knowledgeErrorText");

    if (errorText) {
        errorText.textContent =
            message;
    }

    showElement(
        "knowledgeError"
    );
}


/* =========================================================
   LIMIT
========================================================= */

function showFreeLimit() {

    hideElement(
        "knowledgeLoading"
    );

    hideElement(
        "knowledgeContent"
    );

    hideElement(
        "knowledgeControls"
    );

    showElement(
        "knowledgeLimit"
    );
}


/* =========================================================
   CONTROLS UI
========================================================= */

function updateControlsUI() {

    const controls =
        $("knowledgeControls");

    if (!controls) {
        return;
    }

    controls.classList.add(
        "visible"
    );

    controls.style.display =
        "block";


    const premiumBadge =
        $("knowledgePremiumBadge");

    const usage =
        $("knowledgeUsage");

    const countSelector =
        $("knowledgeCountSelector");


    if (knowledgePremium) {

        if (premiumBadge) {
            premiumBadge.style.display =
                "inline-flex";
        }

        if (usage) {
            usage.style.display =
                "none";
        }

        if (countSelector) {
            countSelector.style.display =
                "block";

            countSelector.classList.add(
                "visible"
            );
        }

    } else {

        if (premiumBadge) {
            premiumBadge.style.display =
                "none";
        }

        if (usage) {
            usage.style.display =
                "block";
        }

        if (countSelector) {
            countSelector.style.display =
                "none";

            countSelector.classList.remove(
                "visible"
            );
        }

        updateUsageUI();
    }
}


/* =========================================================
   START
========================================================= */

async function startKnowledgeCheck() {

    loadTopic();

    setupQuestionCountSelector();


    /*
     * Premium verification.
     */

    await verifyPremium();


    /*
     * Free users can make five checks.
     */

    if (
        !knowledgePremium &&
        getUsageCount() >=
        FREE_KNOWLEDGE_CHECK_LIMIT
    ) {

        updateControlsUI();

        showFreeLimit();

        return;
    }


    /*
     * Premium users choose the count.
     */

    if (knowledgePremium) {

        selectedQuestionCount =
            getSelectedQuestionCount();

    } else {

        selectedQuestionCount =
            5;
    }


    updateControlsUI();


    /*
     * First try cached questions.
     */

    let generatedQuestions =
        getStoredQuestions();


    /*
     * Generate fresh questions when
     * the stored set isn't sufficient.
     */

    if (
        !generatedQuestions ||
        generatedQuestions.length <
        selectedQuestionCount
    ) {

        generatedQuestions =
            await generateQuestions();

        if (
            generatedQuestions.length
        ) {

            saveQuestionsToStorage(
                generatedQuestions
            );
        }
    }


    questions =
        normalizeQuestions(
            generatedQuestions || []
        )
            .slice(
                0,
                selectedQuestionCount
            );


    if (
        questions.length === 0
    ) {

        showError(
            "StudyMind AI could not create valid questions for this topic. Please try again."
        );

        return;
    }


    /*
     * If the API returned fewer questions
     * than requested, use what was generated.
     */

    selectedQuestionCount =
        questions.length;


    currentQuestionIndex = 0;
    score = 0;
    answeredCount = 0;
    questionResults = [];


    setText(
        "knowledgeQuestionCountText",
        `${questions.length} Questions`
    );


    setText(
        "knowledgeProgressText",
        `1 of ${questions.length}`
    );


    showKnowledgeContent();

    renderCurrentQuestion();
}


/* =========================================================
   FORMAT / SECURITY
========================================================= */

function escapeHTML(value) {

    return String(
        value ?? ""
    )
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


function formatQuestionText(value) {

    /*
     * Escape HTML first so generated AI text
     * cannot inject arbitrary markup.
     *
     * MathJax delimiters remain intact.
     */

    return escapeHTML(
        value
    )
        .replace(
            /\n/g,
            "<br>"
        );
}


function renderMath() {

    try {

        if (
            window.MathJax &&
            typeof window.MathJax.typesetPromise ===
            "function"
        ) {

            window.MathJax
                .typesetPromise()
                .catch(() => {});
        }

    } catch (_) {}
}


/* =========================================================
   SCROLL
========================================================= */

function scrollToQuestion() {

    const container =
        $("knowledgeQuestions");

    if (!container) {
        return;
    }

    setTimeout(
        () => {

            container.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        },
        80
    );
}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        startKnowledgeCheck()
            .catch(
                error => {

                    console.error(
                        "Knowledge Check initialization failed:",
                        error
                    );

                    showError(
                        "Something went wrong while preparing your Knowledge Check."
                    );
                }
            );
    }
);


/* =========================================================
   PUBLIC API
========================================================= */

window.StudyMindKnowledgeCheck = {

    getQuestions:
        () => questions,

    getCurrentQuestion:
        () =>
            questions[
                currentQuestionIndex
            ],

    getScore:
        () => score,

    getProgress:
        () => ({
            current:
                currentQuestionIndex + 1,
            total:
                questions.length,
            answered:
                answeredCount
        }),

    restart:
        () => {
            currentQuestionIndex = 0;
            score = 0;
            answeredCount = 0;
            questionResults = [];
            renderCurrentQuestion();
        }
};
