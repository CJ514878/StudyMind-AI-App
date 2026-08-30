/* =========================================================
   STUDYMIND AI — GAME MODE
   FULL REPLACEMENT
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
   GAME MODE SUBJECT / TOPIC DATABASE
========================================================= */

const SUBJECT_DATABASE = {

    "Mathematics": [
        "Number Systems",
        "Fractions",
        "Decimals",
        "Percentages",
        "Ratio and Proportion",
        "Algebra",
        "Linear Equations",
        "Quadratic Equations",
        "Simultaneous Equations",
        "Geometry",
        "Mensuration",
        "Trigonometry",
        "Statistics",
        "Probability",
        "Sequences",
        "Vectors"
    ],

    "English Language": [
        "Grammar",
        "Parts of Speech",
        "Tenses",
        "Sentence Structure",
        "Comprehension",
        "Vocabulary",
        "Figures of Speech",
        "Writing",
        "Summary Writing"
    ],

    "Physics": [
        "Measurement",
        "Motion",
        "Forces",
        "Work, Energy and Power",
        "Heat",
        "Waves",
        "Light",
        "Sound",
        "Electricity",
        "Magnetism"
    ],

    "Chemistry": [
        "Atomic Structure",
        "Periodic Table",
        "Chemical Bonding",
        "Mole Concept",
        "Chemical Reactions",
        "Acids, Bases and Salts",
        "Organic Chemistry",
        "Electrochemistry",
        "Rates of Reaction"
    ],

    "Biology": [
        "Cell Biology",
        "Nutrition",
        "Transport Systems",
        "Respiration",
        "Excretion",
        "Reproduction",
        "Genetics",
        "Ecology",
        "Evolution"
    ],

    "Computer Science": [
        "Computer Hardware",
        "Computer Software",
        "Data Representation",
        "Algorithms",
        "Programming",
        "Databases",
        "Networks",
        "Cybersecurity"
    ],

    "Agricultural Science": [
        "Farm Management",
        "Soil Science",
        "Crop Production",
        "Animal Production",
        "Farm Tools",
        "Agricultural Economics",
        "Pest Management"
    ],

    "Business Studies": [
        "Business Ownership",
        "Trade",
        "Marketing",
        "Banking",
        "Insurance",
        "Accounting",
        "Office Practice",
        "Entrepreneurship"
    ],

    "Literature in English": [
        "Prose",
        "Poetry",
        "Drama",
        "Literary Devices",
        "Characterization",
        "Themes",
        "Plot and Structure"
    ]
};


/* =========================================================
   SUBJECT ALIASES
========================================================= */

const SUBJECT_ALIASES = {

    "math": "Mathematics",
    "maths": "Mathematics",
    "mathematics": "Mathematics",

    "english": "English Language",
    "english language": "English Language",

    "physics": "Physics",

    "chem": "Chemistry",
    "chemistry": "Chemistry",

    "bio": "Biology",
    "biology": "Biology",

    "computer": "Computer Science",
    "computer science": "Computer Science",

    "cs": "Computer Science",

    "ict": "Computer Science",
    "information technology": "Computer Science",

    "agric": "Agricultural Science",
    "agricultural science": "Agricultural Science",

    "business": "Business Studies",
    "business studies": "Business Studies",

    "lit": "Literature in English",
    "literature": "Literature in English",
    "literature in english": "Literature in English"
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
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    updateBattleLimitUI();

    loadStudyPlanSubjects();

    setupComputerSubjectListener();

    setupOneVOneSubjectListener();

    updateThemeButton();

    showComputerSetup();

});


/* =========================================================
   BATTLE LIMIT
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
   SUBJECT NORMALIZATION
========================================================= */

function normalizeSubjectName(subject) {

    if (!subject) {
        return "";
    }

    const cleaned =
        String(subject)
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ");

    if (
        SUBJECT_ALIASES[cleaned]
    ) {

        return SUBJECT_ALIASES[cleaned];
    }

    const exactMatch =
        Object.keys(SUBJECT_DATABASE)
            .find(
                databaseSubject =>
                    databaseSubject
                        .toLowerCase() ===
                    cleaned
            );

    return (
        exactMatch ||
        String(subject).trim()
    );
}


