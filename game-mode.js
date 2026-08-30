
/* =========================================================
   STUDYMIND AI — GAME MODE
   VERSION: FIXED COMPUTER BATTLE + SAFE 1v1
========================================================= */

"use strict";


/* =========================================================
   SETTINGS
========================================================= */

const FREE_BATTLE_LIMIT = 5;
const QUESTIONS_PER_BATTLE = 10;
const QUESTION_TIME_LIMIT = 15;

const STORAGE_KEYS = {
    battleCount: "studyMindGameBattleCount",
    battlePoints: "studyMindBattlePoints",
    premium: "studyMindPremium",
    plan: "studyMindPlan",
    theme: "studyMindTheme"
};


/* =========================================================
   GAME STATE
========================================================= */

let battleQuestions = [];
let currentQuestionIndex = 0;

let playerScore = 0;
let computerScore = 0;
let battlePoints = 0;

let battleTimer = QUESTION_TIME_LIMIT;
let battleTimerInterval = null;

let answeringLocked = false;
let battleActive = false;
let generatingBattle = false;


/* =========================================================
   1v1 STATE
========================================================= */

let oneVOneActive = false;
let oneVOneQuestions = [];
let oneVOneQuestionIndex = 0;
let oneVOnePlayerScore = 0;
let oneVOneOpponentScore = 0;
let oneVOneTimerInterval = null;


/*
   IMPORTANT

   This version intentionally does NOT query:

       game_match_players

   directly.

   That table currently has an RLS policy that recursively
   references itself. Until the database policy is fixed,
   querying it from the browser causes:

       infinite recursion detected in policy
       for relation "game_match_players"

   The computer battle therefore remains fully functional
   without touching that table.
*/


/* =========================================================
   DOM HELPER
========================================================= */

function getElement(id) {
    return document.getElementById(id);
}


/* =========================================================
   STORAGE
========================================================= */

function getBattleCount() {

    return Number(
        localStorage.getItem(
            STORAGE_KEYS.battleCount
        )
    ) || 0;
}


function setBattleCount(count) {

    localStorage.setItem(
        STORAGE_KEYS.battleCount,
        String(count)
    );
}


function getBattlePoints() {

    return Number(
        localStorage.getItem(
            STORAGE_KEYS.battlePoints
        )
    ) || 0;
}


function setBattlePoints(points) {

    localStorage.setItem(
        STORAGE_KEYS.battlePoints,
        String(points)
    );
}


function isPremiumUser() {

    const premium =
        localStorage.getItem(
            STORAGE_KEYS.premium
        );

    return (
        premium === "true" ||
        premium === "1"
    );
}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeGameMode
);


function initializeGameMode() {

    battlePoints =
        getBattlePoints();

    loadTheme();

    updateBattleStatus();

    loadBattleSubjects();

    loadOneVOneSubjects();

    setupBattleSubjectChange();

    setupOneVOneSubjectChange();

    updateLeaderboard();

    console.log(
        "StudyMind Game Mode initialized."
    );
}


/* =========================================================
   BATTLE STATUS
========================================================= */

function updateBattleStatus() {

    const used =
        getBattleCount();

    const battlesUsed =
        getElement("battlesUsed");

    const battleLimit =
        getElement("battleLimit");

    const battleStatusText =
        getElement("battleStatusText");

    const computerModeButton =
        getElement("computerModeButton");

    const startBattleButton =
        getElement("startBattleButton");

    const premiumCard =
        getElement("premiumBattleCard");


    if (battlesUsed) {

        battlesUsed.textContent =
            used;
    }


    if (battleLimit) {

        battleLimit.textContent =
            FREE_BATTLE_LIMIT;
    }


    if (isPremiumUser()) {

        if (battleStatusText) {

            battleStatusText.textContent =
                "Unlimited battles available";

            battleStatusText.style.color =
                "#22c55e";
        }


        if (premiumCard) {

            premiumCard.style.display =
                "none";
        }


        if (computerModeButton) {

            computerModeButton.disabled =
                false;

            computerModeButton.style.opacity =
                "1";
        }

        return;
    }


    const remaining =
        Math.max(
            0,
            FREE_BATTLE_LIMIT - used
        );


    if (battleStatusText) {

        if (remaining > 0) {

            battleStatusText.textContent =
                `${remaining} battle${remaining === 1 ? "" : "s"} remaining`;

            battleStatusText.style.color =
                "#22c55e";

        } else {

            battleStatusText.textContent =
                "Free battle limit reached";

            battleStatusText.style.color =
                "#f59e0b";
        }
    }


    if (remaining <= 0) {

        if (computerModeButton) {

            computerModeButton.disabled =
                true;

            computerModeButton.style.opacity =
                "0.5";
        }


        if (startBattleButton) {

            startBattleButton.disabled =
                true;

            startBattleButton.textContent =
                "🔒 Free Battles Used";
        }


        if (premiumCard) {

            premiumCard.style.display =
                "grid";
        }

    } else {

        if (computerModeButton) {

            computerModeButton.disabled =
                false;

            computerModeButton.style.opacity =
                "1";
        }
    }
}


