
"use strict";

/* =========================================================
   STUDYMIND AI — DUOLINGO-STYLE KNOWLEDGE CHECK
   COMPLETE FIXED VERSION

   FIXES:
   - One question at a time
   - Immediate green correct state
   - Immediate red incorrect state
   - Correct answer turns green when student is wrong
   - Immediate sound
   - Immediate Milo reaction
   - Wrong-answer explanation
   - Continue button
   - 60% pass requirement
   - Failed checks do NOT complete topics
   - Preserves Premium/free usage
   - Preserves AI generation
   - Preserves stored questions
   - Preserves streak integration
========================================================= */


/* =========================================================
   CONFIGURATION
========================================================= */

const PASS_PERCENTAGE = 60;

const FREE_KNOWLEDGE_CHECK_LIMIT = 5;

const PREMIUM_STATUS_ENDPOINT =
    "/api/premium/status";

const GENERATE_ENDPOINT =
    "/api/generate-questions";

const ASK_AI_ENDPOINT =
    "/api/ask-ai";

const TOPIC_KEY =
    "studyMindKnowledgeCheckTopic";

const USAGE_KEY =
    "studyMindKnowledgeCheckUsageCount";

const COMPLETED_KEY =
    "studyMindCompletedQuestionTopics";

const COMPLETED_TOPICS_KEY =
    "studyMindCompletedTopics";

const QUESTIONS_KEY =
    "studyMindTopicQuestions";

const AVAILABLE_COUNTS =
    [5, 10, 20, 30, 40, 50, 60];


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
   AUDIO
========================================================= */

let knowledgeAudioContext = null;


/* =========================================================
   DOM HELPERS
========================================================= */

function $(id) {

    return document.getElementById(id);
}


function showElement(id) {

    const el = $(id);

    if (!el) {
        return;
    }

    el.style.display = "";

    el.classList.add("visible");
}


function hideElement(id) {

    const el = $(id);

    if (!el) {
        return;
    }

    el.style.display = "none";

    el.classList.remove("visible");
}


function setText(id, value) {

    const el = $(id);

    if (el) {
        el.textContent = value;
    }
}


/* =========================================================
   STORAGE
========================================================= */

