"use strict";

/* =========================================================
   STUDYMIND AI — STUDY SCORE ENGINE
   ---------------------------------------------------------
   SINGLE SOURCE OF TRUTH FOR STUDY PERFORMANCE

   MAX SCORE = 100

   Study time          30
   Knowledge checks    25
   Consistency         20
   Plan progress       15
   AI learning         10

   IMPORTANT:
   SCORE IS SEPARATE FROM XP.

   Creating a study plan does NOT increase:
   - Score
   - XP
   - Streak

   IMPORTANT:
   - Timer progress is counted live.
   - Knowledge checks use actual results.
   - AI score uses actual AI activity.
   - Plan progress uses the active plan.
   - XP is NEVER used to calculate Study Score.
========================================================= */


/* =========================================================
   STORAGE
========================================================= */

const SCORE_PLAN_KEY =
    "studyMindPlan";

const SCORE_PLANS_KEY =
    "studyMindPlans";

const SCORE_ACTIVE_PLAN_KEY =
    "studyMindActivePlanId";

const SCORE_COMPLETED_TOPICS_KEY =
    "studyMindCompletedTopics";

const SCORE_COMPLETED_QUESTIONS_KEY =
    "studyMindCompletedQuestionTopics";

const SCORE_KNOWLEDGE_RESULTS_KEY =
    "studyMindKnowledgeCheckResults";

const SCORE_HISTORY_KEY =
    "studyMindStudyHistory";

const SCORE_LAST_STUDY_KEY =
    "lastStudyDate";

const SCORE_DAILY_TIME_KEY =
    "studyMindDailyStudyTime";

const SCORE_SESSIONS_KEY =
    "studyMindStudySessions";

const SCORE_AI_COUNT_KEY =
    "aiQuestionCount";

const SCORE_AI_DATE_KEY =
    "aiQuestionDate";

const SCORE_KNOWLEDGE_USAGE_KEY =
    "studyMindKnowledgeCheckUsageCount";

const SCORE_STREAK_KEY =
    "studyMindStreak";

const SCORE_ACTIVITY_KEY =
    "studyMindStreakActivity";

const SCORE_VALUE_KEY =
    "studyMindStudyScore";

const SCORE_BREAKDOWN_KEY =
    "studyMindStudyScoreBreakdown";

const SCORE_TIMER_SECONDS_KEY =
    "studyMindTimerSeconds";

const SCORE_TIMER_RUNNING_KEY =
    "studyMindTimerRunning";

const SCORE_TIMER_SELECTED_KEY =
    "studyMindSelectedTimerSeconds";

const SCORE_TIMER_SESSION_START_KEY =
    "studyMindTimerSessionStart";

const SCORE_TIMER_BASE_SECONDS_KEY =
    "studyMindTimerBaseSeconds";

const SCORE_TIMER_END_KEY =
    "studyMindTimerEndTime";


/* =========================================================
   HELPERS
========================================================= */

function scoreReadJSON(key, fallback = null) {

    try {

        const raw =
            localStorage.getItem(key);

        if (!raw) {
            return fallback;
        }

        const parsed =
            JSON.parse(raw);

        return parsed ?? fallback;

    } catch (error) {

        console.warn(
            "StudyMind score storage error:",
            key,
            error
        );

        return fallback;
    }
}


function scoreWriteJSON(key, value) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

    } catch (error) {

        console.warn(
            "StudyMind score save error:",
            key,
            error
        );
    }
}


function scoreGetArray(key) {

    const value =
        scoreReadJSON(
            key,
            []
        );

    return Array.isArray(value)
        ? value
        : [];
}


function scoreGetNumber(
    key,
    fallback = 0
) {

    const raw =
        localStorage.getItem(key);

    if (
        raw === null ||
        raw === ""
    ) {

        return fallback;
    }

    const value =
        Number(raw);

    return Number.isFinite(value)
        ? value
        : fallback;
}


function scoreClamp(
    value,
    min,
    max
) {

    return Math.min(
        max,
        Math.max(
            min,
            value
        )
    );
}


function scoreTodayKey(
    date = new Date()
) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );

    return `${year}-${month}-${day}`;
}


function scoreNormalizeText(value) {

    return String(
        value ?? ""
    )
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}


function scoreTopicKey(
    subject,
    topic
) {

    return `${String(subject || "").trim()}::${String(topic || "").trim()}`;
}


function scoreNormalizeTopicKey(
    value
) {

    return scoreNormalizeText(
        value
    )
        .replace(/\s*::\s*/g, "::");
}


/* =========================================================
   PLAN
========================================================= */

function scoreGetPlan() {

    let plan =
        scoreReadJSON(
            SCORE_PLAN_KEY,
            null
        );

    const plans =
        scoreReadJSON(
            SCORE_PLANS_KEY,
            null
        );

    const activeId =
        localStorage.getItem(
            SCORE_ACTIVE_PLAN_KEY
        );

    if (
        Array.isArray(plans) &&
        plans.length
    ) {

        let active =
            null;

        if (activeId) {

            active =
                plans.find(
                    item =>
                        item &&
                        String(item.id) ===
                        String(activeId)
                );
        }

        if (!active) {

            active =
                plan &&
                plans.find(
                    item =>
                        item &&
                        String(item.id) ===
                        String(plan.id)
                );
        }

        if (!active) {

            active =
                plans[0];
        }

        if (active) {

            plan =
                active;
        }
    }

    return plan;
}


/* =========================================================
   PLAN TOPICS
   ---------------------------------------------------------
   Returns full topic records so that:

   Mathematics::Algebra

   is kept distinct from:

   Physics::Algebra
========================================================= */