/* =========================================================
   STUDY PLAN
========================================================= */

function getStudyPlan() {

    const possibleKeys = [
        "studyMindPlan",
        "studyMindStudyPlan",
        "studyPlan",
        "studyMindCurrentPlan"
    ];


    for (const key of possibleKeys) {

        const raw =
            localStorage.getItem(key);

        if (!raw) {
            continue;
        }


        try {

            const parsed =
                JSON.parse(raw);

            if (
                parsed &&
                typeof parsed === "object"
            ) {

                return parsed;
            }

        } catch (error) {

            console.warn(
                `Could not parse ${key}`,
                error
            );
        }
    }


    return null;
}


/* =========================================================
   NORMALIZE SUBJECTS
========================================================= */

function getSubjectsFromStudyPlan() {

    const plan =
        getStudyPlan();

    if (!plan) {
        return [];
    }


    let subjects = [];


    if (
        Array.isArray(
            plan.subjects
        )
    ) {

        subjects =
            plan.subjects
                .map(item => {

                    if (
                        typeof item ===
                        "string"
                    ) {
                        return item.trim();
                    }

                    if (
                        item &&
                        typeof item.name ===
                        "string"
                    ) {
                        return item.name.trim();
                    }

                    if (
                        item &&
                        typeof item.subject ===
                        "string"
                    ) {
                        return item.subject.trim();
                    }

                    return "";
                })
                .filter(Boolean);
    }


    /*
       Older versions of StudyMind may have stored
       subjects as a comma-separated string.
    */

    if (
        subjects.length === 0 &&
        typeof plan.subjects ===
        "string"
    ) {

        subjects =
            plan.subjects
                .split(",")
                .map(
                    subject =>
                        subject.trim()
                )
                .filter(Boolean);
    }


    return [
        ...new Set(
            subjects
        )
    ];
}


/* =========================================================
   GET TOPICS
========================================================= */

function getTopicsForSubject(
    subject
) {

    const plan =
        getStudyPlan();

    if (!plan || !subject) {
        return [];
    }


    const topics = [];


    /*
       FORMAT 1:

       topics: [
           {
               subject: "Mathematics",
               topic: "Algebra"
           }
       ]
    */

    if (
        Array.isArray(
            plan.topics
        )
    ) {

        plan.topics.forEach(
            item => {

                if (
                    typeof item ===
                    "string"
                ) {

                    const parts =
                        item.split(":");

                    if (
                        parts.length >= 2
                    ) {

                        const itemSubject =
                            parts[0].trim();

                        if (
                            itemSubject
                                .toLowerCase() ===
                            subject.toLowerCase()
                        ) {

                            parts
                                .slice(1)
                                .join(":")
                                .split(",")
                                .forEach(
                                    topic => {

                                        const clean =
                                            topic.trim();

                                        if (
                                            clean
                                        ) {
                                            topics.push(
                                                clean
                                            );
                                        }
                                    }
                                );
                        }
                    }

                    return;
                }


                if (
                    item &&
                    typeof item ===
                    "object"
                ) {

                    const itemSubject =
                        String(
                            item.subject ||
                            item.subjectName ||
                            ""
                        ).trim();

                    const topicName =
                        String(
                            item.topic ||
                            item.topicName ||
                            item.name ||
                            item.title ||
                            ""
                        ).trim();

                    if (
                        itemSubject &&
                        topicName &&
                        itemSubject
                            .toLowerCase() ===
                        subject.toLowerCase()
                    ) {

                        topics.push(
                            topicName
                        );
                    }
                }
            }
        );
    }


    /*
       FORMAT 2:

       plan.topics = {
           Mathematics: [
               "Algebra",
               "Geometry"
           ]
       }
    */

    if (
        plan.topics &&
        typeof plan.topics ===
        "object" &&
        !Array.isArray(plan.topics)
    ) {

        const matching =
            plan.topics[
                subject
            ];

        if (
            Array.isArray(
                matching
            )
        ) {

            matching.forEach(
                topic => {

                    if (
                        typeof topic ===
                        "string"
                    ) {

                        topics.push(
                            topic.trim()
                        );

                    } else if (
                        topic &&
                        typeof topic ===
                        "object"
                    ) {

                        const name =
                            topic.name ||
                            topic.topic ||
                            topic.title;

                        if (name) {
                            topics.push(
                                String(name).trim()
                            );
                        }
                    }
                }
            );
        }
    }


    return [
        ...new Set(
            topics.filter(Boolean)
        )
    ];
}


/* =========================================================
   LOAD COMPUTER SUBJECTS
========================================================= */

