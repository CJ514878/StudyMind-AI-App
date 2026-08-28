/* =========================================================
   STUDYMIND AI — DASHBOARD JAVASCRIPT
   COMPLETE CORRECTED VERSION
   ========================================================= */


/* =========================================================
   CONSTANTS
   ========================================================= */

const FREE_QUESTION_LIMIT = 5;
const FREE_SUMMARY_LIMIT = 5;

const DEFAULT_TIMER_SECONDS =
    25 * 60;

const DAY_MS =
    24 * 60 * 60 * 1000;


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let currentUser = null;

let isAuthenticated = false;

let studyPlan = null;

let completedTopics =
    loadArray(
        "studyMindCompletedTopics"
    );

let completedQuestionTopics =
    loadArray(
        "studyMindCompletedQuestionTopics"
    );

let currentTopicIndex =
    Number(
        localStorage.getItem(
            "studyMindCurrentTopicIndex"
        )
    ) || 0;

let currentStreak =
    Number(
        localStorage.getItem(
            "studyMindStreak"
        )
    ) || 0;

let topicQuestions =
    loadObject(
        "studyMindTopicQuestions"
    );

let aiQuestionCount =
    Number(
        localStorage.getItem(
            "aiQuestionCount"
        )
    ) || 0;

let summaryUsageCount =
    Number(
        localStorage.getItem(
            "summaryUsageCount"
        )
    ) || 0;

let calendarDate =
    new Date();

let selectedTimerSeconds =
    getStoredPositiveNumber(
        "studyMindSelectedTimerSeconds",
        DEFAULT_TIMER_SECONDS
    );

let timerSeconds =
    getStoredNumber(
        "studyMindTimerSeconds",
        selectedTimerSeconds
    );

let timerRunning =
    false;

let timerEndTime =
    null;

let timerInterval =
    null;


/* =========================================================
   DOM HELPER
   ========================================================= */

const $ =
    id =>
        document.getElementById(id);


/* =========================================================
   DASHBOARD ELEMENTS
   ========================================================= */

const weeklyHours =
    $("weeklyHours");

const daysLeftElement =
    $("daysLeft");

const dailyGoal =
    $("dailyGoal");

const studyScore =
    $("studyScore");


const subjectList =
    $("subjectList");

const topicList =
    $("topicList");


const progressPercent =
    $("progressPercent");

const progressCount =
    $("progressCount");

const progressBar =
    $("progressBar");


const streak =
    $("streak");


const scoreDisplay =
    $("scoreDisplay");

const scoreProgressBar =
    $("scoreProgressBar");

const scoreMessage =
    $("scoreMessage");


/* =========================================================
   CALENDAR
   ========================================================= */

const calendarDays =
    $("calendarDays");

const calendarMonth =
    $("calendarMonth");

const previousMonth =
    $("previousMonth");

const nextMonth =
    $("nextMonth");


const nextBooking =
    $("nextBooking");

const nextBookingTime =
    $("nextBookingTime");

const scheduleList =
    $("scheduleList");


/* =========================================================
   CURRENT TOPIC
   ========================================================= */

const currentTopicName =
    $("currentTopicName");

const currentTopicDescription =
    $("currentTopicDescription");

const topicPosition =
    $("topicPosition");

const topicStatusBadge =
    $("topicStatusBadge");

const topicCompleteCheckbox =
    $("topicCompleteCheckbox");

const topicCompletionMessage =
    $("topicCompletionMessage");

const nextTopicMessage =
    $("nextTopicMessage");


/* =========================================================
   TOPIC QUESTIONS
   ========================================================= */

const topicQuestionsSection =
    $("topicQuestionsSection") ||
    $("topicQuestions");

const topicQuestionsContainer =
    $("topicQuestionsContainer") ||
    $("topicQuestions");

const submitTopicQuestions =
    $("submitTopicQuestions");

const topicQuestionResult =
    $("topicQuestionResult");


/* =========================================================
   TIMER
   ========================================================= */

const studyTimer =
    $("studyTimer");

