/* =========================================================
   STUDYMIND AI — COMPUTER BATTLE
   FULL REPLACEMENT

   10 QUESTIONS
   15 SECONDS PER QUESTION

   Features:
   - Expanded Nigerian curriculum
   - Study-plan subjects merged with curriculum
   - Subject-specific topics
   - AI question generation
   - Reliable fallback questions
   - Supabase authentication
   - Battle scoring
   - Battle Points
   - Leaderboard updates
   - Free battle limit compatibility
========================================================= */

const QUESTIONS_PER_BATTLE = 10;
const QUESTION_TIME_LIMIT = 15;

const AI_QUESTION_ENDPOINT =
    "/api/generate-questions";


/* =========================================================
   EXPANDED NIGERIAN CURRICULUM
========================================================= */

/*
   These are curriculum-aligned topic groupings for the
   Computer Battle subject/topic selector.

   They are intentionally organized as practical study
   topics rather than reproducing an official curriculum
   document verbatim.
*/

const NIGERIAN_CURRICULUM = {

    /* =====================================================
       CORE / MATHEMATICS
    ===================================================== */

    Mathematics: [
        "Number and Numeration",
        "Fractions Decimals and Percentages",
        "Ratio Proportion and Rates",
        "Indices",
        "Logarithms",
        "Surds",
        "Algebraic Expressions",
        "Factorization",
        "Linear Equations",
        "Quadratic Equations",
        "Simultaneous Equations",
        "Inequalities",
        "Sequences and Series",
        "Variation",
        "Sets",
        "Functions",
        "Geometry",
        "Mensuration",
        "Angles",
        "Triangles",
        "Polygons",
        "Circles",
        "Coordinate Geometry",
        "Trigonometry",
        "Vectors",
        "Matrices",
        "Statistics",
        "Data Representation",
        "Probability",
        "Permutations and Combinations",
        "Financial Mathematics",
        "Commercial Arithmetic",
        "Calculus",
        "Differentiation",
        "Integration"
    ],

    "English Language": [
        "Grammar",
        "Parts of Speech",
        "Nouns",
        "Pronouns",
        "Verbs",
        "Adjectives",
        "Adverbs",
        "Prepositions",
        "Conjunctions",
        "Sentence Structure",
        "Phrases and Clauses",
        "Subject Verb Agreement",
        "Tenses",
        "Active and Passive Voice",
        "Direct and Indirect Speech",
        "Question Tags",
        "Vocabulary Development",
        "Synonyms and Antonyms",
        "Comprehension",
        "Summary Writing",
        "Oral English",
        "Speech Sounds",
        "Word Stress",
        "Intonation",
        "Figures of Speech",
        "Essay Writing",
        "Letter Writing",
        "Article Writing",
        "Report Writing",
        "Argumentative Writing",
        "Narrative Writing",
        "Descriptive Writing",
        "Formal and Informal Writing"
    ],

    "Digital Technologies": [
        "Digital Literacy",
        "Computer Fundamentals",
        "Computer Hardware",
        "Computer Software",
        "Operating Systems",
        "Data Representation",
        "Information Processing",
        "Algorithms",
        "Flowcharts",
        "Programming Concepts",
        "Web Technologies",
        "Databases",
        "Computer Networks",
        "Internet Technologies",
        "Cybersecurity Awareness",
        "Digital Communication",
        "Artificial Intelligence",
        "Emerging Technologies"
    ],

    /* =====================================================
       SCIENCE
    ===================================================== */

    Physics: [
        "Measurements",
        "Physical Quantities",
        "Units and Dimensions",
        "Scalars and Vectors",
        "Motion",
        "Distance and Displacement",
        "Speed and Velocity",
        "Acceleration",
        "Graphs of Motion",
        "Forces",
        "Newton's Laws of Motion",
        "Momentum",
        "Work Energy and Power",
        "Machines",
        "Pressure",
        "Elasticity",
        "Gravitation",
        "Heat",
        "Temperature",
        "Thermal Expansion",
        "Heat Transfer",
        "Gas Laws",
        "Waves",
        "Sound",
        "Light",
        "Reflection",
        "Refraction",
        "Lenses",
        "Electricity",
        "Current Electricity",
        "Electrical Circuits",
        "Resistance",
        "Electrical Energy",
        "Magnetism",
        "Electromagnetic Induction",
        "Alternating Current",
        "Electromagnetic Waves",
        "Atomic Physics",
        "Nuclear Physics",
        "Radioactivity",
        "Semiconductors"
    ],

    Chemistry: [
        "Matter",
        "Separation Techniques",
        "Atomic Structure",
        "Isotopes",
        "Electronic Configuration",
        "Periodic Table",
        "Periodic Trends",
        "Chemical Bonding",
        "Ionic Bonding",
        "Covalent Bonding",
        "Metallic Bonding",
        "Mole Concept",
        "Chemical Formulae",
        "Chemical Equations",
        "Chemical Reactions",
        "Acids Bases and Salts",
        "pH Scale",
        "Oxidation and Reduction",
        "Redox Reactions",
        "Electrochemistry",
        "Rates of Reaction",
        "Chemical Equilibrium",
        "Solubility",
        "Organic Chemistry",
        "Hydrocarbons",
        "Alkanes",
        "Alkenes",
        "Alkynes",
        "Alcohols",
        "Carboxylic Acids",
        "Esters",
        "Polymers",
        "Metals",
        "Extraction of Metals",
        "Water Chemistry",
        "Air and Atmospheric Chemistry",
        "Environmental Chemistry"
    ],

    Biology: [
        "Characteristics of Living Things",
        "Cell Structure",
        "Cell Organization",
        "Cell Division",
        "Biological Molecules",
        "Nutrition",
        "Photosynthesis",
        "Respiration",
        "Transport in Plants",
        "Transport in Animals",
        "Support and Movement",
        "Excretion",
        "Homeostasis",
        "Coordination",
        "Nervous System",
        "Endocrine System",
        "Sense Organs",
        "Reproduction",
        "Asexual Reproduction",
        "Sexual Reproduction",
        "Human Reproduction",
        "Growth and Development",
        "Genetics",
        "Variation",
        "Evolution",
        "Ecology",
        "Food Chains",
        "Food Webs",
        "Population Studies",
        "Habitats",
        "Adaptation",
        "Conservation",
        "Microorganisms",
        "Diseases",
        "Immunity",
        "Classification of Living Organisms"
    ],

    "Further Mathematics": [
        "Sets",
        "Logic",
        "Algebra",
        "Polynomials",
        "Functions",
        "Sequences and Series",
        "Binomial Expansion",
        "Matrices",
        "Determinants",
        "Vectors",
        "Complex Numbers",
        "Coordinate Geometry",
        "Conic Sections",
        "Trigonometry",
        "Differentiation",
        "Applications of Differentiation",
        "Integration",
        "Applications of Integration",
        "Differential Equations",
        "Permutations and Combinations",
        "Probability",
        "Statistics",
        "Mechanics",
        "Kinematics",
        "Dynamics"
    ],

    "Agricultural Science": [
        "Agriculture and Its Importance",
        "Farm Management",
        "Farm Records",
        "Agricultural Economics",
        "Farm Tools",
        "Farm Machinery",
        "Soil Formation",
        "Soil Properties",
        "Soil Fertility",
        "Soil Conservation",
        "Crop Production",
        "Crop Improvement",
        "Crop Propagation",
        "Planting Operations",
        "Crop Harvesting",
        "Crop Storage",
        "Crop Pests",
        "Crop Diseases",
        "Animal Production",
        "Animal Nutrition",
        "Animal Health",
        "Animal Breeding",
        "Livestock Management",
        "Fisheries",
        "Forestry",
        "Agricultural Extension",
        "Agricultural Marketing",
        "Agricultural Cooperatives"
    ],

    "Physical Education": [
        "Physical Fitness",
        "Components of Fitness",
        "Health Related Fitness",
        "Athletics",
        "Track Events",
        "Field Events",
        "Football",
        "Basketball",
        "Volleyball",
        "Handball",
        "Tennis",
        "Swimming",
        "Gymnastics",
        "First Aid",
        "Sports Injuries",
        "Nutrition and Exercise",
        "Personal Hygiene",
        "Recreation"
    ],

    "Health Education": [
        "Personal Health",
        "Community Health",
        "Environmental Health",
        "Nutrition",
        "Balanced Diet",
        "Personal Hygiene",
        "Mental and Social Wellbeing",
        "Communicable Diseases",
        "Non Communicable Diseases",
        "Disease Prevention",
        "First Aid",
        "Safety Education",
        "Substance Abuse Prevention",
        "Family Health",
        "Consumer Health",
        "Health Services"
    ],

    "Foods and Nutrition": [
        "Food Nutrients",
        "Carbohydrates",
        "Proteins",
        "Fats and Oils",
        "Vitamins",
        "Minerals",
        "Water",
        "Balanced Diet",
        "Meal Planning",
        "Food Preparation",
        "Food Preservation",
        "Food Storage",
        "Food Hygiene",
        "Food Safety",
        "Kitchen Equipment",
        "Special Diets",
        "Nutrition Deficiency Diseases"
    ],

    "Geography": [
        "Map Reading",
        "Scale and Distance",
        "Direction and Bearing",
        "Grid References",
        "Physical Geography",
        "Landforms",
        "Rocks",
        "Weathering",
        "Soils",
        "Weather and Climate",
        "Climate Classification",
        "Water Bodies",
        "Drainage",
        "Vegetation",
        "Population",
        "Population Distribution",
        "Migration",
        "Settlement",
        "Urbanization",
        "Agriculture",
        "Mining",
        "Industry",
        "Transportation",
        "Communication",
        "Tourism",
        "Environmental Resources",
        "Environmental Hazards",
        "Regional Geography",
        "Nigeria's Geography"
    ],

    "Technical Drawing": [
        "Drawing Instruments",
        "Geometric Construction",
        "Lines and Angles",
        "Plane Geometry",
        "Scale Drawing",
        "Orthographic Projection",
        "Isometric Drawing",
        "Oblique Drawing",
        "Perspective Drawing",
        "Sectional Views",
        "Auxiliary Views",
        "Development of Surfaces",
        "Building Drawing",
        "Machine Drawing",
        "Electrical Drawing",
        "Freehand Sketching"
    ],

    /* =====================================================
       HUMANITIES
    ===================================================== */

    Government: [
        "Political Concepts",
        "State and Nation",
        "Power and Authority",
        "Sovereignty",
        "Political Socialization",
        "Political Participation",
        "Constitution",
        "Constitutionalism",
        "Democracy",
        "Rule of Law",
        "Human Rights",
        "Political Parties",
        "Pressure Groups",
        "Elections",
        "Electoral Systems",
        "Electoral Bodies",
        "Legislature",
        "Executive",
        "Judiciary",
        "Separation of Powers",
        "Checks and Balances",
        "Local Government",
        "Public Administration",
        "Civil Service",
        "Federalism",
        "Unitary Government",
        "Confederation",
        "Military Rule",
        "International Relations",
        "International Organizations",
        "African Union",
        "United Nations",
        "ECOWAS",
        "Nigeria's Political Development"
    ],

    "Nigerian History": [
        "Precolonial Nigerian Societies",
        "Hausa States",
        "Kanem Borno",
        "Oyo Empire",
        "Benin Kingdom",
        "Igbo Society",
        "Niger Delta States",
        "Trans Saharan Trade",
        "European Contact",
        "Christian Missionaries",
        "Colonial Administration",
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
        "Constitutional Development",
        "Economic Development",
        "Foreign Relations"
    ],

    "Christian Religious Studies": [
        "Creation",
        "The Fall of Man",
        "The Patriarchs",
        "Abraham",
        "Isaac",
        "Jacob",
        "Joseph",
        "Moses",
        "The Exodus",
        "The Ten Commandments",
        "The Prophets",
        "The Life of Jesus",
        "Birth of Jesus",
        "Baptism of Jesus",
        "Miracles of Jesus",
        "Parables of Jesus",
        "Teachings of Jesus",
        "Death and Resurrection",
        "The Early Church",
        "Paul's Ministry",
        "Christian Ethics",
        "Faith",
        "Love",
        "Forgiveness",
        "Justice",
        "Peace",
        "Leadership",
        "Christian Family Life"
    ],

    "Islamic Religious Studies": [
        "Quran",
        "Revelation",
        "Hadith",
        "Tawhid",
        "Shahadah",
        "Salah",
        "Zakat",
        "Sawm",
        "Hajj",
        "Prophet Muhammad",
        "Life in Makkah",
        "Hijrah",
        "Life in Madinah",
        "Islamic Ethics",
        "Family Life",
        "Islamic Law",
        "Islamic History",
        "Islamic Civilization",
        "Social Justice",
        "Peace and Tolerance"
    ],

    "Literature in English": [
        "Prose",
        "Poetry",
        "Drama",
        "Literary Devices",
        "Figures of Speech",
        "Characterization",
        "Plot",
        "Themes",
        "Setting",
        "Narrative Techniques",
        "Point of View",
        "Conflict",
        "Symbolism",
        "Irony",
        "Imagery",
        "Tone",
        "Mood",
        "Tragedy",
        "Comedy",
        "African Literature",
        "Nigerian Literature"
    ],

    Literature: [
        "Prose",
        "Poetry",
        "Drama",
        "Literary Devices",
        "Characterization",
        "Plot",
        "Themes",
        "Setting",
        "Narrative Techniques",
        "Symbolism",
        "Irony",
        "Imagery",
        "African Literature",
        "Nigerian Literature"
    ],

    French: [
        "Greetings",
        "Introductions",
        "Family",
        "School",
        "Numbers",
        "Days and Months",
        "Time",
        "Food",
        "Shopping",
        "Travel",
        "Directions",
        "Weather",
        "Grammar",
        "Nouns and Articles",
        "Adjectives",
        "Pronouns",
        "Verbs",
        "Tenses",
        "Vocabulary",
        "Reading Comprehension",
        "Writing"
    ],

    Arabic: [
        "Arabic Alphabet",
        "Pronunciation",
        "Vocabulary",
        "Greetings",
        "Family",
        "Numbers",
        "Grammar",
        "Nouns",
        "Pronouns",
        "Verbs",
        "Sentence Structure",
        "Reading",
        "Writing",
        "Comprehension",
        "Islamic Terminology"
    ],

    "Visual Arts": [
        "Drawing",
        "Painting",
        "Sculpture",
        "Graphics",
        "Textiles",
        "Ceramics",
        "Printmaking",
        "Photography",
        "Art History",
        "Design Principles",
        "Colour Theory",
        "Perspective",
        "African Art",
        "Nigerian Art",
        "Traditional Crafts"
    ],

    Music: [
        "Elements of Music",
        "Musical Notation",
        "Scales",
        "Intervals",
        "Rhythm",
        "Melody",
        "Harmony",
        "Chords",
        "Musical Instruments",
        "Voice",
        "African Music",
        "Nigerian Music",
        "Music History",
        "Composition",
        "Performance"
    ],

    "Home Management": [
        "Family",
        "Home Management",
        "Decision Making",
        "Resource Management",
        "Food Management",
        "Clothing",
        "Textiles",
        "Interior Decoration",
        "Household Equipment",
        "Consumer Education",
        "Budgeting",
        "Personal Finance",
        "Family Health",
        "Child Development",
        "Home Safety"
    ],

    "Catering Craft": [
        "Kitchen Safety",
        "Kitchen Equipment",
        "Food Hygiene",
        "Food Safety",
        "Menu Planning",
        "Meal Planning",
        "Food Preparation",
        "Cooking Methods",
        "Baking",
        "Pastry",
        "Food Preservation",
        "Table Setting",
        "Restaurant Service",
        "Catering Management",
        "Costing",
        "Customer Service"
    ],

    /* =====================================================
       BUSINESS
    ===================================================== */

    Accounting: [
        "Introduction to Accounting",
        "Accounting Concepts",
        "Accounting Principles",
        "Accounting Equation",
        "Source Documents",
        "Books of Original Entry",
        "Cash Book",
        "Petty Cash Book",
        "Ledger Accounts",
        "Trial Balance",
        "Bank Reconciliation",
        "Correction of Errors",
        "Depreciation",
        "Control Accounts",
        "Final Accounts",
        "Trading Account",
        "Profit and Loss Account",
        "Balance Sheet",
        "Partnership Accounts",
        "Company Accounts",
        "Manufacturing Accounts",
        "Incomplete Records"
    ],

    Commerce: [
        "Trade",
        "Occupation",
        "Production",
        "Business Units",
        "Sole Proprietorship",
        "Partnership",
        "Companies",
        "Cooperatives",
        "Retail Trade",
        "Wholesale Trade",
        "Transportation",
        "Communication",
        "Warehousing",
        "Insurance",
        "Banking",
        "Stock Exchange",
        "Marketing",
        "Advertising",
        "Consumer Protection",
        "International Trade"
    ],

    Economics: [
        "Basic Economic Concepts",
        "Scarcity",
        "Choice and Opportunity Cost",
        "Production",
        "Factors of Production",
        "Division of Labour",
        "Demand",
        "Supply",
        "Elasticity",
        "Market Equilibrium",
        "Price Determination",
        "Market Structures",
        "Perfect Competition",
        "Monopoly",
        "Oligopoly",
        "National Income",
        "Money",
        "Banking",
        "Central Banking",
        "Inflation",
        "Unemployment",
        "Economic Growth",
        "Economic Development",
        "Public Finance",
        "Taxation",
        "International Trade",
        "Balance of Payments",
        "Exchange Rates",
        "Population and Labour",
        "Agriculture and Economic Development"
    ],

    Marketing: [
        "Introduction to Marketing",
        "Marketing Concepts",
        "Market Research",
        "Consumer Behaviour",
        "Product",
        "Product Development",
        "Branding",
        "Packaging",
        "Pricing",
        "Promotion",
        "Advertising",
        "Personal Selling",
        "Sales Promotion",
        "Distribution",
        "Channels of Distribution",
        "Retailing",
        "Wholesaling",
        "Digital Marketing",
        "Customer Service",
        "Marketing Strategy"
    ],

    /* =====================================================
       TRADE / VOCATIONAL SUBJECTS
    ===================================================== */

    "Solar Photovoltaic Installation and Maintenance": [
        "Solar Energy",
        "Solar Radiation",
        "Photovoltaic Cells",
        "Solar Panels",
        "Solar Panel Types",
        "Solar Charge Controllers",
        "Batteries",
        "Inverters",
        "Solar Wiring",
        "Electrical Connections",
        "System Components",
        "System Sizing Concepts",
        "Energy Storage",
        "System Maintenance",
        "Troubleshooting",
        "Safety Principles"
    ],

    "Fashion Design and Garment Making": [
        "Fashion Design",
        "Design Principles",
        "Colour Theory",
        "Textile Fibres",
        "Fabric Types",
        "Body Measurements",
        "Pattern Drafting",
        "Pattern Adaptation",
        "Cutting",
        "Sewing",
        "Seams",
        "Fasteners",
        "Garment Construction",
        "Finishing",
        "Fashion Illustration",
        "Clothing Care",
        "Entrepreneurship"
    ],

    "Livestock Farming": [
        "Livestock Production",
        "Animal Nutrition",
        "Animal Feeds",
        "Animal Breeds",
        "Animal Housing",
        "Animal Health",
        "Disease Prevention",
        "Animal Breeding",
        "Poultry Production",
        "Cattle Production",
        "Goat Production",
        "Sheep Production",
        "Pig Production",
        "Rabbit Production",
        "Livestock Marketing",
        "Farm Records"
    ],

    "Beauty and Cosmetology": [
        "Personal Grooming",
        "Skin Care",
        "Hair Care",
        "Hair Styling",
        "Hair Braiding",
        "Nail Care",
        "Makeup Principles",
        "Beauty Products",
        "Salon Equipment",
        "Salon Hygiene",
        "Customer Service",
        "Beauty Business",
        "Entrepreneurship",
        "Safety and Sanitation"
    ],

    "Computer Hardware and GSM Repairs": [
        "Computer Components",
        "Motherboards",
        "Processors",
        "Memory",
        "Storage Devices",
        "Power Supplies",
        "Input Devices",
        "Output Devices",
        "Computer Assembly",
        "Hardware Troubleshooting",
        "Operating Systems",
        "Mobile Device Components",
        "GSM Technology",
        "Mobile Device Maintenance",
        "Electronic Components",
        "Diagnostic Tools",
        "Workshop Safety"
    ],

    "Horticulture and Crop Production": [
        "Horticulture",
        "Crop Classification",
        "Soil Preparation",
        "Seed Selection",
        "Seed Propagation",
        "Nursery Management",
        "Planting",
        "Irrigation",
        "Fertilizers",
        "Pest Management",
        "Disease Management",
        "Weed Control",
        "Pruning",
        "Harvesting",
        "Post Harvest Handling",
        "Crop Marketing",
        "Greenhouse Production"
    ],

    /* =====================================================
       ADDITIONAL SUBJECTS
    ===================================================== */

    "Basic Science": [
        "Living Things",
        "Matter",
        "Energy",
        "Forces",
        "Motion",
        "Heat",
        "Light",
        "Sound",
        "Electricity",
        "Magnetism",
        "Environment",
        "Human Body",
        "Health",
        "Technology"
    ],

    "Basic Technology": [
        "Technology and Society",
        "Materials",
        "Wood",
        "Metals",
        "Plastics",
        "Tools",
        "Machines",
        "Energy",
        "Electricity",
        "Electronics",
        "Technical Drawing",
        "Building Technology",
        "Mechanical Technology",
        "Safety"
    ],

    "Civic Education": [
        "Citizenship",
        "National Values",
        "Rights and Duties",
        "Human Rights",
        "Democracy",
        "Rule of Law",
        "Constitution",
        "National Identity",
        "National Unity",
        "Peace",
        "Conflict Resolution",
        "Leadership",
        "Good Governance",
        "Community Development",
        "Environmental Responsibility"
    ],

    "Citizenship and Heritage Studies": [
        "Citizenship",
        "National Identity",
        "Nigerian Values",
        "Culture",
        "Heritage",
        "National Symbols",
        "Rights and Responsibilities",
        "Democracy",
        "Leadership",
        "Community Development",
        "Peace Building",
        "National Unity"
    ],

    "Yoruba": [
        "Greetings",
        "Family",
        "Culture",
        "Traditional Institutions",
        "Vocabulary",
        "Grammar",
        "Sentence Structure",
        "Reading",
        "Writing",
        "Proverbs",
        "Folktales",
        "Literature"
    ],

    "Igbo": [
        "Greetings",
        "Family",
        "Culture",
        "Traditional Institutions",
        "Vocabulary",
        "Grammar",
        "Sentence Structure",
        "Reading",
        "Writing",
        "Proverbs",
        "Folktales",
        "Literature"
    ],

    /* =====================================================
       LEGACY / ADDITIONAL SECONDARY SUBJECTS
    ===================================================== */

    "Computer Studies": [
        "Computer Fundamentals",
        "Computer Hardware",
        "Computer Software",
        "Operating Systems",
        "Data Processing",
        "Algorithms",
        "Flowcharts",
        "Programming",
        "Databases",
        "Computer Networks",
        "Internet",
        "Web Technologies",
        "Cybersecurity",
        "Information Systems"
    ],

    "Data Processing": [
        "Data and Information",
        "Data Processing",
        "Computer Hardware",
        "Computer Software",
        "Operating Systems",
        "Word Processing",
        "Spreadsheets",
        "Presentation Software",
        "Databases",
        "Computer Networks",
        "Internet",
        "Information Security"
    ],

    "Basic Electricity": [
        "Electrical Quantities",
        "Electrical Circuits",
        "Current",
        "Voltage",
        "Resistance",
        "Ohm's Law",
        "Electrical Energy",
        "Electrical Power",
        "Series Circuits",
        "Parallel Circuits",
        "Electrical Components",
        "Safety"
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
        "Electronic Measurement",
        "Troubleshooting"
    ],

    "Book Keeping": [
        "Introduction to Book Keeping",
        "Source Documents",
        "Books of Original Entry",
        "Cash Book",
        "Ledger",
        "Trial Balance",
        "Bank Reconciliation",
        "Correction of Errors",
        "Final Accounts",
        "Depreciation"
    ],

    "Office Practice": [
        "Office",
        "Office Equipment",
        "Filing",
        "Communication",
        "Correspondence",
        "Telephone Services",
        "Mail Services",
        "Meetings",
        "Office Records",
        "Reception Duties",
        "Office Safety"
    ],

    "Insurance": [
        "Principles of Insurance",
        "Types of Insurance",
        "Life Insurance",
        "Property Insurance",
        "Motor Insurance",
        "Marine Insurance",
        "Fire Insurance",
        "Risk",
        "Premium",
        "Claims",
        "Insurance Companies"
    ],

    "Tourism": [
        "Tourism Concepts",
        "Tourist Attractions",
        "Domestic Tourism",
        "International Tourism",
        "Tourism in Nigeria",
        "Hospitality",
        "Travel Agencies",
        "Transportation",
        "Tour Planning",
        "Tourism Marketing",
        "Sustainable Tourism"
    ],

    "Fisheries": [
        "Fisheries",
        "Fish Species",
        "Fish Nutrition",
        "Fish Breeding",
        "Fish Farming",
        "Pond Management",
        "Water Quality",
        "Fish Diseases",
        "Fish Harvesting",
        "Fish Processing",
        "Fish Marketing"
    ],

    "Animal Husbandry": [
        "Animal Production",
        "Animal Nutrition",
        "Animal Breeds",
        "Animal Housing",
        "Animal Health",
        "Disease Prevention",
        "Breeding",
        "Poultry",
        "Cattle",
        "Sheep",
        "Goats",
        "Pigs",
        "Rabbits"
    ],

    "Printing": [
        "Printing Processes",
        "Printing Materials",
        "Typography",
        "Graphic Design",
        "Layout",
        "Digital Printing",
        "Offset Printing",
        "Screen Printing",
        "Binding",
        "Finishing",
        "Printing Business"
    ],

    "Plumbing": [
        "Plumbing Systems",
        "Pipes",
        "Pipe Fittings",
        "Water Supply",
        "Drainage",
        "Sanitation",
        "Valves",
        "Plumbing Tools",
        "Installation Principles",
        "Maintenance",
        "Safety"
    ],

    "Welding": [
        "Welding Principles",
        "Welding Equipment",
        "Arc Welding",
        "Gas Welding",
        "Welding Electrodes",
        "Metal Preparation",
        "Joints",
        "Welding Defects",
        "Inspection",
        "Workshop Safety"
    ],

    "Carpentry": [
        "Wood",
        "Timber",
        "Woodworking Tools",
        "Wood Joints",
        "Measuring",
        "Marking Out",
        "Cutting",
        "Planing",
        "Wood Finishing",
        "Furniture Construction",
        "Workshop Safety"
    ],

    "Electrical Installation": [
        "Electrical Installation",
        "Wiring",
        "Cables",
        "Switches",
        "Sockets",
        "Lighting Circuits",
        "Distribution Boards",
        "Earthing",
        "Protection",
        "Testing",
        "Electrical Safety"
    ]
};


