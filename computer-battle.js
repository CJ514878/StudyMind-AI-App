/* =========================================================
   STUDYMIND AI — COMPUTER BATTLE
   10 QUESTIONS • 15 SECONDS PER QUESTION

   This file controls ONLY the Computer Battle page.
========================================================= */

const QUESTIONS_PER_BATTLE = 10;
const QUESTION_TIME_LIMIT = 15;

// Change this ONLY if your deployed API uses a different route.
const AI_QUESTION_ENDPOINT = "/api/generate-questions";

/* =========================================================
   SUPABASE
========================================================= */

const computerBattleSupabase =
    typeof supabase !== "undefined" ? supabase : null;

/* =========================================================
   BATTLE STATE
========================================================= */

const computerBattleState = {
    questions: [],
    currentQuestionIndex: 0,

    playerScore: 0,
    computerScore: 0,

    timeRemaining: QUESTION_TIME_LIMIT,
    timerInterval: null,

    questionLocked: false,
    battleActive: false,
    battleCompleted: false,

    selectedSubject: "",
    selectedTopic: ""
};

/* =========================================================
   ELEMENT HELPER
========================================================= */

function battleElement(id) {
    return document.getElementById(id);
}

/* =========================================================
   FALLBACK QUESTIONS
   Used if the AI server fails.
========================================================= */

const FALLBACK_QUESTIONS = [
    {
        question: "What is 12 × 5?",
        options: ["50", "55", "60", "65"],
        answer: 2
    },

    {
        question: "What is the square root of 81?",
        options: ["7", "8", "9", "10"],
        answer: 2
    },

    {
        question: "What is 3/4 expressed as a decimal?",
        options: ["0.25", "0.5", "0.75", "0.8"],
        answer: 2
    },

    {
        question: "What is 15 + 27?",
        options: ["32", "40", "42", "45"],
        answer: 2
    },

    {
        question: "What is 100 ÷ 4?",
        options: ["20", "25", "30", "40"],
        answer: 1
    },

    {
        question: "What is 7²?",
        options: ["14", "21", "42", "49"],
        answer: 3
    },

    {
        question: "What is the next number in 2, 4, 6, 8, ...?",
        options: ["9", "10", "11", "12"],
        answer: 1
    },

    {
        question: "What is 30% of 100?",
        options: ["3", "10", "30", "70"],
        answer: 2
    },

    {
        question: "If x + 6 = 14, what is x?",
        options: ["6", "7", "8", "9"],
        answer: 2
    },

    {
        question: "How many degrees are in a full circle?",
        options: ["90°", "180°", "270°", "360°"],
        answer: 3
    },

    {
        question: "What is 9 × 9?",
        options: ["72", "81", "90", "99"],
        answer: 1
    },

    {
        question: "What is half of 50?",
        options: ["15", "20", "25", "30"],
        answer: 2
    }
];

/* =========================================================
   GENERAL UTILITIES
========================================================= */

function normalizeBattleText(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function shuffleArray(array) {
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [result[i], result[j]] =
            [result[j], result[i]];
    }

    return result;
}

/* =========================================================
   STUDY PLAN
========================================================= */

function getStudyPlan() {
    const possibleKeys = [
        "studyMindPlan",
        "studyPlan",
        "currentStudyPlan"
    ];

    for (const key of possibleKeys) {
        const raw = localStorage.getItem(key);

        if (!raw) continue;

        try {
            const parsed = JSON.parse(raw);

            if (parsed) {
                return parsed;
            }
        } catch (error) {
            console.warn(
                `Could not parse ${key}:`,
                error
            );
        }
    }

    return null;
}

/* =========================================================
   EXTRACT SUBJECTS
========================================================= */