const startTimerButton =
    $("startTimerButton");

const pauseTimerButton =
    $("pauseTimerButton");

const resetTimerButton =
    $("resetTimerButton");

const timerDurationSelect =
    $("timerDuration") ||
    $("studyTimerDuration") ||
    $("timerMinutes") ||
    $("studyTime");


/* =========================================================
   AI ANALYSIS
   ========================================================= */

const analyzeProgressButton =
    $("analyzeProgressButton");

const aiAdviceText =
    $("aiAdviceText");


/* =========================================================
   ASK AI
   ========================================================= */

const aiQuestion =
    $("aiQuestion");

const askAIButton =
    $("askAIButton");

const aiResponse =
    $("aiResponse");

const aiCountBadge =
    $("aiCountBadge");


/* =========================================================
   DOCUMENT SUMMARIZER
   ========================================================= */

const summarizeInput =
    $("summarizeInput");

const summarizeBtn =
    $("summarizeBtn");

const summaryOutput =
    $("summaryOutput");

const summaryCountBadge =
    $("summaryCountBadge");


/* =========================================================
   STORAGE HELPERS
   ========================================================= */

function loadArray(key) {

    try {

        const value =
            JSON.parse(
                localStorage.getItem(
                    key
                )
            );

        return Array.isArray(value)
            ? value
            : [];

    } catch {

        return [];

    }

}


function loadObject(key) {

    try {

        const value =
            JSON.parse(
                localStorage.getItem(
                    key
                )
            );

        return (
            value &&
            typeof value === "object"
        )
            ? value
            : null;

    } catch {

        return null;

    }

}


function getStoredNumber(
    key,
    fallback
) {

    const value =
        Number(
            localStorage.getItem(
                key
            )
        );

    return (
        Number.isFinite(value) &&
        value >= 0
    )
        ? value
        : fallback;

}


function getStoredPositiveNumber(
    key,
    fallback
) {

    const value =
        Number(
            localStorage.getItem(
                key
            )
        );

    return (
        Number.isFinite(value) &&
        value > 0
    )
        ? value
        : fallback;

}


function savePlan() {

    if (!studyPlan) {
        return;
    }

    localStorage.setItem(
        "studyMindPlan",
        JSON.stringify(
            studyPlan
        )
    );

}


/* =========================================================
   DATE HELPERS
   ========================================================= */

