
"use strict";

/* =========================================================
   STUDYMIND AI — PREMIUM PAYMENT VERIFICATION

   PAYSTACK + FLUTTERWAVE
   STRIPE VERIFICATION RETAINED FOR FUTURE USE

   SECURITY:
   - Authenticates the signed-in user.
   - Finds payment using the user's own database record.
   - Verifies directly with the payment provider.
   - Checks exact amount and currency.
   - Checks stored plan against server-controlled pricing.
   - Calculates expiry on the server.
   - Uses atomic activation to prevent duplicate activation.
   - Preserves manual Admin Premium records.
========================================================= */

const SUPABASE_URL =
    process.env.SUPABASE_URL;

const SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

const ANON_KEY =
    process.env.SUPABASE_ANON_KEY;


/* =========================================================
   SERVER-CONTROLLED PLANS
========================================================= */

const PLANS = {
    weekly: {
        amount: 1000,
        currency: "NGN",
        duration: "weekly"
    },

    monthly: {
        amount: 3900,
        currency: "NGN",
        duration: "monthly"
    },

    yearly: {
        amount: 46000,
        currency: "NGN",
        duration: "yearly"
    }
};


/* =========================================================
   RESPONSE HELPER
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
            },

            cache: "no-store"
        }
    );

    if (!response.ok) {
        return null;
    }

    return response.json();
}


/* =========================================================
   FIND PAYMENT RECORD
========================================================= */

async function getPaymentRecord(
    userId,
    provider,
    reference
) {

    const url =
        `${SUPABASE_URL}/rest/v1/premium_subscriptions` +
        `?user_id=eq.${encodeURIComponent(userId)}` +
        `&provider=eq.${encodeURIComponent(provider)}` +
        `&provider_reference=eq.${encodeURIComponent(reference)}` +
        `&select=*` +
        `&limit=1`;

    const response = await fetch(url, {

        method: "GET",

        headers: {
            apikey: SERVICE_ROLE_KEY,

            Authorization:
                `Bearer ${SERVICE_ROLE_KEY}`
        },

        cache: "no-store"
    });

    if (!response.ok) {

        console.error(
            "Premium payment lookup failed:",
            await response.text()
        );

        throw new Error(
            "Could not find the Premium payment."
        );
    }

    const rows = await response.json();

    return rows?.[0] || null;
}


/* =========================================================
   GET PAYMENT BY ID
========================================================= */

async function getPaymentById(userId, paymentId) {

    const url =
        `${SUPABASE_URL}/rest/v1/premium_subscriptions` +
        `?id=eq.${encodeURIComponent(paymentId)}` +
        `&user_id=eq.${encodeURIComponent(userId)}` +
        `&select=*` +
        `&limit=1`;

    const response = await fetch(url, {

        method: "GET",

        headers: {
            apikey: SERVICE_ROLE_KEY,

            Authorization:
                `Bearer ${SERVICE_ROLE_KEY}`
        },

        cache: "no-store"
    });

    if (!response.ok) {

        throw new Error(
            "Could not retrieve the Premium payment."
        );
    }

    const rows = await response.json();

    return rows?.[0] || null;
}


/* =========================================================
   PAYSTACK VERIFICATION
========================================================= */

async function verifyPaystack(reference) {

    const secret =
        process.env.PAYSTACK_SECRET_KEY;

    if (!secret) {

        throw new Error(
            "Paystack Secret Key is not configured."
        );
    }

    const response = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,

        {
            method: "GET",

            headers: {
                Authorization: `Bearer ${secret}`
            },

            cache: "no-store"
        }
    );

    const data = await response.json();

    if (
        !response.ok ||
        data?.status !== true ||
        !data?.data
    ) {

        throw new Error(
            data?.message ||
            "Could not verify the Paystack transaction."
        );
    }

    return data.data;
}


/* =========================================================
   FLUTTERWAVE VERIFICATION
========================================================= */

async function verifyFlutterwave(transactionId) {

    const secret =
        process.env.FLW_SECRET_KEY;

    if (!secret) {

        throw new Error(
            "Flutterwave Secret Key is not configured."
        );
    }

    const response = await fetch(
        `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`,

        {
            method: "GET",

            headers: {
                Authorization: `Bearer ${secret}`,

                "Content-Type": "application/json"
            },

            cache: "no-store"
        }
    );

    const data = await response.json();

    if (
        !response.ok ||
        data?.status !== "success" ||
        !data?.data
    ) {

        throw new Error(
            data?.message ||
            "Could not verify the Flutterwave transaction."
        );
    }

    return data.data;
}


