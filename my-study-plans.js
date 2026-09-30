"use strict";

/* =========================================================
STUDYMIND AI — MY STUDY PLANS
-----------------------------

## IMPORTANT

• Active plan Progress follows the same live study-time
metric used by Dashboard.
• Topic completion remains separate.
• XP, streak and Study Score remain separate.
• Inactive plans keep their stored topic progress.
• Updates live while the shared timer is running.
========================================================= */

(function () {

const container =
    document.getElementById(
        "myStudyPlans"
    );


if (!container) return;


/* =====================================================
   PLAN DATA
===================================================== */

function getPlans() {

    return window
        .StudyMindPlanProgress
        ?.getPlans?.() || [];

}


function getActiveId() {

    return window
        .StudyMindPlanProgress
        ?.getActivePlanId?.() ||
        localStorage.getItem(
            "studyMindActivePlanId"
        );

}


/* =====================================================
   SECURITY
===================================================== */

function escapeHTML(value) {

    return String(
        value ?? ""
    )
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


/* =====================================================
   TOPICS
===================================================== */

function getTopics(plan) {

    if (
        Array.isArray(
            plan.topics
        )
    ) {

        return plan.topics;

    }


    if (
        Array.isArray(
            plan.subjects
        )
    ) {

        const result = [];


        plan.subjects
            .forEach(subject => {

                if (
                    subject &&
                    typeof subject ===
                        "object" &&
                    Array.isArray(
                        subject.topics
                    )
                ) {

                    subject.topics
                        .forEach(topic => {

                            result.push(
                                topic
                            );

                        });

                }

            });


        return result;

    }


    return [];

}


function getTopicName(topic) {

    if (
        typeof topic ===
            "string"
    ) {

        return topic;

    }


    return (
        topic?.name ||
        topic?.topic ||
        topic?.title ||
        ""
    );

}


/* =====================================================
   SUBJECTS
===================================================== */

function getSubjectNames(plan) {

    if (
        Array.isArray(
            plan.subjectNames
        )
    ) {

        return plan.subjectNames;

    }


    if (
        Array.isArray(
            plan.subjects
        )
    ) {

        return plan.subjects.map(
            subject => {

                if (
                    typeof subject ===
                        "string"
                ) {

                    return subject;

                }


                return (
                    subject?.name ||
                    subject?.subject ||
                    ""
                );

            }
        ).filter(Boolean);

    }


    return [];

}


/* =====================================================
   COMPLETED TOPICS
===================================================== */

function getCompletedCount(plan) {

    const progress =
        plan.progress || {};


    return Array.isArray(
        progress.completedTopics
    )
        ? progress.completedTopics.length
        : 0;

}


/* =====================================================
   STORED TOPIC PROGRESS
   -----------------------------------------------------
   Used for inactive plans.
===================================================== */

function getStoredTopicProgress(plan) {

    const total =
        getTopics(plan).length;


    if (!total) return 0;


    const completed =
        getCompletedCount(plan);


    return Math.max(
        0,
        Math.min(
            100,
            Math.round(
                (
                    completed /
                    total
                ) * 100
            )
        )
    );

}


/* =====================================================
   DASHBOARD-CANONICAL LIVE STUDY PROGRESS
   -----------------------------------------------------
   The active plan uses the same metric as Dashboard.

   Preferred source:
       StudyMindDashboard.getStudyProgress()

   Fallback:
       StudyMindScore.getMetrics()

   Final fallback:
       local timer state
===================================================== */

function getLiveStudyProgress(plan) {

    if (!plan) return 0;


    /* -------------------------------------------------
       Only the active plan follows today's live timer.
    ------------------------------------------------- */

    const activeId =
        getActiveId();


    if (
        String(plan.id) !==
        String(activeId)
    ) {

        return getStoredTopicProgress(
            plan
        );

    }


    /* -------------------------------------------------
       1. Dashboard canonical metric
    ------------------------------------------------- */

    try {

        if (
            window.StudyMindDashboard &&
            typeof
                window.StudyMindDashboard
                    .getStudyProgress ===
                "function"
        ) {

            const dashboardProgress =
                Number(
                    window
                        .StudyMindDashboard
                        .getStudyProgress()
                );


            if (
                Number.isFinite(
                    dashboardProgress
                )
            ) {

                return Math.max(
                    0,
                    Math.min(
                        100,
                        Math.round(
                            dashboardProgress
                        )
                    )
                );

            }

        }

    } catch (error) {

        console.warn(
            "StudyMind: Dashboard progress unavailable.",
            error
        );

    }


    /* -------------------------------------------------
       2. Study Score canonical metric
    ------------------------------------------------- */

    try {

        const scoreAPI =
            window.StudyMindScore;


        if (
            scoreAPI &&
            typeof
                scoreAPI.getMetrics ===
                "function"
        ) {

            const metrics =
                scoreAPI.getMetrics();


            const todayMinutes =
                Number(
                    metrics?.todayMinutes
                ) || 0;


            let targetMinutes = 120;


            /*
             * Prefer the same daily target fields
             * used by Dashboard.
             */

            const possibleTargets = [
                plan.hoursPerDay,
                plan.studyHours,
                plan.dailyHours,
                plan.dailyStudyHours,
                plan.hoursPerDayTarget,
                plan.dailyStudyTime,
                plan.studyTimePerDay
            ];


            for (
                const value
                of possibleTargets
            ) {

                const number =
                    Number(value);


                if (
                    Number.isFinite(
                        number
                    ) &&
                    number > 0
                ) {

                    /*
                     * Values <= 24 are treated as hours.
                     * Larger values are treated as minutes.
                     */

                    targetMinutes =
                        number <= 24
                            ? number * 60
                            : number;

                    break;

                }

            }


            const progress =
                (
                    todayMinutes /
                    targetMinutes
                ) * 100;


            return Math.max(
                0,
                Math.min(
                    100,
                    Math.round(
                        progress
                    )
                )
            );

        }

    } catch (error) {

        console.warn(
            "StudyMind: Study Score progress unavailable.",
            error
        );

    }


    /* -------------------------------------------------
       3. Final local timer fallback
    ------------------------------------------------- */

    try {

        const running =
            localStorage.getItem(
                "studyMindTimerRunning"
            ) === "true";


        let seconds = 0;


        const selectedSeconds =
            Number(
                localStorage.getItem(
                    "studyMindSelectedTimerSeconds"
                )
            ) || 0;


        const storedSeconds =
            Number(
                localStorage.getItem(
                    "studyMindTimerSeconds"
                )
            ) || 0;


        const endTime =
            Number(
                localStorage.getItem(
                    "studyMindTimerEndTime"
                )
            ) || 0;


        const startTime =
            Number(
                localStorage.getItem(
                    "studyMindTimerSessionStart"
                )
            ) || 0;


        if (
            running &&
            endTime > Date.now()
        ) {

            const remaining =
                Math.max(
                    0,
                    Math.ceil(
                        (
                            endTime -
                            Date.now()
                        ) / 1000
                    )
                );


            const duration =
                selectedSeconds ||
                0;


            if (duration > 0) {

                seconds =
                    Math.max(
                        0,
                        duration -
                        remaining
                    );

            }

        } else if (
            running &&
            startTime > 0
        ) {

            seconds =
                Math.max(
                    0,
                    Math.floor(
                        (
                            Date.now() -
                            startTime
                        ) / 1000
                    )
                );

        } else {

            seconds =
                Math.max(
                    0,
                    storedSeconds
                );

        }


        /*
         * Persisted study time.
         */

        const persistedMinutes =
            Number(
                localStorage.getItem(
                    "studyMindDailyStudyTime"
                )
            ) || 0;


        const liveMinutes =
            seconds / 60;


        const totalMinutes =
            Math.max(
                0,
                persistedMinutes +
                liveMinutes
            );


        /*
         * Use the plan's configured target.
         */

        let targetMinutes = 120;


        const possibleTargets = [
            plan.hoursPerDay,
            plan.studyHours,
            plan.dailyHours,
            plan.dailyStudyHours,
            plan.hoursPerDayTarget,
            plan.dailyStudyTime,
            plan.studyTimePerDay
        ];


        for (
            const value
            of possibleTargets
        ) {

            const number =
                Number(value);


            if (
                Number.isFinite(
                    number
                ) &&
                number > 0
            ) {

                targetMinutes =
                    number <= 24
                        ? number * 60
                        : number;

                break;

            }

        }


        return Math.max(
            0,
            Math.min(
                100,
                Math.round(
                    (
                        totalMinutes /
                        targetMinutes
                    ) * 100
                )
            )
        );

    } catch (error) {

        console.warn(
            "StudyMind: live timer progress fallback failed.",
            error
        );

    }


    return getStoredTopicProgress(
        plan
    );

}


/* =====================================================
   ICON
===================================================== */

function getPlanIcon(index) {

    const icons = [
        "📘",
        "📗",
        "📙",
        "📕",
        "📚",
        "🎓"
    ];


    return icons[
        index %
        icons.length
    ];

}


/* =====================================================
   OPEN PLAN
===================================================== */

function openPlan(planId) {

    const plan =
        window
            .StudyMindPlanProgress
            ?.switchPlan?.(
                planId
            );


    if (!plan) {

        alert(
            "Study plan could not be opened."
        );

        return;

    }


    /*
     * Reload so every page component reads
     * the newly active plan.
     */

    window.location.reload();

}


/* =====================================================
   DELETE PLAN
===================================================== */

function deletePlan(planId) {

    const plans =
        getPlans();


    if (plans.length <= 1) {

        alert(
            "You need to keep at least one study plan."
        );

        return;

    }


    const plan =
        plans.find(
            item =>
                String(item.id) ===
                String(planId)
        );


    if (!plan) return;


    const confirmed =
        window.confirm(
            `Delete "${plan.goal || plan.curriculum || "this study plan"}"? This cannot be undone.`
        );


    if (!confirmed) return;


    const remaining =
        plans.filter(
            item =>
                String(item.id) !==
                String(planId)
        );


    localStorage.setItem(
        "studyMindPlans",
        JSON.stringify(
            remaining
        )
    );


    const activeId =
        getActiveId();


    if (
        String(activeId) ===
        String(planId)
    ) {

        const next =
            remaining[0];


        localStorage.setItem(
            "studyMindActivePlanId",
            String(
                next.id
            )
        );


        if (
            window
                .StudyMindPlanProgress
                ?.loadActivePlanProgress
        ) {

            window
                .StudyMindPlanProgress
                .loadActivePlanProgress();

        }

    }


    render();

}


/* =====================================================
   RENDER
===================================================== */

function render() {

    const plans =
        getPlans();


    const activeId =
        getActiveId();


    if (!plans.length) {

        container.innerHTML = `

            <div class="study-plan-card">

                <h3>
                    No study plans yet
                </h3>

                <p>
                    Create your first AI study plan
                    to get started.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        plans.map(
            (plan, index) => {

                const progress =
                    plan.progress ||
                    {};


                const totalTopics =
                    getTopics(
                        plan
                    ).length;


                const completed =
                    getCompletedCount(
                        plan
                    );


                /*
                 * IMPORTANT:
                 *
                 * Active plan:
                 *     Dashboard/live study progress
                 *
                 * Inactive plan:
                 *     Stored topic progress
                 */

                const percentage =
                    getLiveStudyProgress(
                        plan
                    );


                const subjects =
                    getSubjectNames(
                        plan
                    );


                const isActive =
                    String(
                        plan.id
                    ) ===
                    String(
                        activeId
                    );


                const xp =
                    Number(
                        progress.xp
                    ) || 0;


                const streak =
                    Number(
                        progress.streak
                    ) || 0;


                const score =
                    Number(
                        progress.studyScore
                    ) || 0;


                const title =
                    plan.goal ||
                    plan.examType ||
                    plan.curriculum ||
                    "Study Plan";


                return `

                    <article
                        class="study-plan-card ${
                            isActive
                                ? "active"
                                : ""
                        }"
                    >

                        <div
                            class="study-plan-card-header"
                        >

                            <div
                                class="study-plan-icon"
                            >
                                ${getPlanIcon(index)}
                            </div>

                            ${
                                isActive
                                    ? `
                                        <span
                                            class="study-plan-active"
                                        >
                                            ✓ Active
                                        </span>
                                    `
                                    : ""
                            }

                        </div>


                        <h3>
                            ${escapeHTML(
                                title
                            )}
                        </h3>


                        <p
                            class="study-plan-subjects"
                        >
                            ${escapeHTML(
                                subjects
                                    .slice(0, 3)
                                    .join(" • ") ||
                                plan.curriculum ||
                                "Custom plan"
                            )}
                        </p>


                        <div
                            class="study-plan-progress"
                        >

                            <div
                                class="study-plan-progress-label"
                            >

                                <span>
                                    Progress
                                </span>

                                <strong>
                                    ${percentage}%
                                </strong>

                            </div>


                            <div
                                class="study-plan-progress-bar"
                            >

                                <div
                                    class="study-plan-progress-fill"
                                    style="width:${percentage}%"
                                ></div>

                            </div>

                        </div>


                        <div
                            class="study-plan-stats"
                        >

                            <div
                                class="study-plan-stat"
                            >

                                <strong>
                                    ${xp} XP
                                </strong>

                                <span>
                                    Plan XP
                                </span>

                            </div>


                            <div
                                class="study-plan-stat"
                            >

                                <strong>
                                    🔥 ${streak}
                                </strong>

                                <span>
                                    Day streak
                                </span>

                            </div>


                            <div
                                class="study-plan-stat"
                            >

                                <strong>
                                    ${completed}/${totalTopics}
                                </strong>

                                <span>
                                    Topics
                                </span>

                            </div>


                            <div
                                class="study-plan-stat"
                            >

                                <strong>
                                    ${score}/100
                                </strong>

                                <span>
                                    Study score
                                </span>

                            </div>

                        </div>


                        <div
                            class="study-plan-actions"
                        >

                            <button
                                type="button"
                                class="study-plan-open"
                                data-open-plan="${escapeHTML(
                                    plan.id
                                )}"
                            >
                                ${
                                    isActive
                                        ? "Open Active Plan"
                                        : "Switch to Plan"
                                }
                            </button>


                            <button
                                type="button"
                                class="study-plan-delete"
                                title="Delete study plan"
                                data-delete-plan="${escapeHTML(
                                    plan.id
                                )}"
                            >
                                🗑️
                            </button>

                        </div>

                    </article>

                `;

            }
        ).join("");


    /* =================================================
       OPEN BUTTONS
    ================================================= */

    container
        .querySelectorAll(
            "[data-open-plan]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    openPlan(
                        button.dataset.openPlan
                    );

                }
            );

        });


    /* =================================================
       DELETE BUTTONS
    ================================================= */

    container
        .querySelectorAll(
            "[data-delete-plan]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deletePlan(
                        button.dataset.deletePlan
                    );

                }
            );

        });

}


/* =====================================================
   LIVE UPDATE EVENTS
===================================================== */

window.addEventListener(
    "studyMindProgressUpdated",
    render
);


window.addEventListener(
    "studyMindActivePlanChanged",
    render
);


window.addEventListener(
    "studyMindPlanCreated",
    render
);


window.addEventListener(
    "studyMindTimerStarted",
    render
);


window.addEventListener(
    "studyMindTimerResumed",
    render
);


window.addEventListener(
    "studyMindTimerPaused",
    render
);


window.addEventListener(
    "studyMindTimerReset",
    render
);


window.addEventListener(
    "studyMindStudyTimeUpdated",
    render
);


window.addEventListener(
    "studyMindScoreUpdated",
    render
);


/* =====================================================
   STORAGE EVENTS
===================================================== */

window.addEventListener(
    "storage",
    event => {

        if (
            event.key ===
                "studyMindPlans" ||
            event.key ===
                "studyMindActivePlanId" ||
            event.key ===
                "studyMindDailyStudyTime" ||
            event.key ===
                "studyMindTimerRunning" ||
            event.key ===
                "studyMindTimerEndTime" ||
            event.key ===
                "studyMindTimerSeconds" ||
            event.key ===
                "studyMindSelectedTimerSeconds"
        ) {

            render();

        }

    }
);


/* =====================================================
   LOCAL LIVE REFRESH
   -----------------------------------------------------
   This makes the card update even if another component
   does not dispatch a progress event every second.
===================================================== */

let liveRefreshInterval = null;


function startLiveRefresh() {

    if (liveRefreshInterval) {

        clearInterval(
            liveRefreshInterval
        );

    }


    liveRefreshInterval =
        window.setInterval(
            () => {

                const running =
                    localStorage.getItem(
                        "studyMindTimerRunning"
                    ) === "true";


                if (running) {

                    render();

                }

            },
            1000
        );

}


startLiveRefresh();


/* =====================================================
   INITIAL RENDER
===================================================== */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        render
    );

} else {

    render();

}


})();
