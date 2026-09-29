"use strict";

/* =========================================================
   STUDYMIND AI — SHARED STUDY TIMER
   SINGLE SOURCE OF TRUTH

   Timer owner:
   ✓ Start / pause
   ✓ Reset
   ✓ Duration selection
   ✓ Completion
   ✓ Study-time recording
   ✓ XP
   ✓ Streak activity
   ✓ Milo celebration

   Used by:
   ✓ study-timer.html
   ✓ study-session.html
   ✓ dashboard.html

   IMPORTANT
   ---------------------------------------------------------
   dashboard.js MUST NOT control the timer directly.
   It only reads window.StudyMindTimer and displays state.

   This prevents duplicate click handlers and competing
   timer loops.
========================================================= */

(function () {

    /* =========================================================
       KEYS
    ========================================================= */

    const KEYS = {

        SECONDS:
            "studyMindTimerSeconds",

        END_TIME:
            "studyMindTimerEndTime",

        RUNNING:
            "studyMindTimerRunning",

        SELECTED:
            "studyMindSelectedTimerSeconds",

        CURRENT_TOPIC:
            "studyMindCurrentTopic",

        CURRENT_TOPIC_INDEX:
            "studyMindCurrentTopicIndex",

        STUDY_SESSIONS:
            "studyMindStudySessions",

        DAILY_TIME:
            "studyMindDailyStudyTime",

        STUDY_HISTORY:
            "studyMindStudyHistory",

        XP:
            "studyMindXP",

        TOTAL_XP:
            "studyMindTotalXP",

        STREAK_ACTIVITY:
            "studyMindStreakActivity",

        SESSION_START:
            "studyMindTimerSessionStart",

        SESSION_BASE_SECONDS:
            "studyMindTimerBaseSeconds",

        SESSION_BASE_LEGACY:
            "studyMindTimerSessionBaseMinutes",

        AWARDED_MINUTE:
            "studyMindTimerAwardedMinute",

        LAST_COMPLETED:
            "studyMindLastTimerCompletedAt",

        LAST_CELEBRATED:
            "studyMindLastTimerCelebratedAt",

        COMPLETED_TIMER_SESSIONS:
            "studyMindCompletedTimerSessions"
    };


    /* =========================================================
       CONFIG
    ========================================================= */

    const PRESETS = [
        25,
        45,
        60
    ];

    const DEFAULT_SECONDS =
        25 * 60;


    /* =========================================================
       STATE
    ========================================================= */

    let state = {

        seconds:
            DEFAULT_SECONDS,

        selectedSeconds:
            DEFAULT_SECONDS,

        running:
            false,

        endTime:
            null,

        interval:
            null,

        initialized:
            false,

        completionLocked:
            false,

        sessionStart:
            null,

        baseSeconds:
            DEFAULT_SECONDS,

        awardedMinute:
            0,

        lastPersistedLiveMinute:
            -1
    };


    /* =========================================================
       DATE
    ========================================================= */

    function todayKey() {

        const now =
            new Date();

        return (
            now.getFullYear() +
            "-" +
            String(
                now.getMonth() + 1
            ).padStart(2, "0") +
            "-" +
            String(
                now.getDate()
            ).padStart(2, "0")
        );
    }


    /* =========================================================
       STORAGE HELPERS
    ========================================================= */

    function readJSON(
        key,
        fallback
    ) {

        try {

            const value =
                localStorage.getItem(
                    key
                );

            return value
                ? JSON.parse(value)
                : fallback;

        } catch {

            return fallback;
        }
    }


    function writeJSON(
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
                "StudyMind Timer: failed to save",
                key,
                error
            );
        }
    }


    function number(
        key,
        fallback = 0
    ) {

        const value =
            Number(
                localStorage.getItem(
                    key
                )
            );

        return Number.isFinite(value)
            ? value
            : fallback;
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
                String(
                    value ?? ""
                );
        }
    }


    function formatTime(
        seconds
    ) {

        seconds =
            Math.max(
                0,
                Math.floor(
                    Number(
                        seconds
                    ) || 0
                )
            );

        const minutes =
            Math.floor(
                seconds / 60
            );

        const secs =
            seconds % 60;

        return (
            String(minutes)
                .padStart(2, "0") +
            ":" +
            String(secs)
                .padStart(2, "0")
        );
    }


    /* =========================================================
       PLAN
    ========================================================= */

    function getPlan() {

        if (
            window.StudyMindPlanProgress &&
            typeof
                window.StudyMindPlanProgress
                    .getActivePlan ===
                "function"
        ) {

            const active =
                window.StudyMindPlanProgress
                    .getActivePlan();

            if (active) {

                return active;
            }
        }


        const activePlanId =
            localStorage.getItem(
                "studyMindActivePlanId"
            );

        const plans =
            readJSON(
                "studyMindPlans",
                []
            );


        if (
            activePlanId &&
            Array.isArray(plans)
        ) {

            const active =
                plans.find(
                    item =>
                        item &&
                        String(item.id) ===
                        String(activePlanId)
                );

            if (active) {

                return active;
            }
        }


        return readJSON(
            "studyMindPlan",
            null
        );
    }


    /* =========================================================
       TOPICS
    ========================================================= */

    function getAllTopics() {

        const plan =
            getPlan();

        if (!plan) {

            return [];
        }


        const topics = [];


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
                        "General";


                    const subjectTopics =
                        Array.isArray(
                            subject.topics
                        )
                            ? subject.topics
                            : [];


                    subjectTopics.forEach(
                        topic => {

                            const name =
                                typeof topic ===
                                "string"
                                    ? topic
                                    : topic.name ||
                                      topic.topic ||
                                      topic.title;


                            if (!name) {

                                return;
                            }


                            topics.push({

                                name:
                                    String(
                                        name
                                    ),

                                subject:
                                    String(
                                        subjectName
                                    ),

                                difficulty:
                                    typeof topic ===
                                    "object"
                                        ? topic.difficulty ||
                                          ""
                                        : ""
                            });
                        }
                    );
                }
            );
        }


        if (
            !topics.length &&
            Array.isArray(
                plan.topics
            )
        ) {

            plan.topics.forEach(
                topic => {

                    const name =
                        typeof topic ===
                        "string"
                            ? topic
                            : topic.name ||
                              topic.topic ||
                              topic.title;


                    if (!name) {

                        return;
                    }


                    topics.push({

                        name:
                            String(
                                name
                            ),

                        subject:
                            typeof topic ===
                            "object"
                                ? (
                                    topic.subject ||
                                    topic.subjectName ||
                                    "General"
                                )
                                : "General",

                        difficulty:
                            typeof topic ===
                            "object"
                                ? topic.difficulty ||
                                  ""
                                : ""
                    });
                }
            );
        }


        return topics;
    }


    function getCompletedTopics() {

        const completed =
            readJSON(
                "studyMindCompletedTopics",
                []
            );

        return Array.isArray(
            completed
        )
            ? completed
            : [];
    }


    function isCompleted(
        topic
    ) {

        if (!topic) {

            return false;
        }


        const exact =
            `${topic.subject}::${topic.name}`;


        return getCompletedTopics().some(
            item => {

                if (
                    typeof item ===
                    "string"
                ) {

                    return (
                        item === exact ||
                        item === topic.name
                    );
                }


                if (
                    item &&
                    typeof item ===
                    "object"
                ) {

                    return (
                        item.key === exact ||
                        (
                            item.subject ===
                            topic.subject &&
                            (
                                item.topic ===
                                topic.name ||
                                item.name ===
                                topic.name
                            )
                        )
                    );
                }


                return false;
            }
        );
    }


    function getCurrentTopic() {

        const topics =
            getAllTopics();


        if (!topics.length) {

            return {

                name:
                    "Study Session",

                subject:
                    "General"
            };
        }


        const stored =
            readJSON(
                KEYS.CURRENT_TOPIC,
                null
            );


        if (
            stored &&
            stored.name
        ) {

            const match =
                topics.find(
                    topic =>
                        topic.name ===
                            stored.name &&
                        topic.subject ===
                            (
                                stored.subject ||
                                "General"
                            )
                );


            if (match) {

                return match;
            }
        }


        const savedIndex =
            Number(
                localStorage.getItem(
                    KEYS.CURRENT_TOPIC_INDEX
                )
            );


        const index =
            Number.isFinite(
                savedIndex
            )
                ? Math.max(
                    0,
                    Math.min(
                        savedIndex,
                        topics.length - 1
                    )
                )
                : 0;


        return topics[index];
    }


    function findRecommendedTopic() {

        const topics =
            getAllTopics();


        if (!topics.length) {

            return null;
        }


        return (
            topics.find(
                topic =>
                    !isCompleted(topic)
            ) ||
            topics[0]
        );
    }


    /* =========================================================
       TIME
    ========================================================= */

    function getElapsedSeconds() {

        if (!state.running) {

            return 0;
        }


        return Math.max(
            0,
            state.baseSeconds -
            state.seconds
        );
    }


    function getLiveMinutes() {

        return Math.floor(
            getElapsedSeconds() / 60
        );
    }


    /* =========================================================
       PERSISTENCE
    ========================================================= */

    function persist() {

        localStorage.setItem(
            KEYS.SECONDS,
            String(
                Math.max(
                    0,
                    Math.floor(
                        state.seconds
                    )
                )
            )
        );


        localStorage.setItem(
            KEYS.SELECTED,
            String(
                state.selectedSeconds
            )
        );


        localStorage.setItem(
            KEYS.RUNNING,
            state.running
                ? "true"
                : "false"
        );


        if (
            state.running &&
            state.endTime
        ) {

            localStorage.setItem(
                KEYS.END_TIME,
                String(
                    state.endTime
                )
            );

        } else {

            localStorage.removeItem(
                KEYS.END_TIME
            );
        }


        if (
            state.sessionStart
        ) {

            localStorage.setItem(
                KEYS.SESSION_START,
                String(
                    state.sessionStart
                )
            );

        } else {

            localStorage.removeItem(
                KEYS.SESSION_START
            );
        }


        localStorage.setItem(
            KEYS.SESSION_BASE_SECONDS,
            String(
                state.baseSeconds
            )
        );


        /*
         * Kept for backwards compatibility.
         */
        localStorage.setItem(
            KEYS.SESSION_BASE_LEGACY,
            String(
                state.baseSeconds
            )
        );


        localStorage.setItem(
            KEYS.AWARDED_MINUTE,
            String(
                state.awardedMinute
            )
        );
    }


    /* =========================================================
       LOAD STATE
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


        let savedBase =
            Number(
                localStorage.getItem(
                    KEYS.SESSION_BASE_SECONDS
                )
            );


        if (
            !Number.isFinite(savedBase) ||
            savedBase <= 0
        ) {

            savedBase =
                Number(
                    localStorage.getItem(
                        KEYS.SESSION_BASE_LEGACY
                    )
                );
        }


        const savedStart =
            Number(
                localStorage.getItem(
                    KEYS.SESSION_START
                )
            );


        const savedAwarded =
            Number(
                localStorage.getItem(
                    KEYS.AWARDED_MINUTE
                )
            );


        state.selectedSeconds =
            PRESETS.includes(
                selected / 60
            )
                ? selected
                : DEFAULT_SECONDS;


        state.baseSeconds =
            Number.isFinite(savedBase) &&
            savedBase > 0
                ? savedBase
                : state.selectedSeconds;


        state.awardedMinute =
            Number.isFinite(savedAwarded) &&
            savedAwarded >= 0
                ? savedAwarded
                : 0;


        state.sessionStart =
            Number.isFinite(savedStart) &&
            savedStart > 0
                ? savedStart
                : null;


        state.lastPersistedLiveMinute =
            state.awardedMinute;


        if (
            savedRunning &&
            savedEnd
        ) {

            const remaining =
                Math.ceil(
                    (
                        savedEnd -
                        Date.now()
                    ) / 1000
                );


            if (
                remaining > 0
            ) {

                state.running =
                    true;

                state.endTime =
                    savedEnd;

                state.seconds =
                    remaining;

                return;
            }


            /*
             * Timer finished while page was closed.
             */
            state.seconds =
                0;

            state.running =
                false;

            state.endTime =
                null;


            finishTimer();

            return;
        }


        state.running =
            false;

        state.endTime =
            null;


        state.seconds =
            Number.isFinite(savedSeconds) &&
            savedSeconds >= 0
                ? savedSeconds
                : state.selectedSeconds;


        if (
            state.seconds ===
            state.selectedSeconds
        ) {

            state.sessionStart =
                null;

            state.baseSeconds =
                state.selectedSeconds;

            state.awardedMinute =
                0;

            state.lastPersistedLiveMinute =
                -1;
        }
    }


    /* =========================================================
       XP
    ========================================================= */

    function getXP() {

        return number(
            KEYS.XP,
            0
        );
    }


    function awardXP(
        amount,
        reason
    ) {

        amount =
            Math.max(
                0,
                Math.floor(
                    Number(amount) || 0
                )
            );


        if (!amount) {

            return;
        }


        const oldXP =
            getXP();


        const newXP =
            oldXP + amount;


        const oldTotal =
            number(
                KEYS.TOTAL_XP,
                oldXP
            );


        localStorage.setItem(
            KEYS.XP,
            String(newXP)
        );


        localStorage.setItem(
            KEYS.TOTAL_XP,
            String(
                oldTotal + amount
            )
        );


        dispatch(
            "studyMindXPUpdated",
            {
                oldXP,
                newXP,
                amount,
                reason
            }
        );


        dispatch(
            "studyMindXPChanged",
            {
                oldXP,
                newXP,
                amount,
                reason
            }
        );


        dispatch(
            "studyMindProgressUpdated",
            {
                source:
                    "timer-xp"
            }
        );
    }


    function awardLiveXP() {

        if (!state.running) {

            return;
        }


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


        state.awardedMinute =
            liveMinutes;


        awardXP(
            difference,
            "timer-minute"
        );


        persist();
    }


    /* =========================================================
       STUDY SESSIONS
    ========================================================= */

    function getAllSessions() {

        const sessions =
            readJSON(
                KEYS.STUDY_SESSIONS,
                []
            );

        return Array.isArray(sessions)
            ? sessions
            : [];
    }


    function getTodaySessions() {

        const today =
            todayKey();

        return getAllSessions()
            .filter(
                session =>
                    session &&
                    session.date === today
            );
    }


    function getCompletedTodayMinutes() {

        const today =
            todayKey();

        return getAllSessions()
            .reduce(
                (
                    total,
                    session
                ) => {

                    if (
                        !session ||
                        session.date !== today
                    ) {

                        return total;
                    }


                    return (
                        total +
                        Math.max(
                            0,
                            Number(
                                session.minutes
                            ) || 0
                        )
                    );

                },
                0
            );
    }


    function syncCompletedStudyTime() {

        const sessions =
            getAllSessions();


        const totals = {};


        sessions.forEach(
            session => {

                if (
                    !session ||
                    !session.date
                ) {

                    return;
                }


                const minutes =
                    Math.max(
                        0,
                        Number(
                            session.minutes
                        ) || 0
                    );


                totals[session.date] =
                    (
                        totals[session.date] ||
                        0
                    ) +
                    minutes;
            }
        );


        writeJSON(
            KEYS.DAILY_TIME,
            totals
        );


        const history = {};


        Object.keys(
            totals
        ).forEach(
            date => {

                history[date] = {

                    minutes:
                        totals[date]
                };
            }
        );


        writeJSON(
            KEYS.STUDY_HISTORY,
            history
        );


        return totals;
    }


    function updateDailyLiveTime(
        force = false
    ) {

        const liveMinutes =
            getLiveMinutes();


        const completedMinutes =
            getCompletedTodayMinutes();


        if (
            !force &&
            liveMinutes ===
            state.lastPersistedLiveMinute
        ) {

            dispatch(
                "studyMindStudyTimeUpdated",
                {

                    todayMinutes:
                        completedMinutes +
                        liveMinutes,

                    completedMinutes,

                    liveMinutes,

                    date:
                        todayKey()
                }
            );

            return;
        }


        const totals =
            syncCompletedStudyTime();


        state.lastPersistedLiveMinute =
            liveMinutes;


        dispatch(
            "studyMindStudyTimeUpdated",
            {

                todayMinutes:
                    (
                        totals[todayKey()] ||
                        0
                    ) +
                    liveMinutes,

                completedMinutes:
                    totals[todayKey()] ||
                    0,

                liveMinutes,

                date:
                    todayKey()
            }
        );
    }


    /* =========================================================
       STREAK
    ========================================================= */

    function recordStudyActivity() {

        const today =
            todayKey();


        const existing =
            readJSON(
                KEYS.STREAK_ACTIVITY,
                {}
            );


        const activity =
            existing &&
            typeof existing === "object"
                ? existing
                : {};


        activity[today] =
            true;


        writeJSON(
            KEYS.STREAK_ACTIVITY,
            activity
        );


        if (
            window.StudyMindStreak &&
            typeof
                window.StudyMindStreak
                    .recordStudyActivity ===
                "function"
        ) {

            window.StudyMindStreak
                .recordStudyActivity();
        }


        dispatch(
            "studyMindStreakUpdated",
            {

                date:
                    today,

                source:
                    "shared-timer"
            }
        );
    }


    /* =========================================================
       RECORD SESSION
    ========================================================= */

    function recordStudySession() {

        const minutes =
            Math.floor(
                state.baseSeconds / 60
            );


        if (minutes <= 0) {

            return null;
        }


        const today =
            todayKey();


        const sessions =
            getAllSessions();


        const topic =
            getCurrentTopic();


        const session = {

            id:
                `timer-${Date.now()}`,

            date:
                today,

            startedAt:
                state.sessionStart
                    ? new Date(
                        state.sessionStart
                    ).toISOString()
                    : new Date().toISOString(),

            completedAt:
                new Date().toISOString(),

            minutes,

            xp:
                minutes,

            subject:
                topic?.subject ||
                "General",

            topic:
                topic?.name ||
                "Study Session",

            source:
                "shared-timer"
        };


        sessions.push(
            session
        );


        writeJSON(
            KEYS.STUDY_SESSIONS,
            sessions
        );


        const count =
            number(
                KEYS.COMPLETED_TIMER_SESSIONS,
                0
            );


        localStorage.setItem(
            KEYS.COMPLETED_TIMER_SESSIONS,
            String(
                count + 1
            )
        );


        syncCompletedStudyTime();


        dispatch(
            "studyMindSessionRecorded",
            {

                minutes,

                xp:
                    minutes,

                topic,

                session
            }
        );


        return session;
    }


    /* =========================================================
       SCORE
    ========================================================= */

    function refreshScore() {

        if (
            window.StudyMindScore &&
            typeof
                window.StudyMindScore.refresh ===
                "function"
        ) {

            window.StudyMindScore.refresh();
        }


        dispatch(
            "studyMindStudyDataUpdated",
            {

                minutes:
                    getTodayMinutes(),

                liveMinutes:
                    getLiveMinutes(),

                completedMinutes:
                    getCompletedTodayMinutes()
            }
        );
    }


    /* =========================================================
       REWARDS
    ========================================================= */

    function refreshRewards() {

        if (
            window.StudyMindRewards &&
            typeof
                window.StudyMindRewards.check ===
                "function"
        ) {

            setTimeout(
                () => {

                    window.StudyMindRewards.check();

                },
                250
            );
        }
    }


    /* =========================================================
       MILO
    ========================================================= */

    function celebrateCompletion(
        minutes
    ) {

        const timestamp =
            Date.now();


        localStorage.setItem(
            KEYS.LAST_COMPLETED,
            String(timestamp)
        );


        const lastCelebrated =
            Number(
                localStorage.getItem(
                    KEYS.LAST_CELEBRATED
                )
            ) || 0;


        if (
            timestamp -
            lastCelebrated <
            2000
        ) {

            return 0;
        }


        localStorage.setItem(
            KEYS.LAST_CELEBRATED,
            String(timestamp)
        );


        let streak =
            0;


        if (
            window.StudyMindStreak &&
            typeof
                window.StudyMindStreak
                    .calculateCurrentStreak ===
                "function"
        ) {

            streak =
                Number(
                    window.StudyMindStreak
                        .calculateCurrentStreak()
                ) || 0;
        }


        if (
            window.Milo &&
            typeof
                window.Milo
                    .miloStudySessionComplete ===
                "function"
        ) {

            window.Milo
                .miloStudySessionComplete(
                    streak
                );

        } else if (
            window.Milo &&
            typeof
                window.Milo
                    .celebrateStudySession ===
                "function"
        ) {

            window.Milo
                .celebrateStudySession(
                    minutes
                );

        } else if (
            window.Milo &&
            typeof
                window.Milo.playSound ===
                "function"
        ) {

            window.Milo.playSound(
                "woohoo"
            );
        }


        return streak;
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
            `Amazing work! You studied for ${minutes} minutes and your progress has been recorded.`
        );


        modal.classList.add(
            "active"
        );


        modal.style.display =
            "flex";
    }


    function closeCompletionModal() {

        const modal =
            document.getElementById(
                "completionModal"
            );


        if (!modal) {

            return;
        }


        modal.classList.remove(
            "active"
        );


        modal.style.display =
            "none";
    }


    /* =========================================================
       FINISH
    ========================================================= */

    function finishTimer() {

        if (
            state.completionLocked
        ) {

            return;
        }


        state.completionLocked =
            true;


        stopInterval();


        const durationMinutes =
            Math.floor(
                state.baseSeconds / 60
            );


        if (
            durationMinutes >
            state.awardedMinute
        ) {

            const difference =
                durationMinutes -
                state.awardedMinute;


            state.awardedMinute =
                durationMinutes;


            awardXP(
                difference,
                "timer-final-minute"
            );
        }


        /*
         * Stop active timer BEFORE recording
         * completed study time.
         */
        state.seconds =
            0;

        state.running =
            false;

        state.endTime =
            null;


        if (
            durationMinutes > 0
        ) {

            const session =
                recordStudySession();


            recordStudyActivity();


            refreshScore();


            refreshRewards();


            const streak =
                celebrateCompletion(
                    durationMinutes
                );


            showCompletionModal(
                durationMinutes,
                durationMinutes
            );


            dispatch(
                "studyMindTimerCompleted",
                {

                    minutes:
                        durationMinutes,

                    xp:
                        durationMinutes,

                    streak:
                        Number(streak) || 0,

                    session,

                    timestamp:
                        Date.now()
                }
            );
        }


        state.sessionStart =
            null;

        state.baseSeconds =
            state.selectedSeconds;

        state.awardedMinute =
            0;

        state.lastPersistedLiveMinute =
            -1;


        persist();


        syncCompletedStudyTime();


        render();
        renderStats();
        renderHistory();


        dispatch(
            "studyMindTimerChanged",
            getState()
        );


        dispatch(
            "studyMindStudyTimeUpdated",
            {

                todayMinutes:
                    getTodayMinutes(),

                completedMinutes:
                    getCompletedTodayMinutes(),

                liveMinutes:
                    0
            }
        );


        setTimeout(
            () => {

                state.completionLocked =
                    false;

            },
            1000
        );
    }


    /* =========================================================
       INTERVAL
    ========================================================= */

    function stopInterval() {

        if (
            state.interval
        ) {

            clearInterval(
                state.interval
            );

            state.interval =
                null;
        }
    }


    function startInterval() {

        stopInterval();


        /*
         * ONE interval only.
         */
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
                    (
                        state.endTime -
                        Date.now()
                    ) / 1000
                )
            );


        state.seconds =
            remaining;


        awardLiveXP();


        updateDailyLiveTime();


        render();
        renderStats();


        dispatch(
            "studyMindTimerChanged",
            getState()
        );


        if (
            remaining <= 0
        ) {

            finishTimer();
        }
    }


    /* =========================================================
       START
    ========================================================= */

    function startTimer() {

        if (
            state.running
        ) {

            return;
        }


        /*
         * Starting from zero means a fresh session.
         */
        if (
            state.seconds <= 0
        ) {

            state.seconds =
                state.selectedSeconds;

            state.baseSeconds =
                state.selectedSeconds;

            state.sessionStart =
                Date.now();

            state.awardedMinute =
                0;

            state.lastPersistedLiveMinute =
                -1;

        } else if (
            !state.sessionStart
        ) {

            /*
             * First start of this session.
             */
            state.sessionStart =
                Date.now();

            /*
             * IMPORTANT:
             * Preserve the currently selected
             * remaining duration.
             */
            state.baseSeconds =
                state.seconds +
                (
                    state.selectedSeconds -
                    state.seconds
                );

            /*
             * If this is a fresh selected timer,
             * base equals selected duration.
             */
            if (
                state.seconds ===
                state.selectedSeconds
            ) {

                state.baseSeconds =
                    state.selectedSeconds;
            }

            state.awardedMinute =
                Math.floor(
                    (
                        state.baseSeconds -
                        state.seconds
                    ) / 60
                );

            state.lastPersistedLiveMinute =
                state.awardedMinute;
        }


        state.running =
            true;


        state.endTime =
            Date.now() +
            (
                state.seconds *
                1000
            );


        state.completionLocked =
            false;


        persist();


        startInterval();


        updateDailyLiveTime(
            true
        );


        refreshScore();


        render();
        renderStats();


        dispatch(
            "studyMindTimerChanged",
            getState()
        );


        console.log(
            "StudyMind Timer: START",
            getState()
        );
    }


    /* =========================================================
       PAUSE
    ========================================================= */

    function pauseTimer() {

        if (
            !state.running
        ) {

            return;
        }


        /*
         * Capture current remaining time.
         */
        updateRemaining();


        if (
            state.completionLocked
        ) {

            return;
        }


        state.running =
            false;

        state.endTime =
            null;


        persist();


        stopInterval();


        updateDailyLiveTime(
            true
        );


        refreshScore();


        render();
        renderStats();


        dispatch(
            "studyMindTimerChanged",
            getState()
        );


        console.log(
            "StudyMind Timer: PAUSE",
            getState()
        );
    }


    /* =========================================================
       RESET
    ========================================================= */

    function resetTimer() {

        stopInterval();


        state.running =
            false;

        state.endTime =
            null;

        state.seconds =
            state.selectedSeconds;

        state.baseSeconds =
            state.selectedSeconds;

        state.sessionStart =
            null;

        state.awardedMinute =
            0;

        state.lastPersistedLiveMinute =
            -1;

        state.completionLocked =
            false;


        persist();


        updateDailyLiveTime(
            true
        );


        refreshScore();


        render();
        renderStats();


        dispatch(
            "studyMindTimerChanged",
            getState()
        );


        console.log(
            "StudyMind Timer: RESET"
        );
    }


    /* =========================================================
       SELECT DURATION
    ========================================================= */

    function selectDuration(
        seconds
    ) {

        seconds =
            Number(seconds);


        if (
            !PRESETS.includes(
                seconds / 60
            )
        ) {

            return false;
        }


        if (
            state.running
        ) {

            return false;
        }


        state.selectedSeconds =
            seconds;

        state.seconds =
            seconds;

        state.baseSeconds =
            seconds;

        state.sessionStart =
            null;

        state.awardedMinute =
            0;

        state.lastPersistedLiveMinute =
            -1;

        state.completionLocked =
            false;


        persist();


        render();
        renderStats();


        dispatch(
            "studyMindTimerChanged",
            getState()
        );


        return true;
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


        const topics =
            getAllTopics();


        const index =
            topics.findIndex(
                item =>
                    item.name === topic.name &&
                    item.subject === topic.subject
            );


        if (index >= 0) {

            localStorage.setItem(
                KEYS.CURRENT_TOPIC_INDEX,
                String(index)
            );
        }


        stopInterval();


        state.running =
            false;

        state.endTime =
            null;

        state.selectedSeconds =
            25 * 60;

        state.seconds =
            25 * 60;

        state.baseSeconds =
            25 * 60;

        state.sessionStart =
            null;

        state.awardedMinute =
            0;

        state.lastPersistedLiveMinute =
            -1;

        state.completionLocked =
            false;


        persist();


        render();


        startTimer();


        render();
        renderStats();


        dispatch(
            "studyMindRecommendedSessionStarted",
            {

                topic,

                minutes:
                    25
            }
        );


        return true;
    }


    /* =========================================================
       TODAY'S DATA
    ========================================================= */

    function getTodayMinutes() {

        return (
            getCompletedTodayMinutes() +
            getLiveMinutes()
        );
    }


    function getTodaySessionCount() {

        return (
            getTodaySessions().length +
            (
                state.running
                    ? 1
                    : 0
            )
        );
    }


    function getTodayXP() {

        const completed =
            getTodaySessions()
                .reduce(
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


        return (
            completed +
            getLiveMinutes()
        );
    }


    function renderStats() {

        setText(
            "todayMinutes",
            `${getTodayMinutes()} min`
        );


        setText(
            "todaySessions",
            getTodaySessionCount()
        );


        setText(
            "todayXP",
            `${getTodayXP()} XP`
        );
    }


    /* =========================================================
       HISTORY
    ========================================================= */

    function escapeHTML(
        value
    ) {

        return String(
            value ?? ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
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
            getAllSessions();


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
                `
                <div class="empty-history">
                    No completed study sessions yet.
                </div>
                `;

            return;
        }


        container.innerHTML =
            sessions
                .slice()
                .reverse()
                .slice(0, 10)
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
                                        session.minutes ||
                                        0
                                    )} min
                                </strong>

                                <small>
                                    +${Number(
                                        session.xp ||
                                        0
                                    )} XP
                                </small>
                            </div>

                        </div>
                    `
                )
                .join("");
    }


    /* =========================================================
       RENDER
    ========================================================= */

    function render() {

        const value =
            formatTime(
                state.seconds
            );


        setText(
            "timerDisplay",
            value
        );


        setText(
            "dashboardTimerDisplay",
            value
        );


        setText(
            "sessionStatus",
            state.running
                ? "Studying"
                : (
                    state.seconds ===
                    state.selectedSeconds
                        ? "Ready to study"
                        : "Paused"
                )
        );


        setText(
            "timerState",
            state.running
                ? "Studying"
                : (
                    state.seconds ===
                    state.selectedSeconds
                        ? "Ready"
                        : "Paused"
                )
        );


        setText(
            "dashboardTimerStatus",
            state.running
                ? "Studying"
                : (
                    state.seconds ===
                    state.selectedSeconds
                        ? "Ready to study"
                        : "Paused"
                )
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
                    Math.max(
                        0,
                        progress
                    )
                )}%`;
        }


        /*
         * Update button text WITHOUT attaching
         * another click listener.
         */
        [
            "startPauseTimer",
            "dashboardTimerStart",
            "timerStart"
        ].forEach(
            id => {

                const button =
                    document.getElementById(
                        id
                    );


                if (!button) {

                    return;
                }


                button.textContent =
                    state.running
                        ? "Pause"
                        : "Start Timer";
            }
        );


        const topic =
            getCurrentTopic();


        setText(
            "currentSubject",
            topic?.subject ||
            "Study Session"
        );


        setText(
            "currentTopic",
            topic?.name ||
            "Choose a topic"
        );
    }


    /* =========================================================
       EVENT BINDING
    ========================================================= */

    function bindOnce(
        element,
        handler
    ) {

        if (!element) {

            return;
        }


        /*
         * This prevents Dashboard.js and other
         * initialization passes from creating
         * duplicate timer controls.
         */
        if (
            element.dataset.studyMindTimerBound ===
            "true"
        ) {

            return;
        }


        element.dataset.studyMindTimerBound =
            "true";


        element.addEventListener(
            "click",
            handler
        );
    }


    function setupControls() {

        /*
         * START / PAUSE
         */
        [
            "startPauseTimer",
            "dashboardTimerStart",
            "timerStart"
        ].forEach(
            id => {

                bindOnce(
                    document.getElementById(id),
                    () => {

                        if (
                            state.running
                        ) {

                            pauseTimer();

                        } else {

                            startTimer();
                        }
                    }
                );
            }
        );


        /*
         * RESET
         */
        [
            "resetTimer",
            "dashboardTimerReset",
            "timerReset"
        ].forEach(
            id => {

                bindOnce(
                    document.getElementById(id),
                    resetTimer
                );
            }
        );


        /*
         * DURATION PRESETS
         */
        document
            .querySelectorAll(
                ".duration-button, .timer-preset"
            )
            .forEach(
                button => {

                    bindOnce(
                        button,
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

                                return;
                            }


                            const seconds =
                                Number(
                                    button.dataset.duration
                                );


                            if (
                                Number.isFinite(
                                    seconds
                                ) &&
                                seconds > 0
                            ) {

                                selectDuration(
                                    seconds
                                );
                            }
                        }
                    );
                }
            );


        /*
         * RECOMMENDED SESSION
         */
        bindOnce(
            document.getElementById(
                "useRecommended"
            ),
            useRecommendedSession
        );


        /*
         * COMPLETION MODAL CLOSE
         */
        bindOnce(
            document.getElementById(
                "closeCompletion"
            ),
            closeCompletionModal
        );
    }


    /* =========================================================
       EVENTS
    ========================================================= */

    function setupEvents() {

        window.addEventListener(
            "studyMindTimerChanged",
            () => {

                render();
                renderStats();
            }
        );


        window.addEventListener(
            "studyMindStudyTimeUpdated",
            () => {

                render();
                renderStats();
            }
        );


        window.addEventListener(
            "studyMindTimerCompleted",
            () => {

                render();
                renderStats();
                renderHistory();
            }
        );


        window.addEventListener(
            "studyMindPlanCreated",
            () => {

                render();
                renderStats();
                renderRecommendation();
            }
        );


        /*
         * Cross-tab synchronization.
         */
        window.addEventListener(
            "storage",
            event => {

                if (
                    [
                        KEYS.SECONDS,
                        KEYS.RUNNING,
                        KEYS.END_TIME,
                        KEYS.SELECTED,
                        KEYS.CURRENT_TOPIC,
                        KEYS.CURRENT_TOPIC_INDEX,
                        KEYS.STUDY_SESSIONS,
                        KEYS.DAILY_TIME,
                        KEYS.STUDY_HISTORY
                    ].includes(
                        event.key
                    )
                ) {

                    /*
                     * Do not reload state from
                     * localStorage while this tab owns
                     * the active timer.
                     */
                    if (
                        !state.running
                    ) {

                        loadState();

                        render();
                        renderStats();
                        renderRecommendation();
                    }
                }
            }
        );
    }


    /* =========================================================
       RECOMMENDATION DISPLAY
    ========================================================= */

    function renderRecommendation() {

        const topic =
            findRecommendedTopic();


        if (!topic) {

            setText(
                "recommendedSubject",
                "No study plan"
            );


            setText(
                "recommendedTopic",
                "Create a study plan first"
            );


            return;
        }


        setText(
            "recommendedSubject",
            topic.subject ||
            "Study"
        );


        setText(
            "recommendedTopic",
            topic.name ||
            "Study Session"
        );
    }


    /* =========================================================
       STATE
    ========================================================= */

    function getState() {

        return {

            seconds:
                state.seconds,

            selectedSeconds:
                state.selectedSeconds,

            running:
                state.running,

            endTime:
                state.endTime,

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

        if (
            state.initialized
        ) {

            return;
        }


        state.initialized =
            true;


        loadState();


        syncCompletedStudyTime();


        /*
         * Timer controls belong here.
         */
        setupControls();


        setupEvents();


        render();
        renderStats();
        renderHistory();
        renderRecommendation();


        /*
         * Resume a timer that was running before
         * the page was refreshed.
         */
        if (
            state.running
        ) {

            startInterval();
        }


        /*
         * NO SECOND TIMER INTERVAL.
         *
         * updateRemaining() is controlled solely
         * by startInterval().
         */


        console.log(
            "StudyMind AI: Shared timer initialized.",
            getState()
        );
    }


    /* =========================================================
       PUBLIC API
    ========================================================= */

    window.StudyMindTimer = {

        initialize,

        start:
            startTimer,

        pause:
            pauseTimer,

        reset:
            resetTimer,

        complete:
            finishTimer,

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

        recordStreakActivity:
            recordStudyActivity,

        render,

        renderStats,

        renderHistory,

        calculateXP:
            minutes => {

                return Math.max(
                    0,
                    Math.floor(
                        Number(minutes) || 0
                    )
                );
            }
    };


    /* =========================================================
       START
    ========================================================= */

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

})();

