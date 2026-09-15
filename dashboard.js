"use strict";

/* =========================================================
   STUDYMIND AI — DASHBOARD
   COMPLETE VERSION

   FEATURES
   ---------------------------------------------------------
   ✓ Shared timer engine
   ✓ Dashboard ↔ Study Timer synchronization
   ✓ Study sessions
   ✓ Daily study time
   ✓ XP
   ✓ Levels
   ✓ Study streak integration
   ✓ Today's completion detection
   ✓ Subject → topic plan support
   ✓ Flat topic plan support
   ✓ Daily quests
   ✓ Exams
   ✓ AI recommendation
   ✓ Supabase user loading
   ✓ Logout
   ✓ Cross-page synchronization

   IMPORTANT
   ---------------------------------------------------------
   streak.js is the SINGLE source of truth for streaks.

   dashboard.js NEVER manually increments the streak.
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

   THESE MUST MATCH study-timer.html / study-timer.js
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
   TIMER STATE
========================================================= */

let timerInterval =
    null;


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

        /*
         * Make sure the local values are current.
         */
        syncLocalStats();

        /*
         * Ask streak.js whether today's required
         * study work has been completed.
         *
         * dashboard.js does NOT increment streaks itself.
         */
        checkStudyCompletion();

        /*
         * Render dashboard.
         */
        renderStats();

        renderToday();

        renderExams();

        renderQuests();

        renderLevel();

        renderRecommendation();

        setupLogout();

        setupSharedDashboardTimer();


        /* =================================================
           STORAGE SYNCHRONIZATION
        ================================================= */

        window.addEventListener(
            "storage",
            event => {

                /*
                 * Study topic completion changed.
                 */
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


                /*
                 * Plan changed.
                 */
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


                /*
                 * XP changed.
                 */
                if (
                    event.key ===
                    XP_KEY
                ) {

                    syncLocalStats();

                    renderStats();

                    renderLevel();

                    renderQuests();
                }


                /*
                 * Streak changed.
                 */
                if (
                    event.key ===
                    STREAK_KEY
                ) {

                    syncLocalStats();

                    renderStats();
                }


                /*
                 * Timer state changed.
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
           CUSTOM STREAK EVENT
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
           CUSTOM XP EVENT
        ================================================= */

        window.addEventListener(
            "studyMindXPUpdated",
            event => {

                syncLocalStats();

                renderStats();

                renderLevel();

                console.log(
                    "StudyMind Dashboard: XP updated.",
                    event.detail || {}
                );

            }
        );


        /* =================================================
           SAME-PAGE TIMER EVENT
        ================================================= */

        window.addEventListener(
            "studyMindTimerChanged",
            () => {

                renderSharedDashboardTimer();

            }
        );


        /*
         * Keep Dashboard synchronized with streak.js.
         */
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

                    }

                },
                1500
            );

        }

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
     * Prefer the streak engine's calculated value.
     */
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
                    .calculateCurrentStreak() ||
                0
            );

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

/*
   THERE IS ONLY ONE TIMER.

   Dashboard and Study Timer use:

   studyMindTimerSeconds
   studyMindTimerEndTime
   studyMindTimerRunning
   studyMindSelectedTimerSeconds
*/


function setupSharedDashboardTimer() {

    const display =
        document.getElementById(
            "dashboardTimerDisplay"
        );


    if (!display) {
        return;
    }


    initializeSharedTimer();


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


    document
        .getElementById(
            "dashboardTimerStart"
        )
        ?.addEventListener(
            "click",
            () => {

                if (
                    isSharedTimerRunning()
                ) {

                    pauseSharedTimer();

                } else {

                    startSharedTimer();

                }

            }
        );


    document
        .getElementById(
            "dashboardTimerReset"
        )
        ?.addEventListener(
            "click",
            () => {

                resetSharedTimer();

            }
        );


    startDashboardTimerRefresh();

}


/* =========================================================
   TIMER INITIALIZATION
========================================================= */

