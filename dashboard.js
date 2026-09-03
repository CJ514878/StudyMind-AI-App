/* =========================================================
   STUDYMIND AI — DASHBOARD.JS
   COMPLETE CORRECTED REPLACEMENT
   =========================================================

   FEATURES
   - Study plan loading
   - Subjects and topics
   - No "Untitled Topic"
   - Topic progress
   - 25 / 45 / 60 minute timer
   - Knowledge checks
   - Exactly 5 questions
   - 60% pass requirement
   - Generate Questions button
   - Retry generation
   - API timeout protection
   - AI daily limit
   - Calendar
   - Schedule
   - Study streak
   - Theme
   - Supabase compatibility
   ========================================================= */


/* =========================================================
   CONFIGURATION
   ========================================================= */

const FREE_QUESTION_LIMIT = 5;

const KNOWLEDGE_CHECK_QUESTION_COUNT = 5;

const KNOWLEDGE_CHECK_PASS_PERCENTAGE = 60;

const DEFAULT_TIMER_MINUTES = 25;

const TIMER_OPTIONS = [25, 45, 60];

const DEFAULT_TIMER_SECONDS =
    DEFAULT_TIMER_MINUTES * 60;

const QUESTION_REQUEST_TIMEOUT = 45000;


/* =========================================================
   STORAGE KEYS
   ========================================================= */

const PLAN_KEY =
    "studyMindPlan";

const COMPATIBILITY_PLAN_KEY =
    "studyData";

const COMPLETED_TOPICS_KEY =
    "studyMindCompletedTopics";

const COMPLETED_QUESTIONS_KEY =
    "studyMindCompletedQuestionTopics";

const CURRENT_TOPIC_KEY =
    "studyMindCurrentTopicIndex";

const TOPIC_QUESTIONS_KEY =
    "studyMindTopicQuestions";

const TIMER_SECONDS_KEY =
    "studyMindTimerSeconds";

const TIMER_DURATION_KEY =
    "studyMindSelectedTimerSeconds";

const TIMER_RUNNING_KEY =
    "studyMindTimerRunning";

const THEME_KEY =
    "studyMindTheme";

const AI_QUESTION_COUNT_KEY =
    "aiQuestionCount";

const AI_QUESTION_DATE_KEY =
    "aiQuestionDate";

const STREAK_KEY =
    "studyMindStreak";

const LAST_STUDY_DATE_KEY =
    "lastStudyDate";


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let currentUser = null;

let studyPlan = null;

let normalizedSubjects = [];

let allTopics = [];

let completedTopics = [];

let completedQuestionTopics = [];

let currentTopicIndex = 0;

let topicQuestions = {};

let activeKnowledgeCheckTopicKey = null;

let knowledgeCheckGenerating = false;

let knowledgeCheckRequestId = 0;

let timerSeconds =
    DEFAULT_TIMER_SECONDS;

let selectedTimerSeconds =
    DEFAULT_TIMER_SECONDS;

let timerInterval = null;

let timerRunning = false;

let currentCalendarDate =
    new Date();


/* =========================================================
   ELEMENT SHORTCUT
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   SAFE STORAGE
   ========================================================= */

function readJSON(key, fallback) {

    try {

        const value =
            localStorage.getItem(key);

        if (!value) {
            return fallback;
        }

        return JSON.parse(value);

    } catch (error) {

        console.warn(
            "StudyMind storage read error:",
            key,
            error
        );

        return fallback;
    }
}


function writeJSON(key, value) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

        return true;

    } catch (error) {

        console.warn(
            "StudyMind storage write error:",
            key,
            error
        );

        return false;
    }
}


/* =========================================================
   TEXT HELPERS
   ========================================================= */

function cleanText(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/\s+/g, " ")
        .trim();
}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   TOPIC NORMALIZATION
   ========================================================= */

function normalizeTopic(
    topic,
    subjectName = ""
) {

    if (typeof topic === "string") {

        const name =
            cleanText(topic);

        if (!name) {
            return null;
        }

        return {

            id:
                `${cleanText(subjectName)}::${name}`
                    .toLowerCase(),

            name,

            subject:
                cleanText(subjectName),

            description:
                `Study ${name} and complete the knowledge check.`,

            raw:
                topic
        };
    }


    if (
        !topic ||
        typeof topic !== "object"
    ) {
        return null;
    }


    const name =
        cleanText(
            topic.name ||
            topic.topic ||
            topic.title ||
            topic.label ||
            topic.topicName
        );


    if (!name) {
        return null;
    }


    const subject =
        cleanText(
            topic.subject ||
            topic.subjectName ||
            topic.course ||
            topic.subject_title ||
            subjectName
        );


    const description =
        cleanText(
            topic.description ||
            topic.desc ||
            topic.details
        ) ||
        `Study ${name} and complete the knowledge check.`;


    const id =
        cleanText(
            topic.id ||
            topic.topicId ||
            topic.key
        ) ||
        `${subject}::${name}`;


    return {

        id: String(id),

        name,

        subject,

        description,

        raw: topic
    };
}


/* =========================================================
   SUBJECT NORMALIZATION
   ========================================================= */

function normalizeSubject(subject) {

    if (typeof subject === "string") {

        const name =
            cleanText(subject);

        if (!name) {
            return null;
        }

        return {
            name,
            topics: []
        };
    }


    if (
        !subject ||
        typeof subject !== "object"
    ) {
        return null;
    }


    const name =
        cleanText(
            subject.name ||
            subject.subject ||
            subject.title ||
            subject.subjectName ||
            subject.course
        );


    if (!name) {
        return null;
    }


    let rawTopics =
        subject.topics ||
        subject.topicList ||
        subject.lessons ||
        subject.modules ||
        [];


    if (typeof rawTopics === "string") {

        rawTopics =
            rawTopics
                .split(/\n|,/)
                .map(item => item.trim())
                .filter(Boolean);
    }


    if (!Array.isArray(rawTopics)) {
        rawTopics = [];
    }


    const topics =
        rawTopics
            .map(topic =>
                normalizeTopic(
                    topic,
                    name
                )
            )
            .filter(Boolean);


    return {
        name,
        topics
    };
}


/* =========================================================
   PLAN NORMALIZATION
   ========================================================= */

function normalizePlan(rawPlan) {

    if (!rawPlan) {
        return null;
    }


    let plan =
        rawPlan;


    if (
        plan.studyPlan &&
        typeof plan.studyPlan === "object"
    ) {
        plan = plan.studyPlan;
    }


    if (
        plan.plan &&
        typeof plan.plan === "object"
    ) {
        plan = plan.plan;
    }


    let rawSubjects =
        plan.subjects ||
        plan.subjectList ||
        plan.courses ||
        plan.classes ||
        [];


    if (typeof rawSubjects === "string") {

        rawSubjects =
            rawSubjects
                .split(/\n|,/)
                .map(item => item.trim())
                .filter(Boolean);
    }


    if (!Array.isArray(rawSubjects)) {
        rawSubjects = [];
    }


    /*
     * Direct topic-array compatibility.
     */

    if (
        rawSubjects.length === 0 &&
        Array.isArray(plan.topics)
    ) {

        const grouped = {};


        plan.topics.forEach(topic => {

            const normalized =
                normalizeTopic(
                    topic,
                    topic?.subject ||
                    topic?.subjectName ||
                    ""
                );


            if (!normalized) {
                return;
            }


            const subjectName =
                normalized.subject ||
                "General";


            if (!grouped[subjectName]) {
                grouped[subjectName] = [];
            }


            grouped[subjectName].push(
                normalized
            );
        });


        rawSubjects =
            Object.entries(grouped)
                .map(
                    ([name, topics]) => ({
                        name,
                        topics
                    })
                );
    }


    const subjects =
        rawSubjects
            .map(normalizeSubject)
            .filter(Boolean);


    subjects.forEach(subject => {

        subject.topics =
            (subject.topics || [])
                .map(topic =>
                    normalizeTopic(
                        topic,
                        subject.name
                    )
                )
                .filter(Boolean);

    });


    return {
        ...plan,
        subjects
    };
}


/* =========================================================
   LOAD STUDY PLAN
   ========================================================= */

