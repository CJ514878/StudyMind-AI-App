/* =========================================
   STUDYMIND AI — SUPABASE CONFIGURATION
========================================= */

const SUPABASE_URL =
    "https://bicnrbqqvucgpbwudmit.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_70y0MPrj30-FimUSQK_HuA_Ng1a1qcB";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );
