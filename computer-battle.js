/* =========================================================
   STUDYMIND AI — COMPUTER BATTLE
   FULL REPLACEMENT

   FEATURES
   ---------------------------------------------------------
   • AI-generated questions only
   • Nigerian Senior Secondary School curriculum
   • Subject + topic specific
   • 10 questions per battle
   • 15 seconds per question
   • Random questions
   • Random answer order
   • Computer opponent
   • Battle scoring
   • Battle Points
   • Supabase leaderboard
   • 5 free battles
   • Free battle counted ONLY after completion
   • Counter survives page refresh
   • No hard-coded question bank
========================================================= */


/* =========================================================
   CONFIGURATION
========================================================= */

const QUESTIONS_PER_BATTLE = 10;
const QUESTION_TIME_LIMIT = 15;

const FREE_BATTLE_LIMIT = 5;

/*
   IMPORTANT:
   This is the single localStorage key used by Computer Battle
   for the free-battle counter.
*/
const FREE_BATTLES_USED_KEY = "studyMindFreeBattlesUsed";

/*
   Used to prevent the same completed battle from being counted
   twice if finishBattle() is accidentally called more than once.
*/
const CURRENT_BATTLE_CONSUMED_KEY =
    "studyMindCurrentBattleConsumed";


/* =========================================================
   STATE
========================================================= */

let battleState = {
    subject: "",
    topic: "",
    difficulty: "mixed",

    questions: [],
    currentQuestionIndex: 0,

    playerScore: 0,
    computerScore: 0,

    timeRemaining: QUESTION_TIME_LIMIT,
    timerInterval: null,

    battleStarted: false,
    battleFinished: false,
    battleConsumed: false,

    battleNonce: ""
};


/* =========================================================
   CURRICULUM TOPICS
   ---------------------------------------------------------
   These are topic references, NOT hard-coded questions.
   The AI generates the actual questions.
========================================================= */

const CURRICULUM = {

    Mathematics: [
        "Number Bases",
        "Indices",
        "Logarithms",
        "Surds",
        "Sets",
        "Algebraic Expressions",
        "Linear Equations",
        "Quadratic Equations",
        "Simultaneous Equations",
        "Inequalities",
        "Sequences and Series",
        "Arithmetic Progression",
        "Geometric Progression",
        "Variation",
        "Functions",
        "Matrices",
        "Coordinate Geometry",
        "Straight Lines",
        "Trigonometry",
        "Mensuration",
        "Plane Geometry",
        "Circle Geometry",
        "Vectors",
        "Probability",
        "Statistics",
        "Permutations and Combinations",
        "Differentiation",
        "Integration"
    ],

    English: [
        "Parts of Speech",
        "Sentence Structure",
        "Concord",
        "Tenses",
        "Clauses",
        "Phrases",
        "Active and Passive Voice",
        "Direct and Indirect Speech",
        "Question Tags",
        "Punctuation",
        "Vocabulary Development",
        "Synonyms",
        "Antonyms",
        "Idioms",
        "Comprehension",
        "Summary Writing",
        "Lexis and Structure",
        "Oral English",
        "Phonetics",
        "Essay Writing",
        "Formal Letter",
        "Informal Letter",
        "Article Writing",
        "Report Writing",
        "Debate"
    ],

    Physics: [
        "Measurements",
        "Units and Dimensions",
        "Scalars and Vectors",
        "Motion",
        "Speed and Velocity",
        "Acceleration",
        "Newton's Laws of Motion",
        "Work Energy and Power",
        "Momentum",
        "Simple Machines",
        "Circular Motion",
        "Gravitational Field",
        "Heat",
        "Temperature",
        "Thermal Expansion",
        "Waves",
        "Sound",
        "Light",
        "Reflection",
        "Refraction",
        "Electricity",
        "Current Electricity",
        "Electrostatics",
        "Magnetism",
        "Electromagnetic Induction",
        "Atomic Physics",
        "Radioactivity",
        "Semiconductors"
    ],

    Chemistry: [
        "Matter",
        "Atomic Structure",
        "Periodic Table",
        "Chemical Bonding",
        "Mole Concept",
        "Stoichiometry",
        "Chemical Formulae",
        "Gas Laws",
        "Acids Bases and Salts",
        "pH",
        "Redox Reactions",
        "Electrolysis",
        "Rates of Reaction",
        "Chemical Equilibrium",
        "Energy Changes",
        "Organic Chemistry",
        "Hydrocarbons",
        "Alkanes",
        "Alkenes",
        "Alkynes",
        "Alcohols",
        "Carboxylic Acids",
        "Esters",
        "Polymers",
        "Petroleum",
        "Environmental Chemistry"
    ],

    Biology: [
        "Characteristics of Living Things",
        "Cell Structure",
        "Cell Division",
        "Biological Molecules",
        "Nutrition",
        "Photosynthesis",
        "Respiration",
        "Transport in Plants",
        "Transport in Animals",
        "Excretion",
        "Homeostasis",
        "Coordination",
        "Reproduction",
        "Growth",
        "Genetics",
        "Evolution",
        "Ecology",
        "Food Chains",
        "Population Studies",
        "Adaptation",
        "Classification",
        "Microorganisms",
        "Disease",
        "Human Health",
        "Plant Hormones",
        "Animal Hormones"
    ],

    Economics: [
        "Basic Economic Concepts",
        "Scarcity",
        "Opportunity Cost",
        "Production",
        "Factors of Production",
        "Division of Labour",
        "Demand",
        "Supply",
        "Price Determination",
        "Elasticity",
        "Market Structures",
        "National Income",
        "Money",
        "Banking",
        "Inflation",
        "Unemployment",
        "Public Finance",
        "Taxation",
        "International Trade",
        "Balance of Payments",
        "Economic Development",
        "Population",
        "Agriculture",
        "Industrialization",
        "Transportation"
    ],

    Government: [
        "Meaning of Government",
        "Political Socialization",
        "Political Participation",
        "Constitution",
        "Rule of Law",
        "Separation of Powers",
        "Checks and Balances",
        "Fundamental Human Rights",
        "Democracy",
        "Political Parties",
        "Pressure Groups",
        "Electoral Systems",
        "Electoral Commission",
        "Public Opinion",
        "Citizenship",
        "Local Government",
        "Federalism",
        "Unitary Government",
        "Confederation",
        "Military Rule",
        "Colonial Administration",
        "Nigerian Political Development",
        "Foreign Policy",
        "International Organizations"
    ],

    Geography: [
        "The Earth",
        "Latitude and Longitude",
        "Map Reading",
        "Scale",
        "Relief",
        "Weather",
        "Climate",
        "Atmosphere",
        "Rocks",
        "Weathering",
        "Erosion",
        "Transportation and Deposition",
        "Rivers",
        "Drainage",
        "Vegetation",
        "Soils",
        "Population",
        "Settlement",
        "Urbanization",
        "Agriculture",
        "Mining",
        "Industry",
        "Transportation",
        "Environmental Resources",
        "Environmental Problems"
    ],

    AgriculturalScience: [
        "Agriculture",
        "Farm Tools",
        "Farm Machinery",
        "Soil",
        "Soil Formation",
        "Soil Fertility",
        "Crop Production",
        "Crop Improvement",
        "Planting",
        "Crop Pests",
        "Crop Diseases",
        "Animal Husbandry",
        "Livestock Nutrition",
        "Animal Diseases",
        "Fisheries",
        "Forestry",
        "Farm Management",
        "Agricultural Economics",
        "Agricultural Marketing",
        "Agricultural Extension"
    ],

    ComputerScience: [
        "Introduction to Computers",
        "Computer Hardware",
        "Computer Software",
        "Operating Systems",
        "Data Representation",
        "Number Systems",
        "Algorithms",
        "Flowcharts",
        "Programming",
        "Variables",
        "Data Types",
        "Control Structures",
        "Arrays",
        "Databases",
        "Computer Networks",
        "Internet",
        "Cybersecurity",
        "Information Systems",
        "Artificial Intelligence",
        "Computer Ethics"
    ],

    Accounting: [
        "Introduction to Accounting",
        "Accounting Concepts",
        "Double Entry",
        "Source Documents",
        "Books of Original Entry",
        "Ledger Accounts",
        "Trial Balance",
        "Cash Book",
        "Bank Reconciliation",
        "Depreciation",
        "Control Accounts",
        "Final Accounts",
        "Manufacturing Accounts",
        "Partnership Accounts",
        "Company Accounts",
        "Incomplete Records",
        "Ratio Analysis",
        "Accounting Ethics"
    ],

    Commerce: [
        "Introduction to Commerce",
        "Trade",
        "Home Trade",
        "Foreign Trade",
        "Retail Trade",
        "Wholesale Trade",
        "Channels of Distribution",
        "Business Ownership",
        "Partnership",
        "Companies",
        "Cooperative Societies",
        "Banking",
        "Insurance",
        "Transportation",
        "Communication",
        "Warehousing",
        "Advertising",
        "Consumer Protection",
        "Business Finance"
    ],

    Literature: [
        "Prose",
        "Poetry",
        "Drama",
        "Literary Devices",
        "Figures of Speech",
        "Characterization",
        "Plot",
        "Setting",
        "Theme",
        "Point of View",
        "Narrative Techniques",
        "Conflict",
        "Tone",
        "Mood",
        "Irony",
        "Symbolism",
        "African Literature",
        "Non-African Literature"
    ],

    CivicEducation: [
        "Citizenship",
        "National Values",
        "Human Rights",
        "Democracy",
        "Rule of Law",
        "Constitution",
        "Political Participation",
        "Responsible Citizenship",
        "National Integration",
        "Social Justice",
        "Drug Abuse",
        "Cultism",
        "Human Trafficking",
        "Corruption",
        "Peace Building",
        "Conflict Resolution",
        "Security",
        "The Nigerian Constitution"
    ]
};


