
"use strict";

/* =========================================================
   STUDYMIND AI — PREMIUM STATUS API

   SERVER-AUTHORITATIVE ACCESS

   SUPPORTS:
   - Permanent Admin Premium
   - Weekly paid subscriptions
   - Monthly paid subscriptions
   - Yearly paid subscriptions
   - Seven-day free trials
   - Pending manual bank transfers
   - Automatic expiry detection

   SECURITY:
   - Authenticates the Supabase user.
   - Uses service-role access server-side only.
   - Never trusts localStorage for Premium access.
   - Never modifies the Admin subscription record.
========================================================= */


/* =========================================================
   ENVIRONMENT
========================================================= */

const SUPABASE_URL =
    process.env.SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

const ADMIN_EMAIL =
    String(process.env.ADMIN_EMAIL || "")
        .trim()
        .toLowerCase();


/* =========================================================
   RESPONSE HELPER
========================================================= */

function send(res, status, data) {

    if (typeof res.setHeader === "function") {

        res.setHeader(
            "Cache-Control",
            "no-store, no-cache, must-revalidate"
        );

    }

    return res
        .status(status)
        .json(data);

}


/* =========================================================
   SUPABASE REQUEST HEADERS
========================================================= */

function getSupabaseHeaders() {

    return {

        apikey: SUPABASE_SERVICE_ROLE_KEY,

        Authorization:
            `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,

        "Content-Type": "application/json"

    };

}


/* =========================================================
   GET USER FROM ACCESS TOKEN
========================================================= */

async function getUserFromToken(token) {

    const response = await fetch(
        `${SUPABASE_URL}/auth/v1/user`,
        {
            method: "GET",

            headers: {

                Authorization:
                    `Bearer ${token}`,

                apikey:
                    SUPABASE_SERVICE_ROLE_KEY

            },

            cache: "no-store"
        }
    );


    if (!response.ok) {

        const errorText =
            await response.text();

        console.error(
            "Supabase authentication error:",
            errorText
        );

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
   CHECK ACTIVE PAID SUBSCRIPTION
========================================================= */

async function getActivePaidSubscription(userId) {

    const now =
        new Date().toISOString();

    const url =
        `${SUPABASE_URL}/rest/v1/premium_subscriptions` +

        `?user_id=eq.${encodeURIComponent(userId)}` +

        `&status=eq.active` +

        `&is_premium=eq.true` +

        `&expires_at=gt.${encodeURIComponent(now)}` +

        `&select=id,plan_type,starts_at,expires_at` +

        `&order=expires_at.desc` +

        `&limit=1`;


    const response = await fetch(
        url,
        {
            method: "GET",

            headers: getSupabaseHeaders(),

            cache: "no-store"
        }
    );


    if (!response.ok) {

        const errorText =
            await response.text();

        console.error(
            "Premium subscription database error:",
            errorText
        );

        throw new Error(
            "Could not check Premium subscription."
        );

    }


    const rows =
        await response.json();


    return rows?.[0] || null;

}


/* =========================================================
   CHECK ACTIVE FREE TRIAL
========================================================= */

async function getActiveTrial(userId) {

    const now =
        new Date().toISOString();

    const url =
        `${SUPABASE_URL}/rest/v1/premium_trials` +

        `?user_id=eq.${encodeURIComponent(userId)}` +

        `&status=eq.active` +

        `&starts_at=lte.${encodeURIComponent(now)}` +

        `&expires_at=gt.${encodeURIComponent(now)}` +

        `&select=user_id,status,starts_at,expires_at` +

        `&limit=1`;


    const response = await fetch(
        url,
        {
            method: "GET",

            headers: getSupabaseHeaders(),

            cache: "no-store"
        }
    );


    if (!response.ok) {

        const errorText =
            await response.text();

        console.error(
            "Premium trial database error:",
            errorText
        );

        throw new Error(
            "Could not check Premium trial status."
        );

    }


    const rows =
        await response.json();


    return rows?.[0] || null;

}


/* =========================================================
   CHECK PENDING MANUAL PAYMENT

   This only detects a pending request.

   It DOES NOT activate Premium.
   Only the admin approval process can do that.
========================================================= */

async function getPendingManualPayment(userId) {

    const url =
        `${SUPABASE_URL}/rest/v1/manual_payment_requests` +

        `?user_id=eq.${encodeURIComponent(userId)}` +

        `&status=eq.pending` +

        `&select=id,plan_type,amount,currency,status,created_at` +

        `&order=created_at.desc` +

        `&limit=1`;


    const response = await fetch(
        url,
        {
            method: "GET",

            headers: getSupabaseHeaders(),

            cache: "no-store"
        }
    );


    if (!response.ok) {

        const errorText =
            await response.text();

        console.error(
            "Manual payment status database error:",
            errorText
        );

        throw new Error(
            "Could not check pending manual payment."
        );

    }


    const rows =
        await response.json();


    return rows?.[0] || null;

}


/* =========================================================
   MARK EXPIRED TRIALS

   This is a server-side cleanup.

   It does not delete the trial record.
   Keeping the record prevents another trial from
   being started by the same account.
========================================================= */

async function markExpiredTrials(userId) {

    const now =
        new Date().toISOString();

    const url =
        `${SUPABASE_URL}/rest/v1/premium_trials` +

        `?user_id=eq.${encodeURIComponent(userId)}` +

        `&status=eq.active` +

        `&expires_at=lte.${encodeURIComponent(now)}`;


    const response = await fetch(
        url,
        {
            method: "PATCH",

            headers: {

                ...getSupabaseHeaders(),

                Prefer: "return=minimal"

            },

            body: JSON.stringify({

                status: "expired",

                updated_at: now

            }),

            cache: "no-store"
        }
    );


    if (!response.ok) {

        /*
         * Access is still denied based on the expiry date.
         * A cleanup failure must not accidentally grant
         * or extend Premium access.
         */

        console.error(
            "Could not mark expired trial:",
            await response.text()
        );

    }

}


/* =========================================================
   HANDLER
========================================================= */

module.exports = async function handler(req, res) {

    /* ---------------------------------------------
       METHOD CHECK
    --------------------------------------------- */

    if (req.method !== "GET") {

        return send(res, 405, {

            premium: false,

            error: "Method not allowed."

        });

    }


    /* ---------------------------------------------
       SERVER CONFIGURATION
    --------------------------------------------- */

    if (
        !SUPABASE_URL ||
        !SUPABASE_SERVICE_ROLE_KEY
    ) {

        console.error(
            "Missing Supabase server environment variables."
        );

        return send(res, 500, {

            premium: false,

            error:
                "Supabase server configuration is missing."

        });

    }


    /* ---------------------------------------------
       AUTHORIZATION HEADER
    --------------------------------------------- */

    const authorization =
        req.headers.authorization || "";


    if (!authorization.startsWith("Bearer ")) {

        return send(res, 401, {

            premium: false,

            error: "Authentication required."

        });

    }


    const token =
        authorization.slice(7).trim();


    if (!token) {

        return send(res, 401, {

            premium: false,

            error: "Authentication required."

        });

    }


    try {

        /* -----------------------------------------
           AUTHENTICATE USER
        ----------------------------------------- */

        const user =
            await getUserFromToken(token);


        if (!user?.id) {

            return send(res, 401, {

                premium: false,

                error:
                    "Invalid authentication token."

            });

        }


        /* -----------------------------------------
           ADMIN EXCEPTION

           Admin gets permanent Premium.

           Do not update, delete or expire the
           Admin's existing manual subscription.
        ----------------------------------------- */

        const isAdmin =
            isAdminUser(user);


        if (isAdmin) {

            return send(res, 200, {

                premium: true,

                isAdmin: true,

                isTrial: false,

                planType: "admin",

                startsAt: null,

                expiresAt: null,

                trialExpiresAt: null,

                pending: false,

                userId: user.id

            });

        }


        /* -----------------------------------------
           CHECK ACTIVE PAID SUBSCRIPTION
        ----------------------------------------- */

        const subscription =
            await getActivePaidSubscription(
                user.id
            );


        if (subscription) {

            return send(res, 200, {

                premium: true,

                isAdmin: false,

                isTrial: false,

                planType:
                    subscription.plan_type,

                startsAt:
                    subscription.starts_at,

                expiresAt:
                    subscription.expires_at,

                trialExpiresAt: null,

                pending: false,

                userId: user.id

            });

        }


        /* -----------------------------------------
           CHECK ACTIVE FREE TRIAL
        ----------------------------------------- */

        const trial =
            await getActiveTrial(user.id);


        if (trial) {

            return send(res, 200, {

                premium: true,

                isAdmin: false,

                isTrial: true,

                planType: "trial",

                startsAt:
                    trial.starts_at,

                expiresAt:
                    trial.expires_at,

                trialExpiresAt:
                    trial.expires_at,

                pending: false,

                userId: user.id

            });

        }


        /* -----------------------------------------
           MARK EXPIRED TRIALS
        ----------------------------------------- */

        await markExpiredTrials(user.id);


        /* -----------------------------------------
           CHECK PENDING MANUAL PAYMENT

           Pending requests do not grant Premium.

           They only change the account status
           displayed on the Premium page.
        ----------------------------------------- */

        const pendingPayment =
            await getPendingManualPayment(
                user.id
            );


        if (pendingPayment) {

            return send(res, 200, {

                premium: false,

                isAdmin: false,

                isTrial: false,

                pending: true,

                paymentPending: true,

                paymentStatus: "pending",

                planType:
                    pendingPayment.plan_type,

                pendingRequest: {

                    id: pendingPayment.id,

                    planType:
                        pendingPayment.plan_type,

                    amount:
                        pendingPayment.amount,

                    currency:
                        pendingPayment.currency,

                    status:
                        pendingPayment.status,

                    createdAt:
                        pendingPayment.created_at

                },

                startsAt: null,

                expiresAt: null,

                trialExpiresAt: null,

                userId: user.id

            });

        }


        /* -----------------------------------------
           FREE ACCOUNT
        ----------------------------------------- */

        return send(res, 200, {

            premium: false,

            isAdmin: false,

            isTrial: false,

            pending: false,

            paymentPending: false,

            paymentStatus: null,

            planType: null,

            startsAt: null,

            expiresAt: null,

            trialExpiresAt: null,

            userId: user.id

        });


    } catch (error) {

        console.error(
            "Premium status error:",
            error
        );


        return send(res, 500, {

            premium: false,

            isAdmin: false,

            isTrial: false,

            pending: false,

            error:
                "Premium status check failed."

        });

    }

};
