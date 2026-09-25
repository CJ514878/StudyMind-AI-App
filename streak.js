"use strict";

/* =========================================================
   STUDYMIND AI — ACCOUNT-WIDE STREAK ENGINE
   ---------------------------------------------------------
   Streak is GLOBAL to the account.

   Study plans may have separate progress, XP, study time,
   completed topics, etc.

   BUT:

       studyMindStreak
       studyMindLongestStreak
       studyMindStreakActivity

   remain account-wide.

   Milo celebration/loss systems are handled separately by:

       milo-celebrating.js
       milo-streak-loss.js
       streak-celebration.js

   This file ONLY manages the streak engine and events.
========================================================= */


const STREAK_KEYS = {

    COMPLETED:
        "studyMindCompletedTopics",

    ACTIVITY:
        "studyMindStreakActivity",

    CURRENT:
        "studyMindStreak",

    BEST:
        "studyMindLongestStreak",

    LAST_COMPLETED:
        "studyMindLastCompletedPlanDate",

    PLAN:
        "studyMindPlan",

    XP:
        "studyMindXP",

    USERNAME:
        "studyMindUsername"

};


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initStreak
);


function initStreak() {

    /*
       Normalize old activity data first.
    */

    migrateActivityFormat();


    /*
       Synchronize the streak.

       This also detects whether the streak increased
       or was lost since the last known value.
    */

    syncStreakFromActivity();


    renderEverything();


    loadUser();


    setupLogout();


    /*
       Cross-page/localStorage synchronization.
    */

    window.addEventListener(
        "storage",
        event => {

            if (
                event.key === STREAK_KEYS.COMPLETED ||
                event.key === STREAK_KEYS.ACTIVITY ||
                event.key === STREAK_KEYS.CURRENT ||
                event.key === STREAK_KEYS.BEST ||
                event.key === STREAK_KEYS.XP
            ) {

                migrateActivityFormat();

                syncStreakFromActivity();

                renderEverything();

            }

        }
    );


    /*
       Same-page updates.

       Ignore our own streak update event here.
       We still refresh the display when another system
       changes streak activity.
    */

    window.addEventListener(
        "studyMindStreakUpdated",
        event => {

            const detail =
                event && event.detail
                    ? event.detail
                    : {};


            /*
               Dedicated event already came from this engine.

               We don't need to create another increase/loss
               event here.
            */

            if (
                detail.source ===
                "streak-engine"
            ) {

                renderEverything();

                return;

            }


            syncStreakFromActivity();

            renderEverything();

        }
    );


    /*
       Keep the streak UI synchronized.

       This is intentionally lightweight.
    */

    setInterval(
        () => {

            migrateActivityFormat();

            syncStreakFromActivity();

            renderEverything();

        },
        2000
    );

}


/* =========================================================
   STORAGE
========================================================= */

function readJSON(
    key,
    fallback
) {

    try {

        const value =
            localStorage.getItem(key);


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


function writeJSON(
    key,
    value
) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

    } catch (error) {

        console.warn(
            "StudyMind storage write failed:",
            key,
            error
        );

    }

}


/* =========================================================
   ACTIVITY FORMAT MIGRATION
========================================================= */

function migrateActivityFormat() {

    const raw =
        localStorage.getItem(
            STREAK_KEYS.ACTIVITY
        );


    if (!raw) {

        return {};

    }


    let parsed;


    try {

        parsed =
            JSON.parse(raw);

    } catch (error) {

        console.warn(
            "StudyMind streak activity was invalid JSON. Resetting safely.",
            error
        );


        const empty = {};


        writeJSON(
            STREAK_KEYS.ACTIVITY,
            empty
        );


        return empty;

    }


    const activity = {};


    /*
       CURRENT OBJECT FORMAT
    */

    if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
    ) {

        Object.entries(parsed).forEach(
            ([key, value]) => {

                if (
                    value !== true &&
                    value !== 1 &&
                    value !== "true"
                ) {

                    return;

                }


                if (
                    /^\d{4}-\d{2}-\d{2}$/.test(key)
                ) {

                    activity[key] = true;

                }

            }
        );

    }


    /*
       ARRAY FORMAT
    */

    if (
        Array.isArray(parsed)
    ) {

        parsed.forEach(
            item => {

                if (
                    typeof item === "string"
                ) {

                    const key =
                        item.slice(0, 10);


                    if (
                        /^\d{4}-\d{2}-\d{2}$/.test(key)
                    ) {

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


                    const key =
                        String(
                            possibleDate
                        ).slice(0, 10);


                    if (
                        /^\d{4}-\d{2}-\d{2}$/.test(key)
                    ) {

                        activity[key] = true;

                    }

                }

            }
        );

    }


    const normalized =
        JSON.stringify(activity);


    if (
        normalized !== raw
    ) {

        writeJSON(
            STREAK_KEYS.ACTIVITY,
            activity
        );

    }


    return activity;

}


