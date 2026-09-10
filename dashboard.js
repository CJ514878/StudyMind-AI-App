"use strict";

/* =========================================================
   STUDYMIND AI — PROFESSIONAL DASHBOARD
   COMPLETE REPLACEMENT

   FIXES:
   ✓ Full-day completion detection
   ✓ Calendar day turns GREEN after all topics are completed
   ✓ Streak starts at 0
   ✓ Streak increases once per fully completed day
   ✓ Congratulations popup
   ✓ Real study-time tracking
   ✓ Weekly hours
   ✓ Daily goal
   ✓ Attractive timetable
   ✓ AI navigation
   ✓ Persistent light/dark mode
   ✓ Username greeting
   ✓ 25 / 45 / 60 minute timer
   ✓ Existing Knowledge Check compatibility
========================================================= */


/* =========================================================
   STORAGE KEYS
========================================================= */

const K = {

    PLAN: "studyMindPlan",
    COMP: "studyData",

    DONE: "studyMindCompletedTopics",
    QDONE: "studyMindCompletedQuestionTopics",

    INDEX: "studyMindCurrentTopicIndex",

    TIMER: "studyMindTimerSeconds",
    DURATION: "studyMindSelectedTimerSeconds",
    RUNNING: "studyMindTimerRunning",
    END: "studyMindTimerEndTime",

    STREAK: "studyMindStreak",
    LAST: "lastStudyDate",

    THEME: "studyMindTheme",

    KCUSAGE: "studyMindKnowledgeCheckUsageCount",
    KCTOPIC: "studyMindKnowledgeCheckTopic",

    /* NEW TRACKING */
    STUDY_SECONDS: "studyMindTotalStudySeconds",
    TODAY_SECONDS: "studyMindTodayStudySeconds",
    TODAY_DATE: "studyMindTodayStudyDate",

    /* COMPLETED DAY RECORD */
    COMPLETED_DAYS: "studyMindCompletedDays",

    /* CELEBRATION */
    LAST_CONGRATULATED_DAY:
        "studyMindLastCongratulatedDay"

};


const KC_LIMIT = 5;


/* =========================================================
   STATE
========================================================= */

let plan = null;

let topics = [];
let subjects = [];

let done = [];
let qdone = [];

let index = 0;

let currentKC = null;

let calDate = new Date();


/* =========================================================
   TIMER STATE
========================================================= */

let timerSeconds = 1500;

let selectedTimerSeconds = 1500;

let timerInterval = null;

let timerRunning = false;


/* =========================================================
   HELPERS
========================================================= */

const $ = id => document.getElementById(id);


function read(key, fallback) {

    try {

        const value =
            localStorage.getItem(key);

        if (value === null) {
            return fallback;
        }

        return JSON.parse(value);

    } catch {

        return fallback;

    }

}


function write(key, value) {

    localStorage.setItem(
        key,
        JSON.stringify(value)
    );

}


function clean(value) {

    return String(value ?? "").trim();

}


