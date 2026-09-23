"use strict";

/* =========================================================
   STUDYMIND AI — STUDY SCORE ENGINE
   ---------------------------------------------------------
   SINGLE SOURCE OF TRUTH FOR STUDY PERFORMANCE

   MAX SCORE = 100

   Study time          30
   Knowledge checks    25
   Consistency         20
   Plan progress       15
   AI learning         10

   IMPORTANT:
   SCORE IS SEPARATE FROM XP.

   Creating a study plan does NOT increase score,
   XP or streak by itself.
========================================================= */


/* =========================================================
   STORAGE
========================================================= */

const SCORE_PLAN_KEY =
    "studyMindPlan";

const SCORE_PLANS_KEY =
    "studyMindPlans";

const SCORE_ACTIVE_PLAN_KEY =
    "studyMindActivePlanId";

const SCORE_COMPLETED_TOPICS_KEY =
    "studyMindCompletedTopics";

const SCORE_COMPLETED_QUESTIONS_KEY =
    "studyMindCompletedQuestionTopics";

const SCORE_KNOWLEDGE_RESULTS_KEY =
    "studyMindKnowledgeCheckResults";

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

function scoreReadJSON(key, fallback = null) {

    try {

        const raw =
            localStorage.getItem(key);

        if (!raw) {
            return fallback;
        }

        const parsed =
            JSON.parse(raw);

        return parsed ?? fallback;

    } catch (error) {

        console.warn(
            "StudyMind score storage error:",
            key,
            error
        );

        return fallback;
    }
}


function scoreWriteJSON(key, value) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

    } catch (error) {

        console.warn(
            "StudyMind score save error:",
            key,
            error
        );
    }
}


function scoreGetArray(key) {

    const value =
        scoreReadJSON(
            key,
            []
        );

    return Array.isArray(value)
        ? value
        : [];
}


function scoreGetNumber(
    key,
    fallback = 0
) {

    const value =
        Number(
            localStorage.getItem(key)
        );

    return Number.isFinite(value)
        ? value
        : fallback;
}


function scoreClamp(
    value,
    min,
    max
) {

    return Math.min(
        max,
        Math.max(
            min,
            value
        )
    );
}


function scoreTodayKey(date = new Date()) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );

    return `${year}-${month}-${day}`;
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


function scoreDaysBetween(
    a,
    b
) {

    if (!a || !b) {
        return 0;
    }


    const milliseconds =
        86400000;


    return Math.round(
        Math.abs(
            a.getTime() -
            b.getTime()
        ) /
        milliseconds
    );
}


function scoreNormalizeText(value) {

    return String(
        value ?? ""
    )
        .trim()
        .toLowerCase();
}


/* =========================================================
   PLAN
========================================================= */

function scoreGetPlan() {

    let plan =
        scoreReadJSON(
            SCORE_PLAN_KEY,
            null
        );


    const plans =
        scoreReadJSON(
            SCORE_PLANS_KEY,
            null
        );


    const activeId =
        localStorage.getItem(
            SCORE_ACTIVE_PLAN_KEY
        );


    if (
        Array.isArray(plans) &&
        plans.length
    ) {

        let active =
            null;


        if (activeId) {

            active =
                plans.find(
                    item =>
                        String(item?.id) ===
                        String(activeId)
                );
        }


        if (!active) {
            active = plans[0];
        }


        if (active) {
            plan = active;
        }
    }


    return plan;
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

            return;
        }


        if (
            value &&
            typeof value === "object"
        ) {

            const name =
                value.name ||
                value.topic ||
                value.topicName ||
                value.title ||
                value.text;


            if (
                typeof name === "string" &&
                name.trim()
            ) {

                result.push(
                    name.trim()
                );
            }
        }
    }


    function collect(value) {

        if (!value) {
            return;
        }


        if (typeof value === "string") {

            addTopic(value);

            return;
        }


        if (Array.isArray(value)) {

            value.forEach(
                item => {

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

                        /*
                         * Subject object:
                         *
                         * {
                         *   name: "Mathematics",
                         *   topics: [...]
                         * }
                         */

                        if (
                            Array.isArray(
                                item.topics
                            )
                        ) {

                            collect(
                                item.topics
                            );
                        }


                        if (
                            Array.isArray(
                                item.topicList
                            )
                        ) {

                            collect(
                                item.topicList
                            );
                        }


                        /*
                         * Direct topic object.
                         */

                        if (
                            item.topic ||
                            item.topicName ||
                            item.title
                        ) {

                            addTopic(item);
                        }
                    }
                }
            );

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
                            lower.includes("subject") ||
                            lower.includes("schedule") ||
                            lower.includes("timetable")
                        ) {

                            collect(child);

                        } else if (
                            Array.isArray(child)
                        ) {

                            /*
                             * Supports structures such as:
                             *
                             * Mathematics:
                             *   ["Algebra", "Geometry"]
                             */

                            collect(child);
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
            result
                .map(scoreNormalizeText)
                .filter(Boolean)
        )
    ];
}


