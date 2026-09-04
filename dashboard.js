/* =========================================================
   STUDYMIND AI — DASHBOARD
   COMPLETE REPLACEMENT
========================================================= */

/* =========================================================
   ELEMENT SHORTCUT
========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   CONFIGURATION
========================================================= */

const DASHBOARD_CONFIG = {

    STORAGE: {
        PLAN: "studyMindPlan",
        STUDY_DATA: "studyData",

        COMPLETED_TOPICS:
            "studyMindCompletedTopics",

        COMPLETED_QUESTIONS:
            "studyMindCompletedQuestionTopics",

        CURRENT_TOPIC:
            "studyMindCurrentTopicIndex",

        TOPIC_QUESTIONS:
            "studyMindTopicQuestions",

        COMPLETED_DAYS:
            "studyMindCompletedDays",

        TIMER_DURATION:
            "studyMindTimerDuration",

        TIMER_SECONDS:
            "studyMindTimerSeconds",

        TIMER_RUNNING:
            "studyMindTimerRunning",

        THEME:
            "studyMindTheme",

        LAST_STUDY_DATE:
            "lastStudyDate",

        STREAK:
            "studyMindStreak"
    },

    KNOWLEDGE_CHECK_PASS_PERCENT: 60,

    QUESTIONS_PER_TOPIC: 5,

    DEFAULT_TIMER_SECONDS:
        25 * 60
};


/* =========================================================
   GLOBAL STATE
========================================================= */

let studyPlan = null;

let currentUser = null;

let topics = [];

let subjects = [];

let completedTopics = [];

let completedQuestionTopics = [];

let completedDays = [];

let currentTopicIndex = 0;

let activeKnowledgeCheckTopicKey = null;

let topicQuestions = [];

let currentCalendarDate = new Date();

let timerSeconds =
    DASHBOARD_CONFIG.DEFAULT_TIMER_SECONDS;

let timerInterval = null;

let timerRunning = false;

let timerDuration =
    DASHBOARD_CONFIG.DEFAULT_TIMER_SECONDS;


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeDashboard
);


async function initializeDashboard() {

    try {

        initializeTheme();

        loadStoredState();

        setupEventListeners();

        await loadCurrentUser();

        loadStudyPlan();

        normalizeCurrentTopicIndex();

        restoreTimer();

        renderDashboard();

        startGreetingRefresh();

    } catch (error) {

        console.error(
            "Dashboard initialization error:",
            error
        );

    }

}


/* =========================================================
   STORAGE HELPERS
========================================================= */

function getStoredJSON(
    key,
    fallback
) {

    try {

        const value =
            localStorage.getItem(key);

        if (!value) {
            return fallback;
        }

        return JSON.parse(value);

    } catch (error) {

        console.error(
            `Could not read ${key}:`,
            error
        );

        return fallback;

    }

}


function setStoredJSON(
    key,
    value
) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

    } catch (error) {

        console.error(
            `Could not save ${key}:`,
            error
        );

    }

}


/* =========================================================
   LOAD STORED STATE
========================================================= */

function loadStoredState() {

    completedTopics =
        getStoredJSON(
            DASHBOARD_CONFIG.STORAGE.COMPLETED_TOPICS,
            []
        );

    completedQuestionTopics =
        getStoredJSON(
            DASHBOARD_CONFIG.STORAGE.COMPLETED_QUESTIONS,
            []
        );

    completedDays =
        getStoredJSON(
            DASHBOARD_CONFIG.STORAGE.COMPLETED_DAYS,
            []
        );

    currentTopicIndex =
        Number(
            localStorage.getItem(
                DASHBOARD_CONFIG.STORAGE.CURRENT_TOPIC
            )
        ) || 0;

}


/* =========================================================
   STUDY PLAN LOADING
========================================================= */

function loadStudyPlan() {

    let rawPlan =
        localStorage.getItem(
            DASHBOARD_CONFIG.STORAGE.PLAN
        );

    if (!rawPlan) {

        rawPlan =
            localStorage.getItem(
                DASHBOARD_CONFIG.STORAGE.STUDY_DATA
            );

    }

    if (!rawPlan) {

        studyPlan = null;

        topics = [];

        subjects = [];

        return;

    }

    try {

        studyPlan =
            typeof rawPlan === "string"
                ? JSON.parse(rawPlan)
                : rawPlan;

    } catch (error) {

        console.error(
            "Could not parse study plan:",
            error
        );

        studyPlan = null;

    }

    topics =
        extractTopics(studyPlan);

    subjects =
        extractSubjects(studyPlan);

}


/* =========================================================
   EXTRACT TOPICS
========================================================= */

function extractTopics(plan) {

    if (!plan) {
        return [];
    }

    let rawTopics = [];


    if (Array.isArray(plan)) {

        rawTopics = plan;

    } else if (
        Array.isArray(plan.topics)
    ) {

        rawTopics = plan.topics;

    } else if (
        Array.isArray(plan.studyTopics)
    ) {

        rawTopics =
            plan.studyTopics;

    } else if (
        Array.isArray(plan.subjects)
    ) {

        plan.subjects.forEach(
            subject => {

                if (
                    Array.isArray(
                        subject.topics
                    )
                ) {

                    subject.topics.forEach(
                        topic => {

                            rawTopics.push({
                                ...topic,
                                subject:
                                    topic.subject ||
                                    subject.name ||
                                    subject.subject
                            });

                        }
                    );

                }

            }
        );

    }

    return rawTopics
        .map(
            (topic, index) =>
                normalizeTopic(
                    topic,
                    index
                )
        )
        .filter(Boolean);

}


/* =========================================================
   NORMALIZE TOPIC
========================================================= */

function normalizeTopic(
    topic,
    index
) {

    if (!topic) {
        return null;
    }

    if (typeof topic === "string") {

        return {

            id:
                `topic-${index}`,

            key:
                `topic-${index}`,

            name:
                topic,

            title:
                topic,

            description:
                `Study ${topic} and complete the knowledge check.`,

            subject:
                "",

            index

        };

    }

    const name =
        topic.name ||
        topic.title ||
        topic.topic ||
        topic.topicName ||
        topic.subjectName ||
        `Topic ${index + 1}`;

    const description =
        topic.description ||
        topic.details ||
        topic.summary ||
        `Study ${name} and complete the knowledge check.`;

    const subject =
        topic.subject ||
        topic.subjectName ||
        topic.parentSubject ||
        "";

    const id =
        String(
            topic.id ||
            topic.key ||
            `${subject}-${name}-${index}`
        );

    return {

        ...topic,

        id,

        key: id,

        name,

        title: name,

        description,

        subject,

        index

    };

}


