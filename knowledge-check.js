/* =========================================================
   STUDYMIND AI — KNOWLEDGE CHECK ENGINE
   DUOLINGO-STYLE ONE QUESTION AT A TIME
========================================================= */

"use strict";


/* =========================================================
   CONFIGURATION
========================================================= */

const FREE_KNOWLEDGE_CHECK_COUNT = 5;

const PREMIUM_KNOWLEDGE_CHECK_COUNTS = [
    5,
    10,
    20,
    30,
    40,
    50,
    60
];

const PASS_PERCENTAGE = 60;

const FREE_DAILY_LIMIT = 5;

const PREMIUM_STATUS_ENDPOINT =
    "/api/premium/status";

const PRIMARY_QUESTIONS_ENDPOINT =
    "/api/generate-questions";

const FALLBACK_AI_ENDPOINT =
    "/api/ask-ai";


/* =========================================================
   STORAGE KEYS
========================================================= */

const TOPIC_KEY =
    "studyMindKnowledgeCheckTopic";

const USAGE_KEY =
    "studyMindKnowledgeCheckUsageCount";

const USAGE_DATE_KEY =
    "studyMindKnowledgeCheckUsageDate";

const COMPLETED_KEY =
    "studyMindCompletedQuestionTopics";

const STUDY_COMPLETED_KEY =
    "studyMindCompletedTopics";

const QUESTIONS_KEY =
    "studyMindTopicQuestions";

const QUESTION_COUNT_KEY =
    "studyMindKnowledgeCheckQuestionCount";

const SESSION_KEY =
    "studyMindKnowledgeCheckSession";


/* =========================================================
   STATE
========================================================= */

let knowledgeTopic = null;

let knowledgeQuestions = [];

let knowledgePremiumVerified = false;

let knowledgeQuestionCount =
    FREE_KNOWLEDGE_CHECK_COUNT;


/*
   Current question.
   0 = first question.
*/

let currentQuestionIndex = 0;


/*
   Score is updated immediately after
   each question is checked.
*/

let knowledgeScore = 0;


/*
   Stores the student's selected answer
   for every question.
*/

let knowledgeAnswers = [];


/*
   Prevents the current question from
   being checked twice.
*/

let currentQuestionChecked = false;


/*
   Prevents the entire check from being
   accidentally completed twice.
*/

let knowledgeSubmitted = false;


/* =========================================================
   DOM SHORTCUT
========================================================= */

const $ = id =>
    document.getElementById(id);


/* =========================================================
   STORAGE
========================================================= */

function readJSON(
    key,
    fallback = null
) {

    try {

        const raw =
            localStorage.getItem(key);

        if (!raw) {

            return fallback;

        }

        return JSON.parse(raw);

    } catch (error) {

        console.warn(
            `StudyMind: Could not read ${key}`,
            error
        );

        return fallback;

    }

}


function writeJSON(
    key,
    value
) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

        return true;

    } catch (error) {

        console.error(
            `StudyMind: Could not write ${key}`,
            error
        );

        return false;

    }

}


/* =========================================================
   GENERAL HELPERS
========================================================= */

function clean(value) {

    return String(
        value ?? ""
    )
        .replace(/\s+/g, " ")
        .trim();

}


