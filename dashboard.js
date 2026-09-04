/* =========================================================
   STUDYMIND AI — DASHBOARD.JS
   FULL REPLACEMENT

   FLOW:

   Dashboard
      ↓
   Study current topic
      ↓
   "I have finished studying this topic"
      ↓
   Save topic to localStorage
      ↓
   knowledge-check.html
      ↓
   Exactly 5 questions
      ↓
   Pass = 3/5 or higher
      ↓
   Knowledge Check marks topic complete
      ↓
   Return to dashboard

   FEATURES:
   - Supabase authentication
   - Username greeting
   - Morning / afternoon / evening greeting
   - Study plan loading
   - Subjects
   - Topics
   - Current topic
   - Topic progress
   - Knowledge Check redirect
   - 25 / 45 / 60 minute timer
   - Timer persistence
   - Study streak
   - Calendar
   - Schedule
   - AI progress analysis
   - Ask StudyMind AI
   - 5 free AI questions
   - Theme support
========================================================= */

"use strict";


/* =========================================================
   CONFIGURATION
========================================================= */

const FREE_QUESTION_LIMIT = 5;

const KNOWLEDGE_CHECK_COUNT = 5;

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

const KNOWLEDGE_TOPIC_KEY =
    "studyMindKnowledgeCheckTopic";

const KNOWLEDGE_USAGE_KEY =
    "studyMindKnowledgeCheckUsageCount";

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

const LAST_STUDY_DATE_COMPATIBILITY_KEY =
    "studyMindLastStudyDate";


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentUser = null;

let studyPlan = null;

let completedTopics = [];

let completedQuestionTopics = [];

let currentTopicIndex = 0;

let currentStreak = 0;

let timerSeconds =
    DEFAULT_TIMER_SECONDS;

let selectedTimerSeconds =
    DEFAULT_TIMER_SECONDS;

let timerRunning = false;

let timerEndTime = null;

let timerInterval = null;

let calendarDate =
    new Date();

let eventsBound = false;


/* =========================================================
   ELEMENT HELPER
========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   STORAGE HELPERS
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
            "StudyMind could not read storage:",
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
            "StudyMind could not write storage:",
            key,
            error
        );

        return false;
    }
}


function loadArray(key) {

    const value =
        readJSON(key, []);

    return Array.isArray(value)
        ? value
        : [];
}


function loadObject(key) {

    const value =
        readJSON(key, null);

    return value &&
        typeof value === "object"
        ? value
        : null;
}


function getStoredNumber(
    key,
    fallback
) {

    const value =
        Number(
            localStorage.getItem(key)
        );

    return Number.isFinite(value)
        ? value
        : fallback;
}


/* =========================================================
   HTML SAFETY
========================================================= */