/* =========================================================
   EXTRACT SUBJECTS
========================================================= */

function extractSubjects(plan) {

    if (!plan) {
        return [];
    }

    let rawSubjects = [];

    if (
        Array.isArray(plan.subjects)
    ) {

        rawSubjects =
            plan.subjects;

    }

    if (!rawSubjects.length) {

        const subjectNames =
            [
                ...new Set(
                    topics
                        .map(
                            topic =>
                                topic.subject
                        )
                        .filter(Boolean)
                )
            ];

        return subjectNames.map(
            name => ({
                name,
                topics:
                    topics.filter(
                        topic =>
                            topic.subject === name
                    )
            })
        );

    }

    return rawSubjects
        .map(
            subject => {

                if (
                    typeof subject === "string"
                ) {

                    return {
                        name: subject,
                        topics: []
                    };

                }

                return {

                    ...subject,

                    name:
                        subject.name ||
                        subject.title ||
                        subject.subject ||
                        "Subject",

                    topics:
                        Array.isArray(
                            subject.topics
                        )
                            ? subject.topics
                            : []

                };

            }
        );

}


/* =========================================================
   NORMALIZE CURRENT TOPIC INDEX
========================================================= */

function normalizeCurrentTopicIndex() {

    if (!topics.length) {

        currentTopicIndex = 0;

        return;

    }

    if (
        currentTopicIndex < 0
    ) {

        currentTopicIndex = 0;

    }

    if (
        currentTopicIndex >= topics.length
    ) {

        currentTopicIndex =
            topics.length - 1;

    }

    localStorage.setItem(
        DASHBOARD_CONFIG.STORAGE.CURRENT_TOPIC,
        String(currentTopicIndex)
    );

}


/* =========================================================
   CURRENT TOPIC
========================================================= */

function getCurrentTopic() {

    if (!topics.length) {
        return null;
    }

    return (
        topics[currentTopicIndex] ||
        null
    );

}


/* =========================================================
   TOPIC KEY
========================================================= */

function getTopicKey(topic) {

    if (!topic) {
        return "";
    }

    return String(
        topic.key ||
        topic.id ||
        topic.name ||
        topic.title ||
        ""
    );

}


/* =========================================================
   TOPIC COMPLETION
========================================================= */

function isTopicStudyCompleted(topic) {

    const key =
        getTopicKey(topic);

    return completedTopics.includes(
        key
    );

}


function isTopicQuestionCompleted(topic) {

    const key =
        getTopicKey(topic);

    return completedQuestionTopics.includes(
        key
    );

}


function isTopicFullyCompleted(topic) {

    return (
        isTopicStudyCompleted(topic) &&
        isTopicQuestionCompleted(topic)
    );

}


/* =========================================================
   RENDER ENTIRE DASHBOARD
========================================================= */

function renderDashboard() {

    renderDashboardGreeting();

    renderCurrentTopic();

    renderProgress();

    renderTopics();

    renderSubjects();

    renderStats();

    renderDailyChallenge();

    renderCalendar();

    renderSchedule();

    renderNextSession();

}


/* =========================================================
   PERSONALIZED GREETING
========================================================= */

function getGreeting() {

    const hour =
        new Date().getHours();

    if (
        hour >= 5 &&
        hour < 12
    ) {

        return "Good morning";

    }

    if (
        hour >= 12 &&
        hour < 17
    ) {

        return "Good afternoon";

    }

    return "Good evening";

}


/* =========================================================
   GET USERNAME
========================================================= */

function getUsername() {

    if (!currentUser) {
        return null;
    }

    let username =
        currentUser.user_metadata?.username ||
        currentUser.user_metadata?.display_name ||
        currentUser.user_metadata?.full_name;

    if (
        !username &&
        currentUser.email
    ) {

        username =
            currentUser.email
                .split("@")[0];

    }

    return username || null;

}


/* =========================================================
   RENDER GREETING
========================================================= */

function renderDashboardGreeting() {

    const greetingElement =
        $("dashboardGreeting");

    if (!greetingElement) {
        return;
    }

    const greeting =
        getGreeting();

    const username =
        getUsername();

    if (username) {

        greetingElement.textContent =
            `${greeting}, ${username} 👋`;

    } else {

        greetingElement.textContent =
            `${greeting} 👋`;

    }

}


/* =========================================================
   REFRESH GREETING
   Allows the greeting to change automatically while
   the dashboard remains open.
========================================================= */

function startGreetingRefresh() {

    setInterval(
        () => {

            renderDashboardGreeting();

        },
        60 * 1000
    );

}


/* =========================================================
   LOAD CURRENT USER
========================================================= */

async function loadCurrentUser() {

    try {

        if (
            typeof supabase === "undefined" ||
            !supabase.auth
        ) {

            renderDashboardGreeting();

            return;

        }

        const {
            data,
            error
        } =
            await supabase.auth.getSession();

        if (error) {

            console.error(
                "Could not retrieve Supabase session:",
                error
            );

            renderDashboardGreeting();

            return;

        }

        currentUser =
            data?.session?.user ||
            null;


        if (!currentUser) {

            renderDashboardGreeting();

            return;

        }


        /*
         * Try the username stored in Supabase
         * user metadata first.
         */

        let username =
            currentUser.user_metadata?.username ||
            currentUser.user_metadata?.display_name ||
            currentUser.user_metadata?.full_name;


        /*
         * If there is no username in metadata,
         * try the profiles table.
         */

        if (!username) {

            try {

                const {
                    data: profile,
                    error: profileError
                } =
                    await supabase
                        .from("profiles")
                        .select(
                            "username, display_name, full_name"
                        )
                        .eq(
                            "id",
                            currentUser.id
                        )
                        .maybeSingle();


                if (
                    !profileError &&
                    profile
                ) {

                    username =
                        profile.username ||
                        profile.display_name ||
                        profile.full_name;

                }

            } catch (profileError) {

                console.warn(
                    "Could not load profile:",
                    profileError
                );

            }

        }


        /*
         * If a username was found in the profile,
         * add it to the current user's metadata
         * for this page session.
         */

        if (username) {

            currentUser =
                {
                    ...currentUser,

                    user_metadata: {
                        ...(
                            currentUser.user_metadata ||
                            {}
                        ),

                        username
                    }

                };

        }


        renderDashboardGreeting();

    } catch (error) {

        console.error(
            "Could not load current user:",
            error
        );

        renderDashboardGreeting();

    }

}


/* =========================================================
   CURRENT TOPIC RENDER
========================================================= */

