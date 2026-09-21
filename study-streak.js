"use strict";

/* =========================================================
   STUDYMIND AI — STUDY STREAK
   Dedicated streak-page engine

   IMPORTANT:
   - Does NOT create another timer.
   - Does NOT replace the shared timer.
   - Does NOT use global Milo.
   - Same study day can only count once.
========================================================= */


/* =========================================================
   STORAGE KEYS
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
        "studyMindTheme",

    LAST_TIMER_COMPLETION:
        "studyMindLastTimerCompletedAt",

    PAGE_LAST_TIMER_COMPLETION:
        "studyMindStreakPageLastSeenTimerCompletion"

};


/* =========================================================
   STATE
========================================================= */

let calendarDate = new Date();

let activity = {};

let previousCurrentStreak = 0;

let previousActivitySnapshot = {};

let pendingAnimation = false;


/* =========================================================
   HELPERS
========================================================= */

function $(id) {

    return document.getElementById(id);

}


function todayKey() {

    const d = new Date();

    return formatDate(d);

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
        String(key)
            .split("-")
            .map(Number);

    if (
        parts.length !== 3 ||
        parts.some(Number.isNaN)
    ) {

        return null;

    }

    return new Date(
        parts[0],
        parts[1] - 1,
        parts[2]
    );

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


function loadJSON(key, fallback) {

    try {

        const value =
            localStorage.getItem(key);

        if (!value) {

            return fallback;

        }

        return JSON.parse(value);

    } catch (error) {

        console.warn(
            `StudyMind: could not read ${key}`,
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
            `StudyMind: could not save ${key}`,
            error
        );

    }

}


/* =========================================================
   ACTIVITY
========================================================= */

function loadActivity() {

    const stored =
        loadJSON(
            STREAK_KEYS.ACTIVITY,
            {}
        );

    activity =
        stored &&
        typeof stored === "object"
            ? stored
            : {};

    return activity;

}


function saveActivity() {

    saveJSON(
        STREAK_KEYS.ACTIVITY,
        activity
    );

}


function getActivitySnapshot() {

    return JSON.stringify(
        activity
    );

}


function hasActivity(date) {

    const key =
        typeof date === "string"
            ? date
            : formatDate(date);

    return activity[key] === true;

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
   COMPLETED TOPICS
========================================================= */

function getCompletedTopicKeys() {

    const value =
        loadJSON(
            STREAK_KEYS.COMPLETED,
            []
        );

    if (Array.isArray(value)) {

        return value;

    }

    if (
        value &&
        typeof value === "object"
    ) {

        return Object.keys(value)
            .filter(
                key => value[key] === true
            );

    }

    return [];

}


function getAllStudyTopics() {

    const plan =
        getStudyPlan();

    if (!plan) {

        return [];

    }

    const result = [];

    if (Array.isArray(plan.subjects)) {

        plan.subjects.forEach(
            subject => {

                if (!subject) return;

                if (
                    Array.isArray(
                        subject.topics
                    )
                ) {

                    subject.topics.forEach(
                        topic => {

                            if (
                                typeof topic ===
                                "string"
                            ) {

                                result.push(
                                    topic
                                );

                            }

                        }
                    );

                }

            }
        );

    }


    if (
        Array.isArray(
            plan.flatTopics
        )
    ) {

        plan.flatTopics.forEach(
            topic => {

                if (
                    typeof topic ===
                    "string" &&
                    !result.includes(topic)
                ) {

                    result.push(topic);

                }

            }
        );

    }


    return result;

}


/* =========================================================
   TODAY'S PLAN PROGRESS
========================================================= */

function getTodaySchedule() {

    const plan =
        getStudyPlan();

    if (!plan) {

        return [];

    }


    const today =
        todayKey();

    const schedule =
        plan.timetableData ||
        plan.schedule ||
        plan.timetable;


    if (!schedule) {

        return [];

    }


    let todayData = null;


    if (
        Array.isArray(schedule)
    ) {

        todayData =
            schedule.find(
                item =>
                    item &&
                    (
                        item.date === today ||
                        item.dayKey === today
                    )
            );

    } else if (
        typeof schedule === "object"
    ) {

        todayData =
            schedule[today];

    }


    if (!todayData) {

        return [];

    }


    if (
        Array.isArray(todayData)
    ) {

        return todayData;

    }


    if (
        Array.isArray(
            todayData.topics
        )
    ) {

        return todayData.topics;

    }


    return [];

}


function getTodaysRequiredTopics() {

    const schedule =
        getTodaySchedule();

    return schedule
        .map(item => {

            if (
                typeof item ===
                "string"
            ) {

                return item;

            }

            if (
                item &&
                typeof item.topic ===
                "string"
            ) {

                return item.topic;

            }

            if (
                item &&
                typeof item.title ===
                "string"
            ) {

                return item.title;

            }

            return null;

        })
        .filter(Boolean);

}


/* =========================================================
   TOPIC PROGRESS
========================================================= */

function getTodayTopicProgress() {

    const required =
        getTodaysRequiredTopics();

    const completed =
        getCompletedTopicKeys();

    if (!required.length) {

        return {
            total: 0,
            completed: 0,
            percentage: 0
        };

    }


    let count = 0;


    required.forEach(
        topic => {

            const possibleKeys = [
                topic,
                `::${topic}`
            ];

            const found =
                possibleKeys.some(
                    key =>
                        completed.includes(key)
                );

            if (found) {

                count++;

            }

        }
    );


    return {

        total:
            required.length,

        completed:
            count,

        percentage:
            Math.round(
                (count /
                    required.length) *
                100
            )

    };

}


/* =========================================================
   CHECK TODAY COMPLETION
   Legacy/manual compatibility function.

   This remains available for older code.

   The authoritative timer completion path uses
   recordStudyActivity().
========================================================= */

function checkTodayCompletion() {

    loadActivity();

    const today =
        todayKey();

    if (
        activity[today] === true
    ) {

        return {

            completed: true,

            alreadyCompleted: true,

            current:
                calculateCurrentStreak(),

            longest:
                calculateLongestStreak()

        };

    }


    const progress =
        getTodayTopicProgress();


    if (
        progress.total > 0 &&
        progress.completed >=
        progress.total
    ) {

        return recordStudyActivity(
            "completed-topics"
        );

    }


    return {

        completed: false,

        alreadyCompleted: false,

        current:
            calculateCurrentStreak(),

        longest:
            calculateLongestStreak(),

        progress

    };

}


/* =========================================================
   RECORD STUDY ACTIVITY
========================================================= */

function recordStudyActivity(source = "study-session") {

    loadActivity();

    const today =
        todayKey();

    const alreadyCompleted =
        activity[today] === true;


    /*
       IMPORTANT:

       A study day is recorded here when the shared timer
       reaches zero or another valid study completion path
       calls this function.

       It does NOT modify:
       - completed topics
       - knowledge checks
       - timer state
       - current topic
    */

    if (!alreadyCompleted) {

        activity[today] = true;

        saveActivity();

        localStorage.setItem(
            STREAK_KEYS.LAST_COMPLETED,
            today
        );

    }


    const result =
        recalculateStreaks();


    /*
       Dispatch an event so the Streak page can immediately
       animate if it is currently open.

       This does not create another streak engine.
    */

    try {

        window.dispatchEvent(
            new CustomEvent(
                "studyMindStreakUpdated",
                {
                    detail: {

                        source,

                        date: today,

                        isNewDay:
                            !alreadyCompleted,

                        current:
                            result.current,

                        longest:
                            result.longest,

                        totalStudyDays:
                            result.totalStudyDays

                    }

                }
            )
        );

    } catch (error) {

        console.warn(
            "StudyMind: could not dispatch streak update",
            error
        );

    }


    refreshPageData(
        !alreadyCompleted
    );


    return {

        ...result,

        date: today,

        isNewDay:
            !alreadyCompleted

    };

}


/* =========================================================
   COMPATIBILITY FUNCTION
========================================================= */

function recordCompletedStudyDay() {

    return recordStudyActivity(
        "completed-study-day"
    );

}


/* =========================================================
   CURRENT STREAK
========================================================= */

function calculateCurrentStreak() {

    loadActivity();


    const today =
        startOfDay(
            new Date()
        );


    const todayString =
        formatDate(today);


    /*
       If today has activity, start from today.

       Otherwise allow the existing streak to continue
       from yesterday.

       This means simply opening the page does not increase
       the streak.
    */

    let cursor;


    if (
        activity[todayString] === true
    ) {

        cursor =
            new Date(today);

    } else {

        cursor =
            new Date(today);

        cursor.setDate(
            cursor.getDate() - 1
        );

    }


    let streak = 0;


    while (
        activity[
            formatDate(cursor)
        ] === true
    ) {

        streak++;

        cursor.setDate(
            cursor.getDate() - 1
        );

    }


    return streak;

}


/* =========================================================
   LONGEST STREAK
========================================================= */

function calculateLongestStreak() {

    loadActivity();


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


        if (
            !previous ||
            !currentDate
        ) {

            continue;

        }


        const difference =
            Math.round(
                (
                    startOfDay(
                        currentDate
                    ) -
                    startOfDay(
                        previous
                    )
                ) /
                86400000
            );


        if (
            difference === 1
        ) {

            current++;

            longest =
                Math.max(
                    longest,
                    current
                );

        } else {

            current = 1;

        }

    }


    return longest;

}


/* =========================================================
   RECALCULATE
========================================================= */

function recalculateStreaks() {

    loadActivity();


    const current =
        calculateCurrentStreak();

    const longest =
        calculateLongestStreak();

    const totalStudyDays =
        getStudyDayCount();


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

        longest,

        totalStudyDays

    };

}


