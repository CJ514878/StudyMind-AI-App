/* =========================================
   STUDYMIND AI — DASHBOARD JAVASCRIPT
   FULL VERSION — MATCHED TO DASHBOARD.HTML
========================================= */


/* =========================================
   AUTHENTICATION & USER STATE
========================================= */

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


/* =========================================
   DATE
========================================= */

const todayStr =
    new Date().toISOString().split("T")[0];


/* =========================================
   STUDY PLAN
========================================= */

let studyPlan = null;

try {

    studyPlan =
        JSON.parse(
            localStorage.getItem("studyMindPlan")
        );

} catch (error) {

    console.error(
        "Could not load study plan:",
        error
    );
}


/*
   IMPORTANT:
   Only use defaults if no plan exists.
   This prevents the dashboard from
   replacing the student's actual data.
*/

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
                    "Quadratic equations and simultaneous linear equations",
                status: "In Progress"
            },

            {
                id: 2,
                name: "Mechanics & Motion",
                subject: "Physics",
                description:
                    "Newton's laws of motion and kinematics",
                status: "Not Started"
            },

            {
                id: 3,
                name: "Grammatical Structure",
                subject: "English Language",
                description:
                    "Nouns, pronouns and verb agreements",
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


/* =========================================
   NORMALIZE STUDY PLAN DATA
========================================= */

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
    studyPlan.studyHours === undefined ||
    studyPlan.studyHours === null
) {

    studyPlan.studyHours = 2;
}

if (!studyPlan.examType) {

    studyPlan.examType = "WAEC";
}

localStorage.setItem(
    "studyMindPlan",
    JSON.stringify(studyPlan)
);


/* =========================================
   FREE USAGE LIMITS
========================================= */

const FREE_LIMIT = 5;


/* =========================================
   AI QUESTION USAGE
========================================= */

let aiQuestionCount =
    Number(
        localStorage.getItem(
            "aiQuestionCount"
        )
    ) || 0;


/* =========================================
   SUMMARY USAGE
========================================= */

let summaryUsageCount =
    Number(
        localStorage.getItem(
            "summaryUsageCount"
        )
    ) || 0;


/* =========================================
   PROGRESS DATA
========================================= */

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


/* =========================================
   DOM ELEMENTS
========================================= */


/* ---------- Statistics ---------- */

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

const scoreProgressBar =
    document.getElementById(
        "scoreProgressBar"
    );

const scoreMessage =
    document.getElementById(
        "scoreMessage"
    );

const streak =
    document.getElementById(
        "streak"
    );


/* ---------- Progress ---------- */

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


/* ---------- Subjects / Topics ---------- */

const subjectList =
    document.getElementById(
        "subjectList"
    );

const topicList =
    document.getElementById(
        "topicList"
    );


/* ---------- Current Topic ---------- */

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


/* ---------- Topic Questions ---------- */

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


/* ---------- Timer ---------- */

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


/* ---------- Calendar ---------- */

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


/* ---------- Summarizer ---------- */

const summarizeBtn =
    document.getElementById(
        "summarizeBtn"
    );

const summarizeInput =
    document.getElementById(
        "summarizeInput"
    );

const summaryOutput =
    document.getElementById(
        "summaryOutput"
    );

const summaryCountBadge =
    document.getElementById(
        "summaryCountBadge"
    );


/* ---------- AI Assistant ---------- */

const analyzeProgressButton =
    document.getElementById(
        "analyzeProgressButton"
    );

const aiAdviceText =
    document.getElementById(
        "aiAdviceText"
    );

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


/* ---------- Theme ---------- */

const themeButton =
    document.getElementById(
        "themeButton"
    );


/* =========================================
   DASHBOARD INITIALIZATION
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await checkAuthentication();

        renderMetrics();

        renderSubjectsAndTopics();

        renderCurrentTopic();

        renderProgress();

        renderSchedule();

        renderCalendar();

        setupTimer();

        setupTopicCompletion();

        setupTopicQuestions();

        setupSummarizer();

        setupAskAI();

        setupProgressAnalysis();

        setupTheme();

        setupCalendarNavigation();

        updateNextSession();
    }
);


/* =========================================
   METRICS
========================================= */

