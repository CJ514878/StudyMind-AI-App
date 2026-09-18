"use strict";

/* =========================================================
   STUDYMIND AI — DASHBOARD
   SHARED TIMER ARCHITECTURE

   IMPORTANT
   ---------------------------------------------------------
   streak.js = SINGLE SOURCE OF TRUTH FOR STREAKS
   study-timer.js = SINGLE SOURCE OF TRUTH FOR TIMER STATE
                     AND TIMER COMPLETION

   dashboard.js:
   ✓ Displays timer
   ✓ Starts / pauses / resets shared timer
   ✓ Changes shared duration
   ✓ Refreshes dashboard after timer completion

   dashboard.js DOES NOT:
   ✗ Run its own timer countdown
   ✗ Complete timers
   ✗ Award timer XP
   ✗ Create timer streaks
   ✗ Create timer sessions

   All timer completion work belongs to study-timer.js.
========================================================= */


/* =========================================================
   STORAGE KEYS
========================================================= */

const PLAN_KEY =
    "studyMindPlan";

const XP_KEY =
    "studyMindXP";

const STREAK_KEY =
    "studyMindStreak";

const SESSION_KEY =
    "studyMindStudySessions";

const QUEST_KEY =
    "studyMindDailyQuests";

const COMPLETED_TOPICS_KEY =
    "studyMindCompletedTopics";

const LAST_COMPLETED_KEY =
    "studyMindLastCompletedPlanDate";


/* =========================================================
   SHARED TIMER KEYS

   These MUST remain identical across:

   dashboard.js
   study-timer.js
   study-session.js
========================================================= */

const TIMER_SECONDS_KEY =
    "studyMindTimerSeconds";

const TIMER_END_KEY =
    "studyMindTimerEndTime";

const TIMER_RUNNING_KEY =
    "studyMindTimerRunning";

const TIMER_DURATION_KEY =
    "studyMindSelectedTimerSeconds";


/* =========================================================
   DASHBOARD STATE
========================================================= */

let studyPlan =
    loadJSON(
        PLAN_KEY,
        null
    );

let xp =
    Number(
        localStorage.getItem(
            XP_KEY
        ) || 0
    );

let streak =
    Number(
        localStorage.getItem(
            STREAK_KEY
        ) || 0
    );


/* =========================================================
   AUTH — SHARED SUPABASE CLIENT
========================================================= */

const supabaseClient =
    window.supabaseClient ||
    window.studyMindSupabase ||
    null;


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadUser();


        studyPlan =
            loadJSON(
                PLAN_KEY,
                null
            );


        syncLocalStats();


        /*
         * Ask streak.js to check whether today's
         * scheduled study work has been completed.
         *
         * Dashboard does not increment streaks itself.
         */
        checkStudyCompletion();


        renderStats();

        renderToday();

        renderExams();

        renderQuests();

        renderLevel();

        renderRecommendation();

        setupLogout();


        /*
         * Connect Dashboard controls to the
         * authoritative shared timer.
         */
        setupSharedDashboardTimer();


        /*
         * Start a display-only refresh loop.
         *
         * This does NOT run or complete the timer.
         */
        startDashboardTimerRefresh();


        /* =================================================
           STORAGE SYNCHRONIZATION
        ================================================= */

        window.addEventListener(
            "storage",
            event => {

                if (
                    event.key ===
                    COMPLETED_TOPICS_KEY
                ) {

                    studyPlan =
                        loadJSON(
                            PLAN_KEY,
                            null
                        );

                    checkStudyCompletion();

                    syncLocalStats();

                    renderStats();

                    renderQuests();

                    renderRecommendation();

                    renderToday();

                }


                if (
                    event.key ===
                    PLAN_KEY
                ) {

                    studyPlan =
                        loadJSON(
                            PLAN_KEY,
                            null
                        );

                    checkStudyCompletion();

                    renderStats();

                    renderToday();

                    renderExams();

                    renderQuests();

                    renderRecommendation();

                }


                if (
                    event.key ===
                    XP_KEY
                ) {

                    syncLocalStats();

                    renderStats();

                    renderLevel();

                    renderQuests();

                }


                if (
                    event.key ===
                    STREAK_KEY
                ) {

                    syncLocalStats();

                    renderStats();

                }


                /*
                 * Shared timer changed in another page/tab.
                 *
                 * Dashboard only redraws.
                 */
                if (
                    [
                        TIMER_SECONDS_KEY,
                        TIMER_END_KEY,
                        TIMER_RUNNING_KEY,
                        TIMER_DURATION_KEY
                    ].includes(
                        event.key
                    )
                ) {

                    renderSharedDashboardTimer();

                }

            }
        );


        /* =================================================
           STREAK EVENT
        ================================================= */

        window.addEventListener(
            "studyMindStreakUpdated",
            event => {

                syncLocalStats();

                renderStats();

                renderLevel();

                console.log(
                    "StudyMind Dashboard: streak updated.",
                    event.detail || {}
                );

            }
        );


        /* =================================================
           XP EVENT
        ================================================= */

        window.addEventListener(
            "studyMindXPUpdated",
            event => {

                syncLocalStats();

                renderStats();

                renderLevel();

                renderQuests();

                console.log(
                    "StudyMind Dashboard: XP updated.",
                    event.detail || {}
                );

            }
        );


        /* =================================================
           SHARED TIMER UI EVENT
        ================================================= */

        window.addEventListener(
            "studyMindTimerChanged",
            () => {

                renderSharedDashboardTimer();

            }
        );


        /* =================================================
           SHARED TIMER COMPLETION
        =================================================

           study-timer.js has already handled:

           ✓ timer completion
           ✓ session recording
           ✓ XP
           ✓ streak activity
           ✓ Milo
           ✓ celebration
           ✓ popup

           Dashboard ONLY refreshes its UI.
        */

        window.addEventListener(
            "studyMindTimerCompleted",
            event => {

                console.log(
                    "StudyMind Dashboard: shared timer completed.",
                    event.detail || {}
                );


                syncLocalStats();

                renderStats();

                renderLevel();

                renderQuests();

                renderRecommendation();

                renderToday();

                renderSharedDashboardTimer();

            }
        );


        /* =================================================
           STREAK / XP SYNCHRONIZATION
        ================================================= */

        if (
            window.StudyMindStreak
        ) {

            window.setInterval(
                () => {

                    const oldStreak =
                        streak;

                    const oldXP =
                        xp;


                    syncLocalStats();


                    if (
                        oldStreak !== streak ||
                        oldXP !== xp
                    ) {

                        renderStats();

                        renderLevel();

                        renderQuests();

                    }

                },
                1500
            );

        }


        /*
         * Make sure the shared timer engine is available.
         */
        ensureSharedTimerEngine();

    }
);


