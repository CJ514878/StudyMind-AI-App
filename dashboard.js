/* =========================================================
   STUDYMIND AI — DASHBOARD JAVASCRIPT
   COMPLETE REPLACEMENT
   Matches dashboard.html exactly
========================================================= */


/* =========================================================
   CONFIGURATION
========================================================= */

const FREE_QUESTION_LIMIT = 5;

const DEFAULT_TIMER_MINUTES = 25;
const DEFAULT_TIMER_SECONDS = DEFAULT_TIMER_MINUTES * 60;

const PLAN_KEY = "studyMindPlan";
const COMPATIBILITY_PLAN_KEY = "studyData";

const COMPLETED_TOPICS_KEY = "studyMindCompletedTopics";
const COMPLETED_QUESTIONS_KEY = "studyMindCompletedQuestionTopics";
const CURRENT_TOPIC_KEY = "studyMindCurrentTopicIndex";
const TOPIC_QUESTIONS_KEY = "studyMindTopicQuestions";

const TIMER_SECONDS_KEY = "studyMindTimerSeconds";
const TIMER_DURATION_KEY = "studyMindSelectedTimerSeconds";
const TIMER_RUNNING_KEY = "studyMindTimerRunning";

const THEME_KEY = "studyMindTheme";

const AI_QUESTION_COUNT_KEY = "aiQuestionCount";

const STREAK_KEY = "studyMindStreak";

const DAY_MS = 24 * 60 * 60 * 1000;


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentUser = null;
let studyPlan = null;

let completedTopics = [];
let completedQuestionTopics = [];

let currentTopicIndex = 0;

let topicQuestions = {};

let calendarDate = new Date();

let selectedTimerSeconds = DEFAULT_TIMER_SECONDS;
let timerSeconds = DEFAULT_TIMER_SECONDS;

let timerRunning = false;
let timerInterval = null;

let challengeCompleted = false;


/* =========================================================
   ELEMENT HELPER
========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   SAFE STORAGE HELPERS
========================================================= */

function loadJSON(key, fallback = null) {

    try {

        const value = localStorage.getItem(key);

        if (!value) {
            return fallback;
        }

        return JSON.parse(value);

    } catch (error) {

        console.warn(
            `StudyMind: Could not read ${key}`,
            error
        );

        return fallback;
    }
}


function saveJSON(key, value) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

    } catch (error) {

        console.warn(
            `StudyMind: Could not save ${key}`,
            error
        );
    }
}


function loadArray(key) {

    const value = loadJSON(key, []);

    return Array.isArray(value) ? value : [];
}


function loadObject(key) {

    const value = loadJSON(key, {});

    return value &&
        typeof value === "object" &&
        !Array.isArray(value)
        ? value
        : {};
}


function positiveNumber(value, fallback) {

    const number = Number(value);

    return Number.isFinite(number) && number > 0
        ? number
        : fallback;
}


/* =========================================================
   DATE HELPERS
========================================================= */

function dateKey(date = new Date()) {

    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function parseDate(value) {

    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
}


function startOfDay(date) {

    const result = new Date(date);

    result.setHours(0, 0, 0, 0);

    return result;
}


function daysBetween(a, b) {

    const first = startOfDay(a);
    const second = startOfDay(b);

    return Math.round(
        (second - first) / DAY_MS
    );
}


function formatDate(date) {

    if (!date) {
        return "";
    }

    return date.toLocaleDateString(
        undefined,
        {
            weekday: "short",
            month: "short",
            day: "numeric"
        }
    );
}


function formatMonthYear(date) {

    return date.toLocaleDateString(
        undefined,
        {
            month: "long",
            year: "numeric"
        }
    );
}


/* =========================================================
   TEXT HELPERS
========================================================= */

function cleanText(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value).trim();
}