function initializeSharedTimer() {

    let duration =
        Number(
            localStorage.getItem(
                TIMER_DURATION_KEY
            )
        );


    if (
        !Number.isFinite(duration) ||
        duration <= 0
    ) {

        duration =
            25 * 60;


        localStorage.setItem(
            TIMER_DURATION_KEY,
            String(duration)
        );

    }


    const running =
        localStorage.getItem(
            TIMER_RUNNING_KEY
        ) === "true";


    const seconds =
        Number(
            localStorage.getItem(
                TIMER_SECONDS_KEY
            )
        );


    if (
        !Number.isFinite(seconds) ||
        seconds < 0
    ) {

        localStorage.setItem(
            TIMER_SECONDS_KEY,
            String(duration)
        );

    }


    if (
        running &&
        !Number(
            localStorage.getItem(
                TIMER_END_KEY
            )
        )
    ) {

        localStorage.setItem(
            TIMER_RUNNING_KEY,
            "false"
        );

    }


    renderSharedDashboardTimer();

}


/* =========================================================
   START TIMER
========================================================= */

function startSharedTimer() {

    let seconds =
        Number(
            localStorage.getItem(
                TIMER_SECONDS_KEY
            )
        );


    const selectedDuration =
        Number(
            localStorage.getItem(
                TIMER_DURATION_KEY
            )
        );


    if (
        !Number.isFinite(seconds) ||
        seconds <= 0
    ) {

        seconds =
            Number.isFinite(
                selectedDuration
            ) &&
            selectedDuration > 0
                ? selectedDuration
                : 25 * 60;

    }


    const endTime =
        Date.now() +
        seconds * 1000;


    localStorage.setItem(
        TIMER_SECONDS_KEY,
        String(seconds)
    );


    localStorage.setItem(
        TIMER_END_KEY,
        String(endTime)
    );


    localStorage.setItem(
        TIMER_RUNNING_KEY,
        "true"
    );


    dispatchTimerChanged();

    renderSharedDashboardTimer();

}


/* =========================================================
   PAUSE TIMER
========================================================= */

function pauseSharedTimer() {

    const remaining =
        getSharedTimerRemaining();


    localStorage.setItem(
        TIMER_SECONDS_KEY,
        String(
            Math.max(
                0,
                remaining
            )
        )
    );


    localStorage.removeItem(
        TIMER_END_KEY
    );


    localStorage.setItem(
        TIMER_RUNNING_KEY,
        "false"
    );


    dispatchTimerChanged();

    renderSharedDashboardTimer();

}


/* =========================================================
   RESET TIMER
========================================================= */

function resetSharedTimer() {

    let duration =
        Number(
            localStorage.getItem(
                TIMER_DURATION_KEY
            )
        );


    if (
        !Number.isFinite(duration) ||
        duration <= 0
    ) {

        duration =
            25 * 60;

    }


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


    dispatchTimerChanged();

    renderSharedDashboardTimer();

}


/* =========================================================
   SELECT TIMER DURATION
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


    /*
     * Never destroy an active session.
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


    dispatchTimerChanged();

    renderSharedDashboardTimer();

}


/* =========================================================
   GET REMAINING TIME
========================================================= */

function getSharedTimerRemaining() {

    const running =
        localStorage.getItem(
            TIMER_RUNNING_KEY
        ) === "true";


    if (!running) {

        const pausedSeconds =
            Number(
                localStorage.getItem(
                    TIMER_SECONDS_KEY
                )
            );


        return Number.isFinite(
            pausedSeconds
        )
            ? Math.max(
                0,
                Math.floor(
                    pausedSeconds
                )
            )
            : 0;

    }


    const endTime =
        Number(
            localStorage.getItem(
                TIMER_END_KEY
            )
        );


    if (
        !Number.isFinite(endTime)
    ) {

        return 0;

    }


    return Math.max(
        0,
        Math.ceil(
            (
                endTime -
                Date.now()
            ) / 1000
        )
    );

}


/* =========================================================
   CHECK TIMER RUNNING
========================================================= */

