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


/* =========================================================
   HELPERS
========================================================= */

function getElement(id) {

    return document.getElementById(id);

}


function getSupabase() {

    if (
        typeof window.supabaseClient !==
        "undefined" &&
        window.supabaseClient
    ) {

        return window.supabaseClient;

    }

    if (
        typeof window.supabase !==
        "undefined" &&
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

    await updateLeaderboard();

}


/* =========================================================
   SUBJECTS
========================================================= */

function loadSubjects() {

    populateSubjectSelect(
        getElement(
            "battleSubject"
        )
    );

}


function loadOneVOneSubjects() {

    populateSubjectSelect(
        getElement(
            "oneVOneSubject"
        )
    );

}


function populateSubjectSelect(select) {

    if (!select) {

        return;

    }

    select.innerHTML = "";

    const defaultOption =
        document.createElement(
            "option"
        );

    defaultOption.value = "";

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
                    document.createElement(
                        "option"
                    );

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
                        topicSelect.value
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


    topicSelect.innerHTML = "";


    if (!subjectSelect?.value) {

        const option =
            document.createElement(
                "option"
            );

        option.value = "";

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
        document.createElement(
            "option"
        );

    defaultOption.value = "";

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


    topicSelect.disabled =
        false;

}


/* =========================================================
   1V1 CONTROLS
========================================================= */

function setupOneVOneControls() {

    const subject =
        getElement(
            "oneVOneSubject"
        );

    const topic =
        getElement(
            "oneVOneTopic"
        );

    const button =
        getElement(
            "findOpponentButton"
        );


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
        getElement(
            "oneVOneSubject"
        );

    const topic =
        getElement(
            "oneVOneTopic"
        );

    const button =
        getElement(
            "findOpponentButton"
        );


    if (!button) {

        return;

    }


    button.disabled =
        !(
            subject?.value &&
            topic?.value
        );

}


/* =========================================================
   BATTLE STATUS
========================================================= */

function updateBattleStatus() {

    const used =
        getBattleCount();

    const battlesUsed =
        getElement(
            "battlesUsed"
        );

    const battleLimit =
        getElement(
            "battleLimit"
        );

    const status =
        getElement(
            "battleStatusText"
        );

    const premiumCard =
        getElement(
            "premiumBattleCard"
        );


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


    if (
        remaining <= 0 &&
        premiumCard
    ) {

        premiumCard.style.display =
            "grid";

    }

}


/* =========================================================
   START COMPUTER
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
        getBattleCount() >=
        FREE_BATTLE_LIMIT
    ) {

        showPremiumMessage();

        return;

    }


    const subject =
        getElement(
            "battleSubject"
        )?.value || "";

    const topic =
        getElement(
            "battleTopic"
        )?.value || "";

    const difficulty =
        getElement(
            "battleDifficulty"
        )?.value ||
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


        getElement(
            "battleSetup"
        ).hidden = true;

        getElement(
            "battleResults"
        ).hidden = true;

        getElement(
            "battleArena"
        ).hidden = false;


        updateScores();

        showQuestion();


        getElement(
            "battleArena"
        ).scrollIntoView({

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


    const data =
        await response.json();


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
        cleaned.indexOf(
            "["
        );

    const last =
        cleaned.lastIndexOf(
            "]"
        );


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


    getElement(
        "currentQuestionNumber"
    ).textContent =
        currentQuestionIndex + 1;


    getElement(
        "battleQuestion"
    ).textContent =
        question.question;


    const subject =
        getElement(
            "battleSubject"
        )?.value || "";

    const topic =
        getElement(
            "battleTopic"
        )?.value || "";


    getElement(
        "battleQuestionTopic"
    ).textContent =
        `${subject} • ${topic}`;


    renderAnswers(
        getElement(
            "answerGrid"
        ),
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
   COMPUTER FINISH
========================================================= */

function finishBattle() {

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
        getBattleCount() >=
        FREE_BATTLE_LIMIT
    ) {

        showPremiumMessage();

        return;

    }


    const setup =
        getElement(
            "oneVOneSetup"
        );


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
        getBattleCount() >=
        FREE_BATTLE_LIMIT
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
            ).value;

        const topic =
            getElement(
                "oneVOneTopic"
            ).value;

        const difficulty =
            getElement(
                "oneVOneDifficulty"
            ).value;


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


        /*
         * First look for a suitable
         * existing waiting match.
         */

        const supabase =
            getSupabase();


        const {
            data: waitingMatches,
            error
        } =
            await supabase
                .from(
                    "game_matches"
                )
                .select(
                    "*"
                )
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
                        ascending:
                            true
                    }
                )
                .limit(1);


        if (error) {

            throw error;

        }


        if (
            waitingMatches &&
            waitingMatches.length
        ) {

            await joinExistingMatch(
                waitingMatches[0]
            );

            return;

        }


        /*
         * Nobody is waiting.
         * Create a new match.
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


        oneVOneMatchId =
            createdMatch;

        oneVOnePlayerNumber =
            1;


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


        hideMatchmaking();


        alert(
            error.message ||
            "Could not start matchmaking."
        );

    }

}


/* =========================================================
   JOIN EXISTING MATCH
========================================================= */

