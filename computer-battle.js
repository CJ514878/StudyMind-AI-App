/* =========================================================
   STUDYMIND AI — COMPUTER BATTLE
   FULL CORRECTED REPLACEMENT

   FIXES:
   - Selected subject is ALWAYS respected
   - Selected topic is ALWAYS respected
   - AI is explicitly told the selected subject/topic
   - Math questions can no longer be used as a universal fallback
   - Subject-specific fallback question banks
   - Questions are shuffled every battle
   - Answers are shuffled every battle
   - Duplicate questions are removed
   - Supports existing computer-battle.html IDs
   - Supports older battle DOM IDs
   - 10 questions per battle
   - 15 seconds per question
   - Supabase authentication
   - Leaderboard updates
========================================================= */


/* =========================================================
   CONFIGURATION
========================================================= */

const QUESTIONS_PER_BATTLE = 10;
const QUESTION_TIME_LIMIT = 15;

const FREE_BATTLE_LIMIT = 5;

const AI_QUESTION_ENDPOINT =
    "/api/generate-questions";


/* =========================================================
   DOM SHORTCUT
========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   SUPABASE
========================================================= */

function getComputerBattleSupabase() {

    if (
        window.supabaseClient &&
        window.supabaseClient.auth &&
        typeof window.supabaseClient.auth.getUser === "function"
    ) {
        return window.supabaseClient;
    }

    return null;
}


function waitForSupabaseClient(timeout = 10000) {

    return new Promise((resolve) => {

        const started = Date.now();

        function check() {

            const client =
                getComputerBattleSupabase();

            if (client) {
                resolve(client);
                return;
            }

            if (
                Date.now() - started >=
                timeout
            ) {
                resolve(null);
                return;
            }

            setTimeout(check, 100);
        }

        check();
    });
}


/* =========================================================
   BATTLE STATE
========================================================= */

const battleState = {

    user: null,

    subject: "",

    topic: "",

    questions: [],

    currentQuestionIndex: 0,

    playerScore: 0,

    computerScore: 0,

    playerAnswered: false,

    computerAnswered: false,

    timer: null,

    timerSeconds: QUESTION_TIME_LIMIT,

    battleStarted: false,

    battleFinished: false
};


/* =========================================================
   CURRICULUM
========================================================= */

const NIGERIAN_CURRICULUM = {

    Mathematics: [
        "Number Bases",
        "Fractions",
        "Decimals",
        "Percentages",
        "Ratio and Proportion",
        "Indices",
        "Logarithms",
        "Algebra",
        "Linear Equations",
        "Simultaneous Equations",
        "Quadratic Equations",
        "Sequences",
        "Variation",
        "Sets",
        "Probability",
        "Statistics",
        "Geometry",
        "Mensuration",
        "Trigonometry",
        "Coordinate Geometry",
        "Vectors",
        "Matrices",
        "Functions",
        "Financial Mathematics"
    ],

    "English Language": [
        "Parts of Speech",
        "Sentence Structure",
        "Tenses",
        "Concord",
        "Vocabulary",
        "Synonyms",
        "Antonyms",
        "Comprehension",
        "Summary Writing",
        "Essay Writing",
        "Letter Writing",
        "Figures of Speech",
        "Punctuation",
        "Phonetics",
        "Oral English"
    ],

    Physics: [
        "Measurement",
        "Motion",
        "Forces",
        "Work Energy and Power",
        "Machines",
        "Heat",
        "Temperature",
        "Waves",
        "Sound",
        "Light",
        "Electricity",
        "Magnetism",
        "Electromagnetism",
        "Atomic Physics",
        "Nuclear Physics"
    ],

    Chemistry: [
        "Matter",
        "Atomic Structure",
        "Periodic Table",
        "Chemical Bonding",
        "Chemical Reactions",
        "Acids Bases and Salts",
        "Mole Concept",
        "Gas Laws",
        "Organic Chemistry",
        "Hydrocarbons",
        "Electrolysis",
        "Redox Reactions",
        "Metals",
        "Non-metals",
        "Environmental Chemistry"
    ],

    Biology: [
        "Cell Structure",
        "Cell Division",
        "Nutrition",
        "Photosynthesis",
        "Respiration",
        "Transport Systems",
        "Excretion",
        "Coordination",
        "Reproduction",
        "Genetics",
        "Evolution",
        "Ecology",
        "Classification",
        "Microorganisms",
        "Human Health"
    ],

    Economics: [
        "Basic Economic Concepts",
        "Scarcity",
        "Opportunity Cost",
        "Demand",
        "Supply",
        "Elasticity",
        "Production",
        "Factors of Production",
        "Market Structures",
        "National Income",
        "Inflation",
        "Unemployment",
        "Money",
        "Banking",
        "Public Finance",
        "International Trade",
        "Economic Development"
    ],

    Government: [
        "Political Concepts",
        "Constitution",
        "Democracy",
        "Citizenship",
        "Political Parties",
        "Elections",
        "Pressure Groups",
        "Public Opinion",
        "Separation of Powers",
        "Federalism",
        "Legislature",
        "Executive",
        "Judiciary",
        "Local Government",
        "International Organisations"
    ],

    Geography: [
        "Map Reading",
        "Scale",
        "Latitude and Longitude",
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
        "Environmental Issues"
    ],

    Accounting: [
        "Accounting Concepts",
        "Accounting Equation",
        "Source Documents",
        "Ledger",
        "Cash Book",
        "Trial Balance",
        "Final Accounts",
        "Depreciation",
        "Bank Reconciliation",
        "Control Accounts",
        "Partnership Accounts",
        "Company Accounts"
    ],

    Commerce: [
        "Introduction to Commerce",
        "Trade",
        "Home Trade",
        "Foreign Trade",
        "Wholesale Trade",
        "Retail Trade",
        "Transportation",
        "Warehousing",
        "Insurance",
        "Banking",
        "Advertising",
        "Communication",
        "Consumer Protection"
    ],

    "Digital Technologies": [
        "Computer Fundamentals",
        "Hardware",
        "Software",
        "Operating Systems",
        "Data Representation",
        "Algorithms",
        "Programming",
        "Databases",
        "Networks",
        "Internet",
        "Cybersecurity",
        "Digital Citizenship",
        "Artificial Intelligence"
    ],

    "Computer Studies": [
        "Computer Fundamentals",
        "Hardware",
        "Software",
        "Operating Systems",
        "Number Systems",
        "Algorithms",
        "Programming",
        "Data Processing",
        "Databases",
        "Computer Networks",
        "Internet",
        "Information Security"
    ],

    "Further Mathematics": [
        "Algebra",
        "Functions",
        "Sequences",
        "Matrices",
        "Vectors",
        "Coordinate Geometry",
        "Calculus",
        "Differentiation",
        "Integration",
        "Probability",
        "Statistics",
        "Mechanics"
    ],

    "Agricultural Science": [
        "Agriculture",
        "Soil Science",
        "Crop Production",
        "Animal Production",
        "Farm Management",
        "Agricultural Economics",
        "Farm Tools",
        "Pests and Diseases",
        "Forestry",
        "Fisheries"
    ],

    "Technical Drawing": [
        "Drawing Instruments",
        "Geometric Construction",
        "Orthographic Projection",
        "Isometric Drawing",
        "Perspective",
        "Sectional Views",
        "Building Drawing",
        "Mechanical Drawing"
    ],

    "Literature in English": [
        "Prose",
        "Poetry",
        "Drama",
        "Literary Devices",
        "Characterisation",
        "Plot",
        "Theme",
        "Setting",
        "Narrative Techniques"
    ],

    "Christian Religious Studies": [
        "Creation",
        "The Patriarchs",
        "Moses",
        "The Prophets",
        "The Life of Jesus",
        "Teachings of Jesus",
        "Parables",
        "Miracles",
        "The Early Church",
        "Christian Ethics"
    ],

    "Islamic Religious Studies": [
        "Quran",
        "Hadith",
        "Prophets",
        "Pillars of Islam",
        "Faith",
        "Worship",
        "Islamic Morality",
        "Islamic History",
        "Sharia"
    ],

    "Nigerian History": [
        "Pre-Colonial Nigeria",
        "Hausa States",
        "Kanem-Borno",
        "Yoruba States",
        "Benin Kingdom",
        "Igbo Society",
        "Colonial Administration",
        "Nationalism",
        "Independence",
        "Post-Independence Nigeria"
    ],

    "Basic Science": [
        "Living Things",
        "Matter",
        "Energy",
        "Forces",
        "Heat",
        "Light",
        "Sound",
        "Electricity",
        "Environment",
        "Human Health"
    ],

    "Basic Technology": [
        "Materials",
        "Tools",
        "Workshop Safety",
        "Technical Drawing",
        "Machines",
        "Electricity",
        "Building",
        "Woodwork",
        "Metalwork"
    ],

    "Physical Education": [
        "Physical Fitness",
        "Athletics",
        "Football",
        "Basketball",
        "Volleyball",
        "Gymnastics",
        "Swimming",
        "Health and Fitness"
    ],

    "Health Education": [
        "Personal Hygiene",
        "Nutrition",
        "Disease Prevention",
        "First Aid",
        "Mental Wellbeing",
        "Community Health",
        "Environmental Health"
    ],

    "Visual Arts": [
        "Drawing",
        "Painting",
        "Sculpture",
        "Textiles",
        "Design",
        "Art History",
        "Craft"
    ],

    Music: [
        "Musical Elements",
        "Notation",
        "Scales",
        "Rhythm",
        "Melody",
        "Harmony",
        "African Music",
        "Nigerian Music"
    ],

    French: [
        "Vocabulary",
        "Grammar",
        "Verbs",
        "Tenses",
        "Comprehension",
        "Conversation",
        "Writing"
    ],

    Arabic: [
        "Vocabulary",
        "Grammar",
        "Reading",
        "Writing",
        "Comprehension"
    ],

    "Home Management": [
        "Family Resources",
        "Nutrition",
        "Meal Planning",
        "Clothing",
        "Home Maintenance",
        "Consumer Education"
    ],

    "Catering Craft": [
        "Food Preparation",
        "Kitchen Equipment",
        "Food Safety",
        "Menu Planning",
        "Nutrition",
        "Hospitality"
    ],

    Marketing: [
        "Marketing Concepts",
        "Market Research",
        "Product",
        "Price",
        "Promotion",
        "Distribution",
        "Consumer Behaviour"
    ],

    "Citizenship and Heritage Studies": [
        "Citizenship",
        "National Identity",
        "Culture",
        "Heritage",
        "Rights and Responsibilities",
        "National Values"
    ]
};


/* =========================================================
   SUBJECT ALIASES
========================================================= */

