
/* =========================================================
   STUDYMIND AI — GAME MODE
   COMPLETE REPLACEMENT
========================================================= */

"use strict";


/* =========================================================
   CONFIGURATION
========================================================= */

const FREE_BATTLE_LIMIT = 5;
const QUESTIONS_PER_BATTLE = 10;
const QUESTION_TIME_SECONDS = 15;

const GAME_STORAGE = {

    battlesUsed:
        "studyMindGameBattlesUsed",

    battlePoints:
        "studyMindBattlePoints",

    theme:
        "studyMindTheme"
};


/* =========================================================
   NIGERIAN SECONDARY SCHOOL CURRICULUM
   GAME MODE SUBJECT DATABASE
========================================================= */

const SUBJECT_DATABASE = {

    "Accounting": [
        "Introduction to Accounting",
        "Accounting Concepts and Conventions",
        "Double Entry",
        "Source Documents",
        "Books of Original Entry",
        "Cash Book",
        "Bank Reconciliation",
        "Trial Balance",
        "Final Accounts",
        "Depreciation",
        "Control Accounts",
        "Partnership Accounts",
        "Company Accounts",
        "Manufacturing Accounts",
        "Public Sector Accounting"
    ],

    "Agricultural Science": [
        "Introduction to Agriculture",
        "Agricultural Ecology",
        "Farm Tools and Machinery",
        "Farm Surveying",
        "Soil",
        "Soil Fertility",
        "Farm Records",
        "Crop Production",
        "Crop Pests and Diseases",
        "Animal Production",
        "Animal Nutrition",
        "Animal Health",
        "Fisheries",
        "Forestry",
        "Agricultural Economics",
        "Agricultural Extension"
    ],

    "Animal Husbandry": [
        "Introduction to Animal Husbandry",
        "Animal Nutrition",
        "Animal Digestion",
        "Livestock Management",
        "Poultry Production",
        "Cattle Production",
        "Sheep and Goat Production",
        "Pig Production",
        "Rabbit Production",
        "Fish Production",
        "Animal Diseases",
        "Animal Breeding"
    ],

    "Arabic": [
        "Arabic Alphabet",
        "Reading and Comprehension",
        "Arabic Grammar",
        "Vocabulary",
        "Composition",
        "Translation",
        "Literature",
        "Conversation"
    ],

    "Art": [
        "Elements of Art",
        "Principles of Design",
        "Drawing",
        "Painting",
        "Sculpture",
        "Textile Design",
        "Graphic Design",
        "Craft",
        "Art History",
        "Nigerian Art"
    ],

    "Basic Science": [
        "Living and Non-Living Things",
        "Cells",
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
        "Earth and Space"
    ],

    "Biology": [
        "Characteristics of Living Things",
        "Cell Structure",
        "Cell Division",
        "Classification of Living Organisms",
        "Nutrition",
        "Transport in Plants and Animals",
        "Respiration",
        "Excretion",
        "Support and Movement",
        "Coordination",
        "Reproduction",
        "Growth",
        "Genetics",
        "Evolution",
        "Ecology",
        "Adaptation",
        "Microorganisms",
        "Human Health"
    ],

    "Biotechnology": [
        "Introduction to Biotechnology",
        "Cells and Microorganisms",
        "Genetic Engineering",
        "Fermentation",
        "Tissue Culture",
        "Biotechnology in Agriculture",
        "Biotechnology in Medicine",
        "Environmental Biotechnology",
        "Bioethics"
    ],

    "Bookkeeping": [
        "Introduction to Bookkeeping",
        "Accounting Terms",
        "Double Entry",
        "Ledger Accounts",
        "Cash Book",
        "Petty Cash",
        "Trial Balance",
        "Errors and Corrections",
        "Bank Reconciliation",
        "Final Accounts"
    ],

    "Building Construction": [
        "Construction Materials",
        "Building Tools",
        "Building Drawings",
        "Site Preparation",
        "Foundation",
        "Walls",
        "Floors",
        "Roofs",
        "Doors and Windows",
        "Plumbing",
        "Electrical Installation",
        "Building Services",
        "Construction Safety"
    ],

    "Business Studies": [
        "Introduction to Business",
        "Office Practice",
        "Communication",
        "Consumer Education",
        "Trade",
        "Transportation",
        "Banking",
        "Insurance",
        "Entrepreneurship",
        "Business Documents",
        "Marketing",
        "Stock Exchange"
    ],

    "Chemistry": [
        "Matter",
        "Atomic Structure",
        "Periodic Table",
        "Chemical Bonding",
        "Mole Concept",
        "Chemical Formulae",
        "Chemical Equations",
        "Acids Bases and Salts",
        "Redox Reactions",
        "Electrochemistry",
        "Organic Chemistry",
        "Hydrocarbons",
        "Alcohols",
        "Carboxylic Acids",
        "Polymers",
        "Rates of Reaction",
        "Chemical Equilibrium",
        "Energy Changes",
        "Environmental Chemistry"
    ],

    "Christian Religious Studies": [
        "Creation",
        "The Patriarchs",
        "Moses",
        "The Prophets",
        "The Life of Jesus",
        "The Teachings of Jesus",
        "Miracles of Jesus",
        "Parables",
        "Death and Resurrection",
        "The Early Church",
        "Paul",
        "Christian Living",
        "Faith",
        "Love",
        "Justice",
        "Leadership"
    ],

    "Civic Education": [
        "Citizenship",
        "Rights and Duties",
        "Democracy",
        "Rule of Law",
        "Constitution",
        "Human Rights",
        "National Values",
        "Political Participation",
        "Leadership",
        "Government Institutions",
        "Elections",
        "National Integration",
        "Public Service",
        "Corruption"
    ],

    "Commerce": [
        "Introduction to Commerce",
        "Trade",
        "Retail Trade",
        "Wholesale Trade",
        "Home Trade",
        "Foreign Trade",
        "Transportation",
        "Communication",
        "Banking",
        "Insurance",
        "Warehousing",
        "Marketing",
        "Advertising",
        "Business Finance"
    ],

    "Computer Studies": [
        "Computer Fundamentals",
        "Computer Hardware",
        "Computer Software",
        "Data Representation",
        "Operating Systems",
        "Word Processing",
        "Spreadsheets",
        "Database",
        "Computer Networks",
        "Internet",
        "Cybersecurity",
        "Programming",
        "Algorithms",
        "Information Technology"
    ],

    "Cultural and Creative Arts": [
        "Visual Arts",
        "Music",
        "Drama",
        "Dance",
        "Craft",
        "Nigerian Traditional Arts",
        "African Art",
        "Design",
        "Theatre",
        "Cultural Heritage"
    ],

    "Data Processing": [
        "Data and Information",
        "Computer Hardware",
        "Computer Software",
        "Operating Systems",
        "Word Processing",
        "Spreadsheet",
        "Database",
        "Data Communication",
        "Internet",
        "Programming",
        "Information Security"
    ],

    "Design and Technology": [
        "Design Process",
        "Technical Drawing",
        "Materials",
        "Woodwork",
        "Metalwork",
        "Plastics",
        "Tools",
        "Machines",
        "Workshop Safety",
        "Product Design"
    ],

    "Digital Technologies": [
        "Digital Literacy",
        "Computer Systems",
        "Internet Technologies",
        "Digital Communication",
        "Programming",
        "Algorithms",
        "Data",
        "Artificial Intelligence",
        "Cybersecurity",
        "Digital Citizenship",
        "Emerging Technologies"
    ],

    "Economics": [
        "Introduction to Economics",
        "Basic Economic Concepts",
        "Demand",
        "Supply",
        "Price Determination",
        "Elasticity",
        "Production",
        "Factors of Production",
        "Market Structures",
        "National Income",
        "Money",
        "Banking",
        "Inflation",
        "Unemployment",
        "Public Finance",
        "International Trade",
        "Economic Development",
        "Population"
    ],

    "Electrical Installation": [
        "Electrical Safety",
        "Electrical Tools",
        "Electrical Materials",
        "Basic Circuits",
        "Wiring",
        "Domestic Installation",
        "Electrical Measurements",
        "Switches",
        "Sockets",
        "Protection Devices",
        "Earthing"
    ],

    "Electronics": [
        "Electrical Quantities",
        "Semiconductors",
        "Diodes",
        "Transistors",
        "Rectifiers",
        "Amplifiers",
        "Oscillators",
        "Digital Electronics",
        "Logic Gates",
        "Electronic Communication"
    ],

    "English Language": [
        "Comprehension",
        "Summary Writing",
        "Grammar",
        "Vocabulary",
        "Sentence Structure",
        "Parts of Speech",
        "Concord",
        "Tenses",
        "Punctuation",
        "Oral English",
        "Figures of Speech",
        "Essay Writing",
        "Formal Letters",
        "Informal Letters",
        "Reports",
        "Debates"
    ],

    "Financial Accounting": [
        "Accounting Principles",
        "Double Entry",
        "Ledger",
        "Trial Balance",
        "Cash Book",
        "Bank Reconciliation",
        "Control Accounts",
        "Depreciation",
        "Final Accounts",
        "Partnership Accounts",
        "Company Accounts",
        "Manufacturing Accounts"
    ],

    "Food and Nutrition": [
        "Food Groups",
        "Nutrients",
        "Balanced Diet",
        "Meal Planning",
        "Food Preparation",
        "Food Preservation",
        "Food Safety",
        "Kitchen Equipment",
        "Consumer Education",
        "Nutrition and Health"
    ],

    "French": [
        "French Alphabet",
        "Greetings",
        "Vocabulary",
        "Grammar",
        "Pronouns",
        "Verbs",
        "Tenses",
        "Comprehension",
        "Composition",
        "Conversation",
        "Translation"
    ],

    "Further Mathematics": [
        "Algebra",
        "Functions",
        "Quadratic Equations",
        "Sequences and Series",
        "Binomial Theorem",
        "Matrices",
        "Vectors",
        "Coordinate Geometry",
        "Trigonometry",
        "Calculus",
        "Differentiation",
        "Integration",
        "Probability",
        "Statistics",
        "Mechanics"
    ],

    "Geography": [
        "Map Reading",
        "Scale",
        "Map Interpretation",
        "Weather",
        "Climate",
        "Rocks",
        "Weathering",
        "Erosion",
        "Landforms",
        "Population",
        "Settlement",
        "Agriculture",
        "Industry",
        "Transportation",
        "Natural Resources",
        "Environmental Issues",
        "Regional Geography"
    ],

    "Government": [
        "Meaning of Government",
        "Political Concepts",
        "Constitution",
        "Democracy",
        "Rule of Law",
        "Separation of Powers",
        "Political Parties",
        "Elections",
        "Pressure Groups",
        "Public Opinion",
        "Legislature",
        "Executive",
        "Judiciary",
        "Local Government",
        "Federalism",
        "Nigerian Political Development",
        "International Organizations"
    ],

    "Hausa": [
        "Hausa Alphabet",
        "Vocabulary",
        "Grammar",
        "Reading",
        "Comprehension",
        "Composition",
        "Literature",
        "Oral Hausa",
        "Culture"
    ],

    "Health Education": [
        "Personal Health",
        "Community Health",
        "Nutrition",
        "First Aid",
        "Disease Prevention",
        "Environmental Health",
        "Mental Wellbeing",
        "Physical Fitness",
        "Safety Education"
    ],

    "History": [
        "Introduction to History",
        "Pre-colonial Nigeria",
        "Hausa States",
        "Kanem-Bornu",
        "Oyo Empire",
        "Benin Kingdom",
        "Igbo Society",
        "European Contact",
        "Trans-Atlantic Slave Trade",
        "Colonial Rule",
        "Nationalism",
        "Independence",
        "Nigerian Political Development",
        "Military Rule",
        "Civil Rule"
    ],

    "Home Economics": [
        "Family",
        "Home Management",
        "Food and Nutrition",
        "Clothing",
        "Textiles",
        "Child Development",
        "Consumer Education",
        "Household Equipment",
        "Interior Decoration"
    ],

    "Igbo": [
        "Igbo Alphabet",
        "Vocabulary",
        "Grammar",
        "Reading",
        "Comprehension",
        "Composition",
        "Literature",
        "Oral Igbo",
        "Igbo Culture"
    ],

    "Information Technology": [
        "Information Systems",
        "Computer Hardware",
        "Software",
        "Networks",
        "Internet",
        "Databases",
        "Programming",
        "Cybersecurity",
        "Digital Communication",
        "Artificial Intelligence"
    ],

    "Islamic Religious Studies": [
        "Quran",
        "Hadith",
        "Tawhid",
        "Prophets",
        "Prophet Muhammad",
        "Five Pillars",
        "Prayer",
        "Fasting",
        "Zakat",
        "Hajj",
        "Islamic Ethics",
        "Islamic History"
    ],

    "Literature in English": [
        "Prose",
        "Poetry",
        "Drama",
        "Plot",
        "Characterization",
        "Setting",
        "Theme",
        "Narrative Techniques",
        "Figures of Speech",
        "Literary Devices",
        "African Literature",
        "Nigerian Literature"
    ],

    "Mathematics": [
        "Number Bases",
        "Fractions",
        "Decimals",
        "Percentages",
        "Ratio and Proportion",
        "Indices",
        "Logarithms",
        "Surds",
        "Algebra",
        "Linear Equations",
        "Quadratic Equations",
        "Simultaneous Equations",
        "Sequences",
        "Sets",
        "Functions",
        "Variation",
        "Geometry",
        "Mensuration",
        "Trigonometry",
        "Statistics",
        "Probability",
        "Vectors",
        "Matrices"
    ],

    "Marketing": [
        "Introduction to Marketing",
        "Market Research",
        "Consumer Behaviour",
        "Product",
        "Pricing",
        "Promotion",
        "Distribution",
        "Advertising",
        "Sales Promotion",
        "Digital Marketing"
    ],

    "Music": [
        "Elements of Music",
        "Notation",
        "Scales",
        "Intervals",
        "Chords",
        "Rhythm",
        "Melody",
        "Harmony",
        "Musical Instruments",
        "Nigerian Music",
        "African Music"
    ],

    "Office Practice": [
        "Office",
        "Office Equipment",
        "Communication",
        "Filing",
        "Record Keeping",
        "Meetings",
        "Business Correspondence",
        "Mail Services",
        "Reception",
        "Office Safety"
    ],

    "Physical Education": [
        "Physical Fitness",
        "Athletics",
        "Football",
        "Basketball",
        "Volleyball",
        "Handball",
        "Gymnastics",
        "Swimming",
        "First Aid",
        "Sports Injuries",
        "Nutrition",
        "Health"
    ],

    "Physics": [
        "Measurements",
        "Scalars and Vectors",
        "Motion",
        "Forces",
        "Work Energy and Power",
        "Momentum",
        "Simple Machines",
        "Heat",
        "Temperature",
        "Waves",
        "Sound",
        "Light",
        "Electricity",
        "Magnetism",
        "Electromagnetic Induction",
        "Electronics",
        "Atomic Physics",
        "Nuclear Physics"
    ],

    "Technical Drawing": [
        "Drawing Instruments",
        "Geometrical Construction",
        "Orthographic Projection",
        "Isometric Drawing",
        "Perspective",
        "Sectional Views",
        "Development",
        "Machine Drawing",
        "Building Drawing"
    ],

    "Textiles": [
        "Textile Fibres",
        "Yarns",
        "Weaving",
        "Knitting",
        "Dyeing",
        "Printing",
        "Fabric Finishing",
        "Textile Design",
        "Clothing"
    ],

    "Visual Arts": [
        "Drawing",
        "Painting",
        "Sculpture",
        "Printmaking",
        "Textile Art",
        "Graphic Design",
        "Craft",
        "Art Appreciation",
        "Nigerian Art",
        "African Art"
    ],

    "Yoruba": [
        "Yoruba Alphabet",
        "Vocabulary",
        "Grammar",
        "Reading",
        "Comprehension",
        "Composition",
        "Literature",
        "Oral Yoruba",
        "Yoruba Culture"
    ]
};


