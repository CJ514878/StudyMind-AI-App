/* =========================================================
   STUDYMIND AI — GAME MODE
   COMPLETE CORRECTED REPLACEMENT
   ---------------------------------------------------------
   Includes:
   • Computer Battle
   • 1v1 matchmaking
   • 10 questions per battle
   • 15-second question timer
   • Free 5-battle limit
   • Premium check
   • Battle points
   • Wins / losses / draws
   • Global leaderboard
   • Realtime leaderboard refresh
   • Realtime 1v1 match updates
   • Subject + topic selection
   • Theme
   • Navigation
========================================================= */


/* =========================================================
   ELEMENT SHORTCUT
========================================================= */

function $(id) {
    return document.getElementById(id);
}

function getElement(id) {
    return document.getElementById(id);
}


/* =========================================================
   GAME CONSTANTS
========================================================= */

const GAME_STORAGE = {
    theme: "studyMindGameTheme",
    battleCount: "studyMindGameBattlesUsed",
    battlePoints: "studyMindGameBattlePoints"
};

const FREE_BATTLE_LIMIT = 5;

const QUESTIONS_PER_BATTLE = 10;

const QUESTION_TIME_SECONDS = 15;

const MATCHMAKING_INTERVAL = 2500;

const MATCH_TIMEOUT = 120000;


/* =========================================================
   GLOBAL BATTLE STATE
========================================================= */

let battleState = {
    mode: null,
    subject: "",
    topic: "",
    difficulty: "mixed",

    questions: [],

    currentQuestion: 0,

    playerScore: 0,
    opponentScore: 0,

    timer: QUESTION_TIME_SECONDS,
    timerInterval: null,

    answering: false,

    battleActive: false
};


/* =========================================================
   1V1 STATE
========================================================= */

let oneVOneMatchId = null;

let oneVOnePlayerNumber = null;

let oneVOneMyName = "Player";

let oneVOnePolling = null;

let oneVOneMatchmakingStartedAt = 0;

let oneVOneActive = false;

let oneVOneResultsRecorded = false;

let oneVOneAnsweredQuestions = new Set();

let oneVOneChannel = null;

let leaderboardRealtimeChannel = null;


/* =========================================================
   SUBJECT DATABASE
========================================================= */

const SUBJECT_DATABASE = {

    Mathematics: [
        "Algebra",
        "Geometry",
        "Trigonometry",
        "Statistics",
        "Probability",
        "Calculus",
        "Number and Numeration"
    ],

    English: [
        "Grammar",
        "Comprehension",
        "Vocabulary",
        "Oral English",
        "Summary Writing",
        "Essay Writing",
        "Literature"
    ],

    Physics: [
        "Mechanics",
        "Waves",
        "Heat",
        "Electricity",
        "Magnetism",
        "Optics",
        "Modern Physics"
    ],

    Chemistry: [
        "Atomic Structure",
        "Chemical Bonding",
        "Stoichiometry",
        "Acids and Bases",
        "Organic Chemistry",
        "Electrochemistry",
        "Periodic Chemistry"
    ],

    Biology: [
        "Cell Biology",
        "Genetics",
        "Ecology",
        "Evolution",
        "Human Biology",
        "Plant Biology",
        "Reproduction"
    ],

    Economics: [
        "Demand and Supply",
        "Production",
        "Market Structures",
        "National Income",
        "Money and Banking",
        "Inflation",
        "International Trade"
    ],

    Government: [
        "Constitution",
        "Democracy",
        "Political Parties",
        "Electoral Systems",
        "Legislature",
        "Executive",
        "Judiciary"
    ],

    Geography: [
        "Physical Geography",
        "Human Geography",
        "Map Reading",
        "Climate",
        "Population",
        "Resources",
        "Environmental Management"
    ]
};


/* =========================================================
   SUPABASE
========================================================= */

function getSupabase() {

    if (
        window.supabaseClient &&
        typeof window.supabaseClient.from === "function"
    ) {
        return window.supabaseClient;
    }

    if (
        window.supabase &&
        typeof window.supabase.from === "function"
    ) {
        return window.supabase;
    }

    if (
        typeof supabase !== "undefined" &&
        supabase &&
        typeof supabase.from === "function"
    ) {
        return supabase;
    }

    throw new Error(
        "Supabase is not connected on the Game Mode page."
    );
}


/* =========================================================
   CURRENT USER
========================================================= */

async function getCurrentUser() {

    const client = getSupabase();

    const {
        data,
        error
    } = await client.auth.getUser();

    if (error) {
        throw error;
    }

    if (!data || !data.user) {
        throw new Error(
            "You must be logged in before playing Game Mode."
        );
    }

    return data.user;
}


/* =========================================================
   DISPLAY NAME
========================================================= */

function getDisplayName(user) {

    if (!user) {
        return "Player";
    }

    const metadata =
        user.user_metadata || {};

    return (
        metadata.display_name ||
        metadata.full_name ||
        metadata.name ||
        metadata.username ||
        user.email?.split("@")[0] ||
        "Player"
    );
}


/* =========================================================
   SUBJECT NORMALIZER
========================================================= */

function normalizeSubjectName(subject) {

    if (!subject) {
        return "";
    }

    const cleaned =
        String(subject)
            .trim()
            .toLowerCase();

    const match =
        Object.keys(SUBJECT_DATABASE)
            .find(
                name =>
                    name.toLowerCase() === cleaned
            );

    return match || String(subject).trim();
}


/* =========================================================
   POPULATE SUBJECT DROPDOWNS
========================================================= */

function populateGameSubjects() {

    const selectors = [
        $("oneVOneSubject"),
        $("battleSubject")
    ].filter(Boolean);

    selectors.forEach(function(select) {

        const currentValue =
            select.value;

        select.innerHTML =
            '<option value="">Select subject</option>';

        Object.keys(SUBJECT_DATABASE)
            .forEach(function(subject) {

                const option =
                    document.createElement("option");

                option.value =
                    subject;

                option.textContent =
                    subject;

                select.appendChild(option);
            });

        if (
            currentValue &&
            SUBJECT_DATABASE[currentValue]
        ) {
            select.value =
                currentValue;
        }
    });

    populateOneVOneTopics();

    populateBattleTopics();
}


/* =========================================================
   POPULATE 1V1 TOPICS
========================================================= */

function populateOneVOneTopics() {

    const subject =
        $("oneVOneSubject");

    const topic =
        $("oneVOneTopic");

    if (!subject || !topic) {
        return;
    }

    const selectedSubject =
        normalizeSubjectName(
            subject.value
        );

    const currentTopic =
        topic.value;

    topic.innerHTML =
        '<option value="">Select topic</option>';

    const topics =
        SUBJECT_DATABASE[selectedSubject] || [];

    topics.forEach(function(topicName) {

        const option =
            document.createElement("option");

        option.value =
            topicName;

        option.textContent =
            topicName;

        topic.appendChild(option);
    });

    if (
        currentTopic &&
        topics.includes(currentTopic)
    ) {
        topic.value =
            currentTopic;
    }
}


/* =========================================================
   POPULATE COMPUTER BATTLE TOPICS
========================================================= */

function populateBattleTopics() {

    const subject =
        $("battleSubject");

    const topic =
        $("battleTopic");

    if (!subject || !topic) {
        return;
    }

    const selectedSubject =
        normalizeSubjectName(
            subject.value
        );

    const currentTopic =
        topic.value;

    topic.innerHTML =
        '<option value="">Select topic</option>';

    const topics =
        SUBJECT_DATABASE[selectedSubject] || [];

    topics.forEach(function(topicName) {

        const option =
            document.createElement("option");

        option.value =
            topicName;

        option.textContent =
            topicName;

        topic.appendChild(option);
    });

    if (
        currentTopic &&
        topics.includes(currentTopic)
    ) {
        topic.value =
            currentTopic;
    }
}


/* =========================================================
   1V1 SUBJECT CHANGE
========================================================= */

function handleOneVOneSubjectChange() {

    populateOneVOneTopics();

    updateFindOpponentButton();
}


/* =========================================================
   1V1 TOPIC CHANGE
========================================================= */

function updateFindOpponentButton() {

    const button =
        $("findOpponentButton");

    if (!button) {
        return;
    }

    const subject =
        $("oneVOneSubject")?.value;

    const topic =
        $("oneVOneTopic")?.value;

    button.disabled =
        !subject ||
        !topic;
}


