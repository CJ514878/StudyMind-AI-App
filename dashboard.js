
"use strict";

/* =========================================================
   STUDYMIND AI — DASHBOARD
   FULL REPLACEMENT

   OWNERSHIP:
   - study-timer.js owns timer state, completion and timer XP.
   - streak.js owns streak activity and streak rewards.
   - StudyMindScore provides canonical study metrics.
   - dashboard.js displays and synchronizes those values.

   FIXES:
   - Reads completed timer sessions even if Study Score is stale.
   - Reads daily study time and study history.
   - Prevents double-counting the same study minutes.
   - Refreshes dashboard after a completed timer session.
   - Refreshes today's goal and progress while the timer runs.
   - Preserves existing dashboard IDs and public API.
========================================================= */


/* =========================================================
   PREMIUM THEME
========================================================= */

(function syncDashboardPremiumTheme() {

    function applyPremiumThemeToDashboard() {
        let premium = false;

        try {
            if (typeof window.isStudyMindPremium === "function") {
                premium = !!window.isStudyMindPremium();
            } else {
                premium =
                    localStorage.getItem("studyMindPremium") === "true";
            }
        } catch (error) {
            premium =
                localStorage.getItem("studyMindPremium") === "true";
        }

        document.documentElement.classList.toggle(
            "study-mind-premium",
            premium
        );

        if (document.body) {
            document.body.classList.toggle(
                "study-mind-premium",
                premium
            );
        }
    }

    applyPremiumThemeToDashboard();

    window.addEventListener(
        "load",
        applyPremiumThemeToDashboard
    );

    window.addEventListener(
        "studyMindPremiumChanged",
        applyPremiumThemeToDashboard
    );

    document.addEventListener(
        "studyMindPremiumChanged",
        applyPremiumThemeToDashboard
    );

    window.addEventListener("storage", event => {
        if (event.key === "studyMindPremium") {
            applyPremiumThemeToDashboard();
        }
    });

})();


/* =========================================================
   STORAGE KEYS
========================================================= */

const PLAN_KEY = "studyMindPlan";
const XP_KEY = "studyMindXP";
const STREAK_KEY = "studyMindStreak";
const SESSION_KEY = "studyMindStudySessions";
const QUEST_KEY = "studyMindDailyQuests";
const COMPLETED_TOPICS_KEY = "studyMindCompletedTopics";
const LAST_COMPLETED_KEY = "studyMindLastCompletedPlanDate";
const USERNAME_KEY = "studyMindUsername";

const TIMER_SECONDS_KEY = "studyMindTimerSeconds";
const TIMER_END_KEY = "studyMindTimerEndTime";
const TIMER_RUNNING_KEY = "studyMindTimerRunning";
const TIMER_DURATION_KEY = "studyMindSelectedTimerSeconds";

const DAILY_TIME_KEY = "studyMindDailyStudyTime";
const STUDY_HISTORY_KEY = "studyMindStudyHistory";


/* =========================================================
   DASHBOARD STATE
========================================================= */

let studyPlan = loadJSON(PLAN_KEY, null);

let xp = Number(localStorage.getItem(XP_KEY) || 0);

let streak = Number(localStorage.getItem(STREAK_KEY) || 0);

const supabaseClient =
    window.supabaseClient ||
    window.studyMindSupabase ||
    null;


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    loadUser().catch(error => {
        console.warn("Dashboard username loading failed:", error);
    });

    studyPlan = loadJSON(PLAN_KEY, null);

    syncLocalStats();

    checkStudyCompletion();

    renderStats();
    renderToday();
    renderExams();
    renderQuests();
    renderLevel();
    renderRecommendation();

    setupLogout();
    setupSharedDashboardTimer();
    startDashboardTimerRefresh();

    setupDashboardEventListeners();

    ensureSharedTimerEngine();

});


