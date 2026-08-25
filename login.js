
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


    const { data, error } =
        await supabaseClient.auth.signInWithPassword({

            email: email,
            password: password

        });


    /* ================================
       ERROR
    ================================= */

    if (error) {

        console.error(error);

        authMessage.textContent =
            error.message;

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


    setTimeout(() => {

        window.location.href =
            "dashboard.html";

    }, 800);

});