function scoreExtractPlanTopicRecords(plan) {

    if (!plan) {
        return [];
    }

    const result = [];


    function addTopic(
        subject,
        value
    ) {

        let topicName = "";

        if (
            typeof value === "string"
        ) {

            topicName =
                value.trim();

        } else if (
            value &&
            typeof value === "object"
        ) {

            topicName =
                value.name ||
                value.topic ||
                value.topicName ||
                value.title ||
                value.text ||
                "";
        }

        if (!topicName) {
            return;
        }

        const safeSubject =
            subject ||
            value?.subject ||
            value?.subjectName ||
            "";

        result.push({

            subject:
                String(
                    safeSubject
                ).trim(),

            topic:
                String(
                    topicName
                ).trim(),

            key:
                scoreNormalizeTopicKey(
                    scoreTopicKey(
                        safeSubject,
                        topicName
                    )
                ),

            name:
                String(
                    topicName
                ).trim()
        });
    }


    function collectTopics(
        subject,
        value
    ) {

        if (!value) {
            return;
        }


        if (
            typeof value === "string"
        ) {

            addTopic(
                subject,
                value
            );

            return;
        }


        if (
            Array.isArray(value)
        ) {

            value.forEach(
                item => {

                    if (
                        typeof item === "string"
                    ) {

                        addTopic(
                            subject,
                            item
                        );

                        return;
                    }


                    if (
                        item &&
                        typeof item === "object"
                    ) {

                        const itemSubject =
                            item.subject ||
                            item.subjectName ||
                            subject ||
                            "";


                        if (
                            Array.isArray(
                                item.topics
                            )
                        ) {

                            collectTopics(
                                itemSubject,
                                item.topics
                            );
                        }


                        if (
                            Array.isArray(
                                item.topicList
                            )
                        ) {

                            collectTopics(
                                itemSubject,
                                item.topicList
                            );
                        }


                        if (
                            item.topic ||
                            item.topicName ||
                            item.title ||
                            item.name
                        ) {

                            addTopic(
                                itemSubject,
                                item
                            );
                        }
                    }
                }
            );

            return;
        }


        if (
            typeof value === "object"
        ) {

            Object.entries(value)
                .forEach(
                    ([key, child]) => {

                        const lowerKey =
                            String(
                                key
                            ).toLowerCase();


                        if (
                            Array.isArray(child) &&
                            (
                                lowerKey.includes("topic") ||
                                lowerKey.includes("subject")
                            )
                        ) {

                            collectTopics(
                                subject || key,
                                child
                            );

                            return;
                        }


                        if (
                            child &&
                            typeof child === "object" &&
                            (
                                lowerKey.includes("topic") ||
                                lowerKey.includes("subject")
                            )
                        ) {

                            collectTopics(
                                subject || key,
                                child
                            );

                            return;
                        }


                        if (
                            Array.isArray(child)
                        ) {

                            collectTopics(
                                subject,
                                child
                            );
                        }
                    }
                );
        }
    }


    /* -----------------------------------------------------
       NORMAL SUBJECT STRUCTURE
    ----------------------------------------------------- */

    if (
        Array.isArray(
            plan.subjects
        )
    ) {

        plan.subjects.forEach(
            subjectEntry => {

                if (
                    typeof subjectEntry === "string"
                ) {

                    addTopic(
                        "",
                        subjectEntry
                    );

                    return;
                }

                if (
                    !subjectEntry ||
                    typeof subjectEntry !== "object"
                ) {

                    return;
                }

                const subject =
                    subjectEntry.name ||
                    subjectEntry.subject ||
                    subjectEntry.subjectName ||
                    "";


                if (
                    Array.isArray(
                        subjectEntry.topics
                    )
                ) {

                    collectTopics(
                        subject,
                        subjectEntry.topics
                    );
                }


                if (
                    Array.isArray(
                        subjectEntry.topicList
                    )
                ) {

                    collectTopics(
                        subject,
                        subjectEntry.topicList
                    );
                }
            }
        );
    }


    /* -----------------------------------------------------
       FLAT TOPICS
    ----------------------------------------------------- */

    if (
        Array.isArray(
            plan.topics
        )
    ) {

        collectTopics(
            "",
            plan.topics
        );
    }


    if (
        Array.isArray(
            plan.flatTopics
        )
    ) {

        collectTopics(
            "",
            plan.flatTopics
        );
    }


    /*
     * Some generated plans store subjects as an object.
     */

    if (
        plan.subjects &&
        !Array.isArray(plan.subjects) &&
        typeof plan.subjects === "object"
    ) {

        Object.entries(
            plan.subjects
        )
        .forEach(
            ([subject, topics]) => {

                collectTopics(
                    subject,
                    topics
                );
            }
        );
    }


    /*
     * Remove duplicates.
     */

    const seen =
        new Set();

    return result.filter(
        record => {

            const key =
                record.key ||
                scoreNormalizeTopicKey(
                    record.name
                );

            if (
                seen.has(key)
            ) {

                return false;
            }

            seen.add(key);

            return true;
        }
    );
}


function scoreExtractPlanTopics(plan) {

    return scoreExtractPlanTopicRecords(
        plan
    )
    .map(
        record =>
            record.name
    );
}


/* =========================================================
   COMPLETED TOPICS
========================================================= */

function scoreGetCompletedTopicRecords() {

    const raw =
        scoreReadJSON(
            SCORE_COMPLETED_TOPICS_KEY,
            []
        );


    if (
        Array.isArray(raw)
    ) {

        return raw;
    }


    if (
        raw &&
        typeof raw === "object"
    ) {

        return Object.values(
            raw
        )
        .flat()
        .filter(Boolean);
    }


    return [];
}


/* ---------------------------------------------------------
   Convert every supported completion format into a
   normalized record.
--------------------------------------------------------- */

function scoreNormalizeCompletedTopicRecord(
    record
) {

    if (
        typeof record === "string"
    ) {

        const parts =
            record.split("::");

        if (
            parts.length >= 2
        ) {

            return {

                subject:
                    parts.shift().trim(),

                topic:
                    parts.join("::").trim(),

                key:
                    scoreNormalizeTopicKey(
                        record
                    ),

                date:
                    null
            };
        }


        return {

            subject:
                "",

            topic:
                record.trim(),

            key:
                scoreNormalizeTopicKey(
                    record
                ),

            date:
                null
        };
    }


    if (
        !record ||
        typeof record !== "object"
    ) {

        return null;
    }


    const subject =
        record.subject ||
        record.subjectName ||
        "";


    const topic =
        record.topic ||
        record.topicName ||
        record.name ||
        record.title ||
        "";


    if (!topic) {
        return null;
    }


    const explicitKey =
        record.key ||
        record.topicKey ||
        record.id ||
        "";


    const key =
        explicitKey
            ? scoreNormalizeTopicKey(
                explicitKey
            )
            : scoreNormalizeTopicKey(
                scoreTopicKey(
                    subject,
                    topic
                )
            );


    return {

        subject:
            String(
                subject
            ).trim(),

        topic:
            String(
                topic
            ).trim(),

        key,

        date:
            record.date ||
            record.completedAt ||
            record.completedDate ||
            record.timestamp ||
            null
    };
}


function scoreGetCompletedTopics() {

    const records =
        scoreGetCompletedTopicRecords();


    const normalized =
        records
            .map(
                scoreNormalizeCompletedTopicRecord
            )
            .filter(Boolean);


    const keys =
        new Set();


    normalized.forEach(
        record => {

            keys.add(
                record.key
            );


            /*
             * Keep the plain topic too for backwards
             * compatibility with older StudyMind data.
             */

            if (
                record.topic
            ) {

                keys.add(
                    scoreNormalizeText(
                        record.topic
                    )
                );
            }
        }
    );


    return [
        ...keys
    ];
}


/* =========================================================
   KNOWLEDGE CHECK COMPLETED TOPICS
========================================================= */

function scoreGetCompletedQuestions() {

    const raw =
        scoreReadJSON(
            SCORE_COMPLETED_QUESTIONS_KEY,
            []
        );


    let records = [];


    if (
        raw &&
        typeof raw === "object" &&
        !Array.isArray(raw)
    ) {

        records =
            Object.values(raw)
                .flat();

    } else if (
        Array.isArray(raw)
    ) {

        records =
            raw;
    }


    return [
        ...new Set(
            records
                .map(
                    item => {

                        if (
                            typeof item === "string"
                        ) {

                            return item;
                        }


                        if (
                            item &&
                            typeof item === "object"
                        ) {

                            return (
                                item.key ||
                                item.topicKey ||
                                item.topic ||
                                item.topicName ||
                                item.name ||
                                item.title ||
                                ""
                            );
                        }


                        return "";
                    }
                )
                .map(
                    scoreNormalizeTopicKey
                )
                .filter(Boolean)
        )
    ];
}


/* =========================================================
   KNOWLEDGE CHECK RESULTS
========================================================= */

function scoreGetKnowledgeResults() {

    const raw =
        scoreReadJSON(
            SCORE_KNOWLEDGE_RESULTS_KEY,
            []
        );


    let results = [];


    if (
        Array.isArray(raw)
    ) {

        results =
            raw;

    } else if (
        raw &&
        typeof raw === "object"
    ) {

        results =
            Object.entries(raw)
                .map(
                    ([key, value]) => {

                        if (
                            value &&
                            typeof value === "object"
                        ) {

                            return {

                                ...value,

                                key
                            };
                        }


                        return {

                            key,

                            score:
                                value
                        };
                    }
                );
    }


    return results
        .map(
            result => {

                const percentage =
                    Number(
                        result?.percentage ??
                        result?.score ??
                        result?.percent ??
                        result?.result ??
                        result?.accuracy
                    );


                if (
                    !Number.isFinite(
                        percentage
                    )
                ) {

                    return null;
                }


                const safePercentage =
                    scoreClamp(
                        percentage,
                        0,
                        100
                    );


                return {

                    ...result,

                    percentage:
                        safePercentage,

                    passed:
                        result?.passed !== undefined
                            ? Boolean(
                                result.passed
                            )
                            : safePercentage >= 60
                };
            }
        )
        .filter(Boolean);
}


