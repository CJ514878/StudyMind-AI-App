/* =========================================================
   STUDYMIND AI — DASHBOARD.JS
   COMPLETE REPLACEMENT
   =========================================================

   DASHBOARD HTML COMPATIBILITY

   This file is built specifically for:

   dashboard.html

   Main features:
   - Current topic
   - Study timer
   - Topic completion
   - Knowledge Check
   - 5 questions
   - 60% pass requirement
   - Progress tracker
   - Subjects
   - Calendar
   - Completed calendar days
   - Schedule
   - Daily challenge
   - Study score
   - Theme
   - Supabase session support
   ========================================================= */


/* =========================================================
   CONFIGURATION
========================================================= */

const STUDYMIND_CONFIG = {

    PLAN_KEY: "studyMindPlan",

    COMPATIBILITY_PLAN_KEY: "studyData",

    COMPLETED_TOPICS_KEY:
        "studyMindCompletedTopics",

    COMPLETED_QUESTIONS_KEY:
        "studyMindCompletedQuestionTopics",

    COMPLETED_DAYS_KEY:
        "studyMindCompletedDays",

    CURRENT_TOPIC_KEY:
        "studyMindCurrentTopicIndex",

    TOPIC_QUESTIONS_KEY:
        "studyMindTopicQuestions",

    TIMER_DURATION_KEY:
        "studyMindTimerDuration",

    TIMER_SECONDS_KEY:
        "studyMindTimerSeconds",

    TIMER_RUNNING_KEY:
        "studyMindTimerRunning",

    THEME_KEY:
        "studyMindTheme",

    LAST_STUDY_DATE_KEY:
        "lastStudyDate",

    STUDY_STREAK_KEY:
        "studyMindStreak",

    AI_QUESTION_COUNT_KEY:
        "aiQuestionCount",

    FREE_QUESTION_LIMIT: 5,

    KNOWLEDGE_CHECK_QUESTION_COUNT: 5,

    KNOWLEDGE_CHECK_PASS_PERCENTAGE: 60,

    DEFAULT_TIMER_MINUTES: 25

};


/* =========================================================
   SHORTCUT
========================================================= */

function $(id) {

    return document.getElementById(id);

}


/* =========================================================
   GLOBAL STATE
========================================================= */

let studyPlan = null;

let currentUser = null;

let topics = [];

let subjects = [];

let completedTopics = [];

let completedQuestionTopics = [];

let completedDays = [];

let currentTopicIndex = 0;

let activeKnowledgeCheckTopicKey = null;

let topicQuestions = {};

let currentCalendarDate = new Date();

let timerSeconds =
    STUDYMIND_CONFIG.DEFAULT_TIMER_MINUTES * 60;

let timerInterval = null;

let timerRunning = false;


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeDashboard
);


async function initializeDashboard() {

    try {

        initializeTheme();

        loadStudyPlan();

        loadCompletionState();

        loadCurrentTopicIndex();

        loadTopicQuestions();

        loadTimerState();

        await loadCurrentUser();

        preparePlanData();

        initializeEventListeners();

        renderDashboard();

        requestNotificationPermission();

    } catch (error) {

        console.error(
            "StudyMind Dashboard initialization error:",
            error
        );

        showDashboardError(
            "Something went wrong while loading your dashboard."
        );

    }

}


/* =========================================================
   LOAD STUDY PLAN
========================================================= */

function loadStudyPlan() {

    let rawPlan = null;

    try {

        rawPlan =
            localStorage.getItem(
                STUDYMIND_CONFIG.PLAN_KEY
            );

        if (!rawPlan) {

            rawPlan =
                localStorage.getItem(
                    STUDYMIND_CONFIG.COMPATIBILITY_PLAN_KEY
                );

            if (rawPlan) {

                console.log(
                    "Using compatibility study plan."
                );

            }

        }

        if (rawPlan) {

            studyPlan =
                JSON.parse(rawPlan);

        }

    } catch (error) {

        console.error(
            "Could not load study plan:",
            error
        );

        studyPlan = null;

    }

}


/* =========================================================
   LOAD COMPLETION STATE
========================================================= */

function loadCompletionState() {

    completedTopics =
        readArrayFromStorage(
            STUDYMIND_CONFIG.COMPLETED_TOPICS_KEY
        );

    completedQuestionTopics =
        readArrayFromStorage(
            STUDYMIND_CONFIG.COMPLETED_QUESTIONS_KEY
        );

    completedDays =
        readArrayFromStorage(
            STUDYMIND_CONFIG.COMPLETED_DAYS_KEY
        );

}


/* =========================================================
   LOAD CURRENT TOPIC
========================================================= */

function loadCurrentTopicIndex() {

    const stored =
        localStorage.getItem(
            STUDYMIND_CONFIG.CURRENT_TOPIC_KEY
        );

    const parsed =
        Number(stored);

    if (
        Number.isInteger(parsed) &&
        parsed >= 0
    ) {

        currentTopicIndex = parsed;

    } else {

        currentTopicIndex = 0;

    }

}


/* =========================================================
   LOAD TOPIC QUESTIONS
========================================================= */

function loadTopicQuestions() {

    try {

        const stored =
            localStorage.getItem(
                STUDYMIND_CONFIG.TOPIC_QUESTIONS_KEY
            );

        if (!stored) {

            topicQuestions = {};

            return;

        }

        const parsed =
            JSON.parse(stored);

        topicQuestions =
            parsed &&
            typeof parsed === "object"
                ? parsed
                : {};

    } catch (error) {

        console.error(
            "Could not load topic questions:",
            error
        );

        topicQuestions = {};

    }

}


/* =========================================================
   SAVE STATE
========================================================= */

function saveCompletionState() {

    localStorage.setItem(
        STUDYMIND_CONFIG.COMPLETED_TOPICS_KEY,
        JSON.stringify(completedTopics)
    );

    localStorage.setItem(
        STUDYMIND_CONFIG.COMPLETED_QUESTIONS_KEY,
        JSON.stringify(completedQuestionTopics)
    );

    localStorage.setItem(
        STUDYMIND_CONFIG.COMPLETED_DAYS_KEY,
        JSON.stringify(completedDays)
    );

}


function saveCurrentTopicIndex() {

    localStorage.setItem(
        STUDYMIND_CONFIG.CURRENT_TOPIC_KEY,
        String(currentTopicIndex)
    );

}


function saveTopicQuestions() {

    localStorage.setItem(
        STUDYMIND_CONFIG.TOPIC_QUESTIONS_KEY,
        JSON.stringify(topicQuestions)
    );

}


/* =========================================================
   SAFE STORAGE ARRAY
========================================================= */

