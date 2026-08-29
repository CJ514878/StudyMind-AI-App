/* =========================================================
   STUDYMIND AI — MULTIPAGE DASHBOARD JAVASCRIPT
   =========================================================

   PAGES SUPPORTED:

   1. dashboard.html
      - Stats
      - Current topic
      - Timer
      - Progress
      - Topics
      - Subjects
      - Calendar
      - Study schedule
      - Daily challenges

   2. ai-support.html
      - AI progress analysis
      - Ask StudyMind AI

   3. summarizer.html
      - Document summarizer

   4. study-streak.html
      - Study streak

   5. study-score.html
      - Study score

   Shared:
      - Supabase authentication
      - Study plan
      - localStorage
      - Theme
      - Navigation
========================================================= */


/* =========================================================
   GLOBAL CONSTANTS
========================================================= */

const FREE_QUESTION_LIMIT = 5;
const FREE_SUMMARY_LIMIT = 5;

const DEFAULT_TIMER_SECONDS = 25 * 60;

const STUDY_PLAN_KEY = "studyMindPlan";

const COMPLETED_TOPICS_KEY =
    "studyMindCompletedTopics";

const COMPLETED_QUESTIONS_KEY =
    "studyMindCompletedQuestionTopics";

const TOPIC_QUESTIONS_KEY =
    "studyMindTopicQuestions";

const AI_COUNT_KEY =
    "aiQuestionCount";

const SUMMARY_COUNT_KEY =
    "summaryUsageCount";

const STREAK_KEY =
    "studyMindStreak";

const LAST_STUDY_DATE_KEY =
    "lastStudyDate";

const THEME_KEY =
    "studyMindTheme";

const CURRENT_TOPIC_INDEX_KEY =
    "studyMindCurrentTopicIndex";



/* =========================================================
   GLOBAL STATE
========================================================= */

let studyPlan = {};

let completedTopics = [];

let completedQuestionTopics = [];

let topicQuestions = null;

let currentTopicIndex = 0;

let aiQuestionCount = 0;

let summaryUsageCount = 0;

let isAuthenticated = false;


/* TIMER */

let timerSeconds =
    DEFAULT_TIMER_SECONDS;

let timerInterval = null;

let timerRunning = false;


/* CALENDAR */

let calendarDate =
    new Date();



/* =========================================================
   DOM HELPER
========================================================= */

function $(id) {

    return document.getElementById(id);

}


/* =========================================================
   PAGE DETECTION
========================================================= */

function getCurrentPage() {

    const path =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();

    if (!path || path === "index.html") {
        return "index";
    }

    if (path === "dashboard.html") {
        return "dashboard";
    }

    if (path === "ai-support.html") {
        return "ai-support";
    }

    if (path === "summarizer.html") {
        return "summarizer";
    }

    if (path === "study-streak.html") {
        return "study-streak";
    }

    if (path === "study-score.html") {
        return "study-score";
    }

    return path.replace(
        ".html",
        ""
    );

}


/* =========================================================
   AUTHENTICATION
========================================================= */

async function checkAuthentication() {

    try {

        if (
            typeof supabaseClient !==
                "undefined" &&
            supabaseClient &&
            supabaseClient.auth
        ) {

            const {
                data
            } =
                await supabaseClient
                    .auth
                    .getSession();

            if (
                data &&
                data.session
            ) {

                isAuthenticated = true;

                return true;

            }

        }

    } catch (error) {

        console.error(
            "Authentication check error:",
            error
        );

    }


    const storedLogin =
        localStorage.getItem(
            "studyMindLoggedIn"
        );


    const legacyLogin =
        localStorage.getItem(
            "isLoggedIn"
        );


    isAuthenticated =
        storedLogin === "true" ||
        legacyLogin === "true";


    return isAuthenticated;

}


/* =========================================================
   STUDY PLAN
========================================================= */

function loadStudyPlan() {

    try {

        const saved =
            localStorage.getItem(
                STUDY_PLAN_KEY
            );


        if (saved) {

            studyPlan =
                JSON.parse(saved);

        } else {

            studyPlan = {};

        }

    } catch (error) {

        console.error(
            "Study plan loading error:",
            error
        );

        studyPlan = {};

    }


    if (
        !studyPlan ||
        typeof studyPlan !== "object"
    ) {

        studyPlan = {};

    }


    return studyPlan;

}


/* =========================================================
   ARRAY LOADER
========================================================= */