/* =========================================================
   SUBJECT ALIASES
========================================================= */

const SUBJECT_ALIASES = {

    "math": "Mathematics",
    "maths": "Mathematics",
    "general mathematics": "Mathematics",

    "english": "English Language",
    "english language": "English Language",

    "crs": "Christian Religious Studies",
    "christian religious knowledge":
        "Christian Religious Studies",
    "christian religious studies":
        "Christian Religious Studies",

    "irs": "Islamic Religious Studies",
    "islamic religious knowledge":
        "Islamic Religious Studies",
    "islamic religious studies":
        "Islamic Religious Studies",

    "computer": "Computer Studies",
    "computer science": "Computer Studies",
    "computer studies": "Computer Studies",

    "further maths": "Further Mathematics",
    "further mathematics": "Further Mathematics",

    "literature": "Literature in English",
    "literature in english":
        "Literature in English",

    "agriculture": "Agricultural Science",
    "agricultural science":
        "Agricultural Science",

    "technical drawing":
        "Technical Drawing",

    "visual arts":
        "Visual Arts",

    "home economics":
        "Home Management",

    "catering": "Catering Craft",
    "catering craft": "Catering Craft",

    "digital technology":
        "Digital Technologies",
    "digital technologies":
        "Digital Technologies",

    "history": "Nigerian History",

    "physical education":
        "Physical Education",

    "health education":
        "Health Education"
};