/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupDashboardEventListeners() {

    window.addEventListener("storage", event => {

        if (event.key === USERNAME_KEY) {
            const username = String(event.newValue || "Student").trim();

            if (username) {
                updateDashboardUsername(username);
            }
        }

        if (
            event.key === COMPLETED_TOPICS_KEY ||
            event.key === PLAN_KEY
        ) {
            studyPlan = loadJSON(PLAN_KEY, null);

            checkStudyCompletion();
            renderStats();
            renderQuests();
            renderRecommendation();
            renderToday();
            renderExams();
        }

        if (
            event.key === XP_KEY ||
            event.key === STREAK_KEY
        ) {
            syncLocalStats();
            renderStats();
            renderLevel();
            renderQuests();
        }

        if (
            [
                TIMER_SECONDS_KEY,
                TIMER_END_KEY,
                TIMER_RUNNING_KEY,
                TIMER_DURATION_KEY
            ].includes(event.key)
        ) {
            renderSharedDashboardTimer();
            renderStats();
        }

        if (
            event.key === SESSION_KEY ||
            event.key === DAILY_TIME_KEY ||
            event.key === STUDY_HISTORY_KEY
        ) {
            renderStats();
            renderQuests();
        }

    });


    window.addEventListener("studyMindProgressUpdated", () => {
        renderStats();
        renderQuests();
    });


    window.addEventListener("studyMindStreakUpdated", () => {
        syncLocalStats();
        renderStats();
        renderLevel();
    });


    window.addEventListener("studyMindXPUpdated", () => {
        syncLocalStats();
        renderStats();
        renderLevel();
        renderQuests();
    });


    window.addEventListener("studyMindUsernameChanged", event => {

        const username = String(
            event.detail?.username ||
            localStorage.getItem(USERNAME_KEY) ||
            "Student"
        ).trim();

        if (!username) return;

        localStorage.setItem(USERNAME_KEY, username);
        updateDashboardUsername(username);

    });


    window.addEventListener("studyMindProfileUpdated", async () => {
        try {
            await loadUser();
        } catch (error) {
            console.warn("Dashboard profile refresh failed:", error);
        }
    });


    window.addEventListener("studyMindTimerChanged", () => {
        renderSharedDashboardTimer();
        renderStats();
    });


    window.addEventListener("studyMindStudyTimeUpdated", () => {
        renderStats();
        renderQuests();
    });


    window.addEventListener("studyMindStudyDataUpdated", () => {
        renderStats();
    });


    window.addEventListener("studyMindSessionRecorded", () => {
        renderStats();
        renderQuests();
    });


    window.addEventListener("studyMindScoreUpdated", () => {
        renderStats();
    });


    window.addEventListener("studyMindTimerCompleted", event => {

        console.log(
            "StudyMind Dashboard: timer completed.",
            event.detail || {}
        );

        /*
           The timer records the session before dispatching
           this event. Read the stored session records again.
        */

        syncLocalStats();

        renderStats();
        renderLevel();
        renderQuests();
        renderRecommendation();
        renderToday();
        renderSharedDashboardTimer();

    });


    window.addEventListener("studyMindStudyDayCompleted", () => {
        syncLocalStats();
        renderStats();
        renderLevel();
    });


    window.addEventListener("studyMindStreakIncreased", () => {
        syncLocalStats();
        renderStats();
        renderLevel();
    });


    document.addEventListener("visibilitychange", async () => {

        if (document.visibilityState !== "visible") return;

        try {
            await loadUser();
        } catch (error) {
            console.warn("Dashboard username refresh failed:", error);
        }

        studyPlan = loadJSON(PLAN_KEY, null);

        syncLocalStats();
        renderStats();
        renderSharedDashboardTimer();

    });


    /*
       A light refresh keeps the dashboard synchronized
       with the timer and streak engine.
    */

    window.setInterval(() => {
        syncLocalStats();
        renderStats();
        renderSharedDashboardTimer();
    }, 2000);

}


/* =========================================================
   SYNCHRONIZE LOCAL STATS
========================================================= */

function syncLocalStats() {

    xp = Math.max(
        0,
        Number(localStorage.getItem(XP_KEY) || 0)
    );

    if (
        window.StudyMindStreak &&
        typeof window.StudyMindStreak.calculateCurrentStreak === "function"
    ) {
        try {
            streak = Math.max(
                0,
                Number(
                    window.StudyMindStreak.calculateCurrentStreak() || 0
                )
            );
        } catch (error) {
            streak = Math.max(
                0,
                Number(localStorage.getItem(STREAK_KEY) || 0)
            );
        }
    } else {
        streak = Math.max(
            0,
            Number(localStorage.getItem(STREAK_KEY) || 0)
        );
    }

}


/* =========================================================
   USER
========================================================= */

async function loadUser() {

    let username = "";

    const client =
        window.supabaseClient ||
        window.studyMindSupabase ||
        null;

    if (client?.auth) {

        try {

            const { data, error } = await client.auth.getUser();

            if (error) throw error;

            const user = data?.user;

            if (user) {

                const metadata = user.user_metadata || {};

                username = String(
                    metadata.username ||
                    metadata.display_name ||
                    metadata.name ||
                    metadata.full_name ||
                    user.email?.split("@")[0] ||
                    ""
                ).trim();

                if (username) {
                    localStorage.setItem(USERNAME_KEY, username);
                    updateDashboardUsername(username);
                    return username;
                }

            }

        } catch (error) {
            console.warn("Supabase username lookup failed:", error);
        }

    }

    username = String(
        localStorage.getItem(USERNAME_KEY) || "Student"
    ).trim();

    if (!username) username = "Student";

    updateDashboardUsername(username);

    return username;

}


/* =========================================================
   UPDATE USERNAME
========================================================= */

function updateDashboardUsername(username) {

    username = String(username || "Student").trim() || "Student";

    const element = document.getElementById("username");

    if (element) {
        element.textContent = username;
    }

    const avatar = document.getElementById("avatar");

    if (avatar) {
        avatar.textContent = username.charAt(0).toUpperCase();
    }

}


/* =========================================================
   DASHBOARD STATS
========================================================= */