/* =========================================================
   STATE
========================================================= */

let battleState = {

    mode: "computer",

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
   SAFE ELEMENT
========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   LOCAL STORAGE
========================================================= */

function getBattlesUsed() {

    return Number(
        localStorage.getItem(
            GAME_STORAGE.battlesUsed
        ) || 0
    );
}


function setBattlesUsed(value) {

    localStorage.setItem(
        GAME_STORAGE.battlesUsed,
        String(
            Math.max(0, value)
        )
    );
}


function getBattlePoints() {

    return Number(
        localStorage.getItem(
            GAME_STORAGE.battlePoints
        ) || 0
    );
}


function setBattlePoints(value) {

    localStorage.setItem(
        GAME_STORAGE.battlePoints,
        String(
            Math.max(0, value)
        )
    );
}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateBattleLimitUI();

        loadStudyPlanSubjects();

        setupComputerSubjectListener();

        setupOneVOneSubjectListener();

        updateThemeButton();

        updateLeaderboardUI();

        showComputerSetup();

    }
);


/* =========================================================
   BATTLE LIMIT
========================================================= */

function hasBattleAvailable() {

    return (
        getBattlesUsed() <
        FREE_BATTLE_LIMIT
    );
}


function updateBattleLimitUI() {

    const used =
        getBattlesUsed();

    const remaining =
        Math.max(
            0,
            FREE_BATTLE_LIMIT - used
        );

    if ($("battlesUsed")) {

        $("battlesUsed")
            .textContent = used;
    }

    if ($("battleLimit")) {

        $("battleLimit")
            .textContent =
                FREE_BATTLE_LIMIT;
    }

    if ($("battleStatusText")) {

        $("battleStatusText")
            .textContent =
                remaining > 0
                    ? `${remaining} battle${remaining === 1 ? "" : "s"} remaining`
                    : "No free battles remaining";
    }

    const premiumCard =
        $("premiumBattleCard");

    if (premiumCard) {

        premiumCard.style.display =
            remaining === 0
                ? "flex"
                : "";
    }
}


