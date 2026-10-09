"use strict";

/* =========================================================
   STUDYMIND AI — SETTINGS
   COMPLETE REPLACEMENT
   SUPABASE USERNAME SYSTEM
   PREMIUM STATUS + GOLD THEME
   SETTINGS / PROFILE / RESET / LOGOUT
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
   LOCAL USERNAME
========================================================= */

function getCachedUsername() {

    return normalizeUsername(
        localStorage.getItem(
            SETTINGS.NAME
        )
    );

}


function cacheUsername(username) {

    username =
        normalizeUsername(username);

    localStorage.setItem(
        SETTINGS.NAME,
        username
    );

    return username;

}


function getCanonicalUsername() {

    return getCachedUsername();

}


/* =========================================================
   UPDATE USERNAME UI
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


function setCanonicalUsername(username) {

    username =
        normalizeUsername(username);

    cacheUsername(username);

    updateUsernameUI(username);

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
   LEADERBOARD USERNAME SYNC
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

                    try {

                        const result =
                            await saveUsernameToSupabase(
                                migrationUsername,
                                user
                            );


                        username =
                            result.username;

                    }

                    catch (migrationError) {

                        console.warn(
                            "StudyMind username migration failed:",
                            migrationError
                        );

                        username =
                            migrationUsername;

                    }

                }

            }


            if (!username) {

                username =
                    getCachedUsername();

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
        normalizeUsername(username);


    cacheUsername(username);

    updateUsernameUI(username);


    const input =
        document.getElementById(
            "displayName"
        );


    if (input) {
        input.value = username;
    }


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


                const user =
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
                        result.user
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
   PREMIUM
========================================================= */

let studyMindPremium =
    false;


/* ---------------------------------------------------------
   PARSE PREMIUM RESPONSE
--------------------------------------------------------- */

function parsePremiumValue(value) {

    if (
        value === true ||
        value === 1 ||
        value === "true" ||
        value === "1"
    ) {

        return true;

    }


    if (!value) {
        return false;
    }


    if (
        typeof value === "object"
    ) {

        return (
            value.isPremium === true ||
            value.premium === true ||
            value.active === true ||
            value.is_premium === true ||
            value.premium_active === true ||
            value.status === "active" ||
            value.subscription_status === "active" ||
            value.plan === "premium" ||
            value.plan === "Premium"
        );

    }


    return false;

}


/* ---------------------------------------------------------
   CACHE PREMIUM
--------------------------------------------------------- */

function cachePremiumStatus(isPremium) {

    studyMindPremium =
        Boolean(isPremium);


    localStorage.setItem(
        "studyMindPremium",
        studyMindPremium
            ? "true"
            : "false"
    );

}


/* ---------------------------------------------------------
   LOCAL PREMIUM FALLBACK
--------------------------------------------------------- */

function getCachedPremiumStatus() {

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


    try {

        const parsed =
            JSON.parse(
                cached
            );


        return parsePremiumValue(
            parsed
        );

    }

    catch (_) {

        return false;

    }

}


/* ---------------------------------------------------------
   UPDATE PREMIUM UI
--------------------------------------------------------- */

function updatePremiumUI(isPremium) {

    isPremium =
        Boolean(isPremium);


    studyMindPremium =
        isPremium;


    /* -------------------------------------------------------
       ACCOUNT BADGE
    ------------------------------------------------------- */

    const premiumBadge =
        document.getElementById(
            "premiumBadge"
        );


    if (premiumBadge) {

        premiumBadge.textContent =
            isPremium
                ? "PREMIUM PLAN"
                : "FREE PLAN";


        premiumBadge.classList.toggle(
            "premium",
            isPremium
        );


        premiumBadge.classList.toggle(
            "free",
            !isPremium
        );

    }


    /* -------------------------------------------------------
       ACCOUNT STATUS
    ------------------------------------------------------- */

    const accountStatus =
        document.getElementById(
            "accountStatus"
        );


    if (accountStatus) {

        accountStatus.textContent =
            isPremium
                ? "Premium"
                : "Free";

    }


    /* -------------------------------------------------------
       OPTIONAL PREMIUM ELEMENTS
    ------------------------------------------------------- */

    document
        .querySelectorAll(
            "[data-premium-status]"
        )
        .forEach(element => {

            element.textContent =
                isPremium
                    ? "Premium"
                    : "Free";

        });


    document
        .querySelectorAll(
            "[data-premium-badge]"
        )
        .forEach(element => {

            element.textContent =
                isPremium
                    ? "PREMIUM"
                    : "FREE";

        });


    /* -------------------------------------------------------
       BODY THEME
    ------------------------------------------------------- */

    document.body.classList.toggle(
        "premium-active",
        isPremium
    );


    document.body.classList.toggle(
        "premium-user",
        isPremium
    );


    document.documentElement
        .setAttribute(
            "data-premium",
            isPremium
                ? "true"
                : "false"
        );

}