function escapeHTML(value) {

    return cleanText(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function slugify(value) {

    return cleanText(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}


/* =========================================================
   TOPIC NORMALIZATION
========================================================= */

function normalizeSubject(subject, index = 0) {

    if (typeof subject === "string") {

        return {
            name: subject.trim(),
            index
        };
    }

    if (subject && typeof subject === "object") {

        return {
            name:
                cleanText(
                    subject.name ||
                    subject.subject ||
                    subject.title ||
                    subject.label ||
                    `Subject ${index + 1}`
                ),

            index
        };
    }

    return {
        name: `Subject ${index + 1}`,
        index
    };
}


function normalizeTopic(topic, index = 0, subjects = []) {

    if (typeof topic === "string") {

        return {
            id: `${slugify(topic)}-${index}`,
            name: topic.trim(),
            description:
                `Study ${topic.trim()} and complete the knowledge check.`,
            subject:
                subjects.length
                    ? subjects[index % subjects.length]
                    : "",
            index
        };
    }

    if (topic && typeof topic === "object") {

        const name = cleanText(
            topic.name ||
            topic.topic ||
            topic.title ||
            topic.label ||
            `Topic ${index + 1}`
        );

        return {
            id:
                cleanText(
                    topic.id ||
                    topic.key
                ) ||
                `${slugify(name)}-${index}`,

            name,

            description:
                cleanText(
                    topic.description ||
                    topic.desc ||
                    topic.details
                ) ||
                `Study ${name} and complete the knowledge check.`,

            subject:
                cleanText(
                    topic.subject ||
                    topic.subjectName ||
                    topic.course
                ) ||
                (
                    subjects.length
                        ? subjects[index % subjects.length]
                        : ""
                ),

            index
        };
    }

    return {
        id: `topic-${index}`,
        name: `Topic ${index + 1}`,
        description:
            `Study Topic ${index + 1} and complete the knowledge check.`,
        subject:
            subjects.length
                ? subjects[index % subjects.length]
                : "",
        index
    };
}


/* =========================================================
   LOAD STUDY PLAN
========================================================= */

function loadStudyPlan() {

    let savedPlan = loadJSON(
        PLAN_KEY,
        null
    );

    /*
       Compatibility fallback.

       Home currently stores the plan in both:
       studyMindPlan
       studyData
    */

    if (
        !savedPlan ||
        typeof savedPlan !== "object"
    ) {

        savedPlan = loadJSON(
            COMPATIBILITY_PLAN_KEY,
            null
        );
    }


    if (
        !savedPlan ||
        typeof savedPlan !== "object"
    ) {

        console.warn(
            "StudyMind: No saved study plan found."
        );

        studyPlan = {
            examType: "",
            examDate: null,
            subjects: [],
            topics: [],
            studyHours: 0,
            difficulty: "balanced",
            daysLeft: 0,
            studyStartDate: dateKey(),
            createdAt: new Date().toISOString()
        };

        return;
    }


    const rawSubjects =
        Array.isArray(savedPlan.subjects)
            ? savedPlan.subjects
            : [];


    const subjects = rawSubjects
        .map((subject, index) =>
            normalizeSubject(
                subject,
                index
            )
        )
        .filter(subject =>
            subject.name
        );


    const rawTopics =
        Array.isArray(savedPlan.topics)
            ? savedPlan.topics
            : [];


    const topics = rawTopics
        .map((topic, index) =>
            normalizeTopic(
                topic,
                index,
                subjects.map(
                    subject => subject.name
                )
            )
        )
        .filter(topic =>
            topic.name
        );


    let examDate =
        savedPlan.examDate ||
        savedPlan.testDate ||
        savedPlan.date ||
        null;


    const parsedExamDate =
        parseDate(examDate);


    if (parsedExamDate) {

        examDate =
            dateKey(parsedExamDate);

    } else {

        examDate = null;
    }


    let studyStartDate =
        savedPlan.studyStartDate ||
        savedPlan.startDate ||
        dateKey();


    const parsedStartDate =
        parseDate(studyStartDate);


    if (parsedStartDate) {

        studyStartDate =
            dateKey(parsedStartDate);

    } else {

        studyStartDate =
            dateKey();
    }


    let studyHours =
        Number(
            savedPlan.studyHours ||
            savedPlan.hoursPerDay ||
            savedPlan.dailyHours ||
            0
        );


    if (
        !Number.isFinite(studyHours) ||
        studyHours < 0
    ) {

        studyHours = 0;
    }


    let daysLeft =
        Number(
            savedPlan.daysLeft
        );


    if (
        !Number.isFinite(daysLeft) ||
        daysLeft < 0
    ) {

        if (examDate) {

            daysLeft =
                Math.max(
                    0,
                    daysBetween(
                        new Date(),
                        new Date(examDate)
                    )
                );

        } else {

            daysLeft = 0;
        }
    }


    studyPlan = {

        ...savedPlan,

        examType:
            cleanText(
                savedPlan.examType ||
                savedPlan.exam ||
                savedPlan.testType
            ),

        examDate,

        subjects,

        topics,

        studyHours,

        difficulty:
            cleanText(
                savedPlan.difficulty ||
                "balanced"
            ),

        daysLeft,

        studyStartDate,

        createdAt:
            savedPlan.createdAt ||
            new Date().toISOString()
    };


    /*
       Keep both storage keys synchronized.
    */

    saveJSON(
        PLAN_KEY,
        studyPlan
    );

    saveJSON(
        COMPATIBILITY_PLAN_KEY,
        studyPlan
    );


    console.log(
        "StudyMind Dashboard loaded plan:",
        studyPlan
    );
}


/* =========================================================
   COMPLETION STORAGE
========================================================= */

function loadCompletionState() {

    completedTopics =
        loadArray(
            COMPLETED_TOPICS_KEY
        );

    completedQuestionTopics =
        loadArray(
            COMPLETED_QUESTIONS_KEY
        );


    currentTopicIndex =
        Number(
            localStorage.getItem(
                CURRENT_TOPIC_KEY
            )
        );


    if (
        !Number.isInteger(currentTopicIndex) ||
        currentTopicIndex < 0
    ) {

        currentTopicIndex = 0;
    }


    topicQuestions =
        loadObject(
            TOPIC_QUESTIONS_KEY
        );


    if (
        studyPlan &&
        studyPlan.topics.length
    ) {

        if (
            currentTopicIndex >=
            studyPlan.topics.length
        ) {

            currentTopicIndex =
                Math.max(
                    0,
                    studyPlan.topics.length - 1
                );
        }
    }


    saveJSON(
        COMPLETED_TOPICS_KEY,
        completedTopics
    );

    saveJSON(
        COMPLETED_QUESTIONS_KEY,
        completedQuestionTopics
    );

    saveJSON(
        TOPIC_QUESTIONS_KEY,
        topicQuestions
    );


    localStorage.setItem(
        CURRENT_TOPIC_KEY,
        String(currentTopicIndex)
    );
}


function topicKey(topic) {

    if (!topic) {
        return "";
    }

    return (
        topic.id ||
        slugify(topic.name)
    );
}


function isTopicCompleted(topic) {

    const key =
        topicKey(topic);

    return completedTopics.includes(
        key
    );
}


function isQuestionCheckCompleted(topic) {

    const key =
        topicKey(topic);

    return completedQuestionTopics.includes(
        key
    );
}


/* =========================================================
   CURRENT TOPIC
========================================================= */

function getCurrentTopic() {

    if (
        !studyPlan ||
        !Array.isArray(studyPlan.topics) ||
        !studyPlan.topics.length
    ) {

        return null;
    }


    /*
       Find the first incomplete topic
       starting from the saved index.
    */

    for (
        let i = currentTopicIndex;
        i < studyPlan.topics.length;
        i++
    ) {

        if (
            !isTopicCompleted(
                studyPlan.topics[i]
            )
        ) {

            currentTopicIndex = i;

            return studyPlan.topics[i];
        }
    }


    /*
       If everything after the saved index
       is complete, look from the beginning.
    */

    for (
        let i = 0;
        i < currentTopicIndex;
        i++
    ) {

        if (
            !isTopicCompleted(
                studyPlan.topics[i]
            )
        ) {

            currentTopicIndex = i;

            return studyPlan.topics[i];
        }
    }


    /*
       Everything is complete.
    */

    return studyPlan.topics[
        studyPlan.topics.length - 1
    ];
}


/* =========================================================
   DASHBOARD STATS
========================================================= */

function updateDashboardStats() {

    const weeklyHours =
        $("weeklyHours");

    const daysLeft =
        $("daysLeft");

    const dailyGoal =
        $("dailyGoal");

    const studyScore =
        $("studyScore");


    if (!studyPlan) {
        return;
    }


    const dailyHours =
        Number(
            studyPlan.studyHours || 0
        );


    if (weeklyHours) {

        weeklyHours.textContent =
            `${(
                dailyHours * 7
            ).toFixed(
                dailyHours % 1 ? 1 : 0
            )} hrs`;
    }


    if (daysLeft) {

        let remaining =
            Number(
                studyPlan.daysLeft || 0
            );


        if (studyPlan.examDate) {

            remaining =
                Math.max(
                    0,
                    daysBetween(
                        new Date(),
                        new Date(
                            studyPlan.examDate
                        )
                    )
                );
        }


        daysLeft.textContent =
            remaining;
    }


    if (dailyGoal) {

        dailyGoal.textContent =
            `${dailyHours} hrs`;
    }


    if (studyScore) {

        studyScore.textContent =
            calculateStudyScore();
    }
}


/* =========================================================
   STUDY SCORE
========================================================= */

function calculateStudyScore() {

    if (
        !studyPlan ||
        !studyPlan.topics.length
    ) {

        return 0;
    }


    const total =
        studyPlan.topics.length;


    const completed =
        studyPlan.topics.filter(
            topic =>
                isTopicCompleted(topic)
        ).length;


    const topicScore =
        (completed / total) * 70;


    const questionScore =
        total
            ? (
                studyPlan.topics.filter(
                    topic =>
                        isQuestionCheckCompleted(
                            topic
                        )
                ).length /
                total
            ) * 20
            : 0;


    const streak =
        Number(
            localStorage.getItem(
                STREAK_KEY
            )
        ) || 0;


    const streakScore =
        Math.min(
            10,
            streak
        );


    return Math.round(
        Math.min(
            100,
            topicScore +
            questionScore +
            streakScore
        )
    );
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


    container.innerHTML = "";


    if (
        !studyPlan ||
        !studyPlan.subjects.length
    ) {

        container.innerHTML = `
            <div class="empty-state">
                <strong>No subjects yet</strong>
                <p>Create a study plan from the Home page.</p>
            </div>
        `;

        return;
    }


    studyPlan.subjects.forEach(
        (subject, index) => {

            const subjectName =
                typeof subject === "string"
                    ? subject
                    : subject.name;


            const relatedTopics =
                studyPlan.topics.filter(
                    topic =>
                        !topic.subject ||
                        topic.subject === subjectName
                );


            const completed =
                relatedTopics.filter(
                    topic =>
                        isTopicCompleted(topic)
                ).length;


            const total =
                relatedTopics.length;


            const percentage =
                total
                    ? Math.round(
                        (
                            completed /
                            total
                        ) * 100
                    )
                    : 0;


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "subject-item";


            item.innerHTML = `
                <div class="subject-item-header">
                    <strong>
                        📚 ${escapeHTML(subjectName)}
                    </strong>

                    <span>
                        ${percentage}%
                    </span>
                </div>

                <div class="progress-bar-container">
                    <div
                        style="width:${percentage}%"
                    ></div>
                </div>

                <small>
                    ${completed} of ${total} topics completed
                </small>
            `;


            container.appendChild(item);
        }
    );
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


    container.innerHTML = "";


    if (
        !studyPlan ||
        !studyPlan.topics.length
    ) {

        container.innerHTML = `
            <div class="empty-state">
                <strong>No topics yet</strong>
                <p>Create a study plan with topics to begin.</p>
            </div>
        `;

        return;
    }


    studyPlan.topics.forEach(
        (topic, index) => {

            const completed =
                isTopicCompleted(topic);


            const questionDone =
                isQuestionCheckCompleted(
                    topic
                );


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "topic-item";


            if (completed) {
                item.classList.add(
                    "completed"
                );
            }


            if (
                index === currentTopicIndex
            ) {

                item.classList.add(
                    "active"
                );
            }


            item.innerHTML = `
                <div class="topic-item-header">

                    <div>

                        <strong>
                            ${
                                completed
                                    ? "✅"
                                    : index === currentTopicIndex
                                        ? "📖"
                                        : "○"
                            }
                            ${escapeHTML(topic.name)}
                        </strong>

                        ${
                            topic.subject
                                ? `
                                    <small>
                                        ${escapeHTML(topic.subject)}
                                    </small>
                                  `
                                : ""
                        }

                    </div>

                    <span>
                        ${
                            completed
                                ? "Completed"
                                : questionDone
                                    ? "Checked"
                                    : "Pending"
                        }
                    </span>

                </div>

                <p>
                    ${escapeHTML(topic.description)}
                </p>
            `;


            item.addEventListener(
                "click",
                () => {

                    currentTopicIndex =
                        index;

                    localStorage.setItem(
                        CURRENT_TOPIC_KEY,
                        String(index)
                    );

                    renderCurrentTopic();

                    renderTopics();

                    window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });
                }
            );


            container.appendChild(item);
        }
    );
}


/* =========================================================
   CURRENT TOPIC RENDER
========================================================= */

function renderCurrentTopic() {

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

    const completionMessage =
        $("topicCompletionMessage");

    const nextMessage =
        $("nextTopicMessage");


    const topic =
        getCurrentTopic();


    if (!topic) {

        if (name) {
            name.textContent =
                "No topic available";
        }

        if (description) {
            description.textContent =
                "Create a study plan with topics to begin.";
        }

        if (position) {
            position.textContent =
                "TOPIC 0 OF 0";
        }

        if (badge) {
            badge.textContent =
                "NO PLAN";
        }

        if (checkbox) {
            checkbox.checked = false;
            checkbox.disabled = true;
        }

        return;
    }


    const index =
        studyPlan.topics.indexOf(
            topic
        );


    const completed =
        isTopicCompleted(topic);


    if (name) {

        name.textContent =
            topic.name;
    }


    if (description) {

        description.textContent =
            topic.description;
    }


    if (position) {

        position.textContent =
            `TOPIC ${index + 1} OF ${studyPlan.topics.length}`;
    }


    if (badge) {

        if (completed) {

            badge.textContent =
                "COMPLETED";

        } else {

            badge.textContent =
                "IN PROGRESS";
        }
    }


    if (checkbox) {

        checkbox.checked =
            completed;

        checkbox.disabled =
            completed;
    }


    if (completionMessage) {

        completionMessage.textContent =
            completed
                ? "This topic has been completed."
                : "Tick this box when you are done studying this topic.";
    }


    if (nextMessage) {

        const nextTopic =
            studyPlan.topics[
                index + 1
            ];


        if (completed && nextTopic) {

            nextMessage.innerHTML = `
                <strong>Next topic:</strong>
                ${escapeHTML(nextTopic.name)}
            `;

        } else if (
            completed &&
            !nextTopic
        ) {

            nextMessage.innerHTML = `
                🎉 <strong>All topics completed!</strong>
                Great work.
            `;

        } else {

            nextMessage.innerHTML = "";
        }
    }


    /*
       Restore knowledge check if it already exists.
    */

    renderKnowledgeCheckState(
        topic
    );
}


/* =========================================================
   TOPIC COMPLETION
========================================================= */

function completeCurrentTopic() {

    const topic =
        getCurrentTopic();


    if (!topic) {
        return;
    }


    const key =
        topicKey(topic);


    if (
        !completedTopics.includes(key)
    ) {

        completedTopics.push(key);
    }


    saveJSON(
        COMPLETED_TOPICS_KEY,
        completedTopics
    );


    const index =
        studyPlan.topics.indexOf(
            topic
        );


    currentTopicIndex =
        Math.min(
            index + 1,
            Math.max(
                0,
                studyPlan.topics.length - 1
            )
        );


    localStorage.setItem(
        CURRENT_TOPIC_KEY,
        String(currentTopicIndex)
    );


    updateDashboardStats();

    updateDashboardProgress();

    renderCurrentTopic();

    renderTopics();

    renderCalendar();

    renderSchedule();

    updateNextBooking();

    renderDailyChallenge();


    /*
       Open the knowledge check
       after the user finishes studying.
    */

    showKnowledgeCheck(topic);


    alert(
        "Topic marked as completed. Now complete the knowledge check."
    );
}


/* =========================================================
   PROGRESS TRACKER
========================================================= */

function updateDashboardProgress() {

    const percent =
        $("progressPercent");

    const count =
        $("progressCount");

    const bar =
        $("progressBar");


    if (
        !studyPlan ||
        !studyPlan.topics.length
    ) {

        if (percent) {
            percent.textContent =
                "0%";
        }

        if (count) {
            count.textContent =
                "0 of 0 topics completed";
        }

        if (bar) {
            bar.style.width =
                "0%";
        }

        return;
    }


    const total =
        studyPlan.topics.length;


    const completed =
        studyPlan.topics.filter(
            topic =>
                isTopicCompleted(topic)
        ).length;


    const percentage =
        Math.round(
            (completed / total) * 100
        );


    if (percent) {

        percent.textContent =
            `${percentage}%`;
    }


    if (count) {

        count.textContent =
            `${completed} of ${total} topics completed`;
    }


    if (bar) {

        bar.style.width =
            `${percentage}%`;
    }
}


/* =========================================================
   CALENDAR
========================================================= */

function renderCalendar() {

    const calendarDays =
        $("calendarDays");

    const calendarMonth =
        $("calendarMonth");


    if (!calendarDays) {
        return;
    }


    if (calendarMonth) {

        calendarMonth.textContent =
            formatMonthYear(
                calendarDate
            );
    }


    calendarDays.innerHTML = "";


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


    const firstWeekday =
        firstDay.getDay();


    const daysInMonth =
        lastDay.getDate();


    /*
       Empty cells before day 1.
    */

    for (
        let i = 0;
        i < firstWeekday;
        i++
    ) {

        const empty =
            document.createElement(
                "div"
            );

        empty.className =
            "calendar-day empty";

        calendarDays.appendChild(
            empty
        );
    }


    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const date =
            new Date(
                year,
                month,
                day
            );


        const cell =
            document.createElement(
                "div"
            );


        cell.className =
            "calendar-day";


        const key =
            dateKey(date);


        const today =
            key === dateKey();


        const exam =
            studyPlan &&
            studyPlan.examDate &&
            key === studyPlan.examDate;


        const start =
            studyPlan &&
            studyPlan.studyStartDate
                ? new Date(
                    studyPlan.studyStartDate
                )
                : null;


        const examDate =
            studyPlan &&
            studyPlan.examDate
                ? new Date(
                    studyPlan.examDate
                )
                : null;


        const withinPlan =
            start &&
            examDate &&
            startOfDay(date) >=
                startOfDay(start) &&
            startOfDay(date) <=
                startOfDay(examDate);


        /*
           Sunday is treated as a break/rest day
           unless it is the exam date.
        */

        const isSunday =
            date.getDay() === 0;


        if (today) {

            cell.classList.add(
                "today"
            );
        }


        if (withinPlan) {

            if (exam) {

                cell.classList.add(
                    "exam-day"
                );

            } else if (isSunday) {

                cell.classList.add(
                    "break-day"
                );

            } else {

                cell.classList.add(
                    "study-day"
                );
            }
        }


        /*
           Mark dates that correspond to
           completed topic sessions.
        */

        if (
            withinPlan &&
            !exam &&
            !isSunday &&
            studyPlan.topics.length
        ) {

            const planDay =
                daysBetween(
                    start,
                    date
                );


            if (
                planDay >= 0 &&
                planDay <
                    studyPlan.topics.length
            ) {

                const topic =
                    studyPlan.topics[
                        planDay
                    ];


                if (
                    topic &&
                    isTopicCompleted(topic)
                ) {

                    cell.classList.add(
                        "completed-day"
                    );
                }
            }
        }


        cell.innerHTML = `
            <span class="calendar-number">
                ${day}
            </span>
        `;


        if (exam) {

            cell.title =
                studyPlan.examType
                    ? `${studyPlan.examType} — Test / Exam`
                    : "Test / Exam";
        }


        calendarDays.appendChild(
            cell
        );
    }
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


    container.innerHTML = "";


    if (
        !studyPlan ||
        !studyPlan.topics.length
    ) {

        container.innerHTML = `
            <div class="empty-schedule">
                Your daily study sessions will appear here.
            </div>
        `;

        return;
    }


    const today =
        new Date();


    const dayOfPlan =
        studyPlan.studyStartDate
            ? daysBetween(
                new Date(
                    studyPlan.studyStartDate
                ),
                today
            )
            : 0;


    const topic =
        dayOfPlan >= 0 &&
        dayOfPlan <
            studyPlan.topics.length
            ? studyPlan.topics[
                dayOfPlan
            ]
            : getCurrentTopic();


    const examDate =
        parseDate(
            studyPlan.examDate
        );


    const isExamDay =
        examDate &&
        dateKey(today) ===
            dateKey(examDate);


    if (isExamDay) {

        container.innerHTML = `
            <div class="schedule-item">
                <div class="schedule-time">
                    📅
                </div>

                <div class="schedule-content">
                    <strong>
                        ${escapeHTML(
                            studyPlan.examType ||
                            "Exam"
                        )}
                    </strong>

                    <span>
                        Today is your test / exam day.
                    </span>
                </div>
            </div>
        `;

        return;
    }


    if (today.getDay() === 0) {

        container.innerHTML = `
            <div class="schedule-item">
                <div class="schedule-time">
                    🌿
                </div>

                <div class="schedule-content">
                    <strong>
                        Rest / Break Day
                    </strong>

                    <span>
                        Take time to recharge and prepare for your next study session.
                    </span>
                </div>
            </div>
        `;

        return;
    }


    if (!topic) {

        container.innerHTML = `
            <div class="empty-schedule">
                No study session scheduled for today.
            </div>
        `;

        return;
    }


    const hours =
        Number(
            studyPlan.studyHours || 0
        );


    const duration =
        hours > 0
            ? `${hours} hr${hours === 1 ? "" : "s"}`
            : "Study session";


    container.innerHTML = `
        <div class="schedule-item">

            <div class="schedule-time">
                🕒
            </div>

            <div class="schedule-content">

                <strong>
                    ${escapeHTML(topic.name)}
                </strong>

                <span>
                    ${topic.subject
                        ? escapeHTML(topic.subject)
                        : "Study Session"}
                    • ${duration}
                </span>

            </div>

        </div>
    `;
}