function escapeHTML(value) {

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


function cleanText(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(
            /\s+/g,
            " "
        )
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


function formatDateKey(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function todayKey() {

    return formatDateKey(
        new Date()
    );
}


function calculateDaysLeft() {

    if (
        !studyPlan ||
        !studyPlan.examDate
    ) {
        return 0;
    }

    const today =
        startOfDay(
            new Date()
        );

    const exam =
        startOfDay(
            new Date(
                studyPlan.examDate
            )
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
        const candidate
        of possibleNames
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
            const candidate
            of subjectCandidates
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

        description
    };
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
            80
        );
}


/* =========================================================
   TOPIC KEY

   MUST MATCH knowledge-check.js
========================================================= */

function getTopicKey(topic) {

    if (!topic) {
        return "";
    }

    const subject =
        cleanText(
            topic.subject ||
            "Senior Secondary"
        )
            .toLowerCase()
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    const name =
        cleanText(
            topic.name ||
            topic.title ||
            ""
        )
            .toLowerCase()
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    return `${subject}::${name}`;
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
        const key
        of topicContainers
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


    if (
        Array.isArray(rawPlan)
    ) {

        rawPlan = {

            topics:
                rawPlan

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


    /* =====================================================
       TOP-LEVEL TOPICS

       script.js normally stores:

       topics: [...]

       not:

       subjects: [
           {
               topics: [...]
           }
       ]
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
       IF NO TOP-LEVEL TOPICS,
       COLLECT FROM SUBJECTS
    ===================================================== */

    if (
        normalized.topics.length === 0
    ) {

        normalized.subjects.forEach(
            subject => {

                if (
                    Array.isArray(
                        subject.topics
                    )
                ) {

                    normalized.topics.push(
                        ...subject.topics
                    );
                }
            }
        );
    }


    return normalized;
}


/* =========================================================
   LOAD PLAN
========================================================= */

function loadStudyPlan() {

    let rawPlan =
        loadObject(
            PLAN_KEY
        );


    if (!rawPlan) {

        rawPlan =
            loadObject(
                COMPATIBILITY_PLAN_KEY
            );
    }


    studyPlan =
        normalizePlan(
            rawPlan
        );


    if (!studyPlan) {

        studyPlan = {

            examType: "",

            examDate: "",

            subjects: [],

            topics: [],

            studyHours: 1,

            difficulty: "balanced",

            daysLeft: 0,

            studyStartDate:
                todayKey(),

            createdAt:
                new Date()
                    .toISOString()

        };
    }


    if (
        !Array.isArray(
            studyPlan.subjects
        )
    ) {

        studyPlan.subjects = [];
    }


    if (
        !Array.isArray(
            studyPlan.topics
        )
    ) {

        studyPlan.topics = [];
    }


    if (
        !studyPlan.studyStartDate
    ) {

        studyPlan.studyStartDate =
            todayKey();
    }


    writeJSON(
        PLAN_KEY,
        studyPlan
    );
}


/* =========================================================
   CURRENT TOPIC
========================================================= */

function getCurrentTopic() {

    if (
        !studyPlan ||
        !Array.isArray(
            studyPlan.topics
        )
    ) {
        return null;
    }


    if (
        studyPlan.topics.length === 0
    ) {
        return null;
    }


    currentTopicIndex =
        Math.max(
            0,
            Math.min(
                currentTopicIndex,
                studyPlan.topics.length - 1
            )
        );


    return studyPlan.topics[
        currentTopicIndex
    ];
}


/* =========================================================
   COMPLETION HELPERS
========================================================= */

function getCompletedTopicKeys() {

    const keys = [];


    if (
        Array.isArray(
            completedTopics
        )
    ) {

        completedTopics.forEach(
            value => {

                if (
                    typeof value === "string"
                ) {

                    keys.push(
                        value
                    );
                }
            }
        );
    }


    if (
        Array.isArray(
            completedQuestionTopics
        )
    ) {

        completedQuestionTopics.forEach(
            value => {

                if (
                    typeof value === "string" &&
                    !keys.includes(value)
                ) {

                    keys.push(
                        value
                    );
                }
            }
        );
    }


    return keys;
}


function isTopicCompleted(
    topic
) {

    if (!topic) {
        return false;
    }


    const key =
        getTopicKey(topic);


    const completedKeys =
        getCompletedTopicKeys();


    if (
        completedKeys.includes(key)
    ) {
        return true;
    }


    if (
        completedKeys.includes(
            topic.name
        )
    ) {
        return true;
    }


    return false;
}


function saveCompletionState() {

    writeJSON(
        COMPLETED_TOPICS_KEY,
        completedTopics
    );
}


/* =========================================================
   PROGRESS

   A topic is considered fully complete
   only after the Knowledge Check has been
   completed successfully.
========================================================= */

function getProgress() {

    const topics =
        studyPlan &&
        Array.isArray(
            studyPlan.topics
        )
            ? studyPlan.topics
            : [];


    const total =
        topics.length;


    let completed =
        0;


    topics.forEach(
        topic => {

            if (
                isTopicCompleted(
                    topic
                )
            ) {

                completed++;
            }
        }
    );


    const percent =
        total > 0
            ? Math.round(
                (
                    completed /
                    total
                ) * 100
            )
            : 0;


    return {

        total,

        completed,

        percent

    };
}


/* =========================================================
   DASHBOARD ELEMENTS
========================================================= */

function getElements() {

    return {

        weeklyHours:
            $("weeklyHours"),

        daysLeft:
            $("daysLeft"),

        dailyGoal:
            $("dailyGoal"),

        studyScore:
            $("studyScore"),

        subjectList:
            $("subjectList"),

        topicList:
            $("topicList"),

        progressPercent:
            $("progressPercent"),

        progressCount:
            $("progressCount"),

        progressBar:
            $("progressBar"),

        streak:
            $("streak"),

        scoreDisplay:
            $("scoreDisplay"),

        scoreProgressBar:
            $("scoreProgressBar"),

        scoreMessage:
            $("scoreMessage"),

        calendarDays:
            $("calendarDays"),

        calendarMonth:
            $("calendarMonth"),

        previousMonth:
            $("previousMonth"),

        nextMonth:
            $("nextMonth"),

        nextBooking:
            $("nextBooking"),

        nextBookingTime:
            $("nextBookingTime"),

        scheduleList:
            $("scheduleList"),

        currentTopicName:
            $("currentTopicName"),

        currentTopicDescription:
            $("currentTopicDescription"),

        topicPosition:
            $("topicPosition"),

        topicStatusBadge:
            $("topicStatusBadge"),

        topicCompleteCheckbox:
            $("topicCompleteCheckbox"),

        topicCompletionMessage:
            $("topicCompletionMessage"),

        nextTopicMessage:
            $("nextTopicMessage"),

        topicQuestionsSection:
            $("topicQuestionsSection"),

        topicQuestions:
            $("topicQuestions"),

        submitTopicQuestions:
            $("submitTopicQuestions"),

        topicQuestionResult:
            $("topicQuestionResult"),

        studyTimer:
            $("studyTimer"),

        startTimerButton:
            $("startTimerButton"),

        pauseTimerButton:
            $("pauseTimerButton"),

        resetTimerButton:
            $("resetTimerButton"),

        timerDuration:
            $("timerDuration") ||
            $("studyTimerDuration") ||
            $("timerMinutes") ||
            $("studyTime"),

        analyzeProgressButton:
            $("analyzeProgressButton"),

        aiAdviceText:
            $("aiAdviceText"),

        askAIButton:
            $("askAIButton"),

        aiQuestion:
            $("aiQuestion"),

        aiResponse:
            $("aiResponse"),

        greeting:
            $("dashboardGreeting"),

        username:
            $("dashboardUsername")

    };
}


/* =========================================================
   GREETING
========================================================= */

function getUserDisplayName() {

    if (!currentUser) {
        return "Student";
    }


    const metadata =
        currentUser.user_metadata ||
        {};


    const possibleNames = [

        metadata.username,

        metadata.user_name,

        metadata.display_name,

        metadata.full_name,

        metadata.name,

        currentUser.email
            ? currentUser.email.split("@")[0]
            : ""

    ];


    for (
        const name
        of possibleNames
    ) {

        const cleaned =
            cleanText(name);

        if (cleaned) {

            return cleaned;
        }
    }


    return "Student";
}


function getGreetingPrefix() {

    const hour =
        new Date().getHours();


    if (hour < 12) {

        return "Good morning";

    }


    if (hour < 17) {

        return "Good afternoon";

    }


    return "Good evening";
}


function renderGreeting() {

    const elements =
        getElements();


    const name =
        getUserDisplayName();


    const greeting =
        `${getGreetingPrefix()}, ${name} 👋`;


    if (
        elements.greeting
    ) {

        elements.greeting.textContent =
            greeting;
    }


    if (
        elements.username
    ) {

        elements.username.textContent =
            name;
    }


    /*
     * Support common alternative IDs
     * without requiring HTML changes.
     */

    const alternatives = [

        "welcomeMessage",

        "welcomeTitle",

        "greetingText",

        "userGreeting"

    ];


    alternatives.forEach(
        id => {

            const element =
                $(id);

            if (element) {

                element.textContent =
                    greeting;
            }
        }
    );
}


/* =========================================================
   SUBJECTS
========================================================= */

function renderSubjects() {

    const elements =
        getElements();


    if (
        !elements.subjectList
    ) {
        return;
    }


    const subjects =
        studyPlan &&
        Array.isArray(
            studyPlan.subjects
        )
            ? studyPlan.subjects
            : [];


    if (
        subjects.length === 0
    ) {

        elements.subjectList.innerHTML =

            `<div class="empty-state">
                No subjects in your study plan.
            </div>`;

        return;
    }


    elements.subjectList.innerHTML =

        subjects
            .map(
                (
                    subject,
                    index
                ) => {

                    const name =
                        typeof subject === "string"
                            ? subject
                            : subject.name;


                    return `

                        <div class="subject-item">

                            <span class="subject-number">
                                ${index + 1}
                            </span>

                            <strong>
                                ${escapeHTML(name)}
                            </strong>

                        </div>

                    `;
                }
            )
            .join("");
}


/* =========================================================
   TOPICS LIST
========================================================= */

function renderTopics() {

    const elements =
        getElements();


    if (
        !elements.topicList
    ) {
        return;
    }


    const topics =
        studyPlan &&
        Array.isArray(
            studyPlan.topics
        )
            ? studyPlan.topics
            : [];


    if (
        topics.length === 0
    ) {

        elements.topicList.innerHTML =

            `<div class="empty-state">
                No topics in your study plan.
            </div>`;

        return;
    }


    elements.topicList.innerHTML =

        topics
            .map(
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


                    if (!topic) {
                        return "";
                    }


                    const completed =
                        isTopicCompleted(
                            topic
                        );


                    const current =
                        index ===
                        currentTopicIndex;


                    return `

                        <div
                            class="
                                topic-item
                                ${completed ? "completed" : ""}
                                ${current ? "active" : ""}
                            "
                            data-topic-index="${index}"
                            style="cursor:pointer;"
                        >

                            <span class="topic-number">
                                ${index + 1}
                            </span>

                            <span class="topic-name">
                                ${escapeHTML(
                                    topic.name
                                )}
                            </span>

                            <span class="topic-state">

                                ${
                                    completed
                                        ? "✓ Completed"
                                        : current
                                            ? "In Progress"
                                            : "Not Started"
                                }

                            </span>

                        </div>

                    `;
                }
            )
            .join("");


    /*
     * Allow users to select a topic.
     */

    const topicItems =
        elements.topicList.querySelectorAll(
            "[data-topic-index]"
        );


    topicItems.forEach(
        item => {

            item.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            item.dataset.topicIndex
                        );


                    if (
                        !Number.isFinite(index)
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


                    renderCurrentTopic();

                    renderTopics();

                }
            );
        }
    );
}


/* =========================================================
   CURRENT TOPIC RENDERING
========================================================= */

function renderCurrentTopic() {

    const elements =
        getElements();


    const topic =
        getCurrentTopic();


    if (!topic) {

        if (
            elements.currentTopicName
        ) {

            elements.currentTopicName.textContent =
                "No topic available";
        }


        if (
            elements.currentTopicDescription
        ) {

            elements.currentTopicDescription.textContent =
                "Create a study plan with topics to begin.";
        }


        if (
            elements.topicPosition
        ) {

            elements.topicPosition.textContent =
                "TOPIC 0 OF 0";
        }


        if (
            elements.topicStatusBadge
        ) {

            elements.topicStatusBadge.textContent =
                "NO TOPIC";
        }


        if (
            elements.topicCompleteCheckbox
        ) {

            elements.topicCompleteCheckbox.checked =
                false;

            elements.topicCompleteCheckbox.disabled =
                true;
        }


        if (
            elements.topicCompletionMessage
        ) {

            elements.topicCompletionMessage.textContent =
                "Create a study plan with topics to begin.";
        }


        if (
            elements.nextTopicMessage
        ) {

            elements.nextTopicMessage.textContent =
                "";
        }


        hideDashboardKnowledgeCheck();


        return;
    }


    const completed =
        isTopicCompleted(
            topic
        );


    if (
        elements.currentTopicName
    ) {

        elements.currentTopicName.textContent =
            topic.name;
    }


    if (
        elements.currentTopicDescription
    ) {

        elements.currentTopicDescription.textContent =
            topic.description ||
            `Study ${topic.name} and complete the Knowledge Check.`;
    }


    if (
        elements.topicPosition
    ) {

        elements.topicPosition.textContent =

            `TOPIC ${
                currentTopicIndex + 1
            } OF ${
                studyPlan.topics.length
            }`;
    }


    if (
        elements.topicStatusBadge
    ) {

        elements.topicStatusBadge.textContent =
            completed
                ? "COMPLETED"
                : "IN PROGRESS";


        elements.topicStatusBadge.classList.toggle(
            "completed",
            completed
        );
    }


    if (
        elements.topicCompleteCheckbox
    ) {

        /*
         * If the Knowledge Check has already
         * been passed, the checkbox stays checked.
         *
         * Otherwise the user can check it to
         * launch the Knowledge Check.
         */

        elements.topicCompleteCheckbox.disabled =
            completed;


        elements.topicCompleteCheckbox.checked =
            completed;
    }


    if (
        elements.topicCompletionMessage
    ) {

        if (completed) {

            elements.topicCompletionMessage.textContent =
                "✓ Knowledge Check completed. Topic finished.";

        } else {

            elements.topicCompletionMessage.textContent =
                "Tick this box when you are done studying. Your Knowledge Check will open next.";
        }
    }


    if (
        elements.nextTopicMessage
    ) {

        if (
            currentTopicIndex <
            studyPlan.topics.length - 1
        ) {

            const nextTopic =
                normalizeTopic(
                    studyPlan.topics[
                        currentTopicIndex + 1
                    ],
                    "",
                    currentTopicIndex + 1
                );


            elements.nextTopicMessage.textContent =

                nextTopic

                    ? `Next: ${nextTopic.name}`

                    : "";

        } else {

            elements.nextTopicMessage.textContent =
                "You've reached the final topic.";
        }
    }


    /*
     * IMPORTANT:
     *
     * The dashboard no longer generates
     * Knowledge Check questions.
     *
     * The dedicated knowledge-check.html
     * page handles that.
     */

    hideDashboardKnowledgeCheck();
}


/* =========================================================
   KNOWLEDGE CHECK — DEDICATED PAGE

   THIS IS THE IMPORTANT FIX.

   The dashboard only:
   1. Saves the topic.
   2. Stops the timer.
   3. Updates study streak.
   4. Redirects to knowledge-check.html.

   It does NOT mark the topic fully complete.
========================================================= */

function openKnowledgeCheckPage(
    topic
) {

    if (!topic) {

        alert(
            "No topic is currently selected."
        );

        return;
    }


    const normalizedTopic =
        normalizeTopic(
            topic,
            topic.subject || "",
            currentTopicIndex
        );


    if (
        !normalizedTopic ||
        !normalizedTopic.name
    ) {

        alert(
            "Unable to identify this topic. Please return to your study plan and try again."
        );

        return;
    }


    /*
     * Check the global free Knowledge Check limit.
     *
     * The actual Knowledge Check page also
     * checks this limit.
     */

    const usageCount =
        Number(
            localStorage.getItem(
                KNOWLEDGE_USAGE_KEY
            )
        ) || 0;


    if (
        usageCount >=
        KNOWLEDGE_CHECK_LIMIT
    ) {

        showPremiumKnowledgeCheckMessage();

        return;
    }


    /*
     * Build EXACTLY the data expected by
     * knowledge-check.js.
     */

    const topicData = {

        id:
            normalizedTopic.id ||
            "",

        key:
            getTopicKey(
                normalizedTopic
            ),

        name:
            cleanText(
                normalizedTopic.name
            ),

        title:
            cleanText(
                normalizedTopic.name
            ),

        subject:
            cleanText(
                normalizedTopic.subject ||
                "Senior Secondary"
            ),

        description:
            cleanText(
                normalizedTopic.description ||
                `Study ${normalizedTopic.name} and complete the knowledge check.`
            ),

        checkId:
            `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}`

    };


    console.log(
        "StudyMind — preparing Knowledge Check:",
        topicData
    );


    try {

        localStorage.setItem(
            KNOWLEDGE_TOPIC_KEY,
            JSON.stringify(
                topicData
            )
        );


        /*
         * Also save the current topic index
         * so the dashboard knows where to return.
         */

        localStorage.setItem(
            CURRENT_TOPIC_KEY,
            String(
                currentTopicIndex
            )
        );


        /*
         * Record that the student finished
         * the STUDY portion.
         *
         * We deliberately DO NOT put the
         * topic in completedTopics here.
         *
         * The topic becomes fully completed
         * after the Knowledge Check passes.
         */

        localStorage.setItem(
            LAST_STUDY_DATE_KEY,
            todayKey()
        );

        localStorage.setItem(
            LAST_STUDY_DATE_COMPATIBILITY_KEY,
            todayKey()
        );


        updateStreak();


        /*
         * Stop the study timer.
         */

        stopTimer();


        /*
         * Redirect to the dedicated page.
         *
         * Use replace rather than opening a new
         * tab/window. This makes the intended flow
         * clear and prevents popup blockers.
         */

        window.location.assign(
            "knowledge-check.html"
        );

    } catch (error) {

        console.error(
            "Could not start Knowledge Check:",
            error
        );


        alert(
            "Unable to start the Knowledge Check. Please try again."
        );
    }
}


/*
 * Expose globally so buttons or other scripts
 * can call it.
 */

window.openKnowledgeCheckPage =
    openKnowledgeCheckPage;


/* =========================================================
   KNOWLEDGE CHECK LIMIT
========================================================= */

const KNOWLEDGE_CHECK_LIMIT = 5;


function showPremiumKnowledgeCheckMessage() {

    const elements =
        getElements();


    const container =
        elements.topicQuestionsSection ||
        elements.aiResponse;


    if (container) {

        container.style.display =
            "block";


        container.innerHTML = `

            <div class="ai-limit-message">

                <h3>
                    💎 Free Knowledge Check Limit Reached
                </h3>

                <p>
                    You've used all 5 of your free Knowledge Checks.
                </p>

                <button
                    type="button"
                    class="premium-button"
                    onclick="openPremiumOffer()"
                >
                    Explore Premium
                </button>

            </div>

        `;
    } else {

        alert(
            "You've used all 5 of your free Knowledge Checks. Premium is coming soon."
        );
    }
}


/* =========================================================
   DASHBOARD KNOWLEDGE CHECK HIDDEN

   Kept for compatibility with older dashboard HTML.
========================================================= */

function hideDashboardKnowledgeCheck() {

    const elements =
        getElements();


    if (
        elements.topicQuestionsSection
    ) {

        elements.topicQuestionsSection.style.display =
            "none";
    }
}


function showKnowledgeCheck(topic) {

    /*
     * Compatibility wrapper.
     *
     * IMPORTANT:
     * This no longer generates questions
     * inside dashboard.
     */

    openKnowledgeCheckPage(
        topic
    );
}


window.showKnowledgeCheck =
    showKnowledgeCheck;


/* =========================================================
   LEGACY GENERATE FUNCTION

   Any old dashboard code that calls this
   will now open the dedicated page.
========================================================= */

function generateTopicQuestions(
    topic
) {

    if (!topic) {

        topic =
            getCurrentTopic();
    }


    if (!topic) {

        alert(
            "Please select a topic first."
        );

        return;
    }


    openKnowledgeCheckPage(
        topic
    );
}


window.generateTopicQuestions =
    generateTopicQuestions;


/* =========================================================
   TOPIC COMPLETION HANDLER

   THIS IS THE MAIN BUTTON / CHECKBOX FIX.
========================================================= */

function completeCurrentTopic() {

    const elements =
        getElements();


    const topic =
        getCurrentTopic();


    if (!topic) {

        console.warn(
            "No current topic available."
        );

        return;
    }


    /*
     * If already completed, do nothing.
     */

    if (
        isTopicCompleted(
            topic
        )
    ) {

        if (
            elements.topicCompleteCheckbox
        ) {

            elements.topicCompleteCheckbox.checked =
                true;
        }

        return;
    }


    /*
     * Only react when the user actually
     * checks the checkbox.
     */

    if (
        !elements.topicCompleteCheckbox ||
        !elements.topicCompleteCheckbox.checked
    ) {

        return;
    }


    /*
     * DO NOT mark the topic as completed here.
     *
     * The Knowledge Check must be passed first.
     */


    if (
        elements.topicCompletionMessage
    ) {

        elements.topicCompletionMessage.textContent =
            "Opening your 5-question Knowledge Check...";
    }


    /*
     * Give the UI a tiny moment to register
     * the checkbox before redirecting.
     */

    openKnowledgeCheckPage(
        topic
    );
}


window.completeCurrentTopic =
    completeCurrentTopic;


/* =========================================================
   UNCHECK HANDLER

   Because checking launches the page immediately,
   the user normally never gets a chance to
   uncheck it.

   This is kept safe for compatibility.
========================================================= */

function handleTopicCompletionChange() {

    const elements =
        getElements();


    if (
        !elements.topicCompleteCheckbox
    ) {
        return;
    }


    if (
        elements.topicCompleteCheckbox.checked
    ) {

        completeCurrentTopic();

    }
}


/* =========================================================
   STUDY STREAK
========================================================= */

function updateStreak() {

    const today =
        todayKey();


    let lastStudyDate =
        localStorage.getItem(
            LAST_STUDY_DATE_KEY
        );


    if (!lastStudyDate) {

        lastStudyDate =
            localStorage.getItem(
                LAST_STUDY_DATE_COMPATIBILITY_KEY
            );
    }


    /*
     * Already counted today.
     */

    if (
        lastStudyDate ===
        today
    ) {

        return;
    }


    const yesterday =
        new Date();


    yesterday.setDate(
        yesterday.getDate() - 1
    );


    const yesterdayKey =
        formatDateKey(
            yesterday
        );


    if (
        lastStudyDate ===
        yesterdayKey
    ) {

        currentStreak += 1;

    } else {

        currentStreak = 1;
    }


    localStorage.setItem(
        STREAK_KEY,
        String(
            currentStreak
        )
    );


    localStorage.setItem(
        LAST_STUDY_DATE_KEY,
        today
    );


    localStorage.setItem(
        LAST_STUDY_DATE_COMPATIBILITY_KEY,
        today
    );


    renderStreak();
}


function renderStreak() {

    const elements =
        getElements();


    if (
        elements.streak
    ) {

        elements.streak.textContent =
            currentStreak;
    }
}


/* =========================================================
   PROGRESS UI
========================================================= */

function updateDashboardProgress() {

    const elements =
        getElements();


    const progress =
        getProgress();


    if (
        elements.progressPercent
    ) {

        elements.progressPercent.textContent =
            `${progress.percent}%`;
    }


    if (
        elements.progressCount
    ) {

        elements.progressCount.textContent =

            `${progress.completed} of ${progress.total} topics completed`;
    }


    if (
        elements.progressBar
    ) {

        if (
            elements.progressBar.tagName ===
            "CIRCLE"
        ) {

            const radius =
                Number(
                    elements.progressBar.getAttribute(
                        "r"
                    )
                ) || 45;


            const circumference =
                2 *
                Math.PI *
                radius;


            elements.progressBar.style.strokeDasharray =
                circumference;


            elements.progressBar.style.strokeDashoffset =

                circumference -

                (
                    progress.percent /
                    100 *
                    circumference
                );

        } else {

            elements.progressBar.style.width =
                `${progress.percent}%`;
        }
    }


    if (
        elements.studyScore
    ) {

        elements.studyScore.textContent =
            progress.percent;
    }


    if (
        elements.scoreDisplay
    ) {

        elements.scoreDisplay.textContent =
            `${progress.percent} / 100`;
    }


    if (
        elements.scoreProgressBar
    ) {

        elements.scoreProgressBar.style.width =
            `${progress.percent}%`;
    }


    if (
        elements.scoreMessage
    ) {

        if (
            progress.percent === 0
        ) {

            elements.scoreMessage.textContent =
                "Start studying to build your score.";

        } else if (
            progress.percent < 50
        ) {

            elements.scoreMessage.textContent =
                "Good start. Keep building your momentum.";

        } else if (
            progress.percent < 80
        ) {

            elements.scoreMessage.textContent =
                "You're making solid progress. Keep going.";

        } else if (
            progress.percent < 100
        ) {

            elements.scoreMessage.textContent =
                "Excellent progress. You're almost there.";

        } else {

            elements.scoreMessage.textContent =
                "Outstanding! You've completed your study plan.";
        }
    }
}


/* =========================================================
   DASHBOARD STATS
========================================================= */

function updateDashboardStats() {

    const elements =
        getElements();


    const hours =
        Number(
            studyPlan &&
            studyPlan.studyHours
        ) || 0;


    const remaining =
        calculateDaysLeft();


    if (
        elements.weeklyHours
    ) {

        elements.weeklyHours.textContent =
            `${Math.round(
                hours * 7
            )}h`;
    }


    if (
        elements.daysLeft
    ) {

        elements.daysLeft.textContent =
            remaining;
    }


    if (
        elements.dailyGoal
    ) {

        elements.dailyGoal.textContent =
            `${hours} hrs`;
    }


    renderStreak();
}


/* =========================================================
   TIMER
========================================================= */

function ensureTimerStorage() {

    if (
        !Number.isFinite(
            selectedTimerSeconds
        ) ||
        selectedTimerSeconds <= 0
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


function formatTimer(
    seconds
) {

    const safeSeconds =
        Math.max(
            0,
            Math.floor(
                Number(seconds) || 0
            )
        );


    const minutes =
        Math.floor(
            safeSeconds / 60
        );


    const remainingSeconds =
        safeSeconds % 60;


    return `${String(
        minutes
    ).padStart(
        2,
        "0"
    )}:${String(
        remainingSeconds
    ).padStart(
        2,
        "0"
    )}`;
}


function updateTimerDisplay() {

    const elements =
        getElements();


    if (
        elements.studyTimer
    ) {

        elements.studyTimer.textContent =
            formatTimer(
                timerSeconds
            );
    }


    /*
     * Support alternative timer displays.
     */

    [
        "timerDisplay",
        "studyTimerDisplay",
        "timerTime"
    ].forEach(
        id => {

            const element =
                $(id);

            if (element) {

                element.textContent =
                    formatTimer(
                        timerSeconds
                    );
            }
        }
    );
}


function updateTimerButtons() {

    const elements =
        getElements();


    if (
        elements.startTimerButton
    ) {

        elements.startTimerButton.disabled =
            timerRunning ||
            timerSeconds <= 0;
    }


    if (
        elements.pauseTimerButton
    ) {

        elements.pauseTimerButton.disabled =
            !timerRunning;
    }
}


function syncTimerDurationControl() {

    const elements =
        getElements();


    if (
        !elements.timerDuration
    ) {
        return;
    }


    const minutes =
        Math.round(
            selectedTimerSeconds /
            60
        );


    /*
     * If the control is a SELECT,
     * select the matching option.
     */

    if (
        elements.timerDuration.tagName ===
        "SELECT"
    ) {

        const desiredValue =
            String(minutes);


        let option =
            Array.from(
                elements.timerDuration.options
            ).find(
                item =>
                    item.value ===
                    desiredValue
            );


        if (!option) {

            option =
                Array.from(
                    elements.timerDuration.options
                ).find(
                    item =>
                        Number(
                            item.value
                        ) === minutes
                );
        }


        if (option) {

            elements.timerDuration.value =
                option.value;
        }
    }
}


function handleTimerDurationChange() {

    const elements =
        getElements();


    if (
        !elements.timerDuration
    ) {
        return;
    }


    let minutes =
        Number(
            elements.timerDuration.value
        );


    /*
     * Some existing HTML may use
     * text such as "25 minutes".
     */

    if (
        !Number.isFinite(minutes)
    ) {

        const match =
            String(
                elements.timerDuration.value
            )
                .match(
                    /\d+/
                );


        if (match) {

            minutes =
                Number(
                    match[0]
                );
        }
    }


    if (
        !Number.isFinite(minutes) ||
        minutes <= 0
    ) {

        return;
    }


    /*
     * Keep timer choices professional
     * and restricted to 25 / 45 / 60.
     */

    if (
        !TIMER_OPTIONS.includes(
            minutes
        )
    ) {

        const closest =
            TIMER_OPTIONS.reduce(
                (
                    previous,
                    current
                ) =>

                    Math.abs(
                        current -
                        minutes
                    ) <
                    Math.abs(
                        previous -
                        minutes
                    )
                        ? current
                        : previous
            );


        minutes =
            closest;
    }


    selectedTimerSeconds =
        minutes * 60;


    timerSeconds =
        selectedTimerSeconds;


    timerRunning =
        false;


    timerEndTime =
        null;


    clearInterval(
        timerInterval
    );


    timerInterval =
        null;


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


    localStorage.setItem(
        TIMER_RUNNING_KEY,
        "false"
    );


    localStorage.removeItem(
        TIMER_END_TIME_KEY
    );


    updateTimerDisplay();

    updateTimerButtons();
}


function startTimerInterval() {

    clearInterval(
        timerInterval
    );


    timerInterval =
        setInterval(
            () => {

                if (
                    !timerEndTime
                ) {
                    return;
                }


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


                localStorage.setItem(
                    TIMER_SECONDS_KEY,
                    String(
                        timerSeconds
                    )
                );


                updateTimerDisplay();


                if (
                    timerSeconds <= 0
                ) {

                    finishTimer(
                        true
                    );
                }

            },
            250
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


    timerEndTime =
        Date.now() +
        (
            timerSeconds *
            1000
        );


    timerRunning =
        true;


    localStorage.setItem(
        TIMER_RUNNING_KEY,
        "true"
    );


    localStorage.setItem(
        TIMER_END_TIME_KEY,
        String(
            timerEndTime
        )
    );


    updateTimerButtons();

    startTimerInterval();
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


    clearInterval(
        timerInterval
    );


    timerInterval =
        null;


    localStorage.setItem(
        TIMER_SECONDS_KEY,
        String(
            timerSeconds
        )
    );


    localStorage.setItem(
        TIMER_RUNNING_KEY,
        "false"
    );


    localStorage.removeItem(
        TIMER_END_TIME_KEY
    );


    updateTimerDisplay();

    updateTimerButtons();
}


function resetTimer() {

    clearInterval(
        timerInterval
    );


    timerInterval =
        null;


    timerRunning =
        false;


    timerEndTime =
        null;


    timerSeconds =
        selectedTimerSeconds;


    localStorage.setItem(
        TIMER_SECONDS_KEY,
        String(
            timerSeconds
        )
    );


    localStorage.setItem(
        TIMER_RUNNING_KEY,
        "false"
    );


    localStorage.removeItem(
        TIMER_END_TIME_KEY
    );


    updateTimerDisplay();

    updateTimerButtons();
}


function stopTimer() {

    clearInterval(
        timerInterval
    );


    timerInterval =
        null;


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


    updateTimerButtons();
}


function finishTimer(
    showMessage = true
) {

    clearInterval(
        timerInterval
    );


    timerInterval =
        null;


    timerRunning =
        false;


    timerEndTime =
        null;


    timerSeconds =
        0;


    localStorage.setItem(
        TIMER_SECONDS_KEY,
        "0"
    );


    localStorage.setItem(
        TIMER_RUNNING_KEY,
        "false"
    );


    localStorage.removeItem(
        TIMER_END_TIME_KEY
    );


    updateTimerDisplay();

    updateTimerButtons();


    if (
        showMessage
    ) {

        alert(
            "⏰ Study timer complete! Great work."
        );
    }
}


function restoreTimerState() {

    const running =
        localStorage.getItem(
            TIMER_RUNNING_KEY
        ) === "true";


    const endTime =
        Number(
            localStorage.getItem(
                TIMER_END_TIME_KEY
            )
        );


    if (
        running &&
        Number.isFinite(endTime) &&
        endTime > Date.now()
    ) {

        timerEndTime =
            endTime;


        timerRunning =
            true;


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


        startTimerInterval();

    } else if (
        running &&
        Number.isFinite(endTime)
    ) {

        finishTimer(
            false
        );

    } else {

        timerRunning =
            false;


        timerEndTime =
            null;


        timerSeconds =
            getStoredNumber(
                TIMER_SECONDS_KEY,
                selectedTimerSeconds
            );


        if (
            timerSeconds <= 0
        ) {

            timerSeconds =
                selectedTimerSeconds;
        }
    }


    updateTimerDisplay();

    updateTimerButtons();
}


/* =========================================================
   CALENDAR
========================================================= */

function renderCalendar() {

    const elements =
        getElements();


    if (
        !elements.calendarDays
    ) {
        return;
    }


    const year =
        calendarDate.getFullYear();


    const month =
        calendarDate.getMonth();


    if (
        elements.calendarMonth
    ) {

        elements.calendarMonth.textContent =

            new Intl.DateTimeFormat(
                "en-US",
                {
                    month: "long",
                    year: "numeric"
                }
            ).format(
                calendarDate
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


    const startWeekday =
        firstDay.getDay();


    const totalDays =
        lastDay.getDate();


    let html = "";


    /*
     * Empty cells before first day.
     */

    for (
        let i = 0;
        i < startWeekday;
        i++
    ) {

        html +=
            `<div class="calendar-day empty"></div>`;
    }


    const today =
        todayKey();


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
            formatDateKey(
                date
            );


        const isToday =
            key === today;


        const isExam =
            studyPlan &&
            studyPlan.examDate &&
            formatDateKey(
                new Date(
                    studyPlan.examDate
                )
            ) === key;


        const classes = [

            "calendar-day",

            isToday
                ? "today"
                : "",

            isExam
                ? "exam-day"
                : ""

        ]
            .filter(Boolean)
            .join(" ");


        html += `

            <div
                class="${classes}"
                data-date="${key}"
            >

                <span>
                    ${day}
                </span>

                ${
                    isExam
                        ? `<small>EXAM</small>`
                        : ""
                }

            </div>

        `;
    }


    elements.calendarDays.innerHTML =
        html;
}


function renderSchedule() {

    const elements =
        getElements();


    if (
        !elements.scheduleList
    ) {
        return;
    }


    const topics =
        studyPlan &&
        Array.isArray(
            studyPlan.topics
        )
            ? studyPlan.topics
            : [];


    if (
        topics.length === 0
    ) {

        elements.scheduleList.innerHTML =

            `<div class="empty-state">
                No study schedule available.
            </div>`;

        return;
    }


    const hours =
        Number(
            studyPlan.studyHours
        ) || 1;


    const displayedTopics =
        topics.slice(
            0,
            Math.min(
                topics.length,
                7
            )
        );


    elements.scheduleList.innerHTML =

        displayedTopics
            .map(
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


                    if (!topic) {
                        return "";
                    }


                    const day =
                        new Date();


                    day.setDate(
                        day.getDate() +
                        index
                    );


                    const dayName =
                        new Intl.DateTimeFormat(
                            "en-US",
                            {
                                weekday:
                                    "short"
                            }
                        ).format(
                            day
                        );


                    return `

                        <div class="schedule-item">

                            <div>

                                <strong>
                                    ${escapeHTML(
                                        dayName
                                    )}
                                </strong>

                                <span>
                                    ${escapeHTML(
                                        topic.name
                                    )}
                                </span>

                            </div>

                            <strong>
                                ${hours} hr
                            </strong>

                        </div>

                    `;
                }
            )
            .join("");
}


/* =========================================================
   NEXT BOOKING
========================================================= */

function updateNextBooking() {

    const elements =
        getElements();


    if (
        !elements.nextBooking &&
        !elements.nextBookingTime
    ) {
        return;
    }


    const topic =
        getCurrentTopic();


    if (
        elements.nextBooking
    ) {

        elements.nextBooking.textContent =
            topic
                ? topic.name
                : "No study session";
    }


    if (
        elements.nextBookingTime
    ) {

        const hours =
            Number(
                studyPlan &&
                studyPlan.studyHours
            ) || 1;


        elements.nextBookingTime.textContent =

            `${hours} hour${
                hours === 1
                    ? ""
                    : "s"
            } study session`;
    }
}


/* =========================================================
   AI QUESTION COUNTER
========================================================= */

function resetAIQuestionCountIfNewDay() {

    const today =
        todayKey();


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
    }
}


function getAIQuestionCount() {

    resetAIQuestionCountIfNewDay();


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

    resetAIQuestionCountIfNewDay();


    const count =
        getAIQuestionCount() + 1;


    localStorage.setItem(
        AI_QUESTION_COUNT_KEY,
        String(
            count
        )
    );


    return count;
}


/* =========================================================
   AI AUTH UI
========================================================= */

function setupAIAuthenticationUI() {

    const elements =
        getElements();


    const remaining =
        getRemainingAIQuestions();


    if (
        elements.askAIButton
    ) {

        elements.askAIButton.disabled =
            remaining <= 0;
    }
}


/* =========================================================
   ASK STUDYMIND AI
========================================================= */

async function askStudyMindAI() {

    const elements =
        getElements();


    if (
        !elements.aiQuestion
    ) {
        return;
    }


    const question =
        elements.aiQuestion.value.trim();


    if (!question) {

        if (
            elements.aiResponse
        ) {

            elements.aiResponse.textContent =
                "Please enter a question first.";
        }

        return;
    }


    if (
        !hasFreeAIQuestionsLeft()
    ) {

        showAskAILimitMessage();

        return;
    }


    if (
        elements.askAIButton
    ) {

        elements.askAIButton.disabled =
            true;

        elements.askAIButton.textContent =
            "⏳ Thinking...";
    }


    if (
        elements.aiResponse
    ) {

        elements.aiResponse.textContent =
            "StudyMind AI is thinking...";
    }


    /*
     * Count the question only when
     * we actually send the request.
     */

    recordAIQuestion();


    try {

        const subjects =
            studyPlan.subjects
                .map(
                    subject =>
                        typeof subject === "string"
                            ? subject
                            : subject.name
                );


        const topics =
            studyPlan.topics
                .map(
                    topic => {

                        const normalized =
                            normalizeTopic(
                                topic
                            );

                        return normalized
                            ? normalized.name
                            : topic;
                    }
                );


        const progress =
            getProgress();


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
        studyPlan.studyHours
    ) || 0
}

Exam type:
${
    studyPlan.examType ||
    "Not specified"
}

Exam date:
${
    studyPlan.examDate ||
    "Not specified"
}

Days remaining:
${calculateDaysLeft()}

Progress:
${progress.completed} of ${progress.total} topics completed.

Current topic:
${
    getCurrentTopic()
        ? getCurrentTopic().name
        : "None"
}

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


        if (
            !response.ok
        ) {

            let message =
                "Something went wrong.";


            try {

                const errorData =
                    await response.json();


                if (
                    errorData &&
                    errorData.error
                ) {

                    message =
                        errorData.error;
                }

            } catch {}


            throw new Error(
                message
            );
        }


        const data =
            await response.json();


        if (
            !data ||
            !data.reply
        ) {

            throw new Error(
                "The AI returned an empty response."
            );
        }


        if (
            elements.aiResponse
        ) {

            elements.aiResponse.innerHTML =
                renderAIResponse(
                    data.reply
                );
        }


        elements.aiQuestion.value =
            "";


    } catch (error) {

        /*
         * Give the question back if the API
         * request failed.
         */

        const count =
            getAIQuestionCount();


        localStorage.setItem(
            AI_QUESTION_COUNT_KEY,
            String(
                Math.max(
                    0,
                    count - 1
                )
            )
        );


        if (
            elements.aiResponse
        ) {

            elements.aiResponse.textContent =
                error.message ||
                "Sorry, I couldn't connect to StudyMind AI right now.";
        }

    } finally {

        setupAIAuthenticationUI();


        if (
            elements.askAIButton
        ) {

            elements.askAIButton.disabled =
                !hasFreeAIQuestionsLeft();

            elements.askAIButton.textContent =
                "Ask StudyMind AI";
        }
    }
}


function renderAIResponse(
    text
) {

    const safe =
        escapeHTML(
            text
        );


    return safe
        .replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        )
        .replace(
            /\n\n/g,
            "<br><br>"
        )
        .replace(
            /\n/g,
            "<br>"
        );
}