/* =========================================================
   LOAD SUBJECTS
   STUDY PLAN SUBJECTS + FULL CURRICULUM
========================================================= */

function loadStudyPlanSubjects() {

    const selects = [

        $("battleSubject"),

        $("oneVOneSubject")

    ].filter(Boolean);

    selects.forEach(select => {

        select.innerHTML = "";

        const defaultOption =
            document.createElement("option");

        defaultOption.value = "";

        defaultOption.textContent =
            "Choose a subject";

        select.appendChild(
            defaultOption
        );

        /*
         * Full Nigerian curriculum catalogue.
         */

        const curriculumSubjects =
            Object.keys(
                SUBJECT_DATABASE
            );

        /*
         * Read student's plan.
         */

        let planSubjects = [];

        try {

            const raw =
                localStorage.getItem(
                    "studyMindPlan"
                );

            if (raw) {

                planSubjects =
                    extractSubjectsFromPlan(
                        JSON.parse(raw)
                    );
            }

        } catch (error) {

            console.warn(
                "Could not read study plan:",
                error
            );
        }

        /*
         * Combine plan subjects with
         * curriculum subjects.
         */

        const names =
            new Map();

        planSubjects.forEach(
            subject => {

                if (
                    subject &&
                    subject.name
                ) {

                    const name =
                        normalizeSubjectName(
                            subject.name
                        );

                    if (name) {

                        names.set(
                            name.toLowerCase(),
                            name
                        );
                    }
                }
            }
        );

        curriculumSubjects.forEach(
            subject => {

                names.set(
                    subject.toLowerCase(),
                    subject
                );
            }
        );

        /*
         * Sort A-Z.
         */

        const sortedSubjects =
            [...names.values()]
                .sort(
                    (a, b) =>
                        a.localeCompare(
                            b,
                            undefined,
                            {
                                sensitivity:
                                    "base"
                            }
                        )
                );

        sortedSubjects.forEach(
            subjectName => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    subjectName;

                option.textContent =
                    subjectName;

                select.appendChild(
                    option
                );
            }
        );

    });
}