/* =========================================================
   SUPABASE
========================================================= */

function getComputerBattleSupabase() {

    const client =
        window.supabaseClient;

    if (
        client &&
        client.auth &&
        typeof client.auth.getUser ===
            "function"
    ) {
        return client;
    }

    return null;
}

let computerBattleSupabase = null;


/* =========================================================
   BATTLE STATE
========================================================= */

const computerBattleState = {

    questions: [],

    currentQuestionIndex: 0,

    playerScore: 0,

    computerScore: 0,

    timeRemaining:
        QUESTION_TIME_LIMIT,

    timerInterval: null,

    questionLocked: false,

    battleActive: false,

    battleCompleted: false,

    selectedSubject: "",

    selectedTopic: ""
};


/* =========================================================
   ELEMENT HELPER
========================================================= */

function battleElement(id) {
    return document.getElementById(id);
}


/* =========================================================
   TEXT UTILITIES
========================================================= */

function normalizeBattleText(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
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

    const result = [
        ...array
    ];

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
   STUDY PLAN
========================================================= */

function getStudyPlan() {

    const possibleKeys = [
        "studyMindPlan",
        "studyData"
    ];

    for (
        const key of possibleKeys
    ) {

        const raw =
            localStorage.getItem(
                key
            );

        if (!raw) {
            continue;
        }

        try {

            const plan =
                JSON.parse(raw);

            if (
                plan &&
                typeof plan ===
                    "object"
            ) {

                console.log(
                    `Computer Battle: Loaded ${key}:`,
                    plan
                );

                return plan;
            }

        } catch (error) {

            console.warn(
                `Computer Battle: Could not parse ${key}:`,
                error
            );
        }
    }

    console.warn(
        "Computer Battle: No study plan found."
    );

    return null;
}


/* =========================================================
   GET SUBJECT NAME
========================================================= */

function getSubjectName(item) {

    if (
        typeof item ===
        "string"
    ) {
        return item.trim();
    }

    if (
        !item ||
        typeof item !==
            "object"
    ) {
        return "";
    }

    const names = [

        item.subject,

        item.subjectName,

        item.subject_name,

        item.name
    ];

    for (
        const value of names
    ) {

        if (
            typeof value ===
                "string" &&
            value.trim()
        ) {

            return value.trim();
        }
    }

    return "";
}


/* =========================================================
   GET TOPIC NAME
========================================================= */

function getTopicName(item) {

    if (
        typeof item ===
        "string"
    ) {
        return item.trim();
    }

    if (
        !item ||
        typeof item !==
            "object"
    ) {
        return "";
    }

    const names = [

        item.topic,

        item.topicName,

        item.topic_name,

        item.name,

        item.title
    ];

    for (
        const value of names
    ) {

        if (
            typeof value ===
                "string" &&
            value.trim()
        ) {

            return value.trim();
        }
    }

    return "";
}


/* =========================================================
   NORMALIZE SUBJECT
========================================================= */

function normalizeSubjectName(
    subject
) {

    const original =
        String(
            subject || ""
        ).trim();

    if (!original) {
        return "";
    }

    const normalized =
        normalizeBattleText(
            original
        );

    return (
        SUBJECT_ALIASES[
            normalized
        ] ||
        original
    );
}


/* =========================================================
   FIND CURRICULUM SUBJECT
========================================================= */

function findCurriculumSubject(
    subject
) {

    const normalized =
        normalizeBattleText(
            subject
        );

    const direct =
        Object.keys(
            NIGERIAN_CURRICULUM
        ).find(
            curriculumSubject =>
                normalizeBattleText(
                    curriculumSubject
                ) === normalized
        );

    if (direct) {
        return direct;
    }

    const alias =
        SUBJECT_ALIASES[
            normalized
        ];

    if (
        alias &&
        NIGERIAN_CURRICULUM[
            alias
        ]
    ) {

        return alias;
    }

    return null;
}


/* =========================================================
   EXTRACT SUBJECTS
========================================================= */

function extractSubjects(plan) {

    const subjects = [];

    /*
       First include subjects explicitly selected
       in the user's study plan.
    */

    if (
        plan &&
        Array.isArray(
            plan.subjects
        )
    ) {

        plan.subjects.forEach(
            item => {

                const name =
                    normalizeSubjectName(
                        getSubjectName(
                            item
                        )
                    );

                if (name) {
                    subjects.push(
                        name
                    );
                }
            }
        );
    }

    /*
       Also inspect topic objects in case a study plan
       stores subject information there.
    */

    if (
        plan &&
        Array.isArray(
            plan.topics
        )
    ) {

        plan.topics.forEach(
            item => {

                if (
                    !item ||
                    typeof item !==
                        "object"
                ) {
                    return;
                }

                const subject =
                    normalizeSubjectName(
                        getSubjectName(
                            item
                        )
                    );

                if (subject) {
                    subjects.push(
                        subject
                    );
                }
            }
        );
    }

    /*
       Then add the complete curriculum.
    */

    Object.keys(
        NIGERIAN_CURRICULUM
    ).forEach(
        subject => {

            subjects.push(
                subject
            );
        }
    );

    /*
       Remove duplicates using normalized names.
    */

    const unique =
        new Map();

    subjects.forEach(
        subject => {

            const normalized =
                normalizeBattleText(
                    subject
                );

            if (
                !unique.has(
                    normalized
                )
            ) {

                unique.set(
                    normalized,
                    subject
                );
            }
        }
    );

    return [
        ...unique.values()
    ].sort(
        (a, b) =>
            a.localeCompare(
                b
            )
    );
}


/* =========================================================
   EXTRACT TOPICS
========================================================= */

function extractTopics(
    plan,
    selectedSubject
) {

    const topics = [];

    const curriculumSubject =
        findCurriculumSubject(
            selectedSubject
        );

    /*
       Add curriculum topics first.
    */

    if (
        curriculumSubject &&
        Array.isArray(
            NIGERIAN_CURRICULUM[
                curriculumSubject
            ]
        )
    ) {

        topics.push(
            ...NIGERIAN_CURRICULUM[
                curriculumSubject
            ]
        );
    }

    /*
       Add matching study-plan topics.

       Important:
       If a topic has an explicit subject, only add it
       when it belongs to the selected subject.
    */

    if (
        plan &&
        Array.isArray(
            plan.topics
        )
    ) {

        plan.topics.forEach(
            item => {

                const topic =
                    getTopicName(
                        item
                    );

                if (!topic) {
                    return;
                }

                if (
                    item &&
                    typeof item ===
                        "object"
                ) {

                    const explicitSubject =
                        getSubjectName(
                            item
                        );

                    if (
                        explicitSubject
                    ) {

                        const normalizedTopicSubject =
                            normalizeSubjectName(
                                explicitSubject
                            );

                        const normalizedSelectedSubject =
                            normalizeSubjectName(
                                selectedSubject
                            );

                        if (
                            normalizeBattleText(
                                normalizedTopicSubject
                            ) !==
                            normalizeBattleText(
                                normalizedSelectedSubject
                            )
                        ) {

                            return;
                        }
                    }
                }

                topics.push(
                    topic
                );
            }
        );
    }

    /*
       Remove duplicate topics.
    */

    const unique =
        new Map();

    topics.forEach(
        topic => {

            const normalized =
                normalizeBattleText(
                    topic
                );

            if (
                !unique.has(
                    normalized
                )
            ) {

                unique.set(
                    normalized,
                    topic
                );
            }
        }
    );

    return [
        ...unique.values()
    ];
}


/* =========================================================
   FALLBACK TOPICS
========================================================= */

function getFallbackTopics(
    subject
) {

    const curriculumSubject =
        findCurriculumSubject(
            subject
        );

    if (
        curriculumSubject &&
        Array.isArray(
            NIGERIAN_CURRICULUM[
                curriculumSubject
            ]
        )
    ) {

        return [
            ...NIGERIAN_CURRICULUM[
                curriculumSubject
            ]
        ];
    }

    return [
        "General Knowledge"
    ];
}


/* =========================================================
   LOAD BATTLE SETUP
========================================================= */

function loadBattleSetup() {

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

        console.error(
            "Computer Battle: Subject/topic selectors were not found."
        );

        return;
    }

    subjectSelect.innerHTML =
        `<option value="">Loading subjects...</option>`;

    topicSelect.innerHTML =
        `<option value="">Select a subject first</option>`;

    const plan =
        getStudyPlan();

    const subjects =
        extractSubjects(
            plan
        );

    if (
        !subjects.length
    ) {

        subjectSelect.innerHTML =
            `<option value="">No subjects available</option>`;

        topicSelect.innerHTML =
            `<option value="">Select a subject first</option>`;

        return;
    }

    subjectSelect.innerHTML =
        `<option value="">Select a subject</option>` +
        subjects
            .map(
                subject => `
                    <option value="${escapeHTML(
                        subject
                    )}">
                        ${escapeHTML(
                            subject
                        )}
                    </option>
                `
            )
            .join("");

    subjectSelect.value =
        "";

    topicSelect.innerHTML =
        `<option value="">Select a subject first</option>`;

    console.log(
        "Computer Battle: Subjects loaded:",
        subjects
    );

    console.log(
        "Computer Battle: Total subjects:",
        subjects.length
    );
}


