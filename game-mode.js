/* =========================================================
   STUDYMIND AI — GAME MODE
   FULL REPLACEMENT
   Nigerian Secondary Curriculum + AI Battle System
========================================================= */

"use strict";

/* =========================================================
   CONFIGURATION
========================================================= */

const FREE_BATTLE_LIMIT = 5;
const QUESTIONS_PER_BATTLE = 10;
const QUESTION_TIME_SECONDS = 15;

const GAME_STORAGE = {
    battlesUsed: "studyMindGameBattlesUsed",
    battlePoints: "studyMindBattlePoints",
    theme: "studyMindTheme"
};

/* =========================================================
   NIGERIAN SECONDARY SCHOOL CURRICULUM
========================================================= */

const SUBJECT_DATABASE = {

    "Agricultural Science": [
        "Introduction to Agriculture",
        "Farm Tools and Machinery",
        "Soil Science",
        "Soil Fertility",
        "Crop Production",
        "Crop Improvement",
        "Plant Nutrition",
        "Pests and Diseases",
        "Animal Nutrition",
        "Animal Production",
        "Livestock Management",
        "Fishery",
        "Forestry",
        "Farm Management",
        "Agricultural Economics",
        "Agricultural Extension",
        "Farm Records",
        "Agricultural Marketing"
    ],

    "Animal Husbandry": [
        "Introduction to Animal Husbandry",
        "Animal Nutrition",
        "Digestive System",
        "Animal Health",
        "Animal Diseases",
        "Livestock Management",
        "Poultry Production",
        "Pig Production",
        "Cattle Production",
        "Sheep and Goat Production",
        "Rabbit Production",
        "Fish Production",
        "Animal Breeding"
    ],

    "Arabic": [
        "Arabic Alphabet",
        "Reading and Comprehension",
        "Arabic Grammar",
        "Arabic Vocabulary",
        "Translation",
        "Arabic Literature",
        "Composition"
    ],

    "Basic Science": [
        "Living and Non-Living Things",
        "Cells",
        "Human Body",
        "Nutrition",
        "Health and Disease",
        "Matter",
        "Energy",
        "Force",
        "Light",
        "Sound",
        "Electricity",
        "Magnetism",
        "Environment",
        "Earth and Space"
    ],

    "Basic Technology": [
        "Introduction to Technology",
        "Safety",
        "Materials",
        "Tools",
        "Workshop Practice",
        "Woodwork",
        "Metalwork",
        "Building Technology",
        "Electrical Technology",
        "Electronics",
        "Mechanics",
        "Technology and Society"
    ],

    "Biology": [
        "Characteristics of Living Things",
        "Cell Structure and Organisation",
        "Cell Division",
        "Nutrition",
        "Transport System",
        "Respiration",
        "Excretion",
        "Coordination and Control",
        "Reproduction",
        "Growth",
        "Genetics",
        "Evolution",
        "Ecology",
        "Adaptation",
        "Classification",
        "Microorganisms",
        "Human Health",
        "Plant Biology"
    ],

    "Business Studies": [
        "Introduction to Business",
        "Office Practice",
        "Bookkeeping",
        "Commerce",
        "Business Documents",
        "Communication",
        "Banking",
        "Insurance",
        "Entrepreneurship",
        "Consumer Education"
    ],

    "Chemistry": [
        "Introduction to Chemistry",
        "Atomic Structure",
        "Periodic Table",
        "Chemical Bonding",
        "Mole Concept",
        "Chemical Formulae",
        "Chemical Equations",
        "Acids Bases and Salts",
        "Oxidation and Reduction",
        "Electrochemistry",
        "Organic Chemistry",
        "Hydrocarbons",
        "Metals",
        "Non-Metals",
        "Rates of Reaction",
        "Chemical Equilibrium",
        "Energy Changes",
        "Environmental Chemistry"
    ],

    "Christian Religious Studies": [
        "Creation",
        "The Fall of Man",
        "The Call of Abraham",
        "Moses and the Exodus",
        "The Ten Commandments",
        "The Prophets",
        "The Life of Jesus",
        "The Teachings of Jesus",
        "Miracles of Jesus",
        "Death and Resurrection",
        "The Early Church",
        "Christian Living",
        "Faith and Works",
        "Love and Forgiveness",
        "Leadership and Service"
    ],

    "Civic Education": [
        "Citizenship",
        "Human Rights",
        "Duties and Responsibilities",
        "Democracy",
        "Rule of Law",
        "Constitution",
        "Political Participation",
        "National Values",
        "Leadership",
        "Good Governance",
        "Corruption",
        "National Integration",
        "Peace and Conflict Resolution",
        "Democratic Institutions"
    ],

    "Commerce": [
        "Introduction to Commerce",
        "Trade",
        "Retail Trade",
        "Wholesale Trade",
        "Home Trade",
        "Foreign Trade",
        "Business Units",
        "Banking",
        "Insurance",
        "Transportation",
        "Warehousing",
        "Communication",
        "Advertising",
        "Capital",
        "Stock Exchange"
    ],

    "Computer Studies": [
        "Introduction to Computers",
        "Computer Hardware",
        "Computer Software",
        "Input and Output Devices",
        "Data Representation",
        "Computer Memory",
        "Operating Systems",
        "Word Processing",
        "Spreadsheets",
        "Databases",
        "Computer Networks",
        "Internet",
        "Cybersecurity",
        "Programming",
        "Algorithms",
        "Information Technology"
    ],

    "Data Processing": [
        "Introduction to Data Processing",
        "Data and Information",
        "Computer Hardware",
        "Computer Software",
        "Data Representation",
        "Database Systems",
        "Spreadsheets",
        "Word Processing",
        "Networking",
        "Internet",
        "Information Systems",
        "Programming",
        "Data Security"
    ],

    "Economics": [
        "Introduction to Economics",
        "Basic Economic Concepts",
        "Demand",
        "Supply",
        "Price Determination",
        "Production",
        "Factors of Production",
        "Market Structures",
        "Population",
        "Labour Market",
        "Money",
        "Banking",
        "Inflation",
        "National Income",
        "Economic Growth",
        "Economic Development",
        "Public Finance",
        "International Trade",
        "Balance of Payments",
        "Nigerian Economy"
    ],

    "English Language": [
        "Parts of Speech",
        "Sentence Structure",
        "Tenses",
        "Concord",
        "Vocabulary Development",
        "Comprehension",
        "Summary Writing",
        "Essay Writing",
        "Letter Writing",
        "Report Writing",
        "Speech Writing",
        "Argumentative Writing",
        "Narrative Writing",
        "Descriptive Writing",
        "Oral English",
        "Figures of Speech",
        "Lexis and Structure"
    ],

    "Financial Accounting": [
        "Introduction to Accounting",
        "Accounting Concepts",
        "Source Documents",
        "Books of Original Entry",
        "Ledger Accounts",
        "Trial Balance",
        "Bank Reconciliation",
        "Depreciation",
        "Control Accounts",
        "Final Accounts",
        "Partnership Accounts",
        "Company Accounts",
        "Manufacturing Accounts",
        "Incomplete Records",
        "Accounting Ratios"
    ],

    "Food and Nutrition": [
        "Food Nutrients",
        "Balanced Diet",
        "Meal Planning",
        "Food Preparation",
        "Food Preservation",
        "Kitchen Safety",
        "Food Hygiene",
        "Digestion",
        "Special Diets",
        "Consumer Education"
    ],

    "French": [
        "French Alphabet",
        "Greetings",
        "Numbers",
        "Family",
        "School",
        "Food",
        "Daily Activities",
        "Grammar",
        "Tenses",
        "Vocabulary",
        "Reading Comprehension",
        "Writing",
        "Conversation"
    ],

    "Further Mathematics": [
        "Algebra",
        "Quadratic Equations",
        "Sequences and Series",
        "Binomial Expansion",
        "Matrices",
        "Vectors",
        "Coordinate Geometry",
        "Calculus",
        "Differentiation",
        "Integration",
        "Trigonometry",
        "Complex Numbers",
        "Probability",
        "Statistics",
        "Mechanics"
    ],

    "Geography": [
        "Map Reading",
        "Scale and Distance",
        "Latitude and Longitude",
        "Physical Geography",
        "Weather and Climate",
        "Rocks",
        "Relief",
        "Drainage",
        "Vegetation",
        "Population",
        "Settlement",
        "Agriculture",
        "Industry",
        "Transportation",
        "Environmental Resources",
        "Regional Geography",
        "Nigeria's Geography"
    ],

    "Government": [
        "Introduction to Government",
        "Political Concepts",
        "Constitution",
        "Democracy",
        "Political Parties",
        "Electoral Systems",
        "Pressure Groups",
        "Public Opinion",
        "Legislature",
        "Executive",
        "Judiciary",
        "Federalism",
        "Local Government",
        "Citizenship",
        "Human Rights",
        "International Organisations",
        "Nigerian Political Development"
    ],

    "Health Education": [
        "Personal Health",
        "Nutrition",
        "Physical Fitness",
        "First Aid",
        "Communicable Diseases",
        "Non-Communicable Diseases",
        "Mental and Social Health",
        "Environmental Health",
        "Safety Education",
        "Drug Education"
    ],

    "History": [
        "Introduction to History",
        "Pre-Colonial Nigeria",
        "Hausa States",
        "Yoruba States",
        "Igbo Society",
        "Kanem-Bornu",
        "European Contact",
        "Trans-Saharan Trade",
        "Slave Trade",
        "Colonial Rule",
        "Amalgamation",
        "Nationalist Movements",
        "Independence",
        "Nigerian Civil War",
        "Post-Independence Nigeria",
        "African History"
    ],

    "Home Economics": [
        "Family and Home",
        "Food and Nutrition",
        "Clothing",
        "Textiles",
        "Child Development",
        "Consumer Education",
        "Home Management",
        "Household Resources",
        "Interior Decoration",
        "Family Health"
    ],

    "Information Technology": [
        "Information Systems",
        "Computer Hardware",
        "Computer Software",
        "Operating Systems",
        "Networking",
        "Internet",
        "Cybersecurity",
        "Database Systems",
        "Programming",
        "Algorithms",
        "Digital Communication",
        "Information Management"
    ],

    "Islamic Religious Studies": [
        "The Qur'an",
        "Hadith",
        "Tawhid",
        "Salah",
        "Zakat",
        "Sawm",
        "Hajj",
        "Islamic Morality",
        "Islamic Law",
        "Life of Prophet Muhammad",
        "Early Muslim Community",
        "Islamic History"
    ],

    "Literature in English": [
        "Introduction to Literature",
        "Prose",
        "Poetry",
        "Drama",
        "Literary Devices",
        "Figures of Speech",
        "Characterisation",
        "Themes",
        "Plot",
        "Setting",
        "African Literature",
        "Nigerian Literature"
    ],

    "Marketing": [
        "Introduction to Marketing",
        "Marketing Concepts",
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
        "Inequalities",
        "Sequences",
        "Variation",
        "Sets",
        "Geometry",
        "Mensuration",
        "Trigonometry",
        "Coordinate Geometry",
        "Statistics",
        "Probability",
        "Matrices",
        "Vectors",
        "Financial Mathematics"
    ],

    "Music": [
        "Elements of Music",
        "Musical Notation",
        "Scales",
        "Intervals",
        "Chords",
        "Rhythm",
        "Harmony",
        "Melody",
        "Musical Instruments",
        "African Music",
        "Nigerian Music",
        "Music History"
    ],

    "Physical Education": [
        "Physical Fitness",
        "Athletics",
        "Football",
        "Basketball",
        "Volleyball",
        "Handball",
        "Swimming",
        "Gymnastics",
        "Health and Fitness",
        "Sports Injuries",
        "Rules of Games"
    ],

    "Physics": [
        "Measurement",
        "Motion",
        "Scalars and Vectors",
        "Force",
        "Work Energy and Power",
        "Machines",
        "Pressure",
        "Heat",
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
        "Radioactivity",
        "Electronics"
    ],

    "Technical Drawing": [
        "Drawing Instruments",
        "Geometrical Construction",
        "Orthographic Projection",
        "Isometric Drawing",
        "Perspective Drawing",
        "Sectional Views",
        "Scale Drawing",
        "Engineering Curves",
        "Building Drawing",
        "Mechanical Drawing"
    ],

    "Visual Arts": [
        "Introduction to Art",
        "Elements of Art",
        "Principles of Design",
        "Drawing",
        "Painting",
        "Sculpture",
        "Textiles",
        "Graphics",
        "Ceramics",
        "Photography",
        "African Art",
        "Nigerian Art"
    ],

    "Yoruba": [
        "Yoruba Grammar",
        "Yoruba Vocabulary",
        "Comprehension",
        "Essay Writing",
        "Oral Literature",
        "Written Literature",
        "Yoruba Culture",
        "Yoruba History"
    ],

    "Igbo": [
        "Igbo Grammar",
        "Igbo Vocabulary",
        "Comprehension",
        "Essay Writing",
        "Oral Literature",
        "Written Literature",
        "Igbo Culture",
        "Igbo History"
    ],

    "Hausa": [
        "Hausa Grammar",
        "Hausa Vocabulary",
        "Comprehension",
        "Essay Writing",
        "Oral Literature",
        "Written Literature",
        "Hausa Culture",
        "Hausa History"
    ]
};