/* =========================================================
   AI LIMIT MESSAGE
========================================================= */

function showAskAILimitMessage() {

    const elements =
        getElements();


    if (
        !elements.aiResponse
    ) {
        return;
    }


    elements.aiResponse.innerHTML = `

        <div class="ai-limit-message">

            <h3>
                💎 Free AI Limit Reached
            </h3>

            <p>
                You've used all 5 of your free AI questions today.
            </p>

            <button
                type="button"
                class="premium-button"
                onclick="openPremiumOffer()"
            >
                Explore Premium
            </button>

        </div>

    `;
}


function showPremiumMessage() {

    showAskAILimitMessage();
}


/* =========================================================
   PREMIUM MODAL
========================================================= */

function openPremiumOffer() {

    const existing =
        $("premiumModal");


    if (existing) {

        existing.remove();
    }


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "premiumModal";


    modal.innerHTML = `

        <div class="premium-modal-overlay">

            <div class="premium-modal">

                <button
                    type="button"
                    id="closePremiumButton"
                    class="premium-close"
                    aria-label="Close"
                >
                    ×
                </button>

                <div class="premium-icon">
                    💎
                </div>

                <h2>
                    StudyMind AI Premium
                </h2>

                <p>
                    Unlimited AI help and more
                    study features are coming soon.
                </p>

                <button
                    type="button"
                    id="premiumComingSoonButton"
                    class="premium-button"
                >
                    Coming Soon 🚀
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    const closeButton =
        $("closePremiumButton");


    if (
        closeButton
    ) {

        closeButton.addEventListener(
            "click",
            () => {

                modal.remove();

            }
        );
    }


    const comingSoonButton =
        $("premiumComingSoonButton");


    if (
        comingSoonButton
    ) {

        comingSoonButton.addEventListener(
            "click",
            () => {

                alert(
                    "Premium is coming soon! 🚀"
                );

            }
        );
    }
}


window.openPremiumOffer =
    openPremiumOffer;


/* =========================================================
   AI PROGRESS ANALYSIS
========================================================= */

async function analyzeProgress() {

    const elements =
        getElements();


    if (
        !elements.analyzeProgressButton
    ) {
        return;
    }


    const progress =
        getProgress();


    elements.analyzeProgressButton.disabled =
        true;


    elements.analyzeProgressButton.textContent =
        "⏳ Analyzing...";


    if (
        elements.aiAdviceText
    ) {

        elements.aiAdviceText.textContent =
            "StudyMind AI is analyzing your progress...";
    }


    try {

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

You are StudyMind AI.

Analyze this student's study progress.

Subjects:
${
    studyPlan.subjects
        .map(
            subject =>
                typeof subject === "string"
                    ? subject
                    : subject.name
        )
        .join(", ")
}

Total topics:
${progress.total}

Completed topics:
${progress.completed}

Progress:
${progress.percent}%

Current topic:
${
    getCurrentTopic()
        ? getCurrentTopic().name
        : "None"
}

Days until exam:
${calculateDaysLeft()}

Daily study hours:
${studyPlan.studyHours}

Give the student a concise and practical study recommendation.

Do not invent information.

                            `

                        })

                }
            );


        if (
            !response.ok
        ) {

            throw new Error(
                "Unable to analyze progress."
            );
        }


        const data =
            await response.json();


        if (
            !data ||
            !data.reply
        ) {

            throw new Error(
                "The AI returned an empty response."
            );
        }


        if (
            elements.aiAdviceText
        ) {

            elements.aiAdviceText.innerHTML =
                renderAIResponse(
                    data.reply
                );
        }


    } catch (error) {

        if (
            elements.aiAdviceText
        ) {

            elements.aiAdviceText.textContent =
                error.message ||
                "Unable to analyze your progress right now.";
        }

    } finally {

        elements.analyzeProgressButton.disabled =
            false;


        elements.analyzeProgressButton.textContent =
            "Analyze My Progress";
    }
}