function loadStudyPlan() {

    let rawPlan =
        readJSON(
            PLAN_KEY,
            null
        );


    if (!rawPlan) {

        rawPlan =
            readJSON(
                COMPATIBILITY_PLAN_KEY,
                null
            );
    }


    if (!rawPlan) {

        studyPlan = null;
        normalizedSubjects = [];
        allTopics = [];

        return;
    }


    studyPlan =
        normalizePlan(rawPlan);


    if (!studyPlan) {

        normalizedSubjects = [];
        allTopics = [];

        return;
    }


    normalizedSubjects =
        studyPlan.subjects || [];


    allTopics = [];


    normalizedSubjects.forEach(
        subject => {

            (subject.topics || [])
                .forEach(topic => {

                    const normalized =
                        normalizeTopic(
                            topic,
                            subject.name
                        );


                    if (!normalized) {
                        return;
                    }


                    if (!normalized.subject) {

                        normalized.subject =
                            subject.name;
                    }


                    allTopics.push(
                        normalized
                    );
                });
        }
    );


    writeJSON(
        PLAN_KEY,
        studyPlan
    );


    writeJSON(
        COMPATIBILITY_PLAN_KEY,
        studyPlan
    );


    const savedIndex =
        Number(
            localStorage.getItem(
                CURRENT_TOPIC_KEY
            )
        );


    if (
        Number.isInteger(savedIndex) &&
        savedIndex >= 0 &&
        allTopics.length
    ) {

        currentTopicIndex =
            Math.min(
                savedIndex,
                allTopics.length - 1
            );

    } else {

        currentTopicIndex = 0;
    }


    const firstIncompleteIndex =
        allTopics.findIndex(
            topic =>
                !isTopicCompleted(topic)
        );


    if (firstIncompleteIndex !== -1) {

        currentTopicIndex =
            firstIncompleteIndex;
    }


    saveCurrentTopicIndex();
}


/* =========================================================
   COMPLETION STORAGE
   ========================================================= */

function loadCompletionState() {

    completedTopics =
        readJSON(
            COMPLETED_TOPICS_KEY,
            []
        );


    completedQuestionTopics =
        readJSON(
            COMPLETED_QUESTIONS_KEY,
            []
        );


    topicQuestions =
        readJSON(
            TOPIC_QUESTIONS_KEY,
            {}
        );


    if (!Array.isArray(completedTopics)) {
        completedTopics = [];
    }


    if (!Array.isArray(completedQuestionTopics)) {
        completedQuestionTopics = [];
    }


    if (
        !topicQuestions ||
        typeof topicQuestions !== "object" ||
        Array.isArray(topicQuestions)
    ) {

        /*
         * Compatibility with an older version
         * that stored one question array.
         */

        if (
            Array.isArray(topicQuestions) &&
            allTopics.length
        ) {

            const firstTopic =
                allTopics[0];

            if (firstTopic) {

                topicQuestions[
                    getTopicKey(firstTopic)
                ] = topicQuestions;
            }

        } else {

            topicQuestions = {};
        }
    }
}


function saveCompletionState() {

    writeJSON(
        COMPLETED_TOPICS_KEY,
        completedTopics
    );


    writeJSON(
        COMPLETED_QUESTIONS_KEY,
        completedQuestionTopics
    );


    writeJSON(
        TOPIC_QUESTIONS_KEY,
        topicQuestions
    );
}


/* =========================================================
   TOPIC KEY
   ========================================================= */

function getTopicKey(topic) {

    if (!topic) {
        return "";
    }


    return String(
        topic.id ||
        `${topic.subject || ""}::${topic.name || ""}`
    )
        .toLowerCase()
        .trim();
}


/* =========================================================
   COMPLETION
   ========================================================= */

function isTopicCompleted(topic) {

    const key =
        getTopicKey(topic);


    if (!key) {
        return false;
    }


    return completedTopics.some(
        item =>
            String(item)
                .toLowerCase()
                .trim() === key
    );
}


function isKnowledgeCheckCompleted(topic) {

    const key =
        getTopicKey(topic);


    if (!key) {
        return false;
    }


    return completedQuestionTopics.some(
        item =>
            String(item)
                .toLowerCase()
                .trim() === key
    );
}


function markTopicCompleted(topic) {

    const key =
        getTopicKey(topic);


    if (!key) {
        return;
    }


    if (!completedTopics.includes(key)) {

        completedTopics.push(key);

        saveCompletionState();
    }
}


function markKnowledgeCheckCompleted(topic) {

    const key =
        getTopicKey(topic);


    if (!key) {
        return;
    }


    if (
        !completedQuestionTopics.includes(key)
    ) {

        completedQuestionTopics.push(key);

        saveCompletionState();
    }
}


/* =========================================================
   CURRENT TOPIC
   ========================================================= */

function getCurrentTopic() {

    if (!allTopics.length) {
        return null;
    }


    const firstIncomplete =
        allTopics.findIndex(
            topic =>
                !isTopicCompleted(topic)
        );


    if (firstIncomplete !== -1) {

        currentTopicIndex =
            firstIncomplete;

        saveCurrentTopicIndex();

        return allTopics[
            currentTopicIndex
        ];
    }


    currentTopicIndex =
        Math.min(
            currentTopicIndex,
            allTopics.length - 1
        );


    return allTopics[
        currentTopicIndex
    ];
}


function saveCurrentTopicIndex() {

    localStorage.setItem(
        CURRENT_TOPIC_KEY,
        String(currentTopicIndex)
    );
}


function getNextIncompleteTopic() {

    return (
        allTopics.find(
            topic =>
                !isTopicCompleted(topic)
        ) || null
    );
}


/* =========================================================
   PROGRESS
   ========================================================= */

function getProgressPercentage() {

    if (!allTopics.length) {
        return 0;
    }


    const completedCount =
        allTopics.filter(
            isTopicCompleted
        ).length;


    return Math.round(
        (
            completedCount /
            allTopics.length
        ) * 100
    );
}


/* =========================================================
   DOM HELPERS
   ========================================================= */

function setText(id, value) {

    const element =
        $(id);


    if (!element) {
        return;
    }


    element.textContent =
        value ?? "";
}


function setHTML(id, value) {

    const element =
        $(id);


    if (!element) {
        return;
    }


    element.innerHTML =
        value ?? "";
}


/* =========================================================
   DASHBOARD SUMMARY
   ========================================================= */

function renderDashboardSummary() {

    const totalSubjects =
        normalizedSubjects.length;


    const totalTopics =
        allTopics.length;


    const completedCount =
        allTopics.filter(
            isTopicCompleted
        ).length;


    const progress =
        getProgressPercentage();


    [
        "subjectCount",
        "totalSubjects"
    ].forEach(id =>
        setText(
            id,
            totalSubjects
        )
    );


    [
        "topicCount",
        "totalTopics"
    ].forEach(id =>
        setText(
            id,
            totalTopics
        )
    );


    [
        "completedTopicCount",
        "completedTopics"
    ].forEach(id =>
        setText(
            id,
            completedCount
        )
    );


    [
        "progressPercentage",
        "progressPercent",
        "studyProgressPercent"
    ].forEach(id =>
        setText(
            id,
            `${progress}%`
        )
    );


    [
        "progressBar",
        "studyProgressBar"
    ].forEach(id => {

        const element =
            $(id);


        if (!element) {
            return;
        }


        element.style.width =
            `${progress}%`;
    });
}


/* =========================================================
   CURRENT TOPIC RENDER
   ========================================================= */

function renderCurrentTopic() {

    const topic =
        getCurrentTopic();


    if (!topic) {

        renderEmptyDashboard();

        return;
    }


    const topicPosition =
        currentTopicIndex + 1;


    setText(
        "currentTopicName",
        topic.name
    );


    setText(
        "currentTopicDescription",
        topic.description ||
        `Study ${topic.name} and complete the knowledge check.`
    );


    setText(
        "currentSubjectName",
        topic.subject ||
        "Subject"
    );


    setText(
        "currentTopicSubject",
        topic.subject ||
        "Subject"
    );


    setText(
        "topicPosition",
        `TOPIC ${topicPosition} OF ${allTopics.length}`
    );


    const statusBadge =
        $("topicStatusBadge");


    if (statusBadge) {

        const completed =
            isTopicCompleted(topic);


        statusBadge.textContent =
            completed
                ? "COMPLETED"
                : "IN PROGRESS";


        statusBadge.classList.toggle(
            "completed",
            completed
        );


        statusBadge.classList.toggle(
            "in-progress",
            !completed
        );
    }


    const checkbox =
        $("topicCompleteCheckbox");


    if (checkbox) {

        checkbox.checked =
            isTopicCompleted(topic);


        checkbox.disabled =
            isTopicCompleted(topic);
    }


    const message =
        $("topicCompletionMessage");


    if (message) {

        message.textContent =
            isTopicCompleted(topic)
                ? "Topic completed. Complete the knowledge check below."
                : "Study this topic, then mark it complete to unlock the knowledge check.";
    }


    const nextMessage =
        $("nextTopicMessage");


    if (nextMessage) {

        const nextTopic =
            getNextIncompleteTopic();


        if (
            nextTopic &&
            getTopicKey(nextTopic) !==
                getTopicKey(topic)
        ) {

            nextMessage.textContent =
                `Next: ${nextTopic.name}`;

        } else if (
            allTopics.length &&
            allTopics.every(
                isTopicCompleted
            )
        ) {

            nextMessage.textContent =
                "You have completed every topic in this study plan.";

        } else {

            nextMessage.textContent =
                "";
        }
    }


    renderTopicList();

    renderDashboardSummary();
}


