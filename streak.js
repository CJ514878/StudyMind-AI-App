"use strict";

/* =========================================================
   STUDYMIND AI — ACCOUNT-WIDE STREAK ENGINE
   ---------------------------------------------------------
   FEATURES:
       - Account-wide current and longest streak
       - Streak freeze rewards every 49 days
       - Automatic freeze protection
       - Persistent streak increase notifications
       - Persistent streak loss notifications
       - Persistent study-day completion notifications
       - Daily and milestone XP
       - Weekly and calendar rendering
       - Existing StudyMind public API compatibility

   Milo celebrations and loss animations:
       milo-celebrating.js
       milo-streak-loss.js

   Calendar celebration:
       streak-celebration.js
========================================================= */


/* =========================================================
   STORAGE KEYS
========================================================= */

const STREAK_KEYS = {
    COMPLETED: "studyMindCompletedTopics",
    ACTIVITY: "studyMindStreakActivity",
    CURRENT: "studyMindStreak",
    BEST: "studyMindLongestStreak",
    LAST_COMPLETED: "studyMindLastCompletedPlanDate",
    PLAN: "studyMindPlan",
    XP: "studyMindXP",
    USERNAME: "studyMindUsername",
    FREEZES: "studyMindStreakFreezes",
    FREEZE_DATES: "studyMindStreakFreezeDates",
    FREEZE_REWARDS: "studyMindStreakFreezeRewards",
    PENDING_CELEBRATION: "studyMindPendingStreakCelebration",
    PENDING_LOSS: "studyMindPendingStreakLoss",
    PENDING_STUDY_DAY: "studyMindPendingStudyDayCelebration",
    INITIALIZED: "studyMindStreakEngineInitialized"
};


/* =========================================================
   STREAK-FREEZE SETTINGS
========================================================= */

const STREAK_FREEZE_SETTINGS = {
    REWARD_INTERVAL: 49,
    AUTOMATIC_USE: true
};


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", initStreak);


function initStreak() {

    migrateActivityFormat();

    initializeFreezeStorage();

    /*
       IMPORTANT:
       Establish a baseline before synchronization.

       This prevents existing users from receiving a false
       streak-increase popup when the engine is first installed.
    */

    initializeStreakBaseline();

    syncStreakFromActivity();

    renderEverything();

    loadUser();

    setupLogout();


    /* Cross-tab synchronization. */

    window.addEventListener("storage", event => {

        const watchedKeys = [
            STREAK_KEYS.COMPLETED,
            STREAK_KEYS.ACTIVITY,
            STREAK_KEYS.CURRENT,
            STREAK_KEYS.BEST,
            STREAK_KEYS.XP,
            STREAK_KEYS.FREEZES,
            STREAK_KEYS.FREEZE_DATES,
            STREAK_KEYS.FREEZE_REWARDS
        ];

        if (
            watchedKeys.includes(event.key) ||
            event.key === null
        ) {

            migrateActivityFormat();

            initializeFreezeStorage();

            syncStreakFromActivity();

            renderEverything();

        }

    });


    /* Same-page synchronization. */

    window.addEventListener(
        "studyMindStreakUpdated",
        event => {

            const detail = event?.detail || {};

            if (detail.source === "streak-engine") {
                renderEverything();
                return;
            }

            syncStreakFromActivity();

            renderEverything();

        }
    );


    /*
       Keep the streak display synchronized.
       XP rewards are protected by the unique event ledger.
    */

    setInterval(() => {

        migrateActivityFormat();

        initializeFreezeStorage();

        syncStreakFromActivity();

        renderEverything();

    }, 2000);

}


/* =========================================================
   STORAGE HELPERS
========================================================= */

function readJSON(key, fallback) {

    try {

        const value = localStorage.getItem(key);

        if (!value) {
            return fallback;
        }

        return JSON.parse(value);

    } catch (error) {

        console.warn(
            "StudyMind storage read failed:",
            key,
            error
        );

        return fallback;

    }

}


function writeJSON(key, value) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

        return true;

    } catch (error) {

        console.warn(
            "StudyMind storage write failed:",
            key,
            error
        );

        return false;

    }

}


/* =========================================================
   INITIAL STREAK BASELINE
========================================================= */

function initializeStreakBaseline() {

    const initialized =
        localStorage.getItem(STREAK_KEYS.INITIALIZED);

    if (initialized === "true") {
        return;
    }

    const currentExists =
        localStorage.getItem(STREAK_KEYS.CURRENT) !== null;

    const bestExists =
        localStorage.getItem(STREAK_KEYS.BEST) !== null;

    /*
       Calculate existing streak data without generating
       increase or loss notifications.
    */

    const current = calculateCurrentStreak();

    const best = Math.max(
        calculateLongestStreak(),
        Number(
            localStorage.getItem(STREAK_KEYS.BEST) || 0
        )
    );

    if (!currentExists) {

        localStorage.setItem(
            STREAK_KEYS.CURRENT,
            String(current)
        );

    }

    if (!bestExists) {

        localStorage.setItem(
            STREAK_KEYS.BEST,
            String(best)
        );

    }

    localStorage.setItem(
        STREAK_KEYS.INITIALIZED,
        "true"
    );

    console.log(
        "StudyMind streak baseline initialized:",
        {
            current,
            best
        }
    );

}


