"use strict";

/* =========================================================
   STUDYMIND AI — SETTINGS
========================================================= */

const SETTINGS = {

    NAME:
        "studyMindUsername",

    THEME:
        "studyMindTheme",

    TIMER:
        "studyMindDefaultTimer",

    DIFFICULTY:
        "studyMindDifficulty",

    SMART_PLANNING:
        "studyMindSmartPlanning",

    NOTIFICATIONS:
        "studyMindNotifications",

    AI_STYLE:
        "studyMindAIStyle",

    SUGGESTIONS:
        "studyMindSuggestions"
};

/* =========================================================
   HELPERS
========================================================= */

function settingsClient() {

    return (
        window.supabaseClient ||
        window.studyMindSupabase ||
        null
    );
}

function getCanonicalUsername() {

    return (
        localStorage.getItem(
            SETTINGS.NAME
        ) ||
        "Student"
    );
}

function setCanonicalUsername(
    username
) {

    username =
        String(username || "")
            .trim();

    if (!username) {
        username = "Student";
    }

    localStorage.setItem(
        SETTINGS.NAME,
        username
    );

    document
        .querySelectorAll(
            "#usernameDisplay, #username, #userName"
        )
        .forEach(element => {
            element.textContent =
                username;
        });

    document
        .querySelectorAll(
            "#userAvatar, #avatar"
        )
        .forEach(element => {
            element.textContent =
                username
                    .charAt(0)
                    .toUpperCase();
        });

    return username;
}

/* =========================================================
   LOAD USER
========================================================= */

async function loadSettingsUser() {

    let username =
        localStorage.getItem(
            SETTINGS.NAME
        );

    try {

        const client =
            settingsClient();

        if (client) {

            const {
                data
            } =
                await client.auth.getUser();

            const user =
                data?.user;

            const metadata =
                user?.user_metadata ||
                {};

            /*
             * Username is deliberately FIRST.
             */
            username =
                metadata.username ||
                username ||
                metadata.display_name ||
                metadata.name ||
                (
                    user?.email
                        ? user.email
                            .split("@")[0]
                        : ""
                ) ||
                "Student";
        }

    } catch (error) {

        console.warn(
            "StudyMind settings user load failed:",
            error
        );
    }

    setCanonicalUsername(
        username
    );
}

/* =========================================================
   PROFILE
========================================================= */

function setupProfile() {

    const input =
        document.getElementById(
            "displayName"
        );

    const saveButton =
        document.getElementById(
            "saveProfile"
        );

    if (!input || !saveButton) {
        return;
    }

    input.value =
        getCanonicalUsername();

    saveButton.addEventListener(
        "click",
        async () => {

            const username =
                input.value.trim();

            if (
                username.length < 3
            ) {

                showSettingsToast(
                    "Username must be at least 3 characters."
                );

                return;
            }

            if (
                username.length > 30
            ) {

                showSettingsToast(
                    "Username must be 30 characters or fewer."
                );

                return;
            }

            /*
             * Local canonical value.
             */
            setCanonicalUsername(
                username
            );

            /*
             * Persist to Supabase metadata
             * when authenticated.
             */
            try {

                const client =
                    settingsClient();

                if (client) {

                    const {
                        error
                    } =
                        await client.auth.updateUser({
                            data: {
                                username,
                                name: username,
                                display_name:
                                    username
                            }
                        });

                    if (error) {
                        throw error;
                    }
                }

                showSettingsToast(
                    "Username saved successfully."
                );

                window.dispatchEvent(
                    new CustomEvent(
                        "studyMindUsernameChanged",
                        {
                            detail: {
                                username
                            }
                        }
                    )
                );

            } catch (error) {

                console.error(
                    error
                );

                showSettingsToast(
                    "Username saved locally, but could not be synced to your account."
                );
            }
        }
    );
}

/* =========================================================
   THEME
========================================================= */

function loadTheme() {

    const theme =
        localStorage.getItem(
            SETTINGS.THEME
        ) || "dark";

    document.documentElement
        .setAttribute(
            "data-theme",
            theme
        );
}

function setupTheme() {

    document
        .querySelectorAll(
            "[data-theme]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const theme =
                        button.dataset.theme;

                    if (!theme) return;

                    localStorage.setItem(
                        SETTINGS.THEME,
                        theme
                    );

                    document.documentElement
                        .setAttribute(
                            "data-theme",
                            theme
                        );
                }
            );
        });
}

/* =========================================================
   TOAST
========================================================= */

function showSettingsToast(
    message
) {

    const toast =
        document.getElementById(
            "settingsToast"
        ) ||
        document.getElementById(
            "toast"
        );

    if (!toast) {
        return;
    }

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

/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    document
        .querySelectorAll(
            "#logout, [data-logout]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async event => {

                    event.preventDefault();

                    try {

                        const client =
                            settingsClient();

                        if (client) {
                            await client.auth.signOut();
                        }

                    } catch (error) {
                        console.warn(
                            error
                        );
                    }

                    window.location.href =
                        "home.html";
                }
            );
        });
}

/* =========================================================
   RESET STUDY DATA
   IMPORTANT:
   USERNAME + PREMIUM ARE PRESERVED.
========================================================= */

function resetStudyData() {

    const confirmed =
        window.confirm(
            "This will reset your study progress. Your username and Premium status will remain. Continue?"
        );

    if (!confirmed) {
        return;
    }

    const username =
        localStorage.getItem(
            SETTINGS.NAME
        );

    const premium =
        localStorage.getItem(
            "studyMindPremium"
        );

    Object.keys(localStorage)
        .filter(
            key =>
                key.startsWith(
                    "studyMind"
                )
        )
        .forEach(key => {

            if (
                key !==
                    SETTINGS.NAME &&
                key !==
                    "studyMindPremium"
            ) {
                localStorage.removeItem(
                    key
                );
            }
        });

    localStorage.setItem(
        SETTINGS.NAME,
        username || "Student"
    );

    if (premium !== null) {

        localStorage.setItem(
            "studyMindPremium",
            premium
        );
    }

    /*
     * Explicit zero-state.
     */
    localStorage.setItem(
        "studyMindXP",
        "0"
    );

    localStorage.setItem(
        "studyMindTotalXP",
        "0"
    );

    localStorage.setItem(
        "studyMindStreak",
        "0"
    );

    localStorage.setItem(
        "studyMindStudyScore",
        "0"
    );

    window.dispatchEvent(
        new CustomEvent(
            "studyMindProgressUpdated"
        )
    );

    showSettingsToast(
        "Study progress reset."
    );

    setTimeout(
        () => {
            window.location.reload();
        },
        800
    );
}

/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadTheme();
        loadSettingsUser();
        setupProfile();
        setupTheme();
        setupLogout();

        const reset =
            document.getElementById(
                "resetStudyData"
            );

        if (reset) {
            reset.addEventListener(
                "click",
                resetStudyData
            );
        }
    }
);

/* =========================================================
   PUBLIC
========================================================= */

window.StudyMindSettings = {

    getUsername:
        getCanonicalUsername,

    setUsername:
        setCanonicalUsername,

    resetStudyData
};
