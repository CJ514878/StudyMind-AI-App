/* =========================================================
   STUDYMIND AI — FEEDBACK
========================================================= */

"use strict";


/* =========================================================
   CONFIG
========================================================= */

const FEEDBACK_EMAIL =
    "studymindaiofficial@gmail.com";


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeFeedback
);


function initializeFeedback() {

    applyTheme();

    loadUser();

    setupRating();

    setupForm();

    setupTheme();

    setupLogout();

}


/* =========================================================
   RATING
========================================================= */

let selectedRating = 0;


function setupRating() {

    const buttons =
        document.querySelectorAll(
            ".rating button"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    selectedRating =
                        Number(
                            button.dataset.rating
                        );


                    buttons.forEach(
                        item => {

                            const rating =
                                Number(
                                    item.dataset.rating
                                );

                            item.classList.toggle(
                                "selected",
                                rating <=
                                selectedRating
                            );

                        }
                    );


                    const text =
                        document.getElementById(
                            "ratingText"
                        );


                    const labels = {

                        1:
                            "We're sorry to hear that.",

                        2:
                            "We'll work on improving.",

                        3:
                            "Thanks for the feedback!",

                        4:
                            "Great to hear! ⭐",

                        5:
                            "Awesome! We're glad you love it! 🎉"

                    };


                    if (text) {

                        text.textContent =
                            labels[
                                selectedRating
                            ];

                    }

                }
            );

        }
    );

}


/* =========================================================
   FORM
========================================================= */

function setupForm() {

    const form =
        document.getElementById(
            "feedbackForm"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const category =
                document.getElementById(
                    "category"
                )?.value || "General Feedback";


            const liked =
                document.getElementById(
                    "liked"
                )?.value.trim() || "Not provided";


            const improve =
                document.getElementById(
                    "improve"
                )?.value.trim() || "Not provided";


            const additional =
                document.getElementById(
                    "additional"
                )?.value.trim() || "Not provided";


            const username =
                localStorage.getItem(
                    "studyMindUsername"
                ) || "Student";


            if (!selectedRating) {

                const status =
                    document.getElementById(
                        "formStatus"
                    );

                if (status) {

                    status.textContent =
                        "Please select a rating first.";

                    status.style.color =
                        "#dc2626";

                }

                return;

            }


            /* ------------------------------------------------
               BUILD EMAIL
            ------------------------------------------------ */

            const subject =
                encodeURIComponent(
                    `StudyMind AI Feedback — ${category}`
                );


            const body =
                encodeURIComponent(

`Hello StudyMind AI Team,

I would like to share some feedback about StudyMind AI.

Student: ${username}

Rating: ${selectedRating}/5

Category:
${category}

What I like:
${liked}

What could be improved:
${improve}

Additional comments:
${additional}

Thank you.`

                );


            /*
             * mailto opens the student's
             * default email application.
             */

            window.location.href =
                `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;


            const status =
                document.getElementById(
                    "formStatus"
                );


            if (status) {

                status.textContent =
                    "Opening your email app...";

                status.style.color =
                    "var(--green)";

            }

        }
    );

}


/* =========================================================
   THEME
========================================================= */

function setupTheme() {

    document
        .getElementById(
            "themeButton"
        )
        ?.addEventListener(
            "click",
            () => {

                document.body.classList.toggle(
                    "dark"
                );


                localStorage.setItem(
                    "studyMindTheme",
                    document.body.classList.contains(
                        "dark"
                    )
                        ? "dark"
                        : "light"
                );

            }
        );

}


function applyTheme() {

    if (
        localStorage.getItem(
            "studyMindTheme"
        ) === "dark"
    ) {

        document.body.classList.add(
            "dark"
        );

    }

}


/* =========================================================
   USER
========================================================= */

async function loadUser() {

    let name =
        localStorage.getItem(
            "studyMindUsername"
        );


    try {

        if (
            window.supabaseClient?.auth
        ) {

            const {
                data
            } =
                await window.supabaseClient.auth.getUser();


            const user =
                data?.user;


            if (user) {

                name =
                    user.user_metadata?.full_name ||
                    user.user_metadata?.name ||
                    user.user_metadata?.username ||
                    user.email?.split("@")[0] ||
                    name ||
                    "Student";

            }

        }

    } catch (error) {

        console.warn(
            "Could not load user:",
            error
        );

    }


    name =
        name || "Student";


    localStorage.setItem(
        "studyMindUsername",
        name
    );


    const username =
        document.getElementById(
            "usernameDisplay"
        );


    const avatar =
        document.getElementById(
            "userAvatar"
        );


    if (username) {

        username.textContent =
            name;

    }


    if (avatar) {

        avatar.textContent =
            name
                .charAt(0)
                .toUpperCase();

    }

}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    document
        .getElementById(
            "logoutButton"
        )
        ?.addEventListener(
            "click",
            async () => {

                try {

                    if (
                        window.supabaseClient?.auth
                    ) {

                        await window.supabaseClient
                            .auth
                            .signOut();

                    }

                } catch (error) {

                    console.warn(
                        "Logout error:",
                        error
                    );

                }


                window.location.href =
                    "home.html";

            }
        );

}
