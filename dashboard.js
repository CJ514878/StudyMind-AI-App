/* =========================================================
   STUDYMIND AI — DASHBOARD.JS
   FULL REBUILD

   CONNECTED TO:
   - home.html
   - script.js
   - dashboard.html
   - premium-dashboard.html
   - Supabase
   - /api/ask-ai
   - /api/generate-questions
   - /api/premium/status

   FEATURES
   ---------------------------------------------------------
   ✓ Uses the exact plan created on Home
   ✓ Active-plan protection
   ✓ Duplicate-plan repair
   ✓ Subjects
   ✓ Topics
   ✓ Progress
   ✓ Study score
   ✓ Streak
   ✓ Current study session
   ✓ 25 / 45 / 60 minute timer
   ✓ Calendar
   ✓ Blue glowing Study Days
   ✓ Red glowing Exam Day
   ✓ Purple Rest Days
   ✓ Schedule
   ✓ Daily Challenge
   ✓ Knowledge Check
   ✓ 5 free Knowledge Checks
   ✓ Unlimited Premium Knowledge Checks
   ✓ Ask AI
   ✓ 5 free AI questions
   ✓ Unlimited Premium AI
   ✓ AI progress analysis
   ✓ AI summarizer
   ✓ Premium limits
   ✓ Premium gold interface
   ✓ Light / Dark mode
   ✓ No hard-coded Math / Geometry
   ✓ No "Untitled Topic" unless Home actually created one
========================================================= */

"use strict";


/* =========================================================
   CONFIG
========================================================= */

const FREE_LIMIT = 5;

const FREE_QUESTION_LIMIT = 5;

const KNOWLEDGE_CHECK_LIMIT = 5;

const KNOWLEDGE_CHECK_COUNT = 5;

const KNOWLEDGE_CHECK_PASS_PERCENTAGE = 60;

const PREMIUM_STATUS_ENDPOINT =
    "/api/premium/status";

const QUESTION_ENDPOINT =
    "/api/generate-questions";

const AI_ENDPOINT =
    "/api/ask-ai";

const TIMER_OPTIONS = [
    25,
    45,
    60
];

const DEFAULT_TIMER_MINUTES = 25;

const DEFAULT_TIMER_SECONDS =
    DEFAULT_TIMER_MINUTES * 60;

const REQUEST_TIMEOUT = 45000;


/* =========================================================
   STORAGE
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

const KNOWLEDGE_USAGE_KEY =
    "studyMindKnowledgeCheckUsageCount";

const KNOWLEDGE_SESSION_KEY =
    "studyMindKnowledgeCheckCurrentSession";

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

const SUMMARY_COUNT_KEY =
    "summaryUsageCount";

const SUMMARY_DATE_KEY =
    "summaryUsageDate";

const STREAK_KEY =
    "studyMindStreak";

const LAST_STUDY_DATE_KEY =
    "lastStudyDate";


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentUser =
    null;

let isAuthenticated =
    false;

let isPremiumUser =
    false;

let premiumStatusLoaded =
    false;

let studyPlan =
    null;

let activePlanRecord =
    null;

let normalizedSubjects =
    [];

let allTopics =
    [];

let completedTopics =
    [];

let completedQuestionTopics =
    [];

let currentTopicIndex =
    0;

let topicQuestions =
    {};

let activeKnowledgeCheckTopicKey =
    null;

let knowledgeCheckGenerating =
    false;

let knowledgeCheckRequestId =
    0;

let selectedTimerSeconds =
    DEFAULT_TIMER_SECONDS;

let timerSeconds =
    DEFAULT_TIMER_SECONDS;

let timerRunning =
    false;

let timerInterval =
    null;

let timerEndTime =
    null;

let currentCalendarDate =
    new Date();


/* =========================================================
   DOM
========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   SAFE STORAGE
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
            "StudyMind storage read failed:",
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

        console.warn(
            "StudyMind storage write failed:",
            key,
            error
        );

        return false;
    }
}


function loadArray(key) {

    const value =
        readJSON(
            key,
            []
        );

    return Array.isArray(value)
        ? value
        : [];
}


/* =========================================================
   TEXT
========================================================= */