/* =========================================================
   FREEZE STORAGE INITIALIZATION
========================================================= */

function initializeFreezeStorage() {

    const count = Number(
        localStorage.getItem(STREAK_KEYS.FREEZES)
    );

    if (
        !Number.isFinite(count) ||
        count < 0
    ) {

        localStorage.setItem(
            STREAK_KEYS.FREEZES,
            "0"
        );

    }

    const dates = readJSON(
        STREAK_KEYS.FREEZE_DATES,
        []
    );

    if (!Array.isArray(dates)) {
        writeJSON(STREAK_KEYS.FREEZE_DATES, []);
    }

    const rewards = readJSON(
        STREAK_KEYS.FREEZE_REWARDS,
        []
    );

    if (!Array.isArray(rewards)) {
        writeJSON(STREAK_KEYS.FREEZE_REWARDS, []);
    }

}


/* =========================================================
   FREEZE INVENTORY
========================================================= */

function getStreakFreezeCount() {

    return Math.max(
        0,
        Number(
            localStorage.getItem(
                STREAK_KEYS.FREEZES
            ) || 0
        )
    );

}


function setStreakFreezeCount(count) {

    const safeCount = Math.max(
        0,
        Math.floor(Number(count) || 0)
    );

    localStorage.setItem(
        STREAK_KEYS.FREEZES,
        String(safeCount)
    );

    window.dispatchEvent(
        new CustomEvent(
            "studyMindStreakFreezesUpdated",
            {
                detail: {
                    freezes: safeCount
                }
            }
        )
    );

    return safeCount;

}


function getStreakFreezeDates() {

    const dates = readJSON(
        STREAK_KEYS.FREEZE_DATES,
        []
    );

    return Array.isArray(dates) ? dates : [];

}


/* =========================================================
   FREEZE REWARDS
========================================================= */

function getFreezeRewardMilestones() {

    const rewards = readJSON(
        STREAK_KEYS.FREEZE_REWARDS,
        []
    );

    return Array.isArray(rewards) ? rewards : [];

}


function awardStreakFreeze(streak) {

    const interval =
        STREAK_FREEZE_SETTINGS.REWARD_INTERVAL;

    if (streak < interval) {
        return false;
    }

    const milestone =
        Math.floor(streak / interval) * interval;

    const rewards = getFreezeRewardMilestones();

    if (rewards.includes(milestone)) {
        return false;
    }

    /*
       Record the reward before dispatching events.
       This prevents duplicate rewards.
    */

    rewards.push(milestone);

    writeJSON(
        STREAK_KEYS.FREEZE_REWARDS,
        rewards
    );

    const newCount =
        getStreakFreezeCount() + 1;

    setStreakFreezeCount(newCount);

    window.dispatchEvent(
        new CustomEvent(
            "studyMindStreakFreezeEarned",
            {
                detail: {
                    freezes: newCount,
                    milestone,
                    message:
                        `You earned a streak freeze for reaching ${milestone} days!`
                }
            }
        )
    );

    console.log(
        `StudyMind: streak freeze earned at ${milestone} days.`
    );

    return true;

}


/*
   Check every milestone reached.

   Also handles users who had a long streak before
   this updated streak engine was installed.
*/

function checkFreezeRewards(streak) {

    const interval =
        STREAK_FREEZE_SETTINGS.REWARD_INTERVAL;

    const rewards = getFreezeRewardMilestones();

    const highestMilestone =
        Math.floor(Math.max(0, streak) / interval) * interval;

    for (
        let milestone = interval;
        milestone <= highestMilestone;
        milestone += interval
    ) {

        if (rewards.includes(milestone)) {
            continue;
        }

        awardStreakFreeze(milestone);

    }

}


/* =========================================================
   ACTIVITY FORMAT MIGRATION
========================================================= */

