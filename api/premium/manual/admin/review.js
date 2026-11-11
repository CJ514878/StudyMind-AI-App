
CREATE OR REPLACE FUNCTION public.review_manual_premium_payment(
    p_request_id UUID,
    p_admin_user_id UUID,
    p_decision TEXT,
    p_admin_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_request public.manual_payment_requests%ROWTYPE;
    v_now TIMESTAMPTZ := NOW();
    v_expires_at TIMESTAMPTZ;
BEGIN
    IF p_decision NOT IN ('approved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid decision.';
    END IF;

    IF p_admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Admin user is required.';
    END IF;

    SELECT *
    INTO v_request
    FROM public.manual_payment_requests
    WHERE id = p_request_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment request not found.';
    END IF;

    IF v_request.status <> 'pending' THEN
        RAISE EXCEPTION 'This payment request has already been reviewed.';
    END IF;

    IF v_request.user_id = p_admin_user_id THEN
        RAISE EXCEPTION 'You cannot review your own payment request.';
    END IF;

    IF p_decision = 'rejected' THEN

        UPDATE public.manual_payment_requests
        SET
            status = 'rejected',
            admin_user_id = p_admin_user_id,
            admin_note = p_admin_note,
            reviewed_at = v_now,
            updated_at = v_now
        WHERE id = p_request_id;

        RETURN jsonb_build_object(
            'success', true,
            'status', 'rejected'
        );

    END IF;

    -- Verify the server-defined price.
    IF v_request.currency <> 'NGN'
       OR (v_request.plan_type = 'weekly' AND v_request.amount <> 1000)
       OR (v_request.plan_type = 'monthly' AND v_request.amount <> 3900)
       OR (v_request.plan_type = 'yearly' AND v_request.amount <> 46000)
       OR v_request.plan_type NOT IN ('weekly', 'monthly', 'yearly')
    THEN
        RAISE EXCEPTION 'Payment request has an invalid plan or amount.';
    END IF;

    -- Calculate expiry using calendar periods.
    CASE v_request.plan_type
        WHEN 'weekly' THEN
            v_expires_at := v_now + INTERVAL '7 days';

        WHEN 'monthly' THEN
            v_expires_at := v_now + INTERVAL '1 month';

        WHEN 'yearly' THEN
            v_expires_at := v_now + INTERVAL '1 year';
    END CASE;

    -- Lock and reject approval if another paid subscription is active.
    PERFORM 1
    FROM public.premium_subscriptions
    WHERE user_id = v_request.user_id
      AND status = 'active'
      AND is_premium = TRUE
      AND expires_at > v_now
    FOR UPDATE;

    IF FOUND THEN
        RAISE EXCEPTION 'Student already has an active paid subscription.';
    END IF;

    -- Activate the payment request.
    UPDATE public.manual_payment_requests
    SET
        status = 'approved',
        admin_user_id = p_admin_user_id,
        admin_note = p_admin_note,
        reviewed_at = v_now,
        updated_at = v_now
    WHERE id = p_request_id;

    -- Create the actual Premium subscription.
    INSERT INTO public.premium_subscriptions (
        user_id,
        provider,
        provider_reference,
        amount,
        currency,
        status,
        is_premium,
        created_at,
        updated_at,
        activated_at,
        plan_type,
        starts_at,
        expires_at,
        is_trial,
        renewal_type
    )
    VALUES (
        v_request.user_id,
        'manual',
        'manual-' || v_request.id::TEXT,
        v_request.amount,
        v_request.currency,
        'active',
        TRUE,
        v_now,
        v_now,
        v_now,
        v_request.plan_type,
        v_now,
        v_expires_at,
        FALSE,
        'manual'
    );

    RETURN jsonb_build_object(
        'success', true,
        'status', 'approved',
        'expires_at', v_expires_at
    );
END;
$$;

REVOKE ALL ON FUNCTION public.review_manual_premium_payment(
    UUID, UUID, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.review_manual_premium_payment(
    UUID, UUID, TEXT, TEXT
) TO service_role;