function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function getLocalDateKey() {

    const now =
        new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            now.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


/* =========================================================
   TOPIC KEY
========================================================= */

function createTopicKey(topic) {

    if (
        topic &&
        topic.key
    ) {

        return clean(
            topic.key
        );

    }


    const curriculum =
        clean(
            topic?.curriculum ||
            topic?.curriculumName ||
            ""
        )
            .toLowerCase();


    const subject =
        clean(
            topic?.subject ||
            ""
        )
            .toLowerCase();


    const name =
        clean(
            topic?.name ||
            topic?.topic ||
            ""
        )
            .toLowerCase();


    if (curriculum) {

        return `${curriculum}::${subject}::${name}`;

    }


    return `${subject}::${name}`;

}


/* =========================================================
   TOPIC INFORMATION
========================================================= */

function getTopicName() {

    return clean(
        knowledgeTopic?.name ||
        knowledgeTopic?.topic ||
        ""
    );

}


function getSubjectName() {

    return clean(
        knowledgeTopic?.subject ||
        "General Studies"
    );

}


function getCurriculumName() {

    return clean(
        knowledgeTopic?.curriculum ||
        knowledgeTopic?.curriculumName ||
        "Nigerian Senior Secondary Curriculum"
    );

}


/* =========================================================
   SUPABASE
========================================================= */

function getSupabaseClient() {

    if (
        window.supabaseClient &&
        window.supabaseClient.auth
    ) {

        return window.supabaseClient;

    }


    if (
        window.studyMindSupabase &&
        window.studyMindSupabase.auth
    ) {

        return window.studyMindSupabase;

    }


    if (
        window.supabase &&
        typeof window.supabase.createClient ===
        "function"
    ) {

        const SUPABASE_URL =
            "https://bicnrbqqvucgpbwudmit.supabase.co";

        const SUPABASE_PUBLISHABLE_KEY =
            "sb_publishable_70y0MPrj30-FimUSQK_HuA_Ng1a1qcB";


        try {

            window.supabaseClient =
                window.supabase.createClient(
                    SUPABASE_URL,
                    SUPABASE_PUBLISHABLE_KEY
                );


            return window.supabaseClient;

        } catch (error) {

            console.error(
                "StudyMind: Supabase initialization failed.",
                error
            );

        }

    }


    return null;

}


/* =========================================================
   PREMIUM STATUS
========================================================= */

async function verifyPremiumStatus() {

    const client =
        getSupabaseClient();


    if (!client) {

        console.warn(
            "Knowledge Check: Supabase unavailable."
        );

        return false;

    }


    let session = null;


    try {

        const result =
            await client.auth.getSession();

        session =
            result?.data?.session ||
            null;

    } catch (error) {

        console.error(
            "Knowledge Check: Could not retrieve session.",
            error
        );

        return false;

    }


    if (!session) {

        return false;

    }


    try {

        const response =
            await fetch(
                PREMIUM_STATUS_ENDPOINT,
                {

                    method: "GET",

                    headers: {

                        Authorization:
                            `Bearer ${session.access_token}`,

                        Accept:
                            "application/json"

                    },

                    cache:
                        "no-store"

                }
            );


        if (!response.ok) {

            console.warn(
                "Premium status endpoint returned:",
                response.status
            );

            return false;

        }


        const result =
            await response.json();


        const premium =
            result?.premium === true;


        knowledgePremiumVerified =
            premium;


        window.studyMindPremiumVerified =
            premium;

        window.studyMindIsPremium =
            premium;

        window.premiumUser =
            premium;


        return premium;

    } catch (error) {

        console.error(
            "Knowledge Check: Premium verification failed.",
            error
        );

        return false;

    }

}


/* =========================================================
   AUTHENTICATION
========================================================= */

async function verifyAuthentication() {

    const client =
        getSupabaseClient();


    if (!client) {

        return null;

    }


    try {

        const result =
            await client.auth.getSession();


        return (
            result?.data?.session ||
            null
        );

    } catch (error) {

        console.error(
            "Knowledge Check authentication error:",
            error
        );

        return null;

    }

}


/* =========================================================
   FREE USAGE
========================================================= */

function resetUsageIfNewDay() {

    const today =
        getLocalDateKey();


    const storedDate =
        localStorage.getItem(
            USAGE_DATE_KEY
        );


    if (
        storedDate !==
        today
    ) {

        localStorage.setItem(
            USAGE_DATE_KEY,
            today
        );

        localStorage.setItem(
            USAGE_KEY,
            "0"
        );

    }

}


function getDailyUsage() {

    resetUsageIfNewDay();


    return Math.max(
        0,
        Number(
            localStorage.getItem(
                USAGE_KEY
            ) || 0
        )
    );

}


function incrementDailyUsage() {

    const current =
        getDailyUsage();


    const next =
        current + 1;


    localStorage.setItem(
        USAGE_KEY,
        String(next)
    );


    return next;

}


function canFreeUserStartCheck() {

    if (
        knowledgePremiumVerified
    ) {

        return true;

    }


    return (
        getDailyUsage() <
        FREE_DAILY_LIMIT
    );

}


/* =========================================================
   QUESTION COUNT
========================================================= */

function getRequestedQuestionCount() {

    const stored =
        Number(
            localStorage.getItem(
                QUESTION_COUNT_KEY
            )
        );


    if (
        knowledgePremiumVerified &&
        PREMIUM_KNOWLEDGE_CHECK_COUNTS.includes(
            stored
        )
    ) {

        return stored;

    }


    return FREE_KNOWLEDGE_CHECK_COUNT;

}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeKnowledgeCheck
);


async function initializeKnowledgeCheck() {

    showLoading();


    /*
       AUTH
    */

    const session =
        await verifyAuthentication();


    if (!session) {

        window.location.href =
            "login.html";

        return;

    }


    /*
       PREMIUM
    */

    knowledgePremiumVerified =
        await verifyPremiumStatus();


    /*
       FREE LIMIT
    */

    if (
        !knowledgePremiumVerified &&
        !canFreeUserStartCheck()
    ) {

        showLimit();

        updateLimitMessage();

        return;

    }


    /*
       TOPIC
    */

    knowledgeTopic =
        readJSON(
            TOPIC_KEY,
            null
        );


    if (
        !knowledgeTopic ||
        !getTopicName()
    ) {

        showError(
            "No Knowledge Check topic was selected. Please return to your dashboard and choose a topic."
        );

        return;

    }


    /*
       QUESTION COUNT
    */

    knowledgeQuestionCount =
        getRequestedQuestionCount();


    renderTopic();


    /*
       LOAD / GENERATE
    */

    try {

        knowledgeQuestions =
            await loadQuestions();


        if (
            knowledgeQuestions.length !==
            knowledgeQuestionCount
        ) {

            throw new Error(
                `The AI returned ${knowledgeQuestions.length} usable questions instead of ${knowledgeQuestionCount}.`
            );

        }


        registerCheckUsage();


        hideLoading();


        /*
           Start the one-question experience.
        */

        startKnowledgeCheck();


        initializeMilo();

    } catch (error) {

        console.error(
            "Knowledge Check initialization failed:",
            error
        );


        showError(
            error.message ||
            "Unable to prepare the Knowledge Check."
        );

    }

}


/* =========================================================
   LOAD QUESTIONS
========================================================= */

async function loadQuestions() {

    const stored =
        readJSON(
            QUESTIONS_KEY,
            {}
        );


    const key =
        createTopicKey(
            knowledgeTopic
        );


    const saved =
        stored[key];


    if (
        Array.isArray(saved) &&
        saved.length >=
        knowledgeQuestionCount
    ) {

        const normalized =
            saved
                .slice(
                    0,
                    knowledgeQuestionCount
                )
                .map(
                    normalizeQuestion
                )
                .filter(Boolean);


        if (
            normalized.length ===
            knowledgeQuestionCount
        ) {

            return normalized;

        }

    }


    const generated =
        await requestQuestions();


    if (
        generated.length !==
        knowledgeQuestionCount
    ) {

        throw new Error(
            "The AI did not return enough usable questions."
        );

    }


    stored[key] =
        generated;


    writeJSON(
        QUESTIONS_KEY,
        stored
    );


    return generated;

}


