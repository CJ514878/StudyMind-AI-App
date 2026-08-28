/* =========================================
STUDYMIND AI — MAIN WEBSITE JAVASCRIPT
HOME PAGE: home.html
WELCOME PAGE: index.html
VERSION: FIXED PLAN + AI LIMIT + TIMER SYNC
========================================= */

/* =========================================
FREE AI LIMITS
========================================= */

const FREE_QUESTION_LIMIT = 5;

let aiQuestionCount =
Number(
localStorage.getItem(
"aiQuestionCount"
)
) || 0;

/* =========================================
THEME
========================================= */

const themeButton =
document.getElementById(
"themeButton"
);

if (themeButton) {


const savedTheme =
    localStorage.getItem(
        "studyMindTheme"
    );

if (
    savedTheme === "light"
) {

    document.body.classList.add(
        "light-mode"
    );

    themeButton.textContent =
        "☀️ Light Mode";

}

themeButton.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "light-mode"
        );

        const isLight =
            document.body.classList.contains(
                "light-mode"
            );

        localStorage.setItem(
            "studyMindTheme",
            isLight
                ? "light"
                : "dark"
        );

        themeButton.textContent =
            isLight
                ? "☀️ Light Mode"
                : "🌙 Dark Mode";

    }
);


}

/* =========================================
START BUTTON
========================================= */

const startButton =
document.getElementById(
"startButton"
);

if (startButton) {


startButton.addEventListener(
    "click",
    () => {

        const generator =
            document.getElementById(
                "generator"
            );

        if (generator) {

            generator.scrollIntoView({
                behavior: "smooth"
            });

        }

    }
);


}

/* =========================================
STUDY FORM
========================================= */

const studyForm =
document.getElementById(
"studyForm"
);

const generateButton =
document.getElementById(
"generateButton"
);

const studyPlan =
document.getElementById(
"studyPlan"
);

if (studyForm) {


studyForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();

        const examTypeElement =
            document.getElementById(
                "examType"
            );

        const examDateElement =
            document.getElementById(
                "examDate"
            );

        const subjectsElement =
            document.getElementById(
                "subjects"
            );

        const topicsElement =
            document.getElementById(
                "topics"
            );

        const studyHoursElement =
            document.getElementById(
                "studyHours"
            );

        const difficultyElement =
            document.getElementById(
                "difficulty"
            );


        const examType =
            examTypeElement
                ? examTypeElement.value.trim()
                : "";

        const examDate =
            examDateElement
                ? examDateElement.value
                : "";

        const subjectsInput =
            subjectsElement
                ? subjectsElement.value
                : "";

        const topicsInput =
            topicsElement
                ? topicsElement.value
                : "";

        const studyHours =
            studyHoursElement
                ? studyHoursElement.value
                : "";

        const difficulty =
            difficultyElement
                ? difficultyElement.value
                : "balanced";


        /* ==============================
           VALIDATION
        ============================== */

        if (
            !examType ||
            !examDate ||
            !subjectsInput.trim() ||
            !topicsInput.trim() ||
            !studyHours
        ) {

            alert(
                "Please complete all required fields."
            );

            return;
        }


        /* ==============================
           SUBJECTS
        ============================== */

        const subjects =
            subjectsInput
                .split(",")
                .map(
                    subject =>
                        subject.trim()
                )
                .filter(
                    subject =>
                        subject.length > 0
                );


        /* ==============================
           TOPICS
        ============================== */

        const topics =
            topicsInput
                .split(/[\n,]+/)
                .map(
                    topic =>
                        topic.trim()
                )
                .filter(
                    topic =>
                        topic.length > 0
                );


        if (
            subjects.length === 0
        ) {

            alert(
                "Please enter at least one subject."
            );

            return;
        }


        if (
            topics.length === 0
        ) {

            alert(
                "Please enter at least one topic."
            );

            return;
        }


        /* ==============================
           GENERATING
        ============================== */

        if (generateButton) {

            generateButton.textContent =
                "Generating Plan...";

            generateButton.disabled =
                true;

        }


        setTimeout(
            () => {

                generateStudyPlan(
                    examType,
                    examDate,
                    subjects,
                    topics,
                    studyHours,
                    difficulty
                );

                if (generateButton) {

                    generateButton.textContent =
                        "Generate My Plan";

                    generateButton.disabled =
                        false;

                }

            },
            700
        );

    }
);


}

