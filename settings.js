"use strict";

/* =========================================================
   STUDYMIND AI — SETTINGS
   SUPABASE AUTHORITATIVE USERNAME SYSTEM
   GOLD / BLACK THEME SYSTEM
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
            "#largeAvatar"
        )
        .forEach(element => {

            element.textContent =
                username
                    .charAt(0)
                    .toUpperCase();

        });


    document
        .querySelectorAll(
            "#profileName"
        )
        .forEach(element => {

            element.textContent =
                username;

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


            username =
                String(
                    metadata.username ||
                    ""
                ).trim();


            /* ------------------------------------------------
               ONE-TIME MIGRATION
            ------------------------------------------------ */

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


            try {

                const client =
                    settingsClient();


                if (!client) {

                    throw new Error(
                        "Supabase client is not available."
                    );

                }


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


                const result =
                    await saveUsernameToSupabase(
                        username,
                        user
                    );


                user =
                    result.user;


                const savedUsername =
                    result.username;


                setCanonicalUsername(
                    savedUsername
                );


                input.value =
                    savedUsername;


                const leaderboardResult =
                    await syncLeaderboardUsername(
                        savedUsername,
                        user
                    );


                const leaderboardSaved =
                    leaderboardResult.success;


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


                try {

                    localStorage.setItem(
                        "studyMindUsernameChangedAt",
                        String(
                            Date.now()
                        )
                    );

                }

                catch (_) {}


                showSettingsToast(
                    leaderboardSaved
                        ? "Username updated everywhere."
                        : "Username updated successfully."
                );

            }

            catch (error) {

                console.error(
                    "StudyMind username update failed:",
                    error
                );


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
   PREMIUM DETECTION
========================================================= */

function isPremiumUser() {

    const cached =
        localStorage.getItem(
            "studyMindPremium"
        );


    if (
        cached === "true" ||
        cached === "1"
    ) {

        return true;

    }


    if (
        window.premiumStatus === true
    ) {

        return true;

    }


    if (
        typeof window.isStudyMindPremium ===
        "function"
    ) {

        try {

            return Boolean(
                window.isStudyMindPremium()
            );

        }

        catch (_) {}

    }


    return false;

}


/* =========================================================
   APPLY PREMIUM THEME
========================================================= */

function applyPremiumTheme() {

    const premium =
        isPremiumUser();


    document.body.classList.toggle(
        "premium-active",
        premium
    );


    document.body.classList.toggle(
        "premium-user",
        premium
    );


    document.documentElement
        .setAttribute(
            "data-premium",
            premium
                ? "true"
                : "false"
        );

}


/* =========================================================
   RESOLVE SYSTEM THEME
========================================================= */

function getSystemTheme() {

    return window.matchMedia &&
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches
            ? "dark"
            : "light";

}


/* =========================================================
   APPLY THEME
   ---------------------------------------------------------
   Supports:
   - system
   - light
   - dark
========================================================= */

function applyTheme(theme) {

    theme =
        theme || "system";


    const resolvedTheme =
        theme === "system"
            ? getSystemTheme()
            : theme;


    /* -------------------------------------------------------
       HTML ATTRIBUTE
    ------------------------------------------------------- */

    document.documentElement
        .setAttribute(
            "data-theme",
            theme
        );


    /* -------------------------------------------------------
       BODY CLASS
       This is required by settings.css.
    ------------------------------------------------------- */

    document.body.classList.toggle(
        "dark",
        resolvedTheme === "dark"
    );


    document.body.classList.toggle(
        "light",
        resolvedTheme === "light"
    );


    /* -------------------------------------------------------
       PREMIUM ALWAYS OVERRIDES NORMAL THEME
    ------------------------------------------------------- */

    applyPremiumTheme();


    /* -------------------------------------------------------
       UPDATE SIDEBAR THEME BUTTON
    ------------------------------------------------------- */

    updateThemeToggle(
        theme,
        resolvedTheme
    );


    /* -------------------------------------------------------
       UPDATE APPEARANCE SELECT
    ------------------------------------------------------- */

    const themeSelect =
        document.getElementById(
            "themeSelect"
        );


    if (themeSelect) {

        themeSelect.value =
            theme;

    }


    /* -------------------------------------------------------
       UPDATE META THEME COLOR
    ------------------------------------------------------- */

    const themeColor =
        resolvedTheme === "dark"
            ? "#0d0b08"
            : "#f7f5ef";


    let meta =
        document.querySelector(
            'meta[name="theme-color"]'
        );


    if (!meta) {

        meta =
            document.createElement(
                "meta"
            );

        meta.name =
            "theme-color";

        document.head.appendChild(
            meta
        );

    }


    meta.content =
        isPremiumUser()
            ? "#0d0b08"
            : themeColor;

}


/* =========================================================
   UPDATE SIDEBAR THEME BUTTON
========================================================= */

function updateThemeToggle(
    theme,
    resolvedTheme
) {

    const button =
        document.getElementById(
            "themeToggle"
        );


    const text =
        document.getElementById(
            "themeText"
        );


    if (!button) {
        return;
    }


    const icon =
        button.querySelector(
            "span:first-child"
        );


    if (icon) {

        icon.textContent =
            resolvedTheme === "dark"
                ? "☀️"
                : "🌙";

    }


    if (text) {

        if (
            theme === "system"
        ) {

            text.textContent =
                resolvedTheme === "dark"
                    ? "System · Dark"
                    : "System · Light";

        }

        else if (
            theme === "dark"
        ) {

            text.textContent =
                "Light mode";

        }

        else {

            text.textContent =
                "Dark mode";

        }

    }


    button.dataset.currentTheme =
        theme;

}


/* =========================================================
   LOAD THEME
========================================================= */

function loadTheme() {

    const savedTheme =
        localStorage.getItem(
            SETTINGS.THEME
        );


    const theme =
        (
            savedTheme === "light" ||
            savedTheme === "dark" ||
            savedTheme === "system"
        )
            ? savedTheme
            : "system";


    applyTheme(
        theme
    );

}


/* =========================================================
   SET THEME
========================================================= */

function setTheme(theme) {

    if (
        theme !== "system" &&
        theme !== "light" &&
        theme !== "dark"
    ) {

        theme =
            "system";

    }


    localStorage.setItem(
        SETTINGS.THEME,
        theme
    );


    applyTheme(
        theme
    );


    window.dispatchEvent(
        new CustomEvent(
            "studyMindThemeChanged",
            {

                detail: {

                    theme

                }

            }
        )
    );

}


/* =========================================================
   SETUP APPEARANCE THEME SELECT
========================================================= */

function setupThemeSelect() {

    const themeSelect =
        document.getElementById(
            "themeSelect"
        );


    if (!themeSelect) {
        return;
    }


    themeSelect.addEventListener(
        "change",
        () => {

            setTheme(
                themeSelect.value
            );

        }
    );

}


/* =========================================================
   SETUP SIDEBAR THEME BUTTON
   ---------------------------------------------------------
   Clicking the sidebar button toggles:
   light → dark → light
   while System remains selectable from Appearance.
========================================================= */

function setupThemeToggle() {

    const button =
        document.getElementById(
            "themeToggle"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            const current =
                localStorage.getItem(
                    SETTINGS.THEME
                ) ||
                "system";


            const resolved =
                current === "system"
                    ? getSystemTheme()
                    : current;


            const nextTheme =
                resolved === "dark"
                    ? "light"
                    : "dark";


            setTheme(
                nextTheme
            );

        }
    );

}


