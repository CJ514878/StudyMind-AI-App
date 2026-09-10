"use strict";

/* =========================================================
   STUDYMIND AI — CALENDAR
   AI-DRIVEN STUDY CALENDAR

   - Reads the student's actual StudyMind plan
   - Supports multiple subjects
   - Supports multiple exams
   - Uses AI timetable data when available
   - Does NOT hard-code Saturday as a rest day
   - Supports Study / Rest / Test / Exam days
   - Detects completed study days
   - Works with old and new StudyMind plan formats
========================================================= */


/* =========================================================
   STORAGE
========================================================= */

const STORAGE = {
    PLAN: "studyMindPlan",
    DATA: "studyData",
    PLANS: "studyMindPlans",
    ACTIVE_PLAN: "studyMindActivePlanId",

    COMPLETED_TOPICS: "studyMindCompletedTopics",
    COMPLETED_DAYS: "studyMindCompletedDays",

    USERNAME: "studyMindUsername",

    PREMIUM: "studyMindPremium"
};


/* =========================================================
   STATE
========================================================= */

let studyPlan = null;

let calendarDate = new Date();

let selectedDateKey = null;

let calendarDays = [];

let allTopics = [];

let allSubjects = [];


/* =========================================================
   DOM
========================================================= */

const $ = id => document.getElementById(id);


/* =========================================================
   STORAGE HELPERS
========================================================= */

function readJSON(key, fallback = null) {

    try {

        const value = localStorage.getItem(key);

        if (!value) {
            return fallback;
        }

        return JSON.parse(value);

    } catch (error) {

        console.warn(
            "StudyMind storage error:",
            key,
            error
        );

        return fallback;
    }
}


/* =========================================================
   LOAD PLAN
========================================================= */

function loadStudyPlan() {

    /*
       New multi-plan system
    */

    const plans =
        readJSON(STORAGE.PLANS, null);

    const activeId =
        localStorage.getItem(
            STORAGE.ACTIVE_PLAN
        );

    if (
        Array.isArray(plans) &&
        plans.length
    ) {

        let active =
            plans.find(
                plan =>
                    String(plan.id) ===
                    String(activeId)
            );

        if (!active) {
            active = plans[0];
        }

        if (active) {
            studyPlan = active;
            return studyPlan;
        }
    }


    /*
       Current plan
    */

    const current =
        readJSON(
            STORAGE.PLAN,
            null
        );

    if (current) {

        studyPlan = current;

        return studyPlan;
    }


    /*
       Compatibility format
    */

    const old =
        readJSON(
            STORAGE.DATA,
            null
        );

    if (old) {

        studyPlan = old;

        return studyPlan;
    }


    studyPlan = null;

    return null;
}


/* =========================================================
   NORMALIZE SUBJECTS
========================================================= */

function normalizeSubjects(plan) {

    const subjects = [];

    if (!plan) {
        return subjects;
    }


    /*
       Modern format:
       subjects: [
          {
             name: "...",
             topics: [...]
          }
       ]
    */

    if (
        Array.isArray(plan.subjects)
    ) {

        plan.subjects.forEach(
            subject => {

                if (!subject) {
                    return;
                }

                let name =
                    subject.name ||
                    subject.subject ||
                    subject.title ||
                    "Subject";

                let topics =
                    Array.isArray(subject.topics)
                        ? subject.topics
                        : [];

                topics =
                    topics
                        .map(
                            topic =>
                                typeof topic === "string"
                                    ? topic
                                    : (
                                        topic?.name ||
                                        topic?.title ||
                                        ""
                                    )
                        )
                        .filter(Boolean);

                subjects.push({
                    name,
                    topics
                });

            }
        );
    }


    /*
       subjectNames compatibility
    */

    if (
        !subjects.length &&
        Array.isArray(plan.subjectNames)
    ) {

        plan.subjectNames.forEach(
            name => {

                if (!name) {
                    return;
                }

                subjects.push({
                    name,
                    topics: []
                });

            }
        );
    }


    /*
       Old format:
       subject: "Math: Algebra, Geometry"
    */

    if (
        !subjects.length &&
        typeof plan.subject === "string"
    ) {

        plan.subject
            .split("\n")
            .forEach(line => {

                const parts =
                    line.split(":");

                const name =
                    parts.shift()?.trim();

                const topics =
                    parts
                        .join(":")
                        .split(",")
                        .map(x => x.trim())
                        .filter(Boolean);

                if (name) {

                    subjects.push({
                        name,
                        topics
                    });

                }

            });
    }


    /*
       Older subject arrays
    */

    if (
        !subjects.length &&
        Array.isArray(plan.subjectNames)
    ) {

        plan.subjectNames.forEach(name => {

            subjects.push({
                name,
                topics: []
            });

        });
    }


    return subjects;
}


