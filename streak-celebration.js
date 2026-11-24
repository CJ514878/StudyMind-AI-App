"use strict";

/* =========================================================
   STUDYMIND AI — STREAK CALENDAR CELEBRATION
   ---------------------------------------------------------
   RESPONSIBILITIES:
   - Display the study-day celebration calendar.
   - Animate the streak number.
   - Display recent completed study days.
   - Recover pending study-day celebrations.
   - Prevent duplicate calendar celebrations.

   Milo's streak increase sound/animation belongs to:
   milo-celebrating.js

   This file does NOT independently play Milo sounds
   or trigger Milo dances.
========================================================= */

(function () {

    const OVERLAY_ID = "studyMindStreakCelebration";

    const PENDING_KEY =
        "studyMindPendingStudyDayCelebration";

    const LAST_EVENT_KEY =
        "studyMindLastStudyDayCelebrationDisplayed";

    let activeEventId = null;


    /* =====================================================
       STORAGE
    ===================================================== */

    function readJSON(key, fallback) {

        try {

            const stored =
                localStorage.getItem(key);

            return stored
                ? JSON.parse(stored)
                : fallback;

        } catch {

            return fallback;
        }
    }


    function getActivity() {

        return readJSON(
            "studyMindStreakActivity",
            {}
        );
    }


    function getCurrentStreak() {

        return Number(
            localStorage.getItem(
                "studyMindStreak"
            )
        ) || 0;
    }


    function getTodayKey() {

        return formatDate(new Date());
    }


    function formatDate(date) {

        return [
            date.getFullYear(),
            String(
                date.getMonth() + 1
            ).padStart(2, "0"),
            String(
                date.getDate()
            ).padStart(2, "0")
        ].join("-");
    }


    /* =====================================================
       CALENDAR
    ===================================================== */

    function createCalendarDays() {

        const activity =
            getActivity();

        const today =
            new Date();

        const streak =
            getCurrentStreak();

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

            days.push({

                date,

                key,

                completed:
                    activity[key] === true,

                isToday:
                    key === getTodayKey()

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


    /* =====================================================
       OVERLAY
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

            setTimeout(
                function () {

                    /*
                     * Keep the overlay in the DOM.
                     * This avoids rebuilding listeners
                     * and allows the next celebration
                     * to reuse the same overlay.
                     */

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
                        ${day.date.getDate()}
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


        const todayTile =
            calendar.querySelector(
                ".streak-calendar-day.today"
            );


        if (todayTile) {

            todayTile.classList.remove(
                "catching-fire",
                "fully-lit"
            );

            void todayTile.offsetWidth;

            todayTile.classList.add(
                "catching-fire"
            );


            setTimeout(
                function () {

                    if (
                        !todayTile.isConnected
                    ) {

                        return;
                    }

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
       STREAK NUMBER ANIMATION
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

        number.textContent =
            "0";


        const duration =
            1100;

        const start =
            performance.now();


        function animate(now) {

            const progress =
                Math.min(
                    (
                        now - start
                    ) / duration,
                    1
                );


            const eased =
                1 -
                Math.pow(
                    1 - progress,
                    3
                );


            number.textContent =
                Math.round(
                    eased * finalValue
                );


            if (
                progress < 1
            ) {

                requestAnimationFrame(
                    animate
                );
            }
        }


        requestAnimationFrame(
            animate
        );
    }


    /* =====================================================
       DISPLAY
    ===================================================== */

    function celebrate(eventId) {

        const streak =
            getCurrentStreak();


        if (streak <= 0) {

            return false;
        }


        /*
         * Prevent duplicate event processing.
         */

        if (
            eventId &&
            eventId === activeEventId
        ) {

            return false;
        }


        if (eventId) {

            const lastEvent =
                localStorage.getItem(
                    LAST_EVENT_KEY
                );


            if (
                lastEvent === eventId
            ) {

                return false;
            }
        }


        activeEventId =
            eventId || null;


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


        if (eventId) {

            localStorage.setItem(
                LAST_EVENT_KEY,
                eventId
            );
        }


        return true;
    }


    /* =====================================================
       PENDING EVENT RECOVERY
    ===================================================== */

    function getPendingStudyDay() {

        return readJSON(
            PENDING_KEY,
            null
        );
    }


    function clearPendingStudyDay(
        expectedEventId
    ) {

        const pending =
            getPendingStudyDay();


        if (
            expectedEventId &&
            pending &&
            pending.eventId !==
            expectedEventId
        ) {

            return;
        }


        localStorage.removeItem(
            PENDING_KEY
        );
    }


    function processPendingStudyDay() {

        const pending =
            getPendingStudyDay();


        if (
            !pending ||
            !pending.eventId
        ) {

            return;
        }


        const displayed =
            celebrate(
                pending.eventId
            );


        if (displayed) {

            clearPendingStudyDay(
                pending.eventId
            );

        } else if (
            localStorage.getItem(
                LAST_EVENT_KEY
            ) === pending.eventId
        ) {

            clearPendingStudyDay(
                pending.eventId
            );
        }
    }


    /* =====================================================
       EVENT LISTENERS
    ===================================================== */

    window.addEventListener(
        "studyMindStudyDayCompleted",
        function (event) {

            const detail =
                event?.detail || {};

            const eventId =
                detail.eventId ||
                (
                    "study-day-" +
                    getTodayKey()
                );


            const displayed =
                celebrate(
                    eventId
                );


            if (displayed) {

                clearPendingStudyDay(
                    eventId
                );
            }
        }
    );


    window.addEventListener(
        "studyMindStreakUpdated",
        function (event) {

            const detail =
                event?.detail || {};


            if (
                detail.dayCompleted === true ||
                detail.studyDayCompleted === true ||
                detail.source ===
                "study-day-complete"
            ) {

                celebrate(
                    detail.eventId ||
                    (
                        "study-day-" +
                        getTodayKey()
                    )
                );
            }
        }
    );


    window.addEventListener(
        "storage",
        function (event) {

            if (
                event.key === PENDING_KEY ||
                event.key === null
            ) {

                processPendingStudyDay();
            }
        }
    );


    window.addEventListener(
        "pageshow",
        processPendingStudyDay
    );


    window.addEventListener(
        "load",
        processPendingStudyDay
    );


    document.addEventListener(
        "DOMContentLoaded",
        processPendingStudyDay
    );


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.StudyMindStreakCelebration = {

        show: function () {

            celebrate(
                "manual-" +
                Date.now()
            );
        },

        processPending:
            processPendingStudyDay

    };


    /* =====================================================
       INITIAL RECOVERY
    ===================================================== */

    processPendingStudyDay();

})();
