/* =========================================================
   STUDYMIND AI — GAME MODE
   FULL CORRECTED REPLACEMENT

   PURPOSE:
   - Game Mode hub
   - You vs Computer navigation
   - 1v1 = Coming Soon
   - 2v2 = Coming Soon
   - Tournaments = Coming Soon
   - Free battle tracking
   - Leaderboard
   - Battle points
   - Theme
   - Navigation
   - Logout
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

const GAME_STORAGE = {
    theme: "studyMindGameTheme",
    battlesUsed: "studyMindBattlesUsed"
};

const FREE_BATTLE_LIMIT = 5;


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentGameUser = null;


/* =========================================================
   SUPABASE
========================================================= */

function getGameModeSupabase() {
    if (
        window.supabaseClient &&
        window.supabaseClient.auth &&
        typeof window.supabaseClient.auth.getUser === "function"
    ) {
        return window.supabaseClient;
    }

    return null;
}


/* =========================================================
   WAIT FOR SUPABASE
========================================================= */

function waitForGameModeSupabase(timeout = 10000) {
    return new Promise((resolve) => {

        const start = Date.now();

        function check() {

            const client = getGameModeSupabase();

            if (client) {
                resolve(client);
                return;
            }

            if (Date.now() - start >= timeout) {
                resolve(null);
                return;
            }

            setTimeout(check, 100);
        }

        check();
    });
}


/* =========================================================
   AUTHENTICATION
========================================================= */

async function loadCurrentGameUser() {

    const supabase = await waitForGameModeSupabase();

    if (!supabase) {
        console.warn(
            "StudyMind Game Mode: Supabase client not available."
        );
        return null;
    }

    try {

        const {
            data,
            error
        } = await supabase.auth.getUser();

        if (error) {
            console.warn(
                "StudyMind Game Mode auth error:",
                error
            );

            return null;
        }

        currentGameUser = data?.user || null;

        return currentGameUser;

    } catch (error) {

        console.error(
            "StudyMind Game Mode authentication failed:",
            error
        );

        return null;
    }
}


/* =========================================================
   FREE BATTLE STORAGE
========================================================= */

function getBattlesUsed() {

    const possibleKeys = [
        GAME_STORAGE.battlesUsed,
        "studyMindGameBattlesUsed",
        "gameBattlesUsed",
        "computerBattleCount"
    ];

    for (const key of possibleKeys) {

        const value = localStorage.getItem(key);

        if (value !== null) {

            const parsed = parseInt(value, 10);

            if (
                Number.isFinite(parsed) &&
                parsed >= 0
            ) {
                return parsed;
            }
        }
    }

    return 0;
}


function setBattlesUsed(value) {

    const safeValue = Math.max(
        0,
        parseInt(value, 10) || 0
    );

    localStorage.setItem(
        GAME_STORAGE.battlesUsed,
        String(safeValue)
    );

    /*
       Keep compatibility with older Game Mode storage.
    */

    localStorage.setItem(
        "studyMindGameBattlesUsed",
        String(safeValue)
    );

    return safeValue;
}


/* =========================================================
   BATTLE LIMIT UI
========================================================= */

function updateBattleLimitUI() {

    const battlesUsed = getBattlesUsed();

    const battlesUsedElement =
        $("battlesUsed");

    const battleLimitElement =
        $("battleLimit");

    const battleStatusText =
        $("battleStatusText");

    if (battlesUsedElement) {
        battlesUsedElement.textContent =
            Math.min(
                battlesUsed,
                FREE_BATTLE_LIMIT
            );
    }

    if (battleLimitElement) {
        battleLimitElement.textContent =
            FREE_BATTLE_LIMIT;
    }

    if (battleStatusText) {

        if (battlesUsed >= FREE_BATTLE_LIMIT) {

            battleStatusText.textContent =
                "Free battles used";

            battleStatusText.classList.add(
                "limit-reached"
            );

        } else {

            const remaining =
                FREE_BATTLE_LIMIT - battlesUsed;

            battleStatusText.textContent =
                `${remaining} free battle${
                    remaining === 1 ? "" : "s"
                } remaining`;

            battleStatusText.classList.remove(
                "limit-reached"
            );
        }
    }
}