/* ---------------------------------------------------------
   CHECK PREMIUM FROM SERVER
   /api/premium/status
--------------------------------------------------------- */

async function checkPremiumStatus() {

    const localFallback =
        getCachedPremiumStatus();


    /* Immediately show cached state */
    updatePremiumUI(
        localFallback
    );


    try {

        const client =
            settingsClient();


        const headers = {

            "Content-Type":
                "application/json"

        };


        /* ---------------------------------------------------
           Add Supabase access token when available
        --------------------------------------------------- */

        if (client) {

            try {

                const {
                    data
                } =
                    await client.auth.getSession();


                const accessToken =
                    data?.session
                        ?.access_token;


                if (accessToken) {

                    headers.Authorization =
                        `Bearer ${accessToken}`;

                }

            }

            catch (_) {}

        }


        const response =
            await fetch(
                "/api/premium/status",
                {

                    method:
                        "GET",

                    headers,

                    credentials:
                        "include",

                    cache:
                        "no-store"

                }
            );


        if (!response.ok) {

            throw new Error(
                `Premium status request failed: ${response.status}`
            );

        }


        const result =
            await response.json();


        console.log(
            "StudyMind Premium status:",
            result
        );


        const serverPremium =
            parsePremiumValue(
                result
            ) ||
            parsePremiumValue(
                result?.data
            ) ||
            parsePremiumValue(
                result?.user
            ) ||
            parsePremiumValue(
                result?.subscription
            );


        cachePremiumStatus(
            serverPremium
        );


        updatePremiumUI(
            serverPremium
        );


        return serverPremium;

    }

    catch (error) {

        console.warn(
            "StudyMind: Could not verify Premium status from server. Using cached status.",
            error
        );


        updatePremiumUI(
            localFallback
        );


        return localFallback;

    }

}


/* =========================================================
   PREMIUM EVENTS
========================================================= */

function setupPremiumListener() {

    updatePremiumUI(
        getCachedPremiumStatus()
    );


    window.addEventListener(
        "studyMindPremiumChanged",
        event => {

            const detail =
                event.detail;


            const isPremium =
                parsePremiumValue(
                    detail
                );


            cachePremiumStatus(
                isPremium
            );


            updatePremiumUI(
                isPremium
            );


            applyTheme(
                getStoredTheme()
            );

        }
    );


    window.addEventListener(
        "storage",
        event => {

            if (
                event.key ===
                "studyMindPremium"
            ) {

                const isPremium =
                    getCachedPremiumStatus();


                updatePremiumUI(
                    isPremium
                );


                applyTheme(
                    getStoredTheme()
                );

            }

        }
    );

}


/* =========================================================
   THEME
========================================================= */

function getSystemTheme() {

    return (
        window.matchMedia &&
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches
    )
        ? "dark"
        : "light";

}


function getStoredTheme() {

    const saved =
        localStorage.getItem(
            SETTINGS.THEME
        );


    if (
        saved === "light" ||
        saved === "dark" ||
        saved === "system"
    ) {

        return saved;

    }


    return "system";

}


function applyPremiumTheme() {

    const premium =
        studyMindPremium ||
        getCachedPremiumStatus();


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


function applyTheme(theme) {

    if (
        theme !== "light" &&
        theme !== "dark" &&
        theme !== "system"
    ) {

        theme =
            "system";

    }


    const resolvedTheme =
        theme === "system"
            ? getSystemTheme()
            : theme;


    document.documentElement
        .setAttribute(
            "data-theme",
            theme
        );


    document.body.classList.toggle(
        "dark",
        resolvedTheme === "dark"
    );


    document.body.classList.toggle(
        "light",
        resolvedTheme === "light"
    );


    applyPremiumTheme();


    updateThemeToggle(
        theme,
        resolvedTheme
    );


    const themeSelect =
        document.getElementById(
            "themeSelect"
        );


    if (themeSelect) {

        themeSelect.value =
            theme;

    }


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
        studyMindPremium ||
        getCachedPremiumStatus()
            ? "#0d0b08"
            : resolvedTheme === "dark"
                ? "#0d0b08"
                : "#f7f5ef";

}


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
            ".theme-icon"
        ) ||
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


function loadTheme() {

    applyTheme(
        getStoredTheme()
    );

}