/* =========================================================
   COMPUTER SUBJECT CHANGE
========================================================= */

function handleBattleSubjectChange() {

    populateBattleTopics();
}


/* =========================================================
   1V1 VALUES
========================================================= */

function oneVOneSubjectValue() {

    return normalizeSubjectName(
        $("oneVOneSubject")
            ?.value
            ?.trim() || ""
    );
}


function oneVOneTopicValue() {

    return (
        $("oneVOneTopic")
            ?.value
            ?.trim() || ""
    );
}


function oneVOneDifficultyValue() {

    return (
        $("oneVOneDifficulty")
            ?.value ||
        "mixed"
    );
}


/* =========================================================
   PREMIUM
========================================================= */

function isPremiumUser() {

    const values = [
        localStorage.getItem("studyMindPremium"),
        localStorage.getItem("studyMindIsPremium"),
        localStorage.getItem("premium"),
        localStorage.getItem("isPremium")
    ];

    return values.some(
        value =>
            value === "true" ||
            value === "1"
    );
}


/* =========================================================
   BATTLE COUNT
========================================================= */

function getBattlesUsed() {

    const stored =
        localStorage.getItem(
            GAME_STORAGE.battleCount
        );

    const value =
        Number(stored);

    return Number.isFinite(value)
        ? Math.max(0, value)
        : 0;
}


function setBattlesUsed(value) {

    localStorage.setItem(
        GAME_STORAGE.battleCount,
        String(
            Math.max(
                0,
                Number(value) || 0
            )
        )
    );
}


function getBattleCount() {

    return getBattlesUsed();
}


/* =========================================================
   BATTLE POINTS
========================================================= */

function getBattlePoints() {

    const stored =
        localStorage.getItem(
            GAME_STORAGE.battlePoints
        );

    const value =
        Number(stored);

    return Number.isFinite(value)
        ? Math.max(0, value)
        : 0;
}


function setBattlePoints(value) {

    localStorage.setItem(
        GAME_STORAGE.battlePoints,
        String(
            Math.max(
                0,
                Number(value) || 0
            )
        )
    );
}


/* =========================================================
   PREMIUM MESSAGE
========================================================= */

function showPremiumMessage() {

    if (
        typeof window.openPremium ===
        "function"
    ) {

        window.openPremium();

        return;
    }

    alert(
        "You have used all 5 free Game Mode battles. Upgrade to Premium for unlimited battles."
    );
}


/* =========================================================
   CHECK BATTLE ACCESS
========================================================= */

function canStartBattle() {

    if (isPremiumUser()) {
        return true;
    }

    if (
        getBattlesUsed() >=
        FREE_BATTLE_LIMIT
    ) {

        showPremiumMessage();

        return false;
    }

    return true;
}


/* =========================================================
   GENERATE BATTLE QUESTIONS
========================================================= */

async function generateBattleQuestions(
    subject,
    topic,
    difficulty = "mixed"
) {

    /*
     * If the existing AI question generator exists,
     * use it first.
     */

    const possibleGenerators = [
        window.generateGameQuestions,
        window.generateBattleQuestionsAI,
        window.generateAIQuestions,
        window.createBattleQuestions
    ];

    for (
        const generator of possibleGenerators
    ) {

        if (
            typeof generator ===
            "function" &&
            generator !== generateBattleQuestions
        ) {

            try {

                const result =
                    await generator(
                        subject,
                        topic,
                        difficulty,
                        QUESTIONS_PER_BATTLE
                    );

                const normalized =
                    normalizeQuestionArray(
                        result
                    );

                if (
                    normalized.length >=
                    QUESTIONS_PER_BATTLE
                ) {

                    return normalized;
                }

            } catch (error) {

                console.warn(
                    "External battle question generator failed:",
                    error
                );
            }
        }
    }


    /*
     * Try the existing API endpoint used by the app.
     */

    const endpoints = [
        "/api/generate-questions",
        "/api/questions",
        "/api/generate"
    ];


    for (
        const endpoint of endpoints
    ) {

        try {

            const response =
                await fetch(
                    endpoint,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                subject,
                                topic,
                                difficulty,
                                count:
                                    QUESTIONS_PER_BATTLE,
                                numberOfQuestions:
                                    QUESTIONS_PER_BATTLE,
                                mode: "battle"
                            })
                    }
                );


            if (!response.ok) {
                continue;
            }


            const data =
                await response.json();


            const questions =
                normalizeQuestionArray(
                    data
                );


            if (
                questions.length >=
                QUESTIONS_PER_BATTLE
            ) {

                return questions;
            }

        } catch (error) {

            console.warn(
                `Question endpoint ${endpoint} failed:`,
                error
            );
        }
    }


    throw new Error(
        "The AI question service could not generate enough battle questions."
    );
}


/* =========================================================
   NORMALIZE QUESTION ARRAY
========================================================= */

function normalizeQuestionArray(data) {

    let questions = [];

    if (Array.isArray(data)) {

        questions =
            data;

    } else if (
        Array.isArray(data?.questions)
    ) {

        questions =
            data.questions;

    } else if (
        Array.isArray(data?.data)
    ) {

        questions =
            data.data;

    } else if (
        Array.isArray(data?.result)
    ) {

        questions =
            data.result;
    }


    return questions
        .map(function(item) {

            if (!item) {
                return null;
            }

            const question =
                String(
                    item.question ||
                    item.text ||
                    item.prompt ||
                    ""
                ).trim();

            let options =
                Array.isArray(item.options)
                    ? item.options
                    : Array.isArray(item.choices)
                        ? item.choices
                        : [];


            options =
                options.map(
                    option =>
                        String(option)
                );


            let answer =
                item.answer;

            if (
                typeof answer ===
                "string"
            ) {

                const upper =
                    answer
                        .trim()
                        .toUpperCase();

                if (
                    /^[A-D]$/.test(upper)
                ) {

                    answer =
                        upper.charCodeAt(0) -
                        65;

                } else if (
                    options.length
                ) {

                    const found =
                        options.findIndex(
                            option =>
                                option
                                    .trim()
                                    .toLowerCase() ===
                                answer
                                    .trim()
                                    .toLowerCase()
                        );

                    if (found >= 0) {
                        answer = found;
                    }
                }
            }


            answer =
                Number(answer);


            if (
                !question ||
                options.length < 2 ||
                !Number.isInteger(answer) ||
                answer < 0 ||
                answer >= options.length
            ) {

                return null;
            }


            return {
                question,
                options,
                answer
            };
        })
        .filter(Boolean);
}


/* =========================================================
   COMPUTER BATTLE
========================================================= */

async function startComputerBattle() {

    if (!canStartBattle()) {
        return;
    }


    /*
     * Preserve the existing Computer Battle engine
     * if one exists outside this file.
     */

    if (
        typeof window.beginBattle ===
        "function" &&
        window.beginBattle !== startComputerBattle
    ) {

        try {

            await window.beginBattle();

            return;

        } catch (error) {

            console.warn(
                "Existing Computer Battle starter failed:",
                error
            );
        }
    }


    /*
     * Otherwise initialize the battle ourselves.
     */

    const subject =
        normalizeSubjectName(
            $("battleSubject")?.value ||
            $("oneVOneSubject")?.value ||
            ""
        );

    const topic =
        $("battleTopic")?.value ||
        $("oneVOneTopic")?.value ||
        "";

    const difficulty =
        $("battleDifficulty")?.value ||
        "mixed";


    if (!subject || !topic) {

        alert(
            "Choose a subject and topic before starting the battle."
        );

        return;
    }


    battleState = {

        mode: "computer",

        subject,

        topic,

        difficulty,

        questions: [],

        currentQuestion: 0,

        playerScore: 0,

        opponentScore: 0,

        timer: QUESTION_TIME_SECONDS,

        timerInterval: null,

        answering: false,

        battleActive: false
    };


    const setup =
        $("battleSetup");

    const arena =
        $("battleArena");

    const results =
        $("battleResults");


    if (setup) {
        setup.hidden = true;
    }

    if (results) {
        results.hidden = true;
    }

    if (arena) {
        arena.hidden = false;
    }


    try {

        const questions =
            await generateBattleQuestions(
                subject,
                topic,
                difficulty
            );


        battleState.questions =
            questions.slice(
                0,
                QUESTIONS_PER_BATTLE
            );


        battleState.battleActive =
            true;


        updateComputerBattleScores();

        showComputerQuestion();

    } catch (error) {

        battleState.battleActive =
            false;

        if (arena) {
            arena.hidden = true;
        }

        if (setup) {
            setup.hidden = false;
        }

        alert(
            cleanErrorMessage(
                error?.message
            )
        );
    }
}


