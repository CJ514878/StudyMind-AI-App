/* =========================================================
   STUDYMIND AI — DASHBOARD
   COMPLETE REPLACEMENT

   PRESERVES:
   - Current study topic
   - Topic completion
   - 5-question knowledge checks
   - Failed-question revision compatibility
   - Study timer: 25 / 45 / 60 minutes
   - Reading persistence
   - Study streak
   - Study score
   - AI question limit
   - Calendar
   - Daily challenge
   - Schedule
   - Light / dark mode
   - Supabase authentication
   - Legacy localStorage compatibility

   ADDS / FIXES:
   - Multiple study plans
   - Old study plans remain accessible
   - Active plan switching
   - Per-plan progress
   - Per-plan readings
   - Per-plan timer state
   - Glowing calendar
   - Blue study days
   - Green completed study days
   - Purple rest days
   - Red exam day
   - Grey days after exam
   - Today indicator
   - Completion based on ALL topics scheduled for that day
   - Full-plan completion celebration
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
   SETTINGS
========================================================= */

const FREE_AI_LIMIT =
    5;

const TIMER_OPTIONS =
    [25, 45, 60];

const DEFAULT_TIMER_SECONDS =
    25 * 60;


/* =========================================================
   GLOBAL STATE
========================================================= */

let studyPlan =
    null;

let subjects =
    [];

let allTopics =
    [];

let completedTopics =
    [];

let completedQuestionTopics =
    [];

let currentTopicIndex =
    0;

let timerSeconds =
    DEFAULT_TIMER_SECONDS;

let selectedTimerSeconds =
    DEFAULT_TIMER_SECONDS;

let timerInterval =
    null;

let timerRunning =
    false;

let calendarDate =
    new Date();

let currentUser =
    null;

let currentStudySession =
    null;

let topicReadings =
    {};

let activePlanId =
    null;

let readingObserver =
    null;

let readingPersistenceInterval =
    null;

let stateSaveInterval =
    null;

let dashboardInitialized =
    false;


/* =========================================================
   SHORTCUT
========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   BASIC HELPERS
========================================================= */

function clean(value) {

    return String(value ?? "")
        .replace(/\s+/g, " ")
        .trim();

}


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
            "StudyMind could not read:",
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

        return true;

    } catch (error) {

        console.error(
            "StudyMind could not save:",
            key,
            error
        );

        return false;

    }

}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function slug(value) {

    return clean(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

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


function dateKey(date) {

    const d =
        new Date(date);

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


function parseDate(value) {

    if (!value) {
        return null;
    }

    const date =
        new Date(
            `${value}T00:00:00`
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return null;
    }

    date.setHours(
        0,
        0,
        0,
        0
    );

    return date;

}


function todayDate() {

    const date =
        new Date();

    date.setHours(
        0,
        0,
        0,
        0
    );

    return date;

}


function sameDate(
    first,
    second
) {

    return (
        dateKey(first) ===
        dateKey(second)
    );

}


function formatClock(
    hour,
    minute = 0
) {

    let h =
        Number(hour);

    let m =
        Number(minute);

    if (
        !Number.isFinite(h)
    ) {
        h = 0;
    }

    if (
        !Number.isFinite(m)
    ) {
        m = 0;
    }

    h =
        ((h % 24) + 24) % 24;

    m =
        Math.max(
            0,
            Math.min(
                59,
                m
            )
        );

    const period =
        h >= 12
            ? "PM"
            : "AM";

    let displayHour =
        h % 12;

    if (
        displayHour === 0
    ) {
        displayHour = 12;
    }

    return (
        displayHour +
        ":" +
        String(m).padStart(2, "0") +
        " " +
        period
    );

}


function formatSeconds(
    seconds
) {

    seconds =
        Math.max(
            0,
            Math.floor(
                Number(seconds) || 0
            )
        );

    const minutes =
        Math.floor(
            seconds / 60
        );

    const remaining =
        seconds % 60;

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(remaining).padStart(2, "0")
    );

}


/* =========================================================
   TOPIC NORMALIZATION
========================================================= */

function topicKey(topic) {

    if (!topic) {
        return "";
    }

    return clean(
        topic.key ||
        topic.id ||
        (
            clean(topicSubject(topic)) +
            "::" +
            clean(topicName(topic))
        )
    );

}


function topicName(topic) {

    if (!topic) {
        return "Untitled Topic";
    }

    return clean(
        topic.name ||
        topic.title ||
        topic.topic ||
        "Untitled Topic"
    );

}


function topicSubject(topic) {

    if (!topic) {
        return "";
    }

    return clean(
        topic.subject ||
        topic.subjectName ||
        topic.parentSubject ||
        ""
    );

}


function normalizeTopic(
    topic,
    subjectName = ""
) {

    const name =
        topicName(topic);

    const subject =
        topicSubject(topic) ||
        clean(subjectName);

    return {

        ...topic,

        id:
            topic?.id ||
            createId("topic"),

        name,

        title:
            topic?.title ||
            name,

        subject,

        subjectName:
            topic?.subjectName ||
            subject,

        description:
            topic?.description ||
            `Study ${name} for ${subject}.`

    };

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

    const plan = {
        ...rawPlan
    };


    let normalizedSubjects =
        [];


    if (
        Array.isArray(
            plan.subjects
        )
    ) {

        normalizedSubjects =
            plan.subjects.map(
                (subject, index) => {

                    if (
                        typeof subject ===
                        "string"
                    ) {

                        return {

                            id:
                                `subject-${index + 1}-${slug(subject)}`,

                            name:
                                clean(subject),

                            topics:
                                []

                        };

                    }

                    const subjectName =
                        clean(
                            subject?.name ||
                            subject?.subject ||
                            subject?.title ||
                            `Subject ${index + 1}`
                        );


                    const rawTopics =
                        Array.isArray(
                            subject?.topics
                        )
                            ? subject.topics
                            : [];


                    return {

                        ...subject,

                        id:
                            subject?.id ||
                            `subject-${index + 1}-${slug(subjectName)}`,

                        name:
                            subjectName,

                        topics:
                            rawTopics.map(
                                topic =>
                                    normalizeTopic(
                                        topic,
                                        subjectName
                                    )
                            )

                    };

                }
            );

    }


    let normalizedTopics =
        [];


    normalizedSubjects.forEach(
        subject => {

            subject.topics.forEach(
                topic => {

                    normalizedTopics.push(
                        topic
                    );

                }
            );

        }
    );


    if (
        normalizedTopics.length === 0 &&
        Array.isArray(plan.topics)
    ) {

        normalizedTopics =
            plan.topics.map(
                topic =>
                    normalizeTopic(
                        topic,
                        topic?.subject || ""
                    )
            );

    }


    /*
       If subjects were missing but topics existed,
       reconstruct subjects.
    */

    if (
        normalizedSubjects.length === 0 &&
        normalizedTopics.length > 0
    ) {

        const subjectMap =
            new Map();


        normalizedTopics.forEach(
            topic => {

                const subjectName =
                    topicSubject(topic) ||
                    "General";

                if (
                    !subjectMap.has(
                        subjectName
                    )
                ) {

                    subjectMap.set(
                        subjectName,
                        {
                            id:
                                `subject-${slug(subjectName)}`,

                            name:
                                subjectName,

                            topics:
                                []
                        }
                    );

                }


                subjectMap
                    .get(subjectName)
                    .topics
                    .push(topic);

            }
        );


        normalizedSubjects =
            [...subjectMap.values()];

    }


    /*
       Remove duplicate topic keys.
    */

    const seen =
        new Set();


    normalizedTopics =
        normalizedTopics.filter(
            topic => {

                const key =
                    topicKey(topic);

                if (
                    !key ||
                    seen.has(key)
                ) {
                    return false;
                }

                seen.add(key);

                return true;

            }
        );


    const subjectNames =
        normalizedSubjects.map(
            subject =>
                subject.name
        );


    plan.subjects =
        normalizedSubjects;

    plan.topics =
        normalizedTopics;

    plan.subjectNames =
        Array.isArray(
            plan.subjectNames
        )
            ? plan.subjectNames
            : subjectNames;

    plan.topicNames =
        normalizedTopics.map(
            topic =>
                topicName(topic)
        );


    return plan;

}


/* =========================================================
   MULTI-PLAN SYSTEM
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

    return writeJSON(
        PLANS_KEY,
        Array.isArray(plans)
            ? plans
            : []
    );

}


function getActivePlanId() {

    return (
        localStorage.getItem(
            ACTIVE_PLAN_KEY
        ) ||
        null
    );

}


function setActivePlanId(
    id
) {

    if (!id) {

        localStorage.removeItem(
            ACTIVE_PLAN_KEY
        );

        activePlanId =
            null;

        return;

    }

    localStorage.setItem(
        ACTIVE_PLAN_KEY,
        id
    );

    activePlanId =
        id;

}


function planTitle(
    plan
) {

    if (!plan) {
        return "Study Plan";
    }


    if (
        clean(plan.title)
    ) {

        return clean(
            plan.title
        );

    }


    const names =
        Array.isArray(
            plan.subjectNames
        )
            ? plan.subjectNames
                .filter(Boolean)
            : [];


    if (
        names.length === 1
    ) {

        return (
            names[0] +
            " Study Plan"
        );

    }


    if (
        names.length > 1
    ) {

        return (
            names
                .slice(0, 2)
                .join(" + ") +
            (
                names.length > 2
                    ? " + More"
                    : ""
            ) +
            " Study Plan"
        );

    }


    if (
        clean(plan.curriculum)
    ) {

        return (
            clean(
                plan.curriculum
            ) +
            " Study Plan"
        );

    }


    return "Study Plan";

}


function ensurePlanRegistry() {

    let plans =
        getSavedPlans();


    const currentPlan =
        readJSON(
            PLAN_KEY,
            null
        );


    let activeId =
        getActivePlanId();


    /*
       If there is no current plan, there is nothing
       to migrate.
    */

    if (!currentPlan) {

        if (
            activeId &&
            !plans.some(
                plan =>
                    plan.id === activeId
            )
        ) {

            setActivePlanId(
                null
            );

        }

        return plans;

    }


    /*
       If the active plan already exists, keep it.
    */

    if (
        activeId &&
        plans.some(
            plan =>
                plan.id === activeId
        )
    ) {

        return plans;

    }


    /*
       Older StudyMind versions may have a plan but
       no multi-plan record yet.
    */

    const migratedId =
        createId("plan");


    const migrated = {

        id:
            migratedId,

        plan:
            normalizePlan(
                currentPlan
            ),

        completedTopics:
            readJSON(
                COMPLETED_KEY,
                []
            ),

        completedQuestionTopics:
            readJSON(
                COMPLETED_Q_KEY,
                []
            ),

        currentTopicIndex:
            Number(
                localStorage.getItem(
                    CURRENT_INDEX_KEY
                ) || 0
            ),

        knowledgeTopic:
            readJSON(
                KNOWLEDGE_TOPIC_KEY,
                null
            ),

        knowledgeQuestions:
            readJSON(
                KNOWLEDGE_QUESTIONS_KEY,
                null
            ),

        celebrationShown:
            localStorage.getItem(
                CELEBRATION_KEY
            ) === "true",

        studySession:
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
                ) || 0
            ),

        timerDuration:
            Number(
                localStorage.getItem(
                    TIMER_DURATION_KEY
                ) || 0
            ),

        createdAt:
            currentPlan.createdAt ||
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString(),

        title:
            planTitle(
                currentPlan
            )

    };


    plans.unshift(
        migrated
    );


    saveSavedPlans(
        plans
    );


    setActivePlanId(
        migratedId
    );


    return plans;

}


