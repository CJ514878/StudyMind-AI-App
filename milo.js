/* =========================================================
   STUDYMIND AI — MILO COMPANION ENGINE
   COMPLETE REACTION + FROWN VERSION
========================================================= */

"use strict";


const MILO_KEYS = {

    FIRST_VISIT:
        "studyMindMiloFirstVisit",

    XP:
        "studyMindXP",

    STREAK_GOAL:
        "studyMindStreakGoal",

    STREAK_GOAL_REWARD:
        "studyMindStreakGoalReward",

    TOTAL_STREAK_DAYS:
        "studyMindTotalStreakDays"

};


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        createMilo();

        installMiloReactionStyles();

        setTimeout(
            startMiloExperience,
            700
        );

    }
);


/* =========================================================
   CREATE MILO
========================================================= */

function createMilo() {

    if (
        document.getElementById(
            "miloCompanion"
        )
    ) {

        return;

    }


    const container =
        document.createElement("div");


    container.id =
        "miloCompanion";


    container.className =
        "milo-container";


    container.innerHTML = `

        <div
            class="milo-bubble"
            id="miloBubble"
            style="display:none;"
        >

            <div
                class="milo-name"
                id="miloName"
            >
                Milo
            </div>

            <div
                class="milo-message"
                id="miloMessage"
            ></div>

            <div
                class="milo-actions"
                id="miloActions"
            ></div>

        </div>


        <div
            class="milo-character"
            id="miloCharacter"
            aria-label="Milo"
        >

            <div class="milo-antenna"></div>

            <div class="milo-body">

                <div
                    class="milo-eye left"
                ></div>

                <div
                    class="milo-eye right"
                ></div>

                <div
                    class="milo-mouth"
                ></div>

            </div>

        </div>

    `;


    document.body.appendChild(
        container
    );


    document
        .getElementById(
            "miloCharacter"
        )
        ?.addEventListener(
            "click",
            () => {

                playSound("pop");

                showMilo(
                    "Need help? I'm right here. Ask me anything about what you're studying!",
                    "happy"
                );

            }
        );

}


/* =========================================================
   SHOW MILO
========================================================= */

function showMilo(
    message,
    state = "idle",
    actions = []
) {

    const bubble =
        document.getElementById(
            "miloBubble"
        );


    const messageElement =
        document.getElementById(
            "miloMessage"
        );


    const actionsElement =
        document.getElementById(
            "miloActions"
        );


    const character =
        document.getElementById(
            "miloCharacter"
        );


    if (
        !bubble ||
        !messageElement ||
        !character
    ) {

        return;

    }


    bubble.style.display =
        "block";


    messageElement.textContent =
        message;


    actionsElement.innerHTML =
        "";


    actions.forEach(
        action => {

            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "milo-action";


            button.textContent =
                action.label;


            button.addEventListener(
                "click",
                action.onClick
            );


            actionsElement.appendChild(
                button
            );

        }
    );


    /*
     * Reset character state.
     */
    character.className =
        "milo-character";


    if (state) {

        character.classList.add(
            `milo-${state}`
        );

    }

}


/* =========================================================
   HIDE MILO
========================================================= */

function hideMilo() {

    const bubble =
        document.getElementById(
            "miloBubble"
        );


    if (bubble) {

        bubble.style.display =
            "none";

    }

}


/* =========================================================
   FIRST VISIT
========================================================= */

function startMiloExperience() {

    const firstVisit =
        localStorage.getItem(
            MILO_KEYS.FIRST_VISIT
        );


    if (!firstVisit) {

        localStorage.setItem(
            MILO_KEYS.FIRST_VISIT,
            "true"
        );


        playSound(
            "welcome"
        );


        showMilo(
            "Hi! I'm Milo 👋 I'm your personal StudyMind study companion. I'll help you learn, explain tricky questions, celebrate your wins, and keep you motivated.",
            "excited",
            [
                {
                    label: "Show me around",
                    onClick:
                        startTour
                }
            ]
        );

        return;

    }


    proactiveGreeting();

}


/* =========================================================
   PROACTIVE GREETING
========================================================= */

