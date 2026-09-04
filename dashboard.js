/* =========================================================
   STUDYMIND AI — DASHBOARD.JS
   FULL REPLACEMENT

   FEATURES:
   - Study plan loading
   - Subjects
   - Topics
   - Topic progress
   - Separate Knowledge Check page
   - 5-question Knowledge Check flow
   - 60% pass requirement
   - 25 / 45 / 60 minute study timer
   - Calendar
   - Study days
   - Rest days
   - Test days
   - Exam day
   - NO CLASSIFICATION AFTER EXAM DAY
   - Schedule
   - Progress tracker
   - Daily challenge
   - AI assistant
   - 5 free AI questions per day
   - Theme
   - Supabase authentication
   - Username greeting
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

const DAY_MS =
    24 * 60 * 60 * 1000;


/* =========================================================
   STORAGE KEYS
========================================================= */

const PLAN_KEY =
    "studyMindPlan";

const COMPATIBILITY_PLAN_KEY =
    "studyData";

const COMPLETED_TOPICS_KEY =
    "studyMindCompletedTopics";

const COMPLETED_QUESTIONS_KEY =
    "studyMindCompletedQuestionTopics";

const CURRENT_TOPIC_KEY =
    "studyMindCurrentTopicIndex";

const KNOWLEDGE_CHECK_TOPIC_KEY =
    "studyMindKnowledgeCheckTopic";

const KNOWLEDGE_CHECK_USAGE_KEY =
    "studyMindKnowledgeCheckUsageCount";

const KNOWLEDGE_CHECK_LIMIT =
    5;

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

let timerSeconds =
    DEFAULT_TIMER_SECONDS;

let selectedTimerSeconds =
    DEFAULT_TIMER_SECONDS;

let timerInterval = null;

let timerRunning = false;

let timerEndTime = null;

let currentCalendarDate =
    new Date();

let isAuthenticated = false;


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
            "StudyMind: Could not read localStorage:",
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
            "StudyMind: Could not write localStorage:",
            key,
            error
        );

        return false;
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
   CLEAN TEXT
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


function formatDate(date) {

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


function todayKey() {

    return formatDate(
        new Date()
    );
}


function parsePlanDate(value) {

    if (!value) {
        return null;
    }

    const text =
        cleanText(value);

    if (!text) {
        return null;
    }

    const parsed =
        new Date(
            `${text}T00:00:00`
        );

    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {
        return null;
    }

    return startOfDay(
        parsed
    );
}


function calculateDaysLeft() {

    if (
        !studyPlan ||
        !studyPlan.examDate
    ) {
        return 0;
    }

    const exam =
        parsePlanDate(
            studyPlan.examDate
        );

    if (!exam) {
        return 0;
    }

    const today =
        startOfDay(
            new Date()
        );

    return Math.max(
        0,
        Math.ceil(
            (
                exam.getTime() -
                today.getTime()
            ) / DAY_MS
        )
    );
}


/* =========================================================
   SLUGIFY
========================================================= */

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
            80
        );
}


/* =========================================================
   NORMALIZE TOPIC
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
            cleanText(
                rawTopic
            );

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
                cleanText(
                    candidate
                );

            break;
        }
    }


    if (!name) {
        return null;
    }


    let subject =
        cleanText(
            fallbackSubject
        );


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
                    cleanText(
                        candidate
                    );

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
   TOPIC KEY
========================================================= */

function getTopicKey(topic) {

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

    return `${subject}::${name}`;
}


/* =========================================================
   NORMALIZE SUBJECT
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
                cleanText(
                    rawSubject
                ),

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
   RECURSIVE TOPIC COLLECTION
========================================================= */

