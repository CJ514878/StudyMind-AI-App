/* =========================================================
   STUDYMIND AI — MILO COMPANION ENGINE
   COMPLETE REBUILT VERSION

   FEATURES
   ---------------------------------------------------------
   ✓ Friendly / smiling default personality
   ✓ Natural idle facial expressions
   ✓ Blinking
   ✓ Correct answer celebration
   ✓ Spoken "Woohoo!"
   ✓ Woohoo celebration sound effect
   ✓ Wrong answer frown + head shake
   ✓ Tap reaction: "Ow!"
   ✓ Five-tap dizzy / collapse event
   ✓ Stars circle Milo's head
   ✓ Milo falls through screen
   ✓ Milo returns after ~3 seconds
   ✓ Knowledge Check question timer
   ✓ Impatient after 15 seconds
   ✓ Existing XP system preserved
   ✓ Existing streak system preserved
   ✓ Existing Game Mode reactions preserved
   ✓ Existing Study Session completion preserved
   ✓ Existing tour/help preserved
   ✓ Shared AudioContext
   ✓ Existing window.Milo API preserved
========================================================= */

"use strict";


/* =========================================================
   STORAGE KEYS
========================================================= */

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
   MILO STATE
========================================================= */

const MiloState = {

    tapCount: 0,

    isCollapsed: false,

    isReacting: false,

    currentExpression: "happy",

    questionStartedAt: 0,

    questionTimer: null,

    expressionTimer: null,

    blinkTimer: null,

    returnTimer: null,

    observedQuestionIndex: null,

    speechEnabled: true

};


/* =========================================================
   AUDIO
========================================================= */

let miloAudioContext = null;


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        createMilo();

        installMiloReactionStyles();

        initializeMiloBehavior();

        setTimeout(
            startMiloExperience,
            700
        );

    }
);


/* =========================================================
   INITIALIZE MILO BEHAVIOR
========================================================= */

