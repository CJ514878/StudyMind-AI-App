"use strict";

/* =========================================================
   STUDYMIND AI — PROFESSIONAL SCHEDULE
========================================================= */


/* =========================================================
   STORAGE
========================================================= */

const K = {

    PLAN: "studyMindPlan",
    DATA: "studyData",

    PLANS: "studyMindPlans",
    ACTIVE_PLAN: "studyMindActivePlanId",

    COMPLETED_TOPICS: "studyMindCompletedTopics",
    COMPLETED_DAYS: "studyMindCompletedDays",

    CURRENT_SESSION: "studyMindCurrentStudySession",

    USERNAME: "studyMindUsername"

};


/* =========================================================
   HELPERS
========================================================= */

function $(id) {
    return document.getElementById(id);
}


function safeJSON(key, fallback) {

    try {

        const value = localStorage.getItem(key);

        if (!value) {
            return fallback;
        }

        return JSON.parse(value);

    } catch {

        return fallback;

    }

}


function todayISO() {

    const d = new Date();

    const year = d.getFullYear();

    const month =
        String(d.getMonth() + 1).padStart(2, "0");

    const day =
        String(d.getDate()).padStart(2, "0");

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


function isoDate(date) {

    const d = new Date(date);

    const year = d.getFullYear();

    const month =
        String(d.getMonth() + 1).padStart(2, "0");

    const day =
        String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


function formatDate(date) {

    return new Intl.DateTimeFormat(
        undefined,
        {
            weekday: "long",
            month: "short",
            day: "numeric"
        }
    ).format(date);

}


function formatTime(time) {

    if (!time) {
        return "";
    }

    const match =
        String(time).match(/^(\d{1,2}):(\d{2})/);

    if (!match) {
        return String(time);
    }

    let hour = Number(match[1]);

    const minute = match[2];

    const suffix = hour >= 12 ? "PM" : "AM";

    hour = hour % 12 || 12;

    return `${hour}:${minute} ${suffix}`;

}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   PLAN LOADING
========================================================= */

function loadPlan() {

    const allPlans =
        safeJSON(K.PLANS, null);

    const activeId =
        localStorage.getItem(K.ACTIVE_PLAN);

    if (
        Array.isArray(allPlans) &&
        allPlans.length
    ) {

        let active =
            allPlans.find(
                plan =>
                    String(plan.id) === String(activeId)
            );

        if (!active) {
            active = allPlans[0];
        }

        return active;

    }


    return (
        safeJSON(K.PLAN, null) ||
        safeJSON(K.DATA, null) ||
        null
    );

}


const plan = loadPlan();


/* =========================================================
   TOPIC NORMALIZATION
========================================================= */

function normalizeSubjects(plan) {

    if (!plan) {
        return [];
    }

    if (
        Array.isArray(plan.subjects) &&
        plan.subjects.length
    ) {

        return plan.subjects.map(subject => {

            if (typeof subject === "string") {

                return {
                    name: subject,
                    topics: []
                };

            }

            return {

                name:
                    subject.name ||
                    subject.subject ||
                    subject.title ||
                    "Subject",

                topics:
                    normalizeTopicList(
                        subject.topics ||
                        subject.topicList ||
                        subject.units ||
                        []
                    )

            };

        });

    }


    const names =
        Array.isArray(plan.subjectNames)
            ? plan.subjectNames
            : [];


    if (names.length) {

        return names.map(name => ({
            name,
            topics: []
        }));

    }


    return [];

}


function normalizeTopicList(value) {

    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map(topic => {

            if (typeof topic === "string") {
                return {
                    name: topic,
                    difficulty: "Medium"
                };
            }

            return {

                name:
                    topic.name ||
                    topic.topic ||
                    topic.title ||
                    "Topic",

                difficulty:
                    topic.difficulty ||
                    topic.level ||
                    "Medium"

            };

        })
        .filter(topic => topic.name);

}


function getAllTopics() {

    const subjects =
        normalizeSubjects(plan);

    const result = [];

    subjects.forEach(subject => {

        subject.topics.forEach(topic => {

            result.push({

                subject:
                    subject.name,

                topic:
                    topic.name,

                difficulty:
                    topic.difficulty

            });

        });

    });


    /*
       Legacy plans may store a flat topics array.
    */

    if (
        !result.length &&
        Array.isArray(plan?.topics)
    ) {

        plan.topics.forEach(topic => {

            if (typeof topic === "string") {

                result.push({
                    subject:
                        plan.subject ||
                        "General",
                    topic,
                    difficulty: "Medium"
                });

            }

        });

    }


    return result;

}


/* =========================================================
   COMPLETION
========================================================= */

function getCompletedTopics() {

    const value =
        safeJSON(
            K.COMPLETED_TOPICS,
            []
        );

    return Array.isArray(value)
        ? value
        : [];

}


function topicKey(subject, topic) {

    return `${subject}::${topic}`.toLowerCase();

}


function isTopicCompleted(subject, topic) {

    const completed =
        getCompletedTopics();

    const key =
        topicKey(subject, topic);

    return completed.some(item => {

        if (typeof item === "string") {

            return (
                item.toLowerCase() === key ||
                item.toLowerCase() === topic.toLowerCase()
            );

        }

        if (item && typeof item === "object") {

            return (
                topicKey(
                    item.subject,
                    item.topic
                ) === key
            );

        }

        return false;

    });

}


/* =========================================================
   AI TIMETABLE EXTRACTION
========================================================= */

function findScheduleSource() {

    if (!plan) {
        return null;
    }

    const possibleKeys = [

        "timetableData",
        "timetable",
        "schedule",
        "studySchedule",
        "aiSchedule",
        "dailyPlan",
        "calendar"

    ];


    for (const key of possibleKeys) {

        if (plan[key]) {
            return plan[key];
        }

    }


    return null;

}


/* =========================================================
   SCHEDULE NORMALIZATION
========================================================= */

function normalizeSchedule() {

    const source =
        findScheduleSource();

    const sessions = [];

    if (!source) {
        return sessions;
    }


    /*
       Array schedule
    */

    if (Array.isArray(source)) {

        source.forEach(item => {

            const normalized =
                normalizeScheduleItem(item);

            if (normalized) {
                sessions.push(normalized);
            }

        });

        return sessions;

    }


    /*
       Object keyed by date
    */

    if (
        typeof source === "object"
    ) {

        Object.entries(source)
            .forEach(([dateKey, value]) => {

                if (Array.isArray(value)) {

                    value.forEach(item => {

                        const normalized =
                            normalizeScheduleItem(
                                item,
                                dateKey
                            );

                        if (normalized) {
                            sessions.push(normalized);
                        }

                    });

                } else {

                    const normalized =
                        normalizeScheduleItem(
                            value,
                            dateKey
                        );

                    if (normalized) {
                        sessions.push(normalized);
                    }

                }

            });

    }


    return sessions;

}


/* =========================================================
   SCHEDULE ITEM
========================================================= */

function normalizeScheduleItem(item, fallbackDate = null) {

    if (!item) {
        return null;
    }


    if (typeof item === "string") {

        return {

            date: fallbackDate || todayISO(),

            subject: "",
            topic: item,

            start:
                null,

            duration:
                Number(
                    plan?.hoursPerDay ||
                    plan?.studyHours ||
                    1
                ) * 60,

            type: "study",

            difficulty: "Medium"

        };

    }


    if (typeof item !== "object") {
        return null;
    }


    const date =
        item.date ||
        item.dayDate ||
        item.studyDate ||
        item.examDate ||
        fallbackDate;


    const subject =
        item.subject ||
        item.subjectName ||
        item.course ||
        "";


    const topic =
        item.topic ||
        item.topicName ||
        item.title ||
        item.name ||
        "";


    const type =
        normalizeDayType(
            item.dayType ||
            item.type ||
            item.kind ||
            "study"
        );


    return {

        date:
            date
                ? isoDate(new Date(date))
                : todayISO(),

        subject,

        topic,

        start:
            item.startTime ||
            item.start ||
            item.time ||
            null,

        end:
            item.endTime ||
            item.end ||
            null,

        duration:
            Number(
                item.duration ||
                item.minutes ||
                item.durationMinutes ||
                0
            ),

        type,

        difficulty:
            item.difficulty ||
            item.level ||
            "Medium",

        completed:
            Boolean(item.completed),

        exam:
            item.exam ||
            item.examName ||
            null

    };

}


/* =========================================================
   DAY TYPE
========================================================= */

function normalizeDayType(type) {

    const value =
        String(type || "")
            .toLowerCase()
            .trim();

    if (
        value.includes("rest") ||
        value.includes("break")
    ) {
        return "rest";
    }

    if (
        value.includes("exam")
    ) {
        return "exam";
    }

    if (
        value.includes("test") ||
        value.includes("quiz") ||
        value.includes("assessment")
    ) {
        return "test";
    }

    return "study";

}


/* =========================================================
   EXAM EXTRACTION
========================================================= */

function getExams() {

    if (!plan) {
        return [];
    }

    const exams = [];


    if (Array.isArray(plan.exams)) {

        plan.exams.forEach(exam => {

            if (!exam) return;

            const date =
                exam.date ||
                exam.examDate;

            if (!date) return;

            exams.push({

                name:
                    exam.name ||
                    exam.title ||
                    exam.subject ||
                    "Exam",

                date:
                    isoDate(new Date(date))

            });

        });

    }


    if (
        !exams.length &&
        Array.isArray(plan.examDates)
    ) {

        plan.examDates.forEach(exam => {

            if (
                typeof exam === "string"
            ) {

                exams.push({
                    name: "Exam",
                    date:
                        isoDate(
                            new Date(exam)
                        )
                });

            } else if (exam) {

                const date =
                    exam.date ||
                    exam.examDate;

                if (date) {

                    exams.push({

                        name:
                            exam.name ||
                            exam.subject ||
                            "Exam",

                        date:
                            isoDate(
                                new Date(date)
                            )

                    });

                }

            }

        });

    }


    if (
        !exams.length &&
        plan.examDate
    ) {

        exams.push({

            name:
                plan.examName ||
                plan.subject ||
                "Exam",

            date:
                isoDate(
                    new Date(plan.examDate)
                )

        });

    }


    return exams;

}


/* =========================================================
   AI DAY MAP
========================================================= */

function buildDayMap(sessions) {

    const map = {};


    /*
       AI-generated timetable takes priority.
       We do NOT assume Saturday is a rest day.
    */

    sessions.forEach(session => {

        if (!session.date) return;

        if (!map[session.date]) {

            map[session.date] = {
                type: session.type,
                sessions: []
            };

        }

        map[session.date]
            .sessions
            .push(session);

    });


    /*
       Exams override normal study sessions.
    */

    getExams().forEach(exam => {

        if (!map[exam.date]) {

            map[exam.date] = {
                type: "exam",
                sessions: []
            };

        } else {

            map[exam.date].type = "exam";

        }

    });


    return map;

}


/* =========================================================
   FALLBACK AI-STYLE SCHEDULE
========================================================= */

function generateFallbackSchedule() {

    /*
       This fallback is deliberately neutral.
       It does NOT hard-code Saturday as a rest day.

       If an AI timetable exists, that timetable always wins.
    */

    const topics =
        getAllTopics();

    if (!topics.length) {
        return [];
    }


    const result = [];

    const start =
        new Date();

    start.setHours(0, 0, 0, 0);


    let topicIndex = 0;


    const totalDays =
        Math.max(
            Number(plan?.daysLeft || 14),
            14
        );


    for (
        let day = 0;
        day < Math.min(totalDays, 30);
        day++
    ) {

        const date =
            new Date(start);

        date.setDate(
            start.getDate() + day
        );


        /*
           Let the schedule spread work intelligently.
           Every few days has lighter workload rather
           than a fixed weekday rest day.
        */

        const isRecoveryDay =
            day > 0 &&
            day % 6 === 5;


        if (isRecoveryDay) {

            result.push({

                date:
                    isoDate(date),

                subject: "",
                topic: "",

                type: "rest",

                duration: 0,

                difficulty: "Medium"

            });

            continue;

        }


        const sessionsToday =
            topics.length > 1
                ? Math.min(3, topics.length)
                : 1;


        for (
            let i = 0;
            i < sessionsToday;
            i++
        ) {

            const topic =
                topics[
                    topicIndex % topics.length
                ];

            topicIndex++;


            const hour =
                16 + (i * 2);


            result.push({

                date:
                    isoDate(date),

                subject:
                    topic.subject,

                topic:
                    topic.topic,

                start:
                    `${String(hour).padStart(2, "0")}:00`,

                duration:
                    45,

                type:
                    "study",

                difficulty:
                    topic.difficulty ||
                    "Medium"

            });

        }

    }


    return result;

}


/* =========================================================
   GET SCHEDULE
========================================================= */

let schedule =
    normalizeSchedule();


if (!schedule.length) {

    schedule =
        generateFallbackSchedule();

}


const dayMap =
    buildDayMap(schedule);


/* =========================================================
   GREETING
========================================================= */

function renderGreeting() {

    const username =
        localStorage.getItem(
            K.USERNAME
        ) ||
        plan?.username ||
        "Student";


    const hour =
        new Date().getHours();


    let greeting =
        "Good evening";


    if (hour < 12) {
        greeting = "Good morning";
    } else if (hour < 17) {
        greeting = "Good afternoon";
    }


    $("pageGreeting").textContent =
        `${greeting}, ${username} 👋`;

}


/* =========================================================
   TODAY DATA
========================================================= */

function getTodaySessions() {

    const today =
        todayISO();

    return schedule
        .filter(
            session =>
                session.date === today
        )
        .sort(
            (a, b) =>
                String(a.start || "")
                    .localeCompare(
                        String(b.start || "")
                    )
        );

}


/* =========================================================
   TODAY HEADER
========================================================= */

function renderTodayHeader() {

    const date =
        new Date();

    $("todayDate").textContent =
        formatDate(date);


    const today =
        dayMap[todayISO()];


    let type =
        today?.type ||
        "study";


    const labels = {

        study: "Study Day",
        rest: "Rest Day",
        test: "Test Day",
        exam: "Exam Day"

    };


    $("todayType").textContent =
        labels[type] ||
        "Study Day";


    $("todayType").className =
        `day-type ${type}`;

}


/* =========================================================
   SESSION HTML
========================================================= */

function sessionHTML(session, includeDate = false) {

    const completed =
        session.completed ||
        (
            session.subject &&
            session.topic &&
            isTopicCompleted(
                session.subject,
                session.topic
            )
        );


    const difficulty =
        String(
            session.difficulty ||
            "Medium"
        ).toLowerCase();


    const duration =
        Number(
            session.duration ||
            0
        );


    const action =
        completed
            ? `
                <button
                    disabled
                    class="completed-button"
                >
                    Completed
                </button>
              `
            : session.type === "study"
                ? `
                    <button
                        onclick="startSession(
                            '${encodeURIComponent(session.subject)}',
                            '${encodeURIComponent(session.topic)}'
                        )"
                    >
                        Start
                    </button>
                  `
                : "";


    return `

        <article
            class="session-card
                ${completed ? "completed" : ""}"
        >

            <div class="session-time">

                <strong>
                    ${
                        session.start
                            ? escapeHTML(
                                formatTime(
                                    session.start
                                )
                            )
                            : "Flexible"
                    }
                </strong>

                ${
                    duration
                        ? `<span>${duration} min</span>`
                        : ""
                }

            </div>


            <div class="session-main">

                ${
                    includeDate
                        ? `
                            <div class="session-date">
                                ${escapeHTML(
                                    formatDate(
                                        new Date(
                                            session.date
                                        )
                                    )
                                )}
                            </div>
                          `
                        : ""
                }

                <h3>
                    ${
                        escapeHTML(
                            session.subject ||
                            (
                                session.type === "test"
                                    ? "Knowledge Test"
                                    : "Study Session"
                            )
                        )
                    }
                </h3>

                ${
                    session.topic
                        ? `
                            <div class="session-topic">
                                ${escapeHTML(
                                    session.topic
                                )}
                            </div>
                          `
                        : ""
                }

                <div class="session-meta">

                    ${
                        session.difficulty
                            ? `
                                <span
                                    class="
                                        session-tag
                                        difficulty-${difficulty}
                                    "
                                >
                                    ${escapeHTML(
                                        session.difficulty
                                    )}
                                </span>
                              `
                            : ""
                    }

                    ${
                        session.type
                            ? `
                                <span class="session-tag">
                                    ${
                                        session.type === "study"
                                            ? "Study"
                                            : session.type === "test"
                                                ? "Test"
                                                : session.type === "exam"
                                                    ? "Exam"
                                                    : "Recovery"
                                    }
                                </span>
                              `
                            : ""
                    }

                </div>

            </div>


            <div class="session-action">
                ${action}
            </div>

        </article>

    `;

}


/* =========================================================
   SPECIAL DAY HTML
========================================================= */

function specialDayHTML(type) {

    const data = {

        rest: {
            icon: "moon",
            title: "AI Recovery Day",
            text:
                "The AI has scheduled a recovery day to help maintain sustainable progress."
        },

        test: {
            icon: "clipboard-check",
            title: "Test Day",
            text:
                "Use today to test your understanding and identify topics that need more attention."
        },

        exam: {
            icon: "graduation-cap",
            title: "Exam Day",
            text:
                "Your exam is scheduled for today. Focus on confidence, preparation and execution."
        }

    };


    const item =
        data[type];


    if (!item) {
        return "";
    }


    return `

        <div class="special-day ${type}">

            <div class="special-day-icon">
                <i data-lucide="${item.icon}"></i>
            </div>

            <div>

                <h3>
                    ${item.title}
                </h3>

                <p>
                    ${item.text}
                </p>

            </div>

        </div>

    `;

}


/* =========================================================
   RENDER TODAY
========================================================= */

function renderToday() {

    const container =
        $("todaySchedule");


    const sessions =
        getTodaySessions();


    if (!sessions.length) {

        const day =
            dayMap[todayISO()];


        if (
            day?.type &&
            day.type !== "study"
        ) {

            container.innerHTML =
                specialDayHTML(
                    day.type
                );

            if (window.lucide) {
                lucide.createIcons();
            }

            return;

        }


        container.innerHTML = `

            <div class="empty-state">

                <i data-lucide="calendar-off"></i>

                <h3>
                    No sessions scheduled
                </h3>

                <p>
                    Your AI planner has not assigned
                    a session for today yet.
                </p>

            </div>

        `;

        lucide.createIcons();

        return;

    }


    container.innerHTML =
        sessions
            .filter(
                session =>
                    session.type !== "rest"
            )
            .map(
                session =>
                    sessionHTML(
                        session,
                        false
                    )
            )
            .join("");


    const completed =
        sessions.filter(
            session =>
                session.completed ||
                (
                    session.subject &&
                    session.topic &&
                    isTopicCompleted(
                        session.subject,
                        session.topic
                    )
                )
        ).length;


    const studySessions =
        sessions.filter(
            session =>
                session.type === "study"
        );


    const minutes =
        studySessions.reduce(
            (sum, session) =>
                sum +
                Number(
                    session.duration || 0
                ),
            0
        );


    const percentage =
        studySessions.length
            ? Math.round(
                (
                    completed /
                    studySessions.length
                ) * 100
            )
            : 0;


    $("todaySessions").textContent =
        studySessions.length;


    $("todayHours").textContent =
        minutes >= 60
            ? `${(
                minutes / 60
            ).toFixed(1)}h`
            : `${minutes}m`;


    $("todayCompleted").textContent =
        `${percentage}%`;


    lucide.createIcons();

}


/* =========================================================
   UPCOMING
========================================================= */

let currentFilter =
    "all";


function renderUpcoming() {

    const container =
        $("upcomingSchedule");


    const today =
        todayISO();


    let sessions =
        schedule
            .filter(
                session =>
                    session.date >= today
            )
            .sort(
                (a, b) => {

                    const dateCompare =
                        a.date.localeCompare(
                            b.date
                        );

                    if (dateCompare !== 0) {
                        return dateCompare;
                    }

                    return String(
                        a.start || ""
                    ).localeCompare(
                        String(
                            b.start || ""
                        )
                    );

                }
            );


    if (currentFilter !== "all") {

        sessions =
            sessions.filter(
                session =>
                    session.type === currentFilter
            );

    }


    /*
       Do not display today's sessions twice.
    */

    sessions =
        sessions.filter(
            session =>
                session.date !== today
        );


    sessions =
        sessions.slice(0, 14);


    if (!sessions.length) {

        container.innerHTML = `

            <div class="empty-state">

                <i data-lucide="calendar-check"></i>

                <h3>
                    Nothing upcoming
                </h3>

                <p>
                    Your upcoming schedule will appear here.
                </p>

            </div>

        `;

        lucide.createIcons();

        return;

    }


    /*
       Group special days and study sessions.
    */

    container.innerHTML =
        sessions
            .map(session => {

                if (
                    session.type !== "study" &&
                    !session.topic
                ) {

                    return specialDayHTML(
                        session.type
                    );

                }

                return sessionHTML(
                    session,
                    true
                );

            })
            .join("");


    lucide.createIcons();

}


/* =========================================================
   REMAINING TOPICS
========================================================= */

function renderRemainingTopics() {

    const topics =
        getAllTopics();


    const remaining =
        topics.filter(
            item =>
                !isTopicCompleted(
                    item.subject,
                    item.topic
                )
        );


    $("remainingTopics").textContent =
        remaining.length;

}


/* =========================================================
   AI MESSAGE
========================================================= */

function renderAIInsight() {

    const topics =
        getAllTopics();


    const weakTopics =
        topics.filter(
            item =>
                String(
                    item.difficulty
                ).toLowerCase() === "weak"
        );


    const exams =
        getExams();


    if (weakTopics.length) {

        $("aiScheduleTitle").textContent =
            "Your weaker topics receive priority";


        $("aiScheduleMessage").textContent =
            `The planner is prioritizing ${weakTopics.length} weaker topic${
                weakTopics.length === 1 ? "" : "s"
            } so you have more time to improve before your assessments.`;


        $("aiInsightTitle").textContent =
            "Focus on your weakest areas";


        $("aiInsight").textContent =
            "When a topic is marked as weak, StudyMind can give it more frequent sessions and place revision closer to your assessment.";

        return;

    }


    if (exams.length) {

        $("aiScheduleTitle").textContent =
            "Your exam dates guide the schedule";


        $("aiScheduleMessage").textContent =
            `The planner is organizing your preparation around ${
                exams.length
            } upcoming assessment${
                exams.length === 1 ? "" : "s"
            }.`;

        $("aiInsightTitle").textContent =
            "Preparation is exam-aware";


        $("aiInsight").textContent =
            "Your schedule can increase revision and testing as an assessment approaches.";

        return;

    }


    $("aiScheduleTitle").textContent =
        "Your schedule adapts to your progress";


    $("aiScheduleMessage").textContent =
        "StudyMind uses your available study time, topics, difficulty and progress to organize your sessions.";


    $("aiInsightTitle").textContent =
        "Keep completing your sessions";


    $("aiInsight").textContent =
        "As you complete topics and knowledge checks, your study plan can adapt to where you need the most attention.";

}


/* =========================================================
   FILTER EVENTS
========================================================= */

function setupFilters() {

    document
        .querySelectorAll(".filter-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".filter-button"
                        )
                        .forEach(btn =>
                            btn.classList.remove(
                                "active"
                            )
                        );


                    button.classList.add(
                        "active"
                    );


                    currentFilter =
                        button.dataset.filter;


                    renderUpcoming();

                }
            );

        });

}


