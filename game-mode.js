"use strict";

/* =========================================================
   STUDYMIND AI — COMPUTER BATTLE
   AI POWERED BATTLE ENGINE
========================================================= */


/* =========================================================
   SETTINGS
========================================================= */

const BATTLE_CONFIG = {

    QUESTIONS: 10,

    TIME_PER_QUESTION: 15,

    FREE_BATTLES: 5,

    BASE_XP: 20,

    SPEED_BONUS: 10,

    COMBO_BONUS: 5,

    VICTORY_BONUS: 50,

    DRAW_BONUS: 20,

    PARTICIPATION_XP: 10

};


/* =========================================================
   STORAGE
========================================================= */

const STORAGE = {

    PLAN: "studyMindPlan",

    PLANS: "studyMindPlans",

    ACTIVE_PLAN: "studyMindActivePlanId",

    BATTLES: "studyMindGameBattlesUsed",

    OLD_BATTLES: "studyMindGameBattleCount",

    XP: "studyMindXP",

    BATTLE_POINTS: "studyMindBattlePoints",

    WINS: "studyMindGameWins",

    LOSSES: "studyMindGameLosses",

    DRAWS: "studyMindGameDraws",

    HISTORY: "studyMindBattleHistory",

    PREMIUM: "studyMindPremium",

    USERNAME: "studyMindUsername"

};


/* =========================================================
   STATE
========================================================= */

let battleState = {

    curriculum: "",

    subject: "",

    topic: "",

    difficulty: "adaptive",

    questions: [],

    currentQuestion: 0,

    playerScore: 0,

    aiScore: 0,

    correct: 0,

    answered: 0,

    combo: 0,

    bestCombo: 0,

    totalTime: 0,

    questionStart: 0,

    timer: null,

    timeLeft: BATTLE_CONFIG.TIME_PER_QUESTION,

    locked: false,

    results: null

};


/* =========================================================
   CURRICULUM DATABASE
=========================================================

   The battle first attempts to use the application's shared
   curriculum database.

   If that database exists, it is preferred.

   This means Home, Dashboard and Game Mode can use the same
   curriculum data without maintaining separate lists.
========================================================= */