/* =========================================================
   KNOWLEDGE PERFORMANCE
========================================================= */

function scoreGetKnowledgePerformance() {

    const results =
        scoreGetKnowledgeResults();


    if (
        !results.length
    ) {

        return {

            count:
                0,

            average:
                0,

            highest:
                0,

            lowest:
                0,

            passed:
                0,

            excellent:
                0,

            perfect:
                0
        };
    }


    const percentages =
        results.map(
            result =>
                result.percentage
        );


    const total =
        percentages.reduce(
            (sum, value) =>
                sum + value,
            0
        );


    const average =
        Math.round(
            total /
            percentages.length
        );


    return {

        count:
            percentages.length,

        average,

        highest:
            Math.max(
                ...percentages
            ),

        lowest:
            Math.min(
                ...percentages
            ),

        passed:
            percentages.filter(
                value =>
                    value >= 60
            ).length,

        excellent:
            percentages.filter(
                value =>
                    value >= 80
            ).length,

        perfect:
            percentages.filter(
                value =>
                    value >= 100
            ).length
    };
}


/* =========================================================
   LIVE TIMER
========================================================= */

function scoreGetLiveTimerSeconds() {

    const running =
        localStorage.getItem(
            SCORE_TIMER_RUNNING_KEY
        ) === "true";


    if (
        !running
    ) {

        return 0;
    }


    const storedEnd =
        Number(
            localStorage.getItem(
                SCORE_TIMER_END_KEY
            )
        );


    if (
        Number.isFinite(
            storedEnd
        ) &&
        storedEnd > 0
    ) {

        const remaining =
            Math.max(
                0,
                Math.ceil(
                    (
                        storedEnd -
                        Date.now()
                    ) / 1000
                )
            );


        const selected =
            scoreGetNumber(
                SCORE_TIMER_SELECTED_KEY,
                25 * 60
            );


        return Math.max(
            0,
            selected -
            remaining
        );
    }


    const base =
        scoreGetNumber(
            SCORE_TIMER_BASE_SECONDS_KEY,
            scoreGetNumber(
                SCORE_TIMER_SELECTED_KEY,
                25 * 60
            )
        );


    const start =
        Number(
            localStorage.getItem(
                SCORE_TIMER_SESSION_START_KEY
            )
        );


    if (
        !Number.isFinite(start) ||
        start <= 0
    ) {

        return 0;
    }


    return scoreClamp(
        Math.floor(
            (
                Date.now() -
                start
            ) / 1000
        ),
        0,
        Math.max(
            base,
            60 * 60 * 24
        )
    );
}


function scoreGetLiveTimerMinutes() {

    return (
        scoreGetLiveTimerSeconds() /
        60
    );
}


/* =========================================================
   STUDY TIME — DAILY
========================================================= */

function scoreGetStoredDailyMinutes(
    dateKey
) {

    const daily =
        scoreReadJSON(
            SCORE_DAILY_TIME_KEY,
            {}
        );


    if (
        typeof daily === "number"
    ) {

        return (
            dateKey === scoreTodayKey()
                ? Number(daily) || 0
                : 0
        );
    }


    if (
        !daily ||
        typeof daily !== "object" ||
        Array.isArray(daily)
    ) {

        return 0;
    }


    const value =
        daily[dateKey];


    if (
        value &&
        typeof value === "object"
    ) {

        const minutes =
            Number(
                value.minutes ??
                value.studyMinutes ??
                (
                    Number(
                        value.hours || 0
                    ) * 60
                )
            );


        return Number.isFinite(minutes)
            ? Math.max(
                0,
                minutes
            )
            : 0;
    }


    const minutes =
        Number(
            value || 0
        );


    return Number.isFinite(minutes)
        ? Math.max(
            0,
            minutes
        )
        : 0;
}


function scoreGetHistoryMinutes(
    dateKey
) {

    const history =
        scoreReadJSON(
            SCORE_HISTORY_KEY,
            {}
        );


    if (
        !history ||
        typeof history !== "object" ||
        Array.isArray(history)
    ) {

        return 0;
    }


    const value =
        history[dateKey];


    if (
        typeof value === "number"
    ) {

        /*
         * Older StudyMind history stored hours.
         */

        return Math.max(
            0,
            value * 60
        );
    }


    if (
        value &&
        typeof value === "object"
    ) {

        if (
            value.minutes !== undefined
        ) {

            return Math.max(
                0,
                Number(
                    value.minutes
                ) || 0
            );
        }


        if (
            value.studyMinutes !== undefined
        ) {

            return Math.max(
                0,
                Number(
                    value.studyMinutes
                ) || 0
            );
        }


        if (
            value.hours !== undefined
        ) {

            return Math.max(
                0,
                Number(
                    value.hours
                ) * 60
            );
        }
    }


    return 0;
}


function scoreGetSessionMinutesForDate(
    dateKey
) {

    const sessions =
        scoreGetArray(
            SCORE_SESSIONS_KEY
        );


    let total =
        0;


    sessions.forEach(
        session => {

            if (
                !session ||
                typeof session !== "object"
            ) {

                return;
            }


            const rawDate =
                session.date ||
                session.completedAt ||
                session.createdAt ||
                session.startedAt;


            if (!rawDate) {
                return;
            }


            const parsed =
                new Date(
                    rawDate
                );


            if (
                Number.isNaN(
                    parsed.getTime()
                )
            ) {

                return;
            }


            if (
                scoreTodayKey(parsed) !==
                dateKey
            ) {

                return;
            }


            const minutes =
                Number(
                    session.minutes ??
                    session.durationMinutes ??
                    session.studyMinutes ??
                    0
                );


            if (
                Number.isFinite(
                    minutes
                )
            ) {

                total +=
                    Math.max(
                        0,
                        minutes
                    );
            }
        }
    );


    return total;
}


function scoreGetDailyStudyMinutes() {

    const today =
        scoreTodayKey();


    const storedDaily =
        scoreGetStoredDailyMinutes(
            today
        );


    const storedHistory =
        scoreGetHistoryMinutes(
            today
        );


    const sessionMinutes =
        scoreGetSessionMinutesForDate(
            today
        );


    /*
     * Use the greatest persisted source to avoid
     * double-counting the same session.
     */

    const persisted =
        Math.max(
            storedDaily,
            storedHistory,
            sessionMinutes
        );


    const live =
        scoreGetLiveTimerMinutes();


    /*
     * Live timer time is additional to completed
     * sessions because the current session has not
     * yet been written to studyMindStudySessions.
     */

    return Math.max(
        0,
        persisted +
        live
    );
}


/* =========================================================
   STUDY TIME — WEEK
========================================================= */

function scoreGetWeekDates() {

    const today =
        new Date();


    const day =
        today.getDay();


    const mondayOffset =
        day === 0
            ? -6
            : 1 - day;


    const monday =
        new Date(
            today
        );


    monday.setHours(
        0,
        0,
        0,
        0
    );


    monday.setDate(
        today.getDate() +
        mondayOffset
    );


    const dates = [];


    for (
        let i = 0;
        i < 7;
        i++
    ) {

        const date =
            new Date(
                monday
            );


        date.setDate(
            monday.getDate() + i
        );


        dates.push(
            scoreTodayKey(
                date
            )
        );
    }


    return dates;
}


