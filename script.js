"use strict";

/* =========================================================
   STUDYMIND AI — NEW CORE HOME SYSTEM
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

    "Nigerian Junior Secondary Curriculum": {

        subjects: {

            "Mathematics": [
                "Number and Numeration",
                "Fractions",
                "Decimals",
                "Percentages",
                "Ratio and Proportion",
                "Algebraic Expressions",
                "Simple Equations",
                "Indices",
                "Standard Form",
                "Geometry",
                "Angles",
                "Triangles",
                "Quadrilaterals",
                "Circles",
                "Mensuration",
                "Area and Perimeter",
                "Volume",
                "Statistics",
                "Probability",
                "Graphs",
                "Coordinates",
                "Sets",
                "Word Problems"
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
                "Sentence Structure",
                "Tenses",
                "Active and Passive Voice",
                "Direct and Reported Speech",
                "Vocabulary Development",
                "Comprehension",
                "Summary Writing",
                "Letter Writing",
                "Essay Writing",
                "Speech Work",
                "Oral English",
                "Literature"
            ],

            "Basic Science": [
                "Living Things",
                "Non-Living Things",
                "Cells",
                "Human Body",
                "Nutrition",
                "Health",
                "Disease",
                "Environment",
                "Energy",
                "Force",
                "Motion",
                "Heat",
                "Light",
                "Sound",
                "Electricity",
                "Magnetism",
                "Matter",
                "Atoms and Molecules",
                "Water",
                "Air",
                "Simple Machines"
            ],

            "Basic Technology": [
                "Technology and Society",
                "Materials",
                "Woodwork",
                "Metalwork",
                "Technical Drawing",
                "Building Technology",
                "Electrical Technology",
                "Electronics",
                "Machines",
                "Energy",
                "Safety"
            ],

            "Social Studies": [
                "Family",
                "Culture",
                "Values",
                "Citizenship",
                "Human Rights",
                "Democracy",
                "Leadership",
                "Population",
                "Environment",
                "Social Problems",
                "National Unity",
                "Conflict Resolution"
            ],

            "Computer Studies": [
                "Computer Fundamentals",
                "Computer Hardware",
                "Computer Software",
                "Input Devices",
                "Output Devices",
                "Storage Devices",
                "Operating Systems",
                "Word Processing",
                "Spreadsheets",
                "Presentations",
                "Internet",
                "Computer Networks",
                "Cyber Safety",
                "Programming Fundamentals",
                "Algorithms",
                "Flowcharts"
            ],

            "Business Studies": [
                "Introduction to Business",
                "Office Practice",
                "Bookkeeping",
                "Entrepreneurship",
                "Trade",
                "Commerce",
                "Banking",
                "Insurance",
                "Consumer Education"
            ],

            "Agricultural Science": [
                "Agriculture",
                "Farm Tools",
                "Soil",
                "Soil Fertility",
                "Crops",
                "Crop Production",
                "Livestock",
                "Animal Production",
                "Farm Management",
                "Agricultural Economics"
            ],

            "Civic Education": [
                "Citizenship",
                "Rights and Duties",
                "Democracy",
                "Rule of Law",
                "Constitution",
                "National Values",
                "Leadership",
                "Human Rights",
                "Political Participation"
            ]

        }

    },


    "BECE": {

        subjects: {

            "Mathematics": [
                "Number Bases",
                "Fractions",
                "Decimals",
                "Percentages",
                "Ratio",
                "Proportion",
                "Indices",
                "Logarithms",
                "Algebra",
                "Linear Equations",
                "Simultaneous Equations",
                "Geometry",
                "Mensuration",
                "Statistics",
                "Probability",
                "Graphs",
                "Sets",
                "Vectors"
            ],

            "English Studies": [
                "Grammar",
                "Vocabulary",
                "Comprehension",
                "Summary",
                "Essay Writing",
                "Letter Writing",
                "Speech Work",
                "Oral English",
                "Literature"
            ],

            "Basic Science": [
                "Cells",
                "Living Organisms",
                "Nutrition",
                "Human Reproduction",
                "Health",
                "Disease",
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
                "Technology"
            ],

            "Basic Technology": [
                "Technical Drawing",
                "Materials",
                "Wood",
                "Metal",
                "Machines",
                "Electrical Systems",
                "Electronics",
                "Building Technology",
                "Safety"
            ],

            "Social Studies": [
                "Family",
                "Culture",
                "Socialization",
                "Citizenship",
                "Population",
                "Environment",
                "Democracy",
                "National Unity"
            ],

            "Civic Education": [
                "Human Rights",
                "Citizenship",
                "Responsibilities",
                "Democracy",
                "Rule of Law",
                "Constitution",
                "National Values",
                "Leadership"
            ],

            "Computer Studies": [
                "Computer Fundamentals",
                "Hardware",
                "Software",
                "Operating Systems",
                "Word Processing",
                "Spreadsheets",
                "Internet",
                "Networks",
                "Algorithms",
                "Programming"
            ]

        }

    },


    "Nigerian Senior Secondary Curriculum": {

        subjects: {

            "Mathematics": [
                "Number and Numeration",
                "Algebra",
                "Quadratic Equations",
                "Sequences and Series",
                "Functions",
                "Indices",
                "Logarithms",
                "Surds",
                "Coordinate Geometry",
                "Trigonometry",
                "Vectors",
                "Matrices",
                "Calculus",
                "Differentiation",
                "Integration",
                "Statistics",
                "Probability",
                "Geometry",
                "Mensuration"
            ],

            "English Language": [
                "Grammar",
                "Comprehension",
                "Summary",
                "Lexis and Structure",
                "Oral English",
                "Essay Writing",
                "Formal Letters",
                "Informal Letters",
                "Reports",
                "Articles",
                "Speech Writing",
                "Literature"
            ],

            "Physics": [
                "Measurement",
                "Motion",
                "Scalars and Vectors",
                "Forces",
                "Work Energy and Power",
                "Momentum",
                "Simple Machines",
                "Heat",
                "Waves",
                "Sound",
                "Light",
                "Electricity",
                "Current Electricity",
                "Magnetism",
                "Electromagnetism",
                "Atomic Physics",
                "Nuclear Physics"
            ],

            "Chemistry": [
                "Matter",
                "Atomic Structure",
                "Periodic Table",
                "Chemical Bonding",
                "Stoichiometry",
                "Gas Laws",
                "Acids Bases and Salts",
                "Organic Chemistry",
                "Hydrocarbons",
                "Chemical Equilibrium",
                "Electrochemistry",
                "Rates of Reaction",
                "Redox Reactions"
            ],

            "Biology": [
                "Cell Biology",
                "Nutrition",
                "Transport",
                "Respiration",
                "Excretion",
                "Coordination",
                "Reproduction",
                "Genetics",
                "Evolution",
                "Ecology",
                "Classification",
                "Microorganisms"
            ],

            "Computer Studies": [
                "Computer Architecture",
                "Data Representation",
                "Operating Systems",
                "Networking",
                "Databases",
                "Algorithms",
                "Programming",
                "Web Development",
                "Cybersecurity",
                "Artificial Intelligence"
            ]

        }

    },


    "WAEC": {
        subjects: {}
    },

    "NECO": {
        subjects: {}
    },

    "JAMB": {
        subjects: {}
    },

    "IGCSE": {
        subjects: {}
    },

    "SAT": {
        subjects: {}
    },

    "Other": {
        subjects: {}
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
   DOM
========================================================= */

