"use strict";

/* =========================================================
   STUDYMIND AI — LEADERBOARD
   CONNECTED TO GAME_LEADERBOARD
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
    "https://bicnrbqqvucgpbwudmit.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_70y0MPr30-FimUSQK_HuA_Ng1a1qcB";


/* =========================================================
   TEMPORARY DEBUG
========================================================= */

console.log(
    "STUDYMIND LEADERBOARD VERSION: 2026-09-14-FIX-1"
);

console.log(
    "SUPABASE URL:",
    SUPABASE_URL
);

console.log(
    "SUPABASE KEY PREFIX:",
    SUPABASE_KEY.substring(0, 25)
);


/* =========================================================
   SUPABASE CLIENT
========================================================= */

const supabaseClient =
    window.supabase?.createClient
        ? window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        )
        : null;




/* =========================================================
   STATE
========================================================= */

let allStudents = [];
let currentUserId = null;


/* =========================================================
   DOM HELPER
========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    loadTheme();

    setupTheme();

    setupSearch();

    setupRefresh();

    setupLogout();

    await loadCurrentUser();

    await loadLeaderboard();

});


/* =========================================================
   CURRENT USER
========================================================= */

async function loadCurrentUser() {

    if (!supabaseClient) {

        console.error(
            "Supabase client could not be initialized."
        );

        return;
    }


    try {

        const {
            data,
            error
        } = await supabaseClient.auth.getUser();


        if (error) {
            throw error;
        }


        const user =
            data?.user;


        if (!user) {

            console.warn(
                "No authenticated StudyMind user found."
            );

            return;
        }


        currentUserId =
            user.id;


        const metadata =
            user.user_metadata || {};


        const username =
            metadata.username ||
            metadata.full_name ||
            metadata.name ||
            metadata.display_name ||
            user.email?.split("@")[0] ||
            "Student";


        if ($("currentUsername")) {

            $("currentUsername").textContent =
                username;

        }


        if ($("userAvatar")) {

            $("userAvatar").textContent =
                getInitials(username);

        }


    } catch (error) {

        console.error(
            "Could not load current user:",
            error
        );

    }

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


    if (!supabaseClient) {

        showError(
            "Supabase could not be initialized."
        );

        return;
    }


    try {

        /*
         * IMPORTANT:
         * The leaderboard is stored in game_leaderboard.
         *
         * We deliberately do NOT query profiles here.
         */

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
                draws
            `)
            .order("battle_points", {
                ascending: false
            })
            .order("wins", {
                ascending: false
            })
            .order("display_name", {
                ascending: true
            });


        if (error) {
            throw error;
        }


        /*
         * Convert the database structure into the structure
         * already expected by the leaderboard UI.
         */

        allStudents =
            Array.isArray(data)
                ? data.map(student => ({
                    id: student.user_id,

                    username:
                        student.display_name ||
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
                }))
                : [];


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
            $(nameId).textContent = "—";
        }

        if ($(pointsId)) {
            $(pointsId).textContent = "0";
        }

        if ($(avatarId)) {
            $(avatarId).textContent = "?";
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
            getInitials(username);

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
        students.filter(student => {

            const username =
                String(
                    student.username || ""
                ).toLowerCase();


            return username.includes(
                query
            );

        });


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
            .map(student => {

                /*
                 * Rank is based on the FULL leaderboard,
                 * not the filtered search results.
                 */

                const actualRank =
                    students.indexOf(student) + 1;


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

            })
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

                if (supabaseClient) {

                    await supabaseClient.auth.signOut();

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
        String(name || "Student")
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


    setTimeout(() => {

        toast.classList.remove(
            "show"
        );

    }, 2500);

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

