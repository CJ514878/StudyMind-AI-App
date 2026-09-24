"use strict";

/* =========================================================
   STUDYMIND AI — PLAN PROGRESS ENGINE
   ---------------------------------------------------------
   Plan-specific:
   - XP
   - streak
   - study score
   - completed topics
   - knowledge checks
   - study minutes
   - sessions
   - rewards
   - reward XP
   - streak activity
   - current topic

   Account-wide:
   - username
   - game identity
   - premium status
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

        STUDY_MINUTES:
            "studyMindDailyStudyTime",

        STUDY_HISTORY:
            "studyMindStudyHistory",

        STUDY_SESSIONS:
            "studyMindStudySessions",

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
            "studyMindXPEvents"
    };


    /* =====================================================
       BASIC HELPERS
    ===================================================== */

    function readJSON(key, fallback) {

        try {

            const raw =
                localStorage.getItem(key);

            if (!raw) return fallback;

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
                "StudyMind progress save error:",
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

        const year =
            date.getFullYear();

        const month =
            String(
                date.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                date.getDate()
            ).padStart(2, "0");

        return `${year}-${month}-${day}`;

    }


    /* =====================================================
       PLAN STORAGE
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


    function getActivePlanId() {

        return localStorage.getItem(
            KEYS.ACTIVE_PLAN
        );

    }


    function getActivePlan() {

        const plans =
            getPlans();

        const activeId =
            getActivePlanId();

        if (activeId) {

            const active =
                plans.find(
                    plan =>
                        plan &&
                        String(plan.id) ===
                        String(activeId)
                );

            if (active) {

                return ensurePlanProgress(
                    active
                );

            }

        }


        const legacy =
            readJSON(
                KEYS.PLAN,
                null
            );

        if (!legacy) return null;

        return ensurePlanProgress(
            legacy
        );

    }


    /* =====================================================
       CREATE CLEAN PROGRESS OBJECT
    ===================================================== */

    function createEmptyProgress() {

        return {

            xp: 0,

            streak: 0,

            longestStreak: 0,

            studyScore: 0,

            studyMinutes: 0,

            sessions: 0,

            completedTopics: [],

            completedQuestionTopics: [],

            knowledgeCheckResults: [],

            streakActivity: {},

            studyHistory: {},

            studySessions: [],

            rewardsUnlocked: [],

            rewardNotifications: [],

            rewardXP: 0,

            currentTopicIndex: 0,

            currentTopic: "",

            xpEvents: {}

        };

    }


    /* =====================================================
       NORMALIZE PLAN PROGRESS
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
            .forEach(key => {

                if (
                    plan.progress[key] ===
                    undefined ||
                    plan.progress[key] ===
                    null
                ) {

                    plan.progress[key] =
                        defaults[key];

                }

            });


        if (
            !Array.isArray(
                plan.progress.completedTopics
            )
        ) {

            plan.progress.completedTopics =
                [];

        }


        if (
            !Array.isArray(
                plan.progress.completedQuestionTopics
            )
        ) {

            plan.progress.completedQuestionTopics =
                [];

        }


        if (
            !Array.isArray(
                plan.progress.knowledgeCheckResults
            )
        ) {

            plan.progress.knowledgeCheckResults =
                [];

        }


        if (
            !Array.isArray(
                plan.progress.studySessions
            )
        ) {

            plan.progress.studySessions =
                [];

        }


        if (
            !Array.isArray(
                plan.progress.rewardsUnlocked
            )
        ) {

            plan.progress.rewardsUnlocked =
                [];

        }


        if (
            !Array.isArray(
                plan.progress.rewardNotifications
            )
        ) {

            plan.progress.rewardNotifications =
                [];

        }


        if (
            !plan.progress.streakActivity ||
            typeof plan.progress.streakActivity !==
                "object"
        ) {

            plan.progress.streakActivity =
                {};

        }


        if (
            !plan.progress.studyHistory ||
            typeof plan.progress.studyHistory !==
                "object"
        ) {

            plan.progress.studyHistory =
                {};

        }


        if (
            !plan.progress.xpEvents ||
            typeof plan.progress.xpEvents !==
                "object"
        ) {

            plan.progress.xpEvents =
                {};

        }


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


        plan.progress.rewardXP =
            Math.max(
                0,
                Number(
                    plan.progress.rewardXP
                ) || 0
            );


        plan.progress.currentTopicIndex =
            Math.max(
                0,
                Number(
                    plan.progress.currentTopicIndex
                ) || 0
            );


        /* Compatibility fields */

        plan.completedTopics =
            [
                ...plan.progress.completedTopics
            ];

        plan.completedQuestionTopics =
            [
                ...plan.progress.completedQuestionTopics
            ];

        plan.studyScore =
            plan.progress.studyScore;

        plan.xp =
            plan.progress.xp;

        plan.streak =
            plan.progress.streak;


        return plan;

    }


    /* =====================================================
       SAVE PLAN
    ===================================================== */

    function savePlan(plan) {

        if (
            !plan ||
            typeof plan !== "object"
        ) {

            return false;

        }


        ensurePlanProgress(plan);


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

            plans.push(plan);

        }


        localStorage.setItem(
            KEYS.PLANS,
            JSON.stringify(plans)
        );


        localStorage.setItem(
            KEYS.PLAN,
            JSON.stringify(plan)
        );


        localStorage.setItem(
            "studyData",
            JSON.stringify(plan)
        );


        if (plan.id) {

            localStorage.setItem(
                KEYS.ACTIVE_PLAN,
                String(plan.id)
            );

        }


        return true;

    }


    /* =====================================================
       LOAD ACTIVE PLAN INTO COMPATIBILITY KEYS
    ===================================================== */

    function loadActivePlanProgress() {

        const plan =
            getActivePlan();

        if (!plan) return null;


        ensurePlanProgress(plan);


        /*
         * IMPORTANT:
         *
         * These global-looking keys are now merely
         * compatibility mirrors of the ACTIVE plan.
         */

        localStorage.setItem(
            KEYS.XP,
            String(
                plan.progress.xp
            )
        );


        localStorage.setItem(
            KEYS.STREAK,
            String(
                plan.progress.streak
            )
        );


        localStorage.setItem(
            KEYS.LONGEST_STREAK,
            String(
                plan.progress.longestStreak
            )
        );


        localStorage.setItem(
            KEYS.SCORE,
            String(
                plan.progress.studyScore
            )
        );


        writeJSON(
            KEYS.COMPLETED_TOPICS,
            plan.progress.completedTopics
        );


        writeJSON(
            KEYS.COMPLETED_QUESTIONS,
            plan.progress.completedQuestionTopics
        );


        writeJSON(
            KEYS.KNOWLEDGE_RESULTS,
            plan.progress.knowledgeCheckResults
        );


        writeJSON(
            KEYS.STREAK_ACTIVITY,
            plan.progress.streakActivity
        );


        writeJSON(
            KEYS.STUDY_HISTORY,
            plan.progress.studyHistory
        );


        writeJSON(
            KEYS.STUDY_SESSIONS,
            plan.progress.studySessions
        );


        writeJSON(
            KEYS.REWARDS_UNLOCKED,
            plan.progress.rewardsUnlocked
        );


        writeJSON(
            KEYS.REWARD_NOTIFICATIONS,
            plan.progress.rewardNotifications
        );


        localStorage.setItem(
            KEYS.REWARD_XP,
            String(
                plan.progress.rewardXP
            )
        );


        writeJSON(
            KEYS.XP_EVENTS,
            plan.progress.xpEvents
        );


        localStorage.setItem(
            KEYS.CURRENT_TOPIC_INDEX,
            String(
                plan.progress.currentTopicIndex
            )
        );


        if (
            plan.progress.currentTopic
        ) {

            localStorage.setItem(
                KEYS.CURRENT_TOPIC,
                plan.progress.currentTopic
            );

        } else {

            localStorage.removeItem(
                KEYS.CURRENT_TOPIC
            );

        }


        /*
         * Save normalized version back to the plan.
         */

        savePlan(plan);


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


        window.dispatchEvent(
            new CustomEvent(
                "studyMindProgressUpdated",
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
       SAVE COMPATIBILITY KEYS BACK INTO ACTIVE PLAN
    ===================================================== */

    function syncGlobalProgressToPlan() {

        const plan =
            getActivePlan();

        if (!plan) return null;


        ensurePlanProgress(plan);


        plan.progress.xp =
            numberValue(
                KEYS.XP,
                plan.progress.xp
            );


        plan.progress.streak =
            numberValue(
                KEYS.STREAK,
                plan.progress.streak
            );


        plan.progress.longestStreak =
            Math.max(
                plan.progress.longestStreak,
                numberValue(
                    KEYS.LONGEST_STREAK,
                    0
                )
            );


        plan.progress.studyScore =
            Math.max(
                0,
                Math.min(
                    100,
                    numberValue(
                        KEYS.SCORE,
                        plan.progress.studyScore
                    )
                )
            );


        plan.progress.completedTopics =
            readJSON(
                KEYS.COMPLETED_TOPICS,
                plan.progress.completedTopics
            );


        plan.progress.completedQuestionTopics =
            readJSON(
                KEYS.COMPLETED_QUESTIONS,
                plan.progress.completedQuestionTopics
            );


        plan.progress.knowledgeCheckResults =
            readJSON(
                KEYS.KNOWLEDGE_RESULTS,
                plan.progress.knowledgeCheckResults
            );


        plan.progress.streakActivity =
            readJSON(
                KEYS.STREAK_ACTIVITY,
                plan.progress.streakActivity
            );


        plan.progress.studyHistory =
            readJSON(
                KEYS.STUDY_HISTORY,
                plan.progress.studyHistory
            );


        plan.progress.studySessions =
            readJSON(
                KEYS.STUDY_SESSIONS,
                plan.progress.studySessions
            );


        plan.progress.rewardsUnlocked =
            readJSON(
                KEYS.REWARDS_UNLOCKED,
                plan.progress.rewardsUnlocked
            );


        plan.progress.rewardNotifications =
            readJSON(
                KEYS.REWARD_NOTIFICATIONS,
                plan.progress.rewardNotifications
            );


        plan.progress.rewardXP =
            numberValue(
                KEYS.REWARD_XP,
                plan.progress.rewardXP
            );


        plan.progress.xpEvents =
            readJSON(
                KEYS.XP_EVENTS,
                plan.progress.xpEvents
            );


        plan.progress.currentTopicIndex =
            numberValue(
                KEYS.CURRENT_TOPIC_INDEX,
                plan.progress.currentTopicIndex
            );


        plan.progress.currentTopic =
            localStorage.getItem(
                KEYS.CURRENT_TOPIC
            ) || "";


        ensurePlanProgress(plan);

        savePlan(plan);


        return plan;

    }


    /* =====================================================
       CREATE NEW PLAN PROGRESS
    ===================================================== */

    function initializeNewPlan(plan) {

        if (!plan) return null;


        plan.progress =
            createEmptyProgress();


        /*
         * Legacy compatibility fields.
         */

        plan.xp = 0;

        plan.streak = 0;

        plan.studyScore = 0;

        plan.completedTopics = [];

        plan.completedQuestionTopics = [];


        savePlan(plan);


        /*
         * This is intentionally a CLEAN PLAN.
         */

        localStorage.setItem(
            KEYS.XP,
            "0"
        );

        localStorage.setItem(
            KEYS.STREAK,
            "0"
        );

        localStorage.setItem(
            KEYS.LONGEST_STREAK,
            "0"
        );

        localStorage.setItem(
            KEYS.SCORE,
            "0"
        );


        writeJSON(
            KEYS.COMPLETED_TOPICS,
            []
        );

        writeJSON(
            KEYS.COMPLETED_QUESTIONS,
            []
        );

        writeJSON(
            KEYS.KNOWLEDGE_RESULTS,
            []
        );

        writeJSON(
            KEYS.STREAK_ACTIVITY,
            {}
        );

        writeJSON(
            KEYS.STUDY_HISTORY,
            {}
        );

        writeJSON(
            KEYS.STUDY_SESSIONS,
            []
        );

        writeJSON(
            KEYS.REWARDS_UNLOCKED,
            []
        );

        writeJSON(
            KEYS.REWARD_NOTIFICATIONS,
            []
        );

        localStorage.setItem(
            KEYS.REWARD_XP,
            "0"
        );

        writeJSON(
            KEYS.XP_EVENTS,
            {}
        );


        localStorage.removeItem(
            KEYS.CURRENT_TOPIC
        );

        localStorage.setItem(
            KEYS.CURRENT_TOPIC_INDEX,
            "0"
        );


        /*
         * Do not allow a previous plan's timer to
         * continue into the new plan.
         */

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


        window.dispatchEvent(
            new CustomEvent(
                "studyMindPlanCreated",
                {
                    detail: {
                        planId:
                            plan.id || null,

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
                            plan.id || null
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
                            plan.id || null,

                        fresh:
                            true
                    }
                }
            )
        );


        return plan;

    }


    /* =====================================================
       SWITCH PLAN
    ===================================================== */

    function switchPlan(planId) {

        if (!planId) return null;


        const plans =
            getPlans();


        const plan =
            plans.find(
                item =>
                    item &&
                    String(item.id) ===
                    String(planId)
            );


        if (!plan) {

            console.error(
                "StudyMind: Plan not found:",
                planId
            );

            return null;

        }


        localStorage.setItem(
            KEYS.ACTIVE_PLAN,
            String(plan.id)
        );


        ensurePlanProgress(plan);

        savePlan(plan);

        loadActivePlanProgress();


        /*
         * Stop a timer from another plan.
         */

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


        const selectedTimer =
            Number(
                localStorage.getItem(
                    "studyMindSelectedTimerSeconds"
                )
            ) || 25 * 60;


        localStorage.setItem(
            "studyMindTimerSeconds",
            String(
                selectedTimer
            )
        );


        window.dispatchEvent(
            new CustomEvent(
                "studyMindActivePlanChanged",
                {
                    detail: {
                        planId:
                            plan.id
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
                            plan.id
                    }
                }
            )
        );


        return plan;

    }


    /* =====================================================
       GET CURRENT PLAN PROGRESS
    ===================================================== */

    function getProgress() {

        const plan =
            getActivePlan();

        if (!plan) return null;

        ensurePlanProgress(plan);

        return plan.progress;

    }


    /* =====================================================
       LIST PLANS
    ===================================================== */

    function getAllPlans() {

        return getPlans()
            .map(
                plan =>
                    ensurePlanProgress(plan)
            )
            .filter(Boolean);

    }


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    function initialize() {

        const plans =
            getPlans();


        if (!plans.length) {

            return;

        }


        const activeId =
            getActivePlanId();


        let active =
            plans.find(
                plan =>
                    plan &&
                    String(plan.id) ===
                    String(activeId)
            );


        if (!active) {

            active =
                plans[0];

            localStorage.setItem(
                KEYS.ACTIVE_PLAN,
                String(
                    active.id
                )
            );

        }


        ensurePlanProgress(active);

        savePlan(active);

        loadActivePlanProgress();


        /*
         * Keep compatibility storage synchronized.
         * This is intentionally slower than the timer loop.
         */

        setInterval(
            () => {

                syncGlobalProgressToPlan();

            },
            1000
        );

    }


    /* =====================================================
       EVENTS
    ===================================================== */

    window.addEventListener(
        "studyMindPlanCreated",
        event => {

            const planId =
                event?.detail?.planId;

            if (!planId) return;


            const plans =
                getPlans();


            const plan =
                plans.find(
                    item =>
                        item &&
                        String(item.id) ===
                        String(planId)
                );


            if (!plan) return;


            /*
             * A plan creation event means this is
             * a completely fresh academic plan.
             */

            initializeNewPlan(plan);

        }
    );


    window.addEventListener(
        "studyMindActivePlanChanged",
        () => {

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

        syncGlobalProgressToPlan,

        saveActivePlan:
            savePlan,

        todayKey

    };


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
