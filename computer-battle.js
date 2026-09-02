/* =========================================================
   STUDYMIND AI — COMPUTER BATTLE
   FULL CORRECTED VERSION
   ---------------------------------------------------------
   Features:
   - You vs Computer
   - 10 questions per battle
   - 15 seconds per question
   - Expanded Nigerian / Senior Secondary curriculum
   - Subject + topic selection
   - Study-plan subject/topic integration
   - AI question generation
   - Reliable fallback questions
   - Battle scoring
   - Battle Points
   - Wins / losses / draws
   - Supabase leaderboard
   - Free battle limit
   - No 1v1 logic
========================================================= */


/* =========================================================
   CONFIGURATION
========================================================= */

const QUESTIONS_PER_BATTLE = 10;
const QUESTION_TIME_LIMIT = 15;

const FREE_BATTLE_LIMIT = 5;

const AI_QUESTION_ENDPOINT = "/api/generate-questions";

const BATTLE_STORAGE_KEYS = {
    battleCount: "studyMindBattleCount"
};


/* =========================================================
   NIGERIAN / SENIOR SECONDARY CURRICULUM
========================================================= */

const NIGERIAN_CURRICULUM = {

    "Mathematics": [
        "Number and Numeration",
        "Fractions, Decimals and Percentages",
        "Ratio, Proportion and Rates",
        "Indices and Logarithms",
        "Surds",
        "Sets",
        "Algebraic Expressions",
        "Linear Equations",
        "Simultaneous Equations",
        "Quadratic Equations",
        "Polynomials",
        "Sequences and Series",
        "Variation",
        "Inequalities",
        "Graphs",
        "Coordinate Geometry",
        "Geometry",
        "Mensuration",
        "Trigonometry",
        "Statistics",
        "Probability",
        "Vectors",
        "Matrices",
        "Financial Mathematics",
        "Commercial Arithmetic"
    ],

    "English Language": [
        "Grammar",
        "Parts of Speech",
        "Sentence Structure",
        "Concord",
        "Tenses",
        "Clauses and Phrases",
        "Vocabulary Development",
        "Synonyms",
        "Antonyms",
        "Comprehension",
        "Summary Writing",
        "Lexis and Structure",
        "Oral English",
        "Speech Sounds",
        "Stress",
        "Intonation",
        "Essay Writing",
        "Letter Writing",
        "Article Writing",
        "Report Writing",
        "Debate",
        "Argumentative Writing",
        "Narrative Writing",
        "Descriptive Writing"
    ],

    "Physics": [
        "Measurement",
        "Scalars and Vectors",
        "Motion",
        "Speed and Velocity",
        "Acceleration",
        "Forces",
        "Newton's Laws of Motion",
        "Work, Energy and Power",
        "Machines",
        "Momentum",
        "Gravitation",
        "Pressure",
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
        "Electromagnetism",
        "Magnetism",
        "Electromagnetic Induction",
        "Atomic Physics",
        "Radioactivity",
        "Semiconductors",
        "Electronics"
    ],

    "Chemistry": [
        "Matter",
        "Atomic Structure",
        "Periodic Table",
        "Chemical Bonding",
        "Mole Concept",
        "Chemical Formulae",
        "Chemical Equations",
        "Stoichiometry",
        "Acids, Bases and Salts",
        "pH",
        "Redox Reactions",
        "Electrochemistry",
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
        "Water",
        "Air",
        "Environmental Chemistry",
        "Metals",
        "Non-metals",
        "Qualitative Analysis",
        "Rates of Reaction",
        "Equilibrium",
        "Energy Changes"
    ],

    "Biology": [
        "Characteristics of Living Things",
        "Cell Structure",
        "Cell Division",
        "Levels of Organisation",
        "Nutrition",
        "Photosynthesis",
        "Respiration",
        "Transport in Plants",
        "Transport in Animals",
        "Excretion",
        "Homeostasis",
        "Support and Movement",
        "Reproduction",
        "Growth",
        "Genetics",
        "Variation",
        "Evolution",
        "Ecology",
        "Food Chains",
        "Food Webs",
        "Population Studies",
        "Adaptation",
        "Classification",
        "Microorganisms",
        "Disease",
        "Human Health",
        "Digestive System",
        "Respiratory System",
        "Circulatory System",
        "Nervous System",
        "Endocrine System"
    ],

    "Further Mathematics": [
        "Sets",
        "Logic",
        "Functions",
        "Algebra",
        "Matrices",
        "Determinants",
        "Complex Numbers",
        "Polynomial Equations",
        "Sequences and Series",
        "Binomial Expansion",
        "Coordinate Geometry",
        "Vectors",
        "Trigonometry",
        "Differentiation",
        "Integration",
        "Differential Equations",
        "Mechanics",
        "Statistics",
        "Probability"
    ],

    "Agricultural Science": [
        "Agriculture",
        "Farm Management",
        "Soil Science",
        "Soil Fertility",
        "Crop Production",
        "Crop Improvement",
        "Crop Pests",
        "Crop Diseases",
        "Animal Husbandry",
        "Animal Nutrition",
        "Animal Health",
        "Livestock Production",
        "Fisheries",
        "Forestry",
        "Agricultural Economics",
        "Agricultural Marketing",
        "Farm Tools",
        "Farm Machinery",
        "Agricultural Extension",
        "Environmental Conservation"
    ],

    "Geography": [
        "Map Reading",
        "Scale",
        "Direction and Bearings",
        "Relief",
        "Weather",
        "Climate",
        "Rocks",
        "Weathering",
        "Erosion",
        "Drainage",
        "Rivers",
        "Soils",
        "Vegetation",
        "Population",
        "Settlement",
        "Urbanisation",
        "Agriculture",
        "Industry",
        "Transportation",
        "Trade",
        "Environmental Resources",
        "Nigeria's Geography",
        "West Africa",
        "Africa",
        "World Geography"
    ],

    "Government": [
        "Meaning of Government",
        "Political Socialisation",
        "Political Participation",
        "Constitution",
        "Democracy",
        "Rule of Law",
        "Separation of Powers",
        "Checks and Balances",
        "Legislature",
        "Executive",
        "Judiciary",
        "Political Parties",
        "Pressure Groups",
        "Electoral Systems",
        "Elections",
        "Public Opinion",
        "Citizenship",
        "Human Rights",
        "Local Government",
        "Federalism",
        "Unitary Government",
        "Confederation",
        "Public Administration",
        "International Relations",
        "United Nations",
        "African Union",
        "ECOWAS",
        "Nigerian Political Development"
    ],

    "Nigerian History": [
        "Early Nigerian Societies",
        "Hausa States",
        "Kanem-Borno",
        "Oyo Empire",
        "Benin Kingdom",
        "Igbo Society",
        "Niger Delta States",
        "Trans-Saharan Trade",
        "European Contact",
        "Missionary Activities",
        "Colonial Rule",
        "Amalgamation",
        "Nationalism",
        "Independence",
        "First Republic",
        "Military Rule",
        "Civil War",
        "Second Republic",
        "Third Republic",
        "Fourth Republic",
        "Nigerian Leaders",
        "Constitutional Development"
    ],

    "Christian Religious Studies": [
        "Creation",
        "The Fall of Man",
        "Covenant",
        "Abraham",
        "Moses",
        "The Exodus",
        "The Ten Commandments",
        "Kingship in Israel",
        "Prophets",
        "The Birth of Jesus",
        "The Ministry of Jesus",
        "Parables",
        "Miracles",
        "Death and Resurrection",
        "The Early Church",
        "Paul's Ministry",
        "Christian Ethics",
        "Love",
        "Forgiveness",
        "Faith",
        "Justice",
        "Leadership"
    ],

    "CRS": [
        "Creation",
        "The Fall of Man",
        "Covenant",
        "Abraham",
        "Moses",
        "The Exodus",
        "The Ten Commandments",
        "Kingship in Israel",
        "Prophets",
        "The Birth of Jesus",
        "The Ministry of Jesus",
        "Parables",
        "Miracles",
        "Death and Resurrection",
        "The Early Church",
        "Paul's Ministry",
        "Christian Ethics",
        "Love",
        "Forgiveness",
        "Faith",
        "Justice",
        "Leadership"
    ],

    "Islamic Religious Studies": [
        "Tawhid",
        "Shahadah",
        "Salah",
        "Zakah",
        "Sawm",
        "Hajj",
        "Quran",
        "Hadith",
        "Prophets",
        "Life of Prophet Muhammad",
        "Hijrah",
        "Madinah",
        "Islamic Brotherhood",
        "Islamic Law",
        "Marriage",
        "Inheritance",
        "Business Ethics",
        "Moral Conduct"
    ],

    "IRS": [
        "Tawhid",
        "Shahadah",
        "Salah",
        "Zakah",
        "Sawm",
        "Hajj",
        "Quran",
        "Hadith",
        "Prophets",
        "Life of Prophet Muhammad",
        "Hijrah",
        "Madinah",
        "Islamic Brotherhood",
        "Islamic Law",
        "Marriage",
        "Inheritance",
        "Business Ethics",
        "Moral Conduct"
    ],

    "Literature in English": [
        "Poetry",
        "Drama",
        "Prose",
        "Literary Devices",
        "Figures of Speech",
        "Characterisation",
        "Plot",
        "Setting",
        "Theme",
        "Narrative Technique",
        "Point of View",
        "Conflict",
        "Tragedy",
        "Comedy",
        "Satire",
        "Symbolism",
        "Irony"
    ],

    "Literature": [
        "Poetry",
        "Drama",
        "Prose",
        "Literary Devices",
        "Figures of Speech",
        "Characterisation",
        "Plot",
        "Setting",
        "Theme",
        "Narrative Technique",
        "Point of View",
        "Conflict",
        "Tragedy",
        "Comedy",
        "Satire",
        "Symbolism",
        "Irony"
    ],

    "Economics": [
        "Basic Economic Concepts",
        "Scarcity",
        "Choice",
        "Opportunity Cost",
        "Demand",
        "Supply",
        "Elasticity",
        "Market Structures",
        "Price Determination",
        "Production",
        "Factors of Production",
        "Division of Labour",
        "Population",
        "Labour Market",
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
        "Economic Growth",
        "Nigeria's Economy"
    ],

    "Accounting": [
        "Introduction to Accounting",
        "Accounting Concepts",
        "Accounting Principles",
        "Source Documents",
        "Books of Original Entry",
        "Ledger",
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
        "Public Sector Accounting"
    ],

    "Commerce": [
        "Introduction to Commerce",
        "Trade",
        "Home Trade",
        "Foreign Trade",
        "Retail Trade",
        "Wholesale Trade",
        "Channels of Distribution",
        "Transportation",
        "Communication",
        "Warehousing",
        "Insurance",
        "Banking",
        "Stock Exchange",
        "Business Ownership",
        "Consumer Protection",
        "Advertising",
        "Marketing"
    ],

    "Marketing": [
        "Meaning of Marketing",
        "Marketing Concepts",
        "Market Research",
        "Consumer Behaviour",
        "Product",
        "Pricing",
        "Promotion",
        "Distribution",
        "Advertising",
        "Sales Promotion",
        "Personal Selling",
        "Branding",
        "Packaging",
        "Market Segmentation",
        "Digital Marketing"
    ],

    "Digital Technologies": [
        "Computer Fundamentals",
        "Hardware",
        "Software",
        "Operating Systems",
        "Data Representation",
        "Number Systems",
        "Algorithms",
        "Flowcharts",
        "Programming",
        "Databases",
        "Networking",
        "Internet",
        "Cybersecurity",
        "Artificial Intelligence",
        "Cloud Computing",
        "Digital Citizenship",
        "Information Systems"
    ],

    "Computer Studies": [
        "Computer Fundamentals",
        "Computer Hardware",
        "Computer Software",
        "Input Devices",
        "Output Devices",
        "Storage Devices",
        "Operating Systems",
        "Data Processing",
        "Computer Networks",
        "Internet",
        "Programming",
        "Algorithms",
        "Flowcharts",
        "Databases",
        "Computer Security"
    ],

    "Data Processing": [
        "Data",
        "Information",
        "Data Processing",
        "Computer Hardware",
        "Computer Software",
        "Operating Systems",
        "Word Processing",
        "Spreadsheets",
        "Databases",
        "Presentations",
        "Internet",
        "Networking",
        "Information Security"
    ],

    "Technical Drawing": [
        "Drawing Instruments",
        "Geometrical Construction",
        "Lettering",
        "Scales",
        "Orthographic Projection",
        "Isometric Drawing",
        "Oblique Projection",
        "Sectional Views",
        "Building Drawing",
        "Machine Drawing",
        "Dimensioning",
        "Perspective Drawing"
    ],

    "Basic Technology": [
        "Workshop Safety",
        "Tools",
        "Materials",
        "Woodwork",
        "Metalwork",
        "Electricity",
        "Electronics",
        "Building Construction",
        "Machines",
        "Maintenance",
        "Technical Drawing"
    ],

    "Basic Science": [
        "Living Things",
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
        "Human Health"
    ],

    "Basic Electricity": [
        "Electrical Safety",
        "Electric Current",
        "Voltage",
        "Resistance",
        "Ohm's Law",
        "Series Circuits",
        "Parallel Circuits",
        "Electrical Energy",
        "Electrical Power",
        "Magnetism",
        "Transformers",
        "Domestic Wiring"
    ],

    "Basic Electronics": [
        "Electronic Components",
        "Resistors",
        "Capacitors",
        "Diodes",
        "Transistors",
        "Integrated Circuits",
        "Rectifiers",
        "Amplifiers",
        "Digital Electronics",
        "Logic Gates",
        "Power Supplies"
    ],

    "Physical Education": [
        "Physical Fitness",
        "Health and Fitness",
        "Athletics",
        "Football",
        "Basketball",
        "Volleyball",
        "Handball",
        "Swimming",
        "Gymnastics",
        "First Aid",
        "Nutrition",
        "Sportsmanship"
    ],

    "Health Education": [
        "Personal Health",
        "Community Health",
        "Nutrition",
        "Personal Hygiene",
        "Disease Prevention",
        "First Aid",
        "Mental Wellbeing",
        "Physical Fitness",
        "Drug Education",
        "Environmental Health",
        "Family Health"
    ],

    "Foods and Nutrition": [
        "Nutrients",
        "Balanced Diet",
        "Food Groups",
        "Meal Planning",
        "Food Preparation",
        "Food Preservation",
        "Food Safety",
        "Kitchen Equipment",
        "Consumer Education",
        "Nutrition and Health"
    ],

    "Home Management": [
        "Family",
        "Home Management",
        "Household Resources",
        "Time Management",
        "Budgeting",
        "Consumer Education",
        "Clothing",
        "Food Management",
        "Home Safety",
        "Interior Management"
    ],

    "Catering Craft": [
        "Kitchen Safety",
        "Kitchen Equipment",
        "Food Preparation",
        "Cooking Methods",
        "Food Hygiene",
        "Menu Planning",
        "Table Setting",
        "Baking",
        "Pastry",
        "Food Service"
    ],

    "Visual Arts": [
        "Elements of Art",
        "Principles of Design",
        "Drawing",
        "Painting",
        "Sculpture",
        "Ceramics",
        "Textiles",
        "Printmaking",
        "Art History",
        "Nigerian Art",
        "African Art"
    ],

    "Music": [
        "Elements of Music",
        "Notation",
        "Rhythm",
        "Melody",
        "Harmony",
        "Musical Instruments",
        "Voice",
        "Nigerian Music",
        "African Music",
        "Music History"
    ],

    "French": [
        "Greetings",
        "Introductions",
        "Numbers",
        "Days and Months",
        "Family",
        "School",
        "Food",
        "Travel",
        "Grammar",
        "Vocabulary",
        "Comprehension",
        "Conversation"
    ],

    "Arabic": [
        "Alphabet",
        "Vocabulary",
        "Grammar",
        "Reading",
        "Writing",
        "Comprehension",
        "Conversation",
        "Culture"
    ],

    "Citizenship and Heritage Studies": [
        "Citizenship",
        "National Identity",
        "Human Rights",
        "Responsibilities",
        "Democracy",
        "Rule of Law",
        "Civic Participation",
        "Nigerian Heritage",
        "Culture",
        "National Values",
        "Peace",
        "Unity"
    ],

    "Civic Education": [
        "Citizenship",
        "Human Rights",
        "Responsibilities",
        "Democracy",
        "Rule of Law",
        "National Values",
        "Political Participation",
        "Constitution",
        "National Identity",
        "Peace and Conflict Resolution"
    ],

    "Yoruba": [
        "Grammar",
        "Vocabulary",
        "Comprehension",
        "Oral Literature",
        "Written Literature",
        "Culture",
        "Proverbs",
        "Folktales"
    ],

    "Igbo": [
        "Grammar",
        "Vocabulary",
        "Comprehension",
        "Oral Literature",
        "Written Literature",
        "Culture",
        "Proverbs",
        "Folktales"
    ],

    "Office Practice": [
        "Office Organisation",
        "Office Equipment",
        "Communication",
        "Filing",
        "Mail Handling",
        "Records Management",
        "Reception",
        "Meetings",
        "Office Safety"
    ],

    "Book Keeping": [
        "Introduction to Book Keeping",
        "Double Entry",
        "Ledger",
        "Cash Book",
        "Trial Balance",
        "Final Accounts",
        "Bank Reconciliation",
        "Depreciation"
    ],

    "Insurance": [
        "Meaning of Insurance",
        "Principles of Insurance",
        "Types of Insurance",
        "Life Assurance",
        "Fire Insurance",
        "Motor Insurance",
        "Marine Insurance",
        "Insurance Claims"
    ],

    "Tourism": [
        "Meaning of Tourism",
        "Types of Tourism",
        "Tourist Attractions",
        "Hospitality",
        "Travel",
        "Transportation",
        "Tourism in Nigeria",
        "Tourism Development"
    ],

    "Fisheries": [
        "Fish Biology",
        "Fish Farming",
        "Aquaculture",
        "Fish Nutrition",
        "Fish Breeding",
        "Fish Diseases",
        "Fish Processing",
        "Fisheries Management"
    ],

    "Animal Husbandry": [
        "Animal Nutrition",
        "Animal Breeding",
        "Animal Health",
        "Livestock Management",
        "Poultry",
        "Cattle",
        "Goats",
        "Sheep",
        "Pigs",
        "Animal Products"
    ],

    "Livestock Farming": [
        "Livestock Management",
        "Animal Nutrition",
        "Animal Breeding",
        "Animal Health",
        "Poultry",
        "Cattle",
        "Goats",
        "Sheep",
        "Pigs"
    ],

    "Horticulture and Crop Production": [
        "Crop Production",
        "Soil Preparation",
        "Planting",
        "Crop Maintenance",
        "Pests",
        "Diseases",
        "Harvesting",
        "Post-Harvest Handling",
        "Horticulture"
    ],

    "Solar PV Installation and Maintenance": [
        "Solar Energy",
        "Solar Panels",
        "Photovoltaic Systems",
        "Batteries",
        "Charge Controllers",
        "Inverters",
        "Electrical Safety",
        "System Maintenance"
    ],

    "Fashion Design and Garment Making": [
        "Textiles",
        "Measurements",
        "Pattern Making",
        "Sewing",
        "Garment Construction",
        "Fashion Illustration",
        "Clothing Maintenance"
    ],

    "Beauty and Cosmetology": [
        "Hair Care",
        "Skin Care",
        "Nail Care",
        "Beauty Products",
        "Salon Safety",
        "Personal Hygiene",
        "Cosmetology Tools"
    ],

    "Computer Hardware and GSM Repairs": [
        "Computer Components",
        "Motherboards",
        "Processors",
        "Memory",
        "Storage",
        "Power Supplies",
        "Mobile Devices",
        "GSM Technology",
        "Hardware Maintenance"
    ]
};


