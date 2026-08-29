/* =========================================================
   STUDYMIND AI — GAME MODE
   Battle System
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
   STATE
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


/* =========================================================
   DOM HELPERS
========================================================= */

function getElement(id) {
    return document.getElementById(id);
}


/* =========================================================
   STORAGE
========================================================= */

function getBattleCount() {
    return parseInt(
        localStorage.getItem(STORAGE_KEYS.battleCount) || "0",
        10
    );
}


function setBattleCount(count) {
    localStorage.setItem(
        STORAGE_KEYS.battleCount,
        String(count)
    );
}


function getBattlePoints() {
    return parseInt(
        localStorage.getItem(STORAGE_KEYS.battlePoints) || "0",
        10
    );
}


function setBattlePoints(points) {
    localStorage.setItem(
        STORAGE_KEYS.battlePoints,
        String(points)
    );
}


function isPremiumUser() {
    const premiumValue =
        localStorage.getItem(STORAGE_KEYS.premium);

    return (
        premiumValue === "true" ||
        premiumValue === "1"
    );
}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeGameMode();

});


function initializeGameMode() {

    battlePoints = getBattlePoints();

    loadTheme();

    updateBattleStatus();

    updateLeaderboard();

    loadTopics();

    setupNavigationFallbacks();

}


/* =========================================================
   BATTLE STATUS
========================================================= */

function updateBattleStatus() {

    const used = getBattleCount();

    const battlesUsed = getElement("battlesUsed");
    const battleLimit = getElement("battleLimit");
    const battleStatusText = getElement("battleStatusText");
    const computerModeButton = getElement("computerModeButton");
    const startBattleButton = getElement("startBattleButton");
    const premiumCard = getElement("premiumBattleCard");

    if (battlesUsed) {
        battlesUsed.textContent = used;
    }

    if (battleLimit) {
        battleLimit.textContent = FREE_BATTLE_LIMIT;
    }

    if (isPremiumUser()) {

        if (battleStatusText) {
            battleStatusText.textContent =
                "Unlimited battles available";
            battleStatusText.style.color =
                "#22c55e";
        }

        if (premiumCard) {
            premiumCard.style.display = "none";
        }

        if (computerModeButton) {
            computerModeButton.disabled = false;
        }

        if (startBattleButton) {
            startBattleButton.disabled = false;
            startBattleButton.textContent =
                "⚔️ Start Battle";
        }

        return;
    }

    const remaining =
        Math.max(0, FREE_BATTLE_LIMIT - used);

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
            computerModeButton.disabled = true;
            computerModeButton.style.opacity = "0.5";
        }

        if (startBattleButton) {
            startBattleButton.disabled = true;
            startBattleButton.textContent =
                "🔒 Free Battles Used";
        }

        if (premiumCard) {
            premiumCard.style.display = "grid";
        }

    }
}


/* =========================================================
   TOPIC LOADING
========================================================= */

function loadTopics() {

    const topicSelect =
        getElement("battleTopic");

    if (!topicSelect) {
        return;
    }

    topicSelect.innerHTML = "";

    const defaultOption =
        document.createElement("option");

    defaultOption.value = "";

    defaultOption.textContent =
        "Choose a topic";

    topicSelect.appendChild(defaultOption);


    const topics = getTopicsFromStudyPlan();


    if (topics.length === 0) {

        const option =
            document.createElement("option");

        option.value = "general";

        option.textContent =
            "General Knowledge";

        topicSelect.appendChild(option);

        return;
    }


    topics.forEach((topic, index) => {

        const option =
            document.createElement("option");

        option.value =
            topic.id || `topic-${index}`;

        option.textContent =
            topic.name;

        topicSelect.appendChild(option);

    });

}


/* =========================================================
   GET TOPICS FROM STUDY PLAN
========================================================= */

