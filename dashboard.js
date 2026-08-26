/* =========================================
   STUDYMIND AI — DASHBOARD JAVASCRIPT
   VERSION: FREE AI LIMITS + AUTH + FIXED TIMER
========================================= */


/* =========================================
   AUTHENTICATION
========================================= */

let currentUser = null;
let isAuthenticated = false;

async function checkAuthentication() {

    try {

        const {
            data: { user },
            error
        } = await supabaseClient.auth.getUser();

        if (error || !user) {

            currentUser = null;
            isAuthenticated = false;

            return false;
        }

        currentUser = user;
        isAuthenticated = true;

        return true;

    }

    catch (error) {

        console.error(
            "Authentication check failed:",
            error
        );

        currentUser = null;
        isAuthenticated = false;

        return false;
    }
}


/* =========================================
   LOAD STUDY PLAN
========================================= */

let studyPlan = null;

try {

    studyPlan =
        JSON.parse(
            localStorage.getItem(
                "studyMindPlan"
            )
        );

}

catch (error) {

    console.error(
        "Could not load study plan:",
        error
    );

    studyPlan = null;

}


/* =========================================
   FREE AI LIMIT
========================================= */

const FREE_QUESTION_LIMIT = 5;

let aiQuestionCount =
    Number(
        localStorage.getItem(
            "aiQuestionCount"
        )
    ) || 0;


/* =========================================
   COMPLETED QUESTION TOPICS
========================================= */

let completedQuestionTopics = [];

try {

    completedQuestionTopics =
        JSON.parse(
            localStorage.getItem(
                "studyMindCompletedQuestionTopics"
            )
        ) || [];

}

catch (error) {

    completedQuestionTopics = [];

}

if (!Array.isArray(completedQuestionTopics)) {

    completedQuestionTopics = [];

}


/* =========================================
   TOPIC DATA
========================================= */

let completedTopics = [];

try {

    completedTopics =
        JSON.parse(
            localStorage.getItem(
                "studyMindCompletedTopics"
            )
        ) || [];

}

catch (error) {

    completedTopics = [];

}

if (!Array.isArray(completedTopics)) {

    completedTopics = [];

}


let currentTopicIndex =
    Number(
        localStorage.getItem(
            "studyMindCurrentTopicIndex"
        )
    ) || 0;


let topicQuestions = null;

try {

    topicQuestions =
        JSON.parse(
            localStorage.getItem(
                "studyMindTopicQuestions"
            )
        ) || null;

}

catch (error) {

    topicQuestions = null;

}


/* =========================================
   COMPLETED SUBJECTS
========================================= */

let completedSubjects = [];

try {

    completedSubjects =
        JSON.parse(
            localStorage.getItem(
                "studyMindCompletedSubjects"
            )
        ) || [];

}

catch (error) {

    completedSubjects = [];

}

if (!Array.isArray(completedSubjects)) {

    completedSubjects = [];

}


/* =========================================
   STUDY STREAK
========================================= */

let currentStreak =
    Number(
        localStorage.getItem(
            "studyMindStreak"
        )
    ) || 0;


/* =========================================
   DEFAULT STUDY PLAN
========================================= */

if (!studyPlan || typeof studyPlan !== "object") {

  const studyStartDate =
    new Date().toISOString().split("T")[0];

studyPlan = {

    examType: examType,

    examDate: examDate,

    subjects: subjects,

    topics: topics,

    studyHours: studyHours,

    difficulty: difficulty,

    daysLeft: daysLeft,

    /*
       The exact date this study plan
       was generated.
    */

    studyStartDate: studyStartDate

};

}


/* =========================================
   STUDY PLAN SAFETY
========================================= */

if (
    !Array.isArray(
        studyPlan.topics
    )
) {

    studyPlan.topics = [];

}


if (
    !Array.isArray(
        studyPlan.subjects
    )
) {

    studyPlan.subjects = [];

}


/* =========================================
   DASHBOARD ELEMENTS
========================================= */

const weeklyHours =
    document.getElementById(
        "weeklyHours"
    );

const daysLeft =
    document.getElementById(
        "daysLeft"
    );

const dailyGoal =
    document.getElementById(
        "dailyGoal"
    );

const studyScore =
    document.getElementById(
        "studyScore"
    );

const subjectList =
    document.getElementById(
        "subjectList"
    );

const topicList =
    document.getElementById(
        "topicList"
    );

const progressPercent =
    document.getElementById(
        "progressPercent"
    );

const progressCount =
    document.getElementById(
        "progressCount"
    );

const progressBar =
    document.getElementById(
        "progressBar"
    );

const streak =
    document.getElementById(
        "streak"
    );

const scoreDisplay =
    document.getElementById(
        "scoreDisplay"
    );

const scoreProgressBar =
    document.getElementById(
        "scoreProgressBar"
    );

const scoreMessage =
    document.getElementById(
        "scoreMessage"
    );

const calendarDays =
    document.getElementById(
        "calendarDays"
    );

const calendarMonth =
    document.getElementById(
        "calendarMonth"
    );

const nextBooking =
    document.getElementById(
        "nextBooking"
    );

const nextBookingTime =
    document.getElementById(
        "nextBookingTime"
    );

const scheduleList =
    document.getElementById(
        "scheduleList"
    );


/* =========================================
   CURRENT TOPIC ELEMENTS
========================================= */

const currentTopicName =
    document.getElementById(
        "currentTopicName"
    );

const currentTopicDescription =
    document.getElementById(
        "currentTopicDescription"
    );

const topicPosition =
    document.getElementById(
        "topicPosition"
    );

const topicStatusBadge =
    document.getElementById(
        "topicStatusBadge"
    );

const topicCompleteCheckbox =
    document.getElementById(
        "topicCompleteCheckbox"
    );

const topicCompletionMessage =
    document.getElementById(
        "topicCompletionMessage"
    );

const nextTopicMessage =
    document.getElementById(
        "nextTopicMessage"
    );


/* =========================================
   TOPIC QUESTION ELEMENTS
========================================= */

const topicQuestionsSection =
    document.getElementById(
        "topicQuestionsSection"
    ) ||
    document.getElementById(
        "topicQuestions"
    );

const topicQuestionsContainer =
    document.getElementById(
        "topicQuestionsContainer"
    ) ||
    document.getElementById(
        "topicQuestions"
    );

const submitTopicQuestions =
    document.getElementById(
        "submitTopicQuestions"
    );

const topicQuestionResult =
    document.getElementById(
        "topicQuestionResult"
    );


/* =========================================
   TIMER ELEMENTS
========================================= */

const studyTimer =
    document.getElementById(
        "studyTimer"
    );

const startTimerButton =
    document.getElementById(
        "startTimerButton"
    );

const pauseTimerButton =
    document.getElementById(
        "pauseTimerButton"
    );

const resetTimerButton =
    document.getElementById(
        "resetTimerButton"
    );


/*
   IMPORTANT:
   Your duration control can have any of
   these IDs. The code will find whichever
   one exists in your HTML.
*/

const timerDurationSelect =
    document.getElementById(
        "timerDuration"
    ) ||
    document.getElementById(
        "studyTimerDuration"
    ) ||
    document.getElementById(
        "timerMinutes"
    ) ||
    document.getElementById(
        "studyTime"
    );


/* =========================================
   TIMER DATA
========================================= */

/*
   DEFAULT SESSION IS NOW 60 MINUTES
*/

const DEFAULT_TIMER_SECONDS =
    60 * 60;


/*
   Load previously selected duration.
*/

let selectedTimerSeconds =
    Number(
        localStorage.getItem(
            "studyMindSelectedTimerSeconds"
        )
    );


/*
   If no valid saved duration exists,
   use 60 minutes.
*/

if (
    !Number.isFinite(
        selectedTimerSeconds
    ) ||
    selectedTimerSeconds <= 0
) {

    selectedTimerSeconds =
        DEFAULT_TIMER_SECONDS;

}


/*
   Load saved timer seconds.
*/

let timerSeconds =
    Number(
        localStorage.getItem(
            "studyMindTimerSeconds"
        )
    );


if (
    !Number.isFinite(
        timerSeconds
    ) ||
    timerSeconds < 0
) {

    timerSeconds =
        selectedTimerSeconds;

}


let timerInterval =
    null;

let timerRunning =
    false;

let timerEndTime =
    null;


/* =========================================
   TIMER SETUP
========================================= */

