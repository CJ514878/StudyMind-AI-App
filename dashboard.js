/* =========================================================
   STUDYMIND AI — DASHBOARD.JS
   COMPLETE REPLACEMENT

   Compatible with:
   - home.html
   - script.js
   - dashboard.html

   FEATURES:
   - Correct topic extraction
   - No "Untitled Topic" when valid topic data exists
   - Current topic rendering
   - Topic progress
   - Knowledge checks
   - 5-question knowledge checks
   - 60% pass requirement
   - 25 / 45 / 60 minute study timer
   - Calendar
   - Schedule
   - Subjects
   - Daily challenge
   - Study streak
   - Study score
   - Theme support
   - Supabase authentication
   - Free AI limit
   - VERIFIED PREMIUM ACCESS
   - Golden Premium dashboard
   - Unlimited Premium AI helpers
   ========================================================= */


/* =========================================================
   SUPABASE / CONFIGURATION
   ========================================================= */

const SUPABASE_URL =
    "https://bicnrbqqvucgpbwudmit.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_70y0MPrj30-FimUSQK_HuA_Ng1a1qcB";


/* =========================================================
   API CONFIGURATION
   ========================================================= */

const AI_ENDPOINT = "/api/ask-ai";
const PREMIUM_STATUS_ENDPOINT = "/api/premium/status";


/* =========================================================
   LIMITS / SETTINGS
   ========================================================= */

const FREE_QUESTION_LIMIT = 5;
const KNOWLEDGE_CHECK_QUESTION_COUNT = 5;
const KNOWLEDGE_CHECK_PASS_PERCENTAGE = 60;

const TIMER_OPTIONS = [25, 45, 60];
const DEFAULT_TIMER_MINUTES = 25;
const DEFAULT_TIMER_SECONDS =
    DEFAULT_TIMER_MINUTES * 60;

const QUESTION_REQUEST_TIMEOUT = 45000;


/* =========================================================
   STORAGE KEYS
   ========================================================= */

const STORAGE_KEYS = {
    plan: "studyMindPlan",
    studyData: "studyData",
    plans: "studyMindPlans",
    activePlanId: "studyMindActivePlanId",

    completedTopics:
        "studyMindCompletedTopics",

    completedQuestionTopics:
        "studyMindCompletedQuestionTopics",

    currentTopicIndex:
        "studyMindCurrentTopicIndex",

    knowledgeCheckTopic:
        "studyMindKnowledgeCheckTopic",

    topicQuestions:
        "studyMindTopicQuestions",

    completionCelebrationShown:
        "studyMindCompletionCelebrationShown",

    currentStudySession:
        "studyMindCurrentStudySession",

    topicReadings:
        "studyMindTopicReadings",

    timerSeconds:
        "studyMindTimerSeconds",

    selectedTimerSeconds:
        "studyMindSelectedTimerSeconds",

    theme:
        "studyMindTheme",

    aiQuestionCount:
        "aiQuestionCount",

    aiQuestionDate:
        "aiQuestionDate",

    streak:
        "studyMindStreak",

    lastStudyDate:
        "lastStudyDate"
};


/* =========================================================
   PREMIUM STATE
   ========================================================= */

let isPremiumUser = false;
let premiumStatusLoaded = false;


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let currentUser = null;

let currentPlan = null;
let activePlanId = null;

let currentTopicIndex = 0;

let timerSeconds = DEFAULT_TIMER_SECONDS;
let timerInterval = null;
let timerRunning = false;

let readingObserver = null;
let readingPersistenceInterval = null;
let stateSaveInterval = null;

let dashboardInitialized = false;


/* =========================================================
   GENERAL HELPERS
   ========================================================= */

function clean(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value).trim();
}


function readJSON(key, fallback = null) {
    try {
        const raw = localStorage.getItem(key);

        if (!raw) {
            return fallback;
        }

        return JSON.parse(raw);
    } catch (error) {
        console.warn(
            "StudyMind AI: Could not read localStorage key:",
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
            "StudyMind AI: Could not write localStorage key:",
            key,
            error
        );

        return false;
    }
}


