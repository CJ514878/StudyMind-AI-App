/* =========================================================
   STUDYMIND AI — COMPUTER BATTLE
   FULL NIGERIAN CURRICULUM SUBJECT + TOPIC DATABASE

   10 QUESTIONS
   15 SECONDS PER QUESTION
   FREE BATTLE LIMIT handled by game-mode.js

   IMPORTANT:
   - Uses window.supabaseClient
   - Uses studyMindPlan / studyData
   - Supports study-plan subjects first
   - Falls back to Nigerian curriculum catalogue
   - Supports subject -> topic selection
========================================================= */

"use strict";

/* =========================================================
   BATTLE CONFIGURATION
========================================================= */

const QUESTIONS_PER_BATTLE = 10;
const QUESTION_TIME_LIMIT = 15;
const AI_QUESTION_ENDPOINT = "/api/generate-questions";

/* =========================================================
   SUPABASE
   DO NOT USE:
       typeof supabase !== "undefined" ? supabase : null

   Your initialized client is:
       window.supabaseClient
========================================================= */

function getComputerBattleSupabase() {
    const client = window.supabaseClient;

    if (
        client &&
        client.auth &&
        typeof client.auth.getUser === "function"
    ) {
        return client;
    }

    return null;
}

async function waitForSupabaseClient(timeout = 5000) {
    const started = Date.now();

    while (Date.now() - started < timeout) {
        const client = getComputerBattleSupabase();

        if (client) {
            return client;
        }

        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return null;
}

/* =========================================================
   GLOBAL BATTLE STATE
========================================================= */

const computerBattleState = {
    questions: [],
    currentQuestionIndex: 0,

    playerScore: 0,
    computerScore: 0,

    selectedSubject: "",
    selectedTopic: "",

    timer: null,
    timeRemaining: QUESTION_TIME_LIMIT,

    answered: false,
    battleFinished: false,
    computerTurn: false,

    playerAnswers: []
};

/* =========================================================
   DOM SHORTCUT
========================================================= */

function battleElement(id) {
    return document.getElementById(id);
}

/* =========================================================
   UTILITIES
========================================================= */

function normalizeBattleText(value) {
    return String(value ?? "")
        .replace(/\s+/g, " ")
        .trim();
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function shuffleArray(array) {
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

/* =========================================================
   NIGERIAN SENIOR SECONDARY CURRICULUM
   SUBJECT + TOPIC DATABASE

   Alphabetical order.
========================================================= */

const NIGERIAN_CURRICULUM = {

    /* =====================================================
       A
    ===================================================== */

    "Accounting": [
        "Introduction to Accounting",
        "Accounting Concepts and Conventions",
        "Accounting Principles",
        "The Accounting Equation",
        "Source Documents",
        "Books of Original Entry",
        "Cash Book",
        "Petty Cash Book",
        "Ledger Accounts",
        "Trial Balance",
        "Bank Reconciliation Statement",
        "Correction of Errors",
        "Suspense Account",
        "Capital and Revenue Expenditure",
        "Depreciation",
        "Provision for Depreciation",
        "Bad Debts",
        "Provision for Doubtful Debts",
        "Final Accounts",
        "Trading Account",
        "Profit and Loss Account",
        "Balance Sheet",
        "Manufacturing Account",
        "Incomplete Records",
        "Single Entry",
        "Partnership Accounts",
        "Admission of a Partner",
        "Retirement of a Partner",
        "Dissolution of Partnership",
        "Company Accounts",
        "Share Capital",
        "Issue of Shares",
        "Debentures",
        "Branch Accounts",
        "Departmental Accounts",
        "Public Sector Accounting",
        "Non-Profit-Making Organisations",
        "Accounting Ratios",
        "Interpretation of Financial Statements"
    ],

    "Agricultural Science": [
        "Meaning and Importance of Agriculture",
        "Branches of Agriculture",
        "Problems of Agricultural Development in Nigeria",
        "Factors Affecting Agricultural Production",
        "Agricultural Ecology",
        "Soil Formation",
        "Soil Profile",
        "Soil Properties",
        "Soil Water",
        "Soil Air",
        "Soil Temperature",
        "Soil pH",
        "Soil Fertility",
        "Soil Nutrients",
        "Organic Manure",
        "Inorganic Fertilizers",
        "Soil Conservation",
        "Farm Tools",
        "Farm Machinery",
        "Farm Power",
        "Farm Surveying",
        "Farm Planning",
        "Crop Production",
        "Crop Classification",
        "Seed Selection",
        "Seed Dormancy",
        "Seed Germination",
        "Nursery Practices",
        "Crop Propagation",
        "Planting Methods",
        "Crop Husbandry",
        "Weed Control",
        "Pest Control",
        "Crop Diseases",
        "Harvesting",
        "Storage of Farm Produce",
        "Processing of Farm Produce",
        "Marketing of Farm Produce",
        "Animal Production",
        "Farm Animals",
        "Animal Nutrition",
        "Animal Feeds",
        "Animal Diseases",
        "Animal Breeding",
        "Animal Reproduction",
        "Livestock Management",
        "Fisheries",
        "Forestry",
        "Wildlife Conservation",
        "Agricultural Extension",
        "Agricultural Economics",
        "Farm Records"
    ],

    "Arabic": [
        "Arabic Alphabet",
        "Arabic Sounds",
        "Arabic Vocabulary",
        "Nouns",
        "Pronouns",
        "Verbs",
        "Adjectives",
        "Adverbs",
        "Prepositions",
        "Conjunctions",
        "Sentence Formation",
        "Nominal Sentences",
        "Verbal Sentences",
        "Reading Comprehension",
        "Translation",
        "Composition",
        "Arabic Literature",
        "Arabic Culture",
        "Islamic Vocabulary",
        "Formal Arabic Communication"
    ],

    /* =====================================================
       B
    ===================================================== */

    "Biology": [
        "Introduction to Biology",
        "Characteristics of Living Organisms",
        "Biological Organisation",
        "Cell Structure",
        "Cell Functions",
        "Differences Between Plant and Animal Cells",
        "Cell Division",
        "Cell Theory",
        "Biological Molecules",
        "Carbohydrates",
        "Proteins",
        "Lipids",
        "Water and Mineral Salts",
        "Enzymes",
        "Nutrition",
        "Modes of Nutrition",
        "Photosynthesis",
        "Mineral Nutrition in Plants",
        "Human Digestive System",
        "Digestive Enzymes",
        "Transport in Plants",
        "Transport in Animals",
        "Blood",
        "Circulatory System",
        "Lymphatic System",
        "Respiration",
        "Aerobic Respiration",
        "Anaerobic Respiration",
        "Respiratory System",
        "Excretion",
        "Excretory Organs",
        "Homeostasis",
        "Kidney Function",
        "Nervous Coordination",
        "Sense Organs",
        "Hormonal Coordination",
        "Support and Movement",
        "Skeleton",
        "Muscles",
        "Reproduction in Plants",
        "Reproduction in Animals",
        "Human Reproductive System",
        "Menstrual Cycle",
        "Fertilisation",
        "Growth and Development",
        "Genetics",
        "Mendelian Genetics",
        "Variation",
        "Mutation",
        "Evolution",
        "Classification",
        "Kingdoms of Living Organisms",
        "Ecology",
        "Food Chains",
        "Food Webs",
        "Energy Flow",
        "Population",
        "Community",
        "Ecosystem",
        "Adaptation",
        "Conservation",
        "Pollution",
        "Microorganisms",
        "Disease",
        "Immunity",
        "Public Health"
    ],

    /* =====================================================
       C
    ===================================================== */

    "Catering Craft": [
        "Introduction to Catering",
        "Kitchen Safety",
        "Kitchen Hygiene",
        "Personal Hygiene",
        "Kitchen Equipment",
        "Cooking Utensils",
        "Kitchen Layout",
        "Food Storage",
        "Food Preservation",
        "Food Contamination",
        "Food Spoilage",
        "Food Groups",
        "Menu Planning",
        "Meal Planning",
        "Food Preparation",
        "Methods of Cooking",
        "Baking",
        "Pastry Making",
        "Bread Making",
        "Soups",
        "Sauces",
        "Salads",
        "Beverages",
        "Table Setting",
        "Food Service",
        "Restaurant Service",
        "Costing of Meals",
        "Catering Business",
        "Customer Service"
    ],

    "Chemistry": [
        "Introduction to Chemistry",
        "Matter",
        "States of Matter",
        "Physical and Chemical Changes",
        "Elements",
        "Compounds",
        "Mixtures",
        "Separation Techniques",
        "Atomic Structure",
        "Electronic Configuration",
        "Isotopes",
        "Periodic Table",
        "Periodic Trends",
        "Chemical Bonding",
        "Ionic Bonding",
        "Covalent Bonding",
        "Metallic Bonding",
        "Chemical Formulae",
        "Chemical Equations",
        "Mole Concept",
        "Stoichiometry",
        "Gas Laws",
        "Kinetic Theory",
        "Solutions",
        "Solubility",
        "Acids",
        "Bases",
        "Salts",
        "pH Scale",
        "Indicators",
        "Neutralisation",
        "Redox Reactions",
        "Oxidation Numbers",
        "Electrolysis",
        "Electrochemical Cells",
        "Rate of Reaction",
        "Chemical Equilibrium",
        "Le Chatelier's Principle",
        "Energy Changes",
        "Thermochemistry",
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
        "Metals",
        "Extraction of Metals",
        "Corrosion",
        "Non-Metals",
        "Water",
        "Air",
        "Environmental Chemistry"
    ],

    "Christian Religious Studies": [
        "Creation",
        "The Fall of Man",
        "Cain and Abel",
        "Noah and the Flood",
        "Abraham",
        "Isaac",
        "Jacob",
        "Joseph",
        "Moses",
        "The Exodus",
        "The Ten Commandments",
        "Joshua",
        "The Judges",
        "Samuel",
        "Saul",
        "David",
        "Solomon",
        "The Prophets",
        "Amos",
        "Hosea",
        "Isaiah",
        "Jeremiah",
        "The Birth of Jesus",
        "The Baptism of Jesus",
        "Temptation of Jesus",
        "Teachings of Jesus",
        "Parables",
        "Miracles",
        "The Sermon on the Mount",
        "The Transfiguration",
        "The Last Supper",
        "The Death of Jesus",
        "The Resurrection",
        "The Great Commission",
        "The Early Church",
        "Pentecost",
        "The Apostles",
        "Paul",
        "Christian Leadership",
        "Christian Ethics",
        "Love",
        "Faith",
        "Justice",
        "Honesty",
        "Forgiveness",
        "Peace",
        "Christian Family Life"
    ],

    "Commerce": [
        "Meaning of Commerce",
        "Scope of Commerce",
        "Production",
        "Factors of Production",
        "Trade",
        "Home Trade",
        "Foreign Trade",
        "Wholesale Trade",
        "Retail Trade",
        "Channels of Distribution",
        "Transportation",
        "Communication",
        "Warehousing",
        "Insurance",
        "Banking",
        "Stock Exchange",
        "Advertising",
        "Consumer Protection",
        "Business Ownership",
        "Sole Proprietorship",
        "Partnership",
        "Limited Liability Companies",
        "Cooperative Societies",
        "Public Enterprises",
        "Sources of Business Finance",
        "Business Documents",
        "Terms of Trade",
        "International Trade",
        "Balance of Trade",
        "E-Commerce",
        "Entrepreneurship"
    ],

    "Computer Studies": [
        "Introduction to Computers",
        "History of Computers",
        "Generations of Computers",
        "Types of Computers",
        "Computer Hardware",
        "Computer Software",
        "Input Devices",
        "Output Devices",
        "Storage Devices",
        "Computer Memory",
        "Central Processing Unit",
        "Operating Systems",
        "File Management",
        "Word Processing",
        "Spreadsheets",
        "Presentation Software",
        "Database Concepts",
        "Computer Networks",
        "Internet",
        "Web Browsing",
        "Email",
        "Cybersecurity",
        "Computer Ethics",
        "Programming Concepts",
        "Algorithms",
        "Flowcharts",
        "Data Representation",
        "Binary Numbers",
        "Information Technology",
        "Digital Citizenship"
    ],

    /* =====================================================
       D
    ===================================================== */

    "Digital Technologies": [
        "Digital Literacy",
        "Computer Systems",
        "Digital Devices",
        "Operating Systems",
        "Data and Information",
        "Digital Communication",
        "Internet Technologies",
        "Web Technologies",
        "Programming Fundamentals",
        "Algorithms",
        "Problem Solving",
        "Databases",
        "Networks",
        "Cybersecurity",
        "Data Privacy",
        "Artificial Intelligence",
        "Machine Learning",
        "Digital Ethics",
        "Emerging Technologies",
        "Digital Entrepreneurship"
    ],

    /* =====================================================
       E
    ===================================================== */

    "Economics": [
        "Meaning of Economics",
        "Basic Economic Problems",
        "Scarcity",
        "Choice",
        "Opportunity Cost",
        "Production",
        "Factors of Production",
        "Division of Labour",
        "Specialisation",
        "Scale of Production",
        "Demand",
        "Supply",
        "Elasticity of Demand",
        "Elasticity of Supply",
        "Market Equilibrium",
        "Price Determination",
        "Types of Markets",
        "Perfect Competition",
        "Monopoly",
        "Monopolistic Competition",
        "Oligopoly",
        "Production Cost",
        "Revenue",
        "National Income",
        "GDP",
        "GNP",
        "Economic Growth",
        "Economic Development",
        "Population",
        "Labour Market",
        "Unemployment",
        "Inflation",
        "Money",
        "Functions of Money",
        "Banking",
        "Central Banking",
        "Commercial Banking",
        "Capital Market",
        "Public Finance",
        "Taxation",
        "Government Expenditure",
        "Public Debt",
        "International Trade",
        "Balance of Payments",
        "Exchange Rates",
        "Economic Integration",
        "ECOWAS",
        "Economic Planning",
        "Agriculture and Nigerian Economy",
        "Industrialisation",
        "Economic Development Problems in Nigeria"
    ],

    "English Language": [
        "Parts of Speech",
        "Nouns",
        "Pronouns",
        "Verbs",
        "Adjectives",
        "Adverbs",
        "Prepositions",
        "Conjunctions",
        "Interjections",
        "Sentence Structure",
        "Simple Sentences",
        "Compound Sentences",
        "Complex Sentences",
        "Clauses",
        "Phrases",
        "Subject and Predicate",
        "Concord",
        "Tenses",
        "Active and Passive Voice",
        "Direct and Indirect Speech",
        "Question Tags",
        "Punctuation",
        "Vocabulary Development",
        "Synonyms",
        "Antonyms",
        "Idioms",
        "Figures of Speech",
        "Word Formation",
        "Prefixes and Suffixes",
        "Comprehension",
        "Summary Writing",
        "Essay Writing",
        "Narrative Writing",
        "Descriptive Writing",
        "Argumentative Writing",
        "Expository Writing",
        "Formal Letter",
        "Informal Letter",
        "Report Writing",
        "Article Writing",
        "Speech Writing",
        "Debate",
        "Lexis and Structure",
        "Oral English",
        "Vowel Sounds",
        "Consonant Sounds",
        "Stress",
        "Intonation",
        "Rhythm"
    ],

    /* =====================================================
       F
    ===================================================== */

    "French": [
        "French Alphabet",
        "Greetings",
        "Introducing Yourself",
        "Numbers",
        "Days and Months",
        "Time",
        "Family",
        "School",
        "Home",
        "Food",
        "Clothing",
        "Body Parts",
        "Travel",
        "Shopping",
        "Weather",
        "Health",
        "French Pronouns",
        "French Articles",
        "Nouns",
        "Adjectives",
        "Verbs",
        "Present Tense",
        "Past Tense",
        "Future Tense",
        "Negation",
        "Questions",
        "Prepositions",
        "Conjunctions",
        "Reading Comprehension",
        "Translation",
        "Composition",
        "French Culture"
    ],

    /* =====================================================
       FURTHER MATHEMATICS
    ===================================================== */

    "Further Mathematics": [
        "Algebra",
        "Indices",
        "Logarithms",
        "Surds",
        "Sequences",
        "Series",
        "Binomial Expansion",
        "Permutations",
        "Combinations",
        "Matrices",
        "Determinants",
        "Vectors",
        "Complex Numbers",
        "Functions",
        "Polynomial Functions",
        "Coordinate Geometry",
        "Straight Lines",
        "Circles",
        "Conic Sections",
        "Differentiation",
        "Applications of Differentiation",
        "Integration",
        "Applications of Integration",
        "Differential Equations",
        "Numerical Methods",
        "Trigonometry",
        "Trigonometric Identities",
        "Trigonometric Equations",
        "Mechanics",
        "Kinematics",
        "Dynamics",
        "Moments",
        "Probability",
        "Statistics",
        "Distribution",
        "Linear Programming"
    ],

    /* =====================================================
       G
    ===================================================== */

    "Geography": [
        "Meaning and Scope of Geography",
        "The Solar System",
        "The Earth",
        "Latitude and Longitude",
        "Time Zones",
        "Map Reading",
        "Scale",
        "Direction",
        "Contours",
        "Topographical Maps",
        "Weather",
        "Climate",
        "Atmosphere",
        "Temperature",
        "Pressure",
        "Wind",
        "Rainfall",
        "Climate Classification",
        "Rocks",
        "Rock Cycle",
        "Weathering",
        "Erosion",
        "Transportation and Deposition",
        "Landforms",
        "Drainage",
        "Rivers",
        "Lakes",
        "Oceans",
        "Soils",
        "Vegetation",
        "Natural Resources",
        "Population",
        "Population Distribution",
        "Migration",
        "Settlement",
        "Urbanisation",
        "Agriculture",
        "Mining",
        "Manufacturing",
        "Transportation",
        "Communication",
        "Trade",
        "Tourism",
        "Environmental Problems",
        "Conservation",
        "Geography of Nigeria",
        "West Africa",
        "Africa",
        "World Regional Geography"
    ],

    "Government": [
        "Meaning of Government",
        "Functions of Government",
        "State",
        "Nation",
        "Nation-State",
        "Power",
        "Authority",
        "Legitimacy",
        "Sovereignty",
        "Democracy",
        "Political Participation",
        "Political Socialisation",
        "Political Parties",
        "Pressure Groups",
        "Public Opinion",
        "Constitution",
        "Constitutionalism",
        "Rule of Law",
        "Separation of Powers",
        "Checks and Balances",
        "Legislature",
        "Executive",
        "Judiciary",
        "Electoral Systems",
        "Elections",
        "Electoral Commission",
        "Federalism",
        "Unitary Government",
        "Confederation",
        "Local Government",
        "Public Administration",
        "Civil Service",
        "Traditional Institutions",
        "Military Rule",
        "Human Rights",
        "Citizenship",
        "Political Development",
        "International Relations",
        "Foreign Policy",
        "United Nations",
        "African Union",
        "ECOWAS",
        "Nigerian Political Development",
        "Constitutional Development in Nigeria"
    ],

    /* =====================================================
       H
    ===================================================== */

    "Health Education": [
        "Meaning of Health",
        "Dimensions of Health",
        "Personal Health",
        "Community Health",
        "Environmental Health",
        "Nutrition",
        "Balanced Diet",
        "Malnutrition",
        "Personal Hygiene",
        "Environmental Sanitation",
        "Communicable Diseases",
        "Non-Communicable Diseases",
        "Disease Prevention",
        "Immunity",
        "First Aid",
        "Safety Education",
        "Mental and Emotional Wellbeing",
        "Physical Fitness",
        "Drug Education",
        "Adolescent Health",
        "Family Health",
        "School Health",
        "Consumer Health"
    ],

    "Home Management": [
        "Meaning of Home Management",
        "Family",
        "Family Resources",
        "Decision Making",
        "Time Management",
        "Money Management",
        "Budgeting",
        "Consumer Education",
        "Housing",
        "Home Maintenance",
        "Interior Decoration",
        "Household Equipment",
        "Food Management",
        "Clothing Management",
        "Laundry",
        "Personal Grooming",
        "Child Development",
        "Family Health",
        "Home Safety",
        "Waste Management",
        "Entrepreneurship"
    ],

    "Horticulture and Crop Production": [
        "Introduction to Horticulture",
        "Crop Classification",
        "Soil Preparation",
        "Nursery Establishment",
        "Seed Selection",
        "Seed Germination",
        "Vegetative Propagation",
        "Planting",
        "Irrigation",
        "Manure and Fertilizers",
        "Weed Management",
        "Pest Management",
        "Disease Management",
        "Pruning",
        "Training",
        "Harvesting",
        "Post-Harvest Handling",
        "Storage",
        "Marketing",
        "Greenhouse Production",
        "Landscaping",
        "Ornamental Plants"
    ],

    /* =====================================================
       I
    ===================================================== */

    "Islamic Studies": [
        "Meaning of Islam",
        "Sources of Islamic Law",
        "Quran",
        "Hadith",
        "Tawhid",
        "Articles of Faith",
        "Pillars of Islam",
        "Shahadah",
        "Salah",
        "Zakah",
        "Sawm",
        "Hajj",
        "Life of Prophet Muhammad",
        "Hijrah",
        "Madinah",
        "Treaty of Hudaybiyyah",
        "Conquest of Makkah",
        "Farewell Sermon",
        "Early Muslim Community",
        "Islamic Ethics",
        "Honesty",
        "Justice",
        "Patience",
        "Charity",
        "Family Life in Islam",
        "Islamic Economic Principles",
        "Islamic Political Principles",
        "Muslim Scholars",
        "Islamic Civilisation"
    ],

    /* =====================================================
       L
    ===================================================== */

    "Literature in English": [
        "Introduction to Literature",
        "Genres of Literature",
        "Prose",
        "Poetry",
        "Drama",
        "Plot",
        "Characterisation",
        "Setting",
        "Theme",
        "Point of View",
        "Narrative Technique",
        "Conflict",
        "Irony",
        "Symbolism",
        "Imagery",
        "Metaphor",
        "Simile",
        "Personification",
        "Alliteration",
        "Rhyme",
        "Rhythm",
        "Tone",
        "Mood",
        "Diction",
        "Dramatic Techniques",
        "African Literature",
        "Non-African Literature",
        "Oral Literature",
        "Literary Appreciation"
    ],

    /* =====================================================
       M
    ===================================================== */

    "Marketing": [
        "Meaning of Marketing",
        "Importance of Marketing",
        "Marketing Concepts",
        "Market",
        "Consumer Behaviour",
        "Market Research",
        "Market Segmentation",
        "Target Market",
        "Product",
        "Product Life Cycle",
        "Branding",
        "Packaging",
        "Pricing",
        "Pricing Strategies",
        "Promotion",
        "Advertising",
        "Personal Selling",
        "Sales Promotion",
        "Public Relations",
        "Distribution",
        "Channels of Distribution",
        "Retailing",
        "Wholesaling",
        "Digital Marketing",
        "E-Commerce",
        "Marketing Ethics",
        "Customer Service"
    ],

    "Mathematics": [
        "Number Bases",
        "Fractions",
        "Decimals",
        "Percentages",
        "Ratio",
        "Proportion",
        "Approximation",
        "Indices",
        "Logarithms",
        "Surds",
        "Sets",
        "Venn Diagrams",
        "Algebraic Expressions",
        "Factorisation",
        "Linear Equations",
        "Simultaneous Equations",
        "Quadratic Equations",
        "Inequalities",
        "Sequences",
        "Variation",
        "Polynomials",
        "Graphs",
        "Coordinate Geometry",
        "Straight Lines",
        "Mensuration",
        "Perimeter",
        "Area",
        "Volume",
        "Bearings",
        "Trigonometry",
        "Sine Rule",
        "Cosine Rule",
        "Statistics",
        "Data Collection",
        "Frequency Tables",
        "Mean",
        "Median",
        "Mode",
        "Range",
        "Probability",
        "Vectors",
        "Matrices",
        "Transformations",
        "Geometry",
        "Circle Geometry",
        "Construction",
        "Loci",
        "Financial Mathematics"
    ],

    /* =====================================================
       M — MUSIC
    ===================================================== */

    "Music": [
        "Elements of Music",
        "Musical Notation",
        "Staff Notation",
        "Clefs",
        "Scales",
        "Intervals",
        "Rhythm",
        "Time Signatures",
        "Melody",
        "Harmony",
        "Chords",
        "Musical Forms",
        "Voice Classification",
        "Musical Instruments",
        "African Music",
        "Nigerian Traditional Music",
        "Western Music",
        "Music Composition",
        "Music Performance",
        "Music Appreciation"
    ],

    /* =====================================================
       N
    ===================================================== */

    "Nigerian History": [
        "Meaning of History",
        "Sources of Nigerian History",
        "Early Nigerian Societies",
        "Nok Culture",
        "Kanem-Bornu",
        "Hausa States",
        "Oyo Empire",
        "Benin Kingdom",
        "Igbo Society",
        "Yoruba Society",
        "Trans-Saharan Trade",
        "Trans-Atlantic Trade",
        "Slave Trade",
        "Christian Missionaries",
        "European Exploration",
        "British Colonialism",
        "Amalgamation of Nigeria",
        "Colonial Administration",
        "Nationalist Movements",
        "Independence",
        "First Republic",
        "Military Rule",
        "Civil War",
        "Second Republic",
        "Return to Military Rule",
        "Third Republic",
        "Fourth Republic",
        "Nigerian Political Development",
        "Nigerian Economy",
        "Nigerian Foreign Relations"
    ],

    /* =====================================================
       P
    ===================================================== */

    "Physical Education": [
        "Meaning of Physical Education",
        "Physical Fitness",
        "Components of Fitness",
        "Strength",
        "Speed",
        "Endurance",
        "Flexibility",
        "Agility",
        "Coordination",
        "Balance",
        "Warm-Up",
        "Cool-Down",
        "Athletics",
        "Sprints",
        "Middle Distance Running",
        "Long Distance Running",
        "Relay",
        "Long Jump",
        "High Jump",
        "Football",
        "Basketball",
        "Volleyball",
        "Handball",
        "Tennis",
        "Table Tennis",
        "Swimming",
        "Gymnastics",
        "First Aid in Sports",
        "Sportsmanship",
        "Rules and Officials"
    ],

    "Physics": [
        "Measurement",
        "Physical Quantities",
        "Units",
        "Scalars and Vectors",
        "Motion",
        "Distance and Displacement",
        "Speed and Velocity",
        "Acceleration",
        "Graphs of Motion",
        "Newton's Laws",
        "Force",
        "Momentum",
        "Impulse",
        "Work",
        "Energy",
        "Power",
        "Machines",
        "Pressure",
        "Density",
        "Upthrust",
        "Fluid Mechanics",
        "Heat",
        "Temperature",
        "Thermal Expansion",
        "Heat Transfer",
        "Gas Laws",
        "Waves",
        "Wave Motion",
        "Sound",
        "Light",
        "Reflection",
        "Refraction",
        "Lenses",
        "Optical Instruments",
        "Electricity",
        "Current",
        "Voltage",
        "Resistance",
        "Ohm's Law",
        "Electrical Circuits",
        "Electrical Power",
        "Magnetism",
        "Electromagnetic Induction",
        "Transformers",
        "Alternating Current",
        "Direct Current",
        "Atomic Physics",
        "Radioactivity",
        "Nuclear Energy",
        "Semiconductors"
    ],

    /* =====================================================
       S
    ===================================================== */

    "Solar Photovoltaic Installation and Maintenance": [
        "Introduction to Solar Energy",
        "Solar Radiation",
        "Photovoltaic Effect",
        "Solar Panels",
        "PV Cells",
        "Types of Solar Panels",
        "Solar Panel Ratings",
        "Solar Charge Controllers",
        "Batteries",
        "Inverters",
        "Solar Cables",
        "PV System Components",
        "Series and Parallel Connections",
        "System Sizing",
        "Solar Installation Safety",
        "Mounting Systems",
        "Solar Wiring",
        "System Maintenance",
        "Fault Diagnosis",
        "Energy Efficiency"
    ],

    /* =====================================================
       T
    ===================================================== */

    "Technical Drawing": [
        "Introduction to Technical Drawing",
        "Drawing Instruments",
        "Geometrical Construction",
        "Lines",
        "Angles",
        "Polygons",
        "Circles",
        "Tangency",
        "Scale Drawing",
        "Orthographic Projection",
        "Isometric Projection",
        "Oblique Projection",
        "Perspective Drawing",
        "Sectional Views",
        "Dimensioning",
        "Machine Drawing",
        "Building Drawing",
        "Electrical Drawing",
        "Development of Surfaces",
        "Engineering Symbols"
    ],

    /* =====================================================
       V
    ===================================================== */

    "Visual Arts": [
        "Introduction to Visual Arts",
        "Elements of Art",
        "Principles of Design",
        "Drawing",
        "Painting",
        "Sculpture",
        "Printmaking",
        "Graphics",
        "Textiles",
        "Ceramics",
        "Photography",
        "Art Appreciation",
        "African Art",
        "Nigerian Art",
        "Traditional Art",
        "Contemporary Art",
        "Art History",
        "Design",
        "Craft",
        "Art Entrepreneurship"
    ]

};

/* =========================================================
   ADDITIONAL NIGERIAN CURRICULUM SUBJECTS

   These are included so the subject selector is not limited
   to the most common WAEC subjects.
========================================================= */

Object.assign(NIGERIAN_CURRICULUM, {

    "Beauty and Cosmetology": [
        "Introduction to Beauty and Cosmetology",
        "Personal Hygiene",
        "Salon Safety",
        "Salon Equipment",
        "Hair Care",
        "Hair Styling",
        "Hair Braiding",
        "Hair Treatment",
        "Skin Care",
        "Facial Treatment",
        "Nail Care",
        "Manicure",
        "Pedicure",
        "Makeup",
        "Cosmetic Products",
        "Customer Service",
        "Salon Management",
        "Entrepreneurship"
    ],

    "Computer Hardware and GSM Repairs": [
        "Computer Hardware",
        "Motherboard",
        "CPU",
        "RAM",
        "Storage Devices",
        "Power Supply",
        "Input Devices",
        "Output Devices",
        "Computer Assembly",
        "Hardware Maintenance",
        "Troubleshooting",
        "Operating Systems",
        "Mobile Phone Components",
        "GSM Technology",
        "Mobile Phone Faults",
        "Phone Repair Tools",
        "Basic Electronics",
        "Soldering",
        "Battery Systems",
        "Device Safety"
    ],

    "Fashion Design and Garment Making": [
        "Introduction to Fashion Design",
        "Fashion Illustration",
        "Textile Fibres",
        "Fabric Types",
        "Colour Theory",
        "Design Principles",
        "Body Measurements",
        "Pattern Drafting",
        "Pattern Cutting",
        "Sewing Equipment",
        "Sewing Machine",
        "Stitches",
        "Seams",
        "Fasteners",
        "Garment Construction",
        "Finishing",
        "Clothing Care",
        "Fashion Business",
        "Entrepreneurship"
    ],

    "Livestock Farming": [
        "Introduction to Livestock",
        "Farm Animals",
        "Animal Anatomy",
        "Animal Nutrition",
        "Feeds and Feeding",
        "Ruminants",
        "Poultry Production",
        "Pig Production",
        "Rabbit Production",
        "Goat Production",
        "Sheep Production",
        "Cattle Production",
        "Animal Breeding",
        "Animal Reproduction",
        "Animal Diseases",
        "Disease Prevention",
        "Housing Systems",
        "Farm Records",
        "Marketing",
        "Livestock Entrepreneurship"
    ],

    "Foods and Nutrition": [
        "Food and Nutrition",
        "Nutrients",
        "Carbohydrates",
        "Proteins",
        "Fats and Oils",
        "Vitamins",
        "Minerals",
        "Water",
        "Balanced Diet",
        "Food Groups",
        "Digestion",
        "Meal Planning",
        "Food Preparation",
        "Cooking Methods",
        "Food Preservation",
        "Food Hygiene",
        "Food Safety",
        "Special Diets",
        "Malnutrition",
        "Consumer Education"
    ]
});

/* =========================================================
   ALIAS SUBJECTS

   Makes older study plans compatible.
========================================================= */

const SUBJECT_ALIASES = {
    "General Mathematics": "Mathematics",
    "Math": "Mathematics",
    "Agric Science": "Agricultural Science",
    "Agricultural Science": "Agricultural Science",
    "CRS": "Christian Religious Studies",
    "Christian Religious Knowledge": "Christian Religious Studies",
    "Islamic Religious Studies": "Islamic Studies",
    "IRS": "Islamic Studies",
    "Literature-in-English": "Literature in English",
    "Literature In English": "Literature in English",
    "Further Maths": "Further Mathematics",
    "Computer Science": "Computer Studies",
    "Computer": "Computer Studies",
    "Business Studies": "Commerce"
};

/* =========================================================
   NORMALIZE SUBJECT NAME
========================================================= */

function normalizeSubjectName(subject) {
    const clean = normalizeBattleText(subject);

    if (!clean) {
        return "";
    }

    const aliasKey = Object.keys(SUBJECT_ALIASES).find(
        key => key.toLowerCase() === clean.toLowerCase()
    );

    if (aliasKey) {
        return SUBJECT_ALIASES[aliasKey];
    }

    const existing = Object.keys(NIGERIAN_CURRICULUM).find(
        key => key.toLowerCase() === clean.toLowerCase()
    );

    return existing || clean;
}

/* =========================================================
   STUDY PLAN
========================================================= */

function getStudyPlan() {
    const possibleKeys = [
        "studyMindPlan",
        "studyData"
    ];

    for (const key of possibleKeys) {
        try {
            const raw = localStorage.getItem(key);

            if (!raw) {
                continue;
            }

            const parsed = JSON.parse(raw);

            if (parsed && typeof parsed === "object") {
                return parsed;
            }
        } catch (error) {
            console.warn(
                `Computer Battle: unable to read ${key}`,
                error
            );
        }
    }

    return null;
}

/* =========================================================
   EXTRACT SUBJECT NAME
========================================================= */

function getSubjectName(subject) {

    if (typeof subject === "string") {
        return normalizeSubjectName(subject);
    }

    if (!subject || typeof subject !== "object") {
        return "";
    }

    return normalizeSubjectName(
        subject.subject ||
        subject.subjectName ||
        subject.subject_name ||
        subject.name ||
        subject.title ||
        ""
    );
}

/* =========================================================
   EXTRACT TOPIC NAME
========================================================= */

function getTopicName(topic) {

    if (typeof topic === "string") {
        return normalizeBattleText(topic);
    }

    if (!topic || typeof topic !== "object") {
        return "";
    }

    return normalizeBattleText(
        topic.topic ||
        topic.topicName ||
        topic.topic_name ||
        topic.name ||
        topic.title ||
        ""
    );
}

/* =========================================================
   EXTRACT SUBJECTS FROM STUDY PLAN
========================================================= */

function extractSubjects(plan) {

    if (!plan || typeof plan !== "object") {
        return [];
    }

    const possibleArrays = [
        plan.subjects,
        plan.subjectList,
        plan.selectedSubjects,
        plan.courses
    ];

    for (const array of possibleArrays) {

        if (!Array.isArray(array)) {
            continue;
        }

        const subjects = array
            .map(getSubjectName)
            .filter(Boolean);

        if (subjects.length) {
            return [...new Set(subjects)];
        }
    }

    return [];
}

/* =========================================================
   EXTRACT TOPICS FROM STUDY PLAN
========================================================= */

function extractTopics(plan, selectedSubject) {

    if (!plan || typeof plan !== "object") {
        return [];
    }

    const subject = normalizeSubjectName(selectedSubject);

    /* -----------------------------------------------------
       SUBJECT-SPECIFIC TOPIC STRUCTURES
    ----------------------------------------------------- */

    const possibleSubjectArrays = [
        plan.subjects,
        plan.courses
    ];

    for (const subjects of possibleSubjectArrays) {

        if (!Array.isArray(subjects)) {
            continue;
        }

        for (const item of subjects) {

            const itemSubject = getSubjectName(item);

            if (
                itemSubject &&
                itemSubject.toLowerCase() === subject.toLowerCase()
            ) {

                const topicArray =
                    item.topics ||
                    item.topicList ||
                    item.subtopics;

                if (Array.isArray(topicArray)) {

                    const topics = topicArray
                        .map(getTopicName)
                        .filter(Boolean);

                    if (topics.length) {
                        return [...new Set(topics)];
                    }
                }
            }
        }
    }

    /* -----------------------------------------------------
       FLAT TOPIC ARRAY
    ----------------------------------------------------- */

    const flatTopics = plan.topics;

    if (Array.isArray(flatTopics)) {

        const subjectTopics = flatTopics
            .filter(topic => {

                if (!topic || typeof topic !== "object") {
                    return true;
                }

                const topicSubject =
                    getSubjectName(topic.subject) ||
                    getSubjectName(topic.subjectName) ||
                    getSubjectName(topic.subject_name);

                return (
                    !topicSubject ||
                    topicSubject.toLowerCase() === subject.toLowerCase()
                );
            })
            .map(getTopicName)
            .filter(Boolean);

        if (subjectTopics.length) {
            return [...new Set(subjectTopics)];
        }

        const genericTopics = flatTopics
            .map(getTopicName)
            .filter(Boolean);

        if (genericTopics.length) {
            return [...new Set(genericTopics)];
        }
    }

    return [];
}

/* =========================================================
   GET CURRICULUM SUBJECTS
========================================================= */

function getCurriculumSubjects() {
    return Object.keys(NIGERIAN_CURRICULUM)
        .sort((a, b) => a.localeCompare(b));
}

/* =========================================================
   GET TOPICS FOR SUBJECT
========================================================= */

function getCurriculumTopics(subject) {

    const normalized = normalizeSubjectName(subject);

    const exact = Object.keys(NIGERIAN_CURRICULUM).find(
        key =>
            key.toLowerCase() === normalized.toLowerCase()
    );

    if (exact) {
        return NIGERIAN_CURRICULUM[exact];
    }

    return [];
}

/* =========================================================
   COMBINE STUDY PLAN + CURRICULUM
========================================================= */

function getAvailableSubjects(plan) {

    const planSubjects = extractSubjects(plan);

    const curriculumSubjects =
        getCurriculumSubjects();

    /*
       If a study plan exists, show its subjects first,
       then all Nigerian curriculum subjects.

       This means custom subjects still work.
    */

    const combined = [
        ...planSubjects,
        ...curriculumSubjects
    ];

    const unique = [];

    for (const subject of combined) {

        const normalized =
            normalizeSubjectName(subject);

        if (!normalized) {
            continue;
        }

        const alreadyExists = unique.some(
            item =>
                item.toLowerCase() ===
                normalized.toLowerCase()
        );

        if (!alreadyExists) {
            unique.push(normalized);
        }
    }

    return unique.sort(
        (a, b) => a.localeCompare(b)
    );
}

/* =========================================================
   GET AVAILABLE TOPICS
========================================================= */

function getAvailableTopics(plan, subject) {

    const planTopics =
        extractTopics(plan, subject);

    const curriculumTopics =
        getCurriculumTopics(subject);

    const combined = [
        ...planTopics,
        ...curriculumTopics
    ];

    const unique = [];

    for (const topic of combined) {

        const clean =
            normalizeBattleText(topic);

        if (!clean) {
            continue;
        }

        const exists = unique.some(
            item =>
                item.toLowerCase() ===
                clean.toLowerCase()
        );

        if (!exists) {
            unique.push(clean);
        }
    }

    return unique;
}

/* =========================================================
   LOAD BATTLE SETUP
========================================================= */

function loadBattleSetup() {

    const subjectSelect =
        battleElement("battleSubject");

    const topicSelect =
        battleElement("battleTopic");

    if (!subjectSelect) {
        console.warn(
            "Computer Battle: battleSubject element not found."
        );

        return;
    }

    const plan =
        getStudyPlan();

    const subjects =
        getAvailableSubjects(plan);

    subjectSelect.innerHTML = "";

    if (!subjects.length) {

        const option =
            document.createElement("option");

        option.value = "Mathematics";
        option.textContent = "Mathematics";

        subjectSelect.appendChild(option);

    } else {

        for (const subject of subjects) {

            const option =
                document.createElement("option");

            option.value = subject;
            option.textContent = subject;

            subjectSelect.appendChild(option);
        }
    }

    /*
       Preserve an existing selection if possible.
    */

    if (
        computerBattleState.selectedSubject &&
        subjects.some(
            subject =>
                subject.toLowerCase() ===
                computerBattleState.selectedSubject.toLowerCase()
        )
    ) {

        subjectSelect.value =
            computerBattleState.selectedSubject;

    } else {

        subjectSelect.value =
            subjectSelect.options[0]?.value ||
            "Mathematics";
    }

    updateTopicOptions();
}

/* =========================================================
   UPDATE TOPIC OPTIONS
========================================================= */

function updateTopicOptions() {

    const subjectSelect =
        battleElement("battleSubject");

    const topicSelect =
        battleElement("battleTopic");

    if (!subjectSelect || !topicSelect) {
        return;
    }

    const selectedSubject =
        normalizeSubjectName(
            subjectSelect.value
        );

    const plan =
        getStudyPlan();

    const topics =
        getAvailableTopics(
            plan,
            selectedSubject
        );

    topicSelect.innerHTML = "";

    if (!topics.length) {

        const option =
            document.createElement("option");

        option.value =
            `${selectedSubject} Fundamentals`;

        option.textContent =
            `${selectedSubject} Fundamentals`;

        topicSelect.appendChild(option);

    } else {

        for (const topic of topics) {

            const option =
                document.createElement("option");

            option.value = topic;
            option.textContent = topic;

            topicSelect.appendChild(option);
        }
    }

    if (
        computerBattleState.selectedTopic &&
        [...topicSelect.options].some(
            option =>
                option.value.toLowerCase() ===
                computerBattleState.selectedTopic.toLowerCase()
        )
    ) {

        topicSelect.value =
            computerBattleState.selectedTopic;

    } else {

        topicSelect.value =
            topicSelect.options[0]?.value || "";
    }
}

/* =========================================================
   ERROR DISPLAY
========================================================= */

function showBattleError(message) {

    const possibleIds = [
        "battleError",
        "gameError",
        "computerBattleError"
    ];

    for (const id of possibleIds) {

        const element =
            battleElement(id);

        if (!element) {
            continue;
        }

        element.textContent =
            message;

        element.style.display =
            "block";

        return;
    }

    alert(message);
}

function hideBattleError() {

    const possibleIds = [
        "battleError",
        "gameError",
        "computerBattleError"
    ];

    for (const id of possibleIds) {

        const element =
            battleElement(id);

        if (element) {
            element.style.display = "none";
        }
    }
}

/* =========================================================
   LOADING
========================================================= */

function setBattleLoading(isLoading, message = "Loading...") {

    const loading =
        battleElement("battleLoading");

    if (loading) {

        loading.textContent =
            message;

        loading.style.display =
            isLoading ? "block" : "none";
    }

    const startButton =
        battleElement("startBattleButton");

    if (startButton) {
        startButton.disabled =
            isLoading;
    }
}

/* =========================================================
   FREE BATTLE CHECK
========================================================= */

function getCurrentBattleCount() {

    if (
        typeof window.getBattleCount ===
        "function"
    ) {
        return Number(
            window.getBattleCount()
        ) || 0;
    }

    const stored =
        localStorage.getItem(
            "studyMindBattleCount"
        );

    return Number(stored) || 0;
}

function getFreeBattleLimit() {

    if (
        typeof window.FREE_BATTLE_LIMIT !==
        "undefined"
    ) {
        return Number(
            window.FREE_BATTLE_LIMIT
        ) || 5;
    }

    return 5;
}

function hasBattleAvailable() {

    const count =
        getCurrentBattleCount();

    const limit =
        getFreeBattleLimit();

    return count < limit;
}

/* =========================================================
   START COMPUTER BATTLE
========================================================= */

async function startComputerBattle() {

    hideBattleError();

    const subjectSelect =
        battleElement("battleSubject");

    const topicSelect =
        battleElement("battleTopic");

    const subject =
        normalizeSubjectName(
            subjectSelect?.value
        );

    const topic =
        normalizeBattleText(
            topicSelect?.value
        );

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

    if (!hasBattleAvailable()) {

        showBattleError(
            "You have used your 5 free Computer Battles. Upgrade to Premium for unlimited battles."
        );

        return;
    }

    computerBattleState.selectedSubject =
        subject;

    computerBattleState.selectedTopic =
        topic;

    setBattleLoading(
        true,
        "Generating your battle questions..."
    );

    try {

        let questions = [];

        try {

            questions =
                await requestAIQuestions(
                    subject,
                    topic
                );

        } catch (error) {

            console.warn(
                "AI question generation failed. Using curriculum questions.",
                error
            );
        }

        questions =
            normalizeQuestions(
                questions
            );

        if (
            questions.length <
            QUESTIONS_PER_BATTLE
        ) {

            questions =
                createFallbackQuestions(
                    subject,
                    topic
                );
        }

        if (
            questions.length >
            QUESTIONS_PER_BATTLE
        ) {

            questions =
                shuffleArray(
                    questions
                ).slice(
                    0,
                    QUESTIONS_PER_BATTLE
                );
        }

        computerBattleState.questions =
            questions;

        computerBattleState.currentQuestionIndex = 0;
        computerBattleState.playerScore = 0;
        computerBattleState.computerScore = 0;
        computerBattleState.playerAnswers = [];
        computerBattleState.answered = false;
        computerBattleState.battleFinished = false;
        computerBattleState.computerTurn = false;

        showBattleScreen();

        displayCurrentQuestion();

    } catch (error) {

        console.error(
            "Computer Battle failed:",
            error
        );

        showBattleError(
            "Unable to start the battle. Please try again."
        );

    } finally {

        setBattleLoading(false);
    }
}

/* =========================================================
   AI QUESTION GENERATION
========================================================= */

async function requestAIQuestions(
    subject,
    topic
) {

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

                    mode: "game",

                    type:
                        "game_questions",

                    subject,

                    topic,

                    numberOfQuestions:
                        QUESTIONS_PER_BATTLE,

                    questionCount:
                        QUESTIONS_PER_BATTLE,

                    difficulty:
                        "mixed",

                    format:
                        "multiple_choice",

                    includeAnswers:
                        true
                })
            }
        );

    if (!response.ok) {

        throw new Error(
            `AI server returned ${response.status}`
        );
    }

    const data =
        await response.json();

    if (Array.isArray(data)) {
        return data;
    }

    if (
        Array.isArray(
            data.questions
        )
    ) {
        return data.questions;
    }

    if (
        data.data &&
        Array.isArray(
            data.data.questions
        )
    ) {
        return data.data.questions;
    }

    return [];
}

