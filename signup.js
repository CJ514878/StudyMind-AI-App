"use strict";

/* =========================================
   STUDYMIND AI — SIGN UP
========================================= */

const signupForm =
    document.getElementById("signupForm");

const authMessage =
    document.getElementById("authMessage");

if (signupForm) {

    signupForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const name =
                document
                    .getElementById("name")
                    ?.value
                    .trim() || "";

            const email =
                document
                    .getElementById("email")
                    ?.value
                    .trim() || "";

            const password =
                document
                    .getElementById("password")
                    ?.value || "";

            const confirmPassword =
                document
                    .getElementById(
                        "confirmPassword"
                    )
                    ?.value || "";

            /*
             * Use the existing name field as the
             * student's chosen username.
             */
            const username = name.trim();

            if (!username) {

                showMessage(
                    "Please choose a username.",
                    true
                );

                return;
            }

            if (
                username.length < 3
            ) {

                showMessage(
                    "Your username must be at least 3 characters.",
                    true
                );

                return;
            }

            if (
                username.length > 30
            ) {

                showMessage(
                    "Your username must be 30 characters or fewer.",
                    true
                );

                return;
            }

            if (!email) {

                showMessage(
                    "Please enter your email.",
                    true
                );

                return;
            }

            if (
                password !==
                confirmPassword
            ) {

                showMessage(
                    "Passwords do not match.",
                    true
                );

                return;
            }

            if (
                password.length < 8
            ) {

                showMessage(
                    "Password must be at least 8 characters.",
                    true
                );

                return;
            }

            showMessage(
                "Creating your account...",
                false
            );

            try {

                const client =
                    window.supabaseClient ||
                    window.studyMindSupabase;

                if (!client) {
                    throw new Error(
                        "Supabase is not available."
                    );
                }

                const {
                    data,
                    error
                } =
                    await client.auth.signUp({
                        email,
                        password,
                        options: {
                            data: {

                                /*
                                 * Canonical username.
                                 */
                                username,

                                /*
                                 * Keep name for
                                 * backward compatibility.
                                 */
                                name: username,

                                display_name:
                                    username
                            }
                        }
                    });

                if (error) {
                    throw error;
                }

                /*
                 * Store locally immediately.
                 */
                localStorage.setItem(
                    "studyMindUsername",
                    username
                );

                /*
                 * Absolutely no initial XP,
                 * streak, score or study time.
                 */
                localStorage.setItem(
                    "studyMindXP",
                    "0"
                );

                localStorage.setItem(
                    "studyMindTotalXP",
                    "0"
                );

                localStorage.setItem(
                    "studyMindStreak",
                    "0"
                );

                localStorage.setItem(
                    "studyMindStudyScore",
                    "0"
                );

                localStorage.removeItem(
                    "studyMindStreakActivity"
                );

                localStorage.removeItem(
                    "studyMindCompletedTopics"
                );

                localStorage.removeItem(
                    "studyMindStudySessions"
                );

                localStorage.removeItem(
                    "studyMindDailyStudyTime"
                );

                showMessage(
                    data?.session
                        ? "Account created successfully!"
                        : "Account created! Check your email to confirm your account.",
                    false
                );

                setTimeout(
                    () => {
                        window.location.href =
                            "home.html";
                    },
                    1200
                );

            } catch (error) {

                console.error(
                    "StudyMind signup error:",
                    error
                );

                showMessage(
                    error?.message ||
                    "Unable to create your account.",
                    true
                );
            }
        }
    );
}

function showMessage(
    message,
    isError
) {

    if (!authMessage) {
        return;
    }

    authMessage.textContent =
        message;

    authMessage.style.color =
        isError
            ? ""
            : "";
}