/* =========================================================
   EMPTY DASHBOARD
   ========================================================= */

function renderEmptyDashboard() {

    setText(
        "currentTopicName",
        "No Topic Available"
    );


    setText(
        "currentTopicDescription",
        "Create a study plan with subjects and topics to begin studying."
    );


    setText(
        "topicPosition",
        "TOPIC 0 OF 0"
    );


    setText(
        "currentSubjectName",
        "No Subject"
    );


    setText(
        "currentTopicSubject",
        "No Subject"
    );


    const status =
        $("topicStatusBadge");


    if (status) {

        status.textContent =
            "WAITING FOR STUDY PLAN";
    }


    renderDashboardSummary();

    renderTopicList();
}


/* =========================================================
   TOPIC LIST
   ========================================================= */

function renderTopicList() {

    const container =
        $("topicList") ||
        $("topicsList") ||
        $("dashboardTopicList");


    if (!container) {
        return;
    }


    if (!allTopics.length) {

        container.innerHTML = `
            <div class="empty-state">
                <strong>No topics yet</strong>
                <p>Create a study plan with subjects and topics to see them here.</p>
            </div>
        `;

        return;
    }


    container.innerHTML =
        allTopics
            .map(
                (topic, index) => {

                    const completed =
                        isTopicCompleted(topic);


                    const active =
                        index ===
                        currentTopicIndex;


                    return `
                        <button
                            type="button"
                            class="dashboard-topic-item ${
                                active
                                    ? "active"
                                    : ""
                            } ${
                                completed
                                    ? "completed"
                                    : ""
                            }"
                            data-topic-index="${index}"
                        >

                            <span class="topic-item-number">
                                ${index + 1}
                            </span>

                            <span class="topic-item-content">

                                <strong>
                                    ${escapeHTML(
                                        topic.name
                                    )}
                                </strong>

                                <small>
                                    ${escapeHTML(
                                        topic.subject ||
                                        "Subject"
                                    )}
                                </small>

                            </span>

                            <span class="topic-item-status">
                                ${
                                    completed
                                        ? "✓"
                                        : active
                                            ? "→"
                                            : ""
                                }
                            </span>

                        </button>
                    `;
                }
            )
            .join("");


    container
        .querySelectorAll(
            "[data-topic-index]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.dataset
                                .topicIndex
                        );


                    if (
                        !Number.isInteger(index) ||
                        !allTopics[index]
                    ) {
                        return;
                    }


                    currentTopicIndex =
                        index;


                    saveCurrentTopicIndex();

                    renderCurrentTopic();

                    hideKnowledgeCheck();
                }
            );
        });
}


/* =========================================================
   COMPLETE TOPIC
   ========================================================= */

function completeCurrentTopic() {

    /*
     * IMPORTANT:
     * Find the actual displayed topic using the
     * current index instead of allowing
     * getCurrentTopic() to jump to another topic.
     */

    const topic =
        allTopics[currentTopicIndex] ||
        getCurrentTopic();


    if (!topic) {
        return;
    }


    activeKnowledgeCheckTopicKey =
        getTopicKey(topic);


    if (!isTopicCompleted(topic)) {

        markTopicCompleted(topic);

        updateStreak();
    }


    /*
     * Show knowledge check BEFORE moving to the
     * next topic.
     */

    showKnowledgeCheck(topic);


    /*
     * Move dashboard pointer to next incomplete topic
     * only after the knowledge check has been opened.
     */

    const nextIndex =
        allTopics.findIndex(
            candidate =>
                !isTopicCompleted(candidate)
        );


    if (nextIndex !== -1) {

        currentTopicIndex =
            nextIndex;
    }


    saveCurrentTopicIndex();

    renderCurrentTopic();

    renderDashboardSummary();


    /*
     * Re-open the exact knowledge check.
     */

    showKnowledgeCheck(topic);
}


/* =========================================================
   KNOWLEDGE CHECK TOPIC
   ========================================================= */

function getKnowledgeCheckTopic() {

    if (!activeKnowledgeCheckTopicKey) {
        return null;
    }


    return (
        allTopics.find(
            topic =>
                getTopicKey(topic) ===
                activeKnowledgeCheckTopicKey
        ) || null
    );
}


/* =========================================================
   HIDE KNOWLEDGE CHECK
   ========================================================= */

function hideKnowledgeCheck() {

    const section =
        $("knowledgeCheckSection") ||
        $("knowledgeCheck");


    if (!section) {
        return;
    }


    section.style.display =
        "none";
}


/* =========================================================
   ENSURE KNOWLEDGE CHECK SECTION
   ========================================================= */

function ensureKnowledgeCheckSection() {

    let section =
        $("knowledgeCheckSection") ||
        $("knowledgeCheck");


    /*
     * If the existing HTML has no section at all,
     * create one automatically.
     */

    if (!section) {

        const main =
            document.querySelector(
                "main"
            ) ||
            document.body;


        section =
            document.createElement(
                "section"
            );


        section.id =
            "knowledgeCheckSection";


        section.className =
            "knowledge-check-section";


        section.style.marginTop =
            "24px";


        main.appendChild(
            section
        );
    }


    return section;
}


/* =========================================================
   SHOW KNOWLEDGE CHECK
   ========================================================= */

function showKnowledgeCheck(topic) {

    if (!topic) {
        return;
    }


    activeKnowledgeCheckTopicKey =
        getTopicKey(topic);


    const section =
        ensureKnowledgeCheckSection();


    section.style.display =
        "";


    setText(
        "knowledgeCheckTopicName",
        topic.name
    );


    setText(
        "knowledgeCheckTopic",
        topic.name
    );


    setText(
        "knowledgeCheckSubject",
        topic.subject || ""
    );


    const key =
        getTopicKey(topic);


    const cached =
        topicQuestions[key];


    if (
        isKnowledgeCheckCompleted(topic)
    ) {

        renderKnowledgeCheckCompleted(
            topic
        );

        return;
    }


    if (
        Array.isArray(cached) &&
        cached.length >=
            KNOWLEDGE_CHECK_QUESTION_COUNT
    ) {

        renderKnowledgeCheckQuestions(
            topic,
            cached
        );

        return;
    }


    renderGenerateQuestionsPrompt(
        topic
    );
}


/* =========================================================
   GENERATE QUESTIONS PROMPT
   ========================================================= */

function renderGenerateQuestionsPrompt(
    topic
) {

    const container =
        $("knowledgeCheckContent") ||
        $("knowledgeCheckQuestions");


    if (!container) {

        const section =
            ensureKnowledgeCheckSection();


        const newContainer =
            document.createElement(
                "div"
            );


        newContainer.id =
            "knowledgeCheckContent";


        section.appendChild(
            newContainer
        );


        renderGenerateQuestionsPrompt(
            topic
        );


        return;
    }


    container.innerHTML = `

        <div class="knowledge-check-start">

            <span class="knowledge-check-badge">
                KNOWLEDGE CHECK
            </span>

            <h3>
                Ready for your knowledge check?
            </h3>

            <p>
                StudyMind AI will generate exactly
                5 questions about
                <strong>
                    ${escapeHTML(topic.name)}
                </strong>.
            </p>

            <p>
                You need at least 60% to pass.
            </p>

            <button
                type="button"
                id="generateQuestionsButton"
                class="knowledge-check-submit"
            >
                Generate 5 Questions
            </button>

            <div
                id="knowledgeCheckStatus"
                class="knowledge-check-status"
                style="display:none;"
            ></div>

        </div>
    `;


    const button =
        $("generateQuestionsButton");


    if (button) {

        button.addEventListener(
            "click",
            () =>
                generateTopicQuestions(
                    topic,
                    true
                )
        );
    }
}


