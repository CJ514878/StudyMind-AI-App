
/* =========================================================
   STUDYMIND AI — PREMIUM CHECKOUT
   PLAN-AWARE PAYSTACK + FLUTTERWAVE
   ========================================================= */

"use strict";

const crypto = require("crypto");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;

/*
 * Prices are controlled by the server.
 * Never accept payment amounts from the browser.
 */

const PLANS = {
    weekly: {
        amount: 1000,
        currency: "NGN",
        duration: "7 days"
    },

    monthly: {
        amount: 3900,
        currency: "NGN",
        duration: "1 calendar month"
    },

    yearly: {
        amount: 46000,
        currency: "NGN",
        duration: "1 calendar year"
    }
};

const ALLOWED_PROVIDERS = [
    "paystack",
    "flutterwave"
];


/* =========================================================
   RESPONSE
========================================================= */

function send(res, status, data) {
    return res.status(status).json(data);
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
            }
        }
    );

    if (!response.ok) {
        return null;
    }

    return await response.json();
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

            body: JSON.stringify(record)
        }
    );

    if (!response.ok) {

        const errorText = await response.text();

        console.error(
            "Premium subscription insert failed:",
            errorText
        );

        throw new Error(
            "Could not create Premium payment record."
        );
    }

    const rows = await response.json();

    return rows?.[0] || null;
}


/* =========================================================
   CHECK EXISTING ACTIVE SUBSCRIPTION
========================================================= */

async function hasActiveSubscription(userId) {

    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/premium_subscriptions` +
        `?user_id=eq.${encodeURIComponent(userId)}` +
        `&status=eq.active` +
        `&is_premium=eq.true` +
        `&select=id,expires_at`,

        {
            headers: {
                apikey: SERVICE_ROLE_KEY,

                Authorization:
                    `Bearer ${SERVICE_ROLE_KEY}`
            },

            cache: "no-store"
        }
    );

    if (!response.ok) {
        throw new Error(
            "Could not check existing Premium status."
        );
    }

    const rows = await response.json();

    const now = Date.now();

    return rows.some(row => {

        /*
         * A null expiry is treated as permanent here
         * for compatibility with existing legacy records.
         *
         * The status API will separately enforce
         * the account's actual Premium eligibility.
         */

        if (!row.expires_at) {
            return true;
        }

        return (
            new Date(row.expires_at).getTime() > now
        );

    });
}


/* =========================================================
   PAYSTACK CHECKOUT
========================================================= */

async function createPaystackCheckout(user, planType) {

    if (!process.env.PAYSTACK_SECRET_KEY) {
        throw new Error(
            "Paystack Secret Key is not configured."
        );
    }

    const plan = PLANS[planType];

    const response = await fetch(
        "https://api.paystack.co/transaction/initialize",

        {
            method: "POST",

            headers: {
                Authorization:
                    `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,

                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                email: user.email,

                amount: plan.amount * 100,

                currency: "NGN",

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

        currency: "NGN",

        status: "pending",

        is_premium: false

    });

    return {
        checkoutUrl:
            data.data.authorization_url,

        planType,

        amount: plan.amount,

        currency: "NGN"
    };
}


/* =========================================================
   FLUTTERWAVE CHECKOUT
========================================================= */

async function createFlutterwaveCheckout(user, planType) {

    if (!process.env.FLW_SECRET_KEY) {
        throw new Error(
            "Flutterwave Secret Key is not configured."
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
                Authorization:
                    `Bearer ${process.env.FLW_SECRET_KEY}`,

                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                tx_ref: txRef,

                amount: plan.amount,

                currency: "NGN",

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

        currency: "NGN",

        status: "pending",

        is_premium: false

    });

    return {
        checkoutUrl: data.data.link,

        planType,

        amount: plan.amount,

        currency: "NGN"
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
   MAIN HANDLER
========================================================= */

module.exports = async function handler(req, res) {

    if (req.method !== "POST") {

        return send(res, 405, {
            error: "Method not allowed."
        });
    }

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

    const authorization =
        req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {

        return send(res, 401, {
            error:
                "You must be logged in to purchase Premium."
        });
    }

    const token = authorization.slice(7).trim();

    try {

        /* ---------------------------------------------
           AUTHENTICATE USER
        --------------------------------------------- */

        const user = await getUser(token);

        if (!user?.id || !user?.email) {

            return send(res, 401, {
                error: "Invalid login session."
            });
        }


        /* ---------------------------------------------
           VALIDATE PLAN
        --------------------------------------------- */

        const planType = String(
            req.body?.plan_type || ""
        ).toLowerCase().trim();

        if (!Object.prototype.hasOwnProperty.call(
            PLANS,
            planType
        )) {

            return send(res, 400, {
                error:
                    "Invalid plan. Choose weekly, monthly or yearly."
            });
        }


        /* ---------------------------------------------
           VALIDATE PROVIDER
        --------------------------------------------- */

        const provider = String(
            req.body?.provider || ""
        ).toLowerCase().trim();

        if (!ALLOWED_PROVIDERS.includes(provider)) {

            return send(res, 400, {
                error:
                    "This payment provider is not currently available."
            });
        }


        /* ---------------------------------------------
           CHECK EXISTING PREMIUM ACCESS
        --------------------------------------------- */

        const alreadyPremium =
            await hasActiveSubscription(user.id);

        if (alreadyPremium) {

            return send(res, 409, {
                error:
                    "This account already has Premium."
            });
        }


        /* ---------------------------------------------
           CREATE CHECKOUT
        --------------------------------------------- */

        let checkout;

        if (provider === "paystack") {

            checkout = await createPaystackCheckout(
                user,
                planType
            );

        } else {

            checkout = await createFlutterwaveCheckout(
                user,
                planType
            );

        }


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
