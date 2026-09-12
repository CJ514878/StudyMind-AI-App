/* =========================================================
   STUDYMIND AI — GOALS
   COMPLETE FRONTEND
========================================================= */

"use strict";


/* =========================================================
   STORAGE
========================================================= */

const STORAGE = {

    PLAN: "studyMindPlan",

    PLANS: "studyMindPlans",
    ACTIVE_PLAN: "studyMindActivePlanId",

    COMPLETED: "studyMindCompletedTopics",

    STREAK_ACTIVITY: "studyMindStreakActivity",

    TIMER_SECONDS: "studyMindTimerSeconds",
    TIMER_END: "studyMindTimerEndTime",
    TIMER_RUNNING: "studyMindTimerRunning",

    USER: "studyMindUser",

    THEME: "studyMindTheme"
};


/* =========================================================
   STATE
========================================================= */

let state = {

    plan: null,

    completedTopics: [],

    streakActivity: {},

    today: new Date(),

    totalTopics: 0,

    completedTotal: 0,

    todayCompleted: 0,

    todayHours: 0,

    weeklyHours: 0,

    weeklyTopics: 0,

    weeklyDays: 0,

    currentStreak: 0,

    bestStreak: 0
};


/* =========================================================
   HELPERS
========================================================= */

function readJSON(key, fallback = null) {

    try {

        const value = localStorage.getItem(key);

        if (!value) return fallback;

        return JSON.parse(value);

    } catch (error) {

        console.warn("StudyMind storage error:", key, error);

        return fallback;
    }
}


function writeJSON(key, value) {

    try {

        localStorage.setItem(key, JSON.stringify(value));

    } catch (error) {

        console.warn("Unable to save:", key, error);
    }
}


function todayKey(date = new Date()) {

    const y = date.getFullYear();

    const m = String(date.getMonth() + 1).padStart(2, "0");

    const d = String(date.getDate()).padStart(2, "0");

    return `${y}-${m}-${d}`;
}


function startOfDay(date) {

    const result = new Date(date);

    result.setHours(0, 0, 0, 0);

    return result;
}


function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function clamp(number, min, max) {

    return Math.min(Math.max(number, min), max);
}


function percent(value, target) {

    if (!target || target <= 0) return 0;

    return Math.round(
        clamp((value / target) * 100, 0, 100)
    );
}


function formatHours(hours) {

    const value = Number(hours) || 0;

    if (value < 1) {

        return `${Math.round(value * 60)}m`;
    }

    if (Number.isInteger(value)) {

        return `${value}h`;
    }

    return `${value.toFixed(1)}h`;
}


/* =========================================================
   DATE
========================================================= */

function renderDate() {

    const dateElement =
        document.getElementById("todayDate");

    const rangeElement =
        document.getElementById("weekRange");

    if (dateElement) {

        dateElement.textContent =
            new Intl.DateTimeFormat(
                undefined,
                {
                    weekday: "short",
                    month: "short",
                    day: "numeric"
                }
            ).format(state.today);
    }

    if (rangeElement) {

        const start = getWeekStart(state.today);

        const end = new Date(start);

        end.setDate(end.getDate() + 6);

        const formatter =
            new Intl.DateTimeFormat(
                undefined,
                {
                    month: "short",
                    day: "numeric"
                }
            );

        rangeElement.textContent =
            `${formatter.format(start)} – ${formatter.format(end)}`;
    }
}


function getWeekStart(date) {

    const result = startOfDay(date);

    const day = result.getDay();

    const difference = day === 0 ? -6 : 1 - day;

    result.setDate(result.getDate() + difference);

    return result;
}


/* =========================================================
   GREETING
========================================================= */

function renderGreeting() {

    const hour = new Date().getHours();

    let greeting = "Good morning";

    if (hour >= 12 && hour < 18) {

        greeting = "Good afternoon";

    } else if (hour >= 18) {

        greeting = "Good evening";
    }

    const greetingElement =
        document.getElementById("greeting");

    if (greetingElement) {

        greetingElement.textContent = greeting;
    }


    let name = "";

    const user =
        readJSON(STORAGE.USER, null);

    if (user) {

        name =
            user.name ||
            user.fullName ||
            user.username ||
            "";
    }


    if (!name) {

        const possibleUser =
            localStorage.getItem("studyMindUserName") ||
            localStorage.getItem("username");

        if (possibleUser) {

            name = possibleUser;
        }
    }


    const nameElement =
        document.getElementById("userName");

    if (nameElement && name) {

        nameElement.textContent =
            `, ${name}`;
    }
}


