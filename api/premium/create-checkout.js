
/* =========================================================
   STUDYMIND AI — PREMIUM CHECKOUT
   PLAN-AWARE PAYSTACK + FLUTTERWAVE

   PLANS:
   Weekly:  ₦1,000
   Monthly: ₦3,900
   Yearly:  ₦46,000

   SECURITY:
   - Server controls all prices.
   - Stripe checkout is temporarily disabled.
   - Admin Premium is preserved.
   - Active subscriptions prevent duplicate purchases.
   - Active trials prevent duplicate purchases.
   - Expired subscriptions allow renewal.
   ========================================================= */

"use strict";

const crypto = require("crypto");


/* =========================================================
   ENVIRONMENT
========================================================= */

const SUPABASE_URL =
    process.env.SUPABASE_URL;

const SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

const ANON_KEY =
    process.env.SUPABASE_ANON_KEY;

const ADMIN_EMAIL =
    String(process.env.ADMIN_EMAIL || "")
        .trim()
        .toLowerCase();


/* =========================================================
   SERVER-CONTROLLED PLANS

   Never accept prices or durations from the browser.
========================================================= */

const PLANS = {
    weekly: {
        amount: 1000,
        currency: "NGN",
        description: "7-day Premium subscription"
    },

    monthly: {
        amount: 3900,
        currency: "NGN",
        description: "1-month Premium subscription"
    },

    yearly: {
        amount: 46000,
        currency: "NGN",
        description: "1-year Premium subscription"
    }
};


/* =========================================================
   ALLOWED PAYMENT PROVIDERS

   Stripe is intentionally disabled until USD pricing
   has been decided.
========================================================= */

const ALLOWED_PROVIDERS = [
    "paystack",
    "flutterwave"
];


/* =========================================================
   RESPONSE HELPER
========================================================= */

function send(res, status, data) {

    return res
        .status(status)
        .json(data);

}


/* =========================================================
   GET AUTHENTICATED USER
========================================================= */

async function getUser(token) {

    const response = await fetch(
        `${SUPABASE_URL}/auth/v1/user`,
        {
            method: "GET",

            headers: {
                Authorization: `Bearer ${token}`,
                apikey: ANON_KEY
            },

            cache: "no-store"
        }
    );

    if (!response.ok) {
        return null;
    }

    return await response.json();

}


/* =========================================================
   CHECK ADMIN ACCOUNT
========================================================= */

function isAdminUser(user) {

    if (!ADMIN_EMAIL || !user?.email) {
        return false;
    }

    return (
        user.email.trim().toLowerCase() ===
        ADMIN_EMAIL
    );

}


/* =========================================================
   INSERT PENDING PAYMENT
========================================================= */

async function insertPendingPayment(record) {

    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/premium_subscriptions`,
        {
            method: "POST",

            headers: {
                apikey: SERVICE_ROLE_KEY,

                Authorization:
                    `Bearer ${SERVICE_ROLE_KEY}`,

                "Content-Type": "application/json",

                Prefer: "return=representation"
            },

            body: JSON.stringify(record),

            cache: "no-store"
        }
    );

    if (!response.ok) {

        const errorText =
            await response.text();

        console.error(
            "Premium subscription insert failed:",
            errorText
        );

        throw new Error(
            "Could not create the Premium payment record."
        );

    }

    const rows = await response.json();

    return rows?.[0] || null;

}


/* =========================================================
   CHECK ACTIVE PAID SUBSCRIPTION

   Expired subscriptions do not block renewal.

   Null expiry is not treated as permanent for ordinary
   accounts. Admin access is handled separately.
========================================================= */

async function hasActiveSubscription(userId) {

    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/premium_subscriptions` +
        `?user_id=eq.${encodeURIComponent(userId)}` +
        `&status=eq.active` +
        `&is_premium=eq.true` +
        `&select=id,plan_type,expires_at`,

        {
            method: "GET",

            headers: {
                apikey: SERVICE_ROLE_KEY,

                Authorization:
                    `Bearer ${SERVICE_ROLE_KEY}`
            },

            cache: "no-store"
        }
    );

    if (!response.ok) {

        console.error(
            "Active subscription check failed:",
            await response.text()
        );

        throw new Error(
            "Could not check existing Premium status."
        );

    }

    const rows = await response.json();

    const now = Date.now();

    return rows.some(row => {

        if (!row.expires_at) {
            return false;
        }

        const expiry =
            new Date(row.expires_at).getTime();

        return (
            Number.isFinite(expiry) &&
            expiry > now
        );

    });

}