/* =========================================================
   STRIPE VERIFICATION

   Retained for future USD support.
   Stripe checkout remains disabled.
========================================================= */

async function verifyStripe(sessionId) {

    const secret =
        process.env.STRIPE_SECRET_KEY;

    if (!secret) {

        throw new Error(
            "Stripe Secret Key is not configured."
        );
    }

    const response = await fetch(
        `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,

        {
            method: "GET",

            headers: {
                Authorization: `Bearer ${secret}`
            },

            cache: "no-store"
        }
    );

    const data = await response.json();

    if (!response.ok || !data?.id) {

        throw new Error(
            data?.error?.message ||
            "Could not verify the Stripe transaction."
        );
    }

    return data;
}


/* =========================================================
   VALIDATE STORED PLAN

   The database record must contain a valid plan.
   The browser cannot choose the payment amount or expiry.
========================================================= */

function validateStoredPlan(payment) {

    const planType = String(
        payment?.plan_type || ""
    )
        .toLowerCase()
        .trim();

    const plan = PLANS[planType];

    if (!plan) {

        return {
            valid: false,
            reason: "The stored subscription plan is invalid."
        };
    }

    const storedAmount =
        Number(payment.amount);

    const storedCurrency =
        String(payment.currency || "")
            .toUpperCase();

    if (
        !Number.isFinite(storedAmount) ||
        storedAmount !== plan.amount
    ) {

        return {
            valid: false,
            reason: "The stored payment amount does not match the selected plan."
        };
    }

    if (storedCurrency !== plan.currency) {

        return {
            valid: false,
            reason: "The stored payment currency does not match the selected plan."
        };
    }

    return {
        valid: true,
        planType,
        plan
    };
}


/* =========================================================
   CALCULATE SUBSCRIPTION EXPIRY

   Weekly:
   Add exactly 7 calendar days.

   Monthly:
   Add one calendar month.
   Clamp month-end dates correctly.

   Yearly:
   Add one calendar year.
   Handle leap-year dates correctly.

   All calculations use UTC to avoid server timezone
   differences.
========================================================= */

function calculateSubscriptionDates(
    planType,
    startDate = new Date()
) {

    const plan = PLANS[planType];

    if (!plan) {
        throw new Error("Invalid subscription plan.");
    }

    const start = new Date(startDate);

    if (!Number.isFinite(start.getTime())) {
        throw new Error("Invalid subscription start date.");
    }

    const expiry = new Date(start);

    if (plan.duration === "weekly") {

        expiry.setUTCDate(
            expiry.getUTCDate() + 7
        );

    }

    else if (plan.duration === "monthly") {

        const originalDay =
            expiry.getUTCDate();

        const targetMonth =
            expiry.getUTCMonth() + 1;

        const targetYear =
            expiry.getUTCFullYear() +
            Math.floor(targetMonth / 12);

        const normalizedMonth =
            targetMonth % 12;

        // Move to the first day of the target month.
        expiry.setUTCDate(1);

        expiry.setUTCFullYear(
            targetYear,
            normalizedMonth,
            1
        );

        // Find the last day of the target month.
        const lastDay = new Date(
            Date.UTC(
                targetYear,
                normalizedMonth + 1,
                0
            )
        ).getUTCDate();

        expiry.setUTCDate(
            Math.min(originalDay, lastDay)
        );

    }

    else if (plan.duration === "yearly") {

        const originalMonth =
            expiry.getUTCMonth();

        const originalDay =
            expiry.getUTCDate();

        const targetYear =
            expiry.getUTCFullYear() + 1;

        expiry.setUTCDate(1);

        expiry.setUTCFullYear(
            targetYear,
            originalMonth,
            1
        );

        const lastDay = new Date(
            Date.UTC(
                targetYear,
                originalMonth + 1,
                0
            )
        ).getUTCDate();

        expiry.setUTCDate(
            Math.min(originalDay, lastDay)
        );

    }

    return {
        startsAt: start.toISOString(),
        expiresAt: expiry.toISOString()
    };
}


/* =========================================================
   PAYMENT VALIDATION
========================================================= */

function validatePayment(
    payment,
    provider,
    expectedAmount,
    expectedCurrency,
    userEmail
) {

    if (!payment) {

        return {
            valid: false,
            pending: false,
            reason: "No payment information was returned."
        };
    }

    const expectedCurrencyUpper =
        String(expectedCurrency || "").toUpperCase();

    if (
        !expectedCurrencyUpper ||
        !Number.isFinite(expectedAmount) ||
        expectedAmount <= 0
    ) {

        return {
            valid: false,
            pending: false,
            reason: "The expected payment amount or currency is invalid."
        };
    }

    let actualAmount;
    let actualCurrency;
    let paymentEmail;
    let successful = false;


    /* PAYSTACK */

    if (provider === "paystack") {

        successful =
            payment.status === "success";

        actualAmount =
            Number(payment.amount);

        actualCurrency =
            payment.currency;

        paymentEmail =
            payment.customer?.email;

        const expectedSubunit =
            Math.round(expectedAmount * 100);

        if (!successful) {

            return {
                valid: false,
                pending: true,
                reason:
                    "Paystack has not confirmed successful payment yet."
            };
        }

        if (actualAmount !== expectedSubunit) {

            return {
                valid: false,
                pending: false,
                reason:
                    "Paystack payment amount does not match the expected amount."
            };
        }
    }


    /* FLUTTERWAVE */

    else if (provider === "flutterwave") {

        successful =
            payment.status === "successful";

        actualAmount =
            Number(payment.amount);

        actualCurrency =
            payment.currency;

        paymentEmail =
            payment.customer?.email;

        if (!successful) {

            return {
                valid: false,
                pending: true,
                reason:
                    "Flutterwave has not confirmed successful payment yet."
            };
        }

        if (actualAmount !== expectedAmount) {

            return {
                valid: false,
                pending: false,
                reason:
                    "Flutterwave payment amount does not match the expected amount."
            };
        }
    }


    /* STRIPE — RETAINED FOR FUTURE USE */

    else if (provider === "stripe") {

        successful =
            payment.payment_status === "paid";

        actualAmount =
            Number(payment.amount_total);

        actualCurrency =
            payment.currency;

        paymentEmail =
            payment.customer_details?.email ||
            payment.customer_email;

        const expectedSubunit =
            Math.round(expectedAmount * 100);

        if (!successful) {

            return {
                valid: false,
                pending: true,
                reason:
                    "Stripe has not confirmed successful payment yet."
            };
        }

        if (actualAmount !== expectedSubunit) {

            return {
                valid: false,
                pending: false,
                reason:
                    "Stripe payment amount does not match the expected amount."
            };
        }
    }

    else {

        return {
            valid: false,
            pending: false,
            reason: "Unsupported payment provider."
        };
    }


    /* CURRENCY VALIDATION */

    if (
        String(actualCurrency || "").toUpperCase() !==
        expectedCurrencyUpper
    ) {

        return {
            valid: false,
            pending: false,
            reason: "Payment currency does not match."
        };
    }


    /* EMAIL VALIDATION */

    if (
        userEmail &&
        paymentEmail &&
        String(paymentEmail).trim().toLowerCase() !==
        String(userEmail).trim().toLowerCase()
    ) {

        return {
            valid: false,
            pending: false,
            reason: "Payment email does not match the account."
        };
    }

    return {
        valid: true,
        pending: false,
        reason: null
    };
}


/* =========================================================
   CHECK WHETHER AN ACTIVATED SUBSCRIPTION IS STILL VALID
========================================================= */

function isSubscriptionUnexpired(payment) {

    if (!payment?.expires_at) {
        return false;
    }

    const expiry =
        new Date(payment.expires_at).getTime();

    return (
        Number.isFinite(expiry) &&
        expiry > Date.now()
    );
}


/* =========================================================
   ATOMIC PREMIUM ACTIVATION

   Expiry is calculated here, on the server.

   The update only succeeds if the original payment is
   still pending and not already activated.
========================================================= */

async function activatePayment(payment, planType) {

    const now = new Date();

    const dates =
        calculateSubscriptionDates(
            planType,
            now
        );

    const url =
        `${SUPABASE_URL}/rest/v1/premium_subscriptions` +
        `?id=eq.${encodeURIComponent(payment.id)}` +
        `&user_id=eq.${encodeURIComponent(payment.user_id)}` +
        `&provider=eq.${encodeURIComponent(payment.provider)}` +
        `&status=eq.pending` +
        `&is_premium=eq.false`;

    const response = await fetch(url, {

        method: "PATCH",

        headers: {
            apikey: SERVICE_ROLE_KEY,

            Authorization:
                `Bearer ${SERVICE_ROLE_KEY}`,

            "Content-Type": "application/json",

            Prefer: "return=representation"
        },

        body: JSON.stringify({

            status: "active",

            is_premium: true,

            plan_type: planType,

            starts_at: dates.startsAt,

            expires_at: dates.expiresAt,

            activated_at: dates.startsAt,

            is_trial: false,

            renewal_type: "manual",

            updated_at: dates.startsAt

        }),

        cache: "no-store"
    });

    if (!response.ok) {

        console.error(
            "Premium activation failed:",
            await response.text()
        );

        throw new Error(
            "Could not activate Premium."
        );
    }

    const rows = await response.json();

    return rows?.[0] || null;
}


/* =========================================================
   MAIN HANDLER
========================================================= */

module.exports = async function handler(req, res) {

    /* METHOD CHECK */

    if (req.method !== "POST") {

        return send(res, 405, {
            success: false,
            error: "Method not allowed."
        });
    }


    /* ENVIRONMENT CHECK */

    if (
        !SUPABASE_URL ||
        !SERVICE_ROLE_KEY ||
        !ANON_KEY
    ) {

        return send(res, 500, {
            success: false,
            error:
                "Supabase environment variables are missing."
        });
    }


    /* AUTHENTICATION */

    const authorization =
        req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {

        return send(res, 401, {
            success: false,
            error: "Authentication required."
        });
    }

    const token =
        authorization.slice(7).trim();

    if (!token) {

        return send(res, 401, {
            success: false,
            error: "Authentication required."
        });
    }


    try {

        /* -----------------------------------------
           AUTHENTICATE USER
        ----------------------------------------- */

        const user = await getUser(token);

        if (!user?.id) {

            return send(res, 401, {
                success: false,
                error: "Invalid login session."
            });
        }


        /* -----------------------------------------
           READ REQUEST
        ----------------------------------------- */

        const provider = String(
            req.body?.provider || ""
        )
            .toLowerCase()
            .trim();

        const reference = String(
            req.body?.reference || ""
        ).trim();

        const transactionId = String(
            req.body?.transaction_id || ""
        ).trim();

        const sessionId = String(
            req.body?.session_id || ""
        ).trim();

        const txRef = String(
            req.body?.tx_ref || ""
        ).trim();


        if (
            ![
                "paystack",
                "flutterwave",
                "stripe"
            ].includes(provider)
        ) {

            return send(res, 400, {
                success: false,
                error: "Invalid payment provider."
            });
        }


        /* -----------------------------------------
           FIND ORIGINAL PAYMENT RECORD
        ----------------------------------------- */

        let payment = null;

        let verifiedPayment = null;


        /* PAYSTACK */

        if (provider === "paystack") {

            if (!reference) {

                return send(res, 400, {
                    success: false,
                    error:
                        "Paystack payment reference is required."
                });
            }

            payment = await getPaymentRecord(
                user.id,
                "paystack",
                reference
            );
        }


        /* STRIPE */

        else if (provider === "stripe") {

            if (!sessionId) {

                return send(res, 400, {
                    success: false,
                    error:
                        "Stripe session ID is required."
                });
            }

            payment = await getPaymentRecord(
                user.id,
                "stripe",
                sessionId
            );
        }


        /* FLUTTERWAVE */

        else if (provider === "flutterwave") {

            const flutterwaveReference =
                txRef || reference;

            if (
                !transactionId &&
                !flutterwaveReference
            ) {

                return send(res, 400, {
                    success: false,
                    error:
                        "Flutterwave transaction information is required."
                });
            }

            if (flutterwaveReference) {

                payment = await getPaymentRecord(
                    user.id,
                    "flutterwave",
                    flutterwaveReference
                );
            }

            /*
             * If the transaction reference was not supplied,
             * verify the transaction first and retrieve its
             * original tx_ref.
             */

            if (!payment && transactionId) {

                verifiedPayment =
                    await verifyFlutterwave(
                        transactionId
                    );

                if (!verifiedPayment?.tx_ref) {

                    return send(res, 400, {
                        success: false,
                        error:
                            "Flutterwave transaction reference was not returned."
                    });
                }

                payment = await getPaymentRecord(
                    user.id,
                    "flutterwave",
                    verifiedPayment.tx_ref
                );
            }
        }


        if (!payment) {

            return send(res, 404, {
                success: false,
                premium: false,
                error:
                    "Premium payment record was not found."
            });
        }


        /* -----------------------------------------
           ALREADY ACTIVATED
        ----------------------------------------- */

        if (
            payment.status === "active" &&
            payment.is_premium === true
        ) {

            if (!isSubscriptionUnexpired(payment)) {

                return send(res, 409, {

                    success: false,

                    premium: false,

                    expired: true,

                    error:
                        "This subscription has expired. Please choose a plan to renew."

                });
            }

            return send(res, 200, {

                success: true,

                premium: true,

                alreadyActivated: true,

                planType: payment.plan_type,

                startsAt: payment.starts_at,

                expiresAt: payment.expires_at

            });
        }


        /* -----------------------------------------
           ONLY PENDING PAYMENTS CAN BE ACTIVATED
        ----------------------------------------- */

        if (
            payment.status !== "pending" ||
            payment.is_premium !== false
        ) {

            return send(res, 409, {

                success: false,

                premium: false,

                error:
                    "This payment is not eligible for activation."

            });
        }


        /* -----------------------------------------
           VALIDATE STORED PLAN AND PRICE
        ----------------------------------------- */

        const storedPlan =
            validateStoredPlan(payment);

        if (!storedPlan.valid) {

            console.error(
                "Invalid stored Premium plan:",
                payment.id,
                storedPlan.reason
            );

            return send(res, 409, {

                success: false,

                premium: false,

                error: storedPlan.reason

            });
        }

        const planType =
            storedPlan.planType;

        const plan =
            storedPlan.plan;


        /* -----------------------------------------
           VERIFY WITH PAYMENT PROVIDER
        ----------------------------------------- */

        if (provider === "paystack") {

            verifiedPayment =
                await verifyPaystack(
                    payment.provider_reference
                );
        }

        else if (provider === "flutterwave") {

            if (!transactionId) {

                return send(res, 400, {
                    success: false,
                    error:
                        "Flutterwave transaction ID is required."
                });
            }

            if (!verifiedPayment) {

                verifiedPayment =
                    await verifyFlutterwave(
                        transactionId
                    );
            }
        }

        else if (provider === "stripe") {

            verifiedPayment =
                await verifyStripe(
                    payment.provider_reference
                );
        }


        /* -----------------------------------------
           PROVIDER REFERENCE VALIDATION
        ----------------------------------------- */

        if (
            provider === "paystack" &&
            verifiedPayment.reference !==
                payment.provider_reference
        ) {

            return send(res, 400, {

                success: false,

                premium: false,

                error:
                    "Paystack payment reference mismatch."

            });
        }


        if (
            provider === "flutterwave" &&
            verifiedPayment.tx_ref !==
                payment.provider_reference
        ) {

            return send(res, 400, {

                success: false,

                premium: false,

                error:
                    "Flutterwave transaction reference mismatch."

            });
        }


        if (
            provider === "flutterwave" &&
            transactionId &&
            String(verifiedPayment.id) !==
                String(transactionId)
        ) {

            return send(res, 400, {

                success: false,

                premium: false,

                error:
                    "Flutterwave transaction ID mismatch."

            });
        }


        if (
            provider === "stripe" &&
            verifiedPayment.id !==
                payment.provider_reference
        ) {

            return send(res, 400, {

                success: false,

                premium: false,

                error:
                    "Stripe session mismatch."

            });
        }


        /* -----------------------------------------
           VALIDATE ACTUAL PAYMENT
        ----------------------------------------- */

        const validation = validatePayment(

            verifiedPayment,

            provider,

            plan.amount,

            plan.currency,

            user.email

        );


        if (!validation.valid) {

            if (validation.pending) {

                return send(res, 202, {

                    success: false,

                    premium: false,

                    pending: true,

                    error: validation.reason

                });
            }

            return send(res, 402, {

                success: false,

                premium: false,

                error: validation.reason

            });
        }


        /* -----------------------------------------
           ACTIVATE SUBSCRIPTION
        ----------------------------------------- */

        const activated =
            await activatePayment(
                payment,
                planType
            );


        if (!activated) {

            /*
             * Another request may have activated this
             * payment at almost the same time.
             */

            const latestPayment =
                await getPaymentById(
                    user.id,
                    payment.id
                );


            if (
                latestPayment?.status === "active" &&
                latestPayment?.is_premium === true &&
                isSubscriptionUnexpired(latestPayment)
            ) {

                return send(res, 200, {

                    success: true,

                    premium: true,

                    alreadyActivated: true,

                    planType: latestPayment.plan_type,

                    startsAt: latestPayment.starts_at,

                    expiresAt: latestPayment.expires_at

                });
            }


            return send(res, 409, {

                success: false,

                premium: false,

                error:
                    "Payment activation could not be completed. Please check your Premium status."

            });
        }


        /* -----------------------------------------
           SUCCESS
        ----------------------------------------- */

        return send(res, 200, {

            success: true,

            premium: true,

            provider,

            subscriptionId: activated.id,

            planType: activated.plan_type,

            startsAt: activated.starts_at,

            expiresAt: activated.expires_at

        });


    } catch (error) {

        console.error(
            "Premium verification error:",
            error
        );

        return send(res, 500, {

            success: false,

            premium: false,

            error:
                error.message ||
                "Premium verification failed."

        });
    }

};
