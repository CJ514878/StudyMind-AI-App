/* =========================================================
   STUDYMIND AI — STUDY STREAK ENGINE
   COMPLETE REPLACEMENT
   ========================================================= */

"use strict";


/* =========================================================
   STORAGE
========================================================= */

const STREAK_KEYS = {

    ACTIVITY:
        "studyMindStreakActivity",

    COMPLETED:
        "studyMindCompletedTopics",

    LONGEST:
        "studyMindLongestStreak",

    CURRENT:
        "studyMindStreak",

    LAST_COMPLETED:
        "studyMindLastCompletedPlanDate",

    PLAN:
        "studyMindPlan",

    USERNAME:
        "studyMindUsername",

    THEME:
        "studyMindTheme"

};


/* =========================================================
   STATE
========================================================= */

let calendarDate = new Date();

let activity = {};

let previousCurrentStreak = 0;


/* =========================================================
   HELPERS
========================================================= */

function $(id) {
    return document.getElementById(id);
}


function todayKey() {

    return formatDate(
        new Date()
    );

}


function formatDate(date) {

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


function parseDate(key) {

    const parts =
        key.split("-").map(Number);

    return new Date(
        parts[0],
        parts[1] - 1,
        parts[2]
    );

}


function startOfDay(date) {

    const copy =
        new Date(date);

    copy.setHours(
        0,
        0,
        0,
        0
    );

    return copy;

}


function loadJSON(key, fallback) {

    try {

        const value =
            localStorage.getItem(key);

        if (!value) {
            return fallback;
        }

        return JSON.parse(value);

    } catch {

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
            "StudyMind: Could not save streak data:",
            error
        );

    }

}


/* =========================================================
   PLAN
========================================================= */

function getStudyPlan() {

    return loadJSON(
        STREAK_KEYS.PLAN,
        null
    );

}


/* =========================================================
   NORMALIZE COMPLETED TOPICS
========================================================= */

function getCompletedTopicKeys() {

    const stored =
        loadJSON(
            STREAK_KEYS.COMPLETED,
            []
        );


    if (!Array.isArray(stored)) {
        return new Set();
    }


    const completed =
        new Set();


    stored.forEach(item => {

        if (
            typeof item === "string"
        ) {

            const value =
                item.trim();

            if (!value) return;

            completed.add(value);


            /*
               Support:
               Subject::Topic
            */

            if (
                value.includes("::")
            ) {

                const parts =
                    value.split("::");

                const topic =
                    parts
                        .slice(1)
                        .join("::")
                        .trim();

                if (topic) {
                    completed.add(topic);
                }

            }

            return;

        }


        if (
            item &&
            typeof item === "object"
        ) {

            const subject =
                String(
                    item.subject ||
                    item.subjectName ||
                    ""
                ).trim();

            const topic =
                String(
                    item.topic ||
                    item.name ||
                    item.title ||
                    ""
                ).trim();


            if (topic) {
                completed.add(topic);
            }


            if (
                subject &&
                topic
            ) {

                completed.add(
                    `${subject}::${topic}`
                );

            }

        }

    });


    return completed;

}


/* =========================================================
   GET ALL PLAN TOPICS
========================================================= */

