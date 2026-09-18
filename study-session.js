/* =========================================================
   STUDYMIND AI — STUDY SESSION
   COMPLETE CORRECTED VERSION

   Architecture:
   Dashboard Timer
        ↕
   Study Timer
        ↕
   Study Session Timer
        ↓
   ONE shared timer reaches 00:00
        ↓
   ONE completion event
        ↓
   streak activity recorded
        ↓
   existing streak engine updated
        ↓
   Milo celebration
        ↓
   streak popup

   IMPORTANT:
   "Complete Session" remains completely separate.
   It still controls topic completion and knowledge-check flow.
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

    /* -----------------------------------------------------
       SHARED TIMER
    ----------------------------------------------------- */

    TIMER_SECONDS:
        "studyMindTimerSeconds",

    TIMER_END:
        "studyMindTimerEndTime",

    TIMER_RUNNING:
        "studyMindTimerRunning",

    TIMER_SELECTED:
        "studyMindSelectedTimerSeconds",

    /* -----------------------------------------------------
       TIMER COMPLETION
    ----------------------------------------------------- */

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

let timerInterval = null;

let selectedTimerSeconds =
    25 * 60;


/*
 * Prevents duplicate completion processing inside
 * this particular page.
 */
let currentTimerCompletionId = null;


/*
 * Prevents duplicate Milo/popup celebration calls.
 */
let streakCelebrationRunning = false;


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

        /*
         * The timer was supposed to be running,
         * but its end time has passed.
         *
         * Treat it as the ONE shared completion.
         */

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
                            )
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

            }
        );


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


    /*
     * Starting a new timer creates a new timer state.
     */

    currentTimerCompletionId =
        null;


    /*
     * Clear the previous completion marker so a newly
     * started timer cannot be mistaken for an old one.
     */

    localStorage.removeItem(
        SESSION_KEYS.TIMER_COMPLETED_AT
    );

    localStorage.removeItem(
        SESSION_KEYS.TIMER_CELEBRATED_AT
    );


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
                    (
                        endTime -
                        Date.now()
                    ) / 1000
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


    currentTimerCompletionId =
        null;


    localStorage.removeItem(
        SESSION_KEYS.TIMER_COMPLETED_AT
    );


    localStorage.removeItem(
        SESSION_KEYS.TIMER_CELEBRATED_AT
    );


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
                (
                    endTime -
                    Date.now()
                ) / 1000
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
   FINISH SHARED TIMER
   ========================================================= */

function finishSharedTimer() {

    /*
     * Stop this page's interval immediately.
     */

    stopTimerLoop();


    /*
     * If another page has already finished the timer,
     * do not create another completion.
     */

    const existingCompletionId =
        localStorage.getItem(
            SESSION_KEYS.TIMER_COMPLETED_AT
        );


    const running =
        localStorage.getItem(
            SESSION_KEYS.TIMER_RUNNING
        ) === "true";


    if (
        !running &&
        existingCompletionId
    ) {

        updateTimerDisplay(0);

        updateTimerButtons();

        return;

    }


    /*
     * The completion ID is the timestamp of the ONE
     * shared completion event.
     */

    const completionId =
        String(
            Date.now()
        );


    currentTimerCompletionId =
        completionId;


    localStorage.setItem(
        SESSION_KEYS.TIMER_COMPLETED_AT,
        completionId
    );


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


    const state =
        $("timerState");


    if (state) {

        state.textContent =
            "Focus session complete 🎉";

    }


    /*
     * Notify the other StudyMind timer pages first.
     */

    notifyTimerChanged();


    /*
     * Then process the ONE completion event.
     */

    celebrateTimerCompletion(
        completionId
    );

}


/* =========================================================
   TIMER COMPLETION → STREAK
   ========================================================= */

