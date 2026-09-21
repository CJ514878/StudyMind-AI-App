"use strict";

/* =========================================================
   STUDYMIND AI — MILO
   COOL MONKEY MASCOT
   VERSION 8
   SHARED STUDY COMPLETION CELEBRATION
========================================================= */

console.log("StudyMind AI — Milo Monkey v8 loaded");


/* =========================================================
   STORAGE
========================================================= */

const MILO_KEYS = {
    FIRST_VISIT: "studyMindMiloFirstVisit",
    XP: "studyMindXP",
    STREAK_GOAL: "studyMindStreakGoal",
    STREAK_GOAL_REWARD: "studyMindStreakGoalReward",
    TOTAL_STREAK_DAYS: "studyMindTotalStreakDays"
};


/* =========================================================
   STATE
========================================================= */

let miloAudioContext = null;
let miloAudioUnlocked = false;

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

let miloCelebrationAnimations = [];
let miloCelebrationActive = false;


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
    "milo-excited",
    "milo-frown"
];


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    createMilo();

    if ("speechSynthesis" in window) {

        window.speechSynthesis.getVoices();

        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
        };
    }

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

    const oldMilo =
        document.getElementById("miloCompanion");

    if (oldMilo) {
        oldMilo.remove();
    }


    const container =
        document.createElement("div");

    container.id = "miloCompanion";
    container.className = "milo-container";
    container.dataset.miloVersion = "8-monkey";


    /*
     * IMPORTANT:
     * Keep Milo above celebration overlays.
     * This prevents the white streak screen from hiding him.
     */

  container.style.position = "fixed";
container.style.display = "block";
container.style.visibility = "visible";
container.style.opacity = "1";
container.style.zIndex = "2147483647";
container.style.pointerEvents = "none";


    container.innerHTML = `

        <div
            class="milo-bubble"
            id="miloBubble"
            style="display:none;"
            aria-live="polite"
        >

            <div class="milo-name">
                MILO
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
            class="milo-character milo-happy"
            id="miloCharacter"
            tabindex="0"
            role="button"
            aria-label="Milo study companion"
            style="pointer-events:auto;"
        >

            <div class="milo-shadow"></div>

            <div
                class="milo-dizzy-stars"
                aria-hidden="true"
            >
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
            </div>


            <div class="milo-monkey">

                <div class="milo-tail">
                    <div class="milo-tail-tip"></div>
                </div>


                <div class="milo-body">

                    <div class="milo-hood"></div>

                    <div class="milo-hood-string milo-hood-string-left"></div>

                    <div class="milo-hood-string milo-hood-string-right"></div>

                    <div class="milo-chest-badge">
                        ✦
                    </div>

                    <div class="milo-pocket"></div>

                </div>


                <div class="milo-arm milo-arm-left">
                    <div class="milo-hand"></div>
                </div>

                <div class="milo-arm milo-arm-right">
                    <div class="milo-hand"></div>
                </div>


                <div class="milo-leg milo-leg-left"></div>
                <div class="milo-leg milo-leg-right"></div>


                <div class="milo-shoe milo-shoe-left"></div>
                <div class="milo-shoe milo-shoe-right"></div>


                <div class="milo-neck"></div>


                <div class="milo-head">

                    <div class="milo-ear milo-ear-left">
                        <div class="milo-ear-inner"></div>
                    </div>

                    <div class="milo-ear milo-ear-right">
                        <div class="milo-ear-inner"></div>
                    </div>


                    <div
                        class="milo-hat"
                        aria-hidden="true"
                    >

                        <div class="milo-hat-crown"></div>

                        <div class="milo-hat-band"></div>

                        <div class="milo-hat-brim"></div>

                    </div>


                    <div class="milo-hair">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>


                    <div class="milo-eyebrow milo-eyebrow-left"></div>
                    <div class="milo-eyebrow milo-eyebrow-right"></div>


                    <div class="milo-eye milo-eye-left">
                        <div class="milo-pupil"></div>
                    </div>

                    <div class="milo-eye milo-eye-right">
                        <div class="milo-pupil"></div>
                    </div>


                    <div
                        class="milo-sunglasses"
                        aria-hidden="true"
                    >

                        <div class="milo-glass milo-glass-left">
                            <div class="milo-lens-shine"></div>
                        </div>

                        <div class="milo-glass milo-glass-right">
                            <div class="milo-lens-shine"></div>
                        </div>

                        <div class="milo-glasses-bridge"></div>

                    </div>


                    <div class="milo-nose"></div>


                    <div class="milo-muzzle">
                        <div class="milo-muzzle-highlight"></div>
                    </div>


                    <div class="milo-mouth">
                        <span class="milo-mouth-inner"></span>
                    </div>

                </div>

            </div>

        </div>
    `;


    document.body.appendChild(container);


    const character =
        document.getElementById("miloCharacter");


    if (!character) {

        console.error(
            "Milo character failed to initialize."
        );

        return;
    }


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

                unlockMiloAudio();

                handleMiloTap();
            }
        }
    );
}