/* =========================================================
   CHECK ACTIVE FREE TRIAL

   The premium_trials table enforces one trial per user.
   This function only checks whether a trial is currently
   active and unexpired.
========================================================= */

async function getActiveTrial(userId) {

    const now = new Date().toISOString();

    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/premium_trials` +
        `?user_id=eq.${encodeURIComponent(userId)}` +
        `&status=eq.active` +
        `&expires_at=gt.${encodeURIComponent(now)}` +
        `&select=user_id,starts_at,expires_at` +
        `&limit=1`,

        {
            method: "GET",

            headers: {
                apikey: SERVICE_ROLE_KEY,

                Authorization:
                    `Bearer ${SERVICE_ROLE_KEY}`
            },

            cache: "no-store"
        }
    );

    if (!response.ok) {

        console.error(
            "Trial check failed:",
            await response.text()
        );

        throw new Error(
            "Could not check your Premium trial status."
        );

    }

    const rows = await response.json();

    return rows?.[0] || null;

}


/* =========================================================
   PAYSTACK CHECKOUT
========================================================= */

async function createPaystackCheckout(user, planType) {

    const secretKey =
        process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {

        throw new Error(
            "Paystack is not configured."
        );

    }

    const plan = PLANS[planType];

    const response = await fetch(
        "https://api.paystack.co/transaction/initialize",

        {
            method: "POST",

            headers: {
                Authorization: `Bearer ${secretKey}`,

                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                email: user.email,

                amount: plan.amount * 100,

                currency: plan.currency,

                callback_url:
                    `${getBaseUrl()}/premium-success.html?provider=paystack`

            })
        }
    );

    const data = await response.json();

    if (
        !response.ok ||
        !data?.status ||
        !data?.data?.authorization_url ||
        !data?.data?.reference
    ) {

        console.error(
            "Paystack checkout error:",
            data
        );

        throw new Error(
            data?.message ||
            "Paystack could not create checkout."
        );

    }

    await insertPendingPayment({

        user_id: user.id,

        provider: "paystack",

        provider_reference:
            data.data.reference,

        plan_type: planType,

        amount: plan.amount,

        currency: plan.currency,

        status: "pending",

        is_premium: false,

        is_trial: false,

        renewal_type: "manual"

    });

    return {

        checkoutUrl:
            data.data.authorization_url,

        planType,

        amount: plan.amount,

        currency: plan.currency

    };

}


/* =========================================================
   FLUTTERWAVE CHECKOUT
========================================================= */

async function createFlutterwaveCheckout(user, planType) {

    const secretKey =
        process.env.FLW_SECRET_KEY;

    if (!secretKey) {

        throw new Error(
            "Flutterwave is not configured."
        );

    }

    const plan = PLANS[planType];

    const txRef =
        `STUDYMIND_${planType.toUpperCase()}_` +
        `${Date.now()}_` +
        crypto.randomBytes(6).toString("hex");

    const response = await fetch(
        "https://api.flutterwave.com/v3/payments",

        {
            method: "POST",

            headers: {
                Authorization: `Bearer ${secretKey}`,

                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                tx_ref: txRef,

                amount: plan.amount,

                currency: plan.currency,

                redirect_url:
                    `${getBaseUrl()}/premium-success.html?provider=flutterwave`,

                customer: {
                    email: user.email
                },

                customizations: {

                    title: "StudyMind AI Premium",

                    description:
                        `StudyMind AI ${planType} Premium subscription`,

                    logo:
                        `${getBaseUrl()}/favicon.ico`

                }

            })
        }
    );

    const data = await response.json();

    if (
        !response.ok ||
        data?.status !== "success" ||
        !data?.data?.link
    ) {

        console.error(
            "Flutterwave checkout error:",
            data
        );

        throw new Error(
            data?.message ||
            "Flutterwave could not create checkout."
        );

    }

    await insertPendingPayment({

        user_id: user.id,

        provider: "flutterwave",

        provider_reference: txRef,

        plan_type: planType,

        amount: plan.amount,

        currency: plan.currency,

        status: "pending",

        is_premium: false,

        is_trial: false,

        renewal_type: "manual"

    });

    return {

        checkoutUrl: data.data.link,

        planType,

        amount: plan.amount,

        currency: plan.currency

    };

}


/* =========================================================
   BASE URL
========================================================= */

function getBaseUrl() {

    const productionUrl =
        process.env.VERCEL_PROJECT_PRODUCTION_URL;

    if (productionUrl) {

        return productionUrl.startsWith("http")
            ? productionUrl
            : `https://${productionUrl}`;

    }

    if (process.env.VERCEL_URL) {

        return `https://${process.env.VERCEL_URL}`;

    }

    return "http://localhost:3000";

}