function setTheme(theme) {

    if (
        theme !== "light" &&
        theme !== "dark" &&
        theme !== "system"
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
   THEME SELECT
========================================================= */

function setupThemeSelect() {

    const themeSelect =
        document.getElementById(
            "themeSelect"
        );


    if (!themeSelect) {
        return;
    }


    themeSelect.value =
        getStoredTheme();


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
   SIDEBAR THEME BUTTON
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
                getStoredTheme();


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
   SYSTEM THEME LISTENER
========================================================= */

function setupSystemThemeListener() {

    if (!window.matchMedia) {
        return;
    }


    const mediaQuery =
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        );


    const handleChange =
        () => {

            if (
                getStoredTheme() ===
                "system"
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
   STUDY PREFERENCES
========================================================= */

function loadStudyPreferences() {

    const timerSelect =
        document.getElementById(
            "timerSelect"
        );


    const difficultySelect =
        document.getElementById(
            "difficultySelect"
        );


    const smartPlanning =
        document.getElementById(
            "smartPlanning"
        );


    if (timerSelect) {

        timerSelect.value =
            localStorage.getItem(
                SETTINGS.TIMER
            ) ||
            "25";

    }


    if (difficultySelect) {

        difficultySelect.value =
            localStorage.getItem(
                SETTINGS.DIFFICULTY
            ) ||
            "balanced";

    }


    if (smartPlanning) {

        smartPlanning.checked =
            localStorage.getItem(
                SETTINGS.SMART_PLANNING
            ) !== "false";

    }

}


function setupStudyPreferences() {

    loadStudyPreferences();


    const saveButton =
        document.getElementById(
            "saveStudy"
        );


    if (!saveButton) {
        return;
    }


    saveButton.addEventListener(
        "click",
        () => {

            const timerSelect =
                document.getElementById(
                    "timerSelect"
                );


            const difficultySelect =
                document.getElementById(
                    "difficultySelect"
                );


            const smartPlanning =
                document.getElementById(
                    "smartPlanning"
                );


            if (timerSelect) {

                localStorage.setItem(
                    SETTINGS.TIMER,
                    timerSelect.value
                );

            }


            if (difficultySelect) {

                localStorage.setItem(
                    SETTINGS.DIFFICULTY,
                    difficultySelect.value
                );

            }


            if (smartPlanning) {

                localStorage.setItem(
                    SETTINGS.SMART_PLANNING,
                    String(
                        smartPlanning.checked
                    )
                );

            }


            window.dispatchEvent(
                new CustomEvent(
                    "studyMindSettingsChanged"
                )
            );


            showSettingsToast(
                "Study preferences saved."
            );

        }
    );

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

function loadNotificationPreferences() {

    let stored = null;


    try {

        stored =
            JSON.parse(
                localStorage.getItem(
                    SETTINGS.NOTIFICATIONS
                )
            );

    }

    catch (_) {}


    if (
        !stored ||
        typeof stored !== "object"
    ) {

        stored = {

            streakNotifications:
                true,

            rewardNotifications:
                true,

            studyNotifications:
                true

        };

    }


    const streak =
        document.getElementById(
            "streakNotifications"
        );


    const rewards =
        document.getElementById(
            "rewardNotifications"
        );


    const study =
        document.getElementById(
            "studyNotifications"
        );


    if (streak) {

        streak.checked =
            stored.streakNotifications !== false;

    }


    if (rewards) {

        rewards.checked =
            stored.rewardNotifications !== false;

    }


    if (study) {

        study.checked =
            stored.studyNotifications !== false;

    }

}


function setupNotifications() {

    loadNotificationPreferences();


    const saveButton =
        document.getElementById(
            "saveNotifications"
        );


    if (!saveButton) {
        return;
    }


    saveButton.addEventListener(
        "click",
        () => {

            const streak =
                document.getElementById(
                    "streakNotifications"
                );


            const rewards =
                document.getElementById(
                    "rewardNotifications"
                );


            const study =
                document.getElementById(
                    "studyNotifications"
                );


            const preferences = {

                streakNotifications:
                    streak
                        ? streak.checked
                        : true,

                rewardNotifications:
                    rewards
                        ? rewards.checked
                        : true,

                studyNotifications:
                    study
                        ? study.checked
                        : true

            };


            localStorage.setItem(
                SETTINGS.NOTIFICATIONS,
                JSON.stringify(
                    preferences
                )
            );


            window.dispatchEvent(
                new CustomEvent(
                    "studyMindNotificationsChanged",
                    {
                        detail:
                            preferences
                    }
                )
            );


            showSettingsToast(
                "Notification settings saved."
            );

        }
    );

}


/* =========================================================
   AI PREFERENCES
========================================================= */

function loadAIPreferences() {

    const style =
        document.getElementById(
            "aiStyle"
        );


    const suggestions =
        document.getElementById(
            "aiSuggestions"
        );


    if (style) {

        style.value =
            localStorage.getItem(
                SETTINGS.AI_STYLE
            ) ||
            "balanced";

    }


    if (suggestions) {

        suggestions.checked =
            localStorage.getItem(
                SETTINGS.SUGGESTIONS
            ) !== "false";

    }

}


function setupAIPreferences() {

    loadAIPreferences();


    const saveButton =
        document.getElementById(
            "saveAI"
        );


    if (!saveButton) {
        return;
    }


    saveButton.addEventListener(
        "click",
        () => {

            const style =
                document.getElementById(
                    "aiStyle"
                );


            const suggestions =
                document.getElementById(
                    "aiSuggestions"
                );


            if (style) {

                localStorage.setItem(
                    SETTINGS.AI_STYLE,
                    style.value
                );

            }


            if (suggestions) {

                localStorage.setItem(
                    SETTINGS.SUGGESTIONS,
                    String(
                        suggestions.checked
                    )
                );

            }


            window.dispatchEvent(
                new CustomEvent(
                    "studyMindAIPreferencesChanged"
                )
            );


            showSettingsToast(
                "AI preferences saved."
            );

        }
    );

}


/* =========================================================
   TOAST
========================================================= */

let settingsToastTimer =
    null;


function showSettingsToast(message) {

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


    clearTimeout(
        settingsToastTimer
    );


    settingsToastTimer =
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


                    button.disabled =
                        true;


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
   RESET MODAL
========================================================= */

function openResetModal() {

    const modal =
        document.getElementById(
            "resetModal"
        );


    if (!modal) {

        resetStudyData();

        return;

    }


    modal.classList.add(
        "show"
    );


    modal.classList.add(
        "active"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );

}


function closeResetModal() {

    const modal =
        document.getElementById(
            "resetModal"
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "show"
    );


    modal.classList.remove(
        "active"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );

}


/* =========================================================
   RESET STUDY DATA
   USERNAME + PREMIUM PRESERVED
========================================================= */

function resetStudyData() {

    const username =
        getCanonicalUsername();


    const premium =
        localStorage.getItem(
            "studyMindPremium"
        );


    Object.keys(
        localStorage
    )
        .filter(
            key =>
                key.startsWith(
                    "studyMind"
                )
        )
        .forEach(
            key => {

                if (
                    key !== SETTINGS.NAME &&
                    key !== "studyMindPremium"
                ) {

                    localStorage.removeItem(
                        key
                    );

                }

            }
        );


    cacheUsername(
        username
    );


    if (
        premium !== null
    ) {

        localStorage.setItem(
            "studyMindPremium",
            premium
        );

    }


    /* -------------------------------------------------------
       ZERO PROGRESS
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


    localStorage.setItem(
        "studyMindStudyHistory",
        JSON.stringify([])
    );


    localStorage.setItem(
        "studyMindStreakActivity",
        JSON.stringify({})
    );


    window.dispatchEvent(
        new CustomEvent(
            "studyMindProgressUpdated"
        )
    );


    closeResetModal();


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
   RESET BUTTONS
========================================================= */

function setupResetData() {

    const resetButtons =
        document.querySelectorAll(
            "#resetStudyData, #resetData"
        );


    resetButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    openResetModal();

                }
            );

        }
    );


    const cancelButton =
        document.getElementById(
            "cancelReset"
        );


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                closeResetModal();

            }
        );

    }


    const confirmButton =
        document.getElementById(
            "confirmReset"
        );


    if (confirmButton) {

        confirmButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                resetStudyData();

            }
        );

    }


    const modal =
        document.getElementById(
            "resetModal"
        );


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {

                    closeResetModal();

                }

            }
        );

    }

}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        /* ---------------------------------------------------
           THEME
        --------------------------------------------------- */

        loadTheme();

        setupThemeSelect();

        setupThemeToggle();

        setupSystemThemeListener();


        /* ---------------------------------------------------
           PREMIUM
        --------------------------------------------------- */

        setupPremiumListener();

        await checkPremiumStatus();


        /* ---------------------------------------------------
           USER
        --------------------------------------------------- */

        await loadSettingsUser();

        setupProfile();


        /* ---------------------------------------------------
           SETTINGS
        --------------------------------------------------- */

        setupStudyPreferences();

        setupNotifications();

        setupAIPreferences();


        /* ---------------------------------------------------
           PAGE
        --------------------------------------------------- */

        setupLogout();

        setupMobileMenu();

        setupSettingsSections();

        setupResetData();


        /* ---------------------------------------------------
           FINAL THEME PASS
        --------------------------------------------------- */

        applyTheme(
            getStoredTheme()
        );


        console.log(
            "StudyMind Settings initialized.",
            {
                premium:
                    studyMindPremium,
                username:
                    getCanonicalUsername(),
                theme:
                    getStoredTheme()
            }
        );

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
        getStoredTheme,

    applyTheme,

    isPremium:
        () =>
            studyMindPremium,

    refreshPremium:
        checkPremiumStatus

};