/* =========================================
GENERATE STUDY PLAN
========================================= */

function generateStudyPlan(
examType,
examDate,
subjects,
topics,
studyHours,
difficulty
) {


if (!studyPlan) {
    return;
}


/* ==============================
   DAYS LEFT
============================== */

const exam =
    new Date(
        `${examDate}T00:00:00`
    );

const today =
    new Date();

today.setHours(
    0,
    0,
    0,
    0
);

exam.setHours(
    0,
    0,
    0,
    0
);

const difference =
    exam - today;

const daysLeft =
    Math.max(
        0,
        Math.ceil(
            difference /
            (
                1000 *
                60 *
                60 *
                24
            )
        )
    );


/* ==============================
   RECOMMENDED HOURS
============================== */

let recommendedHours =
    Number(
        studyHours
    );

if (
    !Number.isFinite(
        recommendedHours
    ) ||
    recommendedHours <= 0
) {

    recommendedHours = 1;

}


if (
    difficulty === "light"
) {

    recommendedHours =
        Math.max(
            1,
            recommendedHours - 1
        );

}


if (
    difficulty === "intensive"
) {

    recommendedHours += 1;

}


/* ==============================
   SUBJECT COUNT
============================== */

const subjectCount =
    subjects.length;

let recommendation;


if (
    subjectCount === 1
) {

    recommendation =
        "Focus deeply on your subject and use regular practice sessions.";

} else if (
    subjectCount <= 3
) {

    recommendation =
        "Rotate your subjects throughout the week while giving extra time to weaker areas.";

} else if (
    subjectCount <= 6
) {

    recommendation =
        "Use a structured rotation so every subject receives consistent attention.";

} else {

    recommendation =
        "Divide your subjects into focused study blocks and prioritize your most important topics.";

}


/* ==============================
   RESET PREVIOUS PLAN PROGRESS
============================== */

localStorage.removeItem(
    "studyMindCompletedTopics"
);

localStorage.removeItem(
    "studyMindCurrentTopicIndex"
);

localStorage.removeItem(
    "studyMindTopicQuestions"
);

localStorage.removeItem(
    "studyMindCompletedQuestionTopics"
);


/* ==============================
   RESET TIMER
============================== */

localStorage.removeItem(
    "studyMindTimerSeconds"
);

localStorage.removeItem(
    "studyMindTimerRunning"
);

localStorage.removeItem(
    "studyMindTimerEndTime"
);

localStorage.removeItem(
    "studyMindSelectedTimerSeconds"
);


/* ==============================
   PLAN HTML
============================== */

studyPlan.innerHTML = `

    <div class="generated-plan-header">

        <div>

            <span class="eyebrow">
                PLAN GENERATED
            </span>

            <h2>
                Your Study Plan
            </h2>

        </div>

        <span class="plan-success">
            ✓ Ready
        </span>

    </div>


    <div class="generated-plan-stats">

        <div>
            <span>Exam</span>

            <strong>
                ${escapeHTML(examType)}
            </strong>
        </div>


        <div>
            <span>Days Left</span>

            <strong>
                ${daysLeft}
            </strong>
        </div>


        <div>
            <span>Daily Study</span>

            <strong>
                ${recommendedHours} hrs
            </strong>
        </div>


        <div>
            <span>Subjects</span>

            <strong>
                ${subjectCount}
            </strong>
        </div>

    </div>


    <div class="generated-plan-content">

        <h3>
            📚 Your Subjects
        </h3>

        <div class="generated-subjects">

            ${subjects
                .map(
                    (
                        subject,
                        index
                    ) => `

                <div class="generated-subject">

                    <span>
                        ${index + 1}
                    </span>

                    <strong>
                        ${escapeHTML(
                            subject
                        )}
                    </strong>

                </div>

            `
                )
                .join("")}

        </div>


        <h3 style="margin-top:25px;">
            📖 Your Topics
        </h3>

        <div class="generated-subjects">

            ${topics
                .map(
                    (
                        topic,
                        index
                    ) => `

                <div class="generated-subject">

                    <span>
                        ${index + 1}
                    </span>

                    <strong>
                        ${escapeHTML(
                            topic
                        )}
                    </strong>

                </div>

            `
                )
                .join("")}

        </div>


        <div class="plan-advice">

            <strong>
                🤖 StudyMind AI Recommendation
            </strong>

            <p>
                ${escapeHTML(
                    recommendation
                )}
            </p>

        </div>

    </div>


    <div class="generated-plan-actions">

        <button
            class="primary-button"
            onclick="openDashboard()"
        >
            Open My Dashboard →
        </button>

    </div>

`;


studyPlan.classList.remove(
    "hidden"
);


/* ==============================
   SAVE COMPLETE PLAN
============================== */

const planData = {

    examType:
        examType,

    examDate:
        examDate,

    subjects:
        [...subjects],

    topics:
        [...topics],

    studyHours:
        recommendedHours,

    difficulty:
        difficulty,

    daysLeft:
        daysLeft,

    studyStartDate:
        new Date()
            .toISOString()
            .split("T")[0],

    createdAt:
        new Date().toISOString()

};


/*
   This is the key connection between
   home.html and dashboard.html.

   Dashboard reads this exact object.
*/

localStorage.setItem(
    "studyMindPlan",
    JSON.stringify(
        planData
    )
);


/*
   Also keep a compatibility copy for
   older StudyMind versions.
*/

localStorage.setItem(
    "studyData",
    JSON.stringify(
        planData
    )
);


window.dispatchEvent(
    new StorageEvent(
        "storage",
        {
            key:
                "studyMindPlan",
            newValue:
                JSON.stringify(
                    planData
                )
        }
    )
);


window.scrollTo({

    top:
        studyPlan.offsetTop - 80,

    behavior:
        "smooth"

});


}

