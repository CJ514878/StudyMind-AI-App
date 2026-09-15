/* =========================================================
   STUDYMIND AI — MILO COMPANION ENGINE
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


    character.className =
        "milo-character";


    if (
        state
    ) {

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
   KNOWLEDGE CHECK
========================================================= */

function miloCorrectAnswer() {

    showMilo(
        "YES! 🎉 That's correct!",
        "celebrate"
    );


    playSound(
        "correct"
    );


    addXP(
        5,
        "correct knowledge check answer"
    );

}


function miloWrongAnswer(
    explanation
) {

    showMilo(
        explanation ||
        "Not quite — and that's completely okay. Let's work through it together.",
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


    playSound(
        "wrong"
    );

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
   MILO — FLY AROUND THE SCREEN
========================================================= */

let miloFlyingTimer = null;
let miloFlyTimeout = null;

function flyMiloAround() {

    const container =
        document.getElementById("miloCompanion");

    if (!container) return;

    /*
       Keep Milo away from the extreme edges so
       he doesn't disappear off-screen.
    */

    const margin = 30;

    const maxX =
        Math.max(
            margin,
            window.innerWidth - 120
        );

    const maxY =
        Math.max(
            margin,
            window.innerHeight - 150
        );

    const x =
        Math.floor(
            margin +
            Math.random() *
            (maxX - margin)
        );

    const y =
        Math.floor(
            margin +
            Math.random() *
            (maxY - margin)
        );

    /*
       Temporarily switch from bottom/right positioning
       to absolute screen positioning.
    */

    container.style.position = "fixed";

    container.style.left = `${x}px`;
    container.style.top = `${y}px`;

    container.style.right = "auto";
    container.style.bottom = "auto";

    container.classList.add("milo-flying");

    /*
       Stay in this area for a little while,
       then choose another destination.
    */

    clearTimeout(miloFlyTimeout);

    miloFlyTimeout = setTimeout(() => {

        container.classList.remove("milo-flying");

        /*
           Sometimes return home.
        */

        if (Math.random() < 0.35) {

            container.style.left = "auto";
            container.style.top = "auto";
            container.style.right = "28px";
            container.style.bottom = "28px";

        } else {

            flyMiloAround();

        }

    }, 3500 + Math.random() * 3000);
}


/* =========================================================
   START FLYING
========================================================= */

function startMiloFlying() {

    clearInterval(miloFlyingTimer);

    /*
       Wait before Milo starts flying so the user
       gets a chance to see his normal greeting.
    */

    miloFlyingTimer = setInterval(() => {

        const container =
            document.getElementById("miloCompanion");

        if (!container) return;

        /*
           Don't move Milo while a major overlay is open.
        */

        if (
            document.getElementById("miloStreakOverlay")
        ) {
            return;
        }

        /*
           Don't interrupt important Milo messages.
        */

        const bubble =
            document.getElementById("miloBubble");

        if (
            bubble &&
            bubble.style.display !== "none"
        ) {

            /*
               Give his message some time.
            */

            if (Math.random() < 0.45) {
                return;
            }
        }

        flyMiloAround();

    }, 12000);
}


/* =========================================================
   BEGIN AFTER PAGE LOAD
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    setTimeout(() => {
        startMiloFlying();
    }, 8000);

});


/* =========================================================
   RETURN MILO HOME
========================================================= */

function returnMiloHome() {

    const container =
        document.getElementById("miloCompanion");

    if (!container) return;

    clearTimeout(miloFlyTimeout);

    container.classList.remove("milo-flying");

    container.style.left = "auto";
    container.style.top = "auto";
    container.style.right = "28px";
    container.style.bottom = "28px";
}


/* =========================================================
   ADD TO PUBLIC MILO API
========================================================= */


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

    playSound,
   
   fly: flyMiloAround,
returnHome: returnMiloHome

};