/* =========================================================
   NEXT BOOKING
========================================================= */

function updateNextBooking() {

    const booking =
        $("nextBooking");

    const bookingTime =
        $("nextBookingTime");


    if (!booking || !bookingTime) {
        return;
    }


    if (
        !studyPlan ||
        !studyPlan.topics.length
    ) {

        booking.textContent =
            "No upcoming session yet";

        bookingTime.textContent =
            "Create a study plan to populate your calendar.";

        return;
    }


    const today =
        new Date();


    const examDate =
        parseDate(
            studyPlan.examDate
        );


    if (
        examDate &&
        dateKey(today) ===
            dateKey(examDate)
    ) {

        booking.textContent =
            studyPlan.examType ||
            "Exam Day";

        bookingTime.textContent =
            "Your test / exam is today.";

        return;
    }


    if (today.getDay() === 0) {

        booking.textContent =
            "Break Day";

        bookingTime.textContent =
            "Rest and recharge today.";

        return;
    }


    const topic =
        getCurrentTopic();


    if (!topic) {

        booking.textContent =
            "All topics completed";

        bookingTime.textContent =
            "Excellent work!";

        return;
    }


    booking.textContent =
        topic.name;


    const hours =
        Number(
            studyPlan.studyHours || 0
        );


    bookingTime.textContent =
        hours > 0
            ? `${hours} hour${hours === 1 ? "" : "s"} study session`
            : "Study session scheduled for today.";
}


