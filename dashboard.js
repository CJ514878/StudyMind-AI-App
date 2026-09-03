/* =========================================================
   STUDYMIND AI — DASHBOARD.JS
   COMPLETE REPLACEMENT
   Compatible with:
   - home.html
   - script.js
   - dashboard.html

   FIXES:
   - Correct top-level topics extraction
   - No "Untitled Topic"
   - Current topic rendering
   - Topic progress
   - Knowledge checks
   - Generate 5 Questions
   - 60% pass requirement
   - 25 / 45 / 60 minute timer
   - Calendar
   - Schedule
   - Subjects
   - Progress tracker
   - Daily challenge
   - AI free-question limit
   - Theme
   - Supabase authentication
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

const COMPLETED_TOPICS_KEY =
    "studyMindCompletedTopics";

const COMPLETED_QUESTIONS_KEY =
    "studyMindCompletedQuestionTopics";

const CURRENT_TOPIC_KEY =
    "studyMindCurrentTopicIndex";

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
            "Could not read localStorage:",
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
            "Could not write localStorage:",
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
   NORMALIZE TEXT
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


    /* -----------------------------------------
       STRING TOPIC
    ----------------------------------------- */

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


    /* -----------------------------------------
       FIND TOPIC NAME
    ----------------------------------------- */

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


    /* -----------------------------------------
       SUBJECT
    ----------------------------------------- */

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


    /* -----------------------------------------
       DESCRIPTION
    ----------------------------------------- */

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
   SLUGIFY
========================================================= */

function slugify(value) {

    return cleanText(value)

        .toLowerCase()

        .replace(/[^a-z0-9]+/g, "-")

        .replace(/^-+|-+$/g, "")

        .slice(0, 80);
}


/* =========================================================
   TOPIC KEY
========================================================= */

