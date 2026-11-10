
"use strict";

/* =========================================================
   STUDYMIND AI — START 7-DAY PREMIUM TRIAL

   RULES:
   - Trial starts only after an explicit user request.
   - Each account can ever receive ONE trial.
   - Trial lasts exactly 7 days.
   - Admin accounts already have permanent Premium.
   - All trial creation is handled securely server-side.
   ========================================================= */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;

const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function send(res, status, data) {
    return res.status(status).json(data);
}

function getBearerToken(req) {
    const header = req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
        return null;
    }

    return header.slice(7).trim();
}

async function supabaseRequest(path, options = {}) {
    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${path}`,
        {
            ...options,
            headers: {
                apikey: SERVICE_ROLE_KEY,
                Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        }
    );

    const text = await response.text();

    let data = null;

    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    return {
        ok: response.ok,
        status: response.status,
        data
    };
}

async function getAuthenticatedUser(token) {
    const response = await fetch(
        `${SUPABASE_URL}/auth/v1/user`,
        {
            method: "GET",
            headers: {
                apikey: ANON_KEY,
                Authorization: `Bearer ${token}`
            }
        }
    );

    if (!response.ok) {
        return null;
    }

    return response.json();
}

function isAdminUser(user) {
    const adminEmail = (
        process.env.ADMIN_EMAIL || ""
    ).trim().toLowerCase();

    const userEmail = (
        user.email || ""
    ).trim().toLowerCase();

    return Boolean(
        adminEmail &&
        userEmail &&
        adminEmail === userEmail
    );
}

module.exports = async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");

        return send(res, 405, {
            success: false,
            error: "Method not allowed."
        });
    }

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANON_KEY) {
        console.error("Premium trial environment variables are missing.");

        return send(res, 500, {
            success: false,
            error: "The trial service is not configured."
        });
    }

    try {
        const token = getBearerToken(req);

        if (!token) {
            return send(res, 401, {
                success: false,
                error: "Please sign in to start your trial."
            });
        }

        const user = await getAuthenticatedUser(token);

        if (!user || !user.id) {
            return send(res, 401, {
                success: false,
                error: "Your session is invalid. Please sign in again."
            });
        }

        // Admin already has permanent Premium.
        if (isAdminUser(user)) {
            return send(res, 200, {
                success: true,
                premium: true,
                isTrial: false,
                isAdmin: true,
                message: "Your account already has permanent Premium."
            });
        }

        const now = new Date();
        const nowISO = now.toISOString();

        // Do not allow a trial to start while paid Premium is active.
        const paidResult = await supabaseRequest(
            "premium_subscriptions" +
            `?user_id=eq.${encodeURIComponent(user.id)}` +
            "&status=eq.active" +
            "&is_premium=eq.true" +
            `&expires_at=gt.${encodeURIComponent(nowISO)}` +
            "&select=id,expires_at" +
            "&limit=1"
        );

        if (!paidResult.ok) {
            console.error(
                "Could not check paid subscription:",
                paidResult.data
            );

            return send(res, 500, {
                success: false,
                error: "Could not verify your Premium status. Please try again."
            });
        }

        if (Array.isArray(paidResult.data) && paidResult.data.length > 0) {
            return send(res, 409, {
                success: false,
                error: "Your account already has an active paid Premium subscription."
            });
        }

        // A row means the user has already used, cancelled,
        // or expired their one-time trial.
        const existingTrial = await supabaseRequest(
            "premium_trials" +
            `?user_id=eq.${encodeURIComponent(user.id)}` +
            "&select=user_id,status,starts_at,expires_at" +
            "&limit=1"
        );

        if (!existingTrial.ok) {
            console.error(
                "Could not check previous trial:",
                existingTrial.data
            );

            return send(res, 500, {
                success: false,
                error: "Could not verify your trial eligibility. Please try again."
            });
        }

        if (
            Array.isArray(existingTrial.data) &&
            existingTrial.data.length > 0
        ) {
            const previous = existingTrial.data[0];

            return send(res, 409, {
                success: false,
                error: "Your account has already used its free trial.",
                trialStatus: previous.status,
                expiresAt: previous.expires_at
            });
        }

        const startsAt = new Date();
        const expiresAt = new Date(
            startsAt.getTime() + TRIAL_DURATION_MS
        );

        // The primary key on user_id prevents duplicate trials,
        // including simultaneous requests.
        const insertResult = await supabaseRequest(
            "premium_trials",
            {
                method: "POST",
                headers: {
                    Prefer: "return=representation"
                },
                body: JSON.stringify({
                    user_id: user.id,
                    status: "active",
                    starts_at: startsAt.toISOString(),
                    expires_at: expiresAt.toISOString(),
                    updated_at: startsAt.toISOString()
                })
            }
        );

        if (!insertResult.ok) {
            // PostgreSQL 23505 = unique constraint violation.
            if (
                insertResult.status === 409 ||
                (
                    insertResult.data &&
                    insertResult.data.code === "23505"
                )
            ) {
                return send(res, 409, {
                    success: false,
                    error: "Your account has already used its free trial."
                });
            }

            console.error(
                "Could not create Premium trial:",
                insertResult.data
            );

            return send(res, 500, {
                success: false,
                error: "Your free trial could not be started. Please try again."
            });
        }

        return send(res, 201, {
            success: true,
            premium: true,
            isTrial: true,
            planType: "trial",
            startsAt: startsAt.toISOString(),
            expiresAt: expiresAt.toISOString(),
            message: "Your 7-day Premium trial has started!"
        });

    } catch (error) {
        console.error("Premium trial start error:", error);

        return send(res, 500, {
            success: false,
            error: "An unexpected error occurred while starting your trial."
        });
    }
};
