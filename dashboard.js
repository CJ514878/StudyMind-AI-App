/* =========================================================
   STUDYMIND AI — DASHBOARD.JS
   COMPLETE REPLACEMENT

   Works with:
   - home.html
   - script.js
   - dashboard.html
   - ai-assistant.html

   FEATURES:
   - Current topic
   - Topic progress
   - Knowledge Check navigation
   - No stale question cache on dashboard
   - 25 / 45 / 60 minute timer
   - Study streak
   - Study score
   - Daily challenge
   - Calendar
   - Study / Rest / Exam days
   - Schedule
   - Subject progress
   - Light / Dark mode
   - Premium gold theme
   - Free AI limit
   - AI Assistant compatibility
   - Multiple study plans
========================================================= */

"use strict";

/* =========================================================
   STORAGE
========================================================= */

const PLAN_KEY = "studyMindPlan";
const COMPAT_PLAN_KEY = "studyData";
const COMPLETED_TOPICS_KEY = "studyMindCompletedTopics";
const COMPLETED_QUESTIONS_KEY = "studyMindCompletedQuestionTopics";
const CURRENT_TOPIC_KEY = "studyMindCurrentTopicIndex";
const KNOWLEDGE_TOPIC_KEY = "studyMindKnowledgeCheckTopic";
const KNOWLEDGE_QUESTIONS_KEY = "studyMindTopicQuestions";
const THEME_KEY = "studyMindTheme";
const TIMER_SECONDS_KEY = "studyMindTimerSeconds";
const TIMER_DURATION_KEY = "studyMindSelectedTimerSeconds";
const STREAK_KEY = "studyMindStreak";
const LAST_STUDY_DATE_KEY = "lastStudyDate";
const SCORE_KEY = "studyMindScore";
const COMPLETED_DAYS_KEY = "studyMindCompletedDays";
const COMPLETED_SUBJECTS_KEY = "completedSubjects";
const AI_COUNT_KEY = "aiQuestionCount";
const PREMIUM_STATUS_ENDPOINT = "/api/premium/status";

const FREE_AI_LIMIT = 5;

const TIMER_OPTIONS = {
    25: 25 * 60,
    45: 45 * 60,
    60: 60 * 60
};

let timerSeconds = 25 * 60;
let timerInterval = null;
let timerRunning = false;
let calendarDate = new Date();

let currentUser = null;
let isPremium = false;


/* =========================================================
   DOM
========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   STORAGE HELPERS
========================================================= */

function readJSON(key, fallback) {

    try {

        const value = localStorage.getItem(key);

        if (!value) {
            return fallback;
        }

        return JSON.parse(value);

    } catch (error) {

        console.warn("StudyMind storage read failed:", key, error);

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

        console.warn("StudyMind storage write failed:", key, error);

        return false;
    }
}


function removeStorage(key) {

    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.warn(error);
    }
}


/* =========================================================
   PLAN
========================================================= */

function getStudyPlan() {

    const plan =
        readJSON(PLAN_KEY, null);

    if (plan && typeof plan === "object") {
        return plan;
    }

    const compatibility =
        readJSON(COMPAT_PLAN_KEY, null);

    if (compatibility && typeof compatibility === "object") {
        return compatibility;
    }

    return null;
}


function getSubjects(plan) {

    if (!plan) {
        return [];
    }

    if (Array.isArray(plan.subjects)) {

        return plan.subjects
            .map(subject => {

                if (typeof subject === "string") {

                    return {
                        name: subject,
                        topics: []
                    };

                }

                return {
                    ...subject,
                    name:
                        subject.name ||
                        subject.subject ||
                        "Subject",
                    topics:
                        Array.isArray(subject.topics)
                            ? subject.topics
                            : []
                };

            });

    }

    if (Array.isArray(plan.subjectNames)) {

        return plan.subjectNames.map(name => ({
            name,
            topics: []
        }));

    }

    return [];
}


function getTopics(plan) {

    if (!plan) {
        return [];
    }

    let topics = [];

    const subjects =
        getSubjects(plan);

    subjects.forEach(subject => {

        if (!Array.isArray(subject.topics)) {
            return;
        }

        subject.topics.forEach(topic => {

            if (typeof topic === "string") {

                topics.push({
                    name: topic,
                    subject: subject.name,
                    description: `Study ${topic} for ${subject.name}.`
                });

                return;
            }

            topics.push({
                ...topic,
                name:
                    topic.name ||
                    topic.topic ||
                    "Topic",
                subject:
                    topic.subject ||
                    subject.name,
                description:
                    topic.description ||
                    `Study ${topic.name} for ${subject.name}.`
            });

        });

    });


    if (topics.length) {
        return topics;
    }


    if (Array.isArray(plan.topics)) {

        return plan.topics.map(topic => {

            if (typeof topic === "string") {

                return {
                    name: topic,
                    subject:
                        plan.subjectNames?.[0] ||
                        "Subject",
                    description:
                        `Study ${topic}.`
                };

            }

            return {
                ...topic,
                name:
                    topic.name ||
                    topic.topic ||
                    "Topic",
                subject:
                    topic.subject ||
                    "Subject",
                description:
                    topic.description ||
                    `Study ${topic.name || topic.topic}.`
            };

        });

    }


    if (Array.isArray(plan.topicNames)) {

        return plan.topicNames.map(topic => ({
            name: topic,
            subject:
                plan.subjectNames?.[0] ||
                "Subject",
            description:
                `Study ${topic}.`
        }));

    }


    return [];
}


/* =========================================================
   CURRENT TOPIC
========================================================= */

function getCurrentTopicIndex() {

    const topics =
        getTopics(getStudyPlan());

    if (!topics.length) {
        return 0;
    }

    let index =
        Number(
            localStorage.getItem(
                CURRENT_TOPIC_KEY
            )
        );

    if (!Number.isFinite(index)) {
        index = 0;
    }

    return Math.max(
        0,
        Math.min(index, topics.length - 1)
    );
}