function getTopicKey(topic) {

    if (!topic) {
        return "";
    }

    const subject =
        cleanText(topic.subject)
            .toLowerCase();

    const name =
        cleanText(topic.name)
            .toLowerCase();

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


    let name =
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


    /* -----------------------------------------
       KNOWN TOPIC CONTAINERS
    ----------------------------------------- */

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
   FIND TOPICS RECURSIVELY
========================================================= */

function collectNestedTopics(
    value,
    subjectName = "",
    results = [],
    depth = 0
) {

    if (
        depth > 5 ||
        value === null ||
        value === undefined
    ) {

        return results;
    }


    /* -----------------------------------------
       ARRAY
    ----------------------------------------- */

    if (
        Array.isArray(value)
    ) {

        value.forEach(
            (item, index) => {

                const topic =
                    normalizeTopic(
                        item,
                        subjectName,
                        index
                    );


                if (topic) {

                    results.push(topic);

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


    /* -----------------------------------------
       DIRECT TOPIC OBJECT
    ----------------------------------------- */

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


    /* -----------------------------------------
       SAFE NESTED KEYS
    ----------------------------------------- */

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


    /* -----------------------------------------
       ARRAY PLAN
    ----------------------------------------- */

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


    /* -----------------------------------------
       UNWRAP PLAN
    ----------------------------------------- */

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

        createdAt:
            plan.createdAt ||
            "",

        subjects: [],

        topics: []

    };


    /* =====================================================
       SUBJECTS
    ===================================================== */

    const rawSubjects =
        Array.isArray(plan.subjects)
            ? plan.subjects
            : Array.isArray(plan.subjectList)
                ? plan.subjectList
                : Array.isArray(plan.courses)
                    ? plan.courses
                    : Array.isArray(plan.classes)
                        ? plan.classes
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


    /* =====================================================
       TOP-LEVEL TOPICS
       
       THIS IS THE CRITICAL FIX.
       
       Your script.js stores:
       
       topics: [...topics]
       
       rather than:
       
       subjects: [
           {
               topics: [...]
           }
       ]
    ===================================================== */

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


    /* =====================================================
       TOPIC-LIKE OTHER PROPERTIES
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
                        (item, index) => {

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
       GET NESTED SUBJECT TOPICS
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
       IF STILL NO TOPICS, SEARCH THE PLAN
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
       ASSIGN SUBJECTS TO TOP-LEVEL TOPICS
       
       Since home.html currently accepts subjects and
       topics separately, there is no exact relationship
       between them.
       
       We therefore assign subjects intelligently:
       
       1 subject:
           all topics → that subject
       
       Multiple subjects:
           distribute topics across subjects.
    ===================================================== */

    if (
        normalized.subjects.length > 0
    ) {

        const subjects =
            normalized.subjects;


        normalized.topics.forEach(
            (topic, index) => {

                if (
                    topic.subject
                ) {
                    return;
                }


                if (
                    subjects.length === 1
                ) {

                    topic.subject =
                        subjects[0].name;

                    return;
                }


                const subjectIndex =
                    index %
                    subjects.length;


                topic.subject =
                    subjects[
                        subjectIndex
                    ].name;

            }
        );

    }


    /* =====================================================
       DEDUPLICATE TOPICS
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
            "No StudyMind study plan found."
        );

        studyPlan =
            null;

        normalizedSubjects =
            [];

        allTopics =
            [];

        return false;
    }


    studyPlan =
        normalizePlan(
            rawPlan
        );


    if (!studyPlan) {

        normalizedSubjects =
            [];

        allTopics =
            [];

        return false;
    }


    normalizedSubjects =
        studyPlan.subjects ||
        [];


    allTopics =
        studyPlan.topics ||
        [];


    /* -----------------------------------------
       SYNC NORMALIZED PLAN
    ----------------------------------------- */

    const normalizedStoragePlan = {

        ...rawPlan,

        examType:
            studyPlan.examType,

        examDate:
            studyPlan.examDate,

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

        studyStartDate:
            studyPlan.studyStartDate,

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


    console.log(
        "StudyMind Dashboard — normalized plan:",
        studyPlan
    );


    console.log(
        "Subjects:",
        normalizedSubjects
    );


    console.log(
        "Topics:",
        allTopics
    );


    return true;
}


/* =========================================================
   LOAD COMPLETION STATE
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


    /* -----------------------------------------
       CURRENT INDEX
    ----------------------------------------- */

    const savedIndex =
        Number(
            localStorage.getItem(
                CURRENT_TOPIC_KEY
            )
        );


    currentTopicIndex =
        Number.isInteger(savedIndex) &&
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


    /* -----------------------------------------
       QUESTIONS
    ----------------------------------------- */

    const storedQuestions =
        readJSON(
            TOPIC_QUESTIONS_KEY,
            {}
        );


    if (
        Array.isArray(
            storedQuestions
        )
    ) {

        topicQuestions =
            {};

        if (
            allTopics.length > 0
        ) {

            topicQuestions[
                getTopicKey(
                    allTopics[0]
                )
            ] =
                storedQuestions;

        }

    } else if (
        storedQuestions &&
        typeof storedQuestions === "object"
    ) {

        topicQuestions =
            storedQuestions;

    } else {

        topicQuestions =
            {};
    }


    saveCompletionState();
}


/* =========================================================
   SAVE COMPLETION STATE
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
   TOPIC COMPLETION HELPERS
========================================================= */

function isTopicCompleted(topic) {

    const key =
        getTopicKey(topic);


    return (
        completedTopics.includes(key) ||
        completedTopics.includes(topic.name)
    );
}


function isKnowledgeCheckCompleted(topic) {

    const key =
        getTopicKey(topic);


    return (
        completedQuestionTopics.includes(key) ||
        completedQuestionTopics.includes(topic.name)
    );
}


/* =========================================================
   GET CURRENT TOPIC
========================================================= */

function getCurrentTopic() {

    if (
        !allTopics.length
    ) {

        return null;
    }


    /* -----------------------------------------
       FIRST INCOMPLETE TOPIC
    ----------------------------------------- */

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


    /* -----------------------------------------
       ALL COMPLETED
    ----------------------------------------- */

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
   GET NEXT TOPIC
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
   RENDER DASHBOARD
========================================================= */

function renderDashboard() {

    renderStats();

    renderCurrentTopic();

    renderProgress();

    renderTopics();

    renderSubjects();

    renderDailyChallenge();

    renderCalendar();

    renderSchedule();

    renderNextSession();

    renderTimer();

}


/* =========================================================
   RENDER STATS
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


    if (
        weeklyHours
    ) {

        const dailyHours =
            Number(
                studyPlan?.studyHours
            ) || 0;


        weeklyHours.textContent =
            Number(
                dailyHours * 7
            ).toFixed(
                dailyHours % 1 === 0
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

        const hours =
            Number(
                studyPlan?.studyHours
            ) || 0;


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
   CALCULATE DAYS LEFT
========================================================= */

function calculateDaysLeft() {

    if (
        !studyPlan?.examDate
    ) {

        return 0;
    }


    const exam =
        new Date(
            `${studyPlan.examDate}T00:00:00`
        );


    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    exam.setHours(
        0,
        0,
        0,
        0
    );


    const difference =
        exam.getTime() -
        today.getTime();


    return Math.max(
        0,
        Math.ceil(
            difference /
            (
                1000 *
                60 *
                60 *
                24
            )
        )
    );
}


/* =========================================================
   CALCULATE STUDY SCORE
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


    let knowledgeScore =
        0;


    if (
        completedQuestionTopics.length
    ) {

        knowledgeScore =
            Math.min(
                100,
                (
                    completedQuestionTopics.length /
                    allTopics.length
                ) * 100
            );

    }


    if (
        knowledgeScore === 0
    ) {

        return Math.round(
            topicScore
        );
    }


    return Math.round(
        (
            topicScore * 0.6
        ) +
        (
            knowledgeScore * 0.4
        )
    );
}


/* =========================================================
   RENDER CURRENT TOPIC
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


    console.log(
        "Current topic:",
        topic
    );


    /* -----------------------------------------
       NO TOPIC
    ----------------------------------------- */

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


    /* -----------------------------------------
       POSITION
    ----------------------------------------- */

    if (
        positionElement
    ) {

        positionElement.textContent =
            `TOPIC ${currentTopicIndex + 1} OF ${allTopics.length}`;
    }


    /* -----------------------------------------
       NAME
    ----------------------------------------- */

    if (
        nameElement
    ) {

        nameElement.textContent =
            topic.name;
    }


    /* -----------------------------------------
       DESCRIPTION
    ----------------------------------------- */

    if (
        descriptionElement
    ) {

        descriptionElement.textContent =
            topic.description ||
            `Study ${topic.name} and complete the knowledge check.`;
    }


    const completed =
        isTopicCompleted(topic);


    /* -----------------------------------------
       BADGE
    ----------------------------------------- */

    if (
        badgeElement
    ) {

        badgeElement.textContent =
            completed
                ? "COMPLETED"
                : "IN PROGRESS";
    }


    /* -----------------------------------------
       CHECKBOX
    ----------------------------------------- */

    if (
        checkbox
    ) {

        checkbox.checked =
            completed;

        checkbox.disabled =
            completed;
    }


    /* -----------------------------------------
       MESSAGE
    ----------------------------------------- */

    if (
        completionMessage
    ) {

        completionMessage.textContent =
            completed
                ? "You finished studying this topic. Complete the knowledge check below."
                : "Tick this box when you are done studying this topic.";
    }


    /* -----------------------------------------
       NEXT TOPIC
    ----------------------------------------- */

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


    /* -----------------------------------------
       SHOW KNOWLEDGE CHECK AFTER RELOAD
    ----------------------------------------- */

    if (
        completed &&
        !isKnowledgeCheckCompleted(topic)
    ) {

        showKnowledgeCheck(
            topic
        );

    } else {

        hideKnowledgeCheck();
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


    if (
        isTopicCompleted(topic)
    ) {
        return;
    }


    const key =
        getTopicKey(topic);


    completedTopics =
        completedTopics.filter(
            value =>
                value !== topic.name
        );


    if (
        !completedTopics.includes(key)
    ) {

        completedTopics.push(
            key
        );
    }


    localStorage.setItem(
        LAST_STUDY_DATE_KEY,
        new Date()
            .toISOString()
            .split("T")[0]
    );


    updateStudyStreak();


    saveCompletionState();


    /* -----------------------------------------
       STOP STUDY TIMER
    ----------------------------------------- */

    stopTimer();


    /* -----------------------------------------
       SHOW KNOWLEDGE CHECK

       IMPORTANT:
       Do NOT call renderCurrentTopic() here.

       renderCurrentTopic() looks for the next
       incomplete topic. If we called it first,
       the Knowledge Check would be associated
       with the wrong topic.

       Instead, immediately show the Knowledge
       Check for the topic the student just
       finished.
    ----------------------------------------- */

    showKnowledgeCheck(topic);

}
/* =========================================================
   KNOWLEDGE CHECK SECTION
========================================================= */

function getQuestionsSection() {

    return $("topicQuestionsSection");
}


function getQuestionsContainer() {

    return $("topicQuestions");
}


/* =========================================================
   SHOW KNOWLEDGE CHECK
========================================================= */

function showKnowledgeCheck(topic) {

    const section =
        getQuestionsSection();


    if (!section || !topic) {
        return;
    }


    activeKnowledgeCheckTopicKey =
        getTopicKey(topic);


    section.style.display =
        "block";


    const submitButton =
        $("submitTopicQuestions");


    const result =
        $("topicQuestionResult");


    if (
        result
    ) {

        result.innerHTML =
            "";
    }


    const storedQuestions =
        topicQuestions[
            activeKnowledgeCheckTopicKey
        ];


    if (
        Array.isArray(
            storedQuestions
        ) &&
        storedQuestions.length >=
            KNOWLEDGE_CHECK_QUESTION_COUNT
    ) {

        renderKnowledgeQuestions(
            storedQuestions.slice(
                0,
                KNOWLEDGE_CHECK_QUESTION_COUNT
            )
        );

        return;
    }


    renderGenerateQuestionsPrompt(
        topic
    );


    if (
        submitButton
    ) {

        submitButton.style.display =
            "none";
    }


    section.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}


/* =========================================================
   HIDE KNOWLEDGE CHECK
========================================================= */

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
   KNOWLEDGE CHECK — OPEN DEDICATED PAGE
========================================================= */

const KNOWLEDGE_CHECK_USAGE_KEY =
    "studyMindKnowledgeCheckUsageCount";

const KNOWLEDGE_CHECK_LIMIT = 5;

const KNOWLEDGE_CHECK_TOPIC_KEY =
    "studyMindKnowledgeCheckTopic";


window.openKnowledgeCheckPage = function (topic) {

    console.log(
        "Opening Knowledge Check:",
        topic
    );


    /* -----------------------------------------
       MAKE SURE TOPIC EXISTS
    ----------------------------------------- */

    if (
        !topic ||
        !topic.name
    ) {

        alert(
            "Please select a topic before starting the Knowledge Check."
        );

        return;
    }


    /* -----------------------------------------
       CHECK FREE KNOWLEDGE CHECK LIMIT
    ----------------------------------------- */

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


    /* -----------------------------------------
       CREATE TOPIC DATA
    ----------------------------------------- */

    const topicData = {

        name:
            topic.name,

        subject:
            topic.subject ||
            topic.subjectName ||
            "Senior Secondary",

        key:
            typeof getTopicKey === "function"
                ? getTopicKey(topic)
                : (
                    `${topic.subject || "Senior Secondary"}::${topic.name}`
                ),

        /* Unique ID for this Knowledge Check */
        checkId:
            `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}`

    };


    /* -----------------------------------------
       SAVE TOPIC FOR KNOWLEDGE CHECK PAGE
    ----------------------------------------- */

    try {

        localStorage.setItem(
            KNOWLEDGE_CHECK_TOPIC_KEY,
            JSON.stringify(topicData)
        );

    } catch (error) {

        console.error(
            "Could not save Knowledge Check topic:",
            error
        );

        alert(
            "Unable to start the Knowledge Check. Please try again."
        );

        return;
    }


    /* -----------------------------------------
       OPEN DEDICATED KNOWLEDGE CHECK PAGE
    ----------------------------------------- */

    window.location.href =
        "knowledge-check.html";
};
/* =========================================================
   RENDER GENERATE QUESTIONS PROMPT
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
                StudyMind AI will generate
                exactly 5 questions based on
                <strong>${escapeHTML(topic.name)}</strong>.
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
                    text-align:center;
                "
            ></div>

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

                 openKnowledgeCheckPage(
                    topic
                );

            }
        );

    }
}


/* =========================================================
   GENERATE TOPIC QUESTIONS
========================================================= */

async function generateTopicQuestions(
    topic
) {

    if (
        knowledgeCheckGenerating
    ) {

        return;
    }


    if (!topic) {
        return;
    }


    if (
        !hasFreeAIQuestionsLeft()
    ) {

        showPremiumMessage();

        return;
    }


    knowledgeCheckGenerating =
        true;


    const requestId =
        ++knowledgeCheckRequestId;


    const container =
        getQuestionsContainer();


    if (!container) {

        knowledgeCheckGenerating =
            false;

        return;
    }


    container.innerHTML = `

        <div
            style="
                text-align:center;
                padding:30px 15px;
            "
        >

            <div
                style="
                    font-size:38px;
                    margin-bottom:12px;
                "
            >
                🤖
            </div>

            <h3>
                Preparing 5 questions...
            </h3>

            <p>
                StudyMind AI is creating a
                knowledge check for
                <strong>${escapeHTML(topic.name)}</strong>.
            </p>

            <div
                style="
                    margin-top:15px;
                    opacity:.7;
                "
            >
                Please wait...
            </div>

        </div>

    `;


    const requestBody = {

        subject:
            topic.subject ||
            "Senior Secondary",

        topic:
            topic.name,

        numberOfQuestions:
            KNOWLEDGE_CHECK_QUESTION_COUNT,

        questionCount:
            KNOWLEDGE_CHECK_QUESTION_COUNT,

        count:
            KNOWLEDGE_CHECK_QUESTION_COUNT,

        curriculum:
            "Nigerian Senior Secondary curriculum",

        difficulty:
            "mixed",

        type:
            "knowledge_check",

        requestType:
            "knowledge_check"

    };


    try {

        let data =
            null;

        let lastError =
            null;


        /* =================================================
           PRIMARY API
        ================================================= */

        try {

            data =
                await requestQuestions(
                    "/api/generate-questions",
                    requestBody
                );


        } catch (error) {

            console.warn(
                "generate-questions failed. Trying ask-ai fallback:",
                error
            );

            lastError =
                error;

        }


        /* =================================================
           FALLBACK API
        ================================================= */

        if (
            !data ||
            !extractQuestions(data).length
        ) {

            try {

                data =
                    await requestQuestions(
                        "/api/ask-ai",
                        {

                            ...requestBody,

                            message:
                                buildKnowledgeCheckPrompt(
                                    topic
                                ),

                            mode:
                                "knowledge_check"

                        }
                    );


            } catch (fallbackError) {

                lastError =
                    fallbackError;

            }

        }


        if (
            requestId !==
            knowledgeCheckRequestId
        ) {

            return;
        }


        const questions =
            extractQuestions(
                data
            );


        if (
            questions.length <
            KNOWLEDGE_CHECK_QUESTION_COUNT
        ) {

            throw (
                lastError ||
                new Error(
                    "The AI did not return 5 valid questions."
                )
            );
        }


        const normalizedQuestions =
            questions
                .slice(
                    0,
                    KNOWLEDGE_CHECK_QUESTION_COUNT
                )
                .map(
                    normalizeQuestion
                )
                .filter(Boolean);


        if (
            normalizedQuestions.length <
            KNOWLEDGE_CHECK_QUESTION_COUNT
        ) {

            throw new Error(
                "The AI returned invalid question data."
            );
        }


        const key =
            getTopicKey(topic);


        topicQuestions[key] =
            normalizedQuestions;


        saveCompletionState();


        /* -----------------------------------------
           ONLY COUNT ONE AI REQUEST
        ----------------------------------------- */

        recordAIQuestion();


        renderKnowledgeQuestions(
            normalizedQuestions
        );


    } catch (error) {

        console.error(
            "StudyMind knowledge check error:",
            error
        );


        renderQuestionGenerationError(
            topic,
            error
        );


    } finally {

        knowledgeCheckGenerating =
            false;
    }
}


/* =========================================================
   BUILD KNOWLEDGE CHECK PROMPT
========================================================= */

function buildKnowledgeCheckPrompt(
    topic
) {

    return `Create exactly 5 multiple-choice knowledge-check questions for a Nigerian Senior Secondary student.

Subject: ${topic.subject || "Senior Secondary"}
Topic: ${topic.name}

Requirements:
- Exactly 5 questions.
- Each question must have exactly 4 answer choices.
- Only one answer is correct.
- Mix conceptual and application questions.
- Keep the difficulty appropriate for a secondary-school student.
- Return ONLY valid JSON.
- Use this exact structure:

{
  "questions": [
    {
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "answer": 0,
      "explanation": "Short explanation"
    }
  ]
}

The answer must be a zero-based number from 0 to 3.`;
}


/* =========================================================
   REQUEST QUESTIONS
========================================================= */

async function requestQuestions(
    endpoint,
    body
) {

    const controller =
        new AbortController();


    const timeout =
        setTimeout(
            () => {

                controller.abort();

            },
            QUESTION_REQUEST_TIMEOUT
        );


    try {

        const response =
            await fetch(
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
                        ),

                    signal:
                        controller.signal

                }
            );


        let data =
            null;


        try {

            data =
                await response.json();

        } catch {

            data =
                null;
        }


        if (
            !response.ok
        ) {

            const message =
                data?.error ||
                data?.message ||
                `Question API returned ${response.status}`;


            throw new Error(
                message
            );
        }


        return data;


    } catch (error) {

        if (
            error?.name ===
            "AbortError"
        ) {

            throw new Error(
                "The question request timed out. Please try again."
            );
        }


        throw error;


    } finally {

        clearTimeout(
            timeout
        );
    }
}


/* =========================================================
   EXTRACT QUESTIONS
========================================================= */

function extractQuestions(
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
        Array.isArray(
            data.output?.questions
        )
    ) {

        return data.output.questions;
    }


    if (
        typeof data.output_text ===
        "string"
    ) {

        const parsed =
            parseJSONFromText(
                data.output_text
            );


        if (
            parsed
        ) {

            return extractQuestions(
                parsed
            );
        }
    }


    if (
        typeof data.reply ===
        "string"
    ) {

        const parsed =
            parseJSONFromText(
                data.reply
            );


        if (
            parsed
        ) {

            return extractQuestions(
                parsed
            );
        }
    }


    if (
        typeof data.message ===
        "string"
    ) {

        const parsed =
            parseJSONFromText(
                data.message
            );


        if (
            parsed
        ) {

            return extractQuestions(
                parsed
            );
        }
    }


    return [];
}


/* =========================================================
   PARSE JSON FROM TEXT
========================================================= */

function parseJSONFromText(
    text
) {

    if (
        typeof text !== "string"
    ) {

        return null;
    }


    const cleaned =
        text
            .trim()
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
            cleaned
        );

    } catch {
        /* Continue below. */
    }


    const firstBrace =
        cleaned.indexOf("{");


    const lastBrace =
        cleaned.lastIndexOf("}");


    if (
        firstBrace !== -1 &&
        lastBrace > firstBrace
    ) {

        try {

            return JSON.parse(
                cleaned.slice(
                    firstBrace,
                    lastBrace + 1
                )
            );

        } catch {
            return null;
        }

    }


    return null;
}


