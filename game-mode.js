/* =========================================================
   STUDYMIND AI — GAME MODE
   Complete Battle Arena JavaScript
========================================================= */


/* =========================================================
   CONFIGURATION
========================================================= */

const FREE_BATTLE_LIMIT = 5;
const TOTAL_BATTLE_QUESTIONS = 10;
const QUESTION_TIME_LIMIT = 15;

const STORAGE_KEYS = {
    battleCount: "studyMindBattleCount",
    battlePoints: "studyMindBattlePoints",
    battleHistory: "studyMindBattleHistory",
    studyPlan: "studyMindPlan",
    oldStudyData: "studyData",
    theme: "studyMindTheme"
};


/* =========================================================
   STATE
========================================================= */

let studyPlan = null;

let currentUser = null;
let isAuthenticated = false;

let battleQuestions = [];
let currentQuestionIndex = 0;

let playerScore = 0;
let computerScore = 0;
let battlePointsEarned = 0;

let battleTimerInterval = null;
let battleTimeRemaining = QUESTION_TIME_LIMIT;

let battleActive = false;
let questionAnswered = false;

let selectedTopic = null;
let selectedDifficulty = "mixed";

let computerTimer = null;


/* =========================================================
   DOM HELPERS
========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   SAFE STORAGE HELPERS
========================================================= */

function getNumber(key, fallback = 0) {

    const value = Number(
        localStorage.getItem(key)
    );

    if (
        Number.isFinite(value) &&
        value >= 0
    ) {
        return value;
    }

    return fallback;
}


function setNumber(key, value) {

    localStorage.setItem(
        key,
        String(
            Math.max(
                0,
                Number(value) || 0
            )
        )
    );
}


function loadObject(key) {

    try {

        const value =
            JSON.parse(
                localStorage.getItem(key)
            );

        return value &&
            typeof value === "object"
            ? value
            : null;

    } catch {

        return null;

    }
}