/* =========================================================
   BATTLE STATE
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
   SAFE ELEMENT HELPER
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
        String(Math.max(0, value))
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
        String(Math.max(0, value))
    );
}

/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        updateBattleLimitUI();

        loadStudyPlanSubjects();

        setupComputerSubjectListener();

        setupOneVOneSubjectListener();

        updateThemeButton();

        showComputerSetup();

        updateLeaderboardUI();
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
        $("battlesUsed").textContent =
            used;
    }

    if ($("battleLimit")) {
        $("battleLimit").textContent =
            FREE_BATTLE_LIMIT;
    }

    if ($("battleStatusText")) {
        $("battleStatusText").textContent =
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
   NORMALIZE SUBJECT NAME
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

    const aliases = {

        "math": "Mathematics",
        "maths": "Mathematics",
        "mathematics": "Mathematics",

        "english": "English Language",
        "english language": "English Language",

        "chem": "Chemistry",
        "chem": "Chemistry",
        "chemistry": "Chemistry",

        "further maths": "Further Mathematics",
        "further math": "Further Mathematics",
        "further mathematics": "Further Mathematics",

        "agric": "Agricultural Science",
        "agric science": "Agricultural Science",
        "agricultural science": "Agricultural Science",

        "crs": "Christian Religious Studies",
        "christian religious studies":
            "Christian Religious Studies",

        "irs": "Islamic Religious Studies",
        "islamic religious studies":
            "Islamic Religious Studies",

        "computer": "Computer Studies",
        "computer studies": "Computer Studies",
        "computer science": "Computer Studies",

        "data processing": "Data Processing",

        "ict": "Information Technology",
        "information technology":
            "Information Technology",

        "lit": "Literature in English",
        "literature": "Literature in English",
        "literature in english":
            "Literature in English",

        "pe": "Physical Education",
        "physical education":
            "Physical Education",

        "civic": "Civic Education",
        "civic education":
            "Civic Education",

        "financial accounting":
            "Financial Accounting",

        "visual art": "Visual Arts",
        "visual arts": "Visual Arts",

        "technical drawing":
            "Technical Drawing",

        "home economics":
            "Home Economics"
    };

    return (
        aliases[cleaned] ||
        Object.keys(SUBJECT_DATABASE).find(
            subject =>
                subject.toLowerCase() ===
                cleaned
        ) ||
        String(name).trim()
    );
}

/* =========================================================
   LOAD ALL SUBJECTS
========================================================= */