/* =========================================================
   GENERATE QUESTIONS
   ========================================================= */

async function generateTopicQuestions(
    topic,
    forceRetry = false
) {

    if (!topic) {
        return;
    }


    const topicKey =
        getTopicKey(topic);


    if (!topicKey) {
        return;
    }


    if (
        knowledgeCheckGenerating &&
        !forceRetry
    ) {
        return;
    }


    /*
     * Daily limit.
     *
     * A knowledge check generation counts as
     * one AI question request.
     */

    if (!canAskAIQuestion()) {

        showKnowledgeCheckLimitMessage(
            topic
        );

        return;
    }


    knowledgeCheckGenerating =
        true;


    const requestId =
        ++knowledgeCheckRequestId;


    activeKnowledgeCheckTopicKey =
        topicKey;


    const container =
        $("knowledgeCheckContent") ||
        $("knowledgeCheckQuestions");


    if (container) {

        container.innerHTML = `

            <div class="knowledge-check-loading">

                <div
                    class="loading-spinner"
                    aria-hidden="true"
                ></div>

                <h3>
                    Preparing 5 questions...
                </h3>

                <p>
                    StudyMind AI is creating questions
                    for
                    <strong>
                        ${escapeHTML(topic.name)}
                    </strong>.
                </p>

                <p id="knowledgeCheckStatus">
                    Connecting to the AI question server...
                </p>

                <button
                    type="button"
                    id="knowledgeCheckRetry"
                    class="knowledge-check-retry"
                    style="display:none;"
                >
                    Try Again
                </button>

            </div>
        `;


        const retry =
            $("knowledgeCheckRetry");


        if (retry) {

            retry.addEventListener(
                "click",
                () =>
                    generateTopicQuestions(
                        topic,
                        true
                    )
            );
        }
    }


    const controller =
        new AbortController();


    const timeout =
        setTimeout(
            () => {
                controller.abort();
            },
            QUESTION_REQUEST_TIMEOUT
        );


    try {

        const status =
            $("knowledgeCheckStatus");


        if (status) {

            status.textContent =
                "Generating your questions...";
        }


        console.log(
            "Generating knowledge check:",
            {
                subject:
                    topic.subject,
                topic:
                    topic.name
            }
        );


        const response =
            await fetch(
                "/api/generate-questions",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            subject:
                                topic.subject ||
                                "Senior Secondary",

                            topic:
                                topic.name,

                            numberOfQuestions:
                                KNOWLEDGE_CHECK_QUESTION_COUNT,

                            questionCount:
                                KNOWLEDGE_CHECK_QUESTION_COUNT,

                            count:
                                KNOWLEDGE_CHECK_QUESTION_COUNT,

                            curriculum:
                                "Nigerian Senior Secondary curriculum",

                            difficulty:
                                "mixed",

                            type:
                                "knowledge_check",

                            requestType:
                                "knowledge_check"
                        }),

                    signal:
                        controller.signal
                }
            );


        const rawText =
            await response.text();


        let data =
            null;


        if (rawText) {

            try {

                data =
                    JSON.parse(
                        rawText
                    );

            } catch (error) {

                console.error(
                    "Invalid JSON from generate-questions:",
                    rawText
                );

                throw new Error(
                    "The question server returned an invalid response."
                );
            }
        }


        if (!response.ok) {

            const serverError =
                data?.error ||
                data?.message ||
                data?.details ||
                `Question API returned ${response.status}`;


            throw new Error(
                serverError
            );
        }


        const questions =
            extractQuestions(
                data
            );


        console.log(
            "Questions received:",
            questions
        );


        if (
            !Array.isArray(questions) ||
            questions.length <
                KNOWLEDGE_CHECK_QUESTION_COUNT
        ) {

            throw new Error(
                `The AI returned ${
                    Array.isArray(questions)
                        ? questions.length
                        : 0
                } questions. Exactly 5 valid questions are required.`
            );
        }


        if (
            requestId !==
            knowledgeCheckRequestId
        ) {
            return;
        }


        const normalizedQuestions =
            questions
                .map(
                    normalizeQuestion
                )
                .filter(Boolean)
                .slice(
                    0,
                    KNOWLEDGE_CHECK_QUESTION_COUNT
                );


        if (
            normalizedQuestions.length <
                KNOWLEDGE_CHECK_QUESTION_COUNT
        ) {

            throw new Error(
                "The AI returned questions in an unsupported format."
            );
        }


        topicQuestions[topicKey] =
            normalizedQuestions;


        saveCompletionState();


        /*
         * Only count a successful generation.
         */

        incrementAIQuestionCount();


        renderKnowledgeCheckQuestions(
            topic,
            normalizedQuestions
        );


    } catch (error) {

        console.error(
            "StudyMind knowledge check error:",
            error
        );


        if (
            requestId !==
            knowledgeCheckRequestId
        ) {
            return;
        }


        showKnowledgeCheckError(
            topic,
            error
        );


    } finally {

        clearTimeout(
            timeout
        );


        knowledgeCheckGenerating =
            false;
    }
}


/* =========================================================
   QUESTION EXTRACTION
   ========================================================= */

function extractQuestions(data) {

    if (Array.isArray(data)) {
        return data;
    }


    if (!data || typeof data !== "object") {
        return [];
    }


    if (Array.isArray(data.questions)) {
        return data.questions;
    }


    if (
        data.data &&
        Array.isArray(data.data.questions)
    ) {
        return data.data.questions;
    }


    if (
        data.result &&
        Array.isArray(data.result.questions)
    ) {
        return data.result.questions;
    }


    if (
        data.output &&
        Array.isArray(data.output.questions)
    ) {
        return data.output.questions;
    }


    if (
        typeof data.output_text ===
            "string"
    ) {

        try {

            const parsed =
                JSON.parse(
                    data.output_text
                );


            if (
                Array.isArray(
                    parsed.questions
                )
            ) {
                return parsed.questions;
            }

        } catch {
            // Ignore.
        }
    }


    /*
     * Some wrappers may return the JSON
     * directly as a string.
     */

    if (
        typeof data ===
            "string"
    ) {

        try {

            const parsed =
                JSON.parse(data);


            if (
                Array.isArray(
                    parsed.questions
                )
            ) {
                return parsed.questions;
            }

        } catch {
            // Ignore.
        }
    }


    return [];
}


/* =========================================================
   NORMALIZE QUESTION
   ========================================================= */

function normalizeQuestion(
    question
) {

    if (
        !question ||
        typeof question !== "object"
    ) {
        return null;
    }


    const questionText =
        cleanText(
            question.question ||
            question.text ||
            question.prompt
        );


    if (!questionText) {
        return null;
    }


    let options =
        Array.isArray(
            question.options
        )
            ? question.options
            : Array.isArray(
                question.choices
            )
                ? question.choices
                : [];


    options =
        options.map(
            option =>
                cleanText(
                    typeof option === "object"
                        ? (
                            option.text ||
                            option.label ||
                            option.value ||
                            ""
                        )
                        : option
                )
        );


    if (
        options.length !== 4 ||
        options.some(
            option => !option
        )
    ) {
        return null;
    }


    let answerValue =
        question.answer;


    if (
        answerValue === undefined ||
        answerValue === null
    ) {

        answerValue =
            question.correctAnswer;
    }


    if (
        answerValue === undefined ||
        answerValue === null
    ) {

        answerValue =
            question.correct;
    }


    let answerIndex =
        -1;


    /*
     * Numeric answer.
     */

    if (
        typeof answerValue === "number"
    ) {

        answerIndex =
            Number.isInteger(
                answerValue
            )
                ? answerValue
                : -1;
    }


    /*
     * Numeric string.
     */

    if (
        typeof answerValue === "string"
    ) {

        const trimmed =
            answerValue.trim();


        if (/^\d+$/.test(trimmed)) {

            const numeric =
                Number(trimmed);


            if (
                numeric >= 0 &&
                numeric <= 3
            ) {

                answerIndex =
                    numeric;
            }
        }


        const letter =
            trimmed
                .toUpperCase()
                .replace(/[.)]/g, "");


        if (
            letter === "A" ||
            letter === "B" ||
            letter === "C" ||
            letter === "D"
        ) {

            answerIndex =
                {
                    A: 0,
                    B: 1,
                    C: 2,
                    D: 3
                }[letter];
        }
    }


    /*
     * If the answer is actual option text,
     * find its position.
     */

    if (
        answerIndex < 0 ||
        answerIndex > 3
    ) {

        const answerText =
            cleanText(
                answerValue
            ).toLowerCase();


        if (answerText) {

            answerIndex =
                options.findIndex(
                    option =>
                        option
                            .toLowerCase()
                            .trim() ===
                        answerText
                );
        }
    }


    if (
        answerIndex < 0 ||
        answerIndex > 3
    ) {
        return null;
    }


    return {

        question:
            questionText,

        options,

        answer:
            answerIndex,

        correctAnswer:
            options[answerIndex],

        explanation:
            cleanText(
                question.explanation ||
                question.explanationText ||
                ""
            )
    };
}