/* =========================================================
   DATES
========================================================= */

function todayKey(
    date = new Date()
) {

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


function dateFromKey(
    key
) {

    if (
        typeof key !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(key)
    ) {

        return null;

    }


    const [
        year,
        month,
        day
    ] =
        key.split("-").map(Number);


    return new Date(
        year,
        month - 1,
        day
    );

}


function addDays(
    date,
    amount
) {

    const result =
        new Date(date);


    result.setHours(
        0,
        0,
        0,
        0
    );


    result.setDate(
        result.getDate() + amount
    );


    return result;

}


/* =========================================================
   COMPLETED TOPICS
========================================================= */

function getCompletedTopics() {

    const completed =
        readJSON(
            STREAK_KEYS.COMPLETED,
            []
        );


    if (
        Array.isArray(completed)
    ) {

        return completed;

    }


    if (
        completed &&
        typeof completed === "object"
    ) {

        return Object.values(
            completed
        ).flat();

    }


    return [];

}


/* =========================================================
   ACTIVITY
========================================================= */

function getActivity() {

    return migrateActivityFormat();

}


/* =========================================================
   ACTIVITY DAYS
========================================================= */

function getActivityDays(
    activity = getActivity()
) {

    return Object.keys(activity)
        .filter(
            date =>
                activity[date] === true
        )
        .filter(
            date =>
                /^\d{4}-\d{2}-\d{2}$/.test(date)
        )
        .sort();

}


/* =========================================================
   CURRENT STREAK
========================================================= */

function calculateCurrentStreak(
    activity = getActivity()
) {

    const days =
        getActivityDays(
            activity
        );


    if (!days.length) {

        return 0;

    }


    const daySet =
        new Set(days);


    const today =
        todayKey();


    let currentDate =
        new Date();


    /*
       If today hasn't been completed yet,
       yesterday may still keep the streak alive.
    */

    if (
        !daySet.has(today)
    ) {

        currentDate =
            addDays(
                currentDate,
                -1
            );

    }


    let streak = 0;


    while (
        daySet.has(
            todayKey(currentDate)
        )
    ) {

        streak++;


        currentDate =
            addDays(
                currentDate,
                -1
            );

    }


    return streak;

}


/* =========================================================
   LONGEST STREAK
========================================================= */

function calculateLongestStreak(
    activity = getActivity()
) {

    const days =
        getActivityDays(
            activity
        );


    if (!days.length) {

        return 0;

    }


    let longest = 1;
    let current = 1;


    for (
        let i = 1;
        i < days.length;
        i++
    ) {

        const previous =
            dateFromKey(
                days[i - 1]
            );


        const currentDate =
            dateFromKey(
                days[i]
            );


        if (
            !previous ||
            !currentDate
        ) {

            current = 1;

            continue;

        }


        const difference =
            Math.round(
                (
                    currentDate -
                    previous
                ) / 86400000
            );


        if (
            difference === 1
        ) {

            current++;

        } else {

            current = 1;

        }


        longest =
            Math.max(
                longest,
                current
            );

    }


    return longest;

}


/* =========================================================
   STREAK EVENT HELPERS
========================================================= */

function dispatchStreakIncrease(
    previousStreak,
    currentStreak
) {

    if (
        currentStreak <= previousStreak
    ) {

        return;

    }


    window.dispatchEvent(
        new CustomEvent(
            "studyMindStreakIncreased",
            {
                detail: {

                    previousStreak,

                    streak:
                        currentStreak,

                    currentStreak,

                    source:
                        "streak-engine"

                }
            }
        )
    );

}


/* ---------------------------------------------------------
   STREAK LOSS
--------------------------------------------------------- */

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


    window.dispatchEvent(
        new CustomEvent(
            "studyMindStreakLost",
            {
                detail: {

                    previousStreak,

                    oldStreak:
                        previousStreak,

                    streak:
                        currentStreak,

                    currentStreak,

                    source:
                        "streak-engine"

                }
            }
        )
    );

}