/* =========================================================
   REQUEST QUESTIONS
========================================================= */

async function requestQuestions() {

    const count =
        knowledgeQuestionCount;


    const payload = {

        subject:
            getSubjectName(),

        topic:
            getTopicName(),

        curriculum:
            getCurriculumName(),

        numberOfQuestions:
            count,

        questionCount:
            count,

        count,

        difficulty:
            "mixed",

        type:
            "knowledge_check",

        requestType:
            "knowledge_check",

        mode:
            "knowledge_check"

    };


    /*
       PRIMARY API
    */

    try {

        const response =
            await fetch(
                PRIMARY_QUESTIONS_ENDPOINT,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Accept:
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            payload
                        )

                }
            );


        if (
            response.ok
        ) {

            const data =
                await response.json();


            const questions =
                extractQuestions(
                    data
                )
                    .map(
                        normalizeQuestion
                    )
                    .filter(Boolean)
                    .slice(
                        0,
                        count
                    );


            if (
                questions.length ===
                count
            ) {

                return questions;

            }

        } else {

            console.warn(
                "Primary question endpoint returned:",
                response.status
            );

        }

    } catch (error) {

        console.warn(
            "Primary question API failed:",
            error
        );

    }


    /*
       FALLBACK API
    */

    const fallbackResponse =
        await fetch(
            FALLBACK_AI_ENDPOINT,
            {

                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    Accept:
                        "application/json"

                },

                body:
                    JSON.stringify({

                        ...payload,

                        message:

                            `Create exactly ${count} multiple-choice knowledge-check questions.

Curriculum:
${getCurriculumName()}

Subject:
${getSubjectName()}

Topic:
${getTopicName()}

Requirements:
- Create exactly ${count} questions.
- Questions must be directly relevant to the topic.
- Use four options for every question.
- Only one option should be correct.
- Include a concise explanation for every answer.
- Mix difficulty levels.
- Do not repeat questions.
- Return JSON only.

Required format:

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
      "answer": 0,
      "explanation": "Explanation"
    }
  ]
}`

                    })

            }
        );


    if (
        !fallbackResponse.ok
    ) {

        throw new Error(
            "The question service could not generate the Knowledge Check."
        );

    }


    const fallbackData =
        await fallbackResponse.json();


    const questions =
        extractQuestions(
            fallbackData
        )
            .map(
                normalizeQuestion
            )
            .filter(Boolean)
            .slice(
                0,
                count
            );


    if (
        questions.length !==
        count
    ) {

        throw new Error(
            `The AI returned ${questions.length} usable questions instead of ${count}.`
        );

    }


    return questions;

}


/* =========================================================
   EXTRACT QUESTIONS
========================================================= */

function extractQuestions(data) {

    if (
        Array.isArray(data)
    ) {

        return data;

    }


    if (
        !data ||
        typeof data !== "object"
    ) {

        return [];

    }


    const arrays = [

        data.questions,

        data.data?.questions,

        data.result?.questions,

        data.output?.questions,

        data.response?.questions,

        data.answer?.questions

    ];


    for (
        const value
        of arrays
    ) {

        if (
            Array.isArray(value)
        ) {

            return value;

        }

    }


    const texts = [

        data.output_text,

        data.reply,

        data.answer,

        data.content,

        data.text,

        data.message

    ];


    for (
        const text
        of texts
    ) {

        if (
            typeof text !==
            "string"
        ) {

            continue;

        }


        const parsed =
            parseJSONText(text);


        if (
            Array.isArray(parsed)
        ) {

            return parsed;

        }


        if (
            Array.isArray(
                parsed?.questions
            )
        ) {

            return parsed.questions;

        }

    }


    return [];

}


/* =========================================================
   PARSE AI JSON
========================================================= */

