/* =========================================================
   STUDYMIND AI — DASHBOARD.JS
   COMPLETE REPLACEMENT

   FLOW:

   SUBJECT 1
      ↓
   TOPIC 1
      ↓
   TOPIC 2
      ↓
   TOPIC 3
      ↓
   SUBJECT 2
      ↓
   TOPIC 1
      ↓
   TOPIC 2
      ↓
   EVERYTHING COMPLETE
      ↓
   🎉 CONGRATULATIONS POPUP
========================================================= */

"use strict";


/* =========================================================
   STORAGE
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
   STATE
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
    ) ||
    DEFAULT_TIMER_SECONDS;


let selectedTimerSeconds =
    Number(
        localStorage.getItem(
            TIMER_DURATION_KEY
        )
    ) ||
    DEFAULT_TIMER_SECONDS;


let timerInterval =
    null;

let timerRunning =
    false;


let calendarDate =
    new Date();


let currentUser =
    null;


/* =========================================================
   SHORTCUT
========================================================= */

const $ =
    id =>
        document.getElementById(id);


/* =========================================================
   STORAGE HELPERS
========================================================= */

function readJSON(
    key,
    fallback = null
) {

    try {

        const raw =
            localStorage.getItem(
                key
            );

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
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   TOPIC HELPERS
========================================================= */

function topicName(
    topic
) {

    if (
        typeof topic ===
        "string"
    ) {

        return clean(
            topic
        );

    }


    return clean(

        topic?.name ||

        topic?.topic ||

        topic?.title

    );

}


function topicSubject(
    topic
) {

    return clean(

        topic?.subject ||

        topic?.subjectName ||

        ""

    );

}


function topicKey(
    topic
) {

    return `${

        topicSubject(
            topic
        )

            .toLowerCase()

    }::${

        topicName(
            topic
        )

            .toLowerCase()

    }`;

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
        typeof raw ===
        "string" ||
        typeof raw ===
        "number"
    ) {

        const name =
            clean(raw);


        if (!name) {

            return null;

        }


        return {

            id:
                `topic-${index}-${name}`,

            name,

            subject,

            description:
                `Study ${name} and complete the knowledge check.`

        };

    }


    if (
        !raw ||
        typeof raw !==
        "object"
    ) {

        return null;

    }


    const name =
        topicName(
            raw
        );


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

function normalizePlan(
    raw
) {

    if (
        !raw ||
        typeof raw !==
        "object"
    ) {

        return null;

    }


    const plan =

        raw.studyPlan &&
        typeof raw.studyPlan ===
        "object"

            ? raw.studyPlan

            : raw.plan &&
              typeof raw.plan ===
              "object"

                ? raw.plan

                : raw;


    const normalizedSubjects =
        [];


    /*
       NEW FORMAT:

       subjects: [
          {
             name: "Mathematics",
             topics: [...]
          },
          {
             name: "Physics",
             topics: [...]
          }
       ]
    */

    if (
        Array.isArray(
            plan.subjects
        )
    ) {

        plan.subjects
            .forEach(
                (
                    rawSubject,
                    subjectIndex
                ) => {

                    const name =

                        clean(

                            typeof rawSubject ===
                            "string"

                                ? rawSubject

                                : rawSubject?.name ||
                                  rawSubject?.subject ||
                                  rawSubject?.title

                        );


                    if (!name) {

                        return;

                    }


                    const nestedTopics =

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
                            nestedTopics

                                .map(
                                    (
                                        topic,
                                        topicIndex
                                    ) =>
                                        normalizeTopic(
                                            topic,
                                            name,
                                            topicIndex
                                        )
                                )

                                .filter(
                                    Boolean
                                )

                    });

                }
            );

    }


    /*
       TOP LEVEL TOPICS
    */

    const topLevelTopics =

        Array.isArray(
            plan.topics
        )

            ? plan.topics

            : [];


    const flatTopics =
        [];


    topLevelTopics
        .forEach(
            (
                rawTopic,
                index
            ) => {

                const topic =
                    normalizeTopic(
                        rawTopic,
                        topicSubject(
                            rawTopic
                        ),
                        index
                    );


                if (topic) {

                    flatTopics.push(
                        topic
                    );

                }

            }
        );


    /*
       If subjects do not contain topics,
       use the top-level topics.
    */

    const hasNestedTopics =
        normalizedSubjects.some(
            subject =>
                subject.topics.length
        );


    if (
        !hasNestedTopics &&
        flatTopics.length
    ) {

        if (
            normalizedSubjects.length ===
            1
        ) {

            normalizedSubjects[0].topics =

                flatTopics.map(
                    topic => ({

                        ...topic,

                        subject:
                            normalizedSubjects[0]
                                .name

                    })
                );

        }

        else if (
            flatTopics.some(
                topic =>
                    topic.subject
            )
        ) {

            normalizedSubjects
                .forEach(
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

            /*
               Legacy plans had subjects and
               topics separately.

               Distribute old topics across
               subjects so old plans still work.
            */

            flatTopics
                .forEach(
                    (
                        topic,
                        index
                    ) => {

                        const subject =

                            normalizedSubjects[
                                index %
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


    /*
       REMOVE DUPLICATES WHILE PRESERVING
       SUBJECT ORDER.
    */

    const seen =
        new Set();


    normalizedSubjects
        .forEach(
            subject => {

                subject.topics =

                    subject.topics
                        .filter(
                            topic => {

                                topic.subject =
                                    subject.name;


                                const key =
                                    topicKey(
                                        topic
                                    );


                                if (
                                    seen.has(
                                        key
                                    )
                                ) {

                                    return false;

                                }


                                seen.add(
                                    key
                                );


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
                .slice(
                    0,
                    10
                ),

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
        normalizePlan(
            raw
        );


    if (!studyPlan) {

        subjects =
            [];

        allTopics =
            [];

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
   SAVE PLAN
========================================================= */

function savePlan() {

    if (!studyPlan) {

        return;

    }


    /*
       Save the structured subjects.

       DO NOT flatten subjects back into
       strings.
    */

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
   COMPLETION
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

        completedTopics =
            [];

    }


    if (
        !Array.isArray(
            completedQuestionTopics
        )
    ) {

        completedQuestionTopics =
            [];

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


function isCompleted(
    topic
) {

    const key =
        topicKey(
            topic
        );

    const name =
        topicName(
            topic
        );


    return (

        completedTopics.includes(
            key
        ) ||

        completedTopics.includes(
            name
        )

    );

}


function isQuestionCompleted(
    topic
) {

    const key =
        topicKey(
            topic
        );

    const name =
        topicName(
            topic
        );


    return (

        completedQuestionTopics.includes(
            key
        ) ||

        completedQuestionTopics.includes(
            name
        )

    );

}


/* =========================================================
   CURRENT TOPIC

   THIS IS THE CORE FIX.

   We do not trust the old saved index to determine
   what the student should see.

   We ALWAYS find the first incomplete topic in
   subject/topic order.
========================================================= */

function getCurrentTopic() {

    if (
        !allTopics.length
    ) {

        return null;

    }


    const nextIndex =

        allTopics.findIndex(
            topic =>
                !isCompleted(
                    topic
                )
        );


    /*
       EVERYTHING IS COMPLETE.
    */

    if (
        nextIndex === -1
    ) {

        currentTopicIndex =
            allTopics.length;


        localStorage.setItem(

            CURRENT_INDEX_KEY,

            String(
                currentTopicIndex
            )

        );


        return null;

    }


    /*
       IMPORTANT:

       This automatically moves from:

       Mathematics → Algebra
       Mathematics → Quadratic Equations
       Mathematics → Trigonometry
       Physics → Motion

       without needing the user to manually
       choose another topic.
    */

    currentTopicIndex =
        nextIndex;


    localStorage.setItem(

        CURRENT_INDEX_KEY,

        String(
            currentTopicIndex
        )

    );


    return allTopics[
        nextIndex
    ];

}


/* =========================================================
   NEXT TOPIC
========================================================= */

function getNextIncompleteTopic(
    fromIndex =
        currentTopicIndex
) {

    for (
        let i =
            fromIndex + 1;

        i <
        allTopics.length;

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


    /*
       Safety fallback.
    */

    for (
        let i = 0;

        i <= fromIndex &&
        i <
        allTopics.length;

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

            console.error(
                "StudyMind: Supabase client is not available."
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

    } catch (
        error
    ) {

        console.error(
            "StudyMind authentication error:",
            error
        );


        return false;

    }

}


async function logoutStudyMind() {

    try {

        await window
            .supabaseClient
            ?.auth
            ?.signOut();

    } catch {}

    window.location.href =
        "login.html";

}


/* =========================================================
   STATS
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
                ) *
                100
            )

            : 0;


    const values = {

        weeklyHours:
            Number(
                studyPlan?.studyHours ||
                0
            ) *
            7,

        daysLeft:
            calculateDaysLeft(),

        dailyGoal:
            `${Number(
                studyPlan?.studyHours ||
                0
            )} hrs`,

        studyScore:
            score,

        scoreDisplay:
            score,

        streak:
            Number(
                localStorage.getItem(
                    STREAK_KEY
                ) ||
                0
            )

    };


    Object.entries(
        values
    )
        .forEach(
            (
                [
                    id,
                    value
                ]
            ) => {

                if (
                    $(id)
                ) {

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
        $("progressBar")
    ) {

        $("progressBar")
            .style.width =
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

                    const done =

                        subject.topics.length > 0 &&

                        subject.topics.every(
                            isCompleted
                        );


                    return `

                        <div
                            class="subject-item ${
                                done
                                    ? "completed"
                                    : ""
                            }"
                        >

                            <strong>
                                ${escapeHTML(
                                    subject.name
                                )}
                            </strong>

                            <span>
                                ${
                                    subject.topics
                                        .filter(
                                            isCompleted
                                        )
                                        .length
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
                            📚 ${escapeHTML(
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
                                                    isCompleted(
                                                        topic
                                                    )
                                                        ? "completed"
                                                        : ""
                                                }
                                            "
                                        >

                                            <span>
                                                ${
                                                    isCompleted(
                                                        topic
                                                    )
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


function renderProgress() {

    renderStats();

}


/* =========================================================
   CURRENT TOPIC DISPLAY
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


    /*
       ALL COMPLETE
    */

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


    /*
       POSITION
    */

    if (position) {

        position.textContent =

            `TOPIC ${
                currentTopicIndex + 1
            } OF ${
                allTopics.length
            }`;

    }


    /*
       NAME
    */

    if (name) {

        name.textContent =
            topic.name;

    }


    /*
       DESCRIPTION
    */

    if (description) {

        description.textContent =
            topic.description;

    }


    /*
       BADGE
    */

    if (badge) {

        badge.textContent =
            "IN PROGRESS";

    }


    /*
       CHECKBOX
    */

    if (checkbox) {

        checkbox.checked =
            false;

        checkbox.disabled =
            false;

    }


    /*
       SUBJECT MESSAGE
    */

    if (message) {

        message.textContent =

            `📚 ${
                topic.subject ||
                "Subject"
            } — study this topic, then tick the box when you are finished.`;

    }


    /*
       NEXT TOPIC
    */

    const next =
        getNextIncompleteTopic(
            currentTopicIndex
        );


    if (nextMessage) {

        if (next) {

            nextMessage.innerHTML =

                `➡️ Next: <strong>${
                    escapeHTML(
                        next.subject
                    )
                }</strong> — ${
                    escapeHTML(
                        next.name
                    )
                }`;

        } else {

            nextMessage.innerHTML =
                "🏁 This is your final topic.";

        }

    }


    hideKnowledgeCheck();

}


/* =========================================================
   COMPLETE CURRENT TOPIC

   THIS IS THE OTHER MAJOR FIX.
========================================================= */

function completeCurrentTopic() {

    const topic =
        getCurrentTopic();


    if (!topic) {

        return;

    }


    if (
        isCompleted(
            topic
        )
    ) {

        return;

    }


    const key =
        topicKey(
            topic
        );


    /*
       Store the subject::topic key.
    */

    completedTopics =
        completedTopics.filter(
            value =>

                value !==
                topic.name &&

                value !==
                key
        );


    completedTopics.push(
        key
    );


    /*
       Update streak.
    */

    localStorage.setItem(

        LAST_STUDY_KEY,

        new Date()
            .toISOString()
            .slice(
                0,
                10
            )

    );


    updateStudyStreak();


    /*
       FIND NEXT TOPIC.

       Because allTopics is ordered by subject,
       this automatically stays inside the current
       subject until its topics are finished.

       Once that subject has no incomplete topics,
       it automatically enters the next subject.
    */

    const next =
        getNextIncompleteTopic(
            currentTopicIndex
        );


    if (next) {

        currentTopicIndex =
            allTopics.indexOf(
                next
            );

    } else {

        currentTopicIndex =
            allTopics.length;

    }


    saveCompletionState();


    stopTimer();


    /*
       Refresh dashboard.
    */

    renderCurrentTopic();

    renderProgress();

    renderSubjects();

    renderTopics();

    renderSchedule();

    renderNextSession();

    renderCalendar();


    /*
       Open the knowledge check for the topic
       that was just studied.

       The NEXT topic is already saved above.

       Therefore after returning from the Knowledge
       Check, the dashboard will display the next topic.
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
            ) ||
            0
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
                topicKey(
                    topic
                ),

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


function hideKnowledgeCheck() {

    const section =
        $("topicQuestionsSection");


    if (section) {

        section.style.display =
            "none";

    }

}


/* =========================================================
   FINAL COMPLETION POPUP
========================================================= */

function maybeShowCompletionCelebration() {

    if (
        !allTopics.length
    ) {

        return;

    }


    if (
        !allTopics.every(
            isCompleted
        )
    ) {

        return;

    }


    if (
        localStorage.getItem(
            CELEBRATION_KEY
        ) ===
        "true"
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
                    background:
                        linear-gradient(
                            145deg,
                            #18233d,
                            #0b1220
                        );
                    border:
                        1px solid
                        rgba(255,255,255,.15);
                    box-shadow:
                        0 35px 100px
                        rgba(0,0,0,.5);
                    animation:
                        studyMindCelebrate
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

                    You have finished reading
                    for today.

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

            @keyframes studyMindCelebrate {

                from {

                    opacity:0;

                    transform:
                        translateY(18px)
                        scale(.96);

                }

                to {

                    opacity:1;

                    transform:
                        translateY(0)
                        scale(1);

                }

            }

        </style>

    `;


    document.body.appendChild(
        overlay
    );


    $("closeStudyMindCelebration")
        ?.addEventListener(
            "click",
            () =>
                overlay.remove()
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

            ? isCompleted(
                topic
            ) &&
              isQuestionCompleted(
                topic
            )

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
            ) /
            60
        );


    const secs =
        Math.max(
            0,
            seconds
        ) %
        60;


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
                    timerSeconds <=
                    0
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
        Number(
            minutes
        );


    if (
        !TIMER_OPTIONS.includes(
            value
        )
    ) {

        return;

    }


    selectedTimerSeconds =
        value *
        60;


    timerSeconds =
        selectedTimerSeconds;


    saveTimer();

    renderTimer();

}


/* =========================================================
   CALENDAR
========================================================= */

function dateKey(
    date
) {

    return `${

        date.getFullYear()

    }-${

        String(
            date.getMonth() + 1
        )
            .padStart(
                2,
                "0"
            )

    }-${

        String(
            date.getDate()
        )
            .padStart(
                2,
                "0"
            )

    }`;

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
        let day = 1;
        day <= total;
        day++
    ) {

        const date =
            new Date(
                year,
                monthIndex,
                day
            );


        const key =
            dateKey(
                date
            );


        const cell =
            document.createElement(
                "div"
            );


        cell.className =
            "calendar-day";


        cell.textContent =
            String(
                day
            );


        if (
            key ===
            today
        ) {

            cell.classList.add(
                "today"
            );

        }


        /*
           IMPORTANT:

           Anything AFTER the exam date is
           NOT a study day, rest day, test day
           or exam day.
        */

        if (
            examKey &&
            key >
            examKey
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


        /*
           EXAM DAY
        */

        if (
            key ===
            examKey
        ) {

            cell.classList.add(
                "exam-day"
            );


            cell.dataset.dayType =
                "exam";

        }

        /*
           STUDY PERIOD
        */

        else if (

            startKey &&
            key >= startKey &&
            key < examKey

        ) {

            /*
               Saturday + Sunday = rest.
            */

            if (
                date.getDay() ===
                0 ||
                date.getDay() ===
                6
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

        calendarDate.getMonth() -
        1

    );


    renderCalendar();

}


function nextMonth() {

    calendarDate.setMonth(

        calendarDate.getMonth() +
        1

    );


    renderCalendar();

}


/* =========================================================
   SCHEDULE
========================================================= */

function formatClock(
    hour
) {

    hour %=
        24;


    const period =
        hour >= 12
            ? "PM"
            : "AM";


    let h =
        hour % 12;


    if (
        h === 0
    ) {

        h = 12;

    }


    return `${h}:00 ${period}`;

}


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
            )
                .split(":")[0]
        ) ||
        16;


    container.innerHTML =

        Array
            .from(
                {
                    length:
                        hours
                }
            )

            .map(
                (
                    _,
                    index
                ) => `

                    <div class="schedule-card">

                        <h4>

                            ${escapeHTML(
                                formatClock(
                                    startHour +
                                    index
                                )
                            )}

                            -

                            ${escapeHTML(
                                formatClock(
                                    startHour +
                                    index +
                                    1
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
   STREAK
========================================================= */

function updateStudyStreak() {

    const today =
        new Date()
            .toISOString()
            .slice(
                0,
                10
            );


    const last =
        localStorage.getItem(
            LAST_STUDY_KEY
        );


    let streak =
        Number(
            localStorage.getItem(
                STREAK_KEY
            ) ||
            0
        );


    if (
        last ===
        today
    ) {

        return;

    }


    if (last) {

        const difference =

            Math.round(

                (

                    new Date(
                        `${today}T00:00:00`
                    )

                    -

                    new Date(
                        `${last}T00:00:00`
                    )

                ) /

                86400000

            );


        streak =

            difference === 1

                ? streak + 1

                : 1;

    }

    else {

        streak =
            1;

    }


    localStorage.setItem(

        STREAK_KEY,

        String(
            streak
        )

    );

}


/* =========================================================
   AI
========================================================= */

function aiCount() {

    const today =
        new Date()
            .toISOString()
            .slice(
                0,
                10
            );


    if (
        localStorage.getItem(
            AI_DATE_KEY
        ) !==
        today
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
        ) ||
        0

    );

}


function recordAIQuestion() {

    const count =
        aiCount() +
        1;


    localStorage.setItem(

        AI_COUNT_KEY,

        String(
            count
        )

    );


    return count;

}


function showPremiumMessage() {

    const existing =
        $("premiumModal");


    if (
        existing
    ) {

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

                    You've used your
                    5 free AI questions
                    for today.

                    Premium features
                    are coming soon.

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

                            question,

                            topic:
                                getCurrentTopic()
                                    ?.name ||
                                "",

                            subject:
                                getCurrentTopic()
                                    ?.subject ||
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

    }

    catch (
        error
    ) {

        output.textContent =

            `⚠️ ${
                error.message
            }`;

    }

}


/* =========================================================
   THEME
========================================================= */

function initializeTheme() {

    const saved =
        localStorage.getItem(
            THEME_KEY
        ) ||
        "dark";


    document.body.classList.toggle(

        "dark-mode",

        saved ===
        "dark"

    );


    if (
        $("themeButton")
    ) {

        $("themeButton")
            .textContent =

            saved === "dark"

                ? "☀️ Light Mode"

                : "🌙 Dark Mode";

    }

}


function toggleTheme() {

    const dark =
        document.body.classList.contains(
            "dark-mode"
        );


    localStorage.setItem(

        THEME_KEY,

        dark
            ? "light"
            : "dark"

    );


    initializeTheme();

}


/* =========================================================
   EVENTS
========================================================= */

function bindEvents() {

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


    $("askAIButton")
        ?.addEventListener(
            "click",
            askAI
        );


    $("themeButton")
        ?.addEventListener(
            "click",
            toggleTheme
        );


    $("dailyChallengeButton")
        ?.addEventListener(
            "click",
            () =>
                $("currentTopicSection")
                    ?.scrollIntoView({
                        behavior:
                            "smooth"
                    })
        );


    $("logoutButton")
        ?.addEventListener(
            "click",
            logoutStudyMind
        );

}


/* =========================================================
   START DASHBOARD
========================================================= */

async function startDashboard() {

    initializeTheme();


    if (
        !loadStudyPlan()
    ) {

        window.location.href =
            "home.html#generator";

        return;

    }


    loadCompletionState();


    const authenticated =
        await checkAuthentication();


    if (
        !authenticated
    ) {

        window.location.href =
            "login.html";

        return;

    }


    if (
        !allTopics.length
    ) {

        window.location.href =
            "home.html#generator";

        return;

    }


    if (
        !TIMER_OPTIONS.includes(
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


    bindEvents();


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
   GLOBALS
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


/* =========================================================
   START
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
