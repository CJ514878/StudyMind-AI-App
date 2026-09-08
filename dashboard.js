/* =========================================================
   STUDYMIND AI — DASHBOARD.JS
   COMPLETE REPLACEMENT

   CONNECTED TO:
   - home.html
   - script.js
   - dashboard.html
   - knowledge-check.html / knowledge-check.js
   - summarizer.html / summarizer.js
   - ai-support.html / ai-support.js
   - ai-assistant.html

   FEATURES:
   - Supabase authentication
   - Premium verification
   - Premium gold dashboard
   - Light / dark mode
   - Multi-plan compatibility
   - Current topic tracking
   - Topic completion
   - Knowledge Check navigation
   - 5-question free Knowledge Check compatibility
   - Premium 5 / 10 / 20 / 30 / 40 / 50 / 60 compatibility
   - 25 / 45 / 60 minute study timer
   - Persistent timer
   - Study subjects
   - Subject completion
   - Topic progress
   - Study score
   - Study streak
   - Calendar
   - Exam days
   - Study days
   - Break / rest days
   - Completed days
   - Post-exam neutral days
   - Schedule
   - Next study session
   - Daily challenge
   - AI assistant compatibility
   - AI 5-question free limit
   - Summarizer compatibility
   - Navigation helpers
========================================================= */

"use strict";


/* =========================================================
   CONFIGURATION
========================================================= */

const FREE_AI_LIMIT = 5;

const TIMER_OPTIONS = [
    25,
    45,
    60
];

const DEFAULT_TIMER_MINUTES = 25;

const DEFAULT_TIMER_SECONDS =
    DEFAULT_TIMER_MINUTES * 60;

const QUESTION_REQUEST_TIMEOUT = 45000;

const PREMIUM_STATUS_ENDPOINT =
    "/api/premium/status";


/* =========================================================
   STORAGE KEYS
========================================================= */

const PLAN_KEY =
    "studyMindPlan";

const COMPATIBILITY_PLAN_KEY =
    "studyData";

const PLANS_KEY =
    "studyMindPlans";

const ACTIVE_PLAN_KEY =
    "studyMindActivePlanId";

const COMPLETED_TOPICS_KEY =
    "studyMindCompletedTopics";

const COMPLETED_QUESTIONS_KEY =
    "studyMindCompletedQuestionTopics";

const CURRENT_TOPIC_KEY =
    "studyMindCurrentTopicIndex";

const KNOWLEDGE_TOPIC_KEY =
    "studyMindKnowledgeCheckTopic";

const KNOWLEDGE_QUESTIONS_KEY =
    "studyMindTopicQuestions";

const COMPLETED_SUBJECTS_KEY =
    "completedSubjects";

const COMPLETED_DAYS_KEY =
    "studyMindCompletedDays";

const STUDY_SESSION_KEY =
    "studyMindCurrentStudySession";

const STUDY_READINGS_KEY =
    "studyMindTopicReadings";

const TIMER_SECONDS_KEY =
    "studyMindTimerSeconds";

const TIMER_DURATION_KEY =
    "studyMindSelectedTimerSeconds";

const TIMER_RUNNING_KEY =
    "studyMindTimerRunning";

const TIMER_END_TIME_KEY =
    "studyMindTimerEndTime";

const THEME_KEY =
    "studyMindTheme";

const AI_QUESTION_COUNT_KEY =
    "aiQuestionCount";

const AI_QUESTION_DATE_KEY =
    "aiQuestionDate";

const STREAK_KEY =
    "studyMindStreak";

const LAST_STUDY_DATE_KEY =
    "lastStudyDate";

const SCORE_KEY =
    "studyMindScore";


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentUser =
    null;

let isAuthenticated =
    false;

let studyPlan =
    null;

let normalizedSubjects =
    [];

let allTopics =
    [];

let completedTopics =
    [];

let completedQuestionTopics =
    [];

let completedSubjects =
    [];

let completedDays =
    [];

let currentTopicIndex =
    0;

let selectedTimerSeconds =
    DEFAULT_TIMER_SECONDS;

let timerSeconds =
    DEFAULT_TIMER_SECONDS;

let timerInterval =
    null;

let timerRunning =
    false;

let currentCalendarDate =
    new Date();

let premiumVerified =
    false;

let aiRequestInProgress =
    false;

let lastAIQuestion =
    "";

let lastAIMode =
    "question";

let currentStudyPlanId =
    null;


/* =========================================================
   ELEMENT HELPER
========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   SAFE JSON
========================================================= */

function readJSON(
    key,
    fallback
) {
    try {

        const value =
            localStorage.getItem(key);

        if (!value) {
            return fallback;
        }

        return JSON.parse(value);

    } catch (error) {

        console.warn(
            "StudyMind JSON read failed:",
            key,
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

    } catch (error) {

        console.warn(
            "StudyMind JSON write failed:",
            key,
            error
        );
    }
}


/* =========================================================
   TEXT HELPERS
========================================================= */

function cleanText(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/\s+/g, " ")
        .trim();
}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function slugify(value) {

    return cleanText(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
}


function formatTime(seconds) {

    const safeSeconds =
        Math.max(
            0,
            Number(seconds) || 0
        );

    const minutes =
        Math.floor(
            safeSeconds / 60
        );

    const remaining =
        safeSeconds % 60;

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(remaining).padStart(2, "0")
    );
}


/* =========================================================
   DATE HELPERS
========================================================= */

function startOfDay(date) {

    const result =
        new Date(date);

    result.setHours(
        0,
        0,
        0,
        0
    );

    return result;
}


function dateKey(date) {

    const d =
        startOfDay(date);

    return [
        d.getFullYear(),
        String(
            d.getMonth() + 1
        ).padStart(2, "0"),
        String(
            d.getDate()
        ).padStart(2, "0")
    ].join("-");
}


function parseDate(value) {

    if (!value) {
        return null;
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return null;
    }

    return date;
}


function formatDate(
    value,
    options = {}
) {

    const date =
        value instanceof Date
            ? value
            : parseDate(value);

    if (!date) {
        return "";
    }

    return date.toLocaleDateString(
        undefined,
        {
            year:
                options.year ||
                "numeric",

            month:
                options.month ||
                "short",

            day:
                options.day ||
                "numeric"
        }
    );
}


function daysBetween(
    first,
    second
) {

    const a =
        startOfDay(first);

    const b =
        startOfDay(second);

    return Math.round(
        (
            b.getTime() -
            a.getTime()
        ) /
        86400000
    );
}


/* =========================================================
   TOPIC NORMALIZATION
========================================================= */

function normalizeTopic(
    rawTopic,
    fallbackSubject = "",
    index = 0
) {

    if (
        rawTopic === null ||
        rawTopic === undefined
    ) {
        return null;
    }

    if (
        typeof rawTopic === "string" ||
        typeof rawTopic === "number"
    ) {

        const name =
            cleanText(rawTopic);

        if (!name) {
            return null;
        }

        return {

            id:
                `topic-${index}-${slugify(name)}`,

            name,

            subject:
                cleanText(
                    fallbackSubject
                ),

            description:
                `Study ${name} and complete the knowledge check.`
        };
    }

    if (
        typeof rawTopic !== "object"
    ) {
        return null;
    }

    const name =
        cleanText(
            rawTopic.name ||
            rawTopic.topic ||
            rawTopic.title ||
            rawTopic.label ||
            rawTopic.topicName ||
            rawTopic.topic_name ||
            rawTopic.lesson ||
            rawTopic.lessonName ||
            rawTopic.chapter ||
            rawTopic.chapterName
        );

    if (!name) {
        return null;
    }

    const subject =
        cleanText(
            fallbackSubject ||
            rawTopic.subject ||
            rawTopic.subjectName ||
            rawTopic.course ||
            rawTopic.courseName ||
            rawTopic.subject_title
        );

    const description =
        cleanText(
            rawTopic.description ||
            rawTopic.desc ||
            rawTopic.summary ||
            rawTopic.instruction ||
            rawTopic.details ||
            `Study ${name} and complete the knowledge check.`
        );

    return {

        id:
            cleanText(
                rawTopic.id ||
                rawTopic.topicId ||
                rawTopic.topic_id
            ) ||
            `topic-${index}-${slugify(name)}`,

        name,

        subject,

        description
    };
}


/* =========================================================
   SUBJECT NORMALIZATION
========================================================= */

function normalizeSubject(
    rawSubject,
    index = 0
) {

    if (
        typeof rawSubject === "string" ||
        typeof rawSubject === "number"
    ) {

        return {

            id:
                `subject-${index}-${slugify(rawSubject)}`,

            name:
                cleanText(rawSubject),

            topics: []
        };
    }

    if (
        !rawSubject ||
        typeof rawSubject !== "object"
    ) {
        return null;
    }

    const name =
        cleanText(
            rawSubject.name ||
            rawSubject.subject ||
            rawSubject.subjectName ||
            rawSubject.title ||
            rawSubject.label ||
            rawSubject.course ||
            rawSubject.courseName ||
            rawSubject.subject_title
        );

    if (!name) {
        return null;
    }

    const result = {

        id:
            cleanText(
                rawSubject.id ||
                rawSubject.subjectId
            ) ||
            `subject-${index}-${slugify(name)}`,

        name,

        topics: []
    };

    const topicContainers = [
        "topics",
        "topicList",
        "topic_list",
        "lessons",
        "lessonList",
        "units",
        "unitList",
        "chapters",
        "chapterList",
        "modules",
        "moduleList",
        "subtopics",
        "subTopics",
        "curriculumTopics"
    ];

    for (
        const key of topicContainers
    ) {

        const value =
            rawSubject[key];

        if (
            Array.isArray(value)
        ) {

            value.forEach(
                (
                    item,
                    topicIndex
                ) => {

                    const topic =
                        normalizeTopic(
                            item,
                            name,
                            topicIndex
                        );

                    if (topic) {

                        result.topics.push(
                            topic
                        );
                    }
                }
            );
        }
    }

    return result;
}


/* =========================================================
   PLAN NORMALIZATION
========================================================= */