function initializeMiloBehavior() {

    startNaturalExpressionCycle();

    startBlinkCycle();

    observeKnowledgeCheck();

}


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
        document.createElement(
            "div"
        );


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
            role="button"
            tabindex="0"
        >

            <div
                class="milo-dizzy-stars"
                id="miloDizzyStars"
                aria-hidden="true"
            >

                <span>★</span>
                <span>✦</span>
                <span>★</span>

            </div>


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


    const character =
        document.getElementById(
            "miloCharacter"
        );


    if (!character) {

        return;

    }


    character.addEventListener(
        "click",
        event => {

            event.preventDefault();

            handleMiloTap();

        }
    );


    character.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();

                handleMiloTap();

            }

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
        !actionsElement ||
        !character
    ) {

        return;

    }


    if (
        MiloState.isCollapsed
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


            button.type =
                "button";


            button.textContent =
                action.label;


            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    if (
                        typeof action.onClick ===
                        "function"
                    ) {

                        action.onClick();

                    }

                }
            );


            actionsElement.appendChild(
                button
            );

        }
    );


    /*
     * Reset temporary reaction classes.
     */
    character.classList.remove(

        "milo-correct-reaction",

        "milo-wrong-reaction",

        "milo-answer-correct",

        "milo-answer-wrong",

        "milo-shake",

        "milo-frown",

        "milo-impatient",

        "milo-dizzy",

        "milo-hit",

        "milo-collapsing",

        "milo-returning"

    );


    character.className =
        `milo-character milo-${state}`;


    MiloState.currentExpression =
        state;

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
                    label:
                        "Show me around",

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
        "Hey! Ready to study? 😊";


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
                "happy"
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
                label:
                    "Next",

                onClick:
                    () => {

                        showMilo(

                            "Your Study Session is where we actually learn. I'll be here if you get stuck.",

                            "idle",

                            [
                                {
                                    label:
                                        "Next",

                                    onClick:
                                        () => {

                                            showMilo(

                                                "Knowledge Checks test what you really understand. If you get something wrong, I'll explain it instead of just saying 'wrong'.",

                                                "thinking",

                                                [
                                                    {
                                                        label:
                                                            "Next",

                                                        onClick:
                                                            () => {

                                                                showMilo(

                                                                    "And Game Mode lets you put your knowledge to the test. Just don't let me get knocked out! 😂",

                                                                    "excited",

                                                                    [
                                                                        {
                                                                            label:
                                                                                "Let's go!",

                                                                            onClick:
                                                                                hideMilo
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


/* =========================================================
   ADD XP
========================================================= */

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


/* =========================================================
   ASK STREAK GOAL
========================================================= */

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


/* =========================================================
   SET STREAK GOAL
========================================================= */

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
                type="button"
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

    stopQuestionTimer();


    MiloState.isReacting =
        true;


    showMilo(
        "Woohoo! 🎉",
        "celebrate"
    );


    const character =
        document.getElementById(
            "miloCharacter"
        );


    if (character) {

        character.classList.add(
            "milo-answer-correct",
            "milo-correct-reaction"
        );

    }


    /*
     * Actual spoken "Woohoo!"
     */
    speak(
        "Woohoo!"
    );


    /*
     * Separate celebration sound effect.
     */
    playSound(
        "woohoo"
    );


    /*
     * Award XP silently.
     *
     * Do NOT call addXP() here because that
     * would replace the Woohoo message.
     */

    const amount =
        5;


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


    setTimeout(
        () => {

            MiloState.isReacting =
                false;

        },
        1100
    );

}


/* =========================================================
   KNOWLEDGE CHECK — WRONG
========================================================= */

function miloWrongAnswer(
    explanation
) {

    stopQuestionTimer();


    MiloState.isReacting =
        true;


    showMilo(

        explanation ||
        "Not quite — that's okay! Let's learn from this one.",

        "wrong",

        [
            {
                label:
                    "I understand",

                onClick:
                    () => {

                        playSound(
                            "pop"
                        );

                    }
            }
        ]

    );


    const character =
        document.getElementById(
            "miloCharacter"
        );


    if (character) {

        character.classList.add(
            "milo-answer-wrong",
            "milo-wrong-reaction",
            "milo-frown",
            "milo-shake"
        );

    }


    playSound(
        "wrong"
    );


    setTimeout(
        () => {

            MiloState.isReacting =
                false;

        },
        1100
    );

}


/* =========================================================
   KNOWLEDGE CHECK — QUESTION START
========================================================= */

function miloQuestionStarted(
    data = {}
) {

    stopQuestionTimer();


    MiloState.questionStartedAt =
        Date.now();


    MiloState.isReacting =
        false;


    MiloState.observedQuestionIndex =
        Number.isFinite(
            Number(
                data.index
            )
        )
            ? Number(data.index)
            : null;


    const character =
        document.getElementById(
            "miloCharacter"
        );


    if (character) {

        character.classList.remove(
            "milo-impatient",
            "milo-wrong",
            "milo-frown",
            "milo-shake",
            "milo-answer-wrong",
            "milo-answer-correct"
        );

    }


    resetMiloMouth();


    /*
     * Start the 15-second impatience timer.
     */

    MiloState.questionTimer =
        setTimeout(
            () => {

                miloBecomeImpatient();

            },
            15000
        );

}


/* =========================================================
   KNOWLEDGE CHECK — QUESTION ANSWERED
========================================================= */

function miloQuestionAnswered(
    data = {}
) {

    stopQuestionTimer();


    if (
        data.correct
    ) {

        miloCorrectAnswer();

    } else {

        miloWrongAnswer(
            data.explanation
        );

    }

}


/* =========================================================
   MILO BECOMES IMPATIENT
========================================================= */

function miloBecomeImpatient() {

    if (
        MiloState.isCollapsed ||
        MiloState.isReacting
    ) {

        return;

    }


    const character =
        document.getElementById(
            "miloCharacter"
        );


    if (!character) {

        return;

    }


    character.classList.add(
        "milo-impatient"
    );


    MiloState.currentExpression =
        "impatient";


    showMilo(
        "Ahem... 😅 Take your time, but I'm waiting!",
        "impatient"
    );


    playSound(
        "impatient"
    );

}


/* =========================================================
   STOP QUESTION TIMER
========================================================= */

function stopQuestionTimer() {

    if (
        MiloState.questionTimer
    ) {

        clearTimeout(
            MiloState.questionTimer
        );

        MiloState.questionTimer =
            null;

    }

}


/* =========================================================
   OBSERVE KNOWLEDGE CHECK
========================================================= */

function observeKnowledgeCheck() {

    const knowledgeQuestions =
        document.getElementById(
            "knowledgeQuestions"
        );


    if (!knowledgeQuestions) {

        /*
         * The Knowledge Check may be created
         * after Milo initializes.
         */
        setTimeout(
            observeKnowledgeCheck,
            500
        );

        return;

    }


    let lastIndex =
        null;


    const detectQuestion =
        () => {

            const card =
                knowledgeQuestions.querySelector(
                    ".knowledge-question-card"
                );


            if (!card) {

                return;

            }


            const index =
                card.dataset.questionIndex;


            if (
                index === undefined
            ) {

                return;

            }


            if (
                index === lastIndex
            ) {

                return;

            }


            lastIndex =
                index;


            const questionText =
                card.querySelector(
                    ".knowledge-question"
                )?.textContent ||
                "";


            miloQuestionStarted({

                index:
                    Number(index),

                question:
                    questionText

            });

        };


    /*
     * MutationObserver means the current
     * Knowledge Check JS does NOT need to
     * be rewritten just for Milo.
     */

    const observer =
        new MutationObserver(
            () => {

                detectQuestion();

            }
        );


    observer.observe(
        knowledgeQuestions,
        {
            childList:
                true,

            subtree:
                true
        }
    );


    detectQuestion();

}


/* =========================================================
   TAP MILO
========================================================= */

function handleMiloTap() {

    if (
        MiloState.isCollapsed
    ) {

        return;

    }


    MiloState.tapCount++;


    stopQuestionTimer();


    const character =
        document.getElementById(
            "miloCharacter"
        );


    if (!character) {

        return;

    }


    /*
     * Fifth tap triggers the full
     * dizzy / collapse sequence.
     */

    if (
        MiloState.tapCount >= 5
    ) {

        triggerMiloCollapse();

        return;

    }


    /*
     * Normal tap reaction.
     */

    character.classList.remove(
        "milo-hit"
    );


    void character.offsetWidth;


    character.classList.add(
        "milo-hit"
    );


    showMilo(
        "Ow! 😭",
        "surprised"
    );


    speak(
        "Ow!"
    );


    playSound(
        "ow"
    );


    setTimeout(
        () => {

            character.classList.remove(
                "milo-hit"
            );

        },
        500
    );

}


/* =========================================================
   MILO COLLAPSE
========================================================= */

function triggerMiloCollapse() {

    if (
        MiloState.isCollapsed
    ) {

        return;

    }


    MiloState.isCollapsed =
        true;


    MiloState.tapCount =
        0;


    stopQuestionTimer();


    const character =
        document.getElementById(
            "miloCharacter"
        );


    const bubble =
        document.getElementById(
            "miloBubble"
        );


    const stars =
        document.getElementById(
            "miloDizzyStars"
        );


    if (!character) {

        MiloState.isCollapsed =
            false;

        return;

    }


    if (bubble) {

        bubble.style.display =
            "none";

    }


    /*
     * Dizzy.
     */

    character.classList.remove(
        "milo-hit"
    );


    character.classList.add(
        "milo-dizzy"
    );


    if (stars) {

        stars.classList.add(
            "show"
        );

    }


    showMiloTemporaryCollapseMessage();


    playSound(
        "dizzy"
    );


    speak(
        "Ow!"
    );


    /*
     * Give the stars and dizzy animation
     * time before Milo falls.
     */

    setTimeout(
        () => {

            character.classList.remove(
                "milo-dizzy"
            );


            character.classList.add(
                "milo-collapsing"
            );


            playSound(
                "fall"
            );

        },
        850
    );


    /*
     * Return after approximately 3 seconds.
     */

    MiloState.returnTimer =
        setTimeout(
            () => {

                returnMiloFromCollapse();

            },
            3000
        );

}


/* =========================================================
   COLLAPSE MESSAGE
========================================================= */

function showMiloTemporaryCollapseMessage() {

    const bubble =
        document.getElementById(
            "miloBubble"
        );


    const message =
        document.getElementById(
            "miloMessage"
        );


    const actions =
        document.getElementById(
            "miloActions"
        );


    if (
        !bubble ||
        !message ||
        !actions
    ) {

        return;

    }


    bubble.style.display =
        "block";


    message.textContent =
        "Okay... I think I need a minute. 😵‍💫";


    actions.innerHTML =
        "";

}


/* =========================================================
   RETURN MILO
========================================================= */

function returnMiloFromCollapse() {

    const character =
        document.getElementById(
            "miloCharacter"
        );


    const stars =
        document.getElementById(
            "miloDizzyStars"
        );


    if (!character) {

        MiloState.isCollapsed =
            false;

        return;

    }


    character.classList.remove(
        "milo-collapsing",
        "milo-dizzy"
    );


    character.classList.add(
        "milo-returning"
    );


    if (stars) {

        stars.classList.remove(
            "show"
        );

    }


    playSound(
        "return"
    );


    setTimeout(
        () => {

            character.classList.remove(
                "milo-returning"
            );


            MiloState.isCollapsed =
                false;


            MiloState.tapCount =
                0;


            showMilo(
                "I'm back! 😅",
                "happy"
            );


            setTimeout(
                () => {

                    hideMilo();

                },
                1800
            );

        },
        650
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


    if (!character) {

        return;

    }


    const mouth =
        character.querySelector(
            ".milo-mouth"
        );


    if (!mouth) {

        return;

    }


    mouth.removeAttribute(
        "style"
    );


    delete mouth.dataset.miloFrown;

}


/* =========================================================
   NATURAL EXPRESSIONS
========================================================= */

function startNaturalExpressionCycle() {

    clearTimeout(
        MiloState.expressionTimer
    );


    const delay =
        7000 +
        Math.random() * 9000;


    MiloState.expressionTimer =
        setTimeout(
            () => {

                performNaturalExpression();

                startNaturalExpressionCycle();

            },
            delay
        );

}


/* =========================================================
   PERFORM NATURAL EXPRESSION
========================================================= */

function performNaturalExpression() {

    if (
        MiloState.isCollapsed ||
        MiloState.isReacting
    ) {

        return;

    }


    const character =
        document.getElementById(
            "miloCharacter"
        );


    if (!character) {

        return;

    }


    const expressions = [

        "curious",

        "happy",

        "thinking",

        "sleepy",

        "surprised"

    ];


    const expression =
        expressions[
            Math.floor(
                Math.random() *
                expressions.length
            )
        ];


    character.classList.remove(
        "milo-curious",
        "milo-thinking",
        "milo-sleepy",
        "milo-surprised"
    );


    character.classList.add(
        `milo-${expression}`
    );


    MiloState.currentExpression =
        expression;


    /*
     * Most expressions are temporary.
     */

    setTimeout(
        () => {

            if (
                character &&
                !MiloState.isReacting &&
                !MiloState.isCollapsed
            ) {

                character.classList.remove(
                    `milo-${expression}`
                );

            }

        },
        1800
    );

}


/* =========================================================
   BLINKING
========================================================= */

function startBlinkCycle() {

    clearTimeout(
        MiloState.blinkTimer
    );


    const delay =
        3500 +
        Math.random() * 5000;


    MiloState.blinkTimer =
        setTimeout(
            () => {

                blinkMilo();

                startBlinkCycle();

            },
            delay
        );

}


/* =========================================================
   BLINK MILO
========================================================= */

function blinkMilo() {

    if (
        MiloState.isCollapsed
    ) {

        return;

    }


    const character =
        document.getElementById(
            "miloCharacter"
        );


    if (!character) {

        return;

    }


    character.classList.add(
        "milo-blink"
    );


    setTimeout(
        () => {

            character.classList.remove(
                "milo-blink"
            );

        },
        180
    );

}


/* =========================================================
   GAME MODE — CORRECT
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


/* =========================================================
   GAME MODE — WRONG
========================================================= */

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
                label:
                    "Ask Milo",

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
   SPEECH ENGINE
========================================================= */

function speak(
    text
) {

    if (
        !MiloState.speechEnabled
    ) {

        return;

    }


    if (
        !("speechSynthesis" in window)
    ) {

        return;

    }


    try {

        window.speechSynthesis.cancel();


        const utterance =
            new SpeechSynthesisUtterance(
                text
            );


        utterance.rate =
            1.08;


        utterance.pitch =
            1.15;


        utterance.volume =
            0.9;


        window.speechSynthesis.speak(
            utterance
        );

    } catch (error) {

        console.warn(
            "Milo speech unavailable:",
            error
        );

    }

}


/* =========================================================
   AUDIO CONTEXT
========================================================= */

function getMiloAudioContext() {

    const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;


    if (!AudioContext) {

        return null;

    }


    if (
        !miloAudioContext
    ) {

        try {

            miloAudioContext =
                new AudioContext();

        } catch (error) {

            console.warn(
                "Milo AudioContext unavailable:",
                error
            );

            return null;

        }

    }


    try {

        if (
            miloAudioContext.state ===
            "suspended"
        ) {

            miloAudioContext
                .resume()
                .catch(
                    () => {}
                );

        }

    } catch (_) {}


    return miloAudioContext;

}


/* =========================================================
   SOUND ENGINE
========================================================= */

function playSound(
    type
) {

    try {

        const context =
            getMiloAudioContext();


        if (!context) {

            return;

        }


        const now =
            context.currentTime;


        const sounds = {

            pop: {
                frequencies:
                    [500],
                duration:
                    0.08,
                volume:
                    0.10,
                wave:
                    "sine"
            },


            correct: {
                frequencies:
                    [523, 659, 784],
                duration:
                    0.11,
                volume:
                    0.11,
                wave:
                    "sine"
            },


            woohoo: {
                frequencies:
                    [523, 659, 784, 988, 1175],
                duration:
                    0.12,
                volume:
                    0.15,
                wave:
                    "triangle"
            },


            xp: {
                frequencies:
                    [659, 784, 988],
                duration:
                    0.09,
                volume:
                    0.10,
                wave:
                    "sine"
            },


            streak: {
                frequencies:
                    [392, 523, 659, 784],
                duration:
                    0.16,
                volume:
                    0.13,
                wave:
                    "sine"
            },


            goal: {
                frequencies:
                    [523, 659, 784, 1047],
                duration:
                    0.18,
                volume:
                    0.14,
                wave:
                    "sine"
            },


            welcome: {
                frequencies:
                    [392, 523, 659],
                duration:
                    0.16,
                volume:
                    0.11,
                wave:
                    "sine"
            },


            sessionComplete: {
                frequencies:
                    [523, 659, 784, 1047],
                duration:
                    0.16,
                volume:
                    0.14,
                wave:
                    "triangle"
            },


            wrong: {
                frequencies:
                    [330, 260],
                duration:
                    0.18,
                volume:
                    0.10,
                wave:
                    "sine"
            },


            ow: {
                frequencies:
                    [260, 190],
                duration:
                    0.13,
                volume:
                    0.10,
                wave:
                    "triangle"
            },


            dizzy: {
                frequencies:
                    [500, 430, 360],
                duration:
                    0.13,
                volume:
                    0.08,
                wave:
                    "sine"
            },


            fall: {
                frequencies:
                    [300, 240, 180, 120],
                duration:
                    0.10,
                volume:
                    0.10,
                wave:
                    "sawtooth"
            },


            return: {
                frequencies:
                    [220, 330, 440, 660],
                duration:
                    0.11,
                volume:
                    0.10,
                wave:
                    "sine"
            },


            impatient: {
                frequencies:
                    [280, 220],
                duration:
                    0.16,
                volume:
                    0.07,
                wave:
                    "triangle"
            },


            punch: {
                frequencies:
                    [150, 90],
                duration:
                    0.12,
                volume:
                    0.12,
                wave:
                    "sawtooth"
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

                const oscillator =
                    context.createOscillator();


                const gain =
                    context.createGain();


                oscillator.type =
                    sound.wave;


                oscillator.frequency.setValueAtTime(
                    frequency,
                    now +
                    index *
                    sound.duration
                );


                oscillator.connect(
                    gain
                );


                gain.connect(
                    context.destination
                );


                const start =
                    now +
                    index *
                    sound.duration;


                const end =
                    start +
                    sound.duration;


                gain.gain.setValueAtTime(
                    0.0001,
                    start
                );


                gain.gain.exponentialRampToValueAtTime(
                    sound.volume,
                    start + 0.01
                );


                gain.gain.exponentialRampToValueAtTime(
                    0.0001,
                    end
                );


                oscillator.start(
                    start
                );


                oscillator.stop(
                    end
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
        document.createElement(
            "style"
        );


    style.id =
        "studyMindMiloReactionStyles";


    style.textContent = `

        /* =================================================
           BASE
        ================================================= */

        #miloCharacter {

            transform-origin:
                center bottom;

        }


        #miloCharacter .milo-mouth {

            transition:
                all
                .18s
                ease;

        }


        /* =================================================
           HAPPY SMILE
        ================================================= */

        #miloCharacter.milo-happy .milo-mouth,
        #miloCharacter.milo-idle .milo-mouth,
        #miloCharacter.milo-excited .milo-mouth,
        #miloCharacter.milo-celebrate .milo-mouth {

            width:
                26px !important;

            height:
                12px !important;

            background:
                transparent !important;

            border:
                0 !important;

            border-bottom:
                4px solid #ffffff !important;

            border-radius:
                0 0 20px 20px !important;

            transform:
                translateX(-50%) !important;

        }


        /* =================================================
           REAL FROWN
        ================================================= */

        #miloCharacter.milo-frown .milo-mouth,
        #miloCharacter.milo-wrong .milo-mouth,
        #miloCharacter.milo-wrong-reaction .milo-mouth,
        #miloCharacter.milo-answer-wrong .milo-mouth {

            width:
                25px !important;

            height:
                13px !important;

            background:
                transparent !important;

            border:
                0 !important;

            border-top:
                4px solid #ffffff !important;

            border-radius:
                20px 20px 0 0 !important;

            transform:
                translateX(-50%) !important;

        }


        /* =================================================
           CORRECT ANSWER
        ================================================= */

        #miloCharacter.milo-answer-correct,
        #miloCharacter.milo-correct-reaction {

            animation:
                miloWoohoo
                .8s
                cubic-bezier(.2,.8,.2,1)
                both;

        }


        @keyframes miloWoohoo {

            0% {

                transform:
                    translateY(0)
                    scale(1)
                    rotate(0deg);

            }

            20% {

                transform:
                    translateY(-12px)
                    scale(1.08)
                    rotate(-6deg);

            }

            40% {

                transform:
                    translateY(-20px)
                    scale(1.14)
                    rotate(6deg);

            }

            60% {

                transform:
                    translateY(-10px)
                    scale(1.08)
                    rotate(-4deg);

            }

            80% {

                transform:
                    translateY(-4px)
                    scale(1.04)
                    rotate(3deg);

            }

            100% {

                transform:
                    translateY(0)
                    scale(1)
                    rotate(0deg);

            }

        }


        /* =================================================
           WRONG ANSWER
        ================================================= */

        #miloCharacter.milo-wrong-reaction,
        #miloCharacter.milo-shake {

            animation:
                miloWrongShake
                .65s
                ease-in-out
                both;

        }


        @keyframes miloWrongShake {

            0% {

                transform:
                    translateX(0)
                    rotate(0deg);

            }

            18% {

                transform:
                    translateX(-9px)
                    rotate(-5deg);

            }

            36% {

                transform:
                    translateX(9px)
                    rotate(5deg);

            }

            54% {

                transform:
                    translateX(-7px)
                    rotate(-4deg);

            }

            72% {

                transform:
                    translateX(6px)
                    rotate(3deg);

            }

            100% {

                transform:
                    translateX(0)
                    rotate(0deg);

            }

        }


        /* =================================================
           NATURAL EXPRESSIONS
        ================================================= */

        #miloCharacter.milo-curious .milo-eye {

            transform:
                translateY(-2px)
                scaleY(.88);

        }


        #miloCharacter.milo-curious .milo-mouth {

            width:
                13px !important;

            height:
                13px !important;

            border:
                3px solid #ffffff !important;

            border-radius:
                50% !important;

            transform:
                translateX(-50%) !important;

        }


        #miloCharacter.milo-thinking .milo-mouth {

            width:
                18px !important;

            height:
                4px !important;

            border:
                0 !important;

            border-bottom:
                3px solid #ffffff !important;

            transform:
                translateX(-50%) !important;

        }


        #miloCharacter.milo-surprised .milo-mouth {

            width:
                14px !important;

            height:
                18px !important;

            border:
                3px solid #ffffff !important;

            border-radius:
                50% !important;

            transform:
                translateX(-50%) !important;

        }


        #miloCharacter.milo-sleepy .milo-eye {

            height:
                4px !important;

            border-radius:
                10px;

            top:
                43px;

        }


        #miloCharacter.milo-sleepy .milo-mouth {

            width:
                18px !important;

            height:
                5px !important;

            border:
                0 !important;

            border-bottom:
                3px solid #ffffff !important;

            transform:
                translateX(-50%) !important;

        }


        /* =================================================
           BLINK
        ================================================= */

        #miloCharacter.milo-blink .milo-eye {

            transform:
                scaleY(.08);

            transition:
                transform
                .09s
                ease;

        }


        /* =================================================
           IMPATIENT
        ================================================= */

        #miloCharacter.milo-impatient {

            animation:
                miloImpatient
                .9s
                ease-in-out
                infinite;

        }


        #miloCharacter.milo-impatient .milo-eye {

            transform:
                translateY(2px)
                scaleY(.75);

        }


        #miloCharacter.milo-impatient .milo-mouth {

            width:
                20px !important;

            height:
                5px !important;

            border:
                0 !important;

            border-bottom:
                3px solid #ffffff !important;

            transform:
                translateX(-50%) !important;

        }


        @keyframes miloImpatient {

            0%,
            100% {

                transform:
                    translateY(0);

            }

            50% {

                transform:
                    translateY(-3px);

            }

        }


        /* =================================================
           TAP / OW
        ================================================= */

        #miloCharacter.milo-hit {

            animation:
                miloHit
                .45s
                ease-out
                both;

        }


        @keyframes miloHit {

            0% {

                transform:
                    scale(1);

            }

            20% {

                transform:
                    translateX(-8px)
                    rotate(-6deg)
                    scale(.96);

            }

            45% {

                transform:
                    translateX(8px)
                    rotate(6deg)
                    scale(1.03);

            }

            70% {

                transform:
                    translateX(-4px)
                    rotate(-3deg);

            }

            100% {

                transform:
                    translateX(0)
                    rotate(0)
                    scale(1);

            }

        }


        /* =================================================
           DIZZY
        ================================================= */

        #miloCharacter.milo-dizzy {

            animation:
                miloDizzy
                .65s
                ease-in-out
                infinite;

        }


        @keyframes miloDizzy {

            0% {

                transform:
                    rotate(0deg)
                    translateY(0);

            }

            25% {

                transform:
                    rotate(-8deg)
                    translateY(-4px);

            }

            50% {

                transform:
                    rotate(8deg)
                    translateY(0);

            }

            75% {

                transform:
                    rotate(-6deg)
                    translateY(-3px);

            }

            100% {

                transform:
                    rotate(0deg)
                    translateY(0);

            }

        }


        /* =================================================
           STARS
        ================================================= */

        .milo-dizzy-stars {

            position:
                absolute;

            left:
                50%;

            top:
                -12px;

            width:
                100px;

            height:
                100px;

            transform:
                translateX(-50%);

            pointer-events:
                none;

            opacity:
                0;

            z-index:
                30;

        }


        .milo-dizzy-stars.show {

            opacity:
                1;

            animation:
                miloStarsOrbit
                1.1s
                linear
                infinite;

        }


        .milo-dizzy-stars span {

            position:
                absolute;

            font-size:
                20px;

            color:
                #ffc857;

            text-shadow:
                0 0 10px
                rgba(
                    255,
                    200,
                    87,
                    .8
                );

        }


        .milo-dizzy-stars span:nth-child(1) {

            top:
                0;

            left:
                40px;

        }


        .milo-dizzy-stars span:nth-child(2) {

            top:
                38px;

            right:
                0;

        }


        .milo-dizzy-stars span:nth-child(3) {

            bottom:
                0;

            left:
                12px;

        }


        @keyframes miloStarsOrbit {

            from {

                transform:
                    translateX(-50%)
                    rotate(0deg);

            }

            to {

                transform:
                    translateX(-50%)
                    rotate(360deg);

            }

        }


        /* =================================================
           FALL THROUGH SCREEN
        ================================================= */

        #miloCharacter.milo-collapsing {

            animation:
                miloFallThroughScreen
                1.25s
                cubic-bezier(.7,0,.9,.4)
                forwards;

        }


        @keyframes miloFallThroughScreen {

            0% {

                transform:
                    translateY(0)
                    rotate(0deg)
                    scale(1);

                opacity:
                    1;

            }

            20% {

                transform:
                    translateY(20px)
                    rotate(8deg)
                    scale(.95);

            }

            55% {

                transform:
                    translateY(180px)
                    rotate(-15deg)
                    scale(.75);

            }

            100% {

                transform:
                    translateY(
                        calc(
                            100vh + 220px
                        )
                    )
                    rotate(55deg)
                    scale(.35);

                opacity:
                    0;

            }

        }


        /* =================================================
           RETURN
        ================================================= */

        #miloCharacter.milo-returning {

            animation:
                miloReturn
                .65s
                cubic-bezier(.2,.8,.2,1)
                both;

        }


        @keyframes miloReturn {

            0% {

                transform:
                    translateY(
                        calc(
                            100vh + 200px
                        )
                    )
                    rotate(-35deg)
                    scale(.4);

                opacity:
                    0;

            }

            65% {

                transform:
                    translateY(-18px)
                    rotate(5deg)
                    scale(1.05);

                opacity:
                    1;

            }

            100% {

                transform:
                    translateY(0)
                    rotate(0)
                    scale(1);

                opacity:
                    1;

            }

        }


        /* =================================================
           STREAK OVERLAY
        ================================================= */

        #miloStreakOverlay {

            position:
                fixed;

            inset:
                0;

            display:
                flex;

            align-items:
                center;

            justify-content:
                center;

            background:
                rgba(
                    10,
                    12,
                    30,
                    .55
                );

            backdrop-filter:
                blur(8px);

            opacity:
                0;

            pointer-events:
                none;

            transition:
                opacity
                .3s
                ease;

            z-index:
                100000;

        }


        #miloStreakOverlay.show {

            opacity:
                1;

            pointer-events:
                auto;

        }


        .milo-streak-card {

            width:
                min(
                    420px,
                    calc(
                        100vw - 40px
                    )
                );

            padding:
                34px;

            border-radius:
                28px;

            text-align:
                center;

            background:
                #ffffff;

            box-shadow:
                0 25px 80px
                rgba(
                    0,
                    0,
                    0,
                    .25
                );

            transform:
                translateY(25px)
                scale(.94);

            transition:
                transform
                .35s
                ease;

        }


        #miloStreakOverlay.show
        .milo-streak-card {

            transform:
                translateY(0)
                scale(1);

        }


        .milo-fire {

            font-size:
                55px;

            animation:
                miloFire
                .7s
                ease-in-out
                infinite
                alternate;

        }


        @keyframes miloFire {

            from {

                transform:
                    scale(1);

            }

            to {

                transform:
                    scale(1.12)
                    translateY(-4px);

            }

        }


        .milo-streak-number {

            font-size:
                64px;

            font-weight:
                900;

            line-height:
                1;

            margin-top:
                8px;

        }


        .milo-streak-title {

            margin-top:
                10px;

            font-size:
                18px;

            font-weight:
                900;

        }


        .milo-streak-text {

            margin-top:
                8px;

            opacity:
                .7;

        }


        .milo-streak-card button {

            margin-top:
                22px;

            border:
                0;

            border-radius:
                999px;

            padding:
                11px 22px;

            font-weight:
                800;

            cursor:
                pointer;

        }


        @media (
            max-width: 700px
        ) {

            .milo-dizzy-stars {

                transform:
                    translateX(-50%)
                    scale(.85);

            }

        }

    `;


    document.head.appendChild(
        style
    );

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

    miloQuestionStarted,

    miloQuestionAnswered,

    miloGameCorrect,

    miloGameWrong,

    miloStudySessionComplete,

    miloOfferHelp,

    playSound,

    speak,

    handleMiloTap

};