/* =========================================================
   NORMALIZE QUESTION
========================================================= */

function normalizeQuestion(
    rawQuestion
) {

    if (
        !rawQuestion ||
        typeof rawQuestion !== "object"
    ) {

        return null;
    }


    const questionText =
        cleanText(

            rawQuestion.question ||

            rawQuestion.text ||

            rawQuestion.prompt ||

            rawQuestion.questionText

        );


    if (!questionText) {
        return null;
    }


    let options =
        rawQuestion.options ||
        rawQuestion.choices ||
        rawQuestion.answers ||
        [];


    if (
        typeof options === "object" &&
        !Array.isArray(options)
    ) {

        options = [

            options.A,

            options.B,

            options.C,

            options.D

        ];
    }


    if (
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
                        "object"
                    ) {

                        return cleanText(
                            option.text ||
                            option.label ||
                            option.value
                        );

                    }

                    return cleanText(
                        option
                    );

                }
            )
            .filter(Boolean)
            .slice(
                0,
                4
            );


    if (
        options.length !== 4
    ) {

        return null;
    }


    let answer =
        rawQuestion.answer ??
        rawQuestion.correctAnswer ??
        rawQuestion.correct ??
        rawQuestion.correctOption;


    /* -----------------------------------------
       NUMERIC ANSWER
    ----------------------------------------- */

    if (
        typeof answer === "string" &&
        /^[0-3]$/.test(
            answer.trim()
        )
    ) {

        answer =
            Number(
                answer.trim()
            );
    }


    /* -----------------------------------------
       LETTER ANSWER
    ----------------------------------------- */

    if (
        typeof answer === "string"
    ) {

        const letter =
            answer
                .trim()
                .toUpperCase();


        if (
            /^[ABCD]$/.test(
                letter
            )
        ) {

            answer =
                "ABCD".indexOf(
                    letter
                );

        } else {

            const answerIndex =
                options.findIndex(
                    option =>
                        option.toLowerCase() ===
                        answer.toLowerCase()
                );


            if (
                answerIndex !== -1
            ) {

                answer =
                    answerIndex;
            }

        }
    }


    answer =
        Number(answer);


    if (
        !Number.isInteger(answer) ||
        answer < 0 ||
        answer > 3
    ) {

        return null;
    }


    return {

        question:
            questionText,

        options,

        answer,

        explanation:
            cleanText(
                rawQuestion.explanation ||
                rawQuestion.reason ||
                ""
            )

    };
}


