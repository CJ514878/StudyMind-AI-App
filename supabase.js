/* =========================================
   STUDYMIND AI — SUPABASE CONFIGURATION
========================================= */

"use strict";


/* =========================================
   SUPABASE CONNECTION
========================================= */

const SUPABASE_URL =
    "https://bicnrbqqvucgpbwudmit.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_70y0MPrj30-FimUSQK_HuA_Ng1a1qcB";


/* =========================================
   CREATE SHARED SUPABASE CLIENT
========================================= */

(function initializeStudyMindSupabase() {

    /* -----------------------------------------
       Make sure Supabase library loaded
    ----------------------------------------- */

    if (
        typeof window.supabase === "undefined" ||
        typeof window.supabase.createClient !== "function"
    ) {

        console.error(
            "StudyMind AI: Supabase library failed to load."
        );

        return;
    }


    /* -----------------------------------------
       Prevent duplicate client creation
    ----------------------------------------- */

    if (window.supabaseClient) {

        console.log(
            "StudyMind AI: Existing Supabase client detected."
        );

    } else {

        window.supabaseClient =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_PUBLISHABLE_KEY
            );

        console.log(
            "StudyMind AI: Supabase client initialized."
        );
    }


    /* =========================================
       SHARED CLIENT ALIASES
       
       All StudyMind pages can use the same
       Supabase client.
    ========================================= */

    window.studyMindSupabase =
        window.supabaseClient;

    window.gameSupabase =
        window.supabaseClient;


    /* =========================================
       CONNECTION CONFIRMATION
    ========================================= */

    console.log(
        "StudyMind AI: Shared Supabase client available."
    );

    console.log(
        "studyMindSupabase =",
        window.studyMindSupabase
    );

    console.log(
        "gameSupabase =",
        window.gameSupabase
    );

})();