/* =========================================================
   KNOWLEDGE CHECK
========================================================= */

function showKnowledgeCheck(topic) {

    const section =
        $("topicQuestionsSection");


    if (!section) {
        return;
    }


    section.style.display =
        "block";


    renderKnowledgeCheckState(
        topic
    );


    if (
        section.scrollIntoView
    ) {

        section.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }


    if (
        !topicQuestions[
            topicKey(topic)
        ]
    ) {

        generateTopicQuestions(
            topic
        );
    }
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
   AI QUESTION LIMIT
========================================================= */

function getAIQuestionCount() {

    const count =
        Number(
            localStorage.getItem(
                AI_QUESTION_COUNT_KEY
            )
        );


    return Number.isFinite(count) &&
        count >= 0
        ? count
        : 0;
}


function canAskAI() {

    return (
        getAIQuestionCount() <
        FREE_QUESTION_LIMIT
    );
}


function incrementAIQuestionCount() {

    const count =
        getAIQuestionCount() + 1;


    localStorage.setItem(
        AI_QUESTION_COUNT_KEY,
        String(count)
    );


    return count;
}


/* =========================================================
   GENERATE TOPIC QUESTIONS
========================================================= */

async function generateTopicQuestions(topic) {

    const container =
        $("topicQuestions");


    const result =
        $("topicQuestionResult");


    if (!container) {
        return;
    }


    if (!canAskAI()) {

        container.innerHTML = `
            <div class="ai-limit-message">
                <strong>Daily AI question limit reached.</strong>
                <p>
                    You have used all ${FREE_QUESTION_LIMIT}
                    free AI question requests for today.
                </p>
            </div>
        `;

        if (result) {
            result.textContent =
                "Try again tomorrow or upgrade to Premium for more AI access.";
        }

        return;
    }


    container.innerHTML = `
        <div class="loading-state">
            🧠 StudyMind AI is preparing your knowledge check...
        </div>
    `;


    if (result) {
        result.textContent = "";
    }


    try {

        const response =
            await fetch(
                "/api/generate-questions",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        subject:
                            topic.subject ||
                            "Senior Secondary",

                        topic:
                            topic.name,

                        count: 5,

                        numberOfQuestions: 5,

                        questionCount: 5,

                        curriculum:
                            "Nigerian Senior Secondary curriculum"
                    })
                }
            );


        if (!response.ok) {

            throw new Error(
                `Question API returned ${response.status}`
            );
        }


        const data =
            await response.json();


        const questions =
            extractQuestions(
                data
            );


        if (
            !questions.length
        ) {

            throw new Error(
                "AI returned no questions."
            );
        }


        topicQuestions[
            topicKey(topic)
        ] = questions;


        saveJSON(
            TOPIC_QUESTIONS_KEY,
            topicQuestions
        );


        incrementAIQuestionCount();


        renderKnowledgeCheckState(
            topic
        );

    } catch (error) {

        console.error(
            "StudyMind knowledge check error:",
            error
        );


        container.innerHTML = `
            <div class="ai-error-message">
                <strong>
                    We couldn't generate the knowledge check.
                </strong>

                <p>
                    Please try again in a moment.
                </p>

                <button
                    type="button"
                    id="retryTopicQuestions"
                    class="primary-button"
                >
                    Try Again
                </button>
            </div>
        `;


        const retry =
            $("retryTopicQuestions");


        if (retry) {

            retry.addEventListener(
                "click",
                () =>
                    generateTopicQuestions(
                        topic
                    )
            );
        }


        if (result) {

            result.textContent =
                "";
        }
    }
}