/* =========================================================
   SHOW COMPUTER QUESTION
========================================================= */

function showComputerQuestion() {

    stopBattleTimer();

    const question =
        battleState.questions[
            battleState.currentQuestion
        ];


    if (!question) {

        finishComputerBattle();

        return;
    }


    battleState.answering =
        false;


    const questionNumber =
        battleState.currentQuestion + 1;


    [
        "questionNumber",
        "currentQuestionNumber",
        "battleQuestionNumber"
    ].forEach(function(id) {

        const element =
            $(id);

        if (element) {
            element.textContent =
                questionNumber;
        }
    });


    [
        "battleQuestionTopic",
        "questionTopic"
    ].forEach(function(id) {

        const element =
            $(id);

        if (element) {
            element.textContent =
                battleState.topic;
        }
    });


    const questionElement =
        $("battleQuestion") ||
        $("questionText");


    if (questionElement) {

        questionElement.textContent =
            question.question;
    }


    const answerGrid =
        $("answerGrid");


    if (!answerGrid) {

        throw new Error(
            "The computer battle answer grid is missing from game-mode.html."
        );
    }


    answerGrid.innerHTML = "";


    question.options.forEach(
        function(option, index) {

            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.className =
                "answer-button";

            button.textContent =
                option;

            button.addEventListener(
                "click",
                function() {

                    answerComputerQuestion(
                        index
                    );
                }
            );

            answerGrid.appendChild(
                button
            );
        }
    );


    updateComputerBattleScores();

    startBattleTimer();
}


/* =========================================================
   COMPUTER ANSWER
========================================================= */

function answerComputerQuestion(
    selectedIndex
) {

    if (
        battleState.answering ||
        !battleState.battleActive
    ) {
        return;
    }


    battleState.answering =
        true;

    stopBattleTimer();


    const question =
        battleState.questions[
            battleState.currentQuestion
        ];


    if (!question) {
        return;
    }


    const buttons =
        $("answerGrid")
            ?.querySelectorAll(
                ".answer-button"
            ) || [];


    buttons.forEach(
        function(button, index) {

            button.disabled =
                true;

            if (
                index ===
                question.answer
            ) {

                button.classList.add(
                    "correct"
                );
            }

            if (
                index === selectedIndex &&
                index !== question.answer
            ) {

                button.classList.add(
                    "incorrect"
                );
            }
        }
    );


    if (
        selectedIndex ===
        question.answer
    ) {

        battleState.playerScore +=
            10;

    } else {

        /*
         * Simple computer opponent behavior.
         */

        if (
            Math.random() < 0.65
        ) {

            battleState.opponentScore +=
                10;
        }
    }


    updateComputerBattleScores();


    setTimeout(
        function() {

            if (
                !battleState.battleActive
            ) {
                return;
            }

            battleState.currentQuestion++;

            showComputerQuestion();

        },
        900
    );
}


/* =========================================================
   COMPUTER TIMEOUT
========================================================= */

function handleComputerTimeout() {

    if (
        battleState.answering ||
        !battleState.battleActive
    ) {
        return;
    }


    battleState.answering =
        true;


    const question =
        battleState.questions[
            battleState.currentQuestion
        ];


    const buttons =
        $("answerGrid")
            ?.querySelectorAll(
                ".answer-button"
            ) || [];


    buttons.forEach(
        function(button, index) {

            button.disabled =
                true;

            if (
                question &&
                index === question.answer
            ) {

                button.classList.add(
                    "correct"
                );
            }
        }
    );


    if (
        Math.random() < 0.65
    ) {

        battleState.opponentScore +=
            10;
    }


    updateComputerBattleScores();


    setTimeout(
        function() {

            if (
                !battleState.battleActive
            ) {
                return;
            }

            battleState.currentQuestion++;

            showComputerQuestion();

        },
        900
    );
}


/* =========================================================
   BATTLE TIMER
========================================================= */

function startBattleTimer() {

    stopBattleTimer();

    battleState.timer =
        QUESTION_TIME_SECONDS;

    updateBattleTimer();


    battleState.timerInterval =
        setInterval(
            function() {

                if (
                    !battleState.battleActive
                ) {

                    stopBattleTimer();

                    return;
                }


                battleState.timer--;

                updateBattleTimer();


                if (
                    battleState.timer <= 0
                ) {

                    stopBattleTimer();

                    if (
                        battleState.mode ===
                        "computer"
                    ) {

                        handleComputerTimeout();

                    } else if (
                        battleState.mode ===
                        "1v1"
                    ) {

                        handleOneVOneTimeout();
                    }
                }

            },
            1000
        );
}


function stopBattleTimer() {

    if (
        battleState?.timerInterval
    ) {

        clearInterval(
            battleState.timerInterval
        );

        battleState.timerInterval =
            null;
    }
}


function updateBattleTimer() {

    const ids = [
        "battleTimer",
        "timer",
        "oneVOneTimer",
        "oneVOneBattleTimer"
    ];


    for (
        const id of ids
    ) {

        const element =
            $(id);

        if (element) {

            element.textContent =
                Math.max(
                    0,
                    battleState.timer
                );

            if (
                id ===
                "battleTimer"
            ) {
                return;
            }
        }
    }
}


/* =========================================================
   COMPUTER SCORES
========================================================= */

function updateComputerBattleScores() {

    const playerScore =
        $("playerScore");

    const computerScore =
        $("computerScore");


    if (playerScore) {

        playerScore.textContent =
            battleState.playerScore;
    }


    if (computerScore) {

        computerScore.textContent =
            battleState.opponentScore;
    }
}


/* =========================================================
   FINISH COMPUTER BATTLE
========================================================= */

function finishComputerBattle() {

    stopBattleTimer();

    battleState.battleActive =
        false;


    const player =
        Number(
            battleState.playerScore || 0
        );

    const opponent =
        Number(
            battleState.opponentScore || 0
        );


    let title =
        "Battle Complete";

    let message =
        "Great work!";

    let points =
        player;


    if (
        player > opponent
    ) {

        title =
            "🏆 Victory!";

        message =
            "You won the battle!";

        points =
            player + 25;

    } else if (
        player < opponent
    ) {

        title =
            "Keep Studying!";

        message =
            "The computer won this round.";

    } else {

        title =
            "🤝 Draw!";

        message =
            "You finished with the same score.";

        points =
            player + 10;
    }


    setBattlePoints(
        getBattlePoints() +
        points
    );


    setBattlesUsed(
        getBattlesUsed() + 1
    );


    const arena =
        $("battleArena");

    const results =
        $("battleResults");


    if (arena) {
        arena.hidden = true;
    }

    if (results) {
        results.hidden = false;
    }


    if ($("battleResultTitle")) {

        $("battleResultTitle")
            .textContent =
            title;
    }


    if ($("battleResultMessage")) {

        $("battleResultMessage")
            .textContent =
            message;
    }


    if ($("finalPlayerScore")) {

        $("finalPlayerScore")
            .textContent =
            player;
    }


    if ($("finalComputerScore")) {

        $("finalComputerScore")
            .textContent =
            opponent;
    }


    if ($("pointsEarned")) {

        $("pointsEarned")
            .textContent =
            `+${points}`;
    }


    updateLeaderboardUI();
}


/* =========================================================
   START 1V1 MODE
========================================================= */

function startOneVOneMode() {

    battleState.mode =
        "1v1";


    const setup =
        $("battleSetup");

    const oneVOneSetup =
        $("oneVOneSetup");

    const arena =
        $("battleArena");

    const oneVOneArena =
        $("oneVOneArena");

    const results =
        $("battleResults");


    if (setup) {
        setup.hidden = true;
    }

    if (oneVOneSetup) {
        oneVOneSetup.hidden = false;
    }

    if (arena) {
        arena.hidden = true;
    }

    if (oneVOneArena) {
        oneVOneArena.hidden = true;
    }

    if (results) {
        results.hidden = true;
    }


    window.oneVOneArenaStarted =
        false;


    updateFindOpponentButton();


    if (oneVOneSetup) {

        oneVOneSetup.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}


/* =========================================================
   MATCHMAKING UI
========================================================= */

function showMatchmaking() {

    const status =
        $("matchmakingStatus");

    const button =
        $("findOpponentButton");


    if (status) {
        status.hidden = false;
    }


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "🔎 Searching...";
    }


    updateMatchmakingText(
        "Looking for an opponent...",
        "StudyMind is searching for another student with the same subject, topic and difficulty."
    );
}