async function joinExistingMatch(
    match
) {

    const supabase =
        getSupabase();


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
         * Someone may have taken
         * the match between our
         * SELECT and RPC call.
         *
         * Try again.
         */

        oneVOneMatchId =
            null;

        await findOneVOneOpponent();

        return;

    }


    oneVOneMatchId =
        match.id;

    oneVOnePlayerNumber =
        playerNumber;


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
        getElement(
            "oneVOneSetup"
        );

    const status =
        getElement(
            "matchmakingStatus"
        );


    if (setup) {

        setup.hidden =
            false;

    }


    if (status) {

        status.hidden =
            false;

    }


    const button =
        getElement(
            "findOpponentButton"
        );


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
        getElement(
            "matchmakingTitle"
        );

    const messageElement =
        getElement(
            "matchmakingMessage"
        );


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
        getElement(
            "matchmakingStatus"
        );


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
                .from(
                    "game_match_players"
                )
                .select(
                    "*"
                )
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

            return;

        }


        if (
            data?.length >= 2
        ) {

            clearInterval(
                oneVOnePolling
            );


            await loadMatchPlayers();

            await waitForMatchToStart();

        }

    } catch {

        /* Ignore temporary polling errors. */

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
            .from(
                "game_match_players"
            )
            .select(
                "*"
            )
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


    const me =
        data.find(
            p =>
                p.player_number ===
                oneVOnePlayerNumber
        );


    const opponent =
        data.find(
            p =>
                p.player_number !==
                oneVOnePlayerNumber
        );


    if (me) {

        oneVOnePlayerScore =
            me.score || 0;

    }


    if (opponent) {

        oneVOneOpponentScore =
            opponent.score || 0;

        oneVOneOpponentName =
            opponent.display_name ||
            "Opponent";

    }


    updateOneVOneScores();

    updateOpponentName();


    return data;

}


/* =========================================================
   WAIT FOR START
========================================================= */

async function waitForMatchToStart() {

    if (!oneVOneMatchId) {

        return;

    }


    const supabase =
        getSupabase();


    const {
        data: match,
        error
    } =
        await supabase
            .from(
                "game_matches"
            )
            .select(
                "*"
            )
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
        "active"
    ) {

        await startOneVOneBattle(
            match
        );

        return;

    }


    if (
        oneVOnePlayerNumber === 1
    ) {

        await generateAndStartMatch(
            match
        );

    } else {

        updateMatchmakingText(
            "Opponent found!",
            "Player 1 is preparing the questions..."
        );

    }

}


/* =========================================================
   GENERATE MATCH
========================================================= */

