/* =========================================================
   STUDYMIND AI — STUDY SESSION
========================================================= */

"use strict";


/* =========================================================
   STORAGE
========================================================= */

const SESSION_KEYS = {

    PLAN:
        "studyMindPlan",

    CURRENT_TOPIC:
        "studyMindCurrentTopic",

    TOPIC_INDEX:
        "studyMindCurrentTopicIndex",

    DONE:
        "studyMindCompletedTopics",

    QUESTION_DONE:
        "studyMindCompletedQuestionTopics",

    NOTES:
        "studyMindSessionNotes",

    USERNAME:
        "studyMindUsername",

    /* SHARED TIMER */

    TIMER_SECONDS:
        "studyMindTimerSeconds",

    TIMER_END:
        "studyMindTimerEndTime",

    TIMER_RUNNING:
        "studyMindTimerRunning",

    TIMER_SELECTED:
        "studyMindSelectedTimerSeconds"

};


/* =========================================================
   STATE
========================================================= */

let studyPlan = null;
let currentTopic = null;

let timerInterval = null;

let selectedTimerSeconds = 25 * 60;


/* =========================================================
   HELPERS
========================================================= */

function $(id) {
    return document.getElementById(id);
}


function safeJSON(key, fallback = null) {

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


function saveJSON(key, value) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

    } catch (error) {

        console.warn(
            "Storage error:",
            error
        );

    }

}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeSession
);


function initializeSession() {

    loadStudyPlan();

    determineCurrentTopic();

    renderTopic();

    loadNotes();

    initializeTimer();

    setupTimerControls();

    setupChecklist();

    setupButtons();

    loadUser();

}


/* =========================================================
   LOAD PLAN
========================================================= */

function loadStudyPlan() {

    studyPlan =
        safeJSON(
            SESSION_KEYS.PLAN,
            null
        );

}


/* =========================================================
   DETERMINE TOPIC
========================================================= */

function determineCurrentTopic() {

    currentTopic = null;

    if (!studyPlan) {
        return;
    }


    /* -----------------------------------------------------
       Explicit current topic
    ----------------------------------------------------- */

    const storedCurrent =
        safeJSON(
            SESSION_KEYS.CURRENT_TOPIC,
            null
        );

    if (
        storedCurrent &&
        typeof storedCurrent === "object"
    ) {

        currentTopic =
            normalizeTopic(
                storedCurrent
            );

        return;

    }


    /* -----------------------------------------------------
       Topic index
    ----------------------------------------------------- */

    let index =
        Number(
            localStorage.getItem(
                SESSION_KEYS.TOPIC_INDEX
            )
        );

    if (!Number.isFinite(index)) {
        index = 0;
    }


    const allTopics =
        getAllTopics();


    if (allTopics.length) {

        currentTopic =
            normalizeTopic(
                allTopics[
                    Math.max(
                        0,
                        Math.min(
                            index,
                            allTopics.length - 1
                        )
                    )
                ]
            );

        return;

    }

}


/* =========================================================
   GET ALL TOPICS
========================================================= */

function getAllTopics() {

    const result = [];


    if (
        Array.isArray(
            studyPlan?.subjects
        )
    ) {

        studyPlan.subjects.forEach(
            subject => {

                if (
                    !subject ||
                    typeof subject !== "object"
                ) {
                    return;
                }

                const subjectName =
                    firstValue(
                        subject.name,
                        subject.subject,
                        subject.title
                    );


                if (
                    !Array.isArray(
                        subject.topics
                    )
                ) {
                    return;
                }


                subject.topics.forEach(
                    topic => {

                        const normalized =
                            normalizeTopic(
                                topic,
                                subjectName
                            );

                        if (normalized) {
                            result.push(normalized);
                        }

                    }
                );

            }
        );

    }


    if (
        Array.isArray(
            studyPlan?.topics
        )
    ) {

        studyPlan.topics.forEach(
            topic => {

                const normalized =
                    normalizeTopic(topic);

                if (normalized) {
                    result.push(normalized);
                }

            }
        );

    }


    return result;

}