function getAllStudyTopics() {

    const plan =
        getStudyPlan();


    if (!plan) {
        return [];
    }


    const topics = [];


    /*
       Flat topics
    */

    if (
        Array.isArray(
            plan.topics
        )
    ) {

        plan.topics.forEach(
            (topic, index) => {

                if (
                    typeof topic === "string"
                ) {

                    topics.push({
                        id:
                            String(index + 1),

                        subject:
                            "",

                        name:
                            topic
                    });

                } else if (
                    topic &&
                    typeof topic === "object"
                ) {

                    topics.push({
                        id:
                            String(
                                topic.id ||
                                index + 1
                            ),

                        subject:
                            String(
                                topic.subject ||
                                topic.subjectName ||
                                ""
                            ).trim(),

                        name:
                            String(
                                topic.name ||
                                topic.topic ||
                                topic.title ||
                                ""
                            ).trim()
                    });

                }

            }
        );

    }


    /*
       Subject-based plan
    */

    if (
        Array.isArray(
            plan.subjects
        )
    ) {

        plan.subjects.forEach(
            subject => {

                if (!subject) return;


                const subjectName =
                    String(
                        subject.name ||
                        subject.subject ||
                        subject.subjectName ||
                        ""
                    ).trim();


                if (
                    !Array.isArray(
                        subject.topics
                    )
                ) {
                    return;
                }


                subject.topics.forEach(
                    (topic, index) => {

                        if (
                            typeof topic === "string"
                        ) {

                            topics.push({

                                id:
                                    `${subjectName}-${index + 1}`,

                                subject:
                                    subjectName,

                                name:
                                    topic.trim()

                            });

                        } else if (
                            topic &&
                            typeof topic === "object"
                        ) {

                            topics.push({

                                id:
                                    String(
                                        topic.id ||
                                        `${subjectName}-${index + 1}`
                                    ),

                                subject:
                                    String(
                                        topic.subject ||
                                        subjectName
                                    ).trim(),

                                name:
                                    String(
                                        topic.name ||
                                        topic.topic ||
                                        topic.title ||
                                        ""
                                    ).trim()

                            });

                        }

                    }
                );

            }
        );

    }


    /*
       Remove duplicates
    */

    const unique = [];

    const seen = new Set();


    topics.forEach(topic => {

        if (!topic.name) return;


        const key =
            topic.subject
                ? `${topic.subject}::${topic.name}`
                : topic.name;


        if (
            seen.has(key)
        ) {
            return;
        }


        seen.add(key);

        unique.push({
            ...topic,
            key
        });

    });


    return unique;

}


/* =========================================================
   GET TODAY'S SCHEDULE
========================================================= */

function getTodaySchedule() {

    const plan =
        getStudyPlan();


    if (!plan) {
        return [];
    }


    const today =
        todayKey();


    /*
       Current StudyMind schedule format:
       plan.schedule = [
           {
               date,
               dayType,
               sessions: [...]
           }
       ]
    */

    if (
        Array.isArray(
            plan.schedule
        )
    ) {

        const day =
            plan.schedule.find(
                item =>
                    String(
                        item?.date || ""
                    ).slice(0, 10) === today
            );


        if (
            !day ||
            !Array.isArray(
                day.sessions
            )
        ) {

            return [];

        }


        return day.sessions.filter(
            session => {

                if (!session) {
                    return false;
                }


                const type =
                    String(
                        session.type ||
                        ""
                    ).toLowerCase();


                /*
                   Breaks and rest sessions
                   are not required study topics.
                */

                if (
                    type === "break" ||
                    type === "rest" ||
                    type === "breakday" ||
                    type === "restday"
                ) {

                    return false;

                }


                return Boolean(
                    session.topic ||
                    session.name
                );

            }
        );

    }


    return [];

}


/* =========================================================
   GET TODAY'S REQUIRED TOPICS
========================================================= */

function getTodaysRequiredTopics() {

    const sessions =
        getTodaySchedule();


    const topics = [];


    sessions.forEach(
        session => {

            const subject =
                String(
                    session.subject ||
                    session.subjectName ||
                    ""
                ).trim();


            const topic =
                String(
                    session.topic ||
                    session.name ||
                    session.title ||
                    ""
                ).trim();


            if (!topic) {
                return;
            }


            topics.push({

                subject,

                name:
                    topic,

                key:
                    subject
                        ? `${subject}::${topic}`
                        : topic

            });

        }
    );


    /*
       Remove duplicates
    */

    const unique = [];

    const seen = new Set();


    topics.forEach(topic => {

        if (
            seen.has(topic.key)
        ) {
            return;
        }


        seen.add(topic.key);

        unique.push(topic);

    });


    return unique;

}


/* =========================================================
   CHECK TODAY'S COMPLETION
========================================================= */