function parseJSONText(text) {

    let value =
        String(text)
            .trim();


    value =
        value
            .replace(
                /^```json\s*/i,
                ""
            )
            .replace(
                /^```\s*/i,
                ""
            )
            .replace(
                /\s*```$/i,
                ""
            )
            .trim();


    try {

        return JSON.parse(
            value
        );

    } catch {}


    const firstObject =
        value.indexOf("{");

    const lastObject =
        value.lastIndexOf("}");


    if (
        firstObject >= 0 &&
        lastObject > firstObject
    ) {

        try {

            return JSON.parse(
                value.slice(
                    firstObject,
                    lastObject + 1
                )
            );

        } catch {}

    }


    const firstArray =
        value.indexOf("[");

    const lastArray =
        value.lastIndexOf("]");


    if (
        firstArray >= 0 &&
        lastArray > firstArray
    ) {

        try {

            return JSON.parse(
                value.slice(
                    firstArray,
                    lastArray + 1
                )
            );

        } catch {}

    }


    return null;

}


/* =========================================================
   NORMALIZE QUESTION
========================================================= */

function normalizeQuestion(raw) {

    if (
        !raw ||
        typeof raw !== "object"
    ) {

        return null;

    }


    const question =
        clean(
            raw.question ||
            raw.text ||
            raw.prompt ||
            raw.questionText
        );


    let options =
        raw.options ||
        raw.choices ||
        raw.answers;


    if (
        !question ||
        !Array.isArray(options)
    ) {

        return null;

    }


    options =
        options
            .map(
                option => {

                    if (
                        typeof option ===
                        "string"
                    ) {

                        return clean(option);

                    }


                    return clean(
                        option?.text ||
                        option?.label ||
                        option?.value
                    );

                }
            )
            .filter(Boolean);


    if (
        options.length <
        2
    ) {

        return null;

    }


    let answer =
        raw.answer ??
        raw.correctAnswer ??
        raw.correct ??
        raw.correctIndex;


    if (
        typeof answer ===
        "string"
    ) {

        const cleanedAnswer =
            clean(answer);


        const letterMatch =
            cleanedAnswer.match(
                /^([A-Z])(?:\.)?$/i
            );


        if (
            letterMatch
        ) {

            answer =
                letterMatch[1]
                    .toUpperCase()
                    .charCodeAt(0) - 65;

        } else {

            const exactIndex =
                options.findIndex(
                    option =>
                        clean(option)
                            .toLowerCase() ===
                        cleanedAnswer
                            .toLowerCase()
                );


            if (
                exactIndex >= 0
            ) {

                answer =
                    exactIndex;

            } else {

                const numeric =
                    Number(
                        cleanedAnswer
                    );


                if (
                    Number.isFinite(
                        numeric
                    )
                ) {

                    answer =
                        numeric;

                } else {

                    return null;

                }

            }

        }

    }


    answer =
        Number(answer);


    /*
       Preferred API format is 0-based.

       If AI gives the option count itself
       (for example 4 with four options),
       interpret that as the final option.
    */

    if (
        answer ===
        options.length
    ) {

        answer =
            options.length - 1;

    }


    if (
        !Number.isInteger(answer) ||
        answer < 0 ||
        answer >= options.length
    ) {

        return null;

    }


    return {

        question,

        options,

        answer,

        explanation:
            clean(
                raw.explanation ||
                raw.reason ||
                raw.rationale ||
                ""
            )

    };

}


/* =========================================================
   TOPIC UI
========================================================= */

function renderTopic() {

    if (
        $("knowledgeSubject")
    ) {

        $("knowledgeSubject")
            .textContent =
                getSubjectName();

    }


    if (
        $("knowledgeTopic")
    ) {

        $("knowledgeTopic")
            .textContent =
                getTopicName();

    }


    if (
        $("knowledgeCurriculum")
    ) {

        $("knowledgeCurriculum")
            .textContent =
                getCurriculumName();

    }


    if (
        $("knowledgeQuestionCount")
    ) {

        $("knowledgeQuestionCount")
            .textContent =
                `${knowledgeQuestionCount} Questions`;

    }

}


/* =========================================================
   START KNOWLEDGE CHECK
========================================================= */

function startKnowledgeCheck() {

    currentQuestionIndex = 0;

    knowledgeScore = 0;

    knowledgeAnswers =
        new Array(
            knowledgeQuestionCount
        ).fill(null);

    currentQuestionChecked =
        false;

    knowledgeSubmitted =
        false;


    /*
       Hide result if necessary.
    */

    if (
        $("knowledgeResult")
    ) {

        $("knowledgeResult")
            .style.display =
                "none";

    }


    if (
        $("knowledgeContent")
    ) {

        $("knowledgeContent")
            .style.display =
                "block";

    }


    /*
       Hide the old submit button.
    */

    if (
        $("knowledgeSubmit")
    ) {

        $("knowledgeSubmit")
            .style.display =
                "none";

    }


    renderCurrentQuestion();

}


/* =========================================================
   RENDER CURRENT QUESTION
========================================================= */

function renderCurrentQuestion() {

    const container =
        $("knowledgeQuestions");


    if (!container) {

        showError(
            "The Knowledge Check page is missing its questions container."
        );

        return;

    }


    const question =
        knowledgeQuestions[
            currentQuestionIndex
        ];


    if (!question) {

        finishKnowledgeCheck();

        return;

    }


    currentQuestionChecked =
        false;


    container.innerHTML = `

        <div
            class="knowledge-question-card active-question"
            data-question-index="${currentQuestionIndex}"
        >

            <div class="knowledge-question-number">

                Question
                ${currentQuestionIndex + 1}
                of
                ${knowledgeQuestionCount}

            </div>


            <div class="knowledge-question">

                ${escapeHTML(
                    question.question
                )}

            </div>


            <div class="knowledge-options">

                ${question.options
                    .map(
                        (
                            option,
                            optionIndex
                        ) => `

                            <button
                                type="button"
                                class="knowledge-option"
                                data-option-index="${optionIndex}"
                                aria-label="Option ${String.fromCharCode(
                                    65 + optionIndex
                                )}"
                            >

                                <span class="knowledge-option-letter">

                                    ${String.fromCharCode(
                                        65 + optionIndex
                                    )}

                                </span>

                                <span class="knowledge-option-text">

                                    ${escapeHTML(
                                        option
                                    )}

                                </span>

                            </button>

                        `
                    )
                    .join("")}

            </div>


            <div
                id="knowledgeFeedback"
                class="knowledge-feedback"
                style="display:none;"
            ></div>


            <button
                type="button"
                id="knowledgeCheckButton"
                class="knowledge-check-button"
                disabled
            >
                Check
            </button>


            <button
                type="button"
                id="knowledgeNextButton"
                class="knowledge-next-button"
                style="display:none;"
            >
                Continue
            </button>

        </div>

    `;


    /*
       Add option listeners.
    */

    container
        .querySelectorAll(
            ".knowledge-option"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        selectAnswer(
                            Number(
                                button.dataset.optionIndex
                            )
                        );

                    }
                );

            }
        );


    /*
       Check button.
    */

    $("knowledgeCheckButton")
        ?.addEventListener(
            "click",
            checkCurrentQuestion
        );


    /*
       Continue button.
    */

    $("knowledgeNextButton")
        ?.addEventListener(
            "click",
            nextQuestion
        );


    updateQuestionProgress();


    /*
       Re-render MathJax if available.
    */

    typesetMath();

}


/* =========================================================
   SELECT ANSWER
========================================================= */

function selectAnswer(
    optionIndex
) {

    if (
        currentQuestionChecked
    ) {

        return;

    }


    const options =
        document.querySelectorAll(
            ".knowledge-option"
        );


    options.forEach(
        option => {

            option.classList.remove(
                "selected"
            );

        }
    );


    const selected =
        document.querySelector(
            `.knowledge-option[data-option-index="${optionIndex}"]`
        );


    if (
        selected
    ) {

        selected.classList.add(
            "selected"
        );

    }


    const checkButton =
        $("knowledgeCheckButton");


    if (
        checkButton
    ) {

        checkButton.disabled =
            false;

    }


    knowledgeAnswers[
        currentQuestionIndex
    ] =
        optionIndex;

}


/* =========================================================
   CHECK CURRENT QUESTION
========================================================= */

function checkCurrentQuestion() {

    if (
        currentQuestionChecked
    ) {

        return;

    }


    const selectedIndex =
        knowledgeAnswers[
            currentQuestionIndex
        ];


    if (
        selectedIndex === null ||
        selectedIndex === undefined
    ) {

        return;

    }


    const question =
        knowledgeQuestions[
            currentQuestionIndex
        ];


    if (!question) {

        return;

    }


    currentQuestionChecked =
        true;


    const correct =
        selectedIndex ===
        question.answer;


    const options =
        document.querySelectorAll(
            ".knowledge-option"
        );


    /*
       Disable further selection.
    */

    options.forEach(
        option => {

            option.disabled =
                true;

        }
    );


    /*
       Mark the correct answer green.
    */

    const correctOption =
        document.querySelector(
            `.knowledge-option[data-option-index="${question.answer}"]`
        );


    correctOption?.classList.add(
        "correct"
    );


    /*
       Mark student's wrong answer red.
    */

    if (!correct) {

        const wrongOption =
            document.querySelector(
                `.knowledge-option[data-option-index="${selectedIndex}"]`
            );


        wrongOption?.classList.add(
            "incorrect"
        );

    }


    /*
       Score.
    */

    if (correct) {

        knowledgeScore++;

    }


    /*
       Feedback.
    */

    showQuestionFeedback(
        correct,
        question
    );


    /*
       Milo.
    */

    if (correct) {

        notifyMiloCorrect(
            question,
            currentQuestionIndex
        );

    } else {

        notifyMiloIncorrect(
            question,
            currentQuestionIndex
        );

    }


    /*
       Sound.

       Milo already provides sounds, but this
       fallback makes the Knowledge Check itself
       robust if Milo isn't loaded.
    */

    playKnowledgeSound(
        correct
            ? "correct"
            : "wrong"
    );


    /*
       Disable Check.
    */

    const checkButton =
        $("knowledgeCheckButton");


    if (
        checkButton
    ) {

        checkButton.disabled =
            true;

        checkButton.style.display =
            "none";

    }


    /*
       Show Continue.
    */

    const nextButton =
        $("knowledgeNextButton");


    if (
        nextButton
    ) {

        nextButton.style.display =
            "block";

        nextButton.textContent =
            currentQuestionIndex >=
            knowledgeQuestionCount - 1
                ? "See Results"
                : "Continue";

    }


    updateQuestionProgress();


    typesetMath();

}


/* =========================================================
   QUESTION FEEDBACK
========================================================= */

function showQuestionFeedback(
    correct,
    question
) {

    const feedback =
        $("knowledgeFeedback");


    if (!feedback) {

        return;

    }


    feedback.style.display =
        "block";


    if (correct) {

        feedback.className =
            "knowledge-feedback correct-feedback";


        feedback.innerHTML = `

            <div class="feedback-title">
                ✓ Correct!
            </div>

            <div class="feedback-message">
                Great job! Keep going.
            </div>

        `;

    } else {

        feedback.className =
            "knowledge-feedback incorrect-feedback";


        const correctAnswer =
            question.options[
                question.answer
            ];


        feedback.innerHTML = `

            <div class="feedback-title">
                ✗ Not quite
            </div>

            <div class="feedback-answer">
                Correct answer:
                <strong>
                    ${escapeHTML(
                        correctAnswer
                    )}
                </strong>
            </div>

            ${
                question.explanation
                    ? `
                        <div class="feedback-explanation">

                            ${escapeHTML(
                                question.explanation
                            )}

                        </div>
                    `
                    : ""
            }

        `;

    }


    typesetMath();

}


/* =========================================================
   NEXT QUESTION
========================================================= */

function nextQuestion() {

    if (
        !currentQuestionChecked
    ) {

        return;

    }


    currentQuestionIndex++;


    if (
        currentQuestionIndex >=
        knowledgeQuestionCount
    ) {

        finishKnowledgeCheck();

        return;

    }


    renderCurrentQuestion();

}


/* =========================================================
   PROGRESS
========================================================= */

function updateQuestionProgress() {

    const answered =
        knowledgeAnswers
            .filter(
                answer =>
                    answer !== null &&
                    answer !== undefined
            )
            .length;


    const percentage =
        Math.round(
            (
                answered /
                knowledgeQuestionCount
            ) *
            100
        );


    if (
        $("knowledgeProgressText")
    ) {

        $("knowledgeProgressText")
            .textContent =
                `${answered} of ${knowledgeQuestionCount} answered`;

    }


    if (
        $("knowledgeProgressBar")
    ) {

        $("knowledgeProgressBar")
            .style.width =
                `${percentage}%`;

    }

}


/* =========================================================
   FINISH KNOWLEDGE CHECK
========================================================= */

function finishKnowledgeCheck() {

    if (
        knowledgeSubmitted
    ) {

        return;

    }


    knowledgeSubmitted =
        true;


    const percentage =
        Math.round(
            (
                knowledgeScore /
                knowledgeQuestionCount
            ) *
            100
        );


    const passed =
        percentage >=
        PASS_PERCENTAGE;


    /*
       IMPORTANT:

       Only a passed Knowledge Check marks
       the topic as completed.
    */

    if (passed) {

        markTopicCompleted();

    }


    showResult(
        knowledgeScore,
        knowledgeAnswers
    );


    notifyMiloResult(
        knowledgeScore,
        knowledgeQuestionCount
    );


    /*
       Let the streak engine evaluate today's
       completion.
    */

    if (
        window.StudyMindStreak &&
        typeof window.StudyMindStreak
            .checkTodayCompletion ===
        "function"
    ) {

        try {

            window.StudyMindStreak
                .checkTodayCompletion();

        } catch (error) {

            console.warn(
                "Knowledge Check: streak sync failed.",
                error
            );

        }

    }

}


/* =========================================================
   MARK TOPIC COMPLETE
========================================================= */

function markTopicCompleted() {

    if (
        !knowledgeTopic
    ) {

        return;

    }


    const key =
        createTopicKey(
            knowledgeTopic
        );


    /*
       Knowledge Check completions.
    */

    let knowledgeCompleted =
        readJSON(
            COMPLETED_KEY,
            []
        );


    if (
        !Array.isArray(
            knowledgeCompleted
        )
    ) {

        knowledgeCompleted = [];

    }


    if (
        !knowledgeCompleted.includes(
            key
        )
    ) {

        knowledgeCompleted.push(
            key
        );

    }


    writeJSON(
        COMPLETED_KEY,
        knowledgeCompleted
    );


    /*
       Main study completion.
    */

    let studyCompleted =
        readJSON(
            STUDY_COMPLETED_KEY,
            []
        );


    if (
        !Array.isArray(
            studyCompleted
        )
    ) {

        studyCompleted = [];

    }


    if (
        !studyCompleted.includes(
            key
        )
    ) {

        studyCompleted.push(
            key
        );

    }


    /*
       Legacy Subject::Topic key.
    */

    const subject =
        clean(
            getSubjectName()
        );


    const topic =
        clean(
            getTopicName()
        );


    const legacyKey =
        `${subject}::${topic}`;


    if (
        !studyCompleted.includes(
            legacyKey
        )
    ) {

        studyCompleted.push(
            legacyKey
        );

    }


    /*
       Older topic-only storage.
    */

    if (
        topic &&
        !studyCompleted.includes(
            topic
        )
    ) {

        studyCompleted.push(
            topic
        );

    }


    writeJSON(
        STUDY_COMPLETED_KEY,
        studyCompleted
    );


    /*
       Notify dashboard/pages.
    */

    try {

        window.dispatchEvent(
            new StorageEvent(
                "storage",
                {

                    key:
                        STUDY_COMPLETED_KEY,

                    newValue:
                        JSON.stringify(
                            studyCompleted
                        )

                }
            )
        );

    } catch {}


    window.dispatchEvent(
        new CustomEvent(
            "studyMindTopicCompleted",
            {

                detail: {

                    key,

                    subject,

                    topic,

                    curriculum:
                        getCurriculumName()

                }

            }
        )
    );

}


/* =========================================================
   RESULT SCREEN
========================================================= */

function showResult(
    score,
    answers
) {

    const percentage =
        Math.round(
            (
                score /
                knowledgeQuestionCount
            ) *
            100
        );


    const passed =
        percentage >=
        PASS_PERCENTAGE;


    if (
        $("knowledgeContent")
    ) {

        $("knowledgeContent")
            .style.display =
                "none";

    }


    if (
        $("knowledgeResult")
    ) {

        $("knowledgeResult")
            .style.display =
                "block";

    }


    if (
        $("knowledgeScore")
    ) {

        $("knowledgeScore")
            .textContent =
                `${score}/${knowledgeQuestionCount}`;

    }


    if (
        $("knowledgePercentage")
    ) {

        $("knowledgePercentage")
            .textContent =
                `${percentage}%`;

    }


    if (
        $("knowledgeResultIcon")
    ) {

        $("knowledgeResultIcon")
            .textContent =
                passed
                    ? "🎉"
                    : "📚";

    }


    if (
        $("knowledgeResultTitle")
    ) {

        $("knowledgeResultTitle")
            .textContent =
                passed
                    ? "Knowledge Check Passed!"
                    : "Keep Learning!";

    }


    if (
        $("knowledgeResultText")
    ) {

        $("knowledgeResultText")
            .textContent =

                passed

                    ? `Excellent! You scored ${percentage}%. Milo is proud of your progress.`

                    : `You scored ${percentage}%. Review the corrections and try again when you're ready.`;

    }


    renderCorrections(
        answers
    );


    setupContinueButton();

}


