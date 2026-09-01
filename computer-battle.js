/* =========================================================
   STUDYMIND AI — COMPUTER BATTLE
   10 QUESTIONS • 15 SECONDS PER QUESTION

   This file controls ONLY the Computer Battle page.
========================================================= */

const QUESTIONS_PER_BATTLE = 10;
const QUESTION_TIME_LIMIT = 15;

const AI_QUESTION_ENDPOINT = "/api/generate-questions";

/* =========================================================
   SUPABASE
========================================================= */

const computerBattleSupabase =
    typeof supabase !== "undefined" ? supabase : null;

/* =========================================================
   BATTLE STATE
========================================================= */

const computerBattleState = {
    questions: [],
    currentQuestionIndex: 0,

    playerScore: 0,
    computerScore: 0,

    timeRemaining: QUESTION_TIME_LIMIT,
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
   FALLBACK QUESTIONS
========================================================= */

const FALLBACK_QUESTIONS = [
    {
        question: "What is 12 × 5?",
        options: ["50", "55", "60", "65"],
        answer: 2
    },
    {
        question: "What is the square root of 81?",
        options: ["7", "8", "9", "10"],
        answer: 2
    },
    {
        question: "What is 3/4 expressed as a decimal?",
        options: ["0.25", "0.5", "0.75", "0.8"],
        answer: 2
    },
    {
        question: "What is 15 + 27?",
        options: ["32", "40", "42", "45"],
        answer: 2
    },
    {
        question: "What is 100 ÷ 4?",
        options: ["20", "25", "30", "40"],
        answer: 1
    },
    {
        question: "What is 7²?",
        options: ["14", "21", "42", "49"],
        answer: 3
    },
    {
        question: "What is the next number in 2, 4, 6, 8, ...?",
        options: ["9", "10", "11", "12"],
        answer: 1
    },
    {
        question: "What is 30% of 100?",
        options: ["3", "10", "30", "70"],
        answer: 2
    },
    {
        question: "If x + 6 = 14, what is x?",
        options: ["6", "7", "8", "9"],
        answer: 2
    },
    {
        question: "How many degrees are in a full circle?",
        options: ["90°", "180°", "270°", "360°"],
        answer: 3
    },
    {
        question: "What is 9 × 9?",
        options: ["72", "81", "90", "99"],
        answer: 1
    },
    {
        question: "What is half of 50?",
        options: ["15", "20", "25", "30"],
        answer: 2
    }
];

/* =========================================================
   GENERAL UTILITIES
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
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [result[i], result[j]] =
            [result[j], result[i]];
    }

    return result;
}

/* =========================================================
   STUDY PLAN
========================================================= */

/* =========================================================
   GET SAVED STUDY PLAN
========================================================= */

function getStudyPlan() {

    const raw =
        localStorage.getItem("studyMindPlan");

    if (!raw) {

        console.warn(
            "Computer Battle: No study plan found."
        );

        return null;
    }

    try {

        const plan =
            JSON.parse(raw);

        console.log(
            "Computer Battle: Study plan loaded:",
            plan
        );

        return plan;

    } catch (error) {

        console.error(
            "Computer Battle: Could not parse studyMindPlan:",
            error
        );

        return null;
    }
}


/* =========================================================
   SUBJECT NAME
========================================================= */

function getSubjectName(item) {

    if (
        typeof item === "string"
    ) {
        return item.trim();
    }

    if (
        !item ||
        typeof item !== "object"
    ) {
        return "";
    }

    const names = [
        item.subject,
        item.subjectName,
        item.subject_name,
        item.name
    ];

    for (const value of names) {

        if (
            typeof value === "string" &&
            value.trim()
        ) {
            return value.trim();
        }
    }

    return "";
}


/* =========================================================
   TOPIC NAME
========================================================= */

function getTopicName(item) {

    if (
        typeof item === "string"
    ) {
        return item.trim();
    }

    if (
        !item ||
        typeof item !== "object"
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

    for (const value of names) {

        if (
            typeof value === "string" &&
            value.trim()
        ) {
            return value.trim();
        }
    }

    return "";
}


/* =========================================================
   EXTRACT SUBJECTS
========================================================= */

function extractSubjects(plan) {

    if (
        !plan ||
        typeof plan !== "object"
    ) {
        return [];
    }

    if (
        !Array.isArray(plan.subjects)
    ) {
        console.warn(
            "Computer Battle: plan.subjects is not an array.",
            plan
        );

        return [];
    }

    const subjects =
        plan.subjects
            .map(subject =>
                getSubjectName(subject)
            )
            .filter(Boolean);

    console.log(
        "Computer Battle subjects:",
        subjects
    );

    return [
        ...new Set(subjects)
    ];
}


/* =========================================================
   EXTRACT TOPICS
========================================================= */

function extractTopics(
    plan,
    selectedSubject
) {

    if (
        !plan ||
        typeof plan !== "object"
    ) {
        return [];
    }

    if (
        !Array.isArray(plan.topics)
    ) {
        console.warn(
            "Computer Battle: plan.topics is not an array.",
            plan
        );

        return [];
    }

    const topics =
        plan.topics
            .map(topic =>
                getTopicName(topic)
            )
            .filter(Boolean);

    console.log(
        "Computer Battle topics:",
        topics
    );

    return [
        ...new Set(topics)
    ];
}
    function addTopic(value) {

        if (
            typeof value !== "string"
        ) {
            return;
        }

        const topic =
            value.trim();

        if (
            !topic ||
            topic.length > 150
        ) {
            return;
        }

        if (
            !topics.some(
                existing =>
                    normalizeBattleText(existing) ===
                    normalizeBattleText(topic)
            )
        ) {
            topics.push(topic);
        }
    }

    function subjectMatches(item) {

        if (
            !item ||
            typeof item !== "object"
        ) {
            return false;
        }

        const itemSubject =
            normalizeBattleText(
                getSubjectName(item)
            );

        /*
           If the object explicitly has a subject,
           require it to match.

           If it doesn't have a subject field,
           allow inspection because the topic may
           belong to a parent subject object.
        */

        if (!itemSubject) {
            return true;
        }

        return (
            !target ||
            itemSubject === target
        );
    }

    function inspect(node) {

        if (!node) {
            return;
        }

        if (
            typeof node !== "object"
        ) {
            return;
        }

        if (visited.has(node)) {
            return;
        }

        visited.add(node);

        if (Array.isArray(node)) {

            node.forEach(item => {
                inspect(item);
            });

            return;
        }

        const nodeSubject =
            normalizeBattleText(
                getSubjectName(node)
            );

        /*
           If this is a subject object and it
           does not match the selected subject,
           don't collect its topics.
        */

        const isSubjectObject =
            Boolean(
                nodeSubject
            );

        const matches =
            !isSubjectObject ||
            nodeSubject === target;

        if (matches) {

            /*
               Direct topic fields.
            */

            addTopic(node.topic);
            addTopic(node.topicName);
            addTopic(node.topic_name);

            /*
               Topics arrays.
            */

            const topicCollections = [
                node.topics,
                node.topicList,
                node.topic_list
            ];

            topicCollections.forEach(
                collection => {

                    if (
                        !Array.isArray(collection)
                    ) {
                        return;
                    }

                    collection.forEach(
                        topicItem => {

                            if (
                                typeof topicItem ===
                                "string"
                            ) {

                                addTopic(
                                    topicItem
                                );

                            } else if (
                                topicItem &&
                                typeof topicItem ===
                                "object"
                            ) {

                                addTopic(
                                    topicItem.topic
                                );

                                addTopic(
                                    topicItem.topicName
                                );

                                addTopic(
                                    topicItem.name
                                );

                                addTopic(
                                    topicItem.title
                                );
                            }
                        }
                    );
                }
            );
        }

        /*
           Continue searching nested objects.
        */

        Object.keys(node).forEach(key => {

            const value =
                node[key];

            if (
                value &&
                typeof value === "object"
            ) {

                /*
                   Don't accidentally collect a topic
                   from a different explicitly-labelled
                   subject.
                */

                if (
                    Array.isArray(value)
                ) {

                    value.forEach(item => {

                        if (
                            item &&
                            typeof item === "object"
                        ) {

                            if (
                                subjectMatches(item)
                            ) {
                                inspect(item);
                            }

                        } else {
                            inspect(item);
                        }
                    });

                } else {

                    inspect(value);
                }
            }
        });
    }

    inspect(plan);

    console.log(
        `Computer Battle topics for ${selectedSubject}:`,
        topics
    );

    return topics;
}

/* =========================================================
   FALLBACK TOPICS
========================================================= */

function getFallbackTopics(subject) {

    const normalized =
        normalizeBattleText(
            subject
        );

    if (
        normalized.includes("math") ||
        normalized.includes("mathematics")
    ) {

        return [
            "Algebra",
            "Geometry",
            "Percentages",
            "Number",
            "Statistics"
        ];
    }

    if (
        normalized.includes("physics")
    ) {

        return [
            "Motion",
            "Forces",
            "Energy",
            "Waves",
            "Electricity"
        ];
    }

    if (
        normalized.includes("chemistry")
    ) {

        return [
            "Atomic Structure",
            "Chemical Bonding",
            "Acids and Bases",
            "Periodic Table",
            "Chemical Reactions"
        ];
    }

    if (
        normalized.includes("biology")
    ) {

        return [
            "Cell Biology",
            "Nutrition",
            "Respiration",
            "Genetics",
            "Ecology"
        ];
    }

    if (
        normalized.includes("economics")
    ) {

        return [
            "Demand and Supply",
            "Production",
            "Market",
            "National Income",
            "Inflation"
        ];
    }

    if (
        normalized.includes("government")
    ) {

        return [
            "Democracy",
            "Constitution",
            "Political Parties",
            "Citizenship",
            "Government Institutions"
        ];
    }

    if (
        normalized.includes("geography")
    ) {

        return [
            "Weather and Climate",
            "Population",
            "Resources",
            "Map Reading",
            "Environmental Issues"
        ];
    }

    if (
        normalized.includes("english")
    ) {

        return [
            "Grammar",
            "Comprehension",
            "Vocabulary",
            "Parts of Speech",
            "Sentence Structure"
        ];
    }

    return [
        "General Knowledge"
    ];
}

/* =========================================================
   LOAD SETUP
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
            "Computer Battle setup elements were not found."
        );

        return;
    }

    subjectSelect.innerHTML =
        `<option value="">Loading subjects...</option>`;

    topicSelect.innerHTML =
        `<option value="">Select a subject first</option>`;

    const plan =
        getStudyPlan();

    let subjects =
        extractSubjects(plan);

    /*
       If the study plan is unavailable,
       use Math so the battle page remains usable.
    */

    if (!subjects.length) {

        console.warn(
            "No subjects found in study plan. Using Math fallback."
        );

        subjects = [
            "Math"
        ];
    }

    subjectSelect.innerHTML =
        `<option value="">Select a subject</option>` +
        subjects
            .map(
                subject => `
                    <option value="${escapeHTML(subject)}">
                        ${escapeHTML(subject)}
                    </option>
                `
            )
            .join("");

    /*
       Automatically select the first actual
       subject so the topic dropdown can populate.
    */

    subjectSelect.value =
        subjects[0];

    updateTopicOptions();

    console.log(
        "Computer Battle setup loaded successfully."
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

    topicSelect.innerHTML =
        `<option value="">Loading topics...</option>`;

    const plan =
        getStudyPlan();

    let topics =
        extractTopics(
            plan,
            subject
        );

    /*
       If the plan doesn't contain topics
       in a recognizable structure, use
       subject-specific fallback topics.
    */

    if (!topics.length) {

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
                    <option value="${escapeHTML(topic)}">
                        ${escapeHTML(topic)}
                    </option>
                `
            )
            .join("");

    /*
       Automatically select the first topic.
    */

    if (topics.length) {

        topicSelect.value =
            topics[0];
    }
}

/* =========================================================
   ERROR MESSAGE
========================================================= */

function showBattleError(message) {

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

    element.textContent = "";

    element.classList.remove(
        "active"
    );
}

/* =========================================================
   LOADING SCREEN
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
           Ask the AI to generate the questions.
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
                `AI returned ${questions.length} valid questions.`
            );

        } catch (aiError) {

            console.warn(
                "AI question generation failed:",
                aiError
            );
        }

        /*
           Fallback only if AI could not
           provide the required 10 questions.
        */

        if (
            questions.length <
            QUESTIONS_PER_BATTLE
        ) {

            console.warn(
                "Using fallback battle questions."
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

                body: JSON.stringify({

                    /*
                       IMPORTANT:
                       These fields tell the API that
                       this is a Game Mode request.
                    */

                    mode: "game",

                    type: "game_questions",

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

    /*
       Main expected response:
       {
           questions: [...]
       }
    */

    if (
        data &&
        Array.isArray(
            data.questions
        )
    ) {

        return data.questions;
    }

    /*
       Support nested responses.
    */

    if (
        data &&
        data.data &&
        Array.isArray(
            data.data.questions
        )
    ) {

        return data.data.questions;
    }

    /*
       Support direct array response.
    */

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
        !Array.isArray(questions)
    ) {
        return [];
    }

    return questions
        .map(item => {

            if (
                !item ||
                typeof item !== "object"
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
                !Array.isArray(options)
            ) {
                return null;
            }

            options =
                options
                    .map(option => {

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
                    })
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
               Convert A/B/C/D.
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
                    letters.includes(clean)
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
                Number(answer);

            if (
                !Number.isInteger(answer) ||
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
   FALLBACK QUESTION GENERATOR
========================================================= */

function createFallbackQuestions() {

    const shuffled =
        shuffleArray(
            FALLBACK_QUESTIONS
        );

    const result = [];

    while (
        result.length <
        QUESTIONS_PER_BATTLE
    ) {

        const source =
            shuffled[
                result.length %
                shuffled.length
            ];

        result.push({

            question:
                source.question,

            options:
                [...source.options],

            answer:
                source.answer
        });
    }

    return result;
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
            `Question ${index + 1} of ${QUESTIONS_PER_BATTLE}`;
    }

    if (questionTopic) {

        questionTopic.textContent =
            `${computerBattleState.selectedSubject} • ${computerBattleState.selectedTopic}`;
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
            `${(index / QUESTIONS_PER_BATTLE) * 100}%`;
    }

    if (answerGrid) {

        answerGrid.innerHTML = "";

        const letters = [
            "A",
            "B",
            "C",
            "D"
        ];

        letters.forEach(
            (letter, optionIndex) => {

                const button =
                    document.createElement(
                        "button"
                    );

                button.type =
                    "button";

                button.className =
                    "answer-button";

                button.dataset.index =
                    String(optionIndex);

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
        setInterval(() => {

            computerBattleState.timeRemaining--;

            updateTimerDisplay();

            if (
                computerBattleState.timeRemaining <= 0
            ) {

                clearTimer();

                handleTimeout();
            }

        }, 1000);
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
            computerBattleState.timeRemaining <= 7
        );

        container.classList.toggle(
            "danger",
            computerBattleState.timeRemaining <= 3
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

    setTimeout(() => {

        if (
            computerBattleState.battleActive
        ) {

            computerTakeTurn(
                correct
            );
        }

    }, 700);
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

    setTimeout(() => {

        if (
            computerBattleState.battleActive
        ) {

            computerTakeTurn(
                false
            );
        }

    }, 700);
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
            (button, index) => {

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

    setTimeout(() => {

        if (
            computerBattleState.battleActive
        ) {

            moveToNextQuestion();
        }

    }, 450);
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

    if (result === "win") {

        points = 100;

    } else if (result === "draw") {

        points = 50;

    } else {

        points = 20;
    }

    points +=
        (Number(playerScore) || 0) * 5;

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
       Update local battle count.
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
       Update Supabase leaderboard.
    */

    if (!computerBattleSupabase) {
        return;
    }

    try {

        const {
            data: { user },
            error: userError
        } =
            await computerBattleSupabase
                .auth
                .getUser();

        if (
            userError ||
            !user
        ) {
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
            user.email?.split("@")[0] ||
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
                    result === "win"
                        ? 1
                        : 0
                ),

            losses:
                losses +
                (
                    result === "loss"
                        ? 1
                        : 0
                ),

            draws:
                draws +
                (
                    result === "draw"
                        ? 1
                        : 0
                ),

            battles_played:
                battlesPlayed + 1,

            updated_at:
                new Date().toISOString()
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
   RESULTS SCREEN
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

    if (result === "win") {

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

    } else if (result === "draw") {

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

    if (!computerBattleSupabase) {
        return true;
    }

    try {

        const {
            data: { user },
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

            return false;
        }

        if (!user) {

            window.location.href =
                "login.html";

            return false;
        }

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

        subjectSelect.addEventListener(
            "change",
            updateTopicOptions
        );
    }

    updateScoreDisplay();
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

/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeComputerBattle
);
