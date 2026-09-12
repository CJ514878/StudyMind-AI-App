/* =========================================================
   STUDYMIND AI — REWARDS ENGINE
   100 ACHIEVEMENTS
========================================================= */

"use strict";


/* =========================================================
   STORAGE
========================================================= */

const REWARD_KEYS = {

    UNLOCKED:
        "studyMindRewardsUnlocked",

    NOTIFICATIONS:
        "studyMindRewardNotifications",

    XP:
        "studyMindRewardXP",

    USERNAME:
        "studyMindUsername",

    COMPLETED:
        "studyMindCompletedTopics",

    QUESTION_DONE:
        "studyMindCompletedQuestionTopics",

    STREAK_ACTIVITY:
        "studyMindStreakActivity",

    SUMMARY:
        "studyMindSummaryCount",

    AI_COUNT:
        "aiQuestionCount",

    GAME_POINTS:
        "studyMindBattlePoints",

    GAME_USED:
        "studyMindGameBattlesUsed",

    TIMER_SESSIONS:
        "studyMindCompletedTimerSessions",

    PLAN:
        "studyMindPlan"

};


/* =========================================================
   STATE
========================================================= */

let activeFilter = "all";


/* =========================================================
   STORAGE HELPERS
========================================================= */

function readJSON(key, fallback) {

    try {

        const value =
            localStorage.getItem(key);

        if (!value) {
            return fallback;
        }

        return JSON.parse(value);

    } catch {

        return fallback;

    }

}


function writeJSON(key, value) {

    localStorage.setItem(
        key,
        JSON.stringify(value)
    );

}


/* =========================================================
   REWARD DEFINITIONS
========================================================= */