function loadBattleSubjects() {

    const subjectSelect =
        getElement(
            "battleSubject"
        );

    if (!subjectSelect) {
        return;
    }


    subjectSelect.innerHTML =
        `<option value="">Choose a subject</option>`;


    const subjects =
        getSubjectsFromStudyPlan();


    subjects.forEach(
        subject => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                subject;

            option.textContent =
                subject;

            subjectSelect.appendChild(
                option
            );
        }
    );


    if (
        subjects.length === 0
    ) {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            "General";

        option.textContent =
            "General";

        subjectSelect.appendChild(
            option
        );
    }
}


/* =========================================================
   COMPUTER SUBJECT CHANGE
========================================================= */

function setupBattleSubjectChange() {

    const subjectSelect =
        getElement(
            "battleSubject"
        );

    const topicSelect =
        getElement(
            "battleTopic"
        );

    const startButton =
        getElement(
            "startBattleButton"
        );


    if (
        !subjectSelect ||
        !topicSelect
    ) {
        return;
    }


    subjectSelect.addEventListener(
        "change",
        function () {

            const subject =
                subjectSelect.value;


            topicSelect.innerHTML =
                "";


            if (!subject) {

                topicSelect.disabled =
                    true;

                topicSelect.innerHTML =
                    `<option value="">Choose a subject first</option>`;

                if (startButton) {
                    startButton.disabled =
                        true;
                }

                return;
            }


            const topics =
                getTopicsForSubject(
                    subject
                );


            if (
                topics.length === 0
            ) {

                topicSelect.disabled =
                    false;

                topicSelect.innerHTML =
                    `<option value="general">General Topic</option>`;

            } else {

                topicSelect.disabled =
                    false;

                topicSelect.innerHTML =
                    `<option value="">Choose a topic</option>`;


                topics.forEach(
                    topic => {

                        const option =
                            document.createElement(
                                "option"
                            );

                        option.value =
                            topic;

                        option.textContent =
                            topic;

                        topicSelect.appendChild(
                            option
                        );
                    }
                );
            }


            if (startButton) {
                startButton.disabled =
                    true;
            }
        }
    );


    topicSelect.addEventListener(
        "change",
        function () {

            if (startButton) {

                startButton.disabled =
                    !topicSelect.value;
            }
        }
    );
}


/* =========================================================
   START COMPUTER BATTLE SETUP
========================================================= */

function startComputerBattle() {

    if (
        !isPremiumUser() &&
        getBattleCount() >=
        FREE_BATTLE_LIMIT
    ) {

        showPremiumMessage();

        return;
    }


    const setup =
        getElement(
            "battleSetup"
        );


    const oneVOneSetup =
        getElement(
            "oneVOneSetup"
        );


    if (oneVOneSetup) {
        oneVOneSetup.hidden =
            true;
    }


    if (setup) {

        setup.hidden =
            false;

        setup.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }
}


/* =========================================================
   BEGIN COMPUTER BATTLE
========================================================= */

async function beginBattle() {

    if (generatingBattle) {
        return;
    }


    if (
        !isPremiumUser() &&
        getBattleCount() >=
        FREE_BATTLE_LIMIT
    ) {

        showPremiumMessage();

        return;
    }


    const subjectSelect =
        getElement(
            "battleSubject"
        );

    const topicSelect =
        getElement(
            "battleTopic"
        );

    const difficultySelect =
        getElement(
            "battleDifficulty"
        );


    const subject =
        subjectSelect
            ? subjectSelect.value
            : "";


    const topic =
        topicSelect
            ? topicSelect.value
            : "";


    const topicName =
        topicSelect &&
        topicSelect.selectedIndex >= 0
            ? topicSelect.options[
                topicSelect.selectedIndex
            ].textContent
            : topic;


    const difficulty =
        difficultySelect
            ? difficultySelect.value
            : "mixed";


    if (!subject) {

        showBattleSetupMessage(
            "Please choose a subject before starting your battle."
        );

        return;
    }


    if (!topic) {

        showBattleSetupMessage(
            "Please choose a topic before starting your battle."
        );

        return;
    }


    generatingBattle =
        true;


    setStartButtonLoading();


    try {

        const questions =
            await generateAIBattleQuestions(
                subject,
                topicName,
                difficulty
            );


        if (
            !Array.isArray(
                questions
            ) ||
            questions.length <
            QUESTIONS_PER_BATTLE
        ) {

            throw new Error(
                "StudyMind AI did not return enough valid questions."
            );
        }


        battleQuestions =
            questions.slice(
                0,
                QUESTIONS_PER_BATTLE
            );


        currentQuestionIndex =
            0;

        playerScore =
            0;

        computerScore =
            0;

        battleActive =
            true;

        answeringLocked =
            false;


        /*
           Count the battle only after
           successful question generation.
        */

        if (
            !isPremiumUser()
        ) {

            setBattleCount(
                getBattleCount() + 1
            );
        }


        updateBattleStatus();


        const setup =
            getElement(
                "battleSetup"
            );

        const arena =
            getElement(
                "battleArena"
            );

        const results =
            getElement(
                "battleResults"
            );


        if (setup) {
            setup.hidden =
                true;
        }


        if (results) {
            results.hidden =
                true;
        }


        if (arena) {
            arena.hidden =
                false;
        }


        updateScores();

        showQuestion();


        if (arena) {

            arena.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }

    } catch (error) {

        console.error(
            "Battle generation error:",
            error
        );


        showBattleGenerationError(
            error
        );

    } finally {

        generatingBattle =
            false;

        restoreStartButton();
    }
}


