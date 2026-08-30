/* =========================================================
   STUDYMIND AI — GAME MODE
   COMPUTER + REAL-TIME 1v1
========================================================= */

"use strict";


/* =========================================================
   SETTINGS
========================================================= */

const FREE_BATTLE_LIMIT = 5;

const QUESTIONS_PER_BATTLE = 10;

const QUESTION_TIME_LIMIT = 15;

const MATCHMAKING_INTERVAL = 2500;

const MATCH_TIMEOUT = 120000;


/* =========================================================
   STORAGE
========================================================= */

const STORAGE_KEYS = {

    battleCount:
        "studyMindGameBattleCount",

    battlePoints:
        "studyMindBattlePoints",

    premium:
        "studyMindPremium",

    theme:
        "studyMindTheme"

};


/* =========================================================
   SUBJECT DATABASE
========================================================= */

const SUBJECT_DATABASE = {

    "Accounting": [
        "Introduction to Accounting",
        "Accounting Concepts",
        "Double Entry",
        "Ledger Accounts",
        "Trial Balance",
        "Cash Book",
        "Bank Reconciliation",
        "Depreciation",
        "Final Accounts",
        "Partnership Accounts"
    ],

    "Agricultural Science": [
        "Introduction to Agriculture",
        "Soil Science",
        "Farm Tools",
        "Crop Production",
        "Crop Pests",
        "Crop Diseases",
        "Animal Husbandry",
        "Animal Nutrition",
        "Farm Management",
        "Agricultural Economics"
    ],

    "Biology": [
        "Cell Structure",
        "Cell Division",
        "Nutrition",
        "Transport Systems",
        "Respiration",
        "Excretion",
        "Homeostasis",
        "Reproduction",
        "Genetics",
        "Evolution",
        "Ecology",
        "Classification",
        "Microorganisms"
    ],

    "Business Studies": [
        "Introduction to Business",
        "Office Practice",
        "Communication",
        "Business Documents",
        "Trade",
        "Banking",
        "Insurance",
        "Transportation",
        "Entrepreneurship",
        "Consumer Protection"
    ],

    "Chemistry": [
        "Matter",
        "Atomic Structure",
        "Periodic Table",
        "Chemical Bonding",
        "Mole Concept",
        "Chemical Reactions",
        "Acids Bases and Salts",
        "Organic Chemistry",
        "Electrochemistry",
        "Rates of Reaction",
        "Chemical Equilibrium",
        "Metals",
        "Non-Metals"
    ],

    "Computer Science": [
        "Computer Fundamentals",
        "Hardware",
        "Software",
        "Operating Systems",
        "Data Representation",
        "Algorithms",
        "Flowcharts",
        "Programming",
        "Data Structures",
        "Databases",
        "Computer Networks",
        "Cybersecurity",
        "Artificial Intelligence"
    ],

    "Economics": [
        "Basic Economic Concepts",
        "Demand",
        "Supply",
        "Price Determination",
        "Elasticity",
        "Production",
        "Cost and Revenue",
        "Market Structures",
        "National Income",
        "Inflation",
        "Unemployment",
        "Money and Banking",
        "International Trade"
    ],

    "English Language": [
        "Grammar",
        "Parts of Speech",
        "Sentence Structure",
        "Tenses",
        "Vocabulary",
        "Comprehension",
        "Summary Writing",
        "Essay Writing",
        "Letter Writing",
        "Figures of Speech",
        "Oral English",
        "Punctuation"
    ],

    "Further Mathematics": [
        "Algebra",
        "Functions",
        "Coordinate Geometry",
        "Trigonometry",
        "Calculus",
        "Differentiation",
        "Integration",
        "Vectors",
        "Matrices",
        "Probability",
        "Statistics",
        "Mechanics"
    ],

    "Geography": [
        "Map Reading",
        "Physical Geography",
        "Weather and Climate",
        "Rocks",
        "Landforms",
        "Soils",
        "Vegetation",
        "Population",
        "Settlement",
        "Agriculture",
        "Industry",
        "Transportation",
        "Environmental Issues"
    ],

    "General Knowledge": [
        "World History",
        "African History",
        "Geography",
        "Countries and Capitals",
        "Science",
        "Technology",
        "Space and Astronomy",
        "Environment",
        "Sports",
        "Arts and Culture",
        "Literature",
        "Famous People",
        "Inventions and Discoveries",
        "World Organizations",
        "Current Affairs",
        "Nigeria",
        "Africa",
        "World Records",
        "Health and Human Body",
        "General Trivia"
    ],

    "Government": [
        "Introduction to Government",
        "Constitution",
        "Democracy",
        "Political Parties",
        "Electoral Systems",
        "Pressure Groups",
        "Public Opinion",
        "Legislature",
        "Executive",
        "Judiciary",
        "Local Government",
        "International Organizations"
    ],

    "History": [
        "Ancient Civilizations",
        "African History",
        "West African History",
        "Colonialism",
        "Nationalism",
        "Independence Movements",
        "World War I",
        "World War II",
        "Cold War",
        "Modern History",
        "Historical Sources"
    ],

    "Information Technology": [
        "Information Systems",
        "Computer Hardware",
        "Software",
        "Internet",
        "Web Technologies",
        "Databases",
        "Networking",
        "Cybersecurity",
        "Digital Communication",
        "Data Management"
    ],

    "Literature in English": [
        "Drama",
        "Poetry",
        "Prose",
        "Plot",
        "Characterization",
        "Setting",
        "Theme",
        "Conflict",
        "Figures of Speech",
        "Literary Devices",
        "African Literature",
        "Literary Analysis"
    ],

    "Mathematics": [
        "Number Systems",
        "Fractions",
        "Decimals",
        "Percentages",
        "Ratio and Proportion",
        "Algebra",
        "Linear Equations",
        "Quadratic Equations",
        "Simultaneous Equations",
        "Geometry",
        "Mensuration",
        "Trigonometry",
        "Statistics",
        "Probability",
        "Sequences",
        "Vectors"
    ],

    "Physical Education": [
        "Physical Fitness",
        "Athletics",
        "Football",
        "Basketball",
        "Volleyball",
        "Swimming",
        "Gymnastics",
        "Sports Rules",
        "First Aid",
        "Nutrition and Fitness"
    ],

    "Physics": [
        "Measurement",
        "Scalars and Vectors",
        "Motion",
        "Forces",
        "Work Energy and Power",
        "Momentum",
        "Simple Machines",
        "Heat",
        "Waves",
        "Sound",
        "Light",
        "Electricity",
        "Magnetism",
        "Electromagnetism",
        "Atomic Physics"
    ],

    "Religious Studies": [
        "Creation",
        "Moral Values",
        "Leadership",
        "Justice",
        "Forgiveness",
        "Faith",
        "Prayer",
        "Religion and Society",
        "Religious Teachings",
        "Ethics"
    ],

    "Social Studies": [
        "Family",
        "Culture",
        "Society",
        "Citizenship",
        "Human Rights",
        "Socialization",
        "Leadership",
        "Conflict Resolution",
        "Population",
        "Environmental Issues"
    ],

    "Technical Drawing": [
        "Drawing Instruments",
        "Geometric Construction",
        "Orthographic Projection",
        "Isometric Drawing",
        "Perspective Drawing",
        "Sectional Views",
        "Dimensioning",
        "Scale Drawing",
        "Engineering Drawing"
    ],

    "Visual Arts": [
        "Elements of Art",
        "Principles of Design",
        "Drawing",
        "Painting",
        "Sculpture",
        "Printmaking",
        "Textiles",
        "Art History",
        "African Art",
        "Art Appreciation"
    ]

};


/* =========================================================
   COMPUTER STATE
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
   1V1 STATE
========================================================= */

let oneVOneMatchId = null;

let oneVOnePlayerNumber = null;

let oneVOneQuestions = [];

let oneVOneCurrentQuestion = 0;

let oneVOnePlayerScore = 0;

let oneVOneOpponentScore = 0;

let oneVOneTimer = QUESTION_TIME_LIMIT;

let oneVOneTimerInterval = null;

let oneVOneAnsweringLocked = false;

let oneVOneActive = false;