/* =========================================================
   COMPLETED TOPICS
========================================================= */

function scoreGetCompletedTopicRecords() {

    const raw =
        scoreReadJSON(
            SCORE_COMPLETED_TOPICS_KEY,
            []
        );


    if (Array.isArray(raw)) {
        return raw;
    }


    /*
     * Compatibility with object-based storage.
     */

    if (
        raw &&
        typeof raw === "object"
    ) {

        return Object.values(raw)
            .flat()
            .filter(Boolean);
    }


    return [];
}


function scoreGetCompletedTopics() {

    const raw =
        scoreGetCompletedTopicRecords();


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
                .map(scoreNormalizeText)
                .filter(Boolean)
        )
    ];
}


/* =========================================================
   COMPLETED KNOWLEDGE CHECK TOPICS
========================================================= */

function scoreGetCompletedQuestions() {

    const raw =
        scoreReadJSON(
            SCORE_COMPLETED_QUESTIONS_KEY,
            []
        );


    if (!Array.isArray(raw)) {

        if (
            raw &&
            typeof raw === "object"
        ) {

            return [
                ...new Set(
                    Object.values(raw)
                        .flat()
                        .map(item =>
                            typeof item === "string"
                                ? item
                                : item?.topic ||
                                  item?.topicName ||
                                  item?.name ||
                                  item?.title ||
                                  ""
                        )
                        .map(scoreNormalizeText)
                        .filter(Boolean)
                )
            ];
        }


        return [];
    }


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
                .map(scoreNormalizeText)
                .filter(Boolean)
        )
    ];
}


/* =========================================================
   KNOWLEDGE CHECK RESULTS
   ---------------------------------------------------------
   Shared source of truth for actual percentages.

   Supported formats:

   [
       {
           topic: "Algebra",
           subject: "Mathematics",
           score: 80,
           percentage: 80,
           passed: true,
           date: "2026-09-23"
       }
   ]

   OR:

   {
       "Mathematics::Algebra": {
           score: 80
       }
   }
========================================================= */

function scoreGetKnowledgeResults() {

    const raw =
        scoreReadJSON(
            SCORE_KNOWLEDGE_RESULTS_KEY,
            []
        );


    let results = [];


    if (Array.isArray(raw)) {

        results = raw;

    } else if (
        raw &&
        typeof raw === "object"
    ) {

        results =
            Object.entries(raw)
                .map(
                    ([key, value]) => {

                        if (
                            value &&
                            typeof value === "object"
                        ) {

                            return {
                                ...value,
                                key
                            };
                        }


                        return {
                            key,
                            score: value
                        };
                    }
                );
    }


    return results
        .map(result => {

            const percentage =
                Number(
                    result?.percentage ??
                    result?.score ??
                    result?.percent ??
                    result?.result ??
                    result?.accuracy
                );


            if (
                !Number.isFinite(
                    percentage
                )
            ) {

                return null;
            }


            const safePercentage =
                scoreClamp(
                    percentage,
                    0,
                    100
                );


            return {

                ...result,

                percentage:
                    safePercentage,

                passed:
                    result?.passed !== undefined
                        ? Boolean(result.passed)
                        : safePercentage >= 60
            };
        })
        .filter(Boolean);
}


