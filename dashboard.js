/* =========================================
   STUDYMIND AI — DASHBOARD JAVASCRIPT
========================================= */


/* =========================================
   AUTHENTICATION CHECK
========================================= */

async function checkAuthentication() {

    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();


    if (error || !user) {

        window.location.href =
            "login.html";

        return false;

    }


    return true;

}


/* =========================================
   LOAD STUDY PLAN
========================================= */

let studyPlan =
    JSON.parse(
        localStorage.getItem(
            "studyMindPlan"
        )
    );


const FREE_QUESTION_LIMIT = 5;


let aiQuestionCount =
    Number(
        localStorage.getItem(
            "aiQuestionCount"
        )
    ) || 0;


/* =========================================
   THEME
========================================= */

const themeButton =
    document.getElementById(
        "themeButton"
    );


if (themeButton) {

    const savedTheme =
        localStorage.getItem(
            "studyMindTheme"
        );


    if (savedTheme === "light") {

        document.body.classList.add(
            "light-mode"
        );

        themeButton.textContent =
            "☀️ Light Mode";

    }


    themeButton.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "light-mode"
            );


            const isLight =
                document.body.classList.contains(
                    "light-mode"
                );


            localStorage.setItem(
                "studyMindTheme",
                isLight
                    ? "light"
                    : "dark"
            );


            themeButton.textContent =
                isLight
                    ? "☀️ Light Mode"
                    : "🌙 Dark Mode";

        }
    );

}


/* =========================================
   DEFAULT DATA
========================================= */

if (!studyPlan) {

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
            0

    };

}


/*
 * Backwards compatibility:
 * If an older plan exists without topics,
 * the dashboard still works.
 */

if (!Array.isArray(studyPlan.topics)) {

    studyPlan.topics = [];

}


/* =========================================
   DASHBOARD ELEMENTS
========================================= */

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


const subjectList =
    document.getElementById(
        "subjectList"
    );


const progressPercent =
    document.getElementById(
        "progressPercent"
    );


const progressCount =
    document.getElementById(
        "progressCount"
    );


const progressBar =
    document.getElementById(
        "progressBar"
    );


const streak =
    document.getElementById(
        "streak"
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


const calendarDays =
    document.getElementById(
        "calendarDays"
    );


const calendarMonth =
    document.getElementById(
        "calendarMonth"
    );


const nextBooking =
    document.getElementById(
        "nextBooking"
    );


const nextBookingTime =
    document.getElementById(
        "nextBookingTime"
    );


const scheduleList =
    document.getElementById(
        "scheduleList"
    );


/* =========================================
   NEW TOPIC ELEMENTS
========================================= */

const topicStudyContent =
    document.getElementById(
        "topicStudyContent"
    );


const topicStatusBadge =
    document.getElementById(
        "topicStatusBadge"
    );


const topicProgressList =
    document.getElementById(
        "topicProgressList"
    );


const topicQuizSection =
    document.getElementById(
        "topicQuizSection"
    );


const topicQuizContent =
    document.getElementById(
        "topicQuizContent"
    );


/* =========================================
   COMPLETED SUBJECTS
========================================= */

let completedSubjects =
    JSON.parse(
        localStorage.getItem(
            "studyMindCompletedSubjects"
        )
    ) || [];


/* =========================================
   COMPLETED TOPICS
========================================= */

let completedTopics =
    JSON.parse(
        localStorage.getItem(
            "studyMindCompletedTopics"
        )
    ) || [];


/* =========================================
   CURRENT TOPIC INDEX
========================================= */

let currentTopicIndex =
    Number(
        localStorage.getItem(
            "studyMindCurrentTopicIndex"
        )
    );


if (
    !Number.isInteger(
        currentTopicIndex
    ) ||
    currentTopicIndex < 0
) {

    currentTopicIndex = 0;

}


/* =========================================
   STUDY TIMER
========================================= */

let studyTimerInterval =
    null;


let studyTimerSeconds =
    25 * 60;


let timerRunning =
    false;


/* =========================================
   STUDY STREAK
========================================= */

let currentStreak =
    Number(
        localStorage.getItem(
            "studyMindStreak"
        )
    ) || 0;


/* =========================================
   INITIALIZE DASHBOARD
========================================= */

function initializeDashboard() {

    updateStatistics();

    renderSubjects();

    renderTopicProgress();

    updateProgress();

    updateStreak();

    updateStudyScore();

    renderCalendar();

    renderSchedule();

    updateNextBooking();

    renderCurrentTopic();

}


/* =========================================
   STATISTICS
========================================= */

function updateStatistics() {

    const hours =
        Number(
            studyPlan.studyHours
        ) || 0;


    if (weeklyHours) {

        weeklyHours.textContent =
            hours * 7;

    }


    if (daysLeft) {

        daysLeft.textContent =
            calculateDaysLeft();

    }


    if (dailyGoal) {

        dailyGoal.textContent =
            `${hours} hrs`;

    }


    updateStudyScore();

}


/* =========================================
   CALCULATE DAYS LEFT
========================================= */

function calculateDaysLeft() {

    if (!studyPlan.examDate) {

        return 0;

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


    return Math.max(
        0,
        Math.ceil(
            (
                exam - today
            ) /
            (
                1000 *
                60 *
                60 *
                24
            )
        )
    );

}


/* =========================================
   SUBJECTS
========================================= */

function renderSubjects() {

    if (!subjectList) return;


    subjectList.innerHTML =
        "";


    const subjects =
        studyPlan.subjects || [];


    if (subjects.length === 0) {

        subjectList.innerHTML = `

            <div class="empty-state">

                <span>📚</span>

                <p>
                    No subjects yet.
                    Create a study plan to begin.
                </p>

            </div>

        `;

        return;

    }


    subjects.forEach(
        (subject, index) => {

            const completed =
                completedSubjects.includes(
                    subject
                );


            const subjectItem =
                document.createElement(
                    "div"
                );


            subjectItem.className =
                "subject-item";


            if (completed) {

                subjectItem.classList.add(
                    "completed"
                );

            }


            subjectItem.innerHTML = `

                <div class="subject-info">

                    <button
                        class="subject-check"
                        data-subject="${escapeHTML(subject)}"
                        aria-label="Complete ${escapeHTML(subject)}"
                    >
                        ${completed ? "✓" : ""}
                    </button>

                    <div>

                        <strong>
                            ${escapeHTML(subject)}
                        </strong>

                        <span>
                            ${
                                completed
                                    ? "Completed"
                                    : "In progress"
                            }
                        </span>

                    </div>

                </div>


                <span class="subject-number">
                    ${String(
                        index + 1
                    ).padStart(
                        2,
                        "0"
                    )}
                </span>

            `;


            subjectList.appendChild(
                subjectItem
            );

        }
    );


    document
        .querySelectorAll(
            ".subject-check"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        toggleSubject(
                            button.dataset.subject
                        );

                    }
                );

            }
        );

}