/* =========================================================
   UPDATE TOPICS
========================================================= */

function updateTopicOptions() {

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
        subjectSelect.value.trim();

    if (!subject) {

        topicSelect.innerHTML =
            `<option value="">Select a subject first</option>`;

        return;
    }

    const plan =
        getStudyPlan();

    let topics =
        extractTopics(
            plan,
            subject
        );

    if (
        !topics.length
    ) {

        topics =
            getFallbackTopics(
                subject
            );
    }

    topicSelect.innerHTML =
        `<option value="">Select a topic</option>` +
        topics
            .map(
                topic => `
                    <option value="${escapeHTML(
                        topic
                    )}">
                        ${escapeHTML(
                            topic
                        )}
                    </option>
                `
            )
            .join("");

    topicSelect.value =
        "";

    console.log(
        `Computer Battle: Topics for ${subject}:`,
        topics
    );
}


/* =========================================================
   ERROR
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
   FALLBACK QUESTIONS
========================================================= */

const FALLBACK_QUESTIONS = [

    {
        question:
            "What is 12 × 5?",

        options: [
            "50",
            "55",
            "60",
            "65"
        ],

        answer: 2
    },

    {
        question:
            "What is the square root of 81?",

        options: [
            "7",
            "8",
            "9",
            "10"
        ],

        answer: 2
    },

    {
        question:
            "What is 3/4 expressed as a decimal?",

        options: [
            "0.25",
            "0.5",
            "0.75",
            "0.8"
        ],

        answer: 2
    },

    {
        question:
            "What is 15 + 27?",

        options: [
            "32",
            "40",
            "42",
            "45"
        ],

        answer: 2
    },

    {
        question:
            "What is 100 ÷ 4?",

        options: [
            "20",
            "25",
            "30",
            "40"
        ],

        answer: 1
    },

    {
        question:
            "What is 7²?",

        options: [
            "14",
            "21",
            "42",
            "49"
        ],

        answer: 3
    },

    {
        question:
            "What is the next number in 2, 4, 6, 8, ...?",

        options: [
            "9",
            "10",
            "11",
            "12"
        ],

        answer: 1
    },

    {
        question:
            "What is 30% of 100?",

        options: [
            "3",
            "10",
            "30",
            "70"
        ],

        answer: 2
    },

    {
        question:
            "If x + 6 = 14, what is x?",

        options: [
            "6",
            "7",
            "8",
            "9"
        ],

        answer: 2
    },

    {
        question:
            "How many degrees are in a full circle?",

        options: [
            "90°",
            "180°",
            "270°",
            "360°"
        ],

        answer: 3
    },

    {
        question:
            "What is 9 × 9?",

        options: [
            "72",
            "81",
            "90",
            "99"
        ],

        answer: 1
    },

    {
        question:
            "What is half of 50?",

        options: [
            "15",
            "20",
            "25",
            "30"
        ],

        answer: 2
    }
];