function isSharedTimerRunning() {

    return (
        localStorage.getItem(
            TIMER_RUNNING_KEY
        ) === "true"
    );

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


    let remaining =
        getSharedTimerRemaining();


    const running =
        isSharedTimerRunning();


    if (
        running &&
        remaining <= 0
    ) {

        finishSharedTimer();

        remaining = 0;

    }


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
========================================================= */

function startDashboardTimerRefresh() {

    if (timerInterval) {

        clearInterval(
            timerInterval
        );

    }


    timerInterval =
        setInterval(
            () => {

                renderSharedDashboardTimer();

            },
            250
        );

}


/* =========================================================
   TIMER FINISHED
========================================================= */

function finishSharedTimer() {

    /*
     * Prevent duplicate completion.
     */
    if (
        localStorage.getItem(
            TIMER_RUNNING_KEY
        ) !== "true"
    ) {
        return;
    }


    const duration =
        Number(
            localStorage.getItem(
                TIMER_DURATION_KEY
            )
        ) ||
        25 * 60;


    const completedMinutes =
        Math.max(
            1,
            Math.round(
                duration / 60
            )
        );


    /* -----------------------------------------
       STOP TIMER
    ----------------------------------------- */

    localStorage.setItem(
        TIMER_SECONDS_KEY,
        "0"
    );


    localStorage.removeItem(
        TIMER_END_KEY
    );


    localStorage.setItem(
        TIMER_RUNNING_KEY,
        "false"
    );


    /* -----------------------------------------
       RECORD STUDY SESSION
    ----------------------------------------- */

    const sessions =
        loadJSON(
            SESSION_KEY,
            []
        );


    const today =
        getLocalDateKey();


    const currentSession =
        loadJSON(
            "studyMindCurrentStudySession",
            null
        );


    sessions.push({

        id:
            `session_${Date.now()}`,

        date:
            today,

        duration:
            completedMinutes,

        seconds:
            duration,

        subject:
            currentSession?.subject ||
            "General Study",

        topic:
            currentSession?.topic ||
            "",

        completed:
            true,

        completedAt:
            new Date().toISOString()

    });


    localStorage.setItem(
        SESSION_KEY,
        JSON.stringify(
            sessions
        )
    );


    /* -----------------------------------------
       XP
    ----------------------------------------- */

    awardXP(
        Math.max(
            10,
            completedMinutes
        ),
        `${completedMinutes}-minute study session`
    );


    /* -----------------------------------------
       DAILY STUDY TIME
    ----------------------------------------- */

    updateDailyStudyTime(
        completedMinutes
    );


    /*
     * The timer itself does NOT complete
     * the study topic.
     *
     * The actual topic completion system
     * is responsible for that.
     */

    dispatchTimerChanged();


    syncLocalStats();

    renderStats();

    renderLevel();

    renderQuests();

    renderRecommendation();


    /*
     * Check whether today's topics are now
     * complete in case the user had already
     * completed them.
     */
    checkStudyCompletion();


    /*
     * Milo reaction if available.
     */
    if (
        window.Milo &&
        typeof
            window.Milo
                .celebrateStudySession ===
            "function"
    ) {

        try {

            window.Milo
                .celebrateStudySession(
                    completedMinutes
                );

        } catch (error) {

            console.warn(
                "Milo session celebration failed:",
                error
            );

        }

    }

}


/* =========================================================
   DAILY STUDY TIME
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


    /* -----------------------------------------
       SUBJECT → TOPICS
    ----------------------------------------- */

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


    /* -----------------------------------------
       FLAT TOPICS
    ----------------------------------------- */

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

    if (
        !topic
    ) {
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

    /*
     * If streak.js is loaded, use its
     * schedule-aware logic.
     */
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


    /*
     * Fallback for pages where streak.js
     * has not loaded.
     */
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

   IMPORTANT:
   streak.js owns the streak.

   dashboard.js only asks it to check completion.
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

            /*
             * Do not show a second alert here.
             *
             * streak.js / Milo owns the celebration.
             */

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

   Kept for compatibility with older dashboard HTML.
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
        ).padStart(2, "0") +

        ":" +

        String(
            remainingSeconds
        ).padStart(2, "0")
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
   TIMER CROSS-PAGE EVENT
========================================================= */

function dispatchTimerChanged() {

    window.dispatchEvent(
        new Event(
            "studyMindTimerChanged"
        )
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
   Useful for other StudyMind scripts.
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