/* =========================================
   TOGGLE SUBJECT
========================================= */

function toggleSubject(subject) {

    if (
        completedSubjects.includes(
            subject
        )
    ) {

        completedSubjects =
            completedSubjects.filter(
                item =>
                    item !== subject
            );

    }

    else {

        completedSubjects.push(
            subject
        );

    }


    localStorage.setItem(
        "studyMindCompletedSubjects",
        JSON.stringify(
            completedSubjects
        )
    );


    renderSubjects();

    updateProgress();

    updateStudyScore();

}


/* =========================================
   TOPIC PROGRESS
========================================= */

function renderTopicProgress() {

    if (!topicProgressList) return;


    const topics =
        studyPlan.topics || [];


    topicProgressList.innerHTML =
        "";


    if (topics.length === 0) {

        topicProgressList.innerHTML = `

            <div class="empty-state">

                <span>📖</span>

                <p>
                    No topics have been added to this plan.
                </p>

            </div>

        `;

        return;

    }


    topics.forEach(
        (topic, index) => {

            const completed =
                completedTopics.includes(
                    topic
                );


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "subject-item";


            if (completed) {

                item.classList.add(
                    "completed"
                );

            }


            item.innerHTML = `

                <div class="subject-info">

                    <div class="subject-check ${
                        completed
                            ? "topic-completed-check"
                            : ""
                    }">

                        ${
                            completed
                                ? "✓"
                                : index + 1
                        }

                    </div>

                    <div>

                        <strong>
                            ${escapeHTML(topic)}
                        </strong>

                        <span>
                            ${
                                completed
                                    ? "Completed"
                                    : index === currentTopicIndex
                                        ? "Current topic"
                                        : "Upcoming"
                            }
                        </span>

                    </div>

                </div>

                <span class="subject-number">

                    ${
                        completed
                            ? "✓"
                            : String(
                                index + 1
                            ).padStart(
                                2,
                                "0"
                            )
                    }

                </span>

            `;


            topicProgressList.appendChild(
                item
            );

        }
    );

}


/* =========================================
   CURRENT TOPIC
========================================= */

function getCurrentTopic() {

    const topics =
        studyPlan.topics || [];


    if (
        topics.length === 0
    ) {

        return null;

    }


    /*
     * Find the first unfinished topic.
     * This makes the system resilient even
     * if localStorage gets out of sync.
     */

    for (
        let i = 0;
        i < topics.length;
        i++
    ) {

        if (
            !completedTopics.includes(
                topics[i]
            )
        ) {

            currentTopicIndex =
                i;

            localStorage.setItem(
                "studyMindCurrentTopicIndex",
                currentTopicIndex
            );

            return topics[i];

        }

    }


    return null;

}