/* =========================================================
   CREATE FALLBACK QUESTIONS
========================================================= */

function createFallbackQuestions() {

    /*
       We clone the questions rather than modifying the
       original fallback objects.
    */

    const pool =
        shuffleArray(
            FALLBACK_QUESTIONS
        );

    const result = [];

    for (
        let i = 0;
        i < QUESTIONS_PER_BATTLE;
        i++
    ) {

        const source =
            pool[
                i %
                pool.length
            ];

        result.push({

            question:
                source.question,

            options:
                [
                    ...source.options
                ],

            answer:
                source.answer
        });
    }

    return result;
}


/* =========================================================
   START COMPUTER BATTLE
========================================================= */

async function startComputerBattle() {

    if (
        computerBattleState.battleActive
    ) {
        return;
    }

    hideBattleError();

    const subject =
        battleElement(
            "subjectSelect"
        )?.value?.trim();

    const topic =
        battleElement(
            "topicSelect"
        )?.value?.trim();

    const startButton =
        battleElement(
            "startBattleButton"
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

    /*
       FREE BATTLE LIMIT
    */

    if (
        typeof getBattleCount ===
            "function" &&
        getBattleCount() >= 5
    ) {

        showBattleError(
            "You have used all 5 free battles. Upgrade to Premium to continue."
        );

        return;
    }

    if (startButton) {

        startButton.disabled =
            true;

        startButton.textContent =
            "Preparing Battle...";
    }

    computerBattleState.selectedSubject =
        subject;

    computerBattleState.selectedTopic =
        topic;

    showLoading();

    try {

        let questions = [];

        /*
           Ask AI for questions.
        */

        try {

            const aiResponse =
                await requestAIQuestions(
                    subject,
                    topic
                );

            questions =
                normalizeQuestions(
                    aiResponse
                );

            console.log(
                `Computer Battle: ${questions.length} valid AI questions received.`
            );

        } catch (aiError) {

            console.warn(
                "Computer Battle AI generation failed:",
                aiError
            );
        }

        /*
           If fewer than 10 valid questions were returned,
           use the reliable fallback set.
        */

        if (
            questions.length <
            QUESTIONS_PER_BATTLE
        ) {

            console.warn(
                "Computer Battle: Not enough AI questions. Using fallback questions."
            );

            questions =
                createFallbackQuestions();
        }

        computerBattleState.questions =
            shuffleArray(
                questions
            ).slice(
                0,
                QUESTIONS_PER_BATTLE
            );

        computerBattleState.currentQuestionIndex =
            0;

        computerBattleState.playerScore =
            0;

        computerBattleState.computerScore =
            0;

        computerBattleState.timeRemaining =
            QUESTION_TIME_LIMIT;

        computerBattleState.questionLocked =
            false;

        computerBattleState.battleActive =
            true;

        computerBattleState.battleCompleted =
            false;

        hideLoading();

        showBattleScreen();

        updateScoreDisplay();

        displayCurrentQuestion();

    } catch (error) {

        console.error(
            "Could not start computer battle:",
            error
        );

        hideLoading();

        const setup =
            battleElement(
                "battleSetup"
            );

        if (setup) {
            setup.style.display =
                "block";
        }

        if (startButton) {

            startButton.disabled =
                false;

            startButton.textContent =
                "⚔️ Start Battle";
        }

        showBattleError(
            "We couldn't prepare the battle. Please try again."
        );
    }
}


/* =========================================================
   AI REQUEST
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

                body:
                    JSON.stringify({

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

    let data = null;

    try {

        data =
            await response.json();

    } catch (error) {

        throw new Error(
            "AI server did not return valid JSON."
        );
    }

    if (!response.ok) {

        console.error(
            "AI server error:",
            data
        );

        throw new Error(
            data?.error ||
            `AI server returned HTTP ${response.status}`
        );
    }

    if (
        data &&
        Array.isArray(
            data.questions
        )
    ) {

        return data.questions;
    }

    if (
        data &&
        data.data &&
        Array.isArray(
            data.data.questions
        )
    ) {

        return data.data.questions;
    }

    if (
        Array.isArray(data)
    ) {

        return data;
    }

    throw new Error(
        "AI server returned an invalid response."
    );
}


/* =========================================================
   NORMALIZE AI QUESTIONS
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
        .map(item => {

            if (
                !item ||
                typeof item !==
                    "object"
            ) {
                return null;
            }

            const question =
                item.question ||
                item.questionText ||
                item.text;

            let options =
                item.options ||
                item.choices ||
                item.answers;

            if (
                !question ||
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
                                option &&
                                typeof option ===
                                    "object"
                            ) {

                                return String(
                                    option.text ||
                                    option.answer ||
                                    option.value ||
                                    ""
                                ).trim();
                            }

                            return String(
                                option
                            ).trim();
                        }
                    )
                    .filter(Boolean);

            if (
                options.length !== 4
            ) {
                return null;
            }

            let answer =
                item.answer ??
                item.correctAnswer ??
                item.correctOption ??
                item.correctIndex;

            /*
               Convert A/B/C/D answers to indexes.
            */

            if (
                typeof answer ===
                "string"
            ) {

                const clean =
                    answer
                        .trim()
                        .toUpperCase();

                const letters = [
                    "A",
                    "B",
                    "C",
                    "D"
                ];

                if (
                    letters.includes(
                        clean
                    )
                ) {

                    answer =
                        letters.indexOf(
                            clean
                        );

                } else {

                    const matchingIndex =
                        options.findIndex(
                            option =>
                                normalizeBattleText(
                                    option
                                ) ===
                                normalizeBattleText(
                                    answer
                                )
                        );

                    if (
                        matchingIndex !==
                        -1
                    ) {

                        answer =
                            matchingIndex;
                    }
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

                return null;
            }

            return {

                question:
                    String(
                        question
                    ).trim(),

                options,

                answer
            };
        })
        .filter(Boolean);
}


