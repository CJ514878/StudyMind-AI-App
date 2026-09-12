/* =========================================================
   STUDYMIND AI — STUDY STREAK ENGINE
   COMPLETE REPLACEMENT

   CORRECT FLOW:

   Study Session
        ↓
   Complete Topic
        ↓
   studyMindCompletedTopics
        +
   studyMindStreakActivity
        ↓
   Study Streak
        ↓
   Current Streak
   Best Streak
   Weekly Activity
   Calendar

   IMPORTANT:
   - A study plan does NOT create a streak.
   - Opening a topic does NOT create a streak.
   - Only completing a topic creates activity.
   - Multiple topics on one day = ONE streak day.
   - Initial streak = 0.
========================================================= */

"use strict";


/* =========================================================
   STORAGE
========================================================= */

const STREAK_KEYS = {

    COMPLETED:
        "studyMindCompletedTopics",

    ACTIVITY:
        "studyMindStreakActivity",

    BEST:
        "studyMindLongestStreak",

    LAST_SYNC:
        "studyMindStreakLastSync",

    USERNAME:
        "studyMindUsername",

    PLAN:
        "studyMindPlan"

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
       Do NOT create activity simply because a plan exists.

       The activity key is only populated when a
       topic completion actually occurs.
    */

    migrateActivityFormat();

    renderEverything();

    loadUser();

    setupLogout();


    /*
       Cross-tab updates.
    */

    window.addEventListener(
        "storage",
        event => {

            if (
                event.key === STREAK_KEYS.COMPLETED ||
                event.key === STREAK_KEYS.ACTIVITY ||
                event.key === STREAK_KEYS.BEST
            ) {

                migrateActivityFormat();

                renderEverything();

            }

        }
    );


    /*
       Same-page / delayed updates.
    */

    setInterval(
        () => {

            migrateActivityFormat();

            renderEverything();

        },
        2000
    );

}


/* =========================================================
   STORAGE HELPERS
========================================================= */

