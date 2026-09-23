"use strict";

/* =========================================================
   STUDYMIND AI — SHARED STUDY TIMER
   SINGLE SOURCE OF TRUTH
========================================================= */

(function () {

    const KEYS = {
        SECONDS: "studyMindTimerSeconds",
        END_TIME: "studyMindTimerEndTime",
        RUNNING: "studyMindTimerRunning",
        SELECTED: "studyMindSelectedTimerSeconds",

        CURRENT_TOPIC: "studyMindCurrentTopic",
        CURRENT_TOPIC_INDEX: "studyMindCurrentTopicIndex",
        CURRENT_SESSION: "studyMindCurrentStudySession",

        STUDY_SESSIONS: "studyMindStudySessions",
        DAILY_TIME: "studyMindDailyStudyTime",
        STUDY_HISTORY: "studyMindStudyHistory",

        XP: "studyMindXP",
        TOTAL_XP: "studyMindTotalXP",
        XP_EVENTS: "studyMindXPEvents",

        STREAK_ACTIVITY: "studyMindStreakActivity",

        SESSION_START: "studyMindTimerSessionStart",
        SESSION_BASE: "studyMindTimerSessionBaseMinutes",
        AWARDED_MINUTE: "studyMindTimerAwardedMinute",

        LAST_COMPLETED: "studyMindLastTimerCompletedAt",
        LAST_CELEBRATED: "studyMindLastTimerCelebratedAt",
        COMPLETED_TIMER_SESSIONS: "studyMindCompletedTimerSessions"
    };

    const PRESETS = [25, 45, 60];

    let state = {
        seconds: 1500,
        selectedSeconds: 1500,
        running: false,
        endTime: null,
        interval: null,
        initialized: false,
        completionLocked: false,
        sessionStart: null,
        baseSeconds: 1500,
        awardedMinute: 0
    };

    /* =========================================================
       HELPERS
    ========================================================= */

    function todayKey() {
        return new Date().toISOString().slice(0, 10);
    }

    function readJSON(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : fallback;
        } catch {
            return fallback;
        }
    }

    function writeJSON(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function number(key, fallback = 0) {
        const value = Number(localStorage.getItem(key));
        return Number.isFinite(value) ? value : fallback;
    }

    function dispatch(name, detail = {}) {
        window.dispatchEvent(
            new CustomEvent(name, { detail })
        );
    }

    function formatTime(seconds) {
        seconds = Math.max(0, Math.floor(seconds));

        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;

        return (
            String(minutes).padStart(2, "0") +
            ":" +
            String(secs).padStart(2, "0")
        );
    }

    function getPlan() {
        try {
            return JSON.parse(
                localStorage.getItem("studyMindPlan") || "null"
            );
        } catch {
            return null;
        }
    }

    /* =========================================================
       TOPIC
    ========================================================= */

    function getAllTopics() {

        const plan = getPlan();

        if (!plan) return [];

        const topics = [];

        if (Array.isArray(plan.subjects)) {

            plan.subjects.forEach(subject => {

                const subjectName =
                    subject.name ||
                    subject.subject ||
                    subject.title ||
                    "General";

                const subjectTopics =
                    Array.isArray(subject.topics)
                        ? subject.topics
                        : [];

                subjectTopics.forEach(topic => {

                    const name =
                        typeof topic === "string"
                            ? topic
                            : topic.name ||
                              topic.topic ||
                              topic.title;

                    if (name) {
                        topics.push({
                            name: String(name),
                            subject: String(subjectName),
                            difficulty:
                                typeof topic === "object"
                                    ? topic.difficulty || ""
                                    : ""
                        });
                    }
                });
            });
        }

        if (
            !topics.length &&
            Array.isArray(plan.topics)
        ) {

            plan.topics.forEach(topic => {

                const name =
                    typeof topic === "string"
                        ? topic
                        : topic.name ||
                          topic.topic ||
                          topic.title;

                if (name) {
                    topics.push({
                        name: String(name),
                        subject:
                            typeof topic === "object"
                                ? topic.subject || ""
                                : ""
                    });
                }
            });
        }

        return topics;
    }

    function getCompletedTopics() {
        return readJSON(
            "studyMindCompletedTopics",
            []
        );
    }

    function isCompleted(topic) {

        const completed = getCompletedTopics();

        const exact =
            `${topic.subject}::${topic.name}`;

        return completed.some(item => {

            if (typeof item === "string") {
                return (
                    item === exact ||
                    item === topic.name
                );
            }

            if (item && typeof item === "object") {
                return (
                    item.key === exact ||
                    (
                        item.subject === topic.subject &&
                        item.topic === topic.name
                    )
                );
            }

            return false;
        });
    }

    function getCurrentTopic() {

        const stored =
            readJSON(KEYS.CURRENT_TOPIC, null);

        if (stored && stored.name) {
            return stored;
        }

        const topics = getAllTopics();

        if (!topics.length) {
            return {
                name: "Study Session",
                subject: "General"
            };
        }

        const index = Math.max(
            0,
            Math.min(
                Number(
                    localStorage.getItem(
                        KEYS.CURRENT_TOPIC_INDEX
                    ) || 0
                ),
                topics.length - 1
            )
        );

        return topics[index];
    }

    function findRecommendedTopic() {

        const topics = getAllTopics();

        if (!topics.length) return null;

        const incomplete =
            topics.find(topic => !isCompleted(topic));

        return incomplete || topics[0];
    }

    /* =========================================================
       PERSISTENCE
    ========================================================= */

    function persist() {

        localStorage.setItem(
            KEYS.SECONDS,
            String(Math.max(0, Math.floor(state.seconds)))
        );

        localStorage.setItem(
            KEYS.SELECTED,
            String(state.selectedSeconds)
        );

        localStorage.setItem(
            KEYS.RUNNING,
            state.running ? "true" : "false"
        );

        if (state.running && state.endTime) {
            localStorage.setItem(
                KEYS.END_TIME,
                String(state.endTime)
            );
        } else {
            localStorage.removeItem(KEYS.END_TIME);
        }

        if (state.sessionStart) {
            localStorage.setItem(
                KEYS.SESSION_START,
                String(state.sessionStart)
            );
        } else {
            localStorage.removeItem(KEYS.SESSION_START);
        }

        localStorage.setItem(
            KEYS.SESSION_BASE,
            String(state.baseSeconds)
        );

        localStorage.setItem(
            KEYS.AWARDED_MINUTE,
            String(state.awardedMinute)
        );
    }

    /* =========================================================
       LOAD
    ========================================================= */

    function loadState() {

        const selected =
            Number(
                localStorage.getItem(
                    KEYS.SELECTED
                )
            );

        const savedSeconds =
            Number(
                localStorage.getItem(
                    KEYS.SECONDS
                )
            );

        const savedRunning =
            localStorage.getItem(
                KEYS.RUNNING
            ) === "true";

        const savedEnd =
            Number(
                localStorage.getItem(
                    KEYS.END_TIME
                )
            );

        state.selectedSeconds =
            PRESETS.includes(selected / 60)
                ? selected
                : 1500;

        state.baseSeconds =
            Number(
                localStorage.getItem(
                    KEYS.SESSION_BASE
                )
            ) || state.selectedSeconds;

        state.awardedMinute =
            Number(
                localStorage.getItem(
                    KEYS.AWARDED_MINUTE
                )
            ) || 0;

        state.sessionStart =
            Number(
                localStorage.getItem(
                    KEYS.SESSION_START
                )
            ) || null;

        if (
            savedRunning &&
            savedEnd &&
            savedEnd > Date.now()
        ) {

            state.running = true;
            state.endTime = savedEnd;

            state.seconds = Math.ceil(
                (savedEnd - Date.now()) / 1000
            );

        } else if (
            savedRunning &&
            savedEnd &&
            savedEnd <= Date.now()
        ) {

            state.seconds = 0;
            state.running = false;
            state.endTime = null;

            persist();

            finishTimer();

        } else {

            state.running = false;
            state.endTime = null;

            state.seconds =
                Number.isFinite(savedSeconds) &&
                savedSeconds >= 0
                    ? savedSeconds
                    : state.selectedSeconds;
        }
    }

    /* =========================================================
       ELAPSED TIME
    ========================================================= */

    function getElapsedSeconds() {

        return Math.max(
            0,
            state.baseSeconds - state.seconds
        );
    }

    function getLiveMinutes() {

        return Math.floor(
            getElapsedSeconds() / 60
        );
    }

    /* =========================================================
       XP
    ========================================================= */

    function getXP() {
        return number(KEYS.XP, 0);
    }

    function awardXP(amount, reason) {

        amount = Math.max(
            0,
            Math.floor(Number(amount) || 0)
        );

        if (!amount) return;

        const oldXP = getXP();
        const newXP = oldXP + amount;

        localStorage.setItem(
            KEYS.XP,
            String(newXP)
        );

        localStorage.setItem(
            KEYS.TOTAL_XP,
            String(newXP)
        );

        dispatch("studyMindXPUpdated", {
            oldXP,
            newXP,
            amount,
            reason
        });

        dispatch("studyMindProgressUpdated");
    }

    function awardLiveXP() {

        if (!state.running) return;

        const liveMinutes =
            getLiveMinutes();

        if (
            liveMinutes <=
            state.awardedMinute
        ) {
            return;
        }

        const difference =
            liveMinutes -
            state.awardedMinute;

        state.awardedMinute = liveMinutes;

        persist();

        awardXP(
            difference,
            "timer-minute"
        );
    }

    /* =========================================================
       DAILY STUDY TIME
    ========================================================= */

    function updateDailyLiveTime() {

        const today = todayKey();

        const daily =
            readJSON(KEYS.DAILY_TIME, {});

        if (!daily[today]) {
            daily[today] = 0;
        }

        /*
         * The timer's completed minutes are persisted here
         * only as the live maximum. This prevents repeatedly
         * adding the same minute every render.
         */
        const currentLive =
            getLiveMinutes();

        const existing =
            Number(daily[today]) || 0;

        const sessions =
            readJSON(KEYS.STUDY_SESSIONS, []);

        let completedMinutes = 0;

        sessions.forEach(session => {
            if (
                session &&
                session.date === today
            ) {
                completedMinutes +=
                    Number(
                        session.minutes
                    ) || 0;
            }
        });

        daily[today] =
            Math.max(
                existing,
                completedMinutes + currentLive
            );

        writeJSON(
            KEYS.DAILY_TIME,
            daily
        );

        dispatch("studyMindStudyTimeUpdated", {
            todayMinutes: daily[today]
        });
    }

    /* =========================================================
       STREAK ACTIVITY
    ========================================================= */

    function recordStudyActivity() {

        const today = todayKey();

        const activity =
            readJSON(
                KEYS.STREAK_ACTIVITY,
                {}
            );

        activity[today] = true;

        writeJSON(
            KEYS.STREAK_ACTIVITY,
            activity
        );

        if (
            window.StudyMindStreak &&
            typeof window.StudyMindStreak.recordStudyActivity ===
                "function"
        ) {
            window.StudyMindStreak.recordStudyActivity();
        }

        dispatch(
            "studyMindStreakUpdated",
            {
                date: today,
                source: "timer"
            }
        );
    }

    /* =========================================================
       RECORD COMPLETED SESSION
    ========================================================= */

    function recordStudySession() {

        const today = todayKey();

        const sessions =
            readJSON(
                KEYS.STUDY_SESSIONS,
                []
            );

        const minutes =
            Math.max(
                0,
                Math.floor(
                    state.baseSeconds / 60
                )
            );

        const topic =
            getCurrentTopic();

        sessions.push({
            id:
                `timer-${Date.now()}`,
            date: today,
            startedAt:
                state.sessionStart
                    ? new Date(
                        state.sessionStart
                    ).toISOString()
                    : new Date().toISOString(),
            completedAt:
                new Date().toISOString(),
            minutes,
            xp: minutes,
            subject:
                topic.subject || "General",
            topic:
                topic.name || "Study Session",
            source: "shared-timer"
        });

        writeJSON(
            KEYS.STUDY_SESSIONS,
            sessions
        );

        localStorage.setItem(
            KEYS.COMPLETED_TIMER_SESSIONS,
            String(
                number(
                    KEYS.COMPLETED_TIMER_SESSIONS,
                    0
                ) + 1
            )
        );

        updateDailyLiveTime();

        dispatch(
            "studyMindSessionRecorded",
            {
                minutes,
                topic
            }
        );
    }

    /* =========================================================
       CELEBRATION
    ========================================================= */

    function celebrateCompletion() {

        const timestamp =
            Date.now();

        localStorage.setItem(
            KEYS.LAST_COMPLETED,
            String(timestamp)
        );

        if (
            window.Milo &&
            typeof window.Milo.miloStudySessionComplete ===
                "function"
        ) {

            let streak = 0;

            if (
                window.StudyMindStreak &&
                typeof window.StudyMindStreak.calculateCurrentStreak ===
                    "function"
            ) {
                streak =
                    window.StudyMindStreak.calculateCurrentStreak();
            }

            window.Milo.miloStudySessionComplete(
                streak
            );

        } else if (
            window.Milo &&
            typeof window.Milo.celebrateStudySession ===
                "function"
        ) {

            window.Milo.celebrateStudySession(
                Math.floor(
                    state.baseSeconds / 60
                )
            );
        }

        dispatch(
            "studyMindTimerCompleted",
            {
                minutes:
                    Math.floor(
                        state.baseSeconds / 60
                    ),
                timestamp
            }
        );
    }

    /* =========================================================
       FINISH
    ========================================================= */

    function finishTimer() {

        if (state.completionLocked) {
            return;
        }

        state.completionLocked = true;

        stopInterval();

        state.seconds = 0;
        state.running = false;
        state.endTime = null;

        /*
         * Award any final full minute.
         */
        if (
            state.awardedMinute <
            Math.floor(
                state.baseSeconds / 60
            )
        ) {

            const difference =
                Math.floor(
                    state.baseSeconds / 60
                ) -
                state.awardedMinute;

            state.awardedMinute =
                Math.floor(
                    state.baseSeconds / 60
                );

            awardXP(
                difference,
                "timer-final-minute"
            );
        }

        const durationMinutes =
            Math.floor(
                state.baseSeconds / 60
            );

        if (durationMinutes > 0) {

            recordStudySession();
            recordStudyActivity();

            /*
             * Notify Study Score.
             */
            if (
                window.StudyMindScore &&
                typeof window.StudyMindScore.refresh ===
                    "function"
            ) {
                window.StudyMindScore.refresh();
            }

            /*
             * Notify Rewards.
             */
            if (
                window.StudyMindRewards &&
                typeof window.StudyMindRewards.check ===
                    "function"
            ) {
                setTimeout(
                    () => {
                        window.StudyMindRewards.check();
                    },
                    300
                );
            }

            celebrateCompletion();

            showCompletionModal(
                durationMinutes,
                durationMinutes
            );
        }

        persist();

        render();
        renderStats();
        renderHistory();

        dispatch(
            "studyMindTimerChanged",
            getState()
        );

        setTimeout(() => {
            state.completionLocked = false;
        }, 500);
    }

    /* =========================================================
       INTERVAL
    ========================================================= */

    function stopInterval() {

        if (state.interval) {
            clearInterval(state.interval);
            state.interval = null;
        }
    }

    function startInterval() {

        stopInterval();

        state.interval =
            setInterval(
                updateRemaining,
                250
            );
    }

    function updateRemaining() {

        if (
            !state.running ||
            !state.endTime
        ) {
            return;
        }

        const remaining =
            Math.max(
                0,
                Math.ceil(
                    (state.endTime -
                        Date.now()) /
                    1000
                )
            );

        state.seconds = remaining;

        awardLiveXP();
        updateDailyLiveTime();

        persist();

        render();
        renderStats();

        dispatch(
            "studyMindTimerChanged",
            getState()
        );

        if (remaining <= 0) {
            finishTimer();
        }
    }

    /* =========================================================
       START
    ========================================================= */

    function startTimer() {

        if (state.running) {
            return;
        }

        /*
         * If the timer is at zero, start a fresh session.
         */
        if (state.seconds <= 0) {

            state.seconds =
                state.selectedSeconds;

            state.baseSeconds =
                state.selectedSeconds;

            state.awardedMinute = 0;
            state.sessionStart = Date.now();

        } else if (!state.sessionStart) {

            /*
             * First start of this timer.
             */
            state.sessionStart =
                Date.now();

            /*
             * baseSeconds must represent the
             * ORIGINAL selected duration.
             */
            state.baseSeconds =
                state.baseSeconds > 0
                    ? state.baseSeconds
                    : state.selectedSeconds;
        }

        state.running = true;

        state.endTime =
            Date.now() +
            state.seconds * 1000;

        state.completionLocked = false;

        persist();
        startInterval();

        render();

        dispatch(
            "studyMindTimerChanged",
            getState()
        );
    }

    /* =========================================================
       PAUSE
    ========================================================= */

    function pauseTimer() {

        if (!state.running) {
            return;
        }

        updateRemaining();

        state.running = false;
        state.endTime = null;

        /*
         * DO NOT reset sessionStart.
         * This is what makes pause/resume work correctly.
         */
        persist();
        stopInterval();

        render();

        dispatch(
            "studyMindTimerChanged",
            getState()
        );
    }

    /* =========================================================
       RESET
    ========================================================= */

    function resetTimer() {

        stopInterval();

        state.running = false;
        state.endTime = null;
        state.seconds =
            state.selectedSeconds;

        state.baseSeconds =
            state.selectedSeconds;

        state.sessionStart = null;
        state.awardedMinute = 0;
        state.completionLocked = false;

        persist();

        render();
        renderStats();

        dispatch(
            "studyMindTimerChanged",
            getState()
        );
    }

    /* =========================================================
       DURATION
    ========================================================= */

    function selectDuration(seconds) {

        seconds =
            Number(seconds);

        if (!PRESETS.includes(seconds / 60)) {
            return;
        }

        if (state.running) {
            return;
        }

        state.selectedSeconds = seconds;
        state.seconds = seconds;
        state.baseSeconds = seconds;
        state.sessionStart = null;
        state.awardedMinute = 0;

        persist();

        render();

        dispatch(
            "studyMindTimerChanged",
            getState()
        );
    }

    /* =========================================================
       RECOMMENDED SESSION
    ========================================================= */

    function useRecommendedSession() {

        const topic =
            findRecommendedTopic();

        if (!topic) {
            alert(
                "Create a study plan first so StudyMind can recommend a topic."
            );
            return false;
        }

        writeJSON(
            KEYS.CURRENT_TOPIC,
            topic
        );

        localStorage.setItem(
            KEYS.CURRENT_TOPIC_INDEX,
            String(
                Math.max(
                    0,
                    getAllTopics().findIndex(
                        t =>
                            t.name === topic.name &&
                            t.subject === topic.subject
                    )
                )
            )
        );

        /*
         * Always start a NEW recommended session.
         */
        stopInterval();

        state.running = false;
        state.endTime = null;
        state.selectedSeconds = 1500;
        state.seconds = 1500;
        state.baseSeconds = 1500;
        state.sessionStart = null;
        state.awardedMinute = 0;
        state.completionLocked = false;

        persist();
        startTimer();

        render();

        dispatch(
            "studyMindRecommendedSessionStarted",
            { topic }
        );

        return true;
    }

    /* =========================================================
       UI
    ========================================================= */

    function setText(id, value) {

        const element =
            document.getElementById(id);

        if (element) {
            element.textContent =
                String(value);
        }
    }

    function render() {

        const display =
            document.getElementById(
                "timerDisplay"
            );

        const dashboardDisplay =
            document.getElementById(
                "dashboardTimerDisplay"
            );

        const value =
            formatTime(state.seconds);

        if (display) {
            display.textContent = value;
        }

        if (dashboardDisplay) {
            dashboardDisplay.textContent = value;
        }

        setText(
            "sessionStatus",
            state.running
                ? "Studying"
                : state.seconds === state.selectedSeconds
                    ? "Ready to study"
                    : "Paused"
        );

        setText(
            "timerState",
            state.running
                ? "Focus time"
                : "Paused"
        );

        setText(
            "dashboardTimerStatus",
            state.running
                ? "Studying"
                : "Ready to study"
        );

        setText(
            "elapsedText",
            `${getLiveMinutes()} min studied`
        );

        setText(
            "remainingText",
            `${Math.ceil(
                state.seconds / 60
            )} min remaining`
        );

        const progress =
            state.baseSeconds > 0
                ? (
                    (
                        state.baseSeconds -
                        state.seconds
                    ) /
                    state.baseSeconds
                ) * 100
                : 0;

        const fill =
            document.getElementById(
                "timerProgress"
            );

        if (fill) {
            fill.style.width =
                `${Math.min(
                    100,
                    Math.max(0, progress)
                )}%`;
        }

        const button =
            document.getElementById(
                "startPauseTimer"
            );

        if (button) {
            button.textContent =
                state.running
                    ? "Pause"
                    : "Start Timer";
        }

        const dashboardButton =
            document.getElementById(
                "dashboardTimerStart"
            );

        if (dashboardButton) {
            dashboardButton.textContent =
                state.running
                    ? "Pause"
                    : "Start Timer";
        }

        const topic =
            getCurrentTopic();

        setText(
            "currentSubject",
            topic.subject || "Study Session"
        );

        setText(
            "currentTopic",
            topic.name || "Choose a topic"
        );
    }

    /* =========================================================
       STATS
    ========================================================= */

    function getCompletedSessionData() {

        const today =
            todayKey();

        const sessions =
            readJSON(
                KEYS.STUDY_SESSIONS,
                []
            );

        return sessions.filter(
            session =>
                session &&
                session.date === today
        );
    }

    function getTodayMinutes() {

        const sessions =
            getCompletedSessionData();

        const completedMinutes =
            sessions.reduce(
                (total, session) =>
                    total +
                    (
                        Number(
                            session.minutes
                        ) || 0
                    ),
                0
            );

        return Math.max(
            completedMinutes,
            getLiveMinutes() +
                completedMinutes
        );
    }

    function getTodaySessionCount() {

        const sessions =
            getCompletedSessionData();

        /*
         * A currently active session counts as
         * today's session once at least one minute
         * has actually been studied.
         */
        const live =
            state.running &&
            getLiveMinutes() > 0
                ? 1
                : 0;

        return sessions.length + live;
    }

    function getTodayXP() {

        const sessions =
            getCompletedSessionData();

        const completedXP =
            sessions.reduce(
                (total, session) =>
                    total +
                    (
                        Number(
                            session.xp
                        ) || 0
                    ),
                0
            );

        return completedXP +
            getLiveMinutes();
    }

    function renderStats() {

        setText(
            "todayMinutes",
            `${getTodayMinutes()} min`
        );

        setText(
            "todaySessions",
            String(
                getTodaySessionCount()
            )
        );

        setText(
            "todayXP",
            `${getTodayXP()} XP`
        );
    }

    /* =========================================================
       HISTORY
    ========================================================= */

    function renderHistory() {

        const container =
            document.getElementById(
                "sessionHistory"
            );

        const count =
            document.getElementById(
                "historyCount"
            );

        if (!container) {
            return;
        }

        const sessions =
            readJSON(
                KEYS.STUDY_SESSIONS,
                []
            );

        if (count) {
            count.textContent =
                `${sessions.length} session${
                    sessions.length === 1
                        ? ""
                        : "s"
                }`;
        }

        if (!sessions.length) {

            container.innerHTML =
                `<div class="empty-history">
                    No completed study sessions yet.
                </div>`;

            return;
        }

        container.innerHTML =
            sessions
                .slice()
                .reverse()
                .slice(0, 10)
                .map(session => `
                    <div class="history-item">
                        <div>
                            <strong>
                                ${escapeHTML(
                                    session.topic ||
                                    "Study Session"
                                )}
                            </strong>
                            <small>
                                ${escapeHTML(
                                    session.subject ||
                                    "General"
                                )}
                            </small>
                        </div>
                        <div>
                            <strong>
                                ${Number(
                                    session.minutes || 0
                                )} min
                            </strong>
                            <small>
                                +${Number(
                                    session.xp || 0
                                )} XP
                            </small>
                        </div>
                    </div>
                `)
                .join("");
    }

    function escapeHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /* =========================================================
       COMPLETION MODAL
    ========================================================= */

    function showCompletionModal(
        minutes,
        xp
    ) {

        const modal =
            document.getElementById(
                "completionModal"
            );

        if (!modal) {
            return;
        }

        setText(
            "earnedMinutes",
            `${minutes} min`
        );

        setText(
            "earnedXP",
            `+${xp} XP`
        );

        setText(
            "completionMessage",
            "Great work! Your study progress has been recorded."
        );

        modal.classList.add("active");
        modal.style.display = "flex";
    }

    function closeCompletionModal() {

        const modal =
            document.getElementById(
                "completionModal"
            );

        if (!modal) return;

        modal.classList.remove("active");
        modal.style.display = "none";
    }

    /* =========================================================
       CONTROLS
    ========================================================= */

    function setupControls() {

        if (
            window.__studyMindTimerControls
        ) {
            return;
        }

        window.__studyMindTimerControls =
            true;

        const startButtons = [
            document.getElementById(
                "startPauseTimer"
            ),
            document.getElementById(
                "dashboardTimerStart"
            ),
            document.getElementById(
                "timerStart"
            )
        ].filter(Boolean);

        startButtons.forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    if (state.running) {
                        pauseTimer();
                    } else {
                        startTimer();
                    }
                }
            );
        });

        const resetButtons = [
            document.getElementById(
                "resetTimer"
            ),
            document.getElementById(
                "dashboardTimerReset"
            ),
            document.getElementById(
                "timerReset"
            )
        ].filter(Boolean);

        resetButtons.forEach(button => {

            button.addEventListener(
                "click",
                resetTimer
            );
        });

        document
            .querySelectorAll(
                ".duration-button"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        selectDuration(
                            Number(
                                button.dataset.minutes
                            ) * 60
                        );
                    }
                );
            });

        document
            .querySelectorAll(
                ".timer-preset"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const seconds =
                            Number(
                                button.dataset.duration
                            ) ||
                            Number(
                                button.dataset.minutes
                            ) * 60;

                        selectDuration(
                            seconds
                        );
                    }
                );
            });

        const recommended =
            document.getElementById(
                "useRecommended"
            );

        if (recommended) {

            recommended.addEventListener(
                "click",
                useRecommendedSession
            );
        }

        const close =
            document.getElementById(
                "closeCompletion"
            );

        if (close) {
            close.addEventListener(
                "click",
                closeCompletionModal
            );
        }

        window.addEventListener(
            "storage",
            event => {

                if (
                    Object.values(KEYS)
                        .includes(event.key)
                ) {
                    loadState();
                    render();
                    renderStats();
                }
            }
        );
    }

    /* =========================================================
       RECOMMENDATION
    ========================================================= */

    function renderRecommendation() {

        const topic =
            findRecommendedTopic();

        if (!topic) return;

        setText(
            "recommendedSubject",
            topic.subject || "Study"
        );

        setText(
            "recommendedTopic",
            topic.name || "Study Session"
        );
    }

    /* =========================================================
       STATE
    ========================================================= */

    function getState() {

        return {
            seconds: state.seconds,
            selectedSeconds:
                state.selectedSeconds,
            running: state.running,
            endTime: state.endTime,
            elapsedSeconds:
                getElapsedSeconds(),
            liveMinutes:
                getLiveMinutes(),
            currentTopic:
                getCurrentTopic(),
            todayMinutes:
                getTodayMinutes(),
            todaySessions:
                getTodaySessionCount(),
            todayXP:
                getTodayXP()
        };
    }

    /* =========================================================
       INITIALIZE
    ========================================================= */

    function initialize() {

        if (state.initialized) {
            return;
        }

        state.initialized = true;

        loadState();
        setupControls();
        render();
        renderStats();
        renderHistory();
        renderRecommendation();

        if (state.running) {
            startInterval();
        }

        window.addEventListener(
            "studyMindPlanCreated",
            () => {

                renderRecommendation();
                render();
            }
        );

        /*
         * Keep all open StudyMind pages synchronized.
         */
        setInterval(() => {

            if (state.running) {
                updateRemaining();
            }

        }, 1000);
    }

    /* =========================================================
       PUBLIC API
    ========================================================= */

    window.StudyMindTimer = {

        initialize,

        start: startTimer,
        pause: pauseTimer,
        reset: resetTimer,

        complete: finishTimer,

        startTimer,
        pauseTimer,
        resetTimer,

        selectDuration,

        useRecommendedSession,

        getState,
        getCurrentTopic,

        getElapsedSeconds,
        getLiveMinutes,

        getTodayMinutes,
        getTodaySessionCount,
        getTodayXP,

        recordStreakActivity,

        render,
        renderStats,
        renderHistory,

        calculateXP: minutes => {
            return Math.max(
                0,
                Math.floor(
                    Number(minutes) || 0
                )
            );
        }
    };

    /*
     * Pages can load this file before or after DOMContentLoaded.
     */
    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            { once: true }
        );
    } else {
        initialize();
    }

})();
