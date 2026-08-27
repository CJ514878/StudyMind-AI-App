/* =========================================
   STUDYMIND AI — DASHBOARD JAVASCRIPT
   COMPLETE VERSION
   MATCHED TO dashboard.html
========================================= */


/* =========================================
   SUPABASE / AUTHENTICATION
========================================= */

let currentUser = null;
let isAuthenticated = false;

async function checkAuthentication() {
    try {
        if (
            typeof supabaseClient !== "undefined" &&
            supabaseClient &&
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
        console.error("Authentication check failed:", error);
    }

    currentUser = null;
    isAuthenticated = false;
    return false;
}


/* =========================================
   HELPERS
========================================= */

const today = new Date();

function getTodayString() {
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function escapeHTML(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function saveStudyPlan() {
    localStorage.setItem(
        "studyMindPlan",
        JSON.stringify(studyPlan)
    );
}

function safeArray(value) {
    return Array.isArray(value) ? value : [];
}


/* =========================================
   LOAD STUDY PLAN
========================================= */

const todayStr = getTodayString();

let studyPlan = null;

try {
    studyPlan = JSON.parse(
        localStorage.getItem("studyMindPlan")
    );
} catch (error) {
    console.error(
        "Could not load StudyMind study plan:",
        error
    );
}


/*
   IMPORTANT:
   Do NOT overwrite a student's existing study plan.

   If the student has already filled the generator,
   this code keeps their information.
*/

if (!studyPlan || typeof studyPlan !== "object") {
    studyPlan = {
        examType: "WAEC",
        examDate: null,
        subjects: [],
        topics: [],
        studyHours: 2,
        difficulty: "balanced",
        daysLeft: 30,
        studyStartDate: todayStr
    };

    saveStudyPlan();
}


/* =========================================
   NORMALIZE STUDY PLAN DATA
========================================= */

studyPlan.examType =
    studyPlan.examType ||
    studyPlan.curriculum ||
    "WAEC";

studyPlan.examDate =
    studyPlan.examDate ||
    studyPlan.testDate ||
    studyPlan.exam_date ||
    null;

studyPlan.studyHours =
    Number(
        studyPlan.studyHours ??
        studyPlan.dailyStudyHours ??
        studyPlan.hoursPerDay ??
        2
    ) || 2;

studyPlan.difficulty =
    studyPlan.difficulty ||
    "balanced";

studyPlan.studyStartDate =
    studyPlan.studyStartDate ||
    todayStr;


/* =========================================
   SUBJECTS
========================================= */

if (!Array.isArray(studyPlan.subjects)) {

    if (typeof studyPlan.subjects === "string") {

        studyPlan.subjects =
            studyPlan.subjects
                .split(",")
                .map(subject => subject.trim())
                .filter(Boolean);

    } else {

        studyPlan.subjects = [];
    }
}


/* =========================================
   TOPICS
========================================= */

if (!Array.isArray(studyPlan.topics)) {
    studyPlan.topics = [];
}


/*
   Make sure every topic has the fields
   the dashboard expects.
*/

studyPlan.topics =
    studyPlan.topics.map((topic, index) => {

        if (typeof topic === "string") {
            return {
                id: index + 1,
                name: topic,
                subject:
                    studyPlan.subjects[0] ||
                    "General",
                description:
                    "Study this topic and complete the knowledge check.",
                status: "Not Started"
            };
        }

        return {
            id:
                topic.id ??
                index + 1,

            name:
                topic.name ||
                topic.topic ||
                `Topic ${index + 1}`,

            subject:
                topic.subject ||
                "General",

            description:
                topic.description ||
                topic.details ||
                "Study this topic and complete the knowledge check.",

            status:
                topic.status ||
                "Not Started"
        };
    });


saveStudyPlan();


/* =========================================
   DAYS LEFT
========================================= */

function calculateDaysLeft() {

    if (!studyPlan.examDate) {
        return Number(studyPlan.daysLeft) || 30;
    }

    const exam = new Date(
        `${studyPlan.examDate}T23:59:59`
    );

    if (Number.isNaN(exam.getTime())) {
        return Number(studyPlan.daysLeft) || 30;
    }

    const now = new Date();

    const difference =
        exam.getTime() -
        now.getTime();

    return Math.max(
        0,
        Math.ceil(
            difference /
            (1000 * 60 * 60 * 24)
        )
    );
}

studyPlan.daysLeft = calculateDaysLeft();

saveStudyPlan();


/* =========================================
   USAGE LIMITS
========================================= */

const FREE_LIMIT = 5;

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


/*
   Keep completed topic IDs clean.
*/

completedTopics =
    completedTopics.map(String);


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


/* Subjects / Topics */

const subjectList =
    document.getElementById(
        "subjectList"
    );

const topicList =
    document.getElementById(
        "topicList"
    );


/* Current Topic */

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


/* Topic Questions */

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


/* Streak */

const streak =
    document.getElementById(
        "streak"
    );


/* Score */

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


/* Summarizer */

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


/* AI Assistant */

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


/* Theme */

const themeButton =
    document.getElementById(
        "themeButton"
    );


/* =========================================
   PROGRESS CALCULATION
========================================= */

function getCompletedTopicCount() {

    return studyPlan.topics.filter(
        topic =>
            completedTopics.includes(
                String(topic.id)
            ) ||
            topic.status === "Completed"
    ).length;
}


function getProgressPercentage() {

    const total =
        studyPlan.topics.length;

    if (total === 0) {
        return 0;
    }

    return Math.round(
        (
            getCompletedTopicCount() /
            total
        ) * 100
    );
}


/* =========================================
   STUDY SCORE
========================================= */

function calculateStudyScore() {

    const progress =
        getProgressPercentage();

    const totalTopics =
        studyPlan.topics.length;

    let score = progress;

    /*
       Small bonus for maintaining a streak.
    */

    if (currentStreak >= 3) {
        score += 2;
    }

    if (currentStreak >= 7) {
        score += 3;
    }

    /*
       Cap at 100.
    */

    score =
        Math.min(
            100,
            Math.max(
                0,
                Math.round(score)
            )
        );

    /*
       If there are no topics,
       don't artificially display 100.
    */

    if (totalTopics === 0) {
        score = 0;
    }

    return score;
}


/* =========================================
   RENDER METRICS
========================================= */

function renderMetrics() {

    const hours =
        Number(
            studyPlan.studyHours
        ) || 2;

    const progress =
        getProgressPercentage();

    const score =
        calculateStudyScore();

    if (weeklyHours) {
        weeklyHours.textContent =
            `${hours * 6} hrs`;
    }

    if (daysLeft) {
        daysLeft.textContent =
            String(
                studyPlan.daysLeft
            );
    }

    if (dailyGoal) {
        dailyGoal.textContent =
            `${hours} hrs/day`;
    }

    if (studyScore) {
        studyScore.textContent =
            String(score);
    }

    if (scoreDisplay) {
        scoreDisplay.textContent =
            String(score);
    }

    if (scoreProgressBar) {
        scoreProgressBar.style.width =
            `${score}%`;
    }

    if (progressBar) {
        progressBar.style.width =
            `${progress}%`;
    }

    if (progressPercent) {
        progressPercent.textContent =
            `${progress}%`;
    }

    if (progressCount) {

        progressCount.textContent =
            `${getCompletedTopicCount()} of ${studyPlan.topics.length} topics completed`;
    }

    if (streak) {
        streak.textContent =
            `${currentStreak} Days 🔥`;
    }


    if (scoreMessage) {

        if (score >= 80) {
            scoreMessage.textContent =
                "Excellent work. Keep maintaining your consistency.";
        } else if (score >= 50) {
            scoreMessage.textContent =
                "Good progress. Keep completing your study topics.";
        } else if (score > 0) {
            scoreMessage.textContent =
                "You're making progress. Keep studying consistently.";
        } else {
            scoreMessage.textContent =
                "Start studying to build your score.";
        }
    }
}


/* =========================================
   RENDER SUBJECTS
========================================= */

function renderSubjects() {

    if (!subjectList) {
        return;
    }

    if (
        studyPlan.subjects.length === 0
    ) {

        subjectList.innerHTML =
            `<p>No subjects added yet. Create a study plan to add your subjects.</p>`;

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


/* =========================================
   RENDER TOPICS
========================================= */

function renderTopics() {

    if (!topicList) {
        return;
    }

    if (
        studyPlan.topics.length === 0
    ) {

        topicList.innerHTML =
            `<p>No topics available yet. Create a study plan with topics to begin.</p>`;

        return;
    }


    topicList.innerHTML =
        studyPlan.topics
            .map(
                (topic, index) => {

                    const completed =
                        completedTopics.includes(
                            String(topic.id)
                        ) ||
                        topic.status === "Completed";

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
                                ${escapeHTML(topic.name)}
                            </strong>

                            <small>
                                (${escapeHTML(topic.subject)})
                            </small>

                            <p>
                                ${escapeHTML(topic.description)}
                            </p>

                            <span>
                                ${
                                    completed
                                        ? "Completed"
                                        : escapeHTML(topic.status)
                                }
                            </span>

                        </div>
                    `;
                }
            )
            .join("");


    /*
       Allow students to click a topic
       and make it the current topic.
    */

    const topicCards =
        topicList.querySelectorAll(
            "[data-topic-index]"
        );

    topicCards.forEach(card => {

        card.addEventListener(
            "click",
            () => {

                const index =
                    Number(
                        card.dataset.topicIndex
                    );

                if (
                    Number.isInteger(index)
                ) {

                    currentTopicIndex =
                        index;

                    localStorage.setItem(
                        "studyMindCurrentTopicIndex",
                        String(
                            currentTopicIndex
                        )
                    );

                    renderCurrentTopic();
                    renderTopics();
                }
            }
        );
    });
}


/* =========================================
   RENDER CURRENT TOPIC
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

        if (topicStatusBadge) {
            topicStatusBadge.textContent =
                "NOT STARTED";
        }

        if (topicCompleteCheckbox) {
            topicCompleteCheckbox.checked =
                false;
            topicCompleteCheckbox.disabled =
                true;
        }

        return;
    }


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


    const topic =
        studyPlan.topics[
            currentTopicIndex
        ];


    const completed =
        completedTopics.includes(
            String(topic.id)
        ) ||
        topic.status === "Completed";


    if (currentTopicName) {
        currentTopicName.textContent =
            topic.name;
    }

    if (currentTopicDescription) {
        currentTopicDescription.textContent =
            topic.description;
    }

    if (topicPosition) {
        topicPosition.textContent =
            `TOPIC ${currentTopicIndex + 1} OF ${studyPlan.topics.length}`;
    }

    if (topicStatusBadge) {

        topicStatusBadge.textContent =
            completed
                ? "COMPLETED"
                : String(
                    topic.status ||
                    "IN PROGRESS"
                ).toUpperCase();
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
                ? "This topic has been completed."
                : "Tick this box when you are done studying this topic.";
    }


    if (nextTopicMessage) {

        if (
            completed &&
            currentTopicIndex <
                studyPlan.topics.length - 1
        ) {

            const nextTopic =
                studyPlan.topics[
                    currentTopicIndex + 1
                ];

            nextTopicMessage.innerHTML =
                `Next topic: <strong>${escapeHTML(nextTopic.name)}</strong>`;

        } else if (
            completed &&
            currentTopicIndex ===
                studyPlan.topics.length - 1
        ) {

            nextTopicMessage.textContent =
                "🎉 You have completed all available topics.";

        } else {

            nextTopicMessage.textContent =
                "";
        }
    }


    /*
       Reset knowledge-check section
       whenever the current topic changes.
    */

    if (topicQuestionsSection) {
        topicQuestionsSection.style.display =
            "none";
    }

    if (topicQuestions) {
        topicQuestions.innerHTML =
            "";
    }

    if (topicQuestionResult) {
        topicQuestionResult.innerHTML =
            "";
    }
}


/* =========================================
   TOPIC COMPLETION
========================================= */

function completeCurrentTopic() {

    if (
        studyPlan.topics.length === 0
    ) {
        return;
    }

    const topic =
        studyPlan.topics[
            currentTopicIndex
        ];

    const topicId =
        String(topic.id);


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

        topic.status =
            "Completed";

        localStorage.setItem(
            "studyMindCompletedTopics",
            JSON.stringify(
                completedTopics
            )
        );

        saveStudyPlan();

        currentStreak =
            Math.max(
                1,
                currentStreak
            );

        localStorage.setItem(
            "studyMindStreak",
            String(
                currentStreak
            )
        );

        renderCurrentTopic();
        renderTopics();
        renderMetrics();

        showKnowledgeCheck();

    } else {

        completedTopics =
            completedTopics.filter(
                id =>
                    id !== topicId
            );

        topic.status =
            "In Progress";

        localStorage.setItem(
            "studyMindCompletedTopics",
            JSON.stringify(
                completedTopics
            )
        );

        saveStudyPlan();

        renderCurrentTopic();
        renderTopics();
        renderMetrics();
    }
}


if (topicCompleteCheckbox) {

    topicCompleteCheckbox.addEventListener(
        "change",
        completeCurrentTopic
    );
}


/* =========================================
   KNOWLEDGE CHECK
========================================= */

function showKnowledgeCheck() {

    if (!topicQuestionsSection) {
        return;
    }

    topicQuestionsSection.style.display =
        "block";

    generateTopicQuestions();
}


function generateTopicQuestions() {

    if (!topicQuestions) {
        return;
    }

    const topic =
        studyPlan.topics[
            currentTopicIndex
        ];

    if (!topic) {
        return;
    }


    const topicName =
        topic.name;


    const questions = [

        {
            question:
                `What is the main idea you should understand about "${topicName}"?`,
            options: [
                "The basic concepts and principles of the topic",
                "Only the topic's title",
                "Nothing needs to be understood",
                "Only the date it was studied"
            ],
            answer: 0
        },

        {
            question:
                `Which approach is best when studying "${topicName}"?`,
            options: [
                "Understand the concepts and practise questions",
                "Memorize everything without understanding",
                "Skip difficult parts",
                "Study only the night before an exam"
            ],
            answer: 0
        },

        {
            question:
                `Why should you practise questions after studying "${topicName}"?`,
            options: [
                "To check your understanding",
                "To avoid learning the topic",
                "To make the study session shorter",
                "Because questions are unrelated to exams"
            ],
            answer: 0
        },

        {
            question:
                `What should you do if you do not understand part of "${topicName}"?`,
            options: [
                "Review it and ask for an explanation",
                "Ignore it completely",
                "Stop studying",
                "Delete the topic"
            ],
            answer: 0
        },

        {
            question:
                `What is a good final step after studying "${topicName}"?`,
            options: [
                "Test yourself and review mistakes",
                "Immediately forget the material",
                "Skip all revision",
                "Avoid practising"
            ],
            answer: 0
        }

    ];


    topicQuestions.innerHTML =
        questions
            .map(
                (question, index) => `
                    <div class="question-card">

                        <p>
                            <strong>
                                ${index + 1}. ${escapeHTML(question.question)}
                            </strong>
                        </p>

                        ${question.options
                            .map(
                                (option, optionIndex) => `
                                    <label>
                                        <input
                                            type="radio"
                                            name="topicQuestion${index}"
                                            value="${optionIndex}"
                                        >
                                        ${escapeHTML(option)}
                                    </label>
                                `
                            )
                            .join("")}

                    </div>
                `
            )
            .join("");


    topicQuestions.dataset.answers =
        JSON.stringify(
            questions.map(
                question =>
                    question.answer
            )
        );
}


/* =========================================
   SUBMIT KNOWLEDGE CHECK
========================================= */

if (submitTopicQuestions) {

    submitTopicQuestions.addEventListener(
        "click",
        () => {

            if (!topicQuestions) {
                return;
            }

            const answers =
                JSON.parse(
                    topicQuestions.dataset.answers ||
                    "[]"
                );

            let correct = 0;
            let answered = 0;


            answers.forEach(
                (correctAnswer, index) => {

                    const selected =
                        document.querySelector(
                            `input[name="topicQuestion${index}"]:checked`
                        );

                    if (selected) {

                        answered++;

                        if (
                            Number(
                                selected.value
                            ) ===
                            correctAnswer
                        ) {
                            correct++;
                        }
                    }
                }
            );


            if (
                answered <
                answers.length
            ) {

                alert(
                    "Please answer all 5 questions before submitting."
                );

                return;
            }


            const percentage =
                Math.round(
                    (
                        correct /
                        answers.length
                    ) * 100
                );


            if (topicQuestionResult) {

                topicQuestionResult.innerHTML =
                    `
                        <strong>
                            🧠 Knowledge Check Result
                        </strong>

                        <p>
                            You scored
                            <strong>
                                ${correct}/${answers.length}
                            </strong>
                            (${percentage}%).
                        </p>

                        ${
                            percentage >= 80
                                ? "Excellent understanding! 🎉"
                                : percentage >= 60
                                    ? "Good work. Review the topic once more to strengthen your understanding."
                                    : "Keep reviewing this topic and practise more questions."
                        }
                    `;
            }
        }
    );
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


function updateTimerDisplay() {

    if (!studyTimer) {
        return;
    }

    const minutes =
        Math.floor(
            timerSeconds / 60
        );

    const seconds =
        timerSeconds % 60;


    studyTimer.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
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


function startTimer() {

    if (timerRunning) {
        return;
    }

    if (timerSeconds <= 0) {
        timerSeconds =
            selectedTimerSeconds;
    }


    timerRunning = true;

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
                        "⏰ Study Session Complete! Great job maintaining your focus."
                    );
                }

            },
            250
        );
}


function pauseTimer() {

    if (!timerRunning) {
        return;
    }

    clearInterval(
        timerInterval
    );

    timerInterval =
        null;

    /*
       Preserve the current remaining
       seconds so the student can resume.
    */

    localStorage.setItem(
        "studyMindTimerSeconds",
        String(
            timerSeconds
        )
    );

    timerRunning =
        false;

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

    const savedMinutes =
        Math.round(
            selectedTimerSeconds /
            60
        );


    if (
        [...timerDurationSelect.options]
            .some(
                option =>
                    Number(
                        option.value
                    ) === savedMinutes
            )
    ) {

        timerDurationSelect.value =
            String(
                savedMinutes
            );
    }


    timerDurationSelect.addEventListener(
        "change",
        event => {

            const minutes =
                Number(
                    event.target.value
                );

            if (
                minutes > 0
            ) {

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


updateTimerDisplay();
updateTimerButtons();


/* =========================================
   DOCUMENT SUMMARIZER
========================================= */

function updateSummaryBadge() {

    if (summaryCountBadge) {

        summaryCountBadge.textContent =
            `${summaryUsageCount}/${FREE_LIMIT} used`;
    }
}


function createSummary(text) {

    /*
       This creates a useful local summary
       without requiring an external AI API.

       It extracts sentences and organizes
       them into readable key study points.
    */

    const cleaned =
        text
            .replace(/\s+/g, " ")
            .trim();


    if (!cleaned) {
        return null;
    }


    const sentences =
        cleaned
            .split(
                /(?<=[.!?])\s+/
            )
            .filter(
                sentence =>
                    sentence.trim().length > 20
            );


    const selected =
        sentences.slice(
            0,
            8
        );


    const keyPoints =
        selected.length > 0
            ? selected
            : [
                cleaned
            ];


    return keyPoints;
}


function summarizeDocument() {

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
        summarizeInput
            ? summarizeInput.value.trim()
            : "";


    if (!content) {

        alert(
            "Please paste your study notes or text first."
        );

        return;
    }


    const examContext =
        studyPlan.examType ||
        "WAEC";


    const points =
        createSummary(
            content
        );


    if (!points) {
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


    if (summaryOutput) {

        summaryOutput.innerHTML =
            `
                <div class="summary-result">

                    <h4>
                        📋 Summary
                        (Tailored for ${escapeHTML(examContext)})
                    </h4>

                    <p>
                        <strong>
                            Key Study Points:
                        </strong>
                    </p>

                    <ul>
                        ${points
                            .map(
                                point =>
                                    `<li>${escapeHTML(point)}</li>`
                            )
                            .join("")}
                    </ul>

                </div>
            `;
    }


    if (
        summaryUsageCount >=
        FREE_LIMIT
    ) {

        /*
           Keep the summary visible,
           but prevent another use.
        */

        if (summarizeBtn) {
            summarizeBtn.disabled =
                true;

            summarizeBtn.textContent =
                "5/5 Free Summaries Used";
        }

        if (summarizeInput) {
            summarizeInput.disabled =
                true;
        }
    }
}


if (summarizeBtn) {

    summarizeBtn.addEventListener(
        "click",
        summarizeDocument
    );
}


updateSummaryBadge();


if (
    summaryUsageCount >=
    FREE_LIMIT
) {

    if (summarizeBtn) {
        summarizeBtn.disabled =
            true;

        summarizeBtn.textContent =
            "5/5 Free Summaries Used";
    }

    if (summarizeInput) {
        summarizeInput.disabled =
            true;
    }
}


/* =========================================
   AI PROGRESS ANALYSIS
========================================= */

function analyzeProgress() {

    const total =
        studyPlan.topics.length;

    const completed =
        getCompletedTopicCount();

    const percentage =
        getProgressPercentage();

    const score =
        calculateStudyScore();


    let advice = "";


    if (total === 0) {

        advice =
            "You haven't added any study topics yet. Create a study plan with subjects and topics to begin.";

    } else if (percentage === 100) {

        advice =
            `Excellent work! You have completed all ${total} topics. Review your material and practise questions to maintain your preparation.`;

    } else if (percentage >= 70) {

        advice =
            `You're making strong progress at ${percentage}%. You have completed ${completed} of ${total} topics. Focus on your remaining topics and keep reviewing completed material.`;

    } else if (percentage >= 40) {

        advice =
            `You're currently at ${percentage}%. You have completed ${completed} of ${total} topics. Stay consistent with your daily ${studyPlan.studyHours}-hour goal and work through the remaining topics one at a time.`;

    } else {

        advice =
            `You are currently at ${percentage}%. Focus on completing one topic at a time and maintain a consistent daily study routine.`;
    }


    if (score >= 80) {

        advice +=
            " Your study score is strong, so keep maintaining your consistency.";

    } else if (score < 30) {

        advice +=
            " Start with your current topic and use the knowledge check after studying.";
    }


    if (aiAdviceText) {

        aiAdviceText.innerHTML =
            `
                <strong>
                    📊 Your Study Analysis
                </strong>

                <p>
                    ${escapeHTML(advice)}
                </p>
            `;
    }
}


if (analyzeProgressButton) {

    analyzeProgressButton.addEventListener(
        "click",
        analyzeProgress
    );
}


/* =========================================
   ASK STUDYMIND AI
========================================= */

function updateAiBadge() {

    if (aiCountBadge) {

        aiCountBadge.textContent =
            `${aiQuestionCount}/${FREE_LIMIT} used`;
    }
}


function generateAIResponse(question) {

    const lower =
        question.toLowerCase();


    const progress =
        getProgressPercentage();


    const topic =
        studyPlan.topics[
            currentTopicIndex
        ];


    /*
       Personalized responses based on
       the student's actual dashboard data.
    */

    if (
        lower.includes("today") ||
        lower.includes("study today")
    ) {

        if (topic) {

            return `
                Based on your current study plan,
                I recommend focusing on
                <strong>${escapeHTML(topic.name)}</strong>
                today.

                <br><br>

                Study for about
                <strong>${studyPlan.studyHours} hour(s)</strong>,
                then test yourself with the knowledge check.
            `;
        }

        return `
            You don't currently have a topic assigned.
            Create a study plan with topics first.
        `;
    }


    if (
        lower.includes("progress") ||
        lower.includes("doing")
    ) {

        return `
            Your current progress is
            <strong>${progress}%</strong>.

            <br><br>

            You have completed
            <strong>${getCompletedTopicCount()}</strong>
            of
            <strong>${studyPlan.topics.length}</strong>
            topics.

            Keep working through your topics consistently.
        `;
    }


    if (
        lower.includes("subject") ||
        lower.includes("subjects")
    ) {

        if (
            studyPlan.subjects.length === 0
        ) {

            return `
                You don't have any subjects saved yet.
                Create a new study plan to add them.
            `;
        }


        return `
            Your current subjects are:

            <br><br>

            <strong>
                ${studyPlan.subjects
                    .map(
                        subject =>
                            escapeHTML(subject)
                    )
                    .join(", ")}
            </strong>
        `;
    }


    if (
        lower.includes("topic")
    ) {

        if (!topic) {

            return `
                You don't currently have a study topic.
                Create a study plan to add one.
            `;
        }


        return `
            Your current topic is
            <strong>${escapeHTML(topic.name)}</strong>.

            <br><br>

            ${escapeHTML(topic.description)}

            <br><br>

            Once you've studied it, tick the completion box
            and complete the knowledge check.
        `;
    }


    if (
        lower.includes("exam") ||
        lower.includes("test")
    ) {

        return `
            Your study plan is currently based on
            <strong>${escapeHTML(studyPlan.examType)}</strong>.

            <br><br>

            ${
                studyPlan.examDate
                    ? `Your exam/test date is <strong>${escapeHTML(studyPlan.examDate)}</strong>.`
                    : "No exam date has been saved yet."
            }

            <br><br>

            Keep revising your topics and use practice questions
            to check your understanding.
        `;
    }


    /*
       General response.
    */

    return `
        Based on your
        <strong>${escapeHTML(studyPlan.examType)}</strong>
        study plan, I recommend focusing on
        ${
            topic
                ? `<strong>${escapeHTML(topic.name)}</strong>`
                : "your current study topics"
        }.

        <br><br>

        Your current progress is
        <strong>${progress}%</strong>.
        Study consistently, review difficult concepts,
        and use practice questions to check your understanding.
    `;
}


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


    if (!aiQuestion) {
        return;
    }


    const question =
        aiQuestion.value.trim();


    if (!question) {

        alert(
            "Please type a question first."
        );

        aiQuestion.focus();

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


    const response =
        generateAIResponse(
            question
        );


    if (aiResponse) {

        aiResponse.innerHTML =
            `
                <strong>
                    🤖 StudyMind AI
                </strong>

                <p>
                    ${response}
                </p>
            `;
    }


    aiQuestion.value =
        "";


    if (
        aiQuestionCount >=
        FREE_LIMIT
    ) {

        aiQuestion.disabled =
            true;

        askAIButton.disabled =
            true;

        askAIButton.textContent =
            "5/5 Free Questions Used";
    }
}


if (askAIButton) {

    askAIButton.addEventListener(
        "click",
        askStudyMindAI
    );
}


/*
   Allow Enter + Ctrl/Command Enter
   without accidentally submitting too early.
*/

if (aiQuestion) {

    aiQuestion.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" &&
                (event.ctrlKey ||
                 event.metaKey)
            ) {

                event.preventDefault();

                askStudyMindAI();
            }
        }
    );
}


updateAiBadge();


if (
    aiQuestionCount >=
    FREE_LIMIT
) {

    if (aiQuestion) {
        aiQuestion.disabled =
            true;
    }

    if (askAIButton) {
        askAIButton.disabled =
            true;

        askAIButton.textContent =
            "5/5 Free Questions Used";
    }
}


/* =========================================
   CALENDAR
========================================= */

let calendarDate =
    new Date();


function getStudyTypeForDate(
    date
) {

    const dateString =
        [
            date.getFullYear(),
            String(
                date.getMonth() + 1
            ).padStart(2, "0"),
            String(
                date.getDate()
            ).padStart(2, "0")
        ].join("-");


    /*
       Exam date gets priority.
    */

    if (
        studyPlan.examDate &&
        dateString ===
            studyPlan.examDate
    ) {

        return "exam";
    }


    /*
       Completed current/previous topics
       are reflected on the calendar
       when appropriate.
    */

    const dayOfWeek =
        date.getDay();


    /*
       Sunday is treated as a break/rest day.
    */

    if (
        dayOfWeek === 0
    ) {

        return "break";
    }


    return "study";
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


    /*
       Empty cells before first day.
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
            "calendar-day other-month";

        calendarDays.appendChild(
            empty
        );
    }


    const realToday =
        new Date();


    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const dayDiv =
            document.createElement(
                "div"
            );


        dayDiv.className =
            "calendar-day";


        dayDiv.textContent =
            String(day);


        const cellDate =
            new Date(
                year,
                month,
                day
            );


        /*
           Today.
        */

        if (
            cellDate.getFullYear() ===
                realToday.getFullYear() &&
            cellDate.getMonth() ===
                realToday.getMonth() &&
            cellDate.getDate() ===
                realToday.getDate()
        ) {

            dayDiv.classList.add(
                "today"
            );
        }


        /*
           Study / break / exam classes.
        */

        const type =
            getStudyTypeForDate(
                cellDate
            );


        if (
            type === "exam"
        ) {

            dayDiv.classList.add(
                "exam-day"
            );

        } else if (
            type === "break"
        ) {

            dayDiv.classList.add(
                "break-day"
            );

        } else {

            dayDiv.classList.add(
                "study-day"
            );
        }


        /*
           Mark calendar days that have
           already passed as completed
           when they are before today.
        */

        const cellTime =
            cellDate.setHours(
                0,
                0,
                0,
                0
            );

        const todayTime =
            new Date(
                realToday.getFullYear(),
                realToday.getMonth(),
                realToday.getDate()
            ).getTime();


        if (
            cellTime <
                todayTime &&
            type === "study"
        ) {

            dayDiv.classList.add(
                "completed-day"
            );
        }


        calendarDays.appendChild(
            dayDiv
        );
    }


    updateNextSession();
}


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


    const now =
        new Date();


    let sessionDate =
        null;


    /*
       Search the next 30 days
       for the next non-break day.
    */

    for (
        let i = 0;
        i < 30;
        i++
    ) {

        const candidate =
            new Date(now);

        candidate.setDate(
            now.getDate() + i
        );


        if (
            getStudyTypeForDate(
                candidate
            ) !== "break"
        ) {

            sessionDate =
                candidate;

            break;
        }
    }


    if (!sessionDate) {

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


    nextBookingTime.textContent =
        sessionDate.toLocaleDateString(
            "en-US",
            {
                weekday: "long",
                month: "long",
                day: "numeric"
            }
        );
}


/* =========================================
   SCHEDULE
========================================= */

function renderSchedule() {

    if (!scheduleList) {
        return;
    }


    const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ];


    const now =
        new Date();


    let html =
        "";


    for (
        let i = 0;
        i < 7;
        i++
    ) {

        const date =
            new Date(now);

        date.setDate(
            now.getDate() + i
        );


        const dayName =
            dayNames[
                date.getDay()
            ];


        const dateString =
            [
                date.getFullYear(),
                String(
                    date.getMonth() + 1
                ).padStart(2, "0"),
                String(
                    date.getDate()
                ).padStart(2, "0")
            ].join("-");


        let type =
            "Study Day";

        let badgeClass =
            "badge-study";

        let description =
            studyPlan.topics.length
                ? studyPlan.topics[
                    i %
                    studyPlan.topics.length
                  ].name
                : "Study Session";


        /*
           Sunday = break.
        */

        if (
            date.getDay() === 0
        ) {

            type =
                "Break";

            badgeClass =
                "badge-rest";

            description =
                "Take time to rest and recharge.";
        }


        /*
           Exam date.
        */

        if (
            studyPlan.examDate &&
            dateString ===
                studyPlan.examDate
        ) {

            type =
                "Exam Day";

            badgeClass =
                "badge-exam";

            description =
                "Exam day — stay calm and do your best.";
        }


        /*
           Wednesday = test/review day,
           unless it is an exam day.
        */

        if (
            date.getDay() === 3 &&
            type !== "Exam Day"
        ) {

            type =
                "Test Day";

            badgeClass =
                "badge-test";

            description =
                studyPlan.topics.length
                    ? "Review your work and test your understanding."
                    : "Review your work and test your understanding.";
        }


        html +=
            `
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
                            (${date.toLocaleDateString(
                                "en-GB"
                            )})
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
   THEME BUTTON
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

    } else {

        themeButton.textContent =
            "🌙 Dark Mode";
    }


    themeButton.addEventListener(
        "click",
        () => {

            const dark =
                document.body.classList.toggle(
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
   INITIALIZATION
========================================= */

async function initializeDashboard() {

    await checkAuthentication();

    renderMetrics();
    renderSubjects();
    renderTopics();
    renderCurrentTopic();
    renderCalendar();
    renderSchedule();
    updateNextSession();
    setupTheme();
    analyzeProgress();
}


/*
   Run after the HTML has loaded.
*/

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


/* =========================================
   OPTIONAL SUPABASE AUTH STATE LISTENER
========================================= */

if (
    typeof supabaseClient !== "undefined" &&
    supabaseClient &&
    supabaseClient.auth
) {

    supabaseClient.auth.onAuthStateChange(
        (
            event,
            session
        ) => {

            if (session?.user) {

                currentUser =
                    session.user;

                isAuthenticated =
                    true;

            } else {

                currentUser =
                    null;

                isAuthenticated =
                    false;
            }
        }
    );
}