function readJSON(key, fallback) {

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


function writeJSON(key, value) {

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
   DATE HELPERS
========================================================= */

function todayKey(date = new Date()) {

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


function dateFromKey(key) {

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


function addDays(date, amount) {

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
   TOPIC IDENTITY
========================================================= */

/*
   Converts any completed-topic format into a stable
   identifier.

   Supports:

   "Algebra"

   {
       id: "abc123",
       name: "Algebra"
   }

   {
       topicId: "abc123",
       topic: "Algebra"
   }
*/

function getTopicIdentity(topic) {

    if (
        topic === null ||
        topic === undefined
    ) {

        return "";

    }


    if (typeof topic === "string") {

        return topic.trim();

    }


    if (typeof topic === "number") {

        return String(topic);

    }


    if (typeof topic === "object") {

        return String(
            topic.id ??
            topic.topicId ??
            topic.topic_id ??
            topic.name ??
            topic.title ??
            topic.topic ??
            topic.text ??
            ""
        ).trim();

    }


    return String(topic).trim();

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


    if (Array.isArray(completed)) {

        return completed;

    }


    /*
       Compatibility if another version stored
       an object.
    */

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


    /*
       Preferred format:

       {
           "2026-09-12": true
       }
    */

    if (
        stored &&
        typeof stored === "object" &&
        !Array.isArray(stored)
    ) {

        return stored;

    }


    /*
       Compatibility with an array:

       [
       "2026-09-12",
       "2026-09-13"
       ]
    */

    if (Array.isArray(stored)) {

        const activity = {};


        stored.forEach(item => {

            if (typeof item === "string") {

                const date =
                    item.slice(0, 10);

                if (
                    /^\d{4}-\d{2}-\d{2}$/.test(
                        date
                    )
                ) {

                    activity[date] = true;

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


                if (date) {

                    const key =
                        String(date).slice(
                            0,
                            10
                        );


                    if (
                        /^\d{4}-\d{2}-\d{2}$/.test(
                            key
                        )
                    ) {

                        activity[key] = true;

                    }

                }

            }

        });


        return activity;

    }


    return {};

}


/* =========================================================
   SAVE TODAY'S ACTIVITY
========================================================= */

/*
   THIS IS THE IMPORTANT FUNCTION.

   Study Session should call:

       recordStudyActivity();

   immediately after the topic is successfully
   completed.

   Calling it multiple times on the same day is safe.
   The date is stored only once.
*/

function recordStudyActivity() {

    const activity =
        getActivity();


    const today =
        todayKey();


    /*
       One day can only count once.
    */

    activity[today] = true;


    writeJSON(
        STREAK_KEYS.ACTIVITY,
        activity
    );


    /*
       Update longest streak immediately.
    */

    const longest =
        calculateLongestStreak(
            activity
        );


    const storedBest =
        Number(
            localStorage.getItem(
                STREAK_KEYS.BEST
            )
        ) || 0;


    const best =
        Math.max(
            longest,
            storedBest
        );


    localStorage.setItem(
        STREAK_KEYS.BEST,
        String(best)
    );


    /*
       Notify other StudyMind pages in the
       same browser tab.

       The native "storage" event does not fire
       in the same document that changed localStorage.
    */

    window.dispatchEvent(
        new CustomEvent(
            "studyMindStreakUpdated",
            {
                detail: {
                    date: today,
                    currentStreak:
                        calculateCurrentStreak(
                            activity
                        ),
                    longestStreak: best
                }
            }
        )
    );


    return true;

}


/* =========================================================
   MIGRATION
========================================================= */

/*
   This function ONLY normalizes the activity format.

   It deliberately does NOT create activity from
   the existence of completed topics.

   This prevents old data from randomly giving
   the user a streak.
*/

function migrateActivityFormat() {

    const activity =
        getActivity();


    const clean = {};


    Object.keys(activity)
        .forEach(date => {

            const key =
                String(date).slice(
                    0,
                    10
                );


            if (
                /^\d{4}-\d{2}-\d{2}$/.test(
                    key
                ) &&
                activity[date] === true
            ) {

                clean[key] = true;

            }

        });


    writeJSON(
        STREAK_KEYS.ACTIVITY,
        clean
    );

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
                /^\d{4}-\d{2}-\d{2}$/.test(
                    date
                )
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
        getActivityDays(activity);


    /*
       No activity = ZERO.

       This is intentionally explicit.
    */

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
       If the student hasn't studied today,
       yesterday can still keep the current
       streak alive.
    */

    if (!daySet.has(today)) {

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
        getActivityDays(activity);


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
                ) /
                86400000
            );


        if (difference === 1) {

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
   WEEKLY ACTIVITY
========================================================= */

function getWeeklyDays() {

    const activity =
        getActivity();


    const today =
        new Date();


    let count = 0;


    /*
       Monday → Sunday current week.
    */

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
   RENDER EVERYTHING
========================================================= */

function renderEverything() {

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
            )
        ) || 0;


    const best =
        Math.max(
            calculatedBest,
            storedBest
        );


    /*
       Preserve the best streak.
    */

    if (best > storedBest) {

        localStorage.setItem(
            STREAK_KEYS.BEST,
            String(best)
        );

    }


    const days =
        getActivityDays(
            activity
        );


    const weekly =
        getWeeklyDays();


    setText(
        "currentStreak",
        current
    );


    setText(
        "longestStreak",
        best
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
        current
    );


    renderWeek(
        activity
    );


    renderCalendar(
        activity
    );


    renderPlanStatus();

}


/* =========================================================
   MESSAGES
========================================================= */

function renderMessages(
    streak
) {

    let message =
        "Complete your first study topic to start your streak.";


    let hero =
        "Complete your study work consistently to build your streak.";


    if (streak === 1) {

        message =
            "Great start. Come back tomorrow and keep it going.";


        hero =
            "You've started your streak. Keep the momentum going.";

    }


    else if (streak > 1) {

        message =
            `${streak} consecutive study days. Keep going!`;


        hero =
            `You're on a ${streak}-day streak. Keep the chain going.`;

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


    const currentDay =
        today.getDay();


    const mondayOffset =
        currentDay === 0
            ? -6
            : 1 - currentDay;


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
                    ${studied ? "✓" : "•"}
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


    const monthName =
        now.toLocaleDateString(
            undefined,
            {
                month: "long",
                year: "numeric"
            }
        );


    setText(
        "calendarTitle",
        monthName
    );


    let html = "";


    /*
       Empty cells before first day.
    */

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


    const title =
        document.getElementById(
            "completionTitle"
        );


    const text =
        document.getElementById(
            "completionText"
        );


    if (
        total > 0 &&
        completedCount >= total
    ) {

        if (title) {

            title.textContent =
                "Study plan completed! 🎉";

        }


        if (text) {

            text.textContent =
                "Amazing work. You've completed every topic in your current study plan.";

        }

    } else {

        const remaining =
            Math.max(
                0,
                total -
                completedCount
            );


        if (title) {

            title.textContent =
                total
                    ? `${remaining} topic${remaining === 1 ? "" : "s"} remaining`
                    : "Keep pushing forward";

        }


        if (text) {

            text.textContent =
                total
                    ? `${completedCount} of ${total} topics completed.`
                    : "Complete your study topics to make progress.";

        }

    }

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
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================================
   GLOBAL API
========================================================= */

/*
   This makes the streak engine accessible from
   study-session.js.

   The Study Session should call:

       window.StudyMindStreak.recordStudyActivity();

   when the student clicks Complete Topic.
*/

window.StudyMindStreak = {

    recordStudyActivity,

    calculateCurrentStreak,

    calculateLongestStreak,

    getActivityDays,

    getActivity,

    refresh: renderEverything

};