function extractSubjects(plan) {
    const subjects = [];

    function addSubject(value) {
        if (!value) return;

        const subject =
            String(value).trim();

        if (
            subject &&
            !subjects.includes(subject)
        ) {
            subjects.push(subject);
        }
    }

    function inspect(item) {
        if (!item) return;

        if (typeof item === "string") {
            addSubject(item);
            return;
        }

        if (typeof item !== "object") {
            return;
        }

        addSubject(
            item.subject ||
            item.subjectName
        );
    }

    if (Array.isArray(plan)) {
        plan.forEach(inspect);
    }

    if (
        plan &&
        typeof plan === "object"
    ) {
        const collections = [
            plan.subjects,
            plan.studySubjects,
            plan.schedule,
            plan.timetable
        ];

        collections.forEach(collection => {
            if (Array.isArray(collection)) {
                collection.forEach(inspect);
            }
        });
    }

    return subjects;
}

/* =========================================================
   EXTRACT TOPICS
========================================================= */

function extractTopics(plan, selectedSubject) {
    const topics = [];

    const target =
        normalizeBattleText(
            selectedSubject
        );

    function addTopic(value) {
        if (!value) return;

        const topic =
            String(value).trim();

        if (
            topic &&
            !topics.includes(topic)
        ) {
            topics.push(topic);
        }
    }

    function inspect(item) {
        if (
            !item ||
            typeof item !== "object"
        ) {
            return;
        }

        const itemSubject =
            normalizeBattleText(
                item.subject ||
                item.subjectName ||
                ""
            );

        if (
            target &&
            itemSubject &&
            itemSubject !== target
        ) {
            return;
        }

        if (Array.isArray(item.topics)) {
            item.topics.forEach(topic => {
                if (typeof topic === "string") {
                    addTopic(topic);
                } else if (
                    topic &&
                    typeof topic === "object"
                ) {
                    addTopic(
                        topic.topic ||
                        topic.name ||
                        topic.title
                    );
                }
            });
        }

        if (Array.isArray(item.topicList)) {
            item.topicList.forEach(topic => {
                if (typeof topic === "string") {
                    addTopic(topic);
                } else if (
                    topic &&
                    typeof topic === "object"
                ) {
                    addTopic(
                        topic.topic ||
                        topic.name ||
                        topic.title
                    );
                }
            });
        }

        addTopic(item.topic);
        addTopic(item.topicName);
    }

    if (Array.isArray(plan)) {
        plan.forEach(inspect);
    }

    if (
        plan &&
        typeof plan === "object"
    ) {
        [
            plan.subjects,
            plan.studySubjects,
            plan.schedule,
            plan.timetable,
            plan.topics
        ].forEach(collection => {
            if (Array.isArray(collection)) {
                collection.forEach(inspect);
            }
        });
    }

    return topics;
}

/* =========================================================
   LOAD SETUP
========================================================= */

function loadBattleSetup() {
    const subjectSelect =
        battleElement("subjectSelect");

    const topicSelect =
        battleElement("topicSelect");

    if (
        !subjectSelect ||
        !topicSelect
    ) {
        return;
    }

    let subjects =
        extractSubjects(
            getStudyPlan()
        );

    /*
       If the study plan doesn't contain
       subjects, keep Math as the default
       instead of leaving the selector empty.
    */

    if (!subjects.length) {
        subjects = ["Math"];
    }

    subjectSelect.innerHTML =
        subjects.map(subject => `
            <option value="${escapeHTML(subject)}">
                ${escapeHTML(subject)}
            </option>
        `).join("");

    subjectSelect.value =
        subjects[0];

    updateTopicOptions();
}

/* =========================================================
   UPDATE TOPICS WHEN SUBJECT CHANGES
========================================================= */

function updateTopicOptions() {
    const subjectSelect =
        battleElement("subjectSelect");

    const topicSelect =
        battleElement("topicSelect");

    if (
        !subjectSelect ||
        !topicSelect
    ) {
        return;
    }

    const subject =
        subjectSelect.value;

    let topics =
        extractTopics(
            getStudyPlan(),
            subject
        );

    /*
       If the current study plan doesn't
       contain topics, give Math sensible
       topic choices.
    */

    if (!topics.length) {
        const normalized =
            normalizeBattleText(
                subject
            );

        if (
            normalized.includes("math") ||
            normalized.includes("mathematics")
        ) {
            topics = [
                "Algebra",
                "Geometry",
                "Percentages"
            ];
        } else {
            topics = [
                "General Knowledge"
            ];
        }
    }

    topicSelect.innerHTML =
        topics.map(topic => `
            <option value="${escapeHTML(topic)}">
                ${escapeHTML(topic)}
            </option>
        `).join("");
}

