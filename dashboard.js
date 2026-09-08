/* =========================================================
   STUDYMIND AI — DASHBOARD.JS
   COMPLETE REPLACEMENT
   =========================================================

   CORE RULES
   ---------------------------------------------------------
   1. studyMindActivePlanId identifies the active plan.
   2. studyMindPlans stores all saved plans.
   3. studyMindPlan is the compatibility/current-plan copy.
   4. Dashboard NEVER creates a new plan merely by opening.
   5. Dashboard NEVER blindly chooses plans[0].
   6. Exact duplicate plans are cleaned automatically.
   7. Progress belongs to the active plan.
   8. Timer, Knowledge Check, calendar and schedule use the
      active plan only.
   ========================================================= */

"use strict";


/* =========================================================
   STORAGE KEYS
========================================================= */

const PLAN_KEY =
    "studyMindPlan";

const PLANS_KEY =
    "studyMindPlans";

const ACTIVE_PLAN_KEY =
    "studyMindActivePlanId";

const COMPATIBILITY_PLAN_KEY =
    "studyData";

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

const STUDY_SESSION_KEY =
    "studyMindCurrentStudySession";

const STUDY_READINGS_KEY =
    "studyMindTopicReadings";

const TIMER_SECONDS_KEY =
    "studyMindTimerSeconds";

const TIMER_DURATION_KEY =
    "studyMindSelectedTimerSeconds";

const THEME_KEY =
    "studyMindTheme";

const CELEBRATION_KEY =
    "studyMindCompletionCelebrationShown";

const AI_QUESTION_COUNT_KEY =
    "aiQuestionCount";


/* =========================================================
   CONFIG
========================================================= */

const DEFAULT_TIMER_SECONDS =
    25 * 60;

const TIMER_OPTIONS = [
    25,
    45,
    60
];

const KNOWLEDGE_CHECK_SIZE =
    5;

const KNOWLEDGE_PASS_PERCENT =
    60;

const FREE_QUESTION_LIMIT =
    5;


/* =========================================================
   STATE
========================================================= */

let studyPlan = null;

let activePlanRecord = null;

let timerSeconds =
    DEFAULT_TIMER_SECONDS;

let timerInterval = null;

let timerRunning = false;

let currentUser = null;

let currentReadingInterval = null;


/* =========================================================
   BASIC DOM HELPER
========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   STORAGE HELPERS
========================================================= */

function clean(value) {
    if (value === undefined || value === null) {
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

        console.error(
            "StudyMind: Could not save",
            key,
            error
        );

        return false;
    }
}


/* =========================================================
   HTML SAFETY
========================================================= */