/* ---------------------------------------------------------
   GENERAL STREAK UPDATE
--------------------------------------------------------- */

function dispatchStreakUpdated(
    date,
    stats
) {

    window.dispatchEvent(
        new CustomEvent(
            "studyMindStreakUpdated",
            {
                detail: {

                    date,

                    streak:
                        stats.current,

                    currentStreak:
                        stats.current,

                    longestStreak:
                        stats.best,

                    source:
                        "streak-engine"

                }
            }
        )
    );

}


/* ---------------------------------------------------------
   STUDY DAY COMPLETED
--------------------------------------------------------- */

function dispatchStudyDayCompleted(
    streak
) {

    window.dispatchEvent(
        new CustomEvent(
            "studyMindStudyDayCompleted",
            {
                detail: {

                    streak,

                    currentStreak:
                        streak,

                    dayCompleted:
                        true,

                    studyDayCompleted:
                        true,

                    source:
                        "study-day-complete"

                }
            }
        )
    );

}


/* =========================================================
   SYNC CURRENT STREAK
========================================================= */

function syncStreakFromActivity() {

    const activity =
        getActivity();


    const calculatedCurrent =
        calculateCurrentStreak(
            activity
        );


    const calculatedBest =
        calculateLongestStreak(
            activity
        );


    const storedCurrent =
        Number(
            localStorage.getItem(
                STREAK_KEYS.CURRENT
            ) || 0
        );


    const storedBest =
        Number(
            localStorage.getItem(
                STREAK_KEYS.BEST
            ) || 0
        );


    /*
       IMPORTANT:

       Detect transitions BEFORE overwriting the stored
       current streak.
    */

    if (
        calculatedCurrent >
        storedCurrent
    ) {

        dispatchStreakIncrease(
            storedCurrent,
            calculatedCurrent
        );

    }


    if (
        calculatedCurrent <
        storedCurrent
    ) {

        dispatchStreakLoss(
            storedCurrent,
            calculatedCurrent
        );

    }


    const best =
        Math.max(
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


    return {

        current:
            calculatedCurrent,

        best

    };

}


/* =========================================================
   PLAN TOPICS
========================================================= */

function getAllPlanTopics() {

    const plan =
        readJSON(
            STREAK_KEYS.PLAN,
            null
        );


    if (!plan) {

        return [];

    }


    const topics = [];


    /*
       Modern format:
       plan.subjects[].topics[]
    */

    if (
        Array.isArray(plan.subjects)
    ) {

        plan.subjects.forEach(
            subject => {

                if (
                    !Array.isArray(
                        subject?.topics
                    )
                ) {

                    return;

                }


                subject.topics.forEach(
                    topic => {

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

                                topic:
                                    String(
                                        name
                                    ).trim()

                            });

                        }

                    }
                );

            }
        );

    }


    /*
       Compatibility format.
    */

    if (
        !topics.length &&
        Array.isArray(plan.topics)
    ) {

        plan.topics.forEach(
            topic => {

                if (
                    typeof topic === "string"
                ) {

                    topics.push({

                        subject: "",

                        topic:
                            topic.trim()

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

                        subject:
                            topic.subject ||
                            "",

                        topic:
                            String(
                                name
                            ).trim()

                    });

                }

            }
        );

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

    const exact =
        `${subject}::${topic}`;


    if (
        completed.includes(exact)
    ) {

        return true;

    }


    if (
        completed.includes(topic)
    ) {

        return true;

    }


    return completed.some(
        item => {

            if (
                typeof item !== "object" ||
                !item
            ) {

                return false;

            }


            const itemTopic =
                String(
                    item.topic ||
                    item.name ||
                    item.title ||
                    ""
                ).trim();


            const itemSubject =
                String(
                    item.subject ||
                    ""
                ).trim();


            return (
                itemTopic === topic &&
                (
                    !subject ||
                    !itemSubject ||
                    itemSubject === subject
                )
            );

        }
    );

}