function collectNestedTopics(
    value,
    subjectName = "",
    results = [],
    depth = 0
) {

    if (
        depth > 6 ||
        value === null ||
        value === undefined
    ) {
        return results;
    }


    if (
        Array.isArray(value)
    ) {

        value.forEach(
            (
                item,
                index
            ) => {

                const topic =
                    normalizeTopic(
                        item,
                        subjectName,
                        index
                    );


                if (topic) {

                    results.push(
                        topic
                    );

                } else {

                    collectNestedTopics(
                        item,
                        subjectName,
                        results,
                        depth + 1
                    );
                }
            }
        );


        return results;
    }


    if (
        typeof value !== "object"
    ) {
        return results;
    }


    const directTopic =
        normalizeTopic(
            value,
            subjectName,
            results.length
        );


    if (directTopic) {

        results.push(
            directTopic
        );

        return results;
    }


    const nestedKeys = [

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

        "curriculum",

        "content",

        "data"

    ];


    for (
        const key of nestedKeys
    ) {

        if (
            value[key] !== undefined
        ) {

            collectNestedTopics(
                value[key],
                subjectName,
                results,
                depth + 1
            );
        }
    }


    return results;
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
            cleanText(
                plan.studyStartDate ||
                plan.study_start_date ||
                ""
            ),

        createdAt:
            plan.createdAt ||
            plan.created_at ||
            "",

        subjects: [],

        topics: []
    };


    /* =====================================================
       SUBJECTS
    ===================================================== */

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

                    : Array.isArray(
                        plan.classes
                    )

                        ? plan.classes

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


    /* =====================================================
       TOP-LEVEL TOPICS
    ===================================================== */

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


    /* =====================================================
       OTHER TOPIC SOURCES
    ===================================================== */

    if (
        normalized.topics.length === 0
    ) {

        const possibleTopicSources = [

            plan.topicList,

            plan.topic_list,

            plan.lessons,

            plan.units,

            plan.chapters,

            plan.modules

        ];


        possibleTopicSources.forEach(
            source => {

                if (
                    Array.isArray(source)
                ) {

                    source.forEach(
                        (
                            item,
                            index
                        ) => {

                            const topic =
                                normalizeTopic(
                                    item,
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
            }
        );
    }


    /* =====================================================
       SUBJECT TOPICS
    ===================================================== */

    normalized.subjects.forEach(
        subject => {

            if (
                Array.isArray(
                    subject.topics
                )
            ) {

                subject.topics.forEach(
                    topic => {

                        normalized.topics.push(
                            topic
                        );
                    }
                );
            }
        }
    );


    /* =====================================================
       RECURSIVE FALLBACK
    ===================================================== */

    if (
        normalized.topics.length === 0
    ) {

        collectNestedTopics(
            plan,
            "",
            normalized.topics
        );
    }


    /* =====================================================
       ASSIGN SUBJECTS
    ===================================================== */

    if (
        normalized.subjects.length > 0
    ) {

        normalized.topics.forEach(
            (
                topic,
                index
            ) => {

                if (
                    topic.subject
                ) {
                    return;
                }


                if (
                    normalized.subjects.length === 1
                ) {

                    topic.subject =
                        normalized.subjects[0].name;

                    return;
                }


                const subjectIndex =
                    index %
                    normalized.subjects.length;


                topic.subject =
                    normalized.subjects[
                        subjectIndex
                    ].name;
            }
        );
    }


    /* =====================================================
       DEDUPLICATE
    ===================================================== */

    const uniqueTopics = [];

    const seenKeys =
        new Set();


    normalized.topics.forEach(
        topic => {

            if (!topic) {
                return;
            }


            const key =
                getTopicKey(topic);


            if (!key) {
                return;
            }


            if (
                seenKeys.has(key)
            ) {
                return;
            }


            seenKeys.add(key);

            uniqueTopics.push(
                topic
            );
        }
    );


    normalized.topics =
        uniqueTopics;


    return normalized;
}


/* =========================================================
   LOAD STUDY PLAN
========================================================= */

function loadStudyPlan() {

    let rawPlan =
        readJSON(
            PLAN_KEY,
            null
        );


    if (!rawPlan) {

        rawPlan =
            readJSON(
                COMPATIBILITY_PLAN_KEY,
                null
            );
    }


    if (!rawPlan) {

        console.warn(
            "StudyMind: No study plan found."
        );

        studyPlan = null;

        normalizedSubjects = [];

        allTopics = [];

        return false;
    }


    studyPlan =
        normalizePlan(
            rawPlan
        );


    if (!studyPlan) {

        normalizedSubjects = [];

        allTopics = [];

        return false;
    }


    normalizedSubjects =
        studyPlan.subjects ||
        [];


    allTopics =
        studyPlan.topics ||
        [];


    /* =====================================================
       SYNC NORMALIZED PLAN
    ===================================================== */

    const normalizedStoragePlan = {

        ...rawPlan,

        examType:
            studyPlan.examType,

        examDate:
            studyPlan.examDate,

        studyStartDate:
            studyPlan.studyStartDate,

        subjects:
            normalizedSubjects.map(
                subject =>
                    subject.name
            ),

        topics:
            allTopics.map(
                topic =>
                    topic.name
            ),

        studyHours:
            studyPlan.studyHours,

        difficulty:
            studyPlan.difficulty,

        daysLeft:
            studyPlan.daysLeft,

        createdAt:
            studyPlan.createdAt
    };


    writeJSON(
        PLAN_KEY,
        normalizedStoragePlan
    );


    writeJSON(
        COMPATIBILITY_PLAN_KEY,
        normalizedStoragePlan
    );


    return true;
}


/* =========================================================
   COMPLETION STATE
========================================================= */

function loadCompletionState() {

    const storedCompletedTopics =
        readJSON(
            COMPLETED_TOPICS_KEY,
            []
        );


    completedTopics =
        Array.isArray(
            storedCompletedTopics
        )
            ? storedCompletedTopics
            : [];


    const storedQuestionTopics =
        readJSON(
            COMPLETED_QUESTIONS_KEY,
            []
        );


    completedQuestionTopics =
        Array.isArray(
            storedQuestionTopics
        )
            ? storedQuestionTopics
            : [];


    const savedIndex =
        Number(
            localStorage.getItem(
                CURRENT_TOPIC_KEY
            )
        );


    currentTopicIndex =
        Number.isInteger(
            savedIndex
        ) &&
        savedIndex >= 0
            ? savedIndex
            : 0;


    if (
        currentTopicIndex >=
        allTopics.length
    ) {

        currentTopicIndex =
            0;
    }


    const storedQuestions =
        readJSON(
            TOPIC_QUESTIONS_KEY,
            {}
        );


    if (
        storedQuestions &&
        typeof storedQuestions === "object" &&
        !Array.isArray(storedQuestions)
    ) {

        topicQuestions =
            storedQuestions;

    } else {

        topicQuestions = {};
    }


    saveCompletionState();
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
        String(
            currentTopicIndex
        )
    );


    writeJSON(
        TOPIC_QUESTIONS_KEY,
        topicQuestions
    );
}


/* =========================================================
   TOPIC COMPLETION
========================================================= */

function isTopicCompleted(topic) {

    const key =
        getTopicKey(topic);


    return (

        completedTopics.includes(
            key
        ) ||

        completedTopics.includes(
            topic.name
        )
    );
}


function isKnowledgeCheckCompleted(topic) {

    const key =
        getTopicKey(topic);


    return (

        completedQuestionTopics.includes(
            key
        ) ||

        completedQuestionTopics.includes(
            topic.name
        )
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


    for (
        let i = 0;
        i < allTopics.length;
        i++
    ) {

        if (
            !isTopicCompleted(
                allTopics[i]
            )
        ) {

            currentTopicIndex =
                i;

            return allTopics[i];
        }
    }


    if (
        currentTopicIndex >=
        allTopics.length
    ) {

        currentTopicIndex =
            allTopics.length - 1;
    }


    return (

        allTopics[
            currentTopicIndex
        ] ||

        null
    );
}


/* =========================================================
   NEXT INCOMPLETE TOPIC
========================================================= */

function getNextIncompleteTopic(
    fromIndex = currentTopicIndex
) {

    for (
        let i = fromIndex + 1;
        i < allTopics.length;
        i++
    ) {

        if (
            !isTopicCompleted(
                allTopics[i]
            )
        ) {

            return allTopics[i];
        }
    }


    for (
        let i = 0;
        i < fromIndex;
        i++
    ) {

        if (
            !isTopicCompleted(
                allTopics[i]
            )
        ) {

            return allTopics[i];
        }
    }


    return null;
}


/* =========================================================
   DASHBOARD STATS
========================================================= */

function calculateStudyScore() {

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


    const topicScore =
        (
            completed /
            allTopics.length
        ) * 100;


    const knowledgeScore =
        Math.min(
            100,

            (
                completedQuestionTopics.length /
                allTopics.length
            ) * 100
        );


    if (
        knowledgeScore === 0
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
            studyPlan?.studyHours
        ) || 0;


    if (
        weeklyHours
    ) {

        weeklyHours.textContent =
            Number(
                hours * 7
            ).toFixed(
                hours % 1 === 0
                    ? 0
                    : 1
            );
    }


    if (
        daysLeft
    ) {

        daysLeft.textContent =
            String(
                calculateDaysLeft()
            );
    }


    if (
        dailyGoal
    ) {

        dailyGoal.textContent =
            `${hours} hrs`;
    }


    if (
        studyScore
    ) {

        studyScore.textContent =
            String(
                calculateStudyScore()
            );
    }
}


/* =========================================================
   PROGRESS
========================================================= */

function renderProgress() {

    const completedCount =
        allTopics.filter(
            topic =>
                isTopicCompleted(
                    topic
                )
        ).length;


    const total =
        allTopics.length;


    const percentage =
        total > 0

            ? Math.round(
                (
                    completedCount /
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


    if (
        progressPercent
    ) {

        progressPercent.textContent =
            `${percentage}%`;
    }


    if (
        progressCount
    ) {

        progressCount.textContent =
            `${completedCount} of ${total} topics completed`;
    }


    if (
        progressBar
    ) {

        progressBar.style.width =
            `${percentage}%`;
    }
}


/* =========================================================
   CURRENT TOPIC RENDERING
========================================================= */

function renderCurrentTopic() {

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


    const topic =
        getCurrentTopic();


    if (!topic) {

        if (
            nameElement
        ) {

            nameElement.textContent =
                "No topic available";
        }


        if (
            descriptionElement
        ) {

            descriptionElement.textContent =

                allTopics.length === 0

                    ? "Create a study plan with topics to begin."

                    : "All topics have been completed. Great work!";
        }


        if (
            positionElement
        ) {

            positionElement.textContent =
                "NO TOPICS";
        }


        if (
            badgeElement
        ) {

            badgeElement.textContent =
                "COMPLETE";
        }


        if (
            checkbox
        ) {

            checkbox.checked =
                false;

            checkbox.disabled =
                true;
        }


        if (
            completionMessage
        ) {

            completionMessage.textContent =
                "Your study plan is complete.";
        }


        if (
            nextMessage
        ) {

            nextMessage.innerHTML =
                allTopics.length
                    ? "🎉 You have completed every topic in your study plan."
                    : "";
        }


        hideKnowledgeCheck();

        return;
    }


    if (
        positionElement
    ) {

        positionElement.textContent =
            `TOPIC ${currentTopicIndex + 1} OF ${allTopics.length}`;
    }


    if (
        nameElement
    ) {

        nameElement.textContent =
            topic.name;
    }


    if (
        descriptionElement
    ) {

        descriptionElement.textContent =
            topic.description ||
            `Study ${topic.name} and complete the knowledge check.`;
    }


    const completed =
        isTopicCompleted(
            topic
        );


    if (
        badgeElement
    ) {

        badgeElement.textContent =
            completed
                ? "COMPLETED"
                : "IN PROGRESS";
    }


    if (
        checkbox
    ) {

        checkbox.checked =
            completed;

        checkbox.disabled =
            completed;
    }


    if (
        completionMessage
    ) {

        completionMessage.textContent =

            completed

                ? "You finished studying this topic. Start the Knowledge Check below."

                : "Tick this box when you are done studying this topic.";
    }


    const nextTopic =
        getNextIncompleteTopic(
            currentTopicIndex
        );


    if (
        nextMessage
    ) {

        if (
            completed &&
            nextTopic
        ) {

            nextMessage.innerHTML =
                `➡️ Next topic: <strong>${escapeHTML(nextTopic.name)}</strong>`;

        } else if (
            completed &&
            !nextTopic
        ) {

            nextMessage.innerHTML =
                "🎉 This is your final topic. Complete the knowledge check to finish your study plan.";

        } else {

            nextMessage.innerHTML =
                "";
        }
    }


    /*
       Only show the Knowledge Check
       AFTER the topic has been completed.
    */

    if (
        completed &&
        !isKnowledgeCheckCompleted(
            topic
        )
    ) {

        showKnowledgeCheck(
            topic
        );

    } else {

        hideKnowledgeCheck();
    }
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
                No topics found in your study plan.
                Return to Home and create a study plan with topics.
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

                        <div
                            class="topic-list-item"
                            data-topic-index="${index}"
                            style="
                                cursor:pointer;
                                padding:12px;
                                margin-bottom:8px;
                                border-radius:12px;
                            "
                        >

                            <div
                                style="
                                    display:flex;
                                    align-items:center;
                                    gap:10px;
                                "
                            >

                                <span>
                                    ${
                                        completed
                                            ? "✅"
                                            : active
                                                ? "📖"
                                                : "📘"
                                    }
                                </span>

                                <div
                                    style="
                                        flex:1;
                                    "
                                >

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
                                            ? "Done"
                                            : active
                                                ? "Current"
                                                : `${index + 1}`
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


                        currentTopicIndex =
                            index;


                        saveCompletionState();


                        renderCurrentTopic();


                        window.scrollTo({

                            top: 0,

                            behavior:
                                "smooth"
                        });
                    }
                );
            }
        );
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

        const uniqueSubjects = [

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

                    const subjectTopics =
                        allTopics.filter(
                            topic =>

                                cleanText(
                                    topic.subject
                                ).toLowerCase() ===

                                cleanText(
                                    subject.name
                                ).toLowerCase()
                        );


                    return `

                        <div
                            class="subject-item"
                            style="
                                padding:12px 0;
                                border-bottom:1px solid rgba(127,127,127,.12);
                            "
                        >

                            <div
                                style="
                                    display:flex;
                                    justify-content:space-between;
                                    align-items:center;
                                    gap:10px;
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
                                        ${
                                            subjectTopics.length
                                        }
                                        topic${
                                            subjectTopics.length === 1
                                                ? ""
                                                : "s"
                                        }
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


    const checkbox =
        $("topicCompleteCheckbox");


    if (
        checkbox &&
        !checkbox.checked
    ) {
        return;
    }


    const key =
        getTopicKey(
            topic
        );


    completedTopics =
        completedTopics.filter(
            value =>
                value !== topic.name
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
        todayKey()
    );


    updateStudyStreak();


    saveCompletionState();


    /*
       IMPORTANT:

       Immediately send the user to
       the dedicated Knowledge Check page.

       The Knowledge Check is NOT embedded
       inside the dashboard.
    */

    openKnowledgeCheckPage(
        topic
    );
}


/* =========================================================
   KNOWLEDGE CHECK — SEPARATE PAGE
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


/* =========================================================
   OPEN KNOWLEDGE CHECK
========================================================= */

window.openKnowledgeCheckPage =
    function (topic) {

        console.log(
            "StudyMind: Opening Knowledge Check:",
            topic
        );


        if (
            !topic ||
            !topic.name
        ) {

            alert(
                "Please select a topic before starting the Knowledge Check."
            );

            return;
        }


        const usageCount =
            Number(
                localStorage.getItem(
                    KNOWLEDGE_CHECK_USAGE_KEY
                )
            ) || 0;


        if (
            usageCount >=
            KNOWLEDGE_CHECK_LIMIT
        ) {

            alert(
                "You have used all 5 of your free Knowledge Checks. Upgrade to Premium to continue."
            );

            return;
        }


        const topicData = {

            id:
                cleanText(
                    topic.id
                ),

            key:
                getTopicKey(
                    topic
                ),

            name:
                cleanText(
                    topic.name
                ),

            title:
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

            checkId:
                `${Date.now()}-${Math.random().toString(36).slice(2)}`

        };


        try {

            localStorage.setItem(

                KNOWLEDGE_CHECK_TOPIC_KEY,

                JSON.stringify(
                    topicData
                )
            );


            localStorage.setItem(

                CURRENT_TOPIC_KEY,

                String(
                    currentTopicIndex
                )
            );


            stopTimer();


            window.location.assign(
                "knowledge-check.html"
            );

        } catch (error) {

            console.error(
                "StudyMind: Could not save Knowledge Check topic:",
                error
            );


            alert(
                "Unable to start the Knowledge Check. Please try again."
            );
        }
    };


/* =========================================================
   KNOWLEDGE CHECK PROMPT
========================================================= */

function showKnowledgeCheck(topic) {

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


    const submitButton =
        $("submitTopicQuestions");


    if (
        submitButton
    ) {

        submitButton.style.display =
            "none";
    }


    renderGenerateQuestionsPrompt(
        topic
    );
}


function hideKnowledgeCheck() {

    const section =
        getQuestionsSection();


    if (
        section
    ) {

        section.style.display =
            "none";
    }


    activeKnowledgeCheckTopicKey =
        null;
}


/* =========================================================
   KNOWLEDGE CHECK LAUNCH UI
========================================================= */

function renderGenerateQuestionsPrompt(
    topic
) {

    const container =
        getQuestionsContainer();


    if (
        !container ||
        !topic
    ) {
        return;
    }


    container.innerHTML = `

        <div
            class="generate-questions-prompt"
            style="
                padding:20px;
                border-radius:14px;
                margin-top:15px;
                border:1px solid rgba(127,127,127,.2);
            "
        >

            <div
                style="
                    font-size:34px;
                    margin-bottom:10px;
                "
            >
                🧠
            </div>

            <h3>
                Ready to test yourself?
            </h3>

            <p>
                StudyMind AI will generate exactly 5 questions based on
                <strong>
                    ${escapeHTML(
                        topic.name
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
                style="
                    margin-top:10px;
                    text-align:center;
                    opacity:.7;
                    font-size:.9rem;
                "
            >
                5 questions • 60% required to pass
            </div>

        </div>
    `;


    const button =
        $("generateTopicQuestionsButton");


    if (
        button
    ) {

        button.addEventListener(
            "click",
            () => {

                window.openKnowledgeCheckPage(
                    topic
                );
            }
        );
    }
}


/* =========================================================
   LEGACY GENERATION COMPATIBILITY
========================================================= */

async function generateTopicQuestions(
    topic
) {

    if (!topic) {
        return;
    }


    window.openKnowledgeCheckPage(
        topic
    );
}


/* =========================================================
   LEGACY SUBMIT
========================================================= */

function submitKnowledgeCheck() {

    console.warn(
        "StudyMind: Knowledge Check scoring happens on knowledge-check.html."
    );
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


    const challengeProgress =
        completed
            ? 50
            : 0;


    if (progressElement) {

        progressElement.textContent =
            `${challengeProgress}%`;
    }


    if (progressBar) {

        progressBar.style.width =
            `${challengeProgress}%`;
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

        window.openKnowledgeCheckPage(
            topic
        );

        return;
    }


    const timer =
        $("studyTimer");


    if (timer) {

        timer.scrollIntoView({

            behavior:
                "smooth",

            block:
                "center"
        });
    }


    startTimer();
}


/* =========================================================
   STREAK
========================================================= */

function updateStudyStreak() {

    const today =
        todayKey();


    const lastDate =
        localStorage.getItem(
            LAST_STUDY_DATE_KEY
        );


    let streak =
        Number(
            localStorage.getItem(
                STREAK_KEY
            )
        ) || 0;


    if (
        lastDate ===
        today
    ) {
        return;
    }


    if (
        lastDate
    ) {

        const last =
            startOfDay(
                new Date(
                    `${lastDate}T00:00:00`
                )
            );


        const current =
            startOfDay(
                new Date(
                    `${today}T00:00:00`
                )
            );


        const difference =
            Math.round(
                (
                    current.getTime() -
                    last.getTime()
                ) /
                DAY_MS
            );


        if (
            difference === 1
        ) {

            streak++;

        } else {

            streak =
                1;
        }

    } else {

        streak =
            1;
    }


    localStorage.setItem(
        STREAK_KEY,
        String(streak)
    );


    localStorage.setItem(
        LAST_STUDY_DATE_KEY,
        today
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


    if (
        TIMER_OPTIONS.includes(
            savedDuration / 60
        )
    ) {

        selectedTimerSeconds =
            savedDuration;

    } else {

        selectedTimerSeconds =
            DEFAULT_TIMER_SECONDS;
    }


    const savedSeconds =
        Number(
            localStorage.getItem(
                TIMER_SECONDS_KEY
            )
        );


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


    const savedEndTime =
        Number(
            localStorage.getItem(
                TIMER_END_TIME_KEY
            )
        );


    const savedRunning =
        localStorage.getItem(
            TIMER_RUNNING_KEY
        ) === "true";


    if (
        savedRunning &&
        Number.isFinite(
            savedEndTime
        ) &&
        savedEndTime > Date.now()
    ) {

        timerEndTime =
            savedEndTime;

        timerRunning =
            true;

        timerSeconds =
            Math.max(
                0,
                Math.ceil(
                    (
                        savedEndTime -
                        Date.now()
                    ) / 1000
                )
            );


        startTimerInterval();

    } else {

        timerRunning =
            false;

        timerEndTime =
            null;

        timerSeconds =
            selectedTimerSeconds;


        localStorage.setItem(
            TIMER_RUNNING_KEY,
            "false"
        );


        localStorage.removeItem(
            TIMER_END_TIME_KEY
        );
    }


    const select =
        $("timerDuration");


    if (
        select
    ) {

        select.value =
            String(
                selectedTimerSeconds /
                60
            );
    }


    renderTimer();
}


function ensureTimerStorage() {

    if (
        !TIMER_OPTIONS.includes(
            selectedTimerSeconds / 60
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


    localStorage.setItem(
        TIMER_DURATION_KEY,
        String(
            selectedTimerSeconds
        )
    );


    localStorage.setItem(
        TIMER_SECONDS_KEY,
        String(
            timerSeconds
        )
    );
}


function startTimerInterval() {

    if (
        timerInterval
    ) {

        clearInterval(
            timerInterval
        );
    }


    timerInterval =
        setInterval(
            () => {

                if (
                    !timerRunning
                ) {
                    return;
                }


                if (
                    timerEndTime
                ) {

                    timerSeconds =
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

                } else {

                    timerSeconds =
                        Math.max(
                            0,
                            timerSeconds - 1
                        );
                }


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

                    timerFinished();
                }

            },
            1000
        );
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


    timerEndTime =
        Date.now() +
        (
            timerSeconds *
            1000
        );


    localStorage.setItem(
        TIMER_END_TIME_KEY,
        String(
            timerEndTime
        )
    );


    localStorage.setItem(
        TIMER_RUNNING_KEY,
        "true"
    );


    localStorage.setItem(
        TIMER_SECONDS_KEY,
        String(
            timerSeconds
        )
    );


    startTimerInterval();


    renderTimer();
}


function pauseTimer() {

    if (
        !timerRunning
    ) {
        return;
    }


    if (
        timerEndTime
    ) {

        timerSeconds =
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
    }


    timerRunning =
        false;

    timerEndTime =
        null;


    localStorage.setItem(
        TIMER_RUNNING_KEY,
        "false"
    );


    localStorage.removeItem(
        TIMER_END_TIME_KEY
    );


    localStorage.setItem(
        TIMER_SECONDS_KEY,
        String(
            timerSeconds
        )
    );


    renderTimer();
}


function stopTimer() {

    timerRunning =
        false;

    timerEndTime =
        null;


    if (
        timerInterval
    ) {

        clearInterval(
            timerInterval
        );

        timerInterval =
            null;
    }


    localStorage.setItem(
        TIMER_RUNNING_KEY,
        "false"
    );


    localStorage.removeItem(
        TIMER_END_TIME_KEY
    );


    renderTimer();
}


function resetTimer() {

    stopTimer();


    timerSeconds =
        selectedTimerSeconds;


    localStorage.setItem(
        TIMER_SECONDS_KEY,
        String(
            timerSeconds
        )
    );


    renderTimer();
}


function timerFinished() {

    timerRunning =
        false;

    timerEndTime =
        null;


    if (
        timerInterval
    ) {

        clearInterval(
            timerInterval
        );

        timerInterval =
            null;
    }


    localStorage.setItem(
        TIMER_RUNNING_KEY,
        "false"
    );


    localStorage.removeItem(
        TIMER_END_TIME_KEY
    );


    timerSeconds =
        0;


    localStorage.setItem(
        TIMER_SECONDS_KEY,
        "0"
    );


    renderTimer();


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

    } catch {
        /* Ignore notification errors. */
    }


    alert(
        "⏰ Your study timer is finished. Great work!"
    );
}


function changeTimerDuration(
    value
) {

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


    localStorage.setItem(
        TIMER_DURATION_KEY,
        String(
            selectedTimerSeconds
        )
    );


    localStorage.setItem(
        TIMER_SECONDS_KEY,
        String(
            timerSeconds
        )
    );


    renderTimer();
}


function renderTimer() {

    const timer =
        $("studyTimer");

    const startButton =
        $("startTimerButton");

    const pauseButton =
        $("pauseTimerButton");

    const resetButton =
        $("resetTimerButton");


    if (
        timer
    ) {

        const minutes =
            Math.floor(
                timerSeconds /
                60
            );


        const seconds =
            timerSeconds %
            60;


        timer.textContent =

            `${String(
                minutes
            ).padStart(
                2,
                "0"
            )}:${String(
                seconds
            ).padStart(
                2,
                "0"
            )}`;
    }


    if (
        startButton
    ) {

        startButton.disabled =
            timerRunning;

        startButton.innerHTML =

            timerRunning

                ? "<span>▶</span> Running..."

                : "<span>▶</span> Start Timer";
    }


    if (
        pauseButton
    ) {

        pauseButton.disabled =
            !timerRunning;
    }


    if (
        resetButton
    ) {

        resetButton.disabled =
            false;
    }


    const select =
        $("timerDuration");


    if (
        select &&
        document.activeElement !==
            select
    ) {

        select.value =
            String(
                selectedTimerSeconds /
                60
            );
    }
}


/* =========================================================
   CALENDAR
   IMPORTANT:
   AFTER THE EXAM DATE, DAYS ARE NOT CLASSIFIED.
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
                month:
                    "long"
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


    const today =
        startOfDay(
            new Date()
        );


    const examDate =
        parsePlanDate(
            studyPlan?.examDate
        );


    const studyStartDate =
        parsePlanDate(
            studyPlan?.studyStartDate
        );


    /*
       Test dates can come from several
       possible plan structures.
    */

    const testDates = [];


    if (
        Array.isArray(
            studyPlan?.testDates
        )
    ) {

        studyPlan.testDates.forEach(
            value => {

                const parsed =
                    parsePlanDate(
                        value
                    );

                if (parsed) {
                    testDates.push(
                        parsed
                    );
                }
            }
        );
    }


    if (
        Array.isArray(
            studyPlan?.tests
        )
    ) {

        studyPlan.tests.forEach(
            test => {

                const value =
                    typeof test === "string"

                        ? test

                        : test?.date ||
                          test?.testDate ||
                          test?.test_date;


                const parsed =
                    parsePlanDate(
                        value
                    );


                if (parsed) {
                    testDates.push(
                        parsed
                    );
                }
            }
        );
    }


    /*
       Empty cells before the first day.
    */

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


    /*
       Render each day.
    */

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
            startOfDay(
                new Date(
                    year,
                    month,
                    day
                )
            );


        const dateString =
            formatDate(
                date
            );


        const todayString =
            formatDate(
                today
            );


        /*
           Date number.
        */

        const numberElement =
            document.createElement(
                "span"
            );


        numberElement.className =
            "calendar-date-number";


        numberElement.textContent =
            String(day);


        cell.appendChild(
            numberElement
        );


        /*
           TODAY
        */

        if (
            dateString ===
            todayString
        ) {

            cell.classList.add(
                "today"
            );
        }


        /*
           =================================================
           CRITICAL FIX
           =================================================

           If the date is AFTER the exam date:

           - Do NOT make it a study day
           - Do NOT make it a rest day
           - Do NOT make it a test day
           - Do NOT make it an exam day
           - Do NOT add any classification label

           The exam date is the FINAL day of the plan.
        */

        const isAfterExam =

            examDate &&
            date.getTime() >
                examDate.getTime();


        if (
            isAfterExam
        ) {

            cell.classList.add(
                "after-exam"
            );


            cell.dataset.dayType =
                "after-exam";


            daysContainer.appendChild(
                cell
            );


            continue;
        }


        /*
           =================================================
           EXAM DAY
           =================================================
        */

        const isExamDay =

            examDate &&
            date.getTime() ===
                examDate.getTime();


        if (
            isExamDay
        ) {

            cell.classList.add(
                "exam-day"
            );


            cell.dataset.dayType =
                "exam";


            const label =
                document.createElement(
                    "span"
                );


            label.className =
                "calendar-day-label";


            label.textContent =
                "EXAM";


            cell.appendChild(
                label
            );


            daysContainer.appendChild(
                cell
            );


            continue;
        }


        /*
           =================================================
           TEST DAY
           =================================================
        */

        const isTestDay =
            testDates.some(
                testDate =>
                    testDate.getTime() ===
                    date.getTime()
            );


        if (
            isTestDay
        ) {

            cell.classList.add(
                "test-day"
            );


            cell.dataset.dayType =
                "test";


            const label =
                document.createElement(
                    "span"
                );


            label.className =
                "calendar-day-label";


            label.textContent =
                "TEST";


            cell.appendChild(
                label
            );


            daysContainer.appendChild(
                cell
            );


            continue;
        }


        /*
           =================================================
           STUDY PLAN RANGE
           =================================================
        */

        const isInsideStudyRange =

            studyStartDate &&
            examDate &&

            date.getTime() >=
                studyStartDate.getTime() &&

            date.getTime() <
                examDate.getTime();


        if (
            isInsideStudyRange
        ) {

            /*
               Monday-Friday = STUDY DAY
               Saturday = REST DAY
               Sunday = STUDY DAY

               This keeps the existing StudyMind
               weekday behaviour while ensuring that
               NOTHING is classified after the exam.
            */

            const dayOfWeek =
                date.getDay();


            if (
                dayOfWeek === 6
            ) {

                cell.classList.add(
                    "rest-day"
                );


                cell.dataset.dayType =
                    "rest";


                const label =
                    document.createElement(
                        "span"
                    );


                label.className =
                    "calendar-day-label";


                label.textContent =
                    "REST";


                cell.appendChild(
                    label
                );

            } else {

                cell.classList.add(
                    "study-day"
                );


                cell.dataset.dayType =
                    "study";


                const label =
                    document.createElement(
                        "span"
                    );


                label.className =
                    "calendar-day-label";


                label.textContent =
                    "STUDY";


                cell.appendChild(
                    label
                );
            }
        }


        daysContainer.appendChild(
            cell
        );
    }
}


/* =========================================================
   CALENDAR NAVIGATION
========================================================= */

function previousMonth() {

    currentCalendarDate.setMonth(
        currentCalendarDate.getMonth() - 1
    );


    renderCalendar();
}


function nextMonth() {

    currentCalendarDate.setMonth(
        currentCalendarDate.getMonth() + 1
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


    const topic =
        getCurrentTopic();


    if (!topic) {

        container.innerHTML = `

            <div class="empty-schedule">
                🎉 Your study plan is complete.
            </div>

        `;

        return;
    }


    const completed =
        isTopicCompleted(
            topic
        );


    const studyHours =
        Number(
            studyPlan?.studyHours
        ) || 1;


    container.innerHTML = `

        <div
            class="schedule-item"
            style="
                padding:14px 0;
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
                        margin-top:4px;
                    "
                >
                    ${escapeHTML(
                        topic.subject ||
                        "Study Session"
                    )}
                </small>

            </div>

            <div
                style="
                    text-align:right;
                "
            >

                <strong>
                    ${studyHours} hr
                </strong>

                <small
                    style="
                        display:block;
                        opacity:.7;
                        margin-top:4px;
                    "
                >
                    ${
                        completed
                            ? "Knowledge check"
                            : "Study session"
                    }
                </small>

            </div>

        </div>

    `;
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
            "Study plan complete";


        bookingTime.textContent =
            "No upcoming topic.";


        return;
    }


    booking.textContent =
        topic.name;


    bookingTime.textContent =

        topic.subject

            ? `${topic.subject} • Next study topic`

            : "Next study topic";
}


/* =========================================================
   THEME
========================================================= */

function initializeTheme() {

    const button =
        $("themeButton");


    const savedTheme =
        localStorage.getItem(
            THEME_KEY
        );


    if (
        savedTheme ===
        "light"
    ) {

        document.body.classList.add(
            "light-mode"
        );
    }


    updateThemeButton();


    if (
        button
    ) {

        button.addEventListener(
            "click",
            toggleTheme
        );
    }
}


function toggleTheme() {

    document.body.classList.toggle(
        "light-mode"
    );


    const light =
        document.body.classList.contains(
            "light-mode"
        );


    localStorage.setItem(
        THEME_KEY,
        light
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


    const light =
        document.body.classList.contains(
            "light-mode"
        );


    button.textContent =

        light

            ? "☀️ Light Mode"

            : "🌙 Dark Mode";
}


/* =========================================================
   AI QUESTION LIMIT
========================================================= */

function getAIQuestionCount() {

    const storedDate =
        localStorage.getItem(
            AI_QUESTION_DATE_KEY
        );


    const today =
        todayKey();


    if (
        storedDate !==
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


function getRemainingAIQuestions() {

    return Math.max(

        0,

        FREE_QUESTION_LIMIT -
        getAIQuestionCount()

    );
}


function hasFreeAIQuestionsLeft() {

    return (
        getRemainingAIQuestions() >
        0
    );
}


function recordAIQuestion() {

    const current =
        getAIQuestionCount();


    if (
        current >=
        FREE_QUESTION_LIMIT
    ) {

        return false;
    }


    localStorage.setItem(
        AI_QUESTION_COUNT_KEY,
        String(
            current + 1
        )
    );


    return true;
}


function showPremiumMessage() {

    alert(
        "You have used all 5 free AI questions today. Explore Premium for unlimited AI access and more study features."
    );
}


function updateAIBadge() {

    const badge =
        $("aiCountBadge");


    if (
        badge
    ) {

        badge.textContent =
            `${getAIQuestionCount()}/${FREE_QUESTION_LIMIT} used`;
    }
}


/* =========================================================
   AI UI
========================================================= */

function setupAIAuthenticationUI() {

    const button =
        $("askAIButton");

    const question =
        $("aiQuestion");


    if (
        !isAuthenticated
    ) {

        if (
            button
        ) {

            button.disabled =
                true;

            button.textContent =
                "🔒 Login Required";
        }


        if (
            question
        ) {

            question.disabled =
                true;

            question.placeholder =
                "Login to use StudyMind AI";
        }


        updateAIBadge();

        return;
    }


    if (
        question
    ) {

        question.disabled =
            false;

        question.placeholder =
            "Ask StudyMind AI anything...";
    }


    if (
        button
    ) {

        const count =
            getAIQuestionCount();


        button.disabled =
            count >=
            FREE_QUESTION_LIMIT;


        button.textContent =

            count >=
            FREE_QUESTION_LIMIT

                ? "🔒 Free Limit Reached"

                : "🤖 Ask AI";
    }


    updateAIBadge();
}


/* =========================================================
   RENDER AI RESPONSE
========================================================= */

function renderAIResponse(
    text
) {

    return escapeHTML(
        text
    )
        .replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        )
        .replace(
            /\n/g,
            "<br>"
        );
}


/* =========================================================
   ASK STUDYMIND AI
========================================================= */

async function askStudyMindAI() {

    if (
        !isAuthenticated
    ) {

        const response =
            $("aiResponse");


        if (
            response
        ) {

            response.textContent =
                "Please log in to use StudyMind AI.";
        }


        return;
    }


    const input =
        $("aiQuestion");


    const responseElement =
        $("aiResponse");


    const button =
        $("askAIButton");


    const question =
        input
            ? input.value.trim()
            : "";


    if (!question) {

        if (
            responseElement
        ) {

            responseElement.textContent =
                "Please enter a question first.";
        }


        return;
    }


    if (
        !recordAIQuestion()
    ) {

        showPremiumMessage();

        setupAIAuthenticationUI();

        return;
    }


    if (
        button
    ) {

        button.disabled =
            true;

        button.textContent =
            "⏳ Thinking...";
    }


    if (
        responseElement
    ) {

        responseElement.textContent =
            "StudyMind AI is thinking...";
    }


    try {

        const subjects =
            normalizedSubjects.map(
                subject =>
                    subject.name
            );


        const topics =
            allTopics.map(
                topic =>
                    topic.name
            );


        const completed =
            allTopics.filter(
                topic =>
                    isTopicCompleted(
                        topic
                    )
            ).length;


        const response =
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

You are StudyMind AI helping a secondary-school student.

Study information:

Subjects:
${
    subjects.length
        ? subjects.join(", ")
        : "No subjects available"
}

Topics:
${
    topics.length
        ? topics.join(", ")
        : "No topics available"
}

Daily study hours:
${
    Number(
        studyPlan?.studyHours
    ) || 0
}

Exam type:
${
    studyPlan?.examType ||
    "Not specified"
}

Exam date:
${
    studyPlan?.examDate ||
    "Not specified"
}

Days remaining:
${calculateDaysLeft()}

Progress:
${completed} of ${allTopics.length} topics completed.

Student question:
${question}

Give a clear, useful and practical answer.

Use the student's study information when relevant.

Do not invent subjects, topics, dates or progress.

Keep the response concise and readable.

                            `
                        })
                }
            );


        let data =
            null;


        try {

            data =
                await response.json();

        } catch {
            data = null;
        }


        if (
            !response.ok
        ) {

            throw new Error(

                data?.error ||

                "Something went wrong while contacting StudyMind AI."
            );
        }


        if (
            !data ||
            !data.reply
        ) {

            throw new Error(
                "The AI returned an empty response."
            );
        }


        if (
            responseElement
        ) {

            responseElement.innerHTML =
                renderAIResponse(
                    data.reply
                );
        }


        if (
            input
        ) {

            input.value =
                "";
        }

    } catch (error) {

        console.error(
            "StudyMind AI error:",
            error
        );


        if (
            responseElement
        ) {

            responseElement.textContent =
                error.message ||
                "Unable to contact StudyMind AI.";
        }

    } finally {

        setupAIAuthenticationUI();
    }
}