function readArrayFromStorage(key) {

    try {

        const value =
            localStorage.getItem(key);

        if (!value) {

            return [];

        }

        const parsed =
            JSON.parse(value);

        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch {

        return [];

    }

}


/* =========================================================
   PREPARE PLAN DATA
========================================================= */

function preparePlanData() {

    if (!studyPlan) {

        topics = [];

        subjects = [];

        return;

    }


    topics =
        extractTopics(studyPlan);


    subjects =
        extractSubjects(
            studyPlan,
            topics
        );


    if (
        currentTopicIndex >= topics.length
    ) {

        currentTopicIndex =
            Math.max(
                0,
                topics.length - 1
            );

        saveCurrentTopicIndex();

    }

}


/* =========================================================
   EXTRACT TOPICS
========================================================= */

function extractTopics(plan) {

    const result = [];


    /* -----------------------------------------------------
       DIRECT TOPICS
    ----------------------------------------------------- */

    if (Array.isArray(plan.topics)) {

        plan.topics.forEach(
            topic => {

                addTopicToResult(
                    result,
                    topic
                );

            }
        );

    }


    /* -----------------------------------------------------
       SUBJECTS CONTAINING TOPICS
    ----------------------------------------------------- */

    const possibleSubjects = [

        plan.subjects,

        plan.subjectList,

        plan.subjectData,

        plan.studySubjects

    ];


    possibleSubjects.forEach(
        subjectCollection => {

            if (
                !Array.isArray(
                    subjectCollection
                )
            ) {

                return;

            }


            subjectCollection.forEach(
                subject => {

                    if (
                        !subject ||
                        typeof subject !== "object"
                    ) {

                        return;

                    }


                    const subjectTopics =
                        subject.topics ||
                        subject.topicList ||
                        subject.studyTopics;


                    if (
                        Array.isArray(
                            subjectTopics
                        )
                    ) {

                        subjectTopics.forEach(
                            topic => {

                                const normalized =
                                    normalizeTopic(
                                        topic,
                                        subject.name ||
                                        subject.subject
                                    );

                                if (
                                    normalized
                                ) {

                                    result.push(
                                        normalized
                                    );

                                }

                            }
                        );

                    }

                }
            );

        }
    );


    /* -----------------------------------------------------
       SUBJECT OBJECT MAP
    ----------------------------------------------------- */

    if (
        plan.subjects &&
        !Array.isArray(plan.subjects) &&
        typeof plan.subjects === "object"
    ) {

        Object.entries(
            plan.subjects
        ).forEach(
            ([subjectName, value]) => {

                if (
                    Array.isArray(value)
                ) {

                    value.forEach(
                        topic => {

                            const normalized =
                                normalizeTopic(
                                    topic,
                                    subjectName
                                );

                            if (
                                normalized
                            ) {

                                result.push(
                                    normalized
                                );

                            }

                        }
                    );

                }

            }
        );

    }


    /* -----------------------------------------------------
       REMOVE DUPLICATES
    ----------------------------------------------------- */

    const unique = [];

    const seen = new Set();


    result.forEach(
        topic => {

            const key =
                getTopicKey(topic);

            if (
                !seen.has(key)
            ) {

                seen.add(key);

                unique.push(topic);

            }

        }
    );


    return unique;

}


/* =========================================================
   ADD TOPIC
========================================================= */

function addTopicToResult(
    result,
    topic
) {

    const normalized =
        normalizeTopic(topic);

    if (normalized) {

        result.push(
            normalized
        );

    }

}


/* =========================================================
   NORMALIZE TOPIC
========================================================= */

function normalizeTopic(
    topic,
    parentSubject = ""
) {

    if (
        typeof topic === "string"
    ) {

        return {

            name: topic,

            description:
                `Study ${topic} and complete the knowledge check.`,

            subject:
                parentSubject || "General",

            difficulty:
                "Medium"

        };

    }


    if (
        !topic ||
        typeof topic !== "object"
    ) {

        return null;

    }


    const name =
        topic.name ||
        topic.topic ||
        topic.title ||
        topic.topicName ||
        topic.topic_name ||
        topic.label;


    if (!name) {

        return null;

    }


    return {

        ...topic,

        name: String(name),

        description:
            topic.description ||
            topic.desc ||
            topic.summary ||
            `Study ${name} and complete the knowledge check.`,

        subject:
            topic.subject ||
            topic.subjectName ||
            topic.subject_name ||
            parentSubject ||
            "General",

        difficulty:
            topic.difficulty ||
            "Medium"

    };

}


/* =========================================================
   EXTRACT SUBJECTS
========================================================= */

function extractSubjects(
    plan,
    topicList
) {

    const result = [];


    if (
        Array.isArray(plan?.subjects)
    ) {

        plan.subjects.forEach(
            subject => {

                if (
                    typeof subject === "string"
                ) {

                    result.push(subject);

                } else if (
                    subject &&
                    typeof subject === "object"
                ) {

                    const name =
                        subject.name ||
                        subject.subject ||
                        subject.title;

                    if (name) {

                        result.push(
                            String(name)
                        );

                    }

                }

            }
        );

    }


    topicList.forEach(
        topic => {

            if (
                topic.subject
            ) {

                result.push(
                    String(topic.subject)
                );

            }

        }
    );


    if (
        result.length === 0 &&
        plan?.subjectList
    ) {

        if (
            Array.isArray(plan.subjectList)
        ) {

            plan.subjectList.forEach(
                item => {

                    result.push(
                        String(item)
                    );

                }
            );

        }

    }


    return [
        ...new Set(
            result.filter(Boolean)
        )
    ];

}


/* =========================================================
   CURRENT TOPIC
========================================================= */

function getCurrentTopic() {

    if (
        !topics.length
    ) {

        return null;

    }


    if (
        currentTopicIndex < 0
    ) {

        currentTopicIndex = 0;

    }


    if (
        currentTopicIndex >= topics.length
    ) {

        currentTopicIndex =
            topics.length - 1;

    }


    return topics[
        currentTopicIndex
    ];

}


/* =========================================================
   TOPIC KEY
========================================================= */

function getTopicKey(topic) {

    if (!topic) {

        return "";

    }


    const subject =
        topic.subject ||
        "";


    const name =
        topic.name ||
        topic.topic ||
        topic.title ||
        "";


    return `${subject}::${name}`
        .toLowerCase()
        .trim();

}


/* =========================================================
   TOPIC COMPLETION
========================================================= */

function isTopicStudyFinished(
    topic
) {

    if (!topic) {

        return false;

    }


    const key =
        getTopicKey(topic);


    return (
        completedTopics.includes(key) ||
        completedTopics.includes(topic.name)
    );

}


function isKnowledgeCheckCompleted(
    topic
) {

    if (!topic) {

        return false;

    }


    return completedQuestionTopics.includes(
        getTopicKey(topic)
    );

}


/* =========================================================
   RENDER ENTIRE DASHBOARD
========================================================= */

function renderDashboard() {

    renderCurrentTopic();

    renderProgress();

    renderTopics();

    renderSubjects();

    renderStats();

    renderDailyChallenge();

    renderCalendar();

    renderSchedule();

    renderNextSession();

}


/* =========================================================
   CURRENT TOPIC RENDER
========================================================= */

function renderCurrentTopic() {

    const topic =
        getCurrentTopic();


    const nameElement =
        $("currentTopicName");


    const descriptionElement =
        $("currentTopicDescription");


    const positionElement =
        $("topicPosition");


    const statusBadge =
        $("topicStatusBadge");


    const checkbox =
        $("topicCompleteCheckbox");


    const completionMessage =
        $("topicCompletionMessage");


    const questionsSection =
        $("topicQuestionsSection");


    const nextMessage =
        $("nextTopicMessage");


    if (!topic) {

        if (nameElement) {

            nameElement.textContent =
                "No topic available";

        }


        if (descriptionElement) {

            descriptionElement.textContent =
                "Create a study plan with topics to begin.";

        }


        if (positionElement) {

            positionElement.textContent =
                "NO TOPICS";

        }


        if (statusBadge) {

            statusBadge.textContent =
                "NO PLAN";

        }


        if (questionsSection) {

            questionsSection.style.display =
                "none";

        }


        return;

    }


    const studyFinished =
        isTopicStudyFinished(topic);


    const knowledgeComplete =
        isKnowledgeCheckCompleted(topic);


    if (nameElement) {

        nameElement.textContent =
            topic.name;

    }


    if (descriptionElement) {

        descriptionElement.textContent =
            topic.description;

    }


    if (positionElement) {

        positionElement.textContent =
            `TOPIC ${currentTopicIndex + 1} OF ${topics.length}`;

    }


    if (checkbox) {

        checkbox.checked =
            studyFinished;

        checkbox.disabled =
            studyFinished ||
            knowledgeComplete;

    }


    if (completionMessage) {

        if (knowledgeComplete) {

            completionMessage.textContent =
                "✓ This topic has been studied and the Knowledge Check has been passed.";

        } else if (studyFinished) {

            completionMessage.textContent =
                "✓ You finished studying this topic. Complete the Knowledge Check below.";

        } else {

            completionMessage.textContent =
                "Tick this box when you are done studying this topic.";

        }

    }


    if (statusBadge) {

        if (knowledgeComplete) {

            statusBadge.textContent =
                "COMPLETED";

            statusBadge.classList.add(
                "completed"
            );

        } else if (studyFinished) {

            statusBadge.textContent =
                "KNOWLEDGE CHECK";

            statusBadge.classList.add(
                "knowledge-check"
            );

        } else {

            statusBadge.textContent =
                "IN PROGRESS";

        }

    }


    if (nextMessage) {

        renderNextTopicMessage(
            topic,
            nextMessage
        );

    }


    if (questionsSection) {

        if (
            studyFinished &&
            !knowledgeComplete
        ) {

            showKnowledgeCheck(
                topic
            );

        } else {

            questionsSection.style.display =
                "none";

        }

    }

}


/* =========================================================
   NEXT TOPIC MESSAGE
========================================================= */

function renderNextTopicMessage(
    topic,
    container
) {

    const nextTopic =
        topics[
            currentTopicIndex + 1
        ];


    if (
        isKnowledgeCheckCompleted(topic)
    ) {

        if (nextTopic) {

            container.innerHTML = `
                <div class="next-topic-card">
                    <strong>✓ Topic completed</strong>
                    <span>Next topic: ${escapeHTML(nextTopic.name)}</span>
                </div>
            `;

        } else {

            container.innerHTML = `
                <div class="next-topic-card">
                    <strong>🎉 All topics completed!</strong>
                    <span>Excellent work. You have finished your study plan.</span>
                </div>
            `;

        }

        return;

    }


    if (
        isTopicStudyFinished(topic)
    ) {

        container.innerHTML = `
            <div class="knowledge-check-notice">
                <strong>🧠 Knowledge Check Ready</strong>
                <span>You finished studying this topic. Start the Knowledge Check below.</span>
            </div>
        `;

        return;

    }


    container.innerHTML =
        "";

}


/* =========================================================
   COMPLETE STUDYING TOPIC
========================================================= */

function completeCurrentTopic() {

    const topic =
        getCurrentTopic();


    if (!topic) {

        return;

    }


    if (
        isKnowledgeCheckCompleted(topic)
    ) {

        return;

    }


    const key =
        getTopicKey(topic);


    if (
        !completedTopics.includes(key)
    ) {

        completedTopics.push(key);

    }


    localStorage.setItem(
        STUDYMIND_CONFIG.LAST_STUDY_DATE_KEY,
        getTodayString()
    );


    updateStudyStreak();

    saveCompletionState();

    stopTimer();

    showKnowledgeCheck(topic);

    renderCurrentTopic();

    renderProgress();

    renderTopics();

    renderStats();

    renderDailyChallenge();

}


/* =========================================================
   KNOWLEDGE CHECK
========================================================= */

function showKnowledgeCheck(topic) {

    const section =
        $("topicQuestionsSection");


    if (
        !section ||
        !topic
    ) {

        return;

    }


    activeKnowledgeCheckTopicKey =
        getTopicKey(topic);


    section.style.display =
        "block";


    const result =
        $("topicQuestionResult");


    if (result) {

        result.innerHTML =
            "";

    }


    const storedQuestions =
        topicQuestions[
            activeKnowledgeCheckTopicKey
        ];


    if (
        Array.isArray(storedQuestions) &&
        storedQuestions.length >=
            STUDYMIND_CONFIG.KNOWLEDGE_CHECK_QUESTION_COUNT
    ) {

        renderKnowledgeQuestions(
            storedQuestions.slice(
                0,
                STUDYMIND_CONFIG.KNOWLEDGE_CHECK_QUESTION_COUNT
            )
        );

    } else {

        renderGenerateQuestionsPrompt(
            topic
        );

    }


    section.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });

}