const REWARDS = [

    /* -----------------------------------------------------
       BEGINNER
    ----------------------------------------------------- */

    {
        id: 1,
        name: "First Step",
        icon: "🌱",
        category: "milestone",
        description: "Complete your first study topic.",
        xp: 10,
        condition: s => s.topics >= 1
    },

    {
        id: 2,
        name: "Getting Started",
        icon: "🚀",
        category: "milestone",
        description: "Complete 3 study topics.",
        xp: 15,
        condition: s => s.topics >= 3
    },

    {
        id: 3,
        name: "Topic Tamer",
        icon: "⚔️",
        category: "milestone",
        description: "Complete 5 study topics.",
        xp: 20,
        condition: s => s.topics >= 5
    },

    {
        id: 4,
        name: "Study Builder",
        icon: "🧱",
        category: "milestone",
        description: "Complete 10 study topics.",
        xp: 30,
        condition: s => s.topics >= 10
    },

    {
        id: 5,
        name: "Knowledge Collector",
        icon: "📚",
        category: "milestone",
        description: "Complete 20 study topics.",
        xp: 40,
        condition: s => s.topics >= 20
    },

    {
        id: 6,
        name: "Topic Master",
        icon: "👑",
        category: "milestone",
        description: "Complete 50 study topics.",
        xp: 75,
        condition: s => s.topics >= 50
    },

    {
        id: 7,
        name: "Academic Machine",
        icon: "🤖",
        category: "milestone",
        description: "Complete 100 study topics.",
        xp: 150,
        condition: s => s.topics >= 100
    },

    {
        id: 8,
        name: "Study Legend",
        icon: "🏆",
        category: "milestone",
        description: "Complete 250 study topics.",
        xp: 300,
        condition: s => s.topics >= 250
    },

    {
        id: 9,
        name: "Knowledge Giant",
        icon: "🌟",
        category: "milestone",
        description: "Complete 500 study topics.",
        xp: 500,
        condition: s => s.topics >= 500
    },

    {
        id: 10,
        name: "The Scholar",
        icon: "🎓",
        category: "milestone",
        description: "Complete 1,000 study topics.",
        xp: 1000,
        condition: s => s.topics >= 1000
    },


    /* -----------------------------------------------------
       STREAK
    ----------------------------------------------------- */

    {
        id: 11,
        name: "Daily Spark",
        icon: "🔥",
        category: "streak",
        description: "Build a 1-day study streak.",
        xp: 10,
        condition: s => s.streak >= 1
    },

    {
        id: 12,
        name: "Three-Day Flame",
        icon: "🔥",
        category: "streak",
        description: "Build a 3-day study streak.",
        xp: 25,
        condition: s => s.streak >= 3
    },

    {
        id: 13,
        name: "Week Warrior",
        icon: "🗓️",
        category: "streak",
        description: "Build a 7-day study streak.",
        xp: 50,
        condition: s => s.streak >= 7
    },

    {
        id: 14,
        name: "Fortnight Focus",
        icon: "🔥",
        category: "streak",
        description: "Build a 14-day study streak.",
        xp: 100,
        condition: s => s.streak >= 14
    },

    {
        id: 15,
        name: "Consistency King",
        icon: "👑",
        category: "streak",
        description: "Build a 30-day study streak.",
        xp: 250,
        condition: s => s.streak >= 30
    },

    {
        id: 16,
        name: "Unbreakable",
        icon: "💎",
        category: "streak",
        description: "Build a 60-day study streak.",
        xp: 500,
        condition: s => s.streak >= 60
    },

    {
        id: 17,
        name: "Study Titan",
        icon: "⚡",
        category: "streak",
        description: "Build a 100-day study streak.",
        xp: 1000,
        condition: s => s.streak >= 100
    },


    /* -----------------------------------------------------
       KNOWLEDGE CHECK
    ----------------------------------------------------- */

    {
        id: 18,
        name: "Knowledge Seeker",
        icon: "🧠",
        category: "knowledge",
        description: "Complete your first Knowledge Check.",
        xp: 20,
        condition: s => s.checks >= 1
    },

    {
        id: 19,
        name: "Quiz Rookie",
        icon: "❓",
        category: "knowledge",
        description: "Complete 3 Knowledge Checks.",
        xp: 25,
        condition: s => s.checks >= 3
    },

    {
        id: 20,
        name: "Quiz Warrior",
        icon: "⚔️",
        category: "knowledge",
        description: "Complete 10 Knowledge Checks.",
        xp: 50,
        condition: s => s.checks >= 10
    },

    {
        id: 21,
        name: "Brain Trainer",
        icon: "🧠",
        category: "knowledge",
        description: "Complete 25 Knowledge Checks.",
        xp: 100,
        condition: s => s.checks >= 25
    },

    {
        id: 22,
        name: "Question Hunter",
        icon: "🎯",
        category: "knowledge",
        description: "Complete 50 Knowledge Checks.",
        xp: 200,
        condition: s => s.checks >= 50
    },

    {
        id: 23,
        name: "Exam Crusher",
        icon: "💥",
        category: "knowledge",
        description: "Complete 100 Knowledge Checks.",
        xp: 400,
        condition: s => s.checks >= 100
    },


    /* -----------------------------------------------------
       SUMMARIZER
    ----------------------------------------------------- */

    {
        id: 24,
        name: "Summary Starter",
        icon: "📝",
        category: "ai",
        description: "Create your first AI summary.",
        xp: 15,
        condition: s => s.summaries >= 1
    },

    {
        id: 25,
        name: "Summarizer Warrior",
        icon: "📖",
        category: "ai",
        description: "Create 5 AI summaries.",
        xp: 35,
        condition: s => s.summaries >= 5
    },

    {
        id: 26,
        name: "Summary Specialist",
        icon: "📚",
        category: "ai",
        description: "Create 15 AI summaries.",
        xp: 75,
        condition: s => s.summaries >= 15
    },

    {
        id: 27,
        name: "Information Miner",
        icon: "⛏️",
        category: "ai",
        description: "Create 30 AI summaries.",
        xp: 125,
        condition: s => s.summaries >= 30
    },

    {
        id: 28,
        name: "Summary Master",
        icon: "🧾",
        category: "ai",
        description: "Create 50 AI summaries.",
        xp: 250,
        condition: s => s.summaries >= 50
    },


    /* -----------------------------------------------------
       AI
    ----------------------------------------------------- */

    {
        id: 29,
        name: "AI Curious",
        icon: "✨",
        category: "ai",
        description: "Ask StudyMind AI your first question.",
        xp: 10,
        condition: s => s.ai >= 1
    },

    {
        id: 30,
        name: "AI Explorer",
        icon: "🤖",
        category: "ai",
        description: "Ask StudyMind AI 5 questions.",
        xp: 25,
        condition: s => s.ai >= 5
    },

    {
        id: 31,
        name: "AI Apprentice",
        icon: "🧑‍💻",
        category: "ai",
        description: "Ask StudyMind AI 15 questions.",
        xp: 50,
        condition: s => s.ai >= 15
    },

    {
        id: 32,
        name: "AI Strategist",
        icon: "♟️",
        category: "ai",
        description: "Ask StudyMind AI 30 questions.",
        xp: 100,
        condition: s => s.ai >= 30
    },

    {
        id: 33,
        name: "AI Scholar",
        icon: "🤖",
        category: "ai",
        description: "Ask StudyMind AI 50 questions.",
        xp: 200,
        condition: s => s.ai >= 50
    },

    {
        id: 34,
        name: "AI Mastermind",
        icon: "🧠",
        category: "ai",
        description: "Ask StudyMind AI 100 questions.",
        xp: 400,
        condition: s => s.ai >= 100
    },


    /* -----------------------------------------------------
       GAME
    ----------------------------------------------------- */

    {
        id: 35,
        name: "Battle Ready",
        icon: "⚔️",
        category: "game",
        description: "Play your first Computer Battle.",
        xp: 15,
        condition: s => s.battles >= 1
    },

    {
        id: 36,
        name: "Battle Student",
        icon: "🛡️",
        category: "game",
        description: "Play 5 Computer Battles.",
        xp: 30,
        condition: s => s.battles >= 5
    },

    {
        id: 37,
        name: "Battle Veteran",
        icon: "⚔️",
        category: "game",
        description: "Play 10 Computer Battles.",
        xp: 60,
        condition: s => s.battles >= 10
    },

    {
        id: 38,
        name: "Battle Champion",
        icon: "🏆",
        category: "game",
        description: "Earn 500 Battle Points.",
        xp: 100,
        condition: s => s.gamePoints >= 500
    },

    {
        id: 39,
        name: "Battle Legend",
        icon: "👑",
        category: "game",
        description: "Earn 1,000 Battle Points.",
        xp: 250,
        condition: s => s.gamePoints >= 1000
    },


    /* -----------------------------------------------------
       TIMER
    ----------------------------------------------------- */

    {
        id: 40,
        name: "First Focus",
        icon: "⏱️",
        category: "focus",
        description: "Complete your first study timer session.",
        xp: 15,
        condition: s => s.timerSessions >= 1
    },

    {
        id: 41,
        name: "Focus Rookie",
        icon: "⏱️",
        category: "focus",
        description: "Complete 5 timer sessions.",
        xp: 30,
        condition: s => s.timerSessions >= 5
    },

    {
        id: 42,
        name: "Deep Focus",
        icon: "🎯",
        category: "focus",
        description: "Complete 10 timer sessions.",
        xp: 60,
        condition: s => s.timerSessions >= 10
    },

    {
        id: 43,
        name: "Focus Warrior",
        icon: "🔥",
        category: "focus",
        description: "Complete 25 timer sessions.",
        xp: 125,
        condition: s => s.timerSessions >= 25
    },

    {
        id: 44,
        name: "Focus Master",
        icon: "🧘",
        category: "focus",
        description: "Complete 50 timer sessions.",
        xp: 250,
        condition: s => s.timerSessions >= 50
    },


    /* -----------------------------------------------------
       MORE TOPIC MILESTONES
    ----------------------------------------------------- */

    {
        id: 45,
        name: "Ten Down",
        icon: "🔟",
        category: "milestone",
        description: "Finish 15 topics.",
        xp: 35,
        condition: s => s.topics >= 15
    },

    {
        id: 46,
        name: "Twenty Five",
        icon: "⭐",
        category: "milestone",
        description: "Finish 25 topics.",
        xp: 60,
        condition: s => s.topics >= 25
    },

    {
        id: 47,
        name: "Fifty Strong",
        icon: "💪",
        category: "milestone",
        description: "Finish 75 topics.",
        xp: 100,
        condition: s => s.topics >= 75
    },

    {
        id: 48,
        name: "Century Scholar",
        icon: "💯",
        category: "milestone",
        description: "Finish 100 topics.",
        xp: 150,
        condition: s => s.topics >= 100
    },


    /* -----------------------------------------------------
       STUDY DAYS
    ----------------------------------------------------- */

    {
        id: 49,
        name: "First Study Day",
        icon: "📅",
        category: "consistency",
        description: "Study on your first recorded day.",
        xp: 10,
        condition: s => s.studyDays >= 1
    },

    {
        id: 50,
        name: "Five Day Scholar",
        icon: "📅",
        category: "consistency",
        description: "Study on 5 different days.",
        xp: 30,
        condition: s => s.studyDays >= 5
    },

    {
        id: 51,
        name: "Ten Day Scholar",
        icon: "📅",
        category: "consistency",
        description: "Study on 10 different days.",
        xp: 50,
        condition: s => s.studyDays >= 10
    },

    {
        id: 52,
        name: "Twenty Day Scholar",
        icon: "📅",
        category: "consistency",
        description: "Study on 20 different days.",
        xp: 100,
        condition: s => s.studyDays >= 20
    },

    {
        id: 53,
        name: "Fifty Day Scholar",
        icon: "🌟",
        category: "consistency",
        description: "Study on 50 different days.",
        xp: 250,
        condition: s => s.studyDays >= 50
    },

    {
        id: 54,
        name: "Century Student",
        icon: "🎓",
        category: "consistency",
        description: "Study on 100 different days.",
        xp: 500,
        condition: s => s.studyDays >= 100
    },


    /* -----------------------------------------------------
       SPECIAL
    ----------------------------------------------------- */

    {
        id: 55,
        name: "Comeback Kid",
        icon: "🔄",
        category: "special",
        description: "Return to studying after a break.",
        xp: 25,
        condition: s => s.comeback
    },

    {
        id: 56,
        name: "Multi-Subject Mind",
        icon: "🧠",
        category: "special",
        description: "Study topics from 3 different subjects.",
        xp: 40,
        condition: s => s.subjects >= 3
    },

    {
        id: 57,
        name: "Polymath",
        icon: "🌎",
        category: "special",
        description: "Study topics from 5 different subjects.",
        xp: 80,
        condition: s => s.subjects >= 5
    },

    {
        id: 58,
        name: "Curiosity Engine",
        icon: "💡",
        category: "special",
        description: "Complete 10 topics and 5 Knowledge Checks.",
        xp: 60,
        condition: s => s.topics >= 10 && s.checks >= 5
    },

    {
        id: 59,
        name: "Balanced Scholar",
        icon: "⚖️",
        category: "special",
        description: "Use AI, Knowledge Checks and study sessions.",
        xp: 75,
        condition: s => s.ai >= 1 && s.checks >= 1 && s.topics >= 5
    },

    {
        id: 60,
        name: "Complete Learner",
        icon: "🎓",
        category: "special",
        description: "Use five different StudyMind tools.",
        xp: 100,
        condition: s =>
            [
                s.topics > 0,
                s.checks > 0,
                s.ai > 0,
                s.summaries > 0,
                s.timerSessions > 0
            ].filter(Boolean).length >= 5
    },


    /* -----------------------------------------------------
       XP / PROGRESSION
    ----------------------------------------------------- */

    {
        id: 61,
        name: "XP Beginner",
        icon: "⭐",
        category: "xp",
        description: "Earn 50 reward XP.",
        xp: 15,
        condition: s => s.xp >= 50
    },

    {
        id: 62,
        name: "XP Hunter",
        icon: "⭐",
        category: "xp",
        description: "Earn 100 reward XP.",
        xp: 25,
        condition: s => s.xp >= 100
    },

    {
        id: 63,
        name: "XP Collector",
        icon: "💫",
        category: "xp",
        description: "Earn 250 reward XP.",
        xp: 50,
        condition: s => s.xp >= 250
    },

    {
        id: 64,
        name: "XP Elite",
        icon: "💎",
        category: "xp",
        description: "Earn 500 reward XP.",
        xp: 100,
        condition: s => s.xp >= 500
    },

    {
        id: 65,
        name: "XP Legend",
        icon: "👑",
        category: "xp",
        description: "Earn 1,000 reward XP.",
        xp: 250,
        condition: s => s.xp >= 1000
    },


    /* -----------------------------------------------------
       66–100: ADVANCED ACHIEVEMENTS
    ----------------------------------------------------- */

    {
        id: 66,
        name: "Early Momentum",
        icon: "🌅",
        category: "special",
        description: "Complete 3 topics in your first study day.",
        xp: 30,
        condition: s => s.topicsToday >= 3
    },

    {
        id: 67,
        name: "Focused Five",
        icon: "🎯",
        category: "focus",
        description: "Complete 5 topics in one study day.",
        xp: 60,
        condition: s => s.topicsToday >= 5
    },

    {
        id: 68,
        name: "Study Marathon",
        icon: "🏃",
        category: "focus",
        description: "Complete 10 topics in one study day.",
        xp: 120,
        condition: s => s.topicsToday >= 10
    },

    {
        id: 69,
        name: "Knowledge Burst",
        icon: "⚡",
        category: "knowledge",
        description: "Complete 3 Knowledge Checks in one day.",
        xp: 40,
        condition: s => s.checksToday >= 3
    },

    {
        id: 70,
        name: "Quiz Marathon",
        icon: "🧠",
        category: "knowledge",
        description: "Complete 5 Knowledge Checks in one day.",
        xp: 75,
        condition: s => s.checksToday >= 5
    },

    {
        id: 71,
        name: "AI Companion",
        icon: "🤖",
        category: "ai",
        description: "Use AI on 3 different study days.",
        xp: 50,
        condition: s => s.ai >= 10
    },

    {
        id: 72,
        name: "Digital Scholar",
        icon: "💻",
        category: "ai",
        description: "Use StudyMind AI 25 times.",
        xp: 75,
        condition: s => s.ai >= 25
    },

    {
        id: 73,
        name: "Research Mind",
        icon: "🔎",
        category: "ai",
        description: "Use AI and the Summarizer.",
        xp: 50,
        condition: s => s.ai > 0 && s.summaries > 0
    },

    {
        id: 74,
        name: "Revision Specialist",
        icon: "🔁",
        category: "knowledge",
        description: "Complete 10 topics and 10 Knowledge Checks.",
        xp: 100,
        condition: s => s.topics >= 10 && s.checks >= 10
    },

    {
        id: 75,
        name: "Exam Mode",
        icon: "📝",
        category: "knowledge",
        description: "Complete 20 Knowledge Checks.",
        xp: 100,
        condition: s => s.checks >= 20
    },

    {
        id: 76,
        name: "Subject Explorer",
        icon: "🧭",
        category: "special",
        description: "Study 2 different subjects.",
        xp: 20,
        condition: s => s.subjects >= 2
    },

    {
        id: 77,
        name: "Subject Master",
        icon: "📚",
        category: "special",
        description: "Study 7 different subjects.",
        xp: 120,
        condition: s => s.subjects >= 7
    },

    {
        id: 78,
        name: "Study Architect",
        icon: "🏗️",
        category: "special",
        description: "Complete 25 topics while maintaining a 3-day streak.",
        xp: 100,
        condition: s => s.topics >= 25 && s.streak >= 3
    },

    {
        id: 79,
        name: "Momentum Master",
        icon: "🚀",
        category: "special",
        description: "Complete 50 topics while maintaining a 7-day streak.",
        xp: 175,
        condition: s => s.topics >= 50 && s.streak >= 7
    },

    {
        id: 80,
        name: "Academic Athlete",
        icon: "🏅",
        category: "special",
        description: "Complete 100 topics and 25 Knowledge Checks.",
        xp: 250,
        condition: s => s.topics >= 100 && s.checks >= 25
    },

    {
        id: 81,
        name: "Battle Scholar",
        icon: "⚔️",
        category: "game",
        description: "Complete 10 topics and play 5 battles.",
        xp: 60,
        condition: s => s.topics >= 10 && s.battles >= 5
    },

    {
        id: 82,
        name: "Competitive Mind",
        icon: "🏆",
        category: "game",
        description: "Earn 250 Battle Points.",
        xp: 60,
        condition: s => s.gamePoints >= 250
    },

    {
        id: 83,
        name: "Arena Scholar",
        icon: "🏟️",
        category: "game",
        description: "Play 25 Computer Battles.",
        xp: 150,
        condition: s => s.battles >= 25
    },

    {
        id: 84,
        name: "Focus Apprentice",
        icon: "⏳",
        category: "focus",
        description: "Complete 3 timer sessions.",
        xp: 20,
        condition: s => s.timerSessions >= 3
    },

    {
        id: 85,
        name: "Focus Elite",
        icon: "🎯",
        category: "focus",
        description: "Complete 100 timer sessions.",
        xp: 500,
        condition: s => s.timerSessions >= 100
    },

    {
        id: 86,
        name: "Routine Builder",
        icon: "📆",
        category: "consistency",
        description: "Study on 15 different days.",
        xp: 75,
        condition: s => s.studyDays >= 15
    },

    {
        id: 87,
        name: "Habit Former",
        icon: "🔄",
        category: "consistency",
        description: "Study on 30 different days.",
        xp: 150,
        condition: s => s.studyDays >= 30
    },

    {
        id: 88,
        name: "Consistency Machine",
        icon: "⚙️",
        category: "consistency",
        description: "Study on 75 different days.",
        xp: 300,
        condition: s => s.studyDays >= 75
    },

    {
        id: 89,
        name: "Streak Architect",
        icon: "🔥",
        category: "streak",
        description: "Reach a 10-day streak.",
        xp: 75,
        condition: s => s.streak >= 10
    },

    {
        id: 90,
        name: "Flame Keeper",
        icon: "🔥",
        category: "streak",
        description: "Reach a 21-day streak.",
        xp: 125,
        condition: s => s.streak >= 21
    },

    {
        id: 91,
        name: "Monthly Master",
        icon: "🗓️",
        category: "streak",
        description: "Reach a 31-day streak.",
        xp: 300,
        condition: s => s.streak >= 31
    },

    {
        id: 92,
        name: "Knowledge Architect",
        icon: "🏛️",
        category: "knowledge",
        description: "Complete 75 Knowledge Checks.",
        xp: 300,
        condition: s => s.checks >= 75
    },

    {
        id: 93,
        name: "AI Power User",
        icon: "⚡",
        category: "ai",
        description: "Ask AI 75 questions.",
        xp: 300,
        condition: s => s.ai >= 75
    },

    {
        id: 94,
        name: "Summarizer Legend",
        icon: "📚",
        category: "ai",
        description: "Create 100 AI summaries.",
        xp: 500,
        condition: s => s.summaries >= 100
    },

    {
        id: 95,
        name: "The Strategist",
        icon: "♟️",
        category: "special",
        description: "Complete 50 topics, 20 checks and 10 AI questions.",
        xp: 250,
        condition: s =>
            s.topics >= 50 &&
            s.checks >= 20 &&
            s.ai >= 10
    },

    {
        id: 96,
        name: "The Specialist",
        icon: "🎓",
        category: "special",
        description: "Study 10 different subjects.",
        xp: 250,
        condition: s => s.subjects >= 10
    },

    {
        id: 97,
        name: "StudyMind Elite",
        icon: "💎",
        category: "special",
        description: "Unlock 25 other rewards.",
        xp: 300,
        condition: s => s.unlocked >= 25
    },

    {
        id: 98,
        name: "StudyMind Master",
        icon: "👑",
        category: "special",
        description: "Unlock 50 other rewards.",
        xp: 500,
        condition: s => s.unlocked >= 50
    },

    {
        id: 99,
        name: "StudyMind Legend",
        icon: "🌟",
        category: "special",
        description: "Unlock 75 other rewards.",
        xp: 750,
        condition: s => s.unlocked >= 75
    },

    {
        id: 100,
        name: "Ultimate Scholar",
        icon: "🏆",
        category: "special",
        description: "Unlock every StudyMind achievement.",
        xp: 2000,
        condition: s => s.unlocked >= 99
    }

];


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeRewards
);