/* =========================================================
   PLAN LOADING
========================================================= */

function loadPlan() {

    let plan = readJSON(STORAGE.PLAN, null);


    /*
       New multi-plan system.
       If an active plan exists, prefer it.
    */

    const plans =
        readJSON(STORAGE.PLANS, null);

    const activeId =
        localStorage.getItem(STORAGE.ACTIVE_PLAN);


    if (Array.isArray(plans) && plans.length) {

        let active = null;

        if (activeId) {

            active =
                plans.find(
                    item =>
                        String(item.id) === String(activeId)
                );
        }

        if (!active) {

            active = plans[0];
        }

        if (active) {

            plan = active;
        }
    }


    state.plan = plan;

    return plan;
}


/* =========================================================
   PLAN TOPICS
========================================================= */

function normalizeTopic(topic) {

    if (typeof topic === "string") {

        return {
            name: topic,
            id: topic
        };
    }


    if (!topic || typeof topic !== "object") {

        return {
            name: "",
            id: ""
        };
    }


    const name =
        topic.name ||
        topic.title ||
        topic.topic ||
        topic.text ||
        "";


    const id =
        topic.id ||
        topic.topicId ||
        name;


    return {
        name: String(name),
        id: String(id)
    };
}


function getPlanSubjects() {

    const plan = state.plan;

    if (!plan) return [];


    /*
       Main format:
       subjects: [
           {
               name: "Mathematics",
               topics: [...]
           }
       ]
    */

    if (Array.isArray(plan.subjects)) {

        return plan.subjects.map(subject => {

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
                    subject.title ||
                    "Subject",

                topics:
                    Array.isArray(subject.topics)
                        ? subject.topics
                        : []
            };

        });
    }


    /*
       Compatibility with subjectNames
    */

    if (Array.isArray(plan.subjectNames)) {

        return plan.subjectNames.map(name => ({

            name: String(name),

            topics: []

        }));
    }


    return [];
}


function getAllPlanTopics() {

    const subjects = getPlanSubjects();

    const result = [];


    subjects.forEach(subject => {

        subject.topics.forEach(topic => {

            const normalized =
                normalizeTopic(topic);

            if (!normalized.name) return;

            result.push({

                ...normalized,

                subject:
                    subject.name

            });

        });

    });


    /*
       Compatibility with flat topics array.
    */

    if (
        !result.length &&
        Array.isArray(state.plan?.topics)
    ) {

        state.plan.topics.forEach(topic => {

            const normalized =
                normalizeTopic(topic);

            if (!normalized.name) return;

            result.push({

                ...normalized,

                subject:
                    topic.subject ||
                    "General"

            });

        });
    }


    return result;
}


/* =========================================================
   COMPLETION DATA
========================================================= */

function loadCompletedTopics() {

    const stored =
        readJSON(STORAGE.COMPLETED, []);


    if (Array.isArray(stored)) {

        state.completedTopics = stored;
        return;
    }


    if (
        stored &&
        typeof stored === "object"
    ) {

        state.completedTopics =
            Object.values(stored).flat();

        return;
    }


    state.completedTopics = [];
}


function topicIsCompleted(topic) {

    const name =
        typeof topic === "string"
            ? topic
            : topic.name || topic.title || topic.topic || "";

    const id =
        typeof topic === "string"
            ? topic
            : topic.id || topic.topicId || name;


    return state.completedTopics.some(item => {

        if (typeof item === "string") {

            return (
                item === name ||
                item === id
            );
        }


        if (!item || typeof item !== "object") {

            return false;
        }


        return (
            item.id === id ||
            item.topicId === id ||
            item.name === name ||
            item.topic === name ||
            item.title === name
        );
    });
}


/* =========================================================
   STREAK ACTIVITY
========================================================= */