/* =========================================================
   GENERATE QUESTION PROMPT
========================================================= */

function renderGenerateQuestionsPrompt(
    topic
) {

    const container =
        $("topicQuestions");


    const submitButton =
        $("submitTopicQuestions");


    if (!container) {

        return;

    }


    container.innerHTML = `
        <div class="knowledge-check-start-card"
             style="
                padding:20px;
                margin-bottom:16px;
                border-radius:14px;
                border:1px solid rgba(59,130,246,.35);
                background:rgba(59,130,246,.08);
             ">

            <div style="
                font-size:28px;
                margin-bottom:8px;
            ">
                🧠
            </div>

            <h3 style="margin:0 0 8px;">
                Start Knowledge Check
            </h3>

            <p style="margin:0 0 16px;">
                You have finished studying
                <strong>${escapeHTML(topic.name)}</strong>.
                Answer 5 questions to complete this topic.
            </p>

            <button
                id="generateTopicQuestionsButton"
                type="button"
                class="primary-button full-button"
            >
                🧠 Start Knowledge Check
            </button>

        </div>
    `;


    if (submitButton) {

        submitButton.style.display =
            "none";

    }


    const generateButton =
        $("generateTopicQuestionsButton");


    if (generateButton) {

        generateButton.addEventListener(
            "click",
            () => generateKnowledgeCheck(topic)
        );

    }

}


/* =========================================================
   GENERATE KNOWLEDGE CHECK
========================================================= */

async function generateKnowledgeCheck(
    topic
) {

    const container =
        $("topicQuestions");


    const generateButton =
        $("generateTopicQuestionsButton");


    if (generateButton) {

        generateButton.disabled =
            true;

        generateButton.textContent =
            "⏳ Preparing Questions...";

    }


    if (container) {

        container.innerHTML = `
            <div style="
                padding:24px;
                text-align:center;
            ">
                <div style="font-size:30px;">
                    🧠
                </div>
                <p>
                    StudyMind AI is preparing your
                    5-question Knowledge Check...
                </p>
            </div>
        `;

    }


    try {

        const questions =
            await requestKnowledgeCheckQuestions(
                topic
            );


        if (
            !Array.isArray(questions) ||
            questions.length < 5
        ) {

            throw new Error(
                "The AI did not return five valid questions."
            );

        }


        topicQuestions[
            getTopicKey(topic)
        ] =
            questions.slice(0, 5);


        saveTopicQuestions();

        activeKnowledgeCheckTopicKey =
            getTopicKey(topic);

        renderKnowledgeQuestions(
            questions.slice(0, 5)
        );


    } catch (error) {

        console.error(
            "Knowledge Check generation failed:",
            error
        );


        if (container) {

            container.innerHTML = `
                <div style="
                    padding:20px;
                    border-radius:14px;
                    border:1px solid rgba(239,68,68,.35);
                    background:rgba(239,68,68,.08);
                ">

                    <h3>
                        ⚠️ Could not prepare the Knowledge Check
                    </h3>

                    <p>
                        ${escapeHTML(
                            error.message ||
                            "Please try again."
                        )}
                    </p>

                    <button
                        id="retryKnowledgeCheck"
                        type="button"
                        class="primary-button"
                    >
                        Try Again
                    </button>

                </div>
            `;


            const retry =
                $("retryKnowledgeCheck");


            if (retry) {

                retry.addEventListener(
                    "click",
                    () => showKnowledgeCheck(topic)
                );

            }

        }

    }

}


/* =========================================================
   REQUEST AI QUESTIONS
========================================================= */