function startOfDay(
    date
) {

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


function formatDateKey(
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

    return (
        `${year}-${month}-${day}`
    );

}


function todayKey() {

    return formatDateKey(
        new Date()
    );

}


/* =========================================================
   TOPIC NAME HELPER
   IMPORTANT FIX
   ========================================================= */

function getTopicName(
    topic
) {

    /*
       Topics can come from the home page
       in several formats.

       Supported:

       "Algebra"

       {
           name: "Algebra"
       }

       {
           topic: "Algebra"
       }

       {
           title: "Algebra"
       }

       {
           topicName: "Algebra"
       }
    */

    if (
        typeof topic ===
        "string"
    ) {

        return topic.trim();

    }


    if (
        topic &&
        typeof topic ===
        "object"
    ) {

        const possibleName =
            topic.name ??
            topic.topic ??
            topic.title ??
            topic.topicName ??
            topic.topic_title ??
            topic.label;


        if (
            possibleName !==
            undefined &&
            possibleName !==
            null
        ) {

            const name =
                String(
                    possibleName
                ).trim();

            if (name) {
                return name;
            }

        }

    }


    return "Untitled Topic";

}


/* =========================================================
   TOPIC ID
   ========================================================= */

function getTopicId(
    topic,
    index = 0
) {

    if (
        topic &&
        typeof topic ===
        "object"
    ) {

        if (
            topic.id !==
            undefined &&
            topic.id !==
            null
        ) {

            return String(
                topic.id
            );

        }

    }


    const name =
        getTopicName(
            topic
        );


    /*
       Use the topic name as the primary
       identifier so old saved progress
       remains compatible.
    */

    if (
        name &&
        name !==
        "Untitled Topic"
    ) {

        return name;

    }


    return `topic-${index + 1}`;

}


/* =========================================================
   NORMALIZE TOPIC
   IMPORTANT FIX
   ========================================================= */

function normalizeTopic(
    topic,
    index
) {

    /*
       String topic from home.html
    */

    if (
        typeof topic ===
        "string"
    ) {

        const name =
            topic.trim();

        return {

            id:
                index + 1,

            name:
                name,

            topic:
                name,

            title:
                name,

            subject:
                "",

            description:
                "",

            status:
                "Not Started"

        };

    }


    /*
       Object topic
    */

    if (
        topic &&
        typeof topic ===
        "object"
    ) {

        const name =
            getTopicName(
                topic
            );


        return {

            ...topic,

            id:
                topic.id ??
                index + 1,

            name:
                name,

            topic:
                topic.topic ??
                name,

            title:
                topic.title ??
                name,

            subject:
                String(
                    topic.subject ??
                    ""
                ),

            description:
                String(
                    topic.description ??
                    topic.details ??
                    ""
                ),

            status:
                String(
                    topic.status ??
                    "Not Started"
                )

        };

    }


    return {

        id:
            index + 1,

        name:
            "Untitled Topic",

        topic:
            "Untitled Topic",

        title:
            "Untitled Topic",

        subject:
            "",

        description:
            "",

        status:
            "Not Started"

    };

}


/* =========================================================
   NORMALIZE STUDY PLAN
   ========================================================= */

function normalizeStudyPlan(
    rawPlan
) {

    if (
        !rawPlan ||
        typeof rawPlan !==
        "object"
    ) {

        return null;

    }


    /* -------------------------
       SUBJECTS
    ------------------------- */

    let subjects = [];


    if (
        Array.isArray(
            rawPlan.subjects
        )
    ) {

        subjects =
            rawPlan.subjects
                .map(
                    subject =>
                        String(
                            subject
                        ).trim()
                )
                .filter(Boolean);

    } else if (
        typeof rawPlan.subjects ===
        "string"
    ) {

        subjects =
            rawPlan.subjects
                .split(
                    /[,\n;]+/
                )
                .map(
                    subject =>
                        subject.trim()
                )
                .filter(Boolean);

    }


    /* -------------------------
       TOPICS
    ------------------------- */

    let rawTopics = [];


    if (
        Array.isArray(
            rawPlan.topics
        )
    ) {

        rawTopics =
            rawPlan.topics;

    } else if (
        typeof rawPlan.topics ===
        "string"
    ) {

        rawTopics =
            rawPlan.topics
                .split(
                    /[\n,]+/
                )
                .map(
                    topic =>
                        topic.trim()
                )
                .filter(Boolean);

    }


    /*
       THIS IS THE IMPORTANT PART.

       Convert every topic into a consistent
       object while preserving the student's
       actual topic text.
    */

    const topics =
        rawTopics
            .map(
                (
                    topic,
                    index
                ) =>
                    normalizeTopic(
                        topic,
                        index
                    )
            )
            .filter(Boolean);


    /* -------------------------
       STUDY HOURS
    ------------------------- */

    const rawHours =
        rawPlan.studyHours ??
        rawPlan.hoursPerDay ??
        rawPlan.hours ??
        0;


    const parsedHours =
        Number(
            rawHours
        );


    /* -------------------------
       FINAL PLAN
    ------------------------- */

    return {

        ...rawPlan,

        examType:
            rawPlan.examType ??
            rawPlan.exam ??
            rawPlan.testType ??
            "",

        examDate:
            rawPlan.examDate ??
            null,

        subjects:
            subjects,

        topics:
            topics,

        studyHours:
            Number.isFinite(
                parsedHours
            )
                ? parsedHours
                : 0,

        hoursPerDay:
            Number.isFinite(
                parsedHours
            )
                ? parsedHours
                : 0,

        difficulty:
            rawPlan.difficulty ??
            "balanced",

        daysLeft:
            Number(
                rawPlan.daysLeft
            ) || 0,

        studyStartDate:
            rawPlan.studyStartDate ??
            rawPlan.startDate ??
            todayKey(),

        createdAt:
            rawPlan.createdAt ??
            new Date().toISOString()

    };

}


/* =========================================================
   USABLE STUDY PLAN
   ========================================================= */

function hasUsableStudyPlan(
    plan
) {

    if (
        !plan ||
        typeof plan !==
        "object"
    ) {

        return false;

    }


    const subjects =
        Array.isArray(
            plan.subjects
        )
            ? plan.subjects
            : [];


    const topics =
        Array.isArray(
            plan.topics
        )
            ? plan.topics
            : [];


    const hours =
        Number(
            plan.studyHours ??
            plan.hoursPerDay
        );


    return (
        subjects.length > 0 &&
        topics.length > 0 &&
        !!plan.examDate &&
        Number.isFinite(hours) &&
        hours > 0
    );

}


/* =========================================================
   LOAD STUDY PLAN
   ========================================================= */

function loadStudyPlan() {

    let savedPlan = null;


    /*
       First try studyMindPlan.
    */

    try {

        savedPlan =
            JSON.parse(
                localStorage.getItem(
                    "studyMindPlan"
                )
            );

    } catch {

        savedPlan =
            null;

    }


    /*
       Also support the older studyData
       key if it exists.
    */

    let oldStudyData = null;


    try {

        oldStudyData =
            JSON.parse(
                localStorage.getItem(
                    "studyData"
                )
            );

    } catch {

        oldStudyData =
            null;

    }


    const normalizedPlan =
        normalizeStudyPlan(
            savedPlan
        );


    const normalizedOldPlan =
        normalizeStudyPlan(
            oldStudyData
        );


    if (
        hasUsableStudyPlan(
            normalizedPlan
        )
    ) {

        studyPlan =
            normalizedPlan;

    } else if (
        hasUsableStudyPlan(
            normalizedOldPlan
        )
    ) {

        studyPlan =
            normalizedOldPlan;

    } else {

        studyPlan =
            normalizedPlan ||
            normalizedOldPlan ||
            {

                examType:
                    "",

                examDate:
                    null,

                subjects:
                    [],

                topics:
                    [],

                studyHours:
                    0,

                hoursPerDay:
                    0,

                difficulty:
                    "balanced",

                daysLeft:
                    0,

                studyStartDate:
                    todayKey(),

                createdAt:
                    new Date().toISOString()

            };

    }


    /*
       Make absolutely sure the arrays
       exist.
    */

    if (
        !Array.isArray(
            studyPlan.subjects
        )
    ) {

        studyPlan.subjects =
            [];

    }


    if (
        !Array.isArray(
            studyPlan.topics
        )
    ) {

        studyPlan.topics =
            [];

    }


    /*
       Normalize topics AGAIN after choosing
       the final plan.
    */

    studyPlan.topics =
        studyPlan.topics
            .map(
                (
                    topic,
                    index
                ) =>
                    normalizeTopic(
                        topic,
                        index
                    )
            );


    /*
       Keep studyHours and hoursPerDay
       synchronized.
    */

    if (
        !(
            Number(
                studyPlan.studyHours
            ) > 0
        ) &&
        Number(
            studyPlan.hoursPerDay
        ) > 0
    ) {

        studyPlan.studyHours =
            Number(
                studyPlan.hoursPerDay
            );

    }


    if (
        !(
            Number(
                studyPlan.hoursPerDay
            ) > 0
        ) &&
        Number(
            studyPlan.studyHours
        ) > 0
    ) {

        studyPlan.hoursPerDay =
            Number(
                studyPlan.studyHours
            );

    }


    if (
        !studyPlan.studyStartDate
    ) {

        studyPlan.studyStartDate =
            todayKey();

    }


    /*
       Clamp current topic index.
    */

    if (
        studyPlan.topics.length ===
        0
    ) {

        currentTopicIndex =
            0;

    } else {

        currentTopicIndex =
            Math.max(
                0,
                Math.min(
                    currentTopicIndex,
                    studyPlan.topics.length - 1
                )
            );

    }


    /*
       Save the normalized version.

       This means the dashboard will no longer
       lose the student's topic names.
    */

    savePlan();

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

            return false;

        }


        const {
            data: {
                user
            },
            error
        } =
            await supabaseClient
                .auth
                .getUser();


        if (
            error ||
            !user
        ) {

            currentUser =
                null;

            isAuthenticated =
                false;

            return false;

        }


        currentUser =
            user;

        isAuthenticated =
            true;


        return true;

    } catch (error) {

        console.error(
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
   START DASHBOARD
   ========================================================= */

async function startDashboard() {

    /*
       Load the student's plan FIRST.
    */

    loadStudyPlan();


    /*
       Then check authentication.
    */

    const authenticated =
        await checkAuthentication();


    if (!authenticated) {

        window.location.href =
            "login.html";

        return;

    }


    /*
       If there is no study plan,
       return to the generator.
    */

    if (
        !hasUsableStudyPlan(
            studyPlan
        )
    ) {

        window.location.href =
            "home.html#generator";

        return;

    }


    ensureTimerStorage();

    bindEvents();

    restoreTimerState();

    renderEverything();

}


/* =========================================================
   TIMER STORAGE
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


    localStorage.setItem(
        "studyMindSelectedTimerSeconds",
        String(
            selectedTimerSeconds
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


    localStorage.setItem(
        "studyMindTimerSeconds",
        String(
            timerSeconds
        )
    );

}


/* =========================================================
   RESTORE TIMER
   ========================================================= */

function restoreTimerState() {

    const savedRunning =
        localStorage.getItem(
            "studyMindTimerRunning"
        ) === "true";


    const savedEndTime =
        Number(
            localStorage.getItem(
                "studyMindTimerEndTime"
            )
        );


    if (
        savedRunning &&
        Number.isFinite(
            savedEndTime
        ) &&
        savedEndTime >
            Date.now()
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
                        timerEndTime -
                        Date.now()
                    ) / 1000
                )
            );


        startTimerInterval();

        return;

    }


    if (
        savedRunning &&
        Number.isFinite(
            savedEndTime
        )
    ) {

        finishTimer(
            false
        );

        return;

    }


    timerRunning =
        false;

    timerEndTime =
        null;


    timerSeconds =
        getStoredNumber(
            "studyMindTimerSeconds",
            selectedTimerSeconds
        );

}