/* =========================================================
   ERROR MESSAGE
========================================================= */

function showBattleError(message) {
    const element =
        battleElement("battleError");

    if (!element) return;

    element.textContent =
        message;

    element.classList.add("active");
}

function hideBattleError() {
    const element =
        battleElement("battleError");

    if (!element) return;

    element.textContent = "";

    element.classList.remove(
        "active"
    );
}

/* =========================================================
   LOADING SCREEN
========================================================= */

function showLoading() {
    const setup =
        battleElement("battleSetup");

    const loading =
        battleElement("battleLoading");

    if (setup) {
        setup.style.display =
            "none";
    }

    if (loading) {
        loading.classList.add(
            "active"
        );
    }
}

function hideLoading() {
    const loading =
        battleElement("battleLoading");

    if (loading) {
        loading.classList.remove(
            "active"
        );
    }
}

/* =========================================================
   START COMPUTER BATTLE
========================================================= */

async function startComputerBattle() {
    if (
        computerBattleState.battleActive
    ) {
        return;
    }

    hideBattleError();

    const subject =
        battleElement(
            "subjectSelect"
        )?.value?.trim();

    const topic =
        battleElement(
            "topicSelect"
        )?.value?.trim();

    const startButton =
        battleElement(
            "startBattleButton"
        );

    if (!subject) {
        showBattleError(
            "Please select a subject."
        );

        return;
    }

    if (!topic) {
        showBattleError(
            "Please select a topic."
        );

        return;
    }

    /*
       Use the hub's existing battle-count
       function when available.
    */

    if (
        typeof getBattleCount === "function" &&
        getBattleCount() >= 5
    ) {
        showBattleError(
            "You have used all 5 free battles. Upgrade to Premium to continue."
        );

        return;
    }

    if (startButton) {
        startButton.disabled = true;
        startButton.textContent =
            "Preparing Battle...";
    }

    computerBattleState.selectedSubject =
        subject;

    computerBattleState.selectedTopic =
        topic;

    showLoading();

    try {
        let questions = [];

        /*
           Try the AI first.
        */

        try {
            const aiResponse =
                await requestAIQuestions(
                    subject,
                    topic
                );

            questions =
                normalizeQuestions(
                    aiResponse
                );

        } catch (aiError) {
            console.warn(
                "AI question generation failed:",
                aiError
            );
        }

        /*
           If the AI doesn't return at least
           10 valid questions, use fallback
           questions so the battle can still run.
        */

        if (
            questions.length <
            QUESTIONS_PER_BATTLE
        ) {
            console.warn(
                "Using fallback battle questions."
            );

            questions =
                createFallbackQuestions();
        }

        computerBattleState.questions =
            shuffleArray(
                questions
            ).slice(
                0,
                QUESTIONS_PER_BATTLE
            );

        computerBattleState.currentQuestionIndex = 0;
        computerBattleState.playerScore = 0;
        computerBattleState.computerScore = 0;
        computerBattleState.timeRemaining =
            QUESTION_TIME_LIMIT;

        computerBattleState.questionLocked = false;
        computerBattleState.battleActive = true;
        computerBattleState.battleCompleted = false;

        hideLoading();

        showBattleScreen();

        updateScoreDisplay();

        displayCurrentQuestion();

    } catch (error) {
        console.error(
            "Could not start computer battle:",
            error
        );

        hideLoading();

        const setup =
            battleElement(
                "battleSetup"
            );

        if (setup) {
            setup.style.display =
                "block";
        }

        if (startButton) {
            startButton.disabled = false;
            startButton.textContent =
                "⚔️ Start Battle";
        }

        showBattleError(
            "We couldn't prepare the battle. Please try again."
        );
    }
}

/* =========================================================
   AI REQUEST
========================================================= */

