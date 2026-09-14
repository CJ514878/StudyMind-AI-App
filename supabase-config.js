"use strict";

/* =========================================================
   STUDYMIND AI — SHARED SUPABASE CONFIGURATION
========================================================= */

const STUDYMIND_SUPABASE_URL =
    "https://bicnrbqqvucgpbwudmit.supabase.co";

const STUDYMIND_SUPABASE_KEY =
    "sb_publishable_70y0MPrj30-FimUSQK_HuA_Ng1a1qcB";

window.studyMindSupabase =
    window.supabase?.createClient
        ? window.supabase.createClient(
            STUDYMIND_SUPABASE_URL,
            STUDYMIND_SUPABASE_KEY
        )
        : null;

console.log(
    "StudyMind AI: Supabase client initialized."
);