/* =========================================
OPEN DASHBOARD
========================================= */

function openDashboard() {


window.location.href =
    "dashboard.html";


}

/* =========================================
SET MINIMUM EXAM DATE
========================================= */

const examDateInput =
document.getElementById(
"examDate"
);

if (examDateInput) {


const today =
    new Date();

const year =
    today.getFullYear();

const month =
    String(
        today.getMonth() + 1
    ).padStart(
        2,
        "0"
    );

const day =
    String(
        today.getDate()
    ).padStart(
        2,
        "0"
    );

examDateInput.min =
    `${year}-${month}-${day}`;


}

/* =========================================
HTML ESCAPE
========================================= */

function escapeHTML(
value
) {


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

/* =========================================
AI LIMIT HELPERS
========================================= */

function getAIQuestionCount() {


return Number(
    localStorage.getItem(
        "aiQuestionCount"
    )
) || 0;


}

function getRemainingAIQuestions() {


return Math.max(
    0,
    FREE_QUESTION_LIMIT -
    getAIQuestionCount()
);


}

function hasFreeAIQuestionsLeft() {


return (
    getRemainingAIQuestions() > 0
);


}

function recordAIQuestion() {


let count =
    getAIQuestionCount();

if (
    count >=
    FREE_QUESTION_LIMIT
) {

    return false;

}

count++;

localStorage.setItem(
    "aiQuestionCount",
    String(count)
);

aiQuestionCount =
    count;

return true;


}

/* =========================================
PREMIUM MESSAGE
========================================= */

function showPremiumMessage() {


alert(
    "You have used all 5 free AI questions. Explore Premium for unlimited AI access and more study features."
);


}

/* =========================================
LOGOUT
========================================= */

async function logoutStudyMind() {


try {

    if (
        typeof supabaseClient !==
            "undefined" &&
        supabaseClient &&
        supabaseClient.auth
    ) {

        await supabaseClient
            .auth
            .signOut();

    }

} catch (error) {

    console.error(
        "Logout error:",
        error
    );

}


localStorage.removeItem(
    "studyMindLoggedIn"
);

localStorage.removeItem(
    "isLoggedIn"
);

localStorage.removeItem(
    "currentUser"
);


window.location.href =
    "index.html";


}

/* =========================================
GLOBAL FUNCTIONS
========================================= */

window.openDashboard =
openDashboard;

window.getAIQuestionCount =
getAIQuestionCount;

window.getRemainingAIQuestions =
getRemainingAIQuestions;

window.hasFreeAIQuestionsLeft =
hasFreeAIQuestionsLeft;

window.recordAIQuestion =
recordAIQuestion;

window.showPremiumMessage =
showPremiumMessage;

window.logoutStudyMind =
logoutStudyMind;

/* =========================================
KEEP COUNTER SYNCHRONIZED
========================================= */

window.addEventListener(
"storage",
event => {


    if (
        event.key ===
        "aiQuestionCount"
    ) {

        aiQuestionCount =
            Number(
                event.newValue
            ) || 0;

    }

}

);