/* =========================================================
   EXTRACT AI QUESTIONS
========================================================= */

function extractQuestions(data) {

    if (!data) {
        return [];
    }


    let questions = null;


    if (Array.isArray(data)) {

        questions = data;

    } else if (
        Array.isArray(data.questions)
    ) {

        questions =
            data.questions;

    } else if (
        Array.isArray(data.data)
    ) {

        questions =
            data.data;

    } else if (
        data.result &&
        Array.isArray(
            data.result.questions
        )
    ) {

        questions =
            data.result.questions;

    } else if (
        data.output &&
        Array.isArray(
            data.output.questions
        )
    ) {

        questions =
            data.output.questions;
    }


    if (!Array.isArray(questions)) {
        return [];
    }


    return questions
        .slice(0, 5)
        .map(
            (question, index) =>
                normalizeQuestion(
                    question,
                    index
                )
        )
        .filter(Boolean);
}


/* =========================================================
   NORMALIZE QUESTION
========================================================= */

function normalizeQuestion(
    question,
    index
) {

    if (
        !question ||
        typeof question !== "object"
    ) {

        return null;
    }


    const text =
        cleanText(
            question.question ||
            question.text ||
            question.prompt
        );


    if (!text) {
        return null;
    }


    let options =
        question.options ||
        question.answers ||
        question.choices;


    if (
        typeof options === "object" &&
        !Array.isArray(options)
    ) {

        options =
            Object.values(options);
    }


    if (!Array.isArray(options)) {
        options = [];
    }


    options =
        options
            .map(option => {

                if (
                    option &&
                    typeof option === "object"
                ) {

                    return cleanText(
                        option.text ||
                        option.label ||
                        option.value
                    );
                }

                return cleanText(
                    option
                );
            })
            .filter(Boolean)
            .slice(0, 4);


    if (options.length < 2) {
        return null;
    }


    let correct =
        question.correctAnswer;


    if (
        correct === undefined ||
        correct === null
    ) {

        correct =
            question.correct;

    }


    if (
        correct === undefined ||
        correct === null
    ) {

        correct =
            question.answer;
    }


    if (
        typeof correct === "number" &&
        options[correct]
    ) {

        correct =
            options[correct];

    } else if (
        typeof correct === "string"
    ) {

        const letter =
            correct
                .trim()
                .toUpperCase();


        const letters = [
            "A",
            "B",
            "C",
            "D"
        ];


        if (
            letters.includes(
                letter
            )
        ) {

            correct =
                options[
                    letters.indexOf(
                        letter
                    )
                ];
        }
    }


    if (
        correct === undefined ||
        correct === null
    ) {

        return null;
    }


    return {

        id:
            question.id ||
            `question-${index}`,

        question:
            text,

        options,

        correctAnswer:
            cleanText(correct),

        explanation:
            cleanText(
                question.explanation ||
                question.reason
            )
    };
}


