/* =========================================================
   STUDYMIND AI — PREMIUM PAYMENT VERIFICATION
   PAYSTACK + FLUTTERWAVE + STRIPE
   ========================================================= */

"use strict";

const SUPABASE_URL =
    process.env.SUPABASE_URL;

const SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

const ANON_KEY =
    process.env.SUPABASE_ANON_KEY;

const PREMIUM_AMOUNT_NGN =
    Number(process.env.PREMIUM_AMOUNT_NGN);

const PREMIUM_AMOUNT_USD =
    Number(process.env.PREMIUM_AMOUNT_USD);


/* =========================================================
   RESPONSE HELPER
   ========================================================= */

function send(res, status, data) {
    return res.status(status).json(data);
}


/* =========================================================
   GET USER FROM SUPABASE ACCESS TOKEN
   ========================================================= */

async function getUser(token) {

    const response = await fetch(
        `${SUPABASE_URL}/auth/v1/user`,
        {
            method: "GET",

            headers: {
                "Authorization":
                    `Bearer ${token}`,

                "apikey":
                    ANON_KEY
            }
        }
    );

    if (!response.ok) {
        return null;
    }

    return await response.json();
}


/* =========================================================
   GET PAYMENT RECORD BY ID
   ========================================================= */

async function getPaymentById(
    userId,
    paymentId
) {

    const url =
        `${SUPABASE_URL}/rest/v1/premium_subscriptions` +
        `?id=eq.${encodeURIComponent(paymentId)}` +
        `&user_id=eq.${encodeURIComponent(userId)}` +
        `&select=*` +
        `&limit=1`;

    const response = await fetch(
        url,
        {
            headers: {
                "apikey":
                    SERVICE_ROLE_KEY,

                "Authorization":
                    `Bearer ${SERVICE_ROLE_KEY}`
            }
        }
    );

    if (!response.ok) {

        const errorText =
            await response.text();

        console.error(
            "Premium payment lookup failed:",
            errorText
        );

        throw new Error(
            "Could not find the Premium payment."
        );
    }

    const rows =
        await response.json();

    return rows?.[0] || null;
}


/* =========================================================
   FIND PAYMENT BY PROVIDER REFERENCE
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

    const response = await fetch(
        url,
        {
            headers: {
                "apikey":
                    SERVICE_ROLE_KEY,

                "Authorization":
                    `Bearer ${SERVICE_ROLE_KEY}`
            }
        }
    );

    if (!response.ok) {

        const errorText =
            await response.text();

        console.error(
            "Premium payment lookup failed:",
            errorText
        );

        throw new Error(
            "Could not find the Premium payment."
        );
    }

    const rows =
        await response.json();

    return rows?.[0] || null;
}


/* =========================================================
   UPDATE PAYMENT RECORD
   ========================================================= */

async function updatePayment(
    paymentId,
    values
) {

    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/premium_subscriptions?id=eq.${encodeURIComponent(paymentId)}`,
        {
            method: "PATCH",

            headers: {
                "apikey":
                    SERVICE_ROLE_KEY,

                "Authorization":
                    `Bearer ${SERVICE_ROLE_KEY}`,

                "Content-Type":
                    "application/json",

                "Prefer":
                    "return=representation"
            },

            body:
                JSON.stringify({
                    ...values,

                    updated_at:
                        new Date().toISOString()
                })
        }
    );

    if (!response.ok) {

        const errorText =
            await response.text();

        console.error(
            "Premium payment update failed:",
            errorText
        );

        throw new Error(
            "Could not update Premium payment."
        );
    }

    const rows =
        await response.json();

    return rows?.[0] || null;
}


/* =========================================================
   PAYSTACK VERIFICATION
   ========================================================= */

async function verifyPaystack(
    reference
) {

    if (!process.env.PAYSTACK_SECRET_KEY) {

        throw new Error(
            "Paystack Secret Key is not configured."
        );
    }

    const response =
        await fetch(
            `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
                }
            }
        );

    const data =
        await response.json();

    if (
        !response.ok ||
        data?.status !== true ||
        !data?.data
    ) {

        throw new Error(
            data?.message ||
            "Paystack verification failed."
        );
    }

    return data.data;
}


/* =========================================================
   FLUTTERWAVE VERIFICATION
   ========================================================= */

