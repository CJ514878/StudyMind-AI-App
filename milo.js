/* =========================================================
   STUDYMIND AI — MILO COMPANION
   COMPLETE REBUILT MILO ENGINE
========================================================= */

"use strict";


/* =========================================================
   STORAGE
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
   INTERNAL STATE
========================================================= */

let miloAudioContext = null;

let miloTapCount = 0;

let miloTapResetTimer = null;

let miloBusy = false;

let miloCollapsed = false;

let miloQuestionTimer = null;

let miloQuestionObserver = null;

let miloIdleTimer = null;

let miloIdleExpressionTimer = null;

let miloLastQuestionSignature = "";

let miloReturnTimer = null;


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        createMilo();

        setTimeout(
            () => {

                startMiloExperience();

                startMiloIdleExpressions();

                installQuestionObserver();

            },
            700
        );

    }
);


/* =========================================================
   CREATE MILO
========================================================= */

function createMilo() {

    if (document.getElementById("miloCompanion")) {
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
            aria-live="polite"
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
            tabindex="0"
            role="button"
        >

            <div class="milo-antenna"></div>


            <div class="milo-body">

                <div class="milo-face">

                    <div
                        class="milo-eyebrow left"
                    ></div>

                    <div
                        class="milo-eyebrow right"
                    ></div>


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


            <div
                class="milo-dizzy-stars"
                aria-hidden="true"
            >

                <span class="milo-dizzy-star">
                    ★
                </span>

                <span class="milo-dizzy-star">
                    ★
                </span>

                <span class="milo-dizzy-star">
                    ★
                </span>

                <span class="milo-dizzy-star">
                    ★
                </span>

            </div>

        </div>

    `;


    document.body.appendChild(container);


    const character =
        document.getElementById(
            "miloCharacter"
        );


    if (character) {

        character.addEventListener(
            "click",
            handleMiloTap
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

}


/* =========================================================
   CHARACTER STATE
========================================================= */

const MILO_STATES = [

    "milo-happy",

    "milo-celebrate",

    "milo-wrong",

    "milo-frown",

    "milo-shake",

    "milo-thinking",

    "milo-surprised",

    "milo-sleepy",

    "milo-impatient",

    "milo-blink",

    "milo-ow",

    "milo-dizzy",

    "milo-punched",

    "milo-excited"

];


function setMiloFace(state) {

    const character =
        document.getElementById(
            "miloCharacter"
        );

    if (!character) {
        return;
    }


    MILO_STATES.forEach(
        className => {

            character.classList.remove(
                className
            );

        }
    );


    if (state) {

        character.classList.add(
            `milo-${state}`
        );

    }

}


/* =========================================================
   SHOW MILO
========================================================= */

function showMilo(
    message,
    state = "happy",
    actions = []
) {

    const bubble =
        document.getElementById(
            "miloBubble"
        );

    const messageEl =
        document.getElementById(
            "miloMessage"
        );

    const actionsEl =
        document.getElementById(
            "miloActions"
        );


    if (!bubble || !messageEl) {
        return;
    }


    setMiloFace(state);


    messageEl.textContent =
        message || "";


    if (actionsEl) {

        actionsEl.innerHTML =
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
                    () => {

                        if (
                            typeof action.onClick ===
                            "function"
                        ) {

                            action.onClick();

                        }

                    }
                );


                actionsEl.appendChild(
                    button
                );

            }
        );

    }


    bubble.style.display =
        "block";


    clearTimeout(miloIdleTimer);


    miloIdleTimer =
        setTimeout(
            () => {

                if (!miloBusy) {
                    hideMilo();
                }

            },
            7000
        );

}


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
   SPEECH
========================================================= */

function speakMilo(
    text,
    options = {}
) {

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
            options.rate ??
            1.08;


        utterance.pitch =
            options.pitch ??
            1.38;


        utterance.volume =
            options.volume ??
            0.95;


        utterance.lang =
            "en-US";


        window.speechSynthesis.speak(
            utterance
        );

    } catch (error) {

        console.warn(
            "Milo speech failed:",
            error
        );

    }

}


/* =========================================================
   AUDIO CONTEXT
========================================================= */

function getMiloAudioContext() {

    if (!miloAudioContext) {

        const AudioContextClass =
            window.AudioContext ||
            window.webkitAudioContext;


        if (!AudioContextClass) {
            return null;
        }


        miloAudioContext =
            new AudioContextClass();

    }


    if (
        miloAudioContext.state ===
        "suspended"
    ) {

        miloAudioContext.resume()
            .catch(() => {});

    }


    return miloAudioContext;

}


/* =========================================================
   BASIC TONE
========================================================= */

function miloTone(
    frequency,
    duration,
    startTime,
    type = "sine",
    volume = 0.08,
    endFrequency = null
) {

    const ctx =
        getMiloAudioContext();

    if (!ctx) {
        return;
    }


    const oscillator =
        ctx.createOscillator();

    const gain =
        ctx.createGain();


    oscillator.type =
        type;


    oscillator.frequency.setValueAtTime(
        frequency,
        startTime
    );


    if (endFrequency) {

        oscillator.frequency.exponentialRampToValueAtTime(
            Math.max(
                20,
                endFrequency
            ),
            startTime + duration
        );

    }


    gain.gain.setValueAtTime(
        0.0001,
        startTime
    );


    gain.gain.exponentialRampToValueAtTime(
        volume,
        startTime + 0.025
    );


    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        startTime + duration
    );


    oscillator.connect(gain);

    gain.connect(ctx.destination);


    oscillator.start(
        startTime
    );

    oscillator.stop(
        startTime + duration + 0.03
    );

}


/* =========================================================
   SOUND EFFECTS
========================================================= */

function playSound(type) {

    const ctx =
        getMiloAudioContext();

    if (!ctx) {
        return;
    }


    const now =
        ctx.currentTime;


    switch (type) {


        /* -----------------------------------------
           POP
        ----------------------------------------- */

        case "pop":

            miloTone(
                600,
                .09,
                now,
                "sine",
                .07,
                850
            );

            break;


        /* -----------------------------------------
           WOOHOO
           Longer + brighter
        ----------------------------------------- */

        case "woohoo":

            miloTone(
                520,
                .18,
                now,
                "sine",
                .08,
                720
            );


            miloTone(
                720,
                .20,
                now + .16,
                "sine",
                .09,
                980
            );


            miloTone(
                980,
                .28,
                now + .34,
                "triangle",
                .10,
                1320
            );


            miloTone(
                1320,
                .35,
                now + .58,
                "sine",
                .07,
                1500
            );


            break;


        /* -----------------------------------------
           OW
           Higher, shorter, softer
        ----------------------------------------- */

        case "ow":

            miloTone(
                760,
                .10,
                now,
                "sine",
                .09,
                650
            );


            miloTone(
                650,
                .15,
                now + .08,
                "triangle",
                .08,
                520
            );


            break;


        /* -----------------------------------------
           CORRECT
        ----------------------------------------- */

        case "correct":

            miloTone(
                660,
                .12,
                now,
                "sine",
                .06,
                820
            );


            miloTone(
                820,
                .16,
                now + .12,
                "sine",
                .07,
                1040
            );


            break;


        /* -----------------------------------------
           WRONG
        ----------------------------------------- */

        case "wrong":

            miloTone(
                390,
                .15,
                now,
                "triangle",
                .07,
                280
            );


            miloTone(
                280,
                .18,
                now + .13,
                "triangle",
                .06,
                210
            );


            break;


        /* -----------------------------------------
           XP
        ----------------------------------------- */

        case "xp":

            miloTone(
                660,
                .10,
                now,
                "sine",
                .05,
                800
            );


            miloTone(
                800,
                .12,
                now + .10,
                "sine",
                .05,
                980
            );


            break;


        /* -----------------------------------------
           STREAK
        ----------------------------------------- */

        case "streak":

            miloTone(
                392,
                .13,
                now,
                "sine",
                .06,
                523
            );


            miloTone(
                523,
                .13,
                now + .12,
                "sine",
                .06,
                659
            );


            miloTone(
                659,
                .16,
                now + .24,
                "sine",
                .06,
                784
            );


            break;


        /* -----------------------------------------
           SESSION COMPLETE
        ----------------------------------------- */

        case "sessionComplete":

            miloTone(
                523,
                .12,
                now,
                "sine",
                .06,
                659
            );


            miloTone(
                659,
                .12,
                now + .12,
                "sine",
                .06,
                784
            );


            miloTone(
                784,
                .16,
                now + .24,
                "sine",
                .07,
                1047
            );


            miloTone(
                1047,
                .25,
                now + .40,
                "triangle",
                .07,
                1320
            );


            break;


        /* -----------------------------------------
           PUNCH
        ----------------------------------------- */

        case "punch":

            miloTone(
                180,
                .08,
                now,
                "square",
                .055,
                90
            );


            break;

    }

}


/* =========================================================
   TAP HANDLER
========================================================= */

function handleMiloTap() {

    if (miloCollapsed) {
        return;
    }


    miloTapCount++;


    clearTimeout(
        miloTapResetTimer
    );


    /*
       Reset tap count if the student stops
       tapping for 5 seconds.
    */

    miloTapResetTimer =
        setTimeout(
            () => {

                miloTapCount = 0;

            },
            5000
        );


    if (miloTapCount >= 5) {

        startMiloCollapseSequence();

        return;
    }


    miloTapReaction();

}


/* =========================================================
   PHYSICAL OW REACTION
========================================================= */

function miloTapReaction() {

    miloBusy = true;


    clearTimeout(
        miloIdleTimer
    );


    const character =
        document.getElementById(
            "miloCharacter"
        );


    if (!character) {
        return;
    }


    setMiloFace("ow");


    showMilo(
        "OW! 😭",
        "ow"
    );


    playSound("ow");


    /*
       Higher, child-friendly voice.
    */

    speakMilo(
        "Ow!",
        {
            rate: 1.22,
            pitch: 1.55,
            volume: .9
        }
    );


    /*
       After the initial pain reaction,
       Milo looks slightly stunned.
    */

    setTimeout(
        () => {

            if (miloCollapsed) {
                return;
            }


            setMiloFace("surprised");

        },
        350
    );


    setTimeout(
        () => {

            miloBusy = false;

        },
        900
    );

}


/* =========================================================
   FIVE-TAP COLLAPSE
========================================================= */

function startMiloCollapseSequence() {

    if (miloCollapsed) {
        return;
    }


    miloCollapsed = true;

    miloBusy = true;

    clearTimeout(
        miloIdleTimer
    );


    const character =
        document.getElementById(
            "miloCharacter"
        );


    if (!character) {
        return;
    }


    /*
       Start with a visibly stunned face.
    */

    setMiloFace("surprised");


    showMilo(
        "Whoa... 😵‍💫",
        "surprised"
    );


    playSound("punch");


    /*
       First impact.
    */

    character.classList.add(
        "milo-punched"
    );


    setTimeout(
        () => {

            character.classList.remove(
                "milo-punched"
            );

            setMiloFace("dizzy");


            /*
               This is the important part:
               the dizzy state stays visible.
            */

            showMilo(
                "Okay... whoa... 😵‍💫",
                "dizzy"
            );

        },
        650
    );


    /*
       Let the student actually see
       the dizzy eyes and stars.
    */

    setTimeout(
        () => {

            character.classList.add(
                "milo-collapse"
            );

        },
        1700
    );


    /*
       Character has now fallen away.
    */

    setTimeout(
        () => {

            character.classList.remove(
                "milo-collapse"
            );


            character.style.visibility =
                "hidden";


        },
        2700
    );


    /*
       Three seconds later:
       Milo comes back from below.
    */

    miloReturnTimer =
        setTimeout(
            () => {

                character.style.visibility =
                    "visible";


                character.classList.add(
                    "milo-return"
                );


                setMiloFace("surprised");


                showMilo(
                    "Okay... I think I need a minute. 😵‍💫",
                    "surprised"
                );


                setTimeout(
                    () => {

                        character.classList.remove(
                            "milo-return"
                        );


                        setMiloFace(
                            "happy"
                        );


                        showMilo(
                            "I'm okay now. 😅",
                            "happy"
                        );


                        miloTapCount =
                            0;


                        miloCollapsed =
                            false;


                        miloBusy =
                            false;

                    },
                    1800
                );

            },
            3000
        );

}


/* =========================================================
   QUESTION TIMER
========================================================= */

function startMiloQuestionTimer() {

    clearTimeout(
        miloQuestionTimer
    );


    setMiloFace("thinking");


    miloQuestionTimer =
        setTimeout(
            () => {

                if (miloCollapsed) {
                    return;
                }


                setMiloFace(
                    "impatient"
                );


                showMilo(
                    "Ahem... 😅 I'm still waiting.",
                    "impatient"
                );

            },
            15000
        );

}


function stopMiloQuestionTimer() {

    clearTimeout(
        miloQuestionTimer
    );

    miloQuestionTimer =
        null;

}


/* =========================================================
   PUBLIC QUESTION START
========================================================= */

function miloQuestionStarted() {

    if (miloCollapsed) {
        return;
    }

    startMiloQuestionTimer();

}


/* =========================================================
   PUBLIC QUESTION ANSWERED
========================================================= */

function miloQuestionAnswered() {

    stopMiloQuestionTimer();

}


/* =========================================================
   OBSERVE KNOWLEDGE CHECK
========================================================= */

function installQuestionObserver() {

    if (
        miloQuestionObserver ||
        !document.body
    ) {
        return;
    }


    miloQuestionObserver =
        new MutationObserver(
            () => {

                detectKnowledgeQuestion();

            }
        );


    miloQuestionObserver.observe(
        document.body,
        {
            childList: true,
            subtree: true,
            characterData: true
        }
    );


    detectKnowledgeQuestion();

}


function detectKnowledgeQuestion() {

    const card =
        document.querySelector(
            ".knowledge-question-card"
        );


    if (!card) {
        return;
    }


    /*
       Build a signature from the
       question text.

       This means changing to the
       next question automatically
       starts the 15-second timer.
    */

    const signature =
        card.innerText
            .replace(/\s+/g, " ")
            .trim();


    if (!signature) {
        return;
    }


    if (
        signature !==
        miloLastQuestionSignature
    ) {

        miloLastQuestionSignature =
            signature;


        miloQuestionStarted();

    }

}


/* =========================================================
   CORRECT ANSWER
========================================================= */

function miloCorrectAnswer() {

    stopMiloQuestionTimer();


    miloBusy = true;


    setMiloFace(
        "celebrate"
    );


    showMilo(
        "WOOHOO! 🎉 You got it!",
        "celebrate"
    );


    /*
       Longer, higher Woohoo.
    */

    playSound(
        "woohoo"
    );


    speakMilo(
        "Woohoo!",
        {
            rate: .82,
            pitch: 1.48,
            volume: .95
        }
    );


    /*
       +5 XP
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

            miloBusy = false;

        },
        1800
    );

}


/* =========================================================
   WRONG ANSWER
========================================================= */

function miloWrongAnswer(
    explanation
) {

    stopMiloQuestionTimer();


    miloBusy = true;


    setMiloFace(
        "wrong"
    );


    showMilo(
        explanation ||
        "Not quite. Let's look at that again.",
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


    playSound(
        "wrong"
    );


    const character =
        document.getElementById(
            "miloCharacter"
        );


    if (character) {

        character.classList.add(
            "milo-shake"
        );


        setTimeout(
            () => {

                character.classList.remove(
                    "milo-shake"
                );

            },
            1100
        );

    }


    setTimeout(
        () => {

            miloBusy = false;

        },
        1400
    );

}


/* =========================================================
   GAME MODE CORRECT
========================================================= */

function miloGameCorrect() {

    miloBusy = true;


    setMiloFace(
        "celebrate"
    );


    showMilo(
        "YESSS! 🎉 Woohoo!",
        "celebrate"
    );


    playSound(
        "woohoo"
    );


    speakMilo(
        "Woohoo!",
        {
            rate: .84,
            pitch: 1.48
        }
    );


    addXP(
        10,
        "game correct answer"
    );


    setTimeout(
        () => {

            miloBusy = false;

        },
        1600
    );

}


/* =========================================================
   GAME MODE WRONG
========================================================= */

function miloGameWrong() {

    miloBusy = true;


    setMiloFace(
        "wrong"
    );


    showMilo(
        "Oh no! 😭",
        "wrong"
    );


    playSound(
        "punch"
    );


    const character =
        document.getElementById(
            "miloCharacter"
        );


    if (character) {

        character.classList.add(
            "milo-shake"
        );

        setTimeout(
            () => {

                character.classList.remove(
                    "milo-shake"
                );

            },
            1000
        );

    }


    setTimeout(
        () => {

            miloBusy = false;

        },
        1200
    );

}


/* =========================================================
   STUDY SESSION COMPLETE
========================================================= */

function miloStudySessionComplete() {

    miloBusy = true;


    setMiloFace(
        "celebrate"
    );


    showMilo(
        "STUDY SESSION COMPLETE! 🎉",
        "celebrate"
    );


    playSound(
        "sessionComplete"
    );


    speakMilo(
        "Awesome! You did it!",
        {
            rate: .92,
            pitch: 1.4
        }
    );


    addXP(
        25,
        "study session complete"
    );


    setTimeout(
        () => {

            miloBusy = false;

        },
        2200
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
    reason = "StudyMind activity"
) {

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
        "happy"
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

    const current =
        getStreakGoal();


    if (current) {

        showMilo(
            `Your current streak goal is ${current} days 🔥`,
            "happy"
        );

        return current;

    }


    showMilo(
        "How many study days do you want to aim for?",
        "thinking"
    );

}


/* =========================================================
   SET STREAK GOAL
========================================================= */

function setStreakGoal(
    days
) {

    const goal =
        Number(days);


    if (
        !Number.isFinite(goal) ||
        goal <= 0
    ) {
        return;
    }


    localStorage.setItem(
        MILO_KEYS.STREAK_GOAL,
        String(goal)
    );


    showMilo(
        `${goal} days? Let's do it! 🔥`,
        "excited"
    );


    playSound(
        "streak"
    );

}