/* =========================================================
   COUNTS
========================================================= */

function getStudyDayCount() {

    loadActivity();


    return Object.keys(activity)
        .filter(
            key =>
                activity[key] === true
        )
        .length;

}


function getCompletedTopicCount() {

    return getCompletedTopicKeys()
        .length;

}


/* =========================================================
   WEEK HELPERS
========================================================= */

function getMonday(date) {

    const d =
        startOfDay(date);

    const day =
        d.getDay();

    const difference =
        day === 0
            ? -6
            : 1 - day;

    d.setDate(
        d.getDate() +
        difference
    );

    return d;

}


function getCurrentWeekDates() {

    const monday =
        getMonday(
            new Date()
        );

    const dates = [];


    for (
        let i = 0;
        i < 7;
        i++
    ) {

        const date =
            new Date(monday);

        date.setDate(
            monday.getDate() +
            i
        );

        dates.push(date);

    }


    return dates;

}


function getWeeklyStudyDays() {

    return getCurrentWeekDates()
        .filter(
            date =>
                hasActivity(date)
        )
        .length;

}


function getBestWeek() {

    loadActivity();


    const dates =
        Object.keys(activity)
            .filter(
                key =>
                    activity[key] === true
            )
            .map(
                key =>
                    parseDate(key)
            )
            .filter(Boolean)
            .sort(
                (a, b) =>
                    a - b
            );


    if (!dates.length) {

        return 0;

    }


    const weeks = {};


    dates.forEach(
        date => {

            const monday =
                getMonday(date);

            const key =
                formatDate(monday);

            weeks[key] =
                (weeks[key] || 0) + 1;

        }
    );


    return Math.max(
        ...Object.values(weeks)
    );

}