/* =========================================
   RENDER CURRENT TOPIC
========================================= */

function renderCurrentTopic() {

    if (!topicStudyContent) return;


    const topics =
        studyPlan.topics || [];


    if (topics.length === 0) {

        topicStudyContent.innerHTML = `

            <div class="topic-session-empty">

                <div class="topic-empty-icon">
                    📚
                </div>

                <h3>
                    No topics yet
                </h3>

                <p>
                    Create a new study plan and
                    add the topics you want to study.
                </p>

                <a
                    href="index.html#generator"
                    class="primary-button"
                >
                    Create Study Plan
                </a>

            </div>

        `;

        if (topicStatusBadge) {

            topicStatusBadge.textContent =
                "NO PLAN";

        }

        return;

    }


    const currentTopic =
        getCurrentTopic();


    /*
     * ALL TOPICS COMPLETED
     */

    if (!currentTopic) {

        if (topicStatusBadge) {

            topicStatusBadge.textContent =
                "COMPLETED";

        }


        topicStudyContent.innerHTML = `

            <div class="all-topics-completed">

                <div class="topic-success-icon">
                    ✓
                </div>

                <h2>
                    🎉 All topics have been completed!
                </h2>

                <p>
                    Excellent work. You have finished
                    every topic in your current study plan.
                </p>

                <p>
                    You can now review your material
                    and test yourself with practice questions.
                </p>

                <button
                    class="primary-button"
                    id="reviewTopicsButton"
                >
                    Review My Topics
                </button>

            </div>

        `;


        const reviewButton =
            document.getElementById(
                "reviewTopicsButton"
            );


        if (reviewButton) {

            reviewButton.addEventListener(
                "click",
                () => {

                    if (topics.length > 0) {

                        completedTopics =
                            [];

                        currentTopicIndex =
                            0;


                        localStorage.setItem(
                            "studyMindCompletedTopics",
                            JSON.stringify(
                                completedTopics
                            )
                        );


                        localStorage.setItem(
                            "studyMindCurrentTopicIndex",
                            "0"
                        );


                        renderCurrentTopic();

                        renderTopicProgress();

                    }

                }
            );

        }


        return;

    }


    if (topicStatusBadge) {

        topicStatusBadge.textContent =
            "IN PROGRESS";

    }


    topicStudyContent.innerHTML = `

        <div class="current-topic-header">

            <div>

                <span class="topic-label">
                    TOPIC ${currentTopicIndex + 1}
                    OF ${topics.length}
                </span>

                <h2>
                    ${escapeHTML(currentTopic)}
                </h2>

                <p>
                    Focus on this topic during your
                    study session. When you finish,
                    mark it as completed below.
                </p>

            </div>

        </div>


        <div class="topic-timer-card">

            <div class="timer-label">
                STUDY TIMER
            </div>

            <div
                id="studyTimerDisplay"
                class="study-timer-display"
            >
                25:00
            </div>

            <div class="timer-controls">

                <button
                    id="startTimerButton"
                    class="primary-button"
                >
                    ▶ Start Timer
                </button>

                <button
                    id="pauseTimerButton"
                    class="secondary-button"
                    disabled
                >
                    ⏸ Pause
                </button>

                <button
                    id="resetTimerButton"
                    class="secondary-button"
                >
                    ↻ Reset
                </button>

            </div>

        </div>


        <div class="topic-completion-area">

            <div class="topic-completion-box">

                <button
                    id="completeTopicCheckbox"
                    class="topic-complete-button"
                    type="button"
                    aria-label="Mark topic as completed"
                >
                    <span id="topicCheckIcon"></span>
                </button>


                <div>

                    <strong>
                        I have finished studying this topic
                    </strong>

                    <p>
                        Tick this box when you are done
                        studying ${escapeHTML(currentTopic)}.
                    </p>

                </div>

            </div>

        </div>

    `;


    setupTopicTimer();

    setupTopicCompletion();

}


/* =========================================
   TOPIC TIMER
========================================= */

