"use strict";

/* =========================================================
STUDYMIND AI — DASHBOARD
PRESERVED + SHARED TIMER ENGINE
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

/* =========================================================
SHARED TIMER KEYS

IMPORTANT:
These are the SAME keys used by study-timer.html.

There is ONE timer.
Dashboard and Study Timer are only two interfaces.
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
SHARED TIMER STATE
========================================================= */

let timerInterval =
null;

/* =========================================================
AUTH
========================================================= */

const SUPABASE_URL =
"https://bicnrbqqvucgpbwudmit.supabase.co";

const SUPABASE_KEY =
"sb_publishable_70y0MPrj30-FimUSQK_HuA_Ng1a1qcB";

const supabaseClient =
window.supabase?.createClient
? window.supabase.createClient(
SUPABASE_URL,
SUPABASE_KEY
)
: null;

/* =========================================================
INITIALIZATION
========================================================= */

document.addEventListener(
"DOMContentLoaded",
async () => {


    await loadUser();

    renderStats();

    renderToday();

    renderExams();

    renderQuests();

    renderLevel();

    renderRecommendation();

    setupLogout();

    setupSharedDashboardTimer();

}


);

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
            await supabaseClient.auth.getUser();


        const user =
            data?.user;


        if (user) {

            username =
                user.user_metadata
                    ?.username ||

                user.user_metadata
                    ?.full_name ||

                user.email
                    ?.split("@")[0] ||

                username;

        }

    } catch {}

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


const total =
    studyPlan?.topics?.length ||
    0;


const completed =
    studyPlan?.topics
        ?.filter(
            topic =>
                topic.completed
        )
        .length ||
    0;


const percent =
    total
        ? Math.round(
            completed /
            total *
            100
        )
        : 0;


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
    `${percent}%`
);


setWidth(
    "studyProgressBar",
    percent
);


setText(
    "streakMessage",
    streak
        ? "Keep your learning momentum."
        : "Start your first valid session."
);


}

/* =========================================================
TODAY
========================================================= */

function renderToday() {


const container =
    document.getElementById(
        "todaySchedule"
    );


if (!container) return;


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
    new Date()
        .toISOString()
        .split("T")[0];


const day =
    studyPlan.schedule.find(
        item =>
            item.date === today
    );


if (!day) {

    container.innerHTML = `
        <div class="loading">
            ${escapeHTML(
                studyPlan.schedule[0]
                    ?.dayType === "rest"
                    ? "Today is a planned recovery day."
                    : "No session is scheduled today."
            )}
        </div>
    `;

    return;

}


if (
    day.dayType === "rest"
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
        session =>
            session.type !== "break"
    );


container.innerHTML =
    studySessions.map(
        session => `

            <div class="study-session">

                <div>

                    <div class="session-time">
                        ${escapeHTML(
                            session.start
                        )}
                        —
                        ${escapeHTML(
                            session.end
                        )}
                    </div>

                    <div class="session-type">
                        ${escapeHTML(
                            session.type
                        )}
                    </div>

                </div>

                <div>

                    <strong>
                        ${escapeHTML(
                            session.subject ||
                            "Study"
                        )}
                    </strong>

                    <div class="session-type">
                        ${escapeHTML(
                            session.topic ||
                            ""
                        )}
                    </div>

                </div>

                <button
                    class="session-action"
                    data-session='${escapeAttribute(
                        JSON.stringify(
                            session
                        )
                    )}'
                >
                    Start
                </button>

            </div>

        `
    ).join("");


container
    .querySelectorAll(
        "[data-session]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const session =
                    JSON.parse(
                        button.dataset.session
                    );


                startStudySession(
                    session
                );

            }
        );

    });


}

/* =========================================================
STUDY SESSION
========================================================= */