const SUBJECT_ALIASES = {

    math: "Mathematics",
    maths: "Mathematics",
    mathematics: "Mathematics",
    "general mathematics": "Mathematics",

    english: "English Language",
    "english language": "English Language",

    physics: "Physics",

    chemistry: "Chemistry",

    biology: "Biology",

    economics: "Economics",

    government: "Government",

    geography: "Geography",

    accounting: "Accounting",

    commerce: "Commerce",

    "computer studies": "Computer Studies",
    computer: "Computer Studies",
    computing: "Computer Studies",

    "digital technologies": "Digital Technologies",
    "digital technology": "Digital Technologies",

    "further mathematics": "Further Mathematics",

    "agricultural science": "Agricultural Science",

    "technical drawing": "Technical Drawing",

    literature: "Literature in English",
    "literature in english": "Literature in English",

    crs: "Christian Religious Studies",
    "christian religious studies":
        "Christian Religious Studies",

    irs: "Islamic Religious Studies",
    "islamic religious studies":
        "Islamic Religious Studies",

    history: "Nigerian History",
    "nigerian history": "Nigerian History",

    "basic science": "Basic Science",

    "basic technology": "Basic Technology",

    "physical education":
        "Physical Education",

    "health education":
        "Health Education",

    "visual arts": "Visual Arts",

    music: "Music",

    french: "French",

    arabic: "Arabic",

    "home management":
        "Home Management",

    "catering craft":
        "Catering Craft",

    marketing: "Marketing",

    "citizenship and heritage studies":
        "Citizenship and Heritage Studies"
};


/* =========================================================
   FALLBACK QUESTION BANKS
========================================================= */

