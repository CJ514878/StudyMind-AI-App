"use strict";

/* =========================================================
STUDYMIND AI — STUDY SESSION

Shared progress + shared timer architecture

## IMPORTANT

study-timer.js owns:
✓ Timer state
✓ Start
✓ Pause
✓ Reset
✓ Presets
✓ Timer completion
✓ Study-time tracking
✓ Streak activity

study-session.js owns:
✓ Study Session UI
✓ Topic progress
✓ Notes
✓ Checklist
✓ Knowledge Check
✓ Complete Session
✓ Required-time completion popup

Timer completion NEVER automatically completes a topic.
========================================================= */

(function () {


const KEYS = {
    PLAN: "studyMindPlan",
    PLANS: "studyMindPlans",
    ACTIVE_PLAN: "studyMindActivePlanId",

    CURRENT_TOPIC: "studyMindCurrentTopic",
    TOPIC_INDEX: "studyMindCurrentTopicIndex",

    COMPLETED: "studyMindCompletedTopics",
    QUESTION_DONE: "studyMindCompletedQuestionTopics",

    NOTES: "studyMindSessionNotes",

    USERNAME: "studyMindUsername"
};

let plan = null;
let currentTopic = null;
let initialized = false;

let completionPopup = null;
let completionPopupVisible = false;

/* =========================================================
   HELPERS
========================================================= */

function readJSON(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

function writeJSON(key, value) {
    try {
        localStorage.setItem(
            key,
            JSON.stringify(value)
        );
    } catch (error) {
        console.warn(
            "StudyMind: Could not save JSON.",
            error
        );
    }
}

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value ?? "";
    }
}

function getTimer() {
    return window.StudyMindTimer || null;
}

/* =========================================================
   PLAN / PROGRESS SYSTEM
========================================================= */

function getProgressSystem() {
    return window.StudyMindPlanProgress || null;
}

function getActivePlan() {

    const progress = getProgressSystem();

    if (
        progress &&
        typeof progress.getActivePlan === "function"
    ) {
        const active =
            progress.getActivePlan();

        if (active) {
            return active;
        }
    }

    const activePlanId =
        localStorage.getItem(
            KEYS.ACTIVE_PLAN
        );

    const plans =
        readJSON(
            KEYS.PLANS,
            []
        );

    if (
        activePlanId &&
        Array.isArray(plans)
    ) {
        const found =
            plans.find(
                item =>
                    item &&
                    String(item.id) ===
                    String(activePlanId)
            );

        if (found) {
            return found;
        }
    }

    return readJSON(
        KEYS.PLAN,
        null
    );
}

function refreshPlanReference() {

    const active =
        getActivePlan();

    if (active) {
        plan = active;
    }

    return plan;
}

function syncProgress() {

    const progress =
        getProgressSystem();

    if (
        progress &&
        typeof progress.syncGlobalProgressToPlan ===
        "function"
    ) {
        progress.syncGlobalProgressToPlan();
    }
}

function saveProgressToActivePlan() {

    const progress =
        getProgressSystem();

    if (
        progress &&
        typeof progress.saveActivePlan ===
        "function"
    ) {
        progress.saveActivePlan(plan);
    }
}

/* =========================================================
   TOPIC NORMALIZATION
========================================================= */

function normalizeTopic(topic) {

    if (!topic) {
        return null;
    }

    if (typeof topic === "string") {
        return {
            name: topic,
            subject: "General",
            difficulty: ""
        };
    }

    return {
        name:
            topic.name ||
            topic.topic ||
            topic.title ||
            "Study Topic",

        subject:
            topic.subject ||
            topic.subjectName ||
            "General",

        difficulty:
            topic.difficulty ||
            ""
    };
}

/* =========================================================
   PLAN
========================================================= */

function loadPlan() {

    refreshPlanReference();

    if (!plan) {

        console.warn(
            "StudyMind: No active study plan found."
        );

        return null;
    }

    if (
        !plan.progress ||
        typeof plan.progress !== "object"
    ) {
        plan.progress = {
            completedTopics: [],
            completedQuestionTopics: [],
            studyScore:
                Number(plan.studyScore) || 0,
            currentTopicIndex:
                Number(plan.currentTopicIndex) || 0
        };
    }

    if (
        !Array.isArray(
            plan.progress.completedTopics
        )
    ) {
        plan.progress.completedTopics = [];
    }

    if (
        !Array.isArray(
            plan.progress.completedQuestionTopics
        )
    ) {
        plan.progress.completedQuestionTopics = [];
    }

    if (
        !Number.isFinite(
            Number(
                plan.progress.currentTopicIndex
            )
        )
    ) {
        plan.progress.currentTopicIndex = 0;
    }

    return plan;
}

function getAllTopics() {

    if (!plan) {
        return [];
    }

    const topics = [];

    if (Array.isArray(plan.subjects)) {

        plan.subjects.forEach(subject => {

            if (!subject) {
                return;
            }

            const subjectName =
                subject.name ||
                subject.subject ||
                subject.title ||
                "General";

            if (
                Array.isArray(
                    subject.topics
                )
            ) {

                subject.topics.forEach(topic => {

                    const normalized =
                        normalizeTopic(topic);

                    if (!normalized) {
                        return;
                    }

                    if (
                        normalized.subject ===
                        "General"
                    ) {
                        normalized.subject =
                            subjectName;
                    }

                    topics.push(normalized);
                });
            }
        });
    }

    if (
        !topics.length &&
        Array.isArray(plan.topics)
    ) {

        plan.topics.forEach(topic => {

            const normalized =
                normalizeTopic(topic);

            if (normalized) {
                topics.push(normalized);
            }
        });
    }

    return topics;
}

/* =========================================================
   CURRENT TOPIC
========================================================= */

function topicBelongsToPlan(topic) {

    if (!topic) {
        return false;
    }

    return getAllTopics().some(item => {

        return (
            item.name === topic.name &&
            item.subject === topic.subject
        );
    });
}

function determineCurrentTopic() {

    const topics =
        getAllTopics();

    if (!topics.length) {

        return {
            name: "Study Session",
            subject:
                plan?.subjectNames?.[0] ||
                "General",
            difficulty: ""
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

        const normalized =
            normalizeTopic(stored);

        if (
            normalized &&
            topicBelongsToPlan(normalized)
        ) {
            return normalized;
        }
    }

    const progressIndex =
        Number(
            plan?.progress?.currentTopicIndex
        );

    const storedIndex =
        Number(
            localStorage.getItem(
                KEYS.TOPIC_INDEX
            )
        );

    let index = 0;

    if (
        Number.isFinite(progressIndex) &&
        progressIndex >= 0
    ) {

        index = progressIndex;

    } else if (
        Number.isFinite(storedIndex) &&
        storedIndex >= 0
    ) {

        index = storedIndex;
    }

    index =
        Math.max(
            0,
            Math.min(
                index,
                topics.length - 1
            )
        );

    const topic =
        topics[index];

    if (topic) {

        writeJSON(
            KEYS.CURRENT_TOPIC,
            topic
        );

        localStorage.setItem(
            KEYS.TOPIC_INDEX,
            String(index)
        );
    }

    return topic;
}

/* =========================================================
   COMPLETION
========================================================= */

function getCompletedTopics() {

    const completed =
        readJSON(
            KEYS.COMPLETED,
            []
        );

    return Array.isArray(completed)
        ? completed
        : [];
}

function topicKey(topic) {

    if (!topic) {
        return "";
    }

    return (
        `${topic.subject}::${topic.name}`
    );
}

function isTopicCompleted(topic) {

    if (!topic) {
        return false;
    }

    const key =
        topicKey(topic);

    const completed =
        getCompletedTopics();

    return completed.some(item => {

        if (typeof item === "string") {

            return (
                item === key ||
                item === topic.name
            );
        }

        if (
            item &&
            typeof item === "object"
        ) {

            return (
                item.key === key ||
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
    });
}

function getCompletedCount() {

    const topics =
        getAllTopics();

    return topics.filter(
        topic =>
            isTopicCompleted(topic)
    ).length;
}

function getRemainingCount() {

    const total =
        getAllTopics().length;

    return Math.max(
        0,
        total - getCompletedCount()
    );
}

/* =========================================================
   RENDER TOPIC / PROGRESS
========================================================= */

function renderTopic() {

    if (!currentTopic) {
        return;
    }

    const topics =
        getAllTopics();

    let currentIndex =
        topics.findIndex(
            topic =>
                topic.name ===
                currentTopic.name &&
                topic.subject ===
                currentTopic.subject
        );

    if (currentIndex < 0) {
        currentIndex = 0;
    }

    const completed =
        getCompletedCount();

    const total =
        topics.length;

    const progress =
        total > 0
            ? Math.min(
                100,
                Math.round(
                    (
                        completed /
                        total
                    ) * 100
                )
            )
            : 0;

    setText(
        "topicName",
        currentTopic.name
    );

    setText(
        "subjectName",
        currentTopic.subject
    );

    setText(
        "topicNumber",
        `Topic ${currentIndex + 1} of ${total || 1}`
    );

    setText(
        "progressPercent",
        `${progress}%`
    );

    const bar =
        document.getElementById(
            "topicProgress"
        );

    if (bar) {
        bar.style.width =
            `${progress}%`;
    }

    if (plan) {

        if (
            !plan.progress ||
            typeof plan.progress !== "object"
        ) {
            plan.progress = {};
        }

        plan.progress.currentTopicIndex =
            currentIndex;

        localStorage.setItem(
            KEYS.TOPIC_INDEX,
            String(currentIndex)
        );
    }

    setText(
        "completedTopics",
        String(completed)
    );

    setText(
        "topicsRemaining",
        String(getRemainingCount())
    );
}

/* =========================================================
   NOTES
========================================================= */

function notesKey() {

    if (!currentTopic) {
        return KEYS.NOTES;
    }

    return (
        `${KEYS.NOTES}_` +
        `${currentTopic.subject}_` +
        `${currentTopic.name}`
    );
}

function loadNotes() {

    const textarea =
        document.getElementById(
            "sessionNotes"
        );

    if (
        !textarea ||
        !currentTopic
    ) {
        return;
    }

    textarea.value =
        localStorage.getItem(
            notesKey()
        ) || "";
}

function saveNotes() {

    const textarea =
        document.getElementById(
            "sessionNotes"
        );

    if (
        !textarea ||
        !currentTopic
    ) {
        return;
    }

    localStorage.setItem(
        notesKey(),
        textarea.value
    );

    const status =
        document.getElementById(
            "notesStatus"
        );

    if (status) {

        status.textContent =
            "Saved ✓";

        setTimeout(() => {

            status.textContent =
                "";

        }, 1500);
    }
}

/* =========================================================
   CHECKLIST
========================================================= */

function checklistKey() {

    if (!currentTopic) {
        return null;
    }

    return (
        `studyMindChecklist_` +
        `${currentTopic.subject}_` +
        `${currentTopic.name}`
    );
}

function loadChecklist() {

    const key =
        checklistKey();

    if (!key) {
        return;
    }

    const data =
        readJSON(
            key,
            {}
        );

    [
        "understandCheck",
        "notesCheck",
        "recallCheck",
        "questionCheck"
    ].forEach(id => {

        const checkbox =
            document.getElementById(id);

        if (checkbox) {

            checkbox.checked =
                Boolean(data[id]);
        }
    });
}

function setupChecklist() {

    document
        .querySelectorAll(
            "#understandCheck, #notesCheck, #recallCheck, #questionCheck"
        )
        .forEach(checkbox => {

            checkbox.addEventListener(
                "change",
                () => {

                    const key =
                        checklistKey();

                    if (!key) {
                        return;
                    }

                    const data =
                        readJSON(
                            key,
                            {}
                        );

                    data[checkbox.id] =
                        checkbox.checked;

                    writeJSON(
                        key,
                        data
                    );
                }
            );
        });

    loadChecklist();
}

/* =========================================================
   REQUIRED-TIME COMPLETION POPUP
   
   This popup appears when the shared timer
   reports that the required study time is complete.

   IMPORTANT:
   It does NOT complete the topic automatically.
========================================================= */

function getCompletedMinutes(event) {

    const detail =
        event?.detail || {};

    const timer =
        getTimer();

    const state =
        timer &&
        typeof timer.getState === "function"
            ? timer.getState()
            : null;

    const possibleSeconds = [
        detail.completedSeconds,
        detail.elapsedSeconds,
        detail.durationSeconds,
        state?.selectedSeconds
    ];

    let seconds = 0;

    for (
        const value of possibleSeconds
    ) {

        const number =
            Number(value);

        if (
            Number.isFinite(number) &&
            number > 0
        ) {

            seconds = number;
            break;
        }
    }

    if (!seconds) {

        const selected =
            Number(
                localStorage.getItem(
                    "studyMindSelectedTimerSeconds"
                )
            );

        if (
            Number.isFinite(selected) &&
            selected > 0
        ) {
            seconds = selected;
        }
    }

    if (!seconds) {
        seconds = 25 * 60;
    }

    return Math.max(
        1,
        Math.round(seconds / 60)
    );
}

function ensureCompletionPopup() {

    if (completionPopup) {
        return completionPopup;
    }

    const overlay =
        document.createElement("div");

    overlay.id =
        "studyMindRequiredTimePopup";

    overlay.setAttribute(
        "role",
        "dialog"
    );

    overlay.setAttribute(
        "aria-modal",
        "true"
    );

    overlay.setAttribute(
        "aria-labelledby",
        "studyMindRequiredTimeTitle"
    );

    overlay.innerHTML = `
        <div class="studyMindRequiredTimeBackdrop"></div>

        <div class="studyMindRequiredTimeCard">

            <div class="studyMindRequiredTimeIcon">
                ✓
            </div>

            <div class="studyMindRequiredTimeBadge">
                REQUIRED TIME COMPLETE
            </div>

            <h2 id="studyMindRequiredTimeTitle">
                Study Time Complete!
            </h2>

            <p class="studyMindRequiredTimeMessage">
                Great work! You've completed your required study time for this session.
            </p>

            <div class="studyMindRequiredTimeMinutes">
                <strong id="studyMindRequiredTimeValue">
                    25
                </strong>
                <span>minutes studied</span>
            </div>

            <p class="studyMindRequiredTimeTopic">
                <span id="studyMindRequiredTimeTopic">
                    Study Session
                </span>
            </p>

            <div class="studyMindRequiredTimeActions">

                <button
                    type="button"
                    id="studyMindContinueButton"
                    class="studyMindRequiredTimeSecondary"
                >
                    Continue Studying
                </button>

                <button
                    type="button"
                    id="studyMindFinishButton"
                    class="studyMindRequiredTimePrimary"
                >
                    Finish Session
                </button>

            </div>

        </div>
    `;

    const style =
        document.createElement("style");

    style.id =
        "studyMindRequiredTimePopupStyles";

    style.textContent = `
        #studyMindRequiredTimePopup {
            position: fixed;
            inset: 0;
            z-index: 2147483646;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 24px;
            box-sizing: border-box;
        }

        #studyMindRequiredTimePopup.studyMindPopupVisible {
            display: flex;
        }

        .studyMindRequiredTimeBackdrop {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.68);
            backdrop-filter: blur(7px);
            -webkit-backdrop-filter: blur(7px);
        }

        .studyMindRequiredTimeCard {
            position: relative;
            z-index: 1;
            width: min(460px, 100%);
            box-sizing: border-box;
            padding: 32px 28px 26px;
            border-radius: 24px;
            background: var(
                --card-bg,
                #ffffff
            );
            color: var(
                --text-primary,
                #111827
            );
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow:
                0 30px 90px rgba(0, 0, 0, 0.35),
                0 0 0 1px rgba(255, 255, 255, 0.04);
            text-align: center;
            animation:
                studyMindPopupIn
                0.28s
                ease-out;
        }

        .studyMindRequiredTimeIcon {
            width: 72px;
            height: 72px;
            margin: 0 auto 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: linear-gradient(
                135deg,
                #16a34a,
                #22c55e
            );
            color: white;
            font-size: 36px;
            font-weight: 900;
            box-shadow:
                0 12px 30px rgba(
                    34,
                    197,
                    94,
                    0.3
                );
        }

        .studyMindRequiredTimeBadge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 7px 11px;
            margin-bottom: 12px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.08em;
            background: rgba(
                59,
                130,
                246,
                0.1
            );
            color: #2563eb;
        }

        .studyMindRequiredTimeCard h2 {
            margin: 0 0 10px;
            font-size: 28px;
            line-height: 1.15;
            font-weight: 800;
        }

        .studyMindRequiredTimeMessage {
            margin: 0 auto 18px;
            max-width: 370px;
            line-height: 1.55;
            opacity: 0.78;
            font-size: 15px;
        }

        .studyMindRequiredTimeMinutes {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin: 18px auto;
            padding: 16px;
            border-radius: 16px;
            background: rgba(
                59,
                130,
                246,
                0.08
            );
        }

        .studyMindRequiredTimeMinutes strong {
            font-size: 34px;
            line-height: 1;
            font-weight: 900;
        }

        .studyMindRequiredTimeMinutes span {
            margin-top: 6px;
            font-size: 13px;
            opacity: 0.7;
        }

        .studyMindRequiredTimeTopic {
            margin: 10px 0 22px;
            font-size: 14px;
            opacity: 0.72;
        }

        .studyMindRequiredTimeTopic span {
            font-weight: 700;
            opacity: 1;
        }

        .studyMindRequiredTimeActions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }

        .studyMindRequiredTimeActions button {
            min-height: 48px;
            border: 0;
            border-radius: 13px;
            padding: 12px 14px;
            font: inherit;
            font-weight: 750;
            cursor: pointer;
            transition:
                transform 0.15s ease,
                opacity 0.15s ease,
                box-shadow 0.15s ease;
        }

        .studyMindRequiredTimeActions button:hover {
            transform: translateY(-1px);
        }

        .studyMindRequiredTimeActions button:active {
            transform: translateY(0);
        }

        .studyMindRequiredTimeSecondary {
            background: rgba(
                107,
                114,
                128,
                0.12
            );
            color: inherit;
        }

        .studyMindRequiredTimePrimary {
            background: #2563eb;
            color: white;
            box-shadow:
                0 8px 22px rgba(
                    37,
                    99,
                    235,
                    0.25
                );
        }

        /* Premium gold theme */
        html.study-mind-premium
        .studyMindRequiredTimeBadge,
        body.study-mind-premium
        .studyMindRequiredTimeBadge {
            background: rgba(
                212,
                175,
                55,
                0.14
            );
            color: #b8860b;
        }

        html.study-mind-premium
        .studyMindRequiredTimeMinutes,
        body.study-mind-premium
        .studyMindRequiredTimeMinutes {
            background: rgba(
                212,
                175,
                55,
                0.10
            );
        }

        html.study-mind-premium
        .studyMindRequiredTimePrimary,
        body.study-mind-premium
        .studyMindRequiredTimePrimary {
            background: linear-gradient(
                135deg,
                #c99a24,
                #e6c65c
            );
            color: #17120a;
            box-shadow:
                0 8px 24px rgba(
                    201,
                    154,
                    36,
                    0.28
                );
        }

        @keyframes studyMindPopupIn {
            from {
                opacity: 0;
                transform:
                    translateY(14px)
                    scale(0.96);
            }

            to {
                opacity: 1;
                transform:
                    translateY(0)
                    scale(1);
            }
        }

        @media (max-width: 560px) {

            .studyMindRequiredTimeCard {
                padding:
                    28px
                    18px
                    20px;
                border-radius: 20px;
            }

            .studyMindRequiredTimeCard h2 {
                font-size: 24px;
            }

            .studyMindRequiredTimeActions {
                grid-template-columns: 1fr;
            }
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(overlay);

    completionPopup = overlay;

    const backdrop =
        overlay.querySelector(
            ".studyMindRequiredTimeBackdrop"
        );

    const continueButton =
        overlay.querySelector(
            "#studyMindContinueButton"
        );

    const finishButton =
        overlay.querySelector(
            "#studyMindFinishButton"
        );

    if (backdrop) {

        backdrop.addEventListener(
            "click",
            () => {
                hideCompletionPopup();
            }
        );
    }

    if (continueButton) {

        continueButton.addEventListener(
            "click",
            () => {
                hideCompletionPopup();
            }
        );
    }

    if (finishButton) {

        finishButton.addEventListener(
            "click",
            () => {

                hideCompletionPopup();

                setTimeout(
                    () => {
                        completeSession();
                    },
                    80
                );
            }
        );
    }

    return overlay;
}

function showCompletionPopup(event) {

    /*
     * Prevent duplicate popups if the completion
     * event is accidentally dispatched more than once.
     */
    if (completionPopupVisible) {
        return;
    }

    const popup =
        ensureCompletionPopup();

    const minutes =
        getCompletedMinutes(event);

    const minuteElement =
        popup.querySelector(
            "#studyMindRequiredTimeValue"
        );

    if (minuteElement) {
        minuteElement.textContent =
            String(minutes);
    }

    const topicElement =
        popup.querySelector(
            "#studyMindRequiredTimeTopic"
        );

    if (topicElement) {

        topicElement.textContent =
            currentTopic?.name ||
            "Study Session";
    }

    popup.classList.add(
        "studyMindPopupVisible"
    );

    completionPopupVisible = true;

    document.body.style.overflow =
        "hidden";

    /*
     * Focus the primary action when possible.
     */
    setTimeout(() => {

        const finishButton =
            popup.querySelector(
                "#studyMindFinishButton"
            );

        if (finishButton) {
            finishButton.focus();
        }

    }, 50);

    console.log(
        "StudyMind: Required study time completed.",
        {
            minutes,
            topic:
                currentTopic?.name || null
        }
    );
}

function hideCompletionPopup() {

    if (!completionPopup) {
        return;
    }

    completionPopup.classList.remove(
        "studyMindPopupVisible"
    );

    completionPopupVisible = false;

    document.body.style.overflow = "";
}

/* =========================================================
   TIMER DISPLAY ONLY
   
   IMPORTANT:
   study-timer.js owns ALL timer controls.
========================================================= */

function updateTimerUI() {

    const timer =
        getTimer();

    if (!timer) {

        setText(
            "timerState",
            "Ready"
        );

        return;
    }

    const state =
        timer.getState();

    if (!state) {
        return;
    }

    const display =
        document.getElementById(
            "timerDisplay"
        );

    const stateText =
        document.getElementById(
            "timerState"
        );

    if (display) {

        const seconds =
            Math.max(
                0,
                Number(state.seconds) || 0
            );

        const minutes =
            Math.floor(
                seconds / 60
            );

        const secs =
            seconds % 60;

        display.textContent =
            `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }

    if (stateText) {

        if (state.running) {

            stateText.textContent =
                "Studying";

        } else if (
            Number(state.seconds) <
            Number(state.selectedSeconds)
        ) {

            stateText.textContent =
                "Paused";

        } else {

            stateText.textContent =
                "Ready";
        }
    }
}

/* =========================================================
   TIMER EVENTS
========================================================= */

function handleTimerCompleted(event) {

    updateTimerUI();

    /*
     * Timer completion does NOT complete
     * the topic automatically.
     */

    refreshPlanReference();
    syncProgress();
    renderTopic();

    /*
     * Show the required-time completion popup.
     */
    showCompletionPopup(event);
}

function setupTimerDisplay() {

    window.addEventListener(
        "studyMindTimerChanged",
        updateTimerUI
    );

    window.addEventListener(
        "studyMindStudyTimeUpdated",
        updateTimerUI
    );

    window.addEventListener(
        "studyMindTimerCompleted",
        handleTimerCompleted
    );

    setInterval(
        updateTimerUI,
        500
    );

    updateTimerUI();
}

/* =========================================================
   KNOWLEDGE CHECK
========================================================= */

function startKnowledgeCheck() {

    if (!currentTopic) {
        return;
    }

    writeJSON(
        "studyMindKnowledgeCheckTopic",
        currentTopic
    );

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

    if (index >= 0) {

        localStorage.setItem(
            KEYS.TOPIC_INDEX,
            String(index)
        );

        if (plan?.progress) {

            plan.progress.currentTopicIndex =
                index;

            saveProgressToActivePlan();
        }
    }

    window.location.href =
        "knowledge-check.html";
}

/* =========================================================
   COMPLETE SESSION
   
   IMPORTANT:
   This is separate from timer completion.
   
   It ONLY marks the topic completed.
   
   It does NOT:
   - award timer XP
   - award timer minutes
   - create a timer session
   - create a streak day
========================================================= */

function completeSession() {

    if (!currentTopic) {
        return;
    }

    const key =
        topicKey(currentTopic);

    let completed =
        getCompletedTopics();

    if (!Array.isArray(completed)) {
        completed = [];
    }

    const alreadyCompleted =
        completed.some(item => {

            if (typeof item === "string") {

                return (
                    item === key ||
                    item === currentTopic.name
                );
            }

            if (
                item &&
                typeof item === "object"
            ) {

                return (
                    item.key === key ||
                    (
                        item.subject ===
                        currentTopic.subject &&
                        (
                            item.topic ===
                            currentTopic.name ||
                            item.name ===
                            currentTopic.name
                        )
                    )
                );
            }

            return false;
        });

    if (!alreadyCompleted) {

        completed.push(key);

        writeJSON(
            KEYS.COMPLETED,
            completed
        );
    }

    refreshPlanReference();

    if (plan) {

        if (
            !plan.progress ||
            typeof plan.progress !== "object"
        ) {
            plan.progress = {};
        }

        plan.progress.completedTopics =
            [...completed];

        plan.completedTopics =
            [...completed];

        saveProgressToActivePlan();
    }

    renderTopic();

    window.dispatchEvent(
        new CustomEvent(
            "studyMindProgressUpdated",
            {
                detail: {
                    subject:
                        currentTopic.subject,

                    topic:
                        currentTopic.name,

                    key,

                    completedCount:
                        getCompletedCount(),

                    remaining:
                        getRemainingCount()
                }
            }
        )
    );

    if (
        window.StudyMindScore &&
        typeof window.StudyMindScore.refresh ===
        "function"
    ) {

        window.StudyMindScore.refresh();
    }

    if (
        window.StudyMindRewards &&
        typeof window.StudyMindRewards.check ===
        "function"
    ) {

        setTimeout(
            () => {

                window.StudyMindRewards.check();

            },
            300
        );
    }

    const status =
        document.getElementById(
            "sessionStatus"
        );

    if (status) {

        status.textContent =
            "Session completed ✓";
    }

    const topics =
        getAllTopics();

    const currentIndex =
        topics.findIndex(
            topic =>
                topic.name ===
                currentTopic.name &&
                topic.subject ===
                currentTopic.subject
        );

    if (
        currentIndex >= 0 &&
        currentIndex <
        topics.length - 1
    ) {

        const nextIndex =
            currentIndex + 1;

        localStorage.setItem(
            KEYS.TOPIC_INDEX,
            String(nextIndex)
        );

        if (plan?.progress) {

            plan.progress.currentTopicIndex =
                nextIndex;

            saveProgressToActivePlan();
        }

        localStorage.removeItem(
            KEYS.CURRENT_TOPIC
        );
    }

    /*
     * Deliberately no XP/streak/timer handling here.
     */

    setTimeout(() => {

        window.location.href =
            "dashboard.html";

    }, 800);
}

/* =========================================================
   USER
========================================================= */

async function loadUser() {

    let username =
        localStorage.getItem(
            KEYS.USERNAME
        ) || "";

    try {

        const client =
            window.supabaseClient ||
            window.studyMindSupabase;

        if (client) {

            const {
                data,
                error
            } =
                await client.auth.getUser();

            if (!error) {

                const user =
                    data?.user;

                const metadata =
                    user?.user_metadata ||
                    {};

                username =
                    username ||
                    metadata.username ||
                    metadata.display_name ||
                    metadata.name ||
                    (
                        user?.email
                            ? user.email
                                .split("@")[0]
                            : ""
                    ) ||
                    "Student";

                localStorage.setItem(
                    KEYS.USERNAME,
                    username
                );
            }
        }

    } catch (error) {

        console.warn(
            "StudyMind: Could not load user.",
            error
        );
    }

    username =
        username ||
        "Student";

    setText(
        "usernameDisplay",
        username
    );

    const avatar =
        document.getElementById(
            "userAvatar"
        );

    if (avatar) {

        avatar.textContent =
            username
                .charAt(0)
                .toUpperCase();
    }
}

/* =========================================================
   BUTTONS
========================================================= */

function setupButtons() {

    const knowledge =
        document.getElementById(
            "knowledgeCheckButton"
        );

    if (knowledge) {

        knowledge.addEventListener(
            "click",
            startKnowledgeCheck
        );
    }

    const complete =
        document.getElementById(
            "completeSessionButton"
        );

    if (complete) {

        complete.addEventListener(
            "click",
            completeSession
        );
    }

    const notes =
        document.getElementById(
            "sessionNotes"
        );

    if (notes) {

        let timeout = null;

        notes.addEventListener(
            "input",
            () => {

                clearTimeout(timeout);

                timeout =
                    setTimeout(
                        saveNotes,
                        500
                    );
            }
        );
    }

    /*
     * Escape closes the required-time popup.
     */
    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                completionPopupVisible
            ) {
                hideCompletionPopup();
            }
        }
    );
}