let oneVOneChannel = null;

let oneVOnePolling = null;

let oneVOneMatchmakingStartedAt = null;

let oneVOneQuestionStartedAt = null;

let oneVOneMyName = "Student";

let oneVOneOpponentName = "Opponent";

let oneVOneResultsRecorded = false;

let oneVOneAnsweredQuestions = new Set();

let oneVOneMatchStarting = false;


/* =========================================================
   HELPERS
========================================================= */

function getElement(id) {

    return document.getElementById(id);

}


function getSupabase() {

    if (
        typeof window.supabaseClient !== "undefined" &&
        window.supabaseClient
    ) {

        return window.supabaseClient;

    }


    if (
        typeof window.supabase !== "undefined" &&
        window.supabase &&
        window.supabase.auth
    ) {

        return window.supabase;

    }


    throw new Error(
        "Supabase is not available."
    );

}


async function getCurrentUser() {

    const supabase =
        getSupabase();


    const {
        data,
        error
    } =
        await supabase.auth.getUser();


    if (error) {

        throw error;

    }


    if (!data?.user) {

        throw new Error(
            "Please log in before playing 1v1."
        );

    }


    return data.user;

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


async function initializeGameMode() {

    battlePoints =
        getBattlePoints();

    loadTheme();

    loadSubjects();

    setupSubjectChange();

    loadOneVOneSubjects();

    setupOneVOneControls();

    updateBattleStatus();

    try {

        await updateLeaderboard();

    } catch (error) {

        console.error(
            "Initial leaderboard load failed:",
            error
        );

    }

}


/* =========================================================
   SUBJECTS
========================================================= */

function loadSubjects() {

    populateSubjectSelect(
        getElement("battleSubject")
    );

}


function loadOneVOneSubjects() {

    populateSubjectSelect(
        getElement("oneVOneSubject")
    );

}


function populateSubjectSelect(select) {

    if (!select) {

        return;

    }


    select.innerHTML = "";


    const defaultOption =
        document.createElement("option");


    defaultOption.value =
        "";

    defaultOption.textContent =
        "Choose a subject";


    select.appendChild(
        defaultOption
    );


    Object.keys(
        SUBJECT_DATABASE
    )
        .sort(
            (a, b) =>
                a.localeCompare(b)
        )
        .forEach(
            subject => {

                const option =
                    document.createElement("option");


                option.value =
                    subject;

                option.textContent =
                    subject;


                select.appendChild(
                    option
                );

            }
        );

}


/* =========================================================
   COMPUTER SUBJECT CHANGE
========================================================= */

function setupSubjectChange() {

    const subjectSelect =
        getElement("battleSubject");

    const topicSelect =
        getElement("battleTopic");

    const startButton =
        getElement("startBattleButton");


    if (!subjectSelect) {

        return;

    }


    subjectSelect.addEventListener(
        "change",
        () => {

            populateTopics(
                subjectSelect,
                topicSelect
            );

            if (startButton) {

                startButton.disabled =
                    !(
                        subjectSelect.value &&
                        topicSelect?.value
                    );

            }

        }
    );


    if (topicSelect) {

        topicSelect.addEventListener(
            "change",
            () => {

                if (!startButton) {

                    return;

                }


                startButton.disabled =
                    !(
                        subjectSelect.value &&
                        topicSelect.value
                    );

            }
        );

    }

}


function populateTopics(
    subjectSelect,
    topicSelect
) {

    if (!topicSelect) {

        return;

    }


    topicSelect.innerHTML =
        "";


    if (!subjectSelect?.value) {

        const option =
            document.createElement("option");


        option.value =
            "";

        option.textContent =
            "Choose a subject first";


        topicSelect.appendChild(
            option
        );


        topicSelect.disabled =
            true;

        return;

    }


    const defaultOption =
        document.createElement("option");


    defaultOption.value =
        "";

    defaultOption.textContent =
        "Choose a topic";


    topicSelect.appendChild(
        defaultOption
    );


    (
        SUBJECT_DATABASE[
            subjectSelect.value
        ] || []
    )
        .slice()
        .sort(
            (a, b) =>
                a.localeCompare(b)
        )
        .forEach(
            topic => {

                const option =
                    document.createElement("option");


                option.value =
                    topic;

                option.textContent =
                    topic;


                topicSelect.appendChild(
                    option
                );

            }
        );


    topicSelect.disabled =
        false;

}


/* =========================================================
   1V1 CONTROLS
========================================================= */

function setupOneVOneControls() {

    const subject =
        getElement("oneVOneSubject");

    const topic =
        getElement("oneVOneTopic");


    if (!subject) {

        return;

    }


    subject.addEventListener(
        "change",
        () => {

            populateTopics(
                subject,
                topic
            );

            updateOneVOneButton();

        }
    );


    if (topic) {

        topic.addEventListener(
            "change",
            updateOneVOneButton
        );

    }

}


function updateOneVOneButton() {

    const subject =
        getElement("oneVOneSubject");

    const topic =
        getElement("oneVOneTopic");

    const button =
        getElement("findOpponentButton");


    if (!button) {

        return;

    }


    button.disabled =
        !(
            subject?.value &&
            topic?.value &&
            !oneVOneMatchId
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

    const status =
        getElement("battleStatusText");

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

        if (status) {

            status.textContent =
                "Unlimited battles available";

            status.style.color =
                "#22c55e";

        }


        if (premiumCard) {

            premiumCard.style.display =
                "none";

        }

        return;

    }


    const remaining =
        Math.max(
            0,
            FREE_BATTLE_LIMIT - used
        );


    if (status) {

        status.textContent =
            remaining > 0
                ? `${remaining} battle${remaining === 1 ? "" : "s"} remaining`
                : "Free battle limit reached";

        status.style.color =
            remaining > 0
                ? "#22c55e"
                : "#f59e0b";

    }


    if (premiumCard) {

        premiumCard.style.display =
            remaining <= 0
                ? "grid"
                : "none";

    }

}


/* =========================================================
   START COMPUTER
========================================================= */

function startComputerBattle() {

    if (
        !isPremiumUser() &&
        getBattleCount() >= FREE_BATTLE_LIMIT
    ) {

        showPremiumMessage();

        return;

    }


    const setup =
        getElement("battleSetup");


    if (setup) {

        setup.hidden =
            false;


        setup.scrollIntoView({

            behavior:
                "smooth",

            block:
                "center"

        });

    }

}


/* =========================================================
   COMPUTER BATTLE
========================================================= */

async function beginBattle() {

    if (generatingBattle) {

        return;

    }


    if (
        !isPremiumUser() &&
        getBattleCount() >= FREE_BATTLE_LIMIT
    ) {

        showPremiumMessage();

        return;

    }


    const subject =
        getElement("battleSubject")?.value || "";

    const topic =
        getElement("battleTopic")?.value || "";

    const difficulty =
        getElement("battleDifficulty")?.value ||
        "mixed";


    if (!subject || !topic) {

        alert(
            "Please choose a subject and topic."
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
                topic,
                difficulty
            );


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


        arena?.scrollIntoView({

            behavior:
                "smooth",

            block:
                "start"

        });

    } catch (error) {

        console.error(
            error
        );


        alert(
            error.message ||
            "Could not create the battle."
        );

    } finally {

        generatingBattle =
            false;

        restoreStartButton();

    }

}


/* =========================================================
   AI QUESTIONS
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

Create exactly 10 high-quality multiple-choice questions.

Requirements:

- All questions must be about the selected subject and topic.
- Exactly 10 questions.
- Exactly 4 options per question.
- Only one option is correct.
- Questions must genuinely test knowledge.
- Questions must be appropriate for a secondary-school student.
- Mix conceptual, factual and application questions.
- Do not repeat questions.
- Do not make the correct answer always option A.
- Keep questions concise.
- Return ONLY valid JSON.
- No markdown.

Return:

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

The answer must be the zero-based index of the correct option.

`.trim();


    const response =
        await fetch(
            "/api/chat",
            {

                method:
                    "POST",

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


    let data = null;


    try {

        data =
            await response.json();

    } catch {

        throw new Error(
            "The AI server returned an invalid response."
        );

    }


    if (!response.ok) {

        throw new Error(
            data?.error ||
            "The AI server returned an error."
        );

    }


    if (!data?.reply) {

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
   JSON
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


    const first =
        cleaned.indexOf("[");

    const last =
        cleaned.lastIndexOf("]");


    if (
        first !== -1 &&
        last !== -1 &&
        last > first
    ) {

        cleaned =
            cleaned.slice(
                first,
                last + 1
            );

    }


    try {

        return JSON.parse(
            cleaned
        );

    } catch {

        throw new Error(
            "StudyMind AI returned invalid question data."
        );

    }

}


/* =========================================================
   VALIDATE
========================================================= */

function validateBattleQuestions(
    questions
) {

    if (
        !Array.isArray(questions) ||
        questions.length <
        QUESTIONS_PER_BATTLE
    ) {

        throw new Error(
            "StudyMind AI did not create enough questions."
        );

    }


    questions
        .slice(
            0,
            QUESTIONS_PER_BATTLE
        )
        .forEach(
            (question, index) => {

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
                    question.options.length !== 4
                ) {

                    throw new Error(
                        `Question ${index + 1} must have four options.`
                    );

                }


                const answer =
                    Number(
                        question.answer
                    );


                if (
                    !Number.isInteger(answer) ||
                    answer < 0 ||
                    answer > 3
                ) {

                    throw new Error(
                        `Question ${index + 1} has an invalid answer.`
                    );

                }

            }
        );

}