/* =========================================================
   BIND EVENTS
   ========================================================= */

function bindEvents() {

    if (previousMonth) {

        previousMonth.addEventListener(
            "click",
            () => {

                calendarDate.setMonth(
                    calendarDate.getMonth() - 1
                );

                renderCalendar();

            }
        );

    }


    if (nextMonth) {

        nextMonth.addEventListener(
            "click",
            () => {

                calendarDate.setMonth(
                    calendarDate.getMonth() + 1
                );

                renderCalendar();

            }
        );

    }


    if (topicCompleteCheckbox) {

        topicCompleteCheckbox.addEventListener(
            "change",
            completeCurrentTopic
        );

    }


    if (startTimerButton) {

        startTimerButton.addEventListener(
            "click",
            startTimer
        );

    }


    if (pauseTimerButton) {

        pauseTimerButton.addEventListener(
            "click",
            pauseTimer
        );

    }


    if (resetTimerButton) {

        resetTimerButton.addEventListener(
            "click",
            resetTimer
        );

    }


    if (timerDurationSelect) {

        timerDurationSelect.addEventListener(
            "change",
            handleTimerDurationChange
        );

        timerDurationSelect.addEventListener(
            "input",
            handleTimerDurationChange
        );

    }


    if (analyzeProgressButton) {

        analyzeProgressButton.addEventListener(
            "click",
            analyzeProgress
        );

    }


    if (askAIButton) {

        askAIButton.addEventListener(
            "click",
            askStudyMindAI
        );

    }


    if (submitTopicQuestions) {

        submitTopicQuestions.addEventListener(
            "click",
            submitQuestions
        );

    }


    if (summarizeBtn) {

        summarizeBtn.addEventListener(
            "click",
            summarizeDocument
        );

    }


    syncTimerDurationControl();

}