/* =========================================================
   KNOWLEDGE CHECK COMPLETE
   ========================================================= */

function renderKnowledgeCheckCompleted(
    topic
) {

    const container =
        $("knowledgeCheckContent") ||
        $("knowledgeCheckQuestions");


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="knowledge-check-complete">

            <div class="knowledge-check-icon">
                ✓
            </div>

            <h3>
                Knowledge Check Complete
            </h3>

            <p>
                You successfully completed the
                knowledge check for
                <strong>
                    ${escapeHTML(topic.name)}
                </strong>.
            </p>

        </div>
    `;
}


/* =========================================================
   RENDER QUESTIONS
   ========================================================= */

function renderKnowledgeCheckQuestions(
    topic,
    questions
) {

    const container =
        $("knowledgeCheckContent") ||
        $("knowledgeCheckQuestions");


    if (!container) {
        return;
    }


    if (
        !Array.isArray(questions) ||
        questions.length <
            KNOWLEDGE_CHECK_QUESTION_COUNT
    ) {

        showKnowledgeCheckError(
            topic,
            new Error(
                "Not enough valid questions were returned."
            )
        );

        return;
    }


    const safeQuestions =
        questions.slice(
            0,
            KNOWLEDGE_CHECK_QUESTION_COUNT
        );


    container.innerHTML = `

        <div class="knowledge-check-header">

            <div>

                <span class="knowledge-check-badge">
                    KNOWLEDGE CHECK
                </span>

                <h3>
                    ${escapeHTML(topic.name)}
                </h3>

                <p>
                    Answer all 5 questions.
                    You need at least 60% to pass.
                </p>

            </div>

            <div class="knowledge-check-count">
                5 QUESTIONS
            </div>

        </div>


        <form
            id="knowledgeCheckForm"
            class="knowledge-check-form"
        >

            ${safeQuestions
                .map(
                    (question, index) => `

                        <div
                            class="knowledge-question"
                            data-question-index="${index}"
                        >

                            <div class="knowledge-question-number">
                                QUESTION ${index + 1} OF 5
                            </div>

                            <h4>
                                ${escapeHTML(
                                    question.question
                                )}
                            </h4>

                            <div class="knowledge-options">

                                ${question.options
                                    .map(
                                        (
                                            option,
                                            optionIndex
                                        ) => `

                                            <label
                                                class="knowledge-option"
                                            >

                                                <input
                                                    type="radio"
                                                    name="knowledgeQuestion${index}"
                                                    value="${optionIndex}"
                                                />

                                                <span
                                                    class="knowledge-option-letter"
                                                >
                                                    ${
                                                        [
                                                            "A",
                                                            "B",
                                                            "C",
                                                            "D"
                                                        ][optionIndex]
                                                    }
                                                </span>

                                                <span
                                                    class="knowledge-option-text"
                                                >
                                                    ${escapeHTML(
                                                        option
                                                    )}
                                                </span>

                                            </label>
                                        `
                                    )
                                    .join("")}

                            </div>

                        </div>
                    `
                )
                .join("")}


            <div
                id="knowledgeCheckResult"
                class="knowledge-check-result"
                style="display:none;"
            ></div>


            <button
                type="submit"
                id="submitKnowledgeCheck"
                class="knowledge-check-submit"
            >
                Submit Knowledge Check
            </button>

        </form>
    `;


    const form =
        $("knowledgeCheckForm");


    if (form) {

        form.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                submitKnowledgeCheck(
                    topic
                );
            }
        );
    }
}


/* =========================================================
   QUESTION ERROR
   ========================================================= */

function showKnowledgeCheckError(
    topic,
    error
) {

    const container =
        $("knowledgeCheckContent") ||
        $("knowledgeCheckQuestions");


    if (!container) {
        return;
    }


    let message =
        "We couldn't generate the questions right now.";


    if (
        error?.name ===
        "AbortError"
    ) {

        message =
            "Question generation took too long. Please try again.";
    } else if (
        error?.message
    ) {

        message =
            error.message;
    }


    container.innerHTML = `

        <div class="knowledge-check-loading knowledge-check-failed">

            <div class="knowledge-check-error-icon">
                !
            </div>

            <h3>
                We couldn't prepare the questions
            </h3>

            <p>
                ${escapeHTML(message)}
            </p>

            <button
                type="button"
                id="knowledgeCheckRetry"
                class="knowledge-check-retry"
            >
                Generate Questions Again
            </button>

        </div>
    `;


    const retry =
        $("knowledgeCheckRetry");


    if (retry) {

        retry.addEventListener(
            "click",
            () =>
                generateTopicQuestions(
                    topic,
                    true
                )
        );
    }
}


/* =========================================================
   LIMIT MESSAGE
   ========================================================= */

function showKnowledgeCheckLimitMessage(
    topic
) {

    const container =
        $("knowledgeCheckContent") ||
        $("knowledgeCheckQuestions");


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="knowledge-check-loading">

            <h3>
                Daily AI limit reached
            </h3>

            <p>
                You've used your
                ${FREE_QUESTION_LIMIT}
                free AI requests for today.
            </p>

            <p>
                You can continue studying your
                existing questions or use more AI
                access with Premium.
            </p>

        </div>
    `;
}


/* =========================================================
   SUBMIT KNOWLEDGE CHECK
   ========================================================= */

function submitKnowledgeCheck(
    suppliedTopic = null
) {

    const topic =
        suppliedTopic ||
        getKnowledgeCheckTopic();


    if (!topic) {

        console.error(
            "Unable to determine knowledge-check topic."
        );

        return;
    }


    const topicKey =
        getTopicKey(topic);


    const questions =
        topicQuestions[
            topicKey
        ];


    if (
        !Array.isArray(questions) ||
        questions.length <
            KNOWLEDGE_CHECK_QUESTION_COUNT
    ) {

        showKnowledgeCheckError(
            topic,
            new Error(
                "Knowledge-check questions are not available."
            )
        );

        return;
    }


    const form =
        $("knowledgeCheckForm");


    if (!form) {
        return;
    }


    const submitButton =
        $("submitKnowledgeCheck");


    if (
        submitButton &&
        submitButton.disabled
    ) {
        return;
    }


    let score = 0;

    let unanswered = 0;


    questions
        .slice(
            0,
            KNOWLEDGE_CHECK_QUESTION_COUNT
        )
        .forEach(
            (
                question,
                index
            ) => {

                const selected =
                    form.querySelector(
                        `input[name="knowledgeQuestion${index}"]:checked`
                    );


                if (!selected) {

                    unanswered++;

                    return;
                }


                const selectedIndex =
                    Number(
                        selected.value
                    );


                const correctIndex =
                    Number(
                        question.answer
                    );


                if (
                    selectedIndex ===
                    correctIndex
                ) {

                    score++;
                }
            }
        );


    if (unanswered > 0) {

        showKnowledgeCheckResult(
            "Please answer all 5 questions before submitting.",
            false
        );

        return;
    }


    const percentage =
        Math.round(
            (
                score /
                KNOWLEDGE_CHECK_QUESTION_COUNT
            ) * 100
        );


    const passed =
        percentage >=
        KNOWLEDGE_CHECK_PASS_PERCENTAGE;


    if (passed) {

        markKnowledgeCheckCompleted(
            topic
        );


        showKnowledgeCheckResult(
            `You scored ${score}/5 (${percentage}%). You passed the knowledge check!`,
            true
        );


        if (submitButton) {

            submitButton.disabled =
                true;

            submitButton.textContent =
                "Knowledge Check Passed";
        }


        renderDashboardSummary();


    } else {

        showKnowledgeCheckResult(
            `You scored ${score}/5 (${percentage}%). You need at least 60% to pass. Review the topic and try again.`,
            false
        );


        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                "Try Again";
        }
    }
}