function escapeHtml(value) {

    return String(value ?? "")
        .replace(
            /[&<>'"]/g,
            character => ({

                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "'": "&#39;",
                '"': "&quot;"

            }[character])
        );

}


function topicName(topic) {

    if (typeof topic === "string") {

        return clean(topic);

    }


    return clean(
        topic?.name ||
        topic?.title ||
        topic?.topic ||
        topic?.label ||
        ""
    );

}


function keyFor(topic) {

    return topicName(topic)
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

}


function unique(array) {

    const seen = new Set();


    return array.filter(item => {

        const key =
            keyFor(item);


        if (!key) {
            return false;
        }


        if (seen.has(key)) {
            return false;
        }


        seen.add(key);

        return true;

    });

}


/* =========================================================
   DATE HELPERS
========================================================= */

function localDateKey(date = new Date()) {

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


function daysBetween(a, b) {

    const first =
        new Date(
            `${a}T00:00:00`
        );


    const second =
        new Date(
            `${b}T00:00:00`
        );


    return Math.round(
        (
            second - first
        ) / 86400000
    );

}


/* =========================================================
   TOPIC EXTRACTION
========================================================= */

function collect(value, output = []) {

    if (!value) {
        return output;
    }


    if (Array.isArray(value)) {

        value.forEach(item => {

            collect(
                item,
                output
            );

        });

        return output;

    }


    if (typeof value === "string") {

        if (value.trim()) {

            output.push({
                name: value.trim()
            });

        }

        return output;

    }


    if (typeof value !== "object") {

        return output;

    }


    const name =
        topicName(value);


    const containers = [

        "topics",
        "topicList",
        "topic_list",

        "lessons",
        "lessonList",

        "units",
        "unitList",

        "chapters",
        "chapterList",

        "modules",
        "moduleList",

        "subtopics",
        "subTopics",

        "curriculumTopics",

        "content"

    ];


    if (
        name &&
        !containers.some(
            key =>
                Array.isArray(
                    value[key]
                )
        )
    ) {

        output.push(value);

    }


    containers.forEach(key => {

        if (value[key]) {

            collect(
                value[key],
                output
            );

        }

    });


    return output;

}


/* =========================================================
   NORMALIZE PLAN
========================================================= */

function normalizePlan(raw) {

    if (
        !raw ||
        typeof raw !== "object"
    ) {

        return null;

    }


    const rawSubjects =
        Array.isArray(raw.subjects)
            ? raw.subjects
            : [];


    const flatTopics =
        unique(
            collect(
                raw.topics || []
            )
        );


    const normalizedSubjects =
        rawSubjects
            .map(subject => {

                const name =
                    clean(
                        typeof subject === "string"
                            ? subject
                            : subject?.name ||
                              subject?.subject ||
                              subject?.title ||
                              "Subject"
                    );


                const subjectTopics =
                    unique(
                        collect(
                            subject?.topics ||
                            subject?.topicList ||
                            subject?.lessons ||
                            subject?.units ||
                            []
                        )
                    );


                return {

                    name,

                    topics: subjectTopics

                };

            })
            .filter(
                subject =>
                    subject.name
            );


    let allTopics =
        unique([

            ...normalizedSubjects.flatMap(
                subject =>
                    subject.topics
            ),

            ...flatTopics

        ]);


    if (
        !allTopics.length &&
        normalizedSubjects.length
    ) {

        allTopics =
            unique(
                normalizedSubjects.flatMap(
                    subject =>
                        collect(subject)
                )
            );

    }


    return {

        ...raw,

        subjects:
            normalizedSubjects,

        topics:
            allTopics

    };

}


/* =========================================================
   LOAD PLAN
========================================================= */

function loadPlan() {

    const primary =
        read(
            K.PLAN,
            null
        );


    const compatibility =
        read(
            K.COMP,
            null
        );


    return normalizePlan(
        primary ||
        compatibility
    );

}


/* =========================================================
   COMPLETION
========================================================= */

function isDone(topic) {

    return done.includes(
        keyFor(topic)
    );

}


function isQDone(topic) {

    return qdone.includes(
        keyFor(topic)
    );

}


function saveCompletion() {

    write(
        K.DONE,
        done
    );


    write(
        K.QDONE,
        qdone
    );

}


/* =========================================================
   FULL PLAN COMPLETION
========================================================= */

function allTopicsCompleted() {

    if (!topics.length) {

        return false;

    }


    return topics.every(
        topic =>
            isDone(topic)
    );

}


/* =========================================================
   SUBJECT COMPLETION
========================================================= */

function allSubjectsCompleted() {

    if (!subjects.length) {

        return allTopicsCompleted();

    }


    return subjects.every(
        subject => {

            if (!subject.topics.length) {
                return true;
            }


            return subject.topics.every(
                topic =>
                    isDone(topic)
            );

        }
    );

}


/* =========================================================
   CURRENT TOPIC
========================================================= */

function getCurrent() {

    for (
        let i = index;
        i < topics.length;
        i++
    ) {

        if (!isDone(topics[i])) {

            return topics[i];

        }

    }


    for (
        let i = 0;
        i < topics.length;
        i++
    ) {

        if (!isDone(topics[i])) {

            return topics[i];

        }

    }


    return (
        topics[
            topics.length - 1
        ] || null
    );

}


/* =========================================================
   GREETING
========================================================= */

function setGreeting(name = "") {

    const hour =
        new Date().getHours();


    let period =
        "evening";


    if (hour < 12) {

        period =
            "morning";

    }

    else if (hour < 17) {

        period =
            "afternoon";

    }


    if ($("greeting")) {

        $("greeting").textContent =
            `Good ${period}${
                name
                    ? `, ${name}`
                    : ""
            } 👋`;

    }

}


/* =========================================================
   USER
========================================================= */

async function getUser() {

    try {

        const client =
            window.supabaseClient ||
            window.supabase;


        if (
            client &&
            client.auth &&
            typeof client.auth.getUser ===
                "function"
        ) {

            const result =
                await client.auth.getUser();


            return (
                result?.data?.user ||
                null
            );

        }

    } catch (error) {

        console.warn(
            "Could not load Supabase user:",
            error
        );

    }


    return null;

}


/* =========================================================
   STUDY-TIME TRACKING
========================================================= */

function getTodayStudySeconds() {

    const today =
        localDateKey();


    const storedDate =
        read(
            K.TODAY_DATE,
            ""
        );


    if (storedDate !== today) {

        write(
            K.TODAY_DATE,
            today
        );


        write(
            K.TODAY_SECONDS,
            0
        );


        return 0;

    }


    return Number(
        read(
            K.TODAY_SECONDS,
            0
        )
    ) || 0;

}


function addStudySeconds(seconds) {

    seconds =
        Math.max(
            0,
            Number(seconds) || 0
        );


    if (!seconds) {
        return;
    }


    const total =
        Number(
            read(
                K.STUDY_SECONDS,
                0
            )
        ) || 0;


    const today =
        getTodayStudySeconds();


    write(
        K.STUDY_SECONDS,
        total + seconds
    );


    write(
        K.TODAY_SECONDS,
        today + seconds
    );


    renderStats();

}


/* =========================================================
   DAILY GOAL
========================================================= */

function getDailyGoalHours() {

    const value =
        Number(
            plan?.dailyGoal ??
            plan?.dailyStudyHours ??
            plan?.studyHoursPerDay ??
            plan?.studyHours ??
            0
        );


    return (
        Number.isFinite(value) &&
        value > 0
    )
        ? value
        : 0;

}


/* =========================================================
   WEEKLY HOURS
========================================================= */

function getWeeklyStudySeconds() {

    /*
       We keep the total study counter compatible
       with the existing localStorage structure.

       For the dashboard, "Weekly Hours" represents
       actual accumulated study time during the
       current week.
    */

    const total =
        Number(
            read(
                K.STUDY_SECONDS,
                0
            )
        ) || 0;


    /*
       Older versions may not have daily history.

       We therefore use the accumulated study time
       until a full daily-history system exists.
    */

    return total;

}


/* =========================================================
   STATS
========================================================= */

function renderStats() {

    if (!$("daysLeft")) {
        return;
    }


    /* DAYS LEFT */

    let days = null;


    if (plan?.examDate) {

        const exam =
            new Date(
                `${plan.examDate}T23:59:59`
            );


        days =
            Math.max(
                0,
                Math.ceil(
                    (
                        exam -
                        new Date()
                    ) /
                    86400000
                )
            );

    }


    $("daysLeft").textContent =
        days === null
            ? "—"
            : days;


    /* DAILY GOAL */

    const goalHours =
        getDailyGoalHours();


    const todaySeconds =
        getTodayStudySeconds();


    const goalSeconds =
        goalHours * 3600;


    if (goalHours > 0) {

        const completedHours =
            todaySeconds / 3600;


        $("dailyGoal").textContent =
            `${completedHours.toFixed(1)} / ${goalHours}h`;

    }

    else {

        $("dailyGoal").textContent =
            "Set goal";

    }


    /* PROGRESS */

    const percentage =
        topics.length
            ? Math.round(
                (
                    done.length /
                    topics.length
                ) * 100
            )
            : 0;


    if ($("studyScore")) {

        $("studyScore").textContent =
            Math.min(
                100,
                percentage
            );

    }


    if ($("progressCount")) {

        $("progressCount").textContent =
            `${Math.min(
                done.length,
                topics.length
            )} / ${topics.length} topics`;

    }


    if ($("progressPercent")) {

        $("progressPercent").textContent =
            `${percentage}%`;

    }


    if ($("progressBar")) {

        $("progressBar").style.width =
            `${percentage}%`;

    }


    /* WEEKLY HOURS */

    const weeklySeconds =
        getWeeklyStudySeconds();


    const weeklyHours =
        weeklySeconds / 3600;


    if ($("weeklyHours")) {

        $("weeklyHours").textContent =
            `${weeklyHours.toFixed(1)}h`;

    }


    /* STREAK */

    const streak =
        Number(
            read(
                K.STREAK,
                0
            )
        ) || 0;


    if ($("streakValue")) {

        $("streakValue").textContent =
            `${streak} 🔥`;

    }


    /* DAILY GOAL PROGRESS */

    if (
        $("dailyGoal") &&
        goalSeconds > 0
    ) {

        const percentage =
            Math.min(
                100,
                Math.round(
                    (
                        todaySeconds /
                        goalSeconds
                    ) * 100
                )
            );


        $("dailyGoal")
            .setAttribute(
                "title",
                `${percentage}% of today's goal completed`
            );

    }

}


/* =========================================================
   CURRENT TOPIC
========================================================= */

function renderCurrent() {

    const box =
        $("currentTopic");


    if (!box) {
        return;
    }


    const topic =
        getCurrent();


    if (!topic) {

        box.innerHTML = `
            <div class="sm-empty">
                Create a study plan from the
                Home page to begin.
            </div>
        `;

        return;

    }


    const completed =
        isDone(topic);


    const description =
        clean(
            topic.description ||
            topic.explanation ||
            ""
        );


    box.innerHTML = `

        <div class="sm-topic">

            <div class="sm-topic-top">

                <div>

                    <div
                        class="sm-muted"
                        style="
                            font-size:12px;
                            margin-bottom:6px;
                            text-transform:uppercase;
                            letter-spacing:.08em;
                        "
                    >
                        ${
                            completed
                                ? "Topic completed"
                                : "Up next"
                        }
                    </div>

                    <h3>
                        ${escapeHtml(
                            topicName(topic)
                        )}
                    </h3>

                    <div class="sm-muted">

                        ${escapeHtml(
                            description ||
                            "Focus on this topic, then take the Knowledge Check when finished."
                        )}

                    </div>

                </div>


                <span class="sm-badge ${
                    completed
                        ? "done"
                        : ""
                }">

                    ${
                        completed
                            ? "Completed"
                            : "Current"
                    }

                </span>

            </div>


            <div
                class="sm-actions"
                style="margin-top:18px"
            >

                ${
                    completed

                    ?

                    `
                    <button
                        class="sm-btn"
                        id="reviewTopicBtn"
                    >
                        ↻ Review Topic
                    </button>
                    `

                    :

                    `
                    <button
                        class="sm-btn success"
                        id="finishTopicBtn"
                    >
                        ✓ I Finished Studying
                    </button>
                    `
                }

            </div>

        </div>

    `;


    $("finishTopicBtn")
        ?.addEventListener(
            "click",
            () =>
                finishTopic(topic)
        );


    $("reviewTopicBtn")
        ?.addEventListener(
            "click",
            () => {

                alert(
                    `Review "${topicName(topic)}" from your study materials before continuing.`
                );

            }
        );

}


/* =========================================================
   SUBJECTS
========================================================= */

function renderSubjects() {

    const box =
        $("subjectList");


    if (!box) {
        return;
    }


    if (!subjects.length) {

        box.innerHTML = `
            <div class="sm-empty">
                No subjects found.
            </div>
        `;

        return;

    }


    box.innerHTML =
        subjects.map(subject => {

            const total =
                subject.topics.length;


            const completed =
                subject.topics.filter(
                    topic =>
                        isDone(topic)
                ).length;


            const percent =
                total
                    ? Math.round(
                        (
                            completed /
                            total
                        ) * 100
                    )
                    : 0;


            return `

                <div
                    class="sm-item"
                    style="
                        display:block;
                    "
                >

                    <div
                        style="
                            display:flex;
                            justify-content:space-between;
                            gap:12px;
                            align-items:center;
                        "
                    >

                        <span>

                            <b>
                                ${escapeHtml(
                                    subject.name
                                )}
                            </b>

                        </span>


                        <span
                            class="${
                                completed === total &&
                                total > 0
                                    ? "sm-check"
                                    : "sm-muted"
                            }"
                        >

                            ${
                                completed
                            }/${total}

                        </span>

                    </div>


                    <div
                        style="
                            height:6px;
                            background:rgba(127,127,127,.18);
                            border-radius:20px;
                            overflow:hidden;
                            margin-top:10px;
                        "
                    >

                        <div
                            style="
                                height:100%;
                                width:${percent}%;
                                background:var(--sm-blue);
                                border-radius:20px;
                                transition:width .3s ease;
                            "
                        ></div>

                    </div>


                    <small
                        class="sm-muted"
                        style="
                            display:block;
                            margin-top:9px;
                        "
                    >

                        ${
                            subject.topics
                                .map(topicName)
                                .map(escapeHtml)
                                .join(" • ") ||
                            "No topics listed"
                        }

                    </small>

                </div>

            `;

        }).join("");

}


/* =========================================================
   ATTRACTIVE TIMETABLE
========================================================= */

function renderSchedule() {

    const box =
        $("scheduleList");


    if (!box) {
        return;
    }


    if (!topics.length) {

        box.innerHTML = `
            <div class="sm-empty">
                Your study timetable will appear here.
            </div>
        `;

        return;

    }


    const dailyGoal =
        getDailyGoalHours();


    const minutesPerTopic =
        topics.length
            ? Math.max(
                25,
                Math.round(
                    (
                        (
                            dailyGoal ||
                            2
                        ) * 60
                    ) /
                    Math.min(
                        topics.length,
                        4
                    )
                )
            )
            : 45;


    box.innerHTML =
        topics
            .slice(0, 12)
            .map((topic, i) => {

                const completed =
                    isDone(topic);


                const startHour =
                    16 +
                    Math.floor(
                        i / 2
                    );


                const startMinute =
                    i % 2
                        ? 30
                        : 0;


                const endMinutes =
                    startMinute +
                    minutesPerTopic;


                const endHour =
                    startHour +
                    Math.floor(
                        endMinutes / 60
                    );


                const finalMinute =
                    endMinutes % 60;


                const formatTime =
                    (hour, minute) => {

                        const suffix =
                            hour >= 12
                                ? "PM"
                                : "AM";


                        let h =
                            hour % 12;


                        if (h === 0) {
                            h = 12;
                        }


                        return `${h}:${String(
                            minute
                        ).padStart(
                            2,
                            "0"
                        )} ${suffix}`;

                    };


                return `

                    <div
                        class="sm-item"
                        style="
                            align-items:center;
                            padding:16px;
                        "
                    >

                        <div
                            style="
                                display:flex;
                                gap:14px;
                                align-items:center;
                            "
                        >

                            <div
                                style="
                                    width:42px;
                                    height:42px;
                                    border-radius:12px;
                                    display:flex;
                                    align-items:center;
                                    justify-content:center;
                                    background:${
                                        completed
                                            ? "rgba(53,201,138,.15)"
                                            : "rgba(79,140,255,.15)"
                                    };
                                    font-weight:800;
                                    color:${
                                        completed
                                            ? "var(--sm-green)"
                                            : "var(--sm-blue)"
                                    };
                                "
                            >
                                ${
                                    completed
                                        ? "✓"
                                        : i + 1
                                }
                            </div>


                            <div>

                                <b>
                                    ${escapeHtml(
                                        topicName(topic)
                                    )}
                                </b>

                                <div
                                    class="sm-muted"
                                    style="
                                        margin-top:4px;
                                        font-size:12px;
                                    "
                                >
                                    ${
                                        formatTime(
                                            startHour,
                                            startMinute
                                        )
                                    }
                                    —
                                    ${
                                        formatTime(
                                            endHour,
                                            finalMinute
                                        )
                                    }
                                </div>

                            </div>

                        </div>


                        <span
                            class="${
                                completed
                                    ? "sm-check"
                                    : "sm-muted"
                            }"
                            style="
                                font-size:12px;
                                font-weight:800;
                            "
                        >

                            ${
                                completed
                                    ? "COMPLETED"
                                    : "STUDY"
                            }

                        </span>

                    </div>

                `;

            })
            .join("");

}


/* =========================================================
   CALENDAR
========================================================= */

function getCompletedDays() {

    const value =
        read(
            K.COMPLETED_DAYS,
            []
        );


    return Array.isArray(value)
        ? value
        : [];

}


function hasCompletedDay(dateKey) {

    return getCompletedDays()
        .includes(dateKey);

}


function markDayCompleted(dateKey) {

    const days =
        getCompletedDays();


    if (!days.includes(dateKey)) {

        days.push(dateKey);

        write(
            K.COMPLETED_DAYS,
            days
        );

    }

}


/* =========================================================
   CALENDAR RENDER
========================================================= */

function renderCalendar() {

    const calendar =
        $("calendar");


    if (!calendar) {
        return;
    }


    const year =
        calDate.getFullYear();


    const month =
        calDate.getMonth();


    $("calendarMonth")
        .textContent =
        calDate.toLocaleDateString(
            undefined,
            {
                month: "long",
                year: "numeric"
            }
        );


    const first =
        new Date(
            year,
            month,
            1
        ).getDay();


    const last =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    const today =
        new Date();


    const todayKey =
        localDateKey(today);


    const examDate =
        clean(
            plan?.examDate ||
            ""
        );


    const cells = [];


    /* WEEKDAY HEADERS */

    const headers = [
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat"
    ];


    headers.forEach(day => {

        cells.push(`
            <div
                style="
                    text-align:center;
                    font-size:11px;
                    color:var(--sm-muted);
                    font-weight:800;
                    padding:4px 0;
                "
            >
                ${day}
            </div>
        `);

    });


    for (
        let i = 0;
        i < first;
        i++
    ) {

        cells.push(
            "<div></div>"
        );

    }


    for (
        let day = 1;
        day <= last;
        day++
    ) {

        const date =
            new Date(
                year,
                month,
                day
            );


        const dateKey =
            localDateKey(date);


        let classes =
            "sm-day";


        let label =
            "";


        const completed =
            hasCompletedDay(
                dateKey
            );


        if (completed) {

            classes +=
                " done";

            label =
                "✓";

        }

        else if (
            dateKey === examDate
        ) {

            classes +=
                " exam";

            label =
                "EXAM";

        }

        else if (
            dateKey === todayKey
        ) {

            classes +=
                " study";

            label =
                "TODAY";

        }

        else if (
            date.getDay() === 0 ||
            date.getDay() === 6
        ) {

            classes +=
                " rest";

            label =
                "REST";

        }


        cells.push(`

            <div
                class="${classes}"
                title="${
                    completed
                        ? "Study day completed"
                        : dateKey === examDate
                            ? "Exam day"
                            : ""
                }"
                style="
                    position:relative;
                    transition:.2s ease;
                "
            >

                <b>${day}</b>

                ${
                    label
                        ? `
                        <div
                            style="
                                font-size:8px;
                                margin-top:5px;
                                font-weight:800;
                                opacity:.8;
                            "
                        >
                            ${label}
                        </div>
                        `
                        : ""
                }

            </div>

        `);

    }


    calendar.innerHTML =
        cells.join("");

}


/* =========================================================
   WHOLE-DAY COMPLETION
========================================================= */

function processFullDayCompletion() {

    if (!allSubjectsCompleted()) {

        return false;

    }


    const today =
        localDateKey();


    const alreadyCompleted =
        hasCompletedDay(
            today
        );


    /*
       IMPORTANT:
       The day is completed only once.
    */

    if (!alreadyCompleted) {

        markDayCompleted(today);

        updateStreakForCompletedDay(
            today
        );

        showCongratulations();

        return true;

    }


    return false;

}


/* =========================================================
   STREAK
========================================================= */

function updateStreakForCompletedDay(
    completedDate
) {

    const last =
        clean(
            read(
                K.LAST,
                ""
            )
        );


    let streak =
        Number(
            read(
                K.STREAK,
                0
            )
        ) || 0;


    /*
       If today's completed day was already
       registered, do nothing.
    */

    if (last === completedDate) {

        return;

    }


    if (!last) {

        /*
           First ever completed study day.
           Streak becomes 1.
        */

        streak = 1;

    }

    else {

        const difference =
            daysBetween(
                last,
                completedDate
            );


        if (difference === 1) {

            streak += 1;

        }

        else if (difference > 1) {

            /*
               A missed day breaks the streak.
            */

            streak = 1;

        }

        else {

            return;

        }

    }


    write(
        K.STREAK,
        streak
    );


    write(
        K.LAST,
        completedDate
    );


    renderStats();

}


/* =========================================================
   CONGRATULATIONS
========================================================= */

function showCongratulations() {

    const today =
        localDateKey();


    const lastShown =
        read(
            K.LAST_CONGRATULATED_DAY,
            ""
        );


    if (
        lastShown === today
    ) {

        return;

    }


    write(
        K.LAST_CONGRATULATED_DAY,
        today
    );


    let modal =
        document.getElementById(
            "congratulationsModal"
        );


    if (!modal) {

        modal =
            document.createElement(
                "div"
            );


        modal.id =
            "congratulationsModal";


        modal.className =
            "sm-modal";


        modal.innerHTML = `

            <div
                class="sm-modal-box"
                style="
                    text-align:center;
                    max-width:500px;
                "
            >

                <div
                    style="
                        font-size:58px;
                        margin-bottom:10px;
                    "
                >
                    🎉
                </div>


                <h2>
                    Congratulations!
                </h2>


                <p
                    class="sm-muted"
                    style="
                        line-height:1.7;
                    "
                >
                    You completed all your subjects
                    for today.
                    <br>
                    Your study day is officially complete.
                </p>


                <div
                    style="
                        margin:20px 0;
                        padding:16px;
                        border-radius:16px;
                        background:rgba(53,201,138,.10);
                        border:1px solid rgba(53,201,138,.25);
                    "
                >

                    <div
                        style="
                            font-size:13px;
                            color:var(--sm-muted);
                        "
                    >
                        CURRENT STREAK
                    </div>


                    <strong
                        id="congratsStreak"
                        style="
                            display:block;
                            font-size:32px;
                            margin-top:5px;
                        "
                    >
                        ${
                            read(
                                K.STREAK,
                                0
                            )
                        } 🔥
                    </strong>

                </div>


                <button
                    class="sm-btn success"
                    id="closeCongratulations"
                    style="
                        width:100%;
                        padding:14px;
                    "
                >
                    Continue Studying 🚀
                </button>

            </div>

        `;


        document.body.appendChild(
            modal
        );


        document
            .getElementById(
                "closeCongratulations"
            )
            ?.addEventListener(
                "click",
                () => {

                    modal.classList.remove(
                        "show"
                    );

                }
            );

    }


    const streak =
        Number(
            read(
                K.STREAK,
                0
            )
        ) || 0;


    const streakBox =
        document.getElementById(
            "congratsStreak"
        );


    if (streakBox) {

        streakBox.textContent =
            `${streak} 🔥`;

    }


    modal.classList.add(
        "show"
    );


    renderCalendar();

}


/* =========================================================
   COMPLETE TOPIC
========================================================= */

function finishTopic(topic) {

    const key = keyFor(topic);

    if (!key) {
        return;
    }

    /*
       Do NOT mark the topic as completed yet.

       The user must first pass the Knowledge Check.
    */

    currentKC = topic;

    write(
        K.KCTOPIC,
        {
            name: topicName(topic),
            topic: currentKC,
            createdAt: new Date().toISOString()
        }
    );

    $("knowledgeModalText").textContent =
        `You finished “${topicName(topic)}”. Take the 5-question Knowledge Check to complete this topic.`;

    $("knowledgeModal")
        .classList
        .add("show");
}

/* =========================================================
   KNOWLEDGE CHECK
========================================================= */

function openKnowledgeCheck() {

    const used =
        Number(
            read(
                K.KCUSAGE,
                0
            )
        ) || 0;


    if (used >= KC_LIMIT) {

        alert(
            `You have used all ${KC_LIMIT} free Knowledge Checks. Premium gives you unlimited Knowledge Checks.`
        );


        location.href =
            "premium.html";


        return;

    }


    if (!currentKC) {
        return;
    }


    write(
        K.KCTOPIC,
        {

            name:
                topicName(
                    currentKC
                ),

            topic:
                currentKC,

            createdAt:
                new Date().toISOString()

        }
    );


    location.href =
        "knowledge-check.html";

}


/* =========================================================
   TIMER DISPLAY
========================================================= */

function renderTimer() {

    if (!$("studyTimer")) {
        return;
    }


    const minutes =
        Math.floor(
            timerSeconds / 60
        );


    const seconds =
        timerSeconds % 60;


    $("studyTimer")
        .textContent =
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

}


/* =========================================================
   TIMER PERSISTENCE
========================================================= */

function persistTimer() {

    write(
        K.TIMER,
        timerSeconds
    );


    write(
        K.DURATION,
        selectedTimerSeconds
    );


    write(
        K.RUNNING,
        timerRunning
    );


    if (timerRunning) {

        write(
            K.END,
            Date.now() +
            timerSeconds * 1000
        );

    }

    else {

        localStorage.removeItem(
            K.END
        );

    }

}


/* =========================================================
   TIMER
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


    const end =
        Date.now() +
        timerSeconds * 1000;


    write(
        K.END,
        end
    );


    write(
        K.RUNNING,
        true
    );


    timerInterval =
        setInterval(
            () => {

                const savedEnd =
                    Number(
                        read(
                            K.END,
                            0
                        )
                    );


                const remaining =
                    Math.max(
                        0,
                        Math.ceil(
                            (
                                savedEnd -
                                Date.now()
                            ) / 1000
                        )
                    );


                const previous =
                    timerSeconds;


                timerSeconds =
                    remaining;


                /*
                   Every elapsed second is real study time.
                */

                const elapsed =
                    Math.max(
                        0,
                        previous -
                        remaining
                    );


                if (elapsed > 0) {

                    addStudySeconds(
                        elapsed
                    );

                }


                renderTimer();


                if (
                    timerSeconds <= 0
                ) {

                    clearInterval(
                        timerInterval
                    );


                    timerInterval =
                        null;


                    timerRunning =
                        false;


                    persistTimer();


                    alert(
                        "Study session complete! Great work. 🎉"
                    );


                    renderStats();

                }

            },
            1000
        );


    persistTimer();

}