/* =========================================================
   SUBJECT ALIASES
========================================================= */

const SUBJECT_ALIASES = {
    "math": "Mathematics",
    "mathematics": "Mathematics",
    "general mathematics": "Mathematics",

    "english": "English Language",
    "english language": "English Language",

    "physics": "Physics",

    "chemistry": "Chemistry",

    "biology": "Biology",

    "further mathematics": "Further Mathematics",
    "further math": "Further Mathematics",

    "agriculture": "Agricultural Science",
    "agricultural science": "Agricultural Science",

    "geo": "Geography",
    "geography": "Geography",

    "government": "Government",

    "history": "Nigerian History",
    "nigerian history": "Nigerian History",

    "crs": "Christian Religious Studies",
    "christian religious studies": "Christian Religious Studies",

    "irs": "Islamic Religious Studies",
    "islamic religious studies": "Islamic Religious Studies",

    "literature": "Literature in English",
    "literature in english": "Literature in English",

    "economics": "Economics",

    "accounting": "Accounting",

    "commerce": "Commerce",

    "marketing": "Marketing",

    "computer": "Computer Studies",
    "computer studies": "Computer Studies",
    "data processing": "Data Processing",

    "digital technology": "Digital Technologies",
    "digital technologies": "Digital Technologies",

    "technical drawing": "Technical Drawing",

    "basic technology": "Basic Technology",

    "basic science": "Basic Science",

    "physical education": "Physical Education",

    "health education": "Health Education",

    "foods and nutrition": "Foods and Nutrition",

    "home management": "Home Management",

    "catering": "Catering Craft",
    "catering craft": "Catering Craft",

    "visual arts": "Visual Arts",

    "music": "Music",

    "french": "French",

    "arabic": "Arabic",

    "civic education": "Civic Education",

    "citizenship and heritage studies":
        "Citizenship and Heritage Studies",

    "yoruba": "Yoruba",

    "igbo": "Igbo",

    "office practice": "Office Practice",

    "book keeping": "Book Keeping",

    "bookkeeping": "Book Keeping",

    "insurance": "Insurance",

    "tourism": "Tourism",

    "fisheries": "Fisheries",

    "animal husbandry": "Animal Husbandry",

    "livestock farming": "Livestock Farming",

    "horticulture and crop production":
        "Horticulture and Crop Production",

    "solar pv installation and maintenance":
        "Solar PV Installation and Maintenance",

    "fashion design and garment making":
        "Fashion Design and Garment Making",

    "beauty and cosmetology":
        "Beauty and Cosmetology",

    "computer hardware and gsm repairs":
        "Computer Hardware and GSM Repairs"
};


