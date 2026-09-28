"use strict";

/* =========================================================
   STUDYMIND AI — LEADERBOARD
   CONNECTED TO GAME_LEADERBOARD

   USERNAME AUTHORITY
   ---------------------------------------------------------
   Supabase Auth:
       user.user_metadata.username

   This is the ONLY canonical username.

   The following are NOT allowed to override it:
       - name
       - display_name
       - full_name
       - email
       - localStorage
       - study plan username

   game_leaderboard.display_name is treated as the
   leaderboard's synchronized display/cache value.
========================================================= */


/* =========================================================
   DEBUG VERSION
========================================================= */

console.log(
    "STUDYMIND LEADERBOARD VERSION: 2026-09-28-SUPABASE-USERNAME-FIX"
);


/* =========================================================
   SHARED SUPABASE CLIENT
========================================================= */

const leaderboardSupabase =
    window.studyMindSupabase ||
    window.gameSupabase ||
    window.supabaseClient ||
    null;


if (!leaderboardSupabase) {

    console.error(
        "StudyMind Leaderboard: Shared Supabase client unavailable."
    );

}


/* =========================================================
   STATE
========================================================= */

let allStudents = [];

let currentUserId = null;

let currentUsername = "";


/* =========================================================
   DOM HELPER
========================================================= */

function $(id) {

    return document.getElementById(id);

}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        loadTheme();

        setupTheme();

        setupSearch();

        setupRefresh();

        setupLogout();

        /*
         * IMPORTANT:
         * Get the authenticated Supabase username BEFORE
         * loading the leaderboard.
         */
        await loadCurrentUser();

        await loadLeaderboard();

    }
);


/* =========================================================
   CURRENT USER
========================================================= */

async function loadCurrentUser() {

    if (!leaderboardSupabase) {

        console.error(
            "StudyMind Leaderboard: Supabase client unavailable."
        );

        return;

    }


    try {

        const {
            data,
            error
        } =
            await leaderboardSupabase.auth.getUser();


        if (error) {

            throw error;

        }


        const user =
            data?.user;


        if (!user) {

            console.warn(
                "StudyMind Leaderboard: No authenticated user."
            );

            currentUserId = null;

            currentUsername = "";

            return;

        }


        currentUserId =
            user.id;


        const metadata =
            user.user_metadata || {};


        /*
         * =====================================================
         * CANONICAL USERNAME
         * =====================================================
         *
         * ONLY user_metadata.username is authoritative.
         *
         * DO NOT fall back to:
         *   metadata.name
         *   metadata.display_name
         *   metadata.full_name
         *   email
         *   localStorage
         */

        currentUsername =
            String(
                metadata.username || ""
            ).trim();


        if (!currentUsername) {

            console.warn(
                "StudyMind Leaderboard: Authenticated user has no canonical username."
            );

            currentUsername =
                "Student";

        }


        /*
         * Display current user's Auth username.
         */

        if ($("currentUsername")) {

            $("currentUsername").textContent =
                currentUsername;

        }


        if ($("userAvatar")) {

            $("userAvatar").textContent =
                getInitials(
                    currentUsername
                );

        }


        console.log(
            "StudyMind Leaderboard: Supabase-authoritative username:",
            currentUsername
        );


    } catch (error) {

        console.error(
            "Could not load current Supabase user:",
            error
        );

    }

}


/* =========================================================
   LISTEN FOR USERNAME CHANGES
========================================================= */

window.addEventListener(
    "studyMindUsernameChanged",
    async event => {

        /*
         * Settings.js sends the newly saved canonical
         * Supabase username through this event.
         */

        const username =
            String(
                event.detail?.username || ""
            ).trim();


        if (!username) return;


        currentUsername =
            username;


        if ($("currentUsername")) {

            $("currentUsername").textContent =
                username;

        }


        if ($("userAvatar")) {

            $("userAvatar").textContent =
                getInitials(username);

        }


        /*
         * Reload Auth user so Supabase remains the
         * source of truth.
         */

        await loadCurrentUser();

        await loadLeaderboard();

    }
);


/* =========================================================
   SUPABASE AUTH STATE LISTENER
========================================================= */

if (leaderboardSupabase) {

    leaderboardSupabase.auth.onAuthStateChange(
        async (event, session) => {

            if (
                event === "SIGNED_IN" ||
                event === "USER_UPDATED"
            ) {

                const user =
                    session?.user;


                if (user) {

                    currentUserId =
                        user.id;


                    currentUsername =
                        String(
                            user.user_metadata?.username || ""
                        ).trim();


                    if ($("currentUsername")) {

                        $("currentUsername").textContent =
                            currentUsername || "Student";

                    }


                    if ($("userAvatar")) {

                        $("userAvatar").textContent =
                            getInitials(
                                currentUsername || "Student"
                            );

                    }


                    await loadLeaderboard();

                }

            }

        }
    );

}