function initializeRewards() {

    applyTheme();

    loadUser();

    checkRewards();

    renderStats();

    renderRewards();

    renderNotifications();

    setupFilters();

    setupPopup();

    setupTheme();

    setupLogout();

    window.addEventListener(
        "storage",
        () => {

            checkRewards();
            renderStats();
            renderRewards();
            renderNotifications();

        }
    );

}


/* =========================================================
   GET STATS
========================================================= */

function getStats() {

    const completed =
        readJSON(
            REWARD_KEYS.COMPLETED,
            []
        );

    const checks =
        readJSON(
            REWARD_KEYS.QUESTION_DONE,
            []
        );

    const activity =
        readJSON(
            REWARD_KEYS.STREAK_ACTIVITY,
            {}
        );

    const summaries =
        Number(
            localStorage.getItem(
                REWARD_KEYS.SUMMARY
            )
        ) || 0;

    const ai =
        Number(
            localStorage.getItem(
                REWARD_KEYS.AI_COUNT
            )
        ) || 0;

    const gamePoints =
        Number(
            localStorage.getItem(
                REWARD_KEYS.GAME_POINTS
            )
        ) || 0;

    const battles =
        Number(
            localStorage.getItem(
                REWARD_KEYS.GAME_USED
            )
        ) || 0;

    const timerSessions =
        Number(
            localStorage.getItem(
                REWARD_KEYS.TIMER_SESSIONS
            )
        ) || 0;


    const activityDays =
        Object.keys(activity || {})
            .filter(
                key =>
                    activity[key] === true
            )
            .sort();


    const streak =
        calculateCurrentStreak(
            activityDays
        );


    const subjects =
        getCompletedSubjects(
            completed
        );


    const topicsToday =
        getTodayCompletedTopics(
            completed
        );


    const checksToday =
        getTodayChecks(
            checks
        );


    const unlocked =
        readJSON(
            REWARD_KEYS.UNLOCKED,
            []
        );


    const xp =
        Number(
            localStorage.getItem(
                REWARD_KEYS.XP
            )
        ) || 0;


    return {

        topics:
            completed.length,

        checks:
            checks.length,

        summaries,

        ai,

        battles,

        gamePoints,

        timerSessions,

        studyDays:
            activityDays.length,

        streak,

        subjects:
            subjects.length,

        topicsToday,

        checksToday,

        comeback:
            activityDays.length >= 2,

        unlocked:
            Array.isArray(unlocked)
                ? unlocked.length
                : 0,

        xp

    };

}


