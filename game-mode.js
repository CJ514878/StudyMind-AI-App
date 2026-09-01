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
function clearOneVOnePolling() {

    if (oneVOnePolling) {

        clearInterval(
            oneVOnePolling
        );

        oneVOnePolling =
            null;
    }
}
async function checkMatchPlayers() {

    if (!oneVOneMatchId) {
        return;
    }

    const supabaseClient =
        getSupabase();

    const {
        data,
        error
    } =
        await supabaseClient
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

    if (error) {
        throw error;
    }

    const players =
        Array.isArray(data)
            ? data
            : [];

    console.log(
        "1v1 players:",
        players
    );

    /*
     * -----------------------------------------------------
     * WAITING FOR PLAYER 2
     * -----------------------------------------------------
     */

    if (players.length < 2) {

        updateMatchmakingText(
            "Looking for an opponent...",
            "Your battle room is ready. Searching for another student..."
        );

        return;
    }

    /*
     * -----------------------------------------------------
     * TWO PLAYERS FOUND
     * -----------------------------------------------------
     */

    console.log(
        "1v1 opponent found:",
        players
    );

    clearOneVOnePolling();

    const playerOne =
        players.find(
            player =>
                Number(
                    player.player_number
                ) === 1
        );

    const playerTwo =
        players.find(
            player =>
                Number(
                    player.player_number
                ) === 2
        );

    /*
     * Make sure the current player knows
     * which side they are on.
     */

   let currentPlayer = null;

try {

    const currentUser =
        await getCurrentUser();

    if (currentUser?.id) {

        currentPlayer =
            players.find(
                player =>
                    player.user_id ===
                    currentUser.id
            );
    }

} catch (userError) {

    console.warn(
        "Could not identify current 1v1 player:",
        userError
    );
}

    if (currentPlayer) {

        oneVOnePlayerNumber =
            Number(
                currentPlayer.player_number
            );
    }

    /*
     * -----------------------------------------------------
     * MATCH IS READY
     * -----------------------------------------------------
     */

    oneVOneActive =
        true;

    updateMatchmakingText(
        "Opponent found! ⚔️",
        "Both players are connected. Starting the battle..."
    );

    /*
     * Update database status from
     * starting → active.
     *
     * Only Player 1 attempts this.
     * The other player will receive the
     * realtime update.
     */

    if (
        oneVOnePlayerNumber === 1
    ) {

        try {

            await supabaseClient
                .from("game_matches")
                .update({
                    status: "active"
                })
                .eq(
                    "id",
                    oneVOneMatchId
                )
                .eq(
                    "status",
                    "starting"
                );

        } catch (statusError) {

            console.warn(
                "Could not activate 1v1 match:",
                statusError
            );
        }
    }

    /*
     * -----------------------------------------------------
     * START ARENA
     * -----------------------------------------------------
     */

    setTimeout(
        function () {

            startOneVOneArena();

        },
        700
    );
}
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
   console.log("CURRENT 1V1 USER:", {
    id: user?.id,
    email: user?.email
});

    if (!user || !user.id) {
        throw new Error(
            "You must be logged in to play 1v1."
        );
    }

    const subject =
        $("oneVOneSubject")?.value?.trim() || "";

    const topic =
        $("oneVOneTopic")?.value?.trim() || "";

    const difficulty =
        $("oneVOneDifficulty")?.value || "mixed";

    if (!subject || !topic) {

        alert(
            "Choose a subject and topic first."
        );

        return;
    }

    oneVOneMyName =
        getDisplayName(user);

    showMatchmaking();

    const supabaseClient =
        getSupabase();

    if (!supabaseClient) {
        throw new Error(
            "Supabase client is not available."
        );
    }

    /*
     * =====================================================
     * STEP 1 — LOOK FOR AN EXISTING WAITING MATCH
     * =====================================================
     */

    const {
        data: waitingMatches,
        error: searchError
    } =
        await supabaseClient
            .from("game_matches")
            .select("*")
            .eq("status", "waiting")
            .eq("subject", subject)
            .eq("topic", topic)
            .eq("difficulty", difficulty)
            .neq("created_by", user.id)
            .order("created_at", {
                ascending: true
            })
            .limit(1);

    if (searchError) {
        throw searchError;
    }

    const existingMatch =
        waitingMatches?.[0] || null;

    /*
     * =====================================================
     * STEP 2 — JOIN EXISTING MATCH
     * =====================================================
     */

    if (existingMatch) {

        console.log(
            "1v1 existing waiting match found:",
            existingMatch
        );

        updateMatchmakingText(
            "Opponent found! ⚔️",
            "Joining the battle..."
        );

        /*
         * Make absolutely sure no old polling loop
         * is running before joining.
         */

        if (
            typeof clearOneVOnePolling ===
            "function"
        ) {

            clearOneVOnePolling();

        } else {

            clearInterval(
                oneVOnePolling
            );

            oneVOnePolling =
                null;
        }

        /*
         * Join through the database function.
         */

        const {
            data: joinedMatch,
            error: joinError
        } =
            await supabaseClient.rpc(
                "join_game_match",
                {
                    p_match_id:
                        existingMatch.id,

                    p_display_name:
                        oneVOneMyName
                }
            );

        if (joinError) {

            /*
             * The match may have been taken by
             * another player between the search
             * and the join.
             */

            console.warn(
                "Existing match could not be joined:",
                joinError
            );

            /*
             * Do NOT treat this as a fatal error.
             *
             * Clear the current state and start a
             * fresh matchmaking search.
             */

            oneVOneMatchId =
                null;

            oneVOnePlayerNumber =
                null;

            oneVOneResultsRecorded =
                false;

            oneVOneAnsweredQuestions =
                new Set();

            updateMatchmakingText(
                "Searching again...",
                "That battle room was just taken. Looking for another opponent..."
            );

            /*
             * Retry after a short delay.
             */

            setTimeout(
                function () {

                    findOneVOneOpponent();

                },
                700
            );

            return;
        }

        /*
         * =================================================
         * WE SUCCESSFULLY JOINED
         * =================================================
         */

        oneVOneMatchId =
            normalizeMatchId(
                joinedMatch
            ) ||
            existingMatch.id;

        if (!oneVOneMatchId) {

            throw new Error(
                "The battle was joined but no match ID was returned."
            );
        }

        oneVOnePlayerNumber =
            2;

        oneVOneResultsRecorded =
            false;

        oneVOneAnsweredQuestions =
            new Set();

        console.log(
            "Successfully joined existing 1v1 match:",
            oneVOneMatchId
        );

        /*
         * Subscribe to THIS match.
         */

        await subscribeToOneVOne(
            oneVOneMatchId
        );

        updateMatchmakingText(
            "Opponent found! ⚔️",
            "Both players are connected. Preparing your battle..."
        );

        /*
         * Immediately check the players.
         *
         * Do not start another polling loop here.
         */

        await checkMatchPlayers();

        return;
    }

    /*
     * =====================================================
     * STEP 3 — NO EXISTING MATCH
     * CREATE OUR OWN WAITING ROOM
     * =====================================================
     */

    console.log(
        "No existing 1v1 match found. Creating waiting room..."
    );

    const {
        data: createdMatch,
        error: createError
    } =
        await supabaseClient.rpc(
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
            "The battle room was created but no match ID was returned."
        );
    }

    oneVOnePlayerNumber =
        1;

    oneVOneResultsRecorded =
        false;

    oneVOneAnsweredQuestions =
        new Set();

    console.log(
        "Created new 1v1 waiting room:",
        oneVOneMatchId
    );

    /*
     * Subscribe immediately.
     */

    await subscribeToOneVOne(
        oneVOneMatchId
    );

    updateMatchmakingText(
        "Looking for an opponent...",
        "Your battle room is ready. Searching for another student..."
    );

    /*
     * =====================================================
     * STEP 4 — POLL OUR ROOM
     * =====================================================
     */

    if (
        typeof clearOneVOnePolling ===
        "function"
    ) {

        clearOneVOnePolling();

    } else {

        clearInterval(
            oneVOnePolling
        );

        oneVOnePolling =
            null;
    }

    oneVOneMatchmakingStartedAt =
        Date.now();

    const pollForOpponent =
        async function () {

            /*
             * Stop if the match is no longer ours.
             */

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

                if (
                    typeof clearOneVOnePolling ===
                    "function"
                ) {

                    clearOneVOnePolling();

                } else {

                    clearInterval(
                        oneVOnePolling
                    );

                    oneVOnePolling =
                        null;
                }

                updateMatchmakingText(
                    "Still waiting...",
                    "No opponent has joined yet. You can keep waiting or cancel the search."
                );

                return;
            }

            try {

                /*
                 * First check our own room.
                 */

                await checkMatchPlayers();

                if (
                    !oneVOneMatchId ||
                    oneVOneActive
                ) {

                    return;
                }

                /*
                 * =================================================
                 * LOOK FOR ANOTHER WAITING MATCH
                 * =================================================
                 */

                const {
                    data: otherMatches,
                    error: otherSearchError
                } =
                    await supabaseClient
                        .from("game_matches")
                        .select("*")
                        .eq("status", "waiting")
                        .eq("subject", subject)
                        .eq("topic", topic)
                        .eq("difficulty", difficulty)
                        .neq("created_by", user.id)
                        .neq("id", oneVOneMatchId)
                        .order("created_at", {
                            ascending: true
                        })
                        .limit(1);

                if (otherSearchError) {

                    console.warn(
                        "Waiting-match search error:",
                        otherSearchError
                    );

                    return;
                }

                const otherMatch =
                    otherMatches?.[0] || null;

                if (!otherMatch) {
                    return;
                }

                console.log(
                    "Another waiting match found:",
                    otherMatch
                );

                /*
                 * STOP POLLING BEFORE JOINING.
                 */

                if (
                    typeof clearOneVOnePolling ===
                    "function"
                ) {

                    clearOneVOnePolling();

                } else {

                    clearInterval(
                        oneVOnePolling
                    );

                    oneVOnePolling =
                        null;
                }

                const oldMatchId =
                    oneVOneMatchId;

                updateMatchmakingText(
                    "Opponent found! ⚔️",
                    "Joining the opponent's battle room..."
                );

                /*
                 * =================================================
                 * JOIN OTHER PLAYER'S MATCH
                 * =================================================
                 */

                const {
                    data: joinedMatch,
                    error: joinError
                } =
                    await supabaseClient.rpc(
                        "join_game_match",
                        {
                            p_match_id:
                                otherMatch.id,

                            p_display_name:
                                oneVOneMyName
                        }
                    );

                if (joinError) {

                    console.warn(
                        "Could not join waiting match:",
                        joinError
                    );

                    /*
                     * Restore our original room.
                     */

                    oneVOneMatchId =
                        oldMatchId;

                    /*
                     * Restart polling cleanly.
                     */

                    oneVOneMatchmakingStartedAt =
                        Date.now();

                    oneVOnePolling =
                        setInterval(
                            pollForOpponent,
                            MATCHMAKING_INTERVAL
                        );

                    return;
                }

                /*
                 * =================================================
                 * SUCCESSFULLY JOINED OTHER MATCH
                 * =================================================
                 */

                /*
                 * Cancel our duplicate waiting room.
                 */

                try {

                    await supabaseClient.rpc(
                        "cancel_game_match",
                        {
                            p_match_id:
                                oldMatchId
                        }
                    );

                } catch (cancelError) {

                    console.warn(
                        "Could not cancel old waiting room:",
                        cancelError
                    );
                }

                /*
                 * Disconnect from old room.
                 */

                await cleanupOneVOneConnection();

                /*
                 * Use the room we joined.
                 */

                oneVOneMatchId =
                    normalizeMatchId(
                        joinedMatch
                    ) ||
                    otherMatch.id;

                oneVOnePlayerNumber =
                    2;

                oneVOneResultsRecorded =
                    false;

                oneVOneAnsweredQuestions =
                    new Set();

                console.log(
                    "Joined existing waiting match:",
                    oneVOneMatchId
                );

                /*
                 * Subscribe to the new match.
                 */

                await subscribeToOneVOne(
                    oneVOneMatchId
                );

                updateMatchmakingText(
                    "Opponent found! ⚔️",
                    "Both players are connected. Preparing your battle..."
                );

                /*
                 * Check immediately.
                 */

                await checkMatchPlayers();

            } catch (pollingError) {

                console.error(
                    "1v1 matchmaking polling error:",
                    pollingError
                );
            }
        };

    oneVOnePolling =
        setInterval(
            pollForOpponent,
            MATCHMAKING_INTERVAL
        );

} catch (error) {

    console.error(
        "1v1 matchmaking error:",
        error
    );

    if (
        typeof clearOneVOnePolling ===
        "function"
    ) {

        clearOneVOnePolling();

    } else {

        clearInterval(
            oneVOnePolling
        );

        oneVOnePolling =
            null;
    }

    await cleanupOneVOneConnection();

    oneVOneMatchId =
        null;

    oneVOnePlayerNumber =
        null;

    oneVOneResultsRecorded =
        false;

    oneVOneAnsweredQuestions =
        new Set();

    hideMatchmaking();

    alert(
        cleanErrorMessage(
            error?.message
        )
    );
}


}