function scoreGetWeeklyStudyMinutes() {

    const week =
        scoreGetWeekDates();


    let total =
        0;


    week.forEach(
        date => {

            const daily =
                scoreGetStoredDailyMinutes(
                    date
                );


            const history =
                scoreGetHistoryMinutes(
                    date
                );


            const sessions =
                scoreGetSessionMinutesForDate(
                    date
                );


            total +=
                Math.max(
                    daily,
                    history,
                    sessions
                );
        }
    );


    /*
     * The current live timer belongs to today.
     */

    const today =
        scoreTodayKey();


    if (
        week.includes(today)
    ) {

        const persistedToday =
            Math.max(
                scoreGetStoredDailyMinutes(today),
                scoreGetHistoryMinutes(today),
                scoreGetSessionMinutesForDate(today)
            );


        const live =
            scoreGetLiveTimerMinutes();


        /*
         * Add only live time not already persisted.
         */

        total +=
            Math.max(
                0,
                live
            );
    }


    return Math.max(
        0,
        total
    );
}


/* =========================================================
   STUDY TIME — TOTAL
========================================================= */

function scoreGetTotalStudyMinutes() {

    const daily =
        scoreReadJSON(
            SCORE_DAILY_TIME_KEY,
            {}
        );


    const history =
        scoreReadJSON(
            SCORE_HISTORY_KEY,
            {}
        );


    const totals =
        {};


    /*
     * Daily time.
     */

    if (
        typeof daily === "number"
    ) {

        totals.__legacy =
            Math.max(
                0,
                Number(daily) || 0
            );

    } else if (
        daily &&
        typeof daily === "object" &&
        !Array.isArray(daily)
    ) {

        Object.entries(
            daily
        )
        .forEach(
            ([date, value]) => {

                let minutes =
                    0;


                if (
                    value &&
                    typeof value === "object"
                ) {

                    minutes =
                        Number(
                            value.minutes ??
                            value.studyMinutes ??
                            (
                                Number(
                                    value.hours || 0
                                ) * 60
                            )
                        );

                } else {

                    minutes =
                        Number(
                            value || 0
                        );
                }


                if (
                    Number.isFinite(
                        minutes
                    )
                ) {

                    totals[date] =
                        Math.max(
                            0,
                            minutes
                        );
                }
            }
        );
    }


    /*
     * History fills only missing dates.
     */

    if (
        history &&
        typeof history === "object" &&
        !Array.isArray(history)
    ) {

        Object.entries(
            history
        )
        .forEach(
            ([date, value]) => {

                if (
                    totals[date] !== undefined
                ) {

                    return;
                }


                const minutes =
                    scoreGetHistoryMinutes(
                        date
                    );


                if (
                    Number.isFinite(
                        minutes
                    )
                ) {

                    totals[date] =
                        Math.max(
                            0,
                            minutes
                        );
                }
            }
        );
    }


    /*
     * Sessions are used to fill missing dates.
     */

    const sessions =
        scoreGetArray(
            SCORE_SESSIONS_KEY
        );


    sessions.forEach(
        session => {

            if (
                !session ||
                typeof session !== "object"
            ) {

                return;
            }


            const rawDate =
                session.date ||
                session.completedAt ||
                session.createdAt ||
                session.startedAt;


            if (!rawDate) {
                return;
            }


            const parsed =
                new Date(
                    rawDate
                );


            if (
                Number.isNaN(
                    parsed.getTime()
                )
            ) {

                return;
            }


            const date =
                scoreTodayKey(
                    parsed
                );


            const minutes =
                Number(
                    session.minutes ??
                    session.durationMinutes ??
                    session.studyMinutes ??
                    0
                );


            if (
                !Number.isFinite(
                    minutes
                )
            ) {

                return;
            }


            if (
                totals[date] === undefined
            ) {

                totals[date] =
                    Math.max(
                        0,
                        minutes
                    );

            } else {

                totals[date] =
                    Math.max(
                        totals[date],
                        Math.max(
                            0,
                            minutes
                        )
                    );
            }
        }
    );


    let total =
        Object.values(
            totals
        )
        .reduce(
            (
                sum,
                minutes
            ) =>
                sum + minutes,
            0
        );


    /*
     * Current timer time is not yet in persisted
     * records, so add it here.
     */

    total +=
        scoreGetLiveTimerMinutes();


    return Math.max(
        0,
        total
    );
}


/* =========================================================
   ACTIVITY DATES
========================================================= */

function scoreGetActivityDates() {

    const dates =
        new Set();


    /*
     * Study history.
     */

    const history =
        scoreReadJSON(
            SCORE_HISTORY_KEY,
            {}
        );


    if (
        history &&
        typeof history === "object" &&
        !Array.isArray(history)
    ) {

        Object.entries(
            history
        )
        .forEach(
            ([date, value]) => {

                if (
                    !/^\d{4}-\d{2}-\d{2}$/.test(
                        date
                    )
                ) {

                    return;
                }


                const minutes =
                    scoreGetHistoryMinutes(
                        date
                    );


                if (
                    minutes > 0
                ) {

                    dates.add(
                        date
                    );
                }
            }
        );
    }


    /*
     * Daily study time.
     */

    const daily =
        scoreReadJSON(
            SCORE_DAILY_TIME_KEY,
            {}
        );


    if (
        daily &&
        typeof daily === "object" &&
        !Array.isArray(daily)
    ) {

        Object.entries(
            daily
        )
        .forEach(
            ([date]) => {

                if (
                    !/^\d{4}-\d{2}-\d{2}$/.test(
                        date
                    )
                ) {

                    return;
                }


                if (
                    scoreGetStoredDailyMinutes(
                        date
                    ) > 0
                ) {

                    dates.add(
                        date
                    );
                }
            }
        );
    }


    /*
     * Completed sessions.
     */

    const sessions =
        scoreGetArray(
            SCORE_SESSIONS_KEY
        );


    sessions.forEach(
        session => {

            if (
                !session ||
                typeof session !== "object"
            ) {

                return;
            }


            const rawDate =
                session.date ||
                session.completedAt ||
                session.createdAt ||
                session.startedAt;


            if (!rawDate) {
                return;
            }


            const parsed =
                new Date(
                    rawDate
                );


            if (
                Number.isNaN(
                    parsed.getTime()
                )
            ) {

                return;
            }


            const minutes =
                Number(
                    session.minutes ??
                    session.durationMinutes ??
                    session.studyMinutes ??
                    0
                );


            if (
                Number.isFinite(
                    minutes
                ) &&
                minutes > 0
            ) {

                dates.add(
                    scoreTodayKey(
                        parsed
                    )
                );
            }
        }
    );


    /*
     * Streak activity.
     */

    const activity =
        scoreReadJSON(
            SCORE_ACTIVITY_KEY,
            {}
        );


    if (
        Array.isArray(activity)
    ) {

        activity.forEach(
            item => {

                const date =
                    typeof item === "string"
                        ? item
                        : item?.date;


                if (
                    date &&
                    /^\d{4}-\d{2}-\d{2}$/.test(
                        date
                    )
                ) {

                    dates.add(
                        date
                    );
                }
            }
        );

    } else if (
        activity &&
        typeof activity === "object"
    ) {

        Object.entries(
            activity
        )
        .forEach(
            ([date, value]) => {

                if (
                    /^\d{4}-\d{2}-\d{2}$/.test(
                        date
                    ) &&
                    value
                ) {

                    dates.add(
                        date
                    );
                }
            }
        );
    }


    /*
     * Current live timer counts as activity.
     */

    if (
        scoreGetLiveTimerSeconds() >= 60
    ) {

        dates.add(
            scoreTodayKey()
        );
    }


    const lastStudy =
        localStorage.getItem(
            SCORE_LAST_STUDY_KEY
        );


    if (
        lastStudy &&
        /^\d{4}-\d{2}-\d{2}$/.test(
            lastStudy
        )
    ) {

        dates.add(
            lastStudy
        );
    }


    return dates;
}