async function generateAndStartMatch(
    match
) {

    if (
        !match ||
        oneVOnePlayerNumber !== 1
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


        const supabase =
            getSupabase();


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
                        new Date()
                            .toISOString()

                }
            );


        if (error) {

            throw error;

        }


        await startOneVOneBattle({

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

            status:
                "active"

        });

    } catch (error) {

        console.error(
            error
        );


        alert(
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

    if (
        oneVOneActive
    ) {

        return;

    }


    clearInterval(
        oneVOnePolling
    );


    const questions =
        match.question_set;


    if (
        !Array.isArray(questions) ||
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
        Number(
            match.current_question || 0
        );


    oneVOneActive =
        true;

    oneVOneAnsweringLocked =
        false;


    if (!isPremiumUser()) {

        setBattleCount(
            getBattleCount() + 1
        );

    }


    updateBattleStatus();

    hideMatchmaking();


    getElement(
        "oneVOneSetup"
    ).hidden = true;

    getElement(
        "battleArena"
    ).hidden = true;

    getElement(
        "battleResults"
    ).hidden = true;

    getElement(
        "oneVOneArena"
    ).hidden = false;


    await loadMatchPlayers();

    showOneVOneQuestion();


    getElement(
        "oneVOneArena"
    ).scrollIntoView({

        behavior:
            "smooth",

        block:
            "start"

    });

}


/* =========================================================
   1V1 REALTIME
========================================================= */

async function subscribeToOneVOne(
    matchId
) {

    const supabase =
        getSupabase();


    if (oneVOneChannel) {

        await supabase.removeChannel(
            oneVOneChannel
        );

    }


    oneVOneChannel =
        supabase
            .channel(
                `studymind-1v1-${matchId}`
            )


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

                    await handleMatchChange(
                        payload
                    );

                }

            )


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

                    await handlePlayerChange(
                        payload
                    );

                }

            )


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

                    await handleAnswerChange(
                        payload
                    );

                }

            )


            .subscribe(
                status => {

                    const sync =
                        getElement(
                            "oneVOneSyncStatus"
                        );


                    if (sync) {

                        sync.textContent =
                            status === "SUBSCRIBED"
                                ? "Synchronized"
                                : "Connecting...";

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
        payload.new;


    if (!match) {

        return;

    }


    if (
        match.status ===
        "active"
    ) {

        if (
            !oneVOneActive
        ) {

            await startOneVOneBattle(
                match
            );

        }

        return;

    }


    if (
        match.status ===
        "finished"
    ) {

        await loadMatchPlayers();

        finishOneVOne();

    }


}


/* =========================================================
   PLAYER CHANGE
========================================================= */

async function handlePlayerChange(
payload
) {

    const player =
        payload.new;


    if (!player) {

        return;

    }


    if (
        player.player_number ===
        oneVOnePlayerNumber
    ) {

        oneVOnePlayerScore =
            player.score || 0;

    } else {

        oneVOneOpponentScore =
            player.score || 0;

        oneVOneOpponentName =
            player.display_name ||
            oneVOneOpponentName;

    }


    updateOneVOneScores();

    updateOpponentName();


    if (
        player.player_number !==
        oneVOnePlayerNumber
    ) {

        const waiting =
            getElement(
                "waitingForOpponent"
            );


        if (
            waiting &&
            player.answered_question >=
            oneVOneCurrentQuestion
        ) {

            waiting.hidden =
                false;

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
        payload.new;


    if (!answer) {

        return;

    }


    if (
        answer.user_id ===
        (await getCurrentUser()).id
    ) {

        return;

    }


    if (
        answer.question_number ===
        oneVOneCurrentQuestion
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


    await loadMatchPlayers();

}


/* =========================================================
   SHOW 1V1 QUESTION
========================================================= */

function showOneVOneQuestion() {

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


    oneVOneAnsweringLocked =
        false;


    getElement(
        "oneVOneQuestionNumber"
    ).textContent =
        oneVOneCurrentQuestion + 1;


    getElement(
        "oneVOneQuestion"
    ).textContent =
        question.question;


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


    getElement(
        "oneVOneQuestionTopic"
    ).textContent =
        `${subject} • ${topic}`;


    renderAnswers(
        getElement(
            "oneVOneAnswerGrid"
        ),
        question,
        handleOneVOneAnswer
    );


    const waiting =
        getElement(
            "waitingForOpponent"
        );


    if (waiting) {

        waiting.hidden =
            true;

    }


    startOneVOneTimer();

}


/* =========================================================
   1V1 TIMER
========================================================= */

function startOneVOneTimer() {

    clearInterval(
        oneVOneTimerInterval
    );


    oneVOneTimer =
        QUESTION_TIME_LIMIT;


    oneVOneQuestionStartedAt =
        Date.now();


    updateOneVOneTimer();


    oneVOneTimerInterval =
        setInterval(
            () => {

                oneVOneTimer--;

                updateOneVOneTimer();


                if (
                    oneVOneTimer <=
                    0
                ) {

                    clearInterval(
                        oneVOneTimerInterval
                    );


                    handleOneVOneAnswer(
                        null,
                        null
                    );

                }

            },
            1000
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
                oneVOneTimer
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
        !oneVOneActive
    ) {

        return;

    }


    oneVOneAnsweringLocked =
        true;


    clearInterval(
        oneVOneTimerInterval
    );


    const question =
        oneVOneQuestions[
            oneVOneCurrentQuestion
        ];


    const correctIndex =
        Number(
            question.answer
        );


    const correct =
        selectedIndex !== null &&
        selectedIndex === correctIndex;


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
            oneVOneQuestionStartedAt
        );


    try {

        const supabase =
            getSupabase();


        await supabase.rpc(
            "record_game_answer",
            {

                p_match_id:
                    oneVOneMatchId,

                p_question_number:
                    oneVOneCurrentQuestion,

                p_selected_answer:
                    selectedIndex,

                p_correct:
                    correct,

                p_answer_time_ms:
                    answerTime

            }
        );


        if (correct) {

            oneVOnePlayerScore++;

        }


        updateOneVOneScores();


    } catch (error) {

        console.error(
            "Answer submission error:",
            error
        );

    }


    setTimeout(
        async () => {

            oneVOneCurrentQuestion++;


            if (
                oneVOneCurrentQuestion >=
                QUESTIONS_PER_BATTLE
            ) {

                await finishOneVOne();

                return;

            }


            if (
                oneVOnePlayerNumber === 1
            ) {

                await advanceSharedQuestion(
                    oneVOneCurrentQuestion
                );

            }


            showOneVOneQuestion();

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

    if (!oneVOneMatchId) {

        return;

    }


    try {

        const supabase =
            getSupabase();


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
                    new Date()
                        .toISOString()

            }
        );

    } catch (error) {

        console.error(
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
            oneVOnePlayerScore;

    }


    if (opponent) {

        opponent.textContent =
            oneVOneOpponentScore;

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


    oneVOneResultsRecorded =
        true;

    oneVOneActive =
        false;


    clearInterval(
        oneVOneTimerInterval
    );


    try {

        const supabase =
            getSupabase();


        await supabase.rpc(
            "finish_game_player",
            {

                p_match_id:
                    oneVOneMatchId

            }
        );


        await loadMatchPlayers();


        if (
            oneVOnePlayerNumber === 1
        ) {

            const {
                data: players
            } =
                await supabase
                    .from(
                        "game_match_players"
                    )
                    .select(
                        "*"
                    )
                    .eq(
                        "match_id",
                        oneVOneMatchId
                    );


            if (
                players?.length >= 2
            ) {

                const p1 =
                    players.find(
                        p =>
                            p.player_number === 1
                    );

                const p2 =
                    players.find(
                        p =>
                            p.player_number === 2
                    );


                if (
                    p1?.finished &&
                    p2?.finished
                ) {

                    await supabase.rpc(
                        "update_game_match",
                        {

                            p_match_id:
                                oneVOneMatchId,

                            p_status:
                                "finished"

                        }
                    );

                }

            }

        }


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


        const supabaseAgain =
            getSupabase();


        await supabaseAgain.rpc(
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

    }

}


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
   RESULTS
========================================================= */

function showResults(
mine,
opponent,
points,
opponentLabel
) {

    getElement(
        "battleArena"
    ).hidden = true;


    getElement(
        "oneVOneArena"
    ).hidden = true;


    getElement(
        "battleResults"
    ).hidden = false;


    getElement(
        "finalPlayerScore"
    ).textContent =
        mine;


    getElement(
        "finalComputerScore"
    ).textContent =
        opponent;


    getElement(
        "pointsEarned"
    ).textContent =
        `+${points}`;


    getElement(
        "finalOpponentLabel"
    ).textContent =
        opponentLabel ||
        "COMPUTER";


    const title =
        getElement(
            "battleResultTitle"
        );

    const message =
        getElement(
            "battleResultMessage"
        );


    if (mine > opponent) {

        title.textContent =
            "🏆 You Win!";

        message.textContent =
            `Excellent work! You scored ${mine} out of ${QUESTIONS_PER_BATTLE} and defeated ${opponentLabel || "the computer"}.`;

    } else if (
        mine < opponent
    ) {

        title.textContent =
            "Keep Practising!";

        message.textContent =
            `You scored ${mine} out of ${QUESTIONS_PER_BATTLE}. Your opponent scored ${opponent}.`;

    } else {

        title.textContent =
            "🤝 It's a Draw!";

        message.textContent =
            `You and your opponent both scored ${mine}.`;

    }


    getElement(
        "battleResults"
    ).scrollIntoView({

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

    oneVOneResultsRecorded =
        false;


    const supabase =
        getSupabase();


    if (oneVOneChannel) {

        await supabase.removeChannel(
            oneVOneChannel
        );

        oneVOneChannel =
            null;

    }


    getElement(
        "battleArena"
    ).hidden = true;

    getElement(
        "oneVOneArena"
    ).hidden = true;

    getElement(
        "battleResults"
    ).hidden = true;

    getElement(
        "battleSetup"
    ).hidden = false;

    getElement(
        "oneVOneSetup"
    ).hidden = true;


    updateScores();

    updateOneVOneScores();

    updateBattleStatus();

}


/* =========================================================
   CANCEL 1V1
========================================================= */

async function cancelOneVOne() {

    clearInterval(
        oneVOnePolling
    );


    clearInterval(
        oneVOneTimerInterval
    );


    try {

        if (oneVOneMatchId) {

            const supabase =
                getSupabase();


            await supabase.rpc(
                "cancel_game_match",
                {

                    p_match_id:
                        oneVOneMatchId

                }
            );


            if (oneVOneChannel) {

                await supabase.removeChannel(
                    oneVOneChannel
                );

            }

        }

    } catch (error) {

        console.error(
            error
        );

    }


    oneVOneMatchId =
        null;

    oneVOnePlayerNumber =
        null;

    oneVOneChannel =
        null;

    oneVOneActive =
        false;

    oneVOneResultsRecorded =
        false;


    hideMatchmaking();


    const setup =
        getElement(
            "oneVOneSetup"
        );


    if (setup) {

        setup.hidden =
            true;

    }

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
                .from(
                    "game_leaderboard"
                )
                .select(
                    "*"
                )
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


        if (!container) {

            return;

        }


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
                me?.battle_points ||
                getBattlePoints();


            getElement(
                "yourBattlePoints"
            ).textContent =
                Number(
                    points
                ).toLocaleString();

        }

    } catch (error) {

        console.error(
            "Leaderboard error:",
            error
        );

        getElement(
            "yourBattlePoints"
        ).textContent =
            battlePoints.toLocaleString();

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
