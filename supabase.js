/* =========================================
STUDYMIND AI — SUPABASE CONFIGURATION
========================================= */

const SUPABASE_URL =
"https://bicnrbqqvucgpbwudmit.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
"sb_publishable_70y0MPrj30-FimUSQK_HuA_Ng1a1qcB";

/* =========================================
CREATE SUPABASE CLIENT
========================================= */

if (
typeof window.supabase === "undefined"
) {
console.error(
"StudyMind AI: Supabase library failed to load."
);
} else {


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


/*
   Make the client available globally.

   This allows game-mode.js and the other
   StudyMind pages to use the same client.
*/

window.supabaseClient =
    supabaseClient;


}