/* =========================================================
   NORMALIZE SUBJECT NAME
========================================================= */

function normalizeSubjectName(name) {

    if (!name) return "";

    const value =
        String(name)
            .replace(/\s+/g, " ")
            .trim();

    const aliases = {

        "math":
            "Mathematics",

        "maths":
            "Mathematics",

        "english":
            "English Language",

        "computer":
            "Computer Studies",

        "ict":
            "Information Technology",

        "crs":
            "Christian Religious Studies",

        "christian religious knowledge":
            "Christian Religious Studies",

        "irs":
            "Islamic Religious Studies",

        "islamic religious knowledge":
            "Islamic Religious Studies",

        "pe":
            "Physical Education",

        "physical education":
            "Physical Education",

        "further maths":
            "Further Mathematics",

        "agric":
            "Agricultural Science"
    };

    return (
        aliases[
            value.toLowerCase()
        ] ||
        value
    );
}


/* =========================================================
   EXTRACT STUDY PLAN SUBJECTS
========================================================= */

function extractSubjectsFromPlan(plan) {

    const results = [];

    if (!plan) return results;

    if (Array.isArray(plan)) {

        plan.forEach(item => {

            if (
                typeof item ===
                "string"
            ) {

                results.push({

                    name: item,

                    topics: []

                });

            } else if (
                item &&
                typeof item ===
                "object"
            ) {

                const name =
                    item.subject ||
                    item.subjectName ||
                    item.name ||
                    item.title;

                if (name) {

                    results.push({

                        name:
                            String(name),

                        topics:
                            item.topics ||
                            item.topicList ||
                            []
                    });
                }
            }
        });

        return results;
    }

    if (
        typeof plan !== "object"
    ) {
        return results;
    }

    const possibleArrays = [

        plan.subjects,

        plan.subjectList,

        plan.plan,

        plan.schedule,

        plan.studyPlan,

        plan.timetable

    ];

    possibleArrays.forEach(
        value => {

            if (
                Array.isArray(value)
            ) {

                results.push(
                    ...extractSubjectsFromPlan(
                        value
                    )
                );
            }
        }
    );

    if (
        plan.subjects &&
        typeof plan.subjects ===
        "object" &&
        !Array.isArray(
            plan.subjects
        )
    ) {

        Object.entries(
            plan.subjects
        ).forEach(
            ([name, data]) => {

                results.push({

                    name,

                    topics:
                        data?.topics ||
                        data?.topicList ||
                        []
                });

            }
        );
    }

    return results;
}


