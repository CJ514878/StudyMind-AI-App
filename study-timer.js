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

   Timer completion records study activity,
   then dispatches:

       studyMindTimerCompleted
       studyMindStreakUpdated
       studyMindTimerChanged

   The Study Streak page is responsible for
   its own visual streak celebration/Milo.
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

    let selectedDuration =
        Number(
            localStorage.getItem(
                KEYS.DURATION
            )
        ) || 25;


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


    let timerInterval = null;


    let completionBeingHandled = false;


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
                localStorage.getItem(key);


            if (!value) {

                return fallback;

            }


            return JSON.parse(value);

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
                JSON.stringify(value)
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
            ).padStart(2, "0"),

            String(
                d.getDate()
            ).padStart(2, "0")

        ].join("-");

    }


    function localDateKey(
        date
    ) {

        return [

            date.getFullYear(),

            String(
                date.getMonth() + 1
            ).padStart(2, "0"),

            String(
                date.getDate()
            ).padStart(2, "0")

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

            String(minutes)
                .padStart(2, "0")

            +

            ":"

            +

            String(seconds)
                .padStart(2, "0")

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
                localStorage.getItem(key);


            if (!raw) {

                continue;

            }


            try {

                const plan =
                    JSON.parse(raw);


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
            normalizeTopics(plan);


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
                        !completed.includes(key) &&
                        !completed.includes(item.topic)
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
       INITIALIZE
    ===================================================== */

    function initializeTimer() {

        selectedDuration =
            Number(
                localStorage.getItem(
                    KEYS.DURATION
                )
            ) || 25;


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
            !remainingSeconds &&
            !timerRunning
        ) {

            remainingSeconds =
                selectedDuration * 60;


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
                selectedDuration * 60
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
                `${Math.floor(elapsed / 60)} min studied`;

        }


        const remainingText =
            $("remainingText");


        if (remainingText) {

            remainingText.textContent =
                `${Math.ceil(remainingSeconds / 60)} min remaining`;

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
                selectedDuration * 60;

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
                        selectedDuration,

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
            selectedDuration * 60;


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


        /*
         * Capture the completion information
         * BEFORE clearing timerEndTime.
         */
        const completedEndTime =
            Number(
                timerEndTime
            ) ||
            Date.now();


        const completionId =
            String(
                completedEndTime
            );


        /*
         * Prevent duplicate processing.
         */
        const existingCompleted =
            localStorage.getItem(
                KEYS.LAST_COMPLETED
            );


        if (
            existingCompleted ===
            completionId
        ) {

            /*
             * Make absolutely sure the timer
             * is stopped.
             */
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

            return;

        }


        completionBeingHandled =
            true;


        clearInterval(
            timerInterval
        );


        timerInterval =
            null;


        const minutes =
            Math.max(
                1,
                Math.round(
                    Number(
                        selectedDuration
                    ) || 0
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
         * Save session.
         */
        recordStudySession(
            minutes,
            earnedXP,
            current
        );


        /*
         * XP.
         */
        addXP(
            earnedXP
        );


        /*
         * Record today's study day.
         *
         * This is the important part:
         *
         * TIMER COMPLETE
         *       ↓
         * TODAY = TRUE
         *       ↓
         * STREAK ENGINE
         */
        const streakResult =
            recordStreakActivity();


        /*
         * Update UI.
         */
        updateTimerUI();

        renderStats();

        renderHistory();


        /*
         * Normal timer completion modal.
         *
         * This is NOT the streak popup.
         */
        showCompletion(
            minutes,
            earnedXP
        );


        /*
         * Shared timer completion event.
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
         * IMPORTANT
         *
         * We deliberately DO NOT call
         * the global Milo celebration here.
         *
         * The Study Streak page owns its
         * own Milo celebration.
         */


        /*
         * Dispatch streak update.
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


        sessions.unshift({

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

            minutes,

            xp,

            completed:
                true

        });


        saveJSON(
            KEYS.SESSIONS,
            sessions.slice(
                0,
                100
            )
        );


        /*
         * Generic session structure.
         */
        const genericSessions =
            safeJSON(
                "studyMindStudySessions",
                []
            );


        const alreadyExists =
            genericSessions.some(
                session =>
                    session &&
                    session.day ===
                        todayKey() &&
                    session.topic ===
                        (
                            current?.topic ||
                            "Study Session"
                        ) &&
                    Number(
                        session.minutes
                    ) === minutes
            );


        if (!alreadyExists) {

            genericSessions.unshift({

                id:
                    `timer_${Date.now()}`,

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

                minutes,

                xp,

                completed:
                    true

            });


            saveJSON(
                "studyMindStudySessions",
                genericSessions.slice(
                    0,
                    100
                )
            );

        }

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

        const currentXP =
            Number(
                localStorage.getItem(
                    KEYS.XP
                )
            ) || 0;


        localStorage.setItem(
            KEYS.XP,
            String(
                currentXP + amount
            )
        );


        const totalXP =
            Number(
                localStorage.getItem(
                    KEYS.TOTAL_XP
                )
            ) || 0;


        localStorage.setItem(
            KEYS.TOTAL_XP,
            String(
                totalXP + amount
            )
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


        /*
         * A timer completion means the student
         * studied today.
         *
         * Do NOT require every planned topic
         * to be completed.
         */
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


        /*
         * Ask the existing streak engine
         * to recalculate itself.
         */
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

                }

                else if (
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
       -----------------------------------------------------
       This popup is ONLY for pages that explicitly
       want the timer completion popup.

       The Study Streak page has its own celebration.
    ===================================================== */

    function showStreakPopup(
        streak
    ) {

        let popup =
            document.getElementById(
                "studyMindStreakPopup"
            );


        /*
         * If another page already has the popup,
         * update and show it.
         */
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
                        rgba(
                            8,
                            15,
                            30,
                            0.58
                        );

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
                        min(
                            420px,
                            100%
                        );

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
                        rgba(
                            0,
                            0,
                            0,
                            0.28
                        );

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

                    transition:
                        transform
                        0.15s ease;

                }


                .study-mind-streak-button:hover {

                    transform:
                        translateY(-2px);

                }


                .study-mind-streak-button:active {

                    transform:
                        scale(0.97);

                }


                @keyframes
                studyMindFireBounce {

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

            /*
             * IMPORTANT:
             * onclick replaces any previous
             * handler instead of stacking handlers.
             */
            button.onclick =
                function () {

                    popup.classList.remove(
                        "show"
                    );

                    popup.style.pointerEvents =
                        "none";

                    setTimeout(
                        () => {

                            if (
                                !popup.classList.contains(
                                    "show"
                                )
                            ) {

                                popup.style.visibility =
                                    "hidden";

                            }

                        },
                        300
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
       STATS
    ===================================================== */

    function renderStats() {

        const sessions =
            safeJSON(
                KEYS.SESSIONS,
                []
            );


        const today =
            todayKey();


        const todaySessions =
            sessions.filter(
                session =>
                    session.day === today
            );


        const minutes =
            todaySessions.reduce(
                (
                    total,
                    session
                ) =>
                    total +
                    Number(
                        session.minutes ||
                        0
                    ),
                0
            );


        const xp =
            todaySessions.reduce(
                (
                    total,
                    session
                ) =>
                    total +
                    Number(
                        session.xp ||
                        0
                    ),
                0
            );


        const minutesElement =
            $("todayMinutes");


        if (minutesElement) {

            minutesElement.textContent =
                minutes;

        }


        const sessionsElement =
            $("todaySessions");


        if (sessionsElement) {

            sessionsElement.textContent =
                todaySessions.length;

        }


        const xpElement =
            $("todayXP");


        if (xpElement) {

            xpElement.textContent =
                xp;

        }

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
                `${sessions.length} session${sessions.length === 1 ? "" : "s"}`;

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
                    selectedDuration

            }
        );


        renderCurrentTopic();


        resetTimer();

        startTimer();

    }


    /* =====================================================
       DURATION
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


        selectedDuration =
            Number(minutes);


        localStorage.setItem(
            KEYS.DURATION,
            String(
                selectedDuration
            )
        );


        remainingSeconds =
            selectedDuration * 60;


        localStorage.setItem(
            KEYS.SECONDS,
            String(
                remainingSeconds
            )
        );


        document
            .querySelectorAll(
                ".duration-button"
            )
            .forEach(
                button => {

                    button.classList.toggle(
                        "active",
                        Number(
                            button.dataset.minutes
                        ) ===
                        selectedDuration
                    );

                }
            );


        updateTimerUI();

        dispatchTimerChanged();

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
            userNameElement.textContent ===
                "Student"
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
            String(name)
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

        selectedDuration =
            Number(
                localStorage.getItem(
                    KEYS.DURATION
                )
            ) || 25;


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


            /*
             * If another page completed the timer,
             * this page should update itself but
             * MUST NOT create another completion.
             */
            if (
                event.key ===
                KEYS.LAST_COMPLETED
            ) {

                const completionId =
                    event.newValue;


                if (!completionId) {

                    return;

                }


                renderStats();

                renderHistory();

                updateTimerUI();

            }

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
                            selectedDuration

                    }

                }
            )
        );

    }


    /* =====================================================
       BUTTONS
    ===================================================== */

    function setupControls() {

        const startPause =
            $("startPauseTimer");


        if (startPause) {

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


        const reset =
            $("resetTimer");


        if (reset) {

            reset.addEventListener(
                "click",
                resetTimer
            );

        }


        const recommended =
            $("useRecommended");


        if (recommended) {

            recommended.addEventListener(
                "click",
                useRecommendedSession
            );

        }


        const closeCompletion =
            $("closeCompletion");


        if (closeCompletion) {

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


        document
            .querySelectorAll(
                ".duration-button"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            selectDuration(
                                button.dataset.minutes
                            );

                        }
                    );

                }
            );

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

                duration:
                    selectedDuration

            }),

        getCurrentTopic:
            getCurrentStudyTopic,

        calculateStreak,

        recordStreakActivity

    };

})();


