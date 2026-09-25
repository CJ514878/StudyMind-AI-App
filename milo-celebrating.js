"use strict";

/* =========================================================
   STUDYMIND AI — MILO STREAK CELEBRATION
   Separate from milo.js
   ========================================================= */

(function () {

    const LAST_CELEBRATED_KEY = "studyMindLastCelebratedStreak";

    function getCurrentStreak() {
        return Number(localStorage.getItem("studyMindStreak")) || 0;
    }

    function getLastCelebratedStreak() {
        return Number(localStorage.getItem(LAST_CELEBRATED_KEY)) || 0;
    }

    function setLastCelebratedStreak(value) {
        localStorage.setItem(LAST_CELEBRATED_KEY, String(value));
    }

    function playCelebrationSound() {
        try {
            if (window.Milo) {

                if (typeof window.Milo.playWoohoo === "function") {
                    window.Milo.playWoohoo();
                    return;
                }

                if (typeof window.Milo.celebrate === "function") {
                    window.Milo.celebrate();
                    return;
                }

                if (typeof window.Milo.playSound === "function") {
                    window.Milo.playSound("woohoo");
                    return;
                }
            }
        } catch (error) {
            console.warn("Milo celebration sound failed:", error);
        }
    }

    function celebrateMilo(streak) {

        /*
         * Use existing Milo animation functions if available.
         * We do NOT modify milo.js.
         */

        try {

            if (window.Milo) {

                if (typeof window.Milo.celebrate === "function") {
                    window.Milo.celebrate();
                }

                if (typeof window.Milo.dance === "function") {
                    window.Milo.dance();
                }

                if (typeof window.Milo.happy === "function") {
                    window.Milo.happy();
                }

                if (typeof window.Milo.miloStudySessionComplete === "function") {
                    window.Milo.miloStudySessionComplete(streak);
                }
            }

        } catch (error) {
            console.warn("Milo celebration animation failed:", error);
        }

        playCelebrationSound();

        window.dispatchEvent(
            new CustomEvent("studyMindMiloCelebrating", {
                detail: {
                    streak: streak
                }
            })
        );
    }

    function showStreakPopup(streak) {

        let popup = document.getElementById("miloStreakIncreasePopup");

        if (!popup) {

            popup = document.createElement("div");

            popup.id = "miloStreakIncreasePopup";

            popup.innerHTML = `
                <div class="milo-streak-increase-card">

                    <div class="milo-streak-fire">🔥</div>

                    <div class="milo-streak-title">
                        ${streak}-Day Streak!
                    </div>

                    <div class="milo-streak-message">
                        Amazing! Keep your streak going!
                    </div>

                    <button type="button" id="miloStreakIncreaseClose">
                        Keep Going 🚀
                    </button>

                </div>
            `;

            document.body.appendChild(popup);

            const closeButton =
                document.getElementById("miloStreakIncreaseClose");

            if (closeButton) {
                closeButton.addEventListener("click", function () {
                    popup.classList.remove("show");
                });
            }
        }

        const title = popup.querySelector(".milo-streak-title");

        if (title) {
            title.textContent = `${streak}-Day Streak!`;
        }

        popup.classList.remove("show");

        void popup.offsetWidth;

        popup.classList.add("show");

        setTimeout(function () {
            popup.classList.remove("show");
        }, 7000);
    }

    function handleStreakIncrease(event) {

        const detail = event && event.detail
            ? event.detail
            : {};

        let streak =
            Number(detail.streak) ||
            Number(detail.currentStreak) ||
            getCurrentStreak();

        if (streak <= 0) return;

        const previousCelebrated =
            getLastCelebratedStreak();

        /*
         * Only celebrate when the streak actually reaches
         * a new value.
         */

        if (streak <= previousCelebrated) {
            return;
        }

        setLastCelebratedStreak(streak);

        celebrateMilo(streak);
        showStreakPopup(streak);
    }

    /*
     * Existing StudyMind streak event.
     */
    window.addEventListener(
        "studyMindStreakUpdated",
        handleStreakIncrease
    );

    /*
     * Also support a dedicated event from the streak system.
     */
    window.addEventListener(
        "studyMindStreakIncreased",
        handleStreakIncrease
    );

    /*
     * Public API for other StudyMind files.
     */
    window.StudyMindMiloCelebration = {

        celebrate: function (streak) {

            streak =
                Number(streak) ||
                getCurrentStreak();

            if (streak <= 0) return;

            const previous =
                getLastCelebratedStreak();

            if (streak <= previous) return;

            setLastCelebratedStreak(streak);

            celebrateMilo(streak);
            showStreakPopup(streak);
        },

        resetCelebrationMemory: function () {
            localStorage.removeItem(LAST_CELEBRATED_KEY);
        }

    };

})();