/* =========================================================
   SYNCHRONIZE LOCAL STATS
========================================================= */

function syncLocalStats() {

    xp =
        Number(
            localStorage.getItem(
                XP_KEY
            ) || 0
        );


    /*
     * Streak engine is authoritative.
     */
    if (
        window.StudyMindStreak &&
        typeof
            window.StudyMindStreak
                .calculateCurrentStreak ===
            "function"
    ) {

        try {

            streak =
                Number(
                    window.StudyMindStreak
                        .calculateCurrentStreak() ||
                    0
                );

        } catch (error) {

            console.warn(
                "StudyMind streak calculation failed:",
                error
            );

            streak =
                Number(
                    localStorage.getItem(
                        STREAK_KEY
                    ) || 0
                );

        }

    } else {

        streak =
            Number(
                localStorage.getItem(
                    STREAK_KEY
                ) || 0
            );

    }

}


/* =========================================================
   USER
========================================================= */

async function loadUser() {

    let username =
        localStorage.getItem(
            "studyMindUsername"
        ) ||
        "Student";


    if (supabaseClient) {

        try {

            const {
                data
            } =
                await supabaseClient
                    .auth
                    .getUser();


            const user =
                data?.user;


            if (user) {

                username =
                    user.user_metadata
                        ?.username ||

                    user.user_metadata
                        ?.full_name ||

                    user.user_metadata
                        ?.name ||

                    user.email
                        ?.split("@")[0] ||

                    username;


                localStorage.setItem(
                    "studyMindUsername",
                    username
                );

            }

        } catch (error) {

            console.warn(
                "StudyMind user loading failed:",
                error
            );

        }

    }


    const element =
        document.getElementById(
            "username"
        );


    if (element) {

        element.textContent =
            username;

    }


    const avatar =
        document.getElementById(
            "avatar"
        );


    if (avatar) {

        avatar.textContent =
            username
                .charAt(0)
                .toUpperCase();

    }

}


/* =========================================================
   STATS
========================================================= */

function renderStats() {

    syncLocalStats();


    const progress =
        getStudyProgress();


    setText(
        "totalXP",
        xp
    );


    setText(
        "headerXP",
        `${xp} XP`
    );


    setText(
        "streak",
        `${streak} days`
    );


    setText(
        "headerStreak",
        streak
    );


    setText(
        "studyProgress",
        `${progress}%`
    );


    setWidth(
        "studyProgressBar",
        progress
    );


    setText(
        "streakMessage",
        streak > 0
            ? "Keep your learning momentum."
            : "Complete all required study work for today to start your streak."
    );

}


/* =========================================================
   TODAY'S SCHEDULE
========================================================= */

function renderToday() {

    const container =
        document.getElementById(
            "todaySchedule"
        );


    if (!container) {
        return;
    }


    if (
        !studyPlan ||
        !Array.isArray(
            studyPlan.schedule
        )
    ) {

        container.innerHTML = `
            <div class="loading">
                No AI study plan found.
                <br><br>
                <a href="home.html">
                    Create your plan →
                </a>
            </div>
        `;

        return;

    }


    const today =
        getLocalDateKey();


    const day =
        studyPlan.schedule.find(
            item =>
                String(
                    item?.date || ""
                ).slice(0, 10) === today
        );


    if (!day) {

        const firstDay =
            studyPlan.schedule[0];


        const isRest =
            String(
                firstDay?.dayType || ""
            ).toLowerCase() ===
            "rest";


        container.innerHTML = `
            <div class="loading">
                ${isRest
                    ? "Today is a planned recovery day."
                    : "No session is scheduled today."
                }
            </div>
        `;

        return;

    }


    if (
        String(
            day.dayType || ""
        ).toLowerCase() ===
        "rest"
    ) {

        container.innerHTML = `
            <div class="loading">
                🧘
                <br>
                <strong>
                    AI Recovery Day
                </strong>
                <br>
                <span>
                    Recovery is part of your study strategy.
                </span>
            </div>
        `;

        return;

    }


    const sessions =
        Array.isArray(
            day.sessions
        )
            ? day.sessions
            : [];


    const studySessions =
        sessions.filter(
            session => {

                const type =
                    String(
                        session?.type || ""
                    ).toLowerCase();


                return (
                    type !== "break" &&
                    type !== "rest"
                );

            }
        );


    if (!studySessions.length) {

        container.innerHTML = `
            <div class="loading">
                No study sessions scheduled for today.
            </div>
        `;

        return;

    }


    container.innerHTML =
        studySessions
            .map(
                session => `

                    <div class="study-session">

                        <div>

                            <div class="session-time">
                                ${escapeHTML(
                                    session?.start ||
                                    ""
                                )}
                                —
                                ${escapeHTML(
                                    session?.end ||
                                    ""
                                )}
                            </div>

                            <div class="session-type">
                                ${escapeHTML(
                                    session?.type ||
                                    "Study"
                                )}
                            </div>

                        </div>

                        <div>

                            <strong>
                                ${escapeHTML(
                                    session?.subject ||
                                    "Study"
                                )}
                            </strong>

                            <div class="session-type">
                                ${escapeHTML(
                                    session?.topic ||
                                    ""
                                )}
                            </div>

                        </div>

                        <button
                            class="session-action"
                            data-session="${escapeAttribute(
                                JSON.stringify(
                                    session
                                )
                            )}"
                            type="button"
                        >
                            Start
                        </button>

                    </div>

                `
            )
            .join("");


    container
        .querySelectorAll(
            "[data-session]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        try {

                            const session =
                                JSON.parse(
                                    button.dataset.session
                                );


                            startStudySession(
                                session
                            );

                        } catch (error) {

                            console.error(
                                "StudyMind session parsing failed:",
                                error
                            );

                        }

                    }
                );

            }
        );

}


/* =========================================================
   START STUDY SESSION
========================================================= */

function startStudySession(
    session
) {

    if (
        !session ||
        typeof session !== "object"
    ) {
        return;
    }


    localStorage.setItem(
        "studyMindCurrentStudySession",
        JSON.stringify({

            ...session,

            startedAt:
                Date.now(),

            minimumMinutes:
                25

        })
    );


    window.location.href =
        "study-session.html";

}


/* =========================================================
   SHARED TIMER ENGINE
========================================================= */

function getSharedTimerEngine() {

    if (
        window.StudyMindTimer &&
        typeof
            window.StudyMindTimer.getState ===
            "function"
    ) {

        return window.StudyMindTimer;

    }


    return null;

}


/* =========================================================
   ENSURE SHARED TIMER ENGINE
========================================================= */

function ensureSharedTimerEngine() {

    const engine =
        getSharedTimerEngine();


    if (
        engine &&
        typeof engine.initialize ===
        "function"
    ) {

        try {

            engine.initialize();

        } catch (error) {

            console.warn(
                "StudyMind shared timer initialization failed:",
                error
            );

        }


        renderSharedDashboardTimer();

        return true;

    }


    /*
     * Never create a second timer.
     *
     * Wait briefly for study-timer.js.
     */
    let attempts = 0;


    const retry =
        window.setInterval(
            () => {

                attempts++;


                const sharedEngine =
                    getSharedTimerEngine();


                if (
                    sharedEngine &&
                    typeof
                        sharedEngine.initialize ===
                        "function"
                ) {

                    window.clearInterval(
                        retry
                    );


                    try {

                        sharedEngine.initialize();

                    } catch (error) {

                        console.warn(
                            "StudyMind shared timer initialization failed:",
                            error
                        );

                    }


                    renderSharedDashboardTimer();

                    return;

                }


                if (
                    attempts >= 40
                ) {

                    window.clearInterval(
                        retry
                    );


                    console.warn(
                        "StudyMind: study-timer.js was not available."
                    );

                }

            },
            250
        );


    return false;

}


/* =========================================================
   SETUP DASHBOARD TIMER
========================================================= */

