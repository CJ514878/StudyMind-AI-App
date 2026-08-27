/* =========================================================
   STUDYMIND AI — DASHBOARD JAVASCRIPT
   FULL REPLACEMENT VERSION
   Compatible with the supplied dashboard.html
========================================================= */


/* =========================================================
   1. AUTHENTICATION
========================================================= */

let currentUser = null;
let isAuthenticated = false;

async function checkAuthentication() {
    try {
        if (
            typeof supabaseClient === "undefined" ||
            !supabaseClient ||
            !supabaseClient.auth
        ) {
            console.warn("Supabase client not available.");
            return false;
        }

        const {
            data: { user },
            error
        } = await supabaseClient.auth.getUser();

        if (error || !user) {
            currentUser = null;
            isAuthenticated = false;

            /*
                Do not immediately redirect here.
                This prevents a blank page if Supabase
                is still restoring the session.
            */

            return false;
        }

        currentUser = user;
        isAuthenticated = true;

        console.log("StudyMind AI: User authenticated.");

        return true;

    } catch (error) {
        console.error(
            "StudyMind AI authentication error:",
            error
        );

        currentUser = null;
        isAuthenticated = false;

        return false;
    }
}


/* =========================================================
   2. BASIC DATA
========================================================= */

const todayDate = new Date();

function getDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

const todayStr = getDateString(todayDate);


/* =========================================================
   3. STUDY PLAN
========================================================= */

let studyPlan = null;

try {
    const savedPlan = localStorage.getItem("studyMindPlan");

    if (savedPlan) {
        studyPlan = JSON.parse(savedPlan);
    }
} catch (error) {
    console.error(
        "Could not load StudyMind study plan:",
        error
    );
}


/* ---------------------------------------------------------
   Default Study Plan
--------------------------------------------------------- */

if (
    !studyPlan ||
    typeof studyPlan !== "object" ||
    Array.isArray(studyPlan)
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
                    "Nouns, pronouns, and subject-verb agreement.",
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


/* ---------------------------------------------------------
   Normalize Study Plan
--------------------------------------------------------- */

if (!Array.isArray(studyPlan.subjects)) {
    studyPlan.subjects = [];
}

if (!Array.isArray(studyPlan.topics)) {
    studyPlan.topics = [];
}

if (!studyPlan.studyStartDate) {
    studyPlan.studyStartDate = todayStr;
}

if (!studyPlan.studyHours || Number(studyPlan.studyHours) <= 0) {
    studyPlan.studyHours = 2;
}


/* ---------------------------------------------------------
   Make sure every topic has an ID/status
--------------------------------------------------------- */

studyPlan.topics = studyPlan.topics.map((topic, index) => {

    if (!topic || typeof topic !== "object") {
        return {
            id: index + 1,
            name: `Topic ${index + 1}`,
            subject: "General",
            description: "",
            status: "Not Started"
        };
    }

    return {
        id: topic.id ?? index + 1,
        name: topic.name || `Topic ${index + 1}`,
        subject: topic.subject || "General",
        description: topic.description || "",
        status: topic.status || "Not Started"
    };
});


function saveStudyPlan() {
    localStorage.setItem(
        "studyMindPlan",
        JSON.stringify(studyPlan)
    );
}


/* =========================================================
   4. USAGE LIMITS
========================================================= */

const FREE_LIMIT = 5;

let aiQuestionCount =
    Number(localStorage.getItem("aiQuestionCount")) || 0;

let summaryUsageCount =
    Number(localStorage.getItem("summaryUsageCount")) || 0;


/* =========================================================
   5. TOPIC PROGRESS
========================================================= */

let completedTopics = [];

try {
    const savedCompletedTopics =
        JSON.parse(
            localStorage.getItem(
                "studyMindCompletedTopics"
            )
        );

    if (Array.isArray(savedCompletedTopics)) {
        completedTopics = savedCompletedTopics;
    }
} catch (error) {
    completedTopics = [];
}


/* ---------------------------------------------------------
   Current Topic
--------------------------------------------------------- */

let currentTopicIndex =
    Number(
        localStorage.getItem(
            "studyMindCurrentTopicIndex"
        )
    );

if (
    !Number.isInteger(currentTopicIndex) ||
    currentTopicIndex < 0
) {
    currentTopicIndex = 0;
}

if (
    studyPlan.topics.length > 0 &&
    currentTopicIndex >= studyPlan.topics.length
) {
    currentTopicIndex = 0;
}


/* ---------------------------------------------------------
   Study Streak
--------------------------------------------------------- */

let currentStreak =
    Number(
        localStorage.getItem("studyMindStreak")
    ) || 1;


/* =========================================================
   6. DOM ELEMENTS
========================================================= */


/* Dashboard Stats */

const weeklyHours =
    document.getElementById("weeklyHours");

const daysLeft =
    document.getElementById("daysLeft");

const dailyGoal =
    document.getElementById("dailyGoal");

const studyScore =
    document.getElementById("studyScore");

const streak =
    document.getElementById("streak");


/* Progress */

const progressBar =
    document.getElementById("progressBar");

const progressPercent =
    document.getElementById("progressPercent");

const progressCount =
    document.getElementById("progressCount");


/* Score */

const scoreDisplay =
    document.getElementById("scoreDisplay");

const scoreProgressBar =
    document.getElementById("scoreProgressBar");

const scoreMessage =
    document.getElementById("scoreMessage");


/* Subjects / Topics */

const subjectList =
    document.getElementById("subjectList");

const topicList =
    document.getElementById("topicList");


/* Current Topic */

const currentTopicName =
    document.getElementById("currentTopicName");

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


/* Knowledge Check */

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


/* AI */

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


/* Theme */

const themeButton =
    document.getElementById(
        "themeButton"
    );


/* =========================================================
   7. DASHBOARD INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        /*
            Authentication is checked first,
            but the dashboard is still allowed
            to render locally if Supabase takes
            time restoring the session.
        */

        await checkAuthentication();

        renderMetrics();

        renderSubjects();

        renderTopics();

        renderCurrentTopic();

        renderSchedule();

        renderCalendar();

        setupCalendarNavigation();

        setupTimer();

        setupTopicCompletion();

        setupTopicQuestions();

        setupAskAI();

        setupProgressAnalysis();

        setupSummarizer();

        setupTheme();

        updateNextSession();

        console.log(
            "StudyMind AI dashboard initialized."
        );
    }
);


