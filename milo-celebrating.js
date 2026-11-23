
"use strict";

/* =========================================================
   STUDYMIND AI — MILO STREAK CELEBRATION
   ---------------------------------------------------------
   Responsibilities:
   - Celebrate genuine streak increases.
   - Preserve Milo's existing sounds and animations.
   - Display the streak celebration popup.
   - Save pending celebrations across page navigation.
   - Prevent duplicate celebrations.
   - Allow celebrations again after a streak is rebuilt.

   Streak calculation and storage remain in streak.js.
========================================================= */

(function () {

    /* =====================================================
       STORAGE KEYS
    ===================================================== */

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
       STORAGE HELPERS
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


    function setLastCelebratedStreak(value) {

        localStorage.setItem(
            LAST_CELEBRATED_KEY,
            String(value)
        );

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
                "StudyMind: Could not read pending celebration.",
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
                "StudyMind: Could not save pending celebration.",
                error
            );

            return false;

        }

    }


    function clearPendingCelebration() {

        localStorage.removeItem(PENDING_KEY);

    }


    /* =====================================================
       CELEBRATION EVENT ID
    ===================================================== */

    function createEventId(detail, streak, previousStreak) {

        /*
           Prefer an ID supplied by the streak engine.
        */

        if (detail.eventId) {

            return String(detail.eventId);

        }


        /*
           Otherwise use the study date and streak change.

           This allows the same streak number to be
           celebrated again after a future streak rebuild.
        */

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

        try {

            if (!window.Milo) {

                console.warn(
                    "StudyMind: Milo is not available yet."
                );

                return false;

            }


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
                            streak: streak,
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
       STREAK POPUP
    ===================================================== */

    function showStreakPopup(streak) {

        if (!document.body) {
            return;
        }


        let popup =
            document.getElementById(
                "miloStreakIncreasePopup"
            );


        if (!popup) {

            popup =
                document.createElement("div");


            popup.id =
                "miloStreakIncreasePopup";


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


            const closeButton =
                popup.querySelector(
                    "#miloStreakIncreaseClose"
                );


            if (closeButton) {

                closeButton.addEventListener(
                    "click",
                    function () {

                        popup.classList.remove("show");

                    }
                );

            }

        }


        const title =
            popup.querySelector(
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


        popup._studyMindCloseTimer =
            setTimeout(
                function () {

                    popup.classList.remove("show");

                },
                7000
            );

    }


    /* =====================================================
       COMPLETE A CELEBRATION
    ===================================================== */

    function completeCelebration(data) {

        if (!data || !data.eventId) {
            return false;
        }


        const lastEvent =
            localStorage.getItem(LAST_EVENT_KEY);


        /*
           Prevent duplicate processing of the same event.

           Notice that we do NOT compare the new streak
           against the highest streak ever celebrated.
           A rebuilt streak can therefore celebrate again.
        */

        if (lastEvent === data.eventId) {

            clearPendingCelebration();

            return true;

        }


        /*
           Wait until Milo is available.

           Do not discard the pending celebration simply
           because Milo's script has not loaded yet.
        */

        if (!window.Milo) {

            return false;

        }


        if (!document.body) {

            return false;

        }


        /*
           Save the event ID before playing animations.
        */

        localStorage.setItem(
            LAST_EVENT_KEY,
            data.eventId
        );


        setLastCelebratedStreak(
            data.streak
        );


        clearPendingCelebration();


        console.log(
            `StudyMind: Milo celebrating ${data.streak}-day streak.`
        );


        celebrateMilo(data.streak);

        showStreakPopup(data.streak);


        window.dispatchEvent(
            new CustomEvent(
                "studyMindStreakCelebrationDisplayed",
                {
                    detail: {
                        streak: data.streak,
                        eventId: data.eventId
                    }
                }
            )
        );


        return true;

    }


    /* =====================================================
       PROCESS SAVED CELEBRATION
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


        /*
           Milo or the page body is not ready yet.
           Keep the pending event and retry.
        */

        startRetrying();

    }


    /* =====================================================
       RETRY WHEN MILO LOADS LATE
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
       HANDLE REAL STREAK INCREASE
    ===================================================== */

    function handleStreakIncrease(event) {

        const detail =
            event && event.detail
                ? event.detail
                : {};


        const streak =
            Number(detail.streak) ||
            Number(detail.currentStreak) ||
            getCurrentStreak();


        const previousStreak =
            Number(detail.previousStreak);


        if (streak <= 0) {
            return;
        }


        /*
           When previousStreak is supplied, verify that
           the event represents a genuine increase.
        */

        if (
            Number.isFinite(previousStreak) &&
            streak <= previousStreak
        ) {

            return;

        }


        const eventId =
            createEventId(
                detail,
                streak,
                Number.isFinite(previousStreak)
                    ? previousStreak
                    : Math.max(0, streak - 1)
            );


        const celebration = {

            eventId: eventId,

            streak: streak,

            previousStreak:
                Number.isFinite(previousStreak)
                    ? previousStreak
                    : Math.max(0, streak - 1),

            date:
                detail.date ||
                detail.studyDate ||
                getLocalDate(),

            createdAt: Date.now()

        };


        /*
           Save BEFORE trying to display it.

           If the user navigates to another page, the
           next page can recover the pending celebration.
        */

        savePendingCelebration(celebration);


        processPendingCelebration();

    }


    /* =====================================================
       LISTEN FOR STREAK EVENTS
    ===================================================== */

    window.addEventListener(
        "studyMindStreakIncreased",
        handleStreakIncrease
    );


    /*
       Recover a pending celebration when another tab
       or page updates the shared storage.
    */

    window.addEventListener(
        "storage",
        function (event) {

            if (event.key === PENDING_KEY) {

                processPendingCelebration();

            }

        }
    );


    /*
       Retry when the page becomes visible or finishes
       loading.
    */

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


    /*
       Optional compatibility event for Milo systems
       that announce when Milo becomes ready.
    */

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


            const eventId =
                [
                    getLocalDate(),
                    "manual",
                    streak
                ].join("-");


            const celebration = {

                eventId: eventId,

                streak: streak,

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


        getLastCelebratedStreak: function () {

            return getLastCelebratedStreak();

        },


        getPendingCelebration: function () {

            return getPendingCelebration();

        },


        processPendingCelebration: function () {

            processPendingCelebration();

        }

    };


    /* =====================================================
       INITIAL RECOVERY
    ===================================================== */

    processPendingCelebration();


})();