/* =========================================================
   RESULT
   ========================================================= */

function showKnowledgeCheckResult(
    message,
    passed
) {

    const result =
        $("knowledgeCheckResult");


    if (!result) {
        return;
    }


    result.style.display =
        "";


    result.className =
        `knowledge-check-result ${
            passed
                ? "passed"
                : "failed"
        }`;


    result.innerHTML = `

        <div class="knowledge-result-icon">
            ${
                passed
                    ? "✓"
                    : "!"
            }
        </div>

        <div>
            ${escapeHTML(message)}
        </div>
    `;


    result.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


/* =========================================================
   TIMER
   ========================================================= */

function loadTimerState() {

    const savedDuration =
        Number(
            localStorage.getItem(
                TIMER_DURATION_KEY
            )
        );


    const savedMinutes =
        Math.round(
            savedDuration / 60
        );


    if (
        TIMER_OPTIONS.includes(
            savedMinutes
        )
    ) {

        selectedTimerSeconds =
            savedDuration;

    } else {

        selectedTimerSeconds =
            DEFAULT_TIMER_SECONDS;
    }


    const savedSeconds =
        Number(
            localStorage.getItem(
                TIMER_SECONDS_KEY
            )
        );


    if (
        Number.isFinite(savedSeconds) &&
        savedSeconds >= 0 &&
        savedSeconds <=
            selectedTimerSeconds
    ) {

        timerSeconds =
            Math.floor(
                savedSeconds
            );

    } else {

        timerSeconds =
            selectedTimerSeconds;
    }


    timerRunning =
        false;


    localStorage.setItem(
        TIMER_RUNNING_KEY,
        "false"
    );


    renderTimer();
}


function selectTimerDuration(
    minutes
) {

    const numericMinutes =
        Number(minutes);


    if (
        !TIMER_OPTIONS.includes(
            numericMinutes
        )
    ) {
        return;
    }


    stopTimer();


    selectedTimerSeconds =
        numericMinutes * 60;


    timerSeconds =
        selectedTimerSeconds;


    localStorage.setItem(
        TIMER_DURATION_KEY,
        String(
            selectedTimerSeconds
        )
    );


    localStorage.setItem(
        TIMER_SECONDS_KEY,
        String(
            timerSeconds
        )
    );


    renderTimer();

    renderTimerButtons();
}


function formatTime(seconds) {

    const safeSeconds =
        Math.max(
            0,
            Math.floor(
                Number(seconds) || 0
            )
        );


    const minutes =
        Math.floor(
            safeSeconds / 60
        );


    const remainingSeconds =
        safeSeconds % 60;


    return `${String(minutes).padStart(2, "0")}:${String(
        remainingSeconds
    ).padStart(2, "0")}`;
}


function renderTimer() {

    const formatted =
        formatTime(
            timerSeconds
        );


    [
        "studyTimer",
        "timerDisplay",
        "studyTimerDisplay",
        "timer"
    ].forEach(id => {

        const element =
            $(id);


        if (!element) {
            return;
        }


        element.textContent =
            formatted;
    });


    const progress =
        selectedTimerSeconds > 0
            ? (
                (
                    selectedTimerSeconds -
                    timerSeconds
                ) /
                selectedTimerSeconds
            ) * 100
            : 0;


    [
        "timerProgress",
        "studyTimerProgress"
    ].forEach(id => {

        const element =
            $(id);


        if (!element) {
            return;
        }


        element.style.width =
            `${Math.min(
                Math.max(
                    progress,
                    0
                ),
                100
            )}%`;
    });


    const status =
        $("timerStatus");


    if (status) {

        if (timerRunning) {

            status.textContent =
                "STUDYING";

        } else if (
            timerSeconds === 0
        ) {

            status.textContent =
                "TIME COMPLETE";

        } else {

            status.textContent =
                "READY";
        }
    }
}


function renderTimerButtons() {

    document
        .querySelectorAll(
            "[data-timer-minutes]"
        )
        .forEach(button => {

            const minutes =
                Number(
                    button.dataset
                        .timerMinutes
                );


            button.classList.toggle(
                "active",
                minutes ===
                Math.round(
                    selectedTimerSeconds /
                    60
                )
            );
        });
}


function startTimer() {

    if (timerRunning) {
        return;
    }


    if (timerSeconds <= 0) {

        timerSeconds =
            selectedTimerSeconds;
    }


    timerRunning =
        true;


    localStorage.setItem(
        TIMER_RUNNING_KEY,
        "true"
    );


    if (timerInterval) {

        clearInterval(
            timerInterval
        );
    }


    timerInterval =
        setInterval(
            () => {

                if (
                    timerSeconds <= 0
                ) {

                    finishTimer();

                    return;
                }


                timerSeconds--;


                localStorage.setItem(
                    TIMER_SECONDS_KEY,
                    String(
                        timerSeconds
                    )
                );


                renderTimer();

            },
            1000
        );


    renderTimer();
}


function pauseTimer() {

    if (!timerRunning) {
        return;
    }


    timerRunning =
        false;


    if (timerInterval) {

        clearInterval(
            timerInterval
        );

        timerInterval =
            null;
    }


    localStorage.setItem(
        TIMER_RUNNING_KEY,
        "false"
    );


    localStorage.setItem(
        TIMER_SECONDS_KEY,
        String(
            timerSeconds
        )
    );


    renderTimer();
}


function stopTimer() {

    timerRunning =
        false;


    if (timerInterval) {

        clearInterval(
            timerInterval
        );

        timerInterval =
            null;
    }


    localStorage.setItem(
        TIMER_RUNNING_KEY,
        "false"
    );
}


function resetTimer() {

    stopTimer();


    timerSeconds =
        selectedTimerSeconds;


    localStorage.setItem(
        TIMER_SECONDS_KEY,
        String(
            timerSeconds
        )
    );


    renderTimer();
}


function finishTimer() {

    stopTimer();


    timerSeconds =
        0;


    localStorage.setItem(
        TIMER_SECONDS_KEY,
        "0"
    );


    renderTimer();

    updateStreak();


    document.dispatchEvent(
        new CustomEvent(
            "studyMindTimerComplete"
        )
    );
}


/* =========================================================
   TIMER EVENTS
   ========================================================= */

function bindTimerEvents() {

    [
        "startTimer",
        "startStudyTimer",
        "timerStart"
    ].forEach(id => {

        const button =
            $(id);


        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            startTimer
        );
    });


    [
        "pauseTimer",
        "pauseStudyTimer",
        "timerPause"
    ].forEach(id => {

        const button =
            $(id);


        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            pauseTimer
        );
    });


    [
        "resetTimer",
        "resetStudyTimer",
        "timerReset"
    ].forEach(id => {

        const button =
            $(id);


        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            resetTimer
        );
    });


    document
        .querySelectorAll(
            "[data-timer-minutes]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    selectTimerDuration(
                        Number(
                            button.dataset
                                .timerMinutes
                        )
                    )
            );
        });


    TIMER_OPTIONS.forEach(
        minutes => {

            [
                `timer${minutes}`,
                `timer${minutes}Min`,
                `timer${minutes}Minutes`,
                `studyTimer${minutes}`
            ].forEach(id => {

                const button =
                    $(id);


                if (!button) {
                    return;
                }


                button.addEventListener(
                    "click",
                    () =>
                        selectTimerDuration(
                            minutes
                        )
                );
            });
        }
    );
}


/* =========================================================
   STREAK
   ========================================================= */

function todayKey() {

    const now =
        new Date();


    return [
        now.getFullYear(),
        String(
            now.getMonth() + 1
        ).padStart(2, "0"),
        String(
            now.getDate()
        ).padStart(2, "0")
    ].join("-");
}


function yesterdayKey() {

    const date =
        new Date();


    date.setDate(
        date.getDate() - 1
    );


    return [
        date.getFullYear(),
        String(
            date.getMonth() + 1
        ).padStart(2, "0"),
        String(
            date.getDate()
        ).padStart(2, "0")
    ].join("-");
}


function updateStreak() {

    const today =
        todayKey();


    const lastDate =
        localStorage.getItem(
            LAST_STUDY_DATE_KEY
        );


    let streak =
        Number(
            localStorage.getItem(
                STREAK_KEY
            )
        );


    if (
        !Number.isFinite(streak) ||
        streak < 0
    ) {
        streak = 0;
    }


    if (lastDate === today) {

        renderStreak(streak);

        return;
    }


    if (
        lastDate ===
        yesterdayKey()
    ) {

        streak++;

    } else {

        streak = 1;
    }


    localStorage.setItem(
        STREAK_KEY,
        String(streak)
    );


    localStorage.setItem(
        LAST_STUDY_DATE_KEY,
        today
    );


    renderStreak(streak);
}


