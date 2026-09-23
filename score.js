"use strict";

/* =========================================================
   STUDYMIND AI — STUDY SCORE ENGINE
   ---------------------------------------------------------
   Score is SEPARATE from XP.

   MAX SCORE = 100

   Study time          30
   Knowledge checks    25
   Consistency         20
   Plan progress       15
   AI learning         10
   ---------------------------------------------------------
========================================================= */


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

const SCORE_DAILY_TIME_KEY =
    "studyMindDailyStudyTime";

const SCORE_SESSIONS_KEY =
    "studyMindStudySessions";

const SCORE_AI_COUNT_KEY =
    "aiQuestionCount";

const SCORE_AI_DATE_KEY =
    "aiQuestionDate";

const SCORE_KNOWLEDGE_USAGE_KEY =
    "studyMindKnowledgeCheckUsageCount";

const SCORE_STREAK_KEY =
    "studyMindStreak";

const SCORE_ACTIVITY_KEY =
    "studyMindStreakActivity";

const SCORE_VALUE_KEY =
    "studyMindStudyScore";

const SCORE_BREAKDOWN_KEY =
    "studyMindStudyScoreBreakdown";


/* =========================================================
   HELPERS
========================================================= */

function scoreReadJSON(key, fallback) {

    try {

        const value =
            JSON.parse(
                localStorage.getItem(key) || "null"
            );

        return value ?? fallback;

    } catch (error) {

        return fallback;

    }

}


function scoreGetArray(key) {

    const value =
        scoreReadJSON(key, []);

    return Array.isArray(value)
        ? value
        : [];

}


function scoreGetNumber(key, fallback = 0) {

    const value =
        Number(
            localStorage.getItem(key)
        );

    return Number.isFinite(value)
        ? value
        : fallback;

}


function scoreTodayKey() {

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


function scoreParseDateKey(key) {

    if (
        typeof key !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(key)
    ) {

        return null;

    }

    const parts =
        key
            .split("-")
            .map(Number);

    return new Date(
        parts[0],
        parts[1] - 1,
        parts[2]
    );

}


function scoreDaysBetween(a, b) {

    if (!a || !b) {
        return 0;
    }

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
   PLAN
========================================================= */

function scoreGetPlan() {

    return scoreReadJSON(
        SCORE_PLAN_KEY,
        null
    );

}


/* =========================================================
   TOPIC EXTRACTION
========================================================= */

function scoreExtractPlanTopics(plan) {

    if (!plan) {
        return [];
    }

    const result = [];


    function addTopic(value) {

        if (
            typeof value === "string" &&
            value.trim()
        ) {

            result.push(
                value.trim()
            );

        }

    }


    function collect(value) {

        if (!value) {
            return;
        }


        if (Array.isArray(value)) {

            value.forEach(item => {

                if (
                    typeof item === "string"
                ) {

                    addTopic(item);

                    return;

                }


                if (
                    item &&
                    typeof item === "object"
                ) {

                    addTopic(
                        item.topic ||
                        item.topicName ||
                        item.name ||
                        item.title
                    );

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


                        /*
                         * Also support subject objects such as:
                         *
                         * {
                         *   Mathematics: ["Algebra", "Geometry"]
                         * }
                         */

                        if (
                            Array.isArray(child)
                        ) {

                            child.forEach(item => {

                                if (
                                    typeof item === "string"
                                ) {

                                    addTopic(item);

                                } else if (
                                    item &&
                                    typeof item === "object"
                                ) {

                                    addTopic(
                                        item.topic ||
                                        item.topicName ||
                                        item.name ||
                                        item.title
                                    );

                                }

                            });

                        }

                    }
                );

        }

    }


    collect(plan.topics);
    collect(plan.topicList);
    collect(plan.subjects);
    collect(plan.schedule);
    collect(plan.timetable);
    collect(plan.timetableData);


    return [
        ...new Set(
            result.filter(Boolean)
        )
    ];

}


/* =========================================================
   COMPLETED TOPICS
========================================================= */

function scoreGetCompletedTopics() {

    const raw =
        scoreGetArray(
            SCORE_COMPLETED_TOPICS_KEY
        );

    return [
        ...new Set(
            raw
                .map(item => {

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
                            ""
                        );

                    }

                    return "";

                })
                .filter(Boolean)
        )
    ];

}


/* =========================================================
   COMPLETED KNOWLEDGE CHECKS
========================================================= */

function scoreGetCompletedQuestions() {

    const raw =
        scoreGetArray(
            SCORE_COMPLETED_QUESTIONS_KEY
        );

    return [
        ...new Set(
            raw
                .map(item => {

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
                            ""
                        );

                    }

                    return "";

                })
                .filter(Boolean)
        )
    ];

}