/* =========================================================
   SUBJECT LISTENERS
========================================================= */

function setupComputerSubjectListener() {

    const subject =
        $("battleSubject");

    if (!subject) return;

    subject.addEventListener(
        "change",
        () => {

            populateTopics(
                subject,
                $("battleTopic")
            );

        }
    );
}


function setupOneVOneSubjectListener() {

    const subject =
        $("oneVOneSubject");

    if (!subject) return;

    subject.addEventListener(
        "change",
        () => {

            populateTopics(
                subject,
                $("oneVOneTopic")
            );

        }
    );
}


/* =========================================================
   POPULATE TOPICS
========================================================= */

function populateTopics(
    subjectSelect,
    topicSelect
) {

    if (!topicSelect) return;

    topicSelect.innerHTML = "";

    const selectedSubject =
        subjectSelect?.value?.trim() ||
        "";

    if (!selectedSubject) {

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

    const normalized =
        normalizeSubjectName(
            selectedSubject
        );

    let topics =
        SUBJECT_DATABASE[
            normalized
        ] || [];

    /*
     * If the exact normalized name isn't
     * found, try a case-insensitive match.
     */

    if (!topics.length) {

        const key =
            Object.keys(
                SUBJECT_DATABASE
            ).find(
                subject =>
                    subject.toLowerCase() ===
                    normalized.toLowerCase()
            );

        if (key) {

            topics =
                SUBJECT_DATABASE[key];
        }
    }

    const defaultOption =
        document.createElement(
            "option"
        );

    defaultOption.value = "";

    defaultOption.textContent =
        topics.length
            ? "Choose a topic"
            : "No topics available";

    topicSelect.appendChild(
        defaultOption
    );

    topics.forEach(topic => {

        const option =
            document.createElement(
                "option"
            );

        option.value = topic;

        option.textContent = topic;

        topicSelect.appendChild(
            option
        );

    });

    topicSelect.disabled =
        topics.length === 0;
}


/* =========================================================
   START COMPUTER MODE
========================================================= */

function startComputerBattle() {

    if (!hasBattleAvailable()) {

        openPremium();

        return;
    }

    battleState.mode =
        "computer";

    showComputerSetup();

    $("battleSetup")
        ?.scrollIntoView({

            behavior: "smooth",

            block: "start"

        });
}


/* =========================================================
   SHOW COMPUTER SETUP
========================================================= */

function showComputerSetup() {

    if ($("battleSetup"))
        $("battleSetup").hidden =
            false;

    if ($("oneVOneSetup"))
        $("oneVOneSetup").hidden =
            true;

    if ($("battleArena"))
        $("battleArena").hidden =
            true;

    if ($("oneVOneArena"))
        $("oneVOneArena").hidden =
            true;

    if ($("battleResults"))
        $("battleResults").hidden =
            true;
}


/* =========================================================
   BEGIN COMPUTER BATTLE
========================================================= */

async function beginBattle() {

    if (!hasBattleAvailable()) {

        openPremium();

        return;
    }

    const subject =
        $("battleSubject")?.value?.trim() ||
        "";

    const topic =
        $("battleTopic")?.value?.trim() ||
        "";

    const difficulty =
        $("battleDifficulty")?.value ||
        "mixed";

    if (!subject) {

        alert(
            "Please choose a subject before starting."
        );

        return;
    }

    if (!topic) {

        alert(
            "Please choose a topic before starting."
        );

        return;
    }

    battleState = {

        mode:
            "computer",

        subject,

        topic,

        difficulty,

        questions: [],

        currentQuestion: 0,

        playerScore: 0,

        opponentScore: 0,

        timer:
            QUESTION_TIME_SECONDS,

        timerInterval:
            null,

        answering:
            false,

        battleActive:
            false
    };

    const button =
        $("startBattleButton");

    if (button) {

        button.disabled =
            true;

        button.textContent =
            "⚔️ Generating Battle...";
    }

    try {

        const questions =
            await generateBattleQuestions(
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
                "The AI did not return 10 valid questions."
            );
        }

        battleState.questions =
            questions.slice(
                0,
                QUESTIONS_PER_BATTLE
            );

        /*
         * Only consume a battle after
         * successful generation.
         */

        setBattlesUsed(
            getBattlesUsed() + 1
        );

        updateBattleLimitUI();

        startComputerArena();

    } catch (error) {

        console.error(
            "Battle generation error:",
            error
        );

        alert(
            "The computer battle could not start.\n\n" +
            error.message
        );

    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "⚔️ Start Battle";
        }
    }
}