/* =========================================================
   USER
========================================================= */

function getUsername() {

    const stored =
        localStorage.getItem(
            STREAK_KEYS.USERNAME
        );


    if (stored) {

        return stored;

    }


    try {

        if (
            window.supabaseClient &&
            typeof
            window.supabaseClient.auth?.getUser ===
            "function"
        ) {

            return null;

        }

    } catch (error) {

        /* Ignore */

    }


    return null;

}


async function loadUser() {

    let name =
        getUsername();


    try {

        if (
            window.supabaseClient &&
            typeof
            window.supabaseClient.auth?.getUser ===
            "function"
        ) {

            const {
                data
            } =
                await window.supabaseClient.auth.getUser();


            const user =
                data?.user;


            if (user) {

                name =
                    user.user_metadata?.username ||
                    user.user_metadata?.name ||
                    user.email?.split("@")[0] ||
                    name ||
                    "Student";

            }

        }

    } catch (error) {

        console.warn(
            "StudyMind: could not load user",
            error
        );

    }


    name =
        name ||
        "Student";


    localStorage.setItem(
        STREAK_KEYS.USERNAME,
        name
    );


    const username =
        $("username");

    const avatar =
        $("avatar");


    if (username) {

        username.textContent =
            name;

    }


    if (avatar) {

        avatar.textContent =
            String(name)
                .trim()
                .charAt(0)
                .toUpperCase() ||
            "S";

    }

}