function getTopicsFromStudyPlan() {

    const topics = [];

    const possibleKeys = [
        STORAGE_KEYS.plan,
        "studyMindStudyPlan",
        "studyPlan",
        "studyMindCurrentPlan"
    ];


    let plan = null;


    for (const key of possibleKeys) {

        const raw =
            localStorage.getItem(key);

        if (!raw) {
            continue;
        }

        try {

            const parsed =
                JSON.parse(raw);

            if (parsed) {
                plan = parsed;
                break;
            }

        } catch (error) {
            console.warn(
                `Could not parse ${key}`,
                error
            );
        }

    }


    if (!plan) {
        return topics;
    }


    collectTopics(plan, topics);


    return removeDuplicateTopics(topics);

}


/* =========================================================
   COLLECT TOPICS
========================================================= */

function collectTopics(data, topics) {

    if (!data) {
        return;
    }


    if (Array.isArray(data)) {

        data.forEach(item => {

            if (
                item &&
                typeof item === "object"
            ) {
                collectTopics(item, topics);
            }

        });

        return;
    }


    if (
        typeof data !== "object"
    ) {
        return;
    }


    const possibleTopicNames = [
        "topic",
        "topicName",
        "title",
        "name"
    ];


    for (const property of possibleTopicNames) {

        if (
            typeof data[property] === "string" &&
            data[property].trim()
        ) {

            const value =
                data[property].trim();

            if (
                value.toLowerCase() !==
                "untitled topic"
            ) {

                topics.push({
                    id: value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-"),

                    name: value
                });

            }

            break;
        }

    }


    Object.keys(data).forEach(key => {

        const value = data[key];


        if (
            value &&
            typeof value === "object"
        ) {

            if (
                ![
                    "profile",
                    "settings",
                    "user",
                    "metadata"
                ].includes(key)
            ) {

                collectTopics(
                    value,
                    topics
                );

            }

        }

    });

}


/* =========================================================
   REMOVE DUPLICATE TOPICS
========================================================= */

function removeDuplicateTopics(topics) {

    const seen = new Set();

    return topics.filter(topic => {

        const normalized =
            topic.name
                .trim()
                .toLowerCase();

        if (seen.has(normalized)) {
            return false;
        }

        seen.add(normalized);

        return true;

    });

}


/* =========================================================
   START COMPUTER BATTLE BUTTON
========================================================= */

function startComputerBattle() {

    const setup =
        getElement("battleSetup");

    if (setup) {

        setup.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }

}


/* =========================================================
   BEGIN BATTLE
========================================================= */

function beginBattle() {

    if (!isPremiumUser()) {

        const used =
            getBattleCount();

        if (used >= FREE_BATTLE_LIMIT) {

            showPremiumMessage();

            return;
        }

    }


    const topicSelect =
        getElement("battleTopic");

    const difficultySelect =
        getElement("battleDifficulty");


    const selectedTopic =
        topicSelect
            ? topicSelect.value
            : "";


    const selectedTopicName =
        topicSelect &&
        topicSelect.selectedIndex >= 0
            ? topicSelect.options[
                topicSelect.selectedIndex
            ].textContent
            : "General Knowledge";


    const difficulty =
        difficultySelect
            ? difficultySelect.value
            : "mixed";


    if (!selectedTopic) {

        alert(
            "Please choose a topic before starting your battle."
        );

        return;
    }


    battleQuestions =
        generateBattleQuestions(
            selectedTopicName,
            difficulty
        );


    if (
        !Array.isArray(battleQuestions) ||
        battleQuestions.length === 0
    ) {

        alert(
            "We couldn't create the battle questions. Please try again."
        );

        return;
    }


    currentQuestionIndex = 0;

    playerScore = 0;

    computerScore = 0;

    battleActive = true;

    answeringLocked = false;


    if (!isPremiumUser()) {

        setBattleCount(
            getBattleCount() + 1
        );

    }


    updateBattleStatus();


    const setup =
        getElement("battleSetup");

    const arena =
        getElement("battleArena");

    const results =
        getElement("battleResults");


    if (setup) {
        setup.hidden = true;
    }

    if (results) {
        results.hidden = true;
    }

    if (arena) {
        arena.hidden = false;
    }


    updateScores();

    showQuestion();

    if (arena) {

        arena.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }

}


