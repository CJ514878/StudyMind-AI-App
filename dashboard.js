/* =========================================================
   KNOWLEDGE CHECK — DEDICATED PAGE

   Dashboard does NOT generate or score questions here.

   Flow:

   Dashboard
      ↓
   Start Knowledge Check
      ↓
   knowledge-check.html
      ↓
   Premium selects:
   5 / 10 / 20 / 30 / 40 / 50 / 60
      ↓
   Questions + score
      ↓
   Dashboard
========================================================= */

const KNOWLEDGE_CHECK_USAGE_KEY =
    "studyMindKnowledgeCheckUsageCount";

const KNOWLEDGE_CHECK_LIMIT = 5;

const KNOWLEDGE_CHECK_TOPIC_KEY =
    "studyMindKnowledgeCheckTopic";


/* =========================================================
   OPEN DEDICATED KNOWLEDGE CHECK PAGE
========================================================= */

window.openKnowledgeCheckPage = function (topic) {

    console.log(
        "Opening Knowledge Check:",
        topic
    );

    if (
        !topic ||
        !topic.name
    ) {

        alert(
            "Please select a topic before starting the Knowledge Check."
        );

        return;

    }


    /*
       IMPORTANT:

       Do NOT check the Free/Premium question limit here.

       Do NOT generate questions here.

       The dedicated knowledge-check.html page is responsible
       for Premium verification and question-count selection.
    */

    const topicData = {

        name:
            cleanText(
                topic.name
            ),

        subject:
            cleanText(
                topic.subject ||
                topic.subjectName ||
                "Senior Secondary"
            ),

        description:
            cleanText(
                topic.description ||
                `Study ${topic.name} and complete the knowledge check.`
            ),

        key:
            getTopicKey(topic),

        checkId:
            `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}`

    };


    try {

        localStorage.setItem(

            KNOWLEDGE_CHECK_TOPIC_KEY,

            JSON.stringify(
                topicData
            )

        );

    }

    catch (error) {

        console.error(
            "Could not save Knowledge Check topic:",
            error
        );

        alert(
            "Unable to start the Knowledge Check. Please try again."
        );

        return;

    }


    /*
       DIRECT NAVIGATION
    */

    window.location.href =
        "knowledge-check.html";

};


/* =========================================================
   KNOWLEDGE CHECK LAUNCH PROMPT
========================================================= */

function renderGenerateQuestionsPrompt(topic) {

    const container =
        getQuestionsContainer();


    if (
        !container ||
        !topic
    ) {

        return;

    }


    container.innerHTML = `

        <div
            class="generate-questions-prompt"
            style="
                padding:20px;
                border-radius:14px;
                margin-top:15px;
                border:1px solid rgba(127,127,127,.2);
            "
        >

            <div
                style="
                    font-size:34px;
                    margin-bottom:10px;
                "
            >
                🧠
            </div>


            <h3>
                Ready to test yourself?
            </h3>


            <p>

                Your Knowledge Check will open on
                the next page, where Premium users
                can choose 5, 10, 20, 30, 40, 50
                or 60 questions.

            </p>


            <button
                type="button"
                id="generateTopicQuestionsButton"
                class="primary-button full-button"
            >

                🧠 Start Knowledge Check

            </button>


            <div
                style="
                    margin-top:10px;
                    text-align:center;
                    opacity:.7;
                    font-size:.9rem;
                "
            >

                Premium: 5–60 questions
                • 60% required to pass

            </div>

        </div>

    `;


    const button =
        $("generateTopicQuestionsButton");


    if (
        button
    ) {

        button.addEventListener(

            "click",

            () => {

                window.openKnowledgeCheckPage(
                    topic
                );

            }

        );

    }


    if (
        window.MathJax &&
        typeof window.MathJax.typesetPromise ===
            "function"
    ) {

        window.MathJax
            .typesetPromise([
                container
            ])
            .catch(
                () => {}
            );

    }

}


/* =========================================================
   CALENDAR
   STATES:

   🔵 Study day
   🔴 Exam day
   🟣 Rest/break day
   🟢 Completed day
   ⚪ Post-exam day
========================================================= */

const COMPLETED_SUBJECTS_KEY =
    "completedSubjects";

const COMPLETED_DAYS_KEY =
    "studyMindCompletedDays";