/* =========================================================
   NORMALIZE TOPIC
========================================================= */

function normalizeTopic(
    topic,
    fallbackSubject = ""
) {

    if (!topic) {
        return null;
    }


    if (typeof topic === "string") {

        return {

            name: topic,

            subject:
                fallbackSubject || "Study Topic"

        };

    }


    if (typeof topic === "object") {

        return {

            name:
                firstValue(
                    topic.name,
                    topic.title,
                    topic.topic
                ) || "Study Topic",

            subject:
                firstValue(
                    topic.subject,
                    topic.subjectName
                ) || fallbackSubject || "Study Topic",

            difficulty:
                firstValue(
                    topic.difficulty,
                    topic.topicDifficulty
                )

        };

    }


    return null;

}


/* =========================================================
   FIRST VALUE
========================================================= */

function firstValue(...values) {

    for (const value of values) {

        if (
            value !== undefined &&
            value !== null &&
            String(value).trim()
        ) {

            return String(value).trim();

        }

    }

    return "";

}


/* =========================================================
   RENDER TOPIC
========================================================= */

function renderTopic() {

    const title =
        $("sessionTitle");

    const subtitle =
        $("sessionSubtitle");

    const topicName =
        $("topicName");

    const subjectName =
        $("subjectName");


    if (!currentTopic) {

        if (title) {
            title.textContent =
                "No Active Study Topic";
        }

        if (subtitle) {
            subtitle.textContent =
                "Return to your dashboard and start a study session.";
        }

        if (topicName) {
            topicName.textContent =
                "No topic selected";
        }

        if (subjectName) {
            subjectName.textContent =
                "StudyMind";
        }

        return;

    }


    if (title) {

        title.textContent =
            `Study ${currentTopic.name}`;

    }


    if (subtitle) {

        subtitle.textContent =
            `Focus on ${currentTopic.name} and build real understanding.`;

    }


    if (topicName) {

        topicName.textContent =
            currentTopic.name;

    }


    if (subjectName) {

        subjectName.textContent =
            currentTopic.subject;

    }


    $("infoSubject").textContent =
        currentTopic.subject || "—";

    $("infoTopic").textContent =
        currentTopic.name || "—";


    const exam =
        firstValue(
            studyPlan?.examType,
            studyPlan?.exam,
            studyPlan?.examName,
            studyPlan?.testType
        );


    $("infoExam").textContent =
        exam || "—";


    const topics =
        getAllTopics();


    const index =
        topics.findIndex(
            topic =>
                topic.name ===
                currentTopic.name &&
                topic.subject ===
                currentTopic.subject
        );


    const safeIndex =
        index >= 0
            ? index
            : 0;


    $("topicNumber").textContent =
        String(safeIndex + 1);


    const percent =
        topics.length
            ? Math.round(
                ((safeIndex + 1) /
                topics.length) * 100
            )
            : 0;


    $("progressPercent").textContent =
        `${percent}%`;

    $("topicProgress").style.width =
        `${percent}%`;

}


/* =========================================================
   NOTES
========================================================= */

function getNotesKey() {

    if (!currentTopic) {
        return SESSION_KEYS.NOTES;
    }

    return `${SESSION_KEYS.NOTES}_${currentTopic.subject}_${currentTopic.name}`;

}


function loadNotes() {

    const notes =
        localStorage.getItem(
            getNotesKey()
        ) || "";

    const textarea =
        $("sessionNotes");

    if (textarea) {

        textarea.value =
            notes;

        textarea.addEventListener(
            "input",
            saveNotes
        );

    }

}


function saveNotes() {

    const textarea =
        $("sessionNotes");

    if (!textarea) {
        return;
    }


    localStorage.setItem(
        getNotesKey(),
        textarea.value
    );


    const status =
        $("notesStatus");

    if (status) {

        status.textContent =
            "Saved just now";

        clearTimeout(
            saveNotes.timeout
        );

        saveNotes.timeout =
            setTimeout(
                () => {
                    status.textContent =
                        "Saved locally";
                },
                1500
            );

    }

}