function loadStudyPlanSubjects() {

    const subjectSelects = [
        $("battleSubject"),
        $("oneVOneSubject")
    ].filter(Boolean);

    if (!subjectSelects.length) {
        return;
    }

    /*
     * Always start with every subject in the
     * Nigerian secondary curriculum database.
     */

    const curriculumSubjects =
        Object.keys(
            SUBJECT_DATABASE
        );

    /*
     * Add subjects found in the student's
     * personal StudyMind plan.
     */

    let planSubjects = [];

    try {

        const rawPlan =
            localStorage.getItem(
                "studyMindPlan"
            );

        if (rawPlan) {

            const plan =
                JSON.parse(rawPlan);

            planSubjects =
                extractSubjectsFromPlan(plan);
        }

    } catch (error) {

        console.warn(
            "Could not read study plan:",
            error
        );
    }

    /*
     * Combine everything.
     */

    const allSubjects = [
        ...curriculumSubjects,
        ...planSubjects.map(
            subject =>
                subject.name
        )
    ];

    /*
     * Normalize and remove duplicates.
     */

    const uniqueMap =
        new Map();

    allSubjects.forEach(
        name => {

            if (!name) {
                return;
            }

            const normalized =
                normalizeSubjectName(
                    name
                );

            if (!normalized) {
                return;
            }

            uniqueMap.set(
                normalized.toLowerCase(),
                normalized
            );
        }
    );

    const uniqueSubjects =
        Array.from(
            uniqueMap.values()
        );

    /*
     * Alphabetical order.
     */

    uniqueSubjects.sort(
        (a, b) =>
            a.localeCompare(b)
    );

    /*
     * Populate BOTH dropdowns.
     */

    subjectSelects.forEach(
        select => {

            const previousValue =
                select.value;

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

            uniqueSubjects.forEach(
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

            /*
             * Restore an existing selection
             * if one was already present.
             */

            if (
                previousValue &&
                uniqueSubjects.includes(
                    normalizeSubjectName(
                        previousValue
                    )
                )
            ) {

                select.value =
                    normalizeSubjectName(
                        previousValue
                    );
            }
        }
    );

    console.log(
        "StudyMind Game Mode subjects loaded:",
        uniqueSubjects
    );
}

/* =========================================================
   EXTRACT SUBJECTS FROM STUDY PLAN
========================================================= */

function extractSubjectsFromPlan(plan) {

    const results = [];

    if (!plan) {
        return results;
    }

    if (Array.isArray(plan)) {

        plan.forEach(
            item => {

                if (
                    typeof item ===
                    "string"
                ) {

                    results.push({
                        name: item,
                        topics: []
                    });

                    return;
                }

                if (
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
                                item.contents ||
                                []
                        });
                    }
                }
            }
        );

        return results;
    }

    if (
        typeof plan !==
        "object"
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
        array => {

            if (
                Array.isArray(array)
            ) {

                results.push(
                    ...extractSubjectsFromPlan(
                        array
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
                        data?.contents ||
                        []
                });
            }
        );
    }

    return results;
}

/* =========================================================
   COMPUTER SUBJECT LISTENER
========================================================= */

function setupComputerSubjectListener() {

    const subject =
        $("battleSubject");

    if (!subject) {
        return;
    }

    subject.addEventListener(
        "change",
        function () {

            populateTopicSelect(
                "battleSubject",
                "battleTopic",
                "startBattleButton"
            );
        }
    );
}

/* =========================================================
   1V1 SUBJECT LISTENER
========================================================= */

function setupOneVOneSubjectListener() {

    const subject =
        $("oneVOneSubject");

    if (!subject) {
        return;
    }

    subject.addEventListener(
        "change",
        function () {

            populateTopicSelect(
                "oneVOneSubject",
                "oneVOneTopic",
                "findOpponentButton"
            );
        }
    );
}

/* =========================================================
   POPULATE TOPICS
========================================================= */

function populateTopicSelect(
    subjectId,
    topicId,
    buttonId
) {

    const subjectSelect =
        $(subjectId);

    const topicSelect =
        $(topicId);

    if (!topicSelect) {
        return;
    }

    topicSelect.innerHTML = "";

    const selectedSubject =
        subjectSelect?.value?.trim() || "";

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

        if ($(buttonId)) {
            $(buttonId).disabled =
                true;
        }

        return;
    }

    const normalizedSubject =
        normalizeSubjectName(
            selectedSubject
        );

    /*
     * Curriculum topics.
     */

    let topics =
        SUBJECT_DATABASE[
            normalizedSubject
        ] || [];

    /*
     * Personal study-plan topics.
     */

    const personalTopics =
        getTopicsFromStudyPlan(
            normalizedSubject
        );

    topics = [
        ...topics,
        ...personalTopics
    ];

    /*
     * Remove duplicates.
     */

    topics = [
        ...new Set(
            topics
                .map(
                    topic =>
                        String(topic)
                            .trim()
                )
                .filter(Boolean)
        )
    ];

    /*
     * Topic dropdown default.
     */

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

    /*
     * Add topics.
     */

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

    if ($(buttonId)) {
        $(buttonId).disabled =
            topics.length === 0;
    }
}

/* =========================================================
   GET TOPICS FROM STUDY PLAN
========================================================= */

function getTopicsFromStudyPlan(
    subjectName
) {

    const topics = [];

    try {

        const raw =
            localStorage.getItem(
                "studyMindPlan"
            );

        if (!raw) {
            return topics;
        }

        const plan =
            JSON.parse(raw);

        findTopicsForSubject(
            plan,
            subjectName,
            topics
        );

    } catch (error) {

        console.warn(
            "Could not read study-plan topics:",
            error
        );
    }

    return [
        ...new Set(
            topics
                .map(
                    topic =>
                        String(topic)
                            .trim()
                )
                .filter(Boolean)
        )
    ];
}

/* =========================================================
   FIND TOPICS
========================================================= */

function findTopicsForSubject(
    value,
    subjectName,
    output
) {

    if (!value) {
        return;
    }

    const target =
        normalizeSubjectName(
            subjectName
        ).toLowerCase();

    if (Array.isArray(value)) {

        value.forEach(
            item => {

                if (
                    item &&
                    typeof item ===
                    "object"
                ) {

                    const name =
                        item.subject ||
                        item.subjectName ||
                        item.subject_name ||
                        item.name ||
                        item.title;

                    if (
                        name &&
                        normalizeSubjectName(
                            name
                        ).toLowerCase() ===
                        target
                    ) {

                        addTopics(
                            item.topics ||
                            item.topicList ||
                            item.contents,
                            output
                        );
                    }

                    findTopicsForSubject(
                        item,
                        subjectName,
                        output
                    );
                }
            }
        );

        return;
    }

    if (
        typeof value !==
        "object"
    ) {

        return;
    }

    const name =
        value.subject ||
        value.subjectName ||
        value.subject_name;

    if (
        name &&
        normalizeSubjectName(
            name
        ).toLowerCase() ===
        target
    ) {

        addTopics(
            value.topics ||
            value.topicList ||
            value.contents,
            output
        );
    }

    Object.values(value).forEach(
        child => {

            if (
                child &&
                typeof child ===
                "object"
            ) {

                findTopicsForSubject(
                    child,
                    subjectName,
                    output
                );
            }
        }
    );
}

/* =========================================================
   ADD TOPICS
========================================================= */

function addTopics(
    value,
    output
) {

    if (!value) {
        return;
    }

    if (Array.isArray(value)) {

        value.forEach(
            item => {

                if (
                    typeof item ===
                    "string"
                ) {

                    output.push(
                        item
                    );

                    return;
                }

                if (
                    item &&
                    typeof item ===
                    "object"
                ) {

                    const name =
                        item.topic ||
                        item.topicName ||
                        item.name ||
                        item.title;

                    if (name) {

                        output.push(
                            String(name)
                        );
                    }
                }
            }
        );

        return;
    }

    if (
        typeof value ===
        "string"
    ) {

        output.push(value);
    }
}