async function requestKnowledgeCheckQuestions(
    topic
) {

    const endpoints = [

        "/api/generate-questions",

        "/api/questions",

        "/api/ask-ai"

    ];


    let lastError = null;


    for (
        const endpoint of endpoints
    ) {

        try {

            const response =
                await fetch(
                    endpoint,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                topic:
                                    topic.name,

                                topicName:
                                    topic.name,

                                subject:
                                    topic.subject,

                                description:
                                    topic.description,

                                count:
                                    STUDYMIND_CONFIG
                                        .KNOWLEDGE_CHECK_QUESTION_COUNT,

                                numberOfQuestions:
                                    STUDYMIND_CONFIG
                                        .KNOWLEDGE_CHECK_QUESTION_COUNT,

                                difficulty:
                                    topic.difficulty ||
                                    "Medium",

                                type:
                                    "knowledge-check"

                            })
                    }
                );


            if (!response.ok) {

                lastError =
                    new Error(
                        `Question API returned ${response.status}.`
                    );

                continue;

            }


            const data =
                await response.json();


            const questions =
                extractQuestionsFromResponse(
                    data
                );


            if (
                questions.length >= 5
            ) {

                return questions
                    .slice(0, 5)
                    .map(
                        normalizeQuestion
                    );

            }


            lastError =
                new Error(
                    "API response did not contain five questions."
                );

        } catch (error) {

            lastError =
                error;

        }

    }


    throw (
        lastError ||
        new Error(
            "No question-generation endpoint responded."
        )
    );

}


/* =========================================================
   EXTRACT QUESTIONS FROM API
========================================================= */

function extractQuestionsFromResponse(
    data
) {

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
        Array.isArray(data.data)
    ) {

        return data.data;

    }


    if (
        data.result &&
        Array.isArray(data.result.questions)
    ) {

        return data.result.questions;

    }


    if (
        data.response &&
        Array.isArray(data.response.questions)
    ) {

        return data.response.questions;

    }


    if (
        typeof data.questions === "string"
    ) {

        try {

            return JSON.parse(
                data.questions
            );

        } catch {

            return [];

        }

    }


    if (
        typeof data.response === "string"
    ) {

        try {

            const parsed =
                JSON.parse(
                    data.response
                );

            if (
                Array.isArray(parsed)
            ) {

                return parsed;

            }


            if (
                Array.isArray(
                    parsed.questions
                )
            ) {

                return parsed.questions;

            }

        } catch {

            return [];

        }

    }


    return [];

}


/* =========================================================
   NORMALIZE QUESTION
========================================================= */

function normalizeQuestion(
    question
) {

    if (
        typeof question === "string"
    ) {

        return {

            question,

            options: [],

            answer: "",

            correctAnswer: ""

        };

    }


    const options =
        question.options ||
        question.choices ||
        question.answers ||
        [];


    return {

        question:
            question.question ||
            question.text ||
            question.prompt ||
            "",

        options:
            Array.isArray(options)
                ? options
                : [],

        answer:
            question.answer ??
            question.correctAnswer ??
            question.correct_answer ??
            question.correct ??
            "",

        explanation:
            question.explanation ||
            ""

    };

}


/* =========================================================
   RENDER QUESTIONS
========================================================= */

function renderKnowledgeQuestions(
    questions
) {

    const container =
        $("topicQuestions");


    const submitButton =
        $("submitTopicQuestions");


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    questions
        .slice(
            0,
            STUDYMIND_CONFIG
                .KNOWLEDGE_CHECK_QUESTION_COUNT
        )
        .forEach(
            (question, index) => {

                const wrapper =
                    document.createElement(
                        "div"
                    );


                wrapper.className =
                    "knowledge-question";


                wrapper.style.marginBottom =
                    "24px";


                const number =
                    index + 1;


                const options =
                    question.options || [];


                wrapper.innerHTML = `

                    <div style="
                        margin-bottom:12px;
                    ">

                        <strong>
                            Question ${number} of 5
                        </strong>

                    </div>


                    <h3 style="
                        margin-bottom:14px;
                    ">
                        ${escapeHTML(
                            question.question
                        )}
                    </h3>


                    <div
                        class="knowledge-options"
                        data-question="${index}"
                    >

                        ${
                            options
                                .map(
                                    (
                                        option,
                                        optionIndex
                                    ) => {

                                        const letter =
                                            String.fromCharCode(
                                                65 +
                                                optionIndex
                                            );


                                        return `

                                            <label
                                                style="
                                                    display:block;
                                                    margin-bottom:10px;
                                                    cursor:pointer;
                                                "
                                            >

                                                <input
                                                    type="radio"
                                                    name="knowledge-question-${index}"
                                                    value="${escapeAttribute(
                                                        String(option)
                                                    )}"
                                                >

                                                <span>
                                                    <strong>
                                                        ${letter}.
                                                    </strong>
                                                    ${escapeHTML(
                                                        String(option)
                                                    )}
                                                </span>

                                            </label>

                                        `;

                                    }
                                )
                                .join("")
                        }

                    </div>

                `;


                container.appendChild(
                    wrapper
                );

            }
        );


    if (submitButton) {

        submitButton.style.display =
            "block";

        submitButton.disabled =
            false;

        submitButton.textContent =
            "Submit Answers";

    }


    if (
        window.MathJax &&
        typeof window.MathJax.typesetPromise ===
            "function"
    ) {

        window.MathJax
            .typesetPromise([
                container
            ])
            .catch(
                console.error
            );

    }

}


/* =========================================================
   SUBMIT KNOWLEDGE CHECK
========================================================= */

function submitKnowledgeCheck() {

    const topic =
        getCurrentTopic();


    if (!topic) {

        return;

    }


    if (
        !isTopicStudyFinished(topic)
    ) {

        alert(
            "Finish studying the topic before starting the Knowledge Check."
        );

        return;

    }


    if (
        isKnowledgeCheckCompleted(topic)
    ) {

        return;

    }


    const questions =
        topicQuestions[
            getTopicKey(topic)
        ];


    if (
        !Array.isArray(questions) ||
        questions.length < 5
    ) {

        alert(
            "Please start the Knowledge Check first."
        );

        return;

    }


    let score = 0;

    let answered = 0;


    questions
        .slice(0, 5)
        .forEach(
            (question, index) => {

                const selected =
                    document.querySelector(
                        `input[name="knowledge-question-${index}"]:checked`
                    );


                if (!selected) {

                    return;

                }


                answered++;


                const correct =
                    normalizeAnswer(
                        question.answer ??
                        question.correctAnswer ??
                        question.correct_answer ??
                        question.correct
                    );


                const selectedAnswer =
                    normalizeAnswer(
                        selected.value
                    );


                if (
                    answersMatch(
                        selectedAnswer,
                        correct,
                        question.options
                    )
                ) {

                    score++;

                }

            }
        );


    const result =
        $("topicQuestionResult");


    if (answered < 5) {

        if (result) {

            result.innerHTML = `
                <div style="
                    padding:16px;
                    border-radius:12px;
                    border:1px solid rgba(239,68,68,.35);
                    background:rgba(239,68,68,.08);
                ">

                    <strong>
                        ⚠️ Answer all 5 questions
                    </strong>

                    <p>
                        You answered ${answered} of 5 questions.
                    </p>

                </div>
            `;

        }

        return;

    }


    const percentage =
        Math.round(
            (score / 5) * 100
        );


    if (
        percentage >=
        STUDYMIND_CONFIG
            .KNOWLEDGE_CHECK_PASS_PERCENTAGE
    ) {

        completeKnowledgeCheck(
            topic,
            score,
            percentage
        );

    } else {

        showKnowledgeCheckFailure(
            score,
            percentage
        );

    }

}


/* =========================================================
   COMPLETE KNOWLEDGE CHECK
========================================================= */