function setupSharedDashboardTimer() {

    const display =
        document.getElementById(
            "dashboardTimerDisplay"
        );


    if (!display) {
        return;
    }


    ensureSharedTimerEngine();


    /*
     * Duration presets.
     */
    document
        .querySelectorAll(
            ".timer-preset"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const duration =
                            Number(
                                button.dataset.duration
                            );


                        if (
                            !Number.isFinite(
                                duration
                            ) ||
                            duration <= 0
                        ) {

                            return;

                        }


                        selectSharedTimerDuration(
                            duration
                        );

                    }
                );

            }
        );


    /*
     * Start / pause.
     */
    document
        .getElementById(
            "dashboardTimerStart"
        )
        ?.addEventListener(
            "click",
            () => {

                const engine =
                    getSharedTimerEngine();


                if (!engine) {

                    console.warn(
                        "StudyMind timer engine is not loaded."
                    );

                    ensureSharedTimerEngine();

                    return;

                }


                const state =
                    engine.getState();


                if (
                    state?.running
                ) {

                    if (
                        typeof engine.pause ===
                        "function"
                    ) {

                        engine.pause();

                    }

                } else {

                    if (
                        typeof engine.start ===
                        "function"
                    ) {

                        engine.start();

                    }

                }


                renderSharedDashboardTimer();

            }
        );


    /*
     * Reset.
     */
    document
        .getElementById(
            "dashboardTimerReset"
        )
        ?.addEventListener(
            "click",
            () => {

                const engine =
                    getSharedTimerEngine();


                if (
                    engine &&
                    typeof engine.reset ===
                    "function"
                ) {

                    engine.reset();

                }


                renderSharedDashboardTimer();

            }
        );


    renderSharedDashboardTimer();

}


/* =========================================================
   SELECT SHARED TIMER DURATION
========================================================= */

function selectSharedTimerDuration(
    duration
) {

    duration =
        Number(duration);


    if (
        !Number.isFinite(duration) ||
        duration <= 0
    ) {

        return;

    }


    const engine =
        getSharedTimerEngine();


    /*
     * Use the authoritative engine if it exposes
     * a duration-selection method.
     */
    if (
        engine &&
        typeof engine.selectDuration ===
        "function"
    ) {

        try {

            engine.selectDuration(
                duration
            );

        } catch (error) {

            console.warn(
                "StudyMind timer duration selection failed:",
                error
            );

        }


        renderSharedDashboardTimer();

        return;

    }


    /*
     * Compatibility fallback.
     *
     * This only changes shared storage while the
     * timer is stopped. It never creates a timer.
     */
    if (
        isSharedTimerRunning()
    ) {

        return;

    }


    localStorage.setItem(
        TIMER_DURATION_KEY,
        String(duration)
    );


    localStorage.setItem(
        TIMER_SECONDS_KEY,
        String(duration)
    );


    localStorage.removeItem(
        TIMER_END_KEY
    );


    localStorage.setItem(
        TIMER_RUNNING_KEY,
        "false"
    );


    window.dispatchEvent(
        new Event(
            "studyMindTimerChanged"
        )
    );


    renderSharedDashboardTimer();

}


/* =========================================================
   GET SHARED TIMER STATE
========================================================= */

function getSharedTimerState() {

    const engine =
        getSharedTimerEngine();


    if (engine) {

        try {

            return engine.getState();

        } catch (error) {

            console.warn(
                "StudyMind timer state lookup failed:",
                error
            );

        }

    }


    /*
     * Read-only compatibility fallback.
     *
     * This does NOT run or complete a timer.
     */
    const running =
        localStorage.getItem(
            TIMER_RUNNING_KEY
        ) === "true";


    const endTime =
        Number(
            localStorage.getItem(
                TIMER_END_KEY
            )
        );


    const storedSeconds =
        Number(
            localStorage.getItem(
                TIMER_SECONDS_KEY
            )
        );


    let seconds =
        Number.isFinite(
            storedSeconds
        )
            ? Math.max(
                0,
                Math.floor(
                    storedSeconds
                )
            )
            : 0;


    if (
        running &&
        Number.isFinite(
            endTime
        )
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

    }


    return {

        running,

        seconds,

        endTime:
            Number.isFinite(
                endTime
            )
                ? endTime
                : null,

        selectedSeconds:
            Number(
                localStorage.getItem(
                    TIMER_DURATION_KEY
                )
            ) ||
            25 * 60

    };

}


/* =========================================================
   GET REMAINING TIMER TIME
========================================================= */

function getSharedTimerRemaining() {

    const state =
        getSharedTimerState();


    return Math.max(
        0,
        Number(
            state?.seconds
        ) || 0
    );

}


/* =========================================================
   CHECK TIMER RUNNING
========================================================= */

function isSharedTimerRunning() {

    const state =
        getSharedTimerState();


    return (
        state?.running === true
    );

}


/* =========================================================
   START SHARED TIMER
========================================================= */

