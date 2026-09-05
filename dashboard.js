/* =========================================================
   STUDYMIND AI — DASHBOARD.JS
   COMPLETE REPLACEMENT

   FEATURES:
   - Subject → Topic → Topic → Next Subject flow
   - Persistent study session
   - Persistent reading content
   - Leave app and return without losing study state
   - Complete reading → Knowledge Check
   - Study streak connected to completed reading
   - 25 / 45 / 60 minute study timer
   - AI questions
   - Progress tracking
   - Calendar
   - Daily challenge
   - Completion celebration
   - Light / Dark Mode
========================================================= */

"use strict";


/* =========================================================
   STORAGE KEYS
========================================================= */

const PLAN_KEY =
    "studyMindPlan";

const LEGACY_PLAN_KEY =
    "studyData";

const COMPLETED_KEY =
    "studyMindCompletedTopics";

const COMPLETED_Q_KEY =
    "studyMindCompletedQuestionTopics";

const CURRENT_INDEX_KEY =
    "studyMindCurrentTopicIndex";

const KNOWLEDGE_TOPIC_KEY =
    "studyMindKnowledgeCheckTopic";

const KNOWLEDGE_QUESTIONS_KEY =
    "studyMindTopicQuestions";

const CELEBRATION_KEY =
    "studyMindCompletionCelebrationShown";

const TIMER_SECONDS_KEY =
    "studyMindTimerSeconds";

const TIMER_DURATION_KEY =
    "studyMindSelectedTimerSeconds";

const THEME_KEY =
    "studyMindTheme";

const AI_COUNT_KEY =
    "aiQuestionCount";

const AI_DATE_KEY =
    "aiQuestionDate";

const STREAK_KEY =
    "studyMindStreak";

const LAST_STUDY_KEY =
    "lastStudyDate";

const STUDY_SESSION_KEY =
    "studyMindCurrentStudySession";


/* =========================================================
   SETTINGS
========================================================= */

const FREE_AI_LIMIT =
    5;

const TIMER_OPTIONS = [
    25,
    45,
    60
];

const DEFAULT_TIMER_SECONDS =
    25 * 60;


/* =========================================================
   GLOBAL STATE
========================================================= */

let studyPlan = null;

let subjects = [];

let allTopics = [];

let completedTopics = [];

let completedQuestionTopics = [];

let currentTopicIndex =
    Number(
        localStorage.getItem(
            CURRENT_INDEX_KEY
        )
    ) || 0;

let timerSeconds =
    Number(
        localStorage.getItem(
            TIMER_SECONDS_KEY
        )
    ) || DEFAULT_TIMER_SECONDS;

let selectedTimerSeconds =
    Number(
        localStorage.getItem(
            TIMER_DURATION_KEY
        )
    ) || DEFAULT_TIMER_SECONDS;

let timerInterval = null;

let timerRunning = false;

let calendarDate =
    new Date();

let currentUser = null;

let currentStudySession = null;

let readingObserverStarted =
    false;


/* =========================================================
   ELEMENT HELPER
========================================================= */

const $ = id =>
    document.getElementById(id);


/* =========================================================
   JSON HELPERS
========================================================= */

function readJSON(
    key,
    fallback = null
) {

    try {

        const raw =
            localStorage.getItem(key);

        return raw
            ? JSON.parse(raw)
            : fallback;

    } catch (error) {

        console.error(
            "StudyMind JSON read error:",
            error
        );

        return fallback;

    }

}


function writeJSON(
    key,
    value
) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

        return true;

    } catch (error) {

        console.error(
            "StudyMind storage error:",
            error
        );

        return false;

    }

}


/* =========================================================
   TEXT HELPERS
========================================================= */

function clean(value) {

    return String(
        value ?? ""
    )
        .replace(/\s+/g, " ")
        .trim();

}


function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   TOPIC HELPERS
========================================================= */

function topicName(topic) {

    return clean(
        typeof topic === "string"
            ? topic
            : topic?.name ||
              topic?.topic ||
              topic?.title
    );

}


function topicSubject(topic) {

    return clean(
        topic?.subject ||
        topic?.subjectName ||
        ""
    );

}


function topicKey(topic) {

    return `${clean(
        topic?.subject ||
        "Senior Secondary"
    ).toLowerCase()}::${clean(
        topicName(topic)
    ).toLowerCase()}`;

}


/* =========================================================
   NORMALIZE TOPIC
========================================================= */

function normalizeTopic(
    raw,
    subject = "",
    index = 0
) {

    if (
        typeof raw === "string" ||
        typeof raw === "number"
    ) {

        const name =
            clean(raw);

        if (!name) {

            return null;

        }

        return {

            id:
                `topic-${index}-${name
                    .toLowerCase()
                    .replace(/\W+/g, "-")}`,

            name,

            subject,

            description:
                `Study ${name} and complete the knowledge check.`

        };

    }


    if (
        !raw ||
        typeof raw !== "object"
    ) {

        return null;

    }


    const name =
        topicName(raw);

    if (!name) {

        return null;

    }


    return {

        id:
            clean(
                raw.id ||
                raw.topicId ||
                raw.topic_id
            ) ||
            `topic-${index}-${name
                .toLowerCase()
                .replace(/\W+/g, "-")}`,

        name,

        subject:
            clean(
                raw.subject ||
                raw.subjectName ||
                subject
            ),

        description:
            clean(
                raw.description ||
                raw.desc
            ) ||
            `Study ${name} and complete the knowledge check.`

    };

}


/* =========================================================
   NORMALIZE PLAN
========================================================= */