/* =========================================================
   STUDY MINUTES
========================================================= */

function scoreGetDailyStudyMinutes() {

    const value =
        scoreReadJSON(
            SCORE_DAILY_TIME_KEY,
            {}
        );


    if (
        typeof value === "number"
    ) {

        return Math.max(
            0,
            value
        );

    }


    if (
        !value ||
        typeof value !== "object"
    ) {

        return 0;

    }


    /*
     * The timer stores daily time like:
     *
     * {
     *   "2026-09-23": 42
     * }
     */

    const today =
        scoreTodayKey();


    const todayValue =
        Number(
            value[today] || 0
        );


    return Number.isFinite(todayValue)
        ? Math.max(0, todayValue)
        : 0;

}


/* =========================================================
   TOTAL STUDY MINUTES
========================================================= */

function scoreGetTotalStudyMinutes() {

    let total = 0;


    const daily =
        scoreReadJSON(
            SCORE_DAILY_TIME_KEY,
            {}
        );


    if (
        daily &&
        typeof daily === "object" &&
        !Array.isArray(daily)
    ) {

        Object.values(daily)
            .forEach(value => {

                const minutes =
                    Number(value);

                if (
                    Number.isFinite(minutes)
                ) {

                    total += Math.max(
                        0,
                        minutes
                    );

                }

            });

    }


    /*
     * Also inspect study sessions in case
     * daily totals are missing.
     */

    const sessions =
        scoreGetArray(
            SCORE_SESSIONS_KEY
        );


    sessions.forEach(session => {

        if (
            !session ||
            typeof session !== "object"
        ) {

            return;

        }

        const minutes =
            Number(
                session.minutes ||
                session.durationMinutes ||
                session.studyMinutes ||
                0
            );


        if (
            Number.isFinite(minutes)
        ) {

            total =
                Math.max(
                    total,
                    0
                );

        }

    });


    return Math.max(
        0,
        total
    );

}


/* =========================================================
   STUDY HISTORY
========================================================= */

function scoreGetStudyHistory() {

    const history =
        scoreGetArray(
            SCORE_HISTORY_KEY
        )
        .filter(
            value =>
                typeof value === "string" &&
                /^\d{4}-\d{2}-\d{2}$/.test(value)
        );


    const lastStudy =
        localStorage.getItem(
            SCORE_LAST_STUDY_KEY
        );


    if (
        lastStudy &&
        /^\d{4}-\d{2}-\d{2}$/.test(lastStudy)
    ) {

        history.push(lastStudy);

    }


    /*
     * Also use streak activity.
     */

    const activity =
        scoreReadJSON(
            SCORE_ACTIVITY_KEY,
            {}
        );


    if (
        activity &&
        typeof activity === "object" &&
        !Array.isArray(activity)
    ) {

        Object.entries(activity)
            .forEach(
                ([date, value]) => {

                    if (
                        value &&
                        /^\d{4}-\d{2}-\d{2}$/.test(date)
                    ) {

                        history.push(date);

                    }

                }
            );

    }


    return [
        ...new Set(history)
    ];

}


/* =========================================================
   STREAK
========================================================= */