function hideMatchmaking() {

    const status =
        $("matchmakingStatus");

    const button =
        $("findOpponentButton");


    if (status) {
        status.hidden = true;
    }


    if (button) {

        updateFindOpponentButton();

        button.textContent =
            "⚔️ Find Opponent";
    }
}


function updateMatchmakingText(
    title,
    message
) {

    const titleElement =
        $("matchmakingTitle");

    const messageElement =
        $("matchmakingMessage");


    if (titleElement) {
        titleElement.textContent =
            title;
    }


    if (messageElement) {
        messageElement.textContent =
            message;
    }
}


/* =========================================================
   CLEAR MATCH POLLING
========================================================= */

function clearOneVOnePolling() {

    if (oneVOnePolling) {

        clearInterval(
            oneVOnePolling
        );

        oneVOnePolling =
            null;
    }
}


/* =========================================================
   MATCH ID NORMALIZER
========================================================= */

function normalizeMatchId(value) {

    if (!value) {
        return null;
    }


    if (
        typeof value ===
        "string"
    ) {

        return value;
    }


    if (
        Array.isArray(value)
    ) {

        return value.length
            ? normalizeMatchId(
                value[0]
            )
            : null;
    }


    if (
        typeof value ===
        "object"
    ) {

        return (
            value.match_id ||
            value.matchId ||
            value.game_match_id ||
            value.id ||
            null
        );
    }


    return null;
}


/* =========================================================
   FIND 1V1 OPPONENT
========================================================= */

async function findOneVOneOpponent() {

    if (!canStartBattle()) {
        return;
    }


    if (oneVOneMatchId) {
        return;
    }


    try {

        const user =
            await getCurrentUser();


        const subject =
            oneVOneSubjectValue();


        const topic =
            oneVOneTopicValue();


        const difficulty =
            oneVOneDifficultyValue();


        if (!subject || !topic) {

            alert(
                "Choose a subject and topic first."
            );

            return;
        }


        oneVOneMyName =
            getDisplayName(user);


        showMatchmaking();


        const client =
            getSupabase();


        /*
         * Look for an existing waiting room.
         */

        const {
            data: waitingMatches,
            error: searchError
        } =
            await client
                .from("game_matches")
                .select("*")
                .eq(
                    "status",
                    "waiting"
                )
                .eq(
                    "subject",
                    subject
                )
                .eq(
                    "topic",
                    topic
                )
                .eq(
                    "difficulty",
                    difficulty
                )
                .neq(
                    "created_by",
                    user.id
                )
                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                )
                .limit(1);


        if (searchError) {
            throw searchError;
        }


        const existingMatch =
            waitingMatches?.[0] ||
            null;


        /*
         * Join existing room.
         */

        if (existingMatch) {

            await joinExistingMatch(
                existingMatch
            );

            return;
        }


        /*
         * Create waiting room.
         */

        const {
            data: createdMatch,
            error: createError
        } =
            await client.rpc(
                "create_game_match",
                {
                    p_subject:
                        subject,

                    p_topic:
                        topic,

                    p_difficulty:
                        difficulty,

                    p_display_name:
                        oneVOneMyName
                }
            );


        if (createError) {
            throw createError;
        }


        oneVOneMatchId =
            normalizeMatchId(
                createdMatch
            );


        if (!oneVOneMatchId) {

            throw new Error(
                "The waiting room was created but no match ID was returned."
            );
        }


        oneVOnePlayerNumber =
            1;

        oneVOneActive =
            false;

        oneVOneResultsRecorded =
            false;

        oneVOneAnsweredQuestions =
            new Set();


        window.oneVOneArenaStarted =
            false;


        console.log(
            "Created new 1v1 waiting room:",
            oneVOneMatchId
        );


        await subscribeToOneVOne(
            oneVOneMatchId
        );


        oneVOneMatchmakingStartedAt =
            Date.now();


        clearOneVOnePolling();


        oneVOnePolling =
            setInterval(
                async function() {

                    if (
                        !oneVOneMatchId ||
                        oneVOneActive
                    ) {
                        return;
                    }


                    if (
                        Date.now() -
                        oneVOneMatchmakingStartedAt >=
                        MATCH_TIMEOUT
                    ) {

                        clearOneVOnePolling();

                        updateMatchmakingText(
                            "Still waiting...",
                            "No opponent has joined yet. You can keep waiting or cancel the search."
                        );

                        return;
                    }


                    try {

                        await checkMatchPlayers();

                    } catch (error) {

                        console.warn(
                            "1v1 polling error:",
                            error
                        );
                    }

                },
                MATCHMAKING_INTERVAL
            );


    } catch (error) {

        console.error(
            "1v1 matchmaking error:",
            error
        );


        clearOneVOnePolling();

        await cleanupOneVOneConnection();


        oneVOneMatchId =
            null;

        oneVOnePlayerNumber =
            null;

        oneVOneActive =
            false;


        hideMatchmaking();


        alert(
            cleanErrorMessage(
                error?.message
            )
        );
    }
}


/* =========================================================
   JOIN EXISTING MATCH
========================================================= */

async function joinExistingMatch(match) {

    if (!match?.id) {

        throw new Error(
            "Invalid match."
        );
    }


    const client =
        getSupabase();


    const user =
        await getCurrentUser();


    const displayName =
        getDisplayName(user);


    oneVOneMatchId =
        match.id;


    oneVOneMyName =
        displayName;


    oneVOneResultsRecorded =
        false;


    oneVOneAnsweredQuestions =
        new Set();


    window.oneVOneArenaStarted =
        false;


    clearOneVOnePolling();


    /*
     * Check whether the user is already in the room.
     */

    const {
        data: existingPlayer,
        error: existingPlayerError
    } =
        await client
            .from("game_match_players")
            .select(
                "user_id,player_number,display_name"
            )
            .eq(
                "match_id",
                match.id
            )
            .eq(
                "user_id",
                user.id
            )
            .maybeSingle();


    if (existingPlayerError) {
        throw existingPlayerError;
    }


    if (existingPlayer) {

        oneVOnePlayerNumber =
            Number(
                existingPlayer.player_number
            );


        oneVOneMyName =
            existingPlayer.display_name ||
            displayName;

    } else {

        /*
         * Join through the RPC.
         */

        const {
            data: joinedMatch,
            error: joinError
        } =
            await client.rpc(
                "join_game_match",
                {
                    p_match_id:
                        match.id,

                    p_display_name:
                        displayName
                }
            );


        if (joinError) {
            throw joinError;
        }


        oneVOnePlayerNumber =
            Number(
                joinedMatch?.player_number ||
                2
            );
    }


    updateMatchmakingText(
        "Opponent found! ⚔️",
        "Both players are connected. Preparing your battle..."
    );


    await subscribeToOneVOne(
        match.id
    );


    await checkMatchPlayers();


    return true;
}


/* =========================================================
   CHECK MATCH PLAYERS
========================================================= */

