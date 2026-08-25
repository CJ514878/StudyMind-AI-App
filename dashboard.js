/* =========================================
   STUDYMIND AI — DASHBOARD JAVASCRIPT
   VERSION: FREE AI LIMITS + AUTH PROTECTION
========================================= */


/* =========================================
   AUTHENTICATION CHECK
========================================= */

let currentUser = null;
let isAuthenticated = false;

async function checkAuthentication() {

    try {

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

    catch (error) {

        console.error(
            "Authentication check failed:",
            error
        );

        currentUser = null;
        isAuthenticated = false;

        return false;

    }

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


/* =========================================
   FREE AI LIMIT
========================================= */

const FREE_QUESTION_LIMIT = 5;


/*
   Ask AI usage
*/

let aiQuestionCount =
    Number(
        localStorage.getItem(
            "aiQuestionCount"
        )
    ) || 0;


/*
   Topic question usage.

   A topic gets ONE knowledge check
   containing exactly 5 questions.

   Once submitted, that topic is finished.
*/

let completedQuestionTopics =
    JSON.parse(
        localStorage.getItem(
            "studyMindCompletedQuestionTopics"
        )
    ) || [];


/* =========================================
   TOPIC DATA
========================================= */

let completedTopics =
    JSON.parse(
        localStorage.getItem(
            "studyMindCompletedTopics"
        )
    ) || [];


let currentTopicIndex =
    Number(
        localStorage.getItem(
            "studyMindCurrentTopicIndex"
        )
    ) || 0;


let topicQuestions =
    JSON.parse(
        localStorage.getItem(
            "studyMindTopicQuestions"
        )
    ) || null;


/* =========================================
   TIMER DATA
========================================= */

/*
   The timer duration selected by the user
   on the previous page/session.

   Falls back to 25 minutes if no duration
   has ever been selected.
*/

const DEFAULT_TIMER_SECONDS = 25 * 60;

let selectedTimerSeconds =
    Number(
        localStorage.getItem(
            "studyMindSelectedTimerSeconds"
        )
    ) || DEFAULT_TIMER_SECONDS;


let timerSeconds =
    selectedTimerSeconds;


let timerInterval =
    null;


let timerRunning =
    false;


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
   Older study plans may not have topics.
*/

if (
    !Array.isArray(
        studyPlan.topics
    )
) {

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


const topicList =
    document.getElementById(
        "topicList"
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
   CURRENT TOPIC ELEMENTS
========================================= */

const currentTopicName =
    document.getElementById(
        "currentTopicName"
    );


const currentTopicDescription =
    document.getElementById(
        "currentTopicDescription"
    );


const topicPosition =
    document.getElementById(
        "topicPosition"
    );


const topicStatusBadge =
    document.getElementById(
        "topicStatusBadge"
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


/* =========================================
   TIMER ELEMENTS
========================================= */

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


/* =========================================
   QUESTIONS
========================================= */

const topicQuestionsSection =
    document.getElementById(
        "topicQuestionsSection"
    );


const topicQuestionsContainer =
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

    renderCurrentTopic();

    renderTopics();

    renderSubjects();

    updateProgress();

    updateStreak();

    updateStudyScore();

    renderCalendar();

    renderSchedule();

    updateNextBooking();

    setupTimer();

    injectTimerStyles();

    setupAIAuthenticationUI();

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
   CURRENT TOPIC
========================================= */

function renderCurrentTopic() {

    const topics =
        studyPlan.topics || [];


    if (
        topics.length === 0
    ) {

        if (currentTopicName) {

            currentTopicName.textContent =
                "No topics available";

        }


        if (currentTopicDescription) {

            currentTopicDescription.textContent =
                "Go back and create a study plan with topics.";

        }


        if (topicPosition) {

            topicPosition.textContent =
                "NO TOPICS";

        }


        if (topicCompleteCheckbox) {

            topicCompleteCheckbox.disabled =
                true;

        }


        return;

    }


    while (
        currentTopicIndex < topics.length &&
        completedTopics.includes(
            topics[currentTopicIndex]
        )
    ) {

        currentTopicIndex++;

    }


    if (
        currentTopicIndex >= topics.length
    ) {

        renderAllTopicsCompleted();

        return;

    }


    localStorage.setItem(
        "studyMindCurrentTopicIndex",
        currentTopicIndex
    );


    const topic =
        topics[currentTopicIndex];


    if (topicPosition) {

        topicPosition.textContent =
            `TOPIC ${
                currentTopicIndex + 1
            } OF ${
                topics.length
            }`;

    }


    if (currentTopicName) {

        currentTopicName.textContent =
            topic;

    }


    if (currentTopicDescription) {

        currentTopicDescription.textContent =
            "Focus on this topic during your study session. When you finish, mark it as completed below.";

    }


    if (topicStatusBadge) {

        topicStatusBadge.textContent =
            "IN PROGRESS";

    }


    if (topicCompleteCheckbox) {

        topicCompleteCheckbox.disabled =
            false;

        topicCompleteCheckbox.checked =
            false;

    }


    if (topicCompletionMessage) {

        topicCompletionMessage.textContent =
            `Tick this box when you are done studying ${topic}.`;

    }


    if (nextTopicMessage) {

        if (
            currentTopicIndex <
            topics.length - 1
        ) {

            nextTopicMessage.innerHTML = `
                <span>Up next:</span>
                <strong>
                    ${escapeHTML(
                        topics[
                            currentTopicIndex + 1
                        ]
                    )}
                </strong>
            `;

        }

        else {

            nextTopicMessage.innerHTML = `
                <span>Final topic:</span>
                <strong>
                    Finish this one to complete your plan.
                </strong>
            `;

        }

    }


    resetTimer();

}


/* =========================================
   ALL TOPICS COMPLETED
========================================= */

function renderAllTopicsCompleted() {

    if (topicPosition) {

        topicPosition.textContent =
            "PLAN COMPLETE";

    }


    if (currentTopicName) {

        currentTopicName.textContent =
            "🎉 All topics have been completed!";

    }


    if (currentTopicDescription) {

        currentTopicDescription.textContent =
            "Excellent work. You have completed every topic in your current study plan.";

    }


    if (topicStatusBadge) {

        topicStatusBadge.textContent =
            "COMPLETED";

    }


    if (topicCompleteCheckbox) {

        topicCompleteCheckbox.checked =
            true;

        topicCompleteCheckbox.disabled =
            true;

    }


    if (topicCompletionMessage) {

        topicCompletionMessage.textContent =
            "✓ All topics have been completed.";

    }


    if (nextTopicMessage) {

        nextTopicMessage.innerHTML = `
            <div class="all-topics-complete-message">
                🎉 <strong>All topics have been completed!</strong>
                <span>Review your material or create a new study plan.</span>
            </div>
        `;

    }


    stopTimer();

}


/* =========================================
   COMPLETE CURRENT TOPIC
========================================= */

function completeCurrentTopic() {

    const topics =
        studyPlan.topics || [];


    if (
        topics.length === 0
    ) {

        return;

    }


    const topic =
        topics[currentTopicIndex];


    if (!topic) {

        return;

    }


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


    stopTimer();

    updateProgress();

    updateStudyScore();

    renderTopics();


    const finishedTopic =
        topic;


    /*
       Generate the ONE and ONLY
       5-question knowledge check
       for this topic.
    */

    generateQuestionsForTopic(
        finishedTopic
    );


    currentTopicIndex++;


    localStorage.setItem(
        "studyMindCurrentTopicIndex",
        currentTopicIndex
    );


    if (
        currentTopicIndex >=
        topics.length
    ) {

        renderAllTopicsCompleted();

    }

    else {

        if (topicStatusBadge) {

            topicStatusBadge.textContent =
                "COMPLETED";

        }


        if (topicCompletionMessage) {

            topicCompletionMessage.textContent =
                `✓ ${finishedTopic} has been completed.`;

        }


        if (nextTopicMessage) {

            const nextTopic =
                topics[currentTopicIndex];


            nextTopicMessage.innerHTML = `
                <div class="next-topic-success">
                    ✓ ${escapeHTML(
                        finishedTopic
                    )} completed.
                    <span>
                        Moving to your next topic:
                    </span>
                    <strong>
                        ${escapeHTML(
                            nextTopic
                        )}
                    </strong>
                </div>
            `;

        }


        setTimeout(
            () => {

                renderCurrentTopic();

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            },
            900
        );

    }

}


/* =========================================
   CHECKBOX LISTENER
========================================= */

if (topicCompleteCheckbox) {

    topicCompleteCheckbox.addEventListener(
        "change",
        () => {

            if (
                topicCompleteCheckbox.checked
            ) {

                completeCurrentTopic();

            }

        }
    );

}


/* =========================================
   RENDER TOPICS
========================================= */

function renderTopics() {

    if (!topicList) {

        return;

    }


    const topics =
        studyPlan.topics || [];


    topicList.innerHTML =
        "";


    if (
        topics.length === 0
    ) {

        topicList.innerHTML = `

            <div class="empty-state">

                <span>📖</span>

                <p>
                    No topics yet.
                    Create a study plan to begin.
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


            const isCurrent =
                !completed &&
                index ===
                currentTopicIndex;


            const topicItem =
                document.createElement(
                    "div"
                );


            topicItem.className =
                "subject-item";


            if (completed) {

                topicItem.classList.add(
                    "completed"
                );

            }


            if (isCurrent) {

                topicItem.classList.add(
                    "current-topic-item"
                );

            }


            topicItem.innerHTML = `

                <div class="subject-info">

                    <span
                        class="topic-status-icon"
                        aria-hidden="true"
                    >
                        ${
                            completed
                                ? "✓"
                                : isCurrent
                                    ? "▶"
                                    : ""
                        }
                    </span>

                    <div>

                        <strong>
                            ${escapeHTML(
                                topic
                            )}
                        </strong>

                        <span>
                            ${
                                completed
                                    ? "Completed"
                                    : isCurrent
                                        ? "Current topic"
                                        : "Upcoming"
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


            topicList.appendChild(
                topicItem
            );

        }
    );

}


/* =========================================
   SUBJECTS
========================================= */

function renderSubjects() {

    if (!subjectList) {

        return;

    }


    subjectList.innerHTML =
        "";


    const subjects =
        studyPlan.subjects || [];


    if (
        subjects.length === 0
    ) {

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
                        data-subject="${escapeHTML(
                            subject
                        )}"
                        aria-label="Complete ${escapeHTML(
                            subject
                        )}"
                    >
                        ${
                            completed
                                ? "✓"
                                : ""
                        }
                    </button>

                    <div>

                        <strong>
                            ${escapeHTML(
                                subject
                            )}
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

function toggleSubject(
    subject
) {

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

    updateStudyScore();

}


/* =========================================
   PROGRESS
========================================= */

function updateProgress() {

    const topics =
        studyPlan.topics || [];


    const total =
        topics.length;


    const completed =
        completedTopics.filter(
            topic =>
                topics.includes(
                    topic
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
            `${completed} of ${total} topics completed`;

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

    const topics =
        studyPlan.topics || [];


    const totalTopics =
        topics.length;


    const completedTopicCount =
        completedTopics.filter(
            topic =>
                topics.includes(
                    topic
                )
        ).length;


    let topicScore =
        0;


    if (
        totalTopics > 0
    ) {

        topicScore =
            Math.round(
                (
                    completedTopicCount /
                    totalTopics
                ) * 100
            );

    }


    const totalSubjects =
        studyPlan.subjects
            ? studyPlan.subjects.length
            : 0;


    const completedSubjectCount =
        completedSubjects.filter(
            subject =>
                studyPlan.subjects &&
                studyPlan.subjects.includes(
                    subject
                )
        ).length;


    let subjectScore =
        0;


    if (
        totalSubjects > 0
    ) {

        subjectScore =
            Math.round(
                (
                    completedSubjectCount /
                    totalSubjects
                ) * 100
            );

    }


    const score =
        totalTopics > 0
            ? topicScore
            : subjectScore;


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
   TIMER
========================================= */

function setupTimer() {

    if (!studyTimer) {

        return;

    }


    updateTimerDisplay();


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

}


/* =========================================
   START TIMER
========================================= */

function startTimer() {

    if (
        timerRunning ||
        timerSeconds <= 0
    ) {

        return;

    }


    timerRunning =
        true;


    if (startTimerButton) {

        startTimerButton.disabled =
            true;

        startTimerButton.innerHTML =
            "<span>▶</span> Running...";

    }


    if (pauseTimerButton) {

        pauseTimerButton.disabled =
            false;

    }


    timerInterval =
        setInterval(
            () => {

                timerSeconds--;

                updateTimerDisplay();


                if (
                    timerSeconds <= 0
                ) {

                    timerSeconds =
                        0;

                    stopTimer();

                    handleTimerFinished();

                }

            },
            1000
        );

}


/* =========================================
   PAUSE TIMER
========================================= */

function pauseTimer() {

    if (!timerRunning) {

        return;

    }


    clearInterval(
        timerInterval
    );


    timerInterval =
        null;


    timerRunning =
        false;


    if (startTimerButton) {

        startTimerButton.disabled =
            false;

        startTimerButton.innerHTML =
            "<span>▶</span> Resume";

    }


    if (pauseTimerButton) {

        pauseTimerButton.disabled =
            true;

    }

}


/* =========================================
   STOP TIMER
========================================= */

function stopTimer() {

    clearInterval(
        timerInterval
    );


    timerInterval =
        null;


    timerRunning =
        false;


    if (startTimerButton) {

        startTimerButton.disabled =
            true;

        startTimerButton.innerHTML =
            "<span>✓</span> Timer Complete";

    }


    if (pauseTimerButton) {

        pauseTimerButton.disabled =
            true;

    }

}


/* =========================================
   RESET TIMER
========================================= */

function resetTimer() {

    clearInterval(
        timerInterval
    );


    timerInterval =
        null;


    timerRunning =
        false;


    timerSeconds =
        DEFAULT_TIMER_SECONDS;


    updateTimerDisplay();


    if (startTimerButton) {

        startTimerButton.disabled =
            false;

        startTimerButton.innerHTML =
            "<span>▶</span> Start Timer";

    }


    if (pauseTimerButton) {

        pauseTimerButton.disabled =
            true;

    }

}


/* =========================================
   TIMER DISPLAY
========================================= */

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
        `${String(minutes).padStart(
            2,
            "0"
        )}:${String(seconds).padStart(
            2,
            "0"
        )}`;


    if (
        timerSeconds <= 60
    ) {

        studyTimer.classList.add(
            "timer-warning"
        );

    }

    else {

        studyTimer.classList.remove(
            "timer-warning"
        );

    }

}


/* =========================================
   TIMER FINISHED
========================================= */

function handleTimerFinished() {

    if (studyTimer) {

        studyTimer.classList.add(
            "timer-finished"
        );

    }


    if (topicCompletionMessage) {

        topicCompletionMessage.textContent =
            "⏰ Your 25-minute study session is complete. If you have finished the topic, tick the box below.";

    }


    if (topicCompleteCheckbox) {

        topicCompleteCheckbox.focus();

    }


    alert(
        "Your 25-minute study session is complete! 🎉"
    );

}


/* =========================================
   ATTRACTIVE TIMER STYLES
========================================= */

function injectTimerStyles() {

    if (
        document.getElementById(
            "studymindTimerStyles"
        )
    ) {

        return;

    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "studymindTimerStyles";


    style.textContent = `

        .study-timer-box {
            margin-top: 25px;
            padding: 28px;
            border-radius: 22px;
            background:
                linear-gradient(
                    145deg,
                    rgba(37, 99, 235, 0.14),
                    rgba(15, 23, 42, 0.7)
                );
            border: 1px solid rgba(96, 165, 250, 0.22);
            text-align: center;
        }

        .timer-label {
            display: block;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 2px;
            opacity: 0.65;
            margin-bottom: 10px;
        }

        .study-timer {
            font-size: clamp(48px, 7vw, 76px);
            font-weight: 800;
            letter-spacing: 3px;
            line-height: 1;
            margin: 12px 0 25px;
            font-variant-numeric: tabular-nums;
            transition: .3s ease;
        }

        .study-timer.timer-warning {
            animation: timerPulse 1s infinite;
        }

        .study-timer.timer-finished {
            animation: timerFinished 1s ease;
        }

        @keyframes timerPulse {
            0%, 100% {
                opacity: 1;
                transform: scale(1);
            }

            50% {
                opacity: .65;
                transform: scale(1.03);
            }
        }

        @keyframes timerFinished {
            0% {
                transform: scale(1);
            }

            50% {
                transform: scale(1.12);
            }

            100% {
                transform: scale(1);
            }
        }

        .timer-controls {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
        }

        .timer-button {
            border: 0;
            border-radius: 12px;
            padding: 12px 18px;
            min-width: 110px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition:
                transform .2s ease,
                box-shadow .2s ease,
                opacity .2s ease;
        }

        .timer-button span {
            margin-right: 5px;
        }

        .timer-button:hover:not(:disabled) {
            transform: translateY(-2px);
        }

        .timer-button:active:not(:disabled) {
            transform: translateY(0);
        }

        .timer-button:disabled {
            opacity: .4;
            cursor: not-allowed;
        }

        .timer-start {
            background: #2563eb;
            color: white;
            box-shadow:
                0 8px 20px rgba(37, 99, 235, .28);
        }

        .timer-pause {
            background: #f59e0b;
            color: white;
            box-shadow:
                0 8px 20px rgba(245, 158, 11, .22);
        }

        .timer-reset {
            background: rgba(148, 163, 184, .14);
            color: inherit;
            border: 1px solid rgba(148, 163, 184, .25);
        }

        .topic-completion-area {
            margin-top: 22px;
            padding: 20px;
            border-radius: 18px;
            border: 1px solid rgba(148, 163, 184, .2);
            background: rgba(148, 163, 184, .06);
        }

        .topic-checkbox-label {
            display: flex;
            align-items: center;
            gap: 12px;
            cursor: pointer;
            user-select: none;
            font-weight: 700;
        }

        .topic-checkbox-label input {
            position: absolute;
            opacity: 0;
            pointer-events: none;
        }

        .custom-topic-checkbox {
            width: 28px;
            height: 28px;
            min-width: 28px;
            border-radius: 8px;
            border: 2px solid #64748b;
            display: flex;
            align-items: center;
            justify-content: center;
            color: transparent;
            font-size: 17px;
            font-weight: 900;
            transition: .2s ease;
            background: rgba(15, 23, 42, .35);
        }

        .topic-checkbox-label:hover
        .custom-topic-checkbox {
            border-color: #3b82f6;
            transform: scale(1.05);
        }

        .topic-checkbox-label input:checked
        + .custom-topic-checkbox {
            background: #22c55e;
            border-color: #22c55e;
            color: white;
            box-shadow:
                0 5px 15px rgba(34, 197, 94, .25);
        }

        .topic-checkbox-text {
            line-height: 1.4;
        }

        .topic-completion-area p {
            margin: 10px 0 0 40px;
            opacity: .65;
            font-size: 13px;
        }

        .next-topic-message {
            margin-top: 15px;
        }

        .next-topic-success,
        .all-topics-complete-message {
            padding: 14px 16px;
            border-radius: 14px;
            background: rgba(34, 197, 94, .09);
            border: 1px solid rgba(34, 197, 94, .22);
            line-height: 1.6;
        }

        .next-topic-success span,
        .all-topics-complete-message span {
            display: block;
            opacity: .7;
            font-size: 13px;
        }

        .topic-status-icon {
            width: 30px;
            height: 30px;
            min-width: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(148, 163, 184, .1);
            font-size: 13px;
            font-weight: 800;
        }

        .subject-item.completed
        .topic-status-icon {
            background: #22c55e;
            color: white;
        }

        .current-topic-item
        .topic-status-icon {
            background: #2563eb;
            color: white;
        }

        .topic-questions-section {
            margin-top: 28px;
            padding: 24px;
            border-radius: 20px;
            background: rgba(37, 99, 235, .07);
            border: 1px solid rgba(96, 165, 250, .18);
        }

        .questions-heading h2 {
            margin-bottom: 6px;
        }

        .questions-heading p {
            opacity: .7;
        }

        .topic-question {
            margin-top: 18px;
            padding: 18px;
            border-radius: 15px;
            background: rgba(15, 23, 42, .28);
            border: 1px solid rgba(148, 163, 184, .16);
        }

        .topic-question h4 {
            margin: 0 0 14px;
        }

        .topic-question label {
            display: block;
            margin: 9px 0;
            cursor: pointer;
        }

        .topic-question input {
            margin-right: 8px;
        }

        .topic-question-result {
            margin-top: 18px;
            font-weight: 700;
            line-height: 1.6;
        }

        .question-correct {
            border-color: rgba(34, 197, 94, .5);
        }

        .question-wrong {
            border-color: rgba(239, 68, 68, .5);
        }

        .ai-limit-message,
        .ai-login-message {
            margin-top: 15px;
            padding: 22px;
            border-radius: 18px;
            background: rgba(37, 99, 235, .08);
            border: 1px solid rgba(96, 165, 250, .22);
        }

        .ai-limit-message h3,
        .ai-login-message h3 {
            margin-top: 0;
        }

        .premium-button {
            margin-top: 12px;
            border: 0;
            border-radius: 12px;
            padding: 12px 20px;
            background: #2563eb;
            color: white;
            font-weight: 700;
            cursor: pointer;
            transition: .2s ease;
        }

        .premium-button:hover {
            transform: translateY(-2px);
        }

        .ai-locked {
            opacity: .65;
            pointer-events: none;
        }

        @media (max-width: 600px) {

            .timer-controls {
                flex-direction: column;
            }

            .timer-button {
                width: 100%;
            }

            .topic-checkbox-text {
                font-size: 14px;
            }

        }

    `;


    document.head.appendChild(
        style
    );

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
    ) {

        return;

    }


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


        /* =========================================
           FIXED COMPLETED-DAY LOGIC

           Removed the old:
               date % 2 === 0

           condition which caused every other
           calendar day to appear completed.
        ========================================= */

        const topicTotal =
            studyPlan.topics
                ? studyPlan.topics.length
                : 0;


        const completedTotal =
            completedTopics.filter(
                topic =>
                    studyPlan.topics &&
                    studyPlan.topics.includes(
                        topic
                    )
            ).length;


        if (
            topicTotal > 0 &&
            completedTotal === topicTotal
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

    if (!scheduleList) {

        return;

    }


    const subjects =
        studyPlan.subjects || [];


    if (
        subjects.length === 0
    ) {

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

            const topics =
                studyPlan.topics || [];


            const total =
                topics.length;


            const completed =
                completedTopics.filter(
                    topic =>
                        topics.includes(
                            topic
                        )
                ).length;


            let message;


            if (
                total === 0
            ) {

                message =
                    "I don't have enough study data yet. Create a study plan with topics first so I can analyze your progress.";

            }

            else if (
                completed === 0
            ) {

                message =
                    "You have a fresh start. Begin with the first topic in your plan and mark it complete when you're finished.";

            }

            else if (
                completed < total
            ) {

                message =
                    `You've completed ${completed} of ${total} topics. Keep your momentum by focusing on the next unfinished topic in your plan.`;

            }

            else {

                message =
                    "Excellent work! You've completed all your current topics. Consider reviewing difficult areas and practicing questions before your exam.";

            }


            if (aiAdviceText) {

                aiAdviceText.textContent =
                    message;

            }

        }
    );

}


/* =========================================
   GENERATE FIVE TOPIC QUESTIONS
========================================= */

async function generateQuestionsForTopic(
    topic
) {

    if (!isAuthenticated) {

        showAILoginMessage(
            topicQuestionsContainer
        );

        if (topicQuestionsSection) {

            topicQuestionsSection.style.display =
                "block";

        }

        return;

    }


    if (
        completedQuestionTopics.includes(
            topic
        )
    ) {

        showTopicQuestionsFinished(
            topic
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


    topicQuestionsContainer.innerHTML = `
        <p>
            🤖 StudyMind AI is preparing
            5 questions about
            <strong>
                ${escapeHTML(topic)}
            </strong>...
        </p>
    `;


    if (topicQuestionResult) {

        topicQuestionResult.textContent =
            "";

    }


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
You are StudyMind AI.

Create exactly 5 educational multiple-choice questions
for a student who has just studied this topic:

TOPIC:
${topic}

Requirements:
- Create exactly 5 questions.
- Each question must have exactly 4 answer options.
- Only one option should be correct.
- Questions should test understanding, not just memorization.
- Keep the questions appropriate for a secondary-school student.
- Return ONLY valid JSON.
- Do not include markdown.
- Use this exact format:

[
  {
    "question": "Question text",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "answer": 0
  }
]

The answer must be the zero-based number of the correct option.
`
                        })
                }
            );


        if (!response.ok) {

            throw new Error(
                "Could not generate questions."
            );

        }


        const data =
            await response.json();


        if (
            !data ||
            !data.reply
        ) {

            throw new Error(
                "Empty AI response."
            );

        }


        let questions;


        try {

            questions =
                JSON.parse(
                    cleanJSONResponse(
                        data.reply
                    )
                );

        }

        catch (parseError) {

            console.error(
                "Question JSON error:",
                parseError
            );

            throw new Error(
                "The AI returned invalid question data."
            );

        }


        if (
            !Array.isArray(questions) ||
            questions.length < 5
        ) {

            throw new Error(
                "The AI did not return 5 questions."
            );

        }


        questions =
            questions.slice(
                0,
                5
            );


        topicQuestions =
            {
                topic:
                    topic,

                questions:
                    questions,

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

    }


    catch (error) {

        console.error(
            "Question generation error:",
            error
        );


        topicQuestionsContainer.innerHTML = `

            <div class="ai-response">

                <p>
                    I couldn't generate the questions
                    right now.
                </p>

                <button
                    class="secondary-button"
                    id="retryTopicQuestionsButton"
                >
                    Try Again
                </button>

            </div>

        `;


        const retryButton =
            document.getElementById(
                "retryTopicQuestionsButton"
            );


        if (retryButton) {

            retryButton.addEventListener(
                "click",
                () => {

                    generateQuestionsForTopic(
                        topic
                    );

                }
            );

        }

    }

}


/* =========================================
   RENDER FIVE QUESTIONS
========================================= */

function renderTopicQuestions(
    questionData
) {

    if (
        !questionData ||
        !questionData.questions
    ) {

        return;

    }


    topicQuestionsSection.style.display =
        "block";


    topicQuestionsContainer.innerHTML =
        "";


    questionData.questions
        .slice(0, 5)
        .forEach(
            (question, index) => {

                const questionBox =
                    document.createElement(
                        "div"
                    );


                questionBox.className =
                    "topic-question";


                const options =
                    Array.isArray(
                        question.options
                    )
                        ? question.options
                        : [];


                questionBox.innerHTML = `

                    <h4>
                        ${index + 1}.
                        ${escapeHTML(
                            question.question
                        )}
                    </h4>

                    <div>

                        ${options
                            .slice(0, 4)
                            .map(
                                (
                                    option,
                                    optionIndex
                                ) => `

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
                    questionBox
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


/* =========================================
   SUBMIT TOPIC QUESTIONS
========================================= */

if (submitTopicQuestions) {

    submitTopicQuestions.addEventListener(
        "click",
        () => {

            if (!isAuthenticated) {

                showAILoginMessage(
                    topicQuestionsContainer
                );

                return;

            }


            if (
                !topicQuestions ||
                !topicQuestions.questions
            ) {

                return;

            }


            if (
                topicQuestions.submitted
            ) {

                return;

            }


            let score =
                0;


            let answered =
                0;


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


                        const questionBox =
                            document.querySelectorAll(
                                ".topic-question"
                            )[index];


                        if (
                            !selected
                        ) {

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

                            questionBox.classList.add(
                                "question-correct"
                            );

                        }

                        else {

                            questionBox.classList.add(
                                "question-wrong"
                            );

                        }

                    }
                );


            if (
                answered < 5
            ) {

                if (topicQuestionResult) {

                    topicQuestionResult.innerHTML =
                        "⚠️ Please answer all 5 questions before submitting.";

                }

                return;

            }


            const total =
                5;


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
                    "#topicQuestions input"
                )
                .forEach(
                    input => {

                        input.disabled =
                            true;

                    }
                );


            submitTopicQuestions.disabled =
                true;


            submitTopicQuestions.textContent =
                "✓ Questions Completed";


            if (topicQuestionResult) {

                topicQuestionResult.innerHTML = `
                    🧠 You scored
                    <strong>
                        ${score}/${total}
                    </strong>
                    on the ${escapeHTML(
                        topicQuestions.topic
                    )} knowledge check.

                    <br><br>

                    🎉 You've completed your
                    5-question knowledge check
                    for this topic.

                    <br>

                    <strong>
                        Want unlimited practice?
                    </strong>
                    Explore StudyMind AI Premium.
                `;

            }

        }
    );

}


/* =========================================
   TOPIC QUESTIONS FINISHED
========================================= */

function showTopicQuestionsFinished(
    topic
) {

    if (!topicQuestionsSection) {

        return;

    }


    topicQuestionsSection.style.display =
        "block";


    if (topicQuestionsContainer) {

        topicQuestionsContainer.innerHTML = `

            <div class="ai-limit-message">

                <h3>
                    🎉 Knowledge Check Completed
                </h3>

                <p>
                    You've already completed the
                    5-question knowledge check for
                    <strong>
                        ${escapeHTML(topic)}
                    </strong>.
                </p>

                <p>
                    There are no more free questions
                    for this topic.
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


/* =========================================
   ASK AI EVENT
========================================= */

if (askAIButton) {

    askAIButton.addEventListener(
        "click",
        async () => {

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
                aiQuestionCount >=
                FREE_QUESTION_LIMIT
            ) {

                showAskAILimitMessage();

                return;

            }


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


                const totalTopics =
                    topics.length;


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

                            method: "POST",

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

Topics completed:
${completedTopicCount} of ${totalTopics}

STUDENT'S QUESTION:
${question}

Give the student a useful, clear and practical answer.

Use their study information when relevant.

If they ask what they should study today,
give a specific recommendation based on their
subjects and progress.

Do not invent subjects, topics, exam dates or progress
that are not provided.

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


                if (
                    aiQuestionCount >=
                    FREE_QUESTION_LIMIT
                ) {

                    showAskAILimitMessage(
                        true
                    );

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


                if (
                    aiQuestionCount >=
                    FREE_QUESTION_LIMIT
                ) {

                    askAIButton.disabled =
                        true;

                    askAIButton.textContent =
                        "🔒 Free Limit Reached";

                }

            }

        }
    );

}


/* =========================================
   AI AUTHENTICATION UI
========================================= */

function setupAIAuthenticationUI() {

    if (!isAuthenticated) {

        if (askAIButton) {

            askAIButton.disabled =
                true;

            askAIButton.classList.add(
                "ai-locked"
            );

            askAIButton.textContent =
                "🔒 Login Required";

        }


        if (aiQuestion) {

            aiQuestion.disabled =
                true;

            aiQuestion.placeholder =
                "Login to use StudyMind AI";

            aiQuestion.classList.add(
                "ai-locked"
            );

        }


        if (submitTopicQuestions) {

            submitTopicQuestions.disabled =
                true;

        }

        return;

    }


    if (
        aiQuestionCount >=
        FREE_QUESTION_LIMIT
    ) {

        if (askAIButton) {

            askAIButton.disabled =
                true;

            askAIButton.textContent =
                "🔒 Free Limit Reached";

        }

    }

}


/* =========================================
   LOGIN MESSAGE
========================================= */

function showAILoginMessage(
    container
) {

    if (!container) {

        return;

    }


    container.innerHTML = `

        <div class="ai-login-message">

            <h3>
                🔐 Login Required
            </h3>

            <p>
                You must be logged in to interact
                with StudyMind AI.
            </p>

            <p>
                Log in or create an account to
                access AI-powered study assistance.
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


/* =========================================
   ASK AI LIMIT MESSAGE
========================================= */

function showAskAILimitMessage(
    afterAnswer = false
) {

    if (!aiResponse) {

        return;

    }


    const currentAnswer =
        afterAnswer
            ? aiResponse.innerHTML
            : "";


    aiResponse.innerHTML = `

        ${
            currentAnswer
                ? `
                    <div class="ai-last-answer">
                        ${currentAnswer}
                    </div>

                    <hr>
                `
                : ""
        }

        <div class="ai-limit-message">

            <h3>
                🎉 You've used all 5 free AI questions
            </h3>

            <p>
                You've reached the free StudyMind AI
                limit.
            </p>

            <p>
                Want to keep asking questions,
                get more practice and unlock
                additional AI features?
            </p>

            <button
                class="premium-button"
                onclick="openPremiumOffer()"
            >
                💎 Explore Premium
            </button>

        </div>

    `;


    if (askAIButton) {

        askAIButton.disabled =
            true;

        askAIButton.textContent =
            "🔒 Free Limit Reached";

    }


    if (aiQuestion) {

        aiQuestion.disabled =
            true;

    }

}


/* =========================================
   PREMIUM OFFER
========================================= */

function openPremiumOffer() {

    const existing =
        document.getElementById(
            "studyMindPremiumModal"
        );


    if (existing) {

        existing.remove();

    }


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "studyMindPremiumModal";


    modal.innerHTML = `

        <div
            style="
                position:fixed;
                inset:0;
                background:rgba(0,0,0,.72);
                display:flex;
                align-items:center;
                justify-content:center;
                z-index:99999;
                padding:20px;
            "
        >

            <div
                style="
                    max-width:460px;
                    width:100%;
                    padding:32px;
                    border-radius:24px;
                    background:#0f172a;
                    color:white;
                    border:1px solid rgba(96,165,250,.25);
                    box-shadow:0 25px 70px rgba(0,0,0,.45);
                    text-align:center;
                "
            >

                <div
                    style="
                        font-size:48px;
                        margin-bottom:10px;
                    "
                >
                    💎
                </div>

                <h2>
                    Upgrade to StudyMind AI Premium
                </h2>

                <p
                    style="
                        opacity:.75;
                        line-height:1.7;
                    "
                >
                    You've reached your free AI limit.
                    Premium will give you access to
                    more AI questions and additional
                    StudyMind AI features.
                </p>

                <button
                    id="premiumComingSoonButton"
                    class="premium-button"
                    style="
                        width:100%;
                        margin-top:18px;
                    "
                >
                    🚀 Explore Premium
                </button>

                <button
                    id="closePremiumButton"
                    style="
                        margin-top:12px;
                        background:transparent;
                        border:0;
                        color:#94a3b8;
                        cursor:pointer;
                        padding:10px;
                    "
                >
                    Maybe Later
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    const closeButton =
        document.getElementById(
            "closePremiumButton"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            () => {

                modal.remove();

            }
        );

    }


    const premiumButton =
        document.getElementById(
            "premiumComingSoonButton"
        );


    if (premiumButton) {

        premiumButton.addEventListener(
            "click",
            () => {

                alert(
                    "Premium is coming soon! 🚀"
                );

            }
        );

    }

}


/* =========================================
   CLEAN AI JSON
========================================= */

function cleanJSONResponse(
    text
) {

    let cleaned =
        String(text)
            .trim();


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


    const firstBracket =
        cleaned.indexOf("[");


    const lastBracket =
        cleaned.lastIndexOf("]");


    if (
        firstBracket !== -1 &&
        lastBracket !== -1
    ) {

        cleaned =
            cleaned.substring(
                firstBracket,
                lastBracket + 1
            );

    }


    return cleaned.trim();

}


/* =========================================
   RENDER AI RESPONSE
========================================= */

function renderAIResponse(
    text
) {

    if (!text) {

        return "";

    }


    const escape =
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
            function(match) {

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
            function(match) {

                const index =
                    mathBlocks.length;


                mathBlocks.push(
                    match
                );


                return `___MATH_INLINE_${index}___`;

            }
        );


    text =
        escape(text);


    text =
        text.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );


    text =
        text.replace(
            /(?<!\*)\*([^*\n]+)\*(?!\*)/g,
            "<em>$1</em>"
        );


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


    text =
        text.replace(
            /(?:^|\n)[ \t]*\d+\.[ \t]+(.+)(?=\n|$)/g,
            "\n<li>$1</li>"
        );


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


    mathBlocks.forEach(
        function(
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
   FORMAT TIME
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


    if (
        displayHour === 0
    ) {

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


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHTML(
    value
) {

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
   ESCAPE JAVASCRIPT STRING
========================================= */

function escapeJS(
    value
) {

    return String(value)
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /'/g,
            "\\'"
        )
        .replace(
            /\r?\n/g,
            "\\n"
        );

}


/* =========================================
   START DASHBOARD
========================================= */

async function startDashboard() {

    await checkAuthentication();

    initializeDashboard();

}


startDashboard();
