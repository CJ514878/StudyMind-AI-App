/* =========================================================
STUDYMIND AI — DASHBOARD
COMPLETE REPLACEMENT

FIXES:

* Uses the active plan created by Home
* Never resurrects an old Geometry/default plan when
  a valid studyMindPlans registry already exists
* Full multi-plan support
* Per-plan progress persistence
* Topic completion
* Knowledge-check navigation
* Study timer: 25 / 45 / 60 minutes
* Calendar
* Schedule
* Study streak
* Study score
* Daily challenge
* AI question limit
* Theme
* Supabase authentication
* Legacy localStorage compatibility
* Missing syncActivePlanRecord() fixed
  ========================================================= */

"use strict";

/* =========================================================
STORAGE
========================================================= */

const PLAN_KEY =
"studyMindPlan";

const LEGACY_PLAN_KEY =
"studyData";

const PLANS_KEY =
"studyMindPlans";

const ACTIVE_PLAN_KEY =
"studyMindActivePlanId";

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

const STUDY_READINGS_KEY =
"studyMindTopicReadings";

/* =========================================================
SETTINGS
========================================================= */

const FREE_AI_LIMIT =
5;

const TIMER_OPTIONS =
[25, 45, 60];

const DEFAULT_TIMER_SECONDS =
25 * 60;

/* =========================================================
RUNTIME STATE
========================================================= */

let studyPlan =
null;

let subjects =
[];

let allTopics =
[];

let completedTopics =
[];

let completedQuestionTopics =
[];

let currentTopicIndex =
0;

let timerSeconds =
DEFAULT_TIMER_SECONDS;

let selectedTimerSeconds =
DEFAULT_TIMER_SECONDS;

let timerInterval =
null;

let timerRunning =
false;

let calendarDate =
new Date();

let currentUser =
null;

let currentStudySession =
null;

let topicReadings =
{};

let activePlanId =
null;

let readingObserver =
null;

let readingPersistenceInterval =
null;

let stateSaveInterval =
null;

let dashboardInitialized =
false;

/* =========================================================
DOM HELPERS
========================================================= */

function $(id) {


return document.getElementById(id);


}

function clean(value) {


if (
    value === null ||
    value === undefined
) {
    return "";
}

return String(value).trim();


}