async function checkMatchPlayers() {

    if (!oneVOneMatchId) {
        return;
    }


    try {

        const client =
            getSupabase();


        const {
            data: players,
            error: playersError
        } =
            await client
                .from("game_match_players")
                .select(
                    "match_id,user_id,player_number,display_name"
                )
                .eq(
                    "match_id",
                    oneVOneMatchId
                )
                .order(
                    "player_number",
                    {
                        ascending: true
                    }
                );


        if (playersError) {
            throw playersError;
        }


        const matchPlayers =
            Array.isArray(players)
                ? players
                : [];


        const user =
            await getCurrentUser();


        const currentPlayer =
            matchPlayers.find(
                player =>
                    String(
                        player.user_id
                    ) ===
                    String(
                        user.id
                    )
            );


        if (currentPlayer) {

            oneVOnePlayerNumber =
                Number(
                    currentPlayer.player_number
                );


            oneVOneMyName =
                currentPlayer.display_name ||
                oneVOneMyName;
        }


        /*
         * Still waiting for player 2.
         */

        if (
            matchPlayers.length < 2
        ) {

            updateMatchmakingText(
                "Looking for an opponent...",
                "Your battle room is ready. Searching for another student..."
            );

            return;
        }


        /*
         * Load the match.
         */

        const {
            data: match,
            error: matchError
        } =
            await client
                .from("game_matches")
                .select("*")
                .eq(
                    "id",
                    oneVOneMatchId
                )
                .maybeSingle();


        if (matchError) {
            throw matchError;
        }


        if (!match) {

            throw new Error(
                "The 1v1 match no longer exists."
            );
        }


        /*
         * Finished / cancelled.
         */

        if (
            match.status ===
            "finished" ||
            match.status ===
            "cancelled"
        ) {

            clearOneVOnePolling();

            oneVOneActive =
                false;

            updateMatchmakingText(
                "Match unavailable",
                "This battle is no longer available."
            );

            return;
        }


        /*
         * Starting.
         */

        if (
            match.status ===
            "starting"
        ) {

            updateMatchmakingText(
                "Opponent found! ⚔️",
                "Both players are connected. Starting the battle..."
            );


            /*
             * Player 1 changes starting -> active.
             */

            if (
                oneVOnePlayerNumber ===
                1
            ) {

                const {
                    data,
                    error
                } =
                    await client.rpc(
                        "start_game_match",
                        {
                            p_match_id:
                                oneVOneMatchId
                        }
                    );


                if (error) {

                    console.warn(
                        "start_game_match:",
                        error
                    );


                    const {
                        data:
                            latestMatch
                    } =
                        await client
                            .from("game_matches")
                            .select("*")
                            .eq(
                                "id",
                                oneVOneMatchId
                            )
                            .maybeSingle();


                    if (
                        latestMatch?.status ===
                        "active"
                    ) {

                        activateOneVOneMatch(
                            latestMatch
                        );
                    }

                    return;
                }


                console.log(
                    "1v1 start RPC:",
                    data
                );


                const {
                    data:
                        latestMatch
                } =
                    await client
                        .from("game_matches")
                        .select("*")
                        .eq(
                            "id",
                            oneVOneMatchId
                        )
                        .maybeSingle();


                if (
                    latestMatch?.status ===
                    "active"
                ) {

                    activateOneVOneMatch(
                        latestMatch
                    );
                }
            }

            return;
        }


        /*
         * Active.
         */

        if (
            match.status ===
            "active"
        ) {

            activateOneVOneMatch(
                match
            );

            return;
        }


        console.warn(
            "Unexpected 1v1 status:",
            match.status
        );

    } catch (error) {

        console.error(
            "checkMatchPlayers error:",
            error
        );
    }
}


/* =========================================================
   REALTIME 1V1
========================================================= */

async function subscribeToOneVOne(
    matchId
) {

    const client =
        getSupabase();


    if (!matchId) {
        return null;
    }


    await cleanupOneVOneConnection();


    oneVOneMatchId =
        matchId;


    const channel =
        client
            .channel(
                `game-match-${matchId}`
            )

            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "game_matches",
                    filter:
                        `id=eq.${matchId}`
                },
                async function(payload) {

                    console.log(
                        "1v1 match realtime:",
                        payload
                    );


                    const match =
                        payload.new;


                    if (!match) {
                        return;
                    }


                    if (
                        match.status ===
                        "active"
                    ) {

                        activateOneVOneMatch(
                            match
                        );

                    } else {

                        await checkMatchPlayers();
                    }
                }
            )

            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table:
                        "game_match_players",
                    filter:
                        `match_id=eq.${matchId}`
                },
                async function(payload) {

                    console.log(
                        "1v1 player realtime:",
                        payload
                    );


                    await checkMatchPlayers();
                }
            )

            .subscribe(
                function(status) {

                    console.log(
                        "1v1 realtime status:",
                        status
                    );
                }
            );


    oneVOneChannel =
        channel;


    window.oneVOneChannel =
        channel;


    await checkMatchPlayers();


    return channel;
}


/* =========================================================
   ACTIVATE 1V1 MATCH
========================================================= */

async function activateOneVOneMatch(
    match
) {

    if (!match) {
        return;
    }


    if (
        oneVOneMatchId &&
        match.id &&
        String(match.id) !==
        String(oneVOneMatchId)
    ) {

        return;
    }


    oneVOneMatchId =
        match.id ||
        oneVOneMatchId;


    oneVOneActive =
        true;


    clearOneVOnePolling();


    if (
        window.oneVOneArenaStarted
    ) {

        return;
    }


    window.oneVOneArenaStarted =
        true;


    updateMatchmakingText(
        "Battle starting! ⚔️",
        "Your 1v1 match is active. Get ready!"
    );


    setTimeout(
        async function() {

            try {

                await startOneVOneArena();

            } catch (error) {

                console.error(
                    "Could not start 1v1 arena:",
                    error
                );


                window.oneVOneArenaStarted =
                    false;


                updateMatchmakingText(
                    "Could not start battle",
                    cleanErrorMessage(
                        error?.message
                    )
                );
            }

        },
        500
    );
}


/* =========================================================
   START 1V1 ARENA
========================================================= */

async function startOneVOneArena() {

    clearOneVOnePolling();


    const setup =
        $("battleSetup");

    const oneVOneSetup =
        $("oneVOneSetup");

    const computerArena =
        $("battleArena");

    const oneVOneArena =
        $("oneVOneArena");

    const results =
        $("battleResults");


    if (setup) {
        setup.hidden = true;
    }

    if (oneVOneSetup) {
        oneVOneSetup.hidden = true;
    }

    if (computerArena) {
        computerArena.hidden = true;
    }

    if (results) {
        results.hidden = true;
    }


    if (!oneVOneArena) {

        throw new Error(
            "The 1v1 arena element (#oneVOneArena) is missing from game-mode.html."
        );
    }


    oneVOneArena.hidden =
        false;


    oneVOneArena.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });


    oneVOneActive =
        true;


    oneVOneResultsRecorded =
        false;


    oneVOneAnsweredQuestions =
        new Set();


    battleState = {

        mode: "1v1",

        subject:
            oneVOneSubjectValue(),

        topic:
            oneVOneTopicValue(),

        difficulty:
            oneVOneDifficultyValue(),

        questions: [],

        currentQuestion: 0,

        playerScore: 0,

        opponentScore: 0,

        timer:
            QUESTION_TIME_SECONDS,

        timerInterval: null,

        answering: false,

        battleActive: true
    };


    updateOneVOnePlayerLabels();


    updateOneVOneArenaMessage(
        "Preparing your questions..."
    );


    try {

        const questions =
            await generateBattleQuestions(
                battleState.subject,
                battleState.topic,
                battleState.difficulty
            );


        if (
            !Array.isArray(questions) ||
            questions.length <
            QUESTIONS_PER_BATTLE
        ) {

            throw new Error(
                "The AI did not return enough questions for the 1v1 battle."
            );
        }


        battleState.questions =
            questions.slice(
                0,
                QUESTIONS_PER_BATTLE
            );


    } catch (error) {

        battleState.battleActive =
            false;

        oneVOneActive =
            false;

        window.oneVOneArenaStarted =
            false;


        updateOneVOneArenaMessage(
            "Could not prepare the battle questions."
        );


        throw error;
    }


    showOneVOneQuestion();
}


/* =========================================================
   1V1 PLAYER LABELS
========================================================= */

function updateOneVOnePlayerLabels() {

    const playerOneName =
        $("oneVOnePlayerOneName");

    const playerTwoName =
        $("oneVOnePlayerTwoName");

    const opponentName =
        $("oneVOneOpponentName");


    /*
     * Player 1 and Player 2 names.
     */

    if (
        oneVOnePlayerNumber ===
        1
    ) {

        if (playerOneName) {
            playerOneName.textContent =
                oneVOneMyName;
        }

        if (playerTwoName) {
            playerTwoName.textContent =
                "Opponent";
        }

    } else {

        if (playerOneName) {
            playerOneName.textContent =
                "Opponent";
        }

        if (playerTwoName) {
            playerTwoName.textContent =
                oneVOneMyName;
        }
    }


    if (opponentName) {

        opponentName.textContent =
            "Opponent";
    }


    const playerScore =
        $("oneVOnePlayerScore");

    const opponentScore =
        $("oneVOneOpponentScore");


    if (playerScore) {
        playerScore.textContent =
            "0";
    }

    if (opponentScore) {
        opponentScore.textContent =
            "0";
    }
}