/* =========================================================
   JOIN EXISTING 1V1 MATCH
========================================================= */

async function joinExistingMatch(match) {

    if (!match || !match.id) {
        throw new Error("Invalid match.");
    }

    const supabaseClient =
        getSupabase();

    const user =
        await getCurrentUser();

    if (!user || !user.id) {
        throw new Error(
            "You must be logged in to join a battle."
        );
    }

    const displayName =
        getDisplayName(user);

    console.log(
        "Joining existing 1v1 match:",
        match.id
    );

    /*
     * Call the database function that safely
     * adds Player 2 to the match.
     */

    const {
        data,
        error
    } =
        await supabaseClient.rpc(
            "join_game_match",
            {
                p_match_id:
                    match.id,

                p_display_name:
                    displayName
            }
        );

    if (error) {

        console.error(
            "join_game_match error:",
            error
        );

        throw error;
    }

    console.log(
        "Successfully joined 1v1 match:",
        data
    );

    oneVOneMatchId =
        match.id;

    oneVOnePlayerNumber =
        2;

    oneVOneResultsRecorded =
        false;

    oneVOneAnsweredQuestions =
        new Set();

    /*
     * Stop matchmaking polling.
     */

    if (
        typeof clearOneVOnePolling ===
        "function"
    ) {

        clearOneVOnePolling();

    } else if (
        oneVOnePolling
    ) {

        clearInterval(
            oneVOnePolling
        );

        oneVOnePolling =
            null;
    }

    /*
     * Subscribe to the match.
     */

    await subscribeToOneVOne(
        oneVOneMatchId
    );

    /*
     * The database function changes the match
     * to "starting". The realtime subscription
     * will handle the transition into the arena.
     */

    updateMatchmakingText(
        "Opponent found! ⚔️",
        "Your opponent has joined. Preparing the battle..."
    );

    console.log(
        "1v1 Player 2 ready:",
        oneVOneMatchId
    );
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
   JOIN EXISTING 1V1 MATCH
========================================================= */

async function joinExistingMatch(match) {

    const client = getSupabase();

    if (!client) {
        throw new Error(
            "Supabase client is not available."
        );
    }

    if (!match || !match.id) {
        throw new Error(
            "Invalid match."
        );
    }

    try {

        /*
         * Get the currently logged-in user.
         */

        const user =
            await getCurrentUser();

        if (!user) {
            throw new Error(
                "You must be logged in to join a 1v1 match."
            );
        }

        /*
         * Get the student's display name.
         *
         * Use the same name already used elsewhere
         * in Game Mode when possible.
         */

        let displayName =
            user.user_metadata?.display_name ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "Player";

        /*
         * Save the match ID immediately.
         */

        oneVOneMatchId =
            match.id;

        /*
         * Make sure we are not already in this match.
         */

        const {
            data: existingPlayer,
            error: existingPlayerError
        } =
            await client
                .from("game_match_players")
                .select(
                    "user_id,player_number,display_name"
                )
                .eq(
                    "match_id",
                    match.id
                )
                .eq(
                    "user_id",
                    user.id
                )
                .maybeSingle();

        if (existingPlayerError) {

            console.error(
                "Could not check existing 1v1 player:",
                existingPlayerError
            );

            throw existingPlayerError;
        }

        /*
         * If we are already in the match, simply
         * reconnect to it.
         */

        if (existingPlayer) {

            console.log(
                "Already joined this 1v1 match:",
                existingPlayer
            );

            oneVOnePlayerNumber =
                Number(
                    existingPlayer.player_number
                );

            oneVOneMyName =
                existingPlayer.display_name ||
                displayName;

            updateMatchmakingText(
                "Rejoining battle... ⚔️",
                "Connecting you to your opponent."
            );

            await subscribeToOneVOne(
                match.id
            );

            return existingPlayer;
        }

        /*
         * Join through the SECURITY DEFINER RPC.
         *
         * This is important because the database function
         * handles the protected game_match_players insert.
         */

        console.log(
            "Joining existing 1v1 match:",
            match.id
        );

        const {
            data: joinedMatch,
            error: joinError
        } =
            await client.rpc(
                "join_game_match",
                {
                    p_match_id:
                        match.id,
                    p_display_name:
                        displayName
                }
            );

        if (joinError) {

            console.error(
                "join_game_match error:",
                joinError
            );

            throw joinError;
        }

        console.log(
            "Successfully joined 1v1 match:",
            joinedMatch
        );

        /*
         * The database function returns player_number = 2
         * for the joining player.
         */

        if (
            joinedMatch &&
            joinedMatch.player_number
        ) {

            oneVOnePlayerNumber =
                Number(
                    joinedMatch.player_number
                );
        } else {

            oneVOnePlayerNumber =
                2;
        }

        oneVOneMyName =
            displayName;

        updateMatchmakingText(
            "Opponent found! ⚔️",
            "Both players are ready. Preparing your battle..."
        );

        /*
         * Subscribe AFTER joining so we immediately receive
         * any subsequent match/player updates.
         */

        await subscribeToOneVOne(
            match.id
        );

        /*
         * Check immediately in case the database has
         * already changed the match to starting.
         */

        await checkMatchPlayers();

        return joinedMatch;

    } catch (error) {

        console.error(
            "joinExistingMatch error:",
            error
        );

        updateMatchmakingText(
            "Could not join match",
            cleanErrorMessage(
                error?.message ||
                error
            )
        );

        throw error;
    }
}



/* =========================================================
   CHECK 1V1 MATCH PLAYERS
========================================================= */

async function checkMatchPlayers() {

    if (!oneVOneMatchId) {
        return;
    }

    const client =
        getSupabase();

    if (!client) {
        console.error(
            "Supabase client is not available."
        );
        return;
    }

    try {

        /*
         * -----------------------------------------------------
         * GET ALL PLAYERS IN THIS MATCH
         * -----------------------------------------------------
         */

        const {
            data: players,
            error: playersError
        } =
            await client
                .from("game_match_players")
                .select(
                    "match_id,user_id,player_number,display_name"
                )
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

            console.error(
                "Could not check 1v1 players:",
                playersError
            );

            return;
        }

        const matchPlayers =
            Array.isArray(players)
                ? players
                : [];

        console.log(
            "1v1 players:",
            matchPlayers
        );

        /*
         * -----------------------------------------------------
         * WAIT FOR PLAYER 2
         * -----------------------------------------------------
         */

        if (
            matchPlayers.length <
            2
        ) {

            updateMatchmakingText(
                "Looking for an opponent...",
                "Your battle room is ready. Searching for another student..."
            );

            return;
        }

        /*
         * -----------------------------------------------------
         * TWO PLAYERS FOUND
         * -----------------------------------------------------
         */

        console.log(
            "🎮 TWO PLAYERS FOUND!",
            matchPlayers
        );

        /*
         * -----------------------------------------------------
         * IDENTIFY CURRENT PLAYER
         * -----------------------------------------------------
         */

        try {

            const user =
                await getCurrentUser();

            if (user?.id) {

                const currentPlayer =
                    matchPlayers.find(
                        player =>
                            player.user_id ===
                            user.id
                    );

                if (currentPlayer) {

                    oneVOnePlayerNumber =
                        Number(
                            currentPlayer.player_number
                        );

                    oneVOneMyName =
                        currentPlayer.display_name ||
                        oneVOneMyName;

                    console.log(
                        "Current 1v1 player number:",
                        oneVOnePlayerNumber
                    );
                }
            }

        } catch (userError) {

            console.warn(
                "Could not identify current 1v1 player:",
                userError
            );
        }

        /*
         * -----------------------------------------------------
         * LOAD CURRENT MATCH
         * -----------------------------------------------------
         */

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

            console.error(
                "Could not load 1v1 match:",
                matchError
            );

            return;
        }

        if (!match) {

            console.error(
                "1v1 match no longer exists:",
                oneVOneMatchId
            );

            return;
        }

        console.log(
            "Current 1v1 match status:",
            match.status
        );

        /*
         * -----------------------------------------------------
         * MATCH IS ALREADY ACTIVE
         * -----------------------------------------------------
         */

        if (
            match.status ===
            "active"
        ) {

            console.log(
                "🎮 1v1 match is ACTIVE."
            );

            clearOneVOnePolling();

            oneVOneActive =
                true;

            updateMatchmakingText(
                "Battle starting! ⚔️",
                "Your 1v1 battle is ready."
            );

            /*
             * Start the arena only once.
             */

            if (
                !window.oneVOneArenaStarted
            ) {

                window.oneVOneArenaStarted =
                    true;

                setTimeout(
                    function () {

                        startOneVOneArena();

                    },
                    500
                );
            }

            return;
        }

        /*
         * -----------------------------------------------------
         * MATCH IS FINISHED / CANCELLED
         * -----------------------------------------------------
         */

        if (
            match.status === "finished" ||
            match.status === "cancelled"
        ) {

            console.warn(
                "1v1 match is no longer playable:",
                match.status
            );

            clearOneVOnePolling();

            oneVOneActive =
                false;

            updateMatchmakingText(
                "Match unavailable",
                "This battle is no longer available."
            );

            return;
        }

        /*
         * -----------------------------------------------------
         * TWO PLAYERS + STARTING
         * -----------------------------------------------------
         */

        if (
            match.status ===
            "starting"
        ) {

            updateMatchmakingText(
                "Opponent found! ⚔️",
                "Both players are connected. Starting the battle..."
            );

            /*
             * -------------------------------------------------
             * PLAYER 1 ACTIVATES THE MATCH
             * -------------------------------------------------
             */

            if (
                oneVOnePlayerNumber ===
                1
            ) {

                console.log(
                    "Player 1 activating 1v1 match..."
                );

                const {
                    data: activatedMatch,
                    error: activateError
                } =
                    await client.rpc(
                        "start_game_match",
                        {
                            p_match_id:
                                oneVOneMatchId
                        }
                    );

                if (activateError) {

                    console.warn(
                        "start_game_match returned an error:",
                        activateError
                    );

                    /*
                     * Another client may have activated
                     * the match at almost the same time.
                     *
                     * Re-read the database instead of
                     * immediately failing.
                     */

                    const {
                        data: latestMatch,
                        error: latestError
                    } =
                        await client
                            .from("game_matches")
                            .select("*")
                            .eq(
                                "id",
                                oneVOneMatchId
                            )
                            .maybeSingle();

                    if (latestError) {

                        console.warn(
                            "Could not re-check 1v1 match:",
                            latestError
                        );

                        return;
                    }

                    if (
                        latestMatch?.status ===
                        "active"
                    ) {

                        console.log(
                            "1v1 match became active while checking."
                        );

                        oneVOneActive =
                            true;

                        clearOneVOnePolling();

                        if (
                            !window.oneVOneArenaStarted
                        ) {

                            window.oneVOneArenaStarted =
                                true;

                            setTimeout(
                                function () {

                                    startOneVOneArena();

                                },
                                500
                            );
                        }

                    } else {

                        console.log(
                            "1v1 match is still:",
                            latestMatch?.status
                        );
                    }

                    return;
                }

                /*
                 * RPC successfully activated the match.
                 */

                console.log(
                    "✅ 1v1 match activated:",
                    activatedMatch
                );

                /*
                 * If the RPC returns the updated match,
                 * start immediately.
                 */

                if (
                    activatedMatch?.status ===
                    "active"
                ) {

                    oneVOneActive =
                        true;

                    clearOneVOnePolling();

                    if (
                        !window.oneVOneArenaStarted
                    ) {

                        window.oneVOneArenaStarted =
                            true;

                        setTimeout(
                            function () {

                                startOneVOneArena();

                            },
                            500
                        );
                    }

                    return;
                }

                /*
                 * Some RPC implementations return only
                 * an ID/object. Re-read the match.
                 */

                const {
                    data: refreshedMatch
                } =
                    await client
                        .from("game_matches")
                        .select("*")
                        .eq(
                            "id",
                            oneVOneMatchId
                        )
                        .maybeSingle();

                if (
                    refreshedMatch?.status ===
                    "active"
                ) {

                    console.log(
                        "✅ Database confirms 1v1 is active."
                    );

                    oneVOneActive =
                        true;

                    clearOneVOnePolling();

                    if (
                        !window.oneVOneArenaStarted
                    ) {

                        window.oneVOneArenaStarted =
                            true;

                        setTimeout(
                            function () {

                                startOneVOneArena();

                            },
                            500
                        );
                    }

                } else {

                    console.log(
                        "Player 1 activated request completed. Waiting for active status..."
                    );
                }

                return;
            }

            /*
             * -------------------------------------------------
             * PLAYER 2 WAITS
             * -------------------------------------------------
             */

            if (
                oneVOnePlayerNumber ===
                2
            ) {

                console.log(
                    "Player 2 waiting for Player 1 to activate the match..."
                );

                return;
            }

            /*
             * -------------------------------------------------
             * UNKNOWN PLAYER NUMBER
             * -------------------------------------------------
             */

            console.warn(
                "Two players found, but current player number is unknown."
            );

            return;
        }

        /*
         * -----------------------------------------------------
         * UNEXPECTED STATUS
         * -----------------------------------------------------
         */

        console.warn(
            "Unexpected 1v1 match status:",
            match.status
        );

    } catch (error) {

        console.error(
            "checkMatchPlayers error:",
            error
        );
    }
}