/* =========================================================
   KNOWLEDGE PERFORMANCE
========================================================= */

function scoreGetKnowledgePerformance() {

    const results =
        scoreGetKnowledgeResults();


    if (!results.length) {

        return {

            count: 0,

            average: 0,

            highest: 0,

            lowest: 0,

            passed: 0,

            perfect: 0,

            excellent: 0
        };
    }


    const percentages =
        results.map(
            result =>
                result.percentage
        );


    const total =
        percentages.reduce(
            (sum, value) =>
                sum + value,
            0
        );


    const average =
        Math.round(
            total /
            percentages.length
        );


    const passed =
        percentages.filter(
            value =>
                value >= 60
        ).length;


    const excellent =
        percentages.filter(
            value =>
                value >= 80
        ).length;


    const perfect =
        percentages.filter(
            value =>
                value >= 100
        ).length;


    return {

        count:
            percentages.length,

        average,

        highest:
            Math.max(
                ...percentages
            ),

        lowest:
            Math.min(
                ...percentages
            ),

        passed,

        excellent,

        perfect
    };
}


/* =========================================================
   STUDY MINUTES
========================================================= */

function scoreGetDailyStudyMinutes() {

    const daily =
        scoreReadJSON(
            SCORE_DAILY_TIME_KEY,
            {}
        );


    if (
        typeof daily === "number"
    ) {

        return Math.max(
            0,
            daily
        );
    }


    if (
        !daily ||
        typeof daily !== "object" ||
        Array.isArray(daily)
    ) {

        return 0;
    }


    const today =
        scoreTodayKey();


    const value =
        Number(
            daily[today] || 0
        );


    return Number.isFinite(value)
        ? Math.max(0, value)
        : 0;
}


function scoreGetStudyHistoryObject() {

    const history =
        scoreReadJSON(
            SCORE_HISTORY_KEY,
            {}
        );


    if (
        history &&
        typeof history === "object" &&
        !Array.isArray(history)
    ) {

        return history;
    }


    return {};
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
        typeof daily === "number"
    ) {

        total +=
            Math.max(
                0,
                daily
            );

    } else if (
        daily &&
        typeof daily === "object" &&
        !Array.isArray(daily)
    ) {

        Object.values(daily)
            .forEach(value => {

                if (
                    typeof value === "object" &&
                    value !== null
                ) {

                    value =
                        value.minutes ??
                        value.studyMinutes ??
                        (
                            Number(value.hours) *
                            60
                        );
                }


                const minutes =
                    Number(value);


                if (
                    Number.isFinite(minutes)
                ) {

                    total +=
                        Math.max(
                            0,
                            minutes
                        );
                }
            });
    }


    /*
     * Study history may store hours/minutes by date.
     */

    const history =
        scoreGetStudyHistoryObject();


    Object.values(history)
        .forEach(value => {

            let minutes = 0;


            if (
                typeof value === "number"
            ) {

                /*
                 * StudyHistory is normally hours.
                 */

                minutes =
                    value * 60;

            } else if (
                value &&
                typeof value === "object"
            ) {

                if (
                    value.minutes !== undefined
                ) {

                    minutes =
                        Number(
                            value.minutes
                        );

                } else if (
                    value.studyMinutes !== undefined
                ) {

                    minutes =
                        Number(
                            value.studyMinutes
                        );

                } else if (
                    value.hours !== undefined
                ) {

                    minutes =
                        Number(
                            value.hours
                        ) * 60;
                }
            }


            if (
                Number.isFinite(minutes)
            ) {

                /*
                 * Do not double count a history
                 * source if daily data already exists.
                 */

                if (
                    total === 0
                ) {

                    total +=
                        Math.max(
                            0,
                            minutes
                        );
                }
            }
        });


    /*
     * Sessions are a fallback only.
     */

    if (total === 0) {

        const sessions =
            scoreGetArray(
                SCORE_SESSIONS_KEY
            );


        sessions.forEach(
            session => {

                if (
                    !session ||
                    typeof session !== "object"
                ) {

                    return;
                }


                const minutes =
                    Number(
                        session.minutes ??
                        session.durationMinutes ??
                        session.studyMinutes ??
                        0
                    );


                if (
                    Number.isFinite(minutes)
                ) {

                    total +=
                        Math.max(
                            0,
                            minutes
                        );
                }
            }
        );
    }


    return Math.max(
        0,
        total
    );
}