/* =========================================================
   SHOW BATTLE SCREEN
========================================================= */

function showBattleScreen() {

    const setup =
        battleElement(
            "battleSetup"
        );

    const loading =
        battleElement(
            "battleLoading"
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

    if (loading) {
        loading.classList.remove(
            "active"
        );
    }

    if (results) {
        results.classList.remove(
            "active"
        );
    }

    if (screen) {
        screen.classList.add(
            "active"
        );
    }
}


/* =========================================================
   DISPLAY CURRENT QUESTION
========================================================= */

function displayCurrentQuestion() {

    clearTimer();

    computerBattleState.questionLocked =
        false;

    const index =
        computerBattleState.currentQuestionIndex;

    const question =
        computerBattleState.questions[
            index
        ];

    if (!question) {

        finishComputerBattle();

        return;
    }

    const roundNumber =
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

    const feedback =
        battleElement(
            "battleFeedback"
        );

    const progress =
        battleElement(
            "battleProgressBar"
        );

    if (roundNumber) {

        roundNumber.textContent =
            `Question ${
                index + 1
            } of ${
                QUESTIONS_PER_BATTLE
            }`;
    }

    if (questionTopic) {

        questionTopic.textContent =
            `${
                computerBattleState.selectedSubject
            } • ${
                computerBattleState.selectedTopic
            }`;
    }

    if (questionText) {

        questionText.textContent =
            question.question;
    }

    if (feedback) {

        feedback.textContent =
            "";
    }

    if (progress) {

        progress.style.width =
            `${
                (index /
                    QUESTIONS_PER_BATTLE) *
                100
            }%`;
    }

    if (answerGrid) {

        answerGrid.innerHTML =
            "";

        const letters = [
            "A",
            "B",
            "C",
            "D"
        ];

        letters.forEach(
            (
                letter,
                optionIndex
            ) => {

                const button =
                    document.createElement(
                        "button"
                    );

                button.type =
                    "button";

                button.className =
                    "answer-button";

                button.dataset.index =
                    String(
                        optionIndex
                    );

                button.innerHTML = `
                    <span class="answer-letter">
                        ${letter}
                    </span>
                    ${escapeHTML(
                        question.options[
                            optionIndex
                        ]
                    )}
                `;

                button.addEventListener(
                    "click",
                    () =>
                        submitAnswer(
                            optionIndex
                        )
                );

                answerGrid.appendChild(
                    button
                );
            }
        );
    }

    computerBattleState.timeRemaining =
        QUESTION_TIME_LIMIT;

    updateTimerDisplay();

    startTimer();
}


/* =========================================================
   TIMER
========================================================= */

function startTimer() {

    clearTimer();

    computerBattleState.timerInterval =
        setInterval(
            () => {

                computerBattleState.timeRemaining--;

                updateTimerDisplay();

                if (
                    computerBattleState.timeRemaining <=
                    0
                ) {

                    clearTimer();

                    handleTimeout();
                }

            },
            1000
        );
}


function clearTimer() {

    if (
        computerBattleState.timerInterval
    ) {

        clearInterval(
            computerBattleState.timerInterval
        );

        computerBattleState.timerInterval =
            null;
    }
}


function updateTimerDisplay() {

    const number =
        battleElement(
            "timerNumber"
        );

    const container =
        battleElement(
            "timerContainer"
        );

    if (number) {

        number.textContent =
            Math.max(
                0,
                computerBattleState.timeRemaining
            );
    }

    if (container) {

        container.classList.toggle(
            "warning",
            computerBattleState.timeRemaining <=
                7
        );

        container.classList.toggle(
            "danger",
            computerBattleState.timeRemaining <=
                3
        );
    }
}


/* =========================================================
   SUBMIT ANSWER
========================================================= */

function submitAnswer(
    selectedIndex
) {

    if (
        !computerBattleState.battleActive ||
        computerBattleState.questionLocked
    ) {

        return;
    }

    computerBattleState.questionLocked =
        true;

    clearTimer();

    const question =
        computerBattleState.questions[
            computerBattleState.currentQuestionIndex
        ];

    if (!question) {
        return;
    }

    const correct =
        selectedIndex ===
        question.answer;

    if (correct) {

        computerBattleState.playerScore++;
    }

    markAnswers(
        selectedIndex,
        question.answer
    );

    showAnswerFeedback(
        correct
            ? "✓ Correct!"
            : "✗ Incorrect"
    );

    updateScoreDisplay();

    setTimeout(
        () => {

            if (
                computerBattleState.battleActive
            ) {

                computerTakeTurn(
                    correct
                );
            }

        },
        700
    );
}


/* =========================================================
   TIMEOUT
========================================================= */

function handleTimeout() {

    if (
        !computerBattleState.battleActive ||
        computerBattleState.questionLocked
    ) {

        return;
    }

    computerBattleState.questionLocked =
        true;

    const question =
        computerBattleState.questions[
            computerBattleState.currentQuestionIndex
        ];

    if (!question) {
        return;
    }

    markAnswers(
        -1,
        question.answer
    );

    showAnswerFeedback(
        "⏱ Time's up!"
    );

    setTimeout(
        () => {

            if (
                computerBattleState.battleActive
            ) {

                computerTakeTurn(
                    false
                );
            }

        },
        700
    );
}


/* =========================================================
   MARK ANSWERS
========================================================= */

function markAnswers(
    selectedIndex,
    correctIndex
) {

    document
        .querySelectorAll(
            ".answer-button"
        )
        .forEach(
            (
                button,
                index
            ) => {

                button.disabled =
                    true;

                if (
                    index ===
                    correctIndex
                ) {

                    button.classList.add(
                        "correct"
                    );
                }

                if (
                    index ===
                        selectedIndex &&
                    selectedIndex !==
                        correctIndex
                ) {

                    button.classList.add(
                        "incorrect"
                    );
                }
            }
        );
}


function showAnswerFeedback(
    message
) {

    const feedback =
        battleElement(
            "battleFeedback"
        );

    if (feedback) {

        feedback.textContent =
            message;
    }
}


/* =========================================================
   COMPUTER TURN
========================================================= */

function computerTakeTurn(
    playerWasCorrect
) {

    if (
        !computerBattleState.battleActive
    ) {
        return;
    }

    const correctChance =
        playerWasCorrect
            ? 0.62
            : 0.58;

    if (
        Math.random() <
        correctChance
    ) {

        computerBattleState.computerScore++;
    }

    updateScoreDisplay();

    setTimeout(
        () => {

            if (
                computerBattleState.battleActive
            ) {

                moveToNextQuestion();
            }

        },
        450
    );
}


/* =========================================================
   NEXT QUESTION
========================================================= */

function moveToNextQuestion() {

    if (
        !computerBattleState.battleActive
    ) {
        return;
    }

    computerBattleState.currentQuestionIndex++;

    if (
        computerBattleState.currentQuestionIndex >=
        QUESTIONS_PER_BATTLE
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

    const player =
        battleElement(
            "playerScore"
        );

    const computer =
        battleElement(
            "computerScore"
        );

    if (player) {

        player.textContent =
            computerBattleState.playerScore;
    }

    if (computer) {

        computer.textContent =
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

    let points = 0;

    if (
        result ===
        "win"
    ) {

        points = 100;

    } else if (
        result ===
        "draw"
    ) {

        points = 50;

    } else {

        points = 20;
    }

    points +=
        (
            Number(
                playerScore
            ) || 0
        ) * 5;

    return points;
}


/* =========================================================
   FINISH BATTLE
========================================================= */

async function finishComputerBattle() {

    if (
        computerBattleState.battleCompleted
    ) {

        return;
    }

    computerBattleState.battleCompleted =
        true;

    computerBattleState.battleActive =
        false;

    clearTimer();

    const playerScore =
        computerBattleState.playerScore;

    const computerScore =
        computerBattleState.computerScore;

    let result;

    if (
        playerScore >
        computerScore
    ) {

        result =
            "win";

    } else if (
        playerScore <
        computerScore
    ) {

        result =
            "loss";

    } else {

        result =
            "draw";
    }

    const points =
        calculateBattlePoints(
            result,
            playerScore
        );

    await recordCompletedBattle(
        result,
        points
    );

    showResults(
        result,
        points
    );
}


/* =========================================================
   RECORD BATTLE
========================================================= */

async function recordCompletedBattle(
    result,
    points
) {

    /*
       Update local free battle counter.
    */

    try {

        if (
            typeof registerFreeBattle ===
            "function"
        ) {

            registerFreeBattle();
        }

    } catch (error) {

        console.warn(
            "Could not update battle count:",
            error
        );
    }

    /*
       Resolve actual Supabase client.
    */

    computerBattleSupabase =
        getComputerBattleSupabase();

    if (
        !computerBattleSupabase
    ) {

        console.warn(
            "Computer Battle: Supabase client unavailable. Leaderboard update skipped."
        );

        return;
    }

    try {

        const {
            data: {
                user
            },
            error: userError
        } =
            await computerBattleSupabase
                .auth
                .getUser();

        if (
            userError ||
            !user
        ) {

            console.warn(
                "Computer Battle: No authenticated user for leaderboard update."
            );

            return;
        }

        const {
            data: existing,
            error: existingError
        } =
            await computerBattleSupabase
                .from(
                    "game_leaderboard"
                )
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

        if (existingError) {

            console.warn(
                "Could not read leaderboard row:",
                existingError
            );

            return;
        }

        const displayName =
            existing?.display_name ||
            user.user_metadata?.display_name ||
            user.user_metadata?.full_name ||
            user.email?.split(
                "@"
            )[0] ||
            "StudyMind Player";

        const currentPoints =
            Number(
                existing?.battle_points
            ) || 0;

        const wins =
            Number(
                existing?.wins
            ) || 0;

        const losses =
            Number(
                existing?.losses
            ) || 0;

        const draws =
            Number(
                existing?.draws
            ) || 0;

        const battlesPlayed =
            Number(
                existing?.battles_played
            ) || 0;

        const update = {

            user_id:
                user.id,

            display_name:
                displayName,

            battle_points:
                currentPoints +
                points,

            wins:
                wins +
                (
                    result ===
                    "win"
                        ? 1
                        : 0
                ),

            losses:
                losses +
                (
                    result ===
                    "loss"
                        ? 1
                        : 0
                ),

            draws:
                draws +
                (
                    result ===
                    "draw"
                        ? 1
                        : 0
                ),

            battles_played:
                battlesPlayed + 1,

            updated_at:
                new Date()
                    .toISOString()
        };

        const {
            error: upsertError
        } =
            await computerBattleSupabase
                .from(
                    "game_leaderboard"
                )
                .upsert(
                    update,
                    {
                        onConflict:
                            "user_id"
                    }
                );

        if (upsertError) {

            console.warn(
                "Could not update leaderboard:",
                upsertError
            );
        }

    } catch (error) {

        console.warn(
            "Leaderboard update failed:",
            error
        );
    }
}


/* =========================================================
   RESULTS
========================================================= */

function showResults(
    result,
    points
) {

    const battleScreen =
        battleElement(
            "battleScreen"
        );

    const results =
        battleElement(
            "battleResults"
        );

    if (battleScreen) {

        battleScreen.classList.remove(
            "active"
        );
    }

    if (results) {

        results.classList.add(
            "active"
        );
    }

    const icon =
        battleElement(
            "resultIcon"
        );

    const title =
        battleElement(
            "resultTitle"
        );

    const summary =
        battleElement(
            "resultSummary"
        );

    const playerScore =
        battleElement(
            "finalPlayerScore"
        );

    const computerScore =
        battleElement(
            "finalComputerScore"
        );

    const pointsElement =
        battleElement(
            "battlePointsEarned"
        );

    const message =
        battleElement(
            "battleResultMessage"
        );

    if (playerScore) {

        playerScore.textContent =
            computerBattleState.playerScore;
    }

    if (computerScore) {

        computerScore.textContent =
            computerBattleState.computerScore;
    }

    if (pointsElement) {

        pointsElement.textContent =
            `+${points}`;
    }

    if (
        result ===
        "win"
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
                "You defeated the computer.";
        }

        if (message) {

            message.textContent =
                `You scored ${computerBattleState.playerScore}/10 and earned ${points} Battle Points.`;
        }

    } else if (
        result ===
        "draw"
    ) {

        if (icon) {
            icon.textContent =
                "🤝";
        }

        if (title) {
            title.textContent =
                "It's a Draw!";
        }

        if (summary) {
            summary.textContent =
                "You and the computer finished level.";
        }

        if (message) {

            message.textContent =
                `You both scored ${computerBattleState.playerScore}. Keep practising and try again.`;
        }

    } else {

        if (icon) {
            icon.textContent =
                "⚔️";
        }

        if (title) {
            title.textContent =
                "Good Battle!";
        }

        if (summary) {
            summary.textContent =
                "The computer won this round.";
        }

        if (message) {

            message.textContent =
                `You scored ${computerBattleState.playerScore}/10 and earned ${points} Battle Points.`;
        }
    }
}


/* =========================================================
   PLAY AGAIN
========================================================= */

function playAgain() {

    if (
        typeof getBattleCount ===
            "function" &&
        getBattleCount() >= 5
    ) {

        window.location.href =
            "game-mode.html";

        return;
    }

    clearTimer();

    computerBattleState.questions =
        [];

    computerBattleState.currentQuestionIndex =
        0;

    computerBattleState.playerScore =
        0;

    computerBattleState.computerScore =
        0;

    computerBattleState.battleActive =
        false;

    computerBattleState.battleCompleted =
        false;

    const results =
        battleElement(
            "battleResults"
        );

    const screen =
        battleElement(
            "battleScreen"
        );

    const setup =
        battleElement(
            "battleSetup"
        );

    const startButton =
        battleElement(
            "startBattleButton"
        );

    if (results) {

        results.classList.remove(
            "active"
        );
    }

    if (screen) {

        screen.classList.remove(
            "active"
        );
    }

    if (setup) {

        setup.style.display =
            "block";
    }

    if (startButton) {

        startButton.disabled =
            false;

        startButton.textContent =
            "⚔️ Start Battle";
    }

    updateScoreDisplay();

    hideBattleError();

    loadBattleSetup();
}


/* =========================================================
   RETURN TO GAME MODE
========================================================= */

function returnToGameMode() {

    clearTimer();

    computerBattleState.battleActive =
        false;

    window.location.href =
        "game-mode.html";
}


/* =========================================================
   AUTHENTICATION
========================================================= */

async function verifyComputerBattleUser() {

    computerBattleSupabase =
        getComputerBattleSupabase();

    if (
        !computerBattleSupabase
    ) {

        console.error(
            "Computer Battle: window.supabaseClient is unavailable or invalid."
        );

        showBattleError(
            "Authentication is still loading. Please refresh the page and try again."
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
            await computerBattleSupabase
                .auth
                .getUser();

        if (error) {

            console.error(
                "Authentication check failed:",
                error
            );

            showBattleError(
                "We couldn't verify your account. Please refresh and try again."
            );

            return false;
        }

        if (!user) {

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

        showBattleError(
            "We couldn't verify your account. Please refresh and try again."
        );

        return false;
    }
}


/* =========================================================
   INITIALIZATION
========================================================= */

async function initializeComputerBattle() {

    console.log(
        "Computer Battle: Initializing..."
    );

    computerBattleSupabase =
        getComputerBattleSupabase();

    const authenticated =
        await verifyComputerBattleUser();

    if (!authenticated) {
        return;
    }

    loadBattleSetup();

    const subjectSelect =
        battleElement(
            "subjectSelect"
        );

    if (subjectSelect) {

        if (
            subjectSelect.dataset
                .battleListenerAttached !==
            "true"
        ) {

            subjectSelect.addEventListener(
                "change",
                updateTopicOptions
            );

            subjectSelect.dataset
                .battleListenerAttached =
                "true";
        }
    }

    updateScoreDisplay();

    console.log(
        "Computer Battle: Initialization complete."
    );
}


/* =========================================================
   CLEANUP
========================================================= */

window.addEventListener(
    "beforeunload",
    clearTimer
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

window.updateTopicOptions =
    updateTopicOptions;

window.NIGERIAN_CURRICULUM =
    NIGERIAN_CURRICULUM;


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeComputerBattle
);