function escapeHTML(value) {

    return clean(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   IDs
========================================================= */

function createId(prefix = "item") {

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


/* =========================================================
   DATE HELPERS
========================================================= */

function toDate(value) {

    if (!value) {
        return null;
    }

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
}


function dateOnly(value) {

    const date =
        toDate(value);

    if (!date) {
        return null;
    }

    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );
}


function formatDate(value) {

    const date =
        dateOnly(value);

    if (!date) {
        return "—";
    }

    return date.toLocaleDateString(
        undefined,
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );
}


function formatShortDate(value) {

    const date =
        dateOnly(value);

    if (!date) {
        return "—";
    }

    return date.toLocaleDateString(
        undefined,
        {
            month: "short",
            day: "numeric"
        }
    );
}


function daysBetween(start, end) {

    const a =
        dateOnly(start);

    const b =
        dateOnly(end);

    if (!a || !b) {
        return 0;
    }

    return Math.round(
        (
            b.getTime() -
            a.getTime()
        ) /
        86400000
    );
}


/* =========================================================
   TIME HELPERS
========================================================= */

function formatTime(value) {

    if (!value) {
        return "4:00 PM";
    }

    const parts =
        String(value).split(":");

    let hour =
        Number(parts[0]);

    const minute =
        parts[1] || "00";

    if (!Number.isFinite(hour)) {
        return value;
    }

    const suffix =
        hour >= 12
            ? "PM"
            : "AM";

    hour =
        hour % 12 || 12;

    return (
        hour +
        ":" +
        minute +
        " " +
        suffix
    );
}


function formatTimer(seconds) {

    seconds =
        Math.max(
            0,
            Number(seconds) || 0
        );

    const minutes =
        Math.floor(seconds / 60);

    const remaining =
        seconds % 60;

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(remaining).padStart(2, "0")
    );
}


/* =========================================================
   NORMALIZATION
========================================================= */

function slug(value) {

    return clean(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}


function topicName(topic) {

    if (typeof topic === "string") {
        return clean(topic);
    }

    if (!topic || typeof topic !== "object") {
        return "";
    }

    return clean(
        topic.name ||
        topic.topic ||
        topic.title ||
        topic.label
    );
}


function topicSubject(topic) {

    if (!topic || typeof topic !== "object") {
        return "";
    }

    return clean(
        topic.subject ||
        topic.subjectName
    );
}


function topicKey(topic) {

    if (!topic) {
        return "";
    }

    if (typeof topic === "string") {
        return slug(topic);
    }

    return (
        slug(topicSubject(topic)) +
        "::" +
        slug(topicName(topic))
    );
}


function normalizeTopic(topic, subjectName = "") {

    if (typeof topic === "string") {

        return {
            id:
                topicKey({
                    subject: subjectName,
                    name: topic
                }),

            name:
                clean(topic),

            topic:
                clean(topic),

            subject:
                clean(subjectName),

            description:
                "Study " +
                clean(topic) +
                " and complete the knowledge check.",

            completed:
                false
        };
    }

    const safe =
        topic &&
        typeof topic === "object"
            ? topic
            : {};

    const name =
        topicName(safe) ||
        "Untitled Topic";

    return {
        ...safe,

        id:
            safe.id ||
            topicKey({
                subject:
                    topicSubject(safe) ||
                    subjectName,
                name
            }),

        name,

        topic:
            safe.topic ||
            name,

        subject:
            topicSubject(safe) ||
            clean(subjectName),

        description:
            safe.description ||
            safe.desc ||
            (
                "Study " +
                name +
                " and complete the knowledge check."
            ),

        completed:
            Boolean(safe.completed)
    };
}


/* =========================================================
   PLAN NORMALIZATION
========================================================= */

function normalizePlan(rawPlan) {

    if (!rawPlan || typeof rawPlan !== "object") {
        return null;
    }

    const plan =
        {
            ...rawPlan
        };

    plan.id =
        clean(plan.id);

    plan.title =
        clean(
            plan.title ||
            plan.name ||
            "Study Plan"
        );

    plan.examDate =
        clean(
            plan.examDate ||
            plan.testDate ||
            plan.exam ||
            ""
        );

    plan.curriculum =
        clean(
            plan.curriculum ||
            "Nigerian Senior Secondary Curriculum"
        );

    plan.hoursPerDay =
        Number(
            plan.hoursPerDay ||
            plan.studyHours ||
            0
        );

    plan.startTime =
        clean(
            plan.startTime ||
            "16:00"
        );

    plan.difficulty =
        clean(
            plan.difficulty ||
            "balanced"
        );

    if (!Array.isArray(plan.subjects)) {
        plan.subjects = [];
    }

    plan.subjects =
        plan.subjects
            .map(subject => {

                if (typeof subject === "string") {

                    return {
                        name: clean(subject),
                        topics: []
                    };
                }

                return {
                    ...subject,
                    name:
                        clean(
                            subject.name ||
                            subject.subject ||
                            subject.title
                        ),

                    topics:
                        Array.isArray(subject.topics)
                            ? subject.topics
                            : []
                };
            })
            .filter(subject => subject.name);


    /*
     * Some older versions stored topics at the top level.
     * Keep them.
     */

    if (
        plan.subjects.length === 0 &&
        Array.isArray(plan.topics)
    ) {

        plan.subjects = [
            {
                name:
                    clean(
                        plan.subject ||
                        "Subject"
                    ),

                topics:
                    plan.topics
            }
        ];
    }


    plan.subjects =
        plan.subjects.map(subject => {

            const subjectName =
                clean(subject.name);

            return {
                ...subject,

                name:
                    subjectName,

                topics:
                    subject.topics
                        .map(topic =>
                            normalizeTopic(
                                topic,
                                subjectName
                            )
                        )
                        .filter(topic =>
                            topic.name
                        )
            };
        });


    plan.topics =
        plan.subjects.flatMap(
            subject =>
                subject.topics
                    .map(topic => ({
                        ...topic,
                        subject:
                            topic.subject ||
                            subject.name
                    }))
        );


    if (!plan.createdAt) {
        plan.createdAt =
            new Date().toISOString();
    }

    if (!plan.updatedAt) {
        plan.updatedAt =
            plan.createdAt;
    }

    return plan;
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

    return (
        localStorage.getItem(
            ACTIVE_PLAN_KEY
        ) ||
        null
    );
}


function setActivePlanId(id) {

    if (!id) {

        localStorage.removeItem(
            ACTIVE_PLAN_KEY
        );

        return;
    }

    localStorage.setItem(
        ACTIVE_PLAN_KEY,
        id
    );
}


/* =========================================================
   PLAN SIGNATURE
   Used only to identify EXACT duplicates.
========================================================= */

function planSignature(plan) {

    const p =
        normalizePlan(plan);

    if (!p) {
        return "";
    }

    const subjects =
        p.subjects
            .map(subject => {

                const topics =
                    subject.topics
                        .map(topic =>
                            slug(topicName(topic))
                        )
                        .sort()
                        .join(",");

                return (
                    slug(subject.name) +
                    "[" +
                    topics +
                    "]"
                );
            })
            .sort()
            .join("|");

    return [
        p.examDate,
        p.curriculum,
        p.hoursPerDay,
        p.startTime,
        p.difficulty,
        subjects
    ].join("::");
}


/* =========================================================
   CLEAN EXACT DUPLICATES
========================================================= */

function cleanDuplicatePlans(plans) {

    if (!Array.isArray(plans)) {
        return [];
    }

    const activeId =
        getActivePlanId();

    const seen =
        new Map();

    const result = [];

    /*
     * Process newest records first.
     */

    const sorted =
        [...plans].sort(
            (a, b) => {

                const aTime =
                    new Date(
                        a?.updatedAt ||
                        a?.createdAt ||
                        0
                    ).getTime();

                const bTime =
                    new Date(
                        b?.updatedAt ||
                        b?.createdAt ||
                        0
                    ).getTime();

                return bTime - aTime;
            }
        );


    for (const record of sorted) {

        if (!record || !record.plan) {
            continue;
        }

        const normalized =
            normalizePlan(record.plan);

        if (!normalized) {
            continue;
        }

        const signature =
            planSignature(normalized);

        /*
         * If there is an active plan with this exact
         * signature, keep the active record.
         */

        if (seen.has(signature)) {

            const existing =
                seen.get(signature);

            const existingIsActive =
                existing.id === activeId;

            const currentIsActive =
                record.id === activeId;

            if (
                currentIsActive &&
                !existingIsActive
            ) {

                const index =
                    result.indexOf(existing);

                if (index !== -1) {
                    result.splice(
                        index,
                        1
                    );
                }

                seen.set(
                    signature,
                    record
                );

                result.push(record);
            }

            continue;
        }

        seen.set(
            signature,
            record
        );

        result.push(record);
    }

    return result;
}


/* =========================================================
   CRITICAL ACTIVE-PLAN LOADER
========================================================= */

function loadActivePlan() {

    let plans =
        getSavedPlans();


    /*
     * Normalize registry.
     */

    plans =
        plans
            .filter(record =>
                record &&
                record.plan
            )
            .map(record => ({
                ...record,
                plan:
                    normalizePlan(
                        record.plan
                    )
            }))
            .filter(record =>
                record.plan
            );


    /*
     * -------------------------------------------------------
     * FIRST PRIORITY:
     * A valid activePlanId.
     * -------------------------------------------------------
     */

    let activeId =
        getActivePlanId();

    let record =
        activeId
            ? plans.find(
                item =>
                    item.id === activeId
            )
            : null;


    /*
     * -------------------------------------------------------
     * SECOND PRIORITY:
     * Compare studyMindPlan with the active registry plan.
     *
     * Home writes the newly generated plan to studyMindPlan
     * immediately before redirecting to Dashboard.
     *
     * If that plan has a different signature, it is the new
     * plan and must become active.
     * -------------------------------------------------------
     */

    const compatibilityPlan =
        normalizePlan(
            readJSON(
                PLAN_KEY,
                null
            )
        );


    if (compatibilityPlan) {

        const compatibilitySignature =
            planSignature(
                compatibilityPlan
            );

        const activeSignature =
            record
                ? planSignature(record.plan)
                : "";


        if (
            !record ||
            (
                compatibilitySignature &&
                activeSignature !==
                compatibilitySignature
            )
        ) {

            /*
             * Try to find an existing registry record
             * containing the exact new plan.
             */

            let matchingRecord =
                plans.find(
                    item =>
                        item &&
                        item.plan &&
                        planSignature(
                            item.plan
                        ) ===
                        compatibilitySignature
                );


            /*
             * If none exists, create ONE record.
             *
             * This is the only situation where Dashboard
             * creates a registry record.
             */

            if (!matchingRecord) {

                matchingRecord = {
                    id:
                        compatibilityPlan.id ||
                        createId("plan"),

                    title:
                        compatibilityPlan.title,

                    createdAt:
                        compatibilityPlan.createdAt ||
                        new Date().toISOString(),

                    updatedAt:
                        new Date().toISOString(),

                    plan:
                        compatibilityPlan
                };

                plans.unshift(
                    matchingRecord
                );

            }

            record =
                matchingRecord;

            activeId =
                record.id;

            setActivePlanId(
                activeId
            );
        }
    }


    /*
     * -------------------------------------------------------
     * THIRD PRIORITY:
     * If there is no active record but plans exist,
     * choose the newest valid record.
     *
     * We do NOT use a hard-coded plan.
     * -------------------------------------------------------
     */

    if (!record && plans.length) {

        plans.sort(
            (a, b) => {

                const aTime =
                    new Date(
                        a.updatedAt ||
                        a.createdAt ||
                        0
                    ).getTime();

                const bTime =
                    new Date(
                        b.updatedAt ||
                        b.createdAt ||
                        0
                    ).getTime();

                return bTime - aTime;
            }
        );

        record =
            plans[0];

        activeId =
            record.id;

        setActivePlanId(
            activeId
        );
    }


    /*
     * -------------------------------------------------------
     * LAST RESORT:
     * Legacy studyMindPlan.
     * -------------------------------------------------------
     */

    if (!record) {

        if (compatibilityPlan) {

            record = {
                id:
                    compatibilityPlan.id ||
                    createId("plan"),

                title:
                    compatibilityPlan.title,

                createdAt:
                    compatibilityPlan.createdAt ||
                    new Date().toISOString(),

                updatedAt:
                    new Date().toISOString(),

                plan:
                    compatibilityPlan
            };

            plans = [
                record
            ];

            activeId =
                record.id;

            setActivePlanId(
                activeId
            );

        } else {

            console.error(
                "StudyMind: No study plan found."
            );

            studyPlan = null;
            activePlanRecord = null;

            return false;
        }
    }


    /*
     * Clean exact duplicates.
     *
     * IMPORTANT:
     * The active plan remains protected.
     */

    plans =
        cleanDuplicatePlans(
            plans
        );


    /*
     * Make sure the active record still exists
     * after duplicate cleanup.
     */

    let finalRecord =
        plans.find(
            item =>
                item.id ===
                activeId
        );


    if (!finalRecord) {

        finalRecord =
            plans.find(
                item =>
                    planSignature(
                        item.plan
                    ) ===
                    planSignature(
                        record.plan
                    )
            );
    }


    if (!finalRecord) {

        finalRecord =
            record;
    }


    activePlanRecord =
        finalRecord;

    studyPlan =
        normalizePlan(
            finalRecord.plan
        );


    /*
     * Save repaired registry.
     */

    saveSavedPlans(
        plans
    );


    /*
     * Mirror ONLY the active plan to the compatibility keys.
     *
     * This prevents old Geometry data from being reused.
     */

    writeJSON(
        PLAN_KEY,
        studyPlan
    );

    writeJSON(
        COMPATIBILITY_PLAN_KEY,
        studyPlan
    );

    setActivePlanId(
        activePlanRecord.id
    );


    /*
     * Restore plan-specific state.
     */

    restorePlanState();


    console.log(
        "StudyMind: Active plan loaded:",
        {
            activePlanId:
                activePlanRecord.id,

            title:
                studyPlan.title,

            examDate:
                studyPlan.examDate,

            subjects:
                studyPlan.subjects,

            topics:
                studyPlan.topics
        }
    );

    return true;
}


/* =========================================================
   PLAN-SPECIFIC STATE
========================================================= */

function restorePlanState() {

    if (!studyPlan) {
        return;
    }

    const topics =
        studyPlan.topics || [];


    let currentIndex =
        Number(
            readJSON(
                CURRENT_TOPIC_KEY,
                0
            )
        );


    /*
     * Current topic index is only valid for the active plan.
     */

    if (
        !Number.isInteger(currentIndex) ||
        currentIndex < 0 ||
        currentIndex >= topics.length
    ) {

        currentIndex = 0;
    }


    localStorage.setItem(
        CURRENT_TOPIC_KEY,
        String(currentIndex)
    );


    /*
     * Timer
     */

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


    if (
        TIMER_OPTIONS.includes(
            savedDuration / 60
        )
    ) {

        timerSeconds =
            Number.isFinite(savedSeconds) &&
            savedSeconds >= 0
                ? savedSeconds
                : savedDuration;

    } else {

        timerSeconds =
            DEFAULT_TIMER_SECONDS;

        localStorage.setItem(
            TIMER_DURATION_KEY,
            String(
                DEFAULT_TIMER_SECONDS
            )
        );

        localStorage.setItem(
            TIMER_SECONDS_KEY,
            String(
                DEFAULT_TIMER_SECONDS
            )
        );
    }
}


/* =========================================================
   GET CURRENT TOPIC
========================================================= */

function getCurrentTopic() {

    if (!studyPlan) {
        return null;
    }

    const topics =
        studyPlan.topics || [];

    if (!topics.length) {
        return null;
    }


    /*
     * First attempt to preserve the current session's topic.
     */

    const session =
        readJSON(
            STUDY_SESSION_KEY,
            null
        );


    if (
        session &&
        session.topicKey
    ) {

        const matching =
            topics.find(
                topic =>
                    topicKey(topic) ===
                    session.topicKey
            );

        if (matching) {
            return matching;
        }
    }


    let index =
        Number(
            localStorage.getItem(
                CURRENT_TOPIC_KEY
            )
        );


    if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= topics.length
    ) {

        index = 0;

        localStorage.setItem(
            CURRENT_TOPIC_KEY,
            "0"
        );
    }

    return topics[index];
}


/* =========================================================
   CURRENT TOPIC INDEX
========================================================= */

function getCurrentTopicIndex() {

    if (!studyPlan) {
        return 0;
    }

    const topics =
        studyPlan.topics || [];

    const current =
        getCurrentTopic();

    if (!current) {
        return 0;
    }

    const index =
        topics.findIndex(
            topic =>
                topicKey(topic) ===
                topicKey(current)
        );

    return index >= 0
        ? index
        : 0;
}


/* =========================================================
   SAVE LEGACY / COMPATIBILITY STATE
========================================================= */

function saveLegacyState() {

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

    localStorage.setItem(
        CURRENT_TOPIC_KEY,
        String(
            getCurrentTopicIndex()
        )
    );
}


/* =========================================================
   SYNC ACTIVE PLAN RECORD
   MUST EXIST BEFORE createStudySession()
========================================================= */

function syncActivePlanRecord() {

    if (
        !studyPlan ||
        !activePlanRecord
    ) {
        return false;
    }


    const plans =
        getSavedPlans();

    const index =
        plans.findIndex(
            record =>
                record &&
                record.id ===
                activePlanRecord.id
        );


    if (index === -1) {

        /*
         * Do NOT create duplicates automatically.
         */

        return false;
    }


    const updatedRecord = {
        ...plans[index],

        title:
            studyPlan.title,

        updatedAt:
            new Date().toISOString(),

        plan:
            studyPlan
    };


    plans[index] =
        updatedRecord;

    activePlanRecord =
        updatedRecord;


    saveSavedPlans(
        plans
    );

    setActivePlanId(
        activePlanRecord.id
    );

    writeJSON(
        PLAN_KEY,
        studyPlan
    );

    writeJSON(
        COMPATIBILITY_PLAN_KEY,
        studyPlan
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
   COMPLETED TOPICS
========================================================= */

function getCompletedTopics() {

    const value =
        readJSON(
            COMPLETED_TOPICS_KEY,
            []
        );

    return Array.isArray(value)
        ? value
        : [];
}


function saveCompletedTopics(topics) {

    writeJSON(
        COMPLETED_TOPICS_KEY,
        Array.isArray(topics)
            ? topics
            : []
    );
}


function isTopicCompleted(topic) {

    const key =
        topicKey(topic);

    return getCompletedTopics()
        .includes(key);
}


function markTopicCompleted(topic) {

    if (!topic) {
        return;
    }

    const key =
        topicKey(topic);

    const completed =
        getCompletedTopics();

    if (!completed.includes(key)) {

        completed.push(key);

        saveCompletedTopics(
            completed
        );
    }

    /*
     * Also update topic object.
     */

    if (studyPlan) {

        const matching =
            studyPlan.topics.find(
                item =>
                    topicKey(item) ===
                    key
            );

        if (matching) {
            matching.completed =
                true;
        }
    }

    saveDashboardState();
}


function completedTopicCount() {

    if (!studyPlan) {
        return 0;
    }

    const topics =
        studyPlan.topics || [];

    return topics.filter(
        topic =>
            isTopicCompleted(topic)
    ).length;
}


function allTopicsCompleted() {

    if (!studyPlan) {
        return false;
    }

    const topics =
        studyPlan.topics || [];

    return (
        topics.length > 0 &&
        completedTopicCount() ===
        topics.length
    );
}


/* =========================================================
   KNOWLEDGE CHECK STATE
========================================================= */

function getCompletedQuestionTopics() {

    const value =
        readJSON(
            COMPLETED_QUESTIONS_KEY,
            []
        );

    return Array.isArray(value)
        ? value
        : [];
}


function isKnowledgeCheckCompleted(topic) {

    if (!topic) {
        return false;
    }

    return getCompletedQuestionTopics()
        .includes(
            topicKey(topic)
        );
}


function markKnowledgeCheckCompleted(topic) {

    if (!topic) {
        return;
    }

    const key =
        topicKey(topic);

    const completed =
        getCompletedQuestionTopics();

    if (!completed.includes(key)) {

        completed.push(key);

        writeJSON(
            COMPLETED_QUESTIONS_KEY,
            completed
        );
    }
}


/* =========================================================
   STUDY SESSION
========================================================= */

function createStudySession(topic) {

    if (!topic) {
        return;
    }

    const session = {

        planId:
            activePlanRecord?.id ||
            getActivePlanId(),

        topicKey:
            topicKey(topic),

        topicName:
            topicName(topic),

        subject:
            topicSubject(topic),

        startedAt:
            new Date().toISOString(),

        status:
            "in-progress"
    };


    writeJSON(
        STUDY_SESSION_KEY,
        session
    );


    syncActivePlanRecord();
}


/* =========================================================
   READING PERSISTENCE
========================================================= */

function getReadingRecords() {

    const value =
        readJSON(
            STUDY_READINGS_KEY,
            {}
        );

    return (
        value &&
        typeof value === "object"
            ? value
            : {}
    );
}


function findReadingElement() {

    const ids = [
        "topicReading",
        "currentTopicReading",
        "readingArea",
        "topicContent",
        "studyReading",
        "topicNotes"
    ];

    for (const id of ids) {

        const element =
            $(id);

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

    const records =
        getReadingRecords();

    return (
        records[
            topicKey(topic)
        ] ||
        null
    );
}


function saveCurrentReading() {

    const topic =
        getCurrentTopic();

    const element =
        findReadingElement();

    if (!topic || !element) {
        return;
    }

    const records =
        getReadingRecords();

    records[
        topicKey(topic)
    ] = {
        scrollTop:
            element.scrollTop,

        updatedAt:
            new Date().toISOString()
    };

    writeJSON(
        STUDY_READINGS_KEY,
        records
    );
}


function restoreCurrentReading() {

    const element =
        findReadingElement();

    const record =
        getCurrentReadingRecord();

    if (!element || !record) {
        return;
    }

    setTimeout(
        () => {

            element.scrollTop =
                Number(
                    record.scrollTop
                ) || 0;

        },
        50
    );
}


function startReadingPersistence() {

    if (currentReadingInterval) {

        clearInterval(
            currentReadingInterval
        );
    }

    currentReadingInterval =
        setInterval(
            saveCurrentReading,
            3000
        );
}


/* =========================================================
   TIMER
========================================================= */

function getTimerDisplayElement() {

    const ids = [
        "timerDisplay",
        "studyTimerDisplay",
        "timer"
    ];

    for (const id of ids) {

        const element =
            $(id);

        if (element) {
            return element;
        }
    }

    return null;
}


function renderTimer() {

    const display =
        getTimerDisplayElement();

    if (display) {

        display.textContent =
            formatTimer(
                timerSeconds
            );
    }

    const minuteDisplay =
        $("timerMinutes");

    if (minuteDisplay) {

        minuteDisplay.textContent =
            Math.floor(
                timerSeconds / 60
            );
    }

    const secondDisplay =
        $("timerSeconds");

    if (secondDisplay) {

        secondDisplay.textContent =
            String(
                timerSeconds % 60
            ).padStart(
                2,
                "0"
            );
    }
}


function saveTimer() {

    localStorage.setItem(
        TIMER_SECONDS_KEY,
        String(timerSeconds)
    );
}


function setTimerDuration(minutes) {

    minutes =
        Number(minutes);

    if (
        !TIMER_OPTIONS.includes(
            minutes
        )
    ) {
        minutes = 25;
    }

    stopTimer();

    timerSeconds =
        minutes * 60;

    localStorage.setItem(
        TIMER_DURATION_KEY,
        String(timerSeconds)
    );

    saveTimer();

    renderTimer();
}


function startTimer() {

    if (timerRunning) {
        return;
    }

    if (timerSeconds <= 0) {

        const duration =
            Number(
                localStorage.getItem(
                    TIMER_DURATION_KEY
                )
            ) ||
            DEFAULT_TIMER_SECONDS;

        timerSeconds =
            duration;
    }

    timerRunning =
        true;

    timerInterval =
        setInterval(
            () => {

                timerSeconds--;

                if (
                    timerSeconds <= 0
                ) {

                    timerSeconds = 0;

                    stopTimer();

                    handleTimerFinished();

                }

                saveTimer();
                renderTimer();

            },
            1000
        );

    updateTimerButtons();
}


function stopTimer() {

    if (timerInterval) {

        clearInterval(
            timerInterval
        );

        timerInterval = null;
    }

    timerRunning =
        false;

    updateTimerButtons();
}


function resetTimer() {

    stopTimer();

    timerSeconds =
        Number(
            localStorage.getItem(
                TIMER_DURATION_KEY
            )
        ) ||
        DEFAULT_TIMER_SECONDS;

    saveTimer();

    renderTimer();
}


function handleTimerFinished() {

    const topic =
        getCurrentTopic();

    if (topic) {

        const message =
            $("timerMessage");

        if (message) {

            message.textContent =
                "Study session complete. Great work!";
        }
    }
}


function updateTimerButtons() {

    const start =
        $("startTimer");

    const stop =
        $("stopTimer");

    const reset =
        $("resetTimer");

    if (start) {

        start.textContent =
            timerRunning
                ? "Running"
                : "Start";
    }

    if (stop) {

        stop.disabled =
            !timerRunning;
    }

    if (reset) {
        reset.disabled =
            false;
    }
}


/* =========================================================
   STREAK
========================================================= */

function updateStudyStreak() {

    const today =
        new Date()
            .toISOString()
            .slice(0, 10);

    const last =
        localStorage.getItem(
            "lastStudyDate"
        );

    if (last !== today) {

        localStorage.setItem(
            "lastStudyDate",
            today
        );
    }
}


/* =========================================================
   SCORE
========================================================= */

function calculateStudyScore() {

    if (!studyPlan) {
        return 0;
    }

    const total =
        studyPlan.topics?.length || 0;

    if (!total) {
        return 0;
    }

    const completed =
        completedTopicCount();

    return Math.round(
        (
            completed /
            total
        ) * 100
    );
}


/* =========================================================
   STATS
========================================================= */

function renderStats() {

    if (!studyPlan) {
        return;
    }

    const totalTopics =
        studyPlan.topics?.length || 0;

    const completed =
        completedTopicCount();

    const score =
        calculateStudyScore();


    const hours =
        $("weeklyHours");

    if (hours) {

        hours.textContent =
            studyPlan.hoursPerDay
                ? `${studyPlan.hoursPerDay} hrs/day`
                : "—";
    }


    const daysLeft =
        $("daysLeft");

    if (daysLeft) {

        const today =
            dateOnly(
                new Date()
            );

        const exam =
            dateOnly(
                studyPlan.examDate
            );

        const difference =
            exam
                ? Math.max(
                    0,
                    daysBetween(
                        today,
                        exam
                    )
                )
                : 0;

        daysLeft.textContent =
            String(difference);
    }


    const dailyGoal =
        $("dailyGoal");

    if (dailyGoal) {

        dailyGoal.textContent =
            studyPlan.hoursPerDay
                ? `${studyPlan.hoursPerDay}h`
                : "—";
    }


    const scoreElement =
        $("studyScore");

    if (scoreElement) {

        scoreElement.textContent =
            `${score}%`;
    }


    const progressPercent =
        $("progressPercent");

    if (progressPercent) {

        progressPercent.textContent =
            `${score}%`;
    }


    const progressCount =
        $("progressCount");

    if (progressCount) {

        progressCount.textContent =
            `${completed} / ${totalTopics} topics`;
    }


    const progressBar =
        $("progressBar");

    if (progressBar) {

        progressBar.style.width =
            `${score}%`;
    }
}


/* =========================================================
   SUBJECTS
========================================================= */

function renderSubjects() {

    const container =
        $("subjectList");

    if (!container || !studyPlan) {
        return;
    }

    const subjects =
        studyPlan.subjects || [];

    if (!subjects.length) {

        container.innerHTML = `
            <div class="empty-state">
                No subjects found.
            </div>
        `;

        return;
    }


    container.innerHTML =
        subjects.map(
            subject => {

                const total =
                    subject.topics?.length ||
                    0;

                const completed =
                    (subject.topics || [])
                        .filter(
                            topic =>
                                isTopicCompleted(
                                    topic
                                )
                        ).length;

                const percent =
                    total
                        ? Math.round(
                            completed /
                            total *
                            100
                        )
                        : 0;

                return `
                    <div class="subject-card">
                        <div class="subject-card-header">
                            <strong>
                                ${escapeHTML(subject.name)}
                            </strong>

                            <span>
                                ${completed}/${total}
                            </span>
                        </div>

                        <div class="subject-progress">
                            <div
                                class="subject-progress-bar"
                                style="width:${percent}%"
                            ></div>
                        </div>
                    </div>
                `;
            }
        ).join("");
}


/* =========================================================
   TOPICS
========================================================= */

function renderTopics() {

    const container =
        $("topicList");

    if (!container || !studyPlan) {
        return;
    }

    const topics =
        studyPlan.topics || [];

    if (!topics.length) {

        container.innerHTML = `
            <div class="empty-state">
                No topics found.
            </div>
        `;

        return;
    }


    const current =
        getCurrentTopic();


    container.innerHTML =
        topics.map(
            (topic, index) => {

                const completed =
                    isTopicCompleted(
                        topic
                    );

                const active =
                    current &&
                    topicKey(current) ===
                    topicKey(topic);

                return `
                    <button
                        type="button"
                        class="topic-item
                            ${active ? "active" : ""}
                            ${completed ? "completed" : ""}"
                        data-topic-index="${index}"
                    >
                        <span class="topic-item-number">
                            ${completed ? "✓" : index + 1}
                        </span>

                        <span class="topic-item-content">
                            <strong>
                                ${escapeHTML(
                                    topicName(topic)
                                )}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    topicSubject(topic)
                                )}
                            </small>
                        </span>
                    </button>
                `;
            }
        ).join("");


    container
        .querySelectorAll(
            "[data-topic-index]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.dataset.topicIndex
                        );

                    switchTopic(
                        index
                    );
                }
            );
        });
}


