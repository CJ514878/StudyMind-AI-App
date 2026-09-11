"use strict";

/* =========================================================
   STUDYMIND AI — STUDY TIMER
   SHARED TIMER SYSTEM

   Shared keys:
   - studyMindTimerSeconds
   - studyMindTimerEndTime
   - studyMindTimerRunning
   - studyMindSelectedTimerSeconds

   Also connects with:
   - studyMindCurrentStudySession
   - studyMindCurrentTopic
   - studyMindCurrentSubject
   - studyMindCompletedTopics
   - studyMindStudySessions
   - studyMindXP
========================================================= */


const TIMER_KEYS = {

    SECONDS: "studyMindTimerSeconds",

    END_TIME: "studyMindTimerEndTime",

    RUNNING: "studyMindTimerRunning",

    DURATION: "studyMindSelectedTimerSeconds",

    SESSION: "studyMindCurrentStudySession",

    CURRENT_TOPIC: "studyMindCurrentTopic",

    CURRENT_SUBJECT: "studyMindCurrentSubject",

    SESSIONS: "studyMindStudySessions",

    XP: "studyMindXP"

};


/* =========================================================
   HELPERS
========================================================= */

function $(id) {
    return document.getElementById(id);
}


function safeJSON(key, fallback) {

    try {

        const value = localStorage.getItem(key);

        if (!value) {
            return fallback;
        }

        return JSON.parse(value);

    } catch {

        return fallback;
    }
}


function saveJSON(key, value) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

    } catch {}
}


function todayKey() {

    const d = new Date();

    return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, "0"),
        String(d.getDate()).padStart(2, "0")
    ].join("-");

}


function formatTime(totalSeconds) {

    totalSeconds = Math.max(
        0,
        Math.floor(totalSeconds)
    );

    const minutes =
        Math.floor(totalSeconds / 60);

    const seconds =
        totalSeconds % 60;

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0")
    );

}


/* =========================================================
   STATE
========================================================= */

let selectedDuration =
    Number(
        localStorage.getItem(
            TIMER_KEYS.DURATION
        )
    ) || 25;


let remainingSeconds =
    Number(
        localStorage.getItem(
            TIMER_KEYS.SECONDS
        )
    );


let timerRunning =
    localStorage.getItem(
        TIMER_KEYS.RUNNING
    ) === "true";


let timerEndTime =
    Number(
        localStorage.getItem(
            TIMER_KEYS.END_TIME
        )
    ) || 0;


let timerInterval = null;

let sessionStartedAt = null;


/* =========================================================
   PLAN
========================================================= */

