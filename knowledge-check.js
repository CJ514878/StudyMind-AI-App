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

const KNOWLEDGE_QUESTIONS_KEY =
    "studyMindTopicQuestions";

const QUESTION_REQUEST_TIMEOUT =
    45000;


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


    const subjectElement =
        $("knowledgeSubject");

    const topicElement =
        $("knowledgeTopic");


    if (subjectElement) {

        subjectElement.textContent =
            subject;
    }


    if (topicElement) {

        topicElement.textContent =
            knowledgeTopic.name;
    }
}


/* =========================================================
   CREATE KNOWLEDGE CHECK
========================================================= */

async function createKnowledgeCheck() {

    showLoading();


    try {

        console.log(
            "Generating Knowledge Check questions..."
        );


        const questions =
            await requestQuestions(
                knowledgeTopic
            );


        if (
            !Array.isArray(questions) ||
            questions.length <
            KNOWLEDGE_CHECK_COUNT
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
           COUNT USAGE AFTER SUCCESS
        ----------------------------------------- */

        countKnowledgeCheckUsage();


        /* -----------------------------------------
           SAVE QUESTIONS
        ----------------------------------------- */

        saveKnowledgeQuestions();


        /* -----------------------------------------
           RENDER
        ----------------------------------------- */

        renderQuestions();

        hideLoading();


        console.log(
            "Knowledge Check ready."
        );


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

    if (!knowledgeTopic) {
        return;
    }


    const checkId =
        knowledgeTopic.checkId ||
        `${knowledgeTopic.name}-${Date.now()}`;


    const existingSession =
        sessionStorage.getItem(
            KNOWLEDGE_SESSION_KEY
        );


    /* -----------------------------------------
       PREVENT REFRESH FROM COUNTING AGAIN
    ----------------------------------------- */

    if (
        existingSession ===
        checkId
    ) {

        return;
    }


    knowledgeUsageCount++;


    localStorage.setItem(
        KNOWLEDGE_USAGE_KEY,
        String(
            knowledgeUsageCount
        )
    );


    sessionStorage.setItem(
        KNOWLEDGE_SESSION_KEY,
        checkId
    );


    console.log(
        `Knowledge Check usage: ${knowledgeUsageCount}/${KNOWLEDGE_CHECK_LIMIT}`
    );
}


/* =========================================================
   SAVE QUESTIONS
========================================================= */

function saveKnowledgeQuestions() {

    if (!knowledgeTopic) {
        return;
    }


    const topicKey =
        knowledgeTopic.key ||
        createTopicKey(
            knowledgeTopic
        );


    let storedQuestions =
        readJSON(
            KNOWLEDGE_QUESTIONS_KEY,
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
        KNOWLEDGE_QUESTIONS_KEY,
        storedQuestions
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

        console.log(
            "Trying /api/generate-questions..."
        );


        const response =
            await fetchWithTimeout(
                "/api/generate-questions",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(payload)
                },
                QUESTION_REQUEST_TIMEOUT
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

                console.log(
                    "Questions received from /api/generate-questions."
                );

                return questions;
            }


            console.warn(
                "generate-questions returned an invalid question list."
            );

        } else {

            console.warn(
                `generate-questions returned ${response.status}.`
            );
        }


    } catch (error) {

        console.warn(
            "generate-questions failed:",
            error.message
        );
    }


    /* -----------------------------------------
       FALLBACK TO ASK-AI
    ----------------------------------------- */

    console.log(
        "Trying /api/ask-ai fallback..."
    );


    return requestQuestionsFromAskAI(
        topic
    );
}


/* =========================================================
   FETCH WITH TIMEOUT
========================================================= */