/* =========================================================
   SHARED TIMER
========================================================= */

function initializeTimer() {

    const storedSelected =
        Number(
            localStorage.getItem(
                SESSION_KEYS.TIMER_SELECTED
            )
        );


    if (
        Number.isFinite(storedSelected) &&
        storedSelected > 0
    ) {

        selectedTimerSeconds =
            storedSelected;

    } else {

        selectedTimerSeconds =
            25 * 60;

        localStorage.setItem(
            SESSION_KEYS.TIMER_SELECTED,
            String(
                selectedTimerSeconds
            )
        );

    }


    const running =
        localStorage.getItem(
            SESSION_KEYS.TIMER_RUNNING
        ) === "true";


    const endTime =
        Number(
            localStorage.getItem(
                SESSION_KEYS.TIMER_END
            )
        );


    if (
        running &&
        Number.isFinite(endTime) &&
        endTime > Date.now()
    ) {

        startTimerLoop();

    } else if (running) {

        finishSharedTimer();

    } else {

        const storedSeconds =
            Number(
                localStorage.getItem(
                    SESSION_KEYS.TIMER_SECONDS
                )
            );


        updateTimerDisplay(
            Number.isFinite(storedSeconds) &&
            storedSeconds > 0
                ? storedSeconds
                : selectedTimerSeconds
        );

    }


    window.addEventListener(
        "storage",
        handleTimerStorage
    );


    window.addEventListener(
        "studyMindTimerChanged",
        handleTimerEvent
    );

}


/* =========================================================
   TIMER CONTROLS
========================================================= */

function setupTimerControls() {

    document
        .querySelectorAll(
            ".timer-preset"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const minutes =
                        Number(
                            button.dataset.minutes
                        );

                    if (
                        !Number.isFinite(minutes)
                    ) {
                        return;
                    }

                    selectedTimerSeconds =
                        minutes * 60;


                    localStorage.setItem(
                        SESSION_KEYS.TIMER_SELECTED,
                        String(
                            selectedTimerSeconds
                        )
                    );


                    document
                        .querySelectorAll(
                            ".timer-preset"
                        )
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );

                    button.classList.add(
                        "active"
                    );


                    const running =
                        localStorage.getItem(
                            SESSION_KEYS.TIMER_RUNNING
                        ) === "true";


                    if (!running) {

                        localStorage.setItem(
                            SESSION_KEYS.TIMER_SECONDS,
                            String(
                                selectedTimerSeconds
                            )
                        );

                        updateTimerDisplay(
                            selectedTimerSeconds
                        );

                    }

                }
            );

        });


    $("timerStart")
        ?.addEventListener(
            "click",
            toggleTimer
        );


    $("timerReset")
        ?.addEventListener(
            "click",
            resetTimer
        );

}


/* =========================================================
   TOGGLE TIMER
========================================================= */

function toggleTimer() {

    const running =
        localStorage.getItem(
            SESSION_KEYS.TIMER_RUNNING
        ) === "true";


    if (running) {

        pauseSharedTimer();

    } else {

        startSharedTimer();

    }

}


/* =========================================================
   START SHARED TIMER
========================================================= */

function startSharedTimer() {

    let seconds =
        Number(
            localStorage.getItem(
                SESSION_KEYS.TIMER_SECONDS
            )
        );


    if (
        !Number.isFinite(seconds) ||
        seconds <= 0
    ) {

        seconds =
            selectedTimerSeconds;

    }


    const endTime =
        Date.now() +
        seconds * 1000;


    localStorage.setItem(
        SESSION_KEYS.TIMER_SECONDS,
        String(seconds)
    );

    localStorage.setItem(
        SESSION_KEYS.TIMER_END,
        String(endTime)
    );

    localStorage.setItem(
        SESSION_KEYS.TIMER_RUNNING,
        "true"
    );


    notifyTimerChanged();

    startTimerLoop();

}


/* =========================================================
   PAUSE
========================================================= */

