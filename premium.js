"use strict";

/* =========================================================
   STUDYMIND AI — PREMIUM SYSTEM
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
       PREMIUM PAGE HELPERS
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
         * Mark the dynamically generated modal as
         * belonging to the Premium system.
         */

        modal.classList.add(
            "premium-modal-root"
        );


        /*
         * Keep the modal synchronized with the
         * Premium page's light/dark state.
         */

        modal.classList.toggle(
            "premium-dark",
            isPremiumPageDark()
        );


        /*
         * Copy the Premium CSS variables from
         * .premium-page onto the modal root.
         *
         * This allows premium.js to remain compatible
         * with the namespaced premium.html.
         */

        if (!page) {

            return;

        }


        const computedStyle =
            window.getComputedStyle(
                page
            );


        const variables = [

            "--premium-bg",

            "--premium-bg-soft",

            "--premium-card",

            "--premium-card-solid",

            "--premium-card-border",

            "--premium-text",

            "--premium-muted",

            "--premium-gold",

            "--premium-gold-light",

            "--premium-gold-mid",

            "--premium-gold-dark",

            "--premium-gold-gradient",

            "--premium-gold-gradient-soft",

            "--premium-green",

            "--premium-danger",

            "--premium-shadow",

            "--premium-premium-shadow"

        ];


        variables.forEach(
            variable => {

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

            }
        );

    }


    /* =====================================================
       APPLY PREMIUM THEME
       ===================================================== */

    function applyPremiumTheme() {

        const enabled =
            premiumStatus === true;


        /*
         * Preserve the existing global Premium classes.
         */

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


        /*
         * Update the Premium page if it exists.
         */

        const premiumPage =
            getPremiumPage();


        if (premiumPage) {

            /*
             * The page itself always uses its gold
             * Premium styling. Premium status controls
             * the UI state, not whether the page becomes
             * blue or another color.
             */

            premiumPage.classList.toggle(
                "premium-active",
                enabled
            );

            premiumPage.classList.toggle(
                "premium-dark",
                premiumPage.classList.contains(
                    "premium-dark"
                )
            );

        }


        updatePremiumUI();


        /*
         * Make sure an already-open dynamic modal
         * receives the current Premium theme.
         */

        applyPremiumModalTheme();

    }


    /* =====================================================
       PREMIUM UI
       ===================================================== */

    function updatePremiumUI() {

        const buttons =
            document.querySelectorAll(
                "[data-premium-button]"
            );


        buttons.forEach(
            button => {

                if (premiumStatus) {

                    button.textContent =
                        "👑 Premium Active";

                    button.classList.add(
                        "premium-active"
                    );

                } else {

                    /*
                     * Do not overwrite the original
                     * button text while the user is Free.
                     */

                    button.classList.remove(
                        "premium-active"
                    );

                }

            }
        );


        const badges =
            document.querySelectorAll(
                "[data-premium-badge]"
            );


        badges.forEach(
            badge => {

                badge.textContent =
                    premiumStatus
                        ? "👑 PREMIUM"
                        : "FREE";

            }
        );


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
         * Restore cached status immediately.
         *
         * This is only a temporary visual cache.
         * The server remains the source of truth.
         */

        premiumStatus =
            getCachedPremiumStatus();


        applyPremiumTheme();


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
             * Never grant Premium when the
             * server verification fails.
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


        /*
         * These classes allow the Premium HTML
         * stylesheet to recognize the dynamically
         * generated modal.
         */

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

                        <span>
                            🇳🇬
                        </span>

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

                        <span>
                            💳
                        </span>

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

                        <span>
                            🌎
                        </span>

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


        document.body.appendChild(
            overlay
        );


        /*
         * Apply Premium variables immediately.
         */

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


        /*
         * Reapply after the browser has inserted
         * the modal into the document.
         */

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


        document.body.appendChild(
            overlay
        );


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
       INITIALISE
       ===================================================== */

    function initialisePremium() {

        /*
         * Restore cached Premium state first.
         */

        premiumStatus =
            getCachedPremiumStatus();


        applyPremiumTheme();


        /*
         * Verify the real Premium status
         * against Supabase/server immediately.
         */

        setTimeout(
            () => {

                loadStudyMindPremium();

            },
            0
        );

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


    /*
     * Optional public helper for the Premium page.
     */

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