function renderMetrics() {

    const hours =
        Number(
            studyPlan.studyHours
        ) || 2;

    if (weeklyHours) {

        weeklyHours.textContent =
            `${hours * 6} hrs`;
    }

    if (dailyGoal) {

        dailyGoal.textContent =
            `${hours} hrs/day`;
    }

    calculateDaysLeft();

    if (streak) {

        streak.textContent =
            `${currentStreak} Days 🔥`;
    }

    calculateStudyScore();
}


/* =========================================
   CALCULATE DAYS LEFT
========================================= */

function calculateDaysLeft() {

    if (!daysLeft) return;

    if (!studyPlan.examDate) {

        daysLeft.textContent =
            studyPlan.daysLeft || 0;

        return;
    }

    const today =
        new Date();

    const exam =
        new Date(
            studyPlan.examDate
        );

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
        exam - today;

    const days =
        Math.max(
            0,
            Math.ceil(
                difference /
                (1000 * 60 * 60 * 24)
            )
        );

    daysLeft.textContent =
        days;
}


/* =========================================
   SUBJECTS & TOPICS
========================================= */

function renderSubjectsAndTopics() {

    /* ---------- Subjects ---------- */

    if (subjectList) {

        if (
            studyPlan.subjects.length === 0
        ) {

            subjectList.innerHTML =
                "<p>No subjects added yet.</p>";

        } else {

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
    }


    /* ---------- Topics ---------- */

    if (topicList) {

        if (
            studyPlan.topics.length === 0
        ) {

            topicList.innerHTML =
                "<p>No topics added yet.</p>";

        } else {

            topicList.innerHTML =
                studyPlan.topics
                    .map(
                        (topic, index) => {

                            const completed =
                                isTopicCompleted(
                                    topic,
                                    index
                                );

                            return `
                                <div
                                    class="topic-card ${
                                        index === currentTopicIndex
                                            ? "active"
                                            : ""
                                    } ${
                                        completed
                                            ? "completed"
                                            : ""
                                    }"
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
                                                    "In Progress"
                                                )
                                        }
                                    </span>

                                </div>
                            `;
                        }
                    )
                    .join("");
        }
    }


    /* ---------- Click topic ---------- */

    if (topicList) {

        const cards =
            topicList.querySelectorAll(
                "[data-topic-index]"
            );

        cards.forEach(card => {

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

                    renderSubjectsAndTopics();

                    renderCurrentTopic();
                }
            );
        });
    }
}


/* =========================================
   CURRENT TOPIC
========================================= */

function renderCurrentTopic() {

    if (
        studyPlan.topics.length === 0
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

        return;
    }


    if (
        currentTopicIndex < 0 ||
        currentTopicIndex >=
        studyPlan.topics.length
    ) {

        currentTopicIndex = 0;
    }


    const topic =
        studyPlan.topics[
            currentTopicIndex
        ];


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


    if (topicPosition) {

        topicPosition.textContent =
            `TOPIC ${
                currentTopicIndex + 1
            } OF ${
                studyPlan.topics.length
            }`;
    }


    const completed =
        isTopicCompleted(
            topic,
            currentTopicIndex
        );


    if (topicStatusBadge) {

        topicStatusBadge.textContent =
            completed
                ? "COMPLETED"
                : (
                    topic.status ||
                    "IN PROGRESS"
                );
    }


    if (topicCompleteCheckbox) {

        topicCompleteCheckbox.checked =
            completed;
    }


    if (topicCompletionMessage) {

        topicCompletionMessage.textContent =
            completed
                ? "This topic has been completed. Great work!"
                : "Tick this box when you are done studying this topic.";
    }


    if (topicQuestionsSection) {

        topicQuestionsSection.style.display =
            completed
                ? "block"
                : "none";
    }


    renderTopicQuestions();
}


/* =========================================
   TOPIC COMPLETION
========================================= */