function checkTodayCompletion() {

    const required =
        getTodaysRequiredTopics();


    /*
       If the schedule exists but today has
       no study topics, do not automatically
       award a streak day.
    */

    if (!required.length) {

        console.log(
            "StudyMind streak: no required study topics scheduled today."
        );

        return false;

    }


    const completed =
        getCompletedTopicKeys();


    let completedCount = 0;


    required.forEach(topic => {

        const matches =
            completed.has(topic.key) ||
            completed.has(topic.name);


        if (matches) {
            completedCount++;
        }

    });


    const total =
        required.length;


    const progress =
        Math.round(
            (completedCount / total) * 100
        );


    console.log(
        "StudyMind daily completion:",
        {
            completedCount,
            total,
            progress,
            requiredTopics: required,
            completedTopics: [...completed]
        }
    );


    if (
        completedCount < total
    ) {

        return false;

    }


    /*
       Today is fully completed.
    */

    recordCompletedStudyDay();

    return true;

}


/* =========================================================
   RECORD COMPLETED STUDY DAY
========================================================= */

function recordCompletedStudyDay() {

    loadActivity();


    const key =
        todayKey();


    /*
       Prevent duplicate recording.
    */

    if (
        activity[key] === true
    ) {

        recalculateStreaks();

        return false;

    }


    activity[key] = true;


    saveJSON(
        STREAK_KEYS.ACTIVITY,
        activity
    );


    localStorage.setItem(
        STREAK_KEYS.LAST_COMPLETED,
        key
    );


    const result =
        recalculateStreaks();


    console.log(
        "StudyMind: study day completed.",
        result
    );


    /*
       Refresh UI.
    */

    refreshPageData();


    /*
       Celebration only happens when
       the streak actually increases.
    */

    showDailyCompletionCelebration(
        result.current
    );


    return true;

}


/* =========================================================
   PUBLIC ACTIVITY ENGINE
========================================================= */

/*
   Kept for compatibility with the Study Session page.

   IMPORTANT:
   It no longer immediately marks a day
   as complete.

   Instead it checks whether ALL topics
   scheduled for today are complete.
*/

function recordStudyActivity() {

    return checkTodayCompletion();

}


/* =========================================================
   RECALCULATE CURRENT STREAK
========================================================= */

function calculateCurrentStreak() {

    const today =
        startOfDay(
            new Date()
        );


    let cursor =
        new Date(today);


    let count = 0;


    /*
       If today is not complete,
       continue checking from yesterday.
    */

    if (
        !hasActivity(cursor)
    ) {

        cursor.setDate(
            cursor.getDate() - 1
        );

    }


    while (
        hasActivity(cursor)
    ) {

        count++;


        cursor.setDate(
            cursor.getDate() - 1
        );

    }


    return count;

}


function hasActivity(date) {

    return activity[
        formatDate(date)
    ] === true;

}


/* =========================================================
   LONGEST STREAK
========================================================= */

function calculateLongestStreak() {

    const dates =
        Object.keys(activity)
            .filter(
                key =>
                    activity[key] === true
            )
            .sort();


    if (!dates.length) {
        return 0;
    }


    let longest = 1;

    let current = 1;


    for (
        let i = 1;
        i < dates.length;
        i++
    ) {

        const previous =
            parseDate(
                dates[i - 1]
            );


        const currentDate =
            parseDate(
                dates[i]
            );


        const difference =
            Math.round(
                (
                    startOfDay(currentDate)
                    -
                    startOfDay(previous)
                )
                /
                86400000
            );


        if (
            difference === 1
        ) {

            current++;

        } else {

            current = 1;

        }


        longest =
            Math.max(
                longest,
                current
            );

    }


    return longest;

}


/* =========================================================
   RECALCULATE STREAKS
========================================================= */

function recalculateStreaks() {

    const current =
        calculateCurrentStreak();


    const longest =
        calculateLongestStreak();


    localStorage.setItem(
        STREAK_KEYS.CURRENT,
        String(current)
    );


    localStorage.setItem(
        STREAK_KEYS.LONGEST,
        String(longest)
    );


    return {
        current,
        longest
    };

}