/* =========================================================
   NORMALIZE QUESTIONS
========================================================= */

function normalizeQuestions(rawQuestions) {

    if (!Array.isArray(rawQuestions)) {
        return [];
    }

    const normalized = [];

    for (const raw of rawQuestions) {

        if (!raw || typeof raw !== "object") {
            continue;
        }

        const question =
            normalizeBattleText(
                raw.question ||
                raw.questionText ||
                raw.text
            );

        if (!question) {
            continue;
        }

        let options =
            raw.options ||
            raw.choices ||
            raw.answers;

        if (!Array.isArray(options)) {
            continue;
        }

        options =
            options
                .map(option => {

                    if (
                        option &&
                        typeof option === "object"
                    ) {

                        return normalizeBattleText(
                            option.text ||
                            option.label ||
                            option.value
                        );
                    }

                    return normalizeBattleText(
                        option
                    );
                })
                .filter(Boolean)
                .slice(0, 4);

        if (options.length < 2) {
            continue;
        }

        let answer =
            raw.correctAnswer ??
            raw.answer ??
            raw.correctOption ??
            raw.correctIndex;

        let correctIndex =
            resolveCorrectAnswer(
                answer,
                options
            );

        if (
            correctIndex < 0 ||
            correctIndex >= options.length
        ) {
            correctIndex = 0;
        }

        normalized.push({

            question,

            options,

            correctIndex,

            explanation:
                normalizeBattleText(
                    raw.explanation ||
                    raw.reason ||
                    ""
                )
        });
    }

    return normalized;
}