function startSharedTimer() {

    const engine =
        getSharedTimerEngine();


    if (
        engine &&
        typeof engine.start ===
        "function"
    ) {

        engine.start();

        renderSharedDashboardTimer();

        return true;

    }


    console.warn(
        "StudyMind timer engine is not available."
    );


    ensureSharedTimerEngine();

    return false;

}


/* =========================================================
   PAUSE SHARED TIMER
========================================================= */

function pauseSharedTimer() {

    const engine =
        getSharedTimerEngine();


    if (
        engine &&
        typeof engine.pause ===
        "function"
    ) {

        engine.pause();

        renderSharedDashboardTimer();

        return true;

    }


    console.warn(
        "StudyMind timer engine is not available."
    );


    return false;

}


/* =========================================================
   RESET SHARED TIMER
========================================================= */

function resetSharedTimer() {

    const engine =
        getSharedTimerEngine();


    if (
        engine &&
        typeof engine.reset ===
        "function"
    ) {

        engine.reset();

        renderSharedDashboardTimer();

        return true;

    }


    console.warn(
        "StudyMind timer engine is not available."
    );


    return false;

}


/* =========================================================
   TIMER DISPLAY
========================================================= */

function renderSharedDashboardTimer() {

    const display =
        document.getElementById(
            "dashboardTimerDisplay"
        );


    if (!display) {
        return;
    }


    const state =
        getSharedTimerState();


    const remaining =
        Math.max(
            0,
            Number(
                state?.seconds
            ) || 0
        );


    const running =
        state?.running === true;


    display.textContent =
        formatTimerSeconds(
            remaining
        );


    const status =
        document.getElementById(
            "dashboardTimerStatus"
        );


    if (status) {

        if (running) {

            status.textContent =
                "Focus session in progress";

        } else if (
            remaining <= 0
        ) {

            status.textContent =
                "Session complete";

        } else {

            status.textContent =
                "Timer paused";

        }

    }


    const startButton =
        document.getElementById(
            "dashboardTimerStart"
        );


    if (startButton) {

        startButton.textContent =
            running
                ? "Pause"
                : remaining <= 0
                    ? "Start"
                    : "Resume";

    }


    updateTimerPresetButtons();

}


/* =========================================================
   TIMER REFRESH LOOP
=========================================================

   DISPLAY ONLY.

   It does NOT:
   ✓ start timer
   ✓ pause timer
   ✓ complete timer
   ✓ award XP
   ✓ update streak

   study-timer.js owns all of that.
========================================================= */

let dashboardTimerRefreshStarted =
    false;


function startDashboardTimerRefresh() {

    if (
        dashboardTimerRefreshStarted
    ) {

        return;

    }


    dashboardTimerRefreshStarted =
        true;


    window.setInterval(
        () => {

            renderSharedDashboardTimer();

        },
        250
    );

}


/* =========================================================
   TIMER FORMAT
========================================================= */

function formatTimerSeconds(
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


    const remainingSeconds =
        seconds % 60;


    return (
        String(
            minutes
        ).padStart(
            2,
            "0"
        ) +

        ":" +

        String(
            remainingSeconds
        ).padStart(
            2,
            "0"
        )
    );

}


/* =========================================================
   TIMER PRESET VISUAL STATE
========================================================= */

function updateTimerPresetButtons() {

    const selected =
        Number(
            localStorage.getItem(
                TIMER_DURATION_KEY
            )
        );


    document
        .querySelectorAll(
            ".timer-preset"
        )
        .forEach(
            button => {

                const duration =
                    Number(
                        button.dataset.duration
                    );


                button.classList.toggle(
                    "active",
                    duration === selected
                );

            }
        );

}


/* =========================================================
   CROSS-PAGE TIMER UI EVENT
========================================================= */

function dispatchTimerChanged() {

    window.dispatchEvent(
        new Event(
            "studyMindTimerChanged"
        )
    );

}


/* =========================================================
   DAILY STUDY TIME
=========================================================

   Kept only for compatibility with older
   dashboard features.

   Timer completion itself is owned by
   study-timer.js.
========================================================= */

function updateDailyStudyTime(
    minutes
) {

    const key =
        "studyMindDailyStudyTime";


    const data =
        loadJSON(
            key,
            {}
        );


    const today =
        getLocalDateKey();


    data[today] =
        Number(
            data[today] || 0
        ) +
        Number(
            minutes || 0
        );


    localStorage.setItem(
        key,
        JSON.stringify(
            data
        )
    );

}


/* =========================================================
   GET ALL PLAN TOPICS
========================================================= */