/* =========================================================
   STREAK
========================================================= */

function scoreCalculateCurrentStreak() {

    if (
        window.StudyMindStreak &&
        typeof window.StudyMindStreak
            .calculateCurrentStreak === "function"
    ) {

        const value =
            Number(
                window.StudyMindStreak
                    .calculateCurrentStreak()
            );


        if (
            Number.isFinite(
                value
            )
        ) {

            return Math.max(
                0,
                value
            );
        }
    }


    const dates =
        [
            ...scoreGetActivityDates()
        ]
        .sort()
        .reverse();


    if (
        !dates.length
    ) {

        return 0;
    }


    const today =
        scoreTodayKey();


    if (
        dates[0] !== today
    ) {

        const latest =
            new Date(
                `${dates[0]}T00:00:00`
            );


        const current =
            new Date(
                `${today}T00:00:00`
            );


        const difference =
            Math.round(
                (
                    current.getTime() -
                    latest.getTime()
                ) /
                86400000
            );


        if (
            difference > 1
        ) {

            return 0;
        }
    }


    let streak =
        1;


    for (
        let i = 0;
        i < dates.length - 1;
        i++
    ) {

        const current =
            new Date(
                `${dates[i]}T00:00:00`
            );


        const previous =
            new Date(
                `${dates[i + 1]}T00:00:00`
            );


        const difference =
            Math.round(
                (
                    current.getTime() -
                    previous.getTime()
                ) /
                86400000
            );


        if (
            difference === 1
        ) {

            streak++;

        } else {

            break;
        }
    }


    return Math.max(
        0,
        streak
    );
}


function scoreCalculateBestStreak() {

    if (
        window.StudyMindStreak &&
        typeof window.StudyMindStreak
            .calculateLongestStreak === "function"
    ) {

        const value =
            Number(
                window.StudyMindStreak
                    .calculateLongestStreak()
            );


        if (
            Number.isFinite(
                value
            )
        ) {

            return Math.max(
                0,
                value
            );
        }
    }


    if (
        window.StudyMindStreak &&
        typeof window.StudyMindStreak
            .calculateBestStreak === "function"
    ) {

        const value =
            Number(
                window.StudyMindStreak
                    .calculateBestStreak()
            );


        if (
            Number.isFinite(
                value
            )
        ) {

            return Math.max(
                0,
                value
            );
        }
    }


    const dates =
        [
            ...scoreGetActivityDates()
        ]
        .sort();


    if (
        !dates.length
    ) {

        return 0;
    }


    let best =
        1;

    let current =
        1;


    for (
        let i = 1;
        i < dates.length;
        i++
    ) {

        const previous =
            new Date(
                `${dates[i - 1]}T00:00:00`
            );


        const currentDate =
            new Date(
                `${dates[i]}T00:00:00`
            );


        const difference =
            Math.round(
                (
                    currentDate.getTime() -
                    previous.getTime()
                ) /
                86400000
            );


        if (
            difference === 1
        ) {

            current++;

        } else {

            current =
                1;
        }


        best =
            Math.max(
                best,
                current
            );
    }


    return best;
}


/* =========================================================
   DATE-BASED TOPIC COMPLETION
========================================================= */

function scoreGetCompletedTopicDates() {

    const dates =
        {};


    const records =
        scoreGetCompletedTopicRecords();


    records.forEach(
        record => {

            const normalized =
                scoreNormalizeCompletedTopicRecord(
                    record
                );


            if (!normalized) {
                return;
            }


            if (
                !normalized.date
            ) {

                return;
            }


            const parsed =
                new Date(
                    normalized.date
                );


            if (
                Number.isNaN(
                    parsed.getTime()
                )
            ) {

                return;
            }


            const key =
                scoreTodayKey(
                    parsed
                );


            dates[key] =
                (
                    dates[key] ||
                    0
                ) + 1;
        }
    );


    return dates;
}


/* =========================================================
   TODAY / WEEKLY TOPIC COUNTS
========================================================= */

function scoreGetTodayCompletedTopics() {

    const today =
        scoreTodayKey();


    const records =
        scoreGetCompletedTopicRecords();


    let count =
        0;


    records.forEach(
        record => {

            const normalized =
                scoreNormalizeCompletedTopicRecord(
                    record
                );


            if (
                !normalized?.date
            ) {

                return;
            }


            const parsed =
                new Date(
                    normalized.date
                );


            if (
                Number.isNaN(
                    parsed.getTime()
                )
            ) {

                return;
            }


            if (
                scoreTodayKey(
                    parsed
                ) === today
            ) {

                count++;
            }
        }
    );


    return count;
}


function scoreGetWeeklyCompletedTopics() {

    const week =
        new Set(
            scoreGetWeekDates()
        );


    const records =
        scoreGetCompletedTopicRecords();


    let count =
        0;


    records.forEach(
        record => {

            const normalized =
                scoreNormalizeCompletedTopicRecord(
                    record
                );


            if (
                !normalized?.date
            ) {

                return;
            }


            const parsed =
                new Date(
                    normalized.date
                );


            if (
                Number.isNaN(
                    parsed.getTime()
                )
            ) {

                return;
            }


            if (
                week.has(
                    scoreTodayKey(
                        parsed
                    )
                )
            ) {

                count++;
            }
        }
    );


    return count;
}


/* =========================================================
   WEEKLY ACTIVE DAYS
========================================================= */

function scoreGetWeeklyActiveDays() {

    const week =
        new Set(
            scoreGetWeekDates()
        );


    const activity =
        scoreGetActivityDates();


    let count =
        0;


    week.forEach(
        date => {

            if (
                activity.has(
                    date
                )
            ) {

                count++;
            }
        }
    );


    return count;
}


/* =========================================================
   PLAN PROGRESS
========================================================= */

function scoreCalculatePlanProgress(
    plan,
    completedTopics
) {

    const planRecords =
        scoreExtractPlanTopicRecords(
            plan
        );


    if (
        !planRecords.length
    ) {

        return 0;
    }


    const completedSet =
        new Set(
            (
                Array.isArray(
                    completedTopics
                )
                    ? completedTopics
                    : []
            )
            .map(
                scoreNormalizeTopicKey
            )
        );


    let completed =
        0;


    planRecords.forEach(
        record => {

            const fullKey =
                scoreNormalizeTopicKey(
                    record.key
                );


            const plainTopic =
                scoreNormalizeText(
                    record.topic
                );


            if (
                completedSet.has(
                    fullKey
                ) ||
                completedSet.has(
                    plainTopic
                )
            ) {

                completed++;
            }
        }
    );


    return Math.round(
        (
            completed /
            planRecords.length
        ) * 100
    );
}


/* =========================================================
   AI USAGE
========================================================= */

function scoreGetAIUsage() {

    const today =
        scoreTodayKey();


    const storedDate =
        localStorage.getItem(
            SCORE_AI_DATE_KEY
        );


    let aiQuestions =
        scoreGetNumber(
            SCORE_AI_COUNT_KEY,
            0
        );


    /*
     * aiQuestionCount is a daily counter in the
     * current StudyMind AI system.
     *
     * For Study Score, we also support a cumulative
     * counter if one exists.
     */

    const cumulative =
        scoreGetNumber(
            "studyMindAICumulativeUsage",
            0
        );


    if (
        storedDate &&
        storedDate !== today
    ) {

        aiQuestions =
            0;
    }


    const effectiveAI =
        Math.max(
            0,
            cumulative,
            aiQuestions
        );


    const knowledgeUsage =
        scoreGetNumber(
            SCORE_KNOWLEDGE_USAGE_KEY,
            0
        );


    return {

        aiQuestions:
            effectiveAI,

        dailyAIQuestions:
            Math.max(
                0,
                aiQuestions
            ),

        cumulativeAIQuestions:
            Math.max(
                0,
                cumulative
            ),

        knowledgeUsage:
            Math.max(
                0,
                knowledgeUsage
            ),

        total:
            effectiveAI
    };
}