function startStudySession(
session
) {


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
TIMER ARCHITECTURE

Dashboard and Study Timer both use these same values:

studyMindTimerSeconds
studyMindTimerEndTime
studyMindTimerRunning
studyMindSelectedTimerSeconds

The countdown is calculated from endTime.

Therefore:

Dashboard → Start 25 min
↓
Study Timer → 24:59

Study Timer → Pause
↓
Dashboard → remains paused

No second timer is created.
*/

function setupSharedDashboardTimer() {


const display =
    document.getElementById(
        "dashboardTimerDisplay"
    );


if (!display) return;


initializeSharedTimer();


document
    .querySelectorAll(
        ".timer-preset"
    )
    .forEach(button => {

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

    });


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


/*
   Update immediately when another StudyMind page
   changes the shared localStorage state.
*/

window.addEventListener(
    "storage",
    event => {

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


/*
   Also support same-page custom events.
   This allows other StudyMind scripts to notify
   this interface without creating another timer.
*/

window.addEventListener(
    "studyMindTimerChanged",
    () => {

        renderSharedDashboardTimer();

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


/*
   If there is no timer state yet,
   initialize it to the selected duration.
*/

if (
    !Number.isFinite(seconds) ||
    seconds < 0
) {

    localStorage.setItem(
        TIMER_SECONDS_KEY,
        String(duration)
    );

}


/*
   If timer was marked running but the end
   time is missing, safely stop it.
*/

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


/*
   If timer is at zero, starting it again
   begins the selected duration.
*/

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
   Do not change an active timer.

   The user must pause/reset first.
   This prevents accidentally destroying
   an active study session.
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
CHECK RUNNING
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


if (!display) return;


let remaining =
    getSharedTimerRemaining();


const running =
    isSharedTimerRunning();


/*
   Timer has reached zero.
*/

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

    } else if (remaining <= 0) {

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


dispatchTimerChanged();


/*
   Keep the selected duration so the user
   can start another session without losing
   their 25/45/60 minute preference.
*/


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
    String(minutes)
        .padStart(2, "0") +

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
    .forEach(button => {

        const duration =
            Number(
                button.dataset.duration
            );


        button.classList.toggle(
            "active",
            duration === selected
        );

    });


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


if (!container) return;


const exams =
    Array.isArray(
        studyPlan?.exams
    )
        ? [...studyPlan.exams]
        : [];


exams.sort(
    (a,b) =>
        new Date(a.date) -
        new Date(b.date)
);


if (!exams.length) {

    container.innerHTML =
        "<p>No exams added.</p>";

    return;

}


container.innerHTML =
    exams
        .slice(0,5)
        .map(
            exam => {

                const days =
                    Math.ceil(
                        (
                            new Date(
                                exam.date
                            ) -
                            new Date()
                        ) /
                        86400000
                    );


                return `

                    <div class="exam-item">

                        <div>

                            <div class="exam-name">
                                ${escapeHTML(
                                    exam.name
                                )}
                            </div>

                            <div class="exam-date">
                                ${escapeHTML(
                                    exam.date
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
DAILY QUESTS
========================================================= */

function renderQuests() {


const container =
    document.getElementById(
        "dailyQuests"
    );


if (!container) return;


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

function getDailyQuests() {


const date =
    new Date()
        .toISOString()
        .split("T")[0];


const stored =
    loadJSON(
        QUEST_KEY,
        null
    );


if (
    stored &&
    stored.date === date
) {

    return stored.quests;

}


const topic =
    studyPlan?.topics?.find(
        item =>
            !item.completed
    );


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
            topic
                ? topic.name
                : "Review a topic",

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

function awardXP(
amount,
reason = ""
) {


amount =
    Math.max(
        0,
        Number(amount)
    );


xp += amount;


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


}

/* =========================================================
AI RECOMMENDATION
========================================================= */

function renderRecommendation() {


const element =
    document.getElementById(
        "aiRecommendation"
    );


if (!element) return;


const next =
    studyPlan?.topics?.find(
        topic =>
            !topic.completed
    );


if (!next) {

    element.textContent =
        "Excellent work. You've completed all topics currently in your plan.";

    return;

}


element.textContent =
    `Your next priority is ${next.subject}: ${next.name}. Focus on understanding it first, then use active recall before moving forward.`;


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

                } catch {}

            }


            window.location.href =
                "home.html";

        }
    );


}

/* =========================================================
HELPERS
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


    return value
        ? JSON.parse(value)
        : fallback;

} catch {

    return fallback;

}


}

function setText(
id,
value
) {


const element =
    document.getElementById(id);


if (element) {

    element.textContent =
        value;

}


}

function setWidth(
id,
percent
) {


const element =
    document.getElementById(id);


if (element) {

    element.style.width =
        `${Math.max(
            0,
            Math.min(
                100,
                percent
            )
        )}%`;

}


}

function escapeHTML(value) {


return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");


}

function escapeAttribute(value) {


return escapeHTML(value);


}