function getCurrentTopic() {

    const topics =
        getTopics(getStudyPlan());

    if (!topics.length) {
        return null;
    }

    return topics[getCurrentTopicIndex()];
}


function topicKey(topic) {

    if (!topic) {
        return "";
    }

    if (topic.key) {
        return String(topic.key).trim().toLowerCase();
    }

    return [
        topic.subject || "",
        topic.name || topic.topic || ""
    ]
        .join("::")
        .trim()
        .toLowerCase();
}


/* =========================================================
   COMPLETED TOPICS
========================================================= */

function getCompletedTopics() {

    const value =
        readJSON(
            COMPLETED_TOPICS_KEY,
            []
        );

    return Array.isArray(value)
        ? value
        : [];
}


function isTopicCompleted(topic) {

    if (!topic) {
        return false;
    }

    const completed =
        getCompletedTopics();

    const key =
        topicKey(topic);

    return completed.some(item => {

        if (typeof item === "string") {

            return (
                item === key ||
                item === topic.name
            );

        }

        return (
            item?.key === key ||
            item?.topicKey === key ||
            item?.name === topic.name
        );

    });
}


function saveCompletedTopics(items) {

    writeJSON(
        COMPLETED_TOPICS_KEY,
        items
    );
}


function markTopicCompleted(topic) {

    if (!topic) {
        return;
    }

    const items =
        getCompletedTopics();

    const key =
        topicKey(topic);

    if (
        !items.some(item =>
            typeof item === "string"
                ? item === key
                : item?.key === key ||
                  item?.topicKey === key
        )
    ) {

        items.push({
            key,
            name: topic.name,
            subject: topic.subject,
            completedAt:
                new Date().toISOString()
        });

    }

    saveCompletedTopics(items);
}


/* =========================================================
   KNOWLEDGE CHECK
========================================================= */

function openKnowledgeCheckPage(topic) {

    if (!topic) {
        return;
    }

    /*
       IMPORTANT:
       The dashboard NEVER loads old question content.

       It only stores the CURRENT topic that the
       Knowledge Check page should use.
    */

    const payload = {
        name: topic.name || "",
        subject: topic.subject || "",
        description: topic.description || "",
        key: topicKey(topic),
        checkId:
            `${topicKey(topic)}-${Date.now()}`
    };

    writeJSON(
        KNOWLEDGE_TOPIC_KEY,
        payload
    );

    /*
       Remove the old global question cache.

       knowledge-check.js will generate fresh questions
       for the selected topic.
    */
    removeStorage(KNOWLEDGE_QUESTIONS_KEY);

    window.location.href =
        "knowledge-check.html";
}

window.openKnowledgeCheckPage =
    openKnowledgeCheckPage;


function getCompletedQuestionTopics() {

    const value =
        readJSON(
            COMPLETED_QUESTIONS_KEY,
            []
        );

    return Array.isArray(value)
        ? value
        : [];
}


function hasKnowledgeCheckCompleted(topic) {

    if (!topic) {
        return false;
    }

    const key =
        topicKey(topic);

    return getCompletedQuestionTopics()
        .some(item => {

            if (typeof item === "string") {
                return (
                    item === key ||
                    item === topic.name
                );
            }

            return (
                item?.key === key ||
                item?.topicKey === key ||
                item?.name === topic.name
            );
        });
}


/* =========================================================
   DASHBOARD RENDER
========================================================= */

function renderCurrentTopic() {

    const topic =
        getCurrentTopic();

    const plan =
        getStudyPlan();

    const topics =
        getTopics(plan);


    if (!topic) {

        if ($("currentTopicName")) {
            $("currentTopicName").textContent =
                "No study plan yet";
        }

        if ($("currentTopicDescription")) {
            $("currentTopicDescription").textContent =
                "Create a study plan to begin studying.";
        }

        if ($("topicPosition")) {
            $("topicPosition").textContent =
                "No topic";
        }

        return;
    }


    const index =
        getCurrentTopicIndex();

    const completed =
        isTopicCompleted(topic);

    if ($("currentTopicName")) {

        $("currentTopicName").textContent =
            topic.name;
    }


    if ($("currentTopicDescription")) {

        $("currentTopicDescription").textContent =
            topic.description ||
            `Study ${topic.name}.`;
    }


    if ($("topicPosition")) {

        $("topicPosition").textContent =
            `Topic ${index + 1} of ${topics.length}`;
    }


    if ($("topicStatusBadge")) {

        $("topicStatusBadge").textContent =
            completed
                ? "Completed"
                : "In Progress";
    }


    if ($("topicStatusBadge")) {

        $("topicStatusBadge").classList.toggle(
            "completed",
            completed
        );
    }


    renderTopicCompletion(topic);

    /*
       The dashboard must NOT render questions.

       The Knowledge Check page owns all question rendering.
    */
    hideDashboardQuestions();

    renderProgress();
}


/* =========================================================
   HIDE OLD DASHBOARD QUESTION UI
========================================================= */

function hideDashboardQuestions() {

    const section =
        $("topicQuestionsSection");

    if (section) {
        section.style.display = "none";
    }

    const questions =
        $("topicQuestions");

    if (questions) {
        questions.innerHTML = "";
    }

    const result =
        $("topicQuestionResult");

    if (result) {
        result.innerHTML = "";
    }

    const submit =
        $("submitTopicQuestions");

    if (submit) {
        submit.style.display = "none";
    }
}


/* =========================================================
   TOPIC COMPLETION
========================================================= */