function migrateActivityFormat() {

    const raw = localStorage.getItem(
        STREAK_KEYS.ACTIVITY
    );

    if (!raw) {
        return {};
    }

    let parsed;

    try {

        parsed = JSON.parse(raw);

    } catch (error) {

        console.warn(
            "Invalid streak activity. Resetting safely.",
            error
        );

        writeJSON(STREAK_KEYS.ACTIVITY, {});

        return {};

    }

    const activity = {};

    /* Object format. */

    if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
    ) {

        Object.entries(parsed).forEach(([key, value]) => {

            if (
                value !== true &&
                value !== 1 &&
                value !== "true"
            ) {
                return;
            }

            if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
                activity[key] = true;
            }

        });

    }

    /* Older array format. */

    if (Array.isArray(parsed)) {

        parsed.forEach(item => {

            if (typeof item === "string") {

                const key = item.slice(0, 10);

                if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
                    activity[key] = true;
                }

                return;

            }

            if (
                item &&
                typeof item === "object"
            ) {

                const possibleDate =
                    item.date ||
                    item.day ||
                    item.completedDate ||
                    item.completedAt ||
                    item.timestamp;

                if (!possibleDate) {
                    return;
                }

                const key = String(possibleDate).slice(0, 10);

                if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
                    activity[key] = true;
                }

            }

        });

    }

    const normalized = JSON.stringify(activity);

    if (normalized !== raw) {
        writeJSON(STREAK_KEYS.ACTIVITY, activity);
    }

    return activity;

}


/* =========================================================
   DATE HELPERS
========================================================= */

function todayKey(date = new Date()) {

    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


function dateFromKey(key) {

    if (
        typeof key !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(key)
    ) {
        return null;
    }

    const [year, month, day] =
        key.split("-").map(Number);

    return new Date(
        year,
        month - 1,
        day
    );

}


function addDays(date, amount) {

    const result = new Date(date);

    result.setHours(0, 0, 0, 0);

    result.setDate(
        result.getDate() + amount
    );

    return result;

}


/* =========================================================
   COMPLETED TOPICS
========================================================= */

function getCompletedTopics() {

    const completed = readJSON(
        STREAK_KEYS.COMPLETED,
        []
    );

    if (Array.isArray(completed)) {
        return completed;
    }

    if (
        completed &&
        typeof completed === "object"
    ) {
        return Object.values(completed).flat();
    }

    return [];

}


/* =========================================================
   ACTIVITY
========================================================= */

function getActivity() {

    return migrateActivityFormat();

}


function getActivityDays(activity = getActivity()) {

    return Object.keys(activity)
        .filter(date => activity[date] === true)
        .filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date))
        .sort();

}


/* =========================================================
   COMBINED STREAK DAYS
========================================================= */

function getCombinedStreakDays() {

    const activityDays = getActivityDays();

    const freezeDates = getStreakFreezeDates();

    return [
        ...new Set([
            ...activityDays,
            ...freezeDates
        ])
    ].sort();

}


/* =========================================================
   AUTOMATIC FREEZE PROTECTION
========================================================= */

function applyPendingStreakFreeze() {

    if (!STREAK_FREEZE_SETTINGS.AUTOMATIC_USE) {
        return false;
    }

    const freezeCount = getStreakFreezeCount();

    if (freezeCount <= 0) {
        return false;
    }

    const activity = getActivity();

    const freezeDates = getStreakFreezeDates();

    const today = new Date();

    const isProtected = dateKey =>
        activity[dateKey] === true ||
        freezeDates.includes(dateKey);

    /*
       Start with yesterday.
       Never protect today.
    */

    const missingDates = [];

    let checkDate = addDays(today, -1);

    /*
       Find consecutive missed days until we reach
       an actual study day or an already protected day.
    */

    while (!isProtected(todayKey(checkDate))) {

        missingDates.push(todayKey(checkDate));

        checkDate = addDays(checkDate, -1);

        /*
           Safety limit.
        */

        if (missingDates.length >= 365) {
            return false;
        }

    }

    if (missingDates.length === 0) {
        return false;
    }

    /*
       Only protect the gap if enough freezes exist
       to cover every missed day.

       This avoids consuming freezes without actually
       preserving the consecutive streak.
    */

    if (freezeCount < missingDates.length) {
        return false;
    }

    const updatedDates = [
        ...new Set([
            ...freezeDates,
            ...missingDates
        ])
    ];

    writeJSON(
        STREAK_KEYS.FREEZE_DATES,
        updatedDates
    );

    setStreakFreezeCount(
        freezeCount - missingDates.length
    );

    missingDates.forEach(date => {

        window.dispatchEvent(
            new CustomEvent(
                "studyMindStreakFreezeUsed",
                {
                    detail: {
                        date,
                        freezesRemaining:
                            getStreakFreezeCount(),
                        message:
                            "Your streak freeze protected your streak!"
                    }
                }
            )
        );

    });

    console.log(
        "StudyMind: protected missed days:",
        missingDates
    );

    return true;

}


/* =========================================================
   CURRENT STREAK
========================================================= */