function pauseSharedTimer() {

    const endTime =
        Number(
            localStorage.getItem(
                SESSION_KEYS.TIMER_END
            )
        );


    let remaining =
        Number(
            localStorage.getItem(
                SESSION_KEYS.TIMER_SECONDS
            )
        );


    if (
        Number.isFinite(endTime)
    ) {

        remaining =
            Math.max(
                0,
                Math.ceil(
                    (endTime - Date.now()) /
                    1000
                )
            );

    }


    localStorage.setItem(
        SESSION_KEYS.TIMER_SECONDS,
        String(
            remaining
        )
    );

    localStorage.setItem(
        SESSION_KEYS.TIMER_RUNNING,
        "false"
    );

    localStorage.removeItem(
        SESSION_KEYS.TIMER_END
    );


    stopTimerLoop();

    updateTimerDisplay(
        remaining
    );

    notifyTimerChanged();

}


/* =========================================================
   RESET
========================================================= */

function resetTimer() {

    stopTimerLoop();


    localStorage.setItem(
        SESSION_KEYS.TIMER_SECONDS,
        String(
            selectedTimerSeconds
        )
    );

    localStorage.setItem(
        SESSION_KEYS.TIMER_SELECTED,
        String(
            selectedTimerSeconds
        )
    );

    localStorage.setItem(
        SESSION_KEYS.TIMER_RUNNING,
        "false"
    );

    localStorage.removeItem(
        SESSION_KEYS.TIMER_END
    );


    updateTimerDisplay(
        selectedTimerSeconds
    );

    notifyTimerChanged();

}


/* =========================================================
   TIMER LOOP
========================================================= */

function startTimerLoop() {

    stopTimerLoop();

    updateTimerButtons();


    timerInterval =
        setInterval(
            updateSharedTimer,
            250
        );

    updateSharedTimer();

}


function stopTimerLoop() {

    if (timerInterval) {

        clearInterval(
            timerInterval
        );

        timerInterval = null;

    }

}


/* =========================================================
   UPDATE TIMER
========================================================= */

function updateSharedTimer() {

    const running =
        localStorage.getItem(
            SESSION_KEYS.TIMER_RUNNING
        ) === "true";


    if (!running) {

        stopTimerLoop();

        updateTimerButtons();

        return;

    }


    const endTime =
        Number(
            localStorage.getItem(
                SESSION_KEYS.TIMER_END
            )
        );


    if (!Number.isFinite(endTime)) {

        pauseSharedTimer();

        return;

    }


    const remaining =
        Math.max(
            0,
            Math.ceil(
                (endTime - Date.now()) /
                1000
            )
        );


    localStorage.setItem(
        SESSION_KEYS.TIMER_SECONDS,
        String(
            remaining
        )
    );


    updateTimerDisplay(
        remaining
    );


    updateTimerButtons();


    if (remaining <= 0) {

        finishSharedTimer();

    }

}


/* =========================================================
   FINISH
========================================================= */

function finishSharedTimer() {

    stopTimerLoop();


    localStorage.setItem(
        SESSION_KEYS.TIMER_SECONDS,
        "0"
    );

    localStorage.setItem(
        SESSION_KEYS.TIMER_RUNNING,
        "false"
    );

    localStorage.removeItem(
        SESSION_KEYS.TIMER_END
    );


    updateTimerDisplay(0);

    updateTimerButtons();

    notifyTimerChanged();


    const state =
        $("timerState");

    if (state) {

        state.textContent =
            "Focus session complete 🎉";

    }

}


/* =========================================================
   DISPLAY TIMER
========================================================= */

function updateTimerDisplay(seconds) {

    seconds =
        Math.max(
            0,
            Number(seconds) || 0
        );


    const minutes =
        Math.floor(
            seconds / 60
        );

    const secs =
        seconds % 60;


    const display =
        $("timerDisplay");

    if (display) {

        display.textContent =
            `${String(minutes).padStart(2,"0")}:${String(secs).padStart(2,"0")}`;

    }


    const running =
        localStorage.getItem(
            SESSION_KEYS.TIMER_RUNNING
        ) === "true";


    const state =
        $("timerState");

    if (state) {

        if (running) {

            state.textContent =
                "Stay focused — you're in the zone.";

        } else if (seconds === 0) {

            state.textContent =
                "Focus session complete 🎉";

        } else {

            state.textContent =
                "Ready to begin";

        }

    }

}