function renderCurrentTopic() {

    const topic =
        getCurrentTopic();

    const nameElement =
        $("currentTopicName");

    const descriptionElement =
        $("currentTopicDescription");

    const positionElement =
        $("topicPosition");

    const badgeElement =
        $("topicStatusBadge");

    const checkbox =
        $("topicCompleteCheckbox");

    const completionMessage =
        $("topicCompletionMessage");

    const completionArea =
        $("topicCompletionArea");

    const questionsSection =
        $("topicQuestionsSection");

    const nextMessage =
        $("nextTopicMessage");


    if (!topic) {

        if (nameElement) {

            nameElement.textContent =
                "No topic available";

        }

        if (descriptionElement) {

            descriptionElement.textContent =
                "Create a study plan to begin studying.";

        }

        if (positionElement) {

            positionElement.textContent =
                "NO TOPIC";

        }

        if (badgeElement) {

            badgeElement.textContent =
                "READY";

        }

        if (questionsSection) {

            questionsSection.style.display =
                "none";

        }

        return;

    }


    if (nameElement) {

        nameElement.textContent =
            topic.name;

    }

    if (descriptionElement) {

        descriptionElement.textContent =
            topic.description;

    }

    if (positionElement) {

        positionElement.textContent =
            `TOPIC ${currentTopicIndex + 1} OF ${topics.length}`;

    }


    const studyCompleted =
        isTopicStudyCompleted(topic);

    const questionCompleted =
        isTopicQuestionCompleted(topic);

    const fullyCompleted =
        isTopicFullyCompleted(topic);


    if (badgeElement) {

        if (fullyCompleted) {

            badgeElement.textContent =
                "COMPLETED";

        } else if (studyCompleted) {

            badgeElement.textContent =
                "KNOWLEDGE CHECK";

        } else {

            badgeElement.textContent =
                "IN PROGRESS";

        }

    }


    if (completionArea) {

        completionArea.style.display =
            "block";

    }


    if (checkbox) {

        checkbox.checked =
            studyCompleted;

    }


    if (completionMessage) {

        if (fullyCompleted) {

            completionMessage.textContent =
                "Topic completed successfully.";

        } else if (studyCompleted) {

            completionMessage.textContent =
                "You finished studying this topic. Complete the Knowledge Check.";

        } else {

            completionMessage.textContent =
                "When you finish studying, tick this box to unlock the Knowledge Check.";

        }

    }


    /*
     * IMPORTANT:
     * Knowledge Check is ONLY visible after
     * the user clicks "I have finished studying
     * this topic."
     */

    if (questionsSection) {

        if (
            studyCompleted &&
            !questionCompleted
        ) {

            questionsSection.style.display =
                "block";

        } else {

            questionsSection.style.display =
                "none";

        }

    }


    if (nextMessage) {

        if (fullyCompleted) {

            if (
                currentTopicIndex <
                topics.length - 1
            ) {

                nextMessage.textContent =
                    `Next topic: ${topics[currentTopicIndex + 1].name}`;

            } else {

                nextMessage.textContent =
                    "You have completed all topics in this study plan!";

            }

        } else {

            nextMessage.textContent =
                "";

        }

    }


    if (
        studyCompleted &&
        !questionCompleted
    ) {

        if (
            activeKnowledgeCheckTopicKey !==
            getTopicKey(topic)
        ) {

            showKnowledgeCheck(
                topic
            );

        }

    }

}


/* =========================================================
   FINISH STUDYING CURRENT TOPIC
========================================================= */

function completeCurrentTopic() {

    const topic =
        getCurrentTopic();

    if (!topic) {
        return;
    }

    const key =
        getTopicKey(topic);


    if (
        !completedTopics.includes(key)
    ) {

        completedTopics.push(key);

        setStoredJSON(
            DASHBOARD_CONFIG.STORAGE.COMPLETED_TOPICS,
            completedTopics
        );

    }


    stopTimer();

    updateStreak();

    renderCurrentTopic();

    showKnowledgeCheck(topic);

    renderTopics();

    renderProgress();

    renderStats();

    renderCalendar();

    renderSchedule();

    renderNextSession();

}


/* =========================================================
   TOPIC COMPLETION CHECKBOX
========================================================= */

function handleTopicCompletionChange() {

    const checkbox =
        $("topicCompleteCheckbox");

    if (!checkbox) {
        return;
    }

    if (checkbox.checked) {

        completeCurrentTopic();

    } else {

        const topic =
            getCurrentTopic();

        if (!topic) {
            return;
        }

        const key =
            getTopicKey(topic);

        completedTopics =
            completedTopics.filter(
                item => item !== key
            );

        setStoredJSON(
            DASHBOARD_CONFIG.STORAGE.COMPLETED_TOPICS,
            completedTopics
        );

        renderCurrentTopic();

        renderTopics();

        renderProgress();

        renderStats();

        renderCalendar();

    }

}


/* =========================================================
   KNOWLEDGE CHECK
========================================================= */

function showKnowledgeCheck(topic) {

    if (!topic) {
        return;
    }

    const key =
        getTopicKey(topic);

    activeKnowledgeCheckTopicKey =
        key;


    const section =
        $("topicQuestionsSection");

    if (!section) {
        return;
    }


    section.style.display =
        "block";


    generateTopicQuestions(
        topic
    );

}


/* =========================================================
   GENERATE QUESTIONS
========================================================= */

async function generateTopicQuestions(topic) {

    const container =
        $("topicQuestions");

    if (!container) {
        return;
    }


    container.innerHTML =
        `
        <div class="loading-state">
            <p>Generating your Knowledge Check...</p>
        </div>
        `;


    const key =
        getTopicKey(topic);


    const storedQuestions =
        getStoredJSON(
            DASHBOARD_CONFIG.STORAGE.TOPIC_QUESTIONS,
            {}
        );


    if (
        storedQuestions[key] &&
        Array.isArray(
            storedQuestions[key]
        ) &&
        storedQuestions[key].length >=
            DASHBOARD_CONFIG.QUESTIONS_PER_TOPIC
    ) {

        topicQuestions =
            storedQuestions[key].slice(
                0,
                DASHBOARD_CONFIG.QUESTIONS_PER_TOPIC
            );

        renderKnowledgeCheck();

        return;

    }


    try {

        const questions =
            await requestQuestionsFromAI(
                topic
            );


        if (
            Array.isArray(questions) &&
            questions.length >=
                DASHBOARD_CONFIG.QUESTIONS_PER_TOPIC
        ) {

            topicQuestions =
                questions
                    .slice(
                        0,
                        DASHBOARD_CONFIG.QUESTIONS_PER_TOPIC
                    )
                    .map(
                        normalizeQuestion
                    );

        } else {

            topicQuestions =
                createFallbackQuestions(
                    topic
                );

        }

    } catch (error) {

        console.error(
            "Question generation failed:",
            error
        );

        topicQuestions =
            createFallbackQuestions(
                topic
            );

    }


    storedQuestions[key] =
        topicQuestions;

    setStoredJSON(
        DASHBOARD_CONFIG.STORAGE.TOPIC_QUESTIONS,
        storedQuestions
    );


    renderKnowledgeCheck();

}