/* =========================================================
   TOPIC COUNT
========================================================= */

function getCompletedTopicCount() {

    const completed =
        loadJSON(
            STREAK_KEYS.COMPLETED,
            []
        );


    if (
        !Array.isArray(completed)
    ) {

        return 0;

    }


    return completed.length;

}


/* =========================================================
   TOTAL STUDY DAYS
========================================================= */

function getStudyDayCount() {

    return Object.keys(activity)
        .filter(
            key =>
                activity[key] === true
        )
        .length;

}


/* =========================================================
   WEEK INFORMATION
========================================================= */

function getMonday(date) {

    const result =
        startOfDay(date);


    const day =
        result.getDay();


    const difference =
        day === 0
            ? -6
            : 1 - day;


    result.setDate(
        result.getDate() + difference
    );


    return result;

}


function getCurrentWeek() {

    const monday =
        getMonday(
            new Date()
        );


    const days = [];


    for (
        let i = 0;
        i < 7;
        i++
    ) {

        const date =
            new Date(monday);


        date.setDate(
            monday.getDate() + i
        );


        days.push(date);

    }


    return days;

}


function getWeeklyStudyDays() {

    return getCurrentWeek()
        .filter(
            date =>
                hasActivity(date)
        )
        .length;

}


function getBestWeek() {

    const dates =
        Object.keys(activity)
            .filter(
                key =>
                    activity[key]
            )
            .sort();


    if (!dates.length) {
        return 0;
    }


    const weeks = {};


    dates.forEach(key => {

        const date =
            parseDate(key);


        const monday =
            getMonday(date);


        const weekKey =
            formatDate(monday);


        weeks[weekKey] =
            (weeks[weekKey] || 0) + 1;

    });


    return Math.max(
        0,
        ...Object.values(weeks)
    );

}


/* =========================================================
   USER
========================================================= */

function loadUser() {

    const name =
        localStorage.getItem(
            STREAK_KEYS.USERNAME
        )
        || "Student";


    if (
        $("usernameDisplay")
    ) {

        $("usernameDisplay")
            .textContent =
            name;

    }


    if (
        $("userAvatar")
    ) {

        $("userAvatar")
            .textContent =
            name
                .charAt(0)
                .toUpperCase();

    }

}


/* =========================================================
   HERO
========================================================= */

function renderHero() {

    const result =
        recalculateStreaks();


    const current =
        result.current;


    const longest =
        result.longest;


    if (
        $("currentStreak")
    ) {

        $("currentStreak")
            .textContent =
            current;

    }


    if (
        $("bestStreak")
    ) {

        $("bestStreak")
            .textContent =
            `${longest} day${longest === 1 ? "" : "s"}`;

    }


    if (
        $("totalStudyDays")
    ) {

        $("totalStudyDays")
            .textContent =
            getStudyDayCount();

    }


    let message;


    if (
        current === 0
    ) {

        message =
            "Complete all of today's assigned topics to start your streak.";

    } else if (
        current === 1
    ) {

        message =
            "Great start. Complete tomorrow's topics to make it 2 days!";

    } else if (
        current < 7
    ) {

        message =
            `You're on a ${current}-day streak. Keep the momentum going!`;

    } else if (
        current < 30
    ) {

        message =
            `${current} days strong. You're building a serious habit!`;

    } else {

        message =
            `${current} days! That's incredible consistency.`;

    }


    if (
        $("streakMessage")
    ) {

        $("streakMessage")
            .textContent =
            message;

    }

}


/* =========================================================
   STATS
========================================================= */