/* =========================================================
   PAUSE TIMER
========================================================= */

function pauseTimer() {

    if (!timerRunning) {
        return;
    }


    /*
       Capture time elapsed since the last
       timer tick before stopping.
    */

    const end =
        Number(
            read(
                K.END,
                0
            )
        );


    if (end) {

        const remaining =
            Math.max(
                0,
                Math.ceil(
                    (
                        end -
                        Date.now()
                    ) / 1000
                )
            );


        const elapsed =
            Math.max(
                0,
                timerSeconds -
                remaining
            );


        if (elapsed > 0) {

            addStudySeconds(
                elapsed
            );

        }


        timerSeconds =
            remaining;

    }


    timerRunning =
        false;


    clearInterval(
        timerInterval
    );


    timerInterval =
        null;


    persistTimer();


    renderTimer();

}


/* =========================================================
   RESET TIMER
========================================================= */

function resetTimer() {

    pauseTimer();


    timerSeconds =
        selectedTimerSeconds;


    persistTimer();


    renderTimer();

}


/* =========================================================
   TIMER INIT
========================================================= */

function initTimer() {

    selectedTimerSeconds =
        Number(
            read(
                K.DURATION,
                1500
            )
        ) || 1500;


    if (
        ![
            1500,
            2700,
            3600
        ].includes(
            selectedTimerSeconds
        )
    ) {

        selectedTimerSeconds =
            1500;

    }


    timerSeconds =
        Number(
            read(
                K.TIMER,
                selectedTimerSeconds
            )
        );


    const end =
        Number(
            read(
                K.END,
                0
            )
        );


    const wasRunning =
        !!read(
            K.RUNNING,
            false
        );


    if (
        wasRunning &&
        end
    ) {

        timerSeconds =
            Math.max(
                0,
                Math.ceil(
                    (
                        end -
                        Date.now()
                    ) / 1000
                )
            );


        if (
            timerSeconds > 0
        ) {

            timerRunning =
                false;


            startTimer();

            return;

        }

    }


    timerRunning =
        false;


    renderTimer();


    if ($("timerDuration")) {

        $("timerDuration")
            .value =
            String(
                selectedTimerSeconds
            );

    }

}


