/* =========================================================
   STUDYMIND AI — PREMIUM SYSTEM
   REAL SUPABASE-BACKED PREMIUM ENTITLEMENT
========================================================= */

"use strict";

const STUDYMIND_PREMIUM_KEY = "studyMindPremiumState";
const STUDYMIND_THEME_KEY = "studyMindTheme";

let studyMindPremium = false;
let studyMindPremiumLoaded = false;


/* =========================================================
   SUPABASE CLIENT
========================================================= */

function getPremiumSupabase() {
    if (
        typeof supabaseClient !== "undefined" &&
        supabaseClient
    ) {
        return supabaseClient;
    }

    if (
        typeof supabase !== "undefined" &&
        supabase
    ) {
        return supabase;
    }

    return null;
}


/* =========================================================
   PREMIUM STATUS
========================================================= */

function isStudyMindPremium() {
    return studyMindPremium === true;
}


async function loadStudyMindPremium() {

    const client =
        getPremiumSupabase();

    if (!client) {
        studyMindPremium = false;
        studyMindPremiumLoaded = true;
        applyStudyMindPremiumTheme();
        return false;
    }

    try {

        const {
            data: {
                session
            }
        } =
            await client.auth.getSession();

        if (!session) {

            studyMindPremium = false;
            studyMindPremiumLoaded = true;

            applyStudyMindPremiumTheme();

            return false;
        }


        const response =
            await fetch(
                "/api/premium/status",
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${session.access_token}`
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {
            throw new Error(
                data?.error ||
                "Unable to load Premium status."
            );
        }


        studyMindPremium =
            data?.premium === true;


        studyMindPremiumLoaded =
            true;


        /*
         * Keep a local cache ONLY for UI restoration.
         *
         * This is NOT the source of truth.
         */
        localStorage.setItem(
            STUDYMIND_PREMIUM_KEY,
            JSON.stringify({
                premium:
                    studyMindPremium,

                checkedAt:
                    Date.now()
            })
        );


        applyStudyMindPremiumTheme();

        updatePremiumUI();


        return studyMindPremium;

    } catch (error) {

        console.error(
            "StudyMind Premium status error:",
            error
        );


        /*
         * Never grant Premium because of
         * a localStorage value.
         */
        studyMindPremium = false;
        studyMindPremiumLoaded = true;

        applyStudyMindPremiumTheme();

        return false;
    }
}


/* =========================================================
   PREMIUM THEME
========================================================= */

function applyStudyMindPremiumTheme() {

    const html =
        document.documentElement;

    const body =
        document.body;


    if (isStudyMindPremium()) {

        html.classList.add(
            "study-mind-premium"
        );

        if (body) {
            body.classList.add(
                "study-mind-premium"
            );
        }

        html.dataset.premium =
            "true";

    } else {

        html.classList.remove(
            "study-mind-premium"
        );

        if (body) {
            body.classList.remove(
                "study-mind-premium"
            );
        }

        delete html.dataset.premium;
    }
}


/* =========================================================
   PREMIUM UI
========================================================= */

function updatePremiumUI() {

    const buttons =
        document.querySelectorAll(
            "[data-premium-feature]"
        );


    buttons.forEach(
        button => {

            if (isStudyMindPremium()) {

                button.classList.add(
                    "premium-unlocked"
                );

                button.classList.remove(
                    "premium-locked"
                );

            } else {

                button.classList.remove(
                    "premium-unlocked"
                );
            }
        }
    );


    const badges =
        document.querySelectorAll(
            ".study-mind-premium-badge"
        );


    badges.forEach(
        badge => {

            badge.textContent =
                isStudyMindPremium()
                    ? "💎 PREMIUM"
                    : "FREE";
        }
    );
}


/* =========================================================
   PREMIUM MODAL
========================================================= */

function openPremiumOffer() {

    if (isStudyMindPremium()) {

        showPremiumAlreadyActive();

        return;
    }


    const existing =
        document.getElementById(
            "studyMindPremiumModal"
        );


    if (existing) {
        existing.remove();
    }


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "studyMindPremiumModal";


    modal.innerHTML = `

        <div class="sm-premium-overlay">

            <div class="sm-premium-modal">

                <button
                    type="button"
                    class="sm-premium-close"
                    id="closeStudyMindPremium"
                    aria-label="Close"
                >
                    ×
                </button>


                <div class="sm-premium-crown">
                    💎
                </div>


                <div class="sm-premium-eyebrow">
                    STUDYMIND PREMIUM
                </div>


                <h2>
                    Study without limits.
                </h2>


                <p class="sm-premium-subtitle">
                    Unlock the full StudyMind AI
                    experience and get more from
                    every study session.
                </p>


                <div class="sm-premium-features">

                    <div class="sm-premium-feature">
                        <span>🤖</span>
                        <div>
                            <strong>
                                Unlimited AI
                            </strong>
                            <small>
                                Ask StudyMind AI
                                whenever you need help.
                            </small>
                        </div>
                    </div>


                    <div class="sm-premium-feature">
                        <span>🧠</span>
                        <div>
                            <strong>
                                Up to 60 questions
                            </strong>
                            <small>
                                Build deeper knowledge
                                checks for every topic.
                            </small>
                        </div>
                    </div>


                    <div class="sm-premium-feature">
                        <span>⚔️</span>
                        <div>
                            <strong>
                                Unlimited Game Mode
                            </strong>
                            <small>
                                Play battles without the
                                free-user limit.
                            </small>
                        </div>
                    </div>


                    <div class="sm-premium-feature">
                        <span>🏆</span>
                        <div>
                            <strong>
                                1v1 & Tournaments
                            </strong>
                            <small>
                                Unlock Premium competitive
                                features.
                            </small>
                        </div>
                    </div>


                    <div class="sm-premium-feature">
                        <span>✨</span>
                        <div>
                            <strong>
                                Premium Gold Experience
                            </strong>
                            <small>
                                Your StudyMind interface
                                gets the Premium treatment.
                            </small>
                        </div>
                    </div>

                </div>


                <div class="sm-premium-divider"></div>


                <h3>
                    Choose your payment method
                </h3>


                <div class="sm-payment-options">

                    <button
                        type="button"
                        class="sm-payment-button"
                        data-payment-provider="paystack"
                    >
                        <span>💳</span>
                        <span>
                            <strong>Paystack</strong>
                            <small>Pay securely</small>
                        </span>
                    </button>


                    <button
                        type="button"
                        class="sm-payment-button"
                        data-payment-provider="flutterwave"
                    >
                        <span>💳</span>
                        <span>
                            <strong>Flutterwave</strong>
                            <small>Pay securely</small>
                        </span>
                    </button>


                    <button
                        type="button"
                        class="sm-payment-button"
                        data-payment-provider="stripe"
                    >
                        <span>💳</span>
                        <span>
                            <strong>Stripe</strong>
                            <small>Pay securely</small>
                        </span>
                    </button>

                </div>


                <div
                    id="smPremiumPaymentStatus"
                    class="sm-premium-payment-status"
                ></div>


                <p class="sm-premium-secure">
                    🔒 Secure payment • Premium is
                    attached to your StudyMind account
                </p>

            </div>

        </div>
    `;


    document.body.appendChild(
        modal
    );


    const closeButton =
        document.getElementById(
            "closeStudyMindPremium"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closePremiumOffer
        );
    }


    const overlay =
        modal.querySelector(
            ".sm-premium-overlay"
        );


    if (overlay) {

        overlay.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    overlay
                ) {
                    closePremiumOffer();
                }
            }
        );
    }


    const paymentButtons =
        modal.querySelectorAll(
            "[data-payment-provider]"
        );


    paymentButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                function () {

                    const provider =
                        this.dataset
                            .paymentProvider;

                    beginPremiumPayment(
                        provider
                    );
                }
            );
        }
    );
}


function closePremiumOffer() {

    const modal =
        document.getElementById(
            "studyMindPremiumModal"
        );

    if (modal) {
        modal.remove();
    }
}


/* =========================================================
   PAYMENT
========================================================= */

async function beginPremiumPayment(
    provider
) {

    const client =
        getPremiumSupabase();


    if (!client) {

        alert(
            "Please refresh the page and try again."
        );

        return;
    }


    const {
        data: {
            session
        }
    } =
        await client.auth.getSession();


    if (!session) {

        window.location.href =
            "login.html";

        return;
    }


    const status =
        document.getElementById(
            "smPremiumPaymentStatus"
        );


    if (status) {

        status.textContent =
            "⏳ Preparing secure checkout...";

        status.className =
            "sm-premium-payment-status loading";
    }


    const buttons =
        document.querySelectorAll(
            "[data-payment-provider]"
        );


    buttons.forEach(
        button => {
            button.disabled = true;
        }
    );


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
                            `Bearer ${session.access_token}`
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
                "Unable to start payment."
            );
        }


        if (
            !data.checkoutUrl
        ) {
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

            status.textContent =
                error.message ||
                "Unable to start payment.";

            status.className =
                "sm-premium-payment-status error";
        }


        buttons.forEach(
            button => {
                button.disabled = false;
            }
        );
    }
}


/* =========================================================
   ALREADY PREMIUM
========================================================= */

function showPremiumAlreadyActive() {

    const existing =
        document.getElementById(
            "studyMindPremiumModal"
        );


    if (existing) {
        existing.remove();
    }


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "studyMindPremiumModal";


    modal.innerHTML = `

        <div class="sm-premium-overlay">

            <div class="sm-premium-modal sm-premium-active">

                <div class="sm-premium-crown">
                    👑
                </div>

                <div class="sm-premium-eyebrow">
                    STUDYMIND PREMIUM
                </div>

                <h2>
                    Premium is active.
                </h2>

                <p>
                    You already have full Premium
                    access on this StudyMind account.
                </p>

                <div class="sm-premium-active-list">

                    <div>✓ Unlimited AI</div>
                    <div>✓ Up to 60-question knowledge checks</div>
                    <div>✓ Unlimited Game Mode</div>
                    <div>✓ 1v1 access</div>
                    <div>✓ Tournament access</div>
                    <div>✓ Premium Gold Experience</div>

                </div>

                <button
                    type="button"
                    class="sm-premium-main-button"
                    onclick="closePremiumOffer()"
                >
                    Continue Studying →
                </button>

            </div>

        </div>
    `;


    document.body.appendChild(
        modal
    );
}


/* =========================================================
   GLOBAL API
========================================================= */

window.isStudyMindPremium =
    isStudyMindPremium;

window.loadStudyMindPremium =
    loadStudyMindPremium;

window.openPremiumOffer =
    openPremiumOffer;

window.closePremiumOffer =
    closePremiumOffer;

window.applyStudyMindPremiumTheme =
    applyStudyMindPremiumTheme;


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        applyStudyMindPremiumTheme();

        await loadStudyMindPremium();

    }
);