/* =========================================================
   PROGRESS EVENTS
========================================================= */

function setupProgressListeners() {

    window.addEventListener(
        "studyMindProgressUpdated",
        () => {

            refreshPlanReference();
            syncProgress();

            currentTopic =
                determineCurrentTopic();

            renderTopic();
        }
    );

    window.addEventListener(
        "studyMindPlanCreated",
        () => {

            loadPlan();

            currentTopic =
                determineCurrentTopic();

            renderTopic();
            loadNotes();
            loadChecklist();
            updateTimerUI();
        }
    );

    window.addEventListener(
        "studyMindActivePlanChanged",
        () => {

            loadPlan();

            currentTopic =
                determineCurrentTopic();

            renderTopic();
            loadNotes();
            loadChecklist();
            updateTimerUI();
        }
    );

    window.addEventListener(
        "storage",
        event => {

            if (
                event.key ===
                KEYS.COMPLETED ||
                event.key ===
                KEYS.CURRENT_TOPIC ||
                event.key ===
                KEYS.TOPIC_INDEX ||
                event.key ===
                KEYS.ACTIVE_PLAN
            ) {

                loadPlan();

                currentTopic =
                    determineCurrentTopic();

                renderTopic();
                loadNotes();
                loadChecklist();
                updateTimerUI();
            }
        }
    );
}

/* =========================================================
   INITIALIZE
========================================================= */

function initialize() {

    if (initialized) {
        return;
    }

    initialized = true;

    loadPlan();

    const progress =
        getProgressSystem();

    if (
        progress &&
        typeof progress.loadActivePlanProgress ===
        "function"
    ) {
        progress.loadActivePlanProgress();
    }

    loadPlan();

    currentTopic =
        determineCurrentTopic();

    renderTopic();
    loadNotes();
    loadChecklist();

    /*
     * Timer controls remain exclusively inside
     * study-timer.js.
     */
    setupTimerDisplay();

    setupChecklist();
    setupButtons();
    setupProgressListeners();

    loadUser();

    updateTimerUI();

    setInterval(
        () => {

            syncProgress();

            refreshPlanReference();

            renderTopic();
            updateTimerUI();

        },
        1000
    );

    console.log(
        "StudyMind: Study Session initialized.",
        {
            planId:
                plan?.id || null,

            topic:
                currentTopic,

            completed:
                getCompletedCount(),

            remaining:
                getRemainingCount()
        }
    );
}

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initialize,
        { once: true }
    );

} else {

    initialize();
}


})();