function loadPlan() {

    const candidates = [

        "studyMindPlan",

        "studyData"

    ];

    for (const key of candidates) {

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


function normalizeTopics(plan) {

    if (!plan) {
        return [];
    }

    const result = [];

    if (Array.isArray(plan.subjects)) {

        plan.subjects.forEach(subject => {

            if (!subject) {
                return;
            }

            const subjectName =
                subject.name ||
                subject.subject ||
                subject.title ||
                "Subject";

            let topics =
                Array.isArray(subject.topics)
                    ? subject.topics
                    : [];

            topics.forEach(topic => {

                if (
                    typeof topic === "string"
                ) {

                    result.push({
                        subject: subjectName,
                        topic: topic
                    });

                    return;
                }

                if (topic && typeof topic === "object") {

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

            });

        });

    }


    if (
        result.length === 0 &&
        Array.isArray(plan.topics)
    ) {

        plan.topics.forEach(topic => {

            if (typeof topic === "string") {

                result.push({
                    subject:
                        plan.subject ||
                        "Study",

                    topic
                });

            }

        });

    }

    return result;
}


/* =========================================================
   CURRENT TOPIC
========================================================= */

function getCurrentStudyTopic() {

    const session =
        safeJSON(
            TIMER_KEYS.SESSION,
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
            TIMER_KEYS.CURRENT_TOPIC
        );

    const storedSubject =
        localStorage.getItem(
            TIMER_KEYS.CURRENT_SUBJECT
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
        topics.find(item => {

            const key =
                `${item.subject}::${item.topic}`;

            return !completed.includes(key) &&
                   !completed.includes(item.topic);

        });


    return next || topics[0] || null;
}


/* =========================================================
   RENDER CURRENT TOPIC
========================================================= */

function renderCurrentTopic() {

    const current =
        getCurrentStudyTopic();


    if (!current) {

        $("currentSubject").textContent =
            "Ready to study";

        $("currentTopic").textContent =
            "Create a study plan to begin.";

        $("recommendedSubject").textContent =
            "No active topic";

        $("recommendedTopic").textContent =
            "Create a study plan to let AI choose your next topic.";

        return;

    }


    $("currentSubject").textContent =
        current.subject;

    $("currentTopic").textContent =
        current.topic;

    $("recommendedSubject").textContent =
        current.subject;

    $("recommendedTopic").textContent =
        current.topic;

}


/* =========================================================
   TIMER INITIALIZATION
========================================================= */

function initializeTimer() {

    if (!remainingSeconds) {

        remainingSeconds =
            selectedDuration * 60;

        localStorage.setItem(
            TIMER_KEYS.SECONDS,
            remainingSeconds
        );

    }


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


        if (remainingSeconds <= 0) {

            completeSession();

            return;
        }

        startInterval();

    }


    updateTimerUI();

}


/* =========================================================
   TIMER UI
========================================================= */

function updateTimerUI() {

    $("timerDisplay").textContent =
        formatTime(remainingSeconds);


    const totalSeconds =
        selectedDuration * 60;


    const elapsed =
        Math.max(
            0,
            totalSeconds -
            remainingSeconds
        );


    const progress =
        totalSeconds > 0
            ? (elapsed / totalSeconds) * 100
            : 0;


    $("timerProgress").style.width =
        `${progress}%`;


    document
        .querySelector(".timer-circle")
        .style.setProperty(
            "--timer-progress",
            `${progress}%`
        );


    $("elapsedText").textContent =
        `${Math.floor(elapsed / 60)} min studied`;


    $("remainingText").textContent =
        `${Math.ceil(remainingSeconds / 60)} min remaining`;


    if (timerRunning) {

        $("startPauseTimer").textContent =
            "❚❚ Pause Session";

        $("sessionStatus").textContent =
            "FOCUSING";

        $("timerLabel").textContent =
            "Stay focused";

    } else {

        $("startPauseTimer").textContent =
            "▶ Start Session";

        $("sessionStatus").textContent =
            elapsed > 0
                ? "PAUSED"
                : "READY";

        $("timerLabel").textContent =
            elapsed > 0
                ? "Session paused"
                : "Focus time";

    }

}


/* =========================================================
   START
========================================================= */

function startTimer() {

    if (remainingSeconds <= 0) {

        remainingSeconds =
            selectedDuration * 60;

    }


    const current =
        getCurrentStudyTopic();


    if (current) {

        localStorage.setItem(
            TIMER_KEYS.CURRENT_TOPIC,
            current.topic
        );

        localStorage.setItem(
            TIMER_KEYS.CURRENT_SUBJECT,
            current.subject
        );

        saveJSON(
            TIMER_KEYS.SESSION,
            {
                subject: current.subject,
                topic: current.topic,
                duration: selectedDuration,
                startedAt: Date.now()
            }
        );

    }


    timerEndTime =
        Date.now() +
        remainingSeconds * 1000;


    timerRunning = true;


    localStorage.setItem(
        TIMER_KEYS.SECONDS,
        remainingSeconds
    );

    localStorage.setItem(
        TIMER_KEYS.END_TIME,
        timerEndTime
    );

    localStorage.setItem(
        TIMER_KEYS.RUNNING,
        "true"
    );


    sessionStartedAt =
        Date.now();


    startInterval();

    updateTimerUI();

    updateCoach(
        "Focus mode activated",
        "Stay with the current topic. StudyMind is tracking your genuine study time."
    );

}


/* =========================================================
   PAUSE
========================================================= */

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


    timerRunning = false;

    clearInterval(timerInterval);


    localStorage.setItem(
        TIMER_KEYS.SECONDS,
        remainingSeconds
    );

    localStorage.setItem(
        TIMER_KEYS.RUNNING,
        "false"
    );

    localStorage.removeItem(
        TIMER_KEYS.END_TIME
    );


    updateTimerUI();


    updateCoach(
        "Session paused",
        "Take a short break if you need one, then return when you're ready."
    );

}


/* =========================================================
   RESET
========================================================= */

function resetTimer() {

    clearInterval(timerInterval);

    timerRunning = false;

    timerEndTime = 0;

    remainingSeconds =
        selectedDuration * 60;


    localStorage.setItem(
        TIMER_KEYS.SECONDS,
        remainingSeconds
    );

    localStorage.setItem(
        TIMER_KEYS.RUNNING,
        "false"
    );

    localStorage.removeItem(
        TIMER_KEYS.END_TIME
    );


    updateTimerUI();


    updateCoach(
        "Timer reset",
        "Your next session is ready whenever you are."
    );

}


/* =========================================================
   INTERVAL
========================================================= */

function startInterval() {

    clearInterval(timerInterval);


    timerInterval =
        setInterval(() => {

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
                TIMER_KEYS.SECONDS,
                remainingSeconds
            );


            updateTimerUI();


            if (remainingSeconds <= 0) {

                completeSession();

            }

        }, 500);

}


/* =========================================================
   COMPLETE
========================================================= */

function completeSession() {

    clearInterval(timerInterval);

    timerRunning = false;

    const minutes =
        selectedDuration;


    const current =
        getCurrentStudyTopic();


    const sessions =
        safeJSON(
            TIMER_KEYS.SESSIONS,
            []
        );


    sessions.unshift({

        id:
            Date.now(),

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

        xp:
            calculateXP(minutes)

    });


    saveJSON(
        TIMER_KEYS.SESSIONS,
        sessions.slice(0, 100)
    );


    addXP(
        calculateXP(minutes)
    );


    localStorage.setItem(
        TIMER_KEYS.SECONDS,
        0
    );

    localStorage.setItem(
        TIMER_KEYS.RUNNING,
        "false"
    );

    localStorage.removeItem(
        TIMER_KEYS.END_TIME
    );


    showCompletion(
        minutes,
        calculateXP(minutes)
    );


    renderStats();

    renderHistory();

    updateTimerUI();


    window.dispatchEvent(
        new CustomEvent(
            "studyMindTimerCompleted",
            {
                detail: {
                    minutes,
                    topic:
                        current?.topic || null
                }
            }
        )
    );

}


/* =========================================================
   XP
========================================================= */

function calculateXP(minutes) {

    /*
       Base XP is based on genuine study time.

       25 minutes = 25 XP
       45 minutes = 45 XP
       60 minutes = 60 XP
    */

    return Math.max(
        25,
        Math.round(minutes)
    );

}


function addXP(amount) {

    const current =
        Number(
            localStorage.getItem(
                TIMER_KEYS.XP
            )
        ) || 0;


    localStorage.setItem(
        TIMER_KEYS.XP,
        current + amount
    );


    /*
       Compatibility with possible
       future XP systems.
    */

    const alternate =
        Number(
            localStorage.getItem(
                "studyMindTotalXP"
            )
        ) || 0;


    localStorage.setItem(
        "studyMindTotalXP",
        alternate + amount
    );

}


/* =========================================================
   COMPLETION MODAL
========================================================= */

function showCompletion(minutes, xp) {

    $("earnedMinutes").textContent =
        minutes;

    $("earnedXP").textContent =
        xp;


    $("completionMessage").textContent =
        `You completed ${minutes} minutes of focused study. Your progress has been recorded.`;


    $("completionModal")
        .classList
        .add("show");


    updateCoach(
        "Excellent work",
        "Your completed session has been recorded and XP has been added to your progress."
    );

}


/* =========================================================
   STATS
========================================================= */

function renderStats() {

    const sessions =
        safeJSON(
            TIMER_KEYS.SESSIONS,
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
            (total, session) =>
                total +
                Number(session.minutes || 0),
            0
        );


    const xp =
        todaySessions.reduce(
            (total, session) =>
                total +
                Number(session.xp || 0),
            0
        );


    $("todayMinutes").textContent =
        minutes;


    $("todaySessions").textContent =
        todaySessions.length;


    $("todayXP").textContent =
        xp;

}


/* =========================================================
   HISTORY
========================================================= */

function renderHistory() {

    const sessions =
        safeJSON(
            TIMER_KEYS.SESSIONS,
            []
        );


    $("historyCount").textContent =
        `${sessions.length} session${sessions.length === 1 ? "" : "s"}`;


    const container =
        $("sessionHistory");


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
            .slice(0, 8)
            .map(session => {

                const date =
                    new Date(
                        session.date
                    );


                const dateText =
                    date.toLocaleDateString(
                        undefined,
                        {
                            month: "short",
                            day: "numeric"
                        }
                    );


                return `

                    <div class="history-item">

                        <div class="history-icon">
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
                                ${session.minutes} min
                                ·
                                ${dateText}
                            </small>

                        </div>

                        <div class="history-xp">
                            +${session.xp} XP
                        </div>

                    </div>

                `;

            })
            .join("");

}


/* =========================================================
   COACH
========================================================= */

function updateCoach(title, message) {

    $("coachTitle").textContent =
        title;

    $("coachMessage").textContent =
        message;

}


/* =========================================================
   RECOMMENDED SESSION
========================================================= */

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
        TIMER_KEYS.CURRENT_TOPIC,
        current.topic
    );


    localStorage.setItem(
        TIMER_KEYS.CURRENT_SUBJECT,
        current.subject
    );


    saveJSON(
        TIMER_KEYS.SESSION,
        {
            subject: current.subject,
            topic: current.topic,
            duration: selectedDuration
        }
    );


    renderCurrentTopic();


    resetTimer();


    startTimer();

}