async function fetchWithTimeout(
    url,
    options = {},
    timeout = QUESTION_REQUEST_TIMEOUT
) {

    const controller =
        new AbortController();


    const timeoutId =
        setTimeout(
            () => {
                controller.abort();
            },
            timeout
        );


    try {

        return await fetch(
            url,
            {
                ...options,
                signal:
                    controller.signal
            }
        );

    } catch (error) {

        if (
            error.name ===
            "AbortError"
        ) {

            throw new Error(
                `The question service took too long to respond. Please try again.`
            );
        }


        throw error;

    } finally {

        clearTimeout(
            timeoutId
        );
    }
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
      "answer": 0,
      "explanation": "Clear explanation of why the correct answer is correct and why the other choices are incorrect."
    }
  ]
}

Rules:
- Exactly 5 questions.
- Exactly 4 options per question.
- answer must be the zero-based number of the correct option.
- Every question must contain an explanation.
- Questions must test understanding of the topic.
- Questions should be appropriate for a Nigerian Senior Secondary student.
- Explanations should be clear and educational.
- Do not include markdown.
- Do not include anything outside the JSON.`;


    const response =
        await fetchWithTimeout(
            "/api/ask-ai",
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

                        requestType:
                            "knowledge_check",

                        type:
                            "knowledge_check"

                    })
            },
            QUESTION_REQUEST_TIMEOUT
        );


    if (!response.ok) {

        let message =
            `Question API returned ${response.status}.`;


        try {

            const errorData =
                await response.json();


            if (
                errorData?.error
            ) {

                message =
                    errorData.error;
            }

        } catch (_) {}


        throw new Error(
            message
        );
    }


    const data =
        await response.json();


    const questions =
        extractQuestions(
            data
        );


    if (
        questions.length <
        KNOWLEDGE_CHECK_COUNT
    ) {

        throw new Error(
            "The AI returned fewer than 5 questions."
        );
    }


    console.log(
        "Questions received from /api/ask-ai."
    );


    return questions;
}


/* =========================================================
   EXTRACT QUESTIONS
========================================================= */

function extractQuestions(data) {

    if (!data) {
        return [];
    }


    if (
        Array.isArray(data)
    ) {

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

        data.text,

        data.message

    ];


    for (
        const text
        of possibleText
    ) {

        if (
            typeof text !==
            "string"
        ) {

            continue;
        }


        const parsed =
            parseJSONFromText(
                text
            );


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
        cleaned.indexOf(
            "{"
        );


    const lastBrace =
        cleaned.lastIndexOf(
            "}"
        );


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
        cleaned.indexOf(
            "["
        );


    const lastBracket =
        cleaned.lastIndexOf(
            "]"
        );


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
        typeof raw !==
        "object"
    ) {

        return null;
    }


    const questionText =
        raw.question ||
        raw.text ||
        raw.prompt ||
        raw.questionText;


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
            .map(
                option => {

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
                }
            )
            .filter(Boolean)
            .slice(
                0,
                4
            );


    if (
        options.length !==
        4
    ) {

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
                .toUpperCase();


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
            answerIndex !==
            -1
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


    /* -----------------------------------------
       EXPLANATION
    ----------------------------------------- */

    let explanation =
        raw.explanation ||
        raw.explanationText ||
        raw.reason ||
        raw.rationale ||
        "";


    if (
        typeof explanation !==
        "string"
    ) {

        explanation =
            "";
    }


    explanation =
        explanation.trim();


    if (!explanation) {

        explanation =
            "The correct answer is " +
            options[answer] +
            ". Review this concept to strengthen your understanding.";
    }


    return {

        question:
            questionText.trim(),

        options,

        answer,

        explanation

    };
}


/* =========================================================
   RENDER QUESTIONS
========================================================= */

function renderQuestions() {

    const container =
        $("knowledgeQuestions");


    if (!container) {

        showError(
            "The Knowledge Check page is missing the questions container."
        );

        return;
    }


    container.innerHTML =
        "";


    knowledgeQuestions.forEach(
        (
            question,
            index
        ) => {

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
                (
                    option,
                    optionIndex
                ) => {

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
                        String(
                            optionIndex
                        );


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
        .forEach(
            input => {

                input.addEventListener(
                    "change",
                    updateProgress
                );
            }
        );


    const submitButton =
        $("knowledgeSubmit");


    if (
        submitButton
    ) {

        submitButton.onclick =
            submitKnowledgeCheck;
    }


    updateProgress();


    if (
        window.MathJax &&
        typeof MathJax.typesetPromise ===
        "function"
    ) {

        MathJax
            .typesetPromise()
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


    const progressText =
        $("knowledgeProgressText");


    const progressBar =
        $("knowledgeProgressBar");


    if (
        progressText
    ) {

        progressText.textContent =
            `${answered} of ${KNOWLEDGE_CHECK_COUNT} answered`;
    }


    if (
        progressBar
    ) {

        progressBar.style.width =
            `${percentage}%`;
    }
}


/* =========================================================
   SUBMIT
========================================================= */

function submitKnowledgeCheck() {

    if (
        knowledgeSubmitted
    ) {

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
        (
            question,
            index
        ) => {

            if (
                answers[index] ===
                question.answer
            ) {

                score++;
            }
        }
    );


    showResult(
        score,
        answers
    );


    markTopicCompleted();
}


/* =========================================================
   SHOW RESULT
========================================================= */

function showResult(
    score,
    answers
) {

    const percentage =
        Math.round(
            (
                score /
                KNOWLEDGE_CHECK_COUNT
            ) * 100
        );


    const passed =
        percentage >=
        KNOWLEDGE_CHECK_PASS_PERCENTAGE;


    const content =
        $("knowledgeContent");


    const result =
        $("knowledgeResult");


    if (content) {

        content.style.display =
            "none";
    }


    if (result) {

        result.style.display =
            "block";
    }


    /* -----------------------------------------
       BASIC RESULT
    ----------------------------------------- */

    const scoreElement =
        $("knowledgeScore");


    if (scoreElement) {

        scoreElement.textContent =
            `${score}/${KNOWLEDGE_CHECK_COUNT}`;
    }


    const iconElement =
        $("knowledgeResultIcon");


    const titleElement =
        $("knowledgeResultTitle");


    const textElement =
        $("knowledgeResultText");


    if (passed) {

        if (iconElement) {

            iconElement.textContent =
                "🎉";
        }


        if (titleElement) {

            titleElement.textContent =
                "Knowledge Check Passed";
        }


        if (textElement) {

            textElement.textContent =
                `Great work! You scored ${percentage}%. You passed this Knowledge Check with ${score} out of ${KNOWLEDGE_CHECK_COUNT} correct answers.`;
        }

    } else {

        if (iconElement) {

            iconElement.textContent =
                "📚";
        }


        if (titleElement) {

            titleElement.textContent =
                "Keep Studying";
        }


        if (textElement) {

            textElement.textContent =
                `You scored ${percentage}%. You need at least ${KNOWLEDGE_CHECK_PASS_PERCENTAGE}% to pass. Review the corrections below and keep practicing.`;
        }
    }


    /* -----------------------------------------
       SHOW CORRECTIONS
    ----------------------------------------- */

    renderCorrections(
        answers
    );


    /* -----------------------------------------
       MATHJAX
    ----------------------------------------- */

    if (
        window.MathJax &&
        typeof MathJax.typesetPromise ===
        "function"
    ) {

        MathJax
            .typesetPromise()
            .catch(() => {});
    }
}


/* =========================================================
   RENDER CORRECTIONS
========================================================= */

function renderCorrections(
    answers
) {

    const result =
        $("knowledgeResult");


    if (!result) {
        return;
    }


    /* -----------------------------------------
       REMOVE OLD CORRECTIONS
    ----------------------------------------- */

    const oldCorrections =
        $("knowledgeCorrections");


    if (
        oldCorrections
    ) {

        oldCorrections.remove();
    }


    const failedQuestions =
        knowledgeQuestions
            .map(
                (
                    question,
                    index
                ) => {

                    return {

                        question,

                        index,

                        userAnswer:
                            answers[index]

                    };
                }
            )
            .filter(
                item =>
                    item.userAnswer !==
                    item.question.answer
            );


    const corrections =
        document.createElement(
            "div"
        );


    corrections.id =
        "knowledgeCorrections";


    corrections.style.cssText = `
        margin-top: 30px;
        text-align: left;
    `;


    const heading =
        document.createElement(
            "h3"
        );


    heading.textContent =
        failedQuestions.length
            ? "📚 Review Your Mistakes"
            : "🎯 Perfect Score";


    heading.style.marginBottom =
        "8px";


    corrections.appendChild(
        heading
    );


    const intro =
        document.createElement(
            "p"
        );


    intro.textContent =
        failedQuestions.length
            ? "Here are all the questions you missed, with the correct answers and explanations."
            : "Excellent work! You answered all 5 questions correctly.";


    intro.style.opacity =
        "0.75";


    intro.style.marginBottom =
        "20px";


    corrections.appendChild(
        intro
    );


    /* -----------------------------------------
       PERFECT SCORE
    ----------------------------------------- */

    if (
        failedQuestions.length ===
        0
    ) {

        const perfect =
            document.createElement(
                "div"
            );


        perfect.style.cssText = `
            padding: 18px;
            border-radius: 14px;
            background: rgba(34, 197, 94, 0.08);
            border: 1px solid rgba(34, 197, 94, 0.2);
        `;


        perfect.textContent =
            "🎉 Perfect score! There are no corrections to review.";


        corrections.appendChild(
            perfect
        );


    } else {

        /* -----------------------------------------
           FAILED QUESTIONS
        ----------------------------------------- */

        failedQuestions.forEach(
            item => {

                const question =
                    item.question;


                const index =
                    item.index;


                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "knowledge-correction-card";


                card.style.cssText = `
                    padding: 20px;
                    margin-bottom: 16px;
                    border-radius: 16px;
                    border: 1px solid rgba(239, 68, 68, 0.25);
                    background: rgba(239, 68, 68, 0.05);
                `;


                /* QUESTION */

                const questionNumber =
                    document.createElement(
                        "div"
                    );


                questionNumber.textContent =
                    `❌ Question ${index + 1}`;


                questionNumber.style.cssText = `
                    font-weight: 700;
                    margin-bottom: 12px;
                `;


                card.appendChild(
                    questionNumber
                );


                const questionText =
                    document.createElement(
                        "div"
                    );


                questionText.textContent =
                    question.question;


                questionText.style.cssText = `
                    font-size: 16px;
                    font-weight: 600;
                    line-height: 1.6;
                    margin-bottom: 16px;
                `;


                card.appendChild(
                    questionText
                );


                /* YOUR ANSWER */

                const yourAnswer =
                    document.createElement(
                        "div"
                    );


                yourAnswer.style.cssText = `
                    margin-bottom: 10px;
                    line-height: 1.5;
                `;


                const yourLabel =
                    document.createElement(
                        "strong"
                    );


                yourLabel.textContent =
                    "Your answer: ";


                yourAnswer.appendChild(
                    yourLabel
                );


                const userAnswerText =
                    document.createElement(
                        "span"
                    );


                userAnswerText.style.fontWeight =
                    "600";


                if (
                    item.userAnswer >= 0 &&
                    question.options[item.userAnswer]
                ) {

                    userAnswerText.textContent =
                        `${String.fromCharCode(
                            65 + item.userAnswer
                        )}. ${question.options[item.userAnswer]}`;

                } else {

                    userAnswerText.textContent =
                        "Not answered";
                }


                yourAnswer.appendChild(
                    userAnswerText
                );


                card.appendChild(
                    yourAnswer
                );


                /* CORRECT ANSWER */

                const correctAnswer =
                    document.createElement(
                        "div"
                    );


                correctAnswer.style.cssText = `
                    margin-bottom: 16px;
                    line-height: 1.5;
                `;


                const correctLabel =
                    document.createElement(
                        "strong"
                    );


                correctLabel.textContent =
                    "Correct answer: ";


                correctAnswer.appendChild(
                    correctLabel
                );


                const correctText =
                    document.createElement(
                        "span"
                    );


                correctText.style.cssText = `
                    font-weight: 700;
                `;


                correctText.textContent =
                    `${String.fromCharCode(
                        65 + question.answer
                    )}. ${question.options[question.answer]}`;


                correctAnswer.appendChild(
                    correctText
                );


                card.appendChild(
                    correctAnswer
                );


                /* EXPLANATION */

                const explanation =
                    document.createElement(
                        "div"
                    );


                explanation.style.cssText = `
                    padding: 15px;
                    border-radius: 12px;
                    background: rgba(59, 130, 246, 0.08);
                    line-height: 1.65;
                `;


                const explanationTitle =
                    document.createElement(
                        "strong"
                    );


                explanationTitle.textContent =
                    "💡 Explanation";


                explanation.appendChild(
                    explanationTitle
                );


                const explanationText =
                    document.createElement(
                        "div"
                    );


                explanationText.textContent =
                    question.explanation ||
                    "Review this concept and try the question again.";


                explanationText.style.marginTop =
                    "7px";


                explanation.appendChild(
                    explanationText
                );


                card.appendChild(
                    explanation
                );


                corrections.appendChild(
                    card
                );
            }
        );
    }


    /* -----------------------------------------
       INSERT BEFORE BACK BUTTON
    ----------------------------------------- */

    const backButton =
        result.querySelector(
            "button"
        );


    if (
        backButton
    ) {

        result.insertBefore(
            corrections,
            backButton.parentElement ||
            backButton
        );

    } else {

        result.appendChild(
            corrections
        );
    }


    if (
        window.MathJax &&
        typeof MathJax.typesetPromise ===
        "function"
    ) {

        MathJax
            .typesetPromise()
            .catch(() => {});
    }
}


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


    if (
        !Array.isArray(completed)
    ) {

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

    const loading =
        $("knowledgeLoading");

    const content =
        $("knowledgeContent");

    const result =
        $("knowledgeResult");

    const error =
        $("knowledgeError");

    const limit =
        $("knowledgeLimit");


    if (loading) {

        loading.style.display =
            "block";
    }


    if (content) {

        content.style.display =
            "none";
    }


    if (result) {

        result.style.display =
            "none";
    }


    if (error) {

        error.style.display =
            "none";
    }


    if (limit) {

        limit.style.display =
            "none";
    }
}


function hideLoading() {

    const loading =
        $("knowledgeLoading");

    const content =
        $("knowledgeContent");


    if (loading) {

        loading.style.display =
            "none";
    }


    if (content) {

        content.style.display =
            "block";
    }
}


function showLimit() {

    const loading =
        $("knowledgeLoading");

    const content =
        $("knowledgeContent");

    const result =
        $("knowledgeResult");

    const error =
        $("knowledgeError");

    const limit =
        $("knowledgeLimit");


    if (loading) {

        loading.style.display =
            "none";
    }


    if (content) {

        content.style.display =
            "none";
    }


    if (result) {

        result.style.display =
            "none";
    }


    if (error) {

        error.style.display =
            "none";
    }


    if (limit) {

        limit.style.display =
            "block";
    }
}


function showError(message) {

    const loading =
        $("knowledgeLoading");

    const content =
        $("knowledgeContent");

    const result =
        $("knowledgeResult");

    const error =
        $("knowledgeError");

    const limit =
        $("knowledgeLimit");


    if (loading) {

        loading.style.display =
            "none";
    }


    if (content) {

        content.style.display =
            "none";
    }


    if (result) {

        result.style.display =
            "none";
    }


    if (limit) {

        limit.style.display =
            "none";
    }


    if (error) {

        error.style.display =
            "block";
    }


    const errorText =
        $("knowledgeErrorText");


    if (errorText) {

        errorText.textContent =
            message;
    }
}