function readCompletedSubjects() {

    const value =
        readJSON(
            COMPLETED_SUBJECTS_KEY,
            []
        );


    return Array.isArray(value)

        ? value.map(
            value =>
                cleanText(value)
        )

        : [];

}


function readCompletedDays() {

    const value =
        readJSON(
            COMPLETED_DAYS_KEY,
            {}
        );


    return value &&
        typeof value === "object" &&
        !Array.isArray(value)

        ? value

        : {};

}


function saveCompletedDays(
    days
) {

    writeJSON(
        COMPLETED_DAYS_KEY,
        days
    );

}


/* =========================================================
   ALL SUBJECTS COMPLETED
========================================================= */

function areAllSubjectsCompleted() {

    /*
       First check actual subject checkboxes
       rendered inside the dashboard subject list.

       The current-topic checkbox is NOT included.
    */

    const subjectCheckboxes =
        document.querySelectorAll(
            '#subjectList input[type="checkbox"], input.subject-checkbox, input[data-subject-checkbox]'
        );


    if (
        subjectCheckboxes.length > 0
    ) {

        return Array.from(
            subjectCheckboxes
        )
            .every(
                checkbox =>
                    checkbox.checked
            );

    }


    /*
       Fallback to the existing persisted
       completedSubjects state.
    */

    const subjects =
        normalizedSubjects.length

            ? normalizedSubjects

            : (
                Array.isArray(
                    studyPlan?.subjects
                )

                    ? studyPlan.subjects

                    : []
            );


    if (
        !subjects.length
    ) {

        return false;

    }


    const completedSubjects =
        readCompletedSubjects();


    const completedSet =
        new Set(

            completedSubjects.map(

                subject =>
                    cleanText(
                        subject
                    )
                        .toLowerCase()

            )

        );


    return subjects.every(

        subject =>

            completedSet.has(

                cleanText(

                    subject?.name ??
                    subject

                )
                    .toLowerCase()

            )

    );

}


/* =========================================================
   MARK TODAY COMPLETE
========================================================= */

function markTodayCompletedIfAllSubjectsAreTicked() {

    if (
        !areAllSubjectsCompleted()
    ) {

        return false;

    }


    const today =
        formatDate(
            new Date()
        );


    const completedDays =
        readCompletedDays();


    completedDays[today] =
        true;


    saveCompletedDays(
        completedDays
    );


    return true;

}


/* =========================================================
   POST-EXAM
========================================================= */

function isPostExamDay(
    date
) {

    const exam =
        studyPlan?.examDate;


    if (
        !exam
    ) {

        return false;

    }


    return (

        formatDate(date) >

        String(
            exam
        )
            .slice(
                0,
                10
            )

    );

}


/* =========================================================
   CALENDAR RENDERING
========================================================= */