/* =========================================================
   8. METRICS
========================================================= */

function calculateCompletedTopics() {

    return completedTopics.length;
}


function calculateProgress() {

    const total =
        studyPlan.topics.length;

    const completed =
        calculateCompletedTopics();

    if (total === 0) {
        return 0;
    }

    return Math.min(
        100,
        Math.round(
            (completed / total) * 100
        )
    );
}


function calculateStudyScore() {

    const progress =
        calculateProgress();

    const streakBonus =
        Math.min(
            currentStreak * 2,
            20
        );

    return Math.min(
        100,
        Math.round(
            progress * 0.8 +
            streakBonus
        )
    );
}


function renderMetrics() {

    const hours =
        Number(studyPlan.studyHours) || 2;

    const calculatedScore =
        calculateStudyScore();


    if (weeklyHours) {
        weeklyHours.textContent =
            `${hours * 6} hrs`;
    }


    if (daysLeft) {

        let remainingDays =
            Number(studyPlan.daysLeft);

        if (
            studyPlan.examDate
        ) {

            const exam =
                new Date(
                    studyPlan.examDate +
                    "T23:59:59"
                );

            const now =
                new Date();

            remainingDays =
                Math.max(
                    0,
                    Math.ceil(
                        (
                            exam - now
                        ) /
                        86400000
                    )
                );
        }

        if (
            !Number.isFinite(
                remainingDays
            )
        ) {
            remainingDays = 30;
        }

        daysLeft.textContent =
            remainingDays;
    }


    if (dailyGoal) {
        dailyGoal.textContent =
            `${hours} hrs/day`;
    }


    if (studyScore) {
        studyScore.textContent =
            calculatedScore;
    }


    if (streak) {
        streak.textContent =
            `${currentStreak} Days 🔥`;
    }


    if (progressBar) {

        progressBar.style.width =
            `${calculateProgress()}%`;
    }


    if (progressPercent) {

        progressPercent.textContent =
            `${calculateProgress()}%`;
    }


    if (progressCount) {

        progressCount.textContent =
            `${calculateCompletedTopics()} of ${studyPlan.topics.length} topics completed`;
    }


    if (scoreDisplay) {

        scoreDisplay.textContent =
            calculatedScore;
    }


    if (scoreProgressBar) {

        scoreProgressBar.style.width =
            `${calculatedScore}%`;
    }


    if (scoreMessage) {

        if (calculatedScore >= 80) {

            scoreMessage.textContent =
                "Excellent consistency. Keep it going!";

        } else if (calculatedScore >= 50) {

            scoreMessage.textContent =
                "Good progress. Keep building your momentum.";

        } else {

            scoreMessage.textContent =
                "Start studying to build your score.";
        }
    }
}


