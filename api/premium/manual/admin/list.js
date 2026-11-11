
"use strict";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

const HEADERS = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
};

function respond(res, status, data) {
    return res.status(status).setHeader
        ? res.status(status).setHeader("Cache-Control", "no-store").json(data)
        : res.status(status).json(data);
}

function getToken(req) {
    const header = req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
        return null;
    }

    return header.substring(7).trim();
}

async function supabaseRequest(path, options = {}) {
    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${path}`,
        {
            ...options,
            headers: {
                "apikey": SERVICE_ROLE_KEY,
                "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
                "Content-Type": "application/json",
                ...options.headers
            }
        }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(
            data?.message ||
            data?.error_description ||
            "Supabase request failed."
        );
    }

    return data;
}

module.exports = async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({
            success: false,
            message: "Method not allowed."
        });
    }

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANON_KEY || !ADMIN_EMAIL) {
        return res.status(500).json({
            success: false,
            message: "Server configuration is incomplete."
        });
    }

    const token = getToken(req);

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Please sign in."
        });
    }

    try {
        // Verify the signed-in user with Supabase Auth.
        const authResponse = await fetch(
            `${SUPABASE_URL}/auth/v1/user`,
            {
                headers: {
                    "apikey": ANON_KEY,
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (!authResponse.ok) {
            return res.status(401).json({
                success: false,
                message: "Your session is invalid or expired."
            });
        }

        const user = await authResponse.json();

        // Admin authorization is checked on the server.
        const userEmail = (user.email || "").toLowerCase();
        const adminEmail = ADMIN_EMAIL.toLowerCase();

        if (!userEmail || userEmail !== adminEmail) {
            return res.status(403).json({
                success: false,
                message: "Admin access required."
            });
        }

        // Retrieve payment requests.
        const requests = await supabaseRequest(
            "manual_payment_requests?select=id,user_id,plan_type,amount,currency,payment_reference,receipt_url,status,admin_note,created_at,reviewed_at&order=created_at.desc&limit=100"
        );

        // Retrieve usernames from Supabase Auth.
        const userIds = [
            ...new Set(
                requests.map(request => request.user_id)
            )
        ];

        const usersById = {};

        if (userIds.length > 0) {
            const authUsers = await fetch(
                `${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1000`,
                {
                    headers: {
                        "apikey": SERVICE_ROLE_KEY,
                        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`
                    }
                }
            );

            if (!authUsers.ok) {
                throw new Error("Could not retrieve student accounts.");
            }

            const authData = await authUsers.json();

            for (const account of authData.users || []) {
                if (!userIds.includes(account.id)) continue;

                const metadata = account.user_metadata || {};

                usersById[account.id] = {
                    username:
                        metadata.username ||
                        metadata.display_name ||
                        metadata.full_name ||
                        "Student",
                    email: account.email || ""
                };
            }
        }

        const paymentRequests = requests.map(request => ({
            ...request,
            student: usersById[request.user_id] || {
                username: "Student",
                email: ""
            }
        }));

        return res.status(200).json({
            success: true,
            count: paymentRequests.length,
            requests: paymentRequests
        });

    } catch (error) {
        console.error(
            "Manual payment admin list error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load payment requests."
        });
    }
};