function renderStreak(
    streak = null
) {

    if (streak === null) {

        streak =
            Number(
                localStorage.getItem(
                    STREAK_KEY
                )
            ) || 0;
    }


    [
        "studyStreak",
        "streakCount",
        "currentStreak"
    ].forEach(
        id =>
            setText(
                id,
                streak
            )
    );
}


/* =========================================================
   AI DAILY LIMIT
   ========================================================= */

function getTodayAIQuestionCount() {

    const today =
        todayKey();


    const storedDate =
        localStorage.getItem(
            AI_QUESTION_DATE_KEY
        );


    if (
        storedDate !==
        today
    ) {

        localStorage.setItem(
            AI_QUESTION_DATE_KEY,
            today
        );


        localStorage.setItem(
            AI_QUESTION_COUNT_KEY,
            "0"
        );


        return 0;
    }


    return (
        Number(
            localStorage.getItem(
                AI_QUESTION_COUNT_KEY
            )
        ) || 0
    );
}


function canAskAIQuestion() {

    return (
        getTodayAIQuestionCount() <
        FREE_QUESTION_LIMIT
    );
}


function incrementAIQuestionCount() {

    const current =
        getTodayAIQuestionCount();


    localStorage.setItem(
        AI_QUESTION_COUNT_KEY,
        String(
            current + 1
        )
    );


    renderAIQuestionLimit();
}


function renderAIQuestionLimit() {

    const count =
        getTodayAIQuestionCount();


    const remaining =
        Math.max(
            FREE_QUESTION_LIMIT -
            count,
            0
        );


    [
        "aiQuestionCount",
        "questionsUsedToday"
    ].forEach(
        id =>
            setText(
                id,
                count
            )
    );


    [
        "aiQuestionsRemaining",
        "questionsRemaining"
    ].forEach(
        id =>
            setText(
                id,
                remaining
            )
    );


    const progress =
        (
            count /
            FREE_QUESTION_LIMIT
        ) * 100;


    const element =
        $("aiQuestionProgress");


    if (element) {

        element.style.width =
            `${Math.min(
                progress,
                100
            )}%`;
    }
}


/* =========================================================
   ASK AI
   ========================================================= */

async function askStudyMindAI(
    message
) {

    const cleanMessage =
        cleanText(
            message
        );


    if (!cleanMessage) {

        return {
            success: false,
            error:
                "Please enter a question."
        };
    }


    if (!canAskAIQuestion()) {

        showPremiumMessage();


        return {
            success: false,
            error:
                "Daily free AI question limit reached."
        };
    }


    try {

        const response =
            await fetch(
                "/api/ask-ai",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            message:
                                cleanMessage
                        })
                }
            );


        const data =
            await response
                .json()
                .catch(
                    () => null
                );


        if (!response.ok) {

            throw new Error(
                data?.error ||
                `AI request failed with status ${response.status}`
            );
        }


        if (
            !data ||
            data.success === false
        ) {

            throw new Error(
                data?.error ||
                "The AI server returned an invalid response."
            );
        }


        incrementAIQuestionCount();


        return {

            success:
                true,

            reply:
                data.reply ||
                data.answer ||
                ""
        };


    } catch (error) {

        console.error(
            "StudyMind AI error:",
            error
        );


        return {

            success:
                false,

            error:
                error.message ||
                "Unable to contact StudyMind AI."
        };
    }
}


/* =========================================================
   AI UI
   ========================================================= */

function bindAIAsk() {

    const input =
        $("aiQuestionInput") ||
        $("askAIInput") ||
        $("aiInput");


    const button =
        $("askAIButton") ||
        $("askAiButton") ||
        $("aiAskButton");


    const output =
        $("aiAnswer") ||
        $("aiResponse") ||
        $("askAIResponse");


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        async () => {

            const message =
                input
                    ? input.value
                    : "";


            if (!canAskAIQuestion()) {

                showPremiumMessage();

                return;
            }


            button.disabled =
                true;


            button.textContent =
                "Thinking...";


            if (output) {

                output.textContent =
                    "StudyMind AI is thinking...";
            }


            const result =
                await askStudyMindAI(
                    message
                );


            button.disabled =
                false;


            button.textContent =
                "Ask AI";


            if (result.success) {

                if (output) {

                    output.textContent =
                        result.reply;
                }

            } else {

                if (output) {

                    output.textContent =
                        result.error;
                }
            }
        }
    );
}


/* =========================================================
   PREMIUM
   ========================================================= */

function showPremiumMessage() {

    const modal =
        $("premiumModal");


    if (modal) {

        modal.style.display =
            "";

        return;
    }


    const output =
        $("aiAnswer") ||
        $("aiResponse");


    if (output) {

        output.innerHTML = `

            <div class="premium-message">

                <strong>
                    Daily free AI limit reached
                </strong>

                <p>
                    You've used your
                    ${FREE_QUESTION_LIMIT}
                    free AI requests for today.
                    Premium gives you more AI access.
                </p>

            </div>
        `;
    }
}


/* =========================================================
   CALENDAR
   ========================================================= */

function renderCalendar() {

    const calendar =
        $("calendarDays");


    if (!calendar) {
        return;
    }


    const year =
        currentCalendarDate
            .getFullYear();


    const month =
        currentCalendarDate
            .getMonth();


    setText(
        "calendarMonth",
        currentCalendarDate
            .toLocaleDateString(
                undefined,
                {
                    month: "long",
                    year: "numeric"
                }
            )
    );


    const firstDay =
        new Date(
            year,
            month,
            1
        ).getDay();


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    const previousDays =
        new Date(
            year,
            month,
            0
        ).getDate();


    const cells = [];


    for (
        let i = firstDay - 1;
        i >= 0;
        i--
    ) {

        cells.push({

            day:
                previousDays - i,

            outside:
                true
        });
    }


    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        cells.push({

            day,

            outside:
                false
        });
    }


    while (
        cells.length % 7 !== 0
    ) {

        cells.push({

            day:
                cells.length -
                daysInMonth -
                firstDay +
                1,

            outside:
                true
        });
    }


    const today =
        new Date();


    calendar.innerHTML =
        cells
            .map(
                cell => {

                    const isToday =
                        !cell.outside &&
                        cell.day ===
                            today.getDate() &&
                        month ===
                            today.getMonth() &&
                        year ===
                            today.getFullYear();


                    return `
                        <div
                            class="calendar-day ${
                                cell.outside
                                    ? "outside-month"
                                    : ""
                            } ${
                                isToday
                                    ? "today"
                                    : ""
                            }"
                        >
                            ${cell.day}
                        </div>
                    `;
                }
            )
            .join("");
}


function bindCalendar() {

    const previous =
        $("previousMonth") ||
        $("calendarPrev");


    const next =
        $("nextMonth") ||
        $("calendarNext");


    if (previous) {

        previous.addEventListener(
            "click",
            () => {

                currentCalendarDate =
                    new Date(
                        currentCalendarDate
                            .getFullYear(),
                        currentCalendarDate
                            .getMonth() - 1,
                        1
                    );


                renderCalendar();
            }
        );
    }


    if (next) {

        next.addEventListener(
            "click",
            () => {

                currentCalendarDate =
                    new Date(
                        currentCalendarDate
                            .getFullYear(),
                        currentCalendarDate
                            .getMonth() + 1,
                        1
                    );


                renderCalendar();
            }
        );
    }
}


/* =========================================================
   SCHEDULE
   ========================================================= */