function normalizePlan(raw) {

    if (
        !raw ||
        typeof raw !== "object"
    ) {

        return null;

    }


    const plan =
        raw.studyPlan &&
        typeof raw.studyPlan === "object"

            ? raw.studyPlan

            : raw.plan &&
              typeof raw.plan === "object"

                ? raw.plan

                : raw;


    const normalizedSubjects = [];


    /* =====================================================
       NESTED SUBJECTS
    ===================================================== */

    if (
        Array.isArray(
            plan.subjects
        )
    ) {

        plan.subjects.forEach(
            (
                rawSubject,
                subjectIndex
            ) => {

                const name =
                    clean(
                        typeof rawSubject === "string"
                            ? rawSubject
                            : rawSubject?.name ||
                              rawSubject?.subject ||
                              rawSubject?.title
                    );


                if (!name) {

                    return;

                }


                const nested =
                    Array.isArray(
                        rawSubject?.topics
                    )
                        ? rawSubject.topics
                        : [];


                normalizedSubjects.push({

                    id:
                        clean(
                            rawSubject?.id
                        ) ||
                        `subject-${subjectIndex + 1}`,

                    name,

                    topics:
                        nested
                            .map(
                                (
                                    topic,
                                    i
                                ) =>
                                    normalizeTopic(
                                        topic,
                                        name,
                                        i
                                    )
                            )
                            .filter(Boolean)

                });

            }
        );

    }


    /* =====================================================
       TOP-LEVEL TOPICS
    ===================================================== */

    const topLevelTopics =
        Array.isArray(
            plan.topics
        )
            ? plan.topics
            : [];


    const flatTopics = [];


    topLevelTopics.forEach(
        (
            rawTopic,
            i
        ) => {

            const topic =
                normalizeTopic(
                    rawTopic,
                    topicSubject(rawTopic),
                    i
                );


            if (topic) {

                flatTopics.push(
                    topic
                );

            }

        }
    );


    const hasNested =
        normalizedSubjects.some(
            subject =>
                subject.topics.length > 0
        );


    /* =====================================================
       ASSIGN FLAT TOPICS
    ===================================================== */

    if (
        !hasNested &&
        flatTopics.length
    ) {

        if (
            normalizedSubjects.length === 1
        ) {

            normalizedSubjects[0].topics =
                flatTopics.map(
                    topic => ({

                        ...topic,

                        subject:
                            normalizedSubjects[0].name

                    })
                );

        }

        else if (
            flatTopics.some(
                topic =>
                    topic.subject
            )
        ) {

            normalizedSubjects.forEach(
                subject => {

                    subject.topics =
                        flatTopics
                            .filter(
                                topic =>
                                    clean(
                                        topic.subject
                                    ).toLowerCase() ===
                                    clean(
                                        subject.name
                                    ).toLowerCase()
                            )
                            .map(
                                topic => ({

                                    ...topic,

                                    subject:
                                        subject.name

                                })
                            );

                }
            );

        }

        else {

            flatTopics.forEach(
                (
                    topic,
                    i
                ) => {

                    if (
                        !normalizedSubjects.length
                    ) {

                        return;

                    }


                    const subject =
                        normalizedSubjects[
                            i %
                            normalizedSubjects.length
                        ];


                    subject.topics.push({

                        ...topic,

                        subject:
                            subject.name

                    });

                }
            );

        }

    }


    /* =====================================================
       NO SUBJECTS
    ===================================================== */

    if (
        !normalizedSubjects.length &&
        flatTopics.length
    ) {

        const names =
            Array.isArray(
                plan.subjectNames
            )
                ? plan.subjectNames
                : [];


        names.forEach(
            (
                name,
                i
            ) => {

                const cleanedName =
                    clean(name);


                if (!cleanedName) {

                    return;

                }


                normalizedSubjects.push({

                    id:
                        `subject-${i + 1}`,

                    name:
                        cleanedName,

                    topics: []

                });

            }
        );


        flatTopics.forEach(
            (
                topic,
                i
            ) => {

                if (
                    !normalizedSubjects.length
                ) {

                    return;

                }


                const subject =
                    normalizedSubjects[
                        i %
                        normalizedSubjects.length
                    ];


                subject.topics.push({

                    ...topic,

                    subject:
                        subject.name

                });

            }
        );

    }


    /* =====================================================
       REMOVE DUPLICATES
    ===================================================== */

    const seen =
        new Set();


    normalizedSubjects.forEach(
        subject => {

            subject.topics =
                subject.topics.filter(
                    topic => {

                        topic.subject =
                            subject.name;


                        const key =
                            topicKey(topic);


                        if (
                            !key ||
                            seen.has(key)
                        ) {

                            return false;

                        }


                        seen.add(key);

                        return true;

                    }
                );

        }
    );


    const orderedTopics =
        normalizedSubjects.flatMap(
            subject =>
                subject.topics
        );


    return {

        ...plan,

        examType:
            clean(
                plan.examType ||
                plan.exam ||
                plan.curriculum
            ),

        examDate:
            clean(
                plan.examDate
            ),

        studyStartDate:
            clean(
                plan.studyStartDate ||
                plan.startDate
            ) ||
            new Date()
                .toISOString()
                .slice(0, 10),

        studyHours:
            Number(
                plan.studyHours ||
                plan.hoursPerDay ||
                1
            ),

        difficulty:
            clean(
                plan.difficulty
            ) ||
            "balanced",

        startTime:
            clean(
                plan.startTime
            ) ||
            "16:00",

        subjects:
            normalizedSubjects,

        topics:
            orderedTopics

    };

}


/* =========================================================
   SAVE PLAN
========================================================= */

function savePlan() {

    if (!studyPlan) {

        return;

    }


    writeJSON(
        PLAN_KEY,
        studyPlan
    );


    writeJSON(
        LEGACY_PLAN_KEY,
        studyPlan
    );

}


/* =========================================================
   LOAD PLAN
========================================================= */

function loadStudyPlan() {

    const raw =
        readJSON(
            PLAN_KEY,
            null
        ) ||
        readJSON(
            LEGACY_PLAN_KEY,
            null
        );


    studyPlan =
        normalizePlan(raw);


    if (!studyPlan) {

        subjects = [];

        allTopics = [];

        return false;

    }


    subjects =
        Array.isArray(
            studyPlan.subjects
        )
            ? studyPlan.subjects
            : [];


    allTopics =
        Array.isArray(
            studyPlan.topics
        )
            ? studyPlan.topics
            : subjects.flatMap(
                subject =>
                    subject.topics || []
            );


    studyPlan.topics =
        allTopics;


    savePlan();


    return true;

}


/* =========================================================
   COMPLETION STATE
========================================================= */

function loadCompletionState() {

    const savedCompleted =
        readJSON(
            COMPLETED_KEY,
            []
        );


    const savedQuestions =
        readJSON(
            COMPLETED_Q_KEY,
            []
        );


    completedTopics =
        Array.isArray(
            savedCompleted
        )
            ? savedCompleted
            : [];


    completedQuestionTopics =
        Array.isArray(
            savedQuestions
        )
            ? savedQuestions
            : [];

}


function saveCompletionState() {

    writeJSON(
        COMPLETED_KEY,
        completedTopics
    );


    writeJSON(
        COMPLETED_Q_KEY,
        completedQuestionTopics
    );


    localStorage.setItem(
        CURRENT_INDEX_KEY,
        String(
            currentTopicIndex
        )
    );

}


/* =========================================================
   COMPLETION CHECKS
========================================================= */

function isCompleted(topic) {

    const key =
        topicKey(topic);

    const name =
        topicName(topic);


    return (
        completedTopics.includes(key) ||
        completedTopics.includes(name)
    );

}


function isQuestionCompleted(topic) {

    const key =
        topicKey(topic);

    const name =
        topicName(topic);


    return (
        completedQuestionTopics.includes(key) ||
        completedQuestionTopics.includes(name)
    );

}


/* =========================================================
   FIND CURRENT TOPIC
========================================================= */