/* =========================================================
   CHECK REWARDS
========================================================= */

function checkRewards() {

    let unlocked =
        readJSON(
            REWARD_KEYS.UNLOCKED,
            []
        );

    if (!Array.isArray(unlocked)) {
        unlocked = [];
    }


    let stats =
        getStats();


    let newlyUnlocked = [];


    /*
     * Run twice because some achievements
     * depend on number of unlocked rewards.
     */

    for (let pass = 0; pass < 2; pass++) {

        stats.unlocked =
            unlocked.length;

        REWARDS.forEach(
            reward => {

                if (
                    unlocked.includes(
                        reward.id
                    )
                ) {
                    return;
                }


                let qualifies = false;

                try {

                    qualifies =
                        Boolean(
                            reward.condition(
                                stats
                            )
                        );

                } catch (error) {

                    console.warn(
                        "Reward condition error:",
                        reward.name,
                        error
                    );

                }


                if (qualifies) {

                    unlocked.push(
                        reward.id
                    );

                    newlyUnlocked.push(
                        reward
                    );

                    stats.unlocked =
                        unlocked.length;

                }

            }
        );

    }


    if (newlyUnlocked.length) {

        writeJSON(
            REWARD_KEYS.UNLOCKED,
            unlocked
        );


        let xp =
            Number(
                localStorage.getItem(
                    REWARD_KEYS.XP
                )
            ) || 0;


        let notifications =
            readJSON(
                REWARD_KEYS.NOTIFICATIONS,
                []
            );


        if (!Array.isArray(notifications)) {
            notifications = [];
        }


        newlyUnlocked.forEach(
            reward => {

                xp += reward.xp;


                notifications.unshift({

                    id:
                        `${reward.id}-${Date.now()}`,

                    rewardId:
                        reward.id,

                    title:
                        reward.name,

                    description:
                        reward.description,

                    icon:
                        reward.icon,

                    xp:
                        reward.xp,

                    timestamp:
                        Date.now()

                });

            }
        );


        notifications =
            notifications.slice(
                0,
                50
            );


        localStorage.setItem(
            REWARD_KEYS.XP,
            String(xp)
        );


        writeJSON(
            REWARD_KEYS.NOTIFICATIONS,
            notifications
        );


        /*
         * Show the newest achievement.
         */

        showRewardPopup(
            newlyUnlocked[
                newlyUnlocked.length - 1
            ]
        );

    }

}