function setupTimer() {

    if (!studyTimer) {

        return;

    }


    const savedDuration =
        Number(
            localStorage.getItem(
                "studyMindSelectedTimerSeconds"
            )
        );


    if (
        Number.isFinite(
            savedDuration
        ) &&
        savedDuration > 0
    ) {

        selectedTimerSeconds =
            savedDuration;

    }


    /*
       If no duration has ever been saved,
       use 60 minutes.
    */

    if (
        !Number.isFinite(
            selectedTimerSeconds
        ) ||
        selectedTimerSeconds <= 0
    ) {

        selectedTimerSeconds =
            DEFAULT_TIMER_SECONDS;

        localStorage.setItem(
            "studyMindSelectedTimerSeconds",
            String(
                selectedTimerSeconds
            )
        );

    }


    syncTimerDurationControl();


    const savedSeconds =
        Number(
            localStorage.getItem(
                "studyMindTimerSeconds"
            )
        );


    const savedRunning =
        localStorage.getItem(
            "studyMindTimerRunning"
        ) === "true";


    const savedEndTime =
        Number(
            localStorage.getItem(
                "studyMindTimerEndTime"
            )
        );


    /*
       Recover a timer that was running
       before page refresh.
    */

    if (
        savedRunning &&
        Number.isFinite(
            savedEndTime
        ) &&
        savedEndTime > 0
    ) {

        timerEndTime =
            savedEndTime;


        const remaining =
            Math.max(
                0,
                Math.ceil(
                    (
                        timerEndTime -
                        Date.now()
                    ) / 1000
                )
            );


        if (remaining > 0) {

            timerSeconds =
                remaining;

            timerRunning =
                true;

            updateTimerDisplay();

            updateTimerButtons();

            startTimerInterval();

            setupTimerDurationControl();

            setupTimerButtons();

            return;

        }


        finishTimer();

        setupTimerDurationControl();

        setupTimerButtons();

        return;

    }


    /*
       Restore paused timer.
    */

    if (
        Number.isFinite(
            savedSeconds
        ) &&
        savedSeconds >= 0
    ) {

        timerSeconds =
            savedSeconds;

    }

    else {

        timerSeconds =
            selectedTimerSeconds;

    }


    timerRunning =
        false;

    timerEndTime =
        null;


    updateTimerDisplay();

    updateTimerButtons();

    setupTimerDurationControl();

    setupTimerButtons();

}


/* =========================================
   TIMER BUTTON SETUP
========================================= */

function setupTimerButtons() {

    if (
        startTimerButton &&
        !startTimerButton.dataset.timerReady
    ) {

        startTimerButton.addEventListener(
            "click",
            startTimer
        );

        startTimerButton.dataset.timerReady =
            "true";

    }


    if (
        pauseTimerButton &&
        !pauseTimerButton.dataset.timerReady
    ) {

        pauseTimerButton.addEventListener(
            "click",
            pauseTimer
        );

        pauseTimerButton.dataset.timerReady =
            "true";

    }


    if (
        resetTimerButton &&
        !resetTimerButton.dataset.timerReady
    ) {

        resetTimerButton.addEventListener(
            "click",
            resetTimer
        );

        resetTimerButton.dataset.timerReady =
            "true";

    }

}


/* =========================================
   TIMER DURATION CONTROL
========================================= */

function setupTimerDurationControl() {

    if (!timerDurationSelect) {

        return;

    }


    syncTimerDurationControl();


    if (
        timerDurationSelect.dataset
            .durationReady
    ) {

        return;

    }


    timerDurationSelect.addEventListener(
        "change",
        handleTimerDurationChange
    );


    timerDurationSelect.addEventListener(
        "input",
        handleTimerDurationChange
    );


    timerDurationSelect.dataset
        .durationReady =
            "true";

}


/* =========================================
   HANDLE DURATION CHANGE
========================================= */

function handleTimerDurationChange() {

    if (!timerDurationSelect) {

        return;

    }


    const value =
        Number(
            timerDurationSelect.value
        );


    if (
        !Number.isFinite(value) ||
        value <= 0
    ) {

        return;

    }


    /*
       Values such as:

       60
       75
       90
       120

       are treated as MINUTES.

       Very large values are treated
       as seconds.
    */

    let newDurationSeconds;


    if (value <= 300) {

        newDurationSeconds =
            value * 60;

    }

    else {

        newDurationSeconds =
            value;

    }


    selectedTimerSeconds =
        newDurationSeconds;


    localStorage.setItem(
        "studyMindSelectedTimerSeconds",
        String(
            selectedTimerSeconds
        )
    );


    /*
       Changing the duration resets
       the current timer.
    */

    clearInterval(
        timerInterval
    );

    timerInterval =
        null;

    timerRunning =
        false;

    timerEndTime =
        null;

    timerSeconds =
        selectedTimerSeconds;


    localStorage.setItem(
        "studyMindTimerSeconds",
        String(
            timerSeconds
        )
    );

    localStorage.setItem(
        "studyMindTimerRunning",
        "false"
    );

    localStorage.removeItem(
        "studyMindTimerEndTime"
    );


    if (studyTimer) {

        studyTimer.classList.remove(
            "timer-finished"
        );

        studyTimer.classList.remove(
            "timer-warning"
        );

    }


    updateTimerDisplay();

    updateTimerButtons();


    /*
       Update schedule when the user
       changes their preferred session time.
    */

    renderSchedule();

}


/* =========================================
   SYNC DURATION CONTROL
========================================= */

function syncTimerDurationControl() {

    if (!timerDurationSelect) {

        return;

    }


    const minutes =
        Math.round(
            selectedTimerSeconds /
            60
        );


    if (
        timerDurationSelect.tagName ===
        "SELECT"
    ) {

        const matchingOption =
            Array.from(
                timerDurationSelect.options
            ).find(
                option => {

                    const optionValue =
                        Number(
                            option.value
                        );

                    return (
                        optionValue ===
                        minutes
                    ) ||
                    (
                        optionValue ===
                        selectedTimerSeconds
                    );

                }
            );


        if (matchingOption) {

            timerDurationSelect.value =
                matchingOption.value;

        }

    }

    else {

        timerDurationSelect.value =
            minutes;

    }

}


/* =========================================
   START TIMER
========================================= */

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


    timerEndTime =
        Date.now() +
        (
            timerSeconds *
            1000
        );


    localStorage.setItem(
        "studyMindTimerRunning",
        "true"
    );


    localStorage.setItem(
        "studyMindTimerEndTime",
        String(
            timerEndTime
        )
    );


    localStorage.setItem(
        "studyMindTimerSeconds",
        String(
            timerSeconds
        )
    );


    if (studyTimer) {

        studyTimer.classList.remove(
            "timer-finished"
        );

    }


    updateTimerDisplay();

    updateTimerButtons();

    startTimerInterval();

}


/* =========================================
   TIMER INTERVAL
========================================= */

function startTimerInterval() {

    clearInterval(
        timerInterval
    );


    timerInterval =
        setInterval(
            () => {

                if (
                    !timerEndTime ||
                    !timerRunning
                ) {

                    return;

                }


                timerSeconds =
                    Math.max(
                        0,
                        Math.ceil(
                            (
                                timerEndTime -
                                Date.now()
                            ) / 1000
                        )
                    );


                localStorage.setItem(
                    "studyMindTimerSeconds",
                    String(
                        timerSeconds
                    )
                );


                updateTimerDisplay();


                if (
                    timerSeconds <= 0
                ) {

                    finishTimer();

                }

            },
            250
        );

}


/* =========================================
   PAUSE TIMER
========================================= */

function pauseTimer() {

    if (!timerRunning) {

        return;

    }


    if (timerEndTime) {

        timerSeconds =
            Math.max(
                0,
                Math.ceil(
                    (
                        timerEndTime -
                        Date.now()
                    ) / 1000
                )
            );

    }


    clearInterval(
        timerInterval
    );

    timerInterval =
        null;

    timerRunning =
        false;

    timerEndTime =
        null;


    localStorage.setItem(
        "studyMindTimerSeconds",
        String(
            timerSeconds
        )
    );

    localStorage.setItem(
        "studyMindTimerRunning",
        "false"
    );

    localStorage.removeItem(
        "studyMindTimerEndTime"
    );


    updateTimerDisplay();

    updateTimerButtons();

}


/* =========================================
   STOP TIMER
========================================= */

function stopTimer() {

    clearInterval(
        timerInterval
    );

    timerInterval =
        null;

    timerRunning =
        false;

    timerEndTime =
        null;


    localStorage.setItem(
        "studyMindTimerSeconds",
        String(
            timerSeconds
        )
    );

    localStorage.setItem(
        "studyMindTimerRunning",
        "false"
    );

    localStorage.removeItem(
        "studyMindTimerEndTime"
    );


    updateTimerButtons();

}