/* =========================================================
   LOAD SUBJECTS FROM STUDY PLAN
========================================================= */

function loadStudyPlanSubjects() {

    const selects = [
        $("battleSubject"),
        $("oneVOneSubject")
    ].filter(Boolean);

    selects.forEach(select => {

        select.innerHTML = `
            <option value="">
                Choose a subject
            </option>
        `;

        let subjects = [];

        try {

            const rawPlan =
                localStorage.getItem(
                    "studyMindPlan"
                );

            if (rawPlan) {

                const plan =
                    JSON.parse(rawPlan);

                subjects =
                    extractSubjectsFromPlan(
                        plan
                    );
            }

        } catch (error) {

            console.warn(
                "Could not read study plan:",
                error
            );
        }


        /* -------------------------------------------------
           FALLBACK STORAGE KEYS
        ------------------------------------------------- */

        if (!subjects.length) {

            const possibleKeys = [
                "studyMindSubjects",
                "subjects",
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

                    const found =
                        extractSubjectsFromPlan(
                            parsed
                        );

                    if (found.length) {

                        subjects =
                            found;

                        break;
                    }

                } catch (_) {}
            }
        }


        /* -------------------------------------------------
           IF NOTHING WAS FOUND, USE DATABASE SUBJECTS
        ------------------------------------------------- */

        if (!subjects.length) {

            subjects =
                Object.keys(
                    SUBJECT_DATABASE
                ).map(name => ({
                    name,
                    topics:
                        SUBJECT_DATABASE[name]
                }));
        }


        /* -------------------------------------------------
           REMOVE DUPLICATES
        ------------------------------------------------- */

        const uniqueSubjects = [];

        const seen =
            new Set();

        subjects.forEach(subject => {

            if (!subject?.name) {
                return;
            }

            const normalized =
                normalizeSubjectName(
                    subject.name
                );

            const key =
                normalized.toLowerCase();

            if (seen.has(key)) {
                return;
            }

            seen.add(key);

            uniqueSubjects.push({

                name:
                    String(subject.name)
                        .trim(),

                topics:
                    subject.topics || []
            });
        });


        /* -------------------------------------------------
           ADD SUBJECTS
        ------------------------------------------------- */

        uniqueSubjects.forEach(subject => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                subject.name;

            option.textContent =
                subject.name;

            select.appendChild(
                option
            );
        });
    });
}


/* =========================================================
   EXTRACT SUBJECTS
========================================================= */

function extractSubjectsFromPlan(plan) {

    const results = [];

    if (!plan) {
        return results;
    }


    /* -------------------------------------------------
       ARRAY
    ------------------------------------------------- */

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

        });

        return results;
    }


    /* -------------------------------------------------
       OBJECT
    ------------------------------------------------- */

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


    possibleArrays.forEach(array => {

        if (Array.isArray(array)) {

            results.push(
                ...extractSubjectsFromPlan(
                    array
                )
            );
        }
    });


    /* -------------------------------------------------
       SUBJECTS OBJECT
    ------------------------------------------------- */

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
   GET TOPICS FOR SUBJECT
========================================================= */

function getTopicsForSubject(
    subjectName
) {

    if (!subjectName) {
        return [];
    }

    const normalizedSubject =
        normalizeSubjectName(
            subjectName
        );

    const planTopics = [];

    try {

        const rawPlan =
            localStorage.getItem(
                "studyMindPlan"
            );

        if (rawPlan) {

            const plan =
                JSON.parse(rawPlan);

            findTopicsForSubject(
                plan,
                subjectName,
                planTopics
            );

        }

    } catch (error) {

        console.warn(
            "Could not read study plan topics:",
            error
        );
    }


    /* -------------------------------------------------
       USE STUDY PLAN TOPICS IF THEY EXIST
    ------------------------------------------------- */

    const cleanedPlanTopics =
        cleanTopicList(
            planTopics
        );

    if (
        cleanedPlanTopics.length
    ) {

        return cleanedPlanTopics;
    }


    /* -------------------------------------------------
       OTHERWISE USE BUILT-IN TOPICS
    ------------------------------------------------- */

    const databaseTopics =
        SUBJECT_DATABASE[
            normalizedSubject
        ] || [];


    return [
        ...databaseTopics
    ];
}