function readJSON(key, fallback) {

    try {

        const raw =
            localStorage.getItem(key);

        if (!raw) {
            return fallback;
        }

        const parsed =
            JSON.parse(raw);

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

    const raw =
        localStorage.getItem(
            TOPIC_KEY
        );

    if (!raw) {

        return {
            subject: "",
            topic: ""
        };
    }

    try {

        const parsed =
            JSON.parse(raw);

        if (
            parsed &&
            typeof parsed === "object"
        ) {

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

    const data =
        getTopicData();

    knowledgeSubject =
        String(
            data.subject || ""
        ).trim();

    knowledgeTopic =
        String(
            data.topic || ""
        ).trim();


    /*
     * Compatibility:
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


    /*
     * Older current-topic storage.
     */

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
        knowledgeSubject ||
        "Study Topic"
    );

    setText(
        "knowledgeTopic",
        knowledgeTopic ||
        "Current Topic"
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
        } =
            await window.supabaseClient.auth
                .getSession();


        if (
            error ||
            !data ||
            !data.session
        ) {

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


        const premium =
            result?.premium === true ||
            result?.isPremium === true ||
            result?.is_premium === true ||
            result?.data?.premium === true ||
            result?.data?.isPremium === true;


        knowledgePremium =
            premium;

        knowledgePremiumVerified =
            true;


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
            localStorage.getItem(
                USAGE_KEY
            )
        );

    if (
        !Number.isFinite(count) ||
        count < 0
    ) {

        return 0;
    }

    return count;
}


function setUsageCount(count) {

    localStorage.setItem(
        USAGE_KEY,
        String(
            Math.max(
                0,
                count
            )
        )
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
            (
                used /
                FREE_KNOWLEDGE_CHECK_LIMIT
            ) * 100
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
        Number(
            selector.value
        );


    if (
        AVAILABLE_COUNTS.includes(
            value
        )
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

    return (
        `${knowledgeSubject}::${knowledgeTopic}`
    );
}


function getStoredQuestions() {

    const stored =
        readJSON(
            QUESTIONS_KEY,
            {}
        );


    if (
        !stored ||
        typeof stored !== "object"
    ) {

        return null;
    }


    const key =
        getTopicStorageKey();


    if (
        Array.isArray(
            stored[key]
        ) &&
        stored[key].length
    ) {

        return stored[key];
    }


    /*
     * Compatibility:
     * topic-only storage
     */

    if (
        Array.isArray(
            stored[knowledgeTopic]
        ) &&
        stored[knowledgeTopic].length
    ) {

        return stored[
            knowledgeTopic
        ];
    }


    return null;
}


/* =========================================================
   QUESTION NORMALIZATION
========================================================= */

function normalizeQuestion(
    rawQuestion
) {

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


    /*
     * NUMBER ANSWER
     */

    if (
        typeof correctAnswer ===
        "number"
    ) {

        /*
         * Prefer zero-based indexing.
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
    }


    /*
     * STRING ANSWER
     */

    else if (
        typeof correctAnswer ===
        "string"
    ) {

        const normalized =
            correctAnswer
                .trim()
                .toLowerCase();


        /*
         * Exact option text.
         */

        correctIndex =
            options.findIndex(
                option =>
                    String(option)
                        .trim()
                        .toLowerCase() ===
                    normalized
            );


        /*
         * A/B/C/D.
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

                correctIndex =
                    index;
            }
        }


        /*
         * "Option 1"
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
                    Number(
                        match[1]
                    ) - 1;


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


    /*
     * Additional correctIndex fallback.
     */

    if (
        correctIndex < 0 ||
        correctIndex >= options.length
    ) {

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


function normalizeQuestions(
    rawQuestions
) {

    if (
        !Array.isArray(
            rawQuestions
        )
    ) {

        return [];
    }


    return rawQuestions
        .map(
            normalizeQuestion
        )
        .filter(
            question =>
                question &&
                question.question &&
                question.options.length >= 2 &&
                question.correctIndex >= 0
        );
}


/* =========================================================
   JSON EXTRACTION
========================================================= */

function extractQuestionsFromResponse(
    data
) {

    if (!data) {
        return [];
    }


    if (
        Array.isArray(data)
    ) {

        return data;
    }


    if (
        Array.isArray(
            data.questions
        )
    ) {

        return data.questions;
    }


    if (
        Array.isArray(
            data.data?.questions
        )
    ) {

        return data.data.questions;
    }


    if (
        Array.isArray(
            data.result?.questions
        )
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
        String(text).trim();


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
            JSON.parse(
                cleaned
            );

        return extractQuestionsFromResponse(
            parsed
        );

    } catch (_) {


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


    /*
     * PRIMARY ENDPOINT
     */

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
                        JSON.stringify(
                            payload
                        )
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

                return generated.slice(
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


    /*
     * FALLBACK — ASK AI
     */

    try {

        const fallbackPayload = {

            message:
                `
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


        if (
            generated.length
        ) {

            return generated.slice(
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
   CURRICULUM
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


/* =========================================================
   DIFFICULTY
========================================================= */

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

function saveQuestionsToStorage(
    list
) {

    const stored =
        readJSON(
            QUESTIONS_KEY,
            {}
        );


    const key =
        getTopicStorageKey();


    stored[key] =
        list.map(
            question => ({

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
            })
        );


    writeJSON(
        QUESTIONS_KEY,
        stored
    );
}


/* =========================================================
   RENDER CURRENT QUESTION
========================================================= */

function renderCurrentQuestion() {

    const container =
        $("knowledgeQuestions");


    if (!container) {
        return;
    }


    /*
     * Finished.
     */

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


    currentQuestionAnswered =
        false;

    currentQuestionCorrect =
        false;


    const questionNumber =
        currentQuestionIndex + 1;


    const total =
        questions.length;


    /*
     * Progress.
     */

    setText(
        "knowledgeProgressText",
        `${currentQuestionIndex} of ${total} answered`
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


    /*
     * Clear old question.
     */

    container.innerHTML = "";


    /*
     * Question card.
     */

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "knowledge-question-card knowledge-question-active";


    card.dataset.questionIndex =
        String(
            currentQuestionIndex
        );


    /*
     * Number.
     */

    const number =
        document.createElement(
            "div"
        );


    number.className =
        "knowledge-question-number";


    number.textContent =
        `Question ${questionNumber} of ${total}`;


    /*
     * Question.
     */

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


    /*
     * Options.
     */

    const optionsContainer =
        document.createElement(
            "div"
        );


    optionsContainer.className =
        "knowledge-options";


    question.options.forEach(
        (option, index) => {

            /*
             * THIS is the element that receives
             * .correct / .incorrect.
             *
             * Your previous code put the classes
             * on the LABEL instead, which is why
             * the answer place wasn't turning red.
             */

            const optionElement =
                document.createElement(
                    "div"
                );


            optionElement.className =
                "knowledge-option";


            optionElement.dataset.index =
                String(index);


            /*
             * Hidden radio input.
             */

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


            /*
             * Label.
             */

            const label =
                document.createElement(
                    "label"
                );


            label.htmlFor =
                input.id;


            label.innerHTML =
                `
                <span class="knowledge-option-letter">
                    ${String.fromCharCode(
                        65 + index
                    )}
                </span>

                <span class="knowledge-option-text">
                    ${formatQuestionText(
                        option
                    )}
                </span>
                `;


            /*
             * Clicking either the radio or
             * the visible answer card works.
             */

            input.addEventListener(
                "change",
                () => {

                    checkCurrentAnswer(
                        index,
                        card
                    );
                }
            );


            optionElement.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        input
                    ) {
                        return;
                    }


                    if (
                        currentQuestionAnswered
                    ) {
                        return;
                    }


                    input.checked =
                        true;


                    checkCurrentAnswer(
                        index,
                        card
                    );
                }
            );


            optionElement.appendChild(
                input
            );


            optionElement.appendChild(
                label
            );


            optionsContainer.appendChild(
                optionElement
            );
        }
    );


    /*
     * Feedback.
     */

    const feedback =
        document.createElement(
            "div"
        );


    feedback.className =
        "knowledge-answer-feedback";


    feedback.id =
        "knowledgeAnswerFeedback";


    /*
     * Continue.
     */

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
            ? "See Results →"
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


            /*
             * Slide the old question away.
             */

            card.classList.add(
                "knowledge-question-exit"
            );


            setTimeout(
                () => {

                    currentQuestionIndex++;

                    renderCurrentQuestion();

                    scrollToQuestion();

                },
                180
            );
        }
    );


    /*
     * Build.
     */

    card.appendChild(
        number
    );


    card.appendChild(
        questionText
    );


    card.appendChild(
        optionsContainer
    );


    card.appendChild(
        feedback
    );


    card.appendChild(
        continueButton
    );


    container.appendChild(
        card
    );


    /*
     * MathJax.
     */

    renderMath();


    /*
     * Enter animation.
     */

    requestAnimationFrame(
        () => {

            card.classList.add(
                "knowledge-question-entered"
            );
        }
    );
}


/* =========================================================
   CHECK CURRENT ANSWER
========================================================= */

function checkCurrentAnswer(
    selectedIndex,
    card
) {

    /*
     * Prevent double answers.
     */

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


    if (!question) {
        return;
    }


    const isCorrect =
        selectedIndex ===
        question.correctIndex;


    currentQuestionCorrect =
        isCorrect;


    answeredCount++;


    if (isCorrect) {
        score++;
    }


    /*
     * Save result.
     */

    questionResults[
        currentQuestionIndex
    ] = {

        question:
            question.question,

        selectedIndex:

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
     * Lock all inputs.
     */

    const inputs =
        card.querySelectorAll(
            "input"
        );


    inputs.forEach(
        input => {

            input.disabled =
                true;
        }
    );


    /*
     * Get actual option containers.
     *
     * THIS fixes the old red/green bug.
     */

    const optionElements =
        card.querySelectorAll(
            ".knowledge-option"
        );


    /*
     * Immediately apply the visual result.
     */

    optionElements.forEach(
        (optionElement, index) => {

            optionElement.classList.add(
                "knowledge-option-locked"
            );


            /*
             * Remove any old state.
             */

            optionElement.classList.remove(
                "correct",
                "incorrect",
                "knowledge-option-correct",
                "knowledge-option-wrong"
            );


            /*
             * Correct answer.
             */

            if (
                index ===
                question.correctIndex
            ) {

                optionElement.classList.add(
                    "correct"
                );

                optionElement.classList.add(
                    "knowledge-option-correct"
                );


                forceOptionState(
                    optionElement,
                    "correct"
                );
            }


            /*
             * Student chose wrong answer.
             */

            if (
                index ===
                selectedIndex &&
                !isCorrect
            ) {

                optionElement.classList.add(
                    "incorrect"
                );

                optionElement.classList.add(
                    "knowledge-option-wrong"
                );


                forceOptionState(
                    optionElement,
                    "incorrect"
                );
            }
        }
    );


    /*
     * Question card state.
     */

    card.classList.remove(
        "knowledge-question-correct",
        "knowledge-question-wrong"
    );


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
     * =====================================================
     * IMPORTANT ORDER
     *
     * 1. Visual state
     * 2. Sound
     * 3. Milo
     * 4. Explanation
     *
     * This makes the answer feel instantaneous.
     * =====================================================
     */


    /*
     * SOUND — DIRECTLY FROM ANSWER EVENT
     */

    if (isCorrect) {

        playCorrectSound();

    } else {

        playWrongSound();
    }


    /*
     * MILO — IMMEDIATELY
     */

    if (isCorrect) {

        triggerMiloCorrect();

    } else {

        triggerMiloWrong(
            question.explanation
        );
    }


    /*
     * FEEDBACK
     */

    showAnswerFeedback(
        question,
        isCorrect
    );


    /*
     * CONTINUE BUTTON
     */

    const nextButton =
        $("knowledgeNextButton");


    if (nextButton) {

        nextButton.style.display =
            "inline-flex";


        nextButton.classList.add(
            "knowledge-next-visible"
        );


        /*
         * Force visibility in case the
         * stylesheet uses opacity.
         */

        nextButton.style.opacity =
            "1";


        nextButton.style.visibility =
            "visible";
    }


    /*
     * Progress.
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
   FORCE OPTION STATE
========================================================= */

function forceOptionState(
    optionElement,
    state
) {

    if (!optionElement) {
        return;
    }


    if (
        state ===
        "correct"
    ) {

        optionElement.style.setProperty(
            "border-color",
            "#22c55e",
            "important"
        );


        optionElement.style.setProperty(
            "background",
            "rgba(34, 197, 94, 0.14)",
            "important"
        );


        optionElement.style.setProperty(
            "box-shadow",
            "0 0 0 2px rgba(34, 197, 94, 0.12)",
            "important"
        );

    } else {

        optionElement.style.setProperty(
            "border-color",
            "#ef4444",
            "important"
        );


        optionElement.style.setProperty(
            "background",
            "rgba(239, 68, 68, 0.14)",
            "important"
        );


        optionElement.style.setProperty(
            "box-shadow",
            "0 0 0 2px rgba(239, 68, 68, 0.12)",
            "important"
        );
    }
}


/* =========================================================
   ANSWER FEEDBACK
========================================================= */

function showAnswerFeedback(
    question,
    isCorrect
) {

    const feedback =
        $("knowledgeAnswerFeedback");


    if (!feedback) {
        return;
    }


    feedback.className =
        "knowledge-answer-feedback visible";


    if (isCorrect) {

        feedback.classList.add(
            "correct"
        );


        feedback.innerHTML =
            `
            <strong>✓ Correct! 🎉</strong>

            <span>
                Great job — keep going!
            </span>
            `;

    } else {

        feedback.classList.add(
            "wrong"
        );


        const explanation =
            question.explanation
                ? `
                    <div class="knowledge-feedback-explanation">
                        💡
                        ${formatQuestionText(
                            question.explanation
                        )}
                    </div>
                `
                : "";


        feedback.innerHTML =
            `
            <strong>✕ Not quite.</strong>

            <span>
                ✓ Correct answer:
                <b>
                    ${String.fromCharCode(
                        65 +
                        question.correctIndex
                    )}.
                    ${formatQuestionText(
                        question.options[
                            question.correctIndex
                        ]
                    )}
                </b>
            </span>

            ${explanation}
            `;
    }


    /*
     * Trigger feedback animation.
     */

    requestAnimationFrame(
        () => {

            feedback.classList.add(
                "knowledge-feedback-visible"
            );
        }
    );
}


/* =========================================================
   AUDIO CONTEXT
========================================================= */

function getKnowledgeAudioContext() {

    if (
        knowledgeAudioContext
    ) {

        return knowledgeAudioContext;
    }


    const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;


    if (!AudioContext) {

        return null;
    }


    try {

        knowledgeAudioContext =
            new AudioContext();

    } catch (error) {

        console.warn(
            "StudyMind: AudioContext unavailable.",
            error
        );

        return null;
    }


    return knowledgeAudioContext;
}


/* =========================================================
   CORRECT SOUND
========================================================= */

function playCorrectSound() {

    const context =
        getKnowledgeAudioContext();


    if (!context) {
        return;
    }


    /*
     * Resume immediately because browsers can
     * suspend AudioContext until a user gesture.
     */

    try {

        if (
            context.state ===
            "suspended"
        ) {

            context.resume()
                .catch(() => {});
        }

    } catch (_) {}


    const now =
        context.currentTime;


    /*
     * Two-note success chime.
     */

    const oscillator1 =
        context.createOscillator();


    const oscillator2 =
        context.createOscillator();


    const gain1 =
        context.createGain();


    const gain2 =
        context.createGain();


    oscillator1.type =
        "sine";


    oscillator2.type =
        "sine";


    oscillator1.frequency.setValueAtTime(
        660,
        now
    );


    oscillator1.frequency.exponentialRampToValueAtTime(
        880,
        now + 0.10
    );


    oscillator2.frequency.setValueAtTime(
        880,
        now + 0.075
    );


    oscillator2.frequency.exponentialRampToValueAtTime(
        1046,
        now + 0.18
    );


    gain1.gain.setValueAtTime(
        0.0001,
        now
    );


    gain1.gain.exponentialRampToValueAtTime(
        0.18,
        now + 0.01
    );


    gain1.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 0.16
    );


    gain2.gain.setValueAtTime(
        0.0001,
        now + 0.075
    );


    gain2.gain.exponentialRampToValueAtTime(
        0.16,
        now + 0.085
    );


    gain2.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 0.24
    );


    oscillator1.connect(
        gain1
    );


    oscillator2.connect(
        gain2
    );


    gain1.connect(
        context.destination
    );


    gain2.connect(
        context.destination
    );


    oscillator1.start(
        now
    );


    oscillator1.stop(
        now + 0.17
    );


    oscillator2.start(
        now + 0.075
    );


    oscillator2.stop(
        now + 0.25
    );
}


/* =========================================================
   WRONG SOUND
========================================================= */

function playWrongSound() {

    const context =
        getKnowledgeAudioContext();


    if (!context) {
        return;
    }


    try {

        if (
            context.state ===
            "suspended"
        ) {

            context.resume()
                .catch(() => {});
        }

    } catch (_) {}


    const now =
        context.currentTime;


    const oscillator =
        context.createOscillator();


    const gain =
        context.createGain();


    oscillator.type =
        "sine";


    oscillator.frequency.setValueAtTime(
        300,
        now
    );


    oscillator.frequency.exponentialRampToValueAtTime(
        180,
        now + 0.16
    );


    gain.gain.setValueAtTime(
        0.0001,
        now
    );


    gain.gain.exponentialRampToValueAtTime(
        0.14,
        now + 0.01
    );


    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 0.20
    );


    oscillator.connect(
        gain
    );


    gain.connect(
        context.destination
    );


    oscillator.start(
        now
    );


    oscillator.stop(
        now + 0.21
    );
}


/* =========================================================
   MILO HELPERS
========================================================= */

function getMiloElement() {

    const selectors = [

        "#milo",

        "#miloCharacter",

        ".milo-character",

        ".milo",

        ".milo-container",

        "[data-milo]"
    ];


    for (
        const selector of selectors
    ) {

        const element =
            document.querySelector(
                selector
            );


        if (element) {

            return element;
        }
    }


    return null;
}


/* =========================================================
   MILO CORRECT
========================================================= */

function triggerMiloCorrect() {

    /*
     * FIRST:
     * Immediately animate the actual Milo element.
     *
     * This happens regardless of whether the
     * Milo JavaScript API exists.
     */

    animateMilo(
        "correct"
    );


    /*
     * THEN notify existing Milo system.
     */

    try {

        if (
            window.Milo &&
            typeof window.Milo.miloCorrectAnswer ===
            "function"
        ) {

            window.Milo.miloCorrectAnswer();

        } else if (
            window.Milo &&
            typeof window.Milo.react ===
            "function"
        ) {

            window.Milo.react(
                "correct"
            );

        } else if (
            window.Milo &&
            typeof window.Milo.show ===
            "function"
        ) {

            window.Milo.show(
                "Correct! 🎉",
                "celebrate"
            );
        }

    } catch (error) {

        console.warn(
            "Milo correct reaction failed:",
            error
        );
    }
}


/* =========================================================
   MILO WRONG
========================================================= */

function triggerMiloWrong(
    explanation
) {

    /*
     * FIRST:
     * Immediate DOM animation.
     */

    animateMilo(
        "wrong"
    );


    /*
     * THEN existing Milo API.
     */

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

        } else if (
            window.Milo &&
            typeof window.Milo.react ===
            "function"
        ) {

            window.Milo.react(
                "incorrect"
            );

        } else if (
            window.Milo &&
            typeof window.Milo.show ===
            "function"
        ) {

            window.Milo.show(
                "Let's review that one.",
                "sad"
            );
        }

    } catch (error) {

        console.warn(
            "Milo wrong reaction failed:",
            error
        );
    }
}


/* =========================================================
   MILO DOM ANIMATION
========================================================= */

function animateMilo(
    reaction
) {

    const milo =
        getMiloElement();


    if (!milo) {

        /*
         * Milo may be rendered by another script
         * after this function runs.
         *
         * Try again very shortly.
         */

        setTimeout(
            () => {

                const retry =
                    getMiloElement();


                if (retry) {

                    animateMiloElement(
                        retry,
                        reaction
                    );
                }

            },
            20
        );

        return;
    }


    animateMiloElement(
        milo,
        reaction
    );
}


/* =========================================================
   MILO ELEMENT ANIMATION
========================================================= */

function animateMiloElement(
    milo,
    reaction
) {

    if (!milo) {
        return;
    }


    /*
     * Remove previous state.
     */

    milo.classList.remove(
        "milo-answer-correct",
        "milo-answer-wrong",
        "milo-correct-reaction",
        "milo-wrong-reaction",
        "milo-celebrate",
        "milo-frown",
        "milo-shake"
    );


    /*
     * Force browser to restart animation.
     */

    void milo.offsetWidth;


    if (
        reaction ===
        "correct"
    ) {

        milo.classList.add(
            "milo-answer-correct",
            "milo-correct-reaction",
            "milo-celebrate"
        );

    } else {

        milo.classList.add(
            "milo-answer-wrong",
            "milo-wrong-reaction",
            "milo-frown",
            "milo-shake"
        );
    }


    /*
     * Remove reaction state after animation.
     */

    setTimeout(
        () => {

            milo.classList.remove(
                "milo-answer-correct",
                "milo-answer-wrong",
                "milo-correct-reaction",
                "milo-wrong-reaction",
                "milo-celebrate",
                "milo-frown",
                "milo-shake"
            );

        },
        800
    );
}


/* =========================================================
   MILO CSS FALLBACK
========================================================= */

function installMiloReactionStyles() {

    if (
        document.getElementById(
            "studyMindKnowledgeMiloStyles"
        )
    ) {

        return;
    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "studyMindKnowledgeMiloStyles";


    style.textContent = `

        /*
         * Milo correct reaction
         */

        .milo-answer-correct,
        .milo-correct-reaction,
        .milo-celebrate {

            animation:
                studyMindMiloCelebrate
                0.65s
                ease-in-out
                !important;
        }


        /*
         * Milo wrong reaction
         */

        .milo-answer-wrong,
        .milo-wrong-reaction,
        .milo-frown,
        .milo-shake {

            animation:
                studyMindMiloShake
                0.60s
                ease-in-out
                !important;
        }


        @keyframes studyMindMiloCelebrate {

            0% {

                transform:
                    translateY(0)
                    rotate(0deg)
                    scale(1);
            }

            20% {

                transform:
                    translateY(-10px)
                    rotate(-6deg)
                    scale(1.04);
            }

            40% {

                transform:
                    translateY(-16px)
                    rotate(6deg)
                    scale(1.07);
            }

            60% {

                transform:
                    translateY(-8px)
                    rotate(-4deg)
                    scale(1.04);
            }

            100% {

                transform:
                    translateY(0)
                    rotate(0deg)
                    scale(1);
            }
        }


        @keyframes studyMindMiloShake {

            0% {

                transform:
                    translateX(0)
                    rotate(0deg);
            }

            20% {

                transform:
                    translateX(-8px)
                    rotate(-5deg);
            }

            40% {

                transform:
                    translateX(8px)
                    rotate(5deg);
            }

            60% {

                transform:
                    translateX(-6px)
                    rotate(-4deg);
            }

            80% {

                transform:
                    translateX(5px)
                    rotate(3deg);
            }

            100% {

                transform:
                    translateX(0)
                    rotate(0deg);
            }
        }


        /*
         * Answer states.
         */

        .knowledge-option.correct {

            border-color:
                #22c55e !important;

            background:
                rgba(
                    34,
                    197,
                    94,
                    0.14
                ) !important;
        }


        .knowledge-option.incorrect {

            border-color:
                #ef4444 !important;

            background:
                rgba(
                    239,
                    68,
                    68,
                    0.14
                ) !important;
        }


        /*
         * Prevent hover styles from
         * overriding the answer state.
         */

        .knowledge-option.correct:hover {

            border-color:
                #22c55e !important;

            background:
                rgba(
                    34,
                    197,
                    94,
                    0.18
                ) !important;
        }


        .knowledge-option.incorrect:hover {

            border-color:
                #ef4444 !important;

            background:
                rgba(
                    239,
                    68,
                    68,
                    0.18
                ) !important;
        }


        /*
         * Question transition.
         */

        .knowledge-question-active {

            animation:
                studyMindQuestionEnter
                0.28s
                ease-out;
        }


        .knowledge-question-entered {

            opacity: 1;
        }


        .knowledge-question-exit {

            opacity: 0;

            transform:
                translateX(-22px);

            transition:
                opacity 0.18s ease,
                transform 0.18s ease;
        }


        @keyframes studyMindQuestionEnter {

            from {

                opacity: 0;

                transform:
                    translateX(25px);
            }

            to {

                opacity: 1;

                transform:
                    translateX(0);
            }
        }


        /*
         * Feedback.
         */

        .knowledge-answer-feedback {

            opacity: 0;

            transform:
                translateY(8px);

            transition:
                opacity 0.2s ease,
                transform 0.2s ease;
        }


        .knowledge-answer-feedback.visible,
        .knowledge-feedback-visible {

            opacity: 1;

            transform:
                translateY(0);
        }


        /*
         * Continue.
         */

        .knowledge-next-button {

            opacity: 0;

            visibility: hidden;

            transform:
                translateY(8px);

            transition:
                opacity 0.2s ease,
                transform 0.2s ease;
        }


        .knowledge-next-button.knowledge-next-visible {

            opacity: 1 !important;

            visibility: visible !important;

            transform:
                translateY(0);
        }

    `;


    document.head.appendChild(
        style
    );
}


/* =========================================================
   FINISH KNOWLEDGE CHECK
========================================================= */

function finishKnowledgeCheck() {

    const percentage =
        questions.length
            ? Math.round(
                (
                    score /
                    questions.length
                ) * 100
            )
            : 0;


    const passed =
        percentage >=
        PASS_PERCENTAGE;


    /*
     * Free users consume one complete
     * Knowledge Check only after finishing.
     */

    if (!knowledgePremium) {

        incrementUsageCount();
    }


    /*
     * Hide content.
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
     * Score.
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


        /*
         * ONLY HERE do we mark the topic
         * completed.
         */

        markTopicCompleted();


        /*
         * Final Milo celebration.
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
         *
         * Do NOT call markTopicCompleted().
         */

        showReview();
    }


    renderReview();

    renderMath();
}


/* =========================================================
   TOPIC COMPLETION
========================================================= */

function markTopicCompleted() {

    const topicKey =
        `${knowledgeSubject}::${knowledgeTopic}`;


    /*
     * New streak system.
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
     * Original Knowledge Check
     * completion storage.
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
     * Compatibility with older versions.
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
     * Streak engine.
     */

    try {

        if (
            window.StudyMindStreak &&
            typeof window.StudyMindStreak.checkTodayCompletion ===
            "function"
        ) {

            window.StudyMindStreak
                .checkTodayCompletion();
        }

    } catch (error) {

        console.warn(
            "Knowledge Check: streak synchronization failed.",
            error
        );
    }


    /*
     * Notify dashboard.
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
        .filter(
            result =>
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


                const questionIndex =
                    questionResults.indexOf(
                        result
                    );


                const originalQuestion =
                    questions[
                        questionIndex
                    ];


                const selectedAnswer =
                    originalQuestion
                        ?.options?.[
                            result.selectedIndex
                        ] ||
                    "—";


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
                            ${formatQuestionText(
                                selectedAnswer
                            )}
                        </b>
                    </div>

                    <div class="knowledge-review-answer">
                        Correct answer:
                        <b>
                            ${formatQuestionText(
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


function showError(
    message
) {

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
   FREE LIMIT
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
     * Free users have five complete checks.
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
     * Premium question count.
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
     * Cached questions first.
     */

    let generatedQuestions =
        getStoredQuestions();


    /*
     * Generate when insufficient.
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


    /*
     * Normalize.
     */

    questions =
        normalizeQuestions(
            generatedQuestions ||
            []
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
     * If fewer questions were actually
     * generated, use the available set.
     */

    selectedQuestionCount =
        questions.length;


    /*
     * Reset session.
     */

    currentQuestionIndex =
        0;


    score =
        0;


    answeredCount =
        0;


    questionResults =
        [];


    setText(
        "knowledgeQuestionCountText",
        `${questions.length} Questions`
    );


    setText(
        "knowledgeProgressText",
        `0 of ${questions.length} answered`
    );


    showKnowledgeContent();


    renderCurrentQuestion();
}


/* =========================================================
   FORMAT / SECURITY
========================================================= */

function escapeHTML(
    value
) {

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


function formatQuestionText(
    value
) {

    /*
     * Escape HTML first.
     *
     * MathJax delimiters such as
     * \(...\) and \[...\] remain intact.
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
                .catch(
                    () => {}
                );
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

                behavior:
                    "smooth",

                block:
                    "start"

            });

        },
        50
    );
}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        /*
         * Install fallback Milo/answer CSS.
         */

        installMiloReactionStyles();


        /*
         * Start.
         */

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
        () =>
            questions,


    getCurrentQuestion:
        () =>
            questions[
                currentQuestionIndex
            ],


    getScore:
        () =>
            score,


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

            currentQuestionIndex =
                0;

            score =
                0;

            answeredCount =
                0;

            questionResults =
                [];

            renderCurrentQuestion();
        }
};