/* =========================================================
   SWITCH TOPIC
========================================================= */

function switchTopic(index) {

    if (!studyPlan) {
        return;
    }

    const topics =
        studyPlan.topics || [];

    if (
        index < 0 ||
        index >= topics.length
    ) {
        return;
    }

    saveCurrentReading();

    stopTimer();

    localStorage.setItem(
        CURRENT_TOPIC_KEY,
        String(index)
    );

    localStorage.removeItem(
        STUDY_SESSION_KEY
    );

    localStorage.removeItem(
        KNOWLEDGE_TOPIC_KEY
    );

    localStorage.removeItem(
        KNOWLEDGE_QUESTIONS_KEY
    );

    renderAll();
}


/* =========================================================
   CURRENT TOPIC
========================================================= */

function renderCurrentTopic() {

    const topic =
        getCurrentTopic();

    if (!topic) {

        const name =
            $("currentTopicName");

        if (name) {
            name.textContent =
                "No topic available";
        }

        return;
    }


    createStudySession(
        topic
    );


    const index =
        getCurrentTopicIndex();

    const total =
        studyPlan.topics.length;


    const name =
        $("currentTopicName");

    if (name) {

        name.textContent =
            topicName(topic);
    }


    const description =
        $("currentTopicDescription");

    if (description) {

        description.textContent =
            topic.description ||
            `Study ${topicName(topic)} and complete the knowledge check.`;
    }


    const position =
        $("topicPosition");

    if (position) {

        position.textContent =
            `TOPIC ${index + 1} OF ${total}`;
    }


    const badge =
        $("topicStatusBadge");

    if (badge) {

        if (
            isTopicCompleted(topic)
        ) {

            badge.textContent =
                "COMPLETED";

            badge.classList.add(
                "completed"
            );

        } else {

            badge.textContent =
                "IN PROGRESS";

            badge.classList.remove(
                "completed"
            );
        }
    }


    const checkbox =
        $("topicCompleteCheckbox");

    if (checkbox) {

        checkbox.checked =
            isTopicCompleted(topic);
    }


    const completionMessage =
        $("topicCompletionMessage");

    if (completionMessage) {

        completionMessage.textContent =
            isTopicCompleted(topic)
                ? "Topic completed."
                : "Mark this topic as finished after studying.";
    }


    const nextMessage =
        $("nextTopicMessage");

    if (nextMessage) {

        if (
            index <
            total - 1
        ) {

            const next =
                studyPlan.topics[
                    index + 1
                ];

            nextMessage.textContent =
                `Next topic: ${topicName(next)}`;

        } else {

            nextMessage.textContent =
                allTopicsCompleted()
                    ? "You have completed every topic."
                    : "This is your final topic.";
        }
    }


    renderTopicQuestions(
        topic
    );

    restoreCurrentReading();
}