/* =========================================================
   1V1 ARENA MESSAGE
========================================================= */

function updateOneVOneArenaMessage(
    message
) {

    const ids = [
        "oneVOneArenaMessage",
        "oneVOneStatusMessage",
        "oneVOneBattleStatus",
        "oneVOneQuestionStatus"
    ];


    for (
        const id of ids
    ) {

        const element =
            $(id);


        if (element) {

            element.textContent =
                message;

            return;
        }
    }
}


/* =========================================================
   SHOW 1V1 QUESTION
========================================================= */

function showOneVOneQuestion() {

    stopBattleTimer();


    const question =
        battleState.questions[
            battleState.currentQuestion
        ];


    if (!question) {

        finishOneVOneBattle();

        return;
    }


    battleState.answering =
        false;


    const questionNumber =
        battleState.currentQuestion + 1;


    [
        "oneVOneQuestionNumber",
        "oneVOneCurrentQuestionNumber"
    ].forEach(function(id) {

        const element =
            $(id);

        if (element) {
            element.textContent =
                questionNumber;
        }
    });


    [
        "oneVOneQuestionTopic",
        "oneVOneBattleTopic"
    ].forEach(function(id) {

        const element =
            $(id);

        if (element) {
            element.textContent =
                battleState.topic;
        }
    });


    const questionElement =
        $("oneVOneQuestion") ||
        $("oneVOneBattleQuestion");


    if (questionElement) {

        questionElement.textContent =
            question.question;
    }


    const answerGrid =
        $("oneVOneAnswerGrid") ||
        $("answerGrid");


    if (!answerGrid) {

        throw new Error(
            "The 1v1 answer grid is missing from game-mode.html."
        );
    }


    answerGrid.innerHTML =
        "";


    question.options.forEach(
        function(option, index) {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";

            button.className =
                "answer-button";

            button.textContent =
                option;


            button.addEventListener(
                "click",
                function() {

                    answerOneVOneQuestion(
                        index
                    );
                }
            );


            answerGrid.appendChild(
                button
            );
        }
    );


    updateOneVOneScores();


    startBattleTimer();
}


/* =========================================================
   ANSWER 1V1 QUESTION
========================================================= */

function answerOneVOneQuestion(
    selectedIndex
) {

    if (
        battleState.answering ||
        !battleState.battleActive
    ) {

        return;
    }


    battleState.answering =
        true;


    stopBattleTimer();


    const question =
        battleState.questions[
            battleState.currentQuestion
        ];


    if (!question) {
        return;
    }


    const answerGrid =
        $("oneVOneAnswerGrid") ||
        $("answerGrid");


    const buttons =
        answerGrid
            ? answerGrid.querySelectorAll(
                ".answer-button"
            )
            : [];


    buttons.forEach(
        function(button, index) {

            button.disabled =
                true;


            if (
                index ===
                question.answer
            ) {

                button.classList.add(
                    "correct"
                );
            }


            if (
                index ===
                selectedIndex &&
                index !== question.answer
            ) {

                button.classList.add(
                    "incorrect"
                );
            }
        }
    );


    oneVOneAnsweredQuestions.add(
        battleState.currentQuestion
    );


    if (
        selectedIndex ===
        question.answer
    ) {

        battleState.playerScore +=
            10;
    }


    updateOneVOneScores();


    setTimeout(
        function() {

            if (
                !battleState.battleActive
            ) {
                return;
            }


            battleState.currentQuestion++;


            showOneVOneQuestion();

        },
        900
    );
}


/* =========================================================
   1V1 TIMEOUT
========================================================= */

function handleOneVOneTimeout() {

    if (
        battleState.answering ||
        !battleState.battleActive
    ) {

        return;
    }


    battleState.answering =
        true;


    const question =
        battleState.questions[
            battleState.currentQuestion
        ];


    const answerGrid =
        $("oneVOneAnswerGrid") ||
        $("answerGrid");


    const buttons =
        answerGrid
            ? answerGrid.querySelectorAll(
                ".answer-button"
            )
            : [];


    buttons.forEach(
        function(button, index) {

            button.disabled =
                true;


            if (
                question &&
                index === question.answer
            ) {

                button.classList.add(
                    "correct"
                );
            }
        }
    );


    oneVOneAnsweredQuestions.add(
        battleState.currentQuestion
    );


    updateOneVOneScores();


    setTimeout(
        function() {

            if (
                !battleState.battleActive
            ) {
                return;
            }


            battleState.currentQuestion++;


            showOneVOneQuestion();

        },
        900
    );
}


/* =========================================================
   1V1 SCORES
========================================================= */

function updateOneVOneScores() {

    const playerScore =
        $("oneVOnePlayerScore");

    const opponentScore =
        $("oneVOneOpponentScore");


    if (playerScore) {

        playerScore.textContent =
            battleState.playerScore;
    }


    if (opponentScore) {

        opponentScore.textContent =
            battleState.opponentScore;
    }
}


/* =========================================================
   FINISH 1V1
========================================================= */

async function finishOneVOneBattle() {

    stopBattleTimer();


    if (
        oneVOneResultsRecorded
    ) {

        return;
    }


    battleState.battleActive =
        false;

    oneVOneActive =
        false;


    const arena =
        $("oneVOneArena");

    const results =
        $("battleResults");


    if (arena) {
        arena.hidden = true;
    }

    if (results) {
        results.hidden = false;
    }


    const player =
        Number(
            battleState.playerScore || 0
        );

    const opponent =
        Number(
            battleState.opponentScore || 0
        );


    let title =
        "1v1 Battle Complete";

    let message =
        "Great work!";

    let points =
        player;

    let result =
        "draw";


    if (
        player >
        opponent
    ) {

        title =
            "🏆 Victory!";

        message =
            "You won the 1v1 battle!";

        points =
            player + 25;

        result =
            "win";

    } else if (
        player <
        opponent
    ) {

        title =
            "Keep Studying!";

        message =
            "Your opponent won this round.";

        result =
            "loss";

    } else {

        title =
            "🤝 Draw!";

        message =
            "Both players finished with the same score.";

        points =
            player + 10;

        result =
            "draw";
    }


    /*
     * Only this browser records its own local result.
     */

    oneVOneResultsRecorded =
        true;


    setBattlePoints(
        getBattlePoints() +
        points
    );


    setBattlesUsed(
        getBattlesUsed() + 1
    );


    if ($("battleResultTitle")) {

        $("battleResultTitle")
            .textContent =
            title;
    }


    if ($("battleResultMessage")) {

        $("battleResultMessage")
            .textContent =
            message;
    }


    if ($("finalPlayerScore")) {

        $("finalPlayerScore")
            .textContent =
            player;
    }


    if ($("finalComputerScore")) {

        $("finalComputerScore")
            .textContent =
            opponent;
    }


    if ($("pointsEarned")) {

        $("pointsEarned")
            .textContent =
            `+${points}`;
    }


    if ($("finalOpponentLabel")) {

        $("finalOpponentLabel")
            .textContent =
            "OPPONENT";
    }


    /*
     * Attempt to record the result server-side.
     * If the RPC does not exist, the battle still
     * finishes locally.
     */

    try {

        const client =
            getSupabase();


        if (
            typeof client.rpc ===
            "function"
        ) {

            const {
                error
            } =
                await client.rpc(
                    "finish_game_match",
                    {
                        p_match_id:
                            oneVOneMatchId,

                        p_player_score:
                            player
                    }
                );


            if (error) {

                console.warn(
                    "finish_game_match RPC:",
                    error
                );
            }
        }

    } catch (error) {

        console.warn(
            "Could not record 1v1 result on server:",
            error
        );
    }


    console.log(
        "🏁 1v1 finished:",
        {
            player,
            opponent,
            points,
            result
        }
    );


    updateLeaderboardUI();
}


/* =========================================================
   CANCEL 1V1
========================================================= */