/* =========================================================
   THEME
========================================================= */

function applyTheme() {

    const savedTheme =
        localStorage.getItem(
            THEME_KEY
        );


    if (
        savedTheme ===
        "light"
    ) {

        document.body.classList.add(
            "light-theme"
        );

        document.documentElement.classList.add(
            "light-theme"
        );

    } else {

        document.body.classList.remove(
            "light-theme"
        );

        document.documentElement.classList.remove(
            "light-theme"
        );
    }
}


function toggleTheme() {

    const isLight =
        document.body.classList.contains(
            "light-theme"
        );


    const newTheme =
        isLight
            ? "dark"
            : "light";


    localStorage.setItem(
        THEME_KEY,
        newTheme
    );


    applyTheme();
}


function setupThemeControls() {

    const buttons = [

        $("themeToggle"),

        $("themeToggleButton"),

        $("toggleTheme")

    ];


    buttons.forEach(
        button => {

            if (!button) {
                return;
            }


            button.addEventListener(
                "click",
                toggleTheme
            );
        }
    );


    applyTheme();
}


/* =========================================================
   AUTHENTICATION
========================================================= */

async function checkAuthentication() {

    try {

        if (
            typeof supabaseClient ===
                "undefined" ||
            !supabaseClient ||
            !supabaseClient.auth
        ) {

            console.warn(
                "StudyMind: supabaseClient is not available."
            );

            return false;
        }


        const {
            data,
            error
        } =
            await supabaseClient.auth.getUser();


        if (
            error ||
            !data ||
            !data.user
        ) {

            currentUser =
                null;

            return false;
        }


        currentUser =
            data.user;


        return true;


    } catch (error) {

        console.error(
            "StudyMind authentication error:",
            error
        );


        currentUser =
            null;


        return false;
    }
}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutStudyMind() {

    try {

        if (
            typeof supabaseClient !==
                "undefined" &&
            supabaseClient &&
            supabaseClient.auth
        ) {

            await supabaseClient.auth.signOut();
        }

    } catch (error) {

        console.warn(
            "Logout error:",
            error
        );
    }


    window.location.href =
        "login.html";
}