/* =========================================================
   SUBJECT ALIASES
========================================================= */

const SUBJECT_ALIASES = {
    Math: "Mathematics",
    Maths: "Mathematics",

    EnglishLanguage: "English",
    "English Language": "English",

    AgriculturalScience: "AgriculturalScience",
    "Agricultural Science": "AgriculturalScience",

    Computer: "ComputerScience",
    "Computer Science": "ComputerScience",

    "Civic Education": "CivicEducation"
};


/* =========================================================
   DOM HELPER
========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   SUPABASE
========================================================= */

function getSupabaseClient() {

    if (
        window.supabaseClient &&
        window.supabaseClient.auth
    ) {
        return window.supabaseClient;
    }

    return null;
}


/* =========================================================
   WAIT FOR SUPABASE
========================================================= */

async function waitForSupabaseClient(timeout = 10000) {

    const started = Date.now();

    while (Date.now() - started < timeout) {

        const client = getSupabaseClient();

        if (client) {
            return client;
        }

        await new Promise(resolve =>
            setTimeout(resolve, 100)
        );
    }

    return null;
}


/* =========================================================
   AUTHENTICATION
========================================================= */

async function verifyComputerBattleUser() {

    const client =
        await waitForSupabaseClient();

    if (!client) {

        console.warn(
            "StudyMind: Supabase client not available."
        );

        return null;
    }

    try {

        const {
            data,
            error
        } = await client.auth.getUser();

        if (error) {
            console.error(
                "Supabase authentication error:",
                error
            );

            return null;
        }

        return data?.user || null;

    } catch (error) {

        console.error(
            "Authentication check failed:",
            error
        );

        return null;
    }
}


/* =========================================================
   FREE BATTLE COUNTER
========================================================= */

function getFreeBattlesUsed() {

    const raw =
        localStorage.getItem(
            FREE_BATTLES_USED_KEY
        );

    const parsed = Number(raw);

    if (
        !Number.isFinite(parsed) ||
        parsed < 0
    ) {
        return 0;
    }

    return Math.min(
        Math.floor(parsed),
        FREE_BATTLE_LIMIT
    );
}


/* =========================================================
   GET REMAINING FREE BATTLES
========================================================= */

function getFreeBattlesRemaining() {

    return Math.max(
        FREE_BATTLE_LIMIT -
        getFreeBattlesUsed(),
        0
    );
}


/* =========================================================
   CAN PLAY FREE BATTLE
========================================================= */

function canPlayFreeBattle() {

    return (
        getFreeBattlesUsed() <
        FREE_BATTLE_LIMIT
    );
}


/* =========================================================
   SAVE FREE BATTLE COUNT
========================================================= */