/* =========================================================
   RENDER EVERYTHING
   ========================================================= */

function renderEverything() {

    renderMetrics();

    renderSubjects();

    renderTopics();

    renderCurrentTopic();

    renderCalendar();

    renderSchedule();

    updateNextBooking();

    updateTimerDisplay();

    updateTimerButtons();

    setupAIAuthenticationUI();

    updateSummaryBadge();

    restoreTopicQuestions();

}


/* =========================================================
   METRICS
   ========================================================= */

function renderMetrics() {

    const hours =
        Number(
            studyPlan.studyHours
        ) || 0;


    if (weeklyHours) {

        weeklyHours.textContent =
            `${Math.round(
                hours * 7
            )} hrs`;

    }


    if (daysLeftElement) {

        daysLeftElement.textContent =
            calculateDaysLeft();

    }


    if (dailyGoal) {

        dailyGoal.textContent =
            `${hours} hrs/day`;

    }


    if (streak) {

        streak.textContent =
            `${currentStreak} Days 🔥`;

    }


    updateDashboardProgress();

}


/* =========================================================
   CALCULATE DAYS LEFT
   ========================================================= */

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
                `${studyPlan.examDate}T00:00:00`
            )
        );


    if (
        Number.isNaN(
            exam.getTime()
        )
    ) {

        return 0;

    }


    return Math.max(
        0,
        Math.ceil(
            (
                exam.getTime() -
                today.getTime()
            ) /
            DAY_MS
        )
    );

}