function setupTopicTimer() {

    clearInterval(
        studyTimerInterval
    );


    studyTimerSeconds =
        25 * 60;


    timerRunning =
        false;


    const display =
        document.getElementById(
            "studyTimerDisplay"
        );


    const startButton =
        document.getElementById(
            "startTimerButton"
        );


    const pauseButton =
        document.getElementById(
            "pauseTimerButton"
        );


    const resetButton =
        document.getElementById(
            "resetTimerButton"
        );


    if (!display) return;


    function updateDisplay() {

        const minutes =
            Math.floor(
                studyTimerSeconds / 60
            );


        const seconds =
            studyTimerSeconds % 60;


        display.textContent =
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


    function startTimer() {

        if (timerRunning) return;


        timerRunning =
            true;


        if (startButton) {

            startButton.disabled =
                true;

        }


        if (pauseButton) {

            pauseButton.disabled =
                false;

        }


        studyTimerInterval =
            setInterval(
                () => {

                    if (
                        studyTimerSeconds <=
                        0
                    ) {

                        clearInterval(
                            studyTimerInterval
                        );


                        timerRunning =
                            false;


                        if (startButton) {

                            startButton.disabled =
                                false;

                        }


                        if (pauseButton) {

                            pauseButton.disabled =
                                true;

                        }


                        display.textContent =
                            "00:00";


                        alert(
                            "Your study timer is finished. If you have completed the topic, tick the completion box."
                        );


                        return;

                    }


                    studyTimerSeconds--;

                    updateDisplay();

                },
                1000
            );

    }


    function pauseTimer() {

        clearInterval(
            studyTimerInterval
        );


        timerRunning =
            false;


        if (startButton) {

            startButton.disabled =
                false;

        }


        if (pauseButton) {

            pauseButton.disabled =
                true;

        }

    }


    function resetTimer() {

        clearInterval(
            studyTimerInterval
        );


        timerRunning =
            false;


        studyTimerSeconds =
            25 * 60;


        updateDisplay();


        if (startButton) {

            startButton.disabled =
                false;

        }


        if (pauseButton) {

            pauseButton.disabled =
                true;

        }

    }


    if (startButton) {

        startButton.addEventListener(
            "click",
            startTimer
        );

    }


    if (pauseButton) {

        pauseButton.addEventListener(
            "click",
            pauseTimer
        );

    }


    if (resetButton) {

        resetButton.addEventListener(
            "click",
            resetTimer
        );

    }


    updateDisplay();

}


/* =========================================
   COMPLETE TOPIC
========================================= */

function setupTopicCompletion() {

    const completeButton =
        document.getElementById(
            "completeTopicCheckbox"
        );


    const checkIcon =
        document.getElementById(
            "topicCheckIcon"
        );


    if (!completeButton) return;


    completeButton.addEventListener(
        "click",
        async () => {

            const topics =
                studyPlan.topics || [];


            if (
                currentTopicIndex >=
                topics.length
            ) {

                return;

            }


            const topic =
                topics[
                    currentTopicIndex
                ];


            if (
                !completedTopics.includes(
                    topic
                )
            ) {

                completedTopics.push(
                    topic
                );

            }


            localStorage.setItem(
                "studyMindCompletedTopics",
                JSON.stringify(
                    completedTopics
                )
            );


            /*
             * Stop timer.
             */

            clearInterval(
                studyTimerInterval
            );


            timerRunning =
                false;


            /*
             * Generate the five questions
             * for the topic that was just completed.
             */

            await generateTopicQuiz(
                topic
            );


            /*
             * Move to next unfinished topic.
             */

            const nextIndex =
                topics.findIndex(
                    topicItem =>
                        !completedTopics.includes(
                            topicItem
                        )
                );


            if (nextIndex === -1) {

                currentTopicIndex =
                    topics.length;

            }

            else {

                currentTopicIndex =
                    nextIndex;

            }


            localStorage.setItem(
                "studyMindCurrentTopicIndex",
                currentTopicIndex
            );


            renderTopicProgress();

            updateStudyScore();

            updateProgress();


            /*
             * Show completion message
             * briefly before moving forward.
             */

            if (checkIcon) {

                checkIcon.textContent =
                    "✓";

            }


            completeButton.classList.add(
                "completed"
            );


            setTimeout(
                () => {

                    renderCurrentTopic();

                },
                1000
            );

        }
    );

}


/* =========================================
   TOPIC QUIZ
========================================= */

async function generateTopicQuiz(
    topic
) {

    if (
        !topicQuizSection ||
        !topicQuizContent
    ) {

        return;

    }


    topicQuizSection.style.display =
        "block";


    topicQuizContent.innerHTML = `

        <div class="quiz-loading">

            <div class="quiz-loading-icon">
                🤖
            </div>

            <h3>
                StudyMind AI is preparing your questions...
            </h3>

            <p>
                Creating 5 questions specifically
                about <strong>
                    ${escapeHTML(topic)}
                </strong>.
            </p>

        </div>

    `;


    topicQuizSection.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });


    try {

        const response =
            await fetch(
                "/api/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            message: `
You are StudyMind AI's topic assessment system.

The student has just finished studying this topic:

TOPIC:
${topic}

Create exactly 5 questions to test the student's understanding of this specific topic.

IMPORTANT:
- All 5 questions must be directly related to the topic.
- Do not ask questions about unrelated subjects.
- Mix the questions where appropriate.
- Make them suitable for a secondary-school student.
- Do not provide the answers immediately.
- Number the questions 1 to 5.
- Keep each question clear and concise.
- Do not use markdown tables.

Return only the 5 questions.
`
                        })
                }
            );


        if (!response.ok) {

            throw new Error(
                "Unable to generate topic questions."
            );

        }


        const data =
            await response.json();


        if (
            !data ||
            !data.reply
        ) {

            throw new Error(
                "The AI returned no questions."
            );

        }


        localStorage.setItem(
            "studyMindQuiz",
            JSON.stringify({

                topic,

                questions:
                    data.reply,

                createdAt:
                    new Date().toISOString()

            })
        );


        renderTopicQuiz(
            topic,
            data.reply
        );

    }


    catch (error) {

        console.error(
            "Topic quiz error:",
            error
        );


        topicQuizContent.innerHTML = `

            <div class="quiz-error">

                <h3>
                    ⚠️ We couldn't generate the questions
                </h3>

                <p>
                    The topic was still marked as completed.
                    You can try the quiz again.
                </p>

                <button
                    class="primary-button"
                    id="retryQuizButton"
                >
                    Try Again
                </button>

            </div>

        `;


        const retryButton =
            document.getElementById(
                "retryQuizButton"
            );


        if (retryButton) {

            retryButton.addEventListener(
                "click",
                () => {

                    generateTopicQuiz(
                        topic
                    );

                }
            );

        }

    }

}


/* =========================================
   RENDER TOPIC QUIZ
========================================= */

function renderTopicQuiz(
    topic,
    questions
) {

    if (
        !topicQuizSection ||
        !topicQuizContent
    ) {

        return;

    }


    topicQuizSection.style.display =
        "block";


    topicQuizContent.innerHTML = `

        <div class="quiz-topic-header">

            <span class="card-kicker">
                COMPLETED TOPIC
            </span>

            <h3>
                ${escapeHTML(topic)}
            </h3>

            <p>
                Answer these five questions to check
                how well you understood the topic.
            </p>

        </div>


        <div class="quiz-questions">

            <div class="quiz-question-text">
                ${renderAIResponse(
                    questions
                )}
            </div>

        </div>


        <div class="quiz-actions">

            <button
                class="secondary-button"
                id="hideQuizButton"
            >
                Hide Questions
            </button>

        </div>

    `;


    if (
        typeof renderMathInElement ===
        "function"
    ) {

        renderMathInElement(
            topicQuizContent,
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

                ]
            }
        );

    }


    const hideQuizButton =
        document.getElementById(
            "hideQuizButton"
        );


    if (hideQuizButton) {

        hideQuizButton.addEventListener(
            "click",
            () => {

                topicQuizSection.style.display =
                    "none";

            }
        );

    }

}


/* =========================================
   PROGRESS
========================================= */

function updateProgress() {

    const total =
        studyPlan.subjects
            ? studyPlan.subjects.length
            : 0;


    const completed =
        completedSubjects.filter(
            subject =>
                studyPlan.subjects &&
                studyPlan.subjects.includes(
                    subject
                )
        ).length;


    const percentage =
        total === 0
            ? 0
            : Math.round(
                (
                    completed /
                    total
                ) * 100
            );


    if (progressPercent) {

        progressPercent.textContent =
            `${percentage}%`;

    }


    if (progressCount) {

        progressCount.textContent =
            `${completed} of ${total} subjects completed`;

    }


    if (progressBar) {

        progressBar.style.width =
            `${percentage}%`;

    }

}


/* =========================================
   STREAK
========================================= */

function updateStreak() {

    if (streak) {

        streak.textContent =
            `${currentStreak} ${
                currentStreak === 1
                    ? "Day"
                    : "Days"
            }`;

    }

}


/* =========================================
   STUDY SCORE
========================================= */

function updateStudyScore() {

    const subjectTotal =
        studyPlan.subjects
            ? studyPlan.subjects.length
            : 0;


    const completedSubjectTotal =
        completedSubjects.filter(
            subject =>
                studyPlan.subjects &&
                studyPlan.subjects.includes(
                    subject
                )
        ).length;


    const topicTotal =
        studyPlan.topics
            ? studyPlan.topics.length
            : 0;


    const completedTopicTotal =
        completedTopics.filter(
            topic =>
                studyPlan.topics &&
                studyPlan.topics.includes(
                    topic
                )
        ).length;


    let score = 0;


    /*
     * If topics exist, use topic completion
     * as the main study score.
     *
     * Otherwise preserve the old
     * subject-based score.
     */

    if (topicTotal > 0) {

        score =
            Math.round(
                (
                    completedTopicTotal /
                    topicTotal
                ) * 100
            );

    }

    else if (subjectTotal > 0) {

        score =
            Math.round(
                (
                    completedSubjectTotal /
                    subjectTotal
                ) * 100
            );

    }


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

        }

        else if (score < 40) {

            scoreMessage.textContent =
                "Good start. Keep building momentum.";

        }

        else if (score < 70) {

            scoreMessage.textContent =
                "You're making solid progress.";

        }

        else if (score < 100) {

            scoreMessage.textContent =
                "Great work. Keep going.";

        }

        else {

            scoreMessage.textContent =
                "Excellent! All topics completed.";

        }

    }

}


/* =========================================
   CALENDAR
========================================= */

let calendarDate =
    new Date();


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


    const monthName =
        calendarDate.toLocaleDateString(
            "en-US",
            {
                month: "long",
                year: "numeric"
            }
        );


    calendarMonth.textContent =
        monthName;


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


    /* PREVIOUS MONTH */

    for (
        let i = firstDay - 1;
        i >= 0;
        i--
    ) {

        const day =
            document.createElement(
                "div"
            );


        day.className =
            "calendar-day other-month";


        day.innerHTML = `
            <span>
                ${previousMonthDays - i}
            </span>
        `;


        calendarDays.appendChild(
            day
        );

    }


    /* CURRENT MONTH */

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


        const current =
            new Date(
                year,
                month,
                date
            );


        const today =
            new Date();


        if (
            current.toDateString() ===
            today.toDateString()
        ) {

            day.classList.add(
                "today"
            );

        }


        /* STUDY DAYS */

        if (
            studyPlan.examDate &&
            current <=
                new Date(
                    studyPlan.examDate
                ) &&
            current >=
                new Date()
        ) {

            day.classList.add(
                "study-day"
            );

        }


        /* EXAM DAY */

        if (
            studyPlan.examDate
        ) {

            const exam =
                new Date(
                    studyPlan.examDate
                );


            if (
                current.toDateString() ===
                exam.toDateString()
            ) {

                day.classList.remove(
                    "study-day"
                );

                day.classList.add(
                    "exam-day"
                );

            }

        }


        /* COMPLETED INDICATOR */

        const subjectTotal =
            studyPlan.subjects
                ? studyPlan.subjects.length
                : 0;


        const completedTotal =
            completedSubjects.filter(
                subject =>
                    studyPlan.subjects &&
                    studyPlan.subjects.includes(
                        subject
                    )
            ).length;


        if (
            subjectTotal > 0 &&
            completedTotal === subjectTotal &&
            date % 2 === 0
        ) {

            day.classList.add(
                "completed-day"
            );

        }


        day.innerHTML = `

            <span class="day-number">
                ${date}
            </span>

        `;


        calendarDays.appendChild(
            day
        );

    }


    /* NEXT MONTH FILL */

    const totalCells =
        calendarDays.children.length;


    const remaining =
        42 - totalCells;


    for (
        let i = 1;
        i <= remaining;
        i++
    ) {

        const day =
            document.createElement(
                "div"
            );


        day.className =
            "calendar-day other-month";


        day.innerHTML = `
            <span>
                ${i}
            </span>
        `;


        calendarDays.appendChild(
            day
        );

    }

}


/* =========================================
   CALENDAR NAVIGATION
========================================= */

const previousMonth =
    document.getElementById(
        "previousMonth"
    );


const nextMonth =
    document.getElementById(
        "nextMonth"
    );


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
   SCHEDULE
========================================= */

function renderSchedule() {

    if (!scheduleList) return;


    const subjects =
        studyPlan.subjects || [];


    if (subjects.length === 0) {

        scheduleList.innerHTML = `

            <div class="empty-schedule">
                Your daily study sessions
                will appear here.
            </div>

        `;

        return;

    }


    scheduleList.innerHTML =
        "";


    const hours =
        Number(
            studyPlan.studyHours
        ) || 1;


    const sessionMinutes =
        Math.max(
            30,
            Math.floor(
                (
                    hours * 60
                ) /
                subjects.length
            )
        );


    subjects.forEach(
        (subject, index) => {

            const startHour =
                16 +
                Math.floor(
                    (
                        index *
                        sessionMinutes
                    ) / 60
                );


            const startMinute =
                (
                    index *
                    sessionMinutes
                ) % 60;


            const endTotal =
                startHour * 60 +
                startMinute +
                sessionMinutes;


            const endHour =
                Math.floor(
                    endTotal / 60
                );


            const endMinute =
                endTotal % 60;


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "schedule-item";


            item.innerHTML = `

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
                            index === 0
                                ? "FOCUS SESSION"
                                : "STUDY SESSION"
                        }
                    </span>

                    <strong>
                        ${escapeHTML(subject)}
                    </strong>

                    <small>
                        ${sessionMinutes} minutes
                    </small>

                </div>

            `;


            scheduleList.appendChild(
                item
            );

        }
    );

}


/* =========================================
   NEXT BOOKING
========================================= */

function updateNextBooking() {

    if (
        !nextBooking ||
        !nextBookingTime
    ) return;


    const subjects =
        studyPlan.subjects || [];


    if (
        subjects.length === 0
    ) {

        nextBooking.textContent =
            "No upcoming session yet";


        nextBookingTime.textContent =
            "Create a study plan to populate your calendar.";


        return;

    }


    const now =
        new Date();


    const next =
        new Date(now);


    next.setHours(
        16,
        0,
        0,
        0
    );


    if (
        next <= now
    ) {

        next.setDate(
            next.getDate() + 1
        );

    }


    const dayIndex =
        next.getDay();


    const subject =
        subjects[
            dayIndex %
            subjects.length
        ];


    nextBooking.textContent =
        `Study ${subject}`;


    nextBookingTime.textContent =
        `${next.toLocaleDateString(
            "en-US",
            {
                weekday: "long",
                month: "short",
                day: "numeric"
            }
        )} · ${formatTime(
            16,
            0
        )}`;

}


/* =========================================
   AI PROGRESS ANALYSIS
========================================= */

const analyzeProgressButton =
    document.getElementById(
        "analyzeProgressButton"
    );


const aiAdviceText =
    document.getElementById(
        "aiAdviceText"
    );


if (analyzeProgressButton) {

    analyzeProgressButton.addEventListener(
        "click",
        () => {

            const total =
                studyPlan.subjects
                    ? studyPlan.subjects.length
                    : 0;


            const subjects =
                studyPlan.subjects || [];


            const completed =
                completedSubjects.filter(
                    subject =>
                        subjects.includes(
                            subject
                        )
                ).length;


            let message;


            if (total === 0) {

                message =
                    "I don't have enough study data yet. Create a study plan first so I can analyze your progress.";

            }

            else if (completed === 0) {

                message =
                    "You have a fresh start. Begin with one focused study session today and mark the subject complete when you're finished.";

            }

            else if (
                completed < total
            ) {

                message =
                    `You've completed ${completed} of ${total} subjects. Keep your momentum by focusing on the next unfinished subject in your plan.`;

            }

            else {

                message =
                    "Excellent work! You've completed all your current subjects. Consider reviewing difficult topics and practicing questions before your exam.";

            }


            if (aiAdviceText) {

                aiAdviceText.textContent =
                    message;

            }

        }
    );

}