/* =========================================================
   TOPIC QUESTIONS
========================================================= */

function renderTopicQuestions(topic) {

    const section =
        $("topicQuestionsSection");

    const container =
        $("topicQuestions");

    if (!section || !container) {
        return;
    }


    /*
     * Knowledge Check is intentionally hidden until the
     * user marks the topic as finished.
     */

    if (
        !isTopicCompleted(topic)
    ) {

        section.classList.add(
            "hidden"
        );

        return;
    }


    section.classList.remove(
        "hidden"
    );


    const completed =
        isKnowledgeCheckCompleted(
            topic
        );


    if (completed) {

        container.innerHTML = `
            <div class="knowledge-check-complete">
                <strong>Knowledge Check completed ✓</strong>
                <p>
                    You have already completed the knowledge check
                    for this topic.
                </p>
            </div>
        `;

        const submit =
            $("submitTopicQuestions");

        if (submit) {
            submit.style.display =
                "none";
        }

        return;
    }


    const questions =
        readJSON(
            KNOWLEDGE_QUESTIONS_KEY,
            []
        );


    /*
     * We do not fabricate questions here.
     * The existing Knowledge Check page remains responsible
     * for generating/handling the actual questions.
     */

    if (
        !Array.isArray(questions) ||
        !questions.length
    ) {

        container.innerHTML = `
            <div class="knowledge-check-ready">
                <strong>Ready for your Knowledge Check</strong>
                <p>
                    Your topic is complete. Start the Knowledge Check
                    to test what you learned.
                </p>
            </div>
        `;
    }
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


    /*
     * Remove any old knowledge questions so the next
     * knowledge check cannot accidentally belong to an
     * older topic.
     */

    localStorage.removeItem(
        KNOWLEDGE_TOPIC_KEY
    );

    localStorage.removeItem(
        KNOWLEDGE_QUESTIONS_KEY
    );


    const message =
        $("topicCompletionMessage");

    if (message) {

        message.textContent =
            "Topic completed! Your Knowledge Check is now available.";
    }


    renderAll();
}