/* =========================================================
   RESOLVE CORRECT ANSWER
========================================================= */

function resolveCorrectAnswer(
    answer,
    options
) {

    if (
        typeof answer === "number" &&
        Number.isInteger(answer)
    ) {

        if (
            answer >= 0 &&
            answer < options.length
        ) {
            return answer;
        }

        if (
            answer >= 1 &&
            answer <= options.length
        ) {
            return answer - 1;
        }
    }

    const text =
        normalizeBattleText(
            answer
        ).toLowerCase();

    if (!text) {
        return 0;
    }

    const letters = [
        "a",
        "b",
        "c",
        "d"
    ];

    const letterIndex =
        letters.indexOf(
            text.replace(
                /[\s.)-]/g,
                ""
            )
        );

    if (
        letterIndex >= 0 &&
        letterIndex < options.length
    ) {
        return letterIndex;
    }

    const exactIndex =
        options.findIndex(
            option =>
                option.toLowerCase() ===
                text
        );

    if (exactIndex >= 0) {
        return exactIndex;
    }

    return 0;
}

/* =========================================================
   FALLBACK QUESTION DATABASE
========================================================= */

const FALLBACK_QUESTIONS = {

    "Mathematics": [
        {
            question: "What is 25% of 200?",
            options: [
                "25",
                "40",
                "50",
                "75"
            ],
            correctIndex: 2
        },
        {
            question: "Solve: 2x + 6 = 14.",
            options: [
                "2",
                "3",
                "4",
                "5"
            ],
            correctIndex: 2
        },
        {
            question: "What is the square root of 144?",
            options: [
                "10",
                "11",
                "12",
                "14"
            ],
            correctIndex: 2
        },
        {
            question: "If a triangle has angles 50° and 60°, what is the third angle?",
            options: [
                "60°",
                "70°",
                "80°",
                "90°"
            ],
            correctIndex: 1
        },
        {
            question: "What is 3² + 4²?",
            options: [
                "12",
                "20",
                "25",
                "49"
            ],
            correctIndex: 2
        },
        {
            question: "What is the gradient of y = 3x + 2?",
            options: [
                "2",
                "3",
                "5",
                "6"
            ],
            correctIndex: 1
        },
        {
            question: "What is the mean of 4, 6, 8 and 10?",
            options: [
                "6",
                "7",
                "8",
                "9"
            ],
            correctIndex: 1
        },
        {
            question: "What is 2/3 + 1/3?",
            options: [
                "1/3",
                "2/3",
                "1",
                "4/3"
            ],
            correctIndex: 2
        },
        {
            question: "What is 5 × 7?",
            options: [
                "30",
                "35",
                "40",
                "45"
            ],
            correctIndex: 1
        },
        {
            question: "What is the probability of getting a head when a fair coin is tossed?",
            options: [
                "0",
                "1/4",
                "1/2",
                "1"
            ],
            correctIndex: 2
        }
    ],

    "English Language": [
        {
            question: "Which word is a noun?",
            options: [
                "Quickly",
                "Beautiful",
                "Teacher",
                "Run"
            ],
            correctIndex: 2
        },
        {
            question: "Which is the opposite of 'ancient'?",
            options: [
                "Old",
                "Modern",
                "Historic",
                "Former"
            ],
            correctIndex: 1
        },
        {
            question: "Which sentence is grammatically correct?",
            options: [
                "She go to school.",
                "She goes to school.",
                "She going school.",
                "She gone school."
            ],
            correctIndex: 1
        },
        {
            question: "What is the plural of 'criterion'?",
            options: [
                "Criterions",
                "Criteria",
                "Criteriones",
                "Criterias"
            ],
            correctIndex: 1
        },
        {
            question: "Which word is an adjective?",
            options: [
                "Quickly",
                "Beauty",
                "Beautiful",
                "Beautify"
            ],
            correctIndex: 2
        }
    ],

    "Physics": [
        {
            question: "What is the SI unit of force?",
            options: [
                "Joule",
                "Newton",
                "Watt",
                "Pascal"
            ],
            correctIndex: 1
        },
        {
            question: "Which quantity is measured in metres per second?",
            options: [
                "Force",
                "Energy",
                "Speed",
                "Power"
            ],
            correctIndex: 2
        },
        {
            question: "What is the acceleration due to gravity approximately?",
            options: [
                "5.6 m/s²",
                "8.0 m/s²",
                "9.8 m/s²",
                "12.5 m/s²"
            ],
            correctIndex: 2
        },
        {
            question: "Which device measures electric current?",
            options: [
                "Voltmeter",
                "Ammeter",
                "Barometer",
                "Thermometer"
            ],
            correctIndex: 1
        },
        {
            question: "Which form of energy is stored in a stretched spring?",
            options: [
                "Chemical",
                "Elastic potential",
                "Nuclear",
                "Sound"
            ],
            correctIndex: 1
        }
    ],

    "Chemistry": [
        {
            question: "What is the chemical symbol for sodium?",
            options: [
                "S",
                "So",
                "Na",
                "Sd"
            ],
            correctIndex: 2
        },
        {
            question: "What is the pH of a neutral solution at room temperature?",
            options: [
                "0",
                "5",
                "7",
                "14"
            ],
            correctIndex: 2
        },
        {
            question: "Which particle has a negative charge?",
            options: [
                "Proton",
                "Neutron",
                "Electron",
                "Nucleus"
            ],
            correctIndex: 2
        },
        {
            question: "What gas is produced when an acid reacts with a carbonate?",
            options: [
                "Oxygen",
                "Hydrogen",
                "Carbon dioxide",
                "Nitrogen"
            ],
            correctIndex: 2
        },
        {
            question: "What is H2O?",
            options: [
                "Hydrogen peroxide",
                "Water",
                "Oxygen",
                "Hydrogen"
            ],
            correctIndex: 1
        }
    ],

    "Biology": [
        {
            question: "What is the basic unit of life?",
            options: [
                "Tissue",
                "Organ",
                "Cell",
                "System"
            ],
            correctIndex: 2
        },
        {
            question: "Which organ pumps blood around the body?",
            options: [
                "Liver",
                "Heart",
                "Kidney",
                "Lung"
            ],
            correctIndex: 1
        },
        {
            question: "What process do green plants use to manufacture food?",
            options: [
                "Respiration",
                "Digestion",
                "Photosynthesis",
                "Excretion"
            ],
            correctIndex: 2
        },
        {
            question: "Which blood cells help defend the body against infection?",
            options: [
                "Red blood cells",
                "White blood cells",
                "Platelets",
                "Plasma"
            ],
            correctIndex: 1
        },
        {
            question: "Which organ is mainly responsible for filtering the blood?",
            options: [
                "Heart",
                "Kidney",
                "Stomach",
                "Pancreas"
            ],
            correctIndex: 1
        }
    ],

    "Economics": [
        {
            question: "What is the fundamental economic problem?",
            options: [
                "Inflation",
                "Scarcity",
                "Taxation",
                "Unemployment"
            ],
            correctIndex: 1
        },
        {
            question: "What is the reward for labour?",
            options: [
                "Rent",
                "Interest",
                "Wages",
                "Profit"
            ],
            correctIndex: 2
        },
        {
            question: "What is the reward for capital?",
            options: [
                "Rent",
                "Interest",
                "Wages",
                "Salary"
            ],
            correctIndex: 1
        },
        {
            question: "A persistent rise in the general price level is called what?",
            options: [
                "Deflation",
                "Inflation",
                "Depression",
                "Recession"
            ],
            correctIndex: 1
        },
        {
            question: "What is the opportunity cost of a choice?",
            options: [
                "Total money spent",
                "The next best alternative forgone",
                "The cheapest option",
                "The most expensive option"
            ],
            correctIndex: 1
        }
    ],

    "Government": [
        {
            question: "Which arm of government interprets laws?",
            options: [
                "Executive",
                "Legislature",
                "Judiciary",
                "Civil service"
            ],
            correctIndex: 2
        },
        {
            question: "What is the supreme law of a state?",
            options: [
                "Manifesto",
                "Constitution",
                "Decree",
                "Policy"
            ],
            correctIndex: 1
        },
        {
            question: "Which principle divides government powers among different organs?",
            options: [
                "Federalism",
                "Separation of powers",
                "Sovereignty",
                "Majority rule"
            ],
            correctIndex: 1
        },
        {
            question: "What is the right to vote called?",
            options: [
                "Sovereignty",
                "Franchise",
                "Immunity",
                "Diplomacy"
            ],
            correctIndex: 1
        },
        {
            question: "Which organisation is a regional African body?",
            options: [
                "ECOWAS",
                "NATO",
                "ASEAN",
                "OPEC"
            ],
            correctIndex: 0
        }
    ],

    "Geography": [
        {
            question: "What is the imaginary line that divides Earth into Northern and Southern Hemispheres?",
            options: [
                "Prime Meridian",
                "Equator",
                "Tropic of Cancer",
                "Arctic Circle"
            ],
            correctIndex: 1
        },
        {
            question: "Which instrument measures atmospheric pressure?",
            options: [
                "Thermometer",
                "Barometer",
                "Rain gauge",
                "Anemometer"
            ],
            correctIndex: 1
        },
        {
            question: "What is the process by which rocks are broken down at Earth's surface?",
            options: [
                "Weathering",
                "Condensation",
                "Evaporation",
                "Deposition"
            ],
            correctIndex: 0
        },
        {
            question: "Which layer surrounds the Earth and contains the air we breathe?",
            options: [
                "Hydrosphere",
                "Atmosphere",
                "Lithosphere",
                "Biosphere"
            ],
            correctIndex: 1
        },
        {
            question: "What is the movement of people from one place to another called?",
            options: [
                "Migration",
                "Urbanisation",
                "Industrialisation",
                "Irrigation"
            ],
            correctIndex: 0
        }
    ]
};