/* =========================================================
   SYSTEM THEME CHANGE
   ---------------------------------------------------------
   Only affects the page while Theme = System.
========================================================= */

function setupSystemThemeListener() {

    if (
        !window.matchMedia
    ) {

        return;

    }


    const mediaQuery =
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        );


    const handleChange =
        () => {

            const current =
                localStorage.getItem(
                    SETTINGS.THEME
                ) ||
                "system";


            if (
                current === "system"
            ) {

                applyTheme(
                    "system"
                );

            }

        };


    if (
        typeof mediaQuery.addEventListener ===
        "function"
    ) {

        mediaQuery.addEventListener(
            "change",
            handleChange
        );

    }

    else if (
        typeof mediaQuery.addListener ===
        "function"
    ) {

        mediaQuery.addListener(
            handleChange
        );

    }

}


/* =========================================================
   PREMIUM THEME LISTENER
========================================================= */

function setupPremiumThemeListener() {

    applyPremiumTheme();


    window.addEventListener(
        "studyMindPremiumChanged",
        () => {

            applyPremiumTheme();

        }
    );


    window.addEventListener(
        "storage",
        event => {

            if (
                event.key ===
                "studyMindPremium"
            ) {

                applyPremiumTheme();

                const currentTheme =
                    localStorage.getItem(
                        SETTINGS.THEME
                    ) ||
                    "system";

                applyTheme(
                    currentTheme
                );

            }

        }
    );

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


    const messageElement =
        document.getElementById(
            "toastMessage"
        );


    if (messageElement) {

        messageElement.textContent =
            message;

    }

    else {

        toast.textContent =
            message;

    }


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
            "#logout, #logoutButton, [data-logout]"
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
   MOBILE MENU
========================================================= */

function setupMobileMenu() {

    const button =
        document.getElementById(
            "mobileMenu"
        );


    const sidebar =
        document.getElementById(
            "sidebar"
        );


    if (
        !button ||
        !sidebar
    ) {

        return;

    }


    button.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "open"
            );

        }
    );


    document
        .querySelectorAll(
            ".navigation a"
        )
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    sidebar.classList.remove(
                        "open"
                    );

                }
            );

        });

}


/* =========================================================
   SETTINGS SECTION NAVIGATION
========================================================= */

function setupSettingsSections() {

    const buttons =
        document.querySelectorAll(
            ".settings-nav-item"
        );


    const sections =
        document.querySelectorAll(
            ".settings-section"
        );


    if (!buttons.length) {
        return;
    }


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const target =
                    button.dataset.section;


                if (!target) {
                    return;
                }


                buttons.forEach(
                    item => {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                sections.forEach(
                    section => {

                        section.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                const section =
                    document.getElementById(
                        `section-${target}`
                    );


                if (section) {

                    section.classList.add(
                        "active"
                    );

                }

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
       ZERO PROGRESS STATE
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
   RESET BUTTON
   ---------------------------------------------------------
   Supports BOTH:
   #resetStudyData
   #resetData
========================================================= */

function setupResetData() {

    document
        .querySelectorAll(
            "#resetStudyData, #resetData"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                resetStudyData
            );

        });

}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        /* ---------------------------------------------------
           THEME FIRST
        --------------------------------------------------- */

        loadTheme();

        setupThemeSelect();

        setupThemeToggle();

        setupSystemThemeListener();

        setupPremiumThemeListener();


        /* ---------------------------------------------------
           USER
        --------------------------------------------------- */

        await loadSettingsUser();

        setupProfile();


        /* ---------------------------------------------------
           PAGE CONTROLS
        --------------------------------------------------- */

        setupLogout();

        setupMobileMenu();

        setupSettingsSections();

        setupResetData();

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

    syncLeaderboardUsername,

    setTheme,

    getTheme:
        () =>
            localStorage.getItem(
                SETTINGS.THEME
            ) || "system",

    applyTheme

};
