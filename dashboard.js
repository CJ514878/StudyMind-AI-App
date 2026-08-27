/* =========================================================
   STUDYMIND AI — DASHBOARD JAVASCRIPT
   COMPLETE REPLACEMENT
   ========================================================= */


/* =========================================================
   AUTHENTICATION
   ========================================================= */

let currentUser = null;
let isAuthenticated = false;

async function checkAuthentication() {

    try {

        if (
            typeof supabaseClient !== "undefined" &&
            supabaseClient.auth
        ) {

            const {
                data: { user },
                error
            } = await supabaseClient.auth.getUser();

            if (error || !user) {

                currentUser = null;
                isAuthenticated = false;

                return false;
            }

            currentUser = user;
            isAuthenticated = true;

            return true;
        }

    } catch (error) {

        console.error(
            "Authentication check failed:",
            error
        );
    }

    currentUser = null;
    isAuthenticated = false;

    return false;
}


/* =========================================================
   DATE HELPERS
   ========================================================= */

function getLocalDateString(date = new Date()) {

    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


const todayStr = getLocalDateString();


/* =========================================================
   STUDY PLAN LOADING
   ========================================================= */

let studyPlan = null;

try {

    studyPlan = JSON.parse(
        localStorage.getItem("studyMindPlan")
    );

} catch (error) {

    console.error(
        "Could not load study plan:",
        error
    );
}


if (
    !studyPlan ||
    typeof studyPlan !== "object"
) {

    studyPlan = {

        examType: "WAEC",

        examDate: null,

        subjects: [
            "Mathematics",
            "English Language",
            "Physics",
            "Chemistry"
        ],

        topics: [

            {
                id: 1,
                name: "Algebraic Processes",
                subject: "Mathematics",
                description:
                    "Quadratic equations and simultaneous linear equations.",
                status: "In Progress"
            },

            {
                id: 2,
                name: "Mechanics & Motion",
                subject: "Physics",
                description:
                    "Newton's laws of motion and kinematics.",
                status: "Not Started"
            },

            {
                id: 3,
                name: "Grammatical Structure",
                subject: "English Language",
                description:
                    "Nouns, pronouns, and verb agreements.",
                status: "Not Started"
            }

        ],

        studyHours: 2,

        difficulty: "balanced",

        daysLeft: 30,

        studyStartDate: todayStr
    };

    localStorage.setItem(
        "studyMindPlan",
        JSON.stringify(studyPlan)
    );
}


/* =========================================================
   NORMALIZE STUDY PLAN
   ========================================================= */

if (!Array.isArray(studyPlan.subjects)) {

    studyPlan.subjects = [];
}


if (!Array.isArray(studyPlan.topics)) {

    studyPlan.topics = [];
}


if (!studyPlan.studyStartDate) {

    studyPlan.studyStartDate = todayStr;
}


if (
    studyPlan.daysLeft === undefined ||
    studyPlan.daysLeft === null
) {

    studyPlan.daysLeft = 30;
}


localStorage.setItem(
    "studyMindPlan",
    JSON.stringify(studyPlan)
);


/* =========================================================
   USAGE LIMITS
   ========================================================= */

const FREE_LIMIT = 5;


/* Ask AI usage */

let aiQuestionCount =
    Number(
        localStorage.getItem(
            "aiQuestionCount"
        )
    ) || 0;


/* Summarizer usage */

let summaryUsageCount =
    Number(
        localStorage.getItem(
            "summaryUsageCount"
        )
    ) || 0;


/* =========================================================
   PROGRESS DATA
   ========================================================= */

let completedTopics = [];

try {

    completedTopics =
        JSON.parse(
            localStorage.getItem(
                "studyMindCompletedTopics"
            )
        ) || [];

} catch {

    completedTopics = [];
}


if (!Array.isArray(completedTopics)) {

    completedTopics = [];
}


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
    ) || 1;


if (
    currentTopicIndex < 0 ||
    currentTopicIndex >= studyPlan.topics.length
) {

    currentTopicIndex = 0;
}


/* =========================================================
   DOM ELEMENTS
   ========================================================= */


/* Metrics */

const weeklyHours =
    document.getElementById(
        "weeklyHours"
    );

const daysLeft =
    document.getElementById(
        "daysLeft"
    );

const dailyGoal =
    document.getElementById(
        "dailyGoal"
    );

const studyScore =
    document.getElementById(
        "studyScore"
    );

const scoreDisplay =
    document.getElementById(
        "scoreDisplay"
    );

const scoreMessage =
    document.getElementById(
        "scoreMessage"
    );

const scoreProgressBar =
    document.getElementById(
        "scoreProgressBar"
    );

const streak =
    document.getElementById(
        "streak"
    );


/* Progress */

const progressBar =
    document.getElementById(
        "progressBar"
    );

const progressPercent =
    document.getElementById(
        "progressPercent"
    );

const progressCount =
    document.getElementById(
        "progressCount"
    );