/* =========================================================
   AUDIO UNLOCK
========================================================= */

function unlockMiloAudio() {

    if (miloAudioUnlocked) return;

    try {

        const ctx =
            getAudioContext();

        if (ctx) {

            if (ctx.state === "suspended") {
                ctx.resume();
            }

            const oscillator =
                ctx.createOscillator();

            const gain =
                ctx.createGain();

            gain.gain.value = 0.0001;

            oscillator.connect(gain);
            gain.connect(ctx.destination);

            oscillator.start();

            oscillator.stop(
                ctx.currentTime + 0.01
            );
        }


        if ("speechSynthesis" in window) {
            window.speechSynthesis.getVoices();
        }


        miloAudioUnlocked = true;

    } catch (error) {

        console.warn(
            "Could not unlock Milo audio:",
            error
        );
    }
}


document.addEventListener(
    "pointerdown",
    unlockMiloAudio,
    {
        once: true,
        passive: true
    }
);


/* =========================================================
   FACE CONTROL
========================================================= */

function setMiloFace(state) {

    const character =
        document.getElementById("miloCharacter");

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
   SPEECH BUBBLE
========================================================= */

function showMilo(
    message = "",
    state = "happy",
    actions = []
) {

    const bubble =
        document.getElementById("miloBubble");

    const messageElement =
        document.getElementById("miloMessage");

    const actionsElement =
        document.getElementById("miloActions");


    if (!bubble) return;


    setMiloFace(state);


    if (messageElement) {
        messageElement.textContent = message;
    }


    if (actionsElement) {

        actionsElement.innerHTML = "";

        actions.forEach(action => {

            const button =
                document.createElement("button");

            button.type = "button";
            button.textContent = action.label;

            button.addEventListener(
                "click",
                action.onClick
            );

            actionsElement.appendChild(
                button
            );

        });
    }


    bubble.style.display = "block";


    clearTimeout(miloBubbleTimer);


    if (!miloBusy) {

        miloBubbleTimer =
            setTimeout(() => {

                if (!miloBusy) {
                    bubble.style.display = "none";
                }

            }, 6500);
    }
}


function hideMilo() {

    const bubble =
        document.getElementById("miloBubble");

    if (bubble) {
        bubble.style.display = "none";
    }
}


/* =========================================================
   MILO VOICE
========================================================= */

function getPreferredMiloVoice() {

    if (!("speechSynthesis" in window)) {
        return null;
    }


    const voices =
        window.speechSynthesis.getVoices();


    if (!voices.length) {
        return null;
    }


    const preferredNames = [
        "Samantha",
        "Google US English",
        "Microsoft Aria",
        "Microsoft Jenny",
        "Microsoft Ava",
        "Microsoft Zira",
        "Microsoft Guy",
        "Microsoft Christopher",
        "Alex",
        "Daniel"
    ];


    for (const name of preferredNames) {

        const match =
            voices.find(
                voice =>
                    voice.name
                        .toLowerCase()
                        .includes(
                            name.toLowerCase()
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
                    .startsWith("en-us")
        ) ||
        voices.find(
            voice =>
                voice.lang &&
                voice.lang
                    .toLowerCase()
                    .startsWith("en")
        ) ||
        null
    );
}


function speakMilo(
    text,
    options = {}
) {

    if (!("speechSynthesis" in window)) {
        return;
    }


    try {

        window.speechSynthesis.cancel();


        const utterance =
            new SpeechSynthesisUtterance(text);


        utterance.rate =
            options.rate ?? 0.98;

        utterance.pitch =
            options.pitch ?? 1;

        utterance.volume =
            options.volume ?? 0.95;

        utterance.lang =
            "en-US";


        const voice =
            getPreferredMiloVoice();


        if (voice) {
            utterance.voice = voice;
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

        miloAudioContext.resume()
            .catch(() => {});
    }


    return miloAudioContext;
}


function miloTone(
    frequency,
    duration,
    startTime,
    waveform = "sine",
    volume = 0.12
) {

    const ctx =
        getAudioContext();

    if (!ctx) return;


    const oscillator =
        ctx.createOscillator();

    const gain =
        ctx.createGain();


    oscillator.type =
        waveform;


    oscillator.frequency.setValueAtTime(
        frequency,
        startTime
    );


    gain.gain.setValueAtTime(
        0.0001,
        startTime
    );


    gain.gain.exponentialRampToValueAtTime(
        volume,
        startTime + 0.015
    );


    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        startTime + duration
    );


    oscillator.connect(gain);
    gain.connect(ctx.destination);


    oscillator.start(startTime);

    oscillator.stop(
        startTime + duration + 0.03
    );
}


/* =========================================================
   SOUND
========================================================= */

function playSound(type) {

    try {

        const ctx =
            getAudioContext();

        if (!ctx) return;


        const now =
            ctx.currentTime;


        if (type === "ow") {

            miloTone(
                560,
                0.20,
                now,
                "sawtooth",
                0.22
            );

            miloTone(
                360,
                0.28,
                now + 0.16,
                "triangle",
                0.20
            );

            return;
        }


        if (type === "woohoo") {

            miloTone(
                520,
                0.16,
                now,
                "triangle",
                0.20
            );

            miloTone(
                660,
                0.16,
                now + 0.12,
                "triangle",
                0.22
            );

            miloTone(
                790,
                0.18,
                now + 0.24,
                "triangle",
                0.24
            );

            miloTone(
                980,
                0.28,
                now + 0.38,
                "triangle",
                0.26
            );

            miloTone(
                1250,
                0.12,
                now + 0.45,
                "sine",
                0.14
            );

            miloTone(
                1550,
                0.15,
                now + 0.57,
                "sine",
                0.12
            );

            return;
        }


        if (type === "correct") {

            miloTone(
                620,
                0.14,
                now,
                "triangle",
                0.19
            );

            miloTone(
                820,
                0.17,
                now + 0.12,
                "triangle",
                0.21
            );

            miloTone(
                1040,
                0.25,
                now + 0.25,
                "triangle",
                0.23
            );

            return;
        }


        if (type === "wrong") {

            miloTone(
                430,
                0.18,
                now,
                "sawtooth",
                0.17
            );

            miloTone(
                300,
                0.25,
                now + 0.16,
                "triangle",
                0.19
            );

            return;
        }


        if (type === "punch") {

            miloTone(
                120,
                0.08,
                now,
                "square",
                0.25
            );

            miloTone(
                75,
                0.14,
                now + 0.045,
                "sawtooth",
                0.21
            );

            return;
        }


        if (type === "xp") {

            miloTone(
                700,
                0.10,
                now,
                "triangle",
                0.13
            );

            miloTone(
                900,
                0.12,
                now + 0.09,
                "triangle",
                0.15
            );

            return;
        }

    } catch (error) {

        console.warn(
            "Milo audio error:",
            error
        );
    }
}


/* =========================================================
   TIMERS
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

    miloReactionTimers.push(timer);

    return timer;
}


/* =========================================================
   TAP SYSTEM
========================================================= */

function handleMiloTap() {

    unlockMiloAudio();

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

        startMiloKnockoutSequence();

        return;
    }


    miloTapReaction();
}


/* =========================================================
   NORMAL HIT
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


    character.classList.remove(
        "milo-speaking-ow",
        "milo-ow-speaking",
        "milo-hit"
    );


    void character.offsetWidth;


    setMiloFace("ow");


    showMilo(
        "Ow!",
        "ow"
    );


    character.classList.add(
        "milo-speaking-ow"
    );


    character.classList.add(
        "milo-hit"
    );


    playSound("ow");


    speakMilo(
        "Ow!",
        {
            rate: 1.15,
            pitch: 1,
            volume: 1
        }
    );


    miloTimeout(() => {

        character.classList.remove(
            "milo-speaking-ow"
        );

    }, 480);


    miloTimeout(() => {

        if (!miloCollapsed) {
            setMiloFace("surprised");
        }

    }, 500);


    miloTimeout(() => {

        character.classList.remove(
            "milo-hit"
        );

    }, 700);


    miloTimeout(() => {

        if (!miloCollapsed) {
            setMiloFace("happy");
        }

        miloBusy = false;

    }, 1300);
}


/* =========================================================
   KNOCKOUT
========================================================= */

function startMiloKnockoutSequence() {

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
        "milo-dizzy",
        "milo-speaking-ow"
    );


    void character.offsetWidth;


    setMiloFace("ow");


    showMilo(
        "OW!",
        "ow"
    );


    playSound("punch");


    speakMilo(
        "Ow!",
        {
            rate: 1,
            pitch: 0.98,
            volume: 1
        }
    );


    character.classList.add(
        "milo-hit"
    );

    character.classList.add(
        "milo-speaking-ow"
    );


    miloTimeout(() => {

        character.classList.remove(
            "milo-hit"
        );

        character.classList.add(
            "milo-fall"
        );

        hideMilo();

    }, 500);


    miloTimeout(() => {

        character.classList.remove(
            "milo-fall"
        );

        void character.offsetWidth;

        character.classList.add(
            "milo-get-up"
        );

    }, 1450);


    miloTimeout(() => {

        character.classList.remove(
            "milo-get-up"
        );

        setMiloFace("dizzy");

        showMilo(
            "Okay... I think I need a minute.",
            "dizzy"
        );

        speakMilo(
            "Okay... I think I need a minute.",
            {
                rate: 0.88,
                pitch: 0.96,
                volume: 0.95
            }
        );

    }, 2300);


    miloDizzyTimer =
        setTimeout(
            endMiloKnockoutSequence,
            5300
        );
}