/* =========================================================
   9. SUBJECTS
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
            .map(subject => {

                return `
                    <div class="badge badge-primary">
                        ${escapeHTML(subject)}
                    </div>
                `;

            })
            .join("");
}


/* =========================================================
   10. TOPICS
========================================================= */

function renderTopics() {

    if (!topicList) return;


    if (
        !studyPlan.topics ||
        studyPlan.topics.length === 0
    ) {

        topicList.innerHTML = `
            <div class="empty-topic">
                No topics available yet.
                Create a study plan to add topics.
            </div>
        `;

        return;
    }


    topicList.innerHTML =
        studyPlan.topics
            .map((topic, index) => {

                const completed =
                    isTopicCompleted(index);

                return `
                    <div
                        class="topic-card
                        ${index === currentTopicIndex ? "active" : ""}
                        ${completed ? "completed" : ""}"
                        data-topic-index="${index}"
                        style="cursor:pointer;"
                    >

                        <div>
                            <strong>
                                ${escapeHTML(topic.name)}
                            </strong>

                            <small>
                                (${escapeHTML(topic.subject)})
                            </small>
                        </div>

                        <p>
                            ${escapeHTML(topic.description)}
                        </p>

                        <span class="topic-status">
                            ${
                                completed
                                    ? "✓ Completed"
                                    : escapeHTML(
                                        topic.status ||
                                        "Not Started"
                                    )
                            }
                        </span>

                    </div>
                `;

            })
            .join("");


    /*
        Clicking a topic makes it the current topic.
    */

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

                selectTopic(index);
            }
        );
    });
}


/* =========================================================
   11. CURRENT TOPIC
========================================================= */

