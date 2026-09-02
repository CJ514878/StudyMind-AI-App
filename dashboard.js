/* =========================================================
   STUDYMIND AI — DASHBOARD.JS
   COMPLETE REPLACEMENT
   =========================================================

   FEATURES:
   - Loads the student's real study plan
   - Supports studyMindPlan and older studyData
   - Correct topic names
   - Subjects
   - Topic progress
   - Current study session
   - Topic completion
   - Study streak
   - 25/45/60 minute timer
   - Calendar
   - 6 study days + 1 break day
   - Exam day
   - Study schedule
   - AI progress analysis
   - Ask StudyMind AI
   - Document summarizer
   - 5 free AI questions
   - 5 free document summaries
   - Topic knowledge checks
   - Premium limit message
   ========================================================= */


/* =========================================================
   SETTINGS
   ========================================================= */

const FREE_QUESTION_LIMIT = 5;
const FREE_SUMMARY_LIMIT = 5;

const DEFAULT_TIMER_SECONDS = 25 * 60;

const DAY_MS =
    24 * 60 * 60 * 1000;


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let currentUser = null;
let isAuthenticated = false;

let studyPlan = null;

let completedTopics =
    loadArray("studyMindCompletedTopics");

let completedQuestionTopics =
    loadArray("studyMindCompletedQuestionTopics");

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

let calendarDate =
    new Date();


/* =========================================================
   AI USAGE
   ========================================================= */

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


/* =========================================================
   TIMER STATE
   ========================================================= */

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

let timerRunning = false;
let timerEndTime = null;
let timerInterval = null;


/* =========================================================
   DOM HELPER
   ========================================================= */

const $ = id =>
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


/* =========================================================
   SUBJECTS / TOPICS
   ========================================================= */

const subjectList =
    $("subjectList");

const topicList =
    $("topicList");


/* =========================================================
   PROGRESS
   ========================================================= */

const progressPercent =
    $("progressPercent");

const progressCount =
    $("progressCount");

const progressBar =
    $("progressBar");


/* =========================================================
   STREAK
   ========================================================= */

const streak =
    $("streak");


/* =========================================================
   SCORE
   ========================================================= */

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


/* =========================================================
   NEXT BOOKING
   ========================================================= */

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
   TIMER ELEMENTS
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
   AI PROGRESS ANALYSIS
   ========================================================= */

const analyzeProgressButton =
    $("analyzeProgressButton");

const aiAdviceText =
    $("aiAdviceText");


/* =========================================================
   ASK AI
   ========================================================= */

const askAIButton =
    $("askAIButton");

const aiQuestion =
    $("aiQuestion");

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
                localStorage.getItem(key)
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
                localStorage.getItem(key)
            );

        return value &&
            typeof value === "object"
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
            localStorage.getItem(key)
        );

    return Number.isFinite(value) &&
        value >= 0
        ? value
        : fallback;
}


function getStoredPositiveNumber(
    key,
    fallback
) {

    const value =
        Number(
            localStorage.getItem(key)
        );

    return Number.isFinite(value) &&
        value > 0
        ? value
        : fallback;
}


function savePlan() {

    if (!studyPlan) {
        return;
    }

    localStorage.setItem(
        "studyMindPlan",
        JSON.stringify(studyPlan)
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


/* =========================================================
   TOPIC HELPERS
   ========================================================= */

function getTopicName(topic) {

    if (
        typeof topic === "string"
    ) {

        return topic.trim();

    }

    if (
        topic &&
        typeof topic === "object"
    ) {

        const name =
            topic.name ||
            topic.topic ||
            topic.topicName ||
            topic.title ||
            topic.subjectTopic ||
            topic.label;

        if (
            name !== undefined &&
            name !== null &&
            String(name).trim()
        ) {

            return String(name).trim();

        }

    }

    return "";
}


function getTopicId(
    topic,
    index
) {

    if (
        topic &&
        typeof topic === "object"
    ) {

        if (
            topic.id !== undefined &&
            topic.id !== null
        ) {

            return String(topic.id);

        }

        if (
            topic.topicId !== undefined &&
            topic.topicId !== null
        ) {

            return String(topic.topicId);

        }

    }

    const name =
        getTopicName(topic);

    if (name) {
        return name;
    }

    return `topic-${index + 1}`;
}


/* =========================================================
   NORMALIZE TOPICS
   ========================================================= */

function normalizeTopics(
    rawTopics,
    subjects = []
) {

    let topicListData = [];


    /*
       ARRAY
    */

    if (
        Array.isArray(rawTopics)
    ) {

        topicListData =
            rawTopics;

    }


    /*
       STRING
    */

    else if (
        typeof rawTopics === "string"
    ) {

        topicListData =
            rawTopics
                .split(/[\n,]/)
                .map(
                    topic =>
                        topic.trim()
                )
                .filter(Boolean);

    }


    /*
       NORMALIZE
    */

    return topicListData
        .map(
            (topic, index) => {

                /*
                   STRING TOPIC
                */

                if (
                    typeof topic ===
                    "string"
                ) {

                    const name =
                        topic.trim();

                    if (!name) {
                        return null;
                    }

                    return {

                        id:
                            index + 1,

                        name,

                        title:
                            name,

                        topic:
                            name,

                        subject:
                            subjects[index] ||
                            "",

                        description:
                            `Study ${name} and complete the knowledge check.`,

                        status:
                            "Not Started"

                    };

                }


                /*
                   OBJECT TOPIC
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

                    /*
                       IMPORTANT:
                       Never turn a real topic
                       into "Untitled Topic".
                    */

                    if (!name) {
                        return null;
                    }

                    const subject =
                        topic.subject ||
                        topic.subjectName ||
                        topic.course ||
                        subjects[index] ||
                        "";

                    const description =
                        topic.description ||
                        topic.details ||
                        topic.explanation ||
                        `Study ${name} and complete the knowledge check.`;

                    const status =
                        topic.status ||
                        "Not Started";

                    return {

                        ...topic,

                        id:
                            topic.id ??
                            topic.topicId ??
                            index + 1,

                        name,

                        title:
                            topic.title ||
                            name,

                        topic:
                            topic.topic ||
                            name,

                        subject:
                            String(
                                subject
                            ).trim(),

                        description:
                            String(
                                description
                            ).trim(),

                        status:
                            String(
                                status
                            ).trim()

                    };

                }


                return null;

            }
        )
        .filter(Boolean);
}


/* =========================================================
   NORMALIZE SUBJECTS
   ========================================================= */

function normalizeSubjects(
    rawSubjects
) {

    if (
        Array.isArray(
            rawSubjects
        )
    ) {

        return rawSubjects
            .map(subject => {

                if (
                    subject &&
                    typeof subject ===
                    "object"
                ) {

                    return String(
                        subject.name ||
                        subject.subject ||
                        subject.title ||
                        ""
                    ).trim();

                }

                return String(
                    subject
                ).trim();

            })
            .filter(Boolean);

    }


    if (
        typeof rawSubjects ===
        "string"
    ) {

        return rawSubjects
            .split(/[,\n;]/)
            .map(
                subject =>
                    subject.trim()
            )
            .filter(Boolean);

    }


    return [];
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


    const subjects =
        normalizeSubjects(
            rawPlan.subjects
        );


    const topics =
        normalizeTopics(
            rawPlan.topics,
            subjects
        );


    const rawHours =
        rawPlan.studyHours ??
        rawPlan.hoursPerDay ??
        rawPlan.hours ??
        0;


    const parsedHours =
        Number(rawHours);


    return {

        ...rawPlan,

        examType:
            rawPlan.examType ||
            rawPlan.exam ||
            rawPlan.testType ||
            "",

        examDate:
            rawPlan.examDate ||
            rawPlan.testDate ||
            null,

        subjects,

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
            rawPlan.difficulty ||
            "balanced",

        daysLeft:
            Number(
                rawPlan.daysLeft
            ) || 0,

        studyStartDate:
            rawPlan.studyStartDate ||
            rawPlan.startDate ||
            rawPlan.createdDate ||
            todayKey(),

        createdAt:
            rawPlan.createdAt ||
            new Date().toISOString()

    };
}


/* =========================================================
   STUDY PLAN VALIDATION
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
        Number.isFinite(hours) &&
        hours > 0
    );
}


/* =========================================================
   LOAD STUDY PLAN
   =========================================================

   Supports:
   - studyMindPlan
   - studyData

   This is important because older versions
   of the Home generator used studyData.
   ========================================================= */

function loadStudyPlan() {

    const savedMindPlan =
        loadObject(
            "studyMindPlan"
        );

    const savedStudyData =
        loadObject(
            "studyData"
        );


    const normalizedMindPlan =
        normalizeStudyPlan(
            savedMindPlan
        );


    const normalizedStudyData =
        normalizeStudyPlan(
            savedStudyData
        );


    /*
       Prefer studyMindPlan when it
       contains the student's actual data.
    */

    if (
        hasUsableStudyPlan(
            normalizedMindPlan
        )
    ) {

        studyPlan =
            normalizedMindPlan;

    }

    /*
       Otherwise use studyData.
    */

    else if (
        hasUsableStudyPlan(
            normalizedStudyData
        )
    ) {

        studyPlan =
            normalizedStudyData;

    }

    /*
       Otherwise use whichever exists.
    */

    else {

        studyPlan =
            normalizedMindPlan ||
            normalizedStudyData ||
            {

                examType: "",

                examDate: null,

                subjects: [],

                topics: [],

                studyHours: 0,

                hoursPerDay: 0,

                difficulty:
                    "balanced",

                daysLeft: 0,

                studyStartDate:
                    todayKey(),

                createdAt:
                    new Date().toISOString()

            };

    }


    /*
       Make absolutely sure
       topics are normalized.
    */

    studyPlan.subjects =
        normalizeSubjects(
            studyPlan.subjects
        );

    studyPlan.topics =
        normalizeTopics(
            studyPlan.topics,
            studyPlan.subjects
        );


    if (
        !studyPlan.studyStartDate
    ) {

        studyPlan.studyStartDate =
            todayKey();

    }


    if (
        !Number(
            studyPlan.studyHours
        ) &&
        Number(
            studyPlan.hoursPerDay
        )
    ) {

        studyPlan.studyHours =
            Number(
                studyPlan.hoursPerDay
            );

    }


    if (
        !Number(
            studyPlan.hoursPerDay
        ) &&
        Number(
            studyPlan.studyHours
        )
    ) {

        studyPlan.hoursPerDay =
            Number(
                studyPlan.studyHours
            );

    }


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

            data: { user },

            error

        } =
            await supabaseClient
                .auth
                .getUser();


        if (
            error ||
            !user
        ) {

            currentUser = null;
            isAuthenticated = false;

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

        currentUser = null;
        isAuthenticated = false;

        return false;

    }

}


