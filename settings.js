"use strict";

/* =========================================================
   STUDYMIND AI — SETTINGS
   SUPABASE AUTHORITATIVE USERNAME SYSTEM

   IMPORTANT
   ---------------------------------------------------------
   Supabase Auth user_metadata.username is the ONLY
   authoritative username.

   Compatibility fields:
   - name
   - display_name
   - full_name

   are kept synchronized with username, but are NEVER
   allowed to override username.

   localStorage is only a local cache.
   ========================================================= */


/* =========================================================
   SETTINGS KEYS
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
   SUPABASE CLIENT
   ========================================================= */

function settingsClient() {

    return (
        window.supabaseClient ||
        window.studyMindSupabase ||
        null
    );

}


/* =========================================================
   NORMALIZE USERNAME
   ========================================================= */

function normalizeUsername(username) {

    username =
        String(username || "")
            .trim();

    return username || "Student";

}


/* =========================================================
   GET LOCAL CACHED USERNAME
   ---------------------------------------------------------
   This is ONLY a fallback for offline/UI situations.
   ========================================================= */

function getCachedUsername() {

    return normalizeUsername(
        localStorage.getItem(
            SETTINGS.NAME
        )
    );

}


/* =========================================================
   SET LOCAL CACHE
   ========================================================= */

function cacheUsername(username) {

    username =
        normalizeUsername(username);

    localStorage.setItem(
        SETTINGS.NAME,
        username
    );

    return username;

}


/* =========================================================
   GET CANONICAL USERNAME
   ---------------------------------------------------------
   IMPORTANT:
   This function does NOT use:
   - name
   - display_name
   - full_name

   Those fields are compatibility fields only.
   ========================================================= */

function getCanonicalUsername() {

    return getCachedUsername();

}


/* =========================================================
   UPDATE CURRENT PAGE
   ========================================================= */

function updateUsernameUI(username) {

    username =
        normalizeUsername(username);


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


    document
        .querySelectorAll(
            "[data-username]"
        )
        .forEach(element => {

            element.textContent =
                username;

        });

}


/* =========================================================
   SET CANONICAL USERNAME
   ---------------------------------------------------------
   This updates the local cache/UI.

   Supabase persistence is handled separately by
   saveUsernameToSupabase().
   ========================================================= */

function setCanonicalUsername(username) {

    username =
        normalizeUsername(username);


    cacheUsername(
        username
    );


    updateUsernameUI(
        username
    );


    return username;

}


/* =========================================================
   SAVE USERNAME TO SUPABASE AUTH
   ========================================================= */

