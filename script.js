/* =========================================================
   STUDYMIND AI — HOME / STUDY PLAN GENERATOR
   COMPLETE REPLACEMENT

   FEATURES:
   - Create My Study Plan button
   - Subject → Topic fields
   - Generate My Plan
   - Topic difficulty
   - Study plan localStorage
   - MULTIPLE SAVED STUDY PLANS
   - ACTIVE PLAN SYSTEM
   - Previous plans are preserved
   - Current reading/session is preserved when archiving
   - Dashboard redirect
   - Light / Dark mode
   - No duplicate theme systems
   - No undefined functions
   - Preserves subject order
========================================================= */

"use strict";


/* =========================================================
   STORAGE
========================================================= */

const PLAN_KEY =
    "studyMindPlan";

const COMPATIBILITY_PLAN_KEY =
    "studyData";

/* ---------------------------------------------------------
   MULTI-PLAN STORAGE
--------------------------------------------------------- */

const PLANS_KEY =
    "studyMindPlans";

const ACTIVE_PLAN_KEY =
    "studyMindActivePlanId";


const COMPLETED_TOPICS_KEY =
    "studyMindCompletedTopics";

const COMPLETED_QUESTIONS_KEY =
    "studyMindCompletedQuestionTopics";

const CURRENT_TOPIC_KEY =
    "studyMindCurrentTopicIndex";

const KNOWLEDGE_TOPIC_KEY =
    "studyMindKnowledgeCheckTopic";

const KNOWLEDGE_QUESTIONS_KEY =
    "studyMindTopicQuestions";

const THEME_KEY =
    "studyMindTheme";

const CELEBRATION_KEY =
    "studyMindCompletionCelebrationShown";

const STUDY_SESSION_KEY =
    "studyMindCurrentStudySession";

const STUDY_READINGS_KEY =
    "studyMindTopicReadings";

const TIMER_SECONDS_KEY =
    "studyMindTimerSeconds";

const TIMER_DURATION_KEY =
    "studyMindSelectedTimerSeconds";


/* =========================================================
   SHORTCUT
========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   BASIC HELPERS
========================================================= */

function cleanText(value) {

    return String(value ?? "")
        .replace(/\s+/g, " ")
        .trim();

}


