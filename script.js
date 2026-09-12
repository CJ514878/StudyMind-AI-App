"use strict";

/* =========================================================
   STUDYMIND AI — HOME / COMPLETE CURRICULUM SYSTEM
   =========================================================
   FEATURES
   - Complete curriculum database
   - Nigerian Junior Secondary Curriculum
   - BECE
   - Nigerian Senior Secondary Curriculum
   - WAEC
   - NECO
   - JAMB
   - IGCSE
   - SAT
   - Other / custom
   - Subject search
   - Topic search
   - Multi-subject selection
   - Multi-topic selection
   - Custom subject/topic support
   - Multiple exams
   - AI study-plan generation
   - Existing localStorage compatibility
   - Theme support
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
    "https://bicnrbqqvucgpbwudmit.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_70y0MPrj30-FimUSQK_HuA_Ng1a1qcB";

const supabaseClient =
    window.supabase?.createClient
        ? window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        )
        : null;

window.supabaseClient = supabaseClient;


/* =========================================================
   CURRICULUM DATABASE
========================================================= */

const CURRICULUMS = {


    /* =====================================================
       NIGERIAN JUNIOR SECONDARY CURRICULUM
    ===================================================== */

    "Nigerian Junior Secondary Curriculum": {

        subjects: {

            "Mathematics": [
                "Number and Numeration",
                "Whole Numbers",
                "Integers",
                "Fractions",
                "Decimals",
                "Percentages",
                "Ratio",
                "Proportion",
                "Rates",
                "Approximation",
                "Estimation",
                "Number Bases",
                "Indices",
                "Standard Form",
                "Algebraic Expressions",
                "Simplification of Expressions",
                "Linear Equations",
                "Simple Inequalities",
                "Word Problems",
                "Sequences",
                "Sets",
                "Venn Diagrams",
                "Coordinates",
                "Graphs",
                "Angles",
                "Lines",
                "Triangles",
                "Quadrilaterals",
                "Polygons",
                "Circles",
                "Symmetry",
                "Construction",
                "Mensuration",
                "Perimeter",
                "Area",
                "Volume",
                "Surface Area",
                "Statistics",
                "Data Collection",
                "Tables",
                "Bar Charts",
                "Pie Charts",
                "Histograms",
                "Probability",
                "Financial Mathematics"
            ],

            "English Studies": [
                "Parts of Speech",
                "Nouns",
                "Pronouns",
                "Verbs",
                "Adjectives",
                "Adverbs",
                "Prepositions",
                "Conjunctions",
                "Interjections",
                "Articles",
                "Determiners",
                "Sentence Structure",
                "Subject and Predicate",
                "Tenses",
                "Subject-Verb Agreement",
                "Active and Passive Voice",
                "Direct and Reported Speech",
                "Question Tags",
                "Punctuation",
                "Spelling",
                "Vocabulary Development",
                "Synonyms",
                "Antonyms",
                "Idioms",
                "Comprehension",
                "Summary Writing",
                "Informal Letter",
                "Formal Letter",
                "Essay Writing",
                "Narrative Essay",
                "Descriptive Essay",
                "Argumentative Essay",
                "Expository Essay",
                "Article Writing",
                "Report Writing",
                "Speech Writing",
                "Oral English",
                "Stress",
                "Intonation",
                "Rhymes",
                "Literature",
                "Poetry",
                "Prose",
                "Drama"
            ],

            "Basic Science": [
                "Living Things",
                "Non-Living Things",
                "Classification of Living Things",
                "Cells",
                "Plant Cells",
                "Animal Cells",
                "Nutrition",
                "Balanced Diet",
                "Digestive System",
                "Respiratory System",
                "Circulatory System",
                "Excretory System",
                "Reproductive System",
                "Health",
                "Personal Hygiene",
                "Disease",
                "Communicable Diseases",
                "Environment",
                "Pollution",
                "Conservation",
                "Energy",
                "Forms of Energy",
                "Energy Transformation",
                "Force",
                "Motion",
                "Work",
                "Heat",
                "Temperature",
                "Light",
                "Reflection",
                "Refraction",
                "Sound",
                "Electricity",
                "Simple Circuits",
                "Magnetism",
                "Matter",
                "States of Matter",
                "Changes of State",
                "Atoms and Molecules",
                "Mixtures",
                "Separation Techniques",
                "Water",
                "Air",
                "Soil",
                "Simple Machines",
                "Technology and Science"
            ],

            "Basic Technology": [
                "Technology and Society",
                "Safety Rules",
                "Workshop Safety",
                "Materials",
                "Wood",
                "Woodwork",
                "Metals",
                "Metalwork",
                "Plastics",
                "Ceramics",
                "Glass",
                "Technical Drawing",
                "Drawing Instruments",
                "Geometric Construction",
                "Orthographic Projection",
                "Building Technology",
                "Building Materials",
                "Electrical Technology",
                "Simple Electrical Circuits",
                "Electronics",
                "Machines",
                "Levers",
                "Pulleys",
                "Gears",
                "Energy",
                "Mechanical Energy",
                "Renewable Energy",
                "Maintenance"
            ],

            "Social Studies": [
                "Family",
                "Types of Family",
                "Family Relationships",
                "Culture",
                "Cultural Values",
                "Socialization",
                "Personality Development",
                "Citizenship",
                "Human Rights",
                "Responsibilities",
                "Democracy",
                "Leadership",
                "Population",
                "Population Growth",
                "Migration",
                "Environment",
                "Environmental Problems",
                "Social Problems",
                "Drug Abuse Awareness",
                "Peer Pressure",
                "Conflict",
                "Conflict Resolution",
                "National Unity",
                "Cooperation",
                "Community Development"
            ],

            "Computer Studies": [
                "Computer Fundamentals",
                "History of Computers",
                "Computer Generations",
                "Computer Hardware",
                "Computer Software",
                "Input Devices",
                "Output Devices",
                "Storage Devices",
                "Memory",
                "CPU",
                "Operating Systems",
                "File Management",
                "Word Processing",
                "Spreadsheets",
                "Presentations",
                "Databases",
                "Internet",
                "Web Browsing",
                "Email",
                "Computer Networks",
                "Cyber Safety",
                "Digital Citizenship",
                "Algorithms",
                "Flowcharts",
                "Programming Fundamentals",
                "Variables",
                "Data Types",
                "Conditional Statements",
                "Loops",
                "Artificial Intelligence"
            ],

            "Business Studies": [
                "Introduction to Business",
                "Occupation",
                "Trade",
                "Home Trade",
                "Foreign Trade",
                "Commerce",
                "Office Practice",
                "Office Equipment",
                "Communication",
                "Banking",
                "Insurance",
                "Bookkeeping",
                "Source Documents",
                "Cash Book",
                "Entrepreneurship",
                "Small Business",
                "Consumer Education",
                "Advertising",
                "Transportation",
                "Warehousing"
            ],

            "Agricultural Science": [
                "Meaning of Agriculture",
                "Importance of Agriculture",
                "Branches of Agriculture",
                "Farm Tools",
                "Farm Machinery",
                "Farm Safety",
                "Soil",
                "Soil Formation",
                "Soil Types",
                "Soil Properties",
                "Soil Fertility",
                "Soil Conservation",
                "Crops",
                "Crop Classification",
                "Crop Production",
                "Planting",
                "Crop Maintenance",
                "Harvesting",
                "Storage",
                "Livestock",
                "Animal Production",
                "Animal Nutrition",
                "Animal Health",
                "Farm Management",
                "Agricultural Economics",
                "Marketing"
            ],

            "Civic Education": [
                "Citizenship",
                "Types of Citizenship",
                "Rights and Duties",
                "Human Rights",
                "Rule of Law",
                "Democracy",
                "Constitution",
                "National Values",
                "Integrity",
                "Tolerance",
                "Leadership",
                "Good Governance",
                "Political Participation",
                "Elections",
                "National Symbols",
                "National Identity",
                "Patriotism",
                "Corruption",
                "Anti-Corruption",
                "Community Service"
            ],

            "Cultural and Creative Arts": [
                "Introduction to Art",
                "Elements of Art",
                "Principles of Design",
                "Drawing",
                "Painting",
                "Sculpture",
                "Textiles",
                "Crafts",
                "Drama",
                "Dance",
                "Music",
                "Nigerian Traditional Art",
                "Nigerian Traditional Music",
                "Art Appreciation",
                "Creative Design"
            ],

            "Physical and Health Education": [
                "Physical Fitness",
                "Components of Fitness",
                "Athletics",
                "Football",
                "Basketball",
                "Volleyball",
                "Handball",
                "Table Tennis",
                "Badminton",
                "Swimming",
                "Gymnastics",
                "First Aid",
                "Personal Hygiene",
                "Nutrition",
                "Health Education",
                "Safety",
                "Drug Abuse Prevention"
            ],

            "Home Economics": [
                "Introduction to Home Economics",
                "Food and Nutrition",
                "Food Groups",
                "Balanced Diet",
                "Meal Planning",
                "Food Preparation",
                "Food Preservation",
                "Clothing",
                "Textiles",
                "Sewing",
                "Family Living",
                "Child Development",
                "Home Management",
                "Consumer Education",
                "Household Resources"
            ],

            "Christian Religious Studies": [
                "Creation",
                "The Fall of Man",
                "Noah",
                "Abraham",
                "Isaac",
                "Jacob",
                "Joseph",
                "Moses",
                "The Ten Commandments",
                "The Judges",
                "The Kings",
                "The Prophets",
                "Birth of Jesus",
                "Ministry of Jesus",
                "Miracles of Jesus",
                "Parables",
                "Death and Resurrection",
                "Holy Spirit",
                "Early Church",
                "Christian Living"
            ],

            "Islamic Religious Studies": [
                "Quran",
                "Hadith",
                "Tawhid",
                "Articles of Faith",
                "Pillars of Islam",
                "Salah",
                "Zakat",
                "Sawm",
                "Hajj",
                "Prophet Muhammad",
                "Early Islam",
                "Islamic Morality",
                "Family Life",
                "Social Responsibility",
                "Islamic History"
            ]

        }

    },


    /* =====================================================
       BECE
    ===================================================== */

    "BECE": {

        subjects: {

            "Mathematics": [
                "Number Bases",
                "Whole Numbers",
                "Fractions",
                "Decimals",
                "Percentages",
                "Ratio",
                "Proportion",
                "Rates",
                "Indices",
                "Standard Form",
                "Logarithms",
                "Algebraic Expressions",
                "Linear Equations",
                "Simultaneous Equations",
                "Inequalities",
                "Sequences",
                "Sets",
                "Venn Diagrams",
                "Geometry",
                "Angles",
                "Triangles",
                "Quadrilaterals",
                "Circles",
                "Construction",
                "Mensuration",
                "Perimeter",
                "Area",
                "Volume",
                "Statistics",
                "Probability",
                "Graphs",
                "Coordinates",
                "Vectors",
                "Word Problems",
                "Financial Mathematics"
            ],

            "English Studies": [
                "Grammar",
                "Parts of Speech",
                "Tenses",
                "Agreement",
                "Sentence Structure",
                "Vocabulary",
                "Synonyms",
                "Antonyms",
                "Comprehension",
                "Summary",
                "Essay Writing",
                "Letter Writing",
                "Article Writing",
                "Report Writing",
                "Speech Writing",
                "Oral English",
                "Literature",
                "Poetry",
                "Prose",
                "Drama"
            ],

            "Basic Science": [
                "Cells",
                "Living Organisms",
                "Classification",
                "Nutrition",
                "Human Digestive System",
                "Respiration",
                "Circulation",
                "Excretion",
                "Reproduction",
                "Health",
                "Disease",
                "Matter",
                "Atomic Structure",
                "Energy",
                "Force",
                "Motion",
                "Heat",
                "Light",
                "Sound",
                "Electricity",
                "Magnetism",
                "Environment",
                "Pollution",
                "Soil",
                "Water",
                "Technology"
            ],

            "Basic Technology": [
                "Technical Drawing",
                "Drawing Instruments",
                "Materials",
                "Wood",
                "Metal",
                "Plastics",
                "Machines",
                "Levers",
                "Pulleys",
                "Gears",
                "Electrical Systems",
                "Electronics",
                "Building Technology",
                "Safety",
                "Maintenance"
            ],

            "Social Studies": [
                "Family",
                "Culture",
                "Socialization",
                "Citizenship",
                "Population",
                "Migration",
                "Environment",
                "Democracy",
                "Leadership",
                "National Unity",
                "Social Problems",
                "Conflict Resolution",
                "Community Development"
            ],

            "Civic Education": [
                "Citizenship",
                "Human Rights",
                "Responsibilities",
                "Democracy",
                "Rule of Law",
                "Constitution",
                "National Values",
                "Leadership",
                "Good Governance",
                "Elections",
                "Political Participation",
                "National Identity"
            ],

            "Computer Studies": [
                "Computer Fundamentals",
                "Hardware",
                "Software",
                "Input Devices",
                "Output Devices",
                "Storage",
                "Operating Systems",
                "Word Processing",
                "Spreadsheets",
                "Presentations",
                "Internet",
                "Networks",
                "Cyber Safety",
                "Algorithms",
                "Flowcharts",
                "Programming"
            ],

            "Business Studies": [
                "Introduction to Business",
                "Office Practice",
                "Trade",
                "Commerce",
                "Bookkeeping",
                "Banking",
                "Insurance",
                "Entrepreneurship",
                "Consumer Education",
                "Advertising"
            ],

            "Agricultural Science": [
                "Agriculture",
                "Farm Tools",
                "Soil",
                "Soil Fertility",
                "Soil Conservation",
                "Crops",
                "Crop Production",
                "Livestock",
                "Animal Production",
                "Farm Management",
                "Agricultural Economics"
            ],

            "Home Economics": [
                "Food and Nutrition",
                "Food Groups",
                "Balanced Diet",
                "Meal Planning",
                "Food Preparation",
                "Food Preservation",
                "Clothing",
                "Textiles",
                "Sewing",
                "Family Living",
                "Child Development",
                "Home Management"
            ]

        }

    },


 /* =====================================================
   NIGERIAN SENIOR SECONDARY CURRICULUM
   NORMALIZED SUBJECT STRUCTURE
   ===================================================== */

"Nigerian Senior Secondary Curriculum": {

    level: "SSS",

    subjects: {

        /* =================================================
           CORE SUBJECTS
        ================================================= */

        "English Language": [
            "Grammar",
            "Parts of Speech",
            "Sentence Structure",
            "Tenses",
            "Concord",
            "Punctuation",
            "Vocabulary",
            "Lexis and Structure",
            "Comprehension",
            "Summary",
            "Essay Writing",
            "Narrative Essay",
            "Descriptive Essay",
            "Argumentative Essay",
            "Expository Essay",
            "Formal Letters",
            "Informal Letters",
            "Reports",
            "Articles",
            "Speech Writing",
            "Oral English",
            "Vowels",
            "Consonants",
            "Stress",
            "Intonation",
            "Rhymes",
            "Literature"
        ],

        "General Mathematics": [
            "Number and Numeration",
            "Number Bases",
            "Fractions",
            "Decimals",
            "Percentages",
            "Ratio and Proportion",
            "Indices",
            "Logarithms",
            "Surds",
            "Algebraic Expressions",
            "Linear Equations",
            "Quadratic Equations",
            "Simultaneous Equations",
            "Inequalities",
            "Sequences",
            "Series",
            "Functions",
            "Coordinate Geometry",
            "Trigonometry",
            "Mensuration",
            "Geometry",
            "Vectors",
            "Matrices",
            "Differentiation",
            "Integration",
            "Calculus",
            "Statistics",
            "Probability",
            "Permutations",
            "Combinations",
            "Graphs",
            "Financial Mathematics"
        ],

        "Citizenship and Heritage Studies": [
            "Citizenship",
            "Rights and Responsibilities",
            "Human Rights",
            "National Values",
            "Democracy",
            "Rule of Law",
            "Constitution",
            "Political Participation",
            "Elections",
            "Leadership",
            "Good Governance",
            "Public Service",
            "Corruption",
            "National Integration",
            "Nigerian Heritage",
            "Nigerian Culture",
            "Cultural Diversity",
            "National Identity",
            "Community Development",
            "Peace and Conflict Resolution",
            "Responsible Citizenship",
            "National Symbols"
        ],

        "Digital Technologies": [
            "Computer Fundamentals",
            "Data Representation",
            "Number Systems",
            "Boolean Algebra",
            "Logic Gates",
            "Computer Architecture",
            "CPU",
            "Memory",
            "Storage Devices",
            "Operating Systems",
            "Algorithms",
            "Flowcharts",
            "Pseudocode",
            "Programming Fundamentals",
            "Variables",
            "Data Types",
            "Operators",
            "Conditional Statements",
            "Loops",
            "Functions",
            "Arrays",
            "Object-Oriented Programming",
            "Databases",
            "SQL",
            "Computer Networks",
            "Internet",
            "Cybersecurity",
            "Web Development",
            "Artificial Intelligence",
            "Software Development",
            "Digital Citizenship",
            "Digital Communication",
            "Information Management"
        ],

        /* =================================================
           SCIENCES
        ================================================= */

        "Biology": [
            "Characteristics of Living Things",
            "Cell Structure",
            "Cell Functions",
            "Biological Molecules",
            "Nutrition",
            "Photosynthesis",
            "Respiration",
            "Transport",
            "Blood",
            "Circulatory System",
            "Excretion",
            "Homeostasis",
            "Support and Movement",
            "Coordination",
            "Nervous System",
            "Endocrine System",
            "Reproduction",
            "Growth",
            "Genetics",
            "Inheritance",
            "Variation",
            "Evolution",
            "Classification",
            "Microorganisms",
            "Ecology",
            "Food Chains",
            "Food Webs",
            "Population",
            "Conservation",
            "Pollution",
            "Adaptation"
        ],

        "Chemistry": [
            "Matter",
            "Atomic Structure",
            "Electronic Configuration",
            "Periodic Table",
            "Periodic Trends",
            "Chemical Bonding",
            "Mole Concept",
            "Stoichiometry",
            "Gas Laws",
            "Solutions",
            "Solubility",
            "Acids",
            "Bases",
            "Salts",
            "pH",
            "Redox Reactions",
            "Electrochemistry",
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
            "Metals",
            "Non-Metals",
            "Environmental Chemistry"
        ],

        "Physics": [
            "Measurement",
            "Units",
            "Scalars and Vectors",
            "Motion",
            "Speed and Velocity",
            "Acceleration",
            "Projectiles",
            "Forces",
            "Newton's Laws",
            "Friction",
            "Moments",
            "Equilibrium",
            "Work",
            "Energy",
            "Power",
            "Momentum",
            "Simple Machines",
            "Elasticity",
            "Pressure",
            "Heat",
            "Temperature",
            "Thermal Expansion",
            "Gas Laws",
            "Waves",
            "Sound",
            "Light",
            "Reflection",
            "Refraction",
            "Lenses",
            "Electricity",
            "Current Electricity",
            "Electrostatics",
            "Magnetism",
            "Electromagnetism",
            "Electromagnetic Induction",
            "Atomic Physics",
            "Nuclear Physics",
            "Semiconductors",
            "Electronics"
        ],

        /* =================================================
           MATHEMATICAL / SCIENCE ELECTIVES
        ================================================= */

        "Further Mathematics": [
            "Sets",
            "Logic",
            "Functions",
            "Matrices",
            "Determinants",
            "Vectors",
            "Complex Numbers",
            "Polynomial Functions",
            "Sequences",
            "Series",
            "Binomial Expansion",
            "Coordinate Geometry",
            "Trigonometry",
            "Differentiation",
            "Integration",
            "Differential Equations",
            "Statistics",
            "Probability",
            "Permutations",
            "Combinations",
            "Mechanics",
            "Kinematics",
            "Dynamics",
            "Linear Programming",
            "Numerical Methods"
        ],

        /* =================================================
           SOCIAL SCIENCES
        ================================================= */

        "Economics": [
            "Basic Economic Concepts",
            "Scarcity",
            "Choice",
            "Opportunity Cost",
            "Production",
            "Factors of Production",
            "Division of Labour",
            "Scale of Production",
            "Demand",
            "Supply",
            "Price Determination",
            "Elasticity",
            "Market Structures",
            "Perfect Competition",
            "Monopoly",
            "Public Finance",
            "Taxation",
            "Money",
            "Banking",
            "Inflation",
            "Unemployment",
            "National Income",
            "Economic Growth",
            "Economic Development",
            "International Trade",
            "Balance of Payments",
            "Exchange Rates",
            "Population",
            "Agriculture",
            "Industrialization",
            "Economic Planning"
        ],

        "Government": [
            "Meaning of Government",
            "Political Institutions",
            "Constitution",
            "Rule of Law",
            "Separation of Powers",
            "Checks and Balances",
            "Democracy",
            "Political Parties",
            "Pressure Groups",
            "Elections",
            "Electoral Systems",
            "Public Opinion",
            "Citizenship",
            "Human Rights",
            "Local Government",
            "Federalism",
            "Unitary Government",
            "Confederation",
            "Legislature",
            "Executive",
            "Judiciary",
            "Civil Service",
            "Foreign Policy",
            "International Organizations",
            "United Nations",
            "African Union",
            "ECOWAS",
            "Political Development",
            "Military Rule",
            "Constitutional Development in Nigeria"
        ],

        "Geography": [
            "Map Reading",
            "Scale",
            "Direction",
            "Grid References",
            "Relief",
            "Weather",
            "Climate",
            "Atmosphere",
            "Temperature",
            "Rainfall",
            "Winds",
            "Rocks",
            "Plate Tectonics",
            "Earthquakes",
            "Volcanoes",
            "Weathering",
            "Erosion",
            "Transportation",
            "Rivers",
            "Drainage",
            "Soils",
            "Vegetation",
            "Population",
            "Settlement",
            "Urbanization",
            "Agriculture",
            "Industry",
            "Trade",
            "Environmental Problems",
            "Natural Resources",
            "Regional Geography of Nigeria",
            "West Africa",
            "Africa"
        ],

        /* =================================================
           AGRICULTURE
        ================================================= */

        "Agriculture": [
            "Agriculture",
            "Farm Management",
            "Farm Tools",
            "Farm Machinery",
            "Soil Science",
            "Soil Formation",
            "Soil Properties",
            "Soil Fertility",
            "Soil Conservation",
            "Crop Production",
            "Crop Improvement",
            "Crop Pests",
            "Crop Diseases",
            "Weeds",
            "Forestry",
            "Livestock Production",
            "Animal Nutrition",
            "Animal Reproduction",
            "Animal Health",
            "Fisheries",
            "Wildlife",
            "Agricultural Economics",
            "Agricultural Marketing",
            "Agricultural Cooperatives"
        ],

        /* =================================================
           BUSINESS
        ================================================= */

        "Accounting": [
            "Introduction to Accounting",
            "Accounting Concepts",
            "Source Documents",
            "Double Entry",
            "Ledger",
            "Cash Book",
            "Petty Cash Book",
            "Trial Balance",
            "Bank Reconciliation",
            "Final Accounts",
            "Trading Account",
            "Profit and Loss Account",
            "Balance Sheet",
            "Depreciation",
            "Control Accounts",
            "Partnership Accounts",
            "Company Accounts",
            "Manufacturing Accounts",
            "Incomplete Records",
            "Public Sector Accounting"
        ],

        "Commerce": [
            "Meaning of Commerce",
            "Trade",
            "Home Trade",
            "Foreign Trade",
            "Retail Trade",
            "Wholesale Trade",
            "Banking",
            "Insurance",
            "Transportation",
            "Warehousing",
            "Communication",
            "Advertising",
            "Business Finance",
            "Entrepreneurship",
            "Trade Associations",
            "Chambers of Commerce",
            "Consumer Protection",
            "E-Commerce"
        ],

        "Marketing": [
            "Meaning of Marketing",
            "Marketing Concepts",
            "Market Research",
            "Consumer Behaviour",
            "Market Segmentation",
            "Target Market",
            "Product",
            "Product Development",
            "Branding",
            "Packaging",
            "Pricing",
            "Promotion",
            "Advertising",
            "Sales Promotion",
            "Personal Selling",
            "Distribution",
            "Channels of Distribution",
            "Digital Marketing",
            "Marketing Strategy"
        ],

        /* =================================================
           HUMANITIES
        ================================================= */

        "Nigerian History": [
            "Sources of Nigerian History",
            "Pre-Colonial Nigerian Societies",
            "Hausa States",
            "Kanem-Bornu",
            "Yoruba States",
            "Benin Kingdom",
            "Igbo Society",
            "Niger Delta States",
            "Trans-Saharan Trade",
            "Slave Trade",
            "European Contact",
            "Christian Missionaries",
            "British Colonialism",
            "Amalgamation of 1914",
            "Colonial Administration",
            "Nationalist Movements",
            "Independence",
            "First Republic",
            "Military Rule",
            "Civil War",
            "Second Republic",
            "Return to Military Rule",
            "Fourth Republic",
            "Nigerian Political Development"
        ],

        "Christian Religious Studies": [
            "Creation",
            "Patriarchs",
            "Moses",
            "Exodus",
            "Covenant",
            "Judges",
            "Kings",
            "Prophets",
            "Wisdom Literature",
            "Birth of Jesus",
            "Baptism",
            "Temptation",
            "Teachings of Jesus",
            "Miracles",
            "Parables",
            "Death of Jesus",
            "Resurrection",
            "Early Church",
            "Paul",
            "Christian Ethics"
        ],

        "Islamic Studies": [
            "Quran",
            "Hadith",
            "Tawhid",
            "Shahadah",
            "Salah",
            "Zakat",
            "Sawm",
            "Hajj",
            "Prophet Muhammad",
            "Hijrah",
            "Madinah",
            "Islamic Law",
            "Islamic Ethics",
            "Family Life",
            "Islamic History",
            "Islamic Civilization"
        ],

        "Literature in English": [
            "Literary Genres",
            "Poetry",
            "Prose",
            "Drama",
            "Figures of Speech",
            "Characterization",
            "Plot",
            "Setting",
            "Theme",
            "Narrative Technique",
            "Point of View",
            "Conflict",
            "Irony",
            "Symbolism",
            "Tone",
            "Mood",
            "African Literature",
            "Nigerian Literature",
            "World Literature",
            "Literary Criticism"
        ],

        /* =================================================
           LANGUAGES
        ================================================= */

        "Hausa": [
            "Hausa Grammar",
            "Hausa Vocabulary",
            "Reading Comprehension",
            "Composition",
            "Translation",
            "Oral Literature",
            "Written Literature",
            "Hausa Proverbs",
            "Hausa Culture",
            "Hausa History"
        ],

        "Igbo": [
            "Igbo Grammar",
            "Igbo Vocabulary",
            "Reading Comprehension",
            "Composition",
            "Translation",
            "Oral Literature",
            "Written Literature",
            "Igbo Proverbs",
            "Igbo Culture",
            "Igbo History"
        ],

        "Yoruba": [
            "Yoruba Grammar",
            "Yoruba Vocabulary",
            "Reading Comprehension",
            "Composition",
            "Translation",
            "Oral Literature",
            "Written Literature",
            "Yoruba Proverbs",
            "Yoruba Culture",
            "Yoruba History"
        ],

        "French": [
            "French Grammar",
            "French Vocabulary",
            "Reading Comprehension",
            "Writing",
            "Listening",
            "Speaking",
            "Translation",
            "French Culture",
            "French Literature"
        ],

        "Arabic": [
            "Arabic Alphabet",
            "Arabic Grammar",
            "Arabic Vocabulary",
            "Reading",
            "Writing",
            "Comprehension",
            "Translation",
            "Arabic Literature",
            "Arabic Culture"
        ],

        /* =================================================
           CREATIVE / PRACTICAL SUBJECTS
        ================================================= */

        "Visual Arts": [
            "Elements of Art",
            "Principles of Design",
            "Drawing",
            "Painting",
            "Sculpture",
            "Printmaking",
            "Textiles",
            "Ceramics",
            "Graphic Design",
            "Art History",
            "Nigerian Art",
            "African Art",
            "Contemporary Art"
        ],

        "Music": [
            "Elements of Music",
            "Musical Notation",
            "Rhythm",
            "Melody",
            "Harmony",
            "Scales",
            "Intervals",
            "Chords",
            "Musical Instruments",
            "African Music",
            "Nigerian Music",
            "Music Performance",
            "Music Composition",
            "Music History"
        ],

        "Physical Education": [
            "Physical Fitness",
            "Athletics",
            "Football",
            "Basketball",
            "Volleyball",
            "Handball",
            "Table Tennis",
            "Badminton",
            "Gymnastics",
            "Swimming",
            "Track Events",
            "Field Events",
            "Sportsmanship",
            "First Aid",
            "Health and Fitness"
        ],

        "Health Education": [
            "Personal Health",
            "Community Health",
            "Nutrition",
            "Balanced Diet",
            "Personal Hygiene",
            "Environmental Health",
            "Disease Prevention",
            "Communicable Diseases",
            "Non-Communicable Diseases",
            "Mental Wellbeing",
            "First Aid",
            "Safety Education",
            "Drug Education",
            "Family Health"
        ],

        "Foods & Nutrition": [
            "Food and Nutrition",
            "Nutrients",
            "Balanced Diet",
            "Meal Planning",
            "Food Preparation",
            "Food Preservation",
            "Food Safety",
            "Kitchen Equipment",
            "Cooking Methods",
            "Special Diets",
            "Consumer Education",
            "Food Storage",
            "Nutrition and Health"
        ],

        "Technical Drawing": [
            "Drawing Instruments",
            "Geometrical Construction",
            "Lettering",
            "Dimensioning",
            "Orthographic Projection",
            "Isometric Drawing",
            "Oblique Drawing",
            "Sectional Views",
            "Scale Drawing",
            "Perspective Drawing",
            "Mechanical Drawing",
            "Building Drawing",
            "Electrical Drawing"
        ],

        "Home Management": [
            "Home Management",
            "Family Resources",
            "Time Management",
            "Money Management",
            "Household Budgeting",
            "Food Management",
            "Clothing Management",
            "Interior Decoration",
            "Household Equipment",
            "Consumer Education",
            "Family Relationships",
            "Child Development"
        ],

        "Catering Craft": [
            "Introduction to Catering",
            "Kitchen Safety",
            "Kitchen Equipment",
            "Food Preparation",
            "Cooking Methods",
            "Menu Planning",
            "Table Setting",
            "Food Service",
            "Beverage Service",
            "Baking",
            "Pastry",
            "Food Preservation",
            "Hygiene and Sanitation",
            "Hospitality Management"
        ],

        /* =================================================
           TRADE / VOCATIONAL OPTIONS
        ================================================= */

        "Solar Photovoltaic Installation and Maintenance": [
            "Introduction to Solar Energy",
            "Solar Radiation",
            "Solar PV Systems",
            "Solar Panels",
            "PV Cells",
            "Batteries",
            "Charge Controllers",
            "Inverters",
            "Solar Wiring",
            "Electrical Safety",
            "System Sizing",
            "Solar Installation",
            "System Maintenance",
            "Fault Diagnosis"
        ],

        "Fashion Design and Garment Making": [
            "Introduction to Fashion",
            "Textiles",
            "Fabric Types",
            "Fashion Illustration",
            "Body Measurements",
            "Pattern Drafting",
            "Cutting",
            "Sewing",
            "Garment Construction",
            "Finishing Techniques",
            "Embroidery",
            "Fashion Accessories",
            "Clothing Care",
            "Fashion Entrepreneurship"
        ],

        "Livestock Farming": [
            "Introduction to Livestock",
            "Animal Breeds",
            "Animal Anatomy",
            "Animal Nutrition",
            "Animal Feeds",
            "Poultry Production",
            "Cattle Production",
            "Sheep Production",
            "Goat Production",
            "Pig Production",
            "Rabbit Production",
            "Animal Reproduction",
            "Animal Diseases",
            "Animal Health",
            "Livestock Marketing"
        ],

        "Beauty and Cosmetology": [
            "Introduction to Cosmetology",
            "Hair Care",
            "Hair Styling",
            "Hair Treatment",
            "Skin Care",
            "Facials",
            "Nail Care",
            "Manicure",
            "Pedicure",
            "Makeup",
            "Beauty Products",
            "Salon Hygiene",
            "Customer Service",
            "Beauty Entrepreneurship"
        ],

        "Computer Hardware and GSM Repairs": [
            "Computer Hardware",
            "Computer Components",
            "Motherboards",
            "Processors",
            "Memory",
            "Storage Devices",
            "Power Supplies",
            "Input Devices",
            "Output Devices",
            "Computer Assembly",
            "Computer Maintenance",
            "Troubleshooting",
            "Mobile Phone Components",
            "GSM Technology",
            "Mobile Phone Repairs",
            "Soldering",
            "Electronic Safety"
        ],

        "Horticulture and Crop Production": [
            "Introduction to Horticulture",
            "Horticultural Crops",
            "Nursery Management",
            "Seed Selection",
            "Seed Propagation",
            "Vegetable Production",
            "Fruit Production",
            "Ornamental Plants",
            "Plant Nutrition",
            "Irrigation",
            "Pest Management",
            "Disease Management",
            "Harvesting",
            "Post-Harvest Handling",
            "Horticultural Marketing"
        ]

    }

},

 /* =====================================================
   WAEC
   WEST AFRICAN EXAMINATIONS COUNCIL
   EXAMINATION CURRICULUM
   ===================================================== */

"WAEC": {

    level: "Senior Secondary",
    type: "Examination",

    subjects: {

        /* =================================================
           LANGUAGES / CORE
        ================================================= */

        "English Language": [
            "Comprehension",
            "Summary",
            "Lexis and Structure",
            "Grammar",
            "Parts of Speech",
            "Sentence Structure",
            "Tenses",
            "Concord",
            "Vocabulary",
            "Idioms",
            "Synonyms",
            "Antonyms",
            "Essay Writing",
            "Narrative Essay",
            "Descriptive Essay",
            "Argumentative Essay",
            "Expository Essay",
            "Formal Letter",
            "Informal Letter",
            "Report Writing",
            "Article Writing",
            "Speech Writing",
            "Oral English",
            "Vowels",
            "Consonants",
            "Stress",
            "Intonation",
            "Rhyming",
            "Literature"
        ],

        "General Mathematics": [
            "Number Bases",
            "Fractions",
            "Decimals",
            "Percentages",
            "Ratio",
            "Proportion",
            "Indices",
            "Logarithms",
            "Surds",
            "Sets",
            "Algebra",
            "Linear Equations",
            "Simultaneous Equations",
            "Quadratic Equations",
            "Sequences",
            "Series",
            "Functions",
            "Matrices",
            "Vectors",
            "Coordinate Geometry",
            "Trigonometry",
            "Mensuration",
            "Geometry",
            "Statistics",
            "Probability",
            "Permutations",
            "Combinations",
            "Graphs",
            "Financial Mathematics",
            "Calculus"
        ],

        /* =================================================
           SCIENCES
        ================================================= */

        "Physics": [
            "Measurement",
            "Units",
            "Scalars and Vectors",
            "Motion",
            "Speed and Velocity",
            "Acceleration",
            "Forces",
            "Newton's Laws",
            "Friction",
            "Moments",
            "Equilibrium",
            "Work",
            "Energy",
            "Power",
            "Momentum",
            "Machines",
            "Pressure",
            "Heat",
            "Temperature",
            "Thermal Expansion",
            "Gas Laws",
            "Waves",
            "Sound",
            "Light",
            "Reflection",
            "Refraction",
            "Lenses",
            "Electricity",
            "Current Electricity",
            "Electrostatics",
            "Magnetism",
            "Electromagnetism",
            "Electromagnetic Induction",
            "Atomic Physics",
            "Nuclear Physics",
            "Electronics"
        ],

        "Chemistry": [
            "Matter",
            "Atomic Structure",
            "Electronic Configuration",
            "Periodic Table",
            "Periodic Trends",
            "Chemical Bonding",
            "Mole Concept",
            "Stoichiometry",
            "Gas Laws",
            "Solutions",
            "Solubility",
            "Acids",
            "Bases",
            "Salts",
            "pH",
            "Redox Reactions",
            "Electrochemistry",
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
            "Metals",
            "Non-Metals",
            "Environmental Chemistry"
        ],

        "Biology": [
            "Cell Biology",
            "Cell Structure",
            "Cell Functions",
            "Biological Molecules",
            "Nutrition",
            "Photosynthesis",
            "Respiration",
            "Transport",
            "Blood",
            "Circulatory System",
            "Excretion",
            "Homeostasis",
            "Support and Movement",
            "Coordination",
            "Nervous System",
            "Endocrine System",
            "Reproduction",
            "Growth",
            "Genetics",
            "Inheritance",
            "Variation",
            "Evolution",
            "Classification",
            "Microorganisms",
            "Ecology",
            "Food Chains",
            "Food Webs",
            "Population",
            "Conservation",
            "Pollution",
            "Adaptation"
        ],

        "Further Mathematics": [
            "Sets",
            "Logic",
            "Functions",
            "Matrices",
            "Determinants",
            "Vectors",
            "Complex Numbers",
            "Polynomial Functions",
            "Sequences",
            "Series",
            "Binomial Theorem",
            "Coordinate Geometry",
            "Trigonometry",
            "Differentiation",
            "Integration",
            "Differential Equations",
            "Probability",
            "Statistics",
            "Permutations",
            "Combinations",
            "Mechanics",
            "Kinematics",
            "Dynamics",
            "Linear Programming",
            "Numerical Methods"
        ],

        /* =================================================
           SOCIAL SCIENCES
        ================================================= */

        "Economics": [
            "Basic Economic Concepts",
            "Scarcity",
            "Choice",
            "Opportunity Cost",
            "Production",
            "Factors of Production",
            "Division of Labour",
            "Scale of Production",
            "Demand",
            "Supply",
            "Price Determination",
            "Elasticity",
            "Market Structures",
            "Perfect Competition",
            "Monopoly",
            "Public Finance",
            "Taxation",
            "Money",
            "Banking",
            "Inflation",
            "Unemployment",
            "National Income",
            "Economic Growth",
            "Economic Development",
            "International Trade",
            "Balance of Payments",
            "Exchange Rates",
            "Population",
            "Agriculture",
            "Industrialization",
            "Economic Planning"
        ],

        "Government": [
            "Political Concepts",
            "Meaning of Government",
            "Political Institutions",
            "Constitution",
            "Rule of Law",
            "Separation of Powers",
            "Checks and Balances",
            "Democracy",
            "Political Parties",
            "Pressure Groups",
            "Elections",
            "Electoral Systems",
            "Citizenship",
            "Human Rights",
            "Federalism",
            "Local Government",
            "Legislature",
            "Executive",
            "Judiciary",
            "Civil Service",
            "Foreign Policy",
            "International Organizations",
            "United Nations",
            "African Union",
            "ECOWAS",
            "Political Development in Nigeria",
            "Military Rule",
            "Constitutional Development in Nigeria"
        ],

        "Geography": [
            "Map Reading",
            "Scale",
            "Direction",
            "Grid References",
            "Relief",
            "Weather",
            "Climate",
            "Atmosphere",
            "Temperature",
            "Rainfall",
            "Winds",
            "Rocks",
            "Plate Tectonics",
            "Earthquakes",
            "Volcanoes",
            "Weathering",
            "Erosion",
            "Transportation",
            "Rivers",
            "Drainage",
            "Soils",
            "Vegetation",
            "Population",
            "Settlement",
            "Urbanization",
            "Agriculture",
            "Industry",
            "Trade",
            "Environmental Problems",
            "Natural Resources",
            "Regional Geography of Nigeria",
            "West Africa",
            "Africa"
        ],

        /* =================================================
           AGRICULTURE
        ================================================= */

        "Agriculture": [
            "Agriculture",
            "Farm Management",
            "Farm Tools",
            "Farm Machinery",
            "Soil Science",
            "Soil Formation",
            "Soil Properties",
            "Soil Fertility",
            "Soil Conservation",
            "Crop Production",
            "Crop Improvement",
            "Crop Pests",
            "Crop Diseases",
            "Weeds",
            "Forestry",
            "Livestock Production",
            "Animal Nutrition",
            "Animal Reproduction",
            "Animal Health",
            "Fisheries",
            "Wildlife",
            "Agricultural Economics",
            "Agricultural Marketing",
            "Agricultural Cooperatives"
        ],

        /* =================================================
           BUSINESS
        ================================================= */

        "Accounting": [
            "Introduction to Accounting",
            "Accounting Concepts",
            "Accounting Principles",
            "Source Documents",
            "Double Entry",
            "Ledger",
            "Cash Book",
            "Petty Cash Book",
            "Trial Balance",
            "Bank Reconciliation",
            "Final Accounts",
            "Trading Account",
            "Profit and Loss Account",
            "Balance Sheet",
            "Depreciation",
            "Control Accounts",
            "Partnership Accounts",
            "Company Accounts",
            "Manufacturing Accounts",
            "Incomplete Records",
            "Public Sector Accounting"
        ],

        "Commerce": [
            "Meaning of Commerce",
            "Trade",
            "Home Trade",
            "Foreign Trade",
            "Retail Trade",
            "Wholesale Trade",
            "Banking",
            "Insurance",
            "Transportation",
            "Warehousing",
            "Communication",
            "Advertising",
            "Business Finance",
            "Entrepreneurship",
            "Trade Associations",
            "Chambers of Commerce",
            "Consumer Protection",
            "E-Commerce"
        ],

        /* =================================================
           DIGITAL / COMPUTER
        ================================================= */

        "Digital Technologies": [
            "Computer Fundamentals",
            "Computer Hardware",
            "Computer Software",
            "Data Representation",
            "Number Systems",
            "Operating Systems",
            "Word Processing",
            "Spreadsheets",
            "Databases",
            "Computer Networks",
            "Internet",
            "Algorithms",
            "Flowcharts",
            "Pseudocode",
            "Programming",
            "Programming Fundamentals",
            "Cybersecurity",
            "Digital Citizenship",
            "Information Management"
        ],

        /* =================================================
           CIVIC / HUMANITIES
        ================================================= */

        "Citizenship and Heritage Studies": [
            "Citizenship",
            "Human Rights",
            "Responsibilities",
            "Democracy",
            "Rule of Law",
            "Constitution",
            "Political Participation",
            "Elections",
            "National Values",
            "Leadership",
            "Good Governance",
            "Corruption",
            "Public Service",
            "National Integration",
            "Nigerian Heritage",
            "Cultural Diversity",
            "National Identity"
        ],

        "Nigerian History": [
            "Sources of Nigerian History",
            "Pre-Colonial Nigerian Societies",
            "Hausa States",
            "Kanem-Bornu",
            "Yoruba States",
            "Benin Kingdom",
            "Igbo Society",
            "Niger Delta States",
            "Trans-Saharan Trade",
            "Slave Trade",
            "European Contact",
            "Christian Missionaries",
            "British Colonialism",
            "Amalgamation of 1914",
            "Colonial Administration",
            "Nationalist Movements",
            "Independence",
            "First Republic",
            "Military Rule",
            "Nigerian Civil War",
            "Second Republic",
            "Fourth Republic",
            "Nigerian Political Development"
        ],

        /* =================================================
           LITERATURE
        ================================================= */

        "Literature in English": [
            "Poetry",
            "Prose",
            "Drama",
            "Literary Genres",
            "Literary Devices",
            "Figures of Speech",
            "Characterization",
            "Plot",
            "Setting",
            "Theme",
            "Conflict",
            "Narrative Technique",
            "Point of View",
            "Irony",
            "Symbolism",
            "Tone",
            "Mood",
            "African Literature",
            "Nigerian Literature",
            "World Literature"
        ],

        /* =================================================
           RELIGIOUS STUDIES
        ================================================= */

        "Christian Religious Studies": [
            "Creation",
            "Patriarchs",
            "Abraham",
            "Isaac",
            "Jacob",
            "Joseph",
            "Moses",
            "Exodus",
            "Covenant",
            "Judges",
            "Kings",
            "Prophets",
            "Wisdom Literature",
            "Birth of Jesus",
            "Baptism of Jesus",
            "Temptation of Jesus",
            "Ministry of Jesus",
            "Teachings of Jesus",
            "Parables",
            "Miracles",
            "Death of Jesus",
            "Resurrection",
            "Early Church",
            "Paul",
            "Christian Ethics"
        ],

        "Islamic Studies": [
            "Quran",
            "Hadith",
            "Tawhid",
            "Pillars of Islam",
            "Shahadah",
            "Salah",
            "Zakat",
            "Sawm",
            "Hajj",
            "Prophet Muhammad",
            "Hijrah",
            "Madinah",
            "Islamic Law",
            "Islamic Ethics",
            "Family Life",
            "Islamic History",
            "Islamic Civilization"
        ]

    }

},
    /* =====================================================
       NECO
    ===================================================== */

    "NECO": {

        subjects: {

            "English Language": [
                "Comprehension",
                "Summary",
                "Lexis and Structure",
                "Grammar",
                "Vocabulary",
                "Concord",
                "Essay Writing",
                "Narrative Writing",
                "Descriptive Writing",
                "Argumentative Writing",
                "Formal Letters",
                "Informal Letters",
                "Reports",
                "Articles",
                "Speech Writing",
                "Oral English",
                "Vowels",
                "Consonants",
                "Stress",
                "Intonation"
            ],

            "Mathematics": [
                "Number Bases",
                "Fractions",
                "Percentages",
                "Ratio",
                "Proportion",
                "Indices",
                "Logarithms",
                "Surds",
                "Sets",
                "Algebra",
                "Linear Equations",
                "Simultaneous Equations",
                "Quadratic Equations",
                "Sequences",
                "Series",
                "Functions",
                "Matrices",
                "Vectors",
                "Coordinate Geometry",
                "Trigonometry",
                "Geometry",
                "Mensuration",
                "Statistics",
                "Probability",
                "Graphs",
                "Calculus"
            ],

            "Physics": [
                "Measurement",
                "Vectors",
                "Motion",
                "Forces",
                "Work",
                "Energy",
                "Power",
                "Momentum",
                "Heat",
                "Waves",
                "Sound",
                "Light",
                "Electricity",
                "Magnetism",
                "Electromagnetism",
                "Atomic Physics",
                "Nuclear Physics",
                "Electronics"
            ],

            "Chemistry": [
                "Atomic Structure",
                "Periodic Table",
                "Chemical Bonding",
                "Mole Concept",
                "Stoichiometry",
                "Gas Laws",
                "Acids Bases and Salts",
                "Redox",
                "Electrochemistry",
                "Rates of Reaction",
                "Equilibrium",
                "Organic Chemistry",
                "Hydrocarbons",
                "Alcohols",
                "Carboxylic Acids",
                "Polymers",
                "Metals",
                "Environmental Chemistry"
            ],

            "Biology": [
                "Cell Biology",
                "Nutrition",
                "Photosynthesis",
                "Respiration",
                "Transport",
                "Excretion",
                "Coordination",
                "Reproduction",
                "Genetics",
                "Inheritance",
                "Evolution",
                "Classification",
                "Microorganisms",
                "Ecology",
                "Food Chains",
                "Population",
                "Conservation"
            ],

            "Further Mathematics": [
                "Sets",
                "Functions",
                "Matrices",
                "Vectors",
                "Complex Numbers",
                "Sequences",
                "Series",
                "Binomial Expansion",
                "Trigonometry",
                "Differentiation",
                "Integration",
                "Differential Equations",
                "Probability",
                "Statistics",
                "Mechanics",
                "Kinematics",
                "Dynamics",
                "Linear Programming"
            ],

            "Economics": [
                "Scarcity",
                "Opportunity Cost",
                "Production",
                "Demand",
                "Supply",
                "Elasticity",
                "Price Determination",
                "Market Structures",
                "Money",
                "Banking",
                "Inflation",
                "Unemployment",
                "National Income",
                "Economic Growth",
                "Economic Development",
                "Public Finance",
                "International Trade",
                "Balance of Payments",
                "Exchange Rates"
            ],

            "Government": [
                "Government",
                "Constitution",
                "Rule of Law",
                "Democracy",
                "Political Parties",
                "Pressure Groups",
                "Elections",
                "Citizenship",
                "Human Rights",
                "Federalism",
                "Local Government",
                "Legislature",
                "Executive",
                "Judiciary",
                "Civil Service",
                "Foreign Policy",
                "International Organizations",
                "Political Development"
            ],

            "Geography": [
                "Map Reading",
                "Scale",
                "Relief",
                "Weather",
                "Climate",
                "Rocks",
                "Plate Tectonics",
                "Weathering",
                "Erosion",
                "Rivers",
                "Drainage",
                "Soils",
                "Vegetation",
                "Population",
                "Settlement",
                "Urbanization",
                "Agriculture",
                "Industry",
                "Transportation",
                "Trade",
                "Environmental Problems",
                "Regional Geography"
            ],

            "Agricultural Science": [
                "Agriculture",
                "Farm Tools",
                "Farm Management",
                "Soil",
                "Soil Fertility",
                "Soil Conservation",
                "Crop Production",
                "Crop Improvement",
                "Crop Pests",
                "Crop Diseases",
                "Livestock",
                "Animal Nutrition",
                "Animal Reproduction",
                "Animal Health",
                "Fisheries",
                "Forestry",
                "Agricultural Economics"
            ],

            "Accounting": [
                "Accounting Concepts",
                "Double Entry",
                "Ledger",
                "Cash Book",
                "Trial Balance",
                "Bank Reconciliation",
                "Final Accounts",
                "Depreciation",
                "Control Accounts",
                "Partnership",
                "Company Accounts",
                "Manufacturing Accounts",
                "Incomplete Records",
                "Public Sector Accounting"
            ],

            "Literature in English": [
                "Poetry",
                "Prose",
                "Drama",
                "Figures of Speech",
                "Characterization",
                "Plot",
                "Setting",
                "Theme",
                "Conflict",
                "Irony",
                "Symbolism",
                "African Literature",
                "Nigerian Literature",
                "World Literature"
            ],

            "Computer Studies": [
                "Computer Fundamentals",
                "Hardware",
                "Software",
                "Data Representation",
                "Operating Systems",
                "Word Processing",
                "Spreadsheets",
                "Databases",
                "Networks",
                "Internet",
                "Algorithms",
                "Flowcharts",
                "Programming",
                "Cybersecurity"
            ],

            "Civic Education": [
                "Citizenship",
                "Human Rights",
                "Democracy",
                "Rule of Law",
                "Constitution",
                "Elections",
                "National Values",
                "Leadership",
                "Good Governance",
                "Corruption",
                "National Integration"
            ],

            "Christian Religious Studies": [
                "Creation",
                "Patriarchs",
                "Moses",
                "Kings",
                "Prophets",
                "Birth of Jesus",
                "Ministry of Jesus",
                "Parables",
                "Miracles",
                "Death and Resurrection",
                "Early Church",
                "Paul",
                "Christian Ethics"
            ],

            "Islamic Religious Studies": [
                "Quran",
                "Hadith",
                "Tawhid",
                "Pillars of Islam",
                "Prophet Muhammad",
                "Hijrah",
                "Salah",
                "Zakat",
                "Sawm",
                "Hajj",
                "Islamic Law",
                "Islamic Ethics",
                "Islamic History"
            ]

        }

    },


    /* =====================================================
       JAMB / UTME
    ===================================================== */

    "JAMB": {

        subjects: {

            "Use of English": [
                "Reading Comprehension",
                "Literal Comprehension",
                "Inferential Comprehension",
                "Vocabulary",
                "Synonyms",
                "Antonyms",
                "Idioms",
                "Sentence Completion",
                "Grammar",
                "Parts of Speech",
                "Concord",
                "Tenses",
                "Sentence Structure",
                "Lexis and Structure",
                "Word Classes",
                "Punctuation",
                "Oral English",
                "Stress",
                "Rhythm",
                "Intonation",
                "Register",
                "Summary",
                "Literary Appreciation"
            ],

            "Mathematics": [
                "Number Bases",
                "Fractions",
                "Decimals",
                "Percentages",
                "Ratio",
                "Proportion",
                "Indices",
                "Logarithms",
                "Surds",
                "Sets",
                "Algebra",
                "Linear Equations",
                "Simultaneous Equations",
                "Quadratic Equations",
                "Inequalities",
                "Sequences",
                "Series",
                "Functions",
                "Matrices",
                "Vectors",
                "Coordinate Geometry",
                "Trigonometry",
                "Geometry",
                "Mensuration",
                "Statistics",
                "Probability",
                "Permutations",
                "Combinations",
                "Graphs",
                "Financial Mathematics"
            ],

            "Physics": [
                "Measurement",
                "Scalars and Vectors",
                "Motion",
                "Forces",
                "Newton's Laws",
                "Work",
                "Energy",
                "Power",
                "Momentum",
                "Machines",
                "Pressure",
                "Heat",
                "Temperature",
                "Waves",
                "Sound",
                "Light",
                "Reflection",
                "Refraction",
                "Electricity",
                "Current Electricity",
                "Electrostatics",
                "Magnetism",
                "Electromagnetism",
                "Atomic Physics",
                "Nuclear Physics",
                "Electronics"
            ],

            "Chemistry": [
                "Atomic Structure",
                "Periodic Table",
                "Chemical Bonding",
                "Mole Concept",
                "Stoichiometry",
                "Gas Laws",
                "Acids",
                "Bases",
                "Salts",
                "Redox Reactions",
                "Electrochemistry",
                "Rates of Reaction",
                "Chemical Equilibrium",
                "Energy Changes",
                "Organic Chemistry",
                "Hydrocarbons",
                "Alcohols",
                "Carboxylic Acids",
                "Polymers",
                "Metals",
                "Non-Metals",
                "Environmental Chemistry"
            ],

            "Biology": [
                "Cell Structure",
                "Biological Molecules",
                "Nutrition",
                "Photosynthesis",
                "Respiration",
                "Transport",
                "Excretion",
                "Homeostasis",
                "Coordination",
                "Reproduction",
                "Genetics",
                "Inheritance",
                "Variation",
                "Evolution",
                "Classification",
                "Microorganisms",
                "Ecology",
                "Food Chains",
                "Population",
                "Conservation"
            ],

            "Agricultural Science": [
                "Agriculture",
                "Farm Management",
                "Farm Tools",
                "Soil Science",
                "Soil Fertility",
                "Soil Conservation",
                "Crop Production",
                "Crop Improvement",
                "Crop Pests",
                "Crop Diseases",
                "Weeds",
                "Livestock Production",
                "Animal Nutrition",
                "Animal Reproduction",
                "Animal Health",
                "Fisheries",
                "Forestry",
                "Agricultural Economics",
                "Agricultural Marketing"
            ],

            "Economics": [
                "Basic Economic Concepts",
                "Scarcity",
                "Choice",
                "Opportunity Cost",
                "Production",
                "Factors of Production",
                "Demand",
                "Supply",
                "Elasticity",
                "Price Determination",
                "Market Structures",
                "Money",
                "Banking",
                "Inflation",
                "Unemployment",
                "National Income",
                "Economic Growth",
                "Economic Development",
                "Public Finance",
                "International Trade",
                "Balance of Payments",
                "Exchange Rates"
            ],

            "Government": [
                "Political Concepts",
                "Constitution",
                "Rule of Law",
                "Democracy",
                "Political Parties",
                "Pressure Groups",
                "Elections",
                "Citizenship",
                "Human Rights",
                "Federalism",
                "Local Government",
                "Legislature",
                "Executive",
                "Judiciary",
                "Civil Service",
                "Foreign Policy",
                "International Organizations",
                "Political Development"
            ],

            "Geography": [
                "Map Reading",
                "Scale",
                "Direction",
                "Relief",
                "Weather",
                "Climate",
                "Atmosphere",
                "Rocks",
                "Plate Tectonics",
                "Weathering",
                "Erosion",
                "Rivers",
                "Drainage",
                "Soils",
                "Vegetation",
                "Population",
                "Settlement",
                "Urbanization",
                "Agriculture",
                "Industry",
                "Transportation",
                "Trade",
                "Environmental Problems",
                "Regional Geography"
            ],

            "Literature in English": [
                "Poetry",
                "Prose",
                "Drama",
                "Literary Devices",
                "Figures of Speech",
                "Characterization",
                "Plot",
                "Setting",
                "Theme",
                "Conflict",
                "Irony",
                "Symbolism",
                "Narrative Technique",
                "Point of View",
                "African Literature",
                "Nigerian Literature",
                "World Literature"
            ],

            "Commerce": [
                "Trade",
                "Home Trade",
                "Foreign Trade",
                "Retail Trade",
                "Wholesale Trade",
                "Commerce",
                "Banking",
                "Insurance",
                "Transportation",
                "Warehousing",
                "Communication",
                "Advertising",
                "Business Finance",
                "Entrepreneurship",
                "Consumer Protection"
            ],

            "Principles of Accounts": [
                "Accounting Concepts",
                "Double Entry",
                "Ledger",
                "Cash Book",
                "Petty Cash",
                "Trial Balance",
                "Bank Reconciliation",
                "Final Accounts",
                "Depreciation",
                "Control Accounts",
                "Partnership Accounts",
                "Company Accounts",
                "Manufacturing Accounts",
                "Incomplete Records",
                "Public Sector Accounting"
            ],

            "Computer Studies": [
                "Computer Fundamentals",
                "Hardware",
                "Software",
                "Data Representation",
                "Operating Systems",
                "Word Processing",
                "Spreadsheets",
                "Databases",
                "Computer Networks",
                "Internet",
                "Algorithms",
                "Flowcharts",
                "Programming",
                "Cybersecurity",
                "Artificial Intelligence"
            ],

            "History": [
                "Pre-Colonial Nigeria",
                "Early Nigerian States",
                "Hausa States",
                "Yoruba States",
                "Igbo Society",
                "Kanem-Borno",
                "Trans-Saharan Trade",
                "Slave Trade",
                "European Contact",
                "Colonial Rule",
                "Amalgamation",
                "Nationalism",
                "Independence",
                "Military Rule",
                "Civil War",
                "Post-Independence Nigeria",
                "African History",
                "World History"
            ],

            "Arabic": [
                "Arabic Alphabet",
                "Vocabulary",
                "Grammar",
                "Sentence Structure",
                "Reading",
                "Comprehension",
                "Translation",
                "Writing",
                "Conversation",
                "Arabic Literature"
            ],

            "French": [
                "Vocabulary",
                "Grammar",
                "Gender",
                "Articles",
                "Pronouns",
                "Verbs",
                "Tenses",
                "Sentence Structure",
                "Reading",
                "Comprehension",
                "Writing",
                "Conversation",
                "Translation"
            ],

            "Christian Religious Studies": [
                "Creation",
                "Patriarchs",
                "Moses",
                "Exodus",
                "Kings",
                "Prophets",
                "Birth of Jesus",
                "Ministry of Jesus",
                "Parables",
                "Miracles",
                "Death and Resurrection",
                "Early Church",
                "Paul",
                "Christian Ethics"
            ],

            "Islamic Religious Studies": [
                "Quran",
                "Hadith",
                "Tawhid",
                "Pillars of Islam",
                "Prophet Muhammad",
                "Hijrah",
                "Salah",
                "Zakat",
                "Sawm",
                "Hajj",
                "Islamic Law",
                "Islamic Ethics",
                "Islamic History"
            ],

            "Home Economics": [
                "Food and Nutrition",
                "Food Groups",
                "Balanced Diet",
                "Meal Planning",
                "Food Preparation",
                "Food Preservation",
                "Clothing",
                "Textiles",
                "Sewing",
                "Family Living",
                "Child Development",
                "Home Management",
                "Consumer Education"
            ],

            "Physical and Health Education": [
                "Physical Fitness",
                "Athletics",
                "Football",
                "Basketball",
                "Volleyball",
                "Handball",
                "Table Tennis",
                "Badminton",
                "Swimming",
                "Gymnastics",
                "First Aid",
                "Nutrition",
                "Health Education",
                "Safety"
            ],

            "Music": [
                "Music Notation",
                "Scales",
                "Intervals",
                "Rhythm",
                "Melody",
                "Harmony",
                "Musical Instruments",
                "Nigerian Traditional Music",
                "African Music",
                "Western Music",
                "Music Appreciation"
            ],

            "Art": [
                "Elements of Art",
                "Principles of Design",
                "Drawing",
                "Painting",
                "Sculpture",
                "Printmaking",
                "Textiles",
                "Crafts",
                "Art History",
                "Nigerian Art",
                "African Art",
                "Art Appreciation"
            ],

            "Yoruba": [
                "Vocabulary",
                "Grammar",
                "Sentence Structure",
                "Comprehension",
                "Translation",
                "Proverbs",
                "Idioms",
                "Literature",
                "Poetry",
                "Oral Tradition"
            ],

            "Igbo": [
                "Vocabulary",
                "Grammar",
                "Sentence Structure",
                "Comprehension",
                "Translation",
                "Proverbs",
                "Idioms",
                "Literature",
                "Poetry",
                "Oral Tradition"
            ],

            "Hausa": [
                "Vocabulary",
                "Grammar",
                "Sentence Structure",
                "Comprehension",
                "Translation",
                "Proverbs",
                "Idioms",
                "Literature",
                "Poetry",
                "Oral Tradition"
            ]

        }

    },


    /* =====================================================
       IGCSE
    ===================================================== */

    "IGCSE": {

        subjects: {

            "English Language": [
                "Reading",
                "Comprehension",
                "Inference",
                "Vocabulary",
                "Writer's Effect",
                "Summary",
                "Directed Writing",
                "Descriptive Writing",
                "Narrative Writing",
                "Argumentative Writing",
                "Transactional Writing",
                "Grammar",
                "Sentence Structure",
                "Punctuation"
            ],

            "English Literature": [
                "Poetry",
                "Prose",
                "Drama",
                "Characterization",
                "Plot",
                "Setting",
                "Theme",
                "Structure",
                "Narrative Voice",
                "Language Analysis",
                "Imagery",
                "Symbolism",
                "Context",
                "Comparative Analysis"
            ],

            "Mathematics": [
                "Number",
                "Integers",
                "Fractions",
                "Decimals",
                "Percentages",
                "Ratio",
                "Proportion",
                "Indices",
                "Standard Form",
                "Algebra",
                "Linear Equations",
                "Quadratic Equations",
                "Inequalities",
                "Sequences",
                "Functions",
                "Graphs",
                "Coordinate Geometry",
                "Geometry",
                "Similarity",
                "Congruence",
                "Vectors",
                "Trigonometry",
                "Mensuration",
                "Statistics",
                "Probability",
                "Sets"
            ],

            "Additional Mathematics": [
                "Functions",
                "Quadratic Functions",
                "Polynomials",
                "Algebraic Manipulation",
                "Sequences",
                "Series",
                "Binomial Expansion",
                "Coordinate Geometry",
                "Trigonometry",
                "Differentiation",
                "Integration",
                "Vectors",
                "Permutations",
                "Combinations",
                "Probability",
                "Numerical Methods"
            ],

            "Physics": [
                "Motion",
                "Forces",
                "Energy",
                "Work",
                "Power",
                "Momentum",
                "Pressure",
                "Density",
                "Thermal Physics",
                "Waves",
                "Sound",
                "Light",
                "Electricity",
                "Magnetism",
                "Electromagnetism",
                "Atomic Physics",
                "Radioactivity"
            ],

            "Chemistry": [
                "Particles",
                "Atomic Structure",
                "Periodic Table",
                "Chemical Bonding",
                "Stoichiometry",
                "Acids",
                "Bases",
                "Salts",
                "Electrolysis",
                "Rates of Reaction",
                "Energy Changes",
                "Organic Chemistry",
                "Hydrocarbons",
                "Polymers",
                "Metals",
                "Air and Water",
                "Environmental Chemistry"
            ],

            "Biology": [
                "Characteristics of Living Organisms",
                "Cell Structure",
                "Biological Molecules",
                "Enzymes",
                "Plant Nutrition",
                "Human Nutrition",
                "Transport",
                "Respiration",
                "Excretion",
                "Coordination",
                "Homeostasis",
                "Reproduction",
                "Inheritance",
                "Variation",
                "Ecology",
                "Classification",
                "Human Influences on Ecosystems"
            ],

            "Computer Science": [
                "Data Representation",
                "Binary",
                "Hexadecimal",
                "Data Transmission",
                "Hardware",
                "Software",
                "Operating Systems",
                "Networks",
                "Internet",
                "Cybersecurity",
                "Algorithms",
                "Flowcharts",
                "Pseudocode",
                "Programming",
                "Variables",
                "Data Types",
                "Selection",
                "Iteration",
                "Arrays",
                "Files",
                "Databases",
                "Boolean Logic"
            ],

            "Business Studies": [
                "Business Activity",
                "Entrepreneurship",
                "Business Ownership",
                "Business Objectives",
                "Stakeholders",
                "Human Resources",
                "Recruitment",
                "Training",
                "Marketing",
                "Market Research",
                "Product",
                "Price",
                "Promotion",
                "Place",
                "Operations",
                "Production",
                "Business Finance",
                "Accounting",
                "Cash Flow",
                "Profit and Loss",
                "Business Growth",
                "Globalization"
            ],

            "Economics": [
                "Basic Economic Problem",
                "Resources",
                "Opportunity Cost",
                "Production",
                "Demand",
                "Supply",
                "Elasticity",
                "Market Equilibrium",
                "Market Failure",
                "Government Intervention",
                "Money",
                "Banking",
                "Inflation",
                "Unemployment",
                "Economic Growth",
                "Development",
                "Fiscal Policy",
                "Monetary Policy",
                "International Trade",
                "Exchange Rates",
                "Globalization"
            ],

            "Accounting": [
                "Accounting Principles",
                "Double Entry",
                "Ledger Accounts",
                "Trial Balance",
                "Income Statement",
                "Statement of Financial Position",
                "Adjustments",
                "Depreciation",
                "Inventory",
                "Bad Debts",
                "Bank Reconciliation",
                "Control Accounts",
                "Incomplete Records",
                "Partnerships",
                "Manufacturing Accounts",
                "Accounting Ratios"
            ],

            "Geography": [
                "Population",
                "Settlement",
                "Economic Development",
                "Agriculture",
                "Industry",
                "Tourism",
                "Energy",
                "Water",
                "Natural Hazards",
                "Earthquakes",
                "Volcanoes",
                "Weather",
                "Climate",
                "Rivers",
                "Coasts",
                "Ecosystems",
                "Environmental Management",
                "Map Skills",
                "Fieldwork"
            ],

            "History": [
                "Historical Sources",
                "World War I",
                "World War II",
                "League of Nations",
                "Cold War",
                "Decolonization",
                "Nationalism",
                "Independence Movements",
                "African History",
                "European History",
                "International Relations",
                "Political Change"
            ],

            "ICT": [
                "Computer Systems",
                "Hardware",
                "Software",
                "Networks",
                "Internet",
                "Cybersecurity",
                "Data",
                "Databases",
                "Word Processing",
                "Spreadsheets",
                "Presentations",
                "Web Authoring",
                "Programming",
                "Information Management"
            ],

            "Accounting and Finance": [
                "Accounting Concepts",
                "Double Entry",
                "Ledger",
                "Trial Balance",
                "Financial Statements",
                "Cash Flow",
                "Budgets",
                "Depreciation",
                "Inventory",
                "Bank Reconciliation",
                "Accounting Ratios",
                "Business Finance"
            ],

            "Art and Design": [
                "Drawing",
                "Painting",
                "Photography",
                "Sculpture",
                "Printmaking",
                "Textiles",
                "Design",
                "Composition",
                "Observation",
                "Research",
                "Development of Ideas",
                "Final Outcome"
            ],

            "Global Perspectives": [
                "Research Skills",
                "Critical Thinking",
                "Analysis",
                "Evaluation",
                "Communication",
                "Global Issues",
                "Sustainability",
                "Culture",
                "Technology",
                "Environment",
                "Health",
                "Education",
                "Globalization"
            ]

        }

    },


    /* =====================================================
       SAT
    ===================================================== */

    "SAT": {

        subjects: {

            "Reading and Writing": [
                "Information and Ideas",
                "Central Ideas and Details",
                "Command of Evidence",
                "Textual Evidence",
                "Quantitative Evidence",
                "Inferences",
                "Craft and Structure",
                "Words in Context",
                "Text Structure and Purpose",
                "Cross-Text Connections",
                "Expression of Ideas",
                "Rhetorical Synthesis",
                "Transitions",
                "Standard English Conventions",
                "Boundaries",
                "Form Structure and Sense",
                "Grammar",
                "Punctuation",
                "Literature Passages",
                "History and Social Studies Passages",
                "Humanities Passages",
                "Science Passages"
            ],

            "Math": [
                "Algebra",
                "Linear Equations in One Variable",
                "Linear Equations in Two Variables",
                "Linear Functions",
                "Systems of Linear Equations",
                "Linear Inequalities",
                "Advanced Math",
                "Absolute Value Equations",
                "Quadratic Equations",
                "Exponential Equations",
                "Polynomial Equations",
                "Rational Equations",
                "Radical Equations",
                "Nonlinear Functions",
                "Problem-Solving and Data Analysis",
                "Ratios",
                "Rates",
                "Proportions",
                "Percentages",
                "Units",
                "One-Variable Data",
                "Mean",
                "Median",
                "Range",
                "Standard Deviation",
                "Two-Variable Data",
                "Scatterplots",
                "Probability",
                "Conditional Probability",
                "Statistical Claims",
                "Geometry and Trigonometry",
                "Area",
                "Volume",
                "Lines",
                "Angles",
                "Triangles",
                "Right Triangles",
                "Trigonometry",
                "Circles"
            ]

        }

    },
/* =========================================================
   STUDYMIND AI — NIGERIAN UNIVERSITY COURSE DATABASE
   =========================================================
   
   STRUCTURE:

   University Courses
      ↓
   Faculty
      ↓
   Degree Programme
      ↓
   Level
      ↓
   Semester
      ↓
   Course
      ↓
   Topics

   NOTE:
   This is a GENERAL Nigerian university course database.
   Individual universities can have different course codes,
   course titles, electives and semester arrangements.

========================================================= */

"use strict";


const NIGERIAN_UNIVERSITY_COURSES = {

    /* =====================================================
       COMPUTING & INFORMATION TECHNOLOGY
    ===================================================== */

    "Computing & Information Technology": {

        "Computer Science": {

            "100 Level": {

                "First Semester": [

                    {
                        code: "CSC 101",
                        title: "Introduction to Computer Science",
                        topics: [
                            "History of Computing",
                            "Computer Science as a Discipline",
                            "Computer Applications",
                            "Computer Hardware",
                            "Computer Software",
                            "Operating Systems",
                            "Data and Information",
                            "Computer Professionals",
                            "Ethics in Computing"
                        ]
                    },

                    {
                        code: "CSC 102",
                        title: "Introduction to Programming",
                        topics: [
                            "Programming Concepts",
                            "Algorithms",
                            "Flowcharts",
                            "Pseudocode",
                            "Variables",
                            "Constants",
                            "Data Types",
                            "Operators",
                            "Input and Output",
                            "Conditional Statements",
                            "Loops",
                            "Functions",
                            "Arrays",
                            "Debugging"
                        ]
                    },

                    {
                        code: "MTH 101",
                        title: "Elementary Mathematics I",
                        topics: [
                            "Sets",
                            "Number Systems",
                            "Indices",
                            "Logarithms",
                            "Surds",
                            "Algebra",
                            "Equations",
                            "Inequalities",
                            "Functions",
                            "Sequences",
                            "Coordinate Geometry",
                            "Trigonometry"
                        ]
                    },

                    {
                        code: "PHY 101",
                        title: "General Physics I",
                        topics: [
                            "Measurement",
                            "Units",
                            "Vectors",
                            "Motion",
                            "Force",
                            "Work",
                            "Energy",
                            "Power",
                            "Momentum",
                            "Simple Machines",
                            "Properties of Matter"
                        ]
                    },

                    {
                        code: "GST 101",
                        title: "Use of English",
                        topics: [
                            "Communication",
                            "Grammar",
                            "Sentence Structure",
                            "Vocabulary",
                            "Comprehension",
                            "Essay Writing",
                            "Academic Writing",
                            "Study Skills",
                            "Referencing"
                        ]
                    }

                ],

                "Second Semester": [

                    {
                        code: "CSC 103",
                        title: "Programming Fundamentals II",
                        topics: [
                            "Advanced Variables",
                            "Functions",
                            "Arrays",
                            "Strings",
                            "Structures",
                            "File Handling",
                            "Pointers",
                            "Recursion",
                            "Modular Programming",
                            "Program Testing"
                        ]
                    },

                    {
                        code: "CSC 104",
                        title: "Computer Hardware Fundamentals",
                        topics: [
                            "CPU",
                            "Memory",
                            "Storage",
                            "Motherboard",
                            "Input Devices",
                            "Output Devices",
                            "Ports",
                            "Computer Assembly",
                            "Hardware Troubleshooting"
                        ]
                    },

                    {
                        code: "MTH 102",
                        title: "Elementary Mathematics II",
                        topics: [
                            "Differentiation",
                            "Integration",
                            "Matrices",
                            "Vectors",
                            "Probability",
                            "Statistics",
                            "Permutations",
                            "Combinations"
                        ]
                    },

                    {
                        code: "PHY 102",
                        title: "General Physics II",
                        topics: [
                            "Electricity",
                            "Current",
                            "Voltage",
                            "Resistance",
                            "Capacitance",
                            "Magnetism",
                            "Electromagnetism",
                            "Waves",
                            "Sound",
                            "Light"
                        ]
                    },

                    {
                        code: "GST 102",
                        title: "Communication in English",
                        topics: [
                            "Oral Communication",
                            "Written Communication",
                            "Report Writing",
                            "Technical Writing",
                            "Presentation Skills",
                            "Academic Communication"
                        ]
                    }

                ]
            },


            "200 Level": {

                "First Semester": [

                    {
                        code: "CSC 201",
                        title: "Data Structures",
                        topics: [
                            "Arrays",
                            "Linked Lists",
                            "Stacks",
                            "Queues",
                            "Trees",
                            "Graphs",
                            "Hash Tables",
                            "Searching",
                            "Sorting",
                            "Algorithm Analysis"
                        ]
                    },

                    {
                        code: "CSC 202",
                        title: "Object-Oriented Programming",
                        topics: [
                            "Objects",
                            "Classes",
                            "Encapsulation",
                            "Inheritance",
                            "Polymorphism",
                            "Abstraction",
                            "Constructors",
                            "Interfaces",
                            "Exception Handling"
                        ]
                    },

                    {
                        code: "CSC 203",
                        title: "Digital Logic",
                        topics: [
                            "Binary Numbers",
                            "Boolean Algebra",
                            "Logic Gates",
                            "Truth Tables",
                            "Combinational Circuits",
                            "Sequential Circuits",
                            "Flip-Flops",
                            "Registers",
                            "Counters"
                        ]
                    },

                    {
                        code: "CSC 204",
                        title: "Computer Architecture",
                        topics: [
                            "CPU Architecture",
                            "Instruction Sets",
                            "Registers",
                            "Memory Architecture",
                            "Cache Memory",
                            "Input and Output",
                            "Bus Systems",
                            "Pipelining"
                        ]
                    }

                ],

                "Second Semester": [

                    {
                        code: "CSC 205",
                        title: "Database Systems",
                        topics: [
                            "Database Concepts",
                            "Database Models",
                            "Relational Databases",
                            "Tables",
                            "Primary Keys",
                            "Foreign Keys",
                            "SQL",
                            "Normalization",
                            "Transactions",
                            "Database Security"
                        ]
                    },

                    {
                        code: "CSC 206",
                        title: "Operating Systems",
                        topics: [
                            "Operating System Concepts",
                            "Processes",
                            "Threads",
                            "CPU Scheduling",
                            "Memory Management",
                            "Virtual Memory",
                            "File Systems",
                            "Deadlocks",
                            "Security"
                        ]
                    },

                    {
                        code: "CSC 207",
                        title: "Computer Networks",
                        topics: [
                            "Networking Concepts",
                            "LAN",
                            "WAN",
                            "Network Topologies",
                            "OSI Model",
                            "TCP/IP",
                            "IP Addressing",
                            "Routing",
                            "Switching",
                            "Network Security"
                        ]
                    },

                    {
                        code: "CSC 208",
                        title: "Web Programming",
                        topics: [
                            "HTML",
                            "CSS",
                            "JavaScript",
                            "DOM",
                            "Forms",
                            "Web APIs",
                            "HTTP",
                            "Client-Server Architecture",
                            "Web Security"
                        ]
                    }

                ]
            },


            "300 Level": {

                "First Semester": [

                    {
                        code: "CSC 301",
                        title: "Software Engineering",
                        topics: [
                            "Software Development Life Cycle",
                            "Requirements Engineering",
                            "System Analysis",
                            "System Design",
                            "Agile Development",
                            "Waterfall Model",
                            "Testing",
                            "Version Control",
                            "Software Maintenance"
                        ]
                    },

                    {
                        code: "CSC 302",
                        title: "Algorithms",
                        topics: [
                            "Algorithm Complexity",
                            "Big O Notation",
                            "Divide and Conquer",
                            "Greedy Algorithms",
                            "Dynamic Programming",
                            "Graph Algorithms",
                            "Shortest Path",
                            "Minimum Spanning Trees",
                            "Algorithm Optimization"
                        ]
                    },

                    {
                        code: "CSC 303",
                        title: "Artificial Intelligence",
                        topics: [
                            "Introduction to AI",
                            "Intelligent Agents",
                            "Problem Solving",
                            "Search Algorithms",
                            "Knowledge Representation",
                            "Machine Learning",
                            "Neural Networks",
                            "Natural Language Processing",
                            "Computer Vision",
                            "AI Ethics"
                        ]
                    },

                    {
                        code: "CSC 304",
                        title: "Computer Security",
                        topics: [
                            "Information Security",
                            "Threats",
                            "Vulnerabilities",
                            "Authentication",
                            "Authorization",
                            "Cryptography",
                            "Network Security",
                            "Malware",
                            "Security Policies"
                        ]
                    }

                ],

                "Second Semester": [

                    {
                        code: "CSC 305",
                        title: "Machine Learning",
                        topics: [
                            "Machine Learning Concepts",
                            "Supervised Learning",
                            "Unsupervised Learning",
                            "Regression",
                            "Classification",
                            "Clustering",
                            "Decision Trees",
                            "Model Evaluation",
                            "Feature Engineering",
                            "Overfitting",
                            "Underfitting"
                        ]
                    },

                    {
                        code: "CSC 306",
                        title: "Human Computer Interaction",
                        topics: [
                            "Human Computer Interaction",
                            "User Experience",
                            "User Interface Design",
                            "Usability",
                            "Accessibility",
                            "User Research",
                            "Prototyping",
                            "Interaction Design"
                        ]
                    },

                    {
                        code: "CSC 307",
                        title: "Mobile Application Development",
                        topics: [
                            "Mobile Platforms",
                            "Mobile UI",
                            "Application Architecture",
                            "Mobile Databases",
                            "APIs",
                            "Authentication",
                            "Mobile Security",
                            "Application Deployment"
                        ]
                    },

                    {
                        code: "CSC 308",
                        title: "Research Methods",
                        topics: [
                            "Research Concepts",
                            "Research Questions",
                            "Literature Review",
                            "Research Design",
                            "Data Collection",
                            "Sampling",
                            "Data Analysis",
                            "Academic Referencing",
                            "Research Ethics"
                        ]
                    }

                ]
            },


            "400 Level": {

                "First Semester": [

                    {
                        code: "CSC 401",
                        title: "Advanced Artificial Intelligence",
                        topics: [
                            "Deep Learning",
                            "Convolutional Neural Networks",
                            "Recurrent Neural Networks",
                            "Transformers",
                            "Large Language Models",
                            "Reinforcement Learning",
                            "Generative AI",
                            "AI Deployment",
                            "AI Safety"
                        ]
                    },

                    {
                        code: "CSC 402",
                        title: "Advanced Database Systems",
                        topics: [
                            "Distributed Databases",
                            "NoSQL",
                            "Cloud Databases",
                            "Database Optimization",
                            "Transactions",
                            "Replication",
                            "Data Warehousing",
                            "Big Data"
                        ]
                    },

                    {
                        code: "CSC 403",
                        title: "Distributed Systems",
                        topics: [
                            "Distributed Computing",
                            "Client Server Systems",
                            "Cloud Computing",
                            "Distributed Databases",
                            "Synchronization",
                            "Fault Tolerance",
                            "Distributed Security"
                        ]
                    },

                    {
                        code: "CSC 499",
                        title: "Final Year Project",
                        topics: [
                            "Project Selection",
                            "Problem Definition",
                            "Literature Review",
                            "System Design",
                            "Implementation",
                            "Testing",
                            "Documentation",
                            "Presentation",
                            "Project Defense"
                        ]
                    }

                ],

                "Second Semester": [

                    {
                        code: "CSC 404",
                        title: "Information Systems",
                        topics: [
                            "Information Systems",
                            "Systems Analysis",
                            "Systems Design",
                            "Enterprise Systems",
                            "Decision Support Systems",
                            "Information Management"
                        ]
                    },

                    {
                        code: "CSC 405",
                        title: "Cybersecurity",
                        topics: [
                            "Cyber Threats",
                            "Ethical Hacking Concepts",
                            "Network Defense",
                            "Digital Forensics",
                            "Security Architecture",
                            "Incident Response",
                            "Cyber Law",
                            "Risk Management"
                        ]
                    },

                    {
                        code: "CSC 406",
                        title: "Cloud Computing",
                        topics: [
                            "Cloud Concepts",
                            "Virtualization",
                            "Cloud Architecture",
                            "Cloud Storage",
                            "Cloud Networking",
                            "Cloud Security",
                            "Cloud Deployment",
                            "Serverless Computing"
                        ]
                    }

                ]
            }
        },


        /* =================================================
           SOFTWARE ENGINEERING
        ================================================= */

        "Software Engineering": {

            "100 Level": {

                "First Semester": [
                    {
                        code: "SEN 101",
                        title: "Introduction to Software Engineering",
                        topics: [
                            "Software Engineering",
                            "Software Development",
                            "Software Life Cycle",
                            "Programming Concepts",
                            "Software Quality",
                            "Professional Ethics"
                        ]
                    },
                    {
                        code: "SEN 102",
                        title: "Programming Fundamentals",
                        topics: [
                            "Algorithms",
                            "Variables",
                            "Data Types",
                            "Operators",
                            "Conditions",
                            "Loops",
                            "Functions",
                            "Arrays",
                            "Debugging"
                        ]
                    }
                ],

                "Second Semester": [
                    {
                        code: "SEN 103",
                        title: "Object-Oriented Programming",
                        topics: [
                            "Classes",
                            "Objects",
                            "Inheritance",
                            "Polymorphism",
                            "Encapsulation",
                            "Abstraction"
                        ]
                    }
                ]
            },

            "200 Level": {

                "First Semester": [
                    {
                        code: "SEN 201",
                        title: "Data Structures and Algorithms",
                        topics: [
                            "Arrays",
                            "Linked Lists",
                            "Stacks",
                            "Queues",
                            "Trees",
                            "Graphs",
                            "Sorting",
                            "Searching",
                            "Complexity"
                        ]
                    },
                    {
                        code: "SEN 202",
                        title: "Software Requirements",
                        topics: [
                            "Requirements Engineering",
                            "Functional Requirements",
                            "Non Functional Requirements",
                            "Use Cases",
                            "User Stories",
                            "Requirements Analysis"
                        ]
                    }
                ],

                "Second Semester": [
                    {
                        code: "SEN 203",
                        title: "Database Systems",
                        topics: [
                            "Relational Databases",
                            "SQL",
                            "Normalization",
                            "Database Design",
                            "Transactions"
                        ]
                    },
                    {
                        code: "SEN 204",
                        title: "Web Software Development",
                        topics: [
                            "HTML",
                            "CSS",
                            "JavaScript",
                            "Frontend Development",
                            "Backend Development",
                            "APIs",
                            "Authentication"
                        ]
                    }
                ]
            },

            "300 Level": {

                "First Semester": [
                    {
                        code: "SEN 301",
                        title: "Software Architecture",
                        topics: [
                            "Software Architecture",
                            "Architectural Patterns",
                            "Microservices",
                            "Layered Architecture",
                            "Scalability",
                            "Reliability"
                        ]
                    },
                    {
                        code: "SEN 302",
                        title: "Software Testing",
                        topics: [
                            "Testing Principles",
                            "Unit Testing",
                            "Integration Testing",
                            "System Testing",
                            "Acceptance Testing",
                            "Automation"
                        ]
                    }
                ],

                "Second Semester": [
                    {
                        code: "SEN 303",
                        title: "DevOps",
                        topics: [
                            "Continuous Integration",
                            "Continuous Deployment",
                            "Version Control",
                            "Build Pipelines",
                            "Containers",
                            "Cloud Deployment",
                            "Monitoring"
                        ]
                    }
                ]
            },

            "400 Level": {

                "First Semester": [
                    {
                        code: "SEN 401",
                        title: "Advanced Software Engineering",
                        topics: [
                            "Large Scale Systems",
                            "Distributed Systems",
                            "Cloud Software",
                            "Software Security",
                            "System Scalability"
                        ]
                    }
                ],

                "Second Semester": [
                    {
                        code: "SEN 499",
                        title: "Software Engineering Project",
                        topics: [
                            "Project Planning",
                            "Requirements",
                            "Architecture",
                            "Implementation",
                            "Testing",
                            "Deployment",
                            "Documentation",
                            "Project Defense"
                        ]
                    }
                ]
            }
        },


        /* =================================================
           INFORMATION TECHNOLOGY
        ================================================= */

        "Information Technology": {

            "100 Level": {
                "First Semester": [
                    {
                        code: "IFT 101",
                        title: "Introduction to Information Technology",
                        topics: [
                            "Information Technology",
                            "Computer Systems",
                            "Hardware",
                            "Software",
                            "Networks",
                            "Information Systems"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "IFT 102",
                        title: "Introduction to Programming",
                        topics: [
                            "Algorithms",
                            "Variables",
                            "Conditions",
                            "Loops",
                            "Functions",
                            "Arrays"
                        ]
                    }
                ]
            },

            "200 Level": {
                "First Semester": [
                    {
                        code: "IFT 201",
                        title: "Database Management",
                        topics: [
                            "Database Concepts",
                            "SQL",
                            "Database Design",
                            "Normalization",
                            "Security"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "IFT 202",
                        title: "Networking",
                        topics: [
                            "LAN",
                            "WAN",
                            "TCP/IP",
                            "IP Addressing",
                            "Routing",
                            "Network Security"
                        ]
                    }
                ]
            },

            "300 Level": {
                "First Semester": [
                    {
                        code: "IFT 301",
                        title: "Systems Analysis and Design",
                        topics: [
                            "Systems Analysis",
                            "Requirements",
                            "System Modeling",
                            "UML",
                            "System Design"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "IFT 302",
                        title: "Information Security",
                        topics: [
                            "Security Principles",
                            "Threats",
                            "Authentication",
                            "Cryptography",
                            "Network Security"
                        ]
                    }
                ]
            },

            "400 Level": {
                "First Semester": [
                    {
                        code: "IFT 401",
                        title: "IT Project Management",
                        topics: [
                            "Project Planning",
                            "Project Scheduling",
                            "Risk Management",
                            "Budgeting",
                            "Team Management"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "IFT 499",
                        title: "IT Project",
                        topics: [
                            "Research",
                            "System Analysis",
                            "Design",
                            "Implementation",
                            "Testing",
                            "Documentation"
                        ]
                    }
                ]
            }
        },


        /* =================================================
           CYBERSECURITY
        ================================================= */

        "Cybersecurity": {

            "100 Level": {
                "First Semester": [
                    {
                        code: "CYB 101",
                        title: "Introduction to Cybersecurity",
                        topics: [
                            "Cybersecurity Concepts",
                            "Cyber Threats",
                            "Information Security",
                            "Security Principles",
                            "Cyber Ethics"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "CYB 102",
                        title: "Computer Fundamentals",
                        topics: [
                            "Computer Hardware",
                            "Operating Systems",
                            "Data Representation",
                            "Computer Networks"
                        ]
                    }
                ]
            },

            "200 Level": {
                "First Semester": [
                    {
                        code: "CYB 201",
                        title: "Network Security",
                        topics: [
                            "Network Threats",
                            "Firewalls",
                            "Intrusion Detection",
                            "Network Authentication",
                            "Secure Protocols"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "CYB 202",
                        title: "Cryptography",
                        topics: [
                            "Encryption",
                            "Symmetric Cryptography",
                            "Asymmetric Cryptography",
                            "Hash Functions",
                            "Digital Signatures"
                        ]
                    }
                ]
            },

            "300 Level": {
                "First Semester": [
                    {
                        code: "CYB 301",
                        title: "Digital Forensics",
                        topics: [
                            "Digital Evidence",
                            "Forensic Investigation",
                            "File Systems",
                            "Evidence Preservation",
                            "Incident Response"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "CYB 302",
                        title: "Ethical Security Testing",
                        topics: [
                            "Security Assessment",
                            "Vulnerability Assessment",
                            "Penetration Testing Concepts",
                            "Security Reporting",
                            "Defensive Security"
                        ]
                    }
                ]
            },

            "400 Level": {
                "First Semester": [
                    {
                        code: "CYB 401",
                        title: "Advanced Cybersecurity",
                        topics: [
                            "Security Architecture",
                            "Cloud Security",
                            "Application Security",
                            "Threat Intelligence",
                            "Risk Management"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "CYB 499",
                        title: "Cybersecurity Project",
                        topics: [
                            "Research",
                            "Threat Analysis",
                            "System Design",
                            "Implementation",
                            "Testing",
                            "Documentation"
                        ]
                    }
                ]
            }
        },


        /* =================================================
           ARTIFICIAL INTELLIGENCE
        ================================================= */

        "Artificial Intelligence": {

            "100 Level": {
                "First Semester": [
                    {
                        code: "AIT 101",
                        title: "Introduction to Artificial Intelligence",
                        topics: [
                            "History of AI",
                            "AI Concepts",
                            "Intelligent Systems",
                            "AI Applications",
                            "AI Ethics"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "AIT 102",
                        title: "Programming for AI",
                        topics: [
                            "Programming Fundamentals",
                            "Python",
                            "Variables",
                            "Functions",
                            "Data Structures",
                            "File Handling"
                        ]
                    }
                ]
            },

            "200 Level": {
                "First Semester": [
                    {
                        code: "AIT 201",
                        title: "Mathematics for Artificial Intelligence",
                        topics: [
                            "Linear Algebra",
                            "Matrices",
                            "Vectors",
                            "Probability",
                            "Statistics",
                            "Functions"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "AIT 202",
                        title: "Data Structures for AI",
                        topics: [
                            "Arrays",
                            "Lists",
                            "Trees",
                            "Graphs",
                            "Hash Tables",
                            "Algorithm Complexity"
                        ]
                    }
                ]
            },

            "300 Level": {
                "First Semester": [
                    {
                        code: "AIT 301",
                        title: "Machine Learning",
                        topics: [
                            "Supervised Learning",
                            "Unsupervised Learning",
                            "Regression",
                            "Classification",
                            "Clustering",
                            "Model Evaluation"
                        ]
                    },
                    {
                        code: "AIT 302",
                        title: "Natural Language Processing",
                        topics: [
                            "Text Processing",
                            "Tokenization",
                            "Embeddings",
                            "Language Models",
                            "Text Classification",
                            "Machine Translation"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "AIT 303",
                        title: "Computer Vision",
                        topics: [
                            "Digital Images",
                            "Image Processing",
                            "Feature Extraction",
                            "Object Detection",
                            "Image Classification",
                            "Computer Vision Applications"
                        ]
                    }
                ]
            },

            "400 Level": {
                "First Semester": [
                    {
                        code: "AIT 401",
                        title: "Deep Learning",
                        topics: [
                            "Neural Networks",
                            "Backpropagation",
                            "Convolutional Neural Networks",
                            "Recurrent Neural Networks",
                            "Transformers",
                            "Generative AI"
                        ]
                    },
                    {
                        code: "AIT 402",
                        title: "Reinforcement Learning",
                        topics: [
                            "Agents",
                            "Environments",
                            "Rewards",
                            "Policies",
                            "Value Functions",
                            "Q Learning"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "AIT 499",
                        title: "Artificial Intelligence Project",
                        topics: [
                            "Problem Definition",
                            "Research",
                            "Dataset Preparation",
                            "Model Development",
                            "Evaluation",
                            "Deployment",
                            "Documentation",
                            "Project Defense"
                        ]
                    }
                ]
            }
        }

    },


    /* =====================================================
       ENGINEERING
    ===================================================== */

    "Engineering": {

        "Electrical and Electronics Engineering": {

            "100 Level": {
                "First Semester": [
                    {
                        code: "EEE 101",
                        title: "Introduction to Electrical Engineering",
                        topics: [
                            "Electrical Engineering",
                            "Electrical Quantities",
                            "Voltage",
                            "Current",
                            "Resistance",
                            "Power",
                            "Electrical Safety"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "EEE 102",
                        title: "Basic Electrical Circuits",
                        topics: [
                            "Ohm's Law",
                            "Kirchhoff's Laws",
                            "Series Circuits",
                            "Parallel Circuits",
                            "Circuit Analysis",
                            "DC Circuits"
                        ]
                    }
                ]
            },

            "200 Level": {
                "First Semester": [
                    {
                        code: "EEE 201",
                        title: "Circuit Theory",
                        topics: [
                            "AC Circuits",
                            "Impedance",
                            "Reactance",
                            "Phasors",
                            "Resonance",
                            "Network Theorems"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "EEE 202",
                        title: "Electronic Devices",
                        topics: [
                            "Semiconductors",
                            "Diodes",
                            "Transistors",
                            "Amplifiers",
                            "Rectifiers",
                            "Power Supplies"
                        ]
                    }
                ]
            },

            "300 Level": {
                "First Semester": [
                    {
                        code: "EEE 301",
                        title: "Digital Electronics",
                        topics: [
                            "Logic Gates",
                            "Boolean Algebra",
                            "Flip Flops",
                            "Counters",
                            "Registers",
                            "Digital Circuits"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "EEE 302",
                        title: "Microprocessors",
                        topics: [
                            "Microprocessors",
                            "Microcontrollers",
                            "Assembly Concepts",
                            "Memory",
                            "Input and Output",
                            "Embedded Systems"
                        ]
                    }
                ]
            },

            "400 Level": {
                "First Semester": [
                    {
                        code: "EEE 401",
                        title: "Control Systems",
                        topics: [
                            "Control Systems",
                            "Feedback",
                            "Transfer Functions",
                            "Stability",
                            "Controllers",
                            "System Response"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "EEE 499",
                        title: "Engineering Project",
                        topics: [
                            "Research",
                            "Design",
                            "Implementation",
                            "Testing",
                            "Technical Writing",
                            "Presentation"
                        ]
                    }
                ]
            }
        },


        "Mechanical Engineering": {

            "100 Level": {
                "First Semester": [
                    {
                        code: "MEE 101",
                        title: "Introduction to Mechanical Engineering",
                        topics: [
                            "Engineering Profession",
                            "Mechanical Systems",
                            "Engineering Materials",
                            "Engineering Safety",
                            "Engineering Design"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "MEE 102",
                        title: "Engineering Drawing",
                        topics: [
                            "Technical Drawing",
                            "Orthographic Projection",
                            "Isometric Drawing",
                            "Sections",
                            "Dimensioning"
                        ]
                    }
                ]
            },

            "200 Level": {
                "First Semester": [
                    {
                        code: "MEE 201",
                        title: "Engineering Mechanics",
                        topics: [
                            "Forces",
                            "Moments",
                            "Equilibrium",
                            "Friction",
                            "Centroids"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "MEE 202",
                        title: "Thermodynamics",
                        topics: [
                            "Temperature",
                            "Heat",
                            "Energy",
                            "First Law",
                            "Second Law",
                            "Entropy"
                        ]
                    }
                ]
            },

            "300 Level": {
                "First Semester": [
                    {
                        code: "MEE 301",
                        title: "Fluid Mechanics",
                        topics: [
                            "Fluid Properties",
                            "Pressure",
                            "Fluid Flow",
                            "Bernoulli Equation",
                            "Pipes",
                            "Turbines"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "MEE 302",
                        title: "Machine Design",
                        topics: [
                            "Machine Components",
                            "Stress",
                            "Strain",
                            "Shafts",
                            "Gears",
                            "Bearings"
                        ]
                    }
                ]
            },

            "400 Level": {
                "First Semester": [
                    {
                        code: "MEE 401",
                        title: "Heat Transfer",
                        topics: [
                            "Conduction",
                            "Convection",
                            "Radiation",
                            "Heat Exchangers"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "MEE 499",
                        title: "Mechanical Engineering Project",
                        topics: [
                            "Research",
                            "Design",
                            "Fabrication",
                            "Testing",
                            "Technical Documentation"
                        ]
                    }
                ]
            }
        },


        "Civil Engineering": {

            "100 Level": {
                "First Semester": [
                    {
                        code: "CVE 101",
                        title: "Introduction to Civil Engineering",
                        topics: [
                            "Civil Engineering",
                            "Construction",
                            "Infrastructure",
                            "Engineering Materials",
                            "Engineering Safety"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "CVE 102",
                        title: "Engineering Drawing",
                        topics: [
                            "Technical Drawing",
                            "Projection",
                            "Plans",
                            "Sections",
                            "Dimensioning"
                        ]
                    }
                ]
            },

            "200 Level": {
                "First Semester": [
                    {
                        code: "CVE 201",
                        title: "Engineering Mechanics",
                        topics: [
                            "Statics",
                            "Dynamics",
                            "Forces",
                            "Moments",
                            "Equilibrium"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "CVE 202",
                        title: "Strength of Materials",
                        topics: [
                            "Stress",
                            "Strain",
                            "Bending",
                            "Shear",
                            "Torsion",
                            "Deflection"
                        ]
                    }
                ]
            },

            "300 Level": {
                "First Semester": [
                    {
                        code: "CVE 301",
                        title: "Structural Analysis",
                        topics: [
                            "Beams",
                            "Trusses",
                            "Frames",
                            "Structural Loads",
                            "Structural Stability"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "CVE 302",
                        title: "Geotechnical Engineering",
                        topics: [
                            "Soil Properties",
                            "Soil Classification",
                            "Bearing Capacity",
                            "Foundations",
                            "Slope Stability"
                        ]
                    }
                ]
            },

            "400 Level": {
                "First Semester": [
                    {
                        code: "CVE 401",
                        title: "Transportation Engineering",
                        topics: [
                            "Highways",
                            "Traffic Engineering",
                            "Road Design",
                            "Pavement Design",
                            "Transportation Planning"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "CVE 499",
                        title: "Civil Engineering Project",
                        topics: [
                            "Research",
                            "Design",
                            "Construction Planning",
                            "Testing",
                            "Project Documentation"
                        ]
                    }
                ]
            }
        }

    },


    /* =====================================================
       NATURAL SCIENCES
    ===================================================== */

    "Natural Sciences": {

        "Biochemistry": {

            "100 Level": {
                "First Semester": [
                    {
                        code: "BCH 101",
                        title: "Introduction to Biochemistry",
                        topics: [
                            "Biochemistry",
                            "Biomolecules",
                            "Cells",
                            "Water",
                            "Chemical Bonds"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "BCH 102",
                        title: "General Chemistry",
                        topics: [
                            "Atomic Structure",
                            "Periodic Table",
                            "Chemical Bonding",
                            "Stoichiometry",
                            "Acids and Bases"
                        ]
                    }
                ]
            },

            "200 Level": {
                "First Semester": [
                    {
                        code: "BCH 201",
                        title: "Carbohydrate Biochemistry",
                        topics: [
                            "Monosaccharides",
                            "Disaccharides",
                            "Polysaccharides",
                            "Carbohydrate Metabolism"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "BCH 202",
                        title: "Protein Biochemistry",
                        topics: [
                            "Amino Acids",
                            "Protein Structure",
                            "Enzymes",
                            "Protein Synthesis"
                        ]
                    }
                ]
            },

            "300 Level": {
                "First Semester": [
                    {
                        code: "BCH 301",
                        title: "Enzymology",
                        topics: [
                            "Enzyme Structure",
                            "Enzyme Kinetics",
                            "Factors Affecting Enzyme Activity",
                            "Enzyme Inhibition"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "BCH 302",
                        title: "Metabolism",
                        topics: [
                            "Glycolysis",
                            "Krebs Cycle",
                            "Electron Transport",
                            "Fatty Acid Metabolism",
                            "Amino Acid Metabolism"
                        ]
                    }
                ]
            },

            "400 Level": {
                "First Semester": [
                    {
                        code: "BCH 401",
                        title: "Molecular Biology",
                        topics: [
                            "DNA",
                            "RNA",
                            "Replication",
                            "Transcription",
                            "Translation",
                            "Gene Regulation"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "BCH 499",
                        title: "Biochemistry Project",
                        topics: [
                            "Research Design",
                            "Laboratory Methods",
                            "Data Analysis",
                            "Research Writing",
                            "Project Defense"
                        ]
                    }
                ]
            }
        },


        "Microbiology": {

            "100 Level": {
                "First Semester": [
                    {
                        code: "MCB 101",
                        title: "Introduction to Microbiology",
                        topics: [
                            "Microbiology",
                            "Microorganisms",
                            "History of Microbiology",
                            "Microscopy",
                            "Laboratory Safety"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "MCB 102",
                        title: "Cell Biology",
                        topics: [
                            "Cell Structure",
                            "Cell Organelles",
                            "Cell Division",
                            "Cell Metabolism"
                        ]
                    }
                ]
            },

            "200 Level": {
                "First Semester": [
                    {
                        code: "MCB 201",
                        title: "Bacteriology",
                        topics: [
                            "Bacteria",
                            "Bacterial Structure",
                            "Bacterial Growth",
                            "Bacterial Classification"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "MCB 202",
                        title: "Virology",
                        topics: [
                            "Viruses",
                            "Viral Structure",
                            "Viral Replication",
                            "Viral Diseases"
                        ]
                    }
                ]
            },

            "300 Level": {
                "First Semester": [
                    {
                        code: "MCB 301",
                        title: "Medical Microbiology",
                        topics: [
                            "Pathogenic Microorganisms",
                            "Infectious Diseases",
                            "Diagnosis",
                            "Antimicrobial Agents"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "MCB 302",
                        title: "Industrial Microbiology",
                        topics: [
                            "Fermentation",
                            "Industrial Microorganisms",
                            "Biotechnology",
                            "Food Production"
                        ]
                    }
                ]
            },

            "400 Level": {
                "First Semester": [
                    {
                        code: "MCB 401",
                        title: "Microbial Genetics",
                        topics: [
                            "Microbial DNA",
                            "Mutation",
                            "Gene Transfer",
                            "Genetic Engineering"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "MCB 499",
                        title: "Microbiology Project",
                        topics: [
                            "Research",
                            "Laboratory Investigation",
                            "Data Analysis",
                            "Scientific Writing"
                        ]
                    }
                ]
            }
        },


        "Mathematics": {

            "100 Level": {
                "First Semester": [
                    {
                        code: "MTH 101",
                        title: "Elementary Mathematics I",
                        topics: [
                            "Sets",
                            "Functions",
                            "Algebra",
                            "Sequences",
                            "Trigonometry"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "MTH 102",
                        title: "Elementary Mathematics II",
                        topics: [
                            "Differentiation",
                            "Integration",
                            "Matrices",
                            "Vectors",
                            "Probability"
                        ]
                    }
                ]
            },

            "200 Level": {
                "First Semester": [
                    {
                        code: "MTH 201",
                        title: "Calculus",
                        topics: [
                            "Limits",
                            "Continuity",
                            "Differentiation",
                            "Integration",
                            "Applications"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "MTH 202",
                        title: "Linear Algebra",
                        topics: [
                            "Matrices",
                            "Determinants",
                            "Vector Spaces",
                            "Linear Transformations",
                            "Eigenvalues"
                        ]
                    }
                ]
            },

            "300 Level": {
                "First Semester": [
                    {
                        code: "MTH 301",
                        title: "Real Analysis",
                        topics: [
                            "Real Numbers",
                            "Sequences",
                            "Series",
                            "Limits",
                            "Continuity",
                            "Differentiation"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "MTH 302",
                        title: "Differential Equations",
                        topics: [
                            "First Order Equations",
                            "Second Order Equations",
                            "Linear Equations",
                            "Applications"
                        ]
                    }
                ]
            },

            "400 Level": {
                "First Semester": [
                    {
                        code: "MTH 401",
                        title: "Numerical Analysis",
                        topics: [
                            "Numerical Methods",
                            "Error Analysis",
                            "Interpolation",
                            "Numerical Integration",
                            "Differential Equations"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "MTH 499",
                        title: "Mathematics Project",
                        topics: [
                            "Research",
                            "Literature Review",
                            "Mathematical Analysis",
                            "Writing",
                            "Presentation"
                        ]
                    }
                ]
            }
        },


        "Physics": {

            "100 Level": {
                "First Semester": [
                    {
                        code: "PHY 101",
                        title: "General Physics I",
                        topics: [
                            "Measurement",
                            "Vectors",
                            "Motion",
                            "Force",
                            "Energy",
                            "Momentum"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "PHY 102",
                        title: "General Physics II",
                        topics: [
                            "Electricity",
                            "Magnetism",
                            "Waves",
                            "Light",
                            "Optics"
                        ]
                    }
                ]
            },

            "200 Level": {
                "First Semester": [
                    {
                        code: "PHY 201",
                        title: "Mechanics",
                        topics: [
                            "Kinematics",
                            "Dynamics",
                            "Work",
                            "Energy",
                            "Momentum",
                            "Rotational Motion"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "PHY 202",
                        title: "Electromagnetism",
                        topics: [
                            "Electric Fields",
                            "Magnetic Fields",
                            "Electromagnetic Induction",
                            "Maxwell Concepts"
                        ]
                    }
                ]
            },

            "300 Level": {
                "First Semester": [
                    {
                        code: "PHY 301",
                        title: "Quantum Physics",
                        topics: [
                            "Quantum Concepts",
                            "Wave Particle Duality",
                            "Quantum States",
                            "Atomic Models"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "PHY 302",
                        title: "Thermal Physics",
                        topics: [
                            "Temperature",
                            "Heat",
                            "Thermodynamics",
                            "Entropy",
                            "Statistical Physics"
                        ]
                    }
                ]
            },

            "400 Level": {
                "First Semester": [
                    {
                        code: "PHY 401",
                        title: "Nuclear Physics",
                        topics: [
                            "Atomic Nucleus",
                            "Radioactivity",
                            "Nuclear Reactions",
                            "Nuclear Energy"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "PHY 499",
                        title: "Physics Project",
                        topics: [
                            "Research",
                            "Experimentation",
                            "Data Analysis",
                            "Scientific Writing"
                        ]
                    }
                ]
            }
        }

    },


    /* =====================================================
       BUSINESS & MANAGEMENT
    ===================================================== */

    "Business & Management": {

        "Accounting": {

            "100 Level": {
                "First Semester": [
                    {
                        code: "ACC 101",
                        title: "Introduction to Accounting",
                        topics: [
                            "Accounting Concepts",
                            "Accounting Principles",
                            "Accounting Equation",
                            "Source Documents",
                            "Double Entry"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "ACC 102",
                        title: "Financial Accounting",
                        topics: [
                            "Ledger",
                            "Trial Balance",
                            "Cash Book",
                            "Bank Reconciliation",
                            "Final Accounts"
                        ]
                    }
                ]
            },

            "200 Level": {
                "First Semester": [
                    {
                        code: "ACC 201",
                        title: "Intermediate Accounting",
                        topics: [
                            "Depreciation",
                            "Inventory",
                            "Control Accounts",
                            "Partnership Accounts"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "ACC 202",
                        title: "Cost Accounting",
                        topics: [
                            "Cost Concepts",
                            "Cost Classification",
                            "Job Costing",
                            "Process Costing",
                            "Budgeting"
                        ]
                    }
                ]
            },

            "300 Level": {
                "First Semester": [
                    {
                        code: "ACC 301",
                        title: "Management Accounting",
                        topics: [
                            "Management Accounting",
                            "Budgeting",
                            "Decision Making",
                            "Cost Analysis"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "ACC 302",
                        title: "Auditing",
                        topics: [
                            "Auditing",
                            "Internal Control",
                            "Audit Evidence",
                            "Audit Procedures",
                            "Audit Reports"
                        ]
                    }
                ]
            },

            "400 Level": {
                "First Semester": [
                    {
                        code: "ACC 401",
                        title: "Advanced Accounting",
                        topics: [
                            "Company Accounts",
                            "Consolidated Accounts",
                            "Advanced Financial Reporting"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "ACC 499",
                        title: "Accounting Project",
                        topics: [
                            "Research",
                            "Data Collection",
                            "Data Analysis",
                            "Report Writing",
                            "Presentation"
                        ]
                    }
                ]
            }
        },


        "Business Administration": {

            "100 Level": {
                "First Semester": [
                    {
                        code: "BUS 101",
                        title: "Introduction to Business",
                        topics: [
                            "Business Concepts",
                            "Business Environment",
                            "Entrepreneurship",
                            "Business Ownership"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "BUS 102",
                        title: "Principles of Management",
                        topics: [
                            "Planning",
                            "Organizing",
                            "Staffing",
                            "Directing",
                            "Controlling"
                        ]
                    }
                ]
            },

            "200 Level": {
                "First Semester": [
                    {
                        code: "BUS 201",
                        title: "Marketing Management",
                        topics: [
                            "Marketing Concepts",
                            "Market Research",
                            "Consumer Behaviour",
                            "Product",
                            "Pricing",
                            "Promotion"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "BUS 202",
                        title: "Human Resource Management",
                        topics: [
                            "Recruitment",
                            "Selection",
                            "Training",
                            "Performance Management",
                            "Employee Relations"
                        ]
                    }
                ]
            },

            "300 Level": {
                "First Semester": [
                    {
                        code: "BUS 301",
                        title: "Operations Management",
                        topics: [
                            "Production",
                            "Operations Planning",
                            "Quality Management",
                            "Inventory",
                            "Supply Chain"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "BUS 302",
                        title: "Strategic Management",
                        topics: [
                            "Strategy",
                            "Competitive Advantage",
                            "SWOT Analysis",
                            "Strategic Planning",
                            "Implementation"
                        ]
                    }
                ]
            },

            "400 Level": {
                "First Semester": [
                    {
                        code: "BUS 401",
                        title: "Entrepreneurship",
                        topics: [
                            "Business Ideas",
                            "Opportunity Recognition",
                            "Business Models",
                            "Business Planning",
                            "Financing"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "BUS 499",
                        title: "Business Administration Project",
                        topics: [
                            "Research",
                            "Data Collection",
                            "Analysis",
                            "Report Writing",
                            "Presentation"
                        ]
                    }
                ]
            }
        },


        "Economics": {

            "100 Level": {
                "First Semester": [
                    {
                        code: "ECO 101",
                        title: "Principles of Economics I",
                        topics: [
                            "Scarcity",
                            "Choice",
                            "Opportunity Cost",
                            "Demand",
                            "Supply",
                            "Market Equilibrium"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "ECO 102",
                        title: "Principles of Economics II",
                        topics: [
                            "National Income",
                            "Inflation",
                            "Unemployment",
                            "Money",
                            "Banking",
                            "Economic Growth"
                        ]
                    }
                ]
            },

            "200 Level": {
                "First Semester": [
                    {
                        code: "ECO 201",
                        title: "Microeconomics",
                        topics: [
                            "Consumer Behaviour",
                            "Production",
                            "Costs",
                            "Market Structures",
                            "Pricing"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "ECO 202",
                        title: "Macroeconomics",
                        topics: [
                            "National Income",
                            "Aggregate Demand",
                            "Aggregate Supply",
                            "Fiscal Policy",
                            "Monetary Policy"
                        ]
                    }
                ]
            },

            "300 Level": {
                "First Semester": [
                    {
                        code: "ECO 301",
                        title: "Econometrics",
                        topics: [
                            "Economic Data",
                            "Regression",
                            "Correlation",
                            "Statistical Inference",
                            "Econometric Models"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "ECO 302",
                        title: "Development Economics",
                        topics: [
                            "Economic Development",
                            "Poverty",
                            "Inequality",
                            "Human Capital",
                            "Development Policies"
                        ]
                    }
                ]
            },

            "400 Level": {
                "First Semester": [
                    {
                        code: "ECO 401",
                        title: "International Economics",
                        topics: [
                            "International Trade",
                            "Exchange Rates",
                            "Balance of Payments",
                            "Trade Policies"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "ECO 499",
                        title: "Economics Project",
                        topics: [
                            "Research",
                            "Economic Data",
                            "Analysis",
                            "Report Writing",
                            "Presentation"
                        ]
                    }
                ]
            }
        }

    },


    /* =====================================================
       SOCIAL SCIENCES
    ===================================================== */

    "Social Sciences": {

        "Political Science": {

            "100 Level": {
                "First Semester": [
                    {
                        code: "POL 101",
                        title: "Introduction to Political Science",
                        topics: [
                            "Politics",
                            "Political Science",
                            "State",
                            "Power",
                            "Authority",
                            "Political Institutions"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "POL 102",
                        title: "Nigerian Government",
                        topics: [
                            "Nigerian Political System",
                            "Constitution",
                            "Federalism",
                            "Political Parties",
                            "Elections"
                        ]
                    }
                ]
            },

            "200 Level": {
                "First Semester": [
                    {
                        code: "POL 201",
                        title: "Political Theory",
                        topics: [
                            "Plato",
                            "Aristotle",
                            "Social Contract",
                            "Democracy",
                            "Justice",
                            "Liberty"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "POL 202",
                        title: "Comparative Politics",
                        topics: [
                            "Political Systems",
                            "Democracy",
                            "Authoritarianism",
                            "Political Institutions"
                        ]
                    }
                ]
            },

            "300 Level": {
                "First Semester": [
                    {
                        code: "POL 301",
                        title: "International Relations",
                        topics: [
                            "International Relations",
                            "Foreign Policy",
                            "International Organizations",
                            "Conflict",
                            "Diplomacy"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "POL 302",
                        title: "Public Administration",
                        topics: [
                            "Public Administration",
                            "Bureaucracy",
                            "Public Policy",
                            "Governance",
                            "Civil Service"
                        ]
                    }
                ]
            },

            "400 Level": {
                "First Semester": [
                    {
                        code: "POL 401",
                        title: "Political Analysis",
                        topics: [
                            "Political Research",
                            "Data Collection",
                            "Political Data",
                            "Policy Analysis"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "POL 499",
                        title: "Political Science Project",
                        topics: [
                            "Research",
                            "Literature Review",
                            "Data Collection",
                            "Analysis",
                            "Presentation"
                        ]
                    }
                ]
            }
        },


        "Sociology": {

            "100 Level": {
                "First Semester": [
                    {
                        code: "SOC 101",
                        title: "Introduction to Sociology",
                        topics: [
                            "Society",
                            "Culture",
                            "Socialization",
                            "Social Institutions",
                            "Social Groups"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "SOC 102",
                        title: "Social Problems",
                        topics: [
                            "Poverty",
                            "Crime",
                            "Unemployment",
                            "Inequality",
                            "Social Change"
                        ]
                    }
                ]
            },

            "200 Level": {
                "First Semester": [
                    {
                        code: "SOC 201",
                        title: "Social Research Methods",
                        topics: [
                            "Research Design",
                            "Sampling",
                            "Questionnaires",
                            "Interviews",
                            "Data Analysis"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "SOC 202",
                        title: "Social Psychology",
                        topics: [
                            "Social Behaviour",
                            "Attitudes",
                            "Groups",
                            "Leadership",
                            "Interpersonal Relations"
                        ]
                    }
                ]
            },

            "300 Level": {
                "First Semester": [
                    {
                        code: "SOC 301",
                        title: "Development Sociology",
                        topics: [
                            "Development",
                            "Modernization",
                            "Poverty",
                            "Inequality",
                            "Social Policy"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "SOC 302",
                        title: "Industrial Sociology",
                        topics: [
                            "Work",
                            "Organizations",
                            "Industrial Relations",
                            "Labour",
                            "Workplace Culture"
                        ]
                    }
                ]
            },

            "400 Level": {
                "First Semester": [
                    {
                        code: "SOC 401",
                        title: "Advanced Sociological Theory",
                        topics: [
                            "Classical Theory",
                            "Modern Theory",
                            "Social Structure",
                            "Social Change"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "SOC 499",
                        title: "Sociology Project",
                        topics: [
                            "Research",
                            "Field Work",
                            "Data Analysis",
                            "Academic Writing"
                        ]
                    }
                ]
            }
        }

    },


    /* =====================================================
       ARTS & HUMANITIES
    ===================================================== */

    "Arts & Humanities": {

        "English and Literary Studies": {

            "100 Level": {
                "First Semester": [
                    {
                        code: "ELS 101",
                        title: "Introduction to Literature",
                        topics: [
                            "Poetry",
                            "Prose",
                            "Drama",
                            "Literary Genres",
                            "Literary Devices"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "ELS 102",
                        title: "Introduction to Language",
                        topics: [
                            "Language",
                            "Grammar",
                            "Phonetics",
                            "Phonology",
                            "Morphology",
                            "Syntax"
                        ]
                    }
                ]
            },

            "200 Level": {
                "First Semester": [
                    {
                        code: "ELS 201",
                        title: "African Literature",
                        topics: [
                            "African Poetry",
                            "African Prose",
                            "African Drama",
                            "Postcolonial Literature"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "ELS 202",
                        title: "Literary Criticism",
                        topics: [
                            "Literary Theory",
                            "Formalism",
                            "Structuralism",
                            "Postcolonial Criticism",
                            "Feminist Criticism"
                        ]
                    }
                ]
            },

            "300 Level": {
                "First Semester": [
                    {
                        code: "ELS 301",
                        title: "Advanced Literary Studies",
                        topics: [
                            "Narrative",
                            "Characterization",
                            "Theme",
                            "Symbolism",
                            "Narrative Technique"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "ELS 302",
                        title: "Creative Writing",
                        topics: [
                            "Storytelling",
                            "Character Development",
                            "Dialogue",
                            "Plot",
                            "Creative Style"
                        ]
                    }
                ]
            },

            "400 Level": {
                "First Semester": [
                    {
                        code: "ELS 401",
                        title: "Advanced Literary Criticism",
                        topics: [
                            "Literary Theory",
                            "Critical Analysis",
                            "Comparative Literature"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "ELS 499",
                        title: "English Project",
                        topics: [
                            "Research",
                            "Literature Review",
                            "Critical Analysis",
                            "Academic Writing",
                            "Presentation"
                        ]
                    }
                ]
            }
        }

    },


    /* =====================================================
       AGRICULTURE
    ===================================================== */

    "Agriculture": {

        "Agricultural Science": {

            "100 Level": {
                "First Semester": [
                    {
                        code: "AGR 101",
                        title: "Introduction to Agriculture",
                        topics: [
                            "Agriculture",
                            "Agricultural Systems",
                            "Farm Management",
                            "Agricultural Resources"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "AGR 102",
                        title: "Basic Crop Science",
                        topics: [
                            "Crop Production",
                            "Plant Growth",
                            "Seeds",
                            "Crop Management"
                        ]
                    }
                ]
            },

            "200 Level": {
                "First Semester": [
                    {
                        code: "AGR 201",
                        title: "Soil Science",
                        topics: [
                            "Soil Formation",
                            "Soil Properties",
                            "Soil Fertility",
                            "Soil Conservation"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "AGR 202",
                        title: "Animal Science",
                        topics: [
                            "Livestock",
                            "Animal Nutrition",
                            "Animal Reproduction",
                            "Animal Health"
                        ]
                    }
                ]
            },

            "300 Level": {
                "First Semester": [
                    {
                        code: "AGR 301",
                        title: "Crop Production",
                        topics: [
                            "Crop Improvement",
                            "Crop Pests",
                            "Crop Diseases",
                            "Crop Management"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "AGR 302",
                        title: "Agricultural Economics",
                        topics: [
                            "Farm Economics",
                            "Agricultural Markets",
                            "Farm Budgeting",
                            "Agricultural Policy"
                        ]
                    }
                ]
            },

            "400 Level": {
                "First Semester": [
                    {
                        code: "AGR 401",
                        title: "Agricultural Extension",
                        topics: [
                            "Extension Education",
                            "Rural Development",
                            "Communication",
                            "Agricultural Innovation"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "AGR 499",
                        title: "Agriculture Project",
                        topics: [
                            "Research",
                            "Field Work",
                            "Data Collection",
                            "Analysis",
                            "Project Writing"
                        ]
                    }
                ]
            }
        }

    },


    /* =====================================================
       EDUCATION
    ===================================================== */

    "Education": {

        "Educational Management": {

            "100 Level": {
                "First Semester": [
                    {
                        code: "EDM 101",
                        title: "Introduction to Education",
                        topics: [
                            "Meaning of Education",
                            "Aims of Education",
                            "Education and Society",
                            "Nigerian Education System"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "EDM 102",
                        title: "Introduction to Educational Management",
                        topics: [
                            "Educational Administration",
                            "Leadership",
                            "School Management",
                            "Decision Making"
                        ]
                    }
                ]
            },

            "200 Level": {
                "First Semester": [
                    {
                        code: "EDM 201",
                        title: "Educational Psychology",
                        topics: [
                            "Learning",
                            "Motivation",
                            "Memory",
                            "Intelligence",
                            "Development"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "EDM 202",
                        title: "Curriculum Studies",
                        topics: [
                            "Curriculum",
                            "Curriculum Design",
                            "Curriculum Development",
                            "Curriculum Evaluation"
                        ]
                    }
                ]
            },

            "300 Level": {
                "First Semester": [
                    {
                        code: "EDM 301",
                        title: "School Administration",
                        topics: [
                            "School Leadership",
                            "Planning",
                            "Staff Management",
                            "Student Management"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "EDM 302",
                        title: "Educational Planning",
                        topics: [
                            "Education Planning",
                            "Policy",
                            "Resource Allocation",
                            "Educational Development"
                        ]
                    }
                ]
            },

            "400 Level": {
                "First Semester": [
                    {
                        code: "EDM 401",
                        title: "Educational Policy",
                        topics: [
                            "Education Policy",
                            "Policy Analysis",
                            "Education Reform",
                            "Education Governance"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "EDM 499",
                        title: "Education Project",
                        topics: [
                            "Research",
                            "Data Collection",
                            "Analysis",
                            "Academic Writing"
                        ]
                    }
                ]
            }
        }

    },


    /* =====================================================
       MEDICAL & HEALTH SCIENCES
    ===================================================== */

    "Medical & Health Sciences": {

        "Medicine and Surgery": {

            "100 Level": {
                "First Semester": [
                    {
                        code: "MBBS 101",
                        title: "Basic Medical Sciences",
                        topics: [
                            "Introduction to Medicine",
                            "Cell Biology",
                            "Basic Anatomy",
                            "Basic Physiology",
                            "Medical Terminology"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "MBBS 102",
                        title: "Basic Biological Sciences",
                        topics: [
                            "Biochemistry",
                            "Genetics",
                            "Cell Biology",
                            "Human Biology"
                        ]
                    }
                ]
            },

            "200 Level": {
                "First Semester": [
                    {
                        code: "MBBS 201",
                        title: "Human Anatomy",
                        topics: [
                            "Upper Limb",
                            "Lower Limb",
                            "Thorax",
                            "Abdomen",
                            "Head and Neck"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "MBBS 202",
                        title: "Human Physiology",
                        topics: [
                            "Nervous System",
                            "Cardiovascular System",
                            "Respiratory System",
                            "Digestive System",
                            "Renal System"
                        ]
                    }
                ]
            },

            "300 Level": {
                "First Semester": [
                    {
                        code: "MBBS 301",
                        title: "Pathology",
                        topics: [
                            "Disease Processes",
                            "Inflammation",
                            "Cell Injury",
                            "Neoplasia",
                            "Pathological Diagnosis"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "MBBS 302",
                        title: "Pharmacology",
                        topics: [
                            "Drugs",
                            "Pharmacokinetics",
                            "Pharmacodynamics",
                            "Drug Classes",
                            "Drug Safety"
                        ]
                    }
                ]
            },

            "400 Level": {
                "First Semester": [
                    {
                        code: "MBBS 401",
                        title: "Clinical Medicine",
                        topics: [
                            "Clinical Examination",
                            "Diagnosis",
                            "Patient History",
                            "Clinical Reasoning",
                            "Treatment Principles"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "MBBS 402",
                        title: "Clinical Surgery",
                        topics: [
                            "Surgical Principles",
                            "Patient Assessment",
                            "Surgical Conditions",
                            "Perioperative Care"
                        ]
                    }
                ]
            },

            "500 Level": {
                "First Semester": [
                    {
                        code: "MBBS 501",
                        title: "Internal Medicine",
                        topics: [
                            "Cardiology",
                            "Respiratory Medicine",
                            "Gastroenterology",
                            "Neurology",
                            "Endocrinology"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "MBBS 502",
                        title: "Paediatrics and Obstetrics",
                        topics: [
                            "Child Health",
                            "Neonatal Care",
                            "Pregnancy",
                            "Labour",
                            "Maternal Health"
                        ]
                    }
                ]
            },

            "600 Level": {
                "First Semester": [
                    {
                        code: "MBBS 601",
                        title: "Clinical Practice",
                        topics: [
                            "Clinical Rotations",
                            "Patient Care",
                            "Diagnosis",
                            "Treatment",
                            "Professional Practice"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "MBBS 602",
                        title: "Medical Internship Preparation",
                        topics: [
                            "Clinical Practice",
                            "Professional Ethics",
                            "Patient Safety",
                            "Medical Documentation"
                        ]
                    }
                ]
            }
        },


        "Nursing Science": {

            "100 Level": {
                "First Semester": [
                    {
                        code: "NUR 101",
                        title: "Introduction to Nursing",
                        topics: [
                            "Nursing Profession",
                            "History of Nursing",
                            "Nursing Ethics",
                            "Patient Care"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "NUR 102",
                        title: "Human Anatomy and Physiology",
                        topics: [
                            "Cells",
                            "Tissues",
                            "Organs",
                            "Body Systems"
                        ]
                    }
                ]
            },

            "200 Level": {
                "First Semester": [
                    {
                        code: "NUR 201",
                        title: "Fundamentals of Nursing",
                        topics: [
                            "Patient Assessment",
                            "Vital Signs",
                            "Patient Hygiene",
                            "Basic Nursing Procedures"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "NUR 202",
                        title: "Medical Surgical Nursing",
                        topics: [
                            "Patient Care",
                            "Common Diseases",
                            "Nursing Assessment",
                            "Nursing Interventions"
                        ]
                    }
                ]
            },

            "300 Level": {
                "First Semester": [
                    {
                        code: "NUR 301",
                        title: "Community Health Nursing",
                        topics: [
                            "Public Health",
                            "Disease Prevention",
                            "Health Promotion",
                            "Community Assessment"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "NUR 302",
                        title: "Maternal and Child Health",
                        topics: [
                            "Pregnancy",
                            "Antenatal Care",
                            "Childbirth",
                            "Postnatal Care",
                            "Child Health"
                        ]
                    }
                ]
            },

            "400 Level": {
                "First Semester": [
                    {
                        code: "NUR 401",
                        title: "Advanced Nursing Practice",
                        topics: [
                            "Advanced Patient Assessment",
                            "Clinical Decision Making",
                            "Nursing Leadership"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "NUR 499",
                        title: "Nursing Research Project",
                        topics: [
                            "Research Methods",
                            "Data Collection",
                            "Data Analysis",
                            "Academic Writing"
                        ]
                    }
                ]
            }
        }

    },


    /* =====================================================
       LAW
    ===================================================== */

    "Law": {

        "Law": {

            "100 Level": {
                "First Semester": [
                    {
                        code: "LAW 101",
                        title: "Introduction to Law",
                        topics: [
                            "Meaning of Law",
                            "Sources of Nigerian Law",
                            "Legal Systems",
                            "Courts",
                            "Legal Profession"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "LAW 102",
                        title: "Constitutional Law",
                        topics: [
                            "Constitution",
                            "Fundamental Rights",
                            "Separation of Powers",
                            "Federalism",
                            "Rule of Law"
                        ]
                    }
                ]
            },

            "200 Level": {
                "First Semester": [
                    {
                        code: "LAW 201",
                        title: "Criminal Law",
                        topics: [
                            "Crime",
                            "Elements of Crime",
                            "Defences",
                            "Criminal Responsibility",
                            "Punishment"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "LAW 202",
                        title: "Law of Contract",
                        topics: [
                            "Contract",
                            "Offer",
                            "Acceptance",
                            "Consideration",
                            "Capacity",
                            "Breach",
                            "Remedies"
                        ]
                    }
                ]
            },

            "300 Level": {
                "First Semester": [
                    {
                        code: "LAW 301",
                        title: "Law of Torts",
                        topics: [
                            "Negligence",
                            "Trespass",
                            "Nuisance",
                            "Defamation",
                            "Remedies"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "LAW 302",
                        title: "Commercial Law",
                        topics: [
                            "Sale of Goods",
                            "Agency",
                            "Partnership",
                            "Commercial Transactions"
                        ]
                    }
                ]
            },

            "400 Level": {
                "First Semester": [
                    {
                        code: "LAW 401",
                        title: "Company Law",
                        topics: [
                            "Companies",
                            "Incorporation",
                            "Directors",
                            "Shareholders",
                            "Corporate Governance"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "LAW 499",
                        title: "Law Research Project",
                        topics: [
                            "Legal Research",
                            "Case Analysis",
                            "Statutory Interpretation",
                            "Legal Writing"
                        ]
                    }
                ]
            },

            "500 Level": {
                "First Semester": [
                    {
                        code: "LAW 501",
                        title: "Jurisprudence",
                        topics: [
                            "Nature of Law",
                            "Legal Philosophy",
                            "Justice",
                            "Rights",
                            "Legal Interpretation"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "LAW 502",
                        title: "Nigerian Legal Practice",
                        topics: [
                            "Legal Practice",
                            "Professional Ethics",
                            "Court Procedure",
                            "Legal Drafting"
                        ]
                    }
                ]
            }
        }

    },


    /* =====================================================
       ARCHITECTURE & BUILT ENVIRONMENT
    ===================================================== */

    "Architecture & Built Environment": {

        "Architecture": {

            "100 Level": {
                "First Semester": [
                    {
                        code: "ARC 101",
                        title: "Introduction to Architecture",
                        topics: [
                            "Architecture",
                            "Architectural History",
                            "Design Principles",
                            "Space",
                            "Form",
                            "Function"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "ARC 102",
                        title: "Architectural Graphics",
                        topics: [
                            "Technical Drawing",
                            "Perspective",
                            "Orthographic Projection",
                            "Architectural Sketching"
                        ]
                    }
                ]
            },

            "200 Level": {
                "First Semester": [
                    {
                        code: "ARC 201",
                        title: "Architectural Design I",
                        topics: [
                            "Design Process",
                            "Site Analysis",
                            "Space Planning",
                            "Building Form"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "ARC 202",
                        title: "Building Construction",
                        topics: [
                            "Building Materials",
                            "Foundations",
                            "Walls",
                            "Floors",
                            "Roofs"
                        ]
                    }
                ]
            },

            "300 Level": {
                "First Semester": [
                    {
                        code: "ARC 301",
                        title: "Architectural Design II",
                        topics: [
                            "Advanced Design",
                            "Site Planning",
                            "Environmental Design",
                            "Building Systems"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "ARC 302",
                        title: "Environmental Technology",
                        topics: [
                            "Climate",
                            "Natural Ventilation",
                            "Lighting",
                            "Thermal Comfort",
                            "Sustainable Design"
                        ]
                    }
                ]
            },

            "400 Level": {
                "First Semester": [
                    {
                        code: "ARC 401",
                        title: "Advanced Architectural Design",
                        topics: [
                            "Complex Buildings",
                            "Urban Context",
                            "Sustainable Architecture",
                            "Building Technology"
                        ]
                    }
                ],
                "Second Semester": [
                    {
                        code: "ARC 499",
                        title: "Architectural Design Project",
                        topics: [
                            "Research",
                            "Site Analysis",
                            "Concept Development",
                            "Design",
                            "Drawings",
                            "Presentation"
                        ]
                    }
                ]
            }
        }

    }

};


/* =========================================================
   STUDYMIND UNIVERSITY HELPERS
========================================================= */


/**
 * Get all university faculties.
 */
function getUniversityFaculties() {

    return Object.keys(NIGERIAN_UNIVERSITY_COURSES);

}


/**
 * Get degree programmes inside a faculty.
 */
function getUniversityDegrees(faculty) {

    if (!faculty) return [];

    return Object.keys(
        NIGERIAN_UNIVERSITY_COURSES[faculty] || {}
    );

}


/**
 * Get academic levels for a degree.
 */
function getUniversityLevels(faculty, degree) {

    if (
        !faculty ||
        !degree ||
        !NIGERIAN_UNIVERSITY_COURSES[faculty] ||
        !NIGERIAN_UNIVERSITY_COURSES[faculty][degree]
    ) {
        return [];
    }

    return Object.keys(
        NIGERIAN_UNIVERSITY_COURSES[faculty][degree]
    );

}


/**
 * Get semesters for a level.
 */
function getUniversitySemesters(
    faculty,
    degree,
    level
) {

    const data =
        NIGERIAN_UNIVERSITY_COURSES?.[faculty]?.[degree]?.[level];

    if (!data) return [];

    return Object.keys(data);

}


/**
 * Get courses for a semester.
 */
function getUniversityCourses(
    faculty,
    degree,
    level,
    semester
) {

    const data =
        NIGERIAN_UNIVERSITY_COURSES
            ?.[faculty]
            ?.[degree]
            ?.[level]
            ?.[semester];

    return Array.isArray(data) ? data : [];

}


/**
 * Find a specific course.
 */
function findUniversityCourse(
    faculty,
    degree,
    level,
    semester,
    courseCode
) {

    const courses = getUniversityCourses(
        faculty,
        degree,
        level,
        semester
    );

    return courses.find(
        course =>
            course.code.toLowerCase() ===
            String(courseCode).toLowerCase()
    ) || null;

}


/**
 * Get topics for a course.
 */
function getUniversityCourseTopics(
    faculty,
    degree,
    level,
    semester,
    courseCode
) {

    const course = findUniversityCourse(
        faculty,
        degree,
        level,
        semester,
        courseCode
    );

    return course?.topics || [];

}


/**
 * Search university courses.
 */
function searchUniversityCourses(searchTerm) {

    if (!searchTerm) return [];

    const query =
        String(searchTerm)
            .toLowerCase()
            .trim();

    const results = [];

    for (
        const faculty of Object.keys(
            NIGERIAN_UNIVERSITY_COURSES
        )
    ) {

        for (
            const degree of Object.keys(
                NIGERIAN_UNIVERSITY_COURSES[faculty]
            )
        ) {

            const degreeData =
                NIGERIAN_UNIVERSITY_COURSES
                    [faculty]
                    [degree];

            for (
                const level of Object.keys(degreeData)
            ) {

                for (
                    const semester of Object.keys(
                        degreeData[level]
                    )
                ) {

                    const courses =
                        degreeData[level][semester];

                    courses.forEach(course => {

                        const searchableText = [
                            faculty,
                            degree,
                            level,
                            semester,
                            course.code,
                            course.title,
                            ...course.topics
                        ]
                            .join(" ")
                            .toLowerCase();

                        if (
                            searchableText.includes(query)
                        ) {

                            results.push({
                                faculty,
                                degree,
                                level,
                                semester,
                                ...course
                            });

                        }

                    });

                }

            }

        }

    }

    return results;

}


/* =========================================================
   UNIVERSITY PLAN CONVERTER

   Converts a university course into the same general
   topic structure used by StudyMind's study planner.
========================================================= */

function universityCourseToStudyTopics(course) {

    if (!course) return [];

    return (course.topics || []).map(
        (topic, index) => ({

            id:
                `${course.code}-${index + 1}`,

            title: topic,

            courseCode:
                course.code,

            courseTitle:
                course.title,

            completed: false,

            difficulty:
                "medium",

            priority:
                "normal"

        })
    );

}


/* =========================================================
   UNIVERSITY STUDY PLAN BUILDER
========================================================= */

function buildUniversityStudyPlan({

    faculty,
    degree,
    level,
    semester,
    courseCode

}) {

    const course =
        findUniversityCourse(
            faculty,
            degree,
            level,
            semester,
            courseCode
        );

    if (!course) {

        return null;

    }

    return {

        type:
            "university",

        educationLevel:
            "University",

        curriculum:
            "Nigerian University",

        faculty,

        degree,

        level,

        semester,

        courseCode:
            course.code,

        courseTitle:
            course.title,

        topics:
            universityCourseToStudyTopics(course),

        createdAt:
            new Date().toISOString()

    };

}


/* =========================================================
   OPTIONAL FLAT SUBJECT LIST

   Useful for your initial University selector.
========================================================= */

const NIGERIAN_UNIVERSITY_PROGRAMMES = {

    "Computing & Technology": [

        "Computer Science",
        "Software Engineering",
        "Information Technology",
        "Cybersecurity",
        "Artificial Intelligence",
        "Computer Engineering",
        "Information Systems",
        "Data Science",
        "Information and Communication Technology"

    ],

    "Engineering": [

        "Electrical and Electronics Engineering",
        "Mechanical Engineering",
        "Civil Engineering",
        "Chemical Engineering",
        "Petroleum Engineering",
        "Mechatronics Engineering",
        "Biomedical Engineering",
        "Agricultural Engineering",
        "Environmental Engineering",
        "Industrial Engineering",
        "Materials Engineering",
        "Telecommunications Engineering"

    ],

    "Natural Sciences": [

        "Biochemistry",
        "Microbiology",
        "Mathematics",
        "Physics",
        "Chemistry",
        "Statistics",
        "Geology",
        "Botany",
        "Zoology",
        "Environmental Science"

    ],

    "Medical & Health Sciences": [

        "Medicine and Surgery",
        "Nursing Science",
        "Pharmacy",
        "Medical Laboratory Science",
        "Physiotherapy",
        "Radiography",
        "Dentistry",
        "Public Health",
        "Anatomy",
        "Physiology",
        "Nutrition and Dietetics"

    ],

    "Business & Management": [

        "Accounting",
        "Business Administration",
        "Banking and Finance",
        "Marketing",
        "Insurance",
        "Entrepreneurship",
        "Management",
        "Actuarial Science",
        "Human Resource Management"

    ],

    "Social Sciences": [

        "Economics",
        "Political Science",
        "Sociology",
        "Psychology",
        "Mass Communication",
        "International Relations",
        "Geography",
        "Social Work",
        "Criminology",
        "Demography"

    ],

    "Arts & Humanities": [

        "English and Literary Studies",
        "History",
        "Philosophy",
        "Linguistics",
        "Theatre Arts",
        "Music",
        "Religious Studies",
        "Fine Arts",
        "Archaeology",
        "Foreign Languages"

    ],

    "Education": [

        "Educational Management",
        "Guidance and Counselling",
        "Educational Psychology",
        "Curriculum Studies",
        "Science Education",
        "Mathematics Education",
        "English Education",
        "Biology Education",
        "Chemistry Education",
        "Physics Education",
        "Computer Education"

    ],

    "Agriculture": [

        "Agricultural Science",
        "Agricultural Economics",
        "Animal Science",
        "Crop Science",
        "Soil Science",
        "Fisheries",
        "Forestry",
        "Agricultural Extension",
        "Food Science and Technology"

    ],

    "Law": [

        "Law"

    ],

    "Architecture & Built Environment": [

        "Architecture",
        "Quantity Surveying",
        "Building Technology",
        "Estate Management",
        "Urban and Regional Planning",
        "Surveying and Geoinformatics"
    ]

};


/* =========================================================
   UNIVERSITY SEARCH
========================================================= */

function searchUniversityProgrammes(searchTerm) {

    if (!searchTerm) return [];

    const query =
        String(searchTerm)
            .toLowerCase()
            .trim();

    const results = [];

    Object.entries(
        NIGERIAN_UNIVERSITY_PROGRAMMES
    ).forEach(([category, programmes]) => {

        programmes.forEach(programme => {

            if (
                programme
                    .toLowerCase()
                    .includes(query)
                ||
                category
                    .toLowerCase()
                    .includes(query)
            ) {

                results.push({

                    category,

                    programme

                });

            }

        });

    });

    return results;

}


/* =========================================================
   EXPORT / GLOBAL ACCESS

   This makes the database available to other StudyMind
   scripts even if this file is loaded separately.
========================================================= */

if (typeof window !== "undefined") {

    window.NIGERIAN_UNIVERSITY_COURSES =
        NIGERIAN_UNIVERSITY_COURSES;

    window.NIGERIAN_UNIVERSITY_PROGRAMMES =
        NIGERIAN_UNIVERSITY_PROGRAMMES;

    window.getUniversityFaculties =
        getUniversityFaculties;

    window.getUniversityDegrees =
        getUniversityDegrees;

    window.getUniversityLevels =
        getUniversityLevels;

    window.getUniversitySemesters =
        getUniversitySemesters;

    window.getUniversityCourses =
        getUniversityCourses;

    window.findUniversityCourse =
        findUniversityCourse;

    window.getUniversityCourseTopics =
        getUniversityCourseTopics;

    window.searchUniversityCourses =
        searchUniversityCourses;

    window.searchUniversityProgrammes =
        searchUniversityProgrammes;

    window.buildUniversityStudyPlan =
        buildUniversityStudyPlan;

    window.universityCourseToStudyTopics =
        universityCourseToStudyTopics;

}

    /* =====================================================
       OTHER
    ===================================================== */

    "Other": {

        subjects: {

            "Custom Subject": [
                "Custom Topic"
            ]

        }

    }

};


/* =========================================================
   STATE
========================================================= */

const state = {

    curriculum: "",

    selectedSubject: "",

    selections: [],

    exams: [],

    customTopics: []

};


/* =========================================================
   DOM HELPER
========================================================= */

const $ = id =>
    document.getElementById(id);


/* =========================================================
   CURRICULUM INITIALIZATION
========================================================= */

function initializeCurriculum() {

    const curriculum =
        $("curriculum");

    if (!curriculum) return;

    curriculum.addEventListener(
        "change",
        () => {

            state.curriculum =
                curriculum.value;

            state.selectedSubject = "";

            state.selections = [];

            const subjectSearch =
                $("subjectSearch");

            const topicSearch =
                $("topicSearch");

            if (subjectSearch)
                subjectSearch.value = "";

            if (topicSearch)
                topicSearch.value = "";

            renderSubjects();

            $("topicSelector")
                ?.classList.add("hidden");

            updateSelectedItems();

        }
    );

}


/* =========================================================
   SUBJECT DATA
========================================================= */

function getSubjects() {

    return Object.keys(
        CURRICULUMS[
            state.curriculum
        ]?.subjects || {}
    );

}


/* =========================================================
   RENDER SUBJECTS
========================================================= */

function renderSubjects(search = "") {

    const container =
        $("subjectOptions");

    const wrapper =
        $("subjectSelector");

    if (!container || !wrapper) return;

    const subjects =
        getSubjects().filter(
            subject =>
                subject
                    .toLowerCase()
                    .includes(
                        search
                            .toLowerCase()
                            .trim()
                    )
        );

    wrapper.classList.toggle(
        "hidden",
        !state.curriculum
    );

    if (!state.curriculum) {

        container.innerHTML = "";

        return;

    }

    if (!subjects.length) {

        container.innerHTML = `
            <div class="empty-selection">
                No subjects found.
            </div>
        `;

        return;

    }

    container.innerHTML =
        subjects.map(
            subject => {

                const topicCount =
                    CURRICULUMS[
                        state.curriculum
                    ]
                        .subjects[
                            subject
                        ]
                        .length;

                const selectedCount =
                    state.selections.filter(
                        item =>
                            item.subject === subject
                    ).length;

                return `
                    <button
                        type="button"
                        class="selection-card ${
                            state.selectedSubject === subject
                                ? "selected"
                                : ""
                        }"
                        data-subject="${escapeAttribute(subject)}"
                    >

                        <strong>
                            ${escapeHTML(subject)}
                        </strong>

                        <span>
                            ${topicCount} topics
                            ${
                                selectedCount
                                    ? ` • ${selectedCount} selected`
                                    : ""
                            }
                        </span>

                    </button>
                `;

            }
        ).join("");

    container
        .querySelectorAll(
            "[data-subject]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    state.selectedSubject =
                        button.dataset.subject;

                    renderSubjects(
                        $("subjectSearch")
                            ?.value || ""
                    );

                    renderTopics();

                }
            );

        });

}


/* =========================================================
   TOPICS
========================================================= */

function renderTopics(search = "") {

    const selector =
        $("topicSelector");

    const container =
        $("topicOptions");

    const label =
        $("selectedSubjectLabel");

    if (
        !selector ||
        !container ||
        !state.selectedSubject
    ) {

        return;

    }

    selector.classList.remove(
        "hidden"
    );

    if (label) {

        label.textContent =
            `${state.selectedSubject} • ${state.curriculum}`;

    }

    const topics =
        CURRICULUMS[
            state.curriculum
        ]?.subjects[
            state.selectedSubject
        ] || [];

    const filtered =
        topics.filter(
            topic =>
                topic
                    .toLowerCase()
                    .includes(
                        search
                            .toLowerCase()
                            .trim()
                    )
        );

    if (!filtered.length) {

        container.innerHTML = `
            <div class="empty-selection">
                No topics found.
            </div>
        `;

        return;

    }

    container.innerHTML =
        filtered.map(
            topic => {

                const selected =
                    state.selections.some(
                        item =>
                            item.subject ===
                                state.selectedSubject &&
                            item.topic ===
                                topic
                    );

                return `
                    <button
                        type="button"
                        class="selection-card topic-card ${
                            selected
                                ? "selected"
                                : ""
                        }"
                        data-topic="${escapeAttribute(topic)}"
                    >

                        <span class="topic-check">
                            ${
                                selected
                                    ? "✓"
                                    : ""
                            }
                        </span>

                        <strong>
                            ${escapeHTML(topic)}
                        </strong>

                    </button>
                `;

            }
        ).join("");

    container
        .querySelectorAll(
            "[data-topic]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    toggleTopic(
                        state.selectedSubject,
                        button.dataset.topic
                    );

                }
            );

        });

}


/* =========================================================
   TOPIC TOGGLE
========================================================= */

function toggleTopic(
    subject,
    topic
) {

    const index =
        state.selections.findIndex(
            item =>
                item.subject === subject &&
                item.topic === topic
        );

    if (index >= 0) {

        state.selections.splice(
            index,
            1
        );

    } else {

        state.selections.push({

            subject,

            topic,

            custom: false

        });

    }

    renderTopics(
        $("topicSearch")
            ?.value || ""
    );

    renderSubjects(
        $("subjectSearch")
            ?.value || ""
    );

    updateSelectedItems();

}


/* =========================================================
   CUSTOM TOPICS
========================================================= */

function initializeCustomTopics() {

    $("customTopicButton")
        ?.addEventListener(
            "click",
            () => {

                $("customTopicBox")
                    ?.classList.toggle(
                        "hidden"
                    );

            }
        );

    $("addCustomTopic")
        ?.addEventListener(
            "click",
            addCustomTopic
        );

}


function addCustomTopic() {

    const subject =
        $("customSubject")
            ?.value
            .trim();

    const topic =
        $("customTopic")
            ?.value
            .trim();

    if (!subject || !topic) {

        alert(
            "Please enter both the subject and topic."
        );

        return;

    }

    state.selections.push({

        subject,

        topic,

        custom: true

    });

    state.customTopics.push({

        subject,

        topic

    });

    $("customSubject").value = "";

    $("customTopic").value = "";

    updateSelectedItems();

    renderSubjects(
        $("subjectSearch")
            ?.value || ""
    );

}


/* =========================================================
   SELECTED ITEMS
========================================================= */

function updateSelectedItems() {

    const container =
        $("selectedItems");

    if (!container) return;

    if (!state.selections.length) {

        container.classList.add(
            "hidden"
        );

        container.innerHTML = "";

        return;

    }

    container.classList.remove(
        "hidden"
    );

    container.innerHTML = `

        <div class="selected-header">

            <strong>
                Selected Topics
            </strong>

            <span>
                ${state.selections.length}
            </span>

        </div>

        <div class="selected-tags">

            ${state.selections.map(
                (item, index) => `

                    <button
                        type="button"
                        class="selected-tag"
                        data-remove="${index}"
                    >

                        ${escapeHTML(
                            item.subject
                        )}

                        —

                        ${escapeHTML(
                            item.topic
                        )}

                        ${
                            item.custom
                                ? `
                                    <small>
                                        Custom
                                    </small>
                                `
                                : ""
                        }

                        <span>
                            ×
                        </span>

                    </button>

                `
            ).join("")}

        </div>

    `;

    container
        .querySelectorAll(
            "[data-remove]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    state.selections.splice(
                        Number(
                            button.dataset.remove
                        ),
                        1
                    );

                    updateSelectedItems();

                    renderSubjects(
                        $("subjectSearch")
                            ?.value || ""
                    );

                    renderTopics(
                        $("topicSearch")
                            ?.value || ""
                    );

                }
            );

        });

}


/* =========================================================
   EXAMS
========================================================= */

function initializeExams() {

    renderExamList();

    $("addExam")
        ?.addEventListener(
            "click",
            () => {

                state.exams.push({

                    name: "",

                    date: ""

                });

                renderExamList();

            }
        );

}


function collectExams() {

    const cards =
        document.querySelectorAll(
            ".exam-card"
        );

    return Array.from(cards)

        .map(card => ({

            name:
                card
                    .querySelector(
                        ".exam-name"
                    )
                    ?.value
                    .trim(),

            date:
                card
                    .querySelector(
                        ".exam-date"
                    )
                    ?.value

        }))

        .filter(
            exam =>
                exam.name &&
                exam.date
        );

}


function renderExamList() {

    const list =
        $("examList");

    if (!list) return;

    if (!state.exams.length) {

        state.exams.push({

            name: "",

            date: ""

        });

    }

    list.innerHTML =
        state.exams.map(
            (exam, index) => `

                <div class="exam-card">

                    <div class="form-grid">

                        <div class="form-group">

                            <label>
                                Exam / Test
                            </label>

                            <input
                                class="exam-name"
                                type="text"
                                value="${escapeAttribute(
                                    exam.name
                                )}"
                                placeholder="e.g. WAEC Mathematics"
                                required
                            >

                        </div>

                        <div class="form-group">

                            <label>
                                Exam Date
                            </label>

                            <input
                                class="exam-date"
                                type="date"
                                value="${escapeAttribute(
                                    exam.date
                                )}"
                                required
                            >

                        </div>

                    </div>

                    ${
                        index > 0
                            ? `
                                <button
                                    type="button"
                                    class="remove-exam"
                                    data-remove-exam="${index}"
                                    aria-label="Remove exam"
                                >
                                    ×
                                </button>
                            `
                            : ""
                    }

                </div>

            `
        ).join("");

    list
        .querySelectorAll(
            "[data-remove-exam]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    state.exams.splice(
                        Number(
                            button.dataset.removeExam
                        ),
                        1
                    );

                    renderExamList();

                }
            );

        });

}


/* =========================================================
   AI PLANNER
========================================================= */

async function generateStudyPlan(event) {

    event.preventDefault();

    const button =
        $("generateButton");

    const curriculum =
        $("curriculum")
            ?.value;

    const studyHours =
        Number(
            $("studyHours")
                ?.value
        );

    const difficulty =
        $("difficulty")
            ?.value ||
        "balanced";

    const goal =
        $("studyGoal")
            ?.value
            .trim() ||
        "";

    const notifications =
        Boolean(
            $("notifications")
                ?.checked
        );

    const exams =
        collectExams();


    if (!curriculum) {

        alert(
            "Please select a curriculum."
        );

        return;

    }


    if (!state.selections.length) {

        alert(
            "Please select at least one topic."
        );

        return;

    }


    if (!exams.length) {

        alert(
            "Please add at least one exam."
        );

        return;

    }


    if (!studyHours) {

        alert(
            "Please select your available study time."
        );

        return;

    }


    button.disabled = true;

    button.innerHTML =
        "<span>🤖 StudyMind AI is building your plan...</span>";


    const payload = {

        curriculum,

        selections:
            state.selections,

        exams,

        studyHours,

        difficulty,

        goal,

        notifications,

        preferences: {

            minimumSessionMinutes: 25,

            preferredSessionLengths: [
                25,
                45,
                60
            ],

            intelligentBreaks: true,

            intelligentRestDays: true,

            adaptiveRevision: true,

            examPrioritization: true

        }

    };


    try {

        const response =
            await fetch(
                "/api/generate-study-plan",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            payload
                        )

                }
            );


        if (!response.ok) {

            const error =
                await safeJSON(
                    response
                );

            throw new Error(

                error?.error ||

                "The AI planner could not generate your plan."

            );

        }


        const result =
            await response.json();


        if (
            !result ||
            !result.plan
        ) {

            throw new Error(
                "The AI returned an invalid study plan."
            );

        }


        const plan =
            normalizePlan(
                result.plan
            );


        savePlan(plan);


        if (
            notifications &&
            "Notification" in window &&
            Notification.permission ===
                "default"
        ) {

            try {

                await Notification.requestPermission();

            } catch {}

        }


        window.location.href =
            "dashboard.html";


    } catch (error) {

        console.error(
            "StudyMind planner error:",
            error
        );

        alert(
            error.message ||
            "Something went wrong while generating your plan."
        );

        button.disabled = false;

        button.innerHTML =
            "<span>Generate My AI Study Plan</span>";

    }

}


/* =========================================================
   PLAN NORMALIZATION
========================================================= */

function normalizePlan(plan) {

    const topics =
        Array.isArray(
            plan.topics
        )
            ? plan.topics
            : state.selections.map(
                (item, index) => ({

                    id:
                        `topic-${index + 1}`,

                    subject:
                        item.subject,

                    name:
                        item.topic,

                    custom:
                        Boolean(
                            item.custom
                        ),

                    completed:
                        false,

                    priority:
                        "normal",

                    mastery:
                        0

                })
            );


    const subjects =
        plan.subjects &&
        Array.isArray(
            plan.subjects
        )
            ? plan.subjects
            : unique(
                topics.map(
                    topic =>
                        topic.subject
                )
            );


    return {

        id:
            plan.id ||
            generateID(),

        version:
            3,

        curriculum:
            plan.curriculum ||
            state.curriculum,

        subjects,

        subjectNames:
            subjects,

        topics,

        exams:
            plan.exams ||
            collectExams(),

        studyHours:
            Number(
                plan.studyHours ||
                $("studyHours")
                    ?.value ||
                1
            ),

        hoursPerDay:
            Number(
                plan.hoursPerDay ||
                plan.studyHours ||
                $("studyHours")
                    ?.value ||
                1
            ),

        difficulty:
            plan.difficulty ||
            $("difficulty")
                ?.value ||
            "balanced",

        goal:
            plan.goal ||
            $("studyGoal")
                ?.value ||
            "",

        notifications:
            Boolean(
                plan.notifications ??
                $("notifications")
                    ?.checked
            ),

        schedule:
            Array.isArray(
                plan.schedule
            )
                ? plan.schedule
                : [],

        timetableData:
            plan.timetableData ||
            plan.schedule ||
            [],

        generatedBy:
            "StudyMind AI",

        createdAt:
            plan.createdAt ||
            new Date().toISOString(),

        progress: {

            completedTopics:
                Number(
                    plan.progress
                        ?.completedTopics ||
                    0
                ),

            totalTopics:
                topics.length,

            studyMinutes:
                Number(
                    plan.progress
                        ?.studyMinutes ||
                    0
                ),

            sessions:
                Number(
                    plan.progress
                        ?.sessions ||
                    0
                )

        },

        streak:
            Number(
                plan.streak ||
                0
            ),

        studyScore:
            Number(
                plan.studyScore ||
                0
            )

    };

}


/* =========================================================
   SAVE PLAN
========================================================= */

function savePlan(plan) {

    localStorage.setItem(
        "studyMindPlan",
        JSON.stringify(plan)
    );

    localStorage.setItem(
        "studyData",
        JSON.stringify(plan)
    );


    let plans = [];

    try {

        plans =
            JSON.parse(
                localStorage.getItem(
                    "studyMindPlans"
                ) || "[]"
            );

        if (!Array.isArray(plans)) {

            plans = [];

        }

    } catch {

        plans = [];

    }


    const existing =
        plans.findIndex(
            item =>
                item.id === plan.id
        );


    if (existing >= 0) {

        plans[existing] =
            plan;

    } else {

        plans.push(plan);

    }


    localStorage.setItem(
        "studyMindPlans",
        JSON.stringify(plans)
    );

    localStorage.setItem(
        "studyMindActivePlanId",
        plan.id
    );

}


/* =========================================================
   SEARCH
========================================================= */

function initializeSearch() {

    $("subjectSearch")
        ?.addEventListener(
            "input",
            event => {

                renderSubjects(
                    event.target.value
                );

            }
        );


    $("topicSearch")
        ?.addEventListener(
            "input",
            event => {

                renderTopics(
                    event.target.value
                );

            }
        );

}


/* =========================================================
   THEME
========================================================= */

function initializeTheme() {

    const button =
        $("themeButton");

    const saved =
        localStorage.getItem(
            "studyMindTheme"
        );


    if (saved === "light") {

        document.body.classList.add(
            "light-mode"
        );

    }


    updateThemeButton();


    button?.addEventListener(
        "click",
        () => {

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

            updateThemeButton();

        }
    );

}


function updateThemeButton() {

    const button =
        $("themeButton");

    if (!button) return;

    const light =
        document.body.classList.contains(
            "light-mode"
        );

    button.textContent =
        light
            ? "☀️"
            : "🌙";

}


/* =========================================================
   START BUTTON
========================================================= */

function initializeStartButton() {

    $("startButton")
        ?.addEventListener(
            "click",
            () => {

                document
                    .getElementById(
                        "generator"
                    )
                    ?.scrollIntoView({

                        behavior:
                            "smooth"

                    });

            }
        );

}


/* =========================================================
   DATE SAFETY
========================================================= */

function initializeExamDateMinimum() {

    const today =
        new Date();

    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            today.getDate()
        ).padStart(
            2,
            "0"
        );

    const minimum =
        `${year}-${month}-${day}`;

    document
        .querySelectorAll(
            ".exam-date"
        )
        .forEach(
            input => {

                input.min =
                    minimum;

            }
        );

}


/* =========================================================
   HELPERS
========================================================= */

function unique(array) {

    return [
        ...new Set(
            array.filter(Boolean)
        )
    ];

}


function generateID() {

    if (
        window.crypto &&
        typeof window.crypto.randomUUID ===
            "function"
    ) {

        return window.crypto.randomUUID();

    }

    return `plan-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`;

}


function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


function escapeAttribute(value) {

    return escapeHTML(
        value || ""
    );

}


async function safeJSON(response) {

    try {

        return await response.json();

    } catch {

        return null;

    }

}


/* =========================================================
   EXPOSE DATABASE
   Useful for Dashboard / debugging / future AI tools
========================================================= */

window.StudyMindCurriculums =
    CURRICULUMS;


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeTheme();

        initializeStartButton();

        initializeCurriculum();

        initializeSearch();

        initializeCustomTopics();

        initializeExams();

        initializeExamDateMinimum();

        const form =
            $("studyForm");

        form?.addEventListener(
            "submit",
            generateStudyPlan
        );

    }
);
