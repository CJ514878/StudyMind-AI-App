/* =========================================================
   STUDYMIND AI — STUDY SESSION
   COMPLETE SHARED-TIMER VERSION

   Architecture:

   Dashboard Timer
          ↕
   Study Timer
          ↕
   Study Session
          ↓
   window.StudyMindTimer
          ↓
   ONE shared timer
          ↓
   ONE completion event
          ↓
   streak activity
          ↓
   existing streak engine
          ↓
   Milo celebration
          ↓
   streak popup

   IMPORTANT:
   "Complete Session" remains completely separate.
   It still controls topic completion and knowledge-check flow.

   IMPORTANT:
   This file DOES NOT create its own timer engine.
   The authoritative timer is study-timer.js.
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

    /* Shared timer keys are kept here only for
       reading/displaying the authoritative timer. */

    TIMER_SECONDS:
        "studyMindTimerSeconds",

    TIMER_END:
        "studyMindTimerEndTime",

    TIMER_RUNNING:
        "studyMindTimerRunning",

    TIMER_SELECTED:
        "studyMindSelectedTimerSeconds",

    TIMER_COMPLETED_AT:
        "studyMindLastTimerCompletedAt",

    TIMER_CELEBRATED_AT:
        "studyMindLastTimerCelebratedAt"

};


/* =========================================================
   STATE
   ========================================================= */

let studyPlan = null;

let currentTopic = null;

let selectedTimerSeconds = 25 * 60;


/*
 * Prevent duplicate DOM event listeners.
 */
let timerBridgeInitialized = false;

let timerPresetListenersInitialized = false;


/* =========================================================
   HELPERS
   ========================================================= */

function $(id) {

    return document.getElementById(id);

}