function saveFreeBattlesUsed(value) {

    const safeValue =
        Math.min(
            Math.max(
                Math.floor(Number(value) || 0),
                0
            ),
            FREE_BATTLE_LIMIT
        );

    localStorage.setItem(
        FREE_BATTLES_USED_KEY,
        String(safeValue)
    );

    return safeValue;
}


/* =========================================================
   UPDATE FREE BATTLE DISPLAY
========================================================= */

function updateFreeBattleDisplay() {

    const used =
        getFreeBattlesUsed();

    const remaining =
        getFreeBattlesRemaining();

    /*
       Update any counter elements that may exist
       on the page.
    */

    const usedElements = [
        $("freeBattlesUsed"),
        $("battleUsedCount"),
        $("freeBattleUsed"),
        $("battlesUsed")
    ];

    usedElements.forEach(element => {

        if (element) {
            element.textContent =
                `${used} / ${FREE_BATTLE_LIMIT}`;
        }

    });


    const remainingElements = [
        $("freeBattlesRemaining"),
        $("remainingBattles"),
        $("battleRemaining"),
        $("freeBattleCount")
    ];

    remainingElements.forEach(element => {

        if (element) {

            element.textContent =
                `${remaining} free ${
                    remaining === 1
                        ? "battle"
                        : "battles"
                } remaining`;
        }

    });


    /*
       Also update common text containers if they exist.
    */

    const textElements = [
        $("freeBattleStatus"),
        $("battleLimitText"),
        $("battleUsageText")
    ];

    textElements.forEach(element => {

        if (!element) return;

        element.textContent =
            `${used} / ${FREE_BATTLE_LIMIT} battles used`;

    });


    /*
       Update the browser title/debug information.
    */

    window.studyMindFreeBattles = {
        used,
        remaining,
        limit: FREE_BATTLE_LIMIT
    };
}


/* =========================================================
   CONSUME ONE FREE BATTLE
   ---------------------------------------------------------
   THIS IS THE IMPORTANT FIX.

   A battle is counted only when:
   • all 10 questions are finished
   • results are displayed
   • this function has not already counted the battle
========================================================= */

function consumeFreeBattle() {

    /*
       Never count the same battle twice.
    */

    if (battleState.battleConsumed) {
        return false;
    }

    /*
       Extra protection using the current battle marker.
    */

    const storedConsumed =
        sessionStorage.getItem(
            CURRENT_BATTLE_CONSUMED_KEY
        );

    if (
        storedConsumed ===
        battleState.battleNonce
    ) {

        battleState.battleConsumed = true;

        return false;
    }


    const currentUsed =
        getFreeBattlesUsed();


    /*
       Do not consume beyond the free limit.
    */

    if (
        currentUsed >=
        FREE_BATTLE_LIMIT
    ) {

        battleState.battleConsumed = true;

        return false;
    }


    /*
       Increment the counter exactly once.
    */

    const newUsed =
        currentUsed + 1;

    saveFreeBattlesUsed(
        newUsed
    );


    /*
       Mark this battle as consumed.
    */

    battleState.battleConsumed = true;

    sessionStorage.setItem(
        CURRENT_BATTLE_CONSUMED_KEY,
        battleState.battleNonce
    );


    /*
       Update the current page immediately.
    */

    updateFreeBattleDisplay();


    /*
       Notify other StudyMind code that the
       battle counter changed.
    */

    window.dispatchEvent(
        new CustomEvent(
            "studyMindFreeBattleUsed",
            {
                detail: {
                    used: newUsed,
                    remaining:
                        FREE_BATTLE_LIMIT -
                        newUsed
                }
            }
        )
    );


    /*
       Storage event does not fire in the same tab,
       so manually dispatch a second event that
       game-mode.js can listen for.
    */

    window.dispatchEvent(
        new Event(
            "studyMindBattleCounterUpdated"
        )
    );


    console.log(
        `StudyMind: Free battle consumed. ` +
        `${newUsed}/${FREE_BATTLE_LIMIT} used. ` +
        `${FREE_BATTLE_LIMIT - newUsed} remaining.`
    );

    return true;
}


/* =========================================================
   INITIALIZE BATTLE NONCE
========================================================= */

function createBattleNonce() {

    return [
        Date.now().toString(36),
        Math.random()
            .toString(36)
            .slice(2),
        Math.random()
            .toString(36)
            .slice(2)
    ].join("-");
}


/* =========================================================
   NORMALIZE SUBJECT
========================================================= */

function normalizeSubject(subject) {

    const clean =
        String(subject || "").trim();

    return (
        SUBJECT_ALIASES[clean] ||
        clean
    );
}


/* =========================================================
   GET CURRICULUM TOPICS
========================================================= */

function getTopicsForSubject(subject) {

    const normalized =
        normalizeSubject(subject);

    return (
        CURRICULUM[normalized] ||
        []
    );
}


/* =========================================================
   POPULATE SUBJECT DROPDOWN
========================================================= */

function populateSubjects() {

    const select =
        $("subjectSelect");

    if (!select) {
        console.error(
            "StudyMind: subjectSelect not found."
        );
        return;
    }

    select.innerHTML = "";

    const placeholder =
        document.createElement("option");

    placeholder.value = "";
    placeholder.textContent =
        "Select a subject";

    placeholder.disabled = true;
    placeholder.selected = true;

    select.appendChild(
        placeholder
    );


    const subjects =
        Object.keys(CURRICULUM)
            .sort((a, b) =>
                a.localeCompare(b)
            );


    subjects.forEach(subject => {

        const option =
            document.createElement("option");

        option.value = subject;

        option.textContent =
            subject
                .replace(
                    "AgriculturalScience",
                    "Agricultural Science"
                )
                .replace(
                    "ComputerScience",
                    "Computer Science"
                )
                .replace(
                    "CivicEducation",
                    "Civic Education"
                );

        select.appendChild(option);

    });


    select.addEventListener(
        "change",
        handleSubjectChange
    );
}


/* =========================================================
   HANDLE SUBJECT CHANGE
========================================================= */

function handleSubjectChange() {

    const subject =
        $("subjectSelect")?.value || "";

    populateTopics(subject);
}


/* =========================================================
   POPULATE TOPICS
========================================================= */