/* =========================================================
   BUTTON STATE
========================================================= */

function updateTimerButtons() {

    const button =
        $("timerStart");

    if (!button) {
        return;
    }


    const running =
        localStorage.getItem(
            SESSION_KEYS.TIMER_RUNNING
        ) === "true";


    button.textContent =
        running
            ? "Ⅱ Pause"
            : "▶ Start";

}


/* =========================================================
   CROSS-PAGE TIMER EVENTS
========================================================= */

function notifyTimerChanged() {

    window.dispatchEvent(
        new CustomEvent(
            "studyMindTimerChanged"
        )
    );

}


function handleTimerStorage(event) {

    if (
        event.key ===
            SESSION_KEYS.TIMER_SECONDS ||
        event.key ===
            SESSION_KEYS.TIMER_END ||
        event.key ===
            SESSION_KEYS.TIMER_RUNNING ||
        event.key ===
            SESSION_KEYS.TIMER_SELECTED
    ) {

        refreshTimerFromStorage();

    }

}


function handleTimerEvent() {

    refreshTimerFromStorage();

}


function refreshTimerFromStorage() {

    const running =
        localStorage.getItem(
            SESSION_KEYS.TIMER_RUNNING
        ) === "true";


    const seconds =
        Number(
            localStorage.getItem(
                SESSION_KEYS.TIMER_SECONDS
            )
        );


    if (running) {

        startTimerLoop();

    } else {

        stopTimerLoop();

        updateTimerDisplay(
            Number.isFinite(seconds)
                ? seconds
                : selectedTimerSeconds
        );

        updateTimerButtons();

    }

}


/* =========================================================
   CHECKLIST
========================================================= */

function setupChecklist() {

    const checks =
        document.querySelectorAll(
            ".checklist input"
        );


    checks.forEach(
        checkbox => {

            const key =
                `studyMindSessionCheck_${checkbox.id}`;


            checkbox.checked =
                localStorage.getItem(key) === "true";


            checkbox.addEventListener(
                "change",
                () => {

                    localStorage.setItem(
                        key,
                        checkbox.checked
                            ? "true"
                            : "false"
                    );

                }
            );

        }
    );

}


/* =========================================================
   BUTTONS
========================================================= */

function setupButtons() {

    $("knowledgeCheckButton")
        ?.addEventListener(
            "click",
            startKnowledgeCheck
        );


    $("completeSessionButton")
        ?.addEventListener(
            "click",
            completeSession
        );


    $("logoutButton")
        ?.addEventListener(
            "click",
            logout
        );

}


/* =========================================================
   KNOWLEDGE CHECK
========================================================= */

function startKnowledgeCheck() {

    if (!currentTopic) {
        return;
    }


    localStorage.setItem(
        "studyMindKnowledgeCheckTopic",
        JSON.stringify(
            currentTopic
        )
    );


    localStorage.setItem(
        "studyMindCurrentTopicIndex",
        String(
            getCurrentTopicIndex()
        )
    );


    window.location.href =
        "knowledge-check.html";

}


/* =========================================================
   CURRENT INDEX
========================================================= */

function getCurrentTopicIndex() {

    const topics =
        getAllTopics();


    if (!currentTopic) {
        return 0;
    }


    const index =
        topics.findIndex(
            topic =>
                topic.name ===
                currentTopic.name &&
                topic.subject ===
                currentTopic.subject
        );


    return index >= 0
        ? index
        : 0;

}

/* =========================================================
   COMPLETE SESSION
========================================================= */