/* =========================================================
   CURRENT STREAK
========================================================= */

function calculateCurrentStreak(days) {

    if (!days.length) {
        return 0;
    }


    const set =
        new Set(days);


    let current =
        new Date();


    const today =
        formatDate(current);


    if (!set.has(today)) {

        current.setDate(
            current.getDate() - 1
        );

    }


    let streak = 0;


    while (
        set.has(
            formatDate(current)
        )
    ) {

        streak++;

        current.setDate(
            current.getDate() - 1
        );

    }


    return streak;

}


/* =========================================================
   DATE
========================================================= */

function formatDate(date) {

    return [
        date.getFullYear(),
        String(
            date.getMonth() + 1
        ).padStart(2, "0"),
        String(
            date.getDate()
        ).padStart(2, "0")
    ].join("-");

}


/* =========================================================
   SUBJECTS
========================================================= */

function getCompletedSubjects(
    completed
) {

    const plan =
        readJSON(
            REWARD_KEYS.PLAN,
            null
        );


    const subjects =
        new Set();


    if (
        !Array.isArray(
            plan?.subjects
        )
    ) {

        return subjects;

    }


    plan.subjects.forEach(
        subject => {

            const subjectName =
                String(
                    subject?.name ||
                    subject?.subject ||
                    subject?.title ||
                    ""
                ).trim();


            if (!subjectName) {
                return;
            }


            const topics =
                Array.isArray(
                    subject?.topics
                )
                    ? subject.topics
                    : [];


            topics.forEach(
                topic => {

                    const name =
                        typeof topic === "string"
                            ? topic
                            : topic?.name ||
                              topic?.title ||
                              topic?.topic;


                    if (
                        name &&
                        completed.includes(
                            String(name)
                        )
                    ) {

                        subjects.add(
                            subjectName
                        );

                    }

                }
            );

        }
    );


    return subjects;

}