const FALLBACK_CURRICULUMS = {

    "WAEC": {

        "Mathematics": [
            "Number Bases",
            "Fractions",
            "Indices",
            "Logarithms",
            "Surds",
            "Sets",
            "Algebraic Expressions",
            "Linear Equations",
            "Quadratic Equations",
            "Sequences and Series",
            "Variation",
            "Inequalities",
            "Graphs",
            "Coordinate Geometry",
            "Mensuration",
            "Plane Geometry",
            "Trigonometry",
            "Statistics",
            "Probability",
            "Vectors",
            "Matrices",
            "Financial Mathematics"
        ],

        "English Language": [
            "Comprehension",
            "Summary",
            "Lexis and Structure",
            "Grammar",
            "Parts of Speech",
            "Concord",
            "Tenses",
            "Clauses",
            "Phrases",
            "Vocabulary",
            "Idioms",
            "Oral English",
            "Speech Sounds",
            "Stress",
            "Intonation",
            "Essay Writing",
            "Formal Letter",
            "Informal Letter",
            "Report Writing",
            "Article Writing"
        ],

        "Physics": [
            "Measurements",
            "Scalars and Vectors",
            "Motion",
            "Speed and Velocity",
            "Acceleration",
            "Forces",
            "Newton's Laws",
            "Work Energy and Power",
            "Machines",
            "Momentum",
            "Pressure",
            "Heat",
            "Thermal Expansion",
            "Waves",
            "Sound",
            "Light",
            "Reflection",
            "Refraction",
            "Electricity",
            "Current Electricity",
            "Magnetism",
            "Electromagnetic Induction",
            "Atomic Physics",
            "Radioactivity"
        ],

        "Chemistry": [
            "Matter",
            "Atomic Structure",
            "Periodic Table",
            "Chemical Bonding",
            "Mole Concept",
            "Stoichiometry",
            "Gas Laws",
            "Acids Bases and Salts",
            "Redox Reactions",
            "Electrolysis",
            "Organic Chemistry",
            "Hydrocarbons",
            "Alcohols",
            "Carboxylic Acids",
            "Polymers",
            "Chemical Equilibrium",
            "Rates of Reaction",
            "Energy Changes",
            "Metals",
            "Non-metals"
        ],

        "Biology": [
            "Cell Structure",
            "Cell Division",
            "Nutrition",
            "Transport",
            "Respiration",
            "Excretion",
            "Coordination",
            "Reproduction",
            "Genetics",
            "Evolution",
            "Ecology",
            "Population",
            "Food Chains",
            "Adaptation",
            "Classification",
            "Microorganisms",
            "Disease",
            "Human Biology",
            "Plant Biology"
        ],

        "Government": [
            "Political Concepts",
            "Constitution",
            "Democracy",
            "Rule of Law",
            "Separation of Powers",
            "Federalism",
            "Citizenship",
            "Political Parties",
            "Electoral Systems",
            "Pressure Groups",
            "Public Opinion",
            "Legislature",
            "Executive",
            "Judiciary",
            "Local Government",
            "Public Administration",
            "International Relations",
            "ECOWAS",
            "United Nations",
            "Nigerian Political Development"
        ],

        "Economics": [
            "Basic Economic Concepts",
            "Demand",
            "Supply",
            "Price Determination",
            "Elasticity",
            "Production",
            "Cost",
            "Revenue",
            "Market Structures",
            "National Income",
            "Inflation",
            "Unemployment",
            "Money",
            "Banking",
            "Public Finance",
            "Taxation",
            "International Trade",
            "Balance of Payments",
            "Economic Development",
            "Population"
        ],

        "Geography": [
            "Map Reading",
            "Scale",
            "Latitude and Longitude",
            "Rocks",
            "Weathering",
            "Earthquakes",
            "Volcanoes",
            "Climate",
            "Rivers",
            "Drainage",
            "Coasts",
            "Population",
            "Settlement",
            "Agriculture",
            "Industry",
            "Transportation",
            "Natural Resources",
            "Environmental Issues"
        ],

        "Literature in English": [
            "Prose",
            "Drama",
            "Poetry",
            "Literary Devices",
            "Characterization",
            "Plot",
            "Setting",
            "Theme",
            "Narrative Techniques",
            "African Literature",
            "Non-African Literature"
        ]

    },


    "JAMB": {},

    "NECO": {},

    "IGCSE": {

        "Mathematics": [
            "Number",
            "Algebra",
            "Functions",
            "Sequences",
            "Coordinate Geometry",
            "Geometry",
            "Mensuration",
            "Trigonometry",
            "Vectors",
            "Statistics",
            "Probability"
        ],

        "Physics": [
            "Motion",
            "Forces",
            "Energy",
            "Thermal Physics",
            "Waves",
            "Electricity",
            "Magnetism",
            "Atomic Physics"
        ],

        "Chemistry": [
            "Particles",
            "Atomic Structure",
            "Bonding",
            "Stoichiometry",
            "Acids",
            "Bases",
            "Electricity",
            "Organic Chemistry",
            "Rates",
            "Equilibrium"
        ],

        "Biology": [
            "Cells",
            "Movement In and Out of Cells",
            "Biological Molecules",
            "Enzymes",
            "Plant Nutrition",
            "Human Nutrition",
            "Transport",
            "Respiration",
            "Coordination",
            "Reproduction",
            "Inheritance",
            "Ecology"
        ],

        "English Language": [
            "Reading",
            "Directed Writing",
            "Composition",
            "Summary",
            "Vocabulary",
            "Grammar",
            "Analysis"
        ]

    },


    "SAT": {

        "Math": [
            "Algebra",
            "Linear Equations",
            "Systems of Equations",
            "Quadratics",
            "Functions",
            "Percentages",
            "Ratios",
            "Data Analysis",
            "Geometry",
            "Trigonometry",
            "Probability"
        ],

        "Reading and Writing": [
            "Central Ideas",
            "Inference",
            "Words in Context",
            "Text Structure",
            "Command of Evidence",
            "Grammar",
            "Punctuation",
            "Transitions",
            "Rhetorical Synthesis"
        ]

    },


    "Nigerian Junior Secondary Curriculum": {

        "Mathematics": [
            "Number and Numeration",
            "Fractions",
            "Decimals",
            "Percentages",
            "Ratio",
            "Proportion",
            "Algebra",
            "Simple Equations",
            "Geometry",
            "Mensuration",
            "Statistics",
            "Probability",
            "Graphs",
            "Sets",
            "Indices"
        ],

        "Basic Science": [
            "Living Things",
            "Non-Living Things",
            "Matter",
            "Energy",
            "Force",
            "Motion",
            "Heat",
            "Light",
            "Sound",
            "Electricity",
            "Magnetism",
            "Environment",
            "Human Health",
            "Reproduction",
            "Technology"
        ],

        "Basic Technology": [
            "Technology",
            "Safety",
            "Materials",
            "Tools",
            "Machines",
            "Woodwork",
            "Metalwork",
            "Technical Drawing",
            "Electricity",
            "Building",
            "ICT"
        ],

        "English Studies": [
            "Grammar",
            "Comprehension",
            "Vocabulary",
            "Parts of Speech",
            "Tenses",
            "Sentence Structure",
            "Composition",
            "Letter Writing",
            "Summary",
            "Oral English",
            "Figures of Speech"
        ],

        "Social Studies": [
            "Family",
            "Culture",
            "Socialization",
            "Citizenship",
            "Human Rights",
            "Values",
            "Leadership",
            "Government",
            "Community Development",
            "Environment",
            "Population"
        ],

        "Civic Education": [
            "Values",
            "Citizenship",
            "Human Rights",
            "Responsibilities",
            "Democracy",
            "Rule of Law",
            "Constitution",
            "National Identity",
            "Leadership",
            "Political Participation"
        ],

        "Computer Studies": [
            "Computer Fundamentals",
            "Hardware",
            "Software",
            "Operating Systems",
            "Word Processing",
            "Spreadsheets",
            "Presentation",
            "Internet",
            "Networking",
            "Programming",
            "Algorithms",
            "Cyber Safety"
        ],

        "Business Studies": [
            "Office Practice",
            "Commerce",
            "Bookkeeping",
            "Entrepreneurship",
            "Trade",
            "Banking",
            "Insurance",
            "Consumer Education"
        ],

        "Agricultural Science": [
            "Agriculture",
            "Farm Tools",
            "Soil",
            "Crops",
            "Livestock",
            "Pests",
            "Diseases",
            "Farm Management",
            "Agricultural Economics"
        ]

    },


    "BECE": {

        "Mathematics": [
            "Number",
            "Fractions",
            "Decimals",
            "Percentages",
            "Ratio",
            "Proportion",
            "Algebra",
            "Equations",
            "Geometry",
            "Mensuration",
            "Statistics",
            "Probability",
            "Graphs",
            "Sets"
        ],

        "English Studies": [
            "Comprehension",
            "Grammar",
            "Vocabulary",
            "Composition",
            "Letter Writing",
            "Summary",
            "Parts of Speech",
            "Tenses",
            "Sentence Structure",
            "Oral English"
        ],

        "Basic Science": [
            "Matter",
            "Energy",
            "Force",
            "Motion",
            "Heat",
            "Light",
            "Sound",
            "Electricity",
            "Living Things",
            "Human Health",
            "Environment",
            "Reproduction"
        ],

        "Basic Technology": [
            "Safety",
            "Materials",
            "Tools",
            "Machines",
            "Technical Drawing",
            "Electricity",
            "Building",
            "Woodwork",
            "Metalwork",
            "ICT"
        ],

        "Social Studies": [
            "Family",
            "Culture",
            "Citizenship",
            "Socialization",
            "Leadership",
            "Human Rights",
            "Community",
            "Environment",
            "Population"
        ],

        "Civic Education": [
            "Values",
            "Citizenship",
            "Human Rights",
            "Responsibilities",
            "Democracy",
            "Rule of Law",
            "Leadership",
            "National Identity"
        ],

        "Computer Studies": [
            "Computer Fundamentals",
            "Hardware",
            "Software",
            "Internet",
            "Networking",
            "Algorithms",
            "Programming",
            "Cyber Safety"
        ]

    }

};