/* =========================================================
   QUESTION GENERATION
========================================================= */

function generateBattleQuestions(
    topic,
    difficulty
) {

    const questions = getStoredQuestions(topic);


    if (questions.length >= QUESTIONS_PER_BATTLE) {

        return prepareQuestions(
            questions,
            difficulty
        ).slice(
            0,
            QUESTIONS_PER_BATTLE
        );

    }


    return createFallbackQuestions(
        topic,
        difficulty
    );

}


/* =========================================================
   GET STORED QUESTIONS
========================================================= */

function getStoredQuestions(topic) {

    const questions = [];


    const possibleKeys = [
        "studyMindTopicQuestions",
        "studyMindQuestions",
        "studyMindPracticeQuestions",
        "topicQuestions"
    ];


    possibleKeys.forEach(key => {

        const raw =
            localStorage.getItem(key);

        if (!raw) {
            return;
        }


        try {

            const parsed =
                JSON.parse(raw);

            collectQuestions(
                parsed,
                topic,
                questions
            );

        } catch (error) {

            console.warn(
                `Unable to read ${key}`,
                error
            );

        }

    });


    return questions;

}


/* =========================================================
   COLLECT QUESTIONS
========================================================= */

function collectQuestions(
    data,
    selectedTopic,
    questions
) {

    if (!data) {
        return;
    }


    if (Array.isArray(data)) {

        data.forEach(item => {

            collectQuestions(
                item,
                selectedTopic,
                questions
            );

        });

        return;
    }


    if (
        typeof data !== "object"
    ) {
        return;
    }


    const questionText =
        data.question ||
        data.text ||
        data.prompt;


    const answers =
        data.options ||
        data.answers ||
        data.choices;


    const correctAnswer =
        data.correctAnswer ??
        data.correct ??
        data.answer;


    if (
        typeof questionText === "string" &&
        Array.isArray(answers) &&
        answers.length >= 2 &&
        correctAnswer !== undefined
    ) {

        const normalizedTopic =
            String(
                data.topic ||
                data.topicName ||
                ""
            ).trim().toLowerCase();


        const wantedTopic =
            String(selectedTopic)
                .trim()
                .toLowerCase();


        if (
            !normalizedTopic ||
            normalizedTopic === wantedTopic
        ) {

            questions.push({
                question: questionText,
                options: answers.slice(0, 4),
                correctAnswer: normalizeCorrectAnswer(
                    correctAnswer,
                    answers
                ),
                topic: data.topic ||
                    selectedTopic,
                difficulty:
                    data.difficulty ||
                    "mixed"
            });

        }

    }


    Object.keys(data).forEach(key => {

        if (
            data[key] &&
            typeof data[key] === "object"
        ) {

            collectQuestions(
                data[key],
                selectedTopic,
                questions
            );

        }

    });

}


/* =========================================================
   NORMALIZE ANSWER
========================================================= */

function normalizeCorrectAnswer(
    correctAnswer,
    answers
) {

    if (
        typeof correctAnswer === "number"
    ) {

        return correctAnswer;

    }


    const text =
        String(correctAnswer)
            .trim()
            .toLowerCase();


    const index =
        answers.findIndex(
            answer =>
                String(answer)
                    .trim()
                    .toLowerCase() === text
        );


    if (index !== -1) {
        return index;
    }


    const letterIndex =
        ["a", "b", "c", "d"]
            .indexOf(text);


    if (letterIndex !== -1) {
        return letterIndex;
    }


    return 0;

}