async function verifyFlutterwave(
    transactionId
) {

    if (!process.env.FLW_SECRET_KEY) {

        throw new Error(
            "Flutterwave Secret Key is not configured."
        );
    }

    const response =
        await fetch(
            `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${process.env.FLW_SECRET_KEY}`,

                    "Content-Type":
                        "application/json"
                }
            }
        );

    const data =
        await response.json();

    if (
        !response.ok ||
        data?.status !== "success" ||
        !data?.data
    ) {

        throw new Error(
            data?.message ||
            "Flutterwave verification failed."
        );
    }

    return data.data;
}


/* =========================================================
   STRIPE VERIFICATION
   ========================================================= */

async function verifyStripe(
    sessionId
) {

    if (!process.env.STRIPE_SECRET_KEY) {

        throw new Error(
            "Stripe Secret Key is not configured."
        );
    }

    const response =
        await fetch(
            `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${process.env.STRIPE_SECRET_KEY}`
                }
            }
        );

    const data =
        await response.json();

    if (
        !response.ok ||
        !data?.id
    ) {

        throw new Error(
            data?.error?.message ||
            "Stripe verification failed."
        );
    }

    return data;
}


/* =========================================================
   VALIDATE PAYMENT
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
            reason:
                "No payment information was returned."
        };
    }


    /* =====================================================
       PAYSTACK
       ===================================================== */

    if (provider === "paystack") {

        if (
            payment.status !==
            "success"
        ) {

            return {
                valid: false,
                reason:
                    "Paystack payment was not successful."
            };
        }

        if (
            String(payment.currency)
                .toUpperCase() !==
            expectedCurrency
        ) {

            return {
                valid: false,
                reason:
                    "Payment currency does not match."
            };
        }

        const expectedSubunit =
            Math.round(
                expectedAmount * 100
            );

        if (
            Number(payment.amount) <
            expectedSubunit
        ) {

            return {
                valid: false,
                reason:
                    "Payment amount is insufficient."
            };
        }

        if (
            userEmail &&
            payment.customer?.email &&
            payment.customer.email.toLowerCase() !==
                userEmail.toLowerCase()
        ) {

            return {
                valid: false,
                reason:
                    "Payment email does not match the account."
            };
        }

        return {
            valid: true
        };
    }


    /* =====================================================
       FLUTTERWAVE
       ===================================================== */

    if (provider === "flutterwave") {

        if (
            payment.status !==
            "successful"
        ) {

            return {
                valid: false,
                reason:
                    "Flutterwave payment was not successful."
            };
        }

        if (
            String(payment.currency)
                .toUpperCase() !==
            expectedCurrency
        ) {

            return {
                valid: false,
                reason:
                    "Payment currency does not match."
            };
        }

        if (
            Number(payment.amount) <
            Number(expectedAmount)
        ) {

            return {
                valid: false,
                reason:
                    "Payment amount is insufficient."
            };
        }

        if (
            userEmail &&
            payment.customer?.email &&
            payment.customer.email.toLowerCase() !==
                userEmail.toLowerCase()
        ) {

            return {
                valid: false,
                reason:
                    "Payment email does not match the account."
            };
        }

        return {
            valid: true
        };
    }


    /* =====================================================
       STRIPE
       ===================================================== */

    if (provider === "stripe") {

        if (
            payment.payment_status !==
            "paid"
        ) {

            return {
                valid: false,
                reason:
                    "Stripe payment has not been completed."
            };
        }

        const expectedSubunit =
            Math.round(
                expectedAmount * 100
            );

        if (
            Number(payment.amount_total) <
            expectedSubunit
        ) {

            return {
                valid: false,
                reason:
                    "Payment amount is insufficient."
            };
        }

        if (
            String(payment.currency)
                .toUpperCase() !==
            expectedCurrency
        ) {

            return {
                valid: false,
                reason:
                    "Payment currency does not match."
            };
        }

        if (
            userEmail &&
            payment.customer_details?.email &&
            payment.customer_details.email.toLowerCase() !==
                userEmail.toLowerCase()
        ) {

            return {
                valid: false,
                reason:
                    "Payment email does not match the account."
            };
        }

        return {
            valid: true
        };
    }


    return {
        valid: false,
        reason:
            "Unsupported payment provider."
    };
}


/* =========================================================
   HANDLER
   ========================================================= */

