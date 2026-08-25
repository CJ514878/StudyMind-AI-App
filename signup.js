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
           CREATE ACCOUNT
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


        setTimeout(() => {

            window.location.href =
                "home.html";

        }, 1000);

    });

}