/* =========================================================
   RENDER QUESTIONS
========================================================= */

function renderKnowledgeQuestions(
    questions
) {

    const container =
        getQuestionsContainer();


    const submitButton =
        $("submitTopicQuestions");


    if (!container) {
        return;
    }


    container.innerHTML = "";


    questions.forEach(
        (question, index) => {

            const wrapper =
                document.createElement(
                    "div"
                );


            wrapper.className =
                "knowledge-question";


            wrapper.style.marginBottom =
                "24px";


            wrapper.innerHTML = `

                <div
                    class="question-number"
                    style="
                        font-weight:700;
                        margin-bottom:8px;
                    "
                >
                    Question ${index + 1} of ${questions.length}
                </div>

                <h3
                    style="
                        margin-bottom:12px;
                    "
                >
                    ${escapeHTML(
                        question.question
                    )}
                </h3>

                <div
                    class="question-options"
                >

                    ${question.options
                        .map(
                            (
                                option,
                                optionIndex
                            ) => `

                            <label
                                style="
                                    display:block;
                                    cursor:pointer;
                                    margin:8px 0;
                                "
                            >

                                <input
                                    type="radio"
                                    name="knowledgeQuestion${index}"
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

            `;


            container.appendChild(
                wrapper
            );

        }
    );


    if (
        submitButton
    ) {

        submitButton.style.display =
            "block";

        submitButton.disabled =
            false;

        submitButton.textContent =
            "Submit Answers";
    }


    const result =
        $("topicQuestionResult");


    if (
        result
    ) {

        result.innerHTML =
            "";
    }


    const section =
        getQuestionsSection();


    if (
        section
    ) {

        section.style.display =
            "block";
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
                () => {}
            );

    }
}


/* =========================================================
   QUESTION GENERATION ERROR
========================================================= */

function renderQuestionGenerationError(
    topic,
    error
) {

    const container =
        getQuestionsContainer();


    if (!container) {
        return;
    }


    const message =
        cleanText(
            error?.message
        ) ||
        "Something went wrong while generating the questions.";


    container.innerHTML = `

        <div
            style="
                padding:22px;
                text-align:center;
                border-radius:14px;
                border:1px solid rgba(220,80,80,.35);
            "
        >

            <div
                style="
                    font-size:36px;
                    margin-bottom:10px;
                "
            >
                ⚠️
            </div>

            <h3>
                We couldn't generate the questions
            </h3>

            <p>
                ${escapeHTML(message)}
            </p>

            <button
                type="button"
                id="retryGenerateQuestionsButton"
                class="primary-button"
            >
                🔄 Try Again
            </button>

        </div>

    `;


    const retryButton =
        $("retryGenerateQuestionsButton");


    if (
        retryButton
    ) {

        retryButton.addEventListener(
            "click",
            () => {

                 openKnowledgeCheckPage(
                    topic
                );

            }
        );

    }
}


/* =========================================================
   SUBMIT KNOWLEDGE CHECK
========================================================= */

function submitKnowledgeCheck() {

    if (
        !activeKnowledgeCheckTopicKey
    ) {

        return;
    }


    const topic =
        allTopics.find(
            item =>
                getTopicKey(item) ===
                activeKnowledgeCheckTopicKey
        );


    if (!topic) {
        return;
    }


    const questions =
        topicQuestions[
            activeKnowledgeCheckTopicKey
        ];


    if (
        !Array.isArray(questions) ||
        questions.length <
            KNOWLEDGE_CHECK_QUESTION_COUNT
    ) {

        return;
    }


    let score =
        0;


    let answered =
        0;


    questions
        .slice(
            0,
            KNOWLEDGE_CHECK_QUESTION_COUNT
        )
        .forEach(
            (
                question,
                index
            ) => {

                const selected =
                    document.querySelector(
                        `input[name="knowledgeQuestion${index}"]:checked`
                    );


                if (
                    selected
                ) {

                    answered++;


                    if (
                        Number(
                            selected.value
                        ) ===
                        Number(
                            question.answer
                        )
                    ) {

                        score++;

                    }

                }

            }
        );


    const result =
        $("topicQuestionResult");


    if (!result) {
        return;
    }


    const percentage =
        Math.round(
            (
                score /
                KNOWLEDGE_CHECK_QUESTION_COUNT
            ) *
            100
        );


    /* -----------------------------------------
       REQUIRE ALL QUESTIONS
    ----------------------------------------- */

    if (
        answered <
        KNOWLEDGE_CHECK_QUESTION_COUNT
    ) {

        result.innerHTML = `

            <div
                style="
                    padding:15px;
                    border-radius:12px;
                "
            >

                ⚠️ Please answer all 5 questions
                before submitting.

            </div>

        `;

        return;
    }


    /* -----------------------------------------
       PASS
    ----------------------------------------- */

    if (
        percentage >=
        KNOWLEDGE_CHECK_PASS_PERCENTAGE
    ) {

        if (
            !completedQuestionTopics.includes(
                activeKnowledgeCheckTopicKey
            )
        ) {

            completedQuestionTopics.push(
                activeKnowledgeCheckTopicKey
            );

        }


        saveCompletionState();


        result.innerHTML = `

            <div
                style="
                    padding:20px;
                    border-radius:14px;
                "
            >

                <h3>
                    🎉 Knowledge Check Passed!
                </h3>

                <p>
                    You scored
                    <strong>${score}/5 (${percentage}%)</strong>.
                </p>

                <p>
                    Great work. This topic is now
                    fully completed.
                </p>

            </div>

        `;


        const submitButton =
            $("submitTopicQuestions");


        if (
            submitButton
        ) {

            submitButton.disabled =
                true;

            submitButton.textContent =
                "✓ Knowledge Check Complete";
        }


        renderProgress();

        renderTopics();

        renderStats();

        renderDailyChallenge();

        renderCalendar();

        renderSchedule();

        renderNextSession();


        setTimeout(
            () => {

                moveToNextTopic();

            },
            1000
        );


    } else {

        /* -----------------------------------------
           FAIL
        ----------------------------------------- */

        result.innerHTML = `

            <div
                style="
                    padding:20px;
                    border-radius:14px;
                "
            >

                <h3>
                    📚 Keep Studying This Topic
                </h3>

                <p>
                    You scored
                    <strong>${score}/5 (${percentage}%)</strong>.
                </p>

                <p>
                    You need at least
                    <strong>${KNOWLEDGE_CHECK_PASS_PERCENTAGE}%</strong>
                    to complete this knowledge check.
                </p>

                <button
                    type="button"
                    id="retryKnowledgeCheckButton"
                    class="primary-button"
                >
                    🔄 Try Again
                </button>

            </div>

        `;


        const retry =
            $("retryKnowledgeCheckButton");


        if (
            retry
        ) {

            retry.addEventListener(
                "click",
                () => {

                    renderKnowledgeQuestions(
                        questions
                    );

                }
            );

        }
    }
}


/* =========================================================
   MOVE TO NEXT TOPIC
========================================================= */

function moveToNextTopic() {

    const nextTopic =
        getNextIncompleteTopic(
            currentTopicIndex
        );


    if (!nextTopic) {

        renderCurrentTopic();

        return;
    }


    currentTopicIndex =
        allTopics.indexOf(
            nextTopic
        );


    saveCompletionState();


    renderCurrentTopic();

    renderProgress();

    renderTopics();

    renderStats();

    renderDailyChallenge();

    renderCalendar();

    renderSchedule();

    renderNextSession();


    const section =
        getQuestionsSection();


    if (
        section
    ) {

        section.style.display =
            "none";
    }
}


/* =========================================================
   RENDER PROGRESS
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
                ) *
                100
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
   RENDER TOPICS
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

            <div
                class="empty-schedule"
            >
                No topics found in your study plan.
                Return to Home and create a study plan
                with topics.
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
                            behavior: "smooth"
                        });

                    }
                );

            }
        );
}


/* =========================================================
   RENDER SUBJECTS
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
                (
                    subject,
                    index
                ) => {

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


    if (
        !topic
    ) {

        if (
            title
        ) {

            title.textContent =
                "🏆 Study Plan Complete";
        }


        if (
            description
        ) {

            description.textContent =
                "You have completed all available topics.";
        }


        if (
            progressElement
        ) {

            progressElement.textContent =
                "100%";
        }


        if (
            progressBar
        ) {

            progressBar.style.width =
                "100%";
        }


        if (
            button
        ) {

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


    if (
        title
    ) {

        title.textContent =
            completed
                ? "🧠 Complete Your Knowledge Check"
                : "📚 Study Your Current Topic";
    }


    if (
        description
    ) {

        description.textContent =
            completed
                ? `Test yourself on ${topic.name}.`
                : `Study ${topic.name} using the timer, then complete the knowledge check.`;
    }


    const challengeProgress =
        completed
            ? 50
            : 0;


    if (
        progressElement
    ) {

        progressElement.textContent =
            `${challengeProgress}%`;
    }


    if (
        progressBar
    ) {

        progressBar.style.width =
            `${challengeProgress}%`;
    }


    if (
        button
    ) {

        button.disabled =
            false;


        button.textContent =
            completed
                ? "🧠 Open Knowledge Check"
                : "🚀 Start Challenge";

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
        isTopicCompleted(topic)
    ) {

        showKnowledgeCheck(
            topic
        );


        const section =
            getQuestionsSection();


        if (
            section
        ) {

            section.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

        return;
    }


    const timer =
        $("studyTimer");


    if (
        timer
    ) {

        timer.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }


    startTimer();
}


/* =========================================================
   STREAK
========================================================= */

function updateStudyStreak() {

    const today =
        new Date()
            .toISOString()
            .split("T")[0];


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
            new Date(
                `${lastDate}T00:00:00`
            );


        const current =
            new Date(
                `${today}T00:00:00`
            );


        const difference =
            Math.round(
                (
                    current -
                    last
                ) /
                (
                    1000 *
                    60 *
                    60 *
                    24
                )
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

        timerSeconds =
            Math.ceil(
                (
                    savedEndTime -
                    Date.now()
                ) /
                1000
            );


        timerRunning =
            true;


        startTimerInterval();

    } else {

        timerSeconds =
            selectedTimerSeconds;


        timerRunning =
            false;


        localStorage.setItem(
            TIMER_RUNNING_KEY,
            "false"
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


/* =========================================================
   START TIMER INTERVAL
========================================================= */

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


                const endTime =
                    Number(
                        localStorage.getItem(
                            TIMER_END_TIME_KEY
                        )
                    );


                if (
                    Number.isFinite(
                        endTime
                    )
                ) {

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

                } else {

                    timerSeconds =
                        Math.max(
                            0,
                            timerSeconds - 1
                        );

                }


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


/* =========================================================
   START TIMER
========================================================= */

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


    const endTime =
        Date.now() +
        (
            timerSeconds *
            1000
        );


    localStorage.setItem(
        TIMER_END_TIME_KEY,
        String(endTime)
    );


    localStorage.setItem(
        TIMER_RUNNING_KEY,
        "true"
    );


    startTimerInterval();

    renderTimer();
}


/* =========================================================
   PAUSE TIMER
========================================================= */

function pauseTimer() {

    if (
        !timerRunning
    ) {

        return;
    }


    const endTime =
        Number(
            localStorage.getItem(
                TIMER_END_TIME_KEY
            )
        );


    if (
        Number.isFinite(
            endTime
        )
    ) {

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

    }


    timerRunning =
        false;


    localStorage.setItem(
        TIMER_RUNNING_KEY,
        "false"
    );


    localStorage.removeItem(
        TIMER_END_TIME_KEY
    );


    renderTimer();
}


/* =========================================================
   STOP TIMER
========================================================= */

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


    localStorage.setItem(
        TIMER_RUNNING_KEY,
        "false"
    );


    localStorage.removeItem(
        TIMER_END_TIME_KEY
    );


    renderTimer();
}


/* =========================================================
   RESET TIMER
========================================================= */

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


/* =========================================================
   TIMER FINISHED
========================================================= */

function timerFinished() {

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


    localStorage.setItem(
        TIMER_RUNNING_KEY,
        "false"
    );


    localStorage.removeItem(
        TIMER_END_TIME_KEY
    );


    timerSeconds =
        0;


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


/* =========================================================
   CHANGE TIMER DURATION
========================================================= */

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


    selectedTimerSeconds =
        minutes * 60;


    timerSeconds =
        selectedTimerSeconds;


    stopTimer();


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


/* =========================================================
   RENDER TIMER
========================================================= */

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
            `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

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


    const today =
        new Date();


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


        cell.textContent =
            String(day);


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


        const todayString =
            formatDate(
                today
            );


        /* -----------------------------------------
           TODAY
        ----------------------------------------- */

        if (
            dateString ===
            todayString
        ) {

            cell.classList.add(
                "today"
            );

        }


        /* -----------------------------------------
           EXAM DATE
        ----------------------------------------- */

        if (
            studyPlan?.examDate ===
            dateString
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


        /* -----------------------------------------
           STUDY DAYS
        ----------------------------------------- */

        if (
            studyPlan?.studyStartDate &&
            dateString >=
                studyPlan.studyStartDate &&
            studyPlan?.examDate &&
            dateString <=
                studyPlan.examDate
        ) {

            cell.classList.add(
                "study-day"
            );

        }


        daysContainer.appendChild(
            cell
        );
    }
}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(date) {

    return [

        date.getFullYear(),

        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        ),

        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        )

    ].join("-");
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
        formatDate(
            new Date()
        );


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


    const next =
        current + 1;


    localStorage.setItem(
        AI_QUESTION_COUNT_KEY,
        String(next)
    );


    return true;
}