function loadArray(key) {

    try {

        const saved =
            localStorage.getItem(key);


        if (!saved) {
            return [];
        }


        const parsed =
            JSON.parse(saved);


        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch (error) {

        console.error(
            `Could not load ${key}:`,
            error
        );

        return [];

    }

}


/* =========================================================
   USABLE STUDY PLAN
========================================================= */

function hasUsableStudyPlan(plan) {

    if (
        !plan ||
        typeof plan !== "object"
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


    return (
        subjects.length > 0 ||
        topics.length > 0
    );

}


/* =========================================================
   TOPIC NAME
========================================================= */

function getTopicName(topic) {

    if (!topic) {
        return "";
    }


    if (typeof topic === "string") {

        return topic.trim();

    }


    return String(
        topic.name ||
        topic.topic ||
        topic.title ||
        topic.topicName ||
        ""
    ).trim();

}


/* =========================================================
   TOPIC DESCRIPTION
========================================================= */

function getTopicDescription(topic) {

    if (!topic || typeof topic === "string") {

        return "Study this topic and complete the knowledge check.";

    }


    return String(
        topic.description ||
        topic.desc ||
        topic.summary ||
        "Study this topic and complete the knowledge check."
    );

}


/* =========================================================
   DAYS LEFT
========================================================= */

function calculateDaysLeft() {

    if (!studyPlan.examDate) {
        return 0;
    }


    const exam =
        new Date(
            studyPlan.examDate
        );


    if (Number.isNaN(exam.getTime())) {
        return 0;
    }


    const today =
        new Date();


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
        exam.getTime() -
        today.getTime();


    return Math.max(
        0,
        Math.ceil(
            difference /
            86400000
        )
    );

}


/* =========================================================
   PROGRESS
========================================================= */

function getProgress() {

    const topics =
        Array.isArray(
            studyPlan.topics
        )
            ? studyPlan.topics
            : [];


    const total =
        topics.length;


    const completed =
        completedTopics.filter(
            completed => {

                return topics.some(
                    topic =>
                        getTopicName(topic) ===
                        completed
                );

            }
        ).length;


    const percent =
        total
            ? Math.round(
                (completed / total) *
                100
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

function updateDashboardStats() {

    const weeklyHours =
        $("weeklyHours");

    const daysLeft =
        $("daysLeft");

    const dailyGoal =
        $("dailyGoal");


    const hours =
        Number(
            studyPlan.studyHours
        ) || 0;


    if (weeklyHours) {

        weeklyHours.textContent =
            `${Math.round(hours * 7 * 10) / 10}`;

    }


    if (daysLeft) {

        daysLeft.textContent =
            calculateDaysLeft();

    }


    if (dailyGoal) {

        dailyGoal.textContent =
            `${hours} hrs`;

    }

}


/* =========================================================
   UPDATE PROGRESS
========================================================= */

function updateDashboardProgress() {

    const {
        total,
        completed,
        percent
    } =
        getProgress();


    const progressPercent =
        $("progressPercent");


    const progressCount =
        $("progressCount");


    const progressBar =
        $("progressBar");


    if (progressPercent) {

        progressPercent.textContent =
            `${percent}%`;

    }


    if (progressCount) {

        progressCount.textContent =
            `${completed} of ${total} topics completed`;

    }


    if (progressBar) {

        progressBar.style.width =
            `${percent}%`;

    }


    updateStudyScore();

    updateScorePage();

}


/* =========================================================
   CURRENT TOPIC
========================================================= */

function getCurrentTopic() {

    const topics =
        Array.isArray(
            studyPlan.topics
        )
            ? studyPlan.topics
            : [];


    if (!topics.length) {
        return null;
    }


    if (
        currentTopicIndex < 0 ||
        currentTopicIndex >= topics.length
    ) {

        currentTopicIndex = 0;

    }


    return topics[
        currentTopicIndex
    ];

}


/* =========================================================
   RENDER CURRENT TOPIC
========================================================= */

function renderCurrentTopic() {

    const topic =
        getCurrentTopic();


    const name =
        $("currentTopicName");


    const description =
        $("currentTopicDescription");


    const position =
        $("topicPosition");


    const badge =
        $("topicStatusBadge");


    const checkbox =
        $("topicCompleteCheckbox");


    if (!topic) {

        if (name) {

            name.textContent =
                "No topic available";

        }


        if (description) {

            description.textContent =
                "Create a study plan with topics to begin.";

        }


        if (position) {

            position.textContent =
                "NO TOPICS";

        }


        return;

    }


    const topicName =
        getTopicName(topic);


    if (name) {

        name.textContent =
            topicName ||
            "Untitled Topic";

    }


    if (description) {

        description.textContent =
            getTopicDescription(topic);

    }


    if (position) {

        position.textContent =
            `TOPIC ${currentTopicIndex + 1} OF ${studyPlan.topics.length}`;

    }


    const completed =
        completedTopics.includes(
            topicName
        );


    if (badge) {

        badge.textContent =
            completed
                ? "COMPLETED"
                : "IN PROGRESS";

    }


    if (checkbox) {

        checkbox.checked =
            completed;

    }


    renderTopicQuestionsState();

}


/* =========================================================
   COMPLETE TOPIC
========================================================= */

function completeCurrentTopic() {

    const topic =
        getCurrentTopic();


    if (!topic) {
        return;
    }


    const name =
        getTopicName(topic);


    if (!name) {
        return;
    }


    if (
        !completedTopics.includes(name)
    ) {

        completedTopics.push(name);

    }


    localStorage.setItem(
        COMPLETED_TOPICS_KEY,
        JSON.stringify(
            completedTopics
        )
    );


    updateDashboardProgress();

    renderTopics();

    renderCurrentTopic();

    renderCalendar();

    renderDailyChallenge();

}


/* =========================================================
   TOPIC LIST
========================================================= */

function renderTopics() {

    const container =
        $("topicList");


    if (!container) {
        return;
    }


    const topics =
        Array.isArray(
            studyPlan.topics
        )
            ? studyPlan.topics
            : [];


    if (!topics.length) {

        container.innerHTML =
            `
                <div class="empty-schedule">
                    No topics have been added yet.
                </div>
            `;

        return;

    }


    container.innerHTML =
        "";


    topics.forEach(
        (
            topic,
            index
        ) => {

            const name =
                getTopicName(topic) ||
                "Untitled Topic";


            const completed =
                completedTopics.includes(
                    name
                );


            const item =
                document.createElement(
                    "button"
                );


            item.type =
                "button";


            item.className =
                "topic-list-item";


            if (
                index ===
                currentTopicIndex
            ) {

                item.classList.add(
                    "active"
                );

            }


            if (completed) {

                item.classList.add(
                    "completed"
                );

            }


            item.innerHTML =
                `
                    <span>
                        ${completed ? "✓" : index + 1}
                    </span>

                    <strong>
                        ${escapeHTML(name)}
                    </strong>

                    <small>
                        ${
                            completed
                                ? "Completed"
                                : "In Progress"
                        }
                    </small>
                `;


            item.addEventListener(
                "click",
                () => {

                    currentTopicIndex =
                        index;


                    localStorage.setItem(
                        CURRENT_TOPIC_INDEX_KEY,
                        String(
                            currentTopicIndex
                        )
                    );


                    renderCurrentTopic();

                    renderTopics();

                    renderDailyChallenge();

                }
            );


            container.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   SUBJECT LIST
========================================================= */

function renderSubjects() {

    const container =
        $("subjectList");


    if (!container) {
        return;
    }


    const subjects =
        Array.isArray(
            studyPlan.subjects
        )
            ? studyPlan.subjects
            : [];


    if (!subjects.length) {

        container.innerHTML =
            `
                <div class="empty-schedule">
                    No subjects have been added yet.
                </div>
            `;

        return;

    }


    container.innerHTML =
        subjects
            .map(
                subject =>
                    `
                        <div class="subject-item">

                            <span>
                                📚
                            </span>

                            <strong>
                                ${escapeHTML(subject)}
                            </strong>

                        </div>
                    `
            )
            .join("");

}


/* =========================================================
   TIMER
========================================================= */

function updateTimerDisplay() {

    const timer =
        $("studyTimer");


    if (!timer) {
        return;
    }


    const minutes =
        Math.floor(
            timerSeconds / 60
        );


    const seconds =
        timerSeconds % 60;


    timer.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

}


/* =========================================================
   SET TIMER DURATION
========================================================= */

function setTimerDuration() {

    const select =
        $("timerDuration");


    if (!select) {
        return;
    }


    const minutes =
        Number(
            select.value
        ) || 25;


    timerSeconds =
        minutes * 60;


    stopTimer();

    updateTimerDisplay();

}


/* =========================================================
   START TIMER
========================================================= */

function startTimer() {

    if (timerRunning) {
        return;
    }


    timerRunning =
        true;


    const start =
        $("startTimerButton");


    const pause =
        $("pauseTimerButton");


    if (start) {
        start.disabled = true;
    }


    if (pause) {
        pause.disabled = false;
    }


    timerInterval =
        setInterval(
            () => {

                if (
                    timerSeconds <= 0
                ) {

                    stopTimer();

                    handleTimerComplete();

                    return;

                }


                timerSeconds--;

                updateTimerDisplay();

            },
            1000
        );

}


/* =========================================================
   PAUSE TIMER
========================================================= */

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


    const start =
        $("startTimerButton");


    const pause =
        $("pauseTimerButton");


    if (start) {
        start.disabled = false;
    }


    if (pause) {
        pause.disabled = true;
    }

}


/* =========================================================
   STOP TIMER
========================================================= */

function stopTimer() {

    clearInterval(
        timerInterval
    );


    timerInterval =
        null;


    timerRunning =
        false;


    const start =
        $("startTimerButton");


    const pause =
        $("pauseTimerButton");


    if (start) {
        start.disabled = false;
    }


    if (pause) {
        pause.disabled = true;
    }

}


/* =========================================================
   RESET TIMER
========================================================= */

function resetTimer() {

    stopTimer();


    const select =
        $("timerDuration");


    const minutes =
        select
            ? Number(select.value) || 25
            : 25;


    timerSeconds =
        minutes * 60;


    updateTimerDisplay();

}


/* =========================================================
   TIMER COMPLETE
========================================================= */

function handleTimerComplete() {

    timerSeconds =
        0;


    updateTimerDisplay();


    markStudyActivity();


    renderDailyChallenge();


    alert(
        "🎉 Study session complete! Great work."
    );

}


/* =========================================================
   STUDY ACTIVITY / STREAK
========================================================= */

function markStudyActivity() {

    const today =
        new Date()
            .toISOString()
            .slice(0, 10);


    const last =
        localStorage.getItem(
            LAST_STUDY_DATE_KEY
        );


    let streak =
        Number(
            localStorage.getItem(
                STREAK_KEY
            )
        ) || 0;


    if (last === today) {

        localStorage.setItem(
            STREAK_KEY,
            String(streak || 1)
        );

        return;

    }


    if (last) {

        const previous =
            new Date(last);


        const current =
            new Date(today);


        const difference =
            Math.round(
                (
                    current -
                    previous
                ) /
                86400000
            );


        if (difference === 1) {

            streak++;

        } else {

            streak = 1;

        }

    } else {

        streak = 1;

    }


    localStorage.setItem(
        STREAK_KEY,
        String(streak)
    );


    localStorage.setItem(
        LAST_STUDY_DATE_KEY,
        today
    );


    updateStreakPage();

}


/* =========================================================
   STREAK PAGE
========================================================= */

function updateStreakPage() {

    const streak =
        Number(
            localStorage.getItem(
                STREAK_KEY
            )
        ) || 0;


    const elements = [

        $("streak"),

        $("streakNumber"),

        $("currentStreak"),

        $("studyStreak")

    ];


    elements.forEach(
        element => {

            if (element) {

                element.textContent =
                    `${streak} ${streak === 1 ? "Day" : "Days"}`;

            }

        }
    );


    const streakProgress =
        $("streakProgress");


    if (streakProgress) {

        streakProgress.textContent =
            `${streak} day${streak === 1 ? "" : "s"} streak`;

    }

}


/* =========================================================
   STUDY SCORE
========================================================= */

function calculateStudyScore() {

    const {
        total,
        completed,
        percent
    } =
        getProgress();


    const streak =
        Number(
            localStorage.getItem(
                STREAK_KEY
            )
        ) || 0;


    let score =
        percent;


    if (streak > 0) {

        score +=
            Math.min(
                10,
                streak
            );

    }


    return Math.min(
        100,
        Math.round(score)
    );

}


/* =========================================================
   UPDATE STUDY SCORE
========================================================= */

function updateStudyScore() {

    const score =
        calculateStudyScore();


    const studyScore =
        $("studyScore");


    const scoreDisplay =
        $("scoreDisplay");


    const scoreProgressBar =
        $("scoreProgressBar");


    const scoreMessage =
        $("scoreMessage");


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
                "Good start. Keep studying consistently.";

        } else if (score < 70) {

            scoreMessage.textContent =
                "You're making good progress!";

        } else if (score < 90) {

            scoreMessage.textContent =
                "Excellent progress. Keep going!";

        } else {

            scoreMessage.textContent =
                "Outstanding study performance!";

        }

    }

}


/* =========================================================
   SCORE PAGE
========================================================= */

function updateScorePage() {

    const score =
        calculateStudyScore();


    const elements = [

        $("studyScore"),

        $("scoreDisplay"),

        $("scoreNumber"),

        $("studyScoreNumber"),

        $("performanceScore")

    ];


    elements.forEach(
        element => {

            if (element) {

                element.textContent =
                    score;

            }

        }
    );


    const bars = [

        $("scoreProgressBar"),

        $("performanceProgressBar"),

        $("scoreBar")

    ];


    bars.forEach(
        bar => {

            if (bar) {

                bar.style.width =
                    `${score}%`;

            }

        }
    );

}


/* =========================================================
   DAILY CHALLENGES
========================================================= */

function getDailyChallenge() {

    const topics =
        Array.isArray(
            studyPlan.topics
        )
            ? studyPlan.topics
            : [];


    const topic =
        getCurrentTopic();


    if (!topic) {

        return {

            title:
                "📚 Create Your Study Plan",

            description:
                "Create a study plan to unlock your daily challenges.",

            progress:
                0

        };

    }


    const topicName =
        getTopicName(topic);


    const completed =
        completedTopics.includes(
            topicName
        );


    const questionsDone =
        completedQuestionTopics.includes(
            topicName
        );


    let progress = 0;


    if (completed) {

        progress += 50;

    }


    if (questionsDone) {

        progress += 50;

    }


    return {

        title:
            completed && questionsDone
                ? "🏆 Challenge Complete!"
                : `📖 Study ${topicName}`,

        description:
            completed && questionsDone
                ? "You've completed today's challenge. Great work!"
                : "Study your current topic and complete its knowledge check.",

        progress

    };

}


/* =========================================================
   RENDER DAILY CHALLENGE
========================================================= */

function renderDailyChallenge() {

    const title =
        $("dailyChallengeTitle");


    const description =
        $("dailyChallengeDescription");


    const progress =
        $("dailyChallengeProgress");


    const progressBar =
        $("dailyChallengeProgressBar");


    const button =
        $("dailyChallengeButton");


    const challenge =
        getDailyChallenge();


    if (title) {

        title.textContent =
            challenge.title;

    }


    if (description) {

        description.textContent =
            challenge.description;

    }


    if (progress) {

        progress.textContent =
            `${challenge.progress}%`;

    }


    if (progressBar) {

        progressBar.style.width =
            `${challenge.progress}%`;

    }


    if (button) {

        if (
            challenge.progress >= 100
        ) {

            button.textContent =
                "✓ Challenge Complete";

            button.disabled =
                true;

        } else {

            button.disabled =
                false;

            button.textContent =
                "🚀 Start Challenge";

        }

    }

}


/* =========================================================
   DAILY CHALLENGE BUTTON
========================================================= */

function startDailyChallenge() {

    const topic =
        getCurrentTopic();


    if (!topic) {

        window.location.href =
            "home.html#generator";

        return;

    }


    const currentTopic =
        $("currentTopicSection");


    if (currentTopic) {

        currentTopic.scrollIntoView({
            behavior: "smooth"
        });

    }


    renderCurrentTopic();

}


/* =========================================================
   CALENDAR
========================================================= */

function renderCalendar() {

    const calendarDays =
        $("calendarDays");


    const calendarMonth =
        $("calendarMonth");


    if (
        !calendarDays ||
        !calendarMonth
    ) {

        return;

    }


    const year =
        calendarDate.getFullYear();


    const month =
        calendarDate.getMonth();


    const monthName =
        calendarDate.toLocaleString(
            "default",
            {
                month: "long"
            }
        );


    calendarMonth.textContent =
        `${monthName} ${year}`;


    calendarDays.innerHTML =
        "";


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
            "calendar-day empty";


        calendarDays.appendChild(
            empty
        );

    }


    for (
        let day = 1;
        day <= daysInMonth;
        day++
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
                day
            );


        const today =
            new Date();


        if (
            date.toDateString() ===
            today.toDateString()
        ) {

            cell.classList.add(
                "today"
            );

        }


        const dateString =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;


        if (
            studyPlan.examDate ===
            dateString
        ) {

            cell.classList.add(
                "exam-day"
            );

        }


        cell.innerHTML =
            `
                <span>
                    ${day}
                </span>
            `;


        calendarDays.appendChild(
            cell
        );

    }


    updateNextSession();

}


/* =========================================================
   NEXT SESSION
========================================================= */

function updateNextSession() {

    const nextBooking =
        $("nextBooking");


    const nextBookingTime =
        $("nextBookingTime");


    if (
        !nextBooking ||
        !nextBookingTime
    ) {

        return;

    }


    const topics =
        Array.isArray(
            studyPlan.topics
        )
            ? studyPlan.topics
            : [];


    const current =
        getCurrentTopic();


    if (!current) {

        nextBooking.textContent =
            "No upcoming session yet";


        nextBookingTime.textContent =
            "Create a study plan to populate your calendar.";

        return;

    }


    const name =
        getTopicName(current);


    nextBooking.textContent =
        name ||
        "Current topic";


    nextBookingTime.textContent =
        "Continue your current study session.";

}


/* =========================================================
   CALENDAR NAVIGATION
========================================================= */

function changeCalendarMonth(
    amount
) {

    calendarDate.setMonth(
        calendarDate.getMonth() +
        amount
    );


    renderCalendar();

}


/* =========================================================
   STUDY SCHEDULE
========================================================= */

function renderSchedule() {

    const container =
        $("scheduleList");


    if (!container) {
        return;
    }


    const topics =
        Array.isArray(
            studyPlan.topics
        )
            ? studyPlan.topics
            : [];


    if (!topics.length) {

        container.innerHTML =
            `
                <div class="empty-schedule">
                    Your daily study sessions
                    will appear here.
                </div>
            `;

        return;

    }


    const current =
        getCurrentTopic();


    const currentName =
        current
            ? getTopicName(current)
            : "Study session";


    container.innerHTML =
        `
            <div class="schedule-item">

                <div class="schedule-time">
                    📖
                </div>

                <div>

                    <strong>
                        ${escapeHTML(currentName)}
                    </strong>

                    <span>
                        Current study topic
                    </span>

                </div>

            </div>

            <div class="schedule-item">

                <div class="schedule-time">
                    🧠
                </div>

                <div>

                    <strong>
                        Knowledge Check
                    </strong>

                    <span>
                        Complete 5 questions after studying.
                    </span>

                </div>

            </div>
        `;

}


/* =========================================================
   AI QUESTION COUNT
========================================================= */

function getAIQuestionCount() {

    aiQuestionCount =
        Number(
            localStorage.getItem(
                AI_COUNT_KEY
            )
        ) || 0;


    return aiQuestionCount;

}


/* =========================================================
   REMAINING AI QUESTIONS
========================================================= */

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
        AI_COUNT_KEY,
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

    const badge =
        $("aiCountBadge");


    if (badge) {

        badge.textContent =
            `${getAIQuestionCount()}/${FREE_QUESTION_LIMIT} used`;

    }

}


/* =========================================================
   AI AUTH UI
========================================================= */

function setupAIAuthenticationUI() {

    const button =
        $("askAIButton");


    const question =
        $("aiQuestion");


    const count =
        getAIQuestionCount();


    if (!isAuthenticated) {

        if (button) {

            button.disabled =
                true;

            button.textContent =
                "🔒 Login Required";

        }


        if (question) {

            question.disabled =
                true;

            question.placeholder =
                "Login to use StudyMind AI";

        }


        updateAIBadge();

        return;

    }


    if (question) {

        question.disabled =
            false;

        question.placeholder =
            "Ask anything about your study plan...";

    }


    if (button) {

        button.disabled =
            count >=
            FREE_QUESTION_LIMIT;


        button.textContent =
            count >=
            FREE_QUESTION_LIMIT
                ? "🔒 Free Limit Reached"
                : "🤖 Ask AI";

    }


    updateAIBadge();

}


/* =========================================================
   ASK STUDYMIND AI
========================================================= */

async function askStudyMindAI() {

    const responseBox =
        $("aiResponse");


    if (!isAuthenticated) {

        showAILoginMessage(
            responseBox
        );

        return;

    }


    const input =
        $("aiQuestion");


    const question =
        input
            ? input.value.trim()
            : "";


    if (!question) {

        if (responseBox) {

            responseBox.textContent =
                "Please enter a question first.";

        }

        return;

    }


    if (!recordAIQuestion()) {

        showAskAILimitMessage();

        return;

    }


    const button =
        $("askAIButton");


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "⏳ Thinking...";

    }


    if (responseBox) {

        responseBox.textContent =
            "StudyMind AI is thinking...";

    }


    try {

        const subjects =
            Array.isArray(
                studyPlan.subjects
            )
                ? studyPlan.subjects
                : [];


        const topics =
            Array.isArray(
                studyPlan.topics
            )
                ? studyPlan.topics
                : [];


        const {
            total,
            completed,
            percent
        } =
            getProgress();


        const topicNames =
            topics
                .map(
                    getTopicName
                )
                .filter(Boolean);


        const current =
            getCurrentTopic();


        const currentTopic =
            current
                ? getTopicName(current)
                : "No current topic";


        const message =
            `
You are StudyMind AI, a professional educational assistant helping a secondary-school student.

STUDENT'S CURRENT STUDY INFORMATION

Exam type:
${studyPlan.examType || "Not specified"}

Exam date:
${studyPlan.examDate || "Not specified"}

Days remaining:
${calculateDaysLeft()}

Subjects:
${subjects.length ? subjects.join(", ") : "No subjects available"}

Topics:
${topicNames.length ? topicNames.join(", ") : "No topics available"}

Current topic:
${currentTopic}

Daily study hours:
${Number(studyPlan.studyHours) || 0}

Progress:
${completed} of ${total} topics completed (${percent}%)

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


        if (responseBox) {

            responseBox.innerHTML =
                renderAIResponse(
                    data.reply
                );


            renderMath(
                responseBox
            );

        }


        if (input) {

            input.value =
                "";

        }


    } catch (error) {

        console.error(
            "StudyMind AI error:",
            error
        );


        aiQuestionCount =
            Math.max(
                0,
                getAIQuestionCount() - 1
            );


        localStorage.setItem(
            AI_COUNT_KEY,
            String(
                aiQuestionCount
            )
        );


        if (responseBox) {

            responseBox.textContent =
                error.message ||
                "Sorry, I couldn't connect to StudyMind AI right now.";

        }

    } finally {

        updateAIBadge();

        setupAIAuthenticationUI();

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
                    onclick="window.location.href='login.html'"
                >
                    🔑 Login
                </button>

            </div>
        `;

}


/* =========================================================
   AI LIMIT
========================================================= */

function showAskAILimitMessage() {

    const response =
        $("aiResponse");


    if (!response) {
        return;
    }


    response.innerHTML =
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
   AI PROGRESS ANALYSIS
========================================================= */

async function analyzeProgress() {

    const output =
        $("aiAdviceText");


    if (!isAuthenticated) {

        showAILoginMessage(
            output
        );

        return;

    }


    if (!recordAIQuestion()) {

        showAskAILimitMessage();

        return;

    }


    const button =
        $("analyzeProgressButton");


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "⏳ Analyzing...";

    }


    if (output) {

        output.textContent =
            "StudyMind AI is analyzing your progress...";

    }


    try {

        const {
            total,
            completed,
            percent
        } =
            getProgress();


        const subjects =
            Array.isArray(
                studyPlan.subjects
            )
                ? studyPlan.subjects
                : [];


        const topics =
            Array.isArray(
                studyPlan.topics
            )
                ? studyPlan.topics
                : [];


        const message =
            `
Analyze this student's study progress.

Subjects:
${subjects.join(", ")}

Topics:
${topics.map(getTopicName).join(", ")}

Completed topics:
${completed}

Total topics:
${total}

Progress:
${percent}%

Days remaining:
${calculateDaysLeft()}

Daily study hours:
${Number(studyPlan.studyHours) || 0}

Give practical, encouraging advice based only on this information.

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


        if (
            !data ||
            !data.reply
        ) {

            throw new Error(
                "The AI returned an empty response."
            );

        }


        if (output) {

            output.innerHTML =
                renderAIResponse(
                    data.reply
                );


            renderMath(
                output
            );

        }


    } catch (error) {

        aiQuestionCount =
            Math.max(
                0,
                getAIQuestionCount() - 1
            );


        localStorage.setItem(
            AI_COUNT_KEY,
            String(
                aiQuestionCount
            )
        );


        if (output) {

            output.textContent =
                error.message ||
                "Unable to analyze your progress.";

        }

    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "🔍 Analyze My Progress";

        }


        updateAIBadge();

    }

}


/* =========================================================
   SUMMARY USAGE
========================================================= */

function getSummaryUsageCount() {

    summaryUsageCount =
        Number(
            localStorage.getItem(
                SUMMARY_COUNT_KEY
            )
        ) || 0;


    return summaryUsageCount;

}


/* =========================================================
   SUMMARY BADGE
========================================================= */

function updateSummaryBadge() {

    const badge =
        $("summaryCountBadge");


    if (badge) {

        badge.textContent =
            `${getSummaryUsageCount()}/${FREE_SUMMARY_LIMIT} used`;

    }

}


/* =========================================================
   SUMMARIZE DOCUMENT
========================================================= */

async function summarizeDocument() {

    const output =
        $("summaryOutput");


    const input =
        $("summarizeInput");


    if (!isAuthenticated) {

        showAILoginMessage(
            output
        );

        return;

    }


    const content =
        input
            ? input.value.trim()
            : "";


    if (!content) {

        if (output) {

            output.textContent =
                "Please paste your study material first.";

        }

        return;

    }


    const count =
        getSummaryUsageCount();


    if (
        count >=
        FREE_SUMMARY_LIMIT
    ) {

        showSummaryLimitMessage();

        return;

    }


    const button =
        $("summarizeBtn");


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "⏳ Summarizing...";

    }


    if (output) {

        output.textContent =
            "StudyMind AI is summarizing your material...";

    }


    try {

        const examContext =
            studyPlan.examType ||
            "WAEC";


        const current =
            getCurrentTopic();


        const currentTopic =
            current
                ? getTopicName(current)
                : "Not specified";


        const subjects =
            Array.isArray(
                studyPlan.subjects
            )
                ? studyPlan.subjects
                : [];


        const message =
            `
Summarize the following study material for a secondary-school student preparing for ${examContext}.

CURRENT STUDY CONTEXT:

Subjects:
${subjects.length ? subjects.join(", ") : "Not specified"}

Current topic:
${currentTopic}

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


        if (
            !data ||
            !data.reply
        ) {

            throw new Error(
                "The AI returned an empty summary."
            );

        }


        summaryUsageCount =
            count + 1;


        localStorage.setItem(
            SUMMARY_COUNT_KEY,
            String(
                summaryUsageCount
            )
        );


        updateSummaryBadge();


        if (output) {

            output.innerHTML =
                `
                    <div class="summary-result">

                        <h4>
                            📋 Summary
                        </h4>

                        <div>
                            ${renderAIResponse(
                                data.reply
                            )}
                        </div>

                    </div>
                `;


            renderMath(
                output
            );

        }


    } catch (error) {

        console.error(
            "Document summarizer error:",
            error
        );


        if (output) {

            output.textContent =
                error.message ||
                "Sorry, I couldn't summarize your document.";

        }

    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "✨ Summarize Notes";

        }

    }

}