function proactiveGreeting() {

    const hour =
        new Date().getHours();


    let greeting =
        "Hey! Ready to study?";


    if (
        hour < 12
    ) {

        greeting =
            "Good morning! Ready to make some progress? ☀️";

    }

    else if (
        hour < 17
    ) {

        greeting =
            "Good afternoon! Let's get some studying done. 📚";

    }

    else {

        greeting =
            "Good evening! Let's finish today's mission strong. 🌙";

    }


    setTimeout(
        () => {

            showMilo(
                greeting,
                "idle"
            );

        },
        500
    );

}


/* =========================================================
   TOUR
========================================================= */

function startTour() {

    playSound(
        "pop"
    );


    showMilo(
        "This is your Dashboard. I'll help you keep track of what you need to study and what you've already mastered.",
        "happy",
        [
            {
                label: "Next",
                onClick:
                    () => {

                        showMilo(
                            "Your Study Session is where we actually learn. I'll be here if you get stuck.",
                            "idle",
                            [
                                {
                                    label: "Next",
                                    onClick:
                                        () => {

                                            showMilo(
                                                "Knowledge Checks test what you really understand. If you get something wrong, I'll explain it instead of just saying 'wrong'.",
                                                "thinking",
                                                [
                                                    {
                                                        label: "Next",
                                                        onClick:
                                                            () => {

                                                                showMilo(
                                                                    "And Game Mode lets you put your knowledge to the test. Just don't let me get knocked out! 😂",
                                                                    "excited",
                                                                    [
                                                                        {
                                                                            label: "Let's go!",
                                                                            onClick:
                                                                                () => {

                                                                                    hideMilo();

                                                                                }
                                                                        }
                                                                    ]
                                                                );

                                                            }
                                                    }
                                                ]
                                            );

                                        }
                                }
                            ]
                        );

                    }
            }
        ]
    );

}


/* =========================================================
   XP
========================================================= */

function getXP() {

    return Number(
        localStorage.getItem(
            MILO_KEYS.XP
        ) || 0
    );

}


function addXP(
    amount,
    reason = ""
) {

    amount =
        Math.max(
            0,
            Number(amount) || 0
        );


    const total =
        getXP() + amount;


    localStorage.setItem(
        MILO_KEYS.XP,
        String(total)
    );


    window.dispatchEvent(
        new CustomEvent(
            "studyMindXPUpdated",
            {
                detail: {
                    amount,
                    total,
                    reason
                }
            }
        )
    );


    showMilo(
        `Nice! +${amount} XP ⭐`,
        "excited"
    );


    playSound(
        "xp"
    );


    return total;

}


/* =========================================================
   STREAK GOAL
========================================================= */

function getStreakGoal() {

    return Number(
        localStorage.getItem(
            MILO_KEYS.STREAK_GOAL
        ) || 0
    );

}


function askStreakGoal() {

    const options = [
        5,
        10,
        20,
        30,
        50,
        75,
        100
    ];


    showMilo(
        "Let's set a streak goal! 🔥 How many study days do you want to achieve?",
        "excited",
        options.map(
            days => ({

                label:
                    `${days} days`,

                onClick:
                    () => {

                        setStreakGoal(
                            days
                        );

                    }

            })
        )
    );

}


function setStreakGoal(
    days
) {

    localStorage.setItem(
        MILO_KEYS.STREAK_GOAL,
        String(days)
    );


    localStorage.setItem(
        MILO_KEYS.STREAK_GOAL_REWARD,
        "false"
    );


    showMilo(
        `Awesome! 🔥 Your goal is ${days} study days. I'll be cheering you on all the way.`,
        "celebrate"
    );


    playSound(
        "goal"
    );

}


/* =========================================================
   STREAK CELEBRATION
========================================================= */