/* =========================================================
   SUPABASE
========================================================= */

function getComputerBattleSupabase() {

    if (
        window.supabaseClient &&
        window.supabaseClient.auth
    ) {
        return window.supabaseClient;
    }

    return null;
}


async function waitForSupabaseClient(timeout = 10000) {

    const start = Date.now();

    while (Date.now() - start < timeout) {

        const client = getComputerBattleSupabase();

        if (client) {
            return client;
        }

        await new Promise(resolve => {
            setTimeout(resolve, 100);
        });
    }

    return null;
}


/* =========================================================
   GLOBAL BATTLE STATE
========================================================= */

let battleState = {

    user: null,

    subject: "",
    topic: "",

    questions: [],
    currentQuestionIndex: 0,

    playerScore: 0,
    computerScore: 0,

    timeLeft: QUESTION_TIME_LIMIT,
    timerInterval: null,

    answered: false,

    battleActive: false,

    battleStartedAt: null,

    questionsAnswered: 0
};


/* =========================================================
   DOM SHORTCUT
========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   TEXT UTILITIES
========================================================= */

function cleanText(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/\s+/g, " ")
        .trim();
}


function normalizeSubjectName(subject) {

    const cleaned = cleanText(subject);

    if (!cleaned) {
        return "";
    }

    const key = cleaned.toLowerCase();

    if (SUBJECT_ALIASES[key]) {
        return SUBJECT_ALIASES[key];
    }

    const curriculumMatch =
        Object.keys(NIGERIAN_CURRICULUM).find(name =>
            name.toLowerCase() === key
        );

    if (curriculumMatch) {
        return curriculumMatch;
    }

    return cleaned;
}