function renderStats() {

    const topics =
        getCompletedTopicCount();


    const weekly =
        getWeeklyStudyDays();


    const consistency =
        Math.round(
            (weekly / 7) * 100
        );


    const bestWeek =
        getBestWeek();


    if (
        $("topicsCompleted")
    ) {

        $("topicsCompleted")
            .textContent =
            topics;

    }


    if (
        $("weeklyDays")
    ) {

        $("weeklyDays")
            .textContent =
            `${weekly} / 7`;

    }


    if (
        $("weeklyConsistency")
    ) {

        $("weeklyConsistency")
            .textContent =
            `${consistency}%`;

    }


    if (
        $("bestWeek")
    ) {

        $("bestWeek")
            .textContent =
            `${bestWeek} day${bestWeek === 1 ? "" : "s"}`;

    }

}


/* =========================================================
   TODAY
========================================================= */

function renderToday() {

    const today =
        todayKey();


    const studied =
        activity[today] === true;


    const progress =
        studied
            ? 100
            : calculateTodayProgress();


    if (
        $("todayProgress")
    ) {

        $("todayProgress")
            .style.width =
            `${progress}%`;

    }


    if (
        $("todayIcon")
    ) {

        $("todayIcon")
            .textContent =
            studied
                ? "✓"
                : "○";


        $("todayIcon")
            .classList.toggle(
                "complete",
                studied
            );

    }


    if (
        $("todayStatus")
    ) {

        if (studied) {

            $("todayStatus")
                .innerHTML =
                `
                    <strong>Study day complete ✓</strong>
                    <span>
                        You've completed all of today's assigned topics.
                        Your streak is protected.
                    </span>
                `;

        } else {

            const progressData =
                getTodayProgressData();


            if (
                progressData.total === 0
            ) {

                $("todayStatus")
                    .innerHTML =
                    `
                        <strong>No study schedule today</strong>
                        <span>
                            There are no required study topics scheduled for today.
                        </span>
                    `;

            } else {

                $("todayStatus")
                    .innerHTML =
                    `
                        <strong>
                            ${progressData.completed}
                            / 
                            ${progressData.total}
                            topics completed
                        </strong>
                        <span>
                            Complete every assigned topic to protect your streak.
                        </span>
                    `;

            }

        }

    }


    if (
        $("todayCaption")
    ) {

        $("todayCaption")
            .textContent =
            studied
                ? "Today's study requirements are complete ✓"
                : `${calculateTodayProgress()}% of today's study requirements completed`;

    }


    renderMotivation(
        studied
    );

}


/* =========================================================
   TODAY PROGRESS
========================================================= */

function getTodayProgressData() {

    const required =
        getTodaysRequiredTopics();


    const completed =
        getCompletedTopicKeys();


    let completedCount = 0;


    required.forEach(topic => {

        if (
            completed.has(topic.key) ||
            completed.has(topic.name)
        ) {

            completedCount++;

        }

    });


    return {

        completed:
            completedCount,

        total:
            required.length

    };

}


function calculateTodayProgress() {

    const data =
        getTodayProgressData();


    if (
        data.total === 0
    ) {

        return 0;

    }


    return Math.round(
        (
            data.completed /
            data.total
        ) * 100
    );

}


/* =========================================================
   MOTIVATION
========================================================= */

function renderMotivation(studied) {

    const current =
        Number(
            localStorage.getItem(
                STREAK_KEYS.CURRENT
            )
        ) || 0;


    let title;

    let text;


    if (studied) {

        title =
            "Streak protected 🔥";


        text =
            "Excellent work. You've completed every topic assigned for today.";

    } else if (
        current === 0
    ) {

        title =
            "Start your streak";


        text =
            "Complete all of today's assigned topics to create your first study day.";

    } else {

        title =
            "Don't break the chain";


        text =
            `Your ${current}-day streak is waiting for today's study requirements.`;

    }


    if (
        $("motivationTitle")
    ) {

        $("motivationTitle")
            .textContent =
            title;

    }


    if (
        $("motivationText")
    ) {

        $("motivationText")
            .textContent =
            text;

    }

}


/* =========================================================
   CALENDAR
========================================================= */