/* =========================================
   FINISH TIMER
========================================= */

function finishTimer() {

    clearInterval(
        timerInterval
    );

    timerInterval =
        null;

    timerSeconds =
        0;

    timerRunning =
        false;

    timerEndTime =
        null;


    localStorage.setItem(
        "studyMindTimerSeconds",
        "0"
    );

    localStorage.setItem(
        "studyMindTimerRunning",
        "false"
    );

    localStorage.removeItem(
        "studyMindTimerEndTime"
    );


    updateTimerDisplay();

    updateTimerButtons();

    handleTimerFinished();

}


/* =========================================
   RESET TIMER
========================================= */

function resetTimer() {

    clearInterval(
        timerInterval
    );

    timerInterval =
        null;

    timerRunning =
        false;

    timerEndTime =
        null;


    const savedDuration =
        Number(
            localStorage.getItem(
                "studyMindSelectedTimerSeconds"
            )
        );


    if (
        Number.isFinite(
            savedDuration
        ) &&
        savedDuration > 0
    ) {

        selectedTimerSeconds =
            savedDuration;

    }


    if (
        !Number.isFinite(
            selectedTimerSeconds
        ) ||
        selectedTimerSeconds <= 0
    ) {

        selectedTimerSeconds =
            DEFAULT_TIMER_SECONDS;

    }


    timerSeconds =
        selectedTimerSeconds;


    localStorage.setItem(
        "studyMindSelectedTimerSeconds",
        String(
            selectedTimerSeconds
        )
    );


    localStorage.setItem(
        "studyMindTimerSeconds",
        String(
            timerSeconds
        )
    );

    localStorage.setItem(
        "studyMindTimerRunning",
        "false"
    );

    localStorage.removeItem(
        "studyMindTimerEndTime"
    );


    if (studyTimer) {

        studyTimer.classList.remove(
            "timer-finished"
        );

        studyTimer.classList.remove(
            "timer-warning"
        );

    }


    updateTimerDisplay();

    updateTimerButtons();

}


/* =========================================
   UPDATE TIMER BUTTONS
========================================= */

function updateTimerButtons() {

    if (startTimerButton) {

        startTimerButton.disabled =
            timerRunning;


        if (
            timerSeconds <= 0
        ) {

            startTimerButton.innerHTML =
                "<span>✓</span> Timer Complete";

        }

        else if (
            timerRunning
        ) {

            startTimerButton.innerHTML =
                "<span>▶</span> Running...";

        }

        else if (
            timerSeconds <
            selectedTimerSeconds
        ) {

            startTimerButton.innerHTML =
                "<span>▶</span> Resume";

        }

        else {

            startTimerButton.innerHTML =
                "<span>▶</span> Start Timer";

        }

    }


    if (pauseTimerButton) {

        pauseTimerButton.disabled =
            !timerRunning;

    }

}


/* =========================================
   UPDATE TIMER DISPLAY
========================================= */

function updateTimerDisplay() {

    if (!studyTimer) {

        return;

    }


    const safeSeconds =
        Math.max(
            0,
            Number(
                timerSeconds
            ) || 0
        );


    const minutes =
        Math.floor(
            safeSeconds / 60
        );


    const seconds =
        safeSeconds %
        60;


    studyTimer.textContent =
        `${String(
            minutes
        ).padStart(
            2,
            "0"
        )}:${String(
            seconds
        ).padStart(
            2,
            "0"
        )}`;


    if (
        safeSeconds > 0 &&
        safeSeconds <= 60
    ) {

        studyTimer.classList.add(
            "timer-warning"
        );

    }

    else {

        studyTimer.classList.remove(
            "timer-warning"
        );

    }


    if (
        safeSeconds === 0
    ) {

        studyTimer.classList.add(
            "timer-finished"
        );

    }

    else {

        studyTimer.classList.remove(
            "timer-finished"
        );

    }

}


/* =========================================
   TIMER FINISHED MESSAGE
========================================= */

function handleTimerFinished() {

    if (studyTimer) {

        studyTimer.classList.add(
            "timer-finished"
        );

    }


    const completedMinutes =
        Math.round(
            selectedTimerSeconds /
            60
        );


    if (topicCompletionMessage) {

        topicCompletionMessage.textContent =
            `⏰ Your ${completedMinutes}-minute study session is complete. If you have finished the topic, tick the box below.`;

    }


    if (
        topicCompleteCheckbox
    ) {

        topicCompleteCheckbox.focus();

    }


    alert(
        `Your ${completedMinutes}-minute study session is complete! 🎉`
    );

}


/* =========================================
   CALENDAR
========================================= */

let calendarDate =
    new Date();
/* =========================================
   CALENDAR BREAK DAYS
========================================= */

/*
   StudyMind AI study cycle:

   6 study days
   1 break day
   6 study days
   1 break day
   etc.

   The cycle starts from the student's
   actual study-plan start date.
*/

function getStudyPlanStartDate() {

    /*
       First try to use a saved start date.
    */

    if (studyPlan.studyStartDate) {

        const start =
            new Date(
                studyPlan.studyStartDate
            );

        if (
            !isNaN(
                start.getTime()
            )
        ) {

            start.setHours(
                0,
                0,
                0,
                0
            );

            return start;

        }

    }


    /*
       If the study plan doesn't already
       have a start date, use today.

       Save it so the cycle does not
       shift every time the dashboard
       is opened.
    */

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );


    studyPlan.studyStartDate =
        today.toISOString()
            .split("T")[0];


    localStorage.setItem(
        "studyMindPlan",
        JSON.stringify(
            studyPlan
        )
    );


    return today;

}


