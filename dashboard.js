/* =========================================================
   STUDYMIND AI — DASHBOARD.JS
   COMPLETE REPLACEMENT

   INCLUDED:
   - Study plan loading
   - Multiple saved study plans
   - Current topic
   - Topic progress
   - Topic completion
   - Knowledge check redirect
   - Reading persistence
   - Study session persistence
   - 25 / 45 / 60 minute timer
   - Study streak
   - Calendar
   - CALENDAR COLORS INCLUDED DIRECTLY HERE
   - Schedule
   - Next session
   - Daily challenge
   - AI 5-question daily limit
   - Theme
   - Supabase authentication
   - Saved plan switching
   - Legacy localStorage compatibility
========================================================= */

"use strict";


/* =========================================================
   CONFIGURATION
========================================================= */

const FREE_QUESTION_LIMIT = 5;

const KNOWLEDGE_CHECK_QUESTION_COUNT = 5;

const KNOWLEDGE_CHECK_PASS_PERCENTAGE = 60;

const TIMER_OPTIONS = [25, 45, 60];

const DEFAULT_TIMER_MINUTES = 25;

const DEFAULT_TIMER_SECONDS =
    DEFAULT_TIMER_MINUTES * 60;

const QUESTION_REQUEST_TIMEOUT = 45000;


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

const TOPIC_QUESTIONS_KEY =
    "studyMindTopicQuestions";

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

const STUDY_SESSION_KEY =
    "studyMindCurrentStudySession";

const STUDY_READINGS_KEY =
    "studyMindTopicReadings";

const CELEBRATION_KEY =
    "studyMindCompletionCelebrationShown";


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentUser = null;

let studyPlan = null;

let normalizedSubjects = [];

let allTopics = [];

let completedTopics = [];

let completedQuestionTopics = [];

let currentTopicIndex = 0;

let topicQuestions = {};

let activeKnowledgeCheckTopicKey = null;

let knowledgeCheckGenerating = false;

let knowledgeCheckRequestId = 0;

let timerSeconds =
    DEFAULT_TIMER_SECONDS;

let selectedTimerSeconds =
    DEFAULT_TIMER_SECONDS;

let timerInterval = null;

let timerRunning = false;

let currentCalendarDate =
    new Date();

let currentStudySession = null;

let topicReadings = {};

let activePlanId = null;

let readingObserver = null;

let readingObserverStarted = false;


/* =========================================================
   ELEMENT HELPER
========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   SAFE JSON
========================================================= */