function renderCurrentTopic() {

    if (
        !studyPlan.topics ||
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

        if (topicStatusBadge) {
            topicStatusBadge.textContent =
                "NOT STARTED";
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


    if (!topic) return;


    const completed =
        isTopicCompleted(
            currentTopicIndex
        );


    if (currentTopicName) {

        currentTopicName.textContent =
            topic.name;
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
            `TOPIC ${currentTopicIndex + 1} OF ${studyPlan.topics.length}`;
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

            if (
                currentTopicIndex <
                studyPlan.topics.length - 1
            ) {

                nextTopicMessage.innerHTML =
                    `Next up: <strong>${escapeHTML(
                        studyPlan.topics[
                            currentTopicIndex + 1
                        ].name
                    )}</strong>`;

            } else {

                nextTopicMessage.innerHTML =
                    "🎉 You have completed every topic in this study plan!";
            }

        } else {

            nextTopicMessage.innerHTML =
                "";
        }
    }


    /*
        Hide knowledge check until a topic is completed.
    */

    if (topicQuestionsSection) {

        topicQuestionsSection.style.display =
            completed
                ? "block"
                : "none";
    }
}


function selectTopic(index) {

    if (
        index < 0 ||
        index >= studyPlan.topics.length
    ) {
        return;
    }


    currentTopicIndex = index;


    localStorage.setItem(
        "studyMindCurrentTopicIndex",
        String(currentTopicIndex)
    );


    renderTopics();

    renderCurrentTopic();

    generateTopicQuestions();
}


/* =========================================================
   12. TOPIC COMPLETION
========================================================= */

function isTopicCompleted(index) {

    return completedTopics.includes(index);
}


function setupTopicCompletion() {

    if (!topicCompleteCheckbox) return;


    topicCompleteCheckbox.addEventListener(
        "change",
        () => {

            const index =
                currentTopicIndex;

            const topic =
                studyPlan.topics[index];


            if (!topic) return;


            if (
                topicCompleteCheckbox.checked
            ) {

                if (
                    !completedTopics.includes(
                        index
                    )
                ) {

                    completedTopics.push(
                        index
                    );
                }


                topic.status =
                    "Completed";


                /*
                    Remove duplicates.
                */

                completedTopics =
                    [
                        ...new Set(
                            completedTopics
                        )
                    ];


                /*
                    Keep completed topic
                    indexes sorted.
                */

                completedTopics.sort(
                    (a, b) => a - b
                );


                if (topicCompletionMessage) {

                    topicCompletionMessage.textContent =
                        "Topic completed. Great work!";
                }


                /*
                    Move to next topic after
                    the user has completed this one.
                */

                if (
                    currentTopicIndex <
                    studyPlan.topics.length - 1
                ) {

                    if (nextTopicMessage) {

                        nextTopicMessage.innerHTML =
                            `✓ Completed! Next up: <strong>${escapeHTML(
                                studyPlan.topics[
                                    currentTopicIndex + 1
                                ].name
                            )}</strong>`;
                    }

                } else {

                    if (nextTopicMessage) {

                        nextTopicMessage.innerHTML =
                            "🎉 You completed every topic in this study plan!";
                    }
                }


                generateTopicQuestions();


            } else {

                completedTopics =
                    completedTopics.filter(
                        item =>
                            item !== index
                    );


                topic.status =
                    "In Progress";


                if (topicCompletionMessage) {

                    topicCompletionMessage.textContent =
                        "Tick this box when you are done studying this topic.";
                }


                if (nextTopicMessage) {
                    nextTopicMessage.innerHTML =
                        "";
                }
            }


            localStorage.setItem(
                "studyMindCompletedTopics",
                JSON.stringify(
                    completedTopics
                )
            );


            saveStudyPlan();

            renderMetrics();

            renderTopics();

            renderCurrentTopic();

            updateCalendar();

            updateNextSession();
        }
    );
}


/* =========================================================
   13. KNOWLEDGE CHECK
========================================================= */

function generateTopicQuestions() {

    if (!topicQuestions) return;


    const topic =
        studyPlan.topics[
            currentTopicIndex
        ];


    if (!topic) return;


    /*
        These are local questions for now.
        They can later be replaced by a real
        AI/API question generator.
    */

    const questions = [
        {
            question:
                `What is the main idea you should understand when studying ${topic.name}?`,
            options: [
                "The fundamental concept and how it is applied",
                "Only the topic's title",
                "Nothing beyond memorization",
                "Only unrelated examples"
            ],
            answer: 0
        },

        {
            question:
                `Which approach is most useful when studying ${topic.name}?`,
            options: [
                "Understand the concept and practise it",
                "Skip all examples",
                "Memorize without understanding",
                "Avoid revision"
            ],
            answer: 0
        },

        {
            question:
                `Why should you practise questions on ${topic.name}?`,
            options: [
                "To test understanding and identify weak areas",
                "To make studying longer",
                "To avoid learning the topic",
                "There is no reason"
            ],
            answer: 0
        },

        {
            question:
                `What should you do if you struggle with ${topic.name}?`,
            options: [
                "Review the concept and practise simpler examples",
                "Immediately give up",
                "Skip the entire subject",
                "Ignore the difficulty"
            ],
            answer: 0
        },

        {
            question:
                `How can ${topic.name} help with exam preparation?`,
            options: [
                "It helps build knowledge needed to answer related questions",
                "It guarantees every exam question",
                "It removes the need to study",
                "It replaces every other subject"
            ],
            answer: 0
        }
    ];


    topicQuestions.innerHTML =
        questions.map(
            (question, index) => {

                return `
                    <div
                        class="question-card"
                        style="margin-bottom:20px;"
                    >

                        <h3>
                            ${index + 1}.
                            ${escapeHTML(
                                question.question
                            )}
                        </h3>

                        <div class="question-options">

                            ${question.options
                                .map(
                                    (option, optionIndex) => {

                                        return `
                                            <label
                                                style="
                                                    display:block;
                                                    margin:8px 0;
                                                    cursor:pointer;
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
                                        `;
                                    }
                                )
                                .join("")}

                        </div>

                    </div>
                `;
            }
        ).join("");


    /*
        Store answers temporarily on the section.
    */

    topicQuestions.dataset.answerKey =
        JSON.stringify(
            questions.map(
                question =>
                    question.answer
            )
        );
}


function setupTopicQuestions() {

    if (!submitTopicQuestions) return;


    submitTopicQuestions.addEventListener(
        "click",
        () => {

            if (!topicQuestions) return;


            const answerKey =
                JSON.parse(
                    topicQuestions.dataset.answerKey ||
                    "[]"
                );


            if (
                answerKey.length === 0
            ) {
                generateTopicQuestions();
                return;
            }


            let score = 0;

            let answered = 0;


            answerKey.forEach(
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
                            score++;
                        }
                    }
                }
            );


            if (
                answered < answerKey.length
            ) {

                alert(
                    "Please answer all 5 questions before submitting."
                );

                return;
            }


            if (topicQuestionResult) {

                const percentage =
                    Math.round(
                        (
                            score /
                            answerKey.length
                        ) *
                        100
                    );


                topicQuestionResult.innerHTML =
                    `
                        <div
                            class="ai-box"
                            style="margin-top:15px;"
                        >

                            <strong>
                                Knowledge Check Result
                            </strong>

                            <p>
                                You scored
                                ${score}/${answerKey.length}
                                (${percentage}%).
                            </p>

                            <p>
                                ${
                                    percentage >= 80
                                        ? "Excellent work! 🎉"
                                        : percentage >= 60
                                            ? "Good work. Review the topic once more and keep practising."
                                            : "Review the topic again and try another practice session."
                                }
                            </p>

                        </div>
                    `;
            }
        }
    );
}