window.logoutStudyMind =
    logoutStudyMind;


/* =========================================================
   EVENT BINDING
========================================================= */

function bindEvents() {

    if (
        eventsBound
    ) {
        return;
    }


    eventsBound =
        true;


    const elements =
        getElements();


    /*
     * Calendar
     */

    if (
        elements.previousMonth
    ) {

        elements.previousMonth.addEventListener(
            "click",
            () => {

                calendarDate.setMonth(
                    calendarDate.getMonth() - 1
                );


                renderCalendar();
            }
        );
    }


    if (
        elements.nextMonth
    ) {

        elements.nextMonth.addEventListener(
            "click",
            () => {

                calendarDate.setMonth(
                    calendarDate.getMonth() + 1
                );


                renderCalendar();
            }
        );
    }


    /*
     * THIS IS THE CRITICAL EVENT.
     *
     * Checking the checkbox sends the user
     * to the separate Knowledge Check page.
     */

    if (
        elements.topicCompleteCheckbox
    ) {

        elements.topicCompleteCheckbox.addEventListener(
            "change",
            handleTopicCompletionChange
        );
    }


    /*
     * Timer
     */

    if (
        elements.startTimerButton
    ) {

        elements.startTimerButton.addEventListener(
            "click",
            startTimer
        );
    }


    if (
        elements.pauseTimerButton
    ) {

        elements.pauseTimerButton.addEventListener(
            "click",
            pauseTimer
        );
    }


    if (
        elements.resetTimerButton
    ) {

        elements.resetTimerButton.addEventListener(
            "click",
            resetTimer
        );
    }


    if (
        elements.timerDuration
    ) {

        elements.timerDuration.addEventListener(
            "change",
            handleTimerDurationChange
        );

        elements.timerDuration.addEventListener(
            "input",
            handleTimerDurationChange
        );
    }


    /*
     * AI
     */

    if (
        elements.askAIButton
    ) {

        elements.askAIButton.addEventListener(
            "click",
            askStudyMindAI
        );
    }


    if (
        elements.analyzeProgressButton
    ) {

        elements.analyzeProgressButton.addEventListener(
            "click",
            analyzeProgress
        );
    }


    /*
     * Logout buttons
     */

    [

        "logoutButton",

        "logoutBtn",

        "dashboardLogout",

        "navLogout"

    ].forEach(
        id => {

            const button =
                $(id);

            if (button) {

                button.addEventListener(
                    "click",
                    logoutStudyMind
                );
            }
        }
    );


    /*
     * Navigation
     */

    const homeButtons = [

        "homeButton",

        "backHomeButton",

        "dashboardHome"

    ];


    homeButtons.forEach(
        id => {

            const button =
                $(id);

            if (button) {

                button.addEventListener(
                    "click",
                    () => {

                        window.location.href =
                            "home.html";
                    }
                );
            }
        }
    );
}