/* =========================================================
   THEME
========================================================= */

function setupTheme() {

    const saved =
        read(
            K.THEME,
            "dark"
        );


    applyTheme(
        saved
    );


    $("themeButton")
        ?.addEventListener(
            "click",
            () => {

                const current =
                    read(
                        K.THEME,
                        "dark"
                    );


                const next =
                    current === "dark"
                        ? "light"
                        : "dark";


                write(
                    K.THEME,
                    next
                );


                applyTheme(
                    next
                );

            }
        );

}


/* =========================================================
   APPLY THEME
========================================================= */

function applyTheme(theme) {

    const root =
        document.documentElement;


    if (
        theme === "light"
    ) {

        root.style.setProperty(
            "--sm-bg",
            "#f3f6fb"
        );


        root.style.setProperty(
            "--sm-card",
            "#ffffff"
        );


        root.style.setProperty(
            "--sm-card2",
            "#eef3fa"
        );


        root.style.setProperty(
            "--sm-text",
            "#172033"
        );


        root.style.setProperty(
            "--sm-muted",
            "#66758d"
        );


        root.style.setProperty(
            "--sm-border",
            "rgba(20,40,70,.10)"
        );


        document.body.style.background =
            "#f3f6fb";


        document.body.style.color =
            "#172033";


        if ($("themeButton")) {

            $("themeButton").textContent =
                "☀ Light Mode";

        }

    }

    else {

        root.style.setProperty(
            "--sm-bg",
            "#0b1220"
        );


        root.style.setProperty(
            "--sm-card",
            "#111b2e"
        );


        root.style.setProperty(
            "--sm-card2",
            "#16233a"
        );


        root.style.setProperty(
            "--sm-text",
            "#eef4ff"
        );


        root.style.setProperty(
            "--sm-muted",
            "#9badc7"
        );


        root.style.setProperty(
            "--sm-border",
            "rgba(255,255,255,.08)"
        );


        document.body.style.background =
            "#0b1220";


        document.body.style.color =
            "#eef4ff";


        if ($("themeButton")) {

            $("themeButton").textContent =
                "◐ Dark Mode";

        }

    }


    /*
       Extra styling for elements already present
       in dashboard.html.
    */

    document
        .querySelectorAll(
            ".sm-card, .sm-stat, .sm-topic, .sm-item"
        )
        .forEach(element => {

            element.style.color =
                "var(--sm-text)";

        });


    document
        .querySelectorAll(
            ".sm-select"
        )
        .forEach(select => {

            select.style.background =
                theme === "light"
                    ? "#ffffff"
                    : "#0d1728";


            select.style.color =
                "var(--sm-text)";

        });

}