/* =========================================================
   14. SCHEDULE
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


    const today =
        new Date();


    let html = "";


    for (
        let i = 0;
        i < 7;
        i++
    ) {

        const date =
            new Date(today);


        date.setDate(
            today.getDate() + i
        );


        const dateString =
            getDateString(date);


        const dayName =
            days[
                date.getDay()
            ];


        let type =
            "Study Day";


        let badgeClass =
            "badge-study";


        /*
            BREAK / REST DAYS
            Sunday is a weekly break.
        */

        if (
            date.getDay() === 0
        ) {

            type =
                "Break";

            badgeClass =
                "badge-rest";

        }


        /*
            Exam day takes priority.
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
        }


        /*
            Test day.
            Wednesday becomes the test day
            unless it is an exam day.
        */

        else if (
            date.getDay() === 3
        ) {

            type =
                "Test Day";

            badgeClass =
                "badge-test";
        }


        let topicName =
            "Revision Session";


        if (
            type !== "Break" &&
            studyPlan.topics.length > 0
        ) {

            topicName =
                studyPlan.topics[
                    i %
                    studyPlan.topics.length
                ].name;
        }


        let description;


        if (
            type === "Break"
        ) {

            description =
                "Take time off to recharge.";

        } else if (
            type === "Exam Day"
        ) {

            description =
                "Exam day — stay calm and do your best.";

        } else if (
            type === "Test Day"
        ) {

            description =
                "Review your work and test your understanding.";

        } else {

            description =
                topicName;
        }


        html += `
            <div
                class="schedule-item align-center justify-between"
                style="
                    padding:10px;
                    border-bottom:1px solid #eee;
                    display:flex;
                    gap:15px;
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


/* =========================================================
   15. CALENDAR
========================================================= */

let calendarViewDate =
    new Date();


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
        calendarViewDate.getFullYear();


    const month =
        calendarViewDate.getMonth();


    calendarMonth.textContent =
        calendarViewDate.toLocaleDateString(
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


    /*
        Actual calendar days.
    */

    for (
        let dateNumber = 1;
        dateNumber <= daysInMonth;
        dateNumber++
    ) {

        const dayDiv =
            document.createElement(
                "div"
            );


        dayDiv.className =
            "calendar-day";


        dayDiv.textContent =
            dateNumber;


        const cellDate =
            new Date(
                year,
                month,
                dateNumber
            );


        const dateString =
            getDateString(
                cellDate
            );


        /*
            TODAY
        */

        if (
            dateString === todayStr
        ) {

            dayDiv.classList.add(
                "today"
            );
        }


        /*
            Determine day type.
        */

        const dayOfWeek =
            cellDate.getDay();


        /*
            BREAK DAY
            Sunday = Break
        */

        if (
            dayOfWeek === 0
        ) {

            dayDiv.classList.add(
                "break-day"
            );

            dayDiv.title =
                "Break Day";
        }


        /*
            TEST DAY
            Wednesday
        */

        if (
            dayOfWeek === 3
        ) {

            dayDiv.classList.add(
                "test-day"
            );

            dayDiv.title =
                "Test Day";
        }


        /*
            EXAM DAY
        */

        if (
            studyPlan.examDate &&
            dateString ===
            studyPlan.examDate
        ) {

            dayDiv.classList.add(
                "exam-day"
            );

            dayDiv.title =
                "Exam Day";
        }


        /*
            Completed topics are represented
            on study days.
        */

        if (
            isStudyDay(cellDate) &&
            hasCompletedActivityForDate(
                dateString
            )
        ) {

            dayDiv.classList.add(
                "completed-day"
            );
        }


        calendarDays.appendChild(
            dayDiv
        );
    }
}


function isStudyDay(date) {

    /*
        Sunday is the weekly break.
    */

    return date.getDay() !== 0;
}


function hasCompletedActivityForDate(
    dateString
) {

    /*
        At the moment, topic completion is
        stored globally rather than per date.

        Therefore we only mark dates up to
        today's completed progress.

        This avoids falsely marking future
        dates as completed.
    */

    if (
        dateString > todayStr
    ) {
        return false;
    }


    return (
        completedTopics.length > 0
    );
}


/* =========================================================
   16. CALENDAR NAVIGATION
========================================================= */

function setupCalendarNavigation() {

    if (previousMonth) {

        previousMonth.addEventListener(
            "click",
            () => {

                calendarViewDate =
                    new Date(
                        calendarViewDate.getFullYear(),
                        calendarViewDate.getMonth() - 1,
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

                calendarViewDate =
                    new Date(
                        calendarViewDate.getFullYear(),
                        calendarViewDate.getMonth() + 1,
                        1
                    );

                renderCalendar();
            }
        );
    }
}


function updateCalendar() {

    renderCalendar();
}


/* =========================================================
   17. NEXT SESSION
========================================================= */

function updateNextSession() {

    if (
        !nextBooking ||
        !nextBookingTime
    ) {
        return;
    }


    const now =
        new Date();


    for (
        let i = 0;
        i < 14;
        i++
    ) {

        const date =
            new Date(now);


        date.setDate(
            now.getDate() + i
        );


        /*
            Sunday = break.
        */

        if (
            date.getDay() === 0
        ) {
            continue;
        }


        const dateString =
            getDateString(date);


        if (
            studyPlan.examDate &&
            dateString ===
            studyPlan.examDate
        ) {

            nextBooking.textContent =
                "Exam Day";


            nextBookingTime.textContent =
                date.toLocaleDateString(
                    "en-US",
                    {
                        weekday: "long",
                        month: "long",
                        day: "numeric"
                    }
                );

            return;
        }


        let topic =
            "Revision Session";


        if (
            studyPlan.topics.length > 0
        ) {

            topic =
                studyPlan.topics[
                    i %
                    studyPlan.topics.length
                ].name;
        }


        nextBooking.textContent =
            topic;


        nextBookingTime.textContent =
            date.toLocaleDateString(
                "en-US",
                {
                    weekday: "long",
                    month: "long",
                    day: "numeric"
                }
            );


        return;
    }


    nextBooking.textContent =
        "No upcoming session yet";


    nextBookingTime.textContent =
        "Create a study plan to populate your calendar.";
}


/* =========================================================
   18. STUDY TIMER
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

    if (!studyTimer) {
        return;
    }


    /*
        Make sure select matches saved duration.
    */

    if (timerDurationSelect) {

        const selectedMinutes =
            Math.round(
                selectedTimerSeconds /
                60
            );


        const matchingOption =
            Array.from(
                timerDurationSelect.options
            ).find(
                option =>
                    Number(
                        option.value
                    ) ===
                    selectedMinutes
            );


        if (matchingOption) {

            timerDurationSelect.value =
                String(
                    selectedMinutes
                );
        }
    }


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

        timerDurationSelect.addEventListener(
            "change",
            () => {

                const minutes =
                    Number(
                        timerDurationSelect.value
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


                    /*
                        Timer completion contributes
                        to the streak/score.
                    */

                    registerStudySession();


                    alert(
                        "⏰ Study Session Complete!\n\nGreat job maintaining your focus."
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
        Save the remaining time
        before stopping.
    */

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


    localStorage.setItem(
        "studyMindTimerSeconds",
        String(
            timerSeconds
        )
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

    if (!studyTimer) {
        return;
    }


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
   19. STUDY SESSION TRACKING
========================================================= */

function registerStudySession() {

    let sessions =
        Number(
            localStorage.getItem(
                "studyMindCompletedSessions"
            )
        ) || 0;


    sessions++;


    localStorage.setItem(
        "studyMindCompletedSessions",
        String(sessions)
    );


    currentStreak =
        Math.max(
            1,
            currentStreak
        );


    currentStreak++;


    localStorage.setItem(
        "studyMindStreak",
        String(
            currentStreak
        )
    );


    renderMetrics();
}


/* =========================================================
   20. ASK AI
========================================================= */

function updateAiBadge() {

    if (!aiCountBadge) {
        return;
    }


    aiCountBadge.textContent =
        `${aiQuestionCount}/${FREE_LIMIT} used`;
}


function setupAskAI() {

    updateAiBadge();


    if (
        !askAIButton ||
        !aiQuestion
    ) {
        return;
    }


    askAIButton.addEventListener(
        "click",
        handleAskAI
    );


    /*
        Allow Ctrl + Enter to submit.
    */

    aiQuestion.addEventListener(
        "keydown",
        event => {

            if (
                event.ctrlKey &&
                event.key === "Enter"
            ) {

                handleAskAI();
            }
        }
    );


    updateAIAvailability();
}


function handleAskAI() {

    if (
        aiQuestionCount >=
        FREE_LIMIT
    ) {

        alert(
            "🔒 You have reached your 5 free AI questions limit!\n\nPlease explore StudyMind AI Premium for unlimited AI assistance."
        );

        return;
    }


    const question =
        aiQuestion.value.trim();


    if (!question) {

        alert(
            "Please enter a question first."
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


    /*
        Local contextual response.
        This prevents the dashboard from
        pretending that a real AI API is
        connected when it isn't.
    */

    const response =
        generateLocalAIResponse(
            question
        );


    if (aiResponse) {

        aiResponse.innerHTML =
            `
                <div class="ai-box">

                    <strong>
                        🤖 StudyMind AI
                    </strong>

                    <p>
                        ${response}
                    </p>

                </div>
            `;
    }


    aiQuestion.value =
        "";


    updateAIAvailability();
}


function updateAIAvailability() {

    if (!aiQuestion || !askAIButton) {
        return;
    }


    if (
        aiQuestionCount >=
        FREE_LIMIT
    ) {

        aiQuestion.disabled =
            true;


        askAIButton.disabled =
            true;


        askAIButton.textContent =
            "Explore Premium for Unlimited AI";

    } else {

        aiQuestion.disabled =
            false;


        askAIButton.disabled =
            false;


        askAIButton.textContent =
            "🤖 Ask AI";
    }
}


function generateLocalAIResponse(
    question
) {

    const lower =
        question.toLowerCase();


    const currentTopic =
        studyPlan.topics[
            currentTopicIndex
        ];


    if (
        lower.includes("today")
    ) {

        return `
            Based on your current study plan,
            your focus should be
            <strong>${escapeHTML(
                currentTopic
                    ? currentTopic.name
                    : "your next available topic"
            )}</strong>.
            Aim for ${studyPlan.studyHours || 2}
            hours of focused study today.
        `;
    }


    if (
        lower.includes("progress") ||
        lower.includes("doing")
    ) {

        return `
            Your current study progress is
            <strong>${calculateProgress()}%</strong>.
            You have completed
            <strong>${completedTopics.length}</strong>
            of
            <strong>${studyPlan.topics.length}</strong>
            topics.
        `;
    }


    if (
        lower.includes("subject")
    ) {

        return `
            Your current subjects are:
            <strong>${studyPlan.subjects
                .map(
                    subject =>
                        escapeHTML(subject)
                )
                .join(", ")}</strong>.
        `;
    }


    if (
        lower.includes("topic")
    ) {

        return `
            Your current topic is
            <strong>${escapeHTML(
                currentTopic
                    ? currentTopic.name
                    : "not set"
            )}</strong>.
            ${currentTopic
                ? escapeHTML(
                    currentTopic.description
                )
                : "Create a study plan to add topics."
            }
        `;
    }


    return `
        Based on your
        <strong>${escapeHTML(
            studyPlan.examType ||
            "exam"
        )}</strong>
        study plan, I recommend focusing on
        <strong>${escapeHTML(
            currentTopic
                ? currentTopic.name
                : "your next topic"
        )}</strong>,
        studying consistently, and using practice
        questions to check your understanding.
    `;
}


/* =========================================================
   21. PROGRESS ANALYSIS
========================================================= */

function setupProgressAnalysis() {

    if (
        !analyzeProgressButton
    ) {
        return;
    }


    analyzeProgressButton.addEventListener(
        "click",
        () => {

            const progress =
                calculateProgress();


            const total =
                studyPlan.topics.length;


            const completed =
                completedTopics.length;


            let advice;


            if (
                total === 0
            ) {

                advice =
                    "Create a study plan with subjects and topics first.";

            } else if (
                progress >= 80
            ) {

                advice =
                    `Excellent work! You have completed ${completed} of ${total} topics. Focus now on revision and practice questions.`;

            } else if (
                progress >= 50
            ) {

                advice =
                    `You're making good progress at ${progress}%. Keep your study sessions consistent and concentrate on your remaining topics.`;

            } else {

                advice =
                    `You are currently at ${progress}%. Focus on completing one topic at a time and maintain a consistent daily study routine.`;
            }


            if (aiAdviceText) {

                aiAdviceText.innerHTML =
                    `
                        <strong>
                            📊 Your Study Analysis
                        </strong>

                        <br><br>

                        ${advice}
                    `;
            }
        }
    );
}