/* =========================================================
   TODAY COMPLETIONS
========================================================= */

function getTodayCompletedTopics() {

    const activity =
        readJSON(
            REWARD_KEYS.STREAK_ACTIVITY,
            {}
        );


    /*
     * The streak activity intentionally represents
     * days, not individual topic counts.
     *
     * Therefore use today's completion history
     * when available.
     */

    const completed =
        readJSON(
            REWARD_KEYS.COMPLETED,
            []
        );


    const today =
        formatDate(
            new Date()
        );


    const history =
        readJSON(
            "studyMindTopicCompletionDates",
            {}
        );


    if (
        history &&
        Array.isArray(
            history[today]
        )
    ) {

        return history[today].length;

    }


    /*
     * Fallback.
     */

    return activity[today]
        ? 1
        : 0;

}


/* =========================================================
   TODAY CHECKS
========================================================= */

function getTodayChecks() {

    const history =
        readJSON(
            "studyMindKnowledgeCheckDates",
            {}
        );


    const today =
        formatDate(
            new Date()
        );


    if (
        Array.isArray(
            history[today]
        )
    ) {

        return history[today].length;

    }


    return 0;

}


/* =========================================================
   RENDER STATS
========================================================= */

function renderStats() {

    const stats =
        getStats();


    setText(
        "unlockedCount",
        stats.unlocked
    );


    setText(
        "remainingCount",
        Math.max(
            0,
            100 - stats.unlocked
        )
    );


    setText(
        "rewardXP",
        stats.xp
    );


    setText(
        "currentStreak",
        stats.streak
    );


    const level =
        Math.floor(
            stats.xp / 100
        ) + 1;


    setText(
        "rewardLevel",
        `Level ${level} Scholar`
    );


    const next =
        REWARDS.find(
            reward =>
                !readJSON(
                    REWARD_KEYS.UNLOCKED,
                    []
                ).includes(
                    reward.id
                )
        );


    if (next) {

        setText(
            "nextRewardText",
            `${next.icon} ${next.name}`
        );

    } else {

        setText(
            "nextRewardText",
            "All rewards unlocked! 🏆"
        );

    }

}