function loadStreakActivity() {

    const stored =
        readJSON(
            STORAGE.STREAK_ACTIVITY,
            {}
        );


    /*
       Preferred format:

       {
           "2026-09-12": true,
           "2026-09-13": true
       }
    */

    if (
        stored &&
        typeof stored === "object" &&
        !Array.isArray(stored)
    ) {

        state.streakActivity = stored;

        return;
    }


    /*
       Compatibility with an array of dates.
    */

    if (Array.isArray(stored)) {

        const activity = {};

        stored.forEach(item => {

            if (typeof item === "string") {

                activity[item] = true;
            }

            if (
                item &&
                typeof item === "object"
            ) {

                const date =
                    item.date ||
                    item.day ||
                    item.completedDate;

                if (date) {

                    activity[
                        String(date).slice(0, 10)
                    ] = true;
                }
            }
        });


        state.streakActivity = activity;

        return;
    }


    state.streakActivity = {};
}


function getActivityDates() {

    const dates =
        new Set();

    Object.entries(state.streakActivity)
        .forEach(([date, value]) => {

            if (!value) return;

            dates.add(
                String(date).slice(0, 10)
            );
        });


    /*
       Some older implementations stored
       completion objects.
    */

    state.completedTopics.forEach(item => {

        if (!item || typeof item !== "object") {
            return;
        }

        const date =
            item.date ||
            item.completedAt ||
            item.completedDate;

        if (date) {

            dates.add(
                String(date).slice(0, 10)
            );
        }
    });


    return dates;
}


/* =========================================================
   STREAK CALCULATION
========================================================= */

function calculateStreaks() {

    const dates =
        getActivityDates();


    /*
       IMPORTANT:
       No activity = 0.

       Having a plan does NOT create a streak.
    */

    if (!dates.size) {

        state.currentStreak = 0;
        state.bestStreak = 0;

        return;
    }


    const sorted =
        [...dates]
            .map(date => new Date(`${date}T00:00:00`))
            .sort((a, b) => a - b);


    let best = 0;
    let run = 0;
    let previous = null;


    sorted.forEach(date => {

        if (!previous) {

            run = 1;

        } else {

            const difference =
                Math.round(
                    (
                        date - previous
                    ) /
                    86400000
                );

            if (difference === 1) {

                run++;

            } else {

                run = 1;
            }
        }


        best =
            Math.max(best, run);

        previous = date;
    });


    state.bestStreak = best;


    /*
       Current streak only exists if the most
       recent activity was today or yesterday.
    */

    const today =
        startOfDay(state.today);


    const latest =
        sorted[sorted.length - 1];


    const daysSinceLatest =
        Math.round(
            (
                today - latest
            ) /
            86400000
        );


    if (daysSinceLatest > 1) {

        state.currentStreak = 0;

        return;
    }


    let current = 1;


    for (
        let i = sorted.length - 1;
        i > 0;
        i--
    ) {

        const difference =
            Math.round(
                (
                    sorted[i] -
                    sorted[i - 1]
                ) /
                86400000
            );


        if (difference === 1) {

            current++;

        } else {

            break;
        }
    }


    state.currentStreak = current;
}


/* =========================================================
   STUDY TIME
========================================================= */

function getTodayStudyHours() {

    const key =
        todayKey();


    /*
       Preferred optional history format.
    */

    const history =
        readJSON(
            "studyMindStudyHistory",
            {}
        );


    if (
        history &&
        typeof history === "object" &&
        !Array.isArray(history)
    ) {

        const today =
            history[key];

        if (typeof today === "number") {

            return today;
        }


        if (
            today &&
            typeof today === "object"
        ) {

            return (
                Number(
                    today.hours ||
                    today.studyHours ||
                    today.minutes / 60
                ) || 0
            );
        }
    }


    /*
       If no history exists, derive time from
       completed topic records where possible.
    */

    let minutes = 0;


    state.completedTopics.forEach(item => {

        if (!item || typeof item !== "object") {
            return;
        }


        const date =
            item.date ||
            item.completedAt ||
            item.completedDate;


        if (
            date &&
            String(date).slice(0, 10) !== key
        ) {

            return;
        }


        minutes +=
            Number(
                item.minutes ||
                item.durationMinutes ||
                0
            ) || 0;
    });


    return minutes / 60;
}


