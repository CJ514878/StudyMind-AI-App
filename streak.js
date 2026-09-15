"use strict";

/* =========================================================
   STUDYMIND AI — INTEGRATED STREAK ENGINE
   Milo + Streak + XP + Daily Completion
========================================================= */

const STREAK_KEYS = {
    COMPLETED: "studyMindCompletedTopics",
    ACTIVITY: "studyMindStreakActivity",
    CURRENT: "studyMindStreak",
    BEST: "studyMindLongestStreak",
    LAST_COMPLETED: "studyMindLastCompletedPlanDate",
    PLAN: "studyMindPlan",
    XP: "studyMindXP",
    USERNAME: "studyMindUsername"
};


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initStreak
);

function initStreak() {

    migrateActivityFormat();

    syncStreakFromActivity();

    renderEverything();

    loadUser();

    setupLogout();

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

       This is deliberately lightweight.
    */

    window.addEventListener(
        "studyMindStreakUpdated",
        () => {

            syncStreakFromActivity();

            renderEverything();

        }
    );


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

    const stored =
        readJSON(
            STREAK_KEYS.ACTIVITY,
            {}
        );


    if (
        stored &&
        typeof stored === "object" &&
        !Array.isArray(stored)
    ) {

        return stored;

    }


    if (
        Array.isArray(stored)
    ) {

        const activity = {};

        stored.forEach(
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

                    const date =
                        item.date ||
                        item.day ||
                        item.completedDate ||
                        item.completedAt;


                    if (!date) {

                        return;

                    }


                    const key =
                        String(date).slice(0, 10);


                    if (
                        /^\d{4}-\d{2}-\d{2}$/.test(key)
                    ) {

                        activity[key] = true;

                    }

                }

            }
        );

        return activity;

    }

    return {};

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
       If today isn't complete yet,
       yesterday can still keep the streak alive.
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
   SYNC CURRENT STREAK
========================================================= */

function syncStreakFromActivity() {

    const activity =
        getActivity();


    const current =
        calculateCurrentStreak(
            activity
        );


    const calculatedBest =
        calculateLongestStreak(
            activity
        );


    const storedBest =
        Number(
            localStorage.getItem(
                STREAK_KEYS.BEST
            ) || 0
        );


    const best =
        Math.max(
            calculatedBest,
            storedBest
        );


    localStorage.setItem(
        STREAK_KEYS.CURRENT,
        String(current)
    );


    localStorage.setItem(
        STREAK_KEYS.BEST,
        String(best)
    );


    return {
        current,
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
                                    String(name).trim()
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
                            String(name).trim()
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


    /*
       Compatibility with older versions
       which stored only the topic name.
    */

    if (
        completed.includes(topic)
    ) {

        return true;

    }


    /*
       Also support topic objects.
    */

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
       If a schedule exists, use it.
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
       If there is no schedule, fall back
       to the plan's topics.

       This keeps older StudyMind plans working.
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
       Already awarded today.
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
   RECORD COMPLETED DAY
========================================================= */

function recordCompletedStudyDay() {

    const today =
        todayKey();


    const activity =
        getActivity();


    /*
       Never double-award a day.
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


    activity[today] = true;


    writeJSON(
        STREAK_KEYS.ACTIVITY,
        activity
    );


    localStorage.setItem(
        STREAK_KEYS.LAST_COMPLETED,
        today
    );


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
       Tell Milo.
    */

    if (
        window.Milo
    ) {

        setTimeout(
            () => {

                window.Milo.celebrateStreak(
                    stats.current
                );

            },
            250
        );

    }


    /*
       Tell dashboard/streak page/etc.
    */

    window.dispatchEvent(
        new CustomEvent(
            "studyMindStreakUpdated",
            {
                detail: {
                    date: today,
                    currentStreak:
                        stats.current,
                    longestStreak:
                        stats.best
                }
            }
        )
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
                    total: newXP,
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
       IMPORTANT:

       This no longer blindly creates a streak.

       It checks whether today's actual required
       study work has been completed.
    */

    return checkTodayCompletion();

}
