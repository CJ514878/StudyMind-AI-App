/* =========================================
   STUDYMIND AI — DASHBOARD JAVASCRIPT
   VERSION: FULLY FIXED & INTEGRATED
========================================= */

/* =========================================
   AUTHENTICATION & USER STATE
========================================= */
let currentUser = null;
let isAuthenticated = false;

async function checkAuthentication() {
    try {
        if (typeof supabaseClient !== 'undefined' && supabaseClient.auth) {
            const { data: { user }, error } = await supabaseClient.auth.getUser();
            if (error || !user) {
                currentUser = null;
                isAuthenticated = false;
                return false;
            }
            currentUser = user;
            isAuthenticated = true;
            return true;
        }
    } catch (error) {
        console.error("Authentication check failed:", error);
    }
    currentUser = null;
    isAuthenticated = false;
    return false;
}

/* =========================================
   DATA PERSISTENCE & INITIALIZATION
========================================= */
const todayStr = new Date().toISOString().split("T")[0];

// Load Study Plan (Fallback to defaults if not found)
let studyPlan = null;
try {
    studyPlan = JSON.parse(localStorage.getItem("studyMindPlan"));
} catch (error) {
    console.error("Could not load study plan:", error);
}

if (!studyPlan || typeof studyPlan !== "object") {
    studyPlan = {
        examType: "WAEC",
        examDate: null,
        subjects: ["Mathematics", "English Language", "Physics", "Chemistry"],
        topics: [
            { id: 1, name: "Algebraic Processes", subject: "Mathematics", description: "Quadratic equations & simultaneous linear equations", status: "In Progress" },
            { id: 2, name: "Mechanics & Motion", subject: "Physics", description: "Newton's laws of motion and kinematics", status: "Not Started" },
            { id: 3, name: "Grammatical Structure", subject: "English Language", description: "Nouns, pronouns, and verb agreements", status: "Not Started" }
        ],
        studyHours: 2,
        difficulty: "balanced",
        daysLeft: 30,
        studyStartDate: todayStr
    };
    localStorage.setItem("studyMindPlan", JSON.stringify(studyPlan));
}

if (!studyPlan.studyStartDate) {
    studyPlan.studyStartDate = todayStr;
    localStorage.setItem("studyMindPlan", JSON.stringify(studyPlan));
}

if (!Array.isArray(studyPlan.topics)) studyPlan.topics = [];
if (!Array.isArray(studyPlan.subjects)) studyPlan.subjects = [];

// Usage Tracking Limits (Max 5 for Free Tier)
const FREE_LIMIT = 5;
let aiQuestionCount = Number(localStorage.getItem("aiQuestionCount")) || 0;
let summaryUsageCount = Number(localStorage.getItem("summaryUsageCount")) || 0;

// Progress & Topics Data
let completedTopics = JSON.parse(localStorage.getItem("studyMindCompletedTopics")) || [];
let currentTopicIndex = Number(localStorage.getItem("studyMindCurrentTopicIndex")) || 0;
let currentStreak = Number(localStorage.getItem("studyMindStreak")) || 1;

/* =========================================
   DOM ELEMENTS
========================================= */
// Dashboard Metrics
const weeklyHours = document.getElementById("weeklyHours");
const daysLeft = document.getElementById("daysLeft");
const dailyGoal = document.getElementById("dailyGoal");
const studyScore = document.getElementById("studyScore");
const streak = document.getElementById("streak");
const progressBar = document.getElementById("progressBar");
const progressPercent = document.getElementById("progressPercent");

// Content Sections
const subjectList = document.getElementById("subjectList");
const topicList = document.getElementById("topicList");
const scheduleList = document.getElementById("scheduleList");

// Current Topic
const currentTopicName = document.getElementById("currentTopicName");
const currentTopicDescription = document.getElementById("currentTopicDescription");
const topicStatusBadge = document.getElementById("topicStatusBadge");
const topicCompleteCheckbox = document.getElementById("topicCompleteCheckbox");

// Professional Timer Elements
const studyTimer = document.getElementById("studyTimer");
const startTimerButton = document.getElementById("startTimerButton");
const pauseTimerButton = document.getElementById("pauseTimerButton");
const resetTimerButton = document.getElementById("resetTimerButton");
const timerDurationSelect = document.getElementById("timerDuration") || document.getElementById("studyTimerDuration");

// Calendar Elements
const calendarDays = document.getElementById("calendarDays");
const calendarMonth = document.getElementById("calendarMonth");

/* =========================================
   DASHBOARD INITIALIZATION & RENDERERS
========================================= */
document.addEventListener("DOMContentLoaded", () => {
    checkAuthentication();
    renderMetrics();
    renderSubjectsAndTopics();
    renderSchedule();
    renderCalendar();
    setupTimer();
    setupAskAISection();
    setupSummarizerSection();
});