function getWeeklyStudyHours() {

    const history =
        readJSON(
            "studyMindStudyHistory",
            {}
        );


    let total = 0;

    const start =
        getWeekStart(state.today);


    for (let i = 0; i < 7; i++) {

        const date =
            new Date(start);

        date.setDate(
            start.getDate() + i
        );


        const key =
            todayKey(date);


        const item =
            history?.[key];


        if (typeof item === "number") {

            total += item;

        } else if (
            item &&
            typeof item === "object"
        ) {

            total +=
                Number(
                    item.hours ||
                    item.studyHours ||
                    item.minutes / 60
                ) || 0;
        }
    }


    /*
       Include today's locally calculated
       time if history does not contain it.
    */

    const today =
        todayKey();


    if (
        !history ||
        !Object.prototype.hasOwnProperty.call(
            history,
            today
        )
    ) {

        total +=
            getTodayStudyHours();
    }


    return total;
}


/* =========================================================
   DAILY TARGETS
========================================================= */

function getDailyHoursTarget() {

    const plan =
        state.plan || {};


    const value =
        Number(
            plan.hoursPerDay ??
            plan.studyHours ??
            plan.dailyHours ??
            plan.dailyStudyHours ??
            2
        );


    return value > 0 ? value : 2;
}


function getDailyTopicTarget() {

    const topics =
        getAllPlanTopics();


    /*
       If plan explicitly provides a target,
       respect it.
    */

    const explicit =
        Number(
            state.plan?.dailyTopicGoal ??
            state.plan?.topicsPerDay ??
            state.plan?.dailyTopics
        );


    if (explicit > 0) {

        return Math.round(explicit);
    }


    if (!topics.length) return 0;


    const days =
        Number(
            state.plan?.daysLeft ??
            state.plan?.durationDays
        );


    if (days > 0) {

        return Math.max(
            1,
            Math.ceil(topics.length / days)
        );
    }


    return Math.max(
        1,
        Math.min(3, topics.length)
    );
}


function getWeeklyHoursTarget() {

    return getDailyHoursTarget() * 7;
}


/* =========================================================
   TODAY TOPICS
========================================================= */

function getTodayCompletedTopics() {

    const today =
        todayKey();


    /*
       First use explicit completion dates.
    */

    const dated =
        state.completedTopics.filter(item => {

            if (
                !item ||
                typeof item !== "object"
            ) {

                return false;
            }


            const date =
                item.date ||
                item.completedAt ||
                item.completedDate;


            return (
                date &&
                String(date).slice(0, 10) === today
            );
        });


    if (dated.length) {

        return dated.length;
    }


    /*
       If streak activity says today was active
       but individual completion dates aren't
       stored, don't falsely claim topic count.
    */

    return 0;
}


function getWeeklyCompletedTopics() {

    const start =
        getWeekStart(state.today);


    const end =
        new Date(start);

    end.setDate(
        end.getDate() + 7
    );


    const dated =
        state.completedTopics.filter(item => {

            if (
                !item ||
                typeof item !== "object"
            ) {

                return false;
            }


            const date =
                item.date ||
                item.completedAt ||
                item.completedDate;


            if (!date) return false;


            const d =
                startOfDay(
                    new Date(date)
                );


            return (
                d >= start &&
                d < end
            );
        });


    return dated.length;
}


/* =========================================================
   WEEKLY ACTIVE DAYS
========================================================= */

function getWeeklyActiveDays() {

    const dates =
        getActivityDates();

    const start =
        getWeekStart(state.today);


    let count = 0;


    for (let i = 0; i < 7; i++) {

        const date =
            new Date(start);

        date.setDate(
            start.getDate() + i
        );


        if (
            dates.has(
                todayKey(date)
            )
        ) {

            count++;
        }
    }


    return count;
}


/* =========================================================
   UPDATE STATE
========================================================= */

function calculateState() {

    const topics =
        getAllPlanTopics();


    state.totalTopics =
        topics.length;


    state.completedTotal =
        topics.filter(
            topicIsCompleted
        ).length;


    state.todayCompleted =
        getTodayCompletedTopics();


    state.todayHours =
        getTodayStudyHours();


    state.weeklyHours =
        getWeeklyStudyHours();


    state.weeklyTopics =
        getWeeklyCompletedTopics();


    state.weeklyDays =
        getWeeklyActiveDays();


    calculateStreaks();
}


/* =========================================================
   HERO
========================================================= */