/* =========================================================
   GENERATE GAME QUESTIONS
========================================================= */

async function generateBattleQuestions(
    subject,
    topic,
    difficulty
) {

    const prompt = `
Create exactly 10 multiple-choice questions.

Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}

These questions are for StudyMind AI Game Mode.

Follow the Nigerian secondary-school curriculum
appropriate for this subject and topic.

Return ONLY JSON using this structure:

{
  "questions": [
    {
      "question": "Question",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "answer": 0,
      "explanation": "Short explanation"
    }
  ]
}

The answer must be the zero-based option index.
Exactly four options are required for every question.
Exactly ten questions are required.
`;

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
                            prompt,

                        prompt:
                            prompt,

                        subject,

                        topic,

                        difficulty,

                        mode:
                            "game",

                        type:
                            "game_questions",

                        questionCount:
                            QUESTIONS_PER_BATTLE

                    })
            }
        );

    const rawText =
        await response.text();

    console.log(
        "Game Mode API response:",
        rawText
    );

    if (!response.ok) {

        let message =
            rawText;

        try {

            const errorData =
                JSON.parse(
                    rawText
                );

            message =
                errorData.error ||
                errorData.details ||
                errorData.reply ||
                rawText;

        } catch (_) {}

        throw new Error(
            `AI server returned HTTP ${response.status}: ${cleanErrorMessage(message)}`
        );
    }

    if (!rawText.trim()) {

        throw new Error(
            "The AI server returned an empty response."
        );
    }

    let payload =
        safelyParseJSON(
            rawText
        );

    if (!payload) {

        payload =
            extractJSONFromText(
                rawText
            );
    }

    /*
     * The new API returns:
     *
     * {
     *   success: true,
     *   questions: [...]
     * }
     *
     * But we also support older response formats.
     */

    let questions =
        extractQuestionsFromResponse(
            payload
        );

    /*
     * Normalize.
     */

    questions =
        normalizeQuestions(
            questions
        );

    if (
        questions.length >=
        QUESTIONS_PER_BATTLE
    ) {

        return questions.slice(
            0,
            QUESTIONS_PER_BATTLE
        );
    }

    throw new Error(
        `The AI server returned data, but only ${questions.length} usable questions were found instead of 10.`
    );
}


/* =========================================================
   SAFE JSON
========================================================= */

function safelyParseJSON(text) {

    if (!text) return null;

    try {

        return JSON.parse(
            text
        );

    } catch (_) {

        return null;
    }
}


/* =========================================================
   EXTRACT JSON
========================================================= */

function extractJSONFromText(text) {

    if (!text) return null;

    let cleaned =
        String(text)
            .trim()
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

    const direct =
        safelyParseJSON(
            cleaned
        );

    if (direct) return direct;

    const objectStart =
        cleaned.indexOf("{");

    const objectEnd =
        cleaned.lastIndexOf("}");

    if (
        objectStart !== -1 &&
        objectEnd > objectStart
    ) {

        const object =
            safelyParseJSON(
                cleaned.slice(
                    objectStart,
                    objectEnd + 1
                )
            );

        if (object) return object;
    }

    const arrayStart =
        cleaned.indexOf("[");

    const arrayEnd =
        cleaned.lastIndexOf("]");

    if (
        arrayStart !== -1 &&
        arrayEnd > arrayStart
    ) {

        return safelyParseJSON(
            cleaned.slice(
                arrayStart,
                arrayEnd + 1
            )
        );
    }

    return null;
}


/* =========================================================
   EXTRACT QUESTIONS
========================================================= */

function extractQuestionsFromResponse(
    payload
) {

    if (!payload) return [];

    /*
     * Direct array.
     */

    if (
        Array.isArray(payload)
    ) {

        return payload;
    }

    /*
     * New API format.
     */

    if (
        Array.isArray(
            payload.questions
        )
    ) {

        return payload.questions;
    }

    /*
     * Older API wrappers.
     */

    if (
        payload.data &&
        Array.isArray(
            payload.data.questions
        )
    ) {

        return payload.data.questions;
    }

    if (
        payload.result &&
        Array.isArray(
            payload.result.questions
        )
    ) {

        return payload.result.questions;
    }

    /*
     * IMPORTANT:
     * Your old /api/ask-ai endpoint returns:
     *
     * { reply: "..." }
     *
     * Support that too.
     */

    if (
        typeof payload.reply ===
        "string"
    ) {

        const nested =
            extractJSONFromText(
                payload.reply
            );

        return extractQuestionsFromResponse(
            nested
        );
    }

    /*
     * OpenAI-style response.
     */

    if (
        Array.isArray(
            payload.choices
        )
    ) {

        const content =
            payload.choices[0]
                ?.message
                ?.content;

        if (
            typeof content ===
            "string"
        ) {

            const nested =
                extractJSONFromText(
                    content
                );

            return extractQuestionsFromResponse(
                nested
            );
        }
    }

    /*
     * Other text wrappers.
     */

    const text =
        payload.text ||
        payload.content ||
        payload.output;

    if (
        typeof text ===
        "string"
    ) {

        const nested =
            extractJSONFromText(
                text
            );

        return extractQuestionsFromResponse(
            nested
        );
    }

    return [];
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

    return questions
        .map(question => {

            if (
                !question ||
                typeof question !==
                "object"
            ) {

                return null;
            }

            const questionText =
                question.question ||
                question.questionText ||
                question.text;

            let options =
                question.options ||
                question.choices ||
                question.answers;

            if (
                !Array.isArray(options)
            ) {

                return null;
            }

            options =
                options
                    .map(option => {

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
                                option.answer ||
                                ""
                            ).trim();
                        }

                        return "";

                    })
                    .filter(Boolean);

            if (
                !questionText ||
                options.length !== 4
            ) {

                return null;
            }

            let answer =
                question.answer ??
                question.correctAnswer ??
                question.correct ??
                question.answerIndex;

            /*
             * A/B/C/D support.
             */

            if (
                typeof answer ===
                "string"
            ) {

                const trimmed =
                    answer.trim();

                const upper =
                    trimmed.toUpperCase();

                if (
                    ["A", "B", "C", "D"]
                        .includes(upper)
                ) {

                    answer =
                        ["A", "B", "C", "D"]
                            .indexOf(upper);

                } else if (
                    !Number.isNaN(
                        Number(trimmed)
                    )
                ) {

                    answer =
                        Number(trimmed);

                    /*
                     * Convert 1-4 answers.
                     */

                    if (
                        answer >= 1 &&
                        answer <= 4
                    ) {

                        answer -= 1;
                    }
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

            return {

                question:
                    String(
                        questionText
                    ).trim(),

                options,

                answer,

                explanation:
                    typeof question.explanation ===
                    "string"
                        ? question.explanation.trim()
                        : ""

            };

        })
        .filter(Boolean);
}