/* =========================================================
   SUBSCRIBE TO 1V1 MATCH
========================================================= */

async function subscribeToOneVOne(matchId) {

    const client = getSupabase();

    if (!client) {
        throw new Error(
            "Supabase client is not available."
        );
    }
oneVOneMatchId = matchId;
    await cleanupOneVOneConnection();

    console.log(
        "Subscribing to 1v1 match:",
        matchId
    );

    /*
     * Create realtime channel.
     */

    const channel =
        client
            .channel(
                `game-match-${matchId}`
            )

            /*
             * MATCH UPDATES
             */

            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "game_matches",
                    filter:
                        `id=eq.${matchId}`
                },
                async function(payload) {

                    console.log(
                        "1v1 match update:",
                        payload
                    );

                    const match =
                        payload.new;

                    if (!match) {
                        return;
                    }

                    if (
                        match.status ===
                        "starting"
                    ) {

                        console.log(
                            "1v1 match is starting."
                        );

                        await checkMatchPlayers();
                    }

                    if (
                        match.status ===
                        "active"
                    ) {

                        console.log(
                            "1v1 match is active."
                        );

                        activateOneVOneMatch(
                            match
                        );
                    }
                }
            )

            /*
             * PLAYER UPDATES
             */

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
                async function(payload) {

                    console.log(
                        "1v1 player update:",
                        payload
                    );

                    await checkMatchPlayers();
                }
            )

            .subscribe(
                function(status) {

                    console.log(
                        "1v1 realtime status:",
                        status
                    );
                }
            );

    window.oneVOneChannel =
        channel;

    /*
     * Immediately check the database.
     *
     * This is important because the second player
     * may have joined before realtime delivered
     * the INSERT event.
     */

    await checkMatchPlayers();

    return channel;
}
/* =========================================================
   ACTIVATE 1V1 MATCH
========================================================= */