function normalizePlan(
    rawPlan
) {

    if (!rawPlan) {
        return null;
    }

    let plan =
        rawPlan;

    if (
        Array.isArray(plan)
    ) {

        plan = {
            topics: plan
        };
    }

    if (
        plan.studyPlan &&
        typeof plan.studyPlan === "object"
    ) {

        plan =
            plan.studyPlan;

    } else if (
        plan.plan &&
        typeof plan.plan === "object"
    ) {

        plan =
            plan.plan;
    }

    if (
        !plan ||
        typeof plan !== "object"
    ) {
        return null;
    }

    const normalized = {

        version:
            plan.version || 1,

        curriculum:
            cleanText(
                plan.curriculum ||
                plan.examType ||
                "Nigerian Senior Secondary Curriculum"
            ),

        examType:
            cleanText(
                plan.examType ||
                plan.exam ||
                plan.exam_type ||
                plan.curriculum ||
                "School-Based Tests"
            ),

        examDate:
            cleanText(
                plan.examDate ||
                plan.exam_date
            ),

        studyHours:
            Number(
                plan.hoursPerDay ||
                plan.studyHours ||
                plan.study_hours ||
                1
            ),

        hoursPerDay:
            Number(
                plan.hoursPerDay ||
                plan.studyHours ||
                plan.study_hours ||
                1
            ),

        startTime:
            cleanText(
                plan.startTime ||
                ""
            ),

        difficulty:
            cleanText(
                plan.difficulty ||
                "balanced"
            ),

        daysLeft:
            Number(
                plan.daysLeft ||
                0
            ),

        studyStartDate:
            cleanText(
                plan.studyStartDate ||
                ""
            ),

        todaySubject:
            cleanText(
                plan.todaySubject ||
                ""
            ),

        todayName:
            cleanText(
                plan.todayName ||
                ""
            ),

        timetableData:
            Array.isArray(
                plan.timetableData
            )
                ? plan.timetableData
                : [],

        subjectNames:
            Array.isArray(
                plan.subjectNames
            )
                ? plan.subjectNames
                : [],

        subjects: [],

        topics: [],

        topicNames:
            Array.isArray(
                plan.topicNames
            )
                ? plan.topicNames
                : [],

        topicDifficulty:
            plan.topicDifficulty &&
            typeof plan.topicDifficulty === "object"
                ? plan.topicDifficulty
                : {},

        topicPriority:
            plan.topicPriority &&
            typeof plan.topicPriority === "object"
                ? plan.topicPriority
                : {},

        advice:
            cleanText(
                plan.advice ||
                ""
            ),

        studyScore:
            Number(
                plan.studyScore ||
                100
            ),

        streak:
            Number(
                plan.streak ||
                0
            ),

        createdAt:
            plan.createdAt ||
            ""
    };


    /* -----------------------------------------------------
       SUBJECTS
    ----------------------------------------------------- */

    const rawSubjects =
        Array.isArray(plan.subjects)
            ? plan.subjects
            : [];

    rawSubjects.forEach(
        (
            rawSubject,
            index
        ) => {

            const subject =
                normalizeSubject(
                    rawSubject,
                    index
                );

            if (
                subject &&
                subject.name
            ) {

                normalized.subjects.push(
                    subject
                );
            }
        }
    );


    /* -----------------------------------------------------
       TOP-LEVEL TOPICS
       script.js stores these directly.
    ----------------------------------------------------- */

    if (
        Array.isArray(plan.topics)
    ) {

        plan.topics.forEach(
            (
                rawTopic,
                index
            ) => {

                const topic =
                    normalizeTopic(
                        rawTopic,
                        "",
                        index
                    );

                if (topic) {

                    normalized.topics.push(
                        topic
                    );
                }
            }
        );
    }


    /* -----------------------------------------------------
       IF TOP-LEVEL TOPICS ARE MISSING,
       BUILD THEM FROM SUBJECTS.
    ----------------------------------------------------- */

    if (
        normalized.topics.length === 0
    ) {

        normalized.subjects.forEach(
            subject => {

                subject.topics.forEach(
                    topic => {

                        normalized.topics.push(
                            topic
                        );
                    }
                );
            }
        );
    }


    /* -----------------------------------------------------
       IF SUBJECTS ARE MISSING,
       BUILD THEM FROM TOPICS.
    ----------------------------------------------------- */

    if (
        normalized.subjects.length === 0 &&
        normalized.topics.length > 0
    ) {

        const subjectMap =
            {};

        normalized.topics.forEach(
            topic => {

                const subjectName =
                    topic.subject ||
                    "General";

                if (
                    !subjectMap[
                        subjectName
                    ]
                ) {

                    subjectMap[
                        subjectName
                    ] = {

                        id:
                            `subject-${slugify(subjectName)}`,

                        name:
                            subjectName,

                        topics: []
                    };
                }

                subjectMap[
                    subjectName
                ]
                    .topics
                    .push(topic);
            }
        );

        normalized.subjects =
            Object.values(
                subjectMap
            );
    }


    /* -----------------------------------------------------
       SUBJECT NAMES
    ----------------------------------------------------- */

    if (
        normalized.subjectNames.length === 0
    ) {

        normalized.subjectNames =
            normalized.subjects
                .map(
                    subject =>
                        subject.name
                )
                .filter(Boolean);
    }


    /* -----------------------------------------------------
       TOPIC NAMES
    ----------------------------------------------------- */

    if (
        normalized.topicNames.length === 0
    ) {

        normalized.topicNames =
            normalized.topics
                .map(
                    topic =>
                        topic.name
                )
                .filter(Boolean);
    }


    /* -----------------------------------------------------
       DAYS LEFT
    ----------------------------------------------------- */

    if (
        normalized.examDate
    ) {

        const exam =
            parseDate(
                normalized.examDate
            );

        if (exam) {

            normalized.daysLeft =
                Math.max(
                    0,
                    daysBetween(
                        new Date(),
                        exam
                    )
                );
        }
    }

    return normalized;
}


/* =========================================================
   LOAD PLAN
========================================================= */

function getRawStudyPlan() {

    let plan =
        readJSON(
            PLAN_KEY,
            null
        );

    if (!plan) {

        plan =
            readJSON(
                COMPATIBILITY_PLAN_KEY,
                null
            );
    }

    return plan;
}


function getStudyPlan() {

    const raw =
        getRawStudyPlan();

    if (!raw) {
        return null;
    }

    return normalizePlan(
        raw
    );
}


/* =========================================================
   MULTI-PLAN SUPPORT
========================================================= */

function getSavedPlans() {

    const plans =
        readJSON(
            PLANS_KEY,
            []
        );

    return Array.isArray(plans)
        ? plans
        : [];
}


function saveSavedPlans(
    plans
) {

    writeJSON(
        PLANS_KEY,
        Array.isArray(plans)
            ? plans
            : []
    );
}


function getActivePlanId() {

    return localStorage.getItem(
        ACTIVE_PLAN_KEY
    );
}


function setActivePlanId(
    id
) {

    if (id) {

        localStorage.setItem(
            ACTIVE_PLAN_KEY,
            id
        );

    } else {

        localStorage.removeItem(
            ACTIVE_PLAN_KEY
        );
    }
}


function loadActivePlanFromSavedPlans() {

    const plans =
        getSavedPlans();

    if (
        plans.length === 0
    ) {
        return;
    }

    const activeId =
        getActivePlanId();

    let active =
        plans.find(
            plan =>
                plan.id === activeId
        );

    if (!active) {

        active =
            plans[
                plans.length - 1
            ];

        if (active?.id) {
            setActivePlanId(
                active.id
            );
        }
    }

    if (
        active &&
        active.plan
    ) {

        studyPlan =
            normalizePlan(
                active.plan
            );

        currentStudyPlanId =
            active.id ||
            null;

        if (studyPlan) {

            writeJSON(
                PLAN_KEY,
                active.plan
            );

            writeJSON(
                COMPATIBILITY_PLAN_KEY,
                active.plan
            );
        }
    }
}


/* =========================================================
   COMPLETED TOPICS
========================================================= */

function loadCompletedTopics() {

    const value =
        readJSON(
            COMPLETED_TOPICS_KEY,
            []
        );

    completedTopics =
        Array.isArray(value)
            ? value
            : [];
}


function saveCompletedTopics() {

    writeJSON(
        COMPLETED_TOPICS_KEY,
        completedTopics
    );
}


function loadCompletedQuestionTopics() {

    const value =
        readJSON(
            COMPLETED_QUESTIONS_KEY,
            []
        );

    completedQuestionTopics =
        Array.isArray(value)
            ? value
            : [];
}


function getTopicKey(
    topic
) {

    if (!topic) {
        return "";
    }

    const subject =
        cleanText(
            topic.subject
        ).toLowerCase();

    const name =
        cleanText(
            topic.name
        ).toLowerCase();

    return (
        `${subject}::${name}`
    );
}


function isTopicCompleted(
    topic
) {

    if (!topic) {
        return false;
    }

    const key =
        getTopicKey(
            topic
        );

    return (
        completedTopics.includes(
            key
        ) ||
        completedTopics.includes(
            topic.name
        ) ||
        completedQuestionTopics.includes(
            key
        ) ||
        completedQuestionTopics.includes(
            topic.name
        )
    );
}


function markTopicAsCompleted(
    topic
) {

    if (!topic) {
        return;
    }

    const key =
        getTopicKey(
            topic
        );

    if (
        key &&
        !completedTopics.includes(
            key
        )
    ) {

        completedTopics.push(
            key
        );
    }

    if (
        topic.name &&
        !completedTopics.includes(
            topic.name
        )
    ) {

        completedTopics.push(
            topic.name
        );
    }

    saveCompletedTopics();
}


/* =========================================================
   CURRENT TOPIC
========================================================= */

function loadCurrentTopicIndex() {

    const saved =
        Number(
            localStorage.getItem(
                CURRENT_TOPIC_KEY
            )
        );

    if (
        Number.isFinite(saved) &&
        saved >= 0
    ) {

        currentTopicIndex =
            Math.min(
                saved,
                Math.max(
                    0,
                    allTopics.length - 1
                )
            );

    } else {

        currentTopicIndex =
            0;
    }
}


function saveCurrentTopicIndex() {

    localStorage.setItem(
        CURRENT_TOPIC_KEY,
        String(
            currentTopicIndex
        )
    );
}


function getCurrentTopic() {

    if (
        !allTopics.length
    ) {
        return null;
    }

    return (
        allTopics[
            currentTopicIndex
        ] ||
        allTopics[0] ||
        null
    );
}


function moveToNextTopic() {

    if (
        currentTopicIndex <
        allTopics.length - 1
    ) {

        currentTopicIndex++;

        saveCurrentTopicIndex();

        renderCurrentTopic();
        renderTopics();
        renderProgress();

        return true;
    }

    return false;
}


/* =========================================================
   KNOWLEDGE CHECK
========================================================= */

function getKnowledgeCheckTopic() {

    const topic =
        getCurrentTopic();

    if (!topic) {
        return null;
    }

    return {

        name:
            topic.name,

        subject:
            topic.subject ||
            "Senior Secondary",

        description:
            topic.description ||
            `Study ${topic.name} and complete the knowledge check.`,

        key:
            getTopicKey(topic),

        checkId:
            `${getTopicKey(topic)}-${Date.now()}`
    };
}


function openKnowledgeCheckPage(
    topic
) {

    if (!topic) {
        return;
    }

    const topicData = {

        name:
            cleanText(
                topic.name
            ),

        subject:
            cleanText(
                topic.subject ||
                "Senior Secondary"
            ),

        description:
            cleanText(
                topic.description ||
                `Study ${topic.name} and complete the knowledge check.`
            ),

        key:
            getTopicKey(topic),

        checkId:
            `${getTopicKey(topic)}-${Date.now()}`
    };

    if (!topicData.name) {
        return;
    }

    writeJSON(
        KNOWLEDGE_TOPIC_KEY,
        topicData
    );

    window.location.href =
        "knowledge-check.html";
}