const SUBJECT_QUESTION_BANK = {

    Mathematics: [
        {
            q: "If 3x + 5 = 20, what is x?",
            a: ["3", "5", "7", "10"],
            c: 1
        },
        {
            q: "What is 25% of 200?",
            a: ["25", "40", "50", "75"],
            c: 2
        },
        {
            q: "What is the square root of 144?",
            a: ["10", "11", "12", "14"],
            c: 2
        },
        {
            q: "What is the area of a rectangle 8 cm by 5 cm?",
            a: ["13 cm²", "26 cm²", "40 cm²", "80 cm²"],
            c: 2
        },
        {
            q: "What is 7²?",
            a: ["14", "21", "49", "56"],
            c: 2
        },
        {
            q: "What is 3/4 as a percentage?",
            a: ["25%", "50%", "75%", "80%"],
            c: 2
        },
        {
            q: "A triangle has angles 50° and 60°. What is the third angle?",
            a: ["60°", "70°", "80°", "90°"],
            c: 1
        },
        {
            q: "What is the gradient of y = 4x + 2?",
            a: ["2", "4", "6", "8"],
            c: 1
        },
        {
            q: "What is 15 × 6?",
            a: ["75", "80", "90", "95"],
            c: 2
        },
        {
            q: "What is the perimeter of a square with side 9 cm?",
            a: ["18 cm", "27 cm", "36 cm", "81 cm"],
            c: 2
        },
        {
            q: "If x = 4, what is 2x² + 3?",
            a: ["19", "27", "35", "41"],
            c: 2
        },
        {
            q: "What is the next number: 2, 4, 8, 16, ...?",
            a: ["20", "24", "32", "36"],
            c: 2
        }
    ],

    Physics: [
        {
            q: "What is the SI unit of force?",
            a: ["Joule", "Newton", "Watt", "Pascal"],
            c: 1
        },
        {
            q: "Distance divided by time gives what quantity?",
            a: ["Force", "Energy", "Speed", "Power"],
            c: 2
        },
        {
            q: "What is the SI unit of energy?",
            a: ["Newton", "Joule", "Watt", "Volt"],
            c: 1
        },
        {
            q: "Which instrument measures electric current?",
            a: ["Voltmeter", "Ammeter", "Barometer", "Thermometer"],
            c: 1
        },
        {
            q: "What force attracts objects toward Earth?",
            a: ["Friction", "Magnetism", "Gravity", "Tension"],
            c: 2
        },
        {
            q: "What energy is stored in a stretched spring?",
            a: [
                "Chemical energy",
                "Elastic potential energy",
                "Nuclear energy",
                "Sound energy"
            ],
            c: 1
        },
        {
            q: "What is the SI unit of power?",
            a: ["Watt", "Joule", "Newton", "Ampere"],
            c: 0
        },
        {
            q: "Which particle has a negative charge?",
            a: ["Proton", "Neutron", "Electron", "Nucleus"],
            c: 2
        },
        {
            q: "What happens to the resistance of a typical metal as temperature increases?",
            a: [
                "It decreases",
                "It increases",
                "It becomes zero",
                "It remains unchanged"
            ],
            c: 1
        },
        {
            q: "Which type of wave requires a medium?",
            a: [
                "Mechanical wave",
                "Light wave",
                "Radio wave",
                "Electromagnetic wave"
            ],
            c: 0
        },
        {
            q: "Which device converts electrical energy into mechanical energy?",
            a: ["Motor", "Generator", "Transformer", "Battery"],
            c: 0
        },
        {
            q: "What is acceleration?",
            a: [
                "Distance travelled",
                "Rate of change of velocity",
                "Mass divided by volume",
                "Force divided by time"
            ],
            c: 1
        }
    ],

    Chemistry: [
        {
            q: "What is the chemical symbol for sodium?",
            a: ["S", "Na", "So", "N"],
            c: 1
        },
        {
            q: "What is the pH of a neutral solution?",
            a: ["0", "5", "7", "14"],
            c: 2
        },
        {
            q: "Which gas supports combustion?",
            a: ["Nitrogen", "Oxygen", "Carbon dioxide", "Hydrogen"],
            c: 1
        },
        {
            q: "What is H₂O?",
            a: [
                "Hydrogen peroxide",
                "Water",
                "Oxygen",
                "Hydrogen"
            ],
            c: 1
        },
        {
            q: "Which particle determines an element's atomic number?",
            a: ["Neutron", "Electron", "Proton", "Ion"],
            c: 2
        },
        {
            q: "Which substance is an acid?",
            a: ["NaOH", "HCl", "NH₃", "NaCl"],
            c: 1
        },
        {
            q: "What is the chemical symbol for iron?",
            a: ["Ir", "Fe", "In", "I"],
            c: 1
        },
        {
            q: "Which gas is produced when an acid reacts with a carbonate?",
            a: ["Oxygen", "Hydrogen", "Carbon dioxide", "Nitrogen"],
            c: 2
        },
        {
            q: "What is the smallest unit of an element?",
            a: ["Cell", "Atom", "Molecule", "Compound"],
            c: 1
        },
        {
            q: "Which solution tests for starch?",
            a: [
                "Benedict's solution",
                "Iodine solution",
                "Biuret solution",
                "Ethanol"
            ],
            c: 1
        },
        {
            q: "What type of bond involves sharing electrons?",
            a: [
                "Ionic bond",
                "Covalent bond",
                "Metallic bond",
                "Hydrogen bond"
            ],
            c: 1
        },
        {
            q: "What is the charge of an electron?",
            a: ["Positive", "Negative", "Neutral", "Variable"],
            c: 1
        }
    ],

    Biology: [
        {
            q: "Which organelle is known as the powerhouse of the cell?",
            a: ["Nucleus", "Ribosome", "Mitochondrion", "Vacuole"],
            c: 2
        },
        {
            q: "What process do green plants use to make food?",
            a: [
                "Respiration",
                "Photosynthesis",
                "Digestion",
                "Transpiration"
            ],
            c: 1
        },
        {
            q: "Which gas do plants take in during photosynthesis?",
            a: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
            c: 2
        },
        {
            q: "Which organ pumps blood around the body?",
            a: ["Liver", "Lung", "Heart", "Kidney"],
            c: 2
        },
        {
            q: "What is the basic unit of life?",
            a: ["Tissue", "Organ", "Cell", "System"],
            c: 2
        },
        {
            q: "Which blood cells help fight infections?",
            a: [
                "Red blood cells",
                "White blood cells",
                "Platelets",
                "Plasma"
            ],
            c: 1
        },
        {
            q: "Which part of a plant absorbs water?",
            a: ["Leaf", "Flower", "Root", "Fruit"],
            c: 2
        },
        {
            q: "What is the movement of water through a selectively permeable membrane called?",
            a: [
                "Diffusion",
                "Osmosis",
                "Active transport",
                "Respiration"
            ],
            c: 1
        },
        {
            q: "Which molecule carries genetic information?",
            a: ["ATP", "DNA", "Glucose", "Water"],
            c: 1
        },
        {
            q: "Which organ filters waste from the blood?",
            a: ["Heart", "Kidney", "Stomach", "Pancreas"],
            c: 1
        },
        {
            q: "What is the main function of red blood cells?",
            a: [
                "Fight infection",
                "Transport oxygen",
                "Clot blood",
                "Digest food"
            ],
            c: 1
        },
        {
            q: "Which structure controls most activities of a cell?",
            a: ["Cell wall", "Nucleus", "Vacuole", "Cytoplasm"],
            c: 1
        }
    ],

    Economics: [
        {
            q: "What is scarcity?",
            a: [
                "Unlimited resources",
                "Limited resources and unlimited wants",
                "Low prices",
                "High employment"
            ],
            c: 1
        },
        {
            q: "What is the reward for entrepreneurship?",
            a: ["Rent", "Wages", "Interest", "Profit"],
            c: 3
        },
        {
            q: "What normally happens to demand when price rises?",
            a: [
                "Demand rises",
                "Demand falls",
                "Demand becomes unlimited",
                "Demand becomes zero"
            ],
            c: 1
        },
        {
            q: "Which factor of production refers to human effort?",
            a: ["Land", "Labour", "Capital", "Entrepreneurship"],
            c: 1
        },
        {
            q: "What is inflation?",
            a: [
                "A general fall in prices",
                "A general rise in prices",
                "An increase in exports only",
                "A fall in population"
            ],
            c: 1
        },
        {
            q: "What does GDP measure?",
            a: [
                "Population",
                "Value of final goods and services produced",
                "Number of businesses",
                "Imports only"
            ],
            c: 1
        },
        {
            q: "What is a market?",
            a: [
                "Only a physical shop",
                "A system where buyers and sellers interact",
                "A government department",
                "A bank account"
            ],
            c: 1
        },
        {
            q: "Which policy is used by a central bank to influence money supply?",
            a: [
                "Monetary policy",
                "Trade policy",
                "Education policy",
                "Population policy"
            ],
            c: 0
        },
        {
            q: "What is opportunity cost?",
            a: [
                "Total money available",
                "The next best alternative forgone",
                "Production cost only",
                "A government tax"
            ],
            c: 1
        },
        {
            q: "Which is a direct tax?",
            a: [
                "VAT",
                "Import duty",
                "Personal income tax",
                "Sales tax"
            ],
            c: 2
        },
        {
            q: "What is a monopoly?",
            a: [
                "A market with one major seller",
                "A market with many sellers",
                "A government budget",
                "A type of tax"
            ],
            c: 0
        },
        {
            q: "What is capital as a factor of production?",
            a: [
                "Natural resources",
                "Human effort",
                "Man-made resources used in production",
                "Business profit"
            ],
            c: 2
        }
    ],

    Government: [
        {
            q: "What is democracy?",
            a: [
                "Government by one person",
                "Government by the people",
                "Military government",
                "Government without laws"
            ],
            c: 1
        },
        {
            q: "What is the supreme law of a country?",
            a: ["Decree", "Constitution", "Manifesto", "Policy"],
            c: 1
        },
        {
            q: "Which arm of government makes laws?",
            a: [
                "Executive",
                "Judiciary",
                "Legislature",
                "Civil service"
            ],
            c: 2
        },
        {
            q: "Which arm interprets laws?",
            a: [
                "Legislature",
                "Judiciary",
                "Executive",
                "Electoral commission"
            ],
            c: 1
        },
        {
            q: "What is separation of powers?",
            a: [
                "Dividing government powers among different organs",
                "Removing elections",
                "Giving all power to one person",
                "Abolishing the constitution"
            ],
            c: 0
        },
        {
            q: "What is an election?",
            a: [
                "A method of choosing representatives",
                "A court judgment",
                "A government budget",
                "A political speech"
            ],
            c: 0
        },
        {
            q: "What is citizenship?",
            a: [
                "Membership of a state",
                "Company ownership",
                "Club membership",
                "Government employment"
            ],
            c: 0
        },
        {
            q: "What is the rule of law?",
            a: [
                "Leaders are above the law",
                "Everyone is subject to the law",
                "Only citizens obey laws",
                "Courts cannot interpret laws"
            ],
            c: 1
        },
        {
            q: "What is a political party?",
            a: [
                "A group seeking political power through elections",
                "A court",
                "A business",
                "A government ministry"
            ],
            c: 0
        },
        {
            q: "What is federalism?",
            a: [
                "Division of powers between levels of government",
                "A system with no government",
                "Military rule",
                "Absolute monarchy"
            ],
            c: 0
        },
        {
            q: "Which arm of government implements laws?",
            a: [
                "Judiciary",
                "Executive",
                "Legislature",
                "Electoral body"
            ],
            c: 1
        },
        {
            q: "What is a constitution?",
            a: [
                "A country's fundamental legal framework",
                "A political speech",
                "A tax document",
                "An election result"
            ],
            c: 0
        }
    ],

    Geography: [
        {
            q: "Which imaginary line divides Earth into Northern and Southern Hemispheres?",
            a: [
                "Prime Meridian",
                "Equator",
                "Tropic of Cancer",
                "Arctic Circle"
            ],
            c: 1
        },
        {
            q: "What process changes liquid water into vapour?",
            a: [
                "Condensation",
                "Evaporation",
                "Precipitation",
                "Infiltration"
            ],
            c: 1
        },
        {
            q: "Which instrument measures atmospheric pressure?",
            a: [
                "Thermometer",
                "Barometer",
                "Rain gauge",
                "Anemometer"
            ],
            c: 1
        },
        {
            q: "What is weather?",
            a: [
                "Long-term atmospheric conditions",
                "Short-term atmospheric conditions",
                "Movement of tectonic plates",
                "Ocean currents only"
            ],
            c: 1
        },
        {
            q: "Which atmospheric layer contains most weather?",
            a: [
                "Stratosphere",
                "Mesosphere",
                "Troposphere",
                "Thermosphere"
            ],
            c: 2
        },
        {
            q: "What is erosion?",
            a: [
                "Wearing away and removal of material",
                "Formation of clouds",
                "Movement of planets",
                "Formation of rainfall"
            ],
            c: 0
        },
        {
            q: "What is a delta?",
            a: [
                "A mountain peak",
                "A depositional feature at a river mouth",
                "A desert",
                "A type of cloud"
            ],
            c: 1
        },
        {
            q: "What type of rainfall occurs when moist air rises over mountains?",
            a: [
                "Convectional",
                "Relief",
                "Frontal",
                "Cyclonic"
            ],
            c: 1
        },
        {
            q: "What is a population census?",
            a: [
                "A count of a country's population",
                "A weather report",
                "A map",
                "A soil survey"
            ],
            c: 0
        },
        {
            q: "Which longitude is used as the reference longitude?",
            a: [
                "Equator",
                "Prime Meridian",
                "Tropic of Capricorn",
                "International Date Line"
            ],
            c: 1
        },
        {
            q: "What is a map?",
            a: [
                "A representation of an area",
                "A weather instrument",
                "A type of soil",
                "A population table"
            ],
            c: 0
        },
        {
            q: "What is climate?",
            a: [
                "Daily atmospheric conditions",
                "Long-term average atmospheric conditions",
                "Ocean movement",
                "River flow"
            ],
            c: 1
        }
    ],

    "English Language": [
        {
            q: "Which word is a noun?",
            a: ["Quickly", "Beautiful", "Teacher", "Run"],
            c: 2
        },
        {
            q: "What is the opposite of 'ancient'?",
            a: ["Old", "Modern", "Historic", "Former"],
            c: 1
        },
        {
            q: "Which sentence is grammatically correct?",
            a: [
                "She go to school every day.",
                "She goes to school every day.",
                "She going to school every day.",
                "She gone to school every day."
            ],
            c: 1
        },
        {
            q: "What is a synonym for 'rapid'?",
            a: ["Slow", "Fast", "Weak", "Quiet"],
            c: 1
        },
        {
            q: "Which word is an adjective?",
            a: [
                "Carefully",
                "Beautiful",
                "Run",
                "Happiness"
            ],
            c: 1
        },
        {
            q: "What is a metaphor?",
            a: [
                "A direct comparison without using like or as",
                "A question",
                "A command",
                "A punctuation mark"
            ],
            c: 0
        },
        {
            q: "Which punctuation mark normally ends a direct question?",
            a: [".", ",", "?", ":"],
            c: 2
        },
        {
            q: "What is the plural of 'criterion'?",
            a: [
                "Criterions",
                "Criteria",
                "Criteriones",
                "Criterion"
            ],
            c: 1
        },
        {
            q: "Which word is an adverb?",
            a: ["Slowly", "Slow", "Slowness", "Slower"],
            c: 0
        },
        {
            q: "What does 'ambiguous' mean?",
            a: [
                "Having more than one possible meaning",
                "Very loud",
                "Completely false",
                "Extremely simple"
            ],
            c: 0
        },
        {
            q: "Which word is a verb?",
            a: ["Happiness", "Quickly", "Run", "Beautiful"],
            c: 2
        },
        {
            q: "Which sentence uses the correct form of 'their'?",
            a: [
                "Their going home.",
                "They're books are here.",
                "Their books are on the table.",
                "There books are on the table."
            ],
            c: 2
        }
    ],

    Accounting: [
        {
            q: "What is the basic accounting equation?",
            a: [
                "Assets = Capital + Liabilities",
                "Assets = Revenue - Expenses",
                "Capital = Assets + Liabilities",
                "Liabilities = Assets + Capital"
            ],
            c: 0
        },
        {
            q: "Which account records money received and paid?",
            a: [
                "Cash book",
                "Sales ledger",
                "Purchases journal",
                "Balance sheet"
            ],
            c: 0
        },
        {
            q: "What is an asset?",
            a: [
                "A resource owned or controlled by a business",
                "A business expense",
                "Money owed by the business",
                "A loss"
            ],
            c: 0
        },
        {
            q: "What is a liability?",
            a: [
                "A resource owned by the business",
                "An amount owed by the business",
                "Business revenue",
                "Owner's drawings"
            ],
            c: 1
        },
        {
            q: "Which statement shows assets and liabilities at a point in time?",
            a: [
                "Income statement",
                "Statement of financial position",
                "Cash book",
                "Sales journal"
            ],
            c: 1
        },
        {
            q: "What is depreciation?",
            a: [
                "An increase in asset value",
                "A decrease in the value of an asset over time",
                "A business profit",
                "A cash receipt"
            ],
            c: 1
        },
        {
            q: "What is a trial balance used for?",
            a: [
                "Checking the arithmetic equality of ledger balances",
                "Calculating wages only",
                "Recording stock only",
                "Advertising a business"
            ],
            c: 0
        },
        {
            q: "What is capital?",
            a: [
                "Owner's investment in a business",
                "A business expense",
                "A creditor",
                "A tax"
            ],
            c: 0
        }
    ],

    Commerce: [
        {
            q: "What is commerce?",
            a: [
                "Activities involved in distributing goods and services",
                "Only manufacturing",
                "Only farming",
                "Only banking"
            ],
            c: 0
        },
        {
            q: "Which activity involves buying and selling goods?",
            a: [
                "Trade",
                "Production",
                "Consumption",
                "Transport"
            ],
            c: 0
        },
        {
            q: "What is a retailer?",
            a: [
                "A person who sells directly to final consumers",
                "A manufacturer",
                "A wholesaler only",
                "A farmer"
            ],
            c: 0
        },
        {
            q: "What is a wholesaler?",
            a: [
                "A consumer",
                "A middleman who usually sells in bulk",
                "A government agency",
                "A manufacturer only"
            ],
            c: 1
        },
        {
            q: "Which service moves goods from one place to another?",
            a: [
                "Insurance",
                "Transport",
                "Banking",
                "Advertising"
            ],
            c: 1
        },
        {
            q: "What is advertising mainly used for?",
            a: [
                "Promoting goods and services",
                "Producing raw materials",
                "Collecting taxes",
                "Writing laws"
            ],
            c: 0
        },
        {
            q: "What is insurance?",
            a: [
                "Protection against specified risks",
                "A type of transport",
                "A form of manufacturing",
                "A government election"
            ],
            c: 0
        },
        {
            q: "What is warehousing?",
            a: [
                "Storage of goods",
                "Production of goods",
                "Selling shares",
                "Collecting taxes"
            ],
            c: 0
        }
    ],

    "Digital Technologies": [
        {
            q: "What does CPU stand for?",
            a: [
                "Central Processing Unit",
                "Computer Personal Unit",
                "Central Program Utility",
                "Computer Processing Utility"
            ],
            c: 0
        },
        {
            q: "Which device is primarily used to enter text?",
            a: [
                "Monitor",
                "Keyboard",
                "Speaker",
                "Projector"
            ],
            c: 1
        },
        {
            q: "What is an operating system?",
            a: [
                "Hardware only",
                "Software that manages computer resources",
                "A type of keyboard",
                "A storage cable"
            ],
            c: 1
        },
        {
            q: "What does RAM provide?",
            a: [
                "Temporary working memory",
                "Permanent paper storage",
                "Internet access only",
                "Electric power"
            ],
            c: 0
        },
        {
            q: "Which of these is a programming language?",
            a: ["HTML", "Python", "JPEG", "USB"],
            c: 1
        },
        {
            q: "What is a database?",
            a: [
                "An organized collection of data",
                "A computer monitor",
                "A network cable",
                "A keyboard layout"
            ],
            c: 0
        },
        {
            q: "What is an algorithm?",
            a: [
                "A step-by-step procedure for solving a problem",
                "A computer screen",
                "A storage device",
                "A printer"
            ],
            c: 0
        },
        {
            q: "What is artificial intelligence?",
            a: [
                "Technology that enables computers to perform tasks associated with intelligent behaviour",
                "A type of keyboard",
                "A computer cable",
                "A printer"
            ],
            c: 0
        }
    ],

    "Computer Studies": [
        {
            q: "Which component performs most processing operations?",
            a: [
                "CPU",
                "Monitor",
                "Keyboard",
                "Printer"
            ],
            c: 0
        },
        {
            q: "What is binary based on?",
            a: ["Base 2", "Base 8", "Base 10", "Base 16"],
            c: 0
        },
        {
            q: "Which device produces a hard copy?",
            a: [
                "Scanner",
                "Printer",
                "Mouse",
                "Microphone"
            ],
            c: 1
        },
        {
            q: "What is an algorithm?",
            a: [
                "A step-by-step procedure for solving a problem",
                "A computer screen",
                "A storage device",
                "A printer"
            ],
            c: 0
        },
        {
            q: "Which memory is volatile?",
            a: [
                "ROM",
                "RAM",
                "Hard disk",
                "Flash drive"
            ],
            c: 1
        },
        {
            q: "What does URL stand for?",
            a: [
                "Uniform Resource Locator",
                "Universal Record Link",
                "User Resource Language",
                "Uniform Routing Link"
            ],
            c: 0
        },
        {
            q: "What is a computer network?",
            a: [
                "Connected computers that share resources",
                "A single keyboard",
                "A printer",
                "A monitor"
            ],
            c: 0
        },
        {
            q: "Which device is used to scan physical documents?",
            a: [
                "Scanner",
                "Speaker",
                "Monitor",
                "Projector"
            ],
            c: 0
        }
    ],

    "Further Mathematics": [
        {
            q: "What is the derivative of x²?",
            a: ["x", "2x", "x²", "2"],
            c: 1
        },
        {
            q: "What is the integral of 2x?",
            a: ["x² + C", "2x² + C", "x + C", "2 + C"],
            c: 0
        },
        {
            q: "What is the determinant of [[1,2],[3,4]]?",
            a: ["-2", "2", "10", "14"],
            c: 0
        },
        {
            q: "What is the gradient of y = 3x - 7?",
            a: ["-7", "3", "7", "-3"],
            c: 1
        },
        {
            q: "What is a vector?",
            a: [
                "A quantity with magnitude and direction",
                "A scalar only",
                "A constant only",
                "A probability"
            ],
            c: 0
        },
        {
            q: "What is the derivative of a constant?",
            a: ["1", "0", "The constant", "Undefined"],
            c: 1
        }
    ]
};