function calculateCurrentStreak() {

    const days = getCombinedStreakDays();

    if (!days.length) {
        return 0;
    }

    const daySet = new Set(days);

    const today = todayKey();

    let currentDate = new Date();

    /*
       If today has not been completed, yesterday may
       still keep the streak alive.
    */

    if (!daySet.has(today)) {
        currentDate = addDays(currentDate, -1);
    }

    let streak = 0;

    while (daySet.has(todayKey(currentDate))) {

        streak++;

        currentDate = addDays(currentDate, -1);

    }

    return streak;

}


/* =========================================================
   LONGEST STREAK
========================================================= */

function calculateLongestStreak() {

    const days = getCombinedStreakDays();

    if (!days.length) {
        return 0;
    }

    let longest = 1;

    let current = 1;

    for (let i = 1; i < days.length; i++) {

        const previous = dateFromKey(days[i - 1]);

        const currentDate = dateFromKey(days[i]);

        if (!previous || !currentDate) {
            current = 1;
            continue;
        }

        const difference = Math.round(
            (currentDate - previous) / 86400000
        );

        if (difference === 1) {
            current++;
        } else {
            current = 1;
        }

        longest = Math.max(longest, current);

    }

    return longest;

}


/* =========================================================
   PERSISTENT STREAK NOTIFICATIONS
========================================================= */

function savePendingStreakCelebration(
    previousStreak,
    currentStreak,
    eventId
) {

    const pending = {
        eventId,
        previousStreak,
        streak: currentStreak,
        currentStreak,
        createdAt: new Date().toISOString()
    };

    try {

        localStorage.setItem(
            STREAK_KEYS.PENDING_CELEBRATION,
            JSON.stringify(pending)
        );

        return true;

    } catch (error) {

        console.warn(
            "Could not save pending streak celebration:",
            error
        );

        return false;

    }

}


function savePendingStreakLoss(
    previousStreak,
    currentStreak,
    eventId
) {

    const pending = {
        eventId,
        previousStreak,
        oldStreak: previousStreak,
        streak: currentStreak,
        currentStreak,
        createdAt: new Date().toISOString()
    };

    try {

        localStorage.setItem(
            STREAK_KEYS.PENDING_LOSS,
            JSON.stringify(pending)
        );

        return true;

    } catch (error) {

        console.warn(
            "Could not save pending streak loss:",
            error
        );

        return false;

    }

}


/* =========================================================
   PERSISTENT STUDY-DAY NOTIFICATION
========================================================= */

function savePendingStudyDayCelebration(
    streak,
    date,
    eventId
) {

    const pending = {
        eventId,
        date,
        streak,
        currentStreak: streak,
        dayCompleted: true,
        studyDayCompleted: true,
        createdAt: new Date().toISOString()
    };

    try {

        localStorage.setItem(
            STREAK_KEYS.PENDING_STUDY_DAY,
            JSON.stringify(pending)
        );

        return true;

    } catch (error) {

        console.warn(
            "Could not save pending study-day celebration:",
            error
        );

        return false;

    }

}


/* =========================================================
   STREAK INCREASE
========================================================= */

function dispatchStreakIncrease(
    previousStreak,
    currentStreak
) {

    if (currentStreak <= previousStreak) {
        return;
    }

    const date = todayKey();

    const eventId =
        `streak-increase-${date}-${previousStreak}-${currentStreak}`;

    savePendingStreakCelebration(
        previousStreak,
        currentStreak,
        eventId
    );

    window.dispatchEvent(
        new CustomEvent(
            "studyMindStreakIncreased",
            {
                detail: {
                    eventId,
                    date,
                    previousStreak,
                    streak: currentStreak,
                    currentStreak,
                    source: "streak-engine"
                }
            }
        )
    );

}


/* =========================================================
   STREAK LOSS
========================================================= */

function dispatchStreakLoss(
    previousStreak,
    currentStreak
) {

    if (
        previousStreak <= 0 ||
        currentStreak >= previousStreak
    ) {
        return;
    }

    const date = todayKey();

    const eventId =
        `streak-loss-${date}-${previousStreak}-${currentStreak}`;

    savePendingStreakLoss(
        previousStreak,
        currentStreak,
        eventId
    );

    window.dispatchEvent(
        new CustomEvent(
            "studyMindStreakLost",
            {
                detail: {
                    eventId,
                    date,
                    previousStreak,
                    oldStreak: previousStreak,
                    streak: currentStreak,
                    currentStreak,
                    source: "streak-engine",
                    protected: false,
                    freezeApplied: false,
                    streakLost: true
                }
            }
        )
    );

}


/* =========================================================
   STREAK UPDATED
========================================================= */

function dispatchStreakUpdated(date, stats) {

    window.dispatchEvent(
        new CustomEvent(
            "studyMindStreakUpdated",
            {
                detail: {
                    date,
                    streak: stats.current,
                    currentStreak: stats.current,
                    longestStreak: stats.best,
                    freezes: getStreakFreezeCount(),
                    source: "streak-engine"
                }
            }
        )
    );

}


