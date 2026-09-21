"use strict";

/* =========================================================
   STUDYMIND AI — SHARED STUDY TIMER
   ---------------------------------------------------------
   ONE AUTHORITATIVE TIMER ENGINE

   SHARED TIMER KEYS
   -----------------
   studyMindTimerSeconds
   studyMindTimerEndTime
   studyMindTimerRunning
   studyMindSelectedTimerSeconds

   STREAK KEYS
   -----------
   studyMindStreakActivity
   studyMindLastTimerCompletedAt
   studyMindLastTimerCelebratedAt

   SESSION / XP KEYS
   -----------------
   studyMindCurrentStudySession
   studyMindCurrentTopic
   studyMindCurrentSubject
   studyMindStudySessions
   studyMindXP
   studyMindTotalXP

   IMPORTANT
   ---------
   Dashboard Timer
   Study Timer
   Study Session

   all use this SAME timer engine.

   TIMER COMPLETE
        ↓
   SESSION SAVED
        ↓
   XP SAVED
        ↓
   TODAY'S ACTIVITY SAVED
        ↓
   STREAK UPDATED
        ↓
   PROGRESS UI UPDATED
        ↓
   EVENTS DISPATCHED
========================================================= */


window.StudyMindTimer = (() => {

    /* =====================================================
       CONSTANTS
    ===================================================== */

    const KEYS = {

        SECONDS:
            "studyMindTimerSeconds",

        END_TIME:
            "studyMindTimerEndTime",

        RUNNING:
            "studyMindTimerRunning",

        /*
         * IMPORTANT:
         * This key stores SECONDS.
         *
         * Therefore:
         * 25 min = 1500
         * 45 min = 2700
         * 60 min = 3600
         *
         * A 5-second test can also use:
         * 5
         */
        DURATION:
            "studyMindSelectedTimerSeconds",

        SESSION:
            "studyMindCurrentStudySession",

        CURRENT_TOPIC:
            "studyMindCurrentTopic",

        CURRENT_SUBJECT:
            "studyMindCurrentSubject",

        SESSIONS:
            "studyMindStudySessions",

        XP:
            "studyMindXP",

        TOTAL_XP:
            "studyMindTotalXP",

        STREAK_ACTIVITY:
            "studyMindStreakActivity",

        LAST_COMPLETED:
            "studyMindLastTimerCompletedAt",

        LAST_CELEBRATED:
            "studyMindLastTimerCelebratedAt"

    };


    /* =====================================================
       STATE
    ===================================================== */

    let selectedDurationSeconds =
        Number(
            localStorage.getItem(
                KEYS.DURATION
            )
        ) || 1500;


    let remainingSeconds =
        Number(
            localStorage.getItem(
                KEYS.SECONDS
            )
        );


    let timerRunning =
        localStorage.getItem(
            KEYS.RUNNING
        ) === "true";


    let timerEndTime =
        Number(
            localStorage.getItem(
                KEYS.END_TIME
            )
        ) || 0;


    let timerInterval =
        null;


    let completionBeingHandled =
        false;


    let pageInitialized =
        false;


    /* =====================================================
       DOM HELPER
    ===================================================== */

    function $(id) {

        return document.getElementById(id);

    }


    /* =====================================================
       JSON HELPERS
    ===================================================== */

    function safeJSON(
        key,
        fallback
    ) {

        try {

            const value =
                localStorage.getItem(
                    key
                );


            if (!value) {

                return fallback;

            }


            return JSON.parse(
                value
            );

        } catch {

            return fallback;

        }

    }


    function saveJSON(
        key,
        value
    ) {

        try {

            localStorage.setItem(
                key,
                JSON.stringify(
                    value
                )
            );

        } catch {}

    }


    /* =====================================================
       DATE
    ===================================================== */

    function todayKey() {

        const d =
            new Date();


        return [

            d.getFullYear(),

            String(
                d.getMonth() + 1
            ).padStart(
                2,
                "0"
            ),

            String(
                d.getDate()
            ).padStart(
                2,
                "0"
            )

        ].join("-");

    }


    function localDateKey(
        date
    ) {

        return [

            date.getFullYear(),

            String(
                date.getMonth() + 1
            ).padStart(
                2,
                "0"
            ),

            String(
                date.getDate()
            ).padStart(
                2,
                "0"
            )

        ].join("-");

    }


    /* =====================================================
       FORMAT TIME
    ===================================================== */

    function formatTime(
        totalSeconds
    ) {

        totalSeconds =
            Math.max(
                0,
                Math.floor(
                    Number(
                        totalSeconds
                    ) || 0
                )
            );


        const minutes =
            Math.floor(
                totalSeconds / 60
            );


        const seconds =
            totalSeconds % 60;


        return (

            String(
                minutes
            ).padStart(
                2,
                "0"
            )

            +

            ":"

            +

            String(
                seconds
            ).padStart(
                2,
                "0"
            )

        );

    }


    /* =====================================================
       PLAN
    ===================================================== */

    function loadPlan() {

        const candidates = [

            "studyMindPlan",

            "studyData"

        ];


        for (
            const key of candidates
        ) {

            const raw =
                localStorage.getItem(
                    key
                );


            if (!raw) {

                continue;

            }


            try {

                const plan =
                    JSON.parse(
                        raw
                    );


                if (plan) {

                    return plan;

                }

            } catch {}

        }


        return null;

    }


    function normalizeTopics(
        plan
    ) {

        if (!plan) {

            return [];

        }


        const result = [];


        if (
            Array.isArray(
                plan.subjects
            )
        ) {

            plan.subjects.forEach(
                subject => {

                    if (!subject) {

                        return;

                    }


                    const subjectName =
                        subject.name ||
                        subject.subject ||
                        subject.title ||
                        "Subject";


                    const topics =
                        Array.isArray(
                            subject.topics
                        )
                            ? subject.topics
                            : [];


                    topics.forEach(
                        topic => {

                            if (
                                typeof topic ===
                                "string"
                            ) {

                                result.push({

                                    subject:
                                        subjectName,

                                    topic:
                                        topic

                                });

                                return;

                            }


                            if (
                                topic &&
                                typeof topic ===
                                "object"
                            ) {

                                result.push({

                                    subject:
                                        topic.subject ||
                                        subjectName,

                                    topic:
                                        topic.name ||
                                        topic.topic ||
                                        topic.title ||
                                        "Study Topic"

                                });

                            }

                        }
                    );

                }
            );

        }


        if (
            result.length === 0 &&
            Array.isArray(
                plan.topics
            )
        ) {

            plan.topics.forEach(
                topic => {

                    if (
                        typeof topic ===
                        "string"
                    ) {

                        result.push({

                            subject:
                                plan.subject ||
                                "Study",

                            topic

                        });

                    }

                }
            );

        }


        return result;

    }


    /* =====================================================
       CURRENT STUDY TOPIC
    ===================================================== */

    function getCurrentStudyTopic() {

        const session =
            safeJSON(
                KEYS.SESSION,
                null
            );


        if (
            session &&
            session.topic
        ) {

            return {

                subject:
                    session.subject ||
                    "Study",

                topic:
                    session.topic

            };

        }


        const storedTopic =
            localStorage.getItem(
                KEYS.CURRENT_TOPIC
            );


        const storedSubject =
            localStorage.getItem(
                KEYS.CURRENT_SUBJECT
            );


        if (storedTopic) {

            return {

                subject:
                    storedSubject ||
                    "Study",

                topic:
                    storedTopic

            };

        }


        const plan =
            loadPlan();


        const topics =
            normalizeTopics(
                plan
            );


        const completed =
            safeJSON(
                "studyMindCompletedTopics",
                []
            );


        const next =
            topics.find(
                item => {

                    const key =
                        `${item.subject}::${item.topic}`;


                    return (
                        !completed.includes(
                            key
                        ) &&
                        !completed.includes(
                            item.topic
                        )
                    );

                }
            );


        return (
            next ||
            topics[0] ||
            null
        );

    }


    /* =====================================================
       CURRENT TOPIC UI
    ===================================================== */

    function renderCurrentTopic() {

        const current =
            getCurrentStudyTopic();


        const subjectElement =
            $("currentSubject");


        const topicElement =
            $("currentTopic");


        const recommendedSubject =
            $("recommendedSubject");


        const recommendedTopic =
            $("recommendedTopic");


        if (!current) {

            if (subjectElement) {

                subjectElement.textContent =
                    "Ready to study";

            }


            if (topicElement) {

                topicElement.textContent =
                    "Create a study plan to begin.";

            }


            if (recommendedSubject) {

                recommendedSubject.textContent =
                    "No active topic";

            }


            if (recommendedTopic) {

                recommendedTopic.textContent =
                    "Create a study plan to let AI choose your next topic.";

            }


            return;

        }


        if (subjectElement) {

            subjectElement.textContent =
                current.subject;

        }


        if (topicElement) {

            topicElement.textContent =
                current.topic;

        }


        if (recommendedSubject) {

            recommendedSubject.textContent =
                current.subject;

        }


        if (recommendedTopic) {

            recommendedTopic.textContent =
                current.topic;

        }

    }


    /* =====================================================
       NORMALIZE OLD TIMER STORAGE
       -----------------------------------------------------
       Older versions of the timer stored DURATION as
       minutes. New version stores seconds.

       We use the actual timer seconds as the source
       of truth.
    ===================================================== */

    function normalizeDurationStorage() {

        let stored =
            Number(
                localStorage.getItem(
                    KEYS.DURATION
                )
            );


        if (
            !Number.isFinite(
                stored
            ) ||
            stored <= 0
        ) {

            stored =
                1500;

            localStorage.setItem(
                KEYS.DURATION,
                String(
                    stored
                )
            );

            return;

        }


        /*
         * Recognize common old values:
         *
         * 25 → 25 minutes
         * 45 → 45 minutes
         * 60 → 60 minutes
         *
         * Values like 5 are deliberately
         * preserved because they are useful
         * for the 5-second completion test.
         */
        if (
            stored === 25 ||
            stored === 45 ||
            stored === 60
        ) {

            /*
             * Only convert if the timer itself
             * is not also using that same value.
             */
            const timerSeconds =
                Number(
                    localStorage.getItem(
                        KEYS.SECONDS
                    )
                );


            if (
                !timerSeconds ||
                timerSeconds === stored
            ) {

                stored =
                    stored * 60;

            }

        }


        selectedDurationSeconds =
            stored;

    }


    /* =====================================================
       INITIALIZE
    ===================================================== */

    function initializeTimer() {

        normalizeDurationStorage();


        selectedDurationSeconds =
            Number(
                localStorage.getItem(
                    KEYS.DURATION
                )
            ) || 1500;


        remainingSeconds =
            Number(
                localStorage.getItem(
                    KEYS.SECONDS
                )
            );


        timerRunning =
            localStorage.getItem(
                KEYS.RUNNING
            ) === "true";


        timerEndTime =
            Number(
                localStorage.getItem(
                    KEYS.END_TIME
                )
            ) || 0;


        /*
         * No timer state yet.
         */
        if (
            !Number.isFinite(
                remainingSeconds
            ) ||
            remainingSeconds < 0
        ) {

            remainingSeconds =
                selectedDurationSeconds;


            localStorage.setItem(
                KEYS.SECONDS,
                String(
                    remainingSeconds
                )
            );

        }


        /*
         * Reconnect to a timer running
         * from another StudyMind page.
         */
        if (
            timerRunning &&
            timerEndTime
        ) {

            remainingSeconds =
                Math.max(
                    0,
                    Math.ceil(
                        (
                            timerEndTime -
                            Date.now()
                        ) / 1000
                    )
                );


            localStorage.setItem(
                KEYS.SECONDS,
                String(
                    remainingSeconds
                )
            );


            if (
                remainingSeconds <= 0
            ) {

                completeTimer();

                return;

            }


            startInterval();

        }


        renderCurrentTopic();

        updateTimerUI();

        renderStats();

        renderHistory();

        updateDurationButtons();

    }


    /* =====================================================
       TIMER UI
    ===================================================== */

    function updateTimerUI() {

        const display =
            $("timerDisplay");


        if (display) {

            display.textContent =
                formatTime(
                    remainingSeconds
                );

        }


        const totalSeconds =
            Math.max(
                1,
                selectedDurationSeconds
            );


        const elapsed =
            Math.max(
                0,
                totalSeconds -
                remainingSeconds
            );


        const progress =
            Math.min(
                100,
                (
                    elapsed /
                    totalSeconds
                ) * 100
            );


        const progressElement =
            $("timerProgress");


        if (progressElement) {

            progressElement.style.width =
                `${progress}%`;

        }


        const circle =
            document.querySelector(
                ".timer-circle"
            );


        if (circle) {

            circle.style.setProperty(
                "--timer-progress",
                `${progress}%`
            );

        }


        const elapsedText =
            $("elapsedText");


        if (elapsedText) {

            elapsedText.textContent =
                `${Math.floor(
                    elapsed / 60
                )} min studied`;

        }


        const remainingText =
            $("remainingText");


        if (remainingText) {

            remainingText.textContent =
                `${Math.ceil(
                    remainingSeconds / 60
                )} min remaining`;

        }


        const startButton =
            $("startPauseTimer");


        const status =
            $("sessionStatus");


        const label =
            $("timerLabel");


        if (timerRunning) {

            if (startButton) {

                startButton.textContent =
                    "❚❚ Pause Session";

            }


            if (status) {

                status.textContent =
                    "FOCUSING";

            }


            if (label) {

                label.textContent =
                    "Stay focused";

            }

        } else {

            if (startButton) {

                startButton.textContent =
                    "▶ Start Session";

            }


            if (status) {

                status.textContent =
                    elapsed > 0
                        ? "PAUSED"
                        : "READY";

            }


            if (label) {

                label.textContent =
                    elapsed > 0
                        ? "Session paused"
                        : "Focus time";

            }

        }

    }


    /* =====================================================
       START
    ===================================================== */

    function startTimer() {

        if (
            completionBeingHandled
        ) {

            return;

        }


        if (
            remainingSeconds <= 0
        ) {

            remainingSeconds =
                selectedDurationSeconds;

        }


        const current =
            getCurrentStudyTopic();


        if (current) {

            localStorage.setItem(
                KEYS.CURRENT_TOPIC,
                current.topic
            );


            localStorage.setItem(
                KEYS.CURRENT_SUBJECT,
                current.subject
            );


            saveJSON(
                KEYS.SESSION,
                {

                    subject:
                        current.subject,

                    topic:
                        current.topic,

                    duration:
                        selectedDurationSeconds,

                    startedAt:
                        Date.now()

                }
            );

        }


        timerEndTime =
            Date.now() +
            remainingSeconds * 1000;


        timerRunning =
            true;


        localStorage.setItem(
            KEYS.SECONDS,
            String(
                remainingSeconds
            )
        );


        localStorage.setItem(
            KEYS.END_TIME,
            String(
                timerEndTime
            )
        );


        localStorage.setItem(
            KEYS.RUNNING,
            "true"
        );


        startInterval();

        updateTimerUI();

        updateCoach(
            "Focus mode activated",
            "Stay with the current topic. StudyMind is tracking your genuine study time."
        );

        dispatchTimerChanged();

    }


    /* =====================================================
       PAUSE
    ===================================================== */

    function pauseTimer() {

        if (!timerRunning) {

            return;

        }


        remainingSeconds =
            Math.max(
                0,
                Math.ceil(
                    (
                        timerEndTime -
                        Date.now()
                    ) / 1000
                )
            );


        timerRunning =
            false;


        clearInterval(
            timerInterval
        );


        timerInterval =
            null;


        localStorage.setItem(
            KEYS.SECONDS,
            String(
                remainingSeconds
            )
        );


        localStorage.setItem(
            KEYS.RUNNING,
            "false"
        );


        localStorage.removeItem(
            KEYS.END_TIME
        );


        updateTimerUI();


        updateCoach(
            "Session paused",
            "Take a short break if you need one, then return when you're ready."
        );


        dispatchTimerChanged();

    }


    /* =====================================================
       RESET
    ===================================================== */

    function resetTimer() {

        clearInterval(
            timerInterval
        );


        timerInterval =
            null;


        timerRunning =
            false;


        timerEndTime =
            0;


        remainingSeconds =
            selectedDurationSeconds;


        localStorage.setItem(
            KEYS.SECONDS,
            String(
                remainingSeconds
            )
        );


        localStorage.setItem(
            KEYS.RUNNING,
            "false"
        );


        localStorage.removeItem(
            KEYS.END_TIME
        );


        updateTimerUI();

        updateDurationButtons();


        updateCoach(
            "Timer reset",
            "Your next session is ready whenever you are."
        );


        dispatchTimerChanged();

    }


    /* =====================================================
       TIMER INTERVAL
    ===================================================== */

    function startInterval() {

        clearInterval(
            timerInterval
        );


        timerInterval =
            setInterval(
                () => {

                    if (!timerRunning) {

                        return;

                    }


                    remainingSeconds =
                        Math.max(
                            0,
                            Math.ceil(
                                (
                                    timerEndTime -
                                    Date.now()
                                ) / 1000
                            )
                        );


                    localStorage.setItem(
                        KEYS.SECONDS,
                        String(
                            remainingSeconds
                        )
                    );


                    updateTimerUI();


                    dispatchTimerChanged();


                    if (
                        remainingSeconds <= 0
                    ) {

                        completeTimer();

                    }

                },
                250
            );

    }


    /* =====================================================
       TIMER COMPLETION
    ===================================================== */

    function completeTimer() {

        if (
            completionBeingHandled
        ) {

            return;

        }


        const completedEndTime =
            Number(
                timerEndTime
            ) ||
            Date.now();


        const completionId =
            String(
                completedEndTime
            );


        const existingCompleted =
            localStorage.getItem(
                KEYS.LAST_COMPLETED
            );


        if (
            existingCompleted ===
            completionId
        ) {

            timerRunning =
                false;

            remainingSeconds =
                0;

            timerEndTime =
                0;

            clearInterval(
                timerInterval
            );

            timerInterval =
                null;

            localStorage.setItem(
                KEYS.SECONDS,
                "0"
            );

            localStorage.setItem(
                KEYS.RUNNING,
                "false"
            );

            localStorage.removeItem(
                KEYS.END_TIME
            );

            updateTimerUI();

            renderStats();

            renderHistory();

            return;

        }


        completionBeingHandled =
            true;


        clearInterval(
            timerInterval
        );


        timerInterval =
            null;


        /*
         * Calculate actual completed minutes.
         *
         * Normal sessions:
         * 25 / 45 / 60 minutes.
         *
         * Test sessions:
         * 5 seconds = 0.0833 minutes.
         *
         * XP uses the normal selected duration,
         * but test sessions still register as a
         * completed session.
         */
        const rawMinutes =
            selectedDurationSeconds / 60;


        const minutes =
            Math.max(
                1,
                Math.round(
                    rawMinutes
                )
            );


        const current =
            getCurrentStudyTopic();


        const earnedXP =
            calculateXP(
                minutes
            );


        /*
         * STOP TIMER
         */

        timerRunning =
            false;


        remainingSeconds =
            0;


        timerEndTime =
            0;


        localStorage.setItem(
            KEYS.SECONDS,
            "0"
        );


        localStorage.setItem(
            KEYS.RUNNING,
            "false"
        );


        localStorage.removeItem(
            KEYS.END_TIME
        );


        /*
         * Completion marker.
         */

        localStorage.setItem(
            KEYS.LAST_COMPLETED,
            completionId
        );


        /*
         * SAVE SESSION
         *
         * This MUST happen before renderStats().
         */
        recordStudySession(
            minutes,
            earnedXP,
            current
        );


        /*
         * ADD XP.
         */
        addXP(
            earnedXP
        );


        /*
         * RECORD TODAY'S STUDY DAY.
         */
        const streakResult =
            recordStreakActivity();


        /*
         * IMPORTANT:
         *
         * Refresh the progress section
         * immediately after saving the session.
         */
        renderStats();

        renderHistory();

        updateTimerUI();


        /*
         * Also tell any other StudyMind
         * component to refresh its progress.
         */
        window.dispatchEvent(
            new CustomEvent(
                "studyMindProgressUpdated",
                {
                    detail: {

                        minutes,

                        sessions:
                            getTodaySessionCount(),

                        xp:
                            getTodayXP(),

                        totalXP:
                            Number(
                                localStorage.getItem(
                                    KEYS.TOTAL_XP
                                )
                            ) || 0,

                        completionId,

                        date:
                            todayKey()

                    }

                }
            )
        );


        /*
         * Completion modal.
         */
        showCompletion(
            minutes,
            earnedXP
        );


        /*
         * Shared completion event.
         */
        window.dispatchEvent(
            new CustomEvent(
                "studyMindTimerCompleted",
                {
                    detail: {

                        minutes,

                        xp:
                            earnedXP,

                        topic:
                            current?.topic ||
                            null,

                        subject:
                            current?.subject ||
                            null,

                        completionId,

                        streak:
                            streakResult?.streak ||
                            calculateStreak(),

                        date:
                            todayKey()

                    }

                }
            )
        );


        /*
         * Streak event.
         */
        window.dispatchEvent(
            new CustomEvent(
                "studyMindStreakUpdated",
                {

                    detail: {

                        streak:
                            streakResult?.streak ||
                            calculateStreak(),

                        date:
                            todayKey(),

                        completionId,

                        newlyRecorded:
                            streakResult?.newlyRecorded ??
                            true,

                        source:
                            "shared-timer"

                    }

                }
            )
        );


        /*
         * Notify timer UI components.
         */
        dispatchTimerChanged();


        /*
         * Allow future timers.
         */
        setTimeout(
            () => {

                completionBeingHandled =
                    false;

            },
            500
        );

    }


    /* =====================================================
       RECORD STUDY SESSION
    ===================================================== */

    function recordStudySession(
        minutes,
        xp,
        current
    ) {

        const sessions =
            safeJSON(
                KEYS.SESSIONS,
                []
            );


        const session = {

            id:
                `session_${Date.now()}`,

            date:
                new Date().toISOString(),

            day:
                todayKey(),

            subject:
                current?.subject ||
                "Study",

            topic:
                current?.topic ||
                "Study Session",

            minutes:
                Number(
                    minutes
                ) || 0,

            xp:
                Number(
                    xp
                ) || 0,

            completed:
                true

        };


        sessions.unshift(
            session
        );


        saveJSON(
            KEYS.SESSIONS,
            sessions.slice(
                0,
                100
            )
        );


        /*
         * Keep generic session storage
         * synchronized.
         */
        const genericSessions =
            safeJSON(
                "studyMindStudySessions",
                []
            );


        genericSessions.unshift(
            session
        );


        saveJSON(
            "studyMindStudySessions",
            genericSessions.slice(
                0,
                100
            )
        );

    }


    /* =====================================================
       XP
    ===================================================== */

    function calculateXP(
        minutes
    ) {

        return Math.max(
            25,
            Math.round(
                Number(
                    minutes
                ) || 0
            )
        );

    }


    function addXP(
        amount
    ) {

        amount =
            Number(
                amount
            ) || 0;


        const currentXP =
            Number(
                localStorage.getItem(
                    KEYS.XP
                )
            ) || 0;


        const totalXP =
            Number(
                localStorage.getItem(
                    KEYS.TOTAL_XP
                )
            ) || 0;


        localStorage.setItem(
            KEYS.XP,
            String(
                currentXP + amount
            )
        );


        localStorage.setItem(
            KEYS.TOTAL_XP,
            String(
                totalXP + amount
            )
        );

    }


    /* =====================================================
       TODAY'S PROGRESS HELPERS
    ===================================================== */

    function getTodaySessions() {

        const sessions =
            safeJSON(
                KEYS.SESSIONS,
                []
            );


        if (!Array.isArray(sessions)) {

            return [];

        }


        const today =
            todayKey();


        return sessions.filter(
            session => {

                if (!session) {

                    return false;

                }


                /*
                 * New session records use day.
                 */
                if (
                    session.day === today
                ) {

                    return true;

                }


                /*
                 * Compatibility with older
                 * session records.
                 */
                if (
                    session.date
                ) {

                    const date =
                        new Date(
                            session.date
                        );


                    if (
                        !Number.isNaN(
                            date.getTime()
                        )
                    ) {

                        return (
                            localDateKey(
                                date
                            ) === today
                        );

                    }

                }


                return false;

            }
        );

    }


    function getTodayMinutes() {

        return getTodaySessions()
            .reduce(
                (
                    total,
                    session
                ) => {

                    return (
                        total +
                        Number(
                            session.minutes
                        ) ||
                        0
                    );

                },
                0
            );

    }


    function getTodayXP() {

        return getTodaySessions()
            .reduce(
                (
                    total,
                    session
                ) => {

                    return (
                        total +
                        Number(
                            session.xp
                        ) ||
                        0
                    );

                },
                0
            );

    }


    function getTodaySessionCount() {

        return getTodaySessions()
            .length;

    }


    /* =====================================================
       PROGRESS UI
    ===================================================== */

    function renderStats() {

        const todaySessions =
            getTodaySessions();


        const minutes =
            todaySessions.reduce(
                (
                    total,
                    session
                ) => {

                    return (
                        total +
                        (
                            Number(
                                session.minutes
                            ) || 0
                        )
                    );

                },
                0
            );


        const xp =
            todaySessions.reduce(
                (
                    total,
                    session
                ) => {

                    return (
                        total +
                        (
                            Number(
                                session.xp
                            ) || 0
                        )
                    );

                },
                0
            );


        const sessionCount =
            todaySessions.length;


        /*
         * YOUR PROGRESS — MINUTES
         */
        const minutesElement =
            $("todayMinutes");


        if (minutesElement) {

            minutesElement.textContent =
                String(
                    minutes
                );

        }


        /*
         * YOUR PROGRESS — SESSIONS
         */
        const sessionsElement =
            $("todaySessions");


        if (sessionsElement) {

            sessionsElement.textContent =
                String(
                    sessionCount
                );

        }


        /*
         * YOUR PROGRESS — XP
         */
        const xpElement =
            $("todayXP");


        if (xpElement) {

            xpElement.textContent =
                String(
                    xp
                );

        }


        /*
         * Compatibility with alternative
         * progress IDs if present.
         */
        const progressMinutes =
            document.querySelector(
                "[data-today-minutes]"
            );


        if (progressMinutes) {

            progressMinutes.textContent =
                String(
                    minutes
                );

        }


        const progressSessions =
            document.querySelector(
                "[data-today-sessions]"
            );


        if (progressSessions) {

            progressSessions.textContent =
                String(
                    sessionCount
                );

        }


        const progressXP =
            document.querySelector(
                "[data-today-xp]"
            );


        if (progressXP) {

            progressXP.textContent =
                String(
                    xp
                );

        }


        /*
         * Optional total XP displays.
         */
        const totalXP =
            Number(
                localStorage.getItem(
                    KEYS.TOTAL_XP
                )
            ) || 0;


        const totalXPElement =
            document.querySelector(
                "[data-total-xp]"
            );


        if (totalXPElement) {

            totalXPElement.textContent =
                String(
                    totalXP
                );

        }


        /*
         * Broadcast progress state so
         * dashboard / study session widgets
         * can react immediately.
         */
        window.dispatchEvent(
            new CustomEvent(
                "studyMindProgressRendered",
                {
                    detail: {

                        minutes,

                        sessions:
                            sessionCount,

                        xp,

                        totalXP

                    }

                }
            )
        );

    }


    /* =====================================================
       HISTORY
    ===================================================== */

    function renderHistory() {

        const sessions =
            safeJSON(
                KEYS.SESSIONS,
                []
            );


        const historyCount =
            $("historyCount");


        if (historyCount) {

            historyCount.textContent =
                `${sessions.length} session${
                    sessions.length === 1
                        ? ""
                        : "s"
                }`;

        }


        const container =
            $("sessionHistory");


        if (!container) {

            return;

        }


        if (!sessions.length) {

            container.innerHTML = `

                <div class="empty-history">
                    Your completed study sessions will appear here.
                </div>

            `;

            return;

        }


        container.innerHTML =
            sessions
                .slice(
                    0,
                    8
                )
                .map(
                    session => {

                        const date =
                            new Date(
                                session.date
                            );


                        const dateText =
                            date.toLocaleDateString(
                                undefined,
                                {

                                    month:
                                        "short",

                                    day:
                                        "numeric"

                                }
                            );


                        return `

                            <div
                                class="history-item"
                            >

                                <div
                                    class="history-icon"
                                >
                                    ✓
                                </div>

                                <div>

                                    <strong>
                                        ${escapeHTML(
                                            session.subject
                                        )}
                                    </strong>

                                    <small>
                                        ${escapeHTML(
                                            session.topic
                                        )}
                                        ·
                                        ${session.minutes}
                                        min
                                        ·
                                        ${dateText}
                                    </small>

                                </div>

                                <div
                                    class="history-xp"
                                >
                                    +${session.xp} XP
                                </div>

                            </div>

                        `;

                    }
                )
                .join("");

    }


    /* =====================================================
       COACH
    ===================================================== */

    function updateCoach(
        title,
        message
    ) {

        const titleElement =
            $("coachTitle");


        const messageElement =
            $("coachMessage");


        if (titleElement) {

            titleElement.textContent =
                title;

        }


        if (messageElement) {

            messageElement.textContent =
                message;

        }

    }


    /* =====================================================
       RECOMMENDED SESSION
    ===================================================== */

    function useRecommendedSession() {

        const current =
            getCurrentStudyTopic();


        if (!current) {

            updateCoach(
                "No study plan yet",
                "Create a study plan first so StudyMind can recommend a topic."
            );

            return;

        }


        localStorage.setItem(
            KEYS.CURRENT_TOPIC,
            current.topic
        );


        localStorage.setItem(
            KEYS.CURRENT_SUBJECT,
            current.subject
        );


        saveJSON(
            KEYS.SESSION,
            {

                subject:
                    current.subject,

                topic:
                    current.topic,

                duration:
                    selectedDurationSeconds

            }
        );


        renderCurrentTopic();


        resetTimer();

        startTimer();

    }


    /* =====================================================
       DURATION BUTTONS
    ===================================================== */

    function selectDuration(
        minutes
    ) {

        if (timerRunning) {

            alert(
                "Pause or finish the current session before changing the session length."
            );

            return;

        }


        minutes =
            Number(
                minutes
            );


        if (
            !Number.isFinite(
                minutes
            ) ||
            minutes <= 0
        ) {

            return;

        }


        selectedDurationSeconds =
            minutes * 60;


        localStorage.setItem(
            KEYS.DURATION,
            String(
                selectedDurationSeconds
            )
        );


        remainingSeconds =
            selectedDurationSeconds;


        localStorage.setItem(
            KEYS.SECONDS,
            String(
                remainingSeconds
            )
        );


        localStorage.setItem(
            KEYS.RUNNING,
            "false"
        );


        localStorage.removeItem(
            KEYS.END_TIME
        );


        updateDurationButtons();

        updateTimerUI();

        dispatchTimerChanged();

    }


    function updateDurationButtons() {

        const buttons =
            document.querySelectorAll(
                ".duration-button"
            );


        buttons.forEach(
            button => {

                const minutes =
                    Number(
                        button.dataset.minutes
                    );


                button.classList.toggle(
                    "active",
                    minutes * 60 ===
                    selectedDurationSeconds
                );

            }
        );

    }


    /* =====================================================
       COMPLETION MODAL
    ===================================================== */

    function showCompletion(
        minutes,
        xp
    ) {

        const earnedMinutes =
            $("earnedMinutes");


        const earnedXP =
            $("earnedXP");


        const message =
            $("completionMessage");


        if (earnedMinutes) {

            earnedMinutes.textContent =
                minutes;

        }


        if (earnedXP) {

            earnedXP.textContent =
                xp;

        }


        if (message) {

            message.textContent =
                `You completed ${minutes} minutes of focused study. Your progress has been recorded.`;

        }


        const modal =
            $("completionModal");


        if (modal) {

            modal.classList.add(
                "show"
            );

        }


        updateCoach(
            "Excellent work",
            "Your completed session has been recorded and XP has been added to your progress."
        );

    }


    /* =====================================================
       STREAK ACTIVITY
    ===================================================== */

    function recordStreakActivity() {

        const today =
            todayKey();


        const activity =
            safeJSON(
                KEYS.STREAK_ACTIVITY,
                {}
            );


        const alreadyRecorded =
            activity[today] === true;


        activity[today] =
            true;


        saveJSON(
            KEYS.STREAK_ACTIVITY,
            activity
        );


        localStorage.setItem(
            "studyMindLastCompletedPlanDate",
            today
        );


        let streak =
            calculateStreak();


        try {

            if (
                window.StudyMindStreak &&
                typeof
                    window.StudyMindStreak
                        .recordStudyActivity ===
                    "function"
            ) {

                const result =
                    window.StudyMindStreak
                        .recordStudyActivity();


                if (
                    result &&
                    typeof result.current ===
                    "number"
                ) {

                    streak =
                        result.current;

                } else if (
                    result &&
                    typeof result.streak ===
                    "number"
                ) {

                    streak =
                        result.streak;

                }

            }

        } catch (error) {

            console.warn(
                "StudyMind streak engine error:",
                error
            );

        }


        return {

            streak,

            date:
                today,

            newlyRecorded:
                !alreadyRecorded

        };

    }


    /* =====================================================
       CALCULATE CURRENT STREAK
    ===================================================== */

    function calculateStreak() {

        const activity =
            safeJSON(
                KEYS.STREAK_ACTIVITY,
                {}
            );


        let date =
            new Date();


        let streak =
            0;


        while (true) {

            const key =
                localDateKey(
                    date
                );


            if (
                activity[key] !== true
            ) {

                break;

            }


            streak++;


            date.setDate(
                date.getDate() - 1
            );

        }


        return streak;

    }


    /* =====================================================
       STREAK POPUP
    ===================================================== */

    function showStreakPopup(
        streak
    ) {

        let popup =
            document.getElementById(
                "studyMindStreakPopup"
            );


        if (!popup) {

            popup =
                document.createElement(
                    "div"
                );


            popup.id =
                "studyMindStreakPopup";


            popup.innerHTML = `

                <div
                    class="study-mind-streak-popup-inner"
                >

                    <div
                        class="study-mind-streak-emoji"
                    >
                        🔥
                    </div>

                    <div
                        class="study-mind-streak-title"
                    >
                        ${streak}-Day Streak!
                    </div>

                    <div
                        class="study-mind-streak-message"
                    >
                        Amazing work! You completed
                        your study session today.
                    </div>

                    <button
                        type="button"
                        id="studyMindStreakCloseButton"
                        class="study-mind-streak-button"
                    >
                        Keep Going 🚀
                    </button>

                </div>

            `;


            document.body.appendChild(
                popup
            );


            const style =
                document.createElement(
                    "style"
                );


            style.id =
                "studyMindStreakPopupStyles";


            style.textContent = `

                #studyMindStreakPopup {

                    position: fixed;
                    inset: 0;
                    z-index: 999999;

                    display: flex;
                    align-items: center;
                    justify-content: center;

                    padding: 24px;

                    background:
                        rgba(8,15,30,0.58);

                    backdrop-filter:
                        blur(8px);

                    opacity: 0;
                    visibility: hidden;
                    pointer-events: none;

                    transition:
                        opacity 0.25s ease,
                        visibility 0.25s ease;

                }


                #studyMindStreakPopup.show {

                    opacity: 1;
                    visibility: visible;
                    pointer-events: auto;

                }


                .study-mind-streak-popup-inner {

                    width:
                        min(420px, 100%);

                    padding:
                        32px 28px;

                    border-radius:
                        28px;

                    text-align:
                        center;

                    background:
                        linear-gradient(
                            145deg,
                            #ffffff,
                            #f5f8ff
                        );

                    box-shadow:
                        0 30px 90px
                        rgba(0,0,0,0.28);

                    transform:
                        scale(0.88)
                        translateY(20px);

                    transition:
                        transform 0.3s ease;

                }


                #studyMindStreakPopup.show
                .study-mind-streak-popup-inner {

                    transform:
                        scale(1)
                        translateY(0);

                }


                .study-mind-streak-emoji {

                    font-size:
                        64px;

                    margin-bottom:
                        8px;

                    animation:
                        studyMindFireBounce
                        0.8s
                        ease-in-out
                        infinite
                        alternate;

                }


                .study-mind-streak-title {

                    font-size:
                        30px;

                    font-weight:
                        800;

                    margin-bottom:
                        10px;

                }


                .study-mind-streak-message {

                    font-size:
                        16px;

                    line-height:
                        1.55;

                    opacity:
                        0.72;

                    margin-bottom:
                        24px;

                }


                .study-mind-streak-button {

                    border:
                        0;

                    border-radius:
                        14px;

                    padding:
                        13px 22px;

                    font-size:
                        15px;

                    font-weight:
                        700;

                    cursor:
                        pointer;

                    background:
                        #111827;

                    color:
                        #ffffff;

                }


                @keyframes studyMindFireBounce {

                    from {

                        transform:
                            translateY(0)
                            scale(1);

                    }

                    to {

                        transform:
                            translateY(-8px)
                            scale(1.08);

                    }

                }

            `;


            document.head.appendChild(
                style
            );

        }


        const title =
            popup.querySelector(
                ".study-mind-streak-title"
            );


        if (title) {

            title.textContent =
                `${streak}-Day Streak!`;

        }


        const button =
            popup.querySelector(
                "#studyMindStreakCloseButton"
            );


        if (button) {

            button.onclick =
                () => {

                    popup.classList.remove(
                        "show"
                    );

                };

        }


        popup.style.visibility =
            "visible";


        popup.style.pointerEvents =
            "auto";


        requestAnimationFrame(
            () => {

                popup.classList.add(
                    "show"
                );

            }
        );

    }


    /* =====================================================
       USER
    ===================================================== */

    async function loadUser() {

        try {

            const client =
                window.supabaseClient ||
                window.supabase;


            if (
                client &&
                client.auth &&
                typeof
                    client.auth.getUser ===
                    "function"
            ) {

                const {
                    data
                } =
                    await client.auth.getUser();


                const user =
                    data?.user;


                if (user) {

                    const name =
                        user.user_metadata?.full_name ||
                        user.user_metadata?.name ||
                        user.email?.split("@")[0] ||
                        "Student";


                    setUserName(
                        name
                    );

                }

            }

        } catch {}


        const userNameElement =
            $("userName");


        if (
            userNameElement &&
            (
                userNameElement.textContent ===
                "Student"
            )
        ) {

            const localName =
                localStorage.getItem(
                    "studyMindUsername"
                );


            if (localName) {

                setUserName(
                    localName
                );

            }

        }

    }


    function setUserName(
        name
    ) {

        const clean =
            String(
                name
            )
                .trim()
                .split(" ")
                .slice(
                    0,
                    2
                )
                .join(" ");


        const finalName =
            clean ||
            "Student";


        const userNameElement =
            $("userName");


        if (userNameElement) {

            userNameElement.textContent =
                finalName;

        }


        const avatar =
            $("userAvatar");


        if (avatar) {

            avatar.textContent =
                finalName
                    .charAt(0)
                    .toUpperCase();

        }


        const status =
            $("userStatus");


        if (status) {

            status.textContent =
                "Ready to study";

        }

    }


    /* =====================================================
       SECURITY
    ===================================================== */

    function escapeHTML(
        value
    ) {

        return String(
            value ?? ""
        )
            .replaceAll(
                "&",
                "&amp;"
            )
            .replaceAll(
                "<",
                "&lt;"
            )
            .replaceAll(
                ">",
                "&gt;"
            )
            .replaceAll(
                '"',
                "&quot;"
            )
            .replaceAll(
                "'",
                "&#039;"
            );

    }


    /* =====================================================
       CROSS-PAGE TIMER SYNC
    ===================================================== */

    function syncFromStorage() {

        selectedDurationSeconds =
            Number(
                localStorage.getItem(
                    KEYS.DURATION
                )
            ) || 1500;


        remainingSeconds =
            Number(
                localStorage.getItem(
                    KEYS.SECONDS
                )
            );


        timerRunning =
            localStorage.getItem(
                KEYS.RUNNING
            ) === "true";


        timerEndTime =
            Number(
                localStorage.getItem(
                    KEYS.END_TIME
                )
            ) || 0;


        if (
            timerRunning &&
            timerEndTime
        ) {

            const calculated =
                Math.max(
                    0,
                    Math.ceil(
                        (
                            timerEndTime -
                            Date.now()
                        ) / 1000
                    )
                );


            remainingSeconds =
                calculated;


            localStorage.setItem(
                KEYS.SECONDS,
                String(
                    remainingSeconds
                )
            );


            if (
                remainingSeconds <= 0
            ) {

                completeTimer();

                return;

            }


            startInterval();

        } else {

            clearInterval(
                timerInterval
            );


            timerInterval =
                null;

        }


        renderCurrentTopic();

        updateTimerUI();

        renderStats();

        renderHistory();

        updateDurationButtons();

    }


    /* =====================================================
       STORAGE LISTENER
    ===================================================== */

    window.addEventListener(
        "storage",
        event => {

            if (
                [
                    KEYS.SECONDS,
                    KEYS.END_TIME,
                    KEYS.RUNNING,
                    KEYS.DURATION,
                    KEYS.CURRENT_TOPIC,
                    KEYS.CURRENT_SUBJECT
                ].includes(
                    event.key
                )
            ) {

                syncFromStorage();

            }


            if (
                event.key ===
                KEYS.SESSIONS
            ) {

                renderStats();

                renderHistory();

            }


            if (
                event.key ===
                KEYS.XP ||
                event.key ===
                KEYS.TOTAL_XP
            ) {

                renderStats();

            }


            if (
                event.key ===
                KEYS.LAST_COMPLETED
            ) {

                renderStats();

                renderHistory();

                updateTimerUI();

            }

        }
    );


    /* =====================================================
       SAME-PAGE PROGRESS EVENTS
    ===================================================== */

    window.addEventListener(
        "studyMindProgressUpdated",
        () => {

            renderStats();

            renderHistory();

        }
    );


    window.addEventListener(
        "studyMindTimerCompleted",
        () => {

            renderStats();

            renderHistory();

            updateTimerUI();

        }
    );


    /* =====================================================
       SAME-PAGE TIMER EVENTS
    ===================================================== */

    function dispatchTimerChanged() {

        window.dispatchEvent(
            new CustomEvent(
                "studyMindTimerChanged",
                {

                    detail: {

                        seconds:
                            remainingSeconds,

                        running:
                            timerRunning,

                        endTime:
                            timerEndTime,

                        duration:
                            selectedDurationSeconds

                    }

                }
            )
        );

    }


    /* =====================================================
       BUTTON SETUP
    ===================================================== */

    function setupControls() {

        if (
            pageInitialized
        ) {

            return;

        }


        pageInitialized =
            true;


        /* =================================================
           START / PAUSE
        ================================================= */

        const startPause =
            $("startPauseTimer");


        if (
            startPause &&
            !startPause.dataset.timerBound
        ) {

            startPause.dataset.timerBound =
                "true";


            startPause.addEventListener(
                "click",
                () => {

                    if (
                        timerRunning
                    ) {

                        pauseTimer();

                    } else {

                        startTimer();

                    }

                }
            );

        }


        /* =================================================
           RESET
        ================================================= */

        const reset =
            $("resetTimer");


        if (
            reset &&
            !reset.dataset.timerBound
        ) {

            reset.dataset.timerBound =
                "true";


            reset.addEventListener(
                "click",
                resetTimer
            );

        }


        /* =================================================
           RECOMMENDED
        ================================================= */

        const recommended =
            $("useRecommended");


        if (
            recommended &&
            !recommended.dataset.timerBound
        ) {

            recommended.dataset.timerBound =
                "true";


            recommended.addEventListener(
                "click",
                useRecommendedSession
            );

        }


        /* =================================================
           CLOSE COMPLETION
        ================================================= */

        const closeCompletion =
            $("closeCompletion");


        if (
            closeCompletion &&
            !closeCompletion.dataset.timerBound
        ) {

            closeCompletion.dataset.timerBound =
                "true";


            closeCompletion.addEventListener(
                "click",
                () => {

                    const modal =
                        $("completionModal");


                    if (modal) {

                        modal.classList.remove(
                            "show"
                        );

                    }

                }
            );

        }


        /* =================================================
           25 / 45 / 60 MINUTE BUTTONS
        ================================================= */

        document
            .querySelectorAll(
                ".duration-button"
            )
            .forEach(
                button => {

                    if (
                        button.dataset.timerBound
                    ) {

                        return;

                    }


                    button.dataset.timerBound =
                        "true";


                    button.addEventListener(
                        "click",
                        () => {

                            const minutes =
                                Number(
                                    button.dataset.minutes
                                );


                            if (
                                !Number.isFinite(
                                    minutes
                                ) ||
                                minutes <= 0
                            ) {

                                console.warn(
                                    "Invalid timer duration:",
                                    button.dataset.minutes
                                );

                                return;

                            }


                            selectDuration(
                                minutes
                            );

                        }
                    );

                }
            );


        updateDurationButtons();

    }


    /* =====================================================
       PAGE INITIALIZATION
    ===================================================== */

    function initializePage() {

        initializeTimer();

        setupControls();

        renderCurrentTopic();

        renderStats();

        renderHistory();

        loadUser();

    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    return {

        start:
            startTimer,

        pause:
            pauseTimer,

        reset:
            resetTimer,

        complete:
            completeTimer,

        initialize:
            initializeTimer,

        getState:
            () => ({

                seconds:
                    remainingSeconds,

                running:
                    timerRunning,

                endTime:
                    timerEndTime,

                /*
                 * Public duration remains
                 * seconds because that is what
                 * the shared storage key represents.
                 */
                duration:
                    selectedDurationSeconds

            }),

        getCurrentTopic:
            getCurrentStudyTopic,

        calculateStreak,

        recordStreakActivity,

        renderStats,

        renderHistory,

        getTodayMinutes,

        getTodaySessionCount,

        getTodayXP

    };


})();


/* =========================================================
   DOM READY
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            /*
             * The timer engine's internal
             * initialization is exposed here.
             *
             * Calling initialize() is safe.
             */
            window.StudyMindTimer.initialize();

        },
        {
            once: true
        }
    );

} else {

    window.StudyMindTimer.initialize();

}