/* =========================================================
   CHECK WHETHER COMPUTER BATTLE IS AVAILABLE
========================================================= */

function canStartComputerBattle() {

    const battlesUsed =
        getBattlesUsed();

    return battlesUsed < FREE_BATTLE_LIMIT;
}


/* =========================================================
   OPEN COMPUTER BATTLE
========================================================= */

function openComputerBattle(event) {

    if (event) {
        event.preventDefault();
    }

    /*
       The Computer Battle page is the ONLY
       playable battle mode at the moment.
    */

    if (!canStartComputerBattle()) {

        showPremiumMessage();

        return false;
    }

    window.location.href =
        "computer-battle.html";

    return true;
}


/* =========================================================
   PREMIUM MESSAGE
========================================================= */

function showPremiumMessage() {

    const premiumCard =
        document.querySelector(
            ".premium-card"
        );

    if (premiumCard) {

        premiumCard.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        premiumCard.classList.add(
            "premium-highlight"
        );

        setTimeout(() => {

            premiumCard.classList.remove(
                "premium-highlight"
            );

        }, 1800);
    }

    /*
       If no premium card exists,
       still give the user feedback.
    */

    const existingMessage =
        $("battleStatusText");

    if (existingMessage) {

        existingMessage.textContent =
            "You've used all 5 free battles. Premium unlocks unlimited battles.";

        existingMessage.classList.add(
            "limit-reached"
        );
    }
}


/* =========================================================
   DISABLE COMING-SOON MODES
========================================================= */

function disableComingSoonModes() {

    const comingSoonIds = [
        "oneVOneModeButton",
        "twoVTwoModeButton",
        "tournamentModeButton"
    ];

    comingSoonIds.forEach((id) => {

        const button = $(id);

        if (!button) {
            return;
        }

        /*
           Remove old handlers.
        */

        button.onclick = null;

        /*
           Native disabled state.
        */

        if (
            "disabled" in button
        ) {
            button.disabled = true;
        }

        button.setAttribute(
            "aria-disabled",
            "true"
        );

        button.classList.add(
            "coming-soon-card",
            "locked-mode"
        );

        /*
           Replace misleading text.
        */

        const action =
            button.querySelector(
                ".mode-action"
            );

        if (action) {
            action.textContent =
                "Coming Soon";
        }

        const tag =
            button.querySelector(
                ".mode-tag"
            );

        if (tag) {
            tag.textContent =
                "COMING SOON";
        }
    });
}


/* =========================================================
   BLOCK OLD 1V1 FUNCTIONS
========================================================= */

function openOneVOne(event) {

    if (event) {
        event.preventDefault();
    }

    /*
       Deliberately do nothing.
       1v1 is not available yet.
    */

    return false;
}


function openTwoVTwo(event) {

    if (event) {
        event.preventDefault();
    }

    return false;
}


function openTournaments(event) {

    if (event) {
        event.preventDefault();
    }

    return false;
}


/* =========================================================
   REMOVE OLD INLINE HANDLERS
========================================================= */

function cleanOldGameModeHandlers() {

    const oneVOne =
        $("oneVOneModeButton");

    const twoVTwo =
        $("twoVTwoModeButton");

    const tournaments =
        $("tournamentModeButton");

    /*
       1v1
    */

    if (oneVOne) {

        oneVOne.onclick = null;

        if (
            oneVOne.tagName === "BUTTON" ||
            oneVOne.tagName === "INPUT"
        ) {
            oneVOne.disabled = true;
        }

        oneVOne.setAttribute(
            "aria-disabled",
            "true"
        );
    }

    /*
       2v2
    */

    if (twoVTwo) {

        twoVTwo.onclick = null;

        if (
            twoVTwo.tagName === "BUTTON" ||
            twoVTwo.tagName === "INPUT"
        ) {
            twoVTwo.disabled = true;
        }

        twoVTwo.setAttribute(
            "aria-disabled",
            "true"
        );
    }

    /*
       Tournaments
    */

    if (tournaments) {

        tournaments.onclick = null;

        if (
            tournaments.tagName === "BUTTON" ||
            tournaments.tagName === "INPUT"
        ) {
            tournaments.disabled = true;
        }

        tournaments.setAttribute(
            "aria-disabled",
            "true"
        );
    }
}