async function requestAIQuestions(
    subject,
    topic
) {
    const response =
        await fetch(
            AI_QUESTION_ENDPOINT,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    subject,
                    topic,

                    numberOfQuestions:
                        QUESTIONS_PER_BATTLE,

                    difficulty:
                        "mixed",

                    format:
                        "multiple_choice",

                    includeAnswers:
                        true
                })
            }
        );

    if (!response.ok) {
        throw new Error(
            `AI server returned HTTP ${response.status}`
        );
    }

    const data =
        await response.json();

    /*
       Support several common API response shapes.
    */

    if (Array.isArray(data)) {
        return data;
    }

    if (
        data &&
        Array.isArray(
            data.questions
        )
    ) {
        return data.questions;
    }

    if (
        data &&
        data.data &&
        Array.isArray(
            data.data.questions
        )
    ) {
        return data.data.questions;
    }

    throw new Error(
        "AI server returned an invalid response."
    );
}

/* =========================================================
   NORMALIZE AI QUESTIONS
========================================================= */

function normalizeQuestions(
    questions
) {
    if (!Array.isArray(questions)) {
        return [];
    }

    return questions
        .map(item => {
            if (
                !item ||
                typeof item !== "object"
            ) {
                return null;
            }

            const question =
                item.question ||
                item.questionText ||
                item.text;

            let options =
                item.options ||
                item.choices ||
                item.answers;

            if (
                !question ||
                !Array.isArray(options)
            ) {
                return null;
            }

            options =
                options
                    .map(option => {
                        if (
                            option &&
                            typeof option === "object"
                        ) {
                            return String(
                                option.text ||
                                option.answer ||
                                option.value ||
                                ""
                            ).trim();
                        }

                        return String(
                            option
                        ).trim();
                    })
                    .filter(Boolean);

            /*
               Battle questions must have
               exactly four answer choices.
            */

            if (options.length !== 4) {
                return null;
            }

            let answer =
                item.answer ??
                item.correctAnswer ??
                item.correctOption ??
                item.correctIndex;

            /*
               Convert A/B/C/D into indexes.
            */

            if (
                typeof answer === "string"
            ) {
                const clean =
                    answer
                        .trim()
                        .toUpperCase();

                const letters = [
                    "A",
                    "B",
                    "C",
                    "D"
                ];

                if (
                    letters.includes(clean)
                ) {
                    answer =
                        letters.indexOf(
                            clean
                        );
                } else {
                    const matchingIndex =
                        options.findIndex(
                            option =>
                                normalizeBattleText(
                                    option
                                ) ===
                                normalizeBattleText(
                                    answer
                                )
                        );

                    if (
                        matchingIndex !== -1
                    ) {
                        answer =
                            matchingIndex;
                    }
                }
            }

            answer =
                Number(answer);

            if (
                !Number.isInteger(answer) ||
                answer < 0 ||
                answer > 3
            ) {
                return null;
            }

            return {
                question:
                    String(
                        question
                    ).trim(),

                options,

                answer
            };
        })
        .filter(Boolean);
}

/* =========================================================
   FALLBACK QUESTION GENERATOR
========================================================= */

function createFallbackQuestions() {
    const shuffled =
        shuffleArray(
            FALLBACK_QUESTIONS
        );

    const result = [];

    /*
       Guarantee exactly 10 questions.
    */

    while (
        result.length <
        QUESTIONS_PER_BATTLE
    ) {
        const source =
            shuffled[
                result.length %
                shuffled.length
            ];

        result.push({
            question:
                source.question,

            options:
                [...source.options],

            answer:
                source.answer
        });
    }

    return result;
}

/* =========================================================
   SHOW BATTLE SCREEN
========================================================= */

function showBattleScreen() {
    const setup =
        battleElement(
            "battleSetup"
        );

    const loading =
        battleElement(
            "battleLoading"
        );

    const screen =
        battleElement(
            "battleScreen"
        );

    const results =
        battleElement(
            "battleResults"
        );

    if (setup) {
        setup.style.display =
            "none";
    }

    if (loading) {
        loading.classList.remove(
            "active"
        );
    }

    if (results) {
        results.classList.remove(
            "active"
        );
    }

    if (screen) {
        screen.classList.add(
            "active"
        );
    }
}