function loadArray(key) {

    try {

        const value =
            JSON.parse(
                localStorage.getItem(key)
            );

        return Array.isArray(value)
            ? value
            : [];

    } catch {

        return [];

    }
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   STUDY PLAN NORMALIZATION
========================================================= */

function normalizeStudyPlan(rawPlan) {

    if (
        !rawPlan ||
        typeof rawPlan !== "object"
    ) {
        return null;
    }


    let subjects = [];

    if (Array.isArray(rawPlan.subjects)) {

        subjects =
            rawPlan.subjects
                .map(subject => {

                    if (
                        typeof subject === "string"
                    ) {
                        return subject.trim();
                    }

                    if (
                        subject &&
                        typeof subject === "object"
                    ) {
                        return String(
                            subject.name ??
                            subject.subject ??
                            subject.title ??
                            ""
                        ).trim();
                    }

                    return "";

                })
                .filter(Boolean);

    } else if (
        typeof rawPlan.subjects === "string"
    ) {

        subjects =
            rawPlan.subjects
                .split(/[,\n;]/)
                .map(item => item.trim())
                .filter(Boolean);

    }


    let rawTopics = [];

    if (Array.isArray(rawPlan.topics)) {

        rawTopics =
            rawPlan.topics;

    } else if (
        typeof rawPlan.topics === "string"
    ) {

        rawTopics =
            rawPlan.topics
                .split(/[\n,;]/)
                .map(item => item.trim())
                .filter(Boolean);

    }


    const topics =
        rawTopics
            .map((topic, index) => {

                if (
                    typeof topic === "string"
                ) {

                    return {
                        id: index + 1,
                        name: topic.trim(),
                        subject: "",
                        description: "",
                        status: "Not Started"
                    };

                }


                if (
                    topic &&
                    typeof topic === "object"
                ) {

                    return {

                        ...topic,

                        id:
                            topic.id ??
                            topic.topicId ??
                            index + 1,

                        name:
                            String(
                                topic.name ??
                                topic.topic ??
                                topic.title ??
                                topic.topicName ??
                                `Topic ${index + 1}`
                            ).trim(),

                        subject:
                            String(
                                topic.subject ??
                                ""
                            ).trim(),

                        description:
                            String(
                                topic.description ??
                                topic.desc ??
                                topic.details ??
                                ""
                            ).trim(),

                        status:
                            String(
                                topic.status ??
                                "Not Started"
                            )

                    };

                }


                return null;

            })
            .filter(Boolean);


    const rawHours =
        rawPlan.studyHours ??
        rawPlan.hoursPerDay ??
        rawPlan.hours ??
        0;


    const parsedHours =
        Number(rawHours);


    return {

        ...rawPlan,

        examType:
            rawPlan.examType ??
            rawPlan.exam ??
            rawPlan.testType ??
            "",

        examDate:
            rawPlan.examDate ??
            null,

        subjects,

        topics,

        studyHours:
            Number.isFinite(parsedHours)
                ? parsedHours
                : 0,

        hoursPerDay:
            Number.isFinite(parsedHours)
                ? parsedHours
                : 0,

        difficulty:
            rawPlan.difficulty ??
            "balanced"

    };

}


/* =========================================================
   LOAD STUDY PLAN
========================================================= */

function loadStudyPlan() {

    const newPlan =
        normalizeStudyPlan(
            loadObject(
                STORAGE_KEYS.studyPlan
            )
        );


    const oldPlan =
        normalizeStudyPlan(
            loadObject(
                STORAGE_KEYS.oldStudyData
            )
        );


    function isUsable(plan) {

        if (!plan) {
            return false;
        }

        return (
            Array.isArray(plan.subjects) &&
            plan.subjects.length > 0 &&
            Array.isArray(plan.topics) &&
            plan.topics.length > 0
        );

    }


    if (isUsable(newPlan)) {

        studyPlan = newPlan;

    } else if (isUsable(oldPlan)) {

        studyPlan = oldPlan;

    } else {

        studyPlan =
            newPlan ||
            oldPlan ||
            {

                subjects: [],
                topics: [],
                examDate: null,
                studyHours: 0

            };

    }


    return studyPlan;

}


/* =========================================================
   TOPIC HELPERS
========================================================= */

function getTopicName(topic) {

    if (
        typeof topic === "string"
    ) {
        return topic.trim();
    }


    if (
        topic &&
        typeof topic === "object"
    ) {

        return String(
            topic.name ??
            topic.topic ??
            topic.title ??
            topic.topicName ??
            "Untitled Topic"
        ).trim();

    }


    return "Untitled Topic";

}


function getTopicSubject(topic) {

    if (
        topic &&
        typeof topic === "object"
    ) {

        return String(
            topic.subject ?? ""
        ).trim();

    }

    return "";

}


function getTopicDescription(topic) {

    if (
        topic &&
        typeof topic === "object"
    ) {

        return String(
            topic.description ??
            topic.desc ??
            topic.details ??
            ""
        ).trim();

    }

    return "";

}


/* =========================================================
   BATTLE USAGE
========================================================= */

function getBattleCount() {

    return getNumber(
        STORAGE_KEYS.battleCount,
        0
    );

}


function getBattlesRemaining() {

    return Math.max(
        0,
        FREE_BATTLE_LIMIT -
        getBattleCount()
    );

}


function incrementBattleCount() {

    const count =
        getBattleCount() + 1;

    setNumber(
        STORAGE_KEYS.battleCount,
        count
    );

    return count;

}


/* =========================================================
   PREMIUM DETECTION
========================================================= */

function isPremiumUser() {

    const possibleValues = [

        localStorage.getItem(
            "studyMindPremium"
        ),

        localStorage.getItem(
            "isPremium"
        ),

        localStorage.getItem(
            "premiumUser"
        ),

        localStorage.getItem(
            "studyMindSubscription"
        )

    ];


    return possibleValues.some(
        value =>
            value === "true" ||
            value === "premium" ||
            value === "active"
    );

}


/* =========================================================
   CAN PLAY?
========================================================= */

function canPlayBattle() {

    if (isPremiumUser()) {
        return true;
    }

    return (
        getBattleCount() <
        FREE_BATTLE_LIMIT
    );

}


/* =========================================================
   UPDATE BATTLE STATUS
========================================================= */

function updateBattleStatus() {

    const used =
        getBattleCount();

    const remaining =
        getBattlesRemaining();


    const usedElement =
        $("battlesUsed");

    const limitElement =
        $("battleLimit");

    const statusElement =
        $("battleStatusText");

    const startButton =
        $("startBattleButton");

    const computerButton =
        $("computerModeButton");

    const premiumCard =
        $("premiumBattleCard");


    if (usedElement) {

        usedElement.textContent =
            isPremiumUser()
                ? "∞"
                : used;

    }


    if (limitElement) {

        limitElement.textContent =
            isPremiumUser()
                ? "∞"
                : FREE_BATTLE_LIMIT;

    }


    if (statusElement) {

        if (isPremiumUser()) {

            statusElement.textContent =
                "Unlimited battles available";

        } else if (remaining <= 0) {

            statusElement.textContent =
                "Free battle limit reached";

        } else {

            statusElement.textContent =
                `${remaining} ${
                    remaining === 1
                        ? "battle"
                        : "battles"
                } remaining`;

        }

    }


    if (startButton) {

        if (
            !isPremiumUser() &&
            remaining <= 0
        ) {

            startButton.disabled = true;

            startButton.textContent =
                "🔒 Premium Required";

        } else {

            startButton.disabled = false;

            startButton.textContent =
                "⚔️ Start Battle";

        }

    }


    if (computerButton) {

        if (
            !isPremiumUser() &&
            remaining <= 0
        ) {

            computerButton.classList.add(
                "limit-reached"
            );

        } else {

            computerButton.classList.remove(
                "limit-reached"
            );

        }

    }


    if (premiumCard) {

        premiumCard.style.display =
            isPremiumUser()
                ? "none"
                : "";

    }


    updateBattlePoints();

}


/* =========================================================
   LOAD TOPICS INTO SELECT
========================================================= */

function populateTopics() {

    const select =
        $("battleTopic");

    if (!select) {
        return;
    }


    select.innerHTML = "";


    if (
        !studyPlan ||
        !Array.isArray(
            studyPlan.topics
        ) ||
        studyPlan.topics.length === 0
    ) {

        const option =
            document.createElement(
                "option"
            );

        option.value = "";

        option.textContent =
            "No study topics available";

        select.appendChild(option);

        return;

    }


    const defaultOption =
        document.createElement(
            "option"
        );

    defaultOption.value = "";

    defaultOption.textContent =
        "Choose a topic";

    select.appendChild(
        defaultOption
    );


    studyPlan.topics.forEach(
        (topic, index) => {

            const name =
                getTopicName(topic);

            const subject =
                getTopicSubject(topic);


            const option =
                document.createElement(
                    "option"
                );

            option.value =
                String(index);

            option.textContent =
                subject
                    ? `${subject} — ${name}`
                    : name;

            select.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   DEFAULT TOPIC
========================================================= */

function selectFirstTopicIfNeeded() {

    const select =
        $("battleTopic");

    if (!select) {
        return;
    }


    if (
        select.options.length > 1 &&
        !select.value
    ) {

        select.value = "0";

    }

}


/* =========================================================
   OPEN COMPUTER BATTLE
========================================================= */

function startComputerBattle() {

    if (!canPlayBattle()) {

        showPremiumLimitMessage();

        return;

    }


    const setup =
        $("battleSetup");

    if (setup) {

        setup.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }


    selectFirstTopicIfNeeded();


    const select =
        $("battleTopic");

    if (select && select.value) {

        selectedTopic =
            studyPlan.topics[
                Number(select.value)
            ];

    }

}


/* =========================================================
   PREMIUM LIMIT MESSAGE
========================================================= */

function showPremiumLimitMessage() {

    const status =
        $("battleStatusText");

    if (status) {

        status.textContent =
            "You've used all 5 free battles.";

    }


    const setup =
        $("battleSetup");

    if (!setup) {
        return;
    }


    let message =
        document.getElementById(
            "battleLimitMessage"
        );


    if (!message) {

        message =
            document.createElement(
                "div"
            );

        message.id =
            "battleLimitMessage";

        message.style.marginTop =
            "15px";

        message.style.padding =
            "15px";

        message.style.borderRadius =
            "12px";

        message.style.background =
            "rgba(124, 58, 237, 0.10)";

        message.style.border =
            "1px solid rgba(124, 58, 237, 0.25)";

        message.style.color =
            "#c4b5fd";

        message.style.textAlign =
            "center";

        setup.appendChild(
            message
        );

    }


    message.innerHTML = `
        <strong>⭐ You've used all 5 free battles.</strong>
        <br>
        Upgrade to Premium to keep playing unlimited battles.
        <br><br>
        <button
            type="button"
            onclick="openPremium()"
            style="
                border:0;
                border-radius:9px;
                padding:9px 15px;
                background:#7c3aed;
                color:#fff;
                font-weight:700;
                cursor:pointer;
            "
        >
            ⭐ Go Premium
        </button>
    `;

}


/* =========================================================
   BEGIN BATTLE
========================================================= */

async function beginBattle() {

    if (!canPlayBattle()) {

        showPremiumLimitMessage();

        return;

    }


    const topicSelect =
        $("battleTopic");

    const difficultySelect =
        $("battleDifficulty");


    if (!topicSelect) {
        return;
    }


    const selectedIndex =
        Number(
            topicSelect.value
        );


    if (
        !Number.isInteger(
            selectedIndex
        ) ||
        !studyPlan ||
        !Array.isArray(
            studyPlan.topics
        ) ||
        !studyPlan.topics[
            selectedIndex
        ]
    ) {

        alert(
            "Please choose a topic before starting the battle."
        );

        return;

    }


    selectedTopic =
        studyPlan.topics[
            selectedIndex
        ];


    selectedDifficulty =
        difficultySelect
            ? difficultySelect.value
            : "mixed";


    const startButton =
        $("startBattleButton");


    if (startButton) {

        startButton.disabled = true;

        startButton.textContent =
            "🤖 Preparing Battle...";

    }


    try {

        const questions =
            await generateBattleQuestions(
                selectedTopic,
                selectedDifficulty
            );


        if (
            !Array.isArray(questions) ||
            questions.length < TOTAL_BATTLE_QUESTIONS
        ) {

            throw new Error(
                "StudyMind AI did not return enough questions."
            );

        }


        battleQuestions =
            questions.slice(
                0,
                TOTAL_BATTLE_QUESTIONS
            );


        /*
         * Count the battle only after
         * questions have successfully loaded.
         */
        incrementBattleCount();


        playerScore = 0;
        computerScore = 0;
        battlePointsEarned = 0;

        currentQuestionIndex = 0;

        battleActive = true;
        questionAnswered = false;


        hideBattleSetup();
        hideBattleResults();
        showBattleArena();

        updateBattleScores();
        renderCurrentQuestion();

        updateBattleStatus();

    } catch (error) {

        console.error(
            "Battle generation error:",
            error
        );


        alert(
            error.message ||
            "We couldn't prepare the battle. Please try again."
        );


        if (startButton) {

            startButton.disabled =
                false;

            startButton.textContent =
                "⚔️ Start Battle";

        }

    }

}


/* =========================================================
   GENERATE BATTLE QUESTIONS
========================================================= */

async function generateBattleQuestions(
    topic,
    difficulty
) {

    const topicName =
        getTopicName(topic);

    const subject =
        getTopicSubject(topic);

    const description =
        getTopicDescription(topic);


    /*
     * Try the existing StudyMind AI API first.
     */
    try {

        const response =
            await fetch(
                "/api/chat",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            message: `
You are StudyMind AI, an educational quiz generator.

Create exactly 10 multiple-choice questions for a secondary-school student.

Topic:
${topicName}

Subject:
${subject || "Not specified"}

Topic description:
${description || "Not specified"}

Difficulty:
${difficulty}

Requirements:

- Exactly 10 questions.
- Exactly 4 options per question.
- Only one correct answer per question.
- Questions must genuinely test understanding.
- Do not make questions ambiguous.
- Keep questions appropriate for a secondary-school student.
- If a subject/curriculum is known, make the questions relevant to it.
- Do not include explanations.
- Return ONLY valid JSON.
- Do not use Markdown.
- The "answer" field must be the zero-based index of the correct option.

Return exactly this structure:

[
  {
    "question": "Question text",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "answer": 0
  }
]
                            `

                        })

                }
            );


        if (!response.ok) {

            throw new Error(
                `AI request failed with status ${response.status}.`
            );

        }


        const data =
            await response.json();


        if (
            !data ||
            !data.reply
        ) {

            throw new Error(
                "The AI returned an empty response."
            );

        }


        const questions =
            parseAIQuestions(
                data.reply
            );


        if (
            questions.length >=
            TOTAL_BATTLE_QUESTIONS
        ) {

            return questions;

        }


        throw new Error(
            "The AI did not return 10 valid questions."
        );


    } catch (error) {

        console.error(
            "AI battle question error:",
            error
        );


        /*
         * We intentionally do NOT create fake
         * educational questions as a fallback.
         * A real StudyMind battle should be based
         * on the student's selected topic.
         */

        throw new Error(
            "StudyMind AI couldn't prepare the battle questions right now. Please try again."
        );

    }

}


/* =========================================================
   CLEAN AI RESPONSE
========================================================= */

function cleanAIJSON(text) {

    let cleaned =
        String(text ?? "")
            .trim();


    cleaned =
        cleaned.replace(
            /^```json\s*/i,
            ""
        );


    cleaned =
        cleaned.replace(
            /^```\s*/i,
            ""
        );


    cleaned =
        cleaned.replace(
            /\s*```$/i,
            ""
        );


    const first =
        cleaned.indexOf("[");


    const last =
        cleaned.lastIndexOf("]");


    if (
        first !== -1 &&
        last !== -1 &&
        last > first
    ) {

        cleaned =
            cleaned.substring(
                first,
                last + 1
            );

    }


    return cleaned.trim();

}


/* =========================================================
   PARSE AI QUESTIONS
========================================================= */

function parseAIQuestions(text) {

    const cleaned =
        cleanAIJSON(text);


    let parsed;


    try {

        parsed =
            JSON.parse(
                cleaned
            );

    } catch (error) {

        console.error(
            "Could not parse AI JSON:",
            error
        );

        throw new Error(
            "StudyMind AI returned an invalid question format."
        );

    }


    if (
        !Array.isArray(parsed)
    ) {

        throw new Error(
            "StudyMind AI returned an invalid question list."
        );

    }


    return parsed
        .map(question => {

            if (
                !question ||
                typeof question !== "object"
            ) {
                return null;
            }


            const questionText =
                String(
                    question.question ??
                    ""
                ).trim();


            const options =
                Array.isArray(
                    question.options
                )
                    ? question.options
                        .map(option =>
                            String(
                                option ?? ""
                            ).trim()
                        )
                    : [];


            let answer =
                Number(
                    question.answer
                );


            /*
             * Support AI responses that use
             * "correctAnswer" or "correct".
             */
            if (
                !Number.isInteger(answer)
            ) {

                const possibleAnswer =
                    question.correctAnswer ??
                    question.correct;

                if (
                    typeof possibleAnswer ===
                    "string"
                ) {

                    const answerIndex =
                        options.findIndex(
                            option =>
                                option.toLowerCase() ===
                                possibleAnswer
                                    .trim()
                                    .toLowerCase()
                        );

                    if (
                        answerIndex !== -1
                    ) {

                        answer =
                            answerIndex;

                    }

                }

            }


            if (
                !questionText ||
                options.length !== 4 ||
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

                answer

            };

        })
        .filter(Boolean);

}


/* =========================================================
   SHOW / HIDE SECTIONS
========================================================= */

function showBattleArena() {

    const arena =
        $("battleArena");

    if (arena) {

        arena.hidden = false;

        arena.style.display =
            "";

        arena.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }

}


function hideBattleArena() {

    const arena =
        $("battleArena");

    if (arena) {

        arena.hidden = true;

        arena.style.display =
            "none";

    }

}


function showBattleResults() {

    const results =
        $("battleResults");

    if (results) {

        results.hidden = false;

        results.style.display =
            "";

        results.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }

}


function hideBattleResults() {

    const results =
        $("battleResults");

    if (results) {

        results.hidden = true;

        results.style.display =
            "none";

    }

}


function hideBattleSetup() {

    const setup =
        $("battleSetup");

    if (setup) {

        setup.hidden = true;

        setup.style.display =
            "none";

    }

}


function showBattleSetup() {

    const setup =
        $("battleSetup");

    if (setup) {

        setup.hidden = false;

        setup.style.display =
            "";

    }

}


/* =========================================================
   RENDER CURRENT QUESTION
========================================================= */

function renderCurrentQuestion() {

    if (
        !battleActive ||
        !battleQuestions.length
    ) {
        return;
    }


    const question =
        battleQuestions[
            currentQuestionIndex
        ];


    if (!question) {

        finishBattle();

        return;

    }


    questionAnswered = false;


    const questionNumber =
        $("currentQuestionNumber");

    const questionText =
        $("battleQuestion");

    const questionTopic =
        $("battleQuestionTopic");

    const answerGrid =
        $("answerGrid");


    if (questionNumber) {

        questionNumber.textContent =
            currentQuestionIndex + 1;

    }


    if (questionText) {

        questionText.textContent =
            question.question;

    }


    if (questionTopic) {

        const topicName =
            getTopicName(
                selectedTopic
            );

        questionTopic.textContent =
            topicName;

    }


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

            button.dataset.answerIndex =
                String(index);


            button.addEventListener(
                "click",
                () =>
                    handleAnswer(index)
            );


            answerGrid.appendChild(
                button
            );

        }
    );


    startQuestionTimer();

}


/* =========================================================
   QUESTION TIMER
========================================================= */

function startQuestionTimer() {

    stopQuestionTimer();


    battleTimeRemaining =
        QUESTION_TIME_LIMIT;


    updateBattleTimer();


    battleTimerInterval =
        setInterval(
            () => {

                battleTimeRemaining--;

                updateBattleTimer();


                if (
                    battleTimeRemaining <= 0
                ) {

                    stopQuestionTimer();

                    handleAnswer(
                        null,
                        true
                    );

                }

            },
            1000
        );

}


/* =========================================================
   STOP TIMER
========================================================= */

function stopQuestionTimer() {

    if (
        battleTimerInterval
    ) {

        clearInterval(
            battleTimerInterval
        );

        battleTimerInterval =
            null;

    }

}


/* =========================================================
   UPDATE TIMER
========================================================= */

function updateBattleTimer() {

    const timer =
        $("battleTimer");

    if (timer) {

        timer.textContent =
            Math.max(
                0,
                battleTimeRemaining
            );

    }

}


/* =========================================================
   HANDLE ANSWER
========================================================= */

function handleAnswer(
    selectedAnswer,
    timedOut = false
) {

    if (
        questionAnswered ||
        !battleActive
    ) {
        return;
    }


    questionAnswered = true;


    stopQuestionTimer();


    const question =
        battleQuestions[
            currentQuestionIndex
        ];


    if (!question) {
        return;
    }


    const buttons =
        document.querySelectorAll(
            "#answerGrid .answer-button"
        );


    buttons.forEach(
        button => {

            button.disabled =
                true;

        }
    );


    const correctAnswer =
        Number(
            question.answer
        );


    if (
        Number.isInteger(
            selectedAnswer
        ) &&
        selectedAnswer ===
        correctAnswer
    ) {

        playerScore++;

        const selectedButton =
            buttons[
                selectedAnswer
            ];

        if (selectedButton) {

            selectedButton.classList.add(
                "correct"
            );

        }

    } else {

        if (
            Number.isInteger(
                selectedAnswer
            )
        ) {

            const selectedButton =
                buttons[
                    selectedAnswer
                ];

            if (selectedButton) {

                selectedButton.classList.add(
                    "incorrect"
                );

            }

        }


        const correctButton =
            buttons[
                correctAnswer
            ];

        if (correctButton) {

            correctButton.classList.add(
                "correct"
            );

        }

    }


    updateBattleScores();


    /*
     * Give the computer a result for the same
     * question. The computer has a chance of
     * answering correctly.
     */
    simulateComputerAnswer(
        question
    );


    setTimeout(
        () => {

            if (!battleActive) {
                return;
            }


            currentQuestionIndex++;


            if (
                currentQuestionIndex >=
                battleQuestions.length
            ) {

                finishBattle();

            } else {

                renderCurrentQuestion();

            }

        },
        timedOut ? 850 : 900
    );

}


/* =========================================================
   COMPUTER OPPONENT
========================================================= */

function simulateComputerAnswer(
    question
) {

    if (computerTimer) {

        clearTimeout(
            computerTimer
        );

    }


    /*
     * The computer should feel competitive
     * but not perfect.
     *
     * Difficulty affects its accuracy.
     */
    let accuracy = 0.62;


    if (
        selectedDifficulty ===
        "easy"
    ) {

        accuracy = 0.50;

    } else if (
        selectedDifficulty ===
        "medium"
    ) {

        accuracy = 0.65;

    } else if (
        selectedDifficulty ===
        "hard"
    ) {

        accuracy = 0.78;

    } else {

        accuracy = 0.64;

    }


    const computerCorrect =
        Math.random() <
        accuracy;


    computerTimer =
        setTimeout(
            () => {

                if (
                    !battleActive
                ) {
                    return;
                }


                if (
                    computerCorrect
                ) {

                    computerScore++;

                }


                updateBattleScores();

            },
            350 +
            Math.random() * 650
        );

}


/* =========================================================
   UPDATE SCORE DISPLAY
========================================================= */

function updateBattleScores() {

    const player =
        $("playerScore");

    const computer =
        $("computerScore");


    if (player) {

        player.textContent =
            playerScore;

    }


    if (computer) {

        computer.textContent =
            computerScore;

    }

}


/* =========================================================
   CALCULATE POINTS
========================================================= */

function calculateBattlePoints() {

    /*
     * Base points:
     * 10 points per correct answer.
     *
     * Winning gives a bonus.
     * Drawing gives a smaller bonus.
     */
    let points =
        playerScore * 10;


    if (
        playerScore >
        computerScore
    ) {

        points += 50;

    } else if (
        playerScore ===
        computerScore
    ) {

        points += 20;

    }


    return points;

}


/* =========================================================
   FINISH BATTLE
========================================================= */

function finishBattle() {

    if (!battleActive) {
        return;
    }


    battleActive = false;


    stopQuestionTimer();


    if (computerTimer) {

        clearTimeout(
            computerTimer
        );

        computerTimer =
            null;

    }


    battlePointsEarned =
        calculateBattlePoints();


    saveBattlePoints(
        battlePointsEarned
    );


    saveBattleHistory();


    updateResultScreen();


    hideBattleArena();

    showBattleResults();

    updateBattleStatus();

}


/* =========================================================
   RESULT SCREEN
========================================================= */

function updateResultScreen() {

    const title =
        $("battleResultTitle");

    const message =
        $("battleResultMessage");

    const finalPlayer =
        $("finalPlayerScore");

    const finalComputer =
        $("finalComputerScore");

    const points =
        $("pointsEarned");


    if (finalPlayer) {

        finalPlayer.textContent =
            playerScore;

    }


    if (finalComputer) {

        finalComputer.textContent =
            computerScore;

    }


    if (points) {

        points.textContent =
            `+${battlePointsEarned}`;

    }


    if (
        playerScore >
        computerScore
    ) {

        if (title) {

            title.textContent =
                "🏆 Victory!";

        }

        if (message) {

            message.textContent =
                `You defeated the computer ${playerScore}–${computerScore}. Great work!`;

        }

    } else if (
        playerScore <
        computerScore
    ) {

        if (title) {

            title.textContent =
                "💪 Good Battle!";

        }

        if (message) {

            message.textContent =
                `The computer won ${computerScore}–${playerScore}. Keep studying and come back stronger.`;

        }

    } else {

        if (title) {

            title.textContent =
                "🤝 It's a Draw!";

        }

        if (message) {

            message.textContent =
                `You and the computer both scored ${playerScore}.`;

        }

    }

}


/* =========================================================
   BATTLE POINTS
========================================================= */

function getBattlePoints() {

    return getNumber(
        STORAGE_KEYS.battlePoints,
        0
    );

}


function saveBattlePoints(points) {

    const total =
        getBattlePoints() +
        Math.max(
            0,
            Number(points) || 0
        );


    setNumber(
        STORAGE_KEYS.battlePoints,
        total
    );

}


function updateBattlePoints() {

    const points =
        getBattlePoints();


    const pointsElement =
        $("yourBattlePoints");

    if (pointsElement) {

        pointsElement.textContent =
            points;

    }

}


/* =========================================================
   BATTLE HISTORY
========================================================= */

function saveBattleHistory() {

    const history =
        loadArray(
            STORAGE_KEYS.battleHistory
        );


    history.push({

        date:
            new Date().toISOString(),

        topic:
            getTopicName(
                selectedTopic
            ),

        playerScore,

        computerScore,

        points:
            battlePointsEarned

    });


    /*
     * Keep the most recent 50 battles.
     */
    const trimmed =
        history.slice(-50);


    localStorage.setItem(
        STORAGE_KEYS.battleHistory,
        JSON.stringify(
            trimmed
        )
    );

}


/* =========================================================
   RESET / PLAY AGAIN
========================================================= */

function resetBattle() {

    stopQuestionTimer();


    if (computerTimer) {

        clearTimeout(
            computerTimer
        );

        computerTimer =
            null;

    }


    battleQuestions = [];

    currentQuestionIndex = 0;

    playerScore = 0;

    computerScore = 0;

    battlePointsEarned = 0;

    battleActive = false;

    questionAnswered = false;


    hideBattleArena();
    hideBattleResults();

    showBattleSetup();


    const startButton =
        $("startBattleButton");

    if (startButton) {

        startButton.disabled =
            !canPlayBattle();

        startButton.textContent =
            canPlayBattle()
                ? "⚔️ Start Battle"
                : "🔒 Premium Required";

    }


    updateBattleStatus();


    const setup =
        $("battleSetup");

    if (setup) {

        setup.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

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
        "home.html#generator";

}


function openSummarizer() {

    /*
     * Support common StudyMind page names.
     */
    const candidates = [
        "summarizer.html",
        "home.html#summarizer",
        "dashboard.html#summarizer"
    ];


    /*
     * Prefer the dedicated page if it exists.
     * The browser will handle the navigation.
     */
    window.location.href =
        candidates[0];

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

    /*
     * If your project later gets a dedicated
     * premium page, this can be changed to
     * premium.html.
     *
     * For now we show a professional message
     * instead of sending the student somewhere
     * that may not exist.
     */

    let message =
        document.getElementById(
            "premiumMessage"
        );


    if (!message) {

        message =
            document.createElement(
                "div"
            );

        message.id =
            "premiumMessage";

        message.style.position =
            "fixed";

        message.style.inset =
            "0";

        message.style.zIndex =
            "9999";

        message.style.display =
            "flex";

        message.style.alignItems =
            "center";

        message.style.justifyContent =
            "center";

        message.style.padding =
            "20px";

        message.style.background =
            "rgba(2, 6, 23, 0.78)";

        message.style.backdropFilter =
            "blur(8px)";


        message.innerHTML = `

            <div
                style="
                    width:min(450px,100%);
                    padding:30px;
                    border-radius:22px;
                    background:#111c2f;
                    border:1px solid rgba(139,92,246,.25);
                    color:#fff;
                    text-align:center;
                    box-shadow:0 25px 80px rgba(0,0,0,.4);
                "
            >

                <div
                    style="
                        font-size:42px;
                        margin-bottom:12px;
                    "
                >
                    ⭐
                </div>

                <h2
                    style="
                        margin:0 0 10px;
                    "
                >
                    StudyMind Premium
                </h2>

                <p
                    style="
                        color:#94a3b8;
                        line-height:1.6;
                        margin:0 0 22px;
                    "
                >
                    You've reached the 5 free battles.
                    Premium will allow unlimited Battle Arena
                    sessions and more competitive features.
                </p>

                <button
                    type="button"
                    id="closePremiumMessage"
                    style="
                        border:0;
                        border-radius:10px;
                        padding:11px 20px;
                        background:#7c3aed;
                        color:#fff;
                        font-weight:800;
                        cursor:pointer;
                    "
                >
                    Got it
                </button>

            </div>

        `;


        document.body.appendChild(
            message
        );


        const closeButton =
            document.getElementById(
                "closePremiumMessage"
            );


        if (closeButton) {

            closeButton.addEventListener(
                "click",
                () => {

                    message.remove();

                }
            );

        }

    }

}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutStudyMind() {

    try {

        if (
            typeof supabaseClient !==
            "undefined" &&
            supabaseClient &&
            supabaseClient.auth
        ) {

            await supabaseClient
                .auth
                .signOut();

        }

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

    }


    localStorage.removeItem(
        "studyMindLoggedIn"
    );

    localStorage.removeItem(
        "isLoggedIn"
    );

    localStorage.removeItem(
        "currentUser"
    );


    window.location.href =
        "index.html";

}


/* =========================================================
   THEME
========================================================= */

function applyGameTheme() {

    const savedTheme =
        localStorage.getItem(
            STORAGE_KEYS.theme
        );


    const page =
        document.querySelector(
            ".game-page"
        );


    const button =
        $("themeButton");


    if (
        savedTheme === "light"
    ) {

        document.body.classList.add(
            "light-mode"
        );


        if (page) {

            page.classList.add(
                "light-mode"
            );

        }


        if (button) {

            button.textContent =
                "☀️ Light Mode";

        }

    } else {

        document.body.classList.remove(
            "light-mode"
        );


        if (page) {

            page.classList.remove(
                "light-mode"
            );

        }


        if (button) {

            button.textContent =
                "🌙 Dark Mode";

        }

    }

}


/* =========================================================
   TOGGLE THEME
========================================================= */

function toggleGameTheme() {

    const isLight =
        document.body.classList.contains(
            "light-mode"
        );


    const newTheme =
        isLight
            ? "dark"
            : "light";


    localStorage.setItem(
        STORAGE_KEYS.theme,
        newTheme
    );


    applyGameTheme();

}


/* =========================================================
   AUTHENTICATION
========================================================= */

async function checkAuthentication() {

    try {

        if (
            typeof supabaseClient ===
            "undefined" ||
            !supabaseClient ||
            !supabaseClient.auth
        ) {

            /*
             * The game page can still operate
             * with local study-plan data if the
             * Supabase client is unavailable.
             */
            return true;

        }


        const {
            data: {
                user
            },
            error
        } =
            await supabaseClient
                .auth
                .getUser();


        if (
            error ||
            !user
        ) {

            currentUser =
                null;

            isAuthenticated =
                false;

            return false;

        }


        currentUser =
            user;

        isAuthenticated =
            true;

        return true;

    } catch (error) {

        console.error(
            "Authentication check failed:",
            error
        );


        /*
         * Don't break the page simply because
         * authentication could not be checked.
         */
        return true;

    }

}


/* =========================================================
   EVENT BINDING
========================================================= */

function bindGameEvents() {

    const topicSelect =
        $("battleTopic");


    if (topicSelect) {

        topicSelect.addEventListener(
            "change",
            () => {

                const index =
                    Number(
                        topicSelect.value
                    );


                if (
                    Number.isInteger(index) &&
                    studyPlan &&
                    studyPlan.topics &&
                    studyPlan.topics[index]
                ) {

                    selectedTopic =
                        studyPlan.topics[index];

                }

            }
        );

    }


    const difficultySelect =
        $("battleDifficulty");


    if (difficultySelect) {

        difficultySelect.addEventListener(
            "change",
            () => {

                selectedDifficulty =
                    difficultySelect.value;

            }
        );

    }


    /*
     * Keyboard support:
     * 1, 2, 3, 4 select an answer.
     */
    document.addEventListener(
        "keydown",
        event => {

            if (
                !battleActive ||
                questionAnswered
            ) {
                return;
            }


            const key =
                event.key;


            if (
                ["1", "2", "3", "4"]
                    .includes(key)
            ) {

                handleAnswer(
                    Number(key) - 1
                );

            }

        }
    );

}


/* =========================================================
   INITIALIZE GAME MODE
========================================================= */

async function initializeGameMode() {

    applyGameTheme();


    loadStudyPlan();


    populateTopics();


    bindGameEvents();


    updateBattleStatus();


    hideBattleArena();
    hideBattleResults();


    /*
     * The battle setup remains visible
     * when the page opens.
     */
    showBattleSetup();


    const authenticated =
        await checkAuthentication();


    if (!authenticated) {

        /*
         * Don't immediately redirect.
         * This prevents the Game Mode page
         * from becoming unusable if Supabase
         * takes a moment to restore a session.
         */

        console.warn(
            "No authenticated Supabase user detected."
        );

    }


    /*
     * If there is no plan, tell the user
     * how to create one.
     */
    if (
        !studyPlan ||
        !Array.isArray(
            studyPlan.topics
        ) ||
        studyPlan.topics.length === 0
    ) {

        const setup =
            $("battleSetup");


        if (setup) {

            const notice =
                document.createElement(
                    "div"
                );

            notice.style.marginBottom =
                "18px";

            notice.style.padding =
                "14px 16px";

            notice.style.borderRadius =
                "12px";

            notice.style.background =
                "rgba(99,102,241,.08)";

            notice.style.border =
                "1px solid rgba(99,102,241,.18)";

            notice.style.color =
                "#a5b4fc";

            notice.innerHTML = `
                <strong>📚 Create a study plan first.</strong>
                <br>
                Your Battle Arena uses the topics from your StudyMind study plan.
                <br><br>
                <button
                    type="button"
                    onclick="openNewStudyPlan()"
                    style="
                        border:0;
                        border-radius:9px;
                        padding:9px 14px;
                        background:#6366f1;
                        color:#fff;
                        font-weight:700;
                        cursor:pointer;
                    "
                >
                    + Create Study Plan
                </button>
            `;


            setup.insertBefore(
                notice,
                setup.firstChild
            );

        }

    }

}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.startComputerBattle =
    startComputerBattle;

window.beginBattle =
    beginBattle;

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

window.toggleGameTheme =
    toggleGameTheme;

window.logoutStudyMind =
    logoutStudyMind;


/* =========================================================
   START
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeGameMode
    );

} else {

    initializeGameMode();

}