/* Subjects */

const subjectList =
    document.getElementById(
        "subjectList"
    );


/* Topics */

const topicList =
    document.getElementById(
        "topicList"
    );


/* Current topic */

const currentTopicName =
    document.getElementById(
        "currentTopicName"
    );

const currentTopicDescription =
    document.getElementById(
        "currentTopicDescription"
    );

const topicStatusBadge =
    document.getElementById(
        "topicStatusBadge"
    );

const topicPosition =
    document.getElementById(
        "topicPosition"
    );

const topicCompleteCheckbox =
    document.getElementById(
        "topicCompleteCheckbox"
    );

const topicCompletionMessage =
    document.getElementById(
        "topicCompletionMessage"
    );

const nextTopicMessage =
    document.getElementById(
        "nextTopicMessage"
    );


/* Topic questions */

const topicQuestionsSection =
    document.getElementById(
        "topicQuestionsSection"
    );

const topicQuestions =
    document.getElementById(
        "topicQuestions"
    );

const submitTopicQuestions =
    document.getElementById(
        "submitTopicQuestions"
    );

const topicQuestionResult =
    document.getElementById(
        "topicQuestionResult"
    );


/* Timer */

const studyTimer =
    document.getElementById(
        "studyTimer"
    );

const startTimerButton =
    document.getElementById(
        "startTimerButton"
    );

const pauseTimerButton =
    document.getElementById(
        "pauseTimerButton"
    );

const resetTimerButton =
    document.getElementById(
        "resetTimerButton"
    );

const timerDurationSelect =
    document.getElementById(
        "timerDuration"
    );


/* Schedule */

const scheduleList =
    document.getElementById(
        "scheduleList"
    );


/* Calendar */

const calendarDays =
    document.getElementById(
        "calendarDays"
    );

const calendarMonth =
    document.getElementById(
        "calendarMonth"
    );

const previousMonth =
    document.getElementById(
        "previousMonth"
    );

const nextMonth =
    document.getElementById(
        "nextMonth"
    );

const nextBooking =
    document.getElementById(
        "nextBooking"
    );

const nextBookingTime =
    document.getElementById(
        "nextBookingTime"
    );


/* Theme */

const themeButton =
    document.getElementById(
        "themeButton"
    );


/* AI Analysis */

const analyzeProgressButton =
    document.getElementById(
        "analyzeProgressButton"
    );

const aiAdviceText =
    document.getElementById(
        "aiAdviceText"
    );


/* Ask AI */

const aiQuestion =
    document.getElementById(
        "aiQuestion"
    );

const askAIButton =
    document.getElementById(
        "askAIButton"
    );

const aiResponse =
    document.getElementById(
        "aiResponse"
    );

const aiCountBadge =
    document.getElementById(
        "aiCountBadge"
    );


/* Summarizer */

const summarizeInput =
    document.getElementById(
        "summarizeInput"
    );

const summarizeBtn =
    document.getElementById(
        "summarizeBtn"
    );

const summaryOutput =
    document.getElementById(
        "summaryOutput"
    );

const summaryCountBadge =
    document.getElementById(
        "summaryCountBadge"
    );


/* =========================================================
   DASHBOARD INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await checkAuthentication();

        renderMetrics();

        renderSubjects();

        renderTopics();

        renderCurrentTopic();

        renderSchedule();

        initializeCalendar();

        setupTimer();

        setupTopicCompletion();

        setupAIAnalysis();

        setupAskAI();

        setupSummarizer();

        setupTheme();

        calculateStudyScore();

    }
);


/* =========================================================
   METRICS
   ========================================================= */