/* =========================================================
   START ARENA
========================================================= */

function startComputerArena() {

    if ($("battleSetup"))
        $("battleSetup").hidden =
            true;

    if ($("oneVOneSetup"))
        $("oneVOneSetup").hidden =
            true;

    if ($("oneVOneArena"))
        $("oneVOneArena").hidden =
            true;

    if ($("battleResults"))
        $("battleResults").hidden =
            true;

    if ($("battleArena"))
        $("battleArena").hidden =
            false;

    battleState.battleActive =
        true;

    battleState.currentQuestion =
        0;

    battleState.playerScore =
        0;

    battleState.opponentScore =
        0;

    updateComputerScores();

    showComputerQuestion();
}


/* =========================================================
   SHOW QUESTION
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

    const number =
        battleState.currentQuestion + 1;

    if ($("currentQuestionNumber")) {

        $("currentQuestionNumber")
            .textContent =
                number;
    }

    if ($("battleQuestionTopic")) {

        $("battleQuestionTopic")
            .textContent =
                battleState.topic;
    }

    if ($("battleQuestion")) {

        $("battleQuestion")
            .textContent =
                question.question;
    }

    const grid =
        $("answerGrid");

    if (!grid) return;

    grid.innerHTML = "";

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
                () =>
                    answerComputerQuestion(
                        index
                    )
            );

            grid.appendChild(
                button
            );
        }
    );

    startBattleTimer();
}


/* =========================================================
   TIMER
========================================================= */

function startBattleTimer() {

    stopBattleTimer();

    battleState.timer =
        QUESTION_TIME_SECONDS;

    updateBattleTimer();

    battleState.timerInterval =
        setInterval(
            () => {

                battleState.timer--;

                updateBattleTimer();

                if (
                    battleState.timer <=
                    0
                ) {

                    stopBattleTimer();

                    handleComputerTimeout();
                }

            },
            1000
        );
}


function stopBattleTimer() {

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


function updateBattleTimer() {

    if ($("battleTimer")) {

        $("battleTimer")
            .textContent =
                Math.max(
                    0,
                    battleState.timer
                );
    }
}


/* =========================================================
   ANSWER
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

    if (!question) return;

    const buttons =
        document.querySelectorAll(
            "#answerGrid .answer-button"
        );

    buttons.forEach(
        (button, index) => {

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

        if (
            Math.random() < 0.65
        ) {

            battleState.opponentScore +=
                10;
        }
    }

    updateComputerScores();

    setTimeout(
        () => {

            battleState.currentQuestion++;

            showComputerQuestion();

        },
        900
    );
}


/* =========================================================
   TIMEOUT
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
        document.querySelectorAll(
            "#answerGrid .answer-button"
        );

    buttons.forEach(
        (button, index) => {

            button.disabled =
                true;

            if (
                question &&
                index ===
                question.answer
            ) {

                button.classList.add(
                    "correct"
                );
            }
        }
    );

    battleState.opponentScore +=
        10;

    updateComputerScores();

    setTimeout(
        () => {

            battleState.currentQuestion++;

            showComputerQuestion();

        },
        900
    );
}


/* =========================================================
   SCORE
========================================================= */

function updateComputerScores() {

    if ($("playerScore")) {

        $("playerScore")
            .textContent =
                battleState.playerScore;
    }

    if ($("computerScore")) {

        $("computerScore")
            .textContent =
                battleState.opponentScore;
    }
}


/* =========================================================
   FINISH
========================================================= */

function finishComputerBattle() {

    stopBattleTimer();

    battleState.battleActive =
        false;

    if ($("battleArena"))
        $("battleArena").hidden =
            true;

    if ($("battleResults"))
        $("battleResults").hidden =
            false;

    const player =
        battleState.playerScore;

    const computer =
        battleState.opponentScore;

    let points = 0;

    let title =
        "Battle Complete";

    let message = "";

    if (player > computer) {

        title =
            "🏆 Victory!";

        message =
            "Excellent work! You defeated the computer.";

        points =
            player + 25;

    } else if (
        player < computer
    ) {

        title =
            "Keep Studying!";

        message =
            "The computer won this round. Review the topic and try again.";

        points =
            player;

    } else {

        title =
            "🤝 Draw!";

        message =
            "You and the computer finished with the same score.";

        points =
            player + 10;
    }

    setBattlePoints(
        getBattlePoints() +
        points
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
                computer;
    }

    if ($("pointsEarned")) {

        $("pointsEarned")
            .textContent =
                `+${points}`;
    }

    if ($("finalOpponentLabel")) {

        $("finalOpponentLabel")
            .textContent =
                "COMPUTER";
    }

    updateLeaderboardUI();
}


/* =========================================================
   RESET
========================================================= */

function resetBattle() {

    stopBattleTimer();

    battleState.battleActive =
        false;

    if ($("battleArena"))
        $("battleArena").hidden =
            true;

    if ($("battleResults"))
        $("battleResults").hidden =
            true;

    showComputerSetup();

    updateBattleLimitUI();

    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });
}