/* =========================================
   ASK STUDYMIND AI
========================================= */

const askAIButton =
    document.getElementById(
        "askAIButton"
    );


const aiQuestion =
    document.getElementById(
        "aiQuestion"
    );


const aiResponse =
    document.getElementById(
        "aiResponse"
    );


if (askAIButton) {

    askAIButton.addEventListener(
        "click",
        async () => {

            const question =
                aiQuestion
                    ? aiQuestion.value.trim()
                    : "";


            /* CHECK QUESTION */

            if (!question) {

                if (aiResponse) {

                    aiResponse.textContent =
                        "Please enter a question first.";

                }

                return;

            }


            /* CHECK FREE QUESTION LIMIT */

            if (
                aiQuestionCount >=
                FREE_QUESTION_LIMIT
            ) {

                if (aiResponse) {

                    aiResponse.innerHTML = `

                        <div class="ai-limit-message">

                            <h3>
                                You've reached your free limit
                            </h3>

                            <p>
                                You have used all 5 free AI questions.
                            </p>

                            <p>
                                Upgrade to StudyMind AI Premium
                                to continue asking questions.
                            </p>

                        </div>

                    `;

                }

                return;

            }


            /* SHOW LOADING */

            askAIButton.disabled =
                true;


            askAIButton.textContent =
                "⏳ Thinking...";


            if (aiResponse) {

                aiResponse.textContent =
                    "StudyMind AI is thinking...";

            }


            try {

                const subjects =
                    studyPlan.subjects || [];


                const topics =
                    studyPlan.topics || [];


                const hours =
                    Number(
                        studyPlan.studyHours
                    ) || 0;


                const examDate =
                    studyPlan.examDate ||
                    "No exam date set";


                const remainingDays =
                    calculateDaysLeft();


                const totalSubjects =
                    subjects.length;


                const completed =
                    completedSubjects.filter(
                        subject =>
                            subjects.includes(
                                subject
                            )
                    ).length;


                const completedTopicCount =
                    completedTopics.filter(
                        topic =>
                            topics.includes(
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
You are helping a student using StudyMind AI.

STUDENT'S CURRENT STUDY INFORMATION:

Subjects:
${
    subjects.length > 0
        ? subjects.join(", ")
        : "No subjects available"
}

Topics:
${
    topics.length > 0
        ? topics.join(", ")
        : "No topics available"
}

Daily study hours:
${hours}

Exam date:
${examDate}

Days remaining:
${remainingDays}

Subjects completed:
${completed} of ${totalSubjects}

Topics completed:
${completedTopicCount} of ${topics.length}

Current topic:
${
    getCurrentTopic() ||
    "All topics completed"
}

STUDENT'S QUESTION:
${question}

Give the student a useful, clear and practical answer.

Use their study information when relevant.
If they ask what they should study today,
give a specific recommendation based on their
subjects, topics and progress.

Do not invent subjects, topics, exam dates or
progress that are not provided.

Keep the answer readable and appropriately concise.
`

                                })

                        }
                    );


                if (!response.ok) {

                    let errorMessage =
                        "Something went wrong.";


                    try {

                        const errorData =
                            await response.json();


                        if (
                            errorData &&
                            errorData.error
                        ) {

                            errorMessage =
                                errorData.error;

                        }

                    }

                    catch (error) {

                        console.error(
                            "Could not read API error:",
                            error
                        );

                    }


                    throw new Error(
                        errorMessage
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


                /* COUNT ONLY SUCCESSFUL QUESTIONS */

                aiQuestionCount++;


                localStorage.setItem(
                    "aiQuestionCount",
                    aiQuestionCount
                );


                if (aiResponse) {

                    aiResponse.innerHTML =
                        renderAIResponse(
                            data.reply
                        );


                    if (
                        typeof renderMathInElement ===
                        "function"
                    ) {

                        renderMathInElement(
                            aiResponse,
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

                                ]

                            }
                        );

                    }

                }

            }


            catch (error) {

                console.error(
                    "StudyMind AI error:",
                    error
                );


                if (aiResponse) {

                    aiResponse.textContent =
                        "Sorry, I couldn't connect to StudyMind AI right now. Please try again in a moment.";

                }

            }


            finally {

                askAIButton.disabled =
                    false;


                askAIButton.textContent =
                    "🤖 Ask AI";

            }

        }
    );

}


/* =========================================
   RENDER AI RESPONSE
========================================= */

function renderAIResponse(text) {

    if (!text) {

        return "";

    }


    const escapeAIHTML =
        (str) => {

            return str

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

        };


    const mathBlocks =
        [];


    text =
        text.replace(
            /\\\[([\s\S]*?)\\\]/g,
            function (match) {

                const index =
                    mathBlocks.length;


                mathBlocks.push(
                    match
                );


                return `___MATH_BLOCK_${index}___`;

            }
        );


    text =
        text.replace(
            /\\\(([\s\S]*?)\\\)/g,
            function (match) {

                const index =
                    mathBlocks.length;


                mathBlocks.push(
                    match
                );


                return `___MATH_INLINE_${index}___`;

            }
        );


    text =
        escapeAIHTML(
            text
        );


    /* BOLD */

    text =
        text.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );


    /* ITALIC */

    text =
        text.replace(
            /(?<!\*)\*([^*\n]+)\*(?!\*)/g,
            "<em>$1</em>"
        );


    /* HEADINGS */

    text =
        text.replace(
            /^### (.*)$/gm,
            "<h4>$1</h4>"
        );


    text =
        text.replace(
            /^## (.*)$/gm,
            "<h3>$1</h3>"
        );


    text =
        text.replace(
            /^# (.*)$/gm,
            "<h2>$1</h2>"
        );


    /* BULLET LISTS */

    text =
        text.replace(
            /(?:^|\n)[ \t]*[-*][ \t]+(.+)(?=\n|$)/g,
            "\n<li>$1</li>"
        );


    text =
        text.replace(
            /((?:<li>.*?<\/li>\s*)+)/gs,
            "<ul>$1</ul>"
        );


    /* NUMBERED LISTS */

    text =
        text.replace(
            /(?:^|\n)[ \t]*\d+\.[ \t]+(.+)(?=\n|$)/g,
            "\n<li>$1</li>"
        );


    /* LINE BREAKS */

    text =
        text.replace(
            /\n{2,}/g,
            "<br><br>"
        );


    text =
        text.replace(
            /\n/g,
            "<br>"
        );


    /* RESTORE MATH */

    mathBlocks.forEach(
        function (
            math,
            index
        ) {

            const blockPlaceholder =
                `___MATH_BLOCK_${index}___`;


            const inlinePlaceholder =
                `___MATH_INLINE_${index}___`;


            text =
                text.replace(
                    blockPlaceholder,
                    math
                );


            text =
                text.replace(
                    inlinePlaceholder,
                    math
                );

        }
    );


    return text;

}


/* =========================================
   HELPERS
========================================= */

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


    if (displayHour === 0) {

        displayHour =
            12;

    }


    return `${displayHour}:${String(
        minute
    ).padStart(
        2,
        "0"
    )} ${suffix}`;

}


function escapeHTML(value) {

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


/* =========================================
   START DASHBOARD
========================================= */

async function startDashboard() {

    const authenticated =
        await checkAuthentication();


    if (!authenticated) {

        return;

    }


    initializeDashboard();

}


startDashboard();