function isCalendarBreakDay(date) {

    const startDate =
        getStudyPlanStartDate();

    const currentDate =
        new Date(date);

    startDate.setHours(
        0,
        0,
        0,
        0
    );

    currentDate.setHours(
        0,
        0,
        0,
        0
    );


    /*
       Before the study plan starts:
       not a study day and not a break day.
    */

    if (
        currentDate <
        startDate
    ) {

        return false;

    }


    /*
       The exam day itself is never
       treated as a break day.
    */

    if (
        studyPlan.examDate
    ) {

        const examDate =
            new Date(
                studyPlan.examDate
            );

        examDate.setHours(
            0,
            0,
            0,
            0
        );

        if (
            currentDate.getTime() ===
            examDate.getTime()
        ) {

            return false;

        }

    }


    /*
       Calculate the number of days
       since the study plan started.
    */

    const daysSinceStart =
        Math.floor(
            (
                currentDate.getTime() -
                startDate.getTime()
            ) /
            (
                1000 *
                60 *
                60 *
                24
            )
        );


    /*
       7-day cycle:

       0 = Study
       1 = Study
       2 = Study
       3 = Study
       4 = Study
       5 = Study
       6 = BREAK

       Then the cycle repeats.
    */

    return (
        daysSinceStart % 7 === 6
    );

}
function renderCalendar() {

    if (
        !calendarDays ||
        !calendarMonth
    ) {

        return;

    }


    calendarDays.innerHTML =
        "";


    const year =
        calendarDate.getFullYear();


    const month =
        calendarDate.getMonth();


    calendarMonth.textContent =
        calendarDate.toLocaleDateString(
            "en-US",
            {
                month:
                    "long",
                year:
                    "numeric"
            }
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


    const previousMonthDays =
        new Date(
            year,
            month,
            0
        ).getDate();


    for (
        let i = firstDay - 1;
        i >= 0;
        i--
    ) {

        const day =
            document.createElement(
                "div"
            );


        day.className =
            "calendar-day other-month";


        day.innerHTML = `
            <span>
                ${previousMonthDays - i}
            </span>
        `;


        calendarDays.appendChild(
            day
        );

    }


    for (
        let date = 1;
        date <= daysInMonth;
        date++
    ) {

        const day =
            document.createElement(
                "div"
            );


        day.className =
            "calendar-day";


        const current =
            new Date(
                year,
                month,
                date
            );


        const today =
            new Date();


        if (
            current.toDateString() ===
            today.toDateString()
        ) {

            day.classList.add(
                "today"
            );

        }


            /*
               Mark study-plan days.
            */

            const planStart =
                getStudyPlanStartDate();

            const normalizedCurrent =
                new Date(
                    current
                );

            normalizedCurrent.setHours(
                0,
                0,
                0,
                0
            );


          /*
   Mark study-plan days.
*/

const planStart =
    getStudyPlanStartDate();

const normalizedCurrent =
    new Date(current);

normalizedCurrent.setHours(
    0,
    0,
    0,
    0
);


/*
   Is this date inside the study plan?
*/

const isAfterPlanStart =
    normalizedCurrent >=
    planStart;


/*
   Check whether this is a break day.
*/

const isBreakDay =
    isCalendarBreakDay(
        normalizedCurrent
    );


/*
   Check whether this is the exam day.
*/

let isExamDay =
    false;

if (
    studyPlan.examDate
) {

    const exam =
        new Date(
            studyPlan.examDate
        );

    exam.setHours(
        0,
        0,
        0,
        0
    );

    isExamDay =
        normalizedCurrent.getTime() ===
        exam.getTime();

}


/*
   STUDY DAY
*/

if (
    isAfterPlanStart &&
    !isBreakDay &&
    !isExamDay
) {

    /*
       Don't show study days after
       the exam.
    */

    if (
        !studyPlan.examDate ||
        normalizedCurrent <=
            new Date(
                studyPlan.examDate
            )
    ) {

        day.classList.add(
            "study-day"
        );

    }

}


/*
   EXAM DAY
*/

if (
    isExamDay
) {

    day.classList.remove(
        "study-day"
    );

    day.classList.remove(
        "break-day"
    );

    day.classList.remove(
        "completed-day"
    );

    day.classList.add(
        "exam-day"
    );

}


/*
   BREAK DAY
*/

if (
    isBreakDay &&
    !isExamDay
) {

    day.classList.remove(
        "study-day"
    );

    day.classList.remove(
        "completed-day"
    );

    day.classList.add(
        "break-day"
    );

}

                    const exam =
                        new Date(
                            studyPlan.examDate
                        );

                    exam.setHours(
                        0,
                        0,
                        0,
                        0
                    );


                    if (
                        normalizedCurrent <=
                        exam
                    ) {

                        day.classList.add(
                            "study-day"
                        );

                    }


                    /*
                       Exam day overrides
                       the normal study day.
                    */

                    if (
                        normalizedCurrent
                            .toDateString() ===
                        exam.toDateString()
                    ) {

                        day.classList.remove(
                            "study-day"
                        );

                        day.classList.add(
                            "exam-day"
                        );

                    }

                }

                else {

                    /*
                       No exam date:
                       continue displaying the
                       study cycle indefinitely.
                    */

                    day.classList.add(
                        "study-day"
                    );

                }

            }


            /*
               Mark automatically scheduled
               break days.

               This is intentionally OUTSIDE
               the exam-date condition.
            */

            if (
                isCalendarBreakDay(
                    current
                )
            ) {

                day.classList.remove(
                    "study-day"
                );

                day.classList.remove(
                    "completed-day"
                );

                day.classList.remove(
                    "exam-day"
                );

                day.classList.add(
                    "break-day"
                );

            }

        const topicTotal =
            studyPlan.topics
                ? studyPlan.topics.length
                : 0;


        const completedTotal =
            completedTopics.filter(
                topic =>
                    studyPlan.topics &&
                    studyPlan.topics.includes(
                        topic
                    )
            ).length;


        if (
            topicTotal > 0 &&
            completedTotal ===
                topicTotal
        ) {

            day.classList.add(
                "completed-day"
            );

        }


    day.innerHTML = `
    <span class="day-number">
        ${date}
    </span>

    ${
        day.classList.contains("break-day")
            ? `
                <span class="break-label">
                    BREAK
                </span>
            `
            : ""
    }
`;


        calendarDays.appendChild(
            day
        );

    }


    const totalCells =
        calendarDays.children.length;


    const remaining =
        42 -
        totalCells;


    for (
        let i = 1;
        i <= remaining;
        i++
    ) {

        const day =
            document.createElement(
                "div"
            );


        day.className =
            "calendar-day other-month";


        day.innerHTML = `
            <span>
                ${i}
            </span>
        `;


        calendarDays.appendChild(
            day
        );

    }

}


/* =========================================
   CALENDAR NAVIGATION
========================================= */

const previousMonth =
    document.getElementById(
        "previousMonth"
    );

const nextMonth =
    document.getElementById(
        "nextMonth"
    );


if (previousMonth) {

    previousMonth.addEventListener(
        "click",
        () => {

            calendarDate.setMonth(
                calendarDate.getMonth() -
                    1
            );

            renderCalendar();

        }
    );

}


if (nextMonth) {

    nextMonth.addEventListener(
        "click",
        () => {

            calendarDate.setMonth(
                calendarDate.getMonth() +
                    1
            );

            renderCalendar();

        }
    );

}


/* =========================================
   CALCULATE DAYS LEFT
========================================= */