/* =========================================================
   CANONICAL METRICS
========================================================= */

function getStudyMetrics() {

    const plan =
        scoreGetPlan();


    const completedTopicNames =
        scoreGetCompletedTopics();


    const planRecords =
        scoreExtractPlanTopicRecords(
            plan
        );


    const knowledge =
        scoreGetKnowledgePerformance();


    const currentStreak =
        scoreCalculateCurrentStreak();


    const bestStreak =
        scoreCalculateBestStreak();


    const todayMinutes =
        scoreGetDailyStudyMinutes();


    const weeklyMinutes =
        scoreGetWeeklyStudyMinutes();


    const totalMinutes =
        scoreGetTotalStudyMinutes();


    const todayCompleted =
        scoreGetTodayCompletedTopics();


    const weeklyCompleted =
        scoreGetWeeklyCompletedTopics();


    const weeklyActiveDays =
        scoreGetWeeklyActiveDays();


    const planProgress =
        scoreCalculatePlanProgress(
            plan,
            completedTopicNames
        );


    const ai =
        scoreGetAIUsage();


    let completedInPlan =
        0;


    planRecords.forEach(
        record => {

            const key =
                scoreNormalizeTopicKey(
                    record.key
                );


            const plain =
                scoreNormalizeText(
                    record.topic
                );


            if (
                completedTopicNames.includes(
                    key
                ) ||
                completedTopicNames.includes(
                    plain
                )
            ) {

                completedInPlan++;
            }
        }
    );


    return {

        plan,

        planTopics:
            planRecords.map(
                record =>
                    record.name
            ),

        planTopicRecords:
            planRecords,

        totalTopics:
            planRecords.length,

        completedTopics:
            completedInPlan,

        completedTopicNames,

        todayCompleted,

        weeklyCompleted,

        todayMinutes,

        weeklyMinutes,

        totalMinutes,

        currentStreak,

        bestStreak,

        weeklyActiveDays,

        planProgress,

        knowledgeCheckCount:
            knowledge.count,

        knowledgeAverage:
            knowledge.average,

        knowledgeHighest:
            knowledge.highest,

        knowledgeLowest:
            knowledge.lowest,

        knowledgePassed:
            knowledge.passed,

        knowledgeExcellent:
            knowledge.excellent,

        knowledgePerfect:
            knowledge.perfect,

        aiQuestions:
            ai.aiQuestions,

        dailyAIQuestions:
            ai.dailyAIQuestions,

        cumulativeAIQuestions:
            ai.cumulativeAIQuestions,

        knowledgeUsage:
            ai.knowledgeUsage,

        liveTimerSeconds:
            scoreGetLiveTimerSeconds(),

        liveTimerMinutes:
            scoreGetLiveTimerMinutes()
    };
}


/* =========================================================
   MAIN SCORE CALCULATION
========================================================= */

function calculateStudyScore() {

    const metrics =
        getStudyMetrics();


    /* -----------------------------------------------------
       1. STUDY TIME — 30 POINTS

       300 total minutes = 30 points.

       The current live timer is included.
    ----------------------------------------------------- */

    const studyTimeScore =
        Math.min(
            30,
            Math.round(
                (
                    metrics.totalMinutes /
                    300
                ) * 30
            )
        );


    /* -----------------------------------------------------
       2. KNOWLEDGE CHECKS — 25 POINTS

       Uses actual recorded knowledge-check results.
    ----------------------------------------------------- */

    const questionScore =
        metrics.knowledgeCheckCount > 0
            ? Math.round(
                (
                    metrics.knowledgeAverage /
                    100
                ) * 25
            )
            : 0;


    /* -----------------------------------------------------
       3. CONSISTENCY — 20 POINTS

       7-day streak = 20 points.
    ----------------------------------------------------- */

    const streakScore =
        Math.min(
            20,
            Math.round(
                (
                    metrics.currentStreak /
                    7
                ) * 20
            )
        );


    /* -----------------------------------------------------
       4. PLAN PROGRESS — 15 POINTS
    ----------------------------------------------------- */

    const planScore =
        Math.round(
            (
                metrics.planProgress /
                100
            ) * 15
        );


    /* -----------------------------------------------------
       5. AI LEARNING — 10 POINTS

       10 meaningful AI actions = 10 points.

       This is based on actual AI usage, not XP.
    ----------------------------------------------------- */

    const aiScore =
        Math.min(
            10,
            metrics.aiQuestions
        );


    const total =
        Math.min(
            100,
            Math.max(
                0,
                studyTimeScore +
                questionScore +
                streakScore +
                planScore +
                aiScore
            )
        );


    return {

        total,

        studyTimeScore,

        questionScore,

        streakScore,

        planScore,

        aiScore,

        completedTopics:
            metrics.completedTopics,

        completedQuestions:
            scoreGetCompletedQuestions()
                .length,

        currentStreak:
            metrics.currentStreak,

        bestStreak:
            metrics.bestStreak,

        planProgress:
            metrics.planProgress,

        todayMinutes:
            metrics.todayMinutes,

        weeklyMinutes:
            metrics.weeklyMinutes,

        totalMinutes:
            metrics.totalMinutes,

        liveTimerSeconds:
            metrics.liveTimerSeconds,

        liveTimerMinutes:
            metrics.liveTimerMinutes,

        todayCompleted:
            metrics.todayCompleted,

        weeklyCompleted:
            metrics.weeklyCompleted,

        weeklyActiveDays:
            metrics.weeklyActiveDays,

        totalTopics:
            metrics.totalTopics,

        aiQuestions:
            metrics.aiQuestions,

        dailyAIQuestions:
            metrics.dailyAIQuestions,

        cumulativeAIQuestions:
            metrics.cumulativeAIQuestions,

        knowledgeUsage:
            metrics.knowledgeUsage,

        knowledgeCheckCount:
            metrics.knowledgeCheckCount,

        knowledgeAverage:
            metrics.knowledgeAverage,

        knowledgeHighest:
            metrics.knowledgeHighest,

        knowledgeLowest:
            metrics.knowledgeLowest,

        knowledgePassed:
            metrics.knowledgePassed,

        knowledgeExcellent:
            metrics.knowledgeExcellent,

        knowledgePerfect:
            metrics.knowledgePerfect,

        completedTopicNames:
            metrics.completedTopicNames,

        plan:
            metrics.plan
    };
}


/* =========================================================
   SCORE STATUS
========================================================= */

function getScoreStatus(score) {

    if (
        score >= 90
    ) {

        return {

            title:
                "Elite Scholar",

            status:
                "💎 Elite Scholar",

            description:
                "Outstanding study consistency and progress.",

            tip:
                "Keep your study time, knowledge checks and consistency strong."
        };
    }


    if (
        score >= 80
    ) {

        return {

            title:
                "Excellent Progress",

            status:
                "🏆 Excellent",

            description:
                "You're building strong and consistent study habits.",

            tip:
                "Continue studying regularly and completing knowledge checks."
        };
    }


    if (
        score >= 60
    ) {

        return {

            title:
                "Good Progress",

            status:
                "📈 Good Progress",

            description:
                "You're building momentum in your study journey.",

            tip:
                "More study time and stronger knowledge-check results will raise your score."
        };
    }


    if (
        score >= 40
    ) {

        return {

            title:
                "Building Momentum",

            status:
                "🚀 Building Momentum",

            description:
                "You've started making meaningful progress.",

            tip:
                "Keep studying consistently and work through your next topics."
        };
    }


    if (
        score > 0
    ) {

        return {

            title:
                "Getting Started",

            status:
                "🌱 Getting Started",

            description:
                "Your Study Score is beginning to grow.",

            tip:
                "Complete your first study session and knowledge check."
        };
    }


    return {

        title:
            "Let's Get Started",

        status:
            "🚀 Getting Started",

        description:
            "Your Study Score will grow as you study, learn and make progress.",

        tip:
            "Start your first study session."
    };
}