/* =========================================================
   CREATE FALLBACK QUESTIONS
========================================================= */

function createFallbackQuestions(
    subject,
    topic
) {

    const normalizedSubject =
        normalizeSubjectName(subject);

    let pool =
        FALLBACK_QUESTIONS[
            normalizedSubject
        ];

    /*
       If there is no hand-written question pool,
       generate safe generic questions from the
       curriculum topic list so the battle can still
       start while the AI endpoint is unavailable.
    */

    if (
        !Array.isArray(pool) ||
        pool.length === 0
    ) {

        const topics =
            getAvailableTopics(
                getStudyPlan(),
                normalizedSubject
            );

        pool = topics.map(
            currentTopic => ({
                question:
                    `Which topic belongs to ${normalizedSubject}?`,

                options: shuffleArray([
                    currentTopic,
                    `${currentTopic} — Advanced Application`,
                    `${currentTopic} — Revision`,
                    `${currentTopic} — Practical Review`
                ]),

                correctIndex: 0
            })
        );
    }

    if (!pool.length) {

        pool = [
            {
                question:
                    `Which topic is being studied in this battle?`,

                options: [
                    topic,
                    "Unrelated Topic",
                    "General Knowledge",
                    "None of the above"
                ],

                correctIndex: 0
            }
        ];
    }

    const result = [];

    const shuffled =
        shuffleArray(pool);

    while (
        result.length <
        QUESTIONS_PER_BATTLE
    ) {

        result.push(
            ...shuffleArray(
                shuffled
            )
        );
    }

    return result
        .slice(
            0,
            QUESTIONS_PER_BATTLE
        )
        .map(question => ({
            ...question,
            options: [
                ...question.options
            ]
        }));
}

