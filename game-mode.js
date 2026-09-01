/* =========================================================
   STUDYMIND AI — GAME MODE
   COMPLETE CORRECTED REPLACEMENT
   =========================================================
   FEATURES
   • Computer Battle
   • 1v1 matchmaking
   • 10 questions per battle
   • 15-second question timer
   • Free 5-battle limit
   • TEST ACCOUNT unlimited battles
   • Premium unlimited battles
   • Battle points
   • Wins / losses / draws
   • Global leaderboard
   • Realtime leaderboard refresh
   • Realtime 1v1 match updates
   • Subject + topic selection
   • Navigation
   • Safe Supabase handling
========================================================= */


/* =========================================================
   ELEMENT HELPER
========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   CONSTANTS
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


/*
 * TEST ACCOUNT
 *
 * A Supabase user can be marked as a test account by adding:
 *
 * {
 *     "is_test_account": true
 * }
 *
 * to that user's auth metadata.
 *
 * This is deliberately NOT stored in localStorage because
 * localStorage can be changed by any user from their browser.
 */
const TEST_ACCOUNT_METADATA_KEYS = [
    "is_test_account",
    "isTestAccount",
    "test_account",
    "testAccount"
];


/* =========================================================
   BATTLE STATE
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

    if (!data?.user) {
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

    const metadata = user.user_metadata || {};

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
   TEST ACCOUNT DETECTION
========================================================= */

function isTestAccount(user) {

    if (!user) {
        return false;
    }

    const metadata =
        user.user_metadata || {};

    return TEST_ACCOUNT_METADATA_KEYS.some(
        key => {

            const value =
                metadata[key];

            return (
                value === true ||
                value === "true" ||
                value === 1 ||
                value === "1"
            );
        }
    );
}


/*
 * This helper gets the currently authenticated user and checks
 * whether the account is a designated test account.
 */
async function isCurrentUserTestAccount() {

    try {

        const user =
            await getCurrentUser();

        return isTestAccount(user);

    } catch (error) {

        console.warn(
            "Could not determine test-account status:",
            error
        );

        return false;
    }
}


/* =========================================================
   NORMALIZE SUBJECT
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
        Object.keys(SUBJECT_DATABASE).find(
            name =>
                name.toLowerCase() === cleaned
        );

    return match || String(subject).trim();
}


/* =========================================================
   SUBJECT DROPDOWNS
========================================================= */

function populateGameSubjects() {

    const selectors = [
        $("oneVOneSubject"),
        $("battleSubject")
    ].filter(Boolean);

    selectors.forEach(select => {

        const currentValue = select.value;

        select.innerHTML =
            '<option value="">Select subject</option>';

        Object.keys(SUBJECT_DATABASE).forEach(subject => {

            const option =
                document.createElement("option");

            option.value = subject;
            option.textContent = subject;

            select.appendChild(option);
        });

        if (
            currentValue &&
            SUBJECT_DATABASE[currentValue]
        ) {
            select.value = currentValue;
        }
    });

    populateOneVOneTopics();
    populateBattleTopics();
}


/* =========================================================
   1V1 TOPICS
========================================================= */

function populateOneVOneTopics() {

    const subject = $("oneVOneSubject");
    const topic = $("oneVOneTopic");

    if (!subject || !topic) {
        return;
    }

    const selectedSubject =
        normalizeSubjectName(subject.value);

    const currentTopic = topic.value;

    topic.innerHTML =
        '<option value="">Select topic</option>';

    const topics =
        SUBJECT_DATABASE[selectedSubject] || [];

    topics.forEach(topicName => {

        const option =
            document.createElement("option");

        option.value = topicName;
        option.textContent = topicName;

        topic.appendChild(option);
    });

    if (topics.includes(currentTopic)) {
        topic.value = currentTopic;
    }
}


/* =========================================================
   COMPUTER TOPICS
========================================================= */

function populateBattleTopics() {

    const subject = $("battleSubject");
    const topic = $("battleTopic");

    if (!subject || !topic) {
        return;
    }

    const selectedSubject =
        normalizeSubjectName(subject.value);

    const currentTopic = topic.value;

    topic.innerHTML =
        '<option value="">Select topic</option>';

    const topics =
        SUBJECT_DATABASE[selectedSubject] || [];

    topics.forEach(topicName => {

        const option =
            document.createElement("option");

        option.value = topicName;
        option.textContent = topicName;

        topic.appendChild(option);
    });

    if (topics.includes(currentTopic)) {
        topic.value = currentTopic;
    }
}


/* =========================================================
   SUBJECT CHANGE HANDLERS
========================================================= */

function handleOneVOneSubjectChange() {

    populateOneVOneTopics();
    updateFindOpponentButton();
}


function handleBattleSubjectChange() {

    populateBattleTopics();
}


/* =========================================================
   1V1 BUTTON
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
        !topic ||
        !!oneVOneMatchId;
}


/* =========================================================
   VALUES
========================================================= */

function oneVOneSubjectValue() {

    return normalizeSubjectName(
        $("oneVOneSubject")?.value || ""
    );
}


function oneVOneTopicValue() {

    return (
        $("oneVOneTopic")?.value || ""
    ).trim();
}