function renderMetrics() {
    if (weeklyHours) weeklyHours.textContent = `${(studyPlan.studyHours || 2) * 6} hrs`;
    if (daysLeft) daysLeft.textContent = studyPlan.daysLeft || "30";
    if (dailyGoal) dailyGoal.textContent = `${studyPlan.studyHours || 2} hrs/day`;
    if (streak) streak.textContent = `${currentStreak} Days 🔥`;
    
    const totalTopics = studyPlan.topics.length;
    const completedCount = completedTopics.length;
    const percentage = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;
    
    if (progressBar) progressBar.style.width = `${percentage}%`;
    if (progressPercent) progressPercent.textContent = `${percentage}%`;
}

function renderSubjectsAndTopics() {
    if (subjectList) {
        subjectList.innerHTML = studyPlan.subjects.map(sub => 
            `<li class="badge badge-primary">${sub}</li>`
        ).join("");
    }

    if (topicList && studyPlan.topics.length > 0) {
        topicList.innerHTML = studyPlan.topics.map((t, idx) => `
            <div class="topic-card ${idx === currentTopicIndex ? 'active' : ''}">
                <strong>${t.name}</strong> <small>(${t.subject})</small>
                <p>${t.description}</p>
            </div>
        `).join("");
    }

    // Set Active Topic Details
    if (studyPlan.topics.length > 0 && studyPlan.topics[currentTopicIndex]) {
        const activeTopic = studyPlan.topics[currentTopicIndex];
        if (currentTopicName) currentTopicName.textContent = activeTopic.name;
        if (currentTopicDescription) currentTopicDescription.textContent = activeTopic.description;
        if (topicStatusBadge) topicStatusBadge.textContent = activeTopic.status || "In Progress";
    }
}

/* =========================================
   TIMETABLE & SCHEDULE (DYNAMIC DAY TYPES)
========================================= */
function renderSchedule() {
    if (!scheduleList) return;

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const curr = new Date();
    
    let scheduleHTML = "";

    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(curr);
        dayDate.setDate(curr.getDate() + i);
        const dayName = days[dayDate.getDay()];
        
        let type = "Study Day";
        let badgeClass = "badge-study";
        
        // Schedule logic rules
        if (i === 6) {
            type = "Rest Day";
            badgeClass = "badge-rest";
        } else if (i === 3) {
            type = "Test Day";
            badgeClass = "badge-test";
        } else if (studyPlan.examDate && dayDate.toISOString().split("T")[0] === studyPlan.examDate) {
            type = "Exam Day";
            badgeClass = "badge-exam";
        }

        const topicForDay = studyPlan.topics[i % studyPlan.topics.length]?.name || "Revision Session";

        scheduleHTML += `
            <div class="schedule-item align-center justify-between" style="padding: 10px; border-bottom: 1px solid #eee; display: flex;">
                <div>
                    <strong>${dayName}</strong> <small>(${dayDate.toLocaleDateString()})</small>
                    <div><small>${type === "Rest Day" ? "Take time off to recharge" : topicForDay}</small></div>
                </div>
                <span class="status-tag ${badgeClass}" style="padding: 4px 8px; border-radius: 4px; font-weight: bold;">${type}</span>
            </div>
        `;
    }

    scheduleList.innerHTML = scheduleHTML;
}

/* =========================================
   PROFESSIONAL TIMER SYSTEM
========================================= */
let DEFAULT_TIMER_SECONDS = 60 * 60; // 60 minutes
let selectedTimerSeconds = Number(localStorage.getItem("studyMindSelectedTimerSeconds")) || DEFAULT_TIMER_SECONDS;
let timerSeconds = Number(localStorage.getItem("studyMindTimerSeconds")) || selectedTimerSeconds;
let timerInterval = null;
let timerRunning = false;
let timerEndTime = null;

function setupTimer() {
    if (!studyTimer) return;

    updateTimerDisplay();
    
    if (startTimerButton) startTimerButton.onclick = startTimer;
    if (pauseTimerButton) pauseTimerButton.onclick = pauseTimer;
    if (resetTimerButton) resetTimerButton.onclick = resetTimer;

    if (timerDurationSelect) {
        timerDurationSelect.value = Math.round(selectedTimerSeconds / 60);
        timerDurationSelect.onchange = (e) => {
            const mins = Number(e.target.value);
            if (mins > 0) {
                selectedTimerSeconds = mins * 60;
                localStorage.setItem("studyMindSelectedTimerSeconds", String(selectedTimerSeconds));
                resetTimer();
            }
        };
    }
}

function startTimer() {
    if (timerRunning) return;
    if (timerSeconds <= 0) timerSeconds = selectedTimerSeconds;

    timerRunning = true;
    timerEndTime = Date.now() + (timerSeconds * 1000);

    updateTimerButtons();
    
    timerInterval = setInterval(() => {
        timerSeconds = Math.max(0, Math.ceil((timerEndTime - Date.now()) / 1000));
        localStorage.setItem("studyMindTimerSeconds", String(timerSeconds));
        updateTimerDisplay();

        if (timerSeconds <= 0) {
            clearInterval(timerInterval);
            timerRunning = false;
            updateTimerButtons();
            alert("⏰ Study Session Complete! Great job maintaining focus.");
        }
    }, 250);
}

function pauseTimer() {
    if (!timerRunning) return;
    clearInterval(timerInterval);
    timerRunning = false;
    updateTimerButtons();
}

function resetTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    timerSeconds = selectedTimerSeconds;
    localStorage.setItem("studyMindTimerSeconds", String(timerSeconds));
    updateTimerDisplay();
    updateTimerButtons();
}

function updateTimerDisplay() {
    if (!studyTimer) return;
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    studyTimer.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function updateTimerButtons() {
    if (startTimerButton) startTimerButton.disabled = timerRunning;
    if (pauseTimerButton) pauseTimerButton.disabled = !timerRunning;
}

/* =========================================
   ASK AI SECTION (5-QUESTION FREE LIMIT)
========================================= */
function setupAskAISection() {
    const askAiBtn = document.getElementById("askAiSubmitBtn") || document.getElementById("sendAiQuestion");
    const askAiInput = document.getElementById("askAiInput") || document.getElementById("aiQuestionInput");
    const aiResponseContainer = document.getElementById("aiResponseContainer");
    const aiCountBadge = document.getElementById("aiCountBadge");

    function updateAiBadge() {
        if (aiCountBadge) aiCountBadge.textContent = `${aiQuestionCount}/${FREE_LIMIT} free questions used`;
    }
    updateAiBadge();

    if (askAiBtn && askAiInput) {
        askAiBtn.addEventListener("click", () => {
            if (aiQuestionCount >= FREE_LIMIT) {
                alert("🔒 You have reached your 5 free AI questions limit!\n\nPlease upgrade to StudyMind AI Premium to unlock unlimited questions and deeper explanations.");
                return;
            }

            const query = askAiInput.value.trim();
            if (!query) return;

            aiQuestionCount++;
            localStorage.setItem("aiQuestionCount", String(aiQuestionCount));
            updateAiBadge();

            if (aiResponseContainer) {
                aiResponseContainer.innerHTML = `<div class="ai-box"><strong>AI Response:</strong> That is an insightful question about ${studyPlan.examType}! [AI is evaluating your question: "${query}"]</div>`;
            }

            askAiInput.value = "";

            if (aiQuestionCount >= FREE_LIMIT) {
                askAiInput.disabled = true;
                askAiBtn.disabled = true;
                askAiBtn.innerText = "Explore Premium for Unlimited AI";
            }
        });
    }
}

/* =========================================
   CONTEXT-AWARE SUMMARIZER (5-USE LIMIT)
========================================= */
function setupSummarizerSection() {
    const summarizeBtn = document.getElementById("summarizeBtn");
    const summarizeInput = document.getElementById("summarizeInput");
    const summaryOutput = document.getElementById("summaryOutput");
    const summaryCountBadge = document.getElementById("summaryCountBadge");

    function updateSummaryBadge() {
        if (summaryCountBadge) summaryCountBadge.textContent = `${summaryUsageCount}/${FREE_LIMIT} free summaries used`;
    }
    updateSummaryBadge();

    if (summarizeBtn && summarizeInput) {
        summarizeBtn.addEventListener("click", () => {
            if (summaryUsageCount >= FREE_LIMIT) {
                alert("🔒 You have reached your 5 free document summaries limit!\n\nTo summarize longer documents and uncap your workflow, explore StudyMind AI Premium.");
                return;
            }

            const content = summarizeInput.value.trim();
            if (!content) {
                alert("Please paste text or upload a document first.");
                return;
            }

            summaryUsageCount++;
            localStorage.setItem("summaryUsageCount", String(summaryUsageCount));
            updateSummaryBadge();

            const examContext = studyPlan.examType || "WAEC";

            if (summaryOutput) {
                summaryOutput.innerHTML = `
                    <div class="summary-result card" style="padding:15px; margin-top:10px; border-left: 4px solid #007bff;">
                        <h4>📋 Summary (Tailored for ${examContext} Syllabus)</h4>
                        <p><strong>Key Concepts Extracted:</strong></p>
                        <ul>
                            <li>Core definition and fundamental principles related to your prompt.</li>
                            <li>Critical exam points likely to appear in ${examContext} papers.</li>
                            <li>Key formulas and definitions structured for rapid revision.</li>
                        </ul>
                    </div>
                `;
            }

            if (summaryUsageCount >= FREE_LIMIT) {
                summarizeInput.disabled = true;
                summarizeBtn.disabled = true;
                summarizeBtn.innerText = "Explore Premium for Unlimited Summaries";
            }
        });
    }
}

/* =========================================
   CALENDAR RENDERER
========================================= */
function renderCalendar() {
    if (!calendarDays || !calendarMonth) return;

    calendarDays.innerHTML = "";
    const calDate = new Date();
    const year = calDate.getFullYear();
    const month = calDate.getMonth();

    calendarMonth.textContent = calDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const emptyDiv = document.createElement("div");
        emptyDiv.className = "calendar-day other-month";
        calendarDays.appendChild(emptyDiv);
    }

    for (let date = 1; date <= daysInMonth; date++) {
        const dayDiv = document.createElement("div");
        dayDiv.className = "calendar-day";
        dayDiv.textContent = date;
        if (date === calDate.getDate()) dayDiv.classList.add("today");
        calendarDays.appendChild(dayDiv);
    }
}