function renderTopicCompletion(topic) {

    const area =
        $("topicCompletionArea");

    const checkbox =
        $("topicCompleteCheckbox");

    const message =
        $("topicCompletionMessage");

    const nextMessage =
        $("nextTopicMessage");


    if (!topic) {
        return;
    }


    const completed =
        isTopicCompleted(topic);


    if (checkbox) {

        checkbox.checked =
            completed;

        checkbox.disabled =
            completed;
    }


    if (message) {

        message.textContent =
            completed
                ? "Topic completed."
                : "I have finished studying this topic.";
    }


    const topics =
        getTopics(getStudyPlan());

    const index =
        getCurrentTopicIndex();


    if (nextMessage) {

        if (completed && index < topics.length - 1) {

            nextMessage.textContent =
                `Next topic: ${topics[index + 1].name}`;

        } else if (completed) {

            nextMessage.textContent =
                "You have completed all topics.";

        } else {

            nextMessage.textContent =
                "";
        }
    }


    if (area) {

        area.style.display =
            "block";
    }


    renderKnowledgeCheckButton(topic);
}


/* =========================================================
   KNOWLEDGE CHECK BUTTON
========================================================= */

function renderKnowledgeCheckButton(topic) {

    const container =
        $("topicQuestionsSection");

    if (!container || !topic) {
        return;
    }

    /*
       Do not display question content.

       Replace the old dashboard question area with
       a simple navigation CTA.
    */

    container.style.display = "block";

    container.innerHTML = `
        <div class="knowledge-check-dashboard-card">
            <div class="knowledge-check-dashboard-icon">
                ✓
            </div>

            <div class="knowledge-check-dashboard-content">
                <h3>Knowledge Check</h3>

                <p>
                    Test your understanding of
                    <strong>${escapeHTML(topic.name)}</strong>.
                </p>

                <span>
                    Premium users can choose 5, 10, 20, 30,
                    40, 50 or 60 questions.
                </span>

                <button
                    type="button"
                    id="dashboardKnowledgeCheckButton"
                    class="primary-button"
                >
                    Start Knowledge Check →
                </button>
            </div>
        </div>
    `;


    const button =
        $("dashboardKnowledgeCheckButton");

    if (button) {

        button.addEventListener(
            "click",
            () => openKnowledgeCheckPage(topic)
        );
    }
}


/* =========================================================
   PROGRESS
========================================================= */

function renderProgress() {

    const plan =
        getStudyPlan();

    const topics =
        getTopics(plan);

    const completed =
        topics.filter(
            topic => isTopicCompleted(topic)
        ).length;


    const percent =
        topics.length
            ? Math.round(
                (completed / topics.length) * 100
            )
            : 0;


    if ($("progressPercent")) {

        $("progressPercent").textContent =
            `${percent}%`;
    }


    if ($("progressCount")) {

        $("progressCount").textContent =
            `${completed} of ${topics.length} topics completed`;
    }


    if ($("progressBar")) {

        $("progressBar").style.width =
            `${percent}%`;
    }


    renderTopicList(plan);
    renderSubjectList(plan);
}


/* =========================================================
   TOPIC LIST
========================================================= */

function renderTopicList(plan) {

    const container =
        $("topicList");

    if (!container) {
        return;
    }


    const topics =
        getTopics(plan);


    if (!topics.length) {

        container.innerHTML =
            `<div class="empty-state">
                No topics available yet.
            </div>`;

        return;
    }


    const current =
        getCurrentTopicIndex();


    container.innerHTML =
        topics.map((topic, index) => {

            const completed =
                isTopicCompleted(topic);

            const active =
                index === current;


            return `
                <button
                    type="button"
                    class="dashboard-topic-item
                        ${active ? "active" : ""}
                        ${completed ? "completed" : ""}"
                    data-topic-index="${index}"
                >
                    <span class="topic-number">
                        ${completed ? "✓" : index + 1}
                    </span>

                    <span class="topic-item-content">
                        <strong>
                            ${escapeHTML(topic.name)}
                        </strong>

                        <small>
                            ${escapeHTML(topic.subject || "")}
                        </small>
                    </span>
                </button>
            `;

        }).join("");


    container
        .querySelectorAll("[data-topic-index]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.dataset.topicIndex
                        );

                    localStorage.setItem(
                        CURRENT_TOPIC_KEY,
                        String(index)
                    );

                    renderCurrentTopic();
                }
            );

        });
}


/* =========================================================
   SUBJECT LIST
========================================================= */

function renderSubjectList(plan) {

    const container =
        $("subjectList");

    if (!container) {
        return;
    }


    const subjects =
        getSubjects(plan);

    const topics =
        getTopics(plan);


    if (!subjects.length) {

        container.innerHTML =
            `<div class="empty-state">
                No subjects available.
            </div>`;

        return;
    }


    container.innerHTML =
        subjects.map((subject, index) => {

            const subjectTopics =
                topics.filter(
                    topic =>
                        topic.subject === subject.name
                );


            const done =
                subjectTopics.filter(
                    topic => isTopicCompleted(topic)
                ).length;


            const complete =
                subjectTopics.length > 0 &&
                done === subjectTopics.length;


            return `
                <div class="dashboard-subject-item">
                    <label>
                        <input
                            type="checkbox"
                            class="subject-checkbox"
                            data-subject-index="${index}"
                            ${complete ? "checked" : ""}
                        >

                        <span>
                            ${escapeHTML(subject.name)}
                        </span>
                    </label>

                    <small>
                        ${done}/${subjectTopics.length}
                        topics
                    </small>
                </div>
            `;

        }).join("");


    container
        .querySelectorAll(".subject-checkbox")
        .forEach(input => {

            input.addEventListener(
                "change",
                () => {

                    saveCompletedSubjectState();

                    if (
                        areAllSubjectsCompleted()
                    ) {
                        markTodayCompleted();
                    }

                    renderCalendar();
                }
            );

        });
}


/* =========================================================
   SUBJECT COMPLETION
========================================================= */

function saveCompletedSubjectState() {

    const values = {};

    document
        .querySelectorAll(
            "#subjectList input[type='checkbox']"
        )
        .forEach(input => {

            values[
                input.dataset.subjectIndex
            ] = input.checked;

        });


    writeJSON(
        COMPLETED_SUBJECTS_KEY,
        values
    );
}


function areAllSubjectsCompleted() {

    const boxes =
        document.querySelectorAll(
            "#subjectList input[type='checkbox']"
        );

    if (!boxes.length) {
        return false;
    }

    return Array.from(boxes)
        .every(box => box.checked);
}


