/* =========================================================
   STUDYMIND AI — KNOWLEDGE CHECK
   DEDICATED 5-QUESTION PAGE

   FREE LIMIT:
   5 KNOWLEDGE CHECK USAGES

   PASS MARK:
   60% = 3/5
========================================================= */


/* =========================================================
   SETTINGS
========================================================= */

const KNOWLEDGE_CHECK_COUNT = 5;

const KNOWLEDGE_CHECK_PASS_PERCENTAGE = 60;

const KNOWLEDGE_CHECK_LIMIT = 5;

const KNOWLEDGE_TOPIC_KEY =
    "studyMindKnowledgeCheckTopic";

const KNOWLEDGE_USAGE_KEY =
    "studyMindKnowledgeCheckUsageCount";

const KNOWLEDGE_SESSION_KEY =
    "studyMindKnowledgeCheckCurrentSession";

const KNOWLEDGE_COMPLETED_KEY =
    "studyMindCompletedQuestionTopics";


/* =========================================================
   STATE
========================================================= */

let knowledgeTopic = null;

let knowledgeQuestions = [];

let knowledgeSubmitted = false;

let knowledgeUsageCount = 0;


/* =========================================================
   SHORTCUT
========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   JSON HELPERS
========================================================= */

function readJSON(key, fallback) {

    try {

        const value =
            localStorage.getItem(key);

        if (!value) {
            return fallback;
        }

        return JSON.parse(value);

    } catch (error) {

        console.warn(
            "Could not read storage:",
            key,
            error
        );

        return fallback;
    }
}


function writeJSON(key, value) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

        return true;

    } catch (error) {

        console.warn(
            "Could not write storage:",
            key,
            error
        );

        return false;
    }
}


/* =========================================================
   PAGE START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeKnowledgeCheck
);


async function initializeKnowledgeCheck() {

    console.log(
        "StudyMind Knowledge Check initializing..."
    );


    knowledgeUsageCount =
        Number(
            localStorage.getItem(
                KNOWLEDGE_USAGE_KEY
            )
        ) || 0;


    /* -----------------------------------------
       CHECK FREE LIMIT
    ----------------------------------------- */

    if (
        knowledgeUsageCount >=
        KNOWLEDGE_CHECK_LIMIT
    ) {

        showLimit();

        return;
    }


    /* -----------------------------------------
       GET TOPIC
    ----------------------------------------- */

    knowledgeTopic =
        readJSON(
            KNOWLEDGE_TOPIC_KEY,
            null
        );


    if (
        !knowledgeTopic ||
        !knowledgeTopic.name
    ) {

        showError(
            "No Knowledge Check topic was selected. Please return to your dashboard and choose a topic."
        );

        return;
    }


    renderTopic();


    /* -----------------------------------------
       CREATE QUESTIONS
    ----------------------------------------- */

    await createKnowledgeCheck();
}


/* =========================================================
   RENDER TOPIC
========================================================= */

function renderTopic() {

    const subject =
        knowledgeTopic.subject ||
        "Senior Secondary";


    $("knowledgeSubject").textContent =
        subject;


    $("knowledgeTopic").textContent =
        knowledgeTopic.name;
}


/* =========================================================
   CREATE KNOWLEDGE CHECK
========================================================= */

async function createKnowledgeCheck() {

    showLoading();


    try {

        const questions =
            await requestQuestions(
                knowledgeTopic
            );


        if (
            !Array.isArray(questions) ||
            questions.length < KNOWLEDGE_CHECK_COUNT
        ) {

            throw new Error(
                "The AI did not return enough questions."
            );
        }


        knowledgeQuestions =
            questions
                .slice(
                    0,
                    KNOWLEDGE_CHECK_COUNT
                )
                .map(normalizeQuestion)
                .filter(Boolean);


        if (
            knowledgeQuestions.length !==
            KNOWLEDGE_CHECK_COUNT
        ) {

            throw new Error(
                "The generated questions were not in the expected format."
            );
        }


        /* -----------------------------------------
           COUNT ONE USAGE ONLY AFTER SUCCESS
        ----------------------------------------- */

        countKnowledgeCheckUsage();


        renderQuestions();


        hideLoading();


    } catch (error) {

        console.error(
            "Knowledge Check error:",
            error
        );


        showError(
            error.message ||
            "Unable to prepare your Knowledge Check."
        );
    }
}


