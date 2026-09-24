"use strict";

/* =========================================================
   STUDYMIND AI — PLAN PROGRESS ENGINE
   =========================================================
   SOURCE OF TRUTH:
       studyMindPlans[].progress

   COMPATIBILITY:
       The normal localStorage progress keys represent
       ONLY the currently active plan.

   ACCOUNT-WIDE:
       - username
       - premium
       - Game Mode identity/stats
       - theme
========================================================= */

(function () {

    const KEYS = {

        PLAN: "studyMindPlan",
        PLANS: "studyMindPlans",
        ACTIVE_PLAN: "studyMindActivePlanId",

        XP: "studyMindXP",
        TOTAL_XP: "studyMindTotalXP",

        STREAK: "studyMindStreak",
        LONGEST_STREAK: "studyMindLongestStreak",
        STREAK_ACTIVITY: "studyMindStreakActivity",

        SCORE: "studyMindStudyScore",

        COMPLETED_TOPICS:
            "studyMindCompletedTopics",

        COMPLETED_QUESTIONS:
            "studyMindCompletedQuestionTopics",

        KNOWLEDGE_RESULTS:
            "studyMindKnowledgeCheckResults",

        TOTAL_STUDY_MINUTES:
            "studyMindTotalStudyMinutes",

        DAILY_STUDY_TIME:
            "studyMindDailyStudyTime",

        STUDY_HISTORY:
            "studyMindStudyHistory",

        STUDY_SESSIONS:
            "studyMindStudySessions",

        COMPLETED_TIMER_SESSIONS:
            "studyMindCompletedTimerSessions",

        CURRENT_TOPIC:
            "studyMindCurrentTopic",

        CURRENT_TOPIC_INDEX:
            "studyMindCurrentTopicIndex",

        REWARDS_UNLOCKED:
            "studyMindRewardsUnlocked",

        REWARD_NOTIFICATIONS:
            "studyMindRewardNotifications",

        REWARD_XP:
            "studyMindRewardXP",

        XP_EVENTS:
            "studyMindXPEvents",

        SCORE_BREAKDOWN:
            "studyMindStudyScoreBreakdown",

        SUMMARY_COUNT:
            "studyMindSummaryCount",

        MIGRATION:
            "studyMindProgressMigrationVersion"

    };


    /* =====================================================
       HELPERS
    ===================================================== */

    function readJSON(key, fallback) {

        try {

            const raw =
                localStorage.getItem(key);

            if (!raw) {
                return fallback;
            }

            return JSON.parse(raw);

        } catch {

            return fallback;

        }

    }


    function writeJSON(key, value) {

        try {

            localStorage.setItem(
                key,
                JSON.stringify(value)
            );

        } catch (error) {

            console.error(
                "StudyMind: Could not save",
                key,
                error
            );

        }

    }


    function numberValue(key, fallback = 0) {

        const value =
            Number(
                localStorage.getItem(key)
            );

        return Number.isFinite(value)
            ? value
            : fallback;

    }


    function todayKey() {

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


    function clone(value) {

        try {

            return JSON.parse(
                JSON.stringify(value)
            );

        } catch {

            return value;

        }

    }


    function arrayValue(key) {

        const value =
            readJSON(
                key,
                []
            );

        return Array.isArray(value)
            ? value
            : [];

    }


    function objectValue(key) {

        const value =
            readJSON(
                key,
                {}
            );

        return value &&
            typeof value === "object" &&
            !Array.isArray(value)
                ? value
                : {};

    }


    /* =====================================================
       FRESH PLAN PROGRESS
    ===================================================== */

    function createEmptyProgress() {

        return {

            /* CORE */

            xp: 0,

            streak: 0,

            longestStreak: 0,

            studyScore: 0,

            studyMinutes: 0,

            sessions: 0,


            /* TOPICS */

            completedTopics: [],

            completedQuestionTopics: [],

            knowledgeCheckResults: [],


            /* STUDY ACTIVITY */

            streakActivity: {},

            studyHistory: {},

            studySessions: [],

            completedTimerSessions: 0,

            dailyStudyTime: {},


            /* CURRENT POSITION */

            currentTopicIndex: 0,

            currentTopic: "",


            /* XP */

            xpEvents: {},


            /* REWARDS */

            rewardsUnlocked: [],

            rewardNotifications: [],

            rewardXP: 0,


            /* SCORE */

            studyScoreBreakdown: {},


            /* AI */

            aiUsage: {},

            summaryCount: 0,


            /* STREAK SAVER */

            streakSaver: {

                available: false,

                missedDay: null,

                secondMissedDay: null,

                used: false

            }

        };

    }


    /* =====================================================
       NORMALIZE PROGRESS
    ===================================================== */

    function ensurePlanProgress(plan) {

        if (
            !plan ||
            typeof plan !== "object"
        ) {

            return null;

        }


        if (
            !plan.progress ||
            typeof plan.progress !== "object"
        ) {

            plan.progress =
                createEmptyProgress();

        }


        const defaults =
            createEmptyProgress();


        Object.keys(defaults)
            .forEach(
                key => {

                    if (
                        plan.progress[key] ===
                        undefined ||
                        plan.progress[key] ===
                        null
                    ) {

                        plan.progress[key] =
                            clone(
                                defaults[key]
                            );

                    }

                }
            );


        /* Arrays */

        const arrays = [

            "completedTopics",

            "completedQuestionTopics",

            "knowledgeCheckResults",

            "studySessions",

            "rewardsUnlocked",

            "rewardNotifications"

        ];


        arrays.forEach(
            key => {

                if (
                    !Array.isArray(
                        plan.progress[key]
                    )
                ) {

                    plan.progress[key] = [];

                }

            }
        );


        /* Objects */

        const objects = [

            "streakActivity",

            "studyHistory",

            "dailyStudyTime",

            "xpEvents",

            "studyScoreBreakdown",

            "aiUsage"

        ];


        objects.forEach(
            key => {

                if (
                    !plan.progress[key] ||
                    typeof plan.progress[key] !==
                        "object" ||
                    Array.isArray(
                        plan.progress[key]
                    )
                ) {

                    plan.progress[key] = {};

                }

            }
        );


        /* Streak saver */

        if (
            !plan.progress.streakSaver ||
            typeof plan.progress.streakSaver !==
                "object"
        ) {

            plan.progress.streakSaver =
                clone(
                    defaults.streakSaver
                );

        } else {

            plan.progress.streakSaver = {

                available:
                    Boolean(
                        plan.progress
                            .streakSaver
                            .available
                    ),

                missedDay:
                    plan.progress
                        .streakSaver
                        .missedDay ||
                    null,

                secondMissedDay:
                    plan.progress
                        .streakSaver
                        .secondMissedDay ||
                    null,

                used:
                    Boolean(
                        plan.progress
                            .streakSaver
                            .used
                    )

            };

        }


        /* Numbers */

        plan.progress.xp =
            Math.max(
                0,
                Number(
                    plan.progress.xp
                ) || 0
            );


        plan.progress.streak =
            Math.max(
                0,
                Number(
                    plan.progress.streak
                ) || 0
            );


        plan.progress.longestStreak =
            Math.max(
                0,
                Number(
                    plan.progress.longestStreak
                ) || 0
            );


        plan.progress.studyScore =
            Math.max(
                0,
                Math.min(
                    100,
                    Number(
                        plan.progress.studyScore
                    ) || 0
                )
            );


        plan.progress.studyMinutes =
            Math.max(
                0,
                Number(
                    plan.progress.studyMinutes
                ) || 0
            );


        plan.progress.sessions =
            Math.max(
                0,
                Number(
                    plan.progress.sessions
                ) || 0
            );


        plan.progress.completedTimerSessions =
            Math.max(
                0,
                Number(
                    plan.progress
                        .completedTimerSessions
                ) || 0
            );


        plan.progress.rewardXP =
            Math.max(
                0,
                Number(
                    plan.progress.rewardXP
                ) || 0
            );


        plan.progress.summaryCount =
            Math.max(
                0,
                Number(
                    plan.progress.summaryCount
                ) || 0
            );


        plan.progress.currentTopicIndex =
            Math.max(
                0,
                Number(
                    plan.progress.currentTopicIndex
                ) || 0
            );


        /* Legacy compatibility fields */

        plan.xp =
            plan.progress.xp;

        plan.streak =
            plan.progress.streak;

        plan.studyScore =
            plan.progress.studyScore;

        plan.completedTopics =
            [
                ...plan.progress.completedTopics
            ];

        plan.completedQuestionTopics =
            [
                ...plan.progress
                    .completedQuestionTopics
            ];


        return plan;

    }


    /* =====================================================
       GET PLANS
    ===================================================== */

    function getPlans() {

        const plans =
            readJSON(
                KEYS.PLANS,
                []
            );

        return Array.isArray(plans)
            ? plans
            : [];

    }


    /* =====================================================
       ACTIVE PLAN ID
    ===================================================== */

    function getActivePlanId() {

        return localStorage.getItem(
            KEYS.ACTIVE_PLAN
        );

    }


    /* =====================================================
       FIND ACTIVE PLAN
    ===================================================== */

    function getActivePlan() {

        const plans =
            getPlans();

        const activeId =
            getActivePlanId();


        if (activeId) {

            const found =
                plans.find(
                    plan =>
                        plan &&
                        String(plan.id) ===
                        String(activeId)
                );


            if (found) {

                return ensurePlanProgress(
                    found
                );

            }

        }


        /*
         * Legacy fallback.
         */

        const legacy =
            readJSON(
                KEYS.PLAN,
                null
            );


        if (!legacy) {
            return null;
        }


        return ensurePlanProgress(
            legacy
        );

    }


    /* =====================================================
       SNAPSHOT COMPATIBILITY STORAGE
       INTO ONE PLAN
    ===================================================== */

    function captureCompatibilityProgress(
        plan
    ) {

        if (!plan) {
            return null;
        }


        ensurePlanProgress(
            plan
        );


        const progress =
            plan.progress;


        /* CORE */

        progress.xp =
            Math.max(
                0,
                numberValue(
                    KEYS.XP,
                    progress.xp
                )
            );


        progress.streak =
            Math.max(
                0,
                numberValue(
                    KEYS.STREAK,
                    progress.streak
                )
            );


        progress.longestStreak =
            Math.max(
                progress.longestStreak,
                numberValue(
                    KEYS.LONGEST_STREAK,
                    0
                )
            );


        progress.studyScore =
            Math.max(
                0,
                Math.min(
                    100,
                    numberValue(
                        KEYS.SCORE,
                        progress.studyScore
                    )
                )
            );


        progress.studyMinutes =
            Math.max(
                0,
                numberValue(
                    KEYS.TOTAL_STUDY_MINUTES,
                    progress.studyMinutes
                )
            );


        /* TOPICS */

        progress.completedTopics =
            arrayValue(
                KEYS.COMPLETED_TOPICS
            );


        progress.completedQuestionTopics =
            arrayValue(
                KEYS.COMPLETED_QUESTIONS
            );


        progress.knowledgeCheckResults =
            arrayValue(
                KEYS.KNOWLEDGE_RESULTS
            );


        /* ACTIVITY */

        progress.streakActivity =
            objectValue(
                KEYS.STREAK_ACTIVITY
            );


        progress.studyHistory =
            objectValue(
                KEYS.STUDY_HISTORY
            );


        progress.dailyStudyTime =
            objectValue(
                KEYS.DAILY_STUDY_TIME
            );


        progress.studySessions =
            arrayValue(
                KEYS.STUDY_SESSIONS
            );


        progress.completedTimerSessions =
            Math.max(
                0,
                numberValue(
                    KEYS.COMPLETED_TIMER_SESSIONS,
                    progress.completedTimerSessions
                )
            );


        /*
         * Number of recorded study sessions.
         *
         * Keep the explicit sessions counter if another
         * part of the application has already recorded one.
         */

        progress.sessions =
            Math.max(
                progress.sessions,
                progress.studySessions.length
            );


        /* CURRENT TOPIC */

        progress.currentTopic =
            localStorage.getItem(
                KEYS.CURRENT_TOPIC
            ) || "";


        progress.currentTopicIndex =
            Math.max(
                0,
                numberValue(
                    KEYS.CURRENT_TOPIC_INDEX,
                    progress.currentTopicIndex
                )
            );


        /* REWARDS */

        progress.rewardsUnlocked =
            arrayValue(
                KEYS.REWARDS_UNLOCKED
            );


        progress.rewardNotifications =
            arrayValue(
                KEYS.REWARD_NOTIFICATIONS
            );


        progress.rewardXP =
            Math.max(
                0,
                numberValue(
                    KEYS.REWARD_XP,
                    progress.rewardXP
                )
            );


        /* XP EVENTS */

        progress.xpEvents =
            objectValue(
                KEYS.XP_EVENTS
            );


        /* SCORE */

        progress.studyScoreBreakdown =
            objectValue(
                KEYS.SCORE_BREAKDOWN
            );


        /* AI */

        progress.summaryCount =
            Math.max(
                0,
                numberValue(
                    KEYS.SUMMARY_COUNT,
                    progress.summaryCount
                )
            );


        /*
         * AI usage is stored separately by AI tools.
         * If it exists in localStorage, capture it.
         */

        const storedAIUsage =
            readJSON(
                "studyMindAIUsage",
                null
            );


        if (
            storedAIUsage &&
            typeof storedAIUsage ===
                "object"
        ) {

            progress.aiUsage =
                clone(
                    storedAIUsage
                );

        }


        /*
         * Keep legacy fields synchronized.
         */

        plan.xp =
            progress.xp;

        plan.streak =
            progress.streak;

        plan.studyScore =
            progress.studyScore;

        plan.completedTopics =
            [
                ...progress.completedTopics
            ];

        plan.completedQuestionTopics =
            [
                ...progress.completedQuestionTopics
            ];


        return plan;

    }


    /* =====================================================
       SAVE PLANS ARRAY
    ===================================================== */

    function writePlans(plans) {

        try {

            localStorage.setItem(
                KEYS.PLANS,
                JSON.stringify(
                    plans
                )
            );

        } catch (error) {

            console.error(
                "StudyMind: Could not save plans",
                error
            );

            return false;

        }


        return true;

    }


    /* =====================================================
       SAVE ONE PLAN WITHOUT CHANGING ACTIVE PLAN
    ===================================================== */

    function savePlanObject(plan) {

        if (!plan) {
            return false;
        }


        ensurePlanProgress(
            plan
        );


        let plans =
            getPlans();


        const index =
            plans.findIndex(
                item =>
                    item &&
                    String(item.id) ===
                    String(plan.id)
            );


        if (index >= 0) {

            plans[index] =
                plan;

        } else {

            plans.push(
                plan
            );

        }


        return writePlans(
            plans
        );

    }


    /* =====================================================
       LOAD PLAN PROGRESS INTO COMPATIBILITY STORAGE
    ===================================================== */

    function loadPlanProgressIntoStorage(
        plan
    ) {

        if (!plan) {
            return null;
        }


        ensurePlanProgress(
            plan
        );


        const progress =
            plan.progress;


        /* CORE */

        localStorage.setItem(
            KEYS.XP,
            String(
                progress.xp
            )
        );


        localStorage.setItem(
            KEYS.TOTAL_XP,
            String(
                progress.xp
            )
        );


        localStorage.setItem(
            KEYS.STREAK,
            String(
                progress.streak
            )
        );


        localStorage.setItem(
            KEYS.LONGEST_STREAK,
            String(
                progress.longestStreak
            )
        );


        localStorage.setItem(
            KEYS.SCORE,
            String(
                progress.studyScore
            )
        );


        localStorage.setItem(
            KEYS.TOTAL_STUDY_MINUTES,
            String(
                progress.studyMinutes
            )
        );


        /* TOPICS */

        writeJSON(
            KEYS.COMPLETED_TOPICS,
            progress.completedTopics
        );


        writeJSON(
            KEYS.COMPLETED_QUESTIONS,
            progress.completedQuestionTopics
        );


        writeJSON(
            KEYS.KNOWLEDGE_RESULTS,
            progress.knowledgeCheckResults
        );


        /* ACTIVITY */

        writeJSON(
            KEYS.STREAK_ACTIVITY,
            progress.streakActivity
        );


        writeJSON(
            KEYS.STUDY_HISTORY,
            progress.studyHistory
        );


        writeJSON(
            KEYS.DAILY_STUDY_TIME,
            progress.dailyStudyTime
        );


        writeJSON(
            KEYS.STUDY_SESSIONS,
            progress.studySessions
        );


        localStorage.setItem(
            KEYS.COMPLETED_TIMER_SESSIONS,
            String(
                progress.completedTimerSessions
            )
        );


        /* CURRENT TOPIC */

        if (
            progress.currentTopic
        ) {

            localStorage.setItem(
                KEYS.CURRENT_TOPIC,
                progress.currentTopic
            );

        } else {

            localStorage.removeItem(
                KEYS.CURRENT_TOPIC
            );

        }


        localStorage.setItem(
            KEYS.CURRENT_TOPIC_INDEX,
            String(
                progress.currentTopicIndex
            )
        );


        /* REWARDS */

        writeJSON(
            KEYS.REWARDS_UNLOCKED,
            progress.rewardsUnlocked
        );


        writeJSON(
            KEYS.REWARD_NOTIFICATIONS,
            progress.rewardNotifications
        );


        localStorage.setItem(
            KEYS.REWARD_XP,
            String(
                progress.rewardXP
            )
        );


        /* XP EVENTS */

        writeJSON(
            KEYS.XP_EVENTS,
            progress.xpEvents
        );


        /* SCORE BREAKDOWN */

        writeJSON(
            KEYS.SCORE_BREAKDOWN,
            progress.studyScoreBreakdown
        );


        /* SUMMARY */

        localStorage.setItem(
            KEYS.SUMMARY_COUNT,
            String(
                progress.summaryCount
            )
        );


        /*
         * AI compatibility mirror.
         */

        writeJSON(
            "studyMindAIUsage",
            progress.aiUsage || {}
        );


        /* LEGACY PLAN OBJECT */

        plan.xp =
            progress.xp;

        plan.streak =
            progress.streak;

        plan.studyScore =
            progress.studyScore;

        plan.completedTopics =
            [
                ...progress.completedTopics
            ];

        plan.completedQuestionTopics =
            [
                ...progress.completedQuestionTopics
            ];


        localStorage.setItem(
            KEYS.PLAN,
            JSON.stringify(
                plan
            )
        );


        localStorage.setItem(
            "studyData",
            JSON.stringify(
                plan
            )
        );


        return plan;

    }


    /* =====================================================
       SAVE ACTIVE PLAN PROGRESS
    ===================================================== */

    function saveActivePlanProgress() {

        const activeId =
            getActivePlanId();


        if (!activeId) {
            return null;
        }


        const plans =
            getPlans();


        const index =
            plans.findIndex(
                plan =>
                    plan &&
                    String(plan.id) ===
                    String(activeId)
            );


        if (index === -1) {
            return null;
        }


        const activePlan =
            plans[index];


        captureCompatibilityProgress(
            activePlan
        );


        ensurePlanProgress(
            activePlan
        );


        plans[index] =
            activePlan;


        writePlans(
            plans
        );


        localStorage.setItem(
            KEYS.PLAN,
            JSON.stringify(
                activePlan
            )
        );


        localStorage.setItem(
            "studyData",
            JSON.stringify(
                activePlan
            )
        );


        return activePlan;

    }


    /* =====================================================
       SWITCH PLAN
    ===================================================== */

    function switchPlan(planId) {

        if (!planId) {
            return null;
        }


        const plans =
            getPlans();


        const targetIndex =
            plans.findIndex(
                plan =>
                    plan &&
                    String(plan.id) ===
                    String(planId)
            );


        if (targetIndex === -1) {

            console.error(
                "StudyMind: Plan not found:",
                planId
            );

            return null;

        }


        const currentId =
            getActivePlanId();


        /*
         * CRITICAL:
         *
         * Save the OLD active plan FIRST.
         *
         * This prevents Plan 1's progress from being
         * lost when switching to Plan 2.
         */

        if (
            currentId &&
            String(currentId) !==
                String(planId)
        ) {

            saveActivePlanProgress();

        }


        /*
         * Re-read plans because the previous operation
         * may have modified the active plan.
         */

        const refreshedPlans =
            getPlans();


        const target =
            refreshedPlans.find(
                plan =>
                    plan &&
                    String(plan.id) ===
                    String(planId)
            );


        if (!target) {
            return null;
        }


        ensurePlanProgress(
            target
        );


        /*
         * Make target active.
         */

        localStorage.setItem(
            KEYS.ACTIVE_PLAN,
            String(
                target.id
            )
        );


        /*
         * Load ONLY the target's progress.
         */

        loadPlanProgressIntoStorage(
            target
        );


        /*
         * Update the plan in storage with its normalized
         * progress, without capturing old compatibility
         * values from the previous plan.
         */

        const finalPlans =
            getPlans();


        const finalIndex =
            finalPlans.findIndex(
                plan =>
                    plan &&
                    String(plan.id) ===
                    String(target.id)
            );


        if (finalIndex >= 0) {

            finalPlans[finalIndex] =
                target;

            writePlans(
                finalPlans
            );

        }


        /*
         * A timer must never continue a session from
         * another plan.
         */

        stopTimerForPlanSwitch();


        window.dispatchEvent(
            new CustomEvent(
                "studyMindActivePlanChanged",
                {
                    detail: {

                        planId:
                            target.id,

                        plan:
                            target

                    }

                }
            )
        );


        window.dispatchEvent(
            new CustomEvent(
                "studyMindProgressUpdated",
                {
                    detail: {

                        planId:
                            target.id

                    }

                }
            )
        );


        return target;

    }


    /* =====================================================
       STOP TIMER WHEN SWITCHING PLANS
    ===================================================== */

    function stopTimerForPlanSwitch() {

        localStorage.removeItem(
            "studyMindTimerEndTime"
        );

        localStorage.setItem(
            "studyMindTimerRunning",
            "false"
        );


        localStorage.removeItem(
            "studyMindTimerSessionStart"
        );

        localStorage.removeItem(
            "studyMindTimerAwardedMinute"
        );

        localStorage.removeItem(
            "studyMindTimerSessionBaseMinutes"
        );


        const selected =
            Number(
                localStorage.getItem(
                    "studyMindSelectedTimerSeconds"
                )
            ) ||
            25 * 60;


        localStorage.setItem(
            "studyMindTimerSeconds",
            String(
                selected
            )
        );

    }


    /* =====================================================
       INITIALIZE NEW PLAN
       Used by the plan generator.
    ===================================================== */

    function initializeNewPlan(
        plan
    ) {

        if (!plan) {
            return null;
        }


        /*
         * This function MUST NOT copy the current
         * plan's progress.
         */

        plan.progress =
            createEmptyProgress();


        plan.xp = 0;

        plan.streak = 0;

        plan.studyScore = 0;

        plan.completedTopics = [];

        plan.completedQuestionTopics = [];


        ensurePlanProgress(
            plan
        );


        /*
         * Add the fresh plan to the plans array.
         */

        let plans =
            getPlans();


        const index =
            plans.findIndex(
                item =>
                    item &&
                    String(item.id) ===
                    String(plan.id)
            );


        if (index >= 0) {

            plans[index] =
                plan;

        } else {

            plans.push(
                plan
            );

        }


        writePlans(
            plans
        );


        /*
         * Make this new plan active.
         */

        localStorage.setItem(
            KEYS.ACTIVE_PLAN,
            String(
                plan.id
            )
        );


        /*
         * Load the CLEAN progress.
         */

        loadPlanProgressIntoStorage(
            plan
        );


        /*
         * Stop old timer session.
         */

        stopTimerForPlanSwitch();


        /*
         * Notify application.
         */

        window.dispatchEvent(
            new CustomEvent(
                "studyMindPlanCreated",
                {
                    detail: {

                        planId:
                            plan.id,

                        newPlan:
                            true

                    }

                }
            )
        );


        window.dispatchEvent(
            new CustomEvent(
                "studyMindActivePlanChanged",
                {
                    detail: {

                        planId:
                            plan.id,

                        fresh:
                            true

                    }

                }
            )
        );


        window.dispatchEvent(
            new CustomEvent(
                "studyMindProgressUpdated",
                {
                    detail: {

                        planId:
                            plan.id,

                        fresh:
                            true

                    }

                }
            )
        );


        return plan;

    }


    /* =====================================================
       GET PROGRESS
    ===================================================== */

    function getProgress() {

        const plan =
            getActivePlan();

        if (!plan) {
            return null;
        }


        ensurePlanProgress(
            plan
        );


        return plan.progress;

    }


    /* =====================================================
       GET ALL PLANS
    ===================================================== */

    function getAllPlans() {

        return getPlans()
            .map(
                plan =>
                    ensurePlanProgress(
                        plan
                    )
            )
            .filter(Boolean);

    }


    /* =====================================================
       INITIAL MIGRATION
       Protects an existing user's old progress.
    ===================================================== */

    function migrateLegacyProgress() {

        const migration =
            localStorage.getItem(
                KEYS.MIGRATION
            );


        if (
            migration === "2"
        ) {

            return;

        }


        let plans =
            getPlans();


        /*
         * If there is a legacy plan but no plans array,
         * turn it into the first stored plan.
         */

        if (
            !plans.length
        ) {

            const legacy =
                readJSON(
                    KEYS.PLAN,
                    null
                );


            if (legacy) {

                ensurePlanProgress(
                    legacy
                );


                const hasLegacyProgress =
                    numberValue(
                        KEYS.XP,
                        0
                    ) > 0 ||
                    numberValue(
                        KEYS.STREAK,
                        0
                    ) > 0 ||
                    numberValue(
                        KEYS.SCORE,
                        0
                    ) > 0 ||
                    arrayValue(
                        KEYS.COMPLETED_TOPICS
                    ).length > 0 ||
                    numberValue(
                        KEYS.TOTAL_STUDY_MINUTES,
                        0
                    ) > 0;


                if (
                    hasLegacyProgress
                ) {

                    captureCompatibilityProgress(
                        legacy
                    );

                }


                plans = [
                    legacy
                ];


                writePlans(
                    plans
                );


                if (
                    legacy.id
                ) {

                    localStorage.setItem(
                        KEYS.ACTIVE_PLAN,
                        String(
                            legacy.id
                        )
                    );

                }

            }

        }


        /*
         * If plans already exist, identify the active plan.
         */

        if (
            plans.length
        ) {

            let active =
                plans.find(
                    plan =>
                        plan &&
                        String(plan.id) ===
                        String(
                            getActivePlanId()
                        )
                );


            if (!active) {

                active =
                    plans[0];


                if (
                    active &&
                    active.id
                ) {

                    localStorage.setItem(
                        KEYS.ACTIVE_PLAN,
                        String(
                            active.id
                        )
                    );

                }

            }


            if (active) {

                ensurePlanProgress(
                    active
                );


                /*
                 * Older plan records may have progress fields
                 * but the compatibility keys may contain the
                 * actual old user data.
                 *
                 * Only migrate if the plan looks empty while
                 * legacy storage clearly contains data.
                 */

                const progressLooksEmpty =
                    Number(
                        active.progress.xp
                    ) === 0 &&
                    Number(
                        active.progress.streak
                    ) === 0 &&
                    Number(
                        active.progress.studyScore
                    ) === 0 &&
                    Number(
                        active.progress.studyMinutes
                    ) === 0 &&
                    active.progress
                        .completedTopics
                        .length === 0;


                const legacyHasData =
                    numberValue(
                        KEYS.XP,
                        0
                    ) > 0 ||
                    numberValue(
                        KEYS.STREAK,
                        0
                    ) > 0 ||
                    numberValue(
                        KEYS.SCORE,
                        0
                    ) > 0 ||
                    numberValue(
                        KEYS.TOTAL_STUDY_MINUTES,
                        0
                    ) > 0 ||
                    arrayValue(
                        KEYS.COMPLETED_TOPICS
                    ).length > 0;


                if (
                    progressLooksEmpty &&
                    legacyHasData
                ) {

                    captureCompatibilityProgress(
                        active
                    );

                    const activeIndex =
                        plans.findIndex(
                            item =>
                                item &&
                                String(item.id) ===
                                String(active.id)
                        );


                    if (
                        activeIndex >= 0
                    ) {

                        plans[activeIndex] =
                            active;

                    }

                    writePlans(
                        plans
                    );

                }

            }

        }


        localStorage.setItem(
            KEYS.MIGRATION,
            "2"
        );

    }


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    function initialize() {

        migrateLegacyProgress();


        const plans =
            getPlans();


        if (
            !plans.length
        ) {

            return;

        }


        let active =
            plans.find(
                plan =>
                    plan &&
                    String(plan.id) ===
                    String(
                        getActivePlanId()
                    )
            );


        if (!active) {

            active =
                plans[0];


            if (
                active &&
                active.id
            ) {

                localStorage.setItem(
                    KEYS.ACTIVE_PLAN,
                    String(
                        active.id
                    )
                );

            }

        }


        if (!active) {
            return;
        }


        ensurePlanProgress(
            active
        );


        loadPlanProgressIntoStorage(
            active
        );


        /*
         * Save normalized plan without copying the
         * compatibility values back into it again.
         */

        const normalizedPlans =
            getPlans();


        const index =
            normalizedPlans.findIndex(
                plan =>
                    plan &&
                    String(plan.id) ===
                    String(active.id)
            );


        if (
            index >= 0
        ) {

            normalizedPlans[index] =
                active;

            writePlans(
                normalizedPlans
            );

        }


        /*
         * Periodic synchronization.
         *
         * Other StudyMind modules can continue using the
         * legacy localStorage keys, while this engine makes
         * sure those changes eventually belong to the
         * active plan.
         */

        setInterval(
            () => {

                saveActivePlanProgress();

            },
            1000
        );

    }


    /* =====================================================
       EVENTS
    ===================================================== */

    window.addEventListener(
        "studyMindActivePlanChanged",
        event => {

            const planId =
                event?.detail?.planId;


            if (
                planId &&
                String(
                    planId
                ) !==
                String(
                    getActivePlanId()
                )
            ) {

                localStorage.setItem(
                    KEYS.ACTIVE_PLAN,
                    String(
                        planId
                    )
                );

            }


            loadActivePlanProgress();

        }
    );


    window.addEventListener(
        "storage",
        event => {

            if (
                event.key ===
                KEYS.ACTIVE_PLAN
            ) {

                loadActivePlanProgress();

            }

        }
    );


    /* =====================================================
       LOAD ACTIVE PLAN
    ===================================================== */

    function loadActivePlanProgress() {

        const plan =
            getActivePlan();


        if (!plan) {
            return null;
        }


        ensurePlanProgress(
            plan
        );


        loadPlanProgressIntoStorage(
            plan
        );


        /*
         * Keep normalized version in plans.
         */

        const plans =
            getPlans();


        const index =
            plans.findIndex(
                item =>
                    item &&
                    String(item.id) ===
                    String(plan.id)
            );


        if (
            index >= 0
        ) {

            plans[index] =
                plan;

            writePlans(
                plans
            );

        }


        window.dispatchEvent(
            new CustomEvent(
                "studyMindProgressLoaded",
                {
                    detail: {

                        planId:
                            plan.id || null

                    }

                }
            )
        );


        return plan;

    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.StudyMindPlanProgress = {

        getPlans:
            getAllPlans,

        getActivePlan,

        getActivePlanId,

        getProgress,

        ensureProgress:
            ensurePlanProgress,

        createEmptyProgress,

        initializeNewPlan,

        switchPlan,

        loadActivePlanProgress,

        syncGlobalProgressToPlan:
            saveActivePlanProgress,

        saveActivePlan:
            saveActivePlanProgress,

        savePlan:
            savePlanObject,

        captureCompatibilityProgress,

        loadPlanProgressIntoStorage,

        todayKey

    };


    /* =====================================================
       START
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );

    } else {

        initialize();

    }

})();
