"use strict";

/* =========================================================
   STUDYMIND AI — MILO
   FRIENDLY EXPRESSIVE COMPANION
========================================================= */

const MILO_KEYS = {
    FIRST_VISIT: "studyMindMiloFirstVisit",
    XP: "studyMindXP",
    STREAK_GOAL: "studyMindStreakGoal",
    STREAK_GOAL_REWARD: "studyMindStreakGoalReward",
    TOTAL_STREAK_DAYS: "studyMindTotalStreakDays"
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

let miloIdleExpressionTimer = null;

let miloLastQuestionSignature = "";

let miloReturnTimer = null;


/* =========================================================
   FACE STATES
========================================================= */

const MILO_FACE_STATES = [
    "milo-happy",
    "milo-celebrate",
    "milo-wrong",
    "milo-thinking",
    "milo-surprised",
    "milo-sleepy",
    "milo-impatient",
    "milo-blink",
    "milo-ow",
    "milo-dizzy",
    "milo-excited"
];


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    createMilo();

    setTimeout(() => {

        startMiloExperience();
        startMiloIdleExpressions();
        installQuestionObserver();

    }, 700);

});


/* =========================================================
   CREATE MILO
========================================================= */

function createMilo() {

    /*
       Always remove an existing Milo first.
       This prevents an old Milo design from remaining
       underneath the new one.
    */

    const oldMilo =
        document.getElementById("miloCompanion");

    if (oldMilo) {
        oldMilo.remove();
    }


    const container =
        document.createElement("div");

    container.id =
        "miloCompanion";

    container.className =
        "milo-container";


    container.innerHTML = `

        <!-- ==========================================
             SPEECH BUBBLE
        =========================================== -->

        <div
            class="milo-bubble"
            id="miloBubble"
            style="display:none;"
            aria-live="polite"
        >

            <div class="milo-name">
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


        <!-- ==========================================
             MILO CHARACTER
        =========================================== -->

        <div
            class="milo-character milo-happy"
            id="miloCharacter"
            tabindex="0"
            role="button"
            aria-label="Milo study companion"
        >

            <!-- SHADOW -->

            <div class="milo-shadow"></div>


            <!-- ======================================
                 DIZZY STARS

                 Invisible unless the character
                 receives .milo-dizzy
            ======================================= -->

            <div
                class="milo-dizzy-stars"
                aria-hidden="true"
            >
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
            </div>


            <!-- ======================================
                 MASCOT
            ======================================= -->

            <div class="milo-mascot">


                <!-- ==================================
                     HEAD
                =================================== -->

                <div class="milo-head">


                    <!-- EYEBROWS -->

                    <div
                        class="milo-eyebrow milo-eyebrow-left"
                    ></div>

                    <div
                        class="milo-eyebrow milo-eyebrow-right"
                    ></div>


                    <!-- LEFT EYE -->

                    <div
                        class="milo-eye milo-eye-left"
                    >

                        <div class="milo-pupil"></div>

                    </div>


                    <!-- RIGHT EYE -->

                    <div
                        class="milo-eye milo-eye-right"
                    >

                        <div class="milo-pupil"></div>

                    </div>


                    <!-- NOSE -->

                    <div class="milo-nose"></div>


                    <!-- CHEEKS -->

                    <div
                        class="milo-cheek milo-cheek-left"
                    ></div>

                    <div
                        class="milo-cheek milo-cheek-right"
                    ></div>


                    <!-- MOUTH -->

                    <div class="milo-mouth">

                        <span
                            class="milo-mouth-inner"
                        ></span>

                    </div>

                </div>


                <!-- ==================================
                     BODY
                =================================== -->

                <div class="milo-body">

                    <div class="milo-body-light"></div>

                    <div class="milo-chest-icon">
                        ✦
                    </div>

                </div>


                <!-- ==================================
                     FEET
                =================================== -->

                <div
                    class="milo-foot milo-foot-left"
                ></div>

                <div
                    class="milo-foot milo-foot-right"
                ></div>

            </div>

        </div>
    `;


    document.body.appendChild(container);


    const character =
        document.getElementById(
            "miloCharacter"
        );


    if (!character) return;


    /* Mouse / touch */

    character.addEventListener(
        "click",
        handleMiloTap
    );


    /* Keyboard accessibility */

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
   SET FACE
========================================================= */

function setMiloFace(state) {

    const character =
        document.getElementById(
            "miloCharacter"
        );

    if (!character) return;


    MILO_FACE_STATES.forEach(
        className => {

            character.classList.remove(
                className
            );

        }
    );


    character.classList.add(
        `milo-${state}`
    );

}


/* =========================================================
   SHOW MILO
========================================================= */

function showMilo(
    message = "",
    state = "happy",
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


    if (!bubble) return;


    setMiloFace(state);


    if (messageElement) {

        messageElement.textContent =
            message;

    }


    if (actionsElement) {

        actionsElement.innerHTML = "";


        actions.forEach(action => {

            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.textContent =
                action.label;


            button.addEventListener(
                "click",
                action.onClick
            );


            actionsElement.appendChild(
                button
            );

        });

    }


    bubble.style.display =
        "block";


    /*
       Normal messages disappear automatically.
       Reactions controlled by Milo remain visible
       while Milo is busy.
    */

    if (!miloBusy) {

        clearTimeout(
            miloReturnTimer
        );


        miloReturnTimer =
            setTimeout(() => {

                if (
                    bubble &&
                    !miloBusy
                ) {

                    bubble.style.display =
                        "none";

                }

            }, 6500);

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
            options.rate ?? 1.08;

        utterance.pitch =
            options.pitch ?? 1.48;

        utterance.volume =
            options.volume ?? 0.95;

        utterance.lang =
            "en-US";


        window.speechSynthesis.speak(
            utterance
        );

    } catch (error) {

        console.warn(
            "Milo speech error:",
            error
        );

    }

}


/* =========================================================
   AUDIO ENGINE
========================================================= */

function getAudioContext() {

    if (!miloAudioContext) {

        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;


        if (!AudioContext) {
            return null;
        }


        miloAudioContext =
            new AudioContext();

    }


    if (
        miloAudioContext.state ===
        "suspended"
    ) {

        miloAudioContext.resume();

    }


    return miloAudioContext;

}


/* =========================================================
   AUDIO TONE
========================================================= */

function miloTone(
    frequency,
    duration,
    startTime,
    type = "sine",
    volume = 0.08
) {

    const ctx =
        getAudioContext();

    if (!ctx) return;


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


    gain.gain.setValueAtTime(
        0,
        startTime
    );


    gain.gain.linearRampToValueAtTime(
        volume,
        startTime + 0.02
    );


    gain.gain.exponentialRampToValueAtTime(
        0.001,
        startTime + duration
    );


    oscillator.connect(gain);

    gain.connect(
        ctx.destination
    );


    oscillator.start(
        startTime
    );


    oscillator.stop(
        startTime + duration
    );

}


/* =========================================================
   SOUND EFFECTS
========================================================= */

function playSound(type) {

    try {

        const ctx =
            getAudioContext();

        if (!ctx) return;


        const now =
            ctx.currentTime;


        /* ==========================
           WOOHOO
        ========================== */

        if (type === "woohoo") {

            miloTone(
                540,
                0.22,
                now,
                "sine",
                0.09
            );

            miloTone(
                700,
                0.24,
                now + 0.18,
                "sine",
                0.10
            );

            miloTone(
                880,
                0.26,
                now + 0.38,
                "sine",
                0.10
            );

            miloTone(
                1060,
                0.30,
                now + 0.60,
                "sine",
                0.10
            );

            miloTone(
                1260,
                0.42,
                now + 0.86,
                "sine",
                0.08
            );

            return;
        }


        /* ==========================
           OW
        ========================== */

        if (type === "ow") {

            miloTone(
                900,
                0.16,
                now,
                "sine",
                0.09
            );

            miloTone(
                740,
                0.20,
                now + 0.12,
                "sine",
                0.09
            );

            miloTone(
                570,
                0.30,
                now + 0.27,
                "sine",
                0.08
            );

            return;
        }


        /* ==========================
           CORRECT
        ========================== */

        if (type === "correct") {

            miloTone(
                620,
                0.14,
                now,
                "sine",
                0.08
            );

            miloTone(
                820,
                0.20,
                now + 0.13,
                "sine",
                0.08
            );

            return;
        }


        /* ==========================
           WRONG
        ========================== */

        if (type === "wrong") {

            miloTone(
                430,
                0.20,
                now,
                "sine",
                0.07
            );

            miloTone(
                300,
                0.30,
                now + 0.18,
                "sine",
                0.07
            );

            return;
        }


        /* ==========================
           HIT
        ========================== */

        if (type === "punch") {

            miloTone(
                110,
                0.08,
                now,
                "square",
                0.10
            );

            miloTone(
                70,
                0.16,
                now + 0.06,
                "square",
                0.07
            );

            return;
        }


        /* ==========================
           XP
        ========================== */

        if (type === "xp") {

            miloTone(
                700,
                0.10,
                now,
                "sine",
                0.05
            );

            miloTone(
                900,
                0.12,
                now + 0.10,
                "sine",
                0.05
            );

        }

    } catch (error) {

        console.warn(
            "Milo audio error:",
            error
        );

    }

}


/* =========================================================
   TAP HANDLER
========================================================= */

function handleMiloTap() {

    if (miloCollapsed) return;

    if (miloBusy) return;


    miloTapCount++;


    clearTimeout(
        miloTapResetTimer
    );


    miloTapResetTimer =
        setTimeout(() => {

            miloTapCount = 0;

        }, 5000);


    /*
       FIVE TAPS = FALL
    */

    if (miloTapCount >= 5) {

        startMiloCollapseSequence();

        return;

    }


    miloTapReaction();

}


/* =========================================================
   NORMAL TAP REACTION
========================================================= */

function miloTapReaction() {

    miloBusy = true;


    const character =
        document.getElementById(
            "miloCharacter"
        );


    /* Pain */

    setMiloFace("ow");


    showMilo(
        "OW! 😭",
        "ow"
    );


    playSound("ow");


    /*
       High-pitched Ow.
    */

    speakMilo(
        "Ow!",
        {
            rate: 1.22,
            pitch: 1.78,
            volume: 1
        }
    );


    if (character) {

        character.classList.remove(
            "milo-hit"
        );


        /*
           Force animation restart.
        */

        void character.offsetWidth;


        character.classList.add(
            "milo-hit"
        );

    }


    /* Shocked */

    setTimeout(() => {

        if (!miloCollapsed) {

            setMiloFace(
                "surprised"
            );

        }

    }, 260);


    /* Dizzy */

    setTimeout(() => {

        if (!miloCollapsed) {

            setMiloFace(
                "dizzy"
            );


            showMilo(
                "Whoa... 😵‍💫",
                "dizzy"
            );

        }

    }, 850);


    /* Recover */

    setTimeout(() => {

        if (character) {

            character.classList.remove(
                "milo-hit"
            );

        }


        if (!miloCollapsed) {

            setMiloFace(
                "happy"
            );

        }


        miloBusy = false;

    }, 2600);

}


/* =========================================================
   FIVE-TAP FALL SEQUENCE
========================================================= */

function startMiloCollapseSequence() {

    if (miloCollapsed) return;


    miloCollapsed = true;

    miloBusy = true;


    clearTimeout(
        miloTapResetTimer
    );


    const character =
        document.getElementById(
            "miloCharacter"
        );


    if (!character) {

        miloCollapsed = false;
        miloBusy = false;

        return;

    }


    /* Initial shock */

    setMiloFace(
        "surprised"
    );


    showMilo(
        "Whoa! 😵",
        "surprised"
    );


    playSound(
        "punch"
    );


    character.classList.remove(
        "milo-hit"
    );


    void character.offsetWidth;


    character.classList.add(
        "milo-hit"
    );


    /* Dizzy */

    setTimeout(() => {

        character.classList.remove(
            "milo-hit"
        );


        setMiloFace(
            "dizzy"
        );


        showMilo(
            "I'm dizzy... 😵‍💫",
            "dizzy"
        );

    }, 550);


    /* Begin falling */

    setTimeout(() => {

        character.classList.add(
            "milo-fall"
        );

    }, 1300);


    /* Hide after falling */

    setTimeout(() => {

        character.style.visibility =
            "hidden";

    }, 2350);


    /* Return */

    setTimeout(() => {

        character.style.visibility =
            "visible";


        character.classList.remove(
            "milo-fall"
        );


        character.classList.add(
            "milo-get-up"
        );


        setMiloFace(
            "surprised"
        );


        showMilo(
            "Okay... I think I need a minute.",
            "surprised"
        );


        speakMilo(
            "Okay... I think I need a minute.",
            {
                rate: 0.90,
                pitch: 1.42,
                volume: 1
            }
        );

    }, 2850);


    /* Recover */

    setTimeout(() => {

        character.classList.remove(
            "milo-get-up"
        );


        setMiloFace(
            "happy"
        );


        miloTapCount = 0;

        miloCollapsed = false;

        miloBusy = false;


    }, 5000);

}


/* =========================================================
   QUESTION TIMER
========================================================= */

function startMiloQuestionTimer() {

    clearTimeout(
        miloQuestionTimer
    );


    if (miloBusy) return;


    setMiloFace(
        "thinking"
    );


    miloQuestionTimer =
        setTimeout(() => {

            if (
                miloBusy ||
                miloCollapsed
            ) {
                return;
            }


            setMiloFace(
                "impatient"
            );


            showMilo(
                "Ahem... I'm still waiting. 😅",
                "impatient"
            );

        }, 15000);

}


/* =========================================================
   QUESTION STARTED
========================================================= */

function miloQuestionStarted() {

    clearTimeout(
        miloQuestionTimer
    );


    miloQuestionTimer = null;


    startMiloQuestionTimer();

}


/* =========================================================
   QUESTION ANSWERED
========================================================= */

function miloQuestionAnswered() {

    clearTimeout(
        miloQuestionTimer
    );


    miloQuestionTimer = null;

}


/* =========================================================
   QUESTION OBSERVER
========================================================= */

function installQuestionObserver() {

    if (!document.body) return;


    if (miloQuestionObserver) {

        miloQuestionObserver.disconnect();

    }


    miloQuestionObserver =
        new MutationObserver(() => {

            detectKnowledgeQuestion();

        });


    miloQuestionObserver.observe(
        document.body,
        {
            childList: true,
            subtree: true,
            characterData: true
        }
    );


    setTimeout(
        detectKnowledgeQuestion,
        500
    );

}


/* =========================================================
   DETECT KNOWLEDGE CHECK QUESTION
========================================================= */

function detectKnowledgeQuestion() {

    const question =
        document.querySelector(
            ".knowledge-question-card"
        );


    if (!question) return;


    const signature =
        question.innerText
            .trim()
            .slice(0, 500);


    if (!signature) return;


    if (
        signature ===
        miloLastQuestionSignature
    ) {
        return;
    }


    miloLastQuestionSignature =
        signature;


    miloQuestionStarted();

}


/* =========================================================
   CORRECT ANSWER
========================================================= */

function miloCorrectAnswer() {

    miloQuestionAnswered();


    miloBusy = true;


    setMiloFace(
        "celebrate"
    );


    showMilo(
        "WOOHOO! 🎉 You got it!",
        "celebrate"
    );


    playSound(
        "woohoo"
    );


    /*
       Bright, higher-pitched,
       deliberately slower speech.
    */

    speakMilo(
        "Woohoo!",
        {
            rate: 0.62,
            pitch: 1.78,
            volume: 1
        }
    );


    addXP(5);


    setTimeout(() => {

        setMiloFace(
            "happy"
        );


        miloBusy = false;


    }, 2400);

}


/* =========================================================
   WRONG ANSWER
========================================================= */

function miloWrongAnswer(
    explanation = ""
) {

    miloQuestionAnswered();


    miloBusy = true;


    setMiloFace(
        "wrong"
    );


    showMilo(
        explanation ||
        "Not quite... let's try again.",
        "wrong"
    );


    playSound(
        "wrong"
    );


    const character =
        document.getElementById(
            "miloCharacter"
        );


    if (character) {

        character.classList.remove(
            "milo-disappointed"
        );


        void character.offsetWidth;


        character.classList.add(
            "milo-disappointed"
        );


        setTimeout(() => {

            character.classList.remove(
                "milo-disappointed"
            );

        }, 1200);

    }


    setTimeout(() => {

        miloBusy = false;

    }, 1500);

}


/* =========================================================
   GAME MODE — CORRECT
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
            rate: 0.62,
            pitch: 1.78,
            volume: 1
        }
    );


    addXP(10);


    setTimeout(() => {

        setMiloFace(
            "happy"
        );


        miloBusy = false;

    }, 2400);

}


/* =========================================================
   GAME MODE — WRONG
========================================================= */

function miloGameWrong() {

    miloBusy = true;


    setMiloFace(
        "wrong"
    );


    showMilo(
        "Oh no... 😕",
        "wrong"
    );


    playSound(
        "wrong"
    );


    setTimeout(() => {

        setMiloFace(
            "happy"
        );


        miloBusy = false;

    }, 1500);

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
        "woohoo"
    );


    speakMilo(
        "Awesome! You did it!",
        {
            rate: 0.82,
            pitch: 1.62,
            volume: 1
        }
    );


    addXP(25);


    setTimeout(() => {

        setMiloFace(
            "happy"
        );


        miloBusy = false;

    }, 2600);

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


function addXP(amount) {

    const current =
        getXP();


    const updated =
        current +
        Number(amount);


    localStorage.setItem(
        MILO_KEYS.XP,
        String(updated)
    );


    document.dispatchEvent(
        new CustomEvent(
            "studyMindXPUpdated",
            {
                detail: {
                    xp: updated,
                    amount
                }
            }
        )
    );


    playSound(
        "xp"
    );

}


/* =========================================================
   IDLE EXPRESSIONS
========================================================= */

function startMiloIdleExpressions() {

    clearTimeout(
        miloIdleExpressionTimer
    );


    function schedule() {

        const delay =
            9000 +
            Math.random() * 11000;


        miloIdleExpressionTimer =
            setTimeout(() => {

                if (
                    !miloBusy &&
                    !miloCollapsed
                ) {

                    const expressions = [
                        "blink",
                        "happy",
                        "thinking",
                        "surprised",
                        "sleepy"
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


                    setTimeout(() => {

                        if (
                            !miloBusy &&
                            !miloCollapsed
                        ) {

                            setMiloFace(
                                "happy"
                            );

                        }

                    }, 1800);

                }


                schedule();

            }, delay);

    }


    schedule();

}


/* =========================================================
   HELP
========================================================= */

function miloOfferHelp() {

    miloBusy = true;


    setMiloFace(
        "thinking"
    );


    showMilo(
        "Need some help? I'm here. 🤔",
        "thinking"
    );


    setTimeout(() => {

        setMiloFace(
            "happy"
        );


        miloBusy = false;

    }, 1500);

}


/* =========================================================
   FIRST VISIT
========================================================= */

function startMiloExperience() {

    const visited =
        localStorage.getItem(
            MILO_KEYS.FIRST_VISIT
        );


    if (visited) return;


    localStorage.setItem(
        MILO_KEYS.FIRST_VISIT,
        "true"
    );


    setTimeout(() => {

        setMiloFace(
            "happy"
        );


        showMilo(
            "Hey! I'm Milo 👋",
            "happy"
        );


    }, 900);


    setTimeout(() => {

        showMilo(
            "I'll be here while you study! 📚",
            "excited"
        );


    }, 3500);

}


/* =========================================================
   STREAK
========================================================= */

function getStreakGoal() {

    return Number(
        localStorage.getItem(
            MILO_KEYS.STREAK_GOAL
        ) || 0
    );

}


function setStreakGoal(goal) {

    localStorage.setItem(
        MILO_KEYS.STREAK_GOAL,
        String(goal)
    );

}


function askStreakGoal() {

    const current =
        getStreakGoal();


    showMilo(
        current
            ? `Your streak goal is ${current} days! 🔥`
            : "Set a streak goal and let's work toward it! 🔥",
        "excited"
    );

}


function celebrateStreak(days) {

    setMiloFace(
        "celebrate"
    );


    showMilo(
        `${days} day streak! 🔥🎉`,
        "celebrate"
    );


    playSound(
        "woohoo"
    );


    speakMilo(
        `${days} day streak!`,
        {
            rate: 0.82,
            pitch: 1.62,
            volume: 1
        }
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

    miloGameCorrect,

    miloGameWrong,

    miloStudySessionComplete,

    miloOfferHelp,

    miloQuestionStarted,

    miloQuestionAnswered,

    miloTap:
        handleMiloTap,

    resetTapCount: () => {

        miloTapCount = 0;

    },

    playSound

};
