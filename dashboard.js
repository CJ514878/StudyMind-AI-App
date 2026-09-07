/* =========================================================
   STUDYMIND AI — DASHBOARD
   COMPLETE REBUILT VERSION
   =========================================================

   IMPORTANT PLAN RULE:

   1. studyMindActivePlanId is the authoritative plan selector.
   2. studyMindPlans contains saved plan records.
   3. studyMindPlan is kept as legacy compatibility only.
   4. Opening Dashboard NEVER creates a new plan.
   5. Opening Dashboard NEVER promotes an old plan over the
      active plan.
   6. Home creates the new plan and sets the active ID.
   7. Dashboard loads that exact active ID.
========================================================= */

"use strict";


/* =========================================================
   STORAGE KEYS
========================================================= */

const PLAN_KEY =
    "studyMindPlan";

const LEGACY_PLAN_KEY =
    "studyData";

const PLANS_KEY =
    "studyMindPlans";

const ACTIVE_PLAN_KEY =
    "studyMindActivePlanId";

const COMPLETED_KEY =
    "studyMindCompletedTopics";

const COMPLETED_Q_KEY =
    "studyMindCompletedQuestionTopics";

const CURRENT_INDEX_KEY =
    "studyMindCurrentTopicIndex";

const KNOWLEDGE_TOPIC_KEY =
    "studyMindKnowledgeCheckTopic";

const KNOWLEDGE_QUESTIONS_KEY =
    "studyMindTopicQuestions";

const CELEBRATION_KEY =
    "studyMindCompletionCelebrationShown";

const TIMER_SECONDS_KEY =
    "studyMindTimerSeconds";

const TIMER_DURATION_KEY =
    "studyMindSelectedTimerSeconds";

const THEME_KEY =
    "studyMindTheme";

const AI_COUNT_KEY =
    "aiQuestionCount";

const AI_DATE_KEY =
    "aiQuestionDate";

const STREAK_KEY =
    "studyMindStreak";

const LAST_STUDY_KEY =
    "lastStudyDate";

const STUDY_SESSION_KEY =
    "studyMindCurrentStudySession";

const STUDY_READINGS_KEY =
    "studyMindTopicReadings";


/* =========================================================
   CONSTANTS
========================================================= */

const FREE_AI_LIMIT =
    5;

const TIMER_OPTIONS =
    [25, 45, 60];

const DEFAULT_TIMER_SECONDS =
    25 * 60;

const PASS_MARK =
    60;

const QUESTIONS_PER_CHECK =
    5;


/* =========================================================
   GLOBAL STATE
========================================================= */

let studyPlan = null;

let subjects = [];

let allTopics = [];

let completedTopics = [];

let completedQuestionTopics = [];

let currentTopicIndex = 0;

let timerSeconds =
    DEFAULT_TIMER_SECONDS;

let selectedTimerSeconds =
    DEFAULT_TIMER_SECONDS;

let timerInterval = null;

let timerRunning = false;

let calendarDate =
    new Date();

let currentUser = null;

let currentStudySession = null;

let topicReadings = {};

let activePlanId = null;

let readingObserver = null;

let readingPersistenceInterval = null;

let stateSaveInterval = null;

let dashboardInitialized = false;

let knowledgeTopic = null;

let knowledgeQuestions = null;

let knowledgeCheckLoading = false;


/* =========================================================
   BASIC HELPERS
========================================================= */

function clean(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value).trim();

}


function readJSON(key, fallback = null) {

    try {

        const raw =
            localStorage.getItem(key);

        if (!raw) {
            return fallback;
        }

        return JSON.parse(raw);

    } catch (error) {

        console.warn(
            "StudyMind: Could not read",
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
            "StudyMind: Could not write",
            key,
            error
        );

        return false;

    }

}


function removeStorage(key) {

    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.warn(
            "StudyMind: Could not remove",
            key,
            error
        );
    }

}