function getAllStudyTopics() {

    if (!studyPlan) {
        return [];
    }


    const topics = [];


    /*
     * SUBJECT → TOPICS
     */
    if (
        Array.isArray(
            studyPlan.subjects
        )
    ) {

        studyPlan.subjects.forEach(
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
                            typeof topic ===
                            "string"
                        ) {

                            const name =
                                topic.trim();


                            if (name) {

                                topics.push({

                                    name,

                                    subject:
                                        String(
                                            subject?.name ||
                                            subject?.subject ||
                                            ""
                                        ).trim()

                                });

                            }

                            return;

                        }


                        if (
                            topic &&
                            typeof topic ===
                            "object"
                        ) {

                            const name =
                                String(
                                    topic.name ||
                                    topic.title ||
                                    topic.topic ||
                                    ""
                                ).trim();


                            if (!name) {
                                return;
                            }


                            topics.push({

                                ...topic,

                                name,

                                subject:
                                    String(
                                        topic.subject ||
                                        subject?.name ||
                                        subject?.subject ||
                                        ""
                                    ).trim()

                            });

                        }

                    }
                );

            }
        );

    }


    /*
     * FLAT TOPICS
     */
    if (
        Array.isArray(
            studyPlan.topics
        )
    ) {

        studyPlan.topics.forEach(
            topic => {

                if (
                    typeof topic ===
                    "string"
                ) {

                    const name =
                        topic.trim();


                    if (name) {

                        topics.push({

                            name,

                            subject: ""

                        });

                    }

                    return;

                }


                if (
                    topic &&
                    typeof topic ===
                    "object"
                ) {

                    const name =
                        String(
                            topic.name ||
                            topic.title ||
                            topic.topic ||
                            ""
                        ).trim();


                    if (!name) {
                        return;
                    }


                    topics.push({

                        ...topic,

                        name,

                        subject:
                            String(
                                topic.subject ||
                                ""
                            ).trim()

                    });

                }

            }
        );

    }


    /*
     * Remove exact duplicates.
     */
    const unique =
        new Map();


    topics.forEach(
        topic => {

            const key =
                `${topic.subject}::${topic.name}`;


            if (
                !unique.has(key)
            ) {

                unique.set(
                    key,
                    topic
                );

            }

        }
    );


    return [
        ...unique.values()
    ];

}


/* =========================================================
   COMPLETED TOPIC NORMALIZATION
========================================================= */

function getCompletedTopicSet() {

    const stored =
        loadJSON(
            COMPLETED_TOPICS_KEY,
            []
        );


    const completed =
        new Set();


    if (
        !Array.isArray(
            stored
        )
    ) {

        return completed;

    }


    stored.forEach(
        item => {

            if (
                typeof item ===
                "string"
            ) {

                const value =
                    item.trim();


                if (!value) {
                    return;
                }


                completed.add(
                    value
                );


                if (
                    value.includes("::")
                ) {

                    const parts =
                        value.split("::");


                    const topic =
                        parts
                            .slice(1)
                            .join("::")
                            .trim();


                    if (topic) {

                        completed.add(
                            topic
                        );

                    }

                }

                return;

            }


            if (
                item &&
                typeof item ===
                "object"
            ) {

                const subject =
                    String(
                        item.subject ||
                        item.subjectName ||
                        ""
                    ).trim();


                const topic =
                    String(
                        item.topic ||
                        item.name ||
                        item.title ||
                        ""
                    ).trim();


                if (topic) {

                    completed.add(
                        topic
                    );

                }


                if (
                    subject &&
                    topic
                ) {

                    completed.add(
                        `${subject}::${topic}`
                    );

                }

            }

        }
    );


    return completed;

}


/* =========================================================
   TOPIC COMPLETION CHECK
========================================================= */

function isTopicCompleted(
    topic,
    completedSet
) {

    if (!topic) {
        return false;
    }


    const subject =
        String(
            topic.subject ||
            topic.subjectName ||
            ""
        ).trim();


    const name =
        String(
            topic.name ||
            topic.title ||
            topic.topic ||
            ""
        ).trim();


    if (!name) {
        return false;
    }


    const exact =
        subject
            ? `${subject}::${name}`
            : name;


    return (
        completedSet.has(
            exact
        ) ||
        completedSet.has(
            name
        )
    );

}


/* =========================================================
   CALCULATE REAL TOPIC PROGRESS
========================================================= */

function getStudyProgress() {

    const topics =
        getAllStudyTopics();


    if (!topics.length) {
        return 0;
    }


    const completed =
        getCompletedTopicSet();


    const completedCount =
        topics.filter(
            topic =>
                isTopicCompleted(
                    topic,
                    completed
                )
        ).length;


    return Math.round(
        (
            completedCount /
            topics.length
        ) *
        100
    );

}


/* =========================================================
   GET TODAY'S REQUIRED TOPICS
========================================================= */