/* =========================================================
   SUMMARY LIMIT
========================================================= */

function showSummaryLimitMessage() {

    const output =
        $("summaryOutput");


    if (!output) {
        return;
    }


    output.innerHTML =
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


    const container =
        $("topicQuestions");


    const section =
        $("topicQuestionsSection");


    if (!isAuthenticated) {

        showAILoginMessage(
            container
        );

        return;

    }


    const topicName =
        getTopicName(topic);


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
        !section ||
        !container
    ) {

        return;

    }


    section.style.display =
        "block";


    container.innerHTML =
        `
            <p>
                🤖 StudyMind AI is preparing
                5 questions about
                <strong>
                    ${escapeHTML(topicName)}
                </strong>...
            </p>
        `;


    try {

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


        const questions =
            JSON.parse(
                cleanJSONResponse(
                    data.reply
                )
            );


        if (
            !Array.isArray(questions) ||
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
            TOPIC_QUESTIONS_KEY,
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


        container.innerHTML =
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
   RENDER QUESTIONS
========================================================= */

function renderTopicQuestions(
    data
) {

    const section =
        $("topicQuestionsSection");


    const container =
        $("topicQuestions");


    const submit =
        $("submitTopicQuestions");


    if (
        !data ||
        !Array.isArray(data.questions) ||
        !section ||
        !container
    ) {

        return;

    }


    section.style.display =
        "block";


    container.innerHTML =
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
                                question.question || ""
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


                container.appendChild(
                    box
                );

            }
        );


    if (submit) {

        submit.disabled =
            false;

        submit.textContent =
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

        const result =
            $("topicQuestionResult");


        if (result) {

            result.textContent =
                "⚠️ Please answer all 5 questions before submitting.";

        }

        return;

    }


    topicQuestions.submitted =
        true;


    localStorage.setItem(
        TOPIC_QUESTIONS_KEY,
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
        COMPLETED_QUESTIONS_KEY,
        JSON.stringify(
            completedQuestionTopics
        )
    );


    document
        .querySelectorAll(
            "#topicQuestions input"
        )
        .forEach(
            input =>
                input.disabled = true
        );


    const submit =
        $("submitTopicQuestions");


    if (submit) {

        submit.disabled =
            true;

        submit.textContent =
            "✓ Questions Completed";

    }


    const result =
        $("topicQuestionResult");


    if (result) {

        result.innerHTML =
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


    renderDailyChallenge();

}


/* =========================================================
   QUESTION STATE
========================================================= */

function renderTopicQuestionsState() {

    const topic =
        getCurrentTopic();


    if (!topic) {
        return;
    }


    const name =
        getTopicName(topic);


    if (
        completedQuestionTopics.includes(
            name
        )
    ) {

        showTopicQuestionsFinished(
            name
        );

        return;

    }


    if (
        topicQuestions &&
        topicQuestions.topic === name
    ) {

        renderTopicQuestions(
            topicQuestions
        );

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


    const current =
        getCurrentTopic();


    const currentName =
        current
            ? getTopicName(current)
            : "";


    if (
        currentName &&
        topicQuestions.topic !==
        currentName
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

    const section =
        $("topicQuestionsSection");


    const container =
        $("topicQuestions");


    const submit =
        $("submitTopicQuestions");


    if (!section) {
        return;
    }


    section.style.display =
        "block";


    if (container) {

        container.innerHTML =
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
                            ${escapeHTML(topic)}
                        </strong>.
                    </p>

                </div>
            `;

    }


    if (submit) {

        submit.disabled =
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


    result =
        result.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );


    result =
        result.replace(
            /(?<!\*)\*([^*\n]+)\*(?!\*)/g,
            "<em>$1</em>"
        );


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
        !container ||
        !window.MathJax ||
        typeof window.MathJax.typesetPromise !==
            "function"
    ) {

        return;

    }


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


/* =========================================================
   THEME
========================================================= */

function setupTheme() {

    const button =
        $("themeButton");


    const savedTheme =
        localStorage.getItem(
            THEME_KEY
        );


    if (
        savedTheme === "light"
    ) {

        document.body.classList.add(
            "light-mode"
        );

    }


    updateThemeButton();


    if (
        button &&
        !button.dataset.bound
    ) {

        button.dataset.bound =
            "true";


        button.addEventListener(
            "click",
            toggleTheme
        );

    }

}


/* =========================================================
   TOGGLE THEME
========================================================= */

function toggleTheme() {

    document.body.classList.toggle(
        "light-mode"
    );


    const light =
        document.body.classList.contains(
            "light-mode"
        );


    localStorage.setItem(
        THEME_KEY,
        light
            ? "light"
            : "dark"
    );


    updateThemeButton();

}


/* =========================================================
   THEME BUTTON
========================================================= */

function updateThemeButton() {

    const button =
        $("themeButton");


    if (!button) {
        return;
    }


    const light =
        document.body.classList.contains(
            "light-mode"
        );


    button.textContent =
        light
            ? "☀️ Light Mode"
            : "🌙 Dark Mode";

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


function openAISupport() {

    window.location.href =
        "ai-support.html";

}


function openSummarizer() {

    window.location.href =
        "summarizer.html";

}


function openStudyStreak() {

    window.location.href =
        "study-streak.html";

}


function openStudyScore() {

    window.location.href =
        "study-score.html";

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
   DASHBOARD RENDER
========================================================= */

function renderEverything() {

    loadStudyPlan();


    updateDashboardStats();

    updateDashboardProgress();

    renderCurrentTopic();

    renderTopics();

    renderSubjects();

    renderCalendar();

    renderSchedule();

    renderDailyChallenge();

    updateStreakPage();

    updateScorePage();

    updateAIBadge();

    updateSummaryBadge();

    updateTimerDisplay();

}


/* =========================================================
   DASHBOARD INITIALIZATION
========================================================= */

async function startDashboard() {

    await checkAuthentication();


    loadStudyPlan();


    completedTopics =
        loadArray(
            COMPLETED_TOPICS_KEY
        );


    completedQuestionTopics =
        loadArray(
            COMPLETED_QUESTIONS_KEY
        );


    try {

        const savedIndex =
            Number(
                localStorage.getItem(
                    CURRENT_TOPIC_INDEX_KEY
                )
            );


        if (
            Number.isInteger(savedIndex) &&
            savedIndex >= 0
        ) {

            currentTopicIndex =
                savedIndex;

        }

    } catch (error) {

        currentTopicIndex =
            0;

    }


    try {

        const savedQuestions =
            localStorage.getItem(
                TOPIC_QUESTIONS_KEY
            );


        if (savedQuestions) {

            topicQuestions =
                JSON.parse(
                    savedQuestions
                );

        }

    } catch (error) {

        topicQuestions =
            null;

    }


    setupTheme();


    updateDashboardStats();

    updateDashboardProgress();

    renderCurrentTopic();

    renderTopics();

    renderSubjects();

    renderCalendar();

    renderSchedule();

    renderDailyChallenge();

    restoreTopicQuestions();

    updateStreakPage();

    updateScorePage();

    updateAIBadge();

    updateSummaryBadge();

    setupAIAuthenticationUI();


    setupDashboardEvents();

}


/* =========================================================
   AI SUPPORT PAGE INITIALIZATION
========================================================= */

async function startAISupportPage() {

    await checkAuthentication();


    loadStudyPlan();


    setupTheme();

    updateAIBadge();

    setupAIAuthenticationUI();


    const analyze =
        $("analyzeProgressButton");


    if (
        analyze &&
        !analyze.dataset.bound
    ) {

        analyze.dataset.bound =
            "true";


        analyze.addEventListener(
            "click",
            analyzeProgress
        );

    }


    const ask =
        $("askAIButton");


    if (
        ask &&
        !ask.dataset.bound
    ) {

        ask.dataset.bound =
            "true";


        ask.addEventListener(
            "click",
            askStudyMindAI
        );

    }

}


/* =========================================================
   SUMMARIZER PAGE INITIALIZATION
========================================================= */

async function startSummarizerPage() {

    await checkAuthentication();


    loadStudyPlan();


    setupTheme();

    updateSummaryBadge();


    const button =
        $("summarizeBtn");


    if (
        button &&
        !button.dataset.bound
    ) {

        button.dataset.bound =
            "true";


        button.addEventListener(
            "click",
            summarizeDocument
        );

    }

}


/* =========================================================
   STREAK PAGE INITIALIZATION
========================================================= */

async function startStudyStreakPage() {

    await checkAuthentication();


    loadStudyPlan();


    setupTheme();

    updateStreakPage();

}


/* =========================================================
   SCORE PAGE INITIALIZATION
========================================================= */

async function startStudyScorePage() {

    await checkAuthentication();


    loadStudyPlan();


    completedTopics =
        loadArray(
            COMPLETED_TOPICS_KEY
        );


    setupTheme();

    updateScorePage();

}


/* =========================================================
   DASHBOARD EVENTS
========================================================= */

function setupDashboardEvents() {

    const start =
        $("startTimerButton");


    const pause =
        $("pauseTimerButton");


    const reset =
        $("resetTimerButton");


    const duration =
        $("timerDuration");


    const checkbox =
        $("topicCompleteCheckbox");


    const submit =
        $("submitTopicQuestions");


    const previous =
        $("previousMonth");


    const next =
        $("nextMonth");


    const challenge =
        $("dailyChallengeButton");


    if (
        start &&
        !start.dataset.bound
    ) {

        start.dataset.bound =
            "true";


        start.addEventListener(
            "click",
            startTimer
        );

    }


    if (
        pause &&
        !pause.dataset.bound
    ) {

        pause.dataset.bound =
            "true";


        pause.addEventListener(
            "click",
            pauseTimer
        );

    }


    if (
        reset &&
        !reset.dataset.bound
    ) {

        reset.dataset.bound =
            "true";


        reset.addEventListener(
            "click",
            resetTimer
        );

    }


    if (
        duration &&
        !duration.dataset.bound
    ) {

        duration.dataset.bound =
            "true";


        duration.addEventListener(
            "change",
            setTimerDuration
        );

    }


    if (
        checkbox &&
        !checkbox.dataset.bound
    ) {

        checkbox.dataset.bound =
            "true";


        checkbox.addEventListener(
            "change",
            event => {

                if (
                    event.target.checked
                ) {

                    completeCurrentTopic();

                }

            }
        );

    }


    if (
        submit &&
        !submit.dataset.bound
    ) {

        submit.dataset.bound =
            "true";


        submit.addEventListener(
            "click",
            submitQuestions
        );

    }


    if (
        previous &&
        !previous.dataset.bound
    ) {

        previous.dataset.bound =
            "true";


        previous.addEventListener(
            "click",
            () =>
                changeCalendarMonth(-1)
        );

    }


    if (
        next &&
        !next.dataset.bound
    ) {

        next.dataset.bound =
            "true";


        next.addEventListener(
            "click",
            () =>
                changeCalendarMonth(1)
        );

    }


    if (
        challenge &&
        !challenge.dataset.bound
    ) {

        challenge.dataset.bound =
            "true";


        challenge.addEventListener(
            "click",
            startDailyChallenge
        );

    }

}


/* =========================================================
   CROSS-TAB SYNCHRONIZATION
========================================================= */

window.addEventListener(
    "storage",
    event => {

        if (
            event.key ===
            STUDY_PLAN_KEY ||
            event.key ===
            "studyData"
        ) {

            loadStudyPlan();


            if (
                getCurrentPage() ===
                "dashboard"
            ) {

                renderEverything();

            }

        }


        if (
            event.key ===
            COMPLETED_TOPICS_KEY
        ) {

            completedTopics =
                loadArray(
                    COMPLETED_TOPICS_KEY
                );


            if (
                getCurrentPage() ===
                "dashboard"
            ) {

                updateDashboardProgress();

                renderTopics();

                renderCurrentTopic();

                renderCalendar();

                renderDailyChallenge();

            }


            updateScorePage();

        }


        if (
            event.key ===
            COMPLETED_QUESTIONS_KEY
        ) {

            completedQuestionTopics =
                loadArray(
                    COMPLETED_QUESTIONS_KEY
                );


            if (
                getCurrentPage() ===
                "dashboard"
            ) {

                renderDailyChallenge();

                renderTopicQuestionsState();

            }

        }


        if (
            event.key ===
            AI_COUNT_KEY
        ) {

            aiQuestionCount =
                Number(
                    event.newValue
                ) || 0;


            updateAIBadge();

            setupAIAuthenticationUI();

        }


        if (
            event.key ===
            SUMMARY_COUNT_KEY
        ) {

            summaryUsageCount =
                Number(
                    event.newValue
                ) || 0;


            updateSummaryBadge();

        }


        if (
            event.key ===
            STREAK_KEY ||
            event.key ===
            LAST_STUDY_DATE_KEY
        ) {

            updateStreakPage();

            updateScorePage();

            if (
                getCurrentPage() ===
                "dashboard"
            ) {

                updateDashboardProgress();

                renderDailyChallenge();

            }

        }

    }
);


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.openHome =
    openHome;

window.openNewStudyPlan =
    openNewStudyPlan;

window.openAISupport =
    openAISupport;

window.openSummarizer =
    openSummarizer;

window.openStudyStreak =
    openStudyStreak;

window.openStudyScore =
    openStudyScore;

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

window.askStudyMindAI =
    askStudyMindAI;

window.summarizeDocument =
    summarizeDocument;

window.analyzeProgress =
    analyzeProgress;

window.submitQuestions =
    submitQuestions;


/* =========================================================
   START APPLICATION
========================================================= */

async function startApplication() {

    const page =
        getCurrentPage();


    switch (page) {

        case "dashboard":

            await startDashboard();

            break;


        case "ai-support":

            await startAISupportPage();

            break;


        case "summarizer":

            await startSummarizerPage();

            break;


        case "study-streak":

            await startStudyStreakPage();

            break;


        case "study-score":

            await startStudyScorePage();

            break;


        default:

            /*
               Shared JS may safely exist on
               other StudyMind pages.
            */

            setupTheme();

            break;

    }

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
        startApplication
    );

} else {

    startApplication();

}