/* =========================================================
   PAGE INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        window.StudyMindTimer.initialize();

        /*
         * Connect controls after the DOM exists.
         */
        setupTimerPageControls();

    }
);


/* =========================================================
   PAGE-SPECIFIC CONTROLS
========================================================= */

function setupTimerPageControls() {

    const timer =
        window.StudyMindTimer;


    if (!timer) {

        return;

    }


    /*
     * Start / pause button.
     */
    const startPause =
        document.getElementById(
            "startPauseTimer"
        );


    if (
        startPause &&
        !startPause.dataset.timerBound
    ) {

        startPause.dataset.timerBound =
            "true";


        startPause.addEventListener(
            "click",
            () => {

                const state =
                    timer.getState();


                if (state.running) {

                    timer.pause();

                } else {

                    timer.start();

                }

            }
        );

    }


    /*
     * Reset button.
     */
    const reset =
        document.getElementById(
            "resetTimer"
        );


    if (
        reset &&
        !reset.dataset.timerBound
    ) {

        reset.dataset.timerBound =
            "true";


        reset.addEventListener(
            "click",
            () => {

                timer.reset();

            }
        );

    }


    /*
     * Close completion modal.
     */
    const closeCompletion =
        document.getElementById(
            "closeCompletion"
        );


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
                    document.getElementById(
                        "completionModal"
                    );


                if (modal) {

                    modal.classList.remove(
                        "show"
                    );

                }

            }
        );

    }


    /*
     * Render current topic.
     */
    const current =
        timer.getCurrentTopic();


    if (current) {

        const subject =
            document.getElementById(
                "currentSubject"
            );


        const topic =
            document.getElementById(
                "currentTopic"
            );


        const recommendedSubject =
            document.getElementById(
                "recommendedSubject"
            );


        const recommendedTopic =
            document.getElementById(
                "recommendedTopic"
            );


        if (subject) {

            subject.textContent =
                current.subject;

        }


        if (topic) {

            topic.textContent =
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

}
