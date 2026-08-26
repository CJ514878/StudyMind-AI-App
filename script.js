/* =========================================
   STUDYMIND AI — MAIN WEBSITE JAVASCRIPT
   HOME PAGE: home.html
   WELCOME PAGE: index.html
   VERSION: AUTH + FREE AI LIMITS + PLAN SYNC
========================================= */


/* =========================================
   FREE AI LIMITS
========================================= */

const FREE_QUESTION_LIMIT = 5;


/*
   Keep the AI question counter available
   to dashboard.js as well.
*/

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

    else {

        themeButton.textContent =
            "🌙 Dark Mode";

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


            /* -----------------------------
               VALIDATION
            ----------------------------- */

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


            /* -----------------------------
               SUBJECTS
            ----------------------------- */

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


            /* -----------------------------
               TOPICS
            ----------------------------- */

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


            /* -----------------------------
               GENERATING STATE
            ----------------------------- */

            if (generateButton) {

                generateButton.textContent =
                    "Generating Plan...";

                generateButton.disabled =
                    true;

            }


            setTimeout(
                () => {

                    try {

                        generateStudyPlan(
                            examType,
                            examDate,
                            subjects,
                            topics,
                            studyHours,
                            difficulty
                        );

                    }

                    catch (error) {

                        console.error(
                            "Study plan generation error:",
                            error
                        );

                        alert(
                            "Something went wrong while generating your study plan."
                        );

                    }

                    finally {

                        if (generateButton) {

                            generateButton.textContent =
                                "Generate My Plan";

                            generateButton.disabled =
                                false;

                        }

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


    /* -----------------------------------------
       CALCULATE DAYS LEFT
    ----------------------------------------- */

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


    /* -----------------------------------------
       CALCULATE RECOMMENDED HOURS
    ----------------------------------------- */

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

        recommendedHours =
            1;

    }


    /*
       Difficulty adjusts the recommended
       workload without changing the value
       entered into the form itself.
    */

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

        recommendedHours =
            recommendedHours + 1;

    }


    /* -----------------------------------------
       SUBJECT COUNT
    ----------------------------------------- */

    const subjectCount =
        subjects.length;


    let recommendation;


    if (
        subjectCount === 1
    ) {

        recommendation =
            "Focus deeply on your subject and use regular practice sessions.";

    }

    else if (
        subjectCount <= 3
    ) {

        recommendation =
            "Rotate your subjects throughout the week while giving extra time to weaker areas.";

    }

    else if (
        subjectCount <= 6
    ) {

        recommendation =
            "Use a structured rotation so every subject receives consistent attention.";

    }

    else {

        recommendation =
            "Divide your subjects into focused study blocks and prioritize your most important topics.";

    }


    /* =========================================
       RESET PREVIOUS TOPIC PROGRESS
    ========================================= */

    /*
       A newly generated plan is a new study
       plan, so old topic completion data
       should not carry over.
    */

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


    /* =========================================
       RESET TIMER STATE
    ========================================= */

    /*
       Do not allow an old running timer to
       continue into a completely new plan.
    */

    localStorage.removeItem(
        "studyMindTimerSeconds"
    );


    localStorage.setItem(
        "studyMindTimerRunning",
        "false"
    );


    localStorage.removeItem(
        "studyMindTimerEndTime"
    );


    /*
       Keep the user's previously selected
       timer duration if they already chose
       one. Otherwise use the first subject
       study duration as a sensible default.
    */

    const existingTimerDuration =
        Number(
            localStorage.getItem(
                "studyMindSelectedTimerSeconds"
            )
        );


    if (
        !Number.isFinite(
            existingTimerDuration
        ) ||
        existingTimerDuration <= 0
    ) {

        /*
           Store the study-hours value in
           minutes only when no timer duration
           has previously been selected.

           This does NOT force the dashboard
           timer to use this value forever;
           the user can change the timer there.
        */

        const defaultSessionMinutes =
            Math.max(
                30,
                Math.round(
                    (
                        Number(
                            studyHours
                        ) *
                        60
                    ) /
                    Math.max(
                        1,
                        subjects.length
                    )
                )
            );


        localStorage.setItem(
            "studyMindSelectedTimerSeconds",
            String(
                defaultSessionMinutes *
                60
            )
        );

    }


    /* =========================================
       CREATE PLAN HTML
    ========================================= */

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

                <span>
                    Exam
                </span>

                <strong>
                    ${escapeHTML(
                        examType
                    )}
                </strong>

            </div>


            <div>

                <span>
                    Days Left
                </span>

                <strong>
                    ${daysLeft}
                </strong>

            </div>


            <div>

                <span>
                    Daily Study
                </span>

                <strong>
                    ${recommendedHours} hrs
                </strong>

            </div>


            <div>

                <span>
                    Subjects
                </span>

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

                ${subjects.map(
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
                ).join("")}

            </div>


            <h3
                style="margin-top:25px;"
            >
                📖 Your Topics
            </h3>


            <div class="generated-subjects">

                ${topics.map(
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
                ).join("")}

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


    /* =========================================
       SHOW PLAN
    ========================================= */

    studyPlan.classList.remove(
        "hidden"
    );


    /* =========================================
       SAVE PLAN
    ========================================= */

    const planData = {

        examType:
            examType,

        examDate:
            examDate,

        subjects:
            subjects,

        topics:
            topics,

        studyHours:
            recommendedHours,

        difficulty:
            difficulty,

        daysLeft:
            daysLeft,

        createdAt:
            new Date().toISOString()

    };


    localStorage.setItem(
        "studyMindPlan",
        JSON.stringify(
            planData
        )
    );


    /*
       Keep a simple timestamp so the dashboard
       can tell that a new plan was generated.
    */

    localStorage.setItem(
        "studyMindPlanUpdatedAt",
        String(
            Date.now()
        )
    );


    /* =========================================
       SCROLL TO GENERATED PLAN
    ========================================= */

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

    /*
       Dashboard authentication is handled
       by dashboard.js / Supabase.

       We simply navigate to the dashboard.
    */

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
        value
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
   GLOBAL AI LIMIT HELPERS
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


/*
   Record exactly one AI question.

   dashboard.js can call this after a
   successful API response.
*/

function recordAIQuestion() {

    let count =
        getAIQuestionCount();


    if (
        count >= FREE_QUESTION_LIMIT
    ) {

        return false;

    }


    count++;


    localStorage.setItem(
        "aiQuestionCount",
        String(
            count
        )
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

    /*
       Sign out from Supabase if the client
       is available.

       This is important because removing
       localStorage alone does not actually
       sign the user out of Supabase.
    */

    try {

        if (
            typeof supabaseClient !==
            "undefined" &&
            supabaseClient &&
            supabaseClient.auth
        ) {

            const {
                error
            } =
                await supabaseClient.auth.signOut();


            if (error) {

                console.error(
                    "Supabase logout error:",
                    error
                );

            }

        }

    }

    catch (error) {

        console.error(
            "Logout error:",
            error
        );

    }


    /*
       Remove old/local login state.

       We deliberately DO NOT delete:
       - study plan
       - AI question count
       - theme
       - timer preferences

       This means the user's local study
       data remains available when they
       return.
    */

    localStorage.removeItem(
        "studyMindLoggedIn"
    );


    localStorage.removeItem(
        "isLoggedIn"
    );


    localStorage.removeItem(
        "currentUser"
    );


    /*
       Return to the welcome page.
    */

    window.location.href =
        "index.html";

}


/* =========================================
   EXPOSE FUNCTIONS GLOBALLY
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


/*
   Keep the limit available globally so
   dashboard.js can use the same value.
*/

window.FREE_QUESTION_LIMIT =
    FREE_QUESTION_LIMIT;
