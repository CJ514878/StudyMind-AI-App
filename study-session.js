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

            const value =
                localStorage.getItem(key);

            return value
                ? JSON.parse(value)
                : fallback;

        } catch {

            return fallback;
        }
    }

    function writeJSON(key, value) {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );
    }

    function setText(id, value) {

        const element =
            document.getElementById(id);

        if (element) {
            element.textContent =
                value ?? "";
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

        const progress =
            getProgressSystem();

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

        /*
         * Make sure the progress object exists.
         */
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

        /*
         * Normal generated plan:
         * subjects -> topics
         */
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

                        topics.push(
                            normalized
                        );
                    });
                }
            });
        }

        /*
         * Fallback flat topic structure.
         */
        if (
            !topics.length &&
            Array.isArray(plan.topics)
        ) {

            plan.topics.forEach(topic => {

                const normalized =
                    normalizeTopic(topic);

                if (normalized) {

                    topics.push(
                        normalized
                    );
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

        const topics =
            getAllTopics();

        return topics.some(item => {

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

        /*
         * First use an explicitly selected topic.
         */
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
             * Do not allow an old topic from a
             * previous study plan to leak into
             * the new plan.
             */
            if (
                normalized &&
                topicBelongsToPlan(normalized)
            ) {

                return normalized;
            }
        }

        /*
         * Otherwise use the active plan's
         * saved topic index.
         */
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

        /*
         * Global compatibility key remains the
         * live source for existing pages.
         */
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

            if (
                typeof item ===
                "string"
            ) {

                return (
                    item === key ||
                    item === topic.name
                );
            }

            if (
                item &&
                typeof item ===
                "object"
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

        /*
         * Keep plan progress synchronized.
         */
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
         * Optional status elements if present
         * in a future version of the page.
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
                    Boolean(
                        data[id]
                    );
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

                        data[
                            checkbox.id
                        ] =
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
       TIMER DISPLAY
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

        const startButton =
            document.getElementById(
                "timerStart"
            );

        if (display) {

            const seconds =
                Math.max(
                    0,
                    Number(
                        state.seconds
                    ) || 0
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

        if (startButton) {

            startButton.textContent =
                state.running
                    ? "Pause"
                    : "Start";
        }
    }

    /* =========================================================
       TIMER CONTROLS
    ========================================================= */

    function setupTimerControls() {

        const timer =
            getTimer();

        if (!timer) {

            console.warn(
                "StudyMind: Shared timer not available yet."
            );

            /*
             * study-timer.js should already be loaded,
             * but retry in case script initialization
             * finishes a moment later.
             */
            setTimeout(
                () => {

                    if (
                        window.StudyMindTimer &&
                        !window.__studySessionTimerReady
                    ) {

                        setupTimerControls();
                        updateTimerUI();
                    }

                },
                300
            );

            return;
        }

        if (
            window.__studySessionTimerControlsReady
        ) {

            updateTimerUI();
            return;
        }

        window.__studySessionTimerControlsReady =
            true;

        window.__studySessionTimerReady =
            true;

        /*
         * Duration buttons
         */
        document
            .querySelectorAll(
                ".timer-preset"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const state =
                            timer.getState();

                        if (
                            state &&
                            state.running
                        ) {
                            return;
                        }

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

                        if (
                            typeof timer.selectDuration ===
                            "function"
                        ) {

                            timer.selectDuration(
                                minutes * 60
                            );
                        }

                        updateTimerUI();
                    }
                );
            });

        /*
         * Start / pause
         */
        const start =
            document.getElementById(
                "timerStart"
            );

        if (start) {

            start.addEventListener(
                "click",
                () => {

                    const state =
                        timer.getState();

                    if (
                        state &&
                        state.running
                    ) {

                        if (
                            typeof timer.pause ===
                            "function"
                        ) {

                            timer.pause();
                        }

                    } else {

                        if (
                            typeof timer.start ===
                            "function"
                        ) {

                            timer.start();
                        }
                    }

                    updateTimerUI();
                }
            );
        }

        /*
         * Reset
         */
        const reset =
            document.getElementById(
                "timerReset"
            );

        if (reset) {

            reset.addEventListener(
                "click",
                () => {

                    if (
                        typeof timer.reset ===
                        "function"
                    ) {

                        timer.reset();
                    }

                    updateTimerUI();
                }
            );
        }

        /*
         * The shared timer is the source of truth.
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
                renderTopic();

                /*
                 * Timer completion is handled by the
                 * shared timer. We deliberately DO NOT
                 * mark the topic complete here.
                 */
                syncProgress();
            }
        );

        /*
         * Keep the display alive even if another
         * component doesn't dispatch an event.
         */
        setInterval(
            updateTimerUI,
            1000
        );
    }

    /* =========================================================
       KNOWLEDGE CHECK
    ========================================================= */

    function startKnowledgeCheck() {

        if (!currentTopic) {
            return;
        }

        /*
         * Save the exact topic so knowledge-check.html
         * knows what the student is testing.
         */
        writeJSON(
            "studyMindKnowledgeCheckTopic",
            currentTopic
        );

        /*
         * Keep the topic index synchronized.
         */
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
       This is NOT timer completion.

       It only marks the current topic as completed.
       The shared timer separately handles study-time
       tracking and timer-based streak activity.
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
         * Prevent duplicate completion.
         */
        if (!completed.includes(key)) {

            completed.push(key);

            writeJSON(
                KEYS.COMPLETED,
                completed
            );
        }

        /*
         * Update the active plan's progress.
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
         * Refresh Study Score.
         *
         * Score is based on actual study data,
         * not simply on clicking Complete Session.
         */
        if (
            window.StudyMindScore &&
            typeof window.StudyMindScore.refresh ===
                "function"
        ) {

            window.StudyMindScore.refresh();
        }

        /*
         * Check the achievement/reward system.
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
         * Move the saved topic pointer forward
         * to the next topic.
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

            /*
             * Clear the old explicitly selected
             * topic so the next page can use the
             * new pointer.
             */
            localStorage.removeItem(
                KEYS.CURRENT_TOPIC
            );
        }

        /*
         * Do NOT:
         * - award XP here
         * - award streak here
         * - complete the timer here
         *
         * Those systems have their own sources
         * of truth.
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
         * The chosen username is the canonical
         * local display name.
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
                     * IMPORTANT:
                     * username comes first.
                     *
                     * This keeps the same chosen
                     * username across Study Session,
                     * Dashboard and Leaderboard.
                     */
                    username =
                        metadata.username ||
                        username ||
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

                    clearTimeout(
                        timeout
                    );

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

                /*
                 * Pull the current compatibility
                 * progress into the active plan.
                 */
                syncProgress();

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
         * If the shared progress bridge is present,
         * make sure compatibility keys represent
         * this active plan before determining the topic.
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

        setupTimerControls();
        setupChecklist();
        setupButtons();
        setupProgressListeners();

        loadUser();

        updateTimerUI();

        /*
         * Keep progress synchronized periodically,
         * but only while this page is open.
         */
        setInterval(
            () => {

                syncProgress();
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