/* =========================================================
   CAPTURE ACTIVE PLAN STATE
========================================================= */

function captureActivePlanState() {

    if (!studyPlan) {
        return null;
    }


    return {

        id:
            activePlanId ||
            createId("plan"),

        plan:
            normalizePlan(
                studyPlan
            ),

        completedTopics:
            Array.isArray(
                completedTopics
            )
                ? [
                    ...completedTopics
                ]
                : [],

        completedQuestionTopics:
            Array.isArray(
                completedQuestionTopics
            )
                ? [
                    ...completedQuestionTopics
                ]
                : [],

        currentTopicIndex:
            Number(
                currentTopicIndex
            ) || 0,

        knowledgeTopic:
            readJSON(
                KNOWLEDGE_TOPIC_KEY,
                null
            ),

        knowledgeQuestions:
            readJSON(
                KNOWLEDGE_QUESTIONS_KEY,
                null
            ),

        celebrationShown:
            localStorage.getItem(
                CELEBRATION_KEY
            ) === "true",

        studySession:
            currentStudySession
                ? {
                    ...currentStudySession
                }
                : null,

        topicReadings:
            topicReadings &&
            typeof topicReadings === "object"
                ? {
                    ...topicReadings
                }
                : {},

        timerSeconds:
            Number(
                timerSeconds
            ) || 0,

        timerDuration:
            Number(
                selectedTimerSeconds
            ) || 0,

        createdAt:
            studyPlan.createdAt ||
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString(),

        title:
            planTitle(
                studyPlan
            )

    };

}


function syncActivePlanRecord() {

    if (
        !studyPlan ||
        !activePlanId
    ) {
        return;
    }


    const state =
        captureActivePlanState();


    if (!state) {
        return;
    }


    const plans =
        getSavedPlans();


    const index =
        plans.findIndex(
            plan =>
                plan &&
                plan.id ===
                activePlanId
        );


    if (index >= 0) {

        plans[index] =
            state;

    } else {

        plans.unshift(
            state
        );

    }


    saveSavedPlans(
        plans
    );

}


function saveLegacyState() {

    if (studyPlan) {

        writeJSON(
            PLAN_KEY,
            studyPlan
        );

        writeJSON(
            LEGACY_PLAN_KEY,
            studyPlan
        );

    }


    writeJSON(
        COMPLETED_KEY,
        completedTopics
    );

    writeJSON(
        COMPLETED_Q_KEY,
        completedQuestionTopics
    );


    localStorage.setItem(
        CURRENT_INDEX_KEY,
        String(
            currentTopicIndex
        )
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
        String(
            timerSeconds
        )
    );


    localStorage.setItem(
        TIMER_DURATION_KEY,
        String(
            selectedTimerSeconds
        )
    );

}


/* =========================================================
   LOAD ACTIVE PLAN
========================================================= */

function loadActivePlan() {

    let plans =
        ensurePlanRegistry();


    if (
        plans.length === 0
    ) {

        studyPlan =
            normalizePlan(
                readJSON(
                    PLAN_KEY,
                    readJSON(
                        LEGACY_PLAN_KEY,
                        null
                    )
                )
            );

        if (!studyPlan) {
            return false;
        }


        const record = {

            id:
                createId("plan"),

            plan:
                studyPlan,

            completedTopics:
                readJSON(
                    COMPLETED_KEY,
                    []
                ),

            completedQuestionTopics:
                readJSON(
                    COMPLETED_Q_KEY,
                    []
                ),

            currentTopicIndex:
                Number(
                    localStorage.getItem(
                        CURRENT_INDEX_KEY
                    ) || 0
                ),

            knowledgeTopic:
                readJSON(
                    KNOWLEDGE_TOPIC_KEY,
                    null
                ),

            knowledgeQuestions:
                readJSON(
                    KNOWLEDGE_QUESTIONS_KEY,
                    null
                ),

            celebrationShown:
                localStorage.getItem(
                    CELEBRATION_KEY
                ) === "true",

            studySession:
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
                    ) || DEFAULT_TIMER_SECONDS
                ),

            timerDuration:
                Number(
                    localStorage.getItem(
                        TIMER_DURATION_KEY
                    ) || DEFAULT_TIMER_SECONDS
                ),

            createdAt:
                studyPlan.createdAt ||
                new Date().toISOString(),

            updatedAt:
                new Date().toISOString(),

            title:
                planTitle(
                    studyPlan
                )

        };


        plans.unshift(
            record
        );

        saveSavedPlans(
            plans
        );

        setActivePlanId(
            record.id
        );

    }


    let id =
        getActivePlanId();


    let record =
        plans.find(
            item =>
                item &&
                item.id === id
        );


    if (!record) {

        record =
            plans[0];

        if (record) {

            setActivePlanId(
                record.id
            );

        }

    }


    if (!record) {
        return false;
    }


    activePlanId =
        record.id;


    studyPlan =
        normalizePlan(
            record.plan
        );


    if (!studyPlan) {
        return false;
    }


    subjects =
        Array.isArray(
            studyPlan.subjects
        )
            ? studyPlan.subjects
            : [];


    allTopics =
        Array.isArray(
            studyPlan.topics
        )
            ? studyPlan.topics
            : [];


    completedTopics =
        Array.isArray(
            record.completedTopics
        )
            ? [
                ...record.completedTopics
            ]
            : [];


    completedQuestionTopics =
        Array.isArray(
            record.completedQuestionTopics
        )
            ? [
                ...record.completedQuestionTopics
            ]
            : [];


    currentTopicIndex =
        Number(
            record.currentTopicIndex
        ) || 0;


    topicReadings =
        record.topicReadings &&
        typeof record.topicReadings === "object"
            ? {
                ...record.topicReadings
            }
            : {};


    currentStudySession =
        record.studySession &&
        typeof record.studySession === "object"
            ? {
                ...record.studySession
            }
            : null;


    timerSeconds =
        Number(
            record.timerSeconds
        );


    if (
        !Number.isFinite(
            timerSeconds
        ) ||
        timerSeconds <= 0
    ) {

        timerSeconds =
            DEFAULT_TIMER_SECONDS;

    }


    selectedTimerSeconds =
        Number(
            record.timerDuration
        );


    if (
        !TIMER_OPTIONS.includes(
            selectedTimerSeconds / 60
        )
    ) {

        selectedTimerSeconds =
            DEFAULT_TIMER_SECONDS;

    }


    /*
       Restore legacy keys so other StudyMind pages
       continue working.
    */

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


    localStorage.setItem(
        CURRENT_INDEX_KEY,
        String(
            currentTopicIndex
        )
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
        String(
            timerSeconds
        )
    );


    localStorage.setItem(
        TIMER_DURATION_KEY,
        String(
            selectedTimerSeconds
        )
    );


    if (
        record.knowledgeTopic
    ) {

        writeJSON(
            KNOWLEDGE_TOPIC_KEY,
            record.knowledgeTopic
        );

    }


    if (
        record.knowledgeQuestions
    ) {

        writeJSON(
            KNOWLEDGE_QUESTIONS_KEY,
            record.knowledgeQuestions
        );

    }


    localStorage.setItem(
        CELEBRATION_KEY,
        record.celebrationShown
            ? "true"
            : "false"
    );


    return true;

}


/* =========================================================
   SAVE EVERYTHING
========================================================= */

function saveDashboardState() {

    saveLegacyState();

    syncActivePlanRecord();

}


/* =========================================================
   COMPLETION HELPERS
========================================================= */

function isTopicCompleted(
    topic
) {

    const key =
        topicKey(topic);

    const id =
        clean(
            topic?.id
        );

    return (
        completedTopics.includes(key) ||
        (
            id &&
            completedTopics.includes(id)
        )
    );

}