/* =========================================================
   RENDER KNOWLEDGE CHECK
========================================================= */

function renderKnowledgeCheckState(topic) {

    const section =
        $("topicQuestionsSection");

    const container =
        $("topicQuestions");

    const result =
        $("topicQuestionResult");

    const submit =
        $("submitTopicQuestions");


    if (
        !section ||
        !container
    ) {

        return;
    }


    if (
        !topic ||
        !isTopicCompleted(topic)
    ) {

        section.style.display =
            "none";

        return;
    }


    section.style.display =
        "block";


    const key =
        topicKey(topic);


    const questions =
        topicQuestions[key];


    if (
        isQuestionCheckCompleted(
            topic
        )
    ) {

        container.innerHTML = `
            <div class="knowledge-complete">
                <strong>✅ Knowledge check completed</strong>
                <p>
                    You have already completed the knowledge check for this topic.
                </p>
            </div>
        `;


        if (submit) {
            submit.style.display =
                "none";
        }


        if (result) {

            result.textContent =
                "This topic and its knowledge check are complete.";
        }


        return;
    }


    if (
        !questions ||
        !questions.length
    ) {

        container.innerHTML = `
            <div class="loading-state">
                🧠 Preparing your 5-question knowledge check...
            </div>
        `;


        if (submit) {

            submit.style.display =
                "none";
        }


        return;
    }


    if (submit) {

        submit.style.display =
            "block";

        submit.disabled =
            false;
    }


    container.innerHTML = "";


    questions.forEach(
        (question, index) => {

            const wrapper =
                document.createElement(
                    "div"
                );


            wrapper.className =
                "knowledge-question";


            wrapper.innerHTML = `
                <div class="question-number">
                    Question ${index + 1} of ${questions.length}
                </div>

                <h3>
                    ${escapeHTML(
                        question.question
                    )}
                </h3>

                <div class="question-options">

                    ${question.options
                        .map(
                            (
                                option,
                                optionIndex
                            ) => `
                                <label class="question-option">

                                    <input
                                        type="radio"
                                        name="topic-question-${index}"
                                        value="${escapeHTML(option)}"
                                    >

                                    <span>
                                        ${String.fromCharCode(
                                            65 + optionIndex
                                        )}.
                                        ${escapeHTML(option)}
                                    </span>

                                </label>
                            `
                        )
                        .join("")}

                </div>
            `;


            container.appendChild(
                wrapper
            );
        }
    );
}


/* =========================================================
   SUBMIT KNOWLEDGE CHECK
========================================================= */

function submitKnowledgeCheck() {

    const topic =
        getCurrentTopic();


    if (!topic) {
        return;
    }


    const questions =
        topicQuestions[
            topicKey(topic)
        ];


    if (
        !questions ||
        !questions.length
    ) {

        return;
    }


    let score = 0;

    let unanswered = 0;


    questions.forEach(
        (question, index) => {

            const selected =
                document.querySelector(
                    `input[name="topic-question-${index}"]:checked`
                );


            if (!selected) {

                unanswered++;

                return;
            }


            const answer =
                cleanText(
                    selected.value
                );


            if (
                answer.toLowerCase() ===
                cleanText(
                    question.correctAnswer
                ).toLowerCase()
            ) {

                score++;
            }
        }
    );


    const result =
        $("topicQuestionResult");


    if (unanswered > 0) {

        if (result) {

            result.innerHTML = `
                <strong>
                    Please answer all ${unanswered}
                    remaining question${unanswered === 1 ? "" : "s"}.
                </strong>
            `;
        }

        return;
    }


    const total =
        questions.length;


    const percentage =
        Math.round(
            (score / total) * 100
        );


    if (result) {

        result.innerHTML = `
            <strong>
                ${score}/${total} correct — ${percentage}%
            </strong>

            <p>
                ${
                    percentage >= 80
                        ? "Excellent work! 🎉"
                        : percentage >= 60
                            ? "Good job. Keep reviewing the topic."
                            : "Keep studying this topic and try again."
                }
            </p>
        `;
    }


    /*
       Only mark the knowledge check complete
       when the user passes it.
    */

    if (percentage >= 60) {

        const key =
            topicKey(topic);


        if (
            !completedQuestionTopics.includes(
                key
            )
        ) {

            completedQuestionTopics.push(
                key
            );
        }


        saveJSON(
            COMPLETED_QUESTIONS_KEY,
            completedQuestionTopics
        );


        updateDashboardStats();


        if (percentage >= 80) {

            alert(
                `Excellent! You scored ${score}/${total}.`
            );

        } else {

            alert(
                `Knowledge check completed: ${score}/${total}.`
            );
        }


        renderTopics();

        renderCurrentTopic();

        renderDailyChallenge();
    }
}


/* =========================================================
   TIMER STORAGE
========================================================= */

function loadTimerState() {

    const storedDuration =
        Number(
            localStorage.getItem(
                TIMER_DURATION_KEY
            )
        );


    if (
        Number.isFinite(storedDuration) &&
        storedDuration > 0
    ) {

        selectedTimerSeconds =
            storedDuration;

    } else {

        selectedTimerSeconds =
            DEFAULT_TIMER_SECONDS;
    }


    const storedSeconds =
        Number(
            localStorage.getItem(
                TIMER_SECONDS_KEY
            )
        );


    if (
        Number.isFinite(storedSeconds) &&
        storedSeconds >= 0
    ) {

        timerSeconds =
            storedSeconds;

    } else {

        timerSeconds =
            selectedTimerSeconds;
    }


    timerRunning =
        localStorage.getItem(
            TIMER_RUNNING_KEY
        ) === "true";


    /*
       Never automatically restart the timer
       after refreshing the page.
    */

    if (timerRunning) {

        timerRunning = false;

        localStorage.setItem(
            TIMER_RUNNING_KEY,
            "false"
        );
    }
}


/* =========================================================
   TIMER DISPLAY
========================================================= */