function readJSON(key, fallback) {


try {

    const raw =
        localStorage.getItem(key);

    if (!raw) {
        return fallback;
    }

    const parsed =
        JSON.parse(raw);

    return parsed;

} catch (error) {

    console.warn(
        "StudyMind: Failed to read",
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
        "StudyMind: Failed to write",
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

function createId(prefix) {


return (
    prefix +
    "-" +
    Date.now() +
    "-" +
    Math.random()
        .toString(36)
        .slice(2, 8)
);


}

/* =========================================================
DATE HELPERS
========================================================= */

function parseDate(value) {


if (!value) {
    return null;
}

const date =
    new Date(value);

if (
    Number.isNaN(
        date.getTime()
    )
) {
    return null;
}

return date;


}

function dateKey(date) {


if (!date) {
    return "";
}

const year =
    date.getFullYear();

const month =
    String(
        date.getMonth() + 1
    ).padStart(2, "0");

const day =
    String(
        date.getDate()
    ).padStart(2, "0");

return (
    year +
    "-" +
    month +
    "-" +
    day
);


}

function dateOnly(value) {


const date =
    value instanceof Date
        ? new Date(value)
        : parseDate(value);

if (!date) {
    return null;
}

return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
);


}

function sameDay(a, b) {


const da =
    dateOnly(a);

const db =
    dateOnly(b);

if (!da || !db) {
    return false;
}

return (
    da.getTime() ===
    db.getTime()
);


}

function addDays(date, amount) {


const result =
    new Date(date);

result.setDate(
    result.getDate() + amount
);

return result;


}

function daysBetween(start, end) {


const a =
    dateOnly(start);

const b =
    dateOnly(end);

if (!a || !b) {
    return 0;
}

return Math.round(
    (
        b.getTime() -
        a.getTime()
    ) /
    86400000
);


}

function formatDate(value) {


const date =
    parseDate(value);

if (!date) {
    return "—";
}

return date.toLocaleDateString(
    undefined,
    {
        day: "numeric",
        month: "short",
        year: "numeric"
    }
);


}

function formatShortDate(value) {


const date =
    parseDate(value);

if (!date) {
    return "—";
}

return date.toLocaleDateString(
    undefined,
    {
        day: "numeric",
        month: "short"
    }
);


}

/* =========================================================
TIME HELPERS
========================================================= */

function formatTimer(seconds) {


seconds =
    Math.max(
        0,
        Math.floor(
            Number(seconds) || 0
        )
    );

const minutes =
    Math.floor(
        seconds / 60
    );

const secs =
    seconds % 60;

return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(secs).padStart(2, "0")
);


}

function formatHours(hours) {


const number =
    Number(hours) || 0;

if (number === 0) {
    return "0h";
}

if (number < 1) {
    return Math.round(
        number * 60
    ) + "m";
}

return (
    Math.round(
        number * 10
    ) / 10
) + "h";


}

/* =========================================================
TOPIC NORMALIZATION
========================================================= */

function topicKey(topic) {


if (!topic) {
    return "";
}

if (
    typeof topic === "string"
) {
    return slug(topic);
}

return clean(
    topic.id ||
    topic.key ||
    topic.topicId ||
    slug(
        topic.name ||
        topic.title ||
        topic.topic ||
        ""
    )
);


}

function topicName(topic) {


if (!topic) {
    return "Untitled Topic";
}

if (
    typeof topic === "string"
) {
    return clean(topic) ||
        "Untitled Topic";
}

return clean(
    topic.name ||
    topic.title ||
    topic.topic ||
    topic.topicName ||
    "Untitled Topic"
);


}

function topicSubject(topic) {


if (!topic) {
    return "";
}

if (
    typeof topic === "string"
) {
    return "";
}

return clean(
    topic.subject ||
    topic.subjectName ||
    topic.parentSubject ||
    ""
);


}

function topicDescription(topic) {


if (!topic) {
    return "";
}

if (
    typeof topic === "string"
) {
    return "";
}

return clean(
    topic.description ||
    topic.desc ||
    topic.summary ||
    ""
);


}

function normalizeTopic(topic, index) {


if (
    typeof topic === "string"
) {

    return {
        id:
            slug(topic) ||
            "topic-" + index,
        name:
            clean(topic) ||
            "Untitled Topic",
        subject:
            "",
        description:
            "",
        difficulty:
            "",
        index:
            index
    };

}

const source =
    topic || {};

return {

    ...source,

    id:
        clean(
            source.id ||
            source.key ||
            source.topicId
        ) ||
        slug(
            source.name ||
            source.title ||
            source.topic ||
            "topic-" + index
        ),

    name:
        topicName(source),

    subject:
        topicSubject(source),

    description:
        topicDescription(source),

    difficulty:
        clean(
            source.difficulty ||
            ""
        ),

    index:
        index

};


}

/* =========================================================
PLAN NORMALIZATION
========================================================= */

function normalizePlan(plan) {


if (!plan) {
    return null;
}

const source =
    typeof plan === "object"
        ? plan
        : {};

let rawSubjects =
    Array.isArray(
        source.subjects
    )
        ? source.subjects
        : [];

let rawTopics =
    Array.isArray(
        source.topics
    )
        ? source.topics
        : [];

/*
   Some older StudyMind plans store topics
   inside subject objects.
*/

if (
    rawTopics.length === 0 &&
    rawSubjects.length > 0
) {

    rawSubjects.forEach(
        subject => {

            if (
                subject &&
                Array.isArray(
                    subject.topics
                )
            ) {

                subject.topics.forEach(
                    topic => {

                        if (
                            typeof topic ===
                            "object"
                        ) {

                            rawTopics.push({
                                ...topic,
                                subject:
                                    topic.subject ||
                                    subject.name ||
                                    subject.subject ||
                                    ""
                            });

                        } else {

                            rawTopics.push({
                                name:
                                    topic,
                                subject:
                                    subject.name ||
                                    subject.subject ||
                                    ""
                            });

                        }

                    }
                );

            }

        }
    );

}

const normalizedTopics =
    rawTopics.map(
        (topic, index) =>
            normalizeTopic(
                topic,
                index
            )
    );

const subjectNames =
    rawSubjects
        .map(
            subject => {

                if (
                    typeof subject ===
                    "string"
                ) {
                    return clean(
                        subject
                    );
                }

                return clean(
                    subject?.name ||
                    subject?.subject ||
                    subject?.title ||
                    ""
                );

            }
        )
        .filter(Boolean);

normalizedTopics.forEach(
    topic => {

        if (
            topic.subject &&
            !subjectNames.includes(
                topic.subject
            )
        ) {

            subjectNames.push(
                topic.subject
            );

        }

    }
);

const examDate =
    clean(
        source.examDate ||
        source.testDate ||
        source.date ||
        ""
    );

return {

    ...source,

    id:
        clean(
            source.id ||
            source.planId
        ),

    title:
        clean(
            source.title ||
            source.name ||
            ""
        ),

    curriculum:
        clean(
            source.curriculum ||
            ""
        ),

    examDate,

    startDate:
        clean(
            source.startDate ||
            source.studyStartDate ||
            ""
        ),

    hoursPerDay:
        Number(
            source.hoursPerDay
        ) || 0,

    startTime:
        clean(
            source.startTime ||
            ""
        ),

    difficulty:
        clean(
            source.difficulty ||
            ""
        ),

    subjects:
        rawSubjects,

    subjectNames,

    topics:
        normalizedTopics,

    topicNames:
        normalizedTopics.map(
            topicName
        )

};


}

function planTitle(plan) {


if (!plan) {
    return "Study Plan";
}

if (
    clean(plan.title)
) {
    return clean(
        plan.title
    );
}

const names =
    Array.isArray(
        plan.subjectNames
    )
        ? plan.subjectNames
        : [];

if (
    names.length
) {

    return (
        names.join(" + ") +
        " Study Plan"
    );

}

return "Study Plan";


}

/* =========================================================
MULTI-PLAN STORAGE
========================================================= */

function getSavedPlans() {


const plans =
    readJSON(
        PLANS_KEY,
        []
    );

if (
    !Array.isArray(plans)
) {
    return [];
}

return plans.filter(
    record =>
        record &&
        typeof record ===
        "object" &&
        record.plan
);


}

function saveSavedPlans(plans) {


return writeJSON(
    PLANS_KEY,
    Array.isArray(plans)
        ? plans
        : []
);


}

function getActivePlanId() {


return (
    localStorage.getItem(
        ACTIVE_PLAN_KEY
    ) ||
    null
);


}

function setActivePlanId(planId) {


if (!planId) {

    localStorage.removeItem(
        ACTIVE_PLAN_KEY
    );

    return;

}

localStorage.setItem(
    ACTIVE_PLAN_KEY,
    String(planId)
);


}

/* =========================================================
PLAN STATE CREATION
========================================================= */

function createPlanRecord(plan) {


const normalized =
    normalizePlan(plan);

return {

    id:
        createId("plan"),

    title:
        planTitle(normalized),

    plan:
        normalized,

    completedTopics:
        [],

    completedQuestionTopics:
        [],

    currentTopicIndex:
        0,

    knowledgeCheckTopic:
        null,

    knowledgeQuestions:
        null,

    celebrationShown:
        false,

    studySession:
        null,

    topicReadings:
        {},

    timerSeconds:
        DEFAULT_TIMER_SECONDS,

    selectedTimerSeconds:
        DEFAULT_TIMER_SECONDS,

    createdAt:
        new Date().toISOString(),

    updatedAt:
        new Date().toISOString()

};


}

function captureCurrentPlanState() {


if (!studyPlan) {
    return null;
}

return {

    plan:
        studyPlan,

    activePlanId:
        activePlanId,

    completedTopics:
        [...completedTopics],

    completedQuestionTopics:
        [...completedQuestionTopics],

    currentTopicIndex:
        currentTopicIndex,

    knowledgeCheckTopic:
        readJSON(
            KNOWLEDGE_TOPIC_KEY,
            null
        ),

    knowledgeQuestions:
        readJSON(
            KNOWLEDGE_QUESTIONS_KEY,
            null
        ),

    celebrationShown:
        localStorage.getItem(
            CELEBRATION_KEY
        ) === "true",

    studySession:
        currentStudySession,

    topicReadings:
        topicReadings,

    timerSeconds:
        timerSeconds,

    selectedTimerSeconds:
        selectedTimerSeconds,

    updatedAt:
        new Date().toISOString()

};


}

/* =========================================================
IMPORTANT:
THIS FUNCTION WAS MISSING AND CAUSED THE CRASH
========================================================= */

function syncActivePlanRecord() {


if (!activePlanId) {
    return false;
}

const plans =
    getSavedPlans();

const index =
    plans.findIndex(
        record =>
            record.id ===
            activePlanId
    );

if (index < 0) {
    return false;
}

const existing =
    plans[index];

plans[index] = {

    ...existing,

    title:
        planTitle(studyPlan),

    plan:
        studyPlan,

    completedTopics:
        Array.isArray(
            completedTopics
        )
            ? [...completedTopics]
            : [],

    completedQuestionTopics:
        Array.isArray(
            completedQuestionTopics
        )
            ? [...completedQuestionTopics]
            : [],

    currentTopicIndex:
        currentTopicIndex,

    knowledgeCheckTopic:
        readJSON(
            KNOWLEDGE_TOPIC_KEY,
            null
        ),

    knowledgeQuestions:
        readJSON(
            KNOWLEDGE_QUESTIONS_KEY,
            null
        ),

    celebrationShown:
        localStorage.getItem(
            CELEBRATION_KEY
        ) === "true",

    studySession:
        currentStudySession,

    topicReadings:
        topicReadings,

    timerSeconds:
        timerSeconds,

    selectedTimerSeconds:
        selectedTimerSeconds,

    updatedAt:
        new Date().toISOString()

};

saveSavedPlans(
    plans
);

return true;


}

/* =========================================================
SAVE DASHBOARD STATE
========================================================= */

function saveDashboardState() {


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

writeJSON(
    STUDY_SESSION_KEY,
    currentStudySession
);

writeJSON(
    STUDY_READINGS_KEY,
    topicReadings
);

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

syncActivePlanRecord();


}

/* =========================================================
ENSURE PLAN REGISTRY
========================================================= */

function ensurePlanRegistry() {


let plans =
    getSavedPlans();

/*
   CRITICAL FIX:

   If the multi-plan registry already contains plans,
   do NOT take studyMindPlan and turn it into another
   active plan.

   studyMindPlan is only a compatibility mirror.
*/

if (
    plans.length > 0
) {

    const activeId =
        getActivePlanId();

    const activeExists =
        !!plans.find(
            record =>
                record.id ===
                activeId
        );

    if (
        activeExists
    ) {
        return plans;
    }

    /*
       Home creates new plans with unshift(),
       meaning index 0 is the newest/current plan.
    */

    const validPlans =
        plans.filter(
            record =>
                record &&
                record.id &&
                record.plan
        );

    if (
        validPlans.length > 0
    ) {

        setActivePlanId(
            validPlans[0].id
        );

        return validPlans;
    }

    return plans;

}


/*
   Only migrate legacy studyMindPlan if there is
   genuinely no multi-plan registry.
*/

const legacy =
    readJSON(
        PLAN_KEY,
        null
    ) ||
    readJSON(
        LEGACY_PLAN_KEY,
        null
    );

if (!legacy) {
    return [];
}

const normalized =
    normalizePlan(
        legacy
    );

if (
    !normalized ||
    !normalized.topics.length
) {

    return [];

}

const record =
    createPlanRecord(
        normalized
    );

record.id =
    clean(
        legacy.id
    ) ||
    record.id;

record.title =
    planTitle(
        normalized
    );

plans = [
    record
];

saveSavedPlans(
    plans
);

setActivePlanId(
    record.id
);

return plans;


}

/* =========================================================
LOAD ACTIVE PLAN
========================================================= */

function loadActivePlan() {


const plans =
    ensurePlanRegistry();

if (
    !plans.length
) {

    studyPlan =
        null;

    return false;

}

let selectedId =
    getActivePlanId();

let record =
    plans.find(
        item =>
            item.id ===
            selectedId
    );

/*
   If the active ID is invalid, use the newest
   registry record — NOT the legacy studyMindPlan.
*/

if (!record) {

    record =
        plans[0];

    if (
        record?.id
    ) {

        setActivePlanId(
            record.id
        );

    }

}

if (!record) {
    return false;
}

activePlanId =
    record.id;

studyPlan =
    normalizePlan(
        record.plan
    );

if (!studyPlan) {
    return false;
}

/*
   Restore subjects.
*/

subjects =
    Array.isArray(
        studyPlan.subjectNames
    )
        ? [
            ...studyPlan.subjectNames
        ]
        : [];

/*
   Restore topics.
*/

allTopics =
    Array.isArray(
        studyPlan.topics
    )
        ? studyPlan.topics.map(
            normalizeTopic
        )
        : [];

/*
   Restore per-plan completion.
*/

completedTopics =
    Array.isArray(
        record.completedTopics
    )
        ? [
            ...record.completedTopics
        ]
        : [];

completedQuestionTopics =
    Array.isArray(
        record.completedQuestionTopics
    )
        ? [
            ...record.completedQuestionTopics
        ]
        : [];

/*
   Compatibility fallback for old state.
*/

if (
    completedTopics.length === 0
) {

    const oldCompleted =
        readJSON(
            COMPLETED_KEY,
            []
        );

    if (
        Array.isArray(
            oldCompleted
        )
    ) {

        completedTopics =
            oldCompleted.filter(
                key =>
                    allTopics.some(
                        topic =>
                            topicKey(
                                topic
                            ) ===
                            key
                    )
            );

    }

}

currentTopicIndex =
    Number(
        record.currentTopicIndex
    );

if (
    !Number.isInteger(
        currentTopicIndex
    ) ||
    currentTopicIndex < 0
) {

    currentTopicIndex =
        0;

}

if (
    currentTopicIndex >=
    allTopics.length
) {

    currentTopicIndex =
        Math.max(
            0,
            allTopics.length - 1
        );

}

currentStudySession =
    record.studySession ||
    readJSON(
        STUDY_SESSION_KEY,
        null
    );

topicReadings =
    record.topicReadings &&
    typeof record.topicReadings ===
    "object"
        ? record.topicReadings
        : readJSON(
            STUDY_READINGS_KEY,
            {}
        );

selectedTimerSeconds =
    Number(
        record.selectedTimerSeconds
    ) ||
    Number(
        localStorage.getItem(
            TIMER_DURATION_KEY
        )
    ) ||
    DEFAULT_TIMER_SECONDS;

if (
    !TIMER_OPTIONS.includes(
        selectedTimerSeconds / 60
    )
) {

    selectedTimerSeconds =
        DEFAULT_TIMER_SECONDS;

}

timerSeconds =
    Number(
        record.timerSeconds
    );

if (
    !Number.isFinite(
        timerSeconds
    ) ||
    timerSeconds <= 0
) {

    timerSeconds =
        selectedTimerSeconds;

}

/*
   Restore compatibility keys for the active plan.
*/

writeJSON(
    PLAN_KEY,
    studyPlan
);

writeJSON(
    LEGACY_PLAN_KEY,
    studyPlan
);

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

writeJSON(
    STUDY_SESSION_KEY,
    currentStudySession
);

writeJSON(
    STUDY_READINGS_KEY,
    topicReadings
);

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

console.log(
    "StudyMind: Active plan loaded:",
    {
        activePlanId:
            activePlanId,
        title:
            planTitle(
                studyPlan
            ),
        examDate:
            studyPlan.examDate,
        subjects:
            studyPlan.subjectNames,
        topics:
            studyPlan.topicNames,
        savedPlanCount:
            plans.length
    }
);

return true;


}

/* =========================================================
CURRENT TOPIC
========================================================= */

function getCurrentTopic() {


if (
    !allTopics.length
) {
    return null;
}

/*
   Always prioritize the actual current index.
   This prevents an old session from forcing Geometry
   or another previously active topic.
*/

if (
    Number.isInteger(
        currentTopicIndex
    ) &&
    allTopics[
        currentTopicIndex
    ]
) {

    return allTopics[
        currentTopicIndex
    ];

}

const firstIncomplete =
    allTopics.find(
        topic =>
            !isTopicCompleted(
                topic
            )
    );

return (
    firstIncomplete ||
    allTopics[0] ||
    null
);


}

function setCurrentTopic(topic) {


if (!topic) {
    return;
}

const index =
    allTopics.findIndex(
        item =>
            topicKey(item) ===
            topicKey(topic)
    );

if (
    index >= 0
) {

    currentTopicIndex =
        index;

}

createStudySession(
    topic
);

saveDashboardState();


}

/* =========================================================
TOPIC COMPLETION
========================================================= */

function isTopicCompleted(topic) {


if (!topic) {
    return false;
}

const key =
    topicKey(topic);

return (
    completedTopics.includes(
        key
    ) ||
    completedTopics.includes(
        topic.id
    )
);


}

function isQuestionCheckCompleted(topic) {


if (!topic) {
    return false;
}

const key =
    topicKey(topic);

return (
    completedQuestionTopics.includes(
        key
    ) ||
    completedQuestionTopics.includes(
        topic.id
    )
);


}

function allTopicsCompleted() {


if (
    !allTopics.length
) {
    return false;
}

return allTopics.every(
    topic =>
        isTopicCompleted(
            topic
        )
);


}

function completeCurrentTopic() {


const topic =
    getCurrentTopic();

if (!topic) {
    return;
}

const key =
    topicKey(topic);

if (!key) {
    return;
}

if (
    !completedTopics.includes(
        key
    )
) {

    completedTopics.push(
        key
    );

}

currentStudySession =
    {
        ...(currentStudySession || {}),
        topicKey:
            key,
        topicName:
            topicName(topic),
        completed:
            true,
        completedAt:
            new Date().toISOString()
    };

updateStudyStreak();

saveDashboardState();

renderAll();

if (
    allTopicsCompleted()
) {

    maybeShowCompletionCelebration();

    return;

}

const nextIndex =
    allTopics.findIndex(
        (item, index) =>
            index >
            currentTopicIndex &&
            !isTopicCompleted(
                item
            )
    );

if (
    nextIndex >= 0
) {

    currentTopicIndex =
        nextIndex;

} else {

    const firstIncomplete =
        allTopics.findIndex(
            item =>
                !isTopicCompleted(
                    item
                )
        );

    if (
        firstIncomplete >= 0
    ) {

        currentTopicIndex =
            firstIncomplete;

    }

}

createStudySession(
    getCurrentTopic()
);

saveDashboardState();

renderAll();


}

/* =========================================================
STUDY SESSION
========================================================= */

function createStudySession(topic) {


if (!topic) {
    return null;
}

currentStudySession =
    {

        topicKey:
            topicKey(topic),

        topicName:
            topicName(topic),

        subject:
            topicSubject(topic),

        startedAt:
            currentStudySession?.startedAt ||
            new Date().toISOString(),

        lastOpenedAt:
            new Date().toISOString(),

        completed:
            isTopicCompleted(
                topic
            )

    };

writeJSON(
    STUDY_SESSION_KEY,
    currentStudySession
);

syncActivePlanRecord();

return currentStudySession;


}

function saveStudySession() {


if (!currentStudySession) {
    return;
}

writeJSON(
    STUDY_SESSION_KEY,
    currentStudySession
);

syncActivePlanRecord();


}

/* =========================================================
READING PROGRESS
========================================================= */

function saveCurrentReading() {


const topic =
    getCurrentTopic();

if (!topic) {
    return;
}

const key =
    topicKey(topic);

if (!key) {
    return;
}

/*
   Keep the currently tracked reading position.
   The dashboard may not have an article reader on every
   layout, so only save values that actually exist.
*/

const scrollTop =
    window.scrollY ||
    document.documentElement.scrollTop ||
    0;

topicReadings[key] =
    {

        ...(topicReadings[key] || {}),

        scrollTop:
            scrollTop,

        updatedAt:
            new Date().toISOString()

    };

writeJSON(
    STUDY_READINGS_KEY,
    topicReadings
);

syncActivePlanRecord();


}

function restoreCurrentReading() {


const topic =
    getCurrentTopic();

if (!topic) {
    return;
}

const saved =
    topicReadings[
        topicKey(topic)
    ];

if (
    !saved ||
    !Number.isFinite(
        Number(
            saved.scrollTop
        )
    )
) {
    return;
}

/*
   Only restore if the page actually has enough content.
*/

if (
    document.documentElement
        .scrollHeight >
    window.innerHeight + 100
) {

    window.scrollTo(
        {
            top:
                Number(
                    saved.scrollTop
                ),
            behavior:
                "auto"
        }
    );

}


}

function startReadingPersistence() {


if (
    readingPersistenceInterval
) {

    clearInterval(
        readingPersistenceInterval
    );

}

if (
    readingObserver
) {

    try {
        readingObserver.disconnect();
    } catch (_) {}

    readingObserver =
        null;

}

readingPersistenceInterval =
    setInterval(
        saveCurrentReading,
        4000
    );

if (
    typeof IntersectionObserver !==
    "undefined"
) {

    readingObserver =
        new IntersectionObserver(
            () => {
                saveCurrentReading();
            },
            {
                threshold:
                    0.1
            }
        );

    document
        .querySelectorAll(
            ".topic-reading, .study-content, article"
        )
        .forEach(
            element =>
                readingObserver.observe(
                    element
                )
        );

}


}

/* =========================================================
TIMER
========================================================= */

function updateTimerDisplay() {


const display =
    $("studyTimer");

if (!display) {
    return;
}

display.textContent =
    formatTimer(
        timerSeconds
    );

const start =
    $("startTimerButton");

const pause =
    $("pauseTimerButton");

if (start) {

    start.disabled =
        timerRunning ||
        timerSeconds <= 0;

}

if (pause) {

    pause.disabled =
        !timerRunning;

}


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

updateTimerDisplay();

timerInterval =
    setInterval(
        () => {

            if (
                timerSeconds <= 0
            ) {

                stopTimer();

                timerSeconds =
                    0;

                updateTimerDisplay();

                markStudyActivity();

                return;

            }

            timerSeconds--;

            updateTimerDisplay();

            if (
                timerSeconds %
                15 ===
                0
            ) {

                saveDashboardState();

            }

        },
        1000
    );

markStudyActivity();


}

function pauseTimer() {


if (
    timerInterval
) {

    clearInterval(
        timerInterval
    );

    timerInterval =
        null;

}

timerRunning =
    false;

saveDashboardState();

updateTimerDisplay();


}

function stopTimer() {


if (
    timerInterval
) {

    clearInterval(
        timerInterval
    );

    timerInterval =
        null;

}

timerRunning =
    false;

saveDashboardState();

updateTimerDisplay();


}

function resetTimer() {


stopTimer();

timerSeconds =
    selectedTimerSeconds;

updateTimerDisplay();

saveDashboardState();


}

function changeTimerDuration(value) {


let minutes =
    Number(value);

if (
    !TIMER_OPTIONS.includes(
        minutes
    )
) {

    minutes =
        25;

}

selectedTimerSeconds =
    minutes * 60;

timerSeconds =
    selectedTimerSeconds;

stopTimer();

const select =
    $("timerDuration");

if (select) {

    select.value =
        String(minutes);

}

saveDashboardState();

updateTimerDisplay();


}

/* =========================================================
STUDY STREAK
========================================================= */

function updateStudyStreak() {


const today =
    dateKey(
        new Date()
    );

const last =
    localStorage.getItem(
        LAST_STUDY_KEY
    );

let streak =
    Number(
        localStorage.getItem(
            STREAK_KEY
        )
    ) || 0;

if (
    last === today
) {

    return streak;

}

if (
    last
) {

    const previous =
        parseDate(last);

    const difference =
        previous
            ? daysBetween(
                previous,
                new Date()
            )
            : 99;

    if (
        difference === 1
    ) {

        streak += 1;

    } else {

        streak = 1;

    }

} else {

    streak = 1;

}

localStorage.setItem(
    STREAK_KEY,
    String(streak)
);

localStorage.setItem(
    LAST_STUDY_KEY,
    today
);

return streak;


}

function markStudyActivity() {


updateStudyStreak();

saveDashboardState();


}

/* =========================================================
STATS
========================================================= */

function getCompletedCount() {


return allTopics.filter(
    topic =>
        isTopicCompleted(
            topic
        )
).length;


}

function getProgressPercent() {


if (
    !allTopics.length
) {
    return 0;
}

return Math.round(
    (
        getCompletedCount() /
        allTopics.length
    ) *
    100
);


}

function getDaysLeft() {


const exam =
    parseDate(
        studyPlan?.examDate
    );

if (!exam) {
    return 0;
}

return Math.max(
    0,
    daysBetween(
        new Date(),
        exam
    )
);


}

function calculateStudyScore() {


if (
    !allTopics.length
) {
    return 0;
}

const progress =
    getProgressPercent();

const questionBonus =
    Math.min(
        20,
        completedQuestionTopics.length *
        4
    );

return Math.min(
    100,
    Math.round(
        progress * 0.8 +
        questionBonus
    )
);


}

function getWeeklyHours() {


/*
   Estimate completed study time from the selected timer
   duration. This preserves a useful dashboard stat without
   inventing external tracking data.
*/

const completed =
    getCompletedCount();

const hours =
    completed *
    (
        selectedTimerSeconds /
        3600
    );

return hours;


}

function renderStats() {


const weeklyHours =
    $("weeklyHours");

const daysLeft =
    $("daysLeft");

const dailyGoal =
    $("dailyGoal");

const studyScore =
    $("studyScore");

if (weeklyHours) {

    weeklyHours.textContent =
        formatHours(
            getWeeklyHours()
        );

}

if (daysLeft) {

    daysLeft.textContent =
        String(
            getDaysLeft()
        );

}

if (dailyGoal) {

    dailyGoal.textContent =
        formatHours(
            Number(
                studyPlan?.hoursPerDay
            ) || 0
        );

}

if (studyScore) {

    studyScore.textContent =
        String(
            calculateStudyScore()
        );

}


}

/* =========================================================
CURRENT TOPIC RENDERING
========================================================= */

function renderCurrentTopic() {


const section =
    $("currentTopicSection");

if (!section) {
    return;
}

const topic =
    getCurrentTopic();

if (!topic) {

    const name =
        $("currentTopicName");

    if (name) {
        name.textContent =
            "No topic available";
    }

    return;

}

createStudySession(
    topic
);

const completed =
    isTopicCompleted(
        topic
    );

const statusBadge =
    $("topicStatusBadge");

const position =
    $("topicPosition");

const name =
    $("currentTopicName");

const description =
    $("currentTopicDescription");

if (statusBadge) {

    statusBadge.textContent =
        completed
            ? "COMPLETED"
            : "IN PROGRESS";

    statusBadge.classList.toggle(
        "completed",
        completed
    );

}

if (position) {

    position.textContent =
        "TOPIC " +
        (
            currentTopicIndex + 1
        ) +
        " OF " +
        allTopics.length;

}

if (name) {

    name.textContent =
        topicName(topic);

}

if (description) {

    description.textContent =
        topicDescription(topic) ||
        (
            "Study " +
            topicName(topic) +
            (
                topicSubject(topic)
                    ? " for " +
                      topicSubject(topic)
                    : ""
            ) +
            " and complete the knowledge check."
        );

}

const checkbox =
    $("topicCompleteCheckbox");

if (checkbox) {

    checkbox.checked =
        completed;

    checkbox.disabled =
        completed;

}

const completionMessage =
    $("topicCompletionMessage");

if (completionMessage) {

    completionMessage.textContent =
        completed
            ? "✓ Topic completed"
            : "Mark this topic as finished after studying it.";

}

const nextMessage =
    $("nextTopicMessage");

if (nextMessage) {

    const nextTopic =
        allTopics[
            currentTopicIndex + 1
        ];

    if (
        completed &&
        nextTopic
    ) {

        nextMessage.textContent =
            "Next topic: " +
            topicName(
                nextTopic
            );

    } else if (
        allTopicsCompleted()
    ) {

        nextMessage.textContent =
            "🎉 You have completed every topic in this plan.";

    } else {

        nextMessage.textContent =
            "";

    }

}

const questionSection =
    $("topicQuestionsSection");

if (questionSection) {

    /*
       The separate Knowledge Check page remains the
       official five-question system.
    */

    questionSection.style.display =
        "none";

}

updateTimerDisplay();


}

/* =========================================================
TOPIC LIST
========================================================= */

function renderTopics() {


const container =
    $("topicList");

if (!container) {
    return;
}

if (
    !allTopics.length
) {

    container.innerHTML =
        `
        <div class="empty-state">
            No topics found in this study plan.
        </div>
        `;

    return;

}

container.innerHTML =
    allTopics
        .map(
            (topic, index) => {

                const completed =
                    isTopicCompleted(
                        topic
                    );

                const active =
                    index ===
                    currentTopicIndex;

                return `
                    <button
                        type="button"
                        class="topic-list-item ${active ? "active" : ""} ${completed ? "completed" : ""}"
                        data-topic-index="${index}"
                    >

                        <span class="topic-list-number">
                            ${completed ? "✓" : index + 1}
                        </span>

                        <span class="topic-list-content">

                            <strong>
                                ${escapeHTML(
                                    topicName(
                                        topic
                                    )
                                )}
                            </strong>

                            ${
                                topicSubject(
                                    topic
                                )
                                    ? `
                                        <small>
                                            ${escapeHTML(
                                                topicSubject(
                                                    topic
                                                )
                                            )}
                                        </small>
                                    `
                                    : ""
                            }

                        </span>

                        <span class="topic-list-status">
                            ${
                                completed
                                    ? "Completed"
                                    : active
                                        ? "Current"
                                        : "Study"
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
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.dataset
                                .topicIndex
                        );

                    if (
                        !Number.isInteger(
                            index
                        ) ||
                        !allTopics[index]
                    ) {
                        return;
                    }

                    currentTopicIndex =
                        index;

                    createStudySession(
                        allTopics[index]
                    );

                    saveDashboardState();

                    renderAll();

                    const section =
                        $("currentTopicSection");

                    if (section) {

                        section.scrollIntoView(
                            {
                                behavior:
                                    "smooth",
                                block:
                                    "start"
                            }
                        );

                    }

                }
            );

        }
    );


}

/* =========================================================
SUBJECT LIST
========================================================= */

function renderSubjects() {


const container =
    $("subjectList");

if (!container) {
    return;
}

const grouped =
    {};

allTopics.forEach(
    topic => {

        const subject =
            topicSubject(topic) ||
            "General";

        if (
            !grouped[subject]
        ) {

            grouped[subject] =
                {
                    total: 0,
                    completed: 0
                };

        }

        grouped[subject].total++;

        if (
            isTopicCompleted(
                topic
            )
        ) {

            grouped[
                subject
            ].completed++;

        }

    }
);

if (
    Object.keys(
        grouped
    ).length === 0
) {

    container.innerHTML =
        `
        <div class="empty-state">
            No subjects found.
        </div>
        `;

    return;

}

container.innerHTML =
    Object.entries(
        grouped
    )
        .map(
            ([subject, data]) => {

                const percent =
                    data.total
                        ? Math.round(
                            (
                                data.completed /
                                data.total
                            ) *
                            100
                        )
                        : 0;

                return `
                    <div class="subject-progress-item">

                        <div class="subject-progress-header">

                            <strong>
                                ${escapeHTML(
                                    subject
                                )}
                            </strong>

                            <span>
                                ${data.completed}/${data.total}
                            </span>

                        </div>

                        <div class="subject-progress-bar">
                            <span
                                style="width:${percent}%"
                            ></span>
                        </div>

                        <small>
                            ${percent}% complete
                        </small>

                    </div>
                `;

            }
        )
        .join("");


}

/* =========================================================
PROGRESS
========================================================= */

function renderProgress() {


const percent =
    getProgressPercent();

const progressPercent =
    $("progressPercent");

const progressCount =
    $("progressCount");

const progressBar =
    $("progressBar");

if (progressPercent) {

    progressPercent.textContent =
        percent + "%";

}

if (progressCount) {

    progressCount.textContent =
        getCompletedCount() +
        " / " +
        allTopics.length +
        " topics completed";

}

if (progressBar) {

    progressBar.style.width =
        percent + "%";

}


}

/* =========================================================
CALENDAR
========================================================= */

function getStudyStartDate() {


const explicit =
    parseDate(
        studyPlan?.startDate
    );

if (explicit) {
    return dateOnly(explicit);
}

const exam =
    parseDate(
        studyPlan?.examDate
    );

if (!exam) {
    return dateOnly(new Date());
}

const totalTopics =
    Math.max(
        1,
        allTopics.length
    );

const estimatedDays =
    Math.max(
        1,
        Math.ceil(
            totalTopics /
            Math.max(
                1,
                Number(
                    studyPlan?.hoursPerDay
                ) || 1
            )
        )
    );

return addDays(
    dateOnly(exam),
    -estimatedDays + 1
);


}

function getTopicStudyDates() {


const start =
    getStudyStartDate();

const exam =
    dateOnly(
        studyPlan?.examDate
    );

const result =
    {};

if (!start) {
    return result;
}

/*
   If the plan already contains a schedule, respect it.
*/

allTopics.forEach(
    (topic, index) => {

        const explicitDate =
            topic.studyDate ||
            topic.date ||
            topic.scheduledDate;

        if (explicitDate) {

            const key =
                dateKey(
                    parseDate(
                        explicitDate
                    )
                );

            if (key) {

                if (!result[key]) {
                    result[key] = [];
                }

                result[key].push(
                    topicKey(topic)
                );

            }

            return;

        }

        /*
           Otherwise distribute topics across the
           available study days.
        */

        let date =
            addDays(
                start,
                index
            );

        if (
            exam &&
            date > exam
        ) {

            date =
                new Date(exam);

        }

        const key =
            dateKey(date);

        if (!result[key]) {
            result[key] = [];
        }

        result[key].push(
            topicKey(topic)
        );

    }
);

return result;


}

function getCalendarDayStatus(date) {


const key =
    dateKey(date);

const today =
    dateKey(
        new Date()
    );

const exam =
    dateOnly(
        studyPlan?.examDate
    );

const studyStart =
    getStudyStartDate();

const schedule =
    getTopicStudyDates();

if (
    exam &&
    sameDay(
        date,
        exam
    )
) {

    return "exam";

}

if (
    exam &&
    date > exam
) {

    return "after-exam";

}

if (
    studyStart &&
    date < studyStart
) {

    return "before-study";

}

const scheduledTopics =
    schedule[key] || [];

if (
    scheduledTopics.length
) {

    const completed =
        scheduledTopics.every(
            topicId =>
                completedTopics.includes(
                    topicId
                )
        );

    return completed
        ? "completed"
        : "study";

}

/*
   Days without topics are rest days.
*/

return "rest";


}

function injectCalendarCSS() {


if (
    document.getElementById(
        "studyMindCalendarInjectedCSS"
    )
) {
    return;
}

const style =
    document.createElement(
        "style"
    );

style.id =
    "studyMindCalendarInjectedCSS";

style.textContent = `

    #calendarDays {
        display:grid;
        grid-template-columns:
            repeat(7,minmax(0,1fr));
        gap:8px;
    }

    .studyMind-calendar-day {
        min-height:70px;
        border-radius:14px;
        padding:8px;
        position:relative;
        border:1px solid rgba(148,163,184,.16);
        background:rgba(15,23,42,.5);
        transition:
            transform .18s ease,
            box-shadow .18s ease;
    }

    .studyMind-calendar-day:hover {
        transform:translateY(-2px);
    }

    .studyMind-calendar-day .day-number {
        font-weight:800;
    }

    .studyMind-calendar-day.study {
        border-color:
            rgba(59,130,246,.55);
        box-shadow:
            0 0 16px rgba(59,130,246,.16);
    }

    .studyMind-calendar-day.completed {
        border-color:
            rgba(34,197,94,.55);
        box-shadow:
            0 0 16px rgba(34,197,94,.16);
    }

    .studyMind-calendar-day.rest {
        border-color:
            rgba(168,85,247,.4);
        box-shadow:
            0 0 12px rgba(168,85,247,.12);
    }

    .studyMind-calendar-day.exam {
        border-color:
            rgba(239,68,68,.7);
        box-shadow:
            0 0 22px rgba(239,68,68,.24);
    }

    .studyMind-calendar-day.after-exam {
        opacity:.38;
    }

    .studyMind-calendar-day.before-study {
        opacity:.4;
    }

    .studyMind-calendar-day.today {
        outline:
            2px solid rgba(255,255,255,.8);
        outline-offset:2px;
    }

    .studyMind-calendar-day .day-label {
        display:block;
        margin-top:8px;
        font-size:.7rem;
        opacity:.72;
    }

    .studyMind-calendar-day .day-dot {
        width:7px;
        height:7px;
        border-radius:50%;
        margin-top:7px;
        background:currentColor;
        opacity:.9;
    }

    @media (max-width:650px) {

        #calendarDays {
            gap:5px;
        }

        .studyMind-calendar-day {
            min-height:58px;
            padding:6px;
            border-radius:10px;
        }

    }

`;

document.head.appendChild(
    style
);


}

function renderCalendar() {


const daysContainer =
    $("calendarDays");

const monthLabel =
    $("calendarMonth");

if (
    !daysContainer ||
    !monthLabel
) {
    return;
}

injectCalendarCSS();

const year =
    calendarDate.getFullYear();

const month =
    calendarDate.getMonth();

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

monthLabel.textContent =
    firstDay.toLocaleDateString(
        undefined,
        {
            month:
                "long",
            year:
                "numeric"
        }
    );

const startingDay =
    firstDay.getDay();

const cells =
    [];

for (
    let i = 0;
    i < startingDay;
    i++
) {

    cells.push(
        `<div></div>`
    );

}

for (
    let day = 1;
    day <= lastDay.getDate();
    day++
) {

    const date =
        new Date(
            year,
            month,
            day
        );

    const status =
        getCalendarDayStatus(
            date
        );

    const today =
        sameDay(
            date,
            new Date()
        );

    cells.push(
        `
        <div
            class="
                studyMind-calendar-day
                ${status}
                ${today ? "today" : ""}
            "
            title="${escapeHTML(
                status === "exam"
                    ? "Exam day"
                    : status === "study"
                        ? "Study day"
                        : status === "completed"
                            ? "Completed study day"
                            : status === "rest"
                                ? "Rest day"
                                : status === "after-exam"
                                    ? "After exam"
                                    : "Before study"
            )}"
        >

            <span class="day-number">
                ${day}
            </span>

            <span class="day-dot"></span>

            <span class="day-label">
                ${
                    status === "exam"
                        ? "Exam"
                        : status === "study"
                            ? "Study"
                            : status === "completed"
                                ? "Done"
                                : status === "rest"
                                    ? "Rest"
                                    : ""
                }
            </span>

        </div>
        `
    );

}

daysContainer.innerHTML =
    cells.join("");

renderNextBooking();


}

function renderNextBooking() {


const booking =
    $("nextBooking");

const bookingTime =
    $("nextBookingTime");

if (
    !booking ||
    !bookingTime
) {
    return;
}

const schedule =
    getTopicStudyDates();

const today =
    dateOnly(
        new Date()
    );

let nextDate =
    null;

let nextTopics =
    [];

Object.keys(
    schedule
)
    .sort()
    .forEach(
        key => {

            const date =
                parseDate(key);

            if (
                !date ||
                date < today ||
                nextDate
            ) {
                return;
            }

            const pending =
                schedule[key].filter(
                    topicId =>
                        !completedTopics.includes(
                            topicId
                        )
                );

            if (
                pending.length
            ) {

                nextDate =
                    date;

                nextTopics =
                    pending;

            }

        }
    );

if (!nextDate) {

    booking.textContent =
        "No upcoming study sessions";

    bookingTime.textContent =
        "";

    return;

}

const firstTopic =
    allTopics.find(
        topic =>
            nextTopics.includes(
                topicKey(topic)
            )
    );

booking.textContent =
    formatDate(
        nextDate
    );

bookingTime.textContent =
    firstTopic
        ? topicName(
            firstTopic
        )
        : "Study session";


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

if (
    !studyPlan ||
    !allTopics.length
) {

    container.innerHTML =
        `
        <div class="empty-schedule">
            Your daily study sessions will appear here.
        </div>
        `;

    return;

}

const schedule =
    getTopicStudyDates();

const entries =
    Object.entries(
        schedule
    )
        .sort(
            ([a], [b]) =>
                a.localeCompare(b)
        );

if (
    !entries.length
) {

    container.innerHTML =
        `
        <div class="empty-schedule">
            No study sessions scheduled yet.
        </div>
        `;

    return;

}

container.innerHTML =
    entries
        .map(
            ([dateKeyValue, topicIds]) => {

                const date =
                    parseDate(
                        dateKeyValue
                    );

                const topicObjects =
                    topicIds
                        .map(
                            id =>
                                allTopics.find(
                                    topic =>
                                        topicKey(
                                            topic
                                        ) ===
                                        id
                                )
                        )
                        .filter(Boolean);

                const allCompleted =
                    topicObjects.length > 0 &&
                    topicObjects.every(
                        topic =>
                            isTopicCompleted(
                                topic
                            )
                    );

                return `
                    <div
                        class="
                            schedule-item
                            ${allCompleted ? "completed" : ""}
                        "
                    >

                        <div class="schedule-date">
                            ${escapeHTML(
                                formatShortDate(
                                    date
                                )
                            )}
                        </div>

                        <div class="schedule-content">

                            ${
                                topicObjects
                                    .map(
                                        topic =>
                                            `
                                            <div class="schedule-topic">
                                                <span>
                                                    ${
                                                        isTopicCompleted(
                                                            topic
                                                        )
                                                            ? "✓"
                                                            : "📖"
                                                    }
                                                </span>
                                                <strong>
                                                    ${escapeHTML(
                                                        topicName(
                                                            topic
                                                        )
                                                    )}
                                                </strong>
                                            </div>
                                            `
                                    )
                                    .join("")
                            }

                        </div>

                        <div class="schedule-status">
                            ${
                                allCompleted
                                    ? "Completed"
                                    : "Study"
                            }
                        </div>

                    </div>
                `;

            }
        )
        .join("");


}

/* =========================================================
DAILY CHALLENGE
========================================================= */

function getDailyChallengeTopic() {


if (
    !allTopics.length
) {
    return null;
}

const today =
    new Date();

const number =
    today.getFullYear() *
    10000 +
    (today.getMonth() + 1) *
    100 +
    today.getDate();

return allTopics[
    Math.abs(number) %
    allTopics.length
];


}

function renderDailyChallenge() {


const section =
    $("dailyChallenges");

if (!section) {
    return;
}

const topic =
    getDailyChallengeTopic();

if (!topic) {
    return;
}

const badge =
    $("dailyChallengeBadge");

const text =
    $("dailyChallengeText");

const title =
    $("dailyChallengeTitle");

const description =
    $("dailyChallengeDescription");

const progress =
    $("dailyChallengeProgress");

const progressBar =
    $("dailyChallengeProgressBar");

const button =
    $("dailyChallengeButton");

const completed =
    isTopicCompleted(
        topic
    );

if (badge) {

    badge.textContent =
        completed
            ? "COMPLETED"
            : "TODAY";

}

if (text) {

    text.textContent =
        completed
            ? "Daily challenge completed!"
            : "Focus on one topic today.";

}

if (title) {

    title.textContent =
        topicName(topic);

}

if (description) {

    description.textContent =
        topicDescription(topic) ||
        (
            "Study " +
            topicName(topic) +
            " and mark it complete."
        );

}

if (progress) {

    progress.textContent =
        completed
            ? "1 / 1 complete"
            : "0 / 1 complete";

}

if (progressBar) {

    progressBar.style.width =
        completed
            ? "100%"
            : "0%";

}

if (button) {

    button.textContent =
        completed
            ? "Review Topic"
            : "Start Challenge";

}


}

/* =========================================================
COMPLETION CELEBRATION
========================================================= */

function maybeShowCompletionCelebration() {


if (
    !allTopicsCompleted()
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

const overlay =
    document.createElement(
        "div"
    );

overlay.id =
    "studyMindCompletionCelebration";

overlay.style.cssText = `
    position:fixed;
    inset:0;
    z-index:99998;
    display:flex;
    align-items:center;
    justify-content:center;
    background:rgba(2,6,23,.82);
    backdrop-filter:blur(8px);
    padding:20px;