/* =========================================================
   COMPUTER QUESTION
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


    const number =
        getElement(
            "currentQuestionNumber"
        );

    const questionElement =
        getElement(
            "battleQuestion"
        );

    const topicElement =
        getElement(
            "battleQuestionTopic"
        );


    if (number) {

        number.textContent =
            currentQuestionIndex + 1;

    }


    if (questionElement) {

        questionElement.textContent =
            question.question;

    }


    const subject =
        getElement("battleSubject")?.value || "";

    const topic =
        getElement("battleTopic")?.value || "";


    if (topicElement) {

        topicElement.textContent =
            `${subject} • ${topic}`;

    }


    renderAnswers(
        getElement("answerGrid"),
        question,
        handleComputerAnswer
    );


    startComputerTimer();

}


/* =========================================================
   ANSWERS
========================================================= */

function renderAnswers(
    container,
    question,
    callback
) {

    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    const answers =
        shuffleArray(
            question.options.map(
                (text, index) => ({

                    text,

                    originalIndex:
                        index

                })
            )
        );


    answers.forEach(
        (answer, index) => {

            const button =
                document.createElement("button");


            button.type =
                "button";

            button.className =
                "answer-button";


            button.textContent =
                `${String.fromCharCode(65 + index)}. ${answer.text}`;


            button.dataset.originalIndex =
                String(
                    answer.originalIndex
                );


            button.addEventListener(
                "click",
                () =>
                    callback(
                        answer.originalIndex,
                        button
                    )
            );


            container.appendChild(
                button
            );

        }
    );

}


/* =========================================================
   COMPUTER TIMER
========================================================= */

function startComputerTimer() {

    clearInterval(
        battleTimerInterval
    );


    battleTimer =
        QUESTION_TIME_LIMIT;


    updateComputerTimer();


    battleTimerInterval =
        setInterval(
            () => {

                battleTimer--;

                updateComputerTimer();


                if (
                    battleTimer <= 0
                ) {

                    clearInterval(
                        battleTimerInterval
                    );


                    handleComputerAnswer(
                        null,
                        null
                    );

                }

            },
            1000
        );

}


function updateComputerTimer() {

    const timer =
        getElement("battleTimer");


    if (timer) {

        timer.textContent =
            Math.max(
                0,
                battleTimer
            );

    }

}


/* =========================================================
   COMPUTER ANSWER
========================================================= */

