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

function send(
    res,
    status,
    data
) {

    return res
        .status(status)
        .json(data);

}


/* =========================================================
   GET USER FROM ACCESS TOKEN
   ========================================================= */

async function getUserFromToken(
    token
) {

    const response =
        await fetch(
            `${SUPABASE_URL}/auth/v1/user`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${token}`,

                    "apikey":
                        process.env.SUPABASE_ANON_KEY
                }
            }
        );


    if (!response.ok) {

        return null;

    }


    return await response.json();

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
            req.method !== "GET"
        ) {

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


        if (
            !SUPABASE_URL ||
            !SUPABASE_SERVICE_ROLE_KEY ||
            !process.env.SUPABASE_ANON_KEY
        ) {

            return send(
                res,
                500,
                {
                    premium: false,
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
                    premium: false,
                    error:
                        "Authentication required."
                }
            );

        }


        const token =
            authorization.slice(7).trim();


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

            const user =
                await getUserFromToken(
                    token
                );


            if (
                !user?.id
            ) {

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


            const response =
                await fetch(
                    `${SUPABASE_URL}/rest/v1/premium_subscriptions?user_id=eq.${encodeURIComponent(user.id)}&status=eq.active&is_premium=eq.true&select=id&limit=1`,
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


                return send(
                    res,
                    500,
                    {
                        premium: false,
                        error:
                            "Could not check Premium status."
                    }
                );

            }


            const rows =
                await response.json();


            const premium =
                Array.isArray(rows) &&
                rows.length > 0;


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