/* =========================================================
   SAVE SCORE
========================================================= */

function saveStudyScore(data) {

    const oldScore =
        scoreGetNumber(
            SCORE_VALUE_KEY,
            0
        );


    localStorage.setItem(
        SCORE_VALUE_KEY,
        String(
            data.total
        )
    );


    scoreWriteJSON(
        SCORE_BREAKDOWN_KEY,
        {

            studyTime:
                data.studyTimeScore,

            questions:
                data.questionScore,

            streak:
                data.streakScore,

            plan:
                data.planScore,

            ai:
                data.aiScore,

            total:
                data.total,

            knowledgeAverage:
                data.knowledgeAverage,

            knowledgeCheckCount:
                data.knowledgeCheckCount,

            todayMinutes:
                data.todayMinutes,

            totalMinutes:
                data.totalMinutes,

            updatedAt:
                Date.now()
        }
    );


    return (
        oldScore !==
        data.total
    );
}


/* =========================================================
   UI HELPERS
========================================================= */

function updateGauge(score) {

    const gauge =
        document.getElementById(
            "scoreGauge"
        );


    if (!gauge) {
        return;
    }


    const degrees =
        Math.round(
            (
                score /
                100
            ) * 360
        );


    gauge.style.setProperty(
        "--score-progress",
        `${degrees}deg`
    );
}


function updateBar(
    id,
    percentage
) {

    const bar =
        document.getElementById(
            id
        );


    if (!bar) {
        return;
    }


    const safe =
        scoreClamp(
            Number(
                percentage
            ) || 0,
            0,
            100
        );


    bar.style.width =
        `${safe}%`;
}


/* =========================================================
   ACHIEVEMENTS
========================================================= */

function updateAchievements(data) {

    const firstTopic =
        document.getElementById(
            "achievementFirstTopic"
        ) ||
        document.getElementById(
            "achievementFirst"
        );


    const fiveTopics =
        document.getElementById(
            "achievementFiveTopics"
        ) ||
        document.getElementById(
            "achievementFive"
        );


    const sevenDays =
        document.getElementById(
            "achievementSevenDays"
        ) ||
        document.getElementById(
            "achievementSeven"
        );


    const highScore =
        document.getElementById(
            "achievementHighScore"
        );


    if (
        firstTopic
    ) {

        firstTopic.classList.toggle(
            "unlocked",
            data.completedTopics >= 1
        );
    }


    if (
        fiveTopics
    ) {

        fiveTopics.classList.toggle(
            "unlocked",
            data.completedTopics >= 5
        );
    }


    if (
        sevenDays
    ) {

        sevenDays.classList.toggle(
            "unlocked",
            data.currentStreak >= 7
        );
    }


    if (
        highScore
    ) {

        highScore.classList.toggle(
            "unlocked",
            data.total >= 80
        );
    }
}


/* =========================================================
   UPDATE SCORE UI
========================================================= */

function updateScoreUI() {

    const data =
        calculateStudyScore();


    const scoreChanged =
        saveStudyScore(
            data
        );


    const status =
        getScoreStatus(
            data.total
        );


    const score =
        document.getElementById(
            "overallScore"
        );


    const title =
        document.getElementById(
            "scoreTitle"
        );


    const description =
        document.getElementById(
            "scoreDescription"
        );


    const statusElement =
        document.getElementById(
            "scoreStatus"
        );


    if (
        score
    ) {

        score.textContent =
            data.total;
    }


    if (
        title
    ) {

        title.textContent =
            status.title;
    }


    if (
        description
    ) {

        description.textContent =
            status.description;
    }


    if (
        statusElement
    ) {

        statusElement.textContent =
            status.status;
    }


    /* -----------------------------------------------------
       TOPICS
    ----------------------------------------------------- */

    const topicsCompleted =
        document.getElementById(
            "topicsCompleted"
        );


    if (
        topicsCompleted
    ) {

        topicsCompleted.textContent =
            data.completedTopics;
    }


    const questionsCompleted =
        document.getElementById(
            "questionsCompleted"
        );


    if (
        questionsCompleted
    ) {

        questionsCompleted.textContent =
            data.completedQuestions;
    }


    const currentStreak =
        document.getElementById(
            "currentStreak"
        );


    if (
        currentStreak
    ) {

        currentStreak.textContent =
            data.currentStreak;
    }


    const planProgress =
        document.getElementById(
            "planProgress"
        );


    if (
        planProgress
    ) {

        planProgress.textContent =
            `${data.planProgress}%`;
    }


    /* -----------------------------------------------------
       KNOWLEDGE PERFORMANCE
    ----------------------------------------------------- */

    const knowledgeAverage =
        document.getElementById(
            "knowledgeAverage"
        );


    if (
        knowledgeAverage
    ) {

        knowledgeAverage.textContent =
            `${data.knowledgeAverage}%`;
    }


    const knowledgeCount =
        document.getElementById(
            "knowledgeCheckCount"
        );


    if (
        knowledgeCount
    ) {

        knowledgeCount.textContent =
            data.knowledgeCheckCount;
    }


    /* -----------------------------------------------------
       BREAKDOWN
    ----------------------------------------------------- */

    const topicScoreText =
        document.getElementById(
            "topicScoreText"
        );


    if (
        topicScoreText
    ) {

        topicScoreText.textContent =
            `${data.studyTimeScore} / 30`;
    }


    const questionScoreText =
        document.getElementById(
            "questionScoreText"
        );


    if (
        questionScoreText
    ) {

        questionScoreText.textContent =
            `${data.questionScore} / 25`;
    }


    const streakScoreText =
        document.getElementById(
            "streakScoreText"
        );


    if (
        streakScoreText
    ) {

        streakScoreText.textContent =
            `${data.streakScore} / 20`;
    }


    const planScoreText =
        document.getElementById(
            "planScoreText"
        );


    if (
        planScoreText
    ) {

        planScoreText.textContent =
            `${data.planScore} / 15`;
    }


    const aiScoreText =
        document.getElementById(
            "aiScoreText"
        );


    if (
        aiScoreText
    ) {

        aiScoreText.textContent =
            `${data.aiScore} / 10`;
    }


    /* -----------------------------------------------------
       BREAKDOWN BARS
    ----------------------------------------------------- */

    updateBar(
        "topicScoreBar",
        (
            data.studyTimeScore /
            30
        ) * 100
    );


    updateBar(
        "questionScoreBar",
        (
            data.questionScore /
            25
        ) * 100
    );


    updateBar(
        "streakScoreBar",
        (
            data.streakScore /
            20
        ) * 100
    );


    updateBar(
        "planScoreBar",
        (
            data.planScore /
            15
        ) * 100
    );


    updateBar(
        "aiScoreBar",
        (
            data.aiScore /
            10
        ) * 100
    );


    updateGauge(
        data.total
    );


    updateAchievements(
        data
    );


    /* -----------------------------------------------------
       SCORE TIP
    ----------------------------------------------------- */

    const tipTitle =
        document.getElementById(
            "scoreTipTitle"
        );


    const tipText =
        document.getElementById(
            "scoreTipText"
        );


    if (
        tipTitle
    ) {

        tipTitle.textContent =
            status.title;
    }


    if (
        tipText
    ) {

        tipText.textContent =
            status.tip;
    }


    /* -----------------------------------------------------
       STUDY MINUTES
    ----------------------------------------------------- */

    const studyMinutes =
        document.getElementById(
            "studyMinutes"
        );


    if (
        studyMinutes
    ) {

        studyMinutes.textContent =
            Math.round(
                data.totalMinutes
            );
    }


    const todayStudyMinutes =
        document.getElementById(
            "todayStudyMinutes"
        );


    if (
        todayStudyMinutes
    ) {

        todayStudyMinutes.textContent =
            Math.round(
                data.todayMinutes
            );
    }


    const aiUsage =
        document.getElementById(
            "aiUsage"
        );


    if (
        aiUsage
    ) {

        aiUsage.textContent =
            data.aiQuestions;
    }


    /*
     * Let Dashboard, Goals and other components know
     * that the canonical Study Score changed.
     */

    if (
        scoreChanged
    ) {

        window.dispatchEvent(
            new CustomEvent(
                "studyMindScoreUpdated",
                {
                    detail: {
                        score:
                            data.total,

                        breakdown: {
                            studyTime:
                                data.studyTimeScore,

                            questions:
                                data.questionScore,

                            streak:
                                data.streakScore,

                            plan:
                                data.planScore,

                            ai:
                                data.aiScore
                        }
                    }
                }
            )
        );
    }


    return data;
}