/* =========================================================
   TODAY'S SCHEDULE
========================================================= */

function getTodaySchedule() {

    const plan =
        readJSON(
            STREAK_KEYS.PLAN,
            null
        );


    if (
        !plan ||
        !Array.isArray(
            plan.schedule
        )
    ) {

        return null;

    }


    const today =
        todayKey();


    return (
        plan.schedule.find(
            item =>
                String(
                    item?.date || ""
                ).slice(0, 10) === today
        ) ||
        null
    );

}


/* =========================================================
   TODAY'S REQUIRED TOPICS
========================================================= */

function getTodaysRequiredTopics() {

    const day =
        getTodaySchedule();


    /*
       Scheduled day.
    */

    if (day) {

        const topics = [];


        if (
            Array.isArray(
                day.sessions
            )
        ) {

            day.sessions.forEach(
                session => {

                    const type =
                        String(
                            session?.type || ""
                        ).toLowerCase();


                    if (
                        type === "break" ||
                        type === "rest"
                    ) {

                        return;

                    }


                    const subject =
                        String(
                            session?.subject ||
                            ""
                        ).trim();


                    const topic =
                        String(
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

                }
            );

        }


        return topics;

    }


    /*
       Older plans without schedules.
    */

    return getAllPlanTopics();

}


/* =========================================================
   TODAY PROGRESS
========================================================= */

function getTodayProgressData() {

    const required =
        getTodaysRequiredTopics();


    const completed =
        getCompletedTopics();


    const completedToday =
        required.filter(
            item =>
                topicMatchesCompleted(
                    item.subject,
                    item.topic,
                    completed
                )
        );


    const total =
        required.length;


    const completedCount =
        completedToday.length;


    const progress =
        total > 0
            ? Math.round(
                (
                    completedCount /
                    total
                ) * 100
            )
            : 0;


    return {

        completed:
            completedCount,

        total,

        progress,

        complete:
            total > 0 &&
            completedCount >= total,

        required,

        completedTopics:
            completedToday

    };

}


/* =========================================================
   COMPLETE TODAY
========================================================= */

function checkTodayCompletion() {

    const data =
        getTodayProgressData();


    console.log(
        "StudyMind today's completion:",
        data
    );


    if (
        !data.complete
    ) {

        return false;

    }


    const today =
        todayKey();


    const lastCompleted =
        localStorage.getItem(
            STREAK_KEYS.LAST_COMPLETED
        );


    /*
       Already completed today.

       Do NOT fire another celebration.
    */

    if (
        lastCompleted === today
    ) {

        return true;

    }


    recordCompletedStudyDay();

    return true;

}


/* =========================================================
   RECORD COMPLETED STUDY DAY
========================================================= */

function recordCompletedStudyDay() {

    const today =
        todayKey();


    const activity =
        getActivity();


    /*
       Already recorded.

       Do not award XP or trigger celebrations again.
    */

    if (
        activity[today] === true
    ) {

        localStorage.setItem(
            STREAK_KEYS.LAST_COMPLETED,
            today
        );


        syncStreakFromActivity();


        return false;

    }


    /*
       Mark today as completed.
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


    /*
       Capture the old streak BEFORE syncing.
    */

    const previousStreak =
        Number(
            localStorage.getItem(
                STREAK_KEYS.CURRENT
            ) || 0
        );


    /*
       Calculate the new streak.
    */

    const stats =
        syncStreakFromActivity();


    /*
       Daily XP.
    */

    awardXPOnce(
        `daily-${today}`,
        10,
        "completed study day"
    );


    /*
       Weekly milestone.
    */

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


    /*
       Ten-day milestone.
    */

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


    /*
       Streak goal.
    */

    checkStreakGoal(
        stats.current
    );


    /*
       -----------------------------------------------------
       STREAK INCREASE
       -----------------------------------------------------

       syncStreakFromActivity() already dispatches the
       dedicated increase event.

       This extra condition is only here for debugging.
    */

    if (
        stats.current >
        previousStreak
    ) {

        console.log(
            `StudyMind streak increased: ${previousStreak} → ${stats.current}`
        );

    }


    /*
       -----------------------------------------------------
       STUDY DAY COMPLETED
       -----------------------------------------------------

       This triggers the calendar celebration.
    */

    dispatchStudyDayCompleted(
        stats.current
    );


    /*
       General update event for the rest of StudyMind.
    */

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

    const events =
        getXPEvents();


    if (
        events[eventId]
    ) {

        return false;

    }


    events[eventId] = {

        amount,

        reason,

        date:
            new Date().toISOString()

    };


    writeJSON(
        "studyMindXPEvents",
        events
    );


    const currentXP =
        Number(
            localStorage.getItem(
                STREAK_KEYS.XP
            ) || 0
        );


    const newXP =
        currentXP +
        Math.max(
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

                    total:
                        newXP,

                    reason

                }
            }
        )
    );


    return true;

}