function populateTopics(subject) {

    const select =
        $("topicSelect");

    if (!select) {
        console.error(
            "StudyMind: topicSelect not found."
        );
        return;
    }

    select.innerHTML = "";

    const placeholder =
        document.createElement("option");

    placeholder.value = "";
    placeholder.textContent =
        subject
            ? "Select a topic"
            : "Select a subject first";

    placeholder.disabled = true;
    placeholder.selected = true;

    select.appendChild(
        placeholder );


    const topics =
        getTopicsForSubject(subject);


    topics.forEach(topic => {

        const option =
            document.createElement("option");

        option.value = topic;
        option.textContent = topic;

        select.appendChild(option);

    });


    /*
       If the selected subject has no topic
       reference, still allow the user to see
       the issue instead of silently using Math.
    */

    if (!topics.length && subject) {

        const option =
            document.createElement("option");

        option.value = "";
        option.textContent =
            "No topics available";

        option.disabled = true;

        select.appendChild(option);
    }
}


/* =========================================================
   SHUFFLE ARRAY
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
   GENERATE AI QUESTIONS
========================================================= */

async function generateAIQuestions(
    subject,
    topic,
    difficulty = "mixed"
) {

    const normalizedSubject =
        normalizeSubject(subject);

    const curriculumTopics =
        getTopicsForSubject(
            normalizedSubject
        );


    if (!normalizedSubject) {
        throw new Error(
            "A subject is required."
        );
    }


    if (!topic) {
        throw new Error(
            "A topic is required."
        );
    }


    /*
       Do not allow the AI to silently switch
       subjects or topics.
    */

    const battleNonce =
        battleState.battleNonce ||
        createBattleNonce();


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

                    requestType:
                        "computer_battle",

                    mode:
                        "computer_battle",

                    type:
                        "game_questions",

                    subject:
                        normalizedSubject,

                    topic:
                        topic,

                    curriculum:
                        "Nigerian Senior Secondary School curriculum",

                    curriculumTopics:
                        curriculumTopics,

                    numberOfQuestions:
                        QUESTIONS_PER_BATTLE,

                    questionCount:
                        QUESTIONS_PER_BATTLE,

                    difficulty:
                        difficulty,

                    questionType:
                        "multiple_choice",

                    optionsPerQuestion:
                        4,

                    randomized:
                        true,

                    uniqueQuestions:
                        true,

                    battleNonce:
                        battleNonce,

                    instructions: `
Generate a completely new set of
${QUESTIONS_PER_BATTLE} multiple-choice questions.

The selected subject is:
${normalizedSubject}

The selected topic is:
${topic}

Follow the Nigerian Senior Secondary
School curriculum.

IMPORTANT:

1. Every question MUST be about the selected subject.
2. Every question MUST be about the selected topic.
3. Do NOT substitute Mathematics or another subject.
4. Do NOT change the topic.
5. Do NOT reuse a fixed question bank.
6. Generate a fresh randomized set for this battle.
7. Produce exactly ${QUESTIONS_PER_BATTLE} questions.
8. Each question must have exactly four options.
9. There must be exactly one correct answer.
10. The answer must be represented by a zero-based index.
11. Questions should be suitable for secondary-school students.
12. Questions should vary in difficulty.
13. Avoid duplicate questions.
14. Return JSON only.
`
                })
            }
        );


    let responseData = null;


    try {

        responseData =
            await response.json();

    } catch (error) {

        throw new Error(
            `The AI server returned an invalid response (${response.status}).`
        );
    }


    if (!response.ok) {

        let message =
            responseData?.error ||
            responseData?.details ||
            `AI server returned HTTP ${response.status}.`;

        if (
            typeof message === "object"
        ) {
            message =
                message.message ||
                JSON.stringify(message);
        }

        throw new Error(
            String(message)
        );
    }


    let questions =
        extractQuestions(
            responseData
        );


    if (
        !Array.isArray(questions)
    ) {

        throw new Error(
            "The AI server did not return a valid question list."
        );
    }


    /*
       Normalize and validate every question.
    */

    questions =
        questions
            .map(
                normalizeQuestion
            )
            .filter(Boolean);


    /*
       Remove duplicate question text.
    */

    const unique =
        [];

    const seen =
        new Set();


    questions.forEach(question => {

        const key =
            question.question
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

        if (!seen.has(key)) {

            seen.add(key);

            unique.push(
                question
            );
        }
    });


    questions =
        unique;


    /*
       We deliberately DO NOT use hard-coded
       fallback questions here.
    */

    if (
        questions.length <
        QUESTIONS_PER_BATTLE
    ) {

        throw new Error(
            `AI generated only ${questions.length} valid questions out of ${QUESTIONS_PER_BATTLE}. Please try starting the battle again.`
        );
    }


    /*
       Randomize question order.
    */

    questions =
        shuffleArray(
            questions
        )
            .slice(
                0,
                QUESTIONS_PER_BATTLE
            );


    /*
       Randomize answer order while preserving
       the correct answer.
    */

    questions =
        questions.map(
            randomizeQuestionOptions
        );


    return questions;
}


/* =========================================================
   EXTRACT QUESTIONS FROM API RESPONSE
========================================================= */

function extractQuestions(data) {

    if (
        Array.isArray(data)
    ) {
        return data;
    }


    if (
        Array.isArray(data?.questions)
    ) {
        return data.questions;
    }


    if (
        Array.isArray(data?.data)
    ) {
        return data.data;
    }


    if (
        Array.isArray(data?.results)
    ) {
        return data.results;
    }


    if (
        Array.isArray(data?.items)
    ) {
        return data.items;
    }


    /*
       Sometimes the API may return JSON
       inside a text property.
    */

    const possibleText =
        data?.output ||
        data?.text ||
        data?.content ||
        data?.response;


    if (
        typeof possibleText ===
        "string"
    ) {

        const parsed =
            parseJSONSafely(
                possibleText
            );

        if (parsed) {

            return extractQuestions(
                parsed
            );
        }
    }


    return null;
}


/* =========================================================
   SAFE JSON PARSER
========================================================= */

function parseJSONSafely(text) {

    if (
        typeof text !==
        "string"
    ) {
        return null;
    }


    const trimmed =
        text.trim();


    try {

        return JSON.parse(
            trimmed
        );

    } catch (_) {
        /* continue */
    }


    const firstBrace =
        trimmed.indexOf("{");

    const lastBrace =
        trimmed.lastIndexOf("}");


    if (
        firstBrace !== -1 &&
        lastBrace > firstBrace
    ) {

        try {

            return JSON.parse(
                trimmed.slice(
                    firstBrace,
                    lastBrace + 1
                )
            );

        } catch (_) {
            /* continue */
        }
    }


    const firstBracket =
        trimmed.indexOf("[");

    const lastBracket =
        trimmed.lastIndexOf("]");


    if (
        firstBracket !== -1 &&
        lastBracket > firstBracket
    ) {

        try {

            return JSON.parse(
                trimmed.slice(
                    firstBracket,
                    lastBracket + 1
                )
            );

        } catch (_) {
            /* continue */
        }
    }


    return null;
}