function escapeHTML(value) {
    return clean(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function slug(value) {
    return clean(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}


function createId(prefix = "id") {
    return (
        prefix +
        "-" +
        Date.now().toString(36) +
        "-" +
        Math.random()
            .toString(36)
            .slice(2, 9)
    );
}


function dateKey(date = new Date()) {
    const d = new Date(date);

    const year = d.getFullYear();
    const month =
        String(d.getMonth() + 1).padStart(2, "0");
    const day =
        String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function todayDate() {
    return dateKey(new Date());
}


function parseDate(value) {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
}


function sameDate(a, b) {
    if (!a || !b) {
        return false;
    }

    return dateKey(a) === dateKey(b);
}


function formatClock(seconds) {
    const safeSeconds = Math.max(
        0,
        Number(seconds) || 0
    );

    const minutes = Math.floor(
        safeSeconds / 60
    );

    const secs = safeSeconds % 60;

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(secs).padStart(2, "0")
    );
}


function formatSeconds(seconds) {
    const safeSeconds = Math.max(
        0,
        Number(seconds) || 0
    );

    const minutes = Math.floor(
        safeSeconds / 60
    );

    const secs = safeSeconds % 60;

    if (minutes <= 0) {
        return `${secs}s`;
    }

    if (secs <= 0) {
        return `${minutes}m`;
    }

    return `${minutes}m ${secs}s`;
}


/* =========================================================
   TOPIC NORMALIZATION
   ========================================================= */

function topicKey(topic, index = 0) {
    if (!topic) {
        return `topic-${index}`;
    }

    return (
        clean(
            topic.id ||
            topic.topicId ||
            topic.key ||
            topic.slug
        ) ||
        slug(
            topic.name ||
            topic.title ||
            topic.topic ||
            topic.topicName ||
            `topic-${index}`
        ) ||
        `topic-${index}`
    );
}


function topicName(topic, index = 0) {
    if (!topic) {
        return `Topic ${index + 1}`;
    }

    return (
        clean(topic.name) ||
        clean(topic.topicName) ||
        clean(topic.title) ||
        clean(topic.topic) ||
        clean(topic.topic_title) ||
        clean(topic.subjectTopic) ||
        `Topic ${index + 1}`
    );
}


function topicSubject(topic) {
    if (!topic) {
        return "";
    }

    return (
        clean(topic.subject) ||
        clean(topic.subjectName) ||
        clean(topic.subject_name) ||
        clean(topic.course) ||
        clean(topic.category)
    );
}


function topicDescription(topic) {
    if (!topic) {
        return "";
    }

    return (
        clean(topic.description) ||
        clean(topic.desc) ||
        clean(topic.summary) ||
        clean(topic.overview) ||
        ""
    );
}


function normalizeTopic(topic, index = 0) {
    if (typeof topic === "string") {
        return {
            id: `topic-${index}`,
            name: topic,
            title: topic,
            subject: "",
            description: "",
            date: null,
            studyDate: null,
            testDate: null,
            examDate: null
        };
    }

    const normalized = {
        ...(topic || {})
    };

    normalized.id =
        topicKey(normalized, index);

    normalized.name =
        topicName(normalized, index);

    normalized.title =
        normalized.name;

    normalized.subject =
        topicSubject(normalized);

    normalized.description =
        topicDescription(normalized);

    normalized.date =
        normalized.date ||
        normalized.studyDate ||
        normalized.scheduledDate ||
        normalized.scheduled_for ||
        null;

    normalized.studyDate =
        normalized.studyDate ||
        normalized.date ||
        normalized.scheduledDate ||
        null;

    normalized.testDate =
        normalized.testDate ||
        normalized.test_date ||
        null;

    normalized.examDate =
        normalized.examDate ||
        normalized.exam_date ||
        null;

    return normalized;
}


/* =========================================================
   EXTRACT TOPICS
   ========================================================= */

function extractTopicsFromPlan(plan) {
    if (!plan) {
        return [];
    }

    const possibleArrays = [
        plan.topics,
        plan.studyTopics,
        plan.topicList,
        plan.studyPlanTopics,
        plan.schedule,
        plan.sessions,
        plan.studySessions,
        plan.items
    ];

    for (const candidate of possibleArrays) {
        if (Array.isArray(candidate) &&
            candidate.length) {

            const result = [];

            candidate.forEach(
                (item, index) => {

                    if (
                        item &&
                        Array.isArray(item.topics)
                    ) {
                        item.topics.forEach(
                            (nestedTopic, nestedIndex) => {
                                result.push(
                                    normalizeTopic(
                                        nestedTopic,
                                        result.length
                                    )
                                );
                            }
                        );
                    } else {
                        result.push(
                            normalizeTopic(
                                item,
                                index
                            )
                        );
                    }
                }
            );

            if (result.length) {
                return result;
            }
        }
    }

    if (
        plan.subjects &&
        Array.isArray(plan.subjects)
    ) {
        const result = [];

        plan.subjects.forEach(
            (subject, subjectIndex) => {

                if (
                    subject &&
                    Array.isArray(subject.topics)
                ) {
                    subject.topics.forEach(
                        (topic, topicIndex) => {

                            const normalized =
                                normalizeTopic(
                                    topic,
                                    result.length
                                );

                            if (
                                !normalized.subject
                            ) {
                                normalized.subject =
                                    clean(
                                        subject.name ||
                                        subject.title ||
                                        subject.subject
                                    );
                            }

                            result.push(
                                normalized
                            );
                        }
                    );
                }
            }
        );

        if (result.length) {
            return result;
        }
    }

    if (
        Array.isArray(plan.subjectList)
    ) {
        const result = [];

        plan.subjectList.forEach(
            (subject, subjectIndex) => {

                if (
                    typeof subject === "string"
                ) {
                    result.push(
                        normalizeTopic(
                            {
                                name: subject,
                                subject: subject
                            },
                            result.length
                        )
                    );
                }
            }
        );

        if (result.length) {
            return result;
        }
    }

    return [];
}


/* =========================================================
   PLAN NORMALIZATION
   ========================================================= */

function normalizePlan(plan, fallbackId = null) {
    if (!plan) {
        return null;
    }

    const normalized = {
        ...(plan || {})
    };

    normalized.id =
        clean(
            normalized.id ||
            normalized.planId ||
            fallbackId
        ) ||
        createId("plan");

    normalized.name =
        clean(
            normalized.name ||
            normalized.title ||
            normalized.planName
        ) ||
        "Study Plan";

    normalized.title =
        normalized.name;

    normalized.createdAt =
        normalized.createdAt ||
        normalized.created_at ||
        new Date().toISOString();

    normalized.topics =
        extractTopicsFromPlan(
            normalized
        );

    return normalized;
}


/* =========================================================
   MULTI-PLAN STORAGE
   ========================================================= */

function getSavedPlans() {
    const plans =
        readJSON(
            STORAGE_KEYS.plans,
            []
        );

    if (!Array.isArray(plans)) {
        return [];
    }

    return plans
        .map((plan, index) =>
            normalizePlan(
                plan,
                `plan-${index}`
            )
        )
        .filter(Boolean);
}


function saveSavedPlans(plans) {
    return writeJSON(
        STORAGE_KEYS.plans,
        plans
    );
}


function getActivePlanId() {
    return (
        clean(
            localStorage.getItem(
                STORAGE_KEYS.activePlanId
            )
        ) || null
    );
}


function setActivePlanId(id) {
    if (!id) {
        localStorage.removeItem(
            STORAGE_KEYS.activePlanId
        );

        activePlanId = null;

        return;
    }

    localStorage.setItem(
        STORAGE_KEYS.activePlanId,
        id
    );

    activePlanId = id;
}


function captureActivePlanState() {
    if (!currentPlan) {
        return null;
    }

    return {
        ...(currentPlan || {}),
        topics:
            Array.isArray(currentPlan.topics)
                ? currentPlan.topics
                : [],
        currentTopicIndex,
        timerSeconds,
        selectedTimerSeconds:
            Number(
                localStorage.getItem(
                    STORAGE_KEYS.selectedTimerSeconds
                )
            ) ||
            DEFAULT_TIMER_SECONDS
    };
}


function syncActivePlanRecord() {
    if (!currentPlan) {
        return;
    }

    const plans =
        getSavedPlans();

    const index =
        plans.findIndex(
            plan =>
                plan.id === currentPlan.id
        );

    if (index === -1) {
        plans.push(
            captureActivePlanState()
        );
    } else {
        plans[index] =
            captureActivePlanState();
    }

    saveSavedPlans(plans);
}


function saveLegacyState() {
    if (!currentPlan) {
        return;
    }

    writeJSON(
        STORAGE_KEYS.plan,
        currentPlan
    );

    writeJSON(
        STORAGE_KEYS.studyData,
        {
            plan: currentPlan,
            currentTopicIndex,
            updatedAt:
                new Date().toISOString()
        }
    );
}


function loadActivePlan() {
    const savedPlans =
        getSavedPlans();

    let activeId =
        getActivePlanId();

    let selectedPlan =
        null;

    if (activeId) {
        selectedPlan =
            savedPlans.find(
                plan =>
                    plan.id === activeId
            ) || null;
    }

    if (!selectedPlan) {
        const legacyPlan =
            normalizePlan(
                readJSON(
                    STORAGE_KEYS.plan,
                    null
                )
            );

        if (legacyPlan) {
            selectedPlan =
                savedPlans.find(
                    plan =>
                        plan.id ===
                        legacyPlan.id
                ) ||
                legacyPlan;
        }
    }

    if (!selectedPlan) {
        const studyData =
            readJSON(
                STORAGE_KEYS.studyData,
                null
            );

        if (
            studyData &&
            studyData.plan
        ) {
            selectedPlan =
                normalizePlan(
                    studyData.plan
                );
        }
    }

    if (!selectedPlan) {
        currentPlan = null;
        activePlanId = null;
        return null;
    }

    currentPlan =
        normalizePlan(
            selectedPlan,
            selectedPlan.id
        );

    activePlanId =
        currentPlan.id;

    setActivePlanId(
        currentPlan.id
    );

    const savedIndex =
        Number(
            selectedPlan.currentTopicIndex
        );

    if (
        Number.isFinite(savedIndex) &&
        savedIndex >= 0
    ) {
        currentTopicIndex =
            savedIndex;
    } else {
        currentTopicIndex =
            Number(
                localStorage.getItem(
                    STORAGE_KEYS.currentTopicIndex
                )
            ) || 0;
    }

    if (
        currentTopicIndex >=
        currentPlan.topics.length
    ) {
        currentTopicIndex =
            Math.max(
                0,
                currentPlan.topics.length - 1
            );
    }

    const savedTimer =
        Number(
            localStorage.getItem(
                STORAGE_KEYS.timerSeconds
            )
        );

    timerSeconds =
        Number.isFinite(savedTimer) &&
        savedTimer >= 0
            ? savedTimer
            : DEFAULT_TIMER_SECONDS;

    return currentPlan;
}


/* =========================================================
   COMPLETED TOPICS
   ========================================================= */

function getCompletedTopics() {
    const completed =
        readJSON(
            STORAGE_KEYS.completedTopics,
            []
        );

    if (!Array.isArray(completed)) {
        return [];
    }

    return completed;
}


function saveCompletedTopics(topics) {
    writeJSON(
        STORAGE_KEYS.completedTopics,
        topics
    );
}


function getCompletedQuestionTopics() {
    const completed =
        readJSON(
            STORAGE_KEYS.completedQuestionTopics,
            []
        );

    if (!Array.isArray(completed)) {
        return [];
    }

    return completed;
}


function saveCompletedQuestionTopics(topics) {
    writeJSON(
        STORAGE_KEYS.completedQuestionTopics,
        topics
    );
}


function isTopicCompleted(topic, index) {
    if (!topic) {
        return false;
    }

    const key =
        topicKey(
            topic,
            index
        );

    return getCompletedTopics()
        .some(
            item =>
                item === key ||
                item === index ||
                item?.id === key ||
                item?.key === key
        );
}


function isKnowledgeCheckCompleted(
    topic,
    index
) {
    if (!topic) {
        return false;
    }

    const key =
        topicKey(
            topic,
            index
        );

    return getCompletedQuestionTopics()
        .some(
            item =>
                item === key ||
                item === index ||
                item?.id === key ||
                item?.key === key
        );
}


/* =========================================================
   CURRENT TOPIC
   ========================================================= */

function getCurrentTopic() {
    if (
        !currentPlan ||
        !Array.isArray(
            currentPlan.topics
        )
    ) {
        return null;
    }

    if (
        currentTopicIndex < 0 ||
        currentTopicIndex >=
            currentPlan.topics.length
    ) {
        return null;
    }

    return currentPlan.topics[
        currentTopicIndex
    ];
}


function getFirstIncompleteTopicIndex() {
    if (
        !currentPlan ||
        !Array.isArray(
            currentPlan.topics
        )
    ) {
        return 0;
    }

    const index =
        currentPlan.topics.findIndex(
            (topic, i) =>
                !isTopicCompleted(
                    topic,
                    i
                )
        );

    return index === -1
        ? Math.max(
              0,
              currentPlan.topics.length - 1
          )
        : index;
}


/* =========================================================
   COMPLETION
   ========================================================= */

function markTopicCompleted(
    topic,
    index
) {
    if (!topic) {
        return;
    }

    const key =
        topicKey(
            topic,
            index
        );

    const completed =
        getCompletedTopics();

    const exists =
        completed.some(
            item =>
                item === key ||
                item === index ||
                item?.id === key ||
                item?.key === key
        );

    if (!exists) {
        completed.push(key);
    }

    saveCompletedTopics(
        completed
    );

    localStorage.setItem(
        STORAGE_KEYS.currentTopicIndex,
        String(index)
    );

    syncActivePlanRecord();
    saveLegacyState();

    updateStudyStreak();
}


function completeCurrentTopic() {
    const topic =
        getCurrentTopic();

    if (!topic) {
        return;
    }

    markTopicCompleted(
        topic,
        currentTopicIndex
    );

    renderAll();

    openKnowledgeCheckPage(
        topic,
        currentTopicIndex
    );
}


function openKnowledgeCheckPage(
    topic,
    index
) {
    writeJSON(
        STORAGE_KEYS.knowledgeCheckTopic,
        {
            topic:
                normalizeTopic(
                    topic,
                    index
                ),
            index,
            planId:
                currentPlan?.id ||
                null
        }
    );

    window.location.href =
        "knowledge-check.html";
}


/* =========================================================
   READING PERSISTENCE
   ========================================================= */

function getTopicReadings() {
    const readings =
        readJSON(
            STORAGE_KEYS.topicReadings,
            {}
        );

    return (
        readings &&
        typeof readings === "object"
    )
        ? readings
        : {};
}


function saveTopicReadings(readings) {
    writeJSON(
        STORAGE_KEYS.topicReadings,
        readings
    );
}


function getTopicReading(topic, index) {
    const readings =
        getTopicReadings();

    const key =
        topicKey(
            topic,
            index
        );

    return (
        Number(
            readings[key]
        ) || 0
    );
}


function saveTopicReading(
    topic,
    index,
    seconds
) {
    if (!topic) {
        return;
    }

    const readings =
        getTopicReadings();

    const key =
        topicKey(
            topic,
            index
        );

    readings[key] =
        Math.max(
            0,
            Number(seconds) || 0
        );

    saveTopicReadings(
        readings
    );
}


function startReadingPersistence() {
    if (
        readingPersistenceInterval
    ) {
        clearInterval(
            readingPersistenceInterval
        );
    }

    readingPersistenceInterval =
        setInterval(
            () => {
                const topic =
                    getCurrentTopic();

                if (!topic) {
                    return;
                }

                const elapsed =
                    getTopicReading(
                        topic,
                        currentTopicIndex
                    );

                saveTopicReading(
                    topic,
                    currentTopicIndex,
                    elapsed + 1
                );
            },
            1000
        );
}


/* =========================================================
   DASHBOARD STATE SAVE
   ========================================================= */

function saveDashboardState() {
    localStorage.setItem(
        STORAGE_KEYS.currentTopicIndex,
        String(currentTopicIndex)
    );

    localStorage.setItem(
        STORAGE_KEYS.timerSeconds,
        String(timerSeconds)
    );

    localStorage.setItem(
        STORAGE_KEYS.selectedTimerSeconds,
        String(
            Number(
                localStorage.getItem(
                    STORAGE_KEYS.selectedTimerSeconds
                )
            ) ||
            DEFAULT_TIMER_SECONDS
        )
    );

    syncActivePlanRecord();
    saveLegacyState();
}


/* =========================================================
   STREAK
   ========================================================= */

function getStudyStreak() {
    const streak =
        Number(
            localStorage.getItem(
                STORAGE_KEYS.streak
            )
        );

    return Number.isFinite(streak)
        ? streak
        : 0;
}


function updateStudyStreak() {
    const today =
        todayDate();

    const lastDate =
        localStorage.getItem(
            STORAGE_KEYS.lastStudyDate
        );

    let streak =
        getStudyStreak();

    if (!lastDate) {
        streak = 1;
    } else if (
        lastDate === today
    ) {
        return streak;
    } else {
        const previous =
            parseDate(
                lastDate
            );

        const current =
            parseDate(
                today
            );

        if (
            previous &&
            current
        ) {
            const difference =
                Math.round(
                    (
                        current.getTime() -
                        previous.getTime()
                    ) /
                    86400000
                );

            if (
                difference === 1
            ) {
                streak += 1;
            } else if (
                difference > 1
            ) {
                streak = 1;
            }
        } else {
            streak = 1;
        }
    }

    localStorage.setItem(
        STORAGE_KEYS.streak,
        String(streak)
    );

    localStorage.setItem(
        STORAGE_KEYS.lastStudyDate,
        today
    );

    return streak;
}


/* =========================================================
   STUDY SCORE
   ========================================================= */

function calculateStudyScore() {
    if (
        !currentPlan ||
        !Array.isArray(
            currentPlan.topics
        ) ||
        !currentPlan.topics.length
    ) {
        return 0;
    }

    const total =
        currentPlan.topics.length;

    let completed = 0;

    currentPlan.topics.forEach(
        (topic, index) => {
            if (
                isTopicCompleted(
                    topic,
                    index
                )
            ) {
                completed += 1;
            }
        }
    );

    return Math.round(
        (completed / total) * 100
    );
}


/* =========================================================
   STATS
   ========================================================= */

function renderStats() {
    const totalTopics =
        currentPlan?.topics?.length ||
        0;

    let completedTopics = 0;

    if (currentPlan) {
        currentPlan.topics.forEach(
            (topic, index) => {
                if (
                    isTopicCompleted(
                        topic,
                        index
                    )
                ) {
                    completedTopics++;
                }
            }
        );
    }

    const score =
        calculateStudyScore();

    const streak =
        getStudyStreak();

    const mappings = {
        totalTopics: totalTopics,
        completedTopics:
            completedTopics,
        studyScore: score,
        streak: streak,
        currentStreak: streak
    };

    Object.entries(
        mappings
    ).forEach(
        ([id, value]) => {
            const element =
                document.getElementById(
                    id
                );

            if (element) {
                element.textContent =
                    String(value);
            }
        }
    );

    const selectors = [
        "[data-stat='topics']",
        "[data-stat='total-topics']"
    ];

    selectors.forEach(
        selector => {
            document
                .querySelectorAll(selector)
                .forEach(
                    element => {
                        element.textContent =
                            String(
                                totalTopics
                            );
                    }
                );
        }
    );
}


/* =========================================================
   CURRENT TOPIC RENDERING
   ========================================================= */

function renderCurrentTopic() {
    const topic =
        getCurrentTopic();

    const nameElement =
        document.getElementById(
            "currentTopicName"
        );

    const descriptionElement =
        document.getElementById(
            "currentTopicDescription"
        );

    const positionElement =
        document.getElementById(
            "topicPosition"
        );

    const badgeElement =
        document.getElementById(
            "topicStatusBadge"
        );

    const checkbox =
        document.getElementById(
            "topicCompleteCheckbox"
        );

    const completionMessage =
        document.getElementById(
            "topicCompletionMessage"
        );

    const nextMessage =
        document.getElementById(
            "nextTopicMessage"
        );

    if (!topic) {
        if (nameElement) {
            nameElement.textContent =
                "No active topic";
        }

        if (descriptionElement) {
            descriptionElement.textContent =
                "Create a study plan to begin studying.";
        }

        if (positionElement) {
            positionElement.textContent =
                "";
        }

        if (badgeElement) {
            badgeElement.textContent =
                "WAITING";
        }

        return;
    }

    const name =
        topicName(
            topic,
            currentTopicIndex
        );

    const description =
        topicDescription(
            topic
        );

    const completed =
        isTopicCompleted(
            topic,
            currentTopicIndex
        );

    if (nameElement) {
        nameElement.textContent =
            name;
    }

    if (descriptionElement) {
        descriptionElement.textContent =
            description ||
            "Study this topic and complete the knowledge check.";
    }

    if (positionElement) {
        positionElement.textContent =
            `TOPIC ${
                currentTopicIndex + 1
            } OF ${
                currentPlan.topics.length
            }`;
    }

    if (badgeElement) {
        badgeElement.textContent =
            completed
                ? "COMPLETED"
                : "IN PROGRESS";
    }

    if (checkbox) {
        checkbox.checked =
            completed;
    }

    if (completionMessage) {
        completionMessage.textContent =
            completed
                ? "Topic completed."
                : "Mark this topic as finished when you are done studying.";
    }

    if (nextMessage) {
        const nextIndex =
            currentTopicIndex + 1;

        if (
            nextIndex <
            currentPlan.topics.length
        ) {
            const nextTopic =
                currentPlan.topics[
                    nextIndex
                ];

            nextMessage.textContent =
                `Next: ${topicName(
                    nextTopic,
                    nextIndex
                )}`;
        } else {
            nextMessage.textContent =
                "You have reached the final topic in this study plan.";
        }
    }

    const subjectElement =
        document.getElementById(
            "currentTopicSubject"
        );

    if (subjectElement) {
        subjectElement.textContent =
            topicSubject(topic);
    }
}


/* =========================================================
   PROGRESS
   ========================================================= */

function renderProgress() {
    if (!currentPlan) {
        return;
    }

    const total =
        currentPlan.topics.length;

    let completed = 0;

    currentPlan.topics.forEach(
        (topic, index) => {
            if (
                isTopicCompleted(
                    topic,
                    index
                )
            ) {
                completed++;
            }
        }
    );

    const percentage =
        total > 0
            ? Math.round(
                  (completed / total) *
                      100
              )
            : 0;

    const progressElements =
        document.querySelectorAll(
            "#progressBar, .progress-bar-fill, [data-progress-bar]"
        );

    progressElements.forEach(
        element => {
            element.style.width =
                `${percentage}%`;
        }
    );

    const percentageElements =
        document.querySelectorAll(
            "#progressPercentage, [data-progress-percentage]"
        );

    percentageElements.forEach(
        element => {
            element.textContent =
                `${percentage}%`;
        }
    );

    const textElements =
        document.querySelectorAll(
            "#progressText, [data-progress-text]"
        );

    textElements.forEach(
        element => {
            element.textContent =
                `${completed} of ${total} topics completed`;
        }
    );
}


/* =========================================================
   TOPICS
   ========================================================= */

function renderTopics() {
    const container =
        document.getElementById(
            "topicsList"
        );

    if (!container) {
        return;
    }

    if (
        !currentPlan ||
        !currentPlan.topics.length
    ) {
        container.innerHTML = `
            <div class="empty-state">
                <strong>No topics yet</strong>
                <p>Create a study plan to see your topics here.</p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        currentPlan.topics
            .map(
                (topic, index) => {

                    const completed =
                        isTopicCompleted(
                            topic,
                            index
                        );

                    const current =
                        index ===
                        currentTopicIndex;

                    const subject =
                        topicSubject(
                            topic
                        );

                    return `
                        <button
                            type="button"
                            class="topic-card ${
                                current
                                    ? "active"
                                    : ""
                            } ${
                                completed
                                    ? "completed"
                                    : ""
                            }"
                            data-topic-index="${index}"
                        >
                            <div class="topic-card-number">
                                ${
                                    completed
                                        ? "✓"
                                        : index + 1
                                }
                            </div>

                            <div class="topic-card-content">
                                <strong>
                                    ${escapeHTML(
                                        topicName(
                                            topic,
                                            index
                                        )
                                    )}
                                </strong>

                                ${
                                    subject
                                        ? `
                                    <span>
                                        ${escapeHTML(
                                            subject
                                        )}
                                    </span>
                                `
                                        : ""
                                }
                            </div>

                            <div class="topic-card-status">
                                ${
                                    completed
                                        ? "Completed"
                                        : current
                                            ? "Current"
                                            : "Start"
                                }
                            </div>
                        </button>
                    `;
                }
            )
            .join("");
}


/* =========================================================
   SUBJECTS
   ========================================================= */

function renderSubjects() {
    const container =
        document.getElementById(
            "subjectsList"
        );

    if (!container) {
        return;
    }

    if (
        !currentPlan ||
        !currentPlan.topics.length
    ) {
        container.innerHTML = `
            <div class="empty-state">
                No subjects available yet.
            </div>
        `;

        return;
    }

    const subjects = {};

    currentPlan.topics.forEach(
        (topic, index) => {

            const subject =
                topicSubject(
                    topic
                ) ||
                "General";

            if (!subjects[subject]) {
                subjects[subject] = {
                    total: 0,
                    completed: 0
                };
            }

            subjects[subject].total++;

            if (
                isTopicCompleted(
                    topic,
                    index
                )
            ) {
                subjects[subject].completed++;
            }
        }
    );

    container.innerHTML =
        Object.entries(subjects)
            .map(
                ([subject, data]) => {

                    const percentage =
                        data.total > 0
                            ? Math.round(
                                  (
                                      data.completed /
                                      data.total
                                  ) *
                                      100
                              )
                            : 0;

                    return `
                        <div class="subject-card">
                            <div class="subject-card-header">
                                <strong>
                                    ${escapeHTML(
                                        subject
                                    )}
                                </strong>

                                <span>
                                    ${percentage}%
                                </span>
                            </div>

                            <div class="subject-progress">
                                <div
                                    class="subject-progress-fill"
                                    style="width:${percentage}%"
                                ></div>
                            </div>

                            <small>
                                ${
                                    data.completed
                                } of ${
                                    data.total
                                } topics completed
                            </small>
                        </div>
                    `;
                }
            )
            .join("");
}


/* =========================================================
   DAILY CHALLENGE
   ========================================================= */

function renderDailyChallenge() {
    const container =
        document.getElementById(
            "dailyChallenge"
        );

    if (!container) {
        return;
    }

    const topic =
        getCurrentTopic();

    if (!topic) {
        container.innerHTML = `
            <div class="empty-state">
                Your daily challenge will appear here once you have an active study plan.
            </div>
        `;

        return;
    }

    const completed =
        isKnowledgeCheckCompleted(
            topic,
            currentTopicIndex
        );

    container.innerHTML = `
        <div class="daily-challenge-inner">
            <span class="eyebrow">
                DAILY CHALLENGE
            </span>

            <h3>
                ${
                    completed
                        ? "Challenge completed"
                        : "Test your understanding"
                }
            </h3>

            <p>
                ${
                    completed
                        ? "Great work. Keep your momentum going."
                        : `Complete the knowledge check for ${escapeHTML(
                              topicName(
                                  topic,
                                  currentTopicIndex
                              )
                          )}.`
                }
            </p>

            ${
                !completed
                    ? `
                <button
                    type="button"
                    class="primary-button"
                    id="dailyChallengeButton"
                >
                    Start Challenge
                </button>
            `
                    : ""
            }
        </div>
    `;

    const button =
        document.getElementById(
            "dailyChallengeButton"
        );

    if (button) {
        button.addEventListener(
            "click",
            () => {
                openKnowledgeCheckPage(
                    topic,
                    currentTopicIndex
                );
            }
        );
    }
}


/* =========================================================
   CALENDAR DATA
   ========================================================= */

function getTopicScheduledDate(
    topic
) {
    if (!topic) {
        return null;
    }

    return (
        topic.studyDate ||
        topic.date ||
        topic.scheduledDate ||
        topic.scheduled_for ||
        topic.study_date ||
        null
    );
}


function getTopicsScheduledForDate(
    date
) {
    if (
        !currentPlan ||
        !Array.isArray(
            currentPlan.topics
        )
    ) {
        return [];
    }

    const target =
        dateKey(date);

    return currentPlan.topics
        .map(
            (topic, index) => ({
                topic,
                index
            })
        )
        .filter(
            item => {
                const scheduled =
                    getTopicScheduledDate(
                        item.topic
                    );

                return (
                    scheduled &&
                    dateKey(
                        scheduled
                    ) === target
                );
            }
        );
}


/* =========================================================
   CALENDAR
   ========================================================= */

let calendarDisplayDate =
    new Date();


function renderCalendar() {
    const container =
        document.getElementById(
            "calendarDays"
        );

    if (!container) {
        return;
    }

    const monthElement =
        document.getElementById(
            "calendarMonth"
        );

    const year =
        calendarDisplayDate.getFullYear();

    const month =
        calendarDisplayDate.getMonth();

    if (monthElement) {
        monthElement.textContent =
            calendarDisplayDate.toLocaleDateString(
                undefined,
                {
                    month: "long",
                    year: "numeric"
                }
            );
    }

    const firstDay =
        new Date(
            year,
            month,
            1
        );

    const lastDay =
        new Date(
            year,
            month + 1,
            0
        );

    const startDay =
        firstDay.getDay();

    const daysInMonth =
        lastDay.getDate();

    let html = "";

    for (
        let i = 0;
        i < startDay;
        i++
    ) {
        html += `
            <div class="calendar-day empty"></div>
        `;
    }

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {
        const date =
            new Date(
                year,
                month,
                day
            );

        const key =
            dateKey(date);

        const scheduled =
            getTopicsScheduledForDate(
                date
            );

        const completedScheduled =
            scheduled.filter(
                item =>
                    isTopicCompleted(
                        item.topic,
                        item.index
                    )
            );

        const isToday =
            key === todayDate();

        const isExamDay =
            currentPlan?.examDate &&
            dateKey(
                currentPlan.examDate
            ) === key;

        const isTestDay =
            currentPlan?.testDate &&
            dateKey(
                currentPlan.testDate
            ) === key;

        let classNames =
            "calendar-day";

        if (isToday) {
            classNames +=
                " today";
        }

        if (scheduled.length) {
            classNames +=
                " study-day";
        }

        if (
            scheduled.length &&
            completedScheduled.length ===
                scheduled.length
        ) {
            classNames +=
                " completed-study-day";
        }

        if (isExamDay) {
            classNames +=
                " exam-day";
        } else if (isTestDay) {
            classNames +=
                " test-day";
        }

        html += `
            <button
                type="button"
                class="${classNames}"
                data-calendar-date="${key}"
                aria-label="${key}"
            >
                <span>
                    ${day}
                </span>

                ${
                    scheduled.length
                        ? `
                    <small>
                        ${scheduled.length}
                    </small>
                `
                        : ""
                }
            </button>
        `;
    }

    container.innerHTML =
        html;
}


/* =========================================================
   CALENDAR NAVIGATION
   ========================================================= */

function changeCalendarMonth(
    amount
) {
    calendarDisplayDate =
        new Date(
            calendarDisplayDate.getFullYear(),
            calendarDisplayDate.getMonth() +
                amount,
            1
        );

    renderCalendar();
}


/* =========================================================
   SCHEDULE
   ========================================================= */

function renderSchedule() {
    const container =
        document.getElementById(
            "scheduleList"
        );

    if (!container) {
        return;
    }

    if (
        !currentPlan ||
        !currentPlan.topics.length
    ) {
        container.innerHTML = `
            <div class="empty-state">
                No study schedule available.
            </div>
        `;

        renderNextSession();

        return;
    }

    const today =
        todayDate();

    const scheduled =
        getTopicsScheduledForDate(
            today
        );

    if (!scheduled.length) {
        container.innerHTML = `
            <div class="schedule-rest-day">
                <div class="schedule-rest-icon">
                    🌿
                </div>

                <div>
                    <strong>
                        Rest Day
                    </strong>

                    <p>
                        You have no topics scheduled for today.
                        Take a break and come back refreshed.
                    </p>
                </div>
            </div>
        `;

        renderNextSession();

        return;
    }

    container.innerHTML =
        scheduled
            .map(
                item => {

                    const topic =
                        item.topic;

                    const completed =
                        isTopicCompleted(
                            topic,
                            item.index
                        );

                    return `
                        <div
                            class="schedule-item ${
                                completed
                                    ? "completed"
                                    : ""
                            }"
                        >
                            <div class="schedule-item-indicator">
                                ${
                                    completed
                                        ? "✓"
                                        : "📚"
                                }
                            </div>

                            <div class="schedule-item-content">
                                <strong>
                                    ${escapeHTML(
                                        topicName(
                                            topic,
                                            item.index
                                        )
                                    )}
                                </strong>

                                <span>
                                    ${
                                        escapeHTML(
                                            topicSubject(
                                                topic
                                            ) ||
                                            "Study session"
                                        )
                                    }
                                </span>
                            </div>

                            <div class="schedule-item-status">
                                ${
                                    completed
                                        ? "Done"
                                        : "Study"
                                }
                            </div>
                        </div>
                    `;
                }
            )
            .join("");

    renderNextSession();
}


/* =========================================================
   NEXT SESSION
   ========================================================= */

function renderNextSession() {
    const dateElement =
        document.getElementById(
            "nextBooking"
        );

    const timeElement =
        document.getElementById(
            "nextBookingTime"
        );

    if (
        !currentPlan ||
        !currentPlan.topics.length
    ) {
        if (dateElement) {
            dateElement.textContent =
                "No upcoming session";
        }

        if (timeElement) {
            timeElement.textContent =
                "";
        }

        return;
    }

    const today =
        new Date();

    const upcoming = [];

    currentPlan.topics.forEach(
        (topic, index) => {

            if (
                isTopicCompleted(
                    topic,
                    index
                )
            ) {
                return;
            }

            const dateValue =
                getTopicScheduledDate(
                    topic
                );

            const date =
                parseDate(
                    dateValue
                );

            if (
                date &&
                date >=
                    new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        today.getDate()
                    )
            ) {
                upcoming.push({
                    topic,
                    index,
                    date
                });
            }
        }
    );

    upcoming.sort(
        (a, b) =>
            a.date.getTime() -
            b.date.getTime()
    );

    const next =
        upcoming[0];

    if (!next) {
        if (dateElement) {
            dateElement.textContent =
                "All scheduled topics complete";
        }

        if (timeElement) {
            timeElement.textContent =
                "Excellent work.";
        }

        return;
    }

    if (dateElement) {
        dateElement.textContent =
            next.date.toLocaleDateString(
                undefined,
                {
                    weekday: "short",
                    month: "short",
                    day: "numeric"
                }
            );
    }

    if (timeElement) {
        timeElement.textContent =
            topicName(
                next.topic,
                next.index
            );
    }
}


/* =========================================================
   TIMER
   ========================================================= */

function loadTimerState() {
    const savedSeconds =
        Number(
            localStorage.getItem(
                STORAGE_KEYS.timerSeconds
            )
        );

    const savedSelected =
        Number(
            localStorage.getItem(
                STORAGE_KEYS.selectedTimerSeconds
            )
        );

    if (
        Number.isFinite(
            savedSeconds
        ) &&
        savedSeconds >= 0
    ) {
        timerSeconds =
            savedSeconds;
    } else {
        timerSeconds =
            DEFAULT_TIMER_SECONDS;
    }

    const selectedSeconds =
        Number.isFinite(
            savedSelected
        )
            ? savedSelected
            : DEFAULT_TIMER_SECONDS;

    const validSelected =
        TIMER_OPTIONS.some(
            minutes =>
                minutes * 60 ===
                selectedSeconds
        )
            ? selectedSeconds
            : DEFAULT_TIMER_SECONDS;

    localStorage.setItem(
        STORAGE_KEYS.selectedTimerSeconds,
        String(
            validSelected
        )
    );
}


function renderTimer() {
    const timerElement =
        document.getElementById(
            "studyTimer"
        );

    const timerDisplay =
        document.getElementById(
            "timerDisplay"
        );

    const timerMinutes =
        document.getElementById(
            "timerMinutes"
        );

    const runningElement =
        document.getElementById(
            "timerStatus"
        );

    const formatted =
        formatClock(
            timerSeconds
        );

    if (timerElement) {
        timerElement.textContent =
            formatted;
    }

    if (timerDisplay) {
        timerDisplay.textContent =
            formatted;
    }

    if (timerMinutes) {
        timerMinutes.textContent =
            formatted;
    }

    if (runningElement) {
        runningElement.textContent =
            timerRunning
                ? "STUDYING"
                : timerSeconds === 0
                    ? "TIME COMPLETE"
                    : "READY";
    }

    document
        .querySelectorAll(
            "[data-timer-display]"
        )
        .forEach(
            element => {
                element.textContent =
                    formatted;
            }
        );

    document
        .querySelectorAll(
            "[data-timer-status]"
        )
        .forEach(
            element => {
                element.textContent =
                    timerRunning
                        ? "STUDYING"
                        : timerSeconds === 0
                            ? "TIME COMPLETE"
                            : "READY";
            }
        );
}


function selectTimer(minutes) {
    const safeMinutes =
        Number(minutes);

    if (
        !TIMER_OPTIONS.includes(
            safeMinutes
        )
    ) {
        return;
    }

    const seconds =
        safeMinutes * 60;

    timerSeconds =
        seconds;

    localStorage.setItem(
        STORAGE_KEYS.timerSeconds,
        String(seconds)
    );

    localStorage.setItem(
        STORAGE_KEYS.selectedTimerSeconds,
        String(seconds)
    );

    if (timerRunning) {
        stopTimer();
    }

    renderTimer();
    updateTimerButtons();
    saveDashboardState();
}


function startTimer() {
    if (timerRunning) {
        return;
    }

    if (
        timerSeconds <= 0
    ) {
        const selected =
            Number(
                localStorage.getItem(
                    STORAGE_KEYS.selectedTimerSeconds
                )
            ) ||
            DEFAULT_TIMER_SECONDS;

        timerSeconds =
            selected;
    }

    timerRunning = true;

    timerInterval =
        setInterval(
            () => {

                if (
                    timerSeconds <= 0
                ) {
                    stopTimer();

                    timerSeconds = 0;

                    renderTimer();

                    showTimerComplete();

                    saveDashboardState();

                    return;
                }

                timerSeconds--;

                localStorage.setItem(
                    STORAGE_KEYS.timerSeconds,
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


function stopTimer() {
    timerRunning = false;

    if (timerInterval) {
        clearInterval(
            timerInterval
        );

        timerInterval = null;
    }

    renderTimer();
    saveDashboardState();
}


function resetTimer() {
    stopTimer();

    const selected =
        Number(
            localStorage.getItem(
                STORAGE_KEYS.selectedTimerSeconds
            )
        ) ||
        DEFAULT_TIMER_SECONDS;

    timerSeconds =
        selected;

    localStorage.setItem(
        STORAGE_KEYS.timerSeconds,
        String(timerSeconds)
    );

    renderTimer();
    saveDashboardState();
}


function showTimerComplete() {
    const message =
        document.getElementById(
            "timerCompleteMessage"
        );

    if (message) {
        message.textContent =
            "Study session complete! Great work.";
        message.style.display =
            "block";
    }

    try {
        if (
            "Notification" in window &&
            Notification.permission ===
                "granted"
        ) {
            new Notification(
                "StudyMind AI",
                {
                    body:
                        "Your study session is complete!"
                }
            );
        }
    } catch (error) {
        console.warn(
            "Notification unavailable."
        );
    }
}


function updateTimerButtons() {
    const selectedSeconds =
        Number(
            localStorage.getItem(
                STORAGE_KEYS.selectedTimerSeconds
            )
        ) ||
        DEFAULT_TIMER_SECONDS;

    document
        .querySelectorAll(
            "[data-timer-minutes]"
        )
        .forEach(
            button => {

                const minutes =
                    Number(
                        button.dataset
                            .timerMinutes
                    );

                const active =
                    minutes * 60 ===
                    selectedSeconds;

                button.classList.toggle(
                    "active",
                    active
                );

                button.setAttribute(
                    "aria-pressed",
                    active
                        ? "true"
                        : "false"
                );
            }
        );
}


/* =========================================================
   FREE AI QUESTION LIMIT
   ========================================================= */

function getAIQuestionDate() {
    return (
        localStorage.getItem(
            STORAGE_KEYS.aiQuestionDate
        ) || ""
    );
}


function getAIQuestionCount() {
    const today =
        todayDate();

    const savedDate =
        getAIQuestionDate();

    if (
        savedDate !== today
    ) {
        localStorage.setItem(
            STORAGE_KEYS.aiQuestionDate,
            today
        );

        localStorage.setItem(
            STORAGE_KEYS.aiQuestionCount,
            "0"
        );

        return 0;
    }

    const count =
        Number(
            localStorage.getItem(
                STORAGE_KEYS.aiQuestionCount
            )
        );

    return Number.isFinite(count)
        ? count
        : 0;
}


/* =========================================================
   PREMIUM-AWARE AI LIMIT
   ========================================================= */

function getRemainingAIQuestions() {
    if (isPremiumUser) {
        return Infinity;
    }

    return Math.max(
        0,
        FREE_QUESTION_LIMIT -
            getAIQuestionCount()
    );
}


function hasFreeAIQuestionsLeft() {
    if (isPremiumUser) {
        return true;
    }

    return (
        getAIQuestionCount() <
        FREE_QUESTION_LIMIT
    );
}


function recordAIQuestion() {
    if (isPremiumUser) {
        return true;
    }

    const count =
        getAIQuestionCount();

    if (
        count >=
        FREE_QUESTION_LIMIT
    ) {
        return false;
    }

    localStorage.setItem(
        STORAGE_KEYS.aiQuestionCount,
        String(
            count + 1
        )
    );

    return true;
}


function showPremiumMessage() {
    if (isPremiumUser) {
        return;
    }

    const existing =
        document.getElementById(
            "premiumLimitMessage"
        );

    if (existing) {
        existing.remove();
    }

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.id =
        "premiumLimitMessage";

    wrapper.className =
        "premium-limit-message";

    wrapper.innerHTML = `
        <div>
            <strong>
                You've reached your free AI limit.
            </strong>

            <p>
                Free accounts can ask StudyMind AI
                up to ${FREE_QUESTION_LIMIT}
                questions per day.
            </p>
        </div>

        <a
            href="premium.html"
            class="premium-limit-button"
        >
            💎 Explore Premium
        </a>
    `;

    document.body.appendChild(
        wrapper
    );
}


/* =========================================================
   PREMIUM DASHBOARD STYLES
   ========================================================= */

function injectPremiumDashboardStyles() {
    if (
        document.getElementById(
            "studymind-premium-dashboard-styles"
        )
    ) {
        return;
    }

    const style =
        document.createElement(
            "style"
        );

    style.id =
        "studymind-premium-dashboard-styles";

    style.textContent = `
        /* ================================================
           STUDYMIND PREMIUM DASHBOARD
           ================================================ */

        :root {
            --premium-gold: #d4af37;
            --premium-gold-bright: #f7d774;
            --premium-gold-light: #ffe8a3;
            --premium-gold-dark: #8f6b16;
            --premium-gold-border: rgba(212, 175, 55, 0.45);
            --premium-gold-glow: rgba(212, 175, 55, 0.25);
        }

        body.premium-dashboard {
            background:
                radial-gradient(
                    circle at top right,
                    rgba(212,175,55,.13),
                    transparent 35%
                ),
                radial-gradient(
                    circle at bottom left,
                    rgba(212,175,55,.08),
                    transparent 35%
                ),
                #090d18 !important;
        }

        body.premium-dashboard::before {
            content: "";
            position: fixed;
            inset: 0;
            pointer-events: none;
            z-index: -1;
            background:
                linear-gradient(
                    135deg,
                    rgba(212,175,55,.025),
                    transparent 45%,
                    rgba(212,175,55,.035)
                );
        }

        body.premium-dashboard nav,
        body.premium-dashboard .navbar,
        body.premium-dashboard .topbar,
        body.premium-dashboard header {
            border-bottom-color:
                var(--premium-gold-border) !important;
        }

        body.premium-dashboard .logo,
        body.premium-dashboard .brand,
        body.premium-dashboard .dashboard-title,
        body.premium-dashboard h1 {
            color:
                var(--premium-gold-bright) !important;
        }

        body.premium-dashboard .logo::after {
            content: "  👑 PREMIUM";
            font-size: .68em;
            font-weight: 800;
            letter-spacing: .08em;
            color:
                var(--premium-gold-bright);
            vertical-align: middle;
        }

        body.premium-dashboard
        .stat-card,
        body.premium-dashboard
        .current-topic-card,
        body.premium-dashboard
        .timer-card,
        body.premium-dashboard
        .progress-card,
        body.premium-dashboard
        .daily-challenge-card,
        body.premium-dashboard
        .calendar-card,
        body.premium-dashboard
        .schedule-card,
        body.premium-dashboard
        .subject-card,
        body.premium-dashboard
        .topic-card,
        body.premium-dashboard
        .quick-access-card,
        body.premium-dashboard
        .dashboard-card,
        body.premium-dashboard
        .card,
        body.premium-dashboard
        main > section {
            border-color:
                var(--premium-gold-border) !important;

            box-shadow:
                0 12px 35px
                rgba(0,0,0,.18),
                0 0 22px
                rgba(212,175,55,.035);
        }

        body.premium-dashboard
        .stat-card:hover,
        body.premium-dashboard
        .topic-card:hover,
        body.premium-dashboard
        .subject-card:hover {
            border-color:
                rgba(247,215,116,.75) !important;

            box-shadow:
                0 16px 40px
                rgba(0,0,0,.25),
                0 0 30px
                rgba(212,175,55,.10);
        }

        body.premium-dashboard
        .primary-button,
        body.premium-dashboard
        .btn-primary,
        body.premium-dashboard
        button.primary,
        body.premium-dashboard
        .generate-button,
        body.premium-dashboard
        .start-button {
            background:
                linear-gradient(
                    135deg,
                    #b88a16,
                    #e5c34f
                ) !important;

            color:
                #111 !important;

            border-color:
                var(--premium-gold) !important;

            box-shadow:
                0 8px 22px
                rgba(212,175,55,.20);
        }

        body.premium-dashboard
        .primary-button:hover,
        body.premium-dashboard
        .btn-primary:hover,
        body.premium-dashboard
        button.primary:hover,
        body.premium-dashboard
        .generate-button:hover,
        body.premium-dashboard
        .start-button:hover {
            transform:
                translateY(-1px);

            box-shadow:
                0 12px 30px
                rgba(212,175,55,.30);
        }

        body.premium-dashboard
        .progress-bar-fill,
        body.premium-dashboard
        .subject-progress-fill {
            background:
                linear-gradient(
                    90deg,
                    #a97912,
                    #f7d774
                ) !important;

            box-shadow:
                0 0 12px
                rgba(212,175,55,.25);
        }

        body.premium-dashboard
        input:focus,
        body.premium-dashboard
        select:focus,
        body.premium-dashboard
        textarea:focus {
            border-color:
                var(--premium-gold) !important;

            box-shadow:
                0 0 0 3px
                rgba(212,175,55,.12) !important;
        }

        body.premium-dashboard
        .timer-option.active,
        body.premium-dashboard
        [data-timer-minutes].active {
            background:
                linear-gradient(
                    135deg,
                    #b88a16,
                    #e5c34f
                ) !important;

            color:
                #111 !important;

            border-color:
                var(--premium-gold) !important;
        }

        body.premium-dashboard
        .calendar-day.study-day {
            border-color:
                rgba(212,175,55,.48) !important;
        }

        body.premium-dashboard
        .calendar-day.completed-study-day {
            background:
                rgba(212,175,55,.14) !important;

            border-color:
                var(--premium-gold) !important;
        }

        body.premium-dashboard
        .calendar-day.today {
            box-shadow:
                0 0 0 2px
                var(--premium-gold),
                0 0 18px
                rgba(212,175,55,.22);
        }

        body.premium-dashboard
        .topic-card.active {
            border-color:
                var(--premium-gold) !important;

            background:
                rgba(212,175,55,.07) !important;
        }

        body.premium-dashboard
        .premium-dashboard-banner {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 18px;
            margin: 0 0 24px;
            padding: 16px 20px;
            border: 1px solid
                rgba(212,175,55,.48);
            border-radius: 18px;
            background:
                linear-gradient(
                    135deg,
                    rgba(212,175,55,.13),
                    rgba(212,175,55,.045)
                );
            box-shadow:
                0 10px 35px
                rgba(212,175,55,.08);
            overflow: hidden;
        }

        body.premium-dashboard
        .premium-dashboard-banner::before {
            content: "";
            position: absolute;
            top: 0;
            left: -100%;
            width: 60%;
            height: 100%;
            background:
                linear-gradient(
                    90deg,
                    transparent,
                    rgba(255,255,255,.08),
                    transparent
                );
            transform: skewX(-20deg);
            animation:
                premiumShine 5s
                ease-in-out infinite;
        }

        body.premium-dashboard
        .premium-dashboard-banner-main {
            display: flex;
            align-items: center;
            gap: 12px;
            position: relative;
            z-index: 1;
        }

        body.premium-dashboard
        .premium-dashboard-banner-icon {
            width: 42px;
            height: 42px;
            display: grid;
            place-items: center;
            border-radius: 12px;
            background:
                rgba(212,175,55,.14);
            font-size: 21px;
        }

        body.premium-dashboard
        .premium-dashboard-banner strong {
            display: block;
            color:
                var(--premium-gold-bright);
            font-size: 14px;
            letter-spacing: .02em;
        }

        body.premium-dashboard
        .premium-dashboard-banner span {
            display: block;
            margin-top: 3px;
            color:
                rgba(255,255,255,.70);
            font-size: 13px;
        }

        body.premium-dashboard
        .premium-dashboard-status {
            position: relative;
            z-index: 1;
            white-space: nowrap;
            padding: 8px 12px;
            border-radius: 999px;
            background:
                rgba(212,175,55,.12);
            border: 1px solid
                rgba(212,175,55,.35);
            color:
                var(--premium-gold-bright);
            font-size: 11px;
            font-weight: 800;
            letter-spacing: .08em;
        }

        @keyframes premiumShine {
            0%, 60% {
                left: -100%;
            }

            100% {
                left: 160%;
            }
        }

        body.premium-dashboard
        .premium-limit-message {
            position: fixed;
            right: 24px;
            bottom: 24px;
            z-index: 9999;
            max-width: 380px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 18px;
            border-radius: 18px;
            background:
                #101827;
            border: 1px solid
                var(--premium-gold-border);
            box-shadow:
                0 20px 50px
                rgba(0,0,0,.35);
        }

        body.premium-dashboard
        .premium-limit-message strong {
            color:
                var(--premium-gold-bright);
        }

        body.premium-dashboard
        .premium-limit-message p {
            margin: 5px 0 0;
            color:
                rgba(255,255,255,.68);
            font-size: 13px;
        }

        body.premium-dashboard
        .premium-limit-button {
            flex-shrink: 0;
            padding: 10px 14px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 800;
            background:
                linear-gradient(
                    135deg,
                    #b88a16,
                    #e5c34f
                );
            color: #111;
        }

        body.light-mode.premium-dashboard {
            background:
                radial-gradient(
                    circle at top right,
                    rgba(212,175,55,.13),
                    transparent 35%
                ),
                #f8f7f2 !important;
        }

        body.light-mode.premium-dashboard
        .premium-dashboard-banner {
            background:
                linear-gradient(
                    135deg,
                    rgba(212,175,55,.13),
                    rgba(212,175,55,.035)
                );
        }

        body.light-mode.premium-dashboard
        .premium-dashboard-banner span {
            color:
                rgba(20,20,20,.65);
        }

        @media (max-width: 700px) {
            body.premium-dashboard
            .premium-dashboard-banner {
                align-items: flex-start;
                flex-direction: column;
            }

            body.premium-dashboard
            .premium-dashboard-status {
                align-self: flex-start;
            }

            body.premium-dashboard
            .premium-limit-message {
                left: 16px;
                right: 16px;
                bottom: 16px;
                max-width: none;
            }
        }
    `;

    document.head.appendChild(
        style
    );
}


/* =========================================================
   PREMIUM DASHBOARD BANNER
   ========================================================= */

function addPremiumDashboardBanner() {
    if (
        document.getElementById(
            "premiumDashboardBanner"
        )
    ) {
        return;
    }

    const banner =
        document.createElement(
            "div"
        );

    banner.id =
        "premiumDashboardBanner";

    banner.className =
        "premium-dashboard-banner";

    banner.innerHTML = `
        <div class="premium-dashboard-banner-main">
            <div class="premium-dashboard-banner-icon">
                👑
            </div>

            <div>
                <strong>
                    StudyMind Premium
                </strong>

                <span>
                    Unlimited AI support and your full Premium workspace are unlocked.
                </span>
            </div>
        </div>

        <div class="premium-dashboard-status">
            PREMIUM ACTIVE
        </div>
    `;

    const possibleParents = [
        document.querySelector(
            ".dashboard-heading"
        ),
        document.querySelector(
            ".dashboard-header"
        ),
        document.querySelector(
            "main"
        )
    ];

    const parent =
        possibleParents.find(
            element => element
        );

    if (parent) {
        parent.insertBefore(
            banner,
            parent.firstChild
        );
    }
}


/* =========================================================
   PREMIUM COPY
   ========================================================= */

function updatePremiumDashboardCopy() {
    const dashboardTitle =
        document.getElementById(
            "dashboardTitle"
        );

    if (
        dashboardTitle &&
        isPremiumUser
    ) {
        dashboardTitle.textContent =
            "Your Premium Dashboard";
    }

    const workspaceTitle =
        document.getElementById(
            "workspaceTitle"
        );

    if (
        workspaceTitle &&
        isPremiumUser
    ) {
        workspaceTitle.textContent =
            "Premium Study Workspace";
    }
}


/* =========================================================
   ACTIVATE PREMIUM DASHBOARD
   ========================================================= */

function activatePremiumDashboard() {
    injectPremiumDashboardStyles();

    document.body.classList.add(
        "premium-dashboard"
    );

    addPremiumDashboardBanner();
    updatePremiumDashboardCopy();
}


/* =========================================================
   DEACTIVATE PREMIUM DASHBOARD
   ========================================================= */

function deactivatePremiumDashboard() {
    document.body.classList.remove(
        "premium-dashboard"
    );

    const banner =
        document.getElementById(
            "premiumDashboardBanner"
        );

    if (banner) {
        banner.remove();
    }
}


/* =========================================================
   VERIFY PREMIUM ACCESS
   ========================================================= */

async function verifyPremiumDashboardAccess() {
    premiumStatusLoaded = false;
    isPremiumUser = false;

    try {
        const client =
            window.supabaseClient ||
            window.supabase;

        if (
            !client ||
            typeof client.auth?.getSession !==
                "function"
        ) {
            console.warn(
                "StudyMind AI: Supabase client unavailable for Premium verification."
            );

            deactivatePremiumDashboard();

            return false;
        }

        const {
            data,
            error
        } =
            await client.auth.getSession();

        if (
            error ||
            !data?.session
        ) {
            deactivatePremiumDashboard();

            return false;
        }

        const token =
            data.session.access_token;

        const response =
            await fetch(
                PREMIUM_STATUS_ENDPOINT,
                {
                    method: "GET",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    }
                }
            );

        if (!response.ok) {
            console.warn(
                "StudyMind AI: Premium status request failed:",
                response.status
            );

            deactivatePremiumDashboard();

            return false;
        }

        const result =
            await response.json();

        isPremiumUser =
            result?.premium === true;

        premiumStatusLoaded =
            true;

        if (isPremiumUser) {
            activatePremiumDashboard();
        } else {
            deactivatePremiumDashboard();
        }

        return isPremiumUser;
    } catch (error) {
        console.error(
            "StudyMind AI: Premium verification failed:",
            error
        );

        isPremiumUser = false;
        premiumStatusLoaded = true;

        deactivatePremiumDashboard();

        return false;
    }
}


/* =========================================================
   THEME
   ========================================================= */

function applyTheme() {
    const theme =
        localStorage.getItem(
            STORAGE_KEYS.theme
        ) || "dark";

    document.body.classList.toggle(
        "light-mode",
        theme === "light"
    );

    updateThemeButton();
}


function updateThemeButton() {
    const theme =
        localStorage.getItem(
            STORAGE_KEYS.theme
        ) || "dark";

    const buttons =
        document.querySelectorAll(
            "[data-theme-toggle], #themeToggle, #themeButton"
        );

    buttons.forEach(
        button => {
            button.textContent =
                theme === "light"
                    ? "🌙"
                    : "☀️";

            button.setAttribute(
                "aria-label",
                theme === "light"
                    ? "Switch to dark mode"
                    : "Switch to light mode"
            );
        }
    );
}


function toggleTheme() {
    const current =
        localStorage.getItem(
            STORAGE_KEYS.theme
        ) || "dark";

    const next =
        current === "light"
            ? "dark"
            : "light";

    localStorage.setItem(
        STORAGE_KEYS.theme,
        next
    );

    applyTheme();
}


/* =========================================================
   PLAN TABS
   ========================================================= */

function injectPlanTabs() {
    const plans =
        getSavedPlans();

    if (
        plans.length <= 1
    ) {
        const existing =
            document.getElementById(
                "studyPlanTabs"
            );

        if (existing) {
            existing.remove();
        }

        return;
    }

    if (
        document.getElementById(
            "studyPlanTabs"
        )
    ) {
        renderPlanTabs(
            plans
        );

        return;
    }

    const tabs =
        document.createElement(
            "div"
        );

    tabs.id =
        "studyPlanTabs";

    tabs.className =
        "study-plan-tabs";

    const heading =
        document.querySelector(
            ".dashboard-heading"
        ) ||
        document.querySelector(
            ".dashboard-header"
        ) ||
        document.querySelector(
            "main"
        );

    if (heading) {
        heading.appendChild(
            tabs
        );
    }

    renderPlanTabs(
        plans
    );
}


function renderPlanTabs(
    plans
) {
    const container =
        document.getElementById(
            "studyPlanTabs"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="study-plan-tabs-inner">
            ${plans
                .map(
                    plan => `
                        <button
                            type="button"
                            class="study-plan-tab ${
                                plan.id ===
                                activePlanId
                                    ? "active"
                                    : ""
                            }"
                            data-plan-id="${escapeHTML(
                                plan.id
                            )}"
                        >
                            ${escapeHTML(
                                plan.name
                            )}
                        </button>
                    `
                )
                .join("")}
        </div>
    `;

    container
        .querySelectorAll(
            "[data-plan-id]"
        )
        .forEach(
            button => {
                button.addEventListener(
                    "click",
                    () => {
                        switchStudyPlan(
                            button.dataset
                                .planId
                        );
                    }
                );
            }
        );
}