/* =========================================================
   NORMALIZE TOPICS
========================================================= */

function buildTopicList() {

    allTopics = [];
    allSubjects = [];

    if (!studyPlan) {
        return;
    }

    allSubjects =
        normalizeSubjects(studyPlan);


    allSubjects.forEach(
        subject => {

            subject.topics.forEach(
                topic => {

                    allTopics.push({
                        subject: subject.name,
                        topic
                    });

                }
            );

        }
    );


    /*
       Compatibility flat topics
    */

    if (
        !allTopics.length &&
        Array.isArray(studyPlan.topics)
    ) {

        studyPlan.topics.forEach(topic => {

            const name =
                typeof topic === "string"
                    ? topic
                    : (
                        topic?.name ||
                        topic?.title ||
                        "Study Topic"
                    );

            if (name) {

                allTopics.push({
                    subject:
                        studyPlan.subject ||
                        "General",
                    topic: name
                });

            }

        });

    }

}


/* =========================================================
   DATE HELPERS
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


function parseDate(value) {

    if (!value) {
        return null;
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;
    }

    return date;
}


function startOfDay(date) {

    const result =
        new Date(date);

    result.setHours(
        0,
        0,
        0,
        0
    );

    return result;
}


function daysBetween(a, b) {

    const one =
        startOfDay(a);

    const two =
        startOfDay(b);

    return Math.round(
        (
            two - one
        ) /
        86400000
    );
}


/* =========================================================
   EXAM EXTRACTION
========================================================= */

function getExams() {

    if (!studyPlan) {
        return [];
    }

    const exams = [];


    /*
       Multiple exams
    */

    const possibleArrays = [
        studyPlan.exams,
        studyPlan.examDates,
        studyPlan.assessments
    ];

    for (
        const collection
        of possibleArrays
    ) {

        if (!Array.isArray(collection)) {
            continue;
        }

        collection.forEach(
            exam => {

                if (!exam) {
                    return;
                }

                const date =
                    parseDate(
                        exam.date ||
                        exam.examDate
                    );

                if (!date) {
                    return;
                }

                exams.push({
                    date,
                    name:
                        exam.name ||
                        exam.title ||
                        exam.examType ||
                        "Exam",
                    subject:
                        exam.subject ||
                        ""
                });

            }
        );

    }


    /*
       Single exam compatibility
    */

    if (
        !exams.length &&
        studyPlan.examDate
    ) {

        const date =
            parseDate(
                studyPlan.examDate
            );

        if (date) {

            exams.push({
                date,
                name:
                    studyPlan.examType ||
                    "Exam",
                subject:
                    studyPlan.subject ||
                    ""
            });

        }

    }


    return exams;
}


/* =========================================================
   AI TIMETABLE EXTRACTION
========================================================= */

function getAIPlanDays() {

    if (!studyPlan) {
        return [];
    }

    const candidates = [

        studyPlan.timetableData,

        studyPlan.timetable,

        studyPlan.schedule,

        studyPlan.studySchedule,

        studyPlan.aiSchedule,

        studyPlan.calendar,

        studyPlan.dailyPlan,

        studyPlan.plan

    ];


    for (
        const candidate
        of candidates
    ) {

        if (
            Array.isArray(candidate) &&
            candidate.length
        ) {

            return candidate;
        }

        if (
            candidate &&
            typeof candidate === "object"
        ) {

            const values =
                Object.values(candidate);

            if (values.length) {
                return values;
            }

        }

    }

    return [];
}


