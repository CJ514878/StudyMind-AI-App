
/* =========================================================
   STUDYMIND AI — PREMIUM MANAGEMENT
   COMPLETE REPLACEMENT

   FEATURES:
   - Server-authoritative Premium verification
   - Admin Premium access
   - One-time 7-day free trial
   - Weekly, Monthly and Yearly plans
   - Paystack and Flutterwave checkout
   - Manual bank-transfer submission
   - Payment reference validation
   - Pending payment confirmation
   - Premium theme management
   - Supabase authentication listener

   SECURITY:
   - Server controls subscription prices.
   - Students cannot approve payments.
   - Manual payments remain pending until admin approval.
   - No secret keys are exposed in this file.
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
        MANUAL_SUBMIT_ENDPOINT: "/api/premium/manual/submit",

        STORAGE_KEY: "studyMindPremium",
        THEME_KEY: "studyMindTheme",

        CHANGE_EVENT: "studyMindPremiumChanged",

        ADMIN_EMAIL: "studymindaiofficial@gmail.com"
    };


    /* =====================================================
       PLAN INFORMATION

       These prices are displayed to students.
       The backend remains responsible for validating
       the actual payment amount.
    ===================================================== */

    const PLANS = {
        weekly: {
            name: "Weekly",
            amount: 1000,
            duration: "7 days"
        },

        monthly: {
            name: "Monthly",
            amount: 3900,
            duration: "1 month"
        },

        yearly: {
            name: "Yearly",
            amount: 46000,
            duration: "1 year"
        }
    };


    /* =====================================================
       BANK TRANSFER DETAILS

       Replace these placeholders privately with the
       approved account details before accepting transfers.

       Do not put passwords, API keys or secret credentials
       in this section.
    ===================================================== */

    const BANK_TRANSFER_DETAILS = {
        bankName: "Moniepoint",
        accountName: "Chijindum Joshua Chukwumerije",
        accountNumber: "8148165088"
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
    let manualSubmissionRunning = false;
    let checkoutRunning = false;

    let selectedPlan = "weekly";
    let modalCreated = false;


    /* =====================================================
       HELPERS
    ===================================================== */

    function escapeHTML(value) {

        return String(value ?? "").replace(
            /[&<>"']/g,
            character => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            })[character]
        );

    }


    function formatAmount(amount) {

        return "₦" + Number(amount).toLocaleString("en-NG");

    }


    function getPlan(plan) {

        return PLANS[plan] || null;

    }


    function getSupabaseClient() {

        return (
            window.supabaseClient ||
            window.studyMindSupabase ||
            window.gameSupabase ||
            null
        );

    }


    async function getAccessToken() {

        const client = getSupabaseClient();

        if (!client?.auth) {
            return null;
        }

        try {

            const {
                data,
                error
            } = await client.auth.getSession();

            if (error) {
                console.error("Premium session error:", error);
                return null;
            }

            return data?.session?.access_token || null;

        } catch (error) {

            console.error("Premium session error:", error);
            return null;

        }

    }


    async function readJSON(response) {

        try {
            return await response.json();
        } catch (error) {
            return {};
        }

    }


    /* =====================================================
       PREMIUM THEME
    ===================================================== */

    function applyPremiumTheme() {

        const enabled =
            statusLoaded && premiumStatus === true;

        [
            document.documentElement,
            document.body
        ].forEach(element => {

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
    ===================================================== */

    function updatePremiumState(
        isPremium,
        isAdmin,
        details = {}
    ) {

        premiumStatus = isPremium === true;
        adminStatus = isAdmin === true;

        trialStatus = details.isTrial === true;

        trialStartsAt = details.startsAt || null;

        trialExpiresAt =
            details.expiresAt ||
            details.trialExpiresAt ||
            null;

        planType = details.planType || null;

        statusLoaded = true;

        try {

            localStorage.setItem(
                CONFIG.STORAGE_KEY,
                premiumStatus ? "true" : "false"
            );

        } catch (error) {

            console.warn("Premium cache unavailable:", error);

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

                    updatePremiumState(false, false);

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

                const data = await readJSON(response);

                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        data.error ||
                        "Premium verification failed."
                    );

                }

                const isAdmin =
                    data?.isAdmin === true;

                const isPremium =
                    data?.premium === true || isAdmin;

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

                console.log("StudyMind Premium:", {
                    premium: premiumStatus,
                    admin: adminStatus,
                    trial: trialStatus,
                    planType: planType,
                    expiresAt: trialExpiresAt
                });

                return premiumStatus;

            } catch (error) {

                console.error(
                    "Premium verification failed:",
                    error
                );

                updatePremiumState(false, false);

                return false;

            }

        })();

        try {

            return await statusPromise;

        } finally {

            statusPromise = null;

        }

    }


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

        return statusLoaded && premiumStatus === true;

    }


    function isStudyMindPremium() {

        return isPremium();

    }


    function isPremiumTrial() {

        return (
            statusLoaded &&
            premiumStatus &&
            trialStatus
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
       CREATE PREMIUM MODAL
    ===================================================== */

    function createPremiumModal() {

        if (modalCreated) {
            return document.getElementById("premiumModal");
        }

        const page =
            document.querySelector(".premium-page");

        if (!page) {
            console.error("Premium page container not found.");
            return null;
        }

        const overlay = document.createElement("div");

        overlay.id = "premiumModal";

        overlay.className =
            "study-mind-premium-overlay";

        overlay.setAttribute("aria-hidden", "true");

        overlay.setAttribute("role", "dialog");

        overlay.setAttribute(
            "aria-label",
            "StudyMind Premium purchase options"
        );

        overlay.style.setProperty(
            "display",
            "none",
            "important"
        );

        const bankName =
            escapeHTML(BANK_TRANSFER_DETAILS.bankName);

        const accountName =
            escapeHTML(BANK_TRANSFER_DETAILS.accountName);

        const accountNumber =
            escapeHTML(BANK_TRANSFER_DETAILS.accountNumber);

        overlay.innerHTML = `
            <div class="study-mind-premium-modal">

                <button
                    type="button"
                    class="premium-modal-close"
                    id="closePremiumModal"
                    aria-label="Close"
                >
                    &times;
                </button>

                <div class="premium-modal-icon">👑</div>

                <div class="premium-modal-label">
                    STUDYMIND AI PREMIUM
                </div>

                <h2>Choose your Premium plan</h2>

                <p class="premium-modal-description">
                    Select a plan and payment method to unlock
                    the complete StudyMind AI experience.
                </p>

                <div class="premium-benefits">
                    <div><span>✓</span> Unlimited AI assistance</div>
                    <div><span>✓</span> Knowledge checks up to 60 questions</div>
                    <div><span>✓</span> Unlimited Game Mode battles</div>
                    <div><span>✓</span> Premium 1v1 access</div>
                    <div><span>✓</span> Premium gold experience</div>
                </div>

                <div class="premium-payment-title">
                    1. Select your plan
                </div>

                <div class="premium-payment-options">

                    <button
                        type="button"
                        class="premium-payment-button"
                        data-select-plan="weekly"
                    >
                        <span>📅</span>
                        <span>
                            <strong>Weekly — ₦1,000</strong>
                            <small>7 days of Premium access</small>
                        </span>
                    </button>

                    <button
                        type="button"
                        class="premium-payment-button"
                        data-select-plan="monthly"
                    >
                        <span>⭐</span>
                        <span>
                            <strong>Monthly — ₦3,900</strong>
                            <small>1 month of Premium access</small>
                        </span>
                    </button>

                    <button
                        type="button"
                        class="premium-payment-button"
                        data-select-plan="yearly"
                    >
                        <span>👑</span>
                        <span>
                            <strong>Yearly — ₦46,000</strong>
                            <small>1 year of Premium access</small>
                        </span>
                    </button>

                </div>

                <p
                    id="premiumSelectedPlan"
                    class="premium-payment-status"
                    aria-live="polite"
                >
                    Selected plan: Weekly — ₦1,000
                </p>

                <div class="premium-payment-title">
                    2. Choose a payment method
                </div>

                <div class="premium-payment-options">

                    <button
                        type="button"
                        class="premium-payment-button"
                        data-premium-provider="paystack"
                    >
                        <span>💳</span>
                        <span>
                            <strong>Pay with Paystack</strong>
                            <small>Secure online payment</small>
                        </span>
                    </button>

                    <button
                        type="button"
                        class="premium-payment-button"
                        data-premium-provider="flutterwave"
                    >
                        <span>💳</span>
                        <span>
                            <strong>Pay with Flutterwave</strong>
                            <small>Secure online payment</small>
                        </span>
                    </button>

                </div>

                <div class="premium-payment-title">
                    Or pay by bank transfer
                </div>

                <div class="premium-payment-button">
                    <span>🏦</span>
                    <span>
                        <strong>Bank transfer</strong>
                        <small>Transfer the exact amount shown below.</small>
                    </span>
                </div>

                <div class="premium-active-list">

                    <div>
                        <strong>Bank:</strong> ${bankName}
                    </div>

                    <div>
                        <strong>Account name:</strong> ${accountName}
                    </div>

                    <div>
                        <strong>Account number:</strong> ${accountNumber}
                    </div>

                    <div>
                        <strong>Amount:</strong>
                        <span id="premiumTransferAmount">₦1,000</span>
                    </div>

                </div>

                <p class="premium-secure-note">
                    Transfer only to the account details confirmed
                    by the authorized account holder. Keep your
                    payment reference for submission below.
                </p>

                <form id="premiumManualPaymentForm">

                    <label
                        for="premiumPaymentReference"
                        style="
                            display:block;
                            margin:18px 0 8px;
                            font-weight:800;
                        "
                    >
                        Bank payment reference
                    </label>

                    <input
                        id="premiumPaymentReference"
                        name="payment_reference"
                        type="text"
                        minlength="4"
                        maxlength="120"
                        required
                        autocomplete="off"
                        placeholder="Enter your transfer reference"
                        style="
                            width:100%;
                            min-height:48px;
                            padding:12px;
                            border:1px solid rgba(184,132,18,.35);
                            border-radius:12px;
                            font:inherit;
                            box-sizing:border-box;
                        "
                    >

                    <button
                        type="submit"
                        class="premium-modal-primary"
                        id="premiumManualSubmitButton"
                        style="margin-top:14px;"
                    >
                        Submit payment reference
                    </button>

                </form>

                <p
                    id="premiumManualPaymentStatus"
                    class="premium-payment-status"
                    aria-live="polite"
                ></p>

                <div class="premium-payment-title">
                    Want to try Premium first?
                </div>

                <button
                    type="button"
                    class="premium-modal-primary"
                    data-premium-trial
                >
                    Start my 7-day free trial
                </button>

                <p class="premium-secure-note">
                    Your free trial is available once per account.
                    It starts only when you select the button above.
                </p>

                <p class="premium-secure-note">
                    Manual bank transfers remain pending until
                    an administrator independently verifies payment.
                </p>

            </div>
        `;

        page.appendChild(overlay);

        modalCreated = true;

        setupModalButtons();

        selectPremiumPlan("weekly");

        return overlay;

    }


    /* =====================================================
       PLAN SELECTION
    ===================================================== */

    function selectPremiumPlan(plan) {

        if (!PLANS[plan]) {
            return false;
        }

        selectedPlan = plan;

        const selected = PLANS[plan];

        const selectedLabel =
            document.getElementById("premiumSelectedPlan");

        const amountLabel =
            document.getElementById("premiumTransferAmount");

        if (selectedLabel) {

            selectedLabel.textContent =
                `Selected plan: ${selected.name} — ${formatAmount(selected.amount)}`;

        }

        if (amountLabel) {

            amountLabel.textContent =
                formatAmount(selected.amount);

        }

        document
            .querySelectorAll("[data-select-plan]")
            .forEach(button => {

                const active =
                    button.dataset.selectPlan === plan;

                button.style.borderColor =
                    active ? "var(--premium-gold)" : "";

                button.style.background =
                    active
                        ? "rgba(211,164,56,0.16)"
                        : "";

                button.setAttribute(
                    "aria-pressed",
                    active ? "true" : "false"
                );

            });

        return true;

    }


    /* =====================================================
       OPEN AND CLOSE MODAL
    ===================================================== */

    function openPremiumOffer() {

        if (isPremium()) {

            alert(
                "Your account already has Premium access."
            );

            return;

        }

        const modal = createPremiumModal();

        if (!modal) {
            alert("Unable to open Premium options. Please refresh the page.");
            return;
        }

        modal.style.setProperty(
            "display",
            "flex",
            "important"
        );

        modal.classList.add("active");

        modal.setAttribute("aria-hidden", "false");

        document.body.style.overflow = "hidden";

    }


    function closePremiumModal() {

        const modal =
            document.getElementById("premiumModal");

        if (!modal) return;

        modal.style.setProperty(
            "display",
            "none",
            "important"
        );

        modal.classList.remove("active");

        modal.setAttribute("aria-hidden", "true");

        document.body.style.overflow = "";

    }


    /* =====================================================
       CHECK BANK DETAILS
    ===================================================== */

    function areBankDetailsConfigured() {

        const values = [
            BANK_TRANSFER_DETAILS.bankName,
            BANK_TRANSFER_DETAILS.accountName,
            BANK_TRANSFER_DETAILS.accountNumber
        ];

        return values.every(value => {

            const text = String(value || "").trim();

            return (
                text.length > 0 &&
                !text.startsWith("ADD ")
            );

        });

    }


    /* =====================================================
       ONLINE CHECKOUT
    ===================================================== */

    async function beginPremiumPayment(
        provider,
        requestedPlan = selectedPlan
    ) {

        const allowedProviders = [
            "paystack",
            "flutterwave"
        ];

        const selectedProvider =
            String(provider || "").toLowerCase();

        const selected = getPlan(requestedPlan);

        if (!allowedProviders.includes(selectedProvider)) {

            alert("This payment provider is unavailable.");

            return false;

        }

        if (!selected) {

            alert("Please select a valid Premium plan.");

            return false;

        }

        if (checkoutRunning) {
            return false;
        }

        checkoutRunning = true;

        const buttons = document.querySelectorAll(
            "[data-premium-provider]"
        );

        buttons.forEach(button => {
            button.disabled = true;
        });

        try {

            const token = await getAccessToken();

            if (!token) {

                alert("Please sign in before purchasing Premium.");

                window.location.href = "login.html";

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
                        provider: selectedProvider,
                        plan_type: requestedPlan
                    })
                }
            );

            const data = await readJSON(response);

            if (!response.ok) {

                throw new Error(
                    data.error ||
                    data.message ||
                    "Could not start payment."
                );

            }

            const checkoutUrl =
                data.checkoutUrl ||
                data.checkout_url ||
                data.authorization_url ||
                data.url;

            if (!checkoutUrl) {

                throw new Error(
                    "The payment link was not returned by the server."
                );

            }

            window.location.href = checkoutUrl;

            return true;

        } catch (error) {

            console.error("Premium checkout error:", error);

            alert(
                error.message ||
                "Unable to start payment. Please try again."
            );

            return false;

        } finally {

            checkoutRunning = false;

            buttons.forEach(button => {
                button.disabled = false;
            });

        }

    }


    /* =====================================================
       MANUAL BANK TRANSFER SUBMISSION
    ===================================================== */

    async function submitManualPayment(event) {

        if (event) {
            event.preventDefault();
        }

        if (manualSubmissionRunning) {
            return false;
        }

        if (!PLANS[selectedPlan]) {

            showManualPaymentMessage(
                "Please select a Premium plan.",
                true
            );

            return false;

        }

        if (!areBankDetailsConfigured()) {

            showManualPaymentMessage(
                "Bank transfer details have not been configured yet. Please contact the StudyMind administrator.",
                true
            );

            return false;

        }

        const referenceInput =
            document.getElementById("premiumPaymentReference");

        const submitButton =
            document.getElementById("premiumManualSubmitButton");

        const reference =
            String(referenceInput?.value || "").trim();

        if (reference.length < 4 || reference.length > 120) {

            showManualPaymentMessage(
                "Please enter a valid payment reference.",
                true
            );

            return false;

        }

        const token = await getAccessToken();

        if (!token) {

            alert("Please sign in before submitting a payment reference.");

            window.location.href = "login.html";

            return false;

        }

        manualSubmissionRunning = true;

        if (submitButton) {

            submitButton.disabled = true;

            submitButton.textContent = "Submitting...";

        }

        try {

            const response = await fetch(
                CONFIG.MANUAL_SUBMIT_ENDPOINT,
                {
                    method: "POST",

                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        plan_type: selectedPlan,
                        payment_reference: reference
                    })
                }
            );

            const data = await readJSON(response);

            if (!response.ok || data.success !== true) {

                throw new Error(
                    data.message ||
                    data.error ||
                    "Could not submit your payment request."
                );

            }

            showManualPaymentMessage(
                "Payment reference submitted successfully. Your request is now pending admin verification. Premium will activate only after payment is confirmed.",
                false
            );

            if (referenceInput) {
                referenceInput.value = "";
            }

            if (submitButton) {
                submitButton.textContent = "Request submitted";
            }

            const statusCard =
                document.getElementById("premiumStatusCard");

            const navStatus =
                document.getElementById("premiumNavStatus");

            if (statusCard) {

                statusCard.innerHTML = `
                    <div class="premium-status-heading">
                        Payment Pending
                    </div>

                    <div class="premium-status-description">
                        Your payment reference has been submitted.
                        Premium will activate after an administrator
                        verifies the transfer.
                    </div>
                `;

            }

            if (navStatus) {

                navStatus.textContent = "Payment Pending";

                navStatus.className =
                    "premium-nav-status pending";

            }

            const premiumButtons =
                document.querySelectorAll(
                    ".plan.premium [data-premium-button], " +
                    ".bottom-cta [data-premium-button]"
                );

            premiumButtons.forEach(button => {

                button.textContent = "Payment Pending";

                button.disabled = true;

            });

            return true;

        } catch (error) {

            console.error(
                "Manual payment submission error:",
                error
            );

            showManualPaymentMessage(
                error.message ||
                "Unable to submit your payment reference.",
                true
            );

            if (submitButton) {
                submitButton.textContent = "Submit payment reference";
            }

            return false;

        } finally {

            manualSubmissionRunning = false;

            if (submitButton) {

                submitButton.disabled = false;

                if (
                    submitButton.textContent === "Submitting..."
                ) {
                    submitButton.textContent =
                        "Submit payment reference";
                }

            }

        }

    }


    function showManualPaymentMessage(message, isError) {

        const status =
            document.getElementById(
                "premiumManualPaymentStatus"
            );

        if (!status) return;

        status.textContent = message;

        status.style.color = isError
            ? "#b42318"
            : "#18794e";

    }


    /* =====================================================
       START FREE TRIAL
    ===================================================== */

    async function beginPremiumTrial() {

        if (trialRequestRunning) {
            return false;
        }

        if (isPremium()) {

            alert("Your account already has Premium access.");

            return false;

        }

        trialRequestRunning = true;

        const token = await getAccessToken();

        if (!token) {

            trialRequestRunning = false;

            alert("Please sign in before starting your free trial.");

            window.location.href = "login.html";

            return false;

        }

        const trialButtons = document.querySelectorAll(
            "[data-premium-trial]"
        );

        trialButtons.forEach(button => {
            button.disabled = true;
            button.setAttribute("aria-busy", "true");
            button.textContent = "Starting trial...";
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

            const data = await readJSON(response);

            if (!response.ok || data.success !== true) {

                throw new Error(
                    data.error ||
                    data.message ||
                    "Could not start your free trial."
                );

            }

            await loadStudyMindPremium(true);

            if (!isPremium()) {

                throw new Error(
                    "Your trial was created, but Premium status could not be verified. Please refresh the page."
                );

            }

            closePremiumModal();

            alert("Your 7-day Premium trial has started!");

            return true;

        } catch (error) {

            console.error("Premium trial error:", error);

            alert(
                error.message ||
                "Unable to start your free trial."
            );

            return false;

        } finally {

            trialRequestRunning = false;

            trialButtons.forEach(button => {

                button.disabled = false;

                button.removeAttribute("aria-busy");

                button.textContent =
                    "Start my 7-day free trial";

            });

        }

    }


    /* =====================================================
       MODAL BUTTONS
    ===================================================== */

    function setupModalButtons() {

        const closeButton =
            document.getElementById("closePremiumModal");

        if (
            closeButton &&
            !closeButton.dataset.premiumInitialized
        ) {

            closeButton.dataset.premiumInitialized = "true";

            closeButton.addEventListener(
                "click",
                closePremiumModal
            );

        }

        document
            .querySelectorAll("[data-select-plan]")
            .forEach(button => {

                if (button.dataset.premiumInitialized) {
                    return;
                }

                button.dataset.premiumInitialized = "true";

                button.addEventListener("click", function () {

                    selectPremiumPlan(
                        button.dataset.selectPlan
                    );

                });

            });

        document
            .querySelectorAll("[data-premium-provider]")
            .forEach(button => {

                if (button.dataset.premiumInitialized) {
                    return;
                }

                button.dataset.premiumInitialized = "true";

                button.addEventListener("click", function () {

                    beginPremiumPayment(
                        button.dataset.premiumProvider,
                        selectedPlan
                    );

                });

            });

        document
            .querySelectorAll("[data-premium-trial]")
            .forEach(button => {

                if (button.dataset.premiumInitialized) {
                    return;
                }

                button.dataset.premiumInitialized = "true";

                button.addEventListener(
                    "click",
                    beginPremiumTrial
                );

            });

        const form =
            document.getElementById(
                "premiumManualPaymentForm"
            );

        if (
            form &&
            !form.dataset.premiumInitialized
        ) {

            form.dataset.premiumInitialized = "true";

            form.addEventListener(
                "submit",
                submitManualPayment
            );

        }

        const overlay =
            document.getElementById("premiumModal");

        if (
            overlay &&
            !overlay.dataset.premiumInitialized
        ) {

            overlay.dataset.premiumInitialized = "true";

            overlay.addEventListener("click", function (event) {

                if (event.target === overlay) {
                    closePremiumModal();
                }

            });

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

        client.auth.onAuthStateChange(function (event) {

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

        });

    }


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    async function initializePremium() {

        registerAuthListener();

        createPremiumModal();

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

    window.selectPremiumPlan =
        selectPremiumPlan;

    window.submitManualPayment =
        submitManualPayment;


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


    window.addEventListener(
        "load",
        registerAuthListener,
        { once: true }
    );

})();