function celebrateStreak(
    streak
) {

    const goal =
        getStreakGoal();


    addXP(
        10,
        "daily streak"
    );


    showStreakOverlay(
        streak
    );


    if (
        streak % 7 === 0
    ) {

        setTimeout(
            () => {

                addXP(
                    50,
                    "weekly streak"
                );

            },
            1400
        );

    }


    if (
        streak % 10 === 0
    ) {

        setTimeout(
            () => {

                addXP(
                    100,
                    "10 day streak"
                );

            },
            2200
        );

    }


    if (
        goal &&
        streak >= goal &&
        localStorage.getItem(
            MILO_KEYS.STREAK_GOAL_REWARD
        ) !== "true"
    ) {

        localStorage.setItem(
            MILO_KEYS.STREAK_GOAL_REWARD,
            "true"
        );


        setTimeout(
            () => {

                addXP(
                    goal * 2,
                    "streak goal"
                );


                showMilo(
                    `YOU DID IT! 🎉 You reached your ${goal}-day streak goal! I'm seriously proud of you.`,
                    "celebrate"
                );

            },
            3000
        );

    }

}


/* =========================================================
   STREAK OVERLAY
========================================================= */

function showStreakOverlay(
    streak
) {

    const existing =
        document.getElementById(
            "miloStreakOverlay"
        );


    if (existing) {

        existing.remove();

    }


    const overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "miloStreakOverlay";


    overlay.innerHTML = `

        <div class="milo-streak-card">

            <div class="milo-fire">
                🔥
            </div>

            <div class="milo-streak-number">
                ${streak}
            </div>

            <div class="milo-streak-title">
                DAY STREAK!
            </div>

            <div class="milo-streak-text">
                You completed today's study mission.
            </div>

            <button
                id="miloStreakContinue"
            >
                Keep going
            </button>

        </div>

    `;


    document.body.appendChild(
        overlay
    );


    playSound(
        "streak"
    );


    requestAnimationFrame(
        () => {

            overlay.classList.add(
                "show"
            );

        }
    );


    document
        .getElementById(
            "miloStreakContinue"
        )
        ?.addEventListener(
            "click",
            () => {

                overlay.classList.remove(
                    "show"
                );

                setTimeout(
                    () => overlay.remove(),
                    300
                );

            }
        );

}


/* =========================================================
   KNOWLEDGE CHECK — CORRECT
========================================================= */

function miloCorrectAnswer() {

    /*
     * Show the message first.
     * showMilo() resets the character classes.
     */
    showMilo(
        "YES! 🎉 That's correct!",
        "celebrate"
    );


    /*
     * Apply the visual reaction AFTER showMilo().
     */
    setTimeout(
        () => {

            const character =
                document.getElementById(
                    "miloCharacter"
                );


            if (!character) return;


            character.classList.remove(
                "milo-wrong",
                "milo-wrong-reaction",
                "milo-frown",
                "milo-shake"
            );


            character.classList.add(
                "milo-celebrate",
                "milo-correct-reaction"
            );

        },
        0
    );


    playSound(
        "correct"
    );


    /*
     * Award XP silently.
     * We deliberately DO NOT call addXP(),
     * because addXP() calls showMilo() again.
     */
    const amount = 5;


    const total =
        getXP() + amount;


    localStorage.setItem(
        MILO_KEYS.XP,
        String(total)
    );


    window.dispatchEvent(
        new CustomEvent(
            "studyMindXPUpdated",
            {
                detail: {
                    amount,
                    total,
                    reason:
                        "correct knowledge check answer"
                }
            }
        )
    );

}


/* =========================================================
   KNOWLEDGE CHECK — WRONG
========================================================= */

