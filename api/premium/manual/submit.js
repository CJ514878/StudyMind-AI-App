
"use strict";

/* =========================================================
   STUDYMIND AI — MANUAL PAYMENT SUBMISSION

   Students submit:
   - Plan type
   - Bank transfer reference

   SECURITY:
   - Prices are controlled by the server.
   - Students cannot approve payments.
   - No receipt upload is required.
   - Requests remain pending until admin approval.
   ========================================================= */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const PLANS = {
    weekly: {
        amount: 1000,
        currency: "NGN"
    },
    monthly: {
        amount: 3900,
        currency: "NGN"
    },
    yearly: {
        amount: 46000,
        currency: "NGN"
    }
};

module.exports = async function handler(req, res) {
    res.setHeader("Content-Type", "application/json");

    if (req.method === "OPTIONS") {
        res.setHeader("Allow", "POST, OPTIONS");
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({
            success: false,
            message: "Method not allowed."
        });
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
        console.error("Manual payment API environment variables are missing.");

        return res.status(500).json({
            success: false,
            message: "Payment service is not configured."
        });
    }

    try {
        // -----------------------------------------
        // 1. Authenticate the student
        // -----------------------------------------

        const authorization = req.headers.authorization || "";

        if (!authorization.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Please sign in before submitting a payment."
            });
        }

        const token = authorization.slice(7).trim();

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Your session is invalid. Please sign in again."
            });
        }

        const authResponse = await fetch(
            `${SUPABASE_URL}/auth/v1/user`,
            {
                method: "GET",
                headers: {
                    apikey: SUPABASE_ANON_KEY,
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!authResponse.ok) {
            return res.status(401).json({
                success: false,
                message: "Your session has expired. Please sign in again."
            });
        }

        const user = await authResponse.json();

        if (!user || !user.id) {
            return res.status(401).json({
                success: false,
                message: "Unable to verify your account."
            });
        }

        // -----------------------------------------
        // 2. Validate the submitted information
        // -----------------------------------------

        const body =
            typeof req.body === "string"
                ? JSON.parse(req.body)
                : req.body || {};

        const planType = String(body.plan_type || "")
            .trim()
            .toLowerCase();

        const paymentReference = String(
            body.payment_reference || ""
        ).trim();

        if (!PLANS[planType]) {
            return res.status(400).json({
                success: false,
                message: "Please select a valid Premium plan."
            });
        }

        if (
            paymentReference.length < 4 ||
            paymentReference.length > 120
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid payment reference."
            });
        }

        const plan = PLANS[planType];

        // -----------------------------------------
        // 3. Prevent duplicate reference submissions
        // -----------------------------------------

        const duplicateParams = new URLSearchParams({
            select: "id,status",
            payment_reference: `eq.${paymentReference}`,
            limit: "1"
        });

        const duplicateResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/manual_payment_requests?${duplicateParams}`,
            {
                headers: {
                    apikey: SERVICE_ROLE_KEY,
                    Authorization: `Bearer ${SERVICE_ROLE_KEY}`
                }
            }
        );

        if (!duplicateResponse.ok) {
            throw new Error("Could not check payment reference.");
        }

        const duplicates = await duplicateResponse.json();

        if (duplicates.length > 0) {
            return res.status(409).json({
                success: false,
                message: "This payment reference has already been submitted."
            });
        }

        // -----------------------------------------
        // 4. Prevent multiple pending requests
        // -----------------------------------------

        const pendingParams = new URLSearchParams({
            select: "id",
            user_id: `eq.${user.id}`,
            status: "eq.pending",
            limit: "1"
        });

        const pendingResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/manual_payment_requests?${pendingParams}`,
            {
                headers: {
                    apikey: SERVICE_ROLE_KEY,
                    Authorization: `Bearer ${SERVICE_ROLE_KEY}`
                }
            }
        );

        if (!pendingResponse.ok) {
            throw new Error("Could not check existing payment requests.");
        }

        const pendingRequests = await pendingResponse.json();

        if (pendingRequests.length > 0) {
            return res.status(409).json({
                success: false,
                message: "You already have a pending payment request. Please wait for it to be reviewed."
            });
        }

        // -----------------------------------------
        // 5. Create the pending payment request
        // -----------------------------------------

        const insertResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/manual_payment_requests`,
            {
                method: "POST",
                headers: {
                    apikey: SERVICE_ROLE_KEY,
                    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
                    "Content-Type": "application/json",
                    Prefer: "return=representation"
                },
                body: JSON.stringify({
                    user_id: user.id,
                    plan_type: planType,
                    amount: plan.amount,
                    currency: plan.currency,
                    payment_reference: paymentReference,
                    status: "pending"
                })
            }
        );

        if (!insertResponse.ok) {
            const errorText = await insertResponse.text();

            console.error(
                "Manual payment request insert failed:",
                errorText
            );

            throw new Error("Could not submit your payment request.");
        }

        const inserted = await insertResponse.json();
        const request = inserted[0];

        return res.status(201).json({
            success: true,
            message: "Your payment request has been submitted. Premium will be activated after admin verification.",
            request: {
                id: request.id,
                plan_type: request.plan_type,
                amount: request.amount,
                currency: request.currency,
                status: request.status,
                created_at: request.created_at
            }
        });

    } catch (error) {
        console.error("Manual payment submission error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong while submitting your payment request."
        });
    }
};