/* =========================================================
   AI BATTLE QUESTION GENERATION
========================================================= */

async function generateAIBattleQuestions(
    subject,
    topic,
    difficulty
) {

    const difficultyInstruction =
        difficulty === "mixed"
            ? "Use a balanced mixture of easy, medium and challenging questions."
            : `Make all questions ${difficulty} difficulty.`;


    const prompt = `
You are StudyMind AI creating a competitive educational battle.

The student is a secondary-school student.

SUBJECT:
${subject}

TOPIC:
${topic}

DIFFICULTY:
${difficulty}

${difficultyInstruction}

Create exactly 10 high-quality multiple-choice questions about the selected subject and topic.

IMPORTANT REQUIREMENTS:

- Exactly 10 questions.
- Exactly 4 options per question.
- Only ONE option is correct.
- Questions must genuinely test knowledge of the selected topic.
- Questions must NOT be generic study-advice questions.
- Questions should be appropriate for a secondary-school student.
- Mix conceptual, application and factual questions where appropriate.
- Do not repeat questions.
- Do not make the correct answer always option A.
- Make incorrect options plausible but clearly incorrect.
- Keep questions concise enough for a timed quiz.
- Return ONLY valid JSON.
- Do NOT use markdown.
- Do NOT include explanations outside the JSON.

Return exactly this structure:

[
  {
    "question": "Question text",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "answer": 0
  }
]

The "answer" value MUST be the zero-based index of the correct option.
`.trim();


    const response =
        await fetch(
            "/api/chat",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        message:
                            prompt
                    })
            }
        );


    let data =
        null;


    try {

        data =
            await response.json();

    } catch {

        data =
            null;
    }


    if (!response.ok) {

        throw new Error(
            data?.error ||
            "The StudyMind AI server returned an error."
        );
    }


    if (
        !data ||
        !data.reply
    ) {

        throw new Error(
            "StudyMind AI returned an empty response."
        );
    }


    const questions =
        parseAIQuestionJSON(
            data.reply
        );


    validateBattleQuestions(
        questions
    );


    return questions;
}


/* =========================================================
   PARSE AI JSON
========================================================= */