function miloWrongAnswer(
    explanation
) {

    /*
     * Show the explanation first.
     * This resets Milo to the "wrong" state.
     */
    showMilo(
        explanation ||
        "Not quite — that's okay! Let's learn from this one.",
        "wrong",
        [
            {
                label: "I understand",

                onClick:
                    () => {

                        playSound(
                            "pop"
                        );

                    }
            }
        ]
    );


    /*
     * IMPORTANT:
     * Apply the actual frown AFTER showMilo().
     */
    setTimeout(
        () => {

            const character =
                document.getElementById(
                    "miloCharacter"
                );


            if (!character) return;


            /*
             * Clear previous reactions.
             */
            character.classList.remove(
                "milo-celebrate",
                "milo-correct-reaction",
                "milo-excited"
            );


            /*
             * Add wrong-answer states.
             */
            character.classList.add(
                "milo-wrong",
                "milo-wrong-reaction",
                "milo-frown",
                "milo-shake"
            );


            /*
             * DIRECTLY CONTROL THE MOUTH.
             */
            const mouth =
                character.querySelector(
                    ".milo-mouth"
                );


            if (mouth) {

                /*
                 * Store that Milo is currently
                 * using the frown.
                 */
                mouth.dataset.miloFrown =
                    "true";


                /*
                 * Remove any inline styles
                 * that might conflict.
                 */
                mouth.style.setProperty(
                    "width",
                    "24px",
                    "important"
                );


                mouth.style.setProperty(
                    "height",
                    "12px",
                    "important"
                );


                mouth.style.setProperty(
                    "background",
                    "transparent",
                    "important"
                );


                mouth.style.setProperty(
                    "border",
                    "3px solid currentColor",
                    "important"
                );


                mouth.style.setProperty(
                    "border-bottom",
                    "0",
                    "important"
                );


                mouth.style.setProperty(
                    "border-radius",
                    "50% 50% 0 0",
                    "important"
                );


                mouth.style.setProperty(
                    "transform",
                    "translateX(-50%) rotate(180deg)",
                    "important"
                );


                mouth.style.setProperty(
                    "display",
                    "block",
                    "important"
                );

            }

        },
        0
    );


    /*
     * Wrong-answer sound.
     */
    playSound(
        "wrong"
    );

}


/* =========================================================
   RESET MILO MOUTH
========================================================= */

function resetMiloMouth() {

    const character =
        document.getElementById(
            "miloCharacter"
        );


    if (!character) return;


    const mouth =
        character.querySelector(
            ".milo-mouth"
        );


    if (!mouth) return;


    mouth.removeAttribute(
        "style"
    );


    delete mouth.dataset.miloFrown;

}


/* =========================================================
   GAME MODE
========================================================= */

function miloGameCorrect() {

    showMilo(
        "YESSS! 😎 You got it!",
        "excited"
    );


    playSound(
        "correct"
    );


    addXP(
        10,
        "game correct answer"
    );

}


function miloGameWrong() {

    showMilo(
        "OW! 😂 That answer knocked me out!",
        "punched"
    );


    playSound(
        "punch"
    );

}


/* =========================================================
   STUDY SESSION COMPLETE
========================================================= */

function miloStudySessionComplete() {

    showMilo(
        "STUDY SESSION COMPLETE! 🎉 You did it!",
        "celebrate"
    );


    playSound(
        "sessionComplete"
    );


    addXP(
        25,
        "study session completion"
    );

}


/* =========================================================
   PROACTIVE HELP
========================================================= */

function miloOfferHelp() {

    showMilo(
        "Something confusing? I'm here. Ask me and I'll explain it step by step.",
        "thinking",
        [
            {
                label: "Ask Milo",
                onClick:
                    () => {

                        document
                            .getElementById(
                                "aiInput"
                            )
                            ?.focus();

                    }
            }
        ]
    );

}


/* =========================================================
   MILO REACTION CSS
========================================================= */