function endMiloKnockoutSequence() {

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
        "milo-dizzy",
        "milo-fall",
        "milo-get-up"
    );


    setMiloFace("surprised");


    showMilo(
        "Okay... I'm good now. 😅",
        "surprised"
    );


    setTimeout(() => {

        setMiloFace("happy");

        hideMilo();

        miloTapCount = 0;

        miloCollapsed = false;
        miloBusy = false;

    }, 900);
}


/* =========================================================
   STUDY SESSION CELEBRATION
   NEW — REAL MILO DANCE
========================================================= */

function stopMiloCelebrationAnimation() {

    miloCelebrationAnimations.forEach(
        animation => {

            try {
                animation.cancel();
            } catch (error) {}

        }
    );


    miloCelebrationAnimations = [];


    const character =
        document.getElementById(
            "miloCharacter"
        );


    if (character) {

        character.getAnimations()
            .forEach(animation => {

                try {
                    animation.cancel();
                } catch (error) {}

            });


        character.style.transform = "";
    }


    const monkey =
        document.querySelector(
            "#miloCharacter .milo-monkey"
        );


    if (monkey) {
        monkey.style.transform = "";
    }


    const leftArm =
        document.querySelector(
            "#miloCharacter .milo-arm-left"
        );

    const rightArm =
        document.querySelector(
            "#miloCharacter .milo-arm-right"
        );

    const leftLeg =
        document.querySelector(
            "#miloCharacter .milo-leg-left"
        );

    const rightLeg =
        document.querySelector(
            "#miloCharacter .milo-leg-right"
        );

    const mouth =
        document.querySelector(
            "#miloCharacter .milo-mouth"
        );


    [
        leftArm,
        rightArm,
        leftLeg,
        rightLeg,
        mouth
    ].forEach(element => {

        if (element) {
            element.getAnimations()
                .forEach(animation => {
                    try {
                        animation.cancel();
                    } catch (error) {}
                });
        }

    });
}