function setupTopicCompletion() {

    if (!topicCompleteCheckbox) return;

    topicCompleteCheckbox.addEventListener(
        "change",
        () => {

            const topic =
                studyPlan.topics[
                    currentTopicIndex
                ];

            if (!topic) return;


            if (
                topicCompleteCheckbox.checked
            ) {

                if (
                    !completedTopics.includes(
                        currentTopicIndex
                    )
                ) {

                    completedTopics.push(
                        currentTopicIndex
                    );
                }

                topic.status =
                    "Completed";

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
                        1,
                        currentStreak + 1
                    );

                localStorage.setItem(
                    "studyMindStreak",
                    String(
                        currentStreak
                    )
                );

                if (topicCompletionMessage) {

                    topicCompletionMessage.textContent =
                        "Excellent! Topic completed.";
                }

                renderProgress();

                renderMetrics();

                renderSubjectsAndTopics();

                renderCurrentTopic();

                moveToNextTopic();

            } else {

                completedTopics =
                    completedTopics.filter(
                        index =>
                            index !==
                            currentTopicIndex
                    );

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

                renderProgress();

                renderMetrics();

                renderSubjectsAndTopics();

                renderCurrentTopic();
            }
        }
    );
}


/* =========================================
   TOPIC COMPLETION CHECK
========================================= */

function isTopicCompleted(
    topic,
    index
) {

    return (
        completedTopics.includes(index) ||
        topic.status === "Completed"
    );
}


/* =========================================
   MOVE TO NEXT TOPIC
========================================= */

function moveToNextTopic() {

    const nextIndex =
        currentTopicIndex + 1;


    if (
        nextIndex <
        studyPlan.topics.length
    ) {

        if (nextTopicMessage) {

            nextTopicMessage.innerHTML =
                `
                <strong>✓ Topic completed!</strong>
                <br>
                Your next topic is
                <strong>
                    ${escapeHTML(
                        studyPlan.topics[
                            nextIndex
                        ].name
                    )}
                </strong>.
                `;
        }

        currentTopicIndex =
            nextIndex;

        localStorage.setItem(
            "studyMindCurrentTopicIndex",
            String(
                currentTopicIndex
            )
        );

    } else {

        if (nextTopicMessage) {

            nextTopicMessage.innerHTML =
                `
                <strong>🎉 All topics completed!</strong>
                <br>
                Excellent work. You have completed your current study plan.
                `;
        }
    }
}


/* =========================================
   PROGRESS
========================================= */

function renderProgress() {

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


/* =========================================
   STUDY SCORE
========================================= */

function calculateStudyScore() {

    const total =
        studyPlan.topics.length;

    const completed =
        completedTopics.length;


    let score = 0;


    if (total > 0) {

        score =
            Math.round(
                (
                    completed /
                    total
                ) * 100
            );
    }


    /* Add a small consistency component */

    const consistencyBonus =
        Math.min(
            10,
            Math.max(
                0,
                currentStreak - 1
            )
        );


    score =
        Math.min(
            100,
            Math.round(
                score * 0.9 +
                consistencyBonus
            )
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

        if (score >= 90) {

            scoreMessage.textContent =
                "Outstanding performance. Keep it up!";

        } else if (score >= 70) {

            scoreMessage.textContent =
                "Great progress. Keep pushing!";

        } else if (score >= 40) {

            scoreMessage.textContent =
                "You're making progress. Stay consistent.";

        } else {

            scoreMessage.textContent =
                "Start studying to build your score.";
        }
    }
}


/* =========================================
   TIMER
========================================= */

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

let timerInterval = null;

let timerRunning = false;

let timerEndTime = null;


/* ---------- Setup ---------- */

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
            Math.round(
                selectedTimerSeconds /
                60
            );


        timerDurationSelect.addEventListener(
            "change",
            event => {

                const minutes =
                    Number(
                        event.target.value
                    );


                if (minutes > 0) {

                    selectedTimerSeconds =
                        minutes * 60;

                    localStorage.setItem(
                        "studyMindSelectedTimerSeconds",
                        String(
                            selectedTimerSeconds
                        )
                    );

                    resetTimer();
                }
            }
        );
    }
}


/* ---------- Start ---------- */

