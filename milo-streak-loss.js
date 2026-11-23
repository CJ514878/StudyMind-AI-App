
"use strict";

/* =========================================================
   STUDYMIND AI — MILO STREAK LOSS
   ---------------------------------------------------------
   Responsibilities:
   - React when a genuine streak loss occurs.
   - Preserve Milo's sad animations and sounds.
   - Display the broken-heart popup.
   - Save pending loss notifications across page navigation.
   - Recover notifications when the user returns.
   - Prevent duplicate loss notifications.

   Streak calculation remains in streak.js.
========================================================= */

(function () {

    /* =====================================================
       STORAGE KEYS
    ===================================================== */

    const LAST_LOSS_KEY =
        "studyMindLastStreakLossDate";

    const LAST_LOSS_EVENT_KEY =
        "studyMindLastStreakLossEvent";

    const PENDING_LOSS_KEY =
        "studyMindPendingStreakLoss";


    let retryTimer = null;
    let retryAttempts = 0;

    const MAX_RETRY_ATTEMPTS = 60;


    /* =====================================================
       DATE
    ===================================================== */

    function todayKey() {

        const date = new Date();

        const year = date.getFullYear();

        const month = String(
            date.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            date.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;

    }


    /* =====================================================
       STORAGE HELPERS
    ===================================================== */

    function getPendingLoss() {

        try {

            const stored =
                localStorage.getItem(PENDING_LOSS_KEY);

            return stored
                ? JSON.parse(stored)
                : null;

        } catch (error) {

            console.warn(
                "StudyMind: Could not read pending streak loss.",
                error
            );

            return null;

        }

    }


    function savePendingLoss(data) {

        try {

            localStorage.setItem(
                PENDING_LOSS_KEY,
                JSON.stringify(data)
            );

            return true;

        } catch (error) {

            console.warn(
                "StudyMind: Could not save pending streak loss.",
                error
            );

            return false;

        }

    }


    function clearPendingLoss() {

        localStorage.removeItem(
            PENDING_LOSS_KEY
        );

    }


    /* =====================================================
       EVENT IDENTIFICATION
    ===================================================== */

    function createLossEventId(detail, previousStreak) {

        if (detail.eventId) {

            return String(detail.eventId);

        }


        const date =
            detail.date ||
            detail.lossDate ||
            todayKey();


        return [
            date,
            "streak-loss",
            previousStreak
        ].join("-");

    }


    /* =====================================================
       MILO SAD SOUND
    ===================================================== */

    function playSadSound() {

        try {

            if (!window.Milo) {
                return;
            }


            if (
                typeof window.Milo.playSad ===
                "function"
            ) {

                window.Milo.playSad();

                return;

            }


            if (
                typeof window.Milo.playWrong ===
                "function"
            ) {

                window.Milo.playWrong();

                return;

            }


            if (
                typeof window.Milo.playSound ===
                "function"
            ) {

                window.Milo.playSound("wrong");

            }

        } catch (error) {

            console.warn(
                "Milo sad sound failed:",
                error
            );

        }

    }


    /* =====================================================
       MILO SAD ANIMATION
    ===================================================== */

    function makeMiloSad() {

        try {

            if (!window.Milo) {

                console.warn(
                    "StudyMind: Milo is not available yet."
                );

                return false;

            }


            if (
                typeof window.Milo.cry ===
                "function"
            ) {

                window.Milo.cry();

            }


            if (
                typeof window.Milo.sad ===
                "function"
            ) {

                window.Milo.sad();

            }


            if (
                typeof window.Milo.shakeHead ===
                "function"
            ) {

                window.Milo.shakeHead();

            }


            playSadSound();


            window.dispatchEvent(
                new CustomEvent(
                    "studyMindMiloStreakLoss",
                    {
                        detail: {
                            source: "milo-streak-loss"
                        }
                    }
                )
            );


            return true;

        } catch (error) {

            console.warn(
                "Milo sad animation failed:",
                error
            );

            return false;

        }

    }


    /* =====================================================
       BROKEN-HEART POPUP
    ===================================================== */

    function showLossPopup(previousStreak) {

        if (!document.body) {
            return;
        }


        let popup =
            document.getElementById(
                "miloStreakLossPopup"
            );


        if (!popup) {

            popup =
                document.createElement("div");


            popup.id =
                "miloStreakLossPopup";


            popup.innerHTML = `

                <div class="milo-streak-loss-card">

                    <div class="milo-loss-milo">

                        <div class="milo-sad-face">
                            😢
                        </div>

                    </div>


                    <div class="milo-loss-fire">
                        💔
                    </div>


                    <div class="milo-loss-title">
                        Streak Lost
                    </div>


                    <div class="milo-loss-message">
                        Your ${previousStreak}-day streak has ended.
                    </div>


                    <div class="milo-loss-encouragement">
                        Don't worry. Let's start a new streak today!
                    </div>


                    <button
                        type="button"
                        id="miloStreakLossClose"
                    >
                        Start Again 🔥
                    </button>

                </div>

            `;


            document.body.appendChild(popup);


            const closeButton =
                popup.querySelector(
                    "#miloStreakLossClose"
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


        const message =
            popup.querySelector(
                ".milo-loss-message"
            );


        if (message) {

            message.textContent =
                `Your ${previousStreak}-day streak has ended.`;

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
                8000
            );

    }


    /* =====================================================
       COMPLETE STREAK LOSS NOTIFICATION
    ===================================================== */

    function completeLoss(data) {

        if (!data || !data.eventId) {
            return false;
        }


        const previousStreak =
            Number(data.previousStreak) || 0;


        if (previousStreak <= 0) {

            clearPendingLoss();

            return true;

        }


        const lastEvent =
            localStorage.getItem(
                LAST_LOSS_EVENT_KEY
            );


        /*
           Prevent the same event from being displayed twice.
        */

        if (lastEvent === data.eventId) {

            clearPendingLoss();

            return true;

        }


        /*
           Wait until Milo and the page are ready.

           This ensures that the sad animation and sound
           are not silently skipped because of script order.
        */

        if (!window.Milo || !document.body) {

            return false;

        }


        /*
           Save the event before triggering animations.
        */

        localStorage.setItem(
            LAST_LOSS_EVENT_KEY,
            data.eventId
        );

        localStorage.setItem(
            LAST_LOSS_KEY,
            data.date || todayKey()
        );


        clearPendingLoss();


        console.log(
            `StudyMind: Milo reacting to the loss of a ${previousStreak}-day streak.`
        );


        makeMiloSad();

        showLossPopup(previousStreak);


        window.dispatchEvent(
            new CustomEvent(
                "studyMindStreakLossDisplayed",
                {
                    detail: {
                        previousStreak: previousStreak,
                        eventId: data.eventId
                    }
                }
            )
        );


        return true;

    }


    /* =====================================================
       PROCESS PENDING LOSS
    ===================================================== */

    function processPendingLoss() {

        const pending =
            getPendingLoss();


        if (!pending) {

            stopRetrying();

            return;

        }


        if (completeLoss(pending)) {

            stopRetrying();

            return;

        }


        /*
           Milo may not have loaded yet.
           Keep the notification and retry.
        */

        startRetrying();

    }


    /* =====================================================
       RETRY SYSTEM
    ===================================================== */

    function startRetrying() {

        if (retryTimer) {
            return;
        }


        retryAttempts = 0;


        retryTimer =
            setInterval(
                function () {

                    retryAttempts++;

                    processPendingLoss();


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
       HANDLE STREAK LOSS EVENT
    ===================================================== */

    function handleStreakLoss(event) {

        const detail =
            event && event.detail
                ? event.detail
                : {};


        const previousStreak =
            Number(detail.previousStreak) ||
            Number(detail.oldStreak) ||
            Number(detail.streak) ||
            0;


        if (previousStreak <= 0) {
            return;
        }


        const eventId =
            createLossEventId(
                detail,
                previousStreak
            );


        /*
           Avoid saving an event that has already
           been displayed.
        */

        if (
            localStorage.getItem(
                LAST_LOSS_EVENT_KEY
            ) === eventId
        ) {

            return;

        }


        const lossData = {

            eventId: eventId,

            previousStreak: previousStreak,

            date:
                detail.date ||
                detail.lossDate ||
                todayKey(),

            createdAt: Date.now()

        };


        /*
           Save immediately so navigation does not
           destroy the notification.
        */

        savePendingLoss(lossData);


        processPendingLoss();

    }


    /* =====================================================
       EVENT LISTENERS
    ===================================================== */

    window.addEventListener(
        "studyMindStreakLost",
        handleStreakLoss
    );


    /*
       Recover pending loss if another page or tab
       updates localStorage.
    */

    window.addEventListener(
        "storage",
        function (event) {

            if (
                event.key === PENDING_LOSS_KEY
            ) {

                processPendingLoss();

            }

        }
    );


    window.addEventListener(
        "pageshow",
        processPendingLoss
    );


    window.addEventListener(
        "load",
        processPendingLoss
    );


    document.addEventListener(
        "DOMContentLoaded",
        processPendingLoss
    );


    /*
       Compatibility with a Milo-ready event.
    */

    window.addEventListener(
        "studyMindMiloReady",
        processPendingLoss
    );


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.StudyMindMiloStreakLoss = {

        show: function (previousStreak) {

            previousStreak =
                Number(previousStreak) || 0;


            if (previousStreak <= 0) {
                return;
            }


            const eventId =
                [
                    todayKey(),
                    "manual-streak-loss",
                    previousStreak
                ].join("-");


            const lossData = {

                eventId: eventId,

                previousStreak: previousStreak,

                date: todayKey(),

                createdAt: Date.now()

            };


            savePendingLoss(lossData);

            processPendingLoss();

        },


        resetLossMemory: function () {

            localStorage.removeItem(
                LAST_LOSS_KEY
            );

            localStorage.removeItem(
                LAST_LOSS_EVENT_KEY
            );

            clearPendingLoss();

        },


        getPendingLoss: function () {

            return getPendingLoss();

        },


        processPendingLoss: function () {

            processPendingLoss();

        }

    };


    /* =====================================================
       INITIAL RECOVERY
    ===================================================== */

    processPendingLoss();


})();