function completeKnowledgeCheck(
    topic,
    score,
    percentage
) {

    const key =
        getTopicKey(topic);


    if (
        !completedQuestionTopics.includes(key)
    ) {

        completedQuestionTopics.push(
            key
        );

    }


    /*
       IMPORTANT:

       The calendar is marked completed HERE,
       NOT when the student merely ticks
       "I have finished studying this topic".
    */

    markTodayCompleted();


    saveCompletionState();


    const result =
        $("topicQuestionResult");


    if (result) {

        result.innerHTML = `
            <div style="
                padding:22px;
                margin-top:18px;
                border-radius:16px;
                border:1px solid rgba(34,197,94,.45);
                background:rgba(34,197,94,.10);
            ">

                <h3 style="margin-top:0;">
                    🎉 Knowledge Check Passed!
                </h3>

                <p>
                    You scored
                    <strong>
                        ${score}/5 (${percentage}%)
                    </strong>.
                </p>

                <p>
                    Great work. This topic is now fully completed.
                </p>

                <p>
                    ✅ Today's study day has been marked completed.
                </p>

            </div>
        `;

    }


    const submitButton =
        $("submitTopicQuestions");


    if (submitButton) {

        submitButton.disabled =
            true;

        submitButton.textContent =
            "✓ Knowledge Check Complete";

    }


    const checkbox =
        $("topicCompleteCheckbox");


    if (checkbox) {

        checkbox.checked =
            true;

        checkbox.disabled =
            true;

    }


    const statusBadge =
        $("topicStatusBadge");


    if (statusBadge) {

        statusBadge.textContent =
            "COMPLETED";

    }


    renderProgress();

    renderTopics();

    renderStats();

    renderDailyChallenge();

    renderCalendar();

    renderSchedule();

    renderNextSession();


    /*
       Move to next topic after a short delay.
    */

    setTimeout(
        moveToNextTopic,
        1500
    );

}


/* =========================================================
   KNOWLEDGE CHECK FAILURE
========================================================= */

function showKnowledgeCheckFailure(
    score,
    percentage
) {

    const result =
        $("topicQuestionResult");


    if (!result) {

        return;

    }


    result.innerHTML = `
        <div style="
            padding:22px;
            margin-top:18px;
            border-radius:16px;
            border:1px solid rgba(245,158,11,.45);
            background:rgba(245,158,11,.10);
        ">

            <h3 style="margin-top:0;">
                📚 Keep Studying
            </h3>

            <p>
                You scored
                <strong>
                    ${score}/5 (${percentage}%)
                </strong>.
            </p>

            <p>
                You need at least
                <strong>60%</strong>
                to complete this topic.
            </p>

            <p>
                Review the topic and try the Knowledge Check again.
            </p>

            <button
                id="retryKnowledgeCheckButton"
                type="button"
                class="primary-button"
            >
                🔄 Try Again
            </button>

        </div>
    `;


    const retry =
        $("retryKnowledgeCheckButton");


    if (retry) {

        retry.addEventListener(
            "click",
            () => {

                result.innerHTML =
                    "";

                renderKnowledgeQuestions(
                    topicQuestions[
                        activeKnowledgeCheckTopicKey
                    ]
                );

            }
        );

    }

}


/* =========================================================
   MOVE TO NEXT TOPIC
========================================================= */

function moveToNextTopic() {

    if (
        currentTopicIndex <
        topics.length - 1
    ) {

        currentTopicIndex++;

        saveCurrentTopicIndex();

        activeKnowledgeCheckTopicKey =
            null;

        renderDashboard();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

        return;

    }


    /*
       All topics completed.
    */

    renderDashboard();


    const name =
        $("currentTopicName");


    if (name) {

        name.textContent =
            "🎉 Study Plan Complete!";

    }


    const description =
        $("currentTopicDescription");


    if (description) {

        description.textContent =
            "Amazing work. You have completed every topic in this study plan.";

    }

}


/* =========================================================
   PROGRESS
========================================================= */

function renderProgress() {

    const total =
        topics.length;


    const completed =
        topics.filter(
            topic =>
                isKnowledgeCheckCompleted(topic)
        ).length;


    const percentage =
        total > 0
            ? Math.round(
                (completed / total) * 100
            )
            : 0;


    const percentElement =
        $("progressPercent");


    const countElement =
        $("progressCount");


    const progressBar =
        $("progressBar");


    if (percentElement) {

        percentElement.textContent =
            `${percentage}%`;

    }


    if (countElement) {

        countElement.textContent =
            `${completed} of ${total} topics completed`;

    }


    if (progressBar) {

        progressBar.style.width =
            `${percentage}%`;

    }

}


/* =========================================================
   TOPIC LIST
========================================================= */