function completeSession() {

    if (!currentTopic) {
        return;
    }

    const key =
        currentTopic.name;

    let completed =
        safeJSON(
            SESSION_KEYS.DONE,
            []
        );

    if (!Array.isArray(completed)) {
        completed = [];
    }

    /* -----------------------------------------------------
       SAVE COMPLETED TOPIC
    ----------------------------------------------------- */

    if (!completed.includes(key)) {
        completed.push(key);
    }

    saveJSON(
        SESSION_KEYS.DONE,
        completed
    );


    /* -----------------------------------------------------
       SAVE QUESTION-CHECK COMPLETION
    ----------------------------------------------------- */

    const questionDone =
        $("questionCheck")?.checked;

    if (questionDone) {

        let qCompleted =
            safeJSON(
                SESSION_KEYS.QUESTION_DONE,
                []
            );

        if (!Array.isArray(qCompleted)) {
            qCompleted = [];
        }

        if (!qCompleted.includes(key)) {
            qCompleted.push(key);
        }

        saveJSON(
            SESSION_KEYS.QUESTION_DONE,
            qCompleted
        );
    }


    /* -----------------------------------------------------
       ⭐ RECORD REAL STUDY ACTIVITY
       
       This is what changes the streak.
       
       Opening the dashboard/session does NOT do this.
       Only clicking "Complete Session" does.
    ----------------------------------------------------- */

    if (
        window.StudyMindStreak &&
        typeof window.StudyMindStreak.recordStudyActivity ===
            "function"
    ) {

        window.StudyMindStreak.recordStudyActivity();

    } else {

        /*
         * Fallback in case the streak script is not loaded
         * on this page.
         *
         * This writes today's activity directly.
         */

        try {

            const activity =
                safeJSON(
                    "studyMindStreakActivity",
                    {}
                );

            if (
                activity &&
                typeof activity === "object" &&
                !Array.isArray(activity)
            ) {

                const now =
                    new Date();

                const year =
                    now.getFullYear();

                const month =
                    String(
                        now.getMonth() + 1
                    ).padStart(2, "0");

                const day =
                    String(
                        now.getDate()
                    ).padStart(2, "0");

                const today =
                    `${year}-${month}-${day}`;

                activity[today] = true;

                saveJSON(
                    "studyMindStreakActivity",
                    activity
                );

            }

        } catch (error) {

            console.warn(
                "Could not record study streak:",
                error
            );

        }

    }


    /* -----------------------------------------------------
       COMPLETE
    ----------------------------------------------------- */

    updateSessionStatus(
        "Session completed ✓"
    );


    setTimeout(
        () => {

            window.location.href =
                "dashboard.html";

        },
        800
    );

}

/* =========================================================
   STATUS
========================================================= */

function updateSessionStatus(message) {

    const status =
        $("sessionStatus");

    if (status) {

        status.textContent =
            message;

    }

}


/* =========================================================
   USER
========================================================= */

async function loadUser() {

    let name =
        localStorage.getItem(
            SESSION_KEYS.USERNAME
        );


    try {

        if (
            window.supabaseClient &&
            typeof window.supabaseClient.auth
                ?.getUser === "function"
        ) {

            const {
                data
            } =
                await window.supabaseClient.auth.getUser();


            const user =
                data?.user;


            if (user) {

                name =
                    firstValue(
                        user.user_metadata?.full_name,
                        user.user_metadata?.name,
                        user.user_metadata?.username,
                        user.email?.split("@")[0],
                        name,
                        "Student"
                    );

            }

        }

    } catch (error) {

        console.warn(
            "Could not load user:",
            error
        );

    }


    name =
        name || "Student";


    localStorage.setItem(
        SESSION_KEYS.USERNAME,
        name
    );


    $("usernameDisplay").textContent =
        name;


    $("userAvatar").textContent =
        name.charAt(0).toUpperCase();

}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

    try {

        if (
            window.supabaseClient &&
            typeof window.supabaseClient.auth
                ?.signOut === "function"
        ) {

            await window.supabaseClient.auth.signOut();

        }

    } catch (error) {

        console.warn(
            "Logout error:",
            error
        );

    }


    window.location.href =
        "home.html";

}