/* =========================================================
   AI DAY NORMALIZATION
========================================================= */

function normalizeAIDay(item) {

    if (!item) {
        return null;
    }


    if (typeof item === "string") {

        return {
            date: null,
            type: null,
            subjects: [],
            topics: [],
            text: item
        };

    }


    const rawDate =
        item.date ||
        item.dayDate ||
        item.studyDate ||
        item.calendarDate;


    let date =
        parseDate(rawDate);


    /*
       If day is represented as an ISO key
    */

    if (
        !date &&
        typeof rawDate === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
    ) {

        date =
            parseDate(
                `${rawDate}T00:00:00`
            );

    }


    const type =
        String(
            item.type ||
            item.dayType ||
            item.status ||
            item.category ||
            ""
        ).toLowerCase();


    let subjects = [];

    if (
        Array.isArray(item.subjects)
    ) {

        subjects =
            item.subjects
                .map(
                    x =>
                        typeof x === "string"
                            ? x
                            : (
                                x?.name ||
                                x?.subject ||
                                ""
                            )
                )
                .filter(Boolean);

    }


    if (
        item.subject &&
        !subjects.includes(item.subject)
    ) {

        subjects.push(
            item.subject
        );

    }


    let topics = [];

    if (
        Array.isArray(item.topics)
    ) {

        topics =
            item.topics
                .map(
                    x =>
                        typeof x === "string"
                            ? x
                            : (
                                x?.name ||
                                x?.title ||
                                ""
                            )
                )
                .filter(Boolean);

    }


    return {
        date,
        type,
        subjects,
        topics,
        text:
            item.text ||
            item.description ||
            item.advice ||
            "",
        completed:
            Boolean(
                item.completed ||
                item.isCompleted
            )
    };

}


/* =========================================================
   FIND AI DAY
========================================================= */

function getAIDayForDate(date) {

    const key =
        dateKey(date);

    const days =
        getAIPlanDays();

    for (
        const item
        of days
    ) {

        const normalized =
            normalizeAIDay(item);

        if (
            normalized?.date &&
            dateKey(normalized.date) === key
        ) {

            return normalized;
        }

    }

    return null;
}


/* =========================================================
   DETERMINE DAY TYPE
========================================================= */

function determineDayType(date) {

    const key =
        dateKey(date);


    /*
       EXAM ALWAYS WINS
    */

    const exams =
        getExams();

    const exam =
        exams.find(
            e =>
                dateKey(e.date) === key
        );

    if (exam) {

        return {
            type: "exam",
            exam
        };

    }


    /*
       AI timetable gets priority
    */

    const aiDay =
        getAIDayForDate(date);

    if (aiDay) {

        const t =
            aiDay.type;


        if (
            t.includes("exam")
        ) {

            return {
                type: "exam",
                aiDay
            };

        }


        if (
            t.includes("test")
        ) {

            return {
                type: "test",
                aiDay
            };

        }


        if (
            t.includes("rest") ||
            t.includes("break")
        ) {

            return {
                type: "rest",
                aiDay
            };

        }


        if (
            t.includes("study") ||
            t.includes("revision") ||
            t.includes("review")
        ) {

            return {
                type: "study",
                aiDay
            };

        }

    }


    /*
       AI-generated plan may not explicitly
       label a day. Use available schedule.
    */

    if (aiDay) {

        if (
            aiDay.subjects.length ||
            aiDay.topics.length ||
            aiDay.text
        ) {

            return {
                type: "study",
                aiDay
            };

        }

    }


    /*
       Fallback: exam proximity
    */

    const nearestExam =
        exams
            .filter(
                exam =>
                    exam.date >=
                    startOfDay(date)
            )
            .sort(
                (a, b) =>
                    a.date - b.date
            )[0];


    if (nearestExam) {

        const daysAway =
            daysBetween(
                date,
                nearestExam.date
            );

        /*
           Day immediately before an exam
           is revision/test unless AI says otherwise.
        */

        if (daysAway === 1) {

            return {
                type: "test",
                generated: true
            };

        }

    }


    /*
       If plan has no schedule, don't force
       Saturday rest. Generate a sensible
       adaptive fallback.
    */

    if (allTopics.length) {

        /*
           Use rest roughly every 6 study
           opportunities, but distribute it
           around exams.
        */

        const dayIndex =
            Math.max(
                0,
                daysBetween(
                    new Date(
                        studyPlan.startDate ||
                        new Date()
                    ),
                    date
                )
            );

        if (
            dayIndex > 0 &&
            dayIndex % 7 === 6
        ) {

            return {
                type: "rest",
                generated: true
            };

        }

        return {
            type: "study",
            generated: true
        };

    }


    return {
        type: "empty"
    };

}