/* =========================================================
   PREPARE QUESTIONS
========================================================= */

function prepareQuestions(
    questions,
    difficulty
) {

    let result =
        [...questions];


    if (
        difficulty &&
        difficulty !== "mixed"
    ) {

        const filtered =
            result.filter(
                question =>
                    String(
                        question.difficulty ||
                        ""
                    ).toLowerCase() ===
                    difficulty.toLowerCase()
            );


        if (
            filtered.length >=
            QUESTIONS_PER_BATTLE
        ) {

            result = filtered;

        }

    }


    return shuffleArray(result);

}


/* =========================================================
   FALLBACK QUESTIONS
========================================================= */

function createFallbackQuestions(
    topic,
    difficulty
) {

    /*
       These are placeholder questions.

       Once your AI question-generation system is
       connected, this function can be replaced with
       questions generated from the student's actual
       topic and syllabus.
    */

    const questionBank = [

        {
            question:
                `Which statement best describes the main idea of ${topic}?`,

            options: [
                `It explains an important concept within ${topic}.`,
                `It is completely unrelated to ${topic}.`,
                `It only applies outside ${topic}.`,
                `It has no connection to learning.`
            ],

            correctAnswer: 0
        },

        {
            question:
                `Why is understanding ${topic} useful when studying?`,

            options: [
                "It helps connect ideas and apply knowledge.",
                "It prevents you from learning anything.",
                "It removes the need for revision.",
                "It makes every answer automatically correct."
            ],

            correctAnswer: 0
        },

        {
            question:
                `What is a good way to study ${topic}?`,

            options: [
                "Understand the concepts and practise questions.",
                "Never review the material.",
                "Memorize random information without understanding it.",
                "Avoid testing yourself."
            ],

            correctAnswer: 0
        },

        {
            question:
                `Which approach is most useful when learning ${topic}?`,

            options: [
                "Active recall and practice.",
                "Ignoring difficult sections.",
                "Only reading the title.",
                "Studying without checking understanding."
            ],

            correctAnswer: 0
        },

        {
            question:
                `What should you do if part of ${topic} is difficult?`,

            options: [
                "Break it into smaller ideas and practise.",
                "Give up immediately.",
                "Skip the entire subject.",
                "Avoid asking questions."
            ],

            correctAnswer: 0
        },

        {
            question:
                `Which skill can help you perform better in ${topic}?`,

            options: [
                "Critical thinking.",
                "Guessing every answer.",
                "Avoiding revision.",
                "Ignoring feedback."
            ],

            correctAnswer: 0
        },

        {
            question:
                `What is active recall in the context of ${topic}?`,

            options: [
                "Trying to remember information without looking at the answer.",
                "Reading the same sentence repeatedly.",
                "Copying every page.",
                "Avoiding practice questions."
            ],

            correctAnswer: 0
        },

        {
            question:
                `Why is practice important for ${topic}?`,

            options: [
                "It helps you identify and correct gaps in understanding.",
                "It guarantees that you never make mistakes.",
                "It replaces all learning.",
                "It makes revision unnecessary."
            ],

            correctAnswer: 0
        },

        {
            question:
                `Which action is most likely to improve your understanding of ${topic}?`,

            options: [
                "Explaining the concept in your own words.",
                "Skipping difficult examples.",
                "Only memorizing headings.",
                "Avoiding questions."
            ],

            correctAnswer: 0
        },

        {
            question:
                `What should you do after completing a practice question about ${topic}?`,

            options: [
                "Review the answer and understand any mistake.",
                "Ignore the result.",
                "Delete the question.",
                "Stop studying immediately."
            ],

            correctAnswer: 0
        }

    ];


    return shuffleArray(
        questionBank.map(question => ({
            ...question,
            topic,
            difficulty
        }))
    );

}


