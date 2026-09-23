"use strict";

/* =========================================================
   STUDYMIND AI — STUDY SESSION
========================================================= */

(function () {

    const KEYS = {
        PLAN: "studyMindPlan",
        CURRENT_TOPIC: "studyMindCurrentTopic",
        TOPIC_INDEX: "studyMindCurrentTopicIndex",
        COMPLETED: "studyMindCompletedTopics",
        QUESTION_DONE:
            "studyMindCompletedQuestionTopics",
        NOTES: "studyMindSessionNotes",
        USERNAME: "studyMindUsername"
    };

    let plan = null;
    let currentTopic = null;

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

    function getTimer() {
        return window.StudyMindTimer || null;
    }

    function normalizeTopic(topic) {

        if (!topic) return null;

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
                topic.difficulty || ""
        };
    }

    /* =========================================================
       PLAN
    ========================================================= */

    function loadPlan() {

        plan =
            readJSON(
                KEYS.PLAN,
                null
            );

        return plan;
    }

    function getAllTopics() {

        if (!plan) return [];

        const topics = [];

        if (Array.isArray(plan.subjects)) {

            plan.subjects.forEach(subject => {

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

                    subject.topics.forEach(
                        topic => {

                            const normalized =
                                normalizeTopic(
                                    topic
                                );

                            if (normalized) {

                                normalized.subject =
                                    normalized.subject === "General"
                                        ? subjectName
                                        : normalized.subject;

                                topics.push(
                                    normalized
                                );
                            }
                        }
                    );
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

    function determineCurrentTopic() {

        const stored =
            readJSON(
                KEYS.CURRENT_TOPIC,
                null
            );

        if (stored && stored.name) {
            return normalizeTopic(stored);
        }

        const topics =
            getAllTopics();

        if (!topics.length) {
            return {
                name: "Study Session",
                subject:
                    plan?.subjectNames?.[0] ||
                    "General"
            };
        }

        const index =
            Number(
                localStorage.getItem(
                    KEYS.TOPIC_INDEX
                ) || 0
            );

        return topics[
            Math.max(
                0,
                Math.min(
                    index,
                    topics.length - 1
                )
            )
        ];
    }

    /* =========================================================
       COMPLETION
    ========================================================= */

    function getCompletedTopics() {

        return readJSON(
            KEYS.COMPLETED,
            []
        );
    }

    function topicKey(topic) {

        return `${topic.subject}::${topic.name}`;
    }

    function isTopicCompleted(topic) {

        const key =
            topicKey(topic);

        return getCompletedTopics()
            .some(item => {

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
                            item.topic ===
                                topic.name
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
            isTopicCompleted
        ).length;
    }

    /* =========================================================
       RENDER TOPIC
    ========================================================= */

    function renderTopic() {

        if (!currentTopic) {
            return;
        }

        const topics =
            getAllTopics();

        const currentIndex =
            Math.max(
                0,
                topics.findIndex(
                    topic =>
                        topic.name ===
                            currentTopic.name &&
                        topic.subject ===
                            currentTopic.subject
                )
            );

        const completed =
            getCompletedCount();

        const total =
            topics.length;

        const progress =
            total
                ? Math.round(
                    (
                        completed /
                        total
                    ) * 100
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
    }

    /* =========================================================
       NOTES
    ========================================================= */

    function notesKey() {

        return `${KEYS.NOTES}_${currentTopic.subject}_${currentTopic.name}`;
    }

    function loadNotes() {

        const textarea =
            document.getElementById(
                "sessionNotes"
            );

        if (!textarea || !currentTopic) {
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

        if (!textarea || !currentTopic) {
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
                status.textContent = "";
            }, 1500);
        }
    }

    /* =========================================================
       TIMER DISPLAY
    ========================================================= */

    function updateTimerUI() {

        const timer =
            getTimer();

        if (!timer) {
            return;
        }

        const state =
            timer.getState();

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
                    state.seconds
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

            stateText.textContent =
                state.running
                    ? "Studying"
                    : "Ready";
        }
    }

    /* =========================================================
       TIMER CONTROLS
    ========================================================= */

    function setupTimerControls() {

        const timer =
            getTimer();

        if (!timer) {
            console.error(
                "StudyMind: Shared timer was not loaded."
            );
            return;
        }

        document
            .querySelectorAll(
                ".timer-preset"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        if (
                            timer.getState()
                                .running
                        ) {
                            return;
                        }

                        timer.selectDuration(
                            Number(
                                button.dataset.minutes
                            ) * 60
                        );

                        updateTimerUI();
                    }
                );
            });

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

                    if (state.running) {
                        timer.pause();
                    } else {
                        timer.start();
                    }

                    updateTimerUI();
                }
            );
        }

        const reset =
            document.getElementById(
                "timerReset"
            );

        if (reset) {

            reset.addEventListener(
                "click",
                () => {

                    timer.reset();
                    updateTimerUI();
                }
            );
        }

        window.addEventListener(
            "studyMindTimerChanged",
            updateTimerUI
        );

        window.addEventListener(
            "studyMindStudyTimeUpdated",
            updateTimerUI
        );

        setInterval(
            updateTimerUI,
            1000
        );
    }

    /* =========================================================
       CHECKLIST
    ========================================================= */

    function setupChecklist() {

        document
            .querySelectorAll(
                "#understandCheck, #notesCheck, #recallCheck, #questionCheck"
            )
            .forEach(checkbox => {

                checkbox.addEventListener(
                    "change",
                    () => {

                        if (
                            currentTopic
                        ) {

                            const key =
                                `studyMindChecklist_${currentTopic.subject}_${currentTopic.name}`;

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
                    }
                );
            });
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

        window.location.href =
            "knowledge-check.html";
    }

    /* =========================================================
       COMPLETE SESSION
       IMPORTANT:
       This remains separate from timer completion.
    ========================================================= */

    function completeSession() {

        if (!currentTopic) {
            return;
        }

        const key =
            topicKey(currentTopic);

        const completed =
            getCompletedTopics();

        if (!completed.includes(key)) {
            completed.push(key);
        }

        writeJSON(
            KEYS.COMPLETED,
            completed
        );

        renderTopic();

        window.dispatchEvent(
            new CustomEvent(
                "studyMindProgressUpdated"
            )
        );

        /*
         * Check whether the entire day's
         * required study has now been completed.
         */
        if (
            window.StudyMindStreak &&
            typeof window.StudyMindStreak.checkTodayCompletion ===
                "function"
        ) {
            setTimeout(
                () => {
                    window.StudyMindStreak
                        .checkTodayCompletion();
                },
                100
            );
        }

        /*
         * Refresh Score.
         */
        if (
            window.StudyMindScore &&
            typeof window.StudyMindScore.refresh ===
                "function"
        ) {
            window.StudyMindScore.refresh();
        }

        /*
         * Check Rewards.
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
            );

        try {

            const client =
                window.supabaseClient ||
                window.studyMindSupabase;

            if (client) {

                const {
                    data
                } =
                    await client.auth.getUser();

                const user =
                    data?.user;

                const metadata =
                    user?.user_metadata ||
                    {};

                /*
                 * Explicit username is ALWAYS
                 * preferred.
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

        } catch (error) {

            console.warn(
                "StudyMind: Could not load user.",
                error
            );
        }

        username =
            username || "Student";

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

            let timeout;

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
       INITIALIZE
    ========================================================= */

    function initialize() {

        loadPlan();

        currentTopic =
            determineCurrentTopic();

        renderTopic();
        loadNotes();
        setupTimerControls();
        setupChecklist();
        setupButtons();
        loadUser();
        updateTimerUI();

        window.addEventListener(
            "studyMindProgressUpdated",
            renderTopic
        );

        window.addEventListener(
            "studyMindTimerCompleted",
            () => {
                updateTimerUI();
                renderTopic();
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
