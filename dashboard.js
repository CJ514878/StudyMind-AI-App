/* =========================================================
   STUDYMIND AI — DASHBOARD JAVASCRIPT
   COMPLETE REPLACEMENT
   VERSION: TOPIC FIX + 25 MIN TIMER + AI + SUMMARY
   ========================================================= */


/* =========================================================
   CONFIGURATION
   ========================================================= */

const FREE_QUESTION_LIMIT = 5;
const FREE_SUMMARY_LIMIT = 5;

const DEFAULT_TIMER_SECONDS =
    25 * 60;

const DAY_MS =
    24 * 60 * 60 * 1000;


/* =========================================================
   BASIC HELPERS
   ========================================================= */

const $ = id =>
    document.getElementById(id);


function safeJSONParse(
    value,
    fallback = null
) {

    try {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            return fallback;

        }

        return JSON.parse(value);

    } catch {

        return fallback;

    }

}


function loadArray(key) {

    const value =
        safeJSONParse(
            localStorage.getItem(key),
            []
        );

    return Array.isArray(value)
        ? value
        : [];

}


function loadObject(key) {

    const value =
        safeJSONParse(
            localStorage.getItem(key),
            null
        );

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


function getStoredPositiveNumber(
    key,
    fallback
) {

    const value =
        Number(
            localStorage.getItem(key)
        );

    return (
        Number.isFinite(value) &&
        value > 0
    )
        ? value
        : fallback;

}


/* =========================================================
   HTML ESCAPING
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


function todayKey() {

    const date =
        new Date();

    return [
        date.getFullYear(),
        String(
            date.getMonth() + 1
        ).padStart(2, "0"),
        String(
            date.getDate()
        ).padStart(2, "0")
    ].join("-");

}


function formatDateKey(
    date
) {

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


function parseDate(
    value
) {

    if (!value) {
        return null;
    }


    let date;


    if (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {

        date =
            new Date(
                `${value}T00:00:00`
            );

    } else {

        date =
            new Date(value);

    }


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;

    }


    return startOfDay(date);

}


/* =========================================================
   AUTHENTICATION
   ========================================================= */

let currentUser =
    null;

let isAuthenticated =
    false;


async function checkAuthentication() {

    try {

        if (
            typeof supabaseClient !==
                "undefined" &&
            supabaseClient &&
            supabaseClient.auth
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
                data &&
                data.user
            ) {

                currentUser =
                    data.user;

                isAuthenticated =
                    true;

                return true;

            }

        }

    } catch (error) {

        console.error(
            "Authentication check failed:",
            error
        );

    }


    /*
       Fallback for local development
       or older StudyMind versions.
    */

    const localLoggedIn =
        localStorage.getItem(
            "studyMindLoggedIn"
        ) === "true" ||
        localStorage.getItem(
            "isLoggedIn"
        ) === "true";


    if (localLoggedIn) {

        isAuthenticated =
            true;

        currentUser =
            safeJSONParse(
                localStorage.getItem(
                    "currentUser"
                ),
                null
            );

        return true;

    }


    currentUser =
        null;

    isAuthenticated =
        false;

    return false;

}


/* =========================================================
   STUDY PLAN
   ========================================================= */

let studyPlan =
    null;


function loadStudyPlan() {

    let savedPlan =
        null;


    /*
       Main StudyMind storage.
    */

    savedPlan =
        safeJSONParse(
            localStorage.getItem(
                "studyMindPlan"
            ),
            null
        );


    /*
       Older version compatibility.
    */

    if (
        !savedPlan ||
        typeof savedPlan !== "object"
    ) {

        savedPlan =
            safeJSONParse(
                localStorage.getItem(
                    "studyData"
                ),
                null
            );

    }


    if (
        savedPlan &&
        typeof savedPlan === "object"
    ) {

        studyPlan =
            savedPlan;

    } else {

        studyPlan = {

            examType:
                "No exam selected",

            examDate:
                null,

            subjects:
                [],

            topics:
                [],

            studyHours:
                0,

            difficulty:
                "balanced",

            daysLeft:
                0,

            studyStartDate:
                todayKey()

        };

    }


    normalizeStudyPlan();

}


/* =========================================================
   NORMALIZE STUDY PLAN
   ========================================================= */