/* =========================================================
   NORMALIZE QUESTION
========================================================= */

function normalizeQuestion(raw) {

    if (
        !raw ||
        typeof raw !== "object"
    ) {
        return null;
    }


    const questionText =
        String(
            raw.question ||
            raw.questionText ||
            raw.text ||
            ""
        ).trim();


    if (!questionText) {
        return null;
    }


    let options =
        raw.options ||
        raw.choices ||
        raw.answers;


    if (
        !Array.isArray(options)
    ) {
        return null;
    }


    options =
        options.map(
            option => {

                if (
                    typeof option ===
                    "string"
                ) {
                    return option.trim();
                }

                if (
                    option &&
                    typeof option ===
                    "object"
                ) {

                    return String(
                        option.text ||
                        option.label ||
                        ""
                    ).trim();
                }

                return "";
            }
        );


    if (
        options.length !== 4
    ) {
        return null;
    }


    if (
        options.some(
            option =>
                !option
        )
    ) {
        return null;
    }


    let answer =
        raw.answer;


    if (
        answer === undefined
    ) {
        answer =
            raw.correctAnswer;
    }


    if (
        answer === undefined
    ) {
        answer =
            raw.correctIndex;
    }


    /*
       Support "A", "B", "C", "D" too,
       although our API is instructed to
       return zero-based indexes.
    */

    if (
        typeof answer ===
        "string"
    ) {

        const clean =
            answer
                .trim()
                .toUpperCase();


        if (
            /^[ABCD]$/.test(clean)
        ) {

            answer =
                "ABCD".indexOf(
                    clean
                );

        } else if (
            /^\d+$/.test(clean)
        ) {

            answer =
                Number(clean);
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


    /*
       Make sure the four options themselves
       are not duplicates.
    */

    const optionSet =
        new Set(
            options.map(
                option =>
                    option
                        .toLowerCase()
                        .trim()
            )
        );


    if (
        optionSet.size !== 4
    ) {
        return null;
    }


    return {

        question:
            questionText,

        options:
            options,

        answer:
            answer,

        explanation:
            typeof raw.explanation ===
            "string"
                ? raw.explanation.trim()
                : ""
    };
}


/* =========================================================
   RANDOMIZE ANSWER OPTIONS
========================================================= */

function randomizeQuestionOptions(
    question
) {

    const originalOptions =
        question.options;

    const correctOption =
        originalOptions[
            question.answer
        ];


    const shuffled =
        shuffleArray(
            originalOptions
        );


    const newAnswer =
        shuffled.indexOf(
            correctOption
        );


    return {

        ...question,

        options:
            shuffled,

        answer:
            newAnswer
    };
}


/* =========================================================
   SHOW ERROR
========================================================= */

function showBattleError(message) {

    const errorElement =
        $("battleError");

    if (!errorElement) {
        console.error(
            message
        );
        return;
    }


    errorElement.textContent =
        String(message);


    errorElement.style.display =
        "block";
}


/* =========================================================
   CLEAR ERROR
========================================================= */

function clearBattleError() {

    const errorElement =
        $("battleError");

    if (!errorElement) {
        return;
    }


    errorElement.textContent =
        "";

    errorElement.style.display =
        "none";
}


/* =========================================================
   SHOW LOADING
========================================================= */

function showBattleLoading(
    visible
) {

    const loading =
        $("battleLoading");

    if (!loading) {
        return;
    }


    loading.style.display =
        visible
            ? "flex"
            : "none";
}


/* =========================================================
   SHOW SETUP
========================================================= */

function showSetup() {

    const setup =
        $("battleSetup");

    const screen =
        $("battleScreen");

    const results =
        $("battleResults");


    if (setup) {
        setup.style.display =
            "block";
    }

    if (screen) {
        screen.style.display =
            "none";
    }

    if (results) {
        results.style.display =
            "none";
    }
}


/* =========================================================
   SHOW BATTLE SCREEN
========================================================= */

function showBattleScreen() {

    const setup =
        $("battleSetup");

    const screen =
        $("battleScreen");

    const results =
        $("battleResults");


    if (setup) {
        setup.style.display =
            "none";
    }

    if (screen) {
        screen.style.display =
            "block";
    }

    if (results) {
        results.style.display =
            "none";
    }
}


/* =========================================================
   SHOW RESULTS
========================================================= */

function showBattleResults() {

    const setup =
        $("battleSetup");

    const screen =
        $("battleScreen");

    const results =
        $("battleResults");


    if (setup) {
        setup.style.display =
            "none";
    }

    if (screen) {
        screen.style.display =
            "none";
    }

    if (results) {
        results.style.display =
            "block";
    }
}


/* =========================================================
   UPDATE SCORE DISPLAY
========================================================= */

function updateScoreDisplay() {

    const playerScore =
        $("playerScore");

    const computerScore =
        $("computerScore");


    if (playerScore) {
        playerScore.textContent =
            String(
                battleState.playerScore
            );
    }


    if (computerScore) {
        computerScore.textContent =
            String(
                battleState.computerScore
            );
    }
}


/* =========================================================
   UPDATE ROUND DISPLAY
========================================================= */

function updateRoundDisplay() {

    const round =
        $("roundNumber");

    if (!round) {
        return;
    }


    round.textContent =
        String(
            battleState.currentQuestionIndex + 1
        );
}


/* =========================================================
   UPDATE PROGRESS BAR
========================================================= */

function updateProgress() {

    const progress =
        $("battleProgressBar");

    if (!progress) {
        return;
    }


    const completed =
        battleState.currentQuestionIndex;

    const percentage =
        Math.min(
            Math.max(
                (
                    completed /
                    QUESTIONS_PER_BATTLE
                ) * 100,
                0
            ),
            100
        );


    if (
        progress.style &&
        progress.style.width !== undefined
    ) {

        progress.style.width =
            `${percentage}%`;
    }


    if (
        progress.setAttribute
    ) {

        progress.setAttribute(
            "aria-valuenow",
            String(
                Math.round(
                    percentage
                )
            )
        );
    }
}


/* =========================================================
   UPDATE TIMER DISPLAY
========================================================= */

function updateTimerDisplay() {

    const timer =
        $("timerNumber");

    if (!timer) {
        return;
    }


    timer.textContent =
        String(
            Math.max(
                battleState.timeRemaining,
                0
            )
        );


    if (
        battleState.timeRemaining <= 5
    ) {

        timer.classList.add(
            "timer-warning"
        );

    } else {

        timer.classList.remove(
            "timer-warning"
        );
    }
}


/* =========================================================
   STOP TIMER
========================================================= */

function stopQuestionTimer() {

    if (
        battleState.timerInterval
    ) {

        clearInterval(
            battleState.timerInterval
        );

        battleState.timerInterval =
            null;
    }
}


/* =========================================================
   START QUESTION TIMER
========================================================= */

function startQuestionTimer() {

    stopQuestionTimer();


    battleState.timeRemaining =
        QUESTION_TIME_LIMIT;


    updateTimerDisplay();


    battleState.timerInterval =
        setInterval(
            () => {

                battleState.timeRemaining--;

                updateTimerDisplay();


                if (
                    battleState.timeRemaining <= 0
                ) {

                    stopQuestionTimer();

                    handlePlayerTimeout();
                }

            },
            1000
        );
}


/* =========================================================
   HANDLE TIMEOUT
========================================================= */

function handlePlayerTimeout() {

    if (
        battleState.battleFinished
    ) {
        return;
    }


    /*
       Timeout means the computer wins
       the current question.
    */

    battleState.computerScore++;

    updateScoreDisplay();

    showFeedback(
        "Time's up! The computer gets the point.",
        false
    );


    disableAnswerButtons();


    setTimeout(
        moveToNextQuestion,
        900
    );
}


/* =========================================================
   DISPLAY CURRENT QUESTION
========================================================= */

function displayCurrentQuestion() {

    const question =
        battleState.questions[
            battleState.currentQuestionIndex
        ];


    if (!question) {

        finishBattle();

        return;
    }


    const questionTopic =
        $("questionTopic");

    const questionText =
        $("questionText");

    const answerGrid =
        $("answerGrid");


    if (
        questionTopic
    ) {

        questionTopic.textContent =
            battleState.topic;
    }


    if (
        questionText
    ) {

        questionText.textContent =
            question.question;
    }


    if (!answerGrid) {

        console.error(
            "StudyMind: answerGrid not found."
        );

        return;
    }


    answerGrid.innerHTML =
        "";


    question.options.forEach(
        (option, index) => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";

            button.className =
                "battle-answer";

            button.textContent =
                option;


            button.dataset.index =
                String(index);


            button.addEventListener(
                "click",
                () =>
                    handlePlayerAnswer(
                        index
                    )
            );


            answerGrid.appendChild(
                button
            );
        }
    );


    clearFeedback();

    updateRoundDisplay();
    updateProgress();
    updateScoreDisplay();
    startQuestionTimer();
}


/* =========================================================
   DISABLE ANSWER BUTTONS
========================================================= */

function disableAnswerButtons() {

    const grid =
        $("answerGrid");

    if (!grid) {
        return;
    }


    grid.querySelectorAll(
        "button"
    ).forEach(
        button => {
            button.disabled =
                true;
        }
    );
}


/* =========================================================
   HANDLE PLAYER ANSWER
========================================================= */

function handlePlayerAnswer(
    selectedIndex
) {

    if (
        battleState.battleFinished
    ) {
        return;
    }


    stopQuestionTimer();


    const question =
        battleState.questions[
            battleState.currentQuestionIndex
        ];


    if (!question) {
        return;
    }


    disableAnswerButtons();


    const correct =
        Number(selectedIndex) ===
        Number(question.answer);


    if (correct) {

        battleState.playerScore++;

        showFeedback(
            "Correct! You earn the point.",
            true
        );

    } else {

        battleState.computerScore++;

        showFeedback(
            "Incorrect. The computer gets the point.",
            false
        );
    }


    updateScoreDisplay();


    highlightAnswers(
        question,
        selectedIndex
    );


    setTimeout(
        moveToNextQuestion,
        900
    );
}


/* =========================================================
   HIGHLIGHT ANSWERS
========================================================= */

function highlightAnswers(
    question,
    selectedIndex
) {

    const grid =
        $("answerGrid");

    if (!grid) {
        return;
    }


    const buttons =
        grid.querySelectorAll(
            "button"
        );


    buttons.forEach(
        (button, index) => {

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
                Number(selectedIndex) &&
                index !==
                question.answer
            ) {

                button.classList.add(
                    "incorrect"
                );
            }

        }
    );
}