function cleanText(value) {

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


function slugify(value) {

    return cleanText(value)
        .toLowerCase()
        .replace(
            /[^a-z0-9]+/g,
            "-"
        )
        .replace(
            /^-+|-+$/g,
            ""
        )
        .slice(
            0,
            100
        );
}


/* =========================================================
   DATE
========================================================= */

function startOfDay(date) {

    const d =
        new Date(date);

    d.setHours(
        0,
        0,
        0,
        0
    );

    return d;
}


function dateKey(date) {

    const d =
        startOfDay(date);

    return [
        d.getFullYear(),
        String(
            d.getMonth() + 1
        ).padStart(
            2,
            "0"
        ),
        String(
            d.getDate()
        ).padStart(
            2,
            "0"
        )
    ].join("-");
}


function parseDate(value) {

    if (!value) {
        return null;
    }

    const d =
        new Date(
            String(value)
                .includes("T")
                ? value
                : `${value}T00:00:00`
        );

    return Number.isNaN(
        d.getTime()
    )
        ? null
        : d;
}


function formatDate(
    value,
    options = {
        month: "short",
        day: "numeric",
        year: "numeric"
    }
) {

    const d =
        parseDate(value);

    if (!d) {
        return "—";
    }

    return d.toLocaleDateString(
        undefined,
        options
    );
}


function daysBetween(
    a,
    b
) {

    const first =
        startOfDay(a);

    const second =
        startOfDay(b);

    return Math.round(
        (
            second.getTime() -
            first.getTime()
        ) /
        86400000
    );
}


function calculateDaysLeft() {

    if (!studyPlan?.examDate) {
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
   TIME
========================================================= */

function formatClockTime(value) {

    if (!value) {
        return "4:00 PM";
    }

    const parts =
        String(value)
            .split(":");

    let hour =
        Number(parts[0]);

    const minute =
        parts[1] ||
        "00";

    if (
        !Number.isFinite(hour)
    ) {
        return String(value);
    }

    const suffix =
        hour >= 12
            ? "PM"
            : "AM";

    hour =
        hour % 12 ||
        12;

    return `${hour}:${minute} ${suffix}`;
}


function formatTimer(
    seconds
) {

    seconds =
        Math.max(
            0,
            Number(seconds) || 0
        );

    const minutes =
        Math.floor(
            seconds / 60
        );

    const remaining =
        seconds % 60;

    return (
        String(minutes)
            .padStart(
                2,
                "0"
            ) +
        ":" +
        String(
            remaining
        ).padStart(
            2,
            "0"
        )
    );
}


/* =========================================================
   TOPIC NORMALIZATION
========================================================= */

function getTopicName(
    topic
) {

    if (
        typeof topic ===
        "string"
    ) {
        return cleanText(
            topic
        );
    }

    if (
        !topic ||
        typeof topic !==
        "object"
    ) {
        return "";
    }

    return cleanText(
        topic.name ||
        topic.topic ||
        topic.title ||
        topic.label ||
        topic.topicName ||
        topic.topic_name ||
        topic.lesson ||
        topic.lessonName ||
        topic.chapter ||
        topic.chapterName
    );
}


function getTopicSubject(
    topic,
    fallback = ""
) {

    if (
        typeof topic ===
        "string"
    ) {
        return cleanText(
            fallback
        );
    }

    if (
        !topic ||
        typeof topic !==
        "object"
    ) {
        return cleanText(
            fallback
        );
    }

    return cleanText(
        topic.subject ||
        topic.subjectName ||
        topic.course ||
        topic.courseName ||
        topic.subject_title ||
        fallback
    );
}


function getTopicDescription(
    topic
) {

    const name =
        getTopicName(
            topic
        );

    if (
        topic &&
        typeof topic ===
        "object"
    ) {

        return cleanText(
            topic.description ||
            topic.desc ||
            topic.summary ||
            topic.instruction ||
            topic.details ||
            `Study ${name} and complete the knowledge check.`
        );
    }

    return (
        `Study ${name} and complete the knowledge check.`
    );
}


function getTopicKey(
    topic
) {

    return (
        slugify(
            getTopicSubject(
                topic
            )
        ) +
        "::" +
        slugify(
            getTopicName(
                topic
            )
        )
    );
}


function normalizeTopic(
    rawTopic,
    fallbackSubject = "",
    index = 0
) {

    const name =
        getTopicName(
            rawTopic
        );

    if (!name) {
        return null;
    }

    const subject =
        getTopicSubject(
            rawTopic,
            fallbackSubject
        );

    return {

        id:
            (
                rawTopic &&
                typeof rawTopic ===
                "object"
            )
                ? (
                    rawTopic.id ||
                    rawTopic.topicId ||
                    rawTopic.topic_id ||
                    `topic-${index}-${slugify(name)}`
                )
                : `topic-${index}-${slugify(name)}`,

        name,

        subject,

        description:
            getTopicDescription(
                rawTopic
            ),

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
        typeof rawSubject ===
        "string" ||
        typeof rawSubject ===
        "number"
    ) {

        return {
            name:
                cleanText(
                    rawSubject
                ),
            topics: []
        };
    }

    if (
        !rawSubject ||
        typeof rawSubject !==
        "object"
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
            rawSubject.courseName
        );

    if (!name) {
        return null;
    }

    const topicSources = [
        rawSubject.topics,
        rawSubject.topicList,
        rawSubject.topic_list,
        rawSubject.lessons,
        rawSubject.lessonList,
        rawSubject.units,
        rawSubject.unitList,
        rawSubject.chapters,
        rawSubject.chapterList,
        rawSubject.modules,
        rawSubject.moduleList,
        rawSubject.subtopics,
        rawSubject.subTopics,
        rawSubject.curriculumTopics
    ];

    const topics = [];

    topicSources.forEach(
        source => {

            if (
                !Array.isArray(source)
            ) {
                return;
            }

            source.forEach(
                (
                    topic,
                    topicIndex
                ) => {

                    const normalized =
                        normalizeTopic(
                            topic,
                            name,
                            topicIndex
                        );

                    if (
                        normalized
                    ) {
                        topics.push(
                            normalized
                        );
                    }
                }
            );
        }
    );

    return {
        name,
        topics
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

    if (
        Array.isArray(
            rawPlan
        )
    ) {

        rawPlan = {
            topics:
                rawPlan
        };
    }

    if (
        typeof rawPlan !==
        "object"
    ) {
        return null;
    }

    let plan =
        rawPlan;

    if (
        rawPlan.studyPlan &&
        typeof rawPlan.studyPlan ===
        "object"
    ) {

        plan =
            rawPlan.studyPlan;

    } else if (
        rawPlan.plan &&
        typeof rawPlan.plan ===
        "object"
    ) {

        plan =
            rawPlan.plan;
    }


    const normalized = {

        id:
            cleanText(
                plan.id
            ),

        title:
            cleanText(
                plan.title ||
                plan.name ||
                "Study Plan"
            ),

        examType:
            cleanText(
                plan.examType ||
                plan.exam ||
                plan.exam_type ||
                "Exam"
            ),

        examDate:
            cleanText(
                plan.examDate ||
                plan.exam_date ||
                plan.testDate ||
                ""
            ),

        curriculum:
            cleanText(
                plan.curriculum ||
                "Nigerian Senior Secondary Curriculum"
            ),

        studyHours:
            Number(
                plan.studyHours ??
                plan.study_hours ??
                plan.hoursPerDay ??
                plan.hours ??
                1
            ),

        hoursPerDay:
            Number(
                plan.hoursPerDay ??
                plan.studyHours ??
                plan.study_hours ??
                1
            ),

        startTime:
            cleanText(
                plan.startTime ||
                "16:00"
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
                plan.startDate ||
                ""
            ),

        schedule:
            Array.isArray(
                plan.schedule
            )
                ? plan.schedule
                : Array.isArray(
                    plan.timetable
                )
                    ? plan.timetable
                    : [],

        timetable:
            Array.isArray(
                plan.timetable
            )
                ? plan.timetable
                : Array.isArray(
                    plan.schedule
                )
                    ? plan.schedule
                    : [],

        createdAt:
            plan.createdAt ||
            new Date()
                .toISOString(),

        updatedAt:
            plan.updatedAt ||
            plan.createdAt ||
            new Date()
                .toISOString(),

        subjects: [],

        topics: []
    };


    /* -----------------------------------------
       SUBJECTS
    ----------------------------------------- */

    const rawSubjects =
        Array.isArray(
            plan.subjects
        )
            ? plan.subjects
            : Array.isArray(
                plan.subjectList
            )
                ? plan.subjectList
                : Array.isArray(
                    plan.courses
                )
                    ? plan.courses
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


    /* -----------------------------------------
       TOP LEVEL TOPICS

       Home script stores topics directly.
    ----------------------------------------- */

    if (
        Array.isArray(
            plan.topics
        )
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


    /* -----------------------------------------
       If subjects contain topics but top-level
       topics doesn't, flatten them.
    ----------------------------------------- */

    if (
        normalized.topics.length ===
        0
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


    /* -----------------------------------------
       If there are top-level topics but subjects
       don't contain them, rebuild subjects.
    ----------------------------------------- */

    if (
        normalized.subjects.length ===
        0 &&
        normalized.topics.length > 0
    ) {

        const grouped =
            {};

        normalized.topics.forEach(
            topic => {

                const subject =
                    topic.subject ||
                    "Subject";

                if (
                    !grouped[subject]
                ) {
                    grouped[subject] = [];
                }

                grouped[subject].push(
                    topic
                );
            }
        );

        normalized.subjects =
            Object.keys(
                grouped
            ).map(
                name => ({
                    name,
                    topics:
                        grouped[name]
                })
            );
    }


    return normalized;
}


/* =========================================================
   PLAN SIGNATURE
========================================================= */

function planSignature(
    plan
) {

    const p =
        normalizePlan(
            plan
        );

    if (!p) {
        return "";
    }

    return [
        p.examDate,
        p.curriculum,
        p.studyHours,
        p.startTime,

        p.subjects
            .map(
                subject =>
                    `${slugify(subject.name)}:${subject.topics
                        .map(
                            topic =>
                                slugify(
                                    getTopicName(
                                        topic
                                    )
                                )
                        )
                        .sort()
                        .join(",")}`
            )
            .sort()
            .join("|"),

        p.topics
            .map(
                topic =>
                    getTopicKey(
                        topic
                    )
            )
            .sort()
            .join("|")
    ].join(
        "||"
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

    return localStorage.getItem(
        ACTIVE_PLAN_KEY
    );
}


function setActivePlanId(
    id
) {

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
   REPAIR PLAN REGISTRY
========================================================= */

function loadCorrectActivePlan() {

    let plans =
        getSavedPlans()
            .filter(
                record =>
                    record &&
                    record.plan
            )
            .map(
                record => ({
                    ...record,
                    plan:
                        normalizePlan(
                            record.plan
                        )
                })
            )
            .filter(
                record =>
                    record.plan
            );


    const activeId =
        getActivePlanId();

    let activeRecord =
        activeId
            ? plans.find(
                record =>
                    record.id ===
                    activeId
            )
            : null;


    /*
     * Home writes the newest generated plan into
     * studyMindPlan immediately before redirecting.
     *
     * If it doesn't match the active registry plan,
     * Home's current plan wins.
     */

    const homePlan =
        normalizePlan(
            readJSON(
                PLAN_KEY,
                null
            )
        );


    if (homePlan) {

        const homeSignature =
            planSignature(
                homePlan
            );

        const activeSignature =
            activeRecord
                ? planSignature(
                    activeRecord.plan
                )
                : "";


        if (
            !activeRecord ||
            homeSignature !==
            activeSignature
        ) {

            let matching =
                plans.find(
                    record =>
                        planSignature(
                            record.plan
                        ) ===
                        homeSignature
                );


            if (!matching) {

                matching = {

                    id:
                        homePlan.id ||
                        `plan-${Date.now()}-${Math.random()
                            .toString(36)
                            .slice(2, 8)}`,

                    title:
                        homePlan.title,

                    createdAt:
                        homePlan.createdAt ||
                        new Date()
                            .toISOString(),

                    updatedAt:
                        new Date()
                            .toISOString(),

                    plan:
                        homePlan
                };

                plans.unshift(
                    matching
                );
            }


            activeRecord =
                matching;

            setActivePlanId(
                matching.id
            );
        }
    }


    /*
     * No active record?
     * Pick newest valid plan.
     */

    if (
        !activeRecord &&
        plans.length
    ) {

        plans.sort(
            (
                a,
                b
            ) => {

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

                return (
                    bTime -
                    aTime
                );
            }
        );

        activeRecord =
            plans[0];

        setActivePlanId(
            activeRecord.id
        );
    }


    /*
     * No registry?
     * Recover legacy current plan.
     */

    if (
        !activeRecord &&
        homePlan
    ) {

        activeRecord = {

            id:
                homePlan.id ||
                `plan-${Date.now()}`,

            title:
                homePlan.title,

            createdAt:
                homePlan.createdAt ||
                new Date()
                    .toISOString(),

            updatedAt:
                new Date()
                    .toISOString(),

            plan:
                homePlan
        };

        plans.unshift(
            activeRecord
        );

        setActivePlanId(
            activeRecord.id
        );
    }


    if (!activeRecord) {

        console.error(
            "StudyMind: No study plan exists."
        );

        return false;
    }


    /*
     * Remove exact duplicate records while protecting
     * the active record.
     */

    const protectedId =
        activeRecord.id;

    const seen =
        new Set();

    const cleaned =
        [];


    plans.forEach(
        record => {

            if (
                !record ||
                !record.plan
            ) {
                return;
            }

            const signature =
                planSignature(
                    record.plan
                );

            if (!signature) {
                return;
            }

            if (
                seen.has(
                    signature
                ) &&
                record.id !==
                protectedId
            ) {

                return;
            }

            seen.add(
                signature
            );

            cleaned.push(
                record
            );
        }
    );


    plans =
        cleaned;


    const finalRecord =
        plans.find(
            record =>
                record.id ===
                protectedId
        ) ||
        activeRecord;


    activePlanRecord =
        finalRecord;

    studyPlan =
        normalizePlan(
            finalRecord.plan
        );


    /*
     * IMPORTANT:
     * Compatibility keys always represent the active plan.
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

    saveSavedPlans(
        plans
    );


    console.log(
        "StudyMind: ACTIVE PLAN",
        {
            id:
                activePlanRecord.id,

            title:
                studyPlan.title,

            examDate:
                studyPlan.examDate,

            subjects:
                studyPlan.subjects
                    .map(
                        subject =>
                            subject.name
                    ),

            topics:
                studyPlan.topics
                    .map(
                        topic =>
                            `${topic.subject}: ${topic.name}`
                    )
        }
    );


    return true;
}


/* =========================================================
   PLAN-SPECIFIC STATE
========================================================= */

function loadPlanState() {

    completedTopics =
        loadArray(
            COMPLETED_TOPICS_KEY
        );

    completedQuestionTopics =
        loadArray(
            COMPLETED_QUESTIONS_KEY
        );


    currentTopicIndex =
        Number(
            localStorage.getItem(
                CURRENT_TOPIC_KEY
            )
        ) || 0;


    topicQuestions =
        readJSON(
            KNOWLEDGE_QUESTIONS_KEY,
            {}
        );


    if (
        !topicQuestions ||
        typeof topicQuestions !==
        "object" ||
        Array.isArray(
            topicQuestions
        )
    ) {

        topicQuestions = {};
    }


    allTopics =
        studyPlan?.topics ||
        [];


    normalizedSubjects =
        studyPlan?.subjects ||
        [];


    if (
        currentTopicIndex < 0 ||
        currentTopicIndex >=
        allTopics.length
    ) {

        currentTopicIndex = 0;
    }


    localStorage.setItem(
        CURRENT_TOPIC_KEY,
        String(
            currentTopicIndex
        )
    );


    selectedTimerSeconds =
        Number(
            localStorage.getItem(
                TIMER_DURATION_KEY
            )
        ) ||
        DEFAULT_TIMER_SECONDS;


    if (
        !TIMER_OPTIONS.includes(
            selectedTimerSeconds / 60
        )
    ) {

        selectedTimerSeconds =
            DEFAULT_TIMER_SECONDS;
    }


    timerSeconds =
        Number(
            localStorage.getItem(
                TIMER_SECONDS_KEY
            )
        );


    if (
        !Number.isFinite(
            timerSeconds
        ) ||
        timerSeconds < 0
    ) {

        timerSeconds =
            selectedTimerSeconds;
    }
}


/* =========================================================
   SAVE STATE
========================================================= */

function saveCompletionState() {

    writeJSON(
        COMPLETED_TOPICS_KEY,
        completedTopics
    );

    writeJSON(
        COMPLETED_QUESTIONS_KEY,
        completedQuestionTopics
    );

    writeJSON(
        KNOWLEDGE_QUESTIONS_KEY,
        topicQuestions
    );

    localStorage.setItem(
        CURRENT_TOPIC_KEY,
        String(
            currentTopicIndex
        )
    );
}


function syncActivePlanRecord() {

    if (
        !activePlanRecord ||
        !studyPlan
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
        return false;
    }


    plans[index] = {

        ...plans[index],

        title:
            studyPlan.title,

        updatedAt:
            new Date()
                .toISOString(),

        plan:
            studyPlan
    };


    activePlanRecord =
        plans[index];


    saveSavedPlans(
        plans
    );

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

    return true;
}


function saveDashboardState() {

    saveCompletionState();

    syncActivePlanRecord();
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

    if (
        currentTopicIndex < 0 ||
        currentTopicIndex >=
        allTopics.length
    ) {

        currentTopicIndex = 0;
    }

    return allTopics[
        currentTopicIndex
    ];
}


function setCurrentTopic(
    index
) {

    index =
        Number(index);

    if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= allTopics.length
    ) {
        return;
    }


    currentTopicIndex =
        index;


    localStorage.setItem(
        CURRENT_TOPIC_KEY,
        String(
            currentTopicIndex
        )
    );


    localStorage.removeItem(
        KNOWLEDGE_TOPIC_KEY
    );


    activeKnowledgeCheckTopicKey =
        null;


    renderAll();
}


/* =========================================================
   COMPLETION
========================================================= */

function isTopicCompleted(
    topic
) {

    const key =
        getTopicKey(
            topic
        );

    return (
        completedTopics.includes(
            key
        ) ||
        completedTopics.includes(
            getTopicName(
                topic
            )
        )
    );
}


function markTopicCompleted(
    topic
) {

    if (!topic) {
        return;
    }

    const key =
        getTopicKey(
            topic
        );


    completedTopics =
        completedTopics.filter(
            item =>
                item !==
                getTopicName(
                    topic
                )
        );


    if (
        !completedTopics.includes(
            key
        )
    ) {

        completedTopics.push(
            key
        );
    }


    localStorage.setItem(
        LAST_STUDY_DATE_KEY,
        dateKey(
            new Date()
        )
    );


    updateStudyStreak();

    saveDashboardState();

    stopTimer();
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
        completedTopicCount() ===
        allTopics.length
    );
}


/* =========================================================
   KNOWLEDGE CHECK STATE
========================================================= */

function isKnowledgeCheckCompleted(
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
        completedQuestionTopics.includes(
            key
        ) ||
        completedQuestionTopics.includes(
            getTopicName(
                topic
            )
        )
    );
}


function markKnowledgeCheckCompleted(
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
        !completedQuestionTopics.includes(
            key
        )
    ) {

        completedQuestionTopics.push(
            key
        );
    }


    saveCompletionState();
}


/* =========================================================
   KNOWLEDGE CHECK LIMIT
========================================================= */

function getKnowledgeUsage() {

    if (
        isPremiumUser
    ) {
        return 0;
    }

    return Number(
        localStorage.getItem(
            KNOWLEDGE_USAGE_KEY
        )
    ) || 0;
}


function canUseKnowledgeCheck() {

    if (
        isPremiumUser
    ) {
        return true;
    }

    return (
        getKnowledgeUsage() <
        KNOWLEDGE_CHECK_LIMIT
    );
}


function recordKnowledgeCheckUsage() {

    if (
        isPremiumUser
    ) {
        return;
    }

    const next =
        getKnowledgeUsage() + 1;

    localStorage.setItem(
        KNOWLEDGE_USAGE_KEY,
        String(next)
    );
}


/* =========================================================
   KNOWLEDGE CHECK LAUNCH
========================================================= */

function getQuestionsSection() {

    return $(
        "topicQuestionsSection"
    );
}


function getQuestionsContainer() {

    return $(
        "topicQuestions"
    );
}


function hideKnowledgeCheck() {

    const section =
        getQuestionsSection();

    if (section) {

        section.style.display =
            "none";
    }

    activeKnowledgeCheckTopicKey =
        null;
}


function showKnowledgeCheck(
    topic
) {

    const section =
        getQuestionsSection();

    if (
        !section ||
        !topic
    ) {
        return;
    }


    activeKnowledgeCheckTopicKey =
        getTopicKey(
            topic
        );


    section.style.display =
        "block";


    if (
        isKnowledgeCheckCompleted(
            topic
        )
    ) {

        showKnowledgeCheckCompleted(
            topic
        );

        return;
    }


    if (
        !canUseKnowledgeCheck()
    ) {

        showKnowledgeCheckLimit();

        return;
    }


    const container =
        getQuestionsContainer();

    if (!container) {
        return;
    }


    const stored =
        topicQuestions[
            activeKnowledgeCheckTopicKey
        ];


    if (
        Array.isArray(
            stored
        ) &&
        stored.length >=
        KNOWLEDGE_CHECK_COUNT
    ) {

        renderKnowledgeQuestions(
            stored.slice(
                0,
                KNOWLEDGE_CHECK_COUNT
            )
        );

        return;
    }


    renderGenerateQuestionsPrompt(
        topic
    );
}


function showKnowledgeCheckCompleted(
    topic
) {

    const section =
        getQuestionsSection();

    const container =
        getQuestionsContainer();

    if (section) {

        section.style.display =
            "block";
    }


    if (container) {

        container.innerHTML = `
            <div class="ai-limit-message">
                <h3>🎉 Knowledge Check Completed</h3>

                <p>
                    You have completed the
                    5-question Knowledge Check
                    for
                    <strong>
                        ${escapeHTML(
                            getTopicName(topic)
                        )}
                    </strong>.
                </p>

                ${
                    isPremiumUser
                        ? `
                            <p>
                                👑 Premium gives you
                                unlimited Knowledge Checks.
                            </p>
                        `
                        : `
                            <p>
                                You can continue practising
                                with Premium.
                            </p>

                            <button
                                type="button"
                                class="premium-button"
                                onclick="openPremiumOffer()"
                            >
                                💎 Explore Premium
                            </button>
                        `
                }
            </div>
        `;
    }
}


function showKnowledgeCheckLimit() {

    const section =
        getQuestionsSection();

    const container =
        getQuestionsContainer();

    if (section) {

        section.style.display =
            "block";
    }


    if (container) {

        container.innerHTML = `
            <div class="ai-limit-message">
                <h3>🔒 Free Knowledge Check Limit</h3>

                <p>
                    You've used all
                    ${KNOWLEDGE_CHECK_LIMIT}
                    free Knowledge Checks.
                </p>

                <p>
                    Upgrade to Premium for
                    unlimited Knowledge Checks.
                </p>

                <button
                    type="button"
                    class="premium-button"
                    onclick="openPremiumOffer()"
                >
                    💎 Explore Premium
                </button>
            </div>
        `;
    }
}


/* =========================================================
   OPEN KNOWLEDGE CHECK PAGE
========================================================= */

window.openKnowledgeCheckPage =
    function (
        topic
    ) {

        if (!topic) {
            return;
        }


        if (
            !canUseKnowledgeCheck()
        ) {

            showKnowledgeCheckLimit();

            return;
        }


        const topicData = {

            name:
                getTopicName(
                    topic
                ),

            subject:
                getTopicSubject(
                    topic
                ),

            description:
                getTopicDescription(
                    topic
                ),

            key:
                getTopicKey(
                    topic
                ),

            planId:
                activePlanRecord?.id ||
                getActivePlanId(),

            checkId:
                `${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2)}`
        };


        writeJSON(
            KNOWLEDGE_TOPIC_KEY,
            topicData
        );


        /*
         * Store current active plan as well so the
         * Knowledge Check page knows exactly where
         * it came from.
         */

        localStorage.setItem(
            ACTIVE_PLAN_KEY,
            activePlanRecord?.id ||
            getActivePlanId() ||
            ""
        );


        window.location.href =
            "knowledge-check.html";
    };


/* =========================================================
   KNOWLEDGE CHECK PROMPT
========================================================= */

function renderGenerateQuestionsPrompt(
    topic
) {

    const container =
        getQuestionsContainer();

    if (!container) {
        return;
    }


    container.innerHTML = `
        <div
            class="generate-questions-prompt"
            style="
                padding:28px;
                border-radius:18px;
                text-align:center;
            "
        >

            <div
                style="
                    font-size:42px;
                    margin-bottom:12px;
                "
            >
                🧠
            </div>

            <h3>
                Ready to test yourself?
            </h3>

            <p>
                StudyMind AI will prepare
                exactly 5 questions based on
                <strong>
                    ${escapeHTML(
                        getTopicName(topic)
                    )}
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
                id="questionGenerationStatus"
                style="
                    margin-top:12px;
                    opacity:.75;
                "
            ></div>

        </div>
    `;


    const button =
        $(
            "generateTopicQuestionsButton"
        );


    if (button) {

        button.addEventListener(
            "click",
            () =>
                generateTopicQuestions(
                    topic
                )
        );
    }
}


/* =========================================================
   QUESTION REQUEST
========================================================= */

async function fetchWithTimeout(
    url,
    options = {},
    timeout = REQUEST_TIMEOUT
) {

    const controller =
        new AbortController();

    const timeoutId =
        setTimeout(
            () =>
                controller.abort(),
            timeout
        );


    try {

        return await fetch(
            url,
            {
                ...options,
                signal:
                    controller.signal
            }
        );

    } finally {

        clearTimeout(
            timeoutId
        );
    }
}


async function requestQuestions(
    endpoint,
    body
) {

    const response =
        await fetchWithTimeout(
            endpoint,
            {
                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(
                        body
                    )
            }
        );


    const data =
        await response
            .json()
            .catch(
                () => ({})
            );


    if (
        !response.ok
    ) {

        throw new Error(
            data?.error ||
            `${endpoint} returned ${response.status}`
        );
    }


    return data;
}


/* =========================================================
   EXTRACT QUESTIONS
========================================================= */

function extractQuestions(
    data
) {

    if (
        Array.isArray(data)
    ) {
        return data;
    }


    const candidates = [

        data?.questions,

        data?.data?.questions,

        data?.result?.questions,

        data?.response?.questions,

        data?.reply?.questions
    ];


    for (
        const candidate of
        candidates
    ) {

        if (
            Array.isArray(
                candidate
            )
        ) {

            return candidate;
        }
    }


    /*
     * Some ask-ai responses return JSON inside reply.
     */

    if (
        typeof data?.reply ===
        "string"
    ) {

        try {

            const parsed =
                JSON.parse(
                    data.reply
                );

            if (
                Array.isArray(
                    parsed
                )
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
            /* Ignore */
        }
    }


    return [];
}


function normalizeQuestion(
    question,
    index
) {

    if (
        !question ||
        typeof question !==
        "object"
    ) {
        return null;
    }


    const text =
        cleanText(
            question.question ||
            question.questionText ||
            question.prompt ||
            question.text
        );


    let options =
        question.options ||
        question.choices ||
        question.answers ||
        [];


    if (
        !Array.isArray(
            options
        )
    ) {
        options = [];
    }


    options =
        options.map(
            option =>
                cleanText(
                    typeof option ===
                    "object"
                        ? (
                            option.text ||
                            option.answer ||
                            option.label
                        )
                        : option
                )
        )
        .filter(Boolean);


    const answer =
        question.correctAnswer ??
        question.correct ??
        question.answer ??
        question.correctOption ??
        question.correctIndex;


    if (
        !text ||
        options.length <
        2
    ) {
        return null;
    }


    return {

        id:
            question.id ||
            `question-${index}`,

        question:
            text,

        options,

        correctAnswer:
            answer,

        explanation:
            cleanText(
                question.explanation ||
                question.explain ||
                ""
            )
    };
}


/* =========================================================
   KNOWLEDGE CHECK GENERATION
========================================================= */

function buildKnowledgePrompt(
    topic
) {

    return `
Create exactly 5 multiple-choice questions for a Nigerian Senior Secondary student.

Subject:
${getTopicSubject(topic)}

Topic:
${getTopicName(topic)}

Curriculum:
${studyPlan?.curriculum || "Nigerian Senior Secondary Curriculum"}

Difficulty:
mixed

Return ONLY valid JSON in this structure:

{
  "questions": [
    {
      "question": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correctAnswer": 0,
      "explanation": "Short explanation"
    }
  ]
}

The correctAnswer must be the zero-based option index.

Do not add fewer or more than 5 questions.
`.trim();
}


async function generateTopicQuestions(
    topic
) {

    if (
        knowledgeCheckGenerating
    ) {
        return;
    }


    if (
        !canUseKnowledgeCheck()
    ) {

        showKnowledgeCheckLimit();

        return;
    }


    knowledgeCheckGenerating =
        true;


    const requestId =
        ++knowledgeCheckRequestId;


    const container =
        getQuestionsContainer();


    const status =
        $(
            "questionGenerationStatus"
        );


    if (container) {

        container.innerHTML = `
            <div
                style="
                    padding:30px;
                    text-align:center;
                "
            >
                <div
                    style="
                        font-size:40px;
                        margin-bottom:12px;
                    "
                >
                    🤖
                </div>

                <h3>
                    Preparing your Knowledge Check...
                </h3>

                <p>
                    StudyMind AI is creating
                    5 questions for
                    <strong>
                        ${escapeHTML(
                            getTopicName(topic)
                        )}
                    </strong>.
                </p>
            </div>
        `;
    }


    try {

        const payload = {

            subject:
                getTopicSubject(
                    topic
                ),

            topic:
                getTopicName(
                    topic
                ),

            numberOfQuestions:
                KNOWLEDGE_CHECK_COUNT,

            questionCount:
                KNOWLEDGE_CHECK_COUNT,

            count:
                KNOWLEDGE_CHECK_COUNT,

            curriculum:
                studyPlan?.curriculum ||
                "Nigerian Senior Secondary curriculum",

            difficulty:
                "mixed",

            type:
                "knowledge_check",

            requestType:
                "knowledge_check"
        };


        let data =
            null;

        let questions =
            [];


        /*
         * PRIMARY
         */

        try {

            data =
                await requestQuestions(
                    QUESTION_ENDPOINT,
                    payload
                );

            questions =
                extractQuestions(
                    data
                );

        } catch (
            primaryError
        ) {

            console.warn(
                "Primary question endpoint failed:",
                primaryError
            );
        }


        /*
         * FALLBACK
         */

        if (
            questions.length <
            KNOWLEDGE_CHECK_COUNT
        ) {

            data =
                await requestQuestions(
                    AI_ENDPOINT,
                    {
                        ...payload,

                        mode:
                            "knowledge_check",

                        message:
                            buildKnowledgePrompt(
                                topic
                            )
                    }
                );

            questions =
                extractQuestions(
                    data
                );
        }


        if (
            requestId !==
            knowledgeCheckRequestId
        ) {
            return;
        }


        const normalized =
            questions
                .slice(
                    0,
                    KNOWLEDGE_CHECK_COUNT
                )
                .map(
                    (
                        question,
                        index
                    ) =>
                        normalizeQuestion(
                            question,
                            index
                        )
                )
                .filter(Boolean);


        if (
            normalized.length <
            KNOWLEDGE_CHECK_COUNT
        ) {

            throw new Error(
                "StudyMind AI did not return 5 valid questions."
            );
        }


        const key =
            getTopicKey(
                topic
            );


        topicQuestions[key] =
            normalized;


        writeJSON(
            KNOWLEDGE_QUESTIONS_KEY,
            topicQuestions
        );


        /*
         * Count one Knowledge Check generation.
         */

        recordKnowledgeCheckUsage();


        activeKnowledgeCheckTopicKey =
            key;


        renderKnowledgeQuestions(
            normalized
        );


    } catch (error) {

        console.error(
            "Knowledge Check generation failed:",
            error
        );


        if (container) {

            container.innerHTML = `
                <div class="ai-limit-message">

                    <h3>
                        ⚠️ Unable to create the Knowledge Check
                    </h3>

                    <p>
                        StudyMind AI could not generate
                        the questions right now.
                    </p>

                    <button
                        type="button"
                        class="primary-button"
                        onclick="showKnowledgeCheck(getCurrentTopic())"
                    >
                        Try Again
                    </button>

                </div>
            `;
        }

    } finally {

        knowledgeCheckGenerating =
            false;
    }
}


/* =========================================================
   RENDER KNOWLEDGE QUESTIONS
========================================================= */

function renderKnowledgeQuestions(
    questions
) {

    const section =
        getQuestionsSection();

    const container =
        getQuestionsContainer();

    const submit =
        $("submitTopicQuestions");


    if (
        section
    ) {

        section.style.display =
            "block";
    }


    if (
        !container
    ) {
        return;
    }


    container.innerHTML =
        questions
            .map(
                (
                    question,
                    index
                ) => {

                    return `
                        <div
                            class="knowledge-question"
                            data-question-index="${index}"
                            style="
                                margin-bottom:22px;
                                padding:20px;
                                border-radius:16px;
                                border:1px solid rgba(127,127,127,.18);
                            "
                        >

                            <div
                                style="
                                    font-weight:700;
                                    margin-bottom:14px;
                                "
                            >
                                ${index + 1}.
                                ${escapeHTML(
                                    question.question
                                )}
                            </div>

                            <div
                                class="knowledge-options"
                            >

                                ${question.options
                                    .map(
                                        (
                                            option,
                                            optionIndex
                                        ) => `
                                            <label
                                                style="
                                                    display:flex;
                                                    gap:10px;
                                                    align-items:flex-start;
                                                    padding:12px;
                                                    margin:8px 0;
                                                    border-radius:12px;
                                                    cursor:pointer;
                                                    border:1px solid rgba(127,127,127,.15);
                                                "
                                            >

                                                <input
                                                    type="radio"
                                                    name="knowledge-question-${index}"
                                                    value="${optionIndex}"
                                                >

                                                <span>
                                                    ${escapeHTML(
                                                        option
                                                    )}
                                                </span>

                                            </label>
                                        `
                                    )
                                    .join("")}

                            </div>

                        </div>
                    `;
                }
            )
            .join("");


    if (submit) {

        submit.style.display =
            "block";

        submit.disabled =
            false;
    }


    section?.scrollIntoView({
        behavior:
            "smooth",
        block:
            "nearest"
    });
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


    const key =
        getTopicKey(
            topic
        );


    const questions =
        topicQuestions[key];


    if (
        !Array.isArray(
            questions
        ) ||
        questions.length <
        KNOWLEDGE_CHECK_COUNT
    ) {
        return;
    }


    let score =
        0;


    questions
        .slice(
            0,
            KNOWLEDGE_CHECK_COUNT
        )
        .forEach(
            (
                question,
                index
            ) => {

                const selected =
                    document.querySelector(
                        `input[name="knowledge-question-${index}"]:checked`
                    );


                if (!selected) {
                    return;
                }


                const selectedIndex =
                    Number(
                        selected.value
                    );


                const correct =
                    question.correctAnswer;


                const correctIndex =
                    typeof correct ===
                    "number"
                        ? correct
                        : Number(
                            correct
                        );


                if (
                    Number.isFinite(
                        correctIndex
                    ) &&
                    selectedIndex ===
                    correctIndex
                ) {

                    score++;
                }
            }
        );


    const percentage =
        Math.round(
            (
                score /
                KNOWLEDGE_CHECK_COUNT
            ) *
            100
        );


    const result =
        $("topicQuestionResult");


    if (result) {

        result.innerHTML = `
            <div
                class="knowledge-result"
                style="
                    padding:20px;
                    margin-top:18px;
                    border-radius:16px;
                "
            >

                <h3>
                    ${
                        percentage >=
                        KNOWLEDGE_CHECK_PASS_PERCENTAGE
                            ? "🎉 Knowledge Check Passed"
                            : "📚 Keep Practising"
                    }
                </h3>

                <p>
                    You scored
                    <strong>
                        ${score}/${KNOWLEDGE_CHECK_COUNT}
                    </strong>
                    (${percentage}%).
                </p>

                <p>
                    ${
                        percentage >=
                        KNOWLEDGE_CHECK_PASS_PERCENTAGE
                            ? "Great work! This topic is now fully completed."
                            : "Review the topic and try again when you're ready."
                    }
                </p>

            </div>
        `;
    }


    if (
        percentage >=
        KNOWLEDGE_CHECK_PASS_PERCENTAGE
    ) {

        markKnowledgeCheckCompleted(
            topic
        );


        if (
            !isTopicCompleted(
                topic
            )
        ) {

            markTopicCompleted(
                topic
            );
        }


        renderAll();
    }


    const submit =
        $("submitTopicQuestions");

    if (submit) {

        submit.disabled =
            true;
    }
}


/* =========================================================
   TIMER
========================================================= */

function renderTimer() {

    const elements = [

        $("studyTimer"),

        $("timerDisplay"),

        $("studyTimerDisplay")
    ];


    const value =
        formatTimer(
            timerSeconds
        );


    elements
        .filter(Boolean)
        .forEach(
            element => {

                element.textContent =
                    value;
            }
        );


    const duration =
        $("timerDuration");


    if (
        duration &&
        duration.tagName ===
        "SELECT"
    ) {

        duration.value =
            String(
                selectedTimerSeconds
            );
    }


    const minutes =
        $("timerMinutes");

    if (
        minutes &&
        minutes.tagName !==
        "SELECT"
    ) {

        minutes.textContent =
            String(
                Math.floor(
                    timerSeconds /
                    60
                )
            );
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

    localStorage.setItem(
        TIMER_RUNNING_KEY,
        timerRunning
            ? "1"
            : "0"
    );

    if (timerEndTime) {

        localStorage.setItem(
            TIMER_END_TIME_KEY,
            String(
                timerEndTime
            )
        );
    }
}


function setTimerDuration(
    minutes
) {

    minutes =
        Number(minutes);


    if (
        !TIMER_OPTIONS.includes(
            minutes
        )
    ) {
        minutes =
            DEFAULT_TIMER_MINUTES;
    }


    stopTimer();


    selectedTimerSeconds =
        minutes * 60;

    timerSeconds =
        selectedTimerSeconds;


    saveTimerState();

    renderTimer();
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


    timerEndTime =
        Date.now() +
        (
            timerSeconds *
            1000
        );


    timerInterval =
        setInterval(
            updateTimer,
            250
        );


    saveTimerState();

    updateTimerButtons();
}


function updateTimer() {

    if (
        !timerRunning
    ) {
        return;
    }


    const remaining =
        Math.max(
            0,
            Math.ceil(
                (
                    timerEndTime -
                    Date.now()
                ) /
                1000
            )
        );


    timerSeconds =
        remaining;


    renderTimer();


    if (
        remaining <= 0
    ) {

        finishTimer();
    }
}


function finishTimer() {

    stopTimer();


    timerSeconds =
        selectedTimerSeconds;


    saveTimerState();

    renderTimer();


    const message =
        $("timerMessage");


    if (message) {

        message.textContent =
            "🎉 Study session complete. Great work!";
    }
}


function stopTimer() {

    if (
        timerInterval
    ) {

        clearInterval(
            timerInterval
        );

        timerInterval =
            null;
    }


    timerRunning =
        false;

    timerEndTime =
        null;


    localStorage.removeItem(
        TIMER_RUNNING_KEY
    );

    localStorage.removeItem(
        TIMER_END_TIME_KEY
    );


    updateTimerButtons();
}


function resetTimer() {

    stopTimer();


    timerSeconds =
        selectedTimerSeconds;


    saveTimerState();

    renderTimer();
}


function updateTimerButtons() {

    const startButtons = [
        $("startTimer"),
        $("startTimerButton")
    ];


    const pauseButtons = [
        $("pauseTimer"),
        $("pauseTimerButton"),
        $("stopTimer")
    ];


    startButtons
        .filter(Boolean)
        .forEach(
            button => {

                button.disabled =
                    timerRunning;

                button.textContent =
                    timerRunning
                        ? "Running"
                        : "Start";
            }
        );


    pauseButtons
        .filter(Boolean)
        .forEach(
            button => {

                button.disabled =
                    !timerRunning;
            }
        );
}


function restoreTimer() {

    selectedTimerSeconds =
        Number(
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


    const savedRunning =
        localStorage.getItem(
            TIMER_RUNNING_KEY
        ) === "1";


    const savedEnd =
        Number(
            localStorage.getItem(
                TIMER_END_TIME_KEY
            )
        );


    timerSeconds =
        Number(
            localStorage.getItem(
                TIMER_SECONDS_KEY
            )
        );


    if (
        !Number.isFinite(
            timerSeconds
        )
    ) {

        timerSeconds =
            selectedTimerSeconds;
    }


    if (
        savedRunning &&
        Number.isFinite(
            savedEnd
        ) &&
        savedEnd > Date.now()
    ) {

        timerEndTime =
            savedEnd;

        timerRunning =
            true;

        timerInterval =
            setInterval(
                updateTimer,
                250
            );

    } else {

        timerRunning =
            false;

        timerEndTime =
            null;
    }


    renderTimer();

    updateTimerButtons();
}


/* =========================================================
   STREAK
========================================================= */

function getStreak() {

    return Number(
        localStorage.getItem(
            STREAK_KEY
        )
    ) || 0;
}


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
        getStreak();


    if (!last) {

        streak =
            1;

    } else if (
        last ===
        today
    ) {

        if (
            streak <= 0
        ) {
            streak =
                1;
        }

    } else {

        const difference =
            daysBetween(
                parseDate(last),
                new Date()
            );


        if (
            difference ===
            1
        ) {

            streak =
                Math.max(
                    1,
                    streak + 1
                );

        } else if (
            difference > 1
        ) {

            streak =
                1;
        }
    }


    localStorage.setItem(
        STREAK_KEY,
        String(
            streak
        )
    );


    return streak;
}


/* =========================================================
   STUDY SCORE
========================================================= */

function calculateStudyScore() {

    const total =
        allTopics.length;


    if (!total) {
        return 0;
    }


    const completed =
        completedTopicCount();


    const knowledge =
        allTopics.filter(
            topic =>
                isKnowledgeCheckCompleted(
                    topic
                )
        ).length;


    const topicScore =
        (
            completed /
            total
        ) * 100;


    const knowledgeScore =
        (
            knowledge /
            total
        ) * 100;


    if (
        knowledge ===
        0
    ) {

        return Math.round(
            topicScore
        );
    }


    return Math.round(
        (
            topicScore *
            0.6
        ) +
        (
            knowledgeScore *
            0.4
        )
    );
}


/* =========================================================
   METRICS
========================================================= */

function renderMetrics() {

    const hours =
        Number(
            studyPlan?.studyHours ||
            studyPlan?.hoursPerDay
        ) || 0;


    const weeklyHours =
        $("weeklyHours");

    if (weeklyHours) {

        weeklyHours.textContent =
            `${(
                hours * 7
            ).toFixed(
                hours % 1 === 0
                    ? 0
                    : 1
            )} hrs`;
    }


    const daysLeft =
        $("daysLeft");

    if (daysLeft) {

        daysLeft.textContent =
            String(
                calculateDaysLeft()
            );
    }


    const dailyGoal =
        $("dailyGoal");

    if (dailyGoal) {

        dailyGoal.textContent =
            `${hours} hrs/day`;
    }


    const score =
        calculateStudyScore();


    const scoreElement =
        $("studyScore");

    if (scoreElement) {

        scoreElement.textContent =
            String(
                score
            );
    }


    const scoreDisplay =
        $("scoreDisplay");

    if (scoreDisplay) {

        scoreDisplay.textContent =
            `${score}%`;
    }


    const scoreBar =
        $("scoreProgressBar");

    if (scoreBar) {

        scoreBar.style.width =
            `${score}%`;
    }


    const streak =
        $("streak");

    if (streak) {

        streak.textContent =
            `${getStreak()} Days 🔥`;
    }


    renderProgress();
}


function renderProgress() {

    const total =
        allTopics.length;

    const completed =
        completedTopicCount();


    const percentage =
        total
            ? Math.round(
                (
                    completed /
                    total
                ) * 100
            )
            : 0;


    const percent =
        $("progressPercent");

    if (percent) {

        percent.textContent =
            `${percentage}%`;
    }


    const count =
        $("progressCount");

    if (count) {

        count.textContent =
            `${completed} of ${total} topics completed`;
    }


    const bar =
        $("progressBar");

    if (bar) {

        bar.style.width =
            `${percentage}%`;
    }
}


/* =========================================================
   SUBJECTS
========================================================= */

function renderSubjects() {

    const container =
        $("subjectList");

    if (
        !container
    ) {
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
                subject => {

                    const total =
                        subject.topics.length;

                    const completed =
                        subject.topics.filter(
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
                        <div
                            class="subject-card"
                        >

                            <div
                                class="subject-card-header"
                            >

                                <strong>
                                    ${escapeHTML(
                                        subject.name
                                    )}
                                </strong>

                                <span>
                                    ${completed}/${total}
                                </span>

                            </div>

                            <div
                                class="subject-progress"
                            >
                                <div
                                    class="subject-progress-bar"
                                    style="
                                        width:${percent}%;
                                    "
                                ></div>
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

    if (
        !container
    ) {
        return;
    }


    if (
        !allTopics.length
    ) {

        container.innerHTML = `
            <div class="empty-state">
                Your study plan has no topics yet.
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

                    const active =
                        index ===
                        currentTopicIndex;


                    return `
                        <button
                            type="button"
                            class="topic-item
                                ${active ? "active" : ""}
                                ${completed ? "completed" : ""}"
                            data-topic-index="${index}"
                        >

                            <span
                                class="topic-item-number"
                            >
                                ${
                                    completed
                                        ? "✓"
                                        : index + 1
                                }
                            </span>

                            <span
                                class="topic-item-content"
                            >

                                <strong>
                                    ${escapeHTML(
                                        getTopicName(
                                            topic
                                        )
                                    )}
                                </strong>

                                <small>
                                    ${escapeHTML(
                                        getTopicSubject(
                                            topic
                                        )
                                    )}
                                </small>

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
                    () =>
                        setCurrentTopic(
                            Number(
                                button.dataset
                                    .topicIndex
                            )
                        )
                );
            }
        );
}


/* =========================================================
   CURRENT TOPIC CARD
========================================================= */

function renderCurrentTopic() {

    const topic =
        getCurrentTopic();


    const name =
        $("currentTopicName");

    const description =
        $("currentTopicDescription");

    const position =
        $("topicPosition");

    const badge =
        $("topicStatusBadge");

    const checkbox =
        $("topicCompleteCheckbox");

    const message =
        $("topicCompletionMessage");

    const nextMessage =
        $("nextTopicMessage");


    if (!topic) {

        if (name) {
            name.textContent =
                "No topic available";
        }

        if (description) {
            description.textContent =
                "Create a study plan on Home to begin.";
        }

        hideKnowledgeCheck();

        return;
    }


    if (name) {

        name.textContent =
            getTopicName(
                topic
            );
    }


    if (description) {

        description.textContent =
            getTopicDescription(
                topic
            );
    }


    if (position) {

        position.textContent =
            `TOPIC ${currentTopicIndex + 1} OF ${allTopics.length}`;
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

        badge.classList.toggle(
            "completed",
            completed
        );
    }


    if (checkbox) {

        checkbox.checked =
            completed;
    }


    if (message) {

        message.textContent =
            completed
                ? "Topic completed. Your Knowledge Check is available."
                : "Tick this box when you are done studying this topic.";
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
                `Next topic: ${getTopicName(next)}`;

        } else {

            nextMessage.textContent =
                allTopicsCompleted()
                    ? "🎉 You have completed your entire study plan."
                    : "This is the final topic in your study plan.";
        }
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
   COMPLETE TOPIC UI
========================================================= */

function setupTopicCompletion() {

    const checkbox =
        $("topicCompleteCheckbox");


    if (checkbox) {

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

                    markTopicCompleted(
                        topic
                    );

                } else {

                    const key =
                        getTopicKey(
                            topic
                        );


                    completedTopics =
                        completedTopics.filter(
                            item =>
                                item !==
                                key
                        );


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
            () => {

                markTopicCompleted(
                    getCurrentTopic()
                );

                renderAll();
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
}


/* =========================================================
   SCHEDULE DATA
========================================================= */

function getScheduleEntries() {

    if (!studyPlan) {
        return [];
    }


    const sources = [

        studyPlan.schedule,

        studyPlan.timetable,

        studyPlan.studySchedule,

        studyPlan.dailySchedule
    ];


    for (
        const source of
        sources
    ) {

        if (
            Array.isArray(
                source
            ) &&
            source.length
        ) {

            return source;
        }
    }


    return [];
}


/* =========================================================
   SCHEDULE
========================================================= */

function renderSchedule() {

    const container =
        $("scheduleList");

    if (
        !container
    ) {
        return;
    }


    const entries =
        getScheduleEntries();


    /*
     * If Home provided a schedule, use it.
     */

    if (
        entries.length
    ) {

        container.innerHTML =
            entries
                .slice(
                    0,
                    12
                )
                .map(
                    entry => {

                        const day =
                            cleanText(
                                entry.day ||
                                entry.date ||
                                entry.dayName ||
                                ""
                            );

                        const topic =
                            cleanText(
                                entry.topic ||
                                entry.topicName ||
                                entry.title ||
                                entry.subject ||
                                "Study Session"
                            );

                        const time =
                            cleanText(
                                entry.time ||
                                entry.startTime ||
                                studyPlan.startTime
                            );


                        return `
                            <div
                                class="schedule-item"
                            >

                                <div
                                    class="schedule-time"
                                >
                                    ${escapeHTML(
                                        formatClockTime(
                                            time
                                        )
                                    )}
                                </div>

                                <div
                                    class="schedule-content"
                                >

                                    <strong>
                                        ${escapeHTML(
                                            topic
                                        )}
                                    </strong>

                                    <span>
                                        ${escapeHTML(
                                            day
                                        )}
                                    </span>

                                </div>

                            </div>
                        `;
                    }
                )
                .join("");

        return;
    }


    /*
     * Fallback schedule derived directly from
     * the current topic.
     */

    const topic =
        getCurrentTopic();


    if (!topic) {

        container.innerHTML = `
            <div class="empty-schedule">
                Your study schedule will appear here.
            </div>
        `;

        return;
    }


    container.innerHTML = `
        <div class="schedule-item">

            <div class="schedule-time">
                ${escapeHTML(
                    formatClockTime(
                        studyPlan.startTime
                    )
                )}
            </div>

            <div class="schedule-content">

                <strong>
                    ${escapeHTML(
                        getTopicName(
                            topic
                        )
                    )}
                </strong>

                <span>
                    ${escapeHTML(
                        getTopicSubject(
                            topic
                        )
                    )}
                    ·
                    ${studyPlan.studyHours || studyPlan.hoursPerDay || 1}
                    hr study session
                </span>

            </div>

        </div>
    `;
}


/* =========================================================
   NEXT SESSION
========================================================= */

function renderNextSession() {

    const topic =
        getCurrentTopic();


    const booking =
        $("nextBooking");

    const bookingTime =
        $("nextBookingTime");


    if (!topic) {

        if (booking) {
            booking.textContent =
                "No session scheduled";
        }

        if (bookingTime) {
            bookingTime.textContent =
                "Create a study plan to begin";
        }

        return;
    }


    if (booking) {

        booking.textContent =
            getTopicName(
                topic
            );
    }


    if (bookingTime) {

        bookingTime.textContent =
            formatClockTime(
                studyPlan.startTime
            );
    }
}


/* =========================================================
   CALENDAR DAY STATUS
========================================================= */

function getDayStatus(
    date
) {

    const day =
        startOfDay(
            date
        );

    const exam =
        parseDate(
            studyPlan?.examDate
        );


    if (
        exam &&
        dateKey(day) ===
        dateKey(exam)
    ) {

        return "exam";
    }


    /*
     * First honour explicit Home timetable/schedule data.
     */

    const entries =
        getScheduleEntries();


    if (
        entries.length
    ) {

        const key =
            dateKey(
                day
            );


        const matching =
            entries.find(
                entry => {

                    const entryDate =
                        entry?.date ||
                        entry?.dayDate ||
                        entry?.studyDate;

                    if (!entryDate) {
                        return false;
                    }

                    return (
                        dateKey(
                            parseDate(
                                entryDate
                            )
                        ) ===
                        key
                    );
                }
            );


        if (matching) {

            const type =
                cleanText(
                    matching.type ||
                    matching.status ||
                    matching.dayType ||
                    ""
                ).toLowerCase();


            if (
                type.includes(
                    "rest"
                )
            ) {
                return "rest";
            }


            if (
                type.includes(
                    "study"
                )
            ) {
                return "study";
            }
        }
    }


    /*
     * Derived schedule:
     *
     * Before exam:
     * study days are the days between start and exam.
     *
     * We deliberately create rest days on Sunday.
     */

    const start =
        parseDate(
            studyPlan?.studyStartDate
        ) ||
        startOfDay(
            new Date()
        );


    if (
        day < start ||
        (
            exam &&
            day > exam
        )
    ) {

        return "rest";
    }


    /*
     * Sunday is the default rest day when Home
     * has not supplied an explicit timetable.
     */

    if (
        day.getDay() ===
        0
    ) {

        return "rest";
    }


    return "study";
}


/* =========================================================
   CALENDAR
========================================================= */

function renderCalendar() {

    const container =
        $("calendarDays");

    const monthLabel =
        $("calendarMonth");


    if (
        !container
    ) {
        return;
    }


    const year =
        currentCalendarDate
            .getFullYear();

    const month =
        currentCalendarDate
            .getMonth();


    if (monthLabel) {

        monthLabel.textContent =
            currentCalendarDate
                .toLocaleDateString(
                    undefined,
                    {
                        month:
                            "long",
                        year:
                            "numeric"
                    }
                );
    }


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


    let html =
        "";


    /*
     * Blank cells.
     */

    for (
        let i = 0;
        i < firstDay;
        i++
    ) {

        html += `
            <div
                class="calendar-day empty"
            ></div>
        `;
    }


    for (
        let day = 1;
        day <=
        daysInMonth;
        day++
    ) {

        const date =
            new Date(
                year,
                month,
                day
            );


        const status =
            getDayStatus(
                date
            );


        const today =
            dateKey(
                date
            ) ===
            dateKey(
                new Date()
            );


        html += `
            <button
                type="button"
                class="
                    calendar-day
                    calendar-${status}
                    ${today ? "today" : ""}
                "
                data-calendar-date="${dateKey(date)}"
                title="${
                    status === "study"
                        ? "Study Day"
                        : status === "exam"
                            ? "Exam Day"
                            : "Rest Day"
                }"
            >

                <span
                    class="calendar-date"
                >
                    ${day}
                </span>

                <span
                    class="calendar-status-dot"
                ></span>

                <span
                    class="calendar-label"
                >
                    ${
                        status === "study"
                            ? "Study"
                            : status === "exam"
                                ? "Exam"
                                : "Rest"
                    }
                </span>

            </button>
        `;
    }


    container.innerHTML =
        html;


    /*
     * Add the visual calendar CSS.
     */

    injectCalendarStyles();
}


function initializeCalendar() {

    currentCalendarDate =
        new Date();


    const previous =
        $("previousMonth");


    const next =
        $("nextMonth");


    if (previous) {

        previous.addEventListener(
            "click",
            () => {

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
        );
    }


    if (next) {

        next.addEventListener(
            "click",
            () => {

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
        );
    }


    renderCalendar();
}


/* =========================================================
   CALENDAR STYLE
========================================================= */

function injectCalendarStyles() {

    if (
        $("studyMindCalendarStyles")
    ) {
        return;
    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "studyMindCalendarStyles";


    style.textContent = `

        .calendar-day {
            position: relative;
            overflow: visible;
            transition:
                transform .2s ease,
                box-shadow .2s ease,
                border-color .2s ease;
        }

        .calendar-day:hover {
            transform: translateY(-2px);
        }

        .calendar-study {
            border-color:
                rgba(35,145,255,.85) !important;

            background:
                radial-gradient(
                    circle at 50% 45%,
                    rgba(30,144,255,.28),
                    rgba(30,144,255,.08) 55%,
                    transparent 78%
                ) !important;

            box-shadow:
                0 0 8px
                    rgba(30,144,255,.55),
                0 0 20px
                    rgba(30,144,255,.32),
                inset 0 0 12px
                    rgba(30,144,255,.12);
        }

        .calendar-exam {
            border-color:
                rgba(255,65,65,.95) !important;

            background:
                radial-gradient(
                    circle at 50% 45%,
                    rgba(255,50,50,.30),
                    rgba(255,50,50,.08) 55%,
                    transparent 78%
                ) !important;

            box-shadow:
                0 0 9px
                    rgba(255,55,55,.70),
                0 0 24px
                    rgba(255,55,55,.38),
                inset 0 0 13px
                    rgba(255,55,55,.12);
        }

        .calendar-rest {
            border-color:
                rgba(157,85,255,.85) !important;

            background:
                radial-gradient(
                    circle at 50% 45%,
                    rgba(145,75,255,.28),
                    rgba(145,75,255,.08) 55%,
                    transparent 78%
                ) !important;

            box-shadow:
                0 0 8px
                    rgba(150,80,255,.52),
                0 0 20px
                    rgba(150,80,255,.28),
                inset 0 0 12px
                    rgba(150,80,255,.10);
        }

        .calendar-study .calendar-status-dot {
            background:
                #2196ff;
            box-shadow:
                0 0 7px
                #2196ff;
        }

        .calendar-exam .calendar-status-dot {
            background:
                #ff4545;
            box-shadow:
                0 0 8px
                #ff4545;
        }

        .calendar-rest .calendar-status-dot {
            background:
                #9b5cff;
            box-shadow:
                0 0 8px
                #9b5cff;
        }

        .calendar-status-dot {
            display: block;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            margin: 4px auto;
        }

        .calendar-label {
            display: block;
            font-size: 9px;
            font-weight: 700;
            opacity: .8;
        }

        .premium-dashboard .calendar-study {
            box-shadow:
                0 0 9px
                    rgba(35,145,255,.65),
                0 0 24px
                    rgba(35,145,255,.35);
        }

        .premium-dashboard .calendar-exam {
            box-shadow:
                0 0 10px
                    rgba(255,55,55,.75),
                0 0 28px
                    rgba(255,55,55,.40);
        }

        .premium-dashboard .calendar-rest {
            box-shadow:
                0 0 10px
                    rgba(155,90,255,.60),
                0 0 24px
                    rgba(155,90,255,.34);
        }

    `;


    document.head.appendChild(
        style
    );
}


/* =========================================================
   DAILY CHALLENGE
========================================================= */

function renderDailyChallenge() {

    const topic =
        getCurrentTopic();


    const topicElement =
        $("dailyChallengeTopic");


    const subjectElement =
        $("dailyChallengeSubject");


    if (topicElement) {

        topicElement.textContent =
            topic
                ? getTopicName(
                    topic
                )
                : "Your current topic";
    }


    if (subjectElement) {

        subjectElement.textContent =
            topic
                ? getTopicSubject(
                    topic
                )
                : "";
    }
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

        "currentPlanTitle",

        "studyPlanTitle"
    ];


    titleIds
        .forEach(
            id => {

                const element =
                    $(id);

                if (element) {

                    element.textContent =
                        studyPlan.title ||
                        "Study Plan";
                }
            }
        );


    const examIds = [

        "examDate",

        "dashboardExamDate",

        "planExamDate"
    ];


    examIds
        .forEach(
            id => {

                const element =
                    $(id);

                if (element) {

                    element.textContent =
                        formatDate(
                            studyPlan.examDate
                        );
                }
            }
        );
}


/* =========================================================
   AI USAGE
========================================================= */

function getAIQuestionCount() {

    const today =
        dateKey(
            new Date()
        );


    const savedDate =
        localStorage.getItem(
            AI_QUESTION_DATE_KEY
        );


    if (
        savedDate !==
        today
    ) {

        localStorage.setItem(
            AI_QUESTION_DATE_KEY,
            today
        );

        localStorage.setItem(
            AI_QUESTION_COUNT_KEY,
            "0"
        );

        return 0;
    }


    return Number(
        localStorage.getItem(
            AI_QUESTION_COUNT_KEY
        )
    ) || 0;
}


function canAskAI() {

    if (
        isPremiumUser
    ) {
        return true;
    }

    return (
        getAIQuestionCount() <
        FREE_QUESTION_LIMIT
    );
}


function recordAIQuestion() {

    if (
        isPremiumUser
    ) {
        return;
    }


    const count =
        getAIQuestionCount();


    localStorage.setItem(
        AI_QUESTION_COUNT_KEY,
        String(
            count + 1
        )
    );
}


function getRemainingAIQuestions() {

    if (
        isPremiumUser
    ) {
        return Infinity;
    }


    return Math.max(
        0,
        FREE_QUESTION_LIMIT -
        getAIQuestionCount()
    );
}


function updateAIUsageBadge() {

    const badge =
        $("aiCountBadge");


    if (!badge) {
        return;
    }


    if (
        isPremiumUser
    ) {

        badge.textContent =
            "∞ Unlimited";

        return;
    }


    badge.textContent =
        `${getAIQuestionCount()}/${FREE_QUESTION_LIMIT} used`;
}


/* =========================================================
   SUMMARY USAGE
========================================================= */

function getSummaryCount() {

    const today =
        dateKey(
            new Date()
        );


    const savedDate =
        localStorage.getItem(
            SUMMARY_DATE_KEY
        );


    if (
        savedDate !==
        today
    ) {

        localStorage.setItem(
            SUMMARY_DATE_KEY,
            today
        );

        localStorage.setItem(
            SUMMARY_COUNT_KEY,
            "0"
        );

        return 0;
    }


    return Number(
        localStorage.getItem(
            SUMMARY_COUNT_KEY
        )
    ) || 0;
}


function canSummarize() {

    if (
        isPremiumUser
    ) {
        return true;
    }

    return (
        getSummaryCount() <
        FREE_LIMIT
    );
}


function recordSummary() {

    if (
        isPremiumUser
    ) {
        return;
    }


    const count =
        getSummaryCount();


    localStorage.setItem(
        SUMMARY_COUNT_KEY,
        String(
            count + 1
        )
    );
}


function updateSummaryBadge() {

    const badge =
        $("summaryCountBadge");


    if (!badge) {
        return;
    }


    if (
        isPremiumUser
    ) {

        badge.textContent =
            "∞ Unlimited";

        return;
    }


    badge.textContent =
        `${getSummaryCount()}/${FREE_LIMIT} used`;
}


/* =========================================================
   AI RESPONSE FORMATTING
========================================================= */

function formatAIResponse(
    text
) {

    if (
        text === null ||
        text === undefined
    ) {
        return "";
    }


    let value =
        String(text);


    /*
     * Escape first.
     */

    value =
        escapeHTML(
            value
        );


    /*
     * Basic markdown formatting.
     */

    value =
        value
            .replace(
                /\*\*(.*?)\*\*/g,
                "<strong>$1</strong>"
            )
            .replace(
                /\*(.*?)\*/g,
                "<em>$1</em>"
            )
            .replace(
                /^### (.*?)$/gm,
                "<h4>$1</h4>"
            )
            .replace(
                /^## (.*?)$/gm,
                "<h3>$1</h3>"
            )
            .replace(
                /^# (.*?)$/gm,
                "<h2>$1</h2>"
            )
            .replace(
                /\n/g,
                "<br>"
            );


    return value;
}


function renderMath(
    element
) {

    if (
        !element
    ) {
        return;
    }


    try {

        if (
            window.MathJax &&
            typeof window.MathJax.typesetPromise ===
            "function"
        ) {

            window.MathJax
                .typesetPromise([
                    element
                ])
                .catch(
                    () => {}
                );
        }

    } catch {
        /* Ignore */
    }
}


/* =========================================================
   AI CONTEXT
========================================================= */

function buildStudyContext() {

    const topic =
        getCurrentTopic();


    return {

        examType:
            studyPlan?.examType ||
            "Exam",

        curriculum:
            studyPlan?.curriculum ||
            "Nigerian Senior Secondary Curriculum",

        subjects:
            normalizedSubjects
                .map(
                    subject =>
                        subject.name
                )
                .join(", "),

        currentTopic:
            topic
                ? getTopicName(
                    topic
                )
                : "None",

        completedTopics:
            completedTopicCount(),

        totalTopics:
            allTopics.length,

        progress:
            calculateStudyScore(),

        studyHours:
            studyPlan?.studyHours ||
            studyPlan?.hoursPerDay ||
            0,

        daysLeft:
            calculateDaysLeft(),

        examDate:
            studyPlan?.examDate ||
            "Not set"
    };
}


/* =========================================================
   AI PROGRESS ANALYSIS
========================================================= */

function setupAIAnalysis() {

    const button =
        $("analyzeProgressButton");

    const output =
        $("aiAdviceText");


    if (
        !button
    ) {
        return;
    }


    button.addEventListener(
        "click",
        async () => {

            if (
                !isAuthenticated
            ) {

                if (output) {

                    output.innerHTML =
                        `
                            <div class="ai-limit-message">
                                🔐 Please log in to use AI analysis.
                            </div>
                        `;
                }

                return;
            }


            button.disabled =
                true;

            button.textContent =
                "⏳ Analyzing...";


            if (output) {

                output.textContent =
                    "StudyMind AI is analyzing your progress...";
            }


            try {

                const context =
                    buildStudyContext();


                const message = `
You are StudyMind AI, an educational study assistant.

Analyze this student's study progress.

Exam:
${context.examType}

Curriculum:
${context.curriculum}

Subjects:
${context.subjects}

Current topic:
${context.currentTopic}

Topics completed:
${context.completedTopics}/${context.totalTopics}

Progress:
${context.progress}%

Daily study goal:
${context.studyHours} hours

Days remaining:
${context.daysLeft}

Exam date:
${context.examDate}

Give concise, practical advice about:
1. What the student should focus on next.
2. Whether their current pace is reasonable.
3. Which topics deserve priority.
4. One practical recommendation.

Do not invent information.
`.trim();


                const data =
                    await requestQuestions(
                        AI_ENDPOINT,
                        {
                            message
                        }
                    );


                if (output) {

                    output.innerHTML = `
                        <strong>
                            📊 Your Study Analysis
                        </strong>

                        <div
                            style="
                                margin-top:12px;
                            "
                        >
                            ${formatAIResponse(
                                data.reply ||
                                data.message ||
                                data.response ||
                                "No analysis was returned."
                            )}
                        </div>
                    `;

                    renderMath(
                        output
                    );
                }


            } catch (error) {

                console.error(
                    "StudyMind analysis error:",
                    error
                );


                if (output) {

                    output.textContent =
                        "Unable to connect to StudyMind AI right now. Please try again.";
                }

            } finally {

                button.disabled =
                    false;

                button.textContent =
                    "📊 Analyze My Progress";
            }
        }
    );
}


/* =========================================================
   ASK AI
========================================================= */

function setupAskAI() {

    const button =
        $("askAIButton");

    const input =
        $("aiQuestion");

    const output =
        $("aiResponse");


    if (
        !button
    ) {
        return;
    }


    updateAIUsageBadge();


    button.addEventListener(
        "click",
        async () => {

            if (
                !isAuthenticated
            ) {

                showAILoginMessage(
                    output
                );

                return;
            }


            const question =
                input
                    ? input.value.trim()
                    : "";


            if (!question) {

                if (output) {

                    output.textContent =
                        "Please enter a question first.";
                }

                return;
            }


            if (
                !canAskAI()
            ) {

                showAskAILimitMessage();

                return;
            }


            button.disabled =
                true;

            button.textContent =
                "⏳ Thinking...";


            if (output) {

                output.textContent =
                    "StudyMind AI is thinking...";
            }


            try {

                const context =
                    buildStudyContext();


                const message = `
You are StudyMind AI, an educational assistant.

Student's study context:

Exam:
${context.examType}

Curriculum:
${context.curriculum}

Subjects:
${context.subjects}

Current topic:
${context.currentTopic}

Topics completed:
${context.completedTopics}/${context.totalTopics}

Study progress:
${context.progress}%

Daily study goal:
${context.studyHours} hours

Days remaining:
${context.daysLeft}

Student question:
${question}

Answer clearly and educationally.
Stay focused on the student's study context where relevant.
Do not invent details about their plan.
`.trim();


                const data =
                    await requestQuestions(
                        AI_ENDPOINT,
                        {
                            message
                        }
                    );


                recordAIQuestion();

                updateAIUsageBadge();


                if (output) {

                    output.innerHTML =
                        formatAIResponse(
                            data.reply ||
                            data.message ||
                            data.response ||
                            "No response was returned."
                        );

                    renderMath(
                        output
                    );
                }


                if (input) {
                    input.value =
                        "";
                }


            } catch (error) {

                console.error(
                    "Ask AI error:",
                    error
                );


                if (output) {

                    output.textContent =
                        error.message ||
                        "StudyMind AI could not respond right now.";
                }

            } finally {

                button.disabled =
                    !canAskAI();

                button.textContent =
                    canAskAI()
                        ? "🤖 Ask AI"
                        : "🔒 Free Limit Reached";
            }
        }
    );
}


function showAILoginMessage(
    container
) {

    if (!container) {
        return;
    }


    container.innerHTML = `
        <div class="ai-limit-message">

            <h3>
                🔐 Login Required
            </h3>

            <p>
                Please log in to use
                StudyMind AI.
            </p>

            <button
                type="button"
                class="primary-button"
                onclick="window.location.href='login.html'"
            >
                🔑 Login
            </button>

        </div>
    `;
}


function showAskAILimitMessage() {

    const output =
        $("aiResponse");


    if (!output) {
        return;
    }


    output.innerHTML = `
        <div class="ai-limit-message">

            <h3>
                💎 Free AI Limit Reached
            </h3>

            <p>
                You've used all
                ${FREE_QUESTION_LIMIT}
                free AI questions today.
            </p>

            <p>
                Premium gives you
                unlimited AI assistance.
            </p>

            <button
                type="button"
                class="premium-button"
                onclick="openPremiumOffer()"
            >
                👑 Explore Premium
            </button>

        </div>
    `;
}


/* =========================================================
   SUMMARIZER
========================================================= */

function setupSummarizer() {

    const input =
        $("summarizeInput");

    const button =
        $("summarizeBtn");

    const output =
        $("summaryOutput");


    updateSummaryBadge();


    if (
        !button ||
        !input
    ) {
        return;
    }


    button.addEventListener(
        "click",
        async () => {

            const content =
                input.value.trim();


            if (!content) {

                if (output) {

                    output.textContent =
                        "Please paste your study material first.";
                }

                return;
            }


            if (
                !canSummarize()
            ) {

                showSummaryLimit();

                return;
            }


            button.disabled =
                true;

            button.textContent =
                "⏳ Summarizing...";


            if (output) {

                output.textContent =
                    "StudyMind AI is creating your summary...";
            }


            try {

                const exam =
                    studyPlan?.examType ||
                    "Exam";


                const message = `
Summarize the following study material for a student preparing for ${exam}.

Curriculum:
${studyPlan?.curriculum || "Nigerian Senior Secondary Curriculum"}

Focus on:
- Key concepts
- Important definitions
- Important formulas
- Exam-relevant points
- Easy-to-revise explanations
- Common mistakes where supported by the material

Do not invent information that is not supported by the study material.

Study material:

${content}
`.trim();


                const data =
                    await requestQuestions(
                        AI_ENDPOINT,
                        {
                            message
                        }
                    );


                recordSummary();

                updateSummaryBadge();


                if (output) {

                    output.innerHTML = `
                        <div class="summary-result">

                            <h4>
                                📋 AI Summary
                            </h4>

                            <div
                                class="summary-ai-content"
                            >
                                ${formatAIResponse(
                                    data.reply ||
                                    data.message ||
                                    data.response ||
                                    "No summary was returned."
                                )}
                            </div>

                        </div>
                    `;

                    renderMath(
                        output
                    );
                }


            } catch (error) {

                console.error(
                    "Summarizer error:",
                    error
                );


                if (output) {

                    output.textContent =
                        "Unable to connect to StudyMind AI right now. Please try again.";
                }

            } finally {

                button.disabled =
                    !canSummarize();

                button.textContent =
                    canSummarize()
                        ? "✨ Summarize Notes"
                        : "🔒 Free Limit Reached";
            }
        }
    );
}


function showSummaryLimit() {

    const output =
        $("summaryOutput");


    if (!output) {
        return;
    }


    output.innerHTML = `
        <div class="ai-limit-message">

            <h3>
                💎 Free Summarizer Limit Reached
            </h3>

            <p>
                You've used your
                ${FREE_LIMIT}
                free summaries today.
            </p>

            <button
                type="button"
                class="premium-button"
                onclick="openPremiumOffer()"
            >
                👑 Explore Premium
            </button>

        </div>
    `;
}


/* =========================================================
   PREMIUM STATUS
========================================================= */

async function checkPremiumStatus() {

    isPremiumUser =
        false;

    premiumStatusLoaded =
        false;


    if (
        !isAuthenticated
    ) {
        applyPremiumVisuals();
        return false;
    }


    try {

        const client =
            window.supabaseClient ||
            (
                typeof supabase !==
                "undefined"
                    ? supabase
                    : null
            );


        let accessToken =
            null;


        if (
            client &&
            client.auth
        ) {

            const {
                data
            } =
                await client.auth.getSession();


            accessToken =
                data?.session
                    ?.access_token ||
                null;
        }


        if (!accessToken) {
            return false;
        }


        const response =
            await fetch(
                PREMIUM_STATUS_ENDPOINT,
                {
                    method:
                        "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${accessToken}`,

                        "Content-Type":
                            "application/json"
                    }
                }
            );


        if (
            !response.ok
        ) {
            return false;
        }


        const result =
            await response
                .json();


        isPremiumUser =
            result?.premium ===
            true;


        premiumStatusLoaded =
            true;


        applyPremiumVisuals();

        updateAIUsageBadge();

        updateSummaryBadge();


        return isPremiumUser;

    } catch (error) {

        console.warn(
            "Premium status check failed:",
            error
        );

        return false;
    }
}


/* =========================================================
   PREMIUM VISUALS
========================================================= */

function applyPremiumVisuals() {

    const premium =
        isPremiumUser;


    document.body.classList.toggle(
        "premium-dashboard",
        premium
    );


    injectPremiumStyles();


    const badge =
        $("premiumBadge");


    if (badge) {

        badge.textContent =
            premium
                ? "👑 PREMIUM"
                : "FREE";
    }
}


function injectPremiumStyles() {

    if (
        $("studyMindPremiumStyles")
    ) {
        return;
    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "studyMindPremiumStyles";


    style.textContent = `

        body.premium-dashboard {
            --premium-gold:
                #f5c451;

            --premium-gold-bright:
                #ffe28b;

            --premium-gold-soft:
                rgba(245,196,81,.15);

            --premium-gold-border:
                rgba(245,196,81,.38);
        }

        body.premium-dashboard
        .panel-card,
        body.premium-dashboard
        .card,
        body.premium-dashboard
        .subject-card,
        body.premium-dashboard
        .topic-card {
            border-color:
                var(--premium-gold-border);

            box-shadow:
                0 0 0 1px
                    rgba(245,196,81,.04),
                0 12px 35px
                    rgba(0,0,0,.18);
        }

        body.premium-dashboard
        .premium-button {
            background:
                linear-gradient(
                    135deg,
                    #dcae35,
                    #f5c451,
                    #ffe28b
                );

            color:
                #18130a;

            border:
                1px solid
                rgba(255,226,139,.70);

            box-shadow:
                0 0 15px
                    rgba(245,196,81,.30);
        }

        body.premium-dashboard
        .premium-button:hover {
            transform:
                translateY(-2px);

            box-shadow:
                0 0 25px
                    rgba(245,196,81,.48);
        }

        body.premium-dashboard
        .card-kicker,
        body.premium-dashboard
        .card-badge {
            color:
                var(--premium-gold);
        }

        body.premium-dashboard
        .progress-bar,
        body.premium-dashboard
        .subject-progress-bar {
            box-shadow:
                0 0 12px
                    rgba(245,196,81,.35);
        }

        body.premium-dashboard
        .topic-item.active {
            border-color:
                var(--premium-gold-border);

            box-shadow:
                0 0 18px
                    rgba(245,196,81,.16);
        }

        body.premium-dashboard
        .ai-limit-message {
            border-color:
                var(--premium-gold-border);

            background:
                linear-gradient(
                    135deg,
                    rgba(245,196,81,.09),
                    rgba(245,196,81,.025)
                );
        }

        body.premium-dashboard
        .premium-dashboard-label {
            display:
                inline-flex;
        }

        .premium-dashboard-label {
            display:
                none;

            align-items:
                center;

            gap:
                7px;

            padding:
                6px 11px;

            border-radius:
                999px;

            color:
                #f5c451;

            background:
                rgba(245,196,81,.10);

            border:
                1px solid
                rgba(245,196,81,.32);

            font-size:
                11px;

            font-weight:
                800;

            letter-spacing:
                .08em;
        }

    `;


    document.head.appendChild(
        style
    );
}


/* =========================================================
   PREMIUM OFFER
========================================================= */

window.openPremiumOffer =
    function () {

        const existing =
            $("premiumModal");


        if (
            existing
        ) {
            existing.remove();
        }


        const modal =
            document.createElement(
                "div"
            );


        modal.id =
            "premiumModal";


        modal.innerHTML = `

            <div
                style="
                    position:fixed;
                    inset:0;
                    z-index:99999;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    padding:20px;
                    background:rgba(0,0,0,.72);
                    backdrop-filter:blur(10px);
                "
            >

                <div
                    style="
                        width:min(460px,100%);
                        border-radius:24px;
                        padding:32px;
                        text-align:center;
                        background:
                            linear-gradient(
                                145deg,
                                #17130b,
                                #0d0d0b
                            );
                        border:
                            1px solid
                            rgba(245,196,81,.42);
                        box-shadow:
                            0 0 45px
                            rgba(245,196,81,.18);
                        color:#fff8df;
                    "
                >

                    <button
                        id="closePremiumButton"
                        type="button"
                        style="
                            position:absolute;
                            margin-left:190px;
                            margin-top:-18px;
                            width:36px;
                            height:36px;
                            border-radius:50%;
                            border:0;
                            cursor:pointer;
                            font-size:24px;
                        "
                    >
                        ×
                    </button>

                    <div
                        style="
                            font-size:52px;
                            margin-bottom:10px;
                        "
                    >
                        👑
                    </div>

                    <h2>
                        StudyMind AI Premium
                    </h2>

                    <p
                        style="
                            opacity:.78;
                            line-height:1.7;
                        "
                    >
                        Unlock unlimited AI assistance,
                        Knowledge Checks, summarization
                        and deeper study support.
                    </p>

                    <button
                        id="premiumOpenButton"
                        type="button"
                        class="premium-button"
                        style="
                            width:100%;
                            padding:14px;
                            border-radius:14px;
                            cursor:pointer;
                            font-weight:800;
                            border:0;
                        "
                    >
                        👑 Open Premium
                    </button>

                </div>

            </div>
        `;


        document.body.appendChild(
            modal
        );


        const close =
            $("closePremiumButton");


        if (close) {

            close.addEventListener(
                "click",
                () =>
                    modal.remove()
            );
        }


        const open =
            $("premiumOpenButton");


        if (open) {

            open.addEventListener(
                "click",
                () => {

                    window.location.href =
                        "premium.html";
                }
            );
        }
    };


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
        "dark-mode",
        theme ===
        "dark"
    );


    document.body.classList.toggle(
        "light-mode",
        theme ===
        "light"
    );


    const button =
        $("themeButton");


    if (button) {

        button.textContent =
            theme ===
            "light"
                ? "☀️ Light Mode"
                : "🌙 Dark Mode";
    }
}


function setupTheme() {

    applyTheme();


    const button =
        $("themeButton");


    if (
        !button
    ) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            const current =
                localStorage.getItem(
                    THEME_KEY
                ) ||
                "dark";


            localStorage.setItem(
                THEME_KEY,
                current ===
                "dark"
                    ? "light"
                    : "dark"
            );


            applyTheme();
        }
    );
}


/* =========================================================
   AUTH
========================================================= */

async function checkAuthentication() {

    try {

        const client =
            window.supabaseClient ||
            (
                typeof supabase !==
                "undefined"
                    ? supabase
                    : null
            );


        if (
            !client ||
            !client.auth
        ) {

            isAuthenticated =
                false;

            return null;
        }


        const {
            data,
            error
        } =
            await client.auth.getUser();


        if (
            error
        ) {

            isAuthenticated =
                false;

            return null;
        }


        currentUser =
            data?.user ||
            null;


        isAuthenticated =
            Boolean(
                currentUser
            );


        return currentUser;

    } catch (error) {

        console.warn(
            "Authentication check failed:",
            error
        );

        isAuthenticated =
            false;

        return null;
    }
}


/* =========================================================
   GREETING
========================================================= */

function renderGreeting() {

    const ids = [

        "dashboardGreeting",

        "welcomeMessage",

        "greeting"
    ];


    let username =
        "Student";


    if (
        currentUser
    ) {

        username =
            currentUser
                .user_metadata
                ?.username ||

            currentUser
                .user_metadata
                ?.display_name ||

            currentUser
                .user_metadata
                ?.full_name ||

            currentUser
                .email
                ?.split("@")[0] ||

            "Student";
    }


    const hour =
        new Date()
            .getHours();


    let greeting =
        "Good morning";


    if (
        hour >= 12 &&
        hour < 18
    ) {

        greeting =
            "Good afternoon";

    } else if (
        hour >= 18
    ) {

        greeting =
            "Good evening";
    }


    ids.forEach(
        id => {

            const element =
                $(id);

            if (element) {

                element.textContent =
                    `${greeting}, ${username} 👋`;
            }
        }
    );
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


        if (
            client?.auth
        ) {

            await client
                .auth
                .signOut();
        }

    } catch (error) {

        console.warn(
            "Logout failed:",
            error
        );

    } finally {

        window.location.href =
            "login.html";
    }
}


function setupLogout() {

    const buttons =
        document.querySelectorAll(
            "[data-logout]"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                logoutStudyMind
            );
        }
    );


    const logout =
        $("logoutButton");


    if (logout) {

        logout.addEventListener(
            "click",
            logoutStudyMind
        );
    }
}


/* =========================================================
   TIMER SETUP
========================================================= */

function setupTimer() {

    restoreTimer();


    const startButtons = [

        $("startTimer"),

        $("startTimerButton")
    ];


    const pauseButtons = [

        $("pauseTimer"),

        $("pauseTimerButton"),

        $("stopTimer")
    ];


    const resetButtons = [

        $("resetTimer"),

        $("resetTimerButton")
    ];


    startButtons
        .filter(Boolean)
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    startTimer
                );
            }
        );


    pauseButtons
        .filter(Boolean)
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    stopTimer
                );
            }
        );


    resetButtons
        .filter(Boolean)
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    resetTimer
                );
            }
        );


    const selector =
        $("timerDuration") ||
        $("studyTimerDuration") ||
        $("studyTime");


    if (selector) {

        selector.addEventListener(
            "change",
            () =>
                setTimerDuration(
                    Number(
                        selector.value
                    )
                )
        );
    }


    document
        .querySelectorAll(
            "[data-timer-minutes]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () =>
                        setTimerDuration(
                            Number(
                                button.dataset
                                    .timerMinutes
                            )
                        )
                );
            }
        );
}