/* =========================================================
   START COMPUTER BATTLE
========================================================= */

function startComputerBattle() {

    if (!hasBattleAvailable()) {

        openPremium();

        return;
    }

    battleState.mode =
        "computer";

    showComputerSetup();

    const setup =
        $("battleSetup");

    if (setup) {

        setup.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}

/* =========================================================
   SHOW COMPUTER SETUP
========================================================= */

function showComputerSetup() {

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
        setup.hidden = false;
    }

    if (oneVOneSetup) {
        oneVOneSetup.hidden = true;
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
        normalizeSubjectName(
            $("battleSubject")?.value?.trim() ||
            ""
        );

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

        mode: "computer",

        subject,

        topic,

        difficulty,

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

    const button =
        $("startBattleButton");

    if (button) {

        button.disabled = true;

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
                "The AI did not return enough valid questions."
            );
        }

        battleState.questions =
            questions.slice(
                0,
                QUESTIONS_PER_BATTLE
            );

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

            button.disabled = false;

            button.textContent =
                "⚔️ Start Battle";
        }
    }
}

/* =========================================================
   AI QUESTION GENERATION
========================================================= */

async function generateBattleQuestions(
    subject,
    topic,
    difficulty
) {

    const prompt = `
You are generating questions for StudyMind AI Game Mode.

Create exactly ${QUESTIONS_PER_BATTLE}
multiple-choice questions for a Nigerian secondary-school student.

SUBJECT:
${subject}

TOPIC:
${topic}

DIFFICULTY:
${difficulty}

The questions MUST be specifically about the selected subject
and selected topic.

Return ONLY valid JSON.

Use exactly this structure:

{
  "questions": [
    {
      "question": "Question text",
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

RULES:

1. Exactly 10 questions.

2. Exactly 4 options for every question.

3. "answer" must be a zero-based number from 0 to 3.

4. Every question must have exactly one correct answer.

5. Questions must be academically accurate.

6. Questions must match the selected topic.

7. Do not change the subject.

8. Do not change the topic.

9. Do not mix subjects.

10. Do not mix unrelated topics.

11. No markdown.

12. No code fences.

13. No text outside the JSON.

14. Questions must be appropriate for Nigerian secondary-school students.

15. Where appropriate, use WAEC/NECO-style question conventions.

16. For Mathematics, Physics, Chemistry and calculation-based subjects,
use correct formulas, calculations and units.

17. For English Language, Literature, Government, Economics, Biology,
Geography, History, Civic Education, CRS, IRS and other subjects,
make the questions specifically relevant to the selected topic.

18. Avoid duplicate questions.

19. Make distractors plausible.

20. Keep explanations short.

Return ONLY the JSON object.
`;

    const endpoints = [
        "/api/ask-ai",
        "/api/chat"
    ];

    let lastError =
        "The AI server did not return a usable response.";

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

                        body: JSON.stringify({

                            message: prompt,

                            prompt,

                            subject,

                            topic,

                            difficulty,

                            mode: "game",

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
                `AI response from ${endpoint}:`,
                rawText
            );

            if (!response.ok) {

                let serverMessage =
                    rawText;

                try {

                    const errorJson =
                        JSON.parse(
                            rawText
                        );

                    serverMessage =
                        extractServerError(
                            errorJson
                        ) ||
                        rawText;

                } catch (_) {}

                lastError =
                    `${endpoint} returned HTTP ${response.status}: ` +
                    cleanErrorMessage(
                        serverMessage
                    );

                continue;
            }

            if (!rawText.trim()) {

                lastError =
                    `${endpoint} returned an empty response.`;

                continue;
            }

            let payload =
                safelyParseJSON(
                    rawText
                );

            /*
             * If the endpoint returned JSON containing
             * a reply string, inspect that reply too.
             */

            if (
                payload &&
                typeof payload.reply ===
                "string"
            ) {

                const nested =
                    extractJSONFromText(
                        payload.reply
                    );

                if (nested) {
                    payload = nested;
                }
            }

            if (!payload) {

                payload =
                    extractJSONFromText(
                        rawText
                    );
            }

            const questions =
                extractQuestionsFromResponse(
                    payload
                );

            const normalized =
                normalizeQuestions(
                    questions
                );

            if (
                normalized.length >=
                QUESTIONS_PER_BATTLE
            ) {

                return normalized.slice(
                    0,
                    QUESTIONS_PER_BATTLE
                );
            }

            lastError =
                `${endpoint} returned data, but it did not contain ` +
                `${QUESTIONS_PER_BATTLE} usable questions.`;

        } catch (error) {

            console.error(
                `${endpoint} request failed:`,
                error
            );

            lastError =
                `${endpoint} request failed: ` +
                error.message;
        }
    }

    throw new Error(
        "AI server error.\n\n" +
        lastError
    );
}

/* =========================================================
   SAFE JSON PARSER
========================================================= */

function safelyParseJSON(text) {

    if (!text) {
        return null;
    }

    try {

        return JSON.parse(
            text
        );

    } catch (_) {

        return null;
    }
}

/* =========================================================
   EXTRACT JSON FROM TEXT
========================================================= */

function extractJSONFromText(text) {

    if (!text) {
        return null;
    }

    let cleaned =
        String(text).trim();

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

    const direct =
        safelyParseJSON(
            cleaned
        );

    if (direct) {
        return direct;
    }

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

        if (object) {
            return object;
        }
    }

    const arrayStart =
        cleaned.indexOf("[");

    const arrayEnd =
        cleaned.lastIndexOf("]");

    if (
        arrayStart !== -1 &&
        arrayEnd > arrayStart
    ) {

        const array =
            safelyParseJSON(
                cleaned.slice(
                    arrayStart,
                    arrayEnd + 1
                )
            );

        if (array) {
            return array;
        }
    }

    return null;
}

/* =========================================================
   EXTRACT SERVER ERROR
========================================================= */

function extractServerError(data) {

    if (!data) {
        return "";
    }

    if (
        typeof data ===
        "string"
    ) {

        return data;
    }

    return (
        data.error?.message ||
        data.error ||
        data.message ||
        data.details ||
        data.statusText ||
        ""
    );
}

/* =========================================================
   EXTRACT QUESTIONS
========================================================= */

function extractQuestionsFromResponse(
    payload
) {

    if (!payload) {
        return [];
    }

    if (
        Array.isArray(payload)
    ) {

        return payload;
    }

    if (
        Array.isArray(
            payload.questions
        )
    ) {

        return payload.questions;
    }

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

    if (
        Array.isArray(
            payload.choices
        )
    ) {

        const content =
            payload
                .choices[0]
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

    const text =
        payload.text ||
        payload.content ||
        payload.output ||
        payload.reply;

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
        .map(
            question => {

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
                    !Array.isArray(
                        options
                    )
                ) {

                    return null;
                }

                options =
                    options
                        .map(
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

                                    return (
                                        option.text ||
                                        option.label ||
                                        option.answer ||
                                        ""
                                    ).trim();
                                }

                                return "";
                            }
                        )
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

                if (
                    typeof answer ===
                    "string"
                ) {

                    const trimmed =
                        answer.trim();

                    const letter =
                        trimmed
                            .toUpperCase()
                            .replace(
                                /[.)]/g,
                                ""
                            );

                    if (
                        ["A", "B", "C", "D"]
                            .includes(
                                letter
                            )
                    ) {

                        answer =
                            ["A", "B", "C", "D"]
                                .indexOf(
                                    letter
                                );

                    } else if (
                        !Number.isNaN(
                            Number(trimmed)
                        )
                    ) {

                        answer =
                            Number(trimmed);

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
                    !Number.isInteger(
                        answer
                    ) ||
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
            }
        )
        .filter(Boolean);
}