function startTimer() {

    if (timerRunning) return;


    if (timerSeconds <= 0) {

        timerSeconds =
            selectedTimerSeconds;
    }


    timerRunning = true;


    timerEndTime =
        Date.now() +
        (
            timerSeconds *
            1000
        );


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


/* ---------- Pause ---------- */

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


/* ---------- Reset ---------- */

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


/* ---------- Display ---------- */

function updateTimerDisplay() {

    if (!studyTimer) return;


    const minutes =
        Math.floor(
            timerSeconds / 60
        );

    const seconds =
        timerSeconds % 60;


    studyTimer.textContent =
        `${String(
            minutes
        ).padStart(2, "0")}:${String(
            seconds
        ).padStart(2, "0")}`;
}


/* ---------- Buttons ---------- */

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


/* =========================================
   TOPIC KNOWLEDGE CHECK
========================================= */

let generatedTopicQuestions = [];


function setupTopicQuestions() {

    if (submitTopicQuestions) {

        submitTopicQuestions.addEventListener(
            "click",
            submitQuestions
        );
    }
}


/* ---------- Generate Questions ---------- */

function renderTopicQuestions() {

    if (
        !topicQuestions ||
        !topicQuestionsSection
    ) {
        return;
    }


    const topic =
        studyPlan.topics[
            currentTopicIndex
        ];


    if (!topic) {

        topicQuestionsSection.style.display =
            "none";

        return;
    }


    if (
        !isTopicCompleted(
            topic,
            currentTopicIndex
        )
    ) {

        topicQuestionsSection.style.display =
            "none";

        return;
    }


    topicQuestionsSection.style.display =
        "block";


    generatedTopicQuestions =
        generateQuestions(
            topic
        );


    topicQuestions.innerHTML =
        generatedTopicQuestions
            .map(
                (question, index) => `
                    <div
                        class="topic-question"
                        style="margin-bottom:20px;"
                    >

                        <p>
                            <strong>
                                ${index + 1}.
                                ${escapeHTML(
                                    question.question
                                )}
                            </strong>
                        </p>

                        ${question.options
                            .map(
                                (option, optionIndex) => `
                                    <label
                                        style="
                                            display:block;
                                            margin:8px 0;
                                        "
                                    >

                                        <input
                                            type="radio"
                                            name="topicQuestion${index}"
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
                `
            )
            .join("");
}


/* ---------- Questions ---------- */

function generateQuestions(topic) {

    const name =
        topic.name ||
        "this topic";


    return [

        {
            question:
                `What is the main idea you should understand about ${name}?`,

            options: [
                "The key principles and concepts",
                "Only the topic's title",
                "Nothing needs to be understood",
                "Only memorizing the date"
            ],

            answer: 0
        },

        {
            question:
                `Which approach is best when studying ${name}?`,

            options: [
                "Understand the concepts and practise",
                "Skip difficult sections",
                "Only read the headings",
                "Avoid questions"
            ],

            answer: 0
        },

        {
            question:
                `What should you do if you do not understand part of ${name}?`,

            options: [
                "Ask for an explanation and practise",
                "Ignore it",
                "Stop studying",
                "Delete the topic"
            ],

            answer: 0
        },

        {
            question:
                `Why is practising questions useful for ${name}?`,

            options: [
                "It checks whether you can apply what you learned",
                "It makes studying unnecessary",
                "It replaces every lesson",
                "It guarantees every exam question"
            ],

            answer: 0
        },

        {
            question:
                `What is a good final step after studying ${name}?`,

            options: [
                "Test yourself and review mistakes",
                "Immediately forget the material",
                "Avoid revision",
                "Skip practice"
            ],

            answer: 0
        }

    ];
}


/* ---------- Submit Questions ---------- */

function submitQuestions() {

    if (
        generatedTopicQuestions.length === 0
    ) {
        return;
    }


    let score = 0;


    generatedTopicQuestions.forEach(
        (question, index) => {

            const selected =
                document.querySelector(
                    `input[name="topicQuestion${index}"]:checked`
                );


            if (
                selected &&
                Number(
                    selected.value
                ) === question.answer
            ) {

                score++;
            }
        }
    );


    if (topicQuestionResult) {

        topicQuestionResult.innerHTML =
            `
                <strong>
                    Knowledge Check Result:
                    ${score}/${generatedTopicQuestions.length}
                </strong>

                <p>
                    ${
                        score ===
                        generatedTopicQuestions.length
                            ? "Excellent! You understand the topic very well. 🎉"
                            : score >= 3
                                ? "Good work! Review the questions you missed."
                                : "Keep practising this topic and review the material again."
                    }
                </p>
            `;
    }
}


/* =========================================
   SCHEDULE
========================================= */

function renderSchedule() {

    const scheduleList =
        document.getElementById(
            "scheduleList"
        );


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


    const today =
        new Date();


    let html = "";


    for (
        let i = 0;
        i < 7;
        i++
    ) {

        const date =
            new Date(
                today
            );


        date.setDate(
            today.getDate() + i
        );


        const dateString =
            date.toISOString()
                .split("T")[0];


        const dayName =
            days[
                date.getDay()
            ];


        let type =
            "Study Day";


        let description =
            "Revision Session";


        let badgeClass =
            "badge-study";


        /* Exam day */

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
        }


        /* Test day */

        else if (
            i === 3
        ) {

            type =
                "Test Day";

            description =
                "Review your work and test your understanding.";

            badgeClass =
                "badge-test";
        }


        /* Rest day */

        else if (
            i === 6
        ) {

            type =
                "Rest Day";

            description =
                "Take time off to recharge.";

            badgeClass =
                "badge-rest";
        }


        /* Normal study day */

        else {

            const topic =
                studyPlan.topics[
                    i %
                    Math.max(
                        studyPlan.topics.length,
                        1
                    )
                ];


            description =
                topic
                    ? topic.name
                    : "Study Session";
        }


        html +=
            `
                <div
                    class="schedule-item align-center justify-between"
                    style="
                        padding:10px;
                        border-bottom:1px solid #eee;
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
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
}


/* =========================================
   CALENDAR
========================================= */

let calendarDate =
    new Date();


function setupCalendarNavigation() {

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
}


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


    const today =
        new Date();


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


    /* Empty cells */

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


    /* Actual days */

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


        const currentDate =
            new Date(
                year,
                month,
                date
            );


        const dateString =
            `${year}-${String(
                month + 1
            ).padStart(2, "0")}-${String(
                date
            ).padStart(2, "0")}`;


        /* Today */

        if (
            date ===
            today.getDate() &&
            month ===
            today.getMonth() &&
            year ===
            today.getFullYear()
        ) {

            day.classList.add(
                "today"
            );
        }


        /* Exam */

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


        /*
           Mark completed study days
           based on completed topics.
        */

        if (
            completedTopics.length > 0 &&
            currentDate <= today
        ) {

            day.classList.add(
                "completed-day"
            );
        }


        /*
           Add study-day class to
           future dates inside plan.
        */

        if (
            currentDate >=
            new Date(
                studyPlan.studyStartDate ||
                todayStr
            )
        ) {

            day.classList.add(
                "study-day"
            );
        }


        calendarDays.appendChild(
            day
        );
    }


    updateNextSession();
}