function getCurrentTopic() {

    if (
        currentStudySession?.topicKey
    ) {

        const savedIndex =
            allTopics.findIndex(
                topic =>
                    topicKey(topic) ===
                    currentStudySession.topicKey
            );


        if (
            savedIndex >= 0 &&
            !isCompleted(
                allTopics[savedIndex]
            )
        ) {

            currentTopicIndex =
                savedIndex;

            return allTopics[
                savedIndex
            ];

        }

    }


    if (
        currentTopicIndex >= 0 &&
        currentTopicIndex < allTopics.length
    ) {

        const indexedTopic =
            allTopics[
                currentTopicIndex
            ];


        if (
            indexedTopic &&
            !isCompleted(indexedTopic)
        ) {

            return indexedTopic;

        }

    }


    const next =
        allTopics.findIndex(
            topic =>
                !isCompleted(topic)
        );


    if (
        next === -1
    ) {

        currentTopicIndex =
            allTopics.length;

        return null;

    }


    currentTopicIndex =
        next;


    return allTopics[
        next
    ];

}


/* =========================================================
   NEXT INCOMPLETE TOPIC
========================================================= */

function getNextIncompleteTopic(
    fromIndex =
        currentTopicIndex
) {

    for (
        let i = fromIndex + 1;
        i < allTopics.length;
        i++
    ) {

        if (
            !isCompleted(
                allTopics[i]
            )
        ) {

            return allTopics[i];

        }

    }


    for (
        let i = 0;
        i <= fromIndex &&
        i < allTopics.length;
        i++
    ) {

        if (
            !isCompleted(
                allTopics[i]
            )
        ) {

            return allTopics[i];

        }

    }


    return null;

}


/* =========================================================
   PERSISTENT STUDY SESSION
========================================================= */

function createStudySession(
    topic = null
) {

    const saved =
        readJSON(
            STUDY_SESSION_KEY,
            null
        );


    if (
        saved &&
        typeof saved === "object"
    ) {

        currentStudySession =
            saved;

    }

    else {

        currentStudySession =
            {};

    }


    if (topic) {

        const key =
            topicKey(topic);


        /*
         * Only replace topic-specific session data
         * when switching to a genuinely different topic.
         */
        if (
            currentStudySession.topicKey !== key
        ) {

            currentStudySession = {

                topicKey:
                    key,

                topicId:
                    topic.id || "",

                topicName:
                    topic.name || "",

                subject:
                    topic.subject || "",

                topicIndex:
                    currentTopicIndex,

                currentTopicIndex,

                readingHTML:
                    "",

                readingText:
                    "",

                readingStarted:
                    false,

                readingCompleted:
                    false,

                createdAt:
                    new Date().toISOString(),

                updatedAt:
                    new Date().toISOString()

            };

        }

        else {

            currentStudySession.topicKey =
                key;

            currentStudySession.topicId =
                topic.id || "";

            currentStudySession.topicName =
                topic.name || "";

            currentStudySession.subject =
                topic.subject || "";

            currentStudySession.topicIndex =
                currentTopicIndex;

            currentStudySession.currentTopicIndex =
                currentTopicIndex;

        }

    }


    currentStudySession.lastOpened =
        new Date().toISOString();


    currentStudySession.readingStarted =
        currentStudySession.readingStarted === true;


    currentStudySession.readingCompleted =
        currentStudySession.readingCompleted === true;


    saveStudySession();

}


function saveStudySession() {

    if (
        !currentStudySession ||
        typeof currentStudySession !== "object"
    ) {

        currentStudySession =
            {};

    }


    currentStudySession.currentTopicIndex =
        currentTopicIndex;


    currentStudySession.updatedAt =
        new Date().toISOString();


    writeJSON(
        STUDY_SESSION_KEY,
        currentStudySession
    );

}


function loadStudySession() {

    const saved =
        readJSON(
            STUDY_SESSION_KEY,
            null
        );


    if (
        !saved ||
        typeof saved !== "object"
    ) {

        currentStudySession =
            null;

        return;

    }


    currentStudySession =
        saved;


    if (
        Number.isInteger(
            Number(
                saved.currentTopicIndex
            )
        )
    ) {

        currentTopicIndex =
            Number(
                saved.currentTopicIndex
            );

    }


    if (
        saved.topicKey
    ) {

        const savedTopicIndex =
            allTopics.findIndex(
                topic =>
                    topicKey(topic) ===
                    saved.topicKey
            );


        if (
            savedTopicIndex >= 0 &&
            !isCompleted(
                allTopics[
                    savedTopicIndex
                ]
            )
        ) {

            currentTopicIndex =
                savedTopicIndex;

        }

    }


    localStorage.setItem(
        CURRENT_INDEX_KEY,
        String(
            currentTopicIndex
        )
    );

}


/* =========================================================
   READING PERSISTENCE
========================================================= */

const READING_SELECTORS = [

    "#topicReading",

    "#readingContent",

    "#currentTopicReading",

    "#studyReading",

    "#readingSection",

    "#topicContent",

    "#studyContent",

    ".topic-reading",

    ".reading-content",

    ".study-reading",

    ".topic-content"

];


function findReadingElement() {

    for (
        const selector of
        READING_SELECTORS
    ) {

        const element =
            document.querySelector(
                selector
            );


        if (element) {

            return element;

        }

    }


    return null;

}


function getReadingElement() {

    return findReadingElement();

}


function saveCurrentReading() {

    const reading =
        getReadingElement();


    if (!reading) {

        return;

    }


    if (
        !currentStudySession
    ) {

        currentStudySession =
            {};

    }


    const html =
        reading.innerHTML.trim();


    const text =
        reading.textContent.trim();


    /*
     * Don't overwrite a saved reading with
     * an empty container.
     */
    if (
        !html &&
        !text
    ) {

        return;

    }


    const topic =
        getCurrentTopic();


    if (topic) {

        currentStudySession.topicKey =
            topicKey(topic);

        currentStudySession.topicId =
            topic.id || "";

        currentStudySession.topicName =
            topic.name || "";

        currentStudySession.subject =
            topic.subject || "";

        currentStudySession.topicIndex =
            currentTopicIndex;

    }


    currentStudySession.readingHTML =
        html;


    currentStudySession.readingText =
        text;


    currentStudySession.readingSavedAt =
        new Date().toISOString();


    currentStudySession.readingStarted =
        true;


    saveStudySession();

}


function restoreCurrentReading() {

    if (
        !currentStudySession ||
        !currentStudySession.readingHTML
    ) {

        return false;

    }


    const reading =
        getReadingElement();


    if (!reading) {

        return false;

    }


    const topic =
        getCurrentTopic();


    if (
        topic &&
        currentStudySession.topicKey &&
        currentStudySession.topicKey !==
            topicKey(topic)
    ) {

        return false;

    }


    const currentHTML =
        reading.innerHTML.trim();


    /*
     * If the page already contains generated
     * reading content, leave it alone.
     */
    if (
        currentHTML &&
        currentHTML.length > 20
    ) {

        return false;

    }


    reading.innerHTML =
        currentStudySession.readingHTML;


    return true;

}


/* =========================================================
   READING OBSERVER
========================================================= */