function renderCalendar() {

    const monthElement =
        $("calendarMonth");


    const daysContainer =
        $("calendarDays");


    if (
        !monthElement ||
        !daysContainer
    ) {

        return;

    }


    /*
       If every subject is checked,
       today's calendar date becomes completed.
    */

    markTodayCompletedIfAllSubjectsAreTicked();


    const year =
        currentCalendarDate.getFullYear();


    const month =
        currentCalendarDate.getMonth();


    const monthName =
        currentCalendarDate.toLocaleString(

            "en-US",

            {
                month:
                    "long"
            }

        );


    monthElement.textContent =
        `${monthName} ${year}`;


    daysContainer.innerHTML =
        "";


    /*
       Force post-exam cells to remain neutral
       even if older CSS contains purple
       break-day rules.
    */

    if (
        !document.getElementById(
            "studymind-calendar-state-fixes"
        )
    ) {

        const style =
            document.createElement(
                "style"
            );


        style.id =
            "studymind-calendar-state-fixes";


        style.textContent = `

            #calendarDays
            .calendar-day.post-exam-day {

                background:
                    transparent !important;

                box-shadow:
                    none !important;

                border-color:
                    rgba(
                        127,
                        127,
                        127,
                        .12
                    ) !important;

                color:
                    inherit !important;

            }


            #calendarDays
            .calendar-day.exam-day {

                background:
                    #ef4444 !important;

                border-color:
                    #ef4444 !important;

                color:
                    #ffffff !important;

                box-shadow:
                    0 0 14px
                    rgba(
                        239,
                        68,
                        68,
                        .35
                    ) !important;

            }


            #calendarDays
            .calendar-day.completed-day {

                background:
                    rgba(
                        34,
                        197,
                        94,
                        .18
                    ) !important;

                border-color:
                    rgba(
                        34,
                        197,
                        94,
                        .95
                    ) !important;

                box-shadow:
                    0 0 8px
                    rgba(
                        34,
                        197,
                        94,
                        .75
                    ),
                    0 0 18px
                    rgba(
                        34,
                        197,
                        94,
                        .5
                    ),
                    inset 0 0 14px
                    rgba(
                        34,
                        197,
                        94,
                        .18
                    ) !important;

            }

        `;


        document.head.appendChild(
            style
        );

    }


    const firstDay =
        new Date(
            year,
            month,
            1
        )
            .getDay();


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        )
            .getDate();


    const todayString =
        formatDate(
            new Date()
        );


    for (
        let i = 0;
        i < firstDay;
        i++
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "calendar-day empty";


        daysContainer.appendChild(
            empty
        );

    }


    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const cell =
            document.createElement(
                "div"
            );


        cell.className =
            "calendar-day";


        const date =
            new Date(
                year,
                month,
                day
            );


        const dateString =
            formatDate(
                date
            );


        const isToday =
            dateString ===
            todayString;


        if (
            isToday
        ) {

            cell.classList.add(
                "today"
            );

        }


        const examDate =
            studyPlan?.examDate

                ? String(
                    studyPlan.examDate
                )
                    .slice(
                        0,
                        10
                    )

                : "";


        const examDay =
            !!examDate &&
            dateString ===
            examDate;


        const postExam =
            !!examDate &&
            dateString >
            examDate;


        const completedDay =
            isCompletedCalendarDay(
                date
            );


        /*
           IMPORTANT PRIORITY:

           1. 🔴 EXAM
           2. ⚪ POST-EXAM
           3. 🟢 COMPLETED
           4. 🟣 REST
           5. 🔵 STUDY

           This means:

           • Exam is ALWAYS red.
           • Days after exam are ALWAYS neutral.
           • Purple cannot leak into post-exam dates.
           • Completed study days glow green.
        */

        const breakDay =
            !postExam &&
            !examDay &&
            isScheduledBreakDay(
                date
            );


        const studyDay =
            !postExam &&
            !examDay &&
            !breakDay &&
            !!studyPlan?.studyStartDate &&
            dateString >=
                String(
                    studyPlan.studyStartDate
                )
                    .slice(
                        0,
                        10
                    );


        if (
            examDay
        ) {

            cell.classList.add(
                "exam-day"
            );


            cell.style.background =
                "";


            cell.style.boxShadow =
                "";


            cell.style.borderColor =
                "";

        }

        else if (
            postExam
        ) {

            cell.classList.add(
                "post-exam-day"
            );


            cell.style.background =
                "transparent";


            cell.style.boxShadow =
                "none";


            cell.style.borderColor =
                "rgba(127,127,127,.12)";


            cell.style.color =
                "inherit";

        }

        else if (
            completedDay
        ) {

            cell.classList.add(
                "completed-day"
            );


            cell.style.boxShadow =

                "0 0 8px rgba(34,197,94,.75), " +
                "0 0 18px rgba(34,197,94,.5), " +
                "inset 0 0 14px rgba(34,197,94,.18)";


            cell.style.borderColor =
                "rgba(34,197,94,.95)";


            cell.style.background =
                "rgba(34,197,94,.18)";

        }

        else if (
            breakDay
        ) {

            cell.classList.add(
                "break-day"
            );

        }

        else if (
            studyDay
        ) {

            cell.classList.add(
                "study-day"
            );

        }


        cell.innerHTML = `

            <span
                class="day-number"
            >
                ${day}
            </span>


            ${
                completedDay &&
                !examDay &&
                !postExam

                    ? `

                        <span
                            class="break-label"
                        >
                            ✓ DONE
                        </span>

                    `

                    : ""

            }


            ${
                examDay

                    ? `

                        <span
                            class="break-label"
                        >
                            EXAM
                        </span>

                    `

                    : ""

            }

        `;


        daysContainer.appendChild(
            cell
        );

    }

}