function formatTimer(seconds) {

    const safeSeconds =
        Math.max(
            0,
            Math.floor(
                Number(seconds) || 0
            )
        );


    const minutes =
        Math.floor(
            safeSeconds / 60
        );


    const remainingSeconds =
        safeSeconds % 60;


    return `${String(minutes).padStart(2, "0")}:${String(
        remainingSeconds
    ).padStart(2, "0")}`;
}


function updateTimerDisplay() {

    const timer =
        $("studyTimer");


    if (!timer) {
        return;
    }


    timer.textContent =
        formatTimer(
            timerSeconds
        );
}


/* =========================================================
   TIMER BUTTONS
========================================================= */

function updateTimerButtons() {

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


/* =========================================================
   START TIMER
========================================================= */

function startTimer() {

    if (timerRunning) {
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


    localStorage.setItem(
        TIMER_RUNNING_KEY,
        "true"
    );


    updateTimerButtons();


    timerInterval =
        setInterval(
            () => {

                timerSeconds--;

                localStorage.setItem(
                    TIMER_SECONDS_KEY,
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
            1000
        );
}


/* =========================================================
   PAUSE TIMER
========================================================= */

function pauseTimer() {

    if (!timerRunning) {
        return;
    }


    timerRunning =
        false;


    clearInterval(
        timerInterval
    );


    timerInterval =
        null;


    localStorage.setItem(
        TIMER_RUNNING_KEY,
        "false"
    );


    localStorage.setItem(
        TIMER_SECONDS_KEY,
        String(
            timerSeconds
        )
    );


    updateTimerButtons();
}


/* =========================================================
   RESET TIMER
========================================================= */

function resetTimer() {

    pauseTimer();


    timerSeconds =
        selectedTimerSeconds;


    localStorage.setItem(
        TIMER_SECONDS_KEY,
        String(
            timerSeconds
        )
    );


    updateTimerDisplay();

    updateTimerButtons();
}


/* =========================================================
   TIMER FINISHED
========================================================= */

function finishTimer() {

    clearInterval(
        timerInterval
    );


    timerInterval =
        null;


    timerRunning =
        false;


    timerSeconds = 0;


    localStorage.setItem(
        TIMER_RUNNING_KEY,
        "false"
    );


    localStorage.setItem(
        TIMER_SECONDS_KEY,
        "0"
    );


    updateTimerDisplay();

    updateTimerButtons();


    alert(
        "🎉 Study session complete! Great work."
    );


    renderDailyChallenge();
}


/* =========================================================
   TIMER DURATION CHANGE
========================================================= */

function changeTimerDuration() {

    const select =
        $("timerDuration");


    if (!select) {
        return;
    }


    const minutes =
        Number(
            select.value
        );


    if (
        !Number.isFinite(minutes) ||
        minutes <= 0
    ) {

        return;
    }


    selectedTimerSeconds =
        minutes * 60;


    localStorage.setItem(
        TIMER_DURATION_KEY,
        String(
            selectedTimerSeconds
        )
    );


    resetTimer();
}


/* =========================================================
   RESTORE TIMER SELECT
========================================================= */

function restoreTimerSelect() {

    const select =
        $("timerDuration");


    if (!select) {
        return;
    }


    const minutes =
        Math.round(
            selectedTimerSeconds / 60
        );


    const option =
        Array.from(
            select.options
        ).find(
            option =>
                Number(
                    option.value
                ) === minutes
        );


    if (option) {

        select.value =
            String(minutes);

    } else {

        select.value =
            "25";
    }
}


/* =========================================================
   DAILY CHALLENGE
========================================================= */

function renderDailyChallenge() {

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


    const topic =
        getCurrentTopic();


    if (!topic) {

        if (title) {
            title.textContent =
                "🎉 Plan Complete";
        }

        if (description) {
            description.textContent =
                "You have completed all the topics in your study plan.";
        }

        if (progress) {
            progress.textContent =
                "100%";
        }

        if (progressBar) {
            progressBar.style.width =
                "100%";
        }

        if (button) {
            button.disabled =
                true;
        }

        return;
    }


    const timerDone =
        timerSeconds <= 0;


    const questionsDone =
        isQuestionCheckCompleted(
            topic
        );


    let percentage = 0;


    if (timerDone) {
        percentage += 50;
    }


    if (questionsDone) {
        percentage += 50;
    }


    if (title) {

        title.textContent =
            `📚 Study ${topic.name}`;
    }


    if (description) {

        description.textContent =
            `Study your current topic using the timer and complete today's knowledge check.`;
    }


    if (progress) {

        progress.textContent =
            `${percentage}%`;
    }


    if (progressBar) {

        progressBar.style.width =
            `${percentage}%`;
    }


    if (button) {

        button.disabled =
            false;

        button.textContent =
            percentage >= 100
                ? "✅ Challenge Complete"
                : "🚀 Start Challenge";
    }
}


/* =========================================================
   DAILY CHALLENGE BUTTON
========================================================= */

function startDailyChallenge() {

    const topic =
        getCurrentTopic();


    if (!topic) {
        return;
    }


    const section =
        $("currentTopicSection");


    if (section) {

        section.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }


    /*
       If the timer is already at zero,
       reset it before starting the challenge.
    */

    if (timerSeconds <= 0) {

        resetTimer();
    }


    setTimeout(
        () => {

            if (!timerRunning) {

                startTimer();
            }

        },
        400
    );
}


/* =========================================================
   THEME
========================================================= */

function setupTheme() {

    const button =
        $("themeButton");


    if (!button) {
        return;
    }


    const savedTheme =
        localStorage.getItem(
            THEME_KEY
        );


    applyTheme(
        savedTheme ||
        "dark"
    );


    button.addEventListener(
        "click",
        () => {

            const current =
                document.body.classList.contains(
                    "light-mode"
                )
                    ? "light"
                    : "dark";


            const next =
                current === "dark"
                    ? "light"
                    : "dark";


            applyTheme(
                next
            );


            localStorage.setItem(
                THEME_KEY,
                next
            );
        }
    );
}


function applyTheme(theme) {

    const button =
        $("themeButton");


    if (theme === "light") {

        document.body.classList.add(
            "light-mode"
        );

        if (button) {

            button.textContent =
                "☀️ Light Mode";
        }

    } else {

        document.body.classList.remove(
            "light-mode"
        );

        if (button) {

            button.textContent =
                "🌙 Dark Mode";
        }
    }
}


/* =========================================================
   AUTHENTICATION
========================================================= */

async function checkAuthentication() {

    /*
       supabase.js should expose:
       window.supabaseClient
    */

    const client =
        window.supabaseClient;


    if (
        !client ||
        !client.auth
    ) {

        console.warn(
            "StudyMind: Supabase client is not available yet."
        );

        return true;
    }


    try {

        const {
            data,
            error
        } =
            await client.auth.getUser();


        if (error) {

            console.warn(
                "StudyMind authentication check:",
                error
            );

            return false;
        }


        currentUser =
            data &&
            data.user
                ? data.user
                : null;


        return Boolean(
            currentUser
        );

    } catch (error) {

        console.error(
            "StudyMind auth error:",
            error
        );

        return false;
    }
}


/* =========================================================
   NAVIGATION SAFETY
========================================================= */

function setupNavigation() {

    /*
       The HTML already contains the correct links.
       This section only handles hash navigation.
    */

    const hash =
        window.location.hash;


    if (!hash) {
        return;
    }


    setTimeout(
        () => {

            const target =
                document.querySelector(
                    hash
                );


            if (target) {

                target.scrollIntoView({
                    behavior: "smooth"
                });
            }

        },
        250
    );
}


/* =========================================================
   EVENT BINDING
========================================================= */

function bindEvents() {

    const completeCheckbox =
        $("topicCompleteCheckbox");


    if (completeCheckbox) {

        completeCheckbox.addEventListener(
            "change",
            () => {

                if (
                    completeCheckbox.checked
                ) {

                    completeCurrentTopic();
                }
            }
        );
    }


    const submitQuestions =
        $("submitTopicQuestions");


    if (submitQuestions) {

        submitQuestions.addEventListener(
            "click",
            submitKnowledgeCheck
        );
    }


    const startTimerButton =
        $("startTimerButton");


    if (startTimerButton) {

        startTimerButton.addEventListener(
            "click",
            startTimer
        );
    }


    const pauseTimerButton =
        $("pauseTimerButton");


    if (pauseTimerButton) {

        pauseTimerButton.addEventListener(
            "click",
            pauseTimer
        );
    }


    const resetTimerButton =
        $("resetTimerButton");


    if (resetTimerButton) {

        resetTimerButton.addEventListener(
            "click",
            resetTimer
        );
    }


    const timerDuration =
        $("timerDuration");


    if (timerDuration) {

        timerDuration.addEventListener(
            "change",
            changeTimerDuration
        );
    }


    const previousMonth =
        $("previousMonth");


    if (previousMonth) {

        previousMonth.addEventListener(
            "click",
            () => {

                calendarDate =
                    new Date(
                        calendarDate.getFullYear(),
                        calendarDate.getMonth() - 1,
                        1
                    );

                renderCalendar();
            }
        );
    }


    const nextMonth =
        $("nextMonth");


    if (nextMonth) {

        nextMonth.addEventListener(
            "click",
            () => {

                calendarDate =
                    new Date(
                        calendarDate.getFullYear(),
                        calendarDate.getMonth() + 1,
                        1
                    );

                renderCalendar();
            }
        );
    }


    const dailyChallengeButton =
        $("dailyChallengeButton");


    if (dailyChallengeButton) {

        dailyChallengeButton.addEventListener(
            "click",
            startDailyChallenge
        );
    }
}


/* =========================================================
   PLAN VALIDATION
========================================================= */

function hasUsableStudyPlan() {

    return Boolean(
        studyPlan &&
        Array.isArray(
            studyPlan.subjects
        ) &&
        Array.isArray(
            studyPlan.topics
        ) &&
        studyPlan.subjects.length > 0 &&
        studyPlan.topics.length > 0
    );
}


/* =========================================================
   RENDER EVERYTHING
========================================================= */

function renderEverything() {

    updateDashboardStats();

    updateDashboardProgress();

    renderSubjects();

    renderTopics();

    renderCurrentTopic();

    renderCalendar();

    renderSchedule();

    updateNextBooking();

    renderDailyChallenge();

    updateTimerDisplay();

    updateTimerButtons();

    restoreTimerSelect();

    setupNavigation();
}


/* =========================================================
   DASHBOARD STARTUP
========================================================= */

async function startDashboard() {

    console.log(
        "StudyMind Dashboard: starting..."
    );


    /*
       IMPORTANT:
       Load the Home page's saved plan BEFORE
       rendering anything.
    */

    loadStudyPlan();

    loadCompletionState();

    loadTimerState();


    /*
       Make sure the selected timer matches
       the HTML options.
    */

    restoreTimerSelect();


    /*
       If a plan exists, render it immediately.
       Authentication is checked separately so
       a delayed Supabase client does not cause
       the dashboard to display empty data.
    */

    renderEverything();


    const authenticated =
        await checkAuthentication();


    if (!authenticated) {

        /*
           Only redirect when Supabase actually
           tells us there is no logged-in user.
        */

        window.location.href =
            "login.html";

        return;
    }


    /*
       If there is no study plan, send the user
       back to the generator.
    */

    if (!hasUsableStudyPlan()) {

        console.warn(
            "StudyMind: Dashboard has no usable study plan."
        );


        /*
           Keep the dashboard usable instead of
           immediately destroying the page.
        */

        renderEverything();

        return;
    }


    /*
       Final render after authentication.
    */

    renderEverything();


    console.log(
        "StudyMind Dashboard: ready.",
        {
            subjects:
                studyPlan.subjects,

            topics:
                studyPlan.topics,

            examDate:
                studyPlan.examDate
        }
    );
}


/* =========================================================
   GLOBAL STORAGE SYNC
========================================================= */

window.addEventListener(
    "storage",
    event => {

        if (
            event.key === PLAN_KEY ||
            event.key === COMPATIBILITY_PLAN_KEY
        ) {

            console.log(
                "StudyMind: study plan changed."
            );


            loadStudyPlan();

            loadCompletionState();

            renderEverything();
        }


        if (
            event.key === COMPLETED_TOPICS_KEY ||
            event.key === COMPLETED_QUESTIONS_KEY
        ) {

            loadCompletionState();

            renderEverything();
        }
    }
);


/* =========================================================
   SAME-TAB PLAN SYNC
========================================================= */

window.addEventListener(
    "studyMindPlanUpdated",
    () => {

        console.log(
            "StudyMind: received plan update."
        );


        loadStudyPlan();

        loadCompletionState();

        renderEverything();
    }
);


/* =========================================================
   PAGE VISIBILITY
========================================================= */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState ===
            "visible"
        ) {

            /*
               Re-read the plan when the user
               returns to the dashboard.
            */

            loadStudyPlan();

            loadCompletionState();

            renderEverything();
        }
    }
);


/* =========================================================
   DOM READY
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            setupTheme();

            bindEvents();

            startDashboard();
        }
    );

} else {

    setupTheme();

    bindEvents();

    startDashboard();
}


/* =========================================================
   OPTIONAL GLOBAL FUNCTIONS
========================================================= */

window.StudyMindDashboard = {

    reload: () => {

        loadStudyPlan();

        loadCompletionState();

        renderEverything();
    },

    getPlan: () =>
        studyPlan,

    getCurrentTopic: () =>
        getCurrentTopic(),

    startTimer,

    pauseTimer,

    resetTimer,

    renderCalendar,

    renderSchedule,

    updateDashboardProgress
};