function startMiloCelebrationAnimation() {

    const character =
        document.getElementById(
            "miloCharacter"
        );


    if (!character) return;


    stopMiloCelebrationAnimation();


    const monkey =
        character.querySelector(
            ".milo-monkey"
        );


    const leftArm =
        character.querySelector(
            ".milo-arm-left"
        );

    const rightArm =
        character.querySelector(
            ".milo-arm-right"
        );

    const leftLeg =
        character.querySelector(
            ".milo-leg-left"
        );

    const rightLeg =
        character.querySelector(
            ".milo-leg-right"
        );

    const mouth =
        character.querySelector(
            ".milo-mouth"
        );


    /*
     * WHOLE BODY BOUNCE
     */

    if (monkey) {

        miloCelebrationAnimations.push(
            monkey.animate(
                [
                    {
                        transform:
                            "translateY(0) rotate(0deg) scale(1)"
                    },
                    {
                        transform:
                            "translateY(-24px) rotate(-4deg) scale(1.03)"
                    },
                    {
                        transform:
                            "translateY(0) rotate(4deg) scale(1)"
                    },
                    {
                        transform:
                            "translateY(-18px) rotate(-3deg) scale(1.02)"
                    },
                    {
                        transform:
                            "translateY(0) rotate(0deg) scale(1)"
                    }
                ],
                {
                    duration: 700,
                    iterations: Infinity,
                    easing: "ease-in-out"
                }
            )
        );
    }


    /*
     * LEFT ARM
     */

    if (leftArm) {

        miloCelebrationAnimations.push(
            leftArm.animate(
                [
                    {
                        transform:
                            "rotate(15deg)"
                    },
                    {
                        transform:
                            "rotate(-48deg)"
                    },
                    {
                        transform:
                            "rotate(22deg)"
                    },
                    {
                        transform:
                            "rotate(-38deg)"
                    },
                    {
                        transform:
                            "rotate(15deg)"
                    }
                ],
                {
                    duration: 600,
                    iterations: Infinity,
                    easing: "ease-in-out"
                }
            )
        );
    }


    /*
     * RIGHT ARM
     */

    if (rightArm) {

        miloCelebrationAnimations.push(
            rightArm.animate(
                [
                    {
                        transform:
                            "rotate(-15deg)"
                    },
                    {
                        transform:
                            "rotate(48deg)"
                    },
                    {
                        transform:
                            "rotate(-22deg)"
                    },
                    {
                        transform:
                            "rotate(38deg)"
                    },
                    {
                        transform:
                            "rotate(-15deg)"
                    }
                ],
                {
                    duration: 600,
                    iterations: Infinity,
                    easing: "ease-in-out"
                }
            )
        );
    }


    /*
     * LEGS
     */

    if (leftLeg) {

        miloCelebrationAnimations.push(
            leftLeg.animate(
                [
                    {
                        transform:
                            "rotate(0deg) translateY(0)"
                    },
                    {
                        transform:
                            "rotate(-10deg) translateY(-5px)"
                    },
                    {
                        transform:
                            "rotate(8deg) translateY(0)"
                    },
                    {
                        transform:
                            "rotate(0deg)"
                    }
                ],
                {
                    duration: 500,
                    iterations: Infinity,
                    easing: "ease-in-out"
                }
            )
        );
    }


    if (rightLeg) {

        miloCelebrationAnimations.push(
            rightLeg.animate(
                [
                    {
                        transform:
                            "rotate(0deg) translateY(0)"
                    },
                    {
                        transform:
                            "rotate(10deg) translateY(-5px)"
                    },
                    {
                        transform:
                            "rotate(-8deg) translateY(0)"
                    },
                    {
                        transform:
                            "rotate(0deg)"
                    }
                ],
                {
                    duration: 500,
                    iterations: Infinity,
                    easing: "ease-in-out"
                }
            )
        );
    }


    /*
     * MOUTH — CELEBRATION TALKING
     */

    if (mouth) {

        miloCelebrationAnimations.push(
            mouth.animate(
                [
                    {
                        transform: "scaleY(1)"
                    },
                    {
                        transform: "scaleY(1.35)"
                    },
                    {
                        transform: "scaleY(0.65)"
                    },
                    {
                        transform: "scaleY(1.25)"
                    },
                    {
                        transform: "scaleY(1)"
                    }
                ],
                {
                    duration: 360,
                    iterations: Infinity,
                    easing: "ease-in-out"
                }
            )
        );
    }
}