/* =========================================================
   SHOW BATTLE SCREEN
========================================================= */

function showBattleScreen() {

    const setup =
        battleElement("battleSetup");

    const screen =
        battleElement("battleScreen");

    const results =
        battleElement("battleResults");

    if (setup) {
        setup.style.display = "none";
    }

    if (results) {
        results.style.display = "none";
    }

    if (screen) {
        screen.style.display = "block";
    }
}

/* =========================================================
   DISPLAY QUESTION
========================================================= */

function displayCurrentQuestion() {

    clearBattleTimer();

    const question =
        computerBattleState.questions[
            computerBattleState.currentQuestionIndex
        ];

    if (!question) {
        finishComputerBattle();
        return;
    }

    computerBattleState.answered =
        false;

    computerBattleState.computerTurn =
        false;

    computerBattleState.timeRemaining =
        QUESTION_TIME_LIMIT;

    updateScoreDisplay();

    /* -----------------------------------------------------
       ROUND
    ----------------------------------------------------- */

    const round =
        battleElement("battleRound");

    if (round) {

        round.textContent =
            `Question ${
                computerBattleState.currentQuestionIndex + 1
            } of ${QUESTIONS_PER_BATTLE}`;
    }

    /* -----------------------------------------------------
       SUBJECT
    ----------------------------------------------------- */

    const subject =
        battleElement("battleCurrentSubject");

    if (subject) {
        subject.textContent =
            computerBattleState.selectedSubject;
    }

    /* -----------------------------------------------------
       TOPIC
    ----------------------------------------------------- */

    const topic =
        battleElement("battleCurrentTopic");

    if (topic) {
        topic.textContent =
            computerBattleState.selectedTopic;
    }

    /* -----------------------------------------------------
       QUESTION
    ----------------------------------------------------- */

    const questionElement =
        battleElement("battleQuestion");

    if (questionElement) {

        questionElement.textContent =
            question.question;
    }

    /* -----------------------------------------------------
       ANSWERS
    ----------------------------------------------------- */

    const answersContainer =
        battleElement("battleAnswers");

    if (answersContainer) {

        answersContainer.innerHTML = "";

        question.options.forEach(
            (option, index) => {

                const button =
                    document.createElement("button");

                button.type =
                    "button";

                button.className =
                    "battle-answer";

                button.dataset.index =
                    String(index);

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
                        submitAnswer(index)
                );

                answersContainer.appendChild(
                    button
                );
            }
        );
    }

    /* -----------------------------------------------------
       PROGRESS
    ----------------------------------------------------- */

    const progress =
        battleElement("battleProgress");

    if (progress) {

        const percent =
            (
                computerBattleState.currentQuestionIndex /
                QUESTIONS_PER_BATTLE
            ) * 100;

        progress.style.width =
            `${percent}%`;
    }

    updateTimerDisplay();

    startBattleTimer();
}

