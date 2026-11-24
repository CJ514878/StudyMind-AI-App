
"use strict";

/* =========================================================
   STUDYMIND AI — STREAK CALENDAR CELEBRATION
   ---------------------------------------------------------
   RESPONSIBILITY:
   - Display the study-day completion overlay.
   - Render the activity calendar.
   - Animate the streak number.
   - Recover pending study-day celebrations.
   - Prevent duplicate calendar celebrations.

   DOES NOT:
   - Calculate streaks.
   - Award XP.
   - Play Milo sounds.
   - Trigger Milo dances.
   - Modify streak activity.

   Milo's streak-increase handler owns those effects.
========================================================= */

(function () {

    const OVERLAY_ID =
        "studyMindStreakCelebration";

    const PENDING_KEY =
        "studyMindPendingStudyDayCelebration";

    const LAST_DISPLAYED_KEY =
        "studyMindLastStudyDayCelebrationDisplayed";

    let retryTimer = null;

    let retryAttempts = 0;

    const MAX_RETRY_ATTEMPTS = 60;


    /* =====================================================
       STORAGE
    ===================================================== */

    function getActivity() {

        try {

            return JSON.parse(
                localStorage.getItem(
                    "studyMindStreakActivity"
                )
            ) || {};

        } catch (error) {

            return {};

        }

    }


    function getCurrentStreak() {

        return Number(
            localStorage.getItem(
                "studyMindStreak"
            )
        ) || 0;

    }


    function getPendingStudyDay() {

        try {

            const stored =
                localStorage.getItem(PENDING_KEY);

            return stored
                ? JSON.parse(stored)
                : null;

        } catch (error) {

            console.warn(
                "StudyMind: Could not read pending study-day celebration.",
                error
            );

            return null;

        }

    }


    function clearPendingStudyDay(expectedEventId) {

        const pending =
            getPendingStudyDay();

        if (!pending) {
            return;
        }

        /*
           Only clear the event that was handled.
        */

        if (
            expectedEventId &&
            pending.eventId !== expectedEventId
        ) {

            return;

        }

        localStorage.removeItem(
            PENDING_KEY
        );

    }


    function getLastDisplayedEvent() {

        return localStorage.getItem(
            LAST_DISPLAYED_KEY
        );

    }


    /* =====================================================
       DATE HELPERS
    ===================================================== */

    function getTodayKey() {

        const date = new Date();

        const year = date.getFullYear();

        const month =
            String(date.getMonth() + 1)
                .padStart(2, "0");

        const day =
            String(date.getDate())
                .padStart(2, "0");

        return `${year}-${month}-${day}`;

    }


    function formatDate(date) {

        const year =
            date.getFullYear();

        const month =
            String(date.getMonth() + 1)
                .padStart(2, "0");

        const day =
            String(date.getDate())
                .padStart(2, "0");

        return `${year}-${month}-${day}`;

    }


    /* =====================================================
       EVENT ID
    ===================================================== */

    function createEventId(detail) {

        if (detail?.eventId) {

            return String(
                detail.eventId
            );

        }

        return [
            detail?.date ||
            detail?.studyDate ||
            getTodayKey(),

            "study-day-completed"
        ].join("-");

    }


    /* =====================================================
       CALENDAR DATA
    ===================================================== */

    function createCalendarDays() {

        const activity =
            getActivity();

        const today =
            new Date();

        const streak =
            getCurrentStreak();

        /*
           Display between 7 and 14 days.
        */

        const numberOfDays =
            Math.max(
                7,
                Math.min(
                    14,
                    streak + 2
                )
            );

        const days = [];

        for (
            let i = numberOfDays - 1;
            i >= 0;
            i--
        ) {

            const date =
                new Date(today);

            date.setDate(
                today.getDate() - i
            );

            const key =
                formatDate(date);

            const completed =
                activity[key] === true;

            const isToday =
                key === getTodayKey();

            days.push({

                date,

                key,

                completed,

                isToday

            });

        }

        return days;

    }


    function getDayName(date) {

        return date.toLocaleDateString(
            undefined,
            {
                weekday: "short"
            }
        );

    }


    function getDayNumber(date) {

        return date.getDate();

    }


    /* =====================================================
       CREATE OVERLAY
    ===================================================== */

    function createOverlay() {

        let overlay =
            document.getElementById(
                OVERLAY_ID
            );

        if (overlay) {
            return overlay;
        }

        overlay =
            document.createElement("div");

        overlay.id =
            OVERLAY_ID;

        overlay.innerHTML = `

            <div class="streak-celebration-backdrop">

                <div class="streak-celebration-card">

                    <button
                        type="button"
                        class="streak-celebration-close"
                        aria-label="Close"
                    >
                        ×
                    </button>

                    <div class="streak-complete-label">
                        STUDY DAY COMPLETE
                    </div>

                    <div class="streak-main-fire">
                        🔥
                    </div>

                    <h1 class="streak-celebration-title">
                        You're on fire!
                    </h1>

                    <p class="streak-celebration-subtitle">
                        Keep building your study streak.
                    </p>

                    <div class="streak-number-wrap">

                        <span
                            class="streak-number"
                            id="streakCelebrationNumber"
                        >
                            0
                        </span>

                        <span class="streak-number-label">
                            DAY STREAK
                        </span>

                    </div>

                    <div
                        class="streak-calendar"
                        id="streakCelebrationCalendar"
                    ></div>

                    <div class="streak-milo-area">

                        <div class="streak-milo-placeholder">
                            🐒
                        </div>

                        <div class="streak-milo-message">
                            Milo is celebrating with you! 🎉
                        </div>

                    </div>

                    <button
                        type="button"
                        class="streak-continue-button"
                        id="streakCelebrationContinue"
                    >
                        Keep Going 🚀
                    </button>

                </div>

            </div>

        `;

        document.body.appendChild(
            overlay
        );

        const close =
            overlay.querySelector(
                ".streak-celebration-close"
            );

        const continueButton =
            overlay.querySelector(
                "#streakCelebrationContinue"
            );

        function closeCelebration() {

            overlay.classList.remove(
                "show"
            );

            clearTimeout(
                overlay._studyMindRemovalTimer
            );

            overlay._studyMindRemovalTimer =
                setTimeout(
                    function () {

                        if (
                            !overlay.classList.contains(
                                "show"
                            )
                        ) {

                            overlay.remove();

                        }

                    },
                    350
                );

        }

        if (close) {

            close.addEventListener(
                "click",
                closeCelebration
            );

        }

        if (continueButton) {

            continueButton.addEventListener(
                "click",
                closeCelebration
            );

        }

        return overlay;

    }


    /* =====================================================
       RENDER CALENDAR
    ===================================================== */

    function renderCalendar(overlay) {

        const calendar =
            overlay.querySelector(
                "#streakCelebrationCalendar"
            );

        if (!calendar) {
            return;
        }

        calendar.innerHTML = "";

        const days =
            createCalendarDays();

        days.forEach(
            function (day) {

                const tile =
                    document.createElement(
                        "div"
                    );

                tile.className =
                    "streak-calendar-day";

                if (day.completed) {

                    tile.classList.add(
                        "completed"
                    );

                }

                if (day.isToday) {

                    tile.classList.add(
                        "today"
                    );

                }

                tile.innerHTML = `

                    <div class="calendar-day-name">
                        ${getDayName(day.date)}
                    </div>

                    <div class="calendar-day-number">
                        ${getDayNumber(day.date)}
                    </div>

                    <div class="calendar-day-fire">
                        ${day.completed ? "🔥" : ""}
                    </div>

                `;

                calendar.appendChild(
                    tile
                );

            }
        );

        /*
           Ignite today's completed tile.
        */

        const todayTile =
            calendar.querySelector(
                ".streak-calendar-day.today"
            );

        if (todayTile) {

            todayTile.classList.add(
                "catching-fire"
            );

            clearTimeout(
                todayTile._studyMindFireTimer
            );

            todayTile._studyMindFireTimer =
                setTimeout(
                    function () {

                        todayTile.classList.remove(
                            "catching-fire"
                        );

                        todayTile.classList.add(
                            "fully-lit"
                        );

                    },
                    1800
                );

        }

    }


    /* =====================================================
       ANIMATE STREAK NUMBER
    ===================================================== */

    function animateStreakNumber(
        overlay,
        finalValue
    ) {

        const number =
            overlay.querySelector(
                "#streakCelebrationNumber"
            );

        if (!number) {
            return;
        }

        finalValue =
            Number(finalValue) || 0;

        let current = 0;

        const duration =
            1100;

        const start =
            performance.now();

        /*
           Prevent overlapping number animations.
        */

        if (
            overlay._studyMindAnimationFrame
        ) {

            cancelAnimationFrame(
                overlay._studyMindAnimationFrame
            );

        }

        function animate(now) {

            const progress =
                Math.min(
                    (now - start) /
                    duration,
                    1
                );

            const eased =
                1 -
                Math.pow(
                    1 - progress,
                    3
                );

            current =
                Math.round(
                    eased * finalValue
                );

            number.textContent =
                String(current);

            if (progress < 1) {

                overlay._studyMindAnimationFrame =
                    requestAnimationFrame(
                        animate
                    );

            }

        }

        overlay._studyMindAnimationFrame =
            requestAnimationFrame(
                animate
            );

    }


    /* =====================================================
       DISPLAY CELEBRATION

       This system only displays the calendar overlay.

       It deliberately does NOT call:
       - Milo.playWoohoo()
       - Milo.celebrate()
       - Milo.dance()
       - Milo.miloStudySessionComplete()
    ===================================================== */

    function displayCelebration() {

        const streak =
            getCurrentStreak();

        if (streak <= 0) {
            return false;
        }

        if (!document.body) {
            return false;
        }

        const overlay =
            createOverlay();

        renderCalendar(
            overlay
        );

        animateStreakNumber(
            overlay,
            streak
        );

        overlay.classList.remove(
            "show"
        );

        void overlay.offsetWidth;

        overlay.classList.add(
            "show"
        );

        return true;

    }


    /* =====================================================
       COMPLETE STUDY-DAY CELEBRATION
    ===================================================== */

    function completeCelebration(data) {

        if (
            !data ||
            !data.eventId
        ) {

            return false;

        }

        /*
           Prevent duplicate calendar overlays.
        */

        const lastDisplayed =
            getLastDisplayedEvent();

        if (
            lastDisplayed ===
            data.eventId
        ) {

            clearPendingStudyDay(
                data.eventId
            );

            return true;

        }

        /*
           Wait for document readiness.
        */

        if (!document.body) {
            return false;
        }

        /*
           Display the overlay.
        */

        if (!displayCelebration()) {
            return false;
        }

        /*
           Mark this event as displayed.
        */

        localStorage.setItem(
            LAST_DISPLAYED_KEY,
            data.eventId
        );

        /*
           Only clear the event we handled.
        */

        clearPendingStudyDay(
            data.eventId
        );

        console.log(
            "StudyMind: Study-day calendar celebration displayed."
        );

        window.dispatchEvent(
            new CustomEvent(
                "studyMindStudyDayCelebrationDisplayed",
                {
                    detail: {
                        eventId: data.eventId,
                        date: data.date ||
                            data.studyDate ||
                            getTodayKey()
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
            getPendingStudyDay();

        if (!pending) {

            stopRetrying();

            return;

        }

        if (
            completeCelebration(
                pending
            )
        ) {

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

        retryTimer =
            setInterval(
                function () {

                    retryAttempts++;

                    processPendingCelebration();

                    if (
                        retryAttempts >=
                        MAX_RETRY_ATTEMPTS
                    ) {

                        stopRetrying();

                    }

                },
                500
            );

    }


    function stopRetrying() {

        if (retryTimer) {

            clearInterval(
                retryTimer
            );

            retryTimer = null;

        }

        retryAttempts = 0;

    }


    /* =====================================================
       HANDLE LIVE COMPLETION EVENT
    ===================================================== */

    function handleStudyDayCompleted(event) {

        const detail =
            event?.detail || {};

        const data = {

            eventId:
                createEventId(
                    detail
                ),

            date:
                detail.date ||
                detail.studyDate ||
                getTodayKey(),

            streak:
                Number(detail.streak) ||
                getCurrentStreak(),

            createdAt:
                Date.now()

        };

        /*
           Persist the event so it survives navigation.

           The streak engine may already have saved
           this event. This only writes the same event
           if the storage record is absent.
        */

        const existing =
            getPendingStudyDay();

        if (
            !existing ||
            existing.eventId !==
            data.eventId
        ) {

            try {

                localStorage.setItem(
                    PENDING_KEY,
                    JSON.stringify(data)
                );

            } catch (error) {

                console.warn(
                    "StudyMind: Could not persist study-day celebration.",
                    error
                );

            }

        }

        processPendingCelebration();

    }


    /* =====================================================
       COMPATIBILITY EVENT
    ===================================================== */

    function handleStreakUpdated(event) {

        const detail =
            event?.detail || {};

        if (
            detail.dayCompleted === true ||
            detail.studyDayCompleted === true ||
            detail.source ===
            "study-day-complete"
        ) {

            handleStudyDayCompleted(
                event
            );

        }

    }


    /* =====================================================
       EVENT LISTENERS
    ===================================================== */

    window.addEventListener(
        "studyMindStudyDayCompleted",
        handleStudyDayCompleted
    );

    window.addEventListener(
        "studyMindStreakUpdated",
        handleStreakUpdated
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


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.StudyMindStreakCelebration = {

        show: function () {

            const manualEvent = {

                eventId: [
                    getTodayKey(),
                    "manual-calendar",
                    Date.now()
                ].join("-"),

                date:
                    getTodayKey(),

                createdAt:
                    Date.now()

            };

            displayCelebration();

            return manualEvent.eventId;

        },


        processPending:
            processPendingCelebration,


        getPending:
            getPendingStudyDay

    };


    /* =====================================================
       INITIAL RECOVERY
    ===================================================== */

    processPendingCelebration();

})();