function renderTopics() {

    const container =
        $("topicList");


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    if (!topics.length) {

        container.innerHTML = `
            <div class="empty-topic-list">
                No topics found.
                Create a study plan to begin.
            </div>
        `;

        return;

    }


    topics.forEach(
        (topic, index) => {

            const studyFinished =
                isTopicStudyFinished(topic);


            const knowledgeComplete =
                isKnowledgeCheckCompleted(topic);


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "topic-list-item";


            if (
                index === currentTopicIndex
            ) {

                item.classList.add(
                    "active"
                );

            }


            if (
                knowledgeComplete
            ) {

                item.classList.add(
                    "completed"
                );

            }


            item.innerHTML = `

                <div class="topic-list-main">

                    <span class="topic-number">
                        ${index + 1}
                    </span>


                    <div>

                        <strong>
                            ${escapeHTML(
                                topic.name
                            )}
                        </strong>


                        <small>
                            ${escapeHTML(
                                topic.subject ||
                                "General"
                            )}
                        </small>

                    </div>

                </div>


                <div class="topic-list-status">

                    ${
                        knowledgeComplete
                            ? "✓ Completed"
                            : studyFinished
                                ? "🧠 Knowledge Check"
                                : "In Progress"
                    }

                </div>

            `;


            item.addEventListener(
                "click",
                () => {

                    currentTopicIndex =
                        index;

                    saveCurrentTopicIndex();

                    activeKnowledgeCheckTopicKey =
                        null;

                    renderDashboard();

                    document
                        .getElementById(
                            "currentTopicSection"
                        )
                        ?.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });

                }
            );


            container.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   SUBJECT LIST
========================================================= */

function renderSubjects() {

    const container =
        $("subjectList");


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    if (!subjects.length) {

        container.innerHTML = `
            <div class="empty-subject-list">
                No subjects available.
            </div>
        `;

        return;

    }


    subjects.forEach(
        subject => {

            const subjectTopics =
                topics.filter(
                    topic =>
                        String(
                            topic.subject ||
                            ""
                        ).toLowerCase() ===
                        String(
                            subject
                        ).toLowerCase()
                );


            const completed =
                subjectTopics.filter(
                    topic =>
                        isKnowledgeCheckCompleted(
                            topic
                        )
                ).length;


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "subject-list-item";


            item.innerHTML = `

                <div>

                    <strong>
                        📚 ${escapeHTML(
                            subject
                        )}
                    </strong>


                    <small>
                        ${completed}
                        /
                        ${subjectTopics.length}
                        topics completed
                    </small>

                </div>

            `;


            container.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   STATS
========================================================= */

function renderStats() {

    const weeklyHours =
        $("weeklyHours");


    const daysLeft =
        $("daysLeft");


    const dailyGoal =
        $("dailyGoal");


    const studyScore =
        $("studyScore");


    const plan =
        studyPlan || {};


    const weekly =
        Number(
            plan.weeklyHours ||
            plan.hoursPerWeek ||
            plan.studyHoursPerWeek ||
            plan.weeklyStudyHours ||
            0
        );


    if (weeklyHours) {

        weeklyHours.textContent =
            formatNumber(
                weekly
            );

    }


    const examDate =
        getExamDate();


    if (daysLeft) {

        if (examDate) {

            const diff =
                daysBetween(
                    new Date(),
                    parseDate(
                        examDate
                    )
                );


            daysLeft.textContent =
                Math.max(
                    0,
                    diff
                );

        } else {

            daysLeft.textContent =
                "—";

        }

    }


    const daily =
        calculateDailyGoal();


    if (dailyGoal) {

        dailyGoal.textContent =
            `${formatNumber(daily)} hrs`;

    }


    if (studyScore) {

        studyScore.textContent =
            calculateStudyScore();

    }

}


/* =========================================================
   DAILY GOAL
========================================================= */

function calculateDailyGoal() {

    const plan =
        studyPlan || {};


    const direct =
        Number(
            plan.dailyGoal ||
            plan.dailyHours ||
            plan.hoursPerDay ||
            0
        );


    if (
        direct > 0
    ) {

        return direct;

    }


    const weekly =
        Number(
            plan.weeklyHours ||
            plan.hoursPerWeek ||
            0
        );


    if (
        weekly > 0
    ) {

        return weekly / 7;

    }


    return 0;

}


/* =========================================================
   STUDY SCORE
========================================================= */

function calculateStudyScore() {

    const total =
        topics.length;


    if (!total) {

        return 0;

    }


    const completed =
        topics.filter(
            topic =>
                isKnowledgeCheckCompleted(topic)
        ).length;


    const progressScore =
        (completed / total) * 70;


    const streak =
        Number(
            localStorage.getItem(
                STUDYMIND_CONFIG.STUDY_STREAK_KEY
            ) || 0
        );


    const streakScore =
        Math.min(
            30,
            streak * 3
        );


    return Math.round(
        Math.min(
            100,
            progressScore +
            streakScore
        )
    );

}


/* =========================================================
   DAILY CHALLENGE
========================================================= */

function renderDailyChallenge() {

    const title =
        $("dailyChallengeTitle");


    const description =
        $("dailyChallengeDescription");


    const progress =
        $("dailyChallengeProgress");


    const progressBar =
        $("dailyChallengeProgressBar");


    const button =
        $("dailyChallengeButton");


    if (
        !title ||
        !description
    ) {

        return;

    }


    const topic =
        getCurrentTopic();


    const completedToday =
        isTodayCompleted();


    if (completedToday) {

        title.textContent =
            "🏆 Challenge Complete!";


        description.textContent =
            "Excellent work. You completed today's study session and Knowledge Check.";


        if (progress) {

            progress.textContent =
                "100%";

        }


        if (progressBar) {

            progressBar.style.width =
                "100%";

        }


        if (button) {

            button.textContent =
                "✓ Completed Today";

            button.disabled =
                true;

        }


        return;

    }


    if (topic) {

        title.textContent =
            `📚 Study: ${topic.name}`;


        description.textContent =
            "Study your current topic, finish the topic, and pass the Knowledge Check.";


        const topicFinished =
            isTopicStudyFinished(topic);


        const topicComplete =
            isKnowledgeCheckCompleted(topic);


        const percent =
            topicComplete
                ? 100
                : topicFinished
                    ? 60
                    : 20;


        if (progress) {

            progress.textContent =
                `${percent}%`;

        }


        if (progressBar) {

            progressBar.style.width =
                `${percent}%`;

        }


        if (button) {

            if (topicComplete) {

                button.textContent =
                    "✓ Challenge Complete";

                button.disabled =
                    true;

            } else if (topicFinished) {

                button.textContent =
                    "🧠 Start Knowledge Check";

                button.disabled =
                    false;

            } else {

                button.textContent =
                    "🚀 Start Challenge";

                button.disabled =
                    false;

            }

        }

    }

}


/* =========================================================
   DAILY CHALLENGE BUTTON
========================================================= */

function handleDailyChallenge() {

    const topic =
        getCurrentTopic();


    if (!topic) {

        return;

    }


    if (
        isKnowledgeCheckCompleted(topic)
    ) {

        return;

    }


    if (
        isTopicStudyFinished(topic)
    ) {

        showKnowledgeCheck(topic);

        return;

    }


    document
        .getElementById(
            "currentTopicSection"
        )
        ?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });


    startTimer();

}


/* =========================================================
   CALENDAR
========================================================= */

function renderCalendar() {

    const monthElement =
        $("calendarMonth");


    const daysContainer =
        $("calendarDays");


    if (
        !monthElement ||
        !daysContainer
    ) {

        return;

    }


    const year =
        currentCalendarDate.getFullYear();


    const month =
        currentCalendarDate.getMonth();


    const monthName =
        currentCalendarDate.toLocaleString(
            "en-US",
            {
                month: "long"
            }
        );


    monthElement.textContent =
        `${monthName} ${year}`;


    daysContainer.innerHTML =
        "";


    const firstDay =
        new Date(
            year,
            month,
            1
        ).getDay();


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    const todayString =
        getTodayString();


    for (
        let i = 0;
        i < firstDay;
        i++
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "calendar-day empty";


        daysContainer.appendChild(
            empty
        );

    }


    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const cell =
            document.createElement(
                "div"
            );


        cell.className =
            "calendar-day";


        const date =
            new Date(
                year,
                month,
                day
            );


        const dateString =
            formatDate(
                date
            );


        const isToday =
            dateString ===
            todayString;


        const isCompleted =
            completedDays.includes(
                dateString
            );


        cell.textContent =
            String(day);


        if (isToday) {

            cell.classList.add(
                "today"
            );

        }


        if (
            isStudyDate(
                dateString
            )
        ) {

            cell.classList.add(
                "study-day"
            );

        }


        if (
            isExamDate(
                dateString
            )
        ) {

            cell.classList.add(
                "exam-day"
            );


            const examDot =
                document.createElement(
                    "span"
                );


            examDot.className =
                "calendar-dot exam-dot";


            cell.appendChild(
                examDot
            );

        }


        /*
           COMPLETED ALWAYS WINS.

           This is the important behavior:
           the day becomes green only when a
           Knowledge Check was passed.
        */

        if (isCompleted) {

            cell.classList.add(
                "completed-day"
            );


            cell.style.background =
                "#16a34a";


            cell.style.color =
                "#ffffff";


            cell.style.fontWeight =
                "700";


            cell.style.boxShadow =
                "0 0 0 2px rgba(22,163,74,.25)";


            cell.textContent =
                `${day} ✓`;

        }


        daysContainer.appendChild(
            cell
        );

    }

}


/* =========================================================
   COMPLETED CALENDAR DAYS
========================================================= */

function markTodayCompleted() {

    const today =
        getTodayString();


    if (
        !completedDays.includes(today)
    ) {

        completedDays.push(
            today
        );

    }


    saveCompletionState();

    renderCalendar();

}


/* =========================================================
   CHECK COMPLETED DAY
========================================================= */

function isTodayCompleted() {

    return completedDays.includes(
        getTodayString()
    );

}


/* =========================================================
   STUDY DATE
========================================================= */

function isStudyDate(
    dateString
) {

    if (!studyPlan) {

        return false;

    }


    const start =
        studyPlan.studyStartDate ||
        studyPlan.startDate ||
        studyPlan.studyStart ||
        studyPlan.start_date;


    const exam =
        getExamDate();


    if (
        !start ||
        !exam
    ) {

        return false;

    }


    return (
        dateString >=
        normalizeDateString(start) &&
        dateString <=
        normalizeDateString(exam)
    );

}


/* =========================================================
   EXAM DATE
========================================================= */

function getExamDate() {

    if (!studyPlan) {

        return null;

    }


    return (
        studyPlan.examDate ||
        studyPlan.testDate ||
        studyPlan.exam_date ||
        studyPlan.test_date ||
        null
    );

}


function isExamDate(
    dateString
) {

    const exam =
        getExamDate();


    if (!exam) {

        return false;

    }


    return (
        dateString ===
        normalizeDateString(exam)
    );

}


/* =========================================================
   CALENDAR NAVIGATION
========================================================= */

function changeCalendarMonth(
    amount
) {

    currentCalendarDate =
        new Date(
            currentCalendarDate.getFullYear(),
            currentCalendarDate.getMonth() +
                amount,
            1
        );


    renderCalendar();

}


/* =========================================================
   SCHEDULE
========================================================= */

function renderSchedule() {

    const container =
        $("scheduleList");


    if (!container) {

        return;

    }


    const sessions =
        extractSchedule();


    container.innerHTML =
        "";


    if (!sessions.length) {

        container.innerHTML = `
            <div class="empty-schedule">
                Your daily study sessions will appear here.
            </div>
        `;

        return;

    }


    sessions.forEach(
        session => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "schedule-item";


            item.innerHTML = `

                <div>

                    <strong>
                        ${escapeHTML(
                            session.title
                        )}
                    </strong>


                    <small>
                        ${escapeHTML(
                            session.subject ||
                            ""
                        )}
                    </small>

                </div>


                <span>
                    ${escapeHTML(
                        session.time ||
                        "Study"
                    )}
                </span>

            `;


            container.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   EXTRACT SCHEDULE
========================================================= */

function extractSchedule() {

    if (!studyPlan) {

        return [];

    }


    let source =
        studyPlan.schedule ||
        studyPlan.timetable ||
        studyPlan.dailySchedule ||
        studyPlan.sessions;


    if (
        !Array.isArray(source)
    ) {

        return [];

    }


    const today =
        new Date();


    const dayName =
        today.toLocaleString(
            "en-US",
            {
                weekday: "long"
            }
        );


    const todayName =
        dayName.toLowerCase();


    const filtered =
        source.filter(
            item => {

                if (
                    !item ||
                    typeof item !== "object"
                ) {

                    return false;

                }


                const day =
                    String(
                        item.day ||
                        item.weekday ||
                        ""
                    ).toLowerCase();


                return (
                    !day ||
                    day === todayName
                );

            }
        );


    return filtered.map(
        item => ({

            title:
                item.title ||
                item.topic ||
                item.name ||
                "Study Session",

            subject:
                item.subject ||
                "",

            time:
                item.time ||
                item.startTime ||
                item.start ||
                ""

        })
    );

}


/* =========================================================
   NEXT SESSION
========================================================= */

function renderNextSession() {

    const booking =
        $("nextBooking");


    const bookingTime =
        $("nextBookingTime");


    if (
        !booking ||
        !bookingTime
    ) {

        return;

    }


    const topic =
        getCurrentTopic();


    if (!topic) {

        booking.textContent =
            "No upcoming session yet";


        bookingTime.textContent =
            "Create a study plan to populate your calendar.";

        return;

    }


    if (
        isKnowledgeCheckCompleted(topic)
    ) {

        const next =
            topics[
                currentTopicIndex + 1
            ];


        if (next) {

            booking.textContent =
                next.name;


            bookingTime.textContent =
                "Next study topic";

        } else {

            booking.textContent =
                "Study plan complete";


            bookingTime.textContent =
                "🎉 All topics completed.";

        }

        return;

    }


    booking.textContent =
        topic.name;


    bookingTime.textContent =
        isTopicStudyFinished(topic)
            ? "Knowledge Check ready"
            : "Current study session";

}


/* =========================================================
   TIMER
========================================================= */

function loadTimerState() {

    const storedDuration =
        Number(
            localStorage.getItem(
                STUDYMIND_CONFIG.TIMER_DURATION_KEY
            )
        );


    const storedSeconds =
        Number(
            localStorage.getItem(
                STUDYMIND_CONFIG.TIMER_SECONDS_KEY
            )
        );


    if (
        [25, 45, 60].includes(
            storedDuration
        )
    ) {

        setTimerDuration(
            storedDuration,
            false
        );

    } else {

        setTimerDuration(
            25,
            false
        );

    }


    if (
        Number.isFinite(
            storedSeconds
        ) &&
        storedSeconds > 0
    ) {

        timerSeconds =
            storedSeconds;

    }


    updateTimerDisplay();

}


function setTimerDuration(
    minutes,
    reset = true
) {

    const allowed =
        [25, 45, 60];


    if (
        !allowed.includes(
            Number(minutes)
        )
    ) {

        minutes = 25;

    }


    const select =
        $("timerDuration");


    if (select) {

        select.value =
            String(minutes);

    }


    localStorage.setItem(
        STUDYMIND_CONFIG.TIMER_DURATION_KEY,
        String(minutes)
    );


    if (reset) {

        timerSeconds =
            Number(minutes) * 60;

        stopTimer();

        updateTimerDisplay();

        saveTimerState();

    }

}


function startTimer() {

    if (
        timerRunning
    ) {

        return;

    }


    timerRunning =
        true;


    timerInterval =
        setInterval(
            timerTick,
            1000
        );


    updateTimerButtons();

    saveTimerState();

}


function pauseTimer() {

    if (
        !timerRunning
    ) {

        return;

    }


    clearInterval(
        timerInterval
    );


    timerInterval =
        null;


    timerRunning =
        false;


    updateTimerButtons();

    saveTimerState();

}


function stopTimer() {

    clearInterval(
        timerInterval
    );


    timerInterval =
        null;


    timerRunning =
        false;


    updateTimerButtons();

    saveTimerState();

}


function resetTimer() {

    const select =
        $("timerDuration");


    const minutes =
        Number(
            select?.value ||
            STUDYMIND_CONFIG.DEFAULT_TIMER_MINUTES
        );


    timerSeconds =
        minutes * 60;


    stopTimer();

    updateTimerDisplay();

    saveTimerState();

}


function timerTick() {

    if (
        timerSeconds <= 0
    ) {

        stopTimer();

        timerSeconds =
            0;

        updateTimerDisplay();

        handleTimerFinished();

        return;

    }


    timerSeconds--;

    updateTimerDisplay();

    saveTimerState();

}


function updateTimerDisplay() {

    const display =
        $("studyTimer");


    if (!display) {

        return;

    }


    const minutes =
        Math.floor(
            timerSeconds / 60
        );


    const seconds =
        timerSeconds % 60;


    display.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

}


function updateTimerButtons() {

    const start =
        $("startTimerButton");


    const pause =
        $("pauseTimerButton");


    if (start) {

        start.disabled =
            timerRunning;

    }


    if (pause) {

        pause.disabled =
            !timerRunning;

    }

}


function saveTimerState() {

    localStorage.setItem(
        STUDYMIND_CONFIG.TIMER_SECONDS_KEY,
        String(timerSeconds)
    );


    localStorage.setItem(
        STUDYMIND_CONFIG.TIMER_RUNNING_KEY,
        String(timerRunning)
    );

}


function handleTimerFinished() {

    if (
        "Notification" in window &&
        Notification.permission === "granted"
    ) {

        new Notification(
            "StudyMind AI",
            {
                body:
                    "Your study timer has finished. Great work!"
            }
        );

    }


    alert(
        "⏰ Your study timer is finished!"
    );

}


/* =========================================================
   STUDY STREAK
========================================================= */

function updateStudyStreak() {

    const today =
        getTodayString();


    const last =
        localStorage.getItem(
            STUDYMIND_CONFIG.LAST_STUDY_DATE_KEY
        );


    let streak =
        Number(
            localStorage.getItem(
                STUDYMIND_CONFIG.STUDY_STREAK_KEY
            ) || 0
        );


    if (!last) {

        streak = 1;

    } else if (
        last === today
    ) {

        return;

    } else {

        const difference =
            daysBetween(
                parseDate(last),
                parseDate(today)
            );


        if (
            difference === 1
        ) {

            streak++;

        } else {

            streak = 1;

        }

    }


    localStorage.setItem(
        STUDYMIND_CONFIG.STUDY_STREAK_KEY,
        String(streak)
    );


    localStorage.setItem(
        STUDYMIND_CONFIG.LAST_STUDY_DATE_KEY,
        today
    );

}


/* =========================================================
   THEME
========================================================= */

function initializeTheme() {

    const saved =
        localStorage.getItem(
            STUDYMIND_CONFIG.THEME_KEY
        );


    if (
        saved === "light"
    ) {

        document.body.classList.add(
            "light-mode"
        );

    } else {

        document.body.classList.remove(
            "light-mode"
        );

    }


    updateThemeButton();

}


function toggleTheme() {

    const isLight =
        document.body.classList.toggle(
            "light-mode"
        );


    localStorage.setItem(
        STUDYMIND_CONFIG.THEME_KEY,
        isLight
            ? "light"
            : "dark"
    );


    updateThemeButton();

}


function updateThemeButton() {

    const button =
        $("themeButton");


    if (!button) {

        return;

    }


    const isLight =
        document.body.classList.contains(
            "light-mode"
        );


    button.textContent =
        isLight
            ? "☀️ Light Mode"
            : "🌙 Dark Mode";

}


/* =========================================================
   SUPABASE USER
========================================================= */

async function loadCurrentUser() {

    try {

        if (
            typeof supabase === "undefined"
        ) {

            console.warn(
                "Supabase client not available."
            );

            return;

        }


        if (
            !supabase.auth ||
            typeof supabase.auth.getSession !==
                "function"
        ) {

            return;

        }


        const {
            data,
            error
        } =
            await supabase.auth.getSession();


        if (error) {

            console.warn(
                "Could not retrieve Supabase session:",
                error
            );

            return;

        }


        currentUser =
            data?.session?.user ||
            null;


    } catch (error) {

        console.warn(
            "Supabase user loading failed:",
            error
        );

    }

}


/* =========================================================
   EVENT LISTENERS
========================================================= */

function initializeEventListeners() {

    const checkbox =
        $("topicCompleteCheckbox");


    if (checkbox) {

        checkbox.addEventListener(
            "change",
            () => {

                if (
                    checkbox.checked
                ) {

                    completeCurrentTopic();

                }

            }
        );

    }


    const submit =
        $("submitTopicQuestions");


    if (submit) {

        submit.addEventListener(
            "click",
            submitKnowledgeCheck
        );

    }


    const startTimerButton =
        $("startTimerButton");


    if (startTimerButton) {

        startTimerButton.addEventListener(
            "click",
            startTimer
        );

    }


    const pauseTimerButton =
        $("pauseTimerButton");


    if (pauseTimerButton) {

        pauseTimerButton.addEventListener(
            "click",
            pauseTimer
        );

    }


    const resetTimerButton =
        $("resetTimerButton");


    if (resetTimerButton) {

        resetTimerButton.addEventListener(
            "click",
            resetTimer
        );

    }


    const timerDuration =
        $("timerDuration");


    if (timerDuration) {

        timerDuration.addEventListener(
            "change",
            event => {

                setTimerDuration(
                    Number(
                        event.target.value
                    ),
                    true
                );

            }
        );

    }


    const themeButton =
        $("themeButton");


    if (themeButton) {

        themeButton.addEventListener(
            "click",
            toggleTheme
        );

    }


    const previousMonth =
        $("previousMonth");


    if (previousMonth) {

        previousMonth.addEventListener(
            "click",
            () =>
                changeCalendarMonth(-1)
        );

    }


    const nextMonth =
        $("nextMonth");


    if (nextMonth) {

        nextMonth.addEventListener(
            "click",
            () =>
                changeCalendarMonth(1)
        );

    }


    const dailyChallengeButton =
        $("dailyChallengeButton");


    if (dailyChallengeButton) {

        dailyChallengeButton.addEventListener(
            "click",
            handleDailyChallenge
        );

    }

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

function requestNotificationPermission() {

    if (
        !("Notification" in window)
    ) {

        return;

    }


    if (
        Notification.permission ===
        "default"
    ) {

        Notification
            .requestPermission()
            .catch(
                () => {}
            );

    }

}


/* =========================================================
   DATE HELPERS
========================================================= */

function getTodayString() {

    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            today.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


function formatDate(
    date
) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


function parseDate(
    value
) {

    if (
        value instanceof Date
    ) {

        return new Date(
            value.getFullYear(),
            value.getMonth(),
            value.getDate()
        );

    }


    const string =
        String(value);


    const match =
        string.match(
            /^(\d{4})-(\d{2})-(\d{2})/
        );


    if (match) {

        return new Date(
            Number(match[1]),
            Number(match[2]) - 1,
            Number(match[3])
        );

    }


    const date =
        new Date(value);


    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );

}


function normalizeDateString(
    value
) {

    if (!value) {

        return "";

    }


    return formatDate(
        parseDate(value)
    );

}


function daysBetween(
    first,
    second
) {

    const a =
        parseDate(first);


    const b =
        parseDate(second);


    const milliseconds =
        b.getTime() -
        a.getTime();


    return Math.round(
        milliseconds /
        86400000
    );

}


/* =========================================================
   ANSWER HELPERS
========================================================= */

function normalizeAnswer(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .trim()
        .toLowerCase()
        .replace(
            /^[a-d][.)]\s*/,
            ""
        )
        .replace(
            /\s+/g,
            " "
        );

}


function answersMatch(
    selected,
    correct,
    options = []
) {

    if (!selected || !correct) {

        return false;

    }


    if (
        selected === correct
    ) {

        return true;

    }


    const letters = [
        "a",
        "b",
        "c",
        "d"
    ];


    const selectedIndex =
        letters.indexOf(
            selected
        );


    const correctIndex =
        letters.indexOf(
            correct
        );


    if (
        selectedIndex >= 0 &&
        correctIndex >= 0
    ) {

        return (
            selectedIndex ===
            correctIndex
        );

    }


    if (
        Array.isArray(options)
    ) {

        const optionIndex =
            options.findIndex(
                option =>
                    normalizeAnswer(
                        option
                    ) ===
                    selected
            );


        if (
            optionIndex >= 0
        ) {

            const optionLetter =
                letters[
                    optionIndex
                ];


            if (
                optionLetter ===
                correct
            ) {

                return true;

            }

        }

    }


    return false;

}


/* =========================================================
   ESCAPING
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


function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );

}


/* =========================================================
   NUMBER FORMAT
========================================================= */

function formatNumber(
    number
) {

    const value =
        Number(number);


    if (
        !Number.isFinite(value)
    ) {

        return "0";

    }


    if (
        Number.isInteger(value)
    ) {

        return String(value);

    }


    return value.toFixed(1);

}


/* =========================================================
   DASHBOARD ERROR
========================================================= */

function showDashboardError(
    message
) {

    const topicName =
        $("currentTopicName");


    const description =
        $("currentTopicDescription");


    if (topicName) {

        topicName.textContent =
            "Dashboard Error";

    }


    if (description) {

        description.textContent =
            message;

    }

}


/* =========================================================
   PUBLIC FUNCTIONS
   These are useful if another StudyMind script
   needs to refresh the dashboard.
========================================================= */

window.StudyMindDashboard = {

    refresh: function () {

        loadStudyPlan();

        loadCompletionState();

        loadCurrentTopicIndex();

        loadTopicQuestions();

        preparePlanData();

        renderDashboard();

    },


    completeCurrentTopic:
        completeCurrentTopic,


    startTimer:
        startTimer,


    pauseTimer:
        pauseTimer,


    resetTimer:
        resetTimer,


    markTodayCompleted:
        markTodayCompleted,


    getCurrentTopic:
        getCurrentTopic

};


/* =========================================================
   END OF DASHBOARD.JS
========================================================= */
