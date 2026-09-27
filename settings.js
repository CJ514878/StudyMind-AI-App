"use strict";

/* =========================================================
   STUDYMIND AI — SETTINGS
   USERNAME = SUPABASE SOURCE OF TRUTH
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


/* =========================================================
   GET CANONICAL USERNAME
   ========================================================= */

function getCanonicalUsername() {

    return (
        localStorage.getItem(
            SETTINGS.NAME
        ) ||
        "Student"
    );

}


/* =========================================================
   SET CANONICAL USERNAME
   ========================================================= */

function setCanonicalUsername(
    username
) {

    username =
        String(username || "")
            .trim();

    if (!username) {
        username = "Student";
    }


    /* -------------------------------------------------------
       LOCAL STORAGE
    ------------------------------------------------------- */

    localStorage.setItem(
        SETTINGS.NAME,
        username
    );


    /* -------------------------------------------------------
       UPDATE CURRENT PAGE
    ------------------------------------------------------- */

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
   SYNC LEADERBOARD USERNAME
   ---------------------------------------------------------
   Updates the authenticated user's existing
   game_leaderboard row.

   IMPORTANT:
   game_leaderboard.user_id must contain the
   Supabase Auth user's UUID.
   ========================================================= */

async function syncLeaderboardUsername(
    username,
    user
) {

    const client =
        settingsClient();


    if (!client || !user) {

        return {
            success: false,
            reason:
                "No Supabase client or authenticated user."
        };

    }


    username =
        String(username || "")
            .trim();


    if (!username) {

        return {
            success: false,
            reason:
                "Username is empty."
        };

    }


    try {

        const {
            data,
            error
        } =
            await client
                .from(
                    "game_leaderboard"
                )
                .update({
                    display_name:
                        username
                })
                .eq(
                    "user_id",
                    user.id
                )
                .select();


        if (error) {
            throw error;
        }


        console.log(
            "StudyMind: leaderboard username synchronized.",
            {
                userId:
                    user.id,

                username,

                rowsUpdated:
                    Array.isArray(data)
                        ? data.length
                        : 0
            }
        );


        return {

            success: true,

            data

        };

    }

    catch (error) {

        /*
         * This does NOT undo the Auth username change.
         *
         * If the leaderboard row does not exist yet,
         * Game Mode will use the new username when it
         * creates/updates the player's result.
         */

        console.warn(
            "StudyMind: could not synchronize leaderboard username:",
            error
        );


        return {

            success: false,

            error

        };

    }

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
                data,
                error
            } =
                await client.auth.getUser();


            if (error) {
                throw error;
            }


            const user =
                data?.user ||
                null;


            const metadata =
                user?.user_metadata ||
                {};


            /*
             * SUPABASE AUTH IS THE SOURCE OF TRUTH.
             *
             * Priority:
             *
             * username
             * display_name
             * name
             * full_name
             * localStorage
             * email prefix
             */

            username =
                metadata.username ||
                metadata.display_name ||
                metadata.name ||
                metadata.full_name ||
                username ||
                (
                    user?.email
                        ? user.email
                            .split("@")[0]
                        : ""
                ) ||
                "Student";


            username =
                String(username)
                    .trim() ||
                "Student";


            /*
             * Keep local cache synchronized.
             */

            localStorage.setItem(
                SETTINGS.NAME,
                username
            );

        }

    }

    catch (error) {

        console.warn(
            "StudyMind settings user load failed:",
            error
        );

    }


    /*
     * Update the current Settings page.
     */

    setCanonicalUsername(
        username
    );


    return username;

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


            /* ------------------------------------------------
               VALIDATION
            ------------------------------------------------ */

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
             * Prevent double-clicks.
             */

            saveButton.disabled =
                true;


            let authSaved =
                false;

            let leaderboardSaved =
                false;


            try {

                const client =
                    settingsClient();


                let user =
                    null;


                /* ==========================================
                   SUPABASE AUTH
                   ========================================== */

                if (client) {

                    const {
                        data,
                        error
                    } =
                        await client.auth.getUser();


                    if (error) {
                        throw error;
                    }


                    user =
                        data?.user ||
                        null;


                    if (user) {

                        /*
                         * Save ALL common username fields.
                         *
                         * username = canonical field
                         * display_name/name/full_name =
                         * compatibility with existing code.
                         */

                        const {
                            data:
                                updateData,
                            error:
                                updateError
                        } =
                            await client.auth.updateUser({

                                data: {

                                    username,

                                    name:
                                        username,

                                    display_name:
                                        username,

                                    full_name:
                                        username

                                }

                            });


                        if (updateError) {
                            throw updateError;
                        }


                        authSaved =
                            true;


                        /*
                         * Use the returned user when available.
                         */

                        user =
                            updateData?.user ||
                            user;


                        /* ==================================
                           LEADERBOARD
                           ================================== */

                        const leaderboardResult =
                            await syncLeaderboardUsername(
                                username,
                                user
                            );


                        leaderboardSaved =
                            leaderboardResult.success;

                    }

                }


                /* ==========================================
                   LOCAL CANONICAL USERNAME
                   ========================================== */

                setCanonicalUsername(
                    username
                );


                input.value =
                    username;


                /* ==========================================
                   SAME-PAGE USERNAME EVENT
                   ========================================== */

                window.dispatchEvent(
                    new CustomEvent(
                        "studyMindUsernameChanged",
                        {
                            detail: {

                                username,

                                authSaved,

                                leaderboardSaved

                            }
                        }
                    )
                );


                /* ==========================================
                   PROFILE EVENT
                   ========================================== */

                window.dispatchEvent(
                    new CustomEvent(
                        "studyMindProfileUpdated",
                        {
                            detail: {

                                username,

                                authSaved,

                                leaderboardSaved

                            }
                        }
                    )
                );


                /* ==========================================
                   USER MESSAGE
                   ========================================== */

                if (
                    authSaved &&
                    leaderboardSaved
                ) {

                    showSettingsToast(
                        "Username updated everywhere."
                    );

                }

                else if (
                    authSaved
                ) {

                    showSettingsToast(
                        "Username updated successfully."
                    );

                }

                else {

                    showSettingsToast(
                        "Username saved locally."
                    );

                }

            }

            catch (error) {

                console.error(
                    "StudyMind username update failed:",
                    error
                );


                /*
                 * Keep the interface usable even if
                 * Supabase fails.
                 */

                setCanonicalUsername(
                    username
                );


                input.value =
                    username;


                showSettingsToast(
                    "Username saved locally, but could not be synced to your account."
                );

            }

            finally {

                saveButton.disabled =
                    false;

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
        ) ||
        "dark";


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


                    if (!theme) {
                        return;
                    }


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

                    }

                    catch (error) {

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


    /* -------------------------------------------------------
       EXPLICIT ZERO STATE
       ------------------------------------------------------- */

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
   PUBLIC API
   ========================================================= */

window.StudyMindSettings = {

    getUsername:
        getCanonicalUsername,

    setUsername:
        setCanonicalUsername,

    resetStudyData,

    syncLeaderboardUsername

};