/* =========================================================
   COMPLETION
========================================================= */

function getCompletedTopics() {

    const data =
        readJSON(
            STORAGE.COMPLETED_TOPICS,
            []
        );

    if (Array.isArray(data)) {
        return data;
    }

    if (
        data &&
        typeof data === "object"
    ) {

        return Object.keys(data)
            .filter(
                key => data[key]
            );

    }

    return [];
}


function isDayCompleted(date, dayData) {

    const key =
        dateKey(date);


    const completedDays =
        readJSON(
            STORAGE.COMPLETED_DAYS,
            []
        );


    if (
        Array.isArray(completedDays) &&
        completedDays.includes(key)
    ) {

        return true;
    }


    /*
       If AI marks it completed
    */

    if (dayData?.completed) {
        return true;
    }


    /*
       Determine completion from topics.
    */

    if (
        !dayData ||
        !dayData.topics?.length
    ) {

        return false;
    }


    const completed =
        getCompletedTopics()
            .map(
                x => String(x).toLowerCase()
            );


    return dayData.topics.every(
        topic =>
            completed.includes(
                String(topic).toLowerCase()
            )
    );

}


/* =========================================================
   GENERATE CALENDAR DAY
========================================================= */

function createDayData(date) {

    const result =
        determineDayType(date);

    const aiDay =
        result.aiDay || null;


    let subjects =
        aiDay?.subjects || [];

    let topics =
        aiDay?.topics || [];


    /*
       If AI didn't provide topics,
       use subjects where possible.
    */

    if (
        !subjects.length &&
        result.type === "study"
    ) {

        subjects =
            allSubjects
                .slice(
                    0,
                    Math.min(
                        3,
                        allSubjects.length
                    )
                )
                .map(
                    s => s.name
                );

    }


    /*
       Exam data
    */

    const exam =
        result.exam ||
        getExams().find(
            e =>
                dateKey(e.date) ===
                dateKey(date)
        ) ||
        null;


    return {

        date,

        key:
            dateKey(date),

        type:
            result.type,

        subjects,

        topics,

        text:
            aiDay?.text || "",

        exam,

        completed:
            isDayCompleted(
                date,
                aiDay
            ),

        generated:
            Boolean(
                result.generated
            )

    };

}


/* =========================================================
   RENDER CALENDAR
========================================================= */

function renderCalendar() {

    const grid =
        $("calendarGrid");

    if (!grid) {
        return;
    }

    grid.innerHTML = "";

    calendarDays = [];


    const year =
        calendarDate.getFullYear();

    const month =
        calendarDate.getMonth();


    $("monthTitle").textContent =
        new Intl.DateTimeFormat(
            "en-US",
            {
                month: "long",
                year: "numeric"
            }
        ).format(calendarDate);


    /*
       Monday-based calendar
    */

    const firstDay =
        new Date(
            year,
            month,
            1
        );

    let weekday =
        firstDay.getDay();

    weekday =
        weekday === 0
            ? 6
            : weekday - 1;


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    /*
       Previous month filler
    */

    for (
        let i = 0;
        i < weekday;
        i++
    ) {

        const previousDate =
            new Date(
                year,
                month,
                -weekday + i + 1
            );

        const cell =
            createCalendarCell(
                previousDate,
                true
            );

        grid.appendChild(cell);

    }


    /*
       Current month
    */

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

        const data =
            createDayData(date);

        calendarDays.push(data);

        const cell =
            createCalendarCell(
                date,
                false,
                data
            );

        grid.appendChild(cell);

    }


    /*
       Fill final row
    */

    const total =
        weekday +
        daysInMonth;

    const remaining =
        (7 - (total % 7)) % 7;


    for (
        let i = 1;
        i <= remaining;
        i++
    ) {

        const nextDate =
            new Date(
                year,
                month + 1,
                i
            );

        const cell =
            createCalendarCell(
                nextDate,
                true
            );

        grid.appendChild(cell);

    }


    updateStats();

    lucide.createIcons();

}