/* =========================================================
   COUNT USAGE
========================================================= */

function countKnowledgeCheckUsage() {

    const existingSession =
        sessionStorage.getItem(
            KNOWLEDGE_SESSION_KEY
        );


    /* -----------------------------------------
       PREVENT REFRESH FROM COUNTING AGAIN
    ----------------------------------------- */

    if (existingSession) {

        return;
    }


    knowledgeUsageCount++;


    localStorage.setItem(
        KNOWLEDGE_USAGE_KEY,
        String(knowledgeUsageCount)
    );


    sessionStorage.setItem(
        KNOWLEDGE_SESSION_KEY,
        Date.now().toString()
    );


    console.log(
        `Knowledge Check usage: ${knowledgeUsageCount}/${KNOWLEDGE_CHECK_LIMIT}`
    );
}


/* =========================================================
   REQUEST QUESTIONS
========================================================= */

async function requestQuestions(topic) {

    const payload = {

        subject:
            topic.subject ||
            "Senior Secondary",

        topic:
            topic.name,

        numberOfQuestions:
            KNOWLEDGE_CHECK_COUNT,

        questionCount:
            KNOWLEDGE_CHECK_COUNT,

        count:
            KNOWLEDGE_CHECK_COUNT,

        curriculum:
            "Nigerian Senior Secondary curriculum",

        difficulty:
            "mixed",

        type:
            "knowledge_check",

        requestType:
            "knowledge_check"
    };


    /* -----------------------------------------
       PRIMARY ENDPOINT
    ----------------------------------------- */

    try {

        const response =
            await fetch(
                "/api/generate-questions",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(payload)
                }
            );


        if (response.ok) {

            const data =
                await response.json();

            const questions =
                extractQuestions(data);


            if (
                questions.length >=
                KNOWLEDGE_CHECK_COUNT
            ) {

                return questions;
            }
        }

    } catch (error) {

        console.warn(
            "generate-questions endpoint unavailable:",
            error
        );
    }


    /* -----------------------------------------
       FALLBACK TO ASK-AI
    ----------------------------------------- */

    return requestQuestionsFromAskAI(
        topic
    );
}


/* =========================================================
   ASK-AI FALLBACK
========================================================= */

async function requestQuestionsFromAskAI(topic) {

    const prompt = `Create exactly 5 multiple-choice knowledge-check questions for a Nigerian Senior Secondary student.

Subject: ${topic.subject || "Senior Secondary"}

Topic: ${topic.name}

Return ONLY valid JSON in this exact structure:

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
      "answer": 0
    }
  ]
}

Rules:
- Exactly 5 questions.
- Exactly 4 options per question.
- answer must be the zero-based number of the correct option.
- Questions must test understanding of the topic.
- Do not include explanations.
- Do not include markdown.
- Do not include anything outside the JSON.`;


    const response =
        await fetch(
            "/api/ask-ai",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        message: prompt,

                        requestType:
                            "knowledge_check",

                        type:
                            "knowledge_check"
                    })
            }
        );


    if (!response.ok) {

        let message =
            `Question API returned ${response.status}.`;

        try {

            const errorData =
                await response.json();

            if (errorData?.error) {
                message =
                    errorData.error;
            }

        } catch (_) {}


        throw new Error(message);
    }


    const data =
        await response.json();


    const questions =
        extractQuestions(data);


    if (
        questions.length <
        KNOWLEDGE_CHECK_COUNT
    ) {

        throw new Error(
            "The AI returned fewer than 5 questions."
        );
    }


    return questions;
}


/* =========================================================
   EXTRACT QUESTIONS
========================================================= */

function extractQuestions(data) {

    if (!data) {
        return [];
    }


    if (Array.isArray(data)) {
        return data;
    }


    const possibleArrays = [

        data.questions,

        data.data?.questions,

        data.result?.questions,

        data.output?.questions,

        data.response?.questions,

        data.answer?.questions,

        data.reply?.questions

    ];


    for (
        const candidate
        of possibleArrays
    ) {

        if (
            Array.isArray(candidate)
        ) {

            return candidate;
        }
    }


    /* -----------------------------------------
       TEXT / JSON STRING
    ----------------------------------------- */

    const possibleText = [

        data.output_text,

        data.reply,

        data.answer,

        data.content,

        data.text

    ];


    for (
        const text
        of possibleText
    ) {

        if (
            typeof text !== "string"
        ) {

            continue;
        }


        const parsed =
            parseJSONFromText(text);


        if (
            parsed?.questions &&
            Array.isArray(
                parsed.questions
            )
        ) {

            return parsed.questions;
        }


        if (
            Array.isArray(parsed)
        ) {

            return parsed;
        }
    }


    return [];
}