/* =========================================================
   STUDY SESSION COMPLETE
   FIXED — MILO ALWAYS APPEARS ABOVE STREAK OVERLAY
========================================================= */

function miloStudySessionComplete(streak = null) {

    unlockMiloAudio();

    if (miloCelebrationActive) {
        return;
    }

    miloCelebrationActive = true;
    miloBusy = true;

    const container =
        document.getElementById("miloCompanion");

    const character =
        document.getElementById("miloCharacter");

    if (!container || !character) {

        console.error(
            "Milo celebration failed: Milo elements not found."
        );

        miloCelebrationActive = false;
        miloBusy = false;

        return;
    }

    /* =====================================================
       FORCE MILO INTO THE TOP-LEVEL DOCUMENT
    ===================================================== */

    if (container.parentElement !== document.body) {
        document.body.appendChild(container);
    }

    /* =====================================================
       FORCE VISIBILITY
    ===================================================== */

    container.style.position = "fixed";
    container.style.display = "block";
    container.style.visibility = "visible";
    container.style.opacity = "1";
    container.style.zIndex = "2147483647";
    container.style.pointerEvents = "none";

    character.style.display = "block";
    character.style.visibility = "visible";
    character.style.opacity = "1";
    character.style.pointerEvents = "auto";

    /* =====================================================
       REMOVE ANY POSSIBLE HIDDEN STATE
    ===================================================== */

    container.hidden = false;
    character.hidden = false;

    container.removeAttribute("aria-hidden");
    character.removeAttribute("aria-hidden");

    /* =====================================================
       STOP OLD ANIMATIONS
    ===================================================== */

    stopMiloCelebrationAnimation();

    /* =====================================================
       CELEBRATION FACE
    ===================================================== */

    setMiloFace("celebrate");

    /* =====================================================
       STREAK MESSAGE
    ===================================================== */

    const numericStreak = Number(streak);

    const message =
        Number.isFinite(numericStreak) &&
        numericStreak > 0

            ? `Amazing! ${numericStreak} day streak! 🔥🎉`

            : "Study session complete! 🎉";

    showMilo(
        message,
        "celebrate"
    );

    /* =====================================================
       FORCE BUBBLE ABOVE EVERYTHING
    ===================================================== */

    const bubble =
        document.getElementById("miloBubble");

    if (bubble) {

        bubble.style.display = "block";
        bubble.style.visibility = "visible";
        bubble.style.opacity = "1";
        bubble.style.zIndex = "2147483647";
    }

    /* =====================================================
       START MILO DANCE
    ===================================================== */

    startMiloCelebrationAnimation();

    /* =====================================================
       SOUND
    ===================================================== */

    playSound("woohoo");

    /* =====================================================
       VOICE
    ===================================================== */

    speakMilo(
        Number.isFinite(numericStreak) &&
        numericStreak > 0

            ? `Amazing! ${numericStreak} day streak!`

            : "Awesome! You did it!",

        {
            rate: 0.94,
            pitch: 1.08,
            volume: 1
        }
    );

    /* =====================================================
       KEEP CELEBRATION ON SCREEN
    ===================================================== */

    miloTimeout(() => {

        stopMiloCelebrationAnimation();

        setMiloFace("happy");

        if (bubble) {
            bubble.style.display = "none";
        }

        miloCelebrationActive = false;
        miloBusy = false;

    }, 6500);
}



