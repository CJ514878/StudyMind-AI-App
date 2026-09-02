/* =========================================================
   STUDYMIND AI — STUDY SCORE
   ========================================================= */

"use strict";


/* =========================================================
   STORAGE
   ========================================================= */

const SCORE_PLAN_KEY =
    "studyMindPlan";

const SCORE_COMPLETED_TOPICS_KEY =
    "studyMindCompletedTopics";

const SCORE_COMPLETED_QUESTIONS_KEY =
    "studyMindCompletedQuestionTopics";

const SCORE_HISTORY_KEY =
    "studyMindStudyHistory";

const SCORE_LAST_STUDY_KEY =
    "lastStudyDate";


/* =========================================================
   HELPERS
   ========================================================= */

function getArray(key) {

    try {

        const value =
            JSON.parse(
                localStorage.getItem(key) || "[]"
            );

        return Array.isArray(value)
            ? value
            : [];

    } catch (error) {

        return [];

    }
}


function getPlan() {

    try {

        return JSON.parse(
            localStorage.getItem(
                SCORE_PLAN_KEY
            ) || "null"
        );

    } catch (error) {

        return null;

    }
}


function getTodayKey() {

    const date =
        new Date();

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");

}


function parseDateKey(key) {

    const parts =
        key.split("-").map(Number);

    return new Date(
        parts[0],
        parts[1] - 1,
        parts[2]
    );

}


function daysBetween(a, b) {

    const milliseconds =
        24 * 60 * 60 * 1000;

    return Math.round(
        Math.abs(
            a.getTime() -
            b.getTime()
        ) / milliseconds
    );

}


/* =========================================================
   STUDY HISTORY
   ========================================================= */

function getStudyHistory() {

    let history = [];

    try {

        history =
            JSON.parse(
                localStorage.getItem(
                    SCORE_HISTORY_KEY
                ) || "[]"
            );

    } catch (error) {

        history = [];

    }

    if (!Array.isArray(history)) {
        history = [];
    }

    /*
     * Preserve the existing lastStudyDate.
     */
    const lastStudy =
        localStorage.getItem(
            SCORE_LAST_STUDY_KEY
        );

    if (
        lastStudy &&
        /^\d{4}-\d{2}-\d{2}$/.test(lastStudy)
    ) {

        if (!history.includes(lastStudy)) {
            history.push(lastStudy);
        }

    }

    return [
        ...new Set(history)
    ];

}


/* =========================================================
   CURRENT STREAK
   ========================================================= */

function calculateCurrentStreak(history) {

    if (!history.length) {
        return 0;
    }

    const dates =
        history
            .map(parseDateKey)
            .sort((a, b) => b - a);

    const today =
        parseDateKey(
            getTodayKey()
        );

    const newest =
        dates[0];

    if (
        daysBetween(
            newest,
            today
        ) > 1
    ) {
        return 0;
    }

    let streak = 1;

    for (
        let i = 0;
        i < dates.length - 1;
        i++
    ) {

        const difference =
            daysBetween(
                dates[i],
                dates[i + 1]
            );

        if (difference === 1) {
            streak++;
        } else {
            break;
        }

    }

    return streak;

}


/* =========================================================
   PLAN TOPIC EXTRACTION
   ========================================================= */

