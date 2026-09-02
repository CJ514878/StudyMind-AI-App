/* =========================================================
   STUDYMIND AI — COMPUTER BATTLE
   AI-GENERATED CURRICULUM BATTLE
   SHARED FREE-BATTLE COUNTER
========================================================= */

"use strict";


/* =========================================================
   SETTINGS
========================================================= */

const FREE_BATTLE_LIMIT = 5;

const QUESTIONS_PER_BATTLE = 10;

const QUESTION_TIME_LIMIT = 15;


/*
   IMPORTANT:

   This MUST match game-mode.js.

   game-mode.js uses:
   studyMindGameBattleCount
*/
const BATTLE_COUNT_KEY =
    "studyMindGameBattleCount";


/* =========================================================
   STATE
========================================================= */

let computerBattleState = {

    selectedSubject: "",

    selectedTopic: "",

    questions: [],

    currentQuestionIndex: 0,

    playerScore: 0,

    computerScore: 0,

    timer: QUESTION_TIME_LIMIT,

    timerInterval: null,

    battleActive: false,

    answeringLocked: false,

    battleConsumed: false

};


/* =========================================================
   CURRICULUM TOPIC DATABASE
   TOPICS ONLY — NO HARDCODED QUESTIONS
========================================================= */

const SUBJECT_DATABASE = {

    "Mathematics": [
        "Number Bases",
        "Fractions, Decimals and Percentages",
        "Indices",
        "Logarithms",
        "Surds",
        "Sets",
        "Algebraic Expressions",
        "Linear Equations",
        "Quadratic Equations",
        "Simultaneous Equations",
        "Sequences and Series",
        "Variation",
        "Inequalities",
        "Functions",
        "Coordinate Geometry",
        "Mensuration",
        "Plane Geometry",
        "Trigonometry",
        "Bearings",
        "Vectors",
        "Statistics",
        "Probability"
    ],

    "English Language": [
        "Parts of Speech",
        "Sentence Structure",
        "Concord",
        "Tenses",
        "Clauses",
        "Phrases",
        "Vocabulary Development",
        "Synonyms",
        "Antonyms",
        "Idioms",
        "Comprehension",
        "Summary Writing",
        "Essay Writing",
        "Formal Letters",
        "Informal Letters",
        "Reports",
        "Articles",
        "Speech Writing",
        "Figures of Speech"
    ],

    "Physics": [
        "Measurement",
        "Motion",
        "Scalars and Vectors",
        "Forces",
        "Work Energy and Power",
        "Machines",
        "Momentum",
        "Gravitation",
        "Heat",
        "Temperature",
        "Waves",
        "Sound",
        "Light",
        "Reflection",
        "Refraction",
        "Electric Fields",
        "Current Electricity",
        "Magnetism",
        "Electromagnetic Induction",
        "Atomic Physics"
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
        "Energy Changes",
        "Rates of Reaction",
        "Chemical Equilibrium",
        "Organic Chemistry",
        "Hydrocarbons",
        "Alcohols",
        "Carboxylic Acids",
        "Polymers",
        "Metals",
        "Non-Metals"
    ],

    "Biology": [
        "Cell Structure",
        "Cell Division",
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
        "Food Webs",
        "Population Studies",
        "Microorganisms",
        "Disease"
    ],

    "Further Mathematics": [
        "Algebra",
        "Functions",
        "Sequences and Series",
        "Binomial Theorem",
        "Matrices",
        "Determinants",
        "Vectors",
        "Coordinate Geometry",
        "Differentiation",
        "Integration",
        "Mechanics",
        "Statistics",
        "Probability"
    ],

    "Agricultural Science": [
        "Agricultural Ecology",
        "Farm Management",
        "Soil Science",
        "Soil Fertility",
        "Crop Production",
        "Crop Protection",
        "Animal Nutrition",
        "Animal Health",
        "Livestock Management",
        "Fisheries",
        "Forestry",
        "Agricultural Economics",
        "Farm Machinery"
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
        "Money",
        "Banking",
        "Inflation",
        "Unemployment",
        "Public Finance",
        "International Trade",
        "Economic Development"
    ],

    "Government": [
        "Political Concepts",
        "Constitution",
        "Citizenship",
        "Democracy",
        "Rule of Law",
        "Political Parties",
        "Pressure Groups",
        "Elections",
        "Public Opinion",
        "The Legislature",
        "The Executive",
        "The Judiciary",
        "Federalism",
        "Local Government",
        "International Organisations",
        "Nigeria's Political Development"
    ],

    "Geography": [
        "The Solar System",
        "Latitude and Longitude",
        "Maps",
        "Weather",
        "Climate",
        "Rocks",
        "Weathering",
        "Erosion",
        "Rivers",
        "Coasts",
        "Vegetation",
        "Population",
        "Settlement",
        "Agriculture",
        "Industry",
        "Transportation",
        "Environmental Resources"
    ],

    "Civic Education": [
        "Citizenship",
        "Human Rights",
        "Responsibilities of Citizens",
        "Democracy",
        "Rule of Law",
        "National Values",
        "Constitution",
        "Political Participation",
        "Elections",
        "Leadership",
        "Corruption",
        "National Integration"
    ],

    "Computer Studies": [
        "Computer Fundamentals",
        "Computer Hardware",
        "Computer Software",
        "Operating Systems",
        "Data Representation",
        "Number Systems",
        "Computer Networks",
        "Internet",
        "Database Concepts",
        "Algorithms",
        "Programming Concepts",
        "Cybersecurity",
        "Information Technology"
    ],

    "Data Processing": [
        "Data and Information",
        "Data Processing Cycle",
        "Computer Hardware",
        "Computer Software",
        "Operating Systems",
        "Word Processing",
        "Spreadsheets",
        "Databases",
        "Presentation Software",
        "Networking",
        "Internet",
        "Cybersecurity"
    ],

    "Financial Accounting": [
        "Accounting Concepts",
        "Double Entry",
        "Ledger Accounts",
        "Trial Balance",
        "Cash Book",
        "Bank Reconciliation",
        "Depreciation",
        "Final Accounts",
        "Partnership Accounts",
        "Company Accounts",
        "Manufacturing Accounts",
        "Incomplete Records"
    ],

    "Literature in English": [
        "Literary Genres",
        "Prose",
        "Poetry",
        "Drama",
        "Characterisation",
        "Setting",
        "Plot",
        "Theme",
        "Narrative Techniques",
        "Figures of Speech",
        "Literary Devices"
    ],

    "Christian Religious Studies": [
        "Creation",
        "The Fall of Man",
        "The Call of Abraham",
        "The Exodus",
        "The Ten Commandments",
        "The Prophets",
        "The Life of Jesus",
        "The Teachings of Jesus",
        "The Death and Resurrection of Jesus",
        "The Early Church",
        "Christian Leadership",
        "Christian Living"
    ],

    "Islamic Religious Studies": [
        "Tawhid",
        "Prophethood",
        "The Qur'an",
        "Hadith",
        "Five Pillars of Islam",
        "Salah",
        "Zakat",
        "Sawm",
        "Hajj",
        "Islamic Morality",
        "Islamic History"
    ],

    "Physical Education": [
        "Physical Fitness",
        "Health Education",
        "Nutrition",
        "Athletics",
        "Football",
        "Basketball",
        "Volleyball",
        "Swimming",
        "Gymnastics",
        "First Aid",
        "Safety"
    ],

    "Home Economics": [
        "Food and Nutrition",
        "Meal Planning",
        "Food Preparation",
        "Food Preservation",
        "Clothing",
        "Textiles",
        "Family Living",
        "Consumer Education",
        "Home Management"
    ],

    "Visual Arts": [
        "Elements of Art",
        "Principles of Design",
        "Drawing",
        "Painting",
        "Sculpture",
        "Graphic Design",
        "Textiles",
        "Ceramics",
        "Art History"
    ],

    "Technical Drawing": [
        "Drawing Instruments",
        "Geometrical Construction",
        "Orthographic Projection",
        "Isometric Drawing",
        "Perspective Drawing",
        "Sectional Views",
        "Building Drawing",
        "Machine Drawing"
    ]

};