function parseAIQuestionJSON(
    responseText
) {

    let cleaned =
        String(
            responseText
        ).trim();


    cleaned =
        cleaned
            .replace(
                /^```json\s*/i,
                ""
            )
            .replace(
                /^```\s*/i,
                ""
            )
            .replace(
                /\s*```$/i,
                ""
            )
            .trim();


    const firstBracket =
        cleaned.indexOf("[");

    const lastBracket =
        cleaned.lastIndexOf("]");


    if (
        firstBracket !== -1 &&
        lastBracket !== -1 &&
        lastBracket >
        firstBracket
    ) {

        cleaned =
            cleaned.slice(
                firstBracket,
                lastBracket + 1
            );
    }


    try {

        const parsed =
            JSON.parse(
                cleaned
            );


        if (
            !Array.isArray(
                parsed
            )
        ) {

            throw new Error(
                "AI response was not an array."
            );
        }


        return parsed;

    } catch (error) {

        console.error(
            "AI question JSON parse error:",
            error
        );


        throw new Error(
            "StudyMind AI returned invalid question data. Please try the battle again."
        );
    }
}


/* =========================================================
   VALIDATE QUESTIONS
========================================================= */

function validateBattleQuestions(
    questions
) {

    if (
        !Array.isArray(
            questions
        )
    ) {

        throw new Error(
            "Invalid question list."
        );
    }


    if (
        questions.length <
        QUESTIONS_PER_BATTLE
    ) {

        throw new Error(
            `Only ${questions.length} questions were generated. 10 are required.`
        );
    }


    questions
        .slice(
            0,
            QUESTIONS_PER_BATTLE
        )
        .forEach(
            (
                question,
                index
            ) => {

                if (
                    !question ||
                    typeof question.question !==
                    "string"
                ) {

                    throw new Error(
                        `Question ${index + 1} is invalid.`
                    );
                }


                if (
                    !Array.isArray(
                        question.options
                    ) ||
                    question.options.length <
                    4
                ) {

                    throw new Error(
                        `Question ${index + 1} does not have 4 answer options.`
                    );
                }


                const answer =
                    Number(
                        question.answer
                    );


                if (
                    !Number.isInteger(
                        answer
                    ) ||
                    answer < 0 ||
                    answer > 3
                ) {

                    throw new Error(
                        `Question ${index + 1} has an invalid correct answer.`
                    );
                }
            }
        );
}


/* =========================================================
   SHOW COMPUTER QUESTION
========================================================= */

function showQuestion() {

    if (
        currentQuestionIndex >=
        battleQuestions.length
    ) {

        finishBattle();

        return;
    }


    const question =
        battleQuestions[
            currentQuestionIndex
        ];


    answeringLocked =
        false;


    const questionNumber =
        getElement(
            "currentQuestionNumber"
        );

    const questionText =
        getElement(
            "battleQuestion"
        );

    const questionTopic =
        getElement(
            "battleQuestionTopic"
        );

    const answerGrid =
        getElement(
            "answerGrid"
        );


    if (questionNumber) {

        questionNumber.textContent =
            currentQuestionIndex + 1;
    }


    if (questionText) {

        questionText.textContent =
            question.question;
    }


    if (questionTopic) {

        questionTopic.textContent =
            question.topic ||
            getSelectedTopicName() ||
            "Study Topic";
    }


    if (!answerGrid) {
        return;
    }


    answerGrid.innerHTML =
        "";


    const answerObjects =
        question.options
            .slice(
                0,
                4
            )
            .map(
                (
                    answer,
                    index
                ) => ({

                    text:
                        answer,

                    originalIndex:
                        index
                })
            );


    const shuffledAnswers =
        shuffleArray(
            answerObjects
        );


    shuffledAnswers.forEach(
        (
            answer,
            index
        ) => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";

            button.className =
                "answer-button";


            button.textContent =
                `${String.fromCharCode(65 + index)}. ${answer.text}`;


            button.dataset.originalIndex =
                answer.originalIndex;


            button.addEventListener(
                "click",
                () =>
                    handleAnswer(
                        answer.originalIndex,
                        button
                    )
            );


            answerGrid.appendChild(
                button
            );
        }
    );


    startQuestionTimer();
}


/* =========================================================
   SELECTED TOPIC
========================================================= */

function getSelectedTopicName() {

    const select =
        getElement(
            "battleTopic"
        );


    if (
        !select ||
        select.selectedIndex < 0
    ) {

        return "";
    }


    return select.options[
        select.selectedIndex
    ].textContent;
}


/* =========================================================
   COMPUTER QUESTION TIMER
========================================================= */

function startQuestionTimer() {

    clearInterval(
        battleTimerInterval
    );


    battleTimer =
        QUESTION_TIME_LIMIT;


    updateTimerDisplay();


    battleTimerInterval =
        setInterval(
            () => {

                if (!battleActive) {

                    clearInterval(
                        battleTimerInterval
                    );

                    return;
                }


                battleTimer--;

                updateTimerDisplay();


                if (
                    battleTimer <= 0
                ) {

                    clearInterval(
                        battleTimerInterval
                    );


                    handleAnswer(
                        null,
                        null
                    );
                }

            },
            1000
        );
}


/* =========================================================
   TIMER DISPLAY
========================================================= */

function updateTimerDisplay() {

    const timer =
        getElement(
            "battleTimer"
        );


    if (timer) {

        timer.textContent =
            Math.max(
                0,
                battleTimer
            );
    }
}


/* =========================================================
   HANDLE COMPUTER ANSWER
========================================================= */

function handleAnswer(
    selectedIndex,
    selectedButton
) {

    if (
        answeringLocked ||
        !battleActive
    ) {

        return;
    }


    answeringLocked =
        true;


    clearInterval(
        battleTimerInterval
    );


    const question =
        battleQuestions[
            currentQuestionIndex
        ];


    const correctIndex =
        Number(
            question.answer
        );


    const buttons =
        document.querySelectorAll(
            "#answerGrid .answer-button"
        );


    buttons.forEach(
        button => {

            button.disabled =
                true;
        }
    );


    if (
        selectedIndex !== null &&
        selectedIndex ===
        correctIndex
    ) {

        playerScore++;


        if (selectedButton) {

            selectedButton.classList.add(
                "correct"
            );
        }

    } else {

        if (selectedButton) {

            selectedButton.classList.add(
                "incorrect"
            );
        }


        buttons.forEach(
            button => {

                if (
                    Number(
                        button.dataset.originalIndex
                    ) ===
                    correctIndex
                ) {

                    button.classList.add(
                        "correct"
                    );
                }
            }
        );
    }


    computerTakeTurn();

    updateScores();


    setTimeout(
        () => {

            currentQuestionIndex++;

            showQuestion();

        },
        850
    );
}


/* =========================================================
   COMPUTER TURN
========================================================= */

function computerTakeTurn() {

    const difficultySelect =
        getElement(
            "battleDifficulty"
        );


    let chance =
        0.55;


    if (
        difficultySelect
    ) {

        if (
            difficultySelect.value ===
            "easy"
        ) {

            chance =
                0.45;

        } else if (
            difficultySelect.value ===
            "medium"
        ) {

            chance =
                0.55;

        } else if (
            difficultySelect.value ===
            "hard"
        ) {

            chance =
                0.70;
        }
    }


    if (
        Math.random() <
        chance
    ) {

        computerScore++;
    }
}


/* =========================================================
   UPDATE SCORES
========================================================= */

function updateScores() {

    const player =
        getElement(
            "playerScore"
        );

    const computer =
        getElement(
            "computerScore"
        );


    if (player) {

        player.textContent =
            playerScore;
    }


    if (computer) {

        computer.textContent =
            computerScore;
    }
}


/* =========================================================
   FINISH COMPUTER BATTLE
========================================================= */

function finishBattle() {

    battleActive =
        false;


    clearInterval(
        battleTimerInterval
    );


    const pointsEarned =
        calculateBattlePoints();


    battlePoints +=
        pointsEarned;


    setBattlePoints(
        battlePoints
    );


    const arena =
        getElement(
            "battleArena"
        );

    const results =
        getElement(
            "battleResults"
        );


    if (arena) {

        arena.hidden =
            true;
    }


    if (results) {

        results.hidden =
            false;
    }


    const finalPlayerScore =
        getElement(
            "finalPlayerScore"
        );

    const finalComputerScore =
        getElement(
            "finalComputerScore"
        );

    const pointsElement =
        getElement(
            "pointsEarned"
        );

    const resultTitle =
        getElement(
            "battleResultTitle"
        );

    const resultMessage =
        getElement(
            "battleResultMessage"
        );


    if (finalPlayerScore) {

        finalPlayerScore.textContent =
            playerScore;
    }


    if (finalComputerScore) {

        finalComputerScore.textContent =
            computerScore;
    }


    if (pointsElement) {

        pointsElement.textContent =
            `+${pointsEarned}`;
    }


    if (
        playerScore >
        computerScore
    ) {

        if (resultTitle) {

            resultTitle.textContent =
                "🏆 You Win!";
        }


        if (resultMessage) {

            resultMessage.textContent =
                `Excellent work! You scored ${playerScore} out of ${QUESTIONS_PER_BATTLE} and defeated the computer.`;
        }

    } else if (
        playerScore <
        computerScore
    ) {

        if (resultTitle) {

            resultTitle.textContent =
                "Keep Practising!";
        }


        if (resultMessage) {

            resultMessage.textContent =
                `You scored ${playerScore} out of ${QUESTIONS_PER_BATTLE}. Keep studying and try again when another battle is available.`;
        }

    } else {

        if (resultTitle) {

            resultTitle.textContent =
                "🤝 It's a Draw!";
        }


        if (resultMessage) {

            resultMessage.textContent =
                `You and the computer both scored ${playerScore}.`;
        }
    }


    updateLeaderboard();

    updateBattleStatus();


    if (results) {

        results.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }
}


/* =========================================================
   POINTS
========================================================= */

function calculateBattlePoints() {

    let points =
        playerScore * 10;


    if (
        playerScore >
        computerScore
    ) {

        points += 25;

    } else if (
        playerScore ===
        computerScore
    ) {

        points += 10;
    }


    return points;
}


/* =========================================================
   RESET COMPUTER BATTLE
========================================================= */

function resetBattle() {

    clearInterval(
        battleTimerInterval
    );


    battleQuestions =
        [];

    currentQuestionIndex =
        0;

    playerScore =
        0;

    computerScore =
        0;

    battleActive =
        false;

    answeringLocked =
        false;


    updateScores();


    const arena =
        getElement(
            "battleArena"
        );

    const results =
        getElement(
            "battleResults"
        );

    const setup =
        getElement(
            "battleSetup"
        );


    if (arena) {

        arena.hidden =
            true;
    }


    if (results) {

        results.hidden =
            true;
    }


    if (setup) {

        setup.hidden =
            false;

        setup.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }


    updateBattleStatus();
}


/* =========================================================
   PREMIUM MESSAGE
========================================================= */

function showPremiumMessage() {

    const premiumCard =
        getElement(
            "premiumBattleCard"
        );


    if (premiumCard) {

        premiumCard.style.display =
            "grid";

        premiumCard.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }


    alert(
        "You've used all 5 free battles. Upgrade to Premium to continue playing unlimited battles."
    );
}


/* =========================================================
   BATTLE SETUP MESSAGE
========================================================= */

function showBattleSetupMessage(
    message
) {

    alert(
        message
    );
}


/* =========================================================
   AI ERROR
========================================================= */

function showBattleGenerationError(
    error
) {

    const message =
        error?.message ||
        "StudyMind AI could not create the battle right now.";


    alert(
        `${message}\n\nPlease try again in a moment.`
    );
}


/* =========================================================
   START BUTTON LOADING
========================================================= */

function setStartButtonLoading() {

    const button =
        getElement(
            "startBattleButton"
        );


    if (!button) {
        return;
    }


    button.disabled =
        true;


    button.dataset.originalText =
        button.textContent;


    button.textContent =
        "🤖 StudyMind AI is creating your battle...";
}


/* =========================================================
   RESTORE START BUTTON
========================================================= */

function restoreStartButton() {

    const button =
        getElement(
            "startBattleButton"
        );


    if (!button) {
        return;
    }


    if (
        !isPremiumUser() &&
        getBattleCount() >=
        FREE_BATTLE_LIMIT
    ) {

        button.disabled =
            true;

        button.textContent =
            "🔒 Free Battles Used";

        return;
    }


    const topicSelect =
        getElement(
            "battleTopic"
        );


    button.disabled =
        !topicSelect ||
        !topicSelect.value;


    button.textContent =
        button.dataset.originalText ||
        "⚔️ Start Battle";
}


/* =========================================================
   PREMIUM
========================================================= */

function openPremium() {

    window.location.href =
        "premium.html";
}


/* =========================================================
   LEADERBOARD
========================================================= */

function updateLeaderboard() {

    battlePoints =
        getBattlePoints();


    const pointsElement =
        getElement(
            "yourBattlePoints"
        );


    if (pointsElement) {

        pointsElement.textContent =
            battlePoints.toLocaleString();
    }


    const rankElement =
        getElement(
            "yourLeaderboardRank"
        );


    if (!rankElement) {
        return;
    }


    let rank =
        4;


    if (
        battlePoints >=
        1950
    ) {

        rank =
            3;
    }


    if (
        battlePoints >=
        2180
    ) {

        rank =
            2;
    }


    if (
        battlePoints >=
        2450
    ) {

        rank =
            1;
    }


    const rankSpan =
        rankElement.querySelector(
            "span:first-child"
        );


    if (rankSpan) {

        rankSpan.textContent =
            rank <= 3
                ? `#${rank}`
                : "—";
    }


    /*
       Local leaderboard display.

       We do NOT query game_match_players
       here.
    */

    const leaderboardRows =
        getElement(
            "leaderboardRows"
        );


    if (
        leaderboardRows &&
        leaderboardRows.innerHTML.includes(
            "Loading"
        )
    ) {

        leaderboardRows.innerHTML = `
            <div class="leaderboard-row">
                <span>—</span>
                <span>StudyMind Player</span>
                <strong>${battlePoints.toLocaleString()}</strong>
            </div>
        `;
    }
}