/* =========================================================
   CORRECTIONS
========================================================= */

function renderCorrections(
    answers
) {

    const corrections =
        $("knowledgeCorrections");


    if (!corrections) {

        return;

    }


    corrections.innerHTML =

        knowledgeQuestions
            .map(
                (
                    question,
                    index
                ) => {

                    const selectedIndex =
                        answers[index];


                    const correctIndex =
                        question.answer;


                    const selectedText =
                        question.options[
                            selectedIndex
                        ] ??
                        "No answer";


                    const correctText =
                        question.options[
                            correctIndex
                        ] ??
                        "Unavailable";


                    const correct =
                        selectedIndex ===
                        correctIndex;


                    return `

                        <div
                            class="knowledge-correction ${
                                correct
                                    ? "correct"
                                    : "incorrect"
                            }"
                        >

                            <strong>

                                ${index + 1}.
                                ${escapeHTML(
                                    question.question
                                )}

                            </strong>


                            <p>

                                <strong>
                                    Your answer:
                                </strong>

                                ${escapeHTML(
                                    selectedText
                                )}

                            </p>


                            <p>

                                <strong>
                                    Correct answer:
                                </strong>

                                ${escapeHTML(
                                    correctText
                                )}

                            </p>


                            ${
                                question.explanation

                                    ? `

                                        <p class="knowledge-explanation">

                                            <strong>
                                                Milo's explanation:
                                            </strong>

                                            ${escapeHTML(
                                                question.explanation
                                            )}

                                        </p>

                                    `

                                    : ""

                            }

                        </div>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   CONTINUE BUTTON
========================================================= */

function setupContinueButton() {

    let button =
        $("knowledgeContinueButton");


    if (
        !button &&
        $("knowledgeResult")
    ) {

        button =
            document.createElement(
                "button"
            );


        button.id =
            "knowledgeContinueButton";


        button.className =
            "primary-button full-button";


        $("knowledgeResult")
            .appendChild(
                button
            );

    }


    if (!button) {

        return;

    }


    const passed =
        (
            knowledgeScore /
            knowledgeQuestionCount
        ) *
        100 >=
        PASS_PERCENTAGE;


    button.textContent =
        passed
            ? "🚀 Continue to Dashboard"
            : "📚 Continue Learning";


    button.onclick = () => {

        window.location.href =
            "dashboard.html";

    };

}


/* =========================================================
   USAGE REGISTRATION
========================================================= */

function registerCheckUsage() {

    /*
       Premium = unlimited.
    */

    if (
        knowledgePremiumVerified
    ) {

        return;

    }


    const key =
        createTopicKey(
            knowledgeTopic
        );


    const checkId =
        `${key}-${knowledgeQuestionCount}`;


    const previous =
        sessionStorage.getItem(
            SESSION_KEY
        );


    if (
        previous ===
        checkId
    ) {

        return;

    }


    const usage =
        incrementDailyUsage();


    sessionStorage.setItem(
        SESSION_KEY,
        checkId
    );


    console.log(
        `Knowledge Check usage: ${usage}/${FREE_DAILY_LIMIT}`
    );

}


/* =========================================================
   LIMIT SCREEN
========================================================= */

function updateLimitMessage() {

    const usage =
        getDailyUsage();


    const remaining =
        Math.max(
            0,
            FREE_DAILY_LIMIT -
            usage
        );


    const message =
        `You've used all ${FREE_DAILY_LIMIT} free Knowledge Checks for today. Upgrade to Premium for unlimited Knowledge Checks and larger question sets.`;


    if (
        $("knowledgeLimitText")
    ) {

        $("knowledgeLimitText")
            .textContent =
                message;

    }


    if (
        $("knowledgeUsage")
    ) {

        $("knowledgeUsage")
            .textContent =
                `${usage}/${FREE_DAILY_LIMIT}`;

    }


    if (
        $("knowledgeRemaining")
    ) {

        $("knowledgeRemaining")
            .textContent =
                `${remaining} remaining`;

    }

}


/* =========================================================
   UI STATES
========================================================= */

function showLoading() {

    if (
        $("knowledgeLoading")
    ) {

        $("knowledgeLoading")
            .style.display =
                "block";

    }


    if (
        $("knowledgeContent")
    ) {

        $("knowledgeContent")
            .style.display =
                "none";

    }


    if (
        $("knowledgeResult")
    ) {

        $("knowledgeResult")
            .style.display =
                "none";

    }


    if (
        $("knowledgeError")
    ) {

        $("knowledgeError")
            .style.display =
                "none";

    }


    if (
        $("knowledgeLimit")
    ) {

        $("knowledgeLimit")
            .style.display =
                "none";

    }

}


function hideLoading() {

    if (
        $("knowledgeLoading")
    ) {

        $("knowledgeLoading")
            .style.display =
                "none";

    }


    if (
        $("knowledgeContent")
    ) {

        $("knowledgeContent")
            .style.display =
                "block";

    }


    if (
        $("knowledgeResult")
    ) {

        $("knowledgeResult")
            .style.display =
                "none";

    }


    if (
        $("knowledgeError")
    ) {

        $("knowledgeError")
            .style.display =
                "none";

    }

}


function showLimit() {

    if (
        $("knowledgeLoading")
    ) {

        $("knowledgeLoading")
            .style.display =
                "none";

    }


    if (
        $("knowledgeContent")
    ) {

        $("knowledgeContent")
            .style.display =
                "none";

    }


    if (
        $("knowledgeResult")
    ) {

        $("knowledgeResult")
            .style.display =
                "none";

    }


    if (
        $("knowledgeError")
    ) {

        $("knowledgeError")
            .style.display =
                "none";

    }


    if (
        $("knowledgeLimit")
    ) {

        $("knowledgeLimit")
            .style.display =
                "block";

    }

}


function showError(
    message
) {

    if (
        $("knowledgeLoading")
    ) {

        $("knowledgeLoading")
            .style.display =
                "none";

    }


    if (
        $("knowledgeContent")
    ) {

        $("knowledgeContent")
            .style.display =
                "none";

    }


    if (
        $("knowledgeResult")
    ) {

        $("knowledgeResult")
            .style.display =
                "none";

    }


    if (
        $("knowledgeLimit")
    ) {

        $("knowledgeLimit")
            .style.display =
                "none";

    }


    if (
        $("knowledgeError")
    ) {

        $("knowledgeError")
            .style.display =
                "block";

    }


    if (
        $("knowledgeErrorText")
    ) {

        $("knowledgeErrorText")
            .textContent =
                message;

    }

}


/* =========================================================
   MILO
========================================================= */

function getMilo() {

    if (
        window.Milo
    ) {

        return window.Milo;

    }


    if (
        window.studyMindMilo
    ) {

        return window.studyMindMilo;

    }


    return null;

}


function initializeMilo() {

    const milo =
        getMilo();


    if (!milo) {

        return;

    }


    try {

        /*
           Your current Milo API doesn't have
           knowledgeCheckStarted(), so use the
           existing show() method.
        */

        if (
            typeof milo.show ===
            "function"
        ) {

            milo.show(
                `Let's see what you know about ${getTopicName()}! 🧠`,
                "excited"
            );

        }

    } catch (error) {

        console.warn(
            "Milo Knowledge Check introduction failed:",
            error
        );

    }

}


/* =========================================================
   MILO — CORRECT
========================================================= */

function notifyMiloCorrect(
    question,
    index
) {

    const milo =
        getMilo();


    if (!milo) {

        return;

    }


    try {

        /*
           This matches your actual milo.js.
        */

        if (
            typeof milo.miloCorrectAnswer ===
            "function"
        ) {

            milo.miloCorrectAnswer();

            return;

        }


        if (
            typeof milo.correctAnswer ===
            "function"
        ) {

            milo.correctAnswer({

                question:
                    question.question,

                questionIndex:
                    index

            });

            return;

        }


        if (
            typeof milo.react ===
            "function"
        ) {

            milo.react(
                "correct"
            );

        }

    } catch (error) {

        console.warn(
            "Milo correct-answer reaction failed:",
            error
        );

    }

}


/* =========================================================
   MILO — INCORRECT
========================================================= */

function notifyMiloIncorrect(
    question,
    index
) {

    const milo =
        getMilo();


    if (!milo) {

        return;

    }


    try {

        /*
           This matches your actual milo.js.
        */

        if (
            typeof milo.miloWrongAnswer ===
            "function"
        ) {

            milo.miloWrongAnswer(
                question.explanation
            );

            return;

        }


        if (
            typeof milo.incorrectAnswer ===
            "function"
        ) {

            milo.incorrectAnswer({

                question:
                    question.question,

                explanation:
                    question.explanation,

                questionIndex:
                    index

            });

            return;

        }


        if (
            typeof milo.react ===
            "function"
        ) {

            milo.react(
                "incorrect"
            );

        }

    } catch (error) {

        console.warn(
            "Milo incorrect-answer reaction failed:",
            error
        );

    }

}


/* =========================================================
   MILO — FINAL RESULT
========================================================= */

function notifyMiloResult(
    score,
    total
) {

    const milo =
        getMilo();


    if (!milo) {

        return;

    }


    const percentage =
        Math.round(
            (
                score /
                total
            ) *
            100
        );


    const passed =
        percentage >=
        PASS_PERCENTAGE;


    try {

        if (
            passed &&
            typeof milo.show ===
            "function"
        ) {

            milo.show(
                `YOU DID IT! 🎉 ${percentage}%! I'm proud of you!`,
                "celebrate"
            );

        } else if (
            !passed &&
            typeof milo.show ===
            "function"
        ) {

            milo.show(
                `Nice effort! 📚 Let's review this topic and come back stronger.`,
                "thinking"
            );

        }

    } catch (error) {

        console.warn(
            "Milo Knowledge Check result reaction failed:",
            error
        );

    }

}


/* =========================================================
   KNOWLEDGE CHECK SOUND EFFECTS
========================================================= */

function playKnowledgeSound(
    type
) {

    /*
       If Milo exists, its sound engine
       is already responsible for the sound.
    */

    const milo =
        getMilo();


    if (
        milo &&
        typeof milo.playSound ===
        "function"
    ) {

        try {

            milo.playSound(
                type
            );

            return;

        } catch {}

    }


    /*
       Fallback sound engine.
    */

    try {

        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;


        if (!AudioContext) {

            return;

        }


        const context =
            new AudioContext();


        const oscillator =
            context.createOscillator();

        const gain =
            context.createGain();


        oscillator.connect(
            gain
        );

        gain.connect(
            context.destination
        );


        const correct =
            type === "correct";


        oscillator.frequency.value =
            correct
                ? 700
                : 250;


        oscillator.type =
            correct
                ? "sine"
                : "sawtooth";


        gain.gain.setValueAtTime(
            0.0001,
            context.currentTime
        );


        gain.gain.exponentialRampToValueAtTime(
            0.12,
            context.currentTime + 0.02
        );


        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            context.currentTime + 0.18
        );


        oscillator.start();

        oscillator.stop(
            context.currentTime + 0.18
        );

    } catch (error) {

        console.warn(
            "Knowledge Check sound unavailable:",
            error
        );

    }

}


/* =========================================================
   MATHJAX
========================================================= */

function typesetMath() {

    if (
        window.MathJax &&
        typeof window.MathJax.typesetPromise ===
        "function"
    ) {

        window.MathJax
            .typesetPromise()
            .catch(
                error => {

                    console.warn(
                        "MathJax rendering failed:",
                        error
                    );

                }
            );

    }

}


/* =========================================================
   PUBLIC API
========================================================= */

window.StudyMindKnowledgeCheck = {

    getTopic:
        () =>
            knowledgeTopic,

    getQuestions:
        () =>
            knowledgeQuestions,

    getScore:
        () =>
            knowledgeScore,

    getQuestionCount:
        () =>
            knowledgeQuestionCount,

    getCurrentQuestion:
        () =>
            currentQuestionIndex,

    isPremium:
        () =>
            knowledgePremiumVerified,

    submit:
        finishKnowledgeCheck,

    getDailyUsage:
        getDailyUsage

};
