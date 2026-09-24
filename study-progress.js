"use strict";

/* =========================================================
   STUDYMIND AI — PLAN PROGRESS ENGINE

   PURPOSE:
   - Keeps each study plan's topic progress separate.
   - Keeps XP/streak/study history account-wide.
   - Maintains compatibility with older files that still
     read/write studyMindCompletedTopics.
   - Prevents creating a new plan from inheriting the
     previous plan's completed topics.
========================================================= */

(function () {

    const PLAN_KEY =
        "studyMindPlan";

    const PLANS_KEY =
        "studyMindPlans";

    const ACTIVE_PLAN_KEY =
        "studyMindActivePlanId";

    const DONE_KEY =
        "studyMindCompletedTopics";

    const QUESTION_DONE_KEY =
        "studyMindCompletedQuestionTopics";

    const SCORE_KEY =
        "studyMindStudyScore";

    const INDEX_KEY =
        "studyMindCurrentTopicIndex";

    let lastKnownPlanId = null;

    let lastDoneJSON = "";

    let lastQuestionDoneJSON = "";

    let lastScore = null;

    let lastIndex = null;


    /* =====================================================
       BASIC STORAGE
    ===================================================== */

    function readJSON(key, fallback) {

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


    function writeJSON(key, value) {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

    }


    function getPlans() {

        const plans =
            readJSON(
                PLANS_KEY,
                []
            );

        return Array.isArray(plans)
            ? plans
            : [];

    }


    function getActivePlanId() {

        return localStorage.getItem(
            ACTIVE_PLAN_KEY
        );

    }


    function getActivePlan() {

        const activeId =
            getActivePlanId();

        const plans =
            getPlans();


        if (
            activeId &&
            plans.length
        ) {

            const found =
                plans.find(
                    plan =>
                        plan &&
                        String(plan.id) ===
                        String(activeId)
                );

            if (found) {

                return found;

            }

        }


        const fallback =
            readJSON(
                PLAN_KEY,
                null
            );


        return fallback;

    }


    /* =====================================================
       NORMALIZE PLAN PROGRESS
    ===================================================== */

    function ensureProgress(plan) {

        if (
            !plan ||
            typeof plan !== "object"
        ) {

            return null;

        }


        if (
            !plan.progress ||
            typeof plan.progress !== "object"
        ) {

            plan.progress = {};

        }


        if (
            !Array.isArray(
                plan.progress.completedTopics
            )
        ) {

            plan.progress.completedTopics =
                Array.isArray(
                    plan.completedTopics
                )
                    ? plan.completedTopics
                    : [];

        }


        if (
            !Array.isArray(
                plan.progress.completedQuestionTopics
            )
        ) {

            plan.progress.completedQuestionTopics =
                Array.isArray(
                    plan.completedQuestionTopics
                )
                    ? plan.completedQuestionTopics
                    : [];

        }


        if (
            !Number.isFinite(
                Number(
                    plan.progress.studyScore
                )
            )
        ) {

            plan.progress.studyScore =
                Number(
                    plan.studyScore
                ) || 0;

        }


        if (
            !Number.isFinite(
                Number(
                    plan.progress.currentTopicIndex
                )
            )
        ) {

            plan.progress.currentTopicIndex =
                Number(
                    plan.currentTopicIndex
                ) || 0;

        }


        return plan;

    }


    /* =====================================================
       SAVE ACTIVE PLAN
    ===================================================== */

    function saveActivePlan(plan) {

        if (
            !plan ||
            typeof plan !== "object"
        ) {

            return;

        }


        ensureProgress(plan);


        /*
         * Keep compatibility fields synchronized.
         */

        plan.completedTopics =
            [
                ...plan.progress.completedTopics
            ];


        plan.completedQuestionTopics =
            [
                ...plan.progress.completedQuestionTopics
            ];


        plan.studyScore =
            Number(
                plan.progress.studyScore
            ) || 0;


        plan.currentTopicIndex =
            Number(
                plan.progress.currentTopicIndex
            ) || 0;


        localStorage.setItem(
            PLAN_KEY,
            JSON.stringify(plan)
        );


        const plans =
            getPlans();

        const index =
            plans.findIndex(
                item =>
                    item &&
                    String(item.id) ===
                    String(plan.id)
            );


        if (index >= 0) {

            plans[index] =
                plan;

        } else if (plan.id) {

            plans.push(plan);

        }


        localStorage.setItem(
            PLANS_KEY,
            JSON.stringify(plans)
        );

    }


    /* =====================================================
       LOAD PLAN PROGRESS INTO COMPATIBILITY KEYS
    ===================================================== */

    function loadActivePlanProgress() {

        const plan =
            ensureProgress(
                getActivePlan()
            );


        if (!plan) {

            return;

        }


        /*
         * If this is a newly created plan, its progress
         * object is authoritative.
         */

        const done =
            Array.isArray(
                plan.progress.completedTopics
            )
                ? plan.progress.completedTopics
                : [];


        const questionDone =
            Array.isArray(
                plan.progress.completedQuestionTopics
            )
                ? plan.progress.completedQuestionTopics
                : [];


        const score =
            Number(
                plan.progress.studyScore
            ) || 0;


        const index =
            Number(
                plan.progress.currentTopicIndex
            ) || 0;


        writeJSON(
            DONE_KEY,
            done
        );


        writeJSON(
            QUESTION_DONE_KEY,
            questionDone
        );


        localStorage.setItem(
            SCORE_KEY,
            String(score)
        );


        localStorage.setItem(
            INDEX_KEY,
            String(index)
        );


        lastKnownPlanId =
            plan.id
                ? String(plan.id)
                : null;


        lastDoneJSON =
            JSON.stringify(done);


        lastQuestionDoneJSON =
            JSON.stringify(questionDone);


        lastScore =
            score;


        lastIndex =
            index;

    }


    /* =====================================================
       SAVE COMPATIBILITY PROGRESS BACK INTO ACTIVE PLAN
    ===================================================== */

    function syncGlobalProgressToPlan() {

        const plan =
            ensureProgress(
                getActivePlan()
            );


        if (!plan) {

            return;

        }


        const currentPlanId =
            plan.id
                ? String(plan.id)
                : null;


        /*
         * If the active plan changed, load its progress
         * instead of copying the old plan into it.
         */

        if (
            currentPlanId !==
            lastKnownPlanId
        ) {

            loadActivePlanProgress();

            return;

        }


        const done =
            readJSON(
                DONE_KEY,
                []
            );


        const questionDone =
            readJSON(
                QUESTION_DONE_KEY,
                []
            );


        const score =
            Number(
                localStorage.getItem(
                    SCORE_KEY
                )
            ) || 0;


        const index =
            Number(
                localStorage.getItem(
                    INDEX_KEY
                )
            ) || 0;


        const doneJSON =
            JSON.stringify(
                Array.isArray(done)
                    ? done
                    : []
            );


        const questionDoneJSON =
            JSON.stringify(
                Array.isArray(questionDone)
                    ? questionDone
                    : []
            );


        /*
         * Only write when something actually changed.
         */

        if (
            doneJSON !==
            lastDoneJSON
        ) {

            plan.progress.completedTopics =
                Array.isArray(done)
                    ? [...done]
                    : [];


            lastDoneJSON =
                doneJSON;

        }


        if (
            questionDoneJSON !==
            lastQuestionDoneJSON
        ) {

            plan.progress.completedQuestionTopics =
                Array.isArray(questionDone)
                    ? [...questionDone]
                    : [];


            lastQuestionDoneJSON =
                questionDoneJSON;

        }


        if (
            score !==
            lastScore
        ) {

            plan.progress.studyScore =
                score;


            lastScore =
                score;

        }


        if (
            index !==
            lastIndex
        ) {

            plan.progress.currentTopicIndex =
                index;


            lastIndex =
                index;

        }


        /*
         * Save only if something changed.
         */

        if (
            doneJSON !==
                JSON.stringify(
                    plan.completedTopics || []
                ) ||
            questionDoneJSON !==
                JSON.stringify(
                    plan.completedQuestionTopics || []
                ) ||
            Number(
                plan.studyScore
            ) !== score ||
            Number(
                plan.currentTopicIndex
            ) !== index
        ) {

            saveActivePlan(
                plan
            );

        }

    }


    /* =====================================================
       NEW PLAN EVENT
    ===================================================== */

    window.addEventListener(
        "studyMindPlanCreated",
        function (event) {

            const planId =
                event?.detail?.planId;


            if (!planId) {

                loadActivePlanProgress();

                return;

            }


            const plans =
                getPlans();


            const plan =
                plans.find(
                    item =>
                        item &&
                        String(item.id) ===
                        String(planId)
                );


            if (!plan) {

                return;

            }


            /*
             * A genuinely new plan ALWAYS begins with
             * zero progress.
             */

            plan.progress = {

                completedTopics: [],

                completedQuestionTopics: [],

                studyScore: 0,

                currentTopicIndex: 0

            };


            plan.completedTopics = [];

            plan.completedQuestionTopics = [];

            plan.studyScore = 0;

            plan.currentTopicIndex = 0;


            saveActivePlan(
                plan
            );


            /*
             * Now replace the compatibility values with
             * the new plan's empty progress.
             */

            writeJSON(
                DONE_KEY,
                []
            );


            writeJSON(
                QUESTION_DONE_KEY,
                []
            );


            localStorage.setItem(
                SCORE_KEY,
                "0"
            );


            localStorage.setItem(
                INDEX_KEY,
                "0"
            );


            lastKnownPlanId =
                String(planId);


            lastDoneJSON =
                "[]";


            lastQuestionDoneJSON =
                "[]";


            lastScore =
                0;


            lastIndex =
                0;


            console.log(
                "StudyMind plan progress initialized:",
                planId
            );

        }
    );


    /* =====================================================
       ACTIVE PLAN CHANGED
    ===================================================== */

    window.addEventListener(
        "studyMindActivePlanChanged",
        function () {

            loadActivePlanProgress();

        }
    );


    window.addEventListener(
        "storage",
        function (event) {

            if (
                event.key ===
                ACTIVE_PLAN_KEY
            ) {

                loadActivePlanProgress();

            }

        }
    );


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.StudyMindPlanProgress = {

        getActivePlan,

        ensureProgress,

        loadActivePlanProgress,

        syncGlobalProgressToPlan,

        saveActivePlan

    };


    /* =====================================================
       INITIALIZE
    ===================================================== */

    function initialize() {

        loadActivePlanProgress();


        /*
         * Existing pages still use the old global keys.
         * Synchronize them back into the active plan.
         */

        setInterval(
            syncGlobalProgressToPlan,
            500
        );

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );

    } else {

        initialize();

    }

})();
