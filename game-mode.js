/* =========================================================
STUDYMIND AI — GAME MODE
AI-POWERED BATTLE SYSTEM
========================================================= */

"use strict";

/* =========================================================
SETTINGS
========================================================= */

const FREE_BATTLE_LIMIT = 5;
const QUESTIONS_PER_BATTLE = 10;
const QUESTION_TIME_LIMIT = 15;

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
SUBJECTS + TOPICS
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

    /* =====================================================
       GENERAL KNOWLEDGE
       ===================================================== */

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
GAME STATE
========================================================= */

let battleQuestions = [];

let currentQuestionIndex = 0;

let playerScore = 0;

let computerScore = 0;

let battlePoints = 0;

let battleTimer =
QUESTION_TIME_LIMIT;

let battleTimerInterval = null;

let answeringLocked = false;

let battleActive = false;

let generatingBattle = false;

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

updateLeaderboard();

loadSubjects();

setupSubjectChange();


}

/* =========================================================
LOAD SUBJECTS
========================================================= */

function loadSubjects() {


const subjectSelect =
    getElement(
        "battleSubject"
    );

if (!subjectSelect) {
    return;
}


subjectSelect.innerHTML = "";


const defaultOption =
    document.createElement(
        "option"
    );

defaultOption.value = "";

defaultOption.textContent =
    "Choose a subject";

subjectSelect.appendChild(
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

            subjectSelect.appendChild(
                option
            );

        }
    );


}

/* =========================================================
SUBJECT CHANGE
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

        const subject =
            subjectSelect.value;


        if (!topicSelect) {
            return;
        }


        topicSelect.innerHTML =
            "";


        if (!subject) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                "";

            option.textContent =
                "Choose a subject first";

            topicSelect.appendChild(
                option
            );

            topicSelect.disabled =
                true;

            if (startButton) {
                startButton.disabled =
                    true;
            }

            return;

        }


        const defaultOption =
            document.createElement(
                "option"
            );

        defaultOption.value =
            "";

        defaultOption.textContent =
            "Choose a topic";

        topicSelect.appendChild(
            defaultOption
        );


        const topics =
            SUBJECT_DATABASE[
                subject
            ] || [];


        topics
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


        if (startButton) {
            startButton.disabled =
                true;
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


            const canStart =
                Boolean(
                    subjectSelect.value &&
                    topicSelect.value
                );


            startButton.disabled =
                !canStart;

        }
    );

}


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

const battleStatusText =
    getElement(
        "battleStatusText"
    );

const computerModeButton =
    getElement(
        "computerModeButton"
    );

const startBattleButton =
    getElement(
        "startBattleButton"
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

    if (
        startBattleButton &&
        getElement("battleSubject")?.value &&
        getElement("battleTopic")?.value
    ) {

        startBattleButton.disabled =
            false;

    }

}


}

/* =========================================================
START COMPUTER BATTLE
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

    setup.scrollIntoView({

        behavior:
            "smooth",

        block:
            "center"

    });

}


}

/* =========================================================
BEGIN BATTLE
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
    subjectSelect?.value || "";


const topic =
    topicSelect?.value || "";


const difficulty =
    difficultySelect?.value ||
    "mixed";


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
            topic,
            difficulty
        );


    if (
        !Array.isArray(questions) ||
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

            behavior:
                "smooth",

            block:
                "start"

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
AI QUESTION GENERATION
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

IMPORTANT REQUIREMENTS:

* All 10 questions MUST be about the specified subject and topic.
* Exactly 10 questions.
* Exactly 4 options per question.
* Only ONE option is correct.
* Questions must genuinely test knowledge.
* Questions must NOT be generic study-advice questions.
* Questions must be appropriate for a secondary-school student.
* Mix conceptual, application and factual questions where appropriate.
* Do not repeat questions.
* Do not make the correct answer always option A.
* Make incorrect options plausible but clearly incorrect.
* Keep questions concise enough for a 15-second timed quiz.
* Return ONLY valid JSON.
* Do NOT use markdown.
* Do NOT include explanations outside the JSON.

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
        !Array.isArray(parsed)
    ) {

        throw new Error(
            "AI response was not an array."
        );

    }


    return parsed;

} catch (error) {

    console.error(
        "AI question JSON parse error:",
        error,
        responseText
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
                question.options.length !==
                    4
            ) {

                throw new Error(
                    `Question ${index + 1} must have exactly 4 answer options.`
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

    const subject =
        getElement(
            "battleSubject"
        )?.value || "";

    const topic =
        getElement(
            "battleTopic"
        )?.value || "";

    questionTopic.textContent =
        `${subject} • ${topic}`;

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
            (answer, index) => ({

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
    setInterval(
        () => {

            battleTimer--;

            updateTimerDisplay();


            if (
                battleTimer <=
                0
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
HANDLE ANSWER
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
    selectedIndex !==
        null &&
    selectedIndex ===
        correctIndex
) {

    playerScore++;


    if (selectedButton) {

        selectedButton
            .classList
            .add(
                "correct"
            );

    }

} else {

    if (selectedButton) {

        selectedButton
            .classList
            .add(
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

                button
                    .classList
                    .add(
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


if (difficultySelect) {

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
FINISH BATTLE
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
            `You scored ${playerScore} out of ${QUESTIONS_PER_BATTLE}. Review the topic and try again when another battle is available.`;

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

        behavior:
            "smooth",

        block:
            "center"

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
RESET BATTLE
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
}


if (setup) {

    setup.scrollIntoView({

        behavior:
            "smooth",

        block:
            "center"

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

/* =========================================================
SETUP MESSAGE
========================================================= */

function showBattleSetupMessage(
message
) {


alert(message);


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


const subject =
    getElement(
        "battleSubject"
    )?.value || "";

const topic =
    getElement(
        "battleTopic"
    )?.value || "";


button.disabled =
    !(subject && topic);


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
    rank = 3;
}


if (
    battlePoints >=
    2180
) {
    rank = 2;
}


if (
    battlePoints >=
    2450
) {
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
    "study-streak.html";


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
SHUFFLE
========================================================= */

function shuffleArray(array) {
    

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