function calculateDaysLeft() {

    if (
        !studyPlan.examDate
    ) {

        return 0;

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
            studyPlan.examDate
        );


    exam.setHours(
        0,
        0,
        0,
        0
    );


    const difference =
        exam.getTime() -
        today.getTime();


    return Math.max(
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

}


/* =========================================
   SCHEDULE
========================================= */

function renderSchedule() {

    if (!scheduleList) {

        return;

    }


    const subjects =
        studyPlan.subjects || [];


    if (
        subjects.length === 0
    ) {

        scheduleList.innerHTML = `
            <div class="empty-schedule">
                Your daily study sessions
                will appear here.
            </div>
        `;

        return;

    }


    scheduleList.innerHTML =
        "";


    /*
       Total daily study time.
    */

    const hours =
        Number(
            studyPlan.studyHours
        ) || 0;


    const dailyMinutes =
        Math.max(
            0,
            Math.round(
                hours * 60
            )
        );


    if (
        dailyMinutes <= 0
    ) {

        scheduleList.innerHTML = `
            <div class="empty-schedule">
                Your daily study sessions
                will appear here.
            </div>
        `;

        return;

    }


    /*
       Preferred session length comes
       from the timer.

       Default = 60 minutes.
    */

    const savedTimerSeconds =
        Number(
            localStorage.getItem(
                "studyMindSelectedTimerSeconds"
            )
        );


    const preferredSessionMinutes =
        Number.isFinite(
            savedTimerSeconds
        ) &&
        savedTimerSeconds > 0
            ? Math.round(
                savedTimerSeconds /
                60
            )
            : 60;


    /*
       Never make a session longer than
       the entire daily goal.
    */

    const firstSessionMinutes =
        Math.min(
            preferredSessionMinutes,
            dailyMinutes
        );


    /*
       Build the day's sessions.

       Example:

       2h goal + 60m preference

       4:00–5:00
       5:15–6:15
    */

    let remainingMinutes =
        dailyMinutes;


    let sessionIndex =
        0;


    let currentStartMinutes =
        16 * 60;


    while (
        remainingMinutes > 0
    ) {

        const currentSessionMinutes =
            sessionIndex === 0
                ? firstSessionMinutes
                : Math.min(
                    preferredSessionMinutes,
                    remainingMinutes
                );


        const subject =
            subjects[
                sessionIndex %
                subjects.length
            ];


        const startTotal =
            currentStartMinutes;


        const endTotal =
            startTotal +
            currentSessionMinutes;


        const startHour =
            Math.floor(
                startTotal /
                60
            );


        const startMinute =
            startTotal %
            60;


        const endHour =
            Math.floor(
                endTotal /
                60
            );


        const endMinute =
            endTotal %
            60;


        const item =
            document.createElement(
                "div"
            );


        item.className =
            "schedule-item";


        item.innerHTML = `
            <div class="schedule-time">

                ${formatTime(
                    startHour,
                    startMinute
                )}

                <span>
                    ${formatTime(
                        endHour,
                        endMinute
                    )}
                </span>

            </div>

            <div class="schedule-line"></div>

            <div class="schedule-details">

                <span>
                    ${
                        sessionIndex === 0
                            ? "FOCUS SESSION"
                            : "STUDY SESSION"
                    }
                </span>

                <strong>
                    ${escapeHTML(
                        subject
                    )}
                </strong>

                <small>
                    ${currentSessionMinutes} minutes
                </small>

            </div>
        `;


        scheduleList.appendChild(
            item
        );


        remainingMinutes -=
            currentSessionMinutes;


        sessionIndex++;


        /*
           Add a 15-minute break between
           study sessions.

           No break is added after the
           final session.
        */

        if (
            remainingMinutes > 0
        ) {

            currentStartMinutes =
                endTotal +
                15;

        }

    }

}


/* =========================================
   NEXT BOOKING
========================================= */

function updateNextBooking() {

    if (
        !nextBooking ||
        !nextBookingTime
    ) {

        return;

    }


    const subjects =
        studyPlan.subjects || [];


    if (
        subjects.length === 0
    ) {

        nextBooking.textContent =
            "No upcoming session yet";


        nextBookingTime.textContent =
            "Create a study plan to populate your calendar.";

        return;

    }


    const now =
        new Date();


    const next =
        new Date(
            now
        );


    next.setHours(
        16,
        0,
        0,
        0
    );


    if (
        next <= now
    ) {

        next.setDate(
            next.getDate() +
                1
        );

    }


    const dayIndex =
        next.getDay();


    const subject =
        subjects[
            dayIndex %
            subjects.length
        ];


    nextBooking.textContent =
        `Study ${subject}`;


    nextBookingTime.textContent =
        `${next.toLocaleDateString(
            "en-US",
            {
                weekday:
                    "long",
                month:
                    "short",
                day:
                    "numeric"
            }
        )} · ${formatTime(
            16,
            0
        )}`;

}


/* =========================================
   CURRENT TOPIC
========================================= */

function renderCurrentTopic() {

    const topics =
        studyPlan.topics || [];


    if (
        topics.length === 0
    ) {

        if (currentTopicName) {

            currentTopicName.textContent =
                "No topics available";

        }

        if (
            currentTopicDescription
        ) {

            currentTopicDescription.textContent =
                "Create a study plan with topics to begin studying.";

        }

        if (topicPosition) {

            topicPosition.textContent =
                "0 / 0";

        }

        if (topicStatusBadge) {

            topicStatusBadge.textContent =
                "No Topic";

        }

        if (
            topicCompleteCheckbox
        ) {

            topicCompleteCheckbox.checked =
                false;

            topicCompleteCheckbox.disabled =
                true;

        }

        return;

    }


    if (
        currentTopicIndex < 0
    ) {

        currentTopicIndex =
            0;

    }


    if (
        currentTopicIndex >=
        topics.length
    ) {

        currentTopicIndex =
            topics.length - 1;

    }


    localStorage.setItem(
        "studyMindCurrentTopicIndex",
        String(
            currentTopicIndex
        )
    );


    const topic =
        topics[
            currentTopicIndex
        ];


    const isCompleted =
        completedTopics.includes(
            topic
        );


    if (currentTopicName) {

        currentTopicName.textContent =
            topic;

    }


    if (
        currentTopicDescription
    ) {

        currentTopicDescription.textContent =
            isCompleted
                ? "You've completed this topic. Review it or continue to the next topic."
                : "Focus on this topic during your current study session.";

    }


    if (topicPosition) {

        topicPosition.textContent =
            `${currentTopicIndex + 1} / ${topics.length}`;

    }


    if (topicStatusBadge) {

        topicStatusBadge.textContent =
            isCompleted
                ? "Completed"
                : "In Progress";

        topicStatusBadge.classList.toggle(
            "completed",
            isCompleted
        );

    }


    if (
        topicCompleteCheckbox
    ) {

        topicCompleteCheckbox.disabled =
            false;

        topicCompleteCheckbox.checked =
            isCompleted;

    }


    if (nextTopicMessage) {

        if (
            currentTopicIndex <
            topics.length - 1
        ) {

            const nextTopic =
                topics[
                    currentTopicIndex + 1
                ];

            nextTopicMessage.textContent =
                `Next: ${nextTopic}`;

        }

        else {

            nextTopicMessage.textContent =
                "You've reached the final topic.";

        }

    }

}


/* =========================================
   COMPLETE CURRENT TOPIC
========================================= */

function completeCurrentTopic() {

    const topics =
        studyPlan.topics || [];


    if (
        topics.length === 0
    ) {

        return;

    }


    const topic =
        topics[
            currentTopicIndex
        ];


    if (!topic) {

        return;

    }


    if (
        topicCompleteCheckbox &&
        topicCompleteCheckbox.checked
    ) {

        if (
            !completedTopics.includes(
                topic
            )
        ) {

            completedTopics.push(
                topic
            );

        }


        if (
            topicCompletionMessage
        ) {

            topicCompletionMessage.textContent =
                "✓ Topic marked as completed.";

        }


        if (
            currentTopicIndex <
            topics.length - 1
        ) {

            currentTopicIndex++;

            localStorage.setItem(
                "studyMindCurrentTopicIndex",
                String(
                    currentTopicIndex
                )
            );

        }

    }

    else {

        completedTopics =
            completedTopics.filter(
                item =>
                    item !== topic
            );


        if (
            topicCompletionMessage
        ) {

            topicCompletionMessage.textContent =
                "Topic marked as incomplete.";

        }

    }


    localStorage.setItem(
        "studyMindCompletedTopics",
        JSON.stringify(
            completedTopics
        )
    );


    updateDashboardProgress();

    renderCurrentTopic();

    renderCalendar();

}


/* =========================================
   TOPIC CHECKBOX LISTENER
========================================= */

if (
    topicCompleteCheckbox
) {

    topicCompleteCheckbox.addEventListener(
        "change",
        completeCurrentTopic
    );

}


/* =========================================
   DASHBOARD PROGRESS
========================================= */

function updateDashboardProgress() {

    const topics =
        studyPlan.topics || [];


    const total =
        topics.length;


    const completed =
        completedTopics.filter(
            topic =>
                topics.includes(
                    topic
                )
        ).length;


    const percent =
        total > 0
            ? Math.round(
                (
                    completed /
                    total
                ) *
                100
            )
            : 0;


    if (progressPercent) {

        progressPercent.textContent =
            `${percent}%`;

    }


    if (progressCount) {

        progressCount.textContent =
            `${completed} of ${total} topics`;

    }


    if (progressBar) {

        if (
            progressBar.tagName ===
            "CIRCLE"
        ) {

            const radius =
                Number(
                    progressBar.getAttribute(
                        "r"
                    )
                ) || 45;


            const circumference =
                2 *
                Math.PI *
                radius;


            progressBar.style.strokeDasharray =
                circumference;


            progressBar.style.strokeDashoffset =
                circumference -
                (
                    percent /
                    100 *
                    circumference
                );

        }

        else {

            progressBar.style.width =
                `${percent}%`;

        }

    }


    if (studyScore) {

        studyScore.textContent =
            `${percent}%`;

    }


    if (scoreDisplay) {

        scoreDisplay.textContent =
            `${percent}%`;

    }


    if (scoreProgressBar) {

        scoreProgressBar.style.width =
            `${percent}%`;

    }


    if (scoreMessage) {

        if (percent === 0) {

            scoreMessage.textContent =
                "Start studying to build your score.";

        }

        else if (percent < 50) {

            scoreMessage.textContent =
                "Good start. Keep building your momentum.";

        }

        else if (percent < 80) {

            scoreMessage.textContent =
                "You're making solid progress. Keep going.";

        }

        else if (percent < 100) {

            scoreMessage.textContent =
                "Excellent progress. You're almost there.";

        }

        else {

            scoreMessage.textContent =
                "Outstanding! You've completed your study plan.";

        }

    }


    if (streak) {

        streak.textContent =
            currentStreak;

    }

}


/* =========================================
   DASHBOARD BASIC STATS
========================================= */

function updateDashboardStats() {

    const hours =
        Number(
            studyPlan.studyHours
        ) || 0;


    const remainingDays =
        calculateDaysLeft();


    if (weeklyHours) {

        weeklyHours.textContent =
            `${Math.round(
                hours * 7
            )}h`;

    }


    if (dailyGoal) {

        dailyGoal.textContent =
            `${hours}h`;

    }


    if (daysLeft) {

        daysLeft.textContent =
            remainingDays;

    }


    if (streak) {

        streak.textContent =
            currentStreak;

    }

}


/* =========================================
   AI PROGRESS ANALYSIS
========================================= */

const analyzeProgressButton =
    document.getElementById(
        "analyzeProgressButton"
    );

const aiAdviceText =
    document.getElementById(
        "aiAdviceText"
    );


if (
    analyzeProgressButton
) {

    analyzeProgressButton.addEventListener(
        "click",
        () => {

            const topics =
                studyPlan.topics || [];


            const total =
                topics.length;


            const completed =
                completedTopics.filter(
                    topic =>
                        topics.includes(
                            topic
                        )
                ).length;


            let message;


            if (
                total === 0
            ) {

                message =
                    "I don't have enough study data yet. Create a study plan with topics first so I can analyze your progress.";

            }

            else if (
                completed === 0
            ) {

                message =
                    "You have a fresh start. Begin with the first topic in your plan and mark it complete when you're finished.";

            }

            else if (
                completed < total
            ) {

                message =
                    `You've completed ${completed} of ${total} topics. Keep your momentum by focusing on the next unfinished topic in your plan.`;

            }

            else {

                message =
                    "Excellent work! You've completed all your current topics. Consider reviewing difficult areas and practicing questions before your exam.";

            }


            if (aiAdviceText) {

                aiAdviceText.textContent =
                    message;

            }

        }
    );

}


/* =========================================
   GENERATE FIVE TOPIC QUESTIONS
========================================= */

async function generateQuestionsForTopic(
    topic
) {

    if (!topic) {

        return;

    }


    if (!isAuthenticated) {

        showAILoginMessage(
            topicQuestionsContainer
        );


        if (topicQuestionsSection) {

            topicQuestionsSection.style.display =
                "block";

        }

        return;

    }


    if (
        completedQuestionTopics.includes(
            topic
        )
    ) {

        showTopicQuestionsFinished(
            topic
        );

        return;

    }


    if (
        !topicQuestionsSection ||
        !topicQuestionsContainer
    ) {

        return;

    }


    topicQuestionsSection.style.display =
        "block";


    topicQuestionsContainer.innerHTML = `
        <p>
            🤖 StudyMind AI is preparing
            5 questions about
            <strong>
                ${escapeHTML(topic)}
            </strong>...
        </p>
    `;


    if (topicQuestionResult) {

        topicQuestionResult.textContent =
            "";

    }


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

                            message: `
You are StudyMind AI.

Create exactly 5 educational multiple-choice questions
for a student who has just studied this topic:

TOPIC:
${topic}

Requirements:
- Create exactly 5 questions.
- Each question must have exactly 4 answer options.
- Only one option should be correct.
- Questions should test understanding, not just memorization.
- Keep the questions appropriate for a secondary-school student.
- Return ONLY valid JSON.
- Do not include markdown.
- Use this exact format:

[
  {
    "question": "Question text",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "answer": 0
  }
]

The answer must be the zero-based number of the correct option.
`
                        })
                }
            );


        if (!response.ok) {

            throw new Error(
                "Could not generate questions."
            );

        }


        const data =
            await response.json();


        if (
            !data ||
            !data.reply
        ) {

            throw new Error(
                "Empty AI response."
            );

        }


        let questions;


        try {

            questions =
                JSON.parse(
                    cleanJSONResponse(
                        data.reply
                    )
                );

        }

        catch (parseError) {

            console.error(
                "Question JSON error:",
                parseError
            );

            throw new Error(
                "The AI returned invalid question data."
            );

        }


        if (
            !Array.isArray(
                questions
            ) ||
            questions.length <
                5
        ) {

            throw new Error(
                "The AI did not return 5 questions."
            );

        }


        questions =
            questions
                .slice(
                    0,
                    5
                )
                .filter(
                    question =>
                        question &&
                        typeof question.question ===
                            "string" &&
                        Array.isArray(
                            question.options
                        ) &&
                        question.options.length >=
                            4 &&
                        Number.isInteger(
                            Number(
                                question.answer
                            )
                        )
                );


        if (
            questions.length <
            5
        ) {

            throw new Error(
                "The AI returned incomplete question data."
            );

        }


        topicQuestions = {

            topic:
                topic,

            questions:
                questions,

            submitted:
                false

        };


        localStorage.setItem(
            "studyMindTopicQuestions",
            JSON.stringify(
                topicQuestions
            )
        );


        renderTopicQuestions(
            topicQuestions
        );

    }

    catch (error) {

        console.error(
            "Question generation error:",
            error
        );


        topicQuestionsContainer.innerHTML = `
            <div class="ai-response">

                <p>
                    I couldn't generate the questions
                    right now.
                </p>

                <button
                    class="secondary-button"
                    id="retryTopicQuestionsButton"
                >
                    Try Again
                </button>

            </div>
        `;


        const retryButton =
            document.getElementById(
                "retryTopicQuestionsButton"
            );


        if (retryButton) {

            retryButton.addEventListener(
                "click",
                () => {

                    generateQuestionsForTopic(
                        topic
                    );

                }
            );

        }

    }

}


