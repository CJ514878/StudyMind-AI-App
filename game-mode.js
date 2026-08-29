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

/* =========================================================
STORAGE
========================================================= */

const STORAGE_KEYS = {

```
battleCount:
    "studyMindGameBattleCount",

battlePoints:
    "studyMindBattlePoints",

premium:
    "studyMindPremium",

plan:
    "studyMindPlan",

theme:
    "studyMindTheme"
```

};

/* =========================================================
SUBJECT DATABASE
========================================================= */

const SUBJECT_TOPICS = {

```
"Accounting": [
    "Introduction to Accounting",
    "Accounting Concepts",
    "Double Entry",
    "Ledger Accounts",
    "Trial Balance",
    "Cash Book",
    "Bank Reconciliation",
    "Final Accounts",
    "Depreciation",
    "Partnership Accounts"
],

"Biology": [
    "Cell Biology",
    "Classification",
    "Nutrition",
    "Transport Systems",
    "Respiration",
    "Excretion",
    "Coordination",
    "Reproduction",
    "Genetics",
    "Evolution",
    "Ecology",
    "Human Health"
],

"Chemistry": [
    "Atomic Structure",
    "Periodic Table",
    "Chemical Bonding",
    "Mole Concept",
    "Stoichiometry",
    "Acids and Bases",
    "Redox Reactions",
    "Electrochemistry",
    "Organic Chemistry",
    "Chemical Equilibrium",
    "Rates of Reaction",
    "Separation Techniques"
],

"Computer Science": [
    "Computer Fundamentals",
    "Data Representation",
    "Algorithms",
    "Programming",
    "Variables and Data Types",
    "Control Structures",
    "Arrays",
    "Databases",
    "Computer Networks",
    "Cybersecurity",
    "Artificial Intelligence",
    "Operating Systems"
],

"Economics": [
    "Basic Economic Concepts",
    "Demand",
    "Supply",
    "Price Determination",
    "Elasticity",
    "Production",
    "Market Structures",
    "National Income",
    "Inflation",
    "Unemployment",
    "International Trade",
    "Economic Development"
],

"English Language": [
    "Parts of Speech",
    "Sentence Structure",
    "Tenses",
    "Subject-Verb Agreement",
    "Vocabulary",
    "Comprehension",
    "Summary Writing",
    "Essay Writing",
    "Formal Letters",
    "Informal Letters",
    "Figures of Speech",
    "Oral English"
],

"Further Mathematics": [
    "Algebra",
    "Functions",
    "Sequences and Series",
    "Binomial Expansion",
    "Matrices",
    "Vectors",
    "Complex Numbers",
    "Calculus",
    "Differentiation",
    "Integration",
    "Coordinate Geometry",
    "Probability"
],

"Geography": [
    "Map Reading",
    "Physical Geography",
    "Weather and Climate",
    "Rocks",
    "Landforms",
    "Rivers",
    "Soils",
    "Vegetation",
    "Population",
    "Settlement",
    "Agriculture",
    "Industry"
],

"Government": [
    "Meaning of Government",
    "Constitution",
    "Democracy",
    "Political Parties",
    "Electoral Systems",
    "Separation of Powers",
    "Rule of Law",
    "Human Rights",
    "Public Opinion",
    "Local Government",
    "International Organizations",
    "Nigerian Government"
],

"History": [
    "Ancient Civilizations",
    "African History",
    "West African History",
    "Nigerian History",
    "Colonialism",
    "Nationalism",
    "Independence",
    "World Wars",
    "Cold War",
    "Industrial Revolution",
    "Historical Sources",
    "Modern History"
],

"Information Technology": [
    "Computer Hardware",
    "Computer Software",
    "Operating Systems",
    "Internet",
    "Networking",
    "Cybersecurity",
    "Digital Communication",
    "Databases",
    "Cloud Computing",
    "Artificial Intelligence",
    "Information Systems",
    "Technology in Education"
],

"Literature": [
    "Poetry",
    "Drama",
    "Prose",
    "Plot",
    "Characterization",
    "Setting",
    "Theme",
    "Point of View",
    "Literary Devices",
    "Tragedy",
    "Comedy",
    "African Literature"
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
    "Geometry",
    "Mensuration",
    "Trigonometry",
    "Statistics",
    "Probability",
    "Coordinate Geometry",
    "Sequences",
    "Vectors"
],

"Physics": [
    "Measurement",
    "Motion",
    "Forces",
    "Energy",
    "Work and Power",
    "Momentum",
    "Simple Machines",
    "Heat",
    "Waves",
    "Sound",
    "Light",
    "Electricity",
    "Magnetism",
    "Electromagnetic Induction",
    "Atomic Physics"
],

"Quantitative Reasoning": [
    "Number Patterns",
    "Arithmetic",
    "Fractions",
    "Percentages",
    "Ratio",
    "Proportion",
    "Averages",
    "Speed Distance Time",
    "Profit and Loss",
    "Probability",
    "Geometry",
    "Data Interpretation"
],

"Religious Studies": [
    "Creation",
    "Moral Teachings",
    "Faith",
    "Leadership",
    "Justice",
    "Forgiveness",
    "Responsibility",
    "Family",
    "Community",
    "Peace",
    "Religion and Society",
    "Religious Leaders"
],

"Social Studies": [
    "Family",
    "Culture",
    "Socialization",
    "Citizenship",
    "Human Rights",
    "Leadership",
    "Conflict",
    "Peace",
    "Environment",
    "Population",
    "Social Problems",
    "National Unity"
],

"Technical Drawing": [
    "Drawing Instruments",
    "Geometric Construction",
    "Lines and Angles",
    "Orthographic Projection",
    "Isometric Drawing",
    "Scale Drawing",
    "Sections",
    "Loci",
    "Mechanical Drawing",
    "Building Drawing",
    "Dimensioning",
    "Perspective"
],

"Visual Arts": [
    "Elements of Art",
    "Principles of Design",
    "Drawing",
    "Painting",
    "Sculpture",
    "Printmaking",
    "Textiles",
    "Graphic Design",
    "Art History",
    "African Art",
    "Nigerian Art",
    "Art Appreciation"
],

"Yoruba": [
    "Yoruba Grammar",
    "Yoruba Vocabulary",
    "Yoruba Literature",
    "Yoruba Proverbs",
    "Yoruba Culture",
    "Yoruba History",
    "Yoruba Oral Tradition",
    "Yoruba Poetry",
    "Yoruba Drama",
    "Yoruba Folklore"
],

"General Knowledge": [
    "Science",
    "Geography",
    "History",
    "Technology",
    "World Knowledge",
    "African Knowledge",
    "Nigerian Knowledge",
    "Sports",
    "Space",
    "Environment"
]
```

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

let battleTimerInterval =
null;

let answeringLocked =
false;

let battleActive =
false;

let generatingBattle =
false;

/* =========================================================
DOM HELPER
========================================================= */

function getElement(id) {

```
return document.getElementById(id);
```

}

/* =========================================================
INITIALIZATION
========================================================= */

document.addEventListener(
"DOMContentLoaded",
initializeGameMode
);

function initializeGameMode() {

```
battlePoints =
    getBattlePoints();

loadTheme();

loadSubjects();

updateBattleStatus();

updateLeaderboard();

setupSubjectChange();

setupTopicChange();
```

}

/* =========================================================
SUBJECT LOADING
========================================================= */

function loadSubjects() {

```
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


const subjects =
    Object.keys(
        SUBJECT_TOPICS
    ).sort(
        (a, b) =>
            a.localeCompare(b)
    );


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
```

}

/* =========================================================
SUBJECT CHANGE
========================================================= */

function setupSubjectChange() {

```
const subjectSelect =
    getElement(
        "battleSubject"
    );

if (!subjectSelect) {
    return;
}


subjectSelect.addEventListener(
    "change",
    loadTopicsForSubject
);
```

}

/* =========================================================
TOPIC LOADING
========================================================= */

function loadTopicsForSubject() {

```
const subjectSelect =
    getElement(
        "battleSubject"
    );

const topicSelect =
    getElement(
        "battleTopic"
    );


if (
    !subjectSelect ||
    !topicSelect
) {

    return;

}


const subject =
    subjectSelect.value;


topicSelect.innerHTML =
    "";


if (!subject) {

    topicSelect.disabled =
        true;


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

    return;

}


topicSelect.disabled =
    false;


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
    SUBJECT_TOPICS[
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


updateStartButtonState();
```

}

/* =========================================================
TOPIC CHANGE
========================================================= */

function setupTopicChange() {

```
const topicSelect =
    getElement(
        "battleTopic"
    );

if (!topicSelect) {
    return;
}


topicSelect.addEventListener(
    "change",
    updateStartButtonState
);
```

}

/* =========================================================
START BUTTON STATE
========================================================= */

function updateStartButtonState() {

```
const subjectSelect =
    getElement(
        "battleSubject"
    );

const topicSelect =
    getElement(
        "battleTopic"
    );

const button =
    getElement(
        "startBattleButton"
    );


if (
    !button ||
    generatingBattle
) {

    return;

}


if (
    subjectSelect &&
    topicSelect &&
    subjectSelect.value &&
    topicSelect.value
) {

    if (
        isPremiumUser() ||
        getBattleCount() <
            FREE_BATTLE_LIMIT
    ) {

        button.disabled =
            false;

    }

} else {

    button.disabled =
        false;

}
```

}

/* =========================================================
BATTLE STATUS
========================================================= */

function updateBattleStatus() {

```
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


    if (startBattleButton) {

        startBattleButton.disabled =
            false;

        startBattleButton.textContent =
            "⚔️ Start Battle";

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
```

}

/* =========================================================
STUDY PLAN TOPICS
========================================================= */

function getTopicsFromStudyPlan() {

```
const topics = [];


const possibleKeys = [

    "studyMindPlan",

    "studyMindStudyPlan",

    "studyPlan",

    "studyMindCurrentPlan"

];


let plan = null;


for (
    const key of possibleKeys
) {

    const raw =
        localStorage.getItem(
            key
        );

    if (!raw) {
        continue;
    }


    try {

        const parsed =
            JSON.parse(
                raw
            );

        if (parsed) {

            plan =
                parsed;

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


collectTopics(
    plan,
    topics
);


return removeDuplicateTopics(
    topics
);
```

}

/* =========================================================
COLLECT STUDY PLAN TOPICS
========================================================= */

function collectTopics(
data,
topics
) {

```
if (!data) {
    return;
}


if (Array.isArray(data)) {

    data.forEach(
        item => {

            collectTopics(
                item,
                topics
            );

        }
    );

    return;

}


if (
    typeof data !==
    "object"
) {

    return;

}


const topicProperties = [

    "topic",

    "topicName",

    "title",

    "name"

];


for (
    const property of
    topicProperties
) {

    if (
        typeof data[property] ===
            "string" &&
        data[property].trim()
    ) {

        const name =
            data[property].trim();


        if (
            name.toLowerCase() !==
            "untitled topic"
        ) {

            topics.push({

                id:
                    name
                        .toLowerCase()
                        .replace(
                            /[^a-z0-9]+/g,
                            "-"
                        ),

                name

            });

        }


        break;

    }

}


Object.keys(data)
    .forEach(
        key => {

            const value =
                data[key];


            if (
                value &&
                typeof value ===
                    "object"
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

        }
    );
```

}

/* =========================================================
REMOVE DUPLICATES
========================================================= */

function removeDuplicateTopics(
topics
) {

```
const seen =
    new Set();


return topics.filter(
    topic => {

        const normalized =
            topic.name
                .trim()
                .toLowerCase();


        if (
            seen.has(
                normalized
            )
        ) {

            return false;

        }


        seen.add(
            normalized
        );


        return true;

    }
);
```

}

/* =========================================================
START COMPUTER BATTLE
========================================================= */

function startComputerBattle() {

```
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
```

}

/* =========================================================
BEGIN BATTLE
========================================================= */

async function beginBattle() {

```
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
            topic,
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
```

}

/* =========================================================
AI QUESTION GENERATION
========================================================= */

async function generateAIBattleQuestions(
subject,
topic,
difficulty
) {

```
const difficultyInstruction =
    difficulty === "mixed"
        ? "Use a balanced mixture of easy, medium and challenging questions."
        : `Make all questions ${difficulty} difficulty.`;


const prompt = `
```

You are StudyMind AI creating a competitive educational battle for a secondary-school student.

SUBJECT:
${subject}

TOPIC:
${topic}

DIFFICULTY:
${difficulty}

${difficultyInstruction}

Create exactly 10 high-quality multiple-choice questions.

IMPORTANT REQUIREMENTS:

* Exactly 10 questions.
* Exactly 4 options per question.
* Only ONE option is correct.
* Every question must genuinely test knowledge of ${topic}.
* Every question must belong to the subject ${subject}.
* Do not ask generic study-advice questions.
* Questions must be appropriate for a secondary-school student.
* Mix conceptual, application and factual questions where appropriate.
* Do not repeat questions.
* Do not make the correct answer always option A.
* Make incorrect options plausible but clearly incorrect.
* Keep questions concise enough for a timed quiz.
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

```
const response =
    await fetch(
        "/api/ask-ai",
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
```

}

/* =========================================================
PARSE AI JSON
========================================================= */

function parseAIQuestionJSON(
responseText
) {

````
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
        error,
        responseText
    );


    throw new Error(
        "StudyMind AI returned invalid question data. Please try the battle again."
    );

}
````

}

/* =========================================================
VALIDATE QUESTIONS
========================================================= */

function validateBattleQuestions(
questions
) {

```
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
```

}

/* =========================================================
SHOW QUESTION
========================================================= */

function showQuestion() {

```
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
        `${getSelectedSubject()} • ${getSelectedTopic()}`;

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
```

}

/* =========================================================
SELECTED SUBJECT
========================================================= */

function getSelectedSubject() {

```
const select =
    getElement(
        "battleSubject"
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
```

}

/* =========================================================
SELECTED TOPIC
========================================================= */

function getSelectedTopic() {

```
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
```

}

/* =========================================================
TIMER
========================================================= */

function startQuestionTimer() {

```
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
```

}

/* =========================================================
TIMER DISPLAY
========================================================= */

function updateTimerDisplay() {

```
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
```

}

/* =========================================================
HANDLE ANSWER
========================================================= */

function handleAnswer(
selectedIndex,
selectedButton
) {

```
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
```

}

/* =========================================================
COMPUTER TURN
========================================================= */

function computerTakeTurn() {

```
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
```

}

/* =========================================================
UPDATE SCORES
========================================================= */

function updateScores() {

```
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
```

}

/* =========================================================
FINISH BATTLE
========================================================= */

function finishBattle() {

```
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
```

}

/* =========================================================
POINTS
========================================================= */

function calculateBattlePoints() {

```
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
```

}

/* =========================================================
RESET BATTLE
========================================================= */

function resetBattle() {

```
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
```

}

/* =========================================================
PREMIUM MESSAGE
========================================================= */

function showPremiumMessage() {

```
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
```

}

/* =========================================================
SETUP MESSAGE
========================================================= */

function showBattleSetupMessage(
message
) {

```
alert(
    message
);
```

}

/* =========================================================
AI ERROR
========================================================= */

function showBattleGenerationError(
error
) {

```
const message =
    error?.message ||
    "StudyMind AI could not create the battle right now.";


alert(
    `${message}\n\nPlease try again in a moment.`
);
```

}

/* =========================================================
START BUTTON LOADING
========================================================= */

function setStartButtonLoading() {

```
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
```

}

/* =========================================================
RESTORE START BUTTON
========================================================= */

function restoreStartButton() {

```
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


button.disabled =
    false;

button.textContent =
    "⚔️ Start Battle";
```

}

/* =========================================================
BATTLE COUNT
========================================================= */

function getBattleCount() {

```
return Number(
    localStorage.getItem(
        STORAGE_KEYS.battleCount
    )
) || 0;
```

}

function setBattleCount(
count
) {

```
localStorage.setItem(
    STORAGE_KEYS.battleCount,
    String(count)
);
```

}

/* =========================================================
BATTLE POINTS
========================================================= */

function getBattlePoints() {

```
return Number(
    localStorage.getItem(
        STORAGE_KEYS.battlePoints
    )
) || 0;
```

}

function setBattlePoints(
points
) {

```
localStorage.setItem(
    STORAGE_KEYS.battlePoints,
    String(points)
);
```

}

/* =========================================================
PREMIUM
========================================================= */

function isPremiumUser() {

```
const premium =
    localStorage.getItem(
        STORAGE_KEYS.premium
    );


return (
    premium === "true" ||
    premium === "1"
);
```

}

function openPremium() {

```
window.location.href =
    "premium.html";
```

}

/* =========================================================
LEADERBOARD
========================================================= */

function updateLeaderboard() {

```
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
```

}

/* =========================================================
THEME
========================================================= */

function loadTheme() {

```
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
```

}

function toggleGameTheme() {

```
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
```

}

function updateThemeButton() {

```
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
```

}

/* =========================================================
NAVIGATION
========================================================= */

function openHome() {

```
window.location.href =
    "home.html";
```

}

function openNewStudyPlan() {

```
window.location.href =
    "index.html";
```

}

function openSummarizer() {

```
window.location.href =
    "summarizer.html";
```

}

function openStudyStreak() {

```
window.location.href =
    "study-streak.html";
```

}

function openStudyScore() {

```
window.location.href =
    "study-score.html";
```

}

function logoutStudyMind() {

```
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
```

}

/* =========================================================
SHUFFLE
========================================================= */

function shuffleArray(
array
) {

```
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
```

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
