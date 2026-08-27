/* =========================================
STUDYMIND AI — LOGIN
========================================= */

const loginForm = document.getElementById("loginForm");
const authMessage = document.getElementById("authMessage");

loginForm.addEventListener("submit", async function (event) {

event.preventDefault();

const email =
    document.getElementById("email").value.trim();

const password =
    document.getElementById("password").value;


/* ================================
   VALIDATION
================================= */

if (!email || !password) {

    authMessage.textContent =
        "Please enter your email and password.";

    authMessage.className =
        "auth-message error";

    return;
}


/* ================================
   LOGIN
================================= */

authMessage.textContent =
    "Logging in...";

authMessage.className =
    "auth-message";


try {

    const { data, error } =
        await supabaseClient.auth.signInWithPassword({

            email: email,
            password: password

        });


    /* ================================
       ERROR
    ================================= */

    if (error) {

        console.error(
            "Login error:",
            error
        );

        authMessage.textContent =
            error.message;

        authMessage.className =
            "auth-message error";

        return;
    }


    if (!data || !data.user) {

        authMessage.textContent =
            "Login failed. Please try again.";

        authMessage.className =
            "auth-message error";

        return;
    }


    /* ================================
       SUCCESS
    ================================= */

    authMessage.textContent =
        "Login successful!";

    authMessage.className =
        "auth-message success";


    /*
       IMPORTANT:

       Login should NOT send the student
       directly to the dashboard.

       The correct StudyMind flow is:

       LOGIN
          ↓
       HOME
          ↓
       CREATE STUDY PLAN
          ↓
       DASHBOARD
    */

    setTimeout(() => {

        window.location.href =
            "home.html";

    }, 500);

}

catch (error) {

    console.error(
        "Unexpected login error:",
        error
    );

    authMessage.textContent =
        "Something went wrong. Please try again.";

    authMessage.className =
        "auth-message error";

}


});