module.exports =
    async function handler(
        req,
        res
    ) {

        if (req.method !== "POST") {

            return send(
                res,
                405,
                {
                    success: false,
                    error:
                        "Method not allowed."
                }
            );
        }


        /* =================================================
           CHECK ENVIRONMENT
           ================================================= */

        if (
            !SUPABASE_URL ||
            !SERVICE_ROLE_KEY ||
            !ANON_KEY
        ) {

            return send(
                res,
                500,
                {
                    success: false,
                    error:
                        "Supabase environment variables are missing."
                }
            );
        }


        /* =================================================
           AUTHENTICATION
           ================================================= */

        const authorization =
            req.headers.authorization ||
            "";

        if (
            !authorization.startsWith(
                "Bearer "
            )
        ) {

            return send(
                res,
                401,
                {
                    success: false,
                    error:
                        "Authentication required."
                }
            );
        }


        const token =
            authorization
                .slice(7)
                .trim();


        if (!token) {

            return send(
                res,
                401,
                {
                    success: false,
                    error:
                        "Authentication required."
                }
            );
        }


        try {

            /* =================================================
               GET AUTHENTICATED USER
               ================================================= */

            const user =
                await getUser(token);

            if (!user?.id) {

                return send(
                    res,
                    401,
                    {
                        success: false,
                        error:
                            "Invalid login session."
                    }
                );
            }


            /* =================================================
               READ REQUEST
               ================================================= */

            const provider =
                String(
                    req.body?.provider ||
                    ""
                )
                .toLowerCase()
                .trim();


            const reference =
                String(
                    req.body?.reference ||
                    ""
                )
                .trim();


            const transactionId =
                String(
                    req.body?.transaction_id ||
                    ""
                )
                .trim();


            const sessionId =
                String(
                    req.body?.session_id ||
                    ""
                )
                .trim();


            if (
                ![
                    "paystack",
                    "flutterwave",
                    "stripe"
                ].includes(provider)
            ) {

                return send(
                    res,
                    400,
                    {
                        success: false,
                        error:
                            "Invalid payment provider."
                    }
                );
            }


            /* =================================================
               FIND ORIGINAL PAYMENT
               ================================================= */

            let payment = null;


            /*
             * PAYSTACK
             *
             * The Paystack reference returned after checkout
             * is the same reference stored in our database.
             */

            if (
                provider ===
                "paystack"
            ) {

                if (!reference) {

                    return send(
                        res,
                        400,
                        {
                            success: false,
                            error:
                                "Paystack payment reference is required."
                        }
                    );
                }

                payment =
                    await getPaymentRecord(
                        user.id,
                        "paystack",
                        reference
                    );
            }


            /*
             * STRIPE
             *
             * The Stripe Checkout Session ID is stored as
             * provider_reference.
             */

            if (
                provider ===
                "stripe"
            ) {

                if (!sessionId) {

                    return send(
                        res,
                        400,
                        {
                            success: false,
                            error:
                                "Stripe session ID is required."
                        }
                    );
                }

                payment =
                    await getPaymentRecord(
                        user.id,
                        "stripe",
                        sessionId
                    );
            }


            /*
             * FLUTTERWAVE
             *
             * Flutterwave gives us BOTH:
             *
             *   transaction_id
             *   tx_ref
             *
             * Our database stores tx_ref.
             *
             * Therefore we search by tx_ref first.
             */

            if (
                provider ===
                "flutterwave"
            ) {

                const flutterwaveTxRef =
                    String(
                        req.body?.tx_ref ||
                        reference ||
                        ""
                    ).trim();


                if (
                    !transactionId &&
                    !flutterwaveTxRef
                ) {

                    return send(
                        res,
                        400,
                        {
                            success: false,
                            error:
                                "Flutterwave transaction information is required."
                        }
                    );
                }


                if (
                    flutterwaveTxRef
                ) {

                    payment =
                        await getPaymentRecord(
                            user.id,
                            "flutterwave",
                            flutterwaveTxRef
                        );
                }


                /*
                 * If tx_ref was not supplied, we cannot safely
                 * connect transaction_id to our pending record
                 * without querying the provider first.
                 *
                 * We therefore use transaction_id to retrieve
                 * the real Flutterwave transaction below and then
                 * match its tx_ref against our database.
                 */

                if (
                    !payment &&
                    transactionId
                ) {

                    const verified =
                        await verifyFlutterwave(
                            transactionId
                        );


                    if (
                        !verified?.tx_ref
                    ) {

                        return send(
                            res,
                            400,
                            {
                                success: false,
                                error:
                                    "Flutterwave transaction reference was not returned."
                            }
                        );
                    }


                    payment =
                        await getPaymentRecord(
                            user.id,
                            "flutterwave",
                            verified.tx_ref
                        );
                }
            }


            if (!payment) {

                return send(
                    res,
                    404,
                    {
                        success: false,
                        error:
                            "Premium payment record was not found."
                    }
                );
            }


            /* =================================================
               ALREADY ACTIVE
               ================================================= */

            if (
                payment.status === "active" &&
                payment.is_premium === true
            ) {

                return send(
                    res,
                    200,
                    {
                        success: true,
                        premium: true,
                        alreadyActivated: true
                    }
                );
            }


            /* =================================================
               EXPECTED PAYMENT DETAILS
               ================================================= */

            const expectedAmount =
                Number(
                    payment.amount
                );

            const expectedCurrency =
                String(
                    payment.currency ||
                    ""
                ).toUpperCase();


            let verifiedPayment;


            /* =================================================
               VERIFY WITH PAYMENT PROVIDER
               ================================================= */

            if (
                provider ===
                "paystack"
            ) {

                verifiedPayment =
                    await verifyPaystack(
                        payment.provider_reference
                    );
            }


            if (
                provider ===
                "flutterwave"
            ) {

                if (!transactionId) {

                    return send(
                        res,
                        400,
                        {
                            success: false,
                            error:
                                "Flutterwave transaction ID is required."
                        }
                    );
                }

                verifiedPayment =
                    await verifyFlutterwave(
                        transactionId
                    );
            }


            if (
                provider ===
                "stripe"
            ) {

                verifiedPayment =
                    await verifyStripe(
                        payment.provider_reference
                    );
            }


            /* =================================================
               VALIDATE PAYMENT
               ================================================= */

            const validation =
                validatePayment(
                    verifiedPayment,
                    provider,
                    expectedAmount,
                    expectedCurrency,
                    user.email
                );


            if (!validation.valid) {

                /*
                 * Do not activate Premium.
                 */

                await updatePayment(
                    payment.id,
                    {
                        status:
                            "failed",

                        is_premium:
                            false
                    }
                );

                return send(
                    res,
                    402,
                    {
                        success: false,
                        premium: false,
                        error:
                            validation.reason
                    }
                );
            }


            /* =================================================
               ADDITIONAL REFERENCE CHECKS
               ================================================= */

            if (
                provider ===
                "paystack"
            ) {

                if (
                    verifiedPayment.reference !==
                    payment.provider_reference
                ) {

                    return send(
                        res,
                        400,
                        {
                            success: false,
                            error:
                                "Paystack payment reference mismatch."
                        }
                    );
                }
            }


            if (
                provider ===
                "flutterwave"
            ) {

                if (
                    verifiedPayment.tx_ref !==
                    payment.provider_reference
                ) {

                    return send(
                        res,
                        400,
                        {
                            success: false,
                            error:
                                "Flutterwave transaction reference mismatch."
                        }
                    );
                }
            }


            if (
                provider ===
                "stripe"
            ) {

                if (
                    verifiedPayment.id !==
                    payment.provider_reference
                ) {

                    return send(
                        res,
                        400,
                        {
                            success: false,
                            error:
                                "Stripe session mismatch."
                        }
                    );
                }
            }


            /* =================================================
               ACTIVATE PREMIUM
               ================================================= */

            const activated =
                await updatePayment(
                    payment.id,
                    {
                        status:
                            "active",

                        is_premium:
                            true,

                        activated_at:
                            new Date().toISOString()
                    }
                );


            if (!activated) {

                throw new Error(
                    "Premium activation failed."
                );
            }


            /* =================================================
               SUCCESS
               ================================================= */

            return send(
                res,
                200,
                {
                    success: true,

                    premium: true,

                    provider,

                    subscriptionId:
                        activated.id
                }
            );

        } catch (error) {

            console.error(
                "Premium verification error:",
                error
            );

            return send(
                res,
                500,
                {
                    success: false,

                    premium: false,

                    error:
                        error.message ||
                        "Premium verification failed."
                }
            );
        }
    };