/* =========================================================
   PARSE JSON FROM AI TEXT
========================================================= */

function parseJSONFromText(text) {

    let cleaned =
        text.trim();


    /* -----------------------------------------
       REMOVE MARKDOWN FENCES
    ----------------------------------------- */

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


    try {

        return JSON.parse(
            cleaned
        );

    } catch (_) {}


    /* -----------------------------------------
       FIND JSON OBJECT
    ----------------------------------------- */

    const firstBrace =
        cleaned.indexOf("{");

    const lastBrace =
        cleaned.lastIndexOf("}");


    if (
        firstBrace !== -1 &&
        lastBrace !== -1 &&
        lastBrace > firstBrace
    ) {

        try {

            return JSON.parse(
                cleaned.slice(
                    firstBrace,
                    lastBrace + 1
                )
            );

        } catch (_) {}
    }


    /* -----------------------------------------
       FIND JSON ARRAY
    ----------------------------------------- */

    const firstBracket =
        cleaned.indexOf("[");

    const lastBracket =
        cleaned.lastIndexOf("]");


    if (
        firstBracket !== -1 &&
        lastBracket !== -1 &&
        lastBracket > firstBracket
    ) {

        try {

            return JSON.parse(
                cleaned.slice(
                    firstBracket,
                    lastBracket + 1
                )
            );

        } catch (_) {}
    }


    return null;
}


/* =========================================================
   NORMALIZE QUESTION
========================================================= */

function normalizeQuestion(raw) {

    if (
        !raw ||
        typeof raw !== "object"
    ) {

        return null;
    }


    const questionText =
        raw.question ||
        raw.text ||
        raw.prompt;


    if (
        typeof questionText !==
        "string" ||
        !questionText.trim()
    ) {

        return null;
    }


    let options =
        raw.options ||
        raw.choices ||
        raw.answers;


    if (
        !Array.isArray(options)
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
                        option.value ||
                        ""
                    );
                }

                return "";
            })
            .filter(Boolean)
            .slice(0, 4);


    if (options.length !== 4) {
        return null;
    }


    let answer =
        raw.answer ??
        raw.correctAnswer ??
        raw.correct ??
        raw.correctOption;


    /* -----------------------------------------
       NUMERIC ANSWER
    ----------------------------------------- */

    if (
        typeof answer ===
        "string" &&
        /^[0-3]$/.test(
            answer.trim()
        )
    ) {

        answer =
            Number(
                answer.trim()
            );
    }


    /* -----------------------------------------
       LETTER ANSWER
    ----------------------------------------- */

    if (
        typeof answer ===
        "string"
    ) {

        const letter =
            answer
                .trim()
                .toUpperCase()
                .replace(
                    /[^A-D]/g,
                    ""
                );


        if (
            ["A", "B", "C", "D"]
                .includes(letter)
        ) {

            answer =
                "ABCD".indexOf(
                    letter
                );
        }
    }


    /* -----------------------------------------
       ANSWER TEXT
    ----------------------------------------- */

    if (
        typeof answer ===
        "string"
    ) {

        const answerIndex =
            options.findIndex(
                option =>
                    option
                        .trim()
                        .toLowerCase() ===
                    answer
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


    if (
        typeof answer !==
        "number" ||
        answer < 0 ||
        answer > 3
    ) {

        return null;
    }


    return {

        question:
            questionText.trim(),

        options,

        answer
    };
}


/* =========================================================
   RENDER QUESTIONS
========================================================= */

function renderQuestions() {

    const container =
        $("knowledgeQuestions");


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    knowledgeQuestions.forEach(
        (question, index) => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "knowledge-question-card";


            const number =
                document.createElement(
                    "div"
                );


            number.className =
                "knowledge-question-number";


            number.textContent =
                `Question ${index + 1} of ${KNOWLEDGE_CHECK_COUNT}`;


            const questionText =
                document.createElement(
                    "div"
                );


            questionText.className =
                "knowledge-question";


            questionText.textContent =
                question.question;


            const options =
                document.createElement(
                    "div"
                );


            options.className =
                "knowledge-options";


            question.options.forEach(
                (option, optionIndex) => {

                    const optionWrap =
                        document.createElement(
                            "div"
                        );


                    optionWrap.className =
                        "knowledge-option";


                    const input =
                        document.createElement(
                            "input"
                        );


                    input.type =
                        "radio";

                    input.name =
                        `knowledge-question-${index}`;

                    input.id =
                        `knowledge-${index}-${optionIndex}`;

                    input.value =
                        String(optionIndex);


                    const label =
                        document.createElement(
                            "label"
                        );


                    label.htmlFor =
                        input.id;


                    label.textContent =
                        `${String.fromCharCode(
                            65 + optionIndex
                        )}. ${option}`;


                    optionWrap.appendChild(
                        input
                    );

                    optionWrap.appendChild(
                        label
                    );


                    options.appendChild(
                        optionWrap
                    );
                }
            );


            card.appendChild(
                number
            );

            card.appendChild(
                questionText
            );

            card.appendChild(
                options
            );


            container.appendChild(
                card
            );
        }
    );


    document
        .querySelectorAll(
            ".knowledge-question-card input"
        )
        .forEach(input => {

            input.addEventListener(
                "change",
                updateProgress
            );
        });


    $("knowledgeSubmit")
        .addEventListener(
            "click",
            submitKnowledgeCheck
        );


    updateProgress();


    if (
        window.MathJax &&
        MathJax.typesetPromise
    ) {

        MathJax.typesetPromise()
            .catch(() => {});
    }
}


