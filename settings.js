/* =========================================================
   STUDYMIND AI — SETTINGS
========================================================= */

"use strict";


/* =========================================================
   STORAGE
========================================================= */

const SETTINGS = {

    NAME: "studyMindUsername",

    THEME: "studyMindTheme",

    TIMER: "studyMindSelectedTimerSeconds",

    DIFFICULTY: "studyMindDifficulty",

    SMART_PLANNING: "studyMindSmartPlanning",

    STREAK_NOTIFICATIONS: "studyMindStreakNotifications",

    REWARD_NOTIFICATIONS: "studyMindRewardNotifications",

    STUDY_NOTIFICATIONS: "studyMindStudyNotifications",

    AI_STYLE: "studyMindAIStyle",

    AI_SUGGESTIONS: "studyMindAISuggestions"

};


/* =========================================================
   HELPERS
========================================================= */

function $(id) {
    return document.getElementById(id);
}


function getJSON(key, fallback = null) {

    try {

        const value = localStorage.getItem(key);

        if (!value) return fallback;

        return JSON.parse(value);

    } catch {

        return fallback;

    }

}


function setJSON(key, value) {

    localStorage.setItem(
        key,
        JSON.stringify(value)
    );

}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeSettings
);


function initializeSettings() {

    loadTheme();

    loadUser();

    loadSettings();

    setupNavigation();

    setupTheme();

    setupProfile();

    setupStudySettings();

    setupNotifications();

    setupAI();

    setupReset();

    setupMobileMenu();

}


/* =========================================================
   THEME
========================================================= */

function loadTheme() {

    const theme =
        localStorage.getItem(SETTINGS.THEME)
        || "system";

    applyTheme(theme);

    const select = $("themeSelect");

    if (select) {
        select.value = theme;
    }

}


function applyTheme(theme) {

    let dark = false;

    if (theme === "dark") {

        dark = true;

    } else if (theme === "system") {

        dark =
            window.matchMedia &&
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches;

    }

    document.body.classList.toggle(
        "dark",
        dark
    );

    const text = $("themeText");

    if (text) {

        text.textContent =
            dark
                ? "Light mode"
                : "Dark mode";

    }

}


function setupTheme() {

    $("themeSelect")?.addEventListener(
        "change",
        event => {

            const theme =
                event.target.value;

            localStorage.setItem(
                SETTINGS.THEME,
                theme
            );

            applyTheme(theme);

            showToast(
                "Appearance updated"
            );

        }
    );


    $("themeToggle")?.addEventListener(
        "click",
        () => {

            const current =
                document.body.classList.contains(
                    "dark"
                );

            const next =
                current
                    ? "light"
                    : "dark";

            localStorage.setItem(
                SETTINGS.THEME,
                next
            );

            applyTheme(next);

            const select = $("themeSelect");

            if (select) {
                select.value = next;
            }

        }
    );


    window
        .matchMedia?.(
            "(prefers-color-scheme: dark)"
        )
        .addEventListener(
            "change",
            () => {

                const theme =
                    localStorage.getItem(
                        SETTINGS.THEME
                    );

                if (theme === "system") {
                    applyTheme("system");
                }

            }
        );

}


/* =========================================================
   USER
========================================================= */

async function loadUser() {

    let name =
        localStorage.getItem(
            SETTINGS.NAME
        )
        || "Student";

    let email = "";


    try {

        if (
            window.supabaseClient &&
            typeof window.supabaseClient.auth
                ?.getUser === "function"
        ) {

            const { data } =
                await window.supabaseClient.auth.getUser();

            const user = data?.user;

            if (user) {

                email =
                    user.email || "";

                name =
                    user.user_metadata?.full_name
                    || user.user_metadata?.name
                    || user.user_metadata?.username
                    || user.email?.split("@")[0]
                    || name;

            }

        }

    } catch (error) {

        console.warn(
            "Could not load user:",
            error
        );

    }


    name = String(name).trim() || "Student";

    localStorage.setItem(
        SETTINGS.NAME,
        name
    );


    updateUserUI(
        name,
        email
    );

}