/* =========================================================
   DOM
========================================================= */

const $ = id => document.getElementById(id);


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    loadStats();

    loadPlanDefaults();

    setupCurriculumEvents();

    updateBattleLimit();

    if (window.lucide) {
        lucide.createIcons();
    }

});


/* =========================================================
   CURRICULUM SYSTEM
========================================================= */

function getSharedCurriculumData() {

    const possibleNames = [

        "StudyMindCurriculumData",

        "STUDYMIND_CURRICULUMS",

        "curriculumData",

        "CURRICULUM_DATA",

        "curricula",

        "studyMindCurricula"

    ];

    for (const name of possibleNames) {

        if (
            typeof window[name] === "object" &&
            window[name] !== null
        ) {

            return window[name];

        }

    }

    return null;

}


/* =========================================================
   GET CURRICULUM
========================================================= */

function getCurriculumData(curriculum) {

    const shared = getSharedCurriculumData();

    if (shared) {

        const direct =
            shared[curriculum];

        if (direct) {
            return normalizeCurriculum(direct);
        }

        const matchingKey =
            Object.keys(shared).find(
                key =>
                    key.toLowerCase() ===
                    curriculum.toLowerCase()
            );

        if (matchingKey) {
            return normalizeCurriculum(
                shared[matchingKey]
            );
        }

    }

    return normalizeCurriculum(
        FALLBACK_CURRICULUMS[curriculum] || {}
    );

}


/* =========================================================
   NORMALIZE CURRICULUM
========================================================= */

function normalizeCurriculum(data) {

    const result = {};

    if (!data || typeof data !== "object") {
        return result;
    }

    Object.entries(data).forEach(
        ([subject, value]) => {

            if (Array.isArray(value)) {

                result[subject] =
                    value
                        .map(String)
                        .filter(Boolean);

            }

            else if (
                value &&
                typeof value === "object"
            ) {

                const topics =
                    value.topics ||
                    value.topicList ||
                    value.contents ||
                    [];

                if (Array.isArray(topics)) {

                    result[subject] =
                        topics
                            .map(item => {

                                if (
                                    typeof item ===
                                    "string"
                                ) {
                                    return item;
                                }

                                return (
                                    item.name ||
                                    item.title ||
                                    item.topic ||
                                    ""
                                );

                            })
                            .filter(Boolean);

                }

            }

        }
    );

    return result;

}


/* =========================================================
   EVENTS
========================================================= */

function setupCurriculumEvents() {

    const curriculum =
        $("curriculumSelect");

    const subject =
        $("subjectSelect");

    const topic =
        $("topicSelect");

    const search =
        $("topicSearch");


    if (curriculum) {

        curriculum.addEventListener(
            "change",
            () => {

                battleState.curriculum =
                    curriculum.value;

                populateSubjects();

                updateAIInsight();

            }
        );

    }


    if (subject) {

        subject.addEventListener(
            "change",
            () => {

                battleState.subject =
                    subject.value;

                populateTopics();

                updateAIInsight();

            }
        );

    }


    if (topic) {

        topic.addEventListener(
            "change",
            () => {

                battleState.topic =
                    topic.value;

                updateAIInsight();

            }
        );

    }


    if (search) {

        search.addEventListener(
            "input",
            filterTopics
        );

    }

}


/* =========================================================
   POPULATE SUBJECTS
========================================================= */

function populateSubjects() {

    const subject =
        $("subjectSelect");

    const topic =
        $("topicSelect");

    const curriculum =
        $("curriculumSelect").value;

    subject.innerHTML = "";

    topic.innerHTML =
        `<option value="">Select a subject first</option>`;

    topic.disabled = true;


    if (!curriculum) {

        subject.disabled = true;

        subject.innerHTML =
            `<option value="">Select curriculum first</option>`;

        return;

    }


    const data =
        getCurriculumData(curriculum);

    const subjects =
        Object.keys(data)
            .sort(
                (a, b) =>
                    a.localeCompare(b)
            );


    if (!subjects.length) {

        subject.disabled = true;

        subject.innerHTML =
            `<option value="">No subjects available</option>`;

        return;

    }


    subject.disabled = false;

    subject.innerHTML =
        `<option value="">Select subject</option>`;


    subjects.forEach(name => {

        const option =
            document.createElement("option");

        option.value = name;
        option.textContent = name;

        subject.appendChild(option);

    });

}


/* =========================================================
   POPULATE TOPICS
========================================================= */

