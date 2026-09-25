"use strict";

/* =========================================================
   STUDYMIND AI — STREAK CALENDAR CELEBRATION
   Separate celebration system
   ========================================================= */

(function () {

    const OVERLAY_ID = "studyMindStreakCelebration";

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
            localStorage.getItem("studyMindStreak")
        ) || 0;
    }

    function getTodayKey() {

        const date = new Date();

        const year = date.getFullYear();
        const month =
            String(date.getMonth() + 1).padStart(2, "0");

        const day =
            String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function formatDate(date) {

        const year = date.getFullYear();

        const month =
            String(date.getMonth() + 1).padStart(2, "0");

        const day =
            String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function createCalendarDays() {

        const activity = getActivity();
        const today = new Date();

        const streak = getCurrentStreak();

        /*
         * Show the current streak plus a few surrounding days.
         */

        const numberOfDays =
            Math.max(7, Math.min(14, streak + 2));

        const days = [];

        for (let i = numberOfDays - 1; i >= 0; i--) {

            const date = new Date(today);

            date.setDate(
                today.getDate() - i
            );

            const key = formatDate(date);

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

    function createOverlay() {

        let overlay =
            document.getElementById(OVERLAY_ID);

        if (overlay) {
            return overlay;
        }

        overlay = document.createElement("div");

        overlay.id = OVERLAY_ID;

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

        document.body.appendChild(overlay);

        const close =
            overlay.querySelector(
                ".streak-celebration-close"
            );

        const continueButton =
            overlay.querySelector(
                "#streakCelebrationContinue"
            );

        function closeCelebration() {
            overlay.classList.remove("show");

            setTimeout(function () {
                overlay.remove();
            }, 350);
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

    function renderCalendar(overlay) {

        const calendar =
            overlay.querySelector(
                "#streakCelebrationCalendar"
            );

        if (!calendar) return;

        calendar.innerHTML = "";

        const days =
            createCalendarDays();

        days.forEach(function (day) {

            const tile =
                document.createElement("div");

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

            calendar.appendChild(tile);

        });

        /*
         * Give today's completed tile the special
         * fire animation.
         */

        const todayTile =
            calendar.querySelector(
                ".streak-calendar-day.today"
            );

        if (todayTile) {

            todayTile.classList.add(
                "catching-fire"
            );

            setTimeout(function () {

                todayTile.classList.remove(
                    "catching-fire"
                );

                todayTile.classList.add(
                    "fully-lit"
                );

            }, 1800);
        }
    }

    function animateStreakNumber(overlay, finalValue) {

        const number =
            overlay.querySelector(
                "#streakCelebrationNumber"
            );

        if (!number) return;

        finalValue =
            Number(finalValue) || 0;

        let current = 0;

        const duration = 1100;

        const start =
            performance.now();

        function animate(now) {

            const progress =
                Math.min(
                    (now - start) / duration,
                    1
                );

            const eased =
                1 -
                Math.pow(1 - progress, 3);

            current =
                Math.round(
                    eased * finalValue
                );

            number.textContent =
                current;

            if (progress < 1) {
                requestAnimationFrame(
                    animate
                );
            }
        }

        requestAnimationFrame(
            animate
        );
    }

    function playCelebrationSound() {

        try {

            if (window.Milo) {

                if (
                    typeof window.Milo.playWoohoo ===
                    "function"
                ) {
                    window.Milo.playWoohoo();
                    return;
                }

                if (
                    typeof window.Milo.celebrate ===
                    "function"
                ) {
                    window.Milo.celebrate();
                    return;
                }

                if (
                    typeof window.Milo.miloStudySessionComplete ===
                    "function"
                ) {
                    window.Milo.miloStudySessionComplete(
                        getCurrentStreak()
                    );
                }
            }

        } catch (error) {
            console.warn(
                "Streak celebration sound failed:",
                error
            );
        }
    }

    function celebrate() {

        const streak =
            getCurrentStreak();

        if (streak <= 0) {
            return;
        }

        const overlay =
            createOverlay();

        renderCalendar(overlay);

        animateStreakNumber(
            overlay,
            streak
        );

        overlay.classList.remove("show");

        void overlay.offsetWidth;

        overlay.classList.add("show");

        playCelebrationSound();

        /*
         * Give Milo's existing system a chance to
         * perform its celebration without changing
         * milo.js itself.
         */

        try {

            if (
                window.Milo &&
                typeof window.Milo.dance ===
                "function"
            ) {
                window.Milo.dance();
            }

        } catch (error) {
            console.warn(
                "Milo dance failed:",
                error
            );
        }
    }

    /*
     * Main event:
     *
     * When the streak system announces that today's
     * study day was completed, show the calendar.
     */

    window.addEventListener(
        "studyMindStudyDayCompleted",
        function () {
            celebrate();
        }
    );

    /*
     * Also support the existing streak event.
     * This only opens the calendar when the event
     * explicitly says that a study day was completed.
     */

    window.addEventListener(
        "studyMindStreakUpdated",
        function (event) {

            const detail =
                event && event.detail
                    ? event.detail
                    : {};

            if (
                detail.dayCompleted === true ||
                detail.studyDayCompleted === true ||
                detail.source ===
                "study-day-complete"
            ) {
                celebrate();
            }

        }
    );

    window.StudyMindStreakCelebration = {

        show: function () {
            celebrate();
        }

    };

})();