function celebrateTimerCompletion(
    completionId
) {

    if (!completionId) {

        return;

    }


    const normalizedCompletionId =
        String(
            completionId
        );


    /*
     * Prevent duplicate processing inside this page.
     */

    if (
        currentTimerCompletionId ===
        normalizedCompletionId &&
        streakCelebrationRunning
    ) {

        return;

    }


    /*
     * Prevent the same completion from being celebrated
     * more than once across pages.
     */

    const alreadyCelebrated =
        localStorage.getItem(
            SESSION_KEYS.TIMER_CELEBRATED_AT
        );


    if (
        alreadyCelebrated ===
        normalizedCompletionId
    ) {

        return;

    }


    /*
     * Lock this completion BEFORE running the celebration.
     */

    localStorage.setItem(
        SESSION_KEYS.TIMER_CELEBRATED_AT,
        normalizedCompletionId
    );


    currentTimerCompletionId =
        normalizedCompletionId;


    streakCelebrationRunning =
        true;


    /* -----------------------------------------------------
       RECORD TODAY'S STUDY ACTIVITY
    ----------------------------------------------------- */

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
     * Multiple sessions on the same day remain one
     * streak day.
     */

    activity[today] = true;


    saveJSON(
        "studyMindStreakActivity",
        activity
    );


    /* -----------------------------------------------------
       UPDATE EXISTING STUDYMIND STREAK ENGINE
    ----------------------------------------------------- */

    if (
        window.StudyMindStreak &&
        typeof window.StudyMindStreak.recordStudyActivity ===
            "function"
    ) {

        try {

            window.StudyMindStreak.recordStudyActivity();

        } catch (error) {

            console.warn(
                "StudyMind streak update failed:",
                error
            );

        }

    }


    /* -----------------------------------------------------
       CALCULATE CURRENT STREAK
    ----------------------------------------------------- */

    const streak =
        calculateTimerStreak(
            activity,
            today
        );


    /* -----------------------------------------------------
       MILO CELEBRATION
    ----------------------------------------------------- */

    triggerMiloTimerCelebration(
        streak
    );


    /* -----------------------------------------------------
       STREAK POPUP
    ----------------------------------------------------- */

    showTimerStreakPopup(
        streak
    );


    /* -----------------------------------------------------
       NOTIFY THE REST OF THE APP
    ----------------------------------------------------- */

    window.dispatchEvent(
        new CustomEvent(
            "studyMindStreakUpdated",
            {
                detail: {

                    streak:
                        streak,

                    date:
                        today,

                    source:
                        "study-session-timer"

                }
            }
        )
    );


    console.log(
        "🔥 StudyMind timer completion recorded:",
        {
            completionId:
                normalizedCompletionId,

            streak:
                streak,

            date:
                today
        }
    );


    /*
     * Allow another future timer completion to celebrate.
     *
     * We intentionally do NOT clear TIMER_CELEBRATED_AT.
     * That value belongs to the completed timer and prevents
     * other pages from replaying it.
     */

    setTimeout(
        () => {

            streakCelebrationRunning =
                false;

        },
        3000
    );

}


/* =========================================================
   MILO TIMER CELEBRATION
   ========================================================= */

function triggerMiloTimerCelebration(
    streak
) {

    if (!window.Milo) {

        return;

    }


    try {

        /*
         * Preferred current Milo API.
         *
         * This is responsible for:
         * - celebration sound
         * - Milo dancing
         * - celebration animation
         */

        if (
            typeof window.Milo
                .miloStudySessionComplete ===
                "function"
        ) {

            window.Milo.miloStudySessionComplete(
                streak
            );

            return;

        }


        /*
         * Compatibility fallback for older Milo versions.
         */

        if (
            typeof window.Milo.playSound ===
                "function"
        ) {

            window.Milo.playSound(
                "woohoo"
            );

        }


        if (
            typeof window.Milo.show ===
                "function"
        ) {

            window.Milo.show(
                `🔥 ${streak}-day streak!`,
                "celebrate"
            );

        }

    } catch (error) {

        console.warn(
            "Milo celebration failed:",
            error
        );

    }

}


/* =========================================================
   CALCULATE TIMER STREAK
   ========================================================= */