/* =========================================================
   1V1
========================================================= */

function startOneVOneMode() {

    battleState.mode =
        "1v1";

    if ($("battleSetup"))
        $("battleSetup").hidden =
            true;

    if ($("oneVOneSetup"))
        $("oneVOneSetup").hidden =
            false;

    if ($("battleArena"))
        $("battleArena").hidden =
            true;

    if ($("oneVOneArena"))
        $("oneVOneArena").hidden =
            true;

    if ($("battleResults"))
        $("battleResults").hidden =
            true;

    $("oneVOneSetup")
        ?.scrollIntoView({

            behavior:
                "smooth",

            block:
                "start"

        });
}


/* =========================================================
   FIND OPPONENT
========================================================= */

function findOneVOneOpponent() {

    if (!hasBattleAvailable()) {

        openPremium();

        return;
    }

    const subject =
        $("oneVOneSubject")?.value;

    const topic =
        $("oneVOneTopic")?.value;

    if (!subject || !topic) {

        alert(
            "Please choose a subject and topic."
        );

        return;
    }

    if ($("matchmakingStatus"))
        $("matchmakingStatus").hidden =
            false;

    if ($("findOpponentButton"))
        $("findOpponentButton").disabled =
            true;

    if ($("matchmakingTitle")) {

        $("matchmakingTitle")
            .textContent =
                "Looking for an opponent...";
    }

    if ($("matchmakingMessage")) {

        $("matchmakingMessage")
            .textContent =
                "StudyMind is searching for another student.";
    }
}


/* =========================================================
   CANCEL MATCHMAKING
========================================================= */

function cancelOneVOne() {

    if ($("matchmakingStatus"))
        $("matchmakingStatus").hidden =
            true;

    if ($("findOpponentButton")) {

        $("findOpponentButton").disabled =
            !(
                $("oneVOneSubject")
                    ?.value &&
                $("oneVOneTopic")
                    ?.value
            );
    }
}


/* =========================================================
   1V1 ARENA
========================================================= */

function startOneVOneArena() {

    if ($("oneVOneSetup"))
        $("oneVOneSetup").hidden =
            true;

    if ($("oneVOneArena"))
        $("oneVOneArena").hidden =
            false;
}


/* =========================================================
   LEADERBOARD
========================================================= */

function updateLeaderboardUI() {

    const points =
        getBattlePoints();

    if ($("yourBattlePoints")) {

        $("yourBattlePoints")
            .textContent =
                points;
    }

    const rows =
        $("leaderboardRows");

    if (!rows) return;

    rows.innerHTML = `

        <div class="leaderboard-row">

            <span>1</span>

            <span>You</span>

            <strong>
                ${points}
            </strong>

        </div>

    `;

    if ($("yourLeaderboardRank")) {

        $("yourLeaderboardRank")
            .querySelector("span")
            ?.replaceChildren(
                document.createTextNode(
                    "1"
                )
            );
    }
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
   PREMIUM
========================================================= */

function openPremium() {

    alert(
        "Premium will give you unlimited Game Mode battles."
    );
}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutStudyMind() {

    try {

        if (
            typeof supabase !==
                "undefined" &&
            supabase.auth
        ) {

            await supabase.auth.signOut();
        }

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


function updateThemeButton() {

    const button =
        $("themeButton");

    if (!button) return;

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
   LOAD SAVED THEME
========================================================= */

(function loadSavedTheme() {

    try {

        const saved =
            localStorage.getItem(
                GAME_STORAGE.theme
            );

        if (saved === "light") {

            document.body.classList.add(
                "light-mode"
            );
        }

    } catch (_) {}

})();


/* =========================================================
   ERROR CLEANER
========================================================= */

function cleanErrorMessage(
    message
) {

    if (!message) {

        return "Unknown server error.";
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
        text.length > 500
    ) {

        text =
            text.slice(0, 500) +
            "...";
    }

    return text;
}


/* =========================================================
   GLOBAL EXPORTS
========================================================= */

window.startComputerBattle =
    startComputerBattle;

window.beginBattle =
    beginBattle;

window.startOneVOneMode =
    startOneVOneMode;

window.findOneVOneOpponent =
    findOneVOneOpponent;

window.cancelOneVOne =
    cancelOneVOne;

window.startOneVOneArena =
    startOneVOneArena;

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

window.populateTopics =
    populateTopics;

