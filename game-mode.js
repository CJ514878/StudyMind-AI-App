/* =========================================================
   STUDYMIND AI — GAME MODE HUB
   Hub-only JavaScript
   Handles:
   - Navigation
   - Theme
   - Logout
   - Free battle status
   - Premium status
   - Leaderboard
   - Battle-point display

   Battle engines belong in:
   computer-battle.js
   1v1.js
   2v2.js
   tournaments.js
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const supabaseClient =
    typeof supabase !== "undefined"
        ? supabase
        : null;


/* =========================================================
   STORAGE
========================================================= */

const GAME_STORAGE = {
    theme: "studyMindGameTheme",
    battleCount: "studyMindBattleCount"
};


/* =========================================================
   CONSTANTS
========================================================= */

const FREE_BATTLE_LIMIT = 5;


/* =========================================================
   ELEMENT SHORTCUT
========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   PAGE NAVIGATION
========================================================= */

function openHome() {
    window.location.href = "home.html";
}


function openNewStudyPlan() {
    window.location.href = "index.html";
}


function openSummarizer() {
    window.location.href = "summarizer.html";
}


function openStudyStreak() {
    window.location.href = "study-streak.html";
}


function openStudyScore() {
    window.location.href = "study-score.html";
}


/* =========================================================
   BATTLE PAGE NAVIGATION
========================================================= */

function openComputerBattle() {
    window.location.href = "computer-battle.html";
}


function openOneVOne() {
    window.location.href = "1v1.html";
}


function openTwoVTwo() {
    window.location.href = "2v2.html";
}


function openTournaments() {
    window.location.href = "tournaments.html";
}


/* =========================================================
   PREMIUM
========================================================= */

function openPremium() {
    /*
       Change this filename if your premium page
       uses a different name.
    */

    window.location.href = "premium.html";
}


/* =========================================================
   THEME
========================================================= */

function applyGameTheme() {
    const savedTheme =
        localStorage.getItem(GAME_STORAGE.theme) || "dark";

    document.body.classList.toggle(
        "light-mode",
        savedTheme === "light"
    );

    const themeButton = $("themeButton");

    if (!themeButton) {
        return;
    }

    themeButton.textContent =
        savedTheme === "light"
            ? "☀️ Light Mode"
            : "🌙 Dark Mode";
}


function toggleGameTheme() {
    const currentTheme =
        localStorage.getItem(GAME_STORAGE.theme) || "dark";

    const newTheme =
        currentTheme === "dark"
            ? "light"
            : "dark";

    localStorage.setItem(
        GAME_STORAGE.theme,
        newTheme
    );

    applyGameTheme();
}


/* =========================================================
   FREE BATTLE COUNT
========================================================= */

function getBattleCount() {
    const stored =
        localStorage.getItem(
            GAME_STORAGE.battleCount
        );

    const count = Number(stored);

    if (!Number.isFinite(count) || count < 0) {
        return 0;
    }

    return Math.min(
        count,
        FREE_BATTLE_LIMIT
    );
}


function setBattleCount(count) {
    const safeCount = Math.max(
        0,
        Math.min(
            Number(count) || 0,
            FREE_BATTLE_LIMIT
        )
    );

    localStorage.setItem(
        GAME_STORAGE.battleCount,
        String(safeCount)
    );
}


function updateBattleStatus() {
    const used = getBattleCount();

    const remaining = Math.max(
        0,
        FREE_BATTLE_LIMIT - used
    );

    const usedElement = $("battlesUsed");
    const limitElement = $("battleLimit");
    const statusElement = $("battleStatusText");

    if (usedElement) {
        usedElement.textContent = used;
    }

    if (limitElement) {
        limitElement.textContent =
            FREE_BATTLE_LIMIT;
    }

    if (statusElement) {
        if (remaining > 1) {
            statusElement.textContent =
                `${remaining} battles remaining`;
        } else if (remaining === 1) {
            statusElement.textContent =
                "1 battle remaining";
        } else {
            statusElement.textContent =
                "No free battles remaining";
        }
    }

    updateBattleAvailability();
}


/* =========================================================
   BATTLE AVAILABILITY
========================================================= */

function updateBattleAvailability() {
    const computerButton =
        $("computerModeButton");

    const oneVOneButton =
        $("oneVOneModeButton");

    const used = getBattleCount();

    const freeLimitReached =
        used >= FREE_BATTLE_LIMIT;

    /*
       We don't permanently disable the buttons.
       This allows premium users to continue playing
       and lets the dedicated battle pages perform
       the final entitlement check.
    */

    if (computerButton) {
        computerButton.dataset.freeLimitReached =
            freeLimitReached
                ? "true"
                : "false";
    }

    if (oneVOneButton) {
        oneVOneButton.dataset.freeLimitReached =
            freeLimitReached
                ? "true"
                : "false";
    }

    const premiumCard =
        $("premiumBattleCard");

    if (premiumCard) {
        premiumCard.style.display =
            freeLimitReached
                ? "flex"
                : "";
    }
}