function escapeHTML(value) {

    return clean(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function $(id) {

    return document.getElementById(id);

}


function createId(prefix = "id") {

    return (
        prefix +
        "-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .slice(2, 8)
    );

}


function slug(value) {

    return clean(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

}


function sameDay(a, b) {

    if (!a || !b) {
        return false;
    }

    const first =
        new Date(a);

    const second =
        new Date(b);

    return (
        first.getFullYear() ===
            second.getFullYear() &&
        first.getMonth() ===
            second.getMonth() &&
        first.getDate() ===
            second.getDate()
    );

}


function dateKey(date) {

    const d =
        date instanceof Date
            ? date
            : new Date(date);

    if (
        Number.isNaN(
            d.getTime()
        )
    ) {
        return "";
    }

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


function formatDate(value) {

    if (!value) {
        return "";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return clean(value);
    }

    return date.toLocaleDateString(
        undefined,
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}


function formatShortDate(value) {

    if (!value) {
        return "";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return date.toLocaleDateString(
        undefined,
        {
            day: "numeric",
            month: "short"
        }
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

    return writeJSON(
        PLANS_KEY,
        Array.isArray(plans)
            ? plans
            : []
    );

}


function getActivePlanId() {

    try {

        return clean(
            localStorage.getItem(
                ACTIVE_PLAN_KEY
            )
        ) || null;

    } catch (error) {

        return null;

    }

}


function setActivePlanId(id) {

    if (!id) {

        removeStorage(
            ACTIVE_PLAN_KEY
        );

        activePlanId = null;

        return;

    }

    try {

        localStorage.setItem(
            ACTIVE_PLAN_KEY,
            String(id)
        );

        activePlanId =
            String(id);

    } catch (error) {

        console.warn(
            "StudyMind: Could not set active plan",
            error
        );

    }

}


/* =========================================================
   TOPIC NORMALIZATION
========================================================= */

function topicKey(topic) {

    if (!topic) {
        return "";
    }

    if (clean(topic.id)) {
        return clean(topic.id);
    }

    if (clean(topic.key)) {
        return clean(topic.key);
    }

    const subject =
        topicSubject(topic);

    const name =
        topicName(topic);

    return (
        slug(subject) +
        "::" +
        slug(name)
    );

}


function topicName(topic) {

    if (!topic) {
        return "Untitled Topic";
    }

    return (
        clean(topic.name) ||
        clean(topic.topic) ||
        clean(topic.title) ||
        "Untitled Topic"
    );

}


function topicSubject(topic) {

    if (!topic) {
        return "";
    }

    return (
        clean(topic.subject) ||
        clean(topic.subjectName) ||
        ""
    );

}


function normalizeTopic(topic, subjectName = "") {

    if (
        typeof topic === "string"
    ) {

        return {

            id:
                slug(
                    subjectName +
                    "-" +
                    topic
                ),

            name:
                clean(topic),

            subject:
                clean(subjectName)

        };

    }

    if (
        !topic ||
        typeof topic !== "object"
    ) {

        return null;

    }

    const name =
        topicName(topic);

    const subject =
        topicSubject(topic) ||
        clean(subjectName);

    return {

        ...topic,

        id:
            clean(topic.id) ||
            slug(
                subject +
                "-" +
                name
            ),

        name,

        subject

    };

}


/* =========================================================
   PLAN NORMALIZATION
========================================================= */

function normalizePlan(rawPlan) {

    if (
        !rawPlan ||
        typeof rawPlan !== "object"
    ) {
        return null;
    }

    const plan = {
        ...rawPlan
    };

    plan.examDate =
        clean(
            plan.examDate ||
            plan.testDate ||
            plan.exam
        );

    plan.curriculum =
        clean(
            plan.curriculum
        );

    plan.hoursPerDay =
        Number(
            plan.hoursPerDay ||
            plan.dailyHours ||
            0
        );

    plan.startTime =
        clean(
            plan.startTime
        );

    plan.difficulty =
        clean(
            plan.difficulty
        );

    let rawSubjects =
        Array.isArray(plan.subjects)
            ? plan.subjects
            : [];

    let normalizedSubjects = [];

    rawSubjects.forEach(
        (subject, index) => {

            if (
                typeof subject ===
                "string"
            ) {

                normalizedSubjects.push({

                    id:
                        slug(subject) ||
                        "subject-" +
                        index,

                    name:
                        clean(subject),

                    topics: []

                });

                return;
            }

            if (
                !subject ||
                typeof subject !==
                "object"
            ) {
                return;
            }

            const subjectName =
                clean(
                    subject.name ||
                    subject.subject ||
                    subject.title
                );

            let rawTopics =
                Array.isArray(
                    subject.topics
                )
                    ? subject.topics
                    : [];

            normalizedSubjects.push({

                ...subject,

                id:
                    clean(subject.id) ||
                    slug(subjectName) ||
                    "subject-" +
                    index,

                name:
                    subjectName ||
                    "Untitled Subject",

                topics:
                    rawTopics
                        .map(topic =>
                            normalizeTopic(
                                topic,
                                subjectName
                            )
                        )
                        .filter(Boolean)

            });

        }
    );


    /*
       Some older StudyMind plans store topics
       at the root level instead.
    */

    if (
        normalizedSubjects.length === 0 &&
        Array.isArray(plan.topics)
    ) {

        const fallbackSubject =
            clean(
                plan.subject ||
                plan.subjectName
            ) ||
            "General";

        normalizedSubjects = [{

            id:
                slug(
                    fallbackSubject
                ),

            name:
                fallbackSubject,

            topics:
                plan.topics
                    .map(topic =>
                        normalizeTopic(
                            topic,
                            fallbackSubject
                        )
                    )
                    .filter(Boolean)

        }];

    }


    plan.subjects =
        normalizedSubjects;


    plan.subjectNames =
        normalizedSubjects
            .map(
                subject =>
                    clean(subject.name)
            )
            .filter(Boolean);


    plan.topicNames =
        normalizedSubjects
            .flatMap(
                subject =>
                    subject.topics.map(
                        topic =>
                            topicName(topic)
                    )
            );


    return plan;

}


/* =========================================================
   FLATTEN PLAN
========================================================= */

function buildPlanCollections() {

    subjects = [];

    allTopics = [];

    if (!studyPlan) {
        return;
    }


    subjects =
        Array.isArray(
            studyPlan.subjects
        )
            ? studyPlan.subjects
            : [];


    subjects.forEach(
        subject => {

            const subjectName =
                clean(
                    subject.name
                );

            const subjectTopics =
                Array.isArray(
                    subject.topics
                )
                    ? subject.topics
                    : [];

            subjectTopics.forEach(
                topic => {

                    const normalized =
                        normalizeTopic(
                            topic,
                            subjectName
                        );

                    if (!normalized) {
                        return;
                    }

                    allTopics.push(
                        normalized
                    );

                }
            );

        }
    );

}


/* =========================================================
   COMPLETION
========================================================= */

function isTopicCompleted(topic) {

    const key =
        topicKey(topic);

    const id =
        clean(topic?.id);

    return (
        completedTopics.includes(key) ||
        (
            id &&
            completedTopics.includes(id)
        )
    );

}


function completedTopicCount() {

    return allTopics.filter(
        topic =>
            isTopicCompleted(topic)
    ).length;

}


function allTopicsCompleted() {

    return (
        allTopics.length > 0 &&
        completedTopicCount() >=
            allTopics.length
    );

}


function markTopicCompleted(topic) {

    if (!topic) {
        return;
    }

    const key =
        topicKey(topic);

    if (
        key &&
        !completedTopics.includes(key)
    ) {

        completedTopics.push(key);

    }

    const id =
        clean(topic.id);

    if (
        id &&
        !completedTopics.includes(id)
    ) {

        completedTopics.push(id);

    }

    writeJSON(
        COMPLETED_KEY,
        completedTopics
    );

    syncActivePlanRecord();

}


/* =========================================================
   CURRENT TOPIC
========================================================= */

function getCurrentTopic() {

    if (!allTopics.length) {
        return null;
    }


    /*
       Only use the saved session if the topic
       actually belongs to THIS active plan.
    */

    if (
        currentStudySession &&
        currentStudySession.topicKey
    ) {

        const sessionTopic =
            allTopics.find(
                topic =>
                    topicKey(topic) ===
                    currentStudySession.topicKey
            );

        if (sessionTopic) {
            return sessionTopic;
        }

    }


    if (
        Number.isInteger(
            currentTopicIndex
        ) &&
        allTopics[
            currentTopicIndex
        ]
    ) {

        return allTopics[
            currentTopicIndex
        ];

    }


    const incomplete =
        allTopics.find(
            topic =>
                !isTopicCompleted(
                    topic
                )
        );

    return (
        incomplete ||
        allTopics[0]
    );

}


/* =========================================================
   ACTIVE PLAN SYNC
========================================================= */

function syncActivePlanRecord() {

    if (!activePlanId) {
        return;
    }

    const plans =
        getSavedPlans();

    if (!plans.length) {
        return;
    }

    const index =
        plans.findIndex(
            record =>
                record &&
                String(record.id) ===
                String(activePlanId)
        );

    if (index < 0) {

        console.warn(
            "StudyMind: active record missing:",
            activePlanId
        );

        return;

    }


    const record =
        plans[index];


    record.plan =
        studyPlan;


    record.completedTopics =
        Array.isArray(
            completedTopics
        )
            ? [...completedTopics]
            : [];


    record.completedQuestionTopics =
        Array.isArray(
            completedQuestionTopics
        )
            ? [...completedQuestionTopics]
            : [];


    record.currentTopicIndex =
        Number.isInteger(
            currentTopicIndex
        )
            ? currentTopicIndex
            : 0;


    record.knowledgeTopic =
        knowledgeTopic || null;


    record.knowledgeQuestions =
        knowledgeQuestions || null;


    record.celebrationShown =
        localStorage.getItem(
            CELEBRATION_KEY
        ) === "true";


    record.studySession =
        currentStudySession
            ? {
                ...currentStudySession
            }
            : null;


    record.topicReadings =
        topicReadings &&
        typeof topicReadings ===
            "object"
            ? {
                ...topicReadings
            }
            : {};


    record.timerSeconds =
        Number.isFinite(
            timerSeconds
        )
            ? timerSeconds
            : DEFAULT_TIMER_SECONDS;


    record.timerDuration =
        Number.isFinite(
            selectedTimerSeconds
        )
            ? selectedTimerSeconds
            : DEFAULT_TIMER_SECONDS;


    record.updatedAt =
        new Date().toISOString();


    plans[index] =
        record;


    saveSavedPlans(plans);

}


/* =========================================================
   PLAN STATE RESTORE
========================================================= */

function restorePlanState(record) {

    completedTopics =
        Array.isArray(
            record?.completedTopics
        )
            ? [
                ...record.completedTopics
            ]
            : [];


    completedQuestionTopics =
        Array.isArray(
            record?.completedQuestionTopics
        )
            ? [
                ...record.completedQuestionTopics
            ]
            : [];


    currentTopicIndex =
        Number.isInteger(
            record?.currentTopicIndex
        )
            ? record.currentTopicIndex
            : 0;


    knowledgeTopic =
        record?.knowledgeTopic ||
        null;


    knowledgeQuestions =
        record?.knowledgeQuestions ||
        null;


    currentStudySession =
        record?.studySession
            ? {
                ...record.studySession
            }
            : null;


    topicReadings =
        record?.topicReadings &&
        typeof record.topicReadings ===
            "object"
            ? {
                ...record.topicReadings
            }
            : {};


    const storedTimer =
        Number(
            record?.timerSeconds
        );

    timerSeconds =
        Number.isFinite(
            storedTimer
        )
            ? storedTimer
            : Number(
                localStorage.getItem(
                    TIMER_SECONDS_KEY
                )
            ) ||
              DEFAULT_TIMER_SECONDS;


    const storedDuration =
        Number(
            record?.timerDuration
        );

    selectedTimerSeconds =
        Number.isFinite(
            storedDuration
        )
            ? storedDuration
            : Number(
                localStorage.getItem(
                    TIMER_DURATION_KEY
                )
            ) ||
              DEFAULT_TIMER_SECONDS;


    if (
        !TIMER_OPTIONS.includes(
            selectedTimerSeconds /
            60
        )
    ) {

        selectedTimerSeconds =
            DEFAULT_TIMER_SECONDS;

    }


    if (
        !Number.isFinite(
            timerSeconds
        ) ||
        timerSeconds < 0
    ) {

        timerSeconds =
            selectedTimerSeconds;

    }


    writeJSON(
        COMPLETED_KEY,
        completedTopics
    );

    writeJSON(
        COMPLETED_Q_KEY,
        completedQuestionTopics
    );

    writeJSON(
        CURRENT_INDEX_KEY,
        currentTopicIndex
    );

    writeJSON(
        STUDY_SESSION_KEY,
        currentStudySession
    );

    writeJSON(
        STUDY_READINGS_KEY,
        topicReadings
    );

    if (knowledgeTopic) {

        writeJSON(
            KNOWLEDGE_TOPIC_KEY,
            knowledgeTopic
        );

    } else {

        removeStorage(
            KNOWLEDGE_TOPIC_KEY
        );

    }

    if (knowledgeQuestions) {

        writeJSON(
            KNOWLEDGE_QUESTIONS_KEY,
            knowledgeQuestions
        );

    }


    writeJSON(
        TIMER_SECONDS_KEY,
        timerSeconds
    );

    writeJSON(
        TIMER_DURATION_KEY,
        selectedTimerSeconds
    );

}


/* =========================================================
   LEGACY MIGRATION
========================================================= */

function recoverLegacyPlan() {

    let legacy =
        readJSON(
            PLAN_KEY,
            null
        );

    if (
        !legacy ||
        typeof legacy !== "object"
    ) {

        legacy =
            readJSON(
                LEGACY_PLAN_KEY,
                null
            );

    }

    if (
        !legacy ||
        typeof legacy !== "object"
    ) {
        return null;
    }

    return normalizePlan(
        legacy
    );

}


function createPlanRecord(plan) {

    return {

        id:
            createId("plan"),

        plan:
            normalizePlan(plan),

        completedTopics: [],

        completedQuestionTopics: [],

        currentTopicIndex: 0,

        knowledgeTopic: null,

        knowledgeQuestions: null,

        celebrationShown: false,

        studySession: null,

        topicReadings: {},

        timerSeconds:
            DEFAULT_TIMER_SECONDS,

        timerDuration:
            DEFAULT_TIMER_SECONDS,

        createdAt:
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()

    };

}


/* =========================================================
   CRITICAL PLAN LOADING
========================================================= */

function loadActivePlan() {

    let plans =
        getSavedPlans();


    /*
       -------------------------------------------------------
       CASE 1:
       We already have saved plans.
       NEVER migrate studyMindPlan just because it exists.
       -------------------------------------------------------
    */

    if (plans.length > 0) {

        const requestedId =
            getActivePlanId();


        /*
           Exact active plan.
        */

        let record =
            requestedId
                ? plans.find(
                    item =>
                        item &&
                        String(item.id) ===
                        String(requestedId)
                )
                : null;


        /*
           If the stored active ID is invalid,
           choose the newest registry record.

           Home uses unshift() when creating plans,
           so index 0 is the newest plan.
        */

        if (!record) {

            record =
                plans.find(
                    item =>
                        item &&
                        item.plan
                );

            if (record) {

                setActivePlanId(
                    record.id
                );

            }

        }


        if (!record) {

            console.error(
                "StudyMind: No valid plan record."
            );

            return false;

        }


        activePlanId =
            String(record.id);


        studyPlan =
            normalizePlan(
                record.plan
            );


        if (!studyPlan) {

            console.error(
                "StudyMind: Active plan is invalid."
            );

            return false;

        }


        restorePlanState(
            record
        );

        buildPlanCollections();


        /*
           Make the legacy key mirror the ACTIVE plan.
           This prevents old Geometry data from being used
           by older parts of the application.
        */

        writeJSON(
            PLAN_KEY,
            studyPlan
        );

        writeJSON(
            LEGACY_PLAN_KEY,
            studyPlan
        );


        console.log(
            "StudyMind: Active plan loaded:",
            {
                activePlanId,
                title:
                    planTitle(studyPlan),
                examDate:
                    studyPlan.examDate,
                subjects:
                    studyPlan.subjectNames,
                topics:
                    studyPlan.topicNames,
                savedPlanCount:
                    plans.length
            }
        );


        return true;

    }


    /*
       -------------------------------------------------------
       CASE 2:
       There are NO saved plans.
       Only now may we migrate the legacy plan.
       -------------------------------------------------------
    */

    const legacy =
        recoverLegacyPlan();

    if (!legacy) {

        console.warn(
            "StudyMind: No study plan found."
        );

        return false;

    }


    const record =
        createPlanRecord(
            legacy
        );


    record.completedTopics =
        readJSON(
            COMPLETED_KEY,
            []
        ) || [];


    record.completedQuestionTopics =
        readJSON(
            COMPLETED_Q_KEY,
            []
        ) || [];


    record.currentTopicIndex =
        Number(
            readJSON(
                CURRENT_INDEX_KEY,
                0
            )
        ) || 0;


    record.knowledgeTopic =
        readJSON(
            KNOWLEDGE_TOPIC_KEY,
            null
        );


    record.knowledgeQuestions =
        readJSON(
            KNOWLEDGE_QUESTIONS_KEY,
            null
        );


    record.studySession =
        readJSON(
            STUDY_SESSION_KEY,
            null
        );


    record.topicReadings =
        readJSON(
            STUDY_READINGS_KEY,
            {}
        ) || {};


    plans =
        [record];


    saveSavedPlans(
        plans
    );


    setActivePlanId(
        record.id
    );


    activePlanId =
        record.id;


    studyPlan =
        legacy;


    restorePlanState(
        record
    );


    buildPlanCollections();


    writeJSON(
        PLAN_KEY,
        studyPlan
    );

    writeJSON(
        LEGACY_PLAN_KEY,
        studyPlan
    );


    console.log(
        "StudyMind: Legacy plan migrated:",
        activePlanId
    );


    return true;

}


/* =========================================================
   PLAN TITLE
========================================================= */

function planTitle(plan) {

    if (!plan) {
        return "Study Plan";
    }

    if (
        clean(plan.title)
    ) {
        return clean(plan.title);
    }

    const subjectsText =
        Array.isArray(
            plan.subjectNames
        )
            ? plan.subjectNames.join(
                " + "
            )
            : "Study";

    return (
        subjectsText +
        " Study Plan"
    );

}


/* =========================================================
   SAVE EVERYTHING
========================================================= */

function saveLegacyState() {

    writeJSON(
        PLAN_KEY,
        studyPlan
    );

    writeJSON(
        LEGACY_PLAN_KEY,
        studyPlan
    );

    writeJSON(
        COMPLETED_KEY,
        completedTopics
    );

    writeJSON(
        COMPLETED_Q_KEY,
        completedQuestionTopics
    );

    writeJSON(
        CURRENT_INDEX_KEY,
        currentTopicIndex
    );

    writeJSON(
        STUDY_SESSION_KEY,
        currentStudySession
    );

    writeJSON(
        STUDY_READINGS_KEY,
        topicReadings
    );

    writeJSON(
        TIMER_SECONDS_KEY,
        timerSeconds
    );

    writeJSON(
        TIMER_DURATION_KEY,
        selectedTimerSeconds
    );

}


function saveDashboardState() {

    saveLegacyState();

    syncActivePlanRecord();

}


/* =========================================================
   STUDY SESSION
========================================================= */

function createStudySession(topic) {

    if (!topic) {
        return;
    }


    const index =
        allTopics.findIndex(
            item =>
                topicKey(item) ===
                topicKey(topic)
        );


    currentStudySession = {

        topicKey:
            topicKey(topic),

        topicId:
            clean(topic.id),

        topicName:
            topicName(topic),

        subject:
            topicSubject(topic),

        topicIndex:
            index >= 0
                ? index
                : 0,

        lastOpened:
            new Date().toISOString(),

        readingStarted:
            currentStudySession?.readingStarted ||
            false,

        readingCompleted:
            currentStudySession?.readingCompleted ||
            false,

        updatedAt:
            new Date().toISOString()

    };


    writeJSON(
        STUDY_SESSION_KEY,
        currentStudySession
    );


    syncActivePlanRecord();

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


function getCurrentReadingRecord() {

    const topic =
        getCurrentTopic();

    if (!topic) {
        return null;
    }

    const key =
        topicKey(topic);

    return (
        topicReadings[key] ||
        {
            topicKey: key,
            started: false,
            completed: false,
            progress: 0,
            updatedAt:
                new Date().toISOString()
        }
    );

}


function saveCurrentReading() {

    const topic =
        getCurrentTopic();

    if (!topic) {
        return;
    }

    const key =
        topicKey(topic);

    if (!key) {
        return;
    }


    const existing =
        topicReadings[key] ||
        {};


    topicReadings[key] = {

        ...existing,

        topicKey:
            key,

        topicName:
            topicName(topic),

        subject:
            topicSubject(topic),

        started:
            existing.started === true,

        completed:
            existing.completed === true,

        progress:
            Number(
                existing.progress
            ) || 0,

        updatedAt:
            new Date().toISOString()

    };


    writeJSON(
        STUDY_READINGS_KEY,
        topicReadings
    );


    syncActivePlanRecord();

}


function restoreCurrentReading() {

    const topic =
        getCurrentTopic();

    if (!topic) {
        return;
    }

    const key =
        topicKey(topic);

    const record =
        topicReadings[key];

    if (!record) {
        return;
    }


    if (
        currentStudySession
    ) {

        currentStudySession.readingStarted =
            record.started === true;

        currentStudySession.readingCompleted =
            record.completed === true;

    }

}


function startReadingPersistence() {

    if (
        readingPersistenceInterval
    ) {

        clearInterval(
            readingPersistenceInterval
        );

    }


    readingPersistenceInterval =
        setInterval(
            saveCurrentReading,
            15000
        );


    const element =
        findReadingElement();

    if (
        element &&
        "IntersectionObserver" in
            window
    ) {

        if (readingObserver) {

            try {
                readingObserver.disconnect();
            } catch (_) {}

        }


        readingObserver =
            new IntersectionObserver(
                entries => {

                    entries.forEach(
                        entry => {

                            if (
                                entry.isIntersecting
                            ) {

                                const topic =
                                    getCurrentTopic();

                                if (!topic) {
                                    return;
                                }

                                const key =
                                    topicKey(topic);

                                topicReadings[key] =
                                    {
                                        ...(topicReadings[key] || {}),
                                        topicKey: key,
                                        started: true,
                                        updatedAt:
                                            new Date().toISOString()
                                    };

                                if (
                                    currentStudySession
                                ) {

                                    currentStudySession
                                        .readingStarted =
                                        true;

                                }

                                writeJSON(
                                    STUDY_READINGS_KEY,
                                    topicReadings
                                );

                                syncActivePlanRecord();

                            }

                        }
                    );

                },
                {
                    threshold: 0.15
                }
            );


        readingObserver.observe(
            element
        );

    }

}


/* =========================================================
   TIMER
========================================================= */

function updateTimerDisplay() {

    const timer =
        $("studyTimer");

    if (!timer) {
        return;
    }

    const total =
        Math.max(
            0,
            Math.floor(
                timerSeconds
            )
        );

    const minutes =
        Math.floor(
            total / 60
        );

    const seconds =
        total % 60;


    timer.textContent =
        String(minutes)
            .padStart(2, "0") +
        ":" +
        String(seconds)
            .padStart(2, "0");

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


    timerRunning = true;

    updateTimerButtons();


    timerInterval =
        setInterval(
            () => {

                timerSeconds--;

                updateTimerDisplay();

                writeJSON(
                    TIMER_SECONDS_KEY,
                    timerSeconds
                );


                if (
                    timerSeconds <= 0
                ) {

                    pauseTimer();

                    timerSeconds =
                        selectedTimerSeconds;

                    updateTimerDisplay();

                    alert(
                        "Study session complete! Great work."
                    );

                    updateStudyActivity();

                }

            },
            1000
        );


    const topic =
        getCurrentTopic();

    if (topic) {

        createStudySession(
            topic
        );

        const key =
            topicKey(topic);

        topicReadings[key] = {

            ...(topicReadings[key] || {}),

            topicKey: key,

            started: true,

            updatedAt:
                new Date().toISOString()

        };

        if (currentStudySession) {

            currentStudySession
                .readingStarted =
                true;

        }

    }


    saveDashboardState();

}


function pauseTimer() {

    timerRunning = false;

    if (timerInterval) {

        clearInterval(
            timerInterval
        );

        timerInterval = null;

    }


    updateTimerButtons();

    writeJSON(
        TIMER_SECONDS_KEY,
        timerSeconds
    );

    saveDashboardState();

}


function resetTimer() {

    pauseTimer();

    timerSeconds =
        selectedTimerSeconds;

    updateTimerDisplay();

    writeJSON(
        TIMER_SECONDS_KEY,
        timerSeconds
    );

    saveDashboardState();

}


function changeTimerDuration(minutes) {

    const duration =
        Number(minutes);

    if (
        !TIMER_OPTIONS.includes(
            duration
        )
    ) {
        return;
    }


    pauseTimer();

    selectedTimerSeconds =
        duration * 60;

    timerSeconds =
        selectedTimerSeconds;


    writeJSON(
        TIMER_DURATION_KEY,
        selectedTimerSeconds
    );

    writeJSON(
        TIMER_SECONDS_KEY,
        timerSeconds
    );


    updateTimerDisplay();

    saveDashboardState();

}


/* =========================================================
   STUDY ACTIVITY / STREAK
========================================================= */

function updateStudyActivity() {

    const today =
        dateKey(
            new Date()
        );

    const last =
        clean(
            localStorage.getItem(
                LAST_STUDY_KEY
            )
        );


    if (last !== today) {

        let streak =
            Number(
                localStorage.getItem(
                    STREAK_KEY
                )
            ) || 0;


        if (last) {

            const previous =
                new Date(
                    last
                );

            const current =
                new Date();

            previous.setHours(
                0,
                0,
                0,
                0
            );

            current.setHours(
                0,
                0,
                0,
                0
            );

            const difference =
                Math.round(
                    (
                        current -
                        previous
                    ) /
                    86400000
                );


            if (
                difference === 1
            ) {

                streak++;

            } else if (
                difference > 1
            ) {

                streak = 1;

            }

        } else {

            streak = 1;

        }


        localStorage.setItem(
            STREAK_KEY,
            String(streak)
        );

        localStorage.setItem(
            LAST_STUDY_KEY,
            today
        );

    }


    saveDashboardState();

}


/* =========================================================
   STATS
========================================================= */

function calculateStudyScore() {

    if (!allTopics.length) {
        return 0;
    }

    const completed =
        completedTopicCount();

    const progress =
        completed /
        allTopics.length;

    const questionProgress =
        completedQuestionTopics.length /
        allTopics.length;


    const score =
        Math.round(
            (
                progress * 70
            ) +
            (
                Math.min(
                    1,
                    questionProgress
                ) * 30
            )
        );


    return Math.max(
        0,
        Math.min(
            100,
            score
        )
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


    const hours =
        Number(
            studyPlan?.hoursPerDay
        ) || 0;


    if (weeklyHours) {

        weeklyHours.textContent =
            (
                hours * 7
            ).toFixed(
                hours % 1
                    ? 1
                    : 0
            ) +
            "h";

    }


    if (daysLeft) {

        if (
            studyPlan?.examDate
        ) {

            const exam =
                new Date(
                    studyPlan.examDate
                );

            const today =
                new Date();

            exam.setHours(
                0,
                0,
                0,
                0
            );

            today.setHours(
                0,
                0,
                0,
                0
            );


            const difference =
                Math.ceil(
                    (
                        exam -
                        today
                    ) /
                    86400000
                );


            daysLeft.textContent =
                Math.max(
                    0,
                    difference
                );

        } else {

            daysLeft.textContent =
                "—";

        }

    }


    if (dailyGoal) {

        dailyGoal.textContent =
            (
                hours || 0
            ) +
            "h";

    }


    const score =
        calculateStudyScore();


    if (studyScore) {

        studyScore.textContent =
            score;

    }


    const scoreCard =
        $("studyScoreCard");

    if (scoreCard) {

        scoreCard.setAttribute(
            "aria-label",
            "Study score " +
            score +
            " out of 100"
        );

    }

}


/* =========================================================
   PROGRESS
========================================================= */

function renderProgress() {

    const total =
        allTopics.length;

    const completed =
        completedTopicCount();

    const percent =
        total
            ? Math.round(
                (
                    completed /
                    total
                ) * 100
            )
            : 0;


    const progressPercent =
        $("progressPercent");

    const progressCount =
        $("progressCount");

    const progressBar =
        $("progressBar");


    if (progressPercent) {

        progressPercent.textContent =
            percent +
            "%";

    }


    if (progressCount) {

        progressCount.textContent =
            completed +
            " / " +
            total +
            " topics completed";

    }


    if (progressBar) {

        progressBar.style.width =
            percent +
            "%";

        progressBar.setAttribute(
            "aria-valuenow",
            String(percent)
        );

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


    if (!subjects.length) {

        container.innerHTML =
            `
            <div class="empty-state">
                No subjects in this study plan.
            </div>
            `;

        return;

    }


    container.innerHTML =
        subjects
            .map(
                subject => {

                    const subjectTopics =
                        Array.isArray(
                            subject.topics
                        )
                            ? subject.topics
                            : [];

                    const total =
                        subjectTopics.length;

                    const completed =
                        subjectTopics.filter(
                            topic =>
                                isTopicCompleted(
                                    topic
                                )
                        ).length;

                    const percent =
                        total
                            ? Math.round(
                                (
                                    completed /
                                    total
                                ) * 100
                            )
                            : 0;


                    return `
                        <div class="subject-progress-card">

                            <div class="subject-progress-header">

                                <strong>
                                    ${escapeHTML(
                                        subject.name
                                    )}
                                </strong>

                                <span>
                                    ${completed}/${total}
                                </span>

                            </div>

                            <div class="subject-progress-bar">
                                <div
                                    style="width:${percent}%"
                                ></div>
                            </div>

                            <small>
                                ${percent}% complete
                            </small>

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


    if (!allTopics.length) {

        container.innerHTML =
            `
            <div class="empty-state">
                No topics in this study plan.
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

                    const current =
                        index ===
                        currentTopicIndex;


                    return `
                        <div
                            class="topic-progress-item ${
                                current
                                    ? "current"
                                    : ""
                            } ${
                                completed
                                    ? "completed"
                                    : ""
                            }"
                            data-topic-index="${index}"
                        >

                            <div class="topic-progress-main">

                                <span class="topic-number">
                                    ${index + 1}
                                </span>

                                <div>

                                    <strong>
                                        ${escapeHTML(
                                            topicName(
                                                topic
                                            )
                                        )}
                                    </strong>

                                    <small>
                                        ${escapeHTML(
                                            topicSubject(
                                                topic
                                            )
                                        )}
                                    </small>

                                </div>

                            </div>

                            <div class="topic-progress-status">

                                ${
                                    completed
                                        ? "✓ Completed"
                                        : current
                                            ? "Current"
                                            : "Not started"
                                }

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
                                element.dataset
                                    .topicIndex
                            );

                        if (
                            !Number.isInteger(
                                index
                            ) ||
                            !allTopics[index]
                        ) {
                            return;
                        }


                        currentTopicIndex =
                            index;


                        currentStudySession =
                            null;


                        writeJSON(
                            CURRENT_INDEX_KEY,
                            currentTopicIndex
                        );

                        removeStorage(
                            STUDY_SESSION_KEY
                        );


                        renderAll();

                    }
                );

            }
        );

}


/* =========================================================
   KNOWLEDGE CHECK UI
========================================================= */

function hideKnowledgeCheck() {

    const section =
        $("topicQuestionsSection");

    if (section) {

        section.style.display =
            "none";

    }

}


function showKnowledgeCheck() {

    const section =
        $("topicQuestionsSection");

    if (section) {

        section.style.display =
            "block";

    }

}


function hasCompletedKnowledgeCheck(
    topic
) {

    const key =
        topicKey(topic);

    return (
        completedQuestionTopics.includes(
            key
        ) ||
        (
            topic?.id &&
            completedQuestionTopics.includes(
                topic.id
            )
        )
    );

}


/* =========================================================
   KNOWLEDGE CHECK NAVIGATION
========================================================= */

function openKnowledgeCheckPage(
    topic
) {

    if (!topic) {
        return;
    }


    const premium =
        window.studyMindPremiumVerified === true ||
        window.studyMindIsPremium === true ||
        window.premiumUser === true;


    /*
       Keep the free-user restriction.
    */

    if (!premium) {

        window.location.href =
            "premium.html";

        return;

    }


    knowledgeTopic = {

        topicKey:
            topicKey(topic),

        topicName:
            topicName(topic),

        subject:
            topicSubject(topic),

        checkId:
            topicKey(topic)

    };


    writeJSON(
        KNOWLEDGE_TOPIC_KEY,
        knowledgeTopic
    );


    if (!knowledgeQuestions) {

        knowledgeQuestions = {

            topicKey:
                topicKey(topic),

            topicName:
                topicName(topic),

            subject:
                topicSubject(topic),

            questions: [],

            questionCount:
                QUESTIONS_PER_CHECK,

            revisionQuestions: []

        };

        writeJSON(
            KNOWLEDGE_QUESTIONS_KEY,
            knowledgeQuestions
        );

    }


    saveDashboardState();


    window.location.href =
        "knowledge-check.html";

}


/* =========================================================
   CURRENT TOPIC RENDER
========================================================= */

function renderCurrentTopic() {

    const topic =
        getCurrentTopic();


    if (!topic) {

        const section =
            $("currentTopicSection");

        if (section) {

            section.innerHTML =
                `
                <div class="empty-state">
                    Create a study plan to begin.
                </div>
                `;

        }

        hideKnowledgeCheck();

        return;

    }


    const index =
        allTopics.findIndex(
            item =>
                topicKey(item) ===
                topicKey(topic)
        );


    if (index >= 0) {

        currentTopicIndex =
            index;

    }


    createStudySession(
        topic
    );


    const name =
        $("currentTopicName");

    const description =
        $("currentTopicDescription");

    const position =
        $("topicPosition");

    const badge =
        $("topicStatusBadge");


    if (name) {

        name.textContent =
            topicName(topic);

    }


    if (description) {

        description.textContent =
            "Study " +
            topicName(topic) +
            " for " +
            (
                topicSubject(topic) ||
                "this subject"
            ) +
            " and complete the knowledge check.";

    }


    if (position) {

        position.textContent =
            "TOPIC " +
            (
                currentTopicIndex + 1
            ) +
            " OF " +
            allTopics.length;

    }


    const completed =
        isTopicCompleted(
            topic
        );


    if (badge) {

        badge.textContent =
            completed
                ? "COMPLETED"
                : "IN PROGRESS";

    }


    const checkbox =
        $("topicCompleteCheckbox");

    const completionMessage =
        $("topicCompletionMessage");

    const nextTopicMessage =
        $("nextTopicMessage");


    if (checkbox) {

        checkbox.checked =
            completed;

        checkbox.disabled =
            completed;

    }


    if (completionMessage) {

        completionMessage.textContent =
            completed
                ? "Topic completed. Your knowledge check is available below."
                : "Mark this topic as finished after studying it.";

    }


    if (nextTopicMessage) {

        const next =
            allTopics[
                currentTopicIndex + 1
            ];

        nextTopicMessage.textContent =
            next
                ? "Next topic: " +
                  topicName(next)
                : allTopicsCompleted()
                    ? "You have completed every topic in this plan."
                    : "";

    }


    const checkButton =
        $("submitTopicQuestions");


    /*
       Existing HTML calls the button submitTopicQuestions.
       We turn it into the Knowledge Check entry point.
    */

    if (checkButton) {

        checkButton.textContent =
            hasCompletedKnowledgeCheck(
                topic
            )
                ? "Review Knowledge Check"
                : "Start Knowledge Check";

        checkButton.onclick =
            () =>
                openKnowledgeCheckPage(
                    topic
                );

    }


    /*
       Knowledge check is intentionally hidden until
       the topic has been marked complete.
    */

    if (
        completed &&
        !hasCompletedKnowledgeCheck(topic)
    ) {

        showKnowledgeCheck();

    } else if (
        completed &&
        hasCompletedKnowledgeCheck(topic)
    ) {

        showKnowledgeCheck();

    } else {

        hideKnowledgeCheck();

    }


    updateTimerDisplay();

    updateTimerButtons();

    restoreCurrentReading();

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


    markTopicCompleted(
        topic
    );


    if (
        currentStudySession
    ) {

        currentStudySession
            .readingCompleted =
            true;

        currentStudySession
            .updatedAt =
            new Date().toISOString();

    }


    const key =
        topicKey(topic);


    topicReadings[key] =
        {

            ...(topicReadings[key] || {}),

            topicKey: key,

            started: true,

            completed: true,

            progress: 100,

            updatedAt:
                new Date().toISOString()

        };


    writeJSON(
        STUDY_READINGS_KEY,
        topicReadings
    );


    updateStudyActivity();


    /*
       Move to the next incomplete topic,
       but don't force the user away from the
       completed topic.
    */

    const nextIndex =
        allTopics.findIndex(
            (item, index) =>
                index >
                    currentTopicIndex &&
                !isTopicCompleted(
                    item
                )
        );


    if (nextIndex >= 0) {

        currentTopicIndex =
            nextIndex;

    } else {

        const firstIncomplete =
            allTopics.findIndex(
                item =>
                    !isTopicCompleted(
                        item
                    )
            );

        if (
            firstIncomplete >= 0
        ) {

            currentTopicIndex =
                firstIncomplete;

        }

    }


    writeJSON(
        CURRENT_INDEX_KEY,
        currentTopicIndex
    );


    saveDashboardState();


    renderAll();


    if (
        allTopicsCompleted()
    ) {

        showCompletionCelebration();

    }

}


/* =========================================================
   COMPLETION CELEBRATION
========================================================= */

function showCompletionCelebration() {

    const shown =
        localStorage.getItem(
            CELEBRATION_KEY
        ) === "true";


    if (shown) {
        return;
    }


    localStorage.setItem(
        CELEBRATION_KEY,
        "true"
    );


    syncActivePlanRecord();


    setTimeout(
        () => {

            alert(
                "🎉 Congratulations! You completed every topic in your study plan."
            );

        },
        100
    );

}


/* =========================================================
   DAILY CHALLENGE
========================================================= */

function renderDailyChallenge() {

    const badge =
        $("dailyChallengeBadge");

    const text =
        $("dailyChallengeText");

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


    const topic =
        getCurrentTopic();


    if (!topic) {

        if (title) {
            title.textContent =
                "No challenge yet";
        }

        if (description) {
            description.textContent =
                "Create a study plan to begin.";
        }

        return;

    }


    const complete =
        isTopicCompleted(
            topic
        );


    if (badge) {

        badge.textContent =
            "TODAY";

    }


    if (text) {

        text.textContent =
            complete
                ? "Challenge completed!"
                : "Focus on one topic today.";

    }


    if (title) {

        title.textContent =
            topicName(topic);

    }


    if (description) {

        description.textContent =
            "Study " +
            topicName(topic) +
            " for " +
            (
                topicSubject(topic) ||
                "this subject"
            ) +
            " and complete the knowledge check.";

    }


    if (progress) {

        progress.textContent =
            complete
                ? "1 / 1 complete"
                : "0 / 1 complete";

    }


    if (progressBar) {

        progressBar.style.width =
            complete
                ? "100%"
                : "0%";

    }


    if (button) {

        button.textContent =
            complete
                ? "Completed"
                : "Start Challenge";


        button.onclick =
            () => {

                const index =
                    allTopics.findIndex(
                        item =>
                            topicKey(item) ===
                            topicKey(topic)
                    );

                if (index >= 0) {

                    currentTopicIndex =
                        index;

                    writeJSON(
                        CURRENT_INDEX_KEY,
                        currentTopicIndex
                    );

                }

                renderAll();

            };

    }

}


/* =========================================================
   CALENDAR
========================================================= */

function getExamDateObject() {

    if (
        !studyPlan?.examDate
    ) {
        return null;
    }

    const date =
        new Date(
            studyPlan.examDate +
            "T00:00:00"
        );

    return Number.isNaN(
        date.getTime()
    )
        ? null
        : date;

}


function getPlanStartDate() {

    /*
       Use explicit start date if present.
    */

    if (
        studyPlan?.startDate
    ) {

        const explicit =
            new Date(
                studyPlan.startDate +
                "T00:00:00"
            );

        if (
            !Number.isNaN(
                explicit.getTime()
            )
        ) {
            return explicit;
        }

    }


    /*
       Otherwise derive a sensible start from
       the exam date and number of topics.
    */

    const exam =
        getExamDateObject();

    if (!exam) {
        return new Date();
    }


    const topics =
        Math.max(
            1,
            allTopics.length
        );


    const start =
        new Date(exam);


    start.setDate(
        start.getDate() -
        Math.max(
            0,
            topics - 1
        )
    );


    return start;

}


function isStudyDay(date) {

    const exam =
        getExamDateObject();

    const start =
        getPlanStartDate();


    if (
        exam &&
        date > exam
    ) {
        return false;
    }


    if (
        date < start
    ) {
        return false;
    }


    if (
        exam &&
        sameDay(
            date,
            exam
        )
    ) {
        return false;
    }


    /*
       If the plan already contains a schedule,
       respect it.
    */

    const schedules =
        Array.isArray(
            studyPlan?.schedule
        )
            ? studyPlan.schedule
            : [];


    if (schedules.length) {

        return schedules.some(
            item => {

                const itemDate =
                    item?.date ||
                    item?.day;

                return (
                    itemDate &&
                    sameDay(
                        itemDate,
                        date
                    )
                );

            }
        );

    }


    /*
       Default:
       every day between start and exam is a study day.
    */

    return true;

}


function isRestDay(date) {

    const exam =
        getExamDateObject();

    if (
        exam &&
        sameDay(
            date,
            exam
        )
    ) {
        return false;
    }


    const start =
        getPlanStartDate();


    if (
        date < start
    ) {
        return false;
    }


    return !isStudyDay(
        date
    );

}


function renderCalendar() {

    const container =
        $("calendarDays");

    const monthLabel =
        $("calendarMonth");


    if (!container) {
        return;
    }


    const year =
        calendarDate.getFullYear();

    const month =
        calendarDate.getMonth();


    if (monthLabel) {

        monthLabel.textContent =
            calendarDate.toLocaleDateString(
                undefined,
                {
                    month: "long",
                    year: "numeric"
                }
            );

    }


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


    const startingDay =
        firstDay.getDay();


    const totalDays =
        lastDay.getDate();


    const cells = [];


    for (
        let i = 0;
        i < startingDay;
        i++
    ) {

        cells.push(
            `<div class="calendar-day empty"></div>`
        );

    }


    const exam =
        getExamDateObject();


    const today =
        new Date();


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


        const key =
            dateKey(date);


        const study =
            isStudyDay(date);

        const rest =
            isRestDay(date);

        const isExam =
            exam &&
            sameDay(
                date,
                exam
            );

        const afterExam =
            exam &&
            date > exam;


        const completedOnDay =
            study &&
            isDayCompleted(
                date
            );


        const todayClass =
            sameDay(
                date,
                today
            )
                ? "today"
                : "";


        let stateClass =
            "";

        if (afterExam) {

            stateClass =
                "after-exam";

        } else if (isExam) {

            stateClass =
                "exam-day";

        } else if (
            completedOnDay
        ) {

            stateClass =
                "completed-day";

        } else if (study) {

            stateClass =
                "study-day";

        } else if (rest) {

            stateClass =
                "rest-day";

        }


        cells.push(
            `
            <div
                class="calendar-day ${stateClass} ${todayClass}"
                data-date="${key}"
                title="${escapeHTML(
                    calendarTitle(
                        date,
                        stateClass
                    )
                )}"
            >
                <span>
                    ${day}
                </span>
            </div>
            `
        );

    }


    container.innerHTML =
        cells.join("");


    renderNextBooking();

}


function calendarTitle(
    date,
    state
) {

    if (
        state.includes(
            "exam"
        )
    ) {
        return "Exam day";
    }

    if (
        state.includes(
            "completed"
        )
    ) {
        return "Completed study day";
    }

    if (
        state.includes(
            "study"
        )
    ) {
        return "Study day";
    }

    if (
        state.includes(
            "rest"
        )
    ) {
        return "Rest day";
    }

    if (
        state.includes(
            "after"
        )
    ) {
        return "After exam";
    }

    return "No scheduled activity";

}


function isDayCompleted(date) {

    /*
       If all topics belonging to a scheduled day
       are complete, the day is considered complete.
    */

    if (
        sameDay(
            date,
            new Date()
        )
    ) {

        return allTopics.length > 0 &&
            allTopicsCompleted();

    }


    return false;

}


function renderNextBooking() {

    const nextBooking =
        $("nextBooking");

    const nextBookingTime =
        $("nextBookingTime");


    if (
        !nextBooking ||
        !nextBookingTime
    ) {
        return;
    }


    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    const exam =
        getExamDateObject();


    let nextDate =
        null;


    for (
        let offset = 0;
        offset <= 366;
        offset++
    ) {

        const candidate =
            new Date(today);


        candidate.setDate(
            today.getDate() +
            offset
        );


        if (
            exam &&
            candidate > exam
        ) {
            break;
        }


        if (
            isStudyDay(
                candidate
            )
        ) {

            nextDate =
                candidate;

            break;

        }

    }


    if (!nextDate) {

        nextBooking.textContent =
            "No upcoming study sessions";

        nextBookingTime.textContent =
            "";

        return;

    }


    nextBooking.textContent =
        "Next Up";

    nextBookingTime.textContent =
        formatShortDate(
            nextDate
        );

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


    const topic =
        getCurrentTopic();


    if (!topic) {

        container.innerHTML =
            `
            <div class="empty-schedule">
                Your daily study sessions will appear here.
            </div>
            `;

        return;

    }


    const hours =
        Number(
            studyPlan?.hoursPerDay
        ) || 0;


    const today =
        new Date();


    const exam =
        getExamDateObject();


    let status =
        "Study";


    if (
        exam &&
        sameDay(
            today,
            exam
        )
    ) {

        status =
            "Exam";

    } else if (
        exam &&
        today > exam
    ) {

        status =
            "Completed";

    }


    container.innerHTML =
        `
        <div class="schedule-item">

            <div class="schedule-date">
                ${escapeHTML(
                    formatShortDate(
                        today
                    )
                )}
            </div>

            <div class="schedule-topic">

                <strong>
                    📖 ${escapeHTML(
                        topicName(topic)
                    )}
                </strong>

                <span>
                    ${status}
                </span>

            </div>

            <div class="schedule-duration">
                ${
                    hours
                        ? hours + "h"
                        : ""
                }
            </div>

        </div>
        `;

}


/* =========================================================
   PLAN SWITCHER
========================================================= */

function calculatePlanCompletion(
    record
) {

    const plan =
        normalizePlan(
            record?.plan
        );

    if (!plan) {
        return 0;
    }


    const topics =
        plan.subjects
            .flatMap(
                subject =>
                    Array.isArray(
                        subject.topics
                    )
                        ? subject.topics
                        : []
            );


    if (!topics.length) {
        return 0;
    }


    const completed =
        Array.isArray(
            record?.completedTopics
        )
            ? record.completedTopics
            : [];


    const count =
        topics.filter(
            topic =>
                completed.includes(
                    topicKey(topic)
                ) ||
                completed.includes(
                    clean(topic.id)
                )
        ).length;


    return Math.round(
        (
            count /
            topics.length
        ) * 100
    );

}


function renderPlanSwitcher() {

    const candidates = [
        "#planList",
        "#studyPlanList",
        "#savedPlans",
        "#plansList"
    ];


    let container = null;


    for (
        const selector of
        candidates
    ) {

        const element =
            document.querySelector(
                selector
            );

        if (element) {

            container =
                element;

            break;

        }

    }


    if (!container) {
        return;
    }


    const plans =
        getSavedPlans();


    if (!plans.length) {

        container.innerHTML =
            `
            <div class="empty-state">
                No saved study plans.
            </div>
            `;

        return;

    }


    container.innerHTML =
        plans
            .map(
                record => {

                    const plan =
                        normalizePlan(
                            record.plan
                        );

                    const percent =
                        calculatePlanCompletion(
                            record
                        );

                    const active =
                        String(
                            record.id
                        ) ===
                        String(
                            activePlanId
                        );


                    return `
                    <div
                        class="saved-plan-card ${
                            active
                                ? "active"
                                : ""
                        }"
                        data-plan-id="${
                            escapeHTML(
                                record.id
                            )
                        }"
                    >

                        <div>
                            <strong>
                                ${escapeHTML(
                                    planTitle(
                                        plan
                                    )
                                )}
                            </strong>

                            <small>
                                ${
                                    plan?.topicNames
                                        ?.length || 0
                                } topic${
                                    (
                                        plan?.topicNames
                                            ?.length || 0
                                    ) === 1
                                        ? ""
                                        : "s"
                                }
                                •
                                Exam
                                ${
                                    escapeHTML(
                                        formatDate(
                                            plan?.examDate
                                        )
                                    )
                                }
                            </small>
                        </div>

                        <div>
                            ${
                                active
                                    ? "ACTIVE PLAN"
                                    : "Open Plan"
                            }
                            •
                            ${
                                percent
                            }%
                            complete
                            ${
                                percent === 100
                                    ? " ✓"
                                    : ""
                            }
                        </div>

                    </div>
                    `;

                }
            )
            .join("");


    container
        .querySelectorAll(
            "[data-plan-id]"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    () => {

                        const id =
                            element.dataset
                                .planId;

                        switchActivePlan(
                            id
                        );

                    }
                );

            }
        );

}


function switchActivePlan(id) {

    if (!id) {
        return;
    }


    const plans =
        getSavedPlans();


    const record =
        plans.find(
            item =>
                item &&
                String(item.id) ===
                String(id)
        );


    if (!record) {
        return;
    }


    /*
       Stop timer before switching plans.
    */

    pauseTimer();


    /*
       Persist the current plan first.
    */

    syncActivePlanRecord();


    /*
       Now switch.
    */

    setActivePlanId(
        record.id
    );


    activePlanId =
        String(record.id);


    studyPlan =
        normalizePlan(
            record.plan
        );


    if (!studyPlan) {
        return;
    }


    restorePlanState(
        record
    );


    buildPlanCollections();


    writeJSON(
        PLAN_KEY,
        studyPlan
    );


    writeJSON(
        LEGACY_PLAN_KEY,
        studyPlan
    );


    renderAll();

}


/* =========================================================
   THEME
========================================================= */

function applyTheme() {

    const theme =
        localStorage.getItem(
            THEME_KEY
        ) ||
        "dark";


    document.documentElement
        .setAttribute(
            "data-theme",
            theme
        );


    document.body?.classList.toggle(
        "light-mode",
        theme === "light"
    );


    const button =
        $("themeButton");

    if (button) {

        button.textContent =
            theme === "light"
                ? "☀️ Light Mode"
                : "🌙 Dark Mode";

    }

}


function toggleTheme() {

    const current =
        localStorage.getItem(
            THEME_KEY
        ) ||
        "dark";


    const next =
        current === "dark"
            ? "light"
            : "dark";


    localStorage.setItem(
        THEME_KEY,
        next
    );


    applyTheme();

}


/* =========================================================
   AUTH
========================================================= */

async function loadCurrentUser() {

    try {

        if (
            typeof supabase ===
            "undefined"
        ) {
            return null;
        }


        let client =
            supabase;


        if (
            supabase.auth &&
            typeof supabase.auth
                .getSession ===
                "function"
        ) {

            const result =
                await supabase.auth
                    .getSession();


            currentUser =
                result?.data?.session
                    ?.user || null;

        }

    } catch (error) {

        console.warn(
            "StudyMind: Could not load user",
            error
        );

    }


    return currentUser;

}


/* =========================================================
   AI FREE LIMIT
========================================================= */

function getTodayAIQuestionCount() {

    const today =
        dateKey(
            new Date()
        );

    const savedDate =
        localStorage.getItem(
            AI_DATE_KEY
        );


    if (
        savedDate !== today
    ) {

        localStorage.setItem(
            AI_DATE_KEY,
            today
        );

        localStorage.setItem(
            AI_COUNT_KEY,
            "0"
        );

        return 0;

    }


    return (
        Number(
            localStorage.getItem(
                AI_COUNT_KEY
            )
        ) || 0
    );

}


function canAskAI() {

    const premium =
        window.studyMindPremiumVerified === true ||
        window.studyMindIsPremium === true ||
        window.premiumUser === true;


    if (premium) {
        return true;
    }


    return (
        getTodayAIQuestionCount() <
        FREE_AI_LIMIT
    );

}


function incrementAIQuestionCount() {

    const current =
        getTodayAIQuestionCount();


    localStorage.setItem(
        AI_COUNT_KEY,
        String(
            current + 1
        )
    );

}


/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {

    if (!studyPlan) {
        return;
    }


    buildPlanCollections();


    renderStats();

    renderProgress();

    renderSubjects();

    renderTopics();

    renderCurrentTopic();

    renderDailyChallenge();

    renderCalendar();

    renderSchedule();

    renderPlanSwitcher();

    updateTimerDisplay();

    updateTimerButtons();

}


/* =========================================================
   EVENT BINDINGS
========================================================= */

function bindDashboardEvents() {

    const start =
        $("startTimerButton");

    const pause =
        $("pauseTimerButton");

    const reset =
        $("resetTimerButton");

    const duration =
        $("timerDuration");

    const checkbox =
        $("topicCompleteCheckbox");

    const previous =
        $("previousMonth");

    const next =
        $("nextMonth");

    const theme =
        $("themeButton");


    if (start) {

        start.onclick =
            startTimer;

    }


    if (pause) {

        pause.onclick =
            pauseTimer;

    }


    if (reset) {

        reset.onclick =
            resetTimer;

    }


    if (duration) {

        duration.addEventListener(
            "change",
            event =>
                changeTimerDuration(
                    event.target.value
                )
        );

    }


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


    if (previous) {

        previous.onclick =
            () => {

                calendarDate =
                    new Date(
                        calendarDate.getFullYear(),
                        calendarDate.getMonth() - 1,
                        1
                    );

                renderCalendar();

            };

    }


    if (next) {

        next.onclick =
            () => {

                calendarDate =
                    new Date(
                        calendarDate.getFullYear(),
                        calendarDate.getMonth() + 1,
                        1
                    );

                renderCalendar();

            };

    }


    if (theme) {

        theme.onclick =
            toggleTheme;

    }


    document.addEventListener(
        "visibilitychange",
        () => {

            if (
                document.hidden
            ) {

                saveDashboardState();

            }

        }
    );


    window.addEventListener(
        "beforeunload",
        () => {

            saveDashboardState();

        }
    );

}


/* =========================================================
   PERIODIC STATE SAVE
========================================================= */

function startStatePersistence() {

    if (stateSaveInterval) {

        clearInterval(
            stateSaveInterval
        );

    }


    stateSaveInterval =
        setInterval(
            () => {

                if (
                    studyPlan &&
                    activePlanId
                ) {

                    saveDashboardState();

                }

            },
            15000
        );

}


/* =========================================================
   INITIALIZATION
========================================================= */

async function initializeDashboard() {

    if (dashboardInitialized) {
        return;
    }


    dashboardInitialized = true;


    applyTheme();


    /*
       MOST IMPORTANT STEP:
       Load the active plan BEFORE rendering
       anything.
    */

    const loaded =
        loadActivePlan();


    if (!loaded) {

        console.warn(
            "StudyMind: Dashboard has no study plan."
        );


        const section =
            $("currentTopicSection");

        if (section) {

            section.innerHTML =
                `
                <div class="empty-state">

                    <h3>
                        No Study Plan Found
                    </h3>

                    <p>
                        Create a study plan from the Home page to begin studying.
                    </p>

                    <a
                        href="home.html#generator"
                        class="btn"
                    >
                        Create Study Plan
                    </a>

                </div>
                `;

        }

        return;

    }


    await loadCurrentUser();


    bindDashboardEvents();

    startReadingPersistence();

    startStatePersistence();


    /*
       Set timer selector to saved duration.
    */

    const duration =
        $("timerDuration");

    if (duration) {

        const minutes =
            selectedTimerSeconds /
            60;


        if (
            TIMER_OPTIONS.includes(
                minutes
            )
        ) {

            duration.value =
                String(minutes);

        }

    }


    renderAll();


    console.log(
        "StudyMind: Dashboard initialized successfully.",
        {
            activePlanId,
            plan:
                planTitle(studyPlan),
            examDate:
                studyPlan?.examDate,
            topics:
                allTopics.map(
                    topic =>
                        topicName(topic)
                )
        }
    );

}


/* =========================================================
   GLOBAL COMPATIBILITY API
========================================================= */

window.StudyMindDashboard = {

    getActivePlanId,
    setActivePlanId,

    getSavedPlans,
    saveSavedPlans,

    loadActivePlan,

    switchActivePlan,

    getCurrentTopic,

    markTopicCompleted,
    completeCurrentTopic,

    startTimer,
    pauseTimer,
    resetTimer,

    renderAll,

    saveDashboardState,

    syncActivePlanRecord,

    openKnowledgeCheckPage,

    canAskAI,
    getTodayAIQuestionCount,
    incrementAIQuestionCount

};


/* =========================================================
   START
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeDashboard,
        {
            once: true
        }
    );

} else {

    initializeDashboard();

}
