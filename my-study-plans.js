"use strict";

/* =========================================================
   STUDYMIND AI — MY STUDY PLANS
========================================================= */

(function () {

    const container =
        document.getElementById(
            "myStudyPlans"
        );


    if (!container) return;


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


    function getCompletedCount(plan) {

        const progress =
            plan.progress || {};


        return Array.isArray(
            progress.completedTopics
        )
            ? progress.completedTopics.length
            : 0;

    }


    function getProgressPercent(plan) {

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


                    const percentage =
                        getProgressPercent(
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
        "storage",
        event => {

            if (
                event.key ===
                    "studyMindPlans" ||
                event.key ===
                    "studyMindActivePlanId"
            ) {

                render();

            }

        }
    );


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