/* =========================================================
   KNOWLEDGE CHECK NAVIGATION
========================================================= */

function hideKnowledgeCheck() {

    const section =
        $("topicQuestionsSection");

    if (section) {

        section.classList.add(
            "hidden"
        );
    }
}


function openKnowledgeCheckPage() {

    const topic =
        getCurrentTopic();

    if (!topic) {
        return;
    }


    /*
     * The current topic is the ONLY topic passed to the
     * Knowledge Check.
     */

    writeJSON(
        KNOWLEDGE_TOPIC_KEY,
        {
            ...topic,

            key:
                topicKey(topic),

            planId:
                activePlanRecord?.id ||
                getActivePlanId()
        }
    );


    localStorage.removeItem(
        KNOWLEDGE_QUESTIONS_KEY
    );


    window.location.href =
        "knowledge-check.html";
}


/* =========================================================
   DAILY CHALLENGE
========================================================= */

function renderDailyChallenge() {

    const topic =
        getCurrentTopic();

    const name =
        $("dailyChallengeTopic");

    if (name) {

        name.textContent =
            topic
                ? topicName(topic)
                : "Your current topic";
    }


    const subject =
        $("dailyChallengeSubject");

    if (subject) {

        subject.textContent =
            topic
                ? topicSubject(topic)
                : "";
    }
}