/* =========================================================
   TIMER
========================================================= */

function startBattleTimer() {

    clearBattleTimer();

    computerBattleState.timeRemaining =
        QUESTION_TIME_LIMIT;

    updateTimerDisplay();

    computerBattleState.timer =
        setInterval(() => {

            computerBattleState.timeRemaining--;

            updateTimerDisplay();

            if (
                computerBattleState.timeRemaining <= 0
            ) {

                clearBattleTimer();

                handleTimeout();
            }

        }, 1000);
}

function clearBattleTimer() {

    if (
        computerBattleState.timer
    ) {

        clearInterval(
            computerBattleState.timer
        );

        computerBattleState.timer =
            null;
    }
}

function updateTimerDisplay() {

    const timer =
        battleElement("battleTimer");

    if (timer) {

        timer.textContent =
            `${Math.max(
                0,
                computerBattleState.timeRemaining
            )}s`;
    }

    const timerBar =
        battleElement("battleTimerBar");

    if (timerBar) {

        const percentage =
            (
                computerBattleState.timeRemaining /
                QUESTION_TIME_LIMIT
            ) * 100;

        timerBar.style.width =
            `${percentage}%`;
    }
}

/* =========================================================
   SUBMIT ANSWER
========================================================= */

function submitAnswer(selectedIndex) {

    if (
        computerBattleState.answered ||
        computerBattleState.battleFinished ||
        computerBattleState.computerTurn
    ) {
        return;
    }

    computerBattleState.answered =
        true;

    clearBattleTimer();

    const question =
        computerBattleState.questions[
            computerBattleState.currentQuestionIndex
        ];

    if (!question) {
        return;
    }

    const correct =
        selectedIndex ===
        question.correctIndex;

    computerBattleState.playerAnswers.push({
        question:
            question.question,

        selectedIndex,

        correctIndex:
            question.correctIndex,

        correct
    });

    if (correct) {
        computerBattleState.playerScore++;
    }

    markAnswers(
        selectedIndex,
        question.correctIndex
    );

    showAnswerFeedback(
        correct,
        question.explanation
    );

    setTimeout(
        () => {

            computerTakeTurn(
                correct
            );

        },
        900
    );
}