/* =========================================================
   SUBJECT ALIASES
========================================================= */

const SUBJECT_ALIASES = {

    "math":
        "Mathematics",

    "maths":
        "Mathematics",

    "mathematics":
        "Mathematics",

    "english":
        "English Language",

    "english language":
        "English Language",

    "chem":
        "Chemistry",

    "chemistry":
        "Chemistry",

    "physics":
        "Physics",

    "biology":
        "Biology",

    "further maths":
        "Further Mathematics",

    "further math":
        "Further Mathematics",

    "further mathematics":
        "Further Mathematics",

    "agric":
        "Agricultural Science",

    "agric science":
        "Agricultural Science",

    "agricultural science":
        "Agricultural Science",

    "computer":
        "Computer Studies",

    "computer science":
        "Computer Studies",

    "computer studies":
        "Computer Studies",

    "ict":
        "Information Technology",

    "civic":
        "Civic Education",

    "civic education":
        "Civic Education",

    "government":
        "Government",

    "economics":
        "Economics",

    "geography":
        "Geography",

    "accounting":
        "Financial Accounting",

    "financial accounting":
        "Financial Accounting",

    "literature":
        "Literature in English",

    "literature in english":
        "Literature in English",

    "crs":
        "Christian Religious Studies",

    "christian religious studies":
        "Christian Religious Studies",

    "irs":
        "Islamic Religious Studies",

    "islamic religious studies":
        "Islamic Religious Studies"

};


/* =========================================================
   DOM HELPER
========================================================= */

function battleElement(id) {

    return document.getElementById(id);

}


/* =========================================================
   SUBJECT NORMALIZATION
========================================================= */

function normalizeSubjectName(name) {

    if (!name) {
        return "";
    }

    const cleaned =
        String(name)
            .trim()
            .replace(/\s+/g, " ")
            .toLowerCase();

    if (
        SUBJECT_ALIASES[
            cleaned
        ]
    ) {

        return SUBJECT_ALIASES[
            cleaned
        ];

    }

    const exact =
        Object.keys(
            SUBJECT_DATABASE
        ).find(
            subject =>
                subject
                    .toLowerCase() ===
                cleaned
        );

    return exact ||
        String(name).trim();

}


/* =========================================================
   TOPIC FALLBACK
========================================================= */

function getFallbackTopics(subject) {

    const normalized =
        normalizeSubjectName(
            subject
        );

    return (
        SUBJECT_DATABASE[
            normalized
        ] || []
    );

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
        ] = [
            result[j],
            result[i]
        ];

    }

    return result;

}


/* =========================================================
   HTML ESCAPE
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
   SHARED BATTLE COUNTER
========================================================= */

/*
   This is the SAME storage key used by game-mode.js:

   studyMindGameBattleCount

   There is intentionally NO second counter.
*/

function getBattleCount() {

    return (
        Number(
            localStorage.getItem(
                BATTLE_COUNT_KEY
            )
        ) || 0
    );

}


function getBattlesRemaining() {

    return Math.max(
        0,
        FREE_BATTLE_LIMIT -
            getBattleCount()
    );

}


function canPlayFreeBattle() {

    return (
        getBattleCount() <
        FREE_BATTLE_LIMIT
    );

}