function findCurriculumSubject(subject) {

    const normalized = normalizeSubjectName(subject);

    if (NIGERIAN_CURRICULUM[normalized]) {
        return normalized;
    }

    return Object.keys(NIGERIAN_CURRICULUM).find(name =>
        name.toLowerCase() === normalized.toLowerCase()
    ) || normalized;
}


/* =========================================================
   STUDY PLAN
========================================================= */

function getStudyPlan() {

    const possibleKeys = [
        "studyMindPlan",
        "studyData",
        "studyPlan"
    ];

    for (const key of possibleKeys) {

        try {

            const raw = localStorage.getItem(key);

            if (!raw) {
                continue;
            }

            const parsed = JSON.parse(raw);

            if (parsed) {
                return parsed;
            }

        } catch (error) {

            console.warn(
                `Could not parse localStorage key: ${key}`,
                error
            );
        }
    }

    return null;
}


/* =========================================================
   PLAN SUBJECT EXTRACTION
========================================================= */

function getSubjectName(item) {

    if (!item) {
        return "";
    }

    if (typeof item === "string") {
        return normalizeSubjectName(item);
    }

    if (typeof item !== "object") {
        return "";
    }

    return normalizeSubjectName(
        item.subject ||
        item.subjectName ||
        item.name ||
        item.title ||
        ""
    );
}


function getTopicName(item) {

    if (!item) {
        return "";
    }

    if (typeof item === "string") {
        return cleanText(item);
    }

    if (typeof item !== "object") {
        return "";
    }

    return cleanText(
        item.topic ||
        item.topicName ||
        item.title ||
        item.name ||
        item.description ||
        ""
    );
}


/* =========================================================
   EXTRACT SUBJECTS
========================================================= */

function extractSubjects(plan) {

    const subjects = new Set();

    /*
       IMPORTANT:
       Always expose the complete curriculum.

       This prevents the dropdown from becoming restricted
       to whatever subjects happen to exist in localStorage.
    */

    Object.keys(NIGERIAN_CURRICULUM).forEach(subject => {
        subjects.add(subject);
    });


    if (!plan) {
        return Array.from(subjects).sort();
    }


    const addSubject = value => {

        const subject = normalizeSubjectName(value);

        if (subject) {
            subjects.add(subject);
        }
    };


    const processArray = array => {

        if (!Array.isArray(array)) {
            return;
        }

        array.forEach(item => {

            if (typeof item === "string") {

                addSubject(item);

                return;
            }


            if (!item || typeof item !== "object") {
                return;
            }


            const subject =
                item.subject ||
                item.subjectName ||
                item.subject_title;

            if (subject) {
                addSubject(subject);
            }


            if (Array.isArray(item.subjects)) {

                item.subjects.forEach(subjectItem => {

                    addSubject(
                        getSubjectName(subjectItem)
                    );
                });
            }
        });
    };


    if (Array.isArray(plan)) {
        processArray(plan);
    }


    if (plan.subjects) {
        processArray(plan.subjects);
    }


    if (plan.subjectList) {
        processArray(plan.subjectList);
    }


    if (plan.studySubjects) {
        processArray(plan.studySubjects);
    }


    if (Array.isArray(plan.schedule)) {
        processArray(plan.schedule);
    }


    if (Array.isArray(plan.timetable)) {
        processArray(plan.timetable);
    }


    return Array.from(subjects).sort(
        (a, b) => a.localeCompare(b)
    );
}


/* =========================================================
   EXTRACT TOPICS
========================================================= */

function extractTopics(plan, selectedSubject) {

    const topics = new Set();

    const normalizedSelectedSubject =
        normalizeSubjectName(selectedSubject);


    /*
       1. CURRICULUM TOPICS
    */

    const curriculumSubject =
        findCurriculumSubject(normalizedSelectedSubject);

    if (NIGERIAN_CURRICULUM[curriculumSubject]) {

        NIGERIAN_CURRICULUM[curriculumSubject]
            .forEach(topic => topics.add(topic));
    }


    /*
       2. STUDY PLAN TOPICS
    */

    if (plan) {

        const processTopicArray = array => {

            if (!Array.isArray(array)) {
                return;
            }


            array.forEach(item => {

                if (typeof item === "string") {

                    /*
                       Plain strings may belong to the plan's
                       currently selected subject.

                       We include them because there is no
                       subject metadata attached to the string.
                    */

                    const topic = cleanText(item);

                    if (topic) {
                        topics.add(topic);
                    }

                    return;
                }


                if (!item || typeof item !== "object") {
                    return;
                }


                const topicSubject =
                    normalizeSubjectName(
                        item.subject ||
                        item.subjectName ||
                        item.subject_title ||
                        ""
                    );


                /*
                   If an object explicitly belongs to another
                   subject, do NOT add it.
                */

                if (
                    topicSubject &&
                    topicSubject !== normalizedSelectedSubject
                ) {
                    return;
                }


                const topic = getTopicName(item);

                if (topic) {
                    topics.add(topic);
                }
            });
        };


        if (Array.isArray(plan)) {
            processTopicArray(plan);
        }


        processTopicArray(plan.topics);
        processTopicArray(plan.studyTopics);
        processTopicArray(plan.topicList);
        processTopicArray(plan.subjectTopics);
        processTopicArray(plan.schedule);
        processTopicArray(plan.timetable);


        if (Array.isArray(plan.subjects)) {

            plan.subjects.forEach(subjectItem => {

                if (!subjectItem) {
                    return;
                }


                if (typeof subjectItem === "string") {
                    return;
                }


                const subjectName =
                    getSubjectName(subjectItem);


                if (
                    subjectName &&
                    subjectName !== normalizedSelectedSubject
                ) {
                    return;
                }


                processTopicArray(
                    subjectItem.topics
                );
            });
        }
    }


    return Array.from(topics)
        .map(cleanText)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
}


/* =========================================================
   FALLBACK TOPICS
========================================================= */

function getFallbackTopics(subject) {

    const curriculumSubject =
        findCurriculumSubject(subject);

    if (NIGERIAN_CURRICULUM[curriculumSubject]) {

        return [
            ...NIGERIAN_CURRICULUM[curriculumSubject]
        ];
    }

    return [
        "General Knowledge",
        "Core Concepts",
        "Revision",
        "Practice Questions"
    ];
}


/* =========================================================
   LOAD SUBJECT DROPDOWN
========================================================= */

function loadBattleSetup() {

    const subjectSelect = $("subjectSelect");
    const topicSelect = $("topicSelect");

    if (!subjectSelect) {
        console.error(
            "computer-battle.js: subjectSelect not found."
        );

        return;
    }


    const plan = getStudyPlan();

    const subjects = extractSubjects(plan);


    /*
       Clear existing HTML options.

       This is important because an older hard-coded
       Math / Geometry option can otherwise remain.
    */

    subjectSelect.innerHTML = "";


    const subjectPlaceholder =
        document.createElement("option");

    subjectPlaceholder.value = "";
    subjectPlaceholder.textContent =
        "Choose a subject";

    subjectPlaceholder.disabled = true;
    subjectPlaceholder.selected = true;

    subjectSelect.appendChild(
        subjectPlaceholder
    );


    subjects.forEach(subject => {

        const option =
            document.createElement("option");

        option.value = subject;
        option.textContent = subject;

        subjectSelect.appendChild(option);
    });


    /*
       Default to Mathematics if available.
    */

    if (
        subjects.includes("Mathematics")
    ) {

        subjectSelect.value =
            "Mathematics";
    }


    /*
       Populate topic dropdown.
    */

    updateTopicOptions();


    /*
       Subject change listener.
       Native select controls fire a change event when
       the selected value is committed. 
    */

    subjectSelect.onchange = updateTopicOptions;


    if (topicSelect) {

        topicSelect.onchange = function () {

            battleState.topic =
                topicSelect.value;
        };
    }


    console.log(
        `Computer Battle: loaded ${subjects.length} subjects.`
    );

    console.log(
        "Subjects:",
        subjects
    );
}