function markTodayCompleted() {

    const days =
        readJSON(
            COMPLETED_DAYS_KEY,
            []
        );

    const today =
        dateKey(new Date());


    if (!days.includes(today)) {

        days.push(today);

        writeJSON(
            COMPLETED_DAYS_KEY,
            days
        );
    }
}


/* =========================================================
   TIMER
========================================================= */

function initializeTimer() {

    let duration =
        Number(
            localStorage.getItem(
                TIMER_DURATION_KEY
            )
        );


    if (!TIMER_OPTIONS[duration]) {
        duration = 25;
    }


    timerSeconds =
        Number(
            localStorage.getItem(
                TIMER_SECONDS_KEY
            )
        );


    if (
        !Number.isFinite(timerSeconds) ||
        timerSeconds <= 0 ||
        timerSeconds > TIMER_OPTIONS[duration]
    ) {

        timerSeconds =
            TIMER_OPTIONS[duration];
    }


    const select =
        $("timerDuration");

    if (select) {

        select.value =
            String(duration);

        select.addEventListener(
            "change",
            () => {

                const selected =
                    Number(select.value);

                if (!TIMER_OPTIONS[selected]) {
                    return;
                }

                pauseTimer();

                timerSeconds =
                    TIMER_OPTIONS[selected];

                localStorage.setItem(
                    TIMER_DURATION_KEY,
                    String(selected)
                );

                saveTimer();

                updateTimerDisplay();
            }
        );
    }


    const start =
        $("startTimerButton");

    const pause =
        $("pauseTimerButton");

    const reset =
        $("resetTimerButton");


    if (start) {

        start.addEventListener(
            "click",
            startTimer
        );
    }


    if (pause) {

        pause.addEventListener(
            "click",
            pauseTimer
        );
    }


    if (reset) {

        reset.addEventListener(
            "click",
            resetTimer
        );
    }


    updateTimerDisplay();
}


function getSelectedTimerMinutes() {

    const select =
        $("timerDuration");

    const value =
        Number(select?.value || 25);

    return TIMER_OPTIONS[value]
        ? value
        : 25;
}


function startTimer() {

    if (timerRunning) {
        return;
    }


    timerRunning = true;


    timerInterval =
        setInterval(
            () => {

                if (timerSeconds <= 0) {

                    pauseTimer();

                    updateTimerDisplay();

                    return;
                }


                timerSeconds--;

                saveTimer();

                updateTimerDisplay();

            },
            1000
        );
}


function pauseTimer() {

    timerRunning = false;


    if (timerInterval) {

        clearInterval(
            timerInterval
        );

        timerInterval = null;
    }


    saveTimer();
}


function resetTimer() {

    pauseTimer();


    timerSeconds =
        TIMER_OPTIONS[
            getSelectedTimerMinutes()
        ];


    saveTimer();

    updateTimerDisplay();
}


function saveTimer() {

    localStorage.setItem(
        TIMER_SECONDS_KEY,
        String(timerSeconds)
    );
}


function updateTimerDisplay() {

    const display =
        $("studyTimer");

    if (!display) {
        return;
    }


    const minutes =
        Math.floor(
            timerSeconds / 60
        );

    const seconds =
        timerSeconds % 60;


    display.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}


/* =========================================================
   CALENDAR
========================================================= */

function dateKey(date) {

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

    return `${year}-${month}-${day}`;
}


function sameDay(a, b) {

    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}


function isExamDay(date, plan) {

    if (!plan?.examDate) {
        return false;
    }

    return (
        dateKey(date) ===
        String(plan.examDate).slice(0, 10)
    );
}


function isPostExamDay(date, plan) {

    if (!plan?.examDate) {
        return false;
    }

    const exam =
        new Date(
            `${String(plan.examDate).slice(0, 10)}T00:00:00`
        );

    const current =
        new Date(
            `${dateKey(date)}T00:00:00`
        );


    return current > exam;
}


function isBreakDay(date, plan) {

    if (!plan) {
        return false;
    }


    /*
       Respect timetable/rest-day information when available.
    */

    const timetable =
        Array.isArray(plan.timetableData)
            ? plan.timetableData
            : [];


    const dayName =
        date.toLocaleDateString(
            "en-US",
            { weekday: "long" }
        );


    const row =
        timetable.find(
            item =>
                String(
                    item?.day ||
                    item?.dayName ||
                    ""
                ).toLowerCase() ===
                dayName.toLowerCase()
        );


    if (!row) {
        return false;
    }


    const text =
        JSON.stringify(row)
            .toLowerCase();


    return (
        text.includes("rest") ||
        text.includes("break")
    );
}


function isCompletedCalendarDay(date) {

    const completed =
        readJSON(
            COMPLETED_DAYS_KEY,
            []
        );

    return (
        Array.isArray(completed) &&
        completed.includes(
            dateKey(date)
        )
    );
}