/* =========================================================
   SAVE BEFORE LEAVING
========================================================= */

function setupUnloadSave() {

    window.addEventListener(
        "beforeunload",
        () => {

            saveDashboardState();

            saveTimerState();
        }
    );
}


/* =========================================================
   PLAN CHANGE DETECTION
========================================================= */

function checkForHomePlanChange() {

    const current =
        normalizePlan(
            readJSON(
                PLAN_KEY,
                null
            )
        );


    if (!current) {
        return false;
    }


    const currentSignature =
        planSignature(
            current
        );


    const activeSignature =
        studyPlan
            ? planSignature(
                studyPlan
            )
            : "";


    if (
        currentSignature !==
        activeSignature
    ) {

        console.log(
            "StudyMind: Home created a newer plan. Reloading dashboard data."
        );


        loadCorrectActivePlan();

        loadPlanState();

        renderAll();

        return true;
    }


    return false;
}


/* =========================================================
   FULL RENDER
========================================================= */

function renderAll() {

    if (!studyPlan) {
        return;
    }


    renderPlanHeader();

    renderMetrics();

    renderSubjects();

    renderTopics();

    renderCurrentTopic();

    renderDailyChallenge();

    renderCalendar();

    renderSchedule();

    renderNextSession();

    renderTimer();

    updateAIUsageBadge();

    updateSummaryBadge();

    renderGreeting();

    applyTheme();

    applyPremiumVisuals();
}