function extractPlanTopics(plan) {

    if (!plan) {
        return [];
    }

    const result = [];

    function collect(value) {

        if (!value) {
            return;
        }

        if (Array.isArray(value)) {

            value.forEach(item => {

                if (
                    typeof item === "string" &&
                    item.trim()
                ) {

                    result.push(
                        item.trim()
                    );

                } else if (
                    item &&
                    typeof item === "object"
                ) {

                    /*
                     * Topic-like objects.
                     */
                    const topic =
                        item.topic ||
                        item.topicName ||
                        item.name ||
                        item.title;

                    if (
                        typeof topic === "string" &&
                        topic.trim()
                    ) {

                        result.push(
                            topic.trim()
                        );

                    }

                }

            });

            return;
        }

        if (
            typeof value === "object"
        ) {

            Object.entries(value)
                .forEach(
                    ([key, child]) => {

                        const lower =
                            key.toLowerCase();

                        if (
                            lower.includes("topic") ||
                            lower.includes("topics")
                        ) {

                            collect(child);

                        }

                    }
                );

        }

    }


    /*
     * Common StudyMind plan structures.
     */
    collect(plan.topics);
    collect(plan.topicList);
    collect(plan.subjects);
    collect(plan.schedule);
    collect(plan.timetable);

    /*
     * Remove duplicate names.
     */
    return [
        ...new Set(result)
    ];

}


/* =========================================================
   COMPLETED TOPICS
   ========================================================= */

function getCompletedTopics() {

    const raw =
        getArray(
            SCORE_COMPLETED_TOPICS_KEY
        );

    return [
        ...new Set(
            raw.map(item => {

                if (
                    typeof item === "string"
                ) {
                    return item;
                }

                if (
                    item &&
                    typeof item === "object"
                ) {

                    return (
                        item.topic ||
                        item.topicName ||
                        item.name ||
                        item.title ||
                        JSON.stringify(item)
                    );

                }

                return String(item);

            })
        )
    ];

}


/* =========================================================
   COMPLETED KNOWLEDGE CHECKS
   ========================================================= */

function getCompletedQuestions() {

    const raw =
        getArray(
            SCORE_COMPLETED_QUESTIONS_KEY
        );

    return [
        ...new Set(
            raw.map(item => {

                if (
                    typeof item === "string"
                ) {
                    return item;
                }

                if (
                    item &&
                    typeof item === "object"
                ) {

                    return (
                        item.topic ||
                        item.topicName ||
                        item.name ||
                        item.title ||
                        JSON.stringify(item)
                    );

                }

                return String(item);

            })
        )
    ];

}


/* =========================================================
   PLAN PROGRESS
   ========================================================= */

function calculatePlanProgress(
    plan,
    completedTopics
) {

    const planTopics =
        extractPlanTopics(plan);

    if (!planTopics.length) {

        /*
         * If the plan doesn't expose topics in a known
         * format, use completed-topic activity as a fallback.
         */
        return completedTopics.length
            ? Math.min(
                100,
                completedTopics.length * 10
            )
            : 0;

    }

    let completed = 0;

    planTopics.forEach(topic => {

        const normalized =
            topic.trim().toLowerCase();

        const found =
            completedTopics.some(
                completedTopic =>
                    completedTopic
                        .trim()
                        .toLowerCase() === normalized
            );

        if (found) {
            completed++;
        }

    });

    return Math.round(
        (completed / planTopics.length) * 100
    );

}


/* =========================================================
   SCORE CALCULATION
   =========================================================

   Maximum:
   Topics            = 30
   Knowledge checks  = 25
   Consistency       = 25
   Plan progress     = 20
   -----------------------
   Total             = 100
   ========================================================= */

function calculateScore() {

    const completedTopics =
        getCompletedTopics();

    const completedQuestions =
        getCompletedQuestions();

    const plan =
        getPlan();

    const history =
        getStudyHistory();

    const currentStreak =
        calculateCurrentStreak(
            history
        );


    /*
     * TOPIC SCORE
     *
     * 5+ completed topics = full 30.
     */
    const topicScore =
        Math.min(
            30,
            completedTopics.length * 6
        );


    /*
     * KNOWLEDGE CHECK SCORE
     *
     * 5 completed checks = full 25.
     */
    const questionScore =
        Math.min(
            25,
            completedQuestions.length * 5
        );


    /*
     * CONSISTENCY SCORE
     *
     * 7-day streak = full 25.
     */
    const streakScore =
        Math.min(
            25,
            Math.round(
                (currentStreak / 7) * 25
            )
        );


    /*
     * PLAN SCORE
     */
    const planProgress =
        calculatePlanProgress(
            plan,
            completedTopics
        );

    const planScore =
        Math.round(
            (planProgress / 100) * 20
        );


    const total =
        Math.min(
            100,
            topicScore +
            questionScore +
            streakScore +
            planScore
        );


    return {

        total,

        topicScore,
        questionScore,
        streakScore,
        planScore,

        completedTopics:
            completedTopics.length,

        completedQuestions:
            completedQuestions.length,

        currentStreak,

        planProgress

    };

}