/* =========================================================
   DISPLAY CURRENT QUESTION
========================================================= */

function displayCurrentQuestion() {
    clearTimer();

    computerBattleState.questionLocked =
        false;

    const index =
        computerBattleState.currentQuestionIndex;

    const question =
        computerBattleState.questions[
            index
        ];

    if (!question) {
        finishComputerBattle();
        return;
    }

    const roundNumber =
        battleElement(
            "roundNumber"
        );

    const questionTopic =
        battleElement(
            "questionTopic"
        );

    const questionText =
        battleElement(
            "questionText"
        );

    const answerGrid =
        battleElement(
            "answerGrid"
        );

    const feedback =
        battleElement(
            "battleFeedback"
        );

    const progress =
        battleElement(
            "battleProgressBar"
        );

    if (roundNumber) {
        roundNumber.textContent =
            `Question ${index + 1} of ${QUESTIONS_PER_BATTLE}`;
    }

    if (questionTopic) {
        questionTopic.textContent =
            `${computerBattleState.selectedSubject} • ${computerBattleState.selectedTopic}`;
    }

    if (questionText) {
        questionText.textContent =
            question.question;
    }

    if (feedback) {
        feedback.textContent = "";
    }

    if (progress) {
        progress.style.width =
            `${(index / QUESTIONS_PER_BATTLE) * 100}%`;
    }

    if (answerGrid) {
        answerGrid.innerHTML = "";

        const letters = [
            "A",
            "B",
            "C",
            "D"
        ];

        letters.forEach(
            (letter, optionIndex) => {
                const button =
                    document.createElement(
                        "button"
                    );

                button.type =
                    "button";

                button.className =
                    "answer-button";

                button.dataset.index =
                    String(optionIndex);

                button.innerHTML = `
                    <span class="answer-letter">
                        ${letter}
                    </span>
                    ${escapeHTML(
                        question.options[
                            optionIndex
                        ]
                    )}
                `;

                button.addEventListener(
                    "click",
                    () =>
                        submitAnswer(
                            optionIndex
                        )
                );

                answerGrid.appendChild(
                    button
                );
            }
        );
    }

    computerBattleState.timeRemaining =
        QUESTION_TIME_LIMIT;

    updateTimerDisplay();

    startTimer();
}

/* =========================================================
   TIMER
========================================================= */

function startTimer() {
    clearTimer();

    computerBattleState.timerInterval =
        setInterval(() => {
            computerBattleState.timeRemaining--;

            updateTimerDisplay();

            if (
                computerBattleState.timeRemaining <= 0
            ) {
                clearTimer();

                handleTimeout();
            }
        }, 1000);
}

function clearTimer() {
    if (
        computerBattleState.timerInterval
    ) {
        clearInterval(
            computerBattleState.timerInterval
        );

        computerBattleState.timerInterval =
            null;
    }
}

function updateTimerDisplay() {
    const number =
        battleElement(
            "timerNumber"
        );

    const container =
        battleElement(
            "timerContainer"
        );

    if (number) {
        number.textContent =
            Math.max(
                0,
                computerBattleState.timeRemaining
            );
    }

    if (container) {
        container.classList.toggle(
            "warning",
            computerBattleState.timeRemaining <= 7
        );

        container.classList.toggle(
            "danger",
            computerBattleState.timeRemaining <= 3
        );
    }
}

/* =========================================================
   SUBMIT ANSWER
========================================================= */

function submitAnswer(
    selectedIndex
) {
    if (
        !computerBattleState.battleActive ||
        computerBattleState.questionLocked
    ) {
        return;
    }

    computerBattleState.questionLocked =
        true;

    clearTimer();

    const question =
        computerBattleState.questions[
            computerBattleState.currentQuestionIndex
        ];

    if (!question) return;

    const correct =
        selectedIndex ===
        question.answer;

    if (correct) {
        computerBattleState.playerScore++;
    }

    markAnswers(
        selectedIndex,
        question.answer
    );

    showAnswerFeedback(
        correct
            ? "✓ Correct!"
            : "✗ Incorrect"
    );

    updateScoreDisplay();

    setTimeout(() => {
        if (
            computerBattleState.battleActive
        ) {
            computerTakeTurn(
                correct
            );
        }
    }, 700);
}