/* =========================================================
   FIND TOPICS IN STUDY PLAN
========================================================= */

function findTopicsForSubject(
    value,
    subjectName,
    output
) {

    if (!value) {
        return;
    }


    if (Array.isArray(value)) {

        value.forEach(item => {

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

                if (
                    name &&
                    normalizeSubjectName(
                        name
                    ).toLowerCase() ===
                    normalizeSubjectName(
                        subjectName
                    ).toLowerCase()
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

        });

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
        value.subjectName;


    if (
        name &&
        normalizeSubjectName(
            name
        ).toLowerCase() ===
        normalizeSubjectName(
            subjectName
        ).toLowerCase()
    ) {

        addTopics(
            value.topics ||
            value.topicList ||
            value.contents,
            output
        );
    }


    Object.values(value)
        .forEach(child => {

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

        });
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

        value.forEach(item => {

            if (
                typeof item ===
                "string"
            ) {

                output.push(item);

            } else if (
                item &&
                typeof item ===
                "object"
            ) {

                const topic =
                    item.topic ||
                    item.topicName ||
                    item.name ||
                    item.title;

                if (topic) {

                    output.push(
                        String(topic)
                    );
                }
            }

        });

        return;
    }


    if (
        typeof value ===
        "string"
    ) {

        /*
         * Support comma-separated topic lists.
         */

        value
            .split(",")
            .forEach(topic => {

                if (topic.trim()) {

                    output.push(
                        topic.trim()
                    );
                }
            });
    }
}


/* =========================================================
   CLEAN TOPIC LIST
========================================================= */

function cleanTopicList(
    topics
) {

    return [
        ...new Set(
            topics
                .map(topic =>
                    String(topic)
                        .trim()
                )
                .filter(Boolean)
        )
    ];
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
        () => {

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
        () => {

            populateTopicSelect(
                "oneVOneSubject",
                "oneVOneTopic",
                "findOpponentButton"
            );

        }
    );
}


/* =========================================================
   POPULATE TOPIC SELECT
   THIS FIXES THE ORIGINAL ERROR
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

    const button =
        $(buttonId);


    if (
        !subjectSelect ||
        !topicSelect
    ) {

        return;
    }


    topicSelect.innerHTML = "";


    const selectedSubject =
        subjectSelect.value
            ?.trim() || "";


    /* -------------------------------------------------
       NO SUBJECT
    ------------------------------------------------- */

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

        if (button) {
            button.disabled = true;
        }

        return;
    }


    /* -------------------------------------------------
       GET TOPICS
    ------------------------------------------------- */

    const topics =
        getTopicsForSubject(
            selectedSubject
        );


    /* -------------------------------------------------
       TOPIC SELECT DEFAULT
    ------------------------------------------------- */

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


    /* -------------------------------------------------
       ADD TOPICS
    ------------------------------------------------- */

    topics.forEach(topic => {

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
    });


    topicSelect.disabled =
        topics.length === 0;


    if (button) {

        button.disabled = true;

        /*
         * Remove old listeners safely by cloning.
         */

        const newTopicSelect =
            topicSelect.cloneNode(true);

        topicSelect.parentNode.replaceChild(
            newTopicSelect,
            topicSelect
        );

        newTopicSelect.addEventListener(
            "change",
            () => {

                button.disabled =
                    !newTopicSelect.value;
            }
        );
    }
}


/* =========================================================
   BACKWARDS COMPATIBILITY
   Allows older HTML/JS to call populateTopics()
========================================================= */