/* =========================================================
   INITIALIZATION
   ========================================================= */

async function startDashboard() {

    loadStudyPlan();


    const authenticated =
        await checkAuthentication();


    if (!authenticated) {

        window.location.href =
            "login.html";

        return;

    }


    /*
       If no real plan exists,
       send the student back to Home.
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


    /*
       Correct invalid topic index.
    */

    if (
        currentTopicIndex < 0 ||
        currentTopicIndex >=
        studyPlan.topics.length
    ) {

        currentTopicIndex = 0;

        localStorage.setItem(
            "studyMindCurrentTopicIndex",
            "0"
        );

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
        "studyMindSelectedTimerSeconds",
        String(
            selectedTimerSeconds
        )
    );


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

        finishTimer(false);

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
   EVENT BINDING
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


    if (aiQuestion) {

        aiQuestion.addEventListener(
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


    if (summarizeBtn) {

        summarizeBtn.addEventListener(
            "click",
            summarizeDocument
        );

    }


    if (submitTopicQuestions) {

        submitTopicQuestions.addEventListener(
            "click",
            submitQuestions
        );

    }


    syncTimerDurationControl();

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

    updateSummaryBadge();

    restoreTopicQuestions();

}


/* =========================================================
   BASIC STATS
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
                studyPlan.examDate
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
            ) / DAY_MS
        )
    );

}


/* =========================================================
   DASHBOARD STATS
   ========================================================= */

function updateDashboardStats() {

    const hours =
        Number(
            studyPlan.studyHours
        ) || 0;


    const remaining =
        calculateDaysLeft();


    if (weeklyHours) {

        weeklyHours.textContent =
            `${Math.round(
                hours * 7
            )} hrs`;

    }


    if (daysLeftElement) {

        daysLeftElement.textContent =
            remaining;

    }


    if (dailyGoal) {

        dailyGoal.textContent =
            `${hours} hrs/day`;

    }


    if (streak) {

        streak.textContent =
            `${currentStreak} Days 🔥`;

    }

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
                ) => {

                    return `
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
                    `;

                }
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

                    const name =
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
                            name
                        );


                    return `
                        <div
                            class="topic-item ${
                                completed
                                    ? "completed"
                                    : ""
                            }"
                            data-topic-index="${index}"
                        >

                            <span class="topic-number">
                                ${index + 1}
                            </span>

                            <span class="topic-name">
                                ${escapeHTML(
                                    name
                                )}
                            </span>

                            <span class="topic-state">
                                ${
                                    completed
                                        ? "✓ Completed"
                                        : "In Progress"
                                }
                            </span>

                        </div>
                    `;

                }
            )
            .join("");


    document
        .querySelectorAll(
            ".topic-item[data-topic-index]"
        )
        .forEach(
            item => {

                item.addEventListener(
                    "click",
                    () => {

                        const index =
                            Number(
                                item.dataset.topicIndex
                            );


                        if (
                            Number.isFinite(
                                index
                            )
                        ) {

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

                            restoreTopicQuestions();

                        }

                    }
                );

            }
        );

}


/* =========================================================
   PROGRESS
   ========================================================= */

function isTopicCompleted(
    topic,
    index
) {

    const name =
        getTopicName(
            topic
        );


    const id =
        getTopicId(
            topic,
            index
        );


    return (
        completedTopics.includes(
            id
        ) ||
        completedTopics.includes(
            name
        )
    );

}


