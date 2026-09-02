/* =========================================================
   STUDYMIND AI — STUDY STREAK
   ========================================================= */

"use strict";


/* =========================================================
   STORAGE
   ========================================================= */

const STREAK_HISTORY_KEY = "studyMindStudyHistory";
const LAST_STUDY_DATE_KEY = "lastStudyDate";
const PLAN_STORAGE_KEY = "studyMindPlan";
const COMPLETED_TOPICS_KEY = "studyMindCompletedTopics";
const COMPLETED_QUESTIONS_KEY = "studyMindCompletedQuestionTopics";


/* =========================================================
   HELPERS
   ========================================================= */

function getTodayKey() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function parseDateKey(key) {
    const [year, month, day] = key.split("-").map(Number);

    return new Date(
        year,
        month - 1,
        day
    );
}


function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function addDays(date, amount) {
    const result = new Date(date);

    result.setDate(
        result.getDate() + amount
    );

    return result;
}


function daysBetween(a, b) {
    const oneDay = 24 * 60 * 60 * 1000;

    return Math.round(
        Math.abs(a.getTime() - b.getTime()) / oneDay
    );
}


/* =========================================================
   HISTORY
   ========================================================= */

function getStudyHistory() {

    let history = [];

    try {
        history = JSON.parse(
            localStorage.getItem(STREAK_HISTORY_KEY) || "[]"
        );
    } catch (error) {
        history = [];
    }

    if (!Array.isArray(history)) {
        history = [];
    }

    return [
        ...new Set(
            history.filter(
                date => /^\d{4}-\d{2}-\d{2}$/.test(date)
            )
        )
    ].sort();
}


function saveStudyHistory(history) {

    const cleaned = [
        ...new Set(history)
    ].sort();

    localStorage.setItem(
        STREAK_HISTORY_KEY,
        JSON.stringify(cleaned)
    );
}


/* =========================================================
   REGISTER STUDY ACTIVITY
   ========================================================= */

function registerTodayAsStudyDay() {

    const today = getTodayKey();

    let history = getStudyHistory();

    /*
     * If the existing StudyMind system already recorded
     * today through lastStudyDate, preserve that activity.
     */
    const lastStudyDate =
        localStorage.getItem(LAST_STUDY_DATE_KEY);

    if (lastStudyDate === today) {
        if (!history.includes(today)) {
            history.push(today);
        }
    }

    /*
     * If the user has completed a topic/question today,
     * this also counts as study activity.
     */
    const completedTopics =
        getArrayFromStorage(COMPLETED_TOPICS_KEY);

    const completedQuestions =
        getArrayFromStorage(COMPLETED_QUESTIONS_KEY);

    const plan =
        getStoredPlan();

    const hasStudyData =
        completedTopics.length > 0 ||
        completedQuestions.length > 0 ||
        !!plan;

    /*
     * Do not automatically count merely opening the page.
     * Existing lastStudyDate is the main signal.
     */
    if (
        lastStudyDate === today &&
        hasStudyData
    ) {
        if (!history.includes(today)) {
            history.push(today);
        }
    }

    saveStudyHistory(history);

    return history;
}


/* =========================================================
   STORAGE PARSING
   ========================================================= */

function getArrayFromStorage(key) {

    try {

        const value =
            JSON.parse(
                localStorage.getItem(key) || "[]"
            );

        return Array.isArray(value)
            ? value
            : [];

    } catch (error) {

        return [];

    }
}


function getStoredPlan() {

    try {

        return JSON.parse(
            localStorage.getItem(PLAN_STORAGE_KEY) || "null"
        );

    } catch (error) {

        return null;

    }
}


/* =========================================================
   STREAK CALCULATION
   ========================================================= */

function calculateCurrentStreak(history) {

    if (!history.length) {
        return 0;
    }

    const dates = history
        .map(parseDateKey)
        .sort((a, b) => b - a);

    const today = parseDateKey(
        getTodayKey()
    );

    const newest = dates[0];

    const distanceFromToday =
        daysBetween(newest, today);

    /*
     * A streak is still considered active if the most
     * recent study day was today or yesterday.
     */
    if (distanceFromToday > 1) {
        return 0;
    }

    let streak = 1;

    for (let i = 0; i < dates.length - 1; i++) {

        const difference =
            daysBetween(
                dates[i],
                dates[i + 1]
            );

        if (difference === 1) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}


function calculateLongestStreak(history) {

    if (!history.length) {
        return 0;
    }

    const dates = history
        .map(parseDateKey)
        .sort((a, b) => a - b);

    let longest = 1;
    let current = 1;

    for (let i = 1; i < dates.length; i++) {

        const difference =
            daysBetween(
                dates[i],
                dates[i - 1]
            );

        if (difference === 1) {

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
   WEEK
   ========================================================= */

function getLastSevenDays() {

    const today =
        parseDateKey(
            getTodayKey()
        );

    const days = [];

    for (let i = 6; i >= 0; i--) {

        days.push(
            addDays(today, -i)
        );

    }

    return days;
}


function renderWeek(history) {

    const grid =
        document.getElementById("weekGrid");

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

    grid.innerHTML = days.map(day => {

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
                    class="week-day-box
                    ${active ? "active" : ""}
                    ${today ? "today" : ""}"
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
        document.getElementById("calendarGrid");

    const title =
        document.getElementById("calendarTitle");

    if (!grid) {
        return;
    }

    const now = new Date();

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

    for (let i = 0; i < firstDay; i++) {

        html += `
            <div class="calendar-day empty"></div>
        `;

    }

    for (let day = 1; day <= daysInMonth; day++) {

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
                class="calendar-day
                ${studied ? "studied" : ""}
                ${today ? "today" : ""}"
            >

                <div class="calendar-day-number">
                    ${day}
                </div>

                ${
                    studied
                        ? `<div class="calendar-day-dot"></div>`
                        : ""
                }

            </div>
        `;
    }

    grid.innerHTML = html;
}


/* =========================================================
   MESSAGE
   ========================================================= */

function updateStreakMessage(current) {

    const message =
        document.getElementById("streakMessage");

    const title =
        document.getElementById("streakTipTitle");

    const text =
        document.getElementById("streakTipText");

    if (current === 0) {

        if (message) {
            message.textContent =
                "Study today to start your StudyMind streak.";
        }

        if (title) {
            title.textContent =
                "Start your streak today";
        }

        if (text) {
            text.textContent =
                "Complete some study activity and keep coming back each day.";
        }

        return;
    }

    if (current === 1) {

        if (message) {
            message.textContent =
                "Great start. Come back tomorrow to make it 2 days.";
        }

        if (title) {
            title.textContent =
                "You've started!";
        }

        if (text) {
            text.textContent =
                "One consistent study day is the beginning of a strong habit.";
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
                "A few more consistent days and you'll have a full-week streak.";
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
            "Your consistency is becoming a real study habit. Don't break the chain.";
    }
}


/* =========================================================
   UPDATE UI
   ========================================================= */

function updateStreakUI() {

    const history =
        registerTodayAsStudyDay();

    const current =
        calculateCurrentStreak(history);

    const longest =
        calculateLongestStreak(history);

    const weekly =
        getLastSevenDays()
            .filter(day =>
                history.includes(
                    formatDateKey(day)
                )
            ).length;

    const currentElement =
        document.getElementById("currentStreak");

    const longestElement =
        document.getElementById("longestStreak");

    const totalElement =
        document.getElementById("totalStudyDays");

    const weeklyElement =
        document.getElementById("weeklyStudyDays");

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

    updateStreakMessage(current);

    renderWeek(history);

    renderCalendar(history);
}


/* =========================================================
   THEME
   ========================================================= */

function applyTheme() {

    const savedTheme =
        localStorage.getItem(
            "studyMindTheme"
        );

    if (savedTheme === "light") {

        document.body.classList.add(
            "light-mode"
        );

    } else {

        document.body.classList.remove(
            "light-mode"
        );

    }

    updateThemeButton();
}


function toggleTheme() {

    const isLight =
        document.body.classList.contains(
            "light-mode"
        );

    if (isLight) {

        document.body.classList.remove(
            "light-mode"
        );

        localStorage.setItem(
            "studyMindTheme",
            "dark"
        );

    } else {

        document.body.classList.add(
            "light-mode"
        );

        localStorage.setItem(
            "studyMindTheme",
            "light"
        );

    }

    updateThemeButton();
}


function updateThemeButton() {

    const button =
        document.getElementById(
            "themeButton"
        );

    if (!button) {
        return;
    }

    const isLight =
        document.body.classList.contains(
            "light-mode"
        );

    button.textContent =
        isLight ? "☀️" : "🌙";
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function openHome() {
    window.location.href = "home.html";
}


function openNewStudyPlan() {
    window.location.href = "index.html";
}


function openSummarizer() {
    window.location.href = "summarizer.html";
}


function openAISupport() {
    window.location.href = "ai-support.html";
}


function openStudyScore() {
    window.location.href = "score.html";
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
   GLOBALS
   ========================================================= */

window.toggleTheme = toggleTheme;
window.openHome = openHome;
window.openNewStudyPlan = openNewStudyPlan;
window.openSummarizer = openSummarizer;
window.openAISupport = openAISupport;
window.openStudyScore = openStudyScore;
window.logoutStudyMind = logoutStudyMind;


/* =========================================================
   INIT
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        applyTheme();

        updateStreakUI();

    }
);
