"use strict";

/* =========================================================
   STUDYMIND AI — LEADERBOARD
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
    "https://bicnrbqqvucgpbwudmit.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_70y0MPr3j-FimUSQK_HuA_Ng1a1qcB";

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

    if (!supabaseClient) return;

    try {

        const {
            data: {
                user
            }
        } = await supabaseClient.auth.getUser();

        if (!user) return;

        currentUserId = user.id;

        const username =
            user.user_metadata?.username ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "Student";

        $("currentUsername").textContent = username;

        $("userAvatar").textContent =
            getInitials(username);

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

    const body = $("leaderboardBody");

    body.innerHTML = `
        <tr>
            <td colspan="7" class="loading">
                Loading leaderboard...
            </td>
        </tr>
    `;

    if (!supabaseClient) {

        showError(
            "Supabase could not be initialized."
        );

        return;
    }


    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("profiles")
            .select(`
                id,
                username,
                battle_points,
                wins,
                losses,
                draws,
                battles_played
            `)
            .order("battle_points", {
                ascending: false
            })
            .order("wins", {
                ascending: false
            })
            .order("username", {
                ascending: true
            });


        if (error) {
            throw error;
        }


        allStudents = Array.isArray(data)
            ? data
            : [];


        updateTopThree(allStudents);

        updateYourRanking(allStudents);

        renderLeaderboard(allStudents);


    } catch (error) {

        console.error(
            "Leaderboard error:",
            error
        );

        body.innerHTML = `
            <tr>
                <td colspan="7" class="loading">
                    Unable to load the leaderboard.
                </td>
            </tr>
        `;

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


function setPodium(
    student,
    nameId,
    pointsId,
    avatarId
) {

    if (!student) {

        $(nameId).textContent = "—";

        $(pointsId).textContent = "0";

        $(avatarId).textContent = "?";

        return;
    }

    const username =
        student.username ||
        "Student";

    $(nameId).textContent =
        username;

    $(pointsId).textContent =
        formatNumber(student.battle_points);

    $(avatarId).textContent =
        getInitials(username);
}


/* =========================================================
   RENDER TABLE
========================================================= */

function renderLeaderboard(students) {

    const body = $("leaderboardBody");

    const query =
        $("searchInput").value
            .trim()
            .toLowerCase();


    const filtered = students.filter(student => {

        const username =
            String(
                student.username || ""
            ).toLowerCase();

        return username.includes(query);

    });


    $("studentCount").textContent =
        `${filtered.length} ${
            filtered.length === 1
                ? "student"
                : "students"
        }`;


    if (!filtered.length) {

        body.innerHTML = "";

        $("emptyState").classList.remove(
            "hidden"
        );

        return;
    }


    $("emptyState").classList.add(
        "hidden"
    );


    body.innerHTML =
        filtered
            .map((student) => {

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
                        `<span class="rank-medal">🥇</span>`;
                }

                if (actualRank === 2) {
                    rankDisplay =
                        `<span class="rank-medal">🥈</span>`;
                }

                if (actualRank === 3) {
                    rankDisplay =
                        `<span class="rank-medal">🥉</span>`;
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
                                        getInitials(username)
                                    )}
                                </div>

                                <span class="student-name">
                                    ${escapeHTML(username)}
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

    if (!currentUserId) return;

    const index =
        students.findIndex(
            student =>
                student.id === currentUserId
        );


    if (index === -1) {

        $("yourRank").textContent =
            "Unranked";

        $("yourPoints").textContent =
            "0";

        $("yourWins").textContent =
            "0";

        return;
    }


    const student =
        students[index];


    $("yourRank").textContent =
        `#${index + 1}`;

    $("yourPoints").textContent =
        formatNumber(
            student.battle_points
        );

    $("yourWins").textContent =
        formatNumber(
            student.wins
        );
}


/* =========================================================
   SEARCH
========================================================= */

function setupSearch() {

    $("searchInput")
        .addEventListener(
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

    $("refreshButton")
        .addEventListener(
            "click",
            async () => {

                const button =
                    $("refreshButton");

                button.disabled = true;

                button.textContent =
                    "↻ Loading...";

                await loadLeaderboard();

                button.disabled = false;

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

    $("themeButton")
        .addEventListener(
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

    $("logoutButton")
        .addEventListener(
            "click",
            async () => {

                if (supabaseClient) {
                    await supabaseClient.auth.signOut();
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
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function showToast(message) {

    const toast =
        $("toast");

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

    $("leaderboardBody").innerHTML = `
        <tr>
            <td colspan="7" class="loading">
                ${escapeHTML(message)}
            </td>
        </tr>
    `;
}