/* =========================================================
   KEYBOARD SHORTCUTS
========================================================= */

function setupKeyboardShortcuts() {

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.target?.tagName ===
                "INPUT" ||
                event.target?.tagName ===
                "TEXTAREA"
            ) {
                return;
            }


            if (
                event.code ===
                "Space"
            ) {

                event.preventDefault();


                if (
                    timerRunning
                ) {

                    stopTimer();

                } else {

                    startTimer();
                }
            }
        }
    );
}


/* =========================================================
   CURRENT STUDY SESSION
========================================================= */

function createStudySession(
    topic
) {

    if (!topic) {
        return;
    }


    const session = {

        planId:
            activePlanRecord?.id ||
            getActivePlanId(),

        topicKey:
            getTopicKey(
                topic
            ),

        topicName:
            getTopicName(
                topic
            ),

        subject:
            getTopicSubject(
                topic
            ),

        startedAt:
            new Date()
                .toISOString(),

        status:
            "in-progress"
    };


    writeJSON(
        "studyMindCurrentStudySession",
        session
    );
}


/* =========================================================
   READING PERSISTENCE
========================================================= */

function startReadingPersistence() {

    const candidates = [

        $("topicReading"),

        $("currentTopicReading"),

        $("readingArea"),

        $("topicContent"),

        $("studyReading"),

        $("topicNotes")
    ];


    const element =
        candidates.find(
            Boolean
        );


    if (!element) {
        return;
    }


    let timer =
        null;


    const save =
        () => {

            const topic =
                getCurrentTopic();


            if (!topic) {
                return;
            }


            const records =
                readJSON(
                    "studyMindTopicReadings",
                    {}
                );


            records[
                getTopicKey(
                    topic
                )
            ] = {

                scrollTop:
                    element.scrollTop,

                updatedAt:
                    new Date()
                        .toISOString()
            };


            writeJSON(
                "studyMindTopicReadings",
                records
            );
        };


    timer =
        setInterval(
            save,
            3000
        );


    window.addEventListener(
        "beforeunload",
        () => {

            clearInterval(
                timer
            );

            save();
        }
    );
}