/* =========================================================
   AUTHENTICATION
========================================================= */

async function checkAuthentication() {

    try {

        const client =
            window.supabaseClient;


        if (
            !client ||
            !client.auth
        ) {

            console.error(
                "StudyMind: Supabase client is not available."
            );


            currentUser =
                null;

            isAuthenticated =
                false;


            return false;
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

            currentUser =
                null;

            isAuthenticated =
                false;


            return false;
        }


        currentUser =
            data.user;


        isAuthenticated =
            true;


        return true;

    } catch (error) {

        console.error(
            "StudyMind authentication error:",
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
   USERNAME
========================================================= */

function getUsername() {

    if (
        currentUser
    ) {

        const metadata =
            currentUser.user_metadata ||
            {};


        const username =

            metadata.username ||

            metadata.user_name ||

            metadata.display_name ||

            metadata.full_name;


        if (
            cleanText(
                username
            )
        ) {

            return cleanText(
                username
            );
        }


        if (
            currentUser.email
        ) {

            return currentUser.email
                .split("@")[0]
                .replace(
                    /[._-]+/g,
                    " "
                )
                .replace(
                    /\b\w/g,
                    letter =>
                        letter.toUpperCase()
                );
        }
    }


    const savedUser =
        readJSON(
            "currentUser",
            null
        );


    if (
        savedUser
    ) {

        return (

            cleanText(
                savedUser.username
            ) ||

            cleanText(
                savedUser.display_name
            ) ||

            cleanText(
                savedUser.name
            ) ||

            "Student"
        );
    }


    return "Student";
}


/* =========================================================
   GREETING
========================================================= */

function renderGreeting() {

    const greeting =
        $("dashboardGreeting");


    if (
        !greeting
    ) {
        return;
    }


    const hour =
        new Date().getHours();


    let period;


    if (
        hour < 12
    ) {

        period =
            "Good morning";

    } else if (
        hour < 17
    ) {

        period =
            "Good afternoon";

    } else {

        period =
            "Good evening";
    }


    greeting.textContent =
        `${period}, ${getUsername()} 👋`;
}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutStudyMind() {

    try {

        const client =
            window.supabaseClient;


        if (
            client &&
            client.auth
        ) {

            await client.auth.signOut();
        }

    } catch (error) {

        console.error(
            "StudyMind logout error:",
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
   EVENT LISTENERS
========================================================= */

function initializeEventListeners() {

    /*
       Topic completion.
    */

    const checkbox =
        $("topicCompleteCheckbox");


    if (
        checkbox
    ) {

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


    /*
       Calendar.
    */

    const previousButton =
        $("previousMonth");


    const nextButton =
        $("nextMonth");


    if (
        previousButton
    ) {

        previousButton.addEventListener(
            "click",
            previousMonth
        );
    }


    if (
        nextButton
    ) {

        nextButton.addEventListener(
            "click",
            nextMonth
        );
    }


    /*
       Timer.
    */

    const startButton =
        $("startTimerButton");


    const pauseButton =
        $("pauseTimerButton");


    const resetButton =
        $("resetTimerButton");


    const durationSelect =
        $("timerDuration");


    if (
        startButton
    ) {

        startButton.addEventListener(
            "click",
            startTimer
        );
    }


    if (
        pauseButton
    ) {

        pauseButton.addEventListener(
            "click",
            pauseTimer
        );
    }


    if (
        resetButton
    ) {

        resetButton.addEventListener(
            "click",
            resetTimer
        );
    }


    if (
        durationSelect
    ) {

        durationSelect.addEventListener(
            "change",
            event =>
                changeTimerDuration(
                    event.target.value
                )
        );
    }


    /*
       AI.
    */

    const askButton =
        $("askAIButton");


    if (
        askButton
    ) {

        askButton.addEventListener(
            "click",
            askStudyMindAI
        );
    }


    const aiInput =
        $("aiQuestion");


    if (
        aiInput
    ) {

        aiInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    askStudyMindAI();
                }
            }
        );
    }


    /*
       Daily challenge.
    */

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


    /*
       Logout.
    */

    const logoutButton =
        $("logoutButton");


    if (
        logoutButton
    ) {

        logoutButton.addEventListener(
            "click",
            logoutStudyMind
        );
    }
}


/* =========================================================
   RENDER EVERYTHING
========================================================= */

function renderEverything() {

    renderStats();

    renderProgress();

    renderSubjects();

    renderTopics();

    renderCurrentTopic();

    renderDailyChallenge();

    renderCalendar();

    renderSchedule();

    renderNextSession();

    renderTimer();

    setupAIAuthenticationUI();

    renderGreeting();
}


/* =========================================================
   INITIALIZE DASHBOARD
========================================================= */

async function initializeDashboard() {

    console.log(
        "StudyMind AI dashboard initializing..."
    );


    /*
       Load plan FIRST.
    */

    loadStudyPlan();


    /*
       Load completion state.
    */

    loadCompletionState();


    /*
       Check authentication.
    */

    const authenticated =
        await checkAuthentication();


    if (
        !authenticated
    ) {

        window.location.href =
            "login.html";

        return;
    }


    /*
       If the user has no study plan,
       send them to Home.
    */

    if (

        !studyPlan ||

        !studyPlan.examDate ||

        !normalizedSubjects.length ||

        !allTopics.length

    ) {

        window.location.href =
            "home.html#generator";

        return;
    }


    /*
       Timer.
    */

    ensureTimerStorage();

    loadTimerState();


    /*
       Theme.
    */

    initializeTheme();


    /*
       Events.
    */

    initializeEventListeners();


    /*
       Render dashboard.
    */

    renderEverything();


    /*
       Refresh greeting periodically so
       morning/afternoon/evening changes
       automatically.
    */

    setInterval(
        renderGreeting,
        60000
    );


    /*
       Update calendar periodically.
    */

    setInterval(
        renderCalendar,
        60000
    );
}


/* =========================================================
   STORAGE EVENTS
========================================================= */

window.addEventListener(
    "storage",
    event => {

        if (
            event.key ===
                PLAN_KEY ||

            event.key ===
                COMPATIBILITY_PLAN_KEY ||

            event.key ===
                COMPLETED_TOPICS_KEY ||

            event.key ===
                COMPLETED_QUESTIONS_KEY
        ) {

            loadStudyPlan();

            loadCompletionState();

            renderEverything();
        }
    }
);


/* =========================================================
   SAME-PAGE PLAN UPDATE
========================================================= */

window.addEventListener(
    "studyMindPlanUpdated",
    () => {

        loadStudyPlan();

        loadCompletionState();

        renderEverything();
    }
);


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