function populateTopics(
    subjectSelect,
    topicSelect
) {

    let subjectElement =
        subjectSelect;

    let topicElement =
        topicSelect;


    if (
        typeof subjectSelect ===
        "string"
    ) {

        subjectElement =
            $(subjectSelect);
    }


    if (
        typeof topicSelect ===
        "string"
    ) {

        topicElement =
            $(topicSelect);
    }


    if (
        !subjectElement ||
        !topicElement
    ) {

        return;
    }


    populateTopicSelect(
        subjectElement.id,
        topicElement.id,
        null
    );
}


/* =========================================================
   START COMPUTER BATTLE SETUP
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
        $("battleSubject")
            ?.value || "";


    const topic =
        $("battleTopic")
            ?.value || "";


    const difficulty =
        $("battleDifficulty")
            ?.value ||
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
            !Array.isArray(
                questions
            ) ||
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


        /*
         * Only count the battle
         * after successful generation.
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
   AI QUESTION GENERATION
========================================================= */

async function generateBattleQuestions(
    subject,
    topic,
    difficulty
) {

    const prompt = `
Create exactly ${QUESTIONS_PER_BATTLE} multiple-choice study questions.

Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}

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

Rules:

- Exactly 10 questions.
- Exactly 4 options per question.
- answer must be the zero-based index of the correct option.
- Questions must be based specifically on the selected subject and topic.
- No markdown.
- No code fences.
- No extra text outside the JSON.
`;


    const endpoints = [
        "/api/chat",
        "/api/ask-ai"
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


            /*
             * Read text first.
             */

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


            if (
                !rawText.trim()
            ) {

                lastError =
                    `${endpoint} returned an empty response.`;

                continue;
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
                `10 usable questions.`;

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
        text.trim();


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

function extractServerError(
    data
) {

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
        Array.isArray(
            payload
        )
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
                !Array.isArray(
                    options
                )
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

                            return option;
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
                            );
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
                        [
                            "A",
                            "B",
                            "C",
                            "D"
                        ].indexOf(
                            letter
                        );

                } else if (
                    !Number.isNaN(
                        Number(
                            trimmed
                        )
                    )
                ) {

                    answer =
                        Number(
                            trimmed
                        );


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
                    ),

                options,

                answer,

                explanation:
                    question.explanation ||
                    question.explanationText ||
                    ""
            };

        })
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
        setInterval(() => {

            battleState.timer--;

            updateBattleTimer();


            if (
                battleState.timer <= 0
            ) {

                stopBattleTimer();

                handleComputerTimeout();
            }

        }, 1000);
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


    setTimeout(() => {

        battleState.currentQuestion++;

        showComputerQuestion();

    }, 900);
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


    setTimeout(() => {

        battleState.currentQuestion++;

        showComputerQuestion();

    }, 900);
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
   FINISH COMPUTER BATTLE
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
   1V1 MODE
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

function findOneVOneOpponent() {

    if (!hasBattleAvailable()) {

        openPremium();

        return;
    }


    const subject =
        $("oneVOneSubject")
            ?.value;

    const topic =
        $("oneVOneTopic")
            ?.value;


    if (!subject || !topic) {

        alert(
            "Please choose a subject and topic."
        );

        return;
    }


    const status =
        $("matchmakingStatus");


    if (status) {
        status.hidden = false;
    }


    const button =
        $("findOpponentButton");


    if (button) {
        button.disabled = true;
    }


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
   CANCEL 1V1
========================================================= */

function cancelOneVOne() {

    const status =
        $("matchmakingStatus");


    if (status) {
        status.hidden = true;
    }


    const button =
        $("findOpponentButton");


    if (button) {

        button.disabled =
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

    const setup =
        $("oneVOneSetup");

    const arena =
        $("oneVOneArena");


    if (setup) {
        setup.hidden = true;
    }

    if (arena) {
        arena.hidden = false;
    }
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


    if (saved === "light") {

        document.body.classList.add(
            "light-mode"
        );
    }

})();


/* =========================================================
   CLEAN ERROR MESSAGE
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

window.populateTopicSelect =
    populateTopicSelect;