function startReadingPersistence() {

    if (
        readingObserverStarted
    ) {

        restoreCurrentReading();

        return;

    }


    const reading =
        getReadingElement();


    if (!reading) {

        setTimeout(
            startReadingPersistence,
            500
        );

        return;

    }


    readingObserverStarted =
        true;


    restoreCurrentReading();


    let saveTimeout =
        null;


    const observer =
        new MutationObserver(
            () => {

                clearTimeout(
                    saveTimeout
                );


                saveTimeout =
                    setTimeout(
                        saveCurrentReading,
                        300
                    );

            }
        );


    observer.observe(
        reading,
        {

            childList:
                true,

            subtree:
                true,

            characterData:
                true

        }
    );


    window.addEventListener(
        "beforeunload",
        () => {

            saveCurrentReading();

            saveStudySession();

            saveCompletionState();

            saveTimer();

        }
    );


    document.addEventListener(
        "visibilitychange",
        () => {

            if (
                document.visibilityState ===
                "hidden"
            ) {

                saveCurrentReading();

                saveStudySession();

                saveCompletionState();

                saveTimer();

            }

        }
    );

}


/* =========================================================
   AUTHENTICATION
========================================================= */

async function checkAuthentication() {

    try {

        const client =
            window.supabaseClient;


        if (
            !client?.auth
        ) {

            console.warn(
                "StudyMind: Supabase client not available."
            );

            return false;

        }


        const {
            data,
            error
        } =
            await client.auth.getUser();


        if (
            error ||
            !data?.user
        ) {

            return false;

        }


        currentUser =
            data.user;


        return true;

    } catch (error) {

        console.error(
            "StudyMind auth error:",
            error
        );

        return false;

    }

}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutStudyMind() {

    saveCurrentReading();

    saveStudySession();

    saveCompletionState();

    saveTimer();


    try {

        if (
            window.supabaseClient?.auth
        ) {

            await window
                .supabaseClient
                .auth
                .signOut();

        }

    } catch (error) {

        console.warn(
            "Logout error:",
            error
        );

    }


    window.location.href =
        "login.html";

}


/* =========================================================
   DAYS LEFT
========================================================= */

function calculateDaysLeft() {

    if (
        !studyPlan?.examDate
    ) {

        return 0;

    }


    const exam =
        new Date(
            `${studyPlan.examDate}T00:00:00`
        );


    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    return Math.max(
        0,
        Math.ceil(
            (
                exam -
                today
            ) / 86400000
        )
    );

}


/* =========================================================
   STATS
========================================================= */

function renderStats() {

    const completed =
        allTopics.filter(
            isCompleted
        ).length;


    const score =
        allTopics.length
            ? Math.round(
                (
                    completed /
                    allTopics.length
                ) * 100
            )
            : 0;


    const streak =
        Number(
            localStorage.getItem(
                STREAK_KEY
            ) || 0
        );


    const hours =
        Number(
            studyPlan?.studyHours ||
            0
        );


    const values = {

        weeklyHours:
            hours * 7,

        daysLeft:
            calculateDaysLeft(),

        dailyGoal:
            `${hours} hrs`,

        studyScore:
            score,

        streak,

        scoreDisplay:
            score

    };


    Object.entries(values)
        .forEach(
            (
                [id, value]
            ) => {

                if ($(id)) {

                    $(id).textContent =
                        value;

                }

            }
        );


    if (
        $("progressPercent")
    ) {

        $("progressPercent")
            .textContent =
            `${score}%`;

    }


    if (
        $("scoreProgressBar")
    ) {

        $("scoreProgressBar")
            .style.width =
            `${score}%`;

    }


    if (
        $("progressBar")
    ) {

        $("progressBar")
            .style.width =
            `${score}%`;

    }


    if (
        $("progressCount")
    ) {

        $("progressCount")
            .textContent =
            `${completed} of ${allTopics.length} topics completed`;

    }


    if (
        $("scoreMessage")
    ) {

        $("scoreMessage")
            .textContent =
            score >= 100

                ? "All topics completed. Excellent work!"

                : "Keep going — consistency builds mastery.";

    }

}


/* =========================================================
   SUBJECTS
========================================================= */