/* =========================================================
   MAIN API HANDLER
========================================================= */

module.exports = async function handler(req, res) {

    /* ---------------------------------------------
       METHOD
    --------------------------------------------- */

    if (req.method !== "POST") {

        return send(res, 405, {
            error: "Method not allowed."
        });

    }


    /* ---------------------------------------------
       ENVIRONMENT CHECK
    --------------------------------------------- */

    if (
        !SUPABASE_URL ||
        !SERVICE_ROLE_KEY ||
        !ANON_KEY
    ) {

        return send(res, 500, {
            error:
                "Supabase environment variables are missing."
        });

    }


    /* ---------------------------------------------
       AUTHORIZATION HEADER
    --------------------------------------------- */

    const authorization =
        req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {

        return send(res, 401, {
            error:
                "You must be logged in to purchase Premium."
        });

    }

    const token =
        authorization.slice(7).trim();

    if (!token) {

        return send(res, 401, {
            error: "Invalid login session."
        });

    }


    try {

        /* -----------------------------------------
           AUTHENTICATE USER
        ----------------------------------------- */

        const user = await getUser(token);

        if (!user?.id || !user?.email) {

            return send(res, 401, {
                error: "Invalid login session."
            });

        }


        /* -----------------------------------------
           ADMIN CHECK
        ----------------------------------------- */

        if (isAdminUser(user)) {

            return send(res, 409, {

                error:
                    "This Admin account already has permanent Premium access.",

                isAdmin: true,

                premium: true

            });

        }


        /* -----------------------------------------
           VALIDATE PLAN
        ----------------------------------------- */

        const planType = String(
            req.body?.plan_type || ""
        )
            .toLowerCase()
            .trim();

        if (
            !Object.prototype.hasOwnProperty.call(
                PLANS,
                planType
            )
        ) {

            return send(res, 400, {
                error:
                    "Invalid plan. Choose weekly, monthly or yearly."
            });

        }


        /* -----------------------------------------
           VALIDATE PROVIDER
        ----------------------------------------- */

        const provider = String(
            req.body?.provider || ""
        )
            .toLowerCase()
            .trim();

        if (!ALLOWED_PROVIDERS.includes(provider)) {

            return send(res, 400, {

                error:
                    "This payment provider is not currently available.",

                availableProviders:
                    ALLOWED_PROVIDERS

            });

        }


        /* -----------------------------------------
           CHECK ACTIVE PAID SUBSCRIPTION
        ----------------------------------------- */

        const alreadyPremium =
            await hasActiveSubscription(user.id);

        if (alreadyPremium) {

            return send(res, 409, {

                error:
                    "Your account already has an active Premium subscription.",

                premium: true

            });

        }


        /* -----------------------------------------
           CHECK ACTIVE FREE TRIAL
        ----------------------------------------- */

        const activeTrial =
            await getActiveTrial(user.id);

        if (activeTrial) {

            return send(res, 409, {

                error:
                    "Your free Premium trial is still active. You can purchase a plan after it expires.",

                isTrial: true,

                trialExpiresAt:
                    activeTrial.expires_at

            });

        }


        /* -----------------------------------------
           CREATE CHECKOUT
        ----------------------------------------- */

        let checkout;

        if (provider === "paystack") {

            checkout =
                await createPaystackCheckout(
                    user,
                    planType
                );

        } else if (provider === "flutterwave") {

            checkout =
                await createFlutterwaveCheckout(
                    user,
                    planType
                );

        }


        /* -----------------------------------------
           SUCCESS
        ----------------------------------------- */

        return send(res, 200, checkout);


    } catch (error) {

        console.error(
            "Create Premium checkout error:",
            error
        );

        return send(res, 500, {

            error:
                error.message ||
                "Could not create Premium checkout."

        });

    }

};