function readJSON(key, fallback) {

    try {

        const value =
            localStorage.getItem(key);

        if (!value) {
            return fallback;
        }

        return JSON.parse(value);

    } catch (error) {

        console.warn(
            "StudyMind localStorage read error:",
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

    } catch (error) {

        console.warn(
            "StudyMind localStorage write error:",
            key,
            error
        );
    }
}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
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


function slugify(value) {

    return cleanText(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
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
                cleanText(fallbackSubject),

            description:
                `Study ${name} and complete the knowledge check.`,

            original:
                rawTopic
        };
    }


    if (
        typeof rawTopic !== "object"
    ) {
        return null;
    }


    const possibleNames = [

        rawTopic.name,

        rawTopic.topic,

        rawTopic.title,

        rawTopic.label,

        rawTopic.topicName,

        rawTopic.topic_name,

        rawTopic.lesson,

        rawTopic.lessonName,

        rawTopic.chapter,

        rawTopic.chapterName
    ];


    let name = "";


    for (
        const candidate of possibleNames
    ) {

        if (
            cleanText(candidate)
        ) {

            name =
                cleanText(candidate);

            break;
        }
    }


    if (!name) {
        return null;
    }


    let subject =
        cleanText(fallbackSubject);


    if (!subject) {

        const subjectCandidates = [

            rawTopic.subject,

            rawTopic.subjectName,

            rawTopic.course,

            rawTopic.courseName,

            rawTopic.subject_title
        ];


        for (
            const candidate of subjectCandidates
        ) {

            if (
                cleanText(candidate)
            ) {

                subject =
                    cleanText(candidate);

                break;
            }
        }
    }


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

        description,

        original:
            rawTopic
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


    const result = {

        name,

        topics: []
    };


    const containers = [

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
        const key of containers
    ) {

        const value =
            rawSubject[key];


        if (
            Array.isArray(value)
        ) {

            value.forEach(
                (item, topicIndex) => {

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
   NORMALIZE PLAN
========================================================= */

function normalizePlan(rawPlan) {

    if (!rawPlan) {
        return null;
    }


    if (
        Array.isArray(rawPlan)
    ) {

        rawPlan = {
            topics: rawPlan
        };
    }


    if (
        typeof rawPlan !== "object"
    ) {
        return null;
    }


    let plan =
        rawPlan;


    if (
        rawPlan.studyPlan &&
        typeof rawPlan.studyPlan === "object"
    ) {

        plan =
            rawPlan.studyPlan;

    } else if (
        rawPlan.plan &&
        typeof rawPlan.plan === "object"
    ) {

        plan =
            rawPlan.plan;
    }


    const normalized = {

        examType:
            cleanText(
                plan.examType ||
                plan.exam ||
                plan.exam_type
            ),

        examDate:
            cleanText(
                plan.examDate ||
                plan.exam_date
            ),

        studyHours:
            Number(
                plan.studyHours ||
                plan.study_hours ||
                1
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
            plan.studyStartDate ||
            "",

        startTime:
            plan.startTime ||
            "16:00",

        createdAt:
            plan.createdAt ||
            "",

        subjects: [],

        topics: []
    };


    const rawSubjects =

        Array.isArray(plan.subjects)

            ? plan.subjects

            : Array.isArray(plan.subjectList)

                ? plan.subjectList

                : Array.isArray(plan.courses)

                    ? plan.courses

                    : [];


    rawSubjects.forEach(
        (rawSubject, index) => {

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


    if (
        Array.isArray(plan.topics)
    ) {

        plan.topics.forEach(
            (rawTopic, index) => {

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


    /*
       If topics were stored only inside subjects,
       bring them into the main topic array.
    */

    normalized.subjects.forEach(
        subject => {

            subject.topics.forEach(
                topic => {

                    const exists =
                        normalized.topics.some(
                            existing =>
                                getTopicKey(existing) ===
                                getTopicKey(topic)
                        );


                    if (!exists) {

                        normalized.topics.push(
                            topic
                        );
                    }
                }
            );
        }
    );


    /*
       Remove duplicates.
    */

    const seen =
        new Set();


    normalized.topics =
        normalized.topics.filter(
            topic => {

                const key =
                    getTopicKey(topic);


                if (!key) {
                    return false;
                }


                if (
                    seen.has(key)
                ) {
                    return false;
                }


                seen.add(key);

                return true;
            }
        );


    /*
       If subjects don't contain their topics,
       rebuild them from top-level topics.
    */

    normalized.subjects.forEach(
        subject => {

            if (
                subject.topics.length === 0
            ) {

                subject.topics =
                    normalized.topics.filter(
                        topic =>

                            cleanText(
                                topic.subject
                            ).toLowerCase() ===

                            cleanText(
                                subject.name
                            ).toLowerCase()
                    );
            }
        }
    );


    return normalized;
}


/* =========================================================
   TOPIC KEY
========================================================= */

function getTopicKey(topic) {

    if (!topic) {
        return "";
    }


    return (

        cleanText(topic.subject)
            .toLowerCase()

        +

        "::"

        +

        cleanText(topic.name)
            .toLowerCase()
    );
}


/* =========================================================
   PLAN REGISTRY
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


function saveSavedPlans(plans) {

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


function setActivePlanId(id) {

    if (!id) {
        return;
    }


    localStorage.setItem(
        ACTIVE_PLAN_KEY,
        id
    );


    activePlanId =
        id;
}


/* =========================================================
   PLAN TITLE
========================================================= */

function getPlanDisplayTitle(planRecord) {

    if (
        planRecord &&
        planRecord.title
    ) {

        return cleanText(
            planRecord.title
        );
    }


    const plan =
        normalizePlan(
            planRecord &&
            planRecord.plan
                ? planRecord.plan
                : planRecord
        );


    if (!plan) {
        return "Study Plan";
    }


    const names =
        plan.subjects
            .map(
                subject =>
                    cleanText(
                        subject.name
                    )
            )
            .filter(Boolean);


    if (names.length > 0) {

        return names
            .slice(0, 3)
            .join(" • ");
    }


    if (plan.examType) {
        return plan.examType;
    }


    return "Study Plan";
}


/* =========================================================
   CREATE PLAN ID
========================================================= */

function createPlanId() {

    return (

        "plan-" +

        Date.now().toString(36) +

        "-" +

        Math.random()
            .toString(36)
            .slice(2, 8)
    );
}


/* =========================================================
   LEGACY PLAN MIRROR
========================================================= */

function mirrorActiveStateToLegacy() {

    if (!studyPlan) {
        return;
    }


    writeJSON(
        PLAN_KEY,
        studyPlan
    );


    writeJSON(
        COMPATIBILITY_PLAN_KEY,
        studyPlan
    );


    writeJSON(
        COMPLETED_TOPICS_KEY,
        completedTopics
    );


    writeJSON(
        COMPLETED_QUESTIONS_KEY,
        completedQuestionTopics
    );


    localStorage.setItem(
        CURRENT_TOPIC_KEY,
        String(currentTopicIndex)
    );


    writeJSON(
        TOPIC_QUESTIONS_KEY,
        topicQuestions
    );


    writeJSON(
        STUDY_SESSION_KEY,
        currentStudySession
    );


    writeJSON(
        STUDY_READINGS_KEY,
        topicReadings
    );


    localStorage.setItem(
        TIMER_SECONDS_KEY,
        String(timerSeconds)
    );


    localStorage.setItem(
        TIMER_DURATION_KEY,
        String(selectedTimerSeconds)
    );
}


/* =========================================================
   CAPTURE ACTIVE PLAN
========================================================= */

function captureActivePlanState() {

    if (!activePlanId || !studyPlan) {
        return null;
    }


    return {

        id:
            activePlanId,

        title:
            getPlanDisplayTitle({
                plan: studyPlan
            }),

        plan:
            studyPlan,

        completedTopics:
            [...completedTopics],

        completedQuestionTopics:
            [...completedQuestionTopics],

        currentTopicIndex:
            currentTopicIndex,

        topicQuestions:
            topicQuestions,

        currentStudySession:
            currentStudySession,

        topicReadings:
            topicReadings,

        timerSeconds:
            timerSeconds,

        selectedTimerSeconds:
            selectedTimerSeconds,

        celebrationShown:
            localStorage.getItem(
                CELEBRATION_KEY
            ) === "true",

        createdAt:
            studyPlan.createdAt ||
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()
    };
}


/* =========================================================
   SYNC ACTIVE PLAN
========================================================= */

function syncActivePlanRecord() {

    if (
        !activePlanId ||
        !studyPlan
    ) {
        return;
    }


    const plans =
        getSavedPlans();


    const state =
        captureActivePlanState();


    if (!state) {
        return;
    }


    const index =
        plans.findIndex(
            plan =>
                plan.id ===
                activePlanId
        );


    if (index >= 0) {

        plans[index] =
            state;

    } else {

        plans.push(
            state
        );
    }


    saveSavedPlans(
        plans
    );
}


/* =========================================================
   MIGRATE OLD PLAN
========================================================= */

function ensurePlanRegistry() {

    let plans =
        getSavedPlans();


    let activeId =
        getActivePlanId();


    /*
       If the user already has the new registry,
       keep it.
    */

    if (
        plans.length > 0
    ) {

        const activeExists =
            plans.some(
                plan =>
                    plan.id ===
                    activeId
            );


        if (
            !activeExists
        ) {

            activeId =
                plans[0].id;

            setActivePlanId(
                activeId
            );
        }


        return plans;
    }


    /*
       Migrate the old single-plan system.
    */

    const oldPlan =
        readJSON(
            PLAN_KEY,
            null
        ) ||

        readJSON(
            COMPATIBILITY_PLAN_KEY,
            null
        );


    if (!oldPlan) {

        return [];
    }


    const normalized =
        normalizePlan(
            oldPlan
        );


    if (!normalized) {

        return [];
    }


    const id =
        createPlanId();


    const migrated = {

        id,

        title:
            getPlanDisplayTitle({
                plan: normalized
            }),

        plan:
            normalized,

        completedTopics:
            readJSON(
                COMPLETED_TOPICS_KEY,
                []
            ),

        completedQuestionTopics:
            readJSON(
                COMPLETED_QUESTIONS_KEY,
                []
            ),

        currentTopicIndex:
            Number(
                localStorage.getItem(
                    CURRENT_TOPIC_KEY
                )
            ) || 0,

        topicQuestions:
            readJSON(
                TOPIC_QUESTIONS_KEY,
                {}
            ),

        currentStudySession:
            readJSON(
                STUDY_SESSION_KEY,
                null
            ),

        topicReadings:
            readJSON(
                STUDY_READINGS_KEY,
                {}
            ),

        timerSeconds:
            Number(
                localStorage.getItem(
                    TIMER_SECONDS_KEY
                )
            ) ||
            DEFAULT_TIMER_SECONDS,

        selectedTimerSeconds:
            Number(
                localStorage.getItem(
                    TIMER_DURATION_KEY
                )
            ) ||
            DEFAULT_TIMER_SECONDS,

        celebrationShown:
            localStorage.getItem(
                CELEBRATION_KEY
            ) === "true",

        createdAt:
            normalized.createdAt ||
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()
    };


    plans = [
        migrated
    ];


    saveSavedPlans(
        plans
    );


    setActivePlanId(
        id
    );


    return plans;
}


/* =========================================================
   LOAD ACTIVE PLAN
========================================================= */

function loadStudyPlan() {

    const plans =
        ensurePlanRegistry();


    if (
        plans.length === 0
    ) {

        studyPlan = null;

        normalizedSubjects = [];

        allTopics = [];

        return null;
    }


    let id =
        getActivePlanId();


    let record =
        plans.find(
            plan =>
                plan.id ===
                id
        );


    if (!record) {

        record =
            plans[0];

        setActivePlanId(
            record.id
        );
    }


    activePlanId =
        record.id;


    studyPlan =
        normalizePlan(
            record.plan ||
            record
        );


    if (!studyPlan) {
        return null;
    }


    normalizedSubjects =
        studyPlan.subjects || [];


    allTopics =
        studyPlan.topics || [];


    completedTopics =
        Array.isArray(
            record.completedTopics
        )
            ? record.completedTopics
            : readJSON(
                COMPLETED_TOPICS_KEY,
                []
            );


    completedQuestionTopics =
        Array.isArray(
            record.completedQuestionTopics
        )
            ? record.completedQuestionTopics
            : readJSON(
                COMPLETED_QUESTIONS_KEY,
                []
            );


    currentTopicIndex =
        Number(
            record.currentTopicIndex
        );


    if (
        !Number.isInteger(
            currentTopicIndex
        )
    ) {

        currentTopicIndex =
            Number(
                localStorage.getItem(
                    CURRENT_TOPIC_KEY
                )
            ) || 0;
    }


    topicQuestions =
        record.topicQuestions &&
        typeof record.topicQuestions === "object"

            ? record.topicQuestions

            : readJSON(
                TOPIC_QUESTIONS_KEY,
                {}
            );


    currentStudySession =
        record.currentStudySession ||
        readJSON(
            STUDY_SESSION_KEY,
            null
        );


    topicReadings =
        record.topicReadings &&
        typeof record.topicReadings === "object"

            ? record.topicReadings

            : readJSON(
                STUDY_READINGS_KEY,
                {}
            );


    timerSeconds =
        Number(
            record.timerSeconds
        ) ||

        Number(
            localStorage.getItem(
                TIMER_SECONDS_KEY
            )
        ) ||

        DEFAULT_TIMER_SECONDS;


    selectedTimerSeconds =
        Number(
            record.selectedTimerSeconds
        ) ||

        Number(
            localStorage.getItem(
                TIMER_DURATION_KEY
            )
        ) ||

        DEFAULT_TIMER_SECONDS;


    if (
        !TIMER_OPTIONS.includes(
            Math.round(
                selectedTimerSeconds / 60
            )
        )
    ) {

        selectedTimerSeconds =
            DEFAULT_TIMER_SECONDS;
    }


    if (
        timerSeconds <= 0 ||
        timerSeconds >
            selectedTimerSeconds
    ) {

        timerSeconds =
            selectedTimerSeconds;
    }


    if (
        record.celebrationShown
    ) {

        localStorage.setItem(
            CELEBRATION_KEY,
            "true"
        );

    } else {

        localStorage.removeItem(
            CELEBRATION_KEY
        );
    }


    mirrorActiveStateToLegacy();


    return studyPlan;
}


/* =========================================================
   SAVE PLAN
========================================================= */

function savePlan() {

    if (!studyPlan) {
        return;
    }


    mirrorActiveStateToLegacy();

    syncActivePlanRecord();
}


/* =========================================================
   COMPLETION STATE
========================================================= */

function loadCompletionState() {

    completedTopics =
        Array.isArray(
            completedTopics
        )
            ? completedTopics
            : [];


    completedQuestionTopics =
        Array.isArray(
            completedQuestionTopics
        )
            ? completedQuestionTopics
            : [];
}


function saveCompletionState() {

    writeJSON(
        COMPLETED_TOPICS_KEY,
        completedTopics
    );


    writeJSON(
        COMPLETED_QUESTIONS_KEY,
        completedQuestionTopics
    );


    localStorage.setItem(
        CURRENT_TOPIC_KEY,
        String(currentTopicIndex)
    );


    syncActivePlanRecord();
}


/* =========================================================
   TOPIC COMPLETION
========================================================= */

function isTopicCompleted(topic) {

    if (!topic) {
        return false;
    }


    const key =
        getTopicKey(topic);


    return completedTopics.some(
        item =>
            item === key ||
            item === topic.name ||
            item === topic.id
    );
}


function markTopicCompleted(topic) {

    if (!topic) {
        return;
    }


    const key =
        getTopicKey(topic);


    if (
        !completedTopics.includes(key)
    ) {

        completedTopics.push(
            key
        );
    }
}


/* =========================================================
   CURRENT TOPIC
========================================================= */

function getCurrentTopic() {

    if (
        !allTopics ||
        allTopics.length === 0
    ) {
        return null;
    }


    if (
        currentStudySession &&
        currentStudySession.topicKey
    ) {

        const sessionTopic =
            allTopics.find(
                topic =>
                    getTopicKey(topic) ===
                    currentStudySession.topicKey
            );


        if (sessionTopic) {
            return sessionTopic;
        }
    }


    if (
        currentTopicIndex >= 0 &&
        currentTopicIndex <
            allTopics.length
    ) {

        const indexedTopic =
            allTopics[
                currentTopicIndex
            ];


        if (
            indexedTopic &&
            !isTopicCompleted(
                indexedTopic
            )
        ) {

            return indexedTopic;
        }
    }


    const firstIncomplete =
        allTopics.find(
            topic =>
                !isTopicCompleted(
                    topic
                )
        );


    return (
        firstIncomplete ||
        allTopics[
            Math.min(
                currentTopicIndex,
                allTopics.length - 1
            )
        ] ||
        null
    );
}


/* =========================================================
   STUDY SESSION
========================================================= */

function createStudySession(topic) {

    if (!topic) {
        return;
    }


    const key =
        getTopicKey(topic);


    if (
        currentStudySession &&
        currentStudySession.topicKey === key
    ) {

        return;
    }


    const saved =
        readJSON(
            STUDY_SESSION_KEY,
            null
        );


    if (
        saved &&
        saved.topicKey === key
    ) {

        currentStudySession =
            saved;

        return;
    }


    currentStudySession = {

        topicKey:
            key,

        topicId:
            topic.id,

        topicName:
            topic.name,

        subject:
            topic.subject,

        index:
            currentTopicIndex,

        lastOpened:
            new Date().toISOString(),

        readingStarted:
            false,

        readingCompleted:
            false,

        readingHTML:
            "",

        readingText:
            ""
    };


    writeJSON(
        STUDY_SESSION_KEY,
        currentStudySession
    );


    syncActivePlanRecord();
}


function saveStudySession() {

    if (
        !currentStudySession
    ) {
        return;
    }


    currentStudySession.currentTopicIndex =
        currentTopicIndex;


    currentStudySession.updatedAt =
        new Date().toISOString();


    writeJSON(
        STUDY_SESSION_KEY,
        currentStudySession
    );


    syncActivePlanRecord();
}


function loadStudySession() {

    const saved =
        readJSON(
            STUDY_SESSION_KEY,
            null
        );


    if (!saved) {
        return;
    }


    currentStudySession =
        saved;


    if (
        Number.isInteger(
            Number(
                saved.currentTopicIndex
            )
        )
    ) {

        currentTopicIndex =
            Number(
                saved.currentTopicIndex
            );
    }
}


/* =========================================================
   READING PERSISTENCE
========================================================= */

const READING_SELECTORS = [

    "#topicReading",

    "#readingContent",

    "#currentTopicReading",

    "#studyReading",

    "#readingSection",

    "#topicContent",

    "#studyContent",

    ".topic-reading",

    ".reading-content",

    ".study-reading",

    ".topic-content"
];


function findReadingElement() {

    for (
        const selector of
        READING_SELECTORS
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


function getReadingElement() {

    return findReadingElement();
}


function saveCurrentReading() {

    const element =
        getReadingElement();


    if (!element) {
        return;
    }


    const topic =
        getCurrentTopic();


    if (!topic) {
        return;
    }


    const key =
        getTopicKey(topic);


    if (!key) {
        return;
    }


    const html =
        element.innerHTML || "";


    const text =
        element.innerText ||
        element.textContent ||
        "";


    /*
       Don't replace saved reading with an empty
       DOM element while the page is still loading.
    */

    if (
        !html.trim() &&
        !text.trim()
    ) {

        return;
    }


    topicReadings[key] = {

        topicKey:
            key,

        topicName:
            topic.name,

        subject:
            topic.subject,

        readingHTML:
            html,

        readingText:
            text,

        readingSavedAt:
            new Date().toISOString(),

        readingStarted:
            true
    };


    if (
        currentStudySession
    ) {

        currentStudySession.readingStarted =
            true;

        currentStudySession.readingHTML =
            html;

        currentStudySession.readingText =
            text;

        currentStudySession.readingSavedAt =
            new Date().toISOString();
    }


    writeJSON(
        STUDY_READINGS_KEY,
        topicReadings
    );


    saveStudySession();

    syncActivePlanRecord();
}


function restoreCurrentReading() {

    const element =
        getReadingElement();


    const topic =
        getCurrentTopic();


    if (
        !element ||
        !topic
    ) {
        return false;
    }


    const key =
        getTopicKey(topic);


    const saved =
        topicReadings[key];


    if (!saved) {

        /*
           Backward compatibility with
           older session storage.
        */

        if (
            currentStudySession &&
            currentStudySession.topicKey === key &&
            currentStudySession.readingHTML
        ) {

            if (
                !element.innerHTML.trim()
            ) {

                element.innerHTML =
                    currentStudySession.readingHTML;

                return true;
            }
        }


        return false;
    }


    if (
        element.innerHTML.trim()
    ) {

        return false;
    }


    if (
        saved.readingHTML
    ) {

        element.innerHTML =
            saved.readingHTML;

        return true;
    }


    return false;
}


/* =========================================================
   READING OBSERVER
========================================================= */

function startReadingPersistence() {

    if (
        readingObserverStarted
    ) {
        return;
    }


    const element =
        getReadingElement();


    if (!element) {

        setTimeout(
            startReadingPersistence,
            500
        );

        return;
    }


    readingObserverStarted =
        true;


    restoreCurrentReading();


    readingObserver =
        new MutationObserver(
            () => {

                saveCurrentReading();
            }
        );


    readingObserver.observe(
        element,
        {
            childList: true,
            subtree: true,
            characterData: true
        }
    );


    window.addEventListener(
        "beforeunload",
        saveCurrentReading
    );


    document.addEventListener(
        "visibilitychange",
        () => {

            if (
                document.visibilityState ===
                "hidden"
            ) {

                saveCurrentReading();

                saveStudySession();

                saveCompletionState();

                saveTimerState();
            }
        }
    );
}


function restartReadingPersistence() {

    if (
        readingObserver
    ) {

        try {
            readingObserver.disconnect();
        } catch {}
    }


    readingObserver =
        null;

    readingObserverStarted =
        false;


    setTimeout(
        () => {

            restoreCurrentReading();

            startReadingPersistence();

        },
        150
    );
}


/* =========================================================
   AUTHENTICATION
========================================================= */

async function checkAuthentication() {

    try {

        let client =
            window.supabaseClient;


        /*
           Give Supabase a moment to load if its
           script is placed before dashboard.js.
        */

        for (
            let i = 0;
            i < 8 && !client;
            i++
        ) {

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        250
                    )
            );


            client =
                window.supabaseClient;
        }


        if (
            !client ||
            !client.auth
        ) {

            console.warn(
                "Supabase client not available."
            );

            return true;
        }


        const {
            data,
            error
        } =
            await client.auth.getUser();


        if (
            error ||
            !data ||
            !data.user
        ) {

            window.location.href =
                "login.html";

            return false;
        }


        currentUser =
            data.user;


        return true;

    } catch (error) {

        console.error(
            "Authentication check failed:",
            error
        );


        return true;
    }
}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutStudyMind() {

    saveCurrentReading();

    saveStudySession();

    saveCompletionState();

    saveTimerState();

    syncActivePlanRecord();


    try {

        if (
            window.supabaseClient &&
            window.supabaseClient.auth
        ) {

            await window.supabaseClient
                .auth
                .signOut();
        }

    } catch (error) {

        console.warn(
            "Logout error:",
            error
        );
    }


    localStorage.removeItem(
        "studyMindLoggedIn"
    );


    localStorage.removeItem(
        "isLoggedIn"
    );


    localStorage.removeItem(
        "currentUser"
    );


    window.location.href =
        "index.html";
}


/* =========================================================
   STATS
========================================================= */

function calculateDaysLeft() {

    if (
        !studyPlan ||
        !studyPlan.examDate
    ) {

        return 0;
    }


    const today =
        new Date();


    const exam =
        new Date(
            `${studyPlan.examDate}T23:59:59`
        );


    const difference =
        exam.getTime() -
        today.getTime();


    return Math.max(
        0,
        Math.ceil(
            difference /
            86400000
        )
    );
}


function getProgressPercentage() {

    if (
        allTopics.length === 0
    ) {

        return 0;
    }


    const completed =
        allTopics.filter(
            topic =>
                isTopicCompleted(
                    topic
                )
        ).length;


    return Math.round(
        (
            completed /
            allTopics.length
        ) * 100
    );
}


function renderStats() {

    const weeklyHours =
        $("weeklyHours");

    const daysLeft =
        $("daysLeft");

    const dailyGoal =
        $("dailyGoal");

    const studyScore =
        $("studyScore");

    const streak =
        $("streak");


    const hours =
        Number(
            studyPlan &&
            studyPlan.studyHours
        ) || 1;


    const progress =
        getProgressPercentage();


    const currentStreak =
        Number(
            localStorage.getItem(
                STREAK_KEY
            )
        ) || 0;


    if (weeklyHours) {

        weeklyHours.textContent =
            `${hours * 7}h`;
    }


    if (daysLeft) {

        daysLeft.textContent =
            String(
                calculateDaysLeft()
            );
    }


    if (dailyGoal) {

        dailyGoal.textContent =
            `${hours}h`;
    }


    if (studyScore) {

        studyScore.textContent =
            `${progress}%`;
    }


    if (streak) {

        streak.textContent =
            String(
                currentStreak
            );
    }


    const scoreDisplay =
        $("scoreDisplay");


    const scoreProgressBar =
        $("scoreProgressBar");


    const scoreMessage =
        $("scoreMessage");


    if (scoreDisplay) {

        scoreDisplay.textContent =
            `${progress}%`;
    }


    if (scoreProgressBar) {

        scoreProgressBar.style.width =
            `${progress}%`;
    }


    if (scoreMessage) {

        if (progress >= 100) {

            scoreMessage.textContent =
                "🎉 Excellent work! You completed your study plan.";

        } else if (progress >= 75) {

            scoreMessage.textContent =
                "🔥 You're making excellent progress.";

        } else if (progress >= 50) {

            scoreMessage.textContent =
                "💪 Keep going. You're over halfway there.";

        } else if (progress > 0) {

            scoreMessage.textContent =
                "📚 Good start. Stay consistent.";

        } else {

            scoreMessage.textContent =
                "🚀 Complete your first topic to start building progress.";
        }
    }
}


/* =========================================================
   SUBJECTS
========================================================= */

function renderSubjects() {

    const container =
        $("subjectList");


    if (!container) {
        return;
    }


    if (
        normalizedSubjects.length === 0
    ) {

        const uniqueSubjects =
            [
                ...new Set(
                    allTopics
                        .map(
                            topic =>
                                cleanText(
                                    topic.subject
                                )
                        )
                        .filter(Boolean)
                )
            ];


        normalizedSubjects =
            uniqueSubjects.map(
                name => ({

                    name,

                    topics: []
                })
            );
    }


    if (
        normalizedSubjects.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-schedule">
                No subjects found.
            </div>
        `;

        return;
    }


    container.innerHTML =

        normalizedSubjects

            .map(
                subject => {

                    const topics =
                        allTopics.filter(
                            topic =>

                                cleanText(
                                    topic.subject
                                ).toLowerCase() ===

                                cleanText(
                                    subject.name
                                ).toLowerCase()
                        );


                    const completed =
                        topics.filter(
                            topic =>
                                isTopicCompleted(
                                    topic
                                )
                        ).length;


                    const percentage =
                        topics.length
                            ? Math.round(
                                (
                                    completed /
                                    topics.length
                                ) * 100
                            )
                            : 0;


                    return `

                        <div
                            class="subject-item"
                            style="
                                padding:14px 0;
                                border-bottom:1px solid rgba(127,127,127,.12);
                            "
                        >

                            <div
                                style="
                                    display:flex;
                                    justify-content:space-between;
                                    align-items:center;
                                    gap:12px;
                                "
                            >

                                <div>

                                    <strong>
                                        ${escapeHTML(
                                            subject.name
                                        )}
                                    </strong>

                                    <small
                                        style="
                                            display:block;
                                            opacity:.7;
                                            margin-top:4px;
                                        "
                                    >
                                        ${topics.length}
                                        topic${topics.length === 1 ? "" : "s"}
                                        •
                                        ${percentage}% complete
                                    </small>

                                </div>

                                <span>
                                    📚
                                </span>

                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}


/* =========================================================
   TOPICS
========================================================= */

function renderTopics() {

    const container =
        $("topicList");


    if (!container) {
        return;
    }


    if (
        allTopics.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-schedule">
                No topics found.
            </div>
        `;

        return;
    }


    container.innerHTML =

        allTopics

            .map(
                (topic, index) => {

                    const completed =
                        isTopicCompleted(
                            topic
                        );


                    const active =
                        index ===
                        currentTopicIndex;


                    return `

                        <div
                            class="topic-item"
                            data-topic-index="${index}"
                            style="
                                cursor:pointer;
                                padding:14px;
                                margin-bottom:10px;
                                border-radius:14px;
                                border:1px solid rgba(127,127,127,.16);
                                ${active
                                    ? "outline:2px solid rgba(59,130,246,.45);"
                                    : ""
                                }
                                ${completed
                                    ? "opacity:.72;"
                                    : ""
                                }
                            "
                        >

                            <div
                                style="
                                    display:flex;
                                    justify-content:space-between;
                                    align-items:center;
                                    gap:12px;
                                "
                            >

                                <div>

                                    <strong>
                                        ${escapeHTML(
                                            topic.name
                                        )}
                                    </strong>

                                    <small
                                        style="
                                            display:block;
                                            opacity:.7;
                                            margin-top:3px;
                                        "
                                    >
                                        ${escapeHTML(
                                            topic.subject ||
                                            "Study Topic"
                                        )}
                                    </small>

                                </div>

                                <span>
                                    ${
                                        completed
                                            ? "✓"
                                            : active
                                                ? "Current"
                                                : index + 1
                                    }
                                </span>

                            </div>

                        </div>
                    `;
                }
            )
            .join("");


    container
        .querySelectorAll(
            "[data-topic-index]"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    () => {

                        const index =
                            Number(
                                element.dataset.topicIndex
                            );


                        if (
                            !Number.isInteger(
                                index
                            )
                        ) {
                            return;
                        }


                        saveCurrentReading();

                        currentTopicIndex =
                            index;


                        const topic =
                            allTopics[
                                index
                            ];


                        createStudySession(
                            topic
                        );


                        saveCompletionState();

                        renderDashboard();

                        restartReadingPersistence();


                        window.scrollTo({
                            top: 0,
                            behavior: "smooth"
                        });
                    }
                );
            }
        );
}


/* =========================================================
   CURRENT TOPIC
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


    const statusElement =
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
                "Study Plan Complete";
        }


        if (descriptionElement) {

            descriptionElement.textContent =
                "You have completed all topics in this study plan.";
        }


        if (statusElement) {

            statusElement.textContent =
                "COMPLETED";
        }


        if (checkbox) {

            checkbox.checked =
                true;

            checkbox.disabled =
                true;
        }


        if (completionMessage) {

            completionMessage.textContent =
                "🎉 All topics completed!";
        }


        return;
    }


    createStudySession(
        topic
    );


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
            `TOPIC ${currentTopicIndex + 1} OF ${allTopics.length}`;
    }


    if (statusElement) {

        statusElement.textContent =
            completed
                ? "COMPLETED"
                : "IN PROGRESS";
    }


    if (checkbox) {

        checkbox.checked =
            completed;

        checkbox.disabled =
            completed;
    }


    if (completionMessage) {

        completionMessage.textContent =
            completed
                ? "✓ Topic completed."
                : "Complete your reading before moving to the knowledge check.";
    }


    if (nextMessage) {

        const next =
            allTopics
                .slice(
                    currentTopicIndex + 1
                )
                .find(
                    item =>
                        !isTopicCompleted(
                            item
                        )
                );


        nextMessage.textContent =
            next
                ? `Next: ${next.name}`
                : "This is your final topic.";
    }


    setTimeout(
        restoreCurrentReading,
        150
    );
}


/* =========================================================
   COMPLETE CURRENT TOPIC
========================================================= */

function completeCurrentTopic() {

    const topic =
        getCurrentTopic();


    if (!topic) {
        return;
    }


    if (
        isTopicCompleted(
            topic
        )
    ) {
        return;
    }


    /*
       Save reading before moving away.
    */

    saveCurrentReading();


    const key =
        getTopicKey(topic);


    markTopicCompleted(
        topic
    );


    if (
        currentStudySession
    ) {

        currentStudySession.readingCompleted =
            true;

        currentStudySession.completedAt =
            new Date().toISOString();
    }


    /*
       Study streak only changes when the
       student actually completes reading/topic.
    */

    if (
        typeof window.registerStudyCompletion ===
        "function"
    ) {

        try {

            window.registerStudyCompletion();

        } catch (error) {

            console.warn(
                "Study streak registration failed:",
                error
            );
        }

    } else {

        localStorage.setItem(
            LAST_STUDY_DATE_KEY,
            new Date()
                .toISOString()
                .split("T")[0]
        );
    }


    saveCompletionState();


    stopTimer();


    const nextIndex =
        allTopics.findIndex(
            (item, index) =>

                index >
                    currentTopicIndex &&

                !isTopicCompleted(
                    item
                )
        );


    if (
        nextIndex >= 0
    ) {

        currentTopicIndex =
            nextIndex;


        currentStudySession = {

            topicKey:
                getTopicKey(
                    allTopics[
                        nextIndex
                    ]
                ),

            topicId:
                allTopics[
                    nextIndex
                ].id,

            topicName:
                allTopics[
                    nextIndex
                ].name,

            subject:
                allTopics[
                    nextIndex
                ].subject,

            index:
                nextIndex,

            lastOpened:
                new Date().toISOString(),

            readingStarted:
                false,

            readingCompleted:
                false,

            readingHTML:
                "",

            readingText:
                ""
        };

    } else {

        currentTopicIndex =
            Math.min(
                currentTopicIndex + 1,
                allTopics.length - 1
            );


        currentStudySession = {

            topicKey:
                key,

            topicId:
                topic.id,

            topicName:
                topic.name,

            subject:
                topic.subject,

            index:
                currentTopicIndex,

            readingStarted:
                true,

            readingCompleted:
                true,

            completedAt:
                new Date().toISOString()
        };
    }


    saveCompletionState();

    saveStudySession();

    syncActivePlanRecord();

    renderDashboard();

    restartReadingPersistence();


    /*
       Knowledge check is for the topic that
       was just completed.
    */

    openKnowledgeCheckPage(
        topic
    );
}


/* =========================================================
   KNOWLEDGE CHECK REDIRECT
========================================================= */

function openKnowledgeCheckPage(topic) {

    if (!topic) {
        return;
    }


    const today =
        new Date()
            .toISOString()
            .split("T")[0];


    const storedDate =
        localStorage.getItem(
            AI_QUESTION_DATE_KEY
        );


    let count =
        Number(
            localStorage.getItem(
                "studyMindKnowledgeCheckCount"
            )
        ) || 0;


    if (
        storedDate !== today
    ) {

        count = 0;

        localStorage.setItem(
            AI_QUESTION_DATE_KEY,
            today
        );
    }


    /*
       Knowledge checks remain available
       for the normal dashboard flow.
    */

    const payload = {

        id:
            topic.id,

        key:
            getTopicKey(topic),

        name:
            topic.name,

        title:
            topic.name,

        subject:
            topic.subject,

        description:
            topic.description,

        checkId:
            `check-${slugify(
                getTopicKey(topic)
            )}`
    };


    writeJSON(
        KNOWLEDGE_TOPIC_KEY,
        payload
    );


    /*
       Keep compatibility with pages that
       expect the question object.
    */

    writeJSON(
        TOPIC_QUESTIONS_KEY,
        topicQuestions
    );


    window.location.href =
        "knowledge-check.html";
}


/* =========================================================
   DAILY CHALLENGE
========================================================= */

function renderDailyChallenge() {

    const progressElement =
        $("dailyChallengeProgress");


    const progressBar =
        $("dailyChallengeProgressBar");


    const title =
        $("dailyChallengeTitle");


    const description =
        $("dailyChallengeDescription");


    const button =
        $("dailyChallengeButton");


    const topic =
        getCurrentTopic();


    if (!topic) {

        if (title) {

            title.textContent =
                "🏆 Study Plan Complete";
        }


        if (description) {

            description.textContent =
                "You have completed all available topics.";
        }


        if (progressElement) {

            progressElement.textContent =
                "100%";
        }


        if (progressBar) {

            progressBar.style.width =
                "100%";
        }


        if (button) {

            button.disabled =
                true;

            button.textContent =
                "✓ Complete";
        }


        return;
    }


    const completed =
        isTopicCompleted(
            topic
        );


    if (title) {

        title.textContent =
            completed
                ? "🧠 Complete Your Knowledge Check"
                : "📚 Study Your Current Topic";
    }


    if (description) {

        description.textContent =
            completed

                ? `Test yourself on ${topic.name}.`

                : `Study ${topic.name} using the timer, then complete the knowledge check.`;
    }


    const progress =
        completed
            ? 50
            : 0;


    if (progressElement) {

        progressElement.textContent =
            `${progress}%`;
    }


    if (progressBar) {

        progressBar.style.width =
            `${progress}%`;
    }


    if (button) {

        button.disabled =
            false;

        button.textContent =
            completed
                ? "🧠 Open Knowledge Check"
                : "🚀 Start Challenge";
    }
}


function handleDailyChallenge() {

    const topic =
        getCurrentTopic();


    if (!topic) {
        return;
    }


    if (
        isTopicCompleted(
            topic
        )
    ) {

        window.location.href =
            "knowledge-check.html";

        return;
    }


    const timer =
        $("studyTimer");


    if (timer) {

        timer.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }


    startTimer();
}


/* =========================================================
   STREAK DISPLAY
========================================================= */

function renderStreak() {

    const element =
        $("streak");


    if (!element) {
        return;
    }


    const value =
        Number(
            localStorage.getItem(
                STREAK_KEY
            )
        ) || 0;


    element.textContent =
        String(value);
}


/* =========================================================
   TIMER
========================================================= */

function formatTimer(seconds) {

    const safe =
        Math.max(
            0,
            Number(seconds) || 0
        );


    const minutes =
        Math.floor(
            safe / 60
        );


    const remaining =
        safe % 60;


    return (

        String(minutes)
            .padStart(2, "0")

        +

        ":"

        +

        String(remaining)
            .padStart(2, "0")
    );
}


function renderTimer() {

    const element =
        $("studyTimer");


    if (!element) {
        return;
    }


    element.textContent =
        formatTimer(
            timerSeconds
        );


    const select =
        $("timerDuration") ||
        $("studyTimerDuration") ||
        $("timerMinutes") ||
        $("studyTime");


    if (select) {

        const minutes =
            Math.round(
                selectedTimerSeconds /
                60
            );


        const matching =
            [...select.options]
                .find(
                    option =>
                        Number(
                            option.value
                        ) === minutes
                );


        if (matching) {

            select.value =
                String(minutes);
        }
    }


    const startButton =
        $("startTimerButton");


    const pauseButton =
        $("pauseTimerButton");


    if (startButton) {

        startButton.disabled =
            timerRunning ||
            timerSeconds <= 0;
    }


    if (pauseButton) {

        pauseButton.disabled =
            !timerRunning;
    }
}


function saveTimerState() {

    localStorage.setItem(
        TIMER_SECONDS_KEY,
        String(timerSeconds)
    );


    localStorage.setItem(
        TIMER_DURATION_KEY,
        String(selectedTimerSeconds)
    );


    localStorage.setItem(
        TIMER_RUNNING_KEY,
        timerRunning
            ? "true"
            : "false"
    );


    if (
        timerRunning &&
        timerInterval
    ) {

        localStorage.setItem(
            TIMER_END_TIME_KEY,
            String(
                Date.now() +
                timerSeconds * 1000
            )
        );
    }


    syncActivePlanRecord();
}


function startTimer() {

    if (timerRunning) {
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


    const endTime =
        Date.now() +
        timerSeconds * 1000;


    localStorage.setItem(
        TIMER_END_TIME_KEY,
        String(endTime)
    );


    localStorage.setItem(
        TIMER_RUNNING_KEY,
        "true"
    );


    clearInterval(
        timerInterval
    );


    timerInterval =
        setInterval(
            () => {

                const remaining =
                    Math.ceil(
                        (
                            endTime -
                            Date.now()
                        ) / 1000
                    );


                timerSeconds =
                    Math.max(
                        0,
                        remaining
                    );


                renderTimer();

                saveTimerState();


                if (
                    timerSeconds <= 0
                ) {

                    stopTimer();

                    timerSeconds =
                        0;

                    renderTimer();

                    showTimerFinished();
                }

            },
            250
        );


    renderTimer();
}


function pauseTimer() {

    if (!timerRunning) {
        return;
    }


    clearInterval(
        timerInterval
    );


    timerInterval =
        null;


    timerRunning =
        false;


    localStorage.setItem(
        TIMER_RUNNING_KEY,
        "false"
    );


    saveTimerState();

    renderTimer();
}


function stopTimer() {

    clearInterval(
        timerInterval
    );


    timerInterval =
        null;


    timerRunning =
        false;


    localStorage.setItem(
        TIMER_RUNNING_KEY,
        "false"
    );


    saveTimerState();

    renderTimer();
}


function resetTimer() {

    stopTimer();


    timerSeconds =
        selectedTimerSeconds;


    saveTimerState();

    renderTimer();
}


function changeTimerDuration(value) {

    const minutes =
        Number(value);


    if (
        !TIMER_OPTIONS.includes(
            minutes
        )
    ) {
        return;
    }


    stopTimer();


    selectedTimerSeconds =
        minutes * 60;


    timerSeconds =
        selectedTimerSeconds;


    saveTimerState();

    renderTimer();
}


function showTimerFinished() {

    try {

        if (
            "Notification" in window &&
            Notification.permission ===
                "granted"
        ) {

            new Notification(
                "StudyMind AI",
                {
                    body:
                        "Your study timer has finished. Great work!"
                }
            );
        }

    } catch {}
}


/* =========================================================
   CALENDAR COLORS
   IMPORTANT:
   These styles are intentionally injected by
   dashboard.js so the calendar colors do not
   depend on style.css.
========================================================= */

function ensureCalendarStyles() {

    if (
        document.getElementById(
            "studyMindCalendarColors"
        )
    ) {
        return;
    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "studyMindCalendarColors";


    style.textContent = `

        /* ================================
           STUDYMIND CALENDAR COLORS
        ================================= */

        .calendar-day.study-day {
            background:
                rgba(34, 197, 94, 0.20) !important;

            border:
                1px solid
                rgba(34, 197, 94, 0.55) !important;

            color:
                #166534 !important;
        }


        .calendar-day.rest-day {
            background:
                rgba(245, 158, 11, 0.22) !important;

            border:
                1px solid
                rgba(245, 158, 11, 0.55) !important;

            color:
                #92400e !important;
        }


        .calendar-day.exam-day {
            background:
                rgba(239, 68, 68, 0.25) !important;

            border:
                2px solid
                rgba(239, 68, 68, 0.75) !important;

            color:
                #991b1b !important;

            font-weight:
                800 !important;
        }


        .calendar-day.after-exam {
            background:
                rgba(148, 163, 184, 0.15) !important;

            border:
                1px solid
                rgba(148, 163, 184, 0.30) !important;

            color:
                #64748b !important;

            opacity:
                0.70 !important;
        }


        .calendar-day.today {
            box-shadow:
                inset 0 0 0 3px
                rgba(59, 130, 246, 0.90) !important;

            position:
                relative !important;

            font-weight:
                800 !important;
        }


        /* DARK MODE */

        body.dark-mode
        .calendar-day.study-day,

        .dark-mode
        .calendar-day.study-day {

            background:
                rgba(34, 197, 94, 0.24) !important;

            color:
                #bbf7d0 !important;
        }


        body.dark-mode
        .calendar-day.rest-day,

        .dark-mode
        .calendar-day.rest-day {

            background:
                rgba(245, 158, 11, 0.24) !important;

            color:
                #fde68a !important;
        }


        body.dark-mode
        .calendar-day.exam-day,

        .dark-mode
        .calendar-day.exam-day {

            background:
                rgba(239, 68, 68, 0.28) !important;

            color:
                #fecaca !important;
        }


        body.dark-mode
        .calendar-day.after-exam,

        .dark-mode
        .calendar-day.after-exam {

            background:
                rgba(148, 163, 184, 0.16) !important;

            color:
                #cbd5e1 !important;
        }


        body.dark-mode
        .calendar-day.today,

        .dark-mode
        .calendar-day.today {

            box-shadow:
                inset 0 0 0 3px
                rgba(96, 165, 250, 0.95) !important;
        }


        /* HOVER */

        .calendar-day.study-day:hover,
        .calendar-day.rest-day:hover,
        .calendar-day.exam-day:hover,
        .calendar-day.after-exam:hover {

            transform:
                translateY(-1px);

            filter:
                brightness(1.08);

            transition:
                0.15s ease;
        }


        /* CALENDAR LEGEND */

        .studyMind-calendar-legend {

            display:
                flex;

            flex-wrap:
                wrap;

            gap:
                10px 16px;

            margin-top:
                14px;

            font-size:
                0.82rem;

            opacity:
                0.9;
        }


        .studyMind-calendar-legend span {

            display:
                inline-flex;

            align-items:
                center;

            gap:
                6px;
        }


        .studyMind-calendar-legend i {

            width:
                11px;

            height:
                11px;

            border-radius:
                4px;

            display:
                inline-block;
        }


        .studyMind-legend-study {
            background:
                #22c55e;
        }


        .studyMind-legend-rest {
            background:
                #f59e0b;
        }


        .studyMind-legend-exam {
            background:
                #ef4444;
        }


        .studyMind-legend-after {
            background:
                #94a3b8;
        }


        .studyMind-legend-today {
            background:
                #3b82f6;
        }

    `;


    document.head.appendChild(
        style
    );
}


/* =========================================================
   CALENDAR
========================================================= */

function dateKey(date) {

    return (

        date.getFullYear() +

        "-" +

        String(
            date.getMonth() + 1
        ).padStart(2, "0") +

        "-" +

        String(
            date.getDate()
        ).padStart(2, "0")
    );
}


function isSameDate(
    first,
    second
) {

    return (
        first.getFullYear() ===
            second.getFullYear() &&

        first.getMonth() ===
            second.getMonth() &&

        first.getDate() ===
            second.getDate()
    );
}


function isWeekend(date) {

    const day =
        date.getDay();


    return (
        day === 0 ||
        day === 6
    );
}


function renderCalendar() {

    ensureCalendarStyles();


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
        currentCalendarDate
            .getFullYear();


    const month =
        currentCalendarDate
            .getMonth();


    const monthName =
        currentCalendarDate
            .toLocaleDateString(
                undefined,
                {
                    month: "long",
                    year: "numeric"
                }
            );


    monthElement.textContent =
        monthName;


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


    const startDay =
        firstDay.getDay();


    const totalDays =
        lastDay.getDate();


    const today =
        new Date();


    const examDate =
        studyPlan &&
        studyPlan.examDate
            ? new Date(
                `${studyPlan.examDate}T00:00:00`
            )
            : null;


    daysContainer.innerHTML =
        "";


    /*
       Empty cells before month begins.
    */

    for (
        let i = 0;
        i < startDay;
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
        day <= totalDays;
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


        /*
           TODAY
           Blue outline
        */

        if (
            isSameDate(
                date,
                today
            )
        ) {

            cell.classList.add(
                "today"
            );
        }


        /*
           EXAM DAY
           Red
        */

        if (
            examDate &&
            isSameDate(
                date,
                examDate
            )
        ) {

            cell.classList.add(
                "exam-day"
            );
        }


        /*
           DAYS AFTER EXAM
           Gray
        */

        if (
            examDate &&
            date > examDate
        ) {

            cell.classList.add(
                "after-exam"
            );
        }


        /*
           STUDY / REST DAYS
           Only before or on exam date.
        */

        if (
            !(
                examDate &&
                date > examDate
            ) &&
            !(
                examDate &&
                isSameDate(
                    date,
                    examDate
                )
            )
        ) {

            if (
                isWeekend(date)
            ) {

                cell.classList.add(
                    "rest-day"
                );

            } else {

                cell.classList.add(
                    "study-day"
                );
            }
        }


        daysContainer.appendChild(
            cell
        );
    }


    /*
       Add the legend once.
    */

    const calendarParent =
        daysContainer.parentElement;


    if (
        calendarParent &&
        !calendarParent.querySelector(
            ".studyMind-calendar-legend"
        )
    ) {

        const legend =
            document.createElement(
                "div"
            );


        legend.className =
            "studyMind-calendar-legend";


        legend.innerHTML = `

            <span>
                <i class="studyMind-legend-study"></i>
                Study
            </span>

            <span>
                <i class="studyMind-legend-rest"></i>
                Rest
            </span>

            <span>
                <i class="studyMind-legend-exam"></i>
                Exam
            </span>

            <span>
                <i class="studyMind-legend-after"></i>
                After exam
            </span>

            <span>
                <i class="studyMind-legend-today"></i>
                Today
            </span>

        `;


        calendarParent.appendChild(
            legend
        );
    }
}


function previousMonth() {

    currentCalendarDate =
        new Date(
            currentCalendarDate
                .getFullYear(),

            currentCalendarDate
                .getMonth() - 1,

            1
        );


    renderCalendar();
}


function nextMonth() {

    currentCalendarDate =
        new Date(
            currentCalendarDate
                .getFullYear(),

            currentCalendarDate
                .getMonth() + 1,

            1
        );


    renderCalendar();
}


/* =========================================================
   SCHEDULE
========================================================= */

function formatClock(time) {

    if (!time) {
        return "4:00 PM";
    }


    const parts =
        String(time)
            .split(":");


    if (
        parts.length < 2
    ) {

        return time;
    }


    let hour =
        Number(parts[0]);


    const minute =
        Number(parts[1]);


    const suffix =
        hour >= 12
            ? "PM"
            : "AM";


    hour =
        hour % 12 ||
        12;


    return (

        `${hour}:` +

        `${String(
            minute
        ).padStart(2, "0")} ` +

        suffix
    );
}


function renderSchedule() {

    const container =
        $("scheduleList");


    if (!container) {
        return;
    }


    const hours =
        Number(
            studyPlan &&
            studyPlan.studyHours
        ) || 1;


    const startTime =
        studyPlan &&
        studyPlan.startTime
            ? studyPlan.startTime
            : "16:00";


    const topic =
        getCurrentTopic();


    if (!topic) {

        container.innerHTML = `

            <div class="empty-schedule">
                Your study plan is complete 🎉
            </div>
        `;

        return;
    }


    container.innerHTML = `

        <div
            class="schedule-item"
            style="
                padding:14px;
                border-radius:14px;
                margin-bottom:10px;
                border:1px solid rgba(127,127,127,.15);
            "
        >

            <strong>
                📚 ${escapeHTML(
                    topic.name
                )}
            </strong>

            <small
                style="
                    display:block;
                    margin-top:5px;
                    opacity:.7;
                "
            >
                ${escapeHTML(
                    topic.subject ||
                    "Study"
                )}

                •

                ${formatClock(
                    startTime
                )}

                •

                ${hours} hour${hours === 1 ? "" : "s"}
            </small>

        </div>
    `;
}


function renderNextSession() {

    const nextBooking =
        $("nextBooking");


    const nextBookingTime =
        $("nextBookingTime");


    const topic =
        getCurrentTopic();


    if (!topic) {

        if (nextBooking) {

            nextBooking.textContent =
                "Study Plan Complete";
        }


        if (nextBookingTime) {

            nextBookingTime.textContent =
                "🎉 Great work!";
        }


        return;
    }


    if (nextBooking) {

        nextBooking.textContent =
            topic.name;
    }


    if (nextBookingTime) {

        nextBookingTime.textContent =
            formatClock(
                studyPlan &&
                studyPlan.startTime
                    ? studyPlan.startTime
                    : "16:00"
            );
    }
}


/* =========================================================
   PROGRESS
========================================================= */

function renderProgress() {

    const percentage =
        getProgressPercentage();


    const count =
        allTopics.filter(
            topic =>
                isTopicCompleted(
                    topic
                )
        ).length;


    const progressPercent =
        $("progressPercent");


    const progressCount =
        $("progressCount");


    const progressBar =
        $("progressBar");


    if (progressPercent) {

        progressPercent.textContent =
            `${percentage}%`;
    }


    if (progressCount) {

        progressCount.textContent =
            `${count} / ${allTopics.length}`;
    }


    if (progressBar) {

        progressBar.style.width =
            `${percentage}%`;
    }
}


/* =========================================================
   COMPLETION CELEBRATION
========================================================= */

function maybeShowCompletionCelebration() {

    if (
        allTopics.length === 0
    ) {
        return;
    }


    const complete =
        allTopics.every(
            topic =>
                isTopicCompleted(
                    topic
                )
        );


    if (!complete) {
        return;
    }


    if (
        localStorage.getItem(
            CELEBRATION_KEY
        ) === "true"
    ) {
        return;
    }


    localStorage.setItem(
        CELEBRATION_KEY,
        "true"
    );


    syncActivePlanRecord();


    const overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "studyMindCompletionOverlay";


    overlay.innerHTML = `

        <div
            style="
                position:fixed;
                inset:0;
                z-index:99999;
                display:flex;
                align-items:center;
                justify-content:center;
                background:rgba(0,0,0,.65);
                padding:20px;
            "
        >

            <div
                style="
                    max-width:520px;
                    width:100%;
                    padding:35px;
                    border-radius:24px;
                    text-align:center;
                    background:var(--card-bg,#111827);
                    color:inherit;
                    box-shadow:0 25px 70px rgba(0,0,0,.35);
                "
            >

                <div
                    style="
                        font-size:54px;
                        margin-bottom:12px;
                    "
                >
                    🎉
                </div>

                <h2>
                    Study Plan Complete!
                </h2>

                <p>
                    Amazing work. You've completed
                    every topic in this study plan.
                </p>

                <button
                    id="closeStudyMindCelebration"
                    class="primary-button"
                    style="
                        margin-top:15px;
                    "
                >
                    Continue
                </button>

            </div>

        </div>
    `;


    document.body.appendChild(
        overlay
    );


    const close =
        $("closeStudyMindCelebration");


    if (close) {

        close.addEventListener(
            "click",
            () => {

                overlay.remove();
            }
        );
    }
}


/* =========================================================
   AI QUESTION LIMIT
========================================================= */

function getAIQuestionCount() {

    const today =
        new Date()
            .toISOString()
            .split("T")[0];


    const savedDate =
        localStorage.getItem(
            AI_QUESTION_DATE_KEY
        );


    if (
        savedDate !== today
    ) {

        return 0;
    }


    return Number(
        localStorage.getItem(
            AI_QUESTION_COUNT_KEY
        )
    ) || 0;
}


function recordAIQuestion() {

    const today =
        new Date()
            .toISOString()
            .split("T")[0];


    const savedDate =
        localStorage.getItem(
            AI_QUESTION_DATE_KEY
        );


    let count = 0;


    if (
        savedDate === today
    ) {

        count =
            Number(
                localStorage.getItem(
                    AI_QUESTION_COUNT_KEY
                )
            ) || 0;
    }


    count += 1;


    localStorage.setItem(
        AI_QUESTION_DATE_KEY,
        today
    );


    localStorage.setItem(
        AI_QUESTION_COUNT_KEY,
        String(count)
    );


    updateAIButton();
}


function getRemainingAIQuestions() {

    return Math.max(
        0,
        FREE_QUESTION_LIMIT -
        getAIQuestionCount()
    );
}


function hasFreeAIQuestionsLeft() {

    return (
        getAIQuestionCount() <
        FREE_QUESTION_LIMIT
    );
}


function updateAIButton() {

    const button =
        $("askAIButton");


    if (!button) {
        return;
    }


    const remaining =
        getRemainingAIQuestions();


    if (
        remaining <= 0
    ) {

        button.disabled =
            true;

        button.textContent =
            "🔒 Free Limit Reached";

    } else {

        button.disabled =
            false;

        button.textContent =
            "🤖 Ask AI";
    }
}


/* =========================================================
   PREMIUM MESSAGE
========================================================= */

function showPremiumMessage() {

    const existing =
        $("studyMindPremiumModal");


    if (existing) {

        existing.remove();
    }


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "studyMindPremiumModal";


    modal.innerHTML = `

        <div
            style="
                position:fixed;
                inset:0;
                z-index:99998;
                display:flex;
                align-items:center;
                justify-content:center;
                background:rgba(0,0,0,.65);
                padding:20px;
            "
        >

            <div
                style="
                    width:100%;
                    max-width:480px;
                    padding:30px;
                    border-radius:22px;
                    background:var(--card-bg,#111827);
                    color:inherit;
                    text-align:center;
                    box-shadow:0 25px 70px rgba(0,0,0,.35);
                "
            >

                <div
                    style="
                        font-size:42px;
                    "
                >
                    💎
                </div>

                <h2>
                    Free AI Limit Reached
                </h2>

                <p>
                    You've used your 5 free AI
                    questions for today.
                </p>

                <p>
                    Premium can give you more
                    AI-powered study assistance.
                </p>

                <button
                    id="closePremiumModal"
                    class="primary-button"
                >
                    Continue
                </button>

            </div>

        </div>
    `;


    document.body.appendChild(
        modal
    );


    const close =
        $("closePremiumModal");


    if (close) {

        close.addEventListener(
            "click",
            () => {

                modal.remove();
            }
        );
    }
}


/* =========================================================
   ASK AI
========================================================= */

async function askAI() {

    const input =
        $("aiQuestion");


    const responseElement =
        $("aiResponse");


    const button =
        $("askAIButton");


    if (!input) {
        return;
    }


    const question =
        input.value.trim();


    if (!question) {

        if (responseElement) {

            responseElement.textContent =
                "Please enter a question first.";
        }

        return;
    }


    if (
        !hasFreeAIQuestionsLeft()
    ) {

        showPremiumMessage();

        return;
    }


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "⏳ Thinking...";
    }


    if (responseElement) {

        responseElement.textContent =
            "StudyMind AI is thinking...";
    }


    try {

        const controller =
            new AbortController();


        const timeout =
            setTimeout(
                () =>
                    controller.abort(),
                QUESTION_REQUEST_TIMEOUT
            );


        const topic =
            getCurrentTopic();


        const progress =
            getProgressPercentage();


        const result =
            await fetch(
                "/api/chat",
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            message: `

You are StudyMind AI.

Help a student with this question.

Student question:
${question}

Current study topic:
${topic ? topic.name : "None"}

Current subject:
${topic ? topic.subject : "None"}

Study plan progress:
${progress}%

Exam date:
${studyPlan && studyPlan.examDate
    ? studyPlan.examDate
    : "Not set"}

Give a clear, educational answer.
Use simple explanations where appropriate.
Do not make up facts.
                            `
                        }),

                    signal:
                        controller.signal
                }
            );


        clearTimeout(
            timeout
        );


        if (!result.ok) {

            throw new Error(
                "AI request failed."
            );
        }


        const data =
            await result.json();


        const answer =
            data.answer ||
            data.response ||
            data.message ||
            data.reply;


        if (!answer) {

            throw new Error(
                "The AI returned an empty response."
            );
        }


        if (responseElement) {

            responseElement.textContent =
                answer;
        }


        recordAIQuestion();


    } catch (error) {

        console.error(
            "StudyMind AI error:",
            error
        );


        if (responseElement) {

            responseElement.textContent =
                error.name === "AbortError"

                    ? "The AI request took too long. Please try again."

                    : "Sorry, I couldn't connect to StudyMind AI right now. Please try again.";
        }

    } finally {

        updateAIButton();
    }
}


/* =========================================================
   THEME
========================================================= */

function initializeTheme() {

    const saved =
        localStorage.getItem(
            THEME_KEY
        );


    if (
        saved === "light"
    ) {

        document.body.classList.remove(
            "dark-mode"
        );

        document.documentElement.classList.remove(
            "dark-mode"
        );

    } else {

        document.body.classList.add(
            "dark-mode"
        );

        document.documentElement.classList.add(
            "dark-mode"
        );
    }


    updateThemeButton();
}


function updateThemeButton() {

    const button =
        $("themeButton");


    if (!button) {
        return;
    }


    const dark =
        document.body.classList.contains(
            "dark-mode"
        );


    button.textContent =
        dark
            ? "☀️ Light Mode"
            : "🌙 Dark Mode";
}


function toggleTheme() {

    const dark =
        document.body.classList.toggle(
            "dark-mode"
        );


    document.documentElement.classList.toggle(
        "dark-mode",
        dark
    );


    localStorage.setItem(
        THEME_KEY,
        dark
            ? "dark"
            : "light"
    );


    updateThemeButton();

    ensureCalendarStyles();

    renderCalendar();
}


/* =========================================================
   MY PLANS UI
========================================================= */

function ensurePlansUI() {

    if (
        $("studyMindPlansButton")
    ) {
        return;
    }


    const button =
        document.createElement(
            "button"
        );


    button.id =
        "studyMindPlansButton";


    button.type =
        "button";


    button.textContent =
        "📚 My Plans";


    button.style.cssText = `

        position:fixed;

        top:20px;

        right:20px;

        z-index:9000;

        border:0;

        border-radius:14px;

        padding:11px 16px;

        cursor:pointer;

        font-weight:700;

        background:#2563eb;

        color:white;

        box-shadow:
            0 8px 24px
            rgba(37,99,235,.25);

    `;


    document.body.appendChild(
        button
    );


    button.addEventListener(
        "click",
        openPlansModal
    );


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "studyMindPlansModal";


    modal.style.cssText = `

        display:none;

        position:fixed;

        inset:0;

        z-index:99990;

        background:rgba(0,0,0,.65);

        padding:20px;

        align-items:center;

        justify-content:center;

    `;


    modal.innerHTML = `

        <div
            style="
                width:100%;
                max-width:650px;
                max-height:85vh;
                overflow:auto;
                padding:28px;
                border-radius:24px;
                background:var(--card-bg,#111827);
                color:inherit;
                box-shadow:0 25px 70px rgba(0,0,0,.4);
            "
        >

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    gap:15px;
                "
            >

                <div>

                    <h2
                        style="
                            margin:0;
                        "
                    >
                        📚 My Study Plans
                    </h2>

                    <p
                        style="
                            opacity:.7;
                            margin-bottom:0;
                        "
                    >
                        Your previous plans stay saved
                        when you create a new one.
                    </p>

                </div>

                <button
                    id="closeStudyMindPlans"
                    type="button"
                    style="
                        border:0;
                        background:transparent;
                        font-size:24px;
                        cursor:pointer;
                    "
                >
                    ×
                </button>

            </div>

            <div
                id="studyMindPlansList"
                style="
                    margin-top:20px;
                "
            ></div>

        </div>
    `;


    document.body.appendChild(
        modal
    );


    const close =
        $("closeStudyMindPlans");


    if (close) {

        close.addEventListener(
            "click",
            closePlansModal
        );
    }


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                modal
            ) {

                closePlansModal();
            }
        }
    );
}


function renderPlansModal() {

    const container =
        $("studyMindPlansList");


    if (!container) {
        return;
    }


    const plans =
        getSavedPlans();


    if (
        plans.length === 0
    ) {

        container.innerHTML = `

            <div
                style="
                    padding:20px;
                    text-align:center;
                    opacity:.7;
                "
            >
                No saved study plans yet.
            </div>
        `;

        return;
    }


    container.innerHTML =

        plans
            .slice()
            .reverse()
            .map(
                record => {

                    const plan =
                        normalizePlan(
                            record.plan ||
                            record
                        );


                    const completed =
                        Array.isArray(
                            record.completedTopics
                        )
                            ? record.completedTopics
                            : [];


                    const topics =
                        plan &&
                        Array.isArray(
                            plan.topics
                        )
                            ? plan.topics
                            : [];


                    const completedCount =
                        topics.filter(
                            topic =>

                                completed.includes(
                                    getTopicKey(
                                        topic
                                    )
                                )
                        ).length;


                    const percentage =
                        topics.length
                            ? Math.round(
                                (
                                    completedCount /
                                    topics.length
                                ) * 100
                            )
                            : 0;


                    const active =
                        record.id ===
                        activePlanId;


                    return `

                        <div
                            style="
                                border:1px solid rgba(127,127,127,.18);
                                border-radius:18px;
                                padding:18px;
                                margin-bottom:12px;
                                ${
                                    active
                                        ? "outline:2px solid rgba(59,130,246,.5);"
                                        : ""
                                }
                            "
                        >

                            <div
                                style="
                                    display:flex;
                                    justify-content:space-between;
                                    align-items:flex-start;
                                    gap:15px;
                                "
                            >

                                <div>

                                    <strong>
                                        ${escapeHTML(
                                            getPlanDisplayTitle(
                                                record
                                            )
                                        )}
                                    </strong>

                                    <small
                                        style="
                                            display:block;
                                            opacity:.7;
                                            margin-top:5px;
                                        "
                                    >
                                        ${
                                            plan &&
                                            plan.examDate
                                                ? `Exam: ${escapeHTML(plan.examDate)}`
                                                : "No exam date"
                                        }
                                    </small>

                                    <small
                                        style="
                                            display:block;
                                            opacity:.7;
                                            margin-top:3px;
                                        "
                                    >
                                        ${completedCount}
                                        /
                                        ${topics.length}
                                        topics •
                                        ${percentage}%
                                    </small>

                                </div>

                                ${
                                    active
                                        ? `
                                            <span
                                                style="
                                                    font-size:.78rem;
                                                    font-weight:700;
                                                    opacity:.8;
                                                "
                                            >
                                                ACTIVE
                                            </span>
                                        `
                                        : ""
                                }

                            </div>

                            <div
                                style="
                                    height:7px;
                                    border-radius:99px;
                                    background:rgba(127,127,127,.16);
                                    margin-top:14px;
                                    overflow:hidden;
                                "
                            >

                                <div
                                    style="
                                        height:100%;
                                        width:${percentage}%;
                                        background:#22c55e;
                                    "
                                ></div>

                            </div>

                            <button
                                type="button"
                                class="primary-button"
                                data-open-plan="${escapeHTML(record.id)}"
                                style="
                                    margin-top:14px;
                                    width:100%;
                                "
                                ${
                                    active
                                        ? "disabled"
                                        : ""
                                }
                            >
                                ${
                                    active
                                        ? "✓ Current Plan"
                                        : "Open This Plan"
                                }
                            </button>

                        </div>
                    `;
                }
            )
            .join("");


    container
        .querySelectorAll(
            "[data-open-plan]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        switchStudyPlan(
                            button.dataset.openPlan
                        );
                    }
                );
            }
        );
}


function openPlansModal() {

    ensurePlansUI();

    renderPlansModal();


    const modal =
        $("studyMindPlansModal");


    if (modal) {

        modal.style.display =
            "flex";
    }
}


function closePlansModal() {

    const modal =
        $("studyMindPlansModal");


    if (modal) {

        modal.style.display =
            "none";
    }
}


/* =========================================================
   SWITCH STUDY PLAN
========================================================= */

function switchStudyPlan(id) {

    if (!id) {
        return;
    }


    if (
        id === activePlanId
    ) {

        closePlansModal();

        return;
    }


    /*
       Save absolutely everything from
       the current plan first.
    */

    saveCurrentReading();

    saveStudySession();

    saveCompletionState();

    saveTimerState();

    syncActivePlanRecord();

    stopTimer();


    setActivePlanId(
        id
    );


    /*
       Load the selected plan and restore
       its own progress, reading and timer.
    */

    loadStudyPlan();

    loadCompletionState();

    loadStudySession();


    renderDashboard();


    restartReadingPersistence();


    renderPlansModal();


    closePlansModal();


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
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
            event => {

                if (
                    event.target.checked
                ) {

                    completeCurrentTopic();
                }
            }
        );
    }


    const dailyChallengeButton =
        $("dailyChallengeButton");


    if (
        dailyChallengeButton
    ) {

        dailyChallengeButton.addEventListener(
            "click",
            handleDailyChallenge
        );
    }


    const startButton =
        $("startTimerButton");


    const pauseButton =
        $("pauseTimerButton");


    const resetButton =
        $("resetTimerButton");


    const timerSelect =
        $("timerDuration") ||
        $("studyTimerDuration") ||
        $("timerMinutes") ||
        $("studyTime");


    if (startButton) {

        startButton.addEventListener(
            "click",
            startTimer
        );
    }


    if (pauseButton) {

        pauseButton.addEventListener(
            "click",
            pauseTimer
        );
    }


    if (resetButton) {

        resetButton.addEventListener(
            "click",
            resetTimer
        );
    }


    if (timerSelect) {

        timerSelect.addEventListener(
            "change",
            event => {

                changeTimerDuration(
                    event.target.value
                );
            }
        );
    }


    const previous =
        $("previousMonth");


    const next =
        $("nextMonth");


    if (previous) {

        previous.addEventListener(
            "click",
            previousMonth
        );
    }


    if (next) {

        next.addEventListener(
            "click",
            nextMonth
        );
    }


    const askButton =
        $("askAIButton");


    if (askButton) {

        askButton.addEventListener(
            "click",
            askAI
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


    window.addEventListener(
        "storage",
        event => {

            if (
                event.key ===
                    PLANS_KEY ||

                event.key ===
                    ACTIVE_PLAN_KEY ||

                event.key ===
                    PLAN_KEY ||

                event.key ===
                    COMPATIBILITY_PLAN_KEY
            ) {

                loadStudyPlan();

                loadCompletionState();

                renderDashboard();

                restartReadingPersistence();
            }


            if (
                event.key ===
                    AI_QUESTION_COUNT_KEY ||

                event.key ===
                    AI_QUESTION_DATE_KEY
            ) {

                updateAIButton();

                renderStats();
            }
        }
    );


    window.addEventListener(
        "studyMindPlanUpdated",
        () => {

            loadStudyPlan();

            loadCompletionState();

            renderDashboard();

            restartReadingPersistence();
        }
    );
}


/* =========================================================
   RENDER DASHBOARD
========================================================= */

function renderDashboard() {

    renderStats();

    renderCurrentTopic();

    renderProgress();

    renderTopics();

    renderSubjects();

    renderDailyChallenge();

    renderStreak();

    renderCalendar();

    renderSchedule();

    renderNextSession();

    renderTimer();

    updateAIButton();

    maybeShowCompletionCelebration();
}


/* =========================================================
   RESTORE TIMER
========================================================= */

function restoreTimerState() {

    const storedDuration =
        Number(
            localStorage.getItem(
                TIMER_DURATION_KEY
            )
        );


    if (
        TIMER_OPTIONS.includes(
            Math.round(
                storedDuration / 60
            )
        )
    ) {

        selectedTimerSeconds =
            storedDuration;
    }


    const storedSeconds =
        Number(
            localStorage.getItem(
                TIMER_SECONDS_KEY
            )
        );


    if (
        Number.isFinite(
            storedSeconds
        ) &&
        storedSeconds >= 0
    ) {

        timerSeconds =
            Math.min(
                storedSeconds,
                selectedTimerSeconds
            );

    } else {

        timerSeconds =
            selectedTimerSeconds;
    }


    const wasRunning =
        localStorage.getItem(
            TIMER_RUNNING_KEY
        ) === "true";


    const endTime =
        Number(
            localStorage.getItem(
                TIMER_END_TIME_KEY
            )
        );


    /*
       If the browser was closed while the timer
       was running, continue from the correct
       remaining time.
    */

    if (
        wasRunning &&
        Number.isFinite(
            endTime
        ) &&
        endTime > 0
    ) {

        const remaining =
            Math.ceil(
                (
                    endTime -
                    Date.now()
                ) / 1000
            );


        if (
            remaining > 0
        ) {

            timerSeconds =
                remaining;

            timerRunning =
                false;

            startTimer();

            return;
        }


        timerSeconds =
            0;
    }


    timerRunning =
        false;


    renderTimer();
}


/* =========================================================
   REQUEST NOTIFICATION
========================================================= */

function requestNotificationPermission() {

    try {

        if (
            "Notification" in window &&
            Notification.permission ===
                "default"
        ) {

            Notification.requestPermission()
                .catch(
                    () => {}
                );
        }

    } catch {}
}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.openDashboard =
    function () {

        window.location.href =
            "dashboard.html";
    };


window.logoutStudyMind =
    logoutStudyMind;


window.startTimer =
    startTimer;


window.pauseTimer =
    pauseTimer;


window.resetTimer =
    resetTimer;


window.completeCurrentTopic =
    completeCurrentTopic;


window.openKnowledgeCheckPage =
    openKnowledgeCheckPage;


window.previousMonth =
    previousMonth;


window.nextMonth =
    nextMonth;


window.showPremiumMessage =
    showPremiumMessage;


window.getAIQuestionCount =
    getAIQuestionCount;


window.getRemainingAIQuestions =
    getRemainingAIQuestions;


window.hasFreeAIQuestionsLeft =
    hasFreeAIQuestionsLeft;


window.recordAIQuestion =
    recordAIQuestion;


window.toggleTheme =
    toggleTheme;


window.saveCurrentReading =
    saveCurrentReading;


window.restoreCurrentReading =
    restoreCurrentReading;


window.saveStudySession =
    saveStudySession;


window.getSavedStudyPlans =
    getSavedPlans;


window.getActiveStudyPlanId =
    getActivePlanId;


window.setActiveStudyPlanId =
    setActivePlanId;


window.switchStudyPlan =
    switchStudyPlan;


window.archiveCurrentStudyPlan =
    syncActivePlanRecord;


/* =========================================================
   START DASHBOARD
========================================================= */

async function startDashboard() {

    /*
       Make absolutely sure the calendar colors
       exist before anything renders.
    */

    ensureCalendarStyles();


    initializeTheme();


    loadStudyPlan();


    if (!studyPlan) {

        console.warn(
            "No StudyMind study plan found."
        );

        return;
    }


    loadCompletionState();

    loadStudySession();

    restoreTimerState();

    initializeEventListeners();

    renderDashboard();

    ensurePlansUI();

    startReadingPersistence();

    requestNotificationPermission();


    /*
       Some dashboard reading content may be
       generated after dashboard.js loads.
    */

    setTimeout(
        () => {

            restoreCurrentReading();

            startReadingPersistence();

            renderCalendar();

        },
        750
    );


    /*
       Keep the active plan synchronized.
    */

    setInterval(
        () => {

            saveCurrentReading();

            saveStudySession();

            saveCompletionState();

            saveTimerState();

            syncActivePlanRecord();

        },
        5000
    );
}


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        try {

            const authenticated =
                await checkAuthentication();


            if (
                authenticated === false
            ) {
                return;
            }


            await startDashboard();

        } catch (error) {

            console.error(
                "StudyMind dashboard startup error:",
                error
            );
        }
    }
);