/* =========================================================
   UPDATE TOPIC DROPDOWN
========================================================= */

function updateTopicOptions() {

    const subjectSelect = $("subjectSelect");
    const topicSelect = $("topicSelect");

    if (!subjectSelect || !topicSelect) {
        return;
    }


    const selectedSubject =
        normalizeSubjectName(
            subjectSelect.value
        );


    topicSelect.innerHTML = "";


    const placeholder =
        document.createElement("option");

    placeholder.value = "";
    placeholder.textContent =
        "Choose a topic";

    placeholder.disabled = true;
    placeholder.selected = true;

    topicSelect.appendChild(
        placeholder
    );


    if (!selectedSubject) {

        topicSelect.disabled = true;

        return;
    }


    let topics =
        extractTopics(
            getStudyPlan(),
            selectedSubject
        );


    if (!topics.length) {

        topics =
            getFallbackTopics(
                selectedSubject
            );
    }


    topics.forEach(topic => {

        const option =
            document.createElement("option");

        option.value = topic;
        option.textContent = topic;

        topicSelect.appendChild(option);
    });


    topicSelect.disabled = false;


    /*
       Select first topic automatically.
    */

    if (topics.length > 0) {

        topicSelect.value =
            topics[0];

        battleState.topic =
            topics[0];
    }


    battleState.subject =
        selectedSubject;


    console.log(
        `Topics for ${selectedSubject}:`,
        topics
    );
}


/* =========================================================
   BATTLE COUNT
========================================================= */

function getBattleCount() {

    const count =
        Number(
            localStorage.getItem(
                BATTLE_STORAGE_KEYS.battleCount
            )
        );

    return Number.isFinite(count)
        ? count
        : 0;
}


function setBattleCount(count) {

    localStorage.setItem(
        BATTLE_STORAGE_KEYS.battleCount,
        String(count)
    );
}


function incrementBattleCount() {

    const nextCount =
        getBattleCount() + 1;

    setBattleCount(nextCount);

    return nextCount;
}


function hasFreeBattleAvailable() {

    return getBattleCount() <
        FREE_BATTLE_LIMIT;
}


/* =========================================================
   UI HELPERS
========================================================= */

function showElement(id) {

    const element = $(id);

    if (element) {
        element.style.display = "";
    }
}


function hideElement(id) {

    const element = $(id);

    if (element) {
        element.style.display = "none";
    }
}


function setText(id, value) {

    const element = $(id);

    if (element) {
        element.textContent =
            value ?? "";
    }
}


/* =========================================================
   BATTLE SCREENS
========================================================= */

function showSetupScreen() {

    showElement("battleSetup");

    hideElement("battleLoading");
    hideElement("battleScreen");
    hideElement("battleResults");
}


function showLoadingScreen() {

    hideElement("battleSetup");

    showElement("battleLoading");

    hideElement("battleScreen");
    hideElement("battleResults");
}


function showBattleScreen() {

    hideElement("battleSetup");
    hideElement("battleLoading");

    showElement("battleScreen");

    hideElement("battleResults");
}


function showResultsScreen() {

    hideElement("battleSetup");
    hideElement("battleLoading");
    hideElement("battleScreen");

    showElement("battleResults");
}


/* =========================================================
   ERROR DISPLAY
========================================================= */

function showBattleError(message) {

    console.error(
        "Computer Battle:",
        message
    );


    const loading =
        $("battleLoading");

    if (loading) {

        loading.innerHTML = `
            <div class="battle-error">
                <div class="battle-error-icon">⚠️</div>

                <h3>Battle Could Not Start</h3>

                <p>${escapeHtml(message)}</p>

                <button
                    type="button"
                    onclick="returnToBattleSetup()"
                >
                    Try Again
                </button>
            </div>
        `;
    }
}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   FALLBACK QUESTION DATABASE
========================================================= */

const FALLBACK_QUESTIONS = {

    "Mathematics": [
        {
            question:
                "What is the value of 2 + 3 × 4?",
            options: [
                "20",
                "14",
                "24",
                "10"
            ],
            answer: 1,
            explanation:
                "Multiplication is performed before addition, so 3 × 4 = 12 and 2 + 12 = 14."
        },

        {
            question:
                "What is the square root of 144?",
            options: [
                "10",
                "11",
                "12",
                "14"
            ],
            answer: 2,
            explanation:
                "12 × 12 = 144."
        },

        {
            question:
                "If x + 7 = 15, what is x?",
            options: [
                "6",
                "7",
                "8",
                "9"
            ],
            answer: 2,
            explanation:
                "Subtract 7 from both sides: x = 8."
        },

        {
            question:
                "What is 25% of 200?",
            options: [
                "25",
                "40",
                "50",
                "75"
            ],
            answer: 2,
            explanation:
                "25% = 0.25, and 0.25 × 200 = 50."
        },

        {
            question:
                "What is the next number in the sequence 2, 4, 8, 16, ...?",
            options: [
                "18",
                "24",
                "30",
                "32"
            ],
            answer: 3,
            explanation:
                "Each number is multiplied by 2."
        }
    ],

    "Physics": [
        {
            question:
                "What is the SI unit of force?",
            options: [
                "Joule",
                "Newton",
                "Watt",
                "Pascal"
            ],
            answer: 1,
            explanation:
                "Force is measured in newtons (N)."
        },

        {
            question:
                "Which quantity is measured in metres per second?",
            options: [
                "Mass",
                "Force",
                "Speed",
                "Energy"
            ],
            answer: 2,
            explanation:
                "Speed is measured in metres per second (m/s)."
        }
    ],

    "Chemistry": [
        {
            question:
                "What is the chemical symbol for oxygen?",
            options: [
                "Ox",
                "O",
                "Og",
                "C"
            ],
            answer: 1,
            explanation:
                "The chemical symbol for oxygen is O."
        },

        {
            question:
                "A substance with a pH below 7 is generally what?",
            options: [
                "Acidic",
                "Neutral",
                "Alkaline",
                "Metallic"
            ],
            answer: 0,
            explanation:
                "Solutions with pH below 7 are acidic."
        }
    ],

    "Biology": [
        {
            question:
                "What is the basic structural unit of life?",
            options: [
                "Tissue",
                "Organ",
                "Cell",
                "System"
            ],
            answer: 2,
            explanation:
                "The cell is the basic structural and functional unit of life."
        },

        {
            question:
                "Which organelle is primarily responsible for photosynthesis?",
            options: [
                "Nucleus",
                "Chloroplast",
                "Ribosome",
                "Mitochondrion"
            ],
            answer: 1,
            explanation:
                "Photosynthesis occurs mainly in chloroplasts."
        }
    ],

    "English Language": [
        {
            question:
                "Which word is closest in meaning to 'rapid'?",
            options: [
                "Slow",
                "Quick",
                "Weak",
                "Late"
            ],
            answer: 1,
            explanation:
                "Rapid means quick or fast."
        },

        {
            question:
                "Which of these is a noun?",
            options: [
                "Beautiful",
                "Quickly",
                "Teacher",
                "Run"
            ],
            answer: 2,
            explanation:
                "Teacher is a noun because it names a person."
        }
    ],

    "Government": [
        {
            question:
                "Which arm of government interprets the law?",
            options: [
                "Executive",
                "Legislature",
                "Judiciary",
                "Civil Service"
            ],
            answer: 2,
            explanation:
                "The judiciary interprets laws."
        }
    ],

    "Economics": [
        {
            question:
                "What is the basic economic problem?",
            options: [
                "Inflation",
                "Scarcity",
                "Taxation",
                "Unemployment"
            ],
            answer: 1,
            explanation:
                "Scarcity arises because resources are limited while wants are unlimited."
        }
    ],

    "Computer Studies": [
        {
            question:
                "Which device is commonly used to enter text into a computer?",
            options: [
                "Monitor",
                "Keyboard",
                "Speaker",
                "Projector"
            ],
            answer: 1,
            explanation:
                "A keyboard is an input device used to enter text."
        }
    ],

    "Digital Technologies": [
        {
            question:
                "What does CPU stand for?",
            options: [
                "Central Processing Unit",
                "Computer Personal Utility",
                "Central Program User",
                "Computer Processing Utility"
            ],
            answer: 0,
            explanation:
                "CPU stands for Central Processing Unit."
        }
    ]
};