/* =========================================
   NEXT SESSION
========================================= */

function updateNextSession() {

    if (
        !nextBooking ||
        !nextBookingTime
    ) {
        return;
    }


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


    const today =
        new Date();


    nextBooking.textContent =
        topic
            ? topic.name
            : "Study Session";


    nextBookingTime.textContent =
        today.toLocaleDateString(
            "en-US",
            {
                weekday: "long",
                month: "long",
                day: "numeric"
            }
        );
}


/* =========================================
   DOCUMENT SUMMARIZER
========================================= */

function setupSummarizer() {

    updateSummaryBadge();


    if (
        !summarizeBtn ||
        !summarizeInput
    ) {
        return;
    }


    summarizeBtn.addEventListener(
        "click",
        handleSummarization
    );
}


function updateSummaryBadge() {

    if (summaryCountBadge) {

        summaryCountBadge.textContent =
            `${summaryUsageCount}/${FREE_LIMIT} used`;
    }
}


function handleSummarization() {

    if (
        summaryUsageCount >=
        FREE_LIMIT
    ) {

        alert(
            "🔒 You have reached your 5 free document summaries limit."
        );

        return;
    }


    const content =
        summarizeInput.value.trim();


    if (!content) {

        alert(
            "Please paste study material or notes first."
        );

        return;
    }


    summaryUsageCount++;


    localStorage.setItem(
        "summaryUsageCount",
        String(
            summaryUsageCount
        )
    );


    updateSummaryBadge();


    const summary =
        createSmartSummary(
            content
        );


    if (summaryOutput) {

        summaryOutput.innerHTML =
            `
                <div
                    class="summary-result card"
                    style="
                        padding:15px;
                        margin-top:10px;
                        border-left:4px solid #007bff;
                    "
                >

                    <h4>
                        📋 Summary
                        (Tailored for
                        ${escapeHTML(
                            studyPlan.examType ||
                            "WAEC"
                        )})
                    </h4>


                    <p>
                        <strong>
                            Key Study Points:
                        </strong>
                    </p>


                    ${summary}

                </div>
            `;
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
            "5 Free Summaries Used";
    }
}


