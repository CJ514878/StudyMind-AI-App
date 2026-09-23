/* =========================================================
   STUDYMIND AI — GOALS
   SINGLE-SOURCE-OF-TRUTH FRONTEND
   ---------------------------------------------------------
   Goals does NOT create its own scoring/data system.

   StudyMindScore is the single source of truth for:
   - Completed topics
   - Study time
   - Streak
   - Best streak
   - Plan progress
   - Knowledge-check performance
   - AI learning activity

   Goals only converts those metrics into goal progress.
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

    STUDY_HISTORY: "studyMindStudyHistory",

    USER: "studyMindUser",

    THEME: "studyMindTheme",

    DARK_MODE: "studyMindDarkMode"
};


/* =========================================================
   STATE
========================================================= */

let state = {

    plan: null,

    metrics: null,

    completedTopics: [],

    today: new Date(),

    totalTopics: 0,

    completedTotal: 0,

    todayCompleted: 0,

    todayHours: 0,

    weeklyHours: 0,

    weeklyTopics: 0,

    weeklyDays: 0,

    currentStreak: 0,

    bestStreak: 0,

    sharedScore: 0,

    knowledgeAverage: 0,

    knowledgeCheckCount: 0
};


/* =========================================================
   HELPERS
========================================================= */

function readJSON(key, fallback = null) {

    try {

        const value =
            localStorage.getItem(key);

        if (!value) {

            return fallback;
        }

        return JSON.parse(value);

    } catch (error) {

        console.warn(
            "StudyMind Goals storage error:",
            key,
            error
        );

        return fallback;
    }
}