function updateUserUI(name, email) {

    const initial =
        name.charAt(0).toUpperCase();


    if ($("usernameDisplay")) {
        $("usernameDisplay").textContent =
            name;
    }


    if ($("profileName")) {
        $("profileName").textContent =
            name;
    }


    if ($("displayName")) {
        $("displayName").value =
            name;
    }


    if ($("userAvatar")) {
        $("userAvatar").textContent =
            initial;
    }


    if ($("largeAvatar")) {
        $("largeAvatar").textContent =
            initial;
    }


    if ($("profileEmail")) {

        $("profileEmail").textContent =
            email ||
            "StudyMind account";

    }

}


/* =========================================================
   PREMIUM
========================================================= */

function loadPremiumStatus() {

    const premium =
        localStorage.getItem(
            "studyMindPremium"
        ) === "true";


    const badge =
        $("premiumBadge");

    const accountStatus =
        $("accountStatus");


    if (premium) {

        if (badge) {
            badge.textContent =
                "PREMIUM";
        }

        if (accountStatus) {
            accountStatus.textContent =
                "Premium";
        }

    } else {

        if (badge) {
            badge.textContent =
                "FREE PLAN";
        }

        if (accountStatus) {
            accountStatus.textContent =
                "Free";
        }

    }

}


/* =========================================================
   LOAD SETTINGS
========================================================= */

function loadSettings() {

    const timer =
        Number(
            localStorage.getItem(
                SETTINGS.TIMER
            )
        );


    if (
        Number.isFinite(timer) &&
        timer > 0
    ) {

        if ($("timerSelect")) {
            $("timerSelect").value =
                String(timer);
        }

    }


    if ($("difficultySelect")) {

        $("difficultySelect").value =
            localStorage.getItem(
                SETTINGS.DIFFICULTY
            ) || "balanced";

    }


    if ($("smartPlanning")) {

        $("smartPlanning").checked =
            localStorage.getItem(
                SETTINGS.SMART_PLANNING
            ) !== "false";

    }


    if ($("streakNotifications")) {

        $("streakNotifications").checked =
            localStorage.getItem(
                SETTINGS.STREAK_NOTIFICATIONS
            ) !== "false";

    }


    if ($("rewardNotifications")) {

        $("rewardNotifications").checked =
            localStorage.getItem(
                SETTINGS.REWARD_NOTIFICATIONS
            ) !== "false";

    }


    if ($("studyNotifications")) {

        $("studyNotifications").checked =
            localStorage.getItem(
                SETTINGS.STUDY_NOTIFICATIONS
            ) !== "false";

    }


    if ($("aiStyle")) {

        $("aiStyle").value =
            localStorage.getItem(
                SETTINGS.AI_STYLE
            ) || "balanced";

    }


    if ($("aiSuggestions")) {

        $("aiSuggestions").checked =
            localStorage.getItem(
                SETTINGS.AI_SUGGESTIONS
            ) !== "false";

    }


    loadPremiumStatus();

}


/* =========================================================
   SETTINGS NAVIGATION
========================================================= */

function setupNavigation() {

    const buttons =
        document.querySelectorAll(
            ".settings-nav-item"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const section =
                    button.dataset.section;


                buttons.forEach(item =>
                    item.classList.remove(
                        "active"
                    )
                );


                button.classList.add(
                    "active"
                );


                document
                    .querySelectorAll(
                        ".settings-section"
                    )
                    .forEach(panel => {

                        panel.classList.remove(
                            "active"
                        );

                    });


                const target =
                    $(
                        `section-${section}`
                    );

                if (target) {
                    target.classList.add(
                        "active"
                    );
                }

            }
        );

    });

}


/* =========================================================
   PROFILE
========================================================= */

function setupProfile() {

    $("saveProfile")
        ?.addEventListener(
            "click",
            () => {

                const input =
                    $("displayName");

                const name =
                    input?.value
                        ?.trim();

                if (!name) {

                    showToast(
                        "Please enter a name"
                    );

                    return;

                }


                localStorage.setItem(
                    SETTINGS.NAME,
                    name
                );


                const current =
                    $("profileEmail")
                        ?.textContent
                        || "";


                updateUserUI(
                    name,
                    current.includes("@")
                        ? current
                        : ""
                );


                showToast(
                    "Profile saved"
                );

            }
        );

}


/* =========================================================
   STUDY SETTINGS
========================================================= */