function renderMetrics() {

    const hours =
        Number(
            studyPlan.studyHours
        ) || 2;


    if (weeklyHours) {

        weeklyHours.textContent =
            `${hours * 6} hrs`;
    }


    if (daysLeft) {

        let remaining =
            Number(
                studyPlan.daysLeft
            ) || 0;


        if (studyPlan.examDate) {

            const exam =
                new Date(
                    studyPlan.examDate +
                    "T00:00:00"
                );

            const today =
                new Date(
                    todayStr +
                    "T00:00:00"
                );

            remaining =
                Math.max(
                    0,
                    Math.ceil(
                        (
                            exam -
                            today
                        ) /
                        86400000
                    )
                );
        }


        daysLeft.textContent =
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


    updateProgress();
}


/* =========================================================
   PROGRESS
   ========================================================= */

function updateProgress() {

    const total =
        studyPlan.topics.length;


    const completed =
        completedTopics.length;


    const percentage =
        total > 0
            ? Math.round(
                (
                    completed /
                    total
                ) * 100
            )
            : 0;


    if (progressBar) {

        progressBar.style.width =
            `${percentage}%`;
    }


    if (progressPercent) {

        progressPercent.textContent =
            `${percentage}%`;
    }


    if (progressCount) {

        progressCount.textContent =
            `${completed} of ${total} topics completed`;
    }


    calculateStudyScore();
}


/* =========================================================
   SUBJECTS
   ========================================================= */

function renderSubjects() {

    if (!subjectList) return;


    if (
        !studyPlan.subjects ||
        studyPlan.subjects.length === 0
    ) {

        subjectList.innerHTML =
            `<p>No subjects added yet.</p>`;

        return;
    }


    subjectList.innerHTML =
        studyPlan.subjects
            .map(
                subject => `
                    <span class="badge badge-primary">
                        ${escapeHTML(subject)}
                    </span>
                `
            )
            .join("");
}


/* =========================================================
   TOPICS
   ========================================================= */

function renderTopics() {

    if (!topicList) return;


    if (
        !studyPlan.topics ||
        studyPlan.topics.length === 0
    ) {

        topicList.innerHTML =
            `<p>No topics available yet.</p>`;

        return;
    }


    topicList.innerHTML =
        studyPlan.topics
            .map(
                (topic, index) => {

                    const completed =
                        completedTopics.includes(
                            getTopicId(topic, index)
                        );


                    return `

                        <div
                            class="topic-card
                            ${index === currentTopicIndex
                                ? "active"
                                : ""}
                            ${completed
                                ? "completed"
                                : ""}"
                            data-topic-index="${index}"
                        >

                            <strong>
                                ${escapeHTML(
                                    topic.name ||
                                    "Untitled Topic"
                                )}
                            </strong>

                            <small>
                                (${escapeHTML(
                                    topic.subject ||
                                    "General"
                                )})
                            </small>

                            <p>
                                ${escapeHTML(
                                    topic.description ||
                                    "Study this topic and complete the knowledge check."
                                )}
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
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            card.dataset.topicIndex
                        );

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
        });
}


/* =========================================================
   CURRENT TOPIC
   ========================================================= */

function renderCurrentTopic() {

    const total =
        studyPlan.topics.length;


    if (
        total === 0 ||
        !studyPlan.topics[currentTopicIndex]
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


        return;
    }


    const topic =
        studyPlan.topics[
            currentTopicIndex
        ];


    const topicId =
        getTopicId(
            topic,
            currentTopicIndex
        );


    const completed =
        completedTopics.includes(
            topicId
        );


    if (currentTopicName) {

        currentTopicName.textContent =
            topic.name ||
            "Untitled Topic";
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
    }


    if (topicPosition) {

        topicPosition.textContent =
            `TOPIC ${currentTopicIndex + 1} OF ${total}`;
    }


    if (topicCompleteCheckbox) {

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

        if (completed) {

            nextTopicMessage.innerHTML =
                `
                    <strong>✓ Topic completed.</strong>
                    ${
                        currentTopicIndex <
                        total - 1
                            ? " Move on to your next topic."
                            : " You have completed all available topics!"
                    }
                `;

        } else {

            nextTopicMessage.innerHTML =
                "";
        }
    }
}


/* =========================================================
   TOPIC COMPLETION
   ========================================================= */

function setupTopicCompletion() {

    if (!topicCompleteCheckbox) return;


    topicCompleteCheckbox.addEventListener(
        "change",
        () => {

            if (
                !studyPlan.topics[
                    currentTopicIndex
                ]
            ) return;


            const topic =
                studyPlan.topics[
                    currentTopicIndex
                ];


            const topicId =
                getTopicId(
                    topic,
                    currentTopicIndex
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


                topic.status =
                    "Completed";


                if (
                    currentTopicIndex <
                    studyPlan.topics.length - 1
                ) {

                    currentTopicIndex++;

                    localStorage.setItem(
                        "studyMindCurrentTopicIndex",
                        String(
                            currentTopicIndex
                        )
                    );
                }


                localStorage.setItem(
                    "studyMindCompletedTopics",
                    JSON.stringify(
                        completedTopics
                    )
                );


                localStorage.setItem(
                    "studyMindPlan",
                    JSON.stringify(
                        studyPlan
                    )
                );


                currentStreak =
                    Math.max(
                        currentStreak,
                        1
                    );


                localStorage.setItem(
                    "studyMindStreak",
                    String(
                        currentStreak
                    )
                );


                renderMetrics();

                renderTopics();

                renderCurrentTopic();

                renderSchedule();

                renderCalendar();

            } else {

                const index =
                    completedTopics.indexOf(
                        topicId
                    );


                if (index !== -1) {

                    completedTopics.splice(
                        index,
                        1
                    );
                }


                topic.status =
                    "In Progress";


                localStorage.setItem(
                    "studyMindCompletedTopics",
                    JSON.stringify(
                        completedTopics
                    )
                );


                localStorage.setItem(
                    "studyMindPlan",
                    JSON.stringify(
                        studyPlan
                    )
                );


                renderMetrics();

                renderTopics();

                renderCurrentTopic();

                renderCalendar();
            }
        }
    );
}


/* =========================================================
   STUDY SCORE
   ========================================================= */

function calculateStudyScore() {

    const total =
        studyPlan.topics.length;


    const completed =
        completedTopics.length;


    const progress =
        total > 0
            ? completed / total
            : 0;


    const score =
        Math.round(
            progress * 100
        );


    if (studyScore) {

        studyScore.textContent =
            score;
    }


    if (scoreDisplay) {

        scoreDisplay.textContent =
            score;
    }


    if (scoreProgressBar) {

        scoreProgressBar.style.width =
            `${score}%`;
    }


    if (scoreMessage) {

        if (score === 0) {

            scoreMessage.textContent =
                "Start studying to build your score.";

        } else if (score < 40) {

            scoreMessage.textContent =
                "Good start. Keep completing your topics.";

        } else if (score < 70) {

            scoreMessage.textContent =
                "You're making solid progress.";

        } else if (score < 100) {

            scoreMessage.textContent =
                "Excellent progress. Keep going.";

        } else {

            scoreMessage.textContent =
                "Outstanding! You completed your study plan.";
        }
    }
}


/* =========================================================
   SCHEDULE
   ========================================================= */

function renderSchedule() {

    if (!scheduleList) return;


    const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ];


    let html = "";


    for (
        let i = 0;
        i < 7;
        i++
    ) {

        const date =
            new Date();


        date.setDate(
            date.getDate() + i
        );


        const dateString =
            getLocalDateString(
                date
            );


        const dayName =
            days[
                date.getDay()
            ];


        let type =
            "Study Day";


        let description =
            "Study your assigned topic.";


        let badgeClass =
            "badge-study";


        if (
            studyPlan.examDate &&
            dateString ===
            studyPlan.examDate
        ) {

            type =
                "Exam Day";

            description =
                "Exam day — stay calm and do your best.";

            badgeClass =
                "badge-exam";

        } else if (
            i === 3
        ) {

            type =
                "Test Day";

            description =
                "Review your work and test your understanding.";

            badgeClass =
                "badge-test";

        } else if (
            i === 6
        ) {

            type =
                "Rest Day";

            description =
                "Take time off to recharge.";

            badgeClass =
                "badge-rest";

        } else {

            const topic =
                studyPlan.topics[
                    i %
                    Math.max(
                        1,
                        studyPlan.topics.length
                    )
                ];


            description =
                topic
                    ? topic.name
                    : "Revision Session";
        }


        html += `

            <div
                class="schedule-item align-center justify-between"
                style="
                    padding:10px;
                    border-bottom:1px solid #eee;
                    display:flex;
                "
            >

                <div>

                    <strong>
                        ${dayName}
                    </strong>

                    <small>
                        (${date.toLocaleDateString()})
                    </small>

                    <div>

                        <small>
                            ${escapeHTML(
                                description
                            )}
                        </small>

                    </div>

                </div>

                <span
                    class="status-tag ${badgeClass}"
                    style="
                        padding:4px 8px;
                        border-radius:4px;
                        font-weight:bold;
                    "
                >
                    ${type}
                </span>

            </div>
        `;
    }


    scheduleList.innerHTML =
        html;


    updateNextSession();
}


/* =========================================================
   NEXT SESSION
   ========================================================= */

function updateNextSession() {

    if (
        !nextBooking ||
        !nextBookingTime
    ) return;


    if (
        studyPlan.topics.length === 0
    ) {

        nextBooking.textContent =
            "No upcoming session yet";

        nextBookingTime.textContent =
            "Create a study plan to populate your calendar.";

        return;
    }


    const topic =
        studyPlan.topics[
            currentTopicIndex
        ];


    nextBooking.textContent =
        topic
            ? topic.name
            : "Study Session";


    const tomorrow =
        new Date();


    tomorrow.setDate(
        tomorrow.getDate() + 1
    );


    nextBookingTime.textContent =
        tomorrow.toLocaleDateString(
            "en-US",
            {
                weekday: "long",
                month: "long",
                day: "numeric"
            }
        );
}


/* =========================================================
   TIMER
   ========================================================= */

const DEFAULT_TIMER_SECONDS =
    60 * 60;


let selectedTimerSeconds =
    Number(
        localStorage.getItem(
            "studyMindSelectedTimerSeconds"
        )
    ) ||
    DEFAULT_TIMER_SECONDS;


let timerSeconds =
    Number(
        localStorage.getItem(
            "studyMindTimerSeconds"
        )
    ) ||
    selectedTimerSeconds;


let timerInterval =
    null;


let timerRunning =
    false;


let timerEndTime =
    null;


function setupTimer() {

    if (!studyTimer) return;


    updateTimerDisplay();

    updateTimerButtons();


    if (startTimerButton) {

        startTimerButton.onclick =
            startTimer;
    }


    if (pauseTimerButton) {

        pauseTimerButton.onclick =
            pauseTimer;
    }


    if (resetTimerButton) {

        resetTimerButton.onclick =
            resetTimer;
    }


    if (timerDurationSelect) {

        timerDurationSelect.value =
            String(
                selectedTimerSeconds /
                60
            );


        timerDurationSelect.onchange =
            event => {

                const minutes =
                    Number(
                        event.target.value
                    );


                if (
                    !minutes ||
                    minutes <= 0
                ) return;


                selectedTimerSeconds =
                    minutes * 60;


                localStorage.setItem(
                    "studyMindSelectedTimerSeconds",
                    String(
                        selectedTimerSeconds
                    )
                );


                resetTimer();
            };
    }
}


function startTimer() {

    if (timerRunning) return;


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


    updateTimerButtons();


    timerInterval =
        setInterval(
            () => {

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

                    clearInterval(
                        timerInterval
                    );


                    timerInterval =
                        null;


                    timerRunning =
                        false;


                    updateTimerButtons();


                    alert(
                        "⏰ Study Session Complete! Great job maintaining focus."
                    );
                }

            },
            250
        );
}


function pauseTimer() {

    if (!timerRunning) return;


    clearInterval(
        timerInterval
    );


    timerInterval =
        null;


    timerRunning =
        false;


    localStorage.setItem(
        "studyMindTimerSeconds",
        String(
            timerSeconds
        )
    );


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


    timerSeconds =
        selectedTimerSeconds;


    localStorage.setItem(
        "studyMindTimerSeconds",
        String(
            timerSeconds
        )
    );


    updateTimerDisplay();

    updateTimerButtons();
}


function updateTimerDisplay() {

    if (!studyTimer) return;


    const minutes =
        Math.floor(
            timerSeconds /
            60
        );


    const seconds =
        timerSeconds %
        60;


    studyTimer.textContent =
        `${String(
            minutes
        ).padStart(2, "0")}:${String(
            seconds
        ).padStart(2, "0")}`;
}


function updateTimerButtons() {

    if (startTimerButton) {

        startTimerButton.disabled =
            timerRunning;
    }


    if (pauseTimerButton) {

        pauseTimerButton.disabled =
            !timerRunning;
    }
}


/* =========================================================
   CALENDAR
   ========================================================= */

let calendarDate =
    new Date();


function initializeCalendar() {

    renderCalendar();


    if (previousMonth) {

        previousMonth.onclick =
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


    if (nextMonth) {

        nextMonth.onclick =
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
}


function renderCalendar() {

    if (
        !calendarDays ||
        !calendarMonth
    ) return;


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
                month: "long",
                year: "numeric"
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
            "calendar-day other-month";


        calendarDays.appendChild(
            empty
        );
    }


    for (
        let date = 1;
        date <= daysInMonth;
        date++
    ) {

        const day =
            document.createElement(
                "div"
            );


        day.className =
            "calendar-day";


        day.textContent =
            date;


        const thisDate =
            new Date(
                year,
                month,
                date
            );


        const dateString =
            getLocalDateString(
                thisDate
            );


        if (
            dateString ===
            todayStr
        ) {

            day.classList.add(
                "today"
            );
        }


        if (
            studyPlan.examDate &&
            dateString ===
            studyPlan.examDate
        ) {

            day.classList.add(
                "exam-day"
            );

            day.title =
                "Exam Day";
        }


        const topicIndex =
            getStudyDayTopicIndex(
                thisDate
            );


        if (
            topicIndex !== null &&
            studyPlan.topics[
                topicIndex
            ]
        ) {

            const topic =
                studyPlan.topics[
                    topicIndex
                ];


            const topicId =
                getTopicId(
                    topic,
                    topicIndex
                );


            if (
                completedTopics.includes(
                    topicId
                )
            ) {

                day.classList.add(
                    "completed-day"
                );
            }
        }


        calendarDays.appendChild(
            day
        );
    }
}


/* =========================================================
   CALENDAR TOPIC HELPER
   ========================================================= */

function getStudyDayTopicIndex(
    date
) {

    if (
        studyPlan.topics.length === 0
    ) {

        return null;
    }


    const start =
        new Date(
            studyPlan.studyStartDate ||
            todayStr
        );


    start.setHours(
        0,
        0,
        0,
        0
    );


    const current =
        new Date(
            date
        );


    current.setHours(
        0,
        0,
        0,
        0
    );


    const difference =
        Math.floor(
            (
                current -
                start
            ) /
            86400000
        );


    if (
        difference < 0
    ) {

        return null;
    }


    return (
        difference %
        studyPlan.topics.length
    );
}


/* =========================================================
   REAL ASK AI CONNECTION
   ========================================================= */

function setupAskAI() {

    updateAIUsageBadge();


    if (
        !askAIButton ||
        !aiQuestion
    ) return;


    askAIButton.addEventListener(
        "click",
        sendQuestionToAI
    );


    aiQuestion.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendQuestionToAI();
            }
        }
    );


    if (
        aiQuestionCount >=
        FREE_LIMIT
    ) {

        lockAskAI();
    }
}


/* =========================================================
   SEND QUESTION TO REAL OPENAI BACKEND
   ========================================================= */

async function sendQuestionToAI() {

    const message =
        aiQuestion.value.trim();


    if (!message) {

        aiQuestion.focus();

        return;
    }


    if (
        aiQuestionCount >=
        FREE_LIMIT
    ) {

        showAIError(
            "You have used all 5 free AI questions."
        );

        return;
    }


    addChatMessage(
        "user",
        message
    );


    aiQuestion.value =
        "";


    askAIButton.disabled =
        true;


    aiQuestion.disabled =
        true;


    const originalButtonText =
        askAIButton.innerHTML;


    askAIButton.innerHTML =
        "⏳ Thinking...";


    const typingMessage =
        addTypingMessage();


    try {

        const context =
            buildStudyContext();


        const fullMessage =
            `
Student study information:

Exam type:
${context.examType}

Subjects:
${context.subjects}

Current topic:
${context.currentTopic}

Current topic description:
${context.currentTopicDescription}

Topics completed:
${context.completedTopics} of ${context.totalTopics}

Study progress:
${context.progress}%

Daily study goal:
${context.studyHours} hours

Days remaining:
${context.daysLeft}

Student question:
${message}
            `.trim();


        const response =
            await fetch(
                "/api/ask-ai",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            message:
                                fullMessage
                        })
                }
            );


        let data = null;


        try {

            data =
                await response.json();

        } catch {

            data = null;
        }


        if (!response.ok) {

            throw new Error(
                data?.error ||
                "The AI server returned an error."
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


        removeTypingMessage(
            typingMessage
        );


        addChatMessage(
            "ai",
            data.reply
        );


        aiQuestionCount++;


        localStorage.setItem(
            "aiQuestionCount",
            String(
                aiQuestionCount
            )
        );


        updateAIUsageBadge();


        if (
            aiQuestionCount >=
            FREE_LIMIT
        ) {

            lockAskAI();
        }


    } catch (error) {

        console.error(
            "Ask AI error:",
            error
        );


        removeTypingMessage(
            typingMessage
        );


        addChatMessage(
            "ai",
            `Sorry, I couldn't connect to StudyMind AI right now.

${error.message}

Please check that your Vercel API route and OPENAI_API_KEY are configured correctly.`
        );

    } finally {

        if (
            aiQuestionCount <
            FREE_LIMIT
        ) {

            askAIButton.disabled =
                false;

            aiQuestion.disabled =
                false;
        }


        askAIButton.innerHTML =
            originalButtonText;
    }
}


/* =========================================================
   AI STUDY CONTEXT
   ========================================================= */

function buildStudyContext() {

    const total =
        studyPlan.topics.length;


    const completed =
        completedTopics.length;


    const progress =
        total > 0
            ? Math.round(
                (
                    completed /
                    total
                ) * 100
            )
            : 0;


    const current =
        studyPlan.topics[
            currentTopicIndex
        ];


    return {

        examType:
            studyPlan.examType ||
            "School-Based Tests",

        subjects:
            studyPlan.subjects.length
                ? studyPlan.subjects.join(
                    ", "
                )
                : "No subjects specified",

        currentTopic:
            current?.name ||
            "No current topic",

        currentTopicDescription:
            current?.description ||
            "No description available",

        completedTopics:
            completed,

        totalTopics:
            total,

        progress,

        studyHours:
            studyPlan.studyHours ||
            2,

        daysLeft:
            studyPlan.daysLeft ??
            "Not specified"
    };
}


/* =========================================================
   CHAT MESSAGE RENDERING
   ========================================================= */

function addChatMessage(
    sender,
    message
) {

    if (!aiResponse) return;


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        sender === "user"
            ? "ai-chat-message user-message"
            : "ai-chat-message assistant-message";


    const label =
        document.createElement(
            "strong"
        );


    label.textContent =
        sender === "user"
            ? "You"
            : "🤖 StudyMind AI";


    const content =
        document.createElement(
            "div"
        );


    content.className =
        "ai-chat-content";


    content.innerHTML =
        formatAIResponse(
            message
        );


    wrapper.appendChild(
        label
    );


    wrapper.appendChild(
        content
    );


    aiResponse.appendChild(
        wrapper
    );


    renderMath(
        content
    );


    aiResponse.scrollTop =
        aiResponse.scrollHeight;
}


/* =========================================================
   TYPING INDICATOR
   ========================================================= */

function addTypingMessage() {

    if (!aiResponse) return null;


    const typing =
        document.createElement(
            "div"
        );


    typing.className =
        "ai-chat-message assistant-message ai-typing";


    typing.innerHTML =
        `
            <strong>
                🤖 StudyMind AI
            </strong>

            <div class="ai-chat-content">
                <span>Thinking</span>
                <span>.</span>
                <span>.</span>
                <span>.</span>
            </div>
        `;


    aiResponse.appendChild(
        typing
    );


    aiResponse.scrollTop =
        aiResponse.scrollHeight;


    return typing;
}


function removeTypingMessage(
    element
) {

    if (
        element &&
        element.parentNode
    ) {

        element.parentNode.removeChild(
            element
        );
    }
}


/* =========================================================
   AI RESPONSE FORMATTING
   ========================================================= */

function formatAIResponse(
    text
) {

    if (!text) return "";


    let safe =
        escapeHTML(
            String(text)
        );


    /*
       Protect LaTeX before formatting
       markdown.
    */

    const mathBlocks = [];


    safe =
        safe.replace(
            /\\\[([\s\S]*?)\\\]/g,
            (_, equation) => {

                const index =
                    mathBlocks.length;


                mathBlocks.push(
                    `\\[${equation}\\]`
                );


                return `@@MATHBLOCK${index}@@`;
            }
        );


    safe =
        safe.replace(
            /\\\(([\s\S]*?)\\\)/g,
            (_, equation) => {

                const index =
                    mathBlocks.length;


                mathBlocks.push(
                    `\\(${equation}\\)`
                );


                return `@@MATHINLINE${index}@@`;
            }
        );


    /* Bold */

    safe =
        safe.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );


    /*
       Convert simple bullet lists.
    */

    const lines =
        safe.split("\n");


    let output = "";


    let inList =
        false;


    for (
        const line of lines
    ) {

        const trimmed =
            line.trim();


        if (
            /^[-*•]\s+/.test(
                trimmed
            )
        ) {

            if (!inList) {

                output +=
                    "<ul>";

                inList =
                    true;
            }


            const item =
                trimmed.replace(
                    /^[-*•]\s+/,
                    ""
                );


            if (item.trim()) {

                output +=
                    `<li>${item}</li>`;
            }


            continue;
        }


        if (inList) {

            output +=
                "</ul>";

            inList =
                false;
        }


        if (!trimmed) {

            output +=
                "<br>";

        } else if (
            /^@@MATH/.test(
                trimmed
            )
        ) {

            output +=
                `<div>${trimmed}</div>`;

        } else {

            output +=
                `<p>${trimmed}</p>`;
        }
    }


    if (inList) {

        output +=
            "</ul>";
    }


    /*
       Restore LaTeX.
    */

    mathBlocks.forEach(
        (equation, index) => {

            output =
                output.replace(
                    `@@MATHBLOCK${index}@@`,
                    equation
                );


            output =
                output.replace(
                    `@@MATHINLINE${index}@@`,
                    equation
                );
        }
    );


    return output;
}


/* =========================================================
   KATEX
   ========================================================= */

function renderMath(
    element
) {

    if (
        !element ||
        typeof renderMathInElement !==
        "undefined"
    ) {

        /*
           KaTeX auto-render may not be
           globally available immediately
           depending on CDN loading.
        */
    }


    if (
        element &&
        typeof renderMathInElement ===
        "function"
    ) {

        try {

            renderMathInElement(
                element,
                {
                    delimiters: [

                        {
                            left: "\\[",
                            right: "\\]",
                            display: true
                        },

                        {
                            left: "\\(",
                            right: "\\)",
                            display: false
                        }

                    ],

                    throwOnError:
                        false
                }
            );

        } catch (error) {

            console.warn(
                "KaTeX rendering failed:",
                error
            );
        }
    }
}


/* =========================================================
   AI USAGE BADGE
   ========================================================= */

function updateAIUsageBadge() {

    if (!aiCountBadge) return;


    aiCountBadge.textContent =
        `${aiQuestionCount}/${FREE_LIMIT} used`;
}


function lockAskAI() {

    if (aiQuestion) {

        aiQuestion.disabled =
            true;

        aiQuestion.placeholder =
            "Free AI limit reached.";
    }


    if (askAIButton) {

        askAIButton.disabled =
            true;

        askAIButton.textContent =
            "🔒 Free Limit Reached";
    }
}


/* =========================================================
   AI PROGRESS ANALYSIS
   ========================================================= */

function setupAIAnalysis() {

    if (!analyzeProgressButton) return;


    analyzeProgressButton.addEventListener(
        "click",
        async () => {

            const total =
                studyPlan.topics.length;


            const completed =
                completedTopics.length;


            const percentage =
                total > 0
                    ? Math.round(
                        (
                            completed /
                            total
                        ) * 100
                    )
                    : 0;


            if (aiAdviceText) {

                aiAdviceText.textContent =
                    "📊 Analyzing your study progress...";
            }


            analyzeProgressButton.disabled =
                true;


            try {

                const context =
                    buildStudyContext();


                const message =
                    `
Analyze this student's study progress and give concise, useful educational advice.

Exam type: ${context.examType}
Subjects: ${context.subjects}
Current topic: ${context.currentTopic}
Topics completed: ${context.completedTopics}/${context.totalTopics}
Progress: ${percentage}%
Daily study goal: ${context.studyHours} hours
Days remaining: ${context.daysLeft}

Give practical advice on what the student should focus on next.
Do not invent information.
                    `.trim();


                const response =
                    await fetch(
                        "/api/ask-ai",
                        {
                            method: "POST",

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


                if (aiAdviceText) {

                    aiAdviceText.innerHTML =
                        `
                            <strong>
                                📊 Your Study Analysis
                            </strong>

                            <div>
                                ${formatAIResponse(
                                    data.reply
                                )}
                            </div>
                        `;


                    renderMath(
                        aiAdviceText
                    );
                }

            } catch (error) {

                console.error(
                    "Progress analysis error:",
                    error
                );


                if (aiAdviceText) {

                    aiAdviceText.textContent =
                        "Unable to connect to StudyMind AI right now. Please try again.";
                }

            } finally {

                analyzeProgressButton.disabled =
                    false;
            }
        }
    );
}


/* =========================================================
   DOCUMENT SUMMARIZER
   ========================================================= */

function setupSummarizer() {

    updateSummaryBadge();


    if (
        !summarizeBtn ||
        !summarizeInput
    ) return;


    summarizeBtn.addEventListener(
        "click",
        async () => {

            const content =
                summarizeInput.value.trim();


            if (!content) {

                alert(
                    "Please paste your study material first."
                );

                return;
            }


            if (
                summaryUsageCount >=
                FREE_LIMIT
            ) {

                alert(
                    "🔒 You have reached your 5 free document summaries."
                );

                return;
            }


            summarizeBtn.disabled =
                true;


            const originalText =
                summarizeBtn.innerHTML;


            summarizeBtn.innerHTML =
                "⏳ Summarizing...";


            try {

                const examContext =
                    studyPlan.examType ||
                    "WAEC";


                const message =
                    `
Summarize the following study material for a student preparing for ${examContext}.

Focus on:
- Key concepts
- Important definitions
- Important formulas
- Exam-relevant points
- Easy-to-revise explanations

Study material:

${content}
                    `.trim();


                const response =
                    await fetch(
                        "/api/ask-ai",
                        {
                            method: "POST",

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


                summaryUsageCount++;


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

                                <div class="summary-ai-content">
                                    ${formatAIResponse(
                                        data.reply
                                    )}
                                </div>

                            </div>
                        `;


                    renderMath(
                        summaryOutput
                    );


                    summaryOutput.scrollIntoView(
                        {
                            behavior: "smooth",
                            block: "nearest"
                        }
                    );
                }


                if (
                    summaryUsageCount >=
                    FREE_LIMIT
                ) {

                    summarizeInput.disabled =
                        true;

                    summarizeBtn.disabled =
                        true;

                    summarizeBtn.innerText =
                        "🔒 Free Limit Reached";
                }

            } catch (error) {

                console.error(
                    "Summarizer error:",
                    error
                );


                if (summaryOutput) {

                    summaryOutput.innerHTML =
                        `
                            <p>
                                ❌ Unable to connect
                                to StudyMind AI.
                                Please try again.
                            </p>
                        `;
                }

            } finally {

                if (
                    summaryUsageCount <
                    FREE_LIMIT
                ) {

                    summarizeBtn.disabled =
                        false;

                    summarizeBtn.innerHTML =
                        "✨ Summarize Notes";
                }
            }
        }
    );
}