/* =========================================================
   RENDER REWARDS
========================================================= */

function renderRewards() {

    const container =
        document.getElementById(
            "rewardsGrid"
        );


    if (!container) {
        return;
    }


    const unlocked =
        readJSON(
            REWARD_KEYS.UNLOCKED,
            []
        );


    let rewards =
        REWARDS.filter(
            reward => {

                const isUnlocked =
                    unlocked.includes(
                        reward.id
                    );


                if (
                    activeFilter ===
                    "unlocked"
                ) {
                    return isUnlocked;
                }


                if (
                    activeFilter ===
                    "locked"
                ) {
                    return !isUnlocked;
                }


                if (
                    [
                        "streak",
                        "knowledge",
                        "ai"
                    ].includes(
                        activeFilter
                    )
                ) {

                    return (
                        reward.category ===
                        activeFilter
                    );

                }


                return true;

            }
        );


    container.innerHTML =
        rewards.map(
            reward => {

                const isUnlocked =
                    unlocked.includes(
                        reward.id
                    );


                return `

                    <article
                        class="reward-card
                        ${isUnlocked ? "unlocked" : "locked"}"
                    >

                        <div class="reward-icon">
                            ${isUnlocked
                                ? reward.icon
                                : "🔒"}
                        </div>

                        <div class="reward-category">
                            ${reward.category}
                        </div>

                        <h3>
                            ${reward.name}
                        </h3>

                        <p>
                            ${reward.description}
                        </p>

                        <div class="reward-footer">

                            <span class="reward-xp">
                                +${reward.xp} XP
                            </span>

                            <span
                                class="reward-status
                                ${isUnlocked ? "unlocked" : "locked"}"
                            >
                                ${
                                    isUnlocked
                                        ? "✓ Unlocked"
                                        : "Locked"
                                }
                            </span>

                        </div>

                    </article>

                `;

            }
        ).join("");

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

function renderNotifications() {

    const container =
        document.getElementById(
            "notificationList"
        );


    if (!container) {
        return;
    }


    const notifications =
        readJSON(
            REWARD_KEYS.NOTIFICATIONS,
            []
        );


    if (!notifications.length) {

        container.innerHTML = `

            <div class="notification">

                <div class="notification-icon">
                    🏆
                </div>

                <div>
                    <strong>
                        No reward notifications yet
                    </strong>

                    <span>
                        Complete a study activity to unlock your first achievement.
                    </span>
                </div>

            </div>

        `;

        return;

    }


    container.innerHTML =
        notifications
            .slice(0, 10)
            .map(
                notification => `

                    <div class="notification">

                        <div class="notification-icon">
                            ${notification.icon}
                        </div>

                        <div>

                            <strong>
                                ${notification.title}
                                · +${notification.xp} XP
                            </strong>

                            <span>
                                ${notification.description}
                            </span>

                        </div>

                    </div>

                `
            )
            .join("");

}


/* =========================================================
   POPUP
========================================================= */

function showRewardPopup(
    reward
) {

    setText(
        "popupIcon",
        reward.icon
    );

    setText(
        "popupTitle",
        reward.name
    );

    setText(
        "popupDescription",
        reward.description
    );

    setText(
        "popupXP",
        reward.xp
    );


    document
        .getElementById(
            "rewardOverlay"
        )
        ?.classList.add(
            "show"
        );

}


function closeRewardPopup() {

    document
        .getElementById(
            "rewardOverlay"
        )
        ?.classList.remove(
            "show"
        );

}


function setupPopup() {

    document
        .getElementById(
            "closeRewardPopup"
        )
        ?.addEventListener(
            "click",
            closeRewardPopup
        );


    document
        .getElementById(
            "popupContinue"
        )
        ?.addEventListener(
            "click",
            closeRewardPopup
        );


    document
        .getElementById(
            "rewardOverlay"
        )
        ?.addEventListener(
            "click",
            event => {

                if (
                    event.target.id ===
                    "rewardOverlay"
                ) {

                    closeRewardPopup();

                }

            }
        );

}


/* =========================================================
   FILTERS
========================================================= */

function setupFilters() {

    document
        .querySelectorAll(
            ".filter"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        activeFilter =
                            button.dataset.filter;


                        document
                            .querySelectorAll(
                                ".filter"
                            )
                            .forEach(
                                item =>
                                    item.classList
                                        .remove(
                                            "active"
                                        )
                            );


                        button.classList.add(
                            "active"
                        );


                        renderRewards();

                    }
                );

            }
        );

}