/* =========================================================
   CALENDAR
========================================================= */

function renderCalendar() {

    const calendar =
        $("calendarDays");

    if (!calendar || !studyPlan) {
        return;
    }


    const monthElement =
        $("calendarMonth");


    const exam =
        dateOnly(
            studyPlan.examDate
        );

    const today =
        dateOnly(
            new Date()
        );


    if (monthElement) {

        const displayDate =
            today || exam || new Date();

        monthElement.textContent =
            displayDate.toLocaleDateString(
                undefined,
                {
                    month: "long",
                    year: "numeric"
                }
            );
    }


    const base =
        new Date(
            today || new Date()
        );

    const year =
        base.getFullYear();

    const month =
        base.getMonth();

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


    let html = "";


    for (
        let i = 0;
        i < firstDay;
        i++
    ) {

        html += `
            <div class="calendar-day empty"></div>
        `;
    }


    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const current =
            new Date(
                year,
                month,
                day
            );

        const iso =
            current
                .toISOString()
                .slice(0, 10);


        const isToday =
            today &&
            current.getTime() ===
            today.getTime();


        const isExam =
            exam &&
            current.getTime() ===
            exam.getTime();


        let className =
            "calendar-day";

        if (isToday) {
            className +=
                " today";
        }

        if (isExam) {
            className +=
                " exam-day";
        }


        html += `
            <div
                class="${className}"
                data-date="${iso}"
            >
                <span class="calendar-date">
                    ${day}
                </span>

                ${
                    isExam
                        ? `
                            <span class="calendar-label">
                                Exam
                            </span>
                        `
                        : ""
                }
            </div>
        `;
    }


    calendar.innerHTML =
        html;
}