/* =========================================================
   HERO
========================================================= */

function getStreakMessage(streak) {

    if (streak <= 0) {

        return "Complete a study session today to start your streak.";

    }

    if (streak === 1) {

        return "Great start. Come back tomorrow to make it 2 days!";

    }

    if (streak === 2) {

        return "Two days in a row. Keep the momentum going!";

    }

    if (streak === 3) {

        return "Three days strong. You're building consistency!";

    }

    if (streak < 7) {

        return `${streak} days in a row. Keep showing up!`;

    }

    if (streak === 7) {

        return "One full week! That's serious consistency. 🔥";

    }

    return `${streak} consecutive study days. Keep going!`;

}


function renderHero(animate = false) {

    const result =
        recalculateStreaks();


    const current =
        result.current;


    const currentElement =
        $("currentStreak");


    const numberContainer =
        currentElement?.closest(
            ".streak-number"
        );


    if (currentElement) {

        currentElement.textContent =
            current;

    }


    if (
        animate &&
        numberContainer
    ) {

        numberContainer.classList.remove(
            "animate-up"
        );


        void numberContainer.offsetWidth;


        numberContainer.classList.add(
            "animate-up"
        );

    }


    const message =
        $("streakMessage");


    if (message) {

        message.textContent =
            getStreakMessage(
                current
            );

    }


    const best =
        $("bestStreak");


    if (best) {

        best.textContent =
            `${result.longest} ${
                result.longest === 1
                    ? "day"
                    : "days"
            }`;

    }


    const total =
        $("totalStudyDays");


    if (total) {

        total.textContent =
            result.totalStudyDays;

    }


    renderStreakDayTrack(
        animate
    );

}


/* =========================================================
   STREAK DAY TRACK
========================================================= */