function populateTopics() {

    const curriculum =
        $("curriculumSelect").value;

    const subject =
        $("subjectSelect").value;

    const topic =
        $("topicSelect");

    topic.innerHTML =
        `<option value="">Select topic</option>`;


    if (!curriculum || !subject) {

        topic.disabled = true;

        return;

    }


    const data =
        getCurriculumData(curriculum);

    const topics =
        data[subject] || [];


    topic.disabled =
        topics.length === 0;


    topics.forEach(name => {

        const option =
            document.createElement("option");

        option.value = name;

        option.textContent = name;

        topic.appendChild(option);

    });


    const search =
        $("topicSearch");

    if (search) {
        search.value = "";
    }

}


/* =========================================================
   SEARCH TOPICS
========================================================= */

function filterTopics() {

    const query =
        $("topicSearch").value
            .trim()
            .toLowerCase();

    const select =
        $("topicSelect");

    if (!select) {
        return;
    }

    Array.from(select.options)
        .forEach(option => {

            if (!option.value) {
                return;
            }

            const match =
                option.textContent
                    .toLowerCase()
                    .includes(query);

            option.hidden =
                query.length > 0 &&
                !match;

        });

}


/* =========================================================
   PLAN DEFAULTS
========================================================= */

function loadPlanDefaults() {

    let plan = null;

    try {

        const raw =
            localStorage.getItem(
                STORAGE.PLAN
            );

        if (raw) {
            plan = JSON.parse(raw);
        }

    } catch (_) {}


    if (!plan) {

        try {

            const plans =
                JSON.parse(
                    localStorage.getItem(
                        STORAGE.PLANS
                    )
                );

            const active =
                localStorage.getItem(
                    STORAGE.ACTIVE_PLAN
                );

            if (
                Array.isArray(plans) &&
                plans.length
            ) {

                plan =
                    plans.find(
                        p =>
                            String(
                                p.id
                            ) ===
                            String(active)
                    ) ||
                    plans[0];

            }

        } catch (_) {}

    }


    if (!plan) {
        return;
    }


    const curriculum =
        plan.curriculum ||
        plan.curriculumName ||
        "";


    if (curriculum) {

        const select =
            $("curriculumSelect");

        const option =
            Array.from(
                select.options
            ).find(
                o =>
                    o.value.toLowerCase() ===
                    String(curriculum).toLowerCase()
            );

        if (option) {

            select.value =
                option.value;

            populateSubjects();

        }

    }

}


/* =========================================================
   AI INSIGHT
========================================================= */

function updateAIInsight() {

    const output =
        $("aiInsightText");

    if (!output) {
        return;
    }


    const curriculum =
        $("curriculumSelect").value;

    const subject =
        $("subjectSelect").value;

    const topic =
        $("topicSelect").value;


    if (!curriculum) {

        output.textContent =
            "Select a curriculum and topic. I'll build the battle around your learning level.";

        return;

    }


    if (!subject) {

        output.textContent =
            `Your battle will use the ${curriculum} curriculum. Choose a subject to continue.`;

        return;

    }


    if (!topic) {

        output.textContent =
            `${subject} questions will be generated from the ${curriculum} curriculum. Choose a topic for a focused battle.`;

        return;

    }


    output.textContent =
        `AI battle configured for ${curriculum} → ${subject} → ${topic}. Questions will be generated specifically for this topic.`;

}


/* =========================================================
   PREMIUM
========================================================= */

function isPremium() {

    const cached =
        localStorage.getItem(
            STORAGE.PREMIUM
        );

    if (
        cached === "true" ||
        cached === "1"
    ) {
        return true;
    }

    if (
        window.premiumStatus === true
    ) {
        return true;
    }

    if (
        typeof window.isStudyMindPremium ===
        "function"
    ) {

        try {

            return Boolean(
                window.isStudyMindPremium()
            );

        } catch (_) {}

    }

    return false;

}


/* =========================================================
   BATTLE COUNT
========================================================= */

function getBattleCount() {

    return Number(
        localStorage.getItem(
            STORAGE.BATTLES
        ) ||
        localStorage.getItem(
            STORAGE.OLD_BATTLES
        ) ||
        0
    );

}


/* =========================================================
   UPDATE LIMIT
========================================================= */

function updateBattleLimit() {

    const count =
        getBattleCount();

    const premium =
        isPremium();

    if ($("battlesUsed")) {

        $("battlesUsed")
            .textContent = count;

    }

    if ($("battleLimit")) {

        $("battleLimit")
            .textContent =
                premium
                    ? "∞"
                    : BATTLE_CONFIG.FREE_BATTLES;

    }

}


/* =========================================================
   START BATTLE
========================================================= */

async function startComputerBattle() {

    if (!isPremium() &&
        getBattleCount() >=
        BATTLE_CONFIG.FREE_BATTLES) {

        openPremium();

        return;

    }


    const curriculum =
        $("curriculumSelect").value;

    const subject =
        $("subjectSelect").value;

    const topic =
        $("topicSelect").value;

    const difficulty =
        $("difficultySelect").value;


    if (!curriculum) {

        showBattleMessage(
            "Choose a curriculum first."
        );

        return;

    }


    if (!subject) {

        showBattleMessage(
            "Choose a subject first."
        );

        return;

    }


    if (!topic) {

        showBattleMessage(
            "Choose a topic first."
        );

        return;

    }


    battleState = {

        curriculum,

        subject,

        topic,

        difficulty,

        questions: [],

        currentQuestion: 0,

        playerScore: 0,

        aiScore: 0,

        correct: 0,

        answered: 0,

        combo: 0,

        bestCombo: 0,

        totalTime: 0,

        questionStart: 0,

        timer: null,

        timeLeft:
            BATTLE_CONFIG.TIME_PER_QUESTION,

        locked: false,

        results: null

    };


    showBattleLoading();


    try {

        const questions =
            await generateBattleQuestions({

                curriculum,

                subject,

                topic,

                difficulty,

                count:
                    BATTLE_CONFIG.QUESTIONS

            });


        if (
            !Array.isArray(questions) ||
            questions.length < 1
        ) {

            throw new Error(
                "No questions returned."
            );

        }


        battleState.questions =
            questions
                .slice(
                    0,
                    BATTLE_CONFIG.QUESTIONS
                )
                .map(normalizeQuestion);


        incrementBattleCount();

        showBattleScreen();

        renderBattleQuestion();

    } catch (error) {

        console.error(
            "Computer Battle:",
            error
        );

        hideBattleLoading();

        showBattleMessage(
            "The AI could not create this battle. Please try again."
        );

    }

}