/* =========================================================
   THEME
========================================================= */

function loadTheme() {

    const theme =
        localStorage.getItem(
            STORAGE_KEYS.theme
        );


    if (
        theme ===
        "light"
    ) {

        document.body.classList.add(
            "light-mode"
        );
    }


    updateThemeButton();
}


function toggleGameTheme() {

    document.body.classList.toggle(
        "light-mode"
    );


    const light =
        document.body.classList.contains(
            "light-mode"
        );


    localStorage.setItem(
        STORAGE_KEYS.theme,
        light
            ? "light"
            : "dark"
    );


    updateThemeButton();
}


function updateThemeButton() {

    const button =
        getElement(
            "themeButton"
        );


    if (!button) {
        return;
    }


    const light =
        document.body.classList.contains(
            "light-mode"
        );


    button.textContent =
        light
            ? "☀️ Light Mode"
            : "🌙 Dark Mode";
}


/* =========================================================
   NAVIGATION
========================================================= */

function openHome() {

    window.location.href =
        "home.html";
}


function openNewStudyPlan() {

    window.location.href =
        "index.html";
}


function openSummarizer() {

    window.location.href =
        "summarizer.html";
}


function openStudyStreak() {

    window.location.href =
        "streak.html";
}


function openStudyScore() {

    window.location.href =
        "study-score.html";
}