/* =========================================================
   ACTIVITY HISTORY
========================================================= */

function scoreGetStudyHistoryDates() {

    const dates =
        new Set();


    const history =
        scoreGetStudyHistoryObject();


    Object.keys(history)
        .forEach(date => {

            if (
                /^\d{4}-\d{2}-\d{2}$/.test(date)
            ) {

                dates.add(date);
            }
        });


    const lastStudy =
        localStorage.getItem(
            SCORE_LAST_STUDY_KEY
        );


    if (
        lastStudy &&
        /^\d{4}-\d{2}-\d{2}$/.test(lastStudy)
    ) {

        dates.add(lastStudy);
    }


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

                        dates.add(date);
                    }
                }
            );
    }


    return dates;
}


/* =========================================================
   STREAK
========================================================= */

function scoreCalculateStreak() {

    /*
     * ALWAYS prefer the real StudyMind streak engine.
     */

    if (
        window.StudyMindStreak &&
        typeof window.StudyMindStreak
            .calculateCurrentStreak === "function"
    ) {

        const value =
            Number(
                window.StudyMindStreak
                    .calculateCurrentStreak()
            );


        if (
            Number.isFinite(value)
        ) {

            return Math.max(
                0,
                value
            );
        }
    }


    const dates =
        [...scoreGetStudyHistoryDates()]
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


    if (
        scoreDaysBetween(
            dates[0],
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

        if (
            scoreDaysBetween(
                dates[i],
                dates[i + 1]
            ) === 1
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


    planTopics.forEach(
        topic => {

            const normalized =
                scoreNormalizeText(
                    topic
                );


            if (
                completedTopics.some(
                    completedTopic =>
                        scoreNormalizeText(
                            completedTopic
                        ) === normalized
                )
            ) {

                completed++;
            }
        }
    );


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


    if (
        storedDate &&
        storedDate !== today
    ) {

        aiQuestions = 0;
    }


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
   MAIN SCORE CALCULATION
========================================================= */

function calculateStudyScore() {

    const plan =
        scoreGetPlan();


    const completedTopics =
        scoreGetCompletedTopics();


    const completedQuestions =
        scoreGetCompletedQuestions();


    const knowledge =
        scoreGetKnowledgePerformance();


    const currentStreak =
        scoreCalculateStreak();


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

       300 total minutes = 30 points
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

       IMPORTANT:

       This now uses the student's ACTUAL
       knowledge-check performance.

       Example:

       Average = 60%  → 15 / 25
       Average = 80%  → 20 / 25
       Average = 100% → 25 / 25

       No completed checks → 0 / 25
    ----------------------------------------------------- */

    const questionScore =
        knowledge.count > 0
            ? Math.round(
                (
                    knowledge.average /
                    100
                ) * 25
            )
            : 0;


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
            ai.knowledgeUsage,

        /*
         * Shared knowledge-check data.
         */

        knowledgeCheckCount:
            knowledge.count,

        knowledgeAverage:
            knowledge.average,

        knowledgeHighest:
            knowledge.highest,

        knowledgeLowest:
            knowledge.lowest,

        knowledgePassed:
            knowledge.passed,

        knowledgeExcellent:
            knowledge.excellent,

        knowledgePerfect:
            knowledge.perfect
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
                "More study time and stronger knowledge-check results will raise your score."
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


    scoreWriteJSON(
        SCORE_BREAKDOWN_KEY,
        {

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

            knowledgeAverage:
                data.knowledgeAverage,

            knowledgeCheckCount:
                data.knowledgeCheckCount,

            updatedAt:
                Date.now()
        }
    );
}


/* =========================================================
   UI HELPERS
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
        scoreClamp(
            Number(
                percentage
            ) || 0,
            0,
            100
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
        ) ||
        document.getElementById(
            "achievementFirst"
        );


    const fiveTopics =
        document.getElementById(
            "achievementFiveTopics"
        ) ||
        document.getElementById(
            "achievementFive"
        );


    const sevenDays =
        document.getElementById(
            "achievementSevenDays"
        ) ||
        document.getElementById(
            "achievementSeven"
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
   UPDATE SCORE UI
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
       KNOWLEDGE PERFORMANCE
    ----------------------------------------------------- */

    const knowledgeAverage =
        document.getElementById(
            "knowledgeAverage"
        );


    if (knowledgeAverage) {

        knowledgeAverage.textContent =
            `${data.knowledgeAverage}%`;
    }


    const knowledgeCount =
        document.getElementById(
            "knowledgeCheckCount"
        );


    if (knowledgeCount) {

        knowledgeCount.textContent =
            data.knowledgeCheckCount;
    }


    /* -----------------------------------------------------
       BREAKDOWN
    ----------------------------------------------------- */

    const topicScoreText =
        document.getElementById(
            "topicScoreText"
        );


    /*
     * Preserve the existing HTML ID.
     * This represents the study-time component.
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
        scoreGetAIUsage,

    getKnowledgePerformance:
        scoreGetKnowledgePerformance,

    getKnowledgeResults:
        scoreGetKnowledgeResults,

    getCompletedTopics:
        scoreGetCompletedTopics,

    getCurrentStreak:
        scoreCalculateStreak,

    getPlanProgress:
        () =>
            scoreCalculatePlanProgress(
                scoreGetPlan(),
                scoreGetCompletedTopics()
            )
};


/* =========================================================
   AUTOMATIC REFRESH
========================================================= */

function refreshScoreSoon() {

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


window.addEventListener(
    "storage",
    event => {

        const importantKeys = [

            SCORE_COMPLETED_TOPICS_KEY,

            SCORE_COMPLETED_QUESTIONS_KEY,

            SCORE_KNOWLEDGE_RESULTS_KEY,

            SCORE_DAILY_TIME_KEY,

            SCORE_SESSIONS_KEY,

            SCORE_HISTORY_KEY,

            SCORE_AI_COUNT_KEY,

            SCORE_AI_DATE_KEY,

            SCORE_KNOWLEDGE_USAGE_KEY,

            SCORE_STREAK_KEY,

            SCORE_ACTIVITY_KEY,

            SCORE_PLAN_KEY,

            SCORE_PLANS_KEY,

            SCORE_ACTIVE_PLAN_KEY

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

        updateScoreUI();

    }
);


/* =========================================================
   GLOBALS
========================================================= */

window.toggleScoreTheme =
    function () {

        const current =
            localStorage.getItem(
                "studyMindTheme"
            );


        const next =
            current === "light"
                ? "dark"
                : "light";


        localStorage.setItem(
            "studyMindTheme",
            next
        );


        document.body.classList.toggle(
            "light-mode",
            next === "light"
        );
    };


window.logoutStudyMind =
    async function () {

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
    };