function renderCalendar() {

    const container =
        $("calendarDays");

    if (!container) {
        return;
    }


    const plan =
        getStudyPlan();


    const year =
        calendarDate.getFullYear();

    const month =
        calendarDate.getMonth();


    const monthTitle =
        calendarDate.toLocaleDateString(
            "en-US",
            {
                month: "long",
                year: "numeric"
            }
        );


    if ($("calendarMonth")) {

        $("calendarMonth").textContent =
            monthTitle;
    }


    container.innerHTML = "";


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


    for (
        let i = 0;
        i < firstDay;
        i++
    ) {

        const blank =
            document.createElement("div");

        blank.className =
            "calendar-day empty";

        container.appendChild(blank);
    }


    const today =
        new Date();


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
            document.createElement("div");


        cell.className =
            "calendar-day";


        if (sameDay(date, today)) {

            cell.classList.add(
                "today"
            );
        }


        /*
           PRIORITY:
           1. Exam
           2. Post-exam
           3. Completed
           4. Rest
           5. Future study
           6. Other grey
        */


        if (isExamDay(date, plan)) {

            cell.classList.add(
                "exam-day"
            );

            cell.innerHTML = `
                <span>${day}</span>
                <small>EXAM</small>
            `;

        } else if (
            isPostExamDay(date, plan)
        ) {

            cell.classList.add(
                "post-exam-day"
            );

            cell.innerHTML = `
                <span>${day}</span>
            `;

        } else if (
            isCompletedCalendarDay(date)
        ) {

            cell.classList.add(
                "completed-day"
            );

            cell.innerHTML = `
                <span>${day}</span>
                <small>DONE</small>
            `;

        } else if (
            isBreakDay(date, plan)
        ) {

            cell.classList.add(
                "break-day"
            );

            cell.innerHTML = `
                <span>${day}</span>
                <small>REST</small>
            `;

        } else if (
            plan &&
            date >= new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate()
            )
        ) {

            cell.classList.add(
                "study-day"
            );

            cell.innerHTML = `
                <span>${day}</span>
            `;

        } else {

            cell.innerHTML = `
                <span>${day}</span>
            `;
        }


        container.appendChild(cell);
    }
}