function renderSchedule() {

    const schedule =
        $("scheduleList");


    if (!schedule) {
        return;
    }


    const plan =
        studyPlan || {};


    const scheduleItems =
        plan.schedule ||
        plan.timetable ||
        plan.studySchedule ||
        [];


    if (
        Array.isArray(scheduleItems) &&
        scheduleItems.length
    ) {

        schedule.innerHTML =
            scheduleItems
                .map(item => {

                    const day =
                        cleanText(
                            item.day ||
                            item.date ||
                            item.type
                        );


                    const time =
                        cleanText(
                            item.time ||
                            item.startTime ||
                            item.duration
                        );


                    const subject =
                        cleanText(
                            item.subject ||
                            item.title ||
                            item.name
                        );


                    return `
                        <div class="schedule-item">

                            <div>

                                <strong>
                                    ${escapeHTML(
                                        day ||
                                        "Study Session"
                                    )}
                                </strong>

                                <span>
                                    ${escapeHTML(
                                        subject
                                    )}
                                </span>

                            </div>

                            <time>
                                ${escapeHTML(
                                    time
                                )}
                            </time>

                        </div>
                    `;
                })
                .join("");


        return;
    }


    const topic =
        getCurrentTopic();


    if (!topic) {

        schedule.innerHTML = `
            <div class="empty-state">
                No study schedule available yet.
            </div>
        `;

        return;
    }


    schedule.innerHTML = `

        <div class="schedule-item">

            <div>

                <strong>
                    Current Study Topic
                </strong>

                <span>
                    ${escapeHTML(
                        topic.name
                    )}
                </span>

            </div>

            <time>
                ${Math.round(
                    selectedTimerSeconds / 60
                )} mins
            </time>

        </div>

        <div class="schedule-item">

            <div>

                <strong>
                    Knowledge Check
                </strong>

                <span>
                    5 questions
                </span>

            </div>

            <time>
                After study
            </time>

        </div>
    `;
}


/* =========================================================
   NEXT BOOKING
   ========================================================= */

function renderNextBooking() {

    const nextTopic =
        getNextIncompleteTopic();


    if (!nextTopic) {

        setText(
            "nextBooking",
            "All topics complete"
        );


        setText(
            "nextBookingTime",
            "Great work!"
        );


        return;
    }


    setText(
        "nextBooking",
        nextTopic.name
    );


    setText(
        "nextBookingTime",
        nextTopic.subject ||
        "Study topic"
    );
}


/* =========================================================
   THEME
   ========================================================= */

function applyTheme(
    theme
) {

    const normalized =
        theme === "light"
            ? "light"
            : "dark";


    document.documentElement
        .setAttribute(
            "data-theme",
            normalized
        );


    if (document.body) {

        document.body
            .setAttribute(
                "data-theme",
                normalized
            );
    }


    localStorage.setItem(
        THEME_KEY,
        normalized
    );


    const toggle =
        $("themeToggle");


    if (toggle) {

        toggle.setAttribute(
            "aria-pressed",
            normalized === "light"
                ? "true"
                : "false"
        );
    }
}


function bindTheme() {

    const saved =
        localStorage.getItem(
            THEME_KEY
        );


    applyTheme(
        saved === "light"
            ? "light"
            : "dark"
    );


    const toggle =
        $("themeToggle");


    if (!toggle) {
        return;
    }


    toggle.addEventListener(
        "click",
        () => {

            const current =
                document.documentElement
                    .getAttribute(
                        "data-theme"
                    );


            applyTheme(
                current === "light"
                    ? "dark"
                    : "light"
            );
        }
    );
}


/* =========================================================
   TOPIC COMPLETION EVENTS
   ========================================================= */

function bindTopicCompletion() {

    const checkbox =
        $("topicCompleteCheckbox");


    if (!checkbox) {
        return;
    }


    checkbox.addEventListener(
        "change",
        () => {

            if (
                !checkbox.checked
            ) {
                return;
            }


            completeCurrentTopic();
        }
    );
}


function bindCompleteTopicButton() {

    [
        "completeTopicButton",
        "completeCurrentTopic",
        "markTopicComplete",
        "finishTopicButton"
    ].forEach(id => {

        const button =
            $(id);


        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            completeCurrentTopic
        );
    });
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function bindNavigation() {

    document
        .querySelectorAll(
            "[data-dashboard-home], .back-home-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    window.location.href =
                        "/home.html";
                }
            );
        });
}


/* =========================================================
   AUTH
   ========================================================= */

async function checkAuthentication() {

    try {

        /*
         * Support either:
         * window.supabaseClient
         * or window.supabase
         */

        const client =
            window.supabaseClient &&
            typeof window.supabaseClient.auth
                ?.getSession ===
                "function"

                ? window.supabaseClient

                : window.supabase &&
                  typeof window.supabase.auth
                      ?.getSession ===
                  "function"

                    ? window.supabase

                    : null;


        if (!client) {
            return null;
        }


        const result =
            await client.auth.getSession();


        if (
            result?.data?.session
        ) {

            currentUser =
                result.data.session.user;


            return currentUser;
        }


        return null;


    } catch (error) {

        console.warn(
            "Supabase auth check failed:",
            error
        );


        return null;
    }
}


/* =========================================================
   USER
   ========================================================= */

function renderUser() {

    if (!currentUser) {
        return;
    }


    const name =
        currentUser
            .user_metadata
            ?.display_name ||

        currentUser
            .user_metadata
            ?.full_name ||

        currentUser
            .email
            ?.split("@")[0] ||

        "Student";


    [
        "userName",
        "studentName",
        "welcomeName"
    ].forEach(
        id =>
            setText(
                id,
                name
            )
    );


    [
        "userEmail",
        "studentEmail"
    ].forEach(
        id =>
            setText(
                id,
                currentUser.email || ""
            )
    );
}


/* =========================================================
   RENDER EVERYTHING
   ========================================================= */

function renderEverything() {

    renderCurrentTopic();

    renderDashboardSummary();

    renderStreak();

    renderAIQuestionLimit();

    renderTimer();

    renderTimerButtons();

    renderCalendar();

    renderSchedule();

    renderNextBooking();
}


/* =========================================================
   STORAGE EVENTS
   ========================================================= */

window.addEventListener(
    "storage",
    event => {

        if (
            event.key === PLAN_KEY ||
            event.key ===
                COMPATIBILITY_PLAN_KEY
        ) {

            loadStudyPlan();

            renderEverything();
        }


        if (
            event.key ===
                COMPLETED_TOPICS_KEY ||
            event.key ===
                COMPLETED_QUESTIONS_KEY
        ) {

            loadCompletionState();

            renderEverything();
        }
    }
);


/* =========================================================
   PAGE VISIBILITY
   ========================================================= */

document.addEventListener(
    "visibilitychange",
    () => {

        if (document.hidden) {

            localStorage.setItem(
                TIMER_SECONDS_KEY,
                String(
                    timerSeconds
                )
            );
        }
    }
);


/* =========================================================
   BEFORE UNLOAD
   ========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        localStorage.setItem(
            TIMER_SECONDS_KEY,
            String(
                timerSeconds
            )
        );


        localStorage.setItem(
            TIMER_RUNNING_KEY,
            "false"
        );
    }
);


/* =========================================================
   INITIALIZATION
   ========================================================= */

async function initializeDashboard() {

    console.log(
        "StudyMind Dashboard initializing..."
    );


    /*
     * Load state FIRST.
     */

    loadStudyPlan();

    loadCompletionState();

    loadTimerState();


    /*
     * Bind UI.
     */

    bindTheme();

    bindTimerEvents();

    bindTopicCompletion();

    bindCompleteTopicButton();

    bindAIAsk();

    bindCalendar();

    bindNavigation();


    /*
     * Render immediately.
     */

    renderEverything();


    /*
     * Authentication can happen after rendering.
     */

    currentUser =
        await checkAuthentication();


    renderUser();


    renderAIQuestionLimit();


    console.log(
        "StudyMind Dashboard ready."
    );


    console.log(
        "Subjects:",
        normalizedSubjects
    );


    console.log(
        "Topics:",
        allTopics
    );


    console.log(
        "Current topic:",
        getCurrentTopic()
    );
}


/* =========================================================
   START
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeDashboard
    );

} else {

    initializeDashboard();
}


/* =========================================================
   PUBLIC API
   ========================================================= */

window.StudyMindDashboard = {

    getCurrentTopic,

    completeCurrentTopic,

    generateTopicQuestions,

    submitKnowledgeCheck,

    startTimer,

    pauseTimer,

    resetTimer,

    selectTimerDuration,

    askStudyMindAI,

    renderEverything,

    getProgressPercentage
};


/* =========================================================
   LEGACY GLOBAL COMPATIBILITY
   ========================================================= */

window.startTimer =
    startTimer;

window.pauseTimer =
    pauseTimer;

window.resetTimer =
    resetTimer;

window.completeCurrentTopic =
    completeCurrentTopic;

window.generateTopicQuestions =
    generateTopicQuestions;

window.submitKnowledgeCheck =
    submitKnowledgeCheck;

window.selectTimerDuration =
    selectTimerDuration;

window.askStudyMindAI =
    askStudyMindAI;