function oneVOneDifficultyValue() {

    return (
        $("oneVOneDifficulty")?.value ||
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
   FREE BATTLE COUNT
========================================================= */

function getBattlesUsed() {

    const value =
        Number(
            localStorage.getItem(
                GAME_STORAGE.battleCount
            )
        );

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

    const value =
        Number(
            localStorage.getItem(
                GAME_STORAGE.battlePoints
            )
        );

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
   ACCOUNT ACCESS TYPE
========================================================= */

async function getBattleAccessType() {

    const user =
        await getCurrentUser();

    if (isTestAccount(user)) {
        return "test";
    }

    if (isPremiumUser()) {
        return "premium";
    }

    return "free";
}


/* =========================================================
   UPDATE BATTLE COUNT UI
========================================================= */

async function updateBattleLimitUI() {

    const used =
        getBattlesUsed();

    const remaining =
        Math.max(
            0,
            FREE_BATTLE_LIMIT - used
        );

    let accessType =
        "free";

    try {

        accessType =
            await getBattleAccessType();

    } catch (_) {}


    const unlimited =
        accessType === "test" ||
        accessType === "premium";


    const ids = [
        "freeBattlesRemaining",
        "battlesRemaining",
        "battleCount",
        "freeBattleCount"
    ];

    ids.forEach(id => {

        const element = $(id);

        if (!element) {
            return;
        }

        element.textContent =
            unlimited
                ? "Unlimited"
                : remaining;
    });


    /*
     * Optional status elements.
     */
    const statusIds = [
        "battleLimitMessage",
        "freeBattleMessage",
        "battleAccessStatus"
    ];

    statusIds.forEach(id => {

        const element = $(id);

        if (!element) {
            return;
        }

        if (accessType === "test") {

            element.textContent =
                "Test Account — Unlimited Battles";

        } else if (accessType === "premium") {

            element.textContent =
                "Premium — Unlimited Battles";

        } else {

            element.textContent =
                `${remaining} free battle${remaining === 1 ? "" : "s"} remaining`;
        }
    });
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

async function canStartBattle() {

    try {

        const user =
            await getCurrentUser();


        /*
         * TEST ACCOUNT:
         *
         * Unlimited battles.
         *
         * This check happens BEFORE the free limit.
         */

        if (isTestAccount(user)) {

            console.log(
                "Game Mode: test account detected — unlimited battles enabled."
            );

            return true;
        }


        /*
         * PREMIUM:
         *
         * Unlimited battles.
         */

        if (isPremiumUser()) {

            return true;
        }


        /*
         * NORMAL FREE ACCOUNT:
         *
         * Enforce the 5-battle limit.
         */

        if (
            getBattlesUsed() >=
            FREE_BATTLE_LIMIT
        ) {

            showPremiumMessage();

            return false;
        }


        return true;

    } catch (error) {

        console.error(
            "Battle access check failed:",
            error
        );

        alert(
            "We could not verify your Game Mode access. Please refresh the page and try again."
        );

        return false;
    }
}


/* =========================================================
   INCREMENT BATTLE COUNT
========================================================= */

async function recordBattleUsage() {

    try {

        const user =
            await getCurrentUser();


        /*
         * TEST ACCOUNT:
         *
         * Do NOT consume one of the 5 free battles.
         */

        if (isTestAccount(user)) {

            console.log(
                "Test account battle completed — free battle count not increased."
            );

            await updateBattleLimitUI();

            return;
        }


        /*
         * PREMIUM:
         *
         * Premium battles are unlimited and therefore
         * should not consume the free battle counter.
         */

        if (isPremiumUser()) {

            await updateBattleLimitUI();

            return;
        }


        /*
         * NORMAL FREE USER:
         *
         * Consume one free battle.
         */

        setBattlesUsed(
            getBattlesUsed() + 1
        );

        await updateBattleLimitUI();

    } catch (error) {

        console.warn(
            "Could not record battle usage:",
            error
        );
    }
}


/* =========================================================
   CLEAN ERROR
========================================================= */

function cleanErrorMessage(message) {

    if (!message) {
        return "Something went wrong. Please try again.";
    }

    const text =
        String(message);

    if (
        text.includes(
            "infinite recursion detected"
        )
    ) {

        return (
            "The 1v1 database security policy is blocking matchmaking. " +
            "The Game Mode JavaScript is working, but the Supabase policy needs to be fixed."
        );
    }

    if (
        text.includes(
            "invalid response"
        )
    ) {

        return (
            "The AI question service returned an invalid response. " +
            "Please try the battle again."
        );
    }

    return text;
}


/* =========================================================
   QUESTION NORMALIZER
========================================================= */

function normalizeQuestionArray(data) {

    let questions = [];

    if (Array.isArray(data)) {

        questions = data;

    } else if (
        Array.isArray(data?.questions)
    ) {

        questions = data.questions;

    } else if (
        Array.isArray(data?.data)
    ) {

        questions = data.data;

    } else if (
        Array.isArray(data?.result)
    ) {

        questions = data.result;

    } else if (
        Array.isArray(data?.items)
    ) {

        questions = data.items;
    }


    return questions
        .map(item => {

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
                        : Array.isArray(item.answers)
                            ? item.answers
                            : [];


            options =
                options.map(
                    option =>
                        typeof option === "object"
                            ? String(
                                option.text ||
                                option.label ||
                                option.value ||
                                ""
                            )
                            : String(option)
                );


            let answer =
                item.answer ??
                item.correctAnswer ??
                item.correct_answer ??
                item.correctOption ??
                item.correct_option;


            if (
                typeof answer === "object" &&
                answer !== null
            ) {

                answer =
                    answer.index ??
                    answer.value ??
                    answer.text ??
                    answer.label;
            }


            if (
                typeof answer === "string"
            ) {

                const cleaned =
                    answer.trim();

                const upper =
                    cleaned.toUpperCase();


                if (
                    /^[A-D]$/.test(upper)
                ) {

                    answer =
                        upper.charCodeAt(0) -
                        65;

                } else {

                    const numeric =
                        Number(cleaned);

                    if (
                        Number.isInteger(numeric)
                    ) {

                        answer =
                            numeric;

                    } else {

                        const found =
                            options.findIndex(
                                option =>
                                    option
                                        .trim()
                                        .toLowerCase() ===
                                    cleaned
                                        .toLowerCase()
                            );

                        if (found >= 0) {
                            answer = found;
                        }
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
   GENERATE BATTLE QUESTIONS
========================================================= */

async function generateBattleQuestions(
    subject,
    topic,
    difficulty = "mixed"
) {

    const generators = [
        window.generateGameQuestions,
        window.generateBattleQuestionsAI,
        window.createBattleQuestions,
        window.generateAIQuestions
    ];

    for (
        const generator of generators
    ) {

        if (
            typeof generator !== "function" ||
            generator === generateBattleQuestions
        ) {
            continue;
        }

        try {

            const result =
                await generator(
                    subject,
                    topic,
                    difficulty,
                    QUESTIONS_PER_BATTLE
                );

            const questions =
                normalizeQuestionArray(result);

            if (
                questions.length >=
                QUESTIONS_PER_BATTLE
            ) {

                return questions.slice(
                    0,
                    QUESTIONS_PER_BATTLE
                );
            }

        } catch (error) {

            console.warn(
                "Existing question generator failed:",
                error
            );
        }
    }


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

                                mode:
                                    "battle"
                            })
                    }
                );


            if (!response.ok) {
                continue;
            }


            const data =
                await response.json();


            const questions =
                normalizeQuestionArray(data);


            if (
                questions.length >=
                QUESTIONS_PER_BATTLE
            ) {

                return questions.slice(
                    0,
                    QUESTIONS_PER_BATTLE
                );
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
   COMPUTER BATTLE START
========================================================= */

async function startComputerBattle() {

    if (!(await canStartBattle())) {
        return;
    }


    const subject =
        normalizeSubjectName(
            $("battleSubject")?.value || ""
        );

    const topic =
        $("battleTopic")?.value || "";

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

    if (arena) {
        arena.hidden = false;
    }

    if (results) {
        results.hidden = true;
    }


    const loading =
        $("battleLoading");

    if (loading) {
        loading.hidden = false;
    }


    try {

        const questions =
            await generateBattleQuestions(
                subject,
                topic,
                difficulty
            );


        if (
            questions.length <
            QUESTIONS_PER_BATTLE
        ) {

            throw new Error(
                "The AI returned fewer than 10 valid questions."
            );
        }


        battleState.questions =
            questions.slice(
                0,
                QUESTIONS_PER_BATTLE
            );

        battleState.battleActive =
            true;


        if (loading) {
            loading.hidden = true;
        }


        updateComputerBattleScores();

        showComputerQuestion();

    } catch (error) {

        console.error(
            "Computer Battle error:",
            error
        );


        battleState.battleActive =
            false;

        stopBattleTimer();


        if (loading) {
            loading.hidden = true;
        }

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
    ].forEach(id => {

        const element = $(id);

        if (element) {
            element.textContent =
                questionNumber;
        }
    });


    [
        "battleQuestionTopic",
        "questionTopic"
    ].forEach(id => {

        const element = $(id);

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
        (option, index) => {

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

            button.dataset.index =
                String(index);

            button.addEventListener(
                "click",
                () => {

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
        (button, index) => {

            button.disabled =
                true;

            if (
                index === question.answer
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

        battleState.playerScore += 10;

    } else {

        if (
            Math.random() < 0.65
        ) {

            battleState.opponentScore += 10;
        }
    }


    updateComputerBattleScores();


    setTimeout(() => {

        if (!battleState.battleActive) {
            return;
        }

        battleState.currentQuestion++;

        showComputerQuestion();

    }, 900);
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
        (button, index) => {

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

        battleState.opponentScore += 10;
    }


    updateComputerBattleScores();


    setTimeout(() => {

        if (!battleState.battleActive) {
            return;
        }

        battleState.currentQuestion++;

        showComputerQuestion();

    }, 900);
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
        setInterval(() => {

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

        }, 1000);
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


    ids.forEach(id => {

        const element = $(id);

        if (element) {

            element.textContent =
                Math.max(
                    0,
                    battleState.timer
                );
        }
    });
}


/* =========================================================
   COMPUTER SCORE UI
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
   RECORD COMPUTER RESULT
========================================================= */

async function recordComputerResult(
    result,
    points
) {

    try {

        const user =
            await getCurrentUser();

        const client =
            getSupabase();

        await updateLeaderboardRecord(
            client,
            user,
            result,
            points
        );

    } catch (error) {

        console.warn(
            "Could not update global leaderboard:",
            error
        );
    }
}


/* =========================================================
   UPDATE LEADERBOARD RECORD
========================================================= */

async function updateLeaderboardRecord(
    client,
    user,
    result,
    points
) {

    const displayName =
        getDisplayName(user);


    const {
        data: existing,
        error: selectError
    } =
        await client
            .from("game_leaderboard")
            .select(
                "user_id,display_name,battle_points,wins,losses,draws,battles_played"
            )
            .eq(
                "user_id",
                user.id
            )
            .maybeSingle();


    if (selectError) {
        throw selectError;
    }


    const current =
        existing || {};


    const update = {

        user_id:
            user.id,

        display_name:
            displayName,

        battle_points:
            Number(
                current.battle_points || 0
            ) +
            Number(points || 0),

        wins:
            Number(
                current.wins || 0
            ) +
            (
                result === "win"
                    ? 1
                    : 0
            ),

        losses:
            Number(
                current.losses || 0
            ) +
            (
                result === "loss"
                    ? 1
                    : 0
            ),

        draws:
            Number(
                current.draws || 0
            ) +
            (
                result === "draw"
                    ? 1
                    : 0
            ),

        battles_played:
            Number(
                current.battles_played || 0
            ) + 1,

        updated_at:
            new Date().toISOString()
    };


    const {
        error: upsertError
    } =
        await client
            .from("game_leaderboard")
            .upsert(
                update,
                {
                    onConflict:
                        "user_id"
                }
            );


    if (upsertError) {
        throw upsertError;
    }
}


/* =========================================================
   FINISH COMPUTER BATTLE
========================================================= */

async function finishComputerBattle() {

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
        0;

    let result =
        "draw";


    if (player > opponent) {

        title =
            "🏆 Victory!";

        message =
            "You won the battle!";

        points =
            player + 25;

        result =
            "win";

    } else if (player < opponent) {

        title =
            "Keep Studying!";

        message =
            "The computer won this round.";

        points =
            player;

        result =
            "loss";

    } else {

        title =
            "🤝 Draw!";

        message =
            "You finished with the same score.";

        points =
            player + 10;

        result =
            "draw";
    }


    setBattlePoints(
        getBattlePoints() +
        points
    );


    /*
     * IMPORTANT:
     *
     * This now respects the test account and Premium
     * bypass. Only normal free users consume one battle.
     */

    await recordBattleUsage();


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


    await recordComputerResult(
        result,
        points
    );


    await updateLeaderboardUI();
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

        button.disabled = true;

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

        button.textContent =
            "⚔️ Find Opponent";

        updateFindOpponentButton();
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
   CLEAR POLLING
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

    if (!(await canStartBattle())) {
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
            waitingMatches?.[0] || null;


        if (existingMatch) {

            await joinExistingMatch(
                existingMatch
            );

            return;
        }


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
                async () => {

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

async function joinExistingMatch(
    match
) {

    const client =
        getSupabase();

    const user =
        await getCurrentUser();


    oneVOneMatchId =
        normalizeMatchId(match);


    if (!oneVOneMatchId) {

        throw new Error(
            "The waiting match does not have a valid ID."
        );
    }


    oneVOnePlayerNumber =
        2;

    oneVOneActive =
        false;

    oneVOneResultsRecorded =
        false;

    oneVOneAnsweredQuestions =
        new Set();


    console.log(
        "Joining existing 1v1 match:",
        oneVOneMatchId
    );


    const rpcNames = [
        "join_game_match",
        "join_1v1_match",
        "join_game_match_room"
    ];


    let joined =
        false;

    let lastError =
        null;


    for (
        const rpcName of rpcNames
    ) {

        try {

            const {
                error
            } =
                await client.rpc(
                    rpcName,
                    {
                        p_match_id:
                            oneVOneMatchId,

                        p_display_name:
                            oneVOneMyName
                    }
                );


            if (!error) {

                joined =
                    true;

                break;
            }


            lastError =
                error;

        } catch (error) {

            lastError =
                error;
        }
    }


    if (!joined) {

        try {

            const {
                error
            } =
                await client
                    .from("game_match_players")
                    .insert({
                        match_id:
                            oneVOneMatchId,

                        user_id:
                            user.id,

                        display_name:
                            oneVOneMyName,

                        player_number:
                            2
                    });


            if (!error) {

                joined =
                    true;

            } else {

                lastError =
                    error;
            }

        } catch (error) {

            lastError =
                error;
        }
    }


    if (!joined) {

        throw lastError ||
            new Error(
                "Unable to join the 1v1 waiting room."
            );
    }


    await subscribeToOneVOne(
        oneVOneMatchId
    );


    clearOneVOnePolling();


    updateMatchmakingText(
        "Opponent found! ⚔️",
        "Preparing your battle..."
    );


    setTimeout(
        () => {

            checkMatchPlayers();

        },
        500
    );
}


/* =========================================================
   CHECK MATCH PLAYERS
========================================================= */

async function checkMatchPlayers() {

    if (!oneVOneMatchId) {
        return;
    }


    const client =
        getSupabase();


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
        return;
    }


    if (
        match.status === "active" ||
        match.status === "in_progress" ||
        match.status === "started"
    ) {

        clearOneVOnePolling();

        if (!oneVOneActive) {
            await startOneVOneBattle(match);
        }

        return;
    }


    const {
        data: players,
        error: playersError
    } =
        await client
            .from("game_match_players")
            .select("*")
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


    if (
        players &&
        players.length >= 2
    ) {

        clearOneVOnePolling();

        updateMatchmakingText(
            "Opponent found! ⚔️",
            "Starting your battle..."
        );


        await tryStartOneVOneMatch();


        setTimeout(
            () => {

                checkMatchPlayers();

            },
            600
        );

        return;
    }


    updateMatchmakingText(
        "Looking for an opponent...",
        "Waiting for another student to join."
    );
}


/* =========================================================
   START MATCH RPC
========================================================= */

async function tryStartOneVOneMatch() {

    if (!oneVOneMatchId) {
        return false;
    }


    const client =
        getSupabase();


    const rpcNames = [
        "start_game_match",
        "start_1v1_match",
        "start_game_match_battle"
    ];


    for (
        const rpcName of rpcNames
    ) {

        try {

            const {
                error
            } =
                await client.rpc(
                    rpcName,
                    {
                        p_match_id:
                            oneVOneMatchId
                    }
                );


            if (!error) {
                return true;
            }

        } catch (error) {

            console.warn(
                `RPC ${rpcName} unavailable:`,
                error
            );
        }
    }


    return false;
}


/* =========================================================
   SUBSCRIBE TO 1V1
========================================================= */

async function subscribeToOneVOne(
    matchId
) {

    const client =
        getSupabase();


    if (oneVOneChannel) {

        try {

            await client.removeChannel(
                oneVOneChannel
            );

        } catch (_) {}

        oneVOneChannel =
            null;
    }


    oneVOneChannel =
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
                payload => {

                    console.log(
                        "1v1 match realtime update:",
                        payload
                    );

                    if (
                        payload.new
                    ) {

                        handleMatchRealtimeUpdate(
                            payload.new
                        );
                    }
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "game_match_players",
                    filter:
                        `match_id=eq.${matchId}`
                },
                payload => {

                    console.log(
                        "1v1 player realtime update:",
                        payload
                    );

                    checkMatchPlayers()
                        .catch(
                            console.warn
                        );
                }
            )
            .subscribe(
                status => {

                    console.log(
                        "1v1 realtime status:",
                        status
                    );
                }
            );
}


/* =========================================================
   HANDLE MATCH REALTIME UPDATE
========================================================= */

function handleMatchRealtimeUpdate(
    match
) {

    if (!match) {
        return;
    }


    if (
        match.status === "active" ||
        match.status === "in_progress" ||
        match.status === "started"
    ) {

        if (!oneVOneActive) {

            startOneVOneBattle(
                match
            ).catch(
                console.error
            );
        }

        return;
    }


    if (
        match.status === "completed" ||
        match.status === "finished"
    ) {

        handleOneVOneFinishedMatch(
            match
        ).catch(
            console.error
        );
    }
}


/* =========================================================
   START 1V1 BATTLE
========================================================= */

async function startOneVOneBattle(
    match
) {

    if (oneVOneActive) {
        return;
    }


    oneVOneActive =
        true;

    oneVOneResultsRecorded =
        false;

    clearOneVOnePolling();


    const subject =
        normalizeSubjectName(
            match?.subject ||
            oneVOneSubjectValue()
        );

    const topic =
        match?.topic ||
        oneVOneTopicValue();

    const difficulty =
        match?.difficulty ||
        oneVOneDifficultyValue();


    battleState = {

        mode: "1v1",

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


    updateMatchmakingText(
        "Battle ready! ⚔️",
        "Generating your questions..."
    );


    const oneVOneSetup =
        $("oneVOneSetup");

    const oneVOneArena =
        $("oneVOneArena");


    if (oneVOneSetup) {
        oneVOneSetup.hidden = true;
    }

    if (oneVOneArena) {
        oneVOneArena.hidden = false;
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


        updateOneVOneScores();

        showOneVOneQuestion();

    } catch (error) {

        console.error(
            "Unable to start 1v1 battle:",
            error
        );


        battleState.battleActive =
            false;

        oneVOneActive =
            false;


        alert(
            cleanErrorMessage(
                error?.message
            )
        );
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

        finishLocalOneVOne();

        return;
    }


    battleState.answering =
        false;


    const number =
        battleState.currentQuestion + 1;


    [
        "oneVOneQuestionNumber",
        "oneVOneCurrentQuestion",
        "oneVOneQuestionCount"
    ].forEach(id => {

        const element = $(id);

        if (element) {
            element.textContent =
                number;
        }
    });


    [
        "oneVOneQuestion",
        "oneVOneQuestionText"
    ].forEach(id => {

        const element = $(id);

        if (element) {
            element.textContent =
                question.question;
        }
    });


    [
        "oneVOneTopic",
        "oneVOneBattleTopic"
    ].forEach(id => {

        const element = $(id);

        if (
            element &&
            element.tagName !== "SELECT"
        ) {

            element.textContent =
                battleState.topic;
        }
    });


    const answerGrid =
        $("oneVOneAnswerGrid");


    if (!answerGrid) {

        const fallback =
            $("answerGrid");

        if (fallback) {

            renderOneVOneAnswers(
                fallback,
                question
            );

            startBattleTimer();

            return;
        }


        throw new Error(
            "The 1v1 answer grid is missing from game-mode.html."
        );
    }


    renderOneVOneAnswers(
        answerGrid,
        question
    );


    updateOneVOneScores();

    startBattleTimer();
}


/* =========================================================
   RENDER 1V1 ANSWERS
========================================================= */

function renderOneVOneAnswers(
    container,
    question
) {

    container.innerHTML = "";


    question.options.forEach(
        (option, index) => {

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
                () => {

                    answerOneVOneQuestion(
                        index
                    );
                }
            );

            container.appendChild(
                button
            );
        }
    );
}


/* =========================================================
   ANSWER 1V1 QUESTION
========================================================= */

async function answerOneVOneQuestion(
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


    if (
        oneVOneAnsweredQuestions.has(
            battleState.currentQuestion
        )
    ) {
        return;
    }


    oneVOneAnsweredQuestions.add(
        battleState.currentQuestion
    );


    const correct =
        selectedIndex ===
        question.answer;


    if (correct) {

        battleState.playerScore +=
            10;
    }


    const answerGrid =
        $("oneVOneAnswerGrid") ||
        $("answerGrid");


    const buttons =
        answerGrid
            ?.querySelectorAll(
                ".answer-button"
            ) || [];


    buttons.forEach(
        (button, index) => {

            button.disabled =
                true;

            if (
                index === question.answer
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


    updateOneVOneScores();


    await publishOneVOneAnswer(
        battleState.currentQuestion,
        correct,
        battleState.playerScore
    );


    setTimeout(
        () => {

            if (
                !battleState.battleActive
            ) {
                return;
            }

            battleState.currentQuestion++;

            showOneVOneQuestion();

        },
        700
    );
}


/* =========================================================
   1V1 TIMEOUT
========================================================= */

async function handleOneVOneTimeout() {

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
            ?.querySelectorAll(
                ".answer-button"
            ) || [];


    buttons.forEach(
        (button, index) => {

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


    await publishOneVOneAnswer(
        battleState.currentQuestion,
        false,
        battleState.playerScore
    );


    setTimeout(
        () => {

            if (
                !battleState.battleActive
            ) {
                return;
            }

            battleState.currentQuestion++;

            showOneVOneQuestion();

        },
        700
    );
}


/* =========================================================
   PUBLISH 1V1 ANSWER
========================================================= */

async function publishOneVOneAnswer(
    questionIndex,
    correct,
    score
) {

    if (!oneVOneMatchId) {
        return;
    }


    const client =
        getSupabase();


    const rpcNames = [
        "submit_game_match_answer",
        "submit_1v1_answer",
        "update_game_match_score"
    ];


    for (
        const rpcName of rpcNames
    ) {

        try {

            const {
                error
            } =
                await client.rpc(
                    rpcName,
                    {
                        p_match_id:
                            oneVOneMatchId,

                        p_question_index:
                            questionIndex,

                        p_correct:
                            correct,

                        p_score:
                            score
                    }
                );


            if (!error) {
                return;
            }

        } catch (error) {

            console.warn(
                `Answer RPC ${rpcName} failed:`,
                error
            );
        }
    }
}


/* =========================================================
   UPDATE 1V1 SCORES
========================================================= */

function updateOneVOneScores() {

    const myScore =
        battleState.playerScore;

    const opponentScore =
        battleState.opponentScore;


    const myIds = [
        "oneVOnePlayerScore",
        "oneVOneMyScore",
        "player1Score"
    ];


    const opponentIds = [
        "oneVOneOpponentScore",
        "oneVOneEnemyScore",
        "player2Score"
    ];


    myIds.forEach(id => {

        const element = $(id);

        if (element) {
            element.textContent =
                myScore;
        }
    });


    opponentIds.forEach(id => {

        const element = $(id);

        if (element) {
            element.textContent =
                opponentScore;
        }
    });
}


/* =========================================================
   FINISH LOCAL 1V1
========================================================= */

async function finishLocalOneVOne() {

    stopBattleTimer();

    battleState.battleActive =
        false;


    if (
        oneVOneResultsRecorded
    ) {
        return;
    }


    oneVOneResultsRecorded =
        true;


    const myScore =
        Number(
            battleState.playerScore || 0
        );


    const opponentScore =
        Number(
            battleState.opponentScore || 0
        );


    let result =
        "draw";

    let points =
        10;

    let title =
        "🤝 Draw!";

    let message =
        "The battle ended in a draw.";


    if (
        myScore >
        opponentScore
    ) {

        result =
            "win";

        points =
            myScore + 25;

        title =
            "🏆 Victory!";

        message =
            "You won the 1v1 battle!";

    } else if (
        myScore <
        opponentScore
    ) {

        result =
            "loss";

        points =
            myScore;

        title =
            "Keep Going!";

        message =
            "Your opponent won this battle.";
    }


    setBattlePoints(
        getBattlePoints() +
        points
    );


    /*
     * TEST ACCOUNT AND PREMIUM ACCOUNT DO NOT
     * consume free battle credits.
     *
     * Normal free users consume one.
     */

    await recordBattleUsage();


    try {

        const user =
            await getCurrentUser();

        const client =
            getSupabase();


        await updateLeaderboardRecord(
            client,
            user,
            result,
            points
        );

    } catch (error) {

        console.warn(
            "Could not save 1v1 result:",
            error
        );
    }


    showOneVOneResults(
        title,
        message,
        myScore,
        opponentScore,
        points
    );


    await updateLeaderboardUI();
}


/* =========================================================
   SHOW 1V1 RESULTS
========================================================= */

function showOneVOneResults(
    title,
    message,
    playerScore,
    opponentScore,
    points
) {

    const arena =
        $("oneVOneArena");

    const results =
        $("battleResults") ||
        $("oneVOneResults");


    if (arena) {
        arena.hidden = true;
    }


    if (results) {
        results.hidden = false;
    }


    [
        "battleResultTitle",
        "oneVOneResultTitle"
    ].forEach(id => {

        const element = $(id);

        if (element) {
            element.textContent =
                title;
        }
    });


    [
        "battleResultMessage",
        "oneVOneResultMessage"
    ].forEach(id => {

        const element = $(id);

        if (element) {
            element.textContent =
                message;
        }
    });


    [
        "finalPlayerScore",
        "oneVOneFinalPlayerScore"
    ].forEach(id => {

        const element = $(id);

        if (element) {
            element.textContent =
                playerScore;
        }
    });


    [
        "finalComputerScore",
        "oneVOneFinalOpponentScore"
    ].forEach(id => {

        const element = $(id);

        if (element) {
            element.textContent =
                opponentScore;
        }
    });


    [
        "pointsEarned",
        "oneVOnePointsEarned"
    ].forEach(id => {

        const element = $(id);

        if (element) {
            element.textContent =
                `+${points}`;
        }
    });
}


/* =========================================================
   MATCH FINISHED
========================================================= */

async function handleOneVOneFinishedMatch(
    match
) {

    if (
        oneVOneResultsRecorded
    ) {
        return;
    }


    if (
        match?.player1_score !== undefined
    ) {

        if (
            oneVOnePlayerNumber === 1
        ) {

            battleState.playerScore =
                Number(
                    match.player1_score || 0
                );

            battleState.opponentScore =
                Number(
                    match.player2_score || 0
                );

        } else {

            battleState.playerScore =
                Number(
                    match.player2_score || 0
                );

            battleState.opponentScore =
                Number(
                    match.player1_score || 0
                );
        }
    }


    await finishLocalOneVOne();
}


/* =========================================================
   CLEANUP 1V1 CONNECTION
========================================================= */

async function cleanupOneVOneConnection() {

    clearOneVOnePolling();

    stopBattleTimer();


    if (
        oneVOneChannel
    ) {

        try {

            const client =
                getSupabase();

            await client.removeChannel(
                oneVOneChannel
            );

        } catch (error) {

            console.warn(
                "Could not remove 1v1 realtime channel:",
                error
            );
        }


        oneVOneChannel =
            null;
    }


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
}


/* =========================================================
   CANCEL 1V1
========================================================= */

async function cancelOneVOneMatch() {

    try {

        const client =
            getSupabase();


        if (oneVOneMatchId) {

            const rpcNames = [
                "cancel_game_match",
                "cancel_1v1_match"
            ];


            for (
                const rpcName of rpcNames
            ) {

                try {

                    const {
                        error
                    } =
                        await client.rpc(
                            rpcName,
                            {
                                p_match_id:
                                    oneVOneMatchId
                            }
                        );


                    if (!error) {
                        break;
                    }

                } catch (_) {}
            }
        }

    } catch (error) {

        console.warn(
            "Cancel match error:",
            error
        );

    } finally {

        await cleanupOneVOneConnection();

        hideMatchmaking();


        const setup =
            $("oneVOneSetup");

        if (setup) {
            setup.hidden = false;
        }
    }
}


/* =========================================================
   LEADERBOARD
========================================================= */

async function loadLeaderboard() {

    const client =
        getSupabase();


    const {
        data,
        error
    } =
        await client
            .from("game_leaderboard")
            .select(
                "user_id,display_name,battle_points,wins,losses,draws,battles_played,updated_at"
            )
            .order(
                "battle_points",
                {
                    ascending: false
                }
            )
            .limit(100);


    if (error) {
        throw error;
    }


    renderLeaderboard(
        data || []
    );


    return data || [];
}


/* =========================================================
   RENDER LEADERBOARD
========================================================= */

function renderLeaderboard(
    players
) {

    const container =
        $("leaderboardList") ||
        $("leaderboardPreview") ||
        $("leaderboard");


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (!players.length) {

        const empty =
            document.createElement(
                "div"
            );

        empty.className =
            "leaderboard-empty";

        empty.textContent =
            "No battles have been recorded yet.";

        container.appendChild(
            empty
        );

        return;
    }


    players.forEach(
        (player, index) => {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "leaderboard-row";


            const rank =
                document.createElement(
                    "span"
                );

            rank.className =
                "leaderboard-rank";

            rank.textContent =
                index === 0
                    ? "🥇"
                    : index === 1
                        ? "🥈"
                        : index === 2
                            ? "🥉"
                            : String(
                                index + 1
                            );


            const name =
                document.createElement(
                    "span"
                );

            name.className =
                "leaderboard-name";

            name.textContent =
                player.display_name ||
                "Player";


            const points =
                document.createElement(
                    "span"
                );

            points.className =
                "leaderboard-points";

            points.textContent =
                `${Number(
                    player.battle_points || 0
                )} BP`;


            row.appendChild(rank);
            row.appendChild(name);
            row.appendChild(points);


            container.appendChild(
                row
            );
        }
    );
}


/* =========================================================
   LEADERBOARD UI
========================================================= */

async function updateLeaderboardUI() {

    try {

        const players =
            await loadLeaderboard();


        const currentUser =
            await getCurrentUser()
                .catch(
                    () => null
                );


        if (!currentUser) {
            return;
        }


        const mine =
            players.find(
                player =>
                    player.user_id ===
                    currentUser.id
            );


        if (!mine) {
            return;
        }


        const pointIds = [
            "battlePoints",
            "leaderboardBattlePoints",
            "myBattlePoints"
        ];


        pointIds.forEach(id => {

            const element = $(id);

            if (element) {

                element.textContent =
                    Number(
                        mine.battle_points || 0
                    );
            }
        });


        const winsIds = [
            "battleWins",
            "myWins"
        ];


        winsIds.forEach(id => {

            const element = $(id);

            if (element) {

                element.textContent =
                    Number(
                        mine.wins || 0
                    );
            }
        });

    } catch (error) {

        console.warn(
            "Leaderboard could not be loaded:",
            error
        );
    }
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

            await client.removeChannel(
                leaderboardRealtimeChannel
            );
        }


        leaderboardRealtimeChannel =
            client
                .channel(
                    "game-leaderboard-live"
                )
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "game_leaderboard"
                    },
                    () => {

                        updateLeaderboardUI()
                            .catch(
                                console.warn
                            );
                    }
                )
                .subscribe();

    } catch (error) {

        console.warn(
            "Leaderboard realtime unavailable:",
            error
        );
    }
}


/* =========================================================
   THEME
========================================================= */

function applyGameTheme() {

    const theme =
        localStorage.getItem(
            GAME_STORAGE.theme
        ) ||
        "dark";


    document.documentElement
        .setAttribute(
            "data-theme",
            theme
        );


    document.body?.classList.toggle(
        "light-mode",
        theme === "light"
    );


    document.body?.classList.toggle(
        "dark-mode",
        theme !== "light"
    );
}


function toggleGameTheme() {

    const current =
        localStorage.getItem(
            GAME_STORAGE.theme
        ) ||
        "dark";


    const next =
        current === "dark"
            ? "light"
            : "dark";


    localStorage.setItem(
        GAME_STORAGE.theme,
        next
    );


    applyGameTheme();
}


/* =========================================================
   NAVIGATION
========================================================= */

function goToPage(url) {

    if (!url) {
        return;
    }

    window.location.href =
        url;
}


function goHome() {
    goToPage("home.html");
}


function goDashboard() {
    goToPage("dashboard.html");
}


function goToGameMode() {
    goToPage("game-mode.html");
}


/* =========================================================
   GENERIC GAME RESET
========================================================= */

function resetComputerBattle() {

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

        timer: QUESTION_TIME_SECONDS,

        timerInterval: null,

        answering: false,

        battleActive: false
    };


    const arena =
        $("battleArena");

    const results =
        $("battleResults");

    const setup =
        $("battleSetup");


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
   BATTLE AGAIN
========================================================= */

function battleAgain() {

    resetComputerBattle();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   EVENT BINDINGS
========================================================= */

function bindGameEvents() {

    const battleSubject =
        $("battleSubject");

    if (battleSubject) {

        battleSubject.addEventListener(
            "change",
            handleBattleSubjectChange
        );
    }


    const oneVOneSubject =
        $("oneVOneSubject");

    if (oneVOneSubject) {

        oneVOneSubject.addEventListener(
            "change",
            handleOneVOneSubjectChange
        );
    }


    const computerButton =
        $("startComputerBattle") ||
        $("startBattleButton") ||
        $("computerBattleButton");


    if (computerButton) {

        computerButton.addEventListener(
            "click",
            startComputerBattle
        );
    }


    const findOpponentButton =
        $("findOpponentButton");


    if (findOpponentButton) {

        findOpponentButton.addEventListener(
            "click",
            findOneVOneOpponent
        );
    }


    const oneVOneButton =
        $("oneVOneButton") ||
        $("startOneVOneButton");


    if (oneVOneButton) {

        oneVOneButton.addEventListener(
            "click",
            startOneVOneMode
        );
    }


    const cancelButton =
        $("cancelMatchButton") ||
        $("cancelMatchmakingButton");


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            cancelOneVOneMatch
        );
    }


    const themeButton =
        $("themeToggle") ||
        $("gameThemeToggle");


    if (themeButton) {

        themeButton.addEventListener(
            "click",
            toggleGameTheme
        );
    }


    const homeButtons =
        document.querySelectorAll(
            "[data-go-home]"
        );


    homeButtons.forEach(button => {

        button.addEventListener(
            "click",
            goHome
        );
    });


    const dashboardButtons =
        document.querySelectorAll(
            "[data-go-dashboard]"
        );


    dashboardButtons.forEach(button => {

        button.addEventListener(
            "click",
            goDashboard
        );
    });


    const gameButtons =
        document.querySelectorAll(
            "[data-go-game]"
        );


    gameButtons.forEach(button => {

        button.addEventListener(
            "click",
            goToGameMode
        );
    });


    const againButton =
        $("battleAgainButton") ||
        $("playAgainButton");


    if (againButton) {

        againButton.addEventListener(
            "click",
            battleAgain
        );
    }
}


/* =========================================================
   INITIALIZATION
========================================================= */

async function initializeGameMode() {

    try {

        applyGameTheme();

        populateGameSubjects();

        bindGameEvents();

        await getCurrentUser();

        await updateBattleLimitUI();

        await updateLeaderboardUI();

        await subscribeToLeaderboard();


        /*
         * Console information is useful while debugging,
         * but does not expose the user's email.
         */

        const user =
            await getCurrentUser();

        console.log(
            "Game Mode access:",
            isTestAccount(user)
                ? "TEST ACCOUNT — UNLIMITED"
                : isPremiumUser()
                    ? "PREMIUM — UNLIMITED"
                    : "FREE — 5 BATTLES"
        );

    } catch (error) {

        console.error(
            "Game Mode initialization error:",
            error
        );


        const errorElement =
            $("gameModeError");


        if (errorElement) {

            errorElement.hidden =
                false;

            errorElement.textContent =
                cleanErrorMessage(
                    error?.message
                );
        }
    }
}


/* =========================================================
   PAGE LOAD
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeGameMode
    );

} else {

    initializeGameMode();
}


/* =========================================================
   GLOBAL EXPORTS
========================================================= */

window.startComputerBattle =
    startComputerBattle;

window.startOneVOneMode =
    startOneVOneMode;

window.findOneVOneOpponent =
    findOneVOneOpponent;

window.cancelOneVOneMatch =
    cancelOneVOneMatch;

window.handleOneVOneSubjectChange =
    handleOneVOneSubjectChange;

window.handleBattleSubjectChange =
    handleBattleSubjectChange;

window.populateGameSubjects =
    populateGameSubjects;

window.populateOneVOneTopics =
    populateOneVOneTopics;

window.populateBattleTopics =
    populateBattleTopics;

window.toggleGameTheme =
    toggleGameTheme;

window.goHome =
    goHome;

window.goDashboard =
    goDashboard;

window.goToGameMode =
    goToGameMode;

window.battleAgain =
    battleAgain;

window.updateLeaderboardUI =
    updateLeaderboardUI;

window.getBattleCount =
    getBattleCount;

window.getBattlesUsed =
    getBattlesUsed;

window.getBattlePoints =
    getBattlePoints;

window.isTestAccount =
    isTestAccount;