/* =========================================================
   GENERIC FALLBACK QUESTION
========================================================= */

function createGenericFallbackQuestion(
    subject,
    topic,
    index
) {

    const topicText =
        topic || "this topic";

    return {

        question:
            `Which statement best describes ${topicText} in ${subject}?`,

        options: [
            `It is an important concept studied in ${subject}.`,
            `It is unrelated to ${subject}.`,
            `It cannot be studied in school.`,
            `It has no practical application.`
        ],

        answer: 0,

        explanation:
            `${topicText} is a topic associated with ${subject}.`
    };
}


/* =========================================================
   GET FALLBACK QUESTIONS
========================================================= */

function getFallbackQuestions(
    subject,
    topic,
    count = QUESTIONS_PER_BATTLE
) {

    const normalizedSubject =
        findCurriculumSubject(subject);


    const database =
        FALLBACK_QUESTIONS[
            normalizedSubject
        ] || [];


    const questions = [];


    /*
       Use subject-specific questions first.
    */

    for (
        let i = 0;
        i < database.length &&
        questions.length < count;
        i++
    ) {

        questions.push({
            ...database[i],
            subject: normalizedSubject,
            topic: topic
        });
    }


    /*
       Fill remaining questions with curriculum-aware
       fallback questions.

       This is much better than replacing everything with
       Mathematics when AI returns fewer than 10 questions.
    */

    let index = 0;

    while (questions.length < count) {

        const curriculumTopics =
            NIGERIAN_CURRICULUM[
                normalizedSubject
            ] || [];


        const generatedTopic =
            topic ||
            curriculumTopics[
                index % Math.max(
                    curriculumTopics.length,
                    1
                )
            ] ||
            "Core Concepts";


        questions.push(
            createGenericFallbackQuestion(
                normalizedSubject,
                generatedTopic,
                index
            )
        );

        index++;
    }


    return questions.slice(0, count);
}


/* =========================================================
   START COMPUTER BATTLE
========================================================= */

async function startComputerBattle() {

    /*
       Prevent duplicate starts.
    */

    if (battleState.battleActive) {
        return;
    }


    const subjectSelect =
        $("subjectSelect");

    const topicSelect =
        $("topicSelect");


    const subject =
        normalizeSubjectName(
            subjectSelect?.value
        );


    const topic =
        cleanText(
            topicSelect?.value
        );


    if (!subject) {

        alert(
            "Please choose a subject before starting the battle."
        );

        return;
    }


    if (!topic) {

        alert(
            "Please choose a topic before starting the battle."
        );

        return;
    }


    /*
       FREE BATTLE LIMIT
    */

    if (!hasFreeBattleAvailable()) {

        alert(
            "You have used your 5 free battles. Premium will allow unlimited battles."
        );

        return;
    }


    /*
       Verify user.
    */

    const supabase =
        await waitForSupabaseClient();


    if (!supabase) {

        showBattleError(
            "StudyMind could not connect to Supabase. Please refresh the page and try again."
        );

        return;
    }


    try {

        const {
            data,
            error
        } = await supabase.auth.getUser();


        if (error) {
            throw error;
        }


        if (!data?.user) {

            showBattleError(
                "Please log in before starting a battle."
            );

            return;
        }


        battleState.user =
            data.user;

    } catch (error) {

        console.error(
            "Authentication error:",
            error
        );

        showBattleError(
            "We could not verify your account. Please refresh and log in again."
        );

        return;
    }


    /*
       Reset battle.
    */

    clearBattleTimer();


    battleState = {

        ...battleState,

        subject,
        topic,

        questions: [],
        currentQuestionIndex: 0,

        playerScore: 0,
        computerScore: 0,

        timeLeft: QUESTION_TIME_LIMIT,

        answered: false,

        battleActive: false,

        battleStartedAt:
            Date.now(),

        questionsAnswered: 0
    };


    showLoadingScreen();


    try {

        const questions =
            await generateBattleQuestions(
                subject,
                topic
            );


        battleState.questions =
            normalizeQuestions(
                questions,
                subject,
                topic
            );


        /*
           Guarantee exactly 10 questions.
        */

        if (
            battleState.questions.length <
            QUESTIONS_PER_BATTLE
        ) {

            const fallback =
                getFallbackQuestions(
                    subject,
                    topic,
                    QUESTIONS_PER_BATTLE
                );


            const existing =
                battleState.questions;


            for (
                let i = existing.length;
                i < QUESTIONS_PER_BATTLE;
                i++
            ) {

                existing.push(
                    fallback[i]
                );
            }
        }


        battleState.questions =
            battleState.questions.slice(
                0,
                QUESTIONS_PER_BATTLE
            );


        battleState.battleActive =
            true;


        incrementBattleCount();


        showBattleScreen();


        displayCurrentQuestion();

    } catch (error) {

        console.error(
            "Battle generation failed:",
            error
        );


        /*
           Even if the AI fails completely,
           the player should still be able to play.
        */

        battleState.questions =
            getFallbackQuestions(
                subject,
                topic,
                QUESTIONS_PER_BATTLE
            );


        battleState.battleActive =
            true;


        incrementBattleCount();


        showBattleScreen();


        displayCurrentQuestion();
    }
}


/* =========================================================
   GENERATE AI QUESTIONS
========================================================= */

async function generateBattleQuestions(
    subject,
    topic
) {

    try {

        const response =
            await fetch(
                AI_QUESTION_ENDPOINT,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        subject,

                        topic,

                        count:
                            QUESTIONS_PER_BATTLE,

                        numberOfQuestions:
                            QUESTIONS_PER_BATTLE,

                        difficulty:
                            "mixed",

                        curriculum:
                            "Nigerian Senior Secondary / WAEC style"
                    })
                }
            );


        if (!response.ok) {

            throw new Error(
                `AI server returned HTTP ${response.status}`
            );
        }


        const data =
            await response.json();


        let questions =
            data?.questions ||
            data?.data?.questions ||
            data?.result?.questions ||
            data?.items ||
            data;


        if (!Array.isArray(questions)) {

            throw new Error(
                "AI server returned an invalid question format."
            );
        }


        return questions;

    } catch (error) {

        console.warn(
            "AI question generation failed. Using fallback questions.",
            error
        );


        return getFallbackQuestions(
            subject,
            topic,
            QUESTIONS_PER_BATTLE
        );
    }
}


/* =========================================================
   NORMALIZE QUESTIONS
========================================================= */