function renderStats() {

    syncLocalStats();

    const todayMinutes = getTodayStudyMinutes();

    const targetMinutes = getDailyTargetMinutes();

    const progress = getStudyProgress();

    setText("totalXP", xp);
    setText("headerXP", `${xp} XP`);

    setText("streak", `${streak} days`);
    setText("headerStreak", streak);

    setText("studyProgress", `${progress}%`);
    setWidth("studyProgressBar", progress);

    setText("todayGoal", formatStudyMinutes(todayMinutes));

    const goalPercentage = targetMinutes > 0
        ? Math.round(
            Math.min(
                100,
                Math.max(0, todayMinutes / targetMinutes * 100)
            )
        )
        : 0;

    setWidth("todayGoalProgress", goalPercentage);

    setText("todayStudyTime", formatStudyMinutes(todayMinutes));
    setText("studyMinutes", formatStudyMinutes(todayMinutes));

    setText(
        "streakMessage",
        streak > 0
            ? "Keep your learning momentum."
            : "Start studying today to build your streak."
    );

}


/* =========================================================
   DATE HELPERS
========================================================= */

function getLocalDateKey(date = new Date()) {

    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


/* =========================================================
   NORMALIZE A STORED DAILY-TIME VALUE
========================================================= */

function extractMinutes(value) {

    if (value === null || value === undefined) {
        return 0;
    }

    if (typeof value === "number" || typeof value === "string") {
        return Math.max(0, Number(value) || 0);
    }

    if (typeof value === "object") {

        return Math.max(
            0,
            Number(
                value.minutes ??
                value.totalMinutes ??
                value.studyMinutes ??
                value.durationMinutes ??
                0
            ) || 0
        );

    }

    return 0;

}


/* =========================================================
   READ TODAY'S DAILY-TIME RECORD
========================================================= */

function getMinutesFromDateRecord(storageKey, today) {

    const data = loadJSON(storageKey, {});

    if (!data || typeof data !== "object") {
        return 0;
    }

    return extractMinutes(data[today]);

}


/* =========================================================
   READ TODAY'S COMPLETED TIMER SESSIONS
========================================================= */

function getTodayMinutesFromSessions() {

    const sessions = loadJSON(SESSION_KEY, []);

    if (!Array.isArray(sessions)) {
        return 0;
    }

    const today = getLocalDateKey();

    return sessions.reduce((total, session) => {

        if (!session || !session.date) {
            return total;
        }

        /*
           Timer sessions use YYYY-MM-DD.
           Also accept ISO date strings for older records.
        */

        const sessionDate = String(session.date).slice(0, 10);

        if (sessionDate !== today) {
            return total;
        }

        return total + Math.max(
            0,
            Number(
                session.minutes ??
                session.durationMinutes ??
                0
            ) || 0
        );

    }, 0);

}


/* =========================================================
   GET LIVE TIMER MINUTES
========================================================= */

function getLiveTimerMinutes() {

    try {

        const running =
            localStorage.getItem(TIMER_RUNNING_KEY) === "true";

        if (!running) return 0;

        const selectedSeconds = Math.max(
            0,
            Number(localStorage.getItem(TIMER_DURATION_KEY) || 0)
        );

        const endTime = Number(
            localStorage.getItem(TIMER_END_KEY)
        );

        const storedSeconds = Number(
            localStorage.getItem(TIMER_SECONDS_KEY)
        );

        let elapsedSeconds = 0;

        if (
            selectedSeconds > 0 &&
            Number.isFinite(endTime) &&
            endTime > 0
        ) {

            const remainingSeconds = Math.max(
                0,
                Math.ceil((endTime - Date.now()) / 1000)
            );

            elapsedSeconds = Math.max(
                0,
                selectedSeconds - remainingSeconds
            );

        }

        if (elapsedSeconds <= 0) {

            const sessionStart = Number(
                localStorage.getItem("studyMindTimerSessionStart")
            );

            const baseSeconds = Math.max(
                0,
                Number(
                    localStorage.getItem("studyMindTimerBaseSeconds") ||
                    selectedSeconds
                )
            );

            if (
                Number.isFinite(sessionStart) &&
                sessionStart > 0
            ) {

                elapsedSeconds = Math.max(
                    0,
                    Math.min(
                        baseSeconds,
                        Math.floor((Date.now() - sessionStart) / 1000)
                    )
                );

            }

        }

        if (
            elapsedSeconds <= 0 &&
            selectedSeconds > 0 &&
            Number.isFinite(storedSeconds)
        ) {

            elapsedSeconds = Math.max(
                0,
                selectedSeconds - Math.max(0, storedSeconds)
            );

        }

        return elapsedSeconds / 60;

    } catch (error) {

        console.warn("Dashboard live timer read failed:", error);

        return 0;

    }

}


/* =========================================================
   GET TODAY'S STUDY MINUTES — FIXED
   ---------------------------------------------------------
   IMPORTANT:

   These are alternative records of the same study time.
   We use the largest reliable total rather than adding
   every source together.

   Example:
   - Study Score says 25 minutes.
   - Timer sessions say 50 minutes.
   - Daily history says 50 minutes.

   Result = 50 minutes, NOT 125 minutes.
========================================================= */

function getTodayStudyMinutes() {

    const today = getLocalDateKey();

    let scoreMinutes = 0;

    /*
       1. Study Score canonical metric.
    */

    try {

        if (
            window.StudyMindScore &&
            typeof window.StudyMindScore.getMetrics === "function"
        ) {

            const metrics = window.StudyMindScore.getMetrics();

            scoreMinutes = Math.max(
                0,
                Number(metrics?.todayMinutes) || 0
            );

        }

    } catch (error) {

        console.warn(
            "Dashboard Study Score metric read failed:",
            error
        );

    }


    /*
       2. Completed timer sessions.
    */

    const sessionMinutes =
        getTodayMinutesFromSessions();


    /*
       3. Daily time saved by study-timer.js.
    */

    const dailyMinutes =
        getMinutesFromDateRecord(
            DAILY_TIME_KEY,
            today
        );


    /*
       4. Study history saved by study-timer.js.
    */

    const historyMinutes =
        getMinutesFromDateRecord(
            STUDY_HISTORY_KEY,
            today
        );


    /*
       5. Live timer.
    */

    const liveMinutes =
        getLiveTimerMinutes();


    /*
       All five values represent overlapping views of
       today's study time. Never sum them together.
    */

    return Math.max(
        0,
        scoreMinutes,
        sessionMinutes,
        dailyMinutes,
        historyMinutes,
        liveMinutes
    );

}


/* =========================================================
   DAILY TARGET
========================================================= */

function getDailyTargetMinutes() {

    const possibleHours = [

        studyPlan?.hoursPerDay,
        studyPlan?.studyHours,
        studyPlan?.dailyHours,
        studyPlan?.dailyStudyHours,
        studyPlan?.hoursPerDayTarget,
        studyPlan?.dailyStudyTime,
        studyPlan?.studyTimePerDay

    ];

    let targetHours = 0;

    for (const value of possibleHours) {

        const number = Number(value);

        if (Number.isFinite(number) && number > 0) {
            targetHours = number;
            break;
        }

    }

    /*
       If no daily-hours value exists, derive the target
       from today's scheduled study sessions.
    */

    if (
        targetHours <= 0 &&
        Array.isArray(studyPlan?.schedule)
    ) {

        const today = getLocalDateKey();

        const day = studyPlan.schedule.find(item =>
            String(item?.date || "").slice(0, 10) === today
        );

        const sessions = Array.isArray(day?.sessions)
            ? day.sessions
            : [];

        let scheduledMinutes = 0;

        sessions.forEach(session => {

            const type = String(
                session?.type || ""
            ).toLowerCase();

            if (type === "break" || type === "rest") {
                return;
            }

            const duration = Number(
                session?.durationMinutes ??
                session?.duration ??
                session?.minutes ??
                0
            );

            if (Number.isFinite(duration) && duration > 0) {
                scheduledMinutes += duration;
                return;
            }

            const start = parseScheduleTime(session?.start);
            const end = parseScheduleTime(session?.end);

            if (start !== null && end !== null && end > start) {
                scheduledMinutes += end - start;
            }

        });

        if (scheduledMinutes > 0) {
            return scheduledMinutes;
        }

    }

    if (targetHours <= 0) {
        targetHours = 2;
    }

    return Math.max(1, targetHours * 60);

}


/* =========================================================
   PARSE SCHEDULE TIME
========================================================= */

function parseScheduleTime(value) {

    if (value === null || value === undefined) {
        return null;
    }

    const text = String(value).trim();

    if (!text) return null;

    const match = text.match(/^(\d{1,2}):(\d{2})/);

    if (!match) return null;

    let hours = Number(match[1]);

    const minutes = Number(match[2]);

    if (
        !Number.isFinite(hours) ||
        !Number.isFinite(minutes)
    ) {
        return null;
    }

    if (/\bpm\b/i.test(text) && hours < 12) {
        hours += 12;
    }

    if (/\bam\b/i.test(text) && hours === 12) {
        hours = 0;
    }

    if (
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
    ) {
        return null;
    }

    return hours * 60 + minutes;

}


/* =========================================================
   STUDY PROGRESS
========================================================= */

function getStudyProgress() {

    const todayMinutes = getTodayStudyMinutes();

    const targetMinutes = getDailyTargetMinutes();

    if (targetMinutes <= 0) return 0;

    return Math.round(
        Math.min(
            100,
            Math.max(0, todayMinutes / targetMinutes * 100)
        )
    );

}


/* =========================================================
   FORMAT STUDY MINUTES
========================================================= */

function formatStudyMinutes(minutes) {

    minutes = Math.max(
        0,
        Math.floor(Number(minutes) || 0)
    );

    const hours = Math.floor(minutes / 60);

    const remainingMinutes = minutes % 60;

    if (hours > 0) {
        return `${hours}h ${remainingMinutes}m`;
    }

    return `${remainingMinutes} min`;

}


/* =========================================================
   TODAY'S SCHEDULE
========================================================= */

function renderToday() {

    const container = document.getElementById("todaySchedule");

    if (!container) return;

    if (!studyPlan || !Array.isArray(studyPlan.schedule)) {

        container.innerHTML = `
            <div class="loading">
                No AI study plan found.
                <br><br>
                <a href="home.html">Create your plan →</a>
            </div>
        `;

        return;

    }

    const today = getLocalDateKey();

    const day = studyPlan.schedule.find(item =>
        String(item?.date || "").slice(0, 10) === today
    );

    if (!day) {

        container.innerHTML = `
            <div class="loading">
                No session is scheduled today.
            </div>
        `;

        return;

    }

    if (String(day.dayType || "").toLowerCase() === "rest") {

        container.innerHTML = `
            <div class="loading">
                🧘
                <br>
                <strong>AI Recovery Day</strong>
                <br>
                <span>Recovery is part of your study strategy.</span>
            </div>
        `;

        return;

    }

    const sessions = Array.isArray(day.sessions)
        ? day.sessions
        : [];

    const studySessions = sessions.filter(session => {

        const type = String(session?.type || "").toLowerCase();

        return type !== "break" && type !== "rest";

    });

    if (!studySessions.length) {

        container.innerHTML = `
            <div class="loading">
                No study sessions scheduled for today.
            </div>
        `;

        return;

    }

    container.innerHTML = studySessions.map(session => `

        <div class="study-session">

            <div>
                <div class="session-time">
                    ${escapeHTML(session?.start || "")}
                    —
                    ${escapeHTML(session?.end || "")}
                </div>

                <div class="session-type">
                    ${escapeHTML(session?.type || "Study")}
                </div>
            </div>

            <div>
                <strong>
                    ${escapeHTML(session?.subject || "Study")}
                </strong>

                <div class="session-type">
                    ${escapeHTML(session?.topic || "")}
                </div>
            </div>

            <button
                class="session-action"
                data-session="${escapeAttribute(JSON.stringify(session))}"
                type="button"
            >
                Start
            </button>

        </div>

    `).join("");

    container.querySelectorAll("[data-session]").forEach(button => {

        button.addEventListener("click", () => {

            try {

                const session = JSON.parse(button.dataset.session);

                startStudySession(session);

            } catch (error) {

                console.error("Study session parsing failed:", error);

            }

        });

    });

}


/* =========================================================
   START STUDY SESSION
========================================================= */

function startStudySession(session) {

    if (!session || typeof session !== "object") return;

    localStorage.setItem(
        "studyMindCurrentStudySession",
        JSON.stringify({
            ...session,
            startedAt: Date.now(),
            minimumMinutes: 25
        })
    );

    window.location.href = "study-session.html";

}


/* =========================================================
   SHARED TIMER ENGINE
========================================================= */

function getSharedTimerEngine() {

    if (
        window.StudyMindTimer &&
        typeof window.StudyMindTimer.getState === "function"
    ) {
        return window.StudyMindTimer;
    }

    return null;

}


function ensureSharedTimerEngine() {

    const engine = getSharedTimerEngine();

    if (
        engine &&
        typeof engine.initialize === "function"
    ) {

        try {
            engine.initialize();
        } catch (error) {
            console.warn("Shared timer initialization failed:", error);
        }

        renderSharedDashboardTimer();

        return true;

    }

    let attempts = 0;

    const retry = window.setInterval(() => {

        attempts++;

        const sharedEngine = getSharedTimerEngine();

        if (
            sharedEngine &&
            typeof sharedEngine.initialize === "function"
        ) {

            window.clearInterval(retry);

            try {
                sharedEngine.initialize();
            } catch (error) {
                console.warn("Shared timer initialization failed:", error);
            }

            renderSharedDashboardTimer();

            return;

        }

        if (attempts >= 40) {

            window.clearInterval(retry);

            console.warn("StudyMind: study-timer.js was not available.");

        }

    }, 250);

    return false;

}


function setupSharedDashboardTimer() {

    const display = document.getElementById("dashboardTimerDisplay");

    if (!display) return;

    const engine = getSharedTimerEngine();

    if (!engine) {
        console.warn("Dashboard shared timer engine unavailable.");
        return;
    }

    if (typeof engine.initialize === "function") {
        engine.initialize();
    }

    renderSharedDashboardTimer();

}


function selectSharedTimerDuration(duration) {

    duration = Number(duration);

    if (!Number.isFinite(duration) || duration <= 0) return;

    const engine = getSharedTimerEngine();

    if (engine && typeof engine.selectDuration === "function") {

        try {
            engine.selectDuration(duration);
        } catch (error) {
            console.warn("Timer duration selection failed:", error);
        }

        renderSharedDashboardTimer();
        renderStats();

        return;

    }

    if (isSharedTimerRunning()) return;

    localStorage.setItem(TIMER_DURATION_KEY, String(duration));
    localStorage.setItem(TIMER_SECONDS_KEY, String(duration));

    localStorage.removeItem(TIMER_END_KEY);

    localStorage.setItem(TIMER_RUNNING_KEY, "false");

    window.dispatchEvent(new Event("studyMindTimerChanged"));

    renderSharedDashboardTimer();

}


function getSharedTimerState() {

    const engine = getSharedTimerEngine();

    if (engine) {

        try {
            return engine.getState();
        } catch (error) {
            console.warn("Timer state lookup failed:", error);
        }

    }

    const running =
        localStorage.getItem(TIMER_RUNNING_KEY) === "true";

    const endTime = Number(localStorage.getItem(TIMER_END_KEY));

    const storedSeconds = Number(localStorage.getItem(TIMER_SECONDS_KEY));

    let seconds = Number.isFinite(storedSeconds)
        ? Math.max(0, Math.floor(storedSeconds))
        : 0;

    if (running && Number.isFinite(endTime)) {

        seconds = Math.max(
            0,
            Math.ceil((endTime - Date.now()) / 1000)
        );

    }

    return {
        running,
        seconds,
        endTime: Number.isFinite(endTime) ? endTime : null,
        selectedSeconds:
            Number(localStorage.getItem(TIMER_DURATION_KEY)) ||
            25 * 60
    };

}


function getSharedTimerRemaining() {

    const state = getSharedTimerState();

    return Math.max(0, Number(state?.seconds) || 0);

}


function isSharedTimerRunning() {

    return getSharedTimerState()?.running === true;

}


function startSharedTimer() {

    const engine = getSharedTimerEngine();

    if (engine && typeof engine.start === "function") {

        engine.start();

        renderSharedDashboardTimer();
        renderStats();

        return true;

    }

    ensureSharedTimerEngine();

    return false;

}


function pauseSharedTimer() {

    const engine = getSharedTimerEngine();

    if (engine && typeof engine.pause === "function") {

        engine.pause();

        renderSharedDashboardTimer();
        renderStats();

        return true;

    }

    return false;

}


function resetSharedTimer() {

    const engine = getSharedTimerEngine();

    if (engine && typeof engine.reset === "function") {

        engine.reset();

        renderSharedDashboardTimer();
        renderStats();

        return true;

    }

    return false;

}


/* =========================================================
   TIMER DISPLAY
========================================================= */

function renderSharedDashboardTimer() {

    const display = document.getElementById("dashboardTimerDisplay");

    if (!display) return;

    const state = getSharedTimerState();

    const remaining = Math.max(
        0,
        Number(state?.seconds) || 0
    );

    const running = state?.running === true;

    display.textContent = formatTimerSeconds(remaining);

    const status = document.getElementById("dashboardTimerStatus");

    if (status) {

        if (running) {
            status.textContent = "Focus session in progress";
        } else if (remaining <= 0) {
            status.textContent = "Session complete";
        } else {
            status.textContent = "Timer paused";
        }

    }

    const startButton = document.getElementById("dashboardTimerStart");

    if (startButton) {

        startButton.textContent = running
            ? "Pause"
            : remaining <= 0
                ? "Start"
                : "Resume";

    }

    updateTimerPresetButtons();

}


let dashboardTimerRefreshStarted = false;

function startDashboardTimerRefresh() {

    if (dashboardTimerRefreshStarted) return;

    dashboardTimerRefreshStarted = true;

    window.setInterval(() => {

        renderSharedDashboardTimer();

        if (isSharedTimerRunning()) {
            renderStats();
        }

    }, 1000);

}


function formatTimerSeconds(seconds) {

    seconds = Math.max(
        0,
        Math.floor(Number(seconds) || 0)
    );

    const minutes = Math.floor(seconds / 60);

    const remainingSeconds = seconds % 60;

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(remainingSeconds).padStart(2, "0")
    );

}