function initializeCalendar() {

    const previous =
        $("previousMonth");

    const next =
        $("nextMonth");


    if (previous) {

        previous.addEventListener(
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


    if (next) {

        next.addEventListener(
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


    const plan =
        getStudyPlan();


    if (!plan) {

        container.innerHTML =
            `<div class="empty-schedule">
                Create a study plan to see your schedule.
            </div>`;

        return;
    }


    const timetable =
        Array.isArray(plan.timetableData)
            ? plan.timetableData
            : [];


    if (!timetable.length) {

        container.innerHTML =
            `<div class="empty-schedule">
                Your daily study sessions will appear here.
            </div>`;

        return;
    }


    container.innerHTML =
        timetable
            .slice(0, 7)
            .map(day => {

                const name =
                    day?.day ||
                    day?.dayName ||
                    "Study Day";

                const subjects =
                    day?.subjects ||
                    day?.schedule ||
                    day?.sessions ||
                    [];


                let content = "";


                if (Array.isArray(subjects)) {

                    content =
                        subjects
                            .map(item => {

                                if (
                                    typeof item === "string"
                                ) {
                                    return escapeHTML(item);
                                }

                                return escapeHTML(
                                    item?.subject ||
                                    item?.name ||
                                    item?.topic ||
                                    "Study session"
                                );

                            })
                            .join(" • ");

                } else {

                    content =
                        escapeHTML(
                            String(subjects)
                        );
                }


                return `
                    <div class="schedule-item">
                        <strong>
                            ${escapeHTML(name)}
                        </strong>

                        <span>
                            ${content || "Study session"}
                        </span>
                    </div>
                `;

            })
            .join("");
}


/* =========================================================
   STATS
========================================================= */

function updateStats() {

    const plan =
        getStudyPlan();


    const topics =
        getTopics(plan);


    const completed =
        topics.filter(
            topic => isTopicCompleted(topic)
        ).length;


    const score =
        getStudyScore();


    let daysLeft = 0;


    if (plan?.examDate) {

        const exam =
            new Date(
                `${String(plan.examDate).slice(0, 10)}T00:00:00`
            );


        const today =
            new Date();

        today.setHours(
            0, 0, 0, 0
        );


        daysLeft =
            Math.max(
                0,
                Math.ceil(
                    (
                        exam - today
                    ) /
                    86400000
                )
            );
    }


    if ($("daysLeft")) {

        $("daysLeft").textContent =
            String(daysLeft);
    }


    if ($("dailyGoal")) {

        $("dailyGoal").textContent =
            `${plan?.hoursPerDay || 0}h`;
    }


    if ($("studyScore")) {

        $("studyScore").textContent =
            String(score);
    }


    if ($("weeklyHours")) {

        const hours =
            Number(
                plan?.hoursPerDay || 0
            ) * 7;

        $("weeklyHours").textContent =
            `${hours}h`;
    }
}


/* =========================================================
   STUDY SCORE
========================================================= */

function getStudyScore() {

    const saved =
        Number(
            localStorage.getItem(
                SCORE_KEY
            )
        );


    if (
        Number.isFinite(saved) &&
        saved >= 0
    ) {

        return Math.min(
            100,
            Math.round(saved)
        );
    }


    const topics =
        getTopics(getStudyPlan());


    if (!topics.length) {
        return 100;
    }


    const completed =
        topics.filter(
            topic => isTopicCompleted(topic)
        ).length;


    return Math.round(
        100 *
        (
            completed /
            topics.length
        )
    );
}


function updateStudyScore() {

    const score =
        getStudyScore();

    localStorage.setItem(
        SCORE_KEY,
        String(score)
    );

    if ($("studyScore")) {
        $("studyScore").textContent =
            String(score);
    }
}


/* =========================================================
   STREAK
========================================================= */

function updateStreak() {

    const today =
        dateKey(new Date());


    const last =
        localStorage.getItem(
            LAST_STUDY_DATE_KEY
        );


    let streak =
        Number(
            localStorage.getItem(
                STREAK_KEY
            ) || 0
        );


    if (!Number.isFinite(streak)) {
        streak = 0;
    }


    if (!last) {

        streak = 1;

        localStorage.setItem(
            STREAK_KEY,
            String(streak)
        );

        localStorage.setItem(
            LAST_STUDY_DATE_KEY,
            today
        );

    } else if (last !== today) {

        const lastDate =
            new Date(
                `${last}T00:00:00`
            );

        const currentDate =
            new Date(
                `${today}T00:00:00`
            );


        const difference =
            Math.round(
                (
                    currentDate -
                    lastDate
                ) / 86400000
            );


        if (difference === 1) {

            streak++;

        } else if (difference > 1) {

            streak = 1;
        }


        localStorage.setItem(
            STREAK_KEY,
            String(streak)
        );

        localStorage.setItem(
            LAST_STUDY_DATE_KEY,
            today
        );
    }


    return streak;
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

    const badge =
        $("dailyChallengeBadge");

    const text =
        $("dailyChallengeText");


    const topic =
        getCurrentTopic();


    if (!topic) {
        return;
    }


    const completed =
        isTopicCompleted(topic);


    if (title) {

        title.textContent =
            "Master today's topic";
    }


    if (description) {

        description.textContent =
            `Complete ${topic.name} and test yourself with a Knowledge Check.`;
    }


    if (progress) {

        progress.textContent =
            completed
                ? "Completed"
                : "In progress";
    }


    if (progressBar) {

        progressBar.style.width =
            completed
                ? "100%"
                : "50%";
    }


    if (badge) {

        badge.textContent =
            completed
                ? "DONE"
                : "TODAY";
    }


    if (text) {

        text.textContent =
            completed
                ? "Great work. Keep your streak going."
                : "Stay consistent and complete your current topic.";
    }


    const button =
        $("dailyChallengeButton");


    if (button) {

        button.onclick =
            () => openKnowledgeCheckPage(topic);
    }
}


/* =========================================================
   NEXT BOOKING
========================================================= */

function renderNextBooking() {

    const plan =
        getStudyPlan();

    const next =
        $("nextBooking");

    const time =
        $("nextBookingTime");


    if (!plan) {

        if (next) {
            next.textContent =
                "No study session";
        }

        if (time) {
            time.textContent =
                "Create a study plan first.";
        }

        return;
    }


    const topic =
        getCurrentTopic();


    if (next) {

        next.textContent =
            topic
                ? topic.name
                : "Study session";
    }


    if (time) {

        time.textContent =
            plan.startTime
                ? `Starts at ${plan.startTime}`
                : "Your next study session";
    }
}


/* =========================================================
   PREMIUM
========================================================= */

async function checkPremiumStatus() {

    isPremium = false;


    try {

        if (
            !window.supabaseClient ||
            !window.supabaseClient.auth
        ) {
            return false;
        }


        const response =
            await window.supabaseClient.auth.getSession();


        const session =
            response?.data?.session;


        currentUser =
            session?.user || null;


        if (!session?.access_token) {
            return false;
        }


        const result =
            await fetch(
                PREMIUM_STATUS_ENDPOINT,
                {
                    method: "GET",
                    headers: {
                        Authorization:
                            `Bearer ${session.access_token}`
                    }
                }
            );


        if (!result.ok) {
            return false;
        }


        const data =
            await result.json();


        isPremium =
            data?.premium === true;


        if (isPremium) {

            document.body.classList.add(
                "premium-dashboard"
            );

            document.documentElement.classList.add(
                "premium-dashboard"
            );

        } else {

            document.body.classList.remove(
                "premium-dashboard"
            );

            document.documentElement.classList.remove(
                "premium-dashboard"
            );
        }


        return isPremium;

    } catch (error) {

        console.warn(
            "Premium status unavailable:",
            error
        );

        return false;
    }
}


/* =========================================================
   AI ASSISTANT SUPPORT
========================================================= */

function getAIQuestionCount() {

    const count =
        Number(
            localStorage.getItem(
                AI_COUNT_KEY
            ) || 0
        );


    return Number.isFinite(count)
        ? Math.max(0, count)
        : 0;
}


function canAskAI() {

    if (isPremium) {
        return true;
    }

    return (
        getAIQuestionCount() <
        FREE_AI_LIMIT
    );
}


function recordAIQuestion() {

    if (isPremium) {
        return;
    }


    localStorage.setItem(
        AI_COUNT_KEY,
        String(
            getAIQuestionCount() + 1
        )
    );


    updateAIUsageDisplay();
}


function updateAIUsageDisplay() {

    const count =
        getAIQuestionCount();


    const percent =
        Math.min(
            100,
            Math.round(
                (
                    count /
                    FREE_AI_LIMIT
                ) * 100
            )
        );


    const badge =
        $("aiCountBadge");

    const text =
        $("aiUsageText");

    const percentage =
        $("aiUsagePercent");

    const bar =
        $("aiUsageProgressBar");


    if (badge) {

        badge.textContent =
            isPremium
                ? "Premium"
                : `${count}/${FREE_AI_LIMIT}`;
    }


    if (text) {

        text.textContent =
            isPremium
                ? "Unlimited AI questions."
                : `${count} of ${FREE_AI_LIMIT} free AI questions used.`;
    }


    if (percentage) {

        percentage.textContent =
            isPremium
                ? "∞"
                : `${percent}%`;
    }


    if (bar) {

        bar.style.width =
            `${isPremium ? 100 : percent}%`;
    }
}


function buildStudyContext() {

    const plan =
        getStudyPlan();

    const topics =
        getTopics(plan);

    const current =
        getCurrentTopic();


    return `
Study plan:
Curriculum: ${plan?.curriculum || "Nigerian Senior Secondary Curriculum"}
Exam date: ${plan?.examDate || "Not specified"}
Days remaining: ${plan?.daysLeft ?? "Not specified"}
Study hours per day: ${plan?.hoursPerDay || "Not specified"}

Subjects:
${getSubjects(plan)
    .map(subject => subject.name)
    .join(", ")}

Current topic:
${current?.name || "None"}

Current subject:
${current?.subject || "None"}

Progress:
${topics.filter(isTopicCompleted).length}/${topics.length} topics completed.
`;
}


function buildAIPrompt(question, mode) {

    return `
You are StudyMind AI, an educational study assistant.

${buildStudyContext()}

Student request:
${question}

Mode:
${mode || "general"}

Rules:
- Give accurate educational information.
- Personalize the response using the study context.
- Do not invent information about the student's study plan.
- Use clear headings and bullet points when useful.
- Explain difficult ideas step by step.
- Prioritize unfinished topics when discussing study plans.
- Use LaTeX for mathematical expressions when appropriate.
- Do not use raw HTML.
`;
}


function extractAIAnswer(data) {

    if (!data) {
        return "";
    }


    if (typeof data === "string") {
        return data;
    }


    return (
        data.reply ||
        data.answer ||
        data.response ||
        data.content ||
        data.output_text ||
        data.output ||
        data.result ||
        data.message ||
        data.choices?.[0]?.message?.content ||
        ""
    );
}


async function callStudyMindAI(
    question,
    mode = "general"
) {

    const response =
        await fetch(
            "/api/ask-ai",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    message:
                        buildAIPrompt(
                            question,
                            mode
                        ),
                    mode
                })
            }
        );


    if (!response.ok) {

        throw new Error(
            "AI request failed."
        );
    }


    const data =
        await response.json();


    const answer =
        extractAIAnswer(data);


    if (!answer) {

        throw new Error(
            "AI returned an empty response."
        );
    }


    return answer;
}


async function askStudyMindAI() {

    const input =
        $("aiQuestion");


    const output =
        $("aiResponse");


    if (!input || !output) {
        return;
    }


    const question =
        input.value.trim();


    if (!question) {
        return;
    }


    if (!canAskAI()) {

        output.innerHTML = `
            <div class="ai-limit-message">
                <strong>Free AI limit reached.</strong>
                <p>
                    You have used all ${FREE_AI_LIMIT}
                    free AI questions.
                </p>
                <a href="premium.html">
                    Explore Premium →
                </a>
            </div>
        `;

        return;
    }


    output.textContent =
        "StudyMind AI is thinking…";


    try {

        const answer =
            await callStudyMindAI(
                question,
                "general"
            );


        output.innerHTML =
            formatAIResponse(answer);


        recordAIQuestion();


    } catch (error) {

        output.textContent =
            "Sorry, I couldn't answer that right now.";
    }
}


async function analyzeProgress() {

    const output =
        $("aiAdviceText");


    if (!output) {
        return;
    }


    if (!canAskAI()) {

        output.innerHTML = `
            <strong>Free AI limit reached.</strong>
            <p>
                Upgrade to Premium for unlimited AI assistance.
            </p>
        `;

        return;
    }


    output.textContent =
        "Analyzing your study progress…";


    try {

        const answer =
            await callStudyMindAI(
                `
Analyze my current study progress.

Tell me:
1. What I have completed.
2. What I should focus on next.
3. Which areas need the most attention.
4. What I should do during my next study session.
                `,
                "progress_analysis"
            );


        output.innerHTML =
            formatAIResponse(answer);


        recordAIQuestion();


    } catch (error) {

        output.textContent =
            "Unable to analyze progress right now.";
    }
}


function formatAIResponse(text) {

    return escapeHTML(
        String(text || "")
    )
        .replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        )
        .replace(
            /^### (.*)$/gm,
            "<h4>$1</h4>"
        )
        .replace(
            /^## (.*)$/gm,
            "<h3>$1</h3>"
        )
        .replace(
            /^# (.*)$/gm,
            "<h2>$1</h2>"
        )
        .replace(
            /^\s*[-•]\s+(.*)$/gm,
            "<li>$1</li>"
        )
        .replace(
            /(<li>.*<\/li>)/gs,
            "<ul>$1</ul>"
        )
        .replace(
            /\n{2,}/g,
            "<br><br>"
        )
        .replace(
            /\n/g,
            "<br>"
        );
}