/* =========================================================
   DURATION SELECTION
========================================================= */

function selectDuration(minutes) {

    if (timerRunning) {

        alert(
            "Pause or finish the current session before changing the session length."
        );

        return;

    }


    selectedDuration =
        Number(minutes);


    localStorage.setItem(
        TIMER_KEYS.DURATION,
        selectedDuration
    );


    remainingSeconds =
        selectedDuration * 60;


    localStorage.setItem(
        TIMER_KEYS.SECONDS,
        remainingSeconds
    );


    document
        .querySelectorAll(
            ".duration-button"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                Number(
                    button.dataset.minutes
                ) === selectedDuration
            );

        });


    updateTimerUI();

}


/* =========================================================
   USER
========================================================= */

async function loadUser() {

    /*
       This works with the Supabase client if the
       project's existing configuration exposes
       window.supabaseClient or window.supabase.
    */

    try {

        const client =
            window.supabaseClient ||
            window.supabase;


        if (
            client &&
            client.auth &&
            typeof client.auth.getUser === "function"
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


                setUserName(name);

            }

        }

    } catch {

        /*
           Fall back to local information.
        */

    }


    if (
        $("userName").textContent ===
        "Student"
    ) {

        const localName =
            localStorage.getItem(
                "studyMindUsername"
            );


        if (localName) {
            setUserName(localName);
        }

    }

}