/* =========================================================
   SHOW FEEDBACK
========================================================= */

function showFeedback(
    message,
    correct
) {

    const feedback =
        $("battleFeedback");

    if (!feedback) {
        return;
    }


    feedback.textContent =
        message;


    feedback.classList.remove(
        "correct",
        "incorrect"
    );


    feedback.classList.add(
        correct
            ? "correct"
            : "incorrect"
    );


    feedback.style.display =
        "block";
}


/* =========================================================
   CLEAR FEEDBACK
========================================================= */

function clearFeedback() {

    const feedback =
        $("battleFeedback");

    if (!feedback) {
        return;
    }


    feedback.textContent =
        "";

    feedback.style.display =
        "none";


    feedback.classList.remove(
        "correct",
        "incorrect"
    );
}


/* =========================================================
   MOVE TO NEXT QUESTION
========================================================= */

function moveToNextQuestion() {

    if (
        battleState.battleFinished
    ) {
        return;
    }


    battleState.currentQuestionIndex++;


    if (
        battleState.currentQuestionIndex >=
        QUESTIONS_PER_BATTLE
    ) {

        finishBattle();

        return;
    }


    displayCurrentQuestion();
}


/* =========================================================
   FINISH BATTLE
   ---------------------------------------------------------
   THIS IS WHERE THE FREE BATTLE IS CONSUMED.
========================================================= */