/* =========================================================
   CREATE CELL
========================================================= */

function createCalendarCell(
    date,
    outsideMonth = false,
    data = null
) {

    const cell =
        document.createElement("button");

    cell.type = "button";

    cell.className =
        "calendar-day";


    if (outsideMonth) {

        cell.classList.add(
            "outside-month"
        );

        cell.innerHTML = `
            <span class="day-number">
                ${date.getDate()}
            </span>
        `;

        return cell;
    }


    if (!data) {
        data = createDayData(date);
    }


    cell.dataset.date =
        data.key;


    cell.classList.add(
        `day-${data.type}`
    );


    /*
       Today
    */

    if (
        dateKey(date) ===
        dateKey(new Date())
    ) {

        cell.classList.add(
            "today"
        );

    }


    /*
       Completed
    */

    if (data.completed) {

        cell.classList.add(
            "completed"
        );

    }


    /*
       Selected
    */

    if (
        selectedDateKey ===
        data.key
    ) {

        cell.classList.add(
            "selected"
        );

    }


    let marker = "";

    if (data.type === "study") {
        marker =
            `<span class="day-marker study-marker"></span>`;
    }

    if (data.type === "rest") {
        marker =
            `<span class="day-marker rest-marker"></span>`;
    }

    if (data.type === "test") {
        marker =
            `<span class="day-marker test-marker"></span>`;
    }

    if (data.type === "exam") {
        marker =
            `<span class="day-marker exam-marker"></span>`;
    }


    cell.innerHTML = `

        <div class="calendar-day-top">

            <span class="day-number">
                ${date.getDate()}
            </span>

            ${marker}

        </div>

        <div class="day-content">

            ${
                data.subjects
                    .slice(0, 2)
                    .map(
                        subject =>
                            `<span>${escapeHTML(subject)}</span>`
                    )
                    .join("")
            }

            ${
                data.type === "rest"
                    ? `<span class="day-label">REST</span>`
                    : ""
            }

            ${
                data.type === "test"
                    ? `<span class="day-label">TEST</span>`
                    : ""
            }

            ${
                data.type === "exam"
                    ? `<span class="day-label">EXAM</span>`
                    : ""
            }

        </div>

    `;


    cell.addEventListener(
        "click",
        () => {

            selectedDateKey =
                data.key;

            renderCalendar();

            showDayDetails(data);

        }
    );


    return cell;
}


/* =========================================================
   DAY DETAILS
========================================================= */