function renderCalendar() {

    const year =
        calendarDate.getFullYear();


    const month =
        calendarDate.getMonth();


    const monthName =
        calendarDate.toLocaleString(
            "en-US",
            {
                month: "long",
                year: "numeric"
            }
        );


    if (
        $("calendarMonth")
    ) {

        $("calendarMonth")
            .textContent =
            monthName;

    }


    const grid =
        $("calendarGrid");


    if (!grid) {
        return;
    }


    grid.innerHTML = "";


    const firstDay =
        new Date(
            year,
            month,
            1
        );


    const start =
        firstDay.getDay() === 0
            ? 6
            : firstDay.getDay() - 1;


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    for (
        let i = 0;
        i < start;
        i++
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "calendar-day empty";


        grid.appendChild(
            empty
        );

    }


    const today =
        todayKey();


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


        const key =
            formatDate(date);


        const cell =
            document.createElement(
                "div"
            );


        cell.className =
            "calendar-day";


        if (
            key === today
        ) {

            cell.classList.add(
                "today"
            );

        }


        if (
            activity[key]
        ) {

            cell.classList.add(
                "studied"
            );


            cell.innerHTML =
                `
                    ${day}
                    <span class="check">✓</span>
                `;

        } else {

            cell.textContent =
                day;

        }


        grid.appendChild(
            cell
        );

    }

}


/* =========================================================
   CALENDAR CONTROLS
========================================================= */

function setupCalendarControls() {

    $("previousMonth")
        ?.addEventListener(
            "click",
            () => {

                calendarDate.setMonth(
                    calendarDate.getMonth() - 1
                );


                renderCalendar();

            }
        );


    $("nextMonth")
        ?.addEventListener(
            "click",
            () => {

                calendarDate.setMonth(
                    calendarDate.getMonth() + 1
                );


                renderCalendar();

            }
        );

}


/* =========================================================
   WEEKLY BARS
========================================================= */

function renderWeeklyBars() {

    const container =
        $("weeklyBars");


    if (!container) {
        return;
    }


    container.innerHTML = "";


    const week =
        getCurrentWeek();


    const names =
        [
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat",
            "Sun"
        ];


    const today =
        todayKey();


    let total = 0;


    week.forEach(
        (date, index) => {

            const key =
                formatDate(date);


            const studied =
                activity[key] === true;


            if (studied) {
                total++;
            }


            const day =
                document.createElement(
                    "div"
                );


            day.className =
                "week-day";


            const wrapper =
                document.createElement(
                    "div"
                );


            wrapper.className =
                "week-bar-wrapper";


            const bar =
                document.createElement(
                    "div"
                );


            bar.className =
                "week-bar";


            if (studied) {

                bar.classList.add(
                    "active"
                );


                bar.style.height =
                    "100%";

            } else {

                bar.style.height =
                    "5px";

            }


            if (
                key === today
            ) {

                bar.classList.add(
                    "today"
                );

            }


            wrapper.appendChild(
                bar
            );


            const label =
                document.createElement(
                    "span"
                );


            label.className =
                "week-label";


            label.textContent =
                names[index];


            const number =
                document.createElement(
                    "span"
                );


            number.className =
                "week-number";


            number.textContent =
                studied
                    ? "✓"
                    : "—";


            day.appendChild(
                wrapper
            );


            day.appendChild(
                label
            );


            day.appendChild(
                number
            );


            container.appendChild(
                day
            );

        }
    );


    const first =
        week[0];


    const last =
        week[6];


    if (
        $("weekRange")
    ) {

        $("weekRange")
            .textContent =
            `${first.toLocaleDateString(
                "en-US",
                {
                    month: "short",
                    day: "numeric"
                }
            )} – ${last.toLocaleDateString(
                "en-US",
                {
                    month: "short",
                    day: "numeric"
                }
            )}`;

    }

}


/* =========================================================
   CELEBRATION
========================================================= */

function checkForStreakUpdate() {

    const result =
        recalculateStreaks();


    const current =
        result.current;


    if (
        previousCurrentStreak > 0 &&
        current > previousCurrentStreak
    ) {

        showCelebration(
            current
        );

    }


    previousCurrentStreak =
        current;

}