function updateTimerPresetButtons() {

    const selected = Number(
        localStorage.getItem(TIMER_DURATION_KEY)
    );

    document.querySelectorAll(".timer-preset").forEach(button => {

        const duration = Number(button.dataset.duration);

        button.classList.toggle("active", duration === selected);

    });

}


/* =========================================================
   DAILY STUDY TIME — COMPATIBILITY
========================================================= */

function updateDailyStudyTime(minutes) {

    const data = loadJSON(DAILY_TIME_KEY, {});

    const today = getLocalDateKey();

    const current = extractMinutes(data[today]);

    data[today] = current + Math.max(
        0,
        Number(minutes) || 0
    );

    localStorage.setItem(DAILY_TIME_KEY, JSON.stringify(data));

}


/* =========================================================
   PLAN TOPICS
========================================================= */

function getAllStudyTopics() {

    if (!studyPlan) return [];

    const topics = [];

    if (Array.isArray(studyPlan.subjects)) {

        studyPlan.subjects.forEach(subject => {

            if (!Array.isArray(subject?.topics)) return;

            subject.topics.forEach(topic => {

                if (typeof topic === "string") {

                    const name = topic.trim();

                    if (name) {
                        topics.push({
                            name,
                            subject: String(
                                subject?.name ||
                                subject?.subject ||
                                ""
                            ).trim()
                        });
                    }

                    return;

                }

                if (topic && typeof topic === "object") {

                    const name = String(
                        topic.name ||
                        topic.title ||
                        topic.topic ||
                        ""
                    ).trim();

                    if (!name) return;

                    topics.push({
                        ...topic,
                        name,
                        subject: String(
                            topic.subject ||
                            subject?.name ||
                            subject?.subject ||
                            ""
                        ).trim()
                    });

                }

            });

        });

    }

    if (Array.isArray(studyPlan.topics)) {

        studyPlan.topics.forEach(topic => {

            if (typeof topic === "string") {

                const name = topic.trim();

                if (name) {
                    topics.push({ name, subject: "" });
                }

                return;

            }

            if (topic && typeof topic === "object") {

                const name = String(
                    topic.name ||
                    topic.title ||
                    topic.topic ||
                    ""
                ).trim();

                if (!name) return;

                topics.push({
                    ...topic,
                    name,
                    subject: String(topic.subject || "").trim()
                });

            }

        });

    }

    const unique = new Map();

    topics.forEach(topic => {

        const key = `${topic.subject}::${topic.name}`;

        if (!unique.has(key)) {
            unique.set(key, topic);
        }

    });

    return [...unique.values()];

}