function switchStudyPlan(
    planId
) {
    if (!planId) {
        return;
    }

    if (
        currentPlan &&
        currentPlan.id ===
            planId
    ) {
        return;
    }

    syncActivePlanRecord();

    const plans =
        getSavedPlans();

    const selected =
        plans.find(
            plan =>
                plan.id === planId
        );

    if (!selected) {
        return;
    }

    currentPlan =
        normalizePlan(
            selected,
            selected.id
        );

    activePlanId =
        currentPlan.id;

    setActivePlanId(
        currentPlan.id
    );

    currentTopicIndex =
        Number(
            selected.currentTopicIndex
        ) || 0;

    if (
        currentTopicIndex >=
        currentPlan.topics.length
    ) {
        currentTopicIndex =
            Math.max(
                0,
                currentPlan.topics.length - 1
            );
    }

    loadTimerState();

    saveLegacyState();

    renderAll();
}


/* =========================================================
   TOPIC CLICK
   ========================================================= */

function selectTopic(index) {
    if (
        !currentPlan ||
        !currentPlan.topics[index]
    ) {
        return;
    }

    currentTopicIndex =
        index;

    localStorage.setItem(
        STORAGE_KEYS.currentTopicIndex,
        String(index)
    );

    syncActivePlanRecord();

    renderAll();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   KNOWLEDGE CHECK BUTTON
   ========================================================= */

function bindKnowledgeCheckButton() {
    const buttons =
        document.querySelectorAll(
            "#startKnowledgeCheck, [data-start-knowledge-check]"
        );

    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const topic =
                        getCurrentTopic();

                    if (!topic) {
                        return;
                    }

                    openKnowledgeCheckPage(
                        topic,
                        currentTopicIndex
                    );
                }
            );
        }
    );
}


