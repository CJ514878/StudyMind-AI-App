/* =========================================
   STUDYMIND AI — DASHBOARD JAVASCRIPT
========================================= */


/* =========================================
   LOAD STUDY PLAN
========================================= */

let studyPlan =
    JSON.parse(
        localStorage.getItem("studyMindPlan")
    );


/* =========================================
   THEME
========================================= */

const themeButton =
    document.getElementById("themeButton");


if (themeButton) {

    const savedTheme =
        localStorage.getItem(
            "studyMindTheme"
        );


    if (savedTheme === "light") {

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
   DEFAULT DATA
========================================= */

if (!studyPlan) {

    studyPlan = {

        examType:
            "No exam selected",

        examDate:
            null,

        subjects:
            [],

        studyHours:
            0,

        difficulty:
            "balanced",

        daysLeft:
            0

    };

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
   COMPLETED SUBJECTS
========================================= */

let completedSubjects =
    JSON.parse(
        localStorage.getItem(
            "studyMindCompletedSubjects"
        )
    ) || [];


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
   INITIALIZE DASHBOARD
========================================= */

function initializeDashboard() {

    updateStatistics();

    renderSubjects();

    updateProgress();

    updateStreak();

    updateStudyScore();

    renderCalendar();

    renderSchedule();

    updateNextBooking();

}


/* =========================================
   STATISTICS
========================================= */

function updateStatistics() {

    const hours =
        Number(
            studyPlan.studyHours
        ) || 0;


    if (weeklyHours) {

        weeklyHours.textContent =
            hours * 7;

    }


    if (daysLeft) {

        daysLeft.textContent =
            calculateDaysLeft();

    }


    if (dailyGoal) {

        dailyGoal.textContent =
            `${hours} hrs`;

    }


    updateStudyScore();

}


/* =========================================
   CALCULATE DAYS LEFT
========================================= */

function calculateDaysLeft() {

    if (!studyPlan.examDate) {

        return 0;

    }


    const today =
        new Date();

    const exam =
        new Date(
            studyPlan.examDate
        );


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


    return Math.max(
        0,
        Math.ceil(
            (
                exam - today
            ) /
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
   SUBJECTS
========================================= */

function renderSubjects() {

    if (!subjectList) return;


    subjectList.innerHTML = "";


    const subjects =
        studyPlan.subjects || [];


    if (subjects.length === 0) {

        subjectList.innerHTML = `

            <div class="empty-state">

                <span>📚</span>

                <p>
                    No subjects yet.
                    Create a study plan to begin.
                </p>

            </div>

        `;

        return;

    }


    subjects.forEach(
        (subject, index) => {

            const completed =
                completedSubjects.includes(
                    subject
                );


            const subjectItem =
                document.createElement(
                    "div"
                );


            subjectItem.className =
                "subject-item";


            if (completed) {

                subjectItem.classList.add(
                    "completed"
                );

            }


            subjectItem.innerHTML = `

                <div class="subject-info">

                    <button
                        class="subject-check"
                        data-subject="${escapeHTML(subject)}"
                        aria-label="Complete ${escapeHTML(subject)}"
                    >
                        ${completed ? "✓" : ""}
                    </button>

                    <div>

                        <strong>
                            ${escapeHTML(subject)}
                        </strong>

                        <span>
                            ${completed
                                ? "Completed"
                                : "In progress"}
                        </span>

                    </div>

                </div>


                <span class="subject-number">
                    ${String(index + 1).padStart(2, "0")}
                </span>

            `;


            subjectList.appendChild(
                subjectItem
            );

        }
    );


    document
        .querySelectorAll(
            ".subject-check"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    toggleSubject(
                        button.dataset.subject
                    );

                }
            );

        });

}


/* =========================================
   TOGGLE SUBJECT
========================================= */

function toggleSubject(subject) {

    if (
        completedSubjects.includes(
            subject
        )
    ) {

        completedSubjects =
            completedSubjects.filter(
                item =>
                    item !== subject
            );

    }

    else {

        completedSubjects.push(
            subject
        );

    }


    localStorage.setItem(
        "studyMindCompletedSubjects",
        JSON.stringify(
            completedSubjects
        )
    );


    renderSubjects();

    updateProgress();

    updateStudyScore();

}


/* =========================================
   PROGRESS
========================================= */

function updateProgress() {

    const total =
        studyPlan.subjects
            ? studyPlan.subjects.length
            : 0;


    const completed =
        completedSubjects.filter(
            subject =>
                studyPlan.subjects &&
                studyPlan.subjects.includes(
                    subject
                )
        ).length;


    const percentage =
        total === 0
            ? 0
            : Math.round(
                (
                    completed /
                    total
                ) * 100
            );


    if (progressPercent) {

        progressPercent.textContent =
            `${percentage}%`;

    }


    if (progressCount) {

        progressCount.textContent =
            `${completed} of ${total} subjects completed`;

    }


    if (progressBar) {

        progressBar.style.width =
            `${percentage}%`;

    }

}


/* =========================================
   STREAK
========================================= */

function updateStreak() {

    if (streak) {

        streak.textContent =
            `${currentStreak} ${
                currentStreak === 1
                    ? "Day"
                    : "Days"
            }`;

    }

}


/* =========================================
   STUDY SCORE
========================================= */

function updateStudyScore() {

    const total =
        studyPlan.subjects
            ? studyPlan.subjects.length
            : 0;


    const completed =
        completedSubjects.filter(
            subject =>
                studyPlan.subjects &&
                studyPlan.subjects.includes(
                    subject
                )
        ).length;


    let score = 0;


    if (total > 0) {

        score =
            Math.round(
                (
                    completed /
                    total
                ) * 100
            );

    }


    if (studyScore) {

        studyScore.textContent =
            score;

    }


    if (scoreDisplay) {

        scoreDisplay.textContent =
            score;

    }


    if (scoreProgressBar) {

        scoreProgressBar.style.width =
            `${score}%`;

    }


    if (scoreMessage) {

        if (score === 0) {

            scoreMessage.textContent =
                "Start studying to build your score.";

        }

        else if (score < 40) {

            scoreMessage.textContent =
                "Good start. Keep building momentum.";

        }

        else if (score < 70) {

            scoreMessage.textContent =
                "You're making solid progress.";

        }

        else if (score < 100) {

            scoreMessage.textContent =
                "Great work. Keep going.";

        }

        else {

            scoreMessage.textContent =
                "Excellent! All subjects completed.";

        }

    }

}


/* =========================================
   CALENDAR
========================================= */

let calendarDate =
    new Date();


function renderCalendar() {

    if (
        !calendarDays ||
        !calendarMonth
    ) return;


    calendarDays.innerHTML =
        "";


    const year =
        calendarDate.getFullYear();

    const month =
        calendarDate.getMonth();


    const monthName =
        calendarDate.toLocaleDateString(
            "en-US",
            {
                month: "long",
                year: "numeric"
            }
        );


    calendarMonth.textContent =
        monthName;


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


    /* PREVIOUS MONTH */

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


    /* CURRENT MONTH */

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


        /* STUDY DAYS */

        if (
            studyPlan.examDate &&
            current <=
                new Date(
                    studyPlan.examDate
                ) &&
            current >=
                new Date()
        ) {

            day.classList.add(
                "study-day"
            );

        }


        /* EXAM DAY */

        if (
            studyPlan.examDate
        ) {

            const exam =
                new Date(
                    studyPlan.examDate
                );


            if (
                current.toDateString() ===
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


        /* COMPLETED INDICATOR */

        const subjectTotal =
            studyPlan.subjects
                ? studyPlan.subjects.length
                : 0;


        const completedTotal =
            completedSubjects.length;


        if (
            subjectTotal > 0 &&
            completedTotal === subjectTotal &&
            date % 2 === 0
        ) {

            day.classList.add(
                "completed-day"
            );

        }


        day.innerHTML = `

            <span class="day-number">
                ${date}
            </span>

        `;


        calendarDays.appendChild(
            day
        );

    }


    /* NEXT MONTH FILL */

    const totalCells =
        calendarDays.children.length;


    const remaining =
        42 - totalCells;


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
                calendarDate.getMonth() - 1
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
                calendarDate.getMonth() + 1
            );

            renderCalendar();

        }
    );

}


/* =========================================
   SCHEDULE
========================================= */

function renderSchedule() {

    if (!scheduleList) return;


    const subjects =
        studyPlan.subjects || [];


    if (subjects.length === 0) {

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


    const hours =
        Number(
            studyPlan.studyHours
        ) || 1;


    const sessionMinutes =
        Math.max(
            30,
            Math.floor(
                (
                    hours * 60
                ) /
                subjects.length
            )
        );


    subjects.forEach(
        (subject, index) => {

            const startHour =
                16 +
                Math.floor(
                    (
                        index *
                        sessionMinutes
                    ) / 60
                );


            const startMinute =
                (
                    index *
                    sessionMinutes
                ) % 60;


            const endTotal =
                startHour * 60 +
                startMinute +
                sessionMinutes;


            const endHour =
                Math.floor(
                    endTotal / 60
                );


            const endMinute =
                endTotal % 60;


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
                        ${index === 0
                            ? "FOCUS SESSION"
                            : "STUDY SESSION"}
                    </span>

                    <strong>
                        ${escapeHTML(subject)}
                    </strong>

                    <small>
                        ${sessionMinutes} minutes
                    </small>

                </div>

            `;


            scheduleList.appendChild(
                item
            );

        }
    );

}


/* =========================================
   NEXT BOOKING
========================================= */

function updateNextBooking() {

    if (
        !nextBooking ||
        !nextBookingTime
    ) return;


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
        new Date(now);


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
            next.getDate() + 1
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
                weekday: "long",
                month: "short",
                day: "numeric"
            }
        )} · ${formatTime(
            16,
            0
        )}`;

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


if (analyzeProgressButton) {

    analyzeProgressButton.addEventListener(
        "click",
        () => {

            const total =
                studyPlan.subjects
                    ? studyPlan.subjects.length
                    : 0;


            const completed =
                completedSubjects.length;


            let message;


            if (total === 0) {

                message =
                    "I don't have enough study data yet. Create a study plan first so I can analyze your progress.";

            }

            else if (completed === 0) {

                message =
                    "You have a fresh start. Begin with one focused study session today and mark the subject complete when you're finished.";

            }

            else if (
                completed < total
            ) {

                message =
                    `You've completed ${completed} of ${total} subjects. Keep your momentum by focusing on the next unfinished subject in your plan.`;

            }

            else {

                message =
                    "Excellent work! You've completed all your current subjects. Consider reviewing difficult topics and practicing questions before your exam.";

            }


            if (aiAdviceText) {

                aiAdviceText.textContent =
                    message;

            }

        }
    );

}


/* =========================================
   ASK AI
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


if (askAIButton) {

    askAIButton.addEventListener(
        "click",
        () => {

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


            const subjects =
                studyPlan.subjects || [];


            const firstSubject =
                subjects.length > 0
                    ? subjects[0]
                    : "your subjects";


            let response =
                `Based on your current plan, I recommend starting with ${firstSubject}. Break your session into focused blocks, practice what you've learned, and review anything you find difficult.`;


            const lowerQuestion =
                question.toLowerCase();


            if (
                lowerQuestion.includes(
                    "today"
                )
            ) {

                response =
                    subjects.length > 0
                        ? `For today, start with ${firstSubject}. Study for your planned daily goal, then move to the next subject if you still have time.`
                        : "Create a study plan first and I'll help you decide what to study today.";

            }


            if (
                lowerQuestion.includes(
                    "exam"
                )
            ) {

                const remaining =
                    calculateDaysLeft();


                response =
                    `You currently have ${remaining} day${remaining === 1 ? "" : "s"} until your exam. Focus on high-priority topics, active recall and practice questions rather than simply rereading notes.`;

            }


            if (aiResponse) {

                aiResponse.textContent =
                    response;

            }

        }
    );

}


/* =========================================
   HELPERS
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


    if (displayHour === 0) {

        displayHour = 12;

    }


    return `${displayHour}:${String(
        minute
    ).padStart(
        2,
        "0"
    )} ${suffix}`;

}


function escapeHTML(value) {

    return String(value)
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
   START DASHBOARD
========================================= */

initializeDashboard();