/* =========================================================
   SHOW QUESTION
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


    answeringLocked = false;


    const questionNumber =
        getElement("currentQuestionNumber");

    const questionText =
        getElement("battleQuestion");

    const questionTopic =
        getElement("battleQuestionTopic");

    const answerGrid =
        getElement("answerGrid");


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
            question.topic || "Study Topic";

    }


    if (!answerGrid) {
        return;
    }


    answerGrid.innerHTML = "";


    question.options.forEach(
        (answer, index) => {

            const button =
                document.createElement("button");

            button.type = "button";

            button.className =
                "answer-button";

            button.textContent =
                `${String.fromCharCode(65 + index)}. ${answer}`;

            button.addEventListener(
                "click",
                () => handleAnswer(index)
            );

            answerGrid.appendChild(button);

        }
    );


    startQuestionTimer();

}


/* =========================================================
   QUESTION TIMER
========================================================= */

function startQuestionTimer() {

    clearInterval(
        battleTimerInterval
    );


    battleTimer =
        QUESTION_TIME_LIMIT;


    updateTimerDisplay();


    battleTimerInterval =
        setInterval(() => {

            battleTimer--;

            updateTimerDisplay();


            if (battleTimer <= 0) {

                clearInterval(
                    battleTimerInterval
                );

                handleAnswer(null);

            }

        }, 1000);

}


/* =========================================================
   TIMER DISPLAY
========================================================= */

function updateTimerDisplay() {

    const timer =
        getElement("battleTimer");

    if (timer) {

        timer.textContent =
            Math.max(0, battleTimer);

    }

}


/* =========================================================
   HANDLE ANSWER
========================================================= */

function handleAnswer(selectedIndex) {

    if (
        answeringLocked ||
        !battleActive
    ) {
        return;
    }


    answeringLocked = true;


    clearInterval(
        battleTimerInterval
    );


    const question =
        battleQuestions[
            currentQuestionIndex
        ];


    const buttons =
        document.querySelectorAll(
            "#answerGrid .answer-button"
        );


    buttons.forEach(button => {
        button.disabled = true;
    });


    const correctIndex =
        Number(question.correctAnswer);


    if (
        selectedIndex !== null &&
        selectedIndex === correctIndex
    ) {

        playerScore++;

        if (buttons[selectedIndex]) {
            buttons[selectedIndex]
                .classList.add("correct");
        }

    } else {

        if (
            selectedIndex !== null &&
            buttons[selectedIndex]
        ) {

            buttons[selectedIndex]
                .classList.add("incorrect");

        }


        if (buttons[correctIndex]) {

            buttons[correctIndex]
                .classList.add("correct");

        }

    }


    computerTakeTurn();


    updateScores();


    setTimeout(() => {

        currentQuestionIndex++;

        showQuestion();

    }, 850);

}


/* =========================================================
   COMPUTER TURN
========================================================= */

function computerTakeTurn() {

    /*
       The computer has a simulated chance of answering
       each question correctly. This keeps the solo mode
       competitive without making it unfair.
    */

    const random =
        Math.random();

    let chance = 0.55;


    const difficultySelect =
        getElement("battleDifficulty");


    if (
        difficultySelect &&
        difficultySelect.value === "easy"
    ) {

        chance = 0.45;

    } else if (
        difficultySelect &&
        difficultySelect.value === "hard"
    ) {

        chance = 0.70;

    }


    if (random < chance) {
        computerScore++;
    }

}


/* =========================================================
   UPDATE SCORES
========================================================= */