/* =========================================================
   INITIALIZATION
========================================================= */

async function initializeDashboard() {

    console.log(
        "StudyMind Dashboard initializing..."
    );


    /*
     * Load state.
     */

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


    currentStreak =
        Number(
            localStorage.getItem(
                STREAK_KEY
            )
        ) || 0;


    selectedTimerSeconds =
        getStoredNumber(
            TIMER_DURATION_KEY,
            DEFAULT_TIMER_SECONDS
        );


    /*
     * Safety: only allow 25 / 45 / 60.
     */

    const selectedMinutes =
        Math.round(
            selectedTimerSeconds /
            60
        );


    if (
        !TIMER_OPTIONS.includes(
            selectedMinutes
        )
    ) {

        selectedTimerSeconds =
            DEFAULT_TIMER_SECONDS;
    }


    timerSeconds =
        getStoredNumber(
            TIMER_SECONDS_KEY,
            selectedTimerSeconds
        );


    loadStudyPlan();


    /*
     * Authentication.
     */

    const authenticated =
        await checkAuthentication();


    if (!authenticated) {

        window.location.href =
            "login.html";

        return;
    }


    /*
     * If there is no real study plan,
     * send the student to the plan generator.
     */

    if (
        !studyPlan ||
        !studyPlan.topics ||
        studyPlan.topics.length === 0
    ) {

        window.location.href =
            "home.html#generator";

        return;
    }


    /*
     * Clamp current topic.
     */

    currentTopicIndex =
        Math.max(
            0,
            Math.min(
                currentTopicIndex,
                studyPlan.topics.length - 1
            )
        );


    localStorage.setItem(
        CURRENT_TOPIC_KEY,
        String(
            currentTopicIndex
        )
    );


    /*
     * Start dashboard.
     */

    ensureTimerStorage();

    bindEvents();

    restoreTimerState();

    setupThemeControls();

    renderGreeting();

    renderEverything();


    console.log(
        "StudyMind Dashboard ready."
    );


    console.log(
        "Current user:",
        currentUser
    );


    console.log(
        "Study plan:",
        studyPlan
    );


    console.log(
        "Current topic:",
        getCurrentTopic()
    );
}


/* =========================================================
   RENDER EVERYTHING
========================================================= */

function renderEverything() {

    updateDashboardStats();

    updateDashboardProgress();

    renderSubjects();

    renderTopics();

    renderCurrentTopic();

    renderCalendar();

    renderSchedule();

    updateNextBooking();

    updateTimerDisplay();

    updateTimerButtons();

    setupAIAuthenticationUI();

    renderGreeting();
}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.openDashboard =
    function () {

        window.location.href =
            "dashboard.html";
    };


window.startTimer =
    startTimer;


window.pauseTimer =
    pauseTimer;


window.resetTimer =
    resetTimer;


window.completeCurrentTopic =
    completeCurrentTopic;


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


window.analyzeProgress =
    analyzeProgress;


/* =========================================================
   START DASHBOARD
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
