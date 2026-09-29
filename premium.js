"use strict";

/* =========================================================
   STUDYMIND AI — PREMIUM SYSTEM
   GOLD / NAMESPACED PREMIUM VERSION
   ========================================================= */

(function () {

    /* =====================================================
       STORAGE
       ===================================================== */

    const PREMIUM_CACHE_KEY =
        "studyMindPremium";

    const PREMIUM_EVENT =
        "studyMindPremiumChanged";


    /* =====================================================
       GLOBAL STATE
       ===================================================== */

    let premiumStatus = false;
    let premiumLoaded = false;


    /* =====================================================
       BASIC HELPERS
       ===================================================== */

    function isPremium() {
        return premiumStatus === true;
    }


    function isStudyMindPremium() {
        return premiumStatus === true;
    }


    function getCachedPremiumStatus() {

        try {

            return (
                localStorage.getItem(
                    PREMIUM_CACHE_KEY
                ) === "true"
            );

        } catch {

            return false;

        }

    }


    function saveCachedPremiumStatus(value) {

        try {

            localStorage.setItem(
                PREMIUM_CACHE_KEY,
                value ? "true" : "false"
            );

        } catch {}

    }


    /* =====================================================
       PREMIUM PAGE
       ===================================================== */

    function getPremiumPage() {

        return document.getElementById(
            "premiumPage"
        );

    }


    function isPremiumPageDark() {

        const page =
            getPremiumPage();

        if (!page) {
            return false;
        }

        return page.classList.contains(
            "premium-dark"
        );

    }


    /* =====================================================
       GOLD PREMIUM VARIABLES
       Force the Premium page to use its own palette.
       ===================================================== */

    function applyPremiumPageGoldTheme() {

        const page =
            getPremiumPage();

        if (!page) {
            return;
        }

        const dark =
            isPremiumPageDark();

        const root =
            page.style;

        if (dark) {

            root.setProperty(
                "--premium-bg",
                "#070b12"
            );

            root.setProperty(
                "--premium-bg-soft",
                "#0d121c"
            );

            root.setProperty(
                "--premium-card",
                "rgba(18,20,25,.96)"
            );

            root.setProperty(
                "--premium-card-solid",
                "#121419"
            );

            root.setProperty(
                "--premium-card-border",
                "rgba(211,164,56,.24)"
            );

            root.setProperty(
                "--premium-border",
                "rgba(211,164,56,.24)"
            );

            root.setProperty(
                "--premium-text",
                "#faf8f1"
            );

            root.setProperty(
                "--premium-muted",
                "#aaa696"
            );

            root.setProperty(
                "--premium-gold",
                "#d3a438"
            );

            root.setProperty(
                "--premium-gold-light",
                "#f0cb68"
            );

            root.setProperty(
                "--premium-gold-mid",
                "#b98522"
            );

            root.setProperty(
                "--premium-gold-dark",
                "#704807"
            );

            root.setProperty(
                "--premium-shadow",
                "rgba(0,0,0,.45)"
            );

        } else {

            root.setProperty(
                "--premium-bg",
                "#fcfaf3"
            );

            root.setProperty(
                "--premium-bg-soft",
                "#fffdf7"
            );

            root.setProperty(
                "--premium-card",
                "rgba(255,255,255,.96)"
            );

            root.setProperty(
                "--premium-card-solid",
                "#ffffff"
            );

            root.setProperty(
                "--premium-card-border",
                "rgba(184,132,18,.20)"
            );

            root.setProperty(
                "--premium-border",
                "rgba(184,132,18,.20)"
            );

            root.setProperty(
                "--premium-text",
                "#1d1a12"
            );

            root.setProperty(
                "--premium-muted",
                "#716b5d"
            );

            root.setProperty(
                "--premium-gold",
                "#d5a52a"
            );

            root.setProperty(
                "--premium-gold-light",
                "#fff1b8"
            );

            root.setProperty(
                "--premium-gold-mid",
                "#e8bc45"
            );

            root.setProperty(
                "--premium-gold-dark",
                "#9a6505"
            );

            root.setProperty(
                "--premium-shadow",
                "rgba(120,79,5,.14)"
            );

        }

        page.classList.add(
            "premium-gold-theme"
        );

    }

    /* =====================================================
       PREMIUM MODAL THEME
       ===================================================== */

    function applyPremiumModalTheme() {

        const modal =
            document.getElementById(
                "studyMindPremiumModal"
            );

        if (!modal) {
            return;
        }

        const page =
            getPremiumPage();

        /*
         * Keep modal inside Premium namespace.
         */

        if (
            page &&
            modal.parentElement !== page
        ) {

            page.appendChild(modal);

        }

        modal.classList.add(
            "premium-modal-root"
        );

        modal.classList.toggle(
            "premium-dark",
            isPremiumPageDark()
        );

        /*
         * Copy Premium variables to the
         * dynamically generated modal.
         */

        if (!page) {
            return;
        }

        const computedStyle =
            window.getComputedStyle(page);

        const variables = [
            "--premium-bg",
            "--premium-bg-soft",
            "--premium-card",
            "--premium-card-solid",
            "--premium-card-border",
            "--premium-border",
            "--premium-text",
            "--premium-muted",
            "--premium-gold",
            "--premium-gold-light",
            "--premium-gold-mid",
            "--premium-gold-dark",
            "--premium-shadow"
        ];

        variables.forEach(variable => {

            const value =
                computedStyle.getPropertyValue(
                    variable
                );

            if (value) {

                modal.style.setProperty(
                    variable,
                    value
                );

            }

        });

    }


    /* =====================================================
       APPLY PREMIUM THEME
       ===================================================== */

    function applyPremiumTheme() {

        /*
         * Keep the existing global status classes for
         * compatibility with other StudyMind pages.
         *
         * These DO NOT control the Premium page colors.
         */

        const enabled =
            premiumStatus === true;

        document.documentElement.classList.toggle(
            "study-mind-premium",
            enabled
        );

        if (document.body) {

            document.body.classList.toggle(
                "study-mind-premium",
                enabled
            );

        }


        const premiumPage =
            getPremiumPage();

        if (premiumPage) {

            /*
             * Premium page is ALWAYS gold.
             * Premium status only changes access/UI state.
             */

            premiumPage.classList.add(
                "premium-gold-theme"
            );

            premiumPage.classList.toggle(
                "premium-active",
                enabled
            );

            applyPremiumPageGoldTheme();

        }


        updatePremiumUI();

        applyPremiumModalTheme();

    }


    /* =====================================================
       PREMIUM UI
       ===================================================== */

    function updatePremiumUI() {

        const page =
            getPremiumPage();

        const buttons =
            page
                ? page.querySelectorAll(
                    "[data-premium-button]"
                )
                : document.querySelectorAll(
                    "[data-premium-button]"
                );


        buttons.forEach(button => {

            if (premiumStatus) {

                button.textContent =
                    "👑 Premium Active";

                button.classList.add(
                    "premium-active"
                );

            } else {

                button.classList.remove(
                    "premium-active"
                );

            }

        });


        const badges =
            page
                ? page.querySelectorAll(
                    "[data-premium-badge]"
                )
                : document.querySelectorAll(
                    "[data-premium-badge]"
                );


        badges.forEach(badge => {

            badge.textContent =
                premiumStatus
                    ? "👑 PREMIUM"
                    : "FREE";

        });


        document.dispatchEvent(
            new CustomEvent(
                PREMIUM_EVENT,
                {
                    detail: {
                        premium:
                            premiumStatus
                    }
                }
            )
        );

    }


    /* =====================================================
       AUTH SESSION
       ===================================================== */

    async function getAccessToken() {

        try {

            if (
                typeof window.supabaseClient ===
                "undefined"
            ) {

                return null;

            }

            const {
                data,
                error
            } =
                await window.supabaseClient
                    .auth
                    .getSession();


            if (error) {

                console.warn(
                    "Could not get Supabase session:",
                    error
                );

                return null;

            }


            return (
                data?.session?.access_token ||
                null
            );

        } catch (error) {

            console.warn(
                "Premium auth error:",
                error
            );

            return null;

        }

    }


    /* =====================================================
       LOAD PREMIUM STATUS
       ===================================================== */

    async function loadStudyMindPremium() {

        /*
         * Restore cached state immediately.
         */

        premiumStatus =
            getCachedPremiumStatus();

        applyPremiumTheme();


        /*
         * Server remains authoritative.
         */

        const token =
            await getAccessToken();


        if (!token) {

            premiumStatus = false;

            saveCachedPremiumStatus(
                false
            );

            applyPremiumTheme();

            premiumLoaded = true;

            return false;

        }


        try {

            const response =
                await fetch(
                    "/api/premium/status",
                    {
                        method: "GET",

                        headers: {
                            "Authorization":
                                `Bearer ${token}`
                        }
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data?.error ||
                    "Could not check Premium status."
                );

            }


            premiumStatus =
                data?.premium === true;


            saveCachedPremiumStatus(
                premiumStatus
            );


            applyPremiumTheme();

            premiumLoaded = true;

            return premiumStatus;


        } catch (error) {

            console.warn(
                "Premium status check failed:",
                error
            );


            /*
             * Never grant Premium if verification fails.
             */

            premiumStatus = false;

            saveCachedPremiumStatus(
                false
            );

            applyPremiumTheme();

            premiumLoaded = true;

            return false;

        }

    }


    /* =====================================================
       WAIT FOR PREMIUM STATUS
       ===================================================== */

    async function waitForPremiumStatus() {

        if (premiumLoaded) {
            return premiumStatus;
        }

        return await loadStudyMindPremium();

    }


    /* =====================================================
       PREMIUM OFFER MODAL
       ===================================================== */

    function openPremiumOffer() {

        if (premiumStatus) {

            showPremiumAlreadyActive();

            return;

        }


        closePremiumModal();


        const overlay =
            document.createElement("div");


        overlay.id =
            "studyMindPremiumModal";


        overlay.className =
            "study-mind-premium-overlay premium-modal-root";


        overlay.innerHTML = `

            <div
                class="study-mind-premium-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="premiumModalTitle"
            >

                <button
                    type="button"
                    class="premium-modal-close"
                    id="premiumModalClose"
                    aria-label="Close"
                >
                    ×
                </button>


                <div class="premium-modal-icon">
                    👑
                </div>


                <span class="premium-modal-label">
                    STUDYMIND AI PREMIUM
                </span>


                <h2 id="premiumModalTitle">
                    Unlock the full StudyMind experience.
                </h2>


                <p class="premium-modal-description">
                    Get unlimited AI assistance, larger
                    knowledge checks, unlimited battles,
                    1v1 access and more.
                </p>


                <div class="premium-benefits">

                    <div>
                        <span>✓</span>
                        <strong>
                            Unlimited AI tools
                        </strong>
                    </div>

                    <div>
                        <span>✓</span>
                        <strong>
                            5–60 question knowledge checks
                        </strong>
                    </div>

                    <div>
                        <span>✓</span>
                        <strong>
                            Unlimited Game Mode battles
                        </strong>
                    </div>

                    <div>
                        <span>✓</span>
                        <strong>
                            Premium 1v1 access
                        </strong>
                    </div>

                    <div>
                        <span>✓</span>
                        <strong>
                            Premium gold experience
                        </strong>
                    </div>

                </div>


                <div class="premium-payment-title">
                    Choose your payment method
                </div>


                <div class="premium-payment-options">

                    <button
                        type="button"
                        class="premium-payment-button"
                        data-provider="paystack"
                    >
                        <span>🇳🇬</span>

                        <span>
                            <strong>
                                Paystack
                            </strong>

                            <small>
                                Nigerian payment
                            </small>
                        </span>
                    </button>


                    <button
                        type="button"
                        class="premium-payment-button"
                        data-provider="flutterwave"
                    >
                        <span>💳</span>

                        <span>
                            <strong>
                                Flutterwave
                            </strong>

                            <small>
                                Card & local payment
                            </small>
                        </span>
                    </button>


                    <button
                        type="button"
                        class="premium-payment-button"
                        data-provider="stripe"
                    >
                        <span>🌎</span>

                        <span>
                            <strong>
                                Stripe
                            </strong>

                            <small>
                                International payment
                            </small>
                        </span>
                    </button>

                </div>


                <p class="premium-secure-note">
                    🔒 Payment is processed securely by
                    your selected payment provider.
                </p>


                <div
                    id="premiumPaymentStatus"
                    class="premium-payment-status"
                ></div>

            </div>

        `;


        /*
         * IMPORTANT:
         * Put the modal INSIDE #premiumPage.
         * This prevents dashboard/global CSS from
         * styling it as a blue component.
         */

        const premiumPage =
            getPremiumPage();


        if (premiumPage) {

            premiumPage.appendChild(
                overlay
            );

        } else {

            document.body.appendChild(
                overlay
            );

        }


        applyPremiumPageGoldTheme();
        applyPremiumModalTheme();


        const closeButton =
            document.getElementById(
                "premiumModalClose"
            );


        if (closeButton) {

            closeButton.addEventListener(
                "click",
                closePremiumModal
            );

        }


        overlay.addEventListener(
            "click",
            event => {

                if (
                    event.target === overlay
                ) {

                    closePremiumModal();

                }

            }
        );


        overlay
            .querySelectorAll(
                "[data-provider]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            beginPremiumPayment(
                                button.dataset.provider
                            );

                        }
                    );

                }
            );


        requestAnimationFrame(
            applyPremiumModalTheme
        );

    }


    /* =====================================================
       CLOSE MODAL
       ===================================================== */

    function closePremiumModal() {

        const modal =
            document.getElementById(
                "studyMindPremiumModal"
            );


        if (modal) {

            modal.remove();

        }

    }


    /* =====================================================
       PAYMENT
       ===================================================== */

    async function beginPremiumPayment(
        provider
    ) {

        const status =
            document.getElementById(
                "premiumPaymentStatus"
            );


        if (status) {

            status.innerHTML =
                "⏳ Preparing secure checkout...";

        }


        const token =
            await getAccessToken();


        if (!token) {

            if (status) {

                status.innerHTML =
                    "🔒 Please log in before purchasing Premium.";

            }

            return;

        }


        try {

            const response =
                await fetch(
                    "/api/premium/create-checkout",
                    {
                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`

                        },

                        body:
                            JSON.stringify({
                                provider
                            })

                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data?.error ||
                    "Could not start payment."
                );

            }


            if (!data.checkoutUrl) {

                throw new Error(
                    "Payment provider did not return a checkout URL."
                );

            }


            window.location.href =
                data.checkoutUrl;


        } catch (error) {

            console.error(
                "Premium payment error:",
                error
            );


            if (status) {

                status.innerHTML =
                    `❌ ${escapePremiumText(
                        error.message
                    )}`;

            }

        }

    }


    /* =====================================================
       ALREADY PREMIUM
       ===================================================== */

    function showPremiumAlreadyActive() {

        closePremiumModal();


        const overlay =
            document.createElement("div");


        overlay.id =
            "studyMindPremiumModal";


        overlay.className =
            "study-mind-premium-overlay premium-modal-root";


        overlay.innerHTML = `

            <div
                class="study-mind-premium-modal"
                role="dialog"
                aria-modal="true"
            >

                <button
                    type="button"
                    class="premium-modal-close"
                    id="premiumActiveClose"
                    aria-label="Close"
                >
                    ×
                </button>


                <div class="premium-modal-icon">
                    👑
                </div>


                <span class="premium-modal-label">
                    PREMIUM ACTIVE
                </span>


                <h2>
                    You're already Premium.
                </h2>


                <p class="premium-modal-description">
                    Your StudyMind AI account has full
                    Premium access.
                </p>


                <div class="premium-active-list">

                    <div>
                        ✓ Unlimited AI
                    </div>

                    <div>
                        ✓ 5–60 question knowledge checks
                    </div>

                    <div>
                        ✓ Unlimited Game Mode
                    </div>

                    <div>
                        ✓ Premium 1v1 access
                    </div>

                    <div>
                        ✓ Gold Premium experience
                    </div>

                </div>


                <button
                    type="button"
                    class="premium-modal-primary"
                    id="premiumActiveContinue"
                >
                    Continue studying →
                </button>

            </div>

        `;


        const premiumPage =
            getPremiumPage();


        if (premiumPage) {

            premiumPage.appendChild(
                overlay
            );

        } else {

            document.body.appendChild(
                overlay
            );

        }


        applyPremiumPageGoldTheme();
        applyPremiumModalTheme();


        document
            .getElementById(
                "premiumActiveClose"
            )
            ?.addEventListener(
                "click",
                closePremiumModal
            );


        document
            .getElementById(
                "premiumActiveContinue"
            )
            ?.addEventListener(
                "click",
                closePremiumModal
            );


        requestAnimationFrame(
            applyPremiumModalTheme
        );

    }


    /* =====================================================
       ESCAPE TEXT
       ===================================================== */

    function escapePremiumText(
        value
    ) {

        return String(value || "")
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }


    /* =====================================================
       THEME LISTENER
       ===================================================== */

    function watchPremiumTheme() {

        window.addEventListener(
            "storage",
            event => {

                if (
                    event.key ===
                    "studyMindTheme"
                ) {

                    const page =
                        getPremiumPage();

                    if (!page) {
                        return;
                    }

                    let theme = null;

                    try {

                        theme =
                            localStorage.getItem(
                                "studyMindTheme"
                            );

                    } catch {

                        theme = null;

                    }


                    const isDark =
                        theme === "dark" ||
                        theme === null;


                    page.classList.toggle(
                        "premium-dark",
                        isDark
                    );


                    applyPremiumPageGoldTheme();
                    applyPremiumModalTheme();

                }

            }
        );

    }


    /* =====================================================
       INITIALISE
       ===================================================== */

    function initialisePremium() {

        /*
         * Make sure the page receives its gold theme
         * BEFORE Premium status is loaded.
         */

        const page =
            getPremiumPage();


        if (page) {

            let theme = null;

            try {

                theme =
                    localStorage.getItem(
                        "studyMindTheme"
                    );

            } catch {

                theme = null;

            }


            const isDark =
                theme === "dark" ||
                theme === null;


            page.classList.toggle(
                "premium-dark",
                isDark
            );


            applyPremiumPageGoldTheme();

        }


        /*
         * Restore cached Premium state.
         */

        premiumStatus =
            getCachedPremiumStatus();


        applyPremiumTheme();


        /*
         * Verify against server.
         */

        setTimeout(
            () => {

                loadStudyMindPremium();

            },
            0
        );


        watchPremiumTheme();

    }


    /* =====================================================
       GLOBAL API
       ===================================================== */

    window.isStudyMindPremium =
        isStudyMindPremium;


    window.isPremium =
        isPremium;


    window.loadStudyMindPremium =
        loadStudyMindPremium;


    window.waitForPremiumStatus =
        waitForPremiumStatus;


    window.openPremiumOffer =
        openPremiumOffer;


    window.closePremiumModal =
        closePremiumModal;


    window.beginPremiumPayment =
        beginPremiumPayment;


    window.applyPremiumTheme =
        applyPremiumTheme;


    window.getStudyMindPremiumStatus =
        () => premiumStatus;


    window.applyStudyMindPremiumModalTheme =
        applyPremiumModalTheme;


    /* =====================================================
       START
       ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialisePremium
        );

    } else {

        initialisePremium();

    }

})();