function renderSubjects() {

    const container =
        $("subjectList");


    if (!container) {

        return;

    }


    container.innerHTML =
        subjects
            .map(
                subject => {

                    const topicCount =
                        subject.topics?.length || 0;


                    const completedCount =
                        (subject.topics || [])
                            .filter(
                                isCompleted
                            )
                            .length;


                    const done =
                        topicCount > 0 &&
                        completedCount ===
                            topicCount;


                    return `

                        <div
                            class="
                                subject-item
                                ${done ? "completed" : ""}
                            "
                        >

                            <strong>
                                ${escapeHTML(
                                    subject.name
                                )}
                            </strong>

                            <span>
                                ${completedCount}/${topicCount}
                                topics
                            </span>

                        </div>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   TOPICS
========================================================= */

function renderTopics() {

    const container =
        $("topicList");


    if (!container) {

        return;

    }


    container.innerHTML =
        subjects
            .map(
                subject => `

                    <div
                        class="topic-subject-group"
                    >

                        <h4>
                            📚
                            ${escapeHTML(
                                subject.name
                            )}
                        </h4>

                        ${
                            (subject.topics || [])
                                .map(
                                    topic => `

                                        <div
                                            class="
                                                topic-list-item
                                                ${
                                                    isCompleted(topic)
                                                        ? "completed"
                                                        : ""
                                                }
                                            "
                                        >

                                            <span>
                                                ${
                                                    isCompleted(topic)
                                                        ? "✓"
                                                        : "○"
                                                }
                                            </span>

                                            <span>
                                                ${escapeHTML(
                                                    topic.name
                                                )}
                                            </span>

                                        </div>

                                    `
                                )
                                .join("")
                        }

                    </div>

                `
            )
            .join("");

}


/* =========================================================
   PROGRESS
========================================================= */

function renderProgress() {

    renderStats();

}


/* =========================================================
   CURRENT TOPIC
========================================================= */

function renderCurrentTopic() {

    const topic =
        getCurrentTopic();


    const name =
        $("currentTopicName");

    const description =
        $("currentTopicDescription");

    const position =
        $("topicPosition");

    const badge =
        $("topicStatusBadge");

    const checkbox =
        $("topicCompleteCheckbox");

    const message =
        $("topicCompletionMessage");

    const nextMessage =
        $("nextTopicMessage");


    /* =====================================================
       ALL COMPLETE
    ===================================================== */

    if (!topic) {

        if (name) {

            name.textContent =
                "All topics completed!";

        }


        if (description) {

            description.textContent =
                "You have finished every topic in your study plan.";

        }


        if (position) {

            position.textContent =
                "COMPLETE";

        }


        if (badge) {

            badge.textContent =
                "COMPLETED";

        }


        if (checkbox) {

            checkbox.checked =
                false;

            checkbox.disabled =
                true;

        }


        if (message) {

            message.textContent =
                "🎉 Your study plan is complete.";

        }


        if (nextMessage) {

            nextMessage.innerHTML =
                "🏆 Fantastic work — every subject and every topic is finished.";

        }


        hideKnowledgeCheck();

        maybeShowCompletionCelebration();

        return;

    }


    /* =====================================================
       CURRENT TOPIC
    ===================================================== */

    currentTopicIndex =
        allTopics.indexOf(topic);


    localStorage.setItem(
        CURRENT_INDEX_KEY,
        String(
            currentTopicIndex
        )
    );


    if (position) {

        position.textContent =
            `TOPIC ${
                currentTopicIndex + 1
            } OF ${
                allTopics.length
            }`;

    }


    if (name) {

        name.textContent =
            topic.name;

    }


    if (description) {

        description.textContent =
            topic.description;

    }


    if (badge) {

        badge.textContent =
            "IN PROGRESS";

    }


    if (checkbox) {

        checkbox.checked =
            false;

        checkbox.disabled =
            false;

    }


    if (message) {

        message.textContent =
            `📚 ${
                topic.subject ||
                "Subject"
            } — study this topic, then tick the box when you are finished.`;

    }


    const next =
        getNextIncompleteTopic(
            currentTopicIndex
        );


    if (nextMessage) {

        nextMessage.innerHTML =
            next

                ? `➡️ Next: <strong>${escapeHTML(
                    next.subject
                )}</strong> — ${escapeHTML(
                    next.name
                )}`

                : "🏁 This is your final topic.";

    }


    createStudySession(
        topic
    );


    setTimeout(
        restoreCurrentReading,
        100
    );


    hideKnowledgeCheck();

}


/* =========================================================
   COMPLETE CURRENT TOPIC
========================================================= */

function completeCurrentTopic() {

    const topic =
        getCurrentTopic();


    if (
        !topic ||
        isCompleted(topic)
    ) {

        return;

    }


    /*
     * Save the reading before completion.
     */
    saveCurrentReading();


    const key =
        topicKey(topic);


    /*
     * Prevent duplicate completion entries.
     */
    completedTopics =
        completedTopics.filter(
            value =>
                value !== key &&
                value !== topic.name
        );


    completedTopics.push(
        key
    );


    /*
     * Mark reading complete.
     */
    if (
        currentStudySession
    ) {

        currentStudySession.readingCompleted =
            true;

        currentStudySession.completedAt =
            new Date().toISOString();

        saveStudySession();

    }


    /*
     * Register study streak.
     */
    if (
        typeof window.registerStudyCompletion ===
        "function"
    ) {

        window.registerStudyCompletion();

    }

    else {

        const today =
            new Date()
                .toISOString()
                .slice(0, 10);


        localStorage.setItem(
            LAST_STUDY_KEY,
            today
        );

    }


    /*
     * Find next topic.
     */
    const next =
        getNextIncompleteTopic(
            currentTopicIndex
        );


    currentTopicIndex =
        next
            ? allTopics.indexOf(next)
            : allTopics.length;


    saveCompletionState();


    /*
     * Stop timer.
     */
    stopTimer();


    /*
     * Prepare next topic.
     */
    if (next) {

        currentStudySession = {

            topicKey:
                topicKey(next),

            topicId:
                next.id || "",

            topicName:
                next.name || "",

            subject:
                next.subject || "",

            topicIndex:
                currentTopicIndex,

            currentTopicIndex,

            readingHTML:
                "",

            readingText:
                "",

            readingStarted:
                false,

            readingCompleted:
                false,

            createdAt:
                new Date().toISOString(),

            updatedAt:
                new Date().toISOString()

        };


        saveStudySession();

    }

    else {

        currentStudySession = {

            currentTopicIndex:
                allTopics.length,

            readingCompleted:
                true,

            planCompleted:
                true,

            completedAt:
                new Date().toISOString(),

            updatedAt:
                new Date().toISOString()

        };


        saveStudySession();

    }


    /*
     * Refresh dashboard.
     */
    renderCurrentTopic();

    renderProgress();

    renderSubjects();

    renderTopics();

    renderDailyChallenge();

    renderSchedule();

    renderNextSession();

    renderCalendar();


    /*
     * Send the user to the Knowledge Check
     * for the topic they just finished.
     */
    openKnowledgeCheckPage(
        topic
    );

}


/* =========================================================
   KNOWLEDGE CHECK
========================================================= */

function openKnowledgeCheckPage(
    topic
) {

    if (!topic) {

        return;

    }


    const usage =
        Number(
            localStorage.getItem(
                "studyMindKnowledgeCheckUsageCount"
            ) || 0
        );


    if (
        usage >= FREE_AI_LIMIT
    ) {

        showPremiumMessage();

        return;

    }


    writeJSON(
        KNOWLEDGE_TOPIC_KEY,
        {

            id:
                topic.id,

            key:
                topicKey(topic),

            name:
                topic.name,

            title:
                topic.name,

            subject:
                topic.subject,

            description:
                topic.description,

            checkId:
                `${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2)}`

        }
    );


    /*
     * Clear old generated questions so the
     * Knowledge Check page generates questions
     * for the newly completed topic.
     */
    localStorage.removeItem(
        KNOWLEDGE_QUESTIONS_KEY
    );


    window.location.href =
        "knowledge-check.html";

}


/* =========================================================
   HIDE KNOWLEDGE CHECK
========================================================= */

function hideKnowledgeCheck() {

    const section =
        $("topicQuestionsSection");


    if (section) {

        section.style.display =
            "none";

    }

}


/* =========================================================
   COMPLETION CELEBRATION
========================================================= */

function maybeShowCompletionCelebration() {

    if (
        !allTopics.length ||
        !allTopics.every(
            isCompleted
        )
    ) {

        return;

    }


    if (
        localStorage.getItem(
            CELEBRATION_KEY
        ) === "true"
    ) {

        return;

    }


    localStorage.setItem(
        CELEBRATION_KEY,
        "true"
    );


    const old =
        $("studyMindCompletionCelebration");


    if (old) {

        old.remove();

    }


    const overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "studyMindCompletionCelebration";


    overlay.innerHTML = `

        <div
            style="
                position:fixed;
                inset:0;
                z-index:99999;
                display:flex;
                align-items:center;
                justify-content:center;
                padding:22px;
                background:rgba(4,8,20,.82);
                backdrop-filter:blur(12px);
            "
        >

            <div
                style="
                    width:min(560px,100%);
                    text-align:center;
                    padding:44px 28px;
                    border-radius:30px;
                    background:linear-gradient(
                        145deg,
                        #18233d,
                        #0b1220
                    );
                    border:1px solid rgba(
                        255,
                        255,
                        255,
                        .15
                    );
                    box-shadow:
                        0 35px 100px
                        rgba(0,0,0,.5);
                    animation:
                        smCelebrate
                        .4s
                        ease-out;
                "
            >

                <div
                    style="
                        font-size:70px;
                        line-height:1;
                        margin-bottom:18px;
                    "
                >
                    🎉
                </div>

                <div
                    style="
                        font-size:12px;
                        letter-spacing:.2em;
                        opacity:.65;
                        margin-bottom:10px;
                    "
                >
                    STUDYMIND AI
                </div>

                <h2
                    style="
                        font-size:32px;
                        margin:0 0 12px;
                    "
                >
                    Congratulations! 🏆
                </h2>

                <p
                    style="
                        font-size:18px;
                        line-height:1.6;
                        opacity:.88;
                        margin:0 0 28px;
                    "
                >
                    You have finished reading for today.
                    <br>
                    Every subject and every topic
                    in your study plan is complete.
                </p>

                <button
                    id="closeStudyMindCelebration"
                    class="primary-button"
                    style="
                        min-width:220px;
                    "
                >
                    🚀 Great Job
                </button>

            </div>

        </div>

        <style>

            @keyframes smCelebrate {

                from {

                    opacity:0;

                    transform:
                        translateY(18px)
                        scale(.96);

                }

                to {

                    opacity:1;

                    transform:none;

                }

            }

        </style>

    `;


    document.body.appendChild(
        overlay
    );


    $(
        "closeStudyMindCelebration"
    )?.addEventListener(
        "click",
        () => {

            overlay.remove();

        }
    );

}


/* =========================================================
   DAILY CHALLENGE
========================================================= */

function renderDailyChallenge() {

    const topic =
        getCurrentTopic();


    const done =
        topic

            ? isCompleted(topic) &&
              isQuestionCompleted(topic)

            : allTopics.length > 0 &&
              allTopics.every(
                  isCompleted
              );


    if (
        $("dailyChallengeTitle")
    ) {

        $("dailyChallengeTitle")
            .textContent =

            done

                ? "🏆 Challenge Complete!"

                : topic

                    ? `📖 Study ${topic.name}`

                    : "🎉 Study Plan Complete";

    }


    if (
        $("dailyChallengeDescription")
    ) {

        $("dailyChallengeDescription")
            .textContent =

            done

                ? "You've completed today's challenge. Great work!"

                : topic

                    ? `Study ${topic.name} and complete its knowledge check.`

                    : "You've completed every topic in your plan.";

    }


    const progress =
        done

            ? 100

            : topic &&
              isCompleted(topic)

                ? 50

                : 0;


    if (
        $("dailyChallengeProgress")
    ) {

        $("dailyChallengeProgress")
            .textContent =
            `${progress}%`;

    }


    if (
        $("dailyChallengeProgressBar")
    ) {

        $("dailyChallengeProgressBar")
            .style.width =
            `${progress}%`;

    }


    /*
     * FIXED SYNTAX ERROR.
     */
    if (
        $("dailyChallengeButton")
    ) {

        $("dailyChallengeButton")
            .disabled =
            done;

    }

}


/* =========================================================
   TIMER
========================================================= */

function formatTimer(
    seconds
) {

    const safeSeconds =
        Math.max(
            0,
            Number(seconds) || 0
        );


    const mins =
        Math.floor(
            safeSeconds / 60
        );


    const secs =
        safeSeconds % 60;


    return `${String(
        mins
    ).padStart(
        2,
        "0"
    )}:${String(
        secs
    ).padStart(
        2,
        "0"
    )}`;

}


function renderTimer() {

    if (
        $("studyTimer")
    ) {

        $("studyTimer")
            .textContent =
            formatTimer(
                timerSeconds
            );

    }


    if (
        $("startTimerButton")
    ) {

        $("startTimerButton")
            .disabled =
            timerRunning;

    }


    if (
        $("pauseTimerButton")
    ) {

        $("pauseTimerButton")
            .disabled =
            !timerRunning;

    }


    if (
        $("timerDuration")
    ) {

        $("timerDuration")
            .value =
            String(
                selectedTimerSeconds /
                60
            );

    }

}


function saveTimer() {

    localStorage.setItem(
        TIMER_SECONDS_KEY,
        String(
            timerSeconds
        )
    );


    localStorage.setItem(
        TIMER_DURATION_KEY,
        String(
            selectedTimerSeconds
        )
    );

}


function startTimer() {

    if (
        timerRunning
    ) {

        return;

    }


    if (
        timerSeconds <= 0
    ) {

        timerSeconds =
            selectedTimerSeconds;

    }


    timerRunning =
        true;


    timerInterval =
        setInterval(
            () => {

                timerSeconds--;


                if (
                    timerSeconds <= 0
                ) {

                    timerSeconds =
                        0;


                    stopTimer();


                    alert(
                        "⏰ Study timer complete! Great work."
                    );

                }


                saveTimer();

                renderTimer();

            },
            1000
        );


    renderTimer();

}


function pauseTimer() {

    if (
        timerInterval
    ) {

        clearInterval(
            timerInterval
        );

    }


    timerInterval =
        null;


    timerRunning =
        false;


    saveTimer();

    renderTimer();

}


function stopTimer() {

    pauseTimer();

}


function resetTimer() {

    pauseTimer();


    timerSeconds =
        selectedTimerSeconds;


    saveTimer();

    renderTimer();

}


function changeTimerDuration(
    minutes
) {

    const value =
        Number(minutes);


    if (
        !TIMER_OPTIONS.includes(
            value
        )
    ) {

        return;

    }


    selectedTimerSeconds =
        value * 60;


    timerSeconds =
        selectedTimerSeconds;


    saveTimer();

    renderTimer();

}


/* =========================================================
   CALENDAR
========================================================= */

function dateKey(date) {

    return `${date.getFullYear()}-${String(
        date.getMonth() + 1
    ).padStart(
        2,
        "0"
    )}-${String(
        date.getDate()
    ).padStart(
        2,
        "0"
    )}`;

}


function renderCalendar() {

    const month =
        $("calendarMonth");

    const days =
        $("calendarDays");


    if (
        !month ||
        !days
    ) {

        return;

    }


    const year =
        calendarDate.getFullYear();

    const monthIndex =
        calendarDate.getMonth();


    month.textContent =
        calendarDate.toLocaleString(
            "en-US",
            {
                month:
                    "long",

                year:
                    "numeric"
            }
        );


    days.innerHTML =
        "";


    const first =
        new Date(
            year,
            monthIndex,
            1
        ).getDay();


    const total =
        new Date(
            year,
            monthIndex + 1,
            0
        ).getDate();


    const examKey =
        studyPlan?.examDate ||
        "";


    const startKey =
        studyPlan?.studyStartDate ||
        "";


    for (
        let i = 0;
        i < first;
        i++
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "calendar-day empty";


        days.appendChild(
            empty
        );

    }


    const today =
        dateKey(
            new Date()
        );


    for (
        let d = 1;
        d <= total;
        d++
    ) {

        const date =
            new Date(
                year,
                monthIndex,
                d
            );


        const key =
            dateKey(date);


        const cell =
            document.createElement(
                "div"
            );


        cell.className =
            "calendar-day";


        cell.textContent =
            String(d);


        if (
            key === today
        ) {

            cell.classList.add(
                "today"
            );

        }


        if (
            examKey &&
            key > examKey
        ) {

            cell.classList.add(
                "after-exam"
            );


            cell.dataset.dayType =
                "after-exam";


            days.appendChild(
                cell
            );


            continue;

        }


        if (
            examKey &&
            key === examKey
        ) {

            cell.classList.add(
                "exam-day"
            );


            cell.dataset.dayType =
                "exam";

        }

        else if (
            startKey &&
            examKey &&
            key >= startKey &&
            key < examKey
        ) {

            if (
                date.getDay() === 0 ||
                date.getDay() === 6
            ) {

                cell.classList.add(
                    "rest-day"
                );


                cell.dataset.dayType =
                    "rest";

            }

            else {

                cell.classList.add(
                    "study-day"
                );


                cell.dataset.dayType =
                    "study";

            }

        }


        days.appendChild(
            cell
        );

    }

}


function previousMonth() {

    calendarDate.setMonth(
        calendarDate.getMonth() - 1
    );


    renderCalendar();

}


function nextMonth() {

    calendarDate.setMonth(
        calendarDate.getMonth() + 1
    );


    renderCalendar();

}


/* =========================================================
   SCHEDULE
========================================================= */

function renderSchedule() {

    const container =
        $("scheduleList");


    if (!container) {

        return;

    }


    const topic =
        getCurrentTopic();


    if (!topic) {

        container.innerHTML = `

            <div class="empty-schedule">
                🎉 Your study plan is complete.
            </div>

        `;


        return;

    }


    const hours =
        Math.max(
            1,
            Number(
                studyPlan?.studyHours ||
                1
            )
        );


    const startTime =
        String(
            studyPlan?.startTime ||
            "16:00"
        );


    const startParts =
        startTime.split(":");


    const startHour =
        Number(
            startParts[0]
        ) || 16;


    container.innerHTML =
        Array.from(
            {
                length:
                    hours
            },
            (
                _,
                i
            ) => `

                <div class="schedule-card">

                    <h4>

                        ${escapeHTML(
                            formatClock(
                                startHour + i
                            )
                        )}

                        -

                        ${escapeHTML(
                            formatClock(
                                startHour + i + 1
                            )
                        )}

                    </h4>

                    <p>

                        <strong>
                            ${escapeHTML(
                                topic.subject
                            )}
                        </strong>

                    </p>

                    <span>

                        ${escapeHTML(
                            topic.name
                        )}

                    </span>

                </div>

            `
        )
        .join("");

}


function formatClock(
    hour
) {

    hour =
        ((Number(hour) % 24) + 24) % 24;


    const period =
        hour >= 12
            ? "PM"
            : "AM";


    let h =
        hour % 12;


    if (!h) {

        h = 12;

    }


    return `${h}:00 ${period}`;

}


/* =========================================================
   NEXT SESSION
========================================================= */

function renderNextSession() {

    const topic =
        getCurrentTopic();


    if (
        $("nextBooking")
    ) {

        $("nextBooking")
            .textContent =
            topic
                ? topic.name
                : "Complete";

    }


    if (
        $("nextBookingTime")
    ) {

        $("nextBookingTime")
            .textContent =
            topic
                ? topic.subject
                : "All topics completed";

    }

}


/* =========================================================
   AI QUESTION LIMIT
========================================================= */

function aiCount() {

    const today =
        new Date()
            .toISOString()
            .slice(0, 10);


    if (
        localStorage.getItem(
            AI_DATE_KEY
        ) !== today
    ) {

        localStorage.setItem(
            AI_DATE_KEY,
            today
        );


        localStorage.setItem(
            AI_COUNT_KEY,
            "0"
        );

    }


    return Number(
        localStorage.getItem(
            AI_COUNT_KEY
        ) || 0
    );

}


function recordAIQuestion() {

    const count =
        aiCount() + 1;


    localStorage.setItem(
        AI_COUNT_KEY,
        String(count)
    );


    return count;

}


/* =========================================================
   PREMIUM MESSAGE
========================================================= */

function showPremiumMessage() {

    const existing =
        $("premiumModal");


    if (existing) {

        existing.remove();

    }


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "premiumModal";


    modal.innerHTML = `

        <div
            style="
                position:fixed;
                inset:0;
                z-index:99998;
                background:rgba(0,0,0,.7);
                display:flex;
                align-items:center;
                justify-content:center;
                padding:20px;
            "
        >

            <div
                style="
                    max-width:440px;
                    text-align:center;
                    padding:34px;
                    border-radius:24px;
                    background:#101a2e;
                    color:white;
                    border:
                        1px solid
                        rgba(255,255,255,.15);
                    box-shadow:
                        0 25px 80px
                        rgba(0,0,0,.45);
                "
            >

                <div
                    style="
                        font-size:48px;
                    "
                >
                    💎
                </div>

                <h2>
                    StudyMind AI Premium
                </h2>

                <p>
                    You've used your 5 free AI
                    questions for today.
                    Premium features are coming soon.
                </p>

                <button
                    id="closePremium"
                    class="primary-button"
                >
                    Close
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    $("closePremium")
        ?.addEventListener(
            "click",
            () =>
                modal.remove()
        );

}


/* =========================================================
   ASK AI
========================================================= */

async function askAI() {

    const input =
        $("aiQuestion");


    const output =
        $("aiResponse");


    if (
        !input ||
        !output
    ) {

        return;

    }


    if (
        aiCount() >=
        FREE_AI_LIMIT
    ) {

        showPremiumMessage();

        return;

    }


    const question =
        clean(
            input.value
        );


    if (!question) {

        output.textContent =
            "Please enter a question first.";

        return;

    }


    output.textContent =
        "🤖 StudyMind AI is thinking...";


    try {

        const topic =
            getCurrentTopic();


        const response =
            await fetch(
                "/api/chat",
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            message:
                                question,

                            question:
                                question,

                            topic:
                                topic?.name ||
                                "",

                            subject:
                                topic?.subject ||
                                ""

                        })

                }
            );


        let data = null;


        try {

            data =
                await response.json();

        } catch {

            data =
                {};

        }


        if (
            !response.ok
        ) {

            throw new Error(
                data?.error ||
                "AI request failed."
            );

        }


        recordAIQuestion();


        output.textContent =
            data.reply ||
            data.answer ||
            data.message ||
            "I couldn't generate a response.";

    } catch (error) {

        console.error(
            "StudyMind AI error:",
            error
        );


        output.textContent =
            `⚠️ ${
                error?.message ||
                "Something went wrong."
            }`;

    }

}