/* =========================================================
   OPTIONAL BATTLE COUNT API
   Dedicated battle pages can call this after
   a completed free battle.
========================================================= */

function registerFreeBattle() {
    const currentCount =
        getBattleCount();

    if (currentCount >= FREE_BATTLE_LIMIT) {
        return false;
    }

    setBattleCount(
        currentCount + 1
    );

    updateBattleStatus();

    return true;
}


/* =========================================================
   LEADERBOARD HELPERS
========================================================= */

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatPoints(points) {
    const number = Number(points);

    if (!Number.isFinite(number)) {
        return "0";
    }

    return number.toLocaleString();
}


/* =========================================================
   LOAD CURRENT USER
========================================================= */

async function getCurrentUser() {
    if (!supabaseClient) {
        return null;
    }

    try {
        const {
            data,
            error
        } = await supabaseClient.auth.getUser();

        if (error) {
            console.error(
                "Unable to get current user:",
                error
            );

            return null;
        }

        return data?.user || null;

    } catch (error) {
        console.error(
            "Unexpected auth error:",
            error
        );

        return null;
    }
}


/* =========================================================
   LOAD LEADERBOARD
========================================================= */

async function loadLeaderboard() {
    const rowsElement =
        $("leaderboardRows");

    if (!rowsElement) {
        return;
    }

    if (!supabaseClient) {
        showLeaderboardMessage(
            "Leaderboard unavailable"
        );

        return;
    }

    try {
        const {
            data,
            error
        } = await supabaseClient
            .from("game_leaderboard")
            .select(`
                user_id,
                display_name,
                battle_points,
                wins,
                losses,
                draws,
                battles_played,
                updated_at
            `)
            .order(
                "battle_points",
                {
                    ascending: false
                }
            )
            .limit(10);

        if (error) {
            console.error(
                "Leaderboard error:",
                error
            );

            showLeaderboardMessage(
                "Unable to load leaderboard"
            );

            return;
        }

        if (!data || data.length === 0) {
            showLeaderboardMessage(
                "No players yet"
            );

            await updateYourLeaderboardPosition(
                null
            );

            return;
        }

        renderLeaderboard(data);

        await updateYourLeaderboardPosition(
            data
        );

    } catch (error) {
        console.error(
            "Unexpected leaderboard error:",
            error
        );

        showLeaderboardMessage(
            "Unable to load leaderboard"
        );
    }
}


/* =========================================================
   RENDER LEADERBOARD
========================================================= */

function renderLeaderboard(players) {
    const rowsElement =
        $("leaderboardRows");

    if (!rowsElement) {
        return;
    }

    rowsElement.innerHTML =
        players.map(
            (player, index) => {

                const rank =
                    index + 1;

                const name =
                    player.display_name ||
                    "StudyMind Player";

                const points =
                    formatPoints(
                        player.battle_points
                    );

                return `
                    <div class="leaderboard-row">
                        <span>
                            ${rank}
                        </span>

                        <span>
                            ${escapeHTML(name)}
                        </span>

                        <strong>
                            ${points}
                        </strong>
                    </div>
                `;
            }
        ).join("");
}


/* =========================================================
   LEADERBOARD EMPTY / ERROR STATE
========================================================= */

function showLeaderboardMessage(message) {
    const rowsElement =
        $("leaderboardRows");

    if (!rowsElement) {
        return;
    }

    rowsElement.innerHTML = `
        <div class="leaderboard-row">
            <span>—</span>

            <span>
                ${escapeHTML(message)}
            </span>

            <strong>—</strong>
        </div>
    `;
}


/* =========================================================
   CURRENT USER LEADERBOARD POSITION
========================================================= */