/* =========================================================
   TIMEOUT
========================================================= */

function handleTimeout() {
    if (
        !computerBattleState.battleActive ||
        computerBattleState.questionLocked
    ) {
        return;
    }

    computerBattleState.questionLocked =
        true;

    const question =
        computerBattleState.questions[
            computerBattleState.currentQuestionIndex
        ];

    if (!question) return;

    markAnswers(
        -1,
        question.answer
    );

    showAnswerFeedback(
        "⏱ Time's up!"
    );

    setTimeout(() => {
        if (
            computerBattleState.battleActive
        ) {
            computerTakeTurn(
                false
            );
        }
    }, 700);
}

/* =========================================================
   MARK ANSWERS
========================================================= */

function markAnswers(
    selectedIndex,
    correctIndex
) {
    document
        .querySelectorAll(
            ".answer-button"
        )
        .forEach(
            (button, index) => {
                button.disabled =
                    true;

                if (
                    index ===
                    correctIndex
                ) {
                    button.classList.add(
                        "correct"
                    );
                }

                if (
                    index ===
                        selectedIndex &&
                    selectedIndex !==
                        correctIndex
                ) {
                    button.classList.add(
                        "incorrect"
                    );
                }
            }
        );
}

function showAnswerFeedback(
    message
) {
    const feedback =
        battleElement(
            "battleFeedback"
        );

    if (feedback) {
        feedback.textContent =
            message;
    }
}

/* =========================================================
   COMPUTER TURN
========================================================= */

function computerTakeTurn(
    playerWasCorrect
) {
    if (
        !computerBattleState.battleActive
    ) {
        return;
    }

    /*
       The computer is deliberately imperfect.
       This keeps the battle competitive.
    */

    const correctChance =
        playerWasCorrect
            ? 0.62
            : 0.58;

    if (
        Math.random() <
        correctChance
    ) {
        computerBattleState.computerScore++;
    }

    updateScoreDisplay();

    setTimeout(() => {
        if (
            computerBattleState.battleActive
        ) {
            moveToNextQuestion();
        }
    }, 450);
}

/* =========================================================
   NEXT QUESTION
========================================================= */

function moveToNextQuestion() {
    if (
        !computerBattleState.battleActive
    ) {
        return;
    }

    computerBattleState.currentQuestionIndex++;

    if (
        computerBattleState.currentQuestionIndex >=
        QUESTIONS_PER_BATTLE
    ) {
        finishComputerBattle();

        return;
    }

    displayCurrentQuestion();
}

/* =========================================================
   SCORE DISPLAY
========================================================= */

function updateScoreDisplay() {
    const player =
        battleElement(
            "playerScore"
        );

    const computer =
        battleElement(
            "computerScore"
        );

    if (player) {
        player.textContent =
            computerBattleState.playerScore;
    }

    if (computer) {
        computer.textContent =
            computerBattleState.computerScore;
    }
}

/* =========================================================
   BATTLE POINTS
========================================================= */

function calculateBattlePoints(
    result,
    playerScore
) {
    let points = 0;

    if (result === "win") {
        points = 100;
    } else if (result === "draw") {
        points = 50;
    } else {
        points = 20;
    }

    /*
       +5 points for every correct answer.
    */

    points +=
        (Number(playerScore) || 0) * 5;

    return points;
}

/* =========================================================
   FINISH BATTLE
========================================================= */

async function finishComputerBattle() {
    if (
        computerBattleState.battleCompleted
    ) {
        return;
    }

    computerBattleState.battleCompleted =
        true;

    computerBattleState.battleActive =
        false;

    clearTimer();

    const playerScore =
        computerBattleState.playerScore;

    const computerScore =
        computerBattleState.computerScore;

    let result;

    if (
        playerScore >
        computerScore
    ) {
        result = "win";
    } else if (
        playerScore <
        computerScore
    ) {
        result = "loss";
    } else {
        result = "draw";
    }

    const points =
        calculateBattlePoints(
            result,
            playerScore
        );

    /*
       Record the completed battle
       before displaying the results.
    */

    await recordCompletedBattle(
        result,
        points
    );

    showResults(
        result,
        points
    );
}

