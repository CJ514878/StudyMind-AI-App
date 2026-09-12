/* =========================================================
   STUDYMIND AI — STUDY STREAK ENGINE
   COMPLETE REPLACEMENT
========================================================= */

"use strict";


/* =========================================================
   STORAGE
========================================================= */

const STREAK_KEYS = {

    ACTIVITY:
        "studyMindStreakActivity",

    COMPLETED:
        "studyMindCompletedTopics",

    LONGEST:
        "studyMindLongestStreak",

    CURRENT:
        "studyMindCurrentStreak",

    USERNAME:
        "studyMindUsername",

    THEME:
        "studyMindTheme"

};


/* =========================================================
   STATE
========================================================= */

let calendarDate = new Date();

let activity = {};

let previousCurrentStreak = 0;


/* =========================================================
   HELPERS
========================================================= */

function $(id) {

    return document.getElementById(id);

}


function todayKey() {

    const date = new Date();

    return formatDate(date);

}


function formatDate(date) {

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


function parseDate(key) {

    const parts =
        key.split("-").map(Number);

    return new Date(
        parts[0],
        parts[1] - 1,
        parts[2]
    );

}


function startOfDay(date) {

    const copy =
        new Date(date);

    copy.setHours(
        0,
        0,
        0,
        0
    );

    return copy;

}


function loadJSON(key, fallback) {

    try {

        const value =
            localStorage.getItem(key);

        if (!value) {
            return fallback;
        }

        const parsed =
            JSON.parse(value);

        return parsed;

    } catch {

        return fallback;

    }

}


function saveJSON(key, value) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

    } catch (error) {

        console.warn(
            "Could not save streak data:",
            error
        );

    }

}


/* =========================================================
   NORMALIZE ACTIVITY
========================================================= */

function loadActivity() {

    const stored =
        loadJSON(
            STREAK_KEYS.ACTIVITY,
            {}
        );


    if (
        stored &&
        typeof stored === "object" &&
        !Array.isArray(stored)
    ) {

        activity = {};

        Object.keys(stored).forEach(key => {

            if (
                /^\d{4}-\d{2}-\d{2}$/.test(key) &&
                stored[key]
            ) {

                activity[key] = true;

            }

        });

        return;

    }


    activity = {};

}


/* =========================================================
   PUBLIC ACTIVITY ENGINE
========================================================= */

/*
   This function is intentionally exposed globally.

   Study Session should call:

   window.StudyMindStreak.recordStudyActivity();

   It records the day ONLY when a real study
   session/topic has been completed.
*/

function recordStudyActivity() {

    loadActivity();

    const key =
        todayKey();

    activity[key] = true;

    saveJSON(
        STREAK_KEYS.ACTIVITY,
        activity
    );

    recalculateStreaks();

    return true;

}


/* =========================================================
   RECALCULATE STREAK
========================================================= */

function calculateCurrentStreak() {

    const today =
        startOfDay(
            new Date()
        );


    let cursor =
        new Date(today);


    let count = 0;


    /*
       If the student has not studied today,
       the current active streak is allowed to
       continue from yesterday.

       This means the streak does NOT instantly
       become zero at midnight.

       It becomes broken once there is a missed
       study day.
    */

    if (!hasActivity(cursor)) {

        cursor.setDate(
            cursor.getDate() - 1
        );

    }


    while (hasActivity(cursor)) {

        count++;

        cursor.setDate(
            cursor.getDate() - 1
        );

    }


    return count;

}


function hasActivity(date) {

    return activity[
        formatDate(date)
    ] === true;

}


/* =========================================================
   BEST STREAK
========================================================= */

