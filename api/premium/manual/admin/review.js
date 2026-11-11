
"use strict";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

module.exports = async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    if (req.method !== "POST") {
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

    const token = (req.headers.authorization || "")
        .replace(/^Bearer\s+/i, "")
        .trim();

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Please sign in."
        });
    }

    try {
        // Verify the signed-in user.
        const authResponse = await fetch(
            `${SUPABASE_URL}/auth/v1/user`,
            {
                headers: {
                    apikey: ANON_KEY,
                    Authorization: `Bearer ${token}`
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

        // Verify admin identity on the server.
        if (
            !user.email ||
            user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()
        ) {
            return res.status(403).json({
                success: false,
                message: "Admin access required."
            });
        }

        const {
            request_id,
            decision,
            admin_note
        } = req.body || {};

        if (
            typeof request_id !== "string" ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(request_id)
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid payment request ID is required."
            });
        }

        if (!["approved", "rejected"].includes(decision)) {
            return res.status(400).json({
                success: false,
                message: "Decision must be approved or rejected."
            });
        }

        if (
            admin_note !== undefined &&
            admin_note !== null &&
            (typeof admin_note !== "string" || admin_note.length > 500)
        ) {
            return res.status(400).json({
                success: false,
                message: "Admin note must be 500 characters or fewer."
            });
        }

        // Call the protected database function.
        const rpcResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/rpc/review_manual_premium_payment`,
            {
                method: "POST",
                headers: {
                    apikey: SERVICE_ROLE_KEY,
                    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    p_request_id: request_id,
                    p_admin_user_id: user.id,
                    p_decision: decision,
                    p_admin_note: admin_note || null
                })
            }
        );

        const result = await rpcResponse.json().catch(() => null);

        if (!rpcResponse.ok) {
            console.error("Payment review RPC error:", result);

            return res.status(400).json({
                success: false,
                message: result?.message ||
                    result?.details ||
                    "Unable to process this payment review."
            });
        }

        return res.status(200).json({
            success: true,
            status: result?.status,
            expires_at: result?.expires_at || null,
            message: decision === "approved"
                ? "Payment approved and Premium activated."
                : "Payment request rejected."
        });

    } catch (error) {
        console.error("Manual payment review error:", error.message);

        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred."
        });
    }
};