function installMiloReactionStyles() {

    if (
        document.getElementById(
            "studyMindMiloReactionStyles"
        )
    ) {

        return;

    }


    const style =
        document.createElement("style");


    style.id =
        "studyMindMiloReactionStyles";


    style.textContent = `

        /* =================================================
           MILO BASE MOUTH
        ================================================= */

        #miloCharacter .milo-mouth {
            position: absolute;
        }


        /* =================================================
           REAL FROWN
        ================================================= */

        #miloCharacter.milo-frown .milo-mouth,
        #miloCharacter.milo-wrong .milo-mouth,
        #miloCharacter.milo-wrong-reaction .milo-mouth,
        #miloCharacter.milo-answer-wrong .milo-mouth {

            width: 24px !important;

            height: 12px !important;

            background: transparent !important;

            border: 3px solid currentColor !important;

            border-bottom: 0 !important;

            border-radius: 50% 50% 0 0 !important;

            transform:
                translateX(-50%)
                rotate(180deg) !important;

            display: block !important;

        }


        /* =================================================
           WRONG ANSWER SHAKE
        ================================================= */

        #miloCharacter.milo-shake {

            animation:
                studyMindMiloShake
                0.55s
                ease-in-out;

        }


        @keyframes studyMindMiloShake {

            0% {
                transform:
                    translateX(0)
                    rotate(0deg);
            }

            20% {
                transform:
                    translateX(-7px)
                    rotate(-4deg);
            }

            40% {
                transform:
                    translateX(7px)
                    rotate(4deg);
            }

            60% {
                transform:
                    translateX(-6px)
                    rotate(-3deg);
            }

            80% {
                transform:
                    translateX(5px)
                    rotate(3deg);
            }

            100% {
                transform:
                    translateX(0)
                    rotate(0deg);
            }

        }


        /* =================================================
           CORRECT CELEBRATION
        ================================================= */

        #miloCharacter.milo-celebrate {

            animation:
                studyMindMiloCelebrate
                0.8s
                ease-in-out;

        }


        @keyframes studyMindMiloCelebrate {

            0% {
                transform:
                    translateY(0)
                    scale(1);
            }

            30% {
                transform:
                    translateY(-10px)
                    scale(1.05);
            }

            55% {
                transform:
                    translateY(0)
                    scale(1);
            }

            75% {
                transform:
                    translateY(-5px)
                    scale(1.03);
            }

            100% {
                transform:
                    translateY(0)
                    scale(1);
            }

        }

    `;


    document.head.appendChild(
        style
    );

}


/* =========================================================
   SOUND ENGINE
========================================================= */

function playSound(
    type
) {

    try {

        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;


        if (!AudioContext) {

            return;

        }


        const context =
            new AudioContext();


        const oscillator =
            context.createOscillator();


        const gain =
            context.createGain();


        oscillator.connect(
            gain
        );


        gain.connect(
            context.destination
        );


        const now =
            context.currentTime;


        const sounds = {

            pop: {
                frequencies: [500],
                duration: .08
            },

            correct: {
                frequencies: [523, 659, 784],
                duration: .11
            },

            xp: {
                frequencies: [659, 784, 988],
                duration: .09
            },

            streak: {
                frequencies: [392, 523, 659, 784],
                duration: .16
            },

            goal: {
                frequencies: [523, 659, 784, 1047],
                duration: .18
            },

            welcome: {
                frequencies: [392, 523, 659],
                duration: .16
            },

            sessionComplete: {
                frequencies: [523, 659, 784, 1047],
                duration: .16
            },

            wrong: {
                frequencies: [330, 260],
                duration: .18
            },

            punch: {
                frequencies: [150, 90],
                duration: .12
            }

        };


        const sound =
            sounds[type] ||
            sounds.pop;


        sound.frequencies.forEach(
            (
                frequency,
                index
            ) => {

                const osc =
                    index === 0
                        ? oscillator
                        : context.createOscillator();


                const g =
                    index === 0
                        ? gain
                        : context.createGain();


                if (
                    index !== 0
                ) {

                    osc.connect(g);

                    g.connect(
                        context.destination
                    );

                }


                osc.frequency.value =
                    frequency;


                osc.type =
                    "sine";


                const start =
                    now +
                    index *
                    sound.duration;


                g.gain.setValueAtTime(
                    .0001,
                    start
                );


                g.gain.exponentialRampToValueAtTime(
                    .12,
                    start + .01
                );


                g.gain.exponentialRampToValueAtTime(
                    .0001,
                    start + sound.duration
                );


                osc.start(
                    start
                );


                osc.stop(
                    start +
                    sound.duration
                );

            }
        );


    } catch (error) {

        console.warn(
            "Milo sound unavailable:",
            error
        );

    }

}


/* =========================================================
   PUBLIC API
========================================================= */

window.Milo = {

    show:
        showMilo,

    hide:
        hideMilo,

    addXP,

    getXP,

    getStreakGoal,

    askStreakGoal,

    setStreakGoal,

    celebrateStreak,

    miloCorrectAnswer,

    miloWrongAnswer,

    miloGameCorrect,

    miloGameWrong,

    miloStudySessionComplete,

    miloOfferHelp,

    playSound

};