async function finishBattle() {

    if (
        battleState.battleFinished
    ) {
        return;
    }


    battleState.battleFinished =
        true;


    stopQuestionTimer();


    /*
       Make sure all ten questions were completed
       before consuming the free battle.
    */

    const completedAllQuestions =
        battleState.currentQuestionIndex >=
        QUESTIONS_PER_BATTLE;


    if (
        completedAllQuestions
    ) {

        consumeFreeBattle();

    } else {

        console.warn(
            "StudyMind: Battle ended before all questions were completed. Free battle was not consumed."
        );
    }


    /*
       Show final progress.
    */

    const progress =
        $("battleProgressBar");

    if (progress) {
        progress.style.width =
            "100%";
    }


    /*
       Update final scores.
    */

    updateFinalScoreDisplay();


    /*
       Calculate Battle Points.
    */

    const points =
        calculateBattlePoints();


    const pointsElement =
        $("battlePointsEarned");

    if (pointsElement) {

        pointsElement.textContent =
            String(points);
    }


    /*
       Determine result.
    */

    updateResultDisplay();


    /*
       Show results immediately.
    */

    showBattleResults();


    /*
       Update Supabase leaderboard.
    */

    await updateLeaderboard(
        points
    );


    /*
       Update free battle counter again after
       the result screen is visible.
    */

    updateFreeBattleDisplay();
}


/* =========================================================
   CALCULATE BATTLE POINTS
========================================================= */

function calculateBattlePoints() {

    const player =
        battleState.playerScore;

    const computer =
        battleState.computerScore;


    if (player > computer) {

        return 100 +
            (player * 10);

    }


    if (player === computer) {

        return 50;
    }


    return Math.max(
        player * 5,
        0
    );
}


/* =========================================================
   UPDATE FINAL SCORE DISPLAY
========================================================= */

function updateFinalScoreDisplay() {

    const player =
        $("finalPlayerScore");

    const computer =
        $("finalComputerScore");


    if (player) {

        player.textContent =
            String(
                battleState.playerScore
            );
    }


    if (computer) {

        computer.textContent =
            String(
                battleState.computerScore
            );
    }
}


/* =========================================================
   UPDATE RESULT DISPLAY
========================================================= */

function updateResultDisplay() {

    const player =
        battleState.playerScore;

    const computer =
        battleState.computerScore;


    const icon =
        $("resultIcon");

    const title =
        $("resultTitle");

    const summary =
        $("resultSummary");

    const message =
        $("battleResultMessage");


    if (
        player >
        computer
    ) {

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
                `You won ${player}–${computer}.`;
        }

        if (message) {
            message.textContent =
                "Excellent work! You defeated the computer.";
        }


    } else if (
        player <
        computer
    ) {

        if (icon) {
            icon.textContent =
                "🎮";
        }

        if (title) {
            title.textContent =
                "Battle Complete";
        }

        if (summary) {
            summary.textContent =
                `The computer won ${computer}–${player}.`;
        }

        if (message) {
            message.textContent =
                "Keep studying and come back for another battle.";
        }


    } else {

        if (icon) {
            icon.textContent =
                "🤝";
        }

        if (title) {
            title.textContent =
                "Draw!";
        }

        if (summary) {
            summary.textContent =
                `You both scored ${player}.`;
        }

        if (message) {
            message.textContent =
                "An evenly matched battle!";
        }
    }
}


/* =========================================================
   UPDATE SUPABASE LEADERBOARD
========================================================= */

async function updateLeaderboard(
    battlePoints
) {

    const client =
        getSupabaseClient();


    if (!client) {

        console.warn(
            "StudyMind: Supabase unavailable. Leaderboard not updated."
        );

        return;
    }


    try {

        const {
            data: userData,
            error: userError
        } = await client.auth.getUser();


        if (
            userError ||
            !userData?.user
        ) {

            console.warn(
                "StudyMind: User not authenticated for leaderboard update."
            );

            return;
        }


        const user =
            userData.user;


        /*
           Read existing leaderboard record.
        */

        const {
            data: existing,
            error: selectError
        } =
            await client
                .from(
                    "game_leaderboard"
                )
                .select(
                    "user_id,display_name,battle_points,wins,losses,draws,battles_played"
                )
                .eq(
                    "user_id",
                    user.id
                )
                .maybeSingle();


        if (selectError) {

            console.error(
                "Leaderboard lookup failed:",
                selectError
            );

            return;
        }


        const player =
            battleState.playerScore;

        const computer =
            battleState.computerScore;


        let wins =
            Number(
                existing?.wins || 0
            );

        let losses =
            Number(
                existing?.losses || 0
            );

        let draws =
            Number(
                existing?.draws || 0
            );

        let battlesPlayed =
            Number(
                existing?.battles_played || 0
            );

        let totalPoints =
            Number(
                existing?.battle_points || 0
            );


        if (
            player >
            computer
        ) {

            wins++;

        } else if (
            player <
            computer
        ) {

            losses++;

        } else {

            draws++;
        }


        battlesPlayed++;

        totalPoints +=
            Number(
                battlePoints || 0
            );


        const displayName =
            existing?.display_name ||
            user.user_metadata?.display_name ||
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "StudyMind Player";


        const {
            error: upsertError
        } =
            await client
                .from(
                    "game_leaderboard"
                )
                .upsert(
                    {
                        user_id:
                            user.id,

                        display_name:
                            displayName,

                        battle_points:
                            totalPoints,

                        wins:
                            wins,

                        losses:
                            losses,

                        draws:
                            draws,

                        battles_played:
                            battlesPlayed,

                        updated_at:
                            new Date().toISOString()
                    },
                    {
                        onConflict:
                            "user_id"
                    }
                );


        if (upsertError) {

            console.error(
                "Leaderboard update failed:",
                upsertError
            );

            return;
        }


        console.log(
            "StudyMind: Leaderboard updated."
        );

    } catch (error) {

        console.error(
            "Leaderboard update error:",
            error
        );
    }
}


/* =========================================================
   START COMPUTER BATTLE
========================================================= */