/* =========================================================
   COMPATIBILITY ALIAS
========================================================= */

function celebrateStudySession(completedMinutes = 0) {

    miloStudySessionComplete(
        Number(
            localStorage.getItem(
                "studyMindStreak"
            ) || 0
        )
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


    playSound("xp");
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


    setMiloFace("thinking");


    miloQuestionTimer =
        setTimeout(() => {

            if (
                miloBusy ||
                miloCollapsed
            ) {
                return;
            }


            setMiloFace("impatient");


            showMilo(
                "Ahem... I'm still waiting. 😅",
                "impatient"
            );

        }, 15000);
}


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

    unlockMiloAudio();

    miloQuestionAnswered();

    miloBusy = true;


    const character =
        document.getElementById(
            "miloCharacter"
        );


    if (character) {

        character.classList.remove(
            "milo-disappointed",
            "milo-shake",
            "milo-wrong-reaction"
        );

        character.classList.add(
            "milo-answer-correct"
        );
    }


    setMiloFace("celebrate");


    showMilo(
        "Woohoo! You got it! 🎉",
        "celebrate"
    );


    playSound("woohoo");


    speakMilo(
        "Woohoo!",
        {
            rate: 0.94,
            pitch: 1.04,
            volume: 1
        }
    );


    addXP(5);


    miloTimeout(() => {

        if (character) {

            character.classList.remove(
                "milo-answer-correct"
            );
        }


        setMiloFace("happy");

        miloBusy = false;

    }, 2200);
}