/* =========================================================
   RECORD BATTLE
========================================================= */

async function recordCompletedBattle(
    result,
    points
) {
    /*
       Update the local five-battle counter.
    */

    try {
        if (
            typeof registerFreeBattle ===
            "function"
        ) {
            registerFreeBattle();
        }
    } catch (error) {
        console.warn(
            "Could not update battle count:",
            error
        );
    }

    /*
       Update Supabase leaderboard.
    */

    if (!computerBattleSupabase) {
        return;
    }

    try {
        const {
            data: { user },
            error: userError
        } =
            await computerBattleSupabase
                .auth
                .getUser();

        if (
            userError ||
            !user
        ) {
            return;
        }

        const {
            data: existing,
            error: existingError
        } =
            await computerBattleSupabase
                .from(
                    "game_leaderboard"
                )
                .select(`
                    user_id,
                    display_name,
                    battle_points,
                    wins,
                    losses,
                    draws,
                    battles_played
                `)
                .eq(
                    "user_id",
                    user.id
                )
                .maybeSingle();

        if (existingError) {
            console.warn(
                "Could not read leaderboard row:",
                existingError
            );

            return;
        }

        const displayName =
            existing?.display_name ||
            user.user_metadata?.display_name ||
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "StudyMind Player";

        const currentPoints =
            Number(
                existing?.battle_points
            ) || 0;

        const wins =
            Number(
                existing?.wins
            ) || 0;

        const losses =
            Number(
                existing?.losses
            ) || 0;

        const draws =
            Number(
                existing?.draws
            ) || 0;

        const battlesPlayed =
            Number(
                existing?.battles_played
            ) || 0;

        const update = {
            user_id: user.id,

            display_name:
                displayName,

            battle_points:
                currentPoints +
                points,

            wins:
                wins +
                (
                    result === "win"
                        ? 1
                        : 0
                ),

            losses:
                losses +
                (
                    result === "loss"
                        ? 1
                        : 0
                ),

            draws:
                draws +
                (
                    result === "draw"
                        ? 1
                        : 0
                ),

            battles_played:
                battlesPlayed + 1,

            updated_at:
                new Date().toISOString()
        };

        const {
            error: upsertError
        } =
            await computerBattleSupabase
                .from(
                    "game_leaderboard"
                )
                .upsert(
                    update,
                    {
                        onConflict:
                            "user_id"
                    }
                );

        if (upsertError) {
            console.warn(
                "Could not update leaderboard:",
                upsertError
            );
        }

    } catch (error) {
        console.warn(
            "Leaderboard update failed:",
            error
        );
    }
}

/* =========================================================
   RESULTS SCREEN
========================================================= */

function showResults(
    result,
    points
) {
    const battleScreen =
        battleElement(
            "battleScreen"
        );

    const results =
        battleElement(
            "battleResults"
        );

    if (battleScreen) {
        battleScreen.classList.remove(
            "active"
        );
    }

    if (results) {
        results.classList.add(
            "active"
        );
    }

    const icon =
        battleElement(
            "resultIcon"
        );

    const title =
        battleElement(
            "resultTitle"
        );

    const summary =
        battleElement(
            "resultSummary"
        );

    const playerScore =
        battleElement(
            "finalPlayerScore"
        );

    const computerScore =
        battleElement(
            "finalComputerScore"
        );

    const pointsElement =
        battleElement(
            "battlePointsEarned"
        );

    const message =
        battleElement(
            "battleResultMessage"
        );

    if (playerScore) {
        playerScore.textContent =
            computerBattleState.playerScore;
    }

    if (computerScore) {
        computerScore.textContent =
            computerBattleState.computerScore;
    }

    if (pointsElement) {
        pointsElement.textContent =
            `+${points}`;
    }

    if (result === "win") {
        if (icon) {
            icon.textContent =
                "🏆";
        }

        if (title) {
            title.textContent =
                "Victory!";
        }

        if (summary) {
            summary.textContent =
                "You defeated the computer.";
        }

        if (message) {
            message.textContent =
                `You scored ${computerBattleState.playerScore}/10 and earned ${points} Battle Points.`;
        }

    } else if (result === "draw") {
        if (icon) {
            icon.textContent =
                "🤝";
        }

        if (title) {
            title.textContent =
                "It's a Draw!";
        }

        if (summary) {
            summary.textContent =
                "You and the computer finished level.";
        }

        if (message) {
            message.textContent =
                `You both scored ${computerBattleState.playerScore}. Keep practising and try again.`;
        }

    } else {
        if (icon) {
            icon.textContent =
                "⚔️";
        }

        if (title) {
            title.textContent =
                "Good Battle!";
        }

        if (summary) {
            summary.textContent =
                "The computer won this round.";
        }

        if (message) {
            message.textContent =
                `You scored ${computerBattleState.playerScore}/10 and earned ${points} Battle Points.`;
        }
    }
}