/* =========================================================
   UPDATE COUNTER UI
========================================================= */

function updateFreeBattleDisplay() {

    const used =
        getBattleCount();

    const remaining =
        Math.max(
            0,
            FREE_BATTLE_LIMIT -
                used
        );


    /*
       Support both Computer Battle
       and Game Mode element names.
    */

    const usedElements = [

        "freeBattlesUsed",

        "battleUsedCount",

        "freeBattleUsed",

        "battlesUsed"

    ];


    const remainingElements = [

        "freeBattlesRemaining",

        "remainingBattles",

        "battleRemaining",

        "freeBattleCount"

    ];


    usedElements.forEach(
        id => {

            const element =
                battleElement(id);

            if (element) {

                element.textContent =
                    used;

            }

        }
    );


    remainingElements.forEach(
        id => {

            const element =
                battleElement(id);

            if (element) {

                element.textContent =
                    remaining;

            }

        }
    );


    const statusElements = [

        "freeBattleStatus",

        "battleLimitText",

        "battleUsageText",

        "battleStatusText"

    ];


    statusElements.forEach(
        id => {

            const element =
                battleElement(id);

            if (!element) {
                return;
            }

            element.textContent =
                remaining > 0
                    ? `${used} / ${FREE_BATTLE_LIMIT} battles used — ${remaining} free battle${remaining === 1 ? "" : "s"} remaining`
                    : "All 5 free battles used.";

        }
    );


    /*
       Also notify any other StudyMind
       page/component listening for changes.
    */

    window.dispatchEvent(
        new CustomEvent(
            "studyMindBattleCountChanged",
            {
                detail: {
                    used,
                    remaining
                }
            }
        )
    );

}


/* =========================================================
   CONSUME ONE FREE BATTLE
========================================================= */

function consumeFreeBattle() {

    /*
       Never consume twice for the
       same completed battle.
    */

    if (
        computerBattleState
            .battleConsumed
    ) {

        return getBattleCount();

    }


    /*
       Premium users do not consume
       free battles.
    */

    if (
        isPremiumUser()
    ) {

        computerBattleState
            .battleConsumed =
            true;

        return getBattleCount();

    }


    const currentCount =
        getBattleCount();


    /*
       Safety guard.
    */

    if (
        currentCount >=
        FREE_BATTLE_LIMIT
    ) {

        computerBattleState
            .battleConsumed =
            true;

        updateFreeBattleDisplay();

        return currentCount;

    }


    const newCount =
        currentCount + 1;


    /*
       THE IMPORTANT FIX:
       Write to the same key that
       game-mode.js reads.
    */

    localStorage.setItem(
        BATTLE_COUNT_KEY,
        String(newCount)
    );


    computerBattleState
        .battleConsumed =
        true;


    updateFreeBattleDisplay();


    console.log(
        `StudyMind Computer Battle: free battle count changed from ${currentCount} to ${newCount}.`
    );


    return newCount;

}


/* =========================================================
   PREMIUM CHECK
========================================================= */

function isPremiumUser() {

    const premium =
        localStorage.getItem(
            "studyMindPremium"
        );

    return (
        premium === "true" ||
        premium === "premium" ||
        premium === "1"
    );

}


/* =========================================================
   AUTHENTICATION
========================================================= */

async function waitForSupabaseClient(
    timeout = 10000
) {

    const start =
        Date.now();

    while (
        Date.now() -
            start <
        timeout
    ) {

        if (
            window.supabaseClient &&
            window.supabaseClient.auth
        ) {

            return window.supabaseClient;

        }

        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    100
                )
        );

    }

    throw new Error(
        "Supabase is not ready. Please refresh the page and try again."
    );

}


async function verifyComputerBattleUser() {

    try {

        const client =
            await waitForSupabaseClient();

        const {
            data,
            error
        } =
            await client.auth.getUser();


        if (error) {

            throw error;

        }


        if (
            !data ||
            !data.user
        ) {

            window.location.href =
                "login.html";

            return null;

        }


        return data.user;

    } catch (error) {

        console.error(
            "Computer Battle authentication error:",
            error
        );

        throw new Error(
            "We couldn't verify your account. Please refresh the page and try again."
        );

    }

}


/* =========================================================
   LOAD SUBJECTS
========================================================= */

function populateSubjects() {

    const subjectSelect =
        battleElement(
            "subjectSelect"
        );

    if (!subjectSelect) {

        console.warn(
            "subjectSelect was not found."
        );

        return;

    }


    const subjects =
        Object.keys(
            SUBJECT_DATABASE
        ).sort(
            (a, b) =>
                a.localeCompare(b)
        );


    subjectSelect.innerHTML =
        `<option value="">Select a subject</option>`;


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


    subjectSelect.disabled =
        false;

}


/* =========================================================
   LOAD TOPICS
========================================================= */