/* =========================================================
   PROGRESS
========================================================= */

function updateProgress() {

    let answered = 0;


    for (
        let i = 0;
        i < KNOWLEDGE_CHECK_COUNT;
        i++
    ) {

        const selected =
            document.querySelector(
                `input[name="knowledge-question-${i}"]:checked`
            );


        if (selected) {
            answered++;
        }
    }


    const percentage =
        (
            answered /
            KNOWLEDGE_CHECK_COUNT
        ) * 100;


    $("knowledgeProgressText")
        .textContent =
        `${answered} of ${KNOWLEDGE_CHECK_COUNT} answered`;


    $("knowledgeProgressBar")
        .style.width =
        `${percentage}%`;
}


/* =========================================================
   SUBMIT
========================================================= */

function submitKnowledgeCheck() {

    if (knowledgeSubmitted) {
        return;
    }


    const answers = [];


    for (
        let i = 0;
        i < KNOWLEDGE_CHECK_COUNT;
        i++
    ) {

        const selected =
            document.querySelector(
                `input[name="knowledge-question-${i}"]:checked`
            );


        if (!selected) {

            alert(
                `Please answer question ${i + 1} before submitting.`
            );

            return;
        }


        answers.push(
            Number(
                selected.value
            )
        );
    }


    knowledgeSubmitted =
        true;


    let score = 0;


    knowledgeQuestions.forEach(
        (question, index) => {

            if (
                answers[index] ===
                question.answer
            ) {

                score++;
            }
        }
    );


    showResult(
        score
    );


    markTopicCompleted();
}


/* =========================================================
   KNOWLEDGE CHECK — OPEN DEDICATED PAGE
========================================================= */

const KNOWLEDGE_CHECK_USAGE_KEY =
    "studyMindKnowledgeCheckUsageCount";

const KNOWLEDGE_CHECK_LIMIT = 5;

const KNOWLEDGE_CHECK_TOPIC_KEY =
    "studyMindKnowledgeCheckTopic";