/* =========================================================
   REQUEST QUESTIONS FROM AI
========================================================= */

async function requestQuestionsFromAI(topic) {

    const payload = {

        topic:
            topic.name,

        topicName:
            topic.name,

        description:
            topic.description,

        subject:
            topic.subject || "",

        count:
            DASHBOARD_CONFIG.QUESTIONS_PER_TOPIC,

        numberOfQuestions:
            DASHBOARD_CONFIG.QUESTIONS_PER_TOPIC

    };


    const endpoints = [

        "/api/generate-questions",

        "/api/questions",

        "/api/ask-ai"

    ];


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
                            JSON.stringify(
                                payload
                            )

                    }
                );


            if (!response.ok) {
                continue;
            }


            const data =
                await response.json();


            const questions =
                extractQuestionsFromResponse(
                    data
                );


            if (
                questions.length >=
                DASHBOARD_CONFIG.QUESTIONS_PER_TOPIC
            ) {

                return questions;

            }

        } catch (error) {

            console.warn(
                `Question endpoint ${endpoint} failed:`,
                error
            );

        }

    }


    return [];

}


/* =========================================================
   EXTRACT QUESTIONS FROM API RESPONSE
========================================================= */

function extractQuestionsFromResponse(
    data
) {

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

        data.response?.questions

    ];


    for (
        const array of possibleArrays
    ) {

        if (
            Array.isArray(array)
        ) {

            return array;

        }

    }


    return [];

}


/* =========================================================
   NORMALIZE QUESTION
========================================================= */

function normalizeQuestion(
    question,
    index
) {

    if (
        typeof question === "string"
    ) {

        return {

            question,

            options: [],

            answer: "",

            correctAnswer: "",

            explanation: ""

        };

    }


    const options =
        question.options ||
        question.choices ||
        question.answers ||
        [];


    let answer =
        question.answer ??
        question.correctAnswer ??
        question.correct ??
        question.correct_option ??
        "";


    if (
        typeof answer === "number" &&
        options[answer]
    ) {

        answer =
            options[answer];

    }


    return {

        question:
            question.question ||
            question.text ||
            question.prompt ||
            `Question ${index + 1}`,

        options:

            Array.isArray(options)
                ? options
                : [],

        answer:
            String(answer),

        correctAnswer:
            String(
                question.correctAnswer ??
                answer
            ),

        explanation:
            question.explanation ||
            ""

    };

}


/* =========================================================
   FALLBACK QUESTIONS
========================================================= */

function createFallbackQuestions(topic) {

    const name =
        topic.name ||
        "this topic";


    return [

        {
            question:
                `What is the main idea of ${name}?`,
            options: [
                "The central concept being studied",
                "An unrelated subject",
                "A random example",
                "None of these"
            ],
            answer:
                "The central concept being studied",
            correctAnswer:
                "The central concept being studied",
            explanation:
                "The main idea is the central concept of the topic."
        },

        {
            question:
                `Why is ${name} important?`,
            options: [
                "Because it helps understand the subject",
                "Because it is unrelated",
                "Because it should be ignored",
                "None of these"
            ],
            answer:
                "Because it helps understand the subject",
            correctAnswer:
                "Because it helps understand the subject",
            explanation:
                "Understanding why a topic matters helps connect it to the wider subject."
        },

        {
            question:
                `Which statement best describes ${name}?`,
            options: [
                "It is a concept that should be understood and applied",
                "It has no meaning",
                "It is unrelated to learning",
                "None of these"
            ],
            answer:
                "It is a concept that should be understood and applied",
            correctAnswer:
                "It is a concept that should be understood and applied",
            explanation:
                "A good understanding means you can explain and apply the concept."
        },

        {
            question:
                `What should you be able to do after studying ${name}?`,
            options: [
                "Explain the key ideas",
                "Forget everything",
                "Avoid the topic",
                "None of these"
            ],
            answer:
                "Explain the key ideas",
            correctAnswer:
                "Explain the key ideas",
            explanation:
                "You should be able to explain the important ideas from the topic."
        },

        {
            question:
                `What is the best way to check your understanding of ${name}?`,
            options: [
                "Answer questions without relying on your notes",
                "Skip the topic",
                "Only read the title",
                "None of these"
            ],
            answer:
                "Answer questions without relying on your notes",
            correctAnswer:
                "Answer questions without relying on your notes",
            explanation:
                "Retrieval practice is a useful way to test what you actually remember."
        }

    ];

}


/* =========================================================
   RENDER KNOWLEDGE CHECK
========================================================= */

function renderKnowledgeCheck() {

    const container =
        $("topicQuestions");

    if (!container) {
        return;
    }


    if (!topicQuestions.length) {

        container.innerHTML =
            "<p>Unable to create questions.</p>";

        return;

    }


    container.innerHTML =
        topicQuestions
            .map(
                (
                    question,
                    index
                ) => {

                    const options =
                        Array.isArray(
                            question.options
                        )
                            ? question.options
                            : [];


                    return `
                        <div class="knowledge-question"
                             data-question-index="${index}">

                            <h3>
                                ${index + 1}. ${escapeHTML(
                                    question.question
                                )}
                            </h3>

                            <div class="question-options">

                                ${
                                    options
                                        .map(
                                            (
                                                option,
                                                optionIndex
                                            ) => `
                                                <label class="question-option">

                                                    <input
                                                        type="radio"
                                                        name="question-${index}"
                                                        value="${escapeAttribute(
                                                            option
                                                        )}"
                                                    >

                                                    <span>
                                                        ${escapeHTML(
                                                            option
                                                        )}
                                                    </span>

                                                </label>
                                            `
                                        )
                                        .join("")
                                }

                            </div>

                        </div>
                    `;

                }
            )
            .join("");


    const result =
        $("topicQuestionResult");

    if (result) {

        result.textContent =
            "";

    }

}


/* =========================================================
   SUBMIT KNOWLEDGE CHECK
========================================================= */

