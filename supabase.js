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

if (typeof window.supabase === "undefined") {


console.error(
    "StudyMind AI: Supabase library failed to load."
);


} else {


/*
   Create the client directly on window.

   This is important because dashboard.js,
   knowledge-check.js and game-mode.js
   all need access to the same client.
*/

window.supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );

console.log(
    "StudyMind AI: Supabase client initialized."
);


}