/* =========================================================
   THEME
========================================================= */

function setupTheme() {

    document
        .getElementById(
            "themeButton"
        )
        ?.addEventListener(
            "click",
            () => {

                document.body.classList.toggle(
                    "dark"
                );

                localStorage.setItem(
                    "studyMindTheme",
                    document.body.classList.contains(
                        "dark"
                    )
                        ? "dark"
                        : "light"
                );

            }
        );

}


function applyTheme() {

    if (
        localStorage.getItem(
            "studyMindTheme"
        ) === "dark"
    ) {

        document.body.classList.add(
            "dark"
        );

    }

}


/* =========================================================
   USER
========================================================= */

async function loadUser() {

    let name =
        localStorage.getItem(
            REWARD_KEYS.USERNAME
        );


    try {

        if (
            window.supabaseClient?.auth
        ) {

            const {
                data
            } =
                await window.supabaseClient.auth.getUser();


            const user =
                data?.user;


            if (user) {

                name =
                    user.user_metadata?.full_name ||
                    user.user_metadata?.name ||
                    user.user_metadata?.username ||
                    user.email?.split("@")[0] ||
                    name ||
                    "Student";

            }

        }

    } catch (error) {

        console.warn(
            "Could not load user:",
            error
        );

    }


    name =
        name || "Student";


    localStorage.setItem(
        REWARD_KEYS.USERNAME,
        name
    );


    setText(
        "usernameDisplay",
        name
    );


    setText(
        "userAvatar",
        name
            .charAt(0)
            .toUpperCase()
    );

}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

    try {

        if (
            window.supabaseClient?.auth
        ) {

            await window.supabaseClient.auth.signOut();

        }

    } catch (error) {

        console.warn(
            "Logout error:",
            error
        );

    }


    window.location.href =
        "home.html";

}


function setupLogout() {

    document
        .getElementById(
            "logoutButton"
        )
        ?.addEventListener(
            "click",
            logout
        );

}


/* =========================================================
   TEXT
========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================================
   GLOBAL API
========================================================= */

window.StudyMindRewards = {

    check:
        checkRewards,

    getStats,

    getRewards:
        () => REWARDS,

    showRewardPopup

};