async function cancelOneVOne() {

    clearOneVOnePolling();

    stopBattleTimer();


    const matchId =
        oneVOneMatchId;


    try {

        if (matchId) {

            const client =
                getSupabase();


            const {
                error
            } =
                await client.rpc(
                    "cancel_game_match",
                    {
                        p_match_id:
                            matchId
                    }
                );


            if (error) {

                console.warn(
                    "cancel_game_match:",
                    error
                );
            }
        }

    } catch (error) {

        console.warn(
            "Could not cancel 1v1:",
            error
        );
    }


    await cleanupOneVOneConnection();


    oneVOneMatchId =
        null;

    oneVOnePlayerNumber =
        null;

    oneVOneActive =
        false;

    oneVOneResultsRecorded =
        false;

    oneVOneAnsweredQuestions =
        new Set();


    window.oneVOneArenaStarted =
        false;


    hideMatchmaking();
}


/* =========================================================
   RESET 1V1 ARENA
========================================================= */

function resetOneVOneArena() {

    stopBattleTimer();

    clearOneVOnePolling();

    cleanupOneVOneConnection();


    battleState.battleActive =
        false;

    oneVOneActive =
        false;

    oneVOneMatchId =
        null;

    oneVOnePlayerNumber =
        null;

    oneVOneResultsRecorded =
        false;

    oneVOneAnsweredQuestions =
        new Set();


    window.oneVOneArenaStarted =
        false;


    const arena =
        $("oneVOneArena");


    const results =
        $("battleResults");


    if (arena) {
        arena.hidden = true;
    }

    if (results) {
        results.hidden = true;
    }


    startOneVOneMode();
}


/* =========================================================
   RESET COMPUTER BATTLE
========================================================= */

function resetBattle() {

    stopBattleTimer();


    battleState = {

        mode: null,

        subject: "",

        topic: "",

        difficulty: "mixed",

        questions: [],

        currentQuestion: 0,

        playerScore: 0,

        opponentScore: 0,

        timer:
            QUESTION_TIME_SECONDS,

        timerInterval: null,

        answering: false,

        battleActive: false
    };


    const arena =
        $("battleArena");

    const setup =
        $("battleSetup");

    const results =
        $("battleResults");


    if (arena) {
        arena.hidden = true;
    }

    if (results) {
        results.hidden = true;
    }

    if (setup) {
        setup.hidden = false;
    }


    updateComputerBattleScores();
}


/* =========================================================
   CLEANUP REALTIME
========================================================= */

async function cleanupOneVOneConnection() {

    clearOneVOnePolling();


    try {

        const channel =
            oneVOneChannel ||
            window.oneVOneChannel;


        if (channel) {

            const client =
                getSupabase();


            await client.removeChannel(
                channel
            );
        }

    } catch (error) {

        console.warn(
            "Could not remove 1v1 realtime channel:",
            error
        );
    }


    oneVOneChannel =
        null;


    window.oneVOneChannel =
        null;
}


/* =========================================================
   LEADERBOARD CURRENT USER
========================================================= */

async function getLeaderboardCurrentUser() {

    try {

        return await getCurrentUser();

    } catch (error) {

        console.warn(
            "Could not get leaderboard user:",
            error
        );

        return null;
    }
}


/* =========================================================
   ESCAPE LEADERBOARD HTML
========================================================= */

function escapeLeaderboardHTML(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================================
   LEADERBOARD RANK
========================================================= */

function getLeaderboardRankDisplay(rank) {

    if (rank === 1) {
        return "🥇";
    }

    if (rank === 2) {
        return "🥈";
    }

    if (rank === 3) {
        return "🥉";
    }

    return `#${rank}`;
}


/* =========================================================
   YOUR RANK
========================================================= */

function updateYourLeaderboardRank(
    rank,
    totalPlayers
) {

    const container =
        $("yourLeaderboardRank");


    if (!container) {
        return;
    }


    const span =
        container.querySelector(
            "span"
        );


    const value =
        rank
            ? `#${rank}`
            : "—";


    if (span) {

        span.textContent =
            value;

    } else {

        container.textContent =
            value;
    }


    container.title =
        rank
            ? `Rank ${rank} of ${totalPlayers}`
            : "Not ranked yet";
}


/* =========================================================
   GET GLOBAL LEADERBOARD
========================================================= */

async function getGlobalLeaderboard() {

    const client =
        getSupabase();


    const {
        data,
        error
    } =
        await client
            .from("game_leaderboard")
            .select(`
                user_id,
                display_name,
                battle_points,
                wins,
                losses,
                draws,
                battles_played,
                updated_at,
                battles
            `)
            .order(
                "battle_points",
                {
                    ascending: false
                }
            )
            .order(
                "wins",
                {
                    ascending: false
                }
            )
            .order(
                "battles_played",
                {
                    ascending: true
                }
            );


    if (error) {
        throw error;
    }


    return Array.isArray(data)
        ? data
        : [];
}


/* =========================================================
   UPDATE LEADERBOARD UI
========================================================= */

async function updateLeaderboardUI() {

    const rows =
        $("leaderboardRows");


    if (!rows) {
        return;
    }


    rows.innerHTML = `
        <div class="leaderboard-row">
            <span>⏳</span>
            <span>Loading leaderboard...</span>
            <strong>—</strong>
        </div>
    `;


    try {

        const currentUser =
            await getLeaderboardCurrentUser();


        const currentUserId =
            currentUser?.id ||
            null;


        const leaderboard =
            await getGlobalLeaderboard();


        /*
         * Deduplicate by user ID.
         */

        const uniquePlayers =
            new Map();


        leaderboard.forEach(
            function(player) {

                if (!player?.user_id) {
                    return;
                }


                const userId =
                    String(
                        player.user_id
                    );


                const existing =
                    uniquePlayers.get(
                        userId
                    );


                if (!existing) {

                    uniquePlayers.set(
                        userId,
                        player
                    );

                    return;
                }


                if (
                    Number(
                        player.battle_points || 0
                    ) >
                    Number(
                        existing.battle_points || 0
                    )
                ) {

                    uniquePlayers.set(
                        userId,
                        player
                    );
                }
            }
        );


        const players =
            Array.from(
                uniquePlayers.values()
            );


        /*
         * Sort correctly.
         */

        players.sort(
            function(a, b) {

                const pointsA =
                    Number(
                        a.battle_points || 0
                    );

                const pointsB =
                    Number(
                        b.battle_points || 0
                    );


                if (
                    pointsA !== pointsB
                ) {

                    return (
                        pointsB -
                        pointsA
                    );
                }


                const winsA =
                    Number(
                        a.wins || 0
                    );

                const winsB =
                    Number(
                        b.wins || 0
                    );


                if (
                    winsA !== winsB
                ) {

                    return (
                        winsB -
                        winsA
                    );
                }


                const battlesA =
                    Number(
                        a.battles_played ??
                        a.battles ??
                        0
                    );

                const battlesB =
                    Number(
                        b.battles_played ??
                        b.battles ??
                        0
                    );


                return (
                    battlesA -
                    battlesB
                );
            }
        );


        const totalPlayers =
            $("totalPlayers");


        if (totalPlayers) {

            totalPlayers.textContent =
                players.length;
        }


        if (!players.length) {

            rows.innerHTML = `
                <div class="leaderboard-row">
                    <span>🏆</span>
                    <span>No players yet</span>
                    <strong>0</strong>
                </div>
            `;


            if ($("yourBattlePoints")) {

                $("yourBattlePoints")
                    .textContent =
                    getBattlePoints();
            }


            updateYourLeaderboardRank(
                null,
                0
            );


            return;
        }


        const currentPlayerIndex =
            players.findIndex(
                player =>
                    currentUserId &&
                    String(
                        player.user_id
                    ) ===
                    String(
                        currentUserId
                    )
            );


        if ($("yourBattlePoints")) {

            $("yourBattlePoints")
                .textContent =
                currentPlayerIndex !== -1
                    ? Number(
                        players[
                            currentPlayerIndex
                        ].battle_points || 0
                    )
                    : getBattlePoints();
        }


        rows.innerHTML =
            players
                .map(
                    function(player, index) {

                        const rank =
                            index + 1;


                        const points =
                            Number(
                                player.battle_points || 0
                            );


                        const isYou =
                            Boolean(
                                currentUserId &&
                                String(
                                    player.user_id
                                ) ===
                                String(
                                    currentUserId
                                )
                            );


                        const displayName =
                            player.display_name ||
                            "StudyMind Student";


                        return `
                            <div
                                class="leaderboard-row ${
                                    isYou
                                        ? "current-player"
                                        : ""
                                }"
                                data-rank="${rank}"
                                data-user-id="${escapeLeaderboardHTML(
                                    player.user_id
                                )}"
                            >

                                <span class="leaderboard-rank">
                                    ${getLeaderboardRankDisplay(
                                        rank
                                    )}
                                </span>

                                <span class="leaderboard-player">
                                    ${escapeLeaderboardHTML(
                                        displayName
                                    )}
                                    ${
                                        isYou
                                            ? " <small>(You)</small>"
                                            : ""
                                    }
                                </span>

                                <strong class="leaderboard-points">
                                    ${points}
                                </strong>

                            </div>
                        `;
                    }
                )
                .join("");


        if (
            currentPlayerIndex !==
            -1
        ) {

            updateYourLeaderboardRank(
                currentPlayerIndex + 1,
                players.length
            );

        } else {

            const localPoints =
                getBattlePoints();


            const calculatedRank =
                players.filter(
                    player =>
                        Number(
                            player.battle_points || 0
                        ) >
                        localPoints
                ).length + 1;


            updateYourLeaderboardRank(
                calculatedRank,
                players.length + 1
            );
        }


    } catch (error) {

        console.error(
            "GLOBAL LEADERBOARD ERROR:",
            error
        );


        rows.innerHTML = `
            <div class="leaderboard-row">
                <span>⚠️</span>
                <span>Leaderboard temporarily unavailable</span>
                <strong>—</strong>
            </div>
        `;
    }
}


/* =========================================================
   REFRESH LEADERBOARD
========================================================= */

async function refreshLeaderboard() {

    await updateLeaderboardUI();
}


/* =========================================================
   LEADERBOARD REALTIME
========================================================= */

async function subscribeToLeaderboard() {

    try {

        const client =
            getSupabase();


        if (
            leaderboardRealtimeChannel
        ) {

            try {

                await client.removeChannel(
                    leaderboardRealtimeChannel
                );

            } catch (_) {}


            leaderboardRealtimeChannel =
                null;
        }


        leaderboardRealtimeChannel =
            client
                .channel(
                    "global-game-leaderboard"
                )
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table:
                            "game_leaderboard"
                    },
                    function() {

                        setTimeout(
                            function() {

                                updateLeaderboardUI();

                            },
                            300
                        );
                    }
                )
                .subscribe(
                    function(status) {

                        console.log(
                            "Leaderboard realtime:",
                            status
                        );
                    }
                );

    } catch (error) {

        console.warn(
            "Leaderboard realtime subscription failed:",
            error
        );
    }
}