/* =========================================
   SIMPLE SMART SUMMARIZER
========================================= */

function createSmartSummary(
    text
) {

    /*
       This creates a useful local summary
       without pretending that it is an
       external AI response.

       Your real AI API can later replace
       this function.
    */


    const cleaned =
        text
            .replace(
                /\s+/g,
                " "
            )
            .trim();


    const sentences =
        cleaned.match(
            /[^.!?]+[.!?]+/g
        ) || [cleaned];


    const selected =
        sentences
            .slice(
                0,
                Math.min(
                    8,
                    sentences.length
                )
            );


    let html =
        "<ul>";


    selected.forEach(
        sentence => {

            html +=
                `
                    <li>
                        ${escapeHTML(
                            sentence.trim()
                        )}
                    </li>
                `;
        }
    );


    html +=
        "</ul>";


    return html;
}


/* =========================================
   ASK STUDYMIND AI
========================================= */

let aiConversation = [];


/* ---------- Setup ---------- */

function setupAskAI() {

    updateAiBadge();


    if (
        !askAIButton ||
        !aiQuestion ||
        !aiResponse
    ) {
        console.warn(
            "Ask AI elements were not found."
        );

        return;
    }


    /* Restore previous conversation */

    try {

        aiConversation =
            JSON.parse(
                localStorage.getItem(
                    "studyMindAiConversation"
                )
            ) || [];

    } catch {

        aiConversation = [];
    }


    if (
        !Array.isArray(
            aiConversation
        )
    ) {

        aiConversation = [];
    }


    renderAIConversation();


    /* Ask button */

    askAIButton.addEventListener(
        "click",
        askStudyMindAI
    );


    /* Ctrl + Enter */

    aiQuestion.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" &&
                event.ctrlKey
            ) {

                event.preventDefault();

                askStudyMindAI();
            }
        }
    );
}


/* ---------- Badge ---------- */

function updateAiBadge() {

    if (aiCountBadge) {

        aiCountBadge.textContent =
            `${aiQuestionCount}/${FREE_LIMIT} used`;
    }
}


/* ---------- Ask AI ---------- */

function askStudyMindAI() {

    if (
        aiQuestionCount >=
        FREE_LIMIT
    ) {

        alert(
            "🔒 You have reached your 5 free AI questions limit."
        );

        return;
    }


    const question =
        aiQuestion.value.trim();


    if (!question) {

        alert(
            "Type a question first."
        );

        return;
    }


    aiQuestionCount++;


    localStorage.setItem(
        "aiQuestionCount",
        String(
            aiQuestionCount
        )
    );


    updateAiBadge();


    /* Add student message */

    aiConversation.push({

        role: "user",

        message: question,

        time:
            new Date().toLocaleTimeString(
                [],
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            )
    });


    /* Generate response */

    const answer =
        generateAIResponse(
            question
        );


    aiConversation.push({

        role: "ai",

        message: answer,

        time:
            new Date().toLocaleTimeString(
                [],
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            )
    });


    localStorage.setItem(
        "studyMindAiConversation",
        JSON.stringify(
            aiConversation
        )
    );


    aiQuestion.value =
        "";


    renderAIConversation();


    if (
        aiQuestionCount >=
        FREE_LIMIT
    ) {

        aiQuestion.disabled =
            true;

        askAIButton.disabled =
            true;

        askAIButton.innerText =
            "5 Free Questions Used";
    }
}


/* =========================================
   AI RESPONSE ENGINE
========================================= */