function showDayDetails(data) {

    const container =
        $("dayDetails");

    if (!container) {
        return;
    }


    const formattedDate =
        new Intl.DateTimeFormat(
            "en-US",
            {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
            }
        ).format(data.date);


    let title =
        "Study Day";

    let icon =
        "book-open";


    if (data.type === "rest") {

        title =
            "Rest & Recovery";

        icon =
            "coffee";

    }


    if (data.type === "test") {

        title =
            "Test & Revision Day";

        icon =
            "clipboard-check";

    }


    if (data.type === "exam") {

        title =
            "Exam Day";

        icon =
            "graduation-cap";

    }


    if (data.completed) {

        title =
            "Completed Study Day";

        icon =
            "badge-check";

    }


    let body = "";


    if (data.type === "rest") {

        body = `
            <div class="detail-message rest-message">

                <i data-lucide="battery-charging"></i>

                <div>
                    <strong>Recovery is part of the plan.</strong>

                    <p>
                        Your AI study planner has placed this
                        recovery day here to help maintain
                        performance and prevent burnout.
                    </p>
                </div>

            </div>
        `;

    }


    else if (data.type === "exam") {

        body = `
            <div class="exam-detail">

                <div class="exam-detail-icon">
                    <i data-lucide="graduation-cap"></i>
                </div>

                <div>

                    <strong>
                        ${escapeHTML(
                            data.exam?.name ||
                            "Exam"
                        )}
                    </strong>

                    ${
                        data.exam?.subject
                            ? `<span>${escapeHTML(
                                data.exam.subject
                              )}</span>`
                            : ""
                    }

                </div>

            </div>
        `;

    }


    else {

        const subjects =
            data.subjects.length
                ? data.subjects
                : ["AI Study Session"];


        body = `

            <div class="session-list">

                ${subjects.map(
                    (subject, index) => `

                    <div class="session-item">

                        <div class="session-number">
                            ${index + 1}
                        </div>

                        <div class="session-info">

                            <strong>
                                ${escapeHTML(subject)}
                            </strong>

                            <span>
                                ${
                                    data.topics[index]
                                        ? escapeHTML(
                                            data.topics[index]
                                          )
                                        : "AI-planned study session"
                                }
                            </span>

                        </div>

                        <i data-lucide="chevron-right"></i>

                    </div>

                `
                ).join("")}

            </div>

        `;

    }


    container.innerHTML = `

        <div class="day-detail-header">

            <div class="detail-title">

                <div class="detail-icon ${data.type}">
                    <i data-lucide="${icon}"></i>
                </div>

                <div>

                    <span>
                        ${escapeHTML(formattedDate)}
                    </span>

                    <h3>
                        ${escapeHTML(title)}
                    </h3>

                </div>

            </div>

            ${
                data.completed
                    ? `
                        <div class="completed-badge">
                            <i data-lucide="check"></i>
                            Completed
                        </div>
                      `
                    : ""
            }

        </div>

        ${body}

        ${
            data.text
                ? `
                    <div class="day-ai-note">

                        <i data-lucide="sparkles"></i>

                        <div>

                            <strong>
                                AI Recommendation
                            </strong>

                            <p>
                                ${escapeHTML(data.text)}
                            </p>

                        </div>

                    </div>
                  `
                : ""
        }

    `;


    lucide.createIcons();

}


/* =========================================================
   STATISTICS
========================================================= */

function updateStats() {

    const currentDays =
        calendarDays;


    const study =
        currentDays.filter(
            d => d.type === "study"
        ).length;


    const rest =
        currentDays.filter(
            d => d.type === "rest"
        ).length;


    const test =
        currentDays.filter(
            d => d.type === "test"
        ).length;


    const exam =
        currentDays.filter(
            d => d.type === "exam"
        ).length;


    $("studyDaysCount").textContent =
        study;

    $("restDaysCount").textContent =
        rest;

    $("testDaysCount").textContent =
        test;

    $("examDaysCount").textContent =
        exam;


    /*
       Dynamic AI message
    */

    if (studyPlan) {

        $("calendarSubtitle").textContent =
            "Your AI-optimized study timeline";

        $("aiStatusText").textContent =
            "Study, revision, testing and recovery are organized around your plan and exams.";

    }

}


/* =========================================================
   AI INSIGHT
========================================================= */