/* =========================================================
   STUDY DAY COMPLETED
========================================================= */

function dispatchStudyDayCompleted(streak) {

    const date = todayKey();

    const eventId =
        `study-day-completed-${date}`;

    /*
       Save the notification BEFORE dispatching the event.

       This allows streak-celebration.js to recover the
       calendar celebration after the user navigates
       to another page.
    */

    savePendingStudyDayCelebration(
        streak,
        date,
        eventId
    );

    window.dispatchEvent(
        new CustomEvent(
            "studyMindStudyDayCompleted",
            {
                detail: {
                    eventId,
                    streak,
                    currentStreak: streak,
                    dayCompleted: true,
                    studyDayCompleted: true,
                    date,
                    source: "study-day-complete"
                }
            }
        )
    );

}


/* =========================================================
   SYNCHRONIZE STREAK
========================================================= */

function syncStreakFromActivity() {

    /*
       Protect eligible missed days BEFORE calculating
       the current streak or dispatching a loss event.
    */

    applyPendingStreakFreeze();

    const calculatedCurrent =
        calculateCurrentStreak();

    const calculatedBest =
        calculateLongestStreak();

    const storedCurrent = Number(
        localStorage.getItem(STREAK_KEYS.CURRENT) || 0
    );

    const storedBest = Number(
        localStorage.getItem(STREAK_KEYS.BEST) || 0
    );

    /*
       Detect changes before updating stored values.
    */

    if (calculatedCurrent > storedCurrent) {

        dispatchStreakIncrease(
            storedCurrent,
            calculatedCurrent
        );

    }

    if (calculatedCurrent < storedCurrent) {

        dispatchStreakLoss(
            storedCurrent,
            calculatedCurrent
        );

    }

    const best = Math.max(
        calculatedBest,
        storedBest
    );

    localStorage.setItem(
        STREAK_KEYS.CURRENT,
        String(calculatedCurrent)
    );

    localStorage.setItem(
        STREAK_KEYS.BEST,
        String(best)
    );

    checkFreezeRewards(
        Math.max(
            calculatedCurrent,
            calculatedBest,
            storedBest,
            best
        )
    );

    return {
        current: calculatedCurrent,
        best,
        freezes: getStreakFreezeCount()
    };

}


/* =========================================================
   PLAN TOPICS
========================================================= */

function getAllPlanTopics() {

    const plan = readJSON(
        STREAK_KEYS.PLAN,
        null
    );

    if (!plan) {
        return [];
    }

    const topics = [];

    if (Array.isArray(plan.subjects)) {

        plan.subjects.forEach(subject => {

            if (!Array.isArray(subject?.topics)) {
                return;
            }

            subject.topics.forEach(topic => {

                const name =
                    typeof topic === "string"
                        ? topic
                        : (
                            topic?.name ||
                            topic?.title ||
                            topic?.topic ||
                            ""
                        );

                if (name) {

                    topics.push({
                        subject:
                            subject.name ||
                            subject.subject ||
                            "",
                        topic: String(name).trim()
                    });

                }

            });

        });

    }

    /* Older compatibility format. */

    if (
        !topics.length &&
        Array.isArray(plan.topics)
    ) {

        plan.topics.forEach(topic => {

            if (typeof topic === "string") {

                topics.push({
                    subject: "",
                    topic: topic.trim()
                });

                return;

            }

            const name =
                topic?.name ||
                topic?.title ||
                topic?.topic ||
                "";

            if (name) {

                topics.push({
                    subject: topic.subject || "",
                    topic: String(name).trim()
                });

            }

        });

    }

    return topics;

}


/* =========================================================
   TOPIC MATCHING
========================================================= */

function topicMatchesCompleted(
    subject,
    topic,
    completed
) {

    const exact = `${subject}::${topic}`;

    if (
        completed.includes(exact) ||
        completed.includes(topic)
    ) {
        return true;
    }

    return completed.some(item => {

        if (
            typeof item !== "object" ||
            !item
        ) {
            return false;
        }

        const itemTopic = String(
            item.topic ||
            item.name ||
            item.title ||
            ""
        ).trim();

        const itemSubject = String(
            item.subject || ""
        ).trim();

        return (
            itemTopic === topic &&
            (
                !subject ||
                !itemSubject ||
                itemSubject === subject
            )
        );

    });

}


/* =========================================================
   TODAY'S SCHEDULE
========================================================= */

function getTodaySchedule() {

    const plan = readJSON(
        STREAK_KEYS.PLAN,
        null
    );

    if (
        !plan ||
        !Array.isArray(plan.schedule)
    ) {
        return null;
    }

    const today = todayKey();

    return (
        plan.schedule.find(
            item =>
                String(item?.date || "").slice(0, 10) === today
        ) || null
    );

}