function submitKnowledgeCheck() {

    const topic =
        getCurrentTopic();

    if (!topic) {
        return;
    }


    if (
        !topicQuestions.length
    ) {

        return;

    }


    let correct =
        0;

    let unanswered =
        0;


    topicQuestions.forEach(
        (
            question,
            index
        ) => {

            const selected =
                document.querySelector(
                    `input[name="question-${index}"]:checked`
                );


            if (!selected) {

                unanswered++;

                return;

            }


            const userAnswer =
                normalizeAnswer(
                    selected.value
                );

            const correctAnswer =
                normalizeAnswer(
                    question.correctAnswer ||
                    question.answer
                );


            if (
                userAnswer ===
                correctAnswer
            ) {

                correct++;

            }

        }
    );


    const total =
        topicQuestions.length;

    const percentage =
        Math.round(
            (correct / total) * 100
        );


    const result =
        $("topicQuestionResult");


    if (unanswered > 0) {

        if (result) {

            result.textContent =
                `Please answer all ${total} questions before submitting.`;

        }

        return;

    }


    if (
        percentage >=
        DASHBOARD_CONFIG.KNOWLEDGE_CHECK_PASS_PERCENT
    ) {

        if (result) {

            result.textContent =
                `Great job! You scored ${correct}/${total} (${percentage}%). Topic completed!`;

        }


        const key =
            getTopicKey(topic);


        if (
            !completedQuestionTopics.includes(
                key
            )
        ) {

            completedQuestionTopics.push(
                key
            );

            setStoredJSON(
                DASHBOARD_CONFIG.STORAGE.COMPLETED_QUESTIONS,
                completedQuestionTopics
            );

        }


        markTodayCompleted();

        updateStreak();

        renderCurrentTopic();

        renderProgress();

        renderTopics();

        renderStats();

        renderCalendar();

        renderSchedule();


        setTimeout(
            moveToNextTopic,
            1500
        );


    } else {

        if (result) {

            result.textContent =
                `You scored ${correct}/${total} (${percentage}%). You need at least 60% to complete this topic. Review the topic and try again.`;

        }

    }

}


/* =========================================================
   MOVE TO NEXT TOPIC
========================================================= */

function moveToNextTopic() {

    if (
        currentTopicIndex <
        topics.length - 1
    ) {

        currentTopicIndex++;

        localStorage.setItem(
            DASHBOARD_CONFIG.STORAGE.CURRENT_TOPIC,
            String(currentTopicIndex)
        );


        activeKnowledgeCheckTopicKey =
            null;

        topicQuestions = [];

        renderDashboard();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    } else {

        renderDashboard();

    }

}


/* =========================================================
   PROGRESS
========================================================= */

function getCompletedTopicCount() {

    return topics.filter(
        topic =>
            isTopicFullyCompleted(topic)
    ).length;

}


function getStudyCompletedCount() {

    return topics.filter(
        topic =>
            isTopicStudyCompleted(topic)
    ).length;

}


function renderProgress() {

    const total =
        topics.length;

    const completed =
        getCompletedTopicCount();

    const percent =
        total > 0
            ? Math.round(
                (completed / total) * 100
            )
            : 0;


    const percentElement =
        $("progressPercent");

    const countElement =
        $("progressCount");

    const bar =
        $("progressBar");


    if (percentElement) {

        percentElement.textContent =
            `${percent}%`;

    }


    if (countElement) {

        countElement.textContent =
            `${completed} of ${total} topics completed`;

    }


    if (bar) {

        bar.style.width =
            `${percent}%`;

        bar.setAttribute(
            "aria-valuenow",
            String(percent)
        );

    }

}


/* =========================================================
   TOPIC LIST
========================================================= */

function renderTopics() {

    const container =
        $("topicList");

    if (!container) {
        return;
    }


    if (!topics.length) {

        container.innerHTML =
            `
            <div class="empty-state">
                <p>No topics found.</p>
            </div>
            `;

        return;

    }


    container.innerHTML =
        topics
            .map(
                (
                    topic,
                    index
                ) => {

                    const studyCompleted =
                        isTopicStudyCompleted(
                            topic
                        );

                    const questionCompleted =
                        isTopicQuestionCompleted(
                            topic
                        );

                    const completed =
                        studyCompleted &&
                        questionCompleted;


                    let status =
                        "Not started";


                    if (completed) {

                        status =
                            "Completed";

                    } else if (
                        studyCompleted
                    ) {

                        status =
                            "Knowledge Check";

                    } else if (
                        index === currentTopicIndex
                    ) {

                        status =
                            "In progress";

                    }


                    return `
                        <div
                            class="topic-item ${
                                index === currentTopicIndex
                                    ? "active"
                                    : ""
                            } ${
                                completed
                                    ? "completed"
                                    : ""
                            }"
                            data-topic-index="${index}"
                        >

                            <div class="topic-item-main">

                                <div class="topic-number">
                                    ${index + 1}
                                </div>

                                <div class="topic-item-content">

                                    <h3>
                                        ${escapeHTML(
                                            topic.name
                                        )}
                                    </h3>

                                    ${
                                        topic.subject
                                            ? `
                                                <p>
                                                    ${escapeHTML(
                                                        topic.subject
                                                    )}
                                                </p>
                                            `
                                            : ""
                                    }

                                </div>

                            </div>

                            <div class="topic-item-status">
                                ${status}
                            </div>

                        </div>
                    `;

                }
            )
            .join("");


    container
        .querySelectorAll(
            "[data-topic-index]"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    () => {

                        const index =
                            Number(
                                element.dataset
                                    .topicIndex
                            );

                        if (
                            Number.isInteger(
                                index
                            )
                        ) {

                            currentTopicIndex =
                                index;

                            localStorage.setItem(
                                DASHBOARD_CONFIG.STORAGE.CURRENT_TOPIC,
                                String(
                                    currentTopicIndex
                                )
                            );

                            activeKnowledgeCheckTopicKey =
                                null;

                            topicQuestions = [];

                            renderDashboard();

                        }

                    }
                );

            }
        );

}


/* =========================================================
   SUBJECTS
========================================================= */

