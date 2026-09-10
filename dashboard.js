"use strict";


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


let studyPlan =
    loadJSON(PLAN_KEY, null);

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