function normalizeQuestions(
    questions,
    subject,
    topic
) {

    if (!Array.isArray(questions)) {
        return [];
    }


    return questions
        .map(question => {

            if (!question) {
                return null;
            }


            const questionText =
                cleanText(
                    question.question ||
                    question.questionText ||
                    question.prompt
                );


            if (!questionText) {
                return null;
            }


            let options =
                question.options ||
                question.choices ||
                question.answers;


            if (!Array.isArray(options)) {
                options = [];
            }


            options =
                options
                    .map(option => {

                        if (
                            typeof option ===
                            "object"
                        ) {

                            return cleanText(
                                option.text ||
                                option.answer ||
                                option.value
                            );
                        }

                        return cleanText(option);
                    })
                    .filter(Boolean);


            /*
               We require four options.
            */

            if (options.length < 4) {
                return null;
            }


            options =
                options.slice(0, 4);


            let answer =
                question.answer ??
                question.correctAnswer ??
                question.correctIndex ??
                question.correctOption;


            /*
               Convert "A", "B", "C", "D".
            */

            if (
                typeof answer ===
                "string"
            ) {

                const trimmed =
                    answer.trim();


                const letter =
                    trimmed.toUpperCase();


                if (
                    ["A", "B", "C", "D"]
                        .includes(letter)
                ) {

                    answer =
                        ["A", "B", "C", "D"]
                            .indexOf(letter);

                } else {

                    const numeric =
                        Number(trimmed);

                    if (
                        Number.isInteger(
                            numeric
                        )
                    ) {

                        answer =
                            numeric;
                    }
                }
            }


            /*
               Convert 1–4 answer indexes
               to 0–3.
            */

            if (
                Number.isInteger(answer) &&
                answer >= 1 &&
                answer <= 4
            ) {

                /*
                   If the supplied value is 1-4,
                   treat it as a normal human answer
                   position.
                */

                answer -= 1;
            }


            if (
                !Number.isInteger(answer) ||
                answer < 0 ||
                answer > 3
            ) {

                return null;
            }


            return {

                question:
                    questionText,

                options,

                answer,

                explanation:
                    cleanText(
                        question.explanation ||
                        question.explanationText ||
                        "Review this topic carefully to strengthen your understanding."
                    ),

                subject:
                    subject,

                topic:
                    cleanText(
                        question.topic ||
                        topic
                    )
            };

        })
        .filter(Boolean);
}


/* =========================================================
   DISPLAY CURRENT QUESTION
========================================================= */

function displayCurrentQuestion() {

    clearBattleTimer();


    const question =
        battleState.questions[
            battleState.currentQuestionIndex
        ];


    if (!question) {

        finishBattle();

        return;
    }


    battleState.answered =
        false;


    battleState.timeLeft =
        QUESTION_TIME_LIMIT;


    const current =
        battleState.currentQuestionIndex + 1;


    setText(
        "roundNumber",
        `${current}/${QUESTIONS_PER_BATTLE}`
    );


    setText(
        "playerScore",
        battleState.playerScore
    );


    setText(
        "computerScore",
        battleState.computerScore
    );


    setText(
        "questionTopic",
        question.topic ||
        battleState.topic ||
        battleState.subject
    );


    setText(
        "questionText",
        question.question
    );


    const answerGrid =
        $("answerGrid");


    if (!answerGrid) {
        return;
    }


    answerGrid.innerHTML = "";


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


            button.dataset.index =
                String(index);


            button.innerHTML = `
                <span class="answer-letter">
                    ${String.fromCharCode(65 + index)}
                </span>

                <span class="answer-text">
                    ${escapeHtml(option)}
                </span>
            `;


            button.addEventListener(
                "click",
                () => handlePlayerAnswer(index)
            );


            answerGrid.appendChild(
                button
            );
        }
    );


    updateBattleProgress();


    hideElement("battleFeedback");


    startQuestionTimer();
}


/* =========================================================
   PROGRESS BAR
========================================================= */

function updateBattleProgress() {

    const progress =
        (
            battleState.currentQuestionIndex /
            QUESTIONS_PER_BATTLE
        ) * 100;


    const progressBar =
        $("battleProgressBar");


    if (progressBar) {

        progressBar.style.width =
            `${Math.min(
                Math.max(progress, 0),
                100
            )}%`;
    }
}


/* =========================================================
   TIMER
========================================================= */

function startQuestionTimer() {

    clearBattleTimer();


    battleState.timeLeft =
        QUESTION_TIME_LIMIT;


    updateTimerDisplay();


    battleState.timerInterval =
        setInterval(() => {

            if (
                !battleState.battleActive ||
                battleState.answered
            ) {

                clearBattleTimer();

                return;
            }


            battleState.timeLeft--;


            updateTimerDisplay();


            if (
                battleState.timeLeft <= 0
            ) {

                clearBattleTimer();

                handleTimeExpired();
            }

        }, 1000);
}


/* =========================================================
   TIMER DISPLAY
========================================================= */

function updateTimerDisplay() {

    setText(
        "timerNumber",
        battleState.timeLeft
    );


    const timerContainer =
        $("timerContainer");


    if (timerContainer) {

        timerContainer.classList.remove(
            "timer-warning",
            "timer-danger"
        );


        if (
            battleState.timeLeft <= 5
        ) {

            timerContainer.classList.add(
                "timer-danger"
            );

        } else if (
            battleState.timeLeft <= 10
        ) {

            timerContainer.classList.add(
                "timer-warning"
            );
        }
    }
}


/* =========================================================
   CLEAR TIMER
========================================================= */