function renderHero() {

    const targetHours =
        getDailyHoursTarget();

    const targetTopics =
        getDailyTopicTarget();


    const timePct =
        percent(
            state.todayHours,
            targetHours
        );


    const topicPct =
        percent(
            state.todayCompleted,
            targetTopics
        );


    const streakPct =
        percent(
            state.currentStreak,
            7
        );


    const overall =
        Math.round(
            (
                timePct +
                topicPct +
                streakPct
            ) / 3
        );


    const percentElement =
        document.getElementById(
            "overallPercent"
        );


    if (percentElement) {

        percentElement.textContent =
            `${overall}%`;
    }


    const ring =
        document.getElementById(
            "overallRing"
        );


    if (ring) {

        const degrees =
            overall * 3.6;


        ring.style.background =
            `conic-gradient(
                rgba(255,255,255,0.95) ${degrees}deg,
                rgba(255,255,255,0.16) ${degrees}deg
            )`;
    }


    const message =
        document.getElementById(
            "heroMessage"
        );


    if (!message) return;


    if (overall >= 100) {

        message.textContent =
            "Excellent work. You've completed today's goals.";

    } else if (overall >= 70) {

        message.textContent =
            "You're having a strong study day. Keep going.";

    } else if (overall >= 35) {

        message.textContent =
            "You're making progress. A little more work can move you forward.";

    } else {

        message.textContent =
            "Start with one focused study session and build from there.";
    }
}


/* =========================================================
   TODAY CARDS
========================================================= */

function renderTodayGoals() {

    const targetHours =
        getDailyHoursTarget();


    const targetTopics =
        getDailyTopicTarget();


    const timePct =
        percent(
            state.todayHours,
            targetHours
        );


    const topicPct =
        percent(
            state.todayCompleted,
            targetTopics
        );


    const streakPct =
        percent(
            state.currentStreak,
            7
        );


    setText(
        "todayHours",
        formatHours(state.todayHours)
    );


    setText(
        "targetHours",
        formatHours(targetHours)
    );


    setText(
        "todayTopics",
        state.todayCompleted
    );


    setText(
        "targetTopics",
        targetTopics
    );


    setText(
        "currentStreak",
        state.currentStreak
    );


    setText(
        "timePercent",
        `${timePct}%`
    );


    setText(
        "topicPercent",
        `${topicPct}%`
    );


    setText(
        "streakPercent",
        `${streakPct}%`
    );


    setWidth(
        "timeProgress",
        timePct
    );


    setWidth(
        "topicProgress",
        topicPct
    );


    setWidth(
        "streakProgress",
        streakPct
    );


    const timeMessage =
        document.getElementById(
            "timeMessage"
        );


    if (timeMessage) {

        if (timePct >= 100) {

            timeMessage.textContent =
                "Daily study-time goal completed.";

        } else {

            const remaining =
                Math.max(
                    0,
                    targetHours - state.todayHours
                );

            timeMessage.textContent =
                `${formatHours(remaining)} remaining today.`;
        }
    }


    const topicMessage =
        document.getElementById(
            "topicMessage"
        );


    if (topicMessage) {

        if (
            targetTopics > 0 &&
            topicPct >= 100
        ) {

            topicMessage.textContent =
                "Today's topic goal is complete.";

        } else {

            topicMessage.textContent =
                targetTopics > 0
                    ? `${Math.max(
                        0,
                        targetTopics -
                        state.todayCompleted
                    )} more topic${
                        targetTopics -
                        state.todayCompleted === 1
                            ? ""
                            : "s"
                    } to go.`
                    : "Your plan has no topic target yet.";
        }
    }


    const streakMessage =
        document.getElementById(
            "streakMessage"
        );


    if (streakMessage) {

        if (state.currentStreak === 0) {

            streakMessage.textContent =
                "Complete a topic today to start your streak.";

        } else if (state.currentStreak >= 7) {

            streakMessage.textContent =
                "Amazing consistency. You've reached a 7-day streak.";

        } else {

            streakMessage.textContent =
                `${7 - state.currentStreak} more day${
                    7 - state.currentStreak === 1
                        ? ""
                        : "s"
                } toward a 7-day streak.`;
        }
    }


    const status =
        document.getElementById(
            "todayStatus"
        );


    if (status) {

        const overall =
            Math.round(
                (
                    timePct +
                    topicPct +
                    streakPct
                ) / 3
            );


        if (overall >= 100) {

            status.textContent =
                "✓ Goals complete";

        } else if (overall >= 60) {

            status.textContent =
                "Good progress";

        } else {

            status.textContent =
                "In progress";
        }
    }
}


/* =========================================================
   WEEKLY
========================================================= */