/* =========================================================
   TIMEOUT
========================================================= */

function handleTimeout() {

    if (
        computerBattleState.answered ||
        computerBattleState.battleFinished
    ) {
        return;
    }

    computerBattleState.answered =
        true;

    const question =
        computerBattleState.questions[
            computerBattleState.currentQuestionIndex
        ];

    if (!question) {
        return;
    }

    computerBattleState.playerAnswers.push({
        question:
            question.question,

        selectedIndex:
            null,

        correctIndex:
            question.correctIndex,

        correct:
            false,

        timedOut:
            true
    });

    markAnswers(
        null,
        question.correctIndex
    );

    showAnswerFeedback(
        false,
        "Time's up!"
    );

    setTimeout(
        () => {

            computerTakeTurn(
                false
            );

        },
        900
    );
}

/* =========================================================
   MARK ANSWERS
========================================================= */

function markAnswers(
    selectedIndex,
    correctIndex
) {

    const container =
        battleElement("battleAnswers");

    if (!container) {
        return;
    }

    const buttons =
        container.querySelectorAll(
            ".battle-answer"
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
                selectedIndex !== null &&
                index === selectedIndex &&
                selectedIndex !== correctIndex
            ) {

                button.classList.add(
                    "incorrect"
                );
            }
        }
    );
}

/* =========================================================
   ANSWER FEEDBACK
========================================================= */

function showAnswerFeedback(
    correct,
    explanation
) {

    const feedback =
        battleElement("battleFeedback");

    if (!feedback) {
        return;
    }

    if (correct) {

        feedback.textContent =
            "✓ Correct!";

        feedback.className =
            "battle-feedback correct";

    } else {

        feedback.textContent =
            "✗ Incorrect";

        feedback.className =
            "battle-feedback incorrect";
    }

    if (explanation) {

        feedback.textContent +=
            ` ${explanation}`;
    }

    feedback.style.display =
        "block";
}