/* =========================================================
   AI QUESTION GENERATION
========================================================= */

async function generateBattleQuestions(payload) {

    /*
       IMPORTANT:

       The API receives the exact curriculum,
       subject and topic.

       This prevents the previous problem where the
       Computer Battle could default to Mathematics.
    */


    const response =
        await fetch(
            "/api/generate-questions",
            {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    mode: "computer-battle",

                    curriculum:
                        payload.curriculum,

                    subject:
                        payload.subject,

                    topic:
                        payload.topic,

                    difficulty:
                        payload.difficulty,

                    count:
                        payload.count,

                    questionCount:
                        payload.count,

                    battleMode:
                        true

                })

            }
        );


    if (!response.ok) {

        throw new Error(
            `Question API returned ${response.status}`
        );

    }


    const data =
        await response.json();


    const questions =
        data.questions ||
        data.data?.questions ||
        data.items ||
        [];


    if (!Array.isArray(questions)) {

        throw new Error(
            "Invalid question response."
        );

    }


    return questions;

}


/* =========================================================
   NORMALIZE QUESTION
========================================================= */

function normalizeQuestion(question) {

    const text =
        question.question ||
        question.questionText ||
        question.text ||
        question.prompt ||
        "";


    let options =
        question.options ||
        question.choices ||
        question.answers ||
        [];


    if (
        !Array.isArray(options)
    ) {

        options =
            Object.values(options || {});

    }


    options =
        options
            .map(option => {

                if (
                    typeof option ===
                    "string"
                ) {
                    return option;
                }

                return (
                    option.text ||
                    option.label ||
                    option.value ||
                    ""
                );

            })
            .filter(Boolean);


    let correct =
        question.correctAnswer;

    if (
        correct === undefined
    ) {
        correct =
            question.answer;
    }

    if (
        correct === undefined
    ) {
        correct =
            question.correct;
    }


    if (
        typeof correct === "string"
    ) {

        const letter =
            correct
                .trim()
                .toUpperCase();


        if (
            /^[A-D]$/.test(letter)
        ) {

            correct =
                letter.charCodeAt(0) -
                65;

        } else {

            const index =
                options.findIndex(
                    option =>
                        option
                            .toLowerCase()
                            .trim() ===
                        correct
                            .toLowerCase()
                            .trim()
                );

            if (index >= 0) {
                correct = index;
            }

        }

    }


    correct =
        Number(correct);


    return {

        question: text,

        options,

        correctAnswer:
            Number.isInteger(correct)
                ? correct
                : 0,

        explanation:
            question.explanation ||
            question.reason ||
            "",

        difficulty:
            question.difficulty ||
            battleState.difficulty

    };

}


/* =========================================================
   LOADING
========================================================= */

function showBattleLoading() {

    const button =
        $("startBattleButton");

    if (button) {

        button.disabled = true;

        button.querySelector("span")
            .textContent =
                "AI is preparing...";

    }

}


function hideBattleLoading() {

    const button =
        $("startBattleButton");

    if (button) {

        button.disabled = false;

        button.querySelector("span")
            .textContent =
                "Start Battle";

    }

}


/* =========================================================
   SHOW BATTLE
========================================================= */

function showBattleScreen() {

    $("setupScreen").style.display =
        "none";

    $("resultScreen").style.display =
        "none";

    $("battleScreen").style.display =
        "block";


    const name =
        getUsername();

    $("playerName")
        .textContent = name;

    $("questionSubject")
        .textContent =
            battleState.subject;

    $("questionTopic")
        .textContent =
            battleState.topic;

}


/* =========================================================
   RENDER QUESTION
========================================================= */

function renderBattleQuestion() {

    clearInterval(
        battleState.timer
    );


    const index =
        battleState.currentQuestion;

    const question =
        battleState.questions[index];


    if (!question) {

        finishBattle();

        return;

    }


    battleState.locked = false;

    battleState.timeLeft =
        BATTLE_CONFIG.TIME_PER_QUESTION;

    battleState.questionStart =
        Date.now();


    $("battleQuestionNumber")
        .textContent =
            `QUESTION ${index + 1} / ${battleState.questions.length}`;


    $("questionText")
        .textContent =
            question.question;


    $("questionTimer")
        .textContent =
            battleState.timeLeft;


    $("questionSubject")
        .textContent =
            battleState.subject;


    $("questionTopic")
        .textContent =
            battleState.topic;


    $("questionFeedback")
        .textContent = "";


    $("nextQuestionButton")
        .style.display =
            "none";


    renderAnswers(
        question
    );

    updateBattleUI();

    startTimer();

}


/* =========================================================
   ANSWERS
========================================================= */