/* =========================================================
   TODAY'S REQUIRED TOPICS
========================================================= */

function getTodaysRequiredTopics() {

    const day = getTodaySchedule();

    if (day) {

        const topics = [];

        if (Array.isArray(day.sessions)) {

            day.sessions.forEach(session => {

                const type = String(
                    session?.type || ""
                ).toLowerCase();

                if (
                    type === "break" ||
                    type === "rest"
                ) {
                    return;
                }

                const subject = String(
                    session?.subject || ""
                ).trim();

                const topic = String(
                    session?.topic ||
                    session?.name ||
                    session?.title ||
                    ""
                ).trim();

                if (topic) {

                    topics.push({
                        subject,
                        topic
                    });

                }

            });

        }

        return topics;

    }

    return getAllPlanTopics();

}


/* =========================================================
   TODAY'S PROGRESS
========================================================= */

function getTodayProgressData() {

    const required = getTodaysRequiredTopics();

    const completed = getCompletedTopics();

    const completedToday = required.filter(item =>
        topicMatchesCompleted(
            item.subject,
            item.topic,
            completed
        )
    );

    const total = required.length;

    const completedCount = completedToday.length;

    const progress = total > 0
        ? Math.round(completedCount / total * 100)
        : 0;

    return {
        completed: completedCount,
        total,
        progress,
        complete:
            total > 0 &&
            completedCount >= total,
        required,
        completedTopics: completedToday
    };

}


/* =========================================================
   CHECK TODAY'S COMPLETION
========================================================= */

function checkTodayCompletion() {

    const data = getTodayProgressData();

    console.log(
        "StudyMind today's completion:",
        data
    );

    if (!data.complete) {
        return false;
    }

    const today = todayKey();

    const lastCompleted = localStorage.getItem(
        STREAK_KEYS.LAST_COMPLETED
    );

    if (lastCompleted === today) {
        return true;
    }

    recordCompletedStudyDay();

    return true;

}


/* =========================================================
   RECORD COMPLETED STUDY DAY
========================================================= */

function recordCompletedStudyDay() {

    const today = todayKey();

    const activity = getActivity();

    /*
       Prevent duplicate daily rewards and celebrations.
    */

    if (activity[today] === true) {

        localStorage.setItem(
            STREAK_KEYS.LAST_COMPLETED,
            today
        );

        syncStreakFromActivity();

        return false;

    }

    /*
       Record today's actual study activity.
    */

    activity[today] = true;

    writeJSON(
        STREAK_KEYS.ACTIVITY,
        activity
    );

    localStorage.setItem(
        STREAK_KEYS.LAST_COMPLETED,
        today
    );

    const previousStreak = Number(
        localStorage.getItem(STREAK_KEYS.CURRENT) || 0
    );

    const stats = syncStreakFromActivity();

    /* Daily XP. */

    awardXPOnce(
        `daily-${today}`,
        10,
        "completed study day"
    );

    /* Seven-day milestone XP. */

    if (
        stats.current > 0 &&
        stats.current % 7 === 0
    ) {

        awardXPOnce(
            `weekly-${stats.current}`,
            50,
            `${stats.current}-day streak`
        );

    }

    /* Ten-day milestone XP. */

    if (
        stats.current > 0 &&
        stats.current % 10 === 0
    ) {

        awardXPOnce(
            `ten-day-${stats.current}`,
            100,
            `${stats.current}-day milestone`
        );

    }

    checkStreakGoal(stats.current);

    if (stats.current > previousStreak) {

        console.log(
            `StudyMind streak increased: ${previousStreak} → ${stats.current}`
        );

    }

    /*
       Dispatch the persistent study-day notification.
       The calendar celebration can recover it on another page.
    */

    dispatchStudyDayCompleted(stats.current);

    dispatchStreakUpdated(
        today,
        stats
    );

    return true;

}


/* =========================================================
   XP EVENT LEDGER
========================================================= */

function getXPEvents() {

    return readJSON(
        "studyMindXPEvents",
        {}
    );

}


function awardXPOnce(
    eventId,
    amount,
    reason
) {

    const events = getXPEvents();

    if (events[eventId]) {
        return false;
    }

    events[eventId] = {
        amount,
        reason,
        date: new Date().toISOString()
    };

    writeJSON(
        "studyMindXPEvents",
        events
    );

    const currentXP = Number(
        localStorage.getItem(STREAK_KEYS.XP) || 0
    );

    const newXP = currentXP + Math.max(
        0,
        Number(amount) || 0
    );

    localStorage.setItem(
        STREAK_KEYS.XP,
        String(newXP)
    );

    window.dispatchEvent(
        new CustomEvent(
            "studyMindXPUpdated",
            {
                detail: {
                    amount,
                    total: newXP,
                    reason
                }
            }
        )
    );

    return true;

}