/* =========================================================
   PLAY AGAIN
========================================================= */

function playAgain() {
    /*
       If all free battles are used,
       return to the hub so the user can
       see the Premium option.
    */

    if (
        typeof getBattleCount ===
            "function" &&
        getBattleCount() >= 5
    ) {
        window.location.href =
            "game-mode.html";

        return;
    }

    clearTimer();

    computerBattleState.questions = [];

    computerBattleState.currentQuestionIndex =
        0;

    computerBattleState.playerScore =
        0;

    computerBattleState.computerScore =
        0;

    computerBattleState.battleActive =
        false;

    computerBattleState.battleCompleted =
        false;

    const results =
        battleElement(
            "battleResults"
        );

    const screen =
        battleElement(
            "battleScreen"
        );

    const setup =
        battleElement(
            "battleSetup"
        );

    const startButton =
        battleElement(
            "startBattleButton"
        );

    if (results) {
        results.classList.remove(
            "active"
        );
    }

    if (screen) {
        screen.classList.remove(
            "active"
        );
    }

    if (setup) {
        setup.style.display =
            "block";
    }

    if (startButton) {
        startButton.disabled =
            false;

        startButton.textContent =
            "⚔️ Start Battle";
    }

    updateScoreDisplay();

    hideBattleError();
}

/* =========================================================
   RETURN TO GAME MODE
========================================================= */

function returnToGameMode() {
    clearTimer();

    computerBattleState.battleActive =
        false;

    window.location.href =
        "game-mode.html";
}

/* =========================================================
   AUTHENTICATION
========================================================= */

async function verifyComputerBattleUser() {
    /*
       If Supabase isn't loaded, don't
       block the page from working locally.
    */

    if (!computerBattleSupabase) {
        return true;
    }

    try {
        const {
            data: { user },
            error
        } =
            await computerBattleSupabase
                .auth
                .getUser();

        if (error) {
            console.error(
                "Authentication check failed:",
                error
            );

            return false;
        }

        if (!user) {
            window.location.href =
                "login.html";

            return false;
        }

        return true;

    } catch (error) {
        console.error(
            "Unexpected authentication error:",
            error
        );

        return false;
    }
}

/* =========================================================
   INITIALIZATION
========================================================= */

async function initializeComputerBattle() {
    const authenticated =
        await verifyComputerBattleUser();

    if (!authenticated) {
        return;
    }

    loadBattleSetup();

    const subjectSelect =
        battleElement(
            "subjectSelect"
        );

    if (subjectSelect) {
        subjectSelect.addEventListener(
            "change",
            updateTopicOptions
        );
    }

    updateScoreDisplay();
}

/* =========================================================
   CLEANUP
========================================================= */

window.addEventListener(
    "beforeunload",
    clearTimer
);

/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.startComputerBattle =
    startComputerBattle;

window.playAgain =
    playAgain;

window.returnToGameMode =
    returnToGameMode;

window.updateTopicOptions =
    updateTopicOptions;

/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeComputerBattle
);