async function saveUsernameToSupabase(
    username,
    existingUser = null
) {

    const client =
        settingsClient();


    if (!client) {

        throw new Error(
            "Supabase client is not available."
        );

    }


    username =
        normalizeUsername(username);


    let user =
        existingUser;


    /* -------------------------------------------------------
       GET AUTHENTICATED USER
       ------------------------------------------------------- */

    if (!user) {

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

    }


    if (!user) {

        throw new Error(
            "No authenticated Supabase user."
        );

    }


    /* -------------------------------------------------------
       UPDATE AUTH METADATA
       -------------------------------------------------------

       username = AUTHORITATIVE

       The other fields exist only for compatibility with
       older StudyMind code.
       ------------------------------------------------------- */

    const {
        data,
        error
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


    if (error) {
        throw error;
    }


    const updatedUser =
        data?.user ||
        user;


    /* -------------------------------------------------------
       VERIFY THE SAVED VALUE
       ------------------------------------------------------- */

    const savedUsername =
        normalizeUsername(
            updatedUser
                ?.user_metadata
                ?.username
        );


    if (
        savedUsername !==
        username
    ) {

        throw new Error(
            "Supabase did not return the expected username."
        );

    }


    console.log(
        "StudyMind: Supabase username saved:",
        savedUsername
    );


    return {

        user:
            updatedUser,

        username:
            savedUsername

    };

}


/* =========================================================
   SYNC LEADERBOARD USERNAME
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
        normalizeUsername(username);


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

        console.warn(
            "StudyMind: leaderboard username synchronization failed:",
            error
        );


        return {

            success: false,

            error

        };

    }

}


/* =========================================================
   LOAD AUTHENTICATED USER
   ---------------------------------------------------------
   CRITICAL:
   ONLY user_metadata.username is accepted as the
   authoritative Supabase username.

   We deliberately DO NOT do:

   metadata.name
   metadata.display_name
   metadata.full_name

   because that is what caused the old
   "Ronaldo Cristiano" value to return.
   ========================================================= */

async function loadSettingsUser() {

    const client =
        settingsClient();


    let username =
        null;


    try {

        if (!client) {

            console.warn(
                "StudyMind: Supabase client unavailable while loading username."
            );


            username =
                getCachedUsername();

        }

        else {

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


            /* ==============================================
               ONLY AUTHORITATIVE FIELD
               ============================================== */

            username =
                String(
                    metadata.username ||
                    ""
                ).trim();


            /* ==============================================
               IMPORTANT

               If username doesn't exist yet, DO NOT revive
               metadata.name / display_name / full_name.

               We migrate the existing name ONCE into the
               canonical username field.

               This is needed for your current account because
               it currently has:

               name: "Ronaldo Cristiano"

               but no username.
               ============================================== */

            if (!username) {

                const migrationUsername =
                    String(
                        metadata.name ||
                        metadata.display_name ||
                        metadata.full_name ||
                        ""
                    ).trim();


                if (migrationUsername) {

                    console.log(
                        "StudyMind: migrating existing Supabase name into canonical username:",
                        migrationUsername
                    );


                    const result =
                        await saveUsernameToSupabase(
                            migrationUsername,
                            user
                        );


                    username =
                        result.username;

                }

            }


            /* ==============================================
               LAST RESORT

               Only use local cache if Supabase contains
               absolutely no usable username.
               ============================================== */

            if (!username) {

                username =
                    getCachedUsername();

            }


            if (!username) {

                username =
                    "Student";

            }

        }

    }

    catch (error) {

        console.warn(
            "StudyMind settings user load failed:",
            error
        );


        username =
            getCachedUsername();

    }


    username =
        normalizeUsername(
            username
        );


    cacheUsername(
        username
    );


    updateUsernameUI(
        username
    );


    console.log(
        "StudyMind Settings: canonical username:",
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
                normalizeUsername(
                    input.value
                );


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


            saveButton.disabled =
                true;


            let authSaved =
                false;

            let leaderboardSaved =
                false;


            try {

                const client =
                    settingsClient();


                if (!client) {

                    throw new Error(
                        "Supabase client is not available."
                    );

                }


                /* ==========================================
                   GET CURRENT AUTH USER
                   ========================================== */

                const {
                    data,
                    error
                } =
                    await client.auth.getUser();


                if (error) {
                    throw error;
                }


                let user =
                    data?.user ||
                    null;


                if (!user) {

                    throw new Error(
                        "No authenticated user found."
                    );

                }


                /* ==========================================
                   SAVE AUTHORITATIVE USERNAME
                   ========================================== */

                const result =
                    await saveUsernameToSupabase(
                        username,
                        user
                    );


                user =
                    result.user;


                const savedUsername =
                    result.username;


                authSaved =
                    true;


                /* ==========================================
                   UPDATE LOCAL CACHE/UI ONLY AFTER SUPABASE
                   SUCCESS
                   ========================================== */

                setCanonicalUsername(
                    savedUsername
                );


                input.value =
                    savedUsername;


                /* ==========================================
                   LEADERBOARD
                   ========================================== */

                const leaderboardResult =
                    await syncLeaderboardUsername(
                        savedUsername,
                        user
                    );


                leaderboardSaved =
                    leaderboardResult.success;


                /* ==========================================
                   USERNAME CHANGE EVENT
                   ========================================== */

                window.dispatchEvent(
                    new CustomEvent(
                        "studyMindUsernameChanged",
                        {

                            detail: {

                                username:
                                    savedUsername,

                                authSaved:
                                    true,

                                leaderboardSaved

                            }

                        }
                    )
                );


                /* ==========================================
                   PROFILE UPDATED EVENT
                   ========================================== */

                window.dispatchEvent(
                    new CustomEvent(
                        "studyMindProfileUpdated",
                        {

                            detail: {

                                username:
                                    savedUsername,

                                authSaved:
                                    true,

                                leaderboardSaved

                            }

                        }
                    )
                );


                /* ==========================================
                   BROADCAST TO OTHER OPEN STUDYMIND TABS
                   ========================================== */

                try {

                    localStorage.setItem(
                        "studyMindUsernameChangedAt",
                        String(
                            Date.now()
                        )
                    );

                }

                catch (_) {}


                /* ==========================================
                   MESSAGE
                   ========================================== */

                if (
                    leaderboardSaved
                ) {

                    showSettingsToast(
                        "Username updated everywhere."
                    );

                }

                else {

                    showSettingsToast(
                        "Username updated successfully."
                    );

                }

            }

            catch (error) {

                console.error(
                    "StudyMind username update failed:",
                    error
                );


                /*
                 * IMPORTANT:
                 *
                 * Do NOT pretend the username was saved
                 * locally when Supabase failed.
                 *
                 * The old username remains authoritative.
                 */

                showSettingsToast(
                    "Could not update username. Please try again."
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
                            "StudyMind logout failed:",
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
   ---------------------------------------------------------
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
        getCanonicalUsername();


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
                key !== SETTINGS.NAME &&
                key !== "studyMindPremium"
            ) {

                localStorage.removeItem(
                    key
                );

            }

        });


    cacheUsername(
        username
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
    async () => {

        loadTheme();

        await loadSettingsUser();

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

    loadUsername:
        loadSettingsUser,

    saveUsername:
        saveUsernameToSupabase,

    resetStudyData,

    syncLeaderboardUsername

};