/* =========================================================
   AI NAVIGATION
========================================================= */

function setupAINavigation() {

    const actions =
        document.querySelector(
            ".sm-top .sm-actions"
        );


    if (!actions) {
        return;
    }


    /*
       Don't duplicate buttons if this function
       is accidentally called twice.
    */

    if (
        document.getElementById(
            "aiSupportNav"
        )
    ) {

        return;

    }


    const aiButton =
        document.createElement(
            "button"
        );


    aiButton.id =
        "aiSupportNav";


    aiButton.className =
        "sm-btn";


    aiButton.textContent =
        "🤖 AI Support";


    aiButton.onclick =
        () => {

            location.href =
                "ai-support.html";

        };


    const summaryButton =
        document.createElement(
            "button"
        );


    summaryButton.id =
        "summarizerNav";


    summaryButton.className =
        "sm-btn";


    summaryButton.textContent =
        "📄 Summarizer";


    summaryButton.onclick =
        () => {

            location.href =
                "summarizer.html";

        };


    actions.insertBefore(
        aiButton,
        actions.firstChild
    );


    actions.insertBefore(
        summaryButton,
        aiButton.nextSibling
    );

}


/* =========================================================
   DAILY CHALLENGE
========================================================= */

function renderDailyChallenge() {

    const box =
        $("dailyChallengeText");


    if (!box) {
        return;
    }


    if (!topics.length) {

        box.textContent =
            "Create a study plan to unlock your daily challenge.";

        return;

    }


    const current =
        getCurrent();


    if (
        allSubjectsCompleted()
    ) {

        box.innerHTML =
            `
            <strong>
                🎉 Daily challenge complete!
            </strong>
            <br>
            <span class="sm-muted">
                You completed today's study plan.
            </span>
            `;

        return;

    }


    box.innerHTML =
        `
        <strong>
            🎯 Complete today's topic
        </strong>
        <br>
        <span class="sm-muted">
            Finish ${
                escapeHtml(
                    topicName(current)
                )
            } and take your Knowledge Check.
        </span>
        `;

}