/* =========================================================
   SCORE STATUS
   ========================================================= */

function getScoreStatus(score) {

    if (score >= 90) {

        return {
            title: "Elite Scholar",
            status: "💎 Elite Scholar",
            description:
                "Outstanding consistency and progress. You're building excellent study habits.",
            tip:
                "You're performing at a very high level. Keep your consistency strong."
        };

    }

    if (score >= 80) {

        return {
            title: "Excellent Progress",
            status: "🏆 Excellent",
            description:
                "You're making strong progress. Keep completing topics and maintaining your streak.",
            tip:
                "You're close to the top tier. Consistency can push your score even higher."
        };

    }

    if (score >= 60) {

        return {
            title: "Good Progress",
            status: "📈 Good Progress",
            description:
                "You're building momentum. More completed topics and consistent study will raise your score.",
            tip:
                "Focus on completing your next few topics and keeping your streak alive."
        };

    }

    if (score >= 40) {

        return {
            title: "Building Momentum",
            status: "🚀 Building Momentum",
            description:
                "You're getting started. Keep working through your study plan to build your score.",
            tip:
                "Complete more knowledge checks and study on consecutive days."
        };

    }

    if (score > 0) {

        return {
            title: "Getting Started",
            status: "🌱 Getting Started",
            description:
                "You've started your StudyMind journey. Every completed topic counts.",
            tip:
                "Start by completing one topic and its knowledge check."
        };

    }

    return {
        title: "Let's Get Started",
        status: "🚀 Getting Started",
        description:
            "Your Study Score will increase as you complete topics, knowledge checks and study consistently.",
        tip:
            "Complete your first topic to start building your Study Score."
    };

}


/* =========================================================
   GAUGE
   ========================================================= */

function updateGauge(score) {

    const gauge =
        document.getElementById(
            "scoreGauge"
        );

    if (!gauge) {
        return;
    }

    const degrees =
        Math.round(
            (score / 100) * 360
        );

    gauge.style.setProperty(
        "--score-progress",
        `${degrees}deg`
    );

}


/* =========================================================
   PROGRESS BAR
   ========================================================= */

function updateBar(
    id,
    percentage
) {

    const bar =
        document.getElementById(id);

    if (!bar) {
        return;
    }

    const safe =
        Math.max(
            0,
            Math.min(
                100,
                percentage
            )
        );

    bar.style.width =
        `${safe}%`;

}


/* =========================================================
   ACHIEVEMENTS
   ========================================================= */

function updateAchievements(data) {

    const firstTopic =
        document.getElementById(
            "achievementFirstTopic"
        );

    const fiveTopics =
        document.getElementById(
            "achievementFiveTopics"
        );

    const sevenDays =
        document.getElementById(
            "achievementSevenDays"
        );

    const highScore =
        document.getElementById(
            "achievementHighScore"
        );


    if (
        firstTopic &&
        data.completedTopics >= 1
    ) {

        firstTopic.classList.add(
            "unlocked"
        );

    }


    if (
        fiveTopics &&
        data.completedTopics >= 5
    ) {

        fiveTopics.classList.add(
            "unlocked"
        );

    }


    if (
        sevenDays &&
        data.currentStreak >= 7
    ) {

        sevenDays.classList.add(
            "unlocked"
        );

    }


    if (
        highScore &&
        data.total >= 80
    ) {

        highScore.classList.add(
            "unlocked"
        );

    }

}