function showPremiumMessage() {

    alert(
        "You have used all 5 free AI questions today. Explore Premium for unlimited AI access and more study features."
    );
}


/* =========================================================
   SUPABASE USER
========================================================= */

async function loadCurrentUser() {

    try {

        if (
            typeof supabaseClient !==
                "undefined" &&
            supabaseClient?.auth
        ) {

            const {
                data,
                error
            } =
                await supabaseClient
                    .auth
                    .getUser();


            if (
                !error &&
                data?.user
            ) {

                currentUser =
                    data.user;

                return;
            }

        }

    } catch (error) {

        console.warn(
            "Supabase user check failed:",
            error
        );
    }


    /* -----------------------------------------
       Fallback
    ----------------------------------------- */

    currentUser =
        readJSON(
            "currentUser",
            null
        );
}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutStudyMind() {

    try {

        if (
            typeof supabaseClient !==
                "undefined" &&
            supabaseClient?.auth
        ) {

            await supabaseClient
                .auth
                .signOut();

        }

    } catch (error) {

        console.error(
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
   EVENT LISTENERS
========================================================= */

function initializeEventListeners() {

    /* -----------------------------------------
       TOPIC CHECKBOX
    ----------------------------------------- */

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


    /* -----------------------------------------
       SUBMIT KNOWLEDGE CHECK
    ----------------------------------------- */

    const submitQuestions =
        $("submitTopicQuestions");


    if (
        submitQuestions
    ) {

        submitQuestions.addEventListener(
            "click",
            submitKnowledgeCheck
        );

    }


    /* -----------------------------------------
       DAILY CHALLENGE
    ----------------------------------------- */

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


    /* -----------------------------------------
       TIMER
    ----------------------------------------- */

    const startButton =
        $("startTimerButton");


    const pauseButton =
        $("pauseTimerButton");


    const resetButton =
        $("resetTimerButton");


    const timerSelect =
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
        timerSelect
    ) {

        timerSelect.addEventListener(
            "change",
            event => {

                changeTimerDuration(
                    event.target.value
                );

            }
        );

    }


    /* -----------------------------------------
       CALENDAR
    ----------------------------------------- */

    const previous =
        $("previousMonth");


    const next =
        $("nextMonth");


    if (
        previous
    ) {

        previous.addEventListener(
            "click",
            previousMonth
        );

    }


    if (
        next
    ) {

        next.addEventListener(
            "click",
            nextMonth
        );

    }


    /* -----------------------------------------
       STORAGE
    ----------------------------------------- */

    window.addEventListener(
        "storage",
        event => {

            if (
                event.key ===
                    PLAN_KEY ||
                event.key ===
                    COMPATIBILITY_PLAN_KEY
            ) {

                loadStudyPlan();

                loadCompletionState();

                renderDashboard();

            }


            if (
                event.key ===
                AI_QUESTION_COUNT_KEY
            ) {

                renderStats();

            }

        }
    );


    /* -----------------------------------------
       SAME-PAGE CUSTOM STORAGE EVENT
    ----------------------------------------- */

    window.addEventListener(
        "studyMindPlanUpdated",
        () => {

            loadStudyPlan();

            loadCompletionState();

            renderDashboard();

        }
    );
}


/* =========================================================
   REQUEST NOTIFICATION PERMISSION
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

    } catch {
        /* Ignore. */
    }
}


/* =========================================================
   INITIALIZE
========================================================= */

async function initializeDashboard() {

    console.log(
        "StudyMind Dashboard initializing..."
    );


    initializeTheme();


    loadStudyPlan();


    loadCompletionState();


    await loadCurrentUser();


    initializeEventListeners();


    loadTimerState();


    renderDashboard();


    requestNotificationPermission();


    console.log(
        "StudyMind Dashboard ready."
    );


    console.log(
        "Subjects:",
        normalizedSubjects
    );


    console.log(
        "Topics:",
        allTopics
    );


    console.log(
        "Current topic:",
        getCurrentTopic()
    );
}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.openDashboard =
    function () {

        window.location.href =
            "dashboard.html";

    };


window.getAIQuestionCount =
    getAIQuestionCount;


window.getRemainingAIQuestions =
    getRemainingAIQuestions;


window.hasFreeAIQuestionsLeft =
    hasFreeAIQuestionsLeft;


window.recordAIQuestion =
    recordAIQuestion;


window.showPremiumMessage =
    showPremiumMessage;


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


window.generateTopicQuestions =
    generateTopicQuestions;


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