function clearBattleTimer() {

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
   PLAYER ANSWER
========================================================= */

function handlePlayerAnswer(selectedIndex) {

    if (
        battleState.answered ||
        !battleState.battleActive
    ) {
        return;
    }


    battleState.answered =
        true;


    clearBattleTimer();


    const question =
        battleState.questions[
            battleState.currentQuestionIndex
        ];


    const correctIndex =
        question.answer;


    const buttons =
        document.querySelectorAll(
            "#answerGrid .answer-option"
        );


    buttons.forEach(
        (button, index) => {

            button.disabled =
                true;


            if (
                index === correctIndex
            ) {

                button.classList.add(
                    "correct"
                );
            }


            if (
                index === selectedIndex &&
                index !== correctIndex
            ) {

                button.classList.add(
                    "incorrect"
                );
            }
        }
    );


    const correct =
        selectedIndex ===
        correctIndex;


    if (correct) {

        battleState.playerScore++;

    } else {

        /*
           Computer gets the point if the player
           answers incorrectly.
        */

        battleState.computerScore++;
    }


    battleState.questionsAnswered++;


    showBattleFeedback(
        correct,
        question
    );


    setText(
        "playerScore",
        battleState.playerScore
    );


    setText(
        "computerScore",
        battleState.computerScore
    );


    scheduleNextQuestion();
}


/* =========================================================
   TIME EXPIRED
========================================================= */

function handleTimeExpired() {

    if (
        battleState.answered ||
        !battleState.battleActive
    ) {
        return;
    }


    battleState.answered =
        true;


    const question =
        battleState.questions[
            battleState.currentQuestionIndex
        ];


    battleState.computerScore++;


    battleState.questionsAnswered++;


    const buttons =
        document.querySelectorAll(
            "#answerGrid .answer-option"
        );


    buttons.forEach(
        (button, index) => {

            button.disabled =
                true;


            if (
                index === question.answer
            ) {

                button.classList.add(
                    "correct"
                );
            }
        }
    );


    showBattleFeedback(
        false,
        question,
        true
    );


    setText(
        "playerScore",
        battleState.playerScore
    );


    setText(
        "computerScore",
        battleState.computerScore
    );


    scheduleNextQuestion();
}


/* =========================================================
   FEEDBACK
========================================================= */

function showBattleFeedback(
    correct,
    question,
    timedOut = false
) {

    const feedback =
        $("battleFeedback");


    if (!feedback) {
        return;
    }


    feedback.style.display =
        "block";


    feedback.className =
        "battle-feedback";


    if (correct) {

        feedback.classList.add(
            "correct-feedback"
        );


        feedback.innerHTML = `
            <strong>Correct!</strong>
            <span>+1 point</span>
        `;

    } else if (timedOut) {

        feedback.classList.add(
            "incorrect-feedback"
        );


        feedback.innerHTML = `
            <strong>Time's up!</strong>
            <span>The computer gets the point.</span>
        `;

    } else {

        feedback.classList.add(
            "incorrect-feedback"
        );


        feedback.innerHTML = `
            <strong>Not quite.</strong>
            <span>
                Correct answer:
                ${escapeHtml(
                    question.options[
                        question.answer
                    ]
                )}
            </span>
        `;
    }
}


/* =========================================================
   NEXT QUESTION
========================================================= */

function scheduleNextQuestion() {

    setTimeout(() => {

        if (
            !battleState.battleActive
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

    }, 1200);
}


/* =========================================================
   FINISH BATTLE
========================================================= */

async function finishBattle() {

    clearBattleTimer();


    battleState.battleActive =
        false;


    updateBattleProgress();


    const playerScore =
        battleState.playerScore;


    const computerScore =
        battleState.computerScore;


    let result;


    if (
        playerScore >
        computerScore
    ) {

        result = "win";

    } else if (
        playerScore <
        computerScore
    ) {

        result = "loss";

    } else {

        result = "draw";
    }


    const points =
        calculateBattlePoints(
            result,
            playerScore,
            computerScore
        );


    await updateLeaderboard(
        result,
        points
    );


    displayBattleResults(
        result,
        points
    );
}


/* =========================================================
   BATTLE POINTS
========================================================= */

function calculateBattlePoints(
    result,
    playerScore,
    computerScore
) {

    if (result === "win") {

        /*
           Base win points + performance bonus.
        */

        return 20 +
            Math.max(
                0,
                playerScore - computerScore
            ) * 2;
    }


    if (result === "draw") {

        return 10;
    }


    return Math.max(
        0,
        5 +
        (playerScore * 1)
    );
}


/* =========================================================
   DISPLAY RESULTS
========================================================= */

function displayBattleResults(
    result,
    points
) {

    showResultsScreen();


    setText(
        "finalPlayerScore",
        battleState.playerScore
    );


    setText(
        "finalComputerScore",
        battleState.computerScore
    );


    setText(
        "battlePointsEarned",
        `+${points}`
    );


    const resultIcon =
        $("resultIcon");


    const resultTitle =
        $("resultTitle");


    const resultSummary =
        $("resultSummary");


    if (result === "win") {

        if (resultIcon) {
            resultIcon.textContent = "🏆";
        }

        if (resultTitle) {
            resultTitle.textContent =
                "Victory!";
        }

        if (resultSummary) {
            resultSummary.textContent =
                "Excellent work! You defeated the computer.";
        }

    } else if (result === "draw") {

        if (resultIcon) {
            resultIcon.textContent = "🤝";
        }

        if (resultTitle) {
            resultTitle.textContent =
                "It's a Draw!";
        }

        if (resultSummary) {
            resultSummary.textContent =
                "You and the computer finished with the same score.";
        }

    } else {

        if (resultIcon) {
            resultIcon.textContent = "📚";
        }

        if (resultTitle) {
            resultTitle.textContent =
                "Keep Practising!";
        }

        if (resultSummary) {
            resultSummary.textContent =
                "Review the topic and come back stronger.";
        }
    }


    setText(
        "battleResultMessage",
        `${battleState.subject} • ${battleState.topic}`
    );
}


/* =========================================================
   UPDATE SUPABASE LEADERBOARD
========================================================= */

async function updateLeaderboard(
    result,
    points
) {

    const supabase =
        getComputerBattleSupabase();


    if (!supabase ||
        !battleState.user
    ) {

        return;
    }


    try {

        const userId =
            battleState.user.id;


        const {
            data: existing,
            error: fetchError
        } = await supabase
            .from("game_leaderboard")
            .select(`
                user_id,
                display_name,
                battle_points,
                wins,
                losses,
                draws,
                battles_played
            `)
            .eq(
                "user_id",
                userId
            )
            .maybeSingle();


        if (fetchError) {

            console.warn(
                "Leaderboard fetch failed:",
                fetchError
            );

            return;
        }


        const metadata =
            battleState.user.user_metadata ||
            {};


        const displayName =
            metadata.display_name ||
            metadata.full_name ||
            metadata.name ||
            battleState.user.email?.split("@")[0] ||
            "StudyMind Player";


        const current =
            existing || {

                user_id:
                    userId,

                display_name:
                    displayName,

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


        const updates = {

            user_id:
                userId,

            display_name:
                current.display_name ||
                displayName,

            battle_points:
                Number(
                    current.battle_points || 0
                ) + Number(points || 0),

            wins:
                Number(
                    current.wins || 0
                ) +
                (
                    result === "win"
                        ? 1
                        : 0
                ),

            losses:
                Number(
                    current.losses || 0
                ) +
                (
                    result === "loss"
                        ? 1
                        : 0
                ),

            draws:
                Number(
                    current.draws || 0
                ) +
                (
                    result === "draw"
                        ? 1
                        : 0
                ),

            battles_played:
                Number(
                    current.battles_played || 0
                ) + 1,

            updated_at:
                new Date().toISOString()
        };


        const {
            error: upsertError
        } = await supabase
            .from("game_leaderboard")
            .upsert(
                updates,
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

            return;
        }


        console.log(
            "Leaderboard updated successfully."
        );

    } catch (error) {

        /*
           Leaderboard failure must never stop
           the battle result screen.
        */

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

    showSetupScreen();


    battleState.battleActive =
        false;


    battleState.questions =
        [];


    battleState.currentQuestionIndex =
        0;


    battleState.playerScore =
        0;


    battleState.computerScore =
        0;


    clearBattleTimer();


    loadBattleSetup();
}


/* =========================================================
   RETURN TO SETUP
========================================================= */

function returnToBattleSetup() {

    clearBattleTimer();


    battleState.battleActive =
        false;


    showSetupScreen();


    loadBattleSetup();
}


/* =========================================================
   RETURN TO GAME MODE
========================================================= */

function returnToGameMode() {

    clearBattleTimer();


    window.location.href =
        "game-mode.html";
}


/* =========================================================
   RETURN HOME
========================================================= */

function returnToHome() {

    clearBattleTimer();


    window.location.href =
        "home.html";
}


/* =========================================================
   AUTHENTICATION
========================================================= */

async function verifyComputerBattleUser() {

    const supabase =
        await waitForSupabaseClient();


    if (!supabase) {

        throw new Error(
            "Supabase client is unavailable."
        );
    }


    const {
        data,
        error
    } = await supabase.auth.getUser();


    if (error) {
        throw error;
    }


    if (!data?.user) {

        throw new Error(
            "No authenticated user."
        );
    }


    battleState.user =
        data.user;


    return data.user;
}


/* =========================================================
   INITIALIZATION
========================================================= */

async function initializeComputerBattle() {

    console.log(
        "Initializing StudyMind Computer Battle..."
    );


    try {

        await verifyComputerBattleUser();

    } catch (error) {

        console.warn(
            "Computer Battle authentication:",
            error
        );


        /*
           Do not immediately redirect.

           This gives Supabase time to initialize and
           prevents the old getUser undefined error.
        */

        const supabase =
            await waitForSupabaseClient();


        if (supabase) {

            try {

                await verifyComputerBattleUser();

            } catch (retryError) {

                console.warn(
                    "Second authentication attempt failed:",
                    retryError
                );
            }
        }
    }


    loadBattleSetup();


    showSetupScreen();


    console.log(
        "StudyMind Computer Battle initialized."
    );
}


/* =========================================================
   PAGE CLEANUP
========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        clearBattleTimer();
    }
);


/* =========================================================
   GLOBAL FUNCTIONS
   ---------------------------------------------------------
   These allow inline HTML such as:
   onclick="startComputerBattle()"
========================================================= */

window.startComputerBattle =
    startComputerBattle;

window.playAgain =
    playAgain;

window.returnToGameMode =
    returnToGameMode;

window.returnToHome =
    returnToHome;

window.returnToBattleSetup =
    returnToBattleSetup;

window.updateTopicOptions =
    updateTopicOptions;


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