/* =========================================================
   SCHEDULE
========================================================= */

function renderSchedule() {

    const container =
        $("scheduleList");

    if (!container || !studyPlan) {
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
            studyPlan.hoursPerDay
        ) || 1;


    const startTime =
        formatTime(
            studyPlan.startTime
        );


    container.innerHTML = `
        <div class="schedule-item">
            <div class="schedule-time">
                ${escapeHTML(startTime)}
            </div>

            <div class="schedule-content">
                <strong>
                    ${escapeHTML(
                        topicName(topic)
                    )}
                </strong>

                <span>
                    ${escapeHTML(
                        topicSubject(topic)
                    )}
                    · ${hours} hour${hours === 1 ? "" : "s"}
                </span>
            </div>

            <div class="schedule-status">
                ${isTopicCompleted(topic)
                    ? "✓ Complete"
                    : "Study"}
            </div>
        </div>
    `;
}


/* =========================================================
   PLAN HEADER
========================================================= */

function renderPlanHeader() {

    if (!studyPlan) {
        return;
    }


    const titleIds = [
        "planTitle",
        "dashboardPlanTitle",
        "currentPlanTitle"
    ];


    for (const id of titleIds) {

        const element =
            $(id);

        if (element) {

            element.textContent =
                studyPlan.title ||
                "Study Plan";
        }
    }


    const examIds = [
        "examDate",
        "dashboardExamDate",
        "planExamDate"
    ];


    for (const id of examIds) {

        const element =
            $(id);

        if (element) {

            element.textContent =
                formatDate(
                    studyPlan.examDate
                );
        }
    }
}


/* =========================================================
   PLAN SWITCHER
========================================================= */

function renderPlanSwitcher() {

    const ids = [
        "planSwitcher",
        "savedPlans",
        "planList",
        "studyPlanList"
    ];


    let container = null;


    for (const id of ids) {

        const element =
            $(id);

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
            "";

        return;
    }


    const activeId =
        getActivePlanId();


    container.innerHTML =
        plans.map(
            record => {

                const plan =
                    normalizePlan(
                        record.plan
                    );

                if (!plan) {
                    return "";
                }


                const active =
                    record.id ===
                    activeId;


                return `
                    <button
                        type="button"
                        class="saved-plan-item
                            ${active ? "active" : ""}"
                        data-plan-id="${escapeHTML(record.id)}"
                    >
                        <strong>
                            ${escapeHTML(
                                plan.title
                            )}
                        </strong>

                        <small>
                            ${escapeHTML(
                                plan.examDate
                                    ? formatDate(
                                        plan.examDate
                                    )
                                    : "No exam date"
                            )}
                        </small>
                    </button>
                `;
            }
        ).join("");


    container
        .querySelectorAll(
            "[data-plan-id]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    switchPlan(
                        button.dataset.planId
                    );
                }
            );
        });
}


/* =========================================================
   SWITCH SAVED PLAN
========================================================= */