function handleComputerAnswer(
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


    if (!question) {

        finishBattle();

        return;

    }


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
        selectedIndex === correctIndex
    ) {

        playerScore++;


        selectedButton?.classList.add(
            "correct"
        );

    } else {

        selectedButton?.classList.add(
            "incorrect"
        );


        buttons.forEach(
            button => {

                if (
                    Number(
                        button.dataset.originalIndex
                    ) === correctIndex
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
   COMPUTER OPPONENT
========================================================= */

function computerTakeTurn() {

    const difficulty =
        getElement(
            "battleDifficulty"
        )?.value ||
        "mixed";


    let chance =
        0.55;


    if (difficulty === "easy") {

        chance =
            0.45;

    }


    if (difficulty === "hard") {

        chance =
            0.70;

    }


    if (
        Math.random() <
        chance
    ) {

        computerScore++;

    }

}


/* =========================================================
   COMPUTER SCORES
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
   COMPUTER FINISH
========================================================= */

function finishBattle() {

    if (!battleActive) {

        return;

    }


    battleActive =
        false;


    clearInterval(
        battleTimerInterval
    );


    const points =
        calculateBattlePoints(
            playerScore,
            computerScore
        );


    battlePoints +=
        points;


    setBattlePoints(
        battlePoints
    );


    showResults(
        playerScore,
        computerScore,
        points,
        "COMPUTER"
    );


    updateBattleStatus();

    updateLeaderboard();

}


/* =========================================================
   POINTS
========================================================= */

function calculateBattlePoints(
    mine,
    opponent
) {

    let points =
        mine * 10;


    if (mine > opponent) {

        points += 25;

    } else if (
        mine === opponent
    ) {

        points += 10;

    }


    return points;

}


/* =========================================================
   1V1 START
========================================================= */

function startOneVOneMode() {

    if (
        !isPremiumUser() &&
        getBattleCount() >= FREE_BATTLE_LIMIT
    ) {

        showPremiumMessage();

        return;

    }


    const setup =
        getElement("oneVOneSetup");


    if (setup) {

        setup.hidden =
            false;


        setup.scrollIntoView({

            behavior:
                "smooth",

            block:
                "center"

        });

    }

}


/* =========================================================
   FIND OPPONENT
========================================================= */

async function findOneVOneOpponent() {

    if (
        !isPremiumUser() &&
        getBattleCount() >= FREE_BATTLE_LIMIT
    ) {

        showPremiumMessage();

        return;

    }


    if (oneVOneMatchId) {

        return;

    }


    try {

        const user =
            await getCurrentUser();


        const subject =
            getElement(
                "oneVOneSubject"
            )?.value || "";


        const topic =
            getElement(
                "oneVOneTopic"
            )?.value || "";


        const difficulty =
            getElement(
                "oneVOneDifficulty"
            )?.value || "mixed";


        if (
            !subject ||
            !topic
        ) {

            alert(
                "Choose a subject and topic first."
            );

            return;

        }


        oneVOneMyName =
            getDisplayName(
                user
            );


        showMatchmaking();


        const supabase =
            getSupabase();


        /*
         * Look for an existing waiting
         * match with identical settings.
         */

        const {
            data: waitingMatches,
            error
        } =
            await supabase
                .from("game_matches")
                .select("*")
                .eq("status", "waiting")
                .eq("subject", subject)
                .eq("topic", topic)
                .eq("difficulty", difficulty)
                .neq("created_by", user.id)
                .order(
                    "created_at",
                    {
                        ascending:
                            true
                    }
                )
                .limit(1);


        if (error) {

            throw error;

        }


        if (
            waitingMatches?.length
        ) {

            await joinExistingMatch(
                waitingMatches[0]
            );

            return;

        }


        /*
         * No suitable match exists.
         * Create one.
         */

        const {
            data: createdMatch,
            error: createError
        } =
            await supabase.rpc(
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


        /*
         * Some Supabase RPC functions
         * return a UUID directly.
         */

        oneVOneMatchId =
            normalizeMatchId(
                createdMatch
            );


        if (!oneVOneMatchId) {

            throw new Error(
                "The battle room was created but no match ID was returned."
            );

        }


        oneVOnePlayerNumber =
            1;


        oneVOneResultsRecorded =
            false;


        oneVOneAnsweredQuestions =
            new Set();


        await subscribeToOneVOne(
            oneVOneMatchId
        );


        updateMatchmakingText(
            "Waiting for an opponent...",
            "Your battle room is ready. Another student will join when they select the same battle."
        );


        startMatchmakingTimeout();


    } catch (error) {

        console.error(
            "1v1 matchmaking error:",
            error
        );


        await cleanupOneVOneConnection();


        hideMatchmaking();


        alert(
            error?.message ||
            "Could not start matchmaking."
        );

    }

}


/* =========================================================
   MATCH ID NORMALIZATION
========================================================= */

function normalizeMatchId(value) {

    if (!value) {

        return null;

    }


    if (typeof value === "string") {

        return value;

    }


    if (
        typeof value === "object"
    ) {

        return (
            value.id ||
            value.match_id ||
            value.create_game_match ||
            null
        );

    }


    return null;

}


/* =========================================================
   JOIN EXISTING MATCH
========================================================= */

async function joinExistingMatch(
    match
) {

    const supabase =
        getSupabase();


    if (!match?.id) {

        throw new Error(
            "The waiting battle room is invalid."
        );

    }


    const {
        data: playerNumber,
        error
    } =
        await supabase.rpc(
            "join_game_match",
            {

                p_match_id:
                    match.id,

                p_display_name:
                    oneVOneMyName

            }
        );


    if (error) {

        /*
         * Another student may have joined
         * between our SELECT and RPC.
         */

        console.warn(
            "Could not join selected match:",
            error
        );


        oneVOneMatchId =
            null;


        hideMatchmaking();


        setTimeout(
            () => {

                findOneVOneOpponent();

            },
            150
        );


        return;

    }


    oneVOneMatchId =
        match.id;


    oneVOnePlayerNumber =
        Number(
            playerNumber
        );


    if (
        oneVOnePlayerNumber !== 1 &&
        oneVOnePlayerNumber !== 2
    ) {

        throw new Error(
            "The battle room returned an invalid player number."
        );

    }


    oneVOneResultsRecorded =
        false;


    oneVOneAnsweredQuestions =
        new Set();


    await subscribeToOneVOne(
        oneVOneMatchId
    );


    updateMatchmakingText(
        "Opponent found!",
        "Preparing your battle..."
    );


    await loadMatchPlayers();

    await waitForMatchToStart();

}


/* =========================================================
   MATCHMAKING UI
========================================================= */

function showMatchmaking() {

    const setup =
        getElement("oneVOneSetup");

    const status =
        getElement("matchmakingStatus");

    const button =
        getElement("findOpponentButton");


    if (setup) {

        setup.hidden =
            false;

    }


    if (status) {

        status.hidden =
            false;

    }


    if (button) {

        button.disabled =
            true;

    }


    updateMatchmakingText(
        "Looking for an opponent...",
        "Searching for another StudyMind student with the same battle settings."
    );

}


function updateMatchmakingText(
    title,
    message
) {

    const titleElement =
        getElement("matchmakingTitle");

    const messageElement =
        getElement("matchmakingMessage");


    if (titleElement) {

        titleElement.textContent =
            title;

    }


    if (messageElement) {

        messageElement.textContent =
            message;

    }

}


function hideMatchmaking() {

    const status =
        getElement("matchmakingStatus");


    if (status) {

        status.hidden =
            true;

    }


    updateOneVOneButton();

}


function startMatchmakingTimeout() {

    oneVOneMatchmakingStartedAt =
        Date.now();


    clearInterval(
        oneVOnePolling
    );


    oneVOnePolling =
        setInterval(
            async () => {

                if (!oneVOneMatchId) {

                    return;

                }


                if (
                    Date.now() -
                    oneVOneMatchmakingStartedAt >
                    MATCH_TIMEOUT
                ) {

                    clearInterval(
                        oneVOnePolling
                    );


                    oneVOnePolling =
                        null;


                    updateMatchmakingText(
                        "Still waiting...",
                        "No opponent has joined yet. You can keep waiting or cancel the search."
                    );


                    return;

                }


                await checkMatchPlayers();

            },
            MATCHMAKING_INTERVAL
        );

}


/* =========================================================
   CHECK PLAYERS
========================================================= */

async function checkMatchPlayers() {

    if (!oneVOneMatchId) {

        return;

    }


    try {

        const supabase =
            getSupabase();


        const {
            data,
            error
        } =
            await supabase
                .from("game_match_players")
                .select("*")
                .eq(
                    "match_id",
                    oneVOneMatchId
                )
                .order(
                    "player_number",
                    {
                        ascending:
                            true
                    }
                );


        if (error) {

            console.error(
                "Player polling error:",
                error
            );

            return;

        }


        if (
            data?.length >= 2
        ) {

            clearInterval(
                oneVOnePolling
            );


            oneVOnePolling =
                null;


            await loadMatchPlayers();

            await waitForMatchToStart();

        }

    } catch (error) {

        console.error(
            "Match polling error:",
            error
        );

    }

}


/* =========================================================
   LOAD PLAYERS
========================================================= */

async function loadMatchPlayers() {

    if (!oneVOneMatchId) {

        return [];

    }


    const supabase =
        getSupabase();


    const {
        data,
        error
    } =
        await supabase
            .from("game_match_players")
            .select("*")
            .eq(
                "match_id",
                oneVOneMatchId
            )
            .order(
                "player_number",
                {
                    ascending:
                        true
                }
            );


    if (error) {

        throw error;

    }


    const players =
        data || [];


    const me =
        players.find(
            player =>
                Number(
                    player.player_number
                ) ===
                Number(
                    oneVOnePlayerNumber
                )
        );


    const opponent =
        players.find(
            player =>
                Number(
                    player.player_number
                ) !==
                Number(
                    oneVOnePlayerNumber
                )
        );


    if (me) {

        oneVOnePlayerScore =
            Number(
                me.score
            ) || 0;

    }


    if (opponent) {

        oneVOneOpponentScore =
            Number(
                opponent.score
            ) || 0;


        oneVOneOpponentName =
            opponent.display_name ||
            "Opponent";

    }


    updateOneVOneScores();

    updateOpponentName();


    return players;

}


/* =========================================================
   WAIT FOR START
========================================================= */

async function waitForMatchToStart() {

    if (
        !oneVOneMatchId ||
        oneVOneActive
    ) {

        return;

    }


    const supabase =
        getSupabase();


    const {
        data: match,
        error
    } =
        await supabase
            .from("game_matches")
            .select("*")
            .eq(
                "id",
                oneVOneMatchId
            )
            .single();


    if (error) {

        throw error;

    }


    if (
        match.status ===
        "finished"
    ) {

        await loadMatchPlayers();

        await finishOneVOne();

        return;

    }


    if (
        match.status ===
        "active"
    ) {

        await startOneVOneBattle(
            match
        );

        return;

    }


    if (
        match.status ===
        "waiting" &&
        oneVOnePlayerNumber === 1
    ) {

        if (
            oneVOneMatchStarting
        ) {

            return;

        }


        oneVOneMatchStarting =
            true;


        try {

            await generateAndStartMatch(
                match
            );

        } finally {

            oneVOneMatchStarting =
                false;

        }


        return;

    }


    updateMatchmakingText(
        "Opponent found!",
        "Player 1 is preparing the questions..."
    );

}


/* =========================================================
   GENERATE MATCH
========================================================= */

async function generateAndStartMatch(
    match
) {

    if (
        !match ||
        Number(
            oneVOnePlayerNumber
        ) !== 1
    ) {

        return;

    }


    updateMatchmakingText(
        "Creating battle...",
        "StudyMind AI is preparing the same 10 questions for both players."
    );


    try {

        const questions =
            await generateAIBattleQuestions(
                match.subject,
                match.topic,
                match.difficulty
            );


        const cleanedQuestions =
            questions
                .slice(
                    0,
                    QUESTIONS_PER_BATTLE
                )
                .map(
                    question => ({

                        question:
                            question.question,

                        options:
                            question.options,

                        answer:
                            Number(
                                question.answer
                            )

                    })
                );


        validateBattleQuestions(
            cleanedQuestions
        );


        const supabase =
            getSupabase();


        const questionStartedAt =
            new Date().toISOString();


        const {
            error
        } =
            await supabase.rpc(
                "update_game_match",
                {

                    p_match_id:
                        oneVOneMatchId,

                    p_status:
                        "active",

                    p_question_set:
                        cleanedQuestions,

                    p_current_question:
                        0,

                    p_question_started_at:
                        questionStartedAt

                }
            );


        if (error) {

            throw error;

        }


        /*
         * Start immediately for Player 1.
         * Player 2 will receive the same match
         * through Realtime.
         */

        await startOneVOneBattle({

            id:
                oneVOneMatchId,

            subject:
                match.subject,

            topic:
                match.topic,

            difficulty:
                match.difficulty,

            question_set:
                cleanedQuestions,

            current_question:
                0,

            question_started_at:
                questionStartedAt,

            status:
                "active"

        });

    } catch (error) {

        console.error(
            "Match generation error:",
            error
        );


        alert(
            error?.message ||
            "StudyMind AI could not create the 1v1 battle."
        );


        await cancelOneVOne();

    }

}


/* =========================================================
   START 1V1
========================================================= */

async function startOneVOneBattle(
    match
) {

    if (oneVOneActive) {

        return;

    }


    clearInterval(
        oneVOnePolling
    );


    oneVOnePolling =
        null;


    const questions =
        normalizeQuestionSet(
            match?.question_set
        );


    if (
        questions.length <
        QUESTIONS_PER_BATTLE
    ) {

        throw new Error(
            "The battle questions are unavailable."
        );

    }


    oneVOneQuestions =
        questions.slice(
            0,
            QUESTIONS_PER_BATTLE
        );


    oneVOneCurrentQuestion =
        Math.max(
            0,
            Math.min(
                QUESTIONS_PER_BATTLE - 1,
                Number(
                    match.current_question
                ) || 0
            )
        );


    oneVOneQuestionStartedAt =
        parseServerTime(
            match.question_started_at
        );


    oneVOneActive =
        true;


    oneVOneAnsweringLocked =
        false;


    oneVOneResultsRecorded =
        false;


    oneVOneAnsweredQuestions =
        new Set();


    /*
     * Count the 1v1 battle only once,
     * when the battle actually becomes active.
     */

    if (!isPremiumUser()) {

        setBattleCount(
            getBattleCount() + 1
        );

    }


    updateBattleStatus();

    hideMatchmaking();


    const oneVOneSetup =
        getElement("oneVOneSetup");

    const oneVOneArena =
        getElement("oneVOneArena");

    const battleArena =
        getElement("battleArena");

    const results =
        getElement("battleResults");


    if (oneVOneSetup) {

        oneVOneSetup.hidden =
            true;

    }


    if (battleArena) {

        battleArena.hidden =
            true;

    }


    if (results) {

        results.hidden =
            true;

    }


    if (oneVOneArena) {

        oneVOneArena.hidden =
            false;

    }


    await loadMatchPlayers();

    showOneVOneQuestion(
        true
    );


    oneVOneArena?.scrollIntoView({

        behavior:
            "smooth",

        block:
            "start"

    });

}


/* =========================================================
   QUESTION SET NORMALIZATION
========================================================= */

function normalizeQuestionSet(
    questionSet
) {

    if (
        Array.isArray(questionSet)
    ) {

        return questionSet;

    }


    if (
        typeof questionSet === "string"
    ) {

        try {

            const parsed =
                JSON.parse(
                    questionSet
                );


            return Array.isArray(parsed)
                ? parsed
                : [];

        } catch {

            return [];

        }

    }


    return [];

}


/* =========================================================
   REALTIME SUBSCRIPTION
========================================================= */

async function subscribeToOneVOne(
    matchId
) {

    const supabase =
        getSupabase();


    if (!matchId) {

        throw new Error(
            "Cannot subscribe without a match ID."
        );

    }


    if (oneVOneChannel) {

        try {

            await supabase.removeChannel(
                oneVOneChannel
            );

        } catch {

            /* Ignore old channel cleanup errors. */

        }


        oneVOneChannel =
            null;

    }


    oneVOneChannel =
        supabase
            .channel(
                `studymind-1v1-${matchId}`
            )


            /*
             * MATCH STATE
             */

            .on(
                "postgres_changes",
                {

                    event:
                        "*",

                    schema:
                        "public",

                    table:
                        "game_matches",

                    filter:
                        `id=eq.${matchId}`

                },

                async payload => {

                    try {

                        await handleMatchChange(
                            payload
                        );

                    } catch (error) {

                        console.error(
                            "Realtime match handler error:",
                            error
                        );

                    }

                }
            )


            /*
             * PLAYER STATE
             */

            .on(
                "postgres_changes",
                {

                    event:
                        "*",

                    schema:
                        "public",

                    table:
                        "game_match_players",

                    filter:
                        `match_id=eq.${matchId}`

                },

                async payload => {

                    try {

                        await handlePlayerChange(
                            payload
                        );

                    } catch (error) {

                        console.error(
                            "Realtime player handler error:",
                            error
                        );

                    }

                }
            )


            /*
             * ANSWERS
             */

            .on(
                "postgres_changes",
                {

                    event:
                        "INSERT",

                    schema:
                        "public",

                    table:
                        "game_match_answers",

                    filter:
                        `match_id=eq.${matchId}`

                },

                async payload => {

                    try {

                        await handleAnswerChange(
                            payload
                        );

                    } catch (error) {

                        console.error(
                            "Realtime answer handler error:",
                            error
                        );

                    }

                }
            );


    oneVOneChannel.subscribe(
        status => {

            const sync =
                getElement(
                    "oneVOneSyncStatus"
                );


            if (!sync) {

                return;

            }


            if (
                status === "SUBSCRIBED"
            ) {

                sync.textContent =
                    "Synchronized";

            } else if (
                status === "CHANNEL_ERROR"
            ) {

                sync.textContent =
                    "Connection error";

            } else if (
                status === "TIMED_OUT"
            ) {

                sync.textContent =
                    "Connection timed out";

            } else {

                sync.textContent =
                    "Connecting...";

            }

        }
    );

}


/* =========================================================
   MATCH CHANGE
========================================================= */

async function handleMatchChange(
    payload
) {

    const match =
        payload?.new;


    if (!match) {

        return;

    }


    /*
     * MATCH FINISHED
     */

    if (
        match.status ===
        "finished"
    ) {

        await loadMatchPlayers();

        await finishOneVOne();

        return;

    }


    /*
     * MATCH BECAME ACTIVE
     */

    if (
        match.status ===
        "active"
    ) {

        const incomingQuestions =
            normalizeQuestionSet(
                match.question_set
            );


        /*
         * If we haven't started yet,
         * start from the server's state.
         */

        if (
            !oneVOneActive
        ) {

            await startOneVOneBattle(
                match
            );

            return;

        }


        /*
         * If we are already playing,
         * synchronize the question index
         * and server timer.
         */

        if (
            incomingQuestions.length >=
            QUESTIONS_PER_BATTLE
        ) {

            oneVOneQuestions =
                incomingQuestions.slice(
                    0,
                    QUESTIONS_PER_BATTLE
                );

        }


        const serverQuestion =
            Number(
                match.current_question
            ) || 0;


        const serverStartedAt =
            parseServerTime(
                match.question_started_at
            );


        /*
         * Only move forward when the server
         * says the shared question changed.
         */

        if (
            serverQuestion !==
            oneVOneCurrentQuestion
        ) {

            if (
                serverQuestion >= 0 &&
                serverQuestion <
                QUESTIONS_PER_BATTLE
            ) {

                oneVOneCurrentQuestion =
                    serverQuestion;


                oneVOneQuestionStartedAt =
                    serverStartedAt;


                oneVOneAnsweringLocked =
                    false;


                showOneVOneQuestion(
                    true
                );

            }

        } else if (
            serverStartedAt &&
            (
                !oneVOneQuestionStartedAt ||
                Math.abs(
                    serverStartedAt -
                    oneVOneQuestionStartedAt
                ) > 1000
            )
        ) {

            oneVOneQuestionStartedAt =
                serverStartedAt;


            startOneVOneTimer();

        }


        return;

    }


    /*
     * If the match remains waiting,
     * don't do anything.
     */

}


/* =========================================================
   PLAYER CHANGE
========================================================= */

async function handlePlayerChange(
    payload
) {

    const player =
        payload?.new;


    if (!player) {

        return;

    }


    const playerNumber =
        Number(
            player.player_number
        );


    if (
        playerNumber ===
        Number(
            oneVOnePlayerNumber
        )
    ) {

        oneVOnePlayerScore =
            Number(
                player.score
            ) || 0;

    } else {

        oneVOneOpponentScore =
            Number(
                player.score
            ) || 0;


        oneVOneOpponentName =
            player.display_name ||
            oneVOneOpponentName;

    }


    updateOneVOneScores();

    updateOpponentName();


    /*
     * Show waiting message when the opponent
     * has answered the current question.
     */

    if (
        playerNumber !==
        Number(
            oneVOnePlayerNumber
        )
    ) {

        const waiting =
            getElement(
                "waitingForOpponent"
            );


        const answeredQuestion =
            Number(
                player.answered_question
            );


        if (
            waiting &&
            Number.isFinite(
                answeredQuestion
            ) &&
            answeredQuestion >=
            oneVOneCurrentQuestion
        ) {

            waiting.hidden =
                false;

        }

    }


    /*
     * Refresh from the database so the
     * displayed score is authoritative.
     */

    if (oneVOneActive) {

        try {

            await loadMatchPlayers();

        } catch (error) {

            console.error(
                "Could not refresh player scores:",
                error
            );

        }

    }

}


/* =========================================================
   ANSWER CHANGE
========================================================= */

async function handleAnswerChange(
    payload
) {

    const answer =
        payload?.new;


    if (!answer) {

        return;

    }


    let currentUser;


    try {

        currentUser =
            await getCurrentUser();

    } catch {

        return;

    }


    /*
     * Ignore our own realtime answer.
     */

    if (
        answer.user_id ===
        currentUser.id
    ) {

        return;

    }


    if (
        Number(
            answer.question_number
        ) ===
        Number(
            oneVOneCurrentQuestion
        )
    ) {

        const waiting =
            getElement(
                "waitingForOpponent"
            );


        if (waiting) {

            waiting.hidden =
                false;

        }

    }


    try {

        await loadMatchPlayers();

    } catch (error) {

        console.error(
            "Could not refresh after opponent answer:",
            error
        );

    }

}


/* =========================================================
   SHOW 1V1 QUESTION
========================================================= */

function showOneVOneQuestion(
    restartTimer = true
) {

    if (
        oneVOneCurrentQuestion >=
        QUESTIONS_PER_BATTLE
    ) {

        finishOneVOne();

        return;

    }


    const question =
        oneVOneQuestions[
            oneVOneCurrentQuestion
        ];


    if (!question) {

        console.error(
            "Missing 1v1 question:",
            oneVOneCurrentQuestion
        );

        return;

    }


    oneVOneAnsweringLocked =
        oneVOneAnsweredQuestions.has(
            oneVOneCurrentQuestion
        );


    const number =
        getElement(
            "oneVOneQuestionNumber"
        );

    const questionElement =
        getElement(
            "oneVOneQuestion"
        );

    const topicElement =
        getElement(
            "oneVOneQuestionTopic"
        );


    if (number) {

        number.textContent =
            oneVOneCurrentQuestion + 1;

    }


    if (questionElement) {

        questionElement.textContent =
            question.question;

    }


    const subject =
        getElement(
            "oneVOneSubject"
        )?.value ||
        "Battle";


    const topic =
        getElement(
            "oneVOneTopic"
        )?.value ||
        "Topic";


    if (topicElement) {

        topicElement.textContent =
            `${subject} • ${topic}`;

    }


    renderAnswers(
        getElement(
            "oneVOneAnswerGrid"
        ),
        question,
        handleOneVOneAnswer
    );


    if (
        oneVOneAnsweringLocked
    ) {

        disableOneVOneAnswers();

    }


    const waiting =
        getElement(
            "waitingForOpponent"
        );


    if (waiting) {

        waiting.hidden =
            true;

    }


    if (restartTimer) {

        startOneVOneTimer();

    }

}


/* =========================================================
   DISABLE 1V1 ANSWERS
========================================================= */

function disableOneVOneAnswers() {

    const buttons =
        document.querySelectorAll(
            "#oneVOneAnswerGrid .answer-button"
        );


    buttons.forEach(
        button => {

            button.disabled =
                true;

        }
    );

}


/* =========================================================
   SERVER TIME
========================================================= */

function parseServerTime(
    value
) {

    if (!value) {

        return Date.now();

    }


    const timestamp =
        new Date(
            value
        ).getTime();


    return Number.isFinite(timestamp)
        ? timestamp
        : Date.now();

}


/* =========================================================
   1V1 TIMER
========================================================= */

function startOneVOneTimer() {

    clearInterval(
        oneVOneTimerInterval
    );


    /*
     * Use the shared question_started_at
     * when available.
     */

    const startedAt =
        oneVOneQuestionStartedAt ||
        Date.now();


    oneVOneQuestionStartedAt =
        startedAt;


    const updateTimer =
        () => {

            const elapsed =
                Math.floor(
                    (
                        Date.now() -
                        startedAt
                    ) / 1000
                );


            oneVOneTimer =
                Math.max(
                    0,
                    QUESTION_TIME_LIMIT -
                    elapsed
                );


            updateOneVOneTimer();


            if (
                oneVOneTimer <=
                0
            ) {

                clearInterval(
                    oneVOneTimerInterval
                );


                oneVOneTimerInterval =
                    null;


                handleOneVOneAnswer(
                    null,
                    null
                );

            }

        };


    updateTimer();


    oneVOneTimerInterval =
        setInterval(
            updateTimer,
            250
        );

}


function updateOneVOneTimer() {

    const timer =
        getElement(
            "oneVOneTimer"
        );


    if (timer) {

        timer.textContent =
            Math.max(
                0,
                Math.ceil(
                    oneVOneTimer
                )
            );

    }

}


/* =========================================================
   1V1 ANSWER
========================================================= */

async function handleOneVOneAnswer(
    selectedIndex,
    selectedButton
) {

    if (
        oneVOneAnsweringLocked ||
        !oneVOneActive ||
        !oneVOneMatchId
    ) {

        return;

    }


    const questionNumber =
        oneVOneCurrentQuestion;


    const question =
        oneVOneQuestions[
            questionNumber
        ];


    if (!question) {

        return;

    }


    /*
     * Lock immediately.
     * This prevents double-clicks and
     * timer/click race conditions.
     */

    oneVOneAnsweringLocked =
        true;


    oneVOneAnsweredQuestions.add(
        questionNumber
    );


    clearInterval(
        oneVOneTimerInterval
    );


    oneVOneTimerInterval =
        null;


    disableOneVOneAnswers();


    const correctIndex =
        Number(
            question.answer
        );


    const correct =
        selectedIndex !== null &&
        Number(selectedIndex) ===
        correctIndex;


    const buttons =
        document.querySelectorAll(
            "#oneVOneAnswerGrid .answer-button"
        );


    if (correct) {

        selectedButton?.classList.add(
            "correct"
        );

    } else {

        selectedButton?.classList.add(
            "incorrect"
        );


        buttons.forEach(
            button => {

                if (
                    Number(
                        button.dataset.originalIndex
                    ) === correctIndex
                ) {

                    button.classList.add(
                        "correct"
                    );

                }

            }
        );

    }


    const answerTime =
        Math.max(
            0,
            Date.now() -
            (
                oneVOneQuestionStartedAt ||
                Date.now()
            )
        );


    try {

        const supabase =
            getSupabase();


        const {
            error
        } =
            await supabase.rpc(
                "record_game_answer",
                {

                    p_match_id:
                        oneVOneMatchId,

                    p_question_number:
                        questionNumber,

                    p_selected_answer:
                        selectedIndex,

                    p_correct:
                        correct,

                    p_answer_time_ms:
                        answerTime

                }
            );


        if (error) {

            throw error;

        }


        /*
         * Do NOT blindly increment the score locally.
         * The database is the authoritative score.
         */

        await loadMatchPlayers();

    } catch (error) {

        console.error(
            "Answer submission error:",
            error
        );


        /*
         * Unlock only if the answer was not
         * successfully recorded.
         */

        oneVOneAnsweredQuestions.delete(
            questionNumber
        );


        oneVOneAnsweringLocked =
            false;


        const answerButtons =
            document.querySelectorAll(
                "#oneVOneAnswerGrid .answer-button"
            );


        answerButtons.forEach(
            button => {

                button.disabled =
                    false;

            }
        );


        alert(
            error?.message ||
            "Your answer could not be submitted. Please try again."
        );


        return;

    }


    /*
     * Give both players a short moment
     * to see the answer.
     */

    setTimeout(
        async () => {

            if (
                !oneVOneActive
            ) {

                return;

            }


            const nextQuestion =
                questionNumber + 1;


            /*
             * Battle complete.
             */

            if (
                nextQuestion >=
                QUESTIONS_PER_BATTLE
            ) {

                await finishOneVOne();

                return;

            }


            /*
             * Player 1 controls the shared
             * question pointer.
             *
             * Player 2 waits for the realtime
             * match update.
             */

            if (
                Number(
                    oneVOnePlayerNumber
                ) === 1
            ) {

                await advanceSharedQuestion(
                    nextQuestion
                );

            }

        },
        700
    );

}


/* =========================================================
   ADVANCE SHARED QUESTION
========================================================= */

async function advanceSharedQuestion(
questionNumber
) {

    if (
        !oneVOneMatchId ||
        questionNumber < 0 ||
        questionNumber >= QUESTIONS_PER_BATTLE
    ) {

        return;

    }


    try {

        const supabase =
            getSupabase();


        const questionStartedAt =
            new Date().toISOString();


        const {
            error
        } =
            await supabase.rpc(
                "update_game_match",
                {

                    p_match_id:
                        oneVOneMatchId,

                    p_status:
                        "active",

                    p_question_set:
                        null,

                    p_current_question:
                        questionNumber,

                    p_question_started_at:
                        questionStartedAt

                }
            );


        if (error) {

            throw error;

        }


        /*
         * Player 1 should also immediately move.
         * The realtime event keeps Player 2 synchronized.
         */

        oneVOneCurrentQuestion =
            questionNumber;


        oneVOneQuestionStartedAt =
            parseServerTime(
                questionStartedAt
            );


        oneVOneAnsweringLocked =
            false;


        showOneVOneQuestion(
            true
        );

    } catch (error) {

        console.error(
            "Could not advance shared question:",
            error
        );

    }

}


/* =========================================================
   1V1 SCORES
========================================================= */

function updateOneVOneScores() {

    const mine =
        getElement(
            "oneVOnePlayerScore"
        );

    const opponent =
        getElement(
            "oneVOneOpponentScore"
        );


    if (mine) {

        mine.textContent =
            Number(
                oneVOnePlayerScore
            ) || 0;

    }


    if (opponent) {

        opponent.textContent =
            Number(
                oneVOneOpponentScore
            ) || 0;

    }

}


function updateOpponentName() {

    const element =
        getElement(
            "oneVOneOpponentName"
        );


    if (element) {

        element.textContent =
            oneVOneOpponentName ||
            "OPPONENT";

    }

}


/* =========================================================
   1V1 FINISH
========================================================= */

async function finishOneVOne() {

    if (
        !oneVOneMatchId ||
        oneVOneResultsRecorded
    ) {

        return;

    }


    /*
     * Prevent duplicate calls while the
     * database/realtime events are arriving.
     */

    oneVOneResultsRecorded =
        true;


    oneVOneActive =
        false;


    clearInterval(
        oneVOneTimerInterval
    );


    oneVOneTimerInterval =
        null;


    try {

        const supabase =
            getSupabase();


        /*
         * Mark this player as finished.
         */

        const {
            error: finishPlayerError
        } =
            await supabase.rpc(
                "finish_game_player",
                {

                    p_match_id:
                        oneVOneMatchId

                }
            );


        if (finishPlayerError) {

            throw finishPlayerError;

        }


        /*
         * Refresh the authoritative scores.
         */

        await loadMatchPlayers();


        /*
         * Check whether both players
         * have finished.
         */

        const {
            data: players,
            error: playersError
        } =
            await supabase
                .from("game_match_players")
                .select("*")
                .eq(
                    "match_id",
                    oneVOneMatchId
                );


        if (playersError) {

            throw playersError;

        }


        if (
            players?.length >= 2
        ) {

            const p1 =
                players.find(
                    p =>
                        Number(
                            p.player_number
                        ) === 1
                );


            const p2 =
                players.find(
                    p =>
                        Number(
                            p.player_number
                        ) === 2
                );


            /*
             * Player 1 closes the match only
             * after both players finish.
             */

            if (
                Number(
                    oneVOnePlayerNumber
                ) === 1 &&
                p1?.finished &&
                p2?.finished
            ) {

                const {
                    error: finishMatchError
                } =
                    await supabase.rpc(
                        "update_game_match",
                        {

                            p_match_id:
                                oneVOneMatchId,

                            p_status:
                                "finished"

                        }
                    );


                if (finishMatchError) {

                    console.error(
                        "Could not finish match:",
                        finishMatchError
                    );

                }

            }

        }


        /*
         * Calculate this player's result
         * using the database scores.
         */

        const result =
            getOneVOneResult();


        const points =
            calculateBattlePoints(
                oneVOnePlayerScore,
                oneVOneOpponentScore
            );


        const displayName =
            oneVOneMyName ||
            "Student";


        const {
            error: resultError
        } =
            await supabase.rpc(
                "record_game_result",
                {

                    p_display_name:
                        displayName,

                    p_points:
                        points,

                    p_result:
                        result

                }
            );


        if (resultError) {

            console.error(
                "Could not record leaderboard result:",
                resultError
            );

        }


        /*
         * Local battle points.
         */

        battlePoints =
            getBattlePoints() +
            points;


        setBattlePoints(
            battlePoints
        );


        showResults(
            oneVOnePlayerScore,
            oneVOneOpponentScore,
            points,
            oneVOneOpponentName
        );


        updateBattleStatus();

        await updateLeaderboard();


    } catch (error) {

        console.error(
            "1v1 finish error:",
            error
        );


        /*
         * We still show the result if the
         * database already contains the score.
         */

        const points =
            calculateBattlePoints(
                oneVOnePlayerScore,
                oneVOneOpponentScore
            );


        showResults(
            oneVOnePlayerScore,
            oneVOneOpponentScore,
            points,
            oneVOneOpponentName
        );

    }

}


/* =========================================================
   RESULT
========================================================= */

function getOneVOneResult() {

    if (
        oneVOnePlayerScore >
        oneVOneOpponentScore
    ) {

        return "win";

    }


    if (
        oneVOnePlayerScore <
        oneVOneOpponentScore
    ) {

        return "loss";

    }


    return "draw";

}


/* =========================================================
   RESULTS UI
========================================================= */

function showResults(
    mine,
    opponent,
    points,
    opponentLabel
) {

    const battleArena =
        getElement("battleArena");

    const oneVOneArena =
        getElement("oneVOneArena");

    const results =
        getElement("battleResults");


    if (battleArena) {

        battleArena.hidden =
            true;

    }


    if (oneVOneArena) {

        oneVOneArena.hidden =
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

    const pointsEarned =
        getElement(
            "pointsEarned"
        );

    const finalOpponentLabel =
        getElement(
            "finalOpponentLabel"
        );


    if (finalPlayerScore) {

        finalPlayerScore.textContent =
            mine;

    }


    if (finalComputerScore) {

        finalComputerScore.textContent =
            opponent;

    }


    if (pointsEarned) {

        pointsEarned.textContent =
            `+${points}`;

    }


    if (finalOpponentLabel) {

        finalOpponentLabel.textContent =
            opponentLabel ||
            "COMPUTER";

    }


    const title =
        getElement(
            "battleResultTitle"
        );

    const message =
        getElement(
            "battleResultMessage"
        );


    if (
        mine > opponent
    ) {

        if (title) {

            title.textContent =
                "🏆 You Win!";

        }


        if (message) {

            message.textContent =
                `Excellent work! You scored ${mine} out of ${QUESTIONS_PER_BATTLE} and defeated ${opponentLabel || "the computer"}.`;

        }

    } else if (
        mine < opponent
    ) {

        if (title) {

            title.textContent =
                "Keep Practising!";

        }


        if (message) {

            message.textContent =
                `You scored ${mine} out of ${QUESTIONS_PER_BATTLE}. Your opponent scored ${opponent}.`;

        }

    } else {

        if (title) {

            title.textContent =
                "🤝 It's a Draw!";

        }


        if (message) {

            message.textContent =
                `You and your opponent both scored ${mine}.`;

        }

    }


    results?.scrollIntoView({

        behavior:
            "smooth",

        block:
            "center"

    });

}


/* =========================================================
   RESET
========================================================= */

async function resetBattle() {

    clearInterval(
        battleTimerInterval
    );

    clearInterval(
        oneVOneTimerInterval
    );

    clearInterval(
        oneVOnePolling
    );


    battleTimerInterval =
        null;

    oneVOneTimerInterval =
        null;

    oneVOnePolling =
        null;


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


    oneVOneActive =
        false;

    oneVOneMatchId =
        null;

    oneVOnePlayerNumber =
        null;

    oneVOneQuestions =
        [];

    oneVOneCurrentQuestion =
        0;

    oneVOnePlayerScore =
        0;

    oneVOneOpponentScore =
        0;

    oneVOneQuestionStartedAt =
        null;

    oneVOneResultsRecorded =
        false;

    oneVOneAnsweredQuestions =
        new Set();


    await cleanupOneVOneConnection();


    const battleArena =
        getElement("battleArena");

    const oneVOneArena =
        getElement("oneVOneArena");

    const results =
        getElement("battleResults");

    const battleSetup =
        getElement("battleSetup");

    const oneVOneSetup =
        getElement("oneVOneSetup");


    if (battleArena) {

        battleArena.hidden =
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


    if (battleSetup) {

        battleSetup.hidden =
            false;

    }


    if (oneVOneSetup) {

        oneVOneSetup.hidden =
            true;

    }


    updateScores();

    updateOneVOneScores();

    updateBattleStatus();

}


/* =========================================================
   CLEANUP REALTIME
========================================================= */

async function cleanupOneVOneConnection() {

    clearInterval(
        oneVOnePolling
    );


    oneVOnePolling =
        null;


    clearInterval(
        oneVOneTimerInterval
    );


    oneVOneTimerInterval =
        null;


    if (oneVOneChannel) {

        try {

            const supabase =
                getSupabase();


            await supabase.removeChannel(
                oneVOneChannel
            );

        } catch (error) {

            console.error(
                "Channel cleanup error:",
                error
            );

        }

    }


    oneVOneChannel =
        null;

}


/* =========================================================
   CANCEL 1V1
========================================================= */

async function cancelOneVOne() {

    const matchId =
        oneVOneMatchId;


    clearInterval(
        oneVOnePolling
    );

    clearInterval(
        oneVOneTimerInterval
    );


    oneVOnePolling =
        null;

    oneVOneTimerInterval =
        null;


    try {

        if (matchId) {

            const supabase =
                getSupabase();


            const {
                error
            } =
                await supabase.rpc(
                    "cancel_game_match",
                    {

                        p_match_id:
                            matchId

                    }
                );


            if (error) {

                console.error(
                    "Cancel match error:",
                    error
                );

            }

        }

    } catch (error) {

        console.error(
            "Cancel 1v1 error:",
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


    hideMatchmaking();


    const setup =
        getElement(
            "oneVOneSetup"
        );


    if (setup) {

        setup.hidden =
            true;

    }


    updateOneVOneButton();

}


/* =========================================================
   PREMIUM
========================================================= */

function showPremiumMessage() {

    const card =
        getElement(
            "premiumBattleCard"
        );


    if (card) {

        card.style.display =
            "grid";


        card.scrollIntoView({

            behavior:
                "smooth",

            block:
                "center"

        });

    }


    alert(
        "You've used all 5 free battles. Upgrade to Premium to continue playing unlimited battles."
    );

}


function openPremium() {

    window.location.href =
        "premium.html";

}


/* =========================================================
   START BUTTON
========================================================= */

function setStartButtonLoading() {

    const button =
        getElement(
            "startBattleButton"
        );


    if (!button) {

        return;

    }


    button.dataset.originalText =
        button.textContent;


    button.disabled =
        true;


    button.textContent =
        "🤖 Creating battle...";

}


function restoreStartButton() {

    const button =
        getElement(
            "startBattleButton"
        );


    if (!button) {

        return;

    }


    const subject =
        getElement(
            "battleSubject"
        )?.value;


    const topic =
        getElement(
            "battleTopic"
        )?.value;


    button.disabled =
        !(
            subject &&
            topic
        );


    button.textContent =
        button.dataset.originalText ||
        "⚔️ Start Battle";

}


/* =========================================================
   LEADERBOARD
========================================================= */

async function updateLeaderboard() {

    try {

        const supabase =
            getSupabase();


        const {
            data,
            error
        } =
            await supabase
                .from("game_leaderboard")
                .select("*")
                .order(
                    "battle_points",
                    {
                        ascending:
                            false
                    }
                )
                .limit(10);


        if (error) {

            throw error;

        }


        const container =
            getElement(
                "leaderboardRows"
            );


        if (container) {

            container.innerHTML =
                "";


            (
                data || []
            ).forEach(
                (player, index) => {

                    const row =
                        document.createElement(
                            "div"
                        );


                    row.className =
                        "leaderboard-row";


                    const rank =
                        index === 0
                            ? "🥇"
                            : index === 1
                                ? "🥈"
                                : index === 2
                                    ? "🥉"
                                    : `#${index + 1}`;


                    row.innerHTML = `

                        <span>
                            ${rank}
                        </span>

                        <span>
                            ${escapeHTML(
                                player.display_name ||
                                "StudyMind Student"
                            )}
                        </span>

                        <strong>
                            ${Number(
                                player.battle_points || 0
                            ).toLocaleString()}
                        </strong>

                    `;


                    container.appendChild(
                        row
                    );

                }
            );


            if (
                !data?.length
            ) {

                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    "leaderboard-row";


                row.innerHTML = `

                    <span>—</span>

                    <span>
                        No battles recorded yet
                    </span>

                    <strong>0</strong>

                `;


                container.appendChild(
                    row
                );

            }

        }


        const user =
            await getCurrentUser()
                .catch(
                    () => null
                );


        if (user) {

            const me =
                data?.find(
                    player =>
                        player.user_id ===
                        user.id
                );


            const points =
                me?.battle_points ??
                getBattlePoints();


            const pointsElement =
                getElement(
                    "yourBattlePoints"
                );


            if (pointsElement) {

                pointsElement.textContent =
                    Number(
                        points
                    ).toLocaleString();

            }

        }

    } catch (error) {

        console.error(
            "Leaderboard error:",
            error
        );


        const pointsElement =
            getElement(
                "yourBattlePoints"
            );


        if (pointsElement) {

            pointsElement.textContent =
                battlePoints.toLocaleString();

        }

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


    button.textContent =
        document.body.classList.contains(
            "light-mode"
        )
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
        "study-streak.html";

}


function openStudyScore() {

    window.location.href =
        "study-score.html";

}


async function logoutStudyMind() {

    try {

        const supabase =
            getSupabase();


        await supabase.auth.signOut();

    } finally {

        window.location.href =
            "login.html";

    }

}


/* =========================================================
   DISPLAY NAME
========================================================= */

function getDisplayName(
    user
) {

    return (
        user?.user_metadata?.display_name ||
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        user?.email?.split("@")[0] ||
        "Student"
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
    value
) {

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
   GLOBALS
========================================================= */

window.startComputerBattle =
    startComputerBattle;

window.beginBattle =
    beginBattle;

window.resetBattle =
    resetBattle;

window.startOneVOneMode =
    startOneVOneMode;

window.findOneVOneOpponent =
    findOneVOneOpponent;

window.cancelOneVOne =
    cancelOneVOne;

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