function calculateLongestStreak() {

    const dates =
        Object.keys(activity)
            .filter(
                key => activity[key] === true
            )
            .sort();


    if (!dates.length) {
        return 0;
    }


    let longest = 1;

    let current = 1;


    for (
        let i = 1;
        i < dates.length;
        i++
    ) {

        const previous =
            parseDate(
                dates[i - 1]
            );

        const currentDate =
            parseDate(
                dates[i]
            );


        const difference =
            Math.round(
                (
                    startOfDay(currentDate)
                    -
                    startOfDay(previous)
                )
                /
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


function recalculateStreaks() {

    const current =
        calculateCurrentStreak();

    const longest =
        calculateLongestStreak();


    localStorage.setItem(
        STREAK_KEYS.CURRENT,
        String(current)
    );


    localStorage.setItem(
        STREAK_KEYS.LONGEST,
        String(longest)
    );


    return {
        current,
        longest
    };

}


/* =========================================================
   TOPIC COUNT
========================================================= */

function getCompletedTopicCount() {

    const completed =
        loadJSON(
            STREAK_KEYS.COMPLETED,
            []
        );


    if (!Array.isArray(completed)) {
        return 0;
    }


    return completed.length;

}


/* =========================================================
   TOTAL STUDY DAYS
========================================================= */

function getStudyDayCount() {

    return Object.keys(activity)
        .filter(
            key =>
                activity[key] === true
        )
        .length;

}


/* =========================================================
   WEEK INFORMATION
========================================================= */

function getMonday(date) {

    const result =
        startOfDay(date);

    const day =
        result.getDay();

    const difference =
        day === 0
            ? -6
            : 1 - day;

    result.setDate(
        result.getDate() + difference
    );

    return result;

}


function getCurrentWeek() {

    const monday =
        getMonday(
            new Date()
        );


    const days = [];


    for (
        let i = 0;
        i < 7;
        i++
    ) {

        const date =
            new Date(monday);

        date.setDate(
            monday.getDate() + i
        );

        days.push(date);

    }


    return days;

}


function getWeeklyStudyDays() {

    return getCurrentWeek()
        .filter(
            date =>
                hasActivity(date)
        )
        .length;

}


function getBestWeek() {

    const dates =
        Object.keys(activity)
            .filter(
                key => activity[key]
            )
            .sort();


    if (!dates.length) {
        return 0;
    }


    const weeks = {};


    dates.forEach(key => {

        const date =
            parseDate(key);

        const monday =
            getMonday(date);

        const weekKey =
            formatDate(monday);

        weeks[weekKey] =
            (weeks[weekKey] || 0) + 1;

    });


    return Math.max(
        0,
        ...Object.values(weeks)
    );

}


/* =========================================================
   USER
========================================================= */

function loadUser() {

    const name =
        localStorage.getItem(
            STREAK_KEYS.USERNAME
        )
        || "Student";


    if ($("usernameDisplay")) {

        $("usernameDisplay")
            .textContent = name;

    }


    if ($("userAvatar")) {

        $("userAvatar")
            .textContent =
            name
                .charAt(0)
                .toUpperCase();

    }

}


/* =========================================================
   HERO
========================================================= */

function renderHero() {

    const result =
        recalculateStreaks();

    const current =
        result.current;

    const longest =
        result.longest;


    if ($("currentStreak")) {

        $("currentStreak")
            .textContent =
            current;

    }


    if ($("bestStreak")) {

        $("bestStreak")
            .textContent =
            `${longest} day${longest === 1 ? "" : "s"}`;

    }


    if ($("totalStudyDays")) {

        $("totalStudyDays")
            .textContent =
            getStudyDayCount();

    }


    let message;


    if (current === 0) {

        message =
            "Complete a study topic to start your streak.";

    } else if (current === 1) {

        message =
            "Great start. Come back tomorrow to make it 2 days!";

    } else if (current < 7) {

        message =
            `You're on a ${current}-day streak. Keep the momentum going!`;

    } else if (current < 30) {

        message =
            `${current} days strong. You're building a serious habit!`;

    } else {

        message =
            `${current} days! That's incredible consistency.`;

    }


    if ($("streakMessage")) {

        $("streakMessage")
            .textContent =
            message;

    }

}


/* =========================================================
   STATS
========================================================= */

function renderStats() {

    const topics =
        getCompletedTopicCount();

    const weekly =
        getWeeklyStudyDays();

    const consistency =
        Math.round(
            (weekly / 7) * 100
        );

    const bestWeek =
        getBestWeek();


    if ($("topicsCompleted")) {

        $("topicsCompleted")
            .textContent =
            topics;

    }


    if ($("weeklyDays")) {

        $("weeklyDays")
            .textContent =
            `${weekly} / 7`;

    }


    if ($("weeklyConsistency")) {

        $("weeklyConsistency")
            .textContent =
            `${consistency}%`;

    }


    if ($("bestWeek")) {

        $("bestWeek")
            .textContent =
            `${bestWeek} day${bestWeek === 1 ? "" : "s"}`;

    }

}


/* =========================================================
   TODAY
========================================================= */

function renderToday() {

    const today =
        todayKey();

    const studied =
        activity[today] === true;


    const progress =
        studied ? 100 : 0;


    if ($("todayProgress")) {

        $("todayProgress")
            .style.width =
            `${progress}%`;

    }


    if ($("todayIcon")) {

        $("todayIcon")
            .textContent =
            studied
                ? "✓"
                : "○";

        $("todayIcon")
            .classList.toggle(
                "complete",
                studied
            );

    }


    if ($("todayStatus")) {

        $("todayStatus")
            .innerHTML =
            studied
                ? `
                    <strong>Study day complete ✓</strong>
                    <span>
                        You've done enough to count today.
                        Your streak is protected.
                    </span>
                  `
                : `
                    <strong>No study activity yet</strong>
                    <span>
                        Complete a topic to protect your streak.
                    </span>
                  `;

    }


    if ($("todayCaption")) {

        $("todayCaption")
            .textContent =
            studied
                ? "1 study day recorded today"
                : "0 study activity today";

    }


    renderMotivation(studied);

}


/* =========================================================
   MOTIVATION
========================================================= */

function renderMotivation(studied) {

    const current =
        Number(
            localStorage.getItem(
                STREAK_KEYS.CURRENT
            )
        ) || 0;


    let title;
    let text;


    if (studied) {

        title =
            "Streak protected 🔥";

        text =
            "Excellent work. You have already completed today's study activity.";

    } else if (current === 0) {

        title =
            "Start your streak";

        text =
            "Your first completed topic will create your first study day.";

    } else {

        title =
            "Don't break the chain";

        text =
            `Your ${current}-day streak is waiting for today's study session.`;

    }


    if ($("motivationTitle")) {

        $("motivationTitle")
            .textContent =
            title;

    }


    if ($("motivationText")) {

        $("motivationText")
            .textContent =
            text;

    }

}


/* =========================================================
   CALENDAR
========================================================= */

function renderCalendar() {

    const year =
        calendarDate.getFullYear();

    const month =
        calendarDate.getMonth();


    const monthName =
        calendarDate.toLocaleString(
            "en-US",
            {
                month: "long",
                year: "numeric"
            }
        );


    if ($("calendarMonth")) {

        $("calendarMonth")
            .textContent =
            monthName;

    }


    const grid =
        $("calendarGrid");

    if (!grid) return;


    grid.innerHTML = "";


    const firstDay =
        new Date(
            year,
            month,
            1
        );


    /*
       Convert Sunday-based JS day
       into Monday-based calendar index.
    */

    const start =
        firstDay.getDay() === 0
            ? 6
            : firstDay.getDay() - 1;


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    for (
        let i = 0;
        i < start;
        i++
    ) {

        const empty =
            document.createElement("div");

        empty.className =
            "calendar-day empty";

        grid.appendChild(empty);

    }


    const today =
        todayKey();


    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const date =
            new Date(
                year,
                month,
                day
            );


        const key =
            formatDate(date);


        const cell =
            document.createElement("div");


        cell.className =
            "calendar-day";


        if (key === today) {

            cell.classList.add(
                "today"
            );

        }


        if (activity[key]) {

            cell.classList.add(
                "studied"
            );

            cell.innerHTML =
                `
                    ${day}
                    <span class="check">✓</span>
                `;

        } else {

            cell.textContent =
                day;

        }


        grid.appendChild(cell);

    }

}


/* =========================================================
   CALENDAR CONTROLS
========================================================= */

function setupCalendarControls() {

    $("previousMonth")
        ?.addEventListener(
            "click",
            () => {

                calendarDate.setMonth(
                    calendarDate.getMonth() - 1
                );

                renderCalendar();

            }
        );


    $("nextMonth")
        ?.addEventListener(
            "click",
            () => {

                calendarDate.setMonth(
                    calendarDate.getMonth() + 1
                );

                renderCalendar();

            }
        );

}


/* =========================================================
   WEEKLY BARS
========================================================= */

function renderWeeklyBars() {

    const container =
        $("weeklyBars");

    if (!container) return;


    container.innerHTML = "";


    const week =
        getCurrentWeek();


    const names =
        ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];


    const today =
        todayKey();


    let total =
        0;


    week.forEach(
        (date, index) => {

            const key =
                formatDate(date);

            const studied =
                activity[key] === true;


            if (studied) {
                total++;
            }


            const day =
                document.createElement(
                    "div"
                );

            day.className =
                "week-day";


            const wrapper =
                document.createElement(
                    "div"
                );

            wrapper.className =
                "week-bar-wrapper";


            const bar =
                document.createElement(
                    "div"
                );

            bar.className =
                "week-bar";


            if (studied) {

                bar.classList.add(
                    "active"
                );

                bar.style.height =
                    "100%";

            } else {

                bar.style.height =
                    "5px";

            }


            if (key === today) {

                bar.classList.add(
                    "today"
                );

            }


            wrapper.appendChild(bar);


            const label =
                document.createElement(
                    "span"
                );

            label.className =
                "week-label";

            label.textContent =
                names[index];


            const number =
                document.createElement(
                    "span"
                );

            number.className =
                "week-number";

            number.textContent =
                studied ? "✓" : "—";


            day.appendChild(
                wrapper
            );

            day.appendChild(
                label
            );

            day.appendChild(
                number
            );


            container.appendChild(
                day
            );

        }
    );


    const first =
        week[0];

    const last =
        week[6];


    if ($("weekRange")) {

        $("weekRange")
            .textContent =
            `${first.toLocaleDateString(
                "en-US",
                {
                    month: "short",
                    day: "numeric"
                }
            )} – ${last.toLocaleDateString(
                "en-US",
                {
                    month: "short",
                    day: "numeric"
                }
            )}`;

    }

}


/* =========================================================
   CELEBRATION
========================================================= */

function checkForStreakUpdate() {

    const result =
        recalculateStreaks();

    const current =
        result.current;


    if (
        previousCurrentStreak > 0 &&
        current > previousCurrentStreak
    ) {

        showCelebration(
            current
        );

    }


    previousCurrentStreak =
        current;

}


function showCelebration(streak) {

    const overlay =
        $("celebrationOverlay");

    const text =
        $("celebrationText");


    if (!overlay) return;


    if (text) {

        text.textContent =
            `You're now on a ${streak}-day study streak. Keep the momentum going!`;

    }


    overlay.classList.add(
        "show"
    );

}


function closeCelebration() {

    $("celebrationOverlay")
        ?.classList
        .remove("show");

}


/* =========================================================
   THEME
========================================================= */

function applyTheme(theme) {

    let dark = false;


    if (theme === "dark") {

        dark = true;

    } else if (theme === "system") {

        dark =
            window.matchMedia?.(
                "(prefers-color-scheme: dark)"
            ).matches || false;

    }


    document.body.classList.toggle(
        "dark",
        dark
    );


    if ($("themeIcon")) {

        $("themeIcon")
            .textContent =
            dark ? "☀️" : "🌙";

    }


    if ($("themeText")) {

        $("themeText")
            .textContent =
            dark
                ? "Light mode"
                : "Dark mode";

    }

}


function setupTheme() {

    let theme =
        localStorage.getItem(
            STREAK_KEYS.THEME
        )
        || "system";


    applyTheme(theme);


    $("themeToggle")
        ?.addEventListener(
            "click",
            () => {

                const dark =
                    document.body
                        .classList
                        .contains("dark");


                theme =
                    dark
                        ? "light"
                        : "dark";


                localStorage.setItem(
                    STREAK_KEYS.THEME,
                    theme
                );


                applyTheme(theme);

            }
        );


    window
        .matchMedia?.(
            "(prefers-color-scheme: dark)"
        )
        .addEventListener(
            "change",
            () => {

                const saved =
                    localStorage.getItem(
                        STREAK_KEYS.THEME
                    );

                if (
                    saved === "system"
                ) {

                    applyTheme(
                        "system"
                    );

                }

            }
        );

}


/* =========================================================
   MOBILE
========================================================= */

function setupMobileMenu() {

    $("mobileMenu")
        ?.addEventListener(
            "click",
            () => {

                $("sidebar")
                    ?.classList
                    .toggle("open");

            }
        );

}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    $("logoutButton")
        ?.addEventListener(
            "click",
            async () => {

                try {

                    if (
                        window.supabaseClient &&
                        typeof window
                            .supabaseClient
                            .auth
                            ?.signOut ===
                            "function"
                    ) {

                        await window
                            .supabaseClient
                            .auth
                            .signOut();

                    }

                } catch (error) {

                    console.warn(
                        "Logout error:",
                        error
                    );

                }


                window.location.href =
                    "home.html";

            }
        );

}


/* =========================================================
   STORAGE CHANGES
========================================================= */

function refreshPageData() {

    loadActivity();

    renderHero();

    renderStats();

    renderToday();

    renderCalendar();

    renderWeeklyBars();

}


window.addEventListener(
    "storage",
    event => {

        if (
            event.key ===
            STREAK_KEYS.ACTIVITY
            ||
            event.key ===
            STREAK_KEYS.COMPLETED
        ) {

            refreshPageData();

        }

    }
);


/* =========================================================
   PUBLIC API
========================================================= */

window.StudyMindStreak = {

    recordStudyActivity,

    calculateCurrentStreak,

    calculateLongestStreak,

    getStudyDayCount,

    refresh:
        refreshPageData

};


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadActivity();

        previousCurrentStreak =
            calculateCurrentStreak();


        loadUser();

        setupTheme();

        setupMobileMenu();

        setupLogout();

        setupCalendarControls();


        renderHero();

        renderStats();

        renderToday();

        renderCalendar();

        renderWeeklyBars();

    }
);