async function activateOneVOneMatch(match) {

    if (!match) {
        console.warn(
            "activateOneVOneMatch called without a match."
        );
        return;
    }

    console.log(
        "🎮 activateOneVOneMatch() called:",
        match
    );

    /*
     * Make sure the match belongs to the current
     * 1v1 session.
     */

    if (
        oneVOneMatchId &&
        match.id &&
        String(match.id) !==
        String(oneVOneMatchId)
    ) {

        console.warn(
            "Ignoring active match that does not belong to current 1v1 session."
        );

        return;
    }

    oneVOneMatchId =
        match.id ||
        oneVOneMatchId;

    oneVOneActive =
        true;

    clearOneVOnePolling();

    /*
     * Prevent duplicate realtime events from
     * opening the arena repeatedly.
     */

    if (
        window.oneVOneArenaStarted
    ) {

        console.log(
            "1v1 arena has already been started."
        );

        return;
    }

    window.oneVOneArenaStarted =
        true;

    updateMatchmakingText(
        "Battle starting! ⚔️",
        "Your 1v1 match is active. Get ready!"
    );

    console.log(
        "1v1 match activated"
    );

    /*
     * Give both clients a moment to finish
     * receiving the player/realtime updates.
     */

    setTimeout(
        async function () {

            try {

                await startOneVOneArena();

            } catch (error) {

                console.error(
                    "Could not start 1v1 arena:",
                    error
                );

                /*
                 * Allow another realtime event to
                 * attempt the arena if something
                 * failed during startup.
                 */

                window.oneVOneArenaStarted =
                    false;

                updateMatchmakingText(
                    "Could not start battle",
                    error?.message ||
                    "The 1v1 arena could not be opened."
                );

            }

        },
        500
    );
}