/* =========================================================
   LOAD LEADERBOARD
========================================================= */

async function loadLeaderboard() {

    const body =
        $("leaderboardBody");


    if (body) {

        body.innerHTML = `
            <tr>
                <td colspan="7" class="loading">
                    Loading leaderboard...
                </td>
            </tr>
        `;

    }


    if (!leaderboardSupabase) {

        showError(
            "Supabase could not be initialized."
        );

        return;

    }


    try {

        /*
         * The leaderboard data itself comes from
         * game_leaderboard.
         *
         * display_name is the synchronized database
         * value written by the Game Mode RPC.
         */

        const {
            data,
            error
        } =
            await leaderboardSupabase
                .from("game_leaderboard")
                .select(`
                    user_id,
                    display_name,
                    battle_points,
                    wins,
                    losses,
                    draws
                `)
                .order(
                    "battle_points",
                    {
                        ascending: false
                    }
                )
                .order(
                    "wins",
                    {
                        ascending: false
                    }
                )
                .order(
                    "display_name",
                    {
                        ascending: true
                    }
                );


        if (error) {

            throw error;

        }


        /*
         * Convert database rows into the structure
         * expected by the existing UI.
         */

        allStudents =
            Array.isArray(data)
                ? data.map(
                    student => ({

                        id:
                            student.user_id,

                        username:
                            String(
                                student.display_name ||
                                "Student"
                            ).trim() ||
                            "Student",

                        battle_points:
                            Number(
                                student.battle_points || 0
                            ),

                        wins:
                            Number(
                                student.wins || 0
                            ),

                        losses:
                            Number(
                                student.losses || 0
                            ),

                        draws:
                            Number(
                                student.draws || 0
                            ),

                        battles_played:
                            Number(
                                student.wins || 0
                            ) +
                            Number(
                                student.losses || 0
                            ) +
                            Number(
                                student.draws || 0
                            )

                    })
                )
                : [];


        /*
         * =====================================================
         * KEEP CURRENT USER'S DISPLAY NAME IN SYNC
         * =====================================================
         *
         * The current user's Auth username is authoritative.
         *
         * If the leaderboard table still contains an older
         * display_name, the current user's visible identity
         * should still use the Auth username.
         */

        if (currentUserId && currentUsername) {

            const currentStudentIndex =
                allStudents.findIndex(
                    student =>
                        student.id === currentUserId
                );


            if (currentStudentIndex !== -1) {

                allStudents[
                    currentStudentIndex
                ].username =
                    currentUsername;

            }

        }


        updateTopThree(
            allStudents
        );


        updateYourRanking(
            allStudents
        );


        renderLeaderboard(
            allStudents
        );


        console.log(
            "StudyMind leaderboard loaded:",
            allStudents
        );


    } catch (error) {

        console.error(
            "Leaderboard error:",
            error
        );


        if (body) {

            body.innerHTML = `
                <tr>
                    <td colspan="7" class="loading">
                        Unable to load the leaderboard.
                    </td>
                </tr>
            `;

        }


        showToast(
            "Could not load leaderboard."
        );

    }

}


/* =========================================================
   TOP THREE
========================================================= */

function updateTopThree(students) {

    setPodium(
        students[0],
        "firstName",
        "firstPoints",
        "firstAvatar"
    );


    setPodium(
        students[1],
        "secondName",
        "secondPoints",
        "secondAvatar"
    );


    setPodium(
        students[2],
        "thirdName",
        "thirdPoints",
        "thirdAvatar"
    );

}


/* =========================================================
   PODIUM
========================================================= */

function setPodium(
    student,
    nameId,
    pointsId,
    avatarId
) {

    if (!student) {

        if ($(nameId)) {

            $(nameId).textContent =
                "—";

        }


        if ($(pointsId)) {

            $(pointsId).textContent =
                "0";

        }


        if ($(avatarId)) {

            $(avatarId).textContent =
                "?";

        }


        return;

    }


    const username =
        student.username ||
        "Student";


    if ($(nameId)) {

        $(nameId).textContent =
            username;

    }


    if ($(pointsId)) {

        $(pointsId).textContent =
            formatNumber(
                student.battle_points
            );

    }


    if ($(avatarId)) {

        $(avatarId).textContent =
            getInitials(
                username
            );

    }

}


/* =========================================================
   RENDER TABLE
========================================================= */