function renderAnswers(question) {

    const container =
        $("answerOptions");

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
                "answer-option";

            button.innerHTML = `

                <span class="answer-letter">
                    ${String.fromCharCode(65 + index)}
                </span>

                <span class="answer-text">
                    ${escapeHTML(option)}
                </span>

            `;


            button.addEventListener(
                "click",
                () =>
                    answerQuestion(index)
            );


            container.appendChild(
                button
            );

        }
    );

}


/* =========================================================
   TIMER
========================================================= */

function startTimer() {

    clearInterval(
        battleState.timer
    );


    battleState.timer =
        setInterval(() => {

            battleState.timeLeft--;

            $("questionTimer")
                .textContent =
                    Math.max(
                        0,
                        battleState.timeLeft
                    );


            if (
                battleState.timeLeft <=
                0
            ) {

                clearInterval(
                    battleState.timer
                );

                answerQuestion(
                    -1
                );

            }

        }, 1000);

}


/* =========================================================
   ANSWER QUESTION
========================================================= */

function answerQuestion(
    selectedIndex
) {

    if (battleState.locked) {
        return;
    }


    battleState.locked = true;

    clearInterval(
        battleState.timer
    );


    const question =
        battleState.questions[
            battleState.currentQuestion
        ];


    const responseTime =
        Math.min(

            BATTLE_CONFIG.TIME_PER_QUESTION,

            (
                Date.now() -
                battleState.questionStart
            ) / 1000

        );


    battleState.totalTime +=
        responseTime;

    battleState.answered++;


    const correct =
        selectedIndex ===
        question.correctAnswer;


    const buttons =
        document.querySelectorAll(
            ".answer-option"
        );


    buttons.forEach(
        (button, index) => {

            button.disabled =
                true;


            if (
                index ===
                question.correctAnswer
            ) {

                button.classList.add(
                    "correct"
                );

            }


            if (
                index ===
                selectedIndex &&
                !correct
            ) {

                button.classList.add(
                    "incorrect"
                );

            }

        }
    );


    if (correct) {

        battleState.correct++;

        battleState.combo++;

        battleState.bestCombo =
            Math.max(
                battleState.bestCombo,
                battleState.combo
            );


        const points =
            calculateQuestionPoints(
                responseTime
            );


        battleState.playerScore +=
            points;

    } else {

        battleState.combo = 0;

    }


    /*
       AI opponent makes its own decision.

       Difficulty controls how often the AI answers correctly.
    */

    const aiCorrect =
        aiOpponentAnswer();


    if (aiCorrect) {

        battleState.aiScore +=
            calculateAIPoints();

    }


    showAnswerFeedback(
        correct,
        responseTime,
        aiCorrect
    );


    updateBattleUI();


    $("nextQuestionButton")
        .style.display =
            "inline-flex";

}


/* =========================================================
   PLAYER POINTS
========================================================= */

function calculateQuestionPoints(
    responseTime
) {

    let points =
        BATTLE_CONFIG.BASE_XP;


    /*
       Faster answer = larger reward.
    */

    const speedRatio =
        Math.max(
            0,
            (
                BATTLE_CONFIG.TIME_PER_QUESTION -
                responseTime
            ) /
            BATTLE_CONFIG.TIME_PER_QUESTION
        );


    points += Math.round(
        BATTLE_CONFIG.SPEED_BONUS *
        speedRatio
    );


    /*
       Combo bonus.
    */

    if (
        battleState.combo >= 2
    ) {

        points +=
            (
                battleState.combo -
                1
            ) *
            BATTLE_CONFIG.COMBO_BONUS;

    }


    /*
       Difficulty bonus.
    */

    const difficulty =
        battleState.difficulty;


    if (difficulty === "medium") {
        points += 5;
    }

    if (difficulty === "hard") {
        points += 15;
    }


    return points;

}


/* =========================================================
   AI POINTS
========================================================= */

function calculateAIPoints() {

    return 20;

}


/* =========================================================
   AI OPPONENT
========================================================= */

function aiOpponentAnswer() {

    const difficulty =
        battleState.difficulty;


    let probability;


    if (
        difficulty === "easy"
    ) {

        probability = 0.58;

    }

    else if (
        difficulty === "hard"
    ) {

        probability = 0.88;

    }

    else if (
        difficulty === "medium"
    ) {

        probability = 0.72;

    }

    else {

        /*
           Adaptive AI scales with player performance.
        */

        const accuracy =
            battleState.answered === 0
                ? 0
                : battleState.correct /
                  battleState.answered;


        probability =
            Math.min(
                0.90,
                Math.max(
                    0.62,
                    0.68 +
                    accuracy * 0.18
                )
            );

    }


    return Math.random() <
        probability;

}


/* =========================================================
   FEEDBACK
========================================================= */

function showAnswerFeedback(
    correct,
    responseTime,
    aiCorrect
) {

    const feedback =
        $("questionFeedback");


    if (correct) {

        feedback.innerHTML =
            `
            <span class="feedback-good">
                ✓ Correct!
            </span>
            <span>
                ${responseTime.toFixed(1)}s
                · AI ${aiCorrect ? "also scored" : "missed it"}
            </span>
            `;

    } else {

        feedback.innerHTML =
            `
            <span class="feedback-bad">
                ✕ Not quite
            </span>
            <span>
                Correct answer:
                ${
                    String.fromCharCode(
                        65 +
                        battleState.questions[
                            battleState.currentQuestion
                        ].correctAnswer
                    )
                }
            </span>
            `;

    }

}


/* =========================================================
   NEXT QUESTION
========================================================= */

function nextBattleQuestion() {

    battleState.currentQuestion++;

    renderBattleQuestion();

}