/* =========================================================
   STREAK GOALS
========================================================= */

function getStreakGoal() {

    return Number(
        localStorage.getItem(
            "studyMindStreakGoal"
        ) || 0
    );

}


function checkStreakGoal(streak) {

    const goal = getStreakGoal();

    if (
        !goal ||
        streak < goal
    ) {
        return;
    }

    const rewardKey =
        `studyMindStreakGoalRewarded:${goal}`;

    if (
        localStorage.getItem(rewardKey) === "true"
    ) {
        return;
    }

    localStorage.setItem(
        rewardKey,
        "true"
    );

    awardXPOnce(
        `goal-${goal}`,
        goal * 2,
        `${goal}-day streak goal`
    );

}


/* =========================================================
   WEEKLY STUDY DAYS
========================================================= */

function getWeeklyDays() {

    const activity = getActivity();

    const today = new Date();

    const day = today.getDay();

    const mondayOffset = day === 0
        ? -6
        : 1 - day;

    const monday = addDays(
        today,
        mondayOffset
    );

    let count = 0;

    for (let i = 0; i < 7; i++) {

        const date = addDays(monday, i);

        if (activity[todayKey(date)] === true) {
            count++;
        }

    }

    return count;

}


/* =========================================================
   RENDER EVERYTHING
========================================================= */

function renderEverything() {

    const stats = syncStreakFromActivity();

    const activity = getActivity();

    const days = getActivityDays(activity);

    const weekly = getWeeklyDays();

    setText("currentStreak", stats.current);

    setText("longestStreak", stats.best);

    setText("totalStudyDays", days.length);

    setText("weeklyStudyDays", weekly);

    setText("weekProgress", `${weekly} / 7`);

    setText(
        "streakFreezeCount",
        getStreakFreezeCount()
    );

    renderMessages(stats.current);

    renderWeek(activity);

    renderCalendar(activity);

    renderPlanStatus();

    renderTodayProgress();

}


/* =========================================================
   TODAY PROGRESS UI
========================================================= */

function renderTodayProgress() {

    const data = getTodayProgressData();

    setText("todayCompleted", data.completed);

    setText("todayTotal", data.total);

    setText("todayProgress", `${data.progress}%`);

    const progressBar = document.getElementById(
        "todayProgressBar"
    );

    if (progressBar) {
        progressBar.style.width = `${data.progress}%`;
    }

}


/* =========================================================
   STREAK MESSAGES
========================================================= */

function renderMessages(streak) {

    let message =
        "Complete today's study work to start your streak.";

    let hero =
        "Every completed study day moves you forward.";

    if (streak === 1) {

        message =
            "Great start! 🔥 Come back tomorrow.";

        hero =
            "You've started your streak. Keep it going!";

    } else if (streak > 1) {

        message =
            `${streak} consecutive study days. Keep going! 🔥`;

        hero =
            `You're on a ${streak}-day streak!`;

    }

    setText("streakMessage", message);

    setText("heroMessage", hero);

}


/* =========================================================
   WEEK VIEW
========================================================= */

function renderWeek(activity = getActivity()) {

    const container = document.getElementById("weekGrid");

    if (!container) {
        return;
    }

    const freezeDates = getStreakFreezeDates();

    const today = new Date();

    const day = today.getDay();

    const mondayOffset = day === 0
        ? -6
        : 1 - day;

    const monday = addDays(
        today,
        mondayOffset
    );

    let html = "";

    for (let i = 0; i < 7; i++) {

        const date = addDays(monday, i);

        const key = todayKey(date);

        const studied = activity[key] === true;

        const frozen = freezeDates.includes(key);

        const isToday = key === todayKey();

        const dayName = date.toLocaleDateString(
            undefined,
            {
                weekday: "short"
            }
        );

        const symbol = studied
            ? "🔥"
            : frozen
                ? "❄️"
                : "•";

        html += `
            <div class="week-day">

                <div class="week-name">
                    ${dayName}
                </div>

                <div
                    class="
                        week-box
                        ${studied ? "studied" : ""}
                        ${frozen ? "streak-freeze-used" : ""}
                        ${isToday ? "today" : ""}
                    "
                    title="${
                        frozen
                            ? "Streak freeze used"
                            : studied
                                ? "Study day completed"
                                : "No study activity"
                    }"
                >
                    ${symbol}
                </div>

                <div class="week-date">
                    ${date.getDate()}
                </div>

            </div>
        `;

    }

    container.innerHTML = html;

}


/* =========================================================
   CALENDAR
========================================================= */