`;

overlay.innerHTML =
    `
    <div
        style="
            width:min(500px,100%);
            text-align:center;
            padding:36px 28px;
            border-radius:24px;
            background:rgba(15,23,42,.98);
            border:1px solid rgba(59,130,246,.4);
            box-shadow:
                0 0 40px rgba(59,130,246,.22),
                0 25px 80px rgba(0,0,0,.45);
            color:white;
        "
    >

        <div style="font-size:3rem;">
            🎉
        </div>

        <h2 style="margin:14px 0 8px;">
            Study Plan Complete!
        </h2>

        <p style="opacity:.75;line-height:1.6;">
            You completed every topic in
            <strong>
                ${escapeHTML(
                    planTitle(
                        studyPlan
                    )
                )}
            </strong>.
        </p>

        <button
            id="studyMindCelebrationClose"
            style="
                margin-top:18px;
                padding:12px 22px;
                border:0;
                border-radius:12px;
                cursor:pointer;
                font-weight:800;
            "
        >
            Continue
        </button>

    </div>
    `;

document.body.appendChild(
    overlay
);

const close =
    $("studyMindCelebrationClose");

if (close) {

    close.addEventListener(
        "click",
        () =>
            overlay.remove()
    );

}


}

/* =========================================================
KNOWLEDGE CHECK
========================================================= */

function openKnowledgeCheckPage(topic) {


if (!topic) {
    return;
}

const key =
    topicKey(topic);

const name =
    encodeURIComponent(
        topicName(topic)
    );

/*
   Store the selected topic for the
   knowledge-check page.
*/

localStorage.setItem(
    KNOWLEDGE_TOPIC_KEY,
    key
);

writeJSON(
    KNOWLEDGE_QUESTIONS_KEY,
    null
);

currentTopicIndex =
    allTopics.findIndex(
        item =>
            topicKey(item) ===
            key
    );

createStudySession(
    topic
);

saveDashboardState();

/*
   Compatible with the existing StudyMind
   knowledge-check page.
*/

window.location.href =
    "knowledge-check.html" +
    "?topic=" +
    encodeURIComponent(key) +
    "&name=" +
    name;


}

/* =========================================================
AI QUESTION LIMIT
========================================================= */

function getTodayString() {


return dateKey(
    new Date()
);


}

function getAIQuestionCount() {


const savedDate =
    localStorage.getItem(
        AI_DATE_KEY
    );

const today =
    getTodayString();

if (
    savedDate !== today
) {

    localStorage.setItem(
        AI_DATE_KEY,
        today
    );

    localStorage.setItem(
        AI_COUNT_KEY,
        "0"
    );

    return 0;

}

return Number(
    localStorage.getItem(
        AI_COUNT_KEY
    ) || 0
);


}

function getRemainingAIQuestions() {


return Math.max(
    0,
    FREE_AI_LIMIT -
    getAIQuestionCount()
);


}

function hasFreeAIQuestionsLeft() {


return (
    getRemainingAIQuestions() >
    0
);


}

function recordAIQuestion() {


const count =
    getAIQuestionCount() + 1;

localStorage.setItem(
    AI_DATE_KEY,
    getTodayString()
);

localStorage.setItem(
    AI_COUNT_KEY,
    String(count)
);

return count;


}

function showPremiumMessage() {


const message =
    document.createElement(
        "div"
    );

message.style.cssText = `
    position:fixed;
    left:50%;
    bottom:28px;
    transform:translateX(-50%);
    z-index:99999;
    width:min(430px,calc(100% - 30px));
    padding:20px;
    border-radius:18px;
    background:rgba(15,23,42,.97);
    border:1px solid rgba(59,130,246,.5);
    box-shadow:
        0 0 25px rgba(59,130,246,.25),
        0 20px 50px rgba(0,0,0,.4);
    color:white;
    text-align:center;