/* =========================================================
   SUBJECTS
   ========================================================= */

function renderSubjects() {

    if (!subjectList) {
        return;
    }


    const subjects =
        studyPlan.subjects || [];


    if (!subjects.length) {

        subjectList.innerHTML =
            `
                <div class="empty-state">
                    No subjects in your study plan.
                </div>
            `;

        return;

    }


    subjectList.innerHTML =
        subjects
            .map(
                (
                    subject,
                    index
                ) =>
                    `
                        <div class="subject-item">

                            <span class="subject-number">
                                ${index + 1}
                            </span>

                            <strong>
                                ${escapeHTML(
                                    subject
                                )}
                            </strong>

                        </div>
                    `
            )
            .join("");

}


/* =========================================================
   TOPICS
   ========================================================= */

function renderTopics() {

    if (!topicList) {
        return;
    }


    const topics =
        studyPlan.topics || [];


    if (!topics.length) {

        topicList.innerHTML =
            `
                <div class="empty-state">
                    No topics in your study plan.
                </div>
            `;

        return;

    }


    topicList.innerHTML =
        topics
            .map(
                (
                    topic,
                    index
                ) => {

                    const topicName =
                        getTopicName(
                            topic
                        );


                    const topicId =
                        getTopicId(
                            topic,
                            index
                        );


                    const completed =
                        completedTopics.includes(
                            topicId
                        ) ||
                        completedTopics.includes(
                            topicName
                        );


                    return `
                        <div
                            class="
                                topic-card
                                ${
                                    index ===
                                    currentTopicIndex
                                        ? "active"
                                        : ""
                                }
                                ${
                                    completed
                                        ? "completed"
                                        : ""
                                }
                            "
                            data-topic-index="${index}"
                        >

                            <strong>
                                ${escapeHTML(
                                    topicName
                                )}
                            </strong>

                            <small>
                                ${
                                    escapeHTML(
                                        topic.subject ||
                                        "General"
                                    )
                                }
                            </small>

                            <p>
                                ${
                                    escapeHTML(
                                        topic.description ||
                                        "Study this topic and complete the knowledge check."
                                    )
                                }
                            </p>

                            <span>
                                ${
                                    completed
                                        ? "Completed ✓"
                                        : (
                                            topic.status ||
                                            "Not Started"
                                        )
                                }
                            </span>

                        </div>
                    `;

                }
            )
            .join("");


    document
        .querySelectorAll(
            ".topic-card[data-topic-index]"
        )
        .forEach(
            card => {

                card.addEventListener(
                    "click",
                    () => {

                        const index =
                            Number(
                                card.dataset
                                    .topicIndex
                            );


                        if (
                            !Number.isFinite(
                                index
                            )
                        ) {

                            return;

                        }


                        currentTopicIndex =
                            index;


                        localStorage.setItem(
                            "studyMindCurrentTopicIndex",
                            String(
                                currentTopicIndex
                            )
                        );


                        renderTopics();

                        renderCurrentTopic();

                    }
                );

            }
        );

}


