
/* =========================================================
   STUDYMIND AI — PREMIUM MANAGEMENT
   COMPLETE REPLACEMENT

   FEATURES:
   - Server-authoritative Premium verification
   - Admin Premium access
   - 7-day free trial activation
   - One trial per account
   - Trial expiry information
   - Paystack / Flutterwave / Stripe checkout support
   - Premium theme management
   - Supabase authentication listener
   ========================================================= */

"use strict";

(function StudyMindPremiumManager() {

    /* =====================================================
       CONFIGURATION
    ===================================================== */

    const CONFIG = {
        STATUS_ENDPOINT: "/api/premium/status",
        CHECKOUT_ENDPOINT: "/api/premium/create-checkout",
        TRIAL_ENDPOINT: "/api/premium/trial/start",

        STORAGE_KEY: "studyMindPremium",
        THEME_KEY: "studyMindTheme",

        CHANGE_EVENT: "studyMindPremiumChanged",

        PREMIUM_PAGE: "premium.html"
    };


    /* =====================================================
       INTERNAL STATE
    ===================================================== */

    let premiumStatus = false;
    let adminStatus = false;
    let trialStatus = false;
    let trialStartsAt = null;
    let trialExpiresAt = null;
    let planType = null;

    let statusLoaded = false;
    let statusPromise = null;

    let authListenerRegistered = false;
    let trialRequestRunning = false;


    /* =====================================================
       SUPABASE CLIENT
    ===================================================== */

    function getSupabaseClient() {

        return (
            window.supabaseClient ||
            window.studyMindSupabase ||
            window.gameSupabase ||
            null
        );

    }


    /* =====================================================
       ACCESS TOKEN
    ===================================================== */

    async function getAccessToken() {

        const client = getSupabaseClient();

        if (!client || !client.auth) {
            return null;
        }

        try {

            const {
                data,
                error
            } = await client.auth.getSession();

            if (error) {

                console.error(
                    "Premium: Could not retrieve session.",
                    error
                );

                return null;
            }

            return data?.session?.access_token || null;

        } catch (error) {

            console.error(
                "Premium: Session error.",
                error
            );

            return null;
        }

    }


    /* =====================================================
       APPLY PREMIUM THEME
    ===================================================== */

    function applyPremiumTheme() {

        const enabled =
            statusLoaded && premiumStatus === true;

        const elements = [
            document.documentElement,
            document.body
        ];

        elements.forEach(element => {

            if (!element) return;

            element.classList.toggle(
                "study-mind-premium",
                enabled
            );

            element.classList.toggle(
                "premium-user",
                enabled
            );

            element.classList.toggle(
                "premium-theme",
                enabled
            );

            element.classList.toggle(
                "admin-user",
                enabled && adminStatus
            );

            element.classList.toggle(
                "free-user",
                statusLoaded && !enabled
            );

        });

    }


    /* =====================================================
       UPDATE PREMIUM STATE

       The server is authoritative.
       localStorage is only a display cache.
    ===================================================== */

    function updatePremiumState(
        isPremium,
        isAdmin,
        details = {}
    ) {

        premiumStatus = isPremium === true;
        adminStatus = isAdmin === true;

        trialStatus =
            details.isTrial === true;

        trialStartsAt =
            details.startsAt || null;

        trialExpiresAt =
            details.expiresAt ||
            details.trialExpiresAt ||
            null;

        planType =
            details.planType || null;

        statusLoaded = true;

        try {

            localStorage.setItem(
                CONFIG.STORAGE_KEY,
                premiumStatus ? "true" : "false"
            );

        } catch (error) {

            console.warn(
                "Premium: Could not update local cache.",
                error
            );

        }

        applyPremiumTheme();

        window.dispatchEvent(
            new CustomEvent(CONFIG.CHANGE_EVENT, {
                detail: {
                    premium: premiumStatus,
                    isPremium: premiumStatus,
                    isAdmin: adminStatus,

                    isTrial: trialStatus,
                    trial: trialStatus,

                    startsAt: trialStartsAt,
                    expiresAt: trialExpiresAt,

                    planType: planType,

                    loaded: true
                }
            })
        );

    }


    /* =====================================================
       LOAD VERIFIED PREMIUM STATUS
    ===================================================== */

    async function loadStudyMindPremium(forceRefresh = false) {

        if (statusPromise && !forceRefresh) {
            return statusPromise;
        }

        statusPromise = (async function () {

            /*
             * Never grant Premium from localStorage.
             */

            premiumStatus = false;
            adminStatus = false;
            trialStatus = false;

            trialStartsAt = null;
            trialExpiresAt = null;
            planType = null;

            statusLoaded = false;

            applyPremiumTheme();

            try {

                const token = await getAccessToken();

                if (!token) {

                    updatePremiumState(
                        false,
                        false
                    );

                    return false;
                }

                const response = await fetch(
                    CONFIG.STATUS_ENDPOINT,
                    {
                        method: "GET",

                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json",
                            "Cache-Control": "no-cache"
                        },

                        cache: "no-store"
                    }
                );

                if (!response.ok) {

                    throw new Error(
                        `Premium status request failed: ${response.status}`
                    );

                }

                const data = await response.json();

                const isAdmin =
                    data?.isAdmin === true;

                const isPremium =
                    data?.premium === true ||
                    isAdmin;

                updatePremiumState(
                    isPremium,
                    isAdmin,
                    {
                        isTrial: data?.isTrial === true,
                        startsAt: data?.startsAt,
                        expiresAt: data?.expiresAt,
                        trialExpiresAt: data?.trialExpiresAt,
                        planType: data?.planType
                    }
                );

                console.log(
                    "StudyMind Premium status:",
                    {
                        premium: premiumStatus,
                        admin: adminStatus,
                        trial: trialStatus,
                        planType: planType,
                        expiresAt: trialExpiresAt
                    }
                );

                return premiumStatus;

            } catch (error) {

                console.error(
                    "Premium verification failed:",
                    error
                );

                /*
                 * Fail closed.
                 * A failed verification must never
                 * grant Premium access.
                 */

                updatePremiumState(
                    false,
                    false
                );

                return false;

            }

        })();

        try {

            return await statusPromise;

        } finally {

            statusPromise = null;

        }

    }


    /* =====================================================
       WAIT FOR PREMIUM STATUS
    ===================================================== */

    async function waitForPremiumStatus() {

        if (statusLoaded) {
            return premiumStatus;
        }

        return await loadStudyMindPremium();

    }


    /* =====================================================
       PREMIUM STATUS HELPERS
    ===================================================== */

    function isPremium() {

        return (
            statusLoaded &&
            premiumStatus === true
        );

    }


    function isStudyMindPremium() {

        return isPremium();

    }


    function isPremiumTrial() {

        return (
            statusLoaded &&
            premiumStatus === true &&
            trialStatus === true
        );

    }


    function getPremiumExpiry() {

        return trialExpiresAt;

    }


    function getStudyMindPremiumStatus() {

        return {
            premium: premiumStatus,
            isPremium: premiumStatus,

            isAdmin: adminStatus,

            isTrial: trialStatus,
            trial: trialStatus,

            startsAt: trialStartsAt,
            expiresAt: trialExpiresAt,

            planType: planType,

            loaded: statusLoaded
        };

    }


    /* =====================================================
       START FREE TRIAL
    ===================================================== */

    async function beginPremiumTrial() {

        if (trialRequestRunning) {
            return false;
        }

        if (isPremium()) {

            alert(
                "Your account already has Premium access."
            );

            return false;
        }

        trialRequestRunning = true;

        const token = await getAccessToken();

        if (!token) {

            trialRequestRunning = false;

            alert(
                "Please sign in before starting your free trial."
            );

            return false;
        }

        const trialButtons = document.querySelectorAll(
            "[data-premium-trial]"
        );

        trialButtons.forEach(button => {

            button.disabled = true;
            button.setAttribute("aria-busy", "true");

        });

        try {

            const response = await fetch(
                CONFIG.TRIAL_ENDPOINT,
                {
                    method: "POST",

                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },

                    cache: "no-store"
                }
            );

            const data = await response.json();

            if (!response.ok || data?.success !== true) {

                throw new Error(
                    data?.error ||
                    "Could not start your free trial."
                );

            }

            /*
             * Refresh from the server.
             * Never grant Premium using only
             * the trial-start response.
             */

            await loadStudyMindPremium(true);

            if (!isPremium()) {

                throw new Error(
                    "Your trial was created, but Premium status could not be verified. Please refresh the page."
                );

            }

            console.log(
                "StudyMind free trial started:",
                {
                    startsAt: data.startsAt,
                    expiresAt: data.expiresAt
                }
            );

            alert(
                "Your 7-day Premium trial has started!"
            );

            return true;

        } catch (error) {

            console.error(
                "Premium trial error:",
                error
            );

            alert(
                error.message ||
                "Unable to start your free trial. Please try again."
            );

            return false;

        } finally {

            trialRequestRunning = false;

            trialButtons.forEach(button => {

                button.disabled = false;

                button.removeAttribute(
                    "aria-busy"
                );

            });

        }

    }


    /* =====================================================
       PREMIUM OFFER MODAL
    ===================================================== */

    function openPremiumOffer() {

        const modal = document.getElementById(
            "premiumModal"
        );

        if (modal) {

            modal.style.display = "flex";

            modal.classList.add("active");

            modal.setAttribute(
                "aria-hidden",
                "false"
            );

            return;
        }

        window.location.href =
            CONFIG.PREMIUM_PAGE;

    }


    function closePremiumModal() {

        const modal = document.getElementById(
            "premiumModal"
        );

        if (!modal) return;

        modal.style.display = "none";

        modal.classList.remove("active");

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    /* =====================================================
       PREMIUM PAYMENT
    ===================================================== */

    async function beginPremiumPayment(provider) {

        const allowedProviders = [
            "paystack",
            "flutterwave",
            "stripe"
        ];

        const selectedProvider =
            String(provider || "").toLowerCase();

        if (!allowedProviders.includes(selectedProvider)) {

            console.error(
                "Premium: Invalid payment provider."
            );

            return false;
        }

        try {

            const token = await getAccessToken();

            if (!token) {

                alert(
                    "Please sign in before purchasing Premium."
                );

                return false;
            }

            const response = await fetch(
                CONFIG.CHECKOUT_ENDPOINT,
                {
                    method: "POST",

                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        provider: selectedProvider
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {

                throw new Error(
                    data?.error ||
                    data?.message ||
                    "Could not start payment."
                );

            }

            const checkoutUrl =
                data?.checkoutUrl ||
                data?.checkout_url ||
                data?.authorization_url ||
                data?.url;

            if (!checkoutUrl) {

                throw new Error(
                    "Payment link was not returned by the server."
                );

            }

            window.location.href = checkoutUrl;

            return true;

        } catch (error) {

            console.error(
                "Premium payment error:",
                error
            );

            alert(
                error.message ||
                "Unable to start payment. Please try again."
            );

            return false;

        }

    }


    /* =====================================================
       AUTHENTICATION LISTENER
    ===================================================== */

    function registerAuthListener() {

        if (authListenerRegistered) return;

        const client = getSupabaseClient();

        if (!client?.auth?.onAuthStateChange) {
            return;
        }

        authListenerRegistered = true;

        client.auth.onAuthStateChange(
            function (event) {

                if (
                    event === "SIGNED_IN" ||
                    event === "SIGNED_OUT" ||
                    event === "TOKEN_REFRESHED" ||
                    event === "USER_UPDATED"
                ) {

                    Promise.resolve().then(() => {

                        loadStudyMindPremium(true);

                    });

                }

            }
        );

    }


    /* =====================================================
       MODAL BUTTONS
    ===================================================== */

    function setupModalButtons() {

        const closeButton = document.getElementById(
            "closePremiumModal"
        );

        if (
            closeButton &&
            !closeButton.dataset.premiumInitialized
        ) {

            closeButton.dataset.premiumInitialized =
                "true";

            closeButton.addEventListener(
                "click",
                closePremiumModal
            );

        }

        document
            .querySelectorAll("[data-premium-provider]")
            .forEach(button => {

                if (button.dataset.premiumInitialized) {
                    return;
                }

                button.dataset.premiumInitialized =
                    "true";

                button.addEventListener(
                    "click",
                    function () {

                        beginPremiumPayment(
                            button.dataset.premiumProvider
                        );

                    }
                );

            });


        /*
         * Any button with data-premium-trial
         * starts the one-time free trial.
         */

        document
            .querySelectorAll("[data-premium-trial]")
            .forEach(button => {

                if (button.dataset.premiumInitialized) {
                    return;
                }

                button.dataset.premiumInitialized =
                    "true";

                button.addEventListener(
                    "click",
                    function () {

                        beginPremiumTrial();

                    }
                );

            });

    }


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    async function initializePremium() {

        registerAuthListener();

        setupModalButtons();

        await loadStudyMindPremium();

    }


    /* =====================================================
       PUBLIC GLOBAL FUNCTIONS
    ===================================================== */

    window.isPremium = isPremium;

    window.isStudyMindPremium =
        isStudyMindPremium;

    window.isPremiumTrial =
        isPremiumTrial;

    window.getPremiumExpiry =
        getPremiumExpiry;

    window.loadStudyMindPremium =
        loadStudyMindPremium;

    window.waitForPremiumStatus =
        waitForPremiumStatus;

    window.getStudyMindPremiumStatus =
        getStudyMindPremiumStatus;

    window.applyPremiumTheme =
        applyPremiumTheme;

    window.openPremiumOffer =
        openPremiumOffer;

    window.openPremiumModal =
        openPremiumOffer;

    window.closePremiumModal =
        closePremiumModal;

    window.beginPremiumPayment =
        beginPremiumPayment;

    window.beginPremiumTrial =
        beginPremiumTrial;


    /* =====================================================
       START
    ===================================================== */

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            initializePremium,
            { once: true }
        );

    } else {

        initializePremium();

    }


    /*
     * Retry auth listener registration if the
     * Supabase client becomes available later.
     */

    window.addEventListener(
        "load",
        registerAuthListener,
        { once: true }
    );


})();
