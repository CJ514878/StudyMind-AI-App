"use strict";

/* =========================================================
   STUDYMIND AI — SHARED STUDY TIMER
   SINGLE SOURCE OF TRUTH

   Used by:
   - study-timer.html
   - study-session.html
   - dashboard.html

   IMPORTANT:
   Timer completion:
   - records actual study time
   - awards gradual XP
   - records streak activity
   - triggers Milo celebration
   - DOES NOT complete a topic
========================================================= */

(function () {

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

        SESSION_BASE:
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

    const PRESETS = [
        25,
        45,
        60
    ];

    const DEFAULT_SECONDS =
        25 * 60;

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
            0
    };

    /* =========================================================
       HELPERS
    ========================================================= */

    function todayKey() {

        return new Date()
            .toISOString()
            .slice(0, 10);
    }

    function readJSON(
        key,
        fallback
    ) {

        try {

            const value =
                localStorage.getItem(key);

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

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );
    }

    function number(
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

    function dispatch(
        name,
        detail = {}
    ) {

        window.dispatchEvent(
            new CustomEvent(
                name,
                { detail }
            )
        );
    }

    function formatTime(
        seconds
    ) {

        seconds =
            Math.max(
                0,
                Math.floor(
                    Number(seconds) || 0
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

    function setText(
        id,
        value
    ) {

        const element =
            document.getElementById(id);

        if (element) {

            element.textContent =
                String(value ?? "");
        }
    }

    /* =========================================================
       ACTIVE PLAN
    ========================================================= */

    function getPlan() {

        /*
         * Prefer the new shared progress system.
         */
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

        /*
         * Fallback for compatibility.
         */
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
                                    String(name),

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

        /*
         * Flat topic fallback.
         */
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
                            String(name),

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

        const completed =
            getCompletedTopics();

        const exact =
            `${topic.subject}::${topic.name}`;

        return completed.some(
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

        const stored =
            readJSON(
                KEYS.CURRENT_TOPIC,
                null
            );

        if (
            stored &&
            stored.name
        ) {

            return stored;
        }

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

        const incomplete =
            topics.find(
                topic =>
                    !isCompleted(topic)
            );

        return (
            incomplete ||
            topics[0]
        );
    }

    /* =========================================================
       ELAPSED TIME
    ========================================================= */

    function getElapsedSeconds() {

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
            KEYS.SESSION_BASE,
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

        const savedBase =
            Number(
                localStorage.getItem(
                    KEYS.SESSION_BASE
                )
            );

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

        /*
         * Only allow the official presets.
         */
        state.selectedSeconds =
            PRESETS.includes(
                selected / 60
            )
                ? selected
                : DEFAULT_SECONDS;

        /*
         * Base duration must remain the original
         * duration even after pausing.
         */
        state.baseSeconds =
            Number.isFinite(
                savedBase
            ) &&
            savedBase > 0
                ? savedBase
                : state.selectedSeconds;

        state.awardedMinute =
            Number.isFinite(
                savedAwarded
            ) &&
            savedAwarded >= 0
                ? savedAwarded
                : 0;

        state.sessionStart =
            Number.isFinite(
                savedStart
            ) &&
            savedStart > 0
                ? savedStart
                : null;

        /*
         * Reconstruct a running timer from its
         * absolute end time.
         */
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
             * Timer expired while the page
             * was closed.
             */
            state.seconds = 0;
            state.running = false;
            state.endTime = null;

            persist();

            finishTimer();

            return;
        }

        state.running =
            false;

        state.endTime =
            null;

        state.seconds =
            Number.isFinite(
                savedSeconds
            ) &&
            savedSeconds >= 0
                ? savedSeconds
                : state.selectedSeconds;

        /*
         * If there is no active session, don't
         * carry an old session start forever.
         */
        if (
            state.seconds ===
                state.selectedSeconds &&
            !state.running
        ) {

            state.sessionStart =
                null;

            state.baseSeconds =
                state.selectedSeconds;

            state.awardedMinute =
                0;
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

        localStorage.setItem(
            KEYS.XP,
            String(newXP)
        );

        /*
         * Keep total XP synchronized.
         */
        const oldTotal =
            number(
                KEYS.TOTAL_XP,
                0
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

    /*
     * One XP for each FULL MINUTE actually studied.
     *
     * The awardedMinute value is NOT reset when
     * the student pauses.
     */
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

        persist();

        awardXP(
            difference,
            "timer-minute"
        );
    }

    /* =========================================================
       DAILY STUDY TIME
    ========================================================= */

    function getCompletedTodayMinutes() {

        const today =
            todayKey();

        const sessions =
            readJSON(
                KEYS.STUDY_SESSIONS,
                []
            );

        if (
            !Array.isArray(sessions)
        ) {
            return 0;
        }

        return sessions.reduce(
            (
                total,
                session
            ) => {

                if (
                    !session ||
                    session.date !==
                        today
                ) {

                    return total;
                }

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
    }

    function updateDailyLiveTime() {

        const today =
            todayKey();

        const daily =
            readJSON(
                KEYS.DAILY_TIME,
                {}
            );

        if (
            !daily ||
            typeof daily !==
                "object"
        ) {
            return;
        }

        const completedMinutes =
            getCompletedTodayMinutes();

        const liveMinutes =
            getLiveMinutes();

        /*
         * This value represents:
         *
         * completed timer sessions
         * +
         * current live session
         *
         * It is NOT added repeatedly.
         */
        daily[today] =
            Math.max(
                Number(
                    daily[today]
                ) || 0,
                completedMinutes +
                    liveMinutes
            );

        writeJSON(
            KEYS.DAILY_TIME,
            daily
        );

        dispatch(
            "studyMindStudyTimeUpdated",
            {
                todayMinutes:
                    daily[today],
                liveMinutes
            }
        );
    }

    /* =========================================================
       STREAK
    ========================================================= */

    function recordStudyActivity() {

        const today =
            todayKey();

        const activity =
            readJSON(
                KEYS.STREAK_ACTIVITY,
                {}
            );

        const safeActivity =
            activity &&
            typeof activity ===
                "object"
                ? activity
                : {};

        /*
         * One activity record per day.
         */
        safeActivity[today] =
            true;

        writeJSON(
            KEYS.STREAK_ACTIVITY,
            safeActivity
        );

        /*
         * Let the dedicated streak engine
         * calculate the actual streak.
         */
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
       RECORD COMPLETED TIMER SESSION
    ========================================================= */

    function recordStudySession() {

        const today =
            todayKey();

        const sessions =
            readJSON(
                KEYS.STUDY_SESSIONS,
                []
            );

        const safeSessions =
            Array.isArray(
                sessions
            )
                ? sessions
                : [];

        const minutes =
            Math.floor(
                state.baseSeconds /
                60
            );

        if (
            minutes <= 0
        ) {
            return;
        }

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
                new Date()
                    .toISOString(),

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

        safeSessions.push(
            session
        );

        writeJSON(
            KEYS.STUDY_SESSIONS,
            safeSessions
        );

        /*
         * Completed timer session count.
         */
        const previousCount =
            number(
                KEYS.COMPLETED_TIMER_SESSIONS,
                0
            );

        localStorage.setItem(
            KEYS.COMPLETED_TIMER_SESSIONS,
            String(
                previousCount + 1
            )
        );

        updateDailyLiveTime();

        dispatch(
            "studyMindSessionRecorded",
            {
                minutes,
                xp: minutes,
                topic,
                session
            }
        );
    }

    /* =========================================================
       SCORE REFRESH
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
                    getLiveMinutes()
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

                    window.StudyMindRewards
                        .check();

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

        /*
         * Prevent the exact same timer completion
         * from being celebrated twice.
         */
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

            return;
        }

        localStorage.setItem(
            KEYS.LAST_CELEBRATED,
            String(timestamp)
        );

        let streak = 0;

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

            window.Milo
                .playSound(
                    "woohoo"
                );
        }

        dispatch(
            "studyMindTimerCompleted",
            {
                minutes,
                timestamp,
                streak
            }
        );
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

        /*
         * Study Session does not have this modal,
         * so silently skip it there.
         */
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
       FINISH TIMER
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

        state.seconds =
            0;

        state.running =
            false;

        state.endTime =
            null;

        const durationMinutes =
            Math.floor(
                state.baseSeconds /
                60
            );

        /*
         * Award any final minute that wasn't
         * awarded by the live timer.
         */
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

        if (
            durationMinutes > 0
        ) {

            /*
             * Record actual completed
             * timer session.
             */
            recordStudySession();

            /*
             * One streak activity event.
             */
            recordStudyActivity();

            /*
             * Refresh score using the
             * newly recorded study data.
             */
            refreshScore();

            /*
             * Check achievement/reward system.
             */
            refreshRewards();

            /*
             * Milo celebration.
             */
            celebrateCompletion(
                durationMinutes
            );

            /*
             * Timer page popup.
             */
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

        dispatch(
            "studyMindStudyTimeUpdated",
            {
                todayMinutes:
                    getTodayMinutes()
            }
        );

        /*
         * Allow another timer session.
         */
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
         * 250ms keeps the display responsive
         * while the actual time is always calculated
         * from endTime.
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

        /*
         * Gradual XP.
         */
        awardLiveXP();

        /*
         * Gradual study-time update.
         */
        updateDailyLiveTime();

        persist();

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
         * A timer at zero means the previous
         * session has ended. Start fresh.
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

        } else if (
            !state.sessionStart
        ) {

            /*
             * First start of this session.
             */
            state.sessionStart =
                Date.now();

            /*
             * Preserve the selected duration
             * as the session's base duration.
             */
            state.baseSeconds =
                state.selectedSeconds;
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

        render();
        renderStats();

        dispatch(
            "studyMindTimerChanged",
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
         * First capture the exact remaining
         * seconds before pausing.
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

        /*
         * VERY IMPORTANT:
         *
         * sessionStart is NOT cleared.
         * awardedMinute is NOT cleared.
         *
         * Therefore:
         *
         * 25:00
         * -> study 3 minutes
         * -> pause
         * -> resume
         *
         * continues from 22:00 and does not
         * award those first 3 minutes again.
         */

        persist();

        stopInterval();

        render();
        renderStats();

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

        state.completionLocked =
            false;

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

        /*
         * Save recommended topic.
         */
        writeJSON(
            KEYS.CURRENT_TOPIC,
            topic
        );

        const topics =
            getAllTopics();

        const index =
            topics.findIndex(
                item =>
                    item.name ===
                        topic.name &&
                    item.subject ===
                        topic.subject
            );

        if (
            index >= 0
        ) {

            localStorage.setItem(
                KEYS.CURRENT_TOPIC_INDEX,
                String(index)
            );
        }

        /*
         * Start a clean 25-minute
         * recommended session.
         */
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

        state.completionLocked =
            false;

        persist();

        /*
         * Now actually start it.
         */
        startTimer();

        render();
        renderStats();

        dispatch(
            "studyMindRecommendedSessionStarted",
            {
                topic,
                minutes: 25
            }
        );

        return true;
    }

    /* =========================================================
       TODAY'S STATS
    ========================================================= */

    function getTodaySessions() {

        const today =
            todayKey();

        const sessions =
            readJSON(
                KEYS.STUDY_SESSIONS,
                []
            );

        if (
            !Array.isArray(
                sessions
            )
        ) {

            return [];
        }

        return sessions.filter(
            session =>
                session &&
                session.date ===
                    today
        );
    }

    function getTodayMinutes() {

        const sessions =
            getTodaySessions();

        const completedMinutes =
            sessions.reduce(
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

        /*
         * Live minutes are displayed immediately.
         */
        return (
            completedMinutes +
            getLiveMinutes()
        );
    }

    function getTodaySessionCount() {

        const sessions =
            getTodaySessions();

        /*
         * Current session becomes visible
         * after the first full minute.
         */
        const liveSession =
            state.running &&
            getLiveMinutes() > 0
                ? 1
                : 0;

        return (
            sessions.length +
            liveSession
        );
    }

    function getTodayXP() {

        const sessions =
            getTodaySessions();

        const completedXP =
            sessions.reduce(
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

        /*
         * Live XP is included immediately.
         */
        return (
            completedXP +
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

        const safeSessions =
            Array.isArray(
                sessions
            )
                ? sessions
                : [];

        if (count) {

            count.textContent =
                `${safeSessions.length} session${
                    safeSessions.length === 1
                        ? ""
                        : "s"
                }`;
        }

        if (
            !safeSessions.length
        ) {

            container.innerHTML =
                `
                <div class="empty-history">
                    No completed study sessions yet.
                </div>
                `;

            return;
        }

        container.innerHTML =
            safeSessions
                .slice()
                .reverse()
                .slice(0, 10)
                .map(
                    session => {

                        return `
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
                        `;
                    }
                )
                .join("");
    }

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

    /* =========================================================
       TIMER PAGE UI
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
                    Math.max(
                        0,
                        progress
                    )
                )}%`;
        }

        const startButton =
            document.getElementById(
                "startPauseTimer"
            );

        if (startButton) {

            startButton.textContent =
                state.running
                    ? "Pause"
                    : "Start Timer";
        }

        const dashboardStart =
            document.getElementById(
                "dashboardTimerStart"
            );

        if (dashboardStart) {

            dashboardStart.textContent =
                state.running
                    ? "Pause"
                    : "Start Timer";
        }

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
       RECOMMENDATION UI
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
       CONTROL BINDING
       ========================================================= */

    function bindButtonOnce(
        element,
        key,
        handler
    ) {

        if (!element) {
            return;
        }

        if (
            element.dataset[
                key
            ] === "true"
        ) {

            return;
        }

        element.dataset[
            key
        ] = "true";

        element.addEventListener(
            "click",
            handler
        );
    }

    function setupControls() {

        /*
         * Study Timer page controls.
         *
         * Study Session has its own control bridge,
         * so we deliberately use the unique Study Timer
         * IDs here.
         */

        const start =
            document.getElementById(
                "startPauseTimer"
            );

        bindButtonOnce(
            start,
            "studyMindTimerBound",
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

        const reset =
            document.getElementById(
                "resetTimer"
            );

        bindButtonOnce(
            reset,
            "studyMindTimerBound",
            resetTimer
        );

        /*
         * Study Timer duration buttons.
         */
        document
            .querySelectorAll(
                ".duration-button"
            )
            .forEach(
                button => {

                    bindButtonOnce(
                        button,
                        "studyMindTimerBound",
                        () => {

                            selectDuration(
                                Number(
                                    button.dataset
                                        .minutes
                                ) * 60
                            );
                        }
                    );
                }
            );

        /*
         * Study Timer recommended session.
         */
        const recommended =
            document.getElementById(
                "useRecommended"
            );

        bindButtonOnce(
            recommended,
            "studyMindTimerBound",
            useRecommendedSession
        );

        /*
         * Completion popup.
         */
        const close =
            document.getElementById(
                "closeCompletion"
            );

        bindButtonOnce(
            close,
            "studyMindTimerBound",
            closeCompletionModal
        );

        /*
         * Synchronize when another StudyMind
         * page changes the shared timer.
         */
        window.addEventListener(
            "studyMindTimerChanged",
            () => {

                /*
                 * Do not overwrite a currently running
                 * timer with stale localStorage values.
                 */
                render();
                renderStats();

            }
        );

        window.addEventListener(
            "studyMindPlanCreated",
            () => {

                renderRecommendation();
                render();
                renderStats();

            }
        );

        window.addEventListener(
            "studyMindProgressUpdated",
            () => {

                renderRecommendation();
                render();

            }
        );

        window.addEventListener(
            "storage",
            event => {

                if (
                    event.key ===
                        KEYS.SECONDS ||
                    event.key ===
                        KEYS.RUNNING ||
                    event.key ===
                        KEYS.END_TIME ||
                    event.key ===
                        KEYS.SELECTED ||
                    event.key ===
                        KEYS.CURRENT_TOPIC ||
                    event.key ===
                        KEYS.CURRENT_TOPIC_INDEX
                ) {

                    /*
                     * Don't reload state from storage
                     * unnecessarily while this exact page
                     * is the source of the running timer.
                     */
                    if (
                        !state.running
                    ) {

                        loadState();
                    }

                    render();
                    renderStats();
                    renderRecommendation();
                }
            }
        );
    }

    /* =========================================================
       STATE API
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

        setupControls();

        render();
        renderStats();
        renderHistory();
        renderRecommendation();

        if (
            state.running
        ) {

            startInterval();
        }

        /*
         * Safety synchronization.
         *
         * updateRemaining itself uses the exact
         * end timestamp, so this doesn't make the
         * timer inaccurate.
         */
        setInterval(
            () => {

                if (
                    state.running
                ) {

                    updateRemaining();
                }

            },
            1000
        );

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

        recordStreakActivity,

        render,

        renderStats,

        renderHistory,

        calculateXP:
            minutes => {

                return Math.max(
                    0,
                    Math.floor(
                        Number(minutes) ||
                        0
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