function updateScores() {

    const player =
        getElement("playerScore");

    const computer =
        getElement("computerScore");


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
   FINISH BATTLE
========================================================= */

function finishBattle() {

    battleActive = false;

    clearInterval(
        battleTimerInterval
    );


    const pointsEarned =
        calculateBattlePoints();


    battlePoints += pointsEarned;

    setBattlePoints(
        battlePoints
    );


    const arena =
        getElement("battleArena");

    const results =
        getElement("battleResults");


    if (arena) {
        arena.hidden = true;
    }

    if (results) {
        results.hidden = false;
    }


    const finalPlayerScore =
        getElement("finalPlayerScore");

    const finalComputerScore =
        getElement("finalComputerScore");

    const pointsElement =
        getElement("pointsEarned");

    const resultTitle =
        getElement("battleResultTitle");

    const resultMessage =
        getElement("battleResultMessage");


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
                `You scored ${playerScore} out of ${QUESTIONS_PER_BATTLE}. Review the topic and try another battle when available.`;
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
   CALCULATE POINTS
========================================================= */

function calculateBattlePoints() {

    /*
       Base points:
       - 10 points for every correct answer
       - 25 bonus for winning
       - 10 bonus for a draw
    */

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
   RESET BATTLE
========================================================= */

function resetBattle() {

    clearInterval(
        battleTimerInterval
    );


    battleQuestions = [];

    currentQuestionIndex = 0;

    playerScore = 0;

    computerScore = 0;

    battleActive = false;

    answeringLocked = false;


    updateScores();


    const arena =
        getElement("battleArena");

    const results =
        getElement("battleResults");

    const setup =
        getElement("battleSetup");


    if (arena) {
        arena.hidden = true;
    }

    if (results) {
        results.hidden = true;
    }

    if (setup) {
        setup.hidden = false;
    }


    if (setup) {

        setup.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }

}


/* =========================================================
   PREMIUM MESSAGE
========================================================= */

function showPremiumMessage() {

    const premiumCard =
        getElement("premiumBattleCard");


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
   PREMIUM
========================================================= */

function openPremium() {

    /*
       This currently provides the front-end Premium
       connection point.

       Later this can be connected to your actual
       payment/subscription system.
    */

    const premiumUrl =
        "premium.html";


    window.location.href =
        premiumUrl;

}


/* =========================================================
   LEADERBOARD
========================================================= */

function updateLeaderboard() {

    battlePoints =
        getBattlePoints();


    const pointsElement =
        getElement("yourBattlePoints");


    if (pointsElement) {

        pointsElement.textContent =
            battlePoints
                .toLocaleString();

    }


    const rankElement =
        getElement("yourLeaderboardRank");


    if (!rankElement) {
        return;
    }


    /*
       Simple local preview ranking.

       A real leaderboard will eventually come from
       Supabase so students can compete globally.
    */

    let rank = 4;


    if (battlePoints >= 1950) {
        rank = 3;
    }

    if (battlePoints >= 2180) {
        rank = 2;
    }

    if (battlePoints >= 2450) {
        rank = 1;
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
        theme === "light"
    ) {

        document.body.classList.add(
            "light-mode"
        );

        updateThemeButton();

    }

}


function toggleGameTheme() {

    document.body.classList.toggle(
        "light-mode"
    );


    const isLight =
        document.body.classList.contains(
            "light-mode"
        );


    localStorage.setItem(
        STORAGE_KEYS.theme,
        isLight
            ? "light"
            : "dark"
    );


    updateThemeButton();

}


function updateThemeButton() {

    const button =
        getElement("themeButton");


    if (!button) {
        return;
    }


    const isLight =
        document.body.classList.contains(
            "light-mode"
        );


    button.textContent =
        isLight
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
            .finally(() => {

                window.location.href =
                    "login.html";

            });

        return;

    }


    window.location.href =
        "login.html";

}


/* =========================================================
   NAVIGATION FALLBACKS
========================================================= */

function setupNavigationFallbacks() {

    /*
       These functions intentionally remain simple because
       the exact filenames of the existing StudyMind pages
       can differ between deployments.

       The functions above can be updated later without
       changing the Game Mode interface.
    */

}


/* =========================================================
   SHUFFLE
========================================================= */

function shuffleArray(array) {

    const result =
        [...array];


    for (
        let i = result.length - 1;
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
        ] = [
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