/* =========================================================
   START STUDY SESSION
========================================================= */

function startSession(
    encodedSubject,
    encodedTopic
) {

    const subject =
        decodeURIComponent(
            encodedSubject
        );

    const topic =
        decodeURIComponent(
            encodedTopic
        );


    const session = {

        subject,

        topic,

        startedAt:
            Date.now(),

        date:
            todayISO()

    };


    localStorage.setItem(
        K.CURRENT_SESSION,
        JSON.stringify(session)
    );


    /*
       Dashboard can pick this up and open
       the appropriate study/timer flow.
    */

    localStorage.setItem(
        "studyMindCurrentTopic",
        topic
    );

    localStorage.setItem(
        "studyMindCurrentSubject",
        subject
    );


    window.location.href =
        "dashboard.html";

}


/* =========================================================
   PLAN ABSENCE
========================================================= */

function handleNoPlan() {

    if (plan) {
        return false;
    }


    $("todaySchedule").innerHTML = `

        <div class="empty-state">

            <i data-lucide="brain"></i>

            <h3>
                Create your AI study plan
            </h3>

            <p>
                Your schedule will appear here
                after you create a StudyMind plan.
            </p>

            <br>

            <a
                href="home.html"
                style="
                    display:inline-flex;
                    align-items:center;
                    gap:7px;
                    padding:10px 14px;
                    border-radius:10px;
                    background:#3b82f6;
                    color:white;
                    text-decoration:none;
                    font-size:12px;
                    font-weight:700;
                "
            >
                Create Study Plan
                <i data-lucide="arrow-right"></i>
            </a>

        </div>

    `;


    $("upcomingSchedule").innerHTML = "";

    $("todaySessions").textContent = "0";
    $("todayHours").textContent = "0h";
    $("todayCompleted").textContent = "0%";
    $("remainingTopics").textContent = "0";


    lucide.createIcons();

    return true;

}


/* =========================================================
   INITIALIZE
========================================================= */

function initializeSchedule() {

    renderGreeting();


    if (
        handleNoPlan()
    ) {
        return;
    }


    renderTodayHeader();

    renderToday();

    renderUpcoming();

    renderRemainingTopics();

    renderAIInsight();

    setupFilters();


    if (window.lucide) {
        lucide.createIcons();
    }

}


document.addEventListener(
    "DOMContentLoaded",
    initializeSchedule
);


/* =========================================================
   LIVE PLAN UPDATE
========================================================= */

window.addEventListener(
    "storage",
    event => {

        if (
            [
                K.PLAN,
                K.DATA,
                K.PLANS,
                K.ACTIVE_PLAN,
                K.COMPLETED_TOPICS,
                K.COMPLETED_DAYS
            ].includes(event.key)
        ) {

            location.reload();

        }

    }
);