/* =========================================================
   GENERIC FALLBACK FOR OTHER SUBJECTS
   ---------------------------------------------------------
   IMPORTANT:
   This NEVER produces Mathematics questions.
========================================================= */

function createGenericSubjectQuestions(
    subject,
    topic,
    count = 10
) {

    const safeSubject =
        String(
            subject || "the selected subject"
        ).trim();

    const safeTopic =
        String(
            topic || "the selected topic"
        ).trim();

    const templates = [

        {
            q:
                `Which statement best describes ${safeTopic} in ${safeSubject}?`,
            a: [
                `It is a key concept studied in ${safeSubject}.`,
                "It is unrelated to the subject.",
                "It is exclusively a mathematical formula.",
                "It is only used in another subject."
            ],
            c: 0
        },

        {
            q:
                `When studying ${safeTopic}, what should a student focus on?`,
            a: [
                "Understanding the relevant concepts and principles",
                "Memorising unrelated information",
                "Ignoring examples",
                "Avoiding practice"
            ],
            c: 0
        },

        {
            q:
                `Which approach is most appropriate when learning ${safeTopic}?`,
            a: [
                "Apply the principles of the subject to examples.",
                "Ignore the definitions.",
                "Avoid all examples.",
                "Choose answers randomly."
            ],
            c: 0
        },

        {
            q:
                `Why is ${safeTopic} important when studying ${safeSubject}?`,
            a: [
                "It develops understanding of an important area of the subject.",
                "It has no connection to the subject.",
                "It only applies to mathematics.",
                "It is unrelated to academic study."
            ],
            c: 0
        },

        {
            q:
                `Which action would best help a student understand ${safeTopic}?`,
            a: [
                "Study the concepts and practise applying them.",
                "Skip the topic completely.",
                "Ignore explanations.",
                "Avoid answering questions."
            ],
            c: 0
        },

        {
            q:
                `What is the best way to approach questions about ${safeTopic}?`,
            a: [
                "Identify the relevant ${safeSubject} principle.",
                "Use an unrelated formula.",
                "Guess without reading the question.",
                "Ignore the topic."
            ],
            c: 0
        },

        {
            q:
                `Which statement about ${safeTopic} is most appropriate?`,
            a: [
                `${safeTopic} should be understood within the context of ${safeSubject}.`,
                `${safeTopic} is always a mathematics topic.`,
                `${safeTopic} has no academic relevance.`,
                `${safeTopic} cannot be studied.`
            ],
            c: 0
        },

        {
            q:
                `A student is revising ${safeTopic}. What should they do first?`,
            a: [
                "Review the key concepts.",
                "Skip all definitions.",
                "Choose random answers.",
                "Avoid examples."
            ],
            c: 0
        },

        {
            q:
                `Which skill is useful when studying ${safeTopic}?`,
            a: [
                "Applying subject-specific knowledge",
                "Ignoring the question",
                "Memorising unrelated formulas",
                "Avoiding practice"
            ],
            c: 0
        },

        {
            q:
                `How should ${safeTopic} be studied in ${safeSubject}?`,
            a: [
                "By connecting concepts with relevant examples.",
                "By ignoring the subject context.",
                "By treating every question as mathematics.",
                "By avoiding revision."
            ],
            c: 0
        }
    ];

    return templates
        .map(item => ({
            q: item.q,
            a: [...item.a],
            c: item.c
        }));
}


/* =========================================================
   NORMALIZE SUBJECT
========================================================= */

function normalizeSubjectName(subject) {

    const raw =
        String(
            subject || ""
        )
            .trim();

    if (!raw) {
        return "";
    }

    const lower =
        raw.toLowerCase();

    if (
        SUBJECT_ALIASES[lower]
    ) {
        return SUBJECT_ALIASES[lower];
    }

    const exact =
        Object.keys(
            NIGERIAN_CURRICULUM
        ).find(
            name =>
                name.toLowerCase() ===
                lower
        );

    if (exact) {
        return exact;
    }

    const bankExact =
        Object.keys(
            SUBJECT_QUESTION_BANK
        ).find(
            name =>
                name.toLowerCase() ===
                lower
        );

    if (bankExact) {
        return bankExact;
    }

    return raw;
}


/* =========================================================
   FIND CURRICULUM SUBJECT
========================================================= */

function findCurriculumSubject(
    subject
) {

    const normalized =
        normalizeSubjectName(
            subject
        );

    const exact =
        Object.keys(
            NIGERIAN_CURRICULUM
        ).find(
            name =>
                name.toLowerCase() ===
                normalized.toLowerCase()
        );

    return exact || normalized;
}


/* =========================================================
   GET CURRICULUM SUBJECTS
========================================================= */

function getCurriculumSubjects() {

    return Object.keys(
        NIGERIAN_CURRICULUM
    );
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

    for (
        const key of possibleKeys
    ) {

        try {

            const raw =
                localStorage.getItem(
                    key
                );

            if (!raw) {
                continue;
            }

            const parsed =
                JSON.parse(raw);

            if (parsed) {
                return parsed;
            }

        } catch (error) {

            console.warn(
                `Could not parse ${key}:`,
                error
            );
        }
    }

    return null;
}


/* =========================================================
   SUBJECT NAME FROM OBJECT
========================================================= */

function getSubjectName(item) {

    if (
        typeof item === "string"
    ) {
        return item.trim();
    }

    if (!item || typeof item !== "object") {
        return "";
    }

    return (
        item.subject ||
        item.subjectName ||
        item.name ||
        item.title ||
        item.label ||
        ""
    )
        .toString()
        .trim();
}


/* =========================================================
   TOPIC NAME FROM OBJECT
========================================================= */

function getTopicName(item) {

    if (
        typeof item === "string"
    ) {
        return item.trim();
    }

    if (!item || typeof item !== "object") {
        return "";
    }

    return (
        item.topic ||
        item.topicName ||
        item.title ||
        item.name ||
        item.label ||
        ""
    )
        .toString()
        .trim();
}


/* =========================================================
   EXTRACT SUBJECTS FROM STUDY PLAN
========================================================= */

function extractSubjects(plan) {

    const subjects = [];

    if (!plan) {
        return subjects;
    }

    function add(value) {

        if (
            typeof value !== "string"
        ) {
            return;
        }

        const clean =
            value.trim();

        if (!clean) {
            return;
        }

        const normalized =
            normalizeSubjectName(
                clean
            );

        if (
            !subjects.some(
                item =>
                    item.toLowerCase() ===
                    normalized.toLowerCase()
            )
        ) {
            subjects.push(normalized);
        }
    }


    function inspectArray(array) {

        if (
            !Array.isArray(array)
        ) {
            return;
        }

        for (
            const item of array
        ) {

            if (
                typeof item ===
                "string"
            ) {
                add(item);
                continue;
            }

            if (
                item &&
                typeof item ===
                "object"
            ) {

                const subject =
                    getSubjectName(
                        item
                    );

                if (subject) {
                    add(subject);
                }
            }
        }
    }


    /*
       Common study-plan structures.
    */

    inspectArray(
        plan.subjects
    );

    inspectArray(
        plan.subjectList
    );

    inspectArray(
        plan.selectedSubjects
    );

    inspectArray(
        plan.courses
    );

    inspectArray(
        plan.studySubjects
    );

    if (
        Array.isArray(
            plan.plan
        )
    ) {
        inspectArray(
            plan.plan
        );
    }


    /*
       Some versions store subjects
       under data.
    */

    if (
        plan.data &&
        typeof plan.data ===
            "object"
    ) {

        inspectArray(
            plan.data.subjects
        );

        inspectArray(
            plan.data.subjectList
        );
    }


    return subjects;
}


/* =========================================================
   EXTRACT TOPICS FOR SUBJECT
========================================================= */