function generateAIResponse(
    question
) {

    const lower =
        question.toLowerCase();


    const topics =
        studyPlan.topics;


    const subjects =
        studyPlan.subjects;


    const currentTopic =
        topics[
            currentTopicIndex
        ];


    /* ---------- Greeting ---------- */

    if (
        lower.includes("hello") ||
        lower.includes("hi") ||
        lower.includes("hey")
    ) {

        return `
            Hello! 👋 I'm StudyMind AI.

            I'm here to help you with your
            study plan, subjects, topics,
            revision and preparation.

            What would you like help with?
        `;
    }


    /* ---------- What should I study ---------- */

    if (
        lower.includes("what should i study") ||
        lower.includes("what do i study") ||
        lower.includes("study today") ||
        lower.includes("study now")
    ) {

        if (currentTopic) {

            return `
                Based on your current study plan,
                I recommend focusing on
                <strong>${escapeHTML(
                    currentTopic.name
                )}</strong>.

                ${
                    currentTopic.description
                        ? escapeHTML(
                            currentTopic.description
                        )
                        : ""
                }

                Try studying it for
                <strong>${
                    studyPlan.studyHours || 2
                } hours</strong>, then test yourself
                using the knowledge check.
            `;
        }


        return `
            You don't currently have a topic
            selected. Create a study plan first,
            then I can help you decide what to
            study.
        `;
    }


    /* ---------- Progress ---------- */

    if (
        lower.includes("progress") ||
        lower.includes("how am i doing") ||
        lower.includes("how am i performing")
    ) {

        const total =
            topics.length;

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


        return `
            You're currently at
            <strong>${percentage}%</strong>
            topic completion.

            You've completed
            <strong>${completed}</strong>
            out of
            <strong>${total}</strong>
            topics.

            Your current study streak is
            <strong>${currentStreak} days 🔥</strong>.

            ${
                percentage >= 80
                    ? "You're doing very well. Keep maintaining your consistency!"
                    : percentage >= 40
                        ? "You're making good progress. Focus on completing the next topic."
                        : "Focus on completing one topic at a time and build consistency."
            }
        `;
    }


    /* ---------- Subjects ---------- */

    if (
        lower.includes("subjects") ||
        lower.includes("subject do i have")
    ) {

        return `
            Your current subjects are:

            <br><br>

            <strong>
                ${subjects
                    .map(
                        escapeHTML
                    )
                    .join(
                        ", "
                    )}
            </strong>

            <br><br>

            I can also help you decide which
            subject to prioritize.
        `;
    }


    /* ---------- Current topic ---------- */

    if (
        lower.includes("current topic") ||
        lower.includes("topic am i") ||
        lower.includes("studying now")
    ) {

        if (!currentTopic) {

            return `
                You don't currently have
                a topic selected.
            `;
        }


        return `
            Your current topic is
            <strong>${escapeHTML(
                currentTopic.name
            )}</strong>.

            <br><br>

            ${
                currentTopic.description
                    ? escapeHTML(
                        currentTopic.description
                    )
                    : "Keep working through the topic and test your understanding."
            }
        `;
    }


    /* ---------- Exam ---------- */

    if (
        lower.includes("exam") ||
        lower.includes("test date") ||
        lower.includes("days left")
    ) {

        if (
            studyPlan.examDate
        ) {

            return `
                Your exam date is
                <strong>${escapeHTML(
                    studyPlan.examDate
                )}</strong>.

                <br><br>

                You have
                <strong>${daysLeft
                    ? daysLeft.textContent
                    : "some"
                } days</strong>
                remaining.

                Stay consistent and focus on
                understanding the topics rather
                than trying to rush everything at once.
            `;
        }


        return `
            You haven't added an exam date
            to your study plan yet.
        `;
    }


    /* ---------- Help ---------- */

    if (
        lower.includes("help") ||
        lower.includes("can you")
    ) {

        return `
            Absolutely. I can help you with:

            <ul>
                <li>Planning what to study</li>
                <li>Understanding your topics</li>
                <li>Managing your study schedule</li>
                <li>Preparing for tests and exams</li>
                <li>Reviewing your progress</li>
                <li>Explaining difficult concepts</li>
                <li>Creating revision strategies</li>
            </ul>

            Ask me a specific study question
            and I'll do my best to help.
        `;
    }


    /* ---------- Motivation / consistency ---------- */

    if (
        lower.includes("motivat") ||
        lower.includes("lazy") ||
        lower.includes("focus")
    ) {

        return `
            Try making the next step small.

            Set your study timer, focus on your
            current topic, and work through one
            section at a time.

            You don't need to finish everything
            at once. Consistent progress adds up.
        `;
    }


    /* ---------- Generic study response ---------- */

    return `
        That's a good question.

        Based on your current
        <strong>${escapeHTML(
            studyPlan.examType ||
            "study"
        )}</strong>
        plan, you're working with
        <strong>${topics.length}</strong>
        topics across
        <strong>${subjects.length}</strong>
        subjects.

        ${
            currentTopic
                ? `
                    <br><br>
                    Your current focus is
                    <strong>${escapeHTML(
                        currentTopic.name
                    )}</strong>.
                `
                : ""
        }

        <br><br>

        For a more specific answer, tell me
        the subject or topic you're asking about.
    `;
}