function populateTopics() {

    const subjectSelect =
        battleElement(
            "subjectSelect"
        );

    const topicSelect =
        battleElement(
            "topicSelect"
        );


    if (
        !subjectSelect ||
        !topicSelect
    ) {

        return;

    }


    const subject =
        normalizeSubjectName(
            subjectSelect.value
        );


    topicSelect.innerHTML =
        `<option value="">Select a topic</option>`;


    if (!subject) {

        topicSelect.disabled =
            true;

        return;

    }


    const topics =
        getFallbackTopics(
            subject
        );


    topics.forEach(
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
        topics.length === 0;


    if (topics.length) {

        topicSelect.value =
            topics[
                0
            ];

    }

}


/* =========================================================
   ERROR MESSAGE
========================================================= */

function showBattleError(
    message
) {

    const element =
        battleElement(
            "battleError"
        );

    if (!element) {

        return;

    }


    element.textContent =
        message;

    element.classList.add(
        "active"
    );

}


function hideBattleError() {

    const element =
        battleElement(
            "battleError"
        );

    if (!element) {

        return;

    }


    element.textContent =
        "";

    element.classList.remove(
        "active"
    );

}


/* =========================================================
   LOADING
========================================================= */

function showLoading() {

    const setup =
        battleElement(
            "battleSetup"
        );

    const loading =
        battleElement(
            "battleLoading"
        );


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
        battleElement(
            "battleLoading"
        );

    if (loading) {

        loading.classList.remove(
            "active"
        );

    }

}


/* =========================================================
   API QUESTION GENERATION
========================================================= */

async function generateAIQuestions(
    subject,
    topic
) {

    const battleNonce =
        `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`;


    const curriculumTopics =
        getFallbackTopics(
            subject
        );


    const response =
        await fetch(
            "/api/generate-questions",
            {

                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify({

                        requestType:
                            "computer_battle",

                        mode:
                            "computer_battle",

                        subject:
                            subject,

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
                            "mixed",

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

Generate a completely NEW set of exactly
${QUESTIONS_PER_BATTLE} multiple-choice
questions.

SUBJECT:
${subject}

TOPIC:
${topic}

CURRICULUM:
Nigerian Senior Secondary School curriculum.

STRICT REQUIREMENTS:

1. All questions MUST be about ${subject}.

2. All questions MUST specifically test
the topic "${topic}".

3. Do NOT substitute Mathematics,
Geometry, or another subject.

4. Do NOT use questions from another
subject.

5. Questions must be appropriate for a
Nigerian Senior Secondary School student.

6. Follow the Nigerian secondary-school
curriculum.

7. Generate exactly ${QUESTIONS_PER_BATTLE}
questions.

8. Every question must have exactly
4 answer options.

9. There must be exactly ONE correct answer.

10. Randomize the questions.

11. Randomize the answer choices.

12. Do not repeat questions.

13. Do not return explanations.

14. Return ONLY valid JSON.

FORMAT:

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

The answer field must be the
zero-based index of the correct option.

Do not wrap the JSON in markdown.
Do not add commentary.

                        `

                    })

            }
        );


    let responseText =
        "";


    try {

        responseText =
            await response.text();

    } catch (
        readError
    ) {

        throw new Error(
            "The AI server returned an unreadable response."
        );

    }


    if (
        !response.ok
    ) {

        let errorMessage =
            `AI question generation failed (${response.status}).`;


        try {

            const errorData =
                JSON.parse(
                    responseText
                );

            errorMessage =
                errorData.message ||
                errorData.error ||
                errorMessage;

        } catch {

            if (
                responseText
            ) {

                errorMessage =
                    responseText.slice(
                        0,
                        300
                    );

            }

        }


        throw new Error(
            errorMessage
        );

    }


    let data;


    try {

        data =
            JSON.parse(
                responseText
            );

    } catch {

        throw new Error(
            "The AI server returned invalid JSON."
        );

    }


    return extractQuestions(
        data
    );

}


/* =========================================================
   EXTRACT QUESTIONS
========================================================= */

function extractQuestions(
    data
) {

    if (
        Array.isArray(data)
    ) {

        return data;

    }


    const candidates = [

        data?.questions,

        data?.data,

        data?.results,

        data?.items,

        data?.output,

        data?.response,

        data?.reply

    ];


    for (
        const candidate of
        candidates
    ) {

        if (
            Array.isArray(
                candidate
            )
        ) {

            return candidate;

        }


        if (
            typeof candidate ===
            "string"
        ) {

            try {

                const parsed =
                    JSON.parse(
                        candidate
                    );

                if (
                    Array.isArray(
                        parsed
                    )
                ) {

                    return parsed;

                }

            } catch {
                /* Continue */
            }

        }


        if (
            candidate &&
            typeof candidate ===
                "object"
        ) {

            const nested =
                extractQuestions(
                    candidate
                );

            if (
                Array.isArray(
                    nested
                )
            ) {

                return nested;

            }

        }

    }


    throw new Error(
        "The AI server returned no questions."
    );

}


/* =========================================================
   NORMALIZE QUESTIONS
========================================================= */

function normalizeQuestions(
    questions
) {

    if (
        !Array.isArray(
            questions
        )
    ) {

        return [];

    }


    const normalized = [];


    questions.forEach(
        item => {

            if (
                !item ||
                typeof item !==
                    "object"
            ) {

                return;

            }


            const question =
                String(
                    item.question ||
                    item.text ||
                    ""
                ).trim();


            let options =
                item.options ||
                item.choices ||
                item.answers;


            if (
                !Array.isArray(
                    options
                )
            ) {

                return;

            }


            options =
                options
                    .map(
                        option =>
                            String(
                                option
                            ).trim()
                    )
                    .filter(
                        Boolean
                    );


            if (
                !question ||
                options.length !== 4
            ) {

                return;

            }


            let answer =
                item.answer;


            if (
                answer ===
                    undefined
            ) {

                answer =
                    item.correctAnswer;

            }


            if (
                typeof answer ===
                "string"
            ) {

                const letter =
                    answer
                        .trim()
                        .toUpperCase();


                if (
                    [
                        "A",
                        "B",
                        "C",
                        "D"
                    ].includes(
                        letter
                    )
                ) {

                    answer =
                        [
                            "A",
                            "B",
                            "C",
                            "D"
                        ].indexOf(
                            letter
                        );

                } else if (
                    /^\d+$/.test(
                        answer
                    )
                ) {

                    answer =
                        Number(
                            answer
                        );

                }

            }


            answer =
                Number(
                    answer
                );


            if (
                !Number.isInteger(
                    answer
                ) ||
                answer < 0 ||
                answer > 3
            ) {

                return;

            }


            normalized.push({

                question,

                options,

                answer

            });

        }
    );


    /*
       Remove duplicate questions.
    */

    const unique = [];

    const seen =
        new Set();


    normalized.forEach(
        item => {

            const key =
                item.question
                    .toLowerCase()
                    .replace(
                        /\s+/g,
                        " "
                    );


            if (
                seen.has(key)
            ) {

                return;

            }


            seen.add(key);

            unique.push(
                item
            );

        }
    );


    return unique;

}


/* =========================================================
   PREPARE QUESTIONS
========================================================= */

function prepareQuestions(
    questions
) {

    return shuffleArray(
        questions
    )
        .slice(
            0,
            QUESTIONS_PER_BATTLE
        )
        .map(
            question => {

                const correctAnswer =
                    question.options[
                        question.answer
                    ];


                const shuffledOptions =
                    shuffleArray(
                        question.options
                    );


                return {

                    question:
                        question.question,

                    options:
                        shuffledOptions,

                    answer:
                        shuffledOptions.indexOf(
                            correctAnswer
                        )

                };

            }
        );

}


/* =========================================================
   START COMPUTER BATTLE
========================================================= */

async function startComputerBattle() {

    if (
        computerBattleState
            .battleActive
    ) {

        return;

    }


    hideBattleError();


    /*
       CHECK FREE LIMIT BEFORE
       GENERATING AI QUESTIONS.
    */

    if (
        !isPremiumUser() &&
        !canPlayFreeBattle()
    ) {

        showPremiumMessage();

        return;

    }


    const subjectSelect =
        battleElement(
            "subjectSelect"
        );

    const topicSelect =
        battleElement(
            "topicSelect"
        );


    const subject =
        normalizeSubjectName(
            subjectSelect?.value
        );


    const topic =
        topicSelect?.value?.trim();


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


    const startButton =
        battleElement(
            "startBattleButton"
        );


    if (startButton) {

        startButton.disabled =
            true;

        startButton.textContent =
            "Preparing Battle...";

    }


    computerBattleState =
        {

            selectedSubject:
                subject,

            selectedTopic:
                topic,

            questions: [],

            currentQuestionIndex:
                0,

            playerScore:
                0,

            computerScore:
                0,

            timer:
                QUESTION_TIME_LIMIT,

            timerInterval:
                null,

            battleActive:
                false,

            answeringLocked:
                false,

            battleConsumed:
                false

        };


    showLoading();


    try {

        console.log(
            "Generating AI battle:",
            {
                subject,
                topic
            }
        );


        const aiQuestions =
            await generateAIQuestions(
                subject,
                topic
            );


        const normalized =
            normalizeQuestions(
                aiQuestions
            );


        if (
            normalized.length <
            QUESTIONS_PER_BATTLE
        ) {

            throw new Error(
                `The AI generated only ${normalized.length} valid questions. A full battle requires ${QUESTIONS_PER_BATTLE}.`
            );

        }


        computerBattleState
            .questions =
            prepareQuestions(
                normalized
            );


        if (
            computerBattleState
                .questions.length !==
            QUESTIONS_PER_BATTLE
        ) {

            throw new Error(
                "StudyMind AI could not prepare a complete 10-question battle."
            );

        }


        hideLoading();

        beginBattle();

    } catch (error) {

        console.error(
            "Computer Battle error:",
            error
        );


        hideLoading();


        const setup =
            battleElement(
                "battleSetup"
            );

        if (setup) {

            setup.style.display =
                "";

        }


        showBattleError(
            error?.message ||
            "StudyMind AI could not create this battle. Please try again."
        );


    } finally {

        if (startButton) {

            startButton.disabled =
                false;

            startButton.textContent =
                "⚔️ Start Battle";

        }

    }

}


/* =========================================================
   BEGIN BATTLE
========================================================= */

function beginBattle() {

    computerBattleState
        .battleActive =
        true;


    computerBattleState
        .currentQuestionIndex =
        0;


    computerBattleState
        .playerScore =
        0;


    computerBattleState
        .computerScore =
        0;


    computerBattleState
        .answeringLocked =
        false;


    const setup =
        battleElement(
            "battleSetup"
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


    if (results) {

        results.hidden =
            true;

        results.style.display =
            "none";

    }


    if (screen) {

        screen.hidden =
            false;

        screen.style.display =
            "";

    }


    updateScores();

    showCurrentQuestion();

}


/* =========================================================
   SHOW CURRENT QUESTION
========================================================= */

function showCurrentQuestion() {

    const index =
        computerBattleState
            .currentQuestionIndex;


    if (
        index >=
        QUESTIONS_PER_BATTLE
    ) {

        finishBattle();

        return;

    }


    const question =
        computerBattleState
            .questions[index];


    if (!question) {

        finishBattle();

        return;

    }


    computerBattleState
        .answeringLocked =
        false;


    const round =
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


    if (round) {

        round.textContent =
            `${index + 1} / ${QUESTIONS_PER_BATTLE}`;

    }


    if (questionTopic) {

        questionTopic.textContent =
            computerBattleState
                .selectedTopic;

    }


    if (questionText) {

        questionText.textContent =
            question.question;

    }


    if (answerGrid) {

        answerGrid.innerHTML =
            question.options
                .map(
                    (
                        option,
                        optionIndex
                    ) => `

                        <button
                            type="button"
                            class="answer-button"
                            data-answer="${optionIndex}"
                        >
                            <span class="answer-letter">
                                ${String.fromCharCode(
                                    65 +
                                    optionIndex
                                )}
                            </span>

                            <span>
                                ${escapeHTML(
                                    option
                                )}
                            </span>
                        </button>

                    `
                )
                .join("");


        answerGrid
            .querySelectorAll(
                ".answer-button"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            submitAnswer(
                                Number(
                                    button.dataset
                                        .answer
                                )
                            );

                        }
                    );

                }
            );

    }


    updateProgress();

    startQuestionTimer();

}


/* =========================================================
   PROGRESS
========================================================= */

function updateProgress() {

    const progressBar =
        battleElement(
            "battleProgressBar"
        );


    if (!progressBar) {

        return;

    }


    const index =
        computerBattleState
            .currentQuestionIndex;


    const percentage =
        (
            index /
            QUESTIONS_PER_BATTLE
        ) *
        100;


    progressBar.style.width =
        `${percentage}%`;

}


/* =========================================================
   TIMER
========================================================= */

function startQuestionTimer() {

    clearInterval(
        computerBattleState
            .timerInterval
    );


    computerBattleState.timer =
        QUESTION_TIME_LIMIT;


    updateTimerDisplay();


    computerBattleState
        .timerInterval =
        setInterval(
            () => {

                computerBattleState
                    .timer--;

                updateTimerDisplay();


                if (
                    computerBattleState
                        .timer <= 0
                ) {

                    clearInterval(
                        computerBattleState
                            .timerInterval
                    );

                    handleTimeExpired();

                }

            },
            1000
        );

}


/* =========================================================
   TIMER DISPLAY
========================================================= */

function updateTimerDisplay() {

    const timerNumber =
        battleElement(
            "timerNumber"
        );


    if (timerNumber) {

        timerNumber.textContent =
            computerBattleState
                .timer;

    }


    const timerContainer =
        battleElement(
            "timerContainer"
        );


    if (timerContainer) {

        timerContainer.classList.toggle(
            "timer-warning",
            computerBattleState
                .timer <= 5
        );

    }

}


/* =========================================================
   TIME EXPIRED
========================================================= */

function handleTimeExpired() {

    if (
        computerBattleState
            .answeringLocked
    ) {

        return;

    }


    computerBattleState
        .answeringLocked =
        true;


    const feedback =
        battleElement(
            "battleFeedback"
        );


    if (feedback) {

        feedback.textContent =
            "⏱️ Time's up!";

        feedback.className =
            "battle-feedback incorrect";

    }


    /*
       Computer gets the point
       randomly based on its chance
       of answering correctly.
    */

    computerAnswer();


    disableAnswerButtons();


    setTimeout(
        moveToNextQuestion,
        900
    );

}


/* =========================================================
   SUBMIT ANSWER
========================================================= */

function submitAnswer(
    selectedAnswer
) {

    if (
        !computerBattleState
            .battleActive ||
        computerBattleState
            .answeringLocked
    ) {

        return;

    }


    computerBattleState
        .answeringLocked =
        true;


    clearInterval(
        computerBattleState
            .timerInterval
    );


    const question =
        computerBattleState
            .questions[
                computerBattleState
                    .currentQuestionIndex
            ];


    const buttons =
        document.querySelectorAll(
            "#answerGrid .answer-button"
        );


    const correctAnswer =
        question.answer;


    buttons.forEach(
        button => {

            button.disabled =
                true;


            const index =
                Number(
                    button.dataset
                        .answer
                );


            if (
                index ===
                correctAnswer
            ) {

                button.classList.add(
                    "correct"
                );

            }


            if (
                index ===
                selectedAnswer &&
                selectedAnswer !==
                    correctAnswer
            ) {

                button.classList.add(
                    "incorrect"
                );

            }

        }
    );


    const feedback =
        battleElement(
            "battleFeedback"
        );


    if (
        selectedAnswer ===
        correctAnswer
    ) {

        computerBattleState
            .playerScore++;


        if (feedback) {

            feedback.textContent =
                "✅ Correct!";

            feedback.className =
                "battle-feedback correct";

        }

    } else {

        if (feedback) {

            feedback.textContent =
                "❌ Incorrect";

            feedback.className =
                "battle-feedback incorrect";

        }

    }


    computerAnswer();

    updateScores();


    setTimeout(
        moveToNextQuestion,
        900
    );

}


/* =========================================================
   COMPUTER ANSWER
========================================================= */

function computerAnswer() {

    /*
       The computer has a randomized
       chance of answering correctly.

       This is not a hard-coded
       question bank.
    */

    const question =
        computerBattleState
            .questions[
                computerBattleState
                    .currentQuestionIndex
            ];


    if (!question) {

        return;

    }


    /*
       Difficulty is naturally varied
       between rounds.
    */

    const chance =
        0.55 +
        (
            Math.random() *
            0.30
        );


    if (
        Math.random() <
        chance
    ) {

        computerBattleState
            .computerScore++;

    }


    updateScores();

}


/* =========================================================
   DISABLE ANSWERS
========================================================= */

function disableAnswerButtons() {

    document
        .querySelectorAll(
            "#answerGrid .answer-button"
        )
        .forEach(
            button => {

                button.disabled =
                    true;

            }
        );

}


/* =========================================================
   NEXT QUESTION
========================================================= */

function moveToNextQuestion() {

    clearInterval(
        computerBattleState
            .timerInterval
    );


    computerBattleState
        .currentQuestionIndex++;


    if (
        computerBattleState
            .currentQuestionIndex >=
        QUESTIONS_PER_BATTLE
    ) {

        finishBattle();

        return;

    }


    showCurrentQuestion();

}


/* =========================================================
   UPDATE SCORES
========================================================= */

function updateScores() {

    const playerScore =
        battleElement(
            "playerScore"
        );

    const computerScore =
        battleElement(
            "computerScore"
        );


    if (playerScore) {

        playerScore.textContent =
            computerBattleState
                .playerScore;

    }


    if (computerScore) {

        computerScore.textContent =
            computerBattleState
                .computerScore;

    }

}


/* =========================================================
   FINISH BATTLE
========================================================= */

async function finishBattle() {

    clearInterval(
        computerBattleState
            .timerInterval
    );


    computerBattleState
        .battleActive =
        false;


    /*
       THIS IS WHERE THE FREE BATTLE
       IS CONSUMED.

       Exactly once.
    */

    const completedCount =
        consumeFreeBattle();


    updateFreeBattleDisplay();


    const playerScore =
        computerBattleState
            .playerScore;

    const computerScore =
        computerBattleState
            .computerScore;


    const points =
        calculateBattlePoints();


    displayBattleResults(
        points,
        completedCount
    );


    await updateLeaderboard(
        points,
        playerScore,
        computerScore
    );


    /*
       Tell other StudyMind components
       that the counter changed.
    */

    window.dispatchEvent(
        new CustomEvent(
            "studyMindBattleCompleted",
            {
                detail: {
                    used:
                        completedCount,

                    remaining:
                        Math.max(
                            0,
                            FREE_BATTLE_LIMIT -
                                completedCount
                        ),

                    playerScore,

                    computerScore,

                    points
                }
            }
        )
    );

}


/* =========================================================
   CALCULATE BATTLE POINTS
========================================================= */

function calculateBattlePoints() {

    const player =
        computerBattleState
            .playerScore;

    const computer =
        computerBattleState
            .computerScore;


    let points =
        player * 10;


    if (
        player >
        computer
    ) {

        points += 25;

    } else if (
        player ===
        computer
    ) {

        points += 10;

    }


    return points;

}


/* =========================================================
   DISPLAY RESULTS
========================================================= */

function displayBattleResults(
    points,
    completedCount
) {

    const screen =
        battleElement(
            "battleScreen"
        );

    const results =
        battleElement(
            "battleResults"
        );


    if (screen) {

        screen.hidden =
            true;

        screen.style.display =
            "none";

    }


    if (results) {

        results.hidden =
            false;

        results.style.display =
            "";

    }


    const finalPlayerScore =
        battleElement(
            "finalPlayerScore"
        );

    const finalComputerScore =
        battleElement(
            "finalComputerScore"
        );

    const battlePointsEarned =
        battleElement(
            "battlePointsEarned"
        );

    const resultIcon =
        battleElement(
            "resultIcon"
        );

    const resultTitle =
        battleElement(
            "resultTitle"
        );

    const resultSummary =
        battleElement(
            "resultSummary"
        );

    const battleResultMessage =
        battleElement(
            "battleResultMessage"
        );


    if (finalPlayerScore) {

        finalPlayerScore.textContent =
            computerBattleState
                .playerScore;

    }


    if (finalComputerScore) {

        finalComputerScore.textContent =
            computerBattleState
                .computerScore;

    }


    if (battlePointsEarned) {

        battlePointsEarned.textContent =
            points;

    }


    const player =
        computerBattleState
            .playerScore;

    const computer =
        computerBattleState
            .computerScore;


    if (
        player >
        computer
    ) {

        if (resultIcon) {

            resultIcon.textContent =
                "🏆";

        }

        if (resultTitle) {

            resultTitle.textContent =
                "You Win!";

        }

        if (resultSummary) {

            resultSummary.textContent =
                `Excellent work! You scored ${player} out of ${QUESTIONS_PER_BATTLE}.`;

        }

    } else if (
        player <
        computer
    ) {

        if (resultIcon) {

            resultIcon.textContent =
                "📚";

        }

        if (resultTitle) {

            resultTitle.textContent =
                "Keep Practising!";

        }

        if (resultSummary) {

            resultSummary.textContent =
                `You scored ${player} out of ${QUESTIONS_PER_BATTLE}. Review ${computerBattleState.selectedTopic} and try again when another battle is available.`;

        }

    } else {

        if (resultIcon) {

            resultIcon.textContent =
                "🤝";

        }

        if (resultTitle) {

            resultTitle.textContent =
                "It's a Draw!";

        }

        if (resultSummary) {

            resultSummary.textContent =
                `You and the computer both scored ${player}.`;

        }

    }


    if (battleResultMessage) {

        if (
            isPremiumUser()
        ) {

            battleResultMessage.textContent =
                "Premium: You have unlimited battles.";

        } else {

            const remaining =
                Math.max(
                    0,
                    FREE_BATTLE_LIMIT -
                        completedCount
                );


            battleResultMessage.textContent =
                remaining > 0
                    ? `${remaining} free battle${remaining === 1 ? "" : "s"} remaining.`
                    : "You've used all 5 free battles. Upgrade to Premium to continue.";

        }

    }

}


/* =========================================================
   LEADERBOARD
========================================================= */

async function updateLeaderboard(
    points,
    playerScore,
    computerScore
) {

    try {

        const client =
            await waitForSupabaseClient();


        const {
            data: userData,
            error: userError
        } =
            await client.auth.getUser();


        if (
            userError ||
            !userData?.user
        ) {

            return;

        }


        const user =
            userData.user;


        /*
           Fetch existing leaderboard row.
        */

        const {
            data: existing,
            error: fetchError
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


        if (fetchError) {

            console.warn(
                "Leaderboard lookup failed:",
                fetchError
            );

            return;

        }


        const old =
            existing || {

                user_id:
                    user.id,

                display_name:
                    user.email
                        ?.split("@")[0] ||
                    "StudyMind User",

                battle_points:
                    0,

                wins:
                    0,

                losses:
                    0,

                draws:
                    0,

                battles_played:
                    0

            };


        let wins =
            Number(
                old.wins
            ) || 0;

        let losses =
            Number(
                old.losses
            ) || 0;

        let draws =
            Number(
                old.draws
            ) || 0;


        if (
            playerScore >
            computerScore
        ) {

            wins++;

        } else if (
            playerScore <
            computerScore
        ) {

            losses++;

        } else {

            draws++;

        }


        const displayName =
            old.display_name ||
            user.user_metadata
                ?.display_name ||
            user.user_metadata
                ?.full_name ||
            user.email
                ?.split("@")[0] ||
            "StudyMind User";


        const payload = {

            user_id:
                user.id,

            display_name:
                displayName,

            battle_points:
                (
                    Number(
                        old.battle_points
                    ) || 0
                ) + points,

            wins,

            losses,

            draws,

            battles_played:
                (
                    Number(
                        old.battles_played
                    ) || 0
                ) + 1

        };


        const {
            error: upsertError
        } =
            await client
                .from(
                    "game_leaderboard"
                )
                .upsert(
                    payload,
                    {
                        onConflict:
                            "user_id"
                    }
                );


        if (upsertError) {

            console.warn(
                "Leaderboard update failed:",
                upsertError
            );

        }

    } catch (error) {

        console.warn(
            "Leaderboard update error:",
            error
        );

    }

}


/* =========================================================
   PLAY AGAIN
========================================================= */

function playAgain() {

    /*
       DO NOT increment the counter here.

       A new battle will only consume
       another battle after all 10
       questions are completed.
    */

    clearInterval(
        computerBattleState
            .timerInterval
    );


    computerBattleState =
        {

            selectedSubject:
                "",

            selectedTopic:
                "",

            questions: [],

            currentQuestionIndex:
                0,

            playerScore:
                0,

            computerScore:
                0,

            timer:
                QUESTION_TIME_LIMIT,

            timerInterval:
                null,

            battleActive:
                false,

            answeringLocked:
                false,

            battleConsumed:
                false

        };


    const results =
        battleElement(
            "battleResults"
        );

    const setup =
        battleElement(
            "battleSetup"
        );


    if (results) {

        results.hidden =
            true;

        results.style.display =
            "none";

    }


    if (setup) {

        setup.hidden =
            false;

        setup.style.display =
            "";

    }


    updateFreeBattleDisplay();


    window.scrollTo({

        top: 0,

        behavior:
            "smooth"

    });

}


/* =========================================================
   PREMIUM MESSAGE
========================================================= */

function showPremiumMessage() {

    const remaining =
        getBattlesRemaining();


    if (
        remaining > 0
    ) {

        return;

    }


    const premiumCard =
        battleElement(
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


    const error =
        battleElement(
            "battleError"
        );


    if (error) {

        showBattleError(
            "You've used all 5 free battles. Upgrade to Premium to continue playing unlimited battles."
        );

    } else {

        alert(
            "You've used all 5 free battles. Upgrade to Premium to continue playing unlimited battles."
        );

    }

}


/* =========================================================
   RETURN TO GAME MODE
========================================================= */

function returnToGameMode() {

    window.location.href =
        "game-mode.html";

}


/* =========================================================
   SUBJECT LISTENER
========================================================= */

function setupSubjectListener() {

    const subjectSelect =
        battleElement(
            "subjectSelect"
        );


    if (!subjectSelect) {

        return;

    }


    subjectSelect.addEventListener(
        "change",
        populateTopics
    );

}


/* =========================================================
   CROSS-PAGE COUNTER SYNC
========================================================= */

window.addEventListener(
    "storage",
    event => {

        if (
            event.key ===
            BATTLE_COUNT_KEY
        ) {

            updateFreeBattleDisplay();

        }

    }
);


/* =========================================================
   INITIALIZATION
========================================================= */

async function initializeComputerBattle() {

    try {

        populateSubjects();

        populateTopics();

        setupSubjectListener();

        updateFreeBattleDisplay();


        /*
           Authentication is checked,
           but we don't block the UI while
           the page initializes.
        */

        try {

            await verifyComputerBattleUser();

        } catch (authError) {

            console.warn(
                "Authentication check:",
                authError
            );

        }


        if (
            !isPremiumUser() &&
            !canPlayFreeBattle()
        ) {

            console.log(
                "Free Computer Battle limit reached."
            );

        }


        console.log(
            "StudyMind Computer Battle initialized.",
            {
                battlesUsed:
                    getBattleCount(),

                battlesRemaining:
                    getBattlesRemaining()
            }
        );

    } catch (error) {

        console.error(
            "Computer Battle initialization error:",
            error
        );

    }

}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.startComputerBattle =
    startComputerBattle;

window.playAgain =
    playAgain;

window.returnToGameMode =
    returnToGameMode;

window.getBattleCount =
    getBattleCount;

window.getBattlesRemaining =
    getBattlesRemaining;

window.canPlayFreeBattle =
    canPlayFreeBattle;

window.consumeFreeBattle =
    consumeFreeBattle;

window.updateFreeBattleDisplay =
    updateFreeBattleDisplay;


/* =========================================================
   DEBUG ACCESS
========================================================= */

window.studyMindComputerBattle = {

    state:
        computerBattleState,

    getBattleCount,

    getBattlesRemaining,

    canPlayFreeBattle,

    consumeFreeBattle,

    updateFreeBattleDisplay,

    startComputerBattle,

    playAgain

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
/* =========================================================
   COMPUTER BATTLE NAVIGATION
========================================================= */

function openComputerBattle() {
    window.location.href = "computer-battle.html";
}

window.openComputerBattle = openComputerBattle;
