
"use strict";

/* =========================================================
   STUDYMIND AI — SHARED STUDY TIMER
   COMPLETE REPLACEMENT

   SINGLE SOURCE OF TRUTH FOR:
   ✓ Timer state
   ✓ Timer countdown
   ✓ Timer completion
   ✓ Study-session recording
   ✓ Live study minutes
   ✓ Timer XP
   ✓ Timer completion event

   USED BY:
   ✓ dashboard.html
   ✓ study-timer.html
   ✓ study-session.html

   IMPORTANT:
   Timer completion does NOT complete a topic.
   Topic completion remains controlled by Study Session /
   Knowledge Check.
========================================================= */

(() => {

    /* =====================================================
       STORAGE
    ===================================================== */

    const K = {

        SECONDS:
            "studyMindTimerSeconds",

        END:
            "studyMindTimerEndTime",

        RUNNING:
            "studyMindTimerRunning",

        SELECTED:
            "studyMindSelectedTimerSeconds",

        SESSION:
            "studyMindCurrentStudySession",

        SESSIONS:
            "studyMindStudySessions",

        XP:
            "studyMindXP",

        TOTAL_XP:
            "studyMindTotalXP",

        DAILY_TIME:
            "studyMindDailyStudyTime",

        STREAK_ACTIVITY:
            "studyMindStreakActivity",

        CURRENT_TOPIC:
            "studyMindCurrentTopic",

        CURRENT_TOPIC_INDEX:
            "studyMindCurrentTopicIndex",

        LAST_COMPLETION:
            "studyMindLastTimerCompletedAt",

        LAST_CELEBRATION:
            "studyMindLastTimerCelebratedAt",

        LIVE_XP_MINUTE:
            "studyMindTimerAwardedMinute",

        SESSION_START:
            "studyMindTimerSessionStart",

        SESSION_BASE_MINUTES:
            "studyMindTimerSessionBaseMinutes"

    };


    /* =====================================================
       DEFAULTS
    ===================================================== */

    const DEFAULT_SECONDS =
        25 * 60;

    const VALID_PRESETS = [
        25 * 60,
        45 * 60,
        60 * 60
    ];


    /* =====================================================
       STATE
    ===================================================== */

    let seconds =
        DEFAULT_SECONDS;

    let selectedSeconds =
        DEFAULT_SECONDS;

    let running =
        false;

    let endTime =
        null;

    let interval =
        null;

    let initialized =
        false;

    let controlsInitialized =
        false;

    let completionLocked =
        false;


    /* =====================================================
       HELPERS
    ===================================================== */

    function getNumber(
        key,
        fallback = 0
    ) {

        const value =
            Number(
                localStorage.getItem(key)
            );

        return Number.isFinite(value)
            ? value
            : fallback;

    }


    function getJSON(
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

        } catch (error) {

            console.warn(
                "StudyMind timer storage error:",
                error
            );

        }

    }


    function todayKey() {

        const date =
            new Date();

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


    function formatSeconds(
        value
    ) {

        value =
            Math.max(
                0,
                Math.floor(
                    Number(value) || 0
                )
            );


        const minutes =
            Math.floor(
                value / 60
            );


        const remaining =
            value % 60;


        return (
            String(minutes)
                .padStart(2, "0") +
            ":" +
            String(remaining)
                .padStart(2, "0")
        );

    }


    function dispatch(
        name,
        detail = {}
    ) {

        window.dispatchEvent(
            new CustomEvent(
                name,
                {
                    detail
                }
            )
        );

    }


    /* =====================================================
       STORAGE SYNCHRONIZATION
    ===================================================== */

    function saveTimerState() {

        localStorage.setItem(
            K.SECONDS,
            String(
                Math.max(
                    0,
                    Math.floor(seconds)
                )
            )
        );


        localStorage.setItem(
            K.SELECTED,
            String(
                selectedSeconds
            )
        );


        localStorage.setItem(
            K.RUNNING,
            running
                ? "true"
                : "false"
        );


        if (
            running &&
            Number.isFinite(endTime)
        ) {

            localStorage.setItem(
                K.END,
                String(endTime)
            );

        } else {

            localStorage.removeItem(
                K.END
            );

        }

    }


    /* =====================================================
       LOAD STATE
    ===================================================== */

    function loadState() {

        const storedSelected =
            getNumber(
                K.SELECTED,
                DEFAULT_SECONDS
            );


        selectedSeconds =
            storedSelected > 0
                ? storedSelected
                : DEFAULT_SECONDS;


        const storedSeconds =
            getNumber(
                K.SECONDS,
                selectedSeconds
            );


        seconds =
            Math.max(
                0,
                storedSeconds
            );


        running =
            localStorage.getItem(
                K.RUNNING
            ) === "true";


        const storedEnd =
            getNumber(
                K.END,
                0
            );


        endTime =
            storedEnd > 0
                ? storedEnd
                : null;


        /*
         * If another page was running the timer,
         * reconstruct the remaining time from the
         * authoritative end timestamp.
         */

        if (
            running &&
            Number.isFinite(endTime)
        ) {

            seconds =
                Math.max(
                    0,
                    Math.ceil(
                        (
                            endTime -
                            Date.now()
                        ) / 1000
                    )
                );


            if (
                seconds <= 0
            ) {

                finishTimer();

                return;

            }

        }


        /*
         * Make sure storage always contains a
         * valid timer duration.
         */

        saveTimerState();

    }


    /* =====================================================
       CURRENT TOPIC
    ===================================================== */

    function getCurrentTopic() {

        const direct =
            getJSON(
                K.CURRENT_TOPIC,
                null
            );


        if (
            direct &&
            typeof direct === "object"
        ) {

            return direct;

        }


        const plan =
            getJSON(
                "studyMindPlan",
                null
            );


        if (!plan) {
            return null;
        }


        const index =
            getNumber(
                K.CURRENT_TOPIC_INDEX,
                0
            );


        const topics = [];


        if (
            Array.isArray(
                plan.subjects
            )
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

                            if (
                                typeof topic === "string"
                            ) {

                                topics.push({

                                    subject:
                                        subject?.name ||
                                        subject?.subject ||
                                        "",

                                    topic

                                });

                            } else if (
                                topic &&
                                typeof topic === "object"
                            ) {

                                topics.push({

                                    subject:
                                        topic.subject ||
                                        subject?.name ||
                                        subject?.subject ||
                                        "",

                                    topic:
                                        topic.name ||
                                        topic.title ||
                                        topic.topic ||
                                        ""

                                });

                            }

                        }
                    );

                }
            );

        }


        if (
            Array.isArray(
                plan.topics
            )
        ) {

            plan.topics.forEach(
                topic => {

                    if (
                        typeof topic === "string"
                    ) {

                        topics.push({
                            subject: "",
                            topic
                        });

                    } else if (
                        topic &&
                        typeof topic === "object"
                    ) {

                        topics.push({

                            subject:
                                topic.subject ||
                                "",

                            topic:
                                topic.name ||
                                topic.title ||
                                topic.topic ||
                                ""

                        });

                    }

                }
            );

        }


        return (
            topics[index] ||
            topics[0] ||
            null
        );

    }


    /* =====================================================
       SESSION START
    ===================================================== */

    function ensureSessionStart() {

        let start =
            getNumber(
                K.SESSION_START,
                0
            );


        if (
            !start ||
            !running
        ) {

            start =
                Date.now();


            localStorage.setItem(
                K.SESSION_START,
                String(start)
            );

        }


        return start;

    }


    /* =====================================================
       LIVE STUDY MINUTES
    ===================================================== */

    function getElapsedSeconds() {

        if (
            !running ||
            !Number.isFinite(endTime)
        ) {

            return 0;

        }


        const elapsed =
            (
                getNumber(
                    K.SESSION_START,
                    Date.now()
                ) === 0
            )
                ? 0
                : (
                    Date.now() -
                    getNumber(
                        K.SESSION_START,
                        Date.now()
                    )
                ) / 1000;


        return Math.max(
            0,
            elapsed
        );

    }


    function getLiveMinutes() {

        return Math.floor(
            getElapsedSeconds() / 60
        );

    }


    /* =====================================================
       LIVE XP
       -----------------------------------------------------
       1 XP per completed minute.

       XP is awarded once per minute, not every
       timer tick, so it cannot duplicate.
    ===================================================== */

    function awardLiveXP() {

        if (!running) {
            return;
        }


        const elapsedMinutes =
            getLiveMinutes();


        const alreadyAwarded =
            getNumber(
                K.LIVE_XP_MINUTE,
                0
            );


        if (
            elapsedMinutes <=
            alreadyAwarded
        ) {

            return;

        }


        const newMinutes =
            elapsedMinutes -
            alreadyAwarded;


        const xp =
            Math.max(
                0,
                newMinutes
            );


        if (
            xp <= 0
        ) {
            return;
        }


        const currentXP =
            getNumber(
                K.XP,
                0
            );


        const totalXP =
            currentXP +
            xp;


        localStorage.setItem(
            K.XP,
            String(totalXP)
        );


        localStorage.setItem(
            K.TOTAL_XP,
            String(totalXP)
        );


        localStorage.setItem(
            K.LIVE_XP_MINUTE,
            String(
                elapsedMinutes
            )
        );


        dispatch(
            "studyMindXPUpdated",
            {

                amount:
                    xp,

                total:
                    totalXP,

                reason:
                    "timer-study-minute"

            }
        );

    }


    /* =====================================================
       DAILY STUDY TIME
    ===================================================== */

    function addDailyMinutes(
        minutes
    ) {

        minutes =
            Math.max(
                0,
                Number(minutes) || 0
            );


        if (
            minutes <= 0
        ) {
            return;
        }


        const data =
            getJSON(
                K.DAILY_TIME,
                {}
            );


        const today =
            todayKey();


        data[today] =
            Number(
                data[today] || 0
            ) +
            minutes;


        saveJSON(
            K.DAILY_TIME,
            data
        );

    }


    /* =====================================================
       RECORD SESSION
    ===================================================== */

    function recordStudySession(
        minutes,
        earnedXP,
        topic
    ) {

        minutes =
            Math.max(
                0,
                Number(minutes) || 0
            );


        earnedXP =
            Math.max(
                0,
                Number(earnedXP) || 0
            );


        const sessions =
            getJSON(
                K.SESSIONS,
                []
            );


        const safeSessions =
            Array.isArray(sessions)
                ? sessions
                : [];


        safeSessions.push({

            date:
                todayKey(),

            timestamp:
                Date.now(),

            minutes,

            xp:
                earnedXP,

            subject:
                topic?.subject ||
                "",

            topic:
                topic?.topic ||
                "",

            completed:
                true

        });


        saveJSON(
            K.SESSIONS,
            safeSessions
        );


        addDailyMinutes(
            minutes
        );

    }


    /* =====================================================
       STREAK ACTIVITY
       -----------------------------------------------------
       This records actual study activity.

       It does NOT mark a topic completed.
       It does NOT fake knowledge-check completion.
    ===================================================== */

    function recordTimerActivity() {

        const activity =
            getJSON(
                K.STREAK_ACTIVITY,
                {}
            );


        const safeActivity =
            activity &&
            typeof activity === "object"
                ? activity
                : {};


        const today =
            todayKey();


        safeActivity[today] =
            true;


        saveJSON(
            K.STREAK_ACTIVITY,
            safeActivity
        );


        /*
         * Ask the streak engine to synchronize
         * from the activity ledger.
         */

        if (
            window.StudyMindStreak &&
            typeof
                window.StudyMindStreak
                    .recordTimerStudyActivity ===
                "function"
        ) {

            window.StudyMindStreak
                .recordTimerStudyActivity();

        } else if (
            window.StudyMindStreak &&
            typeof
                window.StudyMindStreak
                    .syncStreakFromActivity ===
                "function"
        ) {

            window.StudyMindStreak
                .syncStreakFromActivity();

        }


        dispatch(
            "studyMindStreakUpdated",
            {
                source:
                    "study-timer"
            }
        );

    }


    /* =====================================================
       COMPLETION CELEBRATION
    ===================================================== */

    function celebrateCompletion(
        minutes,
        xp
    ) {

        /*
         * Never celebrate the same completion twice.
         */

        const completedAt =
            getNumber(
                K.LAST_COMPLETION,
                0
            );


        const now =
            Date.now();


        if (
            completedAt &&
            Math.abs(
                now -
                completedAt
            ) < 3000
        ) {

            return;

        }


        localStorage.setItem(
            K.LAST_COMPLETION,
            String(now)
        );


        /*
         * Milo integration.
         */

        try {

            if (
                window.Milo &&
                typeof
                    window.Milo
                        .miloStudySessionComplete ===
                    "function"
            ) {

                const streak =
                    window.StudyMindStreak &&
                    typeof
                        window.StudyMindStreak
                            .calculateCurrentStreak ===
                        "function"
                        ? window.StudyMindStreak
                            .calculateCurrentStreak()
                        : 0;


                window.Milo
                    .miloStudySessionComplete(
                        streak
                    );

            } else if (
                window.Milo &&
                typeof
                    window.Milo
                        .celebrateStreak ===
                    "function"
            ) {

                window.Milo
                    .celebrateStreak(
                        1
                    );

            }

        } catch (error) {

            console.warn(
                "StudyMind Milo celebration failed:",
                error
            );

        }


        /*
         * Browser sound.
         */

        playCompletionSound();


        dispatch(
            "studyMindTimerCompleted",
            {

                minutes,

                xp,

                topic:
                    getCurrentTopic(),

                source:
                    "shared-timer"

            }
        );

    }


    /* =====================================================
       COMPLETION SOUND
    ===================================================== */

    function playCompletionSound() {

        try {

            const AudioContext =
                window.AudioContext ||
                window.webkitAudioContext;


            if (!AudioContext) {
                return;
            }


            const context =
                new AudioContext();


            const oscillator =
                context.createOscillator();


            const gain =
                context.createGain();


            oscillator.type =
                "sine";


            oscillator.frequency.value =
                660;


            gain.gain.setValueAtTime(
                0.0001,
                context.currentTime
            );


            gain.gain.exponentialRampToValueAtTime(
                0.18,
                context.currentTime + 0.03
            );


            gain.gain.exponentialRampToValueAtTime(
                0.0001,
                context.currentTime + 0.55
            );


            oscillator.connect(
                gain
            );


            gain.connect(
                context.destination
            );


            oscillator.start();


            oscillator.stop(
                context.currentTime + 0.6
            );


        } catch {

            /* Audio is optional. */

        }

    }


    /* =====================================================
       FINISH TIMER
    ===================================================== */

    function finishTimer() {

        if (
            completionLocked
        ) {

            return;

        }


        completionLocked =
            true;


        stopInterval();


        /*
         * Calculate the actual completed duration
         * from the selected timer duration.
         */

        const durationSeconds =
            selectedSeconds;


        const minutes =
            Math.max(
                1,
                Math.round(
                    durationSeconds / 60
                )
            );


        /*
         * Any live minute XP has already been awarded.
         * Do not award it again.
         */

        const alreadyAwarded =
            getNumber(
                K.LIVE_XP_MINUTE,
                0
            );


        const finalXP =
            alreadyAwarded;


        running =
            false;


        seconds =
            0;


        endTime =
            null;


        localStorage.setItem(
            K.SECONDS,
            "0"
        );


        localStorage.setItem(
            K.RUNNING,
            "false"
        );


        localStorage.removeItem(
            K.END
        );


        /*
         * A five-second developer test must not
         * create a fake 25 XP reward.
         */

        const testDuration =
            durationSeconds < 60;


        const recordedMinutes =
            testDuration
                ? 0
                : minutes;


        const recordedXP =
            testDuration
                ? 0
                : finalXP;


        if (
            recordedMinutes > 0
        ) {

            recordStudySession(
                recordedMinutes,
                recordedXP,
                getCurrentTopic()
            );

        }


        /*
         * Actual timer activity.
         */

        if (
            recordedMinutes > 0
        ) {

            recordTimerActivity();

        }


        /*
         * Reset live-session counters,
         * but keep selected duration.
         */

        localStorage.removeItem(
            K.SESSION_START
        );


        localStorage.removeItem(
            K.LIVE_XP_MINUTE
        );


        renderEverything();


        celebrateCompletion(
            recordedMinutes,
            recordedXP
        );


        completionLocked =
            false;

    }


    /* =====================================================
       START
    ===================================================== */

    function startTimer() {

        if (
            running
        ) {

            return;

        }


        if (
            seconds <= 0
        ) {

            seconds =
                selectedSeconds;

        }


        /*
         * If the timer was paused, seconds already
         * contains the remaining time.
         */

        ensureSessionStart();


        endTime =
            Date.now() +
            seconds * 1000;


        running =
            true;


        localStorage.setItem(
            K.LIVE_XP_MINUTE,
            "0"
        );


        saveTimerState();


        startInterval();


        renderEverything();


        dispatch(
            "studyMindTimerChanged",
            {
                running: true,
                seconds
            }
        );

    }


    /* =====================================================
       PAUSE
    ===================================================== */

    function pauseTimer() {

        if (
            !running
        ) {

            return;

        }


        updateRemaining();


        /*
         * Award any full minutes reached before
         * pausing.
         */

        awardLiveXP();


        running =
            false;


        endTime =
            null;


        localStorage.setItem(
            K.RUNNING,
            "false"
        );


        localStorage.setItem(
            K.SECONDS,
            String(
                seconds
            )
        );


        localStorage.removeItem(
            K.END
        );


        stopInterval();


        renderEverything();


        dispatch(
            "studyMindTimerChanged",
            {
                running: false,
                seconds
            }
        );

    }


    /* =====================================================
       RESET
    ===================================================== */

    function resetTimer() {

        stopInterval();


        running =
            false;


        endTime =
            null;


        seconds =
            selectedSeconds;


        localStorage.setItem(
            K.RUNNING,
            "false"
        );


        localStorage.setItem(
            K.SECONDS,
            String(
                selectedSeconds
            )
        );


        localStorage.removeItem(
            K.END
        );


        localStorage.removeItem(
            K.SESSION_START
        );


        localStorage.removeItem(
            K.LIVE_XP_MINUTE
        );


        renderEverything();


        dispatch(
            "studyMindTimerChanged",
            {
                running: false,
                seconds
            }
        );

    }


    /* =====================================================
       DURATION
    ===================================================== */

    function selectDuration(
        value
    ) {

        value =
            Number(value);


        if (
            !Number.isFinite(value) ||
            value <= 0
        ) {

            return;

        }


        if (
            running
        ) {

            return;

        }


        selectedSeconds =
            value;


        seconds =
            value;


        localStorage.setItem(
            K.SELECTED,
            String(
                value
            )
        );


        localStorage.setItem(
            K.SECONDS,
            String(
                value
            )
        );


        localStorage.setItem(
            K.RUNNING,
            "false"
        );


        localStorage.removeItem(
            K.END
        );


        renderEverything();


        dispatch(
            "studyMindTimerChanged",
            {
                running: false,
                seconds
            }
        );

    }


    /* =====================================================
       UPDATE REMAINING
    ===================================================== */

    function updateRemaining() {

        if (
            !running ||
            !Number.isFinite(endTime)
        ) {

            return;

        }


        seconds =
            Math.max(
                0,
                Math.ceil(
                    (
                        endTime -
                        Date.now()
                    ) / 1000
                )
            );


        localStorage.setItem(
            K.SECONDS,
            String(
                seconds
            )
        );


        if (
            seconds <= 0
        ) {

            finishTimer();

            return;

        }


        awardLiveXP();

        renderEverything();


        dispatch(
            "studyMindTimerChanged",
            {
                running: true,
                seconds
            }
        );

    }


    /* =====================================================
       INTERVAL
    ===================================================== */

    function startInterval() {

        stopInterval();


        interval =
            window.setInterval(
                () => {

                    updateRemaining();

                },
                250
            );

    }


    function stopInterval() {

        if (
            interval
        ) {

            window.clearInterval(
                interval
            );

            interval =
                null;

        }

    }


    /* =====================================================
       RECOMMENDED SESSION
    ===================================================== */

    function useRecommendedSession() {

        const plan =
            getJSON(
                "studyMindPlan",
                null
            );


        let topic =
            getCurrentTopic();


        /*
         * Try the first incomplete topic if
         * there is no current topic.
         */

        if (
            !topic &&
            plan
        ) {

            const completed =
                getJSON(
                    "studyMindCompletedTopics",
                    []
                );


            const completedSet =
                new Set(
                    Array.isArray(completed)
                        ? completed
                        : []
                );


            if (
                Array.isArray(
                    plan.subjects
                )
            ) {

                outer:
                for (
                    const subject
                    of plan.subjects
                ) {

                    if (
                        !Array.isArray(
                            subject?.topics
                        )
                    ) {
                        continue;
                    }


                    for (
                        const item
                        of subject.topics
                    ) {

                        const name =
                            typeof item === "string"
                                ? item
                                : (
                                    item?.name ||
                                    item?.title ||
                                    item?.topic ||
                                    ""
                                );


                        const key =
                            `${subject?.name || subject?.subject || ""}::${name}`;


                        if (
                            !completedSet.has(key) &&
                            !completedSet.has(name)
                        ) {

                            topic = {

                                subject:
                                    subject?.name ||
                                    subject?.subject ||
                                    "",

                                topic:
                                    name

                            };

                            break outer;

                        }

                    }

                }

            }

        }


        if (
            topic
        ) {

            localStorage.setItem(
                K.CURRENT_TOPIC,
                JSON.stringify(
                    topic
                )
            );

        }


        /*
         * This is the critical fix:
         * Recommended Session uses the SAME timer engine.
         */

        resetTimer();

        startTimer();


        renderEverything();

    }


    /* =====================================================
       UI
    ===================================================== */

    function renderTimerPage() {

        const display =
            document.getElementById(
                "timerDisplay"
            );


        if (
            display
        ) {

            display.textContent =
                formatSeconds(
                    seconds
                );

        }


        const label =
            document.getElementById(
                "timerLabel"
            );


        if (
            label
        ) {

            label.textContent =
                running
                    ? "Studying"
                    : seconds <= 0
                        ? "Complete"
                        : "Ready";

        }


        const status =
            document.getElementById(
                "sessionStatus"
            );


        if (
            status
        ) {

            status.textContent =
                running
                    ? "Focus session in progress"
                    : seconds <= 0
                        ? "Session complete 🎉"
                        : "Ready to study";

        }


        const elapsed =
            document.getElementById(
                "elapsedText"
            );


        if (
            elapsed
        ) {

            elapsed.textContent =
                `${getLiveMinutes()} min`;

        }


        const remaining =
            document.getElementById(
                "remainingText"
            );


        if (
            remaining
        ) {

            remaining.textContent =
                `${Math.ceil(seconds / 60)} min`;

        }


        const progress =
            document.getElementById(
                "timerProgress"
            );


        if (
            progress
        ) {

            const percent =
                selectedSeconds > 0
                    ? Math.min(
                        100,
                        Math.max(
                            0,
                            (
                                (
                                    selectedSeconds -
                                    seconds
                                ) /
                                selectedSeconds
                            ) *
                            100
                        )
                    )
                    : 0;


            progress.style.width =
                `${percent}%`;

        }


        const button =
            document.getElementById(
                "startPauseTimer"
            );


        if (
            button
        ) {

            button.textContent =
                running
                    ? "Pause"
                    : seconds < selectedSeconds &&
                      seconds > 0
                        ? "Resume"
                        : "Start";

        }


        updateTimerPresets();

    }


    function renderStats() {

        const sessions =
            getJSON(
                K.SESSIONS,
                []
            );


        const safeSessions =
            Array.isArray(sessions)
                ? sessions
                : [];


        const today =
            todayKey();


        const todaySessions =
            safeSessions.filter(
                session =>
                    session?.date === today &&
                    session?.completed === true
            );


        const completedMinutes =
            todaySessions.reduce(
                (
                    total,
                    session
                ) =>
                    total +
                    Number(
                        session?.minutes || 0
                    ),
                0
            );


        const liveMinutes =
            getLiveMinutes();


        const displayedMinutes =
            completedMinutes +
            liveMinutes;


        const completedXP =
            todaySessions.reduce(
                (
                    total,
                    session
                ) =>
                    total +
                    Number(
                        session?.xp || 0
                    ),
                0
            );


        const currentXP =
            getNumber(
                K.XP,
                0
            );


        const todayXP =
            completedXP +
            (
                running
                    ? Math.max(
                        0,
                        getNumber(
                            K.LIVE_XP_MINUTE,
                            0
                        )
                    )
                    : 0
            );


        const minutesElement =
            document.getElementById(
                "todayMinutes"
            );


        const sessionsElement =
            document.getElementById(
                "todaySessions"
            );


        const xpElement =
            document.getElementById(
                "todayXP"
            );


        if (
            minutesElement
        ) {

            minutesElement.textContent =
                String(
                    displayedMinutes
                );

        }


        if (
            sessionsElement
        ) {

            sessionsElement.textContent =
                String(
                    todaySessions.length +
                    (
                        running &&
                        liveMinutes > 0
                            ? 1
                            : 0
                    )
                );

        }


        if (
            xpElement
        ) {

            xpElement.textContent =
                String(
                    Math.max(
                        todayXP,
                        0
                    )
                );

        }


        /*
         * Keep total XP visible in any compatible
         * timer page.
         */

        const totalXPElement =
            document.getElementById(
                "totalXP"
            );


        if (
            totalXPElement
        ) {

            totalXPElement.textContent =
                String(
                    currentXP
                );

        }

    }


    function renderTopic() {

        const topic =
            getCurrentTopic();


        const subject =
            topic?.subject ||
            "StudyMind";


        const topicName =
            topic?.topic ||
            topic?.name ||
            "Recommended study topic";


        const subjectElement =
            document.getElementById(
                "currentSubject"
            );


        const topicElement =
            document.getElementById(
                "currentTopic"
            );


        if (
            subjectElement
        ) {

            subjectElement.textContent =
                subject;

        }


        if (
            topicElement
        ) {

            topicElement.textContent =
                topicName;

        }


        const recommendedSubject =
            document.getElementById(
                "recommendedSubject"
            );


        const recommendedTopic =
            document.getElementById(
                "recommendedTopic"
            );


        if (
            recommendedSubject
        ) {

            recommendedSubject.textContent =
                subject;

        }


        if (
            recommendedTopic
        ) {

            recommendedTopic.textContent =
                topicName;

        }

    }


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
            getJSON(
                K.SESSIONS,
                []
            );


        const safeSessions =
            Array.isArray(sessions)
                ? sessions
                : [];


        const recent =
            safeSessions
                .filter(
                    item =>
                        item?.completed
                )
                .slice(
                    -10
                )
                .reverse();


        if (
            count
        ) {

            count.textContent =
                `${safeSessions.filter(
                    item => item?.completed
                ).length} sessions`;

        }


        if (
            !recent.length
        ) {

            container.innerHTML =
                `
                <div class="empty-history">
                    Your completed study sessions will appear here.
                </div>
                `;

            return;

        }


        container.innerHTML =
            recent
                .map(
                    session => `

                        <div class="history-item">

                            <div>
                                <strong>
                                    ${escapeHTML(
                                        session.topic ||
                                        "Study Session"
                                    )}
                                </strong>

                                <span>
                                    ${escapeHTML(
                                        session.subject ||
                                        ""
                                    )}
                                </span>
                            </div>

                            <div>
                                ${Number(
                                    session.minutes || 0
                                )} min
                            </div>

                            <div>
                                +${Number(
                                    session.xp || 0
                                )} XP
                            </div>

                        </div>

                    `
                )
                .join("");

    }


    function updateTimerPresets() {

        document
            .querySelectorAll(
                ".duration-button"
            )
            .forEach(
                button => {

                    const value =
                        Number(
                            button.dataset.minutes
                        ) * 60;


                    button.classList.toggle(
                        "active",
                        value ===
                        selectedSeconds
                    );

                }
            );


        document
            .querySelectorAll(
                ".timer-preset"
            )
            .forEach(
                button => {

                    const value =
                        Number(
                            button.dataset.minutes
                        ) * 60;


                    button.classList.toggle(
                        "active",
                        value ===
                        selectedSeconds
                    );

                }
            );

    }


    function renderEverything() {

        renderTimerPage();

        renderStats();

        renderTopic();

        renderHistory();

    }


    /* =====================================================
       CONTROLS
    ===================================================== */

    function setupControls() {

        if (
            controlsInitialized
        ) {

            return;

        }


        controlsInitialized =
            true;


        /*
         * Main timer button.
         */

        document
            .getElementById(
                "startPauseTimer"
            )
            ?.addEventListener(
                "click",
                () => {

                    if (running) {

                        pauseTimer();

                    } else {

                        startTimer();

                    }

                }
            );


        /*
         * Reset.
         */

        document
            .getElementById(
                "resetTimer"
            )
            ?.addEventListener(
                "click",
                resetTimer
            );


        /*
         * Recommended Session.
         *
         * This was previously not connected correctly.
         */

        document
            .getElementById(
                "useRecommended"
            )
            ?.addEventListener(
                "click",
                useRecommendedSession
            );


        /*
         * 25 / 45 / 60 minute buttons.
         */

        document
            .querySelectorAll(
                ".duration-button"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const minutes =
                                Number(
                                    button.dataset.minutes
                                );


                            if (
                                Number.isFinite(
                                    minutes
                                ) &&
                                minutes > 0
                            ) {

                                selectDuration(
                                    minutes * 60
                                );

                            }

                        }
                    );

                }
            );


        document
            .querySelectorAll(
                ".timer-preset"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const minutes =
                                Number(
                                    button.dataset.minutes
                                );


                            if (
                                Number.isFinite(
                                    minutes
                                ) &&
                                minutes > 0
                            ) {

                                selectDuration(
                                    minutes * 60
                                );

                            }

                        }
                    );

                }
            );


        /*
         * Completion modal.
         */

        document
            .getElementById(
                "closeCompletion"
            )
            ?.addEventListener(
                "click",
                () => {

                    document
                        .getElementById(
                            "completionModal"
                        )
                        ?.classList.remove(
                            "show"
                        );

                }
            );

    }


    /* =====================================================
       COMPLETION MODAL
    ===================================================== */

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


        const minutesElement =
            document.getElementById(
                "earnedMinutes"
            );


        const xpElement =
            document.getElementById(
                "earnedXP"
            );


        const message =
            document.getElementById(
                "completionMessage"
            );


        if (
            minutesElement
        ) {

            minutesElement.textContent =
                String(
                    minutes
                );

        }


        if (
            xpElement
        ) {

            xpElement.textContent =
                String(
                    xp
                );

        }


        if (
            message
        ) {

            message.textContent =
                `You completed ${minutes} minutes of focused study.`;

        }


        modal.classList.add(
            "show"
        );

    }


    /* =====================================================
       PUBLIC INITIALIZATION
    ===================================================== */

    function initialize() {

        if (
            !initialized
        ) {

            initialized =
                true;


            loadState();


            /*
             * Controls must be initialized here.
             * This fixes the old bug where initialize()
             * only initialized state but never attached
             * the Study Timer page buttons.
             */

            setupControls();

        } else {

            loadState();

        }


        /*
         * If another page had the timer running,
         * continue it here.
         */

        if (
            running
        ) {

            startInterval();

        }


        renderEverything();

    }


    /* =====================================================
       CROSS-PAGE STORAGE
    ===================================================== */

    window.addEventListener(
        "storage",
        event => {

            if (
                [
                    K.SECONDS,
                    K.END,
                    K.RUNNING,
                    K.SELECTED,
                    K.XP,
                    K.SESSIONS
                ].includes(
                    event.key
                )
            ) {

                loadState();

                renderEverything();

            }

        }
    );


    window.addEventListener(
        "studyMindTimerChanged",
        () => {

            loadState();

            renderEverything();

        }
    );


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.StudyMindTimer = {

        start:
            startTimer,

        pause:
            pauseTimer,

        reset:
            resetTimer,

        complete:
            finishTimer,

        initialize,

        selectDuration,

        useRecommendedSession,

        getState:
            () => ({

                running,

                seconds,

                endTime,

                selectedSeconds,

                elapsedSeconds:
                    getElapsedSeconds(),

                elapsedMinutes:
                    getLiveMinutes()

            }),

        getCurrentTopic,

        calculateXP:
            minutes =>
                Math.max(
                    0,
                    Number(minutes) || 0
                ),

        recordStreakActivity:
            recordTimerActivity,
       
        renderStats,

        renderHistory,

        getTodayMinutes:
            () => {

                const sessions =
                    getJSON(
                        K.SESSIONS,
                        []
                    );


                return (
                    Array.isArray(sessions)
                        ? sessions
                            .filter(
                                session =>
                                    session?.date ===
                                    todayKey() &&
                                    session?.completed
                            )
                            .reduce(
                                (
                                    total,
                                    session
                                ) =>
                                    total +
                                    Number(
                                        session?.minutes ||
                                        0
                                    ),
                                0
                            )
                        : 0
                ) +
                getLiveMinutes();

            },

        getTodaySessionCount:
            () => {

                const sessions =
                    getJSON(
                        K.SESSIONS,
                        []
                    );


                return Array.isArray(sessions)
                    ? sessions.filter(
                        session =>
                            session?.date ===
                            todayKey() &&
                            session?.completed
                    ).length
                    : 0;

            },

        getTodayXP:
            () => {

                const sessions =
                    getJSON(
                        K.SESSIONS,
                        []
                    );


                return Array.isArray(sessions)
                    ? sessions
                        .filter(
                            session =>
                                session?.date ===
                                todayKey() &&
                                session?.completed
                        )
                        .reduce(
                            (
                                total,
                                session
                            ) =>
                                total +
                                Number(
                                    session?.xp ||
                                    0
                                ),
                            0
                        ) +
                        (
                            running
                                ? getNumber(
                                    K.LIVE_XP_MINUTE,
                                    0
                                )
                                : 0
                        )
                    : 0;

            }

    };


    /* =====================================================
       DOM READY
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            {
                once: true
            }
        );

    } else {

        initialize();

    }


    /* =====================================================
       HTML ESCAPE
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

})();