function logoutStudyMind() {

    if (
        typeof window.supabaseClient !==
        "undefined" &&
        window.supabaseClient
    ) {

        window.supabaseClient.auth
            .signOut()
            .finally(
                () => {

                    window.location.href =
                        "login.html";
                }
            );

        return;
    }


    window.location.href =
        "login.html";
}


/* =========================================================
   =========================================================
   1v1 MODE
   =========================================================
========================================================= */


/*
   IMPORTANT:

   The HTML contains a real-time 1v1 interface.

   However, the current Supabase RLS policy on
   game_match_players recursively references itself.

   Therefore this JavaScript does NOT attempt to insert,
   select, update, or subscribe to game_match_players.

   This prevents the database error from crashing Game Mode.
*/


function loadOneVOneSubjects() {

    const subjectSelect =
        getElement(
            "oneVOneSubject"
        );


    if (!subjectSelect) {
        return;
    }


    subjectSelect.innerHTML =
        `<option value="">Choose a subject</option>`;


    const subjects =
        getSubjectsFromStudyPlan();


    subjects.forEach(
        subject => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                subject;

            option.textContent =
                subject;

            subjectSelect.appendChild(
                option
            );
        }
    );


    if (
        subjects.length === 0
    ) {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            "General";

        option.textContent =
            "General";

        subjectSelect.appendChild(
            option
        );
    }
}


/* =========================================================
   1v1 SUBJECT CHANGE
========================================================= */

