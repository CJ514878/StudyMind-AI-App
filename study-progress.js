
"use strict";

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
        COMPLETED_TOPICS: "studyMindCompletedTopics",
        COMPLETED_QUESTIONS: "studyMindCompletedQuestionTopics",
        KNOWLEDGE_RESULTS: "studyMindKnowledgeCheckResults",
        TOTAL_STUDY_MINUTES: "studyMindTotalStudyMinutes",
        DAILY_STUDY_TIME: "studyMindDailyStudyTime",
        STUDY_HISTORY: "studyMindStudyHistory",
        STUDY_SESSIONS: "studyMindStudySessions",
        COMPLETED_TIMER_SESSIONS: "studyMindCompletedTimerSessions",
        CURRENT_TOPIC: "studyMindCurrentTopic",
        CURRENT_TOPIC_INDEX: "studyMindCurrentTopicIndex",
        REWARDS_UNLOCKED: "studyMindRewardsUnlocked",
        REWARD_NOTIFICATIONS: "studyMindRewardNotifications",
        REWARD_XP: "studyMindRewardXP",
        XP_EVENTS: "studyMindXPEvents",
        SCORE_BREAKDOWN: "studyMindStudyScoreBreakdown",
        SUMMARY_COUNT: "studyMindSummaryCount",
        MIGRATION: "studyMindProgressMigrationVersion"
    };

    function readJSON(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return fallback;
            return JSON.parse(raw);
        } catch {
            return fallback;
        }
    }

    function writeJSON(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error("StudyMind: Could not save", key, error);
        }
    }

    function numberValue(key, fallback = 0) {
        const raw = localStorage.getItem(key);

        /*
         * Number(null) is zero.
         * A missing key must use the supplied fallback.
         */

        if (raw === null || String(raw).trim() === "") {
            return fallback;
        }

        const value = Number(raw);
        return Number.isFinite(value) ? value : fallback;
    }

    function todayKey() {
        const date = new Date();

        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");
    }

    function clone(value) {
        try {
            return JSON.parse(JSON.stringify(value));
        } catch {
            return value;
        }
    }

    function arrayValue(key) {
        const value = readJSON(key, []);
        return Array.isArray(value) ? value : [];
    }

    function objectValue(key) {
        const value = readJSON(key, {});
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
            completedTimerSessions: 0,
            dailyStudyTime: {},

            currentTopicIndex: 0,
            currentTopic: "",

            xpEvents: {},

            rewardsUnlocked: [],
            rewardNotifications: [],
            rewardXP: 0,

            studyScoreBreakdown: {},

            aiUsage: {},
            summaryCount: 0,

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
        if (!plan || typeof plan !== "object") {
            return null;
        }

        if (!plan.progress || typeof plan.progress !== "object") {
            plan.progress = createEmptyProgress();
        }

        const defaults = createEmptyProgress();

        Object.keys(defaults).forEach(key => {
            if (
                plan.progress[key] === undefined ||
                plan.progress[key] === null
            ) {
                plan.progress[key] = clone(defaults[key]);
            }
        });

        const arrays = [
            "completedTopics",
            "completedQuestionTopics",
            "knowledgeCheckResults",
            "studySessions",
            "rewardsUnlocked",
            "rewardNotifications"
        ];

        arrays.forEach(key => {
            if (!Array.isArray(plan.progress[key])) {
                plan.progress[key] = [];
            }
        });

        const objects = [
            "streakActivity",
            "studyHistory",
            "dailyStudyTime",
            "xpEvents",
            "studyScoreBreakdown",
            "aiUsage"
        ];

        objects.forEach(key => {
            if (
                !plan.progress[key] ||
                typeof plan.progress[key] !== "object" ||
                Array.isArray(plan.progress[key])
            ) {
                plan.progress[key] = {};
            }
        });

        if (
            !plan.progress.streakSaver ||
            typeof plan.progress.streakSaver !== "object"
        ) {
            plan.progress.streakSaver = clone(defaults.streakSaver);
        } else {
            plan.progress.streakSaver = {
                available: Boolean(plan.progress.streakSaver.available),
                missedDay: plan.progress.streakSaver.missedDay || null,
                secondMissedDay:
                    plan.progress.streakSaver.secondMissedDay || null,
                used: Boolean(plan.progress.streakSaver.used)
            };
        }

        plan.progress.xp = Math.max(0, Number(plan.progress.xp) || 0);
        plan.progress.streak = Math.max(0, Number(plan.progress.streak) || 0);
        plan.progress.longestStreak =
            Math.max(0, Number(plan.progress.longestStreak) || 0);

        plan.progress.studyScore = Math.max(
            0,
            Math.min(100, Number(plan.progress.studyScore) || 0)
        );

        plan.progress.studyMinutes =
            Math.max(0, Number(plan.progress.studyMinutes) || 0);

        plan.progress.sessions =
            Math.max(0, Number(plan.progress.sessions) || 0);

        plan.progress.completedTimerSessions =
            Math.max(
                0,
                Number(plan.progress.completedTimerSessions) || 0
            );

        plan.progress.rewardXP =
            Math.max(0, Number(plan.progress.rewardXP) || 0);

        plan.progress.summaryCount =
            Math.max(0, Number(plan.progress.summaryCount) || 0);

        plan.progress.currentTopicIndex =
            Math.max(0, Number(plan.progress.currentTopicIndex) || 0);

        /* Legacy compatibility fields */

        plan.xp = plan.progress.xp;
        plan.streak = plan.progress.streak;
        plan.studyScore = plan.progress.studyScore;

        plan.completedTopics = [
            ...plan.progress.completedTopics
        ];

        plan.completedQuestionTopics = [
            ...plan.progress.completedQuestionTopics
        ];

        return plan;
    }

    /* =====================================================
       GET PLANS
    ===================================================== */

    function getPlans() {
        const plans = readJSON(KEYS.PLANS, []);
        return Array.isArray(plans) ? plans : [];
    }

    function getActivePlanId() {
        return localStorage.getItem(KEYS.ACTIVE_PLAN);
    }

    /* =====================================================
       FIND ACTIVE PLAN
    ===================================================== */

    function getActivePlan() {
        const plans = getPlans();
        const activeId = getActivePlanId();

        if (activeId) {
            const found = plans.find(
                plan =>
                    plan &&
                    String(plan.id) === String(activeId)
            );

            if (found) {
                return ensurePlanProgress(found);
            }
        }

        const legacy = readJSON(KEYS.PLAN, null);

        if (!legacy) {
            return null;
        }

        return ensurePlanProgress(legacy);
    }

    /* =====================================================
       SNAPSHOT COMPATIBILITY STORAGE INTO ONE PLAN
    ===================================================== */

    function captureCompatibilityProgress(plan) {
        if (!plan) {
            return null;
        }

        ensurePlanProgress(plan);

        const progress = plan.progress;

        progress.xp = Math.max(
            0,
            numberValue(KEYS.XP, progress.xp)
        );

        progress.streak = Math.max(
            0,
            numberValue(KEYS.STREAK, progress.streak)
        );

        progress.longestStreak = Math.max(
            progress.longestStreak,
            numberValue(KEYS.LONGEST_STREAK, 0)
        );

        progress.studyScore = Math.max(
            0,
            Math.min(
                100,
                numberValue(KEYS.SCORE, progress.studyScore)
            )
        );

        progress.studyMinutes = Math.max(
            0,
            numberValue(KEYS.TOTAL_STUDY_MINUTES, progress.studyMinutes)
        );

        progress.completedTopics =
            arrayValue(KEYS.COMPLETED_TOPICS);

        progress.completedQuestionTopics =
            arrayValue(KEYS.COMPLETED_QUESTIONS);

        progress.knowledgeCheckResults =
            arrayValue(KEYS.KNOWLEDGE_RESULTS);

        progress.streakActivity =
            objectValue(KEYS.STREAK_ACTIVITY);

        progress.studyHistory =
            objectValue(KEYS.STUDY_HISTORY);

        progress.dailyStudyTime =
            objectValue(KEYS.DAILY_STUDY_TIME);

        progress.studySessions =
            arrayValue(KEYS.STUDY_SESSIONS);

        progress.completedTimerSessions = Math.max(
            0,
            numberValue(
                KEYS.COMPLETED_TIMER_SESSIONS,
                progress.completedTimerSessions
            )
        );

        progress.sessions = Math.max(
            progress.sessions,
            progress.studySessions.length
        );

        progress.currentTopic =
            localStorage.getItem(KEYS.CURRENT_TOPIC) || "";

        progress.currentTopicIndex = Math.max(
            0,
            numberValue(
                KEYS.CURRENT_TOPIC_INDEX,
                progress.currentTopicIndex
            )
        );

        progress.rewardsUnlocked =
            arrayValue(KEYS.REWARDS_UNLOCKED);

        progress.rewardNotifications =
            arrayValue(KEYS.REWARD_NOTIFICATIONS);

        progress.rewardXP = Math.max(
            0,
            numberValue(KEYS.REWARD_XP, progress.rewardXP)
        );

        progress.xpEvents =
            objectValue(KEYS.XP_EVENTS);

        progress.studyScoreBreakdown =
            objectValue(KEYS.SCORE_BREAKDOWN);

        progress.summaryCount = Math.max(
            0,
            numberValue(KEYS.SUMMARY_COUNT, progress.summaryCount)
        );

        const storedAIUsage = readJSON(
            "studyMindAIUsage",
            null
        );

        if (
            storedAIUsage &&
            typeof storedAIUsage === "object"
        ) {
            progress.aiUsage = clone(storedAIUsage);
        }

        plan.xp = progress.xp;
        plan.streak = progress.streak;
        plan.studyScore = progress.studyScore;

        plan.completedTopics = [
            ...progress.completedTopics
        ];

        plan.completedQuestionTopics = [
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
                JSON.stringify(plans)
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

        ensurePlanProgress(plan);

        let plans = getPlans();

        const index = plans.findIndex(
            item =>
                item &&
                String(item.id) === String(plan.id)
        );

        if (index >= 0) {
            plans[index] = plan;
        } else {
            plans.push(plan);
        }

        return writePlans(plans);
    }

    /* =====================================================
       LOAD PLAN PROGRESS INTO COMPATIBILITY STORAGE
    ===================================================== */

    function loadPlanProgressIntoStorage(plan) {
        if (!plan) {
            return null;
        }

        ensurePlanProgress(plan);

        const progress = plan.progress;

        /*
         * XP is plan-specific.
         * Total XP is account-wide and must not be reset here.
         */

        localStorage.setItem(
            KEYS.XP,
            String(progress.xp)
        );

        /*
         * These values are account-wide:
         * - studyMindTotalXP
         * - studyMindStreak
         * - studyMindLongestStreak
         * - studyMindStreakActivity
         *
         * streak.js owns streak storage.
         * Timer and reward systems own account-wide total XP.
         *
         * Do not overwrite these values when loading a plan.
         */

        localStorage.setItem(
            KEYS.SCORE,
            String(progress.studyScore)
        );

        localStorage.setItem(
            KEYS.TOTAL_STUDY_MINUTES,
            String(progress.studyMinutes)
        );

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

        /*
         * Account-wide streak activity is owned by streak.js.
         * Do not replace it with a plan snapshot.
         */

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
            String(progress.completedTimerSessions)
        );

        /* CURRENT TOPIC */

        if (progress.currentTopic) {
            localStorage.setItem(
                KEYS.CURRENT_TOPIC,
                progress.currentTopic
            );
        } else {
            localStorage.removeItem(KEYS.CURRENT_TOPIC);
        }

        localStorage.setItem(
            KEYS.CURRENT_TOPIC_INDEX,
            String(progress.currentTopicIndex)
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
            String(progress.rewardXP)
        );

        /*
         * XP event ledger is shared across the account.
         * Do not replace it with an older plan snapshot.
         */

        writeJSON(
            KEYS.SCORE_BREAKDOWN,
            progress.studyScoreBreakdown
        );

        localStorage.setItem(
            KEYS.SUMMARY_COUNT,
            String(progress.summaryCount)
        );

        writeJSON(
            "studyMindAIUsage",
            progress.aiUsage || {}
        );

        /* LEGACY PLAN OBJECT */

        plan.xp = progress.xp;
        plan.streak = progress.streak;
        plan.studyScore = progress.studyScore;

        plan.completedTopics = [
            ...progress.completedTopics
        ];

        plan.completedQuestionTopics = [
            ...progress.completedQuestionTopics
        ];

        localStorage.setItem(
            KEYS.PLAN,
            JSON.stringify(plan)
        );

        localStorage.setItem(
            "studyData",
            JSON.stringify(plan)
        );

        return plan;
    }

    /* =====================================================
       SAVE ACTIVE PLAN PROGRESS
    ===================================================== */

    function saveActivePlanProgress() {
        const activeId = getActivePlanId();

        if (!activeId) {
            return null;
        }

        const plans = getPlans();

        const index = plans.findIndex(
            plan =>
                plan &&
                String(plan.id) === String(activeId)
        );

        if (index === -1) {
            return null;
        }

        const activePlan = plans[index];

        captureCompatibilityProgress(activePlan);
        ensurePlanProgress(activePlan);

        plans[index] = activePlan;

        writePlans(plans);

        localStorage.setItem(
            KEYS.PLAN,
            JSON.stringify(activePlan)
        );

        localStorage.setItem(
            "studyData",
            JSON.stringify(activePlan)
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

        const plans = getPlans();

        const targetIndex = plans.findIndex(
            plan =>
                plan &&
                String(plan.id) === String(planId)
        );

        if (targetIndex === -1) {
            console.error(
                "StudyMind: Plan not found:",
                planId
            );

            return null;
        }

        const currentId = getActivePlanId();

        /*
         * Save the OLD active plan FIRST.
         */

        if (
            currentId &&
            String(currentId) !== String(planId)
        ) {
            saveActivePlanProgress();
        }

        const refreshedPlans = getPlans();

        const target = refreshedPlans.find(
            plan =>
                plan &&
                String(plan.id) === String(planId)
        );

        if (!target) {
            return null;
        }

        ensurePlanProgress(target);

        localStorage.setItem(
            KEYS.ACTIVE_PLAN,
            String(target.id)
        );

        loadPlanProgressIntoStorage(target);

        const finalPlans = getPlans();

        const finalIndex = finalPlans.findIndex(
            plan =>
                plan &&
                String(plan.id) === String(target.id)
        );

        if (finalIndex >= 0) {
            finalPlans[finalIndex] = target;
            writePlans(finalPlans);
        }

        stopTimerForPlanSwitch();

        window.dispatchEvent(
            new CustomEvent(
                "studyMindActivePlanChanged",
                {
                    detail: {
                        planId: target.id,
                        plan: target
                    }
                }
            )
        );

        window.dispatchEvent(
            new CustomEvent(
                "studyMindProgressUpdated",
                {
                    detail: {
                        planId: target.id
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
            ) || 25 * 60;

        localStorage.setItem(
            "studyMindTimerSeconds",
            String(selected)
        );
    }

    /* =====================================================
       INITIALIZE NEW PLAN
    ===================================================== */

    function initializeNewPlan(plan) {
        if (!plan) {
            return null;
        }

        /*
         * A new plan receives clean plan-specific progress.
         * Account-wide total XP and streak data are preserved.
         */

        plan.progress = createEmptyProgress();

        plan.xp = 0;
        plan.streak = 0;
        plan.studyScore = 0;
        plan.completedTopics = [];
        plan.completedQuestionTopics = [];

        ensurePlanProgress(plan);

        let plans = getPlans();

        const index = plans.findIndex(
            item =>
                item &&
                String(item.id) === String(plan.id)
        );

        if (index >= 0) {
            plans[index] = plan;
        } else {
            plans.push(plan);
        }

        writePlans(plans);

        localStorage.setItem(
            KEYS.ACTIVE_PLAN,
            String(plan.id)
        );

        loadPlanProgressIntoStorage(plan);

        stopTimerForPlanSwitch();

        window.dispatchEvent(
            new CustomEvent(
                "studyMindPlanCreated",
                {
                    detail: {
                        planId: plan.id,
                        newPlan: true
                    }
                }
            )
        );

        window.dispatchEvent(
            new CustomEvent(
                "studyMindActivePlanChanged",
                {
                    detail: {
                        planId: plan.id,
                        fresh: true
                    }
                }
            )
        );

        window.dispatchEvent(
            new CustomEvent(
                "studyMindProgressUpdated",
                {
                    detail: {
                        planId: plan.id,
                        fresh: true
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
        const plan = getActivePlan();

        if (!plan) {
            return null;
        }

        ensurePlanProgress(plan);

        return plan.progress;
    }

    /* =====================================================
       GET ALL PLANS
    ===================================================== */

    function getAllPlans() {
        return getPlans()
            .map(plan => ensurePlanProgress(plan))
            .filter(Boolean);
    }

    /* =====================================================
       INITIAL MIGRATION
    ===================================================== */

    function migrateLegacyProgress() {
        const migration = localStorage.getItem(KEYS.MIGRATION);

        if (migration === "2") {
            return;
        }

        let plans = getPlans();

        /*
         * If no plans array exists, migrate the legacy plan.
         */

        if (!plans.length) {
            const legacy = readJSON(KEYS.PLAN, null);

            if (legacy) {
                ensurePlanProgress(legacy);

                const hasLegacyProgress =
                    numberValue(KEYS.XP, 0) > 0 ||
                    numberValue(KEYS.STREAK, 0) > 0 ||
                    numberValue(KEYS.SCORE, 0) > 0 ||
                    arrayValue(KEYS.COMPLETED_TOPICS).length > 0 ||
                    numberValue(KEYS.TOTAL_STUDY_MINUTES, 0) > 0;

                if (hasLegacyProgress) {
                    captureCompatibilityProgress(legacy);
                }

                plans = [legacy];

                writePlans(plans);

                if (legacy.id) {
                    localStorage.setItem(
                        KEYS.ACTIVE_PLAN,
                        String(legacy.id)
                    );
                }
            }
        }

        /*
         * If plans already exist, identify the active plan.
         */

        if (plans.length) {
            let active = plans.find(
                plan =>
                    plan &&
                    String(plan.id) === String(getActivePlanId())
            );

            if (!active) {
                active = plans[0];

                if (active && active.id) {
                    localStorage.setItem(
                        KEYS.ACTIVE_PLAN,
                        String(active.id)
                    );
                }
            }

            if (active) {
                ensurePlanProgress(active);

                /*
                 * Older plan records may have progress fields
                 * while compatibility keys contain the actual
                 * older user data.
                 */

                const progressLooksEmpty =
                    Number(active.progress.xp) === 0 &&
                    Number(active.progress.streak) === 0 &&
                    Number(active.progress.studyScore) === 0 &&
                    Number(active.progress.studyMinutes) === 0 &&
                    active.progress.completedTopics.length === 0;

                const legacyHasData =
                    numberValue(KEYS.XP, 0) > 0 ||
                    numberValue(KEYS.STREAK, 0) > 0 ||
                    numberValue(KEYS.SCORE, 0) > 0 ||
                    numberValue(KEYS.TOTAL_STUDY_MINUTES, 0) > 0 ||
                    arrayValue(KEYS.COMPLETED_TOPICS).length > 0;

                if (progressLooksEmpty && legacyHasData) {
                    captureCompatibilityProgress(active);

                    const activeIndex = plans.findIndex(
                        item =>
                            item &&
                            String(item.id) === String(active.id)
                    );

                    if (activeIndex >= 0) {
                        plans[activeIndex] = active;
                    }

                    writePlans(plans);
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

        const plans = getPlans();

        if (!plans.length) {
            return;
        }

        let active = plans.find(
            plan =>
                plan &&
                String(plan.id) === String(getActivePlanId())
        );

        if (!active) {
            active = plans[0];

            if (active && active.id) {
                localStorage.setItem(
                    KEYS.ACTIVE_PLAN,
                    String(active.id)
                );
            }
        }

        if (!active) {
            return;
        }

        ensurePlanProgress(active);

        loadPlanProgressIntoStorage(active);

        /*
         * Save normalized plan without copying compatibility
         * values back into it again.
         */

        const normalizedPlans = getPlans();

        const index = normalizedPlans.findIndex(
            plan =>
                plan &&
                String(plan.id) === String(active.id)
        );

        if (index >= 0) {
            normalizedPlans[index] = active;
            writePlans(normalizedPlans);
        }

        /*
         * Other modules continue using compatibility keys.
         * This engine saves those changes into the active plan.
         */

        setInterval(() => {
            saveActivePlanProgress();
        }, 1000);
    }

    /* =====================================================
       EVENTS
    ===================================================== */

    window.addEventListener(
        "studyMindActivePlanChanged",
        event => {
            const planId = event?.detail?.planId;

            if (
                planId &&
                String(planId) !== String(getActivePlanId())
            ) {
                localStorage.setItem(
                    KEYS.ACTIVE_PLAN,
                    String(planId)
                );
            }

            loadActivePlanProgress();
        }
    );

    window.addEventListener(
        "storage",
        event => {
            if (event.key === KEYS.ACTIVE_PLAN) {
                loadActivePlanProgress();
            }
        }
    );

    /* =====================================================
       LOAD ACTIVE PLAN
    ===================================================== */

    function loadActivePlanProgress() {
        const plan = getActivePlan();

        if (!plan) {
            return null;
        }

        ensurePlanProgress(plan);

        loadPlanProgressIntoStorage(plan);

        const plans = getPlans();

        const index = plans.findIndex(
            item =>
                item &&
                String(item.id) === String(plan.id)
        );

        if (index >= 0) {
            plans[index] = plan;
            writePlans(plans);
        }

        window.dispatchEvent(
            new CustomEvent(
                "studyMindProgressLoaded",
                {
                    detail: {
                        planId: plan.id || null
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
        getPlans: getAllPlans,
        getActivePlan,
        getActivePlanId,
        getProgress,
        ensureProgress: ensurePlanProgress,
        createEmptyProgress,
        initializeNewPlan,
        switchPlan,
        loadActivePlanProgress,
        syncGlobalProgressToPlan: saveActivePlanProgress,
        saveActivePlan: saveActivePlanProgress,
        savePlan: savePlanObject,
        captureCompatibilityProgress,
        loadPlanProgressIntoStorage,
        todayKey
    };

    /* =====================================================
       START
    ===================================================== */

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );
    } else {
        initialize();
    }
})();