function slugify(value) {

    return cleanText(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);

}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function readJSON(key, fallback = null) {

    try {

        const raw =
            localStorage.getItem(key);

        if (!raw) {
            return fallback;
        }

        return JSON.parse(raw);

    } catch (error) {

        console.warn(
            `Could not read localStorage key "${key}".`,
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

        console.error(
            `Could not save localStorage key "${key}".`,
            error
        );

        return false;

    }

}


function formatTime(hour) {

    hour =
        Number(hour) % 24;

    const period =
        hour >= 12
            ? "PM"
            : "AM";

    let displayHour =
        hour % 12;

    if (displayHour === 0) {
        displayHour = 12;
    }

    return `${displayHour}:00 ${period}`;

}


/* =========================================================
   MULTI-PLAN HELPERS
========================================================= */

/*
   Every generated study plan receives its own permanent ID.

   Example:
   plan-1756981234567-a8k3p
*/

function createPlanId() {

    return (
        "plan-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .slice(2, 8)
    );

}


/* ---------------------------------------------------------
   GET ALL SAVED PLANS
--------------------------------------------------------- */

function getSavedPlans() {

    const plans =
        readJSON(
            PLANS_KEY,
            []
        );

    if (!Array.isArray(plans)) {
        return [];
    }

    return plans;

}


/* ---------------------------------------------------------
   SAVE ALL SAVED PLANS
--------------------------------------------------------- */

function saveSavedPlans(plans) {

    return writeJSON(
        PLANS_KEY,
        Array.isArray(plans)
            ? plans
            : []
    );

}


/* ---------------------------------------------------------
   GET ACTIVE PLAN ID
--------------------------------------------------------- */

function getActivePlanId() {

    return localStorage.getItem(
        ACTIVE_PLAN_KEY
    ) || null;

}


/* ---------------------------------------------------------
   SET ACTIVE PLAN ID
--------------------------------------------------------- */

function setActivePlanId(planId) {

    if (!planId) {

        localStorage.removeItem(
            ACTIVE_PLAN_KEY
        );

        return;

    }

    localStorage.setItem(
        ACTIVE_PLAN_KEY,
        planId
    );

}


/* ---------------------------------------------------------
   CAPTURE CURRENT PLAN STATE
---------------------------------------------------------

   This is extremely important.

   Before a new plan is created, we take the current plan
   and everything associated with it and put it inside its
   own saved-plan record.

--------------------------------------------------------- */

function captureCurrentPlanState() {

    const currentPlan =
        readJSON(
            PLAN_KEY,
            null
        );


    if (!currentPlan) {
        return null;
    }


    const activePlanId =
        getActivePlanId();


    const completedTopics =
        readJSON(
            COMPLETED_TOPICS_KEY,
            []
        );


    const completedQuestions =
        readJSON(
            COMPLETED_QUESTIONS_KEY,
            []
        );


    const currentTopicIndex =
        Number(
            localStorage.getItem(
                CURRENT_TOPIC_KEY
            ) || 0
        );


    const knowledgeTopic =
        readJSON(
            KNOWLEDGE_TOPIC_KEY,
            null
        );


    const knowledgeQuestions =
        readJSON(
            KNOWLEDGE_QUESTIONS_KEY,
            null
        );


    const celebrationShown =
        localStorage.getItem(
            CELEBRATION_KEY
        ) === "true";


    const studySession =
        readJSON(
            STUDY_SESSION_KEY,
            null
        );


    const topicReadings =
        readJSON(
            STUDY_READINGS_KEY,
            {}
        );


    const timerSeconds =
        Number(
            localStorage.getItem(
                TIMER_SECONDS_KEY
            ) || 0
        );


    const timerDuration =
        Number(
            localStorage.getItem(
                TIMER_DURATION_KEY
            ) || 0
        );


    return {

        id:
            activePlanId ||
            createPlanId(),

        plan:
            currentPlan,

        completedTopics:
            Array.isArray(completedTopics)
                ? completedTopics
                : [],

        completedQuestionTopics:
            Array.isArray(completedQuestions)
                ? completedQuestions
                : [],

        currentTopicIndex:
            Number.isFinite(
                currentTopicIndex
            )
                ? currentTopicIndex
                : 0,

        knowledgeTopic,

        knowledgeQuestions,

        celebrationShown,

        studySession,

        topicReadings:
            topicReadings &&
            typeof topicReadings === "object"
                ? topicReadings
                : {},

        timerSeconds,

        timerDuration,

        createdAt:
            currentPlan.createdAt ||
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString(),

        title:
            getPlanDisplayTitle(
                currentPlan
            )

    };

}


/* ---------------------------------------------------------
   PLAN DISPLAY TITLE
--------------------------------------------------------- */

function getPlanDisplayTitle(plan) {

    if (!plan) {
        return "Study Plan";
    }


    const subjectNames =
        Array.isArray(
            plan.subjectNames
        )
            ? plan.subjectNames
            : [];


    if (
        subjectNames.length > 0
    ) {

        if (subjectNames.length === 1) {

            return (
                subjectNames[0] +
                " Study Plan"
            );

        }


        return (
            subjectNames
                .slice(0, 2)
                .join(" + ") +
            (
                subjectNames.length > 2
                    ? " + More"
                    : ""
            ) +
            " Study Plan"
        );

    }


    if (plan.curriculum) {

        return (
            cleanText(
                plan.curriculum
            ) +
            " Study Plan"
        );

    }


    return "Study Plan";

}


/* ---------------------------------------------------------
   ARCHIVE CURRENT PLAN
---------------------------------------------------------

   The old plan is NOT deleted.

   It gets added to studyMindPlans.

--------------------------------------------------------- */

function archiveCurrentPlan() {

    const currentPlanState =
        captureCurrentPlanState();


    if (!currentPlanState) {
        return null;
    }


    const plans =
        getSavedPlans();


    const existingIndex =
        plans.findIndex(
            savedPlan =>
                savedPlan &&
                savedPlan.id ===
                    currentPlanState.id
        );


    if (
        existingIndex >= 0
    ) {

        plans[
            existingIndex
        ] =
            currentPlanState;

    } else {

        plans.unshift(
            currentPlanState
        );

    }


    saveSavedPlans(
        plans
    );


    return currentPlanState;

}


/* ---------------------------------------------------------
   CREATE NEW PLAN RECORD
--------------------------------------------------------- */

function createNewPlanRecord(
    studyData
) {

    const newPlanId =
        createPlanId();


    const newRecord = {

        id:
            newPlanId,

        plan:
            studyData,

        completedTopics:
            [],

        completedQuestionTopics:
            [],

        currentTopicIndex:
            0,

        knowledgeTopic:
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
            0,

        timerDuration:
            0,

        createdAt:
            studyData.createdAt ||
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString(),

        title:
            getPlanDisplayTitle(
                studyData
            )

    };


    return newRecord;

}


/* ---------------------------------------------------------
   SAVE NEW PLAN TO MULTI-PLAN STORAGE
--------------------------------------------------------- */

function saveNewPlanRecord(
    newRecord
) {

    const plans =
        getSavedPlans();


    plans.unshift(
        newRecord
    );


    const saved =
        saveSavedPlans(
            plans
        );


    if (!saved) {
        return false;
    }


    setActivePlanId(
        newRecord.id
    );


    return true;

}


/* ---------------------------------------------------------
   RESET ONLY THE ACTIVE/NEW PLAN STATE
--------------------------------------------------------- */

function resetForNewPlan() {

    localStorage.removeItem(
        COMPLETED_TOPICS_KEY
    );

    localStorage.removeItem(
        COMPLETED_QUESTIONS_KEY
    );

    localStorage.removeItem(
        CURRENT_TOPIC_KEY
    );

    localStorage.removeItem(
        KNOWLEDGE_TOPIC_KEY
    );

    localStorage.removeItem(
        KNOWLEDGE_QUESTIONS_KEY
    );

    localStorage.removeItem(
        CELEBRATION_KEY
    );

    localStorage.removeItem(
        STUDY_SESSION_KEY
    );

    localStorage.removeItem(
        STUDY_READINGS_KEY
    );

    localStorage.removeItem(
        TIMER_SECONDS_KEY
    );

    localStorage.removeItem(
        TIMER_DURATION_KEY
    );

}


/* ---------------------------------------------------------
   ENSURE LEGACY PLAN IS MIGRATED
---------------------------------------------------------

   If an older version of StudyMind already has a plan in
   studyMindPlan but no multi-plan record exists, preserve it.

--------------------------------------------------------- */

function migrateLegacyPlanIfNeeded() {

    const existingPlan =
        readJSON(
            PLAN_KEY,
            null
        );


    if (!existingPlan) {
        return;
    }


    const plans =
        getSavedPlans();


    if (plans.length > 0) {

        const activeId =
            getActivePlanId();


        if (
            activeId &&
            plans.some(
                plan =>
                    plan &&
                    plan.id === activeId
            )
        ) {

            return;

        }


        /*
           There are saved plans but no valid active ID.
           Create an active record around the existing plan.
        */

        const migrated =
            createNewPlanRecord(
                existingPlan
            );


        const saved =
            saveNewPlanRecord(
                migrated
            );


        if (saved) {

            /*
               Preserve existing progress rather than resetting it.
            */

            const completedTopics =
                readJSON(
                    COMPLETED_TOPICS_KEY,
                    []
                );

            const completedQuestions =
                readJSON(
                    COMPLETED_QUESTIONS_KEY,
                    []
                );

            const currentIndex =
                Number(
                    localStorage.getItem(
                        CURRENT_TOPIC_KEY
                    ) || 0
                );


            migrated.completedTopics =
                Array.isArray(
                    completedTopics
                )
                    ? completedTopics
                    : [];


            migrated.completedQuestionTopics =
                Array.isArray(
                    completedQuestions
                )
                    ? completedQuestions
                    : [];


            migrated.currentTopicIndex =
                Number.isFinite(
                    currentIndex
                )
                    ? currentIndex
                    : 0;


            const allPlans =
                getSavedPlans();


            const index =
                allPlans.findIndex(
                    plan =>
                        plan.id ===
                        migrated.id
                );


            if (index >= 0) {

                allPlans[index] =
                    migrated;

                saveSavedPlans(
                    allPlans
                );

            }

        }

        return;

    }


    /*
       No multi-plan storage exists yet.

       Migrate the existing plan into the new system.
    */

    const migrated =
        createNewPlanRecord(
            existingPlan
        );


    migrated.completedTopics =
        readJSON(
            COMPLETED_TOPICS_KEY,
            []
        );


    migrated.completedQuestionTopics =
        readJSON(
            COMPLETED_QUESTIONS_KEY,
            []
        );


    migrated.currentTopicIndex =
        Number(
            localStorage.getItem(
                CURRENT_TOPIC_KEY
            ) || 0
        );


    migrated.knowledgeTopic =
        readJSON(
            KNOWLEDGE_TOPIC_KEY,
            null
        );


    migrated.knowledgeQuestions =
        readJSON(
            KNOWLEDGE_QUESTIONS_KEY,
            null
        );


    migrated.studySession =
        readJSON(
            STUDY_SESSION_KEY,
            null
        );


    migrated.topicReadings =
        readJSON(
            STUDY_READINGS_KEY,
            {}
        );


    migrated.celebrationShown =
        localStorage.getItem(
            CELEBRATION_KEY
        ) === "true";


    migrated.timerSeconds =
        Number(
            localStorage.getItem(
                TIMER_SECONDS_KEY
            ) || 0
        );


    migrated.timerDuration =
        Number(
            localStorage.getItem(
                TIMER_DURATION_KEY
            ) || 0
        );


    migrated.updatedAt =
        new Date().toISOString();


    saveNewPlanRecord(
        migrated
    );

}


/* =========================================================
   GET SUBJECT NAMES
========================================================= */

function getSubjectNames() {

    const input =
        $("subjects");

    if (!input) {
        return [];
    }

    return [
        ...new Set(
            input.value
                .split(/[,;\n]+/)
                .map(cleanText)
                .filter(Boolean)
        )
    ];

}


/* =========================================================
   SAVE CURRENT TOPIC TEXT
========================================================= */

function getExistingTopicValues() {

    const container =
        $("subjectTopicFields");

    const values = {};

    if (!container) {
        return values;
    }

    container
        .querySelectorAll(
            ".subject-topic-card"
        )
        .forEach(card => {

            const subject =
                cleanText(
                    card.dataset.subject
                );

            const textarea =
                card.querySelector(
                    ".subject-topic-input"
                );

            if (
                subject &&
                textarea
            ) {

                values[subject] =
                    textarea.value;

            }

        });

    return values;

}


/* =========================================================
   DYNAMIC SUBJECT → TOPIC FIELDS
========================================================= */

function renderSubjectTopicFields() {

    const container =
        $("subjectTopicFields");

    if (!container) {
        return;
    }

    const subjects =
        getSubjectNames();

    const oldValues =
        getExistingTopicValues();


    if (subjects.length === 0) {

        container.innerHTML = `

            <div class="subject-topic-empty">

                Enter your subjects above and
                separate topic spaces will appear here.

            </div>

        `;

        syncLegacyTopicsField();

        return;

    }


    container.innerHTML =

        subjects
            .map(subject => {

                const existing =
                    oldValues[subject] || "";

                return `

                    <div
                        class="subject-topic-card"
                        data-subject="${escapeHTML(subject)}"
                    >

                        <h3>
                            📚 ${escapeHTML(subject)}
                        </h3>

                        <p
                            style="
                                margin-top:0;
                                opacity:.72;
                            "
                        >
                            Enter the topics you want to
                            study for ${escapeHTML(subject)}.
                        </p>

                        <textarea
                            class="subject-topic-input"
                            data-subject="${escapeHTML(subject)}"
                            rows="6"
                            placeholder="Topic 1
Topic 2
Topic 3"
                            aria-label="Topics for ${escapeHTML(subject)}"
                        >${escapeHTML(existing)}</textarea>

                        <small>
                            One topic per line,
                            or separate topics with commas.
                        </small>

                    </div>

                `;

            })
            .join("");


    syncLegacyTopicsField();

}


/* =========================================================
   COLLECT SUBJECT + TOPICS
========================================================= */

function collectSubjectTopicData() {

    const container =
        $("subjectTopicFields");

    if (!container) {
        return [];
    }

    return [
        ...container.querySelectorAll(
            ".subject-topic-card"
        )
    ]

        .map((card, subjectIndex) => {

            const subject =
                cleanText(
                    card.dataset.subject
                );

            const textarea =
                card.querySelector(
                    ".subject-topic-input"
                );

            const rawTopics =
                textarea
                    ? textarea.value
                        .split(/[\n,;]+/)
                        .map(cleanText)
                        .filter(Boolean)
                    : [];

            const uniqueTopics =
                [
                    ...new Set(rawTopics)
                ];

            return {

                id:
                    `subject-${subjectIndex + 1}-${slugify(subject)}`,

                name:
                    subject,

                topics:
                    uniqueTopics.map(
                        (name, topicIndex) => ({

                            id:
                                `topic-${subjectIndex + 1}-${topicIndex + 1}-${slugify(name)}`,

                            name,

                            subject,

                            description:
                                `Study ${name} for ${subject} and complete the knowledge check.`

                        })
                    )

            };

        })

        .filter(
            subject =>
                subject.name
        );

}


/* =========================================================
   SYNC LEGACY TOPICS FIELD
========================================================= */

function syncLegacyTopicsField() {

    const hidden =
        $("topics");

    if (!hidden) {
        return;
    }

    const subjectData =
        collectSubjectTopicData();

    hidden.value =

        subjectData
            .map(subject => {

                return `${subject.name}: ${subject.topics
                    .map(topic => topic.name)
                    .join(", ")}`;

            })
            .join("\n");

}


/* =========================================================
   VALIDATE SUBJECTS + TOPICS
========================================================= */

function validateSubjectTopics(
    subjectData
) {

    if (
        subjectData.length === 0
    ) {

        alert(
            "Please enter at least one subject."
        );

        return false;

    }


    const missingTopics =
        subjectData.filter(
            subject =>
                subject.topics.length === 0
        );


    if (
        missingTopics.length > 0
    ) {

        alert(
            `Please enter at least one topic for: ${
                missingTopics
                    .map(
                        subject =>
                            subject.name
                    )
                    .join(", ")
            }.`
        );

        return false;

    }


    return true;

}


/* =========================================================
   RENDER TOPIC DIFFICULTY
========================================================= */

function renderDifficultyFields(
    subjectData
) {

    const section =
        $("difficultySection");

    if (!section) {
        return;
    }


    section.innerHTML = `

        <div
            style="
                margin-top:18px;
                padding:20px;
                border-radius:18px;
                border:1px solid rgba(127,127,127,.2);
            "
        >

            <h3 style="margin-top:0;">
                🎯 Topic Difficulty
            </h3>

            <p style="opacity:.72;">
                Tell StudyMind AI which topics
                need the most attention.
            </p>

            ${subjectData
                .map(subject => `

                    <div
                        style="
                            margin-top:18px;
                        "
                    >

                        <h4>
                            ${escapeHTML(
                                subject.name
                            )}
                        </h4>

                        ${subject.topics
                            .map(topic => `

                                <div
                                    class="topic-difficulty-row"
                                >

                                    <span>
                                        ${escapeHTML(
                                            topic.name
                                        )}
                                    </span>

                                    <select
                                        class="topic-level"
                                        data-subject="${escapeHTML(
                                            subject.name
                                        )}"
                                        data-topic="${escapeHTML(
                                            topic.name
                                        )}"
                                    >

                                        <option value="strong">
                                            Strong
                                        </option>

                                        <option
                                            value="okay"
                                            selected
                                        >
                                            Okay
                                        </option>

                                        <option value="weak">
                                            Weak
                                        </option>

                                    </select>

                                </div>

                            `)
                            .join("")}

                    </div>

                `)
                .join("")}

        </div>

    `;

}


/* =========================================================
   COLLECT DIFFICULTY
========================================================= */

function collectDifficultyData() {

    const topicDifficulty = {};
    const topicPriority = {};


    document
        .querySelectorAll(
            ".topic-level"
        )
        .forEach(select => {

            const subject =
                cleanText(
                    select.dataset.subject
                );

            const topic =
                cleanText(
                    select.dataset.topic
                );

            const difficulty =
                select.value ||
                "okay";


            if (
                !topicDifficulty[subject]
            ) {

                topicDifficulty[subject] =
                    {};

            }


            if (
                !topicPriority[subject]
            ) {

                topicPriority[subject] =
                    {};

            }


            topicDifficulty[subject][topic] =
                difficulty;


            topicPriority[subject][topic] =

                difficulty === "weak"
                    ? 3
                    : difficulty === "okay"
                        ? 2
                        : 1;

        });


    return {

        topicDifficulty,

        topicPriority

    };

}


/* =========================================================
   GENERATE TIMETABLE
========================================================= */

function generateTimetable(
    subjectNames,
    hoursPerDay,
    startHour
) {

    const timetableData = [];


    for (
        let hourIndex = 0;
        hourIndex < hoursPerDay;
        hourIndex++
    ) {

        const row = [

            `${formatTime(
                startHour + hourIndex
            )} - ${formatTime(
                startHour + hourIndex + 1
            )}`

        ];


        for (
            let dayIndex = 0;
            dayIndex < 7;
            dayIndex++
        ) {

            row.push(

                subjectNames[
                    (
                        dayIndex +
                        hourIndex
                    ) %
                    subjectNames.length
                ]

            );

        }


        timetableData.push(
            row
        );

    }


    return timetableData;

}


/* =========================================================
   GENERATE STUDY PLAN
========================================================= */

function generateStudyPlan(
    event
) {

    if (event) {
        event.preventDefault();
    }


    const curriculum =
        cleanText(
            $("curriculum")?.value
        ) ||
        "Nigerian Senior Secondary Curriculum";


    const examDate =
        $("examDate")?.value ||
        "";


    const hoursPerDay =
        Number(
            $("hoursPerDay")?.value ||
            0
        );


    const startTime =
        $("startTime")?.value ||
        "16:00";


    const difficulty =
        $("difficulty")?.value ||
        "balanced";


    /* -----------------------------------------------------
       BASIC VALIDATION
    ----------------------------------------------------- */

    if (!examDate) {

        alert(
            "Please select your exam date."
        );

        return;

    }


    if (hoursPerDay <= 0) {

        alert(
            "Please select your available study hours."
        );

        return;

    }


    /* -----------------------------------------------------
       DATE VALIDATION
    ----------------------------------------------------- */

    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    const exam =
        new Date(
            `${examDate}T00:00:00`
        );


    exam.setHours(
        0,
        0,
        0,
        0
    );


    if (
        Number.isNaN(
            exam.getTime()
        )
    ) {

        alert(
            "Please enter a valid exam date."
        );

        return;

    }


    if (
        exam < today
    ) {

        alert(
            "The exam date has already passed. Please choose a future date."
        );

        return;

    }


    const daysLeft =
        Math.max(
            0,
            Math.ceil(
                (
                    exam.getTime() -
                    today.getTime()
                ) /
                86400000
            )
        );


    /* -----------------------------------------------------
       SUBJECT + TOPICS
    ----------------------------------------------------- */

    syncLegacyTopicsField();


    const subjectData =
        collectSubjectTopicData();


    if (
        !validateSubjectTopics(
            subjectData
        )
    ) {

        return;

    }


    /* -----------------------------------------------------
       DIFFICULTY
    ----------------------------------------------------- */

    renderDifficultyFields(
        subjectData
    );


    const {
        topicDifficulty,
        topicPriority
    } =
        collectDifficultyData();


    /* -----------------------------------------------------
       TOPICS
    ----------------------------------------------------- */

    const allTopics =
        subjectData.flatMap(
            subject =>
                subject.topics
        );


    const subjectNames =
        subjectData.map(
            subject =>
                subject.name
        );


    /* -----------------------------------------------------
       TODAY
    ----------------------------------------------------- */

    const dayNames = [

        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"

    ];


    const todayName =
        dayNames[
            new Date().getDay()
        ];


    const todaySubject =
        subjectNames[
            new Date().getDay() %
            subjectNames.length
        ];


    /* -----------------------------------------------------
       START TIME
    ----------------------------------------------------- */

    const startHour =
        Number(
            startTime.split(":")[0]
        ) || 16;


    /* -----------------------------------------------------
       URGENCY
    ----------------------------------------------------- */

    let urgency;


    if (
        daysLeft > 90
    ) {

        urgency =
            "🟢 You have plenty of time. Focus on learning new concepts.";

    } else if (
        daysLeft > 30
    ) {

        urgency =
            "🟡 Your exam is getting closer. Start practicing regularly.";

    } else if (
        daysLeft > 7
    ) {

        urgency =
            "🟠 Your exam is close. Increase revision and practice.";

    } else {

        urgency =
            "🔴 Your exam is just around the corner! Focus on revision and practice.";

    }


    /* -----------------------------------------------------
       TIMETABLE
    ----------------------------------------------------- */

    const timetableData =
        generateTimetable(
            subjectNames,
            hoursPerDay,
            startHour
        );


    /* =====================================================
       IMPORTANT:
       ARCHIVE THE OLD PLAN BEFORE CREATING THE NEW ONE
    ===================================================== */

    const oldPlan =
        readJSON(
            PLAN_KEY,
            null
        );


    if (oldPlan) {

        /*
           If this is the first time multi-plan storage
           is being used, migrate the current plan first.
        */

        const existingPlans =
            getSavedPlans();


        const activeId =
            getActivePlanId();


        let alreadyArchived =
            false;


        if (
            activeId &&
            existingPlans.some(
                savedPlan =>
                    savedPlan &&
                    savedPlan.id === activeId
            )
        ) {

            alreadyArchived =
                true;

        }


        if (!alreadyArchived) {

            archiveCurrentPlan();

        } else {

            /*
               Update the active saved record with the
               latest progress before switching away.
            */

            archiveCurrentPlan();

        }

    }


    /* -----------------------------------------------------
       COMPLETE NEW PLAN OBJECT
    ----------------------------------------------------- */

    const studyData = {

        version:
            2,

        curriculum,

        examType:
            curriculum,

        examDate,

        subjects:
            subjectData,

        subjectNames,

        topics:
            allTopics,

        topicNames:
            allTopics.map(
                topic =>
                    topic.name
            ),

        topicDifficulty,

        topicPriority,

        startTime,

        todaySubject,

        todayName,

        advice:
            "Follow your subjects and topics in order. Complete each topic before moving to the next one.",

        daysLeft,

        urgency,

        hoursPerDay,

        difficulty,

        studyStartDate:
            today
                .toISOString()
                .split("T")[0],

        timetableData,

        studyScore:
            100,

        streak:
            Number(
                localStorage.getItem(
                    "studyMindStreak"
                ) || 0
            ),

        createdAt:
            new Date().toISOString()

    };


    /* =====================================================
       CREATE NEW PLAN RECORD
    ===================================================== */

    const newPlanRecord =
        createNewPlanRecord(
            studyData
        );


    const savedNewPlan =
        saveNewPlanRecord(
            newPlanRecord
        );


    if (!savedNewPlan) {

        alert(
            "Your new study plan could not be saved. Please check your browser storage and try again."
        );

        return;

    }


    /* -----------------------------------------------------
       RESET PROGRESS FOR NEW PLAN ONLY
    ----------------------------------------------------- */

    resetForNewPlan();


    /* -----------------------------------------------------
       SAVE ACTIVE PLAN TO LEGACY KEYS
       -----------------------------------------------------

       These keys are kept because your existing Dashboard
       and other StudyMind files still use them.

    ----------------------------------------------------- */

    const savedMainPlan =
        writeJSON(
            PLAN_KEY,
            studyData
        );


    const savedCompatibilityPlan =
        writeJSON(
            COMPATIBILITY_PLAN_KEY,
            studyData
        );


    if (
        !savedMainPlan ||
        !savedCompatibilityPlan
    ) {

        alert(
            "Your study plan could not be saved. Please check your browser storage and try again."
        );

        return;

    }


    /* -----------------------------------------------------
       MAKE SURE THE NEW PLAN RECORD IS STILL ACTIVE
    ----------------------------------------------------- */

    setActivePlanId(
        newPlanRecord.id
    );


    /* -----------------------------------------------------
       SHOW PREVIEW
    ----------------------------------------------------- */

    const preview =
        $("studyPlan");


    if (preview) {

        preview.classList.remove(
            "hidden"
        );


        preview.innerHTML = `

            <div
                style="
                    padding:28px;
                    border-radius:20px;
                    border:1px solid rgba(127,127,127,.2);
                "
            >

                <h2>
                    ✅ Your Study Plan Is Ready
                </h2>

                <p>
                    <strong>
                        ${subjectNames.length}
                    </strong>
                    subject${subjectNames.length === 1 ? "" : "s"}
                    and
                    <strong>
                        ${allTopics.length}
                    </strong>
                    topic${allTopics.length === 1 ? "" : "s"}
                    have been organized.
                </p>

                <p>
                    ${subjectNames
                        .map(
                            escapeHTML
                        )
                        .join(" • ")}
                </p>

                <p>
                    <strong>
                        Exam:
                    </strong>
                    ${escapeHTML(
                        examDate
                    )}
                </p>

                <p>
                    <strong>
                        Daily study time:
                    </strong>
                    ${hoursPerDay}
                    hour${hoursPerDay === 1 ? "" : "s"}
                </p>

            </div>

        `;

    }


    /* -----------------------------------------------------
       GO TO DASHBOARD
    ----------------------------------------------------- */

    window.location.href =
        "dashboard.html";

}


/* =========================================================
   THEME SYSTEM
========================================================= */

function applyStudyMindTheme() {

    const savedTheme =
        localStorage.getItem(
            THEME_KEY
        ) || "dark";


    const isLight =
        savedTheme === "light";


    document.documentElement.classList.toggle(
        "light-mode",
        isLight
    );


    document.documentElement.classList.toggle(
        "dark-mode",
        !isLight
    );


    if (document.body) {

        document.body.classList.toggle(
            "light-mode",
            isLight
        );

        document.body.classList.toggle(
            "dark-mode",
            !isLight
        );

    }


    document.documentElement.style.colorScheme =
        isLight
            ? "light"
            : "dark";


    updateStudyMindThemeButton();

}


/* =========================================================
   TOGGLE THEME
========================================================= */

function toggleStudyMindTheme() {

    const currentTheme =
        localStorage.getItem(
            THEME_KEY
        ) || "dark";


    const newTheme =
        currentTheme === "dark"
            ? "light"
            : "dark";


    localStorage.setItem(
        THEME_KEY,
        newTheme
    );


    applyStudyMindTheme();

}


/* =========================================================
   UPDATE THEME BUTTON
========================================================= */

function updateStudyMindThemeButton() {

    const button =
        $("themeButton");

    if (!button) {
        return;
    }


    const isLight =
        document.body
            ?.classList
            .contains(
                "light-mode"
            );


    button.textContent =
        isLight
            ? "🌙 Dark Mode"
            : "☀️ Light Mode";


    button.setAttribute(
        "aria-label",
        isLight
            ? "Switch to Dark Mode"
            : "Switch to Light Mode"
    );


    button.setAttribute(
        "title",
        isLight
            ? "Switch to Dark Mode"
            : "Switch to Light Mode"
    );

}


/* =========================================================
   CREATE STUDY PLAN BUTTON
========================================================= */

function connectStartButton() {

    const button =
        $("startButton");

    if (!button) {
        return;
    }


    if (
        button.dataset.connected === "true"
    ) {

        return;

    }


    button.dataset.connected =
        "true";


    button.addEventListener(
        "click",
        function(event) {

            event.preventDefault();


            const generator =
                $("generator");


            if (!generator) {

                console.warn(
                    "StudyMind AI: #generator section was not found."
                );

                return;

            }


            generator.scrollIntoView({

                behavior:
                    "smooth",

                block:
                    "start"

            });

        }
    );

}


/* =========================================================
   THEME BUTTON
========================================================= */

function connectThemeButton() {

    const button =
        $("themeButton");

    if (!button) {
        return;
    }


    if (
        button.dataset.connected === "true"
    ) {

        updateStudyMindThemeButton();

        return;

    }


    button.dataset.connected =
        "true";


    button.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            toggleStudyMindTheme();

        }
    );


    updateStudyMindThemeButton();

}