/* =========================================================
   UI
========================================================= */

function updateBattleUI() {

    $("playerScore")
        .textContent =
            battleState.playerScore;

    $("aiScore")
        .textContent =
            battleState.aiScore;

    $("comboCount")
        .textContent =
            battleState.combo;


    const accuracy =
        battleState.answered === 0
            ? 0
            :
            Math.round(
                (
                    battleState.correct /
                    battleState.answered
                ) *
                100
            );


    $("liveAccuracy")
        .textContent =
            `${accuracy}%`;


    const progress =
        (
            battleState.currentQuestion /
            battleState.questions.length
        ) *
        100;


    $("battleProgressBar")
        .style.width =
            `${progress}%`;

}


/* =========================================================
   FINISH BATTLE
========================================================= */

function finishBattle() {

    clearInterval(
        battleState.timer
    );


    const player =
        battleState.playerScore;

    const ai =
        battleState.aiScore;


    let result;


    if (player > ai) {

        result = "win";

    }

    else if (player < ai) {

        result = "loss";

    }

    else {

        result = "draw";

    }


    const accuracy =
        Math.round(
            (
                battleState.correct /
                BATTLE_CONFIG.QUESTIONS
            ) *
            100
        );


    const xp =
        calculateFinalXP(
            result,
            accuracy
        );


    battleState.results = {

        result,

        accuracy,

        xp,

        playerScore: player,

        aiScore: ai,

        correct:
            battleState.correct,

        bestCombo:
            battleState.bestCombo,

        averageTime:
            battleState.answered
                ? battleState.totalTime /
                  battleState.answered
                : 0

    };


    saveBattleResult();

    renderResults();

}


/* =========================================================
   FINAL XP
========================================================= */

function calculateFinalXP(
    result,
    accuracy
) {

    let correctXP =
        battleState.correct *
        BATTLE_CONFIG.BASE_XP;


    let speedXP = 0;

    if (
        battleState.answered
    ) {

        const average =
            battleState.totalTime /
            battleState.answered;


        speedXP =
            Math.max(
                0,
                Math.round(
                    (
                        BATTLE_CONFIG.TIME_PER_QUESTION -
                        average
                    ) *
                    2
                )
            );

    }


    const comboXP =
        battleState.bestCombo *
        BATTLE_CONFIG.COMBO_BONUS;


    let winXP = 0;

    if (result === "win") {

        winXP =
            BATTLE_CONFIG.VICTORY_BONUS;

    }

    else if (result === "draw") {

        winXP =
            BATTLE_CONFIG.DRAW_BONUS;

    }

    else {

        winXP =
            BATTLE_CONFIG.PARTICIPATION_XP;

    }


    let difficultyXP = 0;

    if (
        battleState.difficulty ===
        "medium"
    ) {

        difficultyXP = 20;

    }

    if (
        battleState.difficulty ===
        "hard"
    ) {

        difficultyXP = 40;

    }


    const total =
        correctXP +
        speedXP +
        comboXP +
        winXP +
        difficultyXP;


    /*
       Store breakdown for result screen.
    */

    battleState.xpBreakdown = {

        correctXP,

        speedXP,

        comboXP,

        winXP,

        difficultyXP

    };


    return total;

}


/* =========================================================
   RESULTS UI
========================================================= */

function renderResults() {

    $("battleScreen")
        .style.display =
            "none";

    $("resultScreen")
        .style.display =
            "block";


    const result =
        battleState.results;


    $("finalPlayerScore")
        .textContent =
            result.playerScore;

    $("finalAIScore")
        .textContent =
            result.aiScore;

    $("finalAccuracy")
        .textContent =
            `${result.accuracy}%`;

    $("finalCorrect")
        .textContent =
            `${result.correct}/${BATTLE_CONFIG.QUESTIONS}`;

    $("finalCombo")
        .textContent =
            result.bestCombo;


    $("earnedXP")
        .textContent =
            `+${result.xp} XP`;


    let rating =
        "Keep improving";


    if (result.accuracy >= 90) {
        rating = "Elite";
    }

    else if (result.accuracy >= 80) {
        rating = "Excellent";
    }

    else if (result.accuracy >= 70) {
        rating = "Strong";
    }

    else if (result.accuracy >= 60) {
        rating = "Good";
    }


    $("finalRating")
        .textContent =
            rating;


    if (
        battleState.xpBreakdown
    ) {

        $("correctXP")
            .textContent =
                `+${battleState.xpBreakdown.correctXP}`;

        $("speedXP")
            .textContent =
                `+${battleState.xpBreakdown.speedXP}`;

        $("comboXP")
            .textContent =
                `+${battleState.xpBreakdown.comboXP}`;

        $("winXP")
            .textContent =
                `+${battleState.xpBreakdown.winXP}`;

        $("difficultyXP")
            .textContent =
                `+${battleState.xpBreakdown.difficultyXP}`;

    }


    if (result.result === "win") {

        $("resultIcon")
            .textContent =
                "🏆";

        $("resultTitle")
            .textContent =
                "Victory!";

        $("resultSubtitle")
            .textContent =
                "You outperformed the StudyMind AI.";

    }

    else if (
        result.result === "draw"
    ) {

        $("resultIcon")
            .textContent =
                "⚡";

        $("resultTitle")
            .textContent =
                "Draw!";

        $("resultSubtitle")
            .textContent =
                "A very close battle.";

    }

    else {

        $("resultIcon")
            .textContent =
                "🧠";

        $("resultTitle")
            .textContent =
                "Good battle!";

        $("resultSubtitle")
            .textContent =
                "Use your performance to strengthen your weak areas.";

    }


    updateStatsAfterBattle();

}


