/* =========================================================
   STUDYMIND AI — HOME / STUDY PLAN GENERATOR
   COMPLETE REPLACEMENT

   SUBJECT → TOPIC STRUCTURE

   Example:

   Mathematics
      Algebra
      Quadratic Equations
      Trigonometry

   Physics
      Motion
      Forces
      Energy

   This structure is saved into localStorage and is used
   by dashboard.js to move through subjects in order.
========================================================= */

"use strict";


/* =========================================================
   STORAGE
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

const KNOWLEDGE_TOPIC_KEY =
    "studyMindKnowledgeCheckTopic";

const KNOWLEDGE_QUESTIONS_KEY =
    "studyMindTopicQuestions";

const THEME_KEY =
    "studyMindTheme";

const CELEBRATION_KEY =
    "studyMindCompletionCelebrationShown";


/* =========================================================
   SHORTCUT
========================================================= */

const $ =
    id =>
        document.getElementById(id);


/* =========================================================
   HELPERS
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


function formatTime(hour) {

    hour =
        Number(hour) % 24;

    const period =
        hour >= 12
            ? "PM"
            : "AM";

    let displayHour =
        hour % 12;

    if (
        displayHour === 0
    ) {

        displayHour = 12;

    }

    return `${displayHour}:00 ${period}`;

}


/* =========================================================
   GET SUBJECTS
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
   DYNAMIC TOPIC BOXES
========================================================= */

function renderSubjectTopicFields() {

    const container =
        $("subjectTopicFields");

    if (!container) {

        return;

    }

    const subjects =
        getSubjectNames();


    if (
        subjects.length === 0
    ) {

        container.innerHTML = `

            <div class="subject-topic-empty">

                Enter your subjects above and
                separate topic spaces will appear here.

            </div>

        `;

        return;

    }


    /*
       Preserve existing topic text when the user
       edits the subject list.
    */

    const oldValues = {};


    container
        .querySelectorAll(
            ".subject-topic-card"
        )
        .forEach(card => {

            const subject =
                card.dataset.subject ||
                "";

            const textarea =
                card.querySelector("textarea");

            if (
                subject &&
                textarea
            ) {

                oldValues[subject] =
                    textarea.value;

            }

        });


    container.innerHTML =

        subjects
            .map(
                subject => `

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
                        >${escapeHTML(
                            oldValues[subject] || ""
                        )}</textarea>

                        <small>
                            One topic per line,
                            or separate topics with commas.
                        </small>

                    </div>

                `
            )
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

        ...container
            .querySelectorAll(
                ".subject-topic-card"
            )

    ]

        .map(
            (
                card,
                subjectIndex
            ) => {

                const subject =
                    cleanText(
                        card.dataset.subject
                    );

                const textarea =
                    card.querySelector(
                        "textarea"
                    );


                const rawTopics =
                    textarea

                        ? textarea.value

                            .split(
                                /[\n,;]+/
                            )

                            .map(
                                cleanText
                            )

                            .filter(
                                Boolean
                            )

                        : [];


                const uniqueTopics =
                    [
                        ...new Set(
                            rawTopics
                        )
                    ];


                return {

                    id:
                        `subject-${subjectIndex + 1}-${slugify(subject)}`,

                    name:
                        subject,

                    topics:
                        uniqueTopics.map(
                            (
                                name,
                                topicIndex
                            ) => ({

                                id:
                                    `topic-${subjectIndex + 1}-${topicIndex + 1}-${slugify(name)}`,

                                name,

                                subject,

                                description:
                                    `Study ${name} for ${subject} and complete the knowledge check.`

                            })
                        )

                };

            }
        )

        .filter(
            subject =>
                subject.name
        );

}


/* =========================================================
   LEGACY TOPICS FIELD
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

            .map(
                subject =>

                    `${subject.name}: ${subject.topics
                        .map(topic => topic.name)
                        .join(", ")}`
            )

            .join("\n");

}


/* =========================================================
   VALIDATION
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
   DIFFICULTY
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

            ${

                subjectData

                    .map(

                        subject => `

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

                                ${

                                    subject.topics

                                        .map(

                                            topic => `

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

                                            `

                                        )

                                        .join("")

                                }

                            </div>

                        `

                    )

                    .join("")

            }

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
        .forEach(
            select => {

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

            }
        );


    return {

        topicDifficulty,

        topicPriority

    };

}


/* =========================================================
   GENERATE PLAN
========================================================= */