/* =========================================================
   ENSURE COMPUTER BUTTON WORKS
========================================================= */

function setupComputerBattleButton() {

    const button =
        $("computerModeButton");

    if (!button) {
        console.warn(
            "StudyMind Game Mode: computerModeButton not found."
        );
        return;
    }

    /*
       Remove any old inline handler.
    */

    button.onclick = null;

    /*
       Use a normal event listener.
    */

    button.addEventListener(
        "click",
        function(event) {

            openComputerBattle(event);

        }
    );
}


/* =========================================================
   BACKWARD-COMPATIBILITY BUTTON IDS
========================================================= */

function setupComputerBattleAliases() {

    const possibleIds = [
        "computerBattleButton",
        "youVsComputerButton",
        "startComputerBattle",
        "computerBattle",
        "playComputerBattle",
        "vsComputerButton",
        "battleComputerButton"
    ];

    possibleIds.forEach((id) => {

        const button = $(id);

        if (!button) {
            return;
        }

        /*
           Avoid binding the same element twice.
        */

        if (
            button.dataset.gameModeBound === "true"
        ) {
            return;
        }

        button.dataset.gameModeBound = "true";

        button.onclick = null;

        button.addEventListener(
            "click",
            function(event) {

                openComputerBattle(event);

            }
        );
    });
}


/* =========================================================
   HANDLE BUTTONS BY TEXT
========================================================= */

function setupTextBasedComputerBattleFallback() {

    const elements =
        document.querySelectorAll(
            "button, a"
        );

    elements.forEach((element) => {

        if (
            element.dataset.gameModeTextBound ===
            "true"
        ) {
            return;
        }

        const text =
            (
                element.textContent || ""
            )
                .trim()
                .toLowerCase()
                .replace(/\s+/g, " ");

        const isComputerBattle =
            text.includes(
                "you vs computer"
            ) ||
            text.includes(
                "vs computer"
            ) ||
            text.includes(
                "computer battle"
            );

        if (!isComputerBattle) {
            return;
        }

        /*
           Do not accidentally bind a Coming Soon
           card containing unrelated text.
        */

        const isComingSoon =
            text.includes(
                "coming soon"
            );

        if (isComingSoon) {
            return;
        }

        element.dataset.gameModeTextBound =
            "true";

        element.addEventListener(
            "click",
            function(event) {

                openComputerBattle(event);

            }
        );
    });
}


/* =========================================================
   PREVENT 1V1 / 2V2 / TOURNAMENT NAVIGATION
========================================================= */

function setupComingSoonClickProtection() {

    document.addEventListener(
        "click",
        function(event) {

            const target =
                event.target.closest(
                    "#oneVOneModeButton, #twoVTwoModeButton, #tournamentModeButton"
                );

            if (!target) {
                return;
            }

            /*
               Extra protection in case another
               script tries to attach a handler.
            */

            event.preventDefault();
            event.stopPropagation();

            return false;
        },
        true
    );
}


/* =========================================================
   THEME
========================================================= */

function getSavedGameTheme() {

    return (
        localStorage.getItem(
            GAME_STORAGE.theme
        ) || "dark"
    );
}


function applyGameTheme(theme) {

    const safeTheme =
        theme === "light"
            ? "light"
            : "dark";

    document.documentElement.dataset.theme =
        safeTheme;

    document.body.classList.toggle(
        "light-theme",
        safeTheme === "light"
    );

    document.body.classList.toggle(
        "dark-theme",
        safeTheme === "dark"
    );

    localStorage.setItem(
        GAME_STORAGE.theme,
        safeTheme
    );

    updateThemeButton(
        safeTheme
    );
}


