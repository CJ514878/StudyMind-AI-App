"use strict";


/* =========================================================
   STUDYMIND AI — CLEAN DASHBOARD
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
    KCTOPIC: "studyMindKnowledgeCheckTopic"

};


const KC_LIMIT = 5;


let plan = null;

let topics = [];
let subjects = [];

let done = [];
let qdone = [];

let index = 0;

let currentKC = null;


/* =========================================================
   TIMER STATE
========================================================= */

let timerSeconds = 1500;
let selectedTimerSeconds = 1500;

let timerInterval = null;
let timerRunning = false;


let calDate = new Date();


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

        const key = keyFor(item);

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
   TOPIC EXTRACTION
========================================================= */

function collect(value, output = []) {

    if (!value) {
        return output;
    }


    if (Array.isArray(value)) {

        value.forEach(item => {

            collect(item, output);

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


    const name = topicName(value);


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
            key => Array.isArray(value[key])
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
            .filter(subject => subject.name);


    let allTopics =
        unique([
            ...normalizedSubjects.flatMap(
                subject => subject.topics
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
                    subject => collect(subject)
                )
            );

    }


    return {

        ...raw,

        subjects: normalizedSubjects,

        topics: allTopics

    };

}


/* =========================================================
   LOAD PLAN
========================================================= */

function loadPlan() {

    const primary =
        read(K.PLAN, null);

    const compatibility =
        read(K.COMP, null);


    return normalizePlan(
        primary || compatibility
    );

}


/* =========================================================
   TOPIC STATUS
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

    write(K.DONE, done);

    write(K.QDONE, qdone);

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


    return topics[
        topics.length - 1
    ] || null;

}


/* =========================================================
   GREETING
========================================================= */

function setGreeting(name = "") {

    const hour =
        new Date().getHours();


    let period = "evening";


    if (hour < 12) {

        period = "morning";

    } else if (hour < 17) {

        period = "afternoon";

    }


    $("greeting").textContent =
        `Good ${period}${
            name
                ? `, ${name}`
                : ""
        } 👋`;

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
            typeof client.auth.getUser === "function"
        ) {

            const result =
                await client.auth.getUser();


            return result?.data?.user || null;

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
   STATS
========================================================= */

function renderStats() {

    let days = null;


    if (plan?.examDate) {

        const exam =
            new Date(
                plan.examDate +
                "T23:59:59"
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


    $("dailyGoal").textContent =
        plan?.studyHours
            ? `${plan.studyHours}h`
            : "—";


    const percentage =
        topics.length
            ? Math.round(
                (
                    done.length /
                    topics.length
                ) * 100
            )
            : 0;


    $("studyScore").textContent =
        Math.min(
            100,
            percentage
        );


    $("progressCount").textContent =
        `${Math.min(
            done.length,
            topics.length
        )} / ${topics.length} topics`;


    $("progressPercent").textContent =
        `${percentage}%`;


    $("progressBar").style.width =
        `${percentage}%`;


    const weeklyHours =
        Number(
            plan?.studyHours || 0
        );


    $("weeklyHours").textContent =
        `${Math.round(
            weeklyHours * 7 * 100
        ) / 100}h`;


    $("streakValue").textContent =
        `${Number(
            read(K.STREAK, 0)
        )} 🔥`;

}


/* =========================================================
   CURRENT TOPIC
========================================================= */

function renderCurrent() {

    const box =
        $("currentTopic");


    const topic =
        getCurrent();


    if (!topic) {

        box.innerHTML = `
            <div class="sm-empty">
                No topics yet.
                Create a study plan on the Home page.
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
                        Review Topic
                    </button>
                    `

                    :

                    `
                    <button
                        class="sm-btn success"
                        id="finishTopicBtn"
                    >
                        ✓ I Have Finished Studying This Topic
                    </button>
                    `
                }

            </div>

        </div>

    `;


    $("finishTopicBtn")
        ?.addEventListener(
            "click",
            () => finishTopic(topic)
        );

}


/* =========================================================
   SUBJECTS
========================================================= */

function renderSubjects() {

    const box =
        $("subjectList");


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

            const completed =
                subject.topics.filter(
                    topic => isDone(topic)
                ).length;


            const names =
                subject.topics
                    .map(topicName)
                    .join(" • ");


            return `

                <div class="sm-item">

                    <span>

                        <b>
                            ${escapeHtml(
                                subject.name
                            )}
                        </b>

                        <br>

                        <small class="sm-muted">

                            ${
                                names ||
                                "No topics listed"
                            }

                        </small>

                    </span>


                    <span>

                        ${
                            completed
                        }/${
                            subject.topics.length
                        }

                    </span>

                </div>

            `;

        }).join("");

}


/* =========================================================
   SCHEDULE
========================================================= */

function renderSchedule() {

    const box =
        $("scheduleList");


    if (!topics.length) {

        box.innerHTML = `
            <div class="sm-empty">
                Your study schedule will appear here.
            </div>
        `;

        return;

    }


    box.innerHTML =
        topics
            .slice(0, 12)
            .map((topic, i) => {

                const completed =
                    isDone(topic);


                return `

                    <div class="sm-item">

                        <span>

                            <b>
                                ${i + 1}.
                                ${escapeHtml(
                                    topicName(topic)
                                )}
                            </b>

                        </span>


                        <span
                            class="${
                                completed
                                    ? "sm-check"
                                    : "sm-muted"
                            }"
                        >

                            ${
                                completed
                                    ? "✓ Done"
                                    : "Study"
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

function renderCalendar() {

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


    const cells = [];


    for (
        let i = 0;
        i < first;
        i++
    ) {

        cells.push("<div></div>");

    }


    const examDate =
        plan?.examDate || "";


    const today =
        new Date();


    for (
        let day = 1;
        day <= last;
        day++
    ) {

        const dateString =
            `${year}-${
                String(month + 1)
                    .padStart(2, "0")
            }-${
                String(day)
                    .padStart(2, "0")
            }`;


        let className = "";


        if (
            dateString === examDate
        ) {

            className = "exam";

        }

        else if (
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
        ) {

            className = "study";

        }

        else if (
            new Date(
                year,
                month,
                day
            ).getDay() === 6
        ) {

            className = "rest";

        }


        cells.push(`

            <div
                class="sm-day ${className}"
            >

                <b>${day}</b>

            </div>

        `);

    }


    $("calendar").innerHTML =
        cells.join("");

}


/* =========================================================
   COMPLETE TOPIC
========================================================= */

function finishTopic(topic) {

    const key =
        keyFor(topic);


    if (!key) {
        return;
    }


    if (!done.includes(key)) {

        done.push(key);

    }


    saveCompletion();


    const topicIndex =
        topics.findIndex(
            item =>
                keyFor(item) === key
        );


    if (topicIndex >= 0) {

        index =
            topicIndex + 1;

        write(
            K.INDEX,
            index
        );

    }


    updateStreak();


    renderStats();
    renderCurrent();
    renderSubjects();
    renderSchedule();


    /* =====================================================
       THIS IS THE IMPORTANT PART.

       The Knowledge Check popup appears IMMEDIATELY
       after clicking "I Have Finished Studying This Topic".

       We do NOT render the next topic before showing it.
    ===================================================== */

    currentKC = topic;


    $("knowledgeModalText")
        .textContent =
        `You finished “${
            topicName(topic)
        }”. Take a 5-question Knowledge Check to confirm what you learned.`;


    $("knowledgeModal")
        .classList
        .add("show");

}


/* =========================================================
   OPEN KNOWLEDGE CHECK
========================================================= */

function openKnowledgeCheck() {

    const used =
        Number(
            read(
                K.KCUSAGE,
                0
            )
        );


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
   STREAK
========================================================= */

function updateStreak() {

    const today =
        new Date()
            .toISOString()
            .slice(0, 10);


    const last =
        read(
            K.LAST,
            ""
        );


    let streak =
        Number(
            read(
                K.STREAK,
                0
            )
        );


    if (last === today) {

        return;

    }


    if (last) {

        const difference =
            Math.round(
                (
                    new Date(today) -
                    new Date(last)
                ) /
                86400000
            );


        if (difference === 1) {

            streak++;

        }

        else {

            streak = 1;

        }

    }

    else {

        streak = 1;

    }


    write(
        K.STREAK,
        streak
    );


    write(
        K.LAST,
        today
    );

}


/* =========================================================
   TIMER
========================================================= */

function renderTimer() {

    const minutes =
        Math.floor(
            timerSeconds / 60
        );


    const seconds =
        timerSeconds % 60;


    $("studyTimer")
        .textContent =
        `${String(minutes)
            .padStart(2, "0")
        }:${
            String(seconds)
                .padStart(2, "0")
        }`;

}


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


function startTimer() {

    if (timerRunning) {
        return;
    }


    timerRunning = true;


    const end =
        Date.now() +
        timerSeconds * 1000;


    write(
        K.END,
        end
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


                timerSeconds =
                    Math.max(
                        0,
                        Math.ceil(
                            (
                                savedEnd -
                                Date.now()
                            ) /
                            1000
                        )
                    );


                renderTimer();


                if (
                    timerSeconds <= 0
                ) {

                    pauseTimer();


                    alert(
                        "Study session complete! Great work."
                    );


                    updateStreak();

                }

            },
            250
        );


    persistTimer();

}


function pauseTimer() {

    timerRunning = false;


    clearInterval(
        timerInterval
    );


    timerInterval = null;


    persistTimer();

}


function resetTimer() {

    pauseTimer();


    timerSeconds =
        selectedTimerSeconds;


    persistTimer();


    renderTimer();

}


function initTimer() {

    selectedTimerSeconds =
        Number(
            read(
                K.DURATION,
                1500
            )
        ) || 1500;


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
                    ) /
                    1000
                )
            );


        if (
            timerSeconds > 0
        ) {

            timerRunning = false;

            startTimer();

            return;

        }

    }


    timerRunning = false;


    renderTimer();


    $("timerDuration")
        .value =
        String(
            selectedTimerSeconds
        );

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


    applyTheme(saved);


    $("themeButton")
        .onclick =
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


            applyTheme(next);

        };

}


function applyTheme(theme) {

    if (
        theme === "light"
    ) {

        document.documentElement
            .style
            .setProperty(
                "--sm-bg",
                "#f5f7fb"
            );


        document.body.style.color =
            "#162033";

    }

    else {

        document.documentElement
            .style
            .setProperty(
                "--sm-bg",
                "#0b1220"
            );


        document.body.style.color =
            "";

    }

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(value)
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


/* =========================================================
   INITIALIZE
========================================================= */

async function init() {

    console.log(
        "StudyMind Dashboard initializing..."
    );


    plan =
        loadPlan();


    if (!plan) {

        setGreeting("");

        renderStats();

        renderCurrent();

        setupTheme();

        initTimer();

        return;

    }


    subjects =
        plan.subjects || [];


    topics =
        unique(
            plan.topics || []
        );


    done =
        Array.isArray(
            read(
                K.DONE,
                []
            )
        )
            ? read(
                K.DONE,
                []
            )
            : [];


    qdone =
        Array.isArray(
            read(
                K.QDONE,
                []
            )
        )
            ? read(
                K.QDONE,
                []
            )
            : [];


    index =
        Number(
            read(
                K.INDEX,
                0
            )
        );


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


        setGreeting(name);

    }

    else {

        setGreeting("");

    }


    renderStats();

    renderCurrent();

    renderSubjects();

    renderSchedule();

    renderCalendar();

    initTimer();

    setupTheme();


    $("startTimerButton")
        .onclick =
        startTimer;


    $("pauseTimerButton")
        .onclick =
        pauseTimer;


    $("resetTimerButton")
        .onclick =
        resetTimer;


    $("timerDuration")
        .onchange =
        event => {

            selectedTimerSeconds =
                Number(
                    event.target.value
                );


            resetTimer();

        };


    $("previousMonth")
        .onclick =
        () => {

            calDate.setMonth(
                calDate.getMonth() - 1
            );


            renderCalendar();

        };


    $("nextMonth")
        .onclick =
        () => {

            calDate.setMonth(
                calDate.getMonth() + 1
            );


            renderCalendar();

        };


    $("closeKnowledgeModal")
        .onclick =
        () => {

            $("knowledgeModal")
                .classList
                .remove("show");

        };


    $("startKnowledgeCheck")
        .onclick =
        openKnowledgeCheck;


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


document.addEventListener(
    "DOMContentLoaded",
    init
);
