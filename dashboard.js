/* =========================================================
   STUDYMIND AI — DASHBOARD.JS
   COMPLETE REPLACEMENT

   FEATURES:
   - Subject → Topic → Topic → Next Subject flow
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

const PLAN_KEY = "studyMindPlan";
const LEGACY_PLAN_KEY = "studyData";

const COMPLETED_KEY =
    "studyMindCompletedTopics";

const COMPLETED_Q_KEY =
    "studyMindCompletedQuestionTopics";

const CURRENT_INDEX_KEY =
    "studyMindCurrentTopicIndex";

const KNOWLEDGE_TOPIC_KEY =
    "studyMindKnowledgeCheckTopic";

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


/* =========================================================
   SETTINGS
========================================================= */

const FREE_AI_LIMIT = 5;

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

let calendarDate = new Date();

let currentUser = null;


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

    } catch {

        return fallback;
    }
}


function writeJSON(
    key,
    value
) {

    localStorage.setItem(
        key,
        JSON.stringify(value)
    );
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

function topicKey(topic) {

    return `${clean(
        topic?.subject ||
        "Senior Secondary"
    ).toLowerCase()}::${clean(
        topic?.name
    ).toLowerCase()}`;
}


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

        return name
            ? {
                id:
                    `topic-${index}-${name
                        .toLowerCase()
                        .replace(/\W+/g, "-")}`,

                name,

                subject,

                description:
                    `Study ${name} and complete the knowledge check.`
            }
            : null;
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
            `topic-${index}-${name}`,

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
       SUBJECTS WITH NESTED TOPICS
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
                        `subject-${subjectIndex + 1}`,

                    name,

                    topics:
                        nested
                            .map(
                                (topic, i) =>
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
                flatTopics.push(topic);
            }

        }
    );


    const hasNested =
        normalizedSubjects.some(
            subject =>
                subject.topics.length
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
                                    topic.subject
                                        .toLowerCase() ===
                                    subject.name
                                        .toLowerCase()
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

                    const subject =
                        normalizedSubjects[
                            i %
                            normalizedSubjects.length
                        ];


                    if (subject) {

                        subject.topics.push({

                            ...topic,

                            subject:
                                subject.name

                        });

                    }

                }
            );

        }

    }


    /* =====================================================
       IF NO SUBJECTS EXIST
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

                normalizedSubjects.push({

                    id:
                        `subject-${i + 1}`,

                    name:
                        clean(name),

                    topics: []

                });

            }
        );


        if (
            !normalizedSubjects.length
        ) {

            const rawNames =
                typeof plan.subjects === "string"

                    ? plan.subjects.split(
                        /[,;\n]+/
                    )

                    : [];


            rawNames
                .map(clean)
                .filter(Boolean)
                .forEach(
                    (
                        name,
                        i
                    ) => {

                        normalizedSubjects.push({

                            id:
                                `subject-${i + 1}`,

                            name,

                            topics: []

                        });

                    }
                );

        }


        flatTopics.forEach(
            (
                topic,
                i
            ) => {

                const subject =
                    normalizedSubjects[
                        i %
                        Math.max(
                            normalizedSubjects.length,
                            1
                        )
                    ];


                if (subject) {

                    subject.topics.push({

                        ...topic,

                        subject:
                            subject.name

                    });

                }

            }
        );

    }


    /* =====================================================
       REMOVE DUPLICATE TOPICS
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
        studyPlan.subjects ||
        [];


    allTopics =
        studyPlan.topics ||
        subjects.flatMap(
            subject =>
                subject.topics
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

    completedTopics =
        readJSON(
            COMPLETED_KEY,
            []
        );


    completedQuestionTopics =
        readJSON(
            COMPLETED_Q_KEY,
            []
        );


    if (
        !Array.isArray(
            completedTopics
        )
    ) {

        completedTopics = [];

    }


    if (
        !Array.isArray(
            completedQuestionTopics
        )
    ) {

        completedQuestionTopics = [];

    }
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
   CURRENT TOPIC
========================================================= */

function getCurrentTopic() {

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


    return allTopics[next];
}


/* =========================================================
   NEXT INCOMPLETE TOPIC
========================================================= */