/* =========================================================
   STREAK GOAL
========================================================= */

function getStreakGoal() {

    return Number(
        localStorage.getItem(
            "studyMindStreakGoal"
        ) || 0
    );

}


function checkStreakGoal(
    streak
) {

    const goal =
        getStreakGoal();


    if (
        !goal ||
        streak < goal
    ) {

        return;

    }


    const rewardKey =
        `studyMindStreakGoalRewarded:${goal}`;


    if (
        localStorage.getItem(
            rewardKey
        ) === "true"
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
   WEEKLY
========================================================= */

function getWeeklyDays() {

    const activity =
        getActivity();


    const today =
        new Date();


    const day =
        today.getDay();


    const mondayOffset =
        day === 0
            ? -6
            : 1 - day;


    const monday =
        addDays(
            today,
            mondayOffset
        );


    let count = 0;


    for (
        let i = 0;
        i < 7;
        i++
    ) {

        const date =
            addDays(
                monday,
                i
            );


        if (
            activity[
                todayKey(date)
            ] === true
        ) {

            count++;

        }

    }


    return count;

}


/* =========================================================
   RENDER
========================================================= */

function renderEverything() {

    const stats =
        syncStreakFromActivity();


    const activity =
        getActivity();


    const days =
        getActivityDays(
            activity
        );


    const weekly =
        getWeeklyDays();


    setText(
        "currentStreak",
        stats.current
    );


    setText(
        "longestStreak",
        stats.best
    );


    setText(
        "totalStudyDays",
        days.length
    );


    setText(
        "weeklyStudyDays",
        weekly
    );


    setText(
        "weekProgress",
        `${weekly} / 7`
    );


    renderMessages(
        stats.current
    );


    renderWeek(
        activity
    );


    renderCalendar(
        activity
    );


    renderPlanStatus();


    renderTodayProgress();

}


/* =========================================================
   TODAY PROGRESS UI
========================================================= */

function renderTodayProgress() {

    const data =
        getTodayProgressData();


    setText(
        "todayCompleted",
        data.completed
    );


    setText(
        "todayTotal",
        data.total
    );


    setText(
        "todayProgress",
        `${data.progress}%`
    );


    const progressBar =
        document.getElementById(
            "todayProgressBar"
        );


    if (progressBar) {

        progressBar.style.width =
            `${data.progress}%`;

    }

}


/* =========================================================
   MESSAGES
========================================================= */

function renderMessages(
    streak
) {

    let message =
        "Complete today's study work to start your streak.";


    let hero =
        "Every completed study day moves you forward.";


    if (
        streak === 1
    ) {

        message =
            "Great start! 🔥 Come back tomorrow.";


        hero =
            "You've started your streak. Keep it going!";

    }


    else if (
        streak > 1
    ) {

        message =
            `${streak} consecutive study days. Keep going! 🔥`;


        hero =
            `You're on a ${streak}-day streak!`;

    }


    setText(
        "streakMessage",
        message
    );


    setText(
        "heroMessage",
        hero
    );

}


/* =========================================================
   WEEK VIEW
========================================================= */

function renderWeek(
    activity = getActivity()
) {

    const container =
        document.getElementById(
            "weekGrid"
        );


    if (!container) {

        return;

    }


    const today =
        new Date();


    const day =
        today.getDay();


    const mondayOffset =
        day === 0
            ? -6
            : 1 - day;


    const monday =
        addDays(
            today,
            mondayOffset
        );


    let html = "";


    for (
        let i = 0;
        i < 7;
        i++
    ) {

        const date =
            addDays(
                monday,
                i
            );


        const key =
            todayKey(date);


        const studied =
            activity[key] === true;


        const isToday =
            key === todayKey();


        const dayName =
            date.toLocaleDateString(
                undefined,
                {
                    weekday: "short"
                }
            );


        html += `

            <div class="week-day">

                <div class="week-name">
                    ${dayName}
                </div>

                <div
                    class="
                        week-box
                        ${studied ? "studied" : ""}
                        ${isToday ? "today" : ""}
                    "
                >
                    ${studied ? "🔥" : "•"}
                </div>

                <div class="week-date">
                    ${date.getDate()}
                </div>

            </div>

        `;

    }


    container.innerHTML =
        html;

}


/* =========================================================
   CALENDAR
========================================================= */

function renderCalendar(
    activity = getActivity()
) {

    const container =
        document.getElementById(
            "calendarGrid"
        );


    if (!container) {

        return;

    }


    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        now.getMonth();


    const firstDay =
        new Date(
            year,
            month,
            1
        );


    const lastDay =
        new Date(
            year,
            month + 1,
            0
        );


    const startingDay =
        firstDay.getDay();


    const totalDays =
        lastDay.getDate();


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


    for (
        let i = 0;
        i < startingDay;
        i++
    ) {

        html +=
            `<div class="calendar-day empty"></div>`;

    }


    for (
        let day = 1;
        day <= totalDays;
        day++
    ) {

        const date =
            new Date(
                year,
                month,
                day
            );


        const key =
            todayKey(date);


        const studied =
            activity[key] === true;


        const isToday =
            key === todayKey();


        html += `

            <div
                class="
                    calendar-day
                    ${studied ? "studied" : ""}
                    ${isToday ? "today" : ""}
                "
            >

                <div class="calendar-number">
                    ${day}
                </div>

                <div class="calendar-dot"></div>

            </div>

        `;

    }


    container.innerHTML =
        html;

}


/* =========================================================
   PLAN STATUS
========================================================= */

function renderPlanStatus() {

    const plan =
        readJSON(
            STREAK_KEYS.PLAN,
            null
        );


    const completed =
        getCompletedTopics();


    let total = 0;


    if (
        Array.isArray(
            plan?.subjects
        )
    ) {

        plan.subjects.forEach(
            subject => {

                if (
                    Array.isArray(
                        subject?.topics
                    )
                ) {

                    total +=
                        subject.topics.length;

                }

            }
        );

    }


    if (
        total === 0 &&
        Array.isArray(
            plan?.topics
        )
    ) {

        total =
            plan.topics.length;

    }


    const completedCount =
        completed.length;


    setText(
        "completionTitle",
        total > 0 &&
        completedCount >= total
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

    let name =
        localStorage.getItem(
            STREAK_KEYS.USERNAME
        );


    try {

        if (
            window.supabaseClient?.auth
        ) {

            const {
                data
            } =
                await window
                    .supabaseClient
                    .auth
                    .getUser();


            const user =
                data?.user;


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


    name =
        name || "Student";


    localStorage.setItem(
        STREAK_KEYS.USERNAME,
        name
    );


    setText(
        "usernameDisplay",
        name
    );


    setText(
        "userAvatar",
        name
            .charAt(0)
            .toUpperCase()
    );

}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    document
        .getElementById(
            "logoutButton"
        )
        ?.addEventListener(
            "click",
            async () => {

                try {

                    if (
                        window.supabaseClient?.auth
                    ) {

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


                window.location.href =
                    "home.html";

            }
        );

}


/* =========================================================
   DOM
========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

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

    refresh:
        renderEverything

};


/* =========================================================
   COMPATIBILITY FUNCTION
========================================================= */

function recordStudyActivity() {

    /*
       Starting or running a timer does NOT automatically
       complete the day's required study plan.

       The actual study-day completion is still determined
       by today's required topics.

       When all required topics are completed,
       checkTodayCompletion() records the study day.
    */

    return checkTodayCompletion();

}