`;

message.innerHTML =
    `
    <strong style="font-size:1.05rem;">
        🔒 Free AI limit reached
    </strong>

    <p style="opacity:.75;line-height:1.6;">
        You have used all
        ${FREE_AI_LIMIT}
        free AI questions for today.
    </p>

    <div
        style="
            display:flex;
            gap:8px;
            justify-content:center;
            flex-wrap:wrap;
        "
    >

        <a
            href="premium.html"
            style="
                display:inline-block;
                padding:10px 18px;
                border-radius:10px;
                text-decoration:none;
                font-weight:800;
                background:#2563eb;
                color:white;
            "
        >
            Explore Premium
        </a>

        <button
            id="studyMindPremiumClose"
            style="
                padding:10px 18px;
                border:0;
                border-radius:10px;
                cursor:pointer;
                font-weight:700;
            "
        >
            Got it
        </button>

    </div>
    `;

document.body.appendChild(
    message
);

setTimeout(
    () => {

        if (
            message.isConnected
        ) {
            message.remove();
        }

    },
    6000
);

const close =
    $("studyMindPremiumClose");

if (close) {

    close.addEventListener(
        "click",
        () =>
            message.remove()
    );

}


}

/* =========================================================
THEME
========================================================= */

function applyTheme() {


const theme =
    localStorage.getItem(
        THEME_KEY
    ) ||
    "dark";

const light =
    theme === "light";

document.documentElement
    .classList
    .toggle(
        "light-mode",
        light
    );

document.documentElement
    .classList
    .toggle(
        "dark-mode",
        !light
    );

document.body
    ?.classList
    .toggle(
        "light-mode",
        light
    );

document.body
    ?.classList
    .toggle(
        "dark-mode",
        !light
    );

document.documentElement
    .style
    .colorScheme =
    light
        ? "light"
        : "dark";

updateThemeButton();


}

function toggleTheme() {


const current =
    localStorage.getItem(
        THEME_KEY
    ) ||
    "dark";

localStorage.setItem(
    THEME_KEY,
    current === "dark"
        ? "light"
        : "dark"
);

applyTheme();


}

function updateThemeButton() {


const button =
    $("themeButton");

if (!button) {
    return;
}

const light =
    document.body
        ?.classList
        .contains(
            "light-mode"
        );

button.textContent =
    light
        ? "🌙 Dark Mode"
        : "☀️ Light Mode";


}

/* =========================================================
MULTI-PLAN TABS
========================================================= */

function injectPlanTabs() {


injectCalendarCSS();

const heading =
    document.querySelector(
        ".dashboard-heading"
    );

if (!heading) {
    return;
}

let wrapper =
    $("studyMindPlanTabs");

if (!wrapper) {

    wrapper =
        document.createElement(
            "section"
        );

    wrapper.id =
        "studyMindPlanTabs";

    heading.insertAdjacentElement(
        "afterend",
        wrapper
    );

}

const plans =
    getSavedPlans();

if (
    plans.length === 0
) {

    wrapper.innerHTML =
        "";

    return;

}

wrapper.innerHTML =
    `
    <div
        class="studyMind-plan-tabs-header"
    >

        <div>

            <div
                class="studyMind-plan-tabs-title"
            >
                📚 My Study Plans
            </div>

            <div
                style="
                    opacity:.68;
                    font-size:.82rem;
                    margin-top:4px;
                "
            >
                Switch between your current and previous plans without losing progress.
            </div>

        </div>

        <a
            href="home.html#generator"
            class="studyMind-new-plan-tab"
        >
            ＋ New Study Plan
        </a>

    </div>

    <div
        class="studyMind-plan-tab-list"
    >

        ${
            plans
                .map(
                    record => {

                        const plan =
                            normalizePlan(
                                record.plan
                            );

                        const topics =
                            Array.isArray(
                                plan?.topics
                            )
                                ? plan.topics
                                : [];

                        const completed =
                            topics.filter(
                                topic =>
                                    Array.isArray(
                                        record.completedTopics
                                    ) &&
                                    (
                                        record.completedTopics.includes(
                                            topicKey(
                                                topic
                                            )
                                        ) ||
                                        record.completedTopics.includes(
                                            topic.id
                                        )
                                    )
                            ).length;

                        const percentage =
                            topics.length
                                ? Math.round(
                                    (
                                        completed /
                                        topics.length
                                    ) *
                                    100
                                )
                                : 0;

                        const active =
                            record.id ===
                            activePlanId;

                        const exam =
                            clean(
                                plan?.examDate
                            );

                        return `
                            <button
                                type="button"
                                class="studyMind-plan-tab ${active ? "active" : ""}"
                                data-plan-id="${escapeHTML(
                                    record.id
                                )}"
                            >

                                <span
                                    class="studyMind-plan-tab-title"
                                >
                                    ${active ? "✓ " : ""}
                                    ${escapeHTML(
                                        record.title ||
                                        planTitle(
                                            plan
                                        )
                                    )}
                                </span>

                                <span
                                    class="studyMind-plan-tab-meta"
                                >
                                    ${topics.length}
                                    topic${topics.length === 1 ? "" : "s"}
                                    ${
                                        exam
                                            ? ` • Exam ${escapeHTML(exam)}`
                                            : ""
                                    }
                                </span>

                                <div
                                    class="studyMind-plan-tab-progress"
                                >
                                    <span
                                        style="width:${percentage}%"
                                    ></span>
                                </div>

                                <span
                                    class="studyMind-plan-tab-open"
                                >
                                    ${active ? "ACTIVE PLAN" : "Open Plan"}
                                    • ${percentage}% complete
                                </span>

                            </button>
                        `;

                    }
                )
                .join("")
        }

    </div>
    `;

wrapper
    .querySelectorAll(
        "[data-plan-id]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        button.dataset
                            .planId;

                    if (
                        !id ||
                        id ===
                        activePlanId
                    ) {
                        return;
                    }

                    switchStudyPlan(
                        id
                    );

                }
            );

        }
    );


}

function switchStudyPlan(planId) {


if (
    !planId ||
    planId === activePlanId
) {
    return;
}

const plans =
    getSavedPlans();

const target =
    plans.find(
        record =>
            record.id ===
            planId
    );

if (!target) {

    alert(
        "That study plan could not be found."
    );

    return;

}

/*
   Save current plan before switching.
*/

saveCurrentReading();

stopTimer();

saveDashboardState();

/*
   Switch active plan.
*/

setActivePlanId(
    planId
);

/*
   Load selected plan.
*/

if (
    !loadActivePlan()
) {

    alert(
        "This study plan could not be loaded."
    );

    return;

}

calendarDate =
    getStudyStartDate();

startReadingPersistence();

renderAll();


}

/* =========================================================
CALENDAR NAVIGATION
========================================================= */

function previousMonth() {


calendarDate =
    new Date(
        calendarDate.getFullYear(),
        calendarDate.getMonth() - 1,
        1
    );

renderCalendar();


}

function nextMonth() {


calendarDate =
    new Date(
        calendarDate.getFullYear(),
        calendarDate.getMonth() + 1,
        1
    );

renderCalendar();


}

/* =========================================================
AUTHENTICATION
========================================================= */

async function checkAuthentication() {


/*
   The dashboard remains usable if Supabase is temporarily
   unavailable. If the client exists, however, use it.
*/

try {

    if (
        typeof supabase ===
        "undefined"
    ) {

        return null;

    }

    if (
        !supabase ||
        typeof supabase.auth?.getSession !==
        "function"
    ) {

        return null;

    }

    const result =
        await supabase.auth.getSession();

    const session =
        result?.data?.session;

    if (
        session?.user
    ) {

        currentUser =
            session.user;

    }

    return session || null;

} catch (error) {

    console.warn(
        "StudyMind: Authentication check failed.",
        error
    );

    return null;

}


}

async function logoutStudyMind() {


try {

    if (
        typeof supabase !==
        "undefined" &&
        supabase?.auth?.signOut
    ) {

        await supabase.auth.signOut();

    }

} catch (error) {

    console.warn(
        "StudyMind: Logout error",
        error
    );

}

window.location.href =
    "index.html";


}

/* =========================================================
EVENT CONNECTIONS
========================================================= */

function bindEvents() {


const checkbox =
    $("topicCompleteCheckbox");

if (
    checkbox &&
    checkbox.dataset.connected !==
    "true"
) {

    checkbox.dataset.connected =
        "true";

    checkbox.addEventListener(
        "change",
        () => {

            if (
                checkbox.checked
            ) {

                completeCurrentTopic();

            }

        }
    );

}


const start =
    $("startTimerButton");

if (
    start &&
    start.dataset.connected !==
    "true"
) {

    start.dataset.connected =
        "true";

    start.addEventListener(
        "click",
        startTimer
    );

}


const pause =
    $("pauseTimerButton");

if (
    pause &&
    pause.dataset.connected !==
    "true"
) {

    pause.dataset.connected =
        "true";

    pause.addEventListener(
        "click",
        pauseTimer
    );

}


const reset =
    $("resetTimerButton");

if (
    reset &&
    reset.dataset.connected !==
    "true"
) {

    reset.dataset.connected =
        "true";

    reset.addEventListener(
        "click",
        resetTimer
    );

}


const duration =
    $("timerDuration");

if (
    duration &&
    duration.dataset.connected !==
    "true"
) {

    duration.dataset.connected =
        "true";

    duration.addEventListener(
        "change",
        () =>
            changeTimerDuration(
                duration.value
            )
    );

}


const previous =
    $("previousMonth");

if (
    previous &&
    previous.dataset.connected !==
    "true"
) {

    previous.dataset.connected =
        "true";

    previous.addEventListener(
        "click",
        previousMonth
    );

}


const next =
    $("nextMonth");

if (
    next &&
    next.dataset.connected !==
    "true"
) {

    next.dataset.connected =
        "true";

    next.addEventListener(
        "click",
        nextMonth
    );

}


const theme =
    $("themeButton");

if (
    theme &&
    theme.dataset.connected !==
    "true"
) {

    theme.dataset.connected =
        "true";

    theme.addEventListener(
        "click",
        event => {

            event.preventDefault();

            toggleTheme();

        }
    );

}


const challenge =
    $("dailyChallengeButton");

if (
    challenge &&
    challenge.dataset.connected !==
    "true"
) {

    challenge.dataset.connected =
        "true";

    challenge.addEventListener(
        "click",
        () => {

            const topic =
                getDailyChallengeTopic();

            if (!topic) {
                return;
            }

            currentTopicIndex =
                allTopics.findIndex(
                    item =>
                        topicKey(item) ===
                        topicKey(topic)
                );

            createStudySession(
                topic
            );

            saveDashboardState();

            renderAll();

            const section =
                $("currentTopicSection");

            if (section) {

                section.scrollIntoView(
                    {
                        behavior:
                            "smooth",
                        block:
                            "start"
                    }
                );

            }

        }
    );

}


/*
   Compatibility with the existing local
   knowledge-check section.
*/

const submitQuestions =
    $("submitTopicQuestions");

if (
    submitQuestions &&
    submitQuestions.dataset.connected !==
    "true"
) {

    submitQuestions.dataset.connected =
        "true";

    submitQuestions.addEventListener(
        "click",
        () => {

            const topic =
                getCurrentTopic();

            if (topic) {

                openKnowledgeCheckPage(
                    topic
                );

            }

        }
    );

}


/*
   Preserve navigation to Study Score if the card exists.
*/

const scoreCard =
    $("studyScoreCard");

if (scoreCard) {

    scoreCard.style.cursor =
        "pointer";

    if (
        scoreCard.dataset.connected !==
        "true"
    ) {

        scoreCard.dataset.connected =
            "true";

        scoreCard.addEventListener(
            "click",
            () => {

                window.location.href =
                    "study-score.html";

            }
        );

    }

}


/*
   Save before leaving the page.
*/

if (
    !window.__studyMindBeforeUnloadConnected
) {

    window.__studyMindBeforeUnloadConnected =
        true;

    window.addEventListener(
        "beforeunload",
        () => {

            saveCurrentReading();

            if (
                timerRunning
            ) {

                pauseTimer();

            } else {

                saveDashboardState();

            }

        }
    );

}


}

/* =========================================================
RENDER EVERYTHING
========================================================= */

function renderAll() {


if (!studyPlan) {
    return;
}

renderStats();

renderCurrentTopic();

renderTopics();

renderSubjects();

renderProgress();

renderCalendar();

renderSchedule();

renderDailyChallenge();

updateTimerDisplay();

injectPlanTabs();


}

/* =========================================================
DASHBOARD OPEN
========================================================= */

function openDashboard() {


window.location.href =
    "dashboard.html";


}

/* =========================================================
INITIALIZE
========================================================= */

async function initializeDashboard() {


if (
    dashboardInitialized
) {
    return;
}

dashboardInitialized =
    true;

/*
   Theme first.
*/

applyTheme();

/*
   Calendar styles.
*/

injectCalendarCSS();

/*
   Load the active plan BEFORE rendering anything.

   This is important.
   Nothing below is allowed to create a replacement
   plan before this happens.
*/

if (
    !loadActivePlan()
) {

    renderAll();

    console.warn(
        "StudyMind: No study plan found."
    );

    return;

}

/*
   Authentication.
*/

await checkAuthentication();

/*
   Calendar starts at the active plan's study month.
*/

calendarDate =
    getStudyStartDate();

/*
   Timer select.
*/

const timerDuration =
    $("timerDuration");

if (timerDuration) {

    const minutes =
        selectedTimerSeconds /
        60;

    if (
        TIMER_OPTIONS.includes(
            minutes
        )
    ) {

        timerDuration.value =
            String(minutes);

    } else {

        timerDuration.value =
            "25";

        selectedTimerSeconds =
            DEFAULT_TIMER_SECONDS;

    }

}

/*
   Make sure timer is valid.
*/

if (
    !Number.isFinite(
        timerSeconds
    ) ||
    timerSeconds <= 0
) {

    timerSeconds =
        selectedTimerSeconds;

}

bindEvents();

renderAll();

startReadingPersistence();

/*
   Delayed restore for layouts whose content
   becomes available after the initial render.
*/

setTimeout(
    () => {

        restoreCurrentReading();

        renderCalendar();

        renderAll();

    },
    750
);

/*
   Periodic state save.
*/

if (
    stateSaveInterval
) {

    clearInterval(
        stateSaveInterval
    );

}

stateSaveInterval =
    setInterval(
        () => {

            saveCurrentReading();

            saveDashboardState();

        },
        5000
    );

/*
   Completion celebration.
*/

if (
    allTopicsCompleted()
) {

    setTimeout(
        maybeShowCompletionCelebration,
        900
    );

}


}

/* =========================================================
GLOBAL FUNCTIONS
========================================================= */

window.openDashboard =
openDashboard;

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
getAIQuestionCount;

window.getRemainingAIQuestions =
getRemainingAIQuestions;

window.hasFreeAIQuestionsLeft =
hasFreeAIQuestionsLeft;

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

window.switchStudyPlan =
switchStudyPlan;

window.getSavedStudyPlans =
getSavedPlans;

window.getActiveStudyPlanId =
getActivePlanId;

window.syncActivePlanRecord =
syncActivePlanRecord;

/* =========================================================
START
========================================================= */

if (
document.readyState ===
"loading"
) {


document.addEventListener(
    "DOMContentLoaded",
    initializeDashboard,
    {
        once: true
    }
);


} else {


initializeDashboard();


}