/* =========================================
   RENDER TOPIC QUESTIONS
========================================= */

function renderTopicQuestions(
    questionData
) {

    if (
        !questionData ||
        !Array.isArray(
            questionData.questions
        )
    ) {

        return;

    }


    if (!topicQuestionsSection) {

        return;

    }


    topicQuestionsSection.style.display =
        "block";


    if (!topicQuestionsContainer) {

        return;

    }


    topicQuestionsContainer.innerHTML =
        "";


    questionData.questions
        .slice(
            0,
            5
        )
        .forEach(
            (
                question,
                index
            ) => {

                const questionBox =
                    document.createElement(
                        "div"
                    );


                questionBox.className =
                    "topic-question";


                const options =
                    Array.isArray(
                        question.options
                    )
                        ? question.options
                        : [];


                questionBox.innerHTML = `
                    <h4>
                        ${index + 1}.
                        ${escapeHTML(
                            question.question
                        )}
                    </h4>

                    <div>

                        ${options
                            .slice(
                                0,
                                4
                            )
                            .map(
                                (
                                    option,
                                    optionIndex
                                ) => `

                                    <label>

                                        <input
                                            type="radio"
                                            name="topic-question-${index}"
                                            value="${optionIndex}"
                                        >

                                        ${escapeHTML(
                                            option
                                        )}

                                    </label>

                                `
                            )
                            .join("")}

                    </div>
                `;


                topicQuestionsContainer.appendChild(
                    questionBox
                );

            }
        );


    if (
        submitTopicQuestions
    ) {

        submitTopicQuestions.disabled =
            false;

        submitTopicQuestions.textContent =
            "Submit Answers";

    }

}


/* =========================================
   SUBMIT TOPIC QUESTIONS
========================================= */

if (
    submitTopicQuestions
) {

    submitTopicQuestions.addEventListener(
        "click",
        () => {

            if (!isAuthenticated) {

                showAILoginMessage(
                    topicQuestionsContainer
                );

                return;

            }


            if (
                !topicQuestions ||
                !Array.isArray(
                    topicQuestions.questions
                )
            ) {

                return;

            }


            if (
                topicQuestions.submitted
            ) {

                return;

            }


            let score =
                0;


            let answered =
                0;


            topicQuestions.questions
                .slice(
                    0,
                    5
                )
                .forEach(
                    (
                        question,
                        index
                    ) => {

                        const selected =
                            document.querySelector(
                                `input[name="topic-question-${index}"]:checked`
                            );


                        const questionBox =
                            document.querySelectorAll(
                                ".topic-question"
                            )[index];


                        if (!selected) {

                            return;

                        }


                        answered++;


                        if (
                            Number(
                                selected.value
                            ) ===
                            Number(
                                question.answer
                            )
                        ) {

                            score++;


                            if (
                                questionBox
                            ) {

                                questionBox.classList.add(
                                    "question-correct"
                                );

                            }

                        }

                        else {

                            if (
                                questionBox
                            ) {

                                questionBox.classList.add(
                                    "question-wrong"
                                );

                            }

                        }

                    }
                );


            if (
                answered < 5
            ) {

                if (
                    topicQuestionResult
                ) {

                    topicQuestionResult.innerHTML =
                        "⚠️ Please answer all 5 questions before submitting.";

                }

                return;

            }


            topicQuestions.submitted =
                true;


            localStorage.setItem(
                "studyMindTopicQuestions",
                JSON.stringify(
                    topicQuestions
                )
            );


            if (
                !completedQuestionTopics.includes(
                    topicQuestions.topic
                )
            ) {

                completedQuestionTopics.push(
                    topicQuestions.topic
                );

            }


            localStorage.setItem(
                "studyMindCompletedQuestionTopics",
                JSON.stringify(
                    completedQuestionTopics
                )
            );


            document
                .querySelectorAll(
                    "#topicQuestions input, #topicQuestionsSection input"
                )
                .forEach(
                    input => {

                        input.disabled =
                            true;

                    }
                );


            submitTopicQuestions.disabled =
                true;


            submitTopicQuestions.textContent =
                "✓ Questions Completed";


            if (
                topicQuestionResult
            ) {

                topicQuestionResult.innerHTML = `
                    🧠 You scored
                    <strong>
                        ${score}/5
                    </strong>
                    on the
                    ${escapeHTML(
                        topicQuestions.topic
                    )}
                    knowledge check.

                    <br><br>

                    🎉 You've completed your
                    5-question knowledge check
                    for this topic.

                    <br>

                    <strong>
                        Want unlimited practice?
                    </strong>
                    Explore StudyMind AI Premium.
                `;

            }

        }
    );

}