function extractTopics(
    plan,
    selectedSubject
) {

    const topics = [];

    const normalizedSubject =
        normalizeSubjectName(
            selectedSubject
        );


    function addTopic(
        value
    ) {

        if (
            typeof value !== "string"
        ) {
            return;
        }

        const clean =
            value.trim();

        if (
            !clean ||
            clean.toLowerCase() ===
                "untitled topic"
        ) {
            return;
        }

        if (
            !topics.some(
                item =>
                    item.toLowerCase() ===
                    clean.toLowerCase()
            )
        ) {
            topics.push(clean);
        }
    }


    /*
       Curriculum topics ALWAYS belong
       to the selected subject.
    */

    const curriculumSubject =
        findCurriculumSubject(
            normalizedSubject
        );

    if (
        NIGERIAN_CURRICULUM[
            curriculumSubject
        ]
    ) {

        NIGERIAN_CURRICULUM[
            curriculumSubject
        ].forEach(
            addTopic
        );
    }


    if (!plan) {
        return topics;
    }


    function inspectTopicArray(
        array
    ) {

        if (
            !Array.isArray(array)
        ) {
            return;
        }

        for (
            const item of array
        ) {

            if (
                typeof item ===
                "string"
            ) {

                /*
                   A plain string has no subject
                   metadata. We only include it
                   when the plan itself represents
                   one subject or when it is the
                   selected subject's own topic list.
                */

                addTopic(item);

                continue;
            }


            if (
                !item ||
                typeof item !==
                    "object"
            ) {
                continue;
            }


            const itemSubject =
                getSubjectName(
                    item
                );

            /*
               If the object explicitly specifies
               a subject, it MUST match.
            */

            if (
                itemSubject &&
                normalizeSubjectName(
                    itemSubject
                ).toLowerCase() !==
                    normalizedSubject.toLowerCase()
            ) {
                continue;
            }


            const topic =
                getTopicName(
                    item
                );

            if (topic) {
                addTopic(topic);
            }
        }
    }


    /*
       Direct topic arrays.
    */

    inspectTopicArray(
        plan.topics
    );

    inspectTopicArray(
        plan.studyTopics
    );

    inspectTopicArray(
        plan.selectedTopics
    );


    /*
       Subjects array can contain:
       {
          subject: "Physics",
          topics: [...]
       }
    */

    const subjectArrays = [
        plan.subjects,
        plan.subjectList,
        plan.selectedSubjects,
        plan.courses,
        plan.studySubjects
    ];

    for (
        const array of subjectArrays
    ) {

        if (
            !Array.isArray(array)
        ) {
            continue;
        }

        for (
            const subjectItem of array
        ) {

            if (
                !subjectItem ||
                typeof subjectItem !==
                    "object"
            ) {
                continue;
            }

            const itemSubject =
                getSubjectName(
                    subjectItem
                );

            if (
                normalizeSubjectName(
                    itemSubject
                ).toLowerCase() !==
                    normalizedSubject.toLowerCase()
            ) {
                continue;
            }

            inspectTopicArray(
                subjectItem.topics
            );

            inspectTopicArray(
                subjectItem.studyTopics
            );
        }
    }


    return topics;
}


/* =========================================================
   FALLBACK TOPICS
========================================================= */

function getFallbackTopics(
    subject
) {

    const normalized =
        findCurriculumSubject(
            subject
        );

    if (
        NIGERIAN_CURRICULUM[
            normalized
        ]
    ) {

        return [
            ...NIGERIAN_CURRICULUM[
                normalized
            ]
        ];
    }

    return [
        "General Concepts",
        "Key Principles",
        "Applications",
        "Revision"
    ];
}


/* =========================================================
   SETUP ELEMENTS
========================================================= */

function getSubjectSelect() {

    return (
        $("subjectSelect") ||
        $("battleSubject")
    );
}


function getTopicSelect() {

    return (
        $("topicSelect") ||
        $("battleTopic")
    );
}


/* =========================================================
   LOAD BATTLE SETUP
========================================================= */

function loadBattleSetup() {

    const subjectSelect =
        getSubjectSelect();

    const topicSelect =
        getTopicSelect();

    if (!subjectSelect) {

        console.error(
            "Computer Battle: subject select not found."
        );

        return;
    }

    if (!topicSelect) {

        console.error(
            "Computer Battle: topic select not found."
        );

        return;
    }


    const plan =
        getStudyPlan();


    /*
       IMPORTANT:
       Always combine the user's study-plan
       subjects with the full curriculum.

       This prevents the dropdown from becoming
       Math-only when the study plan is incomplete.
    */

    const subjects = [
        ...extractSubjects(plan),
        ...getCurriculumSubjects()
    ];


    const uniqueSubjects = [];

    for (
        const subject of subjects
    ) {

        const normalized =
            normalizeSubjectName(
                subject
            );

        if (!normalized) {
            continue;
        }

        if (
            !uniqueSubjects.some(
                item =>
                    item.toLowerCase() ===
                    normalized.toLowerCase()
            )
        ) {
            uniqueSubjects.push(
                normalized
            );
        }
    }


    uniqueSubjects.sort(
        (a, b) =>
            a.localeCompare(
                b
            )
    );


    subjectSelect.innerHTML = "";


    for (
        const subject of uniqueSubjects
    ) {

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


    /*
       Default to the first subject.
    */

    if (
        uniqueSubjects.length > 0
    ) {

        subjectSelect.value =
            uniqueSubjects[0];

    }


    updateTopicOptions();


    /*
       Prevent duplicate change handlers.
    */

    if (
        subjectSelect.dataset
            .computerBattleBound !==
            "true"
    ) {

        subjectSelect.dataset
            .computerBattleBound =
            "true";

        subjectSelect.addEventListener(
            "change",
            updateTopicOptions
        );
    }


    console.log(
        "Computer Battle subjects loaded:",
        uniqueSubjects
    );
}


/* =========================================================
   UPDATE TOPICS
========================================================= */

function updateTopicOptions() {

    const subjectSelect =
        getSubjectSelect();

    const topicSelect =
        getTopicSelect();

    if (
        !subjectSelect ||
        !topicSelect
    ) {
        return;
    }


    const selectedSubject =
        subjectSelect.value;


    const plan =
        getStudyPlan();


    let topics =
        extractTopics(
            plan,
            selectedSubject
        );


    /*
       Ensure curriculum topics exist.
    */

    if (
        topics.length === 0
    ) {

        topics =
            getFallbackTopics(
                selectedSubject
            );
    }


    /*
       Remove duplicates.
    */

    topics =
        [
            ...new Set(
                topics.map(
                    topic =>
                        String(
                            topic
                        ).trim()
                )
            )
        ]
        .filter(Boolean);


    topicSelect.innerHTML = "";


    for (
        const topic of topics
    ) {

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


    if (
        topics.length > 0
    ) {

        topicSelect.value =
            topics[0];
    }


    console.log(
        "Computer Battle topics:",
        {
            subject:
                selectedSubject,
            topics
        }
    );
}


/* =========================================================
   SHUFFLE
========================================================= */

function shuffleArray(
    array
) {

    const copy =
        [...array];

    for (
        let i =
            copy.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );

        [
            copy[i],
            copy[j]
        ] = [
            copy[j],
            copy[i]
        ];
    }

    return copy;
}


/* =========================================================
   NORMALIZE QUESTION TEXT
========================================================= */

function normalizeQuestionText(
    value
) {

    return String(
        value || ""
    )
        .toLowerCase()
        .replace(
            /\s+/g,
            " "
        )
        .trim();
}


/* =========================================================
   FALLBACK QUESTION CREATION
========================================================= */

function getSubjectFallbackQuestions(
    subject,
    topic
) {

    const normalizedSubject =
        normalizeSubjectName(
            subject
        );


    const bank =
        SUBJECT_QUESTION_BANK[
            normalizedSubject
        ];


    /*
       Dedicated bank.
    */

    if (
        Array.isArray(bank) &&
        bank.length > 0
    ) {

        return bank.map(
            item => ({
                question:
                    item.q,

                answers:
                    [...item.a],

                correct:
                    item.c,

                subject:
                    normalizedSubject,

                topic:
                    topic
            })
        );
    }


    /*
       No dedicated bank.

       IMPORTANT:
       Do NOT use Mathematics here.
    */

    const generic =
        createGenericSubjectQuestions(
            normalizedSubject,
            topic,
            QUESTIONS_PER_BATTLE
        );


    return generic.map(
        item => ({
            question:
                item.q,

            answers:
                [...item.a],

            correct:
                item.c,

            subject:
                normalizedSubject,

            topic:
                topic
        })
    );
}


/* =========================================================
   SHUFFLE ANSWERS WHILE PRESERVING CORRECT ANSWER
========================================================= */

function shuffleQuestionAnswers(
    question
) {

    const correctAnswer =
        question.answers[
            question.correct
        ];


    const answers =
        shuffleArray(
            question.answers
        );


    const newCorrectIndex =
        answers.findIndex(
            answer =>
                answer ===
                correctAnswer
        );


    return {
        ...question,

        answers,

        correct:
            newCorrectIndex
    };
}


/* =========================================================
   BUILD FALLBACK BATTLE
========================================================= */

function buildFallbackBattleQuestions(
    subject,
    topic
) {

    const bank =
        getSubjectFallbackQuestions(
            subject,
            topic
        );


    const unique = [];

    const seen =
        new Set();


    /*
       Shuffle the bank before selecting.
    */

    const shuffled =
        shuffleArray(
            bank
        );


    for (
        const question of shuffled
    ) {

        const key =
            normalizeQuestionText(
                question.question
            );


        if (
            seen.has(key)
        ) {
            continue;
        }


        seen.add(key);


        unique.push(
            shuffleQuestionAnswers(
                question
            )
        );


        if (
            unique.length >=
            QUESTIONS_PER_BATTLE
        ) {
            break;
        }
    }


    /*
       If the dedicated bank contains
       fewer than 10 questions, cycle it
       rather than switching to Mathematics.
    */

    while (
        unique.length <
        QUESTIONS_PER_BATTLE
    ) {

        const extra =
            shuffleArray(
                bank
            );


        for (
            const question of extra
        ) {

            if (
                unique.length >=
                QUESTIONS_PER_BATTLE
            ) {
                break;
            }


            const key =
                normalizeQuestionText(
                    question.question
                );


            /*
               We deliberately allow a repeated
               question only if the bank is too
               small to reach 10.
            */

            unique.push(
                shuffleQuestionAnswers(
                    question
                )
            );
        }
    }


    return unique.slice(
        0,
        QUESTIONS_PER_BATTLE
    );
}


/* =========================================================
   AI JSON CLEANING
========================================================= */

function cleanAIJson(
    text
) {

    return String(
        text || ""
    )
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
}


/* =========================================================
   EXTRACT QUESTIONS FROM AI RESPONSE
========================================================= */

function extractQuestionsFromAIResponse(
    data
) {

    if (
        Array.isArray(data)
    ) {
        return data;
    }


    if (
        Array.isArray(
            data?.questions
        )
    ) {
        return data.questions;
    }


    if (
        Array.isArray(
            data?.data
        )
    ) {
        return data.data;
    }


    if (
        Array.isArray(
            data?.data?.questions
        )
    ) {
        return data.data.questions;
    }


    const possibleText =
        data?.content ||
        data?.text ||
        data?.output ||
        data?.response;


    if (
        typeof possibleText ===
        "string"
    ) {

        try {

            const parsed =
                JSON.parse(
                    cleanAIJson(
                        possibleText
                    )
                );


            return extractQuestionsFromAIResponse(
                parsed
            );

        } catch (error) {

            /*
               Sometimes the model may include
               text around the JSON.
            */

            const firstBrace =
                possibleText.indexOf(
                    "{"
                );

            const lastBrace =
                possibleText.lastIndexOf(
                    "}"
                );


            if (
                firstBrace >= 0 &&
                lastBrace > firstBrace
            ) {

                try {

                    const jsonText =
                        possibleText.slice(
                            firstBrace,
                            lastBrace + 1
                        );


                    const parsed =
                        JSON.parse(
                            jsonText
                        );


                    return extractQuestionsFromAIResponse(
                        parsed
                    );

                } catch (secondError) {

                    console.warn(
                        "Could not parse AI question JSON:",
                        secondError
                    );
                }
            }
        }
    }


    return [];
}


/* =========================================================
   VALIDATE AI QUESTIONS
========================================================= */

function validateAIQuestions(
    questions,
    selectedSubject,
    selectedTopic
) {

    if (
        !Array.isArray(
            questions
        )
    ) {
        return [];
    }


    const result = [];

    const seen =
        new Set();


    for (
        const raw of questions
    ) {

        if (
            !raw ||
            typeof raw !==
                "object"
        ) {
            continue;
        }


        const question =
            String(
                raw.question ||
                raw.questionText ||
                raw.text ||
                ""
            ).trim();


        if (!question) {
            continue;
        }


        let answers =
            raw.answers ||
            raw.options ||
            raw.choices;


        if (
            !Array.isArray(
                answers
            )
        ) {
            continue;
        }


        answers =
            answers
                .map(
                    answer =>
                        String(
                            answer
                        ).trim()
                )
                .filter(Boolean);


        if (
            answers.length !== 4
        ) {
            continue;
        }


        let correct =
            Number(
                raw.correct
            );


        /*
           Support correctIndex.
        */

        if (
            !Number.isInteger(
                correct
            )
        ) {

            correct =
                Number(
                    raw.correctIndex
                );
        }


        /*
           Support correctAnswer.
        */

        if (
            !Number.isInteger(
                correct
            ) &&
            typeof raw.correctAnswer ===
                "string"
        ) {

            correct =
                answers.findIndex(
                    answer =>
                        normalizeQuestionText(
                            answer
                        ) ===
                        normalizeQuestionText(
                            raw.correctAnswer
                        )
                );
        }


        /*
           Some APIs return 1-4 instead
           of 0-3.
        */

        if (
            Number.isInteger(
                correct
            ) &&
            correct >= 1 &&
            correct <= 4 &&
            raw.correctIndex ===
                undefined &&
            raw.correctAnswer ===
                undefined
        ) {

            /*
               Only convert if there is no
               obvious 0-based indication.
            */

            if (
                correct === 4
            ) {
                correct = 3;
            } else {
                correct -= 1;
            }
        }


        if (
            !Number.isInteger(
                correct
            ) ||
            correct < 0 ||
            correct > 3
        ) {
            continue;
        }


        const key =
            normalizeQuestionText(
                question
            );


        if (
            seen.has(key)
        ) {
            continue;
        }


        seen.add(key);


        result.push({
            question,

            answers,

            correct,

            subject:
                selectedSubject,

            topic:
                selectedTopic
        });
    }


    return result;
}


/* =========================================================
   GENERATE AI QUESTIONS
========================================================= */

async function generateAIQuestions(
    subject,
    topic
) {

    const selectedSubject =
        normalizeSubjectName(
            subject
        );


    const selectedTopic =
        String(
            topic ||
            "General Concepts"
        ).trim();


    const prompt = `
You are generating questions for StudyMind AI's academic battle game.

SELECTED SUBJECT:
${selectedSubject}

SELECTED TOPIC:
${selectedTopic}

Generate exactly ${QUESTIONS_PER_BATTLE} multiple-choice questions.

STRICT RULES:

1. Every question MUST belong to the selected subject: ${selectedSubject}.
2. Every question MUST be related to the selected topic: ${selectedTopic}.
3. NEVER switch to Mathematics unless the selected subject is Mathematics.
4. NEVER generate questions from another subject.
5. Do not use generic questions when a specific academic question can be created.
6. Questions should be appropriate for Nigerian senior secondary school students.
7. Make the questions varied in difficulty.
8. Do not repeat questions.
9. Each question must have exactly 4 answer choices.
10. There must be exactly one correct answer.
11. Return ONLY JSON.

Return this exact structure:

{
  "questions": [
    {
      "question": "Question here",
      "answers": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correct": 0
    }
  ]
}

The "correct" value MUST be zero-based:
0 = first answer
1 = second answer
2 = third answer
3 = fourth answer
`;


    console.log(
        "Requesting AI questions:",
        {
            subject:
                selectedSubject,
            topic:
                selectedTopic
        }
    );


    const response =
        await fetch(
            AI_QUESTION_ENDPOINT,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        subject:
                            selectedSubject,

                        topic:
                            selectedTopic,

                        count:
                            QUESTIONS_PER_BATTLE,

                        prompt:
                            prompt
                    })
            }
        );


    /*
       Fetch resolves even for HTTP errors,
       so explicitly check response.ok.
    */

    if (
        !response.ok
    ) {

        throw new Error(
            `AI server returned HTTP ${response.status}`
        );
    }


    const data =
        await response.json();


    console.log(
        "AI question response:",
        data
    );


    const rawQuestions =
        extractQuestionsFromAIResponse(
            data
        );


    const questions =
        validateAIQuestions(
            rawQuestions,
            selectedSubject,
            selectedTopic
        );


    console.log(
        `AI returned ${questions.length} valid questions for ${selectedSubject}.`
    );


    return questions;
}