function switchPlan(planId) {

    if (!planId) {
        return;
    }


    const plans =
        getSavedPlans();


    const record =
        plans.find(
            item =>
                item.id ===
                planId
        );


    if (!record || !record.plan) {
        return;
    }


    /*
     * Save current active plan before switching.
     */

    saveDashboardState();


    setActivePlanId(
        record.id
    );


    studyPlan =
        normalizePlan(
            record.plan
        );

    activePlanRecord =
        {
            ...record,
            plan:
                studyPlan
        };


    /*
     * Clear only state that should belong to the
     * previous topic. Do NOT delete global progress.
     */

    localStorage.removeItem(
        STUDY_SESSION_KEY
    );

    localStorage.removeItem(
        KNOWLEDGE_TOPIC_KEY
    );

    localStorage.removeItem(
        KNOWLEDGE_QUESTIONS_KEY
    );


    restorePlanState();


    writeJSON(
        PLAN_KEY,
        studyPlan
    );

    writeJSON(
        COMPATIBILITY_PLAN_KEY,
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


    document.body.classList.toggle(
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
   AUTHENTICATION
========================================================= */

async function checkAuthentication() {

    try {

        if (
            typeof supabase ===
            "undefined"
        ) {

            /*
             * Some versions expose the client through
             * window.supabaseClient.
             */

            if (
                window.supabaseClient
            ) {

                const {
                    data
                } =
                    await window
                        .supabaseClient
                        .auth
                        .getUser();

                currentUser =
                    data?.user ||
                    null;

                return currentUser;
            }

            return null;
        }


        const client =
            window.supabaseClient ||
            supabase;


        const {
            data,
            error
        } =
            await client.auth.getUser();


        if (error) {

            console.warn(
                "StudyMind: Auth check failed.",
                error
            );

            return null;
        }


        currentUser =
            data?.user ||
            null;


        return currentUser;

    } catch (error) {

        console.warn(
            "StudyMind: Authentication unavailable.",
            error
        );

        return null;
    }
}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutStudyMind() {

    try {

        const client =
            window.supabaseClient ||
            (
                typeof supabase !==
                "undefined"
                    ? supabase
                    : null
            );


        if (client) {

            await client.auth.signOut();
        }

    } catch (error) {

        console.warn(
            "StudyMind: Logout error.",
            error
        );

    } finally {

        window.location.href =
            "login.html";
    }
}


/* =========================================================
   AI FREE LIMIT
========================================================= */

function getAIQuestionCount() {

    return Number(
        localStorage.getItem(
            AI_QUESTION_COUNT_KEY
        )
    ) || 0;
}


function canAskAIQuestion() {

    return (
        getAIQuestionCount() <
        FREE_QUESTION_LIMIT
    );
}


function incrementAIQuestionCount() {

    const count =
        getAIQuestionCount() + 1;

    localStorage.setItem(
        AI_QUESTION_COUNT_KEY,
        String(count)
    );

    return count;
}


/* =========================================================
   PREMIUM LINK
========================================================= */

function openPremium() {

    window.location.href =
        "premium.html";
}


/* =========================================================
   CURRENT USER GREETING
========================================================= */

function renderGreeting() {

    const elements = [
        "dashboardGreeting",
        "welcomeMessage",
        "greeting"
    ];


    let userName =
        "Student";


    if (currentUser) {

        userName =
            currentUser.user_metadata?.username ||
            currentUser.user_metadata?.display_name ||
            currentUser.email?.split("@")[0] ||
            "Student";
    }


    const hour =
        new Date().getHours();


    let greeting =
        "Good morning";


    if (hour >= 12 && hour < 18) {

        greeting =
            "Good afternoon";

    } else if (hour >= 18) {

        greeting =
            "Good evening";
    }


    for (const id of elements) {

        const element =
            $(id);

        if (element) {

            element.textContent =
                `${greeting}, ${userName} 👋`;
        }
    }
}


/* =========================================================
   TOPIC COMPLETE CHECKBOX
========================================================= */

function bindCompletionControls() {

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

                } else {

                    const topic =
                        getCurrentTopic();

                    if (!topic) {
                        return;
                    }


                    const key =
                        topicKey(topic);

                    const completed =
                        getCompletedTopics()
                            .filter(
                                item =>
                                    item !== key
                            );

                    saveCompletedTopics(
                        completed
                    );

                    topic.completed =
                        false;

                    saveDashboardState();

                    renderAll();
                }
            }
        );
    }


    const completeButton =
        $("completeTopicButton");


    if (completeButton) {

        completeButton.addEventListener(
            "click",
            completeCurrentTopic
        );
    }


    const knowledgeButton =
        $("startKnowledgeCheck");


    if (knowledgeButton) {

        knowledgeButton.addEventListener(
            "click",
            openKnowledgeCheckPage
        );
    }
}


/* =========================================================
   TIMER CONTROLS
========================================================= */

function bindTimerControls() {

    const start =
        $("startTimer");

    const stop =
        $("stopTimer");

    const reset =
        $("resetTimer");


    if (start) {

        start.addEventListener(
            "click",
            startTimer
        );
    }


    if (stop) {

        stop.addEventListener(
            "click",
            stopTimer
        );
    }


    if (reset) {

        reset.addEventListener(
            "click",
            resetTimer
        );
    }


    document
        .querySelectorAll(
            "[data-timer-minutes]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    setTimerDuration(
                        Number(
                            button.dataset
                                .timerMinutes
                        )
                    );
                }
            );
        });


    const selector =
        $("timerDuration");

    if (selector) {

        selector.addEventListener(
            "change",
            () => {

                setTimerDuration(
                    Number(
                        selector.value
                    )
                );
            }
        );
    }
}


/* =========================================================
   THEME CONTROLS
========================================================= */

function bindThemeControls() {

    const button =
        $("themeButton");

    if (button) {

        button.addEventListener(
            "click",
            toggleTheme
        );
    }
}


/* =========================================================
   LOGOUT CONTROLS
========================================================= */

function bindLogoutControls() {

    document
        .querySelectorAll(
            "[data-logout]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                logoutStudyMind
            );
        });


    const logoutButton =
        $("logoutButton");

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logoutStudyMind
        );
    }
}


/* =========================================================
   SAVE BEFORE LEAVING
========================================================= */

function bindUnloadSave() {

    window.addEventListener(
        "beforeunload",
        () => {

            saveCurrentReading();
            saveTimer();
            saveDashboardState();
        }
    );
}


/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {

    if (!studyPlan) {
        return;
    }


    renderPlanHeader();

    renderStats();

    renderSubjects();

    renderTopics();

    renderCurrentTopic();

    renderDailyChallenge();

    renderCalendar();

    renderSchedule();

    renderPlanSwitcher();

    renderTimer();

    applyTheme();

    renderGreeting();
}


/* =========================================================
   INITIALIZATION
========================================================= */

async function initializeDashboard() {

    console.log(
        "StudyMind: Initializing dashboard..."
    );


    /*
     * Load the active plan FIRST.
     *
     * Nothing else renders before this.
     */

    const loaded =
        loadActivePlan();


    if (!loaded) {

        console.warn(
            "StudyMind: No plan available."
        );

        return;
    }


    /*
     * Authentication does not determine which study plan
     * is loaded. The active plan registry does.
     */

    await checkAuthentication();


    updateStudyStreak();

    bindCompletionControls();

    bindTimerControls();

    bindThemeControls();

    bindLogoutControls();

    bindUnloadSave();

    startReadingPersistence();

    renderAll();


    console.log(
        "StudyMind: Dashboard ready.",
        {
            planId:
                activePlanRecord?.id,

            planTitle:
                studyPlan?.title,

            examDate:
                studyPlan?.examDate,

            topic:
                getCurrentTopic()
                    ?.name
        }
    );
}


/* =========================================================
   PUBLIC API
========================================================= */

window.StudyMindDashboard = {

    getStudyPlan:
        () => studyPlan,

    getActivePlanRecord:
        () => activePlanRecord,

    getCurrentTopic,

    loadActivePlan,

    saveDashboardState,

    syncActivePlanRecord,

    completeCurrentTopic,

    openKnowledgeCheckPage,

    startTimer,

    stopTimer,

    resetTimer,

    setTimerDuration,

    switchTopic,

    switchPlan,

    calculateStudyScore,

    canAskAIQuestion,

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
        initializeDashboard
    );

} else {

    initializeDashboard();
}