function renderWeekly() {

    const weeklyTarget =
        getWeeklyHoursTarget();


    const hoursPct =
        percent(
            state.weeklyHours,
            weeklyTarget
        );


    const daysPct =
        percent(
            state.weeklyDays,
            7
        );


    const estimatedWeeklyTopics =
        Math.max(
            getDailyTopicTarget() * 7,
            1
        );


    const topicsPct =
        percent(
            state.weeklyTopics,
            estimatedWeeklyTopics
        );


    setText(
        "weeklyHours",
        state.weeklyHours.toFixed(
            state.weeklyHours % 1 === 0
                ? 0
                : 1
        )
    );


    setText(
        "weeklyTargetHours",
        formatHours(weeklyTarget)
    );


    setWidth(
        "weeklyHoursProgress",
        hoursPct
    );


    setText(
        "weeklyDays",
        state.weeklyDays
    );


    setText(
        "weeklyDaysTarget",
        7
    );


    setWidth(
        "weeklyDaysProgress",
        daysPct
    );


    setText(
        "weeklyTopics",
        state.weeklyTopics
    );


    setWidth(
        "weeklyTopicsProgress",
        topicsPct
    );


    const hoursMessage =
        document.getElementById(
            "weeklyHoursMessage"
        );


    if (hoursMessage) {

        if (hoursPct >= 100) {

            hoursMessage.textContent =
                "You've reached your weekly study-hour goal.";

        } else {

            hoursMessage.textContent =
                `${formatHours(
                    Math.max(
                        0,
                        weeklyTarget -
                        state.weeklyHours
                    )
                )} remaining to reach this week's target.`;
        }
    }


    const topicMessage =
        document.getElementById(
            "weeklyTopicsMessage"
        );


    if (topicMessage) {

        topicMessage.textContent =
            `${state.weeklyTopics} topic${
                state.weeklyTopics === 1
                    ? ""
                    : "s"
            } completed this week.`;
    }
}


/* =========================================================
   PLAN
========================================================= */

function renderPlan() {

    const plan =
        state.plan;


    if (!plan) {

        document.getElementById(
            "emptyPlan"
        ).hidden = false;

        return;
    }


    document.getElementById(
        "emptyPlan"
    ).hidden = true;


    const curriculum =
        plan.curriculum ||
        plan.curriculumName ||
        "";


    const examType =
        plan.examType ||
        "";


    let planName =
        plan.name ||
        plan.title ||
        "";


    if (!planName) {

        if (curriculum) {

            planName =
                `${curriculum} Study Plan`;

        } else if (examType) {

            planName =
                `${examType} Study Plan`;

        } else {

            planName =
                "My Study Plan";
        }
    }


    setText(
        "planName",
        planName
    );


    const descriptionParts = [];


    if (curriculum) {

        descriptionParts.push(
            curriculum
        );
    }


    if (examType && examType !== "No exam selected") {

        descriptionParts.push(
            examType
        );
    }


    setText(
        "planDescription",
        descriptionParts.length
            ? descriptionParts.join(" • ")
            : "Your current StudyMind plan."
    );


    const total =
        state.totalTopics;


    const completed =
        state.completedTotal;


    const planPct =
        percent(
            completed,
            total
        );


    setText(
        "planCompleted",
        completed
    );


    setText(
        "planTotal",
        total
    );


    setText(
        "planPercent",
        `${planPct}%`
    );


    setWidth(
        "planProgress",
        planPct
    );
}


/* =========================================================
   SUBJECT GOALS
========================================================= */

function renderSubjects() {

    const container =
        document.getElementById(
            "subjectGoals"
        );


    if (!container) return;


    const subjects =
        getPlanSubjects();


    if (!subjects.length) {

        container.innerHTML = `
            <div class="subject-card">
                <div class="subject-top">
                    <span class="subject-name">
                        No subjects yet
                    </span>
                </div>
                <div class="subject-count">
                    Create a study plan to track subjects.
                </div>
            </div>
        `;

        return;
    }


    container.innerHTML =
        subjects.map(subject => {

            const topics =
                subject.topics
                    .map(normalizeTopic)
                    .filter(topic => topic.name);


            const completed =
                topics.filter(
                    topicIsCompleted
                ).length;


            const pct =
                percent(
                    completed,
                    topics.length
                );


            return `
                <div class="subject-card">

                    <div class="subject-top">

                        <span class="subject-name">
                            ${escapeHTML(subject.name)}
                        </span>

                        <span class="subject-percent">
                            ${pct}%
                        </span>

                    </div>

                    <div class="subject-count">
                        ${completed}
                        of
                        ${topics.length}
                        topics completed
                    </div>

                    <div class="subject-progress">

                        <div
                            style="width:${pct}%"
                        ></div>

                    </div>

                </div>
            `;

        }).join("");
}