function markTopicCompleted(
    topic
) {

    const key =
        topicKey(topic);

    if (!key) {
        return;
    }


    if (
        !completedTopics.includes(
            key
        )
    ) {

        completedTopics.push(
            key
        );

    }


    const id =
        clean(
            topic?.id
        );


    if (
        id &&
        !completedTopics.includes(
            id
        )
    ) {

        completedTopics.push(
            id
        );

    }

}


function completedTopicCount() {

    return allTopics.filter(
        topic =>
            isTopicCompleted(
                topic
            )
    ).length;

}


function allTopicsCompleted() {

    return (
        allTopics.length > 0 &&
        completedTopicCount() >=
            allTopics.length
    );

}


/* =========================================================
   CURRENT TOPIC
========================================================= */

function getCurrentTopic() {

    if (
        !allTopics.length
    ) {
        return null;
    }


    /*
       Saved study session has priority.
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


    /*
       Stored index next.
    */

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


    /*
       Otherwise find the first incomplete topic.
    */

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


function createStudySession(
    topic
) {

    if (!topic) {
        return;
    }


    currentStudySession = {

        topicKey:
            topicKey(topic),

        topicId:
            topic.id || "",

        topicName:
            topicName(topic),

        subject:
            topicSubject(topic),

        topicIndex:
            allTopics.findIndex(
                item =>
                    topicKey(item) ===
                    topicKey(topic)
            ),

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


    return (
        topicReadings[
            topicKey(topic)
        ] ||
        null
    );

}


function saveCurrentReading() {

    const element =
        findReadingElement();

    const topic =
        getCurrentTopic();


    if (
        !element ||
        !topic
    ) {
        return;
    }


    const html =
        element.innerHTML || "";

    const text =
        clean(
            element.textContent || ""
        );


    /*
       Do not overwrite a saved reading with an
       empty DOM element.
    */

    if (
        !html.trim() &&
        !text.trim()
    ) {
        return;
    }


    topicReadings[
        topicKey(topic)
    ] = {

        topicKey:
            topicKey(topic),

        topicId:
            topic.id || "",

        topicName:
            topicName(topic),

        subject:
            topicSubject(topic),

        readingHTML:
            html,

        readingText:
            text,

        readingStarted:
            true,

        readingSavedAt:
            new Date().toISOString()

    };


    if (currentStudySession) {

        currentStudySession
            .readingStarted =
            true;

        currentStudySession
            .updatedAt =
            new Date().toISOString();

    }


    writeJSON(
        STUDY_READINGS_KEY,
        topicReadings
    );

    writeJSON(
        STUDY_SESSION_KEY,
        currentStudySession
    );


    syncActivePlanRecord();

}


function restoreCurrentReading() {

    const element =
        findReadingElement();

    const topic =
        getCurrentTopic();


    if (
        !element ||
        !topic
    ) {
        return false;
    }


    const saved =
        topicReadings[
            topicKey(topic)
        ];


    if (!saved) {
        return false;
    }


    /*
       Only restore when the page has not already
       populated fresh content.
    */

    const existingText =
        clean(
            element.textContent || ""
        );


    if (
        existingText
    ) {
        return false;
    }


    if (
        saved.readingHTML
    ) {

        element.innerHTML =
            saved.readingHTML;

    }


    return true;

}


function startReadingPersistence() {

    if (
        readingObserver
    ) {

        try {
            readingObserver.disconnect();
        } catch (_) {}

    }


    if (
        readingPersistenceInterval
    ) {

        clearInterval(
            readingPersistenceInterval
        );

    }


    const attempt =
        () => {

            const element =
                findReadingElement();

            if (!element) {
                return;
            }


            restoreCurrentReading();


            if (
                readingObserver
            ) {
                return;
            }


            readingObserver =
                new MutationObserver(
                    function() {

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

        };


    attempt();


    readingPersistenceInterval =
        setInterval(
            attempt,
            1000
        );

}


document.addEventListener(
    "visibilitychange",
    function() {

        if (
            document.visibilityState ===
            "hidden"
        ) {

            saveCurrentReading();
            saveDashboardState();

        }

    }
);


window.addEventListener(
    "beforeunload",
    function() {

        saveCurrentReading();
        saveDashboardState();

    }
);


/* =========================================================
   AUTHENTICATION
========================================================= */

async function checkAuthentication() {

    if (
        !window.supabaseClient ||
        !window.supabaseClient.auth
    ) {

        console.warn(
            "StudyMind: Supabase client not available yet."
        );

        return null;

    }


    try {

        const {
            data,
            error
        } =
            await window.supabaseClient
                .auth
                .getUser();


        if (error) {

            console.warn(
                "StudyMind authentication error:",
                error
            );

            return null;

        }


        currentUser =
            data?.user ||
            null;


        return currentUser;

    } catch (error) {

        console.error(
            "StudyMind authentication failed:",
            error
        );

        return null;

    }

}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutStudyMind() {

    saveCurrentReading();
    saveDashboardState();
    stopTimer();


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

        console.error(
            "Logout error:",
            error
        );

    }


    window.location.href =
        "login.html";

}


/* =========================================================
   STATS
========================================================= */

function renderStats() {

    if (!studyPlan) {
        return;
    }


    const hours =
        Number(
            studyPlan.hoursPerDay ||
            studyPlan.studyHours ||
            0
        );


    const examDate =
        parseDate(
            studyPlan.examDate
        );


    const today =
        todayDate();


    let daysLeft =
        0;


    if (examDate) {

        daysLeft =
            Math.max(
                0,
                Math.ceil(
                    (
                        examDate.getTime() -
                        today.getTime()
                    ) /
                    86400000
                )
            );

    }


    const weeklyHours =
        hours * 7;


    const completed =
        completedTopicCount();


    const total =
        allTopics.length;


    const progress =
        total > 0
            ? Math.round(
                (
                    completed /
                    total
                ) * 100
            )
            : 0;


    if ($("weeklyHours")) {

        $("weeklyHours")
            .textContent =
            String(
                weeklyHours
            );

    }


    if ($("daysLeft")) {

        $("daysLeft")
            .textContent =
            String(
                daysLeft
            );

    }


    if ($("dailyGoal")) {

        $("dailyGoal")
            .textContent =
            `${hours} hr${hours === 1 ? "" : "s"}`;

    }


    if ($("progressPercent")) {

        $("progressPercent")
            .textContent =
            `${progress}%`;

    }


    if ($("progressCount")) {

        $("progressCount")
            .textContent =
            `${completed} of ${total} topic${total === 1 ? "" : "s"} completed`;

    }


    if ($("progressBar")) {

        $("progressBar")
            .style.width =
            `${progress}%`;

    }


    const score =
        calculateStudyScore();


    if ($("studyScore")) {

        $("studyScore")
            .textContent =
            String(score);

    }

}


function calculateStudyScore() {

    if (
        !allTopics.length
    ) {
        return 0;
    }


    const topicProgress =
        (
            completedTopicCount() /
            allTopics.length
        ) * 80;


    const questionProgress =
        (
            completedQuestionTopics
                .filter(
                    key =>
                        allTopics.some(
                            topic =>
                                topicKey(topic) ===
                                key ||
                                topic.id === key
                        )
                )
                .length /
            allTopics.length
        ) * 20;


    return Math.round(
        Math.min(
            100,
            topicProgress +
            questionProgress
        )
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


    if (
        subjects.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-schedule">
                No subjects available yet.
            </div>
        `;

        return;

    }


    container.innerHTML =
        subjects
            .map(
                subject => {

                    const topicCount =
                        Array.isArray(
                            subject.topics
                        )
                            ? subject.topics.length
                            : 0;


                    const completed =
                        Array.isArray(
                            subject.topics
                        )
                            ? subject.topics.filter(
                                topic =>
                                    isTopicCompleted(
                                        topic
                                    )
                            ).length
                            : 0;


                    const percentage =
                        topicCount
                            ? Math.round(
                                (
                                    completed /
                                    topicCount
                                ) * 100
                            )
                            : 0;


                    return `

                        <div
                            class="subject-item"
                            style="
                                margin-bottom:14px;
                                padding:16px;
                                border-radius:16px;
                                border:1px solid rgba(127,127,127,.16);
                            "
                        >

                            <div
                                style="
                                    display:flex;
                                    justify-content:space-between;
                                    gap:12px;
                                    align-items:center;
                                "
                            >

                                <strong>
                                    📚 ${escapeHTML(
                                        subject.name
                                    )}
                                </strong>

                                <span>
                                    ${percentage}%
                                </span>

                            </div>

                            <div
                                style="
                                    margin-top:9px;
                                    opacity:.7;
                                    font-size:.88rem;
                                "
                            >
                                ${completed} of ${topicCount} topics completed
                            </div>

                        </div>

                    `;

                }
            )
            .join("");

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


    if (
        allTopics.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-schedule">
                Create a study plan to add topics.
            </div>
        `;

        return;

    }


    container.innerHTML =
        allTopics
            .map(
                (topic, index) => {

                    const done =
                        isTopicCompleted(
                            topic
                        );


                    const current =
                        index ===
                        currentTopicIndex;


                    return `

                        <div
                            class="dashboard-topic-item ${done ? "completed" : ""} ${current ? "current" : ""}"
                            data-topic-index="${index}"
                            style="
                                display:flex;
                                align-items:center;
                                gap:12px;
                                padding:14px;
                                margin-bottom:9px;
                                border-radius:14px;
                                border:1px solid rgba(127,127,127,.16);
                                cursor:pointer;
                                transition:.2s ease;
                            "
                        >

                            <div
                                style="
                                    width:32px;
                                    height:32px;
                                    min-width:32px;
                                    border-radius:50%;
                                    display:grid;
                                    place-items:center;
                                    background:${done ? "rgba(34,197,94,.18)" : "rgba(59,130,246,.14)"};
                                "
                            >
                                ${done ? "✓" : index + 1}
                            </div>

                            <div style="flex:1;">

                                <strong>
                                    ${escapeHTML(
                                        topicName(topic)
                                    )}
                                </strong>

                                <div
                                    style="
                                        opacity:.68;
                                        font-size:.82rem;
                                        margin-top:3px;
                                    "
                                >
                                    ${escapeHTML(
                                        topicSubject(topic)
                                    )}
                                </div>

                            </div>

                            <span
                                style="
                                    font-size:.78rem;
                                    opacity:.72;
                                "
                            >
                                ${done ? "Completed" : "Study"}
                            </span>

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
                    function() {

                        const index =
                            Number(
                                element.dataset.topicIndex
                            );


                        if (
                            !Number.isInteger(
                                index
                            ) ||
                            !allTopics[index]
                        ) {
                            return;
                        }


                        saveCurrentReading();


                        currentTopicIndex =
                            index;


                        createStudySession(
                            allTopics[index]
                        );


                        saveDashboardState();


                        renderAll();

                    }
                );

            }
        );

}


/* =========================================================
   CURRENT TOPIC RENDER
========================================================= */

function renderCurrentTopic() {

    const topic =
        getCurrentTopic();


    if (!topic) {

        if ($("currentTopicName")) {

            $("currentTopicName")
                .textContent =
                "No topic available";

        }

        if ($("currentTopicDescription")) {

            $("currentTopicDescription")
                .textContent =
                "Create a study plan with topics to begin.";

        }

        return;

    }


    currentTopicIndex =
        allTopics.findIndex(
            item =>
                topicKey(item) ===
                topicKey(topic)
        );


    createStudySession(
        topic
    );


    const completed =
        isTopicCompleted(
            topic
        );


    if ($("currentTopicName")) {

        $("currentTopicName")
            .textContent =
            topicName(topic);

    }


    if ($("currentTopicDescription")) {

        $("currentTopicDescription")
            .textContent =
            topic.description ||
            `Study ${topicName(topic)} for ${topicSubject(topic)} and complete the knowledge check.`;

    }


    if ($("topicPosition")) {

        $("topicPosition")
            .textContent =
            `TOPIC ${currentTopicIndex + 1} OF ${allTopics.length}`;

    }


    if ($("topicStatusBadge")) {

        $("topicStatusBadge")
            .textContent =
            completed
                ? "COMPLETED"
                : "IN PROGRESS";

    }


    if ($("topicCompleteCheckbox")) {

        $("topicCompleteCheckbox")
            .checked =
            completed;

    }


    if ($("topicCompletionMessage")) {

        $("topicCompletionMessage")
            .textContent =
            completed
                ? "This topic has been completed."
                : "Tick this box when you are done studying this topic.";

    }


    if ($("nextTopicMessage")) {

        const next =
            allTopics.find(
                item =>
                    !isTopicCompleted(
                        item
                    )
            );


        if (
            next &&
            topicKey(next) !==
            topicKey(topic)
        ) {

            $("nextTopicMessage")
                .textContent =
                `Next topic: ${topicName(next)}`;

        } else if (
            allTopicsCompleted()
        ) {

            $("nextTopicMessage")
                .textContent =
                "🎉 You have completed every topic in this study plan.";

        } else {

            $("nextTopicMessage")
                .textContent =
                "";

        }

    }


    hideKnowledgeCheck();

    /*
       Restore persisted reading after the DOM has had
       time to render.
    */

    setTimeout(
        restoreCurrentReading,
        150
    );


    setTimeout(
        restoreCurrentReading,
        700
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


    saveCurrentReading();


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
            .completedAt =
            new Date().toISOString();

    }


    /*
       Register study completion with the separate
       streak system when available.
    */

    if (
        typeof window.registerStudyCompletion ===
        "function"
    ) {

        try {

            window.registerStudyCompletion();

        } catch (error) {

            console.warn(
                "Could not register study streak:",
                error
            );

        }

    } else {

        localStorage.setItem(
            LAST_STUDY_KEY,
            dateKey(
                new Date()
            )
        );

    }


    /*
       Find next incomplete topic.
    */

    const nextIndex =
        allTopics.findIndex(
            (item, index) =>
                index > currentTopicIndex &&
                !isTopicCompleted(
                    item
                )
        );


    const fallbackIndex =
        allTopics.findIndex(
            item =>
                !isTopicCompleted(
                    item
                )
        );


    const chosenIndex =
        nextIndex >= 0
            ? nextIndex
            : fallbackIndex;


    saveDashboardState();


    /*
       The topic that was just completed gets its
       knowledge check immediately.
    */

    openKnowledgeCheckPage(
        topic
    );


    /*
       If knowledge-check page is blocked because of
       a limit, the dashboard still retains completion.
    */

    if (
        chosenIndex >= 0
    ) {

        currentTopicIndex =
            chosenIndex;

        createStudySession(
            allTopics[
                chosenIndex
            ]
        );

    } else {

        currentTopicIndex =
            Math.max(
                0,
                allTopics.length - 1
            );

        currentStudySession = {

            topicKey:
                topicKey(topic),

            topicId:
                topic.id || "",

            topicName:
                topicName(topic),

            subject:
                topicSubject(topic),

            topicIndex:
                currentTopicIndex,

            readingCompleted:
                true,

            completedAt:
                new Date().toISOString()

        };

    }


    stopTimer();

    saveDashboardState();

    renderAll();


    /*
       Full plan celebration is triggered when every
       topic has been completed.
    */

    if (
        allTopicsCompleted()
    ) {

        setTimeout(
            maybeShowCompletionCelebration,
            300
        );

    }

}


/* =========================================================
   KNOWLEDGE CHECK
========================================================= */

function hideKnowledgeCheck() {

    const section =
        $("topicQuestionsSection");

    if (section) {

        section.style.display =
            "none";

    }

}


function openKnowledgeCheckPage(
    topic
) {

    if (!topic) {
        return;
    }


    /*
       Preserve the exact topic information expected
       by knowledge-check.html.
    */

    writeJSON(
        KNOWLEDGE_TOPIC_KEY,
        {

            id:
                topic.id || "",

            key:
                topicKey(topic),

            name:
                topicName(topic),

            title:
                topic.title ||
                topicName(topic),

            subject:
                topicSubject(topic),

            description:
                topic.description ||
                "",

            checkId:
                topicKey(topic)

        }
    );


    /*
       Do not delete existing questions.

       This allows the knowledge-check page to use
       already-generated questions and failed-question
       revision data.
    */

    const existingQuestions =
        readJSON(
            KNOWLEDGE_QUESTIONS_KEY,
            null
        );


    if (
        !existingQuestions
    ) {

        writeJSON(
            KNOWLEDGE_QUESTIONS_KEY,
            {
                topicKey:
                    topicKey(topic),

                topicName:
                    topicName(topic),

                subject:
                    topicSubject(topic),

                questions:
                    [],

                questionCount:
                    5,

                revisionQuestions:
                    []

            }
        );

    }


    saveDashboardState();


    /*
       Knowledge checks remain five questions.
    */

    window.location.href =
        "knowledge-check.html";

}


/* =========================================================
   COMPLETION CELEBRATION
========================================================= */

function injectCelebrationCSS() {

    if (
        document.getElementById(
            "studymindCelebrationCSS"
        )
    ) {
        return;
    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "studymindCelebrationCSS";


    style.textContent = `

        #studyMindCelebrationOverlay {
            position:fixed;
            inset:0;
            z-index:99999;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:24px;
            background:rgba(2,6,23,.82);
            backdrop-filter:blur(14px);
            animation:studyMindFadeIn .25s ease;
        }

        #studyMindCelebrationCard {
            width:min(520px,100%);
            padding:42px 30px;
            text-align:center;
            border-radius:28px;
            border:1px solid rgba(255,255,255,.18);
            background:linear-gradient(
                145deg,
                rgba(15,23,42,.98),
                rgba(30,41,59,.96)
            );
            box-shadow:
                0 0 30px rgba(59,130,246,.3),
                0 0 80px rgba(34,197,94,.18),
                0 30px 100px rgba(0,0,0,.45);
            animation:studyMindPop .45s cubic-bezier(.2,.8,.2,1);
        }

        #studyMindCelebrationEmoji {
            font-size:64px;
            margin-bottom:14px;
            animation:studyMindBounce 1.2s ease infinite;
        }

        #studyMindCelebrationCard h2 {
            margin:0 0 10px;
            font-size:2rem;
        }

        #studyMindCelebrationCard p {
            opacity:.78;
            line-height:1.7;
        }

        #studyMindCelebrationClose {
            margin-top:22px;
            border:0;
            border-radius:14px;
            padding:13px 22px;
            cursor:pointer;
            font-weight:700;
        }

        @keyframes studyMindFadeIn {
            from { opacity:0; }
            to { opacity:1; }
        }

        @keyframes studyMindPop {
            from {
                opacity:0;
                transform:scale(.86) translateY(20px);
            }
            to {
                opacity:1;
                transform:scale(1) translateY(0);
            }
        }

        @keyframes studyMindBounce {
            0%,100% {
                transform:translateY(0) rotate(0);
            }
            50% {
                transform:translateY(-9px) rotate(-4deg);
            }
        }

    `;


    document.head.appendChild(
        style
    );

}


function maybeShowCompletionCelebration() {

    if (
        !allTopicsCompleted()
    ) {
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


    injectCelebrationCSS();


    const old =
        $("studyMindCelebrationOverlay");


    if (old) {
        old.remove();
    }


    const overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "studyMindCelebrationOverlay";


    overlay.innerHTML = `

        <div
            id="studyMindCelebrationCard"
            role="dialog"
            aria-modal="true"
        >

            <div id="studyMindCelebrationEmoji">
                🎉
            </div>

            <h2>
                Study Plan Complete!
            </h2>

            <p>
                Amazing work! You have completed
                every topic in this study plan.
            </p>

            <p>
                Your calendar will now show your
                completed study days in glowing green.
            </p>

            <button
                id="studyMindCelebrationClose"
            >
                Continue Studying
            </button>

        </div>

    `;


    document.body.appendChild(
        overlay
    );


    const close =
        $("studyMindCelebrationClose");


    if (close) {

        close.addEventListener(
            "click",
            function() {

                overlay.remove();

            }
        );

    }

}


/* =========================================================
   CALENDAR CSS
========================================================= */

function injectCalendarCSS() {

    if (
        document.getElementById(
            "studymindCalendarGlowCSS"
        )
    ) {
        return;
    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "studymindCalendarGlowCSS";


    style.textContent = `

        /* =================================================
           STUDYMIND GLOWING CALENDAR
        ================================================= */

        #calendarDays .calendar-day {
            position:relative;
            min-height:52px;
            border-radius:15px;
            transition:
                transform .2s ease,
                box-shadow .2s ease,
                border-color .2s ease,
                background .2s ease;
            border:1px solid rgba(148,163,184,.16);
            overflow:visible;
        }

        #calendarDays .calendar-day:hover {
            transform:translateY(-2px);
        }

        /* BLUE — STUDY DAY */

        #calendarDays .calendar-day.study-day,
        #calendarDays .calendar-day.study-day.study {
            background:
                radial-gradient(
                    circle at 50% 20%,
                    rgba(59,130,246,.30),
                    rgba(30,64,175,.12)
                ) !important;

            border-color:
                rgba(59,130,246,.85) !important;

            color:
                #dbeafe !important;

            box-shadow:
                0 0 8px rgba(59,130,246,.75),
                0 0 22px rgba(59,130,246,.48),
                inset 0 0 15px rgba(59,130,246,.12) !important;
        }

        /* GREEN — COMPLETED STUDY DAY */

        #calendarDays .calendar-day.completed-study-day,
        #calendarDays .calendar-day.completed-day {
            background:
                radial-gradient(
                    circle at 50% 20%,
                    rgba(34,197,94,.36),
                    rgba(21,128,61,.14)
                ) !important;

            border-color:
                rgba(34,197,94,.95) !important;

            color:
                #dcfce7 !important;

            box-shadow:
                0 0 9px rgba(34,197,94,.85),
                0 0 26px rgba(34,197,94,.60),
                0 0 48px rgba(34,197,94,.25),
                inset 0 0 17px rgba(34,197,94,.14) !important;
        }

        /* PURPLE — REST DAY */

        #calendarDays .calendar-day.rest-day {
            background:
                radial-gradient(
                    circle at 50% 20%,
                    rgba(168,85,247,.34),
                    rgba(126,34,206,.13)
                ) !important;

            border-color:
                rgba(168,85,247,.85) !important;

            color:
                #f3e8ff !important;

            box-shadow:
                0 0 8px rgba(168,85,247,.75),
                0 0 22px rgba(168,85,247,.46),
                inset 0 0 15px rgba(168,85,247,.12) !important;
        }

        /* RED — EXAM DAY */

        #calendarDays .calendar-day.exam-day {
            background:
                radial-gradient(
                    circle at 50% 20%,
                    rgba(239,68,68,.42),
                    rgba(153,27,27,.16)
                ) !important;

            border-color:
                rgba(239,68,68,1) !important;

            color:
                #fee2e2 !important;

            box-shadow:
                0 0 10px rgba(239,68,68,.95),
                0 0 28px rgba(239,68,68,.70),
                0 0 55px rgba(239,68,68,.30),
                inset 0 0 18px rgba(239,68,68,.14) !important;
        }

        /* GREY — AFTER EXAM */

        #calendarDays .calendar-day.after-exam {
            background:
                rgba(100,116,139,.14) !important;

            border-color:
                rgba(100,116,139,.28) !important;

            color:
                rgba(203,213,225,.45) !important;

            box-shadow:
                none !important;
            opacity:.58;
        }

        /* TODAY INDICATOR */

        #calendarDays .calendar-day.today::after {
            content:"";
            position:absolute;
            inset:-4px;
            border-radius:18px;
            border:2px solid rgba(255,255,255,.92);
            box-shadow:
                0 0 8px rgba(255,255,255,.85),
                0 0 18px rgba(255,255,255,.35);
            pointer-events:none;
        }

        #calendarDays .calendar-day.today .calendar-day-number {
            font-weight:900;
        }

        /* OLD MONTH DAYS */

        #calendarDays .calendar-day.other-month {
            opacity:.25;
            box-shadow:none !important;
        }

        /* CALENDAR LEGEND */

        .calendar-legend .legend-dot {
            display:inline-block;
            width:10px;
            height:10px;
            border-radius:50%;
            margin-right:5px;
        }

        .calendar-legend .study-dot {
            background:#3b82f6;
            box-shadow:
                0 0 7px rgba(59,130,246,.9);
        }

        .calendar-legend .completed-dot {
            background:#22c55e;
            box-shadow:
                0 0 7px rgba(34,197,94,.9);
        }

        .calendar-legend .exam-dot {
            background:#ef4444;
            box-shadow:
                0 0 7px rgba(239,68,68,.9);
        }

        .calendar-legend .break-dot {
            background:#a855f7;
            box-shadow:
                0 0 7px rgba(168,85,247,.9);
        }

        .calendar-legend .today-dot {
            background:#fff;
            box-shadow:
                0 0 7px rgba(255,255,255,.9);
        }

        /* PLAN TABS */

        #studyMindPlanTabs {
            margin:0 0 26px;
            padding:16px;
            border-radius:20px;
            border:1px solid rgba(127,127,127,.18);
            background:rgba(127,127,127,.05);
        }

        .studyMind-plan-tabs-header {
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:14px;
            margin-bottom:14px;
            flex-wrap:wrap;
        }

        .studyMind-plan-tabs-title {
            font-weight:800;
            font-size:1.05rem;
        }

        .studyMind-new-plan-tab {
            display:inline-flex;
            align-items:center;
            justify-content:center;
            gap:7px;
            padding:9px 14px;
            border-radius:12px;
            text-decoration:none;
            font-weight:700;
            border:1px solid rgba(59,130,246,.35);
            background:rgba(59,130,246,.12);
        }

        .studyMind-plan-tab-list {
            display:flex;
            gap:10px;
            overflow-x:auto;
            padding-bottom:3px;
        }

        .studyMind-plan-tab {
            min-width:180px;
            padding:12px 14px;
            border-radius:15px;
            border:1px solid rgba(127,127,127,.18);
            background:rgba(127,127,127,.06);
            cursor:pointer;
            text-align:left;
            transition:.2s ease;
        }

        .studyMind-plan-tab:hover {
            transform:translateY(-2px);
        }

        .studyMind-plan-tab.active {
            border-color:rgba(59,130,246,.85);
            box-shadow:
                0 0 12px rgba(59,130,246,.35);
            background:rgba(59,130,246,.12);
        }

        .studyMind-plan-tab-title {
            display:block;
            font-weight:800;
            margin-bottom:5px;
        }

        .studyMind-plan-tab-meta {
            display:block;
            font-size:.78rem;
            opacity:.68;
        }

        .studyMind-plan-tab-progress {
            margin-top:8px;
            height:5px;
            border-radius:99px;
            overflow:hidden;
            background:rgba(127,127,127,.16);
        }

        .studyMind-plan-tab-progress span {
            display:block;
            height:100%;
            border-radius:99px;
            background:#3b82f6;
        }

        .studyMind-plan-tab-open {
            margin-top:8px;
            display:block;
            font-size:.75rem;
            font-weight:800;
            opacity:.72;
        }

    `;


    document.head.appendChild(
        style
    );

}


/* =========================================================
   CALENDAR TOPIC SCHEDULING
========================================================= */

/*
   The generated plan gives us topics, an exam date and
   a study start date.

   We assign topics to actual STUDY DAYS.

   Weekends are treated as rest days.

   A day becomes GREEN only when every topic assigned
   to that day has been completed.

   A study day with unfinished assigned topics stays BLUE.
*/

function getStudyStartDate() {

    return (
        parseDate(
            studyPlan?.studyStartDate
        ) ||
        todayDate()
    );

}


function getExamDate() {

    return parseDate(
        studyPlan?.examDate
    );

}


function isRestDate(
    date
) {

    /*
       Sunday and Saturday are rest days.
    */

    const day =
        date.getDay();

    return (
        day === 0 ||
        day === 6
    );

}


function getStudyDates() {

    const dates = [];

    const start =
        getStudyStartDate();

    const exam =
        getExamDate();


    if (!start) {
        return dates;
    }


    const end =
        exam ||
        new Date(
            start.getTime() +
            30 * 86400000
        );


    const cursor =
        new Date(start);


    cursor.setHours(
        0,
        0,
        0,
        0
    );


    while (
        cursor < end
    ) {

        if (
            !isRestDate(cursor)
        ) {

            dates.push(
                new Date(cursor)
            );

        }


        cursor.setDate(
            cursor.getDate() + 1
        );

    }


    return dates;

}


function getTopicScheduleMap() {

    const map = {};


    if (
        !allTopics.length
    ) {
        return map;
    }


    const studyDates =
        getStudyDates();


    if (
        studyDates.length === 0
    ) {
        return map;
    }


    /*
       Spread topics across available study days.

       If there are fewer study days than topics,
       multiple topics are assigned to a day.

       If there are more study days than topics,
       later study days remain available for revision.
    */

    const topicsPerDay =
        Math.max(
            1,
            Math.ceil(
                allTopics.length /
                studyDates.length
            )
        );


    allTopics.forEach(
        (topic, index) => {

            let dayIndex =
                Math.floor(
                    index /
                    topicsPerDay
                );


            if (
                dayIndex >=
                studyDates.length
            ) {

                dayIndex =
                    studyDates.length - 1;

            }


            const key =
                dateKey(
                    studyDates[
                        dayIndex
                    ]
                );


            if (
                !map[key]
            ) {

                map[key] = [];

            }


            map[key].push(
                topic
            );

        }
    );


    /*
       If the plan has extra days, use them as
       revision/study days. They have no assigned
       topic and therefore remain BLUE until the
       user actually completes topics assigned to them.
    */

    return map;

}


function getTopicsScheduledForDate(
    date
) {

    const map =
        getTopicScheduleMap();


    return (
        map[
            dateKey(date)
        ] ||
        []
    );

}


function isStudyDate(
    date
) {

    const exam =
        getExamDate();


    if (
        exam &&
        sameDate(
            date,
            exam
        )
    ) {
        return false;
    }


    if (
        exam &&
        date > exam
    ) {
        return false;
    }


    return (
        !isRestDate(date)
    );

}


/* =========================================================
   CALENDAR DAY COMPLETION
========================================================= */

function isStudyDayCompleted(
    date
) {

    const scheduled =
        getTopicsScheduledForDate(
            date
        );


    /*
       A study day must have assigned topics.
    */

    if (
        scheduled.length === 0
    ) {
        return false;
    }


    /*
       EVERY assigned topic must be completed.
    */

    return scheduled.every(
        topic =>
            isTopicCompleted(
                topic
            )
    );

}


/* =========================================================
   CALENDAR
========================================================= */

function renderCalendar() {

    injectCalendarCSS();


    const container =
        $("calendarDays");

    if (!container) {
        return;
    }


    const year =
        calendarDate.getFullYear();

    const month =
        calendarDate.getMonth();


    const monthName =
        calendarDate.toLocaleDateString(
            undefined,
            {
                month: "long",
                year: "numeric"
            }
        );


    if ($("calendarMonth")) {

        $("calendarMonth")
            .textContent =
            monthName;

    }


    container.innerHTML =
        "";


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


    const firstWeekday =
        firstDay.getDay();


    const daysInMonth =
        lastDay.getDate();


    const previousMonthLast =
        new Date(
            year,
            month,
            0
        ).getDate();


    const totalCells =
        Math.ceil(
            (
                firstWeekday +
                daysInMonth
            ) / 7
        ) * 7;


    const examDate =
        getExamDate();

    const today =
        todayDate();


    for (
        let cell = 0;
        cell < totalCells;
        cell++
    ) {

        let dayNumber;
        let cellDate;
        let otherMonth =
            false;


        if (
            cell <
            firstWeekday
        ) {

            dayNumber =
                previousMonthLast -
                firstWeekday +
                cell +
                1;


            cellDate =
                new Date(
                    year,
                    month - 1,
                    dayNumber
                );


            otherMonth =
                true;

        } else if (
            cell >=
            firstWeekday +
            daysInMonth
        ) {

            dayNumber =
                cell -
                (
                    firstWeekday +
                    daysInMonth
                ) +
                1;


            cellDate =
                new Date(
                    year,
                    month + 1,
                    dayNumber
                );


            otherMonth =
                true;

        } else {

            dayNumber =
                cell -
                firstWeekday +
                1;


            cellDate =
                new Date(
                    year,
                    month,
                    dayNumber
                );

        }


        cellDate.setHours(
            0,
            0,
            0,
            0
        );


        const element =
            document.createElement(
                "div"
            );


        element.className =
            "calendar-day";


        if (
            otherMonth
        ) {

            element.classList.add(
                "other-month"
            );

        }


        /*
           TODAY
        */

        if (
            sameDate(
                cellDate,
                today
            )
        ) {

            element.classList.add(
                "today"
            );

        }


        /*
           EXAM DAY
        */

        if (
            examDate &&
            sameDate(
                cellDate,
                examDate
            )
        ) {

            element.classList.add(
                "exam-day"
            );

        }


        /*
           AFTER EXAM
        */

        if (
            examDate &&
            cellDate > examDate
        ) {

            element.classList.add(
                "after-exam"
            );

        }


        /*
           REST DAY
        */

        if (
            !otherMonth &&
            !(
                examDate &&
                cellDate >= examDate
            ) &&
            isRestDate(cellDate)
        ) {

            element.classList.add(
                "rest-day"
            );

        }


        /*
           STUDY DAY
        */

        if (
            !otherMonth &&
            isStudyDate(cellDate)
        ) {

            element.classList.add(
                "study-day"
            );


            /*
               COMPLETED STUDY DAY
            */

            if (
                isStudyDayCompleted(
                    cellDate
                )
            ) {

                element.classList.add(
                    "completed-study-day"
                );

            }

        }


        const scheduled =
            getTopicsScheduledForDate(
                cellDate
            );


        let stateLabel =
            "";


        if (
            examDate &&
            sameDate(
                cellDate,
                examDate
            )
        ) {

            stateLabel =
                "Exam Day";

        } else if (
            examDate &&
            cellDate > examDate
        ) {

            stateLabel =
                "After Exam";

        } else if (
            isRestDate(cellDate)
        ) {

            stateLabel =
                "Rest Day";

        } else if (
            isStudyDayCompleted(
                cellDate
            )
        ) {

            stateLabel =
                "Completed";

        } else {

            stateLabel =
                "Study Day";

        }


        element.innerHTML = `

            <div
                class="calendar-day-number"
                style="
                    position:relative;
                    z-index:2;
                    font-weight:700;
                "
            >
                ${dayNumber}
            </div>

            <div
                style="
                    position:relative;
                    z-index:2;
                    margin-top:3px;
                    font-size:.58rem;
                    opacity:.7;
                    white-space:nowrap;
                "
            >
                ${stateLabel}
            </div>

        `;


        /*
           Tooltip with assigned topics.
        */

        if (
            scheduled.length > 0
        ) {

            element.title =
                scheduled
                    .map(
                        topic =>
                            `${isTopicCompleted(topic) ? "✓" : "○"} ${topicName(topic)}`
                    )
                    .join("\n");

        } else {

            element.title =
                stateLabel;

        }


        container.appendChild(
            element
        );

    }

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
            studyPlan?.studyHours ||
            1
        );


    const startTime =
        clean(
            studyPlan?.startTime
        ) ||
        "16:00";


    const parts =
        startTime.split(":");


    let startHour =
        Number(
            parts[0]
        );


    let startMinute =
        Number(
            parts[1] || 0
        );


    if (
        !Number.isFinite(
            startHour
        )
    ) {
        startHour = 16;
    }


    if (
        !Number.isFinite(
            startMinute
        )
    ) {
        startMinute = 0;
    }


    const scheduledTopics =
        getTopicsScheduledForDate(
            todayDate()
        );


    /*
       If today is a rest day, still show useful
       information instead of pretending it is a study day.
    */

    if (
        isRestDate(
            todayDate()
        )
    ) {

        container.innerHTML = `

            <div
                class="empty-schedule"
                style="
                    padding:20px;
                    border-radius:16px;
                    border:1px solid rgba(168,85,247,.28);
                    background:rgba(168,85,247,.08);
                "
            >
                🟣 Today is a rest day. Take a break and
                come back ready for your next study session.
            </div>

        `;

        renderNextSession();

        return;

    }


    const sessions =
        Math.max(
            1,
            Math.floor(
                hours
            )
        );


    const topicPool =
        scheduledTopics.length
            ? scheduledTopics
            : [topic];


    let html =
        "";


    for (
        let i = 0;
        i < sessions;
        i++
    ) {

        const hour =
            startHour + i;


        const sessionTopic =
            topicPool[
                i %
                topicPool.length
            ];


        html += `

            <div
                class="schedule-item"
                style="
                    display:flex;
                    gap:14px;
                    align-items:center;
                    padding:15px;
                    margin-bottom:10px;
                    border-radius:16px;
                    border:1px solid rgba(127,127,127,.16);
                "
            >

                <div
                    style="
                        min-width:85px;
                        font-weight:800;
                    "
                >
                    ${formatClock(
                        hour,
                        startMinute
                    )}
                </div>

                <div
                    style="
                        width:1px;
                        align-self:stretch;
                        background:rgba(127,127,127,.18);
                    "
                ></div>

                <div>

                    <strong>
                        ${escapeHTML(
                            topicName(
                                sessionTopic
                            )
                        )}
                    </strong>

                    <div
                        style="
                            margin-top:4px;
                            font-size:.8rem;
                            opacity:.68;
                        "
                    >
                        ${escapeHTML(
                            topicSubject(
                                sessionTopic
                            )
                        )}
                    </div>

                </div>

            </div>

        `;

    }


    container.innerHTML =
        html;


    renderNextSession();

}


function renderNextSession() {

    if (
        !$("nextBooking") ||
        !$("nextBookingTime")
    ) {
        return;
    }


    const topic =
        getCurrentTopic();


    if (!topic) {

        $("nextBooking")
            .textContent =
            "No upcoming session yet";

        $("nextBookingTime")
            .textContent =
            "Create a study plan to populate your calendar.";

        return;

    }


    const today =
        todayDate();


    if (
        isRestDate(today)
    ) {

        $("nextBooking")
            .textContent =
            "Next study day";

        $("nextBookingTime")
            .textContent =
            "Your current topic is ready for your next study session.";

        return;

    }


    $("nextBooking")
        .textContent =
        topicName(topic);


    $("nextBookingTime")
        .textContent =
        `${topicSubject(topic)} • ${studyPlan?.startTime || "4:00 PM"}`;

}


/* =========================================================
   DAILY CHALLENGE
========================================================= */

function renderDailyChallenge() {

    const completed =
        isTodayChallengeComplete();


    if ($("dailyChallengeBadge")) {

        $("dailyChallengeBadge")
            .textContent =
            completed
                ? "COMPLETED"
                : "TODAY";

    }


    if ($("dailyChallengeTitle")) {

        $("dailyChallengeTitle")
            .textContent =
            completed
                ? "🎉 Challenge Complete"
                : "📚 Complete Today's Topic";

    }


    if ($("dailyChallengeDescription")) {

        $("dailyChallengeDescription")
            .textContent =
            completed
                ? "You completed today's study challenge. Keep your streak alive!"
                : "Study your current topic and complete it to make today's study day count.";

    }


    if ($("dailyChallengeProgress")) {

        $("dailyChallengeProgress")
            .textContent =
            completed
                ? "100%"
                : "0%";

    }


    if ($("dailyChallengeProgressBar")) {

        $("dailyChallengeProgressBar")
            .style.width =
            completed
                ? "100%"
                : "0%";

    }


    if ($("dailyChallengeButton")) {

        $("dailyChallengeButton")
            .textContent =
            completed
                ? "✓ Challenge Complete"
                : "🚀 Start Challenge";

        $("dailyChallengeButton")
            .disabled =
            completed;

    }


    if ($("dailyChallengeText")) {

        $("dailyChallengeText")
            .textContent =
            completed
                ? "Great work — today's challenge is complete."
                : "Complete today's study challenge to build your consistency.";

    }

}


function isTodayChallengeComplete() {

    const today =
        todayDate();


    const scheduled =
        getTopicsScheduledForDate(
            today
        );


    /*
       On a rest day the challenge is not a
       mandatory study challenge.
    */

    if (
        isRestDate(today)
    ) {
        return false;
    }


    if (
        scheduled.length === 0
    ) {

        const topic =
            getCurrentTopic();

        return (
            topic &&
            isTopicCompleted(
                topic
            )
        );

    }


    return scheduled.every(
        topic =>
            isTopicCompleted(
                topic
            )
    );

}


/* =========================================================
   TIMER
========================================================= */

function updateTimerDisplay() {

    if ($("studyTimer")) {

        $("studyTimer")
            .textContent =
            formatSeconds(
                timerSeconds
            );

    }


    if ($("startTimerButton")) {

        $("startTimerButton")
            .disabled =
            timerRunning;

    }


    if ($("pauseTimerButton")) {

        $("pauseTimerButton")
            .disabled =
            !timerRunning;

    }

}


function saveTimerState() {

    localStorage.setItem(
        TIMER_SECONDS_KEY,
        String(
            timerSeconds
        )
    );


    localStorage.setItem(
        TIMER_DURATION_KEY,
        String(
            selectedTimerSeconds
        )
    );


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


    updateTimerDisplay();


    timerInterval =
        setInterval(
            function() {

                timerSeconds =
                    Math.max(
                        0,
                        timerSeconds - 1
                    );


                updateTimerDisplay();
                saveTimerState();


                if (
                    timerSeconds <= 0
                ) {

                    stopTimer();


                    if (
                        $("studyTimer")
                    ) {

                        $("studyTimer")
                            .textContent =
                            "00:00";

                    }


                    alert(
                        "⏰ Study timer complete! Great work."
                    );

                }

            },
            1000
        );

}


function pauseTimer() {

    if (!timerRunning) {
        return;
    }


    timerRunning =
        false;


    if (
        timerInterval
    ) {

        clearInterval(
            timerInterval
        );

        timerInterval =
            null;

    }


    saveTimerState();

    updateTimerDisplay();

}


function stopTimer() {

    timerRunning =
        false;


    if (
        timerInterval
    ) {

        clearInterval(
            timerInterval
        );

        timerInterval =
            null;

    }


    updateTimerDisplay();

}


function resetTimer() {

    stopTimer();


    timerSeconds =
        selectedTimerSeconds;


    saveTimerState();

    updateTimerDisplay();

}


function changeTimerDuration(
    minutes
) {

    minutes =
        Number(minutes);


    if (
        !TIMER_OPTIONS.includes(
            minutes
        )
    ) {

        minutes = 25;

    }


    selectedTimerSeconds =
        minutes * 60;


    timerSeconds =
        selectedTimerSeconds;


    stopTimer();

    saveTimerState();

    updateTimerDisplay();

}


/* =========================================================
   AI QUESTION LIMIT
========================================================= */

function getTodayString() {

    return dateKey(
        new Date()
    );

}


function getAIQuestionCount() {

    const savedDate =
        localStorage.getItem(
            AI_DATE_KEY
        );


    const today =
        getTodayString();


    if (
        savedDate !==
        today
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


    return Number(
        localStorage.getItem(
            AI_COUNT_KEY
        ) || 0
    );

}


function getRemainingAIQuestions() {

    return Math.max(
        0,
        FREE_AI_LIMIT -
        getAIQuestionCount()
    );

}


function hasFreeAIQuestionsLeft() {

    return (
        getRemainingAIQuestions() > 0
    );

}


function recordAIQuestion() {

    const count =
        getAIQuestionCount() + 1;


    localStorage.setItem(
        AI_DATE_KEY,
        getTodayString()
    );


    localStorage.setItem(
        AI_COUNT_KEY,
        String(count)
    );


    return count;

}


function showPremiumMessage() {

    const message =
        document.createElement(
            "div"
        );


    message.style.cssText = `

        position:fixed;
        left:50%;
        bottom:28px;
        transform:translateX(-50%);
        z-index:99999;
        width:min(430px,calc(100% - 30px));
        padding:20px;
        border-radius:18px;
        background:rgba(15,23,42,.97);
        border:1px solid rgba(59,130,246,.5);
        box-shadow:
            0 0 25px rgba(59,130,246,.25),
            0 20px 50px rgba(0,0,0,.4);
        color:white;
        text-align:center;

    `;


    message.innerHTML = `

        <strong style="font-size:1.05rem;">
            🔒 Free AI limit reached
        </strong>

        <p style="opacity:.75;line-height:1.6;">
            You have used all ${FREE_AI_LIMIT}
            free AI questions for today.
        </p>

        <button
            id="studyMindPremiumClose"
            style="
                padding:10px 18px;
                border:0;
                border-radius:10px;
                cursor:pointer;
                font-weight:700;
            "
        >
            Got it
        </button>

    `;


    document.body.appendChild(
        message
    );


    setTimeout(
        () => {

            message.remove();

        },
        6000
    );


    const close =
        $("studyMindPremiumClose");


    if (close) {

        close.addEventListener(
            "click",
            () => message.remove()
        );

    }

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


    const light =
        theme === "light";


    document.documentElement
        .classList
        .toggle(
            "light-mode",
            light
        );


    document.documentElement
        .classList
        .toggle(
            "dark-mode",
            !light
        );


    document.body
        ?.classList
        .toggle(
            "light-mode",
            light
        );


    document.body
        ?.classList
        .toggle(
            "dark-mode",
            !light
        );


    document.documentElement
        .style
        .colorScheme =
        light
            ? "light"
            : "dark";


    updateThemeButton();

}


function toggleTheme() {

    const current =
        localStorage.getItem(
            THEME_KEY
        ) ||
        "dark";


    localStorage.setItem(
        THEME_KEY,
        current === "dark"
            ? "light"
            : "dark"
    );


    applyTheme();

}


function updateThemeButton() {

    const button =
        $("themeButton");


    if (!button) {
        return;
    }


    const light =
        document.body
            ?.classList
            .contains(
                "light-mode"
            );


    button.textContent =
        light
            ? "🌙 Dark Mode"
            : "☀️ Light Mode";

}


/* =========================================================
   MULTI-PLAN TABS
========================================================= */

function injectPlanTabs() {

    injectCalendarCSS();


    const heading =
        document.querySelector(
            ".dashboard-heading"
        );


    if (!heading) {
        return;
    }


    let wrapper =
        $("studyMindPlanTabs");


    if (!wrapper) {

        wrapper =
            document.createElement(
                "section"
            );

        wrapper.id =
            "studyMindPlanTabs";


        heading.insertAdjacentElement(
            "afterend",
            wrapper
        );

    }


    const plans =
        getSavedPlans();


    if (
        plans.length === 0
    ) {

        wrapper.innerHTML = "";

        return;

    }


    wrapper.innerHTML = `

        <div class="studyMind-plan-tabs-header">

            <div>

                <div
                    class="studyMind-plan-tabs-title"
                >
                    📚 My Study Plans
                </div>

                <div
                    style="
                        opacity:.68;
                        font-size:.82rem;
                        margin-top:4px;
                    "
                >
                    Switch between your current and previous plans without losing progress.
                </div>

            </div>

            <a
                href="home.html#generator"
                class="studyMind-new-plan-tab"
            >
                ＋ New Study Plan
            </a>

        </div>

        <div class="studyMind-plan-tab-list">

            ${plans
                .map(
                    record => {

                        const plan =
                            normalizePlan(
                                record.plan
                            );


                        const topics =
                            Array.isArray(
                                plan?.topics
                            )
                                ? plan.topics
                                : [];


                        const completed =
                            Array.isArray(
                                record.completedTopics
                            )
                                ? topics.filter(
                                    topic =>
                                        (
                                            record.completedTopics
                                                .includes(
                                                    topicKey(topic)
                                                ) ||
                                            record.completedTopics
                                                .includes(
                                                    topic.id
                                                )
                                        )
                                ).length
                                : 0;


                        const percentage =
                            topics.length
                                ? Math.round(
                                    (
                                        completed /
                                        topics.length
                                    ) * 100
                                )
                                : 0;


                        const active =
                            record.id ===
                            activePlanId;


                        const exam =
                            clean(
                                plan?.examDate
                            );


                        return `

                            <button
                                type="button"
                                class="studyMind-plan-tab ${active ? "active" : ""}"
                                data-plan-id="${escapeHTML(record.id)}"
                            >

                                <span
                                    class="studyMind-plan-tab-title"
                                >
                                    ${active ? "✓ " : ""}
                                    ${escapeHTML(
                                        record.title ||
                                        planTitle(plan)
                                    )}
                                </span>

                                <span
                                    class="studyMind-plan-tab-meta"
                                >
                                    ${topics.length}
                                    topic${topics.length === 1 ? "" : "s"}
                                    ${exam ? ` • Exam ${escapeHTML(exam)}` : ""}
                                </span>

                                <div
                                    class="studyMind-plan-tab-progress"
                                >
                                    <span
                                        style="width:${percentage}%"
                                    ></span>
                                </div>

                                <span
                                    class="studyMind-plan-tab-open"
                                >
                                    ${active ? "ACTIVE PLAN" : "Open Plan"}
                                    • ${percentage}% complete
                                </span>

                            </button>

                        `;

                    }
                )
                .join("")}

        </div>

    `;


    wrapper
        .querySelectorAll(
            "[data-plan-id]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function() {

                        const id =
                            button.dataset.planId;


                        if (
                            !id ||
                            id ===
                            activePlanId
                        ) {
                            return;
                        }


                        switchStudyPlan(
                            id
                        );

                    }
                );

            }
        );

}


function switchStudyPlan(
    planId
) {

    if (
        !planId ||
        planId === activePlanId
    ) {
        return;
    }


    const plans =
        getSavedPlans();


    const target =
        plans.find(
            record =>
                record.id ===
                planId
        );


    if (!target) {

        alert(
            "That study plan could not be found."
        );

        return;

    }


    /*
       Save everything belonging to the current
       plan BEFORE switching.
    */

    saveCurrentReading();
    stopTimer();
    saveDashboardState();


    /*
       Change active plan.
    */

    setActivePlanId(
        planId
    );


    /*
       Load the selected plan's own state.
    */

    if (
        !loadActivePlan()
    ) {

        alert(
            "This study plan could not be loaded."
        );

        return;

    }


    /*
       Reset calendar view to the selected plan's
       exam/start month.
    */

    calendarDate =
        getStudyStartDate();


    startReadingPersistence();

    renderAll();

}


/* =========================================================
   CALENDAR NAVIGATION
========================================================= */

function previousMonth() {

    calendarDate =
        new Date(
            calendarDate.getFullYear(),
            calendarDate.getMonth() - 1,
            1
        );


    renderCalendar();

}


function nextMonth() {

    calendarDate =
        new Date(
            calendarDate.getFullYear(),
            calendarDate.getMonth() + 1,
            1
        );


    renderCalendar();

}


/* =========================================================
   EVENT CONNECTIONS
========================================================= */

function bindEvents() {

    const checkbox =
        $("topicCompleteCheckbox");


    if (
        checkbox &&
        checkbox.dataset.connected !== "true"
    ) {

        checkbox.dataset.connected =
            "true";


        checkbox.addEventListener(
            "change",
            function() {

                if (
                    checkbox.checked
                ) {

                    completeCurrentTopic();

                }

            }
        );

    }


    const start =
        $("startTimerButton");


    if (
        start &&
        start.dataset.connected !== "true"
    ) {

        start.dataset.connected =
            "true";


        start.addEventListener(
            "click",
            startTimer
        );

    }


    const pause =
        $("pauseTimerButton");


    if (
        pause &&
        pause.dataset.connected !== "true"
    ) {

        pause.dataset.connected =
            "true";


        pause.addEventListener(
            "click",
            pauseTimer
        );

    }


    const reset =
        $("resetTimerButton");


    if (
        reset &&
        reset.dataset.connected !== "true"
    ) {

        reset.dataset.connected =
            "true";


        reset.addEventListener(
            "click",
            resetTimer
        );

    }


    const duration =
        $("timerDuration");


    if (
        duration &&
        duration.dataset.connected !== "true"
    ) {

        duration.dataset.connected =
            "true";


        duration.addEventListener(
            "change",
            function() {

                changeTimerDuration(
                    duration.value
                );

            }
        );

    }


    const previous =
        $("previousMonth");


    if (
        previous &&
        previous.dataset.connected !== "true"
    ) {

        previous.dataset.connected =
            "true";


        previous.addEventListener(
            "click",
            previousMonth
        );

    }


    const next =
        $("nextMonth");


    if (
        next &&
        next.dataset.connected !== "true"
    ) {

        next.dataset.connected =
            "true";


        next.addEventListener(
            "click",
            nextMonth
        );

    }


    const theme =
        $("themeButton");


    if (
        theme &&
        theme.dataset.connected !== "true"
    ) {

        theme.dataset.connected =
            "true";


        theme.addEventListener(
            "click",
            function(event) {

                event.preventDefault();

                toggleTheme();

            }
        );

    }


    const challenge =
        $("dailyChallengeButton");


    if (
        challenge &&
        challenge.dataset.connected !== "true"
    ) {

        challenge.dataset.connected =
            "true";


        challenge.addEventListener(
            "click",
            function() {

                const topic =
                    getCurrentTopic();


                if (!topic) {
                    return;
                }


                currentTopicIndex =
                    allTopics.findIndex(
                        item =>
                            topicKey(item) ===
                            topicKey(topic)
                    );


                createStudySession(
                    topic
                );


                renderAll();


                const section =
                    $("currentTopicSection");


                if (section) {

                    section.scrollIntoView({
                        behavior:
                            "smooth",
                        block:
                            "start"
                    });

                }

            }
        );

    }


    /*
       Submit button is retained for compatibility
       with dashboard layouts that render questions
       locally. The actual knowledge-check page
       remains the main five-question system.
    */

    const submitQuestions =
        $("submitTopicQuestions");


    if (
        submitQuestions &&
        submitQuestions.dataset.connected !== "true"
    ) {

        submitQuestions.dataset.connected =
            "true";


        submitQuestions.addEventListener(
            "click",
            function() {

                /*
                   If a separate knowledge-check page
                   is being used, redirect there.
                */

                const topic =
                    getCurrentTopic();


                if (topic) {

                    openKnowledgeCheckPage(
                        topic
                    );

                }

            }
        );

    }

}


/* =========================================================
   RENDER EVERYTHING
========================================================= */

function renderAll() {

    if (!studyPlan) {
        return;
    }


    renderStats();

    renderCurrentTopic();

    renderTopics();

    renderSubjects();

    renderCalendar();

    renderSchedule();

    renderDailyChallenge();

    updateTimerDisplay();

    injectPlanTabs();

}


/* =========================================================
   DASHBOARD OPEN
========================================================= */

function openDashboard() {

    window.location.href =
        "dashboard.html";

}


/* =========================================================
   INITIALIZE
========================================================= */

async function initializeDashboard() {

    if (
        dashboardInitialized
    ) {
        return;
    }


    dashboardInitialized =
        true;


    /*
       Theme first.
    */

    applyTheme();


    /*
       Calendar glow styles.
    */

    injectCalendarCSS();


    /*
       Load multi-plan state.
    */

    if (
        !loadActivePlan()
    ) {

        renderAll();

        console.warn(
            "StudyMind: No study plan found."
        );

        return;

    }


    /*
       Authentication is checked without making the
       dashboard unusable if Supabase is momentarily
       unavailable.
    */

    await checkAuthentication();


    /*
       Calendar starts at the active plan's study
       start month.
    */

    calendarDate =
        getStudyStartDate();


    /*
       Timer select.
    */

    const timerDuration =
        $("timerDuration");


    if (timerDuration) {

        const minutes =
            selectedTimerSeconds /
            60;


        if (
            TIMER_OPTIONS.includes(
                minutes
            )
        ) {

            timerDuration.value =
                String(minutes);

        } else {

            timerDuration.value =
                "25";

            selectedTimerSeconds =
                DEFAULT_TIMER_SECONDS;

        }

    }


    /*
       Make sure timer is valid.
    */

    if (
        !Number.isFinite(
            timerSeconds
        ) ||
        timerSeconds <= 0
    ) {

        timerSeconds =
            selectedTimerSeconds;

    }


    bindEvents();

    renderAll();

    startReadingPersistence();


    /*
       A delayed render handles pages where another
       script inserts reading content after dashboard.js.
    */

    setTimeout(
        function() {

            restoreCurrentReading();
            renderCalendar();
            renderAll();

        },
        750
    );


    /*
       Persist dashboard state periodically so leaving
       the page does not lose progress.
    */

    if (
        stateSaveInterval
    ) {

        clearInterval(
            stateSaveInterval
        );

    }


    stateSaveInterval =
        setInterval(
            function() {

                saveCurrentReading();
                saveDashboardState();

            },
            5000
        );


    /*
       Check whether the whole plan has already been
       completed.
    */

    if (
        allTopicsCompleted()
    ) {

        setTimeout(
            maybeShowCompletionCelebration,
            900
        );

    }

}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.openDashboard =
    openDashboard;

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
    function() {

        saveDashboardState();

    };

window.switchStudyPlan =
    switchStudyPlan;

window.getSavedStudyPlans =
    getSavedPlans;

window.getActiveStudyPlanId =
    getActivePlanId;


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