async function startComputerBattle() {

    clearBattleError();


    /*
       Check free-battle availability BEFORE
       generating AI questions.
    */

    if (
        !canPlayFreeBattle()
    ) {

        showBattleError(
            "You have used all 5 free battles. Upgrade to Premium to continue playing unlimited battles."
        );

        updateFreeBattleDisplay();

        return;
    }


    const subject =
        $("subjectSelect")?.value ||
        "";


    const topic =
        $("topicSelect")?.value ||
        "";


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


    const topics =
        getTopicsForSubject(
            subject
        );


    if (
        !topics.includes(topic)
    ) {

        showBattleError(
            "Please select a valid topic for the selected subject."
        );

        return;
    }


    /*
       Reset battle state.
    */

    battleState = {

        subject:
            normalizeSubject(
                subject
            ),

        topic:
            topic,

        difficulty:
            "mixed",

        questions:
            [],

        currentQuestionIndex:
            0,

        playerScore:
            0,

        computerScore:
            0,

        timeRemaining:
            QUESTION_TIME_LIMIT,

        timerInterval:
            null,

        battleStarted:
            false,

        battleFinished:
            false,

        battleConsumed:
            false,

        battleNonce:
            createBattleNonce()
    };


    /*
       Clear the session marker for this new battle.
    */

    sessionStorage.removeItem(
        CURRENT_BATTLE_CONSUMED_KEY
    );


    showBattleLoading(
        true
    );


    /*
       Prevent repeated clicks while generating.
    */

    const startButton =
        $("startBattleButton");

    if (startButton) {

        startButton.disabled =
            true;
    }


    try {

        console.log(
            "StudyMind: Generating AI battle questions...",
            {
                subject:
                    battleState.subject,

                topic:
                    battleState.topic
            }
        );


        battleState.questions =
            await generateAIQuestions(
                battleState.subject,
                battleState.topic,
                battleState.difficulty
            );


        if (
            battleState.questions.length !==
            QUESTIONS_PER_BATTLE
        ) {

            throw new Error(
                `The AI returned ${battleState.questions.length} questions instead of ${QUESTIONS_PER_BATTLE}.`
            );
        }


        battleState.battleStarted =
            true;


        updateScoreDisplay();

        updateFreeBattleDisplay();

        showBattleScreen();

        displayCurrentQuestion();


        console.log(
            "StudyMind: Computer Battle started.",
            {
                subject:
                    battleState.subject,

                topic:
                    battleState.topic,

                questionCount:
                    battleState.questions.length
            }
        );

    } catch (error) {

        console.error(
            "Computer Battle error:",
            error
        );


        const message =
            error?.message ||
            String(error) ||
            "Unable to start the battle.";


        showBattleError(
            message
        );

        showSetup();

    } finally {

        showBattleLoading(
            false
        );


        if (startButton) {

            startButton.disabled =
                false;
        }
    }
}


/* =========================================================
   PLAY AGAIN
   ---------------------------------------------------------
   A new battle gets a new AI request and a new nonce.
   The previous completed battle has already been consumed.
========================================================= */

function playAgain() {

    stopQuestionTimer();


    battleState = {

        subject: "",
        topic: "",
        difficulty: "mixed",

        questions: [],

        currentQuestionIndex: 0,

        playerScore: 0,
        computerScore: 0,

        timeRemaining:
            QUESTION_TIME_LIMIT,

        timerInterval:
            null,

        battleStarted:
            false,

        battleFinished:
            false,

        battleConsumed:
            false,

        battleNonce:
            ""
    };


    sessionStorage.removeItem(
        CURRENT_BATTLE_CONSUMED_KEY
    );


    clearBattleError();

    showSetup();

    updateFreeBattleDisplay();


    /*
       If the free limit has been reached,
       disable the start button and show the
       Premium message.
    */

    if (
        !canPlayFreeBattle()
    ) {

        const button =
            $("startBattleButton");

        if (button) {
            button.disabled =
                true;
        }


        showBattleError(
            "You have used all 5 free battles. Upgrade to Premium to continue."
        );

        return;
    }


    const button =
        $("startBattleButton");

    if (button) {
        button.disabled =
            false;
    }
}


/* =========================================================
   RETURN TO GAME MODE
========================================================= */

function returnToGameMode() {

    stopQuestionTimer();


    window.location.href =
        "game-mode.html";
}


/* =========================================================
   INITIALIZE PAGE
========================================================= */

async function initializeComputerBattle() {

    console.log(
        "StudyMind: Initializing Computer Battle..."
    );


    /*
       Initialize the free-battle display first.
    */

    updateFreeBattleDisplay();


    /*
       Populate subject/topic dropdowns.
    */

    populateSubjects();

    populateTopics("");


    /*
       Check authentication, but don't let a
       missing Supabase client prevent the
       subject/topic UI from loading.
    */

    const user =
        await verifyComputerBattleUser();


    if (user) {

        console.log(
            "StudyMind Computer Battle user:",
            user.id
        );

    } else {

        console.warn(
            "StudyMind: No authenticated user found."
        );
    }


    /*
       Disable battle button if free limit
       has already been reached.
    */

    if (
        !canPlayFreeBattle()
    ) {

        const button =
            $("startBattleButton");

        if (button) {

            button.disabled =
                true;
        }


        showBattleError(
            "You have used all 5 free battles. Upgrade to Premium to continue."
        );
    }


    console.log(
        "StudyMind: Computer Battle initialized.",
        {
            freeBattlesUsed:
                getFreeBattlesUsed(),

            freeBattlesRemaining:
                getFreeBattlesRemaining()
        }
    );
}


/* =========================================================
   LISTEN FOR COUNTER UPDATES
========================================================= */

window.addEventListener(
    "studyMindBattleCounterUpdated",
    () => {

        updateFreeBattleDisplay();

    }
);


/* =========================================================
   STORAGE EVENT
   ---------------------------------------------------------
   Useful if another StudyMind page changes
   the counter.
========================================================= */

window.addEventListener(
    "storage",
    event => {

        if (
            event.key ===
            FREE_BATTLES_USED_KEY
        ) {

            updateFreeBattleDisplay();
        }
    }
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

window.getFreeBattlesUsed =
    getFreeBattlesUsed;

window.getFreeBattlesRemaining =
    getFreeBattlesRemaining;

window.consumeFreeBattle =
    consumeFreeBattle;

window.updateFreeBattleDisplay =
    updateFreeBattleDisplay;


/* =========================================================
   DEBUG OBJECT
========================================================= */

window.studyMindComputerBattle = {

    state:
        battleState,

    getFreeBattlesUsed,

    getFreeBattlesRemaining,

    canPlayFreeBattle,

    consumeFreeBattle,

    startComputerBattle,

    playAgain,

    curriculum:
        CURRICULUM
};


/* =========================================================
   DOM READY
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeComputerBattle
    );

} else {

    initializeComputerBattle();
}
