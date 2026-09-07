/* =========================================================
   STUDYMIND AI — PREMIUM DASHBOARD
   PREMIUM ACCESS CONTROLLER

   PURPOSE:
   - Verify authenticated user
   - Verify Premium from /api/premium/status
   - Block non-Premium users
   - Load the existing dashboard engine only after
     Premium access has been verified
   - Preserve existing study plan / topic / progress data
   - Re-apply Premium overrides AFTER dashboard.js loads
========================================================= */

"use strict";


/* =========================================================
   CONFIGURATION
========================================================= */

const PREMIUM_STATUS_ENDPOINT =
    "/api/premium/status";

const DASHBOARD_ENGINE =
    "dashboard.js";

const NON_PREMIUM_REDIRECT =
    "premium.html";

const LOGIN_REDIRECT =
    "login.html";


/* =========================================================
   ELEMENTS
========================================================= */

const premiumAccessGate =
    document.getElementById(
        "premiumAccessGate"
    );


/* =========================================================
   GATE HELPERS
========================================================= */

function hidePremiumGate() {

    if (!premiumAccessGate) {
        return;
    }

    premiumAccessGate.classList.add(
        "hidden"
    );

}


function showPremiumGate() {

    if (!premiumAccessGate) {
        return;
    }

    premiumAccessGate.classList.remove(
        "hidden"
    );

}


/* =========================================================
   REDIRECT
========================================================= */

function redirectTo(url) {

    window.location.replace(url);

}


/* =========================================================
   GET SUPABASE CLIENT
========================================================= */

function getSupabaseClient() {

    if (
        window.supabaseClient &&
        window.supabaseClient.auth
    ) {
        return window.supabaseClient;
    }


    if (
        typeof supabaseClient !==
        "undefined" &&
        supabaseClient &&
        supabaseClient.auth
    ) {
        return supabaseClient;
    }


    return null;

}


/* =========================================================
   VERIFY PREMIUM
========================================================= */

async function verifyPremiumAccess() {

    console.log(
        "StudyMind Premium Dashboard: verifying access..."
    );


    const client =
        getSupabaseClient();


    if (!client) {

        console.error(
            "StudyMind Premium Dashboard: Supabase client unavailable."
        );

        redirectTo(
            LOGIN_REDIRECT
        );

        return false;
    }


    /* ---------------------------------------------------------
       GET CURRENT SESSION
    --------------------------------------------------------- */

    let session = null;


    try {

        const result =
            await client.auth.getSession();


        session =
            result?.data?.session ||
            null;

    } catch (error) {

        console.error(
            "Could not retrieve Supabase session:",
            error
        );

        redirectTo(
            LOGIN_REDIRECT
        );

        return false;
    }


    if (!session) {

        console.warn(
            "No authenticated session."
        );

        redirectTo(
            LOGIN_REDIRECT
        );

        return false;
    }


    /* ---------------------------------------------------------
       VERIFY PREMIUM FROM SERVER
    --------------------------------------------------------- */

    try {

        const response =
            await fetch(
                PREMIUM_STATUS_ENDPOINT,
                {
                    method: "GET",

                    headers: {
                        Authorization:
                            `Bearer ${session.access_token}`,

                        Accept:
                            "application/json"
                    },

                    cache:
                        "no-store"
                }
            );


        if (!response.ok) {

            console.error(
                "Premium status request failed:",
                response.status
            );

            redirectTo(
                NON_PREMIUM_REDIRECT
            );

            return false;
        }


        const result =
            await response.json();


        console.log(
            "StudyMind Premium status:",
            result
        );


        if (
            result?.premium !== true
        ) {

            console.warn(
                "User is not Premium."
            );

            redirectTo(
                NON_PREMIUM_REDIRECT
            );

            return false;
        }


        /* -----------------------------------------------------
           PREMIUM VERIFIED
        ----------------------------------------------------- */

        window.studyMindPremiumVerified =
            true;


        window.studyMindPremiumUserId =
            result?.userId ||
            session.user?.id ||
            null;


        document.body.classList.add(
            "premium-access-verified"
        );


        console.log(
            "StudyMind Premium access verified."
        );


        return true;

    } catch (error) {

        console.error(
            "Premium verification failed:",
            error
        );


        redirectTo(
            NON_PREMIUM_REDIRECT
        );


        return false;
    }

}


/* =========================================================
   LOAD EXISTING DASHBOARD ENGINE
========================================================= */

function loadDashboardEngine() {

    return new Promise(
        (resolve, reject) => {

            /*
             * Prevent duplicate dashboard.js loading.
             */

            if (
                document.querySelector(
                    'script[data-studymind-dashboard-engine="true"]'
                )
            ) {

                resolve();

                return;
            }


            const script =
                document.createElement(
                    "script"
                );


            script.src =
                DASHBOARD_ENGINE;


            /*
             * Prevent browser caching from serving
             * an older dashboard engine during testing.
             */

            script.dataset.studymindDashboardEngine =
                "true";


            script.onload =
                () => {

                    console.log(
                        "StudyMind dashboard engine loaded."
                    );

                    resolve();

                };


            script.onerror =
                error => {

                    console.error(
                        "Could not load dashboard.js:",
                        error
                    );

                    reject(
                        error
                    );

                };


            document.body.appendChild(
                script
            );

        }
    );

}