function normalizeStudyPlan() {

    if (
        !studyPlan ||
        typeof studyPlan !== "object"
    ) {

        studyPlan = {};

    }


    if (
        !Array.isArray(
            studyPlan.subjects
        )
    ) {

        studyPlan.subjects =
            [];

    }


    /*
       Remove empty subjects but preserve
       actual names supplied by the student.
    */

    studyPlan.subjects =
        studyPlan.subjects
            .map(
                subject =>
                    typeof subject === "object"
                        ? (
                            subject.name ||
                            subject.subject ||
                            subject.title ||
                            ""
                        )
                        : String(subject)
            )
            .map(
                subject =>
                    subject.trim()
            )
            .filter(Boolean);


    if (
        !Array.isArray(
            studyPlan.topics
        )
    ) {

        /*
           Support older versions which may
           have used another topic property.
        */

        studyPlan.topics =
            Array.isArray(
                studyPlan.topicList
            )
                ? studyPlan.topicList
                : Array.isArray(
                    studyPlan.curriculumTopics
                )
                    ? studyPlan.curriculumTopics
                    : [];

    }


    /*
       Normalize every topic while preserving
       the actual name entered/generated.
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


    if (
        !studyPlan.studyStartDate
    ) {

        studyPlan.studyStartDate =
            todayKey();

    }


    if (
        studyPlan.examDate
    ) {

        const exam =
            parseDate(
                studyPlan.examDate
            );

        if (exam) {

            studyPlan.examDate =
                formatDateKey(exam);

        }

    }


    if (
        studyPlan.studyHours ===
            undefined ||
        studyPlan.studyHours ===
            null
    ) {

        studyPlan.studyHours =
            0;

    }


    localStorage.setItem(
        "studyMindPlan",
        JSON.stringify(
            studyPlan
        )
    );

}


/* =========================================================
   TOPIC NAME — IMPORTANT FIX
   ========================================================= */

function getTopicName(
    topic
) {

    if (
        topic === null ||
        topic === undefined
    ) {

        return "";

    }


    /*
       If topic is already a string.
    */

    if (
        typeof topic === "string"
    ) {

        return topic.trim();

    }


    /*
       If topic is an object, check
       every format used by previous
       StudyMind versions.
    */

    if (
        typeof topic === "object"
    ) {

        const possibleNames = [

            topic.name,

            topic.topic,

            topic.title,

            topic.topicName,

            topic.subjectTopic,

            topic.label,

            topic.text,

            topic.value,

            topic.data?.name,

            topic.data?.topic,

            topic.data?.title,

            topic.data?.topicName

        ];


        for (
            const value of possibleNames
        ) {

            if (
                typeof value ===
                    "string" &&
                value.trim()
            ) {

                return value.trim();

            }

        }

    }


    return "";

}


/* =========================================================
   NORMALIZE TOPIC
   ========================================================= */

function normalizeTopic(
    topic,
    index
) {

    const actualName =
        getTopicName(
            topic
        );


    if (
        topic &&
        typeof topic === "object" &&
        !Array.isArray(topic)
    ) {

        return {

            ...topic,

            id:
                topic.id ??
                topic.topicId ??
                topic.topic_id ??
                `topic-${index + 1}`,

            name:
                actualName ||
                `Topic ${index + 1}`,

            subject:
                String(
                    topic.subject ??
                    topic.subjectName ??
                    ""
                ),

            description:
                String(
                    topic.description ??
                    topic.desc ??
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
            `topic-${index + 1}`,

        name:
            actualName ||
            `Topic ${index + 1}`,

        subject:
            "",

        description:
            "",

        status:
            "Not Started"

    };

}


/* =========================================================
   TOPIC ID
   ========================================================= */

function getTopicId(
    topic,
    index
) {

    if (
        topic &&
        typeof topic === "object"
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


        if (
            topic.topicId !==
                undefined &&
            topic.topicId !==
                null
        ) {

            return String(
                topic.topicId
            );

        }

    }


    const name =
        getTopicName(
            topic
        );


    if (name) {

        return (
            "topic-" +
            name
                .toLowerCase()
                .replace(
                    /[^a-z0-9]+/gi,
                    "-"
                )
                .replace(
                    /^-+|-+$/g,
                    ""
                ) +
            "-" +
            index
        );

    }


    return `topic-${index}`;

}


/* =========================================================
   SAVE PLAN
   ========================================================= */

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
   PROGRESS STORAGE
   ========================================================= */

let completedTopics =
    loadArray(
        "studyMindCompletedTopics"
    );


let completedQuestionTopics =
    loadArray(
        "studyMindCompletedQuestionTopics"
    );


let completedSubjects =
    loadArray(
        "studyMindCompletedSubjects"
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


/* =========================================================
   QUESTION STORAGE
   ========================================================= */

let topicQuestions =
    loadObject(
        "studyMindTopicQuestions"
    );


/* =========================================================
   AI USAGE
   ========================================================= */

let aiQuestionCount =
    getStoredNumber(
        "aiQuestionCount",
        0
    );


let summaryUsageCount =
    getStoredNumber(
        "summaryUsageCount",
        0
    );


/* =========================================================
   TIMER STORAGE
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


if (
    timerSeconds < 0
) {

    timerSeconds =
        selectedTimerSeconds;

}


let timerRunning =
    false;


let timerEndTime =
    null;


let timerInterval =
    null;


/* =========================================================
   CALENDAR
   ========================================================= */

let calendarDate =
    new Date();


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

/* Metrics */

const weeklyHours =
    $("weeklyHours");

const daysLeftElement =
    $("daysLeft");

const dailyGoal =
    $("dailyGoal");

const streak =
    $("streak");

const studyScore =
    $("studyScore");


/* Subjects */

const subjectList =
    $("subjectList");


/* Topics */

const topicList =
    $("topicList");


/* Progress */

const progressPercent =
    $("progressPercent");

const progressCount =
    $("progressCount");

const progressBar =
    $("progressBar");


/* Score */

const scoreDisplay =
    $("scoreDisplay");

const scoreProgressBar =
    $("scoreProgressBar");

const scoreMessage =
    $("scoreMessage");


/* Current Topic */

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


/* Topic Questions */

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


/* Calendar */

const calendarDays =
    $("calendarDays");

const calendarMonth =
    $("calendarMonth");

const previousMonth =
    $("previousMonth");

const nextMonth =
    $("nextMonth");


/* Schedule */

const scheduleList =
    $("scheduleList");

const nextBooking =
    $("nextBooking");

const nextBookingTime =
    $("nextBookingTime");


/* Timer */

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


/* AI */

const analyzeProgressButton =
    $("analyzeProgressButton");

const aiAdviceText =
    $("aiAdviceText");

const askAIButton =
    $("askAIButton");

const aiQuestion =
    $("aiQuestion");

const aiResponse =
    $("aiResponse");

const aiCountBadge =
    $("aiCountBadge");


/* Summary */

const summarizeInput =
    $("summarizeInput");

const summarizeBtn =
    $("summarizeBtn");

const summaryOutput =
    $("summaryOutput");

const summaryCountBadge =
    $("summaryCountBadge");


/* Theme */

const themeButton =
    $("themeButton");


/* =========================================================
   CURRENT TOPIC INDEX SAFETY
   ========================================================= */

function normalizeCurrentTopicIndex() {

    const total =
        studyPlan &&
        Array.isArray(
            studyPlan.topics
        )
            ? studyPlan.topics.length
            : 0;


    if (
        total === 0
    ) {

        currentTopicIndex =
            0;

        return;

    }


    currentTopicIndex =
        Math.max(
            0,
            Math.min(
                Number(
                    currentTopicIndex
                ) || 0,
                total - 1
            )
        );


    localStorage.setItem(
        "studyMindCurrentTopicIndex",
        String(
            currentTopicIndex
        )
    );

}


/* =========================================================
   TOPIC COMPLETION CHECK
   ========================================================= */

function isTopicCompleted(
    topic,
    index
) {

    const topicId =
        getTopicId(
            topic,
            index
        );


    const topicName =
        getTopicName(
            topic
        );


    return (
        completedTopics.includes(
            topicId
        ) ||
        (
            topicName &&
            completedTopics.includes(
                topicName
            )
        )
    );

}


/* =========================================================
   GET REAL PROGRESS
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
   DASHBOARD STATS
   ========================================================= */

function calculateDaysLeft() {

    if (
        !studyPlan ||
        !studyPlan.examDate
    ) {

        return (
            Number(
                studyPlan?.daysLeft
            ) || 0
        );

    }


    const today =
        startOfDay(
            new Date()
        );


    const exam =
        parseDate(
            studyPlan.examDate
        );


    if (!exam) {

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


function updateDashboardStats() {

    const hours =
        Number(
            studyPlan?.studyHours
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


    if (
        subjects.length === 0
    ) {

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


    if (
        topics.length === 0
    ) {

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
                        ) ||
                        `Topic ${index + 1}`;


                    const topicId =
                        getTopicId(
                            topic,
                            index
                        );


                    const completed =
                        isTopicCompleted(
                            topic,
                            index
                        );


                    const subject =
                        topic &&
                        typeof topic ===
                            "object"
                            ? topic.subject ||
                              topic.subjectName ||
                              "General"
                            : "General";


                    const description =
                        topic &&
                        typeof topic ===
                            "object"
                            ? topic.description ||
                              topic.desc ||
                              "Study this topic and complete the knowledge check."
                            : "Study this topic and complete the knowledge check.";


                    return `
                        <div
                            class="topic-card
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
                            }"
                            data-topic-index="${index}"
                            data-topic-id="${escapeHTML(
                                topicId
                            )}"
                        >

                            <strong>
                                ${escapeHTML(
                                    name
                                )}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    subject
                                )}
                            </small>

                            <p>
                                ${escapeHTML(
                                    description
                                )}
                            </p>

                            <span>
                                ${
                                    completed
                                        ? "✓ Completed"
                                        : escapeHTML(
                                            topic?.status ||
                                            "In Progress"
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

                        restoreTopicQuestions();

                    }
                );

            }
        );

}


/* =========================================================
   PROGRESS
   ========================================================= */

function updateDashboardProgress() {

    const {
        total,
        completed,
        percent
    } =
        getProgress();


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

        if (
            percent === 0
        ) {

            scoreMessage.textContent =
                "Start studying to build your score.";

        } else if (
            percent < 50
        ) {

            scoreMessage.textContent =
                "Good start. Keep building your momentum.";

        } else if (
            percent < 80
        ) {

            scoreMessage.textContent =
                "You're making solid progress. Keep going.";

        } else if (
            percent < 100
        ) {

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


        if (nextTopicMessage) {

            nextTopicMessage.textContent =
                "";

        }


        return;

    }


    normalizeCurrentTopicIndex();


    const topic =
        topics[
            currentTopicIndex
        ];


    const name =
        getTopicName(
            topic
        ) ||
        `Topic ${currentTopicIndex + 1}`;


    const completed =
        isTopicCompleted(
            topic,
            currentTopicIndex
        );


    /*
       THIS IS THE IMPORTANT FIX.
       The dashboard now gets the real topic
       through getTopicName() instead of
       relying only on topic.name.
    */

    if (currentTopicName) {

        currentTopicName.textContent =
            name;

    }


    if (currentTopicDescription) {

        const description =
            topic &&
            typeof topic ===
                "object"
                ? (
                    topic.description ||
                    topic.desc ||
                    topic.details ||
                    ""
                )
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
                : (
                    topic?.status ||
                    "IN PROGRESS"
                ).toUpperCase();


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
                ) ||
                `Topic ${
                    currentTopicIndex + 2
                }`;


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

    if (
        !topicCompleteCheckbox ||
        !studyPlan.topics.length
    ) {

        return;

    }


    const topic =
        studyPlan.topics[
            currentTopicIndex
        ];


    if (!topic) {
        return;
    }


    const topicId =
        getTopicId(
            topic,
            currentTopicIndex
        );


    const topicName =
        getTopicName(
            topic
        );


    if (
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
           Keep topic name for compatibility
           with older StudyMind progress.
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


        updateStreak();


        if (
            currentTopicIndex <
            studyPlan.topics.length - 1
        ) {

            currentTopicIndex++;

        }


        if (topicCompletionMessage) {

            topicCompletionMessage.textContent =
                "✓ Topic marked as completed.";

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


    localStorage.setItem(
        "studyMindCurrentTopicIndex",
        String(
            currentTopicIndex
        )
    );


    savePlan();


    updateDashboardStats();

    updateDashboardProgress();

    renderTopics();

    renderCurrentTopic();

    renderCalendar();

}


/* =========================================================
   STREAK
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


    const yesterdayKey =
        formatDateKey(
            yesterday
        );


    if (
        lastStudyDate ===
        yesterdayKey
    ) {

        currentStreak++;

    } else {

        currentStreak =
            1;

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
   CALENDAR — STUDY / BREAK / EXAM
   ========================================================= */

function getStudyPlanStartDate() {

    const start =
        parseDate(
            studyPlan.studyStartDate
        );


    if (start) {

        return start;

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

    return parseDate(
        studyPlan.examDate
    );

}


function isExamDay(
    date
) {

    const exam =
        getExamDate();


    return (
        !!exam &&
        startOfDay(date).getTime() ===
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
            ) /
            DAY_MS
        );


    /*
       0-5 = Study
       6   = Break
       7-12 = Study
       13  = Break
       etc.
    */

    return (
        daysSinceStart % 7 ===
        6
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
       Keep the calendar grid at 42 cells.
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
   CALENDAR BUTTONS
   ========================================================= */

function setupCalendar() {

    if (previousMonth) {

        previousMonth.addEventListener(
            "click",
            () => {

                calendarDate =
                    new Date(
                        calendarDate.getFullYear(),
                        calendarDate.getMonth() - 1,
                        1
                    );

                renderCalendar();

            }
        );

    }


    if (nextMonth) {

        nextMonth.addEventListener(
            "click",
            () => {

                calendarDate =
                    new Date(
                        calendarDate.getFullYear(),
                        calendarDate.getMonth() + 1,
                        1
                    );

                renderCalendar();

            }
        );

    }

}


/* =========================================================
   TIME FORMAT
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

        displayHour =
            12;

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
   SCHEDULE
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
        subjects.length === 0 ||
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
                endMinutes +
                15;

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


    if (
        subjects.length === 0
    ) {

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
                            ) /
                            1000
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
                    ) /
                    1000
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


    if (
        timerSeconds < 0
    ) {

        timerSeconds =
            selectedTimerSeconds;

    }

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


    timerEndTime =
        Date.now() +
        (
            timerSeconds *
            1000
        );


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
   PAUSE TIMER
   ========================================================= */

function pauseTimer() {

    if (
        !timerRunning
    ) {

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


    if (
        showAlert
    ) {

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
   TIMER DURATION
   ========================================================= */

function syncTimerDurationControl() {

    if (
        !timerDurationSelect
    ) {

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
            )
                .find(
                    option =>
                        Number(
                            option.value
                        ) === minutes
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


function handleTimerDurationChange() {

    if (
        !timerDurationSelect
    ) {

        return;

    }


    const value =
        Number(
            timerDurationSelect.value
        );


    if (
        !Number.isFinite(
            value
        ) ||
        value <= 0
    ) {

        return;

    }


    const newDuration =
        value <= 300
            ? value * 60
            : value;


    selectedTimerSeconds =
        newDuration;


    localStorage.setItem(
        "studyMindSelectedTimerSeconds",
        String(
            selectedTimerSeconds
        )
    );


    resetTimer();

    renderSchedule();

}


/* =========================================================
   SETUP TIMER
   ========================================================= */

function setupTimer() {

    ensureTimerStorage();

    restoreTimerState();

    syncTimerDurationControl();

    updateTimerDisplay();

    updateTimerButtons();


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

}


/* =========================================================
   AI QUESTION COUNT
   ========================================================= */

function getAIQuestionCount() {

    aiQuestionCount =
        getStoredNumber(
            "aiQuestionCount",
            0
        );


    return aiQuestionCount;

}


function getRemainingAIQuestions() {

    return Math.max(
        0,
        FREE_QUESTION_LIMIT -
        getAIQuestionCount()
    );

}


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
   AI BADGE
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
   AI LOGIN MESSAGE
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
                    id="aiLoginButton"
                >
                    🔑 Login
                </button>

            </div>
        `;


    const loginButton =
        $("aiLoginButton");


    if (loginButton) {

        loginButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "login.html";

            }
        );

    }

}


/* =========================================================
   AI LIMIT MESSAGE
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
                    id="askAIPremiumButton"
                >
                    💎 Explore Premium
                </button>

            </div>
        `;


    const button =
        $("askAIPremiumButton");


    if (button) {

        button.addEventListener(
            "click",
            openPremiumOffer
        );

    }

}


/* =========================================================
   STUDY CONTEXT
   ========================================================= */

function buildStudyContext() {

    const {
        total,
        completed,
        percent
    } =
        getProgress();


    const current =
        studyPlan.topics[
            currentTopicIndex
        ];


    return {

        examType:
            studyPlan.examType ||
            "School-Based Tests",

        examDate:
            studyPlan.examDate ||
            "Not specified",

        subjects:
            studyPlan.subjects.length
                ? studyPlan.subjects.join(
                    ", "
                )
                : "No subjects specified",

        currentTopic:
            getTopicName(
                current
            ) ||
            "No current topic",

        currentTopicDescription:
            current?.description ||
            "No description available",

        completedTopics:
            completed,

        totalTopics:
            total,

        progress:
            percent,

        studyHours:
            Number(
                studyPlan.studyHours
            ) || 0,

        daysLeft:
            calculateDaysLeft()

    };

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
            String(text)
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
       Bullet points.
    */

    result =
        result.replace(
            /(?:^|\n)[ \t]*[-*•][ \t]+(.+)(?=\n|$)/g,
            "\n<li>$1</li>"
        );


    result =
        result.replace(
            /((?:<li>.*?<\/li>\s*)+)/gs,
            "<ul>$1</ul>"
        );


    /*
       Paragraph spacing.
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
   MATH RENDERING
   ========================================================= */

function renderMath(
    container
) {

    if (!container) {
        return;
    }


    /*
       KaTeX.
    */

    if (
        typeof renderMathInElement ===
        "function"
    ) {

        try {

            renderMathInElement(
                container,
                {

                    delimiters: [

                        {
                            left:
                                "\\[",

                            right:
                                "\\]",

                            display:
                                true

                        },

                        {
                            left:
                                "\\(",

                            right:
                                "\\)",

                            display:
                                false

                        }

                    ],

                    throwOnError:
                        false

                }
            );

        } catch (error) {

            console.warn(
                "Math rendering failed:",
                error
            );

        }

        return;

    }


    /*
       MathJax fallback.
    */

    if (
        window.MathJax &&
        typeof
            window.MathJax.typesetPromise ===
            "function"
    ) {

        window.MathJax
            .typesetPromise(
                [container]
            )
            .catch(
                error =>
                    console.warn(
                        "MathJax rendering failed:",
                        error
                    )
            );

    }

}


/* =========================================================
   ASK AI
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
        getAIQuestionCount() >=
        FREE_QUESTION_LIMIT
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


    /*
       Only record the question AFTER
       the server successfully answers it.
       This prevents failed requests
       from charging the student.
    */

    try {

        const context =
            buildStudyContext();


        const message =
            `
You are StudyMind AI, a professional educational assistant helping a secondary-school student.

STUDENT STUDY INFORMATION

Exam type:
${context.examType}

Exam date:
${context.examDate}

Days remaining:
${context.daysLeft}

Subjects:
${context.subjects}

Current topic:
${context.currentTopic}

Current topic description:
${context.currentTopicDescription}

Topics completed:
${context.completedTopics} of ${context.totalTopics}

Progress:
${context.progress}%

Daily study hours:
${context.studyHours}

STUDENT'S QUESTION:

${question}

Answer clearly and accurately.

Use the student's actual study information when relevant.

If the student asks what they should study next, use their actual subjects, topics and progress.

Do not invent subjects, topics, dates or progress.

Keep the response helpful and readable.
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


        /*
           Successful request:
           NOW consume one free question.
        */

        recordAIQuestion();


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
            count >=
            FREE_QUESTION_LIMIT;

        aiQuestion.placeholder =
            count >=
            FREE_QUESTION_LIMIT
                ? "Free AI limit reached."
                : "Ask anything about your study plan...";

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
   AI ENTER KEY
   ========================================================= */

function setupAIEvents() {

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

}


/* =========================================================
   AI PROGRESS ANALYSIS
   ========================================================= */

async function analyzeProgress() {

    if (!isAuthenticated) {

        showAILoginMessage(
            aiAdviceText
        );

        return;

    }


    if (!aiAdviceText) {
        return;
    }


    const context =
        buildStudyContext();


    if (analyzeProgressButton) {

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
You are StudyMind AI helping a secondary-school student.

Analyze the student's current study progress.

Exam type:
${context.examType}

Exam date:
${context.examDate}

Subjects:
${context.subjects}

Current topic:
${context.currentTopic}

Topics completed:
${context.completedTopics} of ${context.totalTopics}

Progress:
${context.progress}%

Daily study hours:
${context.studyHours}

Days remaining:
${context.daysLeft}

Give practical advice about what the student should focus on next.

Use only the information provided.
Do not invent subjects, topics or dates.
Keep the advice concise and useful.
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


        if (
            !response.ok
        ) {

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

        if (analyzeProgressButton) {

            analyzeProgressButton.disabled =
                false;

            analyzeProgressButton.innerHTML =
                "🔍 Analyze My Progress";

        }

    }

}


/* =========================================================
   SETUP AI ANALYSIS
   ========================================================= */

function setupAIAnalysis() {

    if (
        analyzeProgressButton
    ) {

        analyzeProgressButton.addEventListener(
            "click",
            analyzeProgress
        );

    }

}


/* =========================================================
   SUMMARY USAGE
   ========================================================= */

function getSummaryUsageCount() {

    summaryUsageCount =
        getStoredNumber(
            "summaryUsageCount",
            0
        );


    return summaryUsageCount;

}


function updateSummaryBadge() {

    const count =
        getSummaryUsageCount();


    if (summaryCountBadge) {

        summaryCountBadge.textContent =
            `${count}/${FREE_SUMMARY_LIMIT} used`;

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
                    id="summaryPremiumButton"
                >
                    💎 Explore Premium
                </button>

            </div>
        `;


    const button =
        $("summaryPremiumButton");


    if (button) {

        button.addEventListener(
            "click",
            openPremiumOffer
        );

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

        const context =
            buildStudyContext();


        const message =
            `
Summarize the following study material for a secondary-school student preparing for ${context.examType}.

CURRENT STUDY CONTEXT:

Subjects:
${context.subjects}

Current topic:
${context.currentTopic}

Focus on:

- Key concepts
- Important definitions
- Important formulas
- Exam-relevant points
- Important facts
- Easy-to-revise explanations

Keep the summary concise but useful for exam revision.

Do not invent information.

STUDY MATERIAL:

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


        if (
            !response.ok
        ) {

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


        /*
           Only count successful summaries.
        */

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
                                context.examType
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

            if (
                summaryUsageCount >=
                FREE_SUMMARY_LIMIT
            ) {

                summarizeBtn.disabled =
                    true;

                summarizeBtn.innerHTML =
                    "🔒 Free Limit Reached";

            } else {

                summarizeBtn.disabled =
                    false;

                summarizeBtn.innerHTML =
                    "✨ Summarize Notes";

            }

        }

    }

}


/* =========================================================
   SETUP SUMMARIZER
   ========================================================= */

function setupSummarizer() {

    updateSummaryBadge();


    if (summarizeBtn) {

        summarizeBtn.addEventListener(
            "click",
            summarizeDocument
        );

    }

}


/* =========================================================
   TOPIC KNOWLEDGE CHECK
   ========================================================= */

function cleanJSONResponse(
    text
) {

    let cleaned =
        String(
            text || ""
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

        if (topicQuestionsContainer) {

            topicQuestionsContainer.innerHTML =
                `
                    <p>
                        Unable to identify this topic.
                        Please create the study plan again.
                    </p>
                `;

        }

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
- Make the questions relevant to the topic.
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


        if (
            !response.ok
        ) {

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
            safeJSONParse(
                cleanJSONResponse(
                    data.reply
                ),
                null
            );


        if (
            !Array.isArray(
                questions
            ) ||
            questions.length <
                5
        ) {

            throw new Error(
                "The AI did not return 5 valid questions."
            );

        }


        /*
           Validate the five questions.
        */

        const validQuestions =
            questions
                .slice(
                    0,
                    5
                )
                .filter(
                    question =>
                        question &&
                        typeof question.question ===
                            "string" &&
                        Array.isArray(
                            question.options
                        ) &&
                        question.options.length >=
                            4 &&
                        Number.isFinite(
                            Number(
                                question.answer
                            )
                        )
                )
                .map(
                    question => ({

                        question:
                            question.question,

                        options:
                            question.options
                                .slice(
                                    0,
                                    4
                                ),

                        answer:
                            Number(
                                question.answer
                            )

                    })
                );


        if (
            validQuestions.length !==
            5
        ) {

            throw new Error(
                "The AI did not return 5 valid questions."
            );

        }


        topicQuestions = {

            topic:
                topicName,

            questions:
                validQuestions,

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
                        topic
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
        .slice(
            0,
            5
        )
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
                                question.question
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


    let score =
        0;


    let answered =
        0;


    topicQuestions.questions
        .slice(
            0,
            5
        )
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
        answered <
        5
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


    if (
        currentTopicName &&
        topicQuestions.topic !==
        currentTopicName
    ) {

        if (
            topicQuestionsSection
        ) {

            topicQuestionsSection.style.display =
                "none";

        }

        return;

    }


    if (
        completedQuestionTopics.includes(
            topicQuestions.topic
        ) ||
        topicQuestions.submitted
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
                        You can review this topic
                        or continue to your next one.
                    </p>

                </div>
            `;

    }


    if (submitTopicQuestions) {

        submitTopicQuestions.disabled =
            true;

    }

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
   TOPIC QUESTION SETUP
   ========================================================= */

function setupTopicQuestions() {

    if (
        submitTopicQuestions
    ) {

        submitTopicQuestions.addEventListener(
            "click",
            submitQuestions
        );

    }

}


/* =========================================================
   TOPIC COMPLETION SETUP
   ========================================================= */

function setupTopicCompletion() {

    if (
        topicCompleteCheckbox
    ) {

        topicCompleteCheckbox.addEventListener(
            "change",
            completeCurrentTopic
        );

    }

}


/* =========================================================
   THEME
   ========================================================= */

function setupTheme() {

    const savedTheme =
        localStorage.getItem(
            "studyMindTheme"
        );


    if (
        savedTheme ===
        "dark"
    ) {

        document.body.classList.add(
            "dark-mode"
        );

    }


    updateThemeButton();


    if (themeButton) {

        themeButton.addEventListener(
            "click",
            () => {

                document.body.classList.toggle(
                    "dark-mode"
                );


                const dark =
                    document.body.classList.contains(
                        "dark-mode"
                    );


                localStorage.setItem(
                    "studyMindTheme",
                    dark
                        ? "dark"
                        : "light"
                );


                updateThemeButton();

            }
        );

    }

}


function updateThemeButton() {

    if (!themeButton) {
        return;
    }


    const dark =
        document.body.classList.contains(
            "dark-mode"
        );


    themeButton.textContent =
        dark
            ? "☀️ Light Mode"
            : "🌙 Dark Mode";

}


/* =========================================================
   RENDER EVERYTHING
   ========================================================= */

function renderEverything() {

    normalizeStudyPlan();

    normalizeCurrentTopicIndex();

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

    updateAIBadge();

    updateSummaryBadge();

    setupAIAuthenticationUI();

    restoreTopicQuestions();

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
   STORAGE SYNCHRONIZATION
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

            normalizeCurrentTopicIndex();

            renderEverything();

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


        if (
            event.key ===
                "studyMindCurrentTopicIndex"
        ) {

            currentTopicIndex =
                Number(
                    event.newValue
                ) || 0;


            normalizeCurrentTopicIndex();

            renderTopics();

            renderCurrentTopic();

            restoreTopicQuestions();

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

    }
);


/* =========================================================
   AUTO SAVE
   ========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        savePlan();


        localStorage.setItem(
            "studyMindCompletedTopics",
            JSON.stringify(
                completedTopics
            )
        );


        localStorage.setItem(
            "studyMindCompletedQuestionTopics",
            JSON.stringify(
                completedQuestionTopics
            )
        );


        localStorage.setItem(
            "studyMindCurrentTopicIndex",
            String(
                currentTopicIndex
            )
        );


        localStorage.setItem(
            "studyMindTimerSeconds",
            String(
                timerSeconds
            )
        );

    }
);


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
   START DASHBOARD
   ========================================================= */

async function startDashboard() {

    console.log(
        "StudyMind AI dashboard starting..."
    );


    /*
       Reload the newest plan before
       rendering anything.
    */

    loadStudyPlan();


    normalizeCurrentTopicIndex();


    /*
       Authentication is checked without
       preventing the dashboard from rendering
       its saved study-plan data.
    */

    await checkAuthentication();


    /*
       Setup controls.
    */

    setupCalendar();

    setupTimer();

    setupTopicCompletion();

    setupTopicQuestions();

    setupAIEvents();

    setupAIAnalysis();

    setupSummarizer();

    setupTheme();


    /*
       Render the complete dashboard.
    */

    renderEverything();


    console.log(
        "StudyMind AI dashboard initialized."
    );

}


/* =========================================================
   DOM READY
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        startDashboard,
        {
            once:
                true
        }
    );

} else {

    startDashboard();

}