/* =========================================================
   START COMPUTER ARENA
========================================================= */

function startComputerArena() {

    const setup =
        $("battleSetup");

    const arena =
        $("battleArena");

    const oneVOneSetup =
        $("oneVOneSetup");

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

    if (oneVOneArena) {
        oneVOneArena.hidden = true;
    }

    if (results) {
        results.hidden = true;
    }

    if (arena) {
        arena.hidden = false;
    }

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

    const number =
        battleState.currentQuestion +
        1;

    if (
        $("currentQuestionNumber")
    ) {

        $("currentQuestionNumber")
            .textContent =
            number;
    }

    if (
        $("battleQuestionTopic")
    ) {

        $("battleQuestionTopic")
            .textContent =
            battleState.topic;
    }

    if (
        $("battleQuestion")
    ) {

        $("battleQuestion")
            .textContent =
            question.question;
    }

    const answerGrid =
        $("answerGrid");

    if (!answerGrid) {
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
                "answer-button";

            button.textContent =
                option;

            button.addEventListener(
                "click",
                function () {

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
            function () {

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
   ANSWER QUESTION
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
        document.querySelectorAll(
            "#answerGrid .answer-button"
        );

    buttons.forEach(
        function (
            button,
            index
        ) {

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
                index !==
                question.answer
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
            Math.random() <
            0.65
        ) {

            battleState.opponentScore +=
                10;
        }
    }

    updateComputerScores();

    setTimeout(
        function () {

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
        function (
            button,
            index
        ) {

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
        function () {

            battleState.currentQuestion++;

            showComputerQuestion();

        },
        900
    );
}

/* =========================================================
   UPDATE SCORES
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
   FINISH BATTLE
========================================================= */

function finishComputerBattle() {

    stopBattleTimer();

    battleState.battleActive =
        false;

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

    const player =
        battleState.playerScore;

    const computer =
        battleState.opponentScore;

    let points = 0;

    let title =
        "Battle Complete";

    let message =
        "";

    if (
        player >
        computer
    ) {

        title =
            "🏆 Victory!";

        message =
            "Excellent work! You defeated the computer.";

        points =
            player + 25;

    } else if (
        player <
        computer
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
   RESET BATTLE
========================================================= */

function resetBattle() {

    stopBattleTimer();

    battleState.battleActive =
        false;

    const arena =
        $("battleArena");

    const results =
        $("battleResults");

    if (arena) {
        arena.hidden = true;
    }

    if (results) {
        results.hidden = true;
    }

    showComputerSetup();

    updateBattleLimitUI();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   1V1 MODE — COMPLETE MATCHMAKING SYSTEM
========================================================= */

/*
 * 1V1 state
 */

let oneVOneMatchId = null;
let oneVOnePlayerNumber = null;
let oneVOneMyName = "Player";
let oneVOnePolling = null;
let oneVOneMatchmakingStartedAt = 0;
let oneVOneActive = false;
let oneVOneResultsRecorded = false;
let oneVOneAnsweredQuestions = new Set();

const MATCHMAKING_INTERVAL = 2500;
const MATCH_TIMEOUT = 120000;

/* =========================================================
   SUPABASE HELPER
========================================================= */

function getSupabase() {

    /*
     * Your project may expose Supabase in different ways.
     */

    if (
        typeof window.supabaseClient !==
        "undefined"
    ) {
        return window.supabaseClient;
    }

    if (
        typeof window.supabase !==
        "undefined" &&
        window.supabase &&
        typeof window.supabase.from ===
        "function"
    ) {
        return window.supabase;
    }

    if (
        typeof supabase !==
        "undefined" &&
        supabase &&
        typeof supabase.from ===
        "function"
    ) {
        return supabase;
    }

    throw new Error(
        "Supabase is not connected on the Game Mode page."
    );
}

/* =========================================================
   ELEMENT HELPER
========================================================= */

function getElement(id) {

    return document.getElementById(id);
}

/* =========================================================
   CURRENT USER
========================================================= */

async function getCurrentUser() {

    const client =
        getSupabase();

    const {
        data,
        error
    } =
        await client.auth.getUser();

    if (error) {
        throw error;
    }

    if (!data?.user) {

        throw new Error(
            "You must be logged in before playing 1v1."
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
        metadata.full_name ||
        metadata.name ||
        metadata.display_name ||
        metadata.username ||
        user.email?.split("@")[0] ||
        "Player"
    );
}

/* =========================================================
   PREMIUM CHECK
========================================================= */

function isPremiumUser() {

    /*
     * Keep this compatible with the current free version.
     *
     * If you later add a real subscription field,
     * this can be changed to read it from Supabase.
     */

    const premium =
        localStorage.getItem(
            "studyMindPremium"
        );

    return (
        premium === "true" ||
        premium === "1"
    );
}

/* =========================================================
   BATTLE COUNT
========================================================= */

function getBattleCount() {

    return getBattlesUsed();
}

/* =========================================================
   MATCHMAKING UI
========================================================= */

function showMatchmaking() {

    const status =
        getElement(
            "matchmakingStatus"
        );

    const button =
        getElement(
            "findOpponentButton"
        );

    if (status) {
        status.hidden = false;
    }

    if (button) {

        button.disabled = true;

        button.dataset.originalText =
            button.textContent;

        button.textContent =
            "🔎 Searching...";
    }

    updateMatchmakingText(
        "Looking for an opponent...",
        "StudyMind is searching for another student with the same subject, topic and difficulty."
    );
}

/* =========================================================
   UPDATE MATCHMAKING TEXT
========================================================= */

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

/* =========================================================
   HIDE MATCHMAKING
========================================================= */

function hideMatchmaking() {

    const status =
        getElement(
            "matchmakingStatus"
        );

    const button =
        getElement(
            "findOpponentButton"
        );

    if (status) {
        status.hidden = true;
    }

    if (button) {

        button.disabled =
            !(
                getElement(
                    "oneVOneSubject"
                )?.value &&
                getElement(
                    "oneVOneTopic"
                )?.value
            );

        button.textContent =
            "⚔️ Find Opponent";
    }
}

/* =========================================================
   NORMALIZE MATCH ID
========================================================= */

function normalizeMatchId(
    value
) {

    if (!value) {
        return null;
    }

    /*
     * RPC can return:
     *
     * UUID
     * object
     * array containing UUID
     * object containing match_id/id
     */

    if (
        typeof value ===
        "string"
    ) {
        return value;
    }

    if (
        Array.isArray(value)
    ) {

        if (!value.length) {
            return null;
        }

        return normalizeMatchId(
            value[0]
        );
    }

    if (
        typeof value ===
        "object"
    ) {

        return (
            value.match_id ||
            value.matchId ||
            value.id ||
            value.game_match_id ||
            null
        );
    }

    return null;
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

    if (oneVOneSetup) {

        oneVOneSetup.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}

/* =========================================================
   FIND 1V1 OPPONENT
========================================================= */

async function findOneVOneOpponent() {

    /*
     * Do not start another search if one is already active.
     */

    if (
        oneVOneMatchId ||
        oneVOnePolling
    ) {

        return;
    }

    /*
     * FREE LIMIT
     */

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
            "oneVOneSubject"
        )?.value?.trim() || "";

    const topic =
        getElement(
            "oneVOneTopic"
        )?.value?.trim() || "";

    const difficulty =
        getElement(
            "oneVOneDifficulty"
        )?.value ||
        "mixed";

    if (!subject || !topic) {

        alert(
            "Choose a subject and topic first."
        );

        return;
    }

    let user;
    let client;

    try {

        user =
            await getCurrentUser();

        client =
            getSupabase();

    } catch (error) {

        console.error(
            "1v1 authentication error:",
            error
        );

        alert(
            error?.message ||
            "Please log in before playing 1v1."
        );

        return;
    }

    oneVOneMyName =
        getDisplayName(
            user
        );

    showMatchmaking();

    oneVOneMatchmakingStartedAt =
        Date.now();

    oneVOneActive =
        false;

    oneVOneResultsRecorded =
        false;

    oneVOneAnsweredQuestions =
        new Set();

    /*
     * =====================================================
     * FIND WAITING MATCH
     * =====================================================
     */

    async function findWaitingMatch() {

        const {
            data,
            error
        } =
            await client
                .from(
                    "game_matches"
                )
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
                        ascending:
                            true
                    }
                )
                .limit(1);

        if (error) {
            throw error;
        }

        return data?.[0] || null;
    }

    try {

        /*
         * =================================================
         * STEP 1
         * LOOK FOR AN EXISTING PLAYER
         * =================================================
         */

        const existingMatch =
            await findWaitingMatch();

        if (existingMatch) {

            console.log(
                "Found waiting opponent:",
                existingMatch
            );

            await joinExistingMatch(
                existingMatch
            );

            return;
        }

        /*
         * =================================================
         * STEP 2
         * CREATE OUR WAITING MATCH
         * =================================================
         */

        updateMatchmakingText(
            "Creating battle room...",
            "StudyMind is preparing your 1v1 room."
        );

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

        console.log(
            "create_game_match response:",
            createdMatch
        );

        oneVOneMatchId =
            normalizeMatchId(
                createdMatch
            );

        if (
            !oneVOneMatchId
        ) {

            throw new Error(
                "The battle room was created, but Supabase did not return a match ID."
            );
        }

        oneVOnePlayerNumber =
            1;

        console.log(
            "Created 1v1 match:",
            oneVOneMatchId
        );

        /*
         * =================================================
         * STEP 3
         * SUBSCRIBE TO OUR MATCH
         * =================================================
         */

        await subscribeToOneVOne(
            oneVOneMatchId
        );

        updateMatchmakingText(
            "Looking for an opponent...",
            "Your battle room is ready. Waiting for another student."
        );

        /*
         * =================================================
         * STEP 4
         * START POLLING
         * =================================================
         */

        startOneVOnePolling(
            client,
            user,
            subject,
            topic,
            difficulty
        );

    } catch (error) {

        console.error(
            "1v1 matchmaking error:",
            error
        );

        await cleanupOneVOneConnection();

        oneVOneMatchId =
            null;

        oneVOnePlayerNumber =
            null;

        oneVOnePolling =
            null;

        oneVOneActive =
            false;

        hideMatchmaking();

        alert(
            error?.message ||
            "Could not start 1v1 matchmaking."
        );
    }
}

/* =========================================================
   START POLLING
========================================================= */

function startOneVOnePolling(
    client,
    user,
    subject,
    topic,
    difficulty
) {

    clearOneVOnePolling();

    oneVOnePolling =
        setInterval(
            async function () {

                if (
                    !oneVOneMatchId ||
                    oneVOneActive
                ) {

                    return;
                }

                /*
                 * TIMEOUT
                 */

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

                    /*
                     * =========================================
                     * CHECK OUR OWN MATCH
                     * =========================================
                     */

                    const {
                        data: ownMatch,
                        error: ownMatchError
                    } =
                        await client
                            .from(
                                "game_matches"
                            )
                            .select("*")
                            .eq(
                                "id",
                                oneVOneMatchId
                            )
                            .maybeSingle();

                    if (ownMatchError) {

                        console.warn(
                            "Could not check own match:",
                            ownMatchError
                        );

                    } else if (
                        ownMatch
                    ) {

                        console.log(
                            "Current match:",
                            ownMatch
                        );

                        /*
                         * If the database has changed the match
                         * to active, somebody joined us.
                         */

                        if (
                            ownMatch.status ===
                            "active"
                        ) {

                            clearOneVOnePolling();

                            await activateOneVOneMatch(
                                ownMatch
                            );

                            return;
                        }

                        /*
                         * If match has finished/cancelled,
                         * stop polling.
                         */

                        if (
                            ownMatch.status ===
                            "cancelled" ||
                            ownMatch.status ===
                            "completed"
                        ) {

                            clearOneVOnePolling();

                            return;
                        }
                    }

                    /*
                     * =========================================
                     * CHECK PLAYERS
                     * =========================================
                     */

                    await checkMatchPlayers();

                    if (
                        oneVOneActive
                    ) {

                        clearOneVOnePolling();

                        return;
                    }

                    /*
                     * =========================================
                     * LOOK FOR ANOTHER WAITING ROOM
                     * =========================================
                     */

                    const {
                        data: otherMatches,
                        error: otherError
                    } =
                        await client
                            .from(
                                "game_matches"
                            )
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
                                    ascending:
                                        true
                                }
                            )
                            .limit(1);

                    if (otherError) {

                        console.warn(
                            "Could not search other rooms:",
                            otherError
                        );

                        return;
                    }

                    const otherMatch =
                        otherMatches?.[0];

                    if (!otherMatch) {

                        return;
                    }

                    /*
                     * Never join our own room.
                     */

                    if (
                        String(
                            otherMatch.id
                        ) ===
                        String(
                            oneVOneMatchId
                        )
                    ) {

                        return;
                    }

                    /*
                     * =========================================
                     * JOIN OTHER ROOM
                     * =========================================
                     */

                    console.log(
                        "Found another waiting room:",
                        otherMatch.id
                    );

                    clearOneVOnePolling();

                    await cleanupOneVOneConnection();

                    oneVOneMatchId =
                        null;

                    oneVOnePlayerNumber =
                        null;

                    try {

                        await joinExistingMatch(
                            otherMatch
                        );

                    } catch (joinError) {

                        console.warn(
                            "Opponent room was already taken:",
                            joinError
                        );

                        oneVOneMatchId =
                            null;

                        oneVOnePlayerNumber =
                            null;

                        /*
                         * Start searching again.
                         */

                        setTimeout(
                            function () {

                                findOneVOneOpponent();

                            },
                            500
                        );
                    }

                } catch (error) {

                    console.error(
                        "1v1 polling error:",
                        error
                    );
                }

            },
            MATCHMAKING_INTERVAL
        );
}

/* =========================================================
   CLEAR POLLING
========================================================= */

function clearOneVOnePolling() {

    if (
        oneVOnePolling
    ) {

        clearInterval(
            oneVOnePolling
        );

        oneVOnePolling =
            null;
    }
}

/* =========================================================
   JOIN EXISTING MATCH
========================================================= */

async function joinExistingMatch(
    match
) {

    if (!match?.id) {

        throw new Error(
            "Invalid battle room."
        );
    }

    const client =
        getSupabase();

    const user =
        await getCurrentUser();

    updateMatchmakingText(
        "Opponent found! ⚔️",
        "Joining the battle room..."
    );

    /*
     * Use the database RPC so that two players cannot
     * accidentally become Player 2 at the same time.
     */

    const {
        data,
        error
    } =
        await client.rpc(
            "join_game_match",
            {
                p_match_id:
                    match.id,

                p_display_name:
                    oneVOneMyName ||
                    getDisplayName(user)
            }
        );

    if (error) {

        throw error;
    }

    console.log(
        "join_game_match response:",
        data
    );

    oneVOneMatchId =
        normalizeMatchId(
            data
        ) ||
        match.id;

    oneVOnePlayerNumber =
        2;

    oneVOneResultsRecorded =
        false;

    oneVOneAnsweredQuestions =
        new Set();

    await subscribeToOneVOne(
        oneVOneMatchId
    );

    /*
     * Get the latest match state.
     */

    const {
        data: updatedMatch,
        error: matchError
    } =
        await client
            .from(
                "game_matches"
            )
            .select("*")
            .eq(
                "id",
                oneVOneMatchId
            )
            .maybeSingle();

    if (matchError) {

        console.warn(
            "Could not load joined match:",
            matchError
        );
    }

    if (
        updatedMatch &&
        updatedMatch.status ===
        "active"
    ) {

        await activateOneVOneMatch(
            updatedMatch
        );

        return;
    }

    /*
     * Give the first player time to update the match.
     */

    updateMatchmakingText(
        "Opponent found! ⚔️",
        "Both players are connected. Starting the battle..."
    );

    /*
     * Poll briefly for active state.
     */

    waitForActiveOneVOneMatch();
}

/* =========================================================
   WAIT FOR ACTIVE MATCH
========================================================= */

function waitForActiveOneVOneMatch() {

    clearOneVOnePolling();

    const started =
        Date.now();

    oneVOnePolling =
        setInterval(
            async function () {

                if (
                    oneVOneActive
                ) {

                    clearOneVOnePolling();

                    return;
                }

                if (
                    !oneVOneMatchId
                ) {

                    clearOneVOnePolling();

                    return;
                }

                if (
                    Date.now() -
                    started >
                    30000
                ) {

                    clearOneVOnePolling();

                    updateMatchmakingText(
                        "Waiting for battle to start...",
                        "The opponent is connected. StudyMind is preparing the match."
                    );

                    return;
                }

                try {

                    const client =
                        getSupabase();

                    const {
                        data,
                        error
                    } =
                        await client
                            .from(
                                "game_matches"
                            )
                            .select("*")
                            .eq(
                                "id",
                                oneVOneMatchId
                            )
                            .maybeSingle();

                    if (error) {

                        return;
                    }

                    if (
                        data?.status ===
                        "active"
                    ) {

                        clearOneVOnePolling();

                        await activateOneVOneMatch(
                            data
                        );
                    }

                } catch (error) {

                    console.warn(
                        "Waiting for active match failed:",
                        error
                    );
                }

            },
            1000
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

    /*
     * First check the match itself.
     */

    const {
        data: match,
        error: matchError
    } =
        await client
            .from(
                "game_matches"
            )
            .select("*")
            .eq(
                "id",
                oneVOneMatchId
            )
            .maybeSingle();

    if (matchError) {

        console.warn(
            "Match check error:",
            matchError
        );

        return;
    }

    if (!match) {
        return;
    }

    if (
        match.status ===
        "active"
    ) {

        await activateOneVOneMatch(
            match
        );

        return;
    }

    /*
     * Also inspect game_match_players.
     */

    const {
        data: players,
        error: playersError
    } =
        await client
            .from(
                "game_match_players"
            )
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

    if (playersError) {

        /*
         * Do not crash matchmaking if RLS temporarily prevents
         * reading the player rows. The match status remains the
         * primary source of truth.
         */

        console.warn(
            "Could not read match players:",
            playersError
        );

        return;
    }

    console.log(
        "Match players:",
        players
    );

    if (
        players &&
        players.length >= 2
    ) {

        await activateOneVOneMatch(
            match
        );
    }
}

/* =========================================================
   ACTIVATE 1V1 MATCH
========================================================= */

async function activateOneVOneMatch(
    match
) {

    if (
        oneVOneActive
    ) {

        return;
    }

    oneVOneActive =
        true;

    clearOneVOnePolling();

    updateMatchmakingText(
        "Battle starting! ⚔️",
        "Your opponent has joined. Get ready!"
    );

    /*
     * Give realtime/database updates a moment to settle.
     */

    setTimeout(
        function () {

            startOneVOneArena();

            loadOneVOneBattle(
                match
            );

        },
        700
    );
}

/* =========================================================
   LOAD 1V1 BATTLE
========================================================= */

async function loadOneVOneBattle(
    match
) {

    console.log(
        "Starting 1v1 battle:",
        match
    );

    /*
     * IMPORTANT:
     *
     * The match needs questions.
     *
     * Player 1 generates the questions.
     * Player 2 receives the same questions from the database.
     */

    try {

        if (
            oneVOnePlayerNumber ===
            1
        ) {

            updateMatchmakingText(
                "Preparing questions...",
                "StudyMind is generating the battle questions."
            );

            const questions =
                await generateBattleQuestions(
                    match.subject,
                    match.topic,
                    match.difficulty
                );

            battleState.mode =
                "1v1";

            battleState.subject =
                match.subject;

            battleState.topic =
                match.topic;

            battleState.difficulty =
                match.difficulty;

            battleState.questions =
                questions;

            battleState.currentQuestion =
                0;

            battleState.playerScore =
                0;

            battleState.opponentScore =
                0;

            battleState.battleActive =
                true;

            /*
             * Store questions in the match.
             */

            const client =
                getSupabase();

            const {
                error
            } =
                await client
                    .from(
                        "game_matches"
                    )
                    .update({
                        questions:
                            questions,

                        status:
                            "active"
                    })
                    .eq(
                        "id",
                        oneVOneMatchId
                    );

            if (error) {

                console.warn(
                    "Could not save questions to match:",
                    error
                );
            }

            showOneVOneQuestion();

        } else {

            /*
             * Player 2 waits for Player 1's questions.
             */

            await waitForOneVOneQuestions();

        }

    } catch (error) {

        console.error(
            "Could not start 1v1 battle:",
            error
        );

        alert(
            error?.message ||
            "Could not start the 1v1 battle."
        );
    }
}

/* =========================================================
   PLAYER 2 — WAIT FOR QUESTIONS
========================================================= */

function waitForOneVOneQuestions() {

    clearOneVOnePolling();

    const started =
        Date.now();

    updateMatchmakingText(
        "Battle ready! ⚔️",
        "Waiting for the questions to load..."
    );

    oneVOnePolling =
        setInterval(
            async function () {

                if (
                    !oneVOneMatchId
                ) {

                    clearOneVOnePolling();

                    return;
                }

                if (
                    Date.now() -
                    started >
                    30000
                ) {

                    clearOneVOnePolling();

                    console.warn(
                        "Timed out waiting for questions."
                    );

                    return;
                }

                try {

                    const client =
                        getSupabase();

                    const {
                        data,
                        error
                    } =
                        await client
                            .from(
                                "game_matches"
                            )
                            .select("*")
                            .eq(
                                "id",
                                oneVOneMatchId
                            )
                            .maybeSingle();

                    if (error) {
                        return;
                    }

                    if (
                        Array.isArray(
                            data?.questions
                        ) &&
                        data.questions.length >=
                        QUESTIONS_PER_BATTLE
                    ) {

                        clearOneVOnePolling();

                        battleState.mode =
                            "1v1";

                        battleState.subject =
                            data.subject;

                        battleState.topic =
                            data.topic;

                        battleState.difficulty =
                            data.difficulty;

                        battleState.questions =
                            normalizeQuestions(
                                data.questions
                            );

                        battleState.currentQuestion =
                            0;

                        battleState.playerScore =
                            0;

                        battleState.opponentScore =
                            0;

                        battleState.battleActive =
                            true;

                        showOneVOneQuestion();
                    }

                } catch (error) {

                    console.warn(
                        "Question polling error:",
                        error
                    );
                }

            },
            1000
        );
}

/* =========================================================
   SHOW 1V1 QUESTION
========================================================= */

function showOneVOneQuestion() {

    if (
        !battleState.battleActive
    ) {

        return;
    }

    const question =
        battleState.questions[
            battleState.currentQuestion
        ];

    if (!question) {

        finishOneVOneBattle();

        return;
    }

    const number =
        battleState.currentQuestion +
        1;

    if (
        $("oneVOneQuestionNumber")
    ) {

        $("oneVOneQuestionNumber")
            .textContent =
            number;
    }

    if (
        $("oneVOneQuestion")
    ) {

        $("oneVOneQuestion")
            .textContent =
            question.question;
    }

    if (
        $("oneVOneTopicDisplay")
    ) {

        $("oneVOneTopicDisplay")
            .textContent =
            battleState.topic;
    }

    const answerGrid =
        $("oneVOneAnswerGrid");

    if (!answerGrid) {

        console.warn(
            "oneVOneAnswerGrid element not found."
        );

        return;
    }

    answerGrid.innerHTML =
        "";

    question.options.forEach(
        function (
            option,
            index
        ) {

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
                function () {

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
}

/* =========================================================
   ANSWER 1V1 QUESTION
========================================================= */

async function answerOneVOneQuestion(
    selectedIndex
) {

    const questionIndex =
        battleState.currentQuestion;

    if (
        oneVOneAnsweredQuestions.has(
            questionIndex
        )
    ) {

        return;
    }

    oneVOneAnsweredQuestions.add(
        questionIndex
    );

    const question =
        battleState.questions[
            questionIndex
        ];

    if (!question) {
        return;
    }

    const buttons =
        document.querySelectorAll(
            "#oneVOneAnswerGrid .answer-button"
        );

    buttons.forEach(
        function (
            button,
            index
        ) {

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
                index !==
                question.answer
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
    }

    updateOneVOneScores();

    /*
     * Save answer to the database.
     */

    try {

        const client =
            getSupabase();

        await client.rpc(
            "submit_game_answer",
            {
                p_match_id:
                    oneVOneMatchId,

                p_question_index:
                    questionIndex,

                p_answer_index:
                    selectedIndex,

                p_player_number:
                    oneVOnePlayerNumber,

                p_is_correct:
                    selectedIndex ===
                    question.answer
            }
        );

    } catch (error) {

        /*
         * If this RPC is not yet present, the local battle
         * still continues. The error is logged so it is easy
         * to identify the database function later.
         */

        console.warn(
            "Could not submit 1v1 answer to Supabase:",
            error
        );
    }

    setTimeout(
        function () {

            battleState.currentQuestion++;

            showOneVOneQuestion();

        },
        700
    );
}

/* =========================================================
   UPDATE 1V1 SCORES
========================================================= */

function updateOneVOneScores() {

    if (
        $("oneVOnePlayerScore")
    ) {

        $("oneVOnePlayerScore")
            .textContent =
            battleState.playerScore;
    }

    if (
        $("oneVOneOpponentScore")
    ) {

        $("oneVOneOpponentScore")
            .textContent =
            battleState.opponentScore;
    }

    /*
     * Also support alternative IDs if your HTML uses them.
     */

    if (
        $("oneVOneScore")
    ) {

        $("oneVOneScore")
            .textContent =
            battleState.playerScore;
    }

    if (
        $("oneVOneOpponent")
    ) {

        $("oneVOneOpponent")
            .textContent =
            battleState.opponentScore;
    }
}

/* =========================================================
   FINISH 1V1
========================================================= */

async function finishOneVOneBattle() {

    if (
        oneVOneResultsRecorded
    ) {

        return;
    }

    oneVOneResultsRecorded =
        true;

    battleState.battleActive =
        false;

    clearOneVOnePolling();

    let points = 0;

    let title =
        "Battle Complete";

    let message =
        "";

    const player =
        battleState.playerScore;

    const opponent =
        battleState.opponentScore;

    if (
        player >
        opponent
    ) {

        title =
            "🏆 Victory!";

        message =
            "Excellent work! You defeated your opponent.";

        points =
            player + 25;

    } else if (
        player <
        opponent
    ) {

        title =
            "Keep Studying!";

        message =
            "Your opponent won this round. Review the topic and try again.";

        points =
            player;

    } else {

        title =
            "🤝 Draw!";

        message =
            "Both players finished with the same score.";

        points =
            player + 10;
    }

    setBattlePoints(
        getBattlePoints() +
        points
    );

    if (
        $("oneVOneResultTitle")
    ) {

        $("oneVOneResultTitle")
            .textContent =
            title;
    }

    if (
        $("oneVOneResultMessage")
    ) {

        $("oneVOneResultMessage")
            .textContent =
            message;
    }

    if (
        $("oneVOneFinalPlayerScore")
    ) {

        $("oneVOneFinalPlayerScore")
            .textContent =
            player;
    }

    if (
        $("oneVOneFinalOpponentScore")
    ) {

        $("oneVOneFinalOpponentScore")
            .textContent =
            opponent;
    }

    if (
        $("oneVOnePointsEarned")
    ) {

        $("oneVOnePointsEarned")
            .textContent =
            `+${points}`;
    }

    /*
     * Count the battle once.
     */

    if (
        !isPremiumUser()
    ) {

        setBattlesUsed(
            getBattlesUsed() + 1
        );

        updateBattleLimitUI();
    }

    updateLeaderboardUI();

    /*
     * Tell Supabase the match is complete.
     */

    try {

        const client =
            getSupabase();

        await client
            .from(
                "game_matches"
            )
            .update({
                status:
                    "completed"
            })
            .eq(
                "id",
                oneVOneMatchId
            );

    } catch (error) {

        console.warn(
            "Could not mark 1v1 match completed:",
            error
        );
    }

    /*
     * Show the normal results panel if your HTML uses it.
     */

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

    cleanupOneVOneConnection();
}

/* =========================================================
   CANCEL 1V1
========================================================= */

async function cancelOneVOne() {

    clearOneVOnePolling();

    const currentMatch =
        oneVOneMatchId;

    try {

        if (
            currentMatch
        ) {

            const client =
                getSupabase();

            await client.rpc(
                "cancel_game_match",
                {
                    p_match_id:
                        currentMatch
                }
            );
        }

    } catch (error) {

        console.warn(
            "Could not cancel 1v1 match:",
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

    hideMatchmaking();
}

/* =========================================================
   CLEANUP 1V1 CONNECTION
========================================================= */

async function cleanupOneVOneConnection() {

    clearOneVOnePolling();

    try {

        /*
         * Realtime channel is stored here if the subscription
         * function creates one.
         */

        if (
            window.oneVOneChannel
        ) {

            const client =
                getSupabase();

            await client.removeChannel(
                window.oneVOneChannel
            );

            window.oneVOneChannel =
                null;
        }

    } catch (error) {

        console.warn(
            "Could not clean up 1v1 realtime channel:",
            error
        );
    }
}

/* =========================================================
   SUBSCRIBE TO 1V1 MATCH
========================================================= */

async function subscribeToOneVOne(
    matchId
) {

    const client =
        getSupabase();

    await cleanupOneVOneConnection();

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
                    table:
                        "game_matches",
                    filter:
                        `id=eq.${matchId}`
                },
                function (
                    payload
                ) {

                    console.log(
                        "1v1 match update:",
                        payload
                    );

                    const match =
                        payload.new;

                    if (
                        match?.status ===
                        "active"
                    ) {

                        activateOneVOneMatch(
                            match
                        );
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
                function (
                    payload
                ) {

                    console.log(
                        "1v1 player update:",
                        payload
                    );

                    checkMatchPlayers();
                }
            )
            .subscribe(
                function (
                    status
                ) {

                    console.log(
                        "1v1 realtime status:",
                        status
                    );
                }
            );

    window.oneVOneChannel =
        channel;

    return channel;
}

/* =========================================================
   PREMIUM MESSAGE FALLBACK
========================================================= */

function showPremiumMessage() {

    if (
        typeof openPremium ===
        "function"
    ) {

        openPremium();

        return;
    }

    alert(
        "You have used all 5 free Game Mode battles. Upgrade to Premium for unlimited battles."
    );
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

    if (!rows) {
        return;
    }

    rows.innerHTML = `
        <div class="leaderboard-row">
            <span>1</span>
            <span>You</span>
            <strong>${points}</strong>
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

    const current =
        body.classList.contains(
            "light-mode"
        );

    if (current) {

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

    if (!button) {
        return;
    }

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
    }
})();

/* =========================================================
   CLEAN ERROR
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

window.SUBJECT_DATABASE =
    SUBJECT_DATABASE;