/* =========================================================
   CURRENT TOPIC
   ========================================================= */

function renderCurrentTopic() {

    const topics =
        studyPlan.topics || [];


    const total =
        topics.length;


    if (
        total === 0
    ) {

        if (currentTopicName) {

            currentTopicName.textContent =
                "No topic available";

        }


        if (currentTopicDescription) {

            currentTopicDescription.textContent =
                "Create a study plan with topics to begin.";

        }


        if (topicStatusBadge) {

            topicStatusBadge.textContent =
                "NO TOPIC";

        }


        if (topicPosition) {

            topicPosition.textContent =
                "TOPIC 0 OF 0";

        }


        if (topicCompleteCheckbox) {

            topicCompleteCheckbox.checked =
                false;

            topicCompleteCheckbox.disabled =
                true;

        }


        return;

    }


    /*
       Make sure the index always points
       to an actual topic.
    */

    currentTopicIndex =
        Math.max(
            0,
            Math.min(
                currentTopicIndex,
                total - 1
            )
        );


    localStorage.setItem(
        "studyMindCurrentTopicIndex",
        String(
            currentTopicIndex
        )
    );


    const topic =
        topics[
            currentTopicIndex
        ];


    /*
       IMPORTANT:
       Never directly use topic.name here.

       getTopicName() handles strings,
       objects, old formats and new formats.
    */

    const topicName =
        getTopicName(
            topic
        );


    const topicId =
        getTopicId(
            topic,
            currentTopicIndex
        );


    const completed =
        completedTopics.includes(
            topicId
        ) ||
        completedTopics.includes(
            topicName
        );


    if (currentTopicName) {

        currentTopicName.textContent =
            topicName;

    }


    if (currentTopicDescription) {

        currentTopicDescription.textContent =
            topic.description ||
            "Study this topic and complete the knowledge check.";

    }


    if (topicStatusBadge) {

        topicStatusBadge.textContent =
            completed
                ? "COMPLETED"
                : (
                    topic.status ||
                    "IN PROGRESS"
                ).toUpperCase();


        topicStatusBadge.classList.toggle(
            "completed",
            completed
        );

    }


    if (topicPosition) {

        topicPosition.textContent =
            `TOPIC ${
                currentTopicIndex + 1
            } OF ${total}`;

    }


    if (topicCompleteCheckbox) {

        topicCompleteCheckbox.disabled =
            false;

        topicCompleteCheckbox.checked =
            completed;

    }


    if (topicCompletionMessage) {

        topicCompletionMessage.textContent =
            completed
                ? "Topic completed. Great work!"
                : "Tick this box when you are done studying this topic.";

    }


    if (nextTopicMessage) {

        if (
            currentTopicIndex <
            total - 1
        ) {

            const nextTopic =
                getTopicName(
                    topics[
                        currentTopicIndex + 1
                    ]
                );


            nextTopicMessage.innerHTML =
                `
                    <strong>
                        Next:
                    </strong>

                    ${escapeHTML(
                        nextTopic
                    )}
                `;

        } else {

            nextTopicMessage.textContent =
                completed
                    ? "You've completed all available topics!"
                    : "You've reached the final topic.";

        }

    }

}