/* =========================================================
   COMPLETE TOPIC BUTTON
   ========================================================= */

function bindTopicCompletion() {
    const checkbox =
        document.getElementById(
            "topicCompleteCheckbox"
        );

    if (!checkbox) {
        return;
    }

    checkbox.addEventListener(
        "change",
        event => {

            if (
                event.target.checked
            ) {
                completeCurrentTopic();
            }
        }
    );
}


/* =========================================================
   NEXT TOPIC
   ========================================================= */

function goToNextTopic() {
    if (!currentPlan) {
        return;
    }

    if (
        currentTopicIndex <
        currentPlan.topics.length - 1
    ) {
        currentTopicIndex++;

        localStorage.setItem(
            STORAGE_KEYS.currentTopicIndex,
            String(
                currentTopicIndex
            )
        );

        syncActivePlanRecord();

        renderAll();
    }
}


function goToPreviousTopic() {
    if (!currentPlan) {
        return;
    }

    if (
        currentTopicIndex > 0
    ) {
        currentTopicIndex--;

        localStorage.setItem(
            STORAGE_KEYS.currentTopicIndex,
            String(
                currentTopicIndex
            )
        );

        syncActivePlanRecord();

        renderAll();
    }
}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logoutStudyMind() {
    try {
        const client =
            window.supabaseClient ||
            window.supabase;

        if (
            client?.auth?.signOut
        ) {
            await client.auth.signOut();
        }
    } catch (error) {
        console.error(
            "Logout error:",
            error
        );
    }

    window.location.href =
        "login.html";
}