/* =========================================================
   THEME
========================================================= */

function initializeTheme() {

    const savedTheme =
        localStorage.getItem(
            THEME_KEY
        ) || "light";


    const isLight =
        savedTheme === "light";


    const isDark =
        savedTheme === "dark";


    document.documentElement.classList.toggle(
        "light-mode",
        isLight
    );


    document.documentElement.classList.toggle(
        "dark-mode",
        isDark
    );


    document.body.classList.toggle(
        "light-mode",
        isLight
    );


    document.body.classList.toggle(
        "dark-mode",
        isDark
    );


    document.documentElement.style.colorScheme =
        isDark
            ? "dark"
            : "light";


    updateThemeButton();

}


function toggleTheme() {

    const currentTheme =
        localStorage.getItem(
            THEME_KEY
        ) || "light";


    const newTheme =
        currentTheme === "dark"
            ? "light"
            : "dark";


    localStorage.setItem(
        THEME_KEY,
        newTheme
    );


    initializeTheme();

}


function updateThemeButton() {

    const button =
        $("themeButton");


    if (!button) {

        return;

    }


    const isDark =
        document.body.classList.contains(
            "dark-mode"
        );


    button.textContent =
        isDark
            ? "☀️ Light Mode"
            : "🌙 Dark Mode";


    button.setAttribute(
        "aria-label",
        isDark
            ? "Switch to Light Mode"
            : "Switch to Dark Mode"
    );


    button.setAttribute(
        "title",
        isDark
            ? "Switch to Light Mode"
            : "Switch to Dark Mode"
    );

}