function escapeHTML(value) {

    return String(value ?? "")
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
   AI ASSISTANT PAGE BUTTONS
========================================================= */

function useQuickQuestion(question) {

    const input =
        $("aiQuestion");

    if (!input) {
        return;
    }


    input.value =
        question;

    input.focus();
}


function sendQuickQuestion(question) {

    const input =
        $("aiQuestion");

    if (!input) {
        return;
    }


    input.value =
        question;

    askStudyMindAI();
}


/* =========================================================
   NAVIGATION
========================================================= */

function openHome() {

    window.location.href =
        "home.html";
}


function openNewStudyPlan() {

    window.location.href =
        "home.html#generator";
}


function openSummarizer() {

    window.location.href =
        "summarizer.html";
}


function openStudyStreak() {

    window.location.href =
        "study-streak.html";
}


function openStudyScore() {

    window.location.href =
        "study-score.html";
}


function openPremium() {

    window.location.href =
        "premium.html";
}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutStudyMind() {

    try {

        if (
            window.supabaseClient?.auth
        ) {

            await window.supabaseClient
                .auth
                .signOut();
        }

    } catch (error) {

        console.warn(
            "Logout failed:",
            error
        );
    }


    window.location.href =
        "login.html";
}


function logout() {
    logoutStudyMind();
}


/* =========================================================
   THEME
========================================================= */

function applyTheme() {

    const saved =
        localStorage.getItem(
            THEME_KEY
        ) || "dark";


    const light =
        saved === "light";


    document.documentElement.classList.toggle(
        "light-mode",
        light
    );

    document.documentElement.classList.toggle(
        "dark-mode",
        !light
    );


    document.body.classList.toggle(
        "light-mode",
        light
    );

    document.body.classList.toggle(
        "dark-mode",
        !light
    );


    document.documentElement.style.colorScheme =
        light
            ? "light"
            : "dark";


    updateThemeButton();
}


function updateThemeButton() {

    const button =
        $("themeButton");

    if (!button) {
        return;
    }


    const light =
        localStorage.getItem(
            THEME_KEY
        ) === "light";


    button.textContent =
        light
            ? "🌙 Dark Mode"
            : "☀️ Light Mode";
}


function toggleTheme() {

    const current =
        localStorage.getItem(
            THEME_KEY
        ) || "dark";


    localStorage.setItem(
        THEME_KEY,
        current === "light"
            ? "dark"
            : "light"
    );


    applyTheme();
}


/* =========================================================
   WELCOME HEADER
========================================================= */

function renderGreeting() {

    const plan =
        getStudyPlan();

    const user =
        currentUser;


    const username =
        user?.user_metadata?.username ||
        user?.user_metadata?.full_name ||
        user?.email?.split("@")[0] ||
        "Student";


    const hour =
        new Date().getHours();


    let greeting =
        "Good morning";


    if (hour >= 12 && hour < 18) {

        greeting =
            "Good afternoon";

    } else if (hour >= 18) {

        greeting =
            "Good evening";
    }


    const heading =
        document.querySelector(
            ".dashboard-header h1"
        );


    if (
        heading &&
        !heading.dataset.staticTitle
    ) {

        heading.innerHTML =
            `${greeting}, ${escapeHTML(username)} 👋`;
    }


    return plan;
}


/* =========================================================
   AUTH
========================================================= */

async function initializeAuthentication() {

    try {

        if (
            window.supabaseClient?.auth
        ) {

            const result =
                await window.supabaseClient
                    .auth
                    .getUser();


            currentUser =
                result?.data?.user || null;
        }

    } catch (error) {

        console.warn(
            "Authentication check failed:",
            error
        );
    }
}


/* =========================================================
   DASHBOARD INITIALIZATION
========================================================= */

async function initializeDashboard() {

    applyTheme();

    await initializeAuthentication();

    await checkPremiumStatus();


    /*
       If this page is actually the AI Assistant page,
       support the AI controls but do not run dashboard
       rendering that requires dashboard-only elements.
    */

    const isDashboard =
        Boolean(
            $("currentTopicName") ||
            $("topicList") ||
            $("calendarDays") ||
            $("studyTimer")
        );


    if (!isDashboard) {

        updateAIUsageDisplay();

        return;
    }


    const plan =
        getStudyPlan();


    if (!plan) {

        renderCurrentTopic();
        renderProgress();
        renderSchedule();
        renderCalendar();
        updateStats();

        return;
    }


    renderGreeting();

    initializeTimer();

    initializeCalendar();

    renderCurrentTopic();

    renderProgress();

    renderSchedule();

    renderNextBooking();

    renderDailyChallenge();

    updateStats();

    updateStudyScore();

    updateStreak();

    updateAIUsageDisplay();


    /*
       The dashboard NEVER reads old questions.
       Remove any stale global question cache here.
    */
    removeStorage(
        KNOWLEDGE_QUESTIONS_KEY
    );
}


/* =========================================================
   EVENT CONNECTIONS
========================================================= */

function initializeButtons() {

    const theme =
        $("themeButton");


    if (theme) {

        theme.addEventListener(
            "click",
            toggleTheme
        );
    }


    const checkbox =
        $("topicCompleteCheckbox");


    if (checkbox) {

        checkbox.addEventListener(
            "change",
            () => {

                const topic =
                    getCurrentTopic();


                if (
                    checkbox.checked &&
                    topic
                ) {

                    markTopicCompleted(
                        topic
                    );


                    /*
                       Move the user to the next topic
                       only after completion.
                    */

                    const topics =
                        getTopics(
                            getStudyPlan()
                        );


                    const index =
                        getCurrentTopicIndex();


                    if (
                        index <
                        topics.length - 1
                    ) {

                        localStorage.setItem(
                            CURRENT_TOPIC_KEY,
                            String(index + 1)
                        );
                    }


                    renderCurrentTopic();

                    renderProgress();

                    updateStats();

                    updateStudyScore();

                    renderDailyChallenge();

                    renderNextBooking();

                    renderCalendar();

                } else {

                    renderCurrentTopic();
                }
            }
        );
    }


    const ask =
        $("askAIButton");


    if (ask) {

        ask.addEventListener(
            "click",
            askStudyMindAI
        );
    }


    const analyze =
        $("analyzeProgressButton");


    if (analyze) {

        analyze.addEventListener(
            "click",
            analyzeProgress
        );
    }


    const input =
        $("aiQuestion");


    if (input) {

        input.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    askStudyMindAI();
                }
            }
        );
    }
}