function setupOneVOneSubjectChange() {

    const subjectSelect =
        getElement(
            "oneVOneSubject"
        );

    const topicSelect =
        getElement(
            "oneVOneTopic"
        );

    const button =
        getElement(
            "findOpponentButton"
        );


    if (
        !subjectSelect ||
        !topicSelect
    ) {
        return;
    }


    subjectSelect.addEventListener(
        "change",
        function () {

            const subject =
                subjectSelect.value;


            topicSelect.innerHTML =
                "";


            if (!subject) {

                topicSelect.disabled =
                    true;

                topicSelect.innerHTML =
                    `<option value="">Choose a subject first</option>`;

                if (button) {
                    button.disabled =
                        true;
                }

                return;
            }


            const topics =
                getTopicsForSubject(
                    subject
                );


            topicSelect.disabled =
                false;


            topicSelect.innerHTML =
                `<option value="">Choose a topic</option>`;


            if (
                topics.length === 0
            ) {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    "general";

                option.textContent =
                    "General Topic";

                topicSelect.appendChild(
                    option
                );

            } else {

                topics.forEach(
                    topic => {

                        const option =
                            document.createElement(
                                "option"
                            );

                        option.value =
                            topic;

                        option.textContent =
                            topic;

                        topicSelect.appendChild(
                            option
                        );
                    }
                );
            }


            if (button) {

                button.disabled =
                    true;
            }
        }
    );


    topicSelect.addEventListener(
        "change",
        function () {

            if (button) {

                button.disabled =
                    !topicSelect.value;
            }
        }
    );
}


/* =========================================================
   OPEN 1v1 SETUP
========================================================= */

function startOneVOneMode() {

    const computerSetup =
        getElement(
            "battleSetup"
        );

    const oneVOneSetup =
        getElement(
            "oneVOneSetup"
        );

    const oneVOneArena =
        getElement(
            "oneVOneArena"
        );

    const results =
        getElement(
            "battleResults"
        );


    if (computerSetup) {
        computerSetup.hidden =
            true;
    }


    if (oneVOneArena) {
        oneVOneArena.hidden =
            true;
    }


    if (results) {
        results.hidden =
            true;
    }


    if (oneVOneSetup) {

        oneVOneSetup.hidden =
            false;

        oneVOneSetup.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }
}


/* =========================================================
   FIND 1v1 OPPONENT
========================================================= */

function findOneVOneOpponent() {

    const subjectSelect =
        getElement(
            "oneVOneSubject"
        );

    const topicSelect =
        getElement(
            "oneVOneTopic"
        );

    const status =
        getElement(
            "matchmakingStatus"
        );

    const title =
        getElement(
            "matchmakingTitle"
        );

    const message =
        getElement(
            "matchmakingMessage"
        );


    if (
        !subjectSelect ||
        !topicSelect ||
        !subjectSelect.value ||
        !topicSelect.value
    ) {

        alert(
            "Please choose a subject and topic first."
        );

        return;
    }


    /*
       DO NOT query game_match_players here.

       The current RLS policy on that table causes
       PostgreSQL infinite-recursion errors.
    */

    if (status) {

        status.hidden =
            false;
    }


    if (title) {

        title.textContent =
            "1v1 matchmaking is temporarily unavailable";
    }


    if (message) {

        message.textContent =
            "The live matchmaking database is being secured. Computer Battle is available now. Please use Computer Battle while the 1v1 database policy is fixed.";
    }


    console.warn(
        "1v1 matchmaking was not started because game_match_players currently has a recursive RLS policy."
    );
}


/* =========================================================
   CANCEL 1v1
========================================================= */

function cancelOneVOne() {

    clearInterval(
        oneVOneTimerInterval
    );


    oneVOneActive =
        false;


    const setup =
        getElement(
            "oneVOneSetup"
        );

    const status =
        getElement(
            "matchmakingStatus"
        );

    const arena =
        getElement(
            "oneVOneArena"
        );


    if (status) {

        status.hidden =
            true;
    }


    if (arena) {

        arena.hidden =
            true;
    }


    if (setup) {

        setup.hidden =
            false;
    }
}


/* =========================================================
   SHUFFLE
========================================================= */

function shuffleArray(
    array
) {

    const result =
        [...array];


    for (
        let i =
            result.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );


        [
            result[i],
            result[j]
        ] =
        [
            result[j],
            result[i]
        ];
    }


    return result;
}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.startComputerBattle =
    startComputerBattle;

window.beginBattle =
    beginBattle;

window.resetBattle =
    resetBattle;

window.openPremium =
    openPremium;

window.toggleGameTheme =
    toggleGameTheme;

window.openHome =
    openHome;

window.openNewStudyPlan =
    openNewStudyPlan;

window.openSummarizer =
    openSummarizer;

window.openStudyStreak =
    openStudyStreak;

window.openStudyScore =
    openStudyScore;

window.logoutStudyMind =
    logoutStudyMind;

window.startOneVOneMode =
    startOneVOneMode;

window.findOneVOneOpponent =
    findOneVOneOpponent;

window.cancelOneVOne =
    cancelOneVOne;