/* =========================================================
   EVENT BINDING
========================================================= */

function bindEvents() {

    /*
     * Complete reading.
     */
    $("topicCompleteCheckbox")
        ?.addEventListener(
            "change",
            event => {

                if (
                    event.target.checked
                ) {

                    completeCurrentTopic();

                }

            }
        );


    /*
     * Timer.
     */
    $("startTimerButton")
        ?.addEventListener(
            "click",
            startTimer
        );


    $("pauseTimerButton")
        ?.addEventListener(
            "click",
            pauseTimer
        );


    $("resetTimerButton")
        ?.addEventListener(
            "click",
            resetTimer
        );


    $("timerDuration")
        ?.addEventListener(
            "change",
            event =>
                changeTimerDuration(
                    event.target.value
                )
        );


    /*
     * Calendar.
     */
    $("previousMonth")
        ?.addEventListener(
            "click",
            previousMonth
        );


    $("nextMonth")
        ?.addEventListener(
            "click",
            nextMonth
        );


    /*
     * AI.
     */
    $("askAIButton")
        ?.addEventListener(
            "click",
            askAI
        );


    /*
     * Theme.
     */
    const themeButton =
        $("themeButton");


    if (
        themeButton &&
        themeButton.dataset.themeConnected !==
            "true"
    ) {

        themeButton.dataset.themeConnected =
            "true";


        themeButton.addEventListener(
            "click",
            toggleTheme
        );

    }


    /*
     * Daily challenge.
     */
    $("dailyChallengeButton")
        ?.addEventListener(
            "click",
            () => {

                $("currentTopicSection")
                    ?.scrollIntoView({
                        behavior:
                            "smooth"
                    });

            }
        );


    /*
     * Logout.
     */
    $("logoutButton")
        ?.addEventListener(
            "click",
            logoutStudyMind
        );

}