/* =========================================================
   PUBLIC SCORE API
========================================================= */

window.StudyMindScore = {

    calculate:
        calculateStudyScore,

    refresh:
        updateScoreUI,

    getScore:
        () =>
            calculateStudyScore().total,

    getBreakdown:
        calculateStudyScore,

    getStudyMinutes:
        scoreGetTotalStudyMinutes,

    getTodayMinutes:
        scoreGetDailyStudyMinutes,

    getAIUsage:
        scoreGetAIUsage,

    getKnowledgePerformance:
        scoreGetKnowledgePerformance,

    getKnowledgeResults:
        scoreGetKnowledgeResults,

    getCompletedTopics:
        scoreGetCompletedTopics,

    getCurrentStreak:
        scoreCalculateCurrentStreak,

    getPlanProgress:
        () =>
            scoreCalculatePlanProgress(
                scoreGetPlan(),
                scoreGetCompletedTopics()
            ),

    getMetrics:
        getStudyMetrics,

    getBestStreak:
        scoreCalculateBestStreak,

    getWeeklyMinutes:
        scoreGetWeeklyStudyMinutes,

    getTodayCompleted:
        scoreGetTodayCompletedTopics,

    getWeeklyCompleted:
        scoreGetWeeklyCompletedTopics,

    getWeeklyActiveDays:
        scoreGetWeeklyActiveDays,

    getPlan:
        scoreGetPlan,

    getLiveTimerSeconds:
        scoreGetLiveTimerSeconds,

    getLiveTimerMinutes:
        scoreGetLiveTimerMinutes
};


/* =========================================================
   AUTOMATIC REFRESH
========================================================= */

let scoreRefreshTimer =
    null;


function refreshScoreSoon() {

    if (
        scoreRefreshTimer
    ) {

        clearTimeout(
            scoreRefreshTimer
        );
    }


    scoreRefreshTimer =
        window.setTimeout(
            () => {

                scoreRefreshTimer =
                    null;


                try {

                    updateScoreUI();

                } catch (
                    error
                ) {

                    console.warn(
                        "Study Score refresh error:",
                        error
                    );
                }

            },
            50
        );
}


/* =========================================================
   LIVE SCORE UPDATE
   ---------------------------------------------------------
   This keeps the Study Score page responsive while
   the shared timer is running.
========================================================= */

let scoreLiveInterval =
    null;


function startScoreLiveRefresh() {

    if (
        scoreLiveInterval
    ) {

        return;
    }


    scoreLiveInterval =
        window.setInterval(
            () => {

                try {

                    const running =
                        localStorage.getItem(
                            SCORE_TIMER_RUNNING_KEY
                        ) === "true";


                    if (
                        running
                    ) {

                        updateScoreUI();
                    }

                } catch (
                    error
                ) {

                    console.warn(
                        "StudyMind live score update error:",
                        error
                    );
                }

            },
            1000
        );
}


startScoreLiveRefresh();


/* =========================================================
   STORAGE LISTENER
========================================================= */

window.addEventListener(
    "storage",
    event => {

        const importantKeys = [

            SCORE_COMPLETED_TOPICS_KEY,

            SCORE_COMPLETED_QUESTIONS_KEY,

            SCORE_KNOWLEDGE_RESULTS_KEY,

            SCORE_DAILY_TIME_KEY,

            SCORE_SESSIONS_KEY,

            SCORE_HISTORY_KEY,

            SCORE_AI_COUNT_KEY,

            SCORE_AI_DATE_KEY,

            SCORE_KNOWLEDGE_USAGE_KEY,

            SCORE_STREAK_KEY,

            SCORE_ACTIVITY_KEY,

            SCORE_PLAN_KEY,

            SCORE_PLANS_KEY,

            SCORE_ACTIVE_PLAN_KEY,

            SCORE_LAST_STUDY_KEY,

            SCORE_TIMER_SECONDS_KEY,

            SCORE_TIMER_RUNNING_KEY,

            SCORE_TIMER_SELECTED_KEY,

            SCORE_TIMER_SESSION_START_KEY,

            SCORE_TIMER_BASE_SECONDS_KEY,

            SCORE_TIMER_END_KEY
        ];


        if (
            importantKeys.includes(
                event.key
            )
        ) {

            refreshScoreSoon();
        }
    }
);


/* =========================================================
   STUDYMIND EVENTS
========================================================= */

[
    "studyMindTimerCompleted",
    "studyMindTimerChanged",
    "studyMindStreakUpdated",
    "studyMindXPUpdated",
    "studyMindKnowledgeCheckCompleted",
    "studyMindKnowledgeCheckResultsUpdated",
    "studyMindPlanCreated",
    "studyMindPlanUpdated",
    "studyMindPlanChanged",
    "studyMindProgressUpdated",
    "studyMindAIUsed",
    "studyMindStudyActivity",
    "studyMindStudyDataUpdated",
    "studyMindTimerFinished",
    "studyMindActivePlanChanged"
].forEach(
    eventName => {

        window.addEventListener(
            eventName,
            refreshScoreSoon
        );
    }
);


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        try {

            updateScoreUI();

        } catch (
            error
        ) {

            console.warn(
                "StudyMind Score initialization error:",
                error
            );
        }
    }
);


/* =========================================================
   GLOBAL SCORE THEME
========================================================= */

window.toggleScoreTheme =
    function () {

        const current =
            localStorage.getItem(
                "studyMindTheme"
            );


        const next =
            current === "light"
                ? "dark"
                : "light";


        localStorage.setItem(
            "studyMindTheme",
            next
        );


        document.body.classList.toggle(
            "light-mode",
            next === "light"
        );
    };


/* =========================================================
   LOGOUT
========================================================= */

window.logoutStudyMind =
    async function () {

        try {

            if (
                window.supabaseClient &&
                window.supabaseClient.auth
            ) {

                await window.supabaseClient
                    .auth
                    .signOut();

            } else if (
                typeof supabase !== "undefined" &&
                supabase?.auth
            ) {

                await supabase
                    .auth
                    .signOut();
            }

        } catch (
            error
        ) {

            console.warn(
                "Logout warning:",
                error
            );
        }


        window.location.href =
            "login.html";
    };
