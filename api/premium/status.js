/* =========================================================
   STUDYMIND AI — PREMIUM STATUS API
   ========================================================= */

const SUPABASE_URL =
    process.env.SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY;


/* =========================================================
   RESPONSE HELPER
   ========================================================= */

function send(res, status, data) {

    return res
        .status(status)
        .json(data);

}


/* =========================================================
   GET USER FROM ACCESS TOKEN
   ========================================================= */

async function getUserFromToken(token) {

    if (
        !SUPABASE_URL ||
        !SUPABASE_SERVICE_ROLE_KEY
    ) {
        throw new Error(
            "Supabase server configuration is missing."
        );
    }


    const response = await fetch(
        `${SUPABASE_URL}/auth/v1/user`,
        {
            method: "GET",

            headers: {
                "Authorization":
                    `Bearer ${token}`,

                /*
                 * Supabase accepts the service-role
                 * key for this server-side request.
                 */
                "apikey":
                    SUPABASE_SERVICE_ROLE_KEY
            }
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
   CHECK PREMIUM SUBSCRIPTION
   ========================================================= */

async function checkPremiumSubscription(userId) {

    const url =
        `${SUPABASE_URL}/rest/v1/premium_subscriptions` +
        `?user_id=eq.${encodeURIComponent(userId)}` +
        `&status=eq.active` +
        `&is_premium=eq.true` +
        `&select=id` +
        `&limit=1`;


    const response = await fetch(
        url,
        {
            method: "GET",

            headers: {
                "apikey":
                    SUPABASE_SERVICE_ROLE_KEY,

                "Authorization":
                    `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,

                "Content-Type":
                    "application/json"
            }
        }
    );


    if (!response.ok) {

        const errorText =
            await response.text();

        console.error(
            "Premium database error:",
            errorText
        );

        throw new Error(
            "Premium database request failed."
        );

    }


    const rows =
        await response.json();


    return (
        Array.isArray(rows) &&
        rows.length > 0
    );

}


/* =========================================================
   HANDLER
   ========================================================= */

module.exports =
    async function handler(req, res) {

        /*
         * Only GET is allowed.
         */

        if (req.method !== "GET") {

            return send(
                res,
                405,
                {
                    premium: false,
                    error:
                        "Method not allowed."
                }
            );

        }


        /*
         * Check server configuration.
         */

        if (
            !SUPABASE_URL ||
            !SUPABASE_SERVICE_ROLE_KEY
        ) {

            console.error(
                "Missing Supabase server environment variables."
            );

            return send(
                res,
                500,
                {
                    premium: false,
                    error:
                        "Supabase server configuration is missing."
                }
            );

        }


        /*
         * Read Authorization header.
         */

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
                    premium: false,
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
                    premium: false,
                    error:
                        "Authentication required."
                }
            );

        }


        try {

            /*
             * Validate the Supabase
             * access token.
             */

            const user =
                await getUserFromToken(
                    token
                );


            if (!user?.id) {

                return send(
                    res,
                    401,
                    {
                        premium: false,
                        error:
                            "Invalid authentication token."
                    }
                );

            }


            /*
             * Check the database for an
             * active Premium subscription.
             */

            const premium =
                await checkPremiumSubscription(
                    user.id
                );


            /*
             * Return the server's
             * authoritative Premium state.
             */

            return send(
                res,
                200,
                {
                    premium,
                    userId: user.id
                }
            );

        } catch (error) {

            console.error(
                "Premium status error:",
                error
            );


            return send(
                res,
                500,
                {
                    premium: false,
                    error:
                        "Premium status check failed."
                }
            );

        }

    };
