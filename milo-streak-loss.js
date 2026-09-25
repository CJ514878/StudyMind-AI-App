"use strict";

/* =========================================================
   STUDYMIND AI — MILO STREAK LOSS
   Separate from milo.js
   ========================================================= */

(function () {

    const LAST_LOSS_KEY = "studyMindLastStreakLossDate";

    function todayKey() {

        const date = new Date();

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function playSadSound() {

        try {

            if (window.Milo) {

                if (typeof window.Milo.playSad === "function") {
                    window.Milo.playSad();
                    return;
                }

                if (typeof window.Milo.playWrong === "function") {
                    window.Milo.playWrong();
                    return;
                }

                if (typeof window.Milo.playSound === "function") {
                    window.Milo.playSound("wrong");
                    return;
                }
            }

        } catch (error) {
            console.warn("Milo sad sound failed:", error);
        }
    }

    function makeMiloSad() {

        try {

            if (window.Milo) {

                if (typeof window.Milo.cry === "function") {
                    window.Milo.cry();
                }

                if (typeof window.Milo.sad === "function") {
                    window.Milo.sad();
                }

                if (typeof window.Milo.shakeHead === "function") {
                    window.Milo.shakeHead();
                }

            }

        } catch (error) {
            console.warn("Milo sad animation failed:", error);
        }

        playSadSound();

        window.dispatchEvent(
            new CustomEvent("studyMindMiloStreakLoss", {
                detail: {}
            })
        );
    }

    function showLossPopup(previousStreak) {

        let popup =
            document.getElementById("miloStreakLossPopup");

        if (!popup) {

            popup = document.createElement("div");

            popup.id = "miloStreakLossPopup";

            popup.innerHTML = `
                <div class="milo-streak-loss-card">

                    <div class="milo-loss-milo">
                        <div class="milo-sad-face">😢</div>
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

                    <button type="button" id="miloStreakLossClose">
                        Start Again 🔥
                    </button>

                </div>
            `;

            document.body.appendChild(popup);

            const closeButton =
                document.getElementById("miloStreakLossClose");

            if (closeButton) {

                closeButton.addEventListener("click", function () {
                    popup.classList.remove("show");
                });

            }
        }

        const message =
            popup.querySelector(".milo-loss-message");

        if (message) {
            message.textContent =
                `Your ${previousStreak}-day streak has ended.`;
        }

        popup.classList.remove("show");

        void popup.offsetWidth;

        popup.classList.add("show");

        setTimeout(function () {
            popup.classList.remove("show");
        }, 8000);
    }

    function triggerLoss(previousStreak) {

        previousStreak =
            Number(previousStreak) || 0;

        if (previousStreak <= 0) {
            return;
        }

        const today = todayKey();

        /*
         * Prevent the same loss from appearing repeatedly
         * during the same day.
         */

        if (
            localStorage.getItem(LAST_LOSS_KEY) === today
        ) {
            return;
        }

        localStorage.setItem(
            LAST_LOSS_KEY,
            today
        );

        makeMiloSad();

        showLossPopup(previousStreak);
    }

    /*
     * Other code can explicitly tell this system
     * that a streak was lost.
     */

    window.addEventListener(
        "studyMindStreakLost",
        function (event) {

            const detail =
                event && event.detail
                    ? event.detail
                    : {};

            triggerLoss(
                detail.previousStreak ||
                detail.streak ||
                detail.oldStreak
            );
        }
    );

    window.StudyMindMiloStreakLoss = {

        show: function (previousStreak) {
            triggerLoss(previousStreak);
        },

        resetLossMemory: function () {
            localStorage.removeItem(LAST_LOSS_KEY);
        }

    };

})();