function getTodaysRequiredTopics() {

    if (
        window.StudyMindStreak &&
        typeof
            window.StudyMindStreak
                .getTodaysRequiredTopics ===
            "function"
    ) {

        try {

            return (
                window.StudyMindStreak
                    .getTodaysRequiredTopics() ||
                []
            );

        } catch (error) {

            console.warn(
                "StudyMind: streak schedule lookup failed:",
                error
            );

        }

    }


    const today =
        getLocalDateKey();


    const day =
        studyPlan?.schedule?.find(
            item =>
                String(
                    item?.date || ""
                ).slice(0, 10) ===
                today
        );


    if (!day) {

        return getAllStudyTopics();

    }


    const sessions =
        Array.isArray(
            day.sessions
        )
            ? day.sessions
            : [];


    const required = [];


    sessions.forEach(
        session => {

            const type =
                String(
                    session?.type || ""
                ).toLowerCase();


            if (
                type === "break" ||
                type === "rest"
            ) {

                return;

            }


            const topic =
                String(
                    session?.topic ||
                    session?.name ||
                    session?.title ||
                    ""
                ).trim();


            if (!topic) {
                return;
            }


            required.push({

                subject:
                    String(
                        session?.subject ||
                        ""
                    ).trim(),

                topic

            });

        }
    );


    return required;

}


/* =========================================================
   CHECK STUDY COMPLETION
========================================================= */

function checkStudyCompletion() {

    if (
        !window.StudyMindStreak
    ) {

        console.warn(
            "StudyMind streak engine is not available yet."
        );

        return false;

    }


    if (
        typeof
            window.StudyMindStreak
                .checkTodayCompletion !==
            "function"
    ) {

        console.warn(
            "StudyMind streak engine does not expose checkTodayCompletion()."
        );

        return false;

    }


    try {

        const completed =
            window.StudyMindStreak
                .checkTodayCompletion();


        syncLocalStats();


        if (completed) {

            renderStats();

            renderLevel();

        }


        return completed;

    } catch (error) {

        console.error(
            "StudyMind completion check failed:",
            error
        );

        return false;

    }

}


/* =========================================================
   COMPLETION POPUP
========================================================= */

function showCompletionCelebration() {

    if (
        document.getElementById(
            "studyMindCompletionPopup"
        )
    ) {

        return;

    }


    const popup =
        document.createElement(
            "div"
        );


    popup.id =
        "studyMindCompletionPopup";


    popup.innerHTML = `

        <div class="completion-popup-inner">

            <div class="completion-icon">
                🎉
            </div>

            <h2>
                Congratulations!
            </h2>

            <p>
                You completed today's required study work.
                Your study streak has been updated.
            </p>

            <button
                id="closeCompletionPopup"
                type="button"
            >
                Continue Studying
            </button>

        </div>

    `;


    document.body.appendChild(
        popup
    );


    document
        .getElementById(
            "closeCompletionPopup"
        )
        ?.addEventListener(
            "click",
            () => {

                popup.remove();

            }
        );

}


/* =========================================================
   DAILY QUESTS
========================================================= */

function renderQuests() {

    const container =
        document.getElementById(
            "dailyQuests"
        );


    if (!container) {
        return;
    }


    const quests =
        getDailyQuests();


    container.innerHTML =
        quests
            .map(
                quest => `

                    <div class="quest">

                        <div>

                            <strong>
                                ${escapeHTML(
                                    quest.title
                                )}
                            </strong>

                            <span>
                                ${escapeHTML(
                                    quest.description
                                )}
                            </span>

                        </div>

                        <div class="quest-xp">
                            +${quest.xp} XP
                        </div>

                    </div>

                `
            )
            .join("");

}


/* =========================================================
   GET DAILY QUESTS
========================================================= */

function getDailyQuests() {

    const date =
        getLocalDateKey();


    const stored =
        loadJSON(
            QUEST_KEY,
            null
        );


    if (
        stored &&
        stored.date === date &&
        Array.isArray(
            stored.quests
        )
    ) {

        return stored.quests;

    }


    const allTopics =
        getAllStudyTopics();


    const completed =
        getCompletedTopicSet();


    const topic =
        allTopics.find(
            item =>
                !isTopicCompleted(
                    item,
                    completed
                )
        );


    const topicName =
        topic?.name ||
        "Review a topic";


    const quests = [

        {

            title:
                "Start a study session",

            description:
                "Complete at least 25 minutes.",

            xp:
                20

        },

        {

            title:
                "Complete one topic",

            description:
                topicName,

            xp:
                30

        },

        {

            title:
                "Ask StudyMind AI",

            description:
                "Use AI to improve your understanding.",

            xp:
                10

        }

    ];


    localStorage.setItem(
        QUEST_KEY,
        JSON.stringify({

            date,

            quests

        })
    );


    return quests;

}


/* =========================================================
   XP / LEVEL
========================================================= */

function renderLevel() {

    syncLocalStats();


    const level =
        Math.floor(
            xp / 100
        ) + 1;


    const current =
        xp % 100;


    setText(
        "level",
        level
    );


    setText(
        "levelText",
        `${current} / 100 XP to Level ${level + 1}`
    );


    setWidth(
        "levelProgress",
        current
    );

}


/* =========================================================
   AWARD XP
=========================================================

   Kept for compatibility with other Dashboard features.

   IMPORTANT:
   study-timer.js handles timer XP.
========================================================= */