function todayKey(date = new Date()) {

    const y =
        date.getFullYear();

    const m =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const d =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${y}-${m}-${d}`;
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


function clamp(number, min, max) {

    return Math.min(
        Math.max(
            Number(number) || 0,
            min
        ),
        max
    );
}


function percent(value, target) {

    if (
        !target ||
        Number(target) <= 0
    ) {

        return 0;
    }

    return Math.round(
        clamp(
            (
                Number(value) /
                Number(target)
            ) * 100,
            0,
            100
        )
    );
}


function formatHours(hours) {

    const value =
        Number(hours) || 0;


    if (value < 1) {

        return `${Math.round(value * 60)}m`;
    }


    if (Number.isInteger(value)) {

        return `${value}h`;
    }


    return `${value.toFixed(1)}h`;
}


function escapeHTML(value) {

    return String(value ?? "")

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );
}


function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value;
    }
}


function setWidth(id, value) {

    const element =
        document.getElementById(id);

    if (!element) return;


    element.style.width =
        `${clamp(
            value,
            0,
            100
        )}%`;
}


/* =========================================================
   PLAN LOADING
========================================================= */

function loadPlan() {

    let plan =
        readJSON(
            STORAGE.PLAN,
            null
        );


    /*
       Multi-plan system.

       Always prefer the active plan.
    */

    const plans =
        readJSON(
            STORAGE.PLANS,
            null
        );


    const activeId =
        localStorage.getItem(
            STORAGE.ACTIVE_PLAN
        );


    if (
        Array.isArray(plans) &&
        plans.length
    ) {

        let activePlan = null;


        if (activeId) {

            activePlan =
                plans.find(
                    item =>
                        String(item.id) ===
                        String(activeId)
                );
        }


        if (!activePlan) {

            activePlan =
                plans[0];
        }


        if (activePlan) {

            plan =
                activePlan;
        }
    }


    state.plan =
        plan;


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


    if (
        !topic ||
        typeof topic !== "object"
    ) {

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

    const plan =
        state.plan;


    if (!plan) {

        return [];
    }


    /*
       Standard StudyMind format.
    */

    if (
        Array.isArray(plan.subjects)
    ) {

        return plan.subjects.map(
            subject => {

                if (
                    typeof subject ===
                    "string"
                ) {

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
                        Array.isArray(
                            subject.topics
                        )
                            ? subject.topics
                            : []

                };

            }
        );
    }


    /*
       Compatibility format.
    */

    if (
        Array.isArray(
            plan.subjectNames
        )
    ) {

        return plan.subjectNames.map(
            name => ({

                name: String(name),

                topics: []

            })
        );
    }


    return [];
}


function getAllPlanTopics() {

    const subjects =
        getPlanSubjects();


    const result = [];


    subjects.forEach(
        subject => {

            subject.topics.forEach(
                topic => {

                    const normalized =
                        normalizeTopic(
                            topic
                        );


                    if (
                        !normalized.name
                    ) {

                        return;
                    }


                    result.push({

                        ...normalized,

                        subject:
                            subject.name

                    });

                }
            );

        }
    );


    /*
       Compatibility with flat topics.
    */

    if (
        !result.length &&
        Array.isArray(
            state.plan?.topics
        )
    ) {

        state.plan.topics.forEach(
            topic => {

                const normalized =
                    normalizeTopic(
                        topic
                    );


                if (
                    !normalized.name
                ) {

                    return;
                }


                result.push({

                    ...normalized,

                    subject:
                        typeof topic ===
                        "object"
                            ? (
                                topic.subject ||
                                "General"
                            )
                            : "General"

                });

            }
        );
    }


    return result;
}


/* =========================================================
   COMPLETED TOPICS
   ---------------------------------------------------------
   Goals reads the same completion data as Score.
========================================================= */

function loadCompletedTopics() {

    const stored =
        readJSON(
            STORAGE.COMPLETED,
            []
        );


    if (
        Array.isArray(stored)
    ) {

        state.completedTopics =
            stored;

        return;
    }


    if (
        stored &&
        typeof stored === "object"
    ) {

        state.completedTopics =
            Object.values(
                stored
            ).flat();

        return;
    }


    state.completedTopics =
        [];
}


function topicIsCompleted(topic) {

    const normalized =
        normalizeTopic(topic);


    return state.completedTopics.some(
        item => {

            if (
                typeof item ===
                "string"
            ) {

                return (
                    item ===
                    normalized.name ||

                    item ===
                    normalized.id
                );
            }


            if (
                !item ||
                typeof item !==
                "object"
            ) {

                return false;
            }


            return (

                item.id ===
                normalized.id ||

                item.topicId ===
                normalized.id ||

                item.name ===
                normalized.name ||

                item.topic ===
                normalized.name ||

                item.title ===
                normalized.name

            );
        }
    );
}


/* =========================================================
   SHARED SCORE ENGINE
========================================================= */

function getSharedScoreData() {

    /*
       StudyMindScore MUST be the source of truth.

       getMetrics() is preferred because it exposes
       all shared study data.

       calculate() remains as a compatibility fallback.
    */

    if (
        window.StudyMindScore &&
        typeof
        window.StudyMindScore.getMetrics ===
        "function"
    ) {

        return (
            window.StudyMindScore.getMetrics()
        );
    }


    if (
        window.StudyMindScore &&
        typeof
        window.StudyMindScore.calculate ===
        "function"
    ) {

        const score =
            window.StudyMindScore.calculate();


        return {

            total:
                Number(
                    score.total
                ) || 0,

            completedTopics:
                Number(
                    score.completedTopics
                ) || 0,

            totalTopics:
                Number(
                    score.totalTopics
                ) || 0,

            todayCompletedTopics:
                Number(
                    score.todayCompletedTopics
                ) || 0,

            weeklyCompletedTopics:
                Number(
                    score.weeklyCompletedTopics
                ) || 0,

            todayMinutes:
                Number(
                    score.todayMinutes
                ) || 0,

            weeklyMinutes:
                Number(
                    score.weeklyMinutes
                ) || 0,

            currentStreak:
                Number(
                    score.currentStreak
                ) || 0,

            bestStreak:
                Number(
                    score.bestStreak
                ) || 0,

            planProgress:
                Number(
                    score.planProgress
                ) || 0,

            knowledgeCheckCount:
                Number(
                    score.knowledgeCheckCount
                ) || 0,

            knowledgeAverage:
                Number(
                    score.knowledgeAverage
                ) || 0

        };
    }


    /*
       Score engine has not loaded yet.

       Do NOT create a second scoring system here.
    */

    return {

        total: 0,

        completedTopics: 0,

        totalTopics: 0,

        todayCompletedTopics: 0,

        weeklyCompletedTopics: 0,

        todayMinutes: 0,

        weeklyMinutes: 0,

        currentStreak: 0,

        bestStreak: 0,

        planProgress: 0,

        knowledgeCheckCount: 0,

        knowledgeAverage: 0

    };
}


/* =========================================================
   UPDATE STATE FROM SCORE ENGINE
========================================================= */

function calculateState() {

    /*
       Get the SINGLE shared metrics object.
    */

    const metrics =
        getSharedScoreData();


    state.metrics =
        metrics;


    /*
       Plan/topic information.

       Prefer Score's canonical values.
    */

    const localPlanTopics =
        getAllPlanTopics();


    state.totalTopics =
        Number(
            metrics.totalTopics
        );


    if (
        !state.totalTopics &&
        localPlanTopics.length
    ) {

        /*
           This is only a compatibility fallback
           for an older Score engine.
        */

        state.totalTopics =
            localPlanTopics.length;
    }


    state.completedTotal =
        Number(
            metrics.completedTopics
        );


    if (
        !state.completedTotal &&
        state.completedTopics.length
    ) {

        /*
           Compatibility fallback only.
        */

        state.completedTotal =
            localPlanTopics.filter(
                topicIsCompleted
            ).length;
    }


    /*
       TODAY
    */

    state.todayCompleted =
        Number(
            metrics.todayCompletedTopics
        ) || 0;


    state.todayHours =
        (
            Number(
                metrics.todayMinutes
            ) || 0
        ) / 60;


    /*
       WEEK
    */

    state.weeklyHours =
        (
            Number(
                metrics.weeklyMinutes
            ) || 0
        ) / 60;


    state.weeklyTopics =
        Number(
            metrics.weeklyCompletedTopics
        ) || 0;


    state.weeklyDays =
        Number(
            metrics.weeklyActiveDays
        ) || 0;


    /*
       STREAK

       These values come directly from Score.
    */

    state.currentStreak =
        Number(
            metrics.currentStreak
        ) || 0;


    state.bestStreak =
        Number(
            metrics.bestStreak
        ) || 0;


    /*
       SCORE
    */

    state.sharedScore =
        Number(
            metrics.total
        ) || 0;


    /*
       KNOWLEDGE CHECKS
    */

    state.knowledgeAverage =
        Number(
            metrics.knowledgeAverage
        ) || 0;


    state.knowledgeCheckCount =
        Number(
            metrics.knowledgeCheckCount
        ) || 0;
}


/* =========================================================
   DATE
========================================================= */

function getWeekStart(date) {

    const result =
        startOfDay(date);


    const day =
        result.getDay();


    const difference =
        day === 0
            ? -6
            : 1 - day;


    result.setDate(
        result.getDate() +
        difference
    );


    return result;
}


function renderDate() {

    const dateElement =
        document.getElementById(
            "todayDate"
        );


    const rangeElement =
        document.getElementById(
            "weekRange"
        );


    if (dateElement) {

        dateElement.textContent =
            new Intl.DateTimeFormat(
                undefined,
                {

                    weekday: "short",

                    month: "short",

                    day: "numeric"

                }
            ).format(
                state.today
            );
    }


    if (rangeElement) {

        const start =
            getWeekStart(
                state.today
            );


        const end =
            new Date(start);


        end.setDate(
            end.getDate() + 6
        );


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


/* =========================================================
   GREETING
========================================================= */

function renderGreeting() {

    const hour =
        new Date().getHours();


    let greeting =
        "Good morning";


    if (
        hour >= 12 &&
        hour < 18
    ) {

        greeting =
            "Good afternoon";

    } else if (
        hour >= 18
    ) {

        greeting =
            "Good evening";
    }


    setText(
        "greeting",
        greeting
    );


    let name =
        "";


    const user =
        readJSON(
            STORAGE.USER,
            null
        );


    if (user) {

        name =
            user.name ||
            user.fullName ||
            user.username ||
            "";
    }


    if (!name) {

        name =
            localStorage.getItem(
                "studyMindUserName"
            ) ||
            localStorage.getItem(
                "username"
            ) ||
            "";
    }


    const nameElement =
        document.getElementById(
            "userName"
        );


    if (
        nameElement &&
        name
    ) {

        nameElement.textContent =
            `, ${name}`;
    }
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


    return value > 0
        ? value
        : 2;
}


function getDailyTopicTarget() {

    const explicit =
        Number(
            state.plan?.dailyTopicGoal ??
            state.plan?.topicsPerDay ??
            state.plan?.dailyTopics
        );


    if (explicit > 0) {

        return Math.round(
            explicit
        );
    }


    const topics =
        state.totalTopics;


    if (!topics) {

        return 0;
    }


    const days =
        Number(
            state.plan?.daysLeft ??
            state.plan?.durationDays
        );


    if (days > 0) {

        return Math.max(
            1,
            Math.ceil(
                topics / days
            )
        );
    }


    return Math.max(
        1,
        Math.min(
            3,
            topics
        )
    );
}


function getWeeklyHoursTarget() {

    return (
        getDailyHoursTarget() *
        7
    );
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


    setText(
        "overallPercent",
        `${overall}%`
    );


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
   TODAY GOALS
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
        formatHours(
            state.todayHours
        )
    );


    setText(
        "targetHours",
        formatHours(
            targetHours
        )
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

        if (
            timePct >= 100
        ) {

            timeMessage.textContent =
                "Daily study-time goal completed.";

        } else {

            const remaining =
                Math.max(
                    0,
                    targetHours -
                    state.todayHours
                );


            timeMessage.textContent =
                `${formatHours(
                    remaining
                )} remaining today.`;
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

            const remaining =
                Math.max(
                    0,
                    targetTopics -
                    state.todayCompleted
                );


            topicMessage.textContent =
                targetTopics > 0
                    ? `${remaining} more topic${
                        remaining === 1
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

        if (
            state.currentStreak === 0
        ) {

            streakMessage.textContent =
                "Complete a study session today to start your streak.";

        } else if (
            state.currentStreak >= 7
        ) {

            streakMessage.textContent =
                "Amazing consistency. You've reached a 7-day streak.";

        } else {

            const remaining =
                7 -
                state.currentStreak;


            streakMessage.textContent =
                `${remaining} more day${
                    remaining === 1
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


        if (
            overall >= 100
        ) {

            status.textContent =
                "✓ Goals complete";

        } else if (
            overall >= 60
        ) {

            status.textContent =
                "Good progress";

        } else {

            status.textContent =
                "In progress";
        }
    }
}


/* =========================================================
   WEEKLY GOALS
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
            getDailyTopicTarget() *
            7,
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
        formatHours(
            weeklyTarget
        )
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

        if (
            hoursPct >= 100
        ) {

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


    const emptyPlan =
        document.getElementById(
            "emptyPlan"
        );


    if (!plan) {

        if (emptyPlan) {

            emptyPlan.hidden =
                false;
        }

        return;
    }


    if (emptyPlan) {

        emptyPlan.hidden =
            true;
    }


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


    const descriptionParts =
        [];


    if (curriculum) {

        descriptionParts.push(
            curriculum
        );
    }


    if (
        examType &&
        examType !==
        "No exam selected"
    ) {

        descriptionParts.push(
            examType
        );
    }


    setText(
        "planDescription",

        descriptionParts.length
            ? descriptionParts.join(
                " • "
            )
            : "Your current StudyMind plan."
    );


    const total =
        state.totalTopics;


    const completed =
        state.completedTotal;


    /*
       Prefer the canonical Score
       plan progress.
    */

    const planPct =
        Number(
            state.metrics?.planProgress
        ) || percent(
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
        subjects.map(
            subject => {

                const topics =
                    subject.topics

                        .map(
                            normalizeTopic
                        )

                        .filter(
                            topic =>
                                topic.name
                        );


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
                                ${escapeHTML(
                                    subject.name
                                )}
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

            }
        ).join("");
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


function toggleAchievement(
    id,
    unlocked
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) return;


    element.classList.toggle(
        "unlocked",
        Boolean(unlocked)
    );
}


/* =========================================================
   SHARED SCORE DISPLAY
========================================================= */

function renderSharedScore() {

    const metrics =
        state.metrics ||
        getSharedScoreData();


    setText(
        "studyScore",
        Number(
            metrics.total
        ) || 0
    );


    setText(
        "goalStudyScore",
        Number(
            metrics.total
        ) || 0
    );


    setText(
        "goalKnowledgeAverage",
        `${Number(
            metrics.knowledgeAverage
        ) || 0}%`
    );


    setText(
        "goalKnowledgeChecks",
        Number(
            metrics.knowledgeCheckCount
        ) || 0
    );


    setText(
        "goalPlanProgress",
        `${Number(
            metrics.planProgress
        ) || 0}%`
    );
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


    const oldTheme =
        localStorage.getItem(
            STORAGE.DARK_MODE
        );


    if (
        oldTheme === "true" ||
        oldTheme === "dark"
    ) {

        document.body.classList.add(
            "dark"
        );

    } else {

        document.body.classList.remove(
            "dark"
        );
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
        document.body.classList.contains(
            "dark"
        )
            ? "☀"
            : "☾";
}


/*
   Named differently internally so Goals
   doesn't fight with another page's
   global toggleTheme().
*/

function goalsToggleTheme() {

    const dark =
        document.body.classList.toggle(
            "dark"
        );


    localStorage.setItem(
        STORAGE.THEME,
        dark
            ? "dark"
            : "light"
    );


    localStorage.setItem(
        STORAGE.DARK_MODE,
        String(dark)
    );


    updateThemeButton();
}


/*
   Preserve existing HTML such as:

   onclick="toggleTheme()"

   without overwriting another StudyMind
   theme function if one already exists.
*/

if (
    typeof window.toggleTheme !==
    "function"
) {

    window.toggleTheme =
        goalsToggleTheme;
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


    if (
        !button ||
        !sidebar
    ) {

        return;
    }


    button.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "open"
            );

        }
    );


    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    () => {

                        sidebar.classList.remove(
                            "open"
                        );

                    }
                );

            }
        );
}


/* =========================================================
   REFRESH EVENTS
   ---------------------------------------------------------
   Goals listens to the same events generated
   by the timer/session/knowledge-check systems.
========================================================= */

const GOALS_REFRESH_EVENTS = [

    "studyMindScoreUpdated",

    "studyMindStreakUpdated",

    "studyMindTimerCompleted",

    "studyMindStudyTimeUpdated",

    "studyMindKnowledgeCheckCompleted",

    "studyMindPlanUpdated",

    "studyMindPlanCreated",

    "studyMindPlanChanged",

    "studyMindCompletedTopicsUpdated",

    "studyMindAIUsageUpdated"

];


GOALS_REFRESH_EVENTS.forEach(
    eventName => {

        window.addEventListener(
            eventName,
            () => {

                refreshGoals();

            }
        );

    }
);


/* =========================================================
   STORAGE LISTENER
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

            STORAGE.STUDY_HISTORY,

            "studyMindDailyStudyTime",

            "studyMindStudySessions",

            "studyMindKnowledgeCheckResults",

            "studyMindCompletedQuestionTopics",

            "studyMindStudyScore"

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

    /*
       Always reload the active plan.
    */

    loadPlan();


    /*
       Completion data is only used for
       compatibility/subject rendering.

       Score remains the canonical metric source.
    */

    loadCompletedTopics();


    /*
       Pull everything from Score.
    */

    calculateState();


    renderDate();

    renderHero();

    renderTodayGoals();

    renderWeekly();

    renderPlan();

    renderSubjects();

    renderAchievements();

    renderSharedScore();
}


/* =========================================================
   INITIALIZATION
========================================================= */

function initializeGoals() {

    loadTheme();

    renderGreeting();

    setupMobileMenu();

    refreshGoals();


    /*
       This is only a UI refresh.

       It does NOT create XP,
       streaks, study sessions,
       completed topics,
       or score.

       Therefore opening Goals cannot
       accidentally award progress.
    */

    setInterval(
        refreshGoals,
        5000
    );
}


/* =========================================================
   START
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeGoals
    );

} else {

    initializeGoals();

}