/* =========================================================
   UPDATE UI
   ========================================================= */

function updateScoreUI() {

    const data =
        calculateScore();

    const status =
        getScoreStatus(
            data.total
        );


    const score =
        document.getElementById(
            "overallScore"
        );

    const title =
        document.getElementById(
            "scoreTitle"
        );

    const description =
        document.getElementById(
            "scoreDescription"
        );

    const statusElement =
        document.getElementById(
            "scoreStatus"
        );


    if (score) {
        score.textContent =
            data.total;
    }

    if (title) {
        title.textContent =
            status.title;
    }

    if (description) {
        description.textContent =
            status.description;
    }

    if (statusElement) {
        statusElement.textContent =
            status.status;
    }


    document.getElementById(
        "topicsCompleted"
    ).textContent =
        data.completedTopics;


    document.getElementById(
        "questionsCompleted"
    ).textContent =
        data.completedQuestions;


    document.getElementById(
        "currentStreak"
    ).textContent =
        data.currentStreak;


    document.getElementById(
        "planProgress"
    ).textContent =
        data.planProgress;


    /*
     * Breakdown
     */

    document.getElementById(
        "topicScoreText"
    ).textContent =
        `${data.topicScore} / 30`;


    document.getElementById(
        "questionScoreText"
    ).textContent =
        `${data.questionScore} / 25`;


    document.getElementById(
        "streakScoreText"
    ).textContent =
        `${data.streakScore} / 25`;


    document.getElementById(
        "planScoreText"
    ).textContent =
        `${data.planScore} / 20`;


    updateBar(
        "topicScoreBar",
        (data.topicScore / 30) * 100
    );


    updateBar(
        "questionScoreBar",
        (data.questionScore / 25) * 100
    );


    updateBar(
        "streakScoreBar",
        (data.streakScore / 25) * 100
    );


    updateBar(
        "planScoreBar",
        data.planProgress
    );


    updateGauge(
        data.total
    );


    updateAchievements(
        data
    );


    const tipTitle =
        document.getElementById(
            "scoreTipTitle"
        );

    const tipText =
        document.getElementById(
            "scoreTipText"
        );

    if (tipTitle) {
        tipTitle.textContent =
            status.title;
    }

    if (tipText) {
        tipText.textContent =
            status.tip;
    }

}


/* =========================================================
   THEME
   ========================================================= */

function applyTheme() {

    const theme =
        localStorage.getItem(
            "studyMindTheme"
        );

    if (theme === "light") {

        document.body.classList.add(
            "light-mode"
        );

    } else {

        document.body.classList.remove(
            "light-mode"
        );

    }

    updateThemeButton();

}


function toggleTheme() {

    const isLight =
        document.body.classList.contains(
            "light-mode"
        );

    if (isLight) {

        document.body.classList.remove(
            "light-mode"
        );

        localStorage.setItem(
            "studyMindTheme",
            "dark"
        );

    } else {

        document.body.classList.add(
            "light-mode"
        );

        localStorage.setItem(
            "studyMindTheme",
            "light"
        );

    }

    updateThemeButton();

}


function updateThemeButton() {

    const button =
        document.getElementById(
            "themeButton"
        );

    if (!button) {
        return;
    }

    button.textContent =
        document.body.classList.contains(
            "light-mode"
        )
            ? "☀️"
            : "🌙";

}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logoutStudyMind() {

    try {

        if (
            typeof supabase !== "undefined" &&
            supabase?.auth
        ) {

            await supabase.auth.signOut();

        }

    } catch (error) {

        console.warn(
            "Logout warning:",
            error
        );

    }

    window.location.href =
        "login.html";

}


/* =========================================================
   INIT
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        applyTheme();

        updateScoreUI();

    }
);


/* =========================================================
   GLOBALS
   ========================================================= */

window.toggleTheme =
    toggleTheme;

window.logoutStudyMind =
    logoutStudyMind;