function getNextIncompleteTopic(
    fromIndex = currentTopicIndex
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
   AUTHENTICATION
========================================================= */

async function checkAuthentication() {

    try {

        const client =
            window.supabaseClient;


        if (
            !client?.auth
        ) {

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

    try {

        if (
            window.supabaseClient?.auth
        ) {

            await window
                .supabaseClient
                .auth
                .signOut();

        }

    } catch {

        /* Ignore logout errors */

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
            ) /
            86400000
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


    const values = {

        weeklyHours:
            Number(
                studyPlan?.studyHours ||
                0
            ) * 7,

        daysLeft:
            calculateDaysLeft(),

        dailyGoal:
            `${Number(
                studyPlan?.studyHours ||
                0
            )} hrs`,

        studyScore:
            score,

        streak:
            Number(
                localStorage.getItem(
                    STREAK_KEY
                ) || 0
            ),

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


    if ($("progressPercent")) {

        $("progressPercent")
            .textContent =
            `${score}%`;

    }


    if ($("scoreProgressBar")) {

        $("scoreProgressBar")
            .style.width =
            `${score}%`;

    }


    if ($("progressBar")) {

        $("progressBar")
            .style.width =
            `${score}%`;

    }


    if ($("progressCount")) {

        $("progressCount")
            .textContent =
            `${completed} of ${allTopics.length} topics completed`;

    }


    if ($("scoreMessage")) {

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

                    const done =
                        subject.topics.length &&
                        subject.topics.every(
                            isCompleted
                        );


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
                                ${
                                    subject.topics.filter(
                                        isCompleted
                                    ).length
                                }/${subject.topics.length}
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
                            subject.topics
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


    /* =====================================================
       MARK TOPIC AS COMPLETED
    ===================================================== */

    const key =
        topicKey(topic);


    completedTopics =
        completedTopics.filter(
            value =>
                value !== topic.name &&
                value !== key
        );


    completedTopics.push(
        key
    );


    /* =====================================================
       SAVE READING COMPLETION
       
       THIS IS THE CONNECTION TO THE STREAK.
       
       Completing today's reading registers TODAY as
       a study day.

       Multiple topics completed on the same day do NOT
       increase the streak multiple times.
    ===================================================== */

    if (
        typeof window.registerStudyCompletion ===
        "function"
    ) {

        window.registerStudyCompletion();

    } else {

        /*
         * Fallback in case streak.js has not loaded.
         */

        const today =
            new Date()
                .toISOString()
                .slice(0, 10);


        localStorage.setItem(
            LAST_STUDY_KEY,
            today
        );

    }


    /* =====================================================
       FIND NEXT TOPIC
    ===================================================== */

    const next =
        getNextIncompleteTopic(
            currentTopicIndex
        );


    currentTopicIndex =
        next
            ? allTopics.indexOf(next)
            : allTopics.length;


    saveCompletionState();


    /* =====================================================
       STOP TIMER
    ===================================================== */

    stopTimer();


    /* =====================================================
       UPDATE DASHBOARD
    ===================================================== */

    renderCurrentTopic();

    renderProgress();

    renderSubjects();

    renderTopics();

    renderDailyChallenge();

    renderSchedule();

    renderNextSession();

    renderCalendar();


    /* =====================================================
       OPEN KNOWLEDGE CHECK
    ===================================================== */

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
        usage >= 5
    ) {

        alert(
            "You have used all 5 free Knowledge Checks. Premium is coming soon."
        );

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
                        margin:
                            0 0 12px;
                    "
                >
                    Congratulations! 🏆
                </h2>

                <p
                    style="
                        font-size:18px;
                        line-height:1.6;
                        opacity:.88;
                        margin:
                            0 0 28px;
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
        () => overlay.remove()
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

    const mins =
        Math.floor(
            Math.max(
                0,
                seconds
            ) / 60
        );


    const secs =
        Math.max(
            0,
            seconds
        ) % 60;


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


    resetTimer();
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


        /*
         * After exam date there is NO
         * study/rest/test/exam label.
         */

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
        Number(
            studyPlan?.studyHours ||
            1
        );


    const startHour =
        Number(
            String(
                studyPlan?.startTime ||
                "16:00"
            ).split(":")[0]
        ) || 16;


    container.innerHTML =
        Array.from(
            {
                length: hours
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

    hour %= 24;


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
                background:
                    rgba(0,0,0,.7);
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
                    border:
                        1px solid
                        rgba(255,255,255,.15);
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


        const data =
            await response.json();


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

        output.textContent =
            `⚠️ ${error.message}`;

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

    /* =====================================================
       COMPLETE READING
    ===================================================== */

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


    /* =====================================================
       TIMER
    ===================================================== */

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


    /* =====================================================
       CALENDAR
    ===================================================== */

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


    /* =====================================================
       AI
    ===================================================== */

    $("askAIButton")
        ?.addEventListener(
            "click",
            askAI
        );


    /* =====================================================
       THEME
    ===================================================== */

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


    /* =====================================================
       DAILY CHALLENGE
    ===================================================== */

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


    /* =====================================================
       LOGOUT
    ===================================================== */

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

    /* =====================================================
       THEME
    ===================================================== */

    initializeTheme();


    /* =====================================================
       LOAD STUDY PLAN
    ===================================================== */

    if (
        !loadStudyPlan()
    ) {

        window.location.href =
            "home.html#generator";

        return;

    }


    /* =====================================================
       LOAD COMPLETION STATE
    ===================================================== */

    loadCompletionState();


    /* =====================================================
       AUTH
    ===================================================== */

    const authenticated =
        await checkAuthentication();


    if (
        !authenticated
    ) {

        window.location.href =
            "login.html";

        return;

    }


    /* =====================================================
       CHECK TOPICS
    ===================================================== */

    if (
        !allTopics.length
    ) {

        window.location.href =
            "home.html#generator";

        return;

    }


    /* =====================================================
       TIMER VALIDATION
    ===================================================== */

    if (
        ![
            25,
            45,
            60
        ].includes(
            selectedTimerSeconds /
            60
        )
    ) {

        selectedTimerSeconds =
            DEFAULT_TIMER_SECONDS;

    }


    if (
        timerSeconds <= 0 ||
        timerSeconds >
            selectedTimerSeconds
    ) {

        timerSeconds =
            selectedTimerSeconds;

    }


    saveTimer();


    /* =====================================================
       EVENTS
    ===================================================== */

    bindEvents();


    /* =====================================================
       RENDER
    ===================================================== */

    renderStats();

    renderSubjects();

    renderTopics();

    renderCurrentTopic();

    renderDailyChallenge();

    renderTimer();

    renderSchedule();

    renderNextSession();

    renderCalendar();

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

} else {

    startDashboard();

}