/* =========================================================
   AUTHENTICATION
   ========================================================= */

async function checkAuthentication() {
    const client =
        window.supabaseClient ||
        window.supabase;

    if (
        !client ||
        typeof client.auth?.getSession !==
            "function"
    ) {
        console.warn(
            "StudyMind AI: Supabase client not ready."
        );

        return null;
    }

    try {
        const {
            data,
            error
        } =
            await client.auth.getSession();

        if (
            error ||
            !data?.session
        ) {
            window.location.href =
                "login.html";

            return null;
        }

        currentUser =
            data.session.user;

        return currentUser;
    } catch (error) {
        console.error(
            "Authentication check failed:",
            error
        );

        window.location.href =
            "login.html";

        return null;
    }
}


/* =========================================================
   USERNAME
   ========================================================= */

function getUsername() {
    if (!currentUser) {
        return "Student";
    }

    const metadata =
        currentUser.user_metadata ||
        {};

    return (
        clean(
            metadata.username
        ) ||
        clean(
            metadata.user_name
        ) ||
        clean(
            metadata.full_name
        ) ||
        clean(
            metadata.name
        ) ||
        clean(
            currentUser.email
                ?.split("@")[0]
        ) ||
        "Student"
    );
}


function renderUserGreeting() {
    const hour =
        new Date().getHours();

    let greeting =
        "Good morning";

    if (hour >= 12 && hour < 17) {
        greeting =
            "Good afternoon";
    } else if (hour >= 17) {
        greeting =
            "Good evening";
    }

    const username =
        getUsername();

    const greetingText =
        `${greeting}, ${username} 👋`;

    const elements =
        document.querySelectorAll(
            "#dashboardGreeting, #welcomeMessage, [data-dashboard-greeting]"
        );

    elements.forEach(
        element => {
            element.textContent =
                greetingText;
        }
    );
}