/* =========================================================
   SUBJECT INPUT
========================================================= */

function connectSubjectInputs() {

    const subjects =
        $("subjects");

    if (!subjects) {
        return;
    }


    if (
        subjects.dataset.connected === "true"
    ) {

        return;

    }


    subjects.dataset.connected =
        "true";


    subjects.addEventListener(
        "input",
        function() {

            renderSubjectTopicFields();

        }
    );


    subjects.addEventListener(
        "change",
        function() {

            renderSubjectTopicFields();

        }
    );

}


/* =========================================================
   TOPIC INPUT
========================================================= */

function connectTopicFields() {

    const container =
        $("subjectTopicFields");

    if (!container) {
        return;
    }


    if (
        container.dataset.connected === "true"
    ) {

        return;

    }


    container.dataset.connected =
        "true";


    container.addEventListener(
        "input",
        function() {

            syncLegacyTopicsField();

        }
    );

}


/* =========================================================
   STUDY FORM
========================================================= */

function connectStudyForm() {

    const form =
        $("studyForm");

    if (!form) {
        return;
    }


    if (
        form.dataset.connected === "true"
    ) {

        return;

    }


    form.dataset.connected =
        "true";


    form.addEventListener(
        "submit",
        generateStudyPlan
    );

}


/* =========================================================
   INITIALIZE HOME
========================================================= */

function initializeHome() {

    /*
       Make sure an older plan isn't lost when this
       multi-plan version is first installed.
    */

    migrateLegacyPlanIfNeeded();


    /* Apply saved theme first */

    applyStudyMindTheme();


    /* Connect all Home controls */

    connectThemeButton();

    connectStartButton();

    connectSubjectInputs();

    connectTopicFields();

    connectStudyForm();


    /* Render initial topic state */

    renderSubjectTopicFields();


    /* Make sure hidden legacy field is synchronized */

    syncLegacyTopicsField();

}


/* =========================================================
   START APP
========================================================= */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeHome,
        {
            once: true
        }
    );

} else {

    initializeHome();

}


/* =========================================================
   GLOBAL MULTI-PLAN HELPERS
========================================================= */

window.getSavedStudyPlans =
    getSavedPlans;

window.getActiveStudyPlanId =
    getActivePlanId;

window.setActiveStudyPlanId =
    setActivePlanId;

window.archiveCurrentStudyPlan =
    archiveCurrentPlan;

window.migrateLegacyStudyPlan =
    migrateLegacyPlanIfNeeded;