function safeJSON(
    key,
    fallback = null
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

                            result.push(
                                normalized
                            );

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
                    normalizeTopic(
                        topic
                    );


                if (normalized) {

                    result.push(
                        normalized
                    );

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


    if (
        typeof topic === "string"
    ) {

        return {

            name:
                topic,

            subject:
                fallbackSubject ||
                "Study Topic"

        };

    }


    if (
        typeof topic === "object"
    ) {

        return {

            name:
                firstValue(
                    topic.name,
                    topic.title,
                    topic.topic
                ) ||
                "Study Topic",

            subject:
                firstValue(
                    topic.subject,
                    topic.subjectName
                ) ||
                fallbackSubject ||
                "Study Topic",

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

function firstValue(
    ...values
) {

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


    if ($("infoSubject")) {

        $("infoSubject").textContent =
            currentTopic.subject || "—";

    }


    if ($("infoTopic")) {

        $("infoTopic").textContent =
            currentTopic.name || "—";

    }


    const exam =
        firstValue(
            studyPlan?.examType,
            studyPlan?.exam,
            studyPlan?.examName,
            studyPlan?.testType
        );


    if ($("infoExam")) {

        $("infoExam").textContent =
            exam || "—";

    }


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


    if ($("topicNumber")) {

        $("topicNumber").textContent =
            String(
                safeIndex + 1
            );

    }


    const percent =
        topics.length
            ? Math.round(
                (
                    (safeIndex + 1) /
                    topics.length
                ) * 100
            )
            : 0;


    if ($("progressPercent")) {

        $("progressPercent").textContent =
            `${percent}%`;

    }


    if ($("topicProgress")) {

        $("topicProgress").style.width =
            `${percent}%`;

    }

}


/* =========================================================
   NOTES
   ========================================================= */

function getNotesKey() {

    if (!currentTopic) {

        return SESSION_KEYS.NOTES;

    }


    return (
        `${SESSION_KEYS.NOTES}_${currentTopic.subject}_${currentTopic.name}`
    );

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
   SHARED TIMER BRIDGE
   =========================================================

   IMPORTANT:

   There is NO timer loop here.

   There is NO finishSharedTimer() here.

   There is NO second streak celebration here.

   StudyMindTimer owns all of that.

   This page only:
   - displays the shared timer
   - starts/pauses/resets the shared timer
   - reacts to shared timer changes
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


    /*
     * If the authoritative timer engine has already loaded,
     * initialize it and immediately render its state.
     */

    connectToSharedTimer();


    /*
     * Cross-page synchronization.

     * "storage" catches changes from other browser tabs/pages.
     * "studyMindTimerChanged" catches same-page changes.
     * "studyMindTimerCompleted" catches the ONE completion event.
     */

    window.addEventListener(
        "storage",
        handleTimerStorage
    );


    window.addEventListener(
        "studyMindTimerChanged",
        refreshTimerFromSharedEngine
    );


    window.addEventListener(
        "studyMindTimerCompleted",
        refreshTimerFromSharedEngine
    );


    window.addEventListener(
        "studyMindStreakUpdated",
        refreshTimerFromSharedEngine
    );

}


/* =========================================================
   CONNECT TO AUTHORITATIVE TIMER
   ========================================================= */

function connectToSharedTimer() {

    if (
        timerBridgeInitialized
    ) {

        refreshTimerFromSharedEngine();

        return true;

    }


    if (
        !window.StudyMindTimer
    ) {

        /*
         * study-timer.js may appear after this script.
         * Give it a moment to initialize instead of creating
         * another timer engine.
         */

        setTimeout(
            connectToSharedTimer,
            100
        );

        return false;

    }


    timerBridgeInitialized =
        true;


    /*
     * Let the authoritative engine initialize itself.
     */

    if (
        typeof window.StudyMindTimer.initialize ===
            "function"
    ) {

        try {

            window.StudyMindTimer.initialize();

        } catch (error) {

            console.warn(
                "StudyMindTimer initialization warning:",
                error
            );

        }

    }


    refreshTimerFromSharedEngine();


    return true;

}


/* =========================================================
   TIMER CONTROLS
   ========================================================= */

function setupTimerControls() {

    setupTimerPresets();


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
   TIMER PRESETS
   ========================================================= */

function setupTimerPresets() {

    if (
        timerPresetListenersInitialized
    ) {

        return;

    }


    timerPresetListenersInitialized =
        true;


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
                            !Number.isFinite(
                                minutes
                            ) ||
                            minutes <= 0
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


                        /*
                         * Never alter the remaining time of
                         * a running session.
                         */

                        if (!running) {

                            localStorage.setItem(
                                SESSION_KEYS.TIMER_SECONDS,
                                String(
                                    selectedTimerSeconds
                                )
                            );


                            localStorage.removeItem(
                                SESSION_KEYS.TIMER_END
                            );


                            refreshTimerFromSharedEngine();

                        }

                    }
                );

            }
        );


    /*
     * Restore active preset.
     */

    const selectedMinutes =
        Math.round(
            selectedTimerSeconds / 60
        );


    document
        .querySelectorAll(
            ".timer-preset"
        )
        .forEach(
            button => {

                const minutes =
                    Number(
                        button.dataset.minutes
                    );


                if (
                    minutes ===
                    selectedMinutes
                ) {

                    button.classList.add(
                        "active"
                    );

                }

            }
        );

}


/* =========================================================
   TOGGLE TIMER
   ========================================================= */

function toggleTimer() {

    connectToSharedTimer();


    const timer =
        window.StudyMindTimer;


    if (!timer) {

        console.warn(
            "StudyMindTimer is not loaded."
        );

        return;

    }


    let running =
        localStorage.getItem(
            SESSION_KEYS.TIMER_RUNNING
        ) === "true";


    /*
     * Prefer the authoritative engine state when available.
     */

    if (
        typeof timer.getState ===
            "function"
    ) {

        try {

            const state =
                timer.getState();


            if (
                state &&
                typeof state.running ===
                    "boolean"
            ) {

                running =
                    state.running;

            }

        } catch {}

    }


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

    connectToSharedTimer();


    const timer =
        window.StudyMindTimer;


    if (
        !timer ||
        typeof timer.start !==
            "function"
    ) {

        console.warn(
            "StudyMindTimer.start() is unavailable."
        );

        return;

    }


    try {

        /*
         * The authoritative timer decides whether this is
         * a resumed timer or a new timer.
         */

        timer.start();

    } catch (error) {

        console.warn(
            "Could not start shared timer:",
            error
        );

    }


    refreshTimerFromSharedEngine();

}


/* =========================================================
   PAUSE SHARED TIMER
   ========================================================= */

function pauseSharedTimer() {

    const timer =
        window.StudyMindTimer;


    if (
        !timer ||
        typeof timer.pause !==
            "function"
    ) {

        return;

    }


    try {

        timer.pause();

    } catch (error) {

        console.warn(
            "Could not pause shared timer:",
            error
        );

    }


    refreshTimerFromSharedEngine();

}


/* =========================================================
   RESET SHARED TIMER
   ========================================================= */

function resetTimer() {

    const timer =
        window.StudyMindTimer;


    if (
        !timer ||
        typeof timer.reset !==
            "function"
    ) {

        /*
         * Small fallback for display state only.
         * This does NOT create another timer engine.
         */

        localStorage.setItem(
            SESSION_KEYS.TIMER_SECONDS,
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


        refreshTimerFromSharedEngine();

        return;

    }


    try {

        timer.reset();

    } catch (error) {

        console.warn(
            "Could not reset shared timer:",
            error
        );

    }


    refreshTimerFromSharedEngine();

}


/* =========================================================
   REFRESH FROM AUTHORITATIVE TIMER
   ========================================================= */

function refreshTimerFromSharedEngine() {

    let seconds =
        Number(
            localStorage.getItem(
                SESSION_KEYS.TIMER_SECONDS
            )
        );


    let running =
        localStorage.getItem(
            SESSION_KEYS.TIMER_RUNNING
        ) === "true";


    const timer =
        window.StudyMindTimer;


    /*
     * If the authoritative engine exposes getState(),
     * use it as the source of truth.
     */

    if (
        timer &&
        typeof timer.getState ===
            "function"
    ) {

        try {

            const state =
                timer.getState();


            if (state) {

                if (
                    Number.isFinite(
                        Number(
                            state.seconds
                        )
                    )
                ) {

                    seconds =
                        Number(
                            state.seconds
                        );

                }


                if (
                    typeof state.running ===
                        "boolean"
                ) {

                    running =
                        state.running;

                }

            }

        } catch (error) {

            console.warn(
                "Could not read StudyMindTimer state:",
                error
            );

        }

    }


    if (
        !Number.isFinite(seconds) ||
        seconds < 0
    ) {

        seconds =
            selectedTimerSeconds;

    }


    updateTimerDisplay(
        seconds,
        running
    );


    updateTimerButtons(
        running
    );


    /*
     * If the selected duration changed elsewhere,
     * mirror it here.
     */

    const selected =
        Number(
            localStorage.getItem(
                SESSION_KEYS.TIMER_SELECTED
            )
        );


    if (
        Number.isFinite(selected) &&
        selected > 0
    ) {

        selectedTimerSeconds =
            selected;

    }


    updateActivePreset();

}


/* =========================================================
   STORAGE SYNC
   ========================================================= */

function handleTimerStorage(
    event
) {

    if (
        !event
    ) {

        return;

    }


    const relevantKeys = [

        SESSION_KEYS.TIMER_SECONDS,

        SESSION_KEYS.TIMER_END,

        SESSION_KEYS.TIMER_RUNNING,

        SESSION_KEYS.TIMER_SELECTED,

        SESSION_KEYS.TIMER_COMPLETED_AT,

        SESSION_KEYS.TIMER_CELEBRATED_AT

    ];


    if (
        relevantKeys.includes(
            event.key
        )
    ) {

        refreshTimerFromSharedEngine();

    }

}


/* =========================================================
   TIMER DISPLAY
   ========================================================= */

function updateTimerDisplay(
    seconds,
    running = null
) {

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
            `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

    }


    if (
        running === null
    ) {

        running =
            localStorage.getItem(
                SESSION_KEYS.TIMER_RUNNING
            ) === "true";

    }


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

function updateTimerButtons(
    running = null
) {

    const button =
        $("timerStart");


    if (!button) {

        return;

    }


    if (
        running === null
    ) {

        running =
            localStorage.getItem(
                SESSION_KEYS.TIMER_RUNNING
            ) === "true";

    }


    button.textContent =
        running
            ? "Ⅱ Pause"
            : "▶ Start";

}


/* =========================================================
   ACTIVE PRESET
   ========================================================= */

function updateActivePreset() {

    const selected =
        Number(
            localStorage.getItem(
                SESSION_KEYS.TIMER_SELECTED
            )
        );


    if (
        !Number.isFinite(selected) ||
        selected <= 0
    ) {

        return;

    }


    document
        .querySelectorAll(
            ".timer-preset"
        )
        .forEach(
            button => {

                const minutes =
                    Number(
                        button.dataset.minutes
                    );


                button.classList.toggle(
                    "active",
                    minutes * 60 === selected
                );

            }
        );

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
                localStorage.getItem(
                    key
                ) === "true";


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


    /*
     * IMPORTANT:
     * This remains completely separate from timer completion.
     */

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
   =========================================================

   IMPORTANT:

   This is NOT timer completion.

   The student explicitly clicking
   "Complete Session" still records the topic.

   Knowledge-check flow remains untouched.
   ========================================================= */

function completeSession() {

    if (!currentTopic) {

        return;

    }


    const topicKey =
        `${currentTopic.subject}::${currentTopic.name}`;


    /* -----------------------------------------------------
       LOAD COMPLETED TOPICS
    ----------------------------------------------------- */

    let completed =
        safeJSON(
            SESSION_KEYS.DONE,
            []
        );


    if (!Array.isArray(completed)) {

        completed = [];

    }


    /*
     * Use subject + topic rather than topic name alone.
     */

    if (!completed.includes(topicKey)) {

        completed.push(topicKey);

    }


    saveJSON(
        SESSION_KEYS.DONE,
        completed
    );


    /* -----------------------------------------------------
       QUESTION-CHECK COMPLETION
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


        if (!qCompleted.includes(topicKey)) {

            qCompleted.push(topicKey);

        }


        saveJSON(
            SESSION_KEYS.QUESTION_DONE,
            qCompleted
        );

    }


    /* -----------------------------------------------------
       CHECK ENTIRE PLAN
    ----------------------------------------------------- */

    const allTopics =
        getAllTopics();


    const completedSet =
        new Set(
            completed
        );


    const completedCount =
        allTopics.filter(
            topic => {

                const key =
                    `${topic.subject}::${topic.name}`;


                return completedSet.has(
                    key
                );

            }
        ).length;


    const totalTopics =
        allTopics.length;


    const progress =
        totalTopics
            ? Math.round(
                (
                    completedCount /
                    totalTopics
                ) * 100
            )
            : 0;


    console.log(
        "StudyMind completion:",
        {
            completedCount,
            totalTopics,
            progress
        }
    );


    /* -----------------------------------------------------
       FULL PLAN / STUDY DAY COMPLETE
    ----------------------------------------------------- */

    if (
        totalTopics > 0 &&
        completedCount >= totalTopics
    ) {

        completeStudyDay();

    }


    /* -----------------------------------------------------
       SESSION COMPLETE
    ----------------------------------------------------- */

    updateSessionStatus(
        progress >= 100
            ? "All study topics completed! 🎉"
            : `Topic completed ✓ ${progress}% overall progress`
    );


    /*
     * Preserve existing behavior:
     * return to dashboard.
     */

    setTimeout(
        () => {

            window.location.href =
                "dashboard.html";

        },
        800
    );

}


/* =========================================================
   COMPLETE STUDY DAY
   ========================================================= */

function completeStudyDay() {

    const today =
        getLocalDateKey();


    let activity =
        safeJSON(
            "studyMindStreakActivity",
            {}
        );


    if (
        !activity ||
        typeof activity !== "object" ||
        Array.isArray(activity)
    ) {

        activity = {};

    }


    /*
     * Same date remains one streak day.
     */

    activity[today] = true;


    saveJSON(
        "studyMindStreakActivity",
        activity
    );


    /*
     * Existing streak engine.
     */

    if (
        window.StudyMindStreak &&
        typeof window.StudyMindStreak.recordStudyActivity ===
            "function"
    ) {

        try {

            window.StudyMindStreak.recordStudyActivity();

        } catch (error) {

            console.warn(
                "StudyMind streak update error:",
                error
            );

        }

    }


    /*
     * Existing congratulations flag.
     */

    localStorage.setItem(
        "studyMindCompletionCelebrationShown",
        today
    );


    console.log(
        "🎉 Study day completed:",
        today
    );

}


/* =========================================================
   LOCAL DATE KEY
   ========================================================= */

function getLocalDateKey() {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );


    return (
        `${year}-${month}-${day}`
    );

}


/* =========================================================
   STATUS
   ========================================================= */

function updateSessionStatus(
    message
) {

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
                ?.getUser ===
                "function"
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
        name ||
        "Student";


    localStorage.setItem(
        SESSION_KEYS.USERNAME,
        name
    );


    if ($("usernameDisplay")) {

        $("usernameDisplay").textContent =
            name;

    }


    if ($("userAvatar")) {

        $("userAvatar").textContent =
            name
                .charAt(0)
                .toUpperCase();

    }

}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logout() {

    try {

        if (
            window.supabaseClient &&
            typeof window.supabaseClient.auth
                ?.signOut ===
                "function"
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