window.openKnowledgeCheckPage = function (topic) {

    console.log(
        "Opening Knowledge Check:",
        topic
    );


    /* -----------------------------------------
       MAKE SURE TOPIC EXISTS
    ----------------------------------------- */

    if (
        !topic ||
        !topic.name
    ) {

        alert(
            "Please select a topic before starting the Knowledge Check."
        );

        return;
    }


    /* -----------------------------------------
       CHECK FREE KNOWLEDGE CHECK LIMIT
    ----------------------------------------- */

    const usageCount =
        Number(
            localStorage.getItem(
                KNOWLEDGE_CHECK_USAGE_KEY
            )
        ) || 0;


    if (
        usageCount >=
        KNOWLEDGE_CHECK_LIMIT
    ) {

        alert(
            "You have used all 5 of your free Knowledge Checks. Upgrade to Premium to continue."
        );

        return;
    }


    /* -----------------------------------------
       CREATE TOPIC DATA
    ----------------------------------------- */

    const topicData = {

        name:
            topic.name,

        subject:
            topic.subject ||
            topic.subjectName ||
            "Senior Secondary",

        key:
            typeof getTopicKey === "function"
                ? getTopicKey(topic)
                : (
                    `${topic.subject || "Senior Secondary"}::${topic.name}`
                ),

        /* Unique ID for this Knowledge Check */
        checkId:
            `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}`

    };


    /* -----------------------------------------
       SAVE TOPIC FOR KNOWLEDGE CHECK PAGE
    ----------------------------------------- */

    try {

        localStorage.setItem(
            KNOWLEDGE_CHECK_TOPIC_KEY,
            JSON.stringify(topicData)
        );

    } catch (error) {

        console.error(
            "Could not save Knowledge Check topic:",
            error
        );

        alert(
            "Unable to start the Knowledge Check. Please try again."
        );

        return;
    }


    /* -----------------------------------------
       OPEN DEDICATED KNOWLEDGE CHECK PAGE
    ----------------------------------------- */

    window.location.href =
        "knowledge-check.html";
};
/* =========================================================
   MARK TOPIC AS KNOWLEDGE-CHECKED
========================================================= */

function markTopicCompleted() {

    if (!knowledgeTopic) {
        return;
    }


    const topicKey =
        knowledgeTopic.key ||
        createTopicKey(
            knowledgeTopic
        );


    let completed =
        readJSON(
            KNOWLEDGE_COMPLETED_KEY,
            []
        );


    if (!Array.isArray(completed)) {
        completed = [];
    }


    if (
        !completed.includes(
            topicKey
        )
    ) {

        completed.push(
            topicKey
        );


        writeJSON(
            KNOWLEDGE_COMPLETED_KEY,
            completed
        );
    }


    /* -----------------------------------------
       STORE QUESTIONS FOR DASHBOARD
    ----------------------------------------- */

    let storedQuestions =
        readJSON(
            "studyMindTopicQuestions",
            {}
        );


    if (
        !storedQuestions ||
        typeof storedQuestions !==
        "object" ||
        Array.isArray(storedQuestions)
    ) {

        storedQuestions = {};
    }


    storedQuestions[topicKey] =
        knowledgeQuestions;


    writeJSON(
        "studyMindTopicQuestions",
        storedQuestions
    );
}


/* =========================================================
   TOPIC KEY
========================================================= */

function createTopicKey(topic) {

    return [

        topic.subject ||
        "Senior Secondary",

        topic.name ||
        ""

    ]
        .join("::")
        .toLowerCase()
        .replace(
            /\s+/g,
            " "
        )
        .trim();
}


/* =========================================================
   UI STATES
========================================================= */

function showLoading() {

    $("knowledgeLoading")
        .style.display =
        "block";

    $("knowledgeContent")
        .style.display =
        "none";

    $("knowledgeResult")
        .style.display =
        "none";

    $("knowledgeError")
        .style.display =
        "none";

    $("knowledgeLimit")
        .style.display =
        "none";
}


function hideLoading() {

    $("knowledgeLoading")
        .style.display =
        "none";

    $("knowledgeContent")
        .style.display =
        "block";
}


function showLimit() {

    $("knowledgeLoading")
        .style.display =
        "none";

    $("knowledgeContent")
        .style.display =
        "none";

    $("knowledgeResult")
        .style.display =
        "none";

    $("knowledgeError")
        .style.display =
        "none";

    $("knowledgeLimit")
        .style.display =
        "block";
}


function showError(message) {

    $("knowledgeLoading")
        .style.display =
        "none";

    $("knowledgeContent")
        .style.display =
        "none";

    $("knowledgeResult")
        .style.display =
        "none";

    $("knowledgeLimit")
        .style.display =
        "none";

    $("knowledgeError")
        .style.display =
        "block";


    $("knowledgeErrorText")
        .textContent =
        message;
}
