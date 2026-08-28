/* =========================================
STUDYMIND AI — LOGIN
========================================= */

const loginForm =
document.getElementById("loginForm");

const authMessage =
document.getElementById("authMessage");

if (loginForm) {


loginForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const email =
            document
                .getElementById("email")
                .value
                .trim();


        const password =
            document
                .getElementById("password")
                .value;


        /* ================================
           VALIDATION
        ================================= */

        if (!email || !password) {

            if (authMessage) {

                authMessage.textContent =
                    "Please enter your email and password.";

                authMessage.className =
                    "auth-message error";

            }

            return;

        }


        /* ================================
           LOADING
        ================================= */

        if (authMessage) {

            authMessage.textContent =
                "Logging in...";

            authMessage.className =
                "auth-message";

        }


        try {

            /* ================================
               SUPABASE LOGIN
            ================================= */

            const {
                data,
                error
            } =
                await supabaseClient
                    .auth
                    .signInWithPassword({

                        email:
                            email,

                        password:
                            password

                    });


            /* ================================
               LOGIN ERROR
            ================================= */

            if (error) {

                console.error(
                    "Login error:",
                    error
                );


                if (authMessage) {

                    authMessage.textContent =
                        error.message;

                    authMessage.className =
                        "auth-message error";

                }

                return;

            }


            /* ================================
               VERIFY USER
            ================================= */

            if (
                !data ||
                !data.user
            ) {

                if (authMessage) {

                    authMessage.textContent =
                        "Login failed. Please try again.";

                    authMessage.className =
                        "auth-message error";

                }

                return;

            }


            /* ================================
               SAVE LOGIN STATE
            ================================= */

            localStorage.setItem(
                "studyMindLoggedIn",
                "true"
            );

            localStorage.setItem(
                "isLoggedIn",
                "true"
            );

            localStorage.setItem(
                "currentUser",
                JSON.stringify({

                    id:
                        data.user.id,

                    email:
                        data.user.email

                })
            );


            /* ================================
               SUCCESS
            ================================= */

            if (authMessage) {

                authMessage.textContent =
                    "Login successful!";

                authMessage.className =
                    "auth-message success";

            }


            /*
               Correct StudyMind flow:

               LOGIN
                 ↓
               HOME
                 ↓
               CREATE STUDY PLAN
                 ↓
               DASHBOARD
            */

            setTimeout(
                () => {

                    window.location.href =
                        "home.html";

                },
                500
            );


        } catch (error) {

            console.error(
                "Unexpected login error:",
                error
            );


            if (authMessage) {

                authMessage.textContent =
                    "Something went wrong. Please try again.";

                authMessage.className =
                    "auth-message error";

            }

        }

    }
);


}
