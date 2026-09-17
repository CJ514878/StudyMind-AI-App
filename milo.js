"use strict";

/* =========================================================
   STUDYMIND AI — MILO
   HUMAN-LIKE • FRIENDLY • EXPRESSIVE • FUN
   COMPLETE REPLACEMENT
========================================================= */

console.log("StudyMind AI — Milo loaded");


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

let miloIdleExpressionTimer = null;

let miloLastQuestionSignature = "";

let miloBubbleTimer = null;

let miloReactionTimers = [];

let miloDizzyTimer = null;


/* =========================================================
   FACE STATES
========================================================= */

const MILO_FACE_STATES = [

    "happy",
    "celebrate",
    "wrong",
    "thinking",
    "surprised",
    "sleepy",
    "impatient",
    "blink",
    "ow",
    "dizzy",
    "excited"

];


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        createMilo();

        setTimeout(() => {

            startMiloExperience();

            startMiloIdleExpressions();

            installQuestionObserver();

        }, 700);

    }
);


/* =========================================================
   CREATE MILO
========================================================= */

function createMilo() {

    const oldMilo =
        document.getElementById(
            "miloCompanion"
        );

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
             SPEECH
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
             CHARACTER
        =========================================== -->

        <div
            class="milo-character milo-happy"
            id="miloCharacter"
            tabindex="0"
            role="button"
            aria-label="Milo study companion"
        >

            <div class="milo-shadow"></div>


            <!-- DIZZY STARS -->

            <div
                class="milo-dizzy-stars"
                aria-hidden="true"
            >

                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>

            </div>


            <!-- MASCOT -->

            <div class="milo-mascot">


                <!-- EARS -->

                <div
                    class="milo-ear milo-ear-left"
                ></div>

                <div
                    class="milo-ear milo-ear-right"
                ></div>


                <!-- HAIR -->

                <div class="milo-hair"></div>


                <!-- HEAD -->

                <div class="milo-head">


                    <!-- EYEBROWS -->

                    <div
                        class="milo-eyebrow milo-eyebrow-left"
                    ></div>

                    <div
                        class="milo-eyebrow milo-eyebrow-right"
                    ></div>


                    <!-- EYES -->

                    <div
                        class="milo-eye milo-eye-left"
                    >
                        <div class="milo-pupil"></div>
                    </div>

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
                        <span class="milo-mouth-inner"></span>
                    </div>

                </div>


                <!-- BODY -->

                <div class="milo-body">

                    <div class="milo-body-light"></div>

                    <div class="milo-chest-icon">
                        ✦
                    </div>

                </div>


                <!-- ARMS -->

                <div
                    class="milo-arm milo-arm-left"
                >
                    <div class="milo-hand"></div>
                </div>

                <div
                    class="milo-arm milo-arm-right"
                >
                    <div class="milo-hand"></div>
                </div>


                <!-- FEET -->

                <div
                    class="milo-foot milo-foot-left"
                ></div>

                <div
                    class="milo-foot milo-foot-right"
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

    if (!character) return;


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


/* =========================================================
   FACE MANAGEMENT
========================================================= */

function setMiloFace(state) {

    const character =
        document.getElementById(
            "miloCharacter"
        );

    if (!character) return;


    MILO_FACE_STATES.forEach(
        stateName => {

            character.classList.remove(
                `milo-${stateName}`
            );

        }
    );


    character.classList.add(
        `milo-${state}`
    );

}


/* =========================================================
   SHOW
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


        actions.forEach(
            action => {

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

            }
        );

    }


    bubble.style.display =
        "block";


    clearTimeout(
        miloBubbleTimer
    );


    if (!miloBusy) {

        miloBubbleTimer =
            setTimeout(() => {

                if (!miloBusy) {

                    bubble.style.display =
                        "none";

                }

            }, 6500);

    }

}


/* =========================================================
   HIDE
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

function getPreferredMiloVoice() {

    if (
        !("speechSynthesis" in window)
    ) {

        return null;

    }


    const voices =
        window.speechSynthesis
            .getVoices();


    const preferredNames = [

        "Samantha",
        "Microsoft Aria",
        "Microsoft Jenny",
        "Microsoft Ava",
        "Google US English",
        "Alex"

    ];


    for (
        const preferredName
        of preferredNames
    ) {

        const match =
            voices.find(
                voice =>
                    voice.name
                        .toLowerCase()
                        .includes(
                            preferredName
                                .toLowerCase()
                        )
            );

        if (match) {

            return match;

        }

    }


    return (
        voices.find(
            voice =>
                voice.lang &&
                voice.lang
                    .toLowerCase()
                    .startsWith("en")
        ) || null
    );

}


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
            options.rate ?? 1.0;

        utterance.pitch =
            options.pitch ?? 1.0;

        utterance.volume =
            options.volume ?? .95;

        utterance.lang =
            "en-US";


        const voice =
            getPreferredMiloVoice();


        if (voice) {

            utterance.voice =
                voice;

        }


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
   AUDIO
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


function miloTone(
    frequency,
    duration,
    startTime,
    type = "sine",
    volume = .08
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
        startTime + .02
    );


    gain.gain.exponentialRampToValueAtTime(
        .001,
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


        if (type === "woohoo") {

            miloTone(
                540,
                .18,
                now,
                "sine",
                .07
            );

            miloTone(
                680,
                .20,
                now + .15,
                "sine",
                .08
            );

            miloTone(
                820,
                .22,
                now + .31,
                "sine",
                .08
            );

            miloTone(
                980,
                .25,
                now + .49,
                "sine",
                .08
            );

            return;

        }


        if (type === "ow") {

            miloTone(
                520,
                .12,
                now,
                "sine",
                .07
            );

            miloTone(
                390,
                .20,
                now + .10,
                "sine",
                .06
            );

            return;

        }


        if (type === "correct") {

            miloTone(
                620,
                .13,
                now,
                "sine",
                .07
            );

            miloTone(
                820,
                .18,
                now + .13,
                "sine",
                .07
            );

            return;

        }


        if (type === "wrong") {

            miloTone(
                430,
                .18,
                now,
                "sine",
                .06
            );

            miloTone(
                300,
                .25,
                now + .17,
                "sine",
                .06
            );

            return;

        }


        if (type === "punch") {

            miloTone(
                110,
                .08,
                now,
                "square",
                .09
            );

            miloTone(
                70,
                .14,
                now + .05,
                "square",
                .06
            );

            return;

        }


        if (type === "xp") {

            miloTone(
                700,
                .09,
                now,
                "sine",
                .04
            );

            miloTone(
                900,
                .11,
                now + .09,
                "sine",
                .04
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
   TIMER HELPERS
========================================================= */

function clearMiloReactionTimers() {

    miloReactionTimers.forEach(
        timer =>
            clearTimeout(timer)
    );

    miloReactionTimers = [];

}


function miloTimeout(
    callback,
    delay
) {

    const timer =
        setTimeout(
            callback,
            delay
        );

    miloReactionTimers.push(
        timer
    );

    return timer;

}


/* =========================================================
   TAP
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


    if (miloTapCount >= 5) {

        startMiloDizzySequence();

        return;

    }


    miloTapReaction();

}


/* =========================================================
   SINGLE TAP
========================================================= */

function miloTapReaction() {

    miloBusy = true;


    const character =
        document.getElementById(
            "miloCharacter"
        );

    if (!character) {

        miloBusy = false;

        return;

    }


    clearMiloReactionTimers();


    /* PAIN */

    setMiloFace(
        "ow"
    );


    showMilo(
        "Ow!",
        "ow"
    );


    playSound(
        "ow"
    );


    speakMilo(
        "Ow!",
        {
            rate: 1.0,
            pitch: 1.0,
            volume: .95
        }
    );


    /* MOUTH SYNCHRONIZATION */

    character.classList.remove(
        "milo-speaking-ow"
    );

    void character.offsetWidth;

    character.classList.add(
        "milo-speaking-ow"
    );


    miloTimeout(() => {

        character.classList.remove(
            "milo-speaking-ow"
        );

    }, 800);


    /* HIT */

    character.classList.remove(
        "milo-hit"
    );

    void character.offsetWidth;

    character.classList.add(
        "milo-hit"
    );


    miloTimeout(() => {

        character.classList.remove(
            "milo-hit"
        );

    }, 700);


    /* SURPRISED */

    miloTimeout(() => {

        if (!miloCollapsed) {

            setMiloFace(
                "surprised"
            );

        }

    }, 300);


    /* RECOVER */

    miloTimeout(() => {

        if (!miloCollapsed) {

            setMiloFace(
                "happy"
            );

        }

        miloBusy = false;

    }, 1300);

}


/* =========================================================
   FIVE-TAP DIZZY
========================================================= */

function startMiloDizzySequence() {

    if (miloCollapsed) return;


    miloCollapsed = true;

    miloBusy = true;


    clearTimeout(
        miloTapResetTimer
    );

    clearTimeout(
        miloDizzyTimer
    );

    clearMiloReactionTimers();


    const character =
        document.getElementById(
            "miloCharacter"
        );

    if (!character) {

        miloCollapsed = false;

        miloBusy = false;

        return;

    }


    character.classList.remove(
        "milo-hit",
        "milo-fall",
        "milo-get-up",
        "milo-speaking-ow"
    );


    void character.offsetWidth;


    /* ==========================================
       BIG IMPACT
    =========================================== */

    setMiloFace(
        "surprised"
    );


    showMilo(
        "WHOA!",
        "surprised"
    );


    playSound(
        "punch"
    );


    character.classList.add(
        "milo-hit"
    );


    miloTimeout(() => {

        character.classList.remove(
            "milo-hit"
        );


        /* ======================================
           FALL DOWN
        ====================================== */

        character.classList.add(
            "milo-fall"
        );


    }, 650);


    /* ==========================================
       GET BACK UP
    =========================================== */

    miloTimeout(() => {

        character.classList.remove(
            "milo-fall"
        );

        void character.offsetWidth;

        character.classList.add(
            "milo-get-up"
        );


        setMiloFace(
            "dizzy"
        );


        showMilo(
            "Okay... I think I need a minute. 😵‍💫",
            "dizzy"
        );


        /* ======================================
           THREE SECOND DIZZY PERIOD
        ====================================== */

        miloDizzyTimer =
            setTimeout(() => {

                endMiloDizzySequence();

            }, 3000);


    }, 1650);

}


/* =========================================================
   END DIZZY
========================================================= */

function endMiloDizzySequence() {

    const character =
        document.getElementById(
            "miloCharacter"
        );

    if (!character) {

        miloCollapsed = false;

        miloBusy = false;

        return;

    }


    character.classList.remove(
        "milo-get-up"
    );


    setMiloFace(
        "surprised"
    );


    showMilo(
        "Okay... I'm good now. 😅",
        "surprised"
    );


    setTimeout(() => {

        setMiloFace(
            "happy"
        );

        hideMilo();


        miloTapCount = 0;

        miloCollapsed = false;

        miloBusy = false;

    }, 850);

}


/* =========================================================
   QUESTION TIMER
========================================================= */

function startMiloQuestionTimer() {

    clearTimeout(
        miloQuestionTimer
    );

    miloQuestionTimer = null;


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


    if (
        miloBusy ||
        miloCollapsed
    ) {

        return;

    }


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


    setTimeout(
        detectKnowledgeQuestion,
        500
    );

}


/* =========================================================
   DETECT QUESTION
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
            .slice(0,500);


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
   CORRECT
========================================================= */

function miloCorrectAnswer() {

    miloQuestionAnswered();


    miloBusy = true;


    const character =
        document.getElementById(
            "miloCharacter"
        );


    if (character) {

        character.classList.remove(
            "milo-disappointed",
            "milo-shake"
        );

    }


    setMiloFace(
        "celebrate"
    );


    showMilo(
        "Woohoo! You got it! 🎉",
        "celebrate"
    );


    playSound(
        "woohoo"
    );


    speakMilo(
        "Woohoo!",
        {
            rate: .92,
            pitch: 1.05,
            volume: 1
        }
    );


    addXP(5);


    miloTimeout(() => {

        setMiloFace(
            "happy"
        );

        miloBusy = false;

    }, 2200);

}


/* =========================================================
   WRONG
========================================================= */

function miloWrongAnswer(
    explanation = ""
) {

    miloQuestionAnswered();


    miloBusy = true;


    const character =
        document.getElementById(
            "miloCharacter"
        );


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


    if (character) {

        character.classList.remove(
            "milo-disappointed",
            "milo-shake"
        );

        void character.offsetWidth;

        character.classList.add(
            "milo-disappointed"
        );


        miloTimeout(() => {

            character.classList.remove(
                "milo-disappointed"
            );

        }, 650);

    }


    miloTimeout(() => {

        setMiloFace(
            "happy"
        );

        miloBusy = false;

    }, 1600);

}


/* =========================================================
   GAME — CORRECT
========================================================= */

function miloGameCorrect() {

    miloBusy = true;


    setMiloFace(
        "celebrate"
    );


    showMilo(
        "YESSS! Woohoo! 🎉",
        "celebrate"
    );


    playSound(
        "woohoo"
    );


    speakMilo(
        "Woohoo!",
        {
            rate: .92,
            pitch: 1.05,
            volume: 1
        }
    );


    addXP(10);


    miloTimeout(() => {

        setMiloFace(
            "happy"
        );

        miloBusy = false;

    }, 2200);

}


/* =========================================================
   GAME — WRONG
========================================================= */

function miloGameWrong() {

    miloBusy = true;


    const character =
        document.getElementById(
            "miloCharacter"
        );


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


    if (character) {

        character.classList.remove(
            "milo-disappointed"
        );

        void character.offsetWidth;

        character.classList.add(
            "milo-disappointed"
        );

    }


    miloTimeout(() => {

        if (character) {

            character.classList.remove(
                "milo-disappointed"
            );

        }

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
        "Study session complete! 🎉",
        "celebrate"
    );


    playSound(
        "woohoo"
    );


    speakMilo(
        "Awesome! You did it!",
        {
            rate: .95,
            pitch: 1.05,
            volume: 1
        }
    );


    addXP(25);


    miloTimeout(() => {

        setMiloFace(
            "happy"
        );

        miloBusy = false;

    }, 2500);

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


    miloTimeout(() => {

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


    miloTimeout(() => {

        setMiloFace(
            "happy"
        );


        showMilo(
            "Hey! I'm Milo 👋",
            "happy"
        );


    }, 900);


    miloTimeout(() => {

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
            rate: .95,
            pitch: 1.05,
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