function showDailyCompletionCelebration(streak) {

    const overlay =
        $("celebrationOverlay");


    const text =
        $("celebrationText");


    if (!overlay) {
        return;
    }


    if (text) {

        text.textContent =
            `You're now on a ${streak}-day study streak. Keep the momentum going!`;

    }


    overlay.classList.add(
        "show"
    );

}


function showCelebration(streak) {

    showDailyCompletionCelebration(
        streak
    );

}


function closeCelebration() {

    $("celebrationOverlay")
        ?.classList
        .remove("show");

}


/* =========================================================
   THEME
========================================================= */

function applyTheme(theme) {

    let dark = false;


    if (
        theme === "dark"
    ) {

        dark = true;

    } else if (
        theme === "system"
    ) {

        dark =
            window.matchMedia?.(
                "(prefers-color-scheme: dark)"
            ).matches || false;

    }


    document.body.classList.toggle(
        "dark",
        dark
    );


    if (
        $("themeIcon")
    ) {

        $("themeIcon")
            .textContent =
            dark
                ? "☀️"
                : "🌙";

    }


    if (
        $("themeText")
    ) {

        $("themeText")
            .textContent =
            dark
                ? "Light mode"
                : "Dark mode";

    }

}


function setupTheme() {

    let theme =
        localStorage.getItem(
            STREAK_KEYS.THEME
        )
        || "system";


    applyTheme(theme);


    $("themeToggle")
        ?.addEventListener(
            "click",
            () => {

                const dark =
                    document.body
                        .classList
                        .contains("dark");


                theme =
                    dark
                        ? "light"
                        : "dark";


                localStorage.setItem(
                    STREAK_KEYS.THEME,
                    theme
                );


                applyTheme(theme);

            }
        );


    window
        .matchMedia?.(
            "(prefers-color-scheme: dark)"
        )
        .addEventListener(
            "change",
            () => {

                const saved =
                    localStorage.getItem(
                        STREAK_KEYS.THEME
                    );


                if (
                    saved === "system"
                ) {

                    applyTheme(
                        "system"
                    );

                }

            }
        );

}


/* =========================================================
   MOBILE
========================================================= */

function setupMobileMenu() {

    $("mobileMenu")
        ?.addEventListener(
            "click",
            () => {

                $("sidebar")
                    ?.classList
                    .toggle(
                        "open"
                    );

            }
        );

}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    $("logoutButton")
        ?.addEventListener(
            "click",
            async () => {

                try {

                    if (
                        window.supabaseClient &&
                        typeof window
                            .supabaseClient
                            .auth
                            ?.signOut ===
                            "function"
                    ) {

                        await window
                            .supabaseClient
                            .auth
                            .signOut();

                    }

                } catch (error) {

                    console.warn(
                        "StudyMind logout error:",
                        error
                    );

                }


                window.location.href =
                    "home.html";

            }
        );

}


/* =========================================================
   STORAGE CHANGES
========================================================= */

function refreshPageData() {

    loadActivity();


    renderHero();


    renderStats();


    renderToday();


    renderCalendar();


    renderWeeklyBars();

}


window.addEventListener(
    "storage",
    event => {

        if (
            event.key ===
            STREAK_KEYS.ACTIVITY
            ||
            event.key ===
            STREAK_KEYS.COMPLETED
            ||
            event.key ===
            STREAK_KEYS.PLAN
        ) {

            refreshPageData();

        }

    }
);


/* =========================================================
   PUBLIC API
========================================================= */

window.StudyMindStreak = {

    recordStudyActivity,

    checkTodayCompletion,

    recordCompletedStudyDay,

    calculateCurrentStreak,

    calculateLongestStreak,

    getStudyDayCount,

    getTodayProgressData,

    refresh:
        refreshPageData

};


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadActivity();


        previousCurrentStreak =
            calculateCurrentStreak();


        loadUser();


        setupTheme();


        setupMobileMenu();


        setupLogout();


        setupCalendarControls();


        renderHero();


        renderStats();


        renderToday();


        renderCalendar();


        renderWeeklyBars();

    }
);