function showKnowledgeCheck(
    topic
) {

    const section =
        $("topicQuestionsSection");

    if (!section) {
        return;
    }

    section.style.display =
        "block";

    const container =
        $("topicQuestions");

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div
            class="generate-questions-prompt"
            style="
                padding:22px;
                border-radius:16px;
                margin-top:15px;
                border:1px solid rgba(127,127,127,.2);
            "
        >

            <div
                style="
                    font-size:36px;
                    margin-bottom:10px;
                "
            >
                🧠
            </div>

            <h3>
                Ready to test yourself?
            </h3>

            <p>
                StudyMind AI will open a dedicated
                Knowledge Check for
                <strong>
                    ${escapeHTML(topic.name)}
                </strong>.
            </p>

            <button
                type="button"
                id="generateTopicQuestionsButton"
                class="primary-button full-button"
            >
                🧠 Start Knowledge Check
            </button>

            <div
                style="
                    margin-top:10px;
                    text-align:center;
                    opacity:.72;
                    font-size:.9rem;
                "
            >
                Free: 5 questions • Premium: 5–60 questions
                • 60% required to pass
            </div>

        </div>
    `;

    const button =
        $("generateTopicQuestionsButton");

    if (button) {

        button.addEventListener(
            "click",
            () => {

                openKnowledgeCheckPage(
                    topic
                );
            }
        );
    }
}


function hideKnowledgeCheck() {

    const section =
        $("topicQuestionsSection");

    if (section) {

        section.style.display =
            "none";
    }

    const container =
        $("topicQuestions");

    if (container) {

        container.innerHTML =
            "";
    }
}


function generateTopicQuestions(
    topic
) {

    openKnowledgeCheckPage(
        topic
    );
}


function submitKnowledgeCheck() {

    console.warn(
        "Knowledge Check scoring is handled by knowledge-check.html."
    );
}


/* =========================================================
   SUBJECT COMPLETION
========================================================= */

function loadCompletedSubjects() {

    const value =
        readJSON(
            COMPLETED_SUBJECTS_KEY,
            []
        );

    completedSubjects =
        Array.isArray(value)
            ? value
            : [];
}


function saveCompletedSubjects() {

    writeJSON(
        COMPLETED_SUBJECTS_KEY,
        completedSubjects
    );
}


function isSubjectCompleted(
    subjectName
) {

    return completedSubjects.includes(
        subjectName
    );
}


function setSubjectCompleted(
    subjectName,
    completed
) {

    if (!subjectName) {
        return;
    }

    if (completed) {

        if (
            !completedSubjects.includes(
                subjectName
            )
        ) {

            completedSubjects.push(
                subjectName
            );
        }

    } else {

        completedSubjects =
            completedSubjects.filter(
                name =>
                    name !== subjectName
            );
    }

    saveCompletedSubjects();

    markTodayCompletedIfAllSubjectsAreTicked();

    renderCalendar();
}


/* =========================================================
   SUBJECT RENDERING
========================================================= */

function renderSubjects() {

    const container =
        $("subjectList");

    if (!container) {
        return;
    }

    if (
        !normalizedSubjects.length
    ) {

        container.innerHTML = `
            <div class="empty-state">
                No subjects found in your study plan.
            </div>
        `;

        return;
    }

    container.innerHTML =
        normalizedSubjects
            .map(
                (
                    subject,
                    index
                ) => {

                    const checked =
                        isSubjectCompleted(
                            subject.name
                        );

                    return `
                        <label
                            class="subject-item"
                            data-subject-item="${escapeHTML(subject.name)}"
                            style="
                                display:flex;
                                align-items:center;
                                gap:12px;
                                cursor:pointer;
                            "
                        >

                            <input
                                type="checkbox"
                                class="subject-checkbox"
                                data-subject-checkbox
                                data-subject-name="${escapeHTML(subject.name)}"
                                ${checked ? "checked" : ""}
                            >

                            <span>
                                ${escapeHTML(subject.name)}
                            </span>

                        </label>
                    `;
                }
            )
            .join("");

    container
        .querySelectorAll(
            "input[data-subject-checkbox]"
        )
        .forEach(
            checkbox => {

                checkbox.addEventListener(
                    "change",
                    () => {

                        setSubjectCompleted(
                            checkbox.dataset.subjectName,
                            checkbox.checked
                        );
                    }
                );
            }
        );
}


/* =========================================================
   TOPIC RENDERING
========================================================= */

function renderTopics() {

    const container =
        $("topicList");

    if (!container) {
        return;
    }

    if (!allTopics.length) {

        container.innerHTML = `
            <div class="empty-state">
                No study topics found.
            </div>
        `;

        return;
    }

    container.innerHTML =
        allTopics
            .map(
                (
                    topic,
                    index
                ) => {

                    const completed =
                        isTopicCompleted(
                            topic
                        );

                    const current =
                        index ===
                        currentTopicIndex;

                    return `
                        <button
                            type="button"
                            class="dashboard-topic-item ${current ? "active" : ""} ${completed ? "completed" : ""}"
                            data-topic-index="${index}"
                            style="
                                width:100%;
                                text-align:left;
                                cursor:pointer;
                            "
                        >

                            <span
                                style="
                                    display:flex;
                                    align-items:center;
                                    gap:10px;
                                "
                            >

                                <span>
                                    ${
                                        completed
                                            ? "✓"
                                            : current
                                                ? "▶"
                                                : "○"
                                    }
                                </span>

                                <span>
                                    <strong>
                                        ${escapeHTML(topic.name)}
                                    </strong>

                                    ${
                                        topic.subject
                                            ? `
                                                <small
                                                    style="
                                                        display:block;
                                                        opacity:.65;
                                                        margin-top:3px;
                                                    "
                                                >
                                                    ${escapeHTML(topic.subject)}
                                                </small>
                                            `
                                            : ""
                                    }

                                </span>

                            </span>

                        </button>
                    `;
                }
            )
            .join("");

    container
        .querySelectorAll(
            "[data-topic-index]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const index =
                            Number(
                                button.dataset.topicIndex
                            );

                        if (
                            Number.isInteger(index)
                        ) {

                            currentTopicIndex =
                                Math.max(
                                    0,
                                    Math.min(
                                        index,
                                        allTopics.length - 1
                                    )
                                );

                            saveCurrentTopicIndex();

                            renderCurrentTopic();
                            renderTopics();
                            renderProgress();
                        }
                    }
                );
            }
        );
}


/* =========================================================
   CURRENT TOPIC RENDERING
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

    const badgeElement =
        $("topicStatusBadge");

    const checkbox =
        $("topicCompleteCheckbox");

    const completionMessage =
        $("topicCompletionMessage");

    const nextMessage =
        $("nextTopicMessage");

    if (!topic) {

        if (nameElement) {
            nameElement.textContent =
                "No topic available";
        }

        if (descriptionElement) {
            descriptionElement.textContent =
                "Create a study plan from the Home page to begin.";
        }

        return;
    }

    const completed =
        isTopicCompleted(
            topic
        );

    if (nameElement) {

        nameElement.textContent =
            topic.name;
    }

    if (descriptionElement) {

        descriptionElement.textContent =
            topic.description ||
            `Study ${topic.name} and complete the knowledge check.`;
    }

    if (positionElement) {

        positionElement.textContent =
            `Topic ${currentTopicIndex + 1} of ${allTopics.length}`;
    }

    if (badgeElement) {

        badgeElement.textContent =
            completed
                ? "Completed"
                : "In Progress";

        badgeElement.classList.toggle(
            "completed",
            completed
        );
    }

    if (checkbox) {

        checkbox.checked =
            completed;
    }

    if (completionMessage) {

        completionMessage.textContent =
            completed
                ? "This topic has been completed."
                : "Mark this topic as completed after you finish studying it.";
    }

    if (nextMessage) {

        if (
            currentTopicIndex <
            allTopics.length - 1
        ) {

            const next =
                allTopics[
                    currentTopicIndex + 1
                ];

            nextMessage.textContent =
                `Next: ${next.name}`;

        } else {

            nextMessage.textContent =
                "You have reached the final topic in this study plan.";
        }
    }

    if (checkbox) {

        checkbox.onchange =
            () => {

                if (
                    checkbox.checked
                ) {

                    markTopicAsCompleted(
                        topic
                    );

                    renderCurrentTopic();
                    renderTopics();
                    renderProgress();

                    showKnowledgeCheck(
                        topic
                    );

                } else {

                    completedTopics =
                        completedTopics.filter(
                            item =>
                                item !==
                                    getTopicKey(topic) &&
                                item !==
                                    topic.name
                        );

                    saveCompletedTopics();

                    hideKnowledgeCheck();

                    renderCurrentTopic();
                    renderTopics();
                    renderProgress();
                }
            };
    }

    if (completed) {

        showKnowledgeCheck(
            topic
        );

    } else {

        hideKnowledgeCheck();
    }
}


/* =========================================================
   PROGRESS
========================================================= */

function getCompletedTopicCount() {

    return allTopics.filter(
        topic =>
            isTopicCompleted(
                topic
            )
    ).length;
}


function getProgressPercentage() {

    if (
        allTopics.length === 0
    ) {
        return 0;
    }

    return Math.round(
        (
            getCompletedTopicCount() /
            allTopics.length
        ) *
        100
    );
}


function renderProgress() {

    const percentage =
        getProgressPercentage();

    const count =
        getCompletedTopicCount();

    const percentElement =
        $("progressPercent");

    const countElement =
        $("progressCount");

    const barElement =
        $("progressBar");

    if (percentElement) {

        percentElement.textContent =
            `${percentage}%`;
    }

    if (countElement) {

        countElement.textContent =
            `${count} of ${allTopics.length} topics completed`;
    }

    if (barElement) {

        barElement.style.width =
            `${percentage}%`;
    }
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

    const scoreElement =
        $("studyScore");

    if (daysLeft) {

        daysLeft.textContent =
            String(
                calculateDaysLeft()
            );
    }

    if (dailyGoal) {

        const hours =
            Number(
                studyPlan?.hoursPerDay ||
                1
            );

        dailyGoal.textContent =
            `${hours}h`;
    }

    if (weeklyHours) {

        const completed =
            getCompletedTopicCount();

        const total =
            allTopics.length;

        const hoursPerDay =
            Number(
                studyPlan?.hoursPerDay ||
                1
            );

        const estimated =
            total > 0
                ? Math.min(
                    7 * hoursPerDay,
                    Math.max(
                        0,
                        completed *
                        hoursPerDay
                    )
                )
                : 0;

        weeklyHours.textContent =
            `${estimated.toFixed(1)}h`;
    }

    const score =
        calculateStudyScore();

    if (scoreElement) {

        scoreElement.textContent =
            String(score);
    }
}


function calculateStudyScore() {

    const progress =
        getProgressPercentage();

    const streak =
        Number(
            localStorage.getItem(
                STREAK_KEY
            ) || 0
        );

    const examDate =
        parseDate(
            studyPlan?.examDate
        );

    let urgencyBonus =
        0;

    if (examDate) {

        const remaining =
            Math.max(
                0,
                daysBetween(
                    new Date(),
                    examDate
                )
            );

        if (
            remaining <= 7 &&
            progress >= 50
        ) {

            urgencyBonus = 5;

        } else if (
            remaining <= 30 &&
            progress >= 30
        ) {

            urgencyBonus = 3;
        }
    }

    const score =
        Math.max(
            0,
            Math.min(
                100,
                Math.round(
                    progress +
                    Math.min(
                        15,
                        streak * 2
                    ) +
                    urgencyBonus
                )
            )
        );

    localStorage.setItem(
        SCORE_KEY,
        String(score)
    );

    return score;
}


/* =========================================================
   DAYS LEFT
========================================================= */

function calculateDaysLeft() {

    if (
        !studyPlan?.examDate
    ) {
        return 0;
    }

    const exam =
        parseDate(
            studyPlan.examDate
        );

    if (!exam) {
        return 0;
    }

    return Math.max(
        0,
        daysBetween(
            new Date(),
            exam
        )
    );
}


/* =========================================================
   TIMER
========================================================= */

function loadTimerState() {

    const savedDuration =
        Number(
            localStorage.getItem(
                TIMER_DURATION_KEY
            )
        );

    const savedSeconds =
        Number(
            localStorage.getItem(
                TIMER_SECONDS_KEY
            )
        );

    const savedRunning =
        localStorage.getItem(
            TIMER_RUNNING_KEY
        ) === "true";

    if (
        TIMER_OPTIONS.includes(
            Math.round(
                savedDuration / 60
            )
        )
    ) {

        selectedTimerSeconds =
            savedDuration;

    } else {

        selectedTimerSeconds =
            DEFAULT_TIMER_SECONDS;
    }

    if (
        Number.isFinite(
            savedSeconds
        ) &&
        savedSeconds >= 0
    ) {

        timerSeconds =
            savedSeconds;

    } else {

        timerSeconds =
            selectedTimerSeconds;
    }

    timerRunning =
        savedRunning;

    const endTime =
        Number(
            localStorage.getItem(
                TIMER_END_TIME_KEY
            )
        );

    if (
        timerRunning &&
        Number.isFinite(endTime) &&
        endTime > 0
    ) {

        const remaining =
            Math.ceil(
                (
                    endTime -
                    Date.now()
                ) /
                1000
            );

        if (
            remaining > 0
        ) {

            timerSeconds =
                remaining;

        } else {

            timerSeconds =
                0;

            timerRunning =
                false;

            localStorage.setItem(
                TIMER_RUNNING_KEY,
                "false"
            );
        }
    }
}


function saveTimerState() {

    localStorage.setItem(
        TIMER_SECONDS_KEY,
        String(
            Math.max(
                0,
                timerSeconds
            )
        )
    );

    localStorage.setItem(
        TIMER_DURATION_KEY,
        String(
            selectedTimerSeconds
        )
    );

    localStorage.setItem(
        TIMER_RUNNING_KEY,
        String(
            timerRunning
        )
    );

    if (timerRunning) {

        localStorage.setItem(
            TIMER_END_TIME_KEY,
            String(
                Date.now() +
                timerSeconds * 1000
            )
        );

    } else {

        localStorage.removeItem(
            TIMER_END_TIME_KEY
        );
    }
}


function renderTimer() {

    const timer =
        $("studyTimer");

    if (!timer) {
        return;
    }

    timer.textContent =
        formatTime(
            timerSeconds
        );

    timer.classList.toggle(
        "timer-running",
        timerRunning
    );

    timer.classList.toggle(
        "timer-finished",
        timerSeconds === 0
    );
}


function setTimerButtonState() {

    const start =
        $("startTimerButton");

    const pause =
        $("pauseTimerButton");

    if (start) {

        start.disabled =
            timerRunning;

        start.textContent =
            timerSeconds === 0
                ? "▶ Start Timer"
                : "▶ Start";
    }

    if (pause) {

        pause.disabled =
            !timerRunning;
    }
}


function stopTimerInterval() {

    if (timerInterval) {

        clearInterval(
            timerInterval
        );

        timerInterval =
            null;
    }
}


function startTimer() {

    if (
        timerRunning
    ) {
        return;
    }

    if (
        timerSeconds <= 0
    ) {

        timerSeconds =
            selectedTimerSeconds;
    }

    timerRunning =
        true;

    saveTimerState();
    renderTimer();
    setTimerButtonState();

    stopTimerInterval();

    const endTime =
        Date.now() +
        timerSeconds * 1000;

    localStorage.setItem(
        TIMER_END_TIME_KEY,
        String(
            endTime
        )
    );

    timerInterval =
        setInterval(
            () => {

                const remaining =
                    Math.ceil(
                        (
                            endTime -
                            Date.now()
                        ) /
                        1000
                    );

                timerSeconds =
                    Math.max(
                        0,
                        remaining
                    );

                localStorage.setItem(
                    TIMER_SECONDS_KEY,
                    String(
                        timerSeconds
                    )
                );

                renderTimer();

                if (
                    timerSeconds <= 0
                ) {

                    finishTimer();
                }

            },
            250
        );
}


function pauseTimer() {

    if (
        !timerRunning
    ) {
        return;
    }

    timerRunning =
        false;

    stopTimerInterval();

    saveTimerState();
    renderTimer();
    setTimerButtonState();
}


function resetTimer() {

    timerRunning =
        false;

    stopTimerInterval();

    timerSeconds =
        selectedTimerSeconds;

    saveTimerState();
    renderTimer();
    setTimerButtonState();
}


function finishTimer() {

    timerRunning =
        false;

    stopTimerInterval();

    timerSeconds =
        0;

    saveTimerState();
    renderTimer();
    setTimerButtonState();

    try {

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

    } catch (_) {}

    if (
        typeof window.showTimerCompleteMessage ===
        "function"
    ) {

        window.showTimerCompleteMessage();
    }
}


function setupTimer() {

    loadTimerState();

    const select =
        $("timerDuration");

    if (select) {

        const selectedMinutes =
            Math.round(
                selectedTimerSeconds /
                60
            );

        if (
            TIMER_OPTIONS.includes(
                selectedMinutes
            )
        ) {

            select.value =
                String(
                    selectedMinutes
                );
        }

        select.addEventListener(
            "change",
            () => {

                const minutes =
                    Number(
                        select.value
                    );

                if (
                    !TIMER_OPTIONS.includes(
                        minutes
                    )
                ) {
                    return;
                }

                selectedTimerSeconds =
                    minutes * 60;

                if (
                    !timerRunning
                ) {

                    timerSeconds =
                        selectedTimerSeconds;
                }

                saveTimerState();
                renderTimer();
                setTimerButtonState();
            }
        );
    }

    const start =
        $("startTimerButton");

    if (start) {

        start.addEventListener(
            "click",
            startTimer
        );
    }

    const pause =
        $("pauseTimerButton");

    if (pause) {

        pause.addEventListener(
            "click",
            pauseTimer
        );
    }

    const reset =
        $("resetTimerButton");

    if (reset) {

        reset.addEventListener(
            "click",
            resetTimer
        );
    }

    renderTimer();
    setTimerButtonState();

    if (
        timerRunning
    ) {

        startTimer();
    }
}


/* =========================================================
   SCHEDULE HELPERS
========================================================= */

function getTimetableRows() {

    if (
        !Array.isArray(
            studyPlan?.timetableData
        )
    ) {

        return [];
    }

    return studyPlan.timetableData;
}


function normalizeScheduleRow(
    row,
    index
) {

    if (
        typeof row === "string"
    ) {

        return {

            day:
                row,

            subject:
                "",

            topic:
                "",

            time:
                "",

            type:
                "study"
        };
    }

    if (
        !row ||
        typeof row !== "object"
    ) {

        return null;
    }

    const day =
        cleanText(
            row.day ||
            row.date ||
            row.dayName ||
            row.name ||
            row.label
        );

    const subject =
        cleanText(
            row.subject ||
            row.subjectName ||
            row.course
        );

    const topic =
        cleanText(
            row.topic ||
            row.topicName ||
            row.lesson
        );

    const time =
        cleanText(
            row.time ||
            row.startTime ||
            row.start ||
            row.start_time
        );

    let type =
        cleanText(
            row.type ||
            row.dayType ||
            row.status ||
            "study"
        ).toLowerCase();

    if (
        type.includes("exam")
    ) {

        type =
            "exam";

    } else if (
        type.includes("rest") ||
        type.includes("break")
    ) {

        type =
            "break";

    } else if (
        type.includes("test")
    ) {

        type =
            "test";

    } else {

        type =
            "study";
    }

    return {

        day,
        subject,
        topic,
        time,
        type
    };
}


function renderSchedule() {

    const container =
        $("scheduleList");

    if (!container) {
        return;
    }

    const rows =
        getTimetableRows()
            .map(
                normalizeScheduleRow
            )
            .filter(Boolean);

    if (
        rows.length === 0
    ) {

        const topic =
            getCurrentTopic();

        if (!topic) {

            container.innerHTML = `
                <div class="empty-schedule">
                    Your daily study sessions will appear here.
                </div>
            `;

            return;
        }

        const hours =
            Number(
                studyPlan?.hoursPerDay ||
                1
            );

        container.innerHTML = `
            <div class="schedule-item">

                <strong>
                    Today
                </strong>

                <span>
                    ${escapeHTML(topic.subject || "")}
                    ${
                        topic.subject
                            ? " • "
                            : ""
                    }
                    ${escapeHTML(topic.name)}
                </span>

                <small>
                    ${hours} hour${hours === 1 ? "" : "s"}
                    ${
                        studyPlan?.startTime
                            ? ` • ${escapeHTML(studyPlan.startTime)}`
                            : ""
                    }
                </small>

            </div>
        `;

        return;
    }

    container.innerHTML =
        rows
            .slice(
                0,
                14
            )
            .map(
                row => `
                    <div
                        class="schedule-item"
                        data-schedule-type="${escapeHTML(row.type)}"
                    >

                        <strong>
                            ${escapeHTML(row.day || "Study Session")}
                        </strong>

                        ${
                            row.subject
                                ? `
                                    <span>
                                        ${escapeHTML(row.subject)}
                                    </span>
                                `
                                : ""
                        }

                        ${
                            row.topic
                                ? `
                                    <span>
                                        ${escapeHTML(row.topic)}
                                    </span>
                                `
                                : ""
                        }

                        ${
                            row.time
                                ? `
                                    <small>
                                        ${escapeHTML(row.time)}
                                    </small>
                                `
                                : ""
                        }

                    </div>
                `
            )
            .join("");
}


/* =========================================================
   NEXT SESSION
========================================================= */

function renderNextSession() {

    const title =
        $("nextBooking");

    const time =
        $("nextBookingTime");

    if (!title && !time) {
        return;
    }

    const topic =
        getCurrentTopic();

    if (!topic) {

        if (title) {
            title.textContent =
                "No upcoming session";
        }

        if (time) {
            time.textContent =
                "Create a study plan to begin.";
        }

        return;
    }

    if (title) {

        title.textContent =
            topic.name;
    }

    if (time) {

        time.textContent =
            [
                topic.subject,
                studyPlan?.startTime
            ]
                .filter(Boolean)
                .join(
                    " • "
                ) ||
            "Next study topic";
    }
}


/* =========================================================
   CALENDAR — COMPLETED DAYS
========================================================= */

function loadCompletedDays() {

    const value =
        readJSON(
            COMPLETED_DAYS_KEY,
            []
        );

    completedDays =
        Array.isArray(value)
            ? value
            : [];
}


function saveCompletedDays() {

    writeJSON(
        COMPLETED_DAYS_KEY,
        completedDays
    );
}


function isCompletedCalendarDay(
    date
) {

    return completedDays.includes(
        dateKey(date)
    );
}


function markCalendarDayCompleted(
    date
) {

    const key =
        dateKey(date);

    if (
        !completedDays.includes(
            key
        )
    ) {

        completedDays.push(
            key
        );

        saveCompletedDays();
    }
}


/* =========================================================
   CALENDAR — SUBJECT CHECKS
========================================================= */

function areAllSubjectsCompleted() {

    const container =
        $("subjectList");

    if (container) {

        const checkboxes =
            Array.from(
                container.querySelectorAll(
                    "input[type='checkbox']"
                )
            );

        if (
            checkboxes.length > 0
        ) {

            return checkboxes.every(
                checkbox =>
                    checkbox.checked
            );
        }
    }

    if (
        normalizedSubjects.length === 0
    ) {
        return false;
    }

    return normalizedSubjects.every(
        subject =>
            isSubjectCompleted(
                subject.name
            )
    );
}


function markTodayCompletedIfAllSubjectsAreTicked() {

    if (
        !normalizedSubjects.length
    ) {
        return;
    }

    if (
        areAllSubjectsCompleted()
    ) {

        markCalendarDayCompleted(
            new Date()
        );
    }
}


/* =========================================================
   CALENDAR — BREAK DETECTION
========================================================= */

function isScheduledBreakDay(
    date
) {

    const key =
        dateKey(date);

    const dayName =
        date.toLocaleDateString(
            undefined,
            {
                weekday:
                    "long"
            }
        ).toLowerCase();

    const rows =
        getTimetableRows();

    const matchingRows =
        rows
            .map(
                normalizeScheduleRow
            )
            .filter(Boolean)
            .filter(
                row => {

                    const rowDay =
                        cleanText(
                            row.day
                        ).toLowerCase();

                    return (
                        rowDay ===
                        dayName ||
                        rowDay ===
                        key
                    );
                }
            );

    if (
        matchingRows.some(
            row =>
                row.type === "break"
        )
    ) {
        return true;
    }

    const dayNumber =
        date.getDay();

    /*
       If the timetable explicitly contains
       a day, respect it. We do NOT automatically
       turn Sundays into break days.
    */

    if (
        matchingRows.length === 0
    ) {
        return false;
    }

    return false;
}


/* =========================================================
   CALENDAR — STUDY DAY
========================================================= */

function isScheduledStudyDay(
    date
) {

    if (
        !studyPlan
    ) {
        return false;
    }

    const today =
        startOfDay(
            new Date()
        );

    const target =
        startOfDay(
            date
        );

    /*
       Never make dates before today study days.
    */

    if (
        target < today
    ) {
        return false;
    }

    /*
       Never make dates after the exam
       study days.
    */

    const exam =
        parseDate(
            studyPlan.examDate
        );

    if (
        exam &&
        target > startOfDay(exam)
    ) {
        return false;
    }

    if (
        isScheduledBreakDay(
            date
        )
    ) {
        return false;
    }

    const rows =
        getTimetableRows();

    if (
        rows.length === 0
    ) {

        const start =
            parseDate(
                studyPlan.studyStartDate
            );

        if (
            start &&
            target < startOfDay(start)
        ) {
            return false;
        }

        return true;
    }

    const dayName =
        target
            .toLocaleDateString(
                undefined,
                {
                    weekday:
                        "long"
                }
            )
            .toLowerCase();

    const key =
        dateKey(target);

    return rows.some(
        row => {

            const normalized =
                normalizeScheduleRow(
                    row
                );

            if (!normalized) {
                return false;
            }

            if (
                normalized.type !==
                "study" &&
                normalized.type !==
                "test"
            ) {
                return false;
            }

            const rowDay =
                cleanText(
                    normalized.day
                ).toLowerCase();

            return (
                rowDay ===
                dayName ||
                rowDay ===
                key
            );
        }
    );
}


/* =========================================================
   CALENDAR — EXAM DAY
========================================================= */

function isExamDay(
    date
) {

    if (
        !studyPlan?.examDate
    ) {
        return false;
    }

    const exam =
        parseDate(
            studyPlan.examDate
        );

    if (!exam) {
        return false;
    }

    return (
        dateKey(date) ===
        dateKey(exam)
    );
}


/* =========================================================
   CALENDAR — POST EXAM
========================================================= */

function isPostExamDay(
    date
) {

    if (
        !studyPlan?.examDate
    ) {
        return false;
    }

    const exam =
        parseDate(
            studyPlan.examDate
        );

    if (!exam) {
        return false;
    }

    return (
        startOfDay(date) >
        startOfDay(exam)
    );
}


/* =========================================================
   CALENDAR CSS
========================================================= */

function injectCalendarStyles() {

    if (
        $("studyMindDashboardCalendarStyles")
    ) {
        return;
    }

    const style =
        document.createElement(
            "style"
        );

    style.id =
        "studyMindDashboardCalendarStyles";

    style.textContent = `

        .calendar-day {
            position: relative;
            transition:
                transform .2s ease,
                box-shadow .2s ease,
                background .2s ease,
                border-color .2s ease;
        }

        .calendar-day:hover {
            transform: translateY(-2px);
        }

        .calendar-day.study-day {
            background:
                rgba(30, 144, 255, .13) !important;
            border-color:
                rgba(30, 144, 255, .55) !important;
            box-shadow:
                0 0 16px rgba(30, 144, 255, .28) !important;
        }

        .calendar-day.exam-day {
            background:
                rgba(220, 38, 38, .22) !important;
            border-color:
                rgba(239, 68, 68, .9) !important;
            color:
                #fff !important;
            box-shadow:
                0 0 20px rgba(239, 68, 68, .55) !important;
        }

        .calendar-day.break-day {
            background:
                rgba(139, 92, 246, .18) !important;
            border-color:
                rgba(139, 92, 246, .65) !important;
            box-shadow:
                0 0 18px rgba(139, 92, 246, .32) !important;
        }

        .calendar-day.completed-day {
            background:
                rgba(34, 197, 94, .18) !important;
            border-color:
                rgba(34, 197, 94, .75) !important;
            box-shadow:
                0 0 18px rgba(34, 197, 94, .38) !important;
        }

        .calendar-day.today-day {
            outline:
                2px solid rgba(255,255,255,.55);
            outline-offset:
                2px;
        }

        .calendar-day.post-exam-day {
            background:
                transparent !important;
            border-color:
                rgba(127,127,127,.18) !important;
            box-shadow:
                none !important;
            color:
                inherit !important;
            opacity:
                .58;
        }

        .calendar-day .calendar-day-label {
            display:block;
            margin-top:3px;
            font-size:.62rem;
            font-weight:700;
            text-transform:uppercase;
            letter-spacing:.04em;
        }

        .calendar-day.exam-day .calendar-day-label {
            color:#fff;
        }

        body.premium-dashboard {
            --dashboard-premium-gold:
                #f5c542;

            --dashboard-premium-gold-light:
                #ffe28a;

            --dashboard-premium-gold-dark:
                #b88900;
        }

        body.premium-dashboard
        .dashboard-card,
        body.premium-dashboard
        .stat-card,
        body.premium-dashboard
        .panel,
        body.premium-dashboard
        .card {
            border-color:
                rgba(245,197,66,.18);
        }

        body.premium-dashboard
        .premium-badge {
            display:inline-flex;
            align-items:center;
            gap:6px;
            padding:5px 10px;
            border-radius:999px;
            background:
                rgba(245,197,66,.12);
            border:
                1px solid rgba(245,197,66,.38);
            color:
                #f5c542;
            font-weight:700;
        }

        body.light-mode
        .calendar-day.post-exam-day {
            color:inherit !important;
        }

        body.light-mode
        .calendar-day.exam-day {
            color:#fff !important;
        }

    `;

    document.head.appendChild(
        style
    );
}


/* =========================================================
   CALENDAR RENDER
========================================================= */

function renderCalendar() {

    const monthElement =
        $("calendarMonth");

    const daysContainer =
        $("calendarDays");

    if (
        !daysContainer
    ) {
        return;
    }

    injectCalendarStyles();

    const year =
        currentCalendarDate.getFullYear();

    const month =
        currentCalendarDate.getMonth();

    const firstDay =
        new Date(
            year,
            month,
            1
        );

    const lastDay =
        new Date(
            year,
            month + 1,
            0
        );

    const leadingDays =
        firstDay.getDay();

    if (monthElement) {

        monthElement.textContent =
            currentCalendarDate.toLocaleDateString(
                undefined,
                {
                    month:
                        "long",
                    year:
                        "numeric"
                }
            );
    }

    daysContainer.innerHTML =
        "";

    /*
       Empty leading cells.
    */

    for (
        let i = 0;
        i < leadingDays;
        i++
    ) {

        const empty =
            document.createElement(
                "div"
            );

        empty.className =
            "calendar-day calendar-empty";

        daysContainer.appendChild(
            empty
        );
    }


    for (
        let day = 1;
        day <= lastDay.getDate();
        day++
    ) {

        const date =
            new Date(
                year,
                month,
                day
            );

        const cell =
            document.createElement(
                "div"
            );

        cell.className =
            "calendar-day";

        cell.textContent =
            String(day);


        const today =
            dateKey(date) ===
            dateKey(new Date());

        if (today) {

            cell.classList.add(
                "today-day"
            );
        }


        /*
           IMPORTANT PRIORITY:

           1. Exam
           2. Post exam
           3. Completed
           4. Break
           5. Study
           6. Neutral
        */

        if (
            isExamDay(date)
        ) {

            cell.classList.add(
                "exam-day"
            );

            const label =
                document.createElement(
                    "span"
                );

            label.className =
                "calendar-day-label";

            label.textContent =
                "Exam";

            cell.appendChild(
                label
            );

        } else if (
            isPostExamDay(date)
        ) {

            cell.classList.add(
                "post-exam-day"
            );

        } else if (
            isCompletedCalendarDay(date)
        ) {

            cell.classList.add(
                "completed-day"
            );

            const label =
                document.createElement(
                    "span"
                );

            label.className =
                "calendar-day-label";

            label.textContent =
                "Done";

            cell.appendChild(
                label
            );

        } else if (
            isScheduledBreakDay(date)
        ) {

            cell.classList.add(
                "break-day"
            );

            const label =
                document.createElement(
                    "span"
                );

            label.className =
                "calendar-day-label";

            label.textContent =
                "Break";

            cell.appendChild(
                label
            );

        } else if (
            isScheduledStudyDay(date)
        ) {

            cell.classList.add(
                "study-day"
            );

            const label =
                document.createElement(
                    "span"
                );

            label.className =
                "calendar-day-label";

            label.textContent =
                "Study";

            cell.appendChild(
                label
            );
        }


        daysContainer.appendChild(
            cell
        );
    }
}


/* =========================================================
   CALENDAR NAVIGATION
========================================================= */

function previousCalendarMonth() {

    currentCalendarDate =
        new Date(
            currentCalendarDate.getFullYear(),
            currentCalendarDate.getMonth() - 1,
            1
        );

    renderCalendar();
}


function nextCalendarMonth() {

    currentCalendarDate =
        new Date(
            currentCalendarDate.getFullYear(),
            currentCalendarDate.getMonth() + 1,
            1
        );

    renderCalendar();
}


/* =========================================================
   DAILY CHALLENGE
========================================================= */

function getDailyChallenge() {

    const topic =
        getCurrentTopic();

    if (!topic) {

        return {

            title:
                "Start your study plan",

            description:
                "Create a study plan to unlock your daily challenge.",

            progress:
                0,

            complete:
                false
        };
    }

    const completed =
        isTopicCompleted(
            topic
        );

    return {

        title:
            `Study ${topic.name}`,

        description:
            completed
                ? "Great work. Your current topic is complete."
                : `Complete ${topic.name} and take the Knowledge Check.`,

        progress:
            completed
                ? 100
                : 0,

        complete:
            completed
    };
}


function renderDailyChallenge() {

    const challenge =
        getDailyChallenge();

    const title =
        $("dailyChallengeTitle");

    const description =
        $("dailyChallengeDescription");

    const progress =
        $("dailyChallengeProgress");

    const progressBar =
        $("dailyChallengeProgressBar");

    const badge =
        $("dailyChallengeBadge");

    const button =
        $("dailyChallengeButton");

    if (title) {

        title.textContent =
            challenge.title;
    }

    if (description) {

        description.textContent =
            challenge.description;
    }

    if (progress) {

        progress.textContent =
            `${challenge.progress}%`;
    }

    if (progressBar) {

        progressBar.style.width =
            `${challenge.progress}%`;
    }

    if (badge) {

        badge.textContent =
            challenge.complete
                ? "Complete"
                : "Today";
    }

    if (button) {

        button.textContent =
            challenge.complete
                ? "Review Topic"
                : "Study Now";

        button.onclick =
            () => {

                const topic =
                    getCurrentTopic();

                if (!topic) {
                    return;
                }

                if (
                    challenge.complete
                ) {

                    showKnowledgeCheck(
                        topic
                    );

                } else {

                    const section =
                        $("currentTopicSection");

                    if (section) {

                        section.scrollIntoView(
                            {
                                behavior:
                                    "smooth",
                                block:
                                    "start"
                            }
                        );
                    }
                }
            };
    }

    const genericText =
        $("dailyChallengeText");

    if (genericText) {

        genericText.textContent =
            challenge.description;
    }

    const content =
        $("dailyChallengeContent");

    if (content) {

        content.textContent =
            challenge.description;
    }
}


/* =========================================================
   STREAK
========================================================= */

function updateStudyStreak() {

    const today =
        dateKey(
            new Date()
        );

    const last =
        localStorage.getItem(
            LAST_STUDY_DATE_KEY
        );

    let streak =
        Number(
            localStorage.getItem(
                STREAK_KEY
            ) || 0
        );

    if (
        last === today
    ) {

        return streak;
    }

    if (last) {

        const lastDate =
            parseDate(
                last
            );

        if (lastDate) {

            const gap =
                daysBetween(
                    lastDate,
                    new Date()
                );

            if (
                gap === 1
            ) {

                streak += 1;

            } else if (
                gap > 1
            ) {

                streak = 1;
            }

        } else {

            streak = 1;
        }

    } else {

        streak = 1;
    }

    localStorage.setItem(
        STREAK_KEY,
        String(
            Math.max(
                1,
                streak
            )
        )
    );

    localStorage.setItem(
        LAST_STUDY_DATE_KEY,
        today
    );

    return streak;
}


/* =========================================================
   THEME
========================================================= */

function applyTheme() {

    const saved =
        localStorage.getItem(
            THEME_KEY
        ) ||
        "dark";

    const light =
        saved === "light";

    document.documentElement.classList.toggle(
        "light-mode",
        light
    );

    document.documentElement.classList.toggle(
        "dark-mode",
        !light
    );

    document.body.classList.toggle(
        "light-mode",
        light
    );

    document.body.classList.toggle(
        "dark-mode",
        !light
    );

    document.documentElement.style.colorScheme =
        light
            ? "light"
            : "dark";

    updateThemeButton();
}


function updateThemeButton() {

    const button =
        $("themeButton");

    if (!button) {
        return;
    }

    const light =
        document.body.classList.contains(
            "light-mode"
        );

    button.textContent =
        light
            ? "🌙 Dark Mode"
            : "☀️ Light Mode";

    button.setAttribute(
        "aria-label",
        light
            ? "Switch to dark mode"
            : "Switch to light mode"
    );
}


function toggleTheme() {

    const light =
        document.body.classList.contains(
            "light-mode"
        );

    localStorage.setItem(
        THEME_KEY,
        light
            ? "dark"
            : "light"
    );

    applyTheme();
}


/* =========================================================
   PREMIUM STATUS
========================================================= */

function getSupabaseClient() {

    if (
        window.supabaseClient
    ) {

        return window.supabaseClient;
    }

    if (
        window.supabase &&
        typeof window.supabase.createClient ===
        "function"
    ) {

        try {

            const client =
                window.supabase.createClient(
                    "https://bicnrbqqvucgpbwudmit.supabase.co",
                    "YOUR_SUPABASE_PUBLISHABLE_KEY"
                );

            window.supabaseClient =
                client;

            return client;

        } catch (error) {

            console.warn(
                "Unable to create Supabase client:",
                error
            );
        }
    }

    return null;
}


async function verifyPremiumStatus() {

    /*
       Never block the dashboard if the Premium
       endpoint is temporarily unavailable.
    */

    premiumVerified =
        false;

    if (
        window.studyMindPremiumVerified === true &&
        (
            window.studyMindIsPremium === true ||
            window.premiumUser === true
        )
    ) {

        premiumVerified =
            true;

        applyPremiumDashboardTheme();

        return true;
    }

    const client =
        getSupabaseClient();

    if (!client) {

        applyPremiumDashboardTheme();

        return false;
    }

    try {

        const sessionResult =
            await client.auth.getSession();

        const session =
            sessionResult?.data?.session;

        if (!session?.access_token) {

            applyPremiumDashboardTheme();

            return false;
        }

        const response =
            await fetch(
                PREMIUM_STATUS_ENDPOINT,
                {
                    method:
                        "GET",

                    headers: {
                        Authorization:
                            `Bearer ${session.access_token}`
                    }
                }
            );

        if (!response.ok) {

            applyPremiumDashboardTheme();

            return false;
        }

        const result =
            await response.json();

        premiumVerified =
            result?.premium === true;

        window.studyMindPremiumVerified =
            premiumVerified;

        window.studyMindIsPremium =
            premiumVerified;

        window.premiumUser =
            premiumVerified;

        applyPremiumDashboardTheme();

        return premiumVerified;

    } catch (error) {

        console.warn(
            "Premium verification failed:",
            error
        );

        applyPremiumDashboardTheme();

        return false;
    }
}


function applyPremiumDashboardTheme() {

    if (!document.body) {
        return;
    }

    document.body.classList.toggle(
        "premium-dashboard",
        premiumVerified
    );

    document.body.classList.toggle(
        "premium-user",
        premiumVerified
    );

    let badge =
        $("dashboardPremiumBadge");

    if (
        premiumVerified &&
        !badge
    ) {

        const header =
            document.querySelector(
                ".dashboard-header"
            ) ||
            document.querySelector(
                ".page-header"
            ) ||
            document.querySelector(
                "main"
            );

        if (header) {

            badge =
                document.createElement(
                    "span"
                );

            badge.id =
                "dashboardPremiumBadge";

            badge.className =
                "premium-badge";

            badge.textContent =
                "👑 Premium";

            header.appendChild(
                badge
            );
        }
    }

    if (
        badge
    ) {

        badge.style.display =
            premiumVerified
                ? "inline-flex"
                : "none";
    }
}


/* =========================================================
   AI USAGE
========================================================= */

function getAIQuestionCount() {

    const count =
        Number(
            localStorage.getItem(
                AI_QUESTION_COUNT_KEY
            ) || 0
        );

    return Math.max(
        0,
        Number.isFinite(count)
            ? count
            : 0
    );
}


function canAskAI() {

    if (
        premiumVerified
    ) {
        return true;
    }

    return (
        getAIQuestionCount() <
        FREE_AI_LIMIT
    );
}


function recordAIQuestion() {

    if (
        premiumVerified
    ) {
        return;
    }

    const next =
        getAIQuestionCount() +
        1;

    localStorage.setItem(
        AI_QUESTION_COUNT_KEY,
        String(
            next
        )
    );

    updateAIUsageDisplay();
}


function updateAIUsageDisplay() {

    const count =
        getAIQuestionCount();

    const badge =
        $("aiCountBadge");

    if (badge) {

        badge.textContent =
            premiumVerified
                ? "∞"
                : `${count}/${FREE_AI_LIMIT}`;
    }

    document
        .querySelectorAll(
            ".ai-limit-reached"
        )
        .forEach(
            element => {

                element.style.display =
                    !premiumVerified &&
                    count >= FREE_AI_LIMIT
                        ? ""
                        : "none";
            }
        );
}


/* =========================================================
   STUDY CONTEXT FOR AI
========================================================= */

function buildStudyContext() {

    const topic =
        getCurrentTopic();

    const subjects =
        normalizedSubjects
            .map(
                subject =>
                    subject.name
            );

    const topics =
        allTopics
            .map(
                item =>
                    item.name
            );

    return `
STUDY PLAN CONTEXT

Exam:
${studyPlan?.examType || "Not specified"}

Exam date:
${studyPlan?.examDate || "Not specified"}

Days remaining:
${calculateDaysLeft()}

Subjects:
${subjects.length ? subjects.join(", ") : "Not specified"}

Topics:
${topics.length ? topics.join(", ") : "Not specified"}

Current topic:
${topic?.name || "Not specified"}

Current subject:
${topic?.subject || "Not specified"}

Topics completed:
${getCompletedTopicCount()} of ${allTopics.length}

Progress:
${getProgressPercentage()}%

Study hours per day:
${studyPlan?.hoursPerDay || "Not specified"}

Difficulty:
${studyPlan?.difficulty || "balanced"}

Study advice:
${studyPlan?.advice || "Follow the study plan in order and complete each topic before moving forward."}
`.trim();
}


/* =========================================================
   AI PROMPT
========================================================= */

function buildAIPrompt(
    question,
    mode = "question"
) {

    const context =
        buildStudyContext();

    if (
        mode === "progress"
    ) {

        return `
You are StudyMind AI, an educational study assistant.

Analyze the student's current study progress.

${context}

Give a concise but useful analysis.

Include:
- Current progress
- What is going well
- What needs attention
- What the student should study next
- One practical recommendation

Do not invent information that is not in the study plan.
Use clear headings and bullet points.
Do not use raw HTML.
`.trim();
    }

    return `
You are StudyMind AI, an educational study assistant.

${context}

STUDENT QUESTION:
${cleanText(question)}

Answer the student's question accurately and educationally.

Rules:
- Personalize the answer using the study context.
- Prioritize unfinished topics and exam preparation.
- Explain difficult ideas step by step.
- Do not invent study-plan information.
- Use headings and bullet points when helpful.
- Use LaTeX for mathematical formulas when appropriate.
- Do not use raw HTML.
- Keep the response focused and useful for studying.
`.trim();
}


/* =========================================================
   AI RESPONSE EXTRACTION
========================================================= */

function extractAIAnswer(
    data
) {

    if (!data) {
        return "";
    }

    const direct =
        [
            data.reply,
            data.answer,
            data.response,
            data.content,
            data.output_text,
            data.output,
            data.result,
            data.message
        ];

    for (
        const value of direct
    ) {

        if (
            typeof value === "string" &&
            value.trim()
        ) {

            return value.trim();
        }
    }

    if (
        data.data
    ) {

        const nested =
            extractAIAnswer(
                data.data
            );

        if (nested) {
            return nested;
        }
    }

    if (
        Array.isArray(
            data.choices
        )
    ) {

        for (
            const choice of data.choices
        ) {

            const value =
                choice?.message?.content ||
                choice?.text;

            if (
                typeof value === "string" &&
                value.trim()
            ) {

                return value.trim();
            }
        }
    }

    return "";
}


/* =========================================================
   AI RESPONSE FORMATTING
========================================================= */

function formatAIResponse(
    text
) {

    let value =
        escapeHTML(
            text
        );

    value =
        value.replace(
            /^### (.+)$/gm,
            "<h4>$1</h4>"
        );

    value =
        value.replace(
            /^## (.+)$/gm,
            "<h3>$1</h3>"
        );

    value =
        value.replace(
            /^# (.+)$/gm,
            "<h3>$1</h3>"
        );

    value =
        value.replace(
            /\*\*(.+?)\*\*/g,
            "<strong>$1</strong>"
        );

    value =
        value.replace(
            /^\s*[-•]\s+(.+)$/gm,
            "<li>$1</li>"
        );

    value =
        value.replace(
            /(<li>.*<\/li>\n?)+/g,
            match =>
                `<ul>${match}</ul>`
        );

    value =
        value.replace(
            /^\s*(\d+)\.\s+(.+)$/gm,
            "<div class=\"ai-numbered-item\"><strong>$1.</strong> $2</div>"
        );

    value =
        value.replace(
            /\n{2,}/g,
            "<br><br>"
        );

    value =
        value.replace(
            /\n/g,
            "<br>"
        );

    return value;
}


async function renderMath(
    container
) {

    if (
        !container ||
        !window.MathJax
    ) {
        return;
    }

    if (
        typeof window.MathJax.typesetPromise ===
        "function"
    ) {

        try {

            await window.MathJax.typesetPromise(
                [container]
            );

        } catch (_) {}
    }
}


/* =========================================================
   AI DISPLAY
========================================================= */

function showAIResponse(
    text
) {

    const output =
        $("aiResponse");

    if (!output) {
        return;
    }

    output.innerHTML =
        `<div class="ai-response-content">
            ${formatAIResponse(text)}
        </div>`;

    renderMath(
        output
    );
}


function showAILoading() {

    const output =
        $("aiResponse");

    if (!output) {
        return;
    }

    output.innerHTML = `
        <div class="ai-loading-state">
            <span>🤖</span>
            <span>StudyMind AI is thinking...</span>
        </div>
    `;
}


function showAIError(
    message
) {

    const output =
        $("aiResponse");

    if (!output) {
        return;
    }

    output.innerHTML = `
        <div class="ai-error-state">

            <strong>
                Something went wrong
            </strong>

            <p>
                ${escapeHTML(
                    message ||
                    "Unable to get a response right now."
                )}
            </p>

        </div>
    `;
}


function showPremiumMessage() {

    const output =
        $("aiResponse");

    if (!output) {
        return;
    }

    output.innerHTML = `
        <div class="ai-limit-message">

            <div
                style="
                    font-size:34px;
                    margin-bottom:8px;
                "
            >
                💎
            </div>

            <h3>
                Free AI limit reached
            </h3>

            <p>
                You've used all ${FREE_AI_LIMIT}
                free AI questions.
                Premium gives you unlimited AI access.
            </p>

            <button
                type="button"
                class="premium-button"
                id="dashboardPremiumAIButton"
            >
                💎 Explore Premium
            </button>

        </div>
    `;

    const button =
        $("dashboardPremiumAIButton");

    if (button) {

        button.addEventListener(
            "click",
            () => {

                window.location.href =
                    "premium.html";
            }
        );
    }
}


/* =========================================================
   CALL AI
========================================================= */

async function callStudyMindAI(
    question,
    mode = "question"
) {

    const prompt =
        buildAIPrompt(
            question,
            mode
        );

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
                    JSON.stringify(
                        {
                            message:
                                prompt,

                            mode:
                                mode
                        }
                    )
            }
        );

    let data =
        null;

    try {

        data =
            await response.json();

    } catch (_) {

        throw new Error(
            "The AI service returned an invalid response."
        );
    }

    if (
        !response.ok
    ) {

        throw new Error(
            data?.error ||
            "Unable to contact StudyMind AI."
        );
    }

    const answer =
        extractAIAnswer(
            data
        );

    if (!answer) {

        throw new Error(
            "StudyMind AI returned an empty response."
        );
    }

    return answer;
}


/* =========================================================
   ASK AI
========================================================= */

async function askStudyMindAI() {

    if (
        aiRequestInProgress
    ) {
        return;
    }

    if (
        !canAskAI()
    ) {

        showPremiumMessage();

        return;
    }

    const input =
        $("aiQuestion");

    const question =
        cleanText(
            input?.value
        );

    if (!question) {

        if (input) {
            input.focus();
        }

        return;
    }

    lastAIQuestion =
        question;

    lastAIMode =
        "question";

    aiRequestInProgress =
        true;

    const button =
        $("askAIButton");

    if (button) {

        button.disabled =
            true;

        button.textContent =
            "⏳ Thinking...";
    }

    showAILoading();

    try {

        const answer =
            await callStudyMindAI(
                question,
                "question"
            );

        showAIResponse(
            answer
        );

        recordAIQuestion();

        if (input) {
            input.value =
                "";
        }

    } catch (error) {

        console.error(
            "StudyMind AI error:",
            error
        );

        showAIError(
            error.message
        );

    } finally {

        aiRequestInProgress =
            false;

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Ask StudyMind AI";
        }
    }
}


/* =========================================================
   PROGRESS ANALYSIS
========================================================= */

async function analyzeProgress() {

    if (
        aiRequestInProgress
    ) {
        return;
    }

    if (
        !canAskAI()
    ) {

        showPremiumMessage();

        return;
    }

    aiRequestInProgress =
        true;

    lastAIQuestion =
        "Analyze my study progress.";

    lastAIMode =
        "progress";

    const button =
        $("analyzeProgressButton");

    if (button) {

        button.disabled =
            true;

        button.textContent =
            "⏳ Analyzing...";
    }

    const output =
        $("aiAdviceText");

    if (output) {

        output.textContent =
            "StudyMind AI is analyzing your progress...";
    }

    try {

        const answer =
            await callStudyMindAI(
                lastAIQuestion,
                "progress"
            );

        if (output) {

            output.innerHTML =
                formatAIResponse(
                    answer
                );

            renderMath(
                output
            );
        }

        recordAIQuestion();

    } catch (error) {

        console.error(
            "Progress analysis error:",
            error
        );

        if (output) {

            output.textContent =
                error.message ||
                "Unable to analyze your progress right now.";
        }

    } finally {

        aiRequestInProgress =
            false;

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "✨ Analyze My Progress";
        }

        updateAIUsageDisplay();
    }
}


/* =========================================================
   QUICK AI QUESTIONS
========================================================= */

function useQuickQuestion(
    question
) {

    const input =
        $("aiQuestion");

    if (!input) {
        return;
    }

    input.value =
        question;

    input.focus();

    input.scrollIntoView(
        {
            behavior:
                "smooth",
            block:
                "center"
        }
    );
}


async function sendQuickQuestion(
    question
) {

    const input =
        $("aiQuestion");

    if (input) {
        input.value =
            question;
    }

    await askStudyMindAI();
}


/* =========================================================
   RETRY AI
========================================================= */

async function retryLastAIRequest() {

    if (!lastAIQuestion) {
        return;
    }

    if (
        !canAskAI()
    ) {

        showPremiumMessage();

        return;
    }

    if (
        lastAIMode === "progress"
    ) {

        await analyzeProgress();

        return;
    }

    const input =
        $("aiQuestion");

    if (input) {

        input.value =
            lastAIQuestion;
    }

    await askStudyMindAI();
}


/* =========================================================
   SUMMARIZER COMPATIBILITY
========================================================= */

function openSummarizer() {

    window.location.href =
        "summarizer.html";
}


function openAIAssistant() {

    window.location.href =
        "ai-assistant.html";
}


function openAISupport() {

    window.location.href =
        "ai-support.html";
}


function openStudyStreak() {

    window.location.href =
        "study-streak.html";
}


function openStudyScore() {

    window.location.href =
        "study-score.html";
}


function openHome() {

    window.location.href =
        "home.html";
}


function openNewStudyPlan() {

    window.location.href =
        "home.html#generator";
}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutStudyMind() {

    try {

        const client =
            getSupabaseClient();

        if (
            client &&
            client.auth
        ) {

            await client.auth.signOut();
        }

    } catch (error) {

        console.warn(
            "Logout error:",
            error
        );
    }

    localStorage.removeItem(
        "studyMindCurrentStudySession"
    );

    sessionStorage.clear();

    window.location.href =
        "login.html";
}


function logout() {

    return logoutStudyMind();
}


/* =========================================================
   AUTHENTICATION
========================================================= */

async function checkAuthentication() {

    const client =
        getSupabaseClient();

    if (!client) {

        /*
           Do not destroy a locally available study plan
           just because Supabase is temporarily unavailable.
        */

        isAuthenticated =
            false;

        return false;
    }

    try {

        const result =
            await client.auth.getUser();

        const user =
            result?.data?.user;

        currentUser =
            user || null;

        isAuthenticated =
            Boolean(
                user
            );

        return isAuthenticated;

    } catch (error) {

        console.warn(
            "Authentication check failed:",
            error
        );

        currentUser =
            null;

        isAuthenticated =
            false;

        return false;
    }
}


/* =========================================================
   AI ASSISTANT PAGE SUPPORT
========================================================= */

function setupAIAssistantPage() {

    const askButton =
        $("askAIButton");

    const analyzeButton =
        $("analyzeProgressButton");

    if (askButton) {

        askButton.onclick =
            askStudyMindAI;
    }

    if (analyzeButton) {

        analyzeButton.onclick =
            analyzeProgress;
    }

    const input =
        $("aiQuestion");

    if (input) {

        input.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    askStudyMindAI();
                }
            }
        );
    }

    updateAIUsageDisplay();
}


/* =========================================================
   DASHBOARD NAVIGATION
========================================================= */

function setupNavigation() {

    const themeButton =
        $("themeButton");

    if (themeButton) {

        themeButton.addEventListener(
            "click",
            toggleTheme
        );
    }

    const previous =
        $("previousMonth");

    if (previous) {

        previous.addEventListener(
            "click",
            previousCalendarMonth
        );
    }

    const next =
        $("nextMonth");

    if (next) {

        next.addEventListener(
            "click",
            nextCalendarMonth
        );
    }
}


/* =========================================================
   TOPIC COMPLETION SETUP
========================================================= */

function setupTopicCompletion() {

    const checkbox =
        $("topicCompleteCheckbox");

    if (!checkbox) {
        return;
    }

    checkbox.addEventListener(
        "change",
        () => {

            const topic =
                getCurrentTopic();

            if (!topic) {
                return;
            }

            if (
                checkbox.checked
            ) {

                markTopicAsCompleted(
                    topic
                );

                showKnowledgeCheck(
                    topic
                );

            } else {

                completedTopics =
                    completedTopics.filter(
                        item =>
                            item !==
                                getTopicKey(topic) &&
                            item !==
                                topic.name
                    );

                saveCompletedTopics();

                hideKnowledgeCheck();
            }

            renderCurrentTopic();
            renderTopics();
            renderProgress();
            renderStats();
            renderDailyChallenge();
            renderCalendar();
        }
    );
}


/* =========================================================
   EVENT SYNC
========================================================= */

function setupStorageSync() {

    window.addEventListener(
        "storage",
        event => {

            if (
                [
                    PLAN_KEY,
                    COMPATIBILITY_PLAN_KEY,
                    COMPLETED_TOPICS_KEY,
                    COMPLETED_QUESTIONS_KEY,
                    COMPLETED_SUBJECTS_KEY,
                    COMPLETED_DAYS_KEY,
                    TIMER_SECONDS_KEY,
                    TIMER_DURATION_KEY,
                    TIMER_RUNNING_KEY,
                    THEME_KEY,
                    AI_QUESTION_COUNT_KEY
                ].includes(
                    event.key
                )
            ) {

                reloadDashboardState();
            }
        }
    );


    window.addEventListener(
        "studyMindSubjectsUpdated",
        () => {

            loadCompletedSubjects();

            renderSubjects();

            markTodayCompletedIfAllSubjectsAreTicked();

            renderCalendar();
        }
    );


    window.addEventListener(
        "studyMindPlanUpdated",
        () => {

            reloadDashboardState();
        }
    );


    window.addEventListener(
        "studyMindTopicCompleted",
        () => {

            loadCompletedTopics();

            renderCurrentTopic();
            renderTopics();
            renderProgress();
            renderStats();
            renderCalendar();
            renderDailyChallenge();
        }
    );
}


/* =========================================================
   RELOAD DASHBOARD STATE
========================================================= */

function reloadDashboardState() {

    const raw =
        getRawStudyPlan();

    if (raw) {

        studyPlan =
            normalizePlan(
                raw
            );
    }

    if (!studyPlan) {

        loadActivePlanFromSavedPlans();
    }

    if (!studyPlan) {
        return;
    }

    normalizedSubjects =
        studyPlan.subjects || [];

    allTopics =
        studyPlan.topics || [];

    loadCompletedTopics();
    loadCompletedQuestionTopics();
    loadCompletedSubjects();
    loadCompletedDays();
    loadCurrentTopicIndex();

    renderSubjects();
    renderCurrentTopic();
    renderTopics();
    renderProgress();
    renderStats();
    renderSchedule();
    renderNextSession();
    renderCalendar();
    renderDailyChallenge();
    updateAIUsageDisplay();
}


/* =========================================================
   EMPTY DASHBOARD
========================================================= */

function renderNoPlanState() {

    if (
        studyPlan
    ) {
        return;
    }

    const name =
        $("currentTopicName");

    const description =
        $("currentTopicDescription");

    const position =
        $("topicPosition");

    if (name) {

        name.textContent =
            "No study plan yet";
    }

    if (description) {

        description.textContent =
            "Create your study plan from the Home page to start studying.";
    }

    if (position) {

        position.textContent =
            "Waiting for your study plan";
    }

    const topics =
        $("topicList");

    if (topics) {

        topics.innerHTML = `
            <div class="empty-state">

                <p>
                    Your topics will appear here after you create a study plan.
                </p>

                <a
                    href="home.html#generator"
                    class="primary-button"
                >
                    Create My Study Plan
                </a>

            </div>
        `;
    }

    const subjects =
        $("subjectList");

    if (subjects) {

        subjects.innerHTML = `
            <div class="empty-state">
                Create a study plan to add your subjects.
            </div>
        `;
    }

    const schedule =
        $("scheduleList");

    if (schedule) {

        schedule.innerHTML = `
            <div class="empty-schedule">
                Your daily study sessions will appear here.
            </div>
        `;
    }

    const days =
        $("calendarDays");

    if (days) {

        renderCalendar();
    }
}


/* =========================================================
   PAGE INITIALIZATION
========================================================= */

async function initializeDashboard() {

    /*
       Theme must be applied immediately.
    */

    applyTheme();

    setupNavigation();

    setupStorageSync();

    /*
       Load plan first so the dashboard remains useful
       even if Supabase has a temporary issue.
    */

    loadActivePlanFromSavedPlans();

    if (!studyPlan) {

        studyPlan =
            getStudyPlan();
    }

    if (studyPlan) {

        normalizedSubjects =
            studyPlan.subjects || [];

        allTopics =
            studyPlan.topics || [];
    }

    loadCompletedTopics();
    loadCompletedQuestionTopics();
    loadCompletedSubjects();
    loadCompletedDays();
    loadCurrentTopicIndex();

    /*
       Dashboard-only rendering.
    */

    if (
        $("currentTopicSection") ||
        $("topicList") ||
        $("calendarDays")
    ) {

        renderSubjects();
        renderCurrentTopic();
        renderTopics();
        renderProgress();
        renderStats();
        renderSchedule();
        renderNextSession();
        renderDailyChallenge();
        renderCalendar();

        setupTopicCompletion();

        setupTimer();
    }

    /*
       AI Assistant page also loads dashboard.js,
       so initialize its controls whenever its
       elements exist.
    */

    setupAIAssistantPage();

    /*
       Update streak without forcing a visual page
       change.
    */

    if (studyPlan) {

        updateStudyStreak();
        calculateStudyScore();
    }

    /*
       Premium verification happens after the core
       dashboard is usable.
    */

    await verifyPremiumStatus();

    updateAIUsageDisplay();

    renderStats();

    /*
       Restore timer if the page was refreshed while
       the timer was running.
    */

    if (
        $("studyTimer") &&
        timerRunning
    ) {

        stopTimerInterval();

        const endTime =
            Number(
                localStorage.getItem(
                    TIMER_END_TIME_KEY
                )
            );

        if (
            endTime &&
            endTime > Date.now()
        ) {

            timerInterval =
                setInterval(
                    () => {

                        timerSeconds =
                            Math.max(
                                0,
                                Math.ceil(
                                    (
                                        endTime -
                                        Date.now()
                                    ) /
                                    1000
                                )
                            );

                        renderTimer();

                        if (
                            timerSeconds <= 0
                        ) {

                            finishTimer();
                        }

                    },
                    250
                );
        } else {

            timerRunning =
                false;

            saveTimerState();
            renderTimer();
            setTimerButtonState();
        }
    }

    /*
       If there is no plan, display the empty state.
    */

    if (!studyPlan) {

        renderNoPlanState();
    }
}


/* =========================================================
   GLOBAL EXPORTS
========================================================= */

window.getStudyPlan =
    getStudyPlan;

window.getCurrentTopic =
    getCurrentTopic;

window.getTopicKey =
    getTopicKey;

window.renderCurrentTopic =
    renderCurrentTopic;

window.renderTopics =
    renderTopics;

window.renderSubjects =
    renderSubjects;

window.renderProgress =
    renderProgress;

window.renderStats =
    renderStats;

window.renderCalendar =
    renderCalendar;

window.renderSchedule =
    renderSchedule;

window.renderDailyChallenge =
    renderDailyChallenge;

window.renderNextSession =
    renderNextSession;

window.openKnowledgeCheckPage =
    openKnowledgeCheckPage;

window.showKnowledgeCheck =
    showKnowledgeCheck;

window.hideKnowledgeCheck =
    hideKnowledgeCheck;

window.generateTopicQuestions =
    generateTopicQuestions;

window.submitKnowledgeCheck =
    submitKnowledgeCheck;

window.startTimer =
    startTimer;

window.pauseTimer =
    pauseTimer;

window.resetTimer =
    resetTimer;

window.toggleTheme =
    toggleTheme;

window.applyTheme =
    applyTheme;

window.askStudyMindAI =
    askStudyMindAI;

window.sendQuickQuestion =
    sendQuickQuestion;

window.useQuickQuestion =
    useQuickQuestion;

window.analyzeProgress =
    analyzeProgress;

window.retryLastAIRequest =
    retryLastAIRequest;

window.callStudyMindAI =
    callStudyMindAI;

window.formatAIResponse =
    formatAIResponse;

window.renderMath =
    renderMath;

window.openHome =
    openHome;

window.openNewStudyPlan =
    openNewStudyPlan;

window.openSummarizer =
    openSummarizer;

window.openAIAssistant =
    openAIAssistant;

window.openAISupport =
    openAISupport;

window.openStudyStreak =
    openStudyStreak;

window.openStudyScore =
    openStudyScore;

window.logoutStudyMind =
    logoutStudyMind;

window.logout =
    logout;

window.recordAIQuestion =
    recordAIQuestion;

window.showPremiumMessage =
    showPremiumMessage;

window.verifyPremiumStatus =
    verifyPremiumStatus;

window.getAIQuestionCount =
    getAIQuestionCount;

window.canAskAI =
    canAskAI;


/* =========================================================
   DOM READY
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeDashboard
    );

} else {

    initializeDashboard();
}