/* =========================================================
   INITIALIZE LEADERBOARD
========================================================= */

async function initializeLeaderboard() {

    await updateLeaderboardUI();

    await subscribeToLeaderboard();
}


/* =========================================================
   PREMIUM
========================================================= */

function openPremium() {

    alert(
        "Premium will give you unlimited Game Mode battles."
    );
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
        "home.html#newStudyPlan";
}


function openSummarizer() {

    window.location.href =
        "dashboard.html#summarizer";
}


function openStudyStreak() {

    window.location.href =
        "dashboard.html#studyStreak";
}


function openStudyScore() {

    window.location.href =
        "dashboard.html#studyScore";
}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutStudyMind() {

    try {

        const client =
            getSupabase();


        await client.auth.signOut();

    } catch (error) {

        console.warn(
            "Supabase logout error:",
            error
        );
    }


    localStorage.removeItem(
        "studyMindCurrentUser"
    );


    window.location.href =
        "index.html";
}


/* =========================================================
   THEME
========================================================= */

function toggleGameTheme() {

    const body =
        document.body;


    const isLight =
        body.classList.contains(
            "light-mode"
        );


    if (isLight) {

        body.classList.remove(
            "light-mode"
        );


        localStorage.setItem(
            GAME_STORAGE.theme,
            "dark"
        );

    } else {

        body.classList.add(
            "light-mode"
        );


        localStorage.setItem(
            GAME_STORAGE.theme,
            "light"
        );
    }


    updateThemeButton();
}


/* =========================================================
   THEME BUTTON
========================================================= */

function updateThemeButton() {

    const button =
        $("themeButton");


    if (!button) {
        return;
    }


    button.textContent =
        document.body.classList.contains(
            "light-mode"
        )
            ? "☀️ Light Mode"
            : "🌙 Dark Mode";
}


/* =========================================================
   LOAD SAVED THEME
========================================================= */

function loadSavedTheme() {

    const saved =
        localStorage.getItem(
            GAME_STORAGE.theme
        );


    if (
        saved ===
        "light"
    ) {

        document.body.classList.add(
            "light-mode"
        );

    } else {

        document.body.classList.remove(
            "light-mode"
        );
    }


    updateThemeButton();
}


/* =========================================================
   CLEAN ERROR
========================================================= */

function cleanErrorMessage(
    message
) {

    if (!message) {

        return (
            "Unknown server error."
        );
    }


    let text =
        String(message)
            .replace(
                /<[^>]*>/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();


    if (
        text.length >
        500
    ) {

        text =
            text.slice(
                0,
                500
            ) +
            "...";
    }


    return text;
}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        console.log(
            "🎮 Initializing StudyMind Game Mode..."
        );


        /*
         * Theme.
         */

        loadSavedTheme();


        /*
         * Subjects and topics.
         */

        populateGameSubjects();


        /*
         * 1v1 subject.
         */

        const oneVOneSubject =
            $("oneVOneSubject");


        if (oneVOneSubject) {

            oneVOneSubject.addEventListener(
                "change",
                handleOneVOneSubjectChange
            );
        }


        /*
         * 1v1 topic.
         */

        const oneVOneTopic =
            $("oneVOneTopic");


        if (oneVOneTopic) {

            oneVOneTopic.addEventListener(
                "change",
                updateFindOpponentButton
            );
        }


        /*
         * Computer battle subject.
         */

        const battleSubject =
            $("battleSubject");


        if (battleSubject) {

            battleSubject.addEventListener(
                "change",
                handleBattleSubjectChange
            );
        }


        /*
         * Find opponent button.
         */

        const findButton =
            $("findOpponentButton");


        if (findButton) {

            findButton.addEventListener(
                "click",
                findOneVOneOpponent
            );
        }


        /*
         * Initialize button state.
         */

        updateFindOpponentButton();


        /*
         * Load leaderboard.
         */

        try {

            await initializeLeaderboard();

        } catch (error) {

            console.warn(
                "Leaderboard initialization failed:",
                error
            );
        }


        console.log(
            "✅ StudyMind Game Mode initialized."
        );
    }
);


/* =========================================================
   GLOBAL EXPORTS
========================================================= */

window.startComputerBattle =
    startComputerBattle;

window.beginBattle =
    startComputerBattle;

window.startOneVOneMode =
    startOneVOneMode;

window.findOneVOneOpponent =
    findOneVOneOpponent;

window.joinExistingMatch =
    joinExistingMatch;

window.cancelOneVOne =
    cancelOneVOne;

window.resetOneVOneArena =
    resetOneVOneArena;

window.resetBattle =
    resetBattle;

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

window.openPremium =
    openPremium;

window.logoutStudyMind =
    logoutStudyMind;

window.toggleGameTheme =
    toggleGameTheme;

window.updateThemeButton =
    updateThemeButton;

window.refreshLeaderboard =
    refreshLeaderboard;

window.updateLeaderboardUI =
    updateLeaderboardUI;

window.populateGameSubjects =
    populateGameSubjects;

window.populateOneVOneTopics =
    populateOneVOneTopics;

window.populateBattleTopics =
    populateBattleTopics;

window.SUBJECT_DATABASE =
    SUBJECT_DATABASE;

window.getBattlePoints =
    getBattlePoints;

window.setBattlePoints =
    setBattlePoints;

window.getBattlesUsed =
    getBattlesUsed;

window.setBattlesUsed =
    setBattlesUsed;

window.FREE_BATTLE_LIMIT =
    FREE_BATTLE_LIMIT;

window.QUESTIONS_PER_BATTLE =
    QUESTIONS_PER_BATTLE;

window.QUESTION_TIME_SECONDS =
    QUESTION_TIME_SECONDS;

console.log(
    "✅ StudyMind Game Mode JS loaded successfully."
);