/* =========================================================
   GET QUESTIONS FOR BATTLE
========================================================= */

async function getQuestionsForBattle(
    subject,
    topic
) {

    const selectedSubject =
        normalizeSubjectName(
            subject
        );


    const selectedTopic =
        String(
            topic ||
            "General Concepts"
        ).trim();


    /*
       First attempt: AI.
    */

    try {

        const aiQuestions =
            await generateAIQuestions(
                selectedSubject,
                selectedTopic
            );


        if (
            aiQuestions.length >=
            QUESTIONS_PER_BATTLE
        ) {

            return shuffleArray(
                aiQuestions
            ).slice(
                0,
                QUESTIONS_PER_BATTLE
            );
        }


        /*
           If AI produced some valid questions,
           preserve them and fill the remainder
           from the SAME subject.
        */

        if (
            aiQuestions.length > 0
        ) {

            const fallback =
                buildFallbackBattleQuestions(
                    selectedSubject,
                    selectedTopic
                );


            const used =
                new Set(
                    aiQuestions.map(
                        q =>
                            normalizeQuestionText(
                                q.question
                            )
                    )
                );


            for (
                const question of fallback
            ) {

                if (
                    aiQuestions.length >=
                    QUESTIONS_PER_BATTLE
                ) {
                    break;
                }


                const key =
                    normalizeQuestionText(
                        question.question
                    );


                if (
                    used.has(key)
                ) {
                    continue;
                }


                used.add(key);

                aiQuestions.push(
                    question
                );
            }


            return shuffleArray(
                aiQuestions
            ).slice(
                0,
                QUESTIONS_PER_BATTLE
            );
        }

    } catch (error) {

        console.warn(
            "AI question generation failed:",
            error
        );
    }


    /*
       CRITICAL FALLBACK:
       This uses the SELECTED SUBJECT.
       It can NEVER automatically fall back
       to Mathematics.
    */

    console.log(
        "Using subject-specific fallback:",
        {
            subject:
                selectedSubject,
            topic:
                selectedTopic
        }
    );


    return buildFallbackBattleQuestions(
        selectedSubject,
        selectedTopic
    );
}


/* =========================================================
   BATTLE UI
========================================================= */

function showElement(
    id
) {

    const element =
        $(id);

    if (!element) {
        return;
    }

    element.style.display =
        "";
}


function hideElement(
    id
) {

    const element =
        $(id);

    if (!element) {
        return;
    }

    element.style.display =
        "none";
}


/* =========================================================
   BATTLE SCREEN ELEMENT HELPERS
========================================================= */

function getBattleSetupElement() {
    return (
        $("battleSetup")
    );
}


function getBattleLoadingElement() {
    return (
        $("battleLoading")
    );
}


function getBattleScreenElement() {
    return (
        $("battleScreen")
    );
}


function getBattleResultsElement() {
    return (
        $("battleResults")
    );
}


/* =========================================================
   SHOW BATTLE LOADING
========================================================= */

function showBattleLoading(
    message =
        "Generating your battle..."
) {

    const loading =
        getBattleLoadingElement();

    if (loading) {

        loading.style.display =
            "";
    }


    const messageElements = [
        $("loadingText"),
        $("battleLoadingText"),
        $("loadingMessage")
    ];


    for (
        const element of messageElements
    ) {

        if (element) {

            element.textContent =
                message;
        }
    }
}


/* =========================================================
   SHOW BATTLE SETUP
========================================================= */

