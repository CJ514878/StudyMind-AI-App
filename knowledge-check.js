/* =========================================================
   STUDYMIND AI — KNOWLEDGE CHECK
   COMPLETE REPLACEMENT

   FEATURES:
   - Premium access verification
   - 5 questions
   - 60% pass mark
   - Topic-aware
   - Returns to dashboard
   - Premium users have unlimited checks
   - Free users are redirected to Premium
   - Preserves stored questions
   - Preserves topic completion
========================================================= */

"use strict";


/* =========================================================
   SETTINGS
========================================================= */

const KNOWLEDGE_CHECK_COUNT =
    5;

const PASS_PERCENTAGE =
    60;

const KNOWLEDGE_CHECK_LIMIT =
    5;

const PREMIUM_STATUS_ENDPOINT =
    "/api/premium/status";


const TOPIC_KEY =
    "studyMindKnowledgeCheckTopic";


const USAGE_KEY =
    "studyMindKnowledgeCheckUsageCount";


const COMPLETED_KEY =
    "studyMindCompletedQuestionTopics";


const QUESTIONS_KEY =
    "studyMindTopicQuestions";


/* =========================================================
   STATE
========================================================= */

let knowledgeTopic =
    null;

let knowledgeQuestions =
    [];

let knowledgeSubmitted =
    false;

let knowledgePremiumVerified =
    false;


/* =========================================================
   SHORTCUT
========================================================= */

const $ =
    id =>
        document.getElementById(id);


/* =========================================================
   STORAGE
========================================================= */

function readJSON(
    key,
    fallback = null
) {

    try {

        const raw =
            localStorage.getItem(
                key
            );

        return raw
            ? JSON.parse(raw)
            : fallback;

    }

    catch {

        return fallback;

    }

}


function writeJSON(
    key,
    value
) {

    localStorage.setItem(

        key,

        JSON.stringify(
            value
        )

    );

}


/* =========================================================
   HELPERS
========================================================= */

