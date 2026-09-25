"use strict";

/* =========================================================
   STUDYMIND AI — MILO STREAK CELEBRATION
   ---------------------------------------------------------
   Separate from milo.js.

   This file ONLY handles Milo's reaction when the streak
   actually increases.

   It does NOT:
   - calculate the streak
   - modify streak storage
   - reset streaks
   - manage study plans
   - modify milo.js
   - show the streak calendar

   Those responsibilities belong to their own systems.
========================================================= */

(function () {

    const LAST_CELEBRATED_KEY =
        "studyMindLastCelebratedStreak";


    /* =====================================================
       STORAGE
    ===================================================== */

    function getCurrentStreak() {

        return Number(
            localStorage.getItem(
                "studyMindStreak"
            )
        ) || 0;

    }


    function getLastCelebratedStreak() {

        return Number(
            localStorage.getItem(
                LAST_CELEBRATED_KEY
            )
        ) || 0;

    }


    function setLastCelebratedStreak(
        value
    ) {

        localStorage.setItem(
            LAST_CELEBRATED_KEY,
            String(value)
        );

    }


    /* =====================================================
       SOUND
    ===================================================== */

    function playCelebrationSound() {

        try {

            if (!window.Milo) {
                return;
            }


            /*
               Preferred celebration sound.
            */

            if (
                typeof window.Milo.playWoohoo ===
                "function"
            ) {

                window.Milo.playWoohoo();

                return;

            }


            /*
               Compatibility.
            */

            if (
                typeof window.Milo.playSound ===
                "function"
            ) {

                window.Milo.playSound(
                    "woohoo"
                );

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

    function celebrateMilo(
        streak
    ) {

        try {

            if (!window.Milo) {

                console.warn(
                    "StudyMind: Milo is not available yet."
                );

                return;

            }


            /*
               Main celebration.
            */

            if (
                typeof window.Milo.celebrate ===
                "function"
            ) {

                window.Milo.celebrate();

            }


            /*
               Happy dance.
            */

            if (
                typeof window.Milo.dance ===
                "function"
            ) {

                window.Milo.dance();

            }


            /*
               Happy state.
            */

            if (
                typeof window.Milo.happy ===
                "function"
            ) {

                window.Milo.happy();

            }


            /*
               Existing StudyMind completion animation.

               This is kept for compatibility with the
               current Milo system.
            */

            if (
                typeof window.Milo.miloStudySessionComplete ===
                "function"
            ) {

                window.Milo.miloStudySessionComplete(
                    streak
                );

            }

        } catch (error) {

            console.warn(
                "Milo celebration animation failed:",
                error
            );

        }


        playCelebrationSound();


        /*
           Tell any other UI that Milo is celebrating.
        */

        window.dispatchEvent(
            new CustomEvent(
                "studyMindMiloCelebrating",
                {
                    detail: {

                        streak,

                        source:
                            "milo-celebrating"

                    }
                }
            )
        );

    }


    /* =====================================================
       STREAK POPUP
    ===================================================== */

    function showStreakPopup(
        streak
    ) {

        let popup =
            document.getElementById(
                "miloStreakIncreasePopup"
            );


        /*
           Create popup once.
        */

        if (!popup) {

            popup =
                document.createElement(
                    "div"
                );


            popup.id =
                "miloStreakIncreasePopup";


            popup.innerHTML = `

                <div
                    class="milo-streak-increase-card"
                >

                    <div
                        class="milo-streak-fire"
                        aria-hidden="true"
                    >
                        🔥
                    </div>


                    <div
                        class="milo-streak-title"
                    >
                        ${streak}-Day Streak!
                    </div>


                    <div
                        class="milo-streak-message"
                    >
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


            document.body.appendChild(
                popup
            );


            const closeButton =
                popup.querySelector(
                    "#miloStreakIncreaseClose"
                );


            if (closeButton) {

                closeButton.addEventListener(
                    "click",
                    function () {

                        popup.classList.remove(
                            "show"
                        );

                    }
                );

            }

        }


        /*
           Update the current streak number.
        */

        const title =
            popup.querySelector(
                ".milo-streak-title"
            );


        if (title) {

            title.textContent =
                `${streak}-Day Streak!`;

        }


        /*
           Restart the animation cleanly.
        */

        popup.classList.remove(
            "show"
        );


        void popup.offsetWidth;


        popup.classList.add(
            "show"
        );


        /*
           Automatically close after 7 seconds.
        */

        clearTimeout(
            popup._studyMindCloseTimer
        );


        popup._studyMindCloseTimer =
            setTimeout(
                function () {

                    popup.classList.remove(
                        "show"
                    );

                },
                7000
            );

    }


    /* =====================================================
       HANDLE REAL STREAK INCREASE
    ===================================================== */

    function handleStreakIncrease(
        event
    ) {

        const detail =
            event &&
            event.detail
                ? event.detail
                : {};


        const streak =
            Number(
                detail.streak
            ) ||
            Number(
                detail.currentStreak
            ) ||
            getCurrentStreak();


        const previousStreak =
            Number(
                detail.previousStreak
            );


        /*
           Invalid streak.
        */

        if (
            streak <= 0
        ) {

            return;

        }


        /*
           If the streak engine tells us the previous
           value, verify that this really is an increase.
        */

        if (
            Number.isFinite(
                previousStreak
            ) &&
            streak <= previousStreak
        ) {

            return;

        }


        /*
           Prevent duplicate celebrations caused by:
           - multiple pages
           - repeated events
           - timer refreshes
           - duplicate script execution
        */

        const previousCelebrated =
            getLastCelebratedStreak();


        if (
            streak <= previousCelebrated
        ) {

            return;

        }


        /*
           Remember BEFORE starting the animation.
        */

        setLastCelebratedStreak(
            streak
        );


        console.log(
            `StudyMind: Milo celebrating ${streak}-day streak.`
        );


        celebrateMilo(
            streak
        );


        showStreakPopup(
            streak
        );

    }


    /* =====================================================
       ONLY LISTEN FOR THE DEDICATED INCREASE EVENT
    ===================================================== */

    window.addEventListener(
        "studyMindStreakIncreased",
        handleStreakIncrease
    );


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.StudyMindMiloCelebration = {

        celebrate:
            function (
                streak
            ) {

                streak =
                    Number(streak) ||
                    getCurrentStreak();


                if (
                    streak <= 0
                ) {

                    return;

                }


                const previous =
                    getLastCelebratedStreak();


                if (
                    streak <= previous
                ) {

                    return;

                }


                setLastCelebratedStreak(
                    streak
                );


                celebrateMilo(
                    streak
                );


                showStreakPopup(
                    streak
                );

            },


        resetCelebrationMemory:
            function () {

                localStorage.removeItem(
                    LAST_CELEBRATED_KEY
                );

            },


        getLastCelebratedStreak:
            function () {

                return getLastCelebratedStreak();

            }

    };

})();