/* =========================================================
   FULL PLAN COMPLETION
   ========================================================= */

function isEntirePlanCompleted() {
    if (
        !currentPlan ||
        !currentPlan.topics.length
    ) {
        return false;
    }

    return currentPlan.topics.every(
        (topic, index) =>
            isTopicCompleted(
                topic,
                index
            )
    );
}


function showCompletionCelebrationIfNeeded() {
    if (
        !isEntirePlanCompleted()
    ) {
        return;
    }

    const shownKey =
        `${STORAGE_KEYS.completionCelebrationShown}-${currentPlan.id}`;

    if (
        localStorage.getItem(
            shownKey
        ) === "true"
    ) {
        return;
    }

    localStorage.setItem(
        shownKey,
        "true"
    );

    const existing =
        document.getElementById(
            "studyMindCompletionCelebration"
        );

    if (existing) {
        return;
    }

    const overlay =
        document.createElement(
            "div"
        );

    overlay.id =
        "studyMindCompletionCelebration";

    overlay.innerHTML = `
        <div class="completion-celebration-card">
            <div class="completion-celebration-icon">
                🎉
            </div>

            <h2>
                Study Plan Complete!
            </h2>

            <p>
                You completed every topic in this study plan.
                Excellent work!
            </p>

            <button
                type="button"
                id="closeCompletionCelebration"
            >
                Continue
            </button>
        </div>
    `;

    const style =
        document.createElement(
            "style"
        );

    style.textContent = `
        #studyMindCompletionCelebration {
            position: fixed;
            inset: 0;
            z-index: 10000;
            display: grid;
            place-items: center;
            padding: 24px;
            background:
                rgba(3,7,18,.78);
            backdrop-filter:
                blur(10px);
        }

        .completion-celebration-card {
            width: min(480px, 100%);
            padding: 34px;
            border-radius: 24px;
            text-align: center;
            background:
                #101827;
            border: 1px solid
                rgba(212,175,55,.45);
            box-shadow:
                0 30px 80px
                rgba(0,0,0,.4);
        }

        .completion-celebration-icon {
            font-size: 52px;
            margin-bottom: 12px;
        }

        .completion-celebration-card h2 {
            margin: 0 0 10px;
        }

        .completion-celebration-card p {
            color:
                rgba(255,255,255,.68);
            line-height: 1.6;
        }

        .completion-celebration-card button {
            margin-top: 16px;
            padding: 12px 20px;
            border: 0;
            border-radius: 12px;
            background:
                linear-gradient(
                    135deg,
                    #b88a16,
                    #e5c34f
                );
            color: #111;
            font-weight: 800;
            cursor: pointer;
        }
    `;

    document.head.appendChild(
        style
    );

    document.body.appendChild(
        overlay
    );

    const closeButton =
        document.getElementById(
            "closeCompletionCelebration"
        );

    if (closeButton) {
        closeButton.addEventListener(
            "click",
            () => {
                overlay.remove();
            }
        );
    }
}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function initializeEventListeners() {

    /* ---------------------------------------------
       Theme
       --------------------------------------------- */

    document
        .querySelectorAll(
            "[data-theme-toggle], #themeToggle, #themeButton"
        )
        .forEach(
            button => {
                button.addEventListener(
                    "click",
                    toggleTheme
                );
            }
        );


    /* ---------------------------------------------
       Timer start / stop
       --------------------------------------------- */

    document
        .querySelectorAll(
            "#startTimer, [data-start-timer]"
        )
        .forEach(
            button => {
                button.addEventListener(
                    "click",
                    startTimer
                );
            }
        );


    document
        .querySelectorAll(
            "#pauseTimer, #stopTimer, [data-stop-timer]"
        )
        .forEach(
            button => {
                button.addEventListener(
                    "click",
                    stopTimer
                );
            }
        );


    document
        .querySelectorAll(
            "#resetTimer, [data-reset-timer]"
        )
        .forEach(
            button => {
                button.addEventListener(
                    "click",
                    resetTimer
                );
            }
        );


    /* ---------------------------------------------
       Timer choices
       --------------------------------------------- */

    document
        .querySelectorAll(
            "[data-timer-minutes]"
        )
        .forEach(
            button => {
                button.addEventListener(
                    "click",
                    () => {
                        selectTimer(
                            Number(
                                button.dataset
                                    .timerMinutes
                            )
                        );
                    }
                );
            }
        );


    /* ---------------------------------------------
       Topic cards
       --------------------------------------------- */

    document
        .querySelectorAll(
            "[data-topic-index]"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    () => {

                        const index =
                            Number(
                                element.dataset
                                    .topicIndex
                            );

                        if (
                            Number.isFinite(
                                index
                            )
                        ) {
                            selectTopic(
                                index
                            );
                        }
                    }
                );
            }
        );


    /* ---------------------------------------------
       Previous / next topic
       --------------------------------------------- */

    document
        .querySelectorAll(
            "#nextTopic, [data-next-topic]"
        )
        .forEach(
            button => {
                button.addEventListener(
                    "click",
                    goToNextTopic
                );
            }
        );


    document
        .querySelectorAll(
            "#previousTopic, [data-previous-topic]"
        )
        .forEach(
            button => {
                button.addEventListener(
                    "click",
                    goToPreviousTopic
                );
            }
        );


    /* ---------------------------------------------
       Knowledge check
       --------------------------------------------- */

    bindKnowledgeCheckButton();


    /* ---------------------------------------------
       Topic completion
       --------------------------------------------- */

    bindTopicCompletion();


    /* ---------------------------------------------
       Calendar navigation
       --------------------------------------------- */

    document
        .querySelectorAll(
            "#previousMonth, [data-calendar-prev]"
        )
        .forEach(
            button => {
                button.addEventListener(
                    "click",
                    () =>
                        changeCalendarMonth(
                            -1
                        )
                );
            }
        );


    document
        .querySelectorAll(
            "#nextMonth, [data-calendar-next]"
        )
        .forEach(
            button => {
                button.addEventListener(
                    "click",
                    () =>
                        changeCalendarMonth(
                            1
                        )
                );
            }
        );


    /* ---------------------------------------------
       Calendar date clicks
       --------------------------------------------- */

    const calendar =
        document.getElementById(
            "calendarDays"
        );

    if (calendar) {
        calendar.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-calendar-date]"
                    );

                if (!button) {
                    return;
                }

                const date =
                    button.dataset
                        .calendarDate;

                const sessions =
                    getTopicsScheduledForDate(
                        date
                    );

                if (
                    sessions.length
                ) {
                    selectTopic(
                        sessions[0].index
                    );
                }
            }
        );
    }


    /* ---------------------------------------------
       Logout
       --------------------------------------------- */

    document
        .querySelectorAll(
            "#logoutButton, #logoutBtn, [data-logout]"
        )
        .forEach(
            button => {
                button.addEventListener(
                    "click",
                    logoutStudyMind
                );
            }
        );


    /* ---------------------------------------------
       Save state periodically
       --------------------------------------------- */

    if (stateSaveInterval) {
        clearInterval(
            stateSaveInterval
        );
    }

    stateSaveInterval =
        setInterval(
            saveDashboardState,
            5000
        );


    /* ---------------------------------------------
       Before leaving page
       --------------------------------------------- */

    window.addEventListener(
        "beforeunload",
        () => {
            saveDashboardState();

            if (
                currentPlan &&
                getCurrentTopic()
            ) {
                const topic =
                    getCurrentTopic();

                const elapsed =
                    getTopicReading(
                        topic,
                        currentTopicIndex
                    );

                saveTopicReading(
                    topic,
                    currentTopicIndex,
                    elapsed
                );
            }
        }
    );
}


