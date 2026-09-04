/* =========================================================
   STUDYMIND AI — STUDY STREAK
   COMPLETE REPLACEMENT

   RULE:
   A study day is recorded ONLY when the user completes
   their reading from the dashboard.

   Example:
   Day 1 → complete reading → streak 1
   Day 2 → complete reading → streak 2
   Day 3 → complete reading → streak 3

   Opening the dashboard alone does NOT increase the streak.
========================================================= */

"use strict";


/* =========================================================
   STORAGE
========================================================= */

const STREAK_HISTORY_KEY = "studyMindStudyHistory";
const LAST_STUDY_DATE_KEY = "lastStudyDate";

const PLAN_STORAGE_KEY = "studyMindPlan";
const COMPLETED_TOPICS_KEY = "studyMindCompletedTopics";
const COMPLETED_QUESTIONS_KEY =
    "studyMindCompletedQuestionTopics";


/* =========================================================
   DATE HELPERS
========================================================= */

function getTodayKey() {

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(now.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(now.getDate())
            .padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function parseDateKey(key) {

    if (!key) {
        return null;
    }

    const parts =
        key.split("-").map(Number);

    if (parts.length !== 3) {
        return null;
    }

    return new Date(
        parts[0],
        parts[1] - 1,
        parts[2]
    );
}


function formatDateKey(date) {

    const year =
        date.getFullYear();

    const month =
        String(date.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(date.getDate())
            .padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function addDays(date, amount) {

    const result =
        new Date(date);

    result.setDate(
        result.getDate() + amount
    );

    return result;
}


function daysBetween(a, b) {

    if (!a || !b) {
        return 0;
    }

    const oneDay =
        24 * 60 * 60 * 1000;

    return Math.round(
        Math.abs(
            a.getTime() -
            b.getTime()
        ) / oneDay
    );
}


/* =========================================================
   STORAGE HELPERS
========================================================= */

function getStudyHistory() {

    try {

        const stored =
            JSON.parse(
                localStorage.getItem(
                    STREAK_HISTORY_KEY
                ) || "[]"
            );

        if (!Array.isArray(stored)) {
            return [];
        }

        return [
            ...new Set(
                stored.filter(
                    date =>
                        typeof date === "string" &&
                        /^\d{4}-\d{2}-\d{2}$/
                            .test(date)
                )
            )
        ].sort();

    } catch (error) {

        console.warn(
            "StudyMind streak history error:",
            error
        );

        return [];
    }
}


function saveStudyHistory(history) {

    const cleaned = [
        ...new Set(
            history.filter(
                date =>
                    typeof date === "string" &&
                    /^\d{4}-\d{2}-\d{2}$/
                        .test(date)
            )
        )
    ].sort();

    localStorage.setItem(
        STREAK_HISTORY_KEY,
        JSON.stringify(cleaned)
    );
}


function getArrayFromStorage(key) {

    try {

        const value =
            JSON.parse(
                localStorage.getItem(key) || "[]"
            );

        return Array.isArray(value)
            ? value
            : [];

    } catch {

        return [];
    }
}


function getStoredPlan() {

    try {

        return JSON.parse(
            localStorage.getItem(
                PLAN_STORAGE_KEY
            ) || "null"
        );

    } catch {

        return null;
    }
}


/* =========================================================
   REGISTER COMPLETED READING
========================================================= */

/*
 * THIS IS THE IMPORTANT FUNCTION.
 *
 * Call this ONLY when the user has actually finished
 * their reading for the day from the dashboard.
 *
 * Calling it multiple times on the same day will NOT
 * increase the streak more than once.
 */

function registerStudyCompletion() {

    const today =
        getTodayKey();

    let history =
        getStudyHistory();


    /*
     * Already completed today.
     *
     * Do not add another entry and do not increase
     * the streak again.
     */

    if (!history.includes(today)) {

        history.push(today);

    }


    /*
     * Save today's completion.
     */

    saveStudyHistory(history);


    /*
     * Keep the existing StudyMind date key in sync.
     */

    localStorage.setItem(
        LAST_STUDY_DATE_KEY,
        today
    );


    /*
     * Recalculate immediately.
     */

    const current =
        calculateCurrentStreak(
            history
        );


    const longest =
        calculateLongestStreak(
            history
        );


    /*
     * Update the dashboard immediately if the
     * streak elements exist.
     */

    updateStreakDisplay(
        current,
        longest,
        history
    );


    return {
        current,
        longest,
        history
    };
}


/* =========================================================
   CHECK WHETHER TODAY HAS BEEN COMPLETED
========================================================= */

function hasCompletedReadingToday() {

    const today =
        getTodayKey();

    const history =
        getStudyHistory();

    return history.includes(today);
}


/* =========================================================
   CURRENT STREAK
========================================================= */

function calculateCurrentStreak(history) {

    if (
        !Array.isArray(history) ||
        history.length === 0
    ) {
        return 0;
    }


    const dates =
        history
            .map(parseDateKey)
            .filter(Boolean)
            .sort(
                (a, b) => b - a
            );


    if (!dates.length) {
        return 0;
    }


    const today =
        parseDateKey(
            getTodayKey()
        );


    const newest =
        dates[0];


    const distanceFromToday =
        daysBetween(
            newest,
            today
        );


    /*
     * If the user hasn't completed reading today
     * or yesterday, the current streak is broken.
     *
     * Yesterday is allowed because the user may simply
     * not have completed today's reading yet.
     */

    if (
        distanceFromToday > 1
    ) {

        return 0;

    }


    let streak = 1;


    for (
        let i = 0;
        i < dates.length - 1;
        i++
    ) {

        const difference =
            daysBetween(
                dates[i],
                dates[i + 1]
            );


        if (
            difference === 1
        ) {

            streak++;

        } else {

            break;

        }
    }


    return streak;
}


/* =========================================================
   LONGEST STREAK
========================================================= */

function calculateLongestStreak(history) {

    if (
        !Array.isArray(history) ||
        history.length === 0
    ) {
        return 0;
    }


    const dates =
        history
            .map(parseDateKey)
            .filter(Boolean)
            .sort(
                (a, b) => a - b
            );


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

        const difference =
            daysBetween(
                dates[i],
                dates[i - 1]
            );


        if (
            difference === 1
        ) {

            current++;

            longest =
                Math.max(
                    longest,
                    current
                );

        } else {

            current = 1;

        }
    }


    return longest;
}


/* =========================================================
   LAST 7 DAYS
========================================================= */

function getLastSevenDays() {

    const today =
        parseDateKey(
            getTodayKey()
        );

    const days = [];


    for (
        let i = 6;
        i >= 0;
        i--
    ) {

        days.push(
            addDays(
                today,
                -i
            )
        );

    }


    return days;
}


/* =========================================================
   WEEK VIEW
========================================================= */

function renderWeek(history) {

    const grid =
        document.getElementById(
            "weekGrid"
        );


    if (!grid) {
        return;
    }


    const days =
        getLastSevenDays();


    const weekdayNames = [
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat"
    ];


    grid.innerHTML =
        days.map(day => {

            const key =
                formatDateKey(day);

            const active =
                history.includes(key);

            const today =
                key === getTodayKey();


            return `
                <div class="week-day">

                    <div class="week-day-name">
                        ${weekdayNames[day.getDay()]}
                    </div>

                    <div
                        class="
                            week-day-box
                            ${active ? "active" : ""}
                            ${today ? "today" : ""}
                        "
                        title="${key}"
                    >
                        ${active ? "✓" : "—"}
                    </div>

                </div>
            `;

        }).join("");
}


/* =========================================================
   MONTH CALENDAR
========================================================= */

function renderCalendar(history) {

    const grid =
        document.getElementById(
            "calendarGrid"
        );

    const title =
        document.getElementById(
            "calendarTitle"
        );


    if (!grid) {
        return;
    }


    const now =
        new Date();


    const year =
        now.getFullYear();

    const month =
        now.getMonth();


    if (title) {

        title.textContent =
            now.toLocaleDateString(
                undefined,
                {
                    month: "long",
                    year: "numeric"
                }
            );

    }


    const firstDay =
        new Date(
            year,
            month,
            1
        ).getDay();


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    let html = "";


    for (
        let i = 0;
        i < firstDay;
        i++
    ) {

        html += `
            <div class="calendar-day empty"></div>
        `;

    }


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
            formatDateKey(date);


        const studied =
            history.includes(key);


        const today =
            key === getTodayKey();


        html += `
            <div
                class="
                    calendar-day
                    ${studied ? "studied" : ""}
                    ${today ? "today" : ""}
                "
            >

                <div class="calendar-day-number">
                    ${day}
                </div>

                ${
                    studied
                        ? `
                            <div
                                class="calendar-day-dot"
                            ></div>
                        `
                        : ""
                }

            </div>
        `;

    }


    grid.innerHTML =
        html;
}


/* =========================================================
   STREAK MESSAGE
========================================================= */

function updateStreakMessage(current) {

    const message =
        document.getElementById(
            "streakMessage"
        );

    const title =
        document.getElementById(
            "streakTipTitle"
        );

    const text =
        document.getElementById(
            "streakTipText"
        );


    if (current === 0) {

        if (message) {

            message.textContent =
                "Complete today's reading to start your StudyMind streak.";

        }


        if (title) {

            title.textContent =
                "Start your streak today";

        }


        if (text) {

            text.textContent =
                "Finish your reading from the dashboard and your first study day will be recorded.";

        }


        return;
    }


    if (current === 1) {

        if (message) {

            message.textContent =
                "Great start. Complete tomorrow's reading to make it 2 days.";

        }


        if (title) {

            title.textContent =
                "You've started!";

        }


        if (text) {

            text.textContent =
                "Come back tomorrow and complete your reading to continue your streak.";

        }


        return;
    }


    if (current < 7) {

        if (message) {

            message.textContent =
                `You're on a ${current}-day streak. Keep it going!`;

        }


        if (title) {

            title.textContent =
                "Keep the momentum";

        }


        if (text) {

            text.textContent =
                `Complete your reading tomorrow to reach ${current + 1} days.`;

        }


        return;
    }


    if (message) {

        message.textContent =
            `Amazing! You've studied for ${current} consecutive days.`;

    }


    if (title) {

        title.textContent =
            "🔥 You're on fire!";

    }


    if (text) {

        text.textContent =
            `You've built a ${current}-day study streak. Keep completing your reading every day!`;

    }
}


/* =========================================================
   UPDATE DISPLAY
========================================================= */

function updateStreakDisplay(
    current,
    longest,
    history
) {

    const currentElement =
        document.getElementById(
            "currentStreak"
        );

    const longestElement =
        document.getElementById(
            "longestStreak"
        );

    const totalElement =
        document.getElementById(
            "totalStudyDays"
        );

    const weeklyElement =
        document.getElementById(
            "weeklyStudyDays"
        );


    const weekly =
        getLastSevenDays()
            .filter(
                day =>
                    history.includes(
                        formatDateKey(day)
                    )
            )
            .length;


    if (currentElement) {

        currentElement.textContent =
            current;

    }


    if (longestElement) {

        longestElement.textContent =
            longest;

    }


    if (totalElement) {

        totalElement.textContent =
            history.length;

    }


    if (weeklyElement) {

        weeklyElement.textContent =
            weekly;

    }


    updateStreakMessage(
        current
    );


    renderWeek(
        history
    );


    renderCalendar(
        history
    );
}


/* =========================================================
   UPDATE STREAK UI
========================================================= */

function updateStreakUI() {

    const history =
        getStudyHistory();


    const current =
        calculateCurrentStreak(
            history
        );


    const longest =
        calculateLongestStreak(
            history
        );


    updateStreakDisplay(
        current,
        longest,
        history
    );
}


/* =========================================================
   THEME
========================================================= */

function applyTheme() {

    const savedTheme =
        localStorage.getItem(
            "studyMindTheme"
        ) || "light";


    const isLight =
        savedTheme === "light";

    const isDark =
        savedTheme === "dark";


    document.documentElement.classList.toggle(
        "light-mode",
        isLight
    );

    document.documentElement.classList.toggle(
        "dark-mode",
        isDark
    );


    document.body.classList.toggle(
        "light-mode",
        isLight
    );

    document.body.classList.toggle(
        "dark-mode",
        isDark
    );


    document.documentElement.style.colorScheme =
        isDark
            ? "dark"
            : "light";


    updateThemeButton();
}


function toggleTheme() {

    const currentTheme =
        localStorage.getItem(
            "studyMindTheme"
        ) || "light";


    const newTheme =
        currentTheme === "dark"
            ? "light"
            : "dark";


    localStorage.setItem(
        "studyMindTheme",
        newTheme
    );


    applyTheme();
}


function updateThemeButton() {

    const button =
        document.getElementById(
            "themeButton"
        );


    if (!button) {
        return;
    }


    const isDark =
        document.body.classList.contains(
            "dark-mode"
        );


    button.textContent =
        isDark
            ? "☀️ Light Mode"
            : "🌙 Dark Mode";
}


/* =========================================================
   NAVIGATION
========================================================= */

function openHome() {

    window.location.href =
        "home.html";
}


function openNewStudyPlan() {

    window.location.href =
        "index.html";
}


function openSummarizer() {

    window.location.href =
        "summarizer.html";
}


function openAISupport() {

    window.location.href =
        "ai-support.html";
}


function openStudyScore() {

    window.location.href =
        "score.html";
}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutStudyMind() {

    try {

        if (
            typeof supabase !== "undefined" &&
            supabase?.auth
        ) {

            await supabase.auth.signOut();

        }

        if (
            typeof window.supabaseClient !==
            "undefined" &&
            window.supabaseClient?.auth
        ) {

            await window.supabaseClient
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
}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.registerStudyCompletion =
    registerStudyCompletion;

window.hasCompletedReadingToday =
    hasCompletedReadingToday;

window.updateStreakUI =
    updateStreakUI;

window.calculateCurrentStreak =
    calculateCurrentStreak;

window.calculateLongestStreak =
    calculateLongestStreak;

window.getStudyHistory =
    getStudyHistory;

window.toggleTheme =
    toggleTheme;

window.openHome =
    openHome;

window.openNewStudyPlan =
    openNewStudyPlan;

window.openSummarizer =
    openSummarizer;

window.openAISupport =
    openAISupport;

window.openStudyScore =
    openStudyScore;

window.logoutStudyMind =
    logoutStudyMind;


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        applyTheme();

        /*
         * IMPORTANT:
         * This only READS the streak.
         *
         * It does NOT register a study day.
         *
         * The study day is registered only by:
         *
         * registerStudyCompletion()
         */

        updateStreakUI();

    }
);