/* =========================================
   TOPIC QUESTIONS FINISHED
========================================= */

function showTopicQuestionsFinished(
    topic
) {

    if (!topicQuestionsSection) {

        return;

    }


    topicQuestionsSection.style.display =
        "block";


    if (
        topicQuestionsContainer
    ) {

        topicQuestionsContainer.innerHTML = `
            <div class="ai-limit-message">

                <h3>
                    🎉 Knowledge Check Completed
                </h3>

                <p>
                    You've already completed the
                    5-question knowledge check for
                    <strong>
                        ${escapeHTML(topic)}
                    </strong>.
                </p>

                <p>
                    There are no more free questions
                    for this topic.
                </p>

                <button
                    class="premium-button"
                    onclick="openPremiumOffer()"
                >
                    💎 Explore Premium
                </button>

            </div>
        `;

    }


    if (
        submitTopicQuestions
    ) {

        submitTopicQuestions.disabled =
            true;

    }

}


/* =========================================
   ASK STUDYMIND AI
========================================= */

const askAIButton =
    document.getElementById(
        "askAIButton"
    );

const aiQuestion =
    document.getElementById(
        "aiQuestion"
    );

const aiResponse =
    document.getElementById(
        "aiResponse"
    );


/* =========================================
   ASK AI EVENT
========================================= */

if (
    askAIButton
) {

    askAIButton.addEventListener(
        "click",
        async () => {

            if (!isAuthenticated) {

                showAILoginMessage(
                    aiResponse
                );

                return;

            }


            const question =
                aiQuestion
                    ? aiQuestion.value.trim()
                    : "";


            if (!question) {

                if (aiResponse) {

                    aiResponse.textContent =
                        "Please enter a question first.";

                }

                return;

            }


            if (
                aiQuestionCount >=
                FREE_QUESTION_LIMIT
            ) {

                showAskAILimitMessage();

                return;

            }


            askAIButton.disabled =
                true;


            askAIButton.textContent =
                "⏳ Thinking...";


            if (aiResponse) {

                aiResponse.textContent =
                    "StudyMind AI is thinking...";

            }


            try {

                const subjects =
                    studyPlan.subjects ||
                    [];


                const topics =
                    studyPlan.topics ||
                    [];


                const hours =
                    Number(
                        studyPlan.studyHours
                    ) || 0;


                const examDate =
                    studyPlan.examDate ||
                    "No exam date set";


                const remainingDays =
                    calculateDaysLeft();


                const totalTopics =
                    topics.length;


                const completedTopicCount =
                    completedTopics.filter(
                        topic =>
                            topics.includes(
                                topic
                            )
                    ).length;


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

                                    message: `
You are helping a student using StudyMind AI.

STUDENT'S CURRENT STUDY INFORMATION:

Subjects:
${
    subjects.length > 0
        ? subjects.join(", ")
        : "No subjects available"
}

Topics:
${
    topics.length > 0
        ? topics.join(", ")
        : "No topics available"
}

Daily study hours:
${hours}

Exam date:
${examDate}

Days remaining:
${remainingDays}

Topics completed:
${completedTopicCount} of ${totalTopics}

STUDENT'S QUESTION:
${question}

Give the student a useful, clear and practical answer.

Use their study information when relevant.

If they ask what they should study today,
give a specific recommendation based on their
subjects and progress.

Do not invent subjects, topics, exam dates or progress
that are not provided.

Keep the answer readable and appropriately concise.
`
                                })

                        }
                    );


                if (!response.ok) {

                    let errorMessage =
                        "Something went wrong.";


                    try {

                        const errorData =
                            await response.json();


                        if (
                            errorData &&
                            errorData.error
                        ) {

                            errorMessage =
                                errorData.error;

                        }

                    }

                    catch (error) {

                        console.error(
                            "Could not read API error:",
                            error
                        );

                    }


                    throw new Error(
                        errorMessage
                    );

                }


                const data =
                    await response.json();


                if (
                    !data ||
                    !data.reply
                ) {

                    throw new Error(
                        "The AI returned an empty response."
                    );

                }


                aiQuestionCount++;


                localStorage.setItem(
                    "aiQuestionCount",
                    String(
                        aiQuestionCount
                    )
                );


                if (aiResponse) {

                    aiResponse.innerHTML =
                        renderAIResponse(
                            data.reply
                        );


                    if (
                        typeof renderMathInElement ===
                        "function"
                    ) {

                        renderMathInElement(
                            aiResponse,
                            {

                                delimiters: [

                                    {
                                        left:
                                            "\\[",
                                        right:
                                            "\\]",
                                        display:
                                            true
                                    },

                                    {
                                        left:
                                            "\\(",
                                        right:
                                            "\\)",
                                        display:
                                            false
                                    }

                                ]

                            }
                        );

                    }

                }


                if (
                    aiQuestionCount >=
                    FREE_QUESTION_LIMIT
                ) {

                    showAskAILimitMessage(
                        true
                    );

                }

            }

            catch (error) {

                console.error(
                    "StudyMind AI error:",
                    error
                );


                if (aiResponse) {

                    aiResponse.textContent =
                        error.message ||
                        "Sorry, I couldn't connect to StudyMind AI right now. Please try again in a moment.";

                }

            }

            finally {

                askAIButton.disabled =
                    aiQuestionCount >=
                    FREE_QUESTION_LIMIT;


                if (
                    aiQuestionCount >=
                    FREE_QUESTION_LIMIT
                ) {

                    askAIButton.textContent =
                        "🔒 Free Limit Reached";

                }

                else {

                    askAIButton.textContent =
                        "🤖 Ask AI";

                }

            }

        }
    );

}


/* =========================================
   AI AUTHENTICATION UI
========================================= */

function setupAIAuthenticationUI() {

    if (!isAuthenticated) {

        if (askAIButton) {

            askAIButton.disabled =
                true;

            askAIButton.classList.add(
                "ai-locked"
            );

            askAIButton.textContent =
                "🔒 Login Required";

        }


        if (aiQuestion) {

            aiQuestion.disabled =
                true;

            aiQuestion.placeholder =
                "Login to use StudyMind AI";

            aiQuestion.classList.add(
                "ai-locked"
            );

        }


        if (
            submitTopicQuestions
        ) {

            submitTopicQuestions.disabled =
                true;

        }


        return;

    }


    if (aiQuestion) {

        aiQuestion.disabled =
            false;

        aiQuestion.classList.remove(
            "ai-locked"
        );

    }


    if (askAIButton) {

        askAIButton.classList.remove(
            "ai-locked"
        );

    }


    if (
        aiQuestionCount >=
        FREE_QUESTION_LIMIT
    ) {

        if (askAIButton) {

            askAIButton.disabled =
                true;

            askAIButton.textContent =
                "🔒 Free Limit Reached";

        }

    }

}


/* =========================================
   LOGIN MESSAGE
========================================= */

function showAILoginMessage(
    container
) {

    if (!container) {

        return;

    }


    container.innerHTML = `
        <div class="ai-login-message">

            <h3>
                🔐 Login Required
            </h3>

            <p>
                You must be logged in to interact
                with StudyMind AI.
            </p>

            <p>
                Log in or create an account to
                access AI-powered study assistance.
            </p>

            <button
                class="premium-button"
                onclick="window.location.href='login.html'"
            >
                🔑 Login
            </button>

        </div>
    `;

}


/* =========================================
   ASK AI LIMIT MESSAGE
========================================= */

function showAskAILimitMessage(
    afterAnswer = false
) {

    if (!aiResponse) {

        return;

    }


    const currentAnswer =
        afterAnswer
            ? aiResponse.innerHTML
            : "";


    aiResponse.innerHTML = `

        ${
            currentAnswer
                ? `
                    <div class="ai-last-answer">
                        ${currentAnswer}
                    </div>

                    <hr>
                `
                : ""
        }

        <div class="ai-limit-message">

            <h3>
                🎉 You've used all 5 free AI questions
            </h3>

            <p>
                You've reached the free StudyMind AI
                limit.
            </p>

            <p>
                Want to keep asking questions,
                get more practice and unlock
                additional AI features?
            </p>

            <button
                class="premium-button"
                onclick="openPremiumOffer()"
            >
                💎 Explore Premium
            </button>

        </div>
    `;


    if (askAIButton) {

        askAIButton.disabled =
            true;

        askAIButton.textContent =
            "🔒 Free Limit Reached";

    }


    if (aiQuestion) {

        aiQuestion.disabled =
            true;

    }

}