/* =========================================================
   AUTO REFRESH IF HOME CHANGES PLAN
========================================================= */

function startPlanWatcher() {

    let previousSignature =
        studyPlan
            ? planSignature(
                studyPlan
            )
            : "";


    setInterval(
        () => {

            const current =
                normalizePlan(
                    readJSON(
                        PLAN_KEY,
                        null
                    )
                );


            if (!current) {
                return;
            }


            const signature =
                planSignature(
                    current
                );


            if (
                signature &&
                signature !==
                previousSignature
            ) {

                previousSignature =
                    signature;


                loadCorrectActivePlan();

                loadPlanState();

                renderAll();
            }

        },
        1500
    );
}


/* =========================================================
   INITIALIZATION
========================================================= */

async function initializeDashboard() {

    console.log(
        "StudyMind: Dashboard starting..."
    );


    /*
     * PLAN FIRST.
     *
     * This is the most important part.
     */

    const loaded =
        loadCorrectActivePlan();


    if (!loaded) {

        console.warn(
            "StudyMind: No plan available."
        );

        return;
    }


    loadPlanState();


    /*
     * Authentication and Premium status.
     */

    await checkAuthentication();

    await checkPremiumStatus();


    /*
     * User activity.
     */

    updateStudyStreak();


    /*
     * Render.
     */

    renderAll();


    /*
     * Controls.
     */

    setupTopicCompletion();

    setupTimer();

    setupTheme();

    setupLogout();

    setupAIAnalysis();

    setupAskAI();

    setupSummarizer();

    setupKeyboardShortcuts();

    setupUnloadSave();

    initializeCalendar();

    startReadingPersistence();

    startPlanWatcher();


    /*
     * Create the active study session after the
     * correct plan has been loaded.
     */

    createStudySession(
        getCurrentTopic()
    );


    console.log(
        "StudyMind: Dashboard ready.",
        {
            activePlanId:
                activePlanRecord?.id,

            plan:
                studyPlan?.title,

            examDate:
                studyPlan?.examDate,

            currentTopic:
                getTopicName(
                    getCurrentTopic()
                ),

            premium:
                isPremiumUser
        }
    );
}


/* =========================================================
   PUBLIC API
========================================================= */

window.StudyMindDashboard = {

    getStudyPlan:
        () =>
            studyPlan,

    getActivePlan:
        () =>
            activePlanRecord,

    getCurrentTopic,

    setCurrentTopic,

    calculateStudyScore,

    saveDashboardState,

    syncActivePlanRecord,

    startTimer,

    stopTimer,

    resetTimer,

    setTimerDuration,

    openKnowledgeCheckPage,

    generateTopicQuestions,

    checkPremiumStatus
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