function renderSubjects() {

    const container =
        $("subjectList");

    if (!container) {
        return;
    }


    if (!subjects.length) {

        const grouped = {};

        topics.forEach(
            topic => {

                const subject =
                    topic.subject ||
                    "General";

                if (!grouped[subject]) {

                    grouped[subject] =
                        [];

                }

                grouped[subject].push(
                    topic
                );

            }
        );


        subjects =
            Object.entries(
                grouped
            ).map(
                (
                    [
                        name,
                        subjectTopics
                    ]
                ) => ({
                    name,
                    topics:
                        subjectTopics
                })
            );

    }


    if (!subjects.length) {

        container.innerHTML =
            "<p>No subjects available.</p>";

        return;

    }


    container.innerHTML =
        subjects
            .map(
                subject => {

                    const subjectTopics =
                        Array.isArray(
                            subject.topics
                        )
                            ? subject.topics
                            : [];


                    const completed =
                        subjectTopics.filter(
                            topic =>
                                isTopicFullyCompleted(
                                    normalizeTopic(
                                        topic,
                                        0
                                    )
                                )
                        ).length;


                    const total =
                        subjectTopics.length;


                    return `
                        <div class="subject-item">

                            <div class="subject-item-header">

                                <h3>
                                    ${escapeHTML(
                                        subject.name
                                    )}
                                </h3>

                                <span>
                                    ${
                                        total
                                            ? `${completed}/${total}`
                                            : ""
                                    }
                                </span>

                            </div>

                        </div>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   STATS
========================================================= */

function renderStats() {

    const weeklyHours =
        $("weeklyHours");

    const daysLeft =
        $("daysLeft");

    const dailyGoal =
        $("dailyGoal");

    const studyScore =
        $("studyScore");


    const completed =
        getCompletedTopicCount();

    const total =
        topics.length;


    if (weeklyHours) {

        const estimatedHours =
            Math.round(
                (
                    getStudyCompletedCount() *
                    0.5
                ) * 10
            ) / 10;

        weeklyHours.textContent =
            `${estimatedHours}h`;

    }


    if (daysLeft) {

        const examDate =
            findExamDate();

        if (examDate) {

            const now =
                startOfDay(
                    new Date()
                );

            const difference =
                examDate.getTime() -
                now.getTime();

            const days =
                Math.max(
                    0,
                    Math.ceil(
                        difference /
                        86400000
                    )
                );

            daysLeft.textContent =
                String(days);

        } else {

            daysLeft.textContent =
                "—";

        }

    }


    if (dailyGoal) {

        dailyGoal.textContent =
            completed > 0
                ? `${completed}/${total}`
                : "0";

    }


    if (studyScore) {

        const score =
            total > 0
                ? Math.round(
                    (completed / total) *
                    100
                )
                : 0;

        studyScore.textContent =
            `${score}`;

    }

}


/* =========================================================
   DAILY CHALLENGE
========================================================= */

function renderDailyChallenge() {

    const challengeText =
        $("dailyChallengeText");

    const challengeTitle =
        $("dailyChallengeTitle");

    const challengeDescription =
        $("dailyChallengeDescription");

    const challengeProgress =
        $("dailyChallengeProgress");

    const challengeBar =
        $("dailyChallengeProgressBar");

    const challengeBadge =
        $("dailyChallengeBadge");


    const topic =
        getCurrentTopic();


    if (challengeTitle) {

        challengeTitle.textContent =
            topic
                ? `Study ${topic.name}`
                : "Daily Study Challenge";

    }


    if (challengeDescription) {

        challengeDescription.textContent =
            topic
                ? "Complete your current topic and Knowledge Check."
                : "Create a study plan to begin.";

    }


    if (challengeText) {

        challengeText.textContent =
            topic
                ? "Keep your study streak going!"
                : "Your daily challenge will appear here.";

    }


    const completed =
        topic
            ? isTopicFullyCompleted(topic)
            : false;


    if (challengeProgress) {

        challengeProgress.textContent =
            completed
                ? "Complete"
                : "In progress";

    }


    if (challengeBar) {

        challengeBar.style.width =
            completed
                ? "100%"
                : "0%";

    }


    if (challengeBadge) {

        challengeBadge.textContent =
            completed
                ? "DONE"
                : "TODAY";

    }

}


/* =========================================================
   CALENDAR
========================================================= */

function renderCalendar() {

    const container =
        $("calendarDays");

    const monthElement =
        $("calendarMonth");


    if (!container) {
        return;
    }


    const year =
        currentCalendarDate.getFullYear();

    const month =
        currentCalendarDate.getMonth();


    if (monthElement) {

        monthElement.textContent =
            new Date(
                year,
                month,
                1
            ).toLocaleDateString(
                undefined,
                {
                    month: "long",
                    year: "numeric"
                }
            );

    }


    const firstDay =
        new Date(
            year,
            month,
            1
        ).getDay();


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    const today =
        startOfDay(
            new Date()
        );


    let html = "";


    for (
        let i = 0;
        i < firstDay;
        i++
    ) {

        html +=
            `<div class="calendar-day empty"></div>`;

    }


    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const date =
            new Date(
                year,
                month,
                day
            );


        const dateKey =
            formatDateKey(
                date
            );


        const isToday =
            dateKey ===
            formatDateKey(today);


        const completed =
            completedDays.includes(
                dateKey
            );


        const examDate =
            findExamDate();


        const isExam =
            examDate &&
            formatDateKey(
                examDate
            ) === dateKey;


        let classes =
            "calendar-day";


        if (isToday) {

            classes +=
                " today";

        }


        if (completed) {

            classes +=
                " completed";

        }


        if (isExam) {

            classes +=
                " exam";

        }


        html +=
            `
            <div
                class="${classes}"
                data-date="${dateKey}"
                title="${
                    completed
                        ? "Study completed"
                        : isExam
                            ? "Exam day"
                            : ""
                }"
            >
                <span>${day}</span>
            </div>
            `;

    }


    container.innerHTML =
        html;

}


/* =========================================================
   MARK TODAY COMPLETED
========================================================= */

function markTodayCompleted() {

    const todayKey =
        formatDateKey(
            new Date()
        );


    if (
        !completedDays.includes(
            todayKey
        )
    ) {

        completedDays.push(
            todayKey
        );

    }


    setStoredJSON(
        DASHBOARD_CONFIG.STORAGE.COMPLETED_DAYS,
        completedDays
    );

}


/* =========================================================
   SCHEDULE
========================================================= */

function renderSchedule() {

    const container =
        $("scheduleList");

    if (!container) {
        return;
    }


    if (!topics.length) {

        container.innerHTML =
            `
            <div class="empty-state">
                <p>No study schedule available.</p>
            </div>
            `;

        return;

    }


    const upcomingTopics =
        topics
            .slice(
                currentTopicIndex,
                currentTopicIndex + 5
            );


    container.innerHTML =
        upcomingTopics
            .map(
                (
                    topic,
                    index
                ) => {

                    const actualIndex =
                        currentTopicIndex +
                        index;


                    const completed =
                        isTopicFullyCompleted(
                            topic
                        );


                    return `
                        <div class="schedule-item">

                            <div class="schedule-item-time">
                                ${
                                    completed
                                        ? "✓"
                                        : `Topic ${
                                            actualIndex + 1
                                        }`
                                }
                            </div>

                            <div class="schedule-item-content">

                                <strong>
                                    ${escapeHTML(
                                        topic.name
                                    )}
                                </strong>

                                <span>
                                    ${
                                        topic.subject
                                            ? escapeHTML(
                                                topic.subject
                                            )
                                            : "Study Session"
                                    }
                                </span>

                            </div>

                        </div>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   NEXT SESSION
========================================================= */

function renderNextSession() {

    const booking =
        $("nextBooking");

    const bookingTime =
        $("nextBookingTime");


    const topic =
        getCurrentTopic();


    if (!topic) {

        if (booking) {

            booking.textContent =
                "No upcoming session";

        }

        if (bookingTime) {

            bookingTime.textContent =
                "Create a study plan to begin.";

        }

        return;

    }


    if (booking) {

        booking.textContent =
            topic.name;

    }


    if (bookingTime) {

        bookingTime.textContent =
            "Continue your current study topic";

    }

}


/* =========================================================
   FIND EXAM DATE
========================================================= */

function findExamDate() {

    if (!studyPlan) {
        return null;
    }


    const possibleValues = [

        studyPlan.examDate,

        studyPlan.testDate,

        studyPlan.exam_date,

        studyPlan.test_date,

        studyPlan.exam?.date,

        studyPlan.test?.date

    ];


    for (
        const value of possibleValues
    ) {

        if (!value) {
            continue;
        }


        const date =
            new Date(value);


        if (
            !Number.isNaN(
                date.getTime()
            )
        ) {

            return startOfDay(
                date
            );

        }

    }


    return null;

}


/* =========================================================
   TIMER
========================================================= */

function initializeTimer() {

    const durationSelect =
        $("timerDuration");

    if (!durationSelect) {
        return;
    }


    const savedDuration =
        Number(
            localStorage.getItem(
                DASHBOARD_CONFIG.STORAGE.TIMER_DURATION
            )
        );


    if (
        savedDuration ===
            25 * 60 ||
        savedDuration ===
            45 * 60 ||
        savedDuration ===
            60 * 60
    ) {

        timerDuration =
            savedDuration;

    } else {

        timerDuration =
            DASHBOARD_CONFIG.DEFAULT_TIMER_SECONDS;

    }


    durationSelect.value =
        String(
            timerDuration
        );


    timerSeconds =
        Number(
            localStorage.getItem(
                DASHBOARD_CONFIG.STORAGE.TIMER_SECONDS
            )
        );


    if (
        !Number.isFinite(
            timerSeconds
        ) ||
        timerSeconds <= 0
    ) {

        timerSeconds =
            timerDuration;

    }


    timerRunning =
        localStorage.getItem(
            DASHBOARD_CONFIG.STORAGE.TIMER_RUNNING
        ) === "true";


    updateTimerDisplay();

}


/* =========================================================
   RESTORE TIMER
========================================================= */

function restoreTimer() {

    initializeTimer();

    if (timerRunning) {

        startTimer();

    }

}


/* =========================================================
   START TIMER
========================================================= */

function startTimer() {

    if (timerRunning) {
        return;
    }


    if (
        timerSeconds <= 0
    ) {

        timerSeconds =
            timerDuration;

    }


    timerRunning =
        true;


    localStorage.setItem(
        DASHBOARD_CONFIG.STORAGE.TIMER_RUNNING,
        "true"
    );


    timerInterval =
        setInterval(
            () => {

                timerSeconds--;

                updateTimerDisplay();

                localStorage.setItem(
                    DASHBOARD_CONFIG.STORAGE.TIMER_SECONDS,
                    String(
                        timerSeconds
                    )
                );


                if (
                    timerSeconds <= 0
                ) {

                    timerSeconds = 0;

                    updateTimerDisplay();

                    stopTimer();

                }

            },
            1000
        );


    updateTimerButtons();

}


/* =========================================================
   PAUSE TIMER
========================================================= */

function pauseTimer() {

    if (
        timerInterval
    ) {

        clearInterval(
            timerInterval
        );

        timerInterval =
            null;

    }


    timerRunning =
        false;


    localStorage.setItem(
        DASHBOARD_CONFIG.STORAGE.TIMER_RUNNING,
        "false"
    );

    localStorage.setItem(
        DASHBOARD_CONFIG.STORAGE.TIMER_SECONDS,
        String(
            timerSeconds
        )
    );


    updateTimerButtons();

}


/* =========================================================
   STOP TIMER
========================================================= */

function stopTimer() {

    if (
        timerInterval
    ) {

        clearInterval(
            timerInterval
        );

        timerInterval =
            null;

    }


    timerRunning =
        false;


    localStorage.setItem(
        DASHBOARD_CONFIG.STORAGE.TIMER_RUNNING,
        "false"
    );

    localStorage.setItem(
        DASHBOARD_CONFIG.STORAGE.TIMER_SECONDS,
        String(
            timerSeconds
        )
    );


    updateTimerButtons();

}


/* =========================================================
   RESET TIMER
========================================================= */

function resetTimer() {

    stopTimer();

    timerSeconds =
        timerDuration;


    localStorage.setItem(
        DASHBOARD_CONFIG.STORAGE.TIMER_SECONDS,
        String(
            timerSeconds
        )
    );


    updateTimerDisplay();

}


/* =========================================================
   TIMER DURATION CHANGE
========================================================= */

function changeTimerDuration() {

    const select =
        $("timerDuration");

    if (!select) {
        return;
    }


    const minutes =
        Number(
            select.value
        );


    if (
        ![25, 45, 60].includes(
            minutes
        )
    ) {

        return;

    }


    timerDuration =
        minutes * 60;


    timerSeconds =
        timerDuration;


    stopTimer();


    localStorage.setItem(
        DASHBOARD_CONFIG.STORAGE.TIMER_DURATION,
        String(
            timerDuration
        )
    );

    localStorage.setItem(
        DASHBOARD_CONFIG.STORAGE.TIMER_SECONDS,
        String(
            timerSeconds
        )
    );


    updateTimerDisplay();

}


/* =========================================================
   TIMER DISPLAY
========================================================= */

function updateTimerDisplay() {

    const timer =
        $("studyTimer");

    if (!timer) {
        return;
    }


    const minutes =
        Math.floor(
            timerSeconds / 60
        );


    const seconds =
        timerSeconds % 60;


    timer.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;


    updateTimerButtons();

}


/* =========================================================
   TIMER BUTTONS
========================================================= */

function updateTimerButtons() {

    const start =
        $("startTimerButton");

    const pause =
        $("pauseTimerButton");


    if (start) {

        start.disabled =
            timerRunning;

    }


    if (pause) {

        pause.disabled =
            !timerRunning;

    }

}


/* =========================================================
   STREAK
========================================================= */

function updateStreak() {

    const today =
        formatDateKey(
            new Date()
        );


    const lastStudyDate =
        localStorage.getItem(
            DASHBOARD_CONFIG.STORAGE.LAST_STUDY_DATE
        );


    let streak =
        Number(
            localStorage.getItem(
                DASHBOARD_CONFIG.STORAGE.STREAK
            )
        ) || 0;


    if (
        lastStudyDate ===
        today
    ) {

        return;

    }


    if (lastStudyDate) {

        const lastDate =
            parseDateKey(
                lastStudyDate
            );


        const currentDate =
            startOfDay(
                new Date()
            );


        const difference =
            Math.round(
                (
                    currentDate -
                    lastDate
                ) /
                86400000
            );


        if (
            difference === 1
        ) {

            streak++;

        } else {

            streak = 1;

        }

    } else {

        streak = 1;

    }


    localStorage.setItem(
        DASHBOARD_CONFIG.STORAGE.STREAK,
        String(streak)
    );


    localStorage.setItem(
        DASHBOARD_CONFIG.STORAGE.LAST_STUDY_DATE,
        today
    );

}


/* =========================================================
   THEME
========================================================= */

function initializeTheme() {

    const savedTheme =
        localStorage.getItem(
            DASHBOARD_CONFIG.STORAGE.THEME
        );


    if (
        savedTheme === "light"
    ) {

        document.body.classList.add(
            "light-mode"
        );

    } else {

        document.body.classList.remove(
            "light-mode"
        );

    }


    updateThemeButton();

}


/* =========================================================
   TOGGLE THEME
========================================================= */

function toggleTheme() {

    document.body.classList.toggle(
        "light-mode"
    );


    const isLight =
        document.body.classList.contains(
            "light-mode"
        );


    localStorage.setItem(
        DASHBOARD_CONFIG.STORAGE.THEME,
        isLight
            ? "light"
            : "dark"
    );


    updateThemeButton();

}


/* =========================================================
   THEME BUTTON
========================================================= */

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
            ? "🌙"
            : "☀️";


    button.setAttribute(
        "aria-label",
        isLight
            ? "Switch to dark mode"
            : "Switch to light mode"
    );

}


/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupEventListeners() {

    const themeButton =
        $("themeButton");

    if (themeButton) {

        themeButton.addEventListener(
            "click",
            toggleTheme
        );

    }


    const completionCheckbox =
        $("topicCompleteCheckbox");

    if (completionCheckbox) {

        completionCheckbox.addEventListener(
            "change",
            handleTopicCompletionChange
        );

    }


    const submitQuestions =
        $("submitTopicQuestions");

    if (submitQuestions) {

        submitQuestions.addEventListener(
            "click",
            submitKnowledgeCheck
        );

    }


    const startButton =
        $("startTimerButton");

    if (startButton) {

        startButton.addEventListener(
            "click",
            startTimer
        );

    }


    const pauseButton =
        $("pauseTimerButton");

    if (pauseButton) {

        pauseButton.addEventListener(
            "click",
            pauseTimer
        );

    }


    const resetButton =
        $("resetTimerButton");

    if (resetButton) {

        resetButton.addEventListener(
            "click",
            resetTimer
        );

    }


    const durationSelect =
        $("timerDuration");

    if (durationSelect) {

        durationSelect.addEventListener(
            "change",
            changeTimerDuration
        );

    }


    const previousMonth =
        $("previousMonth");

    if (previousMonth) {

        previousMonth.addEventListener(
            "click",
            () => {

                currentCalendarDate =
                    new Date(
                        currentCalendarDate.getFullYear(),
                        currentCalendarDate.getMonth() - 1,
                        1
                    );

                renderCalendar();

            }
        );

    }


    const nextMonth =
        $("nextMonth");

    if (nextMonth) {

        nextMonth.addEventListener(
            "click",
            () => {

                currentCalendarDate =
                    new Date(
                        currentCalendarDate.getFullYear(),
                        currentCalendarDate.getMonth() + 1,
                        1
                    );

                renderCalendar();

            }
        );

    }

}


/* =========================================================
   UTILITY — NORMALIZE ANSWER
========================================================= */

function normalizeAnswer(
    value
) {

    return String(
        value ?? ""
    )
        .trim()
        .toLowerCase();

}


/* =========================================================
   UTILITY — DATE KEY
========================================================= */

function formatDateKey(
    date
) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


/* =========================================================
   UTILITY — PARSE DATE KEY
========================================================= */

function parseDateKey(
    value
) {

    const parts =
        String(value)
            .split("-")
            .map(Number);


    if (
        parts.length !== 3
    ) {

        return new Date(value);

    }


    return new Date(
        parts[0],
        parts[1] - 1,
        parts[2]
    );

}


/* =========================================================
   UTILITY — START OF DAY
========================================================= */

function startOfDay(
    date
) {

    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );

}


/* =========================================================
   UTILITY — ESCAPE HTML
========================================================= */

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


/* =========================================================
   UTILITY — ESCAPE ATTRIBUTE
========================================================= */

function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );

}


/* =========================================================
   EXPOSE IMPORTANT FUNCTIONS
   Useful if other dashboard code calls them.
========================================================= */

window.completeCurrentTopic =
    completeCurrentTopic;

window.showKnowledgeCheck =
    showKnowledgeCheck;

window.submitKnowledgeCheck =
    submitKnowledgeCheck;

window.startTimer =
    startTimer;

window.pauseTimer =
    pauseTimer;

window.resetTimer =
    resetTimer;

window.toggleTheme =
    toggleTheme;

window.renderDashboard =
    renderDashboard;


/* =========================================================
   FINAL SAFETY INITIALIZATION
========================================================= */

if (
    document.readyState !==
    "loading"
) {

    /*
     * DOMContentLoaded may already have fired
     * if this script was loaded dynamically.
     */

    setTimeout(
        () => {

            if (
                !$("dashboardGreeting")
            ) {

                return;

            }

            renderDashboardGreeting();

        },
        0
    );

}