function calculateTimerStreak(
    activity,
    today
) {

    if (
        !activity ||
        typeof activity !== "object"
    ) {

        return 1;

    }


    let streak = 0;


    const cursor =
        new Date(
            `${today}T12:00:00`
        );


    /*
     * Walk backwards from today until the first
     * missing activity date.
     */

    for (
        let i = 0;
        i < 10000;
        i++
    ) {

        const year =
            cursor.getFullYear();


        const month =
            String(
                cursor.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        const day =
            String(
                cursor.getDate()
            ).padStart(
                2,
                "0"
            );


        const key =
            `${year}-${month}-${day}`;


        if (!activity[key]) {

            break;

        }


        streak++;


        cursor.setDate(
            cursor.getDate() - 1
        );

    }


    return Math.max(
        1,
        streak
    );

}


/* =========================================================
   TIMER STREAK POPUP
   ========================================================= */

function showTimerStreakPopup(
    streak
) {

    /*
     * Remove any previous timer-streak popup.
     */

    document
        .querySelectorAll(
            ".milo-timer-streak-popup"
        )
        .forEach(
            popup =>
                popup.remove()
        );


    const popup =
        document.createElement(
            "div"
        );


    popup.className =
        "milo-timer-streak-popup";


    popup.innerHTML = `

        <div class="milo-timer-streak-card">

            <div class="milo-timer-streak-fire">
                🔥
            </div>

            <div class="milo-timer-streak-small">
                STUDY SESSION COMPLETE
            </div>

            <div class="milo-timer-streak-title">
                ${streak}-Day Streak!
            </div>

            <div class="milo-timer-streak-message">
                ${getTimerStreakMessage(streak)}
            </div>

            <div class="milo-timer-streak-dots">

                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>

            </div>

            <button
                type="button"
                class="milo-timer-streak-button"
            >
                Keep Going 🚀
            </button>

        </div>

    `;


    document.body.appendChild(
        popup
    );


    installTimerStreakStyles();


    requestAnimationFrame(
        () => {

            requestAnimationFrame(
                () => {

                    popup.classList.add(
                        "show"
                    );

                }
            );

        }
    );


    const button =
        popup.querySelector(
            ".milo-timer-streak-button"
        );


    button?.addEventListener(
        "click",
        () => {

            closeTimerStreakPopup(
                popup
            );

        }
    );


    setTimeout(
        () => {

            closeTimerStreakPopup(
                popup
            );

        },
        6500
    );

}


/* =========================================================
   STREAK MESSAGE
   ========================================================= */

function getTimerStreakMessage(
    streak
) {

    if (streak <= 1) {

        return (
            "Your study streak has started! " +
            "Come back tomorrow and keep it alive."
        );

    }


    if (streak < 5) {

        return (
            "You're building momentum. " +
            "Keep showing up!"
        );

    }


    if (streak < 10) {

        return (
            "You're on fire! " +
            "Your consistency is paying off."
        );

    }


    if (streak < 30) {

        return (
            "Amazing consistency! " +
            "Milo is seriously impressed."
        );

    }


    return (
        "Legendary consistency! " +
        "Keep that streak alive!"
    );

}


/* =========================================================
   CLOSE STREAK POPUP
   ========================================================= */

function closeTimerStreakPopup(
    popup
) {

    if (!popup) {

        return;

    }


    popup.classList.remove(
        "show"
    );


    setTimeout(
        () => {

            popup.remove();

        },
        350
    );

}


/* =========================================================
   STREAK POPUP STYLES
   ========================================================= */

function installTimerStreakStyles() {

    if (
        document.getElementById(
            "miloTimerStreakStyles"
        )
    ) {

        return;

    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "miloTimerStreakStyles";


    style.textContent = `

        .milo-timer-streak-popup {

            position: fixed;

            inset: 0;

            z-index: 999999;

            display: flex;

            align-items: center;

            justify-content: center;

            padding: 20px;

            background:
                rgba(8, 12, 25, .62);

            backdrop-filter:
                blur(9px);

            opacity: 0;

            pointer-events: none;

            transition:
                opacity .3s ease;

        }


        .milo-timer-streak-popup.show {

            opacity: 1;

            pointer-events: auto;

        }


        .milo-timer-streak-card {

            width:
                min(440px, 100%);

            padding:
                34px 30px 28px;

            border-radius:
                30px;

            background:
                linear-gradient(
                    145deg,
                    #ffffff,
                    #f6f7ff
                );

            box-shadow:
                0 30px 100px
                rgba(0,0,0,.35);

            text-align:
                center;

            transform:
                translateY(35px)
                scale(.8);

            transition:
                transform
                .5s
                cubic-bezier(
                    .18,
                    1.25,
                    .35,
                    1
                );

            overflow:
                hidden;

            position:
                relative;

        }


        .milo-timer-streak-popup.show
        .milo-timer-streak-card {

            transform:
                translateY(0)
                scale(1);

        }


        .milo-timer-streak-card::before {

            content: "";

            position: absolute;

            width: 260px;

            height: 260px;

            left: 50%;

            top: -180px;

            transform:
                translateX(-50%);

            border-radius:
                50%;

            background:
                radial-gradient(
                    circle,
                    rgba(255,190,40,.28),
                    transparent 70%
                );

        }


        .milo-timer-streak-fire {

            position:
                relative;

            font-size:
                68px;

            line-height:
                1;

            margin-bottom:
                12px;

            animation:
                timerStreakFire
                .65s
                ease-in-out
                infinite
                alternate;

        }


        @keyframes timerStreakFire {

            from {

                transform:
                    scale(1)
                    rotate(-5deg);

            }

            to {

                transform:
                    scale(1.15)
                    rotate(5deg);

            }

        }


        .milo-timer-streak-small {

            position:
                relative;

            font-size:
                11px;

            font-weight:
                800;

            letter-spacing:
                .15em;

            color:
                #777c91;

            margin-bottom:
                7px;

        }


        .milo-timer-streak-title {

            position:
                relative;

            font-size:
                clamp(
                    30px,
                    7vw,
                    42px
                );

            line-height:
                1.05;

            font-weight:
                900;

            color:
                #171a2b;

            margin-bottom:
                12px;

        }


        .milo-timer-streak-message {

            position:
                relative;

            max-width:
                340px;

            margin:
                0 auto 22px;

            font-size:
                15px;

            line-height:
                1.6;

            color:
                #62677b;

        }


        .milo-timer-streak-dots {

            display:
                flex;

            justify-content:
                center;

            gap:
                7px;

            margin-bottom:
                25px;

        }


        .milo-timer-streak-dots span {

            width:
                9px;

            height:
                9px;

            border-radius:
                50%;

            background:
                #ffbd38;

            animation:
                timerStreakDot
                .75s
                ease-in-out
                infinite
                alternate;

        }


        .milo-timer-streak-dots
        span:nth-child(2) {

            animation-delay:
                .1s;

        }


        .milo-timer-streak-dots
        span:nth-child(3) {

            animation-delay:
                .2s;

        }


        .milo-timer-streak-dots
        span:nth-child(4) {

            animation-delay:
                .3s;

        }


        .milo-timer-streak-dots
        span:nth-child(5) {

            animation-delay:
                .4s;

        }


        @keyframes timerStreakDot {

            from {

                transform:
                    translateY(0)
                    scale(.8);

                opacity:
                    .55;

            }


            to {

                transform:
                    translateY(-6px)
                    scale(1.1);

                opacity:
                    1;

            }

        }


        .milo-timer-streak-button {

            position:
                relative;

            border:
                0;

            border-radius:
                14px;

            padding:
                13px 23px;

            font-size:
                14px;

            font-weight:
                800;

            color:
                white;

            background:
                linear-gradient(
                    135deg,
                    #5b5ce2,
                    #7567f5
                );

            cursor:
                pointer;

            box-shadow:
                0 8px 22px
                rgba(
                    91,
                    92,
                    226,
                    .28
                );

            transition:
                transform .2s ease,
                box-shadow .2s ease;

        }


        .milo-timer-streak-button:hover {

            transform:
                translateY(-2px);

            box-shadow:
                0 12px 28px
                rgba(
                    91,
                    92,
                    226,
                    .36
                );

        }


        .milo-timer-streak-button:active {

            transform:
                scale(.97);

        }


        @media (max-width: 520px) {

            .milo-timer-streak-card {

                padding:
                    28px 20px 23px;

                border-radius:
                    25px;

            }


            .milo-timer-streak-fire {

                font-size:
                    56px;

            }

        }

    `;


    document.head.appendChild(
        style
    );

}


/* =========================================================
   DISPLAY TIMER
   ========================================================= */

function updateTimerDisplay(
    seconds
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


function handleTimerStorage(
    event
) {

    if (
        event.key ===
            SESSION_KEYS.TIMER_SECONDS ||

        event.key ===
            SESSION_KEYS.TIMER_END ||

        event.key ===
            SESSION_KEYS.TIMER_RUNNING ||

        event.key ===
            SESSION_KEYS.TIMER_SELECTED ||

        event.key ===
            SESSION_KEYS.TIMER_COMPLETED_AT
    ) {

        refreshTimerFromStorage();

    }

}


function handleTimerEvent() {

    refreshTimerFromStorage();

}


/* =========================================================
   REFRESH TIMER FROM STORAGE
   ========================================================= */

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

        return;

    }


    stopTimerLoop();


    updateTimerDisplay(
        Number.isFinite(seconds)
            ? seconds
            : selectedTimerSeconds
    );


    updateTimerButtons();


    /*
     * If Dashboard or Study Timer finished the shared timer,
     * this page can recognize the exact same completion.
     */

    const completionId =
        localStorage.getItem(
            SESSION_KEYS.TIMER_COMPLETED_AT
        );


    const celebratedId =
        localStorage.getItem(
            SESSION_KEYS.TIMER_CELEBRATED_AT
        );


    if (
        seconds === 0 &&
        completionId &&
        completionId !== celebratedId
    ) {

        const completionTime =
            Number(
                completionId
            );


        /*
         * Only process a recent completion.
         */

        if (
            Number.isFinite(
                completionTime
            ) &&
            Date.now() -
                completionTime <
                10000
        ) {

            celebrateTimerCompletion(
                completionId
            );

        }

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
     * This remains separate from timer completion.
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

   This is NOT the timer completion event.

   The student explicitly clicking Complete Session
   still records the topic as completed.

   The existing knowledge-check flow remains intact.
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
       CHECK WHETHER ENTIRE PLAN IS COMPLETE
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
     * return to dashboard after completing the topic.
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
     * Same date does not increase the streak.
     */

    activity[today] = true;


    saveJSON(
        "studyMindStreakActivity",
        activity
    );


    /*
     * Existing streak system.
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