function generateStudyPlan(
    event
) {

    event.preventDefault();


    syncLegacyTopicsField();


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


    if (!examDate) {

        alert(
            "Please select your exam date."
        );

        return;

    }


    if (
        hoursPerDay <= 0
    ) {

        alert(
            "Please select your available study hours."
        );

        return;

    }


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


    const subjectData =
        collectSubjectTopicData();


    if (
        !validateSubjectTopics(
            subjectData
        )
    ) {

        return;

    }


    renderDifficultyFields(
        subjectData
    );


    const {
        topicDifficulty,
        topicPriority
    } =
        collectDifficultyData();


    /*
       IMPORTANT:
       This preserves subject order.
    */

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


    const startHour =
        Number(
            startTime.split(":")[0]
        ) || 16;


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


    const studyData = {

        version:
            2,

        curriculum,

        examType:
            curriculum,

        examDate,

        /*
           THIS IS THE IMPORTANT PART.

           Subjects remain objects with their
           own topic arrays.
        */

        subjects:
            subjectData,

        subjectNames,

        /*
           Flat topics are also kept for
           compatibility with older dashboard code.
        */

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


    /*
       BRAND NEW PLAN = RESET OLD TOPIC PROGRESS.
    */

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


    writeJSON(
        PLAN_KEY,
        studyData
    );


    writeJSON(
        COMPATIBILITY_PLAN_KEY,
        studyData
    );


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


    /*
       Move to dashboard.
    */

    window.location.href =
        "dashboard.html";

}


/* =========================================================
   STUDYMIND AI — GLOBAL THEME SYSTEM
========================================================= */

const STUDYMIND_THEME_KEY = "studyMindTheme";

function applyStudyMindTheme() {
    const savedTheme =
        localStorage.getItem(STUDYMIND_THEME_KEY) || "dark";

    const isLight = savedTheme === "light";

    document.documentElement.classList.toggle(
        "light-mode",
        isLight
    );

    document.body.classList.toggle(
        "light-mode",
        isLight
    );

    document.documentElement.classList.toggle(
        "dark-mode",
        !isLight
    );

    document.body.classList.toggle(
        "dark-mode",
        !isLight
    );

    updateStudyMindThemeButton();
}

function toggleStudyMindTheme() {
    const isCurrentlyLight =
        document.body.classList.contains("light-mode");

    const newTheme =
        isCurrentlyLight ? "dark" : "light";

    localStorage.setItem(
        STUDYMIND_THEME_KEY,
        newTheme
    );

    applyStudyMindTheme();
}

function updateStudyMindThemeButton() {
    const button =
        document.getElementById("themeButton");

    if (!button) return;

    const isLight =
        document.body.classList.contains("light-mode");

    button.textContent =
        isLight
            ? "🌙 Dark Mode"
            : "☀️ Light Mode";
}

/* Load saved theme immediately */
applyStudyMindTheme();

/* Connect theme button */
document.addEventListener("DOMContentLoaded", () => {
    const button =
        document.getElementById("themeButton");

    if (!button) return;

    /*
       Prevent duplicate event listeners if the
       script is initialized more than once.
    */
    if (button.dataset.themeConnected === "true") {
        updateStudyMindThemeButton();
        return;
    }

    button.dataset.themeConnected = "true";

    button.addEventListener(
        "click",
        toggleStudyMindTheme
    );

    updateStudyMindThemeButton();
});
/* =========================================================
   START
========================================================= */

function initializeHome() {

    applyTheme();


    $("themeButton")
        ?.addEventListener(
            "click",
            toggleTheme
        );


    $("startButton")
        ?.addEventListener(
            "click",
            () => {

                $("generator")
                    ?.scrollIntoView({
                        behavior:
                            "smooth"
                    });

            }
        );


    $("subjects")
        ?.addEventListener(
            "input",
            renderSubjectTopicFields
        );


    $("subjects")
        ?.addEventListener(
            "change",
            renderSubjectTopicFields
        );


    $("subjectTopicFields")
        ?.addEventListener(
            "input",
            syncLegacyTopicsField
        );


    $("studyForm")
        ?.addEventListener(
            "submit",
            generateStudyPlan
        );


    renderSubjectTopicFields();

}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeHome
    );

} else {

    initializeHome();

}