/* =========================================================
   SUMMARY BADGE
   ========================================================= */

function updateSummaryBadge() {

    if (!summaryCountBadge) return;


    summaryCountBadge.textContent =
        `${summaryUsageCount}/${FREE_LIMIT} used`;
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

    if (!themeButton) return;


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
   HELPERS
   ========================================================= */

function getTopicId(
    topic,
    index
) {

    if (
        topic &&
        topic.id !== undefined &&
        topic.id !== null
    ) {

        return String(
            topic.id
        );
    }


    return `topic-${index}`;
}


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
   STORAGE SYNC
   ========================================================= */

window.addEventListener(
    "storage",
    event => {

        if (
            event.key ===
            "studyMindPlan"
        ) {

            try {

                const updated =
                    JSON.parse(
                        event.newValue
                    );


                if (
                    updated &&
                    typeof updated ===
                    "object"
                ) {

                    studyPlan =
                        updated;


                    renderMetrics();

                    renderSubjects();

                    renderTopics();

                    renderCurrentTopic();

                    renderSchedule();

                    renderCalendar();
                }

            } catch {

                console.warn(
                    "Could not sync updated study plan."
                );
            }
        }
    }
);


/* =========================================================
   AUTO-SAVE BEFORE LEAVING
   ========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        localStorage.setItem(
            "studyMindPlan",
            JSON.stringify(
                studyPlan
            )
        );


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
    }
);