function updateThemeButton(theme) {

    const button =
        $("themeToggle");

    if (!button) {
        return;
    }

    const icon =
        button.querySelector(
            ".theme-icon"
        );

    const text =
        button.querySelector(
            ".theme-text"
        );

    if (theme === "light") {

        if (icon) {
            icon.textContent = "☀️";
        }

        if (text) {
            text.textContent = "Light";
        }

        button.setAttribute(
            "aria-label",
            "Switch to dark theme"
        );

    } else {

        if (icon) {
            icon.textContent = "🌙";
        }

        if (text) {
            text.textContent = "Dark";
        }

        button.setAttribute(
            "aria-label",
            "Switch to light theme"
        );
    }
}


function toggleGameTheme() {

    const current =
        getSavedGameTheme();

    const next =
        current === "dark"
            ? "light"
            : "dark";

    applyGameTheme(next);
}


/* =========================================================
   THEME BUTTON SETUP
========================================================= */

function setupThemeToggle() {

    const button =
        $("themeToggle");

    if (!button) {
        return;
    }

    button.onclick = null;

    button.addEventListener(
        "click",
        function() {

            toggleGameTheme();

        }
    );
}


/* =========================================================
   GENERAL NAVIGATION
========================================================= */

function goToHome(event) {

    if (event) {
        event.preventDefault();
    }

    window.location.href =
        "home.html";
}


function goToNewStudyPlan(event) {

    if (event) {
        event.preventDefault();
    }

    window.location.href =
        "index.html";
}


function goToSummarizer(event) {

    if (event) {
        event.preventDefault();
    }

    window.location.href =
        "summarizer.html";
}


function goToDashboard(event) {

    if (event) {
        event.preventDefault();
    }

    window.location.href =
        "dashboard.html";
}


/* =========================================================
   NAVIGATION BUTTON SETUP
========================================================= */

function setupNavigation() {

    const homeButton =
        $("homeButton");

    const newPlanButton =
        $("newStudyPlanButton");

    const summarizerButton =
        $("summarizerButton");

    const dashboardButton =
        $("dashboardButton");

    if (homeButton) {

        homeButton.addEventListener(
            "click",
            goToHome
        );
    }

    if (newPlanButton) {

        newPlanButton.addEventListener(
            "click",
            goToNewStudyPlan
        );
    }

    if (summarizerButton) {

        summarizerButton.addEventListener(
            "click",
            goToSummarizer
        );
    }

    if (dashboardButton) {

        dashboardButton.addEventListener(
            "click",
            goToDashboard
        );
    }
}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutGameMode(event) {

    if (event) {
        event.preventDefault();
    }

    const supabase =
        await waitForGameModeSupabase();

    if (!supabase) {

        window.location.href =
            "login.html";

        return;
    }

    try {

        const {
            error
        } = await supabase.auth.signOut();

        if (error) {
            console.error(
                "StudyMind logout error:",
                error
            );
        }

    } catch (error) {

        console.error(
            "StudyMind logout failed:",
            error
        );

    } finally {

        window.location.href =
            "login.html";
    }
}


function setupLogout() {

    const logoutButton =
        $("logoutButton");

    if (!logoutButton) {
        return;
    }

    logoutButton.onclick = null;

    logoutButton.addEventListener(
        "click",
        logoutGameMode
    );
}


/* =========================================================
   LEADERBOARD
========================================================= */

function getLeaderboardContainer() {

    return (
        $("leaderboardList") ||
        $("leaderboardBody") ||
        $("leaderboardTableBody")
    );
}