/* =========================================
   PREMIUM OFFER
========================================= */

function openPremiumOffer() {

    const existing =
        document.getElementById(
            "studyMindPremiumModal"
        );


    if (existing) {

        existing.remove();

    }


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "studyMindPremiumModal";


    modal.innerHTML = `

        <div
            style="
                position:fixed;
                inset:0;
                background:rgba(0,0,0,.72);
                display:flex;
                align-items:center;
                justify-content:center;
                z-index:99999;
                padding:20px;
            "
        >

            <div
                style="
                    max-width:460px;
                    width:100%;
                    padding:32px;
                    border-radius:24px;
                    background:#0f172a;
                    color:white;
                    border:1px solid rgba(96,165,250,.25);
                    box-shadow:0 25px 70px rgba(0,0,0,.45);
                    text-align:center;
                "
            >

                <div
                    style="
                        font-size:48px;
                        margin-bottom:10px;
                    "
                >
                    💎
                </div>

                <h2>
                    Upgrade to StudyMind AI Premium
                </h2>

                <p
                    style="
                        opacity:.75;
                        line-height:1.7;
                    "
                >
                    You've reached your free AI limit.
                    Premium will give you access to
                    more AI questions and additional
                    StudyMind AI features.
                </p>

                <button
                    id="premiumComingSoonButton"
                    class="premium-button"
                    style="
                        width:100%;
                        margin-top:18px;
                    "
                >
                    🚀 Explore Premium
                </button>

                <button
                    id="closePremiumButton"
                    style="
                        margin-top:12px;
                        background:transparent;
                        border:0;
                        color:#94a3b8;
                        cursor:pointer;
                        padding:10px;
                    "
                >
                    Maybe Later
                </button>

            </div>

        </div>
    `;


    document.body.appendChild(
        modal
    );


    const closeButton =
        document.getElementById(
            "closePremiumButton"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            () => {

                modal.remove();

            }
        );

    }


    const premiumButton =
        document.getElementById(
            "premiumComingSoonButton"
        );


    if (premiumButton) {

        premiumButton.addEventListener(
            "click",
            () => {

                alert(
                    "Premium is coming soon! 🚀"
                );

            }
        );

    }

}


/* =========================================
   CLEAN AI JSON
========================================= */

function cleanJSONResponse(
    text
) {

    let cleaned =
        String(text)
            .trim();


    cleaned =
        cleaned.replace(
            /^```json\s*/i,
            ""
        );


    cleaned =
        cleaned.replace(
            /^```\s*/i,
            ""
        );


    cleaned =
        cleaned.replace(
            /\s*```$/i,
            ""
        );


    const firstBracket =
        cleaned.indexOf(
            "["
        );


    const lastBracket =
        cleaned.lastIndexOf(
            "]"
        );


    if (
        firstBracket !== -1 &&
        lastBracket !== -1
    ) {

        cleaned =
            cleaned.substring(
                firstBracket,
                lastBracket + 1
            );

    }


    return cleaned.trim();

}


/* =========================================
   RENDER AI RESPONSE
========================================= */

function renderAIResponse(
    text
) {

    if (!text) {

        return "";

    }


    const escape =
        str =>
            String(str)
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


    const mathBlocks =
        [];


    text =
        text.replace(
            /\\\[([\s\S]*?)\\\]/g,
            match => {

                const index =
                    mathBlocks.length;


                mathBlocks.push(
                    match
                );


                return `___MATH_BLOCK_${index}___`;

            }
        );


    text =
        text.replace(
            /\\\(([\s\S]*?)\\\)/g,
            match => {

                const index =
                    mathBlocks.length;


                mathBlocks.push(
                    match
                );


                return `___MATH_INLINE_${index}___`;

            }
        );


    text =
        escape(
            text
        );


    text =
        text.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );


    text =
        text.replace(
            /(?<!\*)\*([^*\n]+)\*(?!\*)/g,
            "<em>$1</em>"
        );


    text =
        text.replace(
            /^### (.*)$/gm,
            "<h4>$1</h4>"
        );


    text =
        text.replace(
            /^## (.*)$/gm,
            "<h3>$1</h3>"
        );


    text =
        text.replace(
            /^# (.*)$/gm,
            "<h2>$1</h2>"
        );


    text =
        text.replace(
            /(?:^|\n)[ \t]*[-*][ \t]+(.+)(?=\n|$)/g,
            "\n<li>$1</li>"
        );


    text =
        text.replace(
            /((?:<li>.*?<\/li>\s*)+)/gs,
            "<ul>$1</ul>"
        );


    text =
        text.replace(
            /(?:^|\n)[ \t]*\d+\.[ \t]+(.+)(?=\n|$)/g,
            "\n<li>$1</li>"
        );


    text =
        text.replace(
            /\n{2,}/g,
            "<br><br>"
        );


    text =
        text.replace(
            /\n/g,
            "<br>"
        );


    mathBlocks.forEach(
        (
            math,
            index
        ) => {

            text =
                text.replace(
                    `___MATH_BLOCK_${index}___`,
                    math
                );


            text =
                text.replace(
                    `___MATH_INLINE_${index}___`,
                    math
                );

        }
    );


    return text;

}


/* =========================================
   FORMAT TIME
========================================= */

function formatTime(
    hour,
    minute
) {

    const suffix =
        hour >= 12
            ? "PM"
            : "AM";


    let displayHour =
        hour % 12;


    if (
        displayHour === 0
    ) {

        displayHour =
            12;

    }


    return `${displayHour}:${String(
        minute
    ).padStart(
        2,
        "0"
    )} ${suffix}`;

}


/* =========================================
   ESCAPE HTML
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
   ESCAPE JAVASCRIPT STRING
========================================= */

function escapeJS(
    value
) {

    return String(
        value
    )
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /'/g,
            "\\'"
        )
        .replace(
            /\r?\n/g,
            "\\n"
        );

}


/* =========================================
   INITIALIZE DASHBOARD
========================================= */

function initializeDashboard() {

    console.log(
        "StudyMind AI dashboard initialized."
    );


    /*
       Refresh local data in case another
       page updated the study plan.
    */

    try {

        const savedPlan =
            JSON.parse(
                localStorage.getItem(
                    "studyMindPlan"
                )
            );


        if (
            savedPlan &&
            typeof savedPlan ===
                "object"
        ) {

            studyPlan =
                savedPlan;

        }

    }

    catch (error) {

        console.error(
            "Could not refresh study plan:",
            error
        );

    }


    if (
        !Array.isArray(
            studyPlan.subjects
        )
    ) {

        studyPlan.subjects =
            [];

    }


    if (
        !Array.isArray(
            studyPlan.topics
        )
    ) {

        studyPlan.topics =
            [];

    }


    /*
       Make sure a new installation
       starts at 60 minutes.
    */

    const savedDuration =
        Number(
            localStorage.getItem(
                "studyMindSelectedTimerSeconds"
            )
        );


    if (
        !Number.isFinite(
            savedDuration
        ) ||
        savedDuration <= 0
    ) {

        localStorage.setItem(
            "studyMindSelectedTimerSeconds",
            String(
                DEFAULT_TIMER_SECONDS
            )
        );

    }


    /*
       Render dashboard.
    */

    updateDashboardStats();

    updateDashboardProgress();

    renderCurrentTopic();

    renderCalendar();

    renderSchedule();

    updateNextBooking();

    setupTimer();

    setupAIAuthenticationUI();


    /*
       Restore previously generated
       topic questions when possible.
    */

    if (
        topicQuestions &&
        topicQuestions.topic &&
        Array.isArray(
            topicQuestions.questions
        )
    ) {

        if (
            completedQuestionTopics.includes(
                topicQuestions.topic
            )
        ) {

            showTopicQuestionsFinished(
                topicQuestions.topic
            );

        }

        else {

            renderTopicQuestions(
                topicQuestions
            );

        }

    }


    /*
       If the current topic has already
       been completed, update the UI.
    */

    renderCurrentTopic();

}


/* =========================================
   START DASHBOARD
========================================= */

async function startDashboard() {

    await checkAuthentication();

    initializeDashboard();

}


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
