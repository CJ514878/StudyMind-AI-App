/* =========================================================
   STUDYMIND AI — PREMIUM CHECKOUT
   PAYSTACK + FLUTTERWAVE + STRIPE
   ========================================================= */

const crypto =
    require("crypto");


const SUPABASE_URL =
    process.env.SUPABASE_URL;

const SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

const ANON_KEY =
    process.env.SUPABASE_ANON_KEY;


const PREMIUM_AMOUNT_NGN =
    Number(
        process.env.PREMIUM_AMOUNT_NGN
    );


const PREMIUM_AMOUNT_USD =
    Number(
        process.env.PREMIUM_AMOUNT_USD
    );


/* =========================================================
   HELPERS
   ========================================================= */

function send(
    res,
    status,
    data
) {

    return res
        .status(status)
        .json(data);

}


async function getUser(
    token
) {

    const response =
        await fetch(
            `${SUPABASE_URL}/auth/v1/user`,
            {
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


async function insertPendingPayment(
    record
) {

    const response =
        await fetch(
            `${SUPABASE_URL}/rest/v1/premium_subscriptions`,
            {
                method: "POST",

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
                    JSON.stringify(
                        record
                    )
            }
        );


    if (!response.ok) {

        const errorText =
            await response.text();


        throw new Error(
            `Could not create Premium payment record: ${errorText}`
        );

    }


    return await response.json();

}


/* =========================================================
   PAYSTACK
   ========================================================= */

async function createPaystackCheckout(
    user
) {

    if (
        !process.env.PAYSTACK_SECRET_KEY
    ) {

        throw new Error(
            "Paystack Secret Key is not configured."
        );

    }


    if (
        !PREMIUM_AMOUNT_NGN ||
        PREMIUM_AMOUNT_NGN <= 0
    ) {

        throw new Error(
            "PREMIUM_AMOUNT_NGN has not been configured."
        );

    }


    const email =
        user.email;


    const response =
        await fetch(
            "https://api.paystack.co/transaction/initialize",
            {
                method: "POST",

                headers: {

                    "Authorization":
                        `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,

                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({

                        email,

                        amount:
                            Math.round(
                                PREMIUM_AMOUNT_NGN *
                                100
                            ),

                        currency:
                            "NGN",

                        callback_url:
                            `${getBaseUrl()}/premium-success.html?provider=paystack`

                    })
            }
        );


    const data =
        await response.json();


    if (
        !response.ok ||
        !data?.status ||
        !data?.data?.authorization_url
    ) {

        throw new Error(
            data?.message ||
            "Paystack could not create checkout."
        );

    }


    await insertPendingPayment({

        user_id:
            user.id,

        provider:
            "paystack",

        provider_reference:
            data.data.reference,

        amount:
            PREMIUM_AMOUNT_NGN,

        currency:
            "NGN",

        status:
            "pending",

        is_premium:
            false

    });


    return {

        checkoutUrl:
            data.data.authorization_url

    };

}


/* =========================================================
   FLUTTERWAVE
   ========================================================= */

async function createFlutterwaveCheckout(
    user
) {

    if (
        !process.env.FLW_SECRET_KEY
    ) {

        throw new Error(
            "Flutterwave Secret Key is not configured."
        );

    }


    if (
        !PREMIUM_AMOUNT_NGN ||
        PREMIUM_AMOUNT_NGN <= 0
    ) {

        throw new Error(
            "PREMIUM_AMOUNT_NGN has not been configured."
        );

    }


    const txRef =
        `STUDYMIND_PREMIUM_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;


    const response =
        await fetch(
            "https://api.flutterwave.com/v3/payments",
            {
                method: "POST",

                headers: {

                    "Authorization":
                        `Bearer ${process.env.FLW_SECRET_KEY}`,

                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({

                        tx_ref:
                            txRef,

                        amount:
                            PREMIUM_AMOUNT_NGN,

                        currency:
                            "NGN",

                        redirect_url:
                            `${getBaseUrl()}/premium-success.html?provider=flutterwave`,

                        customer: {

                            email:
                                user.email

                        },

                        customizations: {

                            title:
                                "StudyMind AI Premium",

                            description:
                                "Unlock the full StudyMind AI experience",

                            logo:
                                `${getBaseUrl()}/favicon.ico`

                        }

                    })
            }
        );


    const data =
        await response.json();


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

        user_id:
            user.id,

        provider:
            "flutterwave",

        provider_reference:
            txRef,

        amount:
            PREMIUM_AMOUNT_NGN,

        currency:
            "NGN",

        status:
            "pending",

        is_premium:
            false

    });


    return {

        checkoutUrl:
            data.data.link

    };

}


/* =========================================================
   STRIPE
   ========================================================= */

async function createStripeCheckout(
    user
) {

    if (
        !process.env.STRIPE_SECRET_KEY
    ) {

        throw new Error(
            "Stripe Secret Key is not configured."
        );

    }


    if (
        !PREMIUM_AMOUNT_USD ||
        PREMIUM_AMOUNT_USD <= 0
    ) {

        throw new Error(
            "PREMIUM_AMOUNT_USD has not been configured."
        );

    }


    const successUrl =
        `${getBaseUrl()}/premium-success.html?provider=stripe&session_id={CHECKOUT_SESSION_ID}`;


    const cancelUrl =
        `${getBaseUrl()}/home.html`;


    const body =
        new URLSearchParams();


    body.append(
        "mode",
        "payment"
    );


    body.append(
        "success_url",
        successUrl
    );


    body.append(
        "cancel_url",
        cancelUrl
    );


    body.append(
        "customer_email",
        user.email
    );


    body.append(
        "line_items[0][price_data][currency]",
        "usd"
    );


    body.append(
        "line_items[0][price_data][product_data][name]",
        "StudyMind AI Premium"
    );


    body.append(
        "line_items[0][price_data][product_data][description]",
        "Unlimited AI tools, knowledge checks and Game Mode."
    );


    body.append(
        "line_items[0][price_data][unit_amount]",
        String(
            Math.round(
                PREMIUM_AMOUNT_USD * 100
            )
        )
    );


    body.append(
        "line_items[0][quantity]",
        "1"
    );


    const response =
        await fetch(
            "https://api.stripe.com/v1/checkout/sessions",
            {
                method: "POST",

                headers: {

                    "Authorization":
                        `Bearer ${process.env.STRIPE_SECRET_KEY}`,

                    "Content-Type":
                        "application/x-www-form-urlencoded"

                },

                body

            }
        );


    const data =
        await response.json();


    if (
        !response.ok ||
        !data?.url ||
        !data?.id
    ) {

        throw new Error(
            data?.error?.message ||
            "Stripe could not create checkout."
        );

    }


    await insertPendingPayment({

        user_id:
            user.id,

        provider:
            "stripe",

        provider_reference:
            data.id,

        amount:
            PREMIUM_AMOUNT_USD,

        currency:
            "USD",

        status:
            "pending",

        is_premium:
            false

    });


    return {

        checkoutUrl:
            data.url

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


    if (
        process.env.VERCEL_URL
    ) {

        return `https://${process.env.VERCEL_URL}`;

    }


    return "http://localhost:3000";

}


/* =========================================================
   HANDLER
   ========================================================= */

module.exports =
    async function handler(
        req,
        res
    ) {

        if (
            req.method !== "POST"
        ) {

            return send(
                res,
                405,
                {
                    error:
                        "Method not allowed."
                }
            );

        }


        if (
            !SUPABASE_URL ||
            !SERVICE_ROLE_KEY ||
            !ANON_KEY
        ) {

            return send(
                res,
                500,
                {
                    error:
                        "Supabase environment variables are missing."
                }
            );

        }


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
                    error:
                        "You must be logged in to purchase Premium."
                }
            );

        }


        const token =
            authorization
                .slice(7)
                .trim();


        try {

            const user =
                await getUser(
                    token
                );


            if (
                !user?.id
            ) {

                return send(
                    res,
                    401,
                    {
                        error:
                            "Invalid login session."
                    }
                );

            }


            /*
             * Check if Premium is already active.
             */

            const existingResponse =
                await fetch(
                    `${SUPABASE_URL}/rest/v1/premium_subscriptions?user_id=eq.${encodeURIComponent(user.id)}&status=eq.active&is_premium=eq.true&select=id&limit=1`,
                    {
                        headers: {

                            "apikey":
                                SERVICE_ROLE_KEY,

                            "Authorization":
                                `Bearer ${SERVICE_ROLE_KEY}`

                        }
                    }
                );


            const existing =
                await existingResponse.json();


            if (
                Array.isArray(existing) &&
                existing.length > 0
            ) {

                return send(
                    res,
                    409,
                    {
                        error:
                            "This account already has Premium."
                    }
                );

            }


            const provider =
                String(
                    req.body?.provider ||
                    ""
                )
                .toLowerCase()
                .trim();


            if (
                ![
                    "paystack",
                    "flutterwave",
                    "stripe"
                ].includes(
                    provider
                )
            ) {

                return send(
                    res,
                    400,
                    {
                        error:
                            "Invalid payment provider."
                    }
                );

            }


            let checkout;


            if (
                provider ===
                "paystack"
            ) {

                checkout =
                    await createPaystackCheckout(
                        user
                    );

            }


            if (
                provider ===
                "flutterwave"
            ) {

                checkout =
                    await createFlutterwaveCheckout(
                        user
                    );

            }


            if (
                provider ===
                "stripe"
            ) {

                checkout =
                    await createStripeCheckout(
                        user
                    );

            }


            return send(
                res,
                200,
                checkout
            );

        } catch (error) {

            console.error(
                "Create Premium checkout error:",
                error
            );


            return send(
                res,
                500,
                {
                    error:
                        error.message ||
                        "Could not create Premium checkout."
                }
            );

        }

    };