function clean(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


function createTopicKey(
    topic
) {

    if (
        topic.key
    ) {

        return topic.key;

    }


    return `${

        clean(
            topic.subject ||
            "Senior Secondary"
        )
            .toLowerCase()

    }::${

        clean(
            topic.name
        )
            .toLowerCase()

    }`;

}


/* =========================================================
   SUPABASE CLIENT
========================================================= */

function getSupabaseClient() {

    /*
       First use the shared client created by
       supabase.js.
    */

    if (
        window.supabaseClient &&
        window.supabaseClient.auth
    ) {

        return window.supabaseClient;

    }


    /*
       Support a globally available
       Supabase client if supabase.js
       exposes it differently.
    */

    if (
        typeof supabaseClient !==
        "undefined" &&
        supabaseClient &&
        supabaseClient.auth
    ) {

        return supabaseClient;

    }


    /*
       Last-resort client creation.

       This keeps the Knowledge Check
       page functional even if the shared
       supabase.js file did not expose
       window.supabaseClient.
    */

    if (
        window.supabase &&
        typeof window.supabase.createClient ===
        "function"
    ) {

        const SUPABASE_URL =
            "https://bicnrbqqvucgpbwudmit.supabase.co";

        const SUPABASE_PUBLISHABLE_KEY =
            "sb_publishable_70y0MPrj30-FimUSQK_HuA_Ng1a1qcB";


        try {

            window.supabaseClient =
                window.supabase.createClient(
                    SUPABASE_URL,
                    SUPABASE_PUBLISHABLE_KEY
                );


            return window.supabaseClient;

        }

        catch (error) {

            console.error(
                "Could not create Supabase client:",
                error
            );

        }

    }


    return null;

}


/* =========================================================
   PREMIUM ACCESS
========================================================= */

async function verifyKnowledgeCheckPremiumAccess() {

    /*
       If this page was opened from the
       verified Premium Dashboard, the
       dashboard controller may already have
       verified the user.

       We still perform the server check
       below when possible so direct access
       cannot rely only on JavaScript flags.
    */

    if (
        window.studyMindPremiumVerified === true &&
        window.studyMindIsPremium === true
    ) {

        knowledgePremiumVerified =
            true;

        return true;

    }


    const client =
        getSupabaseClient();


    if (!client) {

        console.error(
            "Knowledge Check: Supabase client unavailable."
        );

        redirectToPremium();

        return false;

    }


    let session =
        null;


    try {

        const result =
            await client.auth.getSession();


        session =
            result?.data?.session ||
            null;

    }

    catch (error) {

        console.error(
            "Knowledge Check: Could not retrieve session:",
            error
        );

        redirectToPremium();

        return false;

    }


    /*
       No logged-in user.
    */

    if (!session) {

        console.warn(
            "Knowledge Check: No authenticated session."
        );

        window.location.href =
            "login.html";

        return false;

    }


    /*
       Ask the server for the real Premium
       status.
    */

    try {

        const response =
            await fetch(
                PREMIUM_STATUS_ENDPOINT,
                {

                    method:
                        "GET",

                    headers: {

                        Authorization:
                            `Bearer ${session.access_token}`,

                        Accept:
                            "application/json"

                    },

                    cache:
                        "no-store"

                }
            );


        if (
            !response.ok
        ) {

            console.error(
                "Knowledge Check: Premium status request failed:",
                response.status
            );

            redirectToPremium();

            return false;

        }


        const result =
            await response.json();


        console.log(
            "Knowledge Check Premium status:",
            result
        );


        if (
            result?.premium !== true
        ) {

            console.warn(
                "Knowledge Check: User is not Premium."
            );

            redirectToPremium();

            return false;

        }


        /*
           Premium confirmed.
        */

        knowledgePremiumVerified =
            true;


        window.studyMindPremiumVerified =
            true;


        window.studyMindIsPremium =
            true;


        window.premiumUser =
            true;


        return true;

    }

    catch (error) {

        console.error(
            "Knowledge Check Premium verification failed:",
            error
        );

        redirectToPremium();

        return false;

    }

}


/* =========================================================
   PREMIUM REDIRECT
========================================================= */

function redirectToPremium() {

    /*
       Avoid repeatedly redirecting if the
       page is already on premium.html.
    */

    if (
        window.location.pathname.endsWith(
            "premium.html"
        )
    ) {

        return;

    }


    window.location.replace(
        "premium.html"
    );

}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(

    "DOMContentLoaded",

    initializeKnowledgeCheck

);


async function initializeKnowledgeCheck() {

    /*
       ------------------------------------------------------
       FIRST: VERIFY PREMIUM
       ------------------------------------------------------
    */

    const premium =
        await verifyKnowledgeCheckPremiumAccess();


    if (!premium) {

        return;

    }


    /*
       ------------------------------------------------------
       PREMIUM USERS BYPASS FREE LIMIT
       ------------------------------------------------------
    */

    knowledgeTopic =
        readJSON(
            TOPIC_KEY,
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


    showLoading();


    try {

        /*
           ---------------------------------------------------
           TRY STORED QUESTIONS FIRST
           ---------------------------------------------------
        */

        const stored =
            readJSON(
                QUESTIONS_KEY,
                {}
            );


        const key =
            createTopicKey(
                knowledgeTopic
            );


        const saved =
            stored[key];


        if (
            Array.isArray(
                saved
            ) &&
            saved.length >=
            KNOWLEDGE_CHECK_COUNT
        ) {

            knowledgeQuestions =

                saved
                    .slice(
                        0,
                        KNOWLEDGE_CHECK_COUNT
                    )
                    .map(
                        normalizeQuestion
                    )
                    .filter(
                        Boolean
                    );

        }


        /*
           ---------------------------------------------------
           GENERATE NEW QUESTIONS IF NEEDED
           ---------------------------------------------------
        */

        if (
            knowledgeQuestions.length !==
            KNOWLEDGE_CHECK_COUNT
        ) {

            knowledgeQuestions =
                await requestQuestions();


            stored[key] =
                knowledgeQuestions;


            writeJSON(
                QUESTIONS_KEY,
                stored
            );

        }


        /*
           ---------------------------------------------------
           COUNT USAGE
           ---------------------------------------------------

           Premium users are unlimited and therefore
           do NOT consume the free Knowledge Check
           allowance.

           The counter is only maintained for free-user
           compatibility, although free users should
           normally be redirected before reaching here.
        */

        if (
            !knowledgePremiumVerified
        ) {

            const checkId =

                knowledgeTopic.checkId ||

                `${key}-${Date.now()}`;


            const previousSession =
                sessionStorage.getItem(
                    "studyMindKnowledgeCheckSession"
                );


            if (
                previousSession !==
                checkId
            ) {

                const newUsage =

                    Number(
                        localStorage.getItem(
                            USAGE_KEY
                        ) ||
                        0
                    ) +
                    1;


                localStorage.setItem(

                    USAGE_KEY,

                    String(
                        newUsage
                    )

                );


                sessionStorage.setItem(

                    "studyMindKnowledgeCheckSession",

                    checkId

                );

            }

        }


        /*
           ---------------------------------------------------
           SHOW QUESTIONS
           ---------------------------------------------------
        */

        if (
            $("knowledgeLoading")
        ) {

            $("knowledgeLoading")
                .style.display =
                    "none";

        }


        if (
            $("knowledgeContent")
        ) {

            $("knowledgeContent")
                .style.display =
                    "block";

        }


        renderQuestions();

    }

    catch (
        error
    ) {

        console.error(
            "Knowledge Check error:",
            error
        );


        showError(

            error.message ||

            "Unable to prepare the Knowledge Check."

        );

    }

}


/* =========================================================
   TOPIC
========================================================= */

function renderTopic() {

    if (
        $("knowledgeSubject")
    ) {

        $("knowledgeSubject")
            .textContent =

            knowledgeTopic.subject ||

            "Senior Secondary";

    }


    if (
        $("knowledgeTopic")
    ) {

        $("knowledgeTopic")
            .textContent =
                knowledgeTopic.name;

    }

}


/* =========================================================
   REQUEST QUESTIONS
========================================================= */

async function requestQuestions() {

    const payload = {

        subject:
            knowledgeTopic.subject ||
            "Senior Secondary",

        topic:
            knowledgeTopic.name,

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


    /*
       ------------------------------------------------------
       PRIMARY API
       ------------------------------------------------------
    */

    try {

        const response =
            await fetch(
                "/api/generate-questions",
                {

                    method:
                        "POST",

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


        if (
            response.ok
        ) {

            const data =
                await response.json();


            const questions =
                extractQuestions(
                    data
                )
                    .map(
                        normalizeQuestion
                    )
                    .filter(
                        Boolean
                    )
                    .slice(
                        0,
                        KNOWLEDGE_CHECK_COUNT
                    );


            if (
                questions.length ===
                KNOWLEDGE_CHECK_COUNT
            ) {

                return questions;

            }

        }

    }

    catch (
        error
    ) {

        console.warn(
            "Primary question API failed:",
            error
        );

    }


    /*
       ------------------------------------------------------
       FALLBACK API
       ------------------------------------------------------
    */

    const fallbackResponse =
        await fetch(
            "/api/ask-ai",
            {

                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify({

                        ...payload,

                        message:

                            `Create exactly 5 multiple-choice knowledge-check questions for ${knowledgeTopic.subject}: ${knowledgeTopic.name}.

Return JSON only:

{
  "questions": [
    {
      "question": "Question",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "answer": 0,
      "explanation": "Explanation"
    }
  ]
}`

                    })

            }

        );


    if (
        !fallbackResponse.ok
    ) {

        throw new Error(
            "The question service could not generate the Knowledge Check."
        );

    }


    const fallbackData =
        await fallbackResponse.json();


    const questions =
        extractQuestions(
            fallbackData
        )
            .map(
                normalizeQuestion
            )
            .filter(
                Boolean
            )
            .slice(
                0,
                KNOWLEDGE_CHECK_COUNT
            );


    if (
        questions.length !==
        KNOWLEDGE_CHECK_COUNT
    ) {

        throw new Error(
            "The AI did not return exactly 5 usable questions."
        );

    }


    return questions;

}


/* =========================================================
   EXTRACT QUESTIONS
========================================================= */

function extractQuestions(
    data
) {

    if (
        Array.isArray(
            data
        )
    ) {

        return data;

    }


    if (
        !data ||
        typeof data !==
        "object"
    ) {

        return [];

    }


    const possibleArrays = [

        data.questions,

        data.data?.questions,

        data.result?.questions,

        data.output?.questions,

        data.response?.questions,

        data.answer?.questions

    ];


    for (
        const value
        of possibleArrays
    ) {

        if (
            Array.isArray(
                value
            )
        ) {

            return value;

        }

    }


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
            parseJSONText(
                text
            );


        if (
            Array.isArray(
                parsed
            )
        ) {

            return parsed;

        }


        if (
            Array.isArray(
                parsed?.questions
            )
        ) {

            return parsed.questions;

        }

    }


    return [];

}


/* =========================================================
   PARSE AI JSON
========================================================= */

function parseJSONText(
    text
) {

    let value =
        text
            .trim()
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
            );


    try {

        return JSON.parse(
            value
        );

    }

    catch {}


    const firstObject =
        value.indexOf(
            "{"
        );


    const lastObject =
        value.lastIndexOf(
            "}"
        );


    if (
        firstObject >= 0 &&
        lastObject >
        firstObject
    ) {

        try {

            return JSON.parse(

                value.slice(
                    firstObject,
                    lastObject + 1
                )

            );

        }

        catch {}

    }


    const firstArray =
        value.indexOf(
            "["
        );


    const lastArray =
        value.lastIndexOf(
            "]"
        );


    if (
        firstArray >= 0 &&
        lastArray >
        firstArray
    ) {

        try {

            return JSON.parse(

                value.slice(
                    firstArray,
                    lastArray + 1
                )

            );

        }

        catch {}

    }


    return null;

}


/* =========================================================
   NORMALIZE QUESTION
========================================================= */

function normalizeQuestion(
    raw
) {

    if (
        !raw ||
        typeof raw !==
        "object"
    ) {

        return null;

    }


    const question =
        clean(

            raw.question ||

            raw.text ||

            raw.prompt ||

            raw.questionText

        );


    let options =

        raw.options ||

        raw.choices ||

        raw.answers;


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
                option =>

                    typeof option ===
                    "string"

                        ? clean(
                            option
                        )

                        : clean(

                            option?.text ||

                            option?.label ||

                            option?.value

                        )

            )

            .filter(
                Boolean
            );


    if (
        options.length <
        2
    ) {

        return null;

    }


    let answer =

        raw.answer ??

        raw.correctAnswer ??

        raw.correct ??

        raw.correctIndex;


    if (
        typeof answer ===
        "string"
    ) {

        const letter =
            answer
                .trim()
                .match(
                    /^([A-D])$/i
                );


        if (
            letter
        ) {

            answer =

                letter[1]
                    .toUpperCase()
                    .charCodeAt(0) -
                65;

        }

        else {

            const index =

                options.findIndex(

                    option =>

                        clean(
                            option
                        )
                            .toLowerCase() ===

                        clean(
                            answer
                        )
                            .toLowerCase()

                );


            answer =
                index;

        }

    }


    answer =
        Number(
            answer
        );


    /*
       Support both 0-based and 1-based
       AI answers.
    */

    if (
        answer >= 1 &&
        answer <= options.length
    ) {

        answer -=
            1;

    }


    if (
        !Number.isInteger(
            answer
        ) ||
        answer < 0 ||
        answer >= options.length
    ) {

        return null;

    }


    return {

        question,

        options,

        answer,

        explanation:
            clean(
                raw.explanation ||
                raw.reason ||
                ""
            )

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
            "The Knowledge Check page is missing its questions container."
        );

        return;

    }


    container.innerHTML =

        knowledgeQuestions

            .map(
                (
                    question,
                    index
                ) => `

                    <div
                        class="knowledge-question-card"
                    >

                        <div
                            class="knowledge-question-number"
                        >

                            Question ${
                                index + 1
                            }
                            of
                            ${KNOWLEDGE_CHECK_COUNT}

                        </div>


                        <div
                            class="knowledge-question"
                        >

                            ${escapeHTML(
                                question.question
                            )}

                        </div>


                        <div
                            class="knowledge-options"
                        >

                            ${

                                question.options

                                    .map(

                                        (
                                            option,
                                            optionIndex
                                        ) => `

                                            <div
                                                class="knowledge-option"
                                            >

                                                <input
                                                    type="radio"
                                                    id="knowledge-${index}-${optionIndex}"
                                                    name="knowledge-question-${index}"
                                                    value="${optionIndex}"
                                                >


                                                <label
                                                    for="knowledge-${index}-${optionIndex}"
                                                >

                                                    ${
                                                        String
                                                            .fromCharCode(
                                                                65 +
                                                                optionIndex
                                                            )
                                                    }.

                                                    ${escapeHTML(
                                                        option
                                                    )}

                                                </label>

                                            </div>

                                        `

                                    )

                                    .join("")

                            }

                        </div>

                    </div>

                `

            )

            .join("");


    container
        .querySelectorAll(
            "input"
        )
        .forEach(
            input => {

                input.addEventListener(
                    "change",
                    updateProgress
                );

            }
        );


    const submit =
        $("knowledgeSubmit");


    if (
        submit
    ) {

        submit.onclick =
            submitKnowledgeCheck;

    }


    updateProgress();

}


/* =========================================================
   PROGRESS
========================================================= */

function updateProgress() {

    let answered =
        0;


    for (
        let i = 0;

        i <
        KNOWLEDGE_CHECK_COUNT;

        i++
    ) {

        if (

            document.querySelector(

                `input[name="knowledge-question-${i}"]:checked`

            )

        ) {

            answered++;

        }

    }


    const percentage =

        Math.round(

            (
                answered /
                KNOWLEDGE_CHECK_COUNT
            ) *
            100

        );


    if (
        $("knowledgeProgressText")
    ) {

        $("knowledgeProgressText")
            .textContent =

                `${answered} of ${KNOWLEDGE_CHECK_COUNT} answered`;

    }


    if (
        $("knowledgeProgressBar")
    ) {

        $("knowledgeProgressBar")
            .style.width =
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


    const answers =
        [];


    for (
        let i = 0;

        i <
        KNOWLEDGE_CHECK_COUNT;

        i++
    ) {

        const selected =

            document.querySelector(

                `input[name="knowledge-question-${i}"]:checked`

            );


        if (!selected) {

            alert(

                `Please answer question ${
                    i + 1
                } before submitting.`

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


    let score =
        0;


    knowledgeQuestions
        .forEach(
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


    /*
       Mark topic Knowledge Check
       as completed.
    */

    markTopicCompleted();


    /*
       Disable answers.
    */

    document
        .querySelectorAll(
            "#knowledgeQuestions input"
        )
        .forEach(
            input => {

                input.disabled =
                    true;

            }
        );


    if (
        $("knowledgeSubmit")
    ) {

        $("knowledgeSubmit")
            .disabled =
                true;

    }


    showResult(
        score,
        answers
    );

}


/* =========================================================
   MARK KNOWLEDGE CHECK COMPLETE
========================================================= */

function markTopicCompleted() {

    if (
        !knowledgeTopic
    ) {

        return;

    }


    const key =
        createTopicKey(
            knowledgeTopic
        );


    let completed =
        readJSON(
            COMPLETED_KEY,
            []
        );


    if (
        !Array.isArray(
            completed
        )
    ) {

        completed =
            [];

    }


    if (
        !completed.includes(
            key
        )
    ) {

        completed.push(
            key
        );

    }


    /*
       Keep old topic-name format compatible.
    */

    if (

        knowledgeTopic.name &&

        !completed.includes(
            knowledgeTopic.name
        )

    ) {

        completed.push(
            knowledgeTopic.name
        );

    }


    writeJSON(
        COMPLETED_KEY,
        completed
    );

}


/* =========================================================
   RESULT
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
            ) *
            100

        );


    const passed =
        percentage >=
        PASS_PERCENTAGE;


    if (
        $("knowledgeContent")
    ) {

        $("knowledgeContent")
            .style.display =
                "none";

    }


    if (
        $("knowledgeResult")
    ) {

        $("knowledgeResult")
            .style.display =
                "block";

    }


    if (
        $("knowledgeScore")
    ) {

        $("knowledgeScore")
            .textContent =

                `${score}/${KNOWLEDGE_CHECK_COUNT}`;

    }


    if (
        $("knowledgeResultIcon")
    ) {

        $("knowledgeResultIcon")
            .textContent =

                passed
                    ? "🎉"
                    : "📚";

    }


    if (
        $("knowledgeResultTitle")
    ) {

        $("knowledgeResultTitle")
            .textContent =

                passed

                    ? "Knowledge Check Passed"

                    : "Knowledge Check Complete";

    }


    if (
        $("knowledgeResultText")
    ) {

        $("knowledgeResultText")
            .textContent =

                passed

                    ?

                    `Excellent! You scored ${percentage}%. Your next topic is ready on the dashboard.`

                    :

                    `You scored ${percentage}%. Your reading for this topic is recorded. Review the corrections and keep learning.`;

    }


    /*
       ------------------------------------------------------
       CORRECTIONS
       ------------------------------------------------------
    */

    const corrections =
        $("knowledgeCorrections");


    if (
        corrections
    ) {

        corrections.innerHTML =

            knowledgeQuestions

                .map(
                    (
                        question,
                        index
                    ) => `

                        <div
                            style="
                                margin:
                                    12px 0;
                                padding:
                                    14px;
                                border-radius:
                                    12px;
                                border:
                                    1px solid
                                    rgba(
                                        127,
                                        127,
                                        127,
                                        .2
                                    );
                            "
                        >

                            <strong>

                                ${
                                    index + 1
                                }.

                                ${escapeHTML(
                                    question.question
                                )}

                            </strong>

                            <br>

                            <span>

                                Your answer:

                                ${escapeHTML(
                                    question.options[
                                        answers[index]
                                    ]
                                )}

                            </span>

                            <br>

                            <span>

                                Correct answer:

                                ${escapeHTML(
                                    question.options[
                                        question.answer
                                    ]
                                )}

                            </span>


                            ${
                                question.explanation

                                    ?

                                    `

                                        <br>

                                        <small>

                                            ${escapeHTML(
                                                question.explanation
                                            )}

                                        </small>

                                    `

                                    :

                                    ""

                            }

                        </div>

                    `

                )

                .join("");

    }


    /*
       ------------------------------------------------------
       CONTINUE BUTTON
       ------------------------------------------------------
    */

    let button =
        $("knowledgeContinueButton");


    if (
        !button &&
        $("knowledgeResult")
    ) {

        button =
            document.createElement(
                "button"
            );


        button.id =
            "knowledgeContinueButton";


        button.className =
            "primary-button full-button";


        button.textContent =

            passed

                ? "🚀 Continue to Dashboard"

                : "📚 Return to Dashboard";


        button.style.marginTop =
            "20px";


        button.addEventListener(

            "click",

            () => {

                window.location.href =
                    knowledgePremiumVerified
                        ? "premium-dashboard.html"
                        : "dashboard.html";

            }

        );


        $("knowledgeResult")
            .appendChild(
                button
            );

    }

}


/* =========================================================
   UI STATES
========================================================= */

function showLoading() {

    if (
        $("knowledgeLoading")
    ) {

        $("knowledgeLoading")
            .style.display =
                "block";

    }


    if (
        $("knowledgeContent")
    ) {

        $("knowledgeContent")
            .style.display =
                "none";

    }


    if (
        $("knowledgeResult")
    ) {

        $("knowledgeResult")
            .style.display =
                "none";

    }


    if (
        $("knowledgeError")
    ) {

        $("knowledgeError")
            .style.display =
                "none";

    }


    if (
        $("knowledgeLimit")
    ) {

        $("knowledgeLimit")
            .style.display =
                "none";

    }

}


function showLimit() {

    if (
        $("knowledgeLoading")
    ) {

        $("knowledgeLoading")
            .style.display =
                "none";

    }


    if (
        $("knowledgeContent")
    ) {

        $("knowledgeContent")
            .style.display =
                "none";

    }


    if (
        $("knowledgeResult")
    ) {

        $("knowledgeResult")
            .style.display =
                "none";

    }


    if (
        $("knowledgeLimit")
    ) {

        $("knowledgeLimit")
            .style.display =
                "block";

    }

}


function showError(
    message
) {

    if (
        $("knowledgeLoading")
    ) {

        $("knowledgeLoading")
            .style.display =
                "none";

    }


    if (
        $("knowledgeContent")
    ) {

        $("knowledgeContent")
            .style.display =
                "none";

    }


    if (
        $("knowledgeError")
    ) {

        $("knowledgeError")
            .style.display =
                "block";

    }


    if (
        $("knowledgeErrorText")
    ) {

        $("knowledgeErrorText")
            .textContent =
                message;

    }

}