function setUserName(name) {

    const clean =
        String(name)
            .trim()
            .split(" ")
            .slice(0, 2)
            .join(" ");


    $("userName").textContent =
        clean || "Student";


    $("userAvatar").textContent =
        (
            clean ||
            "Student"
        )
            .charAt(0)
            .toUpperCase();


    $("userStatus").textContent =
        "Ready to study";

}


/* =========================================================
   SECURITY
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   EVENT LISTENERS
========================================================= */

$("startPauseTimer")
    .addEventListener(
        "click",
        () => {

            if (timerRunning) {

                pauseTimer();

            } else {

                startTimer();

            }

        }
    );


$("resetTimer")
    .addEventListener(
        "click",
        resetTimer
    );


$("useRecommended")
    .addEventListener(
        "click",
        useRecommendedSession
    );


$("closeCompletion")
    .addEventListener(
        "click",
        () => {

            $("completionModal")
                .classList
                .remove("show");

        }
    );


document
    .querySelectorAll(
        ".duration-button"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                selectDuration(
                    button.dataset.minutes
                );

            }
        );

    });


/* =========================================================
   CROSS-PAGE SYNCHRONIZATION
========================================================= */

window.addEventListener(
    "storage",
    event => {

        if (
            [
                TIMER_KEYS.SECONDS,
                TIMER_KEYS.END_TIME,
                TIMER_KEYS.RUNNING,
                TIMER_KEYS.DURATION,
                TIMER_KEYS.CURRENT_TOPIC,
                TIMER_KEYS.CURRENT_SUBJECT
            ].includes(event.key)
        ) {

            selectedDuration =
                Number(
                    localStorage.getItem(
                        TIMER_KEYS.DURATION
                    )
                ) || 25;


            remainingSeconds =
                Number(
                    localStorage.getItem(
                        TIMER_KEYS.SECONDS
                    )
                ) ||
                selectedDuration * 60;


            timerRunning =
                localStorage.getItem(
                    TIMER_KEYS.RUNNING
                ) === "true";


            timerEndTime =
                Number(
                    localStorage.getItem(
                        TIMER_KEYS.END_TIME
                    )
                ) || 0;


            renderCurrentTopic();

            updateTimerUI();

        }


        if (
            event.key ===
            TIMER_KEYS.SESSIONS
        ) {

            renderStats();

            renderHistory();

        }

    }
);


/* =========================================================
   PAGE START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadUser();

        renderCurrentTopic();

        renderStats();

        renderHistory();

        initializeTimer();

    }
);