function renderCalendar(activity = getActivity()) {

    const container = document.getElementById(
        "calendarGrid"
    );

    if (!container) {
        return;
    }

    const freezeDates = getStreakFreezeDates();

    const now = new Date();

    const year = now.getFullYear();

    const month = now.getMonth();

    const firstDay = new Date(
        year,
        month,
        1
    );

    const lastDay = new Date(
        year,
        month + 1,
        0
    );

    const startingDay = firstDay.getDay();

    const totalDays = lastDay.getDate();

    setText(
        "calendarTitle",
        now.toLocaleDateString(
            undefined,
            {
                month: "long",
                year: "numeric"
            }
        )
    );

    let html = "";

    for (let i = 0; i < startingDay; i++) {

        html += `
            <div class="calendar-day empty"></div>
        `;

    }

    for (let day = 1; day <= totalDays; day++) {

        const date = new Date(
            year,
            month,
            day
        );

        const key = todayKey(date);

        const studied = activity[key] === true;

        const frozen = freezeDates.includes(key);

        const isToday = key === todayKey();

        html += `
            <div
                class="
                    calendar-day
                    ${studied ? "studied" : ""}
                    ${frozen ? "streak-freeze-used" : ""}
                    ${isToday ? "today" : ""}
                "
                title="${
                    frozen
                        ? "Streak freeze used"
                        : studied
                            ? "Study day completed"
                            : ""
                }"
            >

                <div class="calendar-number">
                    ${day}
                </div>

                <div class="calendar-dot">
                    ${frozen ? "❄️" : ""}
                </div>

            </div>
        `;

    }

    container.innerHTML = html;

}


/* =========================================================
   PLAN STATUS
========================================================= */

function renderPlanStatus() {

    const plan = readJSON(
        STREAK_KEYS.PLAN,
        null
    );

    const completed = getCompletedTopics();

    let total = 0;

    if (Array.isArray(plan?.subjects)) {

        plan.subjects.forEach(subject => {

            if (Array.isArray(subject?.topics)) {
                total += subject.topics.length;
            }

        });

    }

    if (
        total === 0 &&
        Array.isArray(plan?.topics)
    ) {
        total = plan.topics.length;
    }

    const completedCount = completed.length;

    setText(
        "completionTitle",
        total > 0 && completedCount >= total
            ? "Study plan completed! 🎉"
            : total
                ? `${Math.max(
                    0,
                    total - completedCount
                )} topic${
                    total - completedCount === 1
                        ? ""
                        : "s"
                } remaining`
                : "Keep pushing forward"
    );

    setText(
        "completionText",
        total
            ? `${completedCount} of ${total} topics completed.`
            : "Complete your study topics to make progress."
    );

}


/* =========================================================
   USER
========================================================= */

async function loadUser() {

    let name = localStorage.getItem(
        STREAK_KEYS.USERNAME
    );

    try {

        if (window.supabaseClient?.auth) {

            const { data } = await window
                .supabaseClient
                .auth
                .getUser();

            const user = data?.user;

            if (user) {

                name =
                    user.user_metadata?.full_name ||
                    user.user_metadata?.name ||
                    user.user_metadata?.username ||
                    user.email?.split("@")[0] ||
                    name ||
                    "Student";

            }

        }

    } catch (error) {

        console.warn(
            "StudyMind user loading failed:",
            error
        );

    }

    name = name || "Student";

    localStorage.setItem(
        STREAK_KEYS.USERNAME,
        name
    );

    setText("usernameDisplay", name);

    setText(
        "userAvatar",
        name.charAt(0).toUpperCase()
    );

}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    document
        .getElementById("logoutButton")
        ?.addEventListener(
            "click",
            async () => {

                try {

                    if (window.supabaseClient?.auth) {

                        await window
                            .supabaseClient
                            .auth
                            .signOut();

                    }

                } catch (error) {

                    console.warn(
                        "Logout failed:",
                        error
                    );

                }

                window.location.href = "home.html";

            }
        );

}


/* =========================================================
   DOM HELPER
========================================================= */

function setText(id, value) {

    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }

}


/* =========================================================
   COMPATIBILITY FUNCTION
========================================================= */

function recordStudyActivity() {

    /*
       Starting or running a timer does NOT automatically
       complete the day's required study plan.

       Today's required topics must be completed before
       the study day is recorded.
    */

    return checkTodayCompletion();

}


/* =========================================================
   PUBLIC API
========================================================= */

window.StudyMindStreak = {

    recordStudyActivity,

    checkTodayCompletion,

    recordCompletedStudyDay,

    calculateCurrentStreak,

    calculateLongestStreak,

    getActivityDays,

    getActivity,

    getTodayProgressData,

    getTodaysRequiredTopics,

    syncStreakFromActivity,

    getStreakFreezeCount,

    getStreakFreezeDates,

    getCombinedStreakDays,

    awardStreakFreeze,

    applyPendingStreakFreeze,

    refresh: renderEverything

};


console.log(
    "StudyMind AI — Account-wide streak engine ready."
);