function renderLeaderboard(students) {

    const body =
        $("leaderboardBody");


    if (!body) return;


    const query =
        $("searchInput")
            ?.value
            ?.trim()
            ?.toLowerCase() ||
        "";


    const filtered =
        students.filter(
            student => {

                const username =
                    String(
                        student.username || ""
                    ).toLowerCase();


                return username.includes(
                    query
                );

            }
        );


    if ($("studentCount")) {

        $("studentCount").textContent =
            `${filtered.length} ${
                filtered.length === 1
                    ? "student"
                    : "students"
            }`;

    }


    if (!filtered.length) {

        body.innerHTML = "";


        $("emptyState")
            ?.classList
            .remove("hidden");


        return;

    }


    $("emptyState")
        ?.classList
        .add("hidden");


    body.innerHTML =
        filtered
            .map(
                student => {

                    /*
                     * Rank is based on the complete
                     * leaderboard, not search results.
                     */

                    const actualRank =
                        students.indexOf(
                            student
                        ) + 1;


                    const username =
                        student.username ||
                        "Student";


                    const current =
                        student.id === currentUserId
                            ? "current-user"
                            : "";


                    let rankDisplay =
                        `<span class="rank-number">
                            #${actualRank}
                        </span>`;


                    if (actualRank === 1) {

                        rankDisplay =
                            `<span class="rank-medal">
                                🥇
                            </span>`;

                    }


                    if (actualRank === 2) {

                        rankDisplay =
                            `<span class="rank-medal">
                                🥈
                            </span>`;

                    }


                    if (actualRank === 3) {

                        rankDisplay =
                            `<span class="rank-medal">
                                🥉
                            </span>`;

                    }


                    return `
                        <tr class="${current}">

                            <td>
                                ${rankDisplay}
                            </td>

                            <td>
                                <div class="student-cell">

                                    <div class="student-small-avatar">
                                        ${escapeHTML(
                                            getInitials(
                                                username
                                            )
                                        )}
                                    </div>

                                    <span class="student-name">
                                        ${escapeHTML(
                                            username
                                        )}
                                    </span>

                                </div>
                            </td>

                            <td class="points-cell">
                                ${formatNumber(
                                    student.battle_points
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    student.wins
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    student.losses
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    student.draws
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    student.battles_played
                                )}
                            </td>

                        </tr>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   CURRENT USER RANK
========================================================= */

function updateYourRanking(students) {

    if (!currentUserId) {

        if ($("yourRank")) {

            $("yourRank").textContent =
                "Unranked";

        }

        return;

    }


    const index =
        students.findIndex(
            student =>
                student.id === currentUserId
        );


    if (index === -1) {

        if ($("yourRank")) {

            $("yourRank").textContent =
                "Unranked";

        }


        if ($("yourPoints")) {

            $("yourPoints").textContent =
                "0";

        }


        if ($("yourWins")) {

            $("yourWins").textContent =
                "0";

        }


        return;

    }


    const student =
        students[index];


    if ($("yourRank")) {

        $("yourRank").textContent =
            `#${index + 1}`;

    }


    if ($("yourPoints")) {

        $("yourPoints").textContent =
            formatNumber(
                student.battle_points
            );

    }


    if ($("yourWins")) {

        $("yourWins").textContent =
            formatNumber(
                student.wins
            );

    }

}


/* =========================================================
   SEARCH
========================================================= */

function setupSearch() {

    const searchInput =
        $("searchInput");


    if (!searchInput) return;


    searchInput.addEventListener(
        "input",
        () => {

            renderLeaderboard(
                allStudents
            );

        }
    );

}


/* =========================================================
   REFRESH
========================================================= */

function setupRefresh() {

    const button =
        $("refreshButton");


    if (!button) return;


    button.addEventListener(
        "click",
        async () => {

            button.disabled =
                true;


            button.textContent =
                "↻ Loading...";


            await loadCurrentUser();

            await loadLeaderboard();


            button.disabled =
                false;


            button.textContent =
                "↻ Refresh";

        }
    );

}


/* =========================================================
   THEME
========================================================= */

function loadTheme() {

    const saved =
        localStorage.getItem(
            "studyMindTheme"
        );


    if (saved === "dark") {

        document.body.classList.add(
            "dark"
        );

    }

}


function setupTheme() {

    const button =
        $("themeButton");


    if (!button) return;


    button.addEventListener(
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


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    const button =
        $("logoutButton");


    if (!button) return;


    button.addEventListener(
        "click",
        async () => {

            try {

                if (leaderboardSupabase) {

                    await leaderboardSupabase
                        .auth
                        .signOut();

                }

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }


            window.location.href =
                "index.html";

        }
    );

}


/* =========================================================
   HELPERS
========================================================= */

function formatNumber(value) {

    const number =
        Number(value || 0);


    return number.toLocaleString();

}


function getInitials(name) {

    const words =
        String(
            name || "Student"
        )
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (!words.length) {

        return "S";

    }


    if (words.length === 1) {

        return words[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        words[0][0] +
        words[words.length - 1][0]
    ).toUpperCase();

}


function escapeHTML(value) {

    return String(value)

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


function showToast(message) {

    const toast =
        $("toast");


    if (!toast) return;


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );

        },
        2500
    );

}


function showError(message) {

    const body =
        $("leaderboardBody");


    if (!body) return;


    body.innerHTML = `
        <tr>
            <td colspan="7" class="loading">
                ${escapeHTML(message)}
            </td>
        </tr>
    `;

}