/* =========================================================
   PREMIUM AUTH LISTENER
========================================================= */

function initializeAuthListener() {

    if (
        !window.supabaseClient?.auth
    ) {
        return;
    }


    window.supabaseClient.auth
        .onAuthStateChange(
            async () => {

                await checkPremiumStatus();

                updateAIUsageDisplay();

                renderGreeting();
            }
        );
}


/* =========================================================
   GLOBAL API
========================================================= */

window.getStudyPlan =
    getStudyPlan;

window.getCurrentTopic =
    getCurrentTopic;

window.getCurrentTopicIndex =
    getCurrentTopicIndex;

window.getTopics =
    getTopics;

window.getSubjects =
    getSubjects;

window.isTopicCompleted =
    isTopicCompleted;

window.markTopicCompleted =
    markTopicCompleted;

window.openKnowledgeCheckPage =
    openKnowledgeCheckPage;

window.generateTopicQuestions =
    openKnowledgeCheckPage;

window.submitKnowledgeCheck =
    function () {
        /*
           Knowledge Checks now belong entirely to
           knowledge-check.html.
        */
        const topic =
            getCurrentTopic();

        if (topic) {
            openKnowledgeCheckPage(topic);
        }
    };

window.askStudyMindAI =
    askStudyMindAI;

window.useQuickQuestion =
    useQuickQuestion;

window.sendQuickQuestion =
    sendQuickQuestion;

window.analyzeProgress =
    analyzeProgress;

window.callStudyMindAI =
    callStudyMindAI;

window.formatAIResponse =
    formatAIResponse;

window.openHome =
    openHome;

window.openNewStudyPlan =
    openNewStudyPlan;

window.openSummarizer =
    openSummarizer;

window.openStudyStreak =
    openStudyStreak;

window.openStudyScore =
    openStudyScore;

window.openPremium =
    openPremium;

window.logoutStudyMind =
    logoutStudyMind;

window.logout =
    logout;

window.toggleTheme =
    toggleTheme;

window.checkStudyMindPremiumStatus =
    checkPremiumStatus;


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeButtons();

        initializeAuthListener();

        initializeDashboard();

    }
);
