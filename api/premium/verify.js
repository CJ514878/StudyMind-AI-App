
"use strict";

/* =========================================================
   STUDYMIND AI — PREMIUM PAYMENT VERIFICATION
   PAYSTACK + FLUTTERWAVE + STRIPE

   SECURITY:
   - Authenticates the signed-in user.
   - Finds the payment using the user's own database record.
   - Verifies payment directly with the provider.
   - Requires exact amount and currency matches.
   - Does not activate pending or unsuccessful payments.
   - Prevents duplicate activation.
   - Preserves manual Admin Premium records.
========================================================= */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;


/* =========================================================
   RESPONSE HELPER
========================================================= */

function send(res, status, data) {
    return res.status(status).json(data);
}


/* =========================================================
   SUPABASE AUTHENTICATION
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

    return response.json();
}


/* =========================================================
   FIND PAYMENT RECORD
========================================================= */

async function getPaymentRecord(userId, provider, reference) {
    const url =
        `${SUPABASE_URL}/rest/v1/premium_subscriptions` +
        `?user_id=eq.${encodeURIComponent(userId)}` +
        `&provider=eq.${encodeURIComponent(provider)}` +
        `&provider_reference=eq.${encodeURIComponent(reference)}` +
        `&select=*` +
        `&limit=1`;

    const response = await fetch(url, {
        headers: {
            apikey: SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`
        }
    });

    if (!response.ok) {
        const errorText = await response.text();

        console.error(
            "Premium payment lookup failed:",
            errorText
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
        headers: {
            apikey: SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`
        }
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
    const secret = process.env.PAYSTACK_SECRET_KEY;

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
            }
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
    const secret = process.env.FLW_SECRET_KEY;

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
            }
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
========================================================= */

async function verifyStripe(sessionId) {
    const secret = process.env.STRIPE_SECRET_KEY;

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
            }
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

    if (!expectedCurrencyUpper || !Number.isFinite(expectedAmount) || expectedAmount <= 0) {
        return {
            valid: false,
            pending: false,
            reason: "The stored payment amount or currency is invalid."
        };
    }

    let actualAmount;
    let actualCurrency;
    let paymentEmail;
    let successful = false;

    /* PAYSTACK */

    if (provider === "paystack") {
        successful = payment.status === "success";

        actualAmount = Number(payment.amount);
        actualCurrency = payment.currency;

        paymentEmail = payment.customer?.email;

        // Paystack amounts are in the currency's subunit.
        const expectedSubunit = Math.round(
            expectedAmount * 100
        );

        if (!successful) {
            return {
                valid: false,
                pending: true,
                reason: "Paystack has not confirmed successful payment yet."
            };
        }

        if (actualAmount !== expectedSubunit) {
            return {
                valid: false,
                pending: false,
                reason: "Paystack payment amount does not match the expected amount."
            };
        }
    }

    /* FLUTTERWAVE */

    else if (provider === "flutterwave") {
        successful = payment.status === "successful";

        actualAmount = Number(payment.amount);
        actualCurrency = payment.currency;

        paymentEmail = payment.customer?.email;

        if (!successful) {
            return {
                valid: false,
                pending: true,
                reason: "Flutterwave has not confirmed successful payment yet."
            };
        }

        if (actualAmount !== expectedAmount) {
            return {
                valid: false,
                pending: false,
                reason: "Flutterwave payment amount does not match the expected amount."
            };
        }
    }

    /* STRIPE */

    else if (provider === "stripe") {
        successful = payment.payment_status === "paid";

        actualAmount = Number(payment.amount_total);
        actualCurrency = payment.currency;

        paymentEmail =
            payment.customer_details?.email ||
            payment.customer_email;

        // Stripe amounts are in the currency's subunit.
        const expectedSubunit = Math.round(
            expectedAmount * 100
        );

        if (!successful) {
            return {
                valid: false,
                pending: true,
                reason: "Stripe has not confirmed successful payment yet."
            };
        }

        if (actualAmount !== expectedSubunit) {
            return {
                valid: false,
                pending: false,
                reason: "Stripe payment amount does not match the expected amount."
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

    /* CURRENCY CHECK */

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

    /* EMAIL CHECK */

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
   ATOMIC PREMIUM ACTIVATION
========================================================= */

async function activatePayment(payment) {
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
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=representation"
        },
        body: JSON.stringify({
            status: "active",
            is_premium: true,
            activated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
    });

    if (!response.ok) {
        const errorText = await response.text();

        console.error(
            "Premium activation failed:",
            errorText
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
            error: "Supabase environment variables are missing."
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

    const token = authorization.slice(7).trim();

    if (!token) {
        return send(res, 401, {
            success: false,
            error: "Authentication required."
        });
    }

    try {

        /* GET AUTHENTICATED USER */

        const user = await getUser(token);

        if (!user?.id) {
            return send(res, 401, {
                success: false,
                error: "Invalid login session."
            });
        }

        /* READ REQUEST */

        const provider = String(
            req.body?.provider || ""
        ).toLowerCase().trim();

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
            !["paystack", "flutterwave", "stripe"].includes(provider)
        ) {
            return send(res, 400, {
                success: false,
                error: "Invalid payment provider."
            });
        }

        /* FIND ORIGINAL PAYMENT */

        let payment = null;
        let verifiedPayment = null;

        if (provider === "paystack") {

            if (!reference) {
                return send(res, 400, {
                    success: false,
                    error: "Paystack payment reference is required."
                });
            }

            payment = await getPaymentRecord(
                user.id,
                "paystack",
                reference
            );
        }

        else if (provider === "stripe") {

            if (!sessionId) {
                return send(res, 400, {
                    success: false,
                    error: "Stripe session ID is required."
                });
            }

            payment = await getPaymentRecord(
                user.id,
                "stripe",
                sessionId
            );
        }

        else if (provider === "flutterwave") {

            const flutterwaveReference =
                txRef || reference;

            if (!transactionId && !flutterwaveReference) {
                return send(res, 400, {
                    success: false,
                    error: "Flutterwave transaction information is required."
                });
            }

            if (flutterwaveReference) {
                payment = await getPaymentRecord(
                    user.id,
                    "flutterwave",
                    flutterwaveReference
                );
            }

            // If tx_ref was not supplied, verify the transaction
            // first and retrieve its original tx_ref.

            if (!payment && transactionId) {

                verifiedPayment = await verifyFlutterwave(
                    transactionId
                );

                if (!verifiedPayment?.tx_ref) {
                    return send(res, 400, {
                        success: false,
                        error: "Flutterwave transaction reference was not returned."
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
                error: "Premium payment record was not found."
            });
        }

        /* ALREADY ACTIVATED */

        if (
            payment.status === "active" &&
            payment.is_premium === true
        ) {
            return send(res, 200, {
                success: true,
                premium: true,
                alreadyActivated: true
            });
        }

        /* ONLY PENDING RECORDS CAN BE ACTIVATED */

        if (
            payment.status !== "pending" ||
            payment.is_premium !== false
        ) {
            return send(res, 409, {
                success: false,
                premium: false,
                error: "This payment is not eligible for activation."
            });
        }

        /* VERIFY WITH PAYMENT PROVIDER */

        if (provider === "paystack") {
            verifiedPayment = await verifyPaystack(
                payment.provider_reference
            );
        }

        else if (provider === "flutterwave") {

            if (!transactionId) {
                return send(res, 400, {
                    success: false,
                    error: "Flutterwave transaction ID is required."
                });
            }

            if (!verifiedPayment) {
                verifiedPayment = await verifyFlutterwave(
                    transactionId
                );
            }
        }

        else if (provider === "stripe") {
            verifiedPayment = await verifyStripe(
                payment.provider_reference
            );
        }

        /* REFERENCE VALIDATION */

        if (
            provider === "paystack" &&
            verifiedPayment.reference !== payment.provider_reference
        ) {
            return send(res, 400, {
                success: false,
                premium: false,
                error: "Paystack payment reference mismatch."
            });
        }

        if (
            provider === "flutterwave" &&
            verifiedPayment.tx_ref !== payment.provider_reference
        ) {
            return send(res, 400, {
                success: false,
                premium: false,
                error: "Flutterwave transaction reference mismatch."
            });
        }

        if (
            provider === "flutterwave" &&
            transactionId &&
            String(verifiedPayment.id) !== String(transactionId)
        ) {
            return send(res, 400, {
                success: false,
                premium: false,
                error: "Flutterwave transaction ID mismatch."
            });
        }

        if (
            provider === "stripe" &&
            verifiedPayment.id !== payment.provider_reference
        ) {
            return send(res, 400, {
                success: false,
                premium: false,
                error: "Stripe session mismatch."
            });
        }

        /* VALIDATE PAYMENT */

        const validation = validatePayment(
            verifiedPayment,
            provider,
            Number(payment.amount),
            payment.currency,
            user.email
        );

        if (!validation.valid) {

            // Important: a payment that is still processing
            // remains pending. We do not incorrectly mark it failed.

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

        /* ACTIVATE PREMIUM */

        const activated = await activatePayment(payment);

        if (!activated) {

            // Another verification request may have activated
            // the same payment at almost the same time.

            const latestPayment = await getPaymentById(
                user.id,
                payment.id
            );

            if (
                latestPayment?.status === "active" &&
                latestPayment?.is_premium === true
            ) {
                return send(res, 200, {
                    success: true,
                    premium: true,
                    alreadyActivated: true
                });
            }

            return send(res, 409, {
                success: false,
                premium: false,
                error: "Payment activation could not be completed. Please check your Premium status."
            });
        }

        /* SUCCESS */

        return send(res, 200, {
            success: true,
            premium: true,
            provider,
            subscriptionId: activated.id
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
