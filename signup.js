/* =========================================
   STUDYMIND AI — SIGN UP
========================================= */

const signupForm = document.getElementById("signupForm");
const authMessage = document.getElementById("authMessage");


if (signupForm) {

    signupForm.addEventListener("submit", async function (event) {

        event.preventDefault();


        const name =
            document.getElementById("name").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;


        /* ================================
           VALIDATION
        ================================= */

        if (!name) {

            authMessage.textContent =
                "Please enter your name.";

            authMessage.className =
                "auth-message error";

            return;
        }


        if (password !== confirmPassword) {

            authMessage.textContent =
                "Passwords do not match.";

            authMessage.className =
                "auth-message error";

            return;
        }


        if (password.length < 8) {

            authMessage.textContent =
                "Password must be at least 8 characters.";

            authMessage.className =
                "auth-message error";

            return;
        }


        /* ================================
           CREATING ACCOUNT
        ================================= */

        authMessage.textContent =
            "Creating your account...";

        authMessage.className =
            "auth-message";


        const { data, error } =
            await supabaseClient.auth.signUp({

                email: email,

                password: password,

                options: {

                    data: {
                        name: name
                    }

                }

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
            "Account created successfully!";

        authMessage.className =
            "auth-message success";


        /*
         * Supabase may require email confirmation.
         * If confirmation is enabled, the user
         * should log in after confirming their email.
         */

        if (data && data.user && !data.session) {

            authMessage.textContent =
                "Account created! Please check your email to confirm your account, then log in.";

            authMessage.className =
                "auth-message success";

            setTimeout(() => {

                window.location.href =
                    "login.html";

            }, 2500);

            return;
        }


        /*
         * If email confirmation is disabled,
         * send the user directly to the home page.
         */

        setTimeout(() => {

            window.location.href =
                "home.html";

        }, 1000);

    });

}