/* =========================================================
   SAVE RESULT
========================================================= */

function saveBattleResult() {

    const result =
        battleState.results;


    let xp =
        Number(
            localStorage.getItem(
                STORAGE.XP
            ) || 0
        );


    xp += result.xp;


    localStorage.setItem(
        STORAGE.XP,
        String(xp)
    );


    let points =
        Number(
            localStorage.getItem(
                STORAGE.BATTLE_POINTS
            ) || 0
        );


    points += result.xp;


    localStorage.setItem(
        STORAGE.BATTLE_POINTS,
        String(points)
    );


    const wins =
        Number(
            localStorage.getItem(
                STORAGE.WINS
            ) || 0
        );


    const losses =
        Number(
            localStorage.getItem(
                STORAGE.LOSSES
            ) || 0
        );


    const draws =
        Number(
            localStorage.getItem(
                STORAGE.DRAWS
            ) || 0
        );


    if (result.result === "win") {

        localStorage.setItem(
            STORAGE.WINS,
            String(wins + 1)
        );

    }

    else if (
        result.result === "loss"
    ) {

        localStorage.setItem(
            STORAGE.LOSSES,
            String(losses + 1)
        );

    }

    else {

        localStorage.setItem(
            STORAGE.DRAWS,
            String(draws + 1)
        );

    }


    const history =
        getHistory();


    history.unshift({

        id:
            Date.now(),

        date:
            new Date().toISOString(),

        mode:
            "computer",

        curriculum:
            battleState.curriculum,

        subject:
            battleState.subject,

        topic:
            battleState.topic,

        difficulty:
            battleState.difficulty,

        result:
            result.result,

        playerScore:
            result.playerScore,

        aiScore:
            result.aiScore,

        accuracy:
            result.accuracy,

        xp:
            result.xp

    });


    localStorage.setItem(
        STORAGE.HISTORY,
        JSON.stringify(
            history.slice(0, 100)
        )
    );


    /*
       Notify the rest of StudyMind.
    */

    window.dispatchEvent(
        new CustomEvent(
            "studyMindXPChanged",
            {
                detail: {
                    amount:
                        result.xp
                }
            }
        )
    );

}


/* =========================================================
   STATS
========================================================= */

function loadStats() {

    const xp =
        Number(
            localStorage.getItem(
                STORAGE.XP
            ) || 0
        );


    const wins =
        Number(
            localStorage.getItem(
                STORAGE.WINS
            ) || 0
        );


    const battles =
        getBattleCount();


    $("heroXP").textContent =
        xp;

    $("heroWins").textContent =
        wins;

    $("heroBattles").textContent =
        battles;


    updateBattleLimit();

}


/* =========================================================
   UPDATE STATS
========================================================= */

function updateStatsAfterBattle() {

    loadStats();

}


/* =========================================================
   INCREMENT BATTLES
========================================================= */

function incrementBattleCount() {

    const count =
        getBattleCount() + 1;


    localStorage.setItem(
        STORAGE.BATTLES,
        String(count)
    );


    localStorage.setItem(
        STORAGE.OLD_BATTLES,
        String(count)
    );

}


/* =========================================================
   HISTORY
========================================================= */

function getHistory() {

    try {

        const value =
            JSON.parse(
                localStorage.getItem(
                    STORAGE.HISTORY
                )
            );


        return Array.isArray(value)
            ? value
            : [];

    } catch (_) {

        return [];

    }

}


/* =========================================================
   USERNAME
========================================================= */

function getUsername() {

    const saved =
        localStorage.getItem(
            STORAGE.USERNAME
        );


    if (saved) {
        return saved;
    }


    try {

        const plan =
            JSON.parse(
                localStorage.getItem(
                    STORAGE.PLAN
                )
            );


        if (
            plan &&
            plan.username
        ) {

            return plan.username;

        }

    } catch (_) {}


    return "Student";

}


/* =========================================================
   NAVIGATION
========================================================= */

function openHome() {

    window.location.href =
        "index.html";

}


function openDashboard() {

    window.location.href =
        "dashboard.html";

}


function openStudyStreak() {

    window.location.href =
        "study-streak.html";

}


function openSummarizer() {

    window.location.href =
        "summarizer.html";

}


function openPremium() {

    window.location.href =
        "premium.html";

}


function returnToGameMode() {

    window.location.reload();

}


function playAgain() {

    $("resultScreen")
        .style.display =
            "none";

    $("setupScreen")
        .style.display =
            "block";

    updateBattleLimit();

}


/* =========================================================
   THEME
========================================================= */

function toggleGameTheme() {

    document.body.classList.toggle(
        "light-mode"
    );

    localStorage.setItem(
        "studyMindTheme",
        document.body.classList.contains(
            "light-mode"
        )
            ? "light"
            : "dark"
    );

}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutStudyMind() {

    try {

        if (
            window.supabase &&
            window.supabase.auth &&
            typeof window.supabase.auth.signOut ===
                "function"
        ) {

            await window.supabase.auth.signOut();

        }

    } catch (_) {}


    localStorage.removeItem(
        STORAGE.USERNAME
    );


    window.location.href =
        "index.html";

}


/* =========================================================
   MESSAGES
========================================================= */

function showBattleMessage(
    message
) {

    const insight =
        $("aiInsightText");

    if (insight) {

        insight.textContent =
            message;

    }


    const setup =
        $("setupScreen");

    if (setup) {

        setup.classList.remove(
            "shake-card"
        );

        void setup.offsetWidth;

        setup.classList.add(
            "shake-card"
        );

    }

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value)
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
   END
========================================================= */