function showBattleSetup() {

    const setup =
        getBattleSetupElement();

    const loading =
        getBattleLoadingElement();

    const screen =
        getBattleScreenElement();

    const results =
        getBattleResultsElement();


    if (setup) {
        setup.style.display =
            "";
    }

    if (loading) {
        loading.style.display =
            "none";
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
   SHOW ACTIVE BATTLE
========================================================= */

function showActiveBattle() {

    const setup =
        getBattleSetupElement();

    const loading =
        getBattleLoadingElement();

    const screen =
        getBattleScreenElement();

    const results =
        getBattleResultsElement();


    if (setup) {
        setup.style.display =
            "none";
    }

    if (loading) {
        loading.style.display =
            "none";
    }

    if (screen) {
        screen.style.display =
            "";
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
        getBattleSetupElement();

    const loading =
        getBattleLoadingElement();

    const screen =
        getBattleScreenElement();

    const results =
        getBattleResultsElement();


    if (setup) {
        setup.style.display =
            "none";
    }

    if (loading) {
        loading.style.display =
            "none";
    }

    if (screen) {
        screen.style.display =
            "none";
    }

    if (results) {
        results.style.display =
            "";
    }
}


/* =========================================================
   DISPLAY QUESTION
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


    const currentNumber =
        battleState.currentQuestionIndex +
        1;


    /*
       Round number.
    */

    const roundElements = [
        $("roundNumber"),
        $("battleRound")
    ];


    for (
        const element of roundElements
    ) {

        if (element) {
            element.textContent =
                `${currentNumber}/${QUESTIONS_PER_BATTLE}`;
        }
    }


    /*
       Question topic.
    */

    const topicElements = [
        $("questionTopic"),
        $("battleCurrentTopic")
    ];


    for (
        const element of topicElements
    ) {

        if (element) {

            element.textContent =
                battleState.topic;
        }
    }


    /*
       Subject.
    */

    const subjectElements = [
        $("battleCurrentSubject"),
        $("currentBattleSubject")
    ];


    for (
        const element of subjectElements
    ) {

        if (element) {

            element.textContent =
                battleState.subject;
        }
    }


    /*
       Question text.
    */

    const questionElements = [
        $("questionText"),
        $("battleQuestion")
    ];


    for (
        const element of questionElements
    ) {

        if (element) {

            element.textContent =
                question.question;
        }
    }


    /*
       Answers.
    */

    const answerContainer =
        $("answerGrid") ||
        $("battleAnswers");


    if (!answerContainer) {
        return;
    }


    answerContainer.innerHTML =
        "";


    question.answers.forEach(
        (
            answer,
            index
        ) => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "battle-answer";


            button.textContent =
                answer;


            button.dataset.index =
                index;


            button.addEventListener(
                "click",
                () =>
                    handlePlayerAnswer(
                        index
                    )
            );


            answerContainer.appendChild(
                button
            );
        }
    );


    /*
       Progress.
    */

    const progress =
        (
            currentNumber /
            QUESTIONS_PER_BATTLE
        ) *
        100;


    const progressElements = [
        $("battleProgressBar"),
        $("battleProgress")
    ];


    for (
        const element of progressElements
    ) {

        if (!element) {
            continue;
        }


        if (
            element.style &&
            "width" in
                element.style
        ) {

            element.style.width =
                `${progress}%`;
        }


        if (
            element.tagName ===
            "PROGRESS"
        ) {

            element.value =
                progress;
        }
    }


    updateScoreUI();


    startQuestionTimer();
}


/* =========================================================
   SCORE UI
========================================================= */

function updateScoreUI() {

    const playerElements = [
        $("playerScore"),
        $("battlePlayerScore")
    ];


    const computerElements = [
        $("computerScore"),
        $("battleComputerScore")
    ];


    for (
        const element of playerElements
    ) {

        if (element) {

            element.textContent =
                battleState.playerScore;
        }
    }


    for (
        const element of computerElements
    ) {

        if (element) {

            element.textContent =
                battleState.computerScore;
        }
    }
}


/* =========================================================
   TIMER
========================================================= */

function clearBattleTimer() {

    if (
        battleState.timer
    ) {

        clearInterval(
            battleState.timer
        );

        battleState.timer =
            null;
    }
}


function updateTimerUI(
    seconds
) {

    const timerElements = [
        $("timerNumber"),
        $("battleTimer")
    ];


    for (
        const element of timerElements
    ) {

        if (element) {

            element.textContent =
                String(
                    seconds
                );
        }
    }


    const percentage =
        (
            seconds /
            QUESTION_TIME_LIMIT
        ) *
        100;


    const timerBars = [
        $("battleTimerBar"),
        $("timerProgressBar")
    ];


    for (
        const element of timerBars
    ) {

        if (!element) {
            continue;
        }


        element.style.width =
            `${percentage}%`;
    }
}


function startQuestionTimer() {

    clearBattleTimer();


    battleState.timerSeconds =
        QUESTION_TIME_LIMIT;


    battleState.playerAnswered =
        false;


    battleState.computerAnswered =
        false;


    updateTimerUI(
        battleState.timerSeconds
    );


    battleState.timer =
        setInterval(
            () => {

                battleState.timerSeconds--;

                updateTimerUI(
                    battleState.timerSeconds
                );


                if (
                    battleState.timerSeconds <=
                    0
                ) {

                    clearBattleTimer();

                    handleQuestionTimeout();
                }

            },
            1000
        );
}


/* =========================================================
   PLAYER ANSWER
========================================================= */

function handlePlayerAnswer(
    answerIndex
) {

    if (
        !battleState.battleStarted ||
        battleState.battleFinished ||
        battleState.playerAnswered
    ) {
        return;
    }


    battleState.playerAnswered =
        true;


    clearBattleTimer();


    const question =
        battleState.questions[
            battleState.currentQuestionIndex
        ];


    if (!question) {
        return;
    }


    const buttons =
        document.querySelectorAll(
            "#answerGrid button, #battleAnswers button"
        );


    buttons.forEach(
        button => {

            button.disabled =
                true;
        }
    );


    const selectedButton =
        [...buttons].find(
            button =>
                Number(
                    button.dataset.index
                ) ===
                answerIndex
        );


    const correctButton =
        [...buttons].find(
            button =>
                Number(
                    button.dataset.index
                ) ===
                question.correct
        );


    if (
        answerIndex ===
        question.correct
    ) {

        battleState.playerScore++;


        if (selectedButton) {

            selectedButton.classList.add(
                "correct"
            );
        }

        showBattleFeedback(
            "Correct!",
            true
        );

    } else {

        if (selectedButton) {

            selectedButton.classList.add(
                "incorrect"
            );
        }

        if (correctButton) {

            correctButton.classList.add(
                "correct"
            );
        }

        showBattleFeedback(
            "Incorrect",
            false
        );
    }


    updateScoreUI();


    /*
       Computer answers after a short delay.
    */

    setTimeout(
        computerAnswer,
        900
    );
}


/* =========================================================
   TIMEOUT
========================================================= */

function handleQuestionTimeout() {

    if (
        battleState.playerAnswered
    ) {
        return;
    }


    battleState.playerAnswered =
        true;


    const question =
        battleState.questions[
            battleState.currentQuestionIndex
        ];


    if (!question) {
        return;
    }


    const buttons =
        document.querySelectorAll(
            "#answerGrid button, #battleAnswers button"
        );


    buttons.forEach(
        button => {

            button.disabled =
                true;
        }
    );


    const correctButton =
        [...buttons].find(
            button =>
                Number(
                    button.dataset.index
                ) ===
                question.correct
        );


    if (correctButton) {

        correctButton.classList.add(
            "correct"
        );
    }


    showBattleFeedback(
        "Time's up!",
        false
    );


    setTimeout(
        computerAnswer,
        900
    );
}


/* =========================================================
   BATTLE FEEDBACK
========================================================= */

function showBattleFeedback(
    message,
    correct
) {

    const elements = [
        $("battleFeedback")
    ];


    for (
        const element of elements
    ) {

        if (!element) {
            continue;
        }


        element.textContent =
            message;


        element.classList.remove(
            "correct",
            "incorrect"
        );


        element.classList.add(
            correct
                ? "correct"
                : "incorrect"
        );
    }
}


/* =========================================================
   COMPUTER ANSWER
========================================================= */

function computerAnswer() {

    if (
        battleState.battleFinished
    ) {
        return;
    }


    if (
        battleState.computerAnswered
    ) {
        return;
    }


    battleState.computerAnswered =
        true;


    const question =
        battleState.questions[
            battleState.currentQuestionIndex
        ];


    if (!question) {
        return;
    }


    /*
       Computer has a variable probability
       rather than always getting the same result.
    */

    const difficultyFactor =
        Math.random();


    let computerCorrect;


    if (
        difficultyFactor < 0.68
    ) {

        computerCorrect =
            true;

    } else {

        computerCorrect =
            false;
    }


    if (
        computerCorrect
    ) {

        battleState.computerScore++;
    }


    updateScoreUI();


    setTimeout(
        nextQuestion,
        650
    );
}


/* =========================================================
   NEXT QUESTION
========================================================= */

function nextQuestion() {

    if (
        battleState.battleFinished
    ) {
        return;
    }


    battleState.currentQuestionIndex++;


    if (
        battleState.currentQuestionIndex >=
        battleState.questions.length
    ) {

        finishBattle();

        return;
    }


    battleState.playerAnswered =
        false;


    battleState.computerAnswered =
        false;


    const feedback =
        $("battleFeedback");


    if (feedback) {

        feedback.textContent =
            "";

        feedback.classList.remove(
            "correct",
            "incorrect"
        );
    }


    displayCurrentQuestion();
}


/* =========================================================
   START COMPUTER BATTLE
========================================================= */

async function startComputerBattle() {

    if (
        battleState.battleStarted
    ) {
        return;
    }


    const subjectSelect =
        getSubjectSelect();


    const topicSelect =
        getTopicSelect();


    const selectedSubject =
        subjectSelect?.value ||
        "Mathematics";


    const selectedTopic =
        topicSelect?.value ||
        "General Concepts";


    /*
       IMPORTANT:
       Store the EXACT selected values.
    */

    battleState.subject =
        normalizeSubjectName(
            selectedSubject
        );


    battleState.topic =
        String(
            selectedTopic
        ).trim();


    battleState.currentQuestionIndex =
        0;


    battleState.playerScore =
        0;


    battleState.computerScore =
        0;


    battleState.battleStarted =
        true;


    battleState.battleFinished =
        false;


    console.log(
        "STARTING COMPUTER BATTLE",
        {
            subject:
                battleState.subject,

            topic:
                battleState.topic
        }
    );


    showBattleLoading(
        `Preparing ${battleState.subject} questions...`
    );


    /*
       Check authentication.
    */

    const supabase =
        await waitForSupabaseClient();


    if (!supabase) {

        battleState.battleStarted =
            false;


        showBattleError(
            "Unable to connect to StudyMind. Please refresh the page."
        );


        return;
    }


    try {

        const {
            data,
            error
        } =
            await supabase.auth.getUser();


        if (
            error ||
            !data?.user
        ) {

            throw new Error(
                "You must be logged in to play."
            );
        }


        battleState.user =
            data.user;


        /*
           Generate questions.
        */

        battleState.questions =
            await getQuestionsForBattle(
                battleState.subject,
                battleState.topic
            );


        if (
            !Array.isArray(
                battleState.questions
            ) ||
            battleState.questions.length === 0
        ) {

            throw new Error(
                `No questions could be generated for ${battleState.subject}.`
            );
        }


        /*
           Final safety validation:
           every question must carry the
           selected subject.
        */

        battleState.questions =
            battleState.questions.map(
                question => ({
                    ...question,

                    subject:
                        battleState.subject,

                    topic:
                        battleState.topic
                })
            );


        /*
           Shuffle the final question order
           one more time.
        */

        battleState.questions =
            shuffleArray(
                battleState.questions
            ).slice(
                0,
                QUESTIONS_PER_BATTLE
            );


        /*
           If somehow fewer than 10 remain,
           rebuild using the same subject.
        */

        if (
            battleState.questions.length <
            QUESTIONS_PER_BATTLE
        ) {

            const fallback =
                buildFallbackBattleQuestions(
                    battleState.subject,
                    battleState.topic
                );


            const used =
                new Set(
                    battleState.questions.map(
                        question =>
                            normalizeQuestionText(
                                question.question
                            )
                    )
                );


            for (
                const question of fallback
            ) {

                if (
                    battleState.questions.length >=
                    QUESTIONS_PER_BATTLE
                ) {
                    break;
                }


                const key =
                    normalizeQuestionText(
                        question.question
                    );


                if (
                    used.has(key)
                ) {
                    continue;
                }


                used.add(key);


                battleState.questions.push(
                    question
                );
            }
        }


        console.log(
            "FINAL QUESTIONS:",
            battleState.questions.map(
                question => ({
                    subject:
                        question.subject,

                    topic:
                        question.topic,

                    question:
                        question.question
                })
            )
        );


        showActiveBattle();


        displayCurrentQuestion();


    } catch (error) {

        console.error(
            "Computer Battle failed:",
            error
        );


        battleState.battleStarted =
            false;


        clearBattleTimer();


        showBattleError(
            error.message ||
            "Unable to start the battle."
        );
    }
}


/* =========================================================
   ERROR UI
========================================================= */

function showBattleError(
    message
) {

    const loading =
        getBattleLoadingElement();


    if (loading) {

        loading.style.display =
            "";
    }


    const errorElements = [
        $("battleError"),
        $("loadingError"),
        $("errorMessage")
    ];


    let displayed =
        false;


    for (
        const element of errorElements
    ) {

        if (!element) {
            continue;
        }


        element.textContent =
            message;


        element.style.display =
            "";


        displayed =
            true;
    }


    if (!displayed) {

        console.error(
            message
        );
    }


    /*
       Return to setup after a short delay
       so the user can try again.
    */

    setTimeout(
        () => {

            battleState.battleStarted =
                false;


            showBattleSetup();

        },
        3000
    );
}


/* =========================================================
   CALCULATE BATTLE POINTS
========================================================= */

function calculateBattlePoints() {

    const player =
        battleState.playerScore;


    const computer =
        battleState.computerScore;


    if (
        player > computer
    ) {

        return 25;
    }


    if (
        player === computer
    ) {

        return 10;
    }


    return 5;
}


/* =========================================================
   GET BATTLE RESULT
========================================================= */

function getBattleResult() {

    if (
        battleState.playerScore >
        battleState.computerScore
    ) {

        return "win";
    }


    if (
        battleState.playerScore ===
        battleState.computerScore
    ) {

        return "draw";
    }


    return "loss";
}


/* =========================================================
   UPDATE LEADERBOARD
========================================================= */

async function updateLeaderboard() {

    const supabase =
        getComputerBattleSupabase();


    if (
        !supabase ||
        !battleState.user
    ) {

        return;
    }


    const result =
        getBattleResult();


    const points =
        calculateBattlePoints();


    try {

        const {
            data:
            existing,
            error:
            fetchError
        } =
            await supabase
                .from(
                    "game_leaderboard"
                )
                .select(
                    "user_id,display_name,battle_points,wins,losses,draws,battles_played"
                )
                .eq(
                    "user_id",
                    battleState.user.id
                )
                .maybeSingle();


        if (
            fetchError
        ) {

            throw fetchError;
        }


        const current =
            existing || {};


        const displayName =
            current.display_name ||
            battleState.user.user_metadata
                ?.display_name ||
            battleState.user.user_metadata
                ?.full_name ||
            battleState.user.email
                ?.split("@")[0] ||
            "StudyMind Player";


        const payload = {

            user_id:
                battleState.user.id,

            display_name:
                displayName,

            battle_points:
                (
                    Number(
                        current.battle_points
                    ) || 0
                ) + points,

            wins:
                (
                    Number(
                        current.wins
                    ) || 0
                ) +
                (
                    result === "win"
                        ? 1
                        : 0
                ),

            losses:
                (
                    Number(
                        current.losses
                    ) || 0
                ) +
                (
                    result === "loss"
                        ? 1
                        : 0
                ),

            draws:
                (
                    Number(
                        current.draws
                    ) || 0
                ) +
                (
                    result === "draw"
                        ? 1
                        : 0
                ),

            battles_played:
                (
                    Number(
                        current.battles_played
                    ) || 0
                ) + 1,

            updated_at:
                new Date().toISOString()
        };


        const {
            error
        } =
            await supabase
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


        if (error) {
            throw error;
        }


        console.log(
            "Leaderboard updated:",
            payload
        );


    } catch (error) {

        console.error(
            "Leaderboard update failed:",
            error
        );
    }
}


/* =========================================================
   DISPLAY RESULTS
========================================================= */

async function displayBattleResults() {

    const result =
        getBattleResult();


    const points =
        calculateBattlePoints();


    const finalPlayer =
        $("finalPlayerScore");


    const finalComputer =
        $("finalComputerScore");


    const pointsElement =
        $("battlePointsEarned");


    if (finalPlayer) {

        finalPlayer.textContent =
            battleState.playerScore;
    }


    if (finalComputer) {

        finalComputer.textContent =
            battleState.computerScore;
    }


    if (pointsElement) {

        pointsElement.textContent =
            `+${points}`;
    }


    const icon =
        $("resultIcon");


    const title =
        $("resultTitle");


    const summary =
        $("resultSummary");


    const message =
        $("battleResultMessage");


    if (
        result === "win"
    ) {

        if (icon) {
            icon.textContent = "🏆";
        }

        if (title) {
            title.textContent =
                "You Win!";
        }

        if (summary) {
            summary.textContent =
                "Excellent work! You outscored the computer.";
        }

    } else if (
        result === "draw"
    ) {

        if (icon) {
            icon.textContent = "🤝";
        }

        if (title) {
            title.textContent =
                "It's a Draw!";
        }

        if (summary) {
            summary.textContent =
                "Both sides finished with the same score.";
        }

    } else {

        if (icon) {
            icon.textContent = "📚";
        }

        if (title) {
            title.textContent =
                "Good Battle!";
        }

        if (summary) {
            summary.textContent =
                "Keep studying and come back stronger.";
        }
    }


    if (message) {

        message.textContent =
            `${battleState.subject} • ${battleState.topic}`;
    }


    showBattleResults();


    /*
       Save leaderboard result.
    */

    await updateLeaderboard();
}


/* =========================================================
   FINISH BATTLE
========================================================= */

async function finishBattle() {

    if (
        battleState.battleFinished
    ) {
        return;
    }


    battleState.battleFinished =
        true;


    battleState.battleStarted =
        false;


    clearBattleTimer();


    /*
       Increment local battle counter.
    */

    incrementLocalBattleCount();


    await displayBattleResults();
}


/* =========================================================
   FREE BATTLE COUNTER
========================================================= */

function incrementLocalBattleCount() {

    const keys = [
        "studyMindBattlesUsed",
        "studyMindGameBattlesUsed",
        "gameBattlesUsed",
        "computerBattleCount"
    ];


    let current =
        0;


    for (
        const key of keys
    ) {

        const value =
            localStorage.getItem(
                key
            );


        if (
            value !== null
        ) {

            const parsed =
                parseInt(
                    value,
                    10
                );


            if (
                Number.isFinite(
                    parsed
                ) &&
                parsed > current
            ) {

                current =
                    parsed;
            }
        }
    }


    current++;


    /*
       Primary key.
    */

    localStorage.setItem(
        "studyMindBattlesUsed",
        String(current)
    );


    /*
       Compatibility keys.
    */

    localStorage.setItem(
        "studyMindGameBattlesUsed",
        String(current)
    );


    localStorage.setItem(
        "gameBattlesUsed",
        String(current)
    );


    localStorage.setItem(
        "computerBattleCount",
        String(current)
    );


    console.log(
        "Computer battles used:",
        current
    );
}


/* =========================================================
   PLAY AGAIN
========================================================= */

function playAgain() {

    battleState.questions =
        [];

    battleState.currentQuestionIndex =
        0;

    battleState.playerScore =
        0;

    battleState.computerScore =
        0;

    battleState.playerAnswered =
        false;

    battleState.computerAnswered =
        false;

    battleState.battleStarted =
        false;

    battleState.battleFinished =
        false;


    clearBattleTimer();


    /*
       Keep the selected subject and topic,
       but generate a completely new question
       set.
    */

    showBattleSetup();
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
   AUTHENTICATION CHECK
========================================================= */

async function verifyComputerBattleUser() {

    const supabase =
        await waitForSupabaseClient();


    if (!supabase) {

        throw new Error(
            "StudyMind authentication is unavailable."
        );
    }


    const {
        data,
        error
    } =
        await supabase.auth.getUser();


    if (
        error ||
        !data?.user
    ) {

        throw new Error(
            "Please log in before starting a battle."
        );
    }


    battleState.user =
        data.user;


    return data.user;
}


/* =========================================================
   INITIALIZE COMPUTER BATTLE
========================================================= */

async function initializeComputerBattle() {

    console.log(
        "StudyMind Computer Battle initializing..."
    );


    try {

        await verifyComputerBattleUser();

    } catch (error) {

        console.error(
            "Authentication error:",
            error
        );


        /*
           Do not redirect immediately.
           The page can show the error.
        */

        showBattleError(
            error.message
        );


        return;
    }


    /*
       Load subject/topic dropdowns.
    */

    loadBattleSetup();


    /*
       Make sure the start button is bound
       exactly once.
    */

    const startButton =
        $("startBattleButton");


    if (
        startButton &&
        startButton.dataset
            .computerBattleBound !==
            "true"
    ) {

        startButton.dataset
            .computerBattleBound =
            "true";


        /*
           Remove old inline handler.
        */

        startButton.onclick =
            null;


        startButton.addEventListener(
            "click",
            function(event) {

                event.preventDefault();

                startComputerBattle();

            }
        );
    }


    /*
       Compatibility aliases.
    */

    window.startComputerBattle =
        startComputerBattle;


    window.playAgain =
        playAgain;


    window.returnToGameMode =
        returnToGameMode;


    window.updateTopicOptions =
        updateTopicOptions;


    console.log(
        "StudyMind Computer Battle initialized."
    );
}


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
   GLOBAL EXPORTS
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


/* =========================================================
   DEBUG HELPERS
========================================================= */

window.StudyMindBattleDebug = {

    getState() {
        return {
            subject:
                battleState.subject,

            topic:
                battleState.topic,

            questionCount:
                battleState.questions.length,

            currentQuestion:
                battleState.currentQuestionIndex,

            playerScore:
                battleState.playerScore,

            computerScore:
                battleState.computerScore
        };
    },

    getQuestions() {
        return battleState.questions;
    },

    getSubjects() {
        return getCurriculumSubjects();
    },

    getTopics(subject) {
        return getFallbackTopics(
            subject
        );
    },

    async regenerate() {

        return getQuestionsForBattle(
            battleState.subject,
            battleState.topic
        );
    }
};