/* =========================================================
   WRONG ANSWER
========================================================= */

function miloWrongAnswer(
    explanation = ""
) {

    unlockMiloAudio();

    miloQuestionAnswered();

    miloBusy = true;


    const character =
        document.getElementById(
            "miloCharacter"
        );


    setMiloFace("wrong");


    showMilo(
        explanation ||
        "Not quite... let's try again.",
        "wrong"
    );


    playSound("wrong");


    if (character) {

        character.classList.remove(
            "milo-disappointed",
            "milo-shake",
            "milo-wrong-reaction"
        );


        void character.offsetWidth;


        character.classList.add(
            "milo-disappointed"
        );

        character.classList.add(
            "milo-wrong-reaction"
        );


        miloTimeout(() => {

            character.classList.remove(
                "milo-disappointed",
                "milo-wrong-reaction"
            );

        }, 700);
    }


    miloTimeout(() => {

        setMiloFace("happy");

        miloBusy = false;

    }, 1600);
}


/* =========================================================
   GAME CORRECT
========================================================= */

function miloGameCorrect() {

    unlockMiloAudio();

    miloBusy = true;

    setMiloFace("celebrate");


    showMilo(
        "YESSS! Woohoo! 🎉",
        "celebrate"
    );


    playSound("woohoo");


    speakMilo(
        "Woohoo!",
        {
            rate: 0.94,
            pitch: 1.05,
            volume: 1
        }
    );


    addXP(10);


    miloTimeout(() => {

        setMiloFace("happy");

        miloBusy = false;

    }, 2200);
}


/* =========================================================
   GAME WRONG
========================================================= */

function miloGameWrong() {

    unlockMiloAudio();

    miloBusy = true;


    const character =
        document.getElementById(
            "miloCharacter"
        );


    setMiloFace("wrong");


    showMilo(
        "Oh no... 😕",
        "wrong"
    );


    playSound("wrong");


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


        setMiloFace("happy");

        miloBusy = false;

    }, 1500);
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


    setMiloFace("thinking");


    showMilo(
        "Need some help? I'm here. 🤔",
        "thinking"
    );


    miloTimeout(() => {

        setMiloFace("happy");

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

        setMiloFace("happy");


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

    unlockMiloAudio();


    setMiloFace("celebrate");


    showMilo(
        `${days} day streak! 🔥🎉`,
        "celebrate"
    );


    startMiloCelebrationAnimation();


    playSound("woohoo");


    speakMilo(
        `${days} day streak!`,
        {
            rate: 0.95,
            pitch: 1.05,
            volume: 1
        }
    );
}


/* =========================================================
   PUBLIC API
========================================================= */

window.Milo = {

    show: showMilo,

    hide: hideMilo,

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

    /*
     * NEW AUTHORITATIVE STUDY COMPLETION API
     */

    miloStudySessionComplete,

    /*
     * OLD COMPATIBILITY API
     */

    celebrateStudySession,

    miloOfferHelp,

    miloQuestionStarted,

    miloQuestionAnswered,

    miloTap: handleMiloTap,

    resetTapCount: () => {

        miloTapCount = 0;

    },

    playSound

};


console.log(
    "StudyMind AI — Milo Monkey v8 ready"
);