/* =========================================================
   22. DOCUMENT SUMMARIZER
========================================================= */

function updateSummaryBadge() {

    if (!summaryCountBadge) {
        return;
    }


    summaryCountBadge.textContent =
        `${summaryUsageCount}/${FREE_LIMIT} used`;
}


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
        handleSummarize
    );


    updateSummaryAvailability();
}


function handleSummarize() {

    if (
        summaryUsageCount >=
        FREE_LIMIT
    ) {

        alert(
            "🔒 You have reached your 5 free document summaries limit!\n\nExplore StudyMind AI Premium for more summaries."
        );

        return;
    }


    const content =
        summarizeInput.value.trim();


    if (!content) {

        alert(
            "Please paste your study material first."
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


    const examContext =
        studyPlan.examType ||
        "WAEC";


    const summary =
        createLocalSummary(
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
                        (Tailored for ${escapeHTML(
                            examContext
                        )})
                    </h4>

                    <p>
                        <strong>
                            Key Study Points:
                        </strong>
                    </p>

                    <ul>
                        ${summary
                            .map(
                                point =>
                                    `<li>${escapeHTML(point)}</li>`
                            )
                            .join("")}
                    </ul>

                </div>
            `;
    }


    updateSummaryAvailability();
}


function createLocalSummary(
    content
) {

    /*
        A lightweight local summary.
        It extracts the first several meaningful
        sentences instead of pretending a real
        AI summarization API is connected.
    */

    const cleaned =
        content
            .replace(
                /\s+/g,
                " "
            )
            .trim();


    const sentences =
        cleaned
            .split(
                /(?<=[.!?])\s+/
            )
            .filter(
                sentence =>
                    sentence.length > 20
            );


    if (
        sentences.length === 0
    ) {

        return [
            "Review the main definitions and concepts in the material.",
            "Identify important examples, formulas, and relationships.",
            "Practise questions based on the material."
        ];
    }


    return sentences
        .slice(0, 5);
}


function updateSummaryAvailability() {

    if (
        !summarizeInput ||
        !summarizeBtn
    ) {
        return;
    }


    if (
        summaryUsageCount >=
        FREE_LIMIT
    ) {

        summarizeInput.disabled =
            true;


        summarizeBtn.disabled =
            true;


        summarizeBtn.textContent =
            "Explore Premium for Unlimited Summaries";

    } else {

        summarizeInput.disabled =
            false;


        summarizeBtn.disabled =
            false;


        summarizeBtn.textContent =
            "✨ Summarize Notes";
    }
}


/* =========================================================
   23. THEME
========================================================= */

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

            const isDark =
                document.body.classList.toggle(
                    "dark-mode"
                );


            localStorage.setItem(
                "studyMindTheme",
                isDark
                    ? "dark"
                    : "light"
            );


            themeButton.textContent =
                isDark
                    ? "☀️ Light Mode"
                    : "🌙 Dark Mode";
        }
    );
}


/* =========================================================
   24. ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }


    return String(value)
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
   25. KEEP DATA SAFE
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


        localStorage.setItem(
            "studyMindStreak",
            String(
                currentStreak
            )
        );
    }
);


/* =========================================================
   26. SUPABASE AUTH STATE
========================================================= */

if (
    typeof supabaseClient !==
    "undefined" &&
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

                console.log(
                    "StudyMind AI auth:",
                    event
                );

            } else {

                currentUser =
                    null;

                isAuthenticated =
                    false;
            }
        }
    );
}


/* =========================================================
   END OF DASHBOARD.JS
========================================================= */
