
"use strict";

/* =========================================================
   STUDYMIND AI — MILO STREAK CELEBRATION
   ---------------------------------------------------------
   - Celebrates genuine streak increases.
   - Preserves Milo's existing animations and sounds.
   - Displays the streak popup.
   - Recovers pending celebrations across page navigation.
   - Prevents duplicate celebrations.
   - Allows celebrations after rebuilding a streak.
========================================================= */

(function () {

    const LAST_CELEBRATED_KEY =
        "studyMindLastCelebratedStreak";

    const LAST_EVENT_KEY =
        "studyMindLastCelebratedEvent";

    const PENDING_KEY =
        "studyMindPendingStreakCelebration";

    let retryTimer = null;
    let retryAttempts = 0;

    const MAX_RETRY_ATTEMPTS = 60;


    /* =====================================================
       STORAGE
    ===================================================== */

    function getCurrentStreak() {

        return Number(
            localStorage.getItem("studyMindStreak")
        ) || 0;

    }


    function getLastCelebratedStreak() {

        return Number(
            localStorage.getItem(LAST_CELEBRATED_KEY)
        ) || 0;

    }


    function getLocalDate() {

        const now = new Date();

        const year = now.getFullYear();

        const month = String(
            now.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            now.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;

    }


    function getPendingCelebration() {

        try {

            const stored =
                localStorage.getItem(PENDING_KEY);

            return stored
                ? JSON.parse(stored)
                : null;

        } catch (error) {

            console.warn(
                "Milo: Could not read pending celebration.",
                error
            );

            return null;

        }

    }


    function savePendingCelebration(data) {

        try {

            localStorage.setItem(
                PENDING_KEY,
                JSON.stringify(data)
            );

            return true;

        } catch (error) {

            console.warn(
                "Milo: Could not save pending celebration.",
                error
            );

            return false;

        }

    }


    function clearPendingCelebration() {

        localStorage.removeItem(PENDING_KEY);

    }


    /* =====================================================
       EVENT ID
    ===================================================== */

    function createEventId(
        detail,
        streak,
        previousStreak
    ) {

        if (detail.eventId) {
            return String(detail.eventId);
        }

        const date =
            detail.date ||
            detail.studyDate ||
            getLocalDate();

        return [
            date,
            previousStreak,
            streak
        ].join("-");

    }


    /* =====================================================
       SOUND
    ===================================================== */

    function playCelebrationSound() {

        try {

            if (!window.Milo) {
                return;
            }

            if (
                typeof window.Milo.playWoohoo ===
                "function"
            ) {

                window.Milo.playWoohoo();

                return;

            }

            if (
                typeof window.Milo.playSound ===
                "function"
            ) {

                window.Milo.playSound("woohoo");

            }

        } catch (error) {

            console.warn(
                "Milo celebration sound failed:",
                error
            );

        }

    }


    /* =====================================================
       MILO ANIMATION
    ===================================================== */

    function celebrateMilo(streak) {

        if (!window.Milo) {
            return false;
        }

        try {

            if (
                typeof window.Milo.celebrate ===
                "function"
            ) {

                window.Milo.celebrate();

            }

            if (
                typeof window.Milo.dance ===
                "function"
            ) {

                window.Milo.dance();

            }

            if (
                typeof window.Milo.happy ===
                "function"
            ) {

                window.Milo.happy();

            }

            if (
                typeof window.Milo.miloStudySessionComplete ===
                "function"
            ) {

                window.Milo.miloStudySessionComplete(
                    streak
                );

            }

            playCelebrationSound();

            window.dispatchEvent(
                new CustomEvent(
                    "studyMindMiloCelebrating",
                    {
                        detail: {
                            streak,
                            source: "milo-celebrating"
                        }
                    }
                )
            );

            return true;

        } catch (error) {

            console.warn(
                "Milo celebration animation failed:",
                error
            );

            return false;

        }

    }


    /* =====================================================
       POPUP
    ===================================================== */

    function showStreakPopup(streak) {

        if (!document.body) {
            return false;
        }

        let popup = document.getElementById(
            "miloStreakIncreasePopup"
        );

        if (!popup) {

            popup = document.createElement("div");

            popup.id = "miloStreakIncreasePopup";

            popup.innerHTML = `
                <div class="milo-streak-increase-card">

                    <div
                        class="milo-streak-fire"
                        aria-hidden="true"
                    >
                        🔥
                    </div>

                    <div class="milo-streak-title">
                        ${streak}-Day Streak!
                    </div>

                    <div class="milo-streak-message">
                        Amazing! Keep your streak going!
                    </div>

                    <button
                        type="button"
                        id="miloStreakIncreaseClose"
                    >
                        Keep Going 🚀
                    </button>

                </div>
            `;

            document.body.appendChild(popup);

            const closeButton = popup.querySelector(
                "#miloStreakIncreaseClose"
            );

            closeButton?.addEventListener(
                "click",
                function () {

                    popup.classList.remove("show");

                }
            );

        }

        const title = popup.querySelector(
            ".milo-streak-title"
        );

        if (title) {

            title.textContent =
                `${streak}-Day Streak!`;

        }

        popup.classList.remove("show");

        void popup.offsetWidth;

        popup.classList.add("show");

        clearTimeout(
            popup._studyMindCloseTimer
        );

        popup._studyMindCloseTimer = setTimeout(
            function () {

                popup.classList.remove("show");

            },
            7000
        );

        return true;

    }


    /* =====================================================
       COMPLETE CELEBRATION
    ===================================================== */

    function completeCelebration(data) {

        if (
            !data ||
            !data.eventId ||
            !Number(data.streak)
        ) {

            return false;

        }

        const lastEvent = localStorage.getItem(
            LAST_EVENT_KEY
        );

        /*
           Prevent the same event from being celebrated twice.
        */

        if (lastEvent === data.eventId) {

            const pending = getPendingCelebration();

            if (pending?.eventId === data.eventId) {
                clearPendingCelebration();
            }

            return true;

        }

        /*
           Wait for Milo and the page.
        */

        if (
            !window.Milo ||
            !document.body
        ) {

            return false;

        }

        /*
           Display the popup and animation before
           marking the event as completed.
        */

        const animationStarted =
            celebrateMilo(data.streak);

        const popupShown =
            showStreakPopup(data.streak);

        if (!popupShown) {
            return false;
        }

        /*
           Save the completed event.
        */

        localStorage.setItem(
            LAST_EVENT_KEY,
            data.eventId
        );

        localStorage.setItem(
            LAST_CELEBRATED_KEY,
            String(data.streak)
        );

        /*
           Only remove the pending event if it is
           still the event we just processed.
        */

        const currentPending =
            getPendingCelebration();

        if (
            currentPending?.eventId === data.eventId
        ) {

            clearPendingCelebration();

        }

        console.log(
            `StudyMind: Celebrated ${data.streak}-day streak.`
        );

        window.dispatchEvent(
            new CustomEvent(
                "studyMindStreakCelebrationDisplayed",
                {
                    detail: {
                        streak: data.streak,
                        eventId: data.eventId,
                        animationStarted
                    }
                }
            )
        );

        return true;

    }


    /* =====================================================
       PROCESS PENDING CELEBRATION
    ===================================================== */

    function processPendingCelebration() {

        const pending =
            getPendingCelebration();

        if (!pending) {

            stopRetrying();

            return;

        }

        if (completeCelebration(pending)) {

            stopRetrying();

            return;

        }

        startRetrying();

    }


    /* =====================================================
       RETRY
    ===================================================== */

    function startRetrying() {

        if (retryTimer) {
            return;
        }

        retryAttempts = 0;

        retryTimer = setInterval(
            function () {

                retryAttempts++;

                processPendingCelebration();

                if (
                    retryAttempts >= MAX_RETRY_ATTEMPTS
                ) {

                    stopRetrying();

                }

            },
            500
        );

    }


    function stopRetrying() {

        if (retryTimer) {

            clearInterval(retryTimer);

            retryTimer = null;

        }

        retryAttempts = 0;

    }


    /* =====================================================
       HANDLE STREAK INCREASE
    ===================================================== */

    function handleStreakIncrease(event) {

        const detail =
            event?.detail || {};

        const streak =
            Number(detail.streak) ||
            Number(detail.currentStreak) ||
            getCurrentStreak();

        const previousStreak =
            Number(detail.previousStreak);

        if (streak <= 0) {
            return;
        }

        if (
            Number.isFinite(previousStreak) &&
            streak <= previousStreak
        ) {

            return;

        }

        const safePreviousStreak =
            Number.isFinite(previousStreak)
                ? previousStreak
                : Math.max(0, streak - 1);

        const eventId = createEventId(
            detail,
            streak,
            safePreviousStreak
        );

        const celebration = {

            eventId,

            streak,

            previousStreak:
                safePreviousStreak,

            date:
                detail.date ||
                detail.studyDate ||
                getLocalDate(),

            createdAt: Date.now()

        };

        /*
           Save before displaying.
        */

        if (!savePendingCelebration(celebration)) {
            return;
        }

        processPendingCelebration();

    }


    /* =====================================================
       EVENT LISTENERS
    ===================================================== */

    window.addEventListener(
        "studyMindStreakIncreased",
        handleStreakIncrease
    );


    window.addEventListener(
        "storage",
        function (event) {

            if (
                event.key === PENDING_KEY ||
                event.key === null
            ) {

                processPendingCelebration();

            }

        }
    );


    window.addEventListener(
        "pageshow",
        processPendingCelebration
    );


    window.addEventListener(
        "load",
        processPendingCelebration
    );


    document.addEventListener(
        "DOMContentLoaded",
        processPendingCelebration
    );


    window.addEventListener(
        "studyMindMiloReady",
        processPendingCelebration
    );


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.StudyMindMiloCelebration = {

        celebrate: function (streak) {

            streak =
                Number(streak) ||
                getCurrentStreak();

            if (streak <= 0) {
                return;
            }

            const eventId = [
                getLocalDate(),
                "manual",
                streak,
                Date.now()
            ].join("-");

            const celebration = {

                eventId,

                streak,

                previousStreak:
                    Math.max(0, streak - 1),

                date: getLocalDate(),

                createdAt: Date.now()

            };

            savePendingCelebration(celebration);

            processPendingCelebration();

        },


        resetCelebrationMemory: function () {

            localStorage.removeItem(
                LAST_CELEBRATED_KEY
            );

            localStorage.removeItem(
                LAST_EVENT_KEY
            );

            clearPendingCelebration();

        },


        getLastCelebratedStreak:
            getLastCelebratedStreak,


        getPendingCelebration:
            getPendingCelebration,


        processPendingCelebration:
            processPendingCelebration

    };


    /* =====================================================
       INITIAL RECOVERY
    ===================================================== */

    processPendingCelebration();

})();