function awardXP(
    amount,
    reason = ""
) {

    amount =
        Math.max(
            0,
            Number(amount) || 0
        );


    if (
        amount <= 0
    ) {

        return;

    }


    xp =
        Number(
            localStorage.getItem(
                XP_KEY
            ) || 0
        ) +
        amount;


    localStorage.setItem(
        XP_KEY,
        String(xp)
    );


    localStorage.setItem(
        "studyMindLastXPEvent",
        JSON.stringify({

            amount,

            reason,

            timestamp:
                Date.now()

        })
    );


    renderStats();

    renderLevel();


    window.dispatchEvent(
        new CustomEvent(
            "studyMindXPUpdated",
            {
                detail: {

                    amount,

                    total:
                        xp,

                    reason

                }
            }
        )
    );

}


/* =========================================================
   AI RECOMMENDATION
========================================================= */

function renderRecommendation() {

    const element =
        document.getElementById(
            "aiRecommendation"
        );


    if (!element) {
        return;
    }


    const allTopics =
        getAllStudyTopics();


    const completed =
        getCompletedTopicSet();


    const next =
        allTopics.find(
            topic =>
                !isTopicCompleted(
                    topic,
                    completed
                )
        );


    if (!next) {

        element.textContent =
            "Excellent work. You've completed all topics currently in your plan.";

        return;

    }


    const subject =
        next.subject ||
        "your next subject";


    const topic =
        next.name ||
        next.topic ||
        next.title ||
        "your next topic";


    element.textContent =
        `Your next priority is ${subject}: ${topic}. Focus on understanding it first, then use active recall before moving forward.`;

}


/* =========================================================
   REFRESH / REBALANCE
========================================================= */

document
    .getElementById(
        "refreshPlan"
    )
    ?.addEventListener(
        "click",
        async () => {

            alert(
                "StudyMind AI will rebalance your schedule using your latest progress."
            );

        }
    );


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    document
        .getElementById(
            "logoutButton"
        )
        ?.addEventListener(
            "click",
            async () => {

                if (supabaseClient) {

                    try {

                        await supabaseClient
                            .auth
                            .signOut();

                    } catch (error) {

                        console.warn(
                            "StudyMind logout failed:",
                            error
                        );

                    }

                }


                window.location.href =
                    "home.html";

            }
        );

}


/* =========================================================
   EXAMS
========================================================= */

function renderExams() {

    const container =
        document.getElementById(
            "examList"
        );


    if (!container) {
        return;
    }


    const exams =
        Array.isArray(
            studyPlan?.exams
        )
            ? [
                ...studyPlan.exams
            ]
            : [];


    exams.sort(
        (a, b) =>
            new Date(
                a?.date
            ) -
            new Date(
                b?.date
            )
    );


    if (!exams.length) {

        container.innerHTML =
            "<p>No exams added.</p>";

        return;

    }


    container.innerHTML =
        exams
            .slice(
                0,
                5
            )
            .map(
                exam => {

                    const examDate =
                        new Date(
                            exam?.date
                        );


                    const days =
                        Math.ceil(
                            (
                                examDate -
                                new Date()
                            ) /
                            86400000
                        );


                    return `

                        <div class="exam-item">

                            <div>

                                <div class="exam-name">
                                    ${escapeHTML(
                                        exam?.name ||
                                        "Exam"
                                    )}
                                </div>

                                <div class="exam-date">
                                    ${escapeHTML(
                                        exam?.date ||
                                        ""
                                    )}
                                </div>

                            </div>

                            <strong>
                                ${
                                    days >= 0
                                        ? `${days} days`
                                        : "Passed"
                                }
                            </strong>

                        </div>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   HELPERS
========================================================= */

function getLocalDateKey(
    date = new Date()
) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return (
        `${year}-${month}-${day}`
    );

}


/* =========================================================
   LOAD JSON
========================================================= */

function loadJSON(
    key,
    fallback
) {

    try {

        const value =
            localStorage.getItem(
                key
            );


        if (
            !value
        ) {

            return fallback;

        }


        return JSON.parse(
            value
        );

    } catch (error) {

        console.warn(
            "StudyMind JSON read failed:",
            key,
            error
        );


        return fallback;

    }

}


/* =========================================================
   SET TEXT
========================================================= */

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
            value;

    }

}


/* =========================================================
   SET WIDTH
========================================================= */

function setWidth(
    id,
    percent
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.style.width =
            `${Math.max(
                0,
                Math.min(
                    100,
                    Number(percent) || 0
                )
            )}%`;

    }

}


/* =========================================================
   ESCAPE HTML
========================================================= */

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


/* =========================================================
   ESCAPE ATTRIBUTE
========================================================= */

function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );

}


/* =========================================================
   PUBLIC DASHBOARD API
========================================================= */

window.StudyMindDashboard = {

    getStudyProgress,

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

    selectSharedTimerDuration

};