/* =========================================================
   START 1V1 ARENA
========================================================= */

async function startOneVOneArena() {

    console.log(
        "🎮 startOneVOneArena() called."
    );

    /*
     * -----------------------------------------------------
     * STOP MATCHMAKING
     * -----------------------------------------------------
     */

    clearOneVOnePolling();

    /*
     * -----------------------------------------------------
     * SHOW 1V1 ARENA
     * -----------------------------------------------------
     */

    const setup =
        $("battleSetup");

    const oneVOneSetup =
        $("oneVOneSetup");

    const computerArena =
        $("battleArena");

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

    if (computerArena) {
        computerArena.hidden = true;
    }

    if (results) {
        results.hidden = true;
    }

    if (oneVOneArena) {
        oneVOneArena.hidden = false;

        oneVOneArena.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    } else {

        console.error(
            "❌ #oneVOneArena was not found in game-mode.html."
        );

        throw new Error(
            "The 1v1 arena element (#oneVOneArena) is missing from game-mode.html."
        );
    }

    /*
     * -----------------------------------------------------
     * MARK 1V1 AS ACTIVE
     * -----------------------------------------------------
     */

    oneVOneActive =
        true;

    /*
     * -----------------------------------------------------
     * RESET 1V1 STATE
     * -----------------------------------------------------
     */

    oneVOneResultsRecorded =
        false;

    oneVOneAnsweredQuestions =
        new Set();

    /*
     * Create the local 1v1 battle state.
     */

    battleState = {

        mode:
            "1v1",

        subject:
            oneVOneSubjectValue(),

        topic:
            oneVOneTopicValue(),

        difficulty:
            oneVOneDifficultyValue(),

        questions:
            [],

        currentQuestion:
            0,

        playerScore:
            0,

        opponentScore:
            0,

        timer:
            QUESTION_TIME_SECONDS,

        timerInterval:
            null,

        answering:
            false,

        battleActive:
            true
    };

    /*
     * -----------------------------------------------------
     * UPDATE 1V1 PLAYER LABELS
     * -----------------------------------------------------
     */

    updateOneVOnePlayerLabels();

    /*
     * -----------------------------------------------------
     * LOAD QUESTIONS
     * -----------------------------------------------------
     */

    updateOneVOneArenaMessage(
        "Preparing your questions..."
    );

    try {

        const questions =
            await generateBattleQuestions(
                battleState.subject,
                battleState.topic,
                battleState.difficulty
            );

        if (
            !Array.isArray(questions) ||
            questions.length <
            QUESTIONS_PER_BATTLE
        ) {

            throw new Error(
                "The AI did not return enough questions for the 1v1 battle."
            );
        }

        battleState.questions =
            questions.slice(
                0,
                QUESTIONS_PER_BATTLE
            );

    } catch (error) {

        console.error(
            "1v1 question generation failed:",
            error
        );

        /*
         * Do not leave the user stuck on a blank arena.
         */

        battleState.battleActive =
            false;

        window.oneVOneArenaStarted =
            false;

        updateOneVOneArenaMessage(
            "Could not prepare the battle questions."
        );

        throw error;
    }

    /*
     * -----------------------------------------------------
     * DISPLAY FIRST QUESTION
     * -----------------------------------------------------
     */

    showOneVOneQuestion();

    console.log(
        "✅ 1v1 arena opened successfully."
    );
}


/* =========================================================
   1V1 SELECTED SUBJECT
========================================================= */

function oneVOneSubjectValue() {

    return normalizeSubjectName(
        $("oneVOneSubject")?.value?.trim() ||
        ""
    );
}


/* =========================================================
   1V1 SELECTED TOPIC
========================================================= */

function oneVOneTopicValue() {

    return (
        $("oneVOneTopic")?.value?.trim() ||
        ""
    );
}


/* =========================================================
   1V1 SELECTED DIFFICULTY
========================================================= */

function oneVOneDifficultyValue() {

    return (
        $("oneVOneDifficulty")?.value ||
        "mixed"
    );
}


/* =========================================================
   1V1 PLAYER LABELS
========================================================= */

function updateOneVOnePlayerLabels() {

    /*
     * Possible player-name elements used by the arena.
     */

    const playerOneName =
        getElement(
            "oneVOnePlayerOneName"
        );

    const playerTwoName =
        getElement(
            "oneVOnePlayerTwoName"
        );

    const opponentName =
        getElement(
            "oneVOneOpponentName"
        );

    /*
     * Try to identify the two players from
     * the current database match.
     *
     * The realtime player list is checked
     * separately when available.
     */

    if (
        playerOneName &&
        !playerOneName.textContent.trim()
    ) {

        playerOneName.textContent =
            "Player 1";
    }

    if (
        playerTwoName &&
        !playerTwoName.textContent.trim()
    ) {

        playerTwoName.textContent =
            "Player 2";
    }

    if (opponentName) {

        opponentName.textContent =
            oneVOnePlayerNumber === 1
                ? "Player 2"
                : "Player 1";
    }

    /*
     * Reuse the existing score elements if
     * the 1v1 arena contains them.
     */

    const playerScore =
        getElement(
            "oneVOnePlayerScore"
        );

    const opponentScore =
        getElement(
            "oneVOneOpponentScore"
        );

    if (playerScore) {
        playerScore.textContent =
            "0";
    }

    if (opponentScore) {
        opponentScore.textContent =
            "0";
    }
}