/* =========================================================
   COMPLETED TOPICS
========================================================= */

function getCompletedTopicSet() {

    const stored = loadJSON(COMPLETED_TOPICS_KEY, []);

    const completed = new Set();

    if (!Array.isArray(stored)) return completed;

    stored.forEach(item => {

        if (typeof item === "string") {

            const value = item.trim();

            if (!value) return;

            completed.add(value);

            if (value.includes("::")) {

                const topic = value.split("::").slice(1).join("::").trim();

                if (topic) completed.add(topic);

            }

            return;

        }

        if (item && typeof item === "object") {

            const subject = String(
                item.subject ||
                item.subjectName ||
                ""
            ).trim();

            const topic = String(
                item.topic ||
                item.name ||
                item.title ||
                ""
            ).trim();

            if (topic) completed.add(topic);

            if (subject && topic) {
                completed.add(`${subject}::${topic}`);
            }

        }

    });

    return completed;

}


function isTopicCompleted(topic, completedSet) {

    if (!topic) return false;

    const subject = String(
        topic.subject ||
        topic.subjectName ||
        ""
    ).trim();

    const name = String(
        topic.name ||
        topic.title ||
        topic.topic ||
        ""
    ).trim();

    if (!name) return false;

    const exact = subject ? `${subject}::${name}` : name;

    return completedSet.has(exact) || completedSet.has(name);

}


/* =========================================================
   TODAY'S REQUIRED TOPICS
========================================================= */

function getTodaysRequiredTopics() {

    if (
        window.StudyMindStreak &&
        typeof window.StudyMindStreak.getTodaysRequiredTopics === "function"
    ) {

        try {

            return window.StudyMindStreak.getTodaysRequiredTopics() || [];

        } catch (error) {

            console.warn("Streak schedule lookup failed:", error);

        }

    }

    const today = getLocalDateKey();

    const day = studyPlan?.schedule?.find(item =>
        String(item?.date || "").slice(0, 10) === today
    );

    if (!day) return getAllStudyTopics();

    const sessions = Array.isArray(day.sessions) ? day.sessions : [];

    const required = [];

    sessions.forEach(session => {

        const type = String(session?.type || "").toLowerCase();

        if (type === "break" || type === "rest") return;

        const topic = String(
            session?.topic ||
            session?.name ||
            session?.title ||
            ""
        ).trim();

        if (!topic) return;

        required.push({
            subject: String(session?.subject || "").trim(),
            topic
        });

    });

    return required;

}


/* =========================================================
   CHECK STUDY COMPLETION
========================================================= */

function checkStudyCompletion() {

    if (
        !window.StudyMindStreak ||
        typeof window.StudyMindStreak.checkTodayCompletion !== "function"
    ) {
        return false;
    }

    try {

        const completed =
            window.StudyMindStreak.checkTodayCompletion();

        syncLocalStats();

        if (completed) {
            renderStats();
            renderLevel();
        }

        return completed;

    } catch (error) {

        console.error("Study completion check failed:", error);

        return false;

    }

}