/* =========================================================
   RENDER ALL
   ========================================================= */

function renderAll() {
    applyTheme();

    renderUserGreeting();

    renderStats();

    renderCurrentTopic();

    renderProgress();

    renderTopics();

    renderSubjects();

    renderDailyChallenge();

    renderCalendar();

    renderSchedule();

    renderTimer();

    updateTimerButtons();

    injectPlanTabs();

    updatePremiumDashboardCopy();

    showCompletionCelebrationIfNeeded();
}


/* =========================================================
   LOAD CURRENT USER
   ========================================================= */

async function loadCurrentUser() {
    return await checkAuthentication();
}


/* =========================================================
   INITIALIZE DASHBOARD
   ========================================================= */

async function initializeDashboard() {
    if (dashboardInitialized) {
        return;
    }

    dashboardInitialized = true;

    applyTheme();

    const user =
        await loadCurrentUser();

    if (!user) {
        return;
    }

    currentUser =
        user;

    /*
       IMPORTANT:
       Premium status is checked from the
       server before rendering the dashboard.
    */

    await verifyPremiumDashboardAccess();

    /*
       Load the user's study plan.
    */

    loadActivePlan();

    /*
       If there is no active topic,
       move to the first incomplete topic.
    */

    if (
        currentPlan &&
        currentPlan.topics.length
    ) {
        const savedIndex =
            Number(
                localStorage.getItem(
                    STORAGE_KEYS.currentTopicIndex
                )
            );

        if (
            Number.isFinite(
                savedIndex
            ) &&
            savedIndex >= 0 &&
            savedIndex <
                currentPlan.topics.length
        ) {
            currentTopicIndex =
                savedIndex;
        } else {
            currentTopicIndex =
                getFirstIncompleteTopicIndex();
        }
    }

    loadTimerState();

    initializeEventListeners();

    startReadingPersistence();

    renderAll();

    /*
       Re-check Premium status when the
       authentication state changes.
    */

    const client =
        window.supabaseClient ||
        window.supabase;

    if (
        client?.auth?.onAuthStateChange
    ) {
        client.auth.onAuthStateChange(
            async (
                event,
                session
            ) => {

                if (
                    event ===
                    "SIGNED_OUT"
                ) {
                    window.location.href =
                        "login.html";

                    return;
                }

                if (
                    session?.user
                ) {
                    currentUser =
                        session.user;

                    await verifyPremiumDashboardAccess();

                    renderAll();
                }
            }
        );
    }
}


/* =========================================================
   PUBLIC GLOBALS
   ========================================================= */

window.isStudyMindPremium =
    function () {
        return (
            isPremiumUser === true
        );
    };


window.verifyPremiumDashboardAccess =
    verifyPremiumDashboardAccess;


window.getRemainingAIQuestions =
    getRemainingAIQuestions;


window.hasFreeAIQuestionsLeft =
    hasFreeAIQuestionsLeft;


window.recordAIQuestion =
    recordAIQuestion;


window.showPremiumMessage =
    showPremiumMessage;


window.startStudyTimer =
    startTimer;


window.stopStudyTimer =
    stopTimer;


window.resetStudyTimer =
    resetTimer;


window.selectStudyTimer =
    selectTimer;


window.completeCurrentTopic =
    completeCurrentTopic;


window.openKnowledgeCheckPage =
    openKnowledgeCheckPage;


window.switchStudyPlan =
    switchStudyPlan;


/* =========================================================
   AUTO START
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
   END OF DASHBOARD.JS
   ========================================================= */
