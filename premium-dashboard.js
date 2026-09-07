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
   - Premium users get unlimited AI behavior through the
     Premium-aware dashboard engine
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
   PREMIUM OVERRIDES
========================================================= */

function applyPremiumOverrides() {

    /*
     * The current dashboard engine already knows how to treat
     * verified Premium users as unlimited.
     *
     * These compatibility functions make the Premium state
     * available to any page code that checks the global state.
     */


    window.isStudyMindPremium =
        function () {
            return true;
        };


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
     * Premium users should never see the free upgrade message
     * from this workspace.
     */

    window.showPremiumMessage =
        function () {
            console.log(
                "Premium user — no upgrade required."
            );
        };


    /*
     * Keep Premium navigation inside the Premium workspace
     * whenever the dashboard engine calls openDashboard().
     */

    window.openDashboard =
        function () {
            window.location.href =
                "premium-dashboard.html";
        };


    console.log(
        "StudyMind Premium overrides applied."
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
                 * Do not reload the dashboard for every token
                 * refresh. The original server verification
                 * already happened.
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


    const premium =
        await verifyPremiumAccess();


    if (!premium) {
        return;
    }


    /*
     * Apply Premium behavior before loading the dashboard
     * engine.
     */

    applyPremiumOverrides();


    /*
     * Load the existing dashboard engine.
     *
     * This preserves:
     * - study plans
     * - topics
     * - progress
     * - knowledge checks
     * - timer
     * - calendar
     * - schedule
     * - daily challenge
     * - streak
     * - dashboard calculations
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


    setupAuthListener();


    /*
     * Give the dashboard engine a moment to initialize.
     * Then remove the access gate.
     */

    window.setTimeout(
        () => {

            hidePremiumGate();

        },
        250
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