/* =========================================
   RENDER AI CONVERSATION
========================================= */

function renderAIConversation() {

    if (!aiResponse) return;


    if (
        aiConversation.length === 0
    ) {

        aiResponse.innerHTML =
            `
                <div class="ai-message">

                    <strong>
                        🤖 StudyMind AI
                    </strong>

                    <p>
                        Ask me anything about your
                        study plan, subjects,
                        progress or revision.
                    </p>

                </div>
            `;

        return;
    }


    aiResponse.innerHTML =
        aiConversation
            .map(
                item => {

                    if (
                        item.role ===
                        "user"
                    ) {

                        return `
                            <div
                                class="ai-message user-message"
                                style="
                                    margin:10px 0;
                                    padding:10px;
                                "
                            >

                                <strong>
                                    You
                                </strong>

                                <p>
                                    ${escapeHTML(
                                        item.message
                                    )}
                                </p>

                            </div>
                        `;
                    }


                    return `
                        <div
                            class="ai-message assistant-message"
                            style="
                                margin:10px 0;
                                padding:10px;
                            "
                        >

                            <strong>
                                🤖 StudyMind AI
                            </strong>

                            <div>
                                ${item.message}
                            </div>

                        </div>
                    `;
                }
            )
            .join("");


    /* Scroll to latest response */

    aiResponse.scrollTop =
        aiResponse.scrollHeight;
}


/* =========================================
   ANALYZE MY PROGRESS
========================================= */

function setupProgressAnalysis() {

    if (!analyzeProgressButton) {
        return;
    }


    analyzeProgressButton.addEventListener(
        "click",
        analyzeProgress
    );
}


function analyzeProgress() {

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


    let message = "";


    if (percentage === 100) {

        message =
            `
                🎉 Excellent work!

                You have completed your entire
                study plan.

                Consider revising the topics again
                and using practice questions to
                strengthen your understanding.
            `;

    } else if (percentage >= 70) {

        message =
            `
                You're making excellent progress.

                You're currently at
                <strong>${percentage}%</strong>.

                Focus on the remaining topics and
                keep your study routine consistent.
            `;

    } else if (percentage >= 40) {

        message =
            `
                You're making steady progress.

                You're currently at
                <strong>${percentage}%</strong>.

                Focus on completing one topic at a
                time rather than trying to study
                everything simultaneously.
            `;

    } else {

        message =
            `
                You are currently at
                <strong>${percentage}%</strong>.

                Focus on completing one topic at a
                time and maintain a consistent daily
                study routine.

                Your next priority should be
                <strong>${
                    studyPlan.topics[
                        currentTopicIndex
                    ]
                        ? studyPlan.topics[
                            currentTopicIndex
                        ].name
                        : "your next topic"
                }</strong>.
            `;
    }


    if (aiAdviceText) {

        aiAdviceText.innerHTML =
            `
                <strong>
                    📊 Your Study Analysis
                </strong>

                <p>
                    ${message}
                </p>
            `;
    }
}


/* =========================================
   THEME
========================================= */

function setupTheme() {

    if (!themeButton) {
        return;
    }


    const savedTheme =
        localStorage.getItem(
            "studyMindTheme"
        );


    if (
        savedTheme === "dark"
    ) {

        document.body.classList.add(
            "dark-mode"
        );

        themeButton.textContent =
            "☀️ Light Mode";
    }


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


            themeButton.textContent =
                dark
                    ? "☀️ Light Mode"
                    : "🌙 Dark Mode";
        }
    );
}


/* =========================================
   HTML ESCAPE
========================================= */

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


/* =========================================
   KATEX SUPPORT
========================================= */

function renderMath() {

    if (
        typeof renderMathInElement !==
        "undefined"
    ) {

        renderMathInElement(
            document.body,
            {
                delimiters: [
                    {
                        left: "$$",
                        right: "$$",
                        display: true
                    },
                    {
                        left: "$",
                        right: "$",
                        display: false
                    }
                ]
            }
        );
    }
}


/* =========================================
   FINAL INITIALIZATION
========================================= */

window.addEventListener(
    "load",
    () => {

        setTimeout(
            renderMath,
            300
        );
    }
);