function escapeHTML(value) {

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


async function loadLeaderboard() {

    const container =
        getLeaderboardContainer();

    if (!container) {
        return;
    }

    const supabase =
        await waitForGameModeSupabase();

    if (!supabase) {

        container.innerHTML = `
            <div class="leaderboard-empty">
                Unable to load leaderboard.
            </div>
        `;

        return;
    }

    try {

        const {
            data,
            error
        } = await supabase
            .from("game_leaderboard")
            .select(
                "user_id,display_name,battle_points,wins,losses,draws,battles_played,updated_at"
            )
            .order(
                "battle_points",
                {
                    ascending: false
                }
            )
            .limit(10);

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {

            container.innerHTML = `
                <div class="leaderboard-empty">
                    No battles recorded yet.
                </div>
            `;

            return;
        }

        container.innerHTML =
            data
                .map(
                    (player, index) => {

                        const name =
                            escapeHTML(
                                player.display_name ||
                                "StudyMind Player"
                            );

                        const points =
                            Number(
                                player.battle_points
                            ) || 0;

                        const wins =
                            Number(
                                player.wins
                            ) || 0;

                        return `
                            <div class="leaderboard-row">

                                <div class="leaderboard-rank">
                                    ${index + 1}
                                </div>

                                <div class="leaderboard-player">
                                    ${name}
                                </div>

                                <div class="leaderboard-wins">
                                    ${wins}
                                </div>

                                <div class="leaderboard-points">
                                    ${points}
                                </div>

                            </div>
                        `;
                    }
                )
                .join("");

    } catch (error) {

        console.error(
            "StudyMind leaderboard error:",
            error
        );

        container.innerHTML = `
            <div class="leaderboard-empty">
                Leaderboard temporarily unavailable.
            </div>
        `;
    }
}


/* =========================================================
   CURRENT USER LEADERBOARD POSITION
========================================================= */

async function loadCurrentPlayerStats() {

    if (!currentGameUser) {
        return null;
    }

    const supabase =
        getGameModeSupabase();

    if (!supabase) {
        return null;
    }

    try {

        const {
            data,
            error
        } = await supabase
            .from("game_leaderboard")
            .select(
                "user_id,display_name,battle_points,wins,losses,draws,battles_played"
            )
            .eq(
                "user_id",
                currentGameUser.id
            )
            .maybeSingle();

        if (error) {

            console.warn(
                "Could not load player stats:",
                error
            );

            return null;
        }

        return data || null;

    } catch (error) {

        console.warn(
            "Player stats error:",
            error
        );

        return null;
    }
}


/* =========================================================
   DISPLAY CURRENT PLAYER POINTS
========================================================= */

async function updatePlayerPointsUI() {

    const pointsElement =
        $("battlePoints") ||
        $("playerBattlePoints") ||
        $("currentBattlePoints");

    if (!pointsElement) {
        return;
    }

    const stats =
        await loadCurrentPlayerStats();

    if (!stats) {

        pointsElement.textContent =
            "0";

        return;
    }

    pointsElement.textContent =
        Number(
            stats.battle_points
        ) || 0;
}


/* =========================================================
   FREE BATTLE NOTICE
========================================================= */

function updateFreeBattleCard() {

    const battlesUsed =
        getBattlesUsed();

    const remaining =
        Math.max(
            0,
            FREE_BATTLE_LIMIT -
            battlesUsed
        );

    const remainingElement =
        $("remainingBattles");

    if (remainingElement) {

        remainingElement.textContent =
            remaining;
    }

    const computerButton =
        $("computerModeButton");

    /*
       Computer Battle stays visible.
       Once the free limit is reached,
       clicking it opens the premium prompt.
    */

    if (computerButton) {

        computerButton.disabled = false;

        computerButton.removeAttribute(
            "aria-disabled"
        );

        computerButton.classList.remove(
            "locked-mode"
        );
    }
}


/* =========================================================
   OPTIONAL BATTLE COUNT INCREMENT
========================================================= */

function incrementBattleCount() {

    const current =
        getBattlesUsed();

    const next =
        current + 1;

    setBattlesUsed(next);

    updateBattleLimitUI();
    updateFreeBattleCard();

    return next;
}


/* =========================================================
   RESET BATTLE COUNT
   ---------------------------------------------------------
   This is intentionally NOT exposed through the UI.
========================================================= */

function resetBattleCount() {

    setBattlesUsed(0);

    updateBattleLimitUI();
    updateFreeBattleCard();
}


/* =========================================================
   CLEAN OLD GLOBAL NAVIGATION FUNCTIONS
========================================================= */

function installSafeGlobalFunctions() {

    /*
       Computer Battle
    */

    window.openComputerBattle =
        openComputerBattle;

    /*
       Coming Soon modes
    */

    window.openOneVOne =
        openOneVOne;

    window.openTwoVTwo =
        openTwoVTwo;

    window.openTournaments =
        openTournaments;

    /*
       Navigation
    */

    window.goToHome =
        goToHome;

    window.goToNewStudyPlan =
        goToNewStudyPlan;

    window.goToSummarizer =
        goToSummarizer;

    window.goToDashboard =
        goToDashboard;

    /*
       Logout
    */

    window.logoutGameMode =
        logoutGameMode;

    /*
       Theme
    */

    window.toggleGameTheme =
        toggleGameTheme;

    /*
       Battle count compatibility
    */

    window.incrementBattleCount =
        incrementBattleCount;
}


/* =========================================================
   REMOVE LEGACY COMPUTER-BATTLE NAVIGATION CODE
========================================================= */

function removeLegacyNavigationPatterns() {

    /*
       We cannot physically edit another JS file
       from here, but we make sure the current
       page uses the correct Game Mode handlers.

       This prevents old inline onclick handlers
       from launching 1v1.
    */

    const oneVOne =
        $("oneVOneModeButton");

    if (oneVOne) {

        oneVOne.onclick = null;
        oneVOne.disabled = true;
        oneVOne.setAttribute(
            "aria-disabled",
            "true"
        );
    }

    const twoVTwo =
        $("twoVTwoModeButton");

    if (twoVTwo) {

        twoVTwo.onclick = null;
        twoVTwo.disabled = true;
        twoVTwo.setAttribute(
            "aria-disabled",
            "true"
        );
    }

    const tournaments =
        $("tournamentModeButton");

    if (tournaments) {

        tournaments.onclick = null;
        tournaments.disabled = true;
        tournaments.setAttribute(
            "aria-disabled",
            "true"
        );
    }
}


/* =========================================================
   INITIALIZE GAME MODE
========================================================= */

async function initializeGameMode() {

    console.log(
        "StudyMind Game Mode initializing..."
    );

    /*
       Theme first.
    */

    applyGameTheme(
        getSavedGameTheme()
    );

    /*
       Make coming-soon modes
       unavailable immediately.
    */

    removeLegacyNavigationPatterns();
    disableComingSoonModes();

    /*
       Navigation.
    */

    setupNavigation();
    setupThemeToggle();
    setupLogout();

    /*
       Computer Battle.
    */

    setupComputerBattleButton();
    setupComputerBattleAliases();
    setupTextBasedComputerBattleFallback();

    /*
       Extra protection against
       accidental 1v1 clicks.
    */

    setupComingSoonClickProtection();

    /*
       Free battle UI.
    */

    updateBattleLimitUI();
    updateFreeBattleCard();

    /*
       Authentication.
    */

    await loadCurrentGameUser();

    /*
       Leaderboard.
    */

    await loadLeaderboard();

    /*
       Current player's Battle Points.
    */

    await updatePlayerPointsUI();

    console.log(
        "StudyMind Game Mode initialized."
    );

    console.log(
        "Current user:",
        currentGameUser
    );

    console.log(
        "Computer Battle available:",
        canStartComputerBattle()
    );

    console.log(
        "1v1: COMING SOON"
    );

    console.log(
        "2v2: COMING SOON"
    );

    console.log(
        "Tournaments: COMING SOON"
    );
}


/* =========================================================
   DOM READY
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


/* =========================================================
   GLOBAL COMPATIBILITY
========================================================= */

installSafeGlobalFunctions();


/* =========================================================
   FINAL SAFETY CHECK
========================================================= */

window.addEventListener(
    "load",
    function() {

        /*
           Some pages dynamically insert
           their mode buttons. Run one final
           check after everything has loaded.
        */

        disableComingSoonModes();
        removeLegacyNavigationPatterns();

        setupComputerBattleAliases();
        setupTextBasedComputerBattleFallback();

        updateBattleLimitUI();
        updateFreeBattleCard();

    }
);