/* =========================================================
   DAILY QUESTS
========================================================= */

function renderQuests() {

    const container = document.getElementById("dailyQuests");

    if (!container) return;

    const quests = getDailyQuests();

    container.innerHTML = quests.map(quest => `

        <div class="quest">

            <div>
                <strong>${escapeHTML(quest.title)}</strong>
                <span>${escapeHTML(quest.description)}</span>
            </div>

            <div class="quest-xp">
                +${quest.xp} XP
            </div>

        </div>

    `).join("");

}


function getDailyQuests() {

    const date = getLocalDateKey();

    const stored = loadJSON(QUEST_KEY, null);

    if (
        stored &&
        stored.date === date &&
        Array.isArray(stored.quests)
    ) {
        return stored.quests;
    }

    const allTopics = getAllStudyTopics();

    const completed = getCompletedTopicSet();

    const topic = allTopics.find(item =>
        !isTopicCompleted(item, completed)
    );

    const topicName = topic?.name || "Review a topic";

    const quests = [

        {
            title: "Start a study session",
            description: "Complete at least 25 minutes.",
            xp: 20
        },

        {
            title: "Complete one topic",
            description: topicName,
            xp: 30
        },

        {
            title: "Ask StudyMind AI",
            description: "Use AI to improve your understanding.",
            xp: 10
        }

    ];

    localStorage.setItem(
        QUEST_KEY,
        JSON.stringify({ date, quests })
    );

    return quests;

}