function scoreCalculateStreak(history) {

    /*
     * Prefer the real StudyMind streak engine.
     */

    if (
        window.StudyMindStreak &&
        typeof window.StudyMindStreak
            .calculateCurrentStreak === "function"
    ) {

        const realStreak =
            Number(
                window.StudyMindStreak
                    .calculateCurrentStreak()
            );


        if (
            Number.isFinite(realStreak)
        ) {

            return Math.max(
                0,
                realStreak
            );

        }

    }


    /*
     * Fallback.
     */

    if (!history.length) {
        return 0;
    }


    const dates =
        history
            .map(scoreParseDateKey)
            .filter(Boolean)
            .sort(
                (a, b) =>
                    b.getTime() -
                    a.getTime()
            );


    if (!dates.length) {
        return 0;
    }


    const today =
        scoreParseDateKey(
            scoreTodayKey()
        );


    const newest =
        dates[0];


    if (
        scoreDaysBetween(
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
            scoreDaysBetween(
                dates[i],
                dates[i + 1]
            );


        if (
            difference === 1
        ) {

            streak++;

        } else {

            break;

        }

    }


    return streak;

}


/* =========================================================
   PLAN PROGRESS
========================================================= */

function scoreCalculatePlanProgress(
    plan,
    completedTopics
) {

    const planTopics =
        scoreExtractPlanTopics(
            plan
        );


    if (!planTopics.length) {
        return 0;
    }


    let completed = 0;


    planTopics.forEach(topic => {

        const normalized =
            topic
                .trim()
                .toLowerCase();


        const found =
            completedTopics.some(
                completedTopic =>
                    completedTopic
                        .trim()
                        .toLowerCase()
                    === normalized
            );


        if (found) {
            completed++;
        }

    });


    return Math.round(
        (
            completed /
            planTopics.length
        ) * 100
    );

}


/* =========================================================
   AI USAGE
========================================================= */

function scoreGetAIUsage() {

    const today =
        scoreTodayKey();


    const storedDate =
        localStorage.getItem(
            SCORE_AI_DATE_KEY
        );


    let aiQuestions =
        scoreGetNumber(
            SCORE_AI_COUNT_KEY,
            0
        );


    /*
     * If the AI counter belongs to another day,
     * treat today's usage as zero.
     */

    if (
        storedDate &&
        storedDate !== today
    ) {

        aiQuestions = 0;

    }


    /*
     * Knowledge checks also represent
     * AI-powered learning activity.
     */

    const knowledgeUsage =
        scoreGetNumber(
            SCORE_KNOWLEDGE_USAGE_KEY,
            0
        );


    return {
        aiQuestions:
            Math.max(
                0,
                aiQuestions
            ),

        knowledgeUsage:
            Math.max(
                0,
                knowledgeUsage
            ),

        total:
            Math.max(
                0,
                aiQuestions
            ) +
            Math.max(
                0,
                knowledgeUsage
            )

    };

}


/* =========================================================
   SCORE CALCULATION
========================================================= */

function calculateStudyScore() {

    const plan =
        scoreGetPlan();

    const completedTopics =
        scoreGetCompletedTopics();

    const completedQuestions =
        scoreGetCompletedQuestions();

    const history =
        scoreGetStudyHistory();

    const currentStreak =
        scoreCalculateStreak(
            history
        );

    const todayMinutes =
        scoreGetDailyStudyMinutes();

    const totalMinutes =
        scoreGetTotalStudyMinutes();

    const planProgress =
        scoreCalculatePlanProgress(
            plan,
            completedTopics
        );

    const ai =
        scoreGetAIUsage();


    /* -----------------------------------------------------
       1. STUDY TIME — 30 POINTS

       60 minutes = 10
       180 minutes = 20
       300+ minutes = 30
    ----------------------------------------------------- */

    const studyTimeScore =
        Math.min(
            30,
            Math.round(
                (
                    totalMinutes /
                    300
                ) * 30
            )
        );


    /* -----------------------------------------------------
       2. KNOWLEDGE CHECKS — 25 POINTS

       5 completed checks = 25
    ----------------------------------------------------- */

    const questionScore =
        Math.min(
            25,
            completedQuestions.length * 5
        );


    /* -----------------------------------------------------
       3. CONSISTENCY — 20 POINTS

       7-day streak = 20
    ----------------------------------------------------- */

    const streakScore =
        Math.min(
            20,
            Math.round(
                (
                    currentStreak /
                    7
                ) * 20
            )
        );


    /* -----------------------------------------------------
       4. PLAN PROGRESS — 15 POINTS
    ----------------------------------------------------- */

    const planScore =
        Math.round(
            (
                planProgress /
                100
            ) * 15
        );


    /* -----------------------------------------------------
       5. AI LEARNING — 10 POINTS

       10 meaningful AI learning actions = 10
    ----------------------------------------------------- */

    const aiScore =
        Math.min(
            10,
            ai.total
        );


    const total =
        Math.min(
            100,
            Math.max(
                0,
                studyTimeScore +
                questionScore +
                streakScore +
                planScore +
                aiScore
            )
        );


    return {

        total,

        studyTimeScore,

        questionScore,

        streakScore,

        planScore,

        aiScore,

        completedTopics:
            completedTopics.length,

        completedQuestions:
            completedQuestions.length,

        currentStreak,

        planProgress,

        todayMinutes,

        totalMinutes,

        aiQuestions:
            ai.aiQuestions,

        knowledgeUsage:
            ai.knowledgeUsage

    };

}


/* =========================================================
   SCORE STATUS
========================================================= */

function getScoreStatus(score) {

    if (score >= 90) {

        return {

            title:
                "Elite Scholar",

            status:
                "💎 Elite Scholar",

            description:
                "Outstanding study consistency and progress.",

            tip:
                "Keep your study time, knowledge checks and consistency strong."

        };

    }


    if (score >= 80) {

        return {

            title:
                "Excellent Progress",

            status:
                "🏆 Excellent",

            description:
                "You're building strong and consistent study habits.",

            tip:
                "Continue studying regularly and completing knowledge checks."

        };

    }


    if (score >= 60) {

        return {

            title:
                "Good Progress",

            status:
                "📈 Good Progress",

            description:
                "You're building momentum in your study journey.",

            tip:
                "More study time and completed knowledge checks will raise your score."

        };

    }


    if (score >= 40) {

        return {

            title:
                "Building Momentum",

            status:
                "🚀 Building Momentum",

            description:
                "You've started making meaningful progress.",

            tip:
                "Keep studying consistently and work through your next topics."

        };

    }


    if (score > 0) {

        return {

            title:
                "Getting Started",

            status:
                "🌱 Getting Started",

            description:
                "Your Study Score is beginning to grow.",

            tip:
                "Complete your first study session and knowledge check."

        };

    }


    return {

        title:
            "Let's Get Started",

        status:
            "🚀 Getting Started",

        description:
            "Your Study Score will grow as you study, learn and make progress.",

        tip:
            "Start your first study session."

    };

}


/* =========================================================
   SAVE SCORE
========================================================= */

function saveStudyScore(data) {

    localStorage.setItem(
        SCORE_VALUE_KEY,
        String(
            data.total
        )
    );


    localStorage.setItem(
        SCORE_BREAKDOWN_KEY,
        JSON.stringify({
            studyTime:
                data.studyTimeScore,

            questions:
                data.questionScore,

            streak:
                data.streakScore,

            plan:
                data.planScore,

            ai:
                data.aiScore,

            total:
                data.total,

            updatedAt:
                Date.now()
        })
    );

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
            (
                score /
                100
            ) * 360
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
                Number(
                    percentage
                ) || 0
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
        calculateStudyScore();


    saveStudyScore(
        data
    );


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


    const topicsCompleted =
        document.getElementById(
            "topicsCompleted"
        );

    if (topicsCompleted) {

        topicsCompleted.textContent =
            data.completedTopics;

    }


    const questionsCompleted =
        document.getElementById(
            "questionsCompleted"
        );

    if (questionsCompleted) {

        questionsCompleted.textContent =
            data.completedQuestions;

    }


    const currentStreak =
        document.getElementById(
            "currentStreak"
        );

    if (currentStreak) {

        currentStreak.textContent =
            data.currentStreak;

    }


    const planProgress =
        document.getElementById(
            "planProgress"
        );

    if (planProgress) {

        planProgress.textContent =
            `${data.planProgress}%`;

    }


    /* -----------------------------------------------------
       BREAKDOWN
    ----------------------------------------------------- */

    const topicScoreText =
        document.getElementById(
            "topicScoreText"
        );

    /*
     * Existing HTML calls this the topic score.
     * We preserve that ID while displaying study-time score.
     */

    if (topicScoreText) {

        topicScoreText.textContent =
            `${data.studyTimeScore} / 30`;

    }


    const questionScoreText =
        document.getElementById(
            "questionScoreText"
        );

    if (questionScoreText) {

        questionScoreText.textContent =
            `${data.questionScore} / 25`;

    }


    const streakScoreText =
        document.getElementById(
            "streakScoreText"
        );

    if (streakScoreText) {

        streakScoreText.textContent =
            `${data.streakScore} / 20`;

    }


    const planScoreText =
        document.getElementById(
            "planScoreText"
        );

    if (planScoreText) {

        planScoreText.textContent =
            `${data.planScore} / 15`;

    }


    /*
     * If the page has an AI score element,
     * use it automatically.
     */

    const aiScoreText =
        document.getElementById(
            "aiScoreText"
        );

    if (aiScoreText) {

        aiScoreText.textContent =
            `${data.aiScore} / 10`;

    }


    /* -----------------------------------------------------
       BREAKDOWN BARS
    ----------------------------------------------------- */

    updateBar(
        "topicScoreBar",
        (
            data.studyTimeScore /
            30
        ) * 100
    );


    updateBar(
        "questionScoreBar",
        (
            data.questionScore /
            25
        ) * 100
    );


    updateBar(
        "streakScoreBar",
        (
            data.streakScore /
            20
        ) * 100
    );


    updateBar(
        "planScoreBar",
        (
            data.planScore /
            15
        ) * 100
    );


    updateBar(
        "aiScoreBar",
        (
            data.aiScore /
            10
        ) * 100
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


    /*
     * Optional live information elements.
     */

    const studyMinutes =
        document.getElementById(
            "studyMinutes"
        );

    if (studyMinutes) {

        studyMinutes.textContent =
            Math.round(
                data.totalMinutes
            );

    }


    const todayStudyMinutes =
        document.getElementById(
            "todayStudyMinutes"
        );

    if (todayStudyMinutes) {

        todayStudyMinutes.textContent =
            Math.round(
                data.todayMinutes
            );

    }


    const aiUsage =
        document.getElementById(
            "aiUsage"
        );

    if (aiUsage) {

        aiUsage.textContent =
            data.aiQuestions;

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


    if (
        theme === "light"
    ) {

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
            window.supabaseClient &&
            window.supabaseClient.auth
        ) {

            await window.supabaseClient
                .auth
                .signOut();

        } else if (
            typeof supabase !== "undefined" &&
            supabase?.auth
        ) {

            await supabase
                .auth
                .signOut();

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
   PUBLIC SCORE API
========================================================= */

window.StudyMindScore = {

    calculate:
        calculateStudyScore,

    refresh:
        updateScoreUI,

    getScore:
        () =>
            calculateStudyScore().total,

    getBreakdown:
        calculateStudyScore,

    getStudyMinutes:
        scoreGetTotalStudyMinutes,

    getTodayMinutes:
        scoreGetDailyStudyMinutes,

    getAIUsage:
        scoreGetAIUsage

};


/* =========================================================
   AUTOMATIC REFRESH
========================================================= */

function refreshScoreSoon() {

    /*
     * Small delay lets timer/streak/knowledge-check
     * code finish writing localStorage first.
     */

    window.setTimeout(
        () => {

            try {

                updateScoreUI();

            } catch (error) {

                console.warn(
                    "Study Score refresh error:",
                    error
                );

            }

        },
        100
    );

}


/* Storage changes from other pages/tabs. */

window.addEventListener(
    "storage",
    event => {

        const importantKeys = [

            SCORE_COMPLETED_TOPICS_KEY,

            SCORE_COMPLETED_QUESTIONS_KEY,

            SCORE_DAILY_TIME_KEY,

            SCORE_SESSIONS_KEY,

            SCORE_AI_COUNT_KEY,

            SCORE_AI_DATE_KEY,

            SCORE_KNOWLEDGE_USAGE_KEY,

            SCORE_STREAK_KEY,

            SCORE_ACTIVITY_KEY,

            SCORE_PLAN_KEY

        ];


        if (
            importantKeys.includes(
                event.key
            )
        ) {

            refreshScoreSoon();

        }

    }
);


/* =========================================================
   STUDYMIND EVENTS
========================================================= */

[
    "studyMindTimerCompleted",
    "studyMindTimerChanged",
    "studyMindStreakUpdated",
    "studyMindXPUpdated",
    "studyMindKnowledgeCheckCompleted",
    "studyMindPlanUpdated",
    "studyMindProgressUpdated",
    "studyMindAIUsed"
].forEach(
    eventName => {

        window.addEventListener(
            eventName,
            refreshScoreSoon
        );

    }
);


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

