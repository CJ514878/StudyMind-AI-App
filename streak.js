/* =========================================================
   STUDYMIND AI — STREAK ENGINE
========================================================= */

"use strict";


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
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initStreak
);


function initStreak() {

    syncCompletionActivity();

    renderEverything();

    loadUser();

    setupLogout();


    /*
       Keep the page updated if another StudyMind
       tab changes completion data.
    */

    window.addEventListener(
        "storage",
        event => {

            if (
                event.key === STREAK_KEYS.COMPLETED ||
                event.key === STREAK_KEYS.ACTIVITY
            ) {

                syncCompletionActivity();

                renderEverything();

            }

        }
    );


    /*
       Refresh periodically so the timer/session
       can update progress without a reload.
    */

    setInterval(
        () => {

            syncCompletionActivity();

            renderEverything();

        },
        3000
    );

}


/* =========================================================
   HELPERS
========================================================= */

function readJSON(key, fallback) {

    try {

        const value =
            localStorage.getItem(key);

        if (!value) {
            return fallback;
        }

        return JSON.parse(value);

    } catch {

        return fallback;

    }

}


function writeJSON(key, value) {

    localStorage.setItem(
        key,
        JSON.stringify(value)
    );

}


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

    result.setDate(
        result.getDate() + amount
    );

    return result;

}


/* =========================================================
   COMPLETION SYNC
========================================================= */

function syncCompletionActivity() {

    const completed =
        readJSON(
            STREAK_KEYS.COMPLETED,
            []
        );


    if (!Array.isArray(completed)) {
        return;
    }


    let activity =
        readJSON(
            STREAK_KEYS.ACTIVITY,
            {}
        );


    if (
        !activity ||
        typeof activity !== "object" ||
        Array.isArray(activity)
    ) {

        activity = {};

    }


    /*
       We maintain a permanent snapshot of which
       completed topics have already been accounted for.
    */

    let known =
        readJSON(
            STREAK_KEYS.LAST_SYNC,
            []
        );


    if (!Array.isArray(known)) {
        known = [];
    }


    const newTopics =
        completed.filter(
            topic =>
                !known.includes(
                    String(topic)
                )
        );


    /*
       Any newly completed topic is recorded as
       study activity for today.

       Multiple topics completed on the same day
       still count as ONE study day.
    */

    if (newTopics.length > 0) {

        const today =
            todayKey();

        activity[today] = true;

        writeJSON(
            STREAK_KEYS.ACTIVITY,
            activity
        );


        writeJSON(
            STREAK_KEYS.LAST_SYNC,
            completed.map(
                String
            )
        );

    }

}


/* =========================================================
   ACTIVITY DAYS
========================================================= */

function getActivityDays() {

    const activity =
        readJSON(
            STREAK_KEYS.ACTIVITY,
            {}
        );


    if (
        !activity ||
        typeof activity !== "object"
    ) {

        return [];

    }


    return Object.keys(activity)
        .filter(
            date =>
                activity[date] === true
        )
        .sort();

}


/* =========================================================
   CURRENT STREAK
========================================================= */

function calculateCurrentStreak() {

    const days =
        getActivityDays();


    if (!days.length) {
        return 0;
    }


    const daySet =
        new Set(days);


    let current =
        new Date();


    /*
       If the user has not studied today,
       start from yesterday.

       This means a streak doesn't disappear
       merely because the user hasn't studied
       yet today.
    */

    const today =
        todayKey(current);


    if (!daySet.has(today)) {

        current =
            addDays(
                current,
                -1
            );

    }


    let streak = 0;


    while (
        daySet.has(
            todayKey(current)
        )
    ) {

        streak++;

        current =
            addDays(
                current,
                -1
            );

    }


    return streak;

}


/* =========================================================
   LONGEST STREAK
========================================================= */

function calculateLongestStreak() {

    const days =
        getActivityDays();


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


    return best;

}


/* =========================================================
   WEEKLY
========================================================= */

function getWeeklyDays() {

    const activity =
        readJSON(
            STREAK_KEYS.ACTIVITY,
            {}
        );


    let count = 0;

    const today =
        new Date();


    for (
        let i = 0;
        i < 7;
        i++
    ) {

        const date =
            addDays(
                today,
                -i
            );


        if (
            activity[
                todayKey(date)
            ]
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

    const current =
        calculateCurrentStreak();

    const best =
        calculateLongestStreak();

    const days =
        getActivityDays();

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


    renderMessages(current);

    renderWeek();

    renderCalendar();

    renderPlanStatus();

}


/* =========================================================
   TEXT
========================================================= */

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }

}


function renderMessages(streak) {

    let message =
        "Complete your first study day to start.";

    let hero =
        "Complete your study work consistently to build your streak.";


    if (streak === 1) {

        message =
            "Great start. Come back tomorrow and keep it going.";

        hero =
            "You've started your streak. Keep the momentum going.";

    } else if (streak > 1) {

        message =
            `${streak} consecutive study days. Keep going!`;

        hero =
            `You're on a ${streak}-day streak. Don't break the chain.`;

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
   WEEK
========================================================= */

function renderWeek() {

    const container =
        document.getElementById(
            "weekGrid"
        );


    if (!container) {
        return;
    }


    const activity =
        readJSON(
            STREAK_KEYS.ACTIVITY,
            {}
        );


    const today =
        new Date();


    let html = "";


    for (
        let i = 6;
        i >= 0;
        i--
    ) {

        const date =
            addDays(
                today,
                -i
            );


        const key =
            todayKey(date);


        const studied =
            activity[key] === true;


        const isToday =
            i === 0;


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
                    class="week-box
                    ${studied ? "studied" : ""}
                    ${isToday ? "today" : ""}"
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

function renderCalendar() {

    const container =
        document.getElementById(
            "calendarGrid"
        );


    if (!container) {
        return;
    }


    const activity =
        readJSON(
            STREAK_KEYS.ACTIVITY,
            {}
        );


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


    const start =
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


    for (
        let i = 0;
        i < start;
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


        const today =
            key === todayKey();


        html += `

            <div
                class="calendar-day
                ${studied ? "studied" : ""}
                ${today ? "today" : ""}"
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
        readJSON(
            STREAK_KEYS.COMPLETED,
            []
        );


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
        Array.isArray(plan?.topics)
    ) {

        total =
            plan.topics.length;

    }


    const completedCount =
        Array.isArray(completed)
            ? completed.length
            : 0;


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
                total - completedCount
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
                await window.supabaseClient.auth.getUser();


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
            "User loading failed:",
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
                        error
                    );

                }


                window.location.href =
                    "home.html";

            }
        );

}