/* =========================================================
   COMPUTER TURN
========================================================= */

function computerTakeTurn(
    playerWasCorrect
) {

    if (
        computerBattleState.battleFinished
    ) {
        return;
    }

    computerBattleState.computerTurn =
        true;

    /*
       Computer gets a reasonable but imperfect
       chance of answering correctly.
    */

    const chance =
        playerWasCorrect
            ? 0.62
            : 0.58;

    const computerCorrect =
        Math.random() < chance;

    if (computerCorrect) {

        computerBattleState.computerScore++;
    }

    updateScoreDisplay();

    setTimeout(
        () => {

            moveToNextQuestion();

        },
        600
    );
}

/* =========================================================
   NEXT QUESTION
========================================================= */

function moveToNextQuestion() {

    if (
        computerBattleState.battleFinished
    ) {
        return;
    }

    computerBattleState.currentQuestionIndex++;

    if (
        computerBattleState.currentQuestionIndex >=
        computerBattleState.questions.length
    ) {

        finishComputerBattle();

        return;
    }

    displayCurrentQuestion();
}

/* =========================================================
   SCORE DISPLAY
========================================================= */

function updateScoreDisplay() {

    const playerScore =
        battleElement("playerScore");

    if (playerScore) {

        playerScore.textContent =
            computerBattleState.playerScore;
    }

    const computerScore =
        battleElement("computerScore");

    if (computerScore) {

        computerScore.textContent =
            computerBattleState.computerScore;
    }
}

/* =========================================================
   BATTLE POINTS
========================================================= */

function calculateBattlePoints(
    result,
    playerScore
) {

    let basePoints = 20;

    if (result === "win") {
        basePoints = 100;
    } else if (result === "draw") {
        basePoints = 50;
    }

    return (
        basePoints +
        Number(playerScore || 0) * 5
    );
}

/* =========================================================
   FINISH BATTLE
========================================================= */

async function finishComputerBattle() {

    if (
        computerBattleState.battleFinished
    ) {
        return;
    }

    computerBattleState.battleFinished =
        true;

    clearBattleTimer();

    const player =
        computerBattleState.playerScore;

    const computer =
        computerBattleState.computerScore;

    let result =
        "draw";

    if (player > computer) {
        result = "win";
    } else if (player < computer) {
        result = "loss";
    }

    const points =
        calculateBattlePoints(
            result,
            player
        );

    try {

        await recordCompletedBattle(
            result,
            points
        );

    } catch (error) {

        console.error(
            "Unable to record completed battle:",
            error
        );
    }

    showResults(
        result,
        points
    );
}

/* =========================================================
   RECORD COMPLETED BATTLE
========================================================= */

async function recordCompletedBattle(
    result,
    points
) {

    /*
       Increment free battle counter.
    */

    if (
        typeof window.registerFreeBattle ===
        "function"
    ) {

        try {

            await window.registerFreeBattle();

        } catch (error) {

            console.warn(
                "registerFreeBattle failed:",
                error
            );
        }
    }

    const client =
        getComputerBattleSupabase();

    if (!client) {

        console.warn(
            "Computer Battle: Supabase client unavailable. Battle result will not be saved to leaderboard."
        );

        return;
    }

    const {
        data: {
            user
        },
        error: userError
    } =
        await client.auth.getUser();

    if (
        userError ||
        !user
    ) {

        console.warn(
            "Computer Battle: no authenticated user.",
            userError
        );

        return;
    }

    const {
        data: existing,
        error: existingError
    } =
        await client
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
                user.id
            )
            .maybeSingle();

    if (
        existingError &&
        existingError.code !== "PGRST116"
    ) {

        console.error(
            "Leaderboard lookup failed:",
            existingError
        );

        return;
    }

    const current =
        existing || {};

    const displayName =
        current.display_name ||
        user.user_metadata?.display_name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Player";

    const oldPoints =
        Number(
            current.battle_points
        ) || 0;

    const oldWins =
        Number(
            current.wins
        ) || 0;

    const oldLosses =
        Number(
            current.losses
        ) || 0;

    const oldDraws =
        Number(
            current.draws
        ) || 0;

    const oldBattles =
        Number(
            current.battles_played
        ) || 0;

    const payload = {

        user_id:
            user.id,

        display_name:
            displayName,

        battle_points:
            oldPoints + points,

        wins:
            oldWins +
            (result === "win" ? 1 : 0),

        losses:
            oldLosses +
            (result === "loss" ? 1 : 0),

        draws:
            oldDraws +
            (result === "draw" ? 1 : 0),

        battles_played:
            oldBattles + 1,

        updated_at:
            new Date().toISOString()
    };

    const {
        error: upsertError
    } =
        await client
            .from("game_leaderboard")
            .upsert(
                payload,
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
        "Computer Battle leaderboard updated:",
        payload
    );
}

/* =========================================================
   SHOW RESULTS
========================================================= */

function showResults(
    result,
    points
) {

    clearBattleTimer();

    const screen =
        battleElement("battleScreen");

    const results =
        battleElement("battleResults");

    if (screen) {
        screen.style.display = "none";
    }

    if (results) {
        results.style.display = "block";
    }

    const finalPlayerScore =
        battleElement("finalPlayerScore");

    if (finalPlayerScore) {

        finalPlayerScore.textContent =
            computerBattleState.playerScore;
    }

    const finalComputerScore =
        battleElement("finalComputerScore");

    if (finalComputerScore) {

        finalComputerScore.textContent =
            computerBattleState.computerScore;
    }

    const pointsElement =
        battleElement("battlePointsEarned");

    if (pointsElement) {

        pointsElement.textContent =
            `+${points}`;
    }

    const resultElement =
        battleElement("battleResult");

    if (resultElement) {

        if (result === "win") {

            resultElement.textContent =
                "VICTORY!";

            resultElement.className =
                "battle-result win";

        } else if (result === "loss") {

            resultElement.textContent =
                "DEFEAT";

            resultElement.className =
                "battle-result loss";

        } else {

            resultElement.textContent =
                "DRAW";

            resultElement.className =
                "battle-result draw";
        }
    }

    const subjectElement =
        battleElement("resultSubject");

    if (subjectElement) {

        subjectElement.textContent =
            computerBattleState.selectedSubject;
    }

    const topicElement =
        battleElement("resultTopic");

    if (topicElement) {

        topicElement.textContent =
            computerBattleState.selectedTopic;
    }
}

/* =========================================================
   PLAY AGAIN
========================================================= */

async function playAgain() {

    if (!hasBattleAvailable()) {

        showBattleError(
            "You have reached the 5 free Computer Battles limit. Upgrade to Premium for unlimited battles."
        );

        return;
    }

    computerBattleState.questions = [];
    computerBattleState.currentQuestionIndex = 0;
    computerBattleState.playerScore = 0;
    computerBattleState.computerScore = 0;
    computerBattleState.playerAnswers = [];
    computerBattleState.answered = false;
    computerBattleState.battleFinished = false;
    computerBattleState.computerTurn = false;

    const results =
        battleElement("battleResults");

    const setup =
        battleElement("battleSetup");

    if (results) {
        results.style.display = "none";
    }

    if (setup) {
        setup.style.display = "block";
    }

    loadBattleSetup();
}

/* =========================================================
   RETURN TO GAME MODE
========================================================= */

function returnToGameMode() {

    clearBattleTimer();

    /*
       Support both likely filenames.
    */

    const possiblePages = [
        "game-mode.html",
        "game.html"
    ];

    const existing =
        possiblePages.find(
            page =>
                page
        );

    window.location.href =
        existing || "game-mode.html";
}

/* =========================================================
   AUTHENTICATION
========================================================= */

async function verifyComputerBattleUser() {

    const client =
        await waitForSupabaseClient();

    if (!client) {

        console.error(
            "Computer Battle: window.supabaseClient was not found."
        );

        showBattleError(
            "Your authentication system has not finished loading. Please refresh the page."
        );

        return false;
    }

    try {

        const {
            data: {
                user
            },
            error
        } =
            await client.auth.getUser();

        if (error) {

            console.error(
                "Computer Battle authentication error:",
                error
            );

            return false;
        }

        if (!user) {

            console.warn(
                "Computer Battle: no authenticated user."
            );

            window.location.href =
                "login.html";

            return false;
        }

        console.log(
            "Computer Battle authenticated user:",
            user.id
        );

        return true;

    } catch (error) {

        console.error(
            "Unexpected authentication error:",
            error
        );

        return false;
    }
}

/* =========================================================
   INITIALIZATION
========================================================= */

async function initializeComputerBattle() {

    console.log(
        "Initializing StudyMind AI Computer Battle..."
    );

    const authenticated =
        await verifyComputerBattleUser();

    if (!authenticated) {
        return;
    }

    loadBattleSetup();

    const subjectSelect =
        battleElement("battleSubject");

    if (subjectSelect) {

        subjectSelect.addEventListener(
            "change",
            () => {

                computerBattleState.selectedSubject =
                    normalizeSubjectName(
                        subjectSelect.value
                    );

                updateTopicOptions();
            }
        );
    }

    updateScoreDisplay();

    console.log(
        "Computer Battle initialized."
    );
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

window.updateTopicOptions =
    updateTopicOptions;

window.loadBattleSetup =
    loadBattleSetup;

window.NIGERIAN_CURRICULUM =
    NIGERIAN_CURRICULUM;

/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeComputerBattle
);