/* =========================================================
   DASHBOARD STARTUP
========================================================= */

async function startDashboard() {

    try {

        /*
         * Theme.
         */
        initializeTheme();


        /*
         * Load plan.
         */
        if (
            !loadStudyPlan()
        ) {

            window.location.href =
                "home.html#generator";

            return;

        }


        /*
         * Load completion state.
         */
        loadCompletionState();


        /*
         * Load persistent study session.
         */
        loadStudySession();


        /*
         * Authentication.
         */
        const authenticated =
            await checkAuthentication();


        if (
            !authenticated
        ) {

            window.location.href =
                "login.html";

            return;

        }


        /*
         * Topics must exist.
         */
        if (
            !allTopics.length
        ) {

            window.location.href =
                "home.html#generator";

            return;

        }


        /*
         * Make sure current index is valid.
         */
        if (
            currentTopicIndex < 0 ||
            currentTopicIndex >
                allTopics.length
        ) {

            currentTopicIndex =
                0;

        }


        /*
         * Validate timer duration.
         */
        if (
            !TIMER_OPTIONS.includes(
                selectedTimerSeconds /
                60
            )
        ) {

            selectedTimerSeconds =
                DEFAULT_TIMER_SECONDS;

        }


        /*
         * Validate timer remaining time.
         */
        if (
            timerSeconds <= 0 ||
            timerSeconds >
                selectedTimerSeconds
        ) {

            timerSeconds =
                selectedTimerSeconds;

        }


        saveTimer();


        /*
         * Bind dashboard events.
         */
        bindEvents();


        /*
         * Render everything.
         */
        renderStats();

        renderSubjects();

        renderTopics();

        renderCurrentTopic();

        renderDailyChallenge();

        renderTimer();

        renderSchedule();

        renderNextSession();

        renderCalendar();


        /*
         * Start reading persistence.
         */
        startReadingPersistence();


        /*
         * Give other dashboard scripts time
         * to create the reading element.
         */
        setTimeout(
            () => {

                restoreCurrentReading();

                startReadingPersistence();

            },
            750
        );


        /*
         * Save state every 5 seconds.
         */
        setInterval(
            () => {

                saveCurrentReading();

                saveStudySession();

                saveCompletionState();

                saveTimer();

            },
            5000
        );

    } catch (error) {

        console.error(
            "StudyMind dashboard startup error:",
            error
        );


        /*
         * Don't silently leave the user
         * on a broken dashboard.
         */
        const errorBox =
            document.createElement(
                "div"
            );


        errorBox.style.cssText = `
            position:fixed;
            left:20px;
            right:20px;
            bottom:20px;
            z-index:999999;
            padding:18px 20px;
            border-radius:16px;
            background:#7f1d1d;
            color:#fff;
            font-family:Arial,sans-serif;
            box-shadow:0 15px 50px rgba(0,0,0,.3);
        `;


        errorBox.innerHTML = `
            <strong>StudyMind Dashboard Error</strong>
            <div style="margin-top:6px;font-size:14px;">
                ${escapeHTML(
                    error?.message ||
                    "The dashboard could not initialize."
                )}
            </div>
        `;


        document.body.appendChild(
            errorBox
        );

    }

}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.openDashboard =
    () =>
        window.location.href =
            "dashboard.html";


window.logoutStudyMind =
    logoutStudyMind;


window.startTimer =
    startTimer;


window.pauseTimer =
    pauseTimer;


window.resetTimer =
    resetTimer;


window.completeCurrentTopic =
    completeCurrentTopic;


window.openKnowledgeCheckPage =
    openKnowledgeCheckPage;


window.previousMonth =
    previousMonth;


window.nextMonth =
    nextMonth;


window.showPremiumMessage =
    showPremiumMessage;


window.getAIQuestionCount =
    aiCount;


window.getRemainingAIQuestions =
    () =>
        Math.max(
            0,
            FREE_AI_LIMIT -
            aiCount()
        );


window.hasFreeAIQuestionsLeft =
    () =>
        aiCount() <
        FREE_AI_LIMIT;


window.recordAIQuestion =
    recordAIQuestion;


window.toggleTheme =
    toggleTheme;


window.saveCurrentReading =
    saveCurrentReading;


window.restoreCurrentReading =
    restoreCurrentReading;


window.saveStudySession =
    saveStudySession;


/* =========================================================
   INITIALIZE
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        startDashboard
    );

}

else {

    startDashboard();

}