function updateAIInsight() {

    const insight =
        $("aiInsight");

    if (!insight) {
        return;
    }


    const exams =
        getExams();


    if (!studyPlan) {

        insight.textContent =
            "Create a study plan from the Home page and StudyMind AI will build your calendar automatically.";

        return;

    }


    if (!exams.length) {

        insight.textContent =
            "Your calendar is being organized around your subjects, available study time and progress. Add exam dates for more precise prioritization.";

        return;

    }


    const today =
        startOfDay(
            new Date()
        );


    const upcoming =
        exams
            .filter(
                e =>
                    e.date >= today
            )
            .sort(
                (a, b) =>
                    a.date - b.date
            )[0];


    if (!upcoming) {

        insight.textContent =
            "Your scheduled exams have passed. Use the calendar to maintain revision and continue building your study streak.";

        return;

    }


    const days =
        daysBetween(
            today,
            upcoming.date
        );


    if (days <= 3) {

        insight.textContent =
            `Your next exam is only ${days} day${days === 1 ? "" : "s"} away. StudyMind is prioritizing focused revision, testing and recovery around it.`;

    }

    else if (days <= 7) {

        insight.textContent =
            `Your next exam is in ${days} days. The AI planner should increasingly prioritize revision and knowledge checks for the relevant subjects.`;

    }

    else {

        insight.textContent =
            `Your next exam is in ${days} days. StudyMind is balancing new learning, revision, testing and recovery so you can prepare without unnecessary overload.`;

    }

}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    $("previousMonth")
        ?.addEventListener(
            "click",
            () => {

                calendarDate.setMonth(
                    calendarDate.getMonth() - 1
                );

                selectedDateKey = null;

                renderCalendar();

                showEmptyDetails();

            }
        );


    $("nextMonth")
        ?.addEventListener(
            "click",
            () => {

                calendarDate.setMonth(
                    calendarDate.getMonth() + 1
                );

                selectedDateKey = null;

                renderCalendar();

                showEmptyDetails();

            }
        );


    $("todayButton")
        ?.addEventListener(
            "click",
            () => {

                calendarDate =
                    new Date();

                selectedDateKey =
                    dateKey(
                        new Date()
                    );

                renderCalendar();

                const data =
                    createDayData(
                        new Date()
                    );

                showDayDetails(data);

            }
        );


    $("refreshCalendar")
        ?.addEventListener(
            "click",
            () => {

                loadStudyPlan();

                buildTopicList();

                renderCalendar();

                updateAIInsight();

                const button =
                    $("refreshCalendar");

                button.classList.add(
                    "rotating"
                );

                setTimeout(
                    () =>
                        button.classList.remove(
                            "rotating"
                        ),
                    600
                );

            }
        );


    $("mobileMenu")
        ?.addEventListener(
            "click",
            () => {

                document.body.classList.toggle(
                    "sidebar-open"
                );

            }
        );

}


/* =========================================================
   EMPTY DETAILS
========================================================= */

function showEmptyDetails() {

    const container =
        $("dayDetails");

    if (!container) {
        return;
    }

    container.innerHTML = `

        <div class="empty-day">

            <div class="empty-day-icon">
                <i data-lucide="calendar-search"></i>
            </div>

            <h3>Select a day</h3>

            <p>
                Select a date to see your AI-generated study plan.
            </p>

        </div>

    `;

    lucide.createIcons();

}


/* =========================================================
   USERNAME
========================================================= */

function loadUsername() {

    let username =
        localStorage.getItem(
            STORAGE.USERNAME
        );


    /*
       Try common user objects
    */

    if (!username) {

        const user =
            readJSON(
                "studyMindUser",
                null
            );

        if (user) {

            username =
                user.username ||
                user.name ||
                user.email?.split("@")[0];

        }

    }


    if (!username) {
        username = "Student";
    }


    const avatar =
        $("userAvatar");

    if (avatar) {

        avatar.textContent =
            username
                .charAt(0)
                .toUpperCase();

        avatar.title =
            username;

    }

}


/* =========================================================
   ESCAPE HTML
========================================================= */

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
   INITIALIZE
========================================================= */

function initializeCalendar() {

    loadStudyPlan();

    buildTopicList();

    loadUsername();

    setupNavigation();

    renderCalendar();

    updateAIInsight();

    /*
       If today is visible, select it automatically.
    */

    const now =
        new Date();


    if (
        now.getMonth() ===
        calendarDate.getMonth() &&
        now.getFullYear() ===
        calendarDate.getFullYear()
    ) {

        selectedDateKey =
            dateKey(now);

        const todayData =
            createDayData(now);

        showDayDetails(todayData);

        renderCalendar();

    }

}


document.addEventListener(
    "DOMContentLoaded",
    initializeCalendar
);