function renderStreakDayTrack(
    animate = false
) {

    const container =
        $("streakDayTrack");


    if (!container) {

        return;

    }


    container.innerHTML = "";


    const current =
        calculateCurrentStreak();


    if (current <= 0) {

        return;

    }


    const today =
        startOfDay(
            new Date()
        );


    const dates = [];


    /*
       Show up to the most recent 7
       consecutive streak days.
    */

    for (
        let i = current - 1;
        i >= 0 &&
        dates.length < 7;
        i--
    ) {

        const date =
            new Date(today);

        date.setDate(
            date.getDate() - i
        );


        if (
            hasActivity(date)
        ) {

            dates.push(date);

        }

    }


    dates.forEach(
        (date, index) => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "streak-day completed";


            if (
                formatDate(date) ===
                todayKey()
            ) {

                item.classList.add(
                    "today"
                );

            }


            /*
               Only animate the newest day
               when an actual update occurred.
            */

            if (
                animate &&
                index === dates.length - 1
            ) {

                item.classList.add(
                    "new-day"
                );

            }


            const number =
                document.createElement(
                    "div"
                );

            number.className =
                "streak-day-number";

            number.textContent =
                date.getDate();


            const label =
                document.createElement(
                    "div"
                );

            label.className =
                "streak-day-label";

            label.textContent =
                date.toLocaleDateString(
                    undefined,
                    {
                        weekday: "short"
                    }
                );


            item.appendChild(
                number
            );

            item.appendChild(
                label
            );


            container.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   STATS
========================================================= */

function renderStats() {

    const topics =
        $("topicsCompleted");


    if (topics) {

        topics.textContent =
            getCompletedTopicCount();

    }


    const weekly =
        getWeeklyStudyDays();


    const weeklyDays =
        $("weeklyDays");


    if (weeklyDays) {

        weeklyDays.textContent =
            `${weekly} / 7`;

    }


    const consistency =
        $("weeklyConsistency");


    if (consistency) {

        consistency.textContent =
            `${Math.round(
                (weekly / 7) * 100
            )}%`;

    }


    const bestWeek =
        $("bestWeek");


    if (bestWeek) {

        const value =
            getBestWeek();

        bestWeek.textContent =
            `${value} ${
                value === 1
                    ? "day"
                    : "days"
            }`;

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


    const icon =
        $("todayIcon");

    const status =
        $("todayStatus");

    const progressText =
        $("todayProgress");

    const progressBar =
        $("todayProgressBar");

    const caption =
        $("todayCaption");


    if (studied) {

        if (icon) {

            icon.classList.add(
                "complete"
            );

            icon.textContent =
                "✓";

        }


        if (status) {

            status.textContent =
                "Study day completed!";

        }


        if (progressText) {

            progressText.textContent =
                "Today's study activity has been recorded.";

        }


        if (progressBar) {

            progressBar.style.width =
                "100%";

        }


        if (caption) {

            caption.textContent =
                "100% — study day complete";

        }


        return;

    }


    if (icon) {

        icon.classList.remove(
            "complete"
        );

        icon.textContent =
            "○";

    }


    const progress =
        getTodayTopicProgress();


    if (progress.total > 0) {

        if (status) {

            status.textContent =
                `${progress.completed} of ${progress.total} topics completed`;

        }


        if (progressText) {

            progressText.textContent =
                "Complete a study session to record today.";

        }


        if (progressBar) {

            progressBar.style.width =
                `${progress.percentage}%`;

        }


        if (caption) {

            caption.textContent =
                `${progress.percentage}% topic progress`;

        }

    } else {

        if (status) {

            status.textContent =
                "No study activity yet";

        }


        if (progressText) {

            progressText.textContent =
                "Complete a study session to record today.";

        }


        if (progressBar) {

            progressBar.style.width =
                "0%";

        }


        if (caption) {

            caption.textContent =
                "0% complete";

        }

    }

}


/* =========================================================
   MOTIVATION
========================================================= */

function renderMotivation() {

    const streak =
        calculateCurrentStreak();


    const title =
        $("motivationTitle");

    const text =
        $("motivationText");


    if (!title || !text) {

        return;

    }


    if (streak === 0) {

        title.textContent =
            "Start today";

        text.textContent =
            "One study session is enough to start building your streak.";

        return;

    }


    if (streak === 1) {

        title.textContent =
            "Keep it going";

        text.textContent =
            "Come back tomorrow and turn your first study day into a streak.";

        return;

    }


    if (streak < 7) {

        title.textContent =
            "You're building momentum";

        text.textContent =
            `You've studied ${streak} days in a row. Keep showing up.`;

        return;

    }


    title.textContent =
        "You're on fire 🔥";

    text.textContent =
        `${streak} consecutive study days. Protect the streak!`;

}


/* =========================================================
   CALENDAR
========================================================= */

function renderCalendar(
    newlyCompletedDate = null
) {

    const grid =
        $("calendarGrid");

    const title =
        $("calendarMonth");


    if (!grid || !title) {

        return;

    }


    const year =
        calendarDate.getFullYear();

    const month =
        calendarDate.getMonth();


    title.textContent =
        calendarDate.toLocaleDateString(
            undefined,
            {
                month: "long",
                year: "numeric"
            }
        );


    grid.innerHTML = "";


    const firstDay =
        new Date(
            year,
            month,
            1
        );


    /*
       Convert Sunday=0 to Monday-based index.
    */

    const firstWeekday =
        (
            firstDay.getDay() + 6
        ) % 7;


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


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
            activity[key] === true
        ) {

            cell.classList.add(
                "studied"
            );


            if (
                newlyCompletedDate &&
                key === newlyCompletedDate
            ) {

                cell.classList.add(
                    "newly-completed"
                );

            }

        }


        cell.textContent =
            day;


        if (
            activity[key] === true
        ) {

            const check =
                document.createElement(
                    "span"
                );

            check.className =
                "check";

            check.textContent =
                "✓";

            cell.appendChild(
                check
            );

        }


        grid.appendChild(
            cell
        );

    }

}


/* =========================================================
   WEEKLY BARS
========================================================= */

function renderWeeklyBars(
    newlyCompletedDate = null
) {

    const container =
        $("weeklyBars");

    const range =
        $("weekRange");


    if (!container) {

        return;

    }


    container.innerHTML = "";


    const dates =
        getCurrentWeekDates();


    if (range) {

        const first =
            dates[0];

        const last =
            dates[6];


        range.textContent =
            `${first.toLocaleDateString(
                undefined,
                {
                    month: "short",
                    day: "numeric"
                }
            )} – ${last.toLocaleDateString(
                undefined,
                {
                    month: "short",
                    day: "numeric"
                }
            )}`;

    }


    dates.forEach(
        date => {

            const wrapper =
                document.createElement(
                    "div"
                );

            wrapper.className =
                "week-day";


            const barWrapper =
                document.createElement(
                    "div"
                );

            barWrapper.className =
                "week-bar-wrapper";


            const bar =
                document.createElement(
                    "div"
                );

            bar.className =
                "week-bar";


            const key =
                formatDate(date);


            const studied =
                activity[key] === true;


            if (studied) {

                bar.classList.add(
                    "active"
                );

                bar.style.height =
                    "100%";

            } else {

                bar.style.height =
                    "8%";

            }


            if (
                key === todayKey()
            ) {

                bar.classList.add(
                    "today"
                );

            }


            if (
                newlyCompletedDate &&
                key === newlyCompletedDate
            ) {

                bar.classList.add(
                    "newly-active"
                );

            }


            barWrapper.appendChild(
                bar
            );


            const label =
                document.createElement(
                    "div"
                );

            label.className =
                "week-label";

            label.textContent =
                date.toLocaleDateString(
                    undefined,
                    {
                        weekday: "short"
                    }
                ).slice(0, 3);


            const number =
                document.createElement(
                    "div"
                );

            number.className =
                "week-number";

            number.textContent =
                date.getDate();


            wrapper.appendChild(
                barWrapper
            );

            wrapper.appendChild(
                label
            );

            wrapper.appendChild(
                number
            );


            container.appendChild(
                wrapper
            );

        }
    );

}


/* =========================================================
   DEDICATED STREAK MILO
========================================================= */

let miloDanceTimeout = null;


function playStreakMilo() {

    const milo =
        $("streakMilo");


    if (!milo) {

        return;

    }


    if (miloDanceTimeout) {

        clearTimeout(
            miloDanceTimeout
        );

    }


    milo.classList.remove(
        "show",
        "dancing"
    );


    /*
       Force reflow so repeated streaks can
       trigger the animation again.
    */

    void milo.offsetWidth;


    milo.classList.add(
        "show",
        "dancing"
    );


    miloDanceTimeout =
        setTimeout(
            () => {

                milo.classList.remove(
                    "dancing"
                );

                /*
                   Leave Milo visible very briefly,
                   then hide him.
                */

                setTimeout(
                    () => {

                        milo.classList.remove(
                            "show"
                        );

                    },
                    500
                );

            },
            4200
        );

}


/* =========================================================
   CELEBRATION
========================================================= */

function showDailyCompletionCelebration(
    streak
) {

    const overlay =
        $("celebrationOverlay");

    const title =
        $("celebrationTitle");

    const text =
        $("celebrationText");


    if (!overlay) {

        return;

    }


    if (title) {

        if (streak === 1) {

            title.textContent =
                "1-Day Streak! 🔥";

        } else {

            title.textContent =
                `${streak}-Day Streak! 🔥`;

        }

    }


    if (text) {

        if (streak === 1) {

            text.textContent =
                "Amazing start! You've completed your first study day.";

        } else {

            text.textContent =
                `You just reached ${streak} consecutive study days. Keep going!`;

        }

    }


    overlay.classList.add(
        "show"
    );

}


function closeCelebration() {

    const overlay =
        $("celebrationOverlay");


    if (overlay) {

        overlay.classList.remove(
            "show"
        );

    }

}


/* =========================================================
   STREAK UPDATE ANIMATION
========================================================= */

function handleNewStudyDay(
    streak,
    dateKey,
    source
) {

    /*
       Prevent accidental duplicate animation.
    */

    if (pendingAnimation) {

        return;

    }


    pendingAnimation = true;


    setTimeout(
        () => {

            pendingAnimation = false;

        },
        1000
    );


    renderHero(true);

    renderStats();

    renderToday();

    renderMotivation();

    renderCalendar(
        dateKey
    );

    renderWeeklyBars(
        dateKey
    );


    /*
       Dedicated Streak-page Milo.
       No global milo.js call.
    */

    playStreakMilo();


    /*
       Show celebration only for an actual
       new study day.
    */

    showDailyCompletionCelebration(
        streak
    );


    console.log(
        "StudyMind Streak:",
        "new study day recorded",
        {
            streak,
            date: dateKey,
            source
        }
    );

}


/* =========================================================
   DETECT NEW TIMER COMPLETION
========================================================= */

function checkForRecentTimerCompletion() {

    const timestamp =
        localStorage.getItem(
            STREAK_KEYS.LAST_TIMER_COMPLETION
        );


    if (!timestamp) {

        return;

    }


    const previous =
        localStorage.getItem(
            STREAK_KEYS.PAGE_LAST_TIMER_COMPLETION
        );


    if (
        previous === timestamp
    ) {

        return;

    }


    /*
       Mark it as seen before animating so
       refreshing the page does not replay it.
    */

    localStorage.setItem(
        STREAK_KEYS.PAGE_LAST_TIMER_COMPLETION,
        timestamp
    );


    const date =
        todayKey();


    if (
        activity[date] !== true
    ) {

        return;

    }


    const result =
        recalculateStreaks();


    handleNewStudyDay(
        result.current,
        date,
        "timer-navigation"
    );

}


/* =========================================================
   REFRESH PAGE
========================================================= */

function refreshPageData(
    animate = false
) {

    loadActivity();


    renderHero(
        animate
    );

    renderStats();

    renderToday();

    renderMotivation();

    renderCalendar();

    renderWeeklyBars();

}


/* =========================================================
   THEME
========================================================= */

function initializeTheme() {

    const stored =
        localStorage.getItem(
            STREAK_KEYS.THEME
        );


    if (
        stored === "dark"
    ) {

        document.body.classList.add(
            "dark"
        );

    }

}


function toggleTheme() {

    document.body.classList.toggle(
        "dark"
    );


    const isDark =
        document.body.classList.contains(
            "dark"
        );


    localStorage.setItem(
        STREAK_KEYS.THEME,
        isDark
            ? "dark"
            : "light"
    );

}


/* =========================================================
   MOBILE MENU
========================================================= */

function initializeMobileMenu() {

    const button =
        $("mobileMenu");

    const sidebar =
        $("sidebar");


    if (!button || !sidebar) {

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
            ".navigation a"
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
   LOGOUT
========================================================= */

async function logout() {

    try {

        if (
            window.supabaseClient &&
            typeof
            window.supabaseClient.auth?.signOut ===
            "function"
        ) {

            await window.supabaseClient.auth.signOut();

        }

    } catch (error) {

        console.warn(
            "StudyMind: logout error",
            error
        );

    }


    window.location.href =
        "login.html";

}


/* =========================================================
   CALENDAR CONTROLS
========================================================= */

function initializeCalendarControls() {

    const previous =
        $("previousMonth");

    const next =
        $("nextMonth");


    previous?.addEventListener(
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


    next?.addEventListener(
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


/* =========================================================
   CELEBRATION BUTTON
========================================================= */

function initializeCelebration() {

    const close =
        $("closeCelebration");

    const overlay =
        $("celebrationOverlay");


    close?.addEventListener(
        "click",
        closeCelebration
    );


    overlay?.addEventListener(
        "click",
        event => {

            if (
                event.target === overlay
            ) {

                closeCelebration();

            }

        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeCelebration();

            }

        }
    );

}


/* =========================================================
   STREAK EVENT LISTENER
========================================================= */

function initializeStreakEvents() {

    window.addEventListener(
        "studyMindStreakUpdated",
        event => {

            loadActivity();


            const detail =
                event.detail || {};


            const isNewDay =
                detail.isNewDay === true;


            /*
               If another part of StudyMind has already
               recorded today's activity, we only animate
               when the event says this was a new day.
            */

            if (
                isNewDay
            ) {

                const result =
                    recalculateStreaks();


                handleNewStudyDay(
                    detail.current ??
                    result.current,
                    detail.date ||
                    todayKey(),
                    detail.source ||
                    "streak-event"
                );

            } else {

                refreshPageData();

            }

        }
    );


    /*
       Also listen for localStorage changes so the
       page stays synchronized if another page/tab
       changes streak activity.
    */

    window.addEventListener(
        "storage",
        event => {

            if (
                event.key ===
                    STREAK_KEYS.ACTIVITY ||
                event.key ===
                    STREAK_KEYS.COMPLETED ||
                event.key ===
                    STREAK_KEYS.PLAN
            ) {

                const oldSnapshot =
                    previousActivitySnapshot;


                loadActivity();


                const newSnapshot =
                    getActivitySnapshot();


                const activityChanged =
                    oldSnapshot !==
                    newSnapshot;


                if (
                    activityChanged
                ) {

                    refreshPageData();

                }


                previousActivitySnapshot =
                    newSnapshot;

            }

        }
    );

}


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

    getTodayProgressData:
        getTodayTopicProgress,

    refresh:
        refreshPageData

};


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        initializeTheme();

        loadActivity();


        previousActivitySnapshot =
            getActivitySnapshot();


        previousCurrentStreak =
            calculateCurrentStreak();


        await loadUser();


        initializeMobileMenu();

        initializeCalendarControls();

        initializeCelebration();


        $("themeToggle")?.addEventListener(
            "click",
            toggleTheme
        );


        $("logoutButton")?.addEventListener(
            "click",
            logout
        );


        refreshPageData();


        initializeStreakEvents();


        /*
           If the user completed a timer on another page
           and then navigated here, detect that completion.
        */

        checkForRecentTimerCompletion();


        console.log(
            "StudyMind AI: Study Streak initialized.",
            {
                currentStreak:
                    calculateCurrentStreak(),

                longestStreak:
                    calculateLongestStreak(),

                totalStudyDays:
                    getStudyDayCount(),

                activity
            }
        );

    }
);