function getProgress() {

    const topics =
        studyPlan.topics || [];


    const total =
        topics.length;


    let completed = 0;


    topics.forEach(
        (
            topic,
            index
        ) => {

            if (
                isTopicCompleted(
                    topic,
                    index
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
   UPDATE PROGRESS
   ========================================================= */

function updateDashboardProgress() {

    const {

        total,

        completed,

        percent

    } = getProgress();


    if (progressPercent) {

        progressPercent.textContent =
            `${percent}%`;

    }


    if (progressCount) {

        progressCount.textContent =
            `${completed} of ${total} topics completed`;

    }


    if (progressBar) {

        if (
            progressBar.tagName ===
            "CIRCLE"
        ) {

            const radius =
                Number(
                    progressBar.getAttribute(
                        "r"
                    )
                ) || 45;


            const circumference =
                2 *
                Math.PI *
                radius;


            progressBar.style.strokeDasharray =
                circumference;


            progressBar.style.strokeDashoffset =
                circumference -
                (
                    percent /
                    100 *
                    circumference
                );

        } else {

            progressBar.style.width =
                `${percent}%`;

        }

    }


    if (studyScore) {

        studyScore.textContent =
            percent;

    }


    if (scoreDisplay) {

        scoreDisplay.textContent =
            `${percent} / 100`;

    }


    if (scoreProgressBar) {

        scoreProgressBar.style.width =
            `${percent}%`;

    }


    if (scoreMessage) {

        if (percent === 0) {

            scoreMessage.textContent =
                "Start studying to build your score.";

        } else if (percent < 50) {

            scoreMessage.textContent =
                "Good start. Keep building your momentum.";

        } else if (percent < 80) {

            scoreMessage.textContent =
                "You're making solid progress. Keep going.";

        } else if (percent < 100) {

            scoreMessage.textContent =
                "Excellent progress. You're almost there.";

        } else {

            scoreMessage.textContent =
                "Outstanding! You've completed your study plan.";

        }

    }

}


/* =========================================================
   CURRENT TOPIC
   ========================================================= */

function renderCurrentTopic() {

    const topics =
        studyPlan.topics || [];


    const total =
        topics.length;


    if (!total) {

        if (currentTopicName) {

            currentTopicName.textContent =
                "No topic available";

        }


        if (currentTopicDescription) {

            currentTopicDescription.textContent =
                "Create a study plan with topics to begin.";

        }


        if (topicPosition) {

            topicPosition.textContent =
                "TOPIC 0 OF 0";

        }


        if (topicStatusBadge) {

            topicStatusBadge.textContent =
                "NO TOPIC";

        }


        if (topicCompleteCheckbox) {

            topicCompleteCheckbox.checked =
                false;

            topicCompleteCheckbox.disabled =
                true;

        }


        return;

    }


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


    const topicName =
        getTopicName(
            topic
        );


    const completed =
        isTopicCompleted(
            topic,
            currentTopicIndex
        );


    if (currentTopicName) {

        /*
           IMPORTANT:
           Display the real topic name.
           Never display "Untitled Topic".
        */

        currentTopicName.textContent =
            topicName ||
            `Topic ${
                currentTopicIndex + 1
            }`;

    }


    if (currentTopicDescription) {

        const description =
            topic &&
            typeof topic ===
            "object"
                ? topic.description
                : "";


        currentTopicDescription.textContent =
            description ||
            (
                completed
                    ? "You've completed this topic. Review it or continue to the next topic."
                    : "Study this topic and complete the knowledge check."
            );

    }


    if (topicPosition) {

        topicPosition.textContent =
            `TOPIC ${
                currentTopicIndex + 1
            } OF ${total}`;

    }


    if (topicStatusBadge) {

        topicStatusBadge.textContent =
            completed
                ? "COMPLETED"
                : "IN PROGRESS";


        topicStatusBadge.classList.toggle(
            "completed",
            completed
        );

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
                ? "✓ Topic completed. Great work!"
                : "Tick this box when you are done studying this topic.";

    }


    if (nextTopicMessage) {

        if (
            currentTopicIndex <
            total - 1
        ) {

            const nextName =
                getTopicName(
                    topics[
                        currentTopicIndex + 1
                    ]
                );


            nextTopicMessage.textContent =
                `Next: ${nextName}`;

        } else {

            nextTopicMessage.textContent =
                "You've reached the final topic.";

        }

    }

}


/* =========================================================
   COMPLETE CURRENT TOPIC
   ========================================================= */

function completeCurrentTopic() {

    const topics =
        studyPlan.topics || [];


    if (!topics.length) {
        return;
    }


    const topic =
        topics[
            currentTopicIndex
        ];


    if (!topic) {
        return;
    }


    const topicName =
        getTopicName(
            topic
        );


    const topicId =
        getTopicId(
            topic,
            currentTopicIndex
        );


    if (
        topicCompleteCheckbox &&
        topicCompleteCheckbox.checked
    ) {

        if (
            !completedTopics.includes(
                topicId
            )
        ) {

            completedTopics.push(
                topicId
            );

        }


        /*
           Keep the name too.
           This makes older saved progress
           compatible with the new format.
        */

        if (
            topicName &&
            !completedTopics.includes(
                topicName
            )
        ) {

            completedTopics.push(
                topicName
            );

        }


        if (
            topic &&
            typeof topic ===
            "object"
        ) {

            topic.status =
                "Completed";

        }


        if (topicCompletionMessage) {

            topicCompletionMessage.textContent =
                "✓ Topic marked as completed.";

        }


        updateStreak();


        if (
            currentTopicIndex <
            topics.length - 1
        ) {

            currentTopicIndex++;


            localStorage.setItem(
                "studyMindCurrentTopicIndex",
                String(
                    currentTopicIndex
                )
            );

        }

    } else {

        completedTopics =
            completedTopics.filter(
                item =>
                    item !==
                        topicId &&
                    item !==
                        topicName
            );


        if (
            topic &&
            typeof topic ===
            "object"
        ) {

            topic.status =
                "In Progress";

        }


        if (topicCompletionMessage) {

            topicCompletionMessage.textContent =
                "Topic marked as incomplete.";

        }

    }


    localStorage.setItem(
        "studyMindCompletedTopics",
        JSON.stringify(
            completedTopics
        )
    );


    savePlan();


    updateDashboardProgress();

    renderTopics();

    renderCurrentTopic();

    renderCalendar();

}


/* =========================================================
   STUDY STREAK
   ========================================================= */

function updateStreak() {

    const today =
        todayKey();


    const lastStudyDate =
        localStorage.getItem(
            "studyMindLastStudyDate"
        );


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


    if (
        lastStudyDate ===
        formatDateKey(
            yesterday
        )
    ) {

        currentStreak++;

    } else {

        currentStreak = 1;

    }


    localStorage.setItem(
        "studyMindStreak",
        String(
            currentStreak
        )
    );


    localStorage.setItem(
        "studyMindLastStudyDate",
        today
    );


    if (streak) {

        streak.textContent =
            `${currentStreak} Days 🔥`;

    }

}


/* =========================================================
   CALENDAR
   6 STUDY DAYS → 1 BREAK DAY
   ========================================================= */

function getStudyPlanStartDate() {

    const saved =
        new Date(
            studyPlan.studyStartDate
        );


    if (
        !Number.isNaN(
            saved.getTime()
        )
    ) {

        return startOfDay(
            saved
        );

    }


    const today =
        startOfDay(
            new Date()
        );


    studyPlan.studyStartDate =
        formatDateKey(
            today
        );


    savePlan();


    return today;

}


function getExamDate() {

    if (
        !studyPlan.examDate
    ) {

        return null;

    }


    const exam =
        new Date(
            studyPlan.examDate
        );


    return Number.isNaN(
        exam.getTime()
    )
        ? null
        : startOfDay(
            exam
        );

}


function isExamDay(
    date
) {

    const exam =
        getExamDate();


    return (
        !!exam &&
        startOfDay(
            date
        ).getTime() ===
        exam.getTime()
    );

}


function isCalendarBreakDay(
    date
) {

    const current =
        startOfDay(
            date
        );


    const start =
        getStudyPlanStartDate();


    const exam =
        getExamDate();


    if (
        current < start
    ) {

        return false;

    }


    if (
        exam &&
        current > exam
    ) {

        return false;

    }


    if (
        exam &&
        current.getTime() ===
        exam.getTime()
    ) {

        return false;

    }


    const daysSinceStart =
        Math.floor(
            (
                current.getTime() -
                start.getTime()
            ) / DAY_MS
        );


    /*
       0-5 = Study
       6   = Break
       7-12 = Study
       13  = Break
       etc.
    */

    return (
        daysSinceStart % 7 === 6
    );

}


/* =========================================================
   RENDER CALENDAR
   ========================================================= */

function renderCalendar() {

    if (
        !calendarDays ||
        !calendarMonth
    ) {

        return;

    }


    calendarDays.innerHTML =
        "";


    const year =
        calendarDate.getFullYear();


    const month =
        calendarDate.getMonth();


    calendarMonth.textContent =
        calendarDate.toLocaleDateString(
            "en-US",
            {
                month:
                    "long",
                year:
                    "numeric"
            }
        );


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


    const previousMonthDays =
        new Date(
            year,
            month,
            0
        ).getDate();


    /*
       PREVIOUS MONTH DAYS
    */

    for (
        let i =
            firstDay - 1;
        i >= 0;
        i--
    ) {

        const cell =
            document.createElement(
                "div"
            );


        cell.className =
            "calendar-day other-month";


        cell.innerHTML =
            `
                <span class="day-number">
                    ${
                        previousMonthDays -
                        i
                    }
                </span>
            `;


        calendarDays.appendChild(
            cell
        );

    }


    /*
       CURRENT MONTH
    */

    for (
        let dateNumber = 1;
        dateNumber <= daysInMonth;
        dateNumber++
    ) {

        const cell =
            document.createElement(
                "div"
            );


        cell.className =
            "calendar-day";


        const date =
            new Date(
                year,
                month,
                dateNumber
            );


        const normalized =
            startOfDay(
                date
            );


        const today =
            startOfDay(
                new Date()
            );


        if (
            normalized.getTime() ===
            today.getTime()
        ) {

            cell.classList.add(
                "today"
            );

        }


        const start =
            getStudyPlanStartDate();


        const exam =
            getExamDate();


        const insidePlan =
            normalized >= start &&
            (
                !exam ||
                normalized <= exam
            );


        const breakDay =
            insidePlan &&
            isCalendarBreakDay(
                normalized
            );


        const examDay =
            insidePlan &&
            isExamDay(
                normalized
            );


        /*
           CHECK WHETHER A COMPLETED
           TOPIC/STUDY DAY SHOULD BE SHOWN
        */

        if (examDay) {

            cell.classList.add(
                "exam-day"
            );

        } else if (
            breakDay
        ) {

            cell.classList.add(
                "break-day"
            );

        } else if (
            insidePlan
        ) {

            cell.classList.add(
                "study-day"
            );

        }


        cell.innerHTML =
            `
                <span class="day-number">
                    ${dateNumber}
                </span>

                ${
                    breakDay
                        ? `
                            <span class="break-label">
                                BREAK
                            </span>
                        `
                        : ""
                }

                ${
                    examDay
                        ? `
                            <span class="break-label">
                                EXAM
                            </span>
                        `
                        : ""
                }
            `;


        calendarDays.appendChild(
            cell
        );

    }


    /*
       FILL CALENDAR TO 42 CELLS
    */

    const totalCells =
        calendarDays.children.length;


    const remaining =
        Math.max(
            0,
            42 - totalCells
        );


    for (
        let i = 1;
        i <= remaining;
        i++
    ) {

        const cell =
            document.createElement(
                "div"
            );


        cell.className =
            "calendar-day other-month";


        cell.innerHTML =
            `
                <span class="day-number">
                    ${i}
                </span>
            `;


        calendarDays.appendChild(
            cell
        );

    }

}


/* =========================================================
   SCHEDULE
   ========================================================= */

function formatTime(
    hour,
    minute
) {

    const suffix =
        hour >= 12
            ? "PM"
            : "AM";


    let displayHour =
        hour % 12;


    if (
        displayHour === 0
    ) {

        displayHour = 12;

    }


    return (
        `${displayHour}:` +
        `${String(
            minute
        ).padStart(
            2,
            "0"
        )} ${suffix}`
    );

}


/* =========================================================
   RENDER SCHEDULE
   ========================================================= */

function renderSchedule() {

    if (!scheduleList) {
        return;
    }


    const subjects =
        studyPlan.subjects || [];


    const hours =
        Number(
            studyPlan.studyHours
        ) || 0;


    if (
        !subjects.length ||
        hours <= 0
    ) {

        scheduleList.innerHTML =
            `
                <div class="empty-schedule">
                    Your daily study sessions
                    will appear here.
                </div>
            `;

        return;

    }


    const dailyMinutes =
        Math.round(
            hours * 60
        );


    const preferredMinutes =
        Math.max(
            1,
            Math.round(
                selectedTimerSeconds /
                60
            )
        );


    let remaining =
        dailyMinutes;


    let sessionIndex =
        0;


    let startMinutes =
        16 * 60;


    scheduleList.innerHTML =
        "";


    while (
        remaining > 0
    ) {

        const sessionMinutes =
            Math.min(
                preferredMinutes,
                remaining
            );


        const subject =
            subjects[
                sessionIndex %
                subjects.length
            ];


        const endMinutes =
            startMinutes +
            sessionMinutes;


        const startHour =
            Math.floor(
                startMinutes /
                60
            );


        const startMinute =
            startMinutes %
            60;


        const endHour =
            Math.floor(
                endMinutes /
                60
            );


        const endMinute =
            endMinutes %
            60;


        const item =
            document.createElement(
                "div"
            );


        item.className =
            "schedule-item";


        item.innerHTML =
            `
                <div class="schedule-time">

                    ${formatTime(
                        startHour,
                        startMinute
                    )}

                    <span>
                        ${formatTime(
                            endHour,
                            endMinute
                        )}
                    </span>

                </div>

                <div class="schedule-line"></div>

                <div class="schedule-details">

                    <span>
                        ${
                            sessionIndex === 0
                                ? "FOCUS SESSION"
                                : "STUDY SESSION"
                        }
                    </span>

                    <strong>
                        ${escapeHTML(
                            subject
                        )}
                    </strong>

                    <small>
                        ${sessionMinutes} minutes
                    </small>

                </div>
            `;


        scheduleList.appendChild(
            item
        );


        remaining -=
            sessionMinutes;


        sessionIndex++;


        if (
            remaining > 0
        ) {

            startMinutes =
                endMinutes + 15;

        }

    }

}


/* =========================================================
   NEXT BOOKING
   ========================================================= */

function updateNextBooking() {

    if (
        !nextBooking ||
        !nextBookingTime
    ) {

        return;

    }


    const subjects =
        studyPlan.subjects || [];


    if (!subjects.length) {

        nextBooking.textContent =
            "No upcoming session yet";


        nextBookingTime.textContent =
            "Create a study plan to populate your schedule.";


        return;

    }


    const next =
        new Date();


    next.setHours(
        16,
        0,
        0,
        0
    );


    if (
        next <= new Date()
    ) {

        next.setDate(
            next.getDate() + 1
        );

    }


    if (
        isExamDay(next)
    ) {

        nextBooking.textContent =
            "Exam Day";


        nextBookingTime.textContent =
            next.toLocaleDateString(
                "en-US",
                {
                    weekday:
                        "long",
                    month:
                        "short",
                    day:
                        "numeric"
                }
            );


        return;

    }


    if (
        isCalendarBreakDay(next)
    ) {

        nextBooking.textContent =
            "Break Day";


        nextBookingTime.textContent =
            next.toLocaleDateString(
                "en-US",
                {
                    weekday:
                        "long",
                    month:
                        "short",
                    day:
                        "numeric"
                }
            );


        return;

    }


    const subject =
        subjects[
            next.getDay() %
            subjects.length
        ];


    nextBooking.textContent =
        `Study ${subject}`;


    nextBookingTime.textContent =
        `${next.toLocaleDateString(
            "en-US",
            {
                weekday:
                    "long",
                month:
                    "short",
                day:
                    "numeric"
            }
        )} · ${formatTime(
            16,
            0
        )}`;

}


/* =========================================================
   TIMER
   ========================================================= */

function syncTimerDurationControl() {

    if (!timerDurationSelect) {
        return;
    }


    const minutes =
        Math.round(
            selectedTimerSeconds /
            60
        );


    if (
        timerDurationSelect.tagName ===
        "SELECT"
    ) {

        const match =
            Array.from(
                timerDurationSelect.options
            ).find(
                option => {

                    const value =
                        Number(
                            option.value
                        );


                    return (
                        value ===
                            minutes ||
                        value ===
                            selectedTimerSeconds
                    );

                }
            );


        if (match) {

            timerDurationSelect.value =
                match.value;

        }

    } else {

        timerDurationSelect.value =
            minutes;

    }

}


/* =========================================================
   TIMER DURATION CHANGE
   ========================================================= */

function handleTimerDurationChange() {

    if (!timerDurationSelect) {
        return;
    }


    const value =
        Number(
            timerDurationSelect.value
        );


    if (
        !Number.isFinite(value) ||
        value <= 0
    ) {

        return;

    }


    /*
       Values such as 25, 45, 60
       are treated as minutes.
    */

    const newDuration =
        value <= 300
            ? value * 60
            : value;


    clearInterval(
        timerInterval
    );


    timerInterval =
        null;


    selectedTimerSeconds =
        newDuration;


    timerSeconds =
        newDuration;


    timerRunning =
        false;


    timerEndTime =
        null;


    localStorage.setItem(
        "studyMindSelectedTimerSeconds",
        String(
            selectedTimerSeconds
        )
    );


    localStorage.setItem(
        "studyMindTimerSeconds",
        String(
            timerSeconds
        )
    );


    localStorage.setItem(
        "studyMindTimerRunning",
        "false"
    );


    localStorage.removeItem(
        "studyMindTimerEndTime"
    );


    updateTimerDisplay();

    updateTimerButtons();

    renderSchedule();

}


/* =========================================================
   START TIMER
   ========================================================= */

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
        timerSeconds * 1000;


    localStorage.setItem(
        "studyMindTimerRunning",
        "true"
    );


    localStorage.setItem(
        "studyMindTimerEndTime",
        String(
            timerEndTime
        )
    );


    localStorage.setItem(
        "studyMindTimerSeconds",
        String(
            timerSeconds
        )
    );


    updateTimerDisplay();

    updateTimerButtons();

    startTimerInterval();

}


/* =========================================================
   TIMER INTERVAL
   ========================================================= */

function startTimerInterval() {

    clearInterval(
        timerInterval
    );


    timerInterval =
        setInterval(
            () => {

                if (
                    !timerRunning ||
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
                            ) / 1000
                        )
                    );


                localStorage.setItem(
                    "studyMindTimerSeconds",
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


/* =========================================================
   PAUSE TIMER
   ========================================================= */

function pauseTimer() {

    if (!timerRunning) {
        return;
    }


    if (timerEndTime) {

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
        "studyMindTimerSeconds",
        String(
            timerSeconds
        )
    );


    localStorage.setItem(
        "studyMindTimerRunning",
        "false"
    );


    localStorage.removeItem(
        "studyMindTimerEndTime"
    );


    updateTimerDisplay();

    updateTimerButtons();

}


/* =========================================================
   FINISH TIMER
   ========================================================= */

function finishTimer(
    showAlert = true
) {

    timerRunning =
        false;


    timerEndTime =
        null;


    timerSeconds =
        0;


    clearInterval(
        timerInterval
    );


    timerInterval =
        null;


    localStorage.setItem(
        "studyMindTimerSeconds",
        "0"
    );


    localStorage.setItem(
        "studyMindTimerRunning",
        "false"
    );


    localStorage.removeItem(
        "studyMindTimerEndTime"
    );


    updateTimerDisplay();

    updateTimerButtons();


    updateStreak();


    if (
        topicCompletionMessage
    ) {

        const minutes =
            Math.round(
                selectedTimerSeconds /
                60
            );


        topicCompletionMessage.textContent =
            `⏰ Your ${minutes}-minute study session is complete. If you have finished the topic, tick the box below.`;

    }


    if (showAlert) {

        const minutes =
            Math.round(
                selectedTimerSeconds /
                60
            );


        alert(
            `Your ${minutes}-minute study session is complete! 🎉`
        );

    }

}


/* =========================================================
   RESET TIMER
   ========================================================= */

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
        "studyMindTimerSeconds",
        String(
            timerSeconds
        )
    );


    localStorage.setItem(
        "studyMindTimerRunning",
        "false"
    );


    localStorage.removeItem(
        "studyMindTimerEndTime"
    );


    if (studyTimer) {

        studyTimer.classList.remove(
            "timer-finished",
            "timer-warning"
        );

    }


    updateTimerDisplay();

    updateTimerButtons();

}


/* =========================================================
   TIMER BUTTONS
   ========================================================= */

function updateTimerButtons() {

    if (startTimerButton) {

        startTimerButton.disabled =
            timerRunning;


        if (
            timerSeconds <= 0
        ) {

            startTimerButton.innerHTML =
                "<span>✓</span> Timer Complete";

        } else if (
            timerRunning
        ) {

            startTimerButton.innerHTML =
                "<span>▶</span> Running...";

        } else if (
            timerSeconds <
            selectedTimerSeconds
        ) {

            startTimerButton.innerHTML =
                "<span>▶</span> Resume";

        } else {

            startTimerButton.innerHTML =
                "<span>▶</span> Start Timer";

        }

    }


    if (pauseTimerButton) {

        pauseTimerButton.disabled =
            !timerRunning;

    }

}


/* =========================================================
   TIMER DISPLAY
   ========================================================= */

function updateTimerDisplay() {

    if (!studyTimer) {
        return;
    }


    const safe =
        Math.max(
            0,
            Number(
                timerSeconds
            ) || 0
        );


    const minutes =
        Math.floor(
            safe / 60
        );


    const seconds =
        safe % 60;


    studyTimer.textContent =
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


    studyTimer.classList.toggle(
        "timer-warning",
        safe > 0 &&
        safe <= 60
    );


    studyTimer.classList.toggle(
        "timer-finished",
        safe === 0
    );

}


/* =========================================================
   AI PROGRESS ANALYSIS
   ========================================================= */

async function analyzeProgress() {

    if (!aiAdviceText) {
        return;
    }


    if (!isAuthenticated) {

        showAILoginMessage(
            aiAdviceText
        );

        return;

    }


    const {
        total,
        completed,
        percent
    } =
        getProgress();


    const currentTopic =
        studyPlan.topics.length
            ? getTopicName(
                studyPlan.topics[
                    currentTopicIndex
                ]
            )
            : "None";


    const subjects =
        studyPlan.subjects || [];


    if (
        analyzeProgressButton
    ) {

        analyzeProgressButton.disabled =
            true;

        analyzeProgressButton.textContent =
            "⏳ Analyzing...";

    }


    aiAdviceText.textContent =
        "StudyMind AI is analyzing your progress...";


    try {

        const message =
            `
You are StudyMind AI, helping a secondary-school student.

STUDENT STUDY INFORMATION:

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

Subjects:
${
    subjects.length
        ? subjects.join(", ")
        : "No subjects available"
}

Current topic:
${
    currentTopic ||
    "No current topic"
}

Topics completed:
${completed} of ${total}

Progress:
${percent}%

Daily study hours:
${
    Number(
        studyPlan.studyHours
    ) || 0
}

Days remaining:
${calculateDaysLeft()}

Give practical advice on what the student should focus on next.

Do not invent information.
Keep the answer clear, concise and useful.
            `.trim();


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
                        JSON.stringify({
                            message
                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data?.error ||
                "Unable to analyze progress."
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


        aiAdviceText.innerHTML =
            `
                <strong>
                    📊 Your Study Analysis
                </strong>

                <div>
                    ${renderAIResponse(
                        data.reply
                    )}
                </div>
            `;


        renderMath(
            aiAdviceText
        );


    } catch (error) {

        console.error(
            "Progress analysis error:",
            error
        );


        aiAdviceText.textContent =
            error.message ||
            "Unable to connect to StudyMind AI right now. Please try again.";

    } finally {

        if (
            analyzeProgressButton
        ) {

            analyzeProgressButton.disabled =
                false;

            analyzeProgressButton.innerHTML =
                "🔍 Analyze My Progress";

        }

    }

}


/* =========================================================
   AI QUESTION COUNT
   ========================================================= */

function getAIQuestionCount() {

    aiQuestionCount =
        Number(
            localStorage.getItem(
                "aiQuestionCount"
            )
        ) || 0;


    return aiQuestionCount;

}


function getRemainingAIQuestions() {

    return Math.max(
        0,
        FREE_QUESTION_LIMIT -
        getAIQuestionCount()
    );

}


/* =========================================================
   RECORD AI QUESTION
   ========================================================= */

function recordAIQuestion() {

    const count =
        getAIQuestionCount();


    if (
        count >=
        FREE_QUESTION_LIMIT
    ) {

        return false;

    }


    aiQuestionCount =
        count + 1;


    localStorage.setItem(
        "aiQuestionCount",
        String(
            aiQuestionCount
        )
    );


    return true;

}


/* =========================================================
   UPDATE AI BADGE
   ========================================================= */

function updateAIBadge() {

    const count =
        getAIQuestionCount();


    if (aiCountBadge) {

        aiCountBadge.textContent =
            `${count}/${FREE_QUESTION_LIMIT} used`;

    }

}


/* =========================================================
   ASK STUDYMIND AI
   ========================================================= */

async function askStudyMindAI() {

    if (!isAuthenticated) {

        showAILoginMessage(
            aiResponse
        );

        return;

    }


    const question =
        aiQuestion
            ? aiQuestion.value.trim()
            : "";


    if (!question) {

        if (aiResponse) {

            aiResponse.textContent =
                "Please enter a question first.";

        }

        return;

    }


    if (
        !recordAIQuestion()
    ) {

        showAskAILimitMessage();

        return;

    }


    if (askAIButton) {

        askAIButton.disabled =
            true;

        askAIButton.textContent =
            "⏳ Thinking...";

    }


    if (aiResponse) {

        aiResponse.textContent =
            "StudyMind AI is thinking...";

    }


    try {

        const subjects =
            studyPlan.subjects || [];


        const topics =
            studyPlan.topics || [];


        const {
            total,
            completed,
            percent
        } =
            getProgress();


        const currentTopic =
            topics.length
                ? getTopicName(
                    topics[
                        currentTopicIndex
                    ]
                )
                : "No current topic";


        const topicNames =
            topics
                .map(
                    topic =>
                        getTopicName(
                            topic
                        )
                )
                .filter(Boolean);


        /*
           IMPORTANT:
           Use /api/ask-ai because
           that is the Vercel route
           connected to your OpenAI API.
        */

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
                        JSON.stringify({

                            message:
                                `
You are StudyMind AI, a professional educational assistant helping a secondary-school student.

STUDENT'S CURRENT STUDY INFORMATION

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

Subjects:
${
    subjects.length
        ? subjects.join(", ")
        : "No subjects available"
}

Topics:
${
    topicNames.length
        ? topicNames.join(", ")
        : "No topics available"
}

Current topic:
${
    currentTopic ||
    "No current topic"
}

Daily study hours:
${
    Number(
        studyPlan.studyHours
    ) || 0
}

Progress:
${completed} of ${total} topics completed (${percent}%)

STUDENT'S QUESTION:

${question}

Answer the student's question clearly and accurately.

Use the student's study information when it is relevant.

If the student asks what they should study next, use their actual subjects, topics and progress.

Do not invent subjects, topics, dates or progress.

Keep the response helpful and readable.
                                `.trim()

                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

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


        if (aiResponse) {

            aiResponse.innerHTML =
                renderAIResponse(
                    data.reply
                );


            renderMath(
                aiResponse
            );

        }


        if (aiQuestion) {

            aiQuestion.value =
                "";

        }


    } catch (error) {

        console.error(
            "StudyMind AI error:",
            error
        );


        /*
           Do not charge the student
           for a failed request.
        */

        aiQuestionCount =
            Math.max(
                0,
                getAIQuestionCount() - 1
            );


        localStorage.setItem(
            "aiQuestionCount",
            String(
                aiQuestionCount
            )
        );


        if (aiResponse) {

            aiResponse.textContent =
                error.message ||
                "Sorry, I couldn't connect to StudyMind AI right now. Please try again.";

        }

    } finally {

        updateAIBadge();

        setupAIAuthenticationUI();

    }

}


/* =========================================================
   AI AUTHENTICATION UI
   ========================================================= */

function setupAIAuthenticationUI() {

    const count =
        getAIQuestionCount();


    if (!isAuthenticated) {

        if (askAIButton) {

            askAIButton.disabled =
                true;

            askAIButton.textContent =
                "🔒 Login Required";

        }


        if (aiQuestion) {

            aiQuestion.disabled =
                true;

            aiQuestion.placeholder =
                "Login to use StudyMind AI";

        }


        updateAIBadge();

        return;

    }


    if (aiQuestion) {

        aiQuestion.disabled =
            false;

        aiQuestion.placeholder =
            "Ask anything about your study plan...";

    }


    if (askAIButton) {

        askAIButton.disabled =
            count >=
            FREE_QUESTION_LIMIT;


        askAIButton.textContent =
            count >=
            FREE_QUESTION_LIMIT
                ? "🔒 Free Limit Reached"
                : "🤖 Ask AI";

    }


    updateAIBadge();

}


/* =========================================================
   LOGIN MESSAGE
   ========================================================= */

function showAILoginMessage(
    container
) {

    if (!container) {
        return;
    }


    container.innerHTML =
        `
            <div class="ai-limit-message">

                <h3>
                    🔒 Login Required
                </h3>

                <p>
                    Please log in to use
                    StudyMind AI.
                </p>

                <button
                    class="premium-button"
                    onclick="window.location.href='login.html'"
                >
                    🔑 Login
                </button>

            </div>
        `;

}


/* =========================================================
   ASK AI LIMIT MESSAGE
   ========================================================= */

function showAskAILimitMessage() {

    if (!aiResponse) {
        return;
    }


    aiResponse.innerHTML =
        `
            <div class="ai-limit-message">

                <h3>
                    💎 Free AI Limit Reached
                </h3>

                <p>
                    You've used all
                    ${FREE_QUESTION_LIMIT}
                    free AI questions.
                </p>

                <p>
                    Upgrade to StudyMind AI Premium
                    for unlimited AI assistance.
                </p>

                <button
                    class="premium-button"
                    onclick="openPremiumOffer()"
                >
                    💎 Explore Premium
                </button>

            </div>
        `;

}


/* =========================================================
   DOCUMENT SUMMARIZER
   ========================================================= */

function getSummaryUsageCount() {

    summaryUsageCount =
        Number(
            localStorage.getItem(
                "summaryUsageCount"
            )
        ) || 0;


    return summaryUsageCount;

}


/* =========================================================
   SUMMARY BADGE
   ========================================================= */

function updateSummaryBadge() {

    const count =
        getSummaryUsageCount();


    if (summaryCountBadge) {

        summaryCountBadge.textContent =
            `${count}/${FREE_SUMMARY_LIMIT} used`;

    }

}


/* =========================================================
   DOCUMENT SUMMARIZER
   ========================================================= */

async function summarizeDocument() {

    if (!isAuthenticated) {

        showAILoginMessage(
            summaryOutput
        );

        return;

    }


    const content =
        summarizeInput
            ? summarizeInput.value.trim()
            : "";


    if (!content) {

        if (summaryOutput) {

            summaryOutput.textContent =
                "Please paste your study material first.";

        }

        return;

    }


    const currentCount =
        getSummaryUsageCount();


    if (
        currentCount >=
        FREE_SUMMARY_LIMIT
    ) {

        showSummaryLimitMessage();

        return;

    }


    if (summarizeBtn) {

        summarizeBtn.disabled =
            true;

        summarizeBtn.innerHTML =
            "⏳ Summarizing...";

    }


    if (summaryOutput) {

        summaryOutput.textContent =
            "StudyMind AI is summarizing your material...";

    }


    try {

        const examContext =
            studyPlan.examType ||
            "WAEC";


        const currentTopic =
            studyPlan.topics.length
                ? getTopicName(
                    studyPlan.topics[
                        currentTopicIndex
                    ]
                )
                : "";


        const message =
            `
Summarize the following study material for a secondary-school student preparing for ${examContext}.

CURRENT STUDY CONTEXT:

Subjects:
${
    studyPlan.subjects.length
        ? studyPlan.subjects.join(", ")
        : "Not specified"
}

Current topic:
${
    currentTopic ||
    "Not specified"
}

Focus on:

- Key concepts
- Important definitions
- Important formulas
- Exam-relevant points
- Important facts
- Easy-to-revise explanations

Keep the summary concise but useful for exam revision.

Study material:

${content}
            `.trim();


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
                        JSON.stringify({
                            message
                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data?.error ||
                "Unable to summarize document."
            );

        }


        if (
            !data ||
            !data.reply
        ) {

            throw new Error(
                "The AI returned an empty summary."
            );

        }


        summaryUsageCount =
            currentCount + 1;


        localStorage.setItem(
            "summaryUsageCount",
            String(
                summaryUsageCount
            )
        );


        updateSummaryBadge();


        if (summaryOutput) {

            summaryOutput.innerHTML =
                `
                    <div class="summary-result">

                        <h4>
                            📋 Summary
                            (Tailored for
                            ${escapeHTML(
                                examContext
                            )})
                        </h4>

                        <div>
                            ${renderAIResponse(
                                data.reply
                            )}
                        </div>

                    </div>
                `;


            renderMath(
                summaryOutput
            );

        }


    } catch (error) {

        console.error(
            "Document summarizer error:",
            error
        );


        if (summaryOutput) {

            summaryOutput.textContent =
                error.message ||
                "Sorry, I couldn't summarize your document right now.";

        }

    } finally {

        if (summarizeBtn) {

            summarizeBtn.disabled =
                false;

            summarizeBtn.innerHTML =
                "✨ Summarize Notes";

        }

    }

}


/* =========================================================
   SUMMARY LIMIT
   ========================================================= */

function showSummaryLimitMessage() {

    if (!summaryOutput) {
        return;
    }


    summaryOutput.innerHTML =
        `
            <div class="ai-limit-message">

                <h3>
                    💎 Free Summary Limit Reached
                </h3>

                <p>
                    You've used all
                    ${FREE_SUMMARY_LIMIT}
                    free document summaries.
                </p>

                <button
                    class="premium-button"
                    onclick="openPremiumOffer()"
                >
                    💎 Explore Premium
                </button>

            </div>
        `;

}


/* =========================================================
   TOPIC KNOWLEDGE CHECK
   ========================================================= */

async function generateQuestionsForTopic(
    topic
) {

    if (!topic) {
        return;
    }


    if (!isAuthenticated) {

        showAILoginMessage(
            topicQuestionsContainer
        );

        return;

    }


    const topicName =
        getTopicName(
            topic
        );


    if (!topicName) {
        return;
    }


    if (
        completedQuestionTopics.includes(
            topicName
        )
    ) {

        showTopicQuestionsFinished(
            topicName
        );

        return;

    }


    if (
        !topicQuestionsSection ||
        !topicQuestionsContainer
    ) {

        return;

    }


    topicQuestionsSection.style.display =
        "block";


    topicQuestionsContainer.innerHTML =
        `
            <p>
                🤖 StudyMind AI is preparing
                5 questions about
                <strong>
                    ${escapeHTML(
                        topicName
                    )}
                </strong>...
            </p>
        `;


    try {

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
                        JSON.stringify({

                            message:
                                `
Create exactly 5 educational multiple-choice questions for a secondary-school student who has studied this topic:

${topicName}

Requirements:

- Exactly 5 questions.
- Exactly 4 options per question.
- Only one correct answer.
- Test understanding.
- Return ONLY valid JSON.
- No markdown.

Format:

[
  {
    "question": "Question",
    "options": ["A", "B", "C", "D"],
    "answer": 0
  }
]

The answer must be the zero-based index of the correct option.
                                `.trim()

                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data?.error ||
                "Could not generate questions."
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


        const questions =
            JSON.parse(
                cleanJSONResponse(
                    data.reply
                )
            );


        if (
            !Array.isArray(
                questions
            ) ||
            questions.length < 5
        ) {

            throw new Error(
                "The AI did not return 5 valid questions."
            );

        }


        topicQuestions = {

            topic:
                topicName,

            questions:
                questions.slice(
                    0,
                    5
                ),

            submitted:
                false

        };


        localStorage.setItem(
            "studyMindTopicQuestions",
            JSON.stringify(
                topicQuestions
            )
        );


        renderTopicQuestions(
            topicQuestions
        );


    } catch (error) {

        console.error(
            "Question generation error:",
            error
        );


        topicQuestionsContainer.innerHTML =
            `
                <div class="ai-response">

                    <p>
                        I couldn't generate the
                        questions right now.
                    </p>

                    <button
                        class="secondary-button"
                        id="retryTopicQuestionsButton"
                    >
                        Try Again
                    </button>

                </div>
            `;


        const retry =
            $("retryTopicQuestionsButton");


        if (retry) {

            retry.addEventListener(
                "click",
                () =>
                    generateQuestionsForTopic(
                        topicName
                    )
            );

        }

    }

}


/* =========================================================
   RENDER TOPIC QUESTIONS
   ========================================================= */

function renderTopicQuestions(
    data
) {

    if (
        !data ||
        !Array.isArray(
            data.questions
        ) ||
        !topicQuestionsSection ||
        !topicQuestionsContainer
    ) {

        return;

    }


    topicQuestionsSection.style.display =
        "block";


    topicQuestionsContainer.innerHTML =
        "";


    data.questions
        .slice(0, 5)
        .forEach(
            (
                question,
                index
            ) => {

                const box =
                    document.createElement(
                        "div"
                    );


                box.className =
                    "topic-question";


                const options =
                    Array.isArray(
                        question.options
                    )
                        ? question.options.slice(
                            0,
                            4
                        )
                        : [];


                box.innerHTML =
                    `
                        <h4>
                            ${index + 1}.
                            ${escapeHTML(
                                question.question ||
                                ""
                            )}
                        </h4>

                        <div>

                            ${options
                                .map(
                                    (
                                        option,
                                        optionIndex
                                    ) =>
                                        `
                                            <label>

                                                <input
                                                    type="radio"
                                                    name="topic-question-${index}"
                                                    value="${optionIndex}"
                                                >

                                                ${escapeHTML(
                                                    option
                                                )}

                                            </label>
                                        `
                                )
                                .join("")}

                        </div>
                    `;


                topicQuestionsContainer.appendChild(
                    box
                );

            }
        );


    if (submitTopicQuestions) {

        submitTopicQuestions.disabled =
            false;

        submitTopicQuestions.textContent =
            "Submit Answers";

    }

}


/* =========================================================
   SUBMIT QUESTIONS
   ========================================================= */

function submitQuestions() {

    if (
        !topicQuestions ||
        !Array.isArray(
            topicQuestions.questions
        ) ||
        topicQuestions.submitted
    ) {

        return;

    }


    let score = 0;

    let answered = 0;


    topicQuestions.questions
        .slice(0, 5)
        .forEach(
            (
                question,
                index
            ) => {

                const selected =
                    document.querySelector(
                        `input[name="topic-question-${index}"]:checked`
                    );


                const box =
                    document.querySelectorAll(
                        ".topic-question"
                    )[index];


                if (!selected) {
                    return;
                }


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


                    if (box) {

                        box.classList.add(
                            "question-correct"
                        );

                    }

                } else if (box) {

                    box.classList.add(
                        "question-wrong"
                    );

                }

            }
        );


    if (
        answered < 5
    ) {

        if (topicQuestionResult) {

            topicQuestionResult.textContent =
                "⚠️ Please answer all 5 questions before submitting.";

        }

        return;

    }


    topicQuestions.submitted =
        true;


    localStorage.setItem(
        "studyMindTopicQuestions",
        JSON.stringify(
            topicQuestions
        )
    );


    if (
        !completedQuestionTopics.includes(
            topicQuestions.topic
        )
    ) {

        completedQuestionTopics.push(
            topicQuestions.topic
        );

    }


    localStorage.setItem(
        "studyMindCompletedQuestionTopics",
        JSON.stringify(
            completedQuestionTopics
        )
    );


    document
        .querySelectorAll(
            "#topicQuestions input, #topicQuestionsSection input"
        )
        .forEach(
            input => {

                input.disabled =
                    true;

            }
        );


    if (submitTopicQuestions) {

        submitTopicQuestions.disabled =
            true;

        submitTopicQuestions.textContent =
            "✓ Questions Completed";

    }


    if (topicQuestionResult) {

        topicQuestionResult.innerHTML =
            `
                🧠 You scored
                <strong>
                    ${score}/5
                </strong>
                on the
                ${escapeHTML(
                    topicQuestions.topic
                )}
                knowledge check.

                <br><br>

                🎉 You've completed your
                5-question knowledge check
                for this topic.

            `;

    }

}


/* =========================================================
   RESTORE QUESTIONS
   ========================================================= */

function restoreTopicQuestions() {

    if (
        !topicQuestions ||
        !topicQuestions.topic ||
        !Array.isArray(
            topicQuestions.questions
        )
    ) {

        return;

    }


    const currentTopic =
        studyPlan.topics[
            currentTopicIndex
        ];


    const currentTopicName =
        getTopicName(
            currentTopic
        );


    /*
       Only show saved questions if they
       belong to the current topic.
    */

    if (
        currentTopicName &&
        topicQuestions.topic !==
        currentTopicName
    ) {

        return;

    }


    if (
        completedQuestionTopics.includes(
            topicQuestions.topic
        )
    ) {

        showTopicQuestionsFinished(
            topicQuestions.topic
        );

    } else {

        renderTopicQuestions(
            topicQuestions
        );

    }

}


/* =========================================================
   QUESTIONS FINISHED
   ========================================================= */

function showTopicQuestionsFinished(
    topic
) {

    if (!topicQuestionsSection) {
        return;
    }


    topicQuestionsSection.style.display =
        "block";


    if (topicQuestionsContainer) {

        topicQuestionsContainer.innerHTML =
            `
                <div class="ai-limit-message">

                    <h3>
                        🎉 Knowledge Check Completed
                    </h3>

                    <p>
                        You've already completed
                        the 5-question knowledge
                        check for
                        <strong>
                            ${escapeHTML(
                                topic
                            )}
                        </strong>.
                    </p>

                    <p>
                        There are no more free
                        questions for this topic.
                    </p>

                    <button
                        class="premium-button"
                        onclick="openPremiumOffer()"
                    >
                        💎 Explore Premium
                    </button>

                </div>
            `;

    }


    if (submitTopicQuestions) {

        submitTopicQuestions.disabled =
            true;

    }

}


/* =========================================================
   PREMIUM
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


    modal.innerHTML =
        `
            <div class="premium-modal-overlay">

                <div class="premium-modal">

                    <button
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
                        Unlimited AI help and
                        more study features
                        are coming soon.
                    </p>

                    <button
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


    const close =
        $("closePremiumButton");


    if (close) {

        close.addEventListener(
            "click",
            () =>
                modal.remove()
        );

    }


    const comingSoon =
        $("premiumComingSoonButton");


    if (comingSoon) {

        comingSoon.addEventListener(
            "click",
            () => {

                alert(
                    "Premium is coming soon! 🚀"
                );

            }
        );

    }

}


/* =========================================================
   JSON CLEANER
   ========================================================= */

function cleanJSONResponse(
    text
) {

    let cleaned =
        String(
            text
        ).trim();


    cleaned =
        cleaned.replace(
            /^```json\s*/i,
            ""
        );


    cleaned =
        cleaned.replace(
            /^```\s*/i,
            ""
        );


    cleaned =
        cleaned.replace(
            /\s*```$/i,
            ""
        );


    const first =
        cleaned.indexOf(
            "["
        );


    const last =
        cleaned.lastIndexOf(
            "]"
        );


    if (
        first !== -1 &&
        last !== -1 &&
        last > first
    ) {

        cleaned =
            cleaned.substring(
                first,
                last + 1
            );

    }


    return cleaned.trim();

}


/* =========================================================
   AI RESPONSE FORMATTER
   ========================================================= */

function renderAIResponse(
    text
) {

    if (!text) {
        return "";
    }


    let result =
        escapeHTML(
            text
        );


    /*
       Bold
    */

    result =
        result.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );


    /*
       Italic
    */

    result =
        result.replace(
            /(?<!\*)\*([^*\n]+)\*(?!\*)/g,
            "<em>$1</em>"
        );


    /*
       Headings
    */

    result =
        result.replace(
            /^### (.*)$/gm,
            "<h4>$1</h4>"
        );


    result =
        result.replace(
            /^## (.*)$/gm,
            "<h3>$1</h3>"
        );


    result =
        result.replace(
            /^# (.*)$/gm,
            "<h2>$1</h2>"
        );


    /*
       Bullet points
    */

    result =
        result.replace(
            /(?:^|\n)[ \t]*[-*][ \t]+(.+)(?=\n|$)/g,
            "\n<li>$1</li>"
        );


    result =
        result.replace(
            /((?:<li>.*?<\/li>\s*)+)/gs,
            "<ul>$1</ul>"
        );


    /*
       Paragraph spacing
    */

    result =
        result.replace(
            /\n{2,}/g,
            "<br><br>"
        );


    result =
        result.replace(
            /\n/g,
            "<br>"
        );


    return result;

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(
    value
) {

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


/* =========================================================
   MATH RENDERING
   ========================================================= */

function renderMath(
    container
) {

    if (
        !container
    ) {

        return;

    }


    /*
       MathJax may not be loaded.
       If it is available, render equations.
    */

    if (
        window.MathJax &&
        typeof window.MathJax.typesetPromise ===
        "function"
    ) {

        window.MathJax
            .typesetPromise(
                [container]
            )
            .catch(
                error =>
                    console.error(
                        "Math rendering error:",
                        error
                    )
            );

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
   NAVIGATION
   ========================================================= */

function openHome() {

    window.location.href =
        "home.html";

}


function openNewStudyPlan() {

    window.location.href =
        "home.html#generator";

}


/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.openHome =
    openHome;


window.openNewStudyPlan =
    openNewStudyPlan;


window.logoutStudyMind =
    logoutStudyMind;


window.openPremiumOffer =
    openPremiumOffer;


window.generateQuestionsForTopic =
    generateQuestionsForTopic;


window.getAIQuestionCount =
    getAIQuestionCount;


window.getRemainingAIQuestions =
    getRemainingAIQuestions;


/* =========================================================
   CROSS-TAB SYNCHRONIZATION
   ========================================================= */

window.addEventListener(
    "storage",
    event => {

        if (
            event.key ===
            "studyMindPlan" ||
            event.key ===
            "studyData"
        ) {

            loadStudyPlan();


            if (
                !hasUsableStudyPlan(
                    studyPlan
                )
            ) {

                return;

            }


            renderEverything();

        }


        if (
            event.key ===
            "aiQuestionCount"
        ) {

            aiQuestionCount =
                Number(
                    event.newValue
                ) || 0;


            setupAIAuthenticationUI();

        }


        if (
            event.key ===
            "summaryUsageCount"
        ) {

            summaryUsageCount =
                Number(
                    event.newValue
                ) || 0;


            updateSummaryBadge();

        }


        if (
            event.key ===
            "studyMindCompletedTopics"
        ) {

            completedTopics =
                loadArray(
                    "studyMindCompletedTopics"
                );


            updateDashboardProgress();

            renderTopics();

            renderCurrentTopic();

            renderCalendar();

        }

    }
);


/* =========================================================
   START DASHBOARD
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        startDashboard
    );

} else {

    startDashboard();

}

