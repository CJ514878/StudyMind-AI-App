"use strict";

/* =========================================================
   STUDYMIND AI — GOALS
   ---------------------------------------------------------
   GOALS DASHBOARD
========================================================= */

(function () {

    /* =====================================================
       CONSTANTS
    ===================================================== */

    const PLAN_KEY = "studyMindPlan";
    const PLANS_KEY = "studyMindPlans";
    const ACTIVE_PLAN_KEY = "studyMindActivePlanId";

    const COMPLETED_TOPICS_KEY = "studyMindCompletedTopics";
    const STREAK_ACTIVITY_KEY = "studyMindStreakActivity";
    const STUDY_HISTORY_KEY = "studyMindStudyHistory";

    const USER_KEY = "studyMindUser";

    const THEME_KEY = "studyMindTheme";
    const OLD_THEME_KEY = "studyMindDarkMode";


    /* =====================================================
       HELPERS
    ===================================================== */

    function $(id) {
        return document.getElementById(id);
    }

    function safeParse(value, fallback) {
        try {
            return value ? JSON.parse(value) : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function getJSON(key, fallback) {
        return safeParse(localStorage.getItem(key), fallback);
    }

    function setJSON(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function number(value, fallback = 0) {
        const n = Number(value);
        return Number.isFinite(n) ? n : fallback;
    }

    function formatHours(hours) {
        const value = number(hours);

        if (value <= 0) {
            return "0h";
        }

        if (value < 1) {
            return `${Math.round(value * 60)}m`;
        }

        if (Number.isInteger(value)) {
            return `${value}h`;
        }

        return `${value.toFixed(1)}h`;
    }

    function todayKey() {
        const date = new Date();

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function dateFromKey(key) {
        if (!key) return null;

        const parts = String(key).split("-");

        if (parts.length !== 3) {
            return null;
        }

        const year = Number(parts[0]);
        const month = Number(parts[1]) - 1;
        const day = Number(parts[2]);

        const date = new Date(year, month, day);

        return Number.isNaN(date.getTime()) ? null : date;
    }

    function getDateKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function startOfWeek(date) {
        const result = new Date(date);
        const day = result.getDay();

        const diff = day === 0 ? -6 : 1 - day;

        result.setDate(result.getDate() + diff);
        result.setHours(0, 0, 0, 0);

        return result;
    }

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =====================================================
       PLAN LOADING
    ===================================================== */

    function getActivePlan() {

        const multiPlans = getJSON(PLANS_KEY, null);
        const activeId = localStorage.getItem(ACTIVE_PLAN_KEY);

        if (Array.isArray(multiPlans) && multiPlans.length) {

            if (activeId) {

                const active = multiPlans.find(
                    plan => String(
                        plan.id ??
                        plan.planId ??
                        plan._id
                    ) === String(activeId)
                );

                if (active) {
                    return active;
                }
            }

            return multiPlans[0];
        }

        const singlePlan = getJSON(PLAN_KEY, null);

        if (singlePlan && typeof singlePlan === "object") {
            return singlePlan;
        }

        const compatibilityPlan = getJSON("studyData", null);

        if (compatibilityPlan && typeof compatibilityPlan === "object") {
            return compatibilityPlan;
        }

        return null;
    }


    /* =====================================================
       USER
    ===================================================== */

    function getUser() {

        const user = getJSON(USER_KEY, {});

        if (!user || typeof user !== "object") {
            return {};
        }

        return user;
    }

    function getUsername() {

        const user = getUser();

        return (
            user.username ||
            user.display_name ||
            user.displayName ||
            user.name ||
            user.full_name ||
            user.fullName ||
            "Student"
        );
    }


    /* =====================================================
       COMPLETED TOPICS
    ===================================================== */

    function getCompletedTopics() {

        const stored = getJSON(COMPLETED_TOPICS_KEY, []);

        if (Array.isArray(stored)) {
            return stored;
        }

        if (stored && typeof stored === "object") {
            return Object.keys(stored).filter(
                key => stored[key]
            );
        }

        return [];
    }


    /* =====================================================
       STREAK ACTIVITY
    ===================================================== */

    function getStreakActivity() {

        const activity = getJSON(STREAK_ACTIVITY_KEY, {});

        if (
            activity &&
            typeof activity === "object" &&
            !Array.isArray(activity)
        ) {
            return activity;
        }

        return {};
    }


    /* =====================================================
       STUDY HISTORY
    ===================================================== */

    function getStudyHistory() {

        const history = getJSON(STUDY_HISTORY_KEY, {});

        if (
            history &&
            typeof history === "object" &&
            !Array.isArray(history)
        ) {
            return history;
        }

        if (Array.isArray(history)) {
            return history;
        }

        return {};
    }


    /* =====================================================
       SCORE ENGINE
    ===================================================== */

    function getScoreMetrics() {

        try {

            if (
                window.StudyMindScore &&
                typeof window.StudyMindScore.getMetrics === "function"
            ) {
                const metrics =
                    window.StudyMindScore.getMetrics();

                if (metrics && typeof metrics === "object") {
                    return metrics;
                }
            }

        } catch (error) {
            console.warn(
                "StudyMind Goals: score metrics unavailable",
                error
            );
        }

        return {
            todayCompleted: 0,
            weeklyCompleted: 0,
            weeklyActiveDays: 0,
            completedTopicNames: getCompletedTopics(),
            planProgress: 0
        };
    }


    /* =====================================================
       PLAN TOPICS
    ===================================================== */

    function getPlanSubjects(plan) {

        if (!plan || typeof plan !== "object") {
            return [];
        }

        if (Array.isArray(plan.subjects)) {
            return plan.subjects;
        }

        return [];
    }

    function getSubjectName(subject) {

        if (typeof subject === "string") {
            return subject;
        }

        if (!subject || typeof subject !== "object") {
            return "Subject";
        }

        return (
            subject.name ||
            subject.subject ||
            subject.title ||
            subject.subjectName ||
            "Subject"
        );
    }

    function getSubjectTopics(subject) {

        if (typeof subject === "string") {
            return [];
        }

        if (!subject || typeof subject !== "object") {
            return [];
        }

        if (Array.isArray(subject.topics)) {
            return subject.topics;
        }

        if (Array.isArray(subject.topicList)) {
            return subject.topicList;
        }

        if (Array.isArray(subject.units)) {
            return subject.units;
        }

        return [];
    }

    function getTopicName(topic) {

        if (typeof topic === "string") {
            return topic;
        }

        if (!topic || typeof topic !== "object") {
            return "";
        }

        return (
            topic.name ||
            topic.title ||
            topic.topic ||
            topic.topicName ||
            ""
        );
    }

    function normalizeTopicName(value) {

        return String(value || "")
            .trim()
            .toLowerCase();
    }


    /* =====================================================
       FLAT PLAN TOPICS
    ===================================================== */

    function getAllPlanTopics(plan) {

        if (!plan) {
            return [];
        }

        const subjects = getPlanSubjects(plan);

        const result = [];

        subjects.forEach(subject => {

            const subjectName = getSubjectName(subject);
            const topics = getSubjectTopics(subject);

            topics.forEach(topic => {

                const topicName = getTopicName(topic);

                if (!topicName) {
                    return;
                }

                result.push({
                    subject: subjectName,
                    topic: topicName,
                    key: `${subjectName}::${topicName}`
                });

            });

        });

        if (!result.length && Array.isArray(plan.flatTopics)) {

            plan.flatTopics.forEach(item => {

                if (typeof item === "string") {

                    result.push({
                        subject: "General",
                        topic: item,
                        key: `General::${item}`
                    });

                    return;
                }

                if (item && typeof item === "object") {

                    const subject =
                        item.subject ||
                        item.subjectName ||
                        "General";

                    const topic =
                        item.topic ||
                        item.topicName ||
                        item.name ||
                        item.title;

                    if (topic) {

                        result.push({
                            subject,
                            topic,
                            key: `${subject}::${topic}`
                        });

                    }
                }

            });

        }

        return result;
    }


    /* =====================================================
       COMPLETION MATCHING
    ===================================================== */

    function isTopicCompleted(topic, completedTopics) {

        const topicKey =
            normalizeTopicName(topic.key);

        const topicOnly =
            normalizeTopicName(topic.topic);

        return completedTopics.some(item => {

            if (typeof item === "string") {

                const normalized =
                    normalizeTopicName(item);

                return (
                    normalized === topicKey ||
                    normalized === topicOnly ||
                    normalized.endsWith(`::${topicOnly}`)
                );
            }

            if (item && typeof item === "object") {

                const key =
                    normalizeTopicName(
                        item.key ||
                        item.id ||
                        item.topicKey ||
                        ""
                    );

                const name =
                    normalizeTopicName(
                        item.topic ||
                        item.topicName ||
                        item.name ||
                        ""
                    );

                return (
                    key === topicKey ||
                    name === topicOnly
                );
            }

            return false;
        });
    }


    /* =====================================================
       STUDY TIME
    ===================================================== */

    function getTodayStudyHours() {

        const history = getStudyHistory();
        const today = todayKey();

        if (
            history &&
            !Array.isArray(history) &&
            Object.prototype.hasOwnProperty.call(history, today)
        ) {

            const value = history[today];

            if (typeof value === "number") {
                return Math.max(0, value / 60);
            }

            if (value && typeof value === "object") {

                return Math.max(
                    0,
                    number(
                        value.hours,
                        number(value.minutes, 0) / 60
                    )
                );
            }
        }

        const timerMinutes =
            number(
                localStorage.getItem(
                    "studyMindTodayStudyMinutes"
                ),
                0
            );

        if (timerMinutes > 0) {
            return timerMinutes / 60;
        }

        return 0;
    }

    function getWeeklyStudyHours() {

        const history = getStudyHistory();

        const start =
            startOfWeek(new Date());

        let totalMinutes = 0;

        if (Array.isArray(history)) {

            history.forEach(entry => {

                if (!entry || typeof entry !== "object") {
                    return;
                }

                const dateValue =
                    entry.date ||
                    entry.day ||
                    entry.dateKey;

                const date =
                    dateFromKey(dateValue);

                if (!date || date < start) {
                    return;
                }

                const minutes =
                    number(
                        entry.minutes,
                        number(entry.duration, 0)
                    );

                totalMinutes += minutes;
            });

        } else {

            for (let i = 0; i < 7; i++) {

                const date =
                    new Date(start);

                date.setDate(
                    start.getDate() + i
                );

                const key =
                    getDateKey(date);

                const value =
                    history[key];

                if (typeof value === "number") {

                    totalMinutes += value;

                } else if (
                    value &&
                    typeof value === "object"
                ) {

                    totalMinutes += number(
                        value.minutes,
                        number(value.hours, 0) * 60
                    );
                }
            }
        }

        if (totalMinutes === 0) {
            totalMinutes =
                getTodayStudyHours() * 60;
        }

        return totalMinutes / 60;
    }


    /* =====================================================
       DAILY TARGETS
    ===================================================== */

    function getDailyHoursTarget(plan) {

        return number(
            plan?.hoursPerDay ??
            plan?.studyHours ??
            plan?.dailyHours ??
            plan?.hours ??
            2,
            2
        );
    }

    function getDailyTopicTarget(
        plan,
        totalTopics
    ) {

        const explicit =
            number(
                plan?.topicsPerDay ??
                plan?.dailyTopics ??
                plan?.topicsPerDayTarget,
                0
            );

        if (explicit > 0) {
            return explicit;
        }

        if (totalTopics <= 0) {
            return 0;
        }

        const remainingDays =
            getRemainingPlanDays(plan);

        if (remainingDays > 0) {

            return Math.max(
                1,
                Math.ceil(
                    totalTopics /
                    remainingDays
                )
            );
        }

        return Math.min(
            totalTopics,
            3
        );
    }

    function getRemainingPlanDays(plan) {

        if (!plan) {
            return 0;
        }

        const examDate =
            plan.examDate ||
            plan.exam_date ||
            plan.endDate;

        if (!examDate) {
            return 0;
        }

        const exam =
            new Date(examDate);

        if (Number.isNaN(exam.getTime())) {
            return 0;
        }

        const today =
            new Date();

        today.setHours(
            0, 0, 0, 0
        );

        exam.setHours(
            0, 0, 0, 0
        );

        return Math.max(
            0,
            Math.ceil(
                (exam - today) /
                (1000 * 60 * 60 * 24)
            )
        );
    }


    /* =====================================================
       CURRENT STREAK
    ===================================================== */

    function getCurrentStreak() {

        const activity =
            getStreakActivity();

        let streak = 0;

        const date =
            new Date();

        date.setHours(
            0, 0, 0, 0
        );

        if (!activity[getDateKey(date)]) {
            date.setDate(
                date.getDate() - 1
            );
        }

        while (
            activity[getDateKey(date)]
        ) {

            streak++;

            date.setDate(
                date.getDate() - 1
            );

            if (streak > 10000) {
                break;
            }
        }

        return streak;
    }


    /* =====================================================
       WEEKLY ACTIVE DAYS
    ===================================================== */

    function getWeeklyActiveDays() {

        const activity =
            getStreakActivity();

        const start =
            startOfWeek(new Date());

        let count = 0;

        for (let i = 0; i < 7; i++) {

            const date =
                new Date(start);

            date.setDate(
                start.getDate() + i
            );

            const key =
                getDateKey(date);

            if (activity[key]) {
                count++;
            }
        }

        return count;
    }


    /* =====================================================
       GREETING
    ===================================================== */

    function updateGreeting() {

        const greeting =
            $("greeting");

        if (!greeting) {
            return;
        }

        const hour =
            new Date().getHours();

        if (hour < 12) {

            greeting.textContent =
                "Good morning";

        } else if (hour < 18) {

            greeting.textContent =
                "Good afternoon";

        } else {

            greeting.textContent =
                "Good evening";
        }
    }


    /* =====================================================
       DATE
    ===================================================== */

    function updateDate() {

        const element =
            $("todayDate");

        if (!element) {
            return;
        }

        element.textContent =
            new Intl.DateTimeFormat(
                undefined,
                {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                }
            ).format(new Date());
    }


    /* =====================================================
       WEEK RANGE
    ===================================================== */

    function updateWeekRange() {

        const element =
            $("weekRange");

        if (!element) {
            return;
        }

        const start =
            startOfWeek(new Date());

        const end =
            new Date(start);

        end.setDate(
            start.getDate() + 6
        );

        const options = {
            month: "short",
            day: "numeric"
        };

        element.textContent =
            `${start.toLocaleDateString(
                undefined,
                options
            )} – ${end.toLocaleDateString(
                undefined,
                options
            )}`;
    }


    /* =====================================================
       USERNAME
    ===================================================== */

    function updateUsername() {

        const element =
            $("userName");

        if (!element) {
            return;
        }

        const username =
            getUsername();

        element.textContent =
            username &&
            username !== "Student"
                ? `, ${username}`
                : "";
    }


    /* =====================================================
       TODAY GOALS
    ===================================================== */

    function updateTodayGoals(
        plan,
        metrics
    ) {

        const allTopics =
            getAllPlanTopics(plan);

        const completedTopics =
            getCompletedTopics();

        const totalTopics =
            allTopics.length;

        const completedTotal =
            allTopics.filter(
                topic =>
                    isTopicCompleted(
                        topic,
                        completedTopics
                    )
            ).length;

        let todayCompleted =
            number(
                metrics?.todayCompleted,
                0
            );

        if (todayCompleted < 0) {
            todayCompleted = 0;
        }

        const todayHours =
            getTodayStudyHours();

        const targetHours =
            getDailyHoursTarget(plan);

        const targetTopics =
            getDailyTopicTarget(
                plan,
                totalTopics
            );

        const timePercent =
            targetHours > 0
                ? clamp(
                    (todayHours /
                        targetHours) * 100,
                    0,
                    100
                )
                : 0;

        const topicPercent =
            targetTopics > 0
                ? clamp(
                    (todayCompleted /
                        targetTopics) * 100,
                    0,
                    100
                )
                : 0;

        const currentStreak =
            getCurrentStreak();

        const streakTarget = 7;

        const streakPercent =
            clamp(
                (currentStreak /
                    streakTarget) * 100,
                0,
                100
            );

        if ($("todayHours")) {

            $("todayHours").textContent =
                formatHours(todayHours);
        }

        if ($("targetHours")) {

            $("targetHours").textContent =
                formatHours(targetHours);
        }

        if ($("timePercent")) {

            $("timePercent").textContent =
                `${Math.round(timePercent)}%`;
        }

        if ($("timeProgress")) {

            $("timeProgress").style.width =
                `${timePercent}%`;
        }

        if ($("todayTopics")) {

            $("todayTopics").textContent =
                todayCompleted;
        }

        if ($("targetTopics")) {

            $("targetTopics").textContent =
                targetTopics;
        }

        if ($("topicPercent")) {

            $("topicPercent").textContent =
                `${Math.round(topicPercent)}%`;
        }

        if ($("topicProgress")) {

            $("topicProgress").style.width =
                `${topicPercent}%`;
        }

        if ($("currentStreak")) {

            $("currentStreak").textContent =
                currentStreak;
        }

        if ($("streakPercent")) {

            $("streakPercent").textContent =
                `${Math.round(streakPercent)}%`;
        }

        if ($("streakProgress")) {

            $("streakProgress").style.width =
                `${streakPercent}%`;
        }


        /* -------------------------------------------------
           TIME MESSAGE
        ------------------------------------------------- */

        if ($("timeMessage")) {

            if (
                todayHours >= targetHours &&
                targetHours > 0
            ) {

                $("timeMessage").textContent =
                    "Daily study-time goal complete. Great work!";

            } else if (todayHours > 0) {

                const remaining =
                    Math.max(
                        0,
                        targetHours - todayHours
                    );

                $("timeMessage").textContent =
                    `${formatHours(
                        remaining
                    )} left to reach today's target.`;

            } else {

                $("timeMessage").textContent =
                    "Start a study session to begin today's goal.";
            }
        }


        /* -------------------------------------------------
           TOPIC MESSAGE
        ------------------------------------------------- */

        if ($("topicMessage")) {

            if (
                targetTopics > 0 &&
                todayCompleted >= targetTopics
            ) {

                $("topicMessage").textContent =
                    "Today's topic goal is complete!";

            } else if (todayCompleted > 0) {

                const remaining =
                    Math.max(
                        0,
                        targetTopics -
                        todayCompleted
                    );

                $("topicMessage").textContent =
                    `${remaining} more topic${
                        remaining === 1
                            ? ""
                            : "s"
                    } to reach today's goal.`;

            } else {

                $("topicMessage").textContent =
                    "Complete a topic to make progress.";
            }
        }


        /* -------------------------------------------------
           STREAK MESSAGE
        ------------------------------------------------- */

        if ($("streakMessage")) {

            if (currentStreak >= 7) {

                $("streakMessage").textContent =
                    "You've reached the 7-day consistency goal!";

            } else if (currentStreak > 0) {

                const remaining =
                    7 - currentStreak;

                $("streakMessage").textContent =
                    `${remaining} more day${
                        remaining === 1
                            ? ""
                            : "s"
                    } to reach 7 days.`;

            } else {

                $("streakMessage").textContent =
                    "Complete a topic today to start your streak.";
            }
        }


        /* -------------------------------------------------
           OVERALL GOAL
        ------------------------------------------------- */

        const overall =
            Math.round(
                (
                    timePercent +
                    topicPercent +
                    streakPercent
                ) / 3
            );

        if ($("overallPercent")) {

            $("overallPercent").textContent =
                `${overall}%`;
        }

        if ($("overallRing")) {

            $("overallRing").style.setProperty(
                "--progress",
                `${overall}%`
            );

            $("overallRing").style.setProperty(
                "--percentage",
                `${overall}%`
            );
        }


        /* -------------------------------------------------
           STATUS
        ------------------------------------------------- */

        if ($("todayStatus")) {

            if (overall >= 100) {

                $("todayStatus").textContent =
                    "Goal complete";

            } else if (overall >= 70) {

                $("todayStatus").textContent =
                    "Great progress";

            } else if (overall > 0) {

                $("todayStatus").textContent =
                    "In progress";

            } else {

                $("todayStatus").textContent =
                    "Getting started";
            }
        }


        /* -------------------------------------------------
           HERO MESSAGE
        ------------------------------------------------- */

        if ($("heroMessage")) {

            if (overall >= 100) {

                $("heroMessage").textContent =
                    "You've hit today's goals. Keep the momentum going.";

            } else if (overall >= 70) {

                $("heroMessage").textContent =
                    "You're making strong progress today. Keep going.";

            } else if (overall > 0) {

                $("heroMessage").textContent =
                    "You're on your way. Small focused sessions add up.";

            } else {

                $("heroMessage").textContent =
                    "Your goals are calculated from your study plan and completed work.";
            }
        }

        return {
            totalTopics,
            completedTotal,
            todayCompleted,
            todayHours,
            targetHours,
            targetTopics,
            currentStreak,
            overall
        };
    }


    /* =====================================================
       WEEKLY GOALS
    ===================================================== */

    function updateWeeklyGoals(
        plan,
        metrics
    ) {

        const dailyHours =
            getDailyHoursTarget(plan);

        const weeklyTargetHours =
            dailyHours * 7;

        const weeklyHours =
            getWeeklyStudyHours();

        const weeklyHoursPercent =
            weeklyTargetHours > 0
                ? clamp(
                    (weeklyHours /
                        weeklyTargetHours) * 100,
                    0,
                    100
                )
                : 0;

        const activeDays =
            number(
                metrics?.weeklyActiveDays,
                getWeeklyActiveDays()
            );

        const weeklyCompleted =
            number(
                metrics?.weeklyCompleted,
                0
            );

        const totalTopics =
            getAllPlanTopics(plan).length;

        const weeklyTopicTarget =
            Math.max(
                1,
                getDailyTopicTarget(
                    plan,
                    totalTopics
                ) * 7
            );

        const weeklyTopicPercent =
            clamp(
                (weeklyCompleted /
                    weeklyTopicTarget) * 100,
                0,
                100
            );

        if ($("weeklyHours")) {

            $("weeklyHours").textContent =
                weeklyHours.toFixed(
                    weeklyHours % 1 === 0
                        ? 0
                        : 1
                );
        }

        if ($("weeklyTargetHours")) {

            $("weeklyTargetHours").textContent =
                formatHours(
                    weeklyTargetHours
                );
        }

        if ($("weeklyHoursProgress")) {

            $("weeklyHoursProgress").style.width =
                `${weeklyHoursPercent}%`;
        }

        if ($("weeklyHoursMessage")) {

            if (
                weeklyHours >=
                weeklyTargetHours
            ) {

                $("weeklyHoursMessage").textContent =
                    "You've reached your weekly study-time target!";

            } else {

                const remaining =
                    Math.max(
                        0,
                        weeklyTargetHours -
                        weeklyHours
                    );

                $("weeklyHoursMessage").textContent =
                    `${formatHours(
                        remaining
                    )} remaining this week.`;
            }
        }

        if ($("weeklyDays")) {

            $("weeklyDays").textContent =
                activeDays;
        }

        if ($("weeklyDaysTarget")) {

            $("weeklyDaysTarget").textContent =
                7;
        }

        if ($("weeklyDaysProgress")) {

            $("weeklyDaysProgress").style.width =
                `${clamp(
                    (activeDays / 7) * 100,
                    0,
                    100
                )}%`;
        }

        if ($("weeklyTopics")) {

            $("weeklyTopics").textContent =
                weeklyCompleted;
        }

        if ($("weeklyTopicsProgress")) {

            $("weeklyTopicsProgress").style.width =
                `${weeklyTopicPercent}%`;
        }

        if ($("weeklyTopicsMessage")) {

            if (
                weeklyCompleted >=
                weeklyTopicTarget
            ) {

                $("weeklyTopicsMessage").textContent =
                    "Weekly topic target complete!";

            } else {

                const remaining =
                    Math.max(
                        0,
                        weeklyTopicTarget -
                        weeklyCompleted
                    );

                $("weeklyTopicsMessage").textContent =
                    `${remaining} topic${
                        remaining === 1
                            ? ""
                            : "s"
                    } remaining toward this week's target.`;
            }
        }
    }


    /* =====================================================
       PLAN PROGRESS
    ===================================================== */

    function updatePlanProgress(
        plan,
        metrics
    ) {

        const topics =
            getAllPlanTopics(plan);

        const completed =
            getCompletedTopics();

        const total =
            topics.length;

        const completedCount =
            topics.filter(
                topic =>
                    isTopicCompleted(
                        topic,
                        completed
                    )
            ).length;

        const percent =
            total > 0
                ? clamp(
                    (completedCount /
                        total) * 100,
                    0,
                    100
                )
                : 0;

        let planProgress =
            number(
                metrics?.planProgress,
                percent
            );

        if (
            !Number.isFinite(planProgress) ||
            planProgress < 0
        ) {
            planProgress = percent;
        }

        planProgress =
            clamp(
                planProgress,
                0,
                100
            );

        const planName =
            plan?.name ||
            plan?.planName ||
            plan?.title ||
            plan?.examType ||
            "Current Study Plan";

        const description =
            plan?.description ||
            plan?.curriculum ||
            (
                plan
                    ? "Your current study plan progress."
                    : "Create a study plan to start tracking your goals."
            );

        if ($("planName")) {

            $("planName").textContent =
                plan
                    ? planName
                    : "No active study plan";
        }

        if ($("planDescription")) {

            $("planDescription").textContent =
                plan
                    ? description
                    : "Create a study plan to start tracking your goals.";
        }

        if ($("planCompleted")) {

            $("planCompleted").textContent =
                completedCount;
        }

        if ($("planTotal")) {

            $("planTotal").textContent =
                total;
        }

        if ($("planProgress")) {

            $("planProgress").style.width =
                `${planProgress}%`;
        }

        if ($("planPercent")) {

            $("planPercent").textContent =
                `${Math.round(
                    planProgress
                )}%`;
        }
    }


    /* =====================================================
       SUBJECT GOALS
    ===================================================== */

    function updateSubjectGoals(plan) {

        const container =
            $("subjectGoals");

        if (!container) {
            return;
        }

        const subjects =
            getPlanSubjects(plan);

        const completed =
            getCompletedTopics();

        if (!subjects.length) {

            container.innerHTML = `
                <div class="subject-empty">
                    <strong>No subject data yet</strong>
                    <p>Create a study plan to see subject progress.</p>
                </div>
            `;

            return;
        }

        container.innerHTML =
            subjects.map(
                (subject, index) => {

                    const subjectName =
                        getSubjectName(
                            subject
                        );

                    const topics =
                        getSubjectTopics(
                            subject
                        );

                    const total =
                        topics.length;

                    const completedCount =
                        topics.filter(
                            topic => {

                                const topicName =
                                    getTopicName(
                                        topic
                                    );

                                if (!topicName) {
                                    return false;
                                }

                                return isTopicCompleted(
                                    {
                                        subject:
                                            subjectName,

                                        topic:
                                            topicName,

                                        key:
                                            `${subjectName}::${topicName}`
                                    },
                                    completed
                                );
                            }
                        ).length;

                    const percent =
                        total > 0
                            ? clamp(
                                (completedCount /
                                    total) * 100,
                                0,
                                100
                            )
                            : 0;

                    const initials =
                        subjectName
                            .trim()
                            .split(/\s+/)
                            .slice(0, 2)
                            .map(
                                word =>
                                    word.charAt(0)
                            )
                            .join("")
                            .toUpperCase();

                    return `
                        <article class="subject-card">

                            <div class="subject-card-top">

                                <div class="subject-icon">
                                    ${escapeHTML(
                                        initials ||
                                        String(index + 1)
                                    )}
                                </div>

                                <div class="subject-info">

                                    <h3>
                                        ${escapeHTML(
                                            subjectName
                                        )}
                                    </h3>

                                    <span>
                                        ${completedCount}
                                        of
                                        ${total}
                                        topics
                                    </span>

                                </div>

                                <strong class="subject-percent">
                                    ${Math.round(
                                        percent
                                    )}%
                                </strong>

                            </div>

                            <div class="subject-progress">
                                <div
                                    style="width:${percent}%"
                                ></div>
                            </div>

                        </article>
                    `;
                }
            ).join("");
    }


    /* =====================================================
       ACHIEVEMENTS
    ===================================================== */

    function updateAchievements(
        plan,
        metrics
    ) {

        const completed =
            getCompletedTopics();

        const topics =
            getAllPlanTopics(plan);

        const completedCount =
            topics.filter(
                topic =>
                    isTopicCompleted(
                        topic,
                        completed
                    )
            ).length;

        const effectiveCount =
            topics.length
                ? completedCount
                : completed.length;

        const streak =
            getCurrentStreak();

        const achievementRules = [

            {
                id: "achievementFirst",
                unlocked:
                    effectiveCount >= 1
            },

            {
                id: "achievementFive",
                unlocked:
                    effectiveCount >= 5
            },

            {
                id: "achievementTen",
                unlocked:
                    effectiveCount >= 10
            },

            {
                id: "achievementSeven",
                unlocked:
                    streak >= 7
            }

        ];

        achievementRules.forEach(
            rule => {

                const element =
                    $(rule.id);

                if (!element) {
                    return;
                }

                element.classList.toggle(
                    "unlocked",
                    rule.unlocked
                );

                element.classList.toggle(
                    "completed",
                    rule.unlocked
                );
            }
        );
    }


    /* =====================================================
       EMPTY PLAN
    ===================================================== */

    function updateEmptyPlan(plan) {

        const empty =
            $("emptyPlan");

        if (!empty) {
            return;
        }

        empty.hidden = !!plan;
    }


    /* =====================================================
       TOAST
    ===================================================== */

    function showToast(message) {

        const toast =
            $("toast");

        if (!toast) {
            return;
        }

        toast.textContent =
            message;

        toast.classList.add("show");

        clearTimeout(
            showToast.timeout
        );

        showToast.timeout =
            setTimeout(
                () => {

                    toast.classList.remove(
                        "show"
                    );

                },
                2500
            );
    }


    /* =====================================================
       THEME
    ===================================================== */

    function applyTheme(theme) {

        const isDark =
            theme === "dark";

        document.body.classList.toggle(
            "dark",
            isDark
        );

        const icon =
            $("themeIcon");

        if (icon) {

            icon.textContent =
                isDark
                    ? "☀"
                    : "☾";
        }
    }

    function getStoredTheme() {

        const modern =
            localStorage.getItem(
                THEME_KEY
            );

        if (
            modern === "dark" ||
            modern === "light"
        ) {
            return modern;
        }

        const old =
            localStorage.getItem(
                OLD_THEME_KEY
            );

        if (old === "true") {
            return "dark";
        }

        if (old === "false") {
            return "light";
        }

        return "light";
    }

    function setTheme(theme) {

        const normalized =
            theme === "dark"
                ? "dark"
                : "light";

        localStorage.setItem(
            THEME_KEY,
            normalized
        );

        localStorage.setItem(
            OLD_THEME_KEY,
            normalized === "dark"
                ? "true"
                : "false"
        );

        applyTheme(
            normalized
        );
    }

    function toggleTheme() {

        const current =
            getStoredTheme();

        const next =
            current === "dark"
                ? "light"
                : "dark";

        setTheme(next);
    }

    function setupTheme() {

        applyTheme(
            getStoredTheme()
        );

        const button =
            $("themeButton");

        if (!button) {
            return;
        }

        if (
            button.dataset.themeBound ===
            "true"
        ) {
            return;
        }

        button.dataset.themeBound =
            "true";

        button.addEventListener(
            "click",
            toggleTheme
        );
    }


    /* =====================================================
       MOBILE SIDEBAR
    ===================================================== */

    function setupMobileMenu() {

        const button =
            $("mobileMenu");

        const sidebar =
            $("sidebar");

        if (!button || !sidebar) {
            return;
        }

        if (
            button.dataset.menuBound ===
            "true"
        ) {
            return;
        }

        button.dataset.menuBound =
            "true";

        button.addEventListener(
            "click",
            () => {

                sidebar.classList.toggle(
                    "open"
                );
            }
        );

        sidebar
            .querySelectorAll("a")
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


    /* =====================================================
       STORAGE EVENT
    ===================================================== */

    function setupStorageListener() {

        if (
            window.__studyMindGoalsStorageBound
        ) {
            return;
        }

        window.__studyMindGoalsStorageBound =
            true;

        window.addEventListener(
            "storage",
            event => {

                const relevantKeys = [

                    PLAN_KEY,
                    PLANS_KEY,
                    ACTIVE_PLAN_KEY,
                    COMPLETED_TOPICS_KEY,
                    STREAK_ACTIVITY_KEY,
                    STUDY_HISTORY_KEY,
                    USER_KEY,
                    THEME_KEY,
                    OLD_THEME_KEY

                ];

                if (
                    relevantKeys.includes(
                        event.key
                    )
                ) {

                    refresh();
                }
            }
        );
    }


    /* =====================================================
       CUSTOM STUDYMIND EVENTS
    ===================================================== */

    function setupCustomEvents() {

        if (
            window.__studyMindGoalsEventsBound
        ) {
            return;
        }

        window.__studyMindGoalsEventsBound =
            true;

        [
            "studyMindPlanUpdated",
            "studyMindPlanChanged",
            "studyMindTopicCompleted",
            "studyMindStudyActivity",
            "studyMindScoreUpdated",
            "studyMindPremiumChanged",
            "studyMindUserUpdated"
        ].forEach(
            eventName => {

                window.addEventListener(
                    eventName,
                    () => refresh()
                );
            }
        );
    }


    /* =====================================================
       MAIN REFRESH
    ===================================================== */

    function refresh() {

        const plan =
            getActivePlan();

        const metrics =
            getScoreMetrics();

        updateGreeting();
        updateDate();
        updateWeekRange();
        updateUsername();

        updateTodayGoals(
            plan,
            metrics
        );

        updateWeeklyGoals(
            plan,
            metrics
        );

        updatePlanProgress(
            plan,
            metrics
        );

        updateSubjectGoals(
            plan
        );

        updateAchievements(
            plan,
            metrics
        );

        updateEmptyPlan(
            plan
        );
    }


    /* =====================================================
       INIT
    ===================================================== */

    function init() {

        setupTheme();

        setupMobileMenu();

        setupStorageListener();

        setupCustomEvents();

        refresh();

        setInterval(
            refresh,
            30000
        );
    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.StudyMindGoals = {

        refresh,

        getActivePlan,

        getCompletedTopics,

        getCurrentStreak,

        getTodayStudyHours,

        getWeeklyStudyHours,

        toggleTheme,

        setTheme

    };


    /* =====================================================
       START
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    } else {

        init();
    }

})();