/* =========================================================
   STREAK CELEBRATION
========================================================= */

function celebrateStreak(
    streak
) {

    const currentStreak =
        Number(streak) || 0;


    addXP(
        10,
        "streak celebration"
    );


    showStreakOverlay(
        currentStreak
    );


    playSound(
        "streak"
    );


    if (
        currentStreak >= 7
    ) {

        setTimeout(
            () => {

                showMilo(
                    "ONE WEEK STREAK! 🔥🎉",
                    "celebrate"
                );

            },
            800
        );

    }


    const goal =
        getStreakGoal();


    if (
        goal &&
        currentStreak >= goal
    ) {

        localStorage.setItem(
            MILO_KEYS.STREAK_GOAL_REWARD,
            "true"
        );


        setTimeout(
            () => {

                showMilo(
                    `You reached your ${goal}-day goal! 🏆`,
                    "celebrate"
                );

            },
            1500
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

            <div class="milo-streak-fire">
                🔥
            </div>

            <div class="milo-streak-number">
                ${streak}
            </div>

            <div class="milo-streak-label">
                DAY STREAK!
            </div>

            <div class="milo-streak-subtitle">
                Keep going!
            </div>

        </div>

    `;


    document.body.appendChild(
        overlay
    );


    setTimeout(
        () => {

            overlay.remove();

        },
        3000
    );

}


/* =========================================================
   HELP
========================================================= */

function miloOfferHelp() {

    showMilo(
        "Need help? I'm right here. 🤖",
        "happy",
        [
            {
                label:
                    "Okay",

                onClick:
                    () => {

                        hideMilo();

                    }
            }
        ]
    );

}


/* =========================================================
   FIRST VISIT
========================================================= */

function startMiloExperience() {

    const visited =
        localStorage.getItem(
            MILO_KEYS.FIRST_VISIT
        );


    if (!visited) {

        localStorage.setItem(
            MILO_KEYS.FIRST_VISIT,
            "true"
        );


        showMilo(
            "Hey! I'm Milo 🤖 Your study buddy!",
            "happy"
        );


        playSound(
            "pop"
        );


        setTimeout(
            () => {

                showMilo(
                    "I'll celebrate your wins and help when things get tough. 🎓",
                    "happy"
                );

            },
            3500
        );


        return;

    }


    /*
       Small occasional greeting.
    */

    setTimeout(
        () => {

            if (
                !miloBusy &&
                Math.random() < .35
            ) {

                showMilo(
                    getRandomGreeting(),
                    "happy"
                );

            }

        },
        1200
    );

}


/* =========================================================
   RANDOM GREETINGS
========================================================= */

function getRandomGreeting() {

    const greetings = [

        "Ready to study? 😎",

        "Let's get something done today! 📚",

        "I'm keeping an eye on you... 👀",

        "You've got this! 💪",

        "What are we learning today? 🤖",

        "Another day, another win. ⭐"

    ];


    return greetings[
        Math.floor(
            Math.random() *
            greetings.length
        )
    ];

}


/* =========================================================
   NATURAL IDLE EXPRESSIONS
========================================================= */

function startMiloIdleExpressions() {

    clearTimeout(
        miloIdleExpressionTimer
    );


    scheduleNextIdleExpression();

}


function scheduleNextIdleExpression() {

    const delay =
        9000 +
        Math.random() *
        10000;


    miloIdleExpressionTimer =
        setTimeout(
            () => {

                if (
                    !miloBusy &&
                    !miloCollapsed
                ) {

                    performRandomExpression();

                }


                scheduleNextIdleExpression();

            },
            delay
        );

}


function performRandomExpression() {

    const expressions = [

        "blink",

        "blink",

        "surprised",

        "thinking",

        "sleepy",

        "happy"

    ];


    const expression =
        expressions[
            Math.floor(
                Math.random() *
                expressions.length
            )
        ];


    setMiloFace(
        expression
    );


    if (
        expression ===
        "surprised"
    ) {

        showMilo(
            "Hmm? 👀",
            "surprised"
        );

    }


    if (
        expression ===
        "thinking"
    ) {

        showMilo(
            "Thinking... 🤔",
            "thinking"
        );

    }


    if (
        expression ===
        "sleepy"
    ) {

        showMilo(
            "Zzz... 😴",
            "sleepy"
        );

    }


    setTimeout(
        () => {

            if (
                !miloBusy &&
                !miloCollapsed
            ) {

                setMiloFace(
                    "happy"
                );

            }

        },
        1800
    );

}


/* =========================================================
   RESET TAP COUNT
========================================================= */

function resetMiloTapCount() {

    miloTapCount = 0;

    clearTimeout(
        miloTapResetTimer
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

    addXP:
        addXP,

    getXP:
        getXP,

    getStreakGoal:
        getStreakGoal,

    askStreakGoal:
        askStreakGoal,

    setStreakGoal:
        setStreakGoal,

    celebrateStreak:
        celebrateStreak,

    miloCorrectAnswer:
        miloCorrectAnswer,

    miloWrongAnswer:
        miloWrongAnswer,

    miloGameCorrect:
        miloGameCorrect,

    miloGameWrong:
        miloGameWrong,

    miloStudySessionComplete:
        miloStudySessionComplete,

    miloOfferHelp:
        miloOfferHelp,

    miloQuestionStarted:
        miloQuestionStarted,

    miloQuestionAnswered:
        miloQuestionAnswered,

    miloTap:
        handleMiloTap,

    resetTapCount:
        resetMiloTapCount,

    playSound:
        playSound

};