/* =========================================================
   ACHIEVEMENTS
========================================================= */

function renderAchievements() {

    const completed =
        state.completedTotal;


    toggleAchievement(
        "achievementFirst",
        completed >= 1
    );


    toggleAchievement(
        "achievementFive",
        completed >= 5
    );


    toggleAchievement(
        "achievementTen",
        completed >= 10
    );


    toggleAchievement(
        "achievementSeven",
        state.bestStreak >= 7
    );
}


function toggleAchievement(id, unlocked) {

    const element =
        document.getElementById(id);


    if (!element) return;


    element.classList.toggle(
        "unlocked",
        unlocked
    );
}


/* =========================================================
   DOM HELPERS
========================================================= */

function setText(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;
    }
}


function setWidth(id, percentage) {

    const element =
        document.getElementById(id);


    if (element) {

        element.style.width =
            `${clamp(
                Number(percentage) || 0,
                0,
                100
            )}%`;
    }
}


/* =========================================================
   THEME
========================================================= */

function loadTheme() {

    const saved =
        localStorage.getItem(
            STORAGE.THEME
        );


    if (
        saved === "dark" ||
        saved === "light"
    ) {

        document.body.classList.toggle(
            "dark",
            saved === "dark"
        );

        updateThemeButton();

        return;
    }


    /*
       Compatibility with common StudyMind
       theme storage.
    */

    const oldTheme =
        localStorage.getItem(
            "studyMindDarkMode"
        );


    if (
        oldTheme === "true" ||
        oldTheme === "dark"
    ) {

        document.body.classList.add("dark");
    }


    updateThemeButton();
}


function updateThemeButton() {

    const icon =
        document.getElementById(
            "themeIcon"
        );


    if (!icon) return;


    icon.textContent =
        document.body.classList.contains("dark")
            ? "☀"
            : "☾";
}


function toggleTheme() {

    const dark =
        document.body.classList.toggle("dark");


    localStorage.setItem(
        STORAGE.THEME,
        dark ? "dark" : "light"
    );


    /*
       Keep compatibility with other pages.
    */

    localStorage.setItem(
        "studyMindDarkMode",
        String(dark)
    );


    updateThemeButton();
}


/* =========================================================
   MOBILE MENU
========================================================= */

function setupMobileMenu() {

    const button =
        document.getElementById(
            "mobileMenu"
        );


    const sidebar =
        document.getElementById(
            "sidebar"
        );


    if (!button || !sidebar) return;


    button.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "open"
            );
        }
    );


    document
        .querySelectorAll(".nav-item")
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    sidebar.classList.remove(
                        "open"
                    );
                }
            );
        });
}


/* =========================================================
   STORAGE CHANGE LISTENER
========================================================= */

window.addEventListener(
    "storage",
    event => {

        const relevantKeys = [

            STORAGE.PLAN,
            STORAGE.PLANS,
            STORAGE.ACTIVE_PLAN,
            STORAGE.COMPLETED,
            STORAGE.STREAK_ACTIVITY,
            "studyMindStudyHistory"
        ];


        if (
            relevantKeys.includes(
                event.key
            )
        ) {

            refreshGoals();
        }
    }
);


/* =========================================================
   REFRESH
========================================================= */

function refreshGoals() {

    loadPlan();

    loadCompletedTopics();

    loadStreakActivity();

    calculateState();

    renderHero();

    renderTodayGoals();

    renderWeekly();

    renderPlan();

    renderSubjects();

    renderAchievements();
}


/* =========================================================
   INITIALIZATION
========================================================= */

function initializeGoals() {

    loadTheme();

    renderGreeting();

    renderDate();

    setupMobileMenu();

    refreshGoals();


    /*
       Refresh periodically so the page notices
       timer/session progress without requiring
       a full page reload.
    */

    setInterval(
        refreshGoals,
        5000
    );
}


if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeGoals
    );

} else {

    initializeGoals();
}