const $ = id =>
    document.getElementById(id);


/* =========================================================
   CURRICULUM
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

            renderSubjects();

            $("topicSelector")
                ?.classList.add("hidden");

            updateSelectedItems();

        }
    );

}


/* =========================================================
   SUBJECTS
========================================================= */

function getSubjects() {

    return Object.keys(
        CURRICULUMS[
            state.curriculum
        ]?.subjects || {}
    );

}


function renderSubjects(
    search = ""
) {

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
                        search.toLowerCase()
                    )
        );

    wrapper.classList.toggle(
        "hidden",
        !state.curriculum
    );

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
            subject => `
                <button
                    type="button"
                    class="selection-card ${
                        state.selectedSubject === subject
                            ? "selected"
                            : ""
                    }"
                    data-subject="${escapeHTML(subject)}"
                >
                    <strong>
                        ${escapeHTML(subject)}
                    </strong>

                    <span>
                        ${
                            CURRICULUMS[
                                state.curriculum
                            ].subjects[subject].length
                        } topics
                    </span>
                </button>
            `
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
                        $("subjectSearch")?.value || ""
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
    ) return;

    selector.classList.remove("hidden");

    label.textContent =
        `${state.selectedSubject} • ${state.curriculum}`;

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
                        search.toLowerCase()
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
                            item.topic === topic
                    );

                return `
                    <button
                        type="button"
                        class="selection-card topic-card ${
                            selected
                                ? "selected"
                                : ""
                        }"
                        data-topic="${escapeHTML(topic)}"
                    >

                        <span class="topic-check">
                            ${selected ? "✓" : ""}
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
        $("topicSearch")?.value || ""
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
        $("customSubject")?.value.trim();

    const topic =
        $("customTopic")?.value.trim();

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

    $("customSubject").value = "";
    $("customTopic").value = "";

    updateSelectedItems();

}


/* =========================================================
   SELECTED TOPICS
========================================================= */

function updateSelectedItems() {

    const container =
        $("selectedItems");

    if (!container) return;

    if (!state.selections.length) {

        container.classList.add("hidden");
        container.innerHTML = "";

        return;
    }

    container.classList.remove("hidden");

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

                        <span>×</span>

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

                    renderTopics(
                        $("topicSearch")?.value || ""
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
                    .querySelector(".exam-name")
                    ?.value.trim(),

            date:
                card
                    .querySelector(".exam-date")
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

async function generateStudyPlan(
    event
) {

    event.preventDefault();

    const button =
        $("generateButton");

    const curriculum =
        $("curriculum")?.value;

    const studyHours =
        Number(
            $("studyHours")?.value
        );

    const difficulty =
        $("difficulty")?.value ||
        "balanced";

    const goal =
        $("studyGoal")?.value.trim() ||
        "";

    const notifications =
        Boolean(
            $("notifications")?.checked
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
        Array.isArray(plan.topics)
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
                        Boolean(item.custom),
                    completed:
                        false,
                    priority:
                        "normal",
                    mastery:
                        0
                })
            );


    return {

        id:
            plan.id ||
            crypto.randomUUID(),

        version:
            2,

        curriculum:
            plan.curriculum ||
            state.curriculum,

        subjects:
            plan.subjects ||
            unique(
                topics.map(
                    topic =>
                        topic.subject
                )
            ),

        topics,

        exams:
            plan.exams ||
            collectExams(),

        studyHours:
            Number(
                plan.studyHours ||
                $("studyHours")?.value ||
                1
            ),

        difficulty:
            plan.difficulty ||
            $("difficulty")?.value ||
            "balanced",

        goal:
            plan.goal ||
            $("studyGoal")?.value ||
            "",

        notifications:
            Boolean(
                plan.notifications ??
                $("notifications")?.checked
            ),

        schedule:
            Array.isArray(
                plan.schedule
            )
                ? plan.schedule
                : [],

        generatedBy:
            "StudyMind AI",

        createdAt:
            plan.createdAt ||
            new Date().toISOString(),

        progress: {

            completedTopics: 0,

            totalTopics:
                topics.length,

            studyMinutes: 0,

            sessions: 0

        }

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


    const plans =
        JSON.parse(
            localStorage.getItem(
                "studyMindPlans"
            ) || "[]"
        );


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

        }
    );

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
                        behavior: "smooth"
                    });

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


function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

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

        const form =
            $("studyForm");

        form?.addEventListener(
            "submit",
            generateStudyPlan
        );

    }
);