async function updateYourLeaderboardPosition(
    leaderboardData
) {
    const rankElement =
        $("yourLeaderboardRank");

    const pointsElement =
        $("yourBattlePoints");

    if (!rankElement) {
        return;
    }

    const user =
        await getCurrentUser();

    if (!user) {
        rankElement.innerHTML = `
            <span>—</span>

            <span>You</span>

            <strong id="yourBattlePoints">
                0
            </strong>
        `;

        return;
    }

    let playerData = null;
    let rank = null;

    /*
       First check whether the current player
       is already inside the top 10.
    */

    if (Array.isArray(leaderboardData)) {
        const index =
            leaderboardData.findIndex(
                player =>
                    player.user_id === user.id
            );

        if (index !== -1) {
            playerData =
                leaderboardData[index];

            rank =
                index + 1;
        }
    }


    /*
       If the player isn't in the top 10,
       fetch their individual leaderboard row.
    */

    if (!playerData) {
        try {
            const {
                data,
                error
            } = await supabaseClient
                .from("game_leaderboard")
                .select(`
                    user_id,
                    display_name,
                    battle_points,
                    wins,
                    losses,
                    draws,
                    battles_played,
                    updated_at
                `)
                .eq(
                    "user_id",
                    user.id
                )
                .maybeSingle();

            if (!error && data) {
                playerData = data;

                const {
                    count,
                    error: countError
                } = await supabaseClient
                    .from("game_leaderboard")
                    .select(
                        "user_id",
                        {
                            count: "exact",
                            head: true
                        }
                    )
                    .gt(
                        "battle_points",
                        data.battle_points || 0
                    );

                if (!countError) {
                    rank =
                        (count || 0) + 1;
                }
            }

        } catch (error) {
            console.error(
                "Unable to load player rank:",
                error
            );
        }
    }


    if (!playerData) {
        rankElement.innerHTML = `
            <span>—</span>

            <span>You</span>

            <strong id="yourBattlePoints">
                0
            </strong>
        `;

        return;
    }


    const displayName =
        playerData.display_name ||
        "You";

    const points =
        Number(
            playerData.battle_points
        ) || 0;


    rankElement.innerHTML = `
        <span>
            ${rank ? rank : "—"}
        </span>

        <span>
            ${escapeHTML(displayName)}
        </span>

        <strong id="yourBattlePoints">
            ${formatPoints(points)}
        </strong>
    `;
}


/* =========================================================
   PREMIUM / ENTITLEMENT
========================================================= */

/*
   The hub does not assume that reaching 5 battles
   automatically means the user is premium.

   If your database later contains a premium/subscription
   field, this function can be expanded without changing
   the rest of the hub.
*/

async function checkPremiumStatus() {
    const premiumCard =
        $("premiumBattleCard");

    if (!premiumCard) {
        return;
    }

    /*
       Keep the premium card available as an upgrade
       section. The dedicated battle pages should perform
       the authoritative premium check before allowing
       a battle.
    */

    premiumCard.style.display = "";
}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutStudyMind() {
    const confirmed =
        window.confirm(
            "Are you sure you want to log out?"
        );

    if (!confirmed) {
        return;
    }

    try {
        if (supabaseClient) {
            const {
                error
            } = await supabaseClient.auth.signOut();

            if (error) {
                console.error(
                    "Logout error:",
                    error
                );
            }
        }

    } catch (error) {
        console.error(
            "Unexpected logout error:",
            error
        );
    }

    /*
       Clear only temporary game-session data.
       Do NOT clear the user's study plan,
       theme, progress, or other StudyMind data.
    */

    sessionStorage.removeItem(
        "studyMindBattleSession"
    );

    window.location.href =
        "login.html";
}


/* =========================================================
   AUTH CHECK
========================================================= */

async function verifyGameUser() {
    if (!supabaseClient) {
        console.warn(
            "Supabase client not available."
        );

        return null;
    }

    const user =
        await getCurrentUser();

    if (!user) {
        window.location.href =
            "login.html";

        return null;
    }

    return user;
}


/* =========================================================
   INITIALIZATION
========================================================= */

async function initializeGameHub() {
    applyGameTheme();

    updateBattleStatus();

    await verifyGameUser();

    await checkPremiumStatus();

    await loadLeaderboard();
}


/* =========================================================
   AUTH STATE CHANGES
========================================================= */

if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange(
        (event, session) => {

            if (
                event === "SIGNED_OUT" ||
                !session
            ) {
                window.location.href =
                    "login.html";
            }
        }
    );
}


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeGameHub
);


/* =========================================================
   GLOBAL EXPORTS
   Makes onclick="" functions available
   from game-mode.html.
========================================================= */

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

window.openComputerBattle =
    openComputerBattle;

window.openOneVOne =
    openOneVOne;

window.openTwoVTwo =
    openTwoVTwo;

window.openTournaments =
    openTournaments;

window.openPremium =
    openPremium;

window.toggleGameTheme =
    toggleGameTheme;

window.logoutStudyMind =
    logoutStudyMind;

window.registerFreeBattle =
    registerFreeBattle;

