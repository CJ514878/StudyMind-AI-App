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
    ===================================================== */

    "Nigerian Senior Secondary Curriculum": {

        subjects: {

            "Mathematics": [
                "Number and Numeration",
                "Number Bases",
                "Fractions",
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
                "Transportation",
                "Trade",
                "Environmental Problems",
                "Natural Resources",
                "Regional Geography of Nigeria",
                "West Africa",
                "Africa"
            ],

            "Agricultural Science": [
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

            "Computer Science": [
                "Computer Fundamentals",
                "Data Representation",
                "Number Systems",
                "Boolean Algebra",
                "Logic Gates",
                "Computer Architecture",
                "CPU",
                "Memory",
                "Storage",
                "Operating Systems",
                "Algorithms",
                "Flowcharts",
                "Pseudocode",
                "Programming Fundamentals",
                "Variables",
                "Data Types",
                "Operators",
                "Conditions",
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
                "Software Development"
            ],

            "Economics and Commerce": [
                "Trade",
                "Commerce",
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
                "Entrepreneurship"
            ],

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

            "Civic Education": [
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
                "International Organizations"
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

            "Islamic Religious Studies": [
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
            ]

        }

    },


    /* =====================================================
       WAEC
    ===================================================== */

    "WAEC": {

        subjects: {

            "English Language": [
                "Comprehension",
                "Summary",
                "Lexis and Structure",
                "Grammar",
                "Sentence Structure",
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

            "Physics": [
                "Measurement",
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
                "Redox",
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
                "Cell Biology",
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
                "Food Webs",
                "Population",
                "Conservation"
            ],

            "Further Mathematics": [
                "Sets",
                "Functions",
                "Logic",
                "Matrices",
                "Vectors",
                "Complex Numbers",
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
                "Mechanics",
                "Kinematics",
                "Dynamics",
                "Linear Programming"
            ],

            "Economics": [
                "Basic Economic Concepts",
                "Production",
                "Demand",
                "Supply",
                "Elasticity",
                "Price Determination",
                "Market Structures",
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
                "Industrialization"
            ],

            "Government": [
                "Political Concepts",
                "Constitution",
                "Rule of Law",
                "Separation of Powers",
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
                "United Nations",
                "African Union",
                "ECOWAS",
                "Political Development in Nigeria"
            ],

            "Geography": [
                "Map Reading",
                "Scale",
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
                "Natural Resources",
                "Regional Geography of Nigeria",
                "West Africa"
            ],

            "Agricultural Science": [
                "Agriculture",
                "Farm Management",
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
                "Wildlife",
                "Agricultural Economics",
                "Agricultural Marketing"
            ],

            "Accounting": [
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

            "Literature in English": [
                "Poetry",
                "Prose",
                "Drama",
                "Literary Devices",
                "Characterization",
                "Plot",
                "Setting",
                "Theme",
                "Conflict",
                "Narrative Technique",
                "Point of View",
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
                "Computer Networks",
                "Internet",
                "Algorithms",
                "Flowcharts",
                "Programming",
                "Cybersecurity"
            ],

            "Civic Education": [
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
                "National Integration"
            ],

            "Christian Religious Studies": [
                "Creation",
                "Patriarchs",
                "Moses",
                "Exodus",
                "Covenant",
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