/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupEvents() {

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
            event => {

                selectedTimerSeconds =
                    Number(
                        event.target.value
                    );


                if (
                    ![
                        1500,
                        2700,
                        3600
                    ].includes(
                        selectedTimerSeconds
                    )
                ) {

                    selectedTimerSeconds =
                        1500;

                }


                resetTimer();

            }
        );


    $("previousMonth")
        ?.addEventListener(
            "click",
            () => {

                calDate.setMonth(
                    calDate.getMonth() - 1
                );


                renderCalendar();

            }
        );


    $("nextMonth")
        ?.addEventListener(
            "click",
            () => {

                calDate.setMonth(
                    calDate.getMonth() + 1
                );


                renderCalendar();

            }
        );


    $("closeKnowledgeModal")
        ?.addEventListener(
            "click",
            () => {

                $("knowledgeModal")
                    ?.classList
                    .remove(
                        "show"
                    );

            }
        );


    $("startKnowledgeCheck")
        ?.addEventListener(
            "click",
            openKnowledgeCheck
        );

}


/* =========================================================
   INITIALIZE
========================================================= */

async function init() {

    console.log(
        "StudyMind Dashboard initializing..."
    );


    plan =
        loadPlan();


    setupTheme();


    setupAINavigation();


    setupEvents();


    initTimer();


    /*
       No plan yet.
    */

    if (!plan) {

        setGreeting("");


        renderStats();


        renderCurrent();


        renderCalendar();


        return;

    }


    subjects =
        plan.subjects || [];


    topics =
        unique(
            plan.topics || []
        );


    done =
        read(
            K.DONE,
            []
        );


    if (!Array.isArray(done)) {

        done = [];

    }


    qdone =
        read(
            K.QDONE,
            []
        );


    if (!Array.isArray(qdone)) {

        qdone = [];

    }


    index =
        Number(
            read(
                K.INDEX,
                0
            )
        ) || 0;


    const user =
        await getUser();


    if (user) {

        window.currentUser =
            user;


        const name =
            clean(
                user.user_metadata
                    ?.username ||

                user.user_metadata
                    ?.name ||

                user.email
                    ?.split("@")[0] ||

                ""
            );


        setGreeting(
            name
        );

    }

    else {

        setGreeting("");

    }


    /*
       Make sure the daily study counter
       is initialized.
    */

    getTodayStudySeconds();


    renderStats();

    renderCurrent();

    renderSubjects();

    renderSchedule();

    renderCalendar();

    renderDailyChallenge();


    /*
       If the user already completed the
       entire plan before refreshing, ensure
       the calendar/streak state is synchronized.
    */

    if (
        allSubjectsCompleted()
    ) {

        processFullDayCompletion();

        renderStats();

        renderCalendar();

        renderDailyChallenge();

    }


    console.log(
        "StudyMind Dashboard ready."
    );


    console.log(
        "Subjects:",
        subjects
    );


    console.log(
        "Topics:",
        topics
    );

}


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    init
);