function setupStudySettings() {

    $("saveStudy")
        ?.addEventListener(
            "click",
            () => {

                const timer =
                    $("timerSelect")
                        ?.value
                        || "1500";


                const difficulty =
                    $("difficultySelect")
                        ?.value
                        || "balanced";


                const smart =
                    $("smartPlanning")
                        ?.checked;


                localStorage.setItem(
                    SETTINGS.TIMER,
                    timer
                );


                localStorage.setItem(
                    SETTINGS.DIFFICULTY,
                    difficulty
                );


                localStorage.setItem(
                    SETTINGS.SMART_PLANNING,
                    smart
                        ? "true"
                        : "false"
                );


                showToast(
                    "Study preferences saved"
                );

            }
        );

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

function setupNotifications() {

    $("saveNotifications")
        ?.addEventListener(
            "click",
            () => {

                localStorage.setItem(
                    SETTINGS.STREAK_NOTIFICATIONS,
                    $("streakNotifications")
                        ?.checked
                        ? "true"
                        : "false"
                );


                localStorage.setItem(
                    SETTINGS.REWARD_NOTIFICATIONS,
                    $("rewardNotifications")
                        ?.checked
                        ? "true"
                        : "false"
                );


                localStorage.setItem(
                    SETTINGS.STUDY_NOTIFICATIONS,
                    $("studyNotifications")
                        ?.checked
                        ? "true"
                        : "false"
                );


                showToast(
                    "Notification settings saved"
                );

            }
        );

}


/* =========================================================
   AI SETTINGS
========================================================= */

function setupAI() {

    $("saveAI")
        ?.addEventListener(
            "click",
            () => {

                const style =
                    $("aiStyle")
                        ?.value
                        || "balanced";


                const suggestions =
                    $("aiSuggestions")
                        ?.checked;


                localStorage.setItem(
                    SETTINGS.AI_STYLE,
                    style
                );


                localStorage.setItem(
                    SETTINGS.AI_SUGGESTIONS,
                    suggestions
                        ? "true"
                        : "false"
                );


                showToast(
                    "AI preferences saved"
                );

            }
        );

}


/* =========================================================
   RESET DATA
========================================================= */

function setupReset() {

    $("resetData")
        ?.addEventListener(
            "click",
            () => {

                $("resetModal")
                    ?.classList
                    .add("show");

            }
        );


    $("cancelReset")
        ?.addEventListener(
            "click",
            closeReset
        );


    $("confirmReset")
        ?.addEventListener(
            "click",
            resetStudyData
        );


    $("resetModal")
        ?.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    $("resetModal")
                ) {

                    closeReset();

                }

            }
        );

}


function closeReset() {

    $("resetModal")
        ?.classList
        .remove("show");

}


function resetStudyData() {

    /*
       Keep authentication-related data
       and only clear StudyMind data.
    */

    const keepKeys = new Set([
        "studyMindPremium",
        SETTINGS.NAME
    ]);


    const keysToRemove = [];

    for (
        let i = 0;
        i < localStorage.length;
        i++
    ) {

        const key =
            localStorage.key(i);

        if (!key) continue;


        if (
            key.startsWith("studyMind") &&
            !keepKeys.has(key)
        ) {

            keysToRemove.push(key);

        }

    }


    keysToRemove.forEach(
        key =>
            localStorage.removeItem(key)
    );


    closeReset();

    showToast(
        "Study data has been reset"
    );


    setTimeout(
        () => {

            window.location.href =
                "dashboard.html";

        },
        900
    );

}


/* =========================================================
   LOGOUT
========================================================= */

$("logoutButton")
    ?.addEventListener(
        "click",
        logout
    );


async function logout() {

    try {

        if (
            window.supabaseClient &&
            typeof window.supabaseClient.auth
                ?.signOut === "function"
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


/* =========================================================
   MOBILE MENU
========================================================= */

function setupMobileMenu() {

    $("mobileMenu")
        ?.addEventListener(
            "click",
            () => {

                $("sidebar")
                    ?.classList
                    .toggle("open");

            }
        );

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;


function showToast(message) {

    const toast =
        $("toast");

    const text =
        $("toastMessage");


    if (!toast) return;


    if (text) {
        text.textContent =
            message;
    }


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2500
        );

}


/* =========================================================
   INITIAL PREMIUM CHECK
========================================================= */

loadPremiumStatus();

