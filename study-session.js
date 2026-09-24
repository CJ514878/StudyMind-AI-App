"use strict";

/* =========================================================
   STUDYMIND AI — STUDY SESSION
   Shared progress + shared timer architecture
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
        localStorage.setItem(key, JSON.stringify(value));
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
            const active = progress.getActivePlan();

            if (active) {
                return active;
            }
        }

        const activePlanId =
            localStorage.getItem(KEYS.ACTIVE_PLAN);

        const plans =
            readJSON(KEYS.PLANS, []);

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

        return readJSON(KEYS.PLAN, null);
    }

    function refreshPlanReference() {

        const active = getActivePlan();

        if (active) {
            plan = active;
        }

        return plan;
    }

    function syncProgress() {

        const progress = getProgressSystem();

        if (
            progress &&
            typeof progress.syncGlobalProgressToPlan ===
            "function"
        ) {
            progress.syncGlobalProgressToPlan();
        }
    }

    function saveProgressToActivePlan() {

        const progress = getProgressSystem();

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

        const topics = getAllTopics();

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

            /*
             * Prevent a topic from an old plan
             * appearing in the new plan.
             */
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

        const topic = topics[index];

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

        const key = topicKey(topic);
        const completed = getCompletedTopics();

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

        const topics = getAllTopics();

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

        const topics = getAllTopics();

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

        /*
         * These are optional. If the HTML has them,
         * they will update automatically.
         */
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
       TIMER DISPLAY ONLY
       
       IMPORTANT:
       study-timer.js owns ALL timer controls.
       This file only reads and displays timer state.

       This prevents duplicate click handlers.
    ========================================================= */

    function updateTimerUI() {

        const timer = getTimer();

        if (!timer) {

            setText(
                "timerState",
                "Ready"
            );

            return;
        }

        const state = timer.getState();

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

        /*
         * Timer display
         */
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

        /*
         * Timer state
         */
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

        /*
         * The shared timer itself owns the button
         * behavior and text. We intentionally do
         * NOT add another click handler here.
         */
    }

    /* =========================================================
       TIMER EVENTS
    ========================================================= */

    function setupTimerDisplay() {

        /*
         * study-timer.js is the sole owner of:
         *
         * Start
         * Pause
         * Reset
         * 25 / 45 / 60 minute presets
         * Timer completion
         *
         * This page only listens for state changes.
         */

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
            () => {

                updateTimerUI();

                /*
                 * Timer completion does NOT complete
                 * the topic.
                 *
                 * It is handled independently by
                 * the shared timer.
                 */
                refreshPlanReference();
                syncProgress();
                renderTopic();
            }
        );

        /*
         * Small display refresh only.
         * No timer controls are created here.
         */
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

        /*
         * Check all supported completion formats
         * before adding the topic.
         */
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

        /*
         * Synchronize active plan progress.
         */
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

        /*
         * Study Score uses the actual stored
         * performance metrics.
         */
        if (
            window.StudyMindScore &&
            typeof window.StudyMindScore.refresh ===
            "function"
        ) {

            window.StudyMindScore.refresh();
        }

        /*
         * Check achievements.
         */
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

        /*
         * Move the topic pointer forward.
         */
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

        /*
         * Local chosen username is preferred.
         */
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

                    /*
                     * Account username is preferred
                     * when available.
                     */
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

        /*
         * Load progress belonging to the active plan.
         */
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
         * IMPORTANT:
         * No timer click handlers here.
         *
         * study-timer.js owns the timer controls.
         */
        setupTimerDisplay();

        setupChecklist();
        setupButtons();
        setupProgressListeners();

        loadUser();

        updateTimerUI();

        /*
         * Keep progress and display synchronized
         * while this page is open.
         */
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