/* =========================================================
   XP / LEVEL
========================================================= */

function renderLevel() {

    syncLocalStats();

    const level = Math.floor(xp / 100) + 1;

    const current = xp % 100;

    setText("level", level);

    setText(
        "levelText",
        `${current} / 100 XP to Level ${level + 1}`
    );

    setWidth("levelProgress", current);

}


/*
   Kept for compatibility with existing dashboard callers.
   Timer XP must continue to be awarded by study-timer.js.
*/

function awardXP(amount, reason = "") {

    amount = Math.max(0, Number(amount) || 0);

    if (amount <= 0) return;

    xp = Number(localStorage.getItem(XP_KEY) || 0) + amount;

    localStorage.setItem(XP_KEY, String(xp));

    localStorage.setItem(
        "studyMindLastXPEvent",
        JSON.stringify({
            amount,
            reason,
            timestamp: Date.now()
        })
    );

    renderStats();
    renderLevel();

    window.dispatchEvent(
        new CustomEvent("studyMindXPUpdated", {
            detail: {
                amount,
                total: xp,
                reason
            }
        })
    );

}


/* =========================================================
   AI RECOMMENDATION
========================================================= */

function renderRecommendation() {

    const element = document.getElementById("aiRecommendation");

    if (!element) return;

    const allTopics = getAllStudyTopics();

    const completed = getCompletedTopicSet();

    const next = allTopics.find(topic =>
        !isTopicCompleted(topic, completed)
    );

    if (!next) {

        element.textContent =
            "Excellent work. You've completed all topics currently in your plan.";

        return;

    }

    const subject = next.subject || "your next subject";

    const topic = next.name || next.topic || next.title || "your next topic";

    element.textContent =
        `Your next priority is ${subject}: ${topic}. Focus on understanding it first, then use active recall before moving forward.`;

}


/* =========================================================
   REFRESH PLAN
========================================================= */

document.getElementById("refreshPlan")?.addEventListener("click", async () => {

    alert(
        "StudyMind AI will rebalance your schedule using your latest progress."
    );

});


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    document.getElementById("logoutButton")?.addEventListener(
        "click",
        async () => {

            if (supabaseClient?.auth) {

                try {
                    await supabaseClient.auth.signOut();
                } catch (error) {
                    console.warn("StudyMind logout failed:", error);
                }

            }

            window.location.href = "home.html";

        }
    );

}


/* =========================================================
   EXAMS
========================================================= */

function renderExams() {

    const container = document.getElementById("examList");

    if (!container) return;

    const exams = Array.isArray(studyPlan?.exams)
        ? [...studyPlan.exams]
        : [];

    exams.sort((a, b) =>
        new Date(a?.date) - new Date(b?.date)
    );

    if (!exams.length) {

        container.innerHTML = "<p>No exams added.</p>";

        return;

    }

    container.innerHTML = exams.slice(0, 5).map(exam => {

        const examDate = new Date(exam?.date);

        const days = Math.ceil(
            (examDate - new Date()) / 86400000
        );

        return `

            <div class="exam-item">

                <div>
                    <div class="exam-name">
                        ${escapeHTML(exam?.name || "Exam")}
                    </div>

                    <div class="exam-date">
                        ${escapeHTML(exam?.date || "")}
                    </div>
                </div>

                <strong>
                    ${days >= 0 ? `${days} days` : "Passed"}
                </strong>

            </div>

        `;

    }).join("");

}


/* =========================================================
   LOAD JSON
========================================================= */

function loadJSON(key, fallback) {

    try {

        const value = localStorage.getItem(key);

        if (!value) return fallback;

        return JSON.parse(value);

    } catch (error) {

        console.warn("StudyMind JSON read failed:", key, error);

        return fallback;

    }

}


/* =========================================================
   SET TEXT
========================================================= */

function setText(id, value) {

    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }

}


/* =========================================================
   SET WIDTH
========================================================= */

function setWidth(id, percent) {

    const element = document.getElementById(id);

    if (element) {

        element.style.width =
            `${Math.max(
                0,
                Math.min(100, Number(percent) || 0)
            )}%`;

    }

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function escapeAttribute(value) {
    return escapeHTML(value);
}


/* =========================================================
   PUBLIC DASHBOARD API
========================================================= */

window.StudyMindDashboard = {

    getStudyProgress,

    getTodayStudyMinutes,

    getDailyTargetMinutes,

    getAllStudyTopics,

    getCompletedTopicSet,

    getTodaysRequiredTopics,

    checkStudyCompletion,

    renderStats,

    renderToday,

    renderQuests,

    renderRecommendation,

    startStudySession,

    awardXP,

    getSharedTimerRemaining,

    isSharedTimerRunning,

    startSharedTimer,

    pauseSharedTimer,

    resetSharedTimer,

    selectSharedTimerDuration,

    loadUser

};


console.log("StudyMind AI — Dashboard ready.");