/* =========================================================
   1V1 ARENA MESSAGE
========================================================= */

function updateOneVOneArenaMessage(
    message
) {

    const candidates = [
        "oneVOneArenaMessage",
        "oneVOneStatusMessage",
        "oneVOneBattleStatus",
        "oneVOneQuestionStatus"
    ];

    for (
        const id of candidates
    ) {

        const element =
            getElement(id);

        if (element) {

            element.textContent =
                message;

            return;
        }
    }
}


/* =========================================================
   SHOW 1V1 QUESTION
========================================================= */

function showOneVOneQuestion() {

    stopOneVOneTimer();

    const question =
        battleState.questions[
            battleState.currentQuestion
        ];

    /*
     * Battle finished.
     */

    if (!question) {

        finishOneVOneBattle();

        return;
    }

    battleState.answering =
        false;

    const questionNumber =
        battleState.currentQuestion +
        1;

    /*
     * Question number.
     */

    const numberElements = [
        "oneVOneQuestionNumber",
        "oneVOneCurrentQuestionNumber"
    ];

    numberElements.forEach(
        id => {

            const element =
                getElement(id);

            if (element) {

                element.textContent =
                    questionNumber;
            }
        }
    );

    /*
     * Topic.
     */

    const topicElements = [
        "oneVOneQuestionTopic",
        "oneVOneBattleTopic"
    ];

    topicElements.forEach(
        id => {

            const element =
                getElement(id);

            if (element) {

                element.textContent =
                    battleState.topic;
            }
        }
    );

    /*
     * Question text.
     */

    const questionElements = [
        "oneVOneQuestion",
        "oneVOneBattleQuestion"
    ];

    let questionElement =
        null;

    for (
        const id of questionElements
    ) {

        const element =
            getElement(id);

        if (element) {

            questionElement =
                element;

            break;
        }
    }

    if (questionElement) {

        questionElement.textContent =
            question.question;
    }

    /*
     * Find the 1v1 answer grid.
     */

    let answerGrid =
        getElement(
            "oneVOneAnswerGrid"
        );

    if (!answerGrid) {

        /*
         * Fall back to the normal battle answer
         * grid if the HTML uses the same component.
         */

        answerGrid =
            getElement(
                "answerGrid"
            );
    }

    if (!answerGrid) {

        throw new Error(
            "The 1v1 answer grid is missing from game-mode.html."
        );
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

    /*
     * Update score display.
     */

    updateOneVOneScores();

    /*
     * Start timer.
     */

    startOneVOneTimer();
}


/* =========================================================
   1V1 TIMER
========================================================= */

function startOneVOneTimer() {

    stopOneVOneTimer();

    battleState.timer =
        QUESTION_TIME_SECONDS;

    updateOneVOneTimer();

    battleState.timerInterval =
        setInterval(
            function () {

                if (
                    !battleState.battleActive
                ) {

                    stopOneVOneTimer();

                    return;
                }

                battleState.timer--;

                updateOneVOneTimer();

                if (
                    battleState.timer <=
                    0
                ) {

                    stopOneVOneTimer();

                    handleOneVOneTimeout();
                }

            },
            1000
        );
}


/* =========================================================
   STOP 1V1 TIMER
========================================================= */

function stopOneVOneTimer() {

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


/* =========================================================
   UPDATE 1V1 TIMER
========================================================= */

function updateOneVOneTimer() {

    const timerElements = [
        "oneVOneTimer",
        "oneVOneBattleTimer"
    ];

    for (
        const id of timerElements
    ) {

        const element =
            getElement(id);

        if (element) {

            element.textContent =
                Math.max(
                    0,
                    battleState.timer
                );

            return;
        }
    }
}


/* =========================================================
   ANSWER 1V1 QUESTION
========================================================= */

function answerOneVOneQuestion(
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

    stopOneVOneTimer();

    const question =
        battleState.questions[
            battleState.currentQuestion
        ];

    if (!question) {
        return;
    }

    let answerGrid =
        getElement(
            "oneVOneAnswerGrid"
        );

    if (!answerGrid) {

        answerGrid =
            getElement(
                "answerGrid"
            );
    }

    const buttons =
        answerGrid
            ? answerGrid.querySelectorAll(
                ".answer-button"
            )
            : [];

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

    /*
     * Record this question locally.
     */

    oneVOneAnsweredQuestions.add(
        battleState.currentQuestion
    );

    /*
     * Score the current player.
     *
     * The opponent's actual score will eventually
     * be synchronized through the match system.
     */

    if (
        selectedIndex ===
        question.answer
    ) {

        battleState.playerScore +=
            10;
    }

    updateOneVOneScores();

    /*
     * Move to next question.
     */

    setTimeout(
        function () {

            if (
                !battleState.battleActive
            ) {

                return;
            }

            battleState.currentQuestion++;

            showOneVOneQuestion();

        },
        900
    );
}


/* =========================================================
   1V1 TIMEOUT
========================================================= */

function handleOneVOneTimeout() {

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

    let answerGrid =
        getElement(
            "oneVOneAnswerGrid"
        );

    if (!answerGrid) {

        answerGrid =
            getElement(
                "answerGrid"
            );
    }

    const buttons =
        answerGrid
            ? answerGrid.querySelectorAll(
                ".answer-button"
            )
            : [];

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

    /*
     * A timeout gives the opponent the point.
     */

    battleState.opponentScore +=
        10;

    updateOneVOneScores();

    setTimeout(
        function () {

            if (
                !battleState.battleActive
            ) {

                return;
            }

            battleState.currentQuestion++;

            showOneVOneQuestion();

        },
        900
    );
}


/* =========================================================
   UPDATE 1V1 SCORES
========================================================= */

function updateOneVOneScores() {

    /*
     * Generic score elements.
     */

    const playerScore =
        getElement(
            "oneVOnePlayerScore"
        );

    const opponentScore =
        getElement(
            "oneVOneOpponentScore"
        );

    if (playerScore) {

        playerScore.textContent =
            battleState.playerScore;
    }

    if (opponentScore) {

        opponentScore.textContent =
            battleState.opponentScore;
    }

    /*
     * If the existing battle score elements are
     * shared with 1v1, update those too.
     */

    const normalPlayerScore =
        getElement(
            "playerScore"
        );

    const normalOpponentScore =
        getElement(
            "computerScore"
        );

    if (
        normalPlayerScore &&
        battleState.mode ===
        "1v1"
    ) {

        normalPlayerScore.textContent =
            battleState.playerScore;
    }

    if (
        normalOpponentScore &&
        battleState.mode ===
        "1v1"
    ) {

        normalOpponentScore.textContent =
            battleState.opponentScore;
    }
}


/* =========================================================
   FINISH 1V1 BATTLE
========================================================= */

function finishOneVOneBattle() {

    stopOneVOneTimer();

    battleState.battleActive =
        false;

    oneVOneActive =
        false;

    const arena =
        getElement(
            "oneVOneArena"
        );

    const results =
        getElement(
            "battleResults"
        );

    if (arena) {
        arena.hidden = true;
    }

    if (results) {
        results.hidden = false;
    }

    const player =
        battleState.playerScore;

    const opponent =
        battleState.opponentScore;

    let title =
        "1v1 Battle Complete";

    let message =
        "Great work!";

    let points =
        player;

    if (
        player >
        opponent
    ) {

        title =
            "🏆 Victory!";

        message =
            "You won the 1v1 battle!";

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

    } else {

        title =
            "🤝 Draw!";

        message =
            "Both players finished with the same score.";

        points =
            player + 10;
    }

    /*
     * Award points only once.
     */

    if (
        !oneVOneResultsRecorded
    ) {

        oneVOneResultsRecorded =
            true;

        setBattlePoints(
            getBattlePoints() +
            points
        );

        /*
         * Count the completed battle.
         */

        setBattlesUsed(
            getBattlesUsed() + 1
        );
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

    if ($("finalOpponentLabel")) {

        $("finalOpponentLabel")
            .textContent =
            "OPPONENT";
    }

    updateLeaderboardUI();

    console.log(
        "🏁 1v1 battle finished:",
        {
            player,
            opponent,
            points
        }
    );
}


/* =========================================================
   RESET 1V1 ARENA
========================================================= */

function resetOneVOneArena() {

    stopOneVOneTimer();

    clearOneVOnePolling();

    battleState.battleActive =
        false;

    oneVOneActive =
        false;

    oneVOneMatchId =
        null;

    oneVOnePlayerNumber =
        null;

    oneVOneResultsRecorded =
        false;

    oneVOneAnsweredQuestions =
        new Set();

    window.oneVOneArenaStarted =
        false;

    cleanupOneVOneConnection();

    const arena =
        getElement(
            "oneVOneArena"
        );

    if (arena) {
        arena.hidden = true;
    }

    startOneVOneMode();
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
   LEADERBOARD — GLOBAL GAME MODE LEADERBOARD
   =========================================================

   PURPOSE:
   ---------------------------------------------------------
   Shows ALL accounts that have participated in Game Mode.

   The leaderboard statistics come from:

       game_leaderboard
           user_id
           display_name
           points
           wins
           losses
           draws
           battles

   IMPORTANT:
   ---------------------------------------------------------
   We do NOT use battle_points.

   We also do NOT hide players simply because their
   leaderboard row has missing/zero statistics.
   ========================================================= */


/* =========================================================
   LOAD GLOBAL LEADERBOARD
   ========================================================= */

async function getGlobalLeaderboard() {

    const client = getSupabase();

    /*
     * -----------------------------------------------------
     * LOAD EVERY LEADERBOARD RECORD
     * -----------------------------------------------------
     *
     * We deliberately do not use a limit here.
     * Supabase will therefore return all rows permitted
     * by the database policy.
     */

    const {
        data,
        error
    } = await client
        .from("game_leaderboard")
        .select(
            `
            user_id,
            display_name,
            points,
            wins,
            losses,
            draws,
            battles
            `
        )
        .order(
            "points",
            {
                ascending: false
            }
        )
        .order(
            "wins",
            {
                ascending: false
            }
        )
        .order(
            "battles",
            {
                ascending: true
            }
        );

    if (error) {

        console.error(
            "Could not load game_leaderboard:",
            error
        );

        throw error;
    }

    return Array.isArray(data)
        ? data
        : [];
}


/* =========================================================
   GET CURRENT USER
   ========================================================= */

async function getLeaderboardCurrentUser() {

    try {

        return await getCurrentUser();

    } catch (error) {

        console.warn(
            "Could not get current leaderboard user:",
            error
        );

        return null;
    }
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeLeaderboardHTML(value) {

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
   RANK DISPLAY
   ========================================================= */

function getLeaderboardRankDisplay(rank) {

    if (rank === 1) {

        return "🥇";
    }

    if (rank === 2) {

        return "🥈";
    }

    if (rank === 3) {

        return "🥉";
    }

    return `#${rank}`;
}


/* =========================================================
   UPDATE YOUR RANK
   ========================================================= */

function updateYourLeaderboardRank(
    rank,
    totalPlayers
) {

    const container =
        $("yourLeaderboardRank");

    if (!container) {

        return;
    }

    const span =
        container.querySelector(
            "span"
        );

    if (span) {

        span.textContent =
            rank
                ? `#${rank}`
                : "—";

    } else {

        container.textContent =
            rank
                ? `#${rank}`
                : "—";
    }

    container.title =
        rank
            ? `Rank ${rank} of ${totalPlayers}`
            : "Not ranked yet";
}


/* =========================================================
   UPDATE LEADERBOARD UI
   ========================================================= */

async function updateLeaderboardUI() {

    const rows =
        $("leaderboardRows");

    if (!rows) {

        return;
    }


    /* -----------------------------------------------------
       LOADING STATE
       ----------------------------------------------------- */

    rows.innerHTML = `
        <div class="leaderboard-row">
            <span>⏳</span>
            <span>Loading leaderboard...</span>
            <strong>—</strong>
        </div>
    `;


    try {

        /* -------------------------------------------------
           GET CURRENT USER
           ------------------------------------------------- */

        const currentUser =
            await getLeaderboardCurrentUser();

        const currentUserId =
            currentUser?.id || null;


        /* -------------------------------------------------
           GET ALL PARTICIPATING PLAYERS
           ------------------------------------------------- */

        const leaderboard =
            await getGlobalLeaderboard();


        /* -------------------------------------------------
           REMOVE INVALID DUPLICATE USER ROWS
           -------------------------------------------------

           If a database problem has accidentally created
           multiple leaderboard rows for the same user,
           only keep the best/highest-stat row.

           This prevents one account from appearing multiple
           times in the global leaderboard.
        ------------------------------------------------- */

        const uniquePlayers =
            new Map();

        leaderboard.forEach(
            function(player) {

                if (
                    !player ||
                    !player.user_id
                ) {

                    return;
                }

                const existing =
                    uniquePlayers.get(
                        player.user_id
                    );

                if (!existing) {

                    uniquePlayers.set(
                        player.user_id,
                        player
                    );

                    return;
                }

                const existingPoints =
                    Number(
                        existing.points || 0
                    );

                const newPoints =
                    Number(
                        player.points || 0
                    );

                if (
                    newPoints >
                    existingPoints
                ) {

                    uniquePlayers.set(
                        player.user_id,
                        player
                    );
                }
            }
        );


        const players =
            Array.from(
                uniquePlayers.values()
            );


        /* -------------------------------------------------
           SORT AGAIN AFTER DEDUPLICATION
           ------------------------------------------------- */

        players.sort(
            function(a, b) {

                const pointsA =
                    Number(
                        a.points || 0
                    );

                const pointsB =
                    Number(
                        b.points || 0
                    );

                if (
                    pointsA !==
                    pointsB
                ) {

                    return (
                        pointsB -
                        pointsA
                    );
                }


                const winsA =
                    Number(
                        a.wins || 0
                    );

                const winsB =
                    Number(
                        b.wins || 0
                    );

                if (
                    winsA !==
                    winsB
                ) {

                    return (
                        winsB -
                        winsA
                    );
                }


                const battlesA =
                    Number(
                        a.battles || 0
                    );

                const battlesB =
                    Number(
                        b.battles || 0
                    );

                return (
                    battlesA -
                    battlesB
                );
            }
        );


        /* -------------------------------------------------
           EMPTY LEADERBOARD
           ------------------------------------------------- */

        if (
            players.length ===
            0
        ) {

            rows.innerHTML = `
                <div class="leaderboard-row">
                    <span>🏆</span>
                    <span>No players yet</span>
                    <strong>0</strong>
                </div>
            `;

            if (
                $("yourBattlePoints")
            ) {

                $("yourBattlePoints")
                    .textContent =
                    "0";
            }

            updateYourLeaderboardRank(
                null,
                0
            );

            return;
        }


        /* -------------------------------------------------
           FIND CURRENT USER
           ------------------------------------------------- */

        const currentPlayerIndex =
            players.findIndex(
                function(player) {

                    return (
                        currentUserId &&
                        String(
                            player.user_id
                        ) ===
                        String(
                            currentUserId
                        )
                    );
                }
            );


        /* -------------------------------------------------
           UPDATE CURRENT USER'S POINTS
           ------------------------------------------------- */

        if (
            $("yourBattlePoints")
        ) {

            if (
                currentPlayerIndex !==
                -1
            ) {

                $("yourBattlePoints")
                    .textContent =
                    Number(
                        players[
                            currentPlayerIndex
                        ].points || 0
                    );

            } else {

                /*
                 * User has not appeared in the global
                 * leaderboard yet.
                 */

                $("yourBattlePoints")
                    .textContent =
                    Number(
                        getBattlePoints() || 0
                    );
            }
        }


        /* -------------------------------------------------
           RENDER EVERY PARTICIPATING PLAYER
           ------------------------------------------------- */

        rows.innerHTML =
            players
                .map(
                    function(
                        player,
                        index
                    ) {

                        const rank =
                            index + 1;

                        const points =
                            Number(
                                player.points || 0
                            );

                        const wins =
                            Number(
                                player.wins || 0
                            );

                        const losses =
                            Number(
                                player.losses || 0
                            );

                        const draws =
                            Number(
                                player.draws || 0
                            );

                        const battles =
                            Number(
                                player.battles || 0
                            );

                        const isYou =
                            Boolean(
                                currentUserId &&
                                String(
                                    player.user_id
                                ) ===
                                String(
                                    currentUserId
                                )
                            );


                        const displayName =
                            player.display_name ||
                            "StudyMind Student";


                        return `
                            <div
                                class="leaderboard-row ${
                                    isYou
                                        ? "current-player"
                                        : ""
                                }"
                                data-rank="${rank}"
                                data-user-id="${escapeLeaderboardHTML(
                                    player.user_id
                                )}"
                            >

                                <span
                                    class="leaderboard-rank"
                                >
                                    ${getLeaderboardRankDisplay(
                                        rank
                                    )}
                                </span>


                                <span
                                    class="leaderboard-player"
                                >
                                    ${escapeLeaderboardHTML(
                                        displayName
                                    )}

                                    ${
                                        isYou
                                            ? ' <small>(You)</small>'
                                            : ""
                                    }
                                </span>


                                <strong
                                    class="leaderboard-points"
                                >
                                    ${points}
                                </strong>

                            </div>
                        `;
                    }
                )
                .join("");


        /* -------------------------------------------------
           UPDATE YOUR RANK
           ------------------------------------------------- */

        if (
            currentPlayerIndex !==
            -1
        ) {

            updateYourLeaderboardRank(
                currentPlayerIndex + 1,
                players.length
            );

        } else {

            /*
             * The current user is not yet registered in
             * game_leaderboard.
             *
             * Calculate the position their local score
             * would occupy.
             */

            const localPoints =
                Number(
                    getBattlePoints() || 0
                );

            const calculatedRank =
                players.filter(
                    function(player) {

                        return (
                            Number(
                                player.points || 0
                            ) >
                            localPoints
                        );
                    }
                ).length + 1;

            updateYourLeaderboardRank(
                calculatedRank,
                players.length + 1
            );
        }


        /* -------------------------------------------------
           DEBUG INFORMATION
           ------------------------------------------------- */

        console.log(
            "GLOBAL LEADERBOARD PLAYERS:",
            players.length
        );

        console.log(
            "GLOBAL LEADERBOARD:",
            players
        );


    } catch (error) {

        console.error(
            "GLOBAL LEADERBOARD ERROR:",
            error
        );


        /* -----------------------------------------------
           SHOW CLEAN ERROR
           ----------------------------------------------- */

        rows.innerHTML = `
            <div class="leaderboard-row">
                <span>⚠️</span>
                <span>Leaderboard temporarily unavailable</span>
                <strong>—</strong>
            </div>
        `;


        /* -----------------------------------------------
           KEEP LOCAL SCORE VISIBLE
           ----------------------------------------------- */

        if (
            $("yourBattlePoints")
        ) {

            $("yourBattlePoints")
                .textContent =
                Number(
                    getBattlePoints() || 0
                );
        }
    }
}


/* =========================================================
   REFRESH LEADERBOARD
   ========================================================= */

async function refreshLeaderboard() {

    await updateLeaderboardUI();
}


/* =========================================================
   REALTIME GLOBAL LEADERBOARD
   ========================================================= */

let leaderboardRealtimeChannel =
    null;


async function subscribeToLeaderboard() {

    try {

        const client =
            getSupabase();


        /* -------------------------------------------------
           REMOVE PREVIOUS SUBSCRIPTION
           ------------------------------------------------- */

        if (
            leaderboardRealtimeChannel
        ) {

            try {

                await client.removeChannel(
                    leaderboardRealtimeChannel
                );

            } catch (_) {}

            leaderboardRealtimeChannel =
                null;
        }


        /* -------------------------------------------------
           CREATE GLOBAL REALTIME CHANNEL
           ------------------------------------------------- */

        leaderboardRealtimeChannel =
            client
                .channel(
                    "global-game-leaderboard"
                )
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table:
                            "game_leaderboard"
                    },
                    function(payload) {

                        console.log(
                            "GLOBAL LEADERBOARD CHANGED:",
                            payload
                        );


                        /*
                         * Wait briefly for the database
                         * transaction to finish before
                         * requesting the updated rows.
                         */

                        setTimeout(
                            function() {

                                updateLeaderboardUI();

                            },
                            300
                        );
                    }
                )
                .subscribe(
                    function(status) {

                        console.log(
                            "Leaderboard realtime:",
                            status
                        );
                    }
                );

    } catch (error) {

        console.warn(
            "Leaderboard realtime subscription failed:",
            error
        );
    }
}


/* =========================================================
   INITIALIZE LEADERBOARD
   ========================================================= */

async function initializeLeaderboard() {

    try {

        await updateLeaderboardUI();

    } catch (error) {

        console.error(
            "Initial leaderboard load failed:",
            error
        );
    }


    try {

        await subscribeToLeaderboard();

    } catch (error) {

        console.warn(
            "Leaderboard realtime initialization failed:",
            error
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

window.joinExistingMatch =
    joinExistingMatch;

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