/* =========================================================
   APPLY PREMIUM OVERRIDES
   IMPORTANT:
   THIS MUST RUN AFTER dashboard.js HAS LOADED.
========================================================= */

function applyPremiumOverrides() {

    /*
     * Mark the current workspace as Premium.
     */

    window.studyMindPremiumVerified =
        true;


    /*
     * Premium status.
     */

    window.isStudyMindPremium =
        function () {
            return true;
        };


    /*
     * Premium users have unlimited AI questions.
     */

    window.hasFreeAIQuestionsLeft =
        function () {
            return true;
        };


    window.getRemainingAIQuestions =
        function () {
            return Infinity;
        };


    window.recordAIQuestion =
        function () {
            return true;
        };


    /*
     * Premium users should never receive
     * the free-user upgrade message.
     */

    window.showPremiumMessage =
        function () {

            console.log(
                "Premium user — no upgrade required."
            );

        };


    /*
     * Keep dashboard navigation inside
     * the Premium Dashboard.
     */

    window.openDashboard =
        function () {

            window.location.href =
                "premium-dashboard.html";

        };


    /*
     * Additional compatibility aliases.
     * These make the Premium state available to
     * dashboard code that checks global variables.
     */

    window.studyMindIsPremium =
        true;


    window.premiumUser =
        true;


    console.log(
        "StudyMind Premium overrides applied AFTER dashboard engine."
    );

}


/* =========================================================
   FORCE PREMIUM ROUTING
========================================================= */

function enforcePremiumRouting() {

    /*
     * Replace common dashboard links so that
     * Premium users remain inside the Premium workspace.
     */

    const dashboardLinks =
        document.querySelectorAll(
            'a[href="dashboard.html"], a[href="./dashboard.html"]'
        );


    dashboardLinks.forEach(
        link => {

            link.href =
                "premium-dashboard.html";

        }
    );


    /*
     * Also make the logo/dashboard navigation
     * remain Premium.
     */

    const premiumLinks =
        document.querySelectorAll(
            '[data-dashboard-link]'
        );


    premiumLinks.forEach(
        link => {

            link.href =
                "premium-dashboard.html";

        }
    );


    /*
     * If dashboard.js exposes openDashboard,
     * make absolutely sure it points here.
     */

    window.openDashboard =
        function () {

            window.location.href =
                "premium-dashboard.html";

        };


    console.log(
        "Premium routing enforced."
    );

}


/* =========================================================
   AUTH STATE LISTENER
========================================================= */

function setupAuthListener() {

    const client =
        getSupabaseClient();


    if (
        !client ||
        !client.auth
    ) {
        return;
    }


    client.auth.onAuthStateChange(
        async (
            event,
            session
        ) => {

            console.log(
                "Premium dashboard auth event:",
                event
            );


            if (
                event ===
                "SIGNED_OUT"
            ) {

                redirectTo(
                    LOGIN_REDIRECT
                );

                return;
            }


            if (
                event ===
                "TOKEN_REFRESHED" &&
                session
            ) {

                /*
                 * Do not reload the dashboard for
                 * every token refresh.
                 */

                return;
            }

        }
    );

}


/* =========================================================
   MAIN INITIALIZATION
========================================================= */

async function initializePremiumDashboard() {

    showPremiumGate();


    /* ---------------------------------------------------------
       STEP 1 — VERIFY USER
    --------------------------------------------------------- */

    const premium =
        await verifyPremiumAccess();


    if (!premium) {
        return;
    }


    /*
     * IMPORTANT:
     *
     * DO NOT apply the Premium overrides yet.
     *
     * dashboard.js needs to load first.
     */

    try {

        await loadDashboardEngine();

    } catch (error) {

        console.error(
            "Premium dashboard engine failed to load:",
            error
        );

        return;
    }


    /* ---------------------------------------------------------
       STEP 2 — DASHBOARD ENGINE IS NOW LOADED
       STEP 3 — RE-APPLY PREMIUM OVERRIDES
    --------------------------------------------------------- */

    applyPremiumOverrides();


    /* ---------------------------------------------------------
       STEP 4 — FORCE PREMIUM ROUTING
    --------------------------------------------------------- */

    enforcePremiumRouting();


    /* ---------------------------------------------------------
       STEP 5 — AUTH LISTENER
    --------------------------------------------------------- */

    setupAuthListener();


    /* ---------------------------------------------------------
       STEP 6 — REMOVE ACCESS GATE
    --------------------------------------------------------- */

    window.setTimeout(
        () => {

            hidePremiumGate();

        },
        250
    );


    console.log(
        "StudyMind Premium Dashboard initialized successfully."
    );

}


/* =========================================================
   START
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializePremiumDashboard
    );

} else {

    initializePremiumDashboard();

}